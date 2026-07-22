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
    return playCandidateNow(candidates, 0, serial, clean);
  }

  // On remplace seulement le lecteur automatique pendant la partie.
  // Les boutons audio de fiches gardent le module 32 intact.
  window.mtcAudioModePlayHanzi = playGameAudioHanzi;
  window.stopMtcGameAudio = stopGameAudio;
})();
