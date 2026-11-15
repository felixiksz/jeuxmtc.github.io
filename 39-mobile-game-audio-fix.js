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
  let sharedAudioEl = null;

  function getSharedAudio(){
    // Réutiliser un seul élément <audio> au lieu d'en créer un nouveau à
    // chaque tuile évite le coût de (re-)négociation du pipeline audio du
    // navigateur à chaque lecture, sensible sur certains mobiles.
    if(!sharedAudioEl){
      sharedAudioEl = new Audio();
      sharedAudioEl.preload = "auto";
    }
    return sharedAudioEl;
  }

  // --- Journal de diagnostic : ouvrir le jeu avec ?audiodebug=1 (puis ?audiodebug=0 pour l'enlever) ---
  let debugOn = false;
  try{
    const q = /[?&]audiodebug=([01])/.exec(location.search);
    if(q) localStorage.setItem("mtc_audio_debug", q[1]);
    debugOn = localStorage.getItem("mtc_audio_debug") === "1";
  }catch(error){}
  const debugLines = [];
  window.mtcAudioLog = function(text){
    if(!debugOn) return;
    debugLines.push((performance.now() / 1000).toFixed(1) + "s " + text);
    while(debugLines.length > 16) debugLines.shift();
    let box = document.getElementById("mtcAudioDebug");
    if(!box && document.body){
      box = document.createElement("pre"); box.id = "mtcAudioDebug";
      box.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:4px 6px;font:10px/1.25 monospace;background:rgba(255,255,255,.92);color:#000;pointer-events:none;white-space:pre-wrap;max-height:40vh;overflow:hidden";
      document.body.appendChild(box);
    }
    if(box) box.textContent = debugLines.join("\n");
  };
  const log = text => { try{ window.mtcAudioLog(text); }catch(error){} };

  // --- Déblocage du son : à chaque toucher, le lecteur est réveillé et un son silencieux est joué (Web Audio et <audio>) ---
  // Sans cela, le téléphone garde le son en attente jusqu'au toucher suivant : le nom est entendu avec des secondes de retard, ou pas du tout.
  const SILENT = "data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
  let elUnlocked = false;
  function unlockAudio(){
    try{
      const ctx = getAudioContext();
      if(ctx){
        if(ctx.state !== "running"){
          log("réveil du lecteur (" + ctx.state + ")");
          ctx.resume().then(() => log("lecteur : " + ctx.state)).catch(() => log("réveil refusé"));
          try{ const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); }catch(error){}
        }
      }
      if(!elUnlocked && !currentGameAudio){
        const a = getSharedAudio();
        if(a.paused){
          a.src = SILENT; a.volume = 0.01;
          const p = a.play();
          if(p && p.then) p.then(() => { elUnlocked = true; log("lecteur <audio> débloqué"); }).catch(error => log("<audio> refusé : " + (error && error.name)));
        }
      }
    }catch(error){}
  }
  ["pointerup", "touchend", "click", "keydown"].forEach(type => window.addEventListener(type, unlockAudio, {capture:true, passive:true}));
  window.mtcAudioUnlock = unlockAudio;

  // --- Pré-chargement Web Audio : lecture quasi instantanée -------------
  // Le <audio> classique doit re-négocier réseau + décodage à chaque son,
  // même fichier déjà visité. On précharge et pré-décode en tâche de fond
  // dès que la grille apparaît, puis on joue depuis un buffer déjà prêt.
  let audioCtx = null;
  const decodedBuffers = new Map(); // filename -> AudioBuffer
  const pendingDecodes = new Map(); // filename -> Promise

  function getAudioContext(){
    if(audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    try{ audioCtx = new Ctx(); audioCtx.addEventListener("statechange", () => log("lecteur du jeu : " + audioCtx.state)); }catch(error){ audioCtx = null; }
    return audioCtx;
  }

  function prefetchBuffer(filename){
    if(!filename || decodedBuffers.has(filename) || pendingDecodes.has(filename)) return;
    const ctx = getAudioContext();
    if(!ctx) return;
    const promise = fetch(audioUrl(filename))
      .then(response => (response && response.ok) ? response.arrayBuffer() : Promise.reject(new Error("404")))
      .then(bytes => ctx.decodeAudioData(bytes))
      .then(buffer => { decodedBuffers.set(filename, buffer); pendingDecodes.delete(filename); })
      .catch(() => { pendingDecodes.delete(filename); });
    pendingDecodes.set(filename, promise);
  }

  function prefetchAudioForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    if(!clean) return;
    // On ne précharge que le premier candidat (le plus probable) pour éviter
    // de télécharger des fichiers inutiles pour chaque point de la grille.
    const candidates = orderedGameCandidates(clean);
    if(candidates.length) prefetchBuffer(candidates[0]);
  }

  function prefetchVisibleGridAudio(){
    try{
      if(typeof window.isMtcAudioModeEnabled === "function" && !window.isMtcAudioModeEnabled()) return;
    }catch(error){ return; }
    document.querySelectorAll("#grid .tile[data-point]").forEach(tile => {
      const point = tile.dataset.point;
      const details = window.POINT_DETAILS && point ? window.POINT_DETAILS[point] : null;
      if(details && details.hanzi) prefetchAudioForHanzi(details.hanzi);
    });
  }

  function playFromBuffer(candidates){
    const ctx = audioCtx;
    if(!ctx) return false;
    const ready = candidates.find(name => decodedBuffers.has(name));
    if(!ready) return false;
    try{
      // lecteur endormi : un son lancé maintenant partirait au prochain toucher, des secondes plus tard ; on laisse le lecteur <audio> jouer tout de suite
      if(ctx.state !== "running"){ log("buffer prêt mais lecteur " + ctx.state + " : lecteur <audio>"); try{ ctx.resume().catch(() => {}); }catch(error){} return false; }
      log("lecture depuis le buffer");
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffers.get(ready);
      const gain = ctx.createGain();
      gain.gain.value = 0.42;
      source.connect(gain).connect(ctx.destination);
      source.start(0);
      return true;
    }catch(error){
      return false;
    }
  }

  function initGridAudioPrefetch(){
    const grid = document.getElementById("grid");
    if(!grid || grid.dataset.mtcAudioPrefetchObserved === "1") return;
    grid.dataset.mtcAudioPrefetchObserved = "1";
    const observer = new MutationObserver(() => prefetchVisibleGridAudio());
    observer.observe(grid, {childList:true});
    prefetchVisibleGridAudio();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGridAudioPrefetch, {once:true});
  else initGridAudioPrefetch();

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

    const files = manifestFilesSet();
    const rawByHanzi = manifestByHanziList(clean);

    // 1) Candidats explicitement indexés pour ce hanzi, mais seulement ceux
    // dont le fichier existe vraiment dans le manifest. Un premier essai sur
    // un nom absent (ex : anciens noms #Uxxxx) casse la lecture suivante sur mobile.
    rawByHanzi.forEach(item => { if(files.has(String(item))) addUnique(out, item); });

    // 2) Candidats calculés par le module audio principal.
    const generated = [];
    try{
      if(typeof window.mtcAudioCandidatesForHanzi === "function"){
        window.mtcAudioCandidatesForHanzi(clean).forEach(item => addUnique(generated, item));
      }
    }catch(error){}

    // 3) Parmi les candidats calculés, on met d'abord ceux dont le fichier est
    // dans le manifest. C'est le point crucial pour Safari/Chrome mobile.
    generated.filter(item => files.has(String(item))).forEach(item => addUnique(out, item));
    generated.filter(item => !files.has(String(item))).forEach(item => addUnique(out, item));

    // 4) En dernier recours seulement, les entrées byHanzi non confirmées.
    rawByHanzi.forEach(item => addUnique(out, item));

    return out;
  }

  function stopGameAudio(){
    gameAudioSerial += 1;
    if(currentGameAudio){
      try{ currentGameAudio.pause(); currentGameAudio.currentTime = 0; }catch(error){}
    }
    currentGameAudio = null;
  }

  function playCandidateNow(candidates, index, serial, hanzi){
    if(serial !== gameAudioSerial) return false;
    if(index >= candidates.length){
      // Tous les candidats mp3 ont échoué (fichier manquant, réseau...).
      // Sans repli, la partie reste silencieuse alors que le module principal
      // sait basculer sur la synthèse vocale : on délègue au lieu d'abandonner.
      try{
        if(typeof window.playMtcAudioByHanzi === "function") return window.playMtcAudioByHanzi(hanzi, null);
      }catch(error){}
      return false;
    }

    const filename = candidates[index];
    const audio = getSharedAudio();
    try{ audio.pause(); }catch(error){}
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
      playCandidateNow(candidates, index + 1, serial, hanzi);
    }
    function onError(){ fail(); }

    audio.addEventListener("error", onError, {once:true});
    audio.addEventListener("ended", () => {
      if(serial !== gameAudioSerial) return;
      if(currentGameAudio === audio) currentGameAudio = null;
    }, {once:true});

    timeoutId = window.setTimeout(fail, 8000);
    audio.src = audioUrl(filename);

    let promise = null;
    try{ promise = audio.play(); }
    catch(error){ fail(); return true; }

    if(promise && typeof promise.catch === "function"){
      promise.then(() => {
        log("<audio> joue " + filename);
        if(settled || serial !== gameAudioSerial) return;
        settled = true;
        cleanup();
      }).catch(error => { log("<audio> refusé : " + (error && error.name) + " (" + filename + ")"); fail(); });
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
    log("lecteur du jeu : " + clean);

    // Si aucun mp3 confirmé n'existe dans le manifest, on délègue au module
    // principal : il utilise une synthèse vocale immédiate, compatible mobile.
    try{
      if(typeof window.mtcConfirmedAudioCandidatesForHanzi === "function" &&
         !window.mtcConfirmedAudioCandidatesForHanzi(clean).length &&
         typeof window.playMtcAudioByHanzi === "function"){
        return window.playMtcAudioByHanzi(clean, null);
      }
    }catch(error){}

    const candidates = orderedGameCandidates(clean);
    if(!candidates.length){
      try{
        if(typeof window.playMtcAudioByHanzi === "function") return window.playMtcAudioByHanzi(clean, null);
      }catch(error){}
      return false;
    }

    stopGameAudio();
    const serial = gameAudioSerial + 1;
    gameAudioSerial = serial;

    // Voie rapide : le fichier a déjà été pré-chargé et décodé en tâche de
    // fond pendant que le joueur regardait la grille — lecture quasi instantanée.
    if(playFromBuffer(candidates)) return true;

    // Pas encore prêt (grille tout juste affichée, ou préchargement raté) :
    // on lance quand même le préchargement pour la prochaine fois, et on
    // utilise l'ancienne méthode <audio> en attendant.
    candidates.forEach(prefetchBuffer);
    return playCandidateNow(candidates, 0, serial, clean);
  }

  // On remplace seulement le lecteur automatique pendant la partie.
  // Les boutons audio de fiches gardent le module 32 intact.
  window.mtcAudioModePlayHanzi = playGameAudioHanzi;
  window.stopMtcGameAudio = stopGameAudio;
})();
