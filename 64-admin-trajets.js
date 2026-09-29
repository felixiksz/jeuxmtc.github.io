/* ============================================================
   64-admin-trajets.js
   Bouton « Trajets » (module trajets/) dans la barre du haut, à côté
   de « ? Aide », proposé seulement avec ?admin=1 dans l'adresse.
   ============================================================ */
(function(){
  "use strict";

  function isAdmin(){
    try{ return new URLSearchParams(window.location.search).get("admin") === "1"; }catch(error){ return false; }
  }

  function boot(){
    if(!isAdmin() || document.getElementById("mtcAdminTrajets")) return;
    const bar = document.querySelector(".topbar-main-buttons");
    if(!bar) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "mtcAdminTrajets";
    button.textContent = "Trajets β";
    button.title = "Trajets des canaux (admin)";
    button.addEventListener("click", () => { window.location.href = "trajets/index.html?admin=1"; });
    bar.appendChild(button);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
