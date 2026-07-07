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

  function hanziToUStem(value){
    return [...String(value || "")].map(ch => {
      const code = ch.codePointAt(0);
      if(code >= 0x3400 && code <= 0x9fff){
        return "#U" + code.toString(16).padStart(4, "0");
      }
      return ch;
    }).join("");
  }

  function generatedCandidates(hanzi){
    const clean = normalizeHanzi(hanzi);
    const out = [];
    if(!clean) return out;
    const uStem = hanziToUStem(clean);
    // Les fichiers du projet sont principalement nommés en #Uxxxx.
    addUnique(out, uStem + "_baidu_zh.mp3");
    addUnique(out, uStem + "_google_zh-CN.mp3");
    addUnique(out, clean + "_baidu_zh.mp3");
    addUnique(out, clean + "_google_zh-CN.mp3");
    if(!clean.endsWith("穴")){
      const withXue = clean + "穴";
      const withXueU = hanziToUStem(withXue);
      addUnique(out, withXueU + "_baidu_zh.mp3");
      addUnique(out, withXueU + "_google_zh-CN.mp3");
      addUnique(out, withXue + "_baidu_zh.mp3");
      addUnique(out, withXue + "_google_zh-CN.mp3");
    }
    return out;
  }

  function orderedGameCandidates(hanzi){
    const clean = normalizeHanzi(hanzi);
    if(!clean) return [];

    const out = [];

    // 1) mp3 confirmés par le manifest, quand il est à jour.
    try{
      if(typeof window.mtcConfirmedAudioCandidatesForHanzi === "function"){
        const confirmed = window.mtcConfirmedAudioCandidatesForHanzi(clean);
        if(Array.isArray(confirmed)) confirmed.map(String).filter(Boolean).forEach(item => addUnique(out, item));
      }
    }catch(error){}

    const files = manifestFilesSet();
    manifestByHanziList(clean).forEach(item => {
      if(files.has(String(item))) addUnique(out, item);
    });

    // 2) Si l'utilisateur a ajouté de nouveaux fichiers audio sans régénérer
    // audio-manifest.js, on tente quand même les noms attendus, #Uxxxx d'abord.
    generatedCandidates(clean).forEach(item => addUnique(out, item));

    // 3) Derniers candidats exposés par le module 32, en conservant les doublons retirés.
    try{
      if(typeof window.mtcAudioCandidatesForHanzi === "function"){
        const extra = window.mtcAudioCandidatesForHanzi(clean);
        if(Array.isArray(extra)) extra.map(String).filter(Boolean).forEach(item => addUnique(out, item));
      }
    }catch(error){}

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

    const candidates = orderedGameCandidates(clean);
    if(!candidates.length){
      // Pas de synthèse vocale navigateur : si aucun mp3 confirmé n'existe,
      // on reste silencieux au lieu de bloquer le geste mobile sur des essais faux.
      return false;
    }

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
