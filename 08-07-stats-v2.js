/* ============================================================
   08-07-stats-v2.js
   Source: ancien bloc <script> #8 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Stats v2 : temps, couverture, modes facile/mixte/difficile === */
(function(){
  const MODE_ALIASES = {
    weak:"hard",
    strong:"easy",
    balanced:"balanced",
    easy:"easy",
    hard:"hard"
  };

  const DEFAULT_MODE = "balanced";
  const CATEGORY_TIMER_KEY = "__mtcCategorySolveStarts";

  window[CATEGORY_TIMER_KEY] = window[CATEGORY_TIMER_KEY] || {};

  function nowMs(){
    return (
      window.performance &&
      typeof performance.now === "function"
    )
      ? performance.now()
      : Date.now();
  }

  function clamp01(value){
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function normalizePracticeMode(mode){
    return MODE_ALIASES[mode] || DEFAULT_MODE;
  }

  window.getAutoPracticeMode = function(){
    return normalizePracticeMode(
      localStorage.getItem(MTC_AUTO_PRACTICE_MODE_KEY) || DEFAULT_MODE
    );
  };

  window.autoPracticeModeLabel = function(mode){
    return {
      easy:"Facile",
      balanced:"Mixte",
      hard:"Difficile"
    }[normalizePracticeMode(mode)] || "Mixte";
  };

  const PRACTICE_MODE_SLIDER_VALUES = ["easy", "balanced", "hard"];

  function practiceModeToSliderValue(mode){
    const cleanMode = normalizePracticeMode(mode);
    const index = PRACTICE_MODE_SLIDER_VALUES.indexOf(cleanMode);
    return index >= 0 ? index : 1;
  }

  function sliderValueToPracticeMode(value){
    const index = Math.max(
      0,
      Math.min(
        PRACTICE_MODE_SLIDER_VALUES.length - 1,
        Number(value) || 0
      )
    );

    return PRACTICE_MODE_SLIDER_VALUES[index] || DEFAULT_MODE;
  }

  function isManualPracticeMode(){
    return (
      typeof currentMode === "function" &&
      currentMode() === "manual"
    );
  }

  window.previewPracticeModeFromSlider = function(value){
    const label = document.getElementById("practiceDifficultyCurrentLabel");

    if(label){
      label.textContent = autoPracticeModeLabel(
        sliderValueToPracticeMode(value)
      );
    }
  };

  window.updatePracticeModeSwitch = function(){
    const mode = getAutoPracticeMode();
    const isManual = isManualPracticeMode();

    document
      .querySelectorAll("[data-practice-mode]")
      .forEach(button=>{
        const active =
          normalizePracticeMode(button.dataset.practiceMode) === mode;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

    const slider = document.getElementById("practiceDifficultySlider");
    const label = document.getElementById("practiceDifficultyCurrentLabel");
    const wrapper = document.getElementById("practiceDifficultySliderWrap");

    if(slider){
      slider.value = String(practiceModeToSliderValue(mode));
      slider.disabled = isManual;
      slider.setAttribute("aria-disabled", isManual ? "true" : "false");
      slider.title = isManual
        ? "Désactivé en mode Manuel"
        : "Mode Auto : de facile à difficile";
    }

    if(label){
      label.textContent = autoPracticeModeLabel(mode);
    }

    if(wrapper){
      wrapper.classList.toggle("disabled", isManual);
      wrapper.setAttribute("aria-disabled", isManual ? "true" : "false");
      wrapper.title = isManual
        ? "Désactivé en mode Manuel"
        : "Mode Auto : de facile à difficile";
    }
  };

  window.setAutoPracticeModeFromSlider = function(value){
    setAutoPracticeMode(
      sliderValueToPracticeMode(value),
      {reload:true}
    );
  };

  window.setAutoPracticeMode = function(mode, options = {}){
    const cleanMode = normalizePracticeMode(mode);
    const previousMode = getAutoPracticeMode();

    try{ localStorage.setItem(MTC_AUTO_PRACTICE_MODE_KEY, cleanMode); }catch(error){}

    updatePracticeModeSwitch();
    renderStatsPanelIfOpen();

    const shouldReload =
      options.reload !== false &&
      previousMode !== cleanMode &&
      !isManualPracticeMode() &&
      typeof newGame === "function";

    if(shouldReload){
      setTimeout(()=>newGame(), 0);
    }
  };

  const previousToggleManualModeForStatsV2 = window.toggleManualMode;

  if(typeof previousToggleManualModeForStatsV2 === "function"){
    window.toggleManualMode = function(){
      const result = previousToggleManualModeForStatsV2.apply(this, arguments);
      updatePracticeModeSwitch();
      return result;
    };
  }

  function mergeUniquePoints(oldPoints, newPoints){
    return [
      ...new Set([
        ...(Array.isArray(oldPoints) ? oldPoints : []),
        ...(Array.isArray(newPoints) ? newPoints : [])
      ].map(String))
    ];
  }

  window.ensureCategoryStats = function(stats, key, name){
    const cleanKey = canonicalAssociationKey(key);

    if(!stats.categories[cleanKey]){
      stats.categories[cleanKey] = {
        name:name || DISPLAY_NAMES[cleanKey] || displayLabel(cleanKey),
        seen:0,
        solved:0,
        allPointsFound:0,
        foundPoints:[],
        seenPoints:[],
        avgSolveMs:null,
        lastSolveMs:null,
        bestSolveMs:null,
        solveTimeCount:0,
        hints:0,
        lastSeen:null,
        lastSolved:null,
        lastAllPointsFound:null
      };
    }

    const cat = stats.categories[cleanKey];

    if(name){
      cat.name = name;
    }

    if(!Array.isArray(cat.foundPoints)){
      cat.foundPoints = [];
    }

    if(!Array.isArray(cat.seenPoints)){
      cat.seenPoints = Array.isArray(cat.foundPoints)
        ? [...cat.foundPoints]
        : [];
    }

    if(!Number.isFinite(Number(cat.solveTimeCount))){
      cat.solveTimeCount = Number(cat.avgSolveMs) > 0 ? 1 : 0;
    }

    if(!(Number(cat.avgSolveMs) > 0)){
      cat.avgSolveMs = null;
    }

    if(!(Number(cat.lastSolveMs) > 0)){
      cat.lastSolveMs = null;
    }

    if(!(Number(cat.bestSolveMs) > 0)){
      cat.bestSolveMs = null;
    }

    return cat;
  };

  window.recordStatsGameStarted = function(groups){
    const stats = loadMtcStats();
    const now = new Date().toISOString();

    stats.gamesStarted++;
    currentGameStatsClosed = false;
    window[CATEGORY_TIMER_KEY] = {};

    const day = ensureDayStats(stats);
    day.games++;

    (groups || []).forEach(group=>{
      const cat = ensureCategoryStats(stats, group.key, group.name);

      cat.seen++;
      cat.lastSeen = now;
      cat.seenPoints = mergeUniquePoints(cat.seenPoints, group.points || []);

      const totalPoints = mtcCategoryTotalPoints(group).length;
      if(totalPoints > 0 && cat.seenPoints.length >= totalPoints){
        cat.allPointsFound = 1;
        cat.lastAllPointsFound = cat.lastAllPointsFound || now;
      }
    });

    saveMtcStats(stats);
    renderStatsPanelIfOpen();
  };

  function startCategorySolveTimerForPoint(point){
    if(!point || gameOver) return;

    const group = (solution || []).find(candidate =>
      candidate &&
      !candidate.solved &&
      Array.isArray(candidate.points) &&
      candidate.points.includes(point)
    );

    if(!group) return;

    const key = canonicalAssociationKey(group.key);

    if(!window[CATEGORY_TIMER_KEY][key]){
      window[CATEGORY_TIMER_KEY][key] = nowMs();
    }
  }

  if(typeof window.toggleTile === "function" && !window.toggleTile.__mtcStatsTimed){
    const originalToggleTile = window.toggleTile;

    const timedToggleTile = function(tile, point){
      startCategorySolveTimerForPoint(point);
      return originalToggleTile.apply(this, arguments);
    };

    timedToggleTile.__mtcStatsTimed = true;
    window.toggleTile = timedToggleTile;
  }

  window.recordStatsCategorySolved = function(group){
    if(!group || gameOver) return;

    const stats = loadMtcStats();
    const cat = ensureCategoryStats(stats, group.key, group.name);
    const now = new Date().toISOString();

    cat.solved++;
    cat.lastSolved = now;

    cat.foundPoints = mergeUniquePoints(cat.foundPoints, group.points || []);
    cat.seenPoints = mergeUniquePoints(cat.seenPoints, group.points || []);

    const key = canonicalAssociationKey(group.key);
    const startedAt = window[CATEGORY_TIMER_KEY][key];

    if(Number.isFinite(startedAt)){
      const solveMs = Math.max(0, nowMs() - startedAt);

      cat.lastSolveMs = solveMs;
      cat.bestSolveMs =
        Number(cat.bestSolveMs) > 0
          ? Math.min(Number(cat.bestSolveMs), solveMs)
          : solveMs;

      cat.solveTimeCount = Number(cat.solveTimeCount || 0) + 1;

      cat.avgSolveMs =
        Number(cat.avgSolveMs) > 0
          ? Number(cat.avgSolveMs) * 0.7 + solveMs * 0.3
          : solveMs;

      delete window[CATEGORY_TIMER_KEY][key];
    }

    const totalPoints = mtcCategoryTotalPoints(group).length;

    const isNowComplete =
      totalPoints > 0 &&
      cat.seenPoints.length >= totalPoints;

    if(isNowComplete && !Number(cat.allPointsFound || 0)){
      cat.allPointsFound = 1;
      cat.lastAllPointsFound = now;
    }

    saveMtcStats(stats);
    renderStatsPanelIfOpen();
  };

  function timeDifficultyFromMs(ms){
    const value = Number(ms);

    if(!(value > 0)){
      return null;
    }

    const minMs = 12000;
    const maxMs = 180000;

    const normalized =
      (Math.log(value) - Math.log(minMs)) /
      (Math.log(maxMs) - Math.log(minMs));

    return clamp01(normalized);
  }

  function unknownTimeDifficulty(row){
    if(row.solved > 0) return 0.48;
    if(row.seen > 0) return 0.82;
    return 0.68;
  }

  window.categoryStatsRowFromCat = function(stats, cat){
    const saved = ensureCategoryStats(
      stats,
      cat.key,
      cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
    );

    const totalPoints =
      mtcCategoryTotalPoints(cat).length;

    const seenPointsCount =
      Array.isArray(saved.seenPoints)
        ? saved.seenPoints.length
        : 0;

    const foundPointsCount =
      Array.isArray(saved.foundPoints)
        ? saved.foundPoints.length
        : 0;

    const coverage =
      totalPoints > 0
        ? clamp01(seenPointsCount / totalPoints)
        : 0;

    const timeDifficulty =
      timeDifficultyFromMs(saved.avgSolveMs);

    const effectiveTimeDifficulty =
      timeDifficulty == null
        ? unknownTimeDifficulty(saved)
        : timeDifficulty;

    const difficulty =
      clamp01((1 - coverage) * 0.52 + effectiveTimeDifficulty * 0.48);

    const ease =
      timeDifficulty == null
        ? null
        : clamp01(1 - timeDifficulty);

    const allPointsComplete =
      totalPoints > 0 &&
      seenPointsCount >= totalPoints;

    return {
      key:cat.key,
      name:saved.name,
      seen:saved.seen || 0,
      solved:saved.solved || 0,
      allPointsFound:allPointsComplete ? 1 : 0,
      allPointsComplete,
      foundPointsCount,
      seenPointsCount,
      totalPoints,
      coverage,
      avgSolveMs:Number(saved.avgSolveMs) > 0 ? Number(saved.avgSolveMs) : null,
      lastSolveMs:Number(saved.lastSolveMs) > 0 ? Number(saved.lastSolveMs) : null,
      bestSolveMs:Number(saved.bestSolveMs) > 0 ? Number(saved.bestSolveMs) : null,
      solveTimeCount:Number(saved.solveTimeCount || 0),
      timeDifficulty:effectiveTimeDifficulty,
      ease,
      difficulty,
      mastery:1 - difficulty,
      hints:saved.hints || 0
    };
  };

  window.categoryMasteryScore = function(row){
    return row ? clamp01(1 - Number(row.difficulty || 0)) : 0;
  };

  window.getAllStatsRows = function(stats){
    if(!pool || !pool.length){
      pool = buildPool();
    }

    const rows = pool.map(cat => categoryStatsRowFromCat(stats, cat));

    Object.entries(stats.categories || {}).forEach(([key,value])=>{
      const canonicalKey = canonicalAssociationKey(key);

      if(rows.some(row => canonicalAssociationKey(row.key) === canonicalKey)){
        return;
      }

      rows.push(
        categoryStatsRowFromCat(
          stats,
          {
            key:canonicalKey,
            name:value.name || DISPLAY_NAMES[canonicalKey] || displayLabel(canonicalKey),
            points:mtcCategoryTotalPoints(canonicalKey)
          }
        )
      );
    });

    return rows.map(row => ({
      ...row,
      mastery:categoryMasteryScore(row)
    }));
  };

  window.categoryPracticeWeight = function(cat){
    const mode = getAutoPracticeMode();
    const stats = loadMtcStats();
    const row = categoryStatsRowFromCat(stats, cat);

    let weight = MTC_IMPORTANT_CATEGORY_KEYS.includes(canonicalAssociationKey(cat.key))
      ? 2
      : 1;

    if(mode === "easy"){
      weight += Math.round((1 - row.difficulty) * 9);
      if(row.coverage > 0.25) weight += 1;
    }else if(mode === "hard"){
      weight += Math.round(row.difficulty * 10);
      if(row.coverage < 1) weight += 2;
    }else{
      const middlePriority =
        1 - Math.abs(row.difficulty - 0.5) * 2;

      weight += Math.round(clamp01(middlePriority) * 5);
      weight += Math.round((1 - row.coverage) * 3);
    }

    return Math.max(1, Math.min(14, weight));
  };

  function formatDuration(ms){
    if(!(Number(ms) > 0)){
      return "—";
    }

    const totalSeconds = Math.max(1, Math.round(Number(ms) / 1000));

    if(totalSeconds < 60){
      return totalSeconds + "s";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}m${String(seconds).padStart(2,"0")}`;
  }

  function shortPercent(value){
    return Math.round(clamp01(value) * 100) + "%";
  }

  function statsHelp(text){
    return `
      <span class="stats-help-wrap">
        <button
          type="button"
          class="stats-help"
          data-stats-help="${escapeAttribute(text)}"
          aria-label="${escapeAttribute(text)}"
        >?</button>
      </span>
    `;
  }

  window.initStatsHelpTooltips = function initStatsHelpTooltips(){
  let floating = document.getElementById("statsFloatingHelpTooltip");

  if(!floating){
    floating = document.createElement("div");
    floating.id = "statsFloatingHelpTooltip";
    floating.className = "stats-floating-help-tooltip";
    floating.setAttribute("role", "tooltip");
    document.body.appendChild(floating);
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(value, max));
  }

  function hide(){
    floating.classList.remove("visible");
  }

  function show(button){
      const text = button.getAttribute("data-stats-help");
      if(!text) return;

      floating.textContent = text;
      floating.classList.add("visible");

      const panel =
        document.getElementById("statsPanel") ||
        document.querySelector(".stats-panel");

      const panelRect = panel
        ? panel.getBoundingClientRect()
        : { top: window.innerHeight * .25 };

      const buttonRect = button.getBoundingClientRect();
      const tooltipRect = floating.getBoundingClientRect();

      const margin = 12;

      const desiredLeft =
        buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;

      const left = clamp(
        desiredLeft,
        margin,
        window.innerWidth - tooltipRect.width - margin
      );

      let top = panelRect.top - tooltipRect.height - 12;

      if(top < margin){
        top = margin;
      }

      const arrowLeft = clamp(
        buttonRect.left + buttonRect.width / 2 - left,
        18,
        tooltipRect.width - 18
      );

      floating.style.left = left + "px";
      floating.style.top = top + "px";
      floating.style.setProperty("--stats-help-arrow-left", arrowLeft + "px");
    }

    document
      .querySelectorAll("#statsPanel .stats-help, .stats-panel .stats-help")
      .forEach(button => {
        if(button.dataset.statsHelpReady === "1") return;

        button.dataset.statsHelpReady = "1";

        button.addEventListener("mouseenter", () => show(button));
        button.addEventListener("mouseleave", hide);

        button.addEventListener("focus", () => show(button));
        button.addEventListener("blur", hide);

        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          if(floating.classList.contains("visible")){
            hide();
          }else{
            show(button);
          }
        });
      });

    window.addEventListener("resize", hide, { passive:true });
  }

  function statsRankRowHtml(row, meta, barValue){
    return `
      <li class="stats-rank-row">
        <span class="stats-rank-name" title="${escapeAttribute(row.name)}">
          ${escapeHtml(row.name)}
        </span>
        <span class="stats-rank-meta">${escapeHtml(meta)}</span>
        <span class="stats-bar" aria-hidden="true">
          <span class="stats-bar-fill" style="width:${Math.round(clamp01(barValue) * 100)}%"></span>
        </span>
      </li>
    `;
  }

  function statsRankListHtml(rows, metaFn, barFn, emptyText = "—"){
    if(!rows.length){
      return `<div class="stats-rank-meta">${escapeHtml(emptyText)}</div>`;
    }

    return `
      <ol class="stats-rank-list">
        ${rows.map(row => statsRankRowHtml(row, metaFn(row), barFn(row))).join("")}
      </ol>
    `;
  }

  function statsBucketHtml(label, rows){
    const names = rows
      .slice(0,5)
      .map(row => row.name)
      .join(" · ");

    return `
      <div class="stats-bucket">
        <div class="stats-bucket-head">
          <span>${escapeHtml(label)}</span>
          <span>${rows.length}</span>
        </div>
        <div class="stats-bucket-items">
          ${escapeHtml(names || "—")}
        </div>
      </div>
    `;
  }

  function practiceModeSliderHtml(){
    const mode = getAutoPracticeMode();

    return `
      <div class="stats-mode-slider" aria-label="Mode de révision automatique">
        <button onclick="setAutoPracticeMode('easy')" data-practice-mode="easy" class="${mode === "easy" ? "active" : ""}">Facile</button>
        <button onclick="setAutoPracticeMode('balanced')" data-practice-mode="balanced" class="${mode === "balanced" ? "active" : ""}">Mixte</button>
        <button onclick="setAutoPracticeMode('hard')" data-practice-mode="hard" class="${mode === "hard" ? "active" : ""}">Difficile</button>
      </div>
    `;
  }

  function recommendedRowsForMode(rows, mode){
    const cleanMode = normalizePracticeMode(mode);

    return [...rows]
      .sort((a,b)=>{
        if(cleanMode === "easy"){
          return a.difficulty - b.difficulty || b.coverage - a.coverage;
        }

        if(cleanMode === "hard"){
          return b.difficulty - a.difficulty || a.coverage - b.coverage;
        }

        const aScore =
          Math.abs(a.difficulty - 0.5) - (1 - a.coverage) * 0.18;
        const bScore =
          Math.abs(b.difficulty - 0.5) - (1 - b.coverage) * 0.18;

        return aScore - bScore;
      })
      .slice(0,8);
  }

  window.recommendedStatsRows = function(rows){
    return recommendedRowsForMode(rows, getAutoPracticeMode());
  };

  window.renderStatsPanel = function(){
    const panelContent = document.getElementById("statsPanelContent");
    if(!panelContent) return;

    const stats = loadMtcStats();
    const rows = getAllStatsRows(stats);
    const playedRows = rows.filter(row => row.seen > 0);
    const timedRows = playedRows.filter(row => row.avgSolveMs);

    const mode = getAutoPracticeMode();

    const winRate =
      stats.gamesFinished > 0
        ? stats.wins / stats.gamesFinished
        : 0;

    const easeRows = [...timedRows]
      .sort((a,b)=>
        b.difficulty - a.difficulty ||
        b.avgSolveMs - a.avgSolveMs
      )
      .slice(0,8);

    const coverageRows = [...rows]
      .sort((a,b)=>
        a.coverage - b.coverage ||
        b.difficulty - a.difficulty
      )
      .slice(0,8);

    const completeRows = rows
      .filter(row => row.totalPoints > 0 && row.coverage >= 1)
      .sort((a,b)=>a.name.localeCompare(b.name));

    const partialRows = rows
      .filter(row => row.coverage > 0 && row.coverage < 1)
      .sort((a,b)=>a.coverage - b.coverage);

    const emptyRows = rows
      .filter(row => row.coverage <= 0)
      .sort((a,b)=>a.name.localeCompare(b.name));

    const recommended = recommendedRowsForMode(rows, mode);

    panelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">Stats</span>
      </div>

      <div class="stats-quickbar">
        <span class="stats-pill">Terminées ${stats.gamesFinished}</span>
        <span class="stats-pill">Victoires ${stats.wins}</span>
        <span class="stats-pill">Réussite ${shortPercent(winRate)}</span>
        <span class="stats-pill">Mode ${autoPracticeModeLabel(mode)}</span>
      </div>


      <div class="stats-grid">
        <div class="stats-card">
          <h3>
            Facilité
            ${statsHelp("Calculée avec le temps moyen entre le premier clic dans une catégorie et la validation des 4 points. Les lignes les plus hautes sont les plus lentes, donc les plus utiles à retravailler.")}
          </h3>
          ${statsRankListHtml(
            easeRows,
            row => `${formatDuration(row.avgSolveMs)} · ${shortPercent(1 - row.timeDifficulty)}`,
            row => row.timeDifficulty,
            "Pas encore de catégorie chronométrée."
          )}
        </div>

        <div class="stats-card">
          <h3>
            Couverture
            ${statsHelp("Nombre de points déjà vus dans les grilles, rapporté au nombre total de points de la catégorie. Les catégories les moins couvertes apparaissent d’abord.")}
          </h3>
          ${statsRankListHtml(
            coverageRows,
            row => row.totalPoints > 0
              ? `${row.seenPointsCount}/${row.totalPoints} · ${shortPercent(row.coverage)}`
              : "—",
            row => row.coverage,
            "Aucune catégorie disponible."
          )}
        </div>

        <div class="stats-card">
          <h3>
            Statut
            ${statsHelp("Complète : tous les points de la catégorie ont été vus. Partielle : seulement une partie. À commencer : aucun point vu pour l’instant.")}
          </h3>
          <div class="stats-bucket-list">
            ${statsBucketHtml("Complètes", completeRows)}
            ${statsBucketHtml("Partielles", partialRows)}
            ${statsBucketHtml("À commencer", emptyRows)}
          </div>
        </div>

        <div class="stats-card">
          <h3>
            À réviser
            ${statsHelp("Liste calculée avec le mode Auto choisi, en combinant le temps moyen de résolution et la couverture réelle des points.")}
          </h3>
          ${statsRankListHtml(
            recommended,
            row => row.totalPoints > 0
              ? `${shortPercent(row.difficulty)} · ${row.seenPointsCount}/${row.totalPoints}`
              : shortPercent(row.difficulty),
            row => row.difficulty,
            "Rien à proposer."
          )}
        </div>
      </div>
    `;

    updatePracticeModeSwitch();
  };

  updatePracticeModeSwitch();
})();
