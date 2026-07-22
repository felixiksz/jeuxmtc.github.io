/* 48 — PWA / bouton hors connexion — linefix2 */
(function(){
  "use strict";

  const READY_KEY = "mtc_offline_ready_v1";
  const SW_URL = "sw.js";
  let registrationPromise = null;
  let modal = null;
  let statusEl = null;
  let arrangingBottomLine = false;
  let bottomLineObserver = null;

  function byId(id){ return document.getElementById(id); }
  function storageGet(key){ try{ return localStorage.getItem(key) || ""; }catch(error){ return ""; } }
  function storageSet(key, value){ try{ localStorage.setItem(key, value || ""); }catch(error){} }
  function isReady(){ return Boolean(storageGet(READY_KEY)); }

  function setMessage(text){
    const message = byId("message");
    if(message) message.textContent = text;
  }

  function updateButton(){
    const button = byId("mtcOfflineButton");
    if(!button) return;
    const ready = isReady();
    button.textContent = "✈︎";
    button.classList.toggle("is-ready", ready);
    button.title = "Préparer le jeu pour réviser hors connexion";
    button.setAttribute("aria-label", button.title);
  }

  function bindOfflineButton(button){
    if(!button || button.dataset.mtcOfflineBound === "1") return;
    button.dataset.mtcOfflineBound = "1";
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      openModal();
    });
  }

  function ensureModal(){
    if(modal) return modal;
    modal = document.createElement("div");
    modal.className = "mtc-offline-modal";
    modal.id = "mtcOfflineModal";
    modal.innerHTML = `
      <div class="mtc-offline-card" role="dialog" aria-modal="true" aria-labelledby="mtcOfflineTitle">
        <h2 id="mtcOfflineTitle">Jouer hors connexion</h2>
        <p>À faire une seule fois, avec internet, depuis le lien jeu : <a href="https://felixiksz.github.io/jeuxmtc.github.io/" target="_blank" rel="noopener">https://felixiksz.github.io/jeuxmtc.github.io/</a></p>
        <ol class="mtc-offline-steps">
          <li>Ouvre le jeu depuis son lien web.</li>
          <li>Choisis ce que tu veux garder sur cet appareil.</li>
          <li>Ensuite, rouvre le même lien : tu peux jouer sans internet et sans distractions.</li>
        </ol>
        <p class="mtc-offline-psst">*psst : ajoute la page sur ton écran d’accueil pour des révisions quotidiennes</p>
        <div class="mtc-offline-actions">
          <button type="button" data-offline-core>Jeu seul</button>
          <button type="button" data-offline-audio>Jeu + audios</button>
          <button type="button" class="secondary" data-offline-close>Fermer</button>
        </div>
        <div class="mtc-offline-status" id="mtcOfflineStatus"></div>
      </div>
    `;
    document.body.appendChild(modal);
    statusEl = byId("mtcOfflineStatus");
    modal.querySelector("[data-offline-close]").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if(event.target === modal) closeModal(); });
    modal.querySelector("[data-offline-core]").addEventListener("click", () => precacheOffline(false));
    modal.querySelector("[data-offline-audio]").addEventListener("click", () => precacheOffline(true));
    return modal;
  }

  function openModal(){
    ensureModal();
    modal.classList.add("visible");
    if(statusEl){
      statusEl.textContent = isReady()
        ? "Ce téléphone est déjà préparé. Tu peux relancer ici après une mise à jour du jeu."
        : "Choisis “Jeu seul” pour une version légère, ou “Jeu + audios” pour garder aussi les prononciations.";
    }
  }

  function closeModal(){
    if(modal) modal.classList.remove("visible");
  }

  function setBusy(isBusy){
    const button = byId("mtcOfflineButton");
    if(button){
      button.classList.toggle("is-loading", Boolean(isBusy));
      button.disabled = Boolean(isBusy);
      if(isBusy) button.textContent = "…";
      else updateButton();
    }
    if(modal){
      modal.querySelectorAll("button").forEach(btn => { if(!btn.matches("[data-offline-close]")) btn.disabled = Boolean(isBusy); });
    }
  }

  function registerServiceWorker(){
    if(registrationPromise) return registrationPromise;
    if(!("serviceWorker" in navigator)){
      registrationPromise = Promise.reject(new Error("Ce navigateur ne permet pas de préparer le jeu hors connexion."));
      return registrationPromise;
    }
    if(location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1"){
      registrationPromise = Promise.reject(new Error("Ouvre d’abord le jeu depuis son lien web avec internet : https://felixiksz.github.io/jeuxmtc.github.io/ puis clique sur ✈︎."));
      return registrationPromise;
    }
    // updateViaCache:"none" est essentiel : par défaut, le navigateur peut
    // vérifier les mises à jour de sw.js en utilisant son propre cache HTTP,
    // ce qui renvoie une version tout aussi périmée et rend .update() inutile.
    registrationPromise = navigator.serviceWorker.register(SW_URL, {updateViaCache: "none"}).then(registration => {
      // Force une vérification réseau immédiate d'une nouvelle version, plutôt
      // que d'attendre le cycle de vérification par défaut du navigateur (qui
      // peut laisser une ancienne version en cache bien plus longtemps).
      try{ registration.update(); }catch(error){}
      return navigator.serviceWorker.ready;
    });
    return registrationPromise;
  }

  function watchForServiceWorkerUpdates(){
    if(!("serviceWorker" in navigator)) return;
    // Si une mise à jour du service worker prend le contrôle de cette page
    // pendant qu'elle est ouverte, les scripts déjà chargés en mémoire restent
    // les anciens. Un unique rechargement automatique suffit à passer sur la
    // nouvelle version — sans jamais toucher aux notes/données personnelles,
    // qui sont dans localStorage, pas dans le cache du service worker.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if(reloaded || !hadController) return;
      reloaded = true;
      window.location.reload();
    });
  }

  function sendMessageToWorker(registration, payload){
    return new Promise((resolve, reject) => {
      const worker = registration.active || navigator.serviceWorker.controller || registration.waiting || registration.installing;
      if(!worker){ reject(new Error("Le mode hors connexion n’est pas encore prêt. Réessaie après avoir rechargé la page.")); return; }
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error("Le téléchargement a été interrompu ou a pris trop longtemps. Réessaie avec une connexion plus stable.")), payload.includeAudio ? 180000 : 60000);
      channel.port1.onmessage = event => {
        clearTimeout(timer);
        resolve(event.data || {});
      };
      worker.postMessage(payload, [channel.port2]);
    });
  }

  async function precacheOffline(includeAudio){
    if(statusEl) statusEl.textContent = includeAudio ? "Téléchargement du jeu et des audios sur cet appareil…" : "Téléchargement du jeu sur cet appareil…";
    setMessage(includeAudio ? "Préparation du jeu hors-connexion avec audios…" : "Préparation du jeu hors-connexion…");
    setBusy(true);
    try{
      const registration = await registerServiceWorker();
      const result = await sendMessageToWorker(registration, {type:"PRECACHE_OFFLINE", includeAudio:Boolean(includeAudio)});
      if(!result.ok) throw new Error(result.message || "Préchargement impossible.");
      storageSet(READY_KEY, includeAudio ? "audio" : "core");
      const coreInfo = result.core ? `${result.core.ok} fichiers essentiels` : "fichiers essentiels";
      const audioInfo = includeAudio && result.audio ? ` + ${result.audio.ok} audios` : "";
      const failed = (result.core && result.core.failedCount || 0) + (result.audio && result.audio.failedCount || 0);
      const suffix = failed ? ` (${failed} fichier(s) non récupéré(s), le reste est prêt)` : "";
      const text = `Jeu prêt hors-connexion sur cet appareil : ${coreInfo}${audioInfo}${suffix}.`;
      if(statusEl) statusEl.textContent = text;
      setMessage("Jeu prêt sans internet.");
      updateButton();
    }catch(error){
      const text = String(error && error.message || error);
      if(statusEl) statusEl.textContent = text;
      setMessage("Préparation hors connexion impossible pour le moment.");
    }finally{
      setBusy(false);
    }
  }


  function ensureBottomMetaLine(){
    if(!document.body || arrangingBottomLine) return null;
    arrangingBottomLine = true;
    try{
      let line = byId("mtcBottomMetaLine");
      if(!line){
        line = document.createElement("div");
        line.id = "mtcBottomMetaLine";
        line.setAttribute("aria-label", "Ligne discrète : hors connexion, historique et nouveautés");
        document.body.appendChild(line);
      }
      line.classList.add("mtc-bottom-meta-line");
      const offline = byId("mtcOfflineButton");
      const status = byId("mtcPersonalDataStatus");
      const novelty = byId("mtcPharmaImportNovelty");
      if(offline){
        bindOfflineButton(offline);
        offline.title = "Préparer le jeu pour réviser hors connexion";
        offline.setAttribute("aria-label", offline.title);
        if(offline.parentNode !== line) line.appendChild(offline);
      }
      if(status && status.parentNode !== line) line.appendChild(status);
      if(novelty && novelty.parentNode !== line) line.appendChild(novelty);
      // Ordre visuel : ✈︎ → export/import/historique à gauche, nouveauté séparée à droite sur ordinateur.
      [offline, status, novelty].filter(Boolean).forEach(node => {
        if(node.parentNode === line) line.appendChild(node);
      });
      return line;
    }finally{
      arrangingBottomLine = false;
    }
  }

  function startBottomLineObserver(){
    if(bottomLineObserver || !document.body || typeof MutationObserver === "undefined") return;
    bottomLineObserver = new MutationObserver(() => {
      if(arrangingBottomLine) return;
      window.requestAnimationFrame ? requestAnimationFrame(ensureBottomMetaLine) : setTimeout(ensureBottomMetaLine, 0);
    });
    bottomLineObserver.observe(document.body, {childList:true});
  }

  function ensureButton(){
    let button = byId("mtcOfflineButton");
    if(!button){
      button = document.createElement("button");
      button.id = "mtcOfflineButton";
      button.type = "button";
      button.textContent = "✈︎";
    }
    bindOfflineButton(button);
    if(button.parentNode !== document.body && button.parentNode !== byId("mtcBottomMetaLine")){
      document.body.appendChild(button);
    }
    updateButton();
    ensureBottomMetaLine();
  }

  function getTourSteps(){
    try{
      if(typeof tourSteps !== "undefined" && Array.isArray(tourSteps)) return tourSteps;
    }catch(error){}
    return Array.isArray(window.tourSteps) ? window.tourSteps : null;
  }

  function offlineTourStep(){
    return {
      selector:"#mtcOfflineButton",
      title:"Hors connexion",
      text:"Le bouton ✈︎ prépare le jeu sur cet appareil. Fais-le une seule fois avec internet : choisis Jeu seul ou Jeu + audios, puis rouvre le même lien pour jouer sans internet.",
      fallback:() => byId("mtcOfflineButton") || byId("footerTitle"),
      position:"aboveBottom"
    };
  }

  function insertOfflineTourStep(){
    const steps = getTourSteps();
    if(!Array.isArray(steps)) return;
    if(!steps.some(step => step && step.selector === "#mtcOfflineButton")){
      const importIndex = steps.findIndex(item => item && item.selector === "#importNotesButton");
      const suggestionIndex = steps.findIndex(item => item && item.selector === "#suggestionMailButton");
      if(suggestionIndex >= 0) steps.splice(suggestionIndex + 1, 0, offlineTourStep());
      else if(importIndex >= 0) steps.splice(importIndex + 1, 0, offlineTourStep());
      else steps.splice(Math.max(0, steps.length - 1), 0, offlineTourStep());
    }
    reorderBottomTourSteps();
  }

  function reorderBottomTourSteps(){
    const steps = getTourSteps();
    if(!Array.isArray(steps)) return;
    const importIndex = steps.findIndex(item => item && item.selector === "#importNotesButton");
    if(importIndex < 0) return;
    const selectors = ["#suggestionMailButton", "#mtcOfflineButton", "[data-import-history-toggle]"];
    const picked = new Map();
    for(let i = steps.length - 1; i >= 0; i--){
      const step = steps[i];
      if(step && selectors.includes(step.selector)){
        if(!picked.has(step.selector)) picked.set(step.selector, step);
        steps.splice(i, 1);
      }
    }
    const refreshedImportIndex = steps.findIndex(item => item && item.selector === "#importNotesButton");
    const ordered = selectors.map(selector => picked.get(selector)).filter(Boolean);
    steps.splice(refreshedImportIndex + 1, 0, ...ordered);
  }

  function patchOfflineTour(){
    const current = window.startTour;
    if(typeof current !== "function" || current.__mtcOfflineTourWrapped) return;
    const wrapped = function(){
      const result = current.apply(this, arguments);
      try{ insertOfflineTourStep(); }catch(error){}
      return result;
    };
    wrapped.__mtcOfflineTourWrapped = true;
    window.startTour = wrapped;
  }

  function init(){
    ensureButton();
    startBottomLineObserver();
    ensureBottomMetaLine();
    patchOfflineTour();
    setTimeout(ensureBottomMetaLine, 0);
    setTimeout(ensureBottomMetaLine, 600);
    watchForServiceWorkerUpdates();
    registerServiceWorker().catch(() => {});
    window.addEventListener("online", updateButton);
    window.addEventListener("offline", updateButton);
  }

  window.mtcPrepareOffline = precacheOffline;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
