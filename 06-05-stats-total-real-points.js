/* ============================================================
   06-05-stats-total-real-points.js
   Source: ancien bloc <script> #6 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Correctif stats : “tous les points” = totalité réelle de la catégorie === */

function mtcCategoryTotalPoints(categoryOrKey){
  const key =
    typeof categoryOrKey === "string"
      ? categoryOrKey
      : categoryOrKey?.key;

  if(!key) return [];

  if(!pool || !pool.length){
    pool = buildPool();
  }

  const canonicalKey = canonicalAssociationKey(key);

  const fromPool =
    pool.find(cat =>
      cat.key === key ||
      canonicalAssociationKey(cat.key) === canonicalKey
    );

  if(fromPool && fromPool.points){
    return [...new Set(fromPool.points.map(String))];
  }

  if(RAW_DATA?.Categories_de_points?.[canonicalKey]){
    return [...new Set(flattenPoints(RAW_DATA.Categories_de_points[canonicalKey]).map(String))];
  }

  if(RAW_DATA?.[canonicalKey]){
    return [...new Set(flattenPoints(RAW_DATA[canonicalKey]).map(String))];
  }

  return [];
}

function ensureCategoryStats(stats, key, name){
  const cleanKey = canonicalAssociationKey(key);

  if(!stats.categories[cleanKey]){
    stats.categories[cleanKey] = {
      name:name || DISPLAY_NAMES[cleanKey] || displayLabel(cleanKey),
      seen:0,
      solved:0,
      allPointsFound:0,
      foundPoints:[],
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

  return cat;
}

function recordStatsCategorySolved(group){
  if(!group || gameOver) return;

  const stats = loadMtcStats();
  const cat = ensureCategoryStats(stats, group.key, group.name);
  const now = new Date().toISOString();

  cat.solved++;
  cat.lastSolved = now;

  const alreadyComplete =
    Number(cat.allPointsFound || 0) > 0;

  cat.foundPoints = [
    ...new Set([
      ...(cat.foundPoints || []),
      ...(group.points || [])
    ].map(String))
  ];

  const totalPoints =
    mtcCategoryTotalPoints(group).length;

  const isNowComplete =
    totalPoints > 0 &&
    cat.foundPoints.length >= totalPoints;

  if(isNowComplete && !alreadyComplete){
    cat.allPointsFound = 1;
    cat.lastAllPointsFound = now;
  }

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function categoryStatsRowFromCat(stats, cat){
  const saved = ensureCategoryStats(
    stats,
    cat.key,
    cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
  );

  const totalPoints =
    mtcCategoryTotalPoints(cat).length;

  const foundPointsCount =
    Array.isArray(saved.foundPoints)
      ? saved.foundPoints.length
      : 0;

  const allPointsComplete =
    totalPoints > 0 &&
    foundPointsCount >= totalPoints;

  return {
    key:cat.key,
    name:saved.name,
    seen:saved.seen || 0,
    solved:saved.solved || 0,
    allPointsFound:allPointsComplete ? 1 : 0,
    allPointsComplete,
    foundPointsCount,
    totalPoints,
    hints:saved.hints || 0
  };
}

function categoryMasteryScore(row){
  if(!row || row.seen <= 0) return 0;

  const successRate =
    row.solved / row.seen;

  const allPointsRate =
    row.totalPoints > 0
      ? row.foundPointsCount / row.totalPoints
      : 0;

  const hintPenalty =
    Math.min(row.hints / row.seen, 2) * 0.08;

  const score =
    successRate * 0.68 +
    allPointsRate * 0.32 -
    hintPenalty;

  return Math.max(0, Math.min(1, score));
}

function statsRowHtml(row){
  const success =
    row.seen > 0
      ? row.solved / row.seen
      : 0;

  const pointsText =
    row.totalPoints > 0
      ? `points trouvés ${row.foundPointsCount}/${row.totalPoints}`
      : "points trouvés —";

  const meta =
    row.seen > 0
      ? `${row.seen} révision(s) · réussite ${row.solved}/${row.seen} (${percent(success)}) · ${pointsText} · maîtrise ${percent(row.mastery)}`
      : "Pas encore révisée.";

  return `
    <li>
      <strong>${escapeHtml(row.name)}</strong>
      <span class="stats-meta">${escapeHtml(meta)}</span>
    </li>
  `;
}

function recommendedStatsRows(rows){
  return [...rows]
    .filter(row =>
      row.seen === 0 ||
      row.mastery < 0.72 ||
      !row.allPointsComplete
    )
    .sort((a,b)=>{
      const aPriority = a.seen === 0 ? 0.35 : a.mastery;
      const bPriority = b.seen === 0 ? 0.35 : b.mastery;

      if(aPriority !== bPriority) return aPriority - bPriority;
      return b.seen - a.seen;
    })
    .slice(0,8);
}

function renderStatsPanel(){
  const panelContent = document.getElementById("statsPanelContent");
  if(!panelContent) return;

  const stats = loadMtcStats();
  const rows = getAllStatsRows(stats);
  const playedRows = rows.filter(row => row.seen > 0);
  const mode = getAutoPracticeMode();

  const mostReviewed = [...playedRows]
    .sort((a,b)=> b.seen - a.seen || b.solved - a.solved)
    .slice(0,8);

  const best = [...playedRows]
    .filter(row => row.solved > 0)
    .sort((a,b)=> b.mastery - a.mastery || b.foundPointsCount - a.foundPointsCount)
    .slice(0,8);

  const allPointsFound = [...playedRows]
    .filter(row => row.allPointsComplete)
    .sort((a,b)=> b.mastery - a.mastery || b.seen - a.seen)
    .slice(0,8);

  const recommended = recommendedStatsRows(rows);

  const winRate = stats.gamesFinished > 0
    ? stats.wins / stats.gamesFinished
    : 0;

  panelContent.innerHTML = `
    <div class="point-header">
      <span class="point-code">Statistiques</span>
    </div>

    <p class="stats-intro">
      Ces statistiques restent enregistrées sur cet appareil, même si le jeu est mis à jour, tant que l’adresse du site ne change pas et que le navigateur ne vide pas ses données.
    </p>

    <p class="stats-small">
      Parties terminées : ${stats.gamesFinished} · victoires : ${stats.wins} · réussite globale : ${percent(winRate)}
    </p>

    <div class="stats-card">
      <h3>Mode automatique</h3>
      <div class="stats-mode-buttons">
        <button onclick="setAutoPracticeMode('balanced')" class="${mode === "balanced" ? "active" : ""}">Équilibré</button>
        <button onclick="setAutoPracticeMode('weak')" class="${mode === "weak" ? "active" : ""}">À travailler</button>
        <button onclick="setAutoPracticeMode('strong')" class="${mode === "strong" ? "active" : ""}">Déjà maîtrisées</button>
      </div>
      <p class="stats-small">
        Mode actuel : ${autoPracticeModeLabel(mode)}. Ce réglage influence les prochaines grilles en mode Auto.
      </p>
      <ul class="stats-list">
        <li><strong>Équilibré</strong><span class="stats-meta">Le jeu mélange les catégories avec une priorité normale.</span></li>
        <li><strong>À travailler</strong><span class="stats-meta">Le jeu privilégie les catégories jamais vues, moins réussies, ou dont tous les points n’ont pas encore été trouvés.</span></li>
        <li><strong>Déjà maîtrisées</strong><span class="stats-meta">Le jeu privilégie les catégories déjà bien réussies pour consolider ce que tu connais.</span></li>
      </ul>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <h3>Catégories les plus révisées</h3>
        ${statsListHtml(mostReviewed, "Aucune catégorie révisée pour l’instant.")}
      </div>

      <div class="stats-card">
        <h3>Catégories les mieux réussies</h3>
        ${statsListHtml(best, "Pas encore assez de réussites pour afficher cette liste.")}
      </div>

      <div class="stats-card">
        <h3>Catégories dont tous les points ont été trouvés</h3>
        ${statsListHtml(allPointsFound, "Aucune catégorie complète pour l’instant.")}
      </div>

      <div class="stats-card">
        <h3>Catégories conseillées à réviser</h3>
        ${statsListHtml(recommended, "Rien à conseiller pour l’instant.")}
      </div>
    </div>
  `;
}
