/* === Choix de matière : Acupuncture / Pharmacopée chinoise ===
   Version propre mobile : un tap ouvre le menu, puis ACU/PHARMA sont deux choix directs.
   Le switch natif reste disponible sur ordinateur, mais il est neutralisé/masqué sur mobile. */
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
      /* localStorage peut être indisponible : le choix reste actif pendant la session. */
    }
  }

  function getCurrentDomain(){
    const current =
      document.documentElement.getAttribute("data-study-domain") ||
      (document.body && document.body.getAttribute("data-study-domain")) ||
      window.MTC_STUDY_DOMAIN ||
      safeGetStoredDomain() ||
      "acupuncture";

    return isValidDomain(current) ? current : "acupuncture";
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

  function domainLabel(domain){
    return domain === "pharmacology"
      ? "Matière actuelle : Pharmacopée chinoise"
      : "Matière actuelle : Acupuncture";
  }

  function updateDomainToggle(domain){
    const cleanDomain = isValidDomain(domain) ? domain : getCurrentDomain();
    const switchWrap = document.getElementById("studyDomainSwitch");
    const toggle = document.getElementById("studyDomainToggle");
    const label = domainLabel(cleanDomain);

    if(switchWrap){
      switchWrap.dataset.currentDomain = cleanDomain;
      switchWrap.title = label + " — basculer ACU / PHARMA";
      switchWrap.setAttribute("aria-label", label + " — ouvrir le choix ACU / PHARMA");
      switchWrap.querySelectorAll("[data-mobile-domain-choice]").forEach(option => {
        const active = option.getAttribute("data-mobile-domain-choice") === cleanDomain;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    if(toggle){
      toggle.checked = cleanDomain === "pharmacology";
      toggle.setAttribute("aria-label", label + " — basculer ACU / PHARMA");
    }
  }

  function closeMobileDomainMenu(){
    document.querySelectorAll(".study-domain-topline.is-open").forEach(element => {
      element.classList.remove("is-open");
    });
  }

  function chooseDomain(domain){
    if(!isValidDomain(domain)) return;

    safeStoreDomain(domain);
    closeOpenPanelsWhenChangingDomain();
    setDocumentDomain(domain);
    updateDomainToggle(domain);
    closeMobileDomainMenu();

    try{
      window.dispatchEvent(new CustomEvent("mtc-study-domain-changed", {
        detail:{ domain }
      }));
    }catch(error){}
  }

  function toggleStudyDomain(){
    const current = getCurrentDomain();
    chooseDomain(current === "pharmacology" ? "acupuncture" : "pharmacology");
  }

  function toggleStudyDomainFromControl(isPharmacology){
    chooseDomain(isPharmacology ? "pharmacology" : "acupuncture");
  }

  function showDomainChooser(){
    closeOpenPanelsWhenChangingDomain();
    setDocumentDomain("choosing");
  }

  function isMobileDomainSwitch(){
    return !!(window.matchMedia && window.matchMedia("(max-width:520px), (pointer:coarse)").matches);
  }

  function prepareDomainSwitch(){
    const switchWrap = document.getElementById("studyDomainSwitch");
    const switchTopline = switchWrap ? switchWrap.closest(".study-domain-topline") : null;
    const toggle = document.getElementById("studyDomainToggle");

    if(!switchWrap) return;

    Array.from(switchWrap.children).forEach(child => {
      if(child.tagName !== "SPAN") return;

      const text = (child.textContent || "").trim().toLowerCase();
      let domain = null;

      if(text.includes("pharma")) domain = "pharmacology";
      if(text.includes("acu")) domain = "acupuncture";

      if(!domain) return;

      child.setAttribute("data-mobile-domain-choice", domain);
      child.setAttribute("role", "button");
      child.setAttribute("tabindex", "0");
      child.setAttribute("aria-label", domain === "pharmacology" ? "Choisir pharmacopée" : "Choisir acupuncture");
    });

    switchWrap.addEventListener("click", event => {
      const choice = event.target && event.target.closest
        ? event.target.closest("[data-mobile-domain-choice]")
        : null;

      if(choice && switchWrap.contains(choice)){
        event.preventDefault();
        event.stopPropagation();
        chooseDomain(choice.getAttribute("data-mobile-domain-choice"));
        return;
      }

      if(isMobileDomainSwitch()){
        event.preventDefault();
        event.stopPropagation();
        if(switchTopline){
          switchTopline.classList.toggle("is-open");
        }
        updateDomainToggle(getCurrentDomain());
        return;
      }

      /* Ordinateur : clic sur le fond du switch = bascule simple. */
      if(!(event.target && event.target.id === "studyDomainToggle") && !(event.target && event.target.closest && event.target.closest("label.switch"))){
        toggleStudyDomain();
      }
    });

    switchWrap.addEventListener("keydown", event => {
      if(event.key !== "Enter" && event.key !== " ") return;

      const choice = event.target && event.target.closest
        ? event.target.closest("[data-mobile-domain-choice]")
        : null;

      if(choice && switchWrap.contains(choice)){
        event.preventDefault();
        chooseDomain(choice.getAttribute("data-mobile-domain-choice"));
        return;
      }

      if(isMobileDomainSwitch() && switchTopline){
        event.preventDefault();
        switchTopline.classList.toggle("is-open");
      }
    });

    if(toggle){
      toggle.addEventListener("change", event => {
        if(isMobileDomainSwitch()){
          /* Sur mobile, le switch natif est masqué : on évite toute double-bascule. */
          event.preventDefault();
          updateDomainToggle(getCurrentDomain());
          return;
        }

        toggleStudyDomainFromControl(event.target.checked);
      });
    }

    if(switchTopline){
      switchTopline.addEventListener("mouseenter", () => {
        if(!isMobileDomainSwitch()) switchTopline.classList.add("is-open");
      });

      switchTopline.addEventListener("mouseleave", () => {
        if(!isMobileDomainSwitch()) switchTopline.classList.remove("is-open");
      });
    }

    document.addEventListener("click", event => {
      if(!isMobileDomainSwitch() || !switchTopline) return;
      if(!switchTopline.contains(event.target)) closeMobileDomainMenu();
    });
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

    prepareDomainSwitch();
    updateDomainToggle(storedDomain || "acupuncture");
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
