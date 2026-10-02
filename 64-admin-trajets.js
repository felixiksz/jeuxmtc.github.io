/* ============================================================
   64-admin-trajets.js
   Bouton « Trajets » (module trajets/) dans la barre du haut, à côté
   de « ? Aide », proposé seulement avec ?admin=1 dans l'adresse.
   ============================================================ */
(function(){
  "use strict";

  // mode admin mémorisé sur l'appareil : ?admin=1 l'active, ?admin=0 (ou le lien « quitter ») le désactive
  function isAdmin(){
    return (function(){ try{ const q = new URLSearchParams(window.location.search).get("admin");
      if(q === "1") localStorage.setItem("mtc_admin", "1"); else if(q === "0") localStorage.removeItem("mtc_admin");
      return localStorage.getItem("mtc_admin") === "1" || q === "1"; }catch(error){ return new URLSearchParams(window.location.search).get("admin") === "1"; } })();
  }
  window.mtcIsAdmin = isAdmin;

  function boot(){
    const admin = isAdmin(), beta = !!(window.MTC_BETA && window.MTC_BETA.public);
    if(!(admin || beta) || document.getElementById("mtcAdminTrajets")) return;
    const q = admin ? "?admin=1" : "";
    const bar = document.querySelector(".topbar-main-buttons");
    if(!bar) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "mtcAdminTrajets";
    button.textContent = "Trajets β";
    button.title = admin ? "Trajets des canaux (admin)" : "Trajets des canaux (bêta)";
    button.addEventListener("click", () => { window.location.href = "trajets/index.html" + q; });
    bar.appendChild(button);
    // module Formules (formules de l'Outil diagnostique, jeux de la substance manquante)
    const formulas = document.createElement("button");
    formulas.type = "button";
    formulas.id = "mtcAdminFormules";
    formulas.textContent = "Formules β";
    formulas.title = admin ? "Formules de l'Outil diagnostique (admin)" : "Formules (bêta)";
    formulas.addEventListener("click", () => { window.location.href = "formules/index.html" + q; });
    bar.appendChild(formulas);
    if(!admin) return;
    // lien pour revenir au mode public (sous les réglages d'affichage)
    const presets = document.querySelector("#settingsPanel .settings-presets");
    if(presets && !document.getElementById("mtcAdminExit")){
      const exit = document.createElement("button");
      exit.type = "button";
      exit.id = "mtcAdminExit";
      exit.textContent = "Quitter le mode admin";
      exit.addEventListener("click", () => {
        try{ localStorage.removeItem("mtc_admin"); }catch(error){}
        const url = new URL(window.location.href); url.searchParams.delete("admin");
        window.location.href = url.pathname + (url.search || "") + url.hash;
      });
      presets.appendChild(exit);
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
