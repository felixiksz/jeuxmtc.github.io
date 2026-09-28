/* ============================================================
   63-settings-popover.js
   Réglages « Affichage » en petite fenêtre flottante sous le bouton,
   au lieu d'un bloc qui repoussait toute la grille vers le bas.
   Elle se ferme d'elle-même quand on n'en a plus besoin : clic ailleurs
   (sur une tuile, un bouton…), touche Échap, défilement de la page ou
   nouvelle partie. Le fonctionnement des réglages ne change pas
   (toggleSettings et les contrôles existants sont réutilisés tels quels).
   ============================================================ */
(function(){
  "use strict";

  const STYLE_ID = "mtcSettingsPopoverStyle";
  const BUTTON_SELECTOR = ".topbar-row button[onclick*='toggleSettings()']";

  function panel(){ return document.getElementById("settingsPanel"); }
  function isOpen(){ const p = panel(); return Boolean(p) && p.style.display !== "none"; }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#settingsPanel.mtc-settings-pop{
  position:fixed !important;
  z-index:9600 !important; /* au-dessus de la barre du bas (9000) */
  box-sizing:border-box;
  width:min(330px, calc(100vw - 20px)) !important;
  max-height:calc(100vh - 90px);
  overflow:auto;
  margin:0 !important;
  padding:12px 14px !important;
  border-radius:16px;
  background:var(--page-bg, #fff);
  color:var(--text-color, #111);
  box-shadow:0 8px 26px var(--shadow-color, #4b63ff);
  font-size:12.5px !important;
  animation:mtcSettingsPopIn .14s ease-out both;
}
@keyframes mtcSettingsPopIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
#settingsPanel.mtc-settings-pop .settings-grid{
  grid-template-columns:1fr 1fr !important;
  gap:6px 12px !important;
}
#settingsPanel.mtc-settings-pop label{
  min-height:28px !important;
  justify-content:space-between !important;
  font-size:12.5px !important;
}
#settingsPanel.mtc-settings-pop .grid-lock-setting,
#settingsPanel.mtc-settings-pop .pharma-display-setting,
#settingsPanel.mtc-settings-pop .font-size-control{
  grid-column:1 / -1;
}
#settingsPanel.mtc-settings-pop .font-size-control{
  min-width:0 !important;
  justify-content:center !important;
}
#settingsPanel.mtc-settings-pop .font-size-control input[type="range"]{
  width:auto !important;
  flex:1 1 auto !important;
}
#settingsPanel.mtc-settings-pop input[type="color"]{
  width:34px;
  height:22px;
  padding:0;
}
#settingsPanel.mtc-settings-pop .settings-presets{
  margin-top:8px !important;
  gap:4px 10px !important;
}
#settingsPanel.mtc-settings-pop .settings-presets button{
  font-size:11px !important;
}
@media (prefers-reduced-motion: reduce){#settingsPanel.mtc-settings-pop{animation:none}}
`;
    document.head.appendChild(style);
  }

  function place(){
    const p = panel();
    if(!p) return;
    const button = document.querySelector(BUTTON_SELECTOR);
    const rect = button ? button.getBoundingClientRect() : null;
    const width = Math.min(330, window.innerWidth - 20);
    let left, top;
    if(rect && rect.width > 0 && rect.height > 0){
      left = rect.left + rect.width / 2 - width / 2;
      top = rect.bottom + 8;
    }else{
      // bouton replié dans le menu (téléphone) : en haut, centré
      left = (window.innerWidth - width) / 2;
      top = 56;
    }
    left = Math.max(10, Math.min(window.innerWidth - width - 10, left));
    p.style.left = left + "px";
    p.style.top = Math.max(10, top) + "px";
  }

  function close(){
    const p = panel();
    if(p && isOpen()) p.style.display = "none";
  }

  // Un sélecteur de couleur natif ouvert : ses clics ne doivent pas fermer.
  let colorPickingUntil = 0;

  function onPointerDown(event){
    if(!isOpen()) return;
    const p = panel();
    if(p.contains(event.target)) return;
    if(event.target.closest && event.target.closest(BUTTON_SELECTOR)) return; // le bouton gère lui-même
    if(event.target.closest && event.target.closest("#mtcTopbarMoreButton, .mtc-topbar-more-menu, #tourBox")) return;
    if(Date.now() < colorPickingUntil) return;
    close();
  }

  function sync(){
    const p = panel();
    if(!p) return;
    if(isOpen()){
      p.classList.add("mtc-settings-pop");
      place();
    }else{
      p.classList.remove("mtc-settings-pop");
    }
  }

  function boot(){
    const p = panel();
    if(!p) return;
    ensureStyle();
    new MutationObserver(sync).observe(p, {attributes:true, attributeFilter:["style"]});
    sync();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", event => { if(event.key === "Escape") close(); });
    window.addEventListener("resize", () => { if(isOpen()) place(); });
    window.addEventListener("scroll", () => { if(isOpen() && Date.now() >= colorPickingUntil) close(); }, {passive:true});
    p.addEventListener("click", event => {
      if(event.target.matches && event.target.matches('input[type="color"]')) colorPickingUntil = Date.now() + 15 * 1000;
    });
    p.addEventListener("change", event => {
      if(event.target.matches && event.target.matches('input[type="color"]')) colorPickingUntil = Date.now() + 400;
    });
    // Nouvelle partie : les réglages ne sont plus utiles.
    const originalNewGame = window.newGame;
    if(typeof originalNewGame === "function" && !originalNewGame.__mtcSettingsPopWrapped){
      const wrapped = function(){ close(); return originalNewGame.apply(this, arguments); };
      wrapped.__mtcSettingsPopWrapped = true;
      window.newGame = wrapped;
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
