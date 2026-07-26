/* ============================================================
   52-badge-position-editor.js
   Mode "ajuster la position" : permet de faire glisser la pastille
   série (🔥) et l'icône de verrouillage (🔒) pour affiner leur
   position, sauvegardé par élément dans localStorage.
   ============================================================ */
(function(){
  "use strict";

  const POSITIONS_KEY = "mtc_badge_positions_v1";
  const DRAGGABLE_IDS = ["dailyStreakBadge", "gridLockIndicator"];
  let editModeActive = false;

  function loadAllOffsets(){
    try{
      const parsed = JSON.parse(localStorage.getItem(POSITIONS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    }catch(error){
      return {};
    }
  }

  function saveOffset(id, offset){
    try{
      const all = loadAllOffsets();
      all[id] = offset;
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
    }catch(error){}
  }

  function applyOffset(el, offset){
    if(offset && (offset.x || offset.y)){
      el.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    }else{
      el.style.transform = "";
    }
  }

  function applyAllOffsets(){
    const all = loadAllOffsets();
    DRAGGABLE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if(el) applyOffset(el, all[id]);
    });
  }

  function makeDraggable(el, id){
    let dragging = false;
    let startX = 0, startY = 0, originX = 0, originY = 0;

    el.addEventListener("pointerdown", event => {
      if(!editModeActive) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const all = loadAllOffsets();
      const current = all[id] || {x: 0, y: 0};
      originX = current.x;
      originY = current.y;
      el.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    el.addEventListener("pointermove", event => {
      if(!dragging) return;
      const offset = {
        x: Math.round(originX + (event.clientX - startX)),
        y: Math.round(originY + (event.clientY - startY))
      };
      applyOffset(el, offset);
    });

    function endDrag(event){
      if(!dragging) return;
      dragging = false;
      const offset = {
        x: Math.round(originX + (event.clientX - startX)),
        y: Math.round(originY + (event.clientY - startY))
      };
      saveOffset(id, offset);
    }

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  function setEditMode(active){
    editModeActive = active;
    DRAGGABLE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.toggle("badge-position-editing", active);
    });
    const button = document.getElementById("badgePositionEditToggle");
    if(button){
      button.textContent = active ? "✓ Terminer le positionnement" : "✥ Déplacer les pastilles";
      button.classList.toggle("is-active", active);
    }
    const hint = document.getElementById("badgePositionHint");
    if(hint) hint.style.display = active ? "" : "none";
  }

  window.toggleBadgePositionEditMode = function(){
    setEditMode(!editModeActive);
  };

  window.resetBadgePositions = function(){
    try{ localStorage.removeItem(POSITIONS_KEY); }catch(error){}
    DRAGGABLE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.transform = "";
    });
  };

  function init(){
    DRAGGABLE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if(el) makeDraggable(el, id);
    });
    applyAllOffsets();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
