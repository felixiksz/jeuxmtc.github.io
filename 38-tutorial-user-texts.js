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

  function insertStepOnce(steps, selector, title, text, afterSelector){
    if(!Array.isArray(steps) || steps.some(item => item && item.selector === selector)) return;
    const step = {
      selector,
      title,
      text,
      fallback:() => document.querySelector(selector) || document.querySelector("#footerTitle") || document.querySelector("#grid"),
      position:"aboveBottom"
    };
    const afterIndex = steps.findIndex(item => item && item.selector === afterSelector);
    if(afterIndex >= 0){
      steps.splice(afterIndex + 1, 0, step);
    }else{
      const endIndex = steps.findIndex(item => item && item.selector === "#grid" && item.title === " ");
      steps.splice(endIndex >= 0 ? endIndex : steps.length, 0, step);
    }
  }

  function applyUserTutorialTexts(){
    const steps = currentSteps();
    if(!Array.isArray(steps)) return;

    const pharma = isPharma();

    patchStep(
      steps,
      ".topbar-row button[onclick='newGame()']",
      pharma
        ? "Ce bouton relance une grille avec 4 classes de SM."
        : "Ce bouton relance une grille avec 4 catégories de points."
    );

    patchStep(
      steps,
      ".topbar-row button[onclick='toggleSettings()']",
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
        ? "Ici tu peux filtrer les SM par nom, pinyin, classe, nature, saveur, tropisme, ou rechercher dans leurs fiches. Sens-toi libre d'experimenter!"
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
      "Ici tu peux changer de matiere en cours de route.",
      ".topbar-row button[onclick='newGame()']"
    );

    insertStepOnce(
      steps,
      "#fullscreenToggleButton",
      "Plein écran",
      "Ici tu peux mettre le jeu en plein écran",
      "#studyDomainSelect"
    );

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
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();
