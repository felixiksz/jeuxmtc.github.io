/* ============================================================
   62-opening-glow.js
   Animation d'ouverture : un dégradé coloré (couleur du halo choisie
   dans Affichage) part du centre de l'écran, s'ouvre vers les bords
   puis s'estompe. Purement décoratif : ne bloque aucun clic, ne se
   joue qu'une fois par chargement, et pas du tout si l'appareil
   demande de réduire les animations.
   ============================================================ */
(function(){
  "use strict";

  const STYLE_ID = "mtcOpeningGlowStyle";
  const LAYER_ID = "mtcOpeningGlow";

  function reducedMotion(){
    try{ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(error){ return false; }
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + LAYER_ID + "{",
      "  position:fixed; inset:0; z-index:2147483000; pointer-events:none;",
      "  --glow:var(--shadow-color, #3b3bff);",
      "  animation:mtcOpeningGlow 1.9s cubic-bezier(.22,.7,.2,1) both;",
      "}",
      "@keyframes mtcOpeningGlow{",
      "  0%  { opacity:0;   box-shadow:inset 0 0 55vmin 42vmin var(--glow); }",
      "  14% { opacity:.9;  box-shadow:inset 0 0 50vmin 34vmin var(--glow); }",
      "  60% { opacity:.85; box-shadow:inset 0 0 110px 26px var(--glow); }",
      "  100%{ opacity:0;   box-shadow:inset 0 0 60px 0 var(--glow); }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function play(){
    if(reducedMotion() || document.getElementById(LAYER_ID) || !document.body) return;
    ensureStyle();
    const layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.setAttribute("aria-hidden", "true");
    layer.addEventListener("animationend", () => layer.remove(), {once:true});
    // Filet de sécurité si l'animation ne se termine pas (onglet en arrière-plan…).
    window.setTimeout(() => layer.remove(), 4000);
    document.body.appendChild(layer);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", play, {once:true});
  else play();
})();
