/* === Bucket 8Q : switch visible des modes de jeu ACU / PHARMA === */
(function(){
  "use strict";

  const ACU_MODE_KEY = "mtc_gameplay_mode_acupuncture_v1";
  const PHARMA_MODE_KEY = "mtc_gameplay_mode_pharmacology_v1";
  const VALID_MODES = ["normal", "review", "exam"];

  function activeDomain(){
    return document.documentElement.getAttribute("data-study-domain") || window.MTC_STUDY_DOMAIN || "none";
  }

  function storageGet(key){
    try{ return localStorage.getItem(key) || "normal"; }catch(error){ return "normal"; }
  }

  function storageSet(key, value){
    try{ localStorage.setItem(key, value); }catch(error){}
  }

  function currentModeForDomain(domain = activeDomain()){
    let mode = "normal";
    if(domain === "pharmacology"){
      if(typeof window.getPharmaGameplayMode === "function") mode = window.getPharmaGameplayMode();
      else mode = storageGet(PHARMA_MODE_KEY);
    }else if(domain === "acupuncture"){
      if(typeof window.getMtcGameplayMode === "function") mode = window.getMtcGameplayMode();
      else mode = storageGet(ACU_MODE_KEY);
    }
    return VALID_MODES.includes(mode) ? mode : "normal";
  }

  function setModeForDomain(mode, domain = activeDomain()){
    if(!VALID_MODES.includes(mode)) mode = "normal";

    if(domain === "pharmacology"){
      if(typeof window.setPharmaGameplayMode === "function") window.setPharmaGameplayMode(mode);
      else storageSet(PHARMA_MODE_KEY, mode);
    }else if(domain === "acupuncture"){
      if(typeof window.setMtcGameplayMode === "function") window.setMtcGameplayMode(mode);
      else storageSet(ACU_MODE_KEY, mode);
    }

    updateVisibleGameplayModeSwitch();
  }

  function labelForMode(mode){
    if(mode === "review") return "Révision douce";
    if(mode === "exam") return "Mode examen";
    return "Mode normal";
  }


  function ensureVisibleGameplayModeSwitch(){
    let wrap = document.getElementById("gameplayModeTopline");
    let review = document.getElementById("gameplayModeReviewBtn");
    let exam = document.getElementById("gameplayModeExamBtn");

    if(wrap && review && exam) return wrap;

    const bottomActions = document.querySelector(".bottom-actions");
    const jokerBubble = document.getElementById("jokerBubble");
    const host = bottomActions || jokerBubble;
    if(!host) return null;

    if(!wrap){
      wrap = document.createElement("div");
      wrap.id = "gameplayModeTopline";
      wrap.className = "gameplay-mode-topline";
      wrap.hidden = true;
      wrap.setAttribute("aria-label", "Mode de jeu : Mode normal");

      const switchWrap = document.createElement("div");
      switchWrap.className = "gameplay-mode-switch";
      switchWrap.setAttribute("role", "group");
      switchWrap.setAttribute("aria-label", "Choix du mode de jeu");

      review = document.createElement("button");
      review.id = "gameplayModeReviewBtn";
      review.type = "button";
      review.className = "gameplay-mode-icon gameplay-mode-review";
      // Retour à l'émoji 🕊️ : la silhouette SVG dessinée à la main ne se
      // lisait pas comme une colombe. On perd la fiabilité du fill CSS
      // (voir #gameplayModeReviewBtn en CSS pour le filter:grayscale qui
      // remplace ce mécanisme ici), mais l'icône redevient reconnaissable.
      review.textContent = "🕊︎";
      review.setAttribute("aria-label", "Révision douce");
      review.setAttribute("aria-pressed", "false");
      review.addEventListener("click", function(){ toggleVisibleGameplayMode("review"); });

      exam = document.createElement("button");
      exam.id = "gameplayModeExamBtn";
      exam.type = "button";
      exam.className = "gameplay-mode-icon gameplay-mode-exam";
      exam.innerHTML = `<svg viewBox="0 0 128 128" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" style="vertical-align:-0.15em">
        <path class="gameplay-mode-glyph-body" d="M39.26,24.18c0,0-0.73-3.94-3.68-4.86c-5.44-1.69-8.7,2.98-8.7,2.98s-4.11-0.23-6.66-1.22s-7.11-3.51-10.49-2.14c-2.77,1.13-4.15,3.82-4.9,6.92s-0.28,5.16-0.28,5.16s3.19-3.1,6.85-2.82c3.66,0.28,9.29,3.19,10.79,3.94c1.5,0.75,9.95,3.19,9.95,3.19s-1.69,5.35-2.91,6.85c-1.22,1.5-3.85,3.57-7.98,5.35c-4.13,1.78-12.2,3.1-12.2,3.1s0.56,6.57,2.82,7.6c2.25,1.03,6.29,1.88,9.29,0.56s13.8-2.25,13.8-2.25s1.69,0.75,3.1,2.35s3.28,3.57,4.13,5.91c0.84,2.35,1.69,4.97,2.44,6.48c0.75,1.5,2.53,5.16,2.53,5.16s1.41-2.82,3.38-3.47c1.97-0.66,4.6-0.19,4.6-0.19s-0.31-10.4,1.97-14.08c2.25-3.64,4.97-4.41,8.07-4.22c3.1,0.19,3.66,2.16,1.22,2.16s-6.08,0.87-7.39,3.78s-1.53,4.86-1.9,7.58c-0.38,2.72-0.38,6.1-0.38,6.1s-3.47-0.47-5.54,0.38c-2.06,0.84-3.38,3.57-3.57,5.44c-0.19,1.88,0.38,4.41,2.06,4.5c1.69,0.09,2.16-1.78,2.16-1.78s0.28,3.75,3.28,3.28c3-0.47,2.11-2.75,3.61-4.53s4.58-2.11,7.86-6.52c3.28-4.41,3.21-6.9,3.21-7.65s-0.16-2.86,0.87-2.96c1.03-0.09,1.15,2.04,1.15,2.98s-0.84,5.8-3.75,9.1c-2.32,2.64-6.38,4.69-7.6,6.48s-1.15,4.06-1.13,4.13c0.21,0.64,3.47,1.78,6.95,2.06c3.47,0.28,6.57-1.22,6.57-1.22s0,3.94,0.38,7.04c0.38,3.1,2.63,5.91,2.25,9.39c-0.38,3.47-2.25,6.29-3.57,7.04c-1.31,0.75-7.22,3.04-6.59,5.4c0.45,1.69,3.69,1.34,5.19,1.08c1.62-0.28,2.53-0.49,4.04-0.31c1.5,0.19,0.56,4.41,3.47,4.22c2.91-0.19,5.35-4.18,7.04-4.11c2.3,0.09,6.6,3.29,9.06,1.22c1.95-1.64-1.74-4.5-3.99-6.76s-4.5-5.54-4.32-11.26c0,0,0.38-9.01,0.47-11.64c0.09-2.63,0.09-7.32,0.09-7.32s4.41-3.28,6.48-5.54c2.06-2.25,2.35-3.85,5.91-6.95c3.57-3.1,12.29-2.56,21.3-10.79c4.45-4.07,6.1-13.7,0.19-20.46c-5.91-6.76-17.08-4.04-19.43-4.32c-2.35-0.28-5.91-2.25-7.46-1.43c-1.23,0.65-1.13,1.69-1.13,1.69s4.38,2.32,7.46,2.84c6.03,1.01,16.61-1.5,16.8,5.91s-19.71,7.98-21.59,7.79c-1.88-0.19-12.37-6.24-16.21-7.23c-3.41-0.87-8.35-1.73-11.94-1.5c-3.75,0.23-6.5,0.94-9.2,2.16c-1.31,0.59-2.18,1.29-2.18,1.29s-6.54-13.76-10.39-17.62C41.98,24.65,39.26,24.18,39.26,24.18z"/>
      </svg>`;
      exam.setAttribute("aria-label", "Mode examen");
      exam.setAttribute("aria-pressed", "false");
      exam.addEventListener("click", function(){ toggleVisibleGameplayMode("exam"); });

      switchWrap.appendChild(review);
      switchWrap.appendChild(exam);
      wrap.appendChild(switchWrap);
    }

    if(bottomActions){
      if(wrap.parentElement !== bottomActions){
        bottomActions.appendChild(wrap);
      }else if(jokerBubble && jokerBubble.nextSibling !== wrap){
        bottomActions.insertBefore(wrap, jokerBubble.nextSibling);
      }
    }else if(jokerBubble && wrap.parentElement !== jokerBubble){
      jokerBubble.appendChild(wrap);
    }

    return wrap;
  }

  function updateVisibleGameplayModeSwitch(){
    const domain = activeDomain();
    ensureVisibleGameplayModeSwitch();
    const wrap = document.getElementById("gameplayModeTopline");
    const review = document.getElementById("gameplayModeReviewBtn");
    const exam = document.getElementById("gameplayModeExamBtn");
    if(!wrap || !review || !exam) return;

    const visible = domain === "acupuncture" || domain === "pharmacology";
    wrap.hidden = !visible;
    wrap.classList.toggle("is-hidden", !visible);
    if(!visible){
      document.documentElement.removeAttribute("data-mtc-gameplay-mode");
      document.documentElement.classList.remove("mtc-gameplay-exam-active");
      return;
    }

    const mode = currentModeForDomain(domain);
    document.documentElement.setAttribute("data-mtc-gameplay-mode", mode);
    document.documentElement.classList.toggle("mtc-gameplay-exam-active", mode === "exam");
    review.classList.toggle("active", mode === "review");
    exam.classList.toggle("active", mode === "exam");
    review.setAttribute("aria-pressed", mode === "review" ? "true" : "false");
    exam.setAttribute("aria-pressed", mode === "exam" ? "true" : "false");

    review.title = mode === "review" ? "Révision douce active — cliquer pour revenir au mode normal" : "Révision douce";
    exam.title = mode === "exam" ? "Mode examen actif — cliquer pour revenir au mode normal" : "Mode examen";
    wrap.title = `Mode actuel : ${labelForMode(mode)}`;
    wrap.setAttribute("aria-label", `Mode de jeu : ${labelForMode(mode)}`);
  }

  function toggleVisibleGameplayMode(mode){
    const current = currentModeForDomain();
    setModeForDomain(current === mode ? "normal" : mode);
  }

  function wrapSetter(name){
    const original = window[name];
    if(typeof original !== "function" || original.__visibleGameplayWrapped) return;
    function wrapped(){
      const result = original.apply(this, arguments);
      updateVisibleGameplayModeSwitch();
      return result;
    }
    wrapped.__visibleGameplayWrapped = true;
    window[name] = wrapped;
  }

  function init(){
    wrapSetter("setMtcGameplayMode");
    wrapSetter("setPharmaGameplayMode");
    ensureVisibleGameplayModeSwitch();
    updateVisibleGameplayModeSwitch();
  }

  window.toggleVisibleGameplayMode = toggleVisibleGameplayMode;
  window.updateVisibleGameplayModeSwitch = updateVisibleGameplayModeSwitch;

  window.addEventListener("mtc-study-domain-changed", updateVisibleGameplayModeSwitch);
  window.addEventListener("storage", updateVisibleGameplayModeSwitch);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.addEventListener("load", init);
})();
