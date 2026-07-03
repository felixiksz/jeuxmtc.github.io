/* === 36-selection-audio.js
   Bouton audio pendant la partie : lit les tuiles ACU sélectionnées compatibles.
   Ajoute aussi un petit bouton audio sur les lignes de catégories validées. === */
(function(){
  "use strict";

  const AUDIO_BASE_PATH = "audio/";
  let currentAudio = null;
  let currentController = null;
  let updateTimer = 0;

  function isAcu(){
    return document.documentElement.getAttribute("data-study-domain") !== "pharmacology";
  }

  function cleanPoint(value){
    return String(value || "").trim();
  }

  function pointHanzi(point){
    const key = cleanPoint(point);
    if(!key) return "";
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[key]){
        return String(POINT_DETAILS[key].hanzi || "").trim();
      }
    }catch(error){}
    const details = window.POINT_DETAILS && window.POINT_DETAILS[key];
    return details ? String(details.hanzi || "").trim() : "";
  }

  function containsCjk(value){
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function hanziToUStem(value){
    return [...String(value || "")].map(ch => {
      const code = ch.codePointAt(0);
      if(code >= 0x3400 && code <= 0x9fff) return "#U" + code.toString(16).padStart(4, "0");
      return ch;
    }).join("");
  }

  function addUnique(list, value){
    const clean = String(value || "").trim();
    if(clean && !list.includes(clean)) list.push(clean);
  }

  function generatedCandidates(hanzi){
    const clean = String(hanzi || "").trim();
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

  function candidatesForHanzi(hanzi){
    const clean = String(hanzi || "").trim();
    const out = [];
    if(!clean) return out;
    if(typeof window.mtcAudioCandidatesForHanzi === "function"){
      try{ window.mtcAudioCandidatesForHanzi(clean).forEach(item => addUnique(out, item)); }catch(error){}
    }
    generatedCandidates(clean).forEach(item => addUnique(out, item));
    return out;
  }

  function audioUrl(filename){
    return AUDIO_BASE_PATH + String(filename || "").split("/").map(encodeURIComponent).join("/");
  }

  function stopPlayback(){
    if(currentAudio){
      try{ currentAudio.pause(); currentAudio.currentTime = 0; }catch(error){}
    }
    if(currentController && currentController.button){
      currentController.button.classList.remove("is-playing");
      currentController.button.disabled = false;
    }
    currentAudio = null;
    currentController = null;
    document.querySelectorAll("#mtcSelectionAudioButton.is-playing,.mtc-solved-audio-button.is-playing").forEach(btn => btn.classList.remove("is-playing"));
  }

  function playCandidateList(candidates, index, done){
    if(index >= candidates.length){ done(false); return; }
    const audio = new Audio();
    currentAudio = audio;
    audio.preload = "auto";
    audio.volume = 0.42;
    let settled = false;
    let timeoutId = 0;
    function cleanup(){
      window.clearTimeout(timeoutId);
      audio.removeEventListener("error", onError);
    }
    function fail(){
      if(settled) return;
      settled = true;
      cleanup();
      try{ audio.pause(); }catch(error){}
      playCandidateList(candidates, index + 1, done);
    }
    function onError(){ fail(); }
    audio.addEventListener("error", onError, {once:true});
    audio.addEventListener("ended", () => {
      if(settled) return;
      settled = true;
      cleanup();
      done(true);
    }, {once:true});
    timeoutId = window.setTimeout(fail, 3200);
    audio.src = audioUrl(candidates[index]);
    let playPromise = null;
    try{ playPromise = audio.play(); }catch(error){ fail(); return; }
    if(playPromise && typeof playPromise.catch === "function") playPromise.catch(fail);
  }

  function playHanziQueue(hanziList, button){
    const queue = (hanziList || []).map(String).filter(containsCjk);
    if(!queue.length) return;
    if(currentController && currentController.button === button){ stopPlayback(); return; }
    stopPlayback();
    currentController = {button};
    if(button){ button.classList.add("is-playing"); button.disabled = false; }
    let index = 0;
    function next(){
      if(!currentController || currentController.button !== button) return;
      if(index >= queue.length){ stopPlayback(); return; }
      const hanzi = queue[index++];
      const candidates = candidatesForHanzi(hanzi);
      if(!candidates.length){ next(); return; }
      if(button && button.id === "mtcSelectionAudioButton"){
        const label = button.querySelector(".mtc-selection-audio-label");
        if(label) label.textContent = index + "/" + queue.length;
      }
      playCandidateList(candidates, 0, () => window.setTimeout(next, 90));
    }
    next();
  }

  function domSelectedPoints(){
    return Array.from(document.querySelectorAll("#grid .tile.selected[data-point]")).map(tile => cleanPoint(tile.dataset.point)).filter(Boolean);
  }

  function selectedPoints(){
    try{
      if(typeof selected !== "undefined" && Array.isArray(selected)){
        return selected.map(cleanPoint).filter(Boolean);
      }
    }catch(error){}
    return domSelectedPoints();
  }

  function compatibleSelection(points){
    if(!points || !points.length) return false;
    try{
      if(typeof gameOver !== "undefined" && gameOver) return false;
    }catch(error){}
    try{
      if(typeof solution !== "undefined" && Array.isArray(solution) && solution.length){
        return solution.some(group => group && !group.solved && Array.isArray(group.points) && points.every(point => group.points.includes(point)));
      }
    }catch(error){}
    return true;
  }

  function ensureSelectionButton(){
    let button = document.getElementById("mtcSelectionAudioButton");
    if(button) return button;
    button = document.createElement("button");
    button.type = "button";
    button.id = "mtcSelectionAudioButton";
    button.hidden = true;
    button.innerHTML = '<span aria-hidden="true">🔊</span><span class="mtc-selection-audio-label">sélection</span>';
    button.title = "Écouter la prononciation des tuiles sélectionnées compatibles";
    button.setAttribute("aria-label", "Écouter la prononciation des tuiles sélectionnées compatibles");
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const points = selectedPoints();
      if(!compatibleSelection(points)) return;
      playHanziQueue(points.map(pointHanzi), button);
    });
    const message = document.getElementById("message");
    if(message && message.parentNode) message.insertAdjacentElement("afterend", button);
    else document.body.appendChild(button);
    return button;
  }

  function updateSelectionButton(){
    const button = ensureSelectionButton();
    if(!button) return;
    const points = selectedPoints();
    const visible = isAcu() && compatibleSelection(points) && points.some(point => containsCjk(pointHanzi(point)));
    button.hidden = !visible;
    if(!visible){
      if(currentController && currentController.button === button) stopPlayback();
      const label = button.querySelector(".mtc-selection-audio-label");
      if(label) label.textContent = "sélection";
      return;
    }
    const label = button.querySelector(".mtc-selection-audio-label");
    if(label && !button.classList.contains("is-playing")) label.textContent = points.length + " sélectionné" + (points.length > 1 ? "s" : "");
  }

  function scheduleUpdate(){
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(updateSelectionButton, 35);
  }

  function pointsFromSolvedRow(row){
    return Array.from(row.querySelectorAll(".solved-point[data-point]")).map(node => cleanPoint(node.dataset.point)).filter(Boolean);
  }

  function enhanceSolvedRows(){
    if(!isAcu()) return;
    document.querySelectorAll("#solved .solved-row").forEach(row => {
      if(row.querySelector(".mtc-solved-audio-button")) return;
      const points = pointsFromSolvedRow(row);
      if(!points.some(point => containsCjk(pointHanzi(point)))) return;
      const title = row.querySelector(".solved-title");
      if(!title) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mtc-solved-audio-button";
      button.textContent = "🔊";
      button.title = "Écouter les points de cette catégorie";
      button.setAttribute("aria-label", "Écouter les points de cette catégorie");
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        playHanziQueue(points.map(pointHanzi), button);
      });
      title.appendChild(button);
    });
  }

  function boot(){
    ensureSelectionButton();
    updateSelectionButton();
    enhanceSolvedRows();
    document.addEventListener("click", scheduleUpdate, true);
    document.addEventListener("keyup", scheduleUpdate, true);
    document.addEventListener("mtc-study-domain-changed", () => { stopPlayback(); scheduleUpdate(); window.setTimeout(enhanceSolvedRows, 80); });
    const grid = document.getElementById("grid");
    if(grid && grid.dataset.mtcSelectionAudioObserver !== "1"){
      grid.dataset.mtcSelectionAudioObserver = "1";
      new MutationObserver(scheduleUpdate).observe(grid, {childList:true, subtree:true, attributes:true, attributeFilter:["class", "style"]});
    }
    const solved = document.getElementById("solved");
    if(solved && solved.dataset.mtcSolvedAudioObserver !== "1"){
      solved.dataset.mtcSolvedAudioObserver = "1";
      new MutationObserver(() => { enhanceSolvedRows(); scheduleUpdate(); }).observe(solved, {childList:true, subtree:true});
    }
    window.setInterval(() => { updateSelectionButton(); enhanceSolvedRows(); }, 1200);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
