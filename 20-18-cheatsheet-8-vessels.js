/* ============================================================
   20-18-cheatsheet-8-vessels.js
   Source: ancien bloc <script> #20 (hors JSON-LD)
   id original: -
   ============================================================ */

(function(){
  const TIMER_KEY = "__mtcCategorySolveStarts";
  const MIN_VALID_SOLVE_MS = 2500;
  const MAX_VALID_SOLVE_MS = 10 * 60 * 1000;

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

  function validSolveMs(ms){
    const value = Number(ms);
    return Number.isFinite(value) &&
      value >= MIN_VALID_SOLVE_MS &&
      value <= MAX_VALID_SOLVE_MS
        ? value
        : null;
  }

  function usableAverageSolveMs(saved){
    if(!saved) return null;
    return validSolveMs(saved.avgSolveMs) ||
      validSolveMs(saved.bestSolveMs) ||
      validSolveMs(saved.lastSolveMs) ||
      null;
  }

  function mergeUniquePoints(oldPoints, newPoints){
    return [
      ...new Set([
        ...(Array.isArray(oldPoints) ? oldPoints : []),
        ...(Array.isArray(newPoints) ? newPoints : [])
      ].map(String))
    ];
  }

  function timeDifficultyFromMs(ms){
    const value = validSolveMs(ms);

    if(value == null){
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
    if(row && row.solved > 0) return 0.48;
    if(row && row.seen > 0) return 0.82;
    return 0.68;
  }

  function formatDuration(ms){
    const value = validSolveMs(ms);

    if(value == null){
      return "—";
    }

    const totalSeconds = Math.max(1, Math.round(value / 1000));

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

  function easeLabel(ease){
    const value = clamp01(ease);
    if(value >= 0.72) return "facile";
    if(value >= 0.42) return "moyen";
    return "difficile";
  }

  function difficultyLabel(difficulty){
    const value = clamp01(difficulty);
    if(value < 0.34) return "facile";
    if(value < 0.67) return "moyen";
    return "difficile";
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

  function normalizePracticeModeForStats(mode){
    return ({
      weak:"hard",
      strong:"easy",
      balanced:"balanced",
      easy:"easy",
      hard:"hard"
    })[mode] || "balanced";
  }

  function recommendedRowsForMode(rows, mode){
    const cleanMode = normalizePracticeModeForStats(mode);

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
    const timers = window[TIMER_KEY] || {};
    const startedAt = timers[key];

    if(Number.isFinite(startedAt)){
      const rawSolveMs = Math.max(0, nowMs() - startedAt);
      const solveMs = validSolveMs(rawSolveMs);

      if(solveMs != null){
        cat.lastSolveMs = solveMs;
        cat.bestSolveMs =
          validSolveMs(cat.bestSolveMs) != null
            ? Math.min(Number(cat.bestSolveMs), solveMs)
            : solveMs;

        cat.solveTimeCount = Number(cat.solveTimeCount || 0) + 1;

        const currentAverage = validSolveMs(cat.avgSolveMs);
        cat.avgSolveMs =
          currentAverage != null
            ? currentAverage * 0.7 + solveMs * 0.3
            : solveMs;
      }else{
        cat.ignoredSolveTimeCount = Number(cat.ignoredSolveTimeCount || 0) + 1;
        cat.lastIgnoredSolveMs = rawSolveMs;
      }

      delete timers[key];
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

  window.categoryStatsRowFromCat = function(stats, cat){
    const saved = ensureCategoryStats(
      stats,
      cat.key,
      cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
    );

    const totalPoints = mtcCategoryTotalPoints(cat).length;

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

    const avgSolveMs = usableAverageSolveMs(saved);
    const timeDifficulty = timeDifficultyFromMs(avgSolveMs);

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
      avgSolveMs,
      lastSolveMs:validSolveMs(saved.lastSolveMs),
      bestSolveMs:validSolveMs(saved.bestSolveMs),
      solveTimeCount:Number(saved.solveTimeCount || 0),
      ignoredSolveTimeCount:Number(saved.ignoredSolveTimeCount || 0),
      timeDifficulty:effectiveTimeDifficulty,
      ease,
      difficulty,
      mastery:clamp01(1 - difficulty),
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

  window.recommendedStatsRows = function(rows){
    return recommendedRowsForMode(rows, getAutoPracticeMode());
  };

  window.renderStatsPanel = function(){
    const panelContent = document.getElementById("statsPanelContent");
    if(!panelContent) return;

    const stats = loadMtcStats();
    const rows = getAllStatsRows(stats);
    const playedRows = rows.filter(row => row.seen > 0);
    const timedRows = playedRows.filter(row => row.avgSolveMs != null && row.ease != null);

    const winRate =
      stats.gamesFinished > 0
        ? stats.wins / stats.gamesFinished
        : 0;

    const easeRows = [...timedRows]
      .sort((a,b)=>
        b.ease - a.ease ||
        a.avgSolveMs - b.avgSolveMs
      )
      .slice(0,12);

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

    const recommended = recommendedRowsForMode(rows, getAutoPracticeMode());

    const ignoredCount = Object.values(stats.categories || {})
      .reduce((sum,cat)=>sum + Number(cat.ignoredSolveTimeCount || 0),0);

    panelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">Stats</span>
      </div>

      <div class="stats-quickbar">
        <span class="stats-pill">Terminées ${stats.gamesFinished}</span>
        <span class="stats-pill">Victoires ${stats.wins}</span>
        <span class="stats-pill">Réussite ${shortPercent(winRate)}</span>
      </div>

      <div class="stats-grid">
        <div class="stats-card">
          <h3>
            Facilité · facile → difficile
            ${statsHelp("Trié du plus rapide au plus lent. Le temps est le temps moyen entre le premier clic dans une catégorie et sa validation. Les durées trop longues, par exemple si la partie reste ouverte puis reprise beaucoup plus tard, sont ignorées.")}
          </h3>
          ${statsRankListHtml(
            easeRows,
            row => `${formatDuration(row.avgSolveMs)} · ${easeLabel(row.ease)}`,
            row => row.ease,
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
              ? `${row.seenPointsCount}/${row.totalPoints} points vus`
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
            ${statsHelp("Liste calculée avec le mode Auto choisi, en combinant la difficulté estimée et la couverture réelle des points.")}
          </h3>
          ${statsRankListHtml(
            recommended,
            row => row.totalPoints > 0
              ? `${difficultyLabel(row.difficulty)} · ${row.seenPointsCount}/${row.totalPoints} vus`
              : difficultyLabel(row.difficulty),
            row => row.difficulty,
            "Rien à proposer."
          )}
        </div>
      </div>
    `;
    if(typeof window.initStatsHelpTooltips === "function"){
      window.initStatsHelpTooltips();
    }
    
    if(typeof updatePracticeModeSwitch === "function"){
      updatePracticeModeSwitch();
    }
  };
})();
