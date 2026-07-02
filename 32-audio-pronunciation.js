/* ============================================================
   32-audio-pronunciation.js
   Lecture audio ACU/PHARMA.
   Version stable :
   - bouton toujours présent quand un hanzi existe
   - manifest explicite audio-manifest.js si disponible
   - candidates testées dans l'ordre : manifest réel, chinois direct, #Uxxxx
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

  function normalizeHanzi(value){
    return String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
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

  function candidateAudioFilenamesForHanzi(hanzi){
    const clean = normalizeHanzi(hanzi);
    const candidates = [];
    if(!clean) return candidates;

    const fromManifest = manifestByHanzi[clean];
    if(Array.isArray(fromManifest)) fromManifest.forEach(item => addUnique(candidates, item));
    else addUnique(candidates, fromManifest);

    generatedCandidates(clean).forEach(item => addUnique(candidates, item));

    // File names listed in the manifest are actual names. If one starts with the exact hanzi
    // or the exact #U form, add it near the end as another rescue path.
    const uStem = hanziToUStem(clean);
    manifestFiles.forEach(file => {
      if(file && (file.startsWith(clean + "_") || file.startsWith(uStem + "_"))){
        addUnique(candidates, file);
      }
    });

    return candidates;
  }

  function likelyManifestCandidate(hanzi){
    const clean = normalizeHanzi(hanzi);
    const fromManifest = manifestByHanzi[clean];
    if(Array.isArray(fromManifest) && fromManifest.length) return fromManifest[0];
    if(typeof fromManifest === "string" && fromManifest) return fromManifest;
    return "";
  }

  function setButtonPlaying(button, isPlaying){
    document.querySelectorAll(".mtc-audio-button.mtc-audio-playing").forEach(btn => {
      if(btn !== button) btn.classList.remove("mtc-audio-playing");
    });
    if(button) button.classList.toggle("mtc-audio-playing", Boolean(isPlaying));
  }

  function stopCurrentAudio(){
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

  function tryPlayCandidateList(candidates, index, button, hanzi){
    if(index >= candidates.length){
      markMissing(button, hanzi);
      currentAudio = null;
      currentButton = null;
      return false;
    }

    const filename = candidates[index];
    stopCurrentAudio();

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
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
    }

    function fail(){
      if(settled) return;
      settled = true;
      cleanup();
      try{ audio.pause(); }catch(error){}
      tryPlayCandidateList(candidates, index + 1, button, hanzi);
    }

    function onError(){ fail(); }

    function onReady(){
      if(settled) return;
      settled = true;
      cleanup();
      const playPromise = audio.play();
      if(playPromise && typeof playPromise.then === "function"){
        playPromise.then(() => {
          if(button){
            button.disabled = false;
            button.classList.remove("mtc-audio-loading", "mtc-audio-missing");
            button.dataset.audioFile = filename;
            button.title = "Écouter la prononciation";
            setButtonPlaying(button, true);
          }
        }).catch(fail);
      }else if(button){
        button.disabled = false;
        button.classList.remove("mtc-audio-loading", "mtc-audio-missing");
        setButtonPlaying(button, true);
      }
    }

    audio.addEventListener("loadeddata", onReady, {once:true});
    audio.addEventListener("canplay", onReady, {once:true});
    audio.addEventListener("error", onError, {once:true});
    audio.addEventListener("ended", () => {
      setButtonPlaying(button, false);
      if(currentAudio === audio){ currentAudio = null; currentButton = null; }
    });

    timeoutId = setTimeout(fail, 2500);
    audio.src = audioUrl(filename);
    try{ audio.load(); }catch(error){ fail(); }
    return true;
  }

  function playAudioForHanzi(hanzi, button){
    const clean = normalizeHanzi(hanzi);
    if(!clean){
      markMissing(button, clean);
      return false;
    }

    if(currentButton === button && currentAudio && !currentAudio.paused){
      stopCurrentAudio();
      return true;
    }

    const candidates = candidateAudioFilenamesForHanzi(clean);
    const remembered = button && button.dataset.audioFile;
    if(remembered && candidates.includes(remembered)){
      candidates.splice(candidates.indexOf(remembered), 1);
      candidates.unshift(remembered);
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
      if(known) markAvailable(button, clean, known);
      else markMissing(button, clean); // visible and still clickable: useful if a new file was added after manifest generation
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
    `;
    document.head.appendChild(style);
  }

  function bootAudioEnhancer(){
    injectAudioStyles();
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
  window.refreshMtcAudioButtons = enhancePointPanel;

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootAudioEnhancer, {once:true});
  else bootAudioEnhancer();
})();
