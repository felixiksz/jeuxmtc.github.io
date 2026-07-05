/* === PHARMA Bucket 8 : stats, vies, astuces, victoire / game over, gameplay adaptatif === */
(function(){
  "use strict";

  const STATS_KEY = "mtc_pharma_stats_v1";
  const MAX_MISTAKES = 5;
  const MAX_HINTS = 5;
  const PHARMA_GAMEPLAY_MODE_KEY = "mtc_gameplay_mode_pharmacology_v1";
  const PHARMA_SESSION_GOAL_KEY = "mtc_session_goal_pharmacology_v1";
  const PHARMA_REVIEW_QUEUE_KEY = "mtc_pharma_review_queue_v1";

  const previous = {
    giveHint: window.giveHint,
    toggleStatsPanel: window.toggleStatsPanel,
    openStatsPanel: window.openStatsPanel,
    renderStatsPanel: window.renderStatsPanel,
    renderStatsPanelIfOpen: window.renderStatsPanelIfOpen
  };

  const run = {
    active:false,
    closed:false,
    startTime:0,
    mistakes:0,
    hints:0,
    solvedClassCodes:new Set(),
    groups:[],
    board:[],
    reviewItems:[],
    hintGroupCode:null,
    hintStep:0
  };

  function isPharmaDomain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){ return document.getElementById(id); }

  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function normalizeText(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCasePinyin(value){
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1).toLocaleLowerCase("fr-FR"))
      .join(" ");
  }

  function containsCjk(value){ return /[\u3400-\u9fff]/.test(String(value || "")); }

  function herbById(id){
    return (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .find(herb => herb && String(herb.id) === String(id)) || null;
  }

  function classByCode(code){
    return (Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [])
      .find(item => item && String(item.code) === String(code)) || null;
  }

  function herbLabel(herb){
    if(!herb) return "?";
    const preferred = herb.pinyin && !containsCjk(herb.pinyin) ? herb.pinyin : "";
    const fallback = herb.pinyinSansTons && !containsCjk(herb.pinyinSansTons) ? herb.pinyinSansTons : "";
    return titleCasePinyin(preferred || fallback || herb.nom || herb.id || "?");
  }

  function storageGetJson(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed || fallback;
    }catch(error){
      return fallback;
    }
  }

  function storageSetJson(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(error){}
  }

  function emptyStats(){
    return {
      version:1,
      gamesStarted:0,
      gamesFinished:0,
      wins:0,
      gameOvers:0,
      totalMistakes:0,
      totalHints:0,
      totalMs:0,
      essentialSeen:0,
      essentialSolved:0,
      classes:{},
      herbs:{},
      confusions:{},
      modes:{},
      reviewQueue:[],
      days:{},
      lastPlayed:null
    };
  }

  function loadStats(){
    const stats = Object.assign(emptyStats(), storageGetJson(STATS_KEY, {}));
    stats.classes = stats.classes || {};
    stats.herbs = stats.herbs || {};
    stats.confusions = stats.confusions || {};
    stats.modes = stats.modes || {};
    stats.reviewQueue = Array.isArray(stats.reviewQueue) ? stats.reviewQueue : [];
    stats.days = stats.days || {};
    return stats;
  }

  function saveStats(stats){ storageSetJson(STATS_KEY, stats); }

  function todayKey(){ return new Date().toISOString().slice(0,10); }

  function ensureDay(stats){
    const key = todayKey();
    if(!stats.days[key]) stats.days[key] = {started:0, finished:0, wins:0, mistakes:0, hints:0, ms:0};
    return stats.days[key];
  }

  function ensureClassStats(stats, code, name){
    const key = String(code || "?");
    if(!stats.classes[key]){
      stats.classes[key] = {code:key, name:name || key, seen:0, solved:0, errors:0, hints:0, ms:0, last:null};
    }
    if(name) stats.classes[key].name = name;
    return stats.classes[key];
  }

  function ensureHerbStats(stats, herb){
    const key = String(herb?.id || "?");
    if(!stats.herbs[key]){
      stats.herbs[key] = {
        id:key,
        name:herbLabel(herb),
        classCode:String(herb?.classCode || ""),
        essential:Boolean(herb?.prioritaire),
        seen:0,
        solved:0,
        errors:0,
        hints:0,
        last:null
      };
    }
    stats.herbs[key].name = herbLabel(herb);
    stats.herbs[key].classCode = String(herb?.classCode || stats.herbs[key].classCode || "");
    if(typeof window.getPharmaEssentialIds === "function"){
      stats.herbs[key].essential = window.getPharmaEssentialIds().map(String).includes(key);
    }else{
      stats.herbs[key].essential = Boolean(herb?.prioritaire);
    }
    return stats.herbs[key];
  }


  function getPharmaGameplayMode(){
    const mode = localStorage.getItem(PHARMA_GAMEPLAY_MODE_KEY) || "normal";
    return ["normal","review","exam"].includes(mode) ? mode : "normal";
  }

  function pharmaGameplayModeLabel(mode = getPharmaGameplayMode()){
    return {normal:"Normal", review:"Révision douce", exam:"Examen"}[mode] || "Normal";
  }

  function setPharmaGameplayMode(mode){
    if(!["normal","review","exam"].includes(mode)) mode = "normal";
    localStorage.setItem(PHARMA_GAMEPLAY_MODE_KEY, mode);
    updateStatusDisplay();
    renderPharmaStatsPanelIfOpen();
    if(typeof window.updateVisibleGameplayModeSwitch === "function") window.updateVisibleGameplayModeSwitch();
  }

  function getPharmaMistakeLimit(){
    return getPharmaGameplayMode() === "review" ? 999 : MAX_MISTAKES;
  }

  function getPharmaHintLimit(){
    const mode = getPharmaGameplayMode();
    if(mode === "exam") return 0;
    if(mode === "review") return 9;
    return MAX_HINTS;
  }

  function pharmaLimitText(value){ return value >= 99 ? "∞" : String(value); }

  function getPharmaSessionGoal(){
    const goal = localStorage.getItem(PHARMA_SESSION_GOAL_KEY) || "none";
    return ["none","no_hint","review_errors","fragile_classes","essential_sm"].includes(goal) ? goal : "none";
  }

  function pharmaSessionGoalLabel(goal = getPharmaSessionGoal()){
    return {
      none:"Aucun objectif",
      no_hint:"Réussir sans astuce",
      review_errors:"Revoir les erreurs",
      fragile_classes:"Travailler les classes fragiles",
      essential_sm:"Travailler les SM essentielles"
    }[goal] || "Aucun objectif";
  }

  function pharmaSessionGoalMessage(){
    return "";
  }

  function setPharmaSessionGoal(goal){
    if(!["none","no_hint","review_errors","fragile_classes","essential_sm"].includes(goal)) goal = "none";
    localStorage.setItem(PHARMA_SESSION_GOAL_KEY, goal);
    renderPharmaStatsPanelIfOpen();
  }

  function ensurePharmaModeStats(stats, mode = getPharmaGameplayMode()){
    stats.modes = stats.modes || {};
    if(!stats.modes[mode]) stats.modes[mode] = {started:0, finished:0, wins:0, losses:0};
    return stats.modes[mode];
  }

  function pharmaMistakeRecap(){
    return "";
  }

  function rememberPharmaReviewItem(detail){
    const clickedHerb = herbById(detail?.clickedHerbId);
    const activeClass = classByCode(detail?.activeClassCode);
    const clickedClass = classByCode(detail?.clickedClassCode);
    const item = {
      herbId:String(detail?.clickedHerbId || ""),
      herbName:clickedHerb ? herbLabel(clickedHerb) : "",
      activeClass:activeClass ? `${activeClass.code} · ${activeClass.nom}` : String(detail?.activeClassCode || ""),
      clickedClass:clickedClass ? `${clickedClass.code} · ${clickedClass.nom}` : String(detail?.clickedClassCode || ""),
      reason:detail?.reason || "erreur",
      when:new Date().toISOString()
    };
    run.reviewItems.push(item);

    const stats = loadStats();
    const key = [item.herbId, item.activeClass, item.clickedClass].join("|");
    const queue = Array.isArray(stats.reviewQueue) ? stats.reviewQueue : [];
    stats.reviewQueue = [item, ...queue.filter(old => [old.herbId, old.activeClass, old.clickedClass].join("|") !== key)].slice(0,80);
    saveStats(stats);
  }

  function pharmaEndReviewHtml(){
    return "";
  }

  function startPharmaSoftReviewFromErrors(){
    setPharmaGameplayMode("review");
    try{ localStorage.setItem("mtc_pharma_priority_mode_v1", "all"); }catch(error){}
    if(typeof window.startPharmaGame === "function") window.startPharmaGame();
  }

  function currentModeLabel(){
    const manual = Boolean(byId("modeToggle") && byId("modeToggle").checked);
    if(manual){
      const priority = typeof window.getPharmaPriorityMode === "function" ? window.getPharmaPriorityMode() : "all";
      return priority === "essential" ? "Manuel · SM essentielles" : "Manuel · Toutes les SM";
    }
    const mode = typeof window.getAutoPracticeMode === "function" ? window.getAutoPracticeMode() : "balanced";
    if(mode === "easy" || mode === "strong") return "Auto · Facile";
    if(mode === "hard" || mode === "weak") return "Auto · Difficile";
    return "Auto · Équilibré";
  }

  function updateStatusDisplay(){
    const lifeDisplay = byId("lifeDisplay");
    const cheatDisplay = byId("cheatDisplay");
    const hintButton = byId("hintButton");

    if(lifeDisplay){
      const limit = getPharmaMistakeLimit();
      if(limit >= 99){
        lifeDisplay.textContent = `♥∞ ${run.mistakes ? "· erreurs " + run.mistakes : ""}`;
      }else{
        const remaining = Math.max(0, limit - run.mistakes);
        lifeDisplay.textContent = "♥".repeat(remaining) + "♡".repeat(Math.min(run.mistakes, limit));
      }
    }

    if(cheatDisplay){
      const limit = getPharmaHintLimit();
      const remaining = Math.max(0, limit - run.hints);
      cheatDisplay.textContent = limit <= 0 ? "☘︎0" : "☘︎".repeat(Math.min(remaining, 9));
    }

    if(hintButton){
      const hintLimit = getPharmaHintLimit();
      const disabled = !isPharmaDomain() || run.closed || hintLimit <= 0 || run.hints >= hintLimit;
      hintButton.disabled = disabled;
      hintButton.style.opacity = disabled && isPharmaDomain() ? "0.35" : "1";
      hintButton.style.pointerEvents = disabled && isPharmaDomain() ? "none" : "auto";
    }
  }

  function fadePharmaEndTransientMessages(){
    const hint = byId("hint");

    if(hint && String(hint.textContent || "").trim()){
      hint.classList.add("pharma-end-fade");
      setTimeout(() => {
        if(hint.classList.contains("pharma-end-fade")){
          hint.textContent = "";
          hint.classList.remove("pharma-end-fade");
        }
      }, 1900);
    }

    document.querySelectorAll(".progress-hint-box, .support-coffee-reminder-box").forEach(box => {
      box.classList.add("pharma-end-fade");
      setTimeout(() => {
        if(box && box.parentNode) box.remove();
      }, 1900);
    });
  }

  function showEndScreen(kind){
    const message = byId("message");
    if(!message) return;

    fadePharmaEndTransientMessages();

    const won = kind === "victory";
    document.body.classList.add("game-finished");
    document.body.classList.toggle("game-complete", won);

    // Même écran final que côté ACU : le message reste sobre, les solutions
    // déjà validées/révélées restent consultables autour de la grille.
    message.innerHTML = `
      <div class="game-over-title pharma-end-title ${won ? "bravo-punch" : ""}">${won ? "BRAVO !" : "GAME OVER !"}</div>
      <div class="game-over-subtitle pharma-end-subtitle mtc-final-detail-hint">
        ${won ? " " : ""}
      </div>
      ${pharmaEndReviewHtml()}
    `;
  }

  function finishGame(won){
    if(run.closed) return;
    run.closed = true;
    run.active = false;

    const elapsed = Math.max(0, Date.now() - (run.startTime || Date.now()));
    const stats = loadStats();
    const day = ensureDay(stats);
    stats.gamesFinished += 1;
    const modeStats = ensurePharmaModeStats(stats);
    modeStats.finished += 1;
    stats.totalMs += elapsed;
    stats.totalMistakes += run.mistakes;
    stats.totalHints += run.hints;
    stats.lastPlayed = new Date().toISOString();
    day.finished += 1;
    day.ms += elapsed;
    day.mistakes += run.mistakes;
    day.hints += run.hints;
    if(won){ stats.wins += 1; day.wins += 1; modeStats.wins += 1; }
    else{ stats.gameOvers += 1; modeStats.losses += 1; }

    run.groups.forEach(group => {
      const cls = ensureClassStats(stats, group.classCode || group.key, group.name);
      if(run.solvedClassCodes.has(String(group.classCode || group.key))) cls.ms += elapsed / Math.max(1, run.solvedClassCodes.size || 1);
    });

    saveStats(stats);
    updateStatusDisplay();
    renderPharmaStatsPanelIfOpen();
  }

  function resetPharmaLivesHints(){
    run.mistakes = 0;
    run.hints = 0;
    run.hintGroupCode = null;
    run.hintStep = 0;
    run.closed = false;
    document.body.classList.remove("game-finished", "game-complete");
    updateStatusDisplay();
  }

  function onPharmaGameStarted(groups, board){
    run.active = true;
    run.closed = false;
    run.startTime = Date.now();
    run.groups = Array.isArray(groups) ? groups : [];
    run.board = Array.isArray(board) ? board : [];
    run.solvedClassCodes = new Set();
    run.reviewItems = [];
    run.hintGroupCode = null;
    run.hintStep = 0;

    const stats = loadStats();
    const day = ensureDay(stats);
    stats.gamesStarted += 1;
    ensurePharmaModeStats(stats).started += 1;
    stats.lastPlayed = new Date().toISOString();
    day.started += 1;

    run.groups.forEach(group => {
      const cls = ensureClassStats(stats, group.classCode || group.key, group.name);
      cls.seen += 1;
      cls.last = stats.lastPlayed;
    });

    run.board.forEach(herb => {
      const h = ensureHerbStats(stats, herb);
      h.seen += 1;
      h.last = stats.lastPlayed;
      if(h.essential) stats.essentialSeen += 1;
    });

    saveStats(stats);
    updateStatusDisplay();
    renderPharmaStatsPanelIfOpen();
  }

  function onPharmaClassSolved(group){
    if(!group || run.closed) return;
    const code = String(group.classCode || group.key || "?");
    if(run.solvedClassCodes.has(code)) return;
    run.solvedClassCodes.add(code);

    const stats = loadStats();
    const cls = ensureClassStats(stats, code, group.name);
    cls.solved += 1;
    cls.last = new Date().toISOString();

    (group.herbs || []).forEach(herb => {
      const h = ensureHerbStats(stats, herb);
      h.solved += 1;
      h.last = cls.last;
      if(h.essential) stats.essentialSolved += 1;
    });

    saveStats(stats);
    renderPharmaStatsPanelIfOpen();
  }

  function onPharmaMistake(detail){
    if(run.closed) return false;
    run.mistakes += 1;
    rememberPharmaReviewItem(detail || {});

    const stats = loadStats();
    const activeCode = String(detail?.activeClassCode || "?");
    const clickedCode = String(detail?.clickedClassCode || "?");
    const clickedHerb = herbById(detail?.clickedHerbId);
    const activeClass = classByCode(activeCode);
    const clickedClass = classByCode(clickedCode);
    const when = new Date().toISOString();

    if(activeCode && activeCode !== "?"){
      const cls = ensureClassStats(stats, activeCode, activeClass?.nom || activeCode);
      cls.errors += 1;
      cls.last = when;
    }
    if(clickedCode && clickedCode !== "?" && clickedCode !== activeCode){
      const cls = ensureClassStats(stats, clickedCode, clickedClass?.nom || clickedCode);
      cls.errors += 1;
      cls.last = when;
    }
    if(clickedHerb){
      const h = ensureHerbStats(stats, clickedHerb);
      h.errors += 1;
      h.last = when;
    }
    if(activeCode && clickedCode && activeCode !== clickedCode){
      const key = [activeCode, clickedCode].sort().join(" ↔ ");
      if(!stats.confusions[key]) stats.confusions[key] = {key, count:0, classes:[activeCode, clickedCode]};
      stats.confusions[key].count += 1;
    }

    saveStats(stats);
    updateStatusDisplay();
    renderPharmaStatsPanelIfOpen();

    const message = byId("message");
    const mistakeLimit = getPharmaMistakeLimit();
    if(run.mistakes >= mistakeLimit){
      if(typeof window.revealAllPharmaSolutions === "function") window.revealAllPharmaSolutions();
      finishGame(false);
      showEndScreen("gameover");
      return false;
    }

    if(message){
      message.textContent = detail?.reason === "final-guess"
        ? `Erreur ${run.mistakes}/${pharmaLimitText(mistakeLimit)}. Ce n’est pas la bonne classe.`
        : `Erreur ${run.mistakes}/${pharmaLimitText(mistakeLimit)}. Cette substance appartient à une autre classe.`;
    }
    return true;
  }

  function onPharmaGameWon(){
    finishGame(true);
    showEndScreen("victory");
  }

  function givePharmaHint(){
    if(!isPharmaDomain()) return false;
    if(run.closed) return true;

    const message = byId("message");
    const hint = byId("hint");

    const hintLimit = getPharmaHintLimit();
    if(hintLimit <= 0){
      updateStatusDisplay();
      if(message) message.textContent = "Mode Examen : les astuces sont désactivées.";
      return true;
    }

    if(run.hints >= hintLimit){
      updateStatusDisplay();
      if(message) message.textContent = "Plus aucune ☘︎ disponible :(";
      return true;
    }

    const state = typeof window.getCurrentPharmaGameState === "function" ? window.getCurrentPharmaGameState() : null;
    const groups = (state?.groups || []).filter(group => !group.solved);
    if(!groups.length){
      if(hint) hint.textContent = "☘︎ La partie est déjà terminée.";
      return true;
    }

    let target = null;
    const selectedIds = state?.selectedIds || [];
    if(selectedIds.length){
      const possible = groups.filter(group => selectedIds.every(id => group.herbIds.includes(id)));
      if(possible.length === 1){
        target = possible[0];
      }else{
        run.hints += 1;
        updateStatusDisplay();
        if(message) message.textContent = `☘︎ ASTUCE : ${run.hints}/${pharmaLimitText(hintLimit)}.`;
        if(hint) hint.textContent = "☘︎ Les substances sélectionnées ne semblent pas appartenir à une même classe.";
        return true;
      }
    }else{
      target = groups.find(group => String(group.key) === String(run.hintGroupCode)) || groups[Math.floor(Math.random() * groups.length)];
    }

    if(!target) return true;

    if(String(run.hintGroupCode) !== String(target.key)){
      run.hintGroupCode = target.key;
      run.hintStep = 0;
    }

    run.hints += 1;

    const stats = loadStats();
    const cls = ensureClassStats(stats, target.key, target.name);
    cls.hints += 1;
    (target.herbIds || []).forEach(id => {
      const herb = herbById(id);
      if(herb){
        const h = ensureHerbStats(stats, herb);
        h.hints += 1;
      }
    });
    saveStats(stats);

    const forceTileHint = selectedIds.length >= 2;

    if(forceTileHint){
      const remaining = (target.herbIds || []).filter(id => !selectedIds.includes(id));
      const id = remaining[Math.min(Math.max(0, run.hintStep), Math.max(0, remaining.length - 1))];
      const herb = herbById(id);
      if(hint) hint.textContent = herb
        ? `☘︎ Une autre tuile : ${herbLabel(herb)}`
        : "☘︎ Tu as déjà toutes les tuiles de cette classe.";
    }else if(run.hintStep === 0){
      if(hint) hint.textContent = `☘︎ ${target.name}`;
    }else{
      const remaining = (target.herbIds || []).filter(id => !selectedIds.includes(id));
      const id = remaining[Math.min(run.hintStep - 1, Math.max(0, remaining.length - 1))];
      const herb = herbById(id);
      if(hint) hint.textContent = `☘︎ Une autre substance : ${herbLabel(herb)}`;
    }
    run.hintStep += 1;

    updateStatusDisplay();
    renderPharmaStatsPanelIfOpen();

    if(message){
      message.textContent = run.hints >= hintLimit
        ? `☘︎ ASTUCE : ${run.hints}/${pharmaLimitText(hintLimit)}. Dernière ☘︎ astuce utilisée !`
        : `☘︎ ASTUCE : ${run.hints}/${pharmaLimitText(hintLimit)}.`;
    }
    return true;
  }

  function formatDuration(ms){
    const sec = Math.max(0, Math.round((ms || 0) / 1000));
    const min = Math.floor(sec / 60);
    const rest = sec % 60;
    if(min <= 0) return `${rest}s`;
    return `${min}min ${String(rest).padStart(2,"0")}s`;
  }

  function percent(value){ return `${Math.round((value || 0) * 100)}%`; }

  function classRows(stats){
    return Object.values(stats.classes || {}).map(row => {
      const seen = row.seen || 0;
      const solved = row.solved || 0;
      const errors = row.errors || 0;
      const hints = row.hints || 0;
      const mastery = seen ? Math.max(0, Math.min(1, (solved / seen) - Math.min(errors / Math.max(1, seen), 2) * .18 - Math.min(hints / Math.max(1, seen), 2) * .08)) : 0;
      return Object.assign({}, row, {mastery});
    });
  }

  function herbRows(stats){
    return Object.values(stats.herbs || {}).map(row => {
      const seen = row.seen || 0;
      const solved = row.solved || 0;
      const errors = row.errors || 0;
      const mastery = seen ? Math.max(0, Math.min(1, (solved / seen) - Math.min(errors / Math.max(1, seen), 2) * .25)) : 0;
      return Object.assign({}, row, {mastery});
    });
  }

  function statsList(rows, empty, formatter){
    if(!rows.length) return `<p class="stats-small">${esc(empty)}</p>`;
    return `<ul class="stats-list pharma-stats-list">${rows.map(row => `<li>${formatter(row)}</li>`).join("")}</ul>`;
  }

  function renderPharmaStatsPanel(){
    const content = byId("statsPanelContent");
    if(!content) return;

    const stats = loadStats();
    const classes = classRows(stats);
    const herbs = herbRows(stats);
    const playedClasses = classes.filter(row => row.seen > 0);
    const playedHerbs = herbs.filter(row => row.seen > 0);
    const finished = stats.gamesFinished || 0;
    const avgTime = finished ? formatDuration(stats.totalMs / finished) : "—";
    const winRate = finished ? stats.wins / finished : 0;
    const essentialRate = stats.essentialSeen ? stats.essentialSolved / stats.essentialSeen : 0;
    const classesSeenCount = playedClasses.length;
    const herbsSeenCount = playedHerbs.length;
    const hasBasicStats = finished >= 10;
    const hasConfusionStats = finished >= 30;
    const hasDeepStats = finished >= 50;
    const gameplayMode = getPharmaGameplayMode();

    const mostWorked = [...playedClasses].sort((a,b) => (b.seen||0) - (a.seen||0)).slice(0,8);
    const toReview = [...classes].sort((a,b) => {
      const unseenA = a.seen ? 0 : 1;
      const unseenB = b.seen ? 0 : 1;
      if(unseenA !== unseenB) return unseenB - unseenA;
      return a.mastery - b.mastery || (b.errors||0) - (a.errors||0);
    }).slice(0,8);
    const best = [...playedClasses].filter(row => row.solved > 0).sort((a,b)=> b.mastery - a.mastery).slice(0,8);
    const trickyHerbs = [...playedHerbs].filter(row => row.errors > 0).sort((a,b)=> (b.errors||0)-(a.errors||0) || a.mastery-b.mastery).slice(0,8);
    const confusions = Object.values(stats.confusions || {}).sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,8);

    const rowLine = row => `
      <strong>${esc(row.code ? `${row.code} · ${row.name}` : row.name)}</strong>
      <span class="stats-meta">vu ${row.seen || 0} · réussi ${row.solved || 0} · erreurs ${row.errors || 0} · maîtrise ${percent(row.mastery || 0)}</span>
    `;

    const modeStatLine = Object.entries(stats.modes || {}).map(([key,value]) => {
      const done = value.finished || 0;
      if(!done) return "";
      const rate = done ? (value.wins || 0) / done : 0;
      return `${pharmaGameplayModeLabel(key)} : ${done} partie(s), réussite ${percent(rate)}`;
    }).filter(Boolean).join(" · ");

    content.innerHTML = `
      <div class="point-header"><span class="point-code">Stats PHARMA</span></div>
      <p class="stats-intro">Ces statistiques PHARMA sont séparées des stats ACU et restent enregistrées localement dans ce navigateur.</p>

      <div class="pharma-stats-summary">
        <div><strong>${finished}</strong><span>parties terminées</span></div>
        <div><strong>${stats.wins || 0}</strong><span>victoires</span></div>
        <div><strong>${percent(winRate)}</strong><span>réussite</span></div>
        <div><strong>${classesSeenCount}</strong><span>classes vues</span></div>
        <div><strong>${herbsSeenCount}</strong><span>SM vues</span></div>
        <div><strong>${avgTime}</strong><span>temps moyen</span></div>
        <div><strong>${stats.totalMistakes || 0}</strong><span>erreurs</span></div>
        <div><strong>${stats.totalHints || 0}</strong><span>astuces</span></div>
        <div><strong>${percent(essentialRate)}</strong><span>SM essentielles</span></div>
      </div>

      <div class="stats-card experimental-settings-card">
        <h3>Modes de jeu</h3>
        <p class="stats-small">Mode actuel : ${pharmaGameplayModeLabel(gameplayMode)}. Le choix se fait avec le switch 🕊️ / 🦖 dans la ligne vies / astuces.</p>
        ${modeStatLine ? `<p class="stats-small">Stats séparées par mode : ${esc(modeStatLine)}</p>` : ""}
      </div>

      ${hasBasicStats ? `
        <div class="stats-grid">
          <div class="stats-card"><h3>Classes à retravailler</h3>${statsList(toReview, "Aucune donnée pour l’instant.", rowLine)}</div>
          <div class="stats-card"><h3>Classes les mieux réussies</h3>${statsList(best, "Pas encore assez de réussites.", rowLine)}</div>
          <div class="stats-card"><h3>Classes les plus révisées</h3>${statsList(mostWorked, "Aucune classe révisée.", rowLine)}</div>
          <div class="stats-card"><h3>Substances souvent ratées</h3>${statsList(trickyHerbs, "Aucune substance problématique pour l’instant.", row => `
            <strong>${esc(row.name)}</strong><span class="stats-meta">${esc(row.classCode || "")} · vu ${row.seen || 0} · erreurs ${row.errors || 0}</span>
          `)}</div>
        </div>
      ` : `
        <div class="stats-card pharma-stats-warmup">
          <h3>Données en cours de stabilisation</h3>
          <p class="stats-small">Les statistiques détaillées s’afficheront après 10 parties terminées. Pour l’instant, les résultats sont encore trop sensibles aux premières parties.</p>
          <p class="stats-small">Encore ${Math.max(0, 10 - finished)} partie(s) terminée(s) avant l’analyse détaillée.</p>
        </div>
      `}

      ${hasConfusionStats ? `
        <div class="stats-grid">
          <div class="stats-card"><h3>Confusions fréquentes</h3>${statsList(confusions, "Aucune confusion enregistrée.", row => {
            const names = (row.classes || []).map(code => {
              const cls = classByCode(code);
              return cls ? `${cls.code} · ${cls.nom}` : code;
            }).join(" ↔ ");
            return `<strong>${esc(names)}</strong><span class="stats-meta">${row.count || 0} fois</span>`;
          })}</div>
        </div>
      ` : hasBasicStats ? `
        <div class="stats-card pharma-stats-warmup"><h3>Analyse des confusions</h3><p class="stats-small">Les confusions fréquentes seront affichées après 30 parties terminées.</p></div>
      ` : ""}

      ${hasDeepStats ? `
        <div class="stats-card"><h3>Lecture longue durée</h3><p class="stats-small">Après 50 parties, les classes solides et fragiles deviennent plus interprétables. Les recommandations ci-dessus peuvent servir de vraie file de révision.</p></div>
      ` : hasConfusionStats ? `
        <div class="stats-card pharma-stats-warmup"><h3>Lecture longue durée</h3><p class="stats-small">À partir de 50 parties, le panneau distinguera mieux les acquis solides et les fragilités persistantes.</p></div>
      ` : ""}
    `;
  }
  function renderPharmaStatsPanelIfOpen(){
    const panel = byId("statsPanel");
    if(panel && panel.classList.contains("open") && isPharmaDomain()) renderPharmaStatsPanel();
  }

  function openPharmaStatsPanel(){
    const panel = byId("statsPanel");
    if(!panel) return;
    if(typeof window.closeAllBottomPanels === "function") window.closeAllBottomPanels("statsPanel");
    else document.querySelectorAll("#advancedSearchPanel,#reviewBasketPanel,#comparisonPanel").forEach(el => el.classList.remove("open"));
    renderPharmaStatsPanel();
    panel.classList.add("open");
  }

  function togglePharmaStatsPanel(){
    const panel = byId("statsPanel");
    if(!panel) return;
    if(panel.classList.contains("open")) panel.classList.remove("open");
    else openPharmaStatsPanel();
  }


  function syncPharmaJokerLine(){
    if(isPharmaDomain()) updateStatusDisplay();
  }

  function getPharmaAdaptiveClassBonus(pharmaClass, context){
    const stats = loadStats();
    const row = stats.classes?.[String(pharmaClass?.code || "")];
    const seen = row?.seen || 0;
    const solved = row?.solved || 0;
    const errors = row?.errors || 0;
    const mastery = seen ? Math.max(0, Math.min(1, solved / seen - errors / Math.max(1, seen) * .18)) : 0;
    const mode = context?.priority || "balanced";

    if(context?.mode === "manual") return 0;
    if(mode === "hard" || mode === "weak"){
      return (seen === 0 ? 4 : 0) + (1 - mastery) * 3 + Math.min(errors, 6) * .35;
    }
    if(mode === "easy" || mode === "strong"){
      return seen > 0 ? mastery * 2.5 : -1.5;
    }
    return (seen === 0 ? 1.2 : 0) + (1 - mastery) * .9;
  }

  window.setPharmaGameplayMode = setPharmaGameplayMode;
  window.setPharmaSessionGoal = setPharmaSessionGoal;
  window.pharmaSessionGoalMessage = pharmaSessionGoalMessage;
  window.startPharmaSoftReviewFromErrors = startPharmaSoftReviewFromErrors;
  window.resetPharmaLivesHints = resetPharmaLivesHints;
  window.onPharmaGameStarted = onPharmaGameStarted;
  window.onPharmaClassSolved = onPharmaClassSolved;
  window.onPharmaMistake = onPharmaMistake;
  window.onPharmaGameWon = onPharmaGameWon;
  window.getPharmaAdaptiveClassBonus = getPharmaAdaptiveClassBonus;
  window.getPharmaStats = loadStats;

  window.giveHint = function(){
    if(isPharmaDomain()) return givePharmaHint();
    if(typeof previous.giveHint === "function") return previous.giveHint.apply(this, arguments);
  };

  window.renderStatsPanel = function(){
    if(isPharmaDomain()) return renderPharmaStatsPanel();
    if(typeof previous.renderStatsPanel === "function") return previous.renderStatsPanel.apply(this, arguments);
  };

  window.renderStatsPanelIfOpen = function(){
    if(isPharmaDomain()) return renderPharmaStatsPanelIfOpen();
    if(typeof previous.renderStatsPanelIfOpen === "function") return previous.renderStatsPanelIfOpen.apply(this, arguments);
  };

  window.openStatsPanel = function(){
    if(isPharmaDomain()) return openPharmaStatsPanel();
    if(typeof previous.openStatsPanel === "function") return previous.openStatsPanel.apply(this, arguments);
  };

  window.toggleStatsPanel = function(){
    if(isPharmaDomain()) return togglePharmaStatsPanel();
    if(typeof previous.toggleStatsPanel === "function") return previous.toggleStatsPanel.apply(this, arguments);
  };

  function bootstrapRunningPharmaGame(){
    if(!isPharmaDomain() || run.active) return;
    const state = typeof window.getCurrentPharmaGameState === "function" ? window.getCurrentPharmaGameState() : null;
    if(!state || !Array.isArray(state.board) || !state.board.length || !Array.isArray(state.groups) || !state.groups.length) return;
    resetPharmaLivesHints();
    onPharmaGameStarted(state.groups, state.board);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if(isPharmaDomain()){
      updateStatusDisplay();
      setTimeout(bootstrapRunningPharmaGame, 0);
    }

    const root = document.documentElement;
    if(root){
      const observer = new MutationObserver(mutations => {
        if(mutations.some(item => item.attributeName === "data-study-domain")){
          syncPharmaJokerLine();
        }
      });
      observer.observe(root, {attributes:true});
    }
  });

  if(document.readyState !== "loading"){
    setTimeout(bootstrapRunningPharmaGame, 0);
  }

  document.addEventListener("pharma-herb-edited", () => {
    renderPharmaStatsPanelIfOpen();
  });
})();
