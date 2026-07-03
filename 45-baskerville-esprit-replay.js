/* 45 — Bulle ESPRIT mobile : titre substance en Baskerville + libellé ESPRIT en couleur halo */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function escapeHtml(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectStyle(){
    if(byId("mtcEspritBaskervilleStyle45")) return;
    const style = document.createElement("style");
    style.id = "mtcEspritBaskervilleStyle45";
    style.textContent = `
      #mtcPharmaEspritMobileBubble::before{
        content:none !important;
        display:none !important;
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
      html:not([data-study-domain="pharmacology"]) body.game-complete #solved .solved-point,
      html:not([data-study-domain="pharmacology"]) body.game-complete #solved .solved-point *,
      html:not([data-study-domain="pharmacology"]) body.game-finished #solved .solved-point,
      html:not([data-study-domain="pharmacology"]) body.game-finished #solved .solved-point *{
        font-family:Baskerville, "Libre Baskerville", Georgia, serif !important;
      }
      #mtcReplaySameGridButton{
        font-family:"Archivo", system-ui, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }

  function currentOpenItem(){
    return document.querySelector('.pharma-solved-point.pharma-synthesis-open[data-esprit-tooltip]');
  }

  function substanceNameFrom(item){
    if(!item) return "";
    const label = item.querySelector(".pharma-solved-chinese-name");
    return String(label && label.textContent || item.getAttribute("data-herb-id") || "Substance").trim();
  }

  function formatBubble(){
    if(!isPharma()) return;
    const node = byId("mtcPharmaEspritMobileBubble");
    if(!node || !node.classList.contains("visible")) return;
    const item = currentOpenItem();
    if(!item) return;
    const text = String(item.getAttribute("data-esprit-tooltip") || "").trim();
    if(!text) return;
    const herbId = item.getAttribute("data-herb-id") || substanceNameFrom(item);
    const key = herbId + "::" + text;
    if(node.dataset.mtcEspritFormattedKey === key) return;
    const name = substanceNameFrom(item);
    node.innerHTML = `
      <div class="mtc-esprit-bubble-title">
        <span class="mtc-esprit-substance">${escapeHtml(name)}</span>
        <span class="mtc-esprit-tag">ESPRIT</span>
      </div>
      <div class="mtc-esprit-bubble-body">${escapeHtml(text)}</div>
    `;
    node.dataset.mtcEspritFormattedKey = key;
  }

  function init(){
    injectStyle();
    window.addEventListener("click", () => window.setTimeout(formatBubble, 0), true);
    window.addEventListener("touchend", () => window.setTimeout(formatBubble, 0), true);
    const observer = new MutationObserver(() => formatBubble());
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["class", "data-source-herb-id"]});
    window.setTimeout(formatBubble, 300);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();
