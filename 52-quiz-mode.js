
/* 52 — Quiz de fin de partie (ACU) : interroge sur les 16 points de la
   grille qui vient d'être jouée, un par un — "Quel est le point [catégorie]
   du [canal] ?" — puis révèle nomenclature/pinyin/audio/nom français/
   localisation/image et permet d'ajouter au panier, à la comparaison, ou
   d'ouvrir la fiche complète du point. */
(function(){
  "use strict";

  const ACU_IMAGE_PREFIX = "mtc_point_image_";
  const ACU_IMAGE_MEMO_PREFIX = "mtc_point_image_memo_";

  const state = {
    mode:"text",
    questions:[],
    index:0
  };

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isFinished(){ return document.body.classList.contains("game-finished") || document.body.classList.contains("game-complete"); }
  function cleanText(value){ return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
  function escapeHtml(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function shuffle(items){
    const copy = Array.isArray(items) ? items.slice() : [];
    for(let i = copy.length - 1; i > 0; i -= 1){
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // Aucune table préfixe → nom français d'organe n'existe ailleurs dans le
  // code (CANAL_LABELS de 04-03-core-game.js donne les noms pinyin classiques,
  // pas les noms français). Les 6 vaisseaux extraordinaires restants
  // (ChongMai, DaiMai, YinQiaoMai, YangQiaoMai, YinWeiMai, YangWeiMai) n'ont
  // pas de points qui leur soient propres : un point du plateau aura toujours
  // l'un des préfixes ci-dessous comme canal.
  //
  // La phrase complète (avec préposition/article) est stockée directement au
  // lieu d'un simple nom, pour éviter un "du" générique fautif : Estomac et
  // Intestin Grêle commencent par une voyelle (élision "de l'"), Rate/Vessie/
  // Vésicule Biliaire sont féminins ("de la"), Trois Foyers est pluriel ("des").
  const CANAL_PHRASES = {
    P:"du Poumon", GI:"du Gros Intestin", E:"de l'Estomac", Rt:"de la Rate",
    C:"du Cœur", IG:"de l'Intestin Grêle", V:"de la Vessie", Rn:"du Rein",
    EC:"de l'Enveloppe du Cœur", TF:"des Trois Foyers", VB:"de la Vésicule Biliaire", F:"du Foie",
    RM:"du Vaisseau Conception", DM:"du Vaisseau Gouverneur"
  };

  function canalOfPoint(point){
    const match = String(point || "").match(/^[A-Za-z]+/);
    return match ? match[0] : "";
  }
  function canalPhrase(canal){
    return CANAL_PHRASES[canal] || ("du " + canal);
  }
  function detailsForPoint(point){
    return (window.POINT_DETAILS && window.POINT_DETAILS[point]) || {};
  }
  function getCurrentSolutionGroups(){
    try{
      if(typeof window.getCurrentGridSolution === "function"){
        const groups = window.getCurrentGridSolution();
        if(Array.isArray(groups)) return groups;
      }
    }catch(error){}
    return [];
  }
  function getPointImage(point){
    if(!window.MTC_IMAGE_STORE) return "";
    const key = String(point || "");
    // La version "memo" (sans nom/code visible) passe en premier : quand
    // l'image sert de question (mode image), elle ne doit pas trahir la
    // réponse. Retombe sur l'image normale de la fiche si elle seule existe.
    return window.MTC_IMAGE_STORE.getImage(ACU_IMAGE_MEMO_PREFIX, key)
      || window.MTC_IMAGE_STORE.getImage(ACU_IMAGE_PREFIX, key)
      || "";
  }
  function hasAnyLocalImage(points){
    return (points || []).some(point => getPointImage(point));
  }

  // Certains noms de catégorie commencent déjà par "Points " (ex. "Points
  // Luò-Liaison"), ce qui produisait "Quel est le point Points Luò-Liaison
  // du..." une fois inséré dans le gabarit de question (qui dit déjà "le
  // point"). On retire ce préfixe redondant uniquement pour la formulation
  // de la question, sans toucher au nom de catégorie affiché ailleurs.
  function questionCategoryPhrase(category){
    return cleanText(String(category || "").replace(/^points?\s+/i, ""));
  }

  function currentGridPoints(){
    const groups = getCurrentSolutionGroups();
    const list = [];
    groups.forEach(group => {
      const category = cleanText(group && group.name || group && group.key || "");
      (group && Array.isArray(group.points) ? group.points : []).forEach(point => {
        const code = String(point || "");
        if(!code) return;
        const canal = canalOfPoint(code);
        list.push({point:code, category, categoryPhrase:questionCategoryPhrase(category), canal, canalPhrase:canalPhrase(canal)});
      });
    });
    return list;
  }
  // Échantillonnage pondéré (sans remise) : plus le poids d'un élément est
  // grand, plus il a de chances de sortir tôt. Utilisé pour faire revenir
  // en priorité les points les moins maîtrisés (voir 55-point-mastery.js),
  // tout en gardant une part de hasard — pas un tri strict par faiblesse,
  // qui rendrait le quiz prévisible.
  function weightedOrder(items, weightFn){
    const pool = items.slice();
    const result = [];
    while(pool.length){
      const weights = pool.map(weightFn);
      const total = weights.reduce((sum, value) => sum + value, 0) || 1;
      let roll = Math.random() * total;
      let index = 0;
      for(; index < pool.length - 1; index++){
        roll -= weights[index];
        if(roll <= 0) break;
      }
      result.push(pool.splice(index, 1)[0]);
    }
    return result;
  }

  function masteryWeight(item){
    if(typeof window.MTC_QUIZ_MASTERY !== "object" || !window.MTC_QUIZ_MASTERY) return 1;
    try{ return window.MTC_QUIZ_MASTERY.weightFor(item.point); }catch(error){ return 1; }
  }

  function buildQuestions(mode){
    let points = currentGridPoints();
    if(mode === "image") points = points.filter(item => getPointImage(item.point));
    const questions = shuffle(points).map(item => Object.assign({revealed:false, mode, retryCount:0}, item));
    return weightedOrder(questions, masteryWeight);
  }

  function ensureOverlay(){
    let overlay = byId("mtcQuizOverlay");
    if(overlay) return overlay;
    overlay = document.createElement("section");
    overlay.id = "mtcQuizOverlay";
    overlay.className = "mtc-quiz-overlay";
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("role", "dialog");
    overlay.innerHTML = '<div class="mtc-quiz-shell"><div id="mtcQuizContent"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
      if(event.target === overlay) closeQuiz();
    });
    return overlay;
  }
  function setOverlayVisible(visible){
    const overlay = ensureOverlay();
    overlay.classList.toggle("visible", Boolean(visible));
    overlay.setAttribute("aria-hidden", visible ? "false" : "true");
    document.body.classList.toggle("mtc-quiz-open", Boolean(visible));
  }
  function content(){ ensureOverlay(); return byId("mtcQuizContent"); }
  function headerHtml(title, subtitle){
    return '' +
      '<div class="mtc-quiz-header">' +
        '<div>' +
          '<h2>' + escapeHtml(title) + '</h2>' +
          (subtitle ? '<p>' + escapeHtml(subtitle) + '</p>' : '') +
        '</div>' +
        '<button type="button" class="mtc-quiz-close" data-quiz-action="close" aria-label="Fermer le quiz">×</button>' +
      '</div>';
  }
  function closeQuiz(){ setOverlayVisible(false); }

  function openQuiz(){
    const points = currentGridPoints();
    if(!points.length){
      alert("Je n'arrive pas à récupérer la grille actuelle pour le quiz.");
      return;
    }
    setOverlayVisible(true);
    if(hasAnyLocalImage(points.map(item => item.point))) renderModeChoice();
    else startQuiz("text");
  }
  function renderModeChoice(){
    content().innerHTML = headerHtml("Quiz — sur quoi veux-tu être interrogé·e ?", "") +
      '<div class="mtc-quiz-choice">' +
        '<button type="button" class="mtc-quiz-choice-option" data-quiz-action="choose-mode" data-mode="text">' +
          '<strong>Quiz texte</strong>' +
          '<span>« Quel est le point [catégorie] du [canal] ? »</span>' +
        '</button>' +
        '<button type="button" class="mtc-quiz-choice-option" data-quiz-action="choose-mode" data-mode="image">' +
          '<strong>Quiz image</strong>' +
          '<span>Devine le point à partir de son image locale.</span>' +
        '</button>' +
      '</div>' +
      '<div class="mtc-quiz-nav">' +
        '<button type="button" data-quiz-action="close" class="secondary">Retour</button>' +
      '</div>';
  }
  function chooseQuizMode(mode){
    startQuiz(mode === "image" ? "image" : "text");
  }
  function startQuiz(mode){
    const questions = buildQuestions(mode);
    if(!questions.length){
      alert("Aucun point de cette grille n'a d'image locale importée.");
      renderModeChoice();
      return;
    }
    state.mode = mode;
    state.questions = questions;
    state.index = 0;
    renderCurrentQuestion();
  }
  function restartQuiz(){
    startQuiz(state.mode);
  }

  function comparisonButtonHtml(point){
    let slots = [];
    try{ slots = typeof window.getComparisonPoints === "function" ? window.getComparisonPoints() : []; }catch(error){}
    const index = slots.map(String).indexOf(String(point));
    if(index >= 0){
      const label = typeof window.comparisonSlotLabel === "function" ? window.comparisonSlotLabel(index) : "?";
      return '<button type="button" class="comparison-present-button" data-quiz-action="open-comparison" ' +
        'title="Déjà en comparaison : ' + escapeHtml(label) + '" aria-label="Déjà en comparaison : ' + escapeHtml(label) + '">' +
        escapeHtml(label) + '</button>';
    }
    return '<button type="button" class="comparison-add-button" data-quiz-action="add-comparison" data-point="' + escapeHtml(point) + '" ' +
      'title="Ajouter à la comparaison" aria-label="Ajouter à la comparaison">+</button>';
  }

  function answerHtml(question){
    const point = question.point;
    const details = detailsForPoint(point);
    // En mode image, l'image est déjà affichée comme énoncé de la question :
    // pas besoin de la répéter dans la réponse.
    const image = question.mode === "image" ? "" : getPointImage(point);
    const imageBlockHtml = question.mode === "image" ? "" :
      '<div class="mtc-quiz-answer-image">' +
        (image
          ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(point) + '" loading="lazy">'
          : '<span class="mtc-quiz-no-image">Aucune image locale</span>') +
      '</div>';
    const basketHtml = typeof window.basketButtonHtml === "function"
      ? window.basketButtonHtml(point, "point-header-basket-button", true)
      : "";
    return '' +
      '<div class="mtc-quiz-answer">' +
        imageBlockHtml +
        '<div class="mtc-quiz-answer-fields">' +
          '<div class="mtc-quiz-answer-row"><b>Nomenclature</b><span>' + escapeHtml(point) + '</span></div>' +
          '<div class="mtc-quiz-answer-row"><b>Pinyin</b><span>' + escapeHtml(details.pinyin || "—") +
            (details.hanzi ? ' <span class="mtc-quiz-hanzi">' + escapeHtml(details.hanzi) + '</span>' : '') +
            ' <button type="button" class="mtc-quiz-audio-button" data-quiz-action="play-audio" data-point="' + escapeHtml(point) + '" title="Écouter la prononciation" aria-label="Écouter la prononciation">🔊︎</button>' +
          '</span></div>' +
          '<div class="mtc-quiz-answer-row"><b>Nom français</b><span>' + escapeHtml(details.nom_francais || "—") + '</span></div>' +
          '<div class="mtc-quiz-answer-row"><b>Localisation</b><span>' + escapeHtml(details.localisation || "—") + '</span></div>' +
        '</div>' +
        '<div class="mtc-quiz-answer-actions">' +
          basketHtml +
          comparisonButtonHtml(point) +
          '<button type="button" class="mtc-quiz-fiche-button" data-quiz-action="open-fiche" data-point="' + escapeHtml(point) + '">Voir la fiche complète</button>' +
        '</div>' +
      '</div>';
  }

  function ratingHtml(){
    return '' +
      '<div class="mtc-quiz-rating">' +
        '<button type="button" class="mtc-quiz-rating-again" data-quiz-action="rate" data-rating="again">🔁 À revoir</button>' +
        '<button type="button" class="mtc-quiz-rating-good" data-quiz-action="rate" data-rating="good">✅ Je maîtrise</button>' +
      '</div>';
  }

  function renderCurrentQuestion(){
    if(state.index >= state.questions.length){
      renderCompletion();
      return;
    }
    const question = state.questions[state.index];
    if(!question.shownAt) question.shownAt = Date.now();
    const total = state.questions.length;
    const isImageMode = question.mode === "image";
    const promptHtml = isImageMode
      ? '<div class="mtc-quiz-question-image"><img src="' + escapeHtml(getPointImage(question.point)) + '" alt="Quel est ce point ?" loading="lazy"></div><p class="mtc-quiz-prompt">Quel est ce point ?</p>'
      : '<p class="mtc-quiz-prompt">' + escapeHtml('Quel est le point ' + question.categoryPhrase + ' ' + question.canalPhrase + ' ?') + '</p>';
    content().innerHTML = headerHtml("Quiz", "Question " + (state.index + 1) + " / " + total) +
      '<div class="mtc-quiz-card">' +
        promptHtml +
        (question.revealed
          ? answerHtml(question) + ratingHtml()
          : '<button type="button" class="mtc-quiz-reveal-button" data-quiz-action="reveal">Réponse</button>') +
      '</div>' +
      '<div class="mtc-quiz-nav">' +
        '<button type="button" data-quiz-action="prev" class="secondary"' + (state.index === 0 ? " disabled" : "") + '>Précédent</button>' +
        '<button type="button" data-quiz-action="next">' + (state.index === total - 1 ? "Terminer" : "Suivant") + '</button>' +
      '</div>';
  }
  function renderCompletion(){
    content().innerHTML = headerHtml("Quiz terminé", state.questions.length + " points passés en revue.") +
      '<div class="mtc-quiz-card mtc-quiz-done">' +
        '<p class="mtc-quiz-prompt">Quiz terminé !</p>' +
      '</div>' +
      '<div class="mtc-quiz-nav">' +
        '<button type="button" data-quiz-action="restart">Recommencer</button>' +
        '<button type="button" data-quiz-action="close" class="secondary">Fermer</button>' +
      '</div>';
  }
  function revealCurrent(){
    const question = state.questions[state.index];
    if(!question) return;
    question.revealed = true;
    renderCurrentQuestion();
  }
  function goPrev(){
    if(state.index <= 0) return;
    state.index -= 1;
    renderCurrentQuestion();
  }
  function goNext(){
    state.index += 1;
    renderCurrentQuestion();
  }

  const MAX_RETRIES_PER_POINT = 3;

  // Auto-évaluation façon Anki : "à revoir" fait redescendre le niveau de
  // maîtrise du point et le refait apparaître un peu plus loin dans la
  // MÊME session (pas juste "à la prochaine grille"), tant qu'il n'a pas
  // déjà été redemandé MAX_RETRIES_PER_POINT fois pour éviter qu'un point
  // difficile ne boucle indéfiniment. "Je maîtrise" fait progresser le
  // niveau et le point n'est pas reproposé cette fois-ci.
  function rateCurrent(rating){
    const question = state.questions[state.index];
    if(!question) return;
    const responseMs = question.shownAt ? Math.max(0, Date.now() - question.shownAt) : null;
    if(window.MTC_QUIZ_MASTERY && typeof window.MTC_QUIZ_MASTERY.recordQuizRating === "function"){
      try{ window.MTC_QUIZ_MASTERY.recordQuizRating(question.point, rating === "again" ? "again" : "good"); }catch(error){}
    }
    if(rating === "again" && (question.retryCount || 0) < MAX_RETRIES_PER_POINT){
      const respawn = Object.assign({}, question, {revealed:false, shownAt:null, retryCount:(question.retryCount || 0) + 1, lastResponseMs:responseMs});
      const spacing = 3 + Math.floor(Math.random() * 3);
      const insertAt = Math.min(state.questions.length, state.index + spacing);
      state.questions.splice(insertAt, 0, respawn);
    }
    goNext();
  }

  function handleAction(action, button){
    const point = button && button.getAttribute("data-point");
    if(action === "close") closeQuiz();
    else if(action === "reveal") revealCurrent();
    else if(action === "prev") goPrev();
    else if(action === "next") goNext();
    else if(action === "restart") restartQuiz();
    else if(action === "choose-mode") chooseQuizMode(button && button.getAttribute("data-mode"));
    else if(action === "rate") rateCurrent(button && button.getAttribute("data-rating"));
    else if(action === "play-audio" && point){
      const details = detailsForPoint(point);
      if(details.hanzi && typeof window.playMtcAudioByHanzi === "function") window.playMtcAudioByHanzi(details.hanzi, button);
    }
    else if(action === "add-comparison" && point){
      if(typeof window.addPointToComparison === "function") window.addPointToComparison(point, {autoOpen:false});
      renderCurrentQuestion();
    }
    else if(action === "open-comparison"){
      if(typeof window.openComparisonPanel === "function"){
        closeQuiz();
        window.openComparisonPanel();
      }
    }
    else if(action === "open-fiche" && point){
      closeQuiz();
      if(typeof window.openPointPanelDirect === "function") window.openPointPanelDirect(point);
    }
  }

  function ensureQuizButton(){
    if(isPharma()) return;
    if(!isFinished()) return;
    let wrap = byId("mtcReplaySameGridWrap");
    const messageEl = byId("message");
    if(!wrap && messageEl){
      wrap = document.createElement("div");
      wrap.id = "mtcReplaySameGridWrap";
      messageEl.insertAdjacentElement("afterend", wrap);
    }
    if(!wrap || byId("mtcQuizStartButton")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "mtcQuizStartButton";
    btn.title = "Lancer le quiz avec cette grille";
    btn.innerHTML = '<span aria-hidden="true"><svg viewBox="0 0 100 100" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.22em;"><circle cx="50" cy="50" r="42"/><path d="M38 40c0-9 6-15 14-15s13 6 13 13c0 9-7 11-11 16-2 3-3 6-3 9"/><circle cx="51" cy="80" r="1.2" fill="currentColor" stroke="none"/></svg></span><span class="mtc-replay-label">quiz</span>';
    btn.addEventListener("click", event => {
      event.preventDefault();
      openQuiz();
    });
    wrap.appendChild(btn);
  }
  function removeQuizButtonIfNeeded(){ if(!isFinished()) byId("mtcQuizStartButton")?.remove(); }

  function install(){
    document.addEventListener("click", event => {
      const actionButton = event.target && event.target.closest ? event.target.closest("[data-quiz-action]") : null;
      if(!actionButton) return;
      event.preventDefault();
      if(actionButton.disabled) return;
      handleAction(actionButton.getAttribute("data-quiz-action"), actionButton);
    }, true);

    const observer = new MutationObserver(() => {
      ensureQuizButton();
      removeQuizButtonIfNeeded();
    });
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
    window.setTimeout(ensureQuizButton, 400);
    window.MTCQuizTest = {open:openQuiz, close:closeQuiz, build:buildQuestions, startQuiz, hasAnyLocalImage, currentGridPoints, rateCurrent, state};
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();
