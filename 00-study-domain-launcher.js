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

    document.querySelectorAll(".study-domain-topline.is-open").forEach(element => {
      element.classList.remove("is-open");
    });
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

  function getCurrentDomain(){
    const currentDomain =
      document.documentElement.getAttribute("data-study-domain") ||
      window.MTC_STUDY_DOMAIN ||
      safeGetStoredDomain() ||
      "acupuncture";

    return VALID_DOMAINS.includes(currentDomain) ? currentDomain : "acupuncture";
  }

  function chooseOppositeDomain(){
    chooseDomain(getCurrentDomain() === "pharmacology" ? "acupuncture" : "pharmacology");
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
      return window.matchMedia && window.matchMedia("(max-width:520px), (pointer:coarse)").matches;
    }

    function getMobileDomainChoiceFromTarget(target){
      let element = target;

      while(element && element !== switchWrap){
        if(
          element.parentElement === switchWrap &&
          element.tagName === "SPAN" &&
          !element.classList.contains("slider")
        ){
          const text = (element.textContent || "").trim().toLowerCase();
          if(text.includes("pharma")) return "pharmacology";
          if(text.includes("acu")) return "acupuncture";
        }

        element = element.parentElement;
      }

      return null;
    }

    if(switchTopline){
      switchTopline.addEventListener("pointerenter", () => {
        if(!isMobileDomainSwitch()) switchTopline.classList.add("is-open");
      });

      switchTopline.addEventListener("pointerleave", () => {
        switchTopline.classList.remove("is-open");
      });

      document.addEventListener("pointerdown", event => {
        if(
          isMobileDomainSwitch() &&
          switchTopline.classList.contains("is-open") &&
          !switchTopline.contains(event.target)
        ){
          switchTopline.classList.remove("is-open");
        }
      }, { passive:true });
    }

    if(switchWrap){
      Array.from(switchWrap.children).forEach(span => {
        if(span.tagName !== "SPAN") return;
        const text = (span.textContent || "").trim().toLowerCase();

        if(text.includes("pharma")){
          span.setAttribute("data-mobile-domain-choice", "pharmacology");
          span.setAttribute("role", "button");
          span.setAttribute("tabindex", "0");
        }else if(text.includes("acu")){
          span.setAttribute("data-mobile-domain-choice", "acupuncture");
          span.setAttribute("role", "button");
          span.setAttribute("tabindex", "0");
        }
      });

      const nativeToggle = document.getElementById("studyDomainToggle");
      let lastMobilePointerHandledAt = 0;

      function stopNativeSwitchEvent(event){
        event.preventDefault();
        event.stopPropagation();

        if(typeof event.stopImmediatePropagation === "function"){
          event.stopImmediatePropagation();
        }
      }

      function getMobileDomainChoiceFromTarget(target){
        if(!target) return null;

        const choiceElement = target.closest
          ? target.closest("[data-mobile-domain-choice]")
          : null;

        if(choiceElement && switchWrap.contains(choiceElement)){
          const choice = choiceElement.getAttribute("data-mobile-domain-choice");
          return VALID_DOMAINS.includes(choice) ? choice : null;
        }

        return null;
      }

      function targetIsNativeSwitch(target){
        if(!target) return false;

        if(target.id === "studyDomainToggle") return true;

        if(target.classList && target.classList.contains("slider")) return true;

        return !!(target.closest && target.closest("label.switch"));
      }

      function handleMobileDomainPointer(event, source){
        if(!switchTopline || !isMobileDomainSwitch()) return false;

        stopNativeSwitchEvent(event);

        const now = Date.now();

        if(source === "click" && now - lastMobilePointerHandledAt < 700){
          updateDomainToggle(getCurrentDomain());
          return true;
        }

        if(source !== "click"){
          lastMobilePointerHandledAt = now;
        }

        if(!switchTopline.classList.contains("is-open")){
          switchTopline.classList.add("is-open");
          updateDomainToggle(getCurrentDomain());
          return true;
        }

        const chosenDomain = getMobileDomainChoiceFromTarget(event.target);

        if(chosenDomain){
          chooseDomain(chosenDomain);
        }else if(targetIsNativeSwitch(event.target)){
          chooseOppositeDomain();
        }else{
          switchTopline.classList.remove("is-open");
          updateDomainToggle(getCurrentDomain());
        }

        return true;
      }

      if(window.PointerEvent){
        switchWrap.addEventListener("pointerdown", event => {
          handleMobileDomainPointer(event, "pointerdown");
        }, true);
      }else{
        switchWrap.addEventListener("touchstart", event => {
          handleMobileDomainPointer(event, "touchstart");
        }, { capture:true, passive:false });
      }

      switchWrap.addEventListener("click", event => {
        if(handleMobileDomainPointer(event, "click")) return;

        if(event.target && event.target.id === "studyDomainToggle") return;
        if(event.target && event.target.classList && event.target.classList.contains("slider")) return;
        if(event.target && event.target.closest && event.target.closest("label.switch")) return;

        const toggle = document.getElementById("studyDomainToggle");
        if(toggle){
          toggle.checked = !toggle.checked;
          toggleStudyDomainFromControl(toggle.checked);
        }
      }, true);

      switchWrap.addEventListener("keydown", event => {
        if(!isMobileDomainSwitch()) return;

        if(event.key !== "Enter" && event.key !== " ") return;

        const chosenDomain = getMobileDomainChoiceFromTarget(event.target);

        if(chosenDomain){
          stopNativeSwitchEvent(event);
          chooseDomain(chosenDomain);
        }
      }, true);

      if(nativeToggle){
        nativeToggle.addEventListener("change", event => {
          if(!isMobileDomainSwitch()) return;

          stopNativeSwitchEvent(event);
          updateDomainToggle(getCurrentDomain());
        }, true);
      }
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
