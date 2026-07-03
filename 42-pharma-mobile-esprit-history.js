/* === 42-pharma-mobile-esprit-history.js
   Correctifs ciblés :
   - PHARMA mobile fin de jeu : tuiles validées sans fond rond + bulle ESPRIT lisible, large et contenue dans l'écran.
   - Historique import : position intermédiaire, moins basse que le patch 41. === */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isMobileLike(){
    try{
      return !!(window.matchMedia && (
        window.matchMedia("(max-width: 699px)").matches ||
        window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(pointer: coarse)").matches
      ));
    }catch(error){
      return window.innerWidth <= 699;
    }
  }

  function injectStyle(){
    if(byId("mtcPharmaMobileEspritHistoryStyle42")) return;
    const style = document.createElement("style");
    style.id = "mtcPharmaMobileEspritHistoryStyle42";
    style.textContent = `
      /* Historique : position intermédiaire entre l'ancien chevauchement et le bas d'écran. */
      #mtcPersonalDataStatus,
      #mtcPersonalDataStatus.visible{
        position:fixed !important;
        left:50% !important;
        right:auto !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 18px) !important;
        inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 18px) 50% !important;
        transform:translateX(-50%) !important;
        width:max-content !important;
        max-width:calc(100vw - 14px) !important;
        text-align:center !important;
        z-index:9001 !important;
        opacity:.74 !important;
      }
      @media(max-width:699px){
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          bottom:calc(env(safe-area-inset-bottom, 0px) + 16px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 16px) 50% !important;
          opacity:.72 !important;
        }
      }

      /* PHARMA mobile : ne plus voir les fonds ronds des tuiles de fin. */
      @media(max-width:699px), (hover:none), (pointer:coarse){
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-row .solved-points{
          gap:7px !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point,
        html[data-study-domain="pharmacology"].pharma-show-solved-nature body.game-finished .pharma-solved-point[data-pharma-nature-tier],
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point[data-pharma-nature-tier]{
          background:transparent !important;
          background-color:transparent !important;
          box-shadow:none !important;
          border-color:transparent !important;
          border-radius:8px !important;
          padding:5px 24px 5px 3px !important;
          min-height:0 !important;
          line-height:1.08 !important;
          overflow:visible !important;
          text-align:center !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:hover,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:focus,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point:active{
          transform:none !important;
          box-shadow:none !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-chinese-name,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-common-name,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-tropism,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-toxicity{
          max-width:100% !important;
          overflow-wrap:anywhere !important;
          word-break:normal !important;
          hyphens:auto !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-chinese-name{
          font-size:.92em !important;
          line-height:1.08 !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-common-name{
          font-size:.58em !important;
          line-height:1.05 !important;
          margin-top:1px !important;
        }
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-info-button{
          top:-2px !important;
          right:0 !important;
          width:21px !important;
          height:21px !important;
          min-width:21px !important;
          min-height:21px !important;
          padding:0 !important;
          border:0 !important;
          background:transparent !important;
          box-shadow:none !important;
          color:var(--text-color) !important;
          font-size:.92rem !important;
          line-height:1 !important;
          opacity:.82 !important;
        }

        /* On remplace le pseudo-tooltip étroit par une vraie bulle fixe. */
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point[data-esprit-tooltip]::after,
        html[data-study-domain="pharmacology"] body.game-finished .pharma-solved-point.pharma-synthesis-open::after{
          display:none !important;
          content:none !important;
          visibility:hidden !important;
          opacity:0 !important;
        }
      }

      #mtcPharmaEspritMobileBubble{
        position:fixed !important;
        left:10px !important;
        right:10px !important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 72px) !important;
        width:auto !important;
        max-width:none !important;
        max-height:min(46vh, 320px) !important;
        overflow:auto !important;
        box-sizing:border-box !important;
        padding:12px 14px !important;
        border-radius:16px !important;
        border:1px solid color-mix(in srgb, var(--shadow-color, currentColor) 34%, transparent) !important;
        background:color-mix(in srgb, var(--page-bg, #fff) 94%, transparent) !important;
        color:var(--text-color, #111) !important;
        box-shadow:0 16px 34px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.04) !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
        font-family:var(--ui-font-family, system-ui, sans-serif) !important;
        font-size:.93rem !important;
        line-height:1.36 !important;
        font-weight:520 !important;
        text-align:left !important;
        white-space:pre-wrap !important;
        overflow-wrap:anywhere !important;
        z-index:1000004 !important;
        opacity:0 !important;
        visibility:hidden !important;
        pointer-events:none !important;
        transform:translateY(8px) !important;
        transition:opacity .14s ease, transform .14s ease, visibility .14s ease !important;
      }
      #mtcPharmaEspritMobileBubble.visible{
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
        transform:translateY(0) !important;
      }
      #mtcPharmaEspritMobileBubble::before{
        content:"ESPRIT";
        display:block;
        margin:0 0 6px;
        opacity:.52;
        font-size:.68rem;
        line-height:1;
        letter-spacing:.08em;
        font-weight:800;
      }
    `;
    document.head.appendChild(style);
  }

  function bubble(){
    let node = byId("mtcPharmaEspritMobileBubble");
    if(node) return node;
    node = document.createElement("div");
    node.id = "mtcPharmaEspritMobileBubble";
    node.setAttribute("role", "note");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
    return node;
  }

  function hideBubble(){
    const node = byId("mtcPharmaEspritMobileBubble");
    if(node){
      node.classList.remove("visible");
      node.dataset.sourceHerbId = "";
    }
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(item => item.classList.remove("pharma-synthesis-open"));
  }

  function showBubbleFor(item){
    const text = String(item && item.getAttribute("data-esprit-tooltip") || "").trim();
    if(!text) return;
    const node = bubble();
    const id = item.getAttribute("data-herb-id") || text.slice(0, 80);
    const already = node.classList.contains("visible") && node.dataset.sourceHerbId === id;
    if(already){
      hideBubble();
      return;
    }
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(other => {
      if(other !== item) other.classList.remove("pharma-synthesis-open");
    });
    item.classList.add("pharma-synthesis-open");
    node.textContent = text;
    node.dataset.sourceHerbId = id;
    node.classList.add("visible");
  }

  function normalizeButtons(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-info-button").forEach(button => {
      if(button.textContent !== "+") button.textContent = "+";
      button.title = "Afficher / masquer l’esprit";
      button.setAttribute("aria-label", "Afficher / masquer l’esprit de cette substance");
    });
  }

  function bind(){
    document.addEventListener("click", event => {
      const button = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
      if(button && isPharma() && isMobileLike()){
        const item = button.closest(".pharma-solved-point[data-esprit-tooltip]");
        if(item){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          showBubbleFor(item);
          return;
        }
      }
      if(isMobileLike()){
        const insideBubble = event.target && event.target.closest && event.target.closest("#mtcPharmaEspritMobileBubble");
        const insideButton = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
        if(!insideBubble && !insideButton) hideBubble();
      }
    }, true);

    document.addEventListener("keydown", event => {
      if(event.key === "Escape") hideBubble();
    });

    window.addEventListener("resize", () => {
      const node = byId("mtcPharmaEspritMobileBubble");
      if(node && node.classList.contains("visible") && !isMobileLike()) hideBubble();
    });

    const observer = new MutationObserver(mutations => {
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node => {
          if(node.nodeType === 1) normalizeButtons(node);
        });
      }
    });
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
  }

  function init(){
    injectStyle();
    normalizeButtons(document);
    bind();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
