/* === 33-stable-hotfix.js
   Correctifs isolés pour repartir de la dernière version stable. === */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }

  function domain(){
    return document.documentElement.getAttribute("data-study-domain") || window.MTC_STUDY_DOMAIN || "none";
  }

  function escAttr(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function getAcuComparisonSlots(){
    if(typeof window.getComparisonPoints === "function"){
      try{ return window.getComparisonPoints(); }catch(error){}
    }
    try{
      const parsed = JSON.parse(localStorage.getItem("connections_mtc_comparison_points_v1") || "[]");
      return [parsed?.[0] ? String(parsed[0]) : "", parsed?.[1] ? String(parsed[1]) : ""];
    }catch(error){
      return ["", ""];
    }
  }

  function saveAcuComparisonSlots(slots){
    if(typeof window.saveComparisonPoints === "function"){
      try{ window.saveComparisonPoints(slots); return; }catch(error){}
    }
    try{ localStorage.setItem("connections_mtc_comparison_points_v1", JSON.stringify([slots?.[0] || "", slots?.[1] || ""])); }catch(error){}
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
  }

  function toggleAcuComparison(point){
    const clean = String(point || "").trim();
    if(!clean) return;
    const slots = getAcuComparisonSlots();
    const existing = slots.findIndex(item => item === clean);
    if(existing >= 0){
      slots[existing] = "";
    }else{
      const free = slots.findIndex(item => !item);
      slots[free >= 0 ? free : 0] = clean;
    }
    saveAcuComparisonSlots(slots);
  }

  function getPharmaComparisonSlots(){
    try{
      const parsed = JSON.parse(localStorage.getItem("mtc_pharma_comparison_slots_v1") || "[]");
      return Array.isArray(parsed) ? parsed.map(value => value ? String(value) : "") : [];
    }catch(error){
      return [];
    }
  }

  function isInComparison(id){
    const clean = String(id || "").trim();
    if(!clean) return false;
    if(domain() === "pharmacology") return getPharmaComparisonSlots().includes(clean);
    return getAcuComparisonSlots().includes(clean);
  }

  function toggleHeaderComparison(id){
    const clean = String(id || "").trim();
    if(!clean) return;
    if(domain() === "pharmacology"){
      if(typeof window.togglePharmaComparisonHerb === "function"){
        window.togglePharmaComparisonHerb(clean, {autoOpen:false});
      }else if(typeof window.addPharmaHerbToComparison === "function"){
        window.addPharmaHerbToComparison(clean, {autoOpen:false});
      }
    }else{
      toggleAcuComparison(clean);
    }
    updateHeaderCompareButtons();
  }

  function itemIdFromHeader(header){
    if(!header) return "";
    const pharmaBasket = header.querySelector("[data-pharma-basket-herb]");
    if(pharmaBasket) return pharmaBasket.getAttribute("data-pharma-basket-herb") || "";
    const acuBasket = header.querySelector("[data-basket-point]");
    if(acuBasket) return acuBasket.getAttribute("data-basket-point") || "";
    return "";
  }

  function ensureHeaderCompareButton(header){
    const id = itemIdFromHeader(header);
    if(!id) return null;
    let button = header.querySelector(".mtc-header-compare-button");
    if(!button){
      button = document.createElement("button");
      button.type = "button";
      button.className = "comparison-add-button mtc-header-compare-button";
      button.textContent = "A|B";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleHeaderComparison(button.getAttribute("data-compare-id") || "");
      });
      header.appendChild(button);
    }
    button.setAttribute("data-compare-id", id);
    return button;
  }

  function ensureHeaderActions(header){
    if(!header) return;
    const button = ensureHeaderCompareButton(header);
    const actionItems = Array.from(header.querySelectorAll(".mtc-audio-button, .point-header-basket-button, .pharma-herb-panel-basket-add, .mtc-header-compare-button"));
    if(!actionItems.length) return;

    let actions = header.querySelector(":scope > .mtc-header-actions");
    if(!actions){
      actions = document.createElement("span");
      actions.className = "mtc-header-actions";
      header.appendChild(actions);
    }

    actionItems.forEach(item => {
      if(item.parentElement !== actions){
        actions.appendChild(item);
      }
    });

    if(button) syncHeaderButton(button);
  }

  function syncHeaderButton(button){
    const id = button.getAttribute("data-compare-id") || "";
    const active = isInComparison(id);
    button.classList.toggle("is-active", active);
    button.title = active ? "Retirer de la comparaison" : "Ajouter à la comparaison";
    button.setAttribute("aria-label", button.title);
  }

  function updateHeaderCompareButtons(){
    document.querySelectorAll(".mtc-header-compare-button[data-compare-id]").forEach(syncHeaderButton);
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
  }

  function enhancePointPanelHeader(){
    const content = byId("pointPanelContent");
    if(!content) return;
    content.querySelectorAll(".point-header").forEach(ensureHeaderActions);
    updateHeaderCompareButtons();
  }

  function fixMobileEspritButtons(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-info-button").forEach(button => {
      if(button.textContent !== "+") button.textContent = "+";
      button.title = "Afficher / masquer l’esprit";
      button.setAttribute("aria-label", "Afficher / masquer l’esprit de cette substance");
    });
  }

  function ensureAcupunctureAfterDomainSwitch(){
    if(domain() !== "acupuncture") return;

    document.documentElement.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");
    if(document.body){
      document.body.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");
    }

    const grid = byId("grid");
    const hasPharmaTiles = !!(grid && grid.querySelector(".pharma-tile"));
    const isEmpty = !!(grid && !grid.children.length);

    if((hasPharmaTiles || isEmpty) && typeof window.newGame === "function"){
      try{ window.newGame(); }catch(error){}
    }

    ["cheatsheetPanel", "advancedSearchPanel", "reviewBasketPanel", "comparisonPanel", "statsPanel"].forEach(id => {
      const panel = byId(id);
      if(panel) panel.classList.remove("pharma-panel");
    });
  }

  function patchHistoryClickFallback(){
    if(window.__mtcStableHistoryFallbackReady) return;
    window.__mtcStableHistoryFallbackReady = true;
    document.addEventListener("click", event => {
      const toggle = event.target && event.target.closest && event.target.closest("[data-import-history-toggle]");
      if(!toggle) return;
      const box = byId("mtcPersonalDataStatus");
      if(!box) return;
      event.preventDefault();
      event.stopPropagation();
      box.classList.toggle("history-open");
    }, false);
  }

  function patchPharmaMistakeFeedback(){
    if(window.__mtcStablePharmaMistakePatchReady) return;
    const original = window.onPharmaMistake;
    if(typeof original !== "function") return;
    window.__mtcStablePharmaMistakePatchReady = true;

    window.onPharmaMistake = function(detail){
      const life = byId("lifeDisplay");
      const text = life ? String(life.textContent || "") : "";
      const remaining = (text.match(/♥/g) || []).length;
      const imminentGameOver = remaining === 1 && !text.includes("∞");
      const message = byId("message");

      if(imminentGameOver && message){
        message.textContent = "Dernière erreur : révélation des solutions…";
        document.body.classList.add("mtc-gameover-pending");
        setTimeout(() => {
          try{ original.call(this, detail); }
          finally{ document.body.classList.remove("mtc-gameover-pending"); }
        }, 30);
        return false;
      }

      return original.apply(this, arguments);
    };
  }

  function boot(){
    patchHistoryClickFallback();
    patchPharmaMistakeFeedback();
    enhancePointPanelHeader();
    fixMobileEspritButtons(document);

    const pointContent = byId("pointPanelContent");
    if(pointContent && pointContent.dataset.stableHotfixObserver !== "1"){
      pointContent.dataset.stableHotfixObserver = "1";
      new MutationObserver(() => {
        enhancePointPanelHeader();
        fixMobileEspritButtons(pointContent);
      }).observe(pointContent, {childList:true, subtree:true});
    }

    const solved = byId("solved");
    if(solved && solved.dataset.stableHotfixObserver !== "1"){
      solved.dataset.stableHotfixObserver = "1";
      new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
          if(node.nodeType === 1) fixMobileEspritButtons(node);
        }));
      }).observe(solved, {childList:true, subtree:true});
    }
  }

  window.addEventListener("mtc-study-domain-changed", event => {
    const next = event && event.detail ? event.detail.domain : domain();
    if(next === "acupuncture") setTimeout(ensureAcupunctureAfterDomainSwitch, 80);
    setTimeout(() => {
      patchPharmaMistakeFeedback();
      enhancePointPanelHeader();
      fixMobileEspritButtons(document);
    }, 120);
  });

  window.addEventListener("storage", () => setTimeout(updateHeaderCompareButtons, 0));
  window.addEventListener("load", boot);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
