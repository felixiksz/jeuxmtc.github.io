/* ============================================================
   64-admin-trajets.js
   Entrée « Trajets des canaux » (module trajets/), proposée seulement
   avec ?admin=1 dans l'adresse : un lien dans la fenêtre Affichage.
   ============================================================ */
(function(){
  "use strict";

  function isAdmin(){
    try{ return new URLSearchParams(window.location.search).get("admin") === "1"; }catch(error){ return false; }
  }

  function boot(){
    if(!isAdmin() || document.getElementById("mtcAdminTrajets")) return;
    const presets = document.querySelector("#settingsPanel .settings-presets");
    if(!presets) return;
    const link = document.createElement("a");
    link.id = "mtcAdminTrajets";
    link.href = "trajets/index.html?admin=1";
    link.textContent = "Trajets des canaux (admin)";
    link.style.cssText = "display:block;margin-top:8px;font-size:11px;font-weight:700;text-align:center;color:inherit;";
    presets.insertAdjacentElement("afterend", link);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
