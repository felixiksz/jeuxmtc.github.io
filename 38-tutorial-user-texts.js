/* === 38 — Textes de tuto corrigés par l'utilisatrice ===
   Patch limité aux messages de visite guidée / bulles ponctuelles.
   Ne modifie pas le moteur du jeu. */
(function(){
  "use strict";

  function isPharma(){
    try{
      return typeof window.getCurrentStudyDomain === "function" && window.getCurrentStudyDomain() === "pharmacology";
    }catch(error){
      return document.body && document.body.classList.contains("study-domain-pharmacology");
    }
  }

  function currentSteps(){
    try{
      if(typeof tourSteps !== "undefined" && Array.isArray(tourSteps)) return tourSteps;
    }catch(error){}
    return Array.isArray(window.tourSteps) ? window.tourSteps : null;
  }

  function patchStep(steps, selector, text, predicate){
    const step = steps.find(item => item && item.selector === selector && (!predicate || predicate(item)));
    if(step) step.text = text;
  }

  function insertStepOnce(steps, selector, title, text, afterSelector, beforeFn){
    if(!Array.isArray(steps) || steps.some(item => item && item.selector === selector)) return;
    const step = {
      selector,
      title,
      text,
      fallback:() => document.querySelector(selector) || document.querySelector("#footerTitle") || document.querySelector("#grid"),
      position:"aboveBottom"
    };
    if(typeof beforeFn === "function") step.before = beforeFn;
    const afterIndex = steps.findIndex(item => item && item.selector === afterSelector);
    if(afterIndex >= 0){
      steps.splice(afterIndex + 1, 0, step);
    }else{
      const endIndex = steps.findIndex(item => item && item.selector === "#grid" && item.title === " ");
      steps.splice(endIndex >= 0 ? endIndex : steps.length, 0, step);
    }
  }

  // --- Cartes de révision à imprimer : étapes partagées entre le tuto
  // complet et la bulle « Nouveau » des personnes qui l'ont déjà vu. ---
  const CARDS_SELECTOR = "#pharmaCardsButton";
  const CARDS_FEATURE_SEEN_KEY = "mtc_feature_tour_cards_v1";

  function cardsTourSteps(pharma){
    return [
      {
        key:"cards-1",
        title:"🃏 Cartes à imprimer",
        text:"Ce bouton crée des cartes de révision recto-verso, 8 par feuille A4, en noir et blanc : les rectangles et les cercles sont à colorier toi-même. Choisis l’onglet (substances, points, ou points avec image de localisation), puis ce qui va au recto et au verso : les modèles tout prêts sont un bon départ."
      },
      {
        key:"cards-2",
        title:"Choisir les cartes",
        text:pharma
          ? "Coche les SM à imprimer : filtre par classe, cherche un nom, puis « Cocher les affichées », ou ajoute d’un clic ton panier de révision. L’aperçu montre la première feuille, recto à gauche et verso à droite."
          : "Coche les points à imprimer : filtre par canal, cherche un nom, puis « Cocher les affichées », ou ajoute d’un clic ton panier de révision. L’aperçu montre la première feuille, recto à gauche et verso à droite."
      },
      {
        key:"cards-3",
        title:"Conseils d’impression",
        text:"Commence par la « Feuille test ». Dans la fenêtre d’impression : échelle 100 % (pas « Ajuster à la page »), marges : aucune, format A4, recto-verso en retournant sur le bord indiqué (long par défaut). Regarde la feuille test à contre-jour : si le verso est décalé, corrige le décalage dans les réglages, puis découpe le long des pointillés."
      }
    ];
  }

  // Personnes qui ont déjà vu le tuto complet avant l'arrivée des cartes :
  // une courte série de bulles, une seule fois.
  function tutorialAlreadySeen(){
    try{
      const domain = typeof getCurrentStudyDomainForTutorial === "function" ? getCurrentStudyDomainForTutorial() : "";
      if(!domain) return false;
      return typeof hasSeenTutorialForDomain === "function" && hasSeenTutorialForDomain(domain);
    }catch(error){ return false; }
  }

  function showCardsFeatureTour(){
    try{ if(localStorage.getItem(CARDS_FEATURE_SEEN_KEY) === "1") return; }catch(error){ return; }
    if(!tutorialAlreadySeen()) return;
    if(typeof window.showProgressHint !== "function" && typeof showProgressHint !== "function") return;
    if(document.getElementById("tourBox") || !document.querySelector(CARDS_SELECTOR)) return;
    try{ localStorage.setItem(CARDS_FEATURE_SEEN_KEY, "1"); }catch(error){}
    const show = typeof window.showProgressHint === "function" ? window.showProgressHint : showProgressHint;
    const steps = cardsTourSteps(isPharma());
    steps[0] = Object.assign({}, steps[0], {title:"Nouveau : 🃏 cartes à imprimer"});
    let index = 0;
    const next = () => {
      if(index >= steps.length) return;
      const step = steps[index++];
      show("feature_" + step.key, CARDS_SELECTOR, step.title, step.text, {position:"aboveBottom"});
      // Bulle suivante dès que celle-ci est fermée (bouton OK).
      const wait = window.setInterval(() => {
        if(document.getElementById("tourBox")) return;
        window.clearInterval(wait);
        window.setTimeout(next, 250);
      }, 300);
    };
    next();
  }

  function scheduleCardsFeatureTour(){
    let tries = 0;
    const attempt = () => {
      tries++;
      const busy = document.getElementById("tourBox") ||
        document.querySelector(".mtc-cards-modal.visible, .study-domain-chooser.visible, #studyDomainChooser:not([hidden])");
      if(busy){
        if(tries < 20) window.setTimeout(attempt, 3000);
        return;
      }
      showCardsFeatureTour();
    };
    window.setTimeout(attempt, 3500);
  }

  // Étape repérée par une clé (plusieurs étapes peuvent viser le même
  // élément). after = clé ou sélecteur de l'étape précédente, ou un index.
  function insertKeyedStep(steps, key, step, after){
    if(!Array.isArray(steps) || steps.some(item => item && item.__mtcKey === key)) return;
    const full = Object.assign({
      fallback:() => document.querySelector(step.selector) || document.querySelector("#footerTitle") || document.querySelector("#grid")
    }, step, {__mtcKey:key});
    let index = -1;
    if(typeof after === "number") index = after;
    else index = steps.findIndex(item => item && (item.__mtcKey === after || item.selector === after));
    if(index >= 0) steps.splice(index + 1, 0, full);
    else{
      const endIndex = steps.findIndex(item => item && item.selector === "#grid" && item.title === " ");
      steps.splice(endIndex >= 0 ? endIndex : steps.length, 0, full);
    }
  }

  function applyUserTutorialTexts(){
    const steps = currentSteps();
    if(!Array.isArray(steps)) return;

    const pharma = isPharma();

    patchStep(
      steps,
      "#mtcDailyReminderButton",
      "La cloche programme un rappel quotidien à l’heure de ton choix : ajoute-le à ton agenda (le plus fiable, sur tous les appareils) ou active la notification du navigateur."
    );

    patchStep(
      steps,
      ".topbar-row button[onclick*='newGame()']",
      pharma
        ? "Ce bouton relance une grille avec 4 classes de SM."
        : "Ce bouton relance une grille avec 4 catégories de points."
    );

    patchStep(
      steps,
      ".topbar-row button[onclick*='toggleSettings()']",
      pharma
        ? "Ici tu peux ajuster les couleurs, le halo, la taille du texte et l’affichage des noms communs au survol"
        : "Ici tu peux ajuster les couleurs, le halo et la taille du texte pour que la grille soit confortable."
    );

    patchStep(
      steps,
      "#jokerBubble",
      pharma
        ? "T'as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une catégorie."
        : "T'as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une catégorie."
    );

    patchStep(
      steps,
      "#gameplayModeReviewBtn",
      pharma
        ? "La colombe active la Révision douce : plus d’astuces + des erreurs presque illimitées, pour revoir les points et les catégories sans pression. Reclique dessus pour revenir au mode normal."
        : "La colombe active la Révision douce : plus d’astuces + des erreurs presque illimitées, pour revoir les points et les catégories sans pression. Reclique dessus pour revenir au mode normal."
    );

    patchStep(
      steps,
      "#cheatsheetButton",
      pharma
        ? "Le Cheatsheet sert de mémo rapide pour les SM, les classes et les repères essentiels."
        : "Le Cheatsheet sert de mémo rapide pour les points, les catégories et les grands repères du cours."
    );

    patchStep(
      steps,
      "#statsButton",
      pharma
        ? "Les Stats montrent les SM et les classes déjà travaillées. Les analyses détaillées apparaissent seulement après 10 parties terminées."
        : "Les Stats montrent les points et les catégories déjà travaillés. Les analyses détaillées apparaissent seulement après 10 parties terminées."
    );

    patchStep(
      steps,
      "#advancedSearchButton",
      pharma
        ? "Ici tu peux filtrer les SM par nom, pinyin, classe, nature, saveur, tropisme, ou rechercher dans leurs fiches. Sens-toi libre d'expérimenter !"
        : "Filtre les points par mot-clé, catégorie, canal ou intersections."
    );

    patchStep(
      steps,
      "#grid",
      "Bonnes révisions !",
      step => step && step.title === " "
    );

    insertStepOnce(
      steps,
      "#studyDomainSelect",
      "ACU / PHARMA",
      "Ici tu peux changer de matière en cours de route.",
      ".topbar-row button[onclick*='newGame()']"
    );

    insertStepOnce(
      steps,
      "#fullscreenToggleButton",
      "Plein écran",
      "Ici tu peux mettre le jeu en plein écran.",
      "#studyDomainSelect",
      () => { if(typeof window.mtcOpenTopbarMoreMenu === "function") window.mtcOpenTopbarMoreMenu(); }
    );

    // Après la partie : mémo, quiz, révision espacée (boutons qui
    // n'apparaissent qu'en fin de grille → bulle posée sur la grille).
    insertKeyedStep(steps, "after-game", {
      selector:"#grid",
      title:"Après la partie",
      text:pharma
        ? "Une fois la grille terminée, deux boutons apparaissent sous la grille : le Mémo, pour revoir les SM de la grille en un coup d'œil, et le Quiz, pour vérifier ce que tu as retenu."
        : "Une fois la grille terminée, deux boutons apparaissent sous la grille : le Mémo, pour revoir les points de la grille en un coup d'œil, et le Quiz, pour vérifier ce que tu as retenu. Les points que tu connais mal reviennent ensuite d'eux-mêmes grâce au bouton 🔁 Réviser, en haut (répétition espacée).",
      position:"aboveBottom"
    }, 0);

    // Cartes de révision à imprimer (bouton 🃏 en bas).
    let previous = "#suggestionMailButton";
    cardsTourSteps(pharma).forEach(step => {
      insertKeyedStep(steps, step.key, {selector:CARDS_SELECTOR, title:step.title, text:step.text, position:"aboveBottom"}, previous);
      previous = step.key;
    });
    // Ce tuto complet contient déjà les cartes : pas de bulle « Nouveau » ensuite.
    try{ localStorage.setItem(CARDS_FEATURE_SEEN_KEY, "1"); }catch(error){}

    insertStepOnce(
      steps,
      "#mtcAudioModeToggle",
      "Audio",
      "Ce bouton permet de jouer les fichiers audios de prononciation pour les points valides.",
      "#fullscreenToggleButton"
    );
  }

  function wrapStartTour(){
    const current = window.startTour;
    if(typeof current !== "function" || current.__mtcUserTutorialTextsWrapped) return;
    const wrapped = function(){
      const result = current.apply(this, arguments);
      try{ applyUserTutorialTexts(); }catch(error){}
      return result;
    };
    wrapped.__mtcUserTutorialTextsWrapped = true;
    window.startTour = wrapped;
  }

  function normalizeHintText(title, text){
    const rawTitle = String(title || "").trim();
    const rawText = String(text || "");

    if(rawTitle === "Catégorie trouvée" || rawText.includes("Bien joué. En cliquant sur un point rangé ici")){
      return "Bien joué. Clique sur un point pour afficher sa fiche détaillée!";
    }
    if(rawText.includes("Tu peux rechercher un point par mot-clé, puis préciser où chercher")){
      return "Tu peux rechercher un point par mot-clé, puis préciser où chercher : nom, fonctions, indications ou notes...";
    }
    if(rawText.includes("Les points sont côte à côte pour comparer rapidement")){
      return "Les points sont côte à côte pour comparer rapidement leurs catégories, correspondances, etc.";
    }
    if(rawText.includes("En cliquant sur une ampoule, tu ouvres un post-it")){
      return "En cliquant sur une ampoule, tu ouvres un post-it pour réviser la catégorie. Psst: Tu peux le déplacer.";
    }
    if(rawText.includes("Les traits colorés relient les catégories qui fonctionnent ensemble")){
      return "Les traits colorés relient les catégories qui fonctionnent ensemble. Clique sur + pour voir la fiche de l’association.";
    }
    return text;
  }

  function wrapProgressHints(){
    const current = window.showProgressHintSoon;
    if(typeof current !== "function" || current.__mtcUserTutorialTextsWrapped) return;
    const wrapped = function(id, selector, title, text, options, delay){
      return current.call(this, id, selector, title, normalizeHintText(title, text), options, delay);
    };
    wrapped.__mtcUserTutorialTextsWrapped = true;
    window.showProgressHintSoon = wrapped;
  }

  function boot(){
    wrapStartTour();
    wrapProgressHints();
    scheduleCardsFeatureTour();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();
