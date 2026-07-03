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

  function bar(percent){
    const total = 26;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const filled = Math.round((p / 100) * total);
    return "[" + "█".repeat(filled) + "░".repeat(Math.max(0, total - filled)) + "]";
  }

  function comparisonLoadingHtml(percent, status){
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    const label = isPharma() ? "SUBSTANCES" : "POINTS";
    const count = countItems();
    return `
      <div class="${LOADING_CLASS}" role="status" aria-live="polite">
        <div class="mtc-force-progress-dos">
          <div class="mtc-force-progress-head">
            <span>C:\\MTC\\A-B&gt; ${esc(status || "chargement")}</span>
            <span>${String(p).padStart(3,"0")}%</span>
          </div>
          <div class="mtc-force-progress-bar">${bar(p)}</div>
          <div class="mtc-force-progress-sub">${esc(count ? `${count} ${label} À COMPARER` : "PANNEAU COMPARAISON")}</div>
        </div>
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
    paintComparisonLoading(58, "CONSTRUCTION DU TABLEAU...");

    comparisonRenderTimer = window.setTimeout(() => {
      comparisonOpening = false;
      panel.classList.remove("mtc-comparison-is-preloading");
      try{
        if(typeof window.renderComparisonPanel === "function"){
          window.renderComparisonPanel();
        }
      }catch(error){
        console.error("Erreur de rendu du panneau comparaison", error);
        content.innerHTML = comparisonLoadingHtml(100, "ERREUR DE CHARGEMENT");
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
        padding:16px 10px 18px !important;
        min-height:86px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-sizing:border-box !important;
      }
      #comparisonPanelContent .mtc-force-progress-dos{
        width:min(760px, calc(100vw - 34px)) !important;
        padding:10px 12px !important;
        border:1px solid #72ff72 !important;
        background:#010501 !important;
        color:#72ff72 !important;
        font-family:"Courier New", Courier, ui-monospace, Menlo, Consolas, monospace !important;
        font-size:12px !important;
        line-height:1.25 !important;
        letter-spacing:.035em !important;
        text-shadow:0 0 5px rgba(114,255,114,.48) !important;
        box-shadow:0 0 0 1px rgba(114,255,114,.15), 0 0 18px rgba(114,255,114,.18), 0 10px 28px rgba(0,0,0,.24) !important;
        box-sizing:border-box !important;
      }
      #comparisonPanelContent .mtc-force-progress-head{
        display:flex !important;
        justify-content:space-between !important;
        gap:12px !important;
        white-space:nowrap !important;
        margin-bottom:4px !important;
      }
      #comparisonPanelContent .mtc-force-progress-bar{
        white-space:nowrap !important;
        overflow:hidden !important;
        margin:3px 0 !important;
      }
      #comparisonPanelContent .mtc-force-progress-sub{
        opacity:.88 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      @media(max-width:650px){
        #comparisonPanelContent .mtc-force-progress-dos{
          font-size:10px !important;
          padding:8px 9px !important;
          letter-spacing:.018em !important;
        }
      }

      /* La ligne d'historique doit être SOUS la footbar, pas dessus. */
      #footerTitle{
        bottom:calc(env(safe-area-inset-bottom, 0px) + 36px) !important;
      }
      #mtcPersonalDataStatus,
      #mtcPersonalDataStatus.visible{
        position:fixed !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 3px) !important;
        inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 3px) 50% !important;
        transform:translateX(-50%) !important;
        width:max-content !important;
        max-width:calc(100vw - 14px) !important;
        text-align:center !important;
        z-index:9001 !important;
        font-size:8.8px !important;
        line-height:1.12 !important;
        padding:1px 4px !important;
        margin:0 !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 58%, transparent) !important;
        pointer-events:auto !important;
      }
      #mtcPersonalDataStatus.visible{
        opacity:.74 !important;
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
        display:none;
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
      @media(max-width:699px){
        #footerTitle{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 39px) !important;
        }
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 2px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 2px) 50% !important;
          max-width:calc(100vw - 10px) !important;
          font-size:7.8px !important;
          opacity:.68 !important;
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
