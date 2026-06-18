/* === Choix de matière : Acupuncture / Pharmacopée chinoise === */
(function(){
  "use strict";

  const STORAGE_KEY = "mtcStudyDomainChoice";
  const VALID_DOMAINS = ["acupuncture", "pharmacology"];

  function safeGetStoredDomain(){
    try{
      const stored = localStorage.getItem(STORAGE_KEY);
      return VALID_DOMAINS.includes(stored) ? stored : null;
    }catch(error){
      return null;
    }
  }

  function safeStoreDomain(domain){
    try{
      localStorage.setItem(STORAGE_KEY, domain);
    }catch(error){
      /* localStorage peut être indisponible en navigation privée : le jeu reste utilisable. */
    }
  }

  function setDocumentDomain(domain){
    document.documentElement.setAttribute("data-study-domain", domain);

    if(document.body){
      document.body.setAttribute("data-study-domain", domain);
    }

    window.MTC_STUDY_DOMAIN = domain;
  }

  function closeOpenPanelsWhenChangingDomain(){
    document.querySelectorAll(".open").forEach(element => {
      if(
        element.classList.contains("point-panel") ||
        element.classList.contains("cheatsheet-panel") ||
        element.classList.contains("advanced-search-panel") ||
        element.classList.contains("review-basket-panel") ||
        element.classList.contains("comparison-panel") ||
        element.classList.contains("stats-panel")
      ){
        element.classList.remove("open");
      }
    });

    document.body?.classList.remove("panel-open");
  }

  function updateDomainToggle(domain){
    const switchWrap = document.getElementById("studyDomainSwitch");
    const toggle = document.getElementById("studyDomainToggle");

    const label = domain === "pharmacology"
      ? "Matière actuelle : Pharmacopée chinoise"
      : "Matière actuelle : Acupuncture";

    if(switchWrap){
      switchWrap.title = label + " — basculer ACU / PHARMA";
      switchWrap.setAttribute("aria-label", label + " — basculer ACU / PHARMA");
    }

    if(toggle){
      toggle.checked = domain === "pharmacology";
      toggle.setAttribute("aria-label", label + " — basculer ACU / PHARMA");
    }
  }

  function chooseDomain(domain){
    if(!VALID_DOMAINS.includes(domain)) return;

    safeStoreDomain(domain);
    closeOpenPanelsWhenChangingDomain();
    setDocumentDomain(domain);
    updateDomainToggle(domain);

    try{
      window.dispatchEvent(new CustomEvent("mtc-study-domain-changed", {
        detail:{ domain }
      }));
    }catch(error){}
  }

  function toggleStudyDomain(){
    const currentDomain = document.documentElement.getAttribute("data-study-domain") || safeGetStoredDomain();

    if(currentDomain === "pharmacology"){
      chooseDomain("acupuncture");
    }else if(currentDomain === "acupuncture"){
      chooseDomain("pharmacology");
    }else{
      setDocumentDomain("choosing");
    }
  }

  function toggleStudyDomainFromControl(isPharmacology){
    chooseDomain(isPharmacology ? "pharmacology" : "acupuncture");
  }

  function showDomainChooser(){
    closeOpenPanelsWhenChangingDomain();
    setDocumentDomain("choosing");
  }

  function initStudyDomainLauncher(){
    const storedDomain = safeGetStoredDomain();

    if(storedDomain){
      setDocumentDomain(storedDomain);
      updateDomainToggle(storedDomain);
    }else{
      setDocumentDomain("none");
    }

    document.querySelectorAll("[data-study-domain-select]").forEach(button => {
      button.addEventListener("click", () => {
        chooseDomain(button.getAttribute("data-study-domain-select"));
      });
    });

    updateDomainToggle(storedDomain || "acupuncture");

    const switchWrap = document.getElementById("studyDomainSwitch");
    const switchTopline = switchWrap ? switchWrap.closest(".study-domain-topline") : null;

    function isMobileDomainSwitch(){
      return window.matchMedia && window.matchMedia("(max-width:520px)").matches;
    }

    if(switchTopline){
      switchTopline.addEventListener("pointerenter", () => {
        switchTopline.classList.add("is-open");
      });

      switchTopline.addEventListener("pointerleave", () => {
        switchTopline.classList.remove("is-open");
      });
    }

    if(switchWrap){
      switchWrap.addEventListener("click", event => {
        if(
          switchTopline &&
          isMobileDomainSwitch() &&
          !switchTopline.classList.contains("is-open")
        ){
          event.preventDefault();
          event.stopPropagation();
          switchTopline.classList.add("is-open");
          return;
        }

        if(event.target && event.target.id === "studyDomainToggle") return;
        if(event.target && event.target.classList && event.target.classList.contains("slider")) return;

        const toggle = document.getElementById("studyDomainToggle");
        if(toggle){
          toggle.checked = !toggle.checked;
          toggleStudyDomainFromControl(toggle.checked);
        }
      });
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initStudyDomainLauncher);
  }else{
    initStudyDomainLauncher();
  }

  window.chooseStudyDomain = chooseDomain;
  window.toggleStudyDomain = toggleStudyDomain;
  window.toggleStudyDomainFromControl = toggleStudyDomainFromControl;
  window.showStudyDomainChooser = showDomainChooser;
})();
