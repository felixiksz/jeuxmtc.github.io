/* === Choix de matière : Acupuncture / Pharmacopée chinoise ===
   Version propre : le contrôle principal est un menu déroulant natif.
   Cela évite les doubles clics / superpositions du switch sur mobile. */
(function(){
  "use strict";

  const STORAGE_KEY = "mtcStudyDomainChoice";
  const VALID_DOMAINS = ["acupuncture", "pharmacology"];

  function isValidDomain(domain){
    return VALID_DOMAINS.includes(domain);
  }

  function safeGetStoredDomain(){
    try{
      const stored = localStorage.getItem(STORAGE_KEY);
      return isValidDomain(stored) ? stored : null;
    }catch(error){
      return null;
    }
  }

  function safeStoreDomain(domain){
    try{
      localStorage.setItem(STORAGE_KEY, domain);
    }catch(error){
      /* localStorage peut être indisponible en navigation privée. */
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

    if(document.body){
      document.body.classList.remove("panel-open");
    }
  }

  function currentDomain(){
    const fromDocument = document.documentElement.getAttribute("data-study-domain");
    return isValidDomain(fromDocument)
      ? fromDocument
      : (safeGetStoredDomain() || "acupuncture");
  }

  function domainLabel(domain){
    return domain === "pharmacology"
      ? "Matière actuelle : Pharmacopée chinoise"
      : "Matière actuelle : Acupuncture";
  }

  function updateDomainControls(domain){
    const cleanDomain = isValidDomain(domain) ? domain : currentDomain();
    const label = domainLabel(cleanDomain);

    const select = document.getElementById("studyDomainSelect");
    if(select){
      select.value = cleanDomain;
      select.title = label;
      select.setAttribute("aria-label", "Choisir la matière — " + label);
    }

    /* Compatibilité avec d'anciennes versions locales qui auraient encore le switch. */
    const toggle = document.getElementById("studyDomainToggle");
    if(toggle){
      toggle.checked = cleanDomain === "pharmacology";
      toggle.setAttribute("aria-label", label + " — basculer ACU / PHARMA");
    }

    const switchWrap = document.getElementById("studyDomainSwitch");
    if(switchWrap){
      switchWrap.title = label + " — basculer ACU / PHARMA";
      switchWrap.setAttribute("aria-label", label + " — basculer ACU / PHARMA");
    }
  }

  let domainApplyTimer = null;

  function forceRenderDomain(domain){
    if(domainApplyTimer){
      clearTimeout(domainApplyTimer);
    }

    domainApplyTimer = setTimeout(() => {
      /* On répète volontairement l'attribut ici : certains navigateurs mobiles
         appliquent les événements de <select> en deux temps. */
      setDocumentDomain(domain);
      updateDomainControls(domain);

      if(domain === "pharmacology"){
        if(typeof window.ensurePharmaDisplayControls === "function"){
          window.ensurePharmaDisplayControls();
        }

        if(typeof window.startPharmaGame === "function"){
          window.startPharmaGame();
        }else if(typeof window.newGame === "function"){
          window.newGame();
        }
      }else if(domain === "acupuncture"){
        if(typeof window.newGame === "function"){
          window.newGame();
        }
      }
    }, 0);
  }

  function chooseDomain(domain){
    if(!isValidDomain(domain)) return;

    safeStoreDomain(domain);
    closeOpenPanelsWhenChangingDomain();
    setDocumentDomain(domain);
    updateDomainControls(domain);

    try{
      window.dispatchEvent(new CustomEvent("mtc-study-domain-changed", {
        detail:{ domain }
      }));
    }catch(error){}

    /* Important : ne plus dépendre seulement du MutationObserver PHARMA.
       Le choix lance directement le module correspondant. */
    forceRenderDomain(domain);
  }

  function toggleStudyDomain(){
    chooseDomain(currentDomain() === "pharmacology" ? "acupuncture" : "pharmacology");
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
    }else{
      setDocumentDomain("none");
    }

    document.querySelectorAll("[data-study-domain-select]").forEach(button => {
      button.addEventListener("click", () => {
        chooseDomain(button.getAttribute("data-study-domain-select"));
      });
    });

    const select = document.getElementById("studyDomainSelect");
    if(select && select.dataset.domainSelectReady !== "1"){
      select.dataset.domainSelectReady = "1";

      const applySelectValue = event => {
        chooseDomain(event.currentTarget.value);
      };

      select.addEventListener("change", applySelectValue);
      select.addEventListener("input", applySelectValue);
    }

    /* Compatibilité ancienne : si un ancien index contient encore le checkbox, il reste utilisable. */
    const oldToggle = document.getElementById("studyDomainToggle");
    if(oldToggle){
      oldToggle.addEventListener("change", event => {
        toggleStudyDomainFromControl(event.currentTarget.checked);
      });
    }

    updateDomainControls(storedDomain || "acupuncture");
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
