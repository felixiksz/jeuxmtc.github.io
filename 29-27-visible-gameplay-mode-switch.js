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

  function updateVisibleGameplayModeSwitch(){
    const domain = activeDomain();
    const wrap = document.getElementById("gameplayModeTopline");
    const review = document.getElementById("gameplayModeReviewBtn");
    const exam = document.getElementById("gameplayModeExamBtn");
    if(!wrap || !review || !exam) return;

    const visible = domain === "acupuncture" || domain === "pharmacology";
    wrap.hidden = !visible;
    wrap.classList.toggle("is-hidden", !visible);
    if(!visible) return;

    const mode = currentModeForDomain(domain);
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
