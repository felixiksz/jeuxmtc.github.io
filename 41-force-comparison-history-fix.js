/* === 41-force-comparison-history-fix.js
   Correctif plus explicite :
   1) la comparaison s'ouvre immédiatement avec une barre visible, puis le tableau lourd se rend après un court délai ;
   2) l'historique import est forcé sous la footbar, avec un style injecté APRÈS les styles dynamiques précédents.
*/
(function(){
  "use strict";

  const LOADING_CLASS = "mtc-comparison-force-loading";
  let comparisonRenderTimer = 0;
  let comparisonProgressTimer = 0;
  let comparisonOpening = false;

  function byId(id){ return document.getElementById(id); }

  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function countItems(){
    try{
      const key = isPharma() ? "mtc_pharma_comparison_slots_v1" : "connections_mtc_comparison_points_v1";
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(items) ? items.filter(Boolean).length : 0;
    }catch(error){
      return 0;
    }
  }

  function ensureSharedProgressBox(){
    let box = document.getElementById("mtcImportExportProgress");
    if(!box){
      box = document.createElement("div");
      box.id = "mtcImportExportProgress";
      box.setAttribute("aria-live", "polite");
      box.innerHTML = '<span class="mtc-import-export-progress-label"></span><span class="mtc-import-export-progress-bar"><span></span></span>';
      document.body.appendChild(box);
    }
    return box;
  }

  function setSharedProgress(label, percent){
    const box = ensureSharedProgressBox();
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const text = String(label || "COMPARAISON").toUpperCase();
    const labelEl = box.querySelector(".mtc-import-export-progress-label");
    const bar = box.querySelector(".mtc-import-export-progress-bar > span");
    if(labelEl) labelEl.textContent = `${text} ${Math.round(p).toString().padStart(3, "0")}%`;
    if(bar) bar.style.width = `${p}%`;
    box.classList.add("visible");
  }

  function hideSharedProgress(delay){
    const box = document.getElementById("mtcImportExportProgress");
    if(!box) return;
    window.setTimeout(() => box.classList.remove("visible"), delay == null ? 500 : delay);
  }

  function comparisonLoadingHtml(percent, status){
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    setSharedProgress(status || "COMPARAISON", p);
    return `
      <div class="${LOADING_CLASS}" role="status" aria-live="polite">
        <span>Chargement de la comparaison…</span>
      </div>
    `;
  }

  function paintComparisonLoading(percent, status){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;
    panel.classList.add("open", "mtc-comparison-is-preloading");
    content.innerHTML = comparisonLoadingHtml(percent, status);
  }

  function clearComparisonTimers(){
    if(comparisonRenderTimer){ window.clearTimeout(comparisonRenderTimer); comparisonRenderTimer = 0; }
    if(comparisonProgressTimer){ window.clearTimeout(comparisonProgressTimer); comparisonProgressTimer = 0; }
  }

  function renderComparisonAfterLoading(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;
    paintComparisonLoading(58, "comparaison");

    comparisonRenderTimer = window.setTimeout(() => {
      comparisonOpening = false;
      panel.classList.remove("mtc-comparison-is-preloading");
      try{
        if(typeof window.renderComparisonPanel === "function"){
          window.renderComparisonPanel();
        }
        setSharedProgress("comparaison", 100);
        hideSharedProgress(520);
      }catch(error){
        console.error("Erreur de rendu du panneau comparaison", error);
        setSharedProgress("erreur comparaison", 100);
        content.innerHTML = `<div class="${LOADING_CLASS}" role="status" aria-live="polite">Erreur de chargement de la comparaison.</div>`;
        hideSharedProgress(1200);
      }
    }, 160);
  }

  function forceOpenComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    clearComparisonTimers();
    comparisonOpening = true;

    if(typeof window.closeAllBottomPanels === "function"){
      try{ window.closeAllBottomPanels("comparisonPanel"); }catch(error){}
    }

    // Affichage immédiat : on ouvre d'abord, on rend ensuite.
    paintComparisonLoading(6, "OUVERTURE...");

    comparisonProgressTimer = window.setTimeout(() => paintComparisonLoading(28, "LECTURE DES DONNÉES..."), 80);
    comparisonRenderTimer = window.setTimeout(renderComparisonAfterLoading, 230);
  }

  function forceToggleComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open") && !comparisonOpening){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    forceOpenComparisonPanel();
  }

  // Remplace les fonctions globales, sans appeler les anciens wrappers qui pouvaient rendre immédiatement.
  window.openComparisonPanel = forceOpenComparisonPanel;
  window.toggleComparisonPanel = forceToggleComparisonPanel;

  function bindComparisonButton(){
    const button = byId("comparisonButton");
    if(!button || button.__mtcForceComparisonBound) return;
    button.__mtcForceComparisonBound = true;
    button.removeAttribute("onclick");
    button.onclick = null;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      forceToggleComparisonPanel();
    }, true);
  }

  function injectLateStyle(){
    if(byId("mtcForceComparisonHistoryStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcForceComparisonHistoryStyle";
    style.textContent = `
      #comparisonPanel.mtc-comparison-is-preloading{
        z-index:9800 !important;
      }
      #comparisonPanelContent .${LOADING_CLASS}{
        padding:18px 12px !important;
        min-height:72px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-sizing:border-box !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.9rem !important;
        line-height:1.3 !important;
        color:var(--text-color, currentColor) !important;
        opacity:.72 !important;
        text-align:center !important;
      }

      #mtcPersonalDataStatus.history-open{
        z-index:1000002 !important;
        max-width:calc(100vw - 14px) !important;
      }
      #mtcPersonalDataStatus .mtc-status-history-link{
        text-decoration:none !important;
        border-bottom:1px dotted currentColor !important;
        margin-left:.45em !important;
      }
      #mtcPersonalDataStatus .mtc-status-history-popover{
        position:absolute !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(100% + 5px) !important;
        transform:translateX(-50%) !important;
        min-width:min(92vw, 420px) !important;
        max-width:min(96vw, 680px) !important;
        justify-content:center !important;
        border-top:0 !important;
        border-bottom:1px solid currentColor !important;
        padding:5px 7px !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 88%, transparent) !important;
        backdrop-filter:blur(8px) !important;
        -webkit-backdrop-filter:blur(8px) !important;
      }
      #mtcPersonalDataStatus.history-open .mtc-status-history-popover{
        display:flex !important;
      }
      @media(max-width:699px), (hover:none), (pointer:coarse){
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 24px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 24px) 50% !important;
          left:50% !important;
          right:auto !important;
          top:auto !important;
          transform:translateX(-50%) !important;
          width:max-content !important;
          max-width:calc(100vw - 10px) !important;
          text-align:center !important;
          font-size:7.8px !important;
          line-height:1.12 !important;
          opacity:.72 !important;
          pointer-events:auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectLateStyle();
    bindComparisonButton();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }

  // Si un autre script recrée/modifie la footbar, on rebinde sans bruit.
  const observer = new MutationObserver(() => bindComparisonButton());
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
