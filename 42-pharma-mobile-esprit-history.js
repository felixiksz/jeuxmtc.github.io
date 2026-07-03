/* === 42-pharma-mobile-esprit-history.js
   PHARMA mobile : applique la grande bulle ESPRIT lisible aux tuiles validées pendant la partie
   et en fin de jeu. Le bouton + est ajouté ici aussi, pour ne pas dépendre d'un autre module.
   Historique : popover opaque/lisible sur mobile.
*/
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isMobileLike(){
    try{
      return !!(
        (window.matchMedia && (
          window.matchMedia("(max-width: 900px)").matches ||
          window.matchMedia("(hover: none)").matches ||
          window.matchMedia("(pointer: coarse)").matches
        )) ||
        (navigator && Number(navigator.maxTouchPoints || 0) > 0) ||
        window.innerWidth <= 900
      );
    }catch(error){
      return window.innerWidth <= 900;
    }
  }
  function esc(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function substanceNameFrom(item){
    if(!item) return "Substance";
    const label = item.querySelector(".pharma-solved-chinese-name");
    return String(label && label.textContent || item.getAttribute("data-herb-id") || "Substance").trim();
  }

  function injectStyle(){
    let style = byId("mtcPharmaMobileEspritHistoryStyle42");
    if(!style){
      style = document.createElement("style");
      style.id = "mtcPharmaMobileEspritHistoryStyle42";
      document.head.appendChild(style);
    }
    style.textContent = `
      #mtcPersonalDataStatus.history-open{
        opacity:1 !important;
        z-index:1000002 !important;
      }
      #mtcPersonalDataStatus .mtc-status-history-popover{
        background:var(--page-bg, #fff) !important;
        color:var(--text-color, currentColor) !important;
        opacity:1 !important;
        box-shadow:0 10px 28px rgba(0,0,0,.18) !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
      }

      @media(max-width:900px), (hover:none), (pointer:coarse){
        #mtcPersonalDataStatus,
        #mtcPersonalDataStatus.visible{
          position:fixed !important;
          left:50% !important;
          right:auto !important;
          top:auto !important;
          bottom:calc(env(safe-area-inset-bottom, 0px) + 24px) !important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 24px) 50% !important;
          transform:translateX(-50%) !important;
          width:max-content !important;
          max-width:calc(100vw - 14px) !important;
          text-align:center !important;
          z-index:1000001 !important;
          opacity:.72 !important;
        }
        #mtcPersonalDataStatus.history-open,
        #mtcPersonalDataStatus.history-open.visible{
          opacity:1 !important;
        }
        #mtcPersonalDataStatus.history-open .mtc-status-history-popover{
          background:var(--page-bg, #fff) !important;
          color:var(--text-color, currentColor) !important;
          opacity:1 !important;
          border-top:0 !important;
          border-bottom:1px solid currentColor !important;
          box-shadow:0 10px 28px rgba(0,0,0,.22) !important;
          backdrop-filter:none !important;
          -webkit-backdrop-filter:none !important;
        }

        html[data-study-domain="pharmacology"] .pharma-solved-row .solved-points{
          gap:7px !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip],
        html[data-study-domain="pharmacology"].pharma-show-solved-nature .pharma-solved-point[data-esprit-tooltip][data-pharma-nature-tier],
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip][data-pharma-nature-tier]{
          position:relative !important;
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
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip]:hover,
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip]:focus,
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip]:active{
          transform:none !important;
          box-shadow:none !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-chinese-name,
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-common-name,
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-tropism,
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-toxicity{
          max-width:100% !important;
          overflow-wrap:anywhere !important;
          word-break:normal !important;
          hyphens:auto !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-chinese-name{
          font-size:.92em !important;
          line-height:1.08 !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-common-name{
          font-size:.58em !important;
          line-height:1.05 !important;
          margin-top:1px !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip] .pharma-solved-info-button{
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          position:absolute !important;
          top:-2px !important;
          right:0 !important;
          width:24px !important;
          height:24px !important;
          min-width:24px !important;
          min-height:24px !important;
          padding:0 !important;
          border:0 !important;
          background:transparent !important;
          box-shadow:none !important;
          color:var(--text-color) !important;
          font-family:"Archivo", system-ui, sans-serif !important;
          font-size:1rem !important;
          line-height:1 !important;
          font-weight:900 !important;
          opacity:.9 !important;
          z-index:20 !important;
          touch-action:manipulation !important;
          pointer-events:auto !important;
        }
        html[data-study-domain="pharmacology"] .pharma-solved-point[data-esprit-tooltip]::after,
        html[data-study-domain="pharmacology"] .pharma-solved-point.pharma-synthesis-open::after,
        html[data-study-domain="pharmacology"] .pharma-solved-point .pharma-solved-esprit-tooltip{
          display:none !important;
          content:none !important;
          visibility:hidden !important;
          opacity:0 !important;
          pointer-events:none !important;
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
        background:var(--page-bg, #fff) !important;
        color:var(--text-color, #111) !important;
        box-shadow:0 16px 34px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.04) !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.93rem !important;
        line-height:1.36 !important;
        font-weight:520 !important;
        text-align:left !important;
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
      #mtcPharmaEspritMobileBubble .mtc-esprit-bubble-title{
        display:flex !important;
        align-items:baseline !important;
        justify-content:space-between !important;
        gap:10px !important;
        margin:0 0 8px !important;
        padding:0 0 6px !important;
        border-bottom:1px solid color-mix(in srgb, var(--shadow-color, currentColor) 22%, transparent) !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-substance{
        min-width:0 !important;
        color:var(--text-color, currentColor) !important;
        font-family:Baskerville, "Libre Baskerville", Georgia, serif !important;
        font-size:1.12rem !important;
        line-height:1.08 !important;
        font-weight:650 !important;
        overflow-wrap:anywhere !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-tag{
        flex:0 0 auto !important;
        color:var(--shadow-color, currentColor) !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.64rem !important;
        line-height:1 !important;
        font-weight:850 !important;
        letter-spacing:.12em !important;
        text-transform:uppercase !important;
        text-shadow:0 0 8px color-mix(in srgb, var(--shadow-color, currentColor) 42%, transparent) !important;
        opacity:.92 !important;
      }
      #mtcPharmaEspritMobileBubble .mtc-esprit-bubble-body{
        color:var(--text-color, currentColor) !important;
        font-family:"Archivo", system-ui, sans-serif !important;
        font-size:.93rem !important;
        line-height:1.38 !important;
        font-weight:520 !important;
        white-space:pre-wrap !important;
        overflow-wrap:anywhere !important;
      }
    `;
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
      node.dataset.mtcEspritFormattedKey = "";
    }
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(item => item.classList.remove("pharma-synthesis-open"));
  }

  function showBubbleFor(item){
    const text = String(item && item.getAttribute("data-esprit-tooltip") || "").trim();
    if(!text || !isPharma() || !isMobileLike()) return false;
    const node = bubble();
    const id = item.getAttribute("data-herb-id") || text.slice(0, 80);
    const already = node.classList.contains("visible") && node.dataset.sourceHerbId === id;
    if(already){ hideBubble(); return true; }

    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(other => {
      if(other !== item) other.classList.remove("pharma-synthesis-open");
    });
    item.classList.add("pharma-synthesis-open");

    const name = substanceNameFrom(item);
    node.innerHTML = `
      <div class="mtc-esprit-bubble-title">
        <span class="mtc-esprit-substance">${esc(name)}</span>
        <span class="mtc-esprit-tag">ESPRIT</span>
      </div>
      <div class="mtc-esprit-bubble-body">${esc(text)}</div>
    `;
    node.dataset.sourceHerbId = id;
    node.dataset.mtcEspritFormattedKey = id + "::" + text;
    node.classList.add("visible");
    return true;
  }

  function normalizeButton(button){
    if(!button) return;
    if(button.textContent !== "+") button.textContent = "+";
    button.title = "Afficher / masquer l’esprit";
    button.setAttribute("aria-label", "Afficher / masquer l’esprit de cette substance");
    button.type = "button";
  }

  function ensureButtons(root){
    if(!isPharma() || !isMobileLike()) return;
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-point[data-esprit-tooltip]").forEach(item => {
      let button = item.querySelector(".pharma-solved-info-button");
      if(!button){
        button = document.createElement("button");
        button.className = "category-info-button pharma-solved-info-button";
        item.appendChild(button);
      }
      normalizeButton(button);
    });
  }

  function handleButtonEvent(event){
    const button = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
    if(!button || !isPharma() || !isMobileLike()) return;
    const item = button.closest(".pharma-solved-point[data-esprit-tooltip]");
    if(!item) return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation) event.stopImmediatePropagation();
    showBubbleFor(item);
  }

  function bind(){
    window.showPharmaMobileEspritBubble = showBubbleFor;
    window.hidePharmaMobileEspritBubble = hideBubble;

    document.addEventListener("pointerup", handleButtonEvent, {capture:true, passive:false});
    document.addEventListener("touchend", handleButtonEvent, {capture:true, passive:false});
    document.addEventListener("click", event => {
      const button = event.target && event.target.closest && event.target.closest(".pharma-solved-info-button");
      if(button){ handleButtonEvent(event); return; }
      if(isMobileLike()){
        const insideBubble = event.target && event.target.closest && event.target.closest("#mtcPharmaEspritMobileBubble");
        if(!insideBubble) hideBubble();
      }
    }, true);

    document.addEventListener("keydown", event => { if(event.key === "Escape") hideBubble(); });
    window.addEventListener("resize", () => {
      ensureButtons(document);
      const node = byId("mtcPharmaEspritMobileBubble");
      if(node && node.classList.contains("visible") && !isMobileLike()) hideBubble();
    });

    const observer = new MutationObserver(mutations => {
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node => { if(node.nodeType === 1) ensureButtons(node); });
        if(mutation.type === "attributes" && mutation.target && mutation.target.nodeType === 1) ensureButtons(mutation.target.parentElement || document);
      }
    });
    if(document.body) observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["data-esprit-tooltip", "class"]});

    // Petit balayage périodique : utile quand une catégorie validée existait déjà avant que le script s'attache.
    window.setInterval(() => ensureButtons(document), 900);
  }

  function init(){
    injectStyle();
    ensureButtons(document);
    bind();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
