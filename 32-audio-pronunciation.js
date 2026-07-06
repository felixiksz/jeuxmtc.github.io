/* ============================================================
   32-audio-pronunciation.js
   Lecture audio ACU/PHARMA.
   Version stable :
   - bouton toujours présent quand un hanzi existe
   - manifest explicite audio-manifest.js si disponible
   - candidats réellement présents dans le manifest en priorité
   - timeout allongé sur mobile/connexion lente
   - compatible fichiers GitHub chinois directs et fichiers zip #Uxxxx
   - volume 40 %
   ============================================================ */
(function(){
  "use strict";

  const AUDIO_BASE_PATH = "audio/";
  const manifest = window.MTC_AUDIO_MANIFEST || {files:[], byHanzi:{}};
  const manifestFiles = new Set(Array.isArray(manifest.files) ? manifest.files.map(String) : []);
  const manifestByHanzi = manifest.byHanzi && typeof manifest.byHanzi === "object" ? manifest.byHanzi : {};
  let currentAudio = null;
  let currentButton = null;
  let playbackSerial = 0;
  const AUDIO_MODE_STORAGE_KEY = "mtc_audio_mode_enabled_v1";

  function normalizeHanzi(value){
    const raw = String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const cjk = raw.match(/[\u3400-\u9fff]+/g);
    return cjk ? cjk.join("") : raw;
  }

  function containsCjk(value){
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function hanziToUStem(value){
    return [...String(value || "")].map(ch => {
      const code = ch.codePointAt(0);
      if(code >= 0x3400 && code <= 0x9fff){
        return "#U" + code.toString(16).padStart(4, "0");
      }
      return ch;
    }).join("");
  }

  function addUnique(list, value){
    const clean = String(value || "").trim();
    if(clean && !list.includes(clean)) list.push(clean);
  }

  function audioUrl(filename){
    return AUDIO_BASE_PATH + String(filename || "").split("/").map(encodeURIComponent).join("/");
  }

  function generatedCandidates(hanzi){
    const clean = normalizeHanzi(hanzi);
    const list = [];
    if(!clean) return list;
    const uStem = hanziToUStem(clean);
    addUnique(list, clean + "_baidu_zh.mp3");
    addUnique(list, clean + "_google_zh-CN.mp3");
    addUnique(list, uStem + "_baidu_zh.mp3");
    addUnique(list, uStem + "_google_zh-CN.mp3");
    if(!clean.endsWith("穴")){
      const withXue = clean + "穴";
      const withXueU = hanziToUStem(withXue);
      addUnique(list, withXue + "_baidu_zh.mp3");
      addUnique(list, withXue + "_google_zh-CN.mp3");
      addUnique(list, withXueU + "_baidu_zh.mp3");
      addUnique(list, withXueU + "_google_zh-CN.mp3");
    }
    return list;
  }

  function fileIsInManifest(filename){
    return manifestFiles.size > 0 && manifestFiles.has(String(filename || ""));
  }

  function manifestCandidatesForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    const out = [];
    if(!clean) return out;

    // IMPORTANT : on garde aussi les entrées byHanzi non présentes dans manifest.files.
    // Dans certains zips, les fichiers sont encodés en #Uxxxx, alors que sur GitHub
    // l’utilisateur peut avoir téléversé les noms chinois directs. Filtrer trop tôt
    // faisait échouer des fichiers pourtant présents, par exemple 厚朴_baidu_zh.mp3.
    const fromManifest = manifestByHanzi[clean];
    const listed = Array.isArray(fromManifest) ? fromManifest : (fromManifest ? [fromManifest] : []);

    // D'abord les fichiers réellement listés dans audio-manifest.js.
    // Sur mobile, tester un premier fichier inexistant peut consommer le geste utilisateur
    // et bloquer la lecture du bon candidat suivant.
    listed.forEach(item => { if(fileIsInManifest(item)) addUnique(out, item); });

    const uStem = hanziToUStem(clean);
    manifestFiles.forEach(file => {
      if(file && (file.startsWith(clean + "_") || file.startsWith(uStem + "_"))){
        addUnique(out, file);
      }
    });

    // Ensuite seulement, les noms proposés par byHanzi qui ne sont pas dans files.
    // Cela garde une chance si l'utilisateur a renommé/téléversé des fichiers directs.
    listed.forEach(item => addUnique(out, item));
    return out;
  }

  function candidateAudioFilenamesForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    const out = [];
    if(!clean) return out;

    // Ordre mobile-safe : fichiers confirmés par le manifest d'abord.
    // Si on teste d'abord un nom inexistant, iOS/Android peut bloquer les essais suivants.
    manifestCandidatesForHanzi(clean).forEach(item => addUnique(out, item));
    generatedCandidates(clean).forEach(item => addUnique(out, item));

    // Alias audio globaux portés par la base PHARMA : utile quand le nom
    // pédagogique a été corrigé sans renommer immédiatement tous les mp3.
    try{
      const herb = Array.isArray(window.PHARMA_HERBS)
        ? window.PHARMA_HERBS.find(item => normalizeHanzi(item && item.hanzi) === clean)
        : null;
      const aliases = herb && Array.isArray(herb.audioAliases) ? herb.audioAliases : [];
      aliases.forEach(alias => {
        generatedCandidates(alias).forEach(item => addUnique(out, item));
        manifestCandidatesForHanzi(alias).forEach(item => addUnique(out, item));
      });
    }catch(error){}

    return out;
  }

  function likelyManifestCandidate(hanzi){
    const candidates = candidateAudioFilenamesForHanzi(hanzi);
    return candidates[0] || "";
  }

  const audioResolveCache = new Map();

  function testAudioFileExists(filename){
    const url = audioUrl(filename);
    if(typeof fetch !== "function") return Promise.resolve(false);
    return fetch(url, {method:"HEAD", cache:"force-cache"})
      .then(response => {
        if(response && response.ok) return true;
        if(response && (response.status === 405 || response.status === 403)) throw new Error("HEAD unsupported");
        return false;
      })
      .catch(() => fetch(url, {method:"GET", headers:{Range:"bytes=0-1"}, cache:"force-cache"})
        .then(response => Boolean(response && (response.ok || response.status === 206)))
        .catch(() => false));
  }

  function resolveAudioFilenameForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    if(!clean) return Promise.resolve("");
    if(audioResolveCache.has(clean)) return audioResolveCache.get(clean);
    const candidates = candidateAudioFilenamesForHanzi(clean);
    const promise = candidates.reduce((chain, filename) => chain.then(found => {
      if(found) return found;
      return testAudioFileExists(filename).then(ok => ok ? filename : "");
    }), Promise.resolve(""));
    audioResolveCache.set(clean, promise);
    return promise;
  }

  function setButtonPlaying(button, isPlaying){
    document.querySelectorAll(".mtc-audio-button.mtc-audio-playing").forEach(btn => {
      if(btn !== button) btn.classList.remove("mtc-audio-playing");
    });
    if(button) button.classList.toggle("mtc-audio-playing", Boolean(isPlaying));
  }

  function stopCurrentAudio(){
    // Invalide aussi les callbacks audio asynchrones anciens.
    playbackSerial += 1;
    if(currentAudio){
      try{ currentAudio.pause(); currentAudio.currentTime = 0; }catch(error){}
    }
    setButtonPlaying(currentButton, false);
    currentAudio = null;
    currentButton = null;
  }

  function markMissing(button, hanzi){
    if(!button) return;
    button.disabled = false;
    button.classList.add("mtc-audio-missing");
    button.classList.remove("mtc-audio-loading", "mtc-audio-playing");
    button.dataset.audioFile = "";
    button.title = "Audio non disponible pour le moment";
    button.setAttribute("aria-label", "Audio non disponible pour " + hanzi);
  }

  function markAvailable(button, hanzi, filename){
    if(!button) return;
    button.disabled = false;
    button.classList.remove("mtc-audio-missing", "mtc-audio-loading");
    if(filename) button.dataset.audioFile = filename;
    button.title = "Écouter la prononciation";
    button.setAttribute("aria-label", "Écouter la prononciation de " + hanzi);
  }

  function tryPlayCandidateList(candidates, index, button, hanzi, serial){
    if(!serial){
      stopCurrentAudio();
      serial = playbackSerial + 1;
      playbackSerial = serial;
    }
    if(serial !== playbackSerial) return false;

    if(index >= candidates.length){
      if(serial !== playbackSerial) return false;
      markMissing(button, hanzi);
      currentAudio = null;
      currentButton = null;
      return false;
    }

    const filename = candidates[index];

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0.4;
    currentAudio = audio;
    currentButton = button || null;

    if(button){
      button.classList.add("mtc-audio-loading");
      button.classList.remove("mtc-audio-missing", "mtc-audio-playing");
      button.disabled = true;
      button.dataset.audioFile = filename;
      button.title = "Chargement audio : " + filename;
    }

    let settled = false;
    let timeoutId = null;

    function cleanup(){
      if(timeoutId) clearTimeout(timeoutId);
      audio.removeEventListener("error", onError);
    }

    function markSuccess(){
      if(settled || serial !== playbackSerial) return;
      settled = true;
      cleanup();
      if(button){
        button.disabled = false;
        button.classList.remove("mtc-audio-loading", "mtc-audio-missing");
        button.dataset.audioFile = filename;
        button.title = "Écouter la prononciation";
        setButtonPlaying(button, true);
      }
    }

    function fail(){
      if(settled || serial !== playbackSerial) return;
      settled = true;
      cleanup();
      try{ audio.pause(); }catch(error){}
      tryPlayCandidateList(candidates, index + 1, button, hanzi, serial);
    }

    function onError(){ fail(); }

    audio.addEventListener("error", onError, {once:true});
    audio.addEventListener("ended", () => {
      if(serial !== playbackSerial) return;
      setButtonPlaying(button, false);
      if(currentAudio === audio){ currentAudio = null; currentButton = null; }
    });

    timeoutId = setTimeout(fail, 8000);
    audio.src = audioUrl(filename);

    // Important : play() est appelé immédiatement dans le gestionnaire du clic.
    // Attendre canplay avant play() peut faire perdre l’autorisation utilisateur
    // dans certains navigateurs après un premier candidat introuvable.
    let playPromise = null;
    try{ playPromise = audio.play(); }catch(error){ fail(); return true; }
    if(playPromise && typeof playPromise.then === "function"){
      playPromise.then(markSuccess).catch(fail);
    }else{
      markSuccess();
    }
    return true;
  }

  function playAudioForHanzi(hanzi, button){
    const clean = normalizeHanzi(hanzi);
    if(!clean){
      markMissing(button, clean);
      return false;
    }

    // Le comportement "recliquer = arrêter" ne concerne que le même bouton de fiche.
    // En mode audio de jeu, button vaut null : un nouveau clic valide doit interrompre
    // l’ancien son et jouer immédiatement le nouveau, pas simplement l’arrêter.
    if(button && currentButton === button && currentAudio && !currentAudio.paused){
      stopCurrentAudio();
      return true;
    }

    let candidates = candidateAudioFilenamesForHanzi(clean);
    const remembered = button && button.dataset.audioFile;
    if(remembered && candidates.includes(remembered)){
      candidates.splice(candidates.indexOf(remembered), 1);
      candidates.unshift(remembered);
    }
    if(button && button.dataset.audioResolved === "1" && remembered){
      candidates = [remembered];
    }

    return tryPlayCandidateList(candidates, 0, button, clean);
  }

  function makeAudioButton(hanzi){
    const clean = normalizeHanzi(hanzi);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mtc-audio-button";
    button.textContent = "🔊";
    button.dataset.audioHanzi = clean;

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      playAudioForHanzi(clean, button);
    });

    if(clean && containsCjk(clean)){
      const known = likelyManifestCandidate(clean);
      markAvailable(button, clean, known || "");
      button.dataset.audioResolved = "0";
      if(!known) button.title = "Écouter la prononciation si le fichier audio existe";
      resolveAudioFilenameForHanzi(clean).then(filename => {
        if(!button.isConnected || button.dataset.audioHanzi !== clean) return;
        if(filename){
          button.dataset.audioResolved = "1";
          markAvailable(button, clean, filename);
        }else{
          button.dataset.audioResolved = "0";
          // On garde le bouton cliquable : un fichier peut être ajouté après le chargement ou être servi différemment.
          button.title = "Audio non confirmé, clic pour tester";
        }
      });
    }else{
      markMissing(button, clean);
    }
    return button;
  }

  function enhanceHeader(header){
    if(!header) return;
    const hanziNode = header.querySelector(".point-hanzi-inline");
    const hanzi = normalizeHanzi(hanziNode ? hanziNode.textContent : "");
    const previous = header.querySelector(".mtc-audio-button");
    if(previous && previous.dataset.audioHanzi === hanzi) return;
    if(previous) previous.remove();
    if(!hanzi || !hanziNode) return;
    const button = makeAudioButton(hanzi);
    hanziNode.insertAdjacentElement("afterend", button);
  }

  function enhancePointPanel(){
    const content = document.getElementById("pointPanelContent");
    if(!content) return;
    content.querySelectorAll(".point-header").forEach(enhanceHeader);
  }

  function injectAudioStyles(){
    if(document.getElementById("mtc-audio-pronunciation-style")) return;
    const style = document.createElement("style");
    style.id = "mtc-audio-pronunciation-style";
    style.textContent = `
      .mtc-audio-button{appearance:none;border:0;background:transparent;color:currentColor;width:1.25em;min-width:1.25em;height:1.25em;margin:0 .16em 0 .22em;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:.52em;line-height:1;cursor:pointer;opacity:.62;vertical-align:.08em;box-shadow:none;transform:none;transition:opacity .16s ease, transform .16s ease, color .16s ease;}
      .mtc-audio-button:hover,.mtc-audio-button:focus-visible{opacity:.95;transform:translateY(-1px);outline:none;box-shadow:none;background:transparent;}
      .mtc-audio-button:active{transform:translateY(0) scale(.94);}
      .mtc-audio-button.mtc-audio-loading{opacity:.42;cursor:wait;}
      .mtc-audio-button.mtc-audio-playing{opacity:1;background:transparent;box-shadow:none;transform:scale(1.05);}
      .mtc-audio-button.mtc-audio-missing{color:#8a8a8a;opacity:.42;}
      .point-hanzi-inline + .mtc-audio-button{flex:0 0 auto;}
      .point-header .mtc-audio-button + .point-header-basket-button,.point-header .mtc-audio-button + .pharma-herb-panel-basket-add{margin-left:.35em;}
      .mtc-audio-mode-toggle{appearance:none;border:0;background:transparent;color:var(--text-color);box-shadow:none;min-width:1.65em;width:1.65em;height:1.65em;margin:0 .32em 0 0;padding:0;display:inline-flex;align-items:center;justify-content:center;font-family:var(--ui-font-family);font-size:1.06em;line-height:1;cursor:pointer;opacity:.38;transform:none;text-decoration:none;transition:opacity .16s ease, transform .16s ease;}
      .mtc-audio-mode-toggle:hover,.mtc-audio-mode-toggle:focus-visible{opacity:.72;outline:none;background:transparent;box-shadow:none;transform:translateY(-1px);text-decoration:none;}
      .mtc-audio-mode-toggle.active{opacity:.9;font-weight:700;text-decoration:none;}
      .mtc-audio-mode-toggle:active{transform:translateY(0) scale(.94);}
    `;
    document.head.appendChild(style);
  }


  function isAudioModeEnabled(){
    try{ return localStorage.getItem(AUDIO_MODE_STORAGE_KEY) === "1"; }
    catch(error){ return false; }
  }

  function setAudioModeEnabled(enabled){
    try{ localStorage.setItem(AUDIO_MODE_STORAGE_KEY, enabled ? "1" : "0"); }
    catch(error){}
    updateAudioModeButton();
  }

  function toggleAudioMode(){
    setAudioModeEnabled(!isAudioModeEnabled());
  }

  function updateAudioModeButton(){
    const button = document.getElementById("mtcAudioModeToggle");
    if(!button) return;
    // Même pictogramme que les boutons de prononciation des fiches.
    if(button.textContent !== "🔊") button.textContent = "🔊";
    const enabled = isAudioModeEnabled();
    button.classList.toggle("active", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.title = enabled
      ? "Mode audio activé : prononciation après un choix valide"
      : "Mode audio désactivé";
  }

  function hanziFromAcupuncturePoint(point){
    try{
      const details = window.POINT_DETAILS && window.POINT_DETAILS[String(point)];
      return normalizeHanzi(details && details.hanzi);
    }catch(error){ return ""; }
  }

  function getPharmaHerbById(id){
    const cleanId = String(id || "");
    return (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .find(item => item && String(item.id || item.code || "") === cleanId) || null;
  }

  function hanziFromPharmaHerb(herb){
    const resolvedHerb = typeof herb === "string" ? getPharmaHerbById(herb) : herb;
    if(!resolvedHerb) return "";
    try{
      if(typeof window.getPharmaHerbHanzi === "function"){
        const fromPanel = normalizeHanzi(window.getPharmaHerbHanzi(resolvedHerb.id || resolvedHerb.code));
        if(fromPanel) return fromPanel;
      }
    }catch(error){}
    return normalizeHanzi(resolvedHerb.hanzi || "");
  }

  function pickRandom(list){
    const clean = (Array.isArray(list) ? list : []).map(normalizeHanzi).filter(Boolean);
    if(!clean.length) return "";
    return clean[Math.floor(Math.random() * clean.length)];
  }

  function playOneHanziForAudioMode(hanziList){
    if(!isAudioModeEnabled()) return false;
    const chosen = pickRandom(hanziList);
    if(!chosen) return false;
    return playAudioForHanzi(chosen, null);
  }

  function playAudioModeForHanzi(hanzi){
    if(!isAudioModeEnabled()) return false;
    const clean = normalizeHanzi(hanzi);
    if(!clean) return false;
    return playAudioForHanzi(clean, null);
  }

  function playAudioModeForAcupunctureGroup(group){
    if(!group || !Array.isArray(group.points)) return false;
    return playOneHanziForAudioMode(group.points.map(hanziFromAcupuncturePoint));
  }

  function playAudioModeForPharmaGroup(group){
    if(!group) return false;
    let herbs = [];
    if(Array.isArray(group.herbs) && group.herbs.length){
      herbs = group.herbs;
    }else if(Array.isArray(group.herbIds) && group.herbIds.length){
      herbs = group.herbIds.map(getPharmaHerbById).filter(Boolean);
    }else if(Array.isArray(group.items) && group.items.length){
      herbs = group.items;
    }
    return playOneHanziForAudioMode(herbs.map(hanziFromPharmaHerb));
  }

  function bootAudioModeButton(){
    updateAudioModeButton();
    const button = document.getElementById("mtcAudioModeToggle");
    if(button && button.dataset.audioModeBound !== "1"){
      button.dataset.audioModeBound = "1";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleAudioMode();
      });
    }
  }

  function bootAudioEnhancer(){
    injectAudioStyles();
    bootAudioModeButton();
    enhancePointPanel();
    const content = document.getElementById("pointPanelContent");
    if(!content || content.dataset.mtcAudioObserver === "1") return;
    content.dataset.mtcAudioObserver = "1";
    const observer = new MutationObserver(() => enhancePointPanel());
    observer.observe(content, {childList:true, subtree:true});
  }

  window.mtcAudioManifest = manifest;
  window.mtcAudioCandidatesForHanzi = candidateAudioFilenamesForHanzi;
  window.mtcAudioFilenameForHanzi = likelyManifestCandidate;
  window.playMtcAudioByHanzi = playAudioForHanzi;
  window.isMtcAudioModeEnabled = isAudioModeEnabled;
  window.toggleMtcAudioMode = toggleAudioMode;
  window.updateMtcAudioModeButton = updateAudioModeButton;
  window.mtcAudioModePlayHanzi = playAudioModeForHanzi;
  window.mtcAudioModePlayAcupunctureGroup = playAudioModeForAcupunctureGroup;
  window.mtcAudioModePlayPharmaGroup = playAudioModeForPharmaGroup;
  window.refreshMtcAudioButtons = enhancePointPanel;

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootAudioEnhancer, {once:true});
  else bootAudioEnhancer();
})();


/* === Patch UI final : cheatsheet toujours ouvert en haut === */
(function(){
  function resetCheatsheetScroll(){
    const panel = document.getElementById("cheatsheetPanel");
    const content = document.getElementById("cheatsheetPanelContent");
    if(!panel || !panel.classList.contains("open")) return;
    const reset = () => {
      try{ panel.scrollTop = 0; }catch(error){}
      try{ if(content) content.scrollTop = 0; }catch(error){}
    };
    reset();
    requestAnimationFrame(reset);
    setTimeout(reset, 60);
  }

  function wrapCheatsheetFunction(name){
    const original = window[name];
    if(typeof original !== "function" || original.__mtcScrollResetWrapped) return;
    const wrapped = function(){
      const result = original.apply(this, arguments);
      resetCheatsheetScroll();
      return result;
    };
    wrapped.__mtcScrollResetWrapped = true;
    window[name] = wrapped;
    try{
      if(name === "openCheatsheetPanel" && typeof openCheatsheetPanel === "function") openCheatsheetPanel = wrapped;
      if(name === "toggleCheatsheetPanel" && typeof toggleCheatsheetPanel === "function") toggleCheatsheetPanel = wrapped;
    }catch(error){}
  }

  function initCheatsheetScrollReset(){
    wrapCheatsheetFunction("openCheatsheetPanel");
    wrapCheatsheetFunction("toggleCheatsheetPanel");
    document.addEventListener("click", event => {
      if(event.target?.closest?.("#cheatsheetButton, #cheatsheetToggle")){
        setTimeout(resetCheatsheetScroll, 0);
      }
    }, true);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCheatsheetScrollReset);
  else initCheatsheetScrollReset();
})();


/* === Fermeture automatique du cheatsheet quand une fiche est ouverte depuis le cheatsheet === */
(function(){
  function closeCheatsheet(){
    if(typeof window.closeCheatsheetPanel === "function") return window.closeCheatsheetPanel();
    const panel = document.getElementById("cheatsheetPanel");
    const toggle = document.getElementById("cheatsheetToggle");
    if(panel) panel.classList.remove("open");
    if(toggle) toggle.innerHTML = "&gt;";
  }
  function wrap(name){
    const original = window[name];
    if(typeof original !== "function" || original.__mtcCloseCheatsheetAfterPanelOpen) return;
    const wrapped = function(){
      const fromCheatsheet = !!(document.__mtcLastCheatsheetTapAt && Date.now() - document.__mtcLastCheatsheetTapAt < 900);
      const result = original.apply(this, arguments);
      if(fromCheatsheet) window.setTimeout(closeCheatsheet, 0);
      return result;
    };
    wrapped.__mtcCloseCheatsheetAfterPanelOpen = true;
    window[name] = wrapped;
    try{
      if(name === "openPointPanel" && typeof openPointPanel === "function") openPointPanel = wrapped;
      if(name === "openPointPanelDirect" && typeof openPointPanelDirect === "function") openPointPanelDirect = wrapped;
      if(name === "openPharmaHerbPanel" && typeof openPharmaHerbPanel === "function") openPharmaHerbPanel = wrapped;
    }catch(error){}
  }
  function init(){
    document.addEventListener("pointerdown", event => {
      if(event.target && event.target.closest && event.target.closest("#cheatsheetPanelContent")){
        document.__mtcLastCheatsheetTapAt = Date.now();
      }
    }, true);
    document.addEventListener("click", event => {
      if(event.target && event.target.closest && event.target.closest("#cheatsheetPanelContent")){
        document.__mtcLastCheatsheetTapAt = Date.now();
      }
    }, true);
    wrap("openPointPanel");
    wrap("openPointPanelDirect");
    wrap("openPharmaHerbPanel");
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
