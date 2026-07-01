/* === Recherche : mode A|B pour envoyer des résultats vers la comparaison === */
(function(){
  "use strict";

  const PHARMA_COMPARISON_KEY = "mtc_pharma_comparison_slots_v1";
  const MAX_COMPARISON_SLOTS = 26;
  const state = { acupuncture:false, pharmacology:false };
  const lastHandled = { trigger:0, addAll:0 };

  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function stop(event){
    if(!event) return;
    try{ event.preventDefault(); }catch(error){}
    try{ event.stopPropagation(); }catch(error){}
    try{ event.stopImmediatePropagation(); }catch(error){}
  }
  function dedupe(key, delay){
    const t = now();
    if(t - (lastHandled[key] || 0) < (delay || 320)) return true;
    lastHandled[key] = t;
    return false;
  }

  function domain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology"
      ? "pharmacology"
      : "acupuncture";
  }

  function isPharma(){ return domain() === "pharmacology"; }
  function isActive(){ return !!state[domain()]; }

  function readJson(key, fallback){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed == null ? fallback : parsed;
    }catch(error){
      return fallback;
    }
  }

  function pharmaSlots(){
    const parsed = readJson(PHARMA_COMPARISON_KEY, []);
    const slots = Array.isArray(parsed) ? parsed.map(value => value ? String(value) : "") : [];
    while(slots.length < MAX_COMPARISON_SLOTS) slots.push("");
    return slots.slice(0, MAX_COMPARISON_SLOTS);
  }

  function acuSlots(){
    if(typeof window.getComparisonPoints === "function"){
      try{
        const slots = window.getComparisonPoints();
        if(Array.isArray(slots)) return slots.map(value => value ? String(value) : "");
      }catch(error){}
    }
    return [];
  }

  function slotsForCurrentDomain(){ return isPharma() ? pharmaSlots() : acuSlots(); }

  function isInComparison(id){
    const cleanId = String(id || "").trim();
    if(!cleanId) return false;
    return slotsForCurrentDomain().includes(cleanId);
  }

  function removeAcuPoint(point){
    if(typeof window.getComparisonPoints !== "function" || typeof window.saveComparisonPoints !== "function") return;
    const slots = window.getComparisonPoints();
    const index = slots.findIndex(value => String(value || "") === String(point || ""));
    if(index >= 0){
      slots[index] = "";
      window.saveComparisonPoints(slots);
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
      if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    }
  }

  function addItem(id){
    const cleanId = String(id || "").trim();
    if(!cleanId) return false;
    if(isInComparison(cleanId)) return true;

    if(isPharma()){
      if(typeof window.togglePharmaComparisonHerb === "function"){
        // togglePharmaComparisonHerb ajoute si absent ; on ne l’appelle jamais ici si déjà présent.
        window.togglePharmaComparisonHerb(cleanId, {autoOpen:false});
      }else if(typeof window.addPointToComparison === "function"){
        window.addPointToComparison(cleanId, {autoOpen:false});
      }else{
        const slots = pharmaSlots();
        const freeIndex = slots.findIndex(value => !value);
        if(freeIndex < 0) return false;
        slots[freeIndex] = cleanId;
        try{ localStorage.setItem(PHARMA_COMPARISON_KEY, JSON.stringify(slots)); }catch(error){}
      }
    }else if(typeof window.addPointToComparison === "function"){
      window.addPointToComparison(cleanId, {autoOpen:false});
    }else{
      return false;
    }

    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    return true;
  }

  function removeItem(id){
    const cleanId = String(id || "").trim();
    if(!cleanId) return;

    if(isPharma()){
      if(typeof window.togglePharmaComparisonHerb === "function" && isInComparison(cleanId)){
        window.togglePharmaComparisonHerb(cleanId, {autoOpen:false});
      }
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
      if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
      return;
    }

    removeAcuPoint(cleanId);
  }

  function toggleItem(id){
    const cleanId = String(id || "").trim();
    if(!cleanId) return;
    if(isInComparison(cleanId)) removeItem(cleanId);
    else addItem(cleanId);
    setTimeout(enhanceSearchPanel, 0);
  }

  function panel(){ return document.getElementById("advancedSearchPanel"); }
  function resultsContainer(){ return document.getElementById("advancedSearchResults"); }

  function resultRows(){
    const container = resultsContainer();
    if(!container) return [];
    return Array.from(container.querySelectorAll(".search-result-item .compact-point-row"));
  }

  function itemIdFromRow(row){
    if(!row) return "";

    const pharmaButton = row.querySelector("[data-pharma-basket-herb], [data-pharma-comparison-herb]");
    if(pharmaButton){
      const id = pharmaButton.dataset.pharmaBasketHerb || pharmaButton.dataset.pharmaComparisonHerb;
      if(id) return String(id).trim();
    }

    const acuButton = row.querySelector("[data-basket-point], [data-comparison-point]");
    if(acuButton){
      const id = acuButton.dataset.basketPoint || acuButton.dataset.comparisonPoint;
      if(id) return String(id).trim();
    }

    const onclick = row.getAttribute("onclick") || "";
    const pharmaMatch = onclick.match(/openPharmaHerbPanel\((['\"])(.*?)\1\)/);
    if(pharmaMatch) return pharmaMatch[2];

    const acuMatch = onclick.match(/openPointPanelDirect\((['\"])(.*?)\1\)/);
    if(acuMatch) return acuMatch[2];

    return "";
  }

  function labelFromRow(row, id){
    const label = row?.querySelector(".compact-point-code")?.textContent || row?.textContent || id || "élément";
    return String(label).replace(/\s+/g," ").trim();
  }

  function basketButtonsForRow(row){
    if(!row) return [];
    return Array.from(row.querySelectorAll("[data-pharma-basket-herb], [data-basket-point]")).filter(button => !button.classList.contains("search-compare-result-toggle"));
  }

  function setBasketButtonsHidden(row, hidden){
    basketButtonsForRow(row).forEach(button => {
      button.classList.toggle("search-compare-hidden-basket", !!hidden);
      if(hidden){
        button.setAttribute("aria-hidden", "true");
        button.setAttribute("tabindex", "-1");
      }else{
        button.removeAttribute("aria-hidden");
        button.removeAttribute("tabindex");
      }
    });
  }

  function visibleIds(){ return resultRows().map(itemIdFromRow).filter(Boolean); }
  function hasSearchResults(){ return visibleIds().length > 0; }

  function addAllVisible(){
    const ids = Array.from(new Set(visibleIds()));
    if(!ids.length) return;

    let added = 0;
    ids.forEach(id => {
      if(!isInComparison(id)){
        if(addItem(id)) added += 1;
      }
    });

    const msg = document.getElementById("message") || window.message;
    if(msg){
      msg.textContent = added
        ? `${added} élément(s) ajouté(s) à la comparaison.`
        : "Tous les résultats affichés sont déjà dans la comparaison.";
    }

    setTimeout(enhanceSearchPanel, 0);
  }

  function resultNoun(){ return isPharma() ? "substance(s)" : "point(s)"; }

  function makeButton(className, text, tooltip, disabledLike){
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.setAttribute("aria-label", tooltip);
    button.setAttribute("data-search-compare-tooltip", tooltip);
    button.title = tooltip;
    if(disabledLike){
      button.classList.add("is-disabled");
      button.setAttribute("aria-disabled", "true");
    }else{
      button.setAttribute("aria-disabled", "false");
    }
    return button;
  }

  function handleTrigger(event){
    stop(event);
    if(dedupe("trigger")) return false;
    window.toggleSearchCompareSelectMode();
    return false;
  }

  function handleAddAll(event){
    stop(event);
    if(dedupe("addAll")) return false;
    window.addVisibleSearchResultsToComparison();
    return false;
  }

  function bindActionButton(button, handler){
    if(!button || button.__searchCompareBound) return;
    button.__searchCompareBound = true;
    button.addEventListener("click", handler, true);
    button.addEventListener("pointerup", handler, {capture:true, passive:false});
    button.addEventListener("touchend", handler, {capture:true, passive:false});
  }

  function handleResultToggleButton(button, event){
    stop(event);
    const targetId = button.getAttribute("data-search-compare-result-id") || "";
    if(!targetId) return false;
    // Sur mobile, pointerup/touchend/click peuvent se succéder. Sans dédoublonnage,
    // un tap ajoute puis retire aussitôt — ou inversement.
    if(dedupe("result:" + targetId, 520)) return false;
    toggleItem(targetId);
    return false;
  }

  function buildControls(hasResults){
    const active = isActive() && hasResults;
    const actions = document.createElement("span");
    actions.className = "search-compare-actions";
    actions.setAttribute("data-search-compare-actions", "");

    const title = "Sélectionner des éléments à comparer";
    const toggle = makeButton(
      `search-compare-mode-button ${active ? "is-active" : ""}`,
      "A|B",
      title,
      !hasResults
    );
    toggle.setAttribute("data-search-compare-trigger", "1");
    bindActionButton(toggle, handleTrigger);
    actions.appendChild(toggle);

    if(active){
      const addAll = makeButton(
        "search-compare-add-visible-button",
        "Tout",
        "Ajouter tous les résultats affichés à la comparaison",
        !hasResults
      );
      addAll.setAttribute("data-search-compare-add-all", "1");
      bindActionButton(addAll, handleAddAll);
      actions.appendChild(addAll);
    }

    return actions;
  }

  function ensureResultCountLine(container, hasResults){
    let count = container.querySelector(":scope > .search-result-count");
    if(!count){
      count = document.createElement("div");
      count.className = "search-result-count";
      count.textContent = `0 ${resultNoun()}`;
      container.insertBefore(count, container.firstChild || null);
    }

    count.classList.add("search-compare-result-count-line");

    let baseText = count.getAttribute("data-search-base-text");
    const currentTextWithoutActions = (function(){
      const clone = count.cloneNode(true);
      clone.querySelectorAll("[data-search-compare-actions]").forEach(node => node.remove());
      return (clone.textContent || "").replace(/\s+/g," ").trim();
    })();

    if(!baseText || currentTextWithoutActions && !currentTextWithoutActions.includes("A|B") && currentTextWithoutActions !== baseText){
      baseText = currentTextWithoutActions || `0 ${resultNoun()}`;
      count.setAttribute("data-search-base-text", baseText);
    }

    count.textContent = baseText + " ";
    count.appendChild(buildControls(hasResults));
    return count;
  }

  function injectControls(){
    const p = panel();
    const container = resultsContainer();
    if(!p || !container || !p.classList.contains("open")) return;

    const hasResults = hasSearchResults();
    if(!hasResults) state[domain()] = false;

    p.classList.toggle("search-compare-mode", isActive() && hasResults);
    ensureResultCountLine(container, hasResults);
  }

  function injectResultButtons(){
    const p = panel();
    if(!p || !p.classList.contains("open")) return;

    resultRows().forEach(row => {
      const id = itemIdFromRow(row);
      if(!id) return;

      const item = row.closest(".search-result-item");
      let tools = row.querySelector(".compact-point-tools");
      if(!tools){
        tools = document.createElement("span");
        tools.className = "compact-point-tools search-compare-created-tools";
        row.appendChild(tools);
      }

      const present = isInComparison(id);
      if(item) item.classList.toggle("search-compare-selected", present);

      let button = tools.querySelector(".search-compare-result-toggle");
      if(!isActive()){
        setBasketButtonsHidden(row, false);
        if(button) button.remove();
        return;
      }

      setBasketButtonsHidden(row, true);

      const label = labelFromRow(row, id);
      const title = present
        ? `Retirer ${label} de la comparaison`
        : `Ajouter ${label} à la comparaison`;

      if(!button){
        button = document.createElement("button");
        button.type = "button";
        button.className = "search-compare-result-toggle";
        button.textContent = "A|B";
        button.addEventListener("click", event => handleResultToggleButton(button, event), true);
        button.addEventListener("pointerup", event => handleResultToggleButton(button, event), {capture:true, passive:false});
        button.addEventListener("touchend", event => handleResultToggleButton(button, event), {capture:true, passive:false});
        const firstBasket = basketButtonsForRow(row)[0] || null;
        tools.insertBefore(button, firstBasket || tools.firstChild || null);
      }

      button.classList.toggle("is-active", present);
      button.setAttribute("data-search-compare-result-id", id);
      button.title = title;
      button.setAttribute("aria-label", title);
      button.setAttribute("data-search-compare-tooltip", title);
    });
  }

  function enhanceSearchPanel(){
    injectControls();
    injectResultButtons();
  }

  window.toggleSearchCompareSelectMode = function(event){
    stop(event);
    const key = domain();
    if(!hasSearchResults()){
      state[key] = false;
      enhanceSearchPanel();
      return false;
    }
    state[key] = !state[key];
    enhanceSearchPanel();

    if(state[key] && typeof window.showProgressHintSoon === "function"){
      window.showProgressHintSoon(
        "search_compare_select_mode",
        ".search-compare-result-toggle",
        "Sélection A|B",
        "Clique sur les petits boutons A|B dans les résultats pour ajouter ou retirer des éléments du panneau de comparaison. “Tout” ajoute les résultats affichés.",
        {position:"aboveBottom"},
        260
      );
    }
    return false;
  };

  window.addVisibleSearchResultsToComparison = function(event){
    stop(event);
    addAllVisible();
    return false;
  };
  window.enhanceSearchCompareSelectPanel = enhanceSearchPanel;

  function wrapRender(name){
    const previous = window[name];
    if(typeof previous !== "function" || previous.__searchCompareSelectWrapped) return;

    const wrapped = function(){
      const result = previous.apply(this, arguments);
      setTimeout(enhanceSearchPanel, 0);
      return result;
    };
    wrapped.__searchCompareSelectWrapped = true;
    window[name] = wrapped;
  }

  function patchTour(){
    const previousStartTour = window.startTour;
    if(typeof previousStartTour !== "function" || previousStartTour.__searchCompareTourWrapped) return;

    const wrapped = function(){
      const result = previousStartTour.apply(this, arguments);
      try{
        if(typeof tourSteps !== "undefined" && Array.isArray(tourSteps)){
          const step = tourSteps.find(item => item && item.selector === "#advancedSearchButton");
          if(step && !String(step.text || "").includes("bouton A|B")){
            step.text += " Dans le panneau Recherche, le bouton A|B active une sélection directe : tu peux envoyer des résultats au panneau de comparaison un par un, ou utiliser “Tout” pour les résultats affichés.";
          }
        }
      }catch(error){}
      return result;
    };
    wrapped.__searchCompareTourWrapped = true;
    window.startTour = wrapped;
  }

  function showTooltip(target){
    const text = target?.getAttribute("data-search-compare-tooltip") || target?.getAttribute("aria-label") || "";
    if(!text) return;
    let tip = document.querySelector(".search-compare-floating-tooltip");
    if(!tip){
      tip = document.createElement("div");
      tip.className = "search-compare-floating-tooltip";
      tip.setAttribute("role", "tooltip");
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.classList.add("visible");

    const margin = 10;
    const rect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const desiredLeft = rect.left + rect.width / 2 - tipRect.width / 2;
    const left = Math.max(margin, Math.min(desiredLeft, window.innerWidth - tipRect.width - margin));
    let top = rect.top - tipRect.height - 10;
    let arrowOnTop = false;
    if(top < margin){
      top = rect.bottom + 10;
      arrowOnTop = true;
    }
    const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, tipRect.width - 16));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.setProperty("--search-compare-arrow-left", `${arrowLeft}px`);
    tip.classList.toggle("is-below", arrowOnTop);
  }

  function hideTooltip(){
    const tip = document.querySelector(".search-compare-floating-tooltip");
    if(tip) tip.classList.remove("visible", "is-below");
  }

  function delegatedAction(event){
    const resultButton = event.target.closest?.(".search-compare-result-toggle[data-search-compare-result-id]");
    if(resultButton){
      return handleResultToggleButton(resultButton, event);
    }

    const trigger = event.target.closest?.("[data-search-compare-trigger]");
    if(trigger){
      if(trigger.getAttribute("aria-disabled") === "true"){
        stop(event);
        return false;
      }
      return handleTrigger(event);
    }

    const addAll = event.target.closest?.("[data-search-compare-add-all]");
    if(addAll){
      if(addAll.getAttribute("aria-disabled") === "true"){
        stop(event);
        return false;
      }
      return handleAddAll(event);
    }
  }

  function bindGlobalEvents(){
    document.addEventListener("click", delegatedAction, true);
    document.addEventListener("pointerup", delegatedAction, true);
    document.addEventListener("touchend", delegatedAction, {capture:true, passive:false});

    document.addEventListener("mouseover", event => {
      const target = event.target.closest?.("[data-search-compare-tooltip]");
      if(target) showTooltip(target);
    }, true);

    document.addEventListener("mouseout", event => {
      if(event.target.closest?.("[data-search-compare-tooltip]")) hideTooltip();
    }, true);

    document.addEventListener("focusin", event => {
      const target = event.target.closest?.("[data-search-compare-tooltip]");
      if(target) showTooltip(target);
    });

    document.addEventListener("focusout", event => {
      if(event.target.closest?.("[data-search-compare-tooltip]")) hideTooltip();
    });
  }

  function init(){
    wrapRender("renderAdvancedSearchPanel");
    wrapRender("renderAdvancedSearchResults");
    patchTour();
    bindGlobalEvents();
    enhanceSearchPanel();

    const p = panel();
    if(p && window.MutationObserver){
      const observer = new MutationObserver(() => {
        window.requestAnimationFrame(enhanceSearchPanel);
      });
      observer.observe(p, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
