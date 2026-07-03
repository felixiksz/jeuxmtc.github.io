/* === 41-force-comparison-history-fix.js
   Comparaison : utilise uniquement la barre import/export existante (#mtcImportExportProgress),
   sans faux panneau terminal ni style MS-DOS séparé. La progression démarre avant le rendu lourd
   pour que le mobile voie une vraie évolution avant que le tableau bloque éventuellement le fil JS.
   Historique : position mobile intermédiaire + popover opaque.
*/
(function(){
  "use strict";

  let comparisonTimer = 0;
  let comparisonProgressTimers = [];
  let comparisonOpening = false;

  function byId(id){ return document.getElementById(id); }

  function ensureSharedProgressBox(){
    let box = byId("mtcImportExportProgress");
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
    const labelEl = box.querySelector(".mtc-import-export-progress-label");
    const bar = box.querySelector(".mtc-import-export-progress-bar > span");
    if(labelEl) labelEl.textContent = `${String(label || "COMPARAISON").toUpperCase()} ${Math.round(p).toString().padStart(3, "0")}%`;
    if(bar) bar.style.width = `${p}%`;
    box.classList.add("visible");
  }

  function hideSharedProgress(delay){
    const box = byId("mtcImportExportProgress");
    if(!box) return;
    window.setTimeout(() => box.classList.remove("visible"), delay == null ? 650 : delay);
  }

  function clearComparisonTimers(){
    if(comparisonTimer){ window.clearTimeout(comparisonTimer); comparisonTimer = 0; }
    comparisonProgressTimers.forEach(t => window.clearTimeout(t));
    comparisonProgressTimers = [];
  }

  function scheduleProgress(percent, delay, label){
    const t = window.setTimeout(() => {
      if(comparisonOpening) setSharedProgress(label || "comparaison", percent);
    }, delay);
    comparisonProgressTimers.push(t);
  }

  function openPanelShell(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel) return;
    if(typeof window.closeAllBottomPanels === "function"){
      try{ window.closeAllBottomPanels("comparisonPanel"); }catch(error){}
    }
    panel.classList.add("open");
    panel.classList.remove("mtc-comparison-is-preloading");
    // Pas de barre ou message dans le panneau : on réutilise seulement la barre import/export.
    if(content && !String(content.innerHTML || "").trim()){
      content.innerHTML = '<div class="mtc-comparison-loading-spacer" aria-hidden="true"></div>';
    }
  }

  function renderNow(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    try{
      setSharedProgress("comparaison", 82);
      if(typeof window.renderComparisonPanel === "function") window.renderComparisonPanel();
      comparisonOpening = false;
      setSharedProgress("comparaison", 100);
      hideSharedProgress(780);
    }catch(error){
      console.error("Erreur de rendu du panneau comparaison", error);
      comparisonOpening = false;
      setSharedProgress("erreur comparaison", 100);
      hideSharedProgress(1400);
    }
  }

  function forceOpenComparisonPanel(){
    clearComparisonTimers();
    comparisonOpening = true;
    openPanelShell();

    // Même composant que l'import/export, mais avec une progression visible avant le rendu lourd.
    setSharedProgress("comparaison", 4);
    scheduleProgress(14, 100, "comparaison");
    scheduleProgress(28, 240, "comparaison");
    scheduleProgress(46, 420, "comparaison");
    scheduleProgress(64, 620, "comparaison");
    comparisonTimer = window.setTimeout(renderNow, 760);
  }

  function forceToggleComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open") && !comparisonOpening){
      clearComparisonTimers();
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    forceOpenComparisonPanel();
  }

  window.openComparisonPanel = forceOpenComparisonPanel;
  window.toggleComparisonPanel = forceToggleComparisonPanel;

  function bindComparisonButton(){
    const button = byId("comparisonButton");
    if(!button || button.__mtcForceComparisonBound41c) return;
    button.__mtcForceComparisonBound41c = true;
    button.removeAttribute("onclick");
    button.onclick = null;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      forceToggleComparisonPanel();
    }, true);
  }

  function injectLateStyle(){
    let style = byId("mtcForceComparisonHistoryStyle");
    if(!style){
      style = document.createElement("style");
      style.id = "mtcForceComparisonHistoryStyle";
      document.head.appendChild(style);
    }
    style.textContent = `
      #comparisonPanelContent .mtc-comparison-force-loading,
      #comparisonPanelContent .mtc-comparison-loading,
      #comparisonPanelContent .mtc-comparison-loading-note{
        display:none !important;
      }
      #comparisonPanelContent .mtc-comparison-loading-spacer{
        min-height:10px !important;
        height:10px !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      #mtcPersonalDataStatus.history-open{
        z-index:1000002 !important;
        opacity:1 !important;
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
        background:var(--page-bg, #fff) !important;
        color:var(--text-color, currentColor) !important;
        opacity:1 !important;
        box-shadow:0 10px 28px rgba(0,0,0,.18) !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
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
          max-width:calc(100vw - 14px) !important;
          text-align:center !important;
          font-size:7.8px !important;
          line-height:1.12 !important;
          opacity:.72 !important;
          z-index:1000001 !important;
        }
        #mtcPersonalDataStatus.history-open,
        #mtcPersonalDataStatus.history-open.visible{
          opacity:1 !important;
        }
        #mtcPersonalDataStatus.history-open .mtc-status-history-popover{
          background:var(--page-bg, #fff) !important;
          color:var(--text-color, currentColor) !important;
          opacity:1 !important;
          box-shadow:0 10px 28px rgba(0,0,0,.22) !important;
        }
      }
    `;
  }

  function init(){
    injectLateStyle();
    bindComparisonButton();
    const observer = new MutationObserver(() => bindComparisonButton());
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
