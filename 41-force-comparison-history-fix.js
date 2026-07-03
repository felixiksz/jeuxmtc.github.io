/* === 41-force-comparison-history-fix.js
   Comparaison : aucune barre interne dans le panneau.
   On utilise le même composant visuel que l'import/export (#mtcImportExportProgress),
   puis on diffère le rendu d'une frame pour éviter l'impression de blocage.
   Historique : position mobile intermédiaire, sans chevauchement avec la footbar.
*/
(function(){
  "use strict";

  let comparisonTimer = 0;
  let progressHideTimer = 0;

  function byId(id){ return document.getElementById(id); }

  function clearComparisonTimer(){
    if(comparisonTimer){ window.clearTimeout(comparisonTimer); comparisonTimer = 0; }
  }

  function clearProgressHideTimer(){
    if(progressHideTimer){ window.clearTimeout(progressHideTimer); progressHideTimer = 0; }
  }

  function removeComparisonLoaders(){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    content.querySelectorAll(
      ".mtc-comparison-force-loading, .mtc-comparison-loading, .mtc-comparison-loading-note, .mtc-comparison-loading-spacer, .mtc-compare-progress-dos"
    ).forEach(node => node.remove());
  }

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
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    const labelEl = box.querySelector(".mtc-import-export-progress-label");
    const bar = box.querySelector(".mtc-import-export-progress-bar > span");
    box.classList.add("visible", "mtc-comparison-progress-active");
    if(labelEl) labelEl.textContent = `${String(label || "COMPARAISON").toUpperCase()} ${String(p).padStart(3, "0")}%`;
    if(bar) bar.style.width = `${p}%`;
  }

  function hideSharedProgress(delay){
    clearProgressHideTimer();
    const box = byId("mtcImportExportProgress");
    if(!box) return;
    progressHideTimer = window.setTimeout(() => {
      box.classList.remove("visible", "mtc-comparison-progress-active");
    }, delay == null ? 650 : delay);
  }

  function openPanelShell(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(typeof window.closeAllBottomPanels === "function"){
      try{ window.closeAllBottomPanels("comparisonPanel"); }catch(error){}
    }
    panel.classList.add("open");
    panel.classList.remove("mtc-comparison-is-preloading");
    removeComparisonLoaders();
  }

  function renderNow(){
    clearComparisonTimer();
    try{
      removeComparisonLoaders();
      setSharedProgress("comparaison", 72);
      if(typeof window.renderComparisonPanel === "function") window.renderComparisonPanel();
      removeComparisonLoaders();
      setSharedProgress("comparaison", 100);
      hideSharedProgress(650);
    }catch(error){
      console.error("Erreur de rendu du panneau comparaison", error);
      setSharedProgress("erreur", 100);
      hideSharedProgress(1200);
    }
  }

  function forceOpenComparisonPanel(){
    clearComparisonTimer();
    clearProgressHideTimer();
    openPanelShell();
    setSharedProgress("comparaison", 8);

    window.requestAnimationFrame(() => {
      removeComparisonLoaders();
      setSharedProgress("comparaison", 28);
      comparisonTimer = window.setTimeout(() => {
        removeComparisonLoaders();
        setSharedProgress("comparaison", 54);
        window.requestAnimationFrame(renderNow);
      }, 70);
    });
  }

  function forceToggleComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      clearComparisonTimer();
      hideSharedProgress(0);
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
    if(!button || button.__mtcForceComparisonBound41SharedBar) return;
    button.__mtcForceComparisonBound41SharedBar = true;
    button.removeAttribute("onclick");
    button.onclick = null;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      forceToggleComparisonPanel();
    }, true);
  }


  let searchTimer = 0;
  let searchProgressHideTimer = 0;

  function clearSearchTimer(){
    if(searchTimer){ window.clearTimeout(searchTimer); searchTimer = 0; }
  }

  function clearSearchProgressHideTimer(){
    if(searchProgressHideTimer){ window.clearTimeout(searchProgressHideTimer); searchProgressHideTimer = 0; }
  }

  function openSearchWithSharedProgress(original, context, args){
    clearSearchTimer();
    clearSearchProgressHideTimer();
    setSharedProgress("recherche", 8);
    window.requestAnimationFrame(() => {
      setSharedProgress("recherche", 32);
      searchTimer = window.setTimeout(() => {
        try{
          setSharedProgress("recherche", 68);
          const result = original.apply(context, args || []);
          setSharedProgress("recherche", 100);
          hideSharedProgress(650);
          return result;
        }catch(error){
          console.error("Erreur d'ouverture du panneau recherche", error);
          setSharedProgress("erreur", 100);
          hideSharedProgress(1200);
        }
      }, 55);
    });
  }

  function bindSearchPanelProgress(){
    if(typeof window.openAdvancedSearchPanel === "function" && !window.openAdvancedSearchPanel.__mtcSearchSharedProgressWrapped){
      const originalOpen = window.openAdvancedSearchPanel;
      const wrappedOpen = function(){
        return openSearchWithSharedProgress(originalOpen, this, Array.from(arguments));
      };
      wrappedOpen.__mtcSearchSharedProgressWrapped = true;
      window.openAdvancedSearchPanel = wrappedOpen;
      try{ if(typeof openAdvancedSearchPanel === "function") openAdvancedSearchPanel = wrappedOpen; }catch(error){}
    }
    if(typeof window.toggleAdvancedSearchPanel === "function" && !window.toggleAdvancedSearchPanel.__mtcSearchSharedProgressWrapped){
      const wrappedToggle = function(){
        const panel = byId("advancedSearchPanel");
        if(panel && panel.classList.contains("open")){
          clearSearchTimer();
          hideSharedProgress(0);
          if(typeof window.closeAdvancedSearchPanel === "function") return window.closeAdvancedSearchPanel();
          panel.classList.remove("open");
          return;
        }
        if(typeof window.openAdvancedSearchPanel === "function") return window.openAdvancedSearchPanel();
      };
      wrappedToggle.__mtcSearchSharedProgressWrapped = true;
      window.toggleAdvancedSearchPanel = wrappedToggle;
      try{ if(typeof toggleAdvancedSearchPanel === "function") toggleAdvancedSearchPanel = wrappedToggle; }catch(error){}
    }
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
      #comparisonPanelContent .mtc-comparison-loading-note,
      #comparisonPanelContent .mtc-comparison-loading-spacer,
      #comparisonPanelContent .mtc-compare-progress-dos{
        display:none !important;
        content:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
        height:0 !important;
        min-height:0 !important;
        max-height:0 !important;
        margin:0 !important;
        padding:0 !important;
        overflow:hidden !important;
      }
      #comparisonPanel.mtc-comparison-is-preloading{ cursor:default !important; }

      #mtcImportExportProgress.mtc-comparison-progress-active{
        z-index:1000006 !important;
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
      #mtcPersonalDataStatus.history-open .mtc-status-history-popover{ display:flex !important; }

      @media(max-width:699px), (hover:none), (pointer:coarse){
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 18px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 18px) 50% !important;
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
        #mtcPersonalDataStatus.history-open.visible{ opacity:1 !important; }
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
    bindSearchPanelProgress();
    removeComparisonLoaders();
    const observer = new MutationObserver(() => {
      bindComparisonButton();
      bindSearchPanelProgress();
      removeComparisonLoaders();
    });
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
