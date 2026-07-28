/* ============================================================
   55-point-mastery.js
   Suivi de maîtrise par point (façon Anki), partagé entre le Quiz
   (auto-évaluation explicite après révélation) et la grille (signal
   doux basé sur la rapidité de résolution d'une catégorie). Expose
   window.MTC_QUIZ_MASTERY pour 52-quiz-mode.js et pour le panneau
   stats.
   ============================================================ */
(function(){
  "use strict";

  const STORAGE_PREFIX = "mtc_quiz_mastery_";
  const MAX_LEVEL = 5;
  const CATEGORY_TIMER_KEY = "__mtcCategorySolveStarts";

  function loadRecord(point){
    try{
      const raw = localStorage.getItem(STORAGE_PREFIX + point);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    }catch(error){ return null; }
  }

  function saveRecord(point, record){
    try{ localStorage.setItem(STORAGE_PREFIX + point, JSON.stringify(record)); }catch(error){}
  }

  function ensureRecord(point){
    return loadRecord(point) || {level:0, seen:0, correctStreak:0, lastResponseMs:null, lastSeenAt:null};
  }

  function clampLevel(level){
    return Math.max(0, Math.min(MAX_LEVEL, level));
  }

  // Note explicite du joueur en fin de question de quiz (façon Anki
  // "Again"/"Good", simplifié à deux boutons). C'est le signal le plus
  // fiable : il fait bouger le niveau de façon marquée.
  function recordQuizRating(point, rating){
    if(!point) return;
    const record = ensureRecord(point);
    record.seen = (record.seen || 0) + 1;
    record.lastSeenAt = new Date().toISOString();
    if(rating === "again"){
      record.level = clampLevel((record.level || 0) - 2);
      record.correctStreak = 0;
    }else if(rating === "good"){
      record.level = clampLevel((record.level || 0) + 1);
      record.correctStreak = (record.correctStreak || 0) + 1;
    }
    saveRecord(point, record);
  }

  // Signal doux issu de la grille : une catégorie résolue rapidement,
  // sans détour, laisse penser que ses points sont bien maîtrisés. Ce
  // n'est qu'une petite avance (+0.5), jamais aussi déterminant qu'une
  // auto-évaluation explicite du quiz.
  function recordGridAnswer(point, options){
    if(!point) return;
    const opts = options || {};
    const record = ensureRecord(point);
    record.seen = (record.seen || 0) + 1;
    record.lastSeenAt = new Date().toISOString();
    if(Number.isFinite(opts.responseMs)) record.lastResponseMs = opts.responseMs;
    if(opts.correct){
      const fast = Number.isFinite(opts.responseMs) && opts.responseMs < 6000;
      if(fast && record.seen > 1) record.level = clampLevel((record.level || 0) + 0.5);
    }
    saveRecord(point, record);
  }

  function getLevel(point){
    return ensureRecord(point).level || 0;
  }

  function getTier(point){
    const level = getLevel(point);
    if(level >= 4) return "mastered";
    if(level >= 2) return "learning";
    return "new";
  }

  function tierLabel(tier){
    return {mastered:"maîtrisés", learning:"en cours", new:"à revoir"}[tier] || "à revoir";
  }

  function allTrackedPoints(){
    const points = [];
    try{
      for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if(key && key.indexOf(STORAGE_PREFIX) === 0) points.push(key.slice(STORAGE_PREFIX.length));
      }
    }catch(error){}
    return points;
  }

  function getStatsSummary(){
    const points = allTrackedPoints();
    const summary = {total:points.length, mastered:0, learning:0, new:0};
    points.forEach(point => { summary[getTier(point)]++; });
    return summary;
  }

  // Poids d'échantillonnage pour l'ordre des questions de quiz : plus un
  // point est mal maîtrisé, plus il doit revenir tôt/souvent. Le curseur
  // Facile/Difficile (déjà utilisé pour la génération des grilles)
  // amplifie ou atténue cet effet, sans qu'il faille un réglage séparé.
  function weightFor(point, autoMode){
    const level = getLevel(point);
    const base = MAX_LEVEL - level; // 0..5, plus haut = moins maîtrisé
    const mode = autoMode || (typeof window.getAutoPracticeMode === "function" ? window.getAutoPracticeMode() : "balanced");
    if(mode === "easy") return 1 + base * 0.4;
    if(mode === "hard") return 1 + base * 1.6;
    return 1 + base * 0.9;
  }

  window.MTC_QUIZ_MASTERY = {
    recordQuizRating,
    recordGridAnswer,
    getLevel,
    getTier,
    tierLabel,
    getStatsSummary,
    weightFor
  };

  // --- Hook grille : la partie ACU ne pose pas de question par point
  // isolé (on choisit 4 points formant une catégorie), donc on relie le
  // temps de résolution de la catégorie entière à ses 4 points, plutôt
  // que d'essayer de chronométrer chaque point individuellement.
  function canonicalKey(key){
    return typeof window.canonicalAssociationKey === "function" ? window.canonicalAssociationKey(key) : key;
  }

  function wrapCategorySolvedForMastery(){
    if(typeof window.recordStatsCategorySolved !== "function" || window.recordStatsCategorySolved.__mtcMasteryWrapped) return;
    const original = window.recordStatsCategorySolved;
    const wrapped = function(group){
      try{
        const key = group && group.key;
        const timerBag = window[CATEGORY_TIMER_KEY];
        const startedAt = key && timerBag ? timerBag[canonicalKey(key)] : null;
        const solveMs = Number.isFinite(startedAt) ? Math.max(0, Date.now() - startedAt) : null;
        const points = (group && Array.isArray(group.points)) ? group.points : [];
        points.forEach(point => recordGridAnswer(point, {correct:true, responseMs:solveMs}));
      }catch(error){}
      return original.apply(this, arguments);
    };
    wrapped.__mtcMasteryWrapped = true;
    window.recordStatsCategorySolved = wrapped;
  }

  wrapCategorySolvedForMastery();
  // 08-07-stats-v2.js peut se charger après ce fichier selon l'ordre des
  // scripts : on retente une fois après le chargement complet de la page.
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", wrapCategorySolvedForMastery, {once:true});
  else window.setTimeout(wrapCategorySolvedForMastery, 0);

  // --- Panneau stats : ajoute une carte "Maîtrise du Quiz" après le rendu
  // existant, plutôt que de le remplacer — 28-26-bucket8-...js remplace déjà
  // window.renderStatsPanel une fois pour la partie ACU ; on ajoute notre
  // carte APRÈS coup dans le même conteneur, quel que soit le rendu déjà en
  // place, en respectant la convention "wrap et rappelle l'original" déjà
  // utilisée partout ailleurs dans ce dépôt.
  function masteryCardHtml(){
    const summary = getStatsSummary();
    if(!summary.total) return "";
    return '' +
      '<div class="stats-card">' +
        '<h3>Maîtrise du Quiz</h3>' +
        '<p class="stats-small">' + summary.total + ' point(s) suivi(s) via le quiz et les grilles résolues.</p>' +
        '<div class="pharma-stats-summary acu-stats-summary">' +
          '<div><strong>' + summary.mastered + '</strong><span>maîtrisés</span></div>' +
          '<div><strong>' + summary.learning + '</strong><span>en cours</span></div>' +
          '<div><strong>' + summary.new + '</strong><span>à revoir</span></div>' +
        '</div>' +
      '</div>';
  }

  function appendMasteryCard(){
    const panelContent = document.getElementById("statsPanelContent");
    if(!panelContent) return;
    const html = masteryCardHtml();
    if(!html) return;
    const existing = document.getElementById("mtcQuizMasteryCard");
    if(existing) existing.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    const card = wrap.firstElementChild;
    if(card){
      card.id = "mtcQuizMasteryCard";
      panelContent.appendChild(card);
    }
  }

  function wrapRenderStatsPanelForMastery(){
    if(typeof window.renderStatsPanel !== "function" || window.renderStatsPanel.__mtcMasteryWrapped) return;
    const original = window.renderStatsPanel;
    const wrapped = function(){
      const result = original.apply(this, arguments);
      try{ appendMasteryCard(); }catch(error){}
      return result;
    };
    wrapped.__mtcMasteryWrapped = true;
    window.renderStatsPanel = wrapped;
  }

  // Se charge après 28-26-bucket8-...js dans l'ordre des scripts, mais on
  // retente quand même après DOMContentLoaded par prudence (même logique
  // que pour recordStatsCategorySolved ci-dessus).
  wrapRenderStatsPanelForMastery();
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", wrapRenderStatsPanelForMastery, {once:true});
  else window.setTimeout(wrapRenderStatsPanelForMastery, 0);
})();
