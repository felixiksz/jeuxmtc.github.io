/* ============================================================
   58-mobile-topbar-menu.js
   Sur mobile, la barre du haut entassait 7 éléments (série, cloche,
   Nouvelle partie, Affichage, Aide, plein écran, sélecteur ACU/PHARMA)
   sur une seule ligne, réduits en police jusqu'à devenir illisibles.
   Ce fichier ajoute un bouton "⋯" qui regroupe Affichage/Aide/Rappel/
   Plein écran dans un petit menu déroulant, sans toucher aux boutons
   d'origine (mêmes id/onclick, juste repositionnés en CSS quand le
   menu est ouvert) — rien d'autre dans l'app n'a besoin de changer.
   Le bureau garde l'affichage actuel, ceci ne s'applique qu'en dessous
   de 700px (même seuil que le reste des adaptations mobile de l'app).
   ============================================================ */
(function(){
  "use strict";

  const OPEN_CLASS = "mtc-topbar-more-open";

  function isOpen(){
    return document.body.classList.contains(OPEN_CLASS);
  }

  function updateToggleButtonState(){
    const toggleButton = document.getElementById("mtcTopbarMoreButton");
    if(toggleButton) toggleButton.setAttribute("aria-expanded", isOpen() ? "true" : "false");
  }

  function openMenu(){
    document.body.classList.add(OPEN_CLASS);
    updateToggleButtonState();
  }

  function closeMenu(){
    document.body.classList.remove(OPEN_CLASS);
    updateToggleButtonState();
  }

  function toggleMenu(){
    if(isOpen()) closeMenu();
    else openMenu();
  }

  const COLLAPSIBLE_SELECTORS = [
    ".topbar-row.topbar-main-row button[onclick*='toggleSettings()']",
    ".topbar-row.topbar-main-row button[onclick*='startTour()']",
    "#mtcDailyReminderButton",
    "#fullscreenToggleButton"
  ];

  function tagCollapsibleButtons(){
    COLLAPSIBLE_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if(!el.classList.contains("mtc-topbar-collapsible")) el.classList.add("mtc-topbar-collapsible");
      });
    });
  }

  function ensureToggleButton(){
    tagCollapsibleButtons();
    if(document.getElementById("mtcTopbarMoreButton")) return;

    const host = document.querySelector(".topbar-row.topbar-main-row .topbar-main-buttons");
    if(!host) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "mtcTopbarMoreButton";
    button.setAttribute("aria-label", "Plus d'options");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "⋯";
    button.addEventListener("click", event => {
      event.stopPropagation();
      toggleMenu();
    });

    host.appendChild(button);
  }

  document.addEventListener("click", event => {
    if(!isOpen()) return;
    if(event.target.closest(".mtc-topbar-collapsible")){
      // Chaque item du menu est une action ponctuelle (ouvrir Affichage,
      // relancer la visite, basculer un réglage) : on referme après,
      // comme un menu déroulant classique.
      closeMenu();
      return;
    }
    if(event.target.closest("#mtcTopbarMoreButton")) return;
    if(event.target.closest(".topbar-row.topbar-main-row")) return;
    closeMenu();
  });

  document.addEventListener("keydown", event => {
    if(event.key === "Escape" && isOpen()) closeMenu();
  });

  // Utilisé par le before() de certaines étapes de la visite guidée
  // (Affichage, Aide, Rappel, Plein écran) : sur mobile, ces boutons
  // sont invisibles tant que ce menu n'est pas ouvert.
  window.mtcOpenTopbarMoreMenu = function(){
    if(window.innerWidth <= 699) openMenu();
  };
  window.mtcCloseTopbarMoreMenu = closeMenu;

  function boot(){
    ensureToggleButton();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
