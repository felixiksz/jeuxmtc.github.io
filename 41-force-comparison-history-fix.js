/* === 41-force-comparison-history-fix.js
   Comparaison : plus aucune barre de chargement interne ou externe.
   On ouvre le panneau puis on diffère simplement le rendu d'une frame pour que l'UI réagisse.
   Historique : position mobile intermédiaire + popover opaque.
*/
(function(){
  "use strict";

  let comparisonTimer = 0;
  function byId(id){ return document.getElementById(id); }

  function clearComparisonTimer(){
    if(comparisonTimer){ window.clearTimeout(comparisonTimer); comparisonTimer = 0; }
  }

  function removeComparisonLoaders(){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    content.querySelectorAll(
      ".mtc-comparison-force-loading, .mtc-comparison-loading, .mtc-comparison-loading-note, .mtc-comparison-loading-spacer"
    ).forEach(node => node.remove());
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
      if(typeof window.renderComparisonPanel === "function") window.renderComparisonPanel();
      removeComparisonLoaders();
    }catch(error){
      console.error("Erreur de rendu du panneau comparaison", error);
    }
  }

  function forceOpenComparisonPanel(){
    clearComparisonTimer();
    openPanelShell();
    // Pas de barre : on laisse juste le navigateur peindre l'ouverture du panneau avant le rendu lourd.
    comparisonTimer = window.setTimeout(renderNow, 32);
  }

  function forceToggleComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      clearComparisonTimer();
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
    if(!button || button.__mtcForceComparisonBound41NoBar) return;
    button.__mtcForceComparisonBound41NoBar = true;
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
      #comparisonPanelContent .mtc-comparison-loading-note,
      #comparisonPanelContent .mtc-comparison-loading-spacer{
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
      #comparisonPanel.mtc-comparison-is-preloading{
        cursor:default !important;
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
    removeComparisonLoaders();
    const observer = new MutationObserver(() => {
      bindComparisonButton();
      removeComparisonLoaders();
    });
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
