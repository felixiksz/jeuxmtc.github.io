/* ============================================================
   32-audio-pronunciation.js
   Lecture audio ACU/PHARMA.
   Version stable :
   - bouton toujours présent quand un hanzi existe
   - manifest explicite audio-manifest.js si disponible
   - candidates testées dans l'ordre : chinois direct, manifest, #Uxxxx
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
    listed.forEach(item => addUnique(out, item));

    const uStem = hanziToUStem(clean);
    manifestFiles.forEach(file => {
      if(file && (file.startsWith(clean + "_") || file.startsWith(uStem + "_"))){
        addUnique(out, file);
      }
    });
    return out;
  }

  function candidateAudioFilenamesForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    const out = [];
    if(!clean) return out;

    // Ordre choisi pour GitHub : chinois direct d’abord, puis manifest, puis #Uxxxx.
    // Cela corrige le cas où le manifest du zip liste #U539a#U6734_baidu_zh.mp3,
    // mais où le vrai fichier publié est audio/厚朴_baidu_zh.mp3.
    generatedCandidates(clean).forEach(item => addUnique(out, item));
    manifestCandidatesForHanzi(clean).forEach(item => addUnique(out, item));

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

    timeoutId = setTimeout(fail, 3000);
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


/* ==========================================================
   Corrections consolidées — intégrées dans le JS existant.
   Source: anciens correctifs 33/34/38/39/40/41/42/44/45.
   ========================================================== */

/* --- 33-stable-hotfix.js --- */
/* === 33-stable-hotfix.js
   Correctifs isolés pour repartir de la dernière version stable. === */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }

  function domain(){
    return document.documentElement.getAttribute("data-study-domain") || window.MTC_STUDY_DOMAIN || "none";
  }

  function escAttr(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function getAcuComparisonSlots(){
    if(typeof window.getComparisonPoints === "function"){
      try{ return window.getComparisonPoints(); }catch(error){}
    }
    try{
      const parsed = JSON.parse(localStorage.getItem("connections_mtc_comparison_points_v1") || "[]");
      return [parsed?.[0] ? String(parsed[0]) : "", parsed?.[1] ? String(parsed[1]) : ""];
    }catch(error){
      return ["", ""];
    }
  }

  function saveAcuComparisonSlots(slots){
    if(typeof window.saveComparisonPoints === "function"){
      try{ window.saveComparisonPoints(slots); return; }catch(error){}
    }
    try{ localStorage.setItem("connections_mtc_comparison_points_v1", JSON.stringify([slots?.[0] || "", slots?.[1] || ""])); }catch(error){}
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
  }

  function toggleAcuComparison(point){
    const clean = String(point || "").trim();
    if(!clean) return;
    const slots = getAcuComparisonSlots();
    const existing = slots.findIndex(item => item === clean);
    if(existing >= 0){
      slots[existing] = "";
    }else{
      const free = slots.findIndex(item => !item);
      slots[free >= 0 ? free : 0] = clean;
    }
    saveAcuComparisonSlots(slots);
  }

  function getPharmaComparisonSlots(){
    try{
      const parsed = JSON.parse(localStorage.getItem("mtc_pharma_comparison_slots_v1") || "[]");
      return Array.isArray(parsed) ? parsed.map(value => value ? String(value) : "") : [];
    }catch(error){
      return [];
    }
  }

  function isInComparison(id){
    const clean = String(id || "").trim();
    if(!clean) return false;
    if(domain() === "pharmacology") return getPharmaComparisonSlots().includes(clean);
    return getAcuComparisonSlots().includes(clean);
  }

  function toggleHeaderComparison(id){
    const clean = String(id || "").trim();
    if(!clean) return;
    if(domain() === "pharmacology"){
      if(typeof window.togglePharmaComparisonHerb === "function"){
        window.togglePharmaComparisonHerb(clean, {autoOpen:false});
      }else if(typeof window.addPharmaHerbToComparison === "function"){
        window.addPharmaHerbToComparison(clean, {autoOpen:false});
      }
    }else{
      toggleAcuComparison(clean);
    }
    updateHeaderCompareButtons();
  }

  function itemIdFromHeader(header){
    if(!header) return "";
    const pharmaBasket = header.querySelector("[data-pharma-basket-herb]");
    if(pharmaBasket) return pharmaBasket.getAttribute("data-pharma-basket-herb") || "";
    const acuBasket = header.querySelector("[data-basket-point]");
    if(acuBasket) return acuBasket.getAttribute("data-basket-point") || "";
    return "";
  }

  function ensureHeaderCompareButton(header){
    const id = itemIdFromHeader(header);
    if(!id) return null;
    let button = header.querySelector(".mtc-header-compare-button");
    if(!button){
      button = document.createElement("button");
      button.type = "button";
      button.className = "comparison-add-button mtc-header-compare-button";
      button.textContent = "A|B";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleHeaderComparison(button.getAttribute("data-compare-id") || "");
      });
      header.appendChild(button);
    }
    button.setAttribute("data-compare-id", id);
    return button;
  }

  function ensureHeaderActions(header){
    if(!header) return;
    const button = ensureHeaderCompareButton(header);
    const actionItems = Array.from(header.querySelectorAll(".mtc-audio-button, .point-header-basket-button, .pharma-herb-panel-basket-add, .mtc-header-compare-button"));
    if(!actionItems.length) return;

    let actions = header.querySelector(":scope > .mtc-header-actions");
    if(!actions){
      actions = document.createElement("span");
      actions.className = "mtc-header-actions";
      header.appendChild(actions);
    }

    actionItems.forEach(item => {
      if(item.parentElement !== actions){
        actions.appendChild(item);
      }
    });

    if(button) syncHeaderButton(button);
  }

  function syncHeaderButton(button){
    const id = button.getAttribute("data-compare-id") || "";
    const active = isInComparison(id);
    button.classList.toggle("is-active", active);
    button.title = active ? "Retirer de la comparaison" : "Ajouter à la comparaison";
    button.setAttribute("aria-label", button.title);
  }

  function updateHeaderCompareButtons(){
    document.querySelectorAll(".mtc-header-compare-button[data-compare-id]").forEach(syncHeaderButton);
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
  }

  function enhancePointPanelHeader(){
    const content = byId("pointPanelContent");
    if(!content) return;
    content.querySelectorAll(".point-header").forEach(ensureHeaderActions);
    updateHeaderCompareButtons();
  }

  function fixMobileEspritButtons(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-info-button").forEach(button => {
      if(button.textContent !== "+") button.textContent = "+";
      button.title = "Afficher / masquer l’esprit";
      button.setAttribute("aria-label", "Afficher / masquer l’esprit de cette substance");
    });
  }

  function ensureAcupunctureAfterDomainSwitch(){
    if(domain() !== "acupuncture") return;

    document.documentElement.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");
    if(document.body){
      document.body.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");
    }

    const grid = byId("grid");
    const hasPharmaTiles = !!(grid && grid.querySelector(".pharma-tile"));
    const isEmpty = !!(grid && !grid.children.length);

    if((hasPharmaTiles || isEmpty) && typeof window.newGame === "function"){
      try{ window.newGame(); }catch(error){}
    }

    ["cheatsheetPanel", "advancedSearchPanel", "reviewBasketPanel", "comparisonPanel", "statsPanel"].forEach(id => {
      const panel = byId(id);
      if(panel) panel.classList.remove("pharma-panel");
    });
  }

  function patchHistoryClickFallback(){
    if(window.__mtcStableHistoryFallbackReady) return;
    window.__mtcStableHistoryFallbackReady = true;
    document.addEventListener("click", event => {
      const toggle = event.target && event.target.closest && event.target.closest("[data-import-history-toggle]");
      if(!toggle) return;
      const box = byId("mtcPersonalDataStatus");
      if(!box) return;
      event.preventDefault();
      event.stopPropagation();
      box.classList.toggle("history-open");
    }, false);
  }

  function patchPharmaMistakeFeedback(){
    if(window.__mtcStablePharmaMistakePatchReady) return;
    const original = window.onPharmaMistake;
    if(typeof original !== "function") return;
    window.__mtcStablePharmaMistakePatchReady = true;

    window.onPharmaMistake = function(detail){
      const life = byId("lifeDisplay");
      const text = life ? String(life.textContent || "") : "";
      const remaining = (text.match(/♥/g) || []).length;
      const imminentGameOver = remaining === 1 && !text.includes("∞");
      const message = byId("message");

      if(imminentGameOver && message){
        message.textContent = "Dernière erreur : révélation des solutions…";
        document.body.classList.add("mtc-gameover-pending");
        setTimeout(() => {
          try{ original.call(this, detail); }
          finally{ document.body.classList.remove("mtc-gameover-pending"); }
        }, 30);
        return false;
      }

      return original.apply(this, arguments);
    };
  }

  function boot(){
    patchHistoryClickFallback();
    patchPharmaMistakeFeedback();
    enhancePointPanelHeader();
    fixMobileEspritButtons(document);

    const pointContent = byId("pointPanelContent");
    if(pointContent && pointContent.dataset.stableHotfixObserver !== "1"){
      pointContent.dataset.stableHotfixObserver = "1";
      new MutationObserver(() => {
        enhancePointPanelHeader();
        fixMobileEspritButtons(pointContent);
      }).observe(pointContent, {childList:true, subtree:true});
    }

    const solved = byId("solved");
    if(solved && solved.dataset.stableHotfixObserver !== "1"){
      solved.dataset.stableHotfixObserver = "1";
      new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
          if(node.nodeType === 1) fixMobileEspritButtons(node);
        }));
      }).observe(solved, {childList:true, subtree:true});
    }
  }

  window.addEventListener("mtc-study-domain-changed", event => {
    const next = event && event.detail ? event.detail.domain : domain();
    if(next === "acupuncture") setTimeout(ensureAcupunctureAfterDomainSwitch, 80);
    setTimeout(() => {
      patchPharmaMistakeFeedback();
      enhancePointPanelHeader();
      fixMobileEspritButtons(document);
    }, 120);
  });

  window.addEventListener("storage", () => setTimeout(updateHeaderCompareButtons, 0));
  window.addEventListener("load", boot);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();


/* --- 34-targeted-requests.js --- */
/* === 34-targeted-requests.js
   Correctifs ciblés demandés : historique, tuto, audio fiches,
   recherche ACU points de transport + ordre naturel, drag lignes comparaison.
   Stats ACU : restaurées comme avant ce patch. === */
(function(){
  "use strict";

  const TRANSPORT_KEY = "__POINTS_TRANSPORT__";
  const TRANSPORT_KEYS = [
    "JING_PUITS", "YING_JAILLISSEMENT", "SHU_RIVIERE", "JING_FLEUVE", "HE_REUNION",
    "Points_Jing_Puits", "Points_Ying_Jaillissement", "Points_Shu_Riviere", "Points_Jing_Fleuve", "Points_He_Reunion"
  ];
  const TRANSPORT_CANONICAL_KEYS = new Set(["Points_Jing_Puits", "Points_Ying_Jaillissement", "Points_Shu_Riviere", "Points_Jing_Fleuve", "Points_He_Reunion"]);
  const CANAL_ORDER = ["P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F", "RM", "DM"];
  const ROW_ORDER_ACU_KEY = "mtc_compare_row_order_acu_v1";
  const ROW_ORDER_PHARMA_KEY = "mtc_compare_row_order_pharma_v4";
  const PHARMA_HANZI_PREFIX = "mtc_pharma_herb_hanzi_";

  const previous = {
    allSearchPoints: window.allSearchPoints,
    categoryOptionsHtml: window.categoryOptionsHtml,
    categoryDisplayNameFromSearchKey: window.categoryDisplayNameFromSearchKey,
    pointCategoryKeys: window.pointCategoryKeys,
    pointCategoryNames: window.pointCategoryNames,
    pointMatchesCategory: window.pointMatchesCategory,
    renderStatsPanel: window.renderStatsPanel,
    renderStatsPanelIfOpen: window.renderStatsPanelIfOpen,
    startTour: window.startTour,
    exportPersonalNotes: window.exportPersonalNotes,
    importPersonalNotesFromFile: window.importPersonalNotesFromFile,
    openPointPanel: window.openPointPanel,
    openPointPanelDirect: window.openPointPanelDirect,
    openPharmaHerbPanel: window.openPharmaHerbPanel
  };

  let lastPointId = "";
  let lastHerbId = "";

  function byId(id){ return document.getElementById(id); }
  function domain(){ return document.documentElement.getAttribute("data-study-domain") || window.MTC_STUDY_DOMAIN || ""; }
  function isAcu(){ return domain() === "acupuncture"; }
  function isPharma(){ return domain() === "pharmacology"; }
  function esc(value){
    if(typeof window.escapeHtml === "function") return window.escapeHtml(value);
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function attr(value){
    if(typeof window.escapeAttribute === "function") return window.escapeAttribute(value);
    return esc(value).replace(/`/g,"&#096;");
  }
  function normalize(value){
    if(typeof window.normalizeSearchText === "function") return window.normalizeSearchText(value);
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr-FR").trim();
  }
  function readJson(key, fallback){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed == null ? fallback : parsed;
    }catch(error){ return fallback; }
  }
  function storageRowOrderKey(){ return isPharma() ? ROW_ORDER_PHARMA_KEY : ROW_ORDER_ACU_KEY; }
  function cssEscape(value){
    const text = String(value == null ? "" : value);
    if(window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(text);
    return text.replace(/[^a-zA-Z0-9_-]/g, ch => "\\" + ch);
  }

  function setMessageSoon(text){
    setTimeout(() => {
      const message = byId("message") || window.message;
      if(message) message.textContent = text;
    }, 40);
  }

  /* Recherche ACU : option agrégée “Points de transport” + ordre naturel P, GI, E… */
  function flattenPoints(value){
    if(typeof window.flattenPoints === "function") return window.flattenPoints(value);
    if(Array.isArray(value)) return value.flatMap(flattenPoints);
    if(value && typeof value === "object") return Object.values(value).flatMap(flattenPoints);
    return value ? [String(value)] : [];
  }
  function canonicalCategoryKey(key){
    if(typeof window.canonicalAssociationKey === "function") return window.canonicalAssociationKey(key);
    const aliases = {
      JING_PUITS:"Points_Jing_Puits",
      YING_JAILLISSEMENT:"Points_Ying_Jaillissement",
      SHU_RIVIERE:"Points_Shu_Riviere",
      JING_FLEUVE:"Points_Jing_Fleuve",
      HE_REUNION:"Points_He_Reunion"
    };
    return aliases[key] || key;
  }
  function isTransportCategoryKey(key){
    return TRANSPORT_CANONICAL_KEYS.has(canonicalCategoryKey(key));
  }
  let transportCache = null;
  function transportPointSet(){
    if(transportCache) return transportCache;
    const set = new Set();
    const cats = window.RAW_DATA && RAW_DATA.Categories_de_points ? RAW_DATA.Categories_de_points : {};
    Object.entries(cats).forEach(([key, value]) => {
      if(isTransportCategoryKey(key)) flattenPoints(value).forEach(point => set.add(String(point)));
    });
    // Secours : si une autre couche renvoie déjà les familles de points par catégorie,
    // on agrège aussi ces clés canoniques.
    const points = typeof previous.allSearchPoints === "function" ? previous.allSearchPoints() : [];
    if(Array.isArray(points)){
      points.forEach(point => {
        const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys(point) : [];
        if(Array.isArray(keys) && keys.some(isTransportCategoryKey)) set.add(String(point));
      });
    }
    transportCache = set;
    return set;
  }
  function isTransportPoint(point){
    const text = String(point || "");
    if(transportPointSet().has(text)) return true;
    const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys(text) : [];
    return Array.isArray(keys) && keys.some(isTransportCategoryKey);
  }

  window.categoryDisplayNameFromSearchKey = function(key){
    if(key === TRANSPORT_KEY) return "Points de transport";
    if(typeof previous.categoryDisplayNameFromSearchKey === "function") return previous.categoryDisplayNameFromSearchKey.apply(this, arguments);
    return key || "";
  };

  window.categoryOptionsHtml = function(){
    const base = typeof previous.categoryOptionsHtml === "function" ? String(previous.categoryOptionsHtml.apply(this, arguments) || "") : "";
    if(base.includes(`value=\"${TRANSPORT_KEY}\"`) || base.includes(`value='${TRANSPORT_KEY}'`)) return base;
    const option = `<option value="${attr(TRANSPORT_KEY)}">Points de transport</option>`;
    const options = [option, base].filter(Boolean).join("");
    return options;
  };

  window.pointCategoryKeys = function(point){
    const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys.apply(this, arguments) : [];
    const out = Array.isArray(keys) ? keys.slice() : [];
    if(isTransportPoint(point) && !out.includes(TRANSPORT_KEY)) out.push(TRANSPORT_KEY);
    return out;
  };

  window.pointCategoryNames = function(point){
    return window.pointCategoryKeys(point).map(key => window.categoryDisplayNameFromSearchKey(key));
  };

  window.pointMatchesCategory = function(point, categoryKey){
    if(!categoryKey) return true;
    if(categoryKey === TRANSPORT_KEY) return isTransportPoint(point);
    if(typeof previous.pointMatchesCategory === "function") return previous.pointMatchesCategory.apply(this, arguments);
    return window.pointCategoryKeys(point).includes(categoryKey);
  };

  function parsePointCode(point){
    const raw = String(point || "").replace(/\s+/g, "").trim();
    const match = raw.match(/^([A-Za-zÀ-ÿ]+)(\d+)(.*)$/);
    let canal = "";
    let number = 9999;
    if(match){
      canal = match[1];
      number = Number(match[2]) || 9999;
    }else if(typeof window.canalOfPoint === "function"){
      canal = window.canalOfPoint(raw) || "";
    }
    const upper = canal.toUpperCase();
    const canonical = {P:"P", GI:"GI", E:"E", RT:"Rt", RP:"Rt", C:"C", IG:"IG", V:"V", RN:"Rn", R:"Rn", EC:"EC", MC:"EC", TF:"TF", TR:"TF", VB:"VB", F:"F", RM:"RM", REN:"RM", VC:"RM", DM:"DM", DU:"DM", VG:"DM"}[upper] || canal;
    const order = CANAL_ORDER.indexOf(canonical);
    return {canal:canonical, order:order >= 0 ? order : 999, number, raw};
  }
  function comparePointNatural(a,b){
    const pa = parsePointCode(a);
    const pb = parsePointCode(b);
    if(pa.order !== pb.order) return pa.order - pb.order;
    if(pa.number !== pb.number) return pa.number - pb.number;
    return normalize(pa.raw).localeCompare(normalize(pb.raw), "fr");
  }
  window.allSearchPoints = function(){
    let points = [];
    if(typeof previous.allSearchPoints === "function"){
      try{ points = previous.allSearchPoints.apply(this, arguments) || []; }catch(error){ points = []; }
    }
    if(!Array.isArray(points) || !points.length){
      const set = new Set();
      if(window.POINT_DETAILS) Object.keys(window.POINT_DETAILS).forEach(point => set.add(point));
      try{
        if(!window.pool || !pool.length) pool = buildPool();
        pool.forEach(cat => (cat.points || []).forEach(point => set.add(point)));
      }catch(error){}
      points = Array.from(set);
    }
    return Array.from(new Set(points.map(String))).sort(comparePointNatural);
  };

  /* Stats ACU : restaurées dans leur rendu antérieur. Ce patch ne remplace plus le panneau stats. */

  /* Historique import : fermeture claire + message d’aide. */
  function enhanceHistoryBox(){
    const box = byId("mtcPersonalDataStatus");
    if(!box) return;
    const toggle = box.querySelector("[data-import-history-toggle]");
    if(toggle){
      toggle.title = "Afficher / masquer l’historique des imports locaux";
      toggle.setAttribute("aria-label", "Afficher ou masquer l’historique des imports locaux");
    }
    const pop = box.querySelector(".mtc-status-history-popover");
    if(!pop) return;
    if(!pop.querySelector(".mtc-import-history-help")){
      const help = document.createElement("span");
      help.className = "mtc-import-history-help";
      help.textContent = "pastilles = restaurer une sauvegarde locale avant import ; notes/images seulement";
      pop.insertBefore(help, pop.firstChild || null);
    }
    if(!pop.querySelector("[data-import-history-close]")){
      const close = document.createElement("button");
      close.type = "button";
      close.className = "mtc-import-history-close";
      close.setAttribute("data-import-history-close", "1");
      close.textContent = "fermer";
      close.title = "Refermer l’historique";
      pop.appendChild(close);
    }
    maybeShowHistoryHint();
  }
  function maybeShowHistoryHint(){
    const key = "mtc_progress_hint_import_history_v2";
    const target = document.querySelector("[data-import-history-toggle]");
    if(!target || localStorage.getItem(key) === "1") return;
    localStorage.setItem(key, "1");
    if(typeof window.showProgressHintSoon === "function"){
      window.showProgressHintSoon(
        "import_history_v2",
        "[data-import-history-toggle]",
        "Historique d’import",
        "L’historique garde quelques sauvegardes locales créées avant les imports. Les pastilles permettent de restaurer les notes/images locales si un import écrase quelque chose.",
        {position:"aboveBottom"},
        420
      );
    }
  }
  document.addEventListener("click", event => {
    const close = event.target && event.target.closest && event.target.closest("[data-import-history-close]");
    if(close){
      event.preventDefault();
      event.stopPropagation();
      const box = byId("mtcPersonalDataStatus");
      if(box) box.classList.remove("history-open");
      return;
    }
    const box = byId("mtcPersonalDataStatus");
    if(box && box.classList.contains("history-open") && !event.target.closest("#mtcPersonalDataStatus")){
      box.classList.remove("history-open");
    }
  }, true);
  document.addEventListener("keydown", event => {
    if(event.key !== "Escape") return;
    const box = byId("mtcPersonalDataStatus");
    if(box) box.classList.remove("history-open");
  });

  /* Export/import : libellés courts et explicites “notes/images locales seulement”. */
  if(typeof previous.exportPersonalNotes === "function"){
    window.exportPersonalNotes = function(){
      const result = previous.exportPersonalNotes.apply(this, arguments);
      setMessageSoon("Export créé : notes/images locales seulement. La base du jeu n’est pas exportée.");
      return result;
    };
  }
  if(typeof previous.importPersonalNotesFromFile === "function"){
    window.importPersonalNotesFromFile = function(){
      // Ne pas afficher "import terminé" ici : l'import est asynchrone.
      // Le message final est géré par l'événement mtc-personal-data-imported,
      // sinon la barre de progression passe directement à 100%.
      return previous.importPersonalNotesFromFile.apply(this, arguments);
    };
  }
  document.addEventListener("mtc-personal-data-imported", event => {
    const count = event && event.detail ? Number(event.detail.count || 0) : 0;
    setTimeout(() => setMessageSoon(count
      ? `Import notes/images locales terminé : ${count} élément(s) modifié(s).`
      : "Import notes/images locales terminé : rien à modifier."), 120);
  });

  function refreshExportImportLabels(){
    const exportButton = byId("exportNotesButton");
    const importButton = byId("importNotesButton");
    if(exportButton){
      exportButton.title = "Exporter seulement les notes/champs personnels et images locales";
      exportButton.setAttribute("aria-label", "Exporter notes et images locales seulement");
    }
    if(importButton){
      importButton.title = "Importer seulement les notes/champs personnels et images locales";
      importButton.setAttribute("aria-label", "Importer notes et images locales seulement");
    }
  }

  /* Audio : bouton réinjecté dans toutes les fiches, pas seulement les tuiles de la grille. */
  function containsCjk(value){ return /[\u3400-\u9fff]/.test(String(value || "")); }
  function pharmaHanziFromId(id){
    const clean = String(id || "");
    if(!clean) return "";
    try{
      const stored = localStorage.getItem(PHARMA_HANZI_PREFIX + clean);
      if(stored) return stored;
    }catch(error){}
    const herb = (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : []).find(item => item && String(item.id) === clean);
    return herb ? String(herb.hanzi || "") : "";
  }
  function acuHanziFromPoint(point){
    const details = window.POINT_DETAILS && POINT_DETAILS[String(point || "")];
    return details ? String(details.hanzi || "") : "";
  }
  function currentHeaderHanzi(header){
    const explicit = header.querySelector(".point-hanzi-inline");
    const explicitText = explicit ? explicit.textContent : "";
    if(containsCjk(explicitText)) return explicitText.trim();
    if(header.classList.contains("pharma-herb-header")) return pharmaHanziFromId(lastHerbId);
    return acuHanziFromPoint(lastPointId);
  }
  function makeAudioButton(hanzi){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mtc-audio-button mtc-audio-button-34";
    button.textContent = "🔊";
    button.dataset.audioHanzi = hanzi;
    button.title = "Écouter la prononciation";
    button.setAttribute("aria-label", "Écouter la prononciation de " + hanzi);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if(typeof window.playMtcAudioByHanzi === "function") window.playMtcAudioByHanzi(hanzi, button);
    });
    return button;
  }
  let audioEnhanceRunning = false;
  let audioEnhanceTimer = 0;
  function ensureAudioInPanel(){
    if(audioEnhanceRunning) return;
    audioEnhanceRunning = true;
    try{
      const content = byId("pointPanelContent");
      if(!content) return;
      content.querySelectorAll(".point-header").forEach(header => {
        const hanzi = currentHeaderHanzi(header);
        if(!hanzi || !containsCjk(hanzi)) return;

        const own = header.querySelector(".mtc-audio-button-34");
        const foreignButtons = Array.from(header.querySelectorAll(".mtc-audio-button:not(.mtc-audio-button-34)"));

        // Important perf : ne pas supprimer/recréer le bouton s’il est déjà correct.
        // Sinon le MutationObserver de la fiche se relance en boucle et l’ouverture devient très lente.
        if(own && own.dataset.audioHanzi === hanzi){
          foreignButtons.forEach(node => node.remove());
          return;
        }

        if(own) own.remove();
        foreignButtons.forEach(node => node.remove());
        const button = makeAudioButton(hanzi);
        const hanziNode = header.querySelector(".point-hanzi-inline");
        if(hanziNode) hanziNode.insertAdjacentElement("afterend", button);
        else header.appendChild(button);
      });
      // On ne rappelle pas refreshMtcAudioButtons ici : ce correctif doit fonctionner
      // même pour les fiches qui ne viennent pas des tuiles actuellement affichées.
      if(typeof window.__mtcStableEnhancePointPanelHeader === "function") window.__mtcStableEnhancePointPanelHeader();
    }finally{
      audioEnhanceRunning = false;
    }
  }
  function scheduleEnsureAudioInPanel(delay){
    window.clearTimeout(audioEnhanceTimer);
    audioEnhanceTimer = window.setTimeout(ensureAudioInPanel, typeof delay === "number" ? delay : 0);
  }
  function wrapOpeners(){
    if(typeof previous.openPointPanel === "function"){
      window.openPointPanel = function(point){
        lastPointId = String(point || "");
        const result = previous.openPointPanel.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
    if(typeof previous.openPointPanelDirect === "function"){
      window.openPointPanelDirect = function(point){
        lastPointId = String(point || "");
        const result = previous.openPointPanelDirect.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
    if(typeof previous.openPharmaHerbPanel === "function"){
      window.openPharmaHerbPanel = function(herbId){
        lastHerbId = String(herbId || "");
        const result = previous.openPharmaHerbPanel.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
  }

  /* Comparaison : drag tactile/souris des lignes, ordre sauvegardé. */
  function matrix(){ return document.querySelector("#comparisonPanelContent .mtc-compare-matrix"); }
  function rowKeys(mat){
    const keys = [];
    if(!mat) return keys;
    mat.querySelectorAll(":scope > .mtc-compare-row-label[data-mtc-compare-row-key]").forEach(label => {
      const key = label.getAttribute("data-mtc-compare-row-key") || "";
      if(key && !keys.includes(key)) keys.push(key);
    });
    return keys;
  }
  function nodesForRow(mat, key){
    if(!mat || !key) return [];
    return Array.from(mat.children).filter(node =>
      node && node.getAttribute && node.getAttribute("data-mtc-compare-row-key") === String(key)
    );
  }
  function rowLabelForKey(mat, key){
    if(!mat || !key) return null;
    return Array.from(mat.querySelectorAll(":scope > .mtc-compare-row-label[data-mtc-compare-row-key]")).find(node =>
      node.getAttribute("data-mtc-compare-row-key") === String(key)
    ) || null;
  }
  function rowKeyFromPoint(x, y){
    const target = document.elementFromPoint(x, y);
    const rowElement = target && target.closest && target.closest("#comparisonPanelContent [data-mtc-compare-row-key]");
    if(!rowElement) return {key:"", label:null, after:false};
    const key = rowElement.getAttribute("data-mtc-compare-row-key") || "";
    const mat = matrix();
    const label = rowLabelForKey(mat, key) || rowElement.closest(".mtc-compare-row-label");
    const rectTarget = label || rowElement;
    const rect = rectTarget.getBoundingClientRect();
    return {key, label, after:y > rect.top + rect.height / 2};
  }
  function applyRowOrder(order){
    const mat = matrix();
    if(!mat || !Array.isArray(order) || !order.length) return;
    const current = rowKeys(mat);
    const finalOrder = order.filter(key => current.includes(key));
    current.forEach(key => { if(!finalOrder.includes(key)) finalOrder.push(key); });
    const fragment = document.createDocumentFragment();
    finalOrder.forEach(key => nodesForRow(mat, key).forEach(node => fragment.appendChild(node)));
    mat.appendChild(fragment);
    try{ localStorage.setItem(storageRowOrderKey(), JSON.stringify(finalOrder)); }catch(error){}
  }
  function moveRow(fromKey, toKey, after){
    const mat = matrix();
    if(!mat || !fromKey || !toKey || fromKey === toKey) return;
    const keys = rowKeys(mat);
    const from = keys.indexOf(fromKey);
    const to = keys.indexOf(toKey);
    if(from < 0 || to < 0) return;
    const moved = keys.splice(from, 1)[0];
    let insert = keys.indexOf(toKey);
    if(insert < 0) insert = keys.length;
    if(after) insert += 1;
    keys.splice(insert, 0, moved);
    applyRowOrder(keys);
  }
  function applySavedRowOrderSoon(){
    setTimeout(() => applyRowOrder(readJson(storageRowOrderKey(), [])), 0);
  }
  function initPointerRowDrag(){
    let drag = null;
    function cleanHover(){
      document.querySelectorAll(".mtc-compare-row-label.is-row-drag-over").forEach(node => node.classList.remove("is-row-drag-over", "is-row-drag-after"));
    }
    document.addEventListener("pointerdown", event => {
      const label = event.target && event.target.closest && event.target.closest("#comparisonPanelContent .mtc-compare-row-label[data-mtc-compare-row-key]");
      if(!label || event.target.closest("button,a,input,textarea,select,[contenteditable='true']")) return;
      drag = {
        pointerId:event.pointerId,
        fromKey:label.getAttribute("data-mtc-compare-row-key") || "",
        startX:event.clientX,
        startY:event.clientY,
        active:false,
        overKey:"",
        after:false,
        label
      };
    }, true);
    document.addEventListener("pointermove", event => {
      if(!drag || drag.pointerId !== event.pointerId) return;
      const dx = Math.abs(event.clientX - drag.startX);
      const dy = Math.abs(event.clientY - drag.startY);
      if(!drag.active && Math.max(dx, dy) < 7) return;
      if(!drag.active){
        drag.active = true;
        drag.label.classList.add("is-row-dragging");
        document.body.classList.add("mtc-compare-touch-dragging");
        try{ drag.label.setPointerCapture(event.pointerId); }catch(error){}
      }
      event.preventDefault();
      cleanHover();
      const over = rowKeyFromPoint(event.clientX, event.clientY);
      if(!over.key || !over.label) return;
      drag.after = over.after;
      drag.overKey = over.key;
      over.label.classList.add("is-row-drag-over");
      over.label.classList.toggle("is-row-drag-after", drag.after);
    }, {capture:true, passive:false});
    function finish(event){
      if(!drag || (event.pointerId != null && drag.pointerId !== event.pointerId)) return;
      const current = drag;
      drag = null;
      cleanHover();
      document.body.classList.remove("mtc-compare-touch-dragging");
      if(current.label) current.label.classList.remove("is-row-dragging");
      if(current.active){
        if(!current.overKey && event.clientX != null && event.clientY != null){
          const over = rowKeyFromPoint(event.clientX, event.clientY);
          current.overKey = over.key;
          current.after = over.after;
        }
        event.preventDefault();
        event.stopPropagation();
        moveRow(current.fromKey, current.overKey, current.after);
      }
    }
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
  }

  /* ACU : restauration d'une secousse visible sur mauvaise sélection. */
  const originalShakeTile34 = window.shakeTile;
  window.shakeTile = function(tile){
    if(typeof originalShakeTile34 === "function"){
      try{ originalShakeTile34.apply(this, arguments); }catch(error){}
    }
    if(!tile || !tile.classList) return;
    tile.classList.remove("mtc-acu-shake-restore");
    void tile.offsetWidth;
    tile.classList.add("mtc-acu-shake-restore");
    setTimeout(() => tile.classList.remove("mtc-acu-shake-restore"), 420);
  };

  /* Visite guidée : textes plus courts + historique + export/import notes/images seulement. */
  function patchTour(){
    const current = window.startTour;
    if(typeof current !== "function" || current.__mtcTargetedTourWrapped) return;
    const wrapped = function(){
      const result = current.apply(this, arguments);
      try{
        if(Array.isArray(window.tourSteps) || (typeof tourSteps !== "undefined" && Array.isArray(tourSteps))){
          const steps = (typeof tourSteps !== "undefined" && Array.isArray(tourSteps)) ? tourSteps : window.tourSteps;
          const comparison = steps.find(step => step && step.selector === "#comparisonButton");
          if(comparison){
            comparison.text = isPharma()
              ? "Compare les SM côte à côte. A|B ajoute ou retire une substance ; dans le panneau, tu peux aussi réordonner les colonnes et les lignes."
              : "Compare les points côte à côte. A|B ajoute ou retire un point ; dans le panneau, tu peux aussi réordonner les colonnes et les lignes.";
          }
          const exportStep = steps.find(step => step && step.selector === "#exportNotesButton");
          if(exportStep) exportStep.text = "Exporte seulement tes notes/champs personnels et tes images locales. La base du jeu n’est pas exportée.";
          const importStep = steps.find(step => step && step.selector === "#importNotesButton");
          if(importStep) importStep.text = "Importe seulement un fichier de notes/images locales. L’historique permet de restaurer une sauvegarde locale avant import.";
          const searchStep = steps.find(step => step && step.selector === "#advancedSearchButton");
          if(searchStep && isAcu()) searchStep.text = "Filtre les points par mot-clé, catégorie, canal ou intersections. La catégorie Points de transport regroupe les cinq shū antiques.";
          if(!steps.some(step => step && step.selector === "[data-import-history-toggle]")){
            const insertAt = Math.max(0, steps.findIndex(step => step && step.selector === "#importNotesButton") + 1);
            steps.splice(insertAt > 0 ? insertAt : steps.length - 1, 0, {
              selector:"[data-import-history-toggle]",
              title:"Historique d’import",
              text:"Après un import, les pastilles restaurent une sauvegarde locale précédente. Cela concerne seulement les notes/images locales.",
              fallback:() => document.querySelector("#importNotesButton") || document.querySelector("#footerTitle"),
              position:"aboveBottom"
            });
          }
        }
      }catch(error){}
      return result;
    };
    wrapped.__mtcTargetedTourWrapped = true;
    window.startTour = wrapped;
  }

  function boot(){
    refreshExportImportLabels();
    enhanceHistoryBox();
    wrapOpeners();
    patchTour();
    initPointerRowDrag();
    applySavedRowOrderSoon();
    scheduleEnsureAudioInPanel(0);

    let historyEnhanceTimer = 0;
    const statusObserver = new MutationObserver(() => {
      window.clearTimeout(historyEnhanceTimer);
      historyEnhanceTimer = window.setTimeout(enhanceHistoryBox, 80);
    });
    if(document.body) statusObserver.observe(document.body, {childList:true, subtree:true});

    const pointContent = byId("pointPanelContent");
    if(pointContent && pointContent.dataset.mtcTargetedAudioObserver !== "1"){
      pointContent.dataset.mtcTargetedAudioObserver = "1";
      new MutationObserver(() => scheduleEnsureAudioInPanel(25)).observe(pointContent, {childList:true});
    }
  }

  document.addEventListener("mtc-personal-data-exported", () => setMessageSoon("Export créé : notes/images locales seulement. La base du jeu n’est pas exportée."));
  window.addEventListener("mtc-study-domain-changed", () => {
    setTimeout(() => {
      refreshExportImportLabels();
      enhanceHistoryBox();
      if(isAcu() && typeof window.renderAdvancedSearchPanelIfOpen === "function") window.renderAdvancedSearchPanelIfOpen();
      if(typeof window.renderStatsPanelIfOpen === "function") window.renderStatsPanelIfOpen();
      applySavedRowOrderSoon();
    }, 120);
  });
  document.addEventListener("comparison-panel-rendered", applySavedRowOrderSoon);
  const comparisonPanel = byId("comparisonPanelContent");
  if(comparisonPanel){
    new MutationObserver(() => applySavedRowOrderSoon()).observe(comparisonPanel, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();


/* --- 38-tutorial-user-texts.js --- */
/* === 38 — Textes de tuto corrigés par l'utilisatrice ===
   Patch limité aux messages de visite guidée / bulles ponctuelles.
   Ne modifie pas le moteur du jeu. */
(function(){
  "use strict";

  function isPharma(){
    try{
      return typeof window.getCurrentStudyDomain === "function" && window.getCurrentStudyDomain() === "pharmacology";
    }catch(error){
      return document.body && document.body.classList.contains("study-domain-pharmacology");
    }
  }

  function currentSteps(){
    try{
      if(typeof tourSteps !== "undefined" && Array.isArray(tourSteps)) return tourSteps;
    }catch(error){}
    return Array.isArray(window.tourSteps) ? window.tourSteps : null;
  }

  function patchStep(steps, selector, text, predicate){
    const step = steps.find(item => item && item.selector === selector && (!predicate || predicate(item)));
    if(step) step.text = text;
  }

  function insertStepOnce(steps, selector, title, text, afterSelector){
    if(!Array.isArray(steps) || steps.some(item => item && item.selector === selector)) return;
    const step = {
      selector,
      title,
      text,
      fallback:() => document.querySelector(selector) || document.querySelector("#footerTitle") || document.querySelector("#grid"),
      position:"aboveBottom"
    };
    const afterIndex = steps.findIndex(item => item && item.selector === afterSelector);
    if(afterIndex >= 0){
      steps.splice(afterIndex + 1, 0, step);
    }else{
      const endIndex = steps.findIndex(item => item && item.selector === "#grid" && item.title === " ");
      steps.splice(endIndex >= 0 ? endIndex : steps.length, 0, step);
    }
  }

  function applyUserTutorialTexts(){
    const steps = currentSteps();
    if(!Array.isArray(steps)) return;

    const pharma = isPharma();

    patchStep(
      steps,
      ".topbar-row button[onclick='newGame()']",
      pharma
        ? "Ce bouton relance une grille avec 4 classes de SM."
        : "Ce bouton relance une grille avec 4 catégories de points."
    );

    patchStep(
      steps,
      ".topbar-row button[onclick='toggleSettings()']",
      pharma
        ? "Ici tu peux ajuster les couleurs, le halo, la taille du texte et l’affichage des noms communs au survol"
        : "Ici tu peux ajuster les couleurs, le halo et la taille du texte pour que la grille soit confortable."
    );

    patchStep(
      steps,
      "#jokerBubble",
      pharma
        ? "T'as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une catégorie."
        : "T'as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une catégorie."
    );

    patchStep(
      steps,
      "#gameplayModeReviewBtn",
      pharma
        ? "La colombe active la Révision douce : plus d’astuces + des erreurs presque illimitées, pour revoir les points et les catégories sans pression. Reclique dessus pour revenir au mode normal."
        : "La colombe active la Révision douce : plus d’astuces + des erreurs presque illimitées, pour revoir les points et les catégories sans pression. Reclique dessus pour revenir au mode normal."
    );

    patchStep(
      steps,
      "#cheatsheetButton",
      pharma
        ? "Le Cheatsheet sert de mémo rapide pour les SM, les classes et les repères essentiels."
        : "Le Cheatsheet sert de mémo rapide pour les points, les catégories et les grands repères du cours."
    );

    patchStep(
      steps,
      "#statsButton",
      pharma
        ? "Les Stats montrent les SM et les classes déjà travaillées. Les analyses détaillées apparaissent seulement après 10 parties terminées."
        : "Les Stats montrent les points et les catégories déjà travaillés. Les analyses détaillées apparaissent seulement après 10 parties terminées."
    );

    patchStep(
      steps,
      "#advancedSearchButton",
      pharma
        ? "Ici tu peux filtrer les SM par nom, pinyin, classe, nature, saveur, tropisme, ou rechercher dans leurs fiches. Sens-toi libre d'experimenter!"
        : "Filtre les points par mot-clé, catégorie, canal ou intersections."
    );

    patchStep(
      steps,
      "#grid",
      "Bonnes révisions !",
      step => step && step.title === " "
    );

    insertStepOnce(
      steps,
      "#studyDomainSelect",
      "ACU / PHARMA",
      "Ici tu peux changer de matiere en cours de route.",
      ".topbar-row button[onclick='newGame()']"
    );

    insertStepOnce(
      steps,
      "#fullscreenToggleButton",
      "Plein écran",
      "Ici tu peux mettre le jeu en plein écran",
      "#studyDomainSelect"
    );

    insertStepOnce(
      steps,
      "#mtcAudioModeToggle",
      "Audio",
      "Ce bouton permet de jouer les fichiers audios de prononciation pour les points valides.",
      "#fullscreenToggleButton"
    );
  }

  function wrapStartTour(){
    const current = window.startTour;
    if(typeof current !== "function" || current.__mtcUserTutorialTextsWrapped) return;
    const wrapped = function(){
      const result = current.apply(this, arguments);
      try{ applyUserTutorialTexts(); }catch(error){}
      return result;
    };
    wrapped.__mtcUserTutorialTextsWrapped = true;
    window.startTour = wrapped;
  }

  function normalizeHintText(title, text){
    const rawTitle = String(title || "").trim();
    const rawText = String(text || "");

    if(rawTitle === "Catégorie trouvée" || rawText.includes("Bien joué. En cliquant sur un point rangé ici")){
      return "Bien joué. Clique sur un point pour afficher sa fiche détaillée!";
    }
    if(rawText.includes("Tu peux rechercher un point par mot-clé, puis préciser où chercher")){
      return "Tu peux rechercher un point par mot-clé, puis préciser où chercher : nom, fonctions, indications ou notes...";
    }
    if(rawText.includes("Les points sont côte à côte pour comparer rapidement")){
      return "Les points sont côte à côte pour comparer rapidement leurs catégories, correspondances, etc.";
    }
    if(rawText.includes("En cliquant sur une ampoule, tu ouvres un post-it")){
      return "En cliquant sur une ampoule, tu ouvres un post-it pour réviser la catégorie. Psst: Tu peux le déplacer.";
    }
    if(rawText.includes("Les traits colorés relient les catégories qui fonctionnent ensemble")){
      return "Les traits colorés relient les catégories qui fonctionnent ensemble. Clique sur + pour voir la fiche de l’association.";
    }
    return text;
  }

  function wrapProgressHints(){
    const current = window.showProgressHintSoon;
    if(typeof current !== "function" || current.__mtcUserTutorialTextsWrapped) return;
    const wrapped = function(id, selector, title, text, options, delay){
      return current.call(this, id, selector, title, normalizeHintText(title, text), options, delay);
    };
    wrapped.__mtcUserTutorialTextsWrapped = true;
    window.showProgressHintSoon = wrapped;
  }

  function boot(){
    wrapStartTour();
    wrapProgressHints();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();


/* --- 39-mobile-game-audio-fix.js --- */
/* === 39-mobile-game-audio-fix.js
   Correctif mobile : l'audio automatique pendant la partie doit lancer
   directement un fichier réellement présent dans audio-manifest.js.

   Pourquoi : sur mobile, si le premier candidat audio n'existe pas, les
   essais suivants arrivent après un rejet asynchrone et peuvent être bloqués
   par la règle "user gesture". On met donc les fichiers du manifest en tête. === */
(function(){
  "use strict";

  const AUDIO_BASE_PATH = "audio/";
  let currentGameAudio = null;
  let gameAudioSerial = 0;

  function normalizeHanzi(value){
    const raw = String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const cjk = raw.match(/[\u3400-\u9fff]+/g);
    return cjk ? cjk.join("") : raw;
  }

  function containsCjk(value){
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function audioUrl(filename){
    return AUDIO_BASE_PATH + String(filename || "").split("/").map(encodeURIComponent).join("/");
  }

  function addUnique(list, value){
    const clean = String(value || "").trim();
    if(clean && !list.includes(clean)) list.push(clean);
  }

  function getManifest(){
    return window.MTC_AUDIO_MANIFEST || window.mtcAudioManifest || {files:[], byHanzi:{}};
  }

  function manifestFilesSet(){
    const manifest = getManifest();
    return new Set(Array.isArray(manifest.files) ? manifest.files.map(String) : []);
  }

  function manifestByHanziList(hanzi){
    const manifest = getManifest();
    const byHanzi = manifest && manifest.byHanzi && typeof manifest.byHanzi === "object" ? manifest.byHanzi : {};
    const direct = byHanzi[hanzi];
    if(Array.isArray(direct)) return direct.map(String).filter(Boolean);
    return direct ? [String(direct)] : [];
  }

  function orderedGameCandidates(hanzi){
    const clean = normalizeHanzi(hanzi);
    const out = [];
    if(!clean) return out;

    // 1) Candidats explicitement indexés pour ce hanzi.
    manifestByHanziList(clean).forEach(item => addUnique(out, item));

    // 2) Candidats calculés par le module audio principal.
    const generated = [];
    try{
      if(typeof window.mtcAudioCandidatesForHanzi === "function"){
        window.mtcAudioCandidatesForHanzi(clean).forEach(item => addUnique(generated, item));
      }
    }catch(error){}

    // 3) Parmi les candidats calculés, on met d'abord ceux dont le fichier est
    // dans le manifest. C'est le point crucial pour Safari/Chrome mobile.
    const files = manifestFilesSet();
    generated.filter(item => files.has(String(item))).forEach(item => addUnique(out, item));
    generated.filter(item => !files.has(String(item))).forEach(item => addUnique(out, item));

    return out;
  }

  function stopGameAudio(){
    gameAudioSerial += 1;
    if(currentGameAudio){
      try{ currentGameAudio.pause(); currentGameAudio.currentTime = 0; }catch(error){}
    }
    currentGameAudio = null;
  }

  function playCandidateNow(candidates, index, serial){
    if(serial !== gameAudioSerial) return false;
    if(index >= candidates.length) return false;

    const filename = candidates[index];
    const audio = new Audio();
    currentGameAudio = audio;
    audio.preload = "auto";
    audio.volume = 0.42;

    let settled = false;
    let timeoutId = 0;
    function cleanup(){
      if(timeoutId) window.clearTimeout(timeoutId);
      audio.removeEventListener("error", onError);
    }
    function fail(){
      if(settled || serial !== gameAudioSerial) return;
      settled = true;
      cleanup();
      try{ audio.pause(); }catch(error){}
      // Si le manifest est correct, on ne devrait presque jamais arriver ici.
      // On garde un fallback pour ordinateur / Android tolérant.
      playCandidateNow(candidates, index + 1, serial);
    }
    function onError(){ fail(); }

    audio.addEventListener("error", onError, {once:true});
    audio.addEventListener("ended", () => {
      if(serial !== gameAudioSerial) return;
      if(currentGameAudio === audio) currentGameAudio = null;
    }, {once:true});

    timeoutId = window.setTimeout(fail, 3200);
    audio.src = audioUrl(filename);

    let promise = null;
    try{ promise = audio.play(); }
    catch(error){ fail(); return true; }

    if(promise && typeof promise.catch === "function"){
      promise.then(() => {
        if(settled || serial !== gameAudioSerial) return;
        settled = true;
        cleanup();
      }).catch(fail);
    }else{
      settled = true;
      cleanup();
    }
    return true;
  }

  function playGameAudioHanzi(hanzi){
    try{
      if(typeof window.isMtcAudioModeEnabled === "function" && !window.isMtcAudioModeEnabled()) return false;
    }catch(error){ return false; }

    const clean = normalizeHanzi(hanzi);
    if(!clean || !containsCjk(clean)) return false;

    const candidates = orderedGameCandidates(clean);
    if(!candidates.length) return false;

    stopGameAudio();
    const serial = gameAudioSerial + 1;
    gameAudioSerial = serial;
    return playCandidateNow(candidates, 0, serial);
  }

  // On remplace seulement le lecteur automatique pendant la partie.
  // Les boutons audio de fiches gardent le module 32 intact.
  window.mtcAudioModePlayHanzi = playGameAudioHanzi;
  window.stopMtcGameAudio = stopGameAudio;
})();


/* --- 40-comparison-loading-history.js --- */
/* === 40-comparison-loading-history.js
   - Ouvre le panneau comparaison immédiatement avec une barre DOS avant le rendu lourd.
   - Ne modifie pas le moteur de comparaison : il décale seulement le rendu pour que l'UI respire.
*/
(function(){
  "use strict";

  const previousOpen = window.openComparisonPanel;
  const previousToggle = window.toggleComparisonPanel;
  const previousRender = window.renderComparisonPanel;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function waitFrame(){
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function filledCount(){
    try{
      const key = isPharma() ? "mtc_pharma_comparison_slots_v1" : "connections_mtc_comparison_points_v1";
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean).length : 0;
    }catch(error){ return 0; }
  }

  function barText(percent){
    const total = 30;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const filled = Math.max(0, Math.min(total, Math.round((p / 100) * total)));
    return "[" + "█".repeat(filled) + "░".repeat(total - filled) + "]";
  }

  function loadingHtml(percent, status){
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    const count = filledCount();
    const label = isPharma() ? "SM" : "POINTS";
    return `
      <div class="mtc-comparison-loading" aria-live="polite">
        <div class="mtc-compare-progress-dos" role="status" aria-label="Chargement du panneau de comparaison">
          <div class="mtc-compare-progress-head">
            <span class="mtc-compare-progress-prompt">C:\\MTC\\COMPARE&gt;</span>
            <span>${String(p).padStart(3,"0")}%</span>
          </div>
          <span class="mtc-compare-progress-status">${esc(count ? `${count} ${label} EN COMPARAISON` : "PANNEAU VIDE")}</span>
          <span class="mtc-compare-progress-bar">${barText(p)}</span>
          <span class="mtc-compare-progress-status">${esc(status || "PRÉPARATION DU TABLEAU...")}</span>
        </div>
        <p class="mtc-comparison-loading-note">Chargement de la comparaison…</p>
      </div>
    `;
  }

  function setLoading(percent, status){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    content.innerHTML = loadingHtml(percent, status);
  }

  async function renderComparisonWithBreathingRoom(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;

    if(typeof window.closeAllBottomPanels === "function"){
      window.closeAllBottomPanels("comparisonPanel");
    }
    panel.classList.add("open");
    setLoading(4, "OUVERTURE DU PANNEAU...");

    // Deux frames : la première ouvre le panneau, la seconde laisse la barre se peindre.
    await waitFrame();
    setLoading(18, "LECTURE DES ÉLÉMENTS...");
    await waitFrame();
    setLoading(36, "CONSTRUCTION DES LIGNES...");
    await waitFrame();

    try{
      if(typeof previousRender === "function"){
        previousRender.apply(window, arguments);
      }else if(typeof previousOpen === "function"){
        previousOpen.apply(window, arguments);
      }
    }catch(error){
      console.error("Erreur rendu comparaison", error);
      setLoading(100, "ERREUR DE CHARGEMENT.");
      return;
    }

    // Petit signal visuel si le rendu a été assez rapide pour que la barre soit encore visible.
    requestAnimationFrame(() => {
      const loading = content.querySelector(".mtc-comparison-loading");
      if(loading) setLoading(100, "COMPARAISON PRÊTE.");
    });
  }

  window.openComparisonPanel = function(){
    return renderComparisonWithBreathingRoom.apply(this, arguments);
  };

  window.toggleComparisonPanel = function(){
    const panel = byId("comparisonPanel");
    if(!panel){
      if(typeof previousToggle === "function") return previousToggle.apply(this, arguments);
      return;
    }
    if(panel.classList.contains("open")){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openComparisonPanel.apply(this, arguments);
  };
})();


/* --- 41-force-comparison-history-fix.js --- */
/* === 41-force-comparison-history-fix.js
   Correctif plus explicite :
   1) la comparaison s'ouvre immédiatement avec une barre visible, puis le tableau lourd se rend après un court délai ;
   2) l'historique import est forcé sous la footbar, avec un style injecté APRÈS les styles dynamiques précédents.
*/
(function(){
  "use strict";

  const LOADING_CLASS = "mtc-comparison-force-loading";
  let comparisonRenderTimer = 0;
  let comparisonProgressTimer = 0;
  let comparisonOpening = false;

  function byId(id){ return document.getElementById(id); }

  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function countItems(){
    try{
      const key = isPharma() ? "mtc_pharma_comparison_slots_v1" : "connections_mtc_comparison_points_v1";
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(items) ? items.filter(Boolean).length : 0;
    }catch(error){
      return 0;
    }
  }

  function bar(percent){
    const total = 26;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const filled = Math.round((p / 100) * total);
    return "[" + "█".repeat(filled) + "░".repeat(Math.max(0, total - filled)) + "]";
  }

  function comparisonLoadingHtml(percent, status){
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    const label = isPharma() ? "SUBSTANCES" : "POINTS";
    const count = countItems();
    return `
      <div class="${LOADING_CLASS}" role="status" aria-live="polite">
        <div class="mtc-force-progress-dos">
          <div class="mtc-force-progress-head">
            <span>C:\\MTC\\A-B&gt; ${esc(status || "chargement")}</span>
            <span>${String(p).padStart(3,"0")}%</span>
          </div>
          <div class="mtc-force-progress-bar">${bar(p)}</div>
          <div class="mtc-force-progress-sub">${esc(count ? `${count} ${label} À COMPARER` : "PANNEAU COMPARAISON")}</div>
        </div>
      </div>
    `;
  }

  function paintComparisonLoading(percent, status){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;
    panel.classList.add("open", "mtc-comparison-is-preloading");
    content.innerHTML = comparisonLoadingHtml(percent, status);
  }

  function clearComparisonTimers(){
    if(comparisonRenderTimer){ window.clearTimeout(comparisonRenderTimer); comparisonRenderTimer = 0; }
    if(comparisonProgressTimer){ window.clearTimeout(comparisonProgressTimer); comparisonProgressTimer = 0; }
  }

  function renderComparisonAfterLoading(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;
    paintComparisonLoading(58, "CONSTRUCTION DU TABLEAU...");

    comparisonRenderTimer = window.setTimeout(() => {
      comparisonOpening = false;
      panel.classList.remove("mtc-comparison-is-preloading");
      try{
        if(typeof window.renderComparisonPanel === "function"){
          window.renderComparisonPanel();
        }
      }catch(error){
        console.error("Erreur de rendu du panneau comparaison", error);
        content.innerHTML = comparisonLoadingHtml(100, "ERREUR DE CHARGEMENT");
      }
    }, 160);
  }

  function forceOpenComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    clearComparisonTimers();
    comparisonOpening = true;

    if(typeof window.closeAllBottomPanels === "function"){
      try{ window.closeAllBottomPanels("comparisonPanel"); }catch(error){}
    }

    // Affichage immédiat : on ouvre d'abord, on rend ensuite.
    paintComparisonLoading(6, "OUVERTURE...");

    comparisonProgressTimer = window.setTimeout(() => paintComparisonLoading(28, "LECTURE DES DONNÉES..."), 80);
    comparisonRenderTimer = window.setTimeout(renderComparisonAfterLoading, 230);
  }

  function forceToggleComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open") && !comparisonOpening){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    forceOpenComparisonPanel();
  }

  // Remplace les fonctions globales, sans appeler les anciens wrappers qui pouvaient rendre immédiatement.
  window.openComparisonPanel = forceOpenComparisonPanel;
  window.toggleComparisonPanel = forceToggleComparisonPanel;

  function bindComparisonButton(){
    const button = byId("comparisonButton");
    if(!button || button.__mtcForceComparisonBound) return;
    button.__mtcForceComparisonBound = true;
    button.removeAttribute("onclick");
    button.onclick = null;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      forceToggleComparisonPanel();
    }, true);
  }

  function injectLateStyle(){
    if(byId("mtcForceComparisonHistoryStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcForceComparisonHistoryStyle";
    style.textContent = `
      #comparisonPanel.mtc-comparison-is-preloading{
        z-index:9800 !important;
      }
      #comparisonPanelContent .${LOADING_CLASS}{
        padding:16px 10px 18px !important;
        min-height:86px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-sizing:border-box !important;
      }
      #comparisonPanelContent .mtc-force-progress-dos{
        width:min(760px, calc(100vw - 34px)) !important;
        padding:10px 12px !important;
        border:1px solid #72ff72 !important;
        background:#010501 !important;
        color:#72ff72 !important;
        font-family:"Courier New", Courier, ui-monospace, Menlo, Consolas, monospace !important;
        font-size:12px !important;
        line-height:1.25 !important;
        letter-spacing:.035em !important;
        text-shadow:0 0 5px rgba(114,255,114,.48) !important;
        box-shadow:0 0 0 1px rgba(114,255,114,.15), 0 0 18px rgba(114,255,114,.18), 0 10px 28px rgba(0,0,0,.24) !important;
        box-sizing:border-box !important;
      }
      #comparisonPanelContent .mtc-force-progress-head{
        display:flex !important;
        justify-content:space-between !important;
        gap:12px !important;
        white-space:nowrap !important;
        margin-bottom:4px !important;
      }
      #comparisonPanelContent .mtc-force-progress-bar{
        white-space:nowrap !important;
        overflow:hidden !important;
        margin:3px 0 !important;
      }
      #comparisonPanelContent .mtc-force-progress-sub{
        opacity:.88 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      @media(max-width:650px){
        #comparisonPanelContent .mtc-force-progress-dos{
          font-size:10px !important;
          padding:8px 9px !important;
          letter-spacing:.018em !important;
        }
      }

      /* La ligne d'historique doit être SOUS la footbar, pas dessus. */
      #footerTitle{
        bottom:calc(env(safe-area-inset-bottom, 0px) + 36px) !important;
      }
      #mtcPersonalDataStatus,
      #mtcPersonalDataStatus.visible{
        position:fixed !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 3px) !important;
        inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 3px) 50% !important;
        transform:translateX(-50%) !important;
        width:max-content !important;
        max-width:calc(100vw - 14px) !important;
        text-align:center !important;
        z-index:9001 !important;
        font-size:8.8px !important;
        line-height:1.12 !important;
        padding:1px 4px !important;
        margin:0 !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 58%, transparent) !important;
        pointer-events:auto !important;
      }
      #mtcPersonalDataStatus.visible{
        opacity:.74 !important;
      }
      #mtcPersonalDataStatus.history-open{
        z-index:1000002 !important;
        max-width:calc(100vw - 14px) !important;
      }
      #mtcPersonalDataStatus .mtc-status-history-link{
        text-decoration:none !important;
        border-bottom:1px dotted currentColor !important;
        margin-left:.45em !important;
      }
      #mtcPersonalDataStatus .mtc-status-history-popover{
        position:absolute !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(100% + 5px) !important;
        transform:translateX(-50%) !important;
        min-width:min(92vw, 420px) !important;
        max-width:min(96vw, 680px) !important;
        display:none;
        justify-content:center !important;
        border-top:0 !important;
        border-bottom:1px solid currentColor !important;
        padding:5px 7px !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 88%, transparent) !important;
        backdrop-filter:blur(8px) !important;
        -webkit-backdrop-filter:blur(8px) !important;
      }
      #mtcPersonalDataStatus.history-open .mtc-status-history-popover{
        display:flex !important;
      }
      @media(max-width:699px){
        #footerTitle{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 39px) !important;
        }
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 2px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 2px) 50% !important;
          max-width:calc(100vw - 10px) !important;
          font-size:7.8px !important;
          opacity:.68 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectLateStyle();
    bindComparisonButton();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }

  // Si un autre script recrée/modifie la footbar, on rebinde sans bruit.
  const observer = new MutationObserver(() => bindComparisonButton());
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();


/* --- 42-pharma-mobile-esprit-history.js --- */
/* === 42-pharma-mobile-esprit-history.js
   Correctifs ciblés :
   - PHARMA mobile fin de jeu : tuiles validées sans fond rond + bulle ESPRIT lisible, large et contenue dans l'écran.
   - Historique import : position intermédiaire, moins basse que le patch 41. === */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isMobileLike(){
    try{
      return !!(window.matchMedia && (
        window.matchMedia("(max-width: 699px)").matches ||
        window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(pointer: coarse)").matches
      ));
    }catch(error){
      return window.innerWidth <= 699;
    }
  }

  function injectStyle(){
    if(byId("mtcPharmaMobileEspritHistoryStyle42")) return;
    const style = document.createElement("style");
    style.id = "mtcPharmaMobileEspritHistoryStyle42";
    style.textContent = `
      /* Historique : position intermédiaire entre l'ancien chevauchement et le bas d'écran. */
      #mtcPersonalDataStatus,
      #mtcPersonalDataStatus.visible{
        position:fixed !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 18px) !important;
        inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 18px) 50% !important;
        transform:translateX(-50%) !important;
        width:max-content !important;
        max-width:calc(100vw - 14px) !important;
        text-align:center !important;
        z-index:9001 !important;
        opacity:.74 !important;
      }
      @media(max-width:699px){
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 16px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 16px) 50% !important;
          opacity:.72 !important;
        }
      }

      /* PHARMA mobile : ne plus voir les fonds ronds des tuiles de fin. */
      @media(max-width:699px), (hover:none), (pointer:coarse){
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-row .solved-points{
          gap:7px !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point,
        html[data-study-domain="pharmacology"].pharma-show-solved-nature body.game-finished .pharma-solved-point[data-pharma-nature-tier],
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point[data-pharma-nature-tier]{
          background:transparent !important;
          background-color:transparent !important;
          box-shadow:none !important;
          border-color:transparent !important;
          border-radius:8px !important;
          padding:5px 24px 5px 3px !important;
          min-height:0 !important;
          line-height:1.08 !important;
          overflow:visible !important;
          text-align:center !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:hover,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:focus,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:active{
          transform:none !important;
          box-shadow:none !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-chinese-name,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-common-name,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-tropism,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-toxicity{
          max-width:100% !important;
          overflow-wrap:anywhere !important;
          word-break:normal !important;
          hyphens:auto !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-chinese-name{
          font-size:.92em !important;
          line-height:1.08 !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-common-name{
          font-size:.58em !important;
          line-height:1.05 !important;
          margin-top:1px !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-info-button{
          top:-2px !important;
          right:0 !important;
          width:21px !important;
          height:21px !important;
          min-width:21px !important;
          min-height:21px !important;
          padding:0 !important;
          border:0 !important;
          background:transparent !important;
          box-shadow:none !important;
          color:var(--text-color) !important;
          font-size:.92rem !important;
          line-height:1 !important;
          opacity:.82 !important;
        }

        /* On remplace le pseudo-tooltip étroit par une vraie bulle fixe. */
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point[data-esprit-tooltip]::after,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point.pharma-synthesis-open::after{
          display:none !important;
          content:none !important;
          visibility:hidden !important;
          opacity:0 !important;
        }
      }

      #mtcPharmaEspritMobileBubble{
        position:fixed !important;
        left:10px !important;
        right:10px !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 72px) !important;
        width:auto !important;
        max-width:none !important;
        max-height:min(46vh, 320px) !important;
        overflow:auto !important;
        box-sizing:border-box !important;
        padding:12px 14px !important;
        border-radius:16px !important;
        border:1px solid color-mix(in srgb, var(--shadow-color, currentColor) 34%, transparent) !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 94%, transparent) !important;
        color:var(--text-color, #111) !important;
        box-shadow:0 16px 34px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.04) !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
        font-family:var(--ui-font-family, system-ui, sans-serif) !important;
        font-size:.93rem !important;
        line-height:1.36 !important;
        font-weight:520 !important;
        text-align:left !important;
        white-space:pre-wrap !important;
        overflow-wrap:anywhere !important;
        z-index:1000004 !important;
        opacity:0 !important;
        visibility:hidden !important;
        pointer-events:none !important;
        transform:translateY(8px) !important;
        transition:opacity .14s ease, transform .14s ease, visibility .14s ease !important;
      }
      #mtcPharmaEspritMobileBubble.visible{
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
        transform:translateY(0) !important;
      }
      #mtcPharmaEspritMobileBubble::before{
        content:"ESPRIT";
        display:block;
        margin:0 0 6px;
        opacity:.52;
        font-size:.68rem;
        line-height:1;
        letter-spacing:.08em;
        font-weight:800;
      }
    `;
    document.head.appendChild(style);
  }

  function bubble(){
    let node = byId("mtcPharmaEspritMobileBubble");
    if(node) return node;
    node = document.createElement("div");
    node.id = "mtcPharmaEspritMobileBubble";
    node.setAttribute("role", "note");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
    return node;
  }

  function hideBubble(){
    const node = byId("mtcPharmaEspritMobileBubble");
    if(node){
      node.classList.remove("visible");
      node.dataset.sourceHerbId = "";
    }
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(item => item.classList.remove("pharma-synthesis-open"));
  }

  function showBubbleFor(item){
    const text = String(item && item.getAttribute("data-esprit-tooltip") || "").trim();
    if(!text) return;
    const node = bubble();
    const id = item.getAttribute("data-herb-id") || text.slice(0, 80);
    const already = node.classList.contains("visible") && node.dataset.sourceHerbId === id;
    if(already){
      hideBubble();
      return;
    }
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(other => {
      if(other !== item) other.classList.remove("pharma-synthesis-open");
    });
    item.classList.add("pharma-synthesis-open");
    node.textContent = text;
    node.dataset.sourceHerbId = id;
    node.classList.add("visible");
  }

  function normalizeButtons(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-info-button").forEach(button => {
      if(button.textContent !== "+") button.textContent = "+";
      button.title = "Afficher / masquer l’esprit";
      button.setAttribute("aria-label", "Afficher / masquer l’esprit de cette substance");
    });
  }

  function bind(){
    document.addEventListener("click", event => {
      const button = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
      if(button && isPharma() && isMobileLike()){
        const item = button.closest(".pharma-solved-point[data-esprit-tooltip]");
        if(item){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          showBubbleFor(item);
          return;
        }
      }
      if(isMobileLike()){
        const insideBubble = event.target && event.target.closest && event.target.closest("#mtcPharmaEspritMobileBubble");
        const insideButton = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
        if(!insideBubble && !insideButton) hideBubble();
      }
    }, true);

    document.addEventListener("keydown", event => {
      if(event.key === "Escape") hideBubble();
    });

    window.addEventListener("resize", () => {
      const node = byId("mtcPharmaEspritMobileBubble");
      if(node && node.classList.contains("visible") && !isMobileLike()) hideBubble();
    });

    const observer = new MutationObserver(mutations => {
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node => {
          if(node.nodeType === 1) normalizeButtons(node);
        });
      }
    });
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
  }

  function init(){
    injectStyle();
    normalizeButtons(document);
    bind();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();


/* --- 44-simple-replay-history-mobile.js --- */
/* 44 — Bouton léger pour rejouer exactement la même grille, sans lasso */
(function(){
  "use strict";

  const state = {acu:null, pharma:null, bodyObserver:null, solvedObserver:null};

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isFinished(){ return document.body.classList.contains("game-finished") || document.body.classList.contains("game-complete"); }

  function shuffledCopy(items){
    const copy = Array.isArray(items) ? items.slice() : [];
    for(let index = copy.length - 1; index > 0; index -= 1){
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function cloneAcuSnapshot(){
    try{
      if(typeof solution === "undefined" || !Array.isArray(solution) || !solution.length) return null;
      const groups = solution.map(group => ({
        key:String(group.key || ""),
        name:String(group.name || group.key || ""),
        points:Array.isArray(group.points) ? group.points.map(String) : [],
        color:(typeof categoryColors !== "undefined" && categoryColors && group.key) ? categoryColors[group.key] : ""
      })).filter(group => group.points.length === 4);
      if(groups.length !== 4) return null;
      const domBoard = [...document.querySelectorAll("#grid .tile[data-point]")]
        .map(tile => String(tile.dataset.point || ""))
        .filter(Boolean);
      const fallbackBoard = groups.flatMap(group => group.points);
      const board = domBoard.length === 16 ? domBoard : fallbackBoard;
      return {type:"acu", groups, board};
    }catch(error){
      return null;
    }
  }

  function clonePharmaSnapshot(){
    try{
      if(typeof window.getCurrentPharmaGameState !== "function") return null;
      const current = window.getCurrentPharmaGameState();
      if(!current || !Array.isArray(current.board) || !current.board.length || !Array.isArray(current.groups) || !current.groups.length) return null;
      return {
        type:"pharma",
        board:current.board.map(herb => Object.assign({}, herb)),
        groups:current.groups.map(group => ({
          key:String(group.key || group.classCode || ""),
          name:String(group.name || group.key || ""),
          classCode:String(group.classCode || group.key || ""),
          herbIds:Array.isArray(group.herbIds) ? group.herbIds.map(String) : [],
          size:Number(group.size || 0)
        })).filter(group => group.herbIds.length)
      };
    }catch(error){
      return null;
    }
  }

  function captureCurrentGame(){
    const snap = isPharma() ? clonePharmaSnapshot() : cloneAcuSnapshot();
    if(snap){
      if(snap.type === "pharma") state.pharma = snap;
      else state.acu = snap;
    }
    return snap;
  }

  function installCaptureWrappers(){
    if(typeof window.newGame === "function" && !window.newGame.__mtcSimpleReplayCapture){
      const original = window.newGame;
      const wrapped = function(){
        removeReplayButton();
        const result = original.apply(this, arguments);
        window.setTimeout(captureCurrentGame, 120);
        window.setTimeout(removeReplayButtonIfNeeded, 160);
        return result;
      };
      wrapped.__mtcSimpleReplayCapture = true;
      window.newGame = wrapped;
    }

    if(typeof window.startPharmaGame === "function" && !window.startPharmaGame.__mtcSimpleReplayCapture){
      const originalPharma = window.startPharmaGame;
      const wrappedPharma = function(){
        removeReplayButton();
        const result = originalPharma.apply(this, arguments);
        window.setTimeout(captureCurrentGame, 120);
        window.setTimeout(removeReplayButtonIfNeeded, 160);
        return result;
      };
      wrappedPharma.__mtcSimpleReplayCapture = true;
      window.startPharmaGame = wrappedPharma;
    }
  }

  function resetSharedInterface(){
    try{ if(typeof closePointPanelCompletely === "function") closePointPanelCompletely(); }catch(error){}
    try{ if(typeof removeAssociationLinks === "function") removeAssociationLinks(); }catch(error){}
    document.querySelectorAll(".association-postit, .category-postit").forEach(el => el.remove());
    document.body.classList.remove("game-complete", "game-finished", "panel-open");
  }

  function startAcuReplay(){
    const snap = state.acu || cloneAcuSnapshot();
    if(!snap || !Array.isArray(snap.groups) || snap.groups.length !== 4 || !Array.isArray(snap.board) || snap.board.length !== 16){
      alert("Impossible de rejouer cette grille.");
      return false;
    }

    resetSharedInterface();

    try{ mistakeCount = 0; }catch(error){}
    try{ cheatCount = 0; }catch(error){}
    try{ currentAcuRunErrors = []; }catch(error){}
    try{ gameOver = false; }catch(error){}
    try{ selected = []; }catch(error){}
    try{ solvedCount = 0; }catch(error){}
    try{ hintCategory = null; hintStep = 0; }catch(error){}

    if(typeof message !== "undefined" && message) message.textContent = "";
    if(typeof hint !== "undefined" && hint) hint.textContent = "";
    if(typeof solved !== "undefined" && solved) solved.innerHTML = "";
    if(typeof grid !== "undefined" && grid) grid.innerHTML = "";
    if(typeof finalGuess !== "undefined" && finalGuess){
      finalGuess.style.display = "none";
      finalGuess.dataset.correctKey = "";
    }
    if(typeof finalGuessChoices !== "undefined" && finalGuessChoices) finalGuessChoices.innerHTML = "";

    try{
      if(!Array.isArray(CATEGORY_COLORS) || CATEGORY_COLORS.length < 4){
        generateCategoryColors();
      }
    }catch(error){}

    try{ solution = []; }catch(error){}
    try{ categoryColors = {}; }catch(error){}

    snap.groups.forEach((group, index) => {
      const copy = {
        key:group.key,
        name:group.name,
        points:group.points.slice(0, 4),
        solved:false
      };
      try{ categoryColors[copy.key] = group.color || (CATEGORY_COLORS && CATEGORY_COLORS[index]) || "#cccccc"; }catch(error){}
      try{ solution.push(copy); }catch(error){}
    });

    const replayBoard = shuffledCopy(snap.board);
    replayBoard.forEach(point => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.point = point;
      tile.innerHTML = `<span>${typeof formatPointCode === "function" ? formatPointCode(point) : point}</span>`;
      tile.onclick = () => toggleTile(tile, point);
      grid.appendChild(tile);
    });

    try{ if(typeof updateGameStatus === "function") updateGameStatus(); }catch(error){}
    try{ if(typeof recordStatsGameStarted === "function") recordStatsGameStarted(solution); }catch(error){}

    state.acu = {
      type:"acu",
      groups:snap.groups.map(group => ({key:group.key, name:group.name, points:group.points.slice(), color:group.color || ""})),
      board:replayBoard.slice()
    };
    removeReplayButton();
    return true;
  }

  function startPharmaReplay(){
    const snap = state.pharma || clonePharmaSnapshot();
    if(!snap || typeof window.startPharmaReplayGame !== "function"){
      alert("Impossible de rejouer cette grille.");
      return false;
    }
    resetSharedInterface();
    const replaySnap = Object.assign({}, snap, {board:shuffledCopy(snap.board)});
    window.startPharmaReplayGame(replaySnap);
    window.setTimeout(captureCurrentGame, 120);
    removeReplayButton();
    return true;
  }

  function replaySameGrid(){
    const before = isPharma() ? state.pharma : state.acu;
    if(!before) captureCurrentGame();
    return isPharma() ? startPharmaReplay() : startAcuReplay();
  }

  function ensureReplayButton(){
    if(!isFinished()) return;
    const messageEl = byId("message");
    const solvedEl = byId("solved");
    if(!messageEl || !solvedEl || !solvedEl.querySelector(".solved-point")) return;
    if(isPharma() && !state.pharma) captureCurrentGame();
    if(!isPharma() && !state.acu) captureCurrentGame();
    if(byId("mtcReplaySameGridWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "mtcReplaySameGridWrap";
    wrap.innerHTML = `
      <button type="button" id="mtcReplaySameGridButton" title="Rejouer les mêmes tuiles mélangées">
        <span aria-hidden="true">↻</span><span class="mtc-replay-label">même grille</span>
      </button>
    `;
    messageEl.insertAdjacentElement("afterend", wrap);
    byId("mtcReplaySameGridButton")?.addEventListener("click", replaySameGrid, {passive:false});
  }

  function removeReplayButton(){
    byId("mtcReplaySameGridWrap")?.remove();
  }

  function removeReplayButtonIfNeeded(){
    if(!isFinished()) removeReplayButton();
  }

  function init(){
    installCaptureWrappers();
    window.setTimeout(captureCurrentGame, 420);

    const solvedEl = byId("solved");
    state.bodyObserver = new MutationObserver(() => {
      installCaptureWrappers();
      ensureReplayButton();
      removeReplayButtonIfNeeded();
    });
    state.bodyObserver.observe(document.body, {attributes:true, attributeFilter:["class"]});

    if(solvedEl){
      state.solvedObserver = new MutationObserver(() => {
        ensureReplayButton();
        removeReplayButtonIfNeeded();
      });
      state.solvedObserver.observe(solvedEl, {childList:true});
    }

    document.addEventListener("click", event => {
      if(event.target && event.target.closest && event.target.closest("#mtcReplaySameGridButton")){
        event.preventDefault();
      }
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();


/* --- 45-baskerville-esprit-replay.js --- */
/* 45 — Bulle ESPRIT mobile : titre substance en Baskerville + libellé ESPRIT en couleur halo */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function escapeHtml(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectStyle(){
    if(byId("mtcEspritBaskervilleStyle45")) return;
    const style = document.createElement("style");
    style.id = "mtcEspritBaskervilleStyle45";
    style.textContent = `
      #mtcPharmaEspritMobileBubble::before{
        content:none !important;
        display:none !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-bubble-title{
        display:flex !important;
        align-items:baseline !important;
        justify-content:space-between !important;
        gap:10px !important;
        margin:0 0 8px !important;
        padding:0 0 6px !important;
        border-bottom:1px solid color-mix(in srgb, var(--shadow-color, currentColor) 22%, transparent) !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-substance{
        min-width:0 !important;
        color:var(--text-color, currentColor) !important;
        font-family:Baskerville, "Libre Baskerville", Georgia, serif !important;
        font-size:1.12rem !important;
        line-height:1.08 !important;
        font-weight:650 !important;
        overflow-wrap:anywhere !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-tag{
        flex:0 0 auto !important;
        color:var(--shadow-color, currentColor) !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.64rem !important;
        line-height:1 !important;
        font-weight:850 !important;
        letter-spacing:.12em !important;
        text-transform:uppercase !important;
        opacity:.92 !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-bubble-body{
        color:var(--text-color, currentColor) !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.93rem !important;
        line-height:1.38 !important;
        font-weight:520 !important;
        white-space:pre-wrap !important;
        overflow-wrap:anywhere !important;
      }
      html:not([data-study-domain="pharmacology"]) body.game-complete #solved .solved-point,
      html:not([data-study-domain="pharmacology"]) body.game-complete #solved .solved-point *,
      html:not([data-study-domain="pharmacology"]) body.game-finished #solved .solved-point,
      html:not([data-study-domain="pharmacology"]) body.game-finished #solved .solved-point *{
        font-family:Baskerville, "Libre Baskerville", Georgia, serif !important;
      }
      #mtcReplaySameGridButton{
        font-family:"Archivo", system-ui, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }

  function currentOpenItem(){
    return document.querySelector('.pharma-solved-point.pharma-synthesis-open[data-esprit-tooltip]');
  }

  function substanceNameFrom(item){
    if(!item) return "";
    const label = item.querySelector(".pharma-solved-chinese-name");
    return String(label && label.textContent || item.getAttribute("data-herb-id") || "Substance").trim();
  }

  function formatBubble(){
    if(!isPharma()) return;
    const node = byId("mtcPharmaEspritMobileBubble");
    if(!node || !node.classList.contains("visible")) return;
    const item = currentOpenItem();
    if(!item) return;
    const text = String(item.getAttribute("data-esprit-tooltip") || "").trim();
    if(!text) return;
    const herbId = item.getAttribute("data-herb-id") || substanceNameFrom(item);
    const key = herbId + "::" + text;
    if(node.dataset.mtcEspritFormattedKey === key) return;
    const name = substanceNameFrom(item);
    node.innerHTML = `
      <div class="mtc-esprit-bubble-title">
        <span class="mtc-esprit-substance">${escapeHtml(name)}</span>
        <span class="mtc-esprit-tag">ESPRIT</span>
      </div>
      <div class="mtc-esprit-bubble-body">${escapeHtml(text)}</div>
    `;
    node.dataset.mtcEspritFormattedKey = key;
  }

  function init(){
    injectStyle();
    window.addEventListener("click", () => window.setTimeout(formatBubble, 0), true);
    window.addEventListener("touchend", () => window.setTimeout(formatBubble, 0), true);
    const observer = new MutationObserver(() => formatBubble());
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["class", "data-source-herb-id"]});
    window.setTimeout(formatBubble, 300);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();

