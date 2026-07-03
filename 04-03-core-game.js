/* ============================================================
   04-03-core-game.js
   Source: ancien bloc <script> #4 (hors JSON-LD)
   id original: -
   ============================================================ */

let CATEGORY_COLORS = [];
let pool = [];
let solution = [];
let selected = [];
let solvedCount = 0;
let categoryColors = {};
let hintCategory = null;
let hintStep = 0;
let mistakeCount = 0;
let cheatCount = 0;
let gameOver = false;
let currentPointPanelPoint = null;


const MTC_STATS_KEY = "connections_mtc_stats_v1";
const MTC_AUTO_PRACTICE_MODE_KEY = "connections_mtc_auto_practice_mode_v1";
const MTC_REVIEW_BASKET_KEY = "connections_mtc_review_basket_v1";
const MTC_COMPARISON_POINTS_KEY = "connections_mtc_comparison_points_v1";
let currentGameStatsClosed = false;

const MTC_IMPORTANT_CATEGORY_KEYS = [
  "Points_Jing_Puits",
  "Points_Ying_Jaillissement",
  "Points_Shu_Riviere",
  "Points_Jing_Fleuve",
  "Points_He_Reunion",
  "Points_Yuan_Source",
  "Points_Xi_Crevasse",
  "Points_Luo_Liaison",
  "Points_Bei_Shu_Transport_du_dos",
  "Points_Mu_Collecteur",
  "Points_fenetre_du_ciel",
  "Points_pour_faire_revenir_le_Yang"
];

function emptyMtcStats(){
  return {
    version:1,
    gamesStarted:0,
    gamesFinished:0,
    wins:0,
    losses:0,
    totalMistakes:0,
    totalHintsUsed:0,
    categories:{},
    confusions:{},
    modes:{},
    days:{},
    lastUpdated:null
  };
}

function loadMtcStats(){
  try{
    const raw = localStorage.getItem(MTC_STATS_KEY);
    if(!raw) return emptyMtcStats();

    const parsed = JSON.parse(raw);
    const stats = Object.assign(emptyMtcStats(), parsed || {});

    if(!stats.categories || typeof stats.categories !== "object"){
      stats.categories = {};
    }

    if(!stats.confusions || typeof stats.confusions !== "object"){
      stats.confusions = {};
    }

    if(!stats.modes || typeof stats.modes !== "object"){
      stats.modes = {};
    }

    if(!stats.days || typeof stats.days !== "object"){
      stats.days = {};
    }

    return stats;
  }catch(error){
    console.warn("Statistiques illisibles :", error);
    return emptyMtcStats();
  }
}

function saveMtcStats(stats){
  stats.lastUpdated = new Date().toISOString();
  localStorage.setItem(MTC_STATS_KEY, JSON.stringify(stats));
}

function todayStatsKey(){
  return new Date().toISOString().slice(0,10);
}

function ensureDayStats(stats){
  const key = todayStatsKey();

  if(!stats.days[key]){
    stats.days[key] = {
      games:0,
      wins:0,
      losses:0,
      mistakes:0,
      hints:0
    };
  }

  return stats.days[key];
}

function ensureCategoryStats(stats, key, name){
  const cleanKey = canonicalAssociationKey(key);

  if(!stats.categories[cleanKey]){
    stats.categories[cleanKey] = {
      name:name || DISPLAY_NAMES[cleanKey] || displayLabel(cleanKey),
      seen:0,
      solved:0,
      allPointsFound:0,
      hints:0,
      errors:0,
      lastSeen:null,
      lastSolved:null,
      lastAllPointsFound:null
    };
  }

  if(name){
    stats.categories[cleanKey].name = name;
  }

  if(typeof stats.categories[cleanKey].errors !== "number"){
    stats.categories[cleanKey].errors = 0;
  }

  return stats.categories[cleanKey];
}

function recordStatsGameStarted(groups){
  const stats = loadMtcStats();
  const now = new Date().toISOString();

  stats.gamesStarted++;
  ensureMtcModeStats(stats).started++;
  currentGameStatsClosed = false;

  const day = ensureDayStats(stats);
  day.games++;

  groups.forEach(group=>{
    const cat = ensureCategoryStats(stats, group.key, group.name);
    cat.seen++;
    cat.lastSeen = now;
  });

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function recordStatsCategorySolved(group){
  if(!group || gameOver) return;

  const stats = loadMtcStats();
  const cat = ensureCategoryStats(stats, group.key, group.name);
  const now = new Date().toISOString();

  cat.solved++;
  cat.lastSolved = now;

  if(group._solvedBy === "points"){
    cat.allPointsFound++;
    cat.lastAllPointsFound = now;
  }

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function recordStatsCategoryHint(group){
  if(!group) return;

  const stats = loadMtcStats();
  const cat = ensureCategoryStats(stats, group.key, group.name);

  cat.hints++;

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function recordStatsGameFinished(won){
  if(currentGameStatsClosed) return;

  const stats = loadMtcStats();
  const day = ensureDayStats(stats);

  stats.gamesFinished++;
  stats.totalMistakes += mistakeCount;
  stats.totalHintsUsed += cheatCount;

  day.mistakes += mistakeCount;
  day.hints += cheatCount;

  const modeStats = ensureMtcModeStats(stats);
  modeStats.finished++;

  if(won){
    stats.wins++;
    day.wins++;
    modeStats.wins++;
  }else{
    stats.losses++;
    day.losses++;
    modeStats.losses++;
  }

  currentGameStatsClosed = true;

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function getAutoPracticeMode(){
  return localStorage.getItem(MTC_AUTO_PRACTICE_MODE_KEY) || "balanced";
}

function autoPracticeModeLabel(mode){
  return {
    balanced:"Équilibré",
    weak:"À travailler",
    strong:"Déjà maîtrisées"
  }[mode] || "Équilibré";
}

function setAutoPracticeMode(mode){
  if(!["balanced","weak","strong"].includes(mode)){
    mode = "balanced";
  }

  localStorage.setItem(MTC_AUTO_PRACTICE_MODE_KEY, mode);
  renderStatsPanel();
}

function categoryStatsRowFromCat(stats, cat){
  const saved = ensureCategoryStats(
    stats,
    cat.key,
    cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
  );

  return {
    key:cat.key,
    name:saved.name,
    seen:saved.seen || 0,
    solved:saved.solved || 0,
    allPointsFound:saved.allPointsFound || 0,
    hints:saved.hints || 0,
    errors:saved.errors || 0
  };
}

function categoryMasteryScore(row){
  if(!row || row.seen <= 0) return 0;

  const successRate = row.solved / row.seen;
  const allPointsRate = row.allPointsFound / row.seen;
  const hintPenalty = Math.min(row.hints / row.seen, 2) * 0.08;
  const errorPenalty = Math.min((row.errors || 0) / row.seen, 2) * 0.16;

  const score =
    successRate * 0.68 +
    allPointsRate * 0.32 -
    hintPenalty -
    errorPenalty;

  return Math.max(0, Math.min(1, score));
}

function categoryPracticeWeight(cat){
  const mode = getAutoPracticeMode();
  const stats = loadMtcStats();
  const row = categoryStatsRowFromCat(stats, cat);
  const mastery = categoryMasteryScore(row);

  let weight = MTC_IMPORTANT_CATEGORY_KEYS.includes(canonicalAssociationKey(cat.key))
    ? 2
    : 1;

  if(mode === "weak"){
    if(row.seen === 0){
      weight += 5;
    }else{
      weight += Math.round((1 - mastery) * 8);
    }
  }

  if(mode === "strong"){
    if(row.seen === 0){
      weight += 1;
    }else{
      weight += Math.round(mastery * 8);
    }
  }

  return Math.max(1, Math.min(12, weight));
}

function weightedShuffleCategories(categories){
  const bag = [];

  categories.forEach(cat=>{
    const weight = categoryPracticeWeight(cat);

    for(let i=0; i<weight; i++){
      bag.push(cat);
    }
  });

  return shuffle(bag.length ? bag : categories);
}

function weightedShuffleAssociationSets(sets){
  const bag = [];

  sets.forEach(set=>{
    const weight = Math.max(
      1,
      Math.round(
        set.reduce((sum,cat)=>sum + categoryPracticeWeight(cat),0) /
        Math.max(set.length,1)
      )
    );

    for(let i=0; i<weight; i++){
      bag.push(set);
    }
  });

  return shuffle(bag.length ? bag : sets);
}

function getAllStatsRows(stats){
  if(!pool || !pool.length){
    

/* === Correctifs finaux : recherche, panier, comparaison, +, infobulles, panneau sans respiration === */
function comparisonSlotLabel(slotIndex){
  return Number(slotIndex) === 1 ? "B" : "A";
}

function pointMatchesCorrespondenceCanal(point, correspondences){
  const selected = Array.isArray(correspondences)
    ? correspondences.filter(Boolean)
    : (correspondences ? [correspondences] : []);

  if(!selected.length) return true;

  if(!selected.includes(MTC_CORRESPONDENCE_FILTER_ANY)){
    return true;
  }

  const selectedCanals = selected.filter(value => value !== MTC_CORRESPONDENCE_FILTER_ANY);

  if(!pointHasCorrespondence(point)){
    return false;
  }

  if(!selectedCanals.length){
    return true;
  }

  return selectedCanals.some(canal =>
    pointMatchesSingleCorrespondenceCanal(point, canal)
  );
}

function correspondenceChecklistHtml(selected = []){
  const values = Array.isArray(selected) ? selected : [];

  return MTC_SEARCH_CANAL_ORDER
    .map(canal => `
      <label>
        <input
          type="checkbox"
          name="advancedSearchCorrespondence"
          value="${escapeAttribute(canal)}"
          ${correspondenceChecked(values, canal)}
          onchange="renderAdvancedSearchResults()"
        >
        ${escapeHtml(CANAL_LABELS[canal] || canal)}
      </label>
    `)
    .join("");
}

function renderAdvancedSearchPanel(){
  const content = document.getElementById("advancedSearchPanelContent");
  if(!content) return;

  const currentFilters = getAdvancedSearchFilters();
  const showCorrespondenceChecklist =
    currentFilters.correspondences.includes(MTC_CORRESPONDENCE_FILTER_ANY);

  const resultsAll = advancedSearchResults();
  const results = resultsAll.slice(0,80);
  const total = resultsAll.length;

  content.innerHTML = `
    <div class="point-header">
      <span class="point-code">Recherche avancée</span>
    </div>

    <p class="stats-intro">
      Recherche un point par mot-clé, catégorie, canal du point ou correspondance. Tu peux limiter le mot-clé au nom, aux fonctions, aux indications ou aux notes.
    </p>

    <div class="search-controls">
      <label class="search-control">
        <span>Mot-clé</span>
        <input
          id="advancedSearchKeywords"
          type="search"
          value="${escapeAttribute(currentFilters.keywords)}"
          placeholder="ex. insomnie, reanimation, Estomac, Rt4..."
          oninput="renderAdvancedSearchResults()"
        >
      </label>

      <div class="search-scope-options" aria-label="Champs de recherche">
        <span>Rechercher dans :</span>
        <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
        <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
        <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
        <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
        <label><input type="checkbox" name="advancedSearchScope" value="precautions" ${searchScopeChecked(currentFilters.scopes,"precautions")} onchange="renderAdvancedSearchResults()"> précautions</label>
        <label><input type="checkbox" name="advancedSearchScope" value="formules" ${searchScopeChecked(currentFilters.scopes,"formules")} onchange="renderAdvancedSearchResults()"> formules</label>
      </div>

      <label class="search-control">
        <span>Catégorie de points</span>
        <select id="advancedSearchCategory" onchange="renderAdvancedSearchResults()">
          <option value="">Toutes les catégories</option>
          ${categoryOptionsHtml()}
        </select>
      </label>

      <label class="search-control">
        <span>Canal du point</span>
        <select id="advancedSearchCanal" onchange="renderAdvancedSearchResults()">
          <option value="">Tous les canaux</option>
          ${canalOptionsHtml()}
        </select>
      </label>

      <div class="search-control search-correspondence-control">
        <span>Points d'intersection</span>
        <label class="search-correspondence-any">
          <input
            type="checkbox"
            name="advancedSearchCorrespondence"
            value="${MTC_CORRESPONDENCE_FILTER_ANY}"
            ${correspondenceChecked(currentFilters.correspondences, MTC_CORRESPONDENCE_FILTER_ANY)}
            onchange="renderAdvancedSearchPanel()"
          >
          <span class="search-correspondence-any-text">Points ayant une intersection</span>
        </label>
        ${showCorrespondenceChecklist
          ? `<div class="correspondence-checklist" aria-label="Points d'intersection">${correspondenceChecklistHtml(currentFilters.correspondences)}</div>`
          : ""
        }
      </div>
    </div>

    <div class="search-actions">
      <button type="button" onclick="resetAdvancedSearchFilters()">Réinitialiser les filtres</button>
    </div>

    <h3 class="search-section-title">Résultats</h3>
    <div id="advancedSearchResults"></div>
  `;

  document.getElementById("advancedSearchCategory").value = currentFilters.category;
  document.getElementById("advancedSearchCanal").value = currentFilters.canal;

  renderAdvancedSearchResultsWith(results, total);
}

function resetAdvancedSearchFilters(){
  ["advancedSearchKeywords","advancedSearchCategory","advancedSearchCanal"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });

  document
    .querySelectorAll("input[name='advancedSearchScope']")
    .forEach(input=>{ input.checked = true; });

  document
    .querySelectorAll("input[name='advancedSearchCorrespondence']")
    .forEach(input=>{ input.checked = false; });

  renderAdvancedSearchPanel();
}

function basketListHtml(){
  const basket = getReviewBasket();

  if(!basket.length){
    return `<p class="stats-small">Ton panier est vide. Ajoute des points depuis la recherche, le Cheatsheet, une fiche point ou une catégorie validée.</p>`;
  }

  return `
    <p class="stats-small">Clique sur un point pour ouvrir sa fiche. Choisis A et B pour comparer deux points.</p>
    <ul class="basket-list">
      ${basket.map(point => `
        <li class="basket-list-item" title="${escapeAttribute(searchPointTitle(point))}">
          <div class="compact-point-row" onclick="openPointPanelDirect('${escapeAttribute(point)}')" role="button" tabindex="0" onkeydown="openBasketLineWithKeyboard(event,'${escapeAttribute(point)}')">
            <span class="compact-point-code">${compactPointLabel(point)}</span>
            <span class="compact-point-tools basket-item-buttons" onclick="event.stopPropagation()">
              <button type="button" class="comparison-slot-button" onclick="setComparisonPoint('${escapeAttribute(point)}',0)" title="Comparer en A">A</button>
              <button type="button" class="comparison-slot-button" onclick="setComparisonPoint('${escapeAttribute(point)}',1)" title="Comparer en B">B</button>
              <button type="button" onclick="removePointFromReviewBasket('${escapeAttribute(point)}')" title="Retirer du panier">×</button>
            </span>
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderReviewBasketPanel(){
  const content = document.getElementById("reviewBasketPanelContent");
  if(!content) return;

  content.innerHTML = `
    <div class="point-header">
      <span class="point-code">Panier de révision</span>
    </div>

    <p class="stats-intro">
      Mets ici les points que tu veux revoir plus tard. Le panier reste enregistré dans ce navigateur, même après une mise à jour du jeu.
    </p>

    <div class="search-actions">
      <button type="button" onclick="clearReviewBasket()">Vider le panier</button>
      <button type="button" onclick="openAdvancedSearchFromBasket()">Ouvrir la recherche</button>
    </div>

    <div id="reviewBasketContent">${basketListHtml()}</div>
  `;

  updateBasketButtons();

  if(getReviewBasket().length){
    showProgressHintSoon(
      "basket_comparison_buttons_ab",
      ".comparison-slot-button",
      "Comparer deux points",
      "Choisis A pour le premier point et B pour le deuxième. Le panneau Comparaison s’affiche seulement quand les deux sont choisis.",
      {position:"aboveBottom"},
      520
    );
  }
}

function pointHeaderBasketButtonHtml(point){
  return basketButtonHtml(point, "point-header-basket-button", true);
}

function pointBasketActionHtml(point){
  return `
    <div class="point-panel-actions">
      ${basketButtonHtml(point, "point-basket-button", true)}
    </div>
  `;
}

function categoryExplanationTextForTooltip(key){
  const items = getCategoryExplanationItems(key);
  if(!items || !items.length) return "";

  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

const CATEGORY_INFO_MATCHERS = [
  {key:"Points_Jing_Puits", terms:["jing puits"]},
  {key:"Points_Ying_Jaillissement", terms:["ying jaillissement"]},
  {key:"Points_Shu_Riviere", terms:["shu riviere", "shu riviere"]},
  {key:"Points_Jing_Fleuve", terms:["jing fleuve"]},
  {key:"Points_He_Reunion", terms:["he reunion", "he reunions"]},
  {key:"Points_Yuan_Source", terms:["yuan source", "source"]},
  {key:"Points_Xi_Crevasse", terms:["xi crevasse", "crevasse"]},
  {key:"Points_Luo_Liaison", terms:["luo liaison", "liaison"]},
  {key:"Points_Bei_Shu_Transport_du_dos", terms:["bei shu", "transport du dos"]},
  {key:"Points_Mu_Collecteur", terms:["mu collecteur", "collecteur"]},
  {key:"Points_Xia_He_Reunion", terms:["xia he", "reunion inferieure"]},
  {key:"Points_d_ouverture_des_merveilleux_vaisseaux", terms:["ouverture", "merveilleux vaisseaux", "chong mai", "ren mai", "du mai", "yin qiao", "yang qiao", "yin wei", "yang wei"]},
  {key:"Points_Hui_Reunion", terms:["hui reunion"]},
  {key:"Points_generaux", terms:["points generaux", "point general", "gao wu"]},
  {key:"Les_4_mers", terms:["4 mers", "quatre mers", "mer du qi", "mer du sang", "mer de l eau", "mer des canaux"]},
  {key:"Points_fenetre_du_ciel", terms:["fenetre du ciel"]},
  {key:"Points_pour_faire_revenir_le_Yang", terms:["revenir le yang"]},
  {key:"Points_fantomes_de_Sun_Si_Miao", terms:["fantome", "sun si miao"]}
];

function normalizeCategoryInfoLine(line){
  return normalizeSearchText(line)
    .replace(/[’']/g," ")
    .replace(/[^a-z0-9]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function categoryInfoKeysForText(line){
  const clean = normalizeCategoryInfoLine(line);
  if(!clean) return [];

  return CATEGORY_INFO_MATCHERS
    .filter(item =>
      CATEGORY_EXPLANATIONS[item.key] &&
      item.terms.some(term => clean.includes(normalizeCategoryInfoLine(term)))
    )
    .map(item => item.key);
}

function categoryInlineInfoButtons(line){
  const keys = categoryInfoKeysForText(line);
  if(!keys.length) return "";

  return keys.map(key => `
    <span class="category-inline-info-wrap">
      <button type="button" class="category-inline-info" aria-label="Fonctions de ${escapeAttribute(DISPLAY_NAMES[key] || displayLabel(key))}">i</button>
      <span class="category-inline-info-tooltip">
        <strong>${escapeHtml(DISPLAY_NAMES[key] || displayLabel(key))}</strong>
        ${categoryExplanationTextForTooltip(key)}
      </span>
    </span>
  `).join("");
}

function formatPointSectionValue(title, value){
  if(title !== "Catégories du point"){
    return value;
  }

  return String(value || "")
    .split(/\n/)
    .map(line => `${escapeHtml(line)}${categoryInlineInfoButtons(line)}`)
    .join("\n");
}

function renderPointInfoSections(sections, point){
  return sections
    .filter(([title,value]) =>
      title === "Notes" ||
      (
        value &&
        value !== "(Aucune)" &&
        value !== "Aucune"
      )
    )
    .map(([title,value]) => {
      if(title === "Notes"){
        const noteValue = getEditablePointNote(point, value);

        return `
          <details class="point-info-section point-note-section" open>
            <summary class="point-note-summary">
              <span>${title}</span>
              <button
                type="button"
                class="point-note-edit-button"
                onclick="togglePointNoteEdit(this)"
                title="Modifier les notes"
                aria-label="Modifier les notes"
              >✎</button>
            </summary>

            <div class="point-note-display">
              ${formatNoteTextForDisplay(noteValue)}
            </div>

            <textarea
              class="point-note-textarea"
              data-point="${escapeAttribute(point)}"
              oninput="savePointNoteFromTextarea(this)"
              style="display:none;"
              placeholder="Ajoute tes remarques personnelles sur ce point..."
            >${escapeHtml(noteValue)}</textarea>

            <div class="point-note-hint">
              Clique sur le crayon pour écrire. Tes notes restent dans ce navigateur. Tu peux toujours les exporter pour les sauvegarder, puis importer pour les récupérer sur un autre appareil ou navigateur.
            </div>
          </details>
        `;
      }

      return `
        <details class="point-info-section">
          <summary>${title}</summary>
          <div>${formatPointSectionValue(title, value)}</div>
        </details>
      `;
    })
    .join("");
}

function renderPointPanelContent(point, details){
  const pinyin = details.pinyin || "";
  const hanzi = details.hanzi || "";
  const nomFrancais = details.nom_francais || details.nom_complet || "";

  const sections = [
    ["Localisation", details.localisation],
    ["Méthode de localisation", details.methode_localisation],
    ["Méthode de travail", details.methode_travail],
    ["Catégories du point", details.categories_du_point],
    ["Correspondances", details.correspondances],
    ["Actions", details.actions],
    ["Indications", details.indications],
    ["Associations", details.associations],
    ["Notes", details.notes]
  ];

  return `
    <div class="point-header">
      <span class="point-code">${formatPointCode(point)}</span>
      ${pinyin ? `<span class="point-separator">·</span><span class="point-pinyin-inline">${colorizePinyin(pinyin)}</span>` : ""}
      ${hanzi ? `<span class="point-separator">·</span><span class="point-hanzi-inline">${hanzi}</span>` : ""}
      ${nomFrancais ? `<span class="point-separator">·</span><span class="point-fr-inline">${nomFrancais}</span>` : ""}
      ${pointHeaderBasketButtonHtml(point)}
    </div>

    ${renderPointInfoSections(sections, point)}
  `;
}

function openPointPanel(point){
  currentPointPanelPoint = point;

  const isSolvedPoint = solution.some(group =>
    group.solved && group.points.includes(point)
  );

  if(!isSolvedPoint){
    return;
  }

  const details = POINT_DETAILS[point];

  if(!details){
    pointPanelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">${formatPointCode(point)}</span>
        ${pointHeaderBasketButtonHtml(point)}
      </div>
      <p>Aucune fiche trouvée pour ce point.</p>
    `;
  }else{
    pointPanelContent.innerHTML = renderPointPanelContent(point, details);
  }

  pointPanel.classList.add("available");
  pointPanel.classList.add("open");
  panelToggle.innerHTML = "&gt;";
  document.body.classList.add("panel-open");

  showProgressHintSoon(
    "point_basket_button_top",
    ".point-header-basket-button",
    "Panier de révision",
    "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier.",
    {},
    360
  );

  showProgressHintSoon(
    "category_info_hover",
    ".category-inline-info",
    "Fonctions des catégories",
    "Quand un i apparaît à côté d’une catégorie, survole-le pour voir ses fonctions.",
    {},
    620
  );

  showProgressHintSoon(
    "point_notes",
    ".point-note-edit-button",
    "Notes perso",
    "En cliquant sur le crayon, tu peux ajouter tes remarques sur ce point. Elles restent dans ton navigateur.",
    {},
    960
  );
}

function openPointPanelDirect(point){
  currentPointPanelPoint = point;
  const details = POINT_DETAILS[point];

  if(!details){
    pointPanelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">${formatPointCode(point)}</span>
        ${pointHeaderBasketButtonHtml(point)}
      </div>
      <p>Aucune fiche trouvée pour ce point.</p>
    `;
  }else{
    pointPanelContent.innerHTML = renderPointPanelContent(point, details);
  }

  pointPanel.classList.add("available");
  pointPanel.classList.add("open");
  panelToggle.innerHTML = "&gt;";
  document.body.classList.add("panel-open");

  showProgressHintSoon(
    "point_basket_button_top",
    ".point-header-basket-button",
    "Panier de révision",
    "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier.",
    {},
    360
  );

  showProgressHintSoon(
    "category_info_hover",
    ".category-inline-info",
    "Fonctions des catégories",
    "Quand un i apparaît à côté d’une catégorie, survole-le pour voir ses fonctions.",
    {},
    620
  );
}

function renderCheatsheetPanel(){
  function flattenLocal(value){
    if(!value) return [];
    if(Array.isArray(value)) return value.flatMap(flattenLocal);
    if(typeof value === "object") return Object.values(value).flatMap(flattenLocal);
    return [String(value)];
  }

  function pointFullName(point){
  const code = String(point).trim();
  const d = POINT_DETAILS[code] || {};

  return `
    ${basketButtonHtml(code, "cheatsheet-basket-button", true)}

    <button
      type="button"
      class="cheatsheet-point-link"
      onclick="openPointPanelDirect('${escapeAttribute(code)}')"
    >
      ${formatPointCode(code)}
    </button>
    ${d.pinyin || ""}
    ${d.hanzi || ""}
    ${d.nom_francais || d.nom_complet || ""}
  `;
}

  function line(labelText, value){
    const points = flattenLocal(value);
    if(points.length === 0) return "";

    return `
      <div class="cheatsheet-line">
        <strong>${labelText}</strong> : ${points.map(pointFullName).join(", ")}
      </div>
    `;
  }

  function simplePointLines(value){
    return flattenLocal(value).map(point => `
      <div class="cheatsheet-line">
        ${pointFullName(point)}
      </div>
    `);
  }

  function section(title, rows){
    const cleanRows = rows.filter(Boolean);
    if(cleanRows.length === 0) return "";

    return `
      <details class="cheatsheet-section">
        <summary>${title}</summary>
        <div>${cleanRows.join("")}</div>
      </details>
    `;
  }

  function label(key){
    return LABEL_NAMES[key] || displayLabel(key);
  }

  const canalOrder = [
    "IG","V","TF","VB","GI","E",
    "P","Rt","C","Rn","EC","F",
    "RM","DM"
  ];

  let html = `
    <div class="point-header">
      <span class="point-code">Cheatsheet</span>
    </div>
  `;

  Object.entries(RAW_DATA.Categories_de_points || {}).forEach(([key,value])=>{
    const title = DISPLAY_NAMES[key] || key;
    const canonical = canonicalAssociationKey(key);

    if([
      "Points_Jing_Puits",
      "Points_Ying_Jaillissement",
      "Points_Shu_Riviere",
      "Points_Jing_Fleuve",
      "Points_He_Reunion",
      "Points_Yuan_Source",
      "Points_Xi_Crevasse",
      "Points_Luo_Liaison"
    ].includes(canonical)){
      html += section(
        title,
        canalOrder.map(canal =>
          line(
            labelForCanalOrVessel(canal),
            flattenLocal(value).filter(p => canalOfPoint(p) === canal)
          )
        )
      );
    }else{
      html += section(title, simplePointLines(value));
    }
  });

  [
    "Points_d_ouverture_des_merveilleux_vaisseaux",
    "Points_Hui_Reunion",
    "Points_generaux",
    "Les_4_mers"
  ].forEach(sectionKey=>{
    const data = RAW_DATA[sectionKey];
    if(!data) return;

    html += section(
      DISPLAY_NAMES[sectionKey] || sectionKey,
      Object.entries(data).map(([labelKey,points]) =>
        line(label(labelKey), points)
      )
    );
  });

  [
    "Points_fenetre_du_ciel",
    "Points_pour_faire_revenir_le_Yang",
    "Points_fantomes_de_Sun_Si_Miao"
  ].forEach(sectionKey=>{
    const data = RAW_DATA[sectionKey];
    if(!data) return;
    html += section(DISPLAY_NAMES[sectionKey] || sectionKey, simplePointLines(data));
  });

  if(typeof POINT_DETAILS !== "undefined"){
    function isRegularChannelPointCode(code){
      return /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\d+$/.test(String(code));
    }

    function extraordinarySortLabel(point){
      const d = POINT_DETAILS[point] || {};
      return String(d.pinyin || d.nom_francais || d.nom_complet || point)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .toLowerCase();
    }

    const extraordinaryPoints = Object.keys(POINT_DETAILS)
      .filter(point => !isRegularChannelPointCode(point))
      .sort((a,b)=> extraordinarySortLabel(a).localeCompare(extraordinarySortLabel(b), "fr"));

    html += section("Points extraordinaires", simplePointLines(extraordinaryPoints));
  }

  cheatsheetPanelContent.innerHTML = html;
  updateBasketButtons();
}

function openCheatsheetPanel(){
  try{
    renderCheatsheetPanel();

    const shouldOpenDemoCategory =
      document.getElementById("tourBox") ||
      localStorage.getItem(progressHintKey("cheatsheet_points")) !== "1";

    if(shouldOpenDemoCategory){
      openCheatsheetDemoCategory();
    }

    cheatsheetPanel.classList.add("available");
    cheatsheetPanel.classList.add("open");
    cheatsheetToggle.innerHTML = "&lt;";

    showProgressHintSoon(
      "cheatsheet_points",
      ".cheatsheet-point-link",
      "Cheatsheet",
      "Cette catégorie est ouverte pour l’exemple. En cliquant sur un code de point, tu ouvres sa fiche détaillée.",
      {},
      360
    );

    showProgressHintSoon(
      "cheatsheet_basket_plus",
      ".cheatsheet-basket-button",
      "Panier de révision",
      "Le + à côté d’un code permet de mettre ce point de côté sans ouvrir sa fiche.",
      {},
      760
    );
  }catch(error){
    console.error("Erreur cheatsheet :", error);
    message.textContent = "Erreur dans le cheatsheet. Regarde la console.";
  }
}

function solveGroup(group){
  group.solved = true;
  solvedCount++;

  recordStatsCategorySolved(group);

  const row = document.createElement("div");
  row.className = "solved-row";
  row.dataset.categoryKey = group.key;

  row.innerHTML = `
    <div class="solved-title">
      <span>${group.name}</span>

      ${
        gameOver
          ? `
            <button
              class="category-info-button"
              onclick="toggleCategoryExplanation(this)"
              title="Explication"
            >
              💡
            </button>
          `
          : ""
      }
    </div>

    <div class="category-explanation" style="display:none;">
      ${CATEGORY_EXPLANATIONS[group.key] || "Explication à compléter pour cette catégorie."}
    </div>

    <div class="solved-points">
      ${group.points.map(p=>`
        <div class="solved-point" data-point="${escapeAttribute(p)}">
          ${formatPointCode(p)}
          ${basketButtonHtml(p, "solved-point-basket-button", true)}
        </div>
      `).join("")}
    </div>
  `;

  solved.appendChild(row);

  row.querySelectorAll(".solved-point").forEach(el=>{
    el.onclick = event => {
      if(event.target.closest("[data-basket-point]")) return;
      openPointPanel(el.dataset.point);
    };
  });

  document.querySelectorAll(".tile").forEach(tile=>{
    if(group.points.includes(tile.dataset.point)){
      tile.remove();
    }
  });

  selected = [];
  message.textContent = mtcGoodChoiceMessage("Catégorie trouvée !");
  hint.textContent = "";

  if(hintCategory && hintCategory.key === group.key){
    hintCategory = null;
    hintStep = 0;
  }

  prepareFinalGuess();

  if(!localStorage.getItem("mtc_point_panel_hint_seen")){
    showPanelHint();
    localStorage.setItem("mtc_point_panel_hint_seen","1");
  }

  showProgressHintSoon(
    "first_category",
    "#solved .solved-row:last-child",
    "Catégorie trouvée",
    "Bien joué. En cliquant sur un point rangé ici, tu ouvres sa fiche détaillée."
  );

  showProgressHintSoon(
    "solved_point_basket",
    "#solved .solved-row:last-child .solved-point-basket-button",
    "Panier de révision",
    "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier de révision.",
    {},
    920
  );

  if(solvedCount === 4 && !gameOver){
    recordStatsGameFinished(true);
    gameOver = true;
    document.body.classList.add("game-complete");
    showEndReviewScreen("win");
  }
}

function showCategoryInfoButtons(){
  document.querySelectorAll(".solved-row").forEach(row=>{
    if(row.querySelector(".category-info-button")) return;

    const title = row.querySelector(".solved-title");
    if(!title) return;

    title.insertAdjacentHTML(
      "beforeend",
      `
        <button
          class="category-info-button"
          onclick="toggleCategoryExplanation(this)"
          title="Explication"
        >💡</button>
      `
    );
  });
}

function closePointPanel(){
  const panel = document.getElementById("pointPanel");
  const toggle = document.getElementById("panelToggle");
  if(!panel) return;

  panel.classList.remove("open");
  panel.classList.remove("available");
  panel.classList.remove("point-panel-peek");

  if(toggle){
    toggle.innerHTML = "&lt;";
  }

  document.body.classList.remove("panel-open");
}

function showPanelHint(){
  return;
}

function openAdvancedSearchPanel(){
  const panel = document.getElementById("advancedSearchPanel");
  if(!panel) return;

  closeAllBottomPanels("advancedSearchPanel");
  renderAdvancedSearchPanel();
  panel.classList.add("open");

  showProgressHintSoon(
    "advanced_search_panel",
    "#advancedSearchKeywords",
    "Recherche avancée",
    "Tu peux rechercher un point par mot-clé, nomenclauture, catégorie, etc. tu peux aussi filtrer par catégoriede points, ou intersections avec différents canaux.",
    {position:"aboveBottom"},
    320
  );

  showProgressHintSoon(
    "advanced_search_correspondence_any",
    ".search-correspondence-any",
    "Correspondance",
    "Active d’abord “Points ayant une correspondance”. Ensuite, tu peux choisir les canaux de correspondance dans la checklist.",
    {position:"aboveBottom"},
    880
  );
}

pool = buildPool();
  }

  const rows = pool.map(cat => categoryStatsRowFromCat(stats, cat));

  Object.entries(stats.categories || {}).forEach(([key,value])=>{
    if(rows.some(row => row.key === key)) return;

    rows.push({
      key,
      name:value.name || DISPLAY_NAMES[key] || displayLabel(key),
      seen:value.seen || 0,
      solved:value.solved || 0,
      allPointsFound:value.allPointsFound || 0,
      hints:value.hints || 0,
      errors:value.errors || 0
    });
  });

  return rows.map(row => ({
    ...row,
    mastery:categoryMasteryScore(row)
  }));
}

function percent(value){
  if(!isFinite(value)) return "0 %";
  return Math.round(value * 100) + " %";
}

function statsRowHtml(row){
  const success = row.seen > 0
    ? row.solved / row.seen
    : 0;

  const meta = row.seen > 0
    ? `${row.seen} révision(s) · réussite ${row.solved}/${row.seen} (${percent(success)}) · erreurs ${row.errors || 0} · tous les points ${row.allPointsFound}× · maîtrise ${percent(row.mastery)}`
    : "Pas encore révisée.";

  return `
    <li>
      <strong>${escapeHtml(row.name)}</strong>
      <span class="stats-meta">${escapeHtml(meta)}</span>
    </li>
  `;
}

function statsListHtml(rows, emptyText){
  if(!rows.length){
    return `<p class="stats-small">${escapeHtml(emptyText)}</p>`;
  }

  return `<ol class="stats-list">${rows.map(statsRowHtml).join("")}</ol>`;
}

function recommendedStatsRows(rows){
  return [...rows]
    .filter(row => row.seen === 0 || row.mastery < 0.72 || row.allPointsFound === 0)
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
  const gameplayMode = getMtcGameplayMode();

  const mostReviewed = [...playedRows]
    .sort((a,b)=> b.seen - a.seen || b.solved - a.solved)
    .slice(0,8);

  const best = [...playedRows]
    .filter(row => row.solved > 0)
    .sort((a,b)=> b.mastery - a.mastery || b.allPointsFound - a.allPointsFound)
    .slice(0,8);

  const allPointsFound = [...playedRows]
    .filter(row => row.allPointsFound > 0)
    .sort((a,b)=> b.allPointsFound - a.allPointsFound || b.mastery - a.mastery)
    .slice(0,8);

  const recommended = recommendedStatsRows(rows);
  const fragile = [...playedRows]
    .filter(row => (row.errors || 0) > 0 || row.mastery < 0.65)
    .sort((a,b)=> (b.errors || 0) - (a.errors || 0) || a.mastery - b.mastery)
    .slice(0,8);

  const confusions = Object.values(stats.confusions || {})
    .sort((a,b)=>(b.count || 0) - (a.count || 0))
    .slice(0,8);

  const modeStats = stats.modes || {};
  const winRate = stats.gamesFinished > 0
    ? stats.wins / stats.gamesFinished
    : 0;
  const hasBasicStats = stats.gamesFinished >= 10;
  const hasConfusionStats = stats.gamesFinished >= 30;
  const hasDeepStats = stats.gamesFinished >= 50;

  const modeStatLine = Object.entries(modeStats).map(([key,value]) => {
    const finished = value.finished || 0;
    if(!finished) return "";
    const rate = finished ? (value.wins || 0) / finished : 0;
    return `${mtcGameplayModeLabel(key)} : ${finished} partie(s), réussite ${percent(rate)}`;
  }).filter(Boolean).join(" · ");

  const confusionHtml = statsListHtml(confusions.map(row => {
    const cats = (row.categories || []).map(mtcCategoryName).filter(Boolean).join(" ↔ ");
    return {name:cats || row.key, seen:row.count || 0, solved:0, allPointsFound:0, hints:0, errors:row.count || 0, mastery:0};
  }), "Aucune confusion enregistrée pour l’instant.");

  panelContent.innerHTML = `
    <div class="point-header">
      <span class="point-code">Stats ACU</span>
    </div>

    <p class="stats-intro">
      Ces statistiques restent enregistrées sur cet appareil, même si le jeu est mis à jour, tant que l’adresse du site ne change pas et que le navigateur ne vide pas ses données.
    </p>

    <div class="pharma-stats-summary acu-stats-summary">
      <div><strong>${stats.gamesFinished}</strong><span>parties terminées</span></div>
      <div><strong>${stats.wins || 0}</strong><span>victoires</span></div>
      <div><strong>${percent(winRate)}</strong><span>réussite</span></div>
      <div><strong>${playedRows.length}</strong><span>catégories vues</span></div>
      <div><strong>${stats.totalMistakes || 0}</strong><span>erreurs</span></div>
      <div><strong>${stats.totalHintsUsed || 0}</strong><span>astuces</span></div>
    </div>

    <div class="stats-card experimental-settings-card">
      <h3>Modes de jeu</h3>
      <p class="stats-small">Mode actuel : ${mtcGameplayModeLabel(gameplayMode)}. Le choix se fait avec le switch 🕊️ / 🦖 dans la ligne vies / astuces.</p>
      ${modeStatLine ? `<p class="stats-small">Stats séparées par mode : ${escapeHtml(modeStatLine)}</p>` : ""}
    </div>

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
    </div>

    ${hasBasicStats ? `
      <div class="stats-grid">
        <div class="stats-card"><h3>Catégories les plus révisées</h3>${statsListHtml(mostReviewed, "Aucune catégorie révisée pour l’instant.")}</div>
        <div class="stats-card"><h3>Catégories les mieux réussies</h3>${statsListHtml(best, "Pas encore assez de réussites pour afficher cette liste.")}</div>
        <div class="stats-card"><h3>Tous les points trouvés</h3>${statsListHtml(allPointsFound, "Aucune catégorie trouvée entièrement pour l’instant.")}</div>
        <div class="stats-card"><h3>Catégories conseillées</h3>${statsListHtml(recommended, "Rien à conseiller pour l’instant.")}</div>
      </div>
    ` : `
      <div class="stats-card pharma-stats-warmup">
        <h3>Données en cours de stabilisation</h3>
        <p class="stats-small">Les statistiques détaillées s’afficheront après 10 parties terminées. Pour l’instant, les résultats sont encore trop sensibles aux premières parties.</p>
        <p class="stats-small">Encore ${Math.max(0, 10 - stats.gamesFinished)} partie(s) terminée(s) avant l’analyse détaillée.</p>
      </div>
    `}

    ${hasConfusionStats ? `
      <div class="stats-grid">
        <div class="stats-card"><h3>Confusions fréquentes</h3>${confusionHtml}</div>
        <div class="stats-card"><h3>Points / catégories fragiles</h3>${statsListHtml(fragile, "Aucune fragilité nette pour l’instant.")}</div>
      </div>
    ` : hasBasicStats ? `
      <div class="stats-card pharma-stats-warmup"><h3>Analyse des confusions</h3><p class="stats-small">Les confusions fréquentes seront affichées après 30 parties terminées.</p></div>
    ` : ""}

    ${hasDeepStats ? `
      <div class="stats-card"><h3>Lecture longue durée</h3><p class="stats-small">Après 50 parties, les catégories solides et fragiles deviennent plus interprétables. Les recommandations ci-dessus peuvent servir de vraie file de révision.</p></div>
    ` : hasConfusionStats ? `
      <div class="stats-card pharma-stats-warmup"><h3>Lecture longue durée</h3><p class="stats-small">À partir de 50 parties, le panneau distinguera mieux les acquis solides et les fragilités persistantes.</p></div>
    ` : ""}
  `;
}
function renderStatsPanelIfOpen(){
  const panel = document.getElementById("statsPanel");

  if(panel && panel.classList.contains("open")){
    renderStatsPanel();
  }
}

function closeAllBottomPanels(exceptId){
  [
    "statsPanel",
    "advancedSearchPanel",
    "reviewBasketPanel",
    "comparisonPanel"
  ].forEach(id=>{
    if(id === exceptId) return;
    const panel = document.getElementById(id);
    if(panel) panel.classList.remove("open");
  });
}

function openStatsPanel(){
  const panel = document.getElementById("statsPanel");
  if(!panel) return;

  closeAllBottomPanels("statsPanel");
  renderStatsPanel();
  panel.classList.add("open");

  showProgressHintSoon(
    "stats_panel",
    "#statsPanel",
    "Statistiques",
    "Ici, tu vois les catégories les plus révisées, les mieux réussies et celles qu’il est conseillé de retravailler.",
    {position:"aboveBottom"},
    320
  );
}

function toggleStatsPanel(){
  const panel = document.getElementById("statsPanel");
  if(!panel) return;

  if(panel.classList.contains("open")){
    closeStatsPanel();
  }else{
    openStatsPanel();
  }
}

function closeStatsPanel(){
  const panel = document.getElementById("statsPanel");
  if(!panel) return;

  panel.classList.remove("open");
}

function normalizeSearchText(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function flattenSearchText(value){
  if(value == null) return "";

  if(Array.isArray(value)){
    return value.map(flattenSearchText).join(" ");
  }

  if(typeof value === "object"){
    return Object.values(value).map(flattenSearchText).join(" ");
  }

  return String(value);
}

const MTC_SEARCH_CANAL_ORDER = [
  "P","GI","E","Rt","C","IG","V","Rn","EC","TF","VB","F","RM","DM"
];

const MTC_SEARCH_CHANNEL_KEYWORDS = {
  P:["P","Poumon","Shǒu tài yīn","Shou tai yin"],
  GI:["GI","Gros Intestin","Shǒu yáng míng","Shou yang ming"],
  E:["E","Estomac","Zú yáng míng","Zu yang ming"],
  Rt:["Rt","Rate","Zú tài yīn","Zu tai yin"],
  C:["C","Cœur","Coeur","Shǒu shǎo yīn","Shou shao yin"],
  IG:["IG","Intestin Grêle","Intestin Grele","Shǒu tài yáng","Shou tai yang"],
  V:["V","Vessie","Zú tài yáng","Zu tai yang"],
  Rn:["Rn","Rein","Zú shǎo yīn","Zu shao yin"],
  EC:["EC","Enveloppe du Cœur","Enveloppe du Coeur","Shǒu jué yīn","Shou jue yin"],
  TF:["TF","Trois Foyers","Shǒu shǎo yáng","Shou shao yang"],
  VB:["VB","Vésicule Biliaire","Vesicule Biliaire","Zú shǎo yáng","Zu shao yang"],
  F:["F","Foie","Zú jué yīn","Zu jue yin"],
  RM:["RM","Rèn mài","Ren mai"],
  DM:["DM","Dū mài","Du mai"]
};

const MTC_CORRESPONDENCE_FILTER_ANY = "__HAS_CORRESPONDENCE__";

const MTC_SEARCH_CORRESPONDENCE_CHANNEL_KEYWORDS = {
  P:["Poumon","Shǒu tài yīn","Shou tai yin"],
  GI:["Gros Intestin","Shǒu yáng míng","Shou yang ming"],
  E:["Estomac","Zú yáng míng","Zu yang ming"],
  Rt:["Rate","Zú tài yīn","Zu tai yin"],
  C:["Cœur","Coeur","Shǒu shǎo yīn","Shou shao yin"],
  IG:["Intestin Grêle","Intestin Grele","Shǒu tài yáng","Shou tai yang"],
  V:["Vessie","Zú tài yáng","Zu tai yang"],
  Rn:["Rein","Zú shǎo yīn","Zu shao yin"],
  EC:["Enveloppe du Cœur","Enveloppe du Coeur","Shǒu jué yīn","Shou jue yin"],
  TF:["Trois Foyers","Shǒu shǎo yáng","Shou shao yang"],
  VB:["Vésicule Biliaire","Vesicule Biliaire","Zú shǎo yáng","Zu shao yang"],
  F:["Foie","Zú jué yīn","Zu jue yin"],
  RM:["Rèn mài","Ren mai"],
  DM:["Dū mài","Du mai"]
};

function getReviewBasket(){
  try{
    const parsed = JSON.parse(
      localStorage.getItem(MTC_REVIEW_BASKET_KEY) || "[]"
    );

    return Array.isArray(parsed)
      ? [...new Set(parsed.map(point => String(point).trim()).filter(Boolean))]
      : [];
  }catch(error){
    return [];
  }
}

function saveReviewBasket(points){
  const clean = [...new Set((points || []).map(point => String(point).trim()).filter(Boolean))];
  localStorage.setItem(MTC_REVIEW_BASKET_KEY, JSON.stringify(clean));
  updateBasketCount();
  renderAdvancedSearchPanelIfOpen();
  renderReviewBasketPanelIfOpen();
}

function isPointInReviewBasket(point){
  return getReviewBasket().includes(String(point));
}

function addPointToReviewBasket(point){
  const basket = getReviewBasket();
  if(!basket.includes(point)){
    basket.push(point);
  }
  saveReviewBasket(basket);
}

function addPointsToReviewBasket(points){
  const basket = getReviewBasket();
  let added = 0;

  (points || []).forEach(point=>{
    const clean = String(point || "").trim();
    if(clean && !basket.includes(clean)){
      basket.push(clean);
      added++;
    }
  });

  saveReviewBasket(basket);
  return added;
}

function removePointFromReviewBasket(point){
  saveReviewBasket(getReviewBasket().filter(item => item !== point));
}

function toggleReviewBasketPoint(point){
  if(isPointInReviewBasket(point)){
    removePointFromReviewBasket(point);
  }else{
    addPointToReviewBasket(point);
  }

  updateBasketButtons(point);
}

function clearReviewBasket(){
  if(!confirm("Vider le panier de révision ?")) return;
  saveReviewBasket([]);
}

function updateBasketCount(){
  const button = document.getElementById("reviewBasketButton");
  if(!button) return;

  const count = getReviewBasket().length;
  button.textContent = count > 0
    ? `Panier (${count})`
    : "Panier";
}

function basketButtonLabel(point){
  return isPointInReviewBasket(point)
    ? "Retirer du panier"
    : "Mettre de côté";
}

function basketButtonShortLabel(point){
  return isPointInReviewBasket(point)
    ? "×"
    : "+";
}

function basketButtonHtml(point, className="search-result-basket", compact=false){
  return `
    <button
      type="button"
      class="${className}"
      data-basket-point="${escapeAttribute(point)}"
      data-basket-compact="${compact ? "1" : "0"}"
      onclick="event.stopPropagation(); toggleReviewBasketPoint('${escapeAttribute(point)}')"
      title="${escapeAttribute(basketButtonLabel(point))}"
      aria-label="${escapeAttribute(basketButtonLabel(point))}"
    >
      ${compact ? basketButtonShortLabel(point) : basketButtonLabel(point)}
    </button>
  `;
}

function updateBasketButtons(point){
  const selector = point
    ? `[data-basket-point="${CSS.escape(String(point))}"]`
    : "[data-basket-point]";

  document.querySelectorAll(selector).forEach(button=>{
    const p = button.dataset.basketPoint;
    const compact = button.dataset.basketCompact === "1";
    button.textContent = compact
      ? basketButtonShortLabel(p)
      : basketButtonLabel(p);
    button.title = basketButtonLabel(p);
    button.setAttribute("aria-label", basketButtonLabel(p));
  });
}

function allSearchPoints(){
  const points = new Set();

  if(typeof POINT_DETAILS !== "undefined"){
    Object.keys(POINT_DETAILS).forEach(point => points.add(point));
  }

  if(!pool || !pool.length){
    pool = buildPool();
  }

  pool.forEach(cat => (cat.points || []).forEach(point => points.add(point)));

  return [...points].sort((a,b)=>
    normalizeSearchText(a).localeCompare(normalizeSearchText(b), "fr")
  );
}

function pointCategoryKeys(point){
  if(!pool || !pool.length){
    pool = buildPool();
  }

  const keys =
    pool
      .filter(cat => (cat.points || []).includes(point))
      .map(cat => cat.key);

  const extraCategories = [
    {
      section: "Points_d_ouverture_des_merveilleux_vaisseaux",
      data: RAW_DATA.Points_d_ouverture_des_merveilleux_vaisseaux || {}
    }
  ];

  extraCategories.forEach(group=>{
    Object.entries(group.data).forEach(([key, value])=>{
      const points = flattenPoints(value);

      if(points.includes(point)){
        keys.push(`${group.section}::${key}`);
      }
    });
  });

  return keys;
}

function pointCategoryNames(point){
  if(!pool || !pool.length){
    pool = buildPool();
  }

  return pool
    .filter(cat => (cat.points || []).includes(point))
    .map(cat => cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key));
}

const MTC_SEARCH_SCOPES = ["name", "functions", "indications", "notes", "precautions", "formules"];

function pointNameSearchText(point){
  const details = POINT_DETAILS[point] || {};

  return [
    point,
    formatPointCode(point),
    details.pinyin || "",
    details.hanzi || "",
    details.nom_francais || "",
    details.nom_complet || ""
  ].join(" ");
}

function pointFunctionsSearchText(point){
  const details = POINT_DETAILS[point] || {};

  return [
    details.actions || "",
    details.fonctions || ""
  ].map(flattenSearchText).join(" ");
}

function pointIndicationsSearchText(point){
  const details = POINT_DETAILS[point] || {};
  return flattenSearchText(details.indications || "");
}

function pointNotesSearchText(point){
  const details = POINT_DETAILS[point] || {};
  return getEditablePointNote(point, details.notes || "");
}

function pointLocalStorageText(prefix, point){
  try{
    const value = localStorage.getItem(prefix + String(point || ""));
    return value === null ? "" : value;
  }catch(error){
    return "";
  }
}

function pointPrecautionsSearchText(point){
  const details = POINT_DETAILS[point] || {};
  return pointLocalStorageText("mtc_point_precaution_", point) || details.precaution || details.precautions || "";
}

function pointFormulesSearchText(point){
  const details = POINT_DETAILS[point] || {};
  return pointLocalStorageText("mtc_point_formules_", point) || details.formules || details.formulas || details.formule || "";
}

function pointSearchTextForScope(point, scope){
  if(scope === "name") return pointNameSearchText(point);
  if(scope === "functions") return pointFunctionsSearchText(point);
  if(scope === "indications") return pointIndicationsSearchText(point);
  if(scope === "notes") return pointNotesSearchText(point);
  if(scope === "precautions") return pointPrecautionsSearchText(point);
  if(scope === "formules") return pointFormulesSearchText(point);

  return [
    pointNameSearchText(point),
    pointFunctionsSearchText(point),
    pointIndicationsSearchText(point),
    pointNotesSearchText(point),
    pointPrecautionsSearchText(point),
    pointFormulesSearchText(point),
    pointCategoryNames(point).join(" "),
    CANAL_LABELS[canalOfPoint(point)] || ""
  ].join(" ");
}

function pointSearchHaystack(point, scopes){
  const cleanScopes =
    Array.isArray(scopes) && scopes.length
      ? scopes
      : MTC_SEARCH_SCOPES;

  return normalizeSearchText(
    cleanScopes
      .map(scope => pointSearchTextForScope(point, scope))
      .join(" ")
  );
}

function pointMatchesKeywords(point, keywords, scopes){
  const query = normalizeSearchText(keywords).trim();
  if(!query) return true;

  const haystack = pointSearchHaystack(point, scopes);

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every(word => haystack.includes(word));
}

function pointMatchesCategory(point, categoryKey){
  if(!categoryKey) return true;
  return pointCategoryKeys(point).map(canonicalAssociationKey).includes(canonicalAssociationKey(categoryKey));
}

function pointMatchesCanal(point, canal){
  if(!canal) return true;
  return canalOfPoint(point) === canal;
}

function pointCorrespondenceRawText(point){
  const details = POINT_DETAILS[point] || {};
  return flattenSearchText(details.correspondances || "").trim();
}

function pointHasCorrespondence(point){
  const text = normalizeSearchText(pointCorrespondenceRawText(point));

  if(!text) return false;

  return ![
    "aucune",
    "sans correspondance",
    "pas de correspondance"
  ].some(emptyLabel => text === normalizeSearchText(emptyLabel));
}

function pointCorrespondenceSearchText(point){
  return normalizeSearchText(pointCorrespondenceRawText(point));
}

function pointMatchesSingleCorrespondenceCanal(point, canal){
  if(!canal) return true;

  if(canal === MTC_CORRESPONDENCE_FILTER_ANY){
    return pointHasCorrespondence(point);
  }

  const text = pointCorrespondenceSearchText(point);
  if(!text) return false;

  const tokens = MTC_SEARCH_CORRESPONDENCE_CHANNEL_KEYWORDS[canal] || [];

  return tokens
    .map(normalizeSearchText)
    .filter(token => token.length > 2)
    .some(token => text.includes(token));
}

function pointMatchesCorrespondenceCanal(point, correspondences){
  const selected = Array.isArray(correspondences)
    ? correspondences.filter(Boolean)
    : (correspondences ? [correspondences] : []);

  if(!selected.length) return true;

  const withoutAny = selected.filter(value => value !== MTC_CORRESPONDENCE_FILTER_ANY);

  if(!withoutAny.length){
    return pointHasCorrespondence(point);
  }

  return withoutAny.some(canal =>
    pointMatchesSingleCorrespondenceCanal(point, canal)
  );
}

function getAdvancedSearchScopes(){
  const inputs =
    [...document.querySelectorAll("input[name='advancedSearchScope']")];

  if(!inputs.length){
    return [...MTC_SEARCH_SCOPES];
  }

  const checked =
    inputs
      .filter(input => input.checked)
      .map(input => input.value);

  return checked.length
    ? checked
    : [...MTC_SEARCH_SCOPES];
}

function searchScopeChecked(scopes, scope){
  const clean = Array.isArray(scopes) && scopes.length
    ? scopes
    : MTC_SEARCH_SCOPES;

  return clean.includes(scope) ? "checked" : "";
}

function getAdvancedSearchCorrespondences(){
  const inputs =
    [...document.querySelectorAll("input[name='advancedSearchCorrespondence']")];

  if(inputs.length){
    return inputs
      .filter(input => input.checked)
      .map(input => input.value);
  }

  const oldSelectValue =
    document.getElementById("advancedSearchCorrespondence")?.value || "";

  return oldSelectValue ? [oldSelectValue] : [];
}

function correspondenceChecked(selected, value){
  return Array.isArray(selected) && selected.includes(value)
    ? "checked"
    : "";
}

function getAdvancedSearchFilters(){
  return {
    keywords:document.getElementById("advancedSearchKeywords")?.value || "",
    scopes:getAdvancedSearchScopes(),
    category:document.getElementById("advancedSearchCategory")?.value || "",
    canal:document.getElementById("advancedSearchCanal")?.value || "",
    correspondences:getAdvancedSearchCorrespondences()
  };
}

function advancedSearchResults(){
  const filters = getAdvancedSearchFilters();

  return allSearchPoints()
    .filter(point => pointMatchesKeywords(point, filters.keywords, filters.scopes))
    .filter(point => pointMatchesCategory(point, filters.category))
    .filter(point => pointMatchesCanal(point, filters.canal))
    .filter(point => pointMatchesCorrespondenceCanal(point, filters.correspondences));
}

function searchPointTitle(point){
  const details = POINT_DETAILS[point] || {};
  const pinyin = details.pinyin || "";
  const hanzi = details.hanzi || "";
  const nom = details.nom_francais || details.nom_complet || "";

  return [
    formatPointCode(point),
    pinyin,
    hanzi,
    nom
  ].filter(Boolean).join(" · ");
}

function searchPointMeta(point){
  const canal = canalOfPoint(point);
  const canalLabel = CANAL_LABELS[canal] || canal || "Canal non identifié";
  const categories = pointCategoryNames(point).slice(0,3).join(" · ");

  return [canalLabel, categories].filter(Boolean).join(" — ");
}

function compactPointLabel(point){
  return formatPointCode(point);
}

function advancedSearchResultHtml(point){
  return `
    <li class="search-result-item">
      <div class="compact-point-row" onclick="openPointPanelDirect('${escapeAttribute(point)}')" title="${escapeAttribute(searchPointTitle(point))}" role="button" tabindex="0" onkeydown="openBasketLineWithKeyboard(event,'${escapeAttribute(point)}')">
        <span class="compact-point-code">${compactPointLabel(point)}</span>
        <span class="compact-point-tools" onclick="event.stopPropagation()">
          ${basketButtonHtml(point, "search-result-basket", true)}
        </span>
      </div>
    </li>
  `;
}

function basketListHtml(){
  const basket = getReviewBasket();

  if(!basket.length){
    return `<p class="stats-small">Ton panier est vide. Ajoute des points depuis la recherche, le Cheatsheet, une fiche point ou une catégorie validée.</p>`;
  }

  return `
    <p class="stats-small">Clique sur un point pour ouvrir sa fiche. Choisis A et B pour comparer deux points.</p>
    <ul class="basket-list">
      ${basket.map(point => `
        <li class="basket-list-item" title="${escapeAttribute(searchPointTitle(point))}">
          <div
            class="compact-point-row"
            onclick="openPointPanelDirect('${escapeAttribute(point)}')"
            role="button"
            tabindex="0"
            onkeydown="openBasketLineWithKeyboard(event,'${escapeAttribute(point)}')"
          >
            <span class="compact-point-code">${compactPointLabel(point)}</span>

            <span class="compact-point-tools basket-item-buttons" onclick="event.stopPropagation()">
              <button
                type="button"
                class="comparison-slot-button"
                onclick="setComparisonPoint('${escapeAttribute(point)}',0)"
                title="Comparer en A"
              >
                A
              </button>

              <button
                type="button"
                class="comparison-slot-button"
                onclick="setComparisonPoint('${escapeAttribute(point)}',1)"
                title="Comparer en B"
              >
                B
              </button>

              <button
                type="button"
                onclick="removePointFromReviewBasket('${escapeAttribute(point)}')"
                title="Retirer du panier"
              >
                ×
              </button>
            </span>
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function openBasketLineWithKeyboard(event, point){
  if(event.key === "Enter" || event.key === " "){
    event.preventDefault();
    openPointPanelDirect(point);
  }
}

function categoryOptionsHtml(){
  if(!pool || !pool.length){
    pool = buildPool();
  }

  const options =
    pool.map(cat => ({
      key: cat.key,
      name: cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
    }));

  const extraCategories = [
    {
      section: "Points_d_ouverture_des_merveilleux_vaisseaux",
      prefix: "Merveilleux vaisseaux",
      data: RAW_DATA.Points_d_ouverture_des_merveilleux_vaisseaux || {}
    }
  ];

  extraCategories.forEach(group=>{
    Object.keys(group.data).forEach(key=>{
      options.push({
        key: `${group.section}::${key}`,
        name: `${group.prefix} — ${LABEL_NAMES[key] || displayLabel(key)}`
      });
    });
  });

  return options
    .sort((a,b)=>
      normalizeSearchText(a.name).localeCompare(
        normalizeSearchText(b.name),
        "fr"
      )
    )
    .map(cat =>
      `<option value="${escapeAttribute(cat.key)}">${escapeHtml(cat.name)}</option>`
    )
    .join("");
}

function canalOptionsHtml(){
  return MTC_SEARCH_CANAL_ORDER
    .map(canal => `<option value="${escapeAttribute(canal)}">${escapeHtml(CANAL_LABELS[canal] || canal)}</option>`)
    .join("");
}

function correspondenceChecklistHtml(selected = []){
  const values = Array.isArray(selected) ? selected : [];

  return MTC_SEARCH_CANAL_ORDER
    .map(canal => `
      <label>
        <input
          type="checkbox"
          name="advancedSearchCorrespondence"
          value="${escapeAttribute(canal)}"
          ${correspondenceChecked(values, canal)}
          onchange="renderAdvancedSearchResults()"
        >
        ${escapeHtml(CANAL_LABELS[canal] || canal)}
      </label>
    `)
    .join("");
}

function renderAdvancedSearchPanel(){
  const content = document.getElementById("advancedSearchPanelContent");
  if(!content) return;

  const currentFilters = getAdvancedSearchFilters();
  const showCorrespondenceChecklist =
    currentFilters.correspondences.includes(MTC_CORRESPONDENCE_FILTER_ANY);

  const resultsAll = advancedSearchResults();
  const results = resultsAll.slice(0,80);
  const total = resultsAll.length;

  content.innerHTML = `
    <div class="point-header">
      <span class="point-code">Recherche avancée</span>
    </div>

    <p class="stats-intro">
      Recherche un point par mot-clé, catégorie, canal du point ou correspondance. Tu peux limiter le mot-clé au nom, aux fonctions, aux indications ou aux notes.
    </p>

    <div class="search-controls">
      <label class="search-control">
        <span>Mot-clé</span>
        <input
          id="advancedSearchKeywords"
          type="search"
          value="${escapeAttribute(currentFilters.keywords)}"
          placeholder="ex. douleur, luò, Estomac, Rt4..."
          oninput="renderAdvancedSearchResults()"
        >
      </label>

      <div class="search-scope-options" aria-label="Champs de recherche">
        <span>Rechercher dans :</span>
        <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
        <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
        <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
        <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
        <label><input type="checkbox" name="advancedSearchScope" value="precautions" ${searchScopeChecked(currentFilters.scopes,"precautions")} onchange="renderAdvancedSearchResults()"> précautions</label>
        <label><input type="checkbox" name="advancedSearchScope" value="formules" ${searchScopeChecked(currentFilters.scopes,"formules")} onchange="renderAdvancedSearchResults()"> formules</label>
      </div>

      <label class="search-control">
        <span>Catégorie de points</span>
        <select id="advancedSearchCategory" onchange="renderAdvancedSearchResults()">
          <option value="">Toutes les catégories</option>
          ${categoryOptionsHtml()}
        </select>
      </label>

      <label class="search-control">
        <span>Canal du point</span>
        <select id="advancedSearchCanal" onchange="renderAdvancedSearchResults()">
          <option value="">Tous les canaux</option>
          ${canalOptionsHtml()}
        </select>
      </label>

      <div class="search-control search-correspondence-control">
        <span>Points d'intersection</span>
        <label class="search-correspondence-any">
          <input
            type="checkbox"
            name="advancedSearchCorrespondence"
            value="${MTC_CORRESPONDENCE_FILTER_ANY}"
            ${correspondenceChecked(currentFilters.correspondences, MTC_CORRESPONDENCE_FILTER_ANY)}
            onchange="renderAdvancedSearchPanel()"
          >
          Points ayant une intersection
        </label>
        ${showCorrespondenceChecklist
          ? `<div class="correspondence-checklist" aria-label="Correspondance">${correspondenceChecklistHtml(currentFilters.correspondences)}</div>`
          : ""
        }
      </div>
    </div>

    <div class="search-actions">
      <button type="button" onclick="resetAdvancedSearchFilters()">Réinitialiser les filtres</button>
    </div>

    <h3 class="search-section-title">Résultats</h3>
    <div id="advancedSearchResults"></div>
  `;

  document.getElementById("advancedSearchCategory").value = currentFilters.category;
  document.getElementById("advancedSearchCanal").value = currentFilters.canal;

  renderAdvancedSearchResultsWith(results, total);
}

function renderAdvancedSearchResultsWith(results, total){
  const container = document.getElementById("advancedSearchResults");
  if(!container) return;

  if(!total){
    container.innerHTML = `<p class="stats-small">Aucun point ne correspond aux filtres.</p>`;
    return;
  }

  const limitNote = total > results.length
    ? ` — ${results.length} affichés`
    : "";

  container.innerHTML = `
    <div class="search-result-count">${total} résultat(s)${limitNote}</div>
    <ul class="search-results-list">
      ${results.map(advancedSearchResultHtml).join("")}
    </ul>
  `;
}

function renderAdvancedSearchResults(){
  const resultsAll = advancedSearchResults();
  renderAdvancedSearchResultsWith(resultsAll.slice(0,80), resultsAll.length);
}

function resetAdvancedSearchFilters(){
  ["advancedSearchKeywords","advancedSearchCategory","advancedSearchCanal"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });

  document
    .querySelectorAll("input[name='advancedSearchScope']")
    .forEach(input=>{ input.checked = true; });

  document
    .querySelectorAll("input[name='advancedSearchCorrespondence']")
    .forEach(input=>{ input.checked = false; });

  renderAdvancedSearchPanel();
}

function openAdvancedSearchPanel(){
  const panel = document.getElementById("advancedSearchPanel");
  if(!panel) return;

  closeAllBottomPanels("advancedSearchPanel");
  renderAdvancedSearchPanel();
  panel.classList.add("open");

  showProgressHintSoon(
    "advanced_search_panel",
    "#advancedSearchKeywords",
    "Recherche avancée",
    "Tu peux rechercher un point par mot-clé, puis préciser où chercher : nom, fonctions, indications ou notes.",
    {position:"aboveBottom"},
    320
  );

  showProgressHintSoon(
    "advanced_search_correspondence",
    ".correspondence-checklist",
    "Correspondance",
    "Ce filtre recherche des intersections des canaux.",
    {position:"aboveBottom"},
    900
  );
}

function toggleAdvancedSearchPanel(){
  const panel = document.getElementById("advancedSearchPanel");
  if(!panel) return;

  if(panel.classList.contains("open")){
    closeAdvancedSearchPanel();
  }else{
    openAdvancedSearchPanel();
  }
}

function openAdvancedSearchFromBasket(){
  closeReviewBasketPanel();
  openAdvancedSearchPanel();
}

function closeAdvancedSearchPanel(){
  const panel = document.getElementById("advancedSearchPanel");
  if(!panel) return;

  panel.classList.remove("open");
}

function renderAdvancedSearchPanelIfOpen(){
  const panel = document.getElementById("advancedSearchPanel");
  if(panel && panel.classList.contains("open")){
    renderAdvancedSearchPanel();
  }
}

function renderReviewBasketPanel(){
  const content = document.getElementById("reviewBasketPanelContent");
  if(!content) return;

  content.innerHTML = `
    <div class="point-header">
      <span class="point-code">Panier de révision</span>
    </div>

    <p class="stats-intro">
      Mets ici les points que tu veux revoir plus tard. Le panier reste enregistré dans ce navigateur, même après une mise à jour du jeu.
    </p>

    <div class="search-actions">
      <button type="button" onclick="clearReviewBasket()">Vider le panier</button>
      <button type="button" onclick="openAdvancedSearchFromBasket()">Ouvrir la recherche</button>
    </div>

    <div id="reviewBasketContent">${basketListHtml()}</div>
  `;

  updateBasketButtons();

  if(getReviewBasket().length){
    showProgressHintSoon(
      "basket_comparison_buttons_ab",
      ".comparison-slot-button",
      "Comparer deux points",
      "Choisis A pour le premier point et B pour le deuxième. Le panneau Comparaison s’affiche seulement quand les deux sont choisis.",
      {position:"aboveBottom"},
      520
    );
  }
}

function openReviewBasketPanel(){
  const panel = document.getElementById("reviewBasketPanel");
  if(!panel) return;

  closeAllBottomPanels("reviewBasketPanel");
  renderReviewBasketPanel();
  panel.classList.add("open");

  showProgressHintSoon(
    "review_basket_panel",
    "#reviewBasketPanel",
    "Panier",
    "Le panier garde les points à réviser. Clique sur un point pour ouvrir sa fiche, ou ajoute des points au panneau de comparaison.",
    {position:"aboveBottom"},
    320
  );
}

function toggleReviewBasketPanel(){
  const panel = document.getElementById("reviewBasketPanel");
  if(!panel) return;

  if(panel.classList.contains("open")){
    closeReviewBasketPanel();
  }else{
    openReviewBasketPanel();
  }
}

function closeReviewBasketPanel(){
  const panel = document.getElementById("reviewBasketPanel");
  if(!panel) return;

  panel.classList.remove("open");
}

function renderReviewBasketPanelIfOpen(){
  const panel = document.getElementById("reviewBasketPanel");
  if(panel && panel.classList.contains("open")){
    renderReviewBasketPanel();
  }
}

function getComparisonPoints(){
  try{
    const parsed = JSON.parse(
      localStorage.getItem(MTC_COMPARISON_POINTS_KEY) || "[]"
    );

    return [
      parsed?.[0] ? String(parsed[0]) : "",
      parsed?.[1] ? String(parsed[1]) : ""
    ];
  }catch(error){
    return ["", ""];
  }
}

function saveComparisonPoints(points){
  const clean = [
    points?.[0] ? String(points[0]) : "",
    points?.[1] ? String(points[1]) : ""
  ];

  localStorage.setItem(
    MTC_COMPARISON_POINTS_KEY,
    JSON.stringify(clean)
  );

  updateComparisonButtonLabel();
  renderComparisonPanelIfOpen();
}

function updateComparisonButtonLabel(){
  const button = document.getElementById("comparisonButton");
  if(!button) return;

  const count = getComparisonPoints().filter(Boolean).length;

  button.textContent = count > 0
    ? `A|B (${count}/2)`
    : "A|B";
}

function setComparisonPoint(point, slotIndex){
  const slots = getComparisonPoints();
  const index = Number(slotIndex) === 1 ? 1 : 0;

  slots[index] = String(point);
  saveComparisonPoints(slots);

  const filledCount = slots.filter(Boolean).length;

  if(filledCount >= 2){
    openComparisonPanel();
    showProgressHintSoon(
      "comparison_ready",
      "#comparisonPanel",
      "Comparaison",
      "Les deux points sont côte à côte pour comparer rapidement leurs catégories, correspondances, fonctions, indications et notes.",
      {position:"aboveBottom"},
      420
    );
  }else{
    message.textContent = "Premier point placé en comparaison. Choisis maintenant un deuxième point.";
    renderReviewBasketPanelIfOpen();
  }
}

function clearComparisonPoint(slotIndex){
  const slots = getComparisonPoints();
  const index = Number(slotIndex) === 1 ? 1 : 0;

  slots[index] = "";
  saveComparisonPoints(slots);
}

function comparisonValueBlock(title, value){
  const clean = flattenSearchText(value || "").trim();

  if(!clean) return "";

  return `
    <div class="comparison-field">
      <span class="comparison-field-title">${escapeHtml(title)}</span>
      <div class="comparison-field-value">${escapeHtml(clean)}</div>
    </div>
  `;
}

function comparisonCardHtml(slotIndex, point){
  if(!point) return "";

  const details = POINT_DETAILS[point] || {};
  const notes = getEditablePointNote(point, details.notes || "");

  return `
    <div class="comparison-card">
      <div class="search-result-title">${searchPointTitle(point)}</div>
      <div class="search-result-meta">${escapeHtml(searchPointMeta(point))}</div>

      <div class="comparison-actions">
        <button type="button" onclick="openPointPanelDirect('${escapeAttribute(point)}')">Ouvrir la fiche</button>
        <button type="button" onclick="clearComparisonPoint(${slotIndex})">Retirer</button>
      </div>

      ${comparisonValueBlock("Catégories", pointCategoryNames(point).join(" · "))}
      ${comparisonValueBlock("Correspondances", details.correspondances)}
      ${comparisonValueBlock("Fonctions", details.actions || details.fonctions)}
      ${comparisonValueBlock("Indications", details.indications)}
      ${comparisonValueBlock("Notes", notes)}
    </div>
  `;
}

function renderComparisonPanel(){
  const content = document.getElementById("comparisonPanelContent");
  if(!content) return;

  const slots = getComparisonPoints();

  content.innerHTML = `
    <div class="point-header">
      <span class="point-code">Comparaison</span>
    </div>

    <div class="comparison-grid">
      ${comparisonCardHtml(0, slots[0])}
      ${comparisonCardHtml(1, slots[1])}
    </div>
  `;
}

function openComparisonPanel(){
  const panel = document.getElementById("comparisonPanel");
  if(!panel) return;

  const slots = getComparisonPoints();
  if(slots.filter(Boolean).length < 2){
    message.textContent = "Choisis deux points depuis le panier pour ouvrir la comparaison.";
    openReviewBasketPanel();
    return;
  }

  closeAllBottomPanels("comparisonPanel");
  renderComparisonPanel();
  panel.classList.add("open");
}

function toggleComparisonPanel(){
  const panel = document.getElementById("comparisonPanel");
  if(!panel) return;

  if(panel.classList.contains("open")){
    closeComparisonPanel();
  }else{
    openComparisonPanel();
  }
}

function closeComparisonPanel(){
  const panel = document.getElementById("comparisonPanel");
  if(!panel) return;

  panel.classList.remove("open");
}

function renderComparisonPanelIfOpen(){
  const panel = document.getElementById("comparisonPanel");
  if(panel && panel.classList.contains("open")){
    renderComparisonPanel();
  }
}


function pointBasketActionHtml(point){
  return `
    <div class="point-panel-actions">
      ${basketButtonHtml(point, "point-basket-button")}
    </div>
  `;
}

function toggleCheatsheetPanel(){

  cheatsheetPanel.classList.toggle("open");

  if(cheatsheetPanel.classList.contains("open")){
    cheatsheetToggle.innerHTML = "&lt;";
  }else{
    cheatsheetPanel.classList.remove("open");
    cheatsheetToggle.innerHTML = "&gt;";
  }
    cheatsheetPanel.addEventListener("mouseleave", ()=>{
    cheatsheetPanel.classList.remove("open");
    cheatsheetToggle.innerHTML = "&gt;";
  });
}

function openCheatsheetPanel(){
  try{
    renderCheatsheetPanel();

    const shouldOpenDemoCategory =
      document.getElementById("tourBox") ||
      localStorage.getItem(progressHintKey("cheatsheet_points")) !== "1";

    if(shouldOpenDemoCategory){
      openCheatsheetDemoCategory();
    }

    cheatsheetPanel.classList.add("available");
    cheatsheetPanel.classList.add("open");

    cheatsheetToggle.innerHTML = "&lt;";

    showProgressHintSoon(
      "cheatsheet_points",
      ".cheatsheet-point-link",
      "Cheatsheet",
      "Cette catégorie est ouverte pour l’exemple. En cliquant sur un code de point, tu ouvres sa fiche détaillée.",
      {},
      360
    );
  }catch(error){
    console.error("Erreur cheatsheet :", error);
    message.textContent = "Erreur dans le cheatsheet. Regarde la console.";
  }
}

function renderCheatsheetPanel(){

  function asArray(value){
    if(!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function flattenLocal(value){
    if(!value) return [];

    if(Array.isArray(value)){
      return value.flatMap(flattenLocal);
    }

    if(typeof value === "object"){
      return Object.values(value).flatMap(flattenLocal);
    }

    return [String(value)];
  }

  function pointFullName(point){
    const code = String(point).trim();
    const d = POINT_DETAILS[code] || {};

    return `
      <button
        type="button"
        class="cheatsheet-point-link"
        onclick="openPointPanelDirect('${code}')"
      >
        ${formatPointCode(code)}
      </button>
      ${d.pinyin || ""}
      ${d.hanzi || ""}
      ${d.nom_francais || d.nom_complet || ""}
    `;
  }

  function openPointPanelFromCheatsheet(point){

    let fakeGroup = solution.find(group =>
      group.points.includes(point)
    );

    if(!fakeGroup){
      fakeGroup = {
        solved:true,
        points:[point]
      };

      solution.push(fakeGroup);
    }

    openPointPanel(point);
  }

  function line(labelText, value){
    const points = flattenLocal(value);
    if(points.length === 0) return "";

    return `
      <div class="cheatsheet-line">
        <strong>${labelText}</strong> : ${points.map(pointFullName).join(", ")}
      </div>
    `;
  }

  function simplePointLines(value){
    return flattenLocal(value).map(point => `
      <div class="cheatsheet-line">
        ${pointFullName(point)}
      </div>
    `);
  }

  function section(title, rows){
    const cleanRows = rows.filter(Boolean);

    if(cleanRows.length === 0) return "";

    return `
      <details class="cheatsheet-section">
        <summary>${title}</summary>
        <div>${cleanRows.join("")}</div>
      </details>
    `;
  }

  function label(key){
    return LABEL_NAMES[key] || displayLabel(key);
  }

  const canalOrder = [
    "IG","V","TF","VB","GI","E",
    "P","Rt","C","Rn","EC","F",
    "RM","DM"
  ];

  let html = `
    <div class="point-header">
      <span class="point-code">Cheatsheet</span>
    </div>
  `;

  Object.entries(RAW_DATA.Categories_de_points || {}).forEach(([key,value])=>{

    const title = DISPLAY_NAMES[key] || key;

    if([
      "Points_Jing_Puits",
      "Points_Ying_Jaillissement",
      "Points_Shu_Riviere",
      "Points_Jing_Fleuve",
      "Points_He_Reunion",
      "Points_Yuan_Source",
      "Points_Xi_Crevasse",
      "Points_Luo_Liaison"
    ].includes(key)){

      html += section(
        title,
        canalOrder.map(canal =>
          line(
            labelForCanalOrVessel(canal),
            flattenLocal(value).filter(p => canalOfPoint(p) === canal)
          )
        )
      );

    }else{

      html += section(
        title,
        simplePointLines(value)
      );
    }
  });

  [
    "Points_d_ouverture_des_merveilleux_vaisseaux",
    "Points_Hui_Reunion",
    "Points_generaux",
    "Les_4_mers"
  ].forEach(sectionKey=>{
    const data = RAW_DATA[sectionKey];
    if(!data) return;

    html += section(
      DISPLAY_NAMES[sectionKey] || sectionKey,
      Object.entries(data).map(([labelKey,points]) =>
        line(label(labelKey), points)
      )
    );
  });

  [
    "Points_fenetre_du_ciel",
    "Points_pour_faire_revenir_le_Yang",
    "Points_fantomes_de_Sun_Si_Miao"
  ].forEach(sectionKey=>{
    const data = RAW_DATA[sectionKey];
    if(!data) return;

    html += section(
      DISPLAY_NAMES[sectionKey] || sectionKey,
      simplePointLines(data)
    );
  });

  if(typeof POINT_DETAILS !== "undefined"){
    function isRegularChannelPointCode(code){
      return /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\d+$/.test(String(code));
    }

    function extraordinarySortLabel(point){
      const d = POINT_DETAILS[point] || {};

      return String(
        d.pinyin ||
        d.nom_francais ||
        d.nom_complet ||
        point
      )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .toLowerCase();
    }

    const extraordinaryPoints =
      Object.keys(POINT_DETAILS)
        .filter(point => !isRegularChannelPointCode(point))
        .sort((a,b) =>
          extraordinarySortLabel(a).localeCompare(
            extraordinarySortLabel(b),
            "fr"
          )
        );

    html += section(
      "Points extraordinaires",
      simplePointLines(extraordinaryPoints)
    );
  }

  cheatsheetPanelContent.innerHTML = html;
}

function openCheatsheetDemoCategory(){

  if(!cheatsheetPanelContent) return;

  const sections =
    [...cheatsheetPanelContent.querySelectorAll("details.cheatsheet-section")];

  if(!sections.length) return;

  sections.forEach(section=>{
    section.open = false;
  });

  const demoSection =
    sections.find(section => section.querySelector(".cheatsheet-point-link")) ||
    sections[0];

  demoSection.open = true;

  setTimeout(()=>{
    const demoPoint =
      demoSection.querySelector(".cheatsheet-point-link");

    if(demoPoint){
      demoPoint.scrollIntoView({
        block:"center",
        inline:"nearest",
        behavior:"smooth"
      });
    }
  }, 120);
}

function closeCheatsheetPanel(){

  const panel = document.getElementById("cheatsheetPanel");
  const toggle = document.getElementById("cheatsheetToggle");

  if(!panel) return;

  panel.classList.remove("open");

  if(toggle){
    toggle.innerHTML = "&gt;";
  }
}

document.addEventListener("pointerdown", event=>{

  if(!cheatsheetPanel.classList.contains("open")){
    return;
  }

  if(cheatsheetPanel.contains(event.target)){
    return;
  }

  if(event.target.closest("#cheatsheetButton")){
    return;
  }

  if(event.target.closest(".category-postit")){
    return;
  }

  if(event.target.closest("#tourBox")){
    return;
  }

  closeCheatsheetPanel();

});

document.addEventListener("keydown", event=>{

  if(event.key === "Escape"){
    closeCheatsheetPanel();
  }

});

function currentMode(){
  return modeToggle.checked
    ? "manual"
    : "auto";
}

function toggleManualMode(){

  pool = buildPool();
  fillManualSelectors();

  if(currentMode() === "manual"){

    manualEditButton.style.display = "inline-block";

    const alreadyOpenedManual =
      localStorage.getItem("mtc_manual_opened_once") === "1";

    if(!alreadyOpenedManual){
      manualControls.style.display = "flex";
      localStorage.setItem("mtc_manual_opened_once", "1");
    }else{
      manualControls.style.display = "none";
    }

  }else{

    manualEditButton.style.display = "none";
    manualControls.style.display = "none";
  }
}

const CANAL_LABELS = {
  P:"Shǒu tài yīn",
  GI:"Shǒu yáng míng",
  E:"Zú yáng míng",
  Rt:"Zú tài yīn",
  C:"Shǒu shǎo yīn",
  IG:"Shǒu tài yáng",
  V:"Zú tài yáng",
  Rn:"Zú shǎo yīn",
  EC:"Shǒu jué yīn",
  TF:"Shǒu shǎo yáng",
  VB:"Zú shǎo yáng",
  F:"Zú jué yīn",
  RM:"Rèn mài",
  DM:"Dū mài",
  ChongMai:"Chōng mài",
  DaiMai:"Dài mài",
  YinQiaoMai:"Yīn qiāo mài",
  YangQiaoMai:"Yáng qiāo mài",
  YinWeiMai:"Yīn wéi mài",
  YangWeiMai:"Yáng wéi mài"
};

function labelForCanalOrVessel(key){
  return CANAL_LABELS[key] || LABEL_NAMES[key] || displayLabel(key);
}

function canalOfPoint(point){
  const match = String(point).match(/^[A-Za-z]+/);
  return match ? match[0] : "";
}

function pointLineWithCanal(point){
  const canal = canalOfPoint(point);
  const label = CANAL_LABELS[canal] || canal;

  return `${label} : ${shortPointLine(point)}`;
}

const MAX_MISTAKES = 5;
const MAX_CHEATS = 5;


/* === Bucket 8P : gameplay expérimental ACU (modes, objectifs, erreurs) === */
const MTC_GAMEPLAY_MODE_KEY = "mtc_gameplay_mode_acupuncture_v1";
const MTC_SESSION_GOAL_KEY = "mtc_session_goal_acupuncture_v1";
const MTC_REVIEW_QUEUE_KEY = "mtc_acu_review_queue_v1";
let currentAcuRunErrors = [];

function getMtcGameplayMode(){
  const mode = localStorage.getItem(MTC_GAMEPLAY_MODE_KEY) || "normal";
  return ["normal","review","exam"].includes(mode) ? mode : "normal";
}

function mtcGameplayModeLabel(mode = getMtcGameplayMode()){
  return {
    normal:"Normal",
    review:"Révision douce",
    exam:"Examen"
  }[mode] || "Normal";
}

function setMtcGameplayMode(mode){
  if(!["normal","review","exam"].includes(mode)) mode = "normal";
  localStorage.setItem(MTC_GAMEPLAY_MODE_KEY, mode);
  updateGameStatus();
  renderStatsPanelIfOpen();
  if(typeof window.updateVisibleGameplayModeSwitch === "function") window.updateVisibleGameplayModeSwitch();
}

function getMtcMistakeLimit(){
  return getMtcGameplayMode() === "review" ? 999 : MAX_MISTAKES;
}

function getMtcHintLimit(){
  const mode = getMtcGameplayMode();
  if(mode === "exam") return 0;
  if(mode === "review") return 9;
  return MAX_CHEATS;
}

function mtcLimitText(value){
  return value >= 99 ? "∞" : String(value);
}

const MTC_CHEER_SIGNS = ["•‿•", "ᵕ̈", "◝(ᵔᗜᵔ)◜", "☻️"];

function mtcCheerSign(){
  return MTC_CHEER_SIGNS[Math.floor(Math.random() * MTC_CHEER_SIGNS.length)];
}

function mtcGoodChoiceMessage(label){
  return `${label} ${mtcCheerSign()}`;
}

function mtcLivesText(){
  const limit = getMtcMistakeLimit();
  if(limit >= 99) return `♥∞ ${mistakeCount ? "· erreurs " + mistakeCount : ""}`;
  const remaining = Math.max(0, limit - mistakeCount);
  return "♥".repeat(remaining) + "♡".repeat(Math.min(mistakeCount, limit));
}

function mtcHintsText(){
  const limit = getMtcHintLimit();
  if(limit <= 0) return "☘︎0";
  const remaining = Math.max(0, limit - cheatCount);
  return "☘︎".repeat(Math.min(remaining, 9));
}

function getMtcSessionGoal(){
  const goal = localStorage.getItem(MTC_SESSION_GOAL_KEY) || "none";
  return ["none","no_hint","review_errors","fragile_categories"].includes(goal) ? goal : "none";
}

function mtcSessionGoalLabel(goal = getMtcSessionGoal()){
  return {
    none:"Aucun objectif",
    no_hint:"Réussir sans astuce",
    review_errors:"Revoir les erreurs",
    fragile_categories:"Travailler les catégories fragiles"
  }[goal] || "Aucun objectif";
}

function mtcSessionGoalMessage(){
  return "";
}

function setMtcSessionGoal(goal){
  if(!["none","no_hint","review_errors","fragile_categories"].includes(goal)) goal = "none";
  localStorage.setItem(MTC_SESSION_GOAL_KEY, goal);
  renderStatsPanelIfOpen();
}

function ensureMtcModeStats(stats, mode = getMtcGameplayMode()){
  if(!stats.modes || typeof stats.modes !== "object") stats.modes = {};
  if(!stats.modes[mode]) stats.modes[mode] = {started:0, finished:0, wins:0, losses:0};
  return stats.modes[mode];
}

function mtcGetStoredReviewQueue(){
  try{
    const parsed = JSON.parse(localStorage.getItem(MTC_REVIEW_QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  }catch(error){ return []; }
}

function mtcSaveStoredReviewQueue(queue){
  try{ localStorage.setItem(MTC_REVIEW_QUEUE_KEY, JSON.stringify(queue.slice(0,80))); }catch(error){}
}

function mtcAddReviewItem(item){
  const clean = {
    type:item?.type || "point",
    point:item?.point || "",
    category:item?.category || "",
    otherCategory:item?.otherCategory || "",
    reason:item?.reason || "",
    when:new Date().toISOString()
  };
  currentAcuRunErrors.push(clean);

  const queue = mtcGetStoredReviewQueue();
  const key = [clean.type, clean.point, clean.category, clean.otherCategory].join("|");
  const withoutDuplicate = queue.filter(item => [item.type, item.point, item.category, item.otherCategory].join("|") !== key);
  mtcSaveStoredReviewQueue([clean, ...withoutDuplicate]);
}

function mtcCategoryName(key){
  if(!key) return "";
  return DISPLAY_NAMES[key] || displayLabel(key);
}

function mtcRecordMistake(detail = {}){
  const stats = loadMtcStats();
  const now = new Date().toISOString();
  const activeKey = detail.activeKey || "";
  const clickedKey = detail.clickedKey || "";
  const points = Array.isArray(detail.points) ? detail.points.filter(Boolean) : [];

  [activeKey, clickedKey].filter(Boolean).forEach(key => {
    const cat = ensureCategoryStats(stats, key, mtcCategoryName(key));
    cat.errors = (cat.errors || 0) + 1;
    cat.lastError = now;
  });

  if(activeKey && clickedKey && activeKey !== clickedKey){
    const key = [activeKey, clickedKey].sort().join(" ↔ ");
    if(!stats.confusions[key]) stats.confusions[key] = {key, count:0, categories:[activeKey, clickedKey], last:null};
    stats.confusions[key].count += 1;
    stats.confusions[key].last = now;
  }

  const labelPoint = points[points.length - 1] || "";
  mtcAddReviewItem({
    type:"point",
    point:labelPoint,
    category:activeKey ? mtcCategoryName(activeKey) : "",
    otherCategory:clickedKey ? mtcCategoryName(clickedKey) : "",
    reason:detail.reason || "erreur"
  });

  saveMtcStats(stats);
  renderStatsPanelIfOpen();
}

function mtcMistakeRecap(){
  return "";
}

function mtcEndReviewHtml(){
  return "";
}

function startMtcSoftReviewFromErrors(){
  setMtcGameplayMode("review");
  setAutoPracticeMode("weak");
  newGame();
}

function unique(arr){
  if(!arr) return [];

  if(!Array.isArray(arr)){
    arr = [arr];
  }

  return [...new Set(arr)];
}

function flattenPoints(value){
  if(!value) return [];

  if(Array.isArray(value)){
    return value.flatMap(flattenPoints);
  }

  if(typeof value === "object"){
    return Object.values(value).flatMap(flattenPoints);
  }

  return [String(value)];
}

function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function displayLabel(label){
  return LABEL_NAMES[label] || label.replaceAll("_"," ");
}

function buildPool(){
  const p = [];

  for(const [key,points] of Object.entries(RAW_DATA.Categories_de_points)){
    p.push({
      key,
      mainGroup:"Categories_de_points",
      name:DISPLAY_NAMES[key] || key,
      points:unique(flattenPoints(points))
    });
  }

  const sections = [
    "Points_d_ouverture_des_merveilleux_vaisseaux",
    "Points_Hui_Reunion",
    "Points_generaux",
    "Les_4_mers",
    "Points_fenetre_du_ciel",
    "Points_pour_faire_revenir_le_Yang",
    "Points_fantomes_de_Sun_Si_Miao"
  ];

  sections.forEach(section=>{
    let pts = [];
    pts = flattenPoints(RAW_DATA[section]);
    pts = unique(pts);

    if(pts.length >= 4){
      p.push({
        key:section,
        mainGroup:section,
        name:DISPLAY_NAMES[section] || section,
        points:pts
      });
    }
  });

  return p.filter(cat=>cat.points.length >= 4);
}
function toggleSettings(){
  const panel = document.getElementById("settingsPanel");

  panel.style.display =
    panel.style.display === "none"
      ? "block"
      : "none";

  if(panel.style.display !== "none"){
    showProgressHintSoon(
      "display_options",
      "#settingsPanel",
      "Affichage",
      "Fond, lettres, halo, taille : règle le jeu pour qu’il soit confortable pour toi."
    );
  }
}

function shakeTile(tile){

  tile.classList.remove("shake");

  void tile.offsetWidth;

  tile.classList.add("shake");

  setTimeout(()=>{
    tile.classList.remove("shake");
  },350);
}

function hasConflict(cat, chosen){
  return chosen.some(other =>
    cat.points.some(p => other.points.includes(p))
  );
}

function chooseCompatibleCategories(){

  const byKey = Object.fromEntries(
    pool.map(cat => [canonicalAssociationKey(cat.key), cat])
  );

  const associationSets =
    Object.keys(
      typeof ASSOCIATION_EXPLANATIONS !== "undefined"
        ? ASSOCIATION_EXPLANATIONS
        : {}
    )
      .map(key =>
        key
          .split("__")
          .map(canonicalAssociationKey)
          .map(categoryKey => byKey[categoryKey])
          .filter(Boolean)
      )
      .filter(set => set.length >= 2 && set.length <= 4);

  function setIsCompatible(cats){
    const chosen = [];

    for(const cat of cats){
      if(!cat) return false;
      if(chosen.includes(cat)) continue;
      if(hasConflict(cat, chosen)) return false;
      chosen.push(cat);
    }

    return true;
  }

  for(let attempt=0; attempt<3000; attempt++){

    const chosen = [];

    const possibleAssociationSets =
      weightedShuffleAssociationSets(
        associationSets.filter(set => setIsCompatible(set))
      );

    if(possibleAssociationSets.length){
      possibleAssociationSets[0].forEach(cat=>{
        if(!chosen.includes(cat) && !hasConflict(cat, chosen)){
          chosen.push(cat);
        }
      });
    }

    const candidates = weightedShuffleCategories(pool);

    for(const cat of candidates){
      if(chosen.includes(cat)) continue;
      if(hasConflict(cat, chosen)) continue;

      chosen.push(cat);

      if(chosen.length === 4){
        return chosen;
      }
    }
  }

  alert("Impossible de trouver 4 catégories compatibles.");
  return [];
}

function fillManualSelectors(){

  const savedKeys =
    JSON.parse(
      localStorage.getItem("mtc_manual_categories") || "[]"
    );

  manualChecklist.innerHTML = "";

  pool.forEach(cat=>{
    const label = document.createElement("label");
    label.className = "manual-checkitem";

    const checked =
      savedKeys.includes(cat.key)
        ? "checked"
        : "";

    label.innerHTML = `
      <input
        type="checkbox"
        value="${cat.key}"
        ${checked}
        onchange="saveManualCategories()"
      >
      ${cat.name}
    `;

    manualChecklist.appendChild(label);
  });
}

function saveManualCategories(){

  const checkedKeys =
    [...manualChecklist.querySelectorAll("input:checked")]
      .map(input => input.value);

  localStorage.setItem(
    "mtc_manual_categories",
    JSON.stringify(checkedKeys)
  );
}

function canBuildCategorySet(categories){
  const chosen = [];
  const usedMainGroups = new Set();

  for(const cat of shuffle(categories)){
    if(usedMainGroups.has(cat.mainGroup)) continue;

    chosen.push(cat);
    usedMainGroups.add(cat.mainGroup);

    if(chosen.length === 4){
      return chosen;
    }
  }

  return [];
}

function chooseManualCategories(){
  const checkedKeys =
    [...manualChecklist.querySelectorAll("input:checked")]
      .map(input => input.value);

      localStorage.setItem(
      "mtc_manual_categories",
      JSON.stringify(checkedKeys)
    );

  if(checkedKeys.length < 4){
    message.textContent =
      "Choisis au moins 4 catégories.";
    return [];
  }

  const selectedCats =
    checkedKeys
      .map(key => pool.find(cat => cat.key === key))
      .filter(Boolean);

  return shuffle(selectedCats).slice(0,4);
}

function toggleManualMode(){
  pool = buildPool();
  fillManualSelectors();

  if(currentMode() === "manual"){
    manualEditButton.style.display = "inline-block";
    manualControls.style.display = "flex";
  }else{
    manualEditButton.style.display = "none";
    manualControls.style.display = "none";
  }
}

function toggleManualChecklist(){
  manualControls.style.display =
    manualControls.style.display === "none"
      ? "flex"
      : "none";
}

function applySettings(){
  const settings = {
    pageBg:localStorage.getItem("mtc_pageBg") || "#ffffff",
    tileBg:localStorage.getItem("mtc_tileBg") || "#ffffff",
    text:localStorage.getItem("mtc_text") || "#111111",
    shadow:localStorage.getItem("mtc_shadow") || "#0000FF",
    fontSize:localStorage.getItem("mtc_fontSize") || "12"
  };

  document.documentElement.style.setProperty("--page-bg", settings.pageBg);
  document.documentElement.style.setProperty("--tile-bg", settings.tileBg);
  document.documentElement.style.setProperty(  "--selected-text-color", getContrastColor(settings.tileBg));
  generateCategoryColors();
  document.documentElement.style.setProperty("--text-color", settings.text);
  document.documentElement.style.setProperty("--shadow-color", settings.shadow);
  document.documentElement.style.setProperty("--ui-font-size", settings.fontSize+"px");

  pageBgPicker.value = settings.pageBg;
  textPicker.value = settings.text;
  shadowPicker.value = settings.shadow;
  fontSizeSlider.value = settings.fontSize;

  if(localStorage.getItem("mtc_darkroom") === "1"){
    document.body.classList.add("darkroom");
  }else{
    document.body.classList.remove("darkroom");
  }

  if(localStorage.getItem("mtc_night_invert") === "1"){
  document.body.classList.add("night-invert");
}else{
  document.body.classList.remove("night-invert");
}
}

function getContrastColor(hex){
  if(!hex) return "#ffffff";

  hex = hex.replace("#","");

  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);

  const luminance =
    0.299 * r + 0.587 * g + 0.114 * b;

  return luminance > 186
    ? "#111111"
    : "#ffffff";
}


function hexToRgb(hex){
  hex = hex.replace("#","");
  return {
    r:parseInt(hex.substring(0,2),16),
    g:parseInt(hex.substring(2,4),16),
    b:parseInt(hex.substring(4,6),16)
  };
}

function rgbToHex(r,g,b){
  return "#" + [r,g,b].map(x=>{
    x = Math.max(0,Math.min(255,Math.round(x)));
    return x.toString(16).padStart(2,"0");
  }).join("");
}

function mixColors(hex1, hex2, amount){
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);

  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount
  );
}

function generateCategoryColors(){
  const base =
    localStorage.getItem("mtc_tileBg") || "#ffffff";

  CATEGORY_COLORS = [
    mixColors(base,"#ffffff",0.38),
    mixColors(base,"#ffffff",0.48),
    mixColors(base,"#000000",0.38),
    mixColors(base,"#000000",0.48)
  ];
}

function saveColorSetting(key,value,cssVar){
  localStorage.setItem(key,value);
  document.documentElement.style.setProperty(cssVar,value);
  updateSelectionFeedback();
}

function distributeBoard(groups){
  const allPoints = [];

  groups.forEach(group=>{
    group.points.forEach(point=>{
      allPoints.push({
        point: point,
        groupKey: group.key
      });
    });
  });

  for(let attempt=0; attempt<5000; attempt++){
    const shuffled = shuffle(allPoints);
    let ok = true;

    for(let row=0; row<4; row++){
      const rowItems = shuffled.slice(row*4, row*4+4);
      const rowGroups = rowItems.map(item=>item.groupKey);

      if(new Set(rowGroups).size < 3){
        ok = false;
        break;
      }
    }

    for(let col=0; col<4; col++){
      const colItems = [
        shuffled[col],
        shuffled[col+4],
        shuffled[col+8],
        shuffled[col+12]
      ];

      const colGroups = colItems.map(item=>item.groupKey);

      if(new Set(colGroups).size < 3){
        ok = false;
        break;
      }
    }

    if(ok){
      return shuffled.map(item=>item.point);
    }
  }

  return shuffle(allPoints).map(item=>item.point);
}

function pickFourVariedPoints(categoryKey, points){
  const uniquePoints = [...new Set(points)];

  if(uniquePoints.length <= 4){
    return shuffle(uniquePoints);
  }

  const historyKey = "mtc_recent_points_" + categoryKey;

  const recent =
    JSON.parse(localStorage.getItem(historyKey) || "[]");

  let preferred =
    uniquePoints.filter(p => !recent.includes(p));

  if(preferred.length < 4){
    preferred = uniquePoints;
  }

  const picked =
    shuffle(preferred).slice(0,4);

  const newRecent =
    [...picked, ...recent]
      .filter((p,index,self) => self.indexOf(p) === index)
      .slice(0, Math.min(uniquePoints.length, 12));

  localStorage.setItem(
    historyKey,
    JSON.stringify(newRecent)
  );

  return picked;
}


function revealAllSolutions(){
  if(solvedCount >= 4){
    return;
  }

  solution.forEach(group=>{
    if(!group.solved){
      group._solvedBy = "reveal";
      solveGroup(group);
    }
  });

  finalGuess.style.display = "none";
  finalGuessChoices.innerHTML = "";
  finalGuess.dataset.correctKey = "";

  message.textContent = "Toutes les solutions ont été révélées.";
}


function getCurrentStudyDomainForTutorial(){
  const domain =
    document.documentElement.getAttribute("data-study-domain") ||
    window.MTC_STUDY_DOMAIN ||
    "";

  return domain === "pharmacology" || domain === "acupuncture"
    ? domain
    : "";
}

function tutorialSeenKeyForDomain(domain){
  return domain === "pharmacology"
    ? "mtc_tutorial_seen_pharmacology"
    : "mtc_tutorial_seen_acupuncture";
}

function hasSeenTutorialForDomain(domain){
  if(!domain) return true;

  try{
    if(localStorage.getItem(tutorialSeenKeyForDomain(domain)) === "1"){
      return true;
    }

    /* Compatibilité : l’ancienne clé globale ne vaut que pour ACU.
       Elle ne doit pas empêcher le tuto PHARMA de se lancer. */
    if(domain === "acupuncture" && localStorage.getItem("mtc_tutorial_seen") === "1"){
      return true;
    }
  }catch(error){}

  return false;
}

function markTutorialSeenForCurrentDomain(){
  const domain = getCurrentStudyDomainForTutorial() || "acupuncture";

  try{
    localStorage.setItem(tutorialSeenKeyForDomain(domain), "1");

    if(domain === "acupuncture"){
      localStorage.setItem("mtc_tutorial_seen", "1");
    }
  }catch(error){}
}

function maybeStartTutorialForCurrentDomain(delay = 0){
  const domain = getCurrentStudyDomainForTutorial();

  if(!domain || hasSeenTutorialForDomain(domain)){
    return;
  }

  setTimeout(()=>{
    if(
      getCurrentStudyDomainForTutorial() === domain &&
      !document.getElementById("tourBox") &&
      !document.getElementById("tutorialOverlay")
    ){
      startTour();
    }
  }, delay);
}

function showTutorial(){

  const domain = getCurrentStudyDomainForTutorial() || "acupuncture";
  const isPharmaTour = domain === "pharmacology";

  const overlay = document.createElement("div");
  overlay.id = "tutorialOverlay";

  overlay.innerHTML = `
    <div class="tutorial-box">

      <h2>Bienvenue dans Connections MTC</h2>

      <p>
        ${isPharmaTour
          ? "Trouve les 4 classes de substances médicinales cachées parmi les 16 SM affichées."
          : "Trouve les 4 catégories de points cachées parmi les 16 points affichés."}
      </p>

      <ol>
        ${isPharmaTour
          ? `
            <li>Sélectionne 4 SM.</li>
            <li>Si les 4 appartiennent à la même classe, elle est validée.</li>
            <li>Trouve les 4 classes pour terminer la partie.</li>
            <li>À la fin, clique sur les SM validées pour consulter leur fiche détaillée.</li>
          `
          : `
            <li>Sélectionne 4 points.</li>
            <li>Si les 4 appartiennent à la même catégorie, elle est validée.</li>
            <li>Trouve les 4 catégories pour terminer la partie.</li>
            <li>À la fin, clique sur les points validés pour consulter leur fiche détaillée.</li>
          `}
      </ol>

      <button id="closeTutorial">
        OK
      </button>

    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("closeTutorial")
    .onclick = ()=>{

      markTutorialSeenForCurrentDomain();

      overlay.remove();
    };
}

function showEndReviewScreen(mode){

  document.body.classList.add("game-finished");

  showCategoryInfoButtons();

  const title =
    mode === "win"
      ? "BRAVO !"
      : mode === "tour"
        ? "DÉMONSTRATION"
        : "GAME OVER !";

  const subtitle =
    mode === "win"
      ? " "
      : mode === "tour"
        ? "Regarde les éléments de révision autour de la grille."
        : "Tu peux maintenant aller dans les détails si tu veux :)";

  message.innerHTML = `
    <div class="game-over-title ${mode === "win" ? "bravo-punch" : ""}">
      ${title}
    </div>

    <div class="game-over-subtitle mtc-final-detail-hint">
      ${subtitle}
    </div>

    ${mtcEndReviewHtml()}
  `;

  showAssociationLinks();

  showProgressHintSoon(
    "review_bulbs",
    ".category-info-button",
    "Réviser les catégories",
    "En cliquant sur une ampoule, tu ouvres un post-it pour réviser la catégorie. Tu peux le déplacer."
  );

  showProgressHintSoon(
    "review_associations",
    ".association-link-plus",
    "Associations",
    "Les traits colorés relient les catégories qui fonctionnent ensemble. En cliquant sur +, tu ouvres la fiche de l’association.",
    {},
    760
  );
}

function triggerGameOver(reason){

  gameOver = true;
  recordStatsGameFinished(false);

  revealAllSolutions();

  showEndReviewScreen("gameover");
}

function updateGameStatus(){
  if(lifeDisplay) lifeDisplay.textContent = mtcLivesText();
  if(cheatDisplay) cheatDisplay.textContent = mtcHintsText();

  if(typeof hintButton !== "undefined" && hintButton){
    const limit = getMtcHintLimit();
    const disabled = gameOver || limit <= 0 || cheatCount >= limit;
    hintButton.disabled = disabled;
    hintButton.style.opacity = disabled ? "0.35" : "1";
    hintButton.style.pointerEvents = disabled ? "none" : "auto";
  }
}

let tourStep = 0;
let tourSteps = [];

function startTour(){
  endTour(false);
  document.body.classList.add("tour-active");
  document.documentElement.classList.add("tour-active");
  try{ window.scrollTo({ left:0, top:window.scrollY, behavior:"auto" }); }catch(error){}

  closeCheatsheetPanel();
  closePointPanel();

  const currentTourDomain = getCurrentStudyDomainForTutorial();

  if(!currentTourDomain){
    if(typeof window.showStudyDomainChooser === "function"){
      window.showStudyDomainChooser();
    }
    return;
  }

  const isPharmaTour = currentTourDomain === "pharmacology";

  if(isPharmaTour && typeof window.startPharmaGame === "function"){
    const gridHasPharmaTiles =
      document.querySelector("#grid .pharma-tile") ||
      document.querySelector("#solved .pharma-solved-point");

    if(!gridHasPharmaTiles){
      window.startPharmaGame();
    }
  }

  const sharedSteps = [
    {
      selector: ".topbar-row button[onclick='newGame()']",
      title: "Nouvelle partie",
      text: isPharmaTour
        ? "Ce bouton relance une grille PHARMA avec 4 classes de SM."
        : "Ce bouton relance une grille ACU avec 4 catégories de points."
    },
    {
      selector: ".topbar-row button[onclick='toggleSettings()']",
      title: "Affichage",
      text: isPharmaTour
        ? "Ici tu peux ajuster les couleurs, le halo, la taille du texte et l’affichage des noms communs au survol."
        : "Ici tu peux ajuster les couleurs, le halo et la taille du texte pour que la grille soit confortable."
    },
    {
      selector: ".practice-row .mode-switch",
      title: "Auto / Manuel",
      text: isPharmaTour
        ? "En Auto, le jeu choisit les classes. En Manuel, tu choisis les classes de SM à réviser, avec une option pour privilégier les SM essentielles. Plus tu joues, plus le tirage peut s’adapter à tes lacunes."
        : "En Auto, le jeu choisit les catégories. En Manuel, tu choisis ce que tu veux réviser. Le curseur Facile / Difficile aide aussi le jeu à adapter le tirage à tes besoins."
    },
    {
      selector: "#jokerBubble",
      title: "Vies et astuces",
      text: isPharmaTour
        ? "Tu as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une classe de SM."
        : "Tu as cinq ♥ vies et cinq ☘︎ astuces. Une erreur coûte une ♥ vie ; une astuce peut t’aider à retrouver une catégorie."
    },
    {
      selector: "#gameplayModeReviewBtn",
      title: "🕊️ Révision douce",
      text: isPharmaTour
        ? "La colombe active la Révision douce : plus d’astuces et des erreurs presque illimitées, pour explorer les SM et leurs classes sans pression. Reclique dessus pour revenir au mode normal."
        : "La colombe active la Révision douce : plus d’astuces et des erreurs presque illimitées, pour revoir les points et les catégories sans pression. Reclique dessus pour revenir au mode normal.",
      fallback: () => document.querySelector("#gameplayModeSwitch") || document.querySelector("#jokerBubble")
    },
    {
      selector: "#gameplayModeExamBtn",
      title: "🦖 Mode examen",
      text: isPharmaTour
        ? "Le dinosaure active le Mode examen : pas d’astuces, erreurs limitées et stats séparées. C’est le mode pour vérifier ce que tu sais vraiment sur les classes de SM. Reclique dessus pour revenir au mode normal."
        : "Le dinosaure active le Mode examen : pas d’astuces, erreurs limitées et stats séparées. C’est le mode pour vérifier ce que tu sais vraiment sur les points et les catégories. Reclique dessus pour revenir au mode normal.",
      fallback: () => document.querySelector("#gameplayModeSwitch") || document.querySelector("#jokerBubble")
    },
    {
      selector: "#cheatsheetButton",
      title: "Cheatsheet",
      text: isPharmaTour
        ? "Le Cheatsheet PHARMA sert de mémo rapide pour les SM, les classes et les repères essentiels."
        : "Le Cheatsheet ACU sert de mémo rapide pour les points, les catégories et les grands repères du cours."
    },
    {
      selector: "#statsButton",
      title: "Stats",
      text: isPharmaTour
        ? "Les Stats PHARMA montrent les SM et les classes déjà travaillées. Les analyses détaillées apparaissent seulement après 10 parties terminées."
        : "Les Stats ACU montrent les points et les catégories déjà travaillés. Les analyses détaillées apparaissent seulement après 10 parties terminées.",
      fallback: () => document.querySelector("#footerTitle"),
      position:"aboveBottom"
    },
    {
      selector: "#advancedSearchButton",
      title: "Recherche",
      text: isPharmaTour
        ? "Ici tu peux filtrer les SM par nom, pinyin, classe, nature, saveur, tropisme ou texte de fiche."
        : "Ici tu peux filtrer les points par mot-clé, catégorie, canal, correspondance, fonctions, indications ou notes.",
      fallback: () => document.querySelector("#footerTitle"),
      position:"aboveBottom"
    },
    {
      selector: "#reviewBasketButton",
      title: "Panier",
      text: isPharmaTour
        ? "Le Panier sert à mettre des SM de côté pour les réviser plus tard."
        : "Le Panier sert à mettre des points de côté pour les réviser plus tard.",
      fallback: () => document.querySelector("#footerTitle"),
      position:"aboveBottom"
    },
    {
      selector: "#comparisonButton",
      title: "Comparaison",
      text: isPharmaTour
        ? "Après avoir choisi des SM dans le panier, le panneau Comparaison s’ouvre pour les regarder côte à côte."
        : "Après avoir choisi des points dans le panier, le panneau Comparaison s’ouvre pour les regarder côte à côte.",
      fallback: () => document.querySelector("#footerTitle"),
      position:"aboveBottom"
    },
    {
      selector: "#suggestionMailButton",
      title: "Suggestions",
      text: "Tu peux m’envoyer une suggestion, une correction ou une idée d’amélioration ici.",
      fallback: () => document.querySelector("#footerTitle"),
      position:"aboveBottom"
    },
    {
      selector: "#grid",
      title: " ",
      text: isPharmaTour ? "Bonnes révisions PHARMA !" : "Bonnes révisions ACU !"
    }
  ];

  tourSteps = [
    {
      selector: "#grid",
      title: "La grille",
      text: isPharmaTour
        ? "Le but du jeu est de retrouver les 4 classes cachées parmi les 16 substances médicinales affichées. Clique sur les SM qui appartiennent à la même classe."
        : "Le but du jeu est de retrouver les 4 catégories cachées parmi les 16 points affichés. Clique sur les points qui vont ensemble pour proposer une catégorie.",
      disableGridClick:true
    },
    ...sharedSteps
  ];

  tourStep = 0;
  showTourStep();
}

function supportCoffeeVisualHtml(){
  return `
    <div class="support-coffee-visual" aria-hidden="true">
      <!-- Taille : voir --support-coffee-image-size dans le CSS -->
      <div class="support-coffee-spin">
        <img src="me.png" alt="" onerror="this.remove()">
      </div>
    </div>
  `;
}

function supportCoffeeMessageHtml(text){
  return `
    <div class="support-coffee-message support-coffee-message-no-image">
      <div class="support-coffee-text">${text}</div>
    </div>
  `;
}

function showTourStep(){
  const step = tourSteps[tourStep];

  if(!step){
    endTour(true);
    return;
  }

  if(typeof step.before === "function"){
    step.before();
  }

  let target = document.querySelector(step.selector);

  if(!target && typeof step.fallback === "function"){
    target = step.fallback();
  }

  if(!target && !step._retriedAfterBefore){
    step._retriedAfterBefore = true;
    setTimeout(showTourStep, 160);
    return;
  }

  if(!target){
    tourStep++;
    showTourStep();
    return;
  }

  document.body.classList.toggle(
    "tour-disable-grid",
    !!step.disableGridClick
  );

  document
    .querySelectorAll(".tour-highlight")
    .forEach(el=>el.classList.remove("tour-highlight"));

  let overlay = document.getElementById("tourOverlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "tourOverlay";
    document.body.appendChild(overlay);
  }

  let box = document.getElementById("tourBox");
  if(!box){
    box = document.createElement("div");
    box.id = "tourBox";
    document.body.appendChild(box);
  }

  target.classList.add("tour-highlight");

  if(step.selector === "#supportCoffeeButton"){
    rememberSupportCoffeeReminderShown();
  }

  try{
    target.scrollIntoView({
      block:"center",
      inline:"nearest",
      behavior:"auto"
    });
  }catch(error){}

  try{
    if(window.scrollX){
      window.scrollTo({ left:0, top:window.scrollY, behavior:"auto" });
    }
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }catch(error){}

  box.innerHTML = `
    <h3>${step.title}</h3>
    ${step.selector === "#supportCoffeeButton" ? supportCoffeeMessageHtml(step.text) : `<div>${step.text}</div>`}

    <div class="tour-actions">
      <button onclick="endTour(true)">Passer</button>
      <button onclick="previousTourStep()">Retour</button>
      <button onclick="nextTourStep()">
        ${tourStep === tourSteps.length - 1 ? "Terminer" : "Suivant"}
      </button>
    </div>
  `;

  requestAnimationFrame(()=>{
    const rect = target.getBoundingClientRect();
    positionTourBox(box, rect, step);
    try{
      if(window.innerWidth <= 520 && window.scrollX){
        window.scrollTo({ left:0, top:window.scrollY, behavior:"auto" });
      }
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
    }catch(error){}
  });
}

function positionTourBox(box, rect, step = {}){
  const margin = 10;
  const isSmall = window.innerWidth <= 520;

  const boxWidth = isSmall
    ? Math.min(292, window.innerWidth - 20)
    : Math.min(320, window.innerWidth - 24);

  box.style.width = boxWidth + "px";
  box.style.maxHeight = Math.min(260, window.innerHeight - 24) + "px";

  const boxHeight = Math.min(
    box.offsetHeight || 180,
    window.innerHeight - 24
  );

  let left;
  let top;
  let placement = "bottom";

  if(step.position === "aboveBottom"){
    const bottomBlock =
      document.querySelector(".bottom-actions") ||
      document.querySelector("#jokerBubble");

    const bottomRect = bottomBlock
      ? bottomBlock.getBoundingClientRect()
      : rect;

    left = bottomRect.left + bottomRect.width / 2 - boxWidth / 2;
    top = bottomRect.top - boxHeight - 14;
    placement = "top";
  }else{
    left = rect.left + rect.width / 2 - boxWidth / 2;
    top = rect.bottom + 12;
    placement = "bottom";

    if(top + boxHeight > window.innerHeight - margin){
      top = rect.top - boxHeight - 12;
      placement = "top";
    }
  }

  if(left < margin) left = margin;

  if(left + boxWidth > window.innerWidth - margin){
    left = window.innerWidth - boxWidth - margin;
  }

  if(top < margin){
    top = margin;
  }

  if(top + boxHeight > window.innerHeight - margin){
    top = Math.max(margin, window.innerHeight - boxHeight - margin);
  }

  const targetCenter = rect.left + rect.width / 2;
  const arrowLeft = Math.max(
    18,
    Math.min(boxWidth - 18, targetCenter - left)
  );

  box.dataset.placement = placement;
  box.style.setProperty("--tour-arrow-left", arrowLeft + "px");
  box.style.left = left + "px";
  box.style.top = top + "px";
}

let progressHintActive = false;

function progressHintKey(id){
  return "mtc_progress_hint_" + id;
}

function showProgressHint(id, selector, title, text, options = {}){

  if(!id || !selector) return;

  if(document.getElementById("tourBox")) return;
  if(progressHintActive) return;

  if(localStorage.getItem(progressHintKey(id)) === "1"){
    return;
  }

  const target = document.querySelector(selector);
  if(!target) return;

  progressHintActive = true;
  localStorage.setItem(progressHintKey(id), "1");

  document
    .querySelectorAll(".tour-highlight")
    .forEach(el=>el.classList.remove("tour-highlight"));

  let overlay = document.getElementById("tourOverlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "tourOverlay";
    document.body.appendChild(overlay);
  }

  const box = document.createElement("div");
  box.id = "tourBox";
  box.className = "progress-hint-box";

  box.innerHTML = `
    <h3>${title}</h3>
    <div>${text}</div>

    <div class="tour-actions">
      <button type="button" class="progress-hint-ok">OK</button>
    </div>
  `;

  document.body.appendChild(box);
  target.classList.add("tour-highlight");

  function closeHint(){
    target.classList.remove("tour-highlight");
    if(box) box.remove();
    if(overlay) overlay.remove();
    progressHintActive = false;
  }

  const okButton =
    box.querySelector(".progress-hint-ok");

  okButton.addEventListener("pointerdown", event=>{
    event.stopPropagation();
  });

  okButton.addEventListener("click", event=>{
    event.preventDefault();
    event.stopPropagation();
    closeHint();
  });

  try{
    target.scrollIntoView({
      block:"center",
      inline:"center",
      behavior:"smooth"
    });
  }catch(error){}

  setTimeout(()=>{
    const rect = target.getBoundingClientRect();
    positionTourBox(box, rect, options);
  }, 120);
}

function showProgressHintSoon(id, selector, title, text, options = {}, delay = 260){
  setTimeout(()=>{
    showProgressHint(id, selector, title, text, options);
  }, delay);
}


const MTC_SUPPORT_COFFEE_CLICKED_KEY =
  "mtc_support_coffee_clicked";

const MTC_SUPPORT_COFFEE_FIRST_SEEN_KEY =
  "mtc_support_coffee_first_seen_at";

const MTC_SUPPORT_COFFEE_LAST_SESSION_KEY =
  "mtc_support_coffee_last_session_at";

const MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY =
  "mtc_support_coffee_return_eligible";

const MTC_SUPPORT_COFFEE_LAST_HINT_KEY =
  "mtc_support_coffee_last_hint_at";

const MTC_SUPPORT_COFFEE_RETURN_DELAY_MS =
  24 * 60 * 60 * 1000;

const MTC_SUPPORT_COFFEE_INTERVAL_MS =
  7 * 24 * 60 * 60 * 1000;

const SUPPORT_COFFEE_REMINDER_TITLE =
  "Me soutenir";

const SUPPORT_COFFEE_REMINDER_TEXT =
  "J'ai conçue ce jeu dans un esprit d’entraide. Seule la construction de la base de données m'a pris plusieurs mois... Toute contribution est bienvenue ❤️‍🔥 et me permettra de nourrir mon sang pendant le développement d'autres outils similaires.";

let supportBloodDropState = null;
let supportBloodDropFrame = null;

function markSupportCoffeeClicked(){
  localStorage.setItem(
    MTC_SUPPORT_COFFEE_CLICKED_KEY,
    "1"
  );

  hideSupportBloodDrop();
}

function rememberSupportCoffeeReminderShown(){
  localStorage.setItem(
    MTC_SUPPORT_COFFEE_LAST_HINT_KEY,
    String(Date.now())
  );
}

function registerSupportCoffeeVisit(){
  const now = Date.now();

  const firstSeen =
    Number(
      localStorage.getItem(MTC_SUPPORT_COFFEE_FIRST_SEEN_KEY) || "0"
    );

  if(!firstSeen){
    localStorage.setItem(
      MTC_SUPPORT_COFFEE_FIRST_SEEN_KEY,
      String(now)
    );
  }

  const lastSession =
    Number(
      localStorage.getItem(MTC_SUPPORT_COFFEE_LAST_SESSION_KEY) || "0"
    );

  if(
    lastSession &&
    now - lastSession >= MTC_SUPPORT_COFFEE_RETURN_DELAY_MS
  ){
    localStorage.setItem(
      MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY,
      "1"
    );
  }

  localStorage.setItem(
    MTC_SUPPORT_COFFEE_LAST_SESSION_KEY,
    String(now)
  );
}

function hasSupportCoffeeClicked(){
  return localStorage.getItem(MTC_SUPPORT_COFFEE_CLICKED_KEY) === "1";
}

function isSupportCoffeeReminderEligible(){

  if(hasSupportCoffeeClicked()){
    return false;
  }

  if(!document.getElementById("supportCoffeeButton")){
    return false;
  }

  if(
    localStorage.getItem(MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY) !== "1"
  ){
    return false;
  }

  const lastShown =
    Number(
      localStorage.getItem(MTC_SUPPORT_COFFEE_LAST_HINT_KEY) || "0"
    );

  if(!lastShown){
    return true;
  }

  return Date.now() - lastShown >= MTC_SUPPORT_COFFEE_INTERVAL_MS;
}

function shouldReplaySupportCoffeeReminder(){

  if(!isSupportCoffeeReminderEligible()){
    return false;
  }

  if(document.getElementById("tourBox")){
    return false;
  }

  if(progressHintActive){
    return false;
  }

  return true;
}

function supportCoffeeTarget(){
  return (
    document.getElementById("supportCoffeeButton") ||
    document.getElementById("footerTitle")
  );
}

function showSupportCoffeeReminder(){

  const target = supportCoffeeTarget();

  if(!target) return false;

  progressHintActive = true;
  rememberSupportCoffeeReminderShown();

  document
    .querySelectorAll(".tour-highlight")
    .forEach(el=>el.classList.remove("tour-highlight"));

  let overlay = document.getElementById("tourOverlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "tourOverlay";
    document.body.appendChild(overlay);
  }

  const existingBox = document.getElementById("tourBox");
  if(existingBox){
    existingBox.remove();
  }

  const box = document.createElement("div");
  box.id = "tourBox";
  box.className = "progress-hint-box support-coffee-reminder-box";

  box.innerHTML = `
    <h3>${SUPPORT_COFFEE_REMINDER_TITLE}</h3>
    ${supportCoffeeMessageHtml(SUPPORT_COFFEE_REMINDER_TEXT)}

    <div class="tour-actions support-coffee-choice-actions">
      <button type="button" class="support-coffee-reminder-donate">Je donne</button>
      <button type="button" class="support-coffee-reminder-later">Non, désolé</button>
    </div>
  `;

  document.body.appendChild(box);
  target.classList.add("tour-highlight");

  function closeSupportCoffeeReminder({restoreDrop = false} = {}){
    target.classList.remove("tour-highlight");
    if(box) box.remove();
    if(overlay) overlay.remove();
    progressHintActive = false;

    if(restoreDrop){
      hideSupportBloodDrop();
    }else if(
      typeof showSupportBloodDrop === "function" &&
      !hasSupportCoffeeClicked() &&
      localStorage.getItem(MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY) === "1"
    ){
      /* Après “Non, désolé”, la goutte reste tombée et continue
         à interagir avec les panneaux du bas. */
      showSupportBloodDrop();
    }
  }

  const donateButton =
    box.querySelector(".support-coffee-reminder-donate");

  const laterButton =
    box.querySelector(".support-coffee-reminder-later");

  [donateButton, laterButton].forEach(button=>{
    if(!button) return;

    button.addEventListener("pointerdown", event=>{
      event.stopPropagation();
    });
  });

  if(donateButton){
    donateButton.addEventListener("click", event=>{
      event.preventDefault();
      event.stopPropagation();

      const supportLink =
        document.getElementById("supportCoffeeButton")?.getAttribute("href") ||
        "https://paypal.me/emesepap1";

      markSupportCoffeeClicked();
      closeSupportCoffeeReminder({restoreDrop:true});

      try{
        window.open(supportLink, "_blank", "noopener,noreferrer");
      }catch(error){}
    });
  }

  if(laterButton){
    laterButton.addEventListener("click", event=>{
      event.preventDefault();
      event.stopPropagation();
      closeSupportCoffeeReminder({restoreDrop:false});
    });
  }

  setTimeout(()=>{
    const rect = target.getBoundingClientRect();
    positionTourBox(
      box,
      rect,
      {
        fallback: () => document.querySelector("#footerTitle"),
        position:"aboveBottom"
      }
    );
  }, 80);

  return true;
}

function handleSupportCoffeeButtonClick(event, link){

  if(event){
    if(event.__supportCoffeeButtonHandled){
      return false;
    }

    event.__supportCoffeeButtonHandled = true;
    event.preventDefault();
    event.stopPropagation();
  }

  if(hasSupportCoffeeClicked()){
    const href =
      link?.getAttribute("href") ||
      "https://paypal.me/emesepap1";

    try{
      window.open(href, "_blank", "noopener,noreferrer");
    }catch(error){}

    return false;
  }

  localStorage.setItem(
    MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY,
    "1"
  );

  showSupportCoffeeReminder();

  return false;
}
function panelGroundForSupportBloodDrop(dropWidth, dropHeight){
  /*
    Sol réel = bas visible de l'écran.
    On ne tient pas compte du footbar.

    Petite correction visuelle : les emojis ont souvent un peu de blanc interne
    en bas de leur boîte de texte. On autorise donc la boîte du bouton à descendre
    de quelques pixels, pour que la goutte VISUELLE touche vraiment le bas,
    sans disparaître.
  */
  const visualFloorOverlap =
    Math.min(5, Math.max(2, dropHeight * .14));

  let ground =
    window.innerHeight - dropHeight + visualFloorOverlap;

  document
    .querySelectorAll(
      ".stats-panel.open, .advanced-search-panel.open, .review-basket-panel.open, .comparison-panel.open"
    )
    .forEach(panel=>{
      const rect = panel.getBoundingClientRect();

      if(
        rect.top > 0 &&
        rect.top < window.innerHeight &&
        rect.height > 40
      ){
        ground = Math.min(
          ground,
          rect.top - dropHeight + 2
        );
      }
    });

  return Math.max(-visualFloorOverlap, ground);
}

function createSupportCoffeeButtonPlaceholder(drop, rect, computedStyle){
  let placeholder =
    document.getElementById("supportCoffeeButtonPlaceholder");

  if(placeholder){
    placeholder.remove();
  }

  placeholder = document.createElement("span");
  placeholder.id = "supportCoffeeButtonPlaceholder";
  placeholder.className = "support-coffee-button-placeholder";
  placeholder.setAttribute("aria-hidden", "true");

  const width = Math.max(1, rect.width || 30);
  const height = Math.max(1, rect.height || 30);

  placeholder.style.setProperty(
    "--support-blooddrop-placeholder-width",
    width + "px"
  );

  placeholder.style.setProperty(
    "--support-blooddrop-placeholder-height",
    height + "px"
  );

  placeholder.style.order = computedStyle.order || "0";
  placeholder.style.flex = `0 0 ${width}px`;

  if(drop.parentNode){
    drop.parentNode.insertBefore(placeholder, drop);
  }

  return placeholder;
}

function prepareSupportCoffeeButtonForPhysics(drop, rect, computedStyle){

  if(!drop) return null;

  if(!drop.dataset.supportBlooddropOriginalHtml){
    drop.dataset.supportBlooddropOriginalHtml = drop.innerHTML;
  }

  const originalParent = drop.parentNode;

  createSupportCoffeeButtonPlaceholder(
    drop,
    rect,
    computedStyle
  );

  if(originalParent && originalParent.id){
    drop.dataset.supportBlooddropOriginalParentId = originalParent.id;
  }

  drop.style.setProperty(
    "--support-blooddrop-live-width",
    Math.max(1, rect.width || 30) + "px"
  );

  drop.style.setProperty(
    "--support-blooddrop-live-height",
    Math.max(1, rect.height || 30) + "px"
  );

  drop.style.setProperty(
    "--support-blooddrop-live-font-size",
    computedStyle.fontSize || "1.3em"
  );

  drop.style.setProperty(
    "--support-blooddrop-angle",
    "0deg"
  );

  drop.innerHTML = `
    <span class="support-blooddrop-core" aria-hidden="true">🩸</span>
  `;

  /* Important : le footer est transformé avec translateX(-50%).
     Un élément position:fixed à l'intérieur d'un parent transformé peut être
     positionné relativement à ce parent, ce qui fait disparaître la goutte.
     On déplace donc le vrai bouton dans body pendant la chute, et un
     placeholder garde sa place dans le footer. */
  if(drop.parentNode !== document.body){
    document.body.appendChild(drop);
  }

  return drop;
}

function restoreSupportCoffeeButtonToFooter(drop){
  if(!drop) return;

  const placeholder =
    document.getElementById("supportCoffeeButtonPlaceholder");

  if(placeholder && placeholder.parentNode){
    placeholder.parentNode.insertBefore(drop, placeholder);
    placeholder.remove();
    return;
  }

  const originalParentId =
    drop.dataset.supportBlooddropOriginalParentId || "";

  const originalParent =
    originalParentId
      ? document.getElementById(originalParentId)
      : null;

  if(originalParent){
    originalParent.appendChild(drop);
    return;
  }

  const footerIconTools =
    document.querySelector(".footer-icon-tools");

  if(footerIconTools){
    footerIconTools.appendChild(drop);
  }
}

function hideSupportBloodDrop(){
  const drop = document.getElementById("supportCoffeeButton");

  if(drop){
    drop.classList.remove(
      "support-blooddrop-moving",
      "support-blooddrop-visible",
      "support-blooddrop-idle"
    );

    restoreSupportCoffeeButtonToFooter(drop);

    drop.style.removeProperty("transform");
    drop.style.removeProperty("left");
    drop.style.removeProperty("top");
    drop.style.removeProperty("right");
    drop.style.removeProperty("bottom");
    drop.style.removeProperty("position");
    drop.style.removeProperty("--support-blooddrop-live-width");
    drop.style.removeProperty("--support-blooddrop-live-height");
    drop.style.removeProperty("--support-blooddrop-live-font-size");
    drop.style.setProperty("--support-blooddrop-angle", "0deg");

    if(drop.dataset.supportBlooddropOriginalHtml){
      drop.innerHTML = drop.dataset.supportBlooddropOriginalHtml;
      delete drop.dataset.supportBlooddropOriginalHtml;
    }

    delete drop.dataset.supportBlooddropOriginalParentId;
  }

  const placeholder =
    document.getElementById("supportCoffeeButtonPlaceholder");

  if(placeholder){
    placeholder.remove();
  }

  if(supportBloodDropFrame){
    cancelAnimationFrame(supportBloodDropFrame);
    supportBloodDropFrame = null;
  }

  supportBloodDropState = null;
}

function showSupportBloodDrop(){

  if(hasSupportCoffeeClicked()){
    hideSupportBloodDrop();
    return;
  }

  let drop = document.getElementById("supportCoffeeButton");

  if(!drop) return;

  if(
    drop.classList.contains("support-blooddrop-moving") &&
    supportBloodDropState
  ){
    if(!supportBloodDropFrame){
      supportBloodDropFrame =
        requestAnimationFrame(stepSupportBloodDropPhysics);
    }
    return;
  }

  if(drop.classList.contains("support-blooddrop-moving")){
    hideSupportBloodDrop();
    drop = document.getElementById("supportCoffeeButton");
    if(!drop) return;
  }

  const beforeRect = drop.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(drop);

  if(
    beforeRect.width <= 0 ||
    beforeRect.height <= 0
  ){
    return;
  }

  const startX =
    clampAssociationNumber(
      beforeRect.left,
      6,
      Math.max(6, window.innerWidth - beforeRect.width - 6)
    );

  const startY =
    clampAssociationNumber(
      beforeRect.top,
      -beforeRect.height - 12,
      Math.max(-beforeRect.height - 12, window.innerHeight - beforeRect.height - 6)
    );

  prepareSupportCoffeeButtonForPhysics(
    drop,
    beforeRect,
    computedStyle
  );

  drop.classList.add(
    "support-blooddrop-moving",
    "support-blooddrop-visible"
  );

  supportBloodDropState = {
    x:startX,
    y:startY,
    vx:0,
    vy:.10,
    angle:0,
    lastTime:performance.now(),
    settled:false
  };

  drop.style.setProperty(
    "transform",
    `translate3d(${startX}px, ${startY}px, 0) rotate(0deg)`,
    "important"
  );

  if(!supportBloodDropFrame){
    supportBloodDropFrame =
      requestAnimationFrame(stepSupportBloodDropPhysics);
  }
}

function stepSupportBloodDropPhysics(time){
  const drop = document.getElementById("supportCoffeeButton");

  if(
    !drop ||
    !drop.classList.contains("support-blooddrop-moving") ||
    !supportBloodDropState ||
    hasSupportCoffeeClicked()
  ){
    hideSupportBloodDrop();
    return;
  }

  const state = supportBloodDropState;

  const dropRect = drop.getBoundingClientRect();
  const dropWidth =
    Math.max(1, drop.offsetWidth || dropRect.width || 30);
  const dropHeight =
    Math.max(1, drop.offsetHeight || dropRect.height || 30);

  const dt =
    Math.min(
      32,
      Math.max(8, time - state.lastTime)
    ) / 16.6667;

  state.lastTime = time;

  const groundY =
    panelGroundForSupportBloodDrop(dropWidth, dropHeight);

  const leftWall = 6;
  const rightWall =
    Math.max(leftWall, window.innerWidth - dropWidth - 6);

  const panelMovedUp =
    state.y > groundY;

  state.vy += .26 * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  if(state.x < leftWall){
    state.x = leftWall;
    state.vx = 0;
  }

  if(state.x > rightWall){
    state.x = rightWall;
    state.vx = 0;
  }

  if(state.y >= groundY){
    const impact =
      Math.max(
        Math.abs(state.vy),
        panelMovedUp ? 2.4 : 0
      );

    state.y = groundY;

    if(impact > .82){
      state.vy =
        -impact * .32;

      /* Pas de déplacement latéral aléatoire : la goutte rebondit seulement. */
      state.vx = 0;
    }else{
      state.vy = 0;
      state.vx *= .90;
    }

    state.vx *= .975;
  }

  if(state.y < groundY - 1){
    drop.classList.remove("support-blooddrop-idle");
  }else if(
    Math.abs(state.vx) < .028 &&
    Math.abs(state.vy) < .055
  ){
    drop.classList.add("support-blooddrop-idle");
    state.vx = 0;
    state.vy = 0;
  }else{
    drop.classList.remove("support-blooddrop-idle");
  }

  /* Pas de rotation finale ni de roulade : uniquement chute + rebond vertical. */
  state.angle = 0;

  drop.style.setProperty(
    "--support-blooddrop-angle",
    "0deg"
  );

  drop.style.setProperty(
    "transform",
    `translate3d(${state.x}px, ${state.y}px, 0) rotate(0deg)`,
    "important"
  );

  supportBloodDropFrame =
    requestAnimationFrame(stepSupportBloodDropPhysics);
}

function maybeReplaySupportCoffeeReminder(){

  if(hasSupportCoffeeClicked()){
    hideSupportBloodDrop();
    return;
  }

  if(
    localStorage.getItem(MTC_SUPPORT_COFFEE_RETURN_ELIGIBLE_KEY) === "1"
  ){
    showSupportBloodDrop();
  }

  if(shouldReplaySupportCoffeeReminder()){
    showSupportCoffeeReminder();
    return;
  }

  if(
    !hasSupportCoffeeClicked() &&
    (
      document.getElementById("tourBox") ||
      progressHintActive
    )
  ){
    setTimeout(maybeReplaySupportCoffeeReminder, 60 * 1000);
  }
}

function setupSupportCoffeeReminder(){

  registerSupportCoffeeVisit();

  const button =
    document.getElementById("supportCoffeeButton");

  if(button){
    button.addEventListener(
      "click",
      event=>{
        handleSupportCoffeeButtonClick(event, button);
      },
      {capture:true}
    );

    button.addEventListener(
      "auxclick",
      event=>{
        handleSupportCoffeeButtonClick(event, button);
      },
      {capture:true}
    );

    button.addEventListener(
      "keydown",
      event=>{
        if(event.key === "Enter" || event.key === " "){
          handleSupportCoffeeButtonClick(event, button);
        }
      },
      {capture:true}
    );
  }

  window.addEventListener(
    "resize",
    ()=>{
      if(supportBloodDropState){
        supportBloodDropState.lastTime = performance.now();
      }
    },
    {passive:true}
  );

  setTimeout(maybeReplaySupportCoffeeReminder, 1800);

  setInterval(
    maybeReplaySupportCoffeeReminder,
    60 * 60 * 1000
  );
}



function setupGuidedTourManualDemo(){

  closeCheatsheetPanel();
  closePointPanel();
  removeAssociationLinks();

  document
    .querySelectorAll(".category-postit, .association-postit")
    .forEach(el=>el.remove());

  if(!pool || pool.length === 0){
    pool = buildPool();
  }

  modeToggle.checked = true;
  manualEditButton.style.display = "inline-block";
  manualControls.style.display = "none";

  selected = [];
  solution = [];
  solvedCount = 0;
  categoryColors = {};
  hintCategory = null;
  hintStep = 0;
  mistakeCount = 0;
  cheatCount = 0;
  currentAcuRunErrors = [];
  gameOver = false;

  updateGameStatus();

  document.body.classList.remove("game-complete");
  document.body.classList.remove("game-finished");

  message.innerHTML = `
    <div class="game-over-subtitle">
      Visite guidée : partie manuelle de démonstration.
    </div>
  `;

  hint.textContent = "";
  solved.innerHTML = "";
  grid.innerHTML = "";

  finalGuess.style.display = "none";
  finalGuess.dataset.correctKey = "";
  finalGuessChoices.innerHTML = "";

  const wantedKeys = [
    "Points_Jing_Puits",
    "Points_Ying_Jaillissement",
    "Points_Shu_Riviere",
    "Points_Jing_Fleuve"
  ];

  const demoCats = wantedKeys
    .map(findCategoryByCanonicalKey)
    .filter(Boolean);

  const cats =
    demoCats.length === 4
      ? demoCats
      : chooseCompatibleCategories();

  if(!cats || cats.length !== 4){
    newGame();
updateBasketCount();
    return;
  }

  cats.forEach((cat,index)=>{
    const alreadyUsed =
      solution.flatMap(g => g.points || []);

    const availablePoints =
      cat.points.filter(p => !alreadyUsed.includes(p));

    const pts =
      availablePoints.length >= 4
        ? pickFourVariedPoints(cat.key, availablePoints)
        : pickFourVariedPoints(cat.key, cat.points);

    categoryColors[cat.key] =
      CATEGORY_COLORS[index] || "#cccccc";

    solution.push({
      key:cat.key,
      name:cat.name,
      points:pts,
      solved:false
    });
  });

  renderCurrentBoard();
}

function findCategoryByCanonicalKey(key){
  const canonicalKey = canonicalAssociationKey(key);

  return pool.find(cat =>
    canonicalAssociationKey(cat.key) === canonicalKey
  );
}

function renderCurrentBoard(){
  grid.innerHTML = "";

  recordStatsGameStarted(solution);

  const board = distributeBoard(solution);

  if(!board || board.length !== 16){
    message.textContent = "Erreur : la grille de démonstration n’a pas pu être générée.";
    return;
  }

  board.forEach(point=>{
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.point = point;
    tile.innerHTML = `<span>${formatPointCode(point)}</span>`;
    tile.onclick = () => toggleTile(tile, point);
    grid.appendChild(tile);
  });

}

function prepareGuidedTourReviewDemo(){

  if(!solution || solution.length !== 4){
    setupGuidedTourManualDemo();
  }

  if(solvedCount < 4){
    gameOver = true;

    solution.forEach(group=>{
      if(!group.solved){
        solveGroup(group);
      }
    });

    finalGuess.style.display = "none";
    finalGuessChoices.innerHTML = "";
    finalGuess.dataset.correctKey = "";
  }

  gameOver = true;
  document.body.classList.add("game-complete");
  showEndReviewScreen("tour");
}

function openGuidedTourCategoryPostit(){
  if(document.querySelector(".category-postit")) return;

  const button = document.querySelector(".category-info-button");

  if(button){
    toggleCategoryExplanation(button);
  }
}

function closeGuidedTourCategoryPostits(){
  document
    .querySelectorAll(".category-postit")
    .forEach(el=>el.remove());
}

function openGuidedTourAssociationPostit(){
  document
    .querySelectorAll(".association-postit")
    .forEach(el=>el.remove());

  const button = document.querySelector(".association-link-plus");

  if(button){
    const key = button.dataset.associationKey;
    const color = associationLinkColorsByKey[key] || button.style.background || "#0000FF";
    toggleAssociationPostit(key, color);
  }
}

function openGuidedTourPointPanel(){
  const point =
    solution?.[0]?.points?.[0] ||
    document.querySelector(".solved-point")?.dataset.point;

  if(point){
    openPointPanelDirect(point);
  }
}

function nextTourStep(){
  tourStep++;
  showTourStep();
}

function previousTourStep(){
  if(tourStep > 0){
    tourStep--;
    showTourStep();
  }
}

function endTour(save){
  document.body.classList.remove("tour-disable-grid", "tour-active");
  document.documentElement.classList.remove("tour-active");

  document
    .querySelectorAll(".tour-highlight")
    .forEach(el=>el.classList.remove("tour-highlight"));

  const overlay = document.getElementById("tourOverlay");
  const box = document.getElementById("tourBox");

  if(overlay) overlay.remove();
  if(box) box.remove();

  if(save){
    markTutorialSeenForCurrentDomain();

    if(!localStorage.getItem(MTC_SUPPORT_COFFEE_LAST_HINT_KEY)){
      rememberSupportCoffeeReminderShown();
    }
  }
}

window.addEventListener("resize", ()=>{
  if(document.getElementById("tourBox")){
    showTourStep();
  }
});

function formatPointCode(point){

  return point.replace(
    /^([A-ZÀ-ÿ]+)(\d+)$/,
    "$1 $2"
  );
}

const CATEGORY_EXPLANATIONS = {

  Points_Jing_Puits: [
    "DRAINE LA PLÉNITUDE, DISPERSE LA STAGNATION, CLARIFIE LA CHALEUR",
    "ÉLIMINE L’OBSTRUCTION, DISPERSE LES NOUURES",
    "RÉVEILLE LE CERVEAU, RESTAURE LA CONSCIENCE, OUVRE LES ORIFICES, CALME L’ESPRIT",
    "TRAITE LES ZONES LES PLUS ÉLOIGNÉES DU CANAL",
    "Maladies des organes zàng",
    "Plénitude sous le cœur",
    "Plénitude et stagnations dans les organes zàng et les canaux",
    "Obstruction, nouure des canaux par vide",
    "Maladies de la chaleur",
    "Troubles mentaux, psychoémotionnels",
    "Troubles neurologiques",
    "En hiver pour la prévention, en traitement général, quel que soit l’organe",
    "Au printemps, en cas de pathologie du bois, du foie"
  ],

  Points_Ying_Jaillissement: [
    "CLARIFIE LA CHALEUR VIDE",
    "NOURRIT LE YĪN ET ENRICHIT LE SANG",
    "Maladies qui font changer la couleur du teint, de la peau",
    "Maladie de la chaleur, fièvre",
    "Pathologies des canaux [association possible avec le shū-rivière]",
    "Pathologies des organes zàng [en association avec le shū-rivière]",
    "Au printemps pour prévenir les pathologies qui font changer de couleur le teint ou d’autres tissus",
    "En été en cas de pathologie du cœur/feu"
  ],

  Points_Shu_Riviere: [
    "SOUTIENT LE QÌ ET TIÉDIT LE YÁNG",
    "TRANSFORME L’HUMIDITÉ",
    "Maladies avec alternance d’amélioration et d’aggravation",
    "Douleur et lourdeur du corps et des articulations",
    "Maladie de l’humidité",
    "Maladies par vide de qì, vide de yáng, stagnation de qì",
    "Pathologies des canaux [association possible avec le yíng-jaillissement]",
    "Pathologies des organes zàng [en association avec le yíng-jaillissement]",
    "En été, pour prévenir les pathologies avec alternance d’amélioration et d’aggravation",
    "En fin d’été, en cas de pathologie de la rate/terre"
  ],

  Points_Jing_Fleuve: [
    "MOBILISE LE QÌ DU MÉRIDIEN",
    "LIBÈRE LA SURFACE",
    "TRAITE LES TENDONS ET LES OS",
    "Maladies avec changement du son de la voix, de la respiration, de la toux ou avec des bruits intestinaux, clapotis dans l’estomac, etc.",
    "Pathologies des os et des tendons des canaux yīn",
    "Stagnation de qì dans les jīng luò",
    "Toux, dyspnée, asthme",
    "Fièvre et frissons, syndrome grippal, refroidissement, etc.",
    "En fin d’été, pour prévenir les pathologies qui entraînent du bruit (toux, asthme, troubles intestinaux, etc.)",
    "En automne, en cas de pathologie du poumon/métal"
  ],

  Points_He_Reunion: [
    "TRAITE L’INVERSION",
    "MET EN ORDRE LA TRANSFORMATION DU QÌ DES ORGANES",
    "Stase de sang, stagnation de qì dans les canaux",
    "Maladie de l’estomac, diarrhée",
    "Maladies provenant d’une alimentation déréglée",
    "Inversion du qì",
    "Dérèglement des fonctions des organes fǔ",
    "Maladies de la peau pour les canaux yáng",
    "En automne, pour prévenir les pathologies induites par une stase de sang ou les maladies de l’estomac",
    "En hiver, en cas de pathologie des reins/eau",
    "Le point hé-réunion agit puissamment sur la surface"
  ],

  Points_Yuan_Source: [
    "TONIFIE LE QÌ ET RÉCHAUFFE LE YÁNG",
    "MOBILISE LE QÌ ET LE YUÁN QÌ",
    "RÉGULARISE YĪN YÁNG",
    "TRAITE LE VIDE ET LA PLÉNITUDE",
    "TRAITE LES ORGANES ET LES CANAUX",
    "Maladies par vide de qì, vide de yáng, stagnation de qì",
    "Maladies des organes zàng fǔ et des canaux et vaisseaux liaisons",
    "Maladies avec dérèglement du yīn et/ou du yáng"
  ],

  Points_Xi_Crevasse: [
    "MOBILISE LE QÌ ET ARRÊTE LA DOULEUR",
    "ARRÊTE LES SAIGNEMENTS PAR STAGNATION DE QÌ DES CANAUX YĪN",
    "SERT D’OUTIL DE DIAGNOSTIC POUR LA STAGNATION DU QÌ ET DU SANG",
    "Stase de sang, stagnation de qì dans les canaux avec douleur aiguë",
    "Saignements, hémorragies par stagnation de qì"
  ],

  Points_Luo_Liaison: [
    "RÉGULARISE EN SURFACE LA MICROCIRCULATION DU QÌ ET DU SANG ET EXPULSE LES PERVERS RETENUS",
    "FAVORISE EN PROFONDEUR LE TRANSFERT DE QÌ ENTRE LES CANAUX ET LE DISTRIBUE VERS LES AUTRES CATÉGORIES DE POINTS",
    "SERT D’OUTIL DE DIAGNOSTIC",
    "RÉGULARISE LES ÉMOTIONS",
    "Stase de sang, stagnation de qì dans les canaux",
    "Maladies des organes zàng fǔ et des canaux et vaisseaux liaisons",
    "Facteur pathogène caché",
    "Maladies des 6 organes creux",
    "Maladies complexes qui impliquent plusieurs organes zàng fǔ et systèmes",
    "Syndromes des vaisseaux liaisons luò-liaison"
  ],

  Points_Bei_Shu_Transport_du_dos: [
    "TRAITE LES MALADIES YĪN",
    "TRAITE DES MALADIES QUI SE DIRIGENT VERS LE YÁNG : L’EXTERNE ET LE HAUT (ÉGALEMENT PEAU, TENDON ET MUSCLES)",
    "TRAITE L’ORGANE DE SENS ASSOCIÉ À L’ORGANE ZÀNG FǓ MAIS NE TRAITE PAS SON CANAL DIRECTEMENT",
    "SERT D’OUTIL DE DIAGNOSTIC POUR LA MALADIE DES YĪN QUI VOYAGE DANS LE YÁNG",
    "Maladies yīn : froid, humidité, maladies de vide et maladies chroniques, maladies du sang, des liquides, du jīng, maladies des 5 zàng, maladies des organes zàng qui se manifestent vers les organes fǔ",
    "Douleur sourde, chronique, demande de palpation",
    "Maladies des organes des sens",
    "Maladies de l’interne se manifestant vers l’externe",
    "Maladies du bas se manifestant vers le haut"
  ],

  Points_Mu_Collecteur: [
    "TRAITE LES MALADIES DE TYPE YÁNG",
    "TRAITE LE DYSFONCTIONNEMENT DES ORGANES FǓ SEULS",
    "TRAITE LE DYSFONCTIONNEMENT DES ORGANES FǓ QUI AFFECTENT LES ORGANES ZÀNG",
    "TRAITE LES MALADIES QUI VOYAGENT DU YÁNG VERS LE YĪN",
    "Maladies yáng : chaleur, stagnation, accumulation, oppression, maladie par déséquilibre du qì, maladie par déséquilibre du shén par le yáng, maladie de plénitude, maladie aiguë, maladie récente",
    "Maladie de l’externe se manifestant dans l’interne",
    "Maladie du haut se manifestant vers le bas",
    "Douleur forte, symptômes intenses, refus de palpation"
  ],

  Points_Xia_He_Reunion: [
    "Traitent les organes fǔ correspondants"
  ],

  Points_d_ouverture_des_merveilleux_vaisseaux: [
    "Traitent les merveilleux vaisseaux correspondants"
  ],

  Points_Hui_Reunion: [
    "Orientent le traitement vers un tissu spécifique"
  ],

  Points_generaux: [
    "E 36 : Point zǒng-général de l’abdomen",
    "V 40 : Point zǒng-général des lombes et du dos",
    "P 7 : Point zǒng-général de la tête et de la nuque",
    "GI 4 : Point zǒng-général de la face et de la bouche",
    "EC 6 : Point zǒng-général de la poitrine et des hypocondres",
    "Rt 6 : Point zǒng-général de l’abdomen inférieur",
    "DM 26 : Point zǒng-général pour la réanimation"
  ],

  Les_4_mers: [
    "Réserves de ressources"
  ],

  Points_fenetre_du_ciel: [
    "Régularisent le qì vers et depuis la tête et peuvent donc avoir un effet sur l’esprit",
    "Régularisent le qì vers et depuis la tête et peuvent donc faire descendre l’inversion et traiter les troubles de la tête"
  ],

  Points_pour_faire_revenir_le_Yang: [
    "Traitent l’effondrement du qì / yáng, situations d’urgence"
  ],

  Points_fantomes_de_Sun_Si_Miao: [
    "Traitement du shén propre à Sūn Sī Miǎo"
  ]

};

const ASSOCIATION_EXPLANATIONS = {

  "Points_Jing_Puits__Points_Ying_Jaillissement": [
    "Ils clarifient la chaleur plénitude ou déficience des organes zàng.",
    "Ils désobstruent et régularisent la circulation du qì des canaux en général et en cas d’obstruction par nouure de chaleur en particulier.",
    "Ils régularisent la circulation du sang dans les canaux en éliminant la stase et en vivifiant le sang.",
    "Pathologies qui se manifestent par un tableau de chaleur interne ou externe, par plénitude ou déficience.",
    "Trouble mental, psychique, émotionnel par chaleur vide ou plénitude, par vide de yīn ou vide de sang, par stagnation de qì ou stase de sang et désobstruent les orifices des organes de sens et du cœur."
  ],

  "Points_Jing_Puits__Points_Shu_Riviere": [
    "Ils tonifient le qì des organes zàng et des canaux et régularise la circulation de yáng qì.",
    "Ils clarifient et éliminent la chaleur humidité, désobstruent les canaux et les organes zàng fǔ et soulagent la douleur lourde et chaude due à la chaleur humidité.",
    "Ils régularisent la circulation du qì dans les canaux, éliminent l’obstruction qu’elle soit due à la chaleur ou à l’humidité, et les douleurs dues à la stagnation de qì ou au vide de qì.",
    "Toute douleur due à la chaleur se manifestant par rougeur et brûlure.",
    "Les maladies des organes zàng qui alternent avec des périodes d’amélioration et d’aggravation.",
    "Des troubles mentaux, psychiques et émotionnels dues au vide de qì, au vide de yáng, à la chaleur, à la stagnation et à l’humidité."
  ],

  "Points_Jing_Puits__Points_Jing_Fleuve": [
    "Ils désobstruent les canaux et régulariser la circulation du qì et du sang.",
    "Ils libèrent la surface de l’attaque externe, désobstruent les orifices, apaisent l’esprit dans le cas d’une attaque de facteur pathogène externe.",
    "Toute maladie se manifestant par un bruit inhabituel sur les canaux ou dans les organes zàng (zone sous l’estomac inclue) : toux, dyspnée, asthme, voix rauque, aphonie, borborygmes, flatulences, clapotis de l’estomac, ainsi que toute douleur ou restriction de mouvement associées à un bruit comme craquement articulaire.",
    "L’atteinte par la chaleur des tendons et des os des canaux yīn."
  ],

  "Points_Jing_Puits__Points_He_Reunion": [
    "Ils dispersent la stase de sang dans les canaux et les organes zàng fǔ et soulagent la douleur pongitive.",
    "Ils régularisent le système digestif blessé par une alimentation irrégulière et incorrecte.",
    "Ils régularisent les mouvements de qì des organes zàng fǔ et traitent tout type de contre-courant.",
    "Ils harmonisent et organisent le système des canaux et des organes zàng fǔ.",
    "Toute douleur due à la chaleur se manifestant par rougeur et brûlure.",
    "Les maladies des organes zàng qui alternent avec des périodes d’amélioration et d’aggravation.",
    "Troubles mentaux, psychiques et émotionnels dues au vide de qì, au vide de yáng, à la chaleur, à la stagnation et à l’humidité."
  ],

  "Points_Jing_Puits__Points_Yuan_Source": [
    "Ils renforcent les organes zàng en qì, en yáng et tonifient leur yuán qì.",
    "Ils restaurent yuán qì affaibli par une déperdition de liquides à cause d’une maladie de la chaleur.",
    "Ils régularisent la circulation dans les canaux atteints par une maladie de plénitude ou de vide.",
    "Tout trouble psychique, mental, émotionnel qui se caractérise par une déficience de yuán qì."
  ],

  "Points_Jing_Puits__Points_Luo_Liaison": [
    "Ils régularisent la circulation lorsque plusieurs canaux sont touchés en même temps.",
    "Des maladies complexes qui touchent plusieurs organes zàng fǔ en même temps.",
    "La maladie de la chaleur quand elle touche plusieurs systèmes et régularise la microcirculation lésée par la chaleur.",
    "Les troubles psychiques dus à la rétention d’un facteur pathogène et de la stase de sang."
  ],

  "Points_Jing_Puits__Points_Xi_Crevasse__Points_Bei_Shu_Transport_du_dos__Points_Luo_Liaison": [
    "Ajouter à cette association le POINT LUÒ-LIAISON permettra d’élargir cette action sur d’autres zàng fǔ impliqués dans le déséquilibre. Le point bèi shù-transport du dos régularisera encore mieux la circulation de qì et de sang dans cet organe pour soulager la douleur et arrêter le saignement éventuel."
  ],

  "Points_Jing_Puits__Points_Xi_Crevasse": [
    "Désobstruent la circulation du qì dans les canaux et arrêtent le saignement par stagnation de qì des canaux yīn, surtout lorsque cette stagnation est due à l’accumulation de chaleur.",
    "Traitent la douleur en désobstruant la circulation du qì dans les canaux et arrêtent le saignement par stagnation de qì des canaux yīn, surtout lorsque cette stagnation est due à l’accumulation de chaleur."
  ],

  "Points_Jing_Puits__Points_Bei_Shu_Transport_du_dos": [
    "Maladies de vide, les maladies chroniques, surtout lorsqu’elles impliquent la chaleur.",
    "Épuisement du yīn par la chaleur.",
    "Maladies des organes de sens dues à la stagnation dans les canaux ou à la chaleur.",
    "Tout déséquilibre de l’esprit dû à un mouvement de bas vers le haut, du yīn vers le yáng."
  ],

  "Points_Jing_Puits__Points_Mu_Collecteur": [
    "Ils clarifient la chaleur plénitude ou chaleur vide et libèrent la stagnation dans les organes zàng.",
    "Maladies des organes zàng conditionnées par une atteinte de l’organe fǔ associé.",
    "Tout déséquilibre psychique dû à une atteinte externe de chaleur."
  ],

  "Points_Ying_Jaillissement__Points_Shu_Riviere": [
    "Sur les canaux yīn, ils traitent les maladies des organes zàng.",
    "Ils tonifient le yīn et le yáng, le qì et le sang.",
    "Les maladies qui se manifestent par crises de montée de fièvre (émission de chaleur) suivies d’épisodes de baisse de la fièvre (émission de chaleur).",
    "Les maladies des canaux.",
    "Les maladies des canaux lorsque ces maladies se manifestent par un changement de couleur dans son contexte le plus large.",
    "Les maladies de la chaleur humidité qui se caractérisent par lourdeur, chaleur et rougeur."
  ],

  "Points_Ying_Jaillissement__Points_Jing_Fleuve": [
    "Ils libèrent la surface, surtout lorsque l’émission de chaleur est plus importante que l’intensité des frissons et la crainte du froid.",
    "Ils nourrissent en yīn et en sang les tendons et les os des canaux yīn et répondent aux maladies de vide qui affaiblissent et fragilisent les os et les tendons.",
    "Ils désobstruent les canaux, régularisent leur circulation et arrêtent la douleur.",
    "Les maladies qui présentent un changement de la couleur habituelle et la présence de sons et de bruits inhabituels.",
    "Tout trouble respiratoire incluant la présence de chaleur plénitude ou chaleur vide."
  ],

  "Points_Ying_Jaillissement__Points_He_Reunion": [
    "Ils régularisent les fonctions des organes zàng fǔ et des canaux perturbées par la chaleur plénitude ou chaleur vide ou/et par vide de yīn / vide de sang.",
    "Toute stase de sang et stagnation de qì, toute maladie alimentaire, toute dermatose et tout contre-courant qui se manifestent par un changement de couleur.",
    "Toute stase de sang et stagnation de qì, toute maladie alimentaire, toute dermatose et tout contre-courant provoqués par la chaleur plénitude ou chaleur vide.",
    "Les maladies des organes fǔ causées par la chaleur plénitude ou chaleur vide.",
    "Les dermatoses dues à un vide de yīn et vide de sang."
  ],

  "Points_Ying_Jaillissement__Points_Yuan_Source": [
    "Les maladies qui se manifestent par un changement de couleur dû à un vide de qì ou vide de yáng.",
    "Les maladies complexes qui intègrent une déficience simultanée de vide de qì et de sang, vide de yáng et de vide de yīn, ou bien des maladies dont la racine est la déficience de yuán qì qui provoque un vide de yīn et vide de yáng.",
    "Toute pathologie de canal ou d’organe zàng qui se manifeste par un vide ou par une stagnation de yuán qì.",
    "Les maladies de vide de qì qui génère une chaleur déficience chaleur vide."
  ],

  "Points_Ying_Jaillissement__Points_Luo_Liaison": [
    "Ils régularisent la microcirculation et les systèmes souffrant simultanément par le vide de sang.",
    "Ils interviennent pour restaurer l’équilibre des zàng fǔ atteints principalement par la chaleur plénitude ou chaleur vide et par le vide de sang et de vide de yīn.",
    "Maladie de la chaleur plénitude ou chaleur vide quand elle touche plusieurs systèmes simultanément et régularise la microcirculation lésée par la chaleur."
  ],

  "Points_Ying_Jaillissement__Points_Xi_Crevasse": [
    "Ils soulagent la douleur, en régularisant la circulation dans les canaux perturbée par une stagnation de qì provoquée par la chaleur ou générant de la chaleur.",
    "Ils arrêtent le saignement causé par une stagnation de qì résultant d’une chaleur plénitude ou chaleur vide et par le vide de sang et de vide de yīn."
  ],

  "Points_Ying_Jaillissement__Points_Bei_Shu_Transport_du_dos": [
    "Maladies de vide de sang et de vide de yīn des organes zàng.",
    "Organes de sens lésés par une chaleur plénitude ou chaleur vide, par le vide de sang et de vide de yīn.",
    "Maladies du froid et de l’humidité qui empêchent la bonne production du sang.",
    "Maladies de la chaleur qui lèse les liquides dans leur sens le plus général."
  ],

  "Points_Ying_Jaillissement__Points_Mu_Collecteur": [
    "Maladie de la chaleur.",
    "Vide de sang et de vide de yīn lésés par la chaleur.",
    "Maladies des organes zàng, causées par un dérèglement des organes fǔ surtout sur un terrain de chaleur, de vide de sang et de vide de yīn."
  ],

  "Points_Shu_Riviere__Points_Jing_Fleuve": [
    "Ils désobstruent la stagnation de qì (par plénitude ou vide) et libèrent la circulation dans les canaux.",
    "Maladies des os et des tendons des canaux yīn, les maladies respiratoires et les maladies qui se caractérisent par des bruits inhabituels, ainsi que l’atteinte de la surface quand ces pathologies se caractérisent par une alternance d’amélioration et d’aggravation ou quand elles apparaissent par des périodes (heures, mois…).",
    "Maladies des tendons et des os, accompagnées de douleur et provoquées par le facteur pathogène de l’humidité.",
    "Déséquilibre du poumon par vide de qì et vide de yáng ou par stagnation de qì.",
    "Attaque de la surface associée à un terrain interne d’humidité et de vide de qì."
  ],

  "Points_Shu_Riviere__Points_He_Reunion": [
    "Ils régularisent la circulation de qì dans les canaux, dispersent la stase de sang de qì.",
    "Ils régularisent les fonctions des organes zàng fǔ qui souffrent d’un vide de qì, vide de yáng ou de stagnation de qì.",
    "Crises répétitives et par épisodes de toute pathologie se caractérisant par un contre-courant, ainsi que l’alimentation irrégulière caractérisée par des épisodes de boulimie suivis d’épisodes d’anorexie.",
    "Toute dermatose associée à la présence d’humidité."
  ],

  "Points_Shu_Riviere__Points_Yuan_Source": [
    "Ils se potentialisent pour réaliser un traitement plus efficace au niveau de la tonification du qì et du yáng, de la désobstruction du yáng qì et du traitement des maladies de l’humidité.",
    "Ils se potentialisent lorsque l’objectif du traitement est de consolider le qì et le yáng par l’apport de yuán qì.",
    "Toute maladie qui se caractérise par une alternance d’amélioration et d’aggravation associée à une déficience de yuán qì."
  ],

  "Points_Shu_Riviere__Points_Luo_Liaison": [
    "Ils se potentialisent pour libérer la stase de sang et le facteur pathogène emprisonné.",
    "Ils se potentialisent pour régulariser la microcirculation des zones touchées.",
    "Ils se potentialisent pour tonifier, réchauffer et mettre en mouvement le qì et le yáng qì lorsque plusieurs canaux et/ou zàng fǔ sont lésés par le vide, le froid, l’humidité et la stagnation."
  ],

  "Points_Shu_Riviere__Points_Xi_Crevasse": [
    "Ils dispersent la stagnation de qì et arrêtent le saignement.",
    "Douleurs provoquées par la stagnation de qì et résultante d’un vide de qì, d’un vide de yáng, d’une obstruction et d’une accumulation d’humidité."
  ],

  "Points_Shu_Riviere__Points_Bei_Shu_Transport_du_dos": [
    "Ils tonifient le qì et tiédissent le yáng des organes zàng.",
    "La perturbation des fonctions des zàng par stagnation de qì et accumulation d’humidité."
  ],

  "Points_Shu_Riviere__Points_Mu_Collecteur": [
    "Ils se potentialisent dans le traitement de l’humidité.",
    "Stagnation de qì qui affecte les zàng fǔ."
  ],

  "Points_Jing_Fleuve__Points_He_Reunion": [
    "Ils activent la circulation dans les canaux, libèrent la stagnation de qì et dispersent la stase de sang.",
    "Ils se potentialisent dans le traitement des maladies respiratoires provoquées ou accompagnées par un contre-courant.",
    "Ils se potentialisent dans le traitement des dermatoses qui incluent un déséquilibre du poumon, mais aussi des stases de sang.",
    "Ils se potentialisent pour traiter les maladies des os et des tendons qui impliquent une stagnation de qì et une stase de sang.",
    "Maladie d’un organe fǔ dont les symptômes sont accompagnés par une émission de bruit."
  ],

  "Points_Jing_Fleuve__Points_Yuan_Source": [
    "Ils se potentialisent pour traiter les maladies des canaux, des os et des tendons provoquées par le froid, l’humidité, le vide ou la stagnation de qì.",
    "Ils tonifient et réchauffent la faiblesse du poumon.",
    "Ils se potentialisent pour libérer la surface et pour traiter les maladies de la surface qui impliquent simultanément un vide.",
    "Maladie qui se manifeste par des bruits dus à un vide ou à une stagnation."
  ],

  "Points_Jing_Fleuve__Points_Luo_Liaison": [
    "Ils se potentialisent pour traiter les maladies respiratoires et les maladies qui impliquent des bruits qui touchent simultanément plusieurs canaux, plusieurs zàng fǔ.",
    "Ils se potentialisent dans la lutte contre le facteur pathogène externe.",
    "L’atteinte des canaux, des tendons et des os, lorsqu’elle se généralise."
  ],

  "Points_Jing_Fleuve__Points_Xi_Crevasse": [
    "Toute douleur de la surface, incluant la douleur des courbatures pendant l’attaque du froid et la raideur et les spasmes par l’atteinte du vent.",
    "Les maladies respiratoires accompagnées de douleur et de saignement.",
    "Les douleurs tendino-musculaires et articulaires associées à une stagnation de qì et tout déséquilibre qui s’en suit."
  ],

  "Points_Jing_Fleuve__Points_Bei_Shu_Transport_du_dos": [
    "Ils se potentialisent dans le traitement de la maladie respiratoire ou/et dans l’émission de bruit inhabituel.",
    "Ils se potentialisent pour libérer la surface de l’atteinte externe.",
    "Ils se potentialisent dans le traitement des tendons et des os, point bèi shù-transport du dos du foie et des reins."
  ],

  "Points_Jing_Fleuve__Points_Mu_Collecteur": [
    "L’un pour le canal, l’autre pour l’organe fǔ, ils se potentialisent pour régulariser la circulation du qì dans le système des organes yáng.",
    "Ils agissent de concert pour régulariser les organes yáng dont la maladie s’exprime par des bruits et par une perturbation de la respiration.",
    "Ils luttent contre l’invasion du facteur pathogène externe, surtout lorsque son attaque est dirigée directement ou par transmission vers les organes yáng."
  ],

  "Points_He_Reunion__Points_Yuan_Source": [
    "Ils favorisent et désobstruent la circulation dans les canaux, perturbée par vide ou plénitude, par stase de sang, stagnation de qì et par tout facteur pathogène yīn.",
    "Ils régularisent les mouvements de qì et traitent le contre-courant lorsqu’il est dû à un vide de qì ou vide de yáng et de yuán qì, et lorsqu’il est dû à une stagnation de qì.",
    "Ils mobilisent yuán qì et le feu ministre qui sont indispensables pour réguler la digestion et entretenir les fonctions du pivot central de la terre.",
    "Maladies de vide des zàng fǔ et les maladies de stagnation des zàng fǔ."
  ],

  "Points_He_Reunion__Points_Luo_Liaison": [
    "Ils se potentialisent dans la régulation et la désobstruction de la circulation du qì et du sang.",
    "Diarrhée et contre-courant.",
    "Dermatoses et les maladies des organes yáng lorsque plusieurs canaux et organes sont impliqués dans la pathologie."
  ],

  "Points_He_Reunion__Points_Xi_Crevasse": [
    "Ils se potentialisent pour disperser la stagnation dans les canaux et arrêter la douleur.",
    "Ils forment un couple très efficace dans le traitement des douleurs des zàng fǔ et des saignements des zàng."
  ],

  "Points_He_Reunion__Points_Bei_Shu_Transport_du_dos": [
    "Ils régulent et ordonnent les organes zàng.",
    "Dermatoses ayant pour racine un déséquilibre d’un organe yīn et impliquant une lésion du sang avec ou sans présence d’humidité.",
    "Contre-courant qui se caractérise par un mouvement du yīn vers le yáng.",
    "Stases de sang des organes zàng."
  ],

  "Points_He_Reunion__Points_Mu_Collecteur": [
    "Ils constituent une barrière à l’enfoncement du facteur pathogène vers les organes yáng.",
    "Stagnation des organes yáng.",
    "Maladies des organes yáng, surtout par stagnation de qì, stase de sang et contre-courant, et les maladies des organes zàng causées par un dysfonctionnement des organes yáng."
  ],

  "Points_Yuan_Source__Points_Luo_Liaison": [
    "Tonification et transfert de qì d’un canal fort vers un canal faible."
  ],

  "Points_Yuan_Source__Points_Bei_Shu_Transport_du_dos": [
    "Tonification et réchauffement des zàng fǔ."
  ],

  "Points_Yuan_Source__Points_Mu_Collecteur": [
    "Tonification et réchauffement des zàng fǔ."
  ]

};

function newGame(){
  removeAssociationLinks();

  document
    .querySelectorAll(".association-postit")
    .forEach(el=>el.remove());
    
  document.body.classList.remove("game-complete");
  document.body.classList.remove("game-finished");

  mistakeCount = 0;
  cheatCount = 0;
  currentAcuRunErrors = [];
  gameOver = false;

  updateGameStatus();

  if(typeof hintButton !== "undefined"){
    const hintLimit = getMtcHintLimit();
    hintButton.disabled = hintLimit <= 0;
    hintButton.style.opacity = hintLimit <= 0 ? "0.35" : "1";
    hintButton.style.pointerEvents = hintLimit <= 0 ? "none" : "auto";
  }
    if(typeof revealButton !== "undefined"){
      revealButton.style.display = "none";
    }
  selected = [];
  solution = [];
  solvedCount = 0;
  categoryColors = {};
  hintCategory = null;
  hintStep = 0;

  message.textContent = "";
  hint.textContent = "";
  solved.innerHTML = "";
  grid.innerHTML = "";

  finalGuess.style.display = "none";
  finalGuess.dataset.correctKey = "";
  finalGuessChoices.innerHTML = "";

  if(
    !Array.isArray(CATEGORY_COLORS) ||
    CATEGORY_COLORS.length < 4
  ){
    generateCategoryColors();
  }

  const cats =
    currentMode() === "manual"
      ? chooseManualCategories()
      : chooseCompatibleCategories();

  if(!cats || cats.length !== 4){
    message.textContent =
      "Impossible de créer une partie. Choisis plus de catégories ou relance.";
    return;
  }

  cats.forEach((cat,index)=>{
    const alreadyUsed =
      solution.flatMap(g => g.points || []);

    const availablePoints =
      cat.points.filter(p => !alreadyUsed.includes(p));

    const pts =
      availablePoints.length >= 4
        ? pickFourVariedPoints(cat.key, availablePoints)
        : pickFourVariedPoints(cat.key, cat.points);

    categoryColors[cat.key] =
      CATEGORY_COLORS[index] || "#cccccc";

    solution.push({
      key:cat.key,
      name:cat.name,
      points:pts,
      solved:false
    });
  });

  const board = distributeBoard(solution);

  if(!board || board.length !== 16){
    message.textContent =
      "Erreur : la grille n’a pas pu être générée.";
    return;
  }

  board.forEach(point=>{
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.point = point;
    tile.innerHTML = `<span>${formatPointCode(point)}</span>`;
    tile.onclick = () => toggleTile(tile, point);
    grid.appendChild(tile);
  });


  if(currentMode() === "manual"){
    manualControls.style.display =
      currentMode() === "manual"
      ? "flex"
      : "none";
  }

  if(currentMode() === "manual"){
    manualControls.style.display = "none";
    manualEditButton.style.display = "inline-block";
  }else{
    manualControls.style.display = "none";
    manualEditButton.style.display = "none";
  }
}

function getContextLabelForPoint(groupKey, point){
  const usefulSections = [
    "Points_Hui_Reunion",
    "Points_generaux",
    "Les_4_mers",
    "Points_d_ouverture_des_merveilleux_vaisseaux"
  ];

  if(usefulSections.includes(groupKey)){
    const section = RAW_DATA[groupKey];

    for(const [label,points] of Object.entries(section)){
      if(points.includes(point)){
        return displayLabel(label);
      }
    }
  }

  if(groupKey === "Points_Xi_Crevasse"){
    const xiExtra = {
      "Rn8":"Yīn Qiāo Mài",
      "V59":"Yáng Qiāo Mài",
      "Rn9":"Yīn Wéi Mài",
      "VB35":"Yáng Wéi Mài"
    };

    return xiExtra[point] || "";
  }

  if(groupKey === "Points_Yuan_Source"){
    const yuanExtra = {
      "RM15":"Graisses (Gāo)",
      "RM6":"Fascias (Huāng)"
    };

    return yuanExtra[point] || "";
  }

  if(groupKey === "Points_Bei_Shu_Transport_du_dos"){
    const beiShuExtra = {
      "V27":"Intestin Grêle",
      "V28":"Vessie",
      "V22":"Trois Foyers",
      "V19":"Vésicule Biliaire",
      "V25":"Gros Intestin",
      "V21":"Estomac",
      "V13":"Poumon",
      "V20":"Rate",
      "V15":"Cœur",
      "V23":"Rein",
      "V14":"Enveloppe du Cœur",
      "V18":"Foie",
      "V11":"Os",
      "V17":"Sang / Diaphragme",
      "V24":"Qì Hǎi",
      "V26":"Guān Yuán",
      "V29":"Sacrum",
      "V30":"Cercle blanc"
    };

    return beiShuExtra[point] || "";
  }

  return "";
}

function toggleTile(tile, point){
  if(gameOver) return;

  if(window.innerWidth <= 699){
    closePointPanelCompletelyOnMobile();
  }

  // Désélection toujours autorisée
  if(tile.classList.contains("selected")){

    tile.classList.remove("selected");

    selected =
      selected.filter(p => p !== point);

    tile.innerHTML = `<div>${formatPointCode(point)}</div>`;

    updateSelectionFeedback();

    return;
  }

  // Vérification de compatibilité
  if(selected.length > 0){

    const compatible =
      solution.some(group =>
        !group.solved &&
        selected.every(p => group.points.includes(p)) &&
        group.points.includes(point)
      );

    if(!compatible){
      const activeGroup = solution.find(group =>
        !group.solved && selected.every(p => group.points.includes(p))
      );
      const clickedGroup = solution.find(group =>
        !group.solved && group.points.includes(point)
      );
      const detail = {
        activeKey:activeGroup?.key || "",
        clickedKey:clickedGroup?.key || "",
        points:[...selected, point],
        reason:"wrong-point"
      };

      mistakeCount++;
      mtcRecordMistake(detail);
      updateGameStatus();

      shakeTile(tile);

      const limit = getMtcMistakeLimit();
      if(mistakeCount >= limit){
        triggerGameOver("5 erreurs.");
        return;
      }

      message.textContent =
        `Point incompatible. Erreur ${mistakeCount}/${mtcLimitText(limit)}.`;

      return;
    }
  }

  // Sélection
  tile.classList.add("selected");

  if(!selected.includes(point)){
    selected.push(point);
  }

  // Feedback audio immédiat : seulement pour une tuile validement acceptée.
  // Les incompatibilités et les désélections ne déclenchent pas de son.
  if(typeof window.mtcAudioModePlayHanzi === "function"){
    try{
      const pointHanzi = window.POINT_DETAILS && window.POINT_DETAILS[String(point)]
        ? window.POINT_DETAILS[String(point)].hanzi
        : "";
      if(pointHanzi) window.mtcAudioModePlayHanzi(pointHanzi);
    }catch(error){}
  }

  const group = solution.find(g =>
    !g.solved &&
    g.points.includes(point)
  );

  const label =
    group
      ? getContextLabelForPoint(group.key, point)
      : "";

  if(label){

    tile.innerHTML = `
      <div>${formatPointCode(point)}</div>
      <div class="tile-tooltip">${label}</div>
    `;

  }else{

    tile.innerHTML = `
      <div>${formatPointCode(point)}</div>
    `;
  }

  updateSelectionFeedback();

  if(selected.length === 4){
    setTimeout(checkSelection, 220);
  }
}

function updateSelectionFeedback(){
  document.querySelectorAll(".tile").forEach(tile=>{
    tile.style.boxShadow = "";
    tile.style.background = "transparent";
    tile.style.borderColor = "transparent";
    tile.style.filter = "";
    tile.style.color = "var(--text-color)";
    tile.style.opacity = "1";
  });

  if(selected.length === 0) return;

  const matchingGroups = solution.filter(group =>
    !group.solved &&
    selected.every(p => group.points.includes(p))
  );

  if(matchingGroups.length === 1){
    const color = categoryColors[matchingGroups[0].key];

    document.querySelectorAll(".tile.selected").forEach(tile=>{
      tile.style.background = "transparent";
      tile.style.borderColor = "transparent";
      tile.style.boxShadow = "";
      tile.style.filter =
  "drop-shadow(0 0 6px var(--shadow-color)) drop-shadow(0 0 14px var(--shadow-color))";
      tile.style.color = "var(--text-color)";    });

    document.querySelectorAll(".tile.selected").forEach(tile=>{
      tile.style.opacity = "1";
    });

  }else{
    document.querySelectorAll(".tile.selected").forEach(tile=>{
      tile.style.background = "transparent";
      tile.style.borderColor = "transparent";
      tile.style.boxShadow = "";
      tile.style.filter =
  "drop-shadow(0 0 6px var(--shadow-color)) drop-shadow(0 0 14px var(--shadow-color))";
    });
  }
}

function checkSelection(){
  if(gameOver) return;

  const remainingTiles =
    [...document.querySelectorAll(".tile")];

  const remainingGroups =
    solution.filter(g => !g.solved);

  if(remainingTiles.length === 4 && remainingGroups.length === 1){
    clearSelection();
    prepareFinalGuess();

    message.textContent =
      "Dernière étape : les 4 derniers points ne sont pas validés automatiquement. Devine leur catégorie avec les choix proposés.";

    return;
  }

  if(selected.length !== 4){
    message.textContent = "Sélectionne exactement 4 points.";
    return;
  }

  for(const group of solution){
    if(group.solved) continue;

    if(selected.every(p => group.points.includes(p))){
      group._solvedBy = "points";
      solveGroup(group);
      return;
    }
  }

  const detail = {points:selected.slice(), reason:"wrong-combo"};
  mistakeCount++;
  mtcRecordMistake(detail);
  updateGameStatus();

  clearSelection();

  const limit = getMtcMistakeLimit();
  if(mistakeCount >= limit){
    triggerGameOver("5 erreurs.");
    return;
  }

  message.textContent =
    `Combinaison incorrecte ${mistakeCount}/${mtcLimitText(limit)}.`;
}

function colorizePinyin(text){
  if(!text) return "";

  const toneMap = {
    tone1:"āēīōūǖĀĒĪŌŪǕ",
    tone2:"áéíóúǘÁÉÍÓÚǗ",
    tone3:"ǎěǐǒǔǚǍĚǏǑǓǙ",
    tone4:"àèìòùǜÀÈÌÒÙǛ"
  };

  return text.split(/\s+/).map(word=>{
    let toneClass = "";

    for(const [cls,chars] of Object.entries(toneMap)){
      if([...word].some(ch => chars.includes(ch))){
        toneClass = cls;
        break;
      }
    }

    return toneClass
      ? `<span class="${toneClass}">${word}</span>`
      : word;
  }).join(" ");
}

function showPanelHint(){

  const old =
    document.getElementById("panelHint");

  if(old) old.remove();

  const hint =
    document.createElement("div");

  hint.id = "panelHint";
  hint.className = "panel-hint";

  hint.textContent =
    "Clique sur un point pour voir ses détails";

  document.body.appendChild(hint);

  document.body.classList.add("game-finished");

  setTimeout(()=>{
    hint.classList.add("visible");
  },50);

  setTimeout(()=>{

    hint.classList.remove("visible");

    document.body.classList.remove("game-finished");

    setTimeout(()=>{
      hint.remove();
    },500);

  },5000);
}


function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function escapeAttribute(value){
  return escapeHtml(value);
}

const NOTES_STORAGE_PREFIX = "mtc_point_note_";

function noteStorageKey(point){
  return NOTES_STORAGE_PREFIX + String(point);
}

function getEditablePointNote(point, originalNote){
  const saved =
    localStorage.getItem(noteStorageKey(point));

  return saved !== null
    ? saved
    : (originalNote || "");
}

function formatNoteTextForDisplay(value){
  const clean = String(value || "").trim();

  if(!clean){
    return `<span class="point-note-empty">Aucune note pour l’instant.</span>`;
  }

  return escapeHtml(clean).replaceAll("\n","<br>");
}

function savePointNoteFromTextarea(textarea){
  const point = textarea.dataset.point;
  if(!point) return;

  localStorage.setItem(
    noteStorageKey(point),
    textarea.value
  );

  const section = textarea.closest(".point-info-section");
  const display = section?.querySelector(".point-note-display");

  if(display){
    display.innerHTML = formatNoteTextForDisplay(textarea.value);
  }
}

function togglePointNoteEdit(button){
  const section = button.closest(".point-info-section");
  if(!section) return;

  const display = section.querySelector(".point-note-display");
  const textarea = section.querySelector(".point-note-textarea");

  if(!display || !textarea) return;

  const isEditing =
    textarea.style.display !== "none";

  if(isEditing){
    savePointNoteFromTextarea(textarea);
    textarea.style.display = "none";
    display.style.display = "block";
    button.textContent = "✎";
    button.title = "Modifier les notes";
    button.setAttribute("aria-label", "Modifier les notes");
  }else{
    display.style.display = "none";
    textarea.style.display = "block";
    button.textContent = "✓";
    button.title = "Valider les notes";
    button.setAttribute("aria-label", "Valider les notes");
    textarea.focus();
  }
}

function exportPersonalNotes(){
  const notes = {};

  for(let index=0; index<localStorage.length; index++){
    const key = localStorage.key(index);

    if(key && key.startsWith(NOTES_STORAGE_PREFIX)){
      const point = key.slice(NOTES_STORAGE_PREFIX.length);
      notes[point] = localStorage.getItem(key);
    }
  }

  const payload = {
    app:"Connections MTC",
    type:"personal-notes",
    exportedAt:new Date().toISOString(),
    notes
  };

  const blob = new Blob(
    [JSON.stringify(payload,null,2)],
    {type:"application/json"}
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "connections-mtc-notes.json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

function openImportPersonalNotesDialog(){
  const input = document.getElementById("notesImportInput");
  if(input){
    input.value = "";
    input.click();
  }
}

function importPersonalNotesFromFile(input){
  const file = input.files && input.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      const notes = parsed.notes || parsed;

      if(!notes || typeof notes !== "object"){
        throw new Error("Format de notes invalide.");
      }

      Object.entries(notes).forEach(([point,value])=>{
        localStorage.setItem(
          noteStorageKey(point),
          String(value ?? "")
        );
      });

      if(currentPointPanelPoint){
        openPointPanelDirect(currentPointPanelPoint);
      }

      message.textContent = "Notes importées.";
    }catch(error){
      console.error(error);
      message.textContent = "Import impossible : fichier de notes invalide.";
    }
  };

  reader.readAsText(file);
}

function renderPointInfoSections(sections, point){

  return sections
    .filter(([title,value]) =>
      title === "Notes" ||
      (
        value &&
        value !== "(Aucune)" &&
        value !== "Aucune"
      )
    )
    .map(([title,value]) => {

      if(title === "Notes"){
        const noteValue =
          getEditablePointNote(point, value);

        return `
          <details class="point-info-section point-note-section" open>
            <summary class="point-note-summary">
              <span>${title}</span>
              <button
                type="button"
                class="point-note-edit-button"
                onclick="togglePointNoteEdit(this)"
                title="Modifier les notes"
                aria-label="Modifier les notes"
              >✎</button>
            </summary>

            <div class="point-note-display">
              ${formatNoteTextForDisplay(noteValue)}
            </div>

            <textarea
              class="point-note-textarea"
              data-point="${escapeAttribute(point)}"
              oninput="savePointNoteFromTextarea(this)"
              style="display:none;"
              placeholder="Ajoute tes remarques personnelles sur ce point..."
            >${escapeHtml(noteValue)}</textarea>

            <div class="point-note-hint">
              Clique sur le crayon pour écrire. Tes notes restent dans ce navigateur. Tu peux toujours les exporter pour les sauvegarder, puis importer pour les récupérer sur un autre appareil ou navigateur.
            </div>
          </details>
        `;
      }

      return `
        <details class="point-info-section">
          <summary>${title}</summary>
          <div>${value}</div>
        </details>
      `;
    })
    .join("");
}

function openPointPanel(point){

  currentPointPanelPoint = point;

  const isSolvedPoint =
    solution.some(group =>
      group.solved &&
      group.points.includes(point)
    );

  if(!isSolvedPoint){
    return;
  }

  const details = POINT_DETAILS[point];

  if(!details){
    pointPanelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">${formatPointCode(point)}</span>
      </div>
      <p>Aucune fiche trouvée pour ce point.</p>
    `;

    pointPanel.classList.add("available");
    pointPanel.classList.add("open");

    panelToggle.innerHTML = "&gt;";

    document.body.classList.add("panel-open");
    return;
  }

  const pinyin = details.pinyin || "";
  const hanzi = details.hanzi || "";
  const nomFrancais =
    details.nom_francais || details.nom_complet || "";

  const sections = [
    ["Localisation", details.localisation],
    ["Méthode de localisation", details.methode_localisation],
    ["Méthode de travail", details.methode_travail],
    ["Catégories du point", details.categories_du_point],
    ["Correspondances", details.correspondances],
    ["Actions", details.actions],
    ["Indications", details.indications],
    ["Associations", details.associations],
    ["Notes", details.notes]
  ];

  pointPanelContent.innerHTML = `
    <div class="point-header">
      <span class="point-code">${formatPointCode(point)}</span>

      ${
        pinyin
          ? `<span class="point-separator">·</span>
             <span class="point-pinyin-inline">${colorizePinyin(pinyin)}</span>`
          : ""
      }

      ${
        hanzi
          ? `<span class="point-separator">·</span>
             <span class="point-hanzi-inline">${hanzi}</span>`
          : ""
      }

      ${
        nomFrancais
          ? `<span class="point-separator">·</span>
             <span class="point-fr-inline">${nomFrancais}</span>`
          : ""
      }
    </div>

    ${pointBasketActionHtml(point)}

    ${renderPointInfoSections(sections, point)}
  `;

  pointPanel.classList.add("available");
  pointPanel.classList.add("open");

  panelToggle.innerHTML = "&gt;";

  document.body.classList.add("panel-open");

  showProgressHintSoon(
    "point_basket_button",
    ".point-basket-button",
    "Panier de révision",
    "En cliquant ici, tu mets ce point de côté pour le retrouver dans ton panier de révision."
  );

  showProgressHintSoon(
    "point_notes",
    ".point-note-edit-button",
    "Notes perso",
    "En cliquant sur le crayon, tu peux ajouter tes remarques sur ce point. Elles restent dans ton navigateur.",
    {},
    760
  );
}

function openPointPanelDirect(point){

  currentPointPanelPoint = point;

  const details = POINT_DETAILS[point];

  if(!details){
    pointPanelContent.innerHTML = `
      <div class="point-header">
        <span class="point-code">${formatPointCode(point)}</span>
      </div>
      <p>Aucune fiche trouvée pour ce point.</p>
    `;

    pointPanel.classList.add("available");
    pointPanel.classList.add("open");
    panelToggle.innerHTML = "&gt;";
    document.body.classList.add("panel-open");
    return;
  }

  const pinyin = details.pinyin || "";
  const hanzi = details.hanzi || "";
  const nomFrancais =
    details.nom_francais || details.nom_complet || "";

  const sections = [
    ["Localisation", details.localisation],
    ["Méthode de localisation", details.methode_localisation],
    ["Méthode de travail", details.methode_travail],
    ["Catégories du point", details.categories_du_point],
    ["Correspondances", details.correspondances],
    ["Actions", details.actions],
    ["Indications", details.indications],
    ["Associations", details.associations],
    ["Notes", details.notes]
  ];

  pointPanelContent.innerHTML = `
    <div class="point-header">
      <span class="point-code">${formatPointCode(point)}</span>

      ${pinyin ? `<span class="point-separator">·</span><span class="point-pinyin-inline">${colorizePinyin(pinyin)}</span>` : ""}
      ${hanzi ? `<span class="point-separator">·</span><span class="point-hanzi-inline">${hanzi}</span>` : ""}
      ${nomFrancais ? `<span class="point-separator">·</span><span class="point-fr-inline">${nomFrancais}</span>` : ""}
    </div>

    ${pointBasketActionHtml(point)}

    ${renderPointInfoSections(sections, point)}
  `;

  pointPanel.classList.add("available");
  pointPanel.classList.add("open");
  panelToggle.innerHTML = "&gt;";
  document.body.classList.add("panel-open");
}

function closePointPanel(){

  const panel = document.getElementById("pointPanel");
  const toggle = document.getElementById("panelToggle");

  if(!panel) return;

  panel.classList.remove("open");

  if(toggle){
    toggle.innerHTML = "&lt;";
  }

  document.body.classList.remove("panel-open");
}

function closePointPanelCompletelyOnMobile(){

  if(window.innerWidth > 699) return;

  const panel = document.getElementById("pointPanel");
  const toggle = document.getElementById("panelToggle");

  if(!panel) return;

  panel.classList.remove("open");
  panel.classList.remove("available");
  panel.classList.remove("point-panel-peek");

  document.body.classList.remove("panel-open");

  if(toggle){
    toggle.innerHTML = "&lt;";
  }
}


function enableMobilePointPanelSwipeClose(){

  const panel = document.getElementById("pointPanel");

  if(!panel) return;

  if(panel.dataset.swipeCloseBound === "1") return;

  panel.dataset.swipeCloseBound = "1";

  let startX = 0;
  let startY = 0;
  let trackingSwipe = false;

  panel.addEventListener("touchstart", event=>{

    if(window.innerWidth > 699) return;

    if(!panel.classList.contains("open")) return;

    if(event.target.closest("textarea,input,select")) return;

    const touch = event.changedTouches[0];

    if(!touch) return;

    startX = touch.clientX;
    startY = touch.clientY;
    trackingSwipe = true;

  }, {passive:true});

  panel.addEventListener("touchend", event=>{

    if(!trackingSwipe) return;

    trackingSwipe = false;

    if(window.innerWidth > 699) return;

    if(!panel.classList.contains("open")) return;

    const touch = event.changedTouches[0];

    if(!touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    const isSwipeRight =
      deltaX > 70 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.35;

    if(isSwipeRight){
      closePointPanelCompletelyOnMobile();
    }

  }, {passive:true});
}


function formatPointCode(point){
  return String(point).replace(
    /^([A-Za-zÀ-ÿ]+)\s*(\d+)$/,
    "$1 $2"
  );
}


function addSolvedCategoryToBasket(button){
  const row = button.closest(".solved-row");
  if(!row) return;

  const points =
    [...row.querySelectorAll(".solved-point")]
      .map(el => el.dataset.point)
      .filter(Boolean);

  const added = addPointsToReviewBasket(points);
  updateBasketButtons();

  message.textContent = added > 0
    ? `${added} point(s) ajouté(s) au panier.`
    : "Ces points sont déjà dans le panier.";

  showProgressHintSoon(
    "basket_footer_button",
    "#reviewBasketButton",
    "Panier",
    "Le bouton Panier ouvre la liste des points mis de côté pour les réviser plus tard.",
    {position:"aboveBottom"},
    320
  );
}

function solveGroup(group){
  group.solved = true;
  solvedCount++;

  recordStatsCategorySolved(group);

  const row = document.createElement("div");
  row.className = "solved-row";
  row.dataset.categoryKey = group.key;

  row.innerHTML = `
    <div class="solved-title">
      <span>${group.name}</span>

      <button
        type="button"
        class="solved-category-basket-button"
        onclick="addSolvedCategoryToBasket(this)"
        title="Ajouter ces points au panier"
        aria-label="Ajouter les points de cette catégorie au panier"
      >
        🧺
      </button>

      ${
        gameOver
          ? `
            <button
              class="category-info-button"
              onclick="toggleCategoryExplanation(this)"
              title="Explication"
            >
              💡
            </button>
          `
          : ""
      }
    </div>

    <div class="category-explanation" style="display:none;">
      ${CATEGORY_EXPLANATIONS[group.key] || "Explication à compléter pour cette catégorie."}
    </div>

    <div class="solved-points">
      ${group.points.map(p=>`
        <div class="solved-point" data-point="${p}">
          ${formatPointCode(p)}
        </div>
      `).join("")}
    </div>
  `;

  solved.appendChild(row);

  row.querySelectorAll(".solved-point").forEach(el=>{
    el.onclick = () =>
      openPointPanel(el.dataset.point);
  });

  document.querySelectorAll(".tile").forEach(tile=>{
    if(group.points.includes(tile.dataset.point)){
      tile.remove();
    }
  });

  selected = [];
  message.textContent = mtcGoodChoiceMessage("Catégorie trouvée !");
  hint.textContent = "";

  if(hintCategory && hintCategory.key === group.key){
    hintCategory = null;
    hintStep = 0;
  }

  prepareFinalGuess();

  if(!localStorage.getItem("mtc_point_panel_hint_seen")){
    showPanelHint();
    localStorage.setItem("mtc_point_panel_hint_seen","1");
  }

  showProgressHintSoon(
    "first_category",
    "#solved .solved-row:last-child",
    "Catégorie trouvée",
    "Bien joué. En cliquant sur un point rangé ici, tu ouvres sa fiche détaillée."
  );

  showProgressHintSoon(
    "solved_category_basket",
    "#solved .solved-row:last-child .solved-category-basket-button",
    "Panier de révision",
    "En cliquant sur ce panier, tu mets de côté les points de cette catégorie pour les revoir plus tard.",
    {},
    920
  );

  if(solvedCount === 4 && !gameOver){
    recordStatsGameFinished(true);
    gameOver = true;
    document.body.classList.add("game-complete");
    showEndReviewScreen("win");
  }
}


const ASSOCIATION_LINK_COLORS = [
  "#0000FF",
  "#FF3B1F",
  "#00A676",
  "#8E44AD",
  "#F39C12",
  "#00A7B5",
  "#E91E63",
  "#6D4C41",
  "#7CB342",
  "#D81B60"
];

let associationLinkColorsByKey = {};

const ASSOCIATION_KEY_ALIASES = {
  JING_PUITS:"Points_Jing_Puits",
  YING_JAILLISSEMENT:"Points_Ying_Jaillissement",
  SHU_RIVIERE:"Points_Shu_Riviere",
  JING_FLEUVE:"Points_Jing_Fleuve",
  HE_REUNION:"Points_He_Reunion",
  Points_Xia_He_Reunion_inferieure:"Points_Xia_He_Reunion"
};

function canonicalAssociationKey(key){
  return ASSOCIATION_KEY_ALIASES[key] || key;
}

function clampAssociationNumber(value,min,max){
  return Math.max(min, Math.min(max, value));
}

let associationLinksRaf = null;
let associationLinksRedrawBound = false;

function showAssociationLinks(){

  const solvedEl = document.getElementById("solved");
  if(!solvedEl) return;

  solvedEl.classList.add("association-mode");

  bindAssociationLinksRedraw();

  scheduleAssociationLinksRedraw();
  setTimeout(scheduleAssociationLinksRedraw, 80);
  setTimeout(scheduleAssociationLinksRedraw, 260);
  setTimeout(scheduleAssociationLinksRedraw, 520);
}

function removeAssociationLinks(){

  document
    .querySelectorAll(".association-overlay, .association-link-plus")
    .forEach(el=>el.remove());

  const solvedEl = document.getElementById("solved");
  if(solvedEl){
    solvedEl.classList.remove("association-mode");
  }
}

function scheduleAssociationLinksRedraw(){

  if(!gameOver) return;

  if(associationLinksRaf){
    cancelAnimationFrame(associationLinksRaf);
  }

  associationLinksRaf = requestAnimationFrame(drawAssociationLinksNow);
}

function bindAssociationLinksRedraw(){

  if(associationLinksRedrawBound) return;

  window.addEventListener("resize", scheduleAssociationLinksRedraw, {passive:true});
  window.addEventListener("orientationchange", scheduleAssociationLinksRedraw, {passive:true});

  document.addEventListener(
    "scroll",
    scheduleAssociationLinksRedraw,
    {capture:true, passive:true}
  );

  /* Recalcule quand un clic ouvre/ferme Affichage, Cheatsheet, panneaux, etc. */
  document.addEventListener(
    "click",
    () => {
      setTimeout(scheduleAssociationLinksRedraw, 40);
      setTimeout(scheduleAssociationLinksRedraw, 160);
      setTimeout(scheduleAssociationLinksRedraw, 360);
    },
    {passive:true}
  );

  /* Recalcule quand le slider de taille de texte ou les couleurs changent */
  document.addEventListener(
    "input",
    () => {
      setTimeout(scheduleAssociationLinksRedraw, 20);
      setTimeout(scheduleAssociationLinksRedraw, 120);
    },
    {passive:true}
  );

  document.addEventListener(
    "change",
    () => {
      setTimeout(scheduleAssociationLinksRedraw, 20);
      setTimeout(scheduleAssociationLinksRedraw, 120);
    },
    {passive:true}
  );

  /* Recalcule quand la hauteur réelle du contenu change */
  if(window.ResizeObserver){
    const associationResizeObserver =
      new ResizeObserver(() => {
        scheduleAssociationLinksRedraw();
      });

    const solvedEl = document.getElementById("solved");
    const settingsPanel = document.getElementById("settingsPanel");

    associationResizeObserver.observe(document.body);

    if(solvedEl){
      associationResizeObserver.observe(solvedEl);
    }

    if(settingsPanel){
      associationResizeObserver.observe(settingsPanel);
    }
  }

  associationLinksRedrawBound = true;
}

function drawAssociationLinksNow(){

  document
    .querySelectorAll(".association-overlay, .association-link-plus")
    .forEach(el=>el.remove());

  associationLinkColorsByKey = {};

  if(!gameOver) return;

  const solvedEl = document.getElementById("solved");
  if(!solvedEl) return;

  if(typeof ASSOCIATION_EXPLANATIONS === "undefined") return;

  const rows = [...document.querySelectorAll(".solved-row")];

  const rowByKey = {};

  rows.forEach(row=>{
    const key = canonicalAssociationKey(row.dataset.categoryKey || "");
    if(key){
      rowByKey[key] = row;
    }
  });

  const visibleAssociations = [];

  Object.entries(ASSOCIATION_EXPLANATIONS).forEach(([associationKey,items])=>{

    const keys =
      associationKey
        .split("__")
        .map(canonicalAssociationKey);

    const linkedRows =
      keys.map(key=>rowByKey[key]);

    if(linkedRows.some(row=>!row)){
      return;
    }

    visibleAssociations.push({
      associationKey,
      items,
      rows: linkedRows
    });
  });

  if(!visibleAssociations.length){
    return;
  }

  const solvedRect = solvedEl.getBoundingClientRect();
  const solvedWidth = solvedEl.scrollWidth;
  const solvedHeight = solvedEl.scrollHeight;

  const overlay = document.createElement("div");
  overlay.className = "association-overlay";

  overlay.style.setProperty("position", "absolute", "important");
  overlay.style.setProperty("left", "0px", "important");
  overlay.style.setProperty("top", "0px", "important");
  overlay.style.setProperty("right", "auto", "important");
  overlay.style.setProperty("bottom", "auto", "important");
  overlay.style.width = `${solvedWidth}px`;
  overlay.style.height = `${solvedHeight}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.classList.add("association-overlay-svg");

  svg.setAttribute("width", solvedWidth);
  svg.setAttribute("height", solvedHeight);
  svg.setAttribute("viewBox", `0 0 ${solvedWidth} ${solvedHeight}`);

  svg.style.width = `${solvedWidth}px`;
  svg.style.height = `${solvedHeight}px`;

  overlay.appendChild(svg);
  solvedEl.appendChild(overlay);

  visibleAssociations.forEach(({associationKey,rows},index)=>{

    const color =
      ASSOCIATION_LINK_COLORS[index % ASSOCIATION_LINK_COLORS.length];

    associationLinkColorsByKey[associationKey] = color;

    const firstRow = rows[0];
    const lastRow = rows[rows.length - 1];

    const firstTitle =
      firstRow.querySelector(".solved-title span") ||
      firstRow.querySelector(".solved-title") ||
      firstRow;

    const lastTitle =
      lastRow.querySelector(".solved-title span") ||
      lastRow.querySelector(".solved-title") ||
      lastRow;

    const firstRect = firstTitle.getBoundingClientRect();
    const lastRect = lastTitle.getBoundingClientRect();

    const yA = firstRect.top - solvedRect.top + firstRect.height / 2;
    const yB = lastRect.top - solvedRect.top + lastRect.height / 2;

    const titleLeft =
      Math.min(firstRect.left, lastRect.left) - solvedRect.left;

    const isMobile = window.innerWidth <= 520;
    const lane = index % 6;
    const laneGap = isMobile ? 5 : 8;

    const xEnd =
      titleLeft - (isMobile ? 6 : 10);

    const xCurve =
      Math.max(
        4,
        xEnd - (isMobile ? 14 : 28) - lane * laneGap
      );

    const midY = (yA + yB) / 2;

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");

    path.setAttribute(
      "d",
      `M ${xEnd} ${yA}
       C ${xCurve} ${yA},
         ${xCurve} ${yB},
         ${xEnd} ${yB}`
    );

    path.classList.add("association-link-path");
    path.style.stroke = color;

    svg.appendChild(path);

    const buttonSize = isMobile ? 24 : 26;

    /* Milieu réel de la courbe */
    const buttonCenterX =
      xCurve * 0.75 + xEnd * 0.25;

    const buttonCenterY = midY;

    const buttonLeft =
      clampAssociationNumber(
        buttonCenterX - buttonSize / 2,
        0,
        solvedWidth - buttonSize
      );

    const buttonTop =
      clampAssociationNumber(
        buttonCenterY - buttonSize / 2,
        0,
        solvedHeight - buttonSize
      );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "association-link-plus";
    button.textContent = "☍";
    button.title = "Voir la fonction de l’association";
    button.dataset.associationKey = associationKey;

    button.style.left = `${buttonLeft}px`;
    button.style.top = `${buttonTop}px`;
    button.style.width = `${buttonSize}px`;
    button.style.height = `${buttonSize}px`;
    button.style.background = color;
    button.style.boxShadow = `0 3px 12px ${color}`;

    button.addEventListener("pointerdown", event=>{
      event.preventDefault();
      event.stopPropagation();
      toggleAssociationPostit(associationKey, color);
    });

    button.addEventListener("click", event=>{
      event.preventDefault();
      event.stopPropagation();
    });

    button.style.setProperty("position", "absolute", "important");

    solvedEl.appendChild(button);
  });


  showProgressHintSoon(
    "association_plus_created",
    ".association-link-plus",
    "Associations",
    "En cliquant sur +, tu ouvres la fiche de cette association.",
    {},
    360
  );
}

function toggleCategoryExplanation(button){

  const row = button.closest(".solved-row");
  const key = row.dataset.categoryKey;

  const categoryName =
    DISPLAY_NAMES[key] ||
    row.querySelector(".solved-title span")?.textContent ||
    key;

  const existing =
    document.querySelector(`.category-postit[data-key="${key}"]`);

  if(existing){
    existing.remove();
    return;
  }

  const items =
  getCategoryExplanationItems(key);

  function getCategoryExplanationItems(key){

    const aliases = {
      JING_PUITS:"Points_Jing_Puits",
      YING_JAILLISSEMENT:"Points_Ying_Jaillissement",
      SHU_RIVIERE:"Points_Shu_Riviere",
      JING_FLEUVE:"Points_Jing_Fleuve",
      HE_REUNION:"Points_He_Reunion",

      Points_Jing_Puits:"JING_PUITS",
      Points_Ying_Jaillissement:"YING_JAILLISSEMENT",
      Points_Shu_Riviere:"SHU_RIVIERE",
      Points_Jing_Fleuve:"JING_FLEUVE",
      Points_He_Reunion:"HE_REUNION"
    };

    return (
      CATEGORY_EXPLANATIONS[key] ||
      CATEGORY_EXPLANATIONS[aliases[key]] ||
      ["Fonctions à compléter pour cette catégorie."]
    );
  }

  const postit = document.createElement("div");
  postit.className = "category-postit";
  postit.dataset.key = key;

  postit.innerHTML = `
    <button
      class="category-postit-close"
      onclick="this.closest('.category-postit').remove()"
      title="Fermer"
    >
      ×
    </button>

    <div class="category-postit-title">
      Fonctions des points ${categoryName}
    </div>

    <ul>
      ${items.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;

  document.body.appendChild(postit);
  makeDraggablePostit(postit);
}

function associationDisplayName(key){

  const canonicalKey = canonicalAssociationKey(key);

  return (
    DISPLAY_NAMES[canonicalKey] ||
    DISPLAY_NAMES[key] ||
    String(canonicalKey).replaceAll("_"," ")
  );
}

function buildAssociationPostitTitle(pairKey){

  return pairKey
    .split("__")
    .map(associationDisplayName)
    .join(" + ");
}

function readableTextColorForHex(hex){

  if(!hex || !hex.startsWith("#")){
    return "#FAF9D1";
  }

  const clean = hex.replace("#","");

  const r = parseInt(clean.substring(0,2),16);
  const g = parseInt(clean.substring(2,4),16);
  const b = parseInt(clean.substring(4,6),16);

  const luminance =
    0.299 * r +
    0.587 * g +
    0.114 * b;

  return luminance > 170
    ? "#271629"
    : "#FAF9D1";
}

function toggleAssociationPostit(pairKey, color){

  const existing =
    document.querySelector(`.association-postit[data-key="${pairKey}"]`);

  if(existing){
    existing.remove();
    return;
  }

  const items =
    ASSOCIATION_EXPLANATIONS[pairKey] || [
      "Texte à compléter pour cette association."
    ];

  const postitColor =
    color ||
    associationLinkColorsByKey[pairKey] ||
    "#0000FF";

  const postitTextColor =
    readableTextColorForHex(postitColor);

  const postitTitle =
    buildAssociationPostitTitle(pairKey);

  const postit = document.createElement("div");
  postit.className = "association-postit";
  postit.dataset.key = pairKey;

  postit.style.setProperty("--association-postit-bg", postitColor);
  postit.style.setProperty("--association-postit-text", postitTextColor);

  postit.innerHTML = `
    <button
      type="button"
      class="association-postit-close"
      title="Fermer"
    >
      ×
    </button>

    <div class="association-postit-title">
      ${postitTitle}
    </div>

    <ul>
      ${items.map(item=>`<li>${item}</li>`).join("")}
    </ul>
  `;

  const closeButton =
    postit.querySelector(".association-postit-close");

  closeButton.addEventListener("pointerdown", event=>{
    event.stopPropagation();
  });

  closeButton.addEventListener("click", event=>{
    event.preventDefault();
    event.stopPropagation();
    postit.remove();
  });

  document.body.appendChild(postit);
  makeDraggablePostit(postit);
}

function makeDraggablePostit(postit){

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  postit.addEventListener("pointerdown", event=>{

    if(
      event.target.closest(".category-postit-close") ||
      event.target.closest(".association-postit-close") ||
      event.target.closest("button")
    ){
      return;
    }

    isDragging = true;

    const rect = postit.getBoundingClientRect();

    postit.style.left = rect.left + "px";
    postit.style.top = rect.top + "px";
    postit.style.transform = "none";

    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    postit.setPointerCapture(event.pointerId);
  });

  postit.addEventListener("pointermove", event=>{
    if(!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    postit.style.left = startLeft + dx + "px";
    postit.style.top = startTop + dy + "px";
  });

  postit.addEventListener("pointerup", ()=>{
    isDragging = false;
  });

  postit.addEventListener("pointercancel", ()=>{
    isDragging = false;
  });
}


function showCategoryInfoButtons(){

  document
    .querySelectorAll(".solved-row")
    .forEach(row=>{

      if(row.querySelector(".category-info-button")){
        return;
      }

      const title =
        row.querySelector(".solved-title");

      if(!title){
        return;
      }

      title.insertAdjacentHTML(
        "beforeend",
        `
          <button
            class="category-info-button"
            onclick="toggleCategoryExplanation(this)"
            title="Explication"
          >
            💡
          </button>
        `
      );
    });
}

function prepareFinalGuess(){
  const remaining = solution.filter(g=>!g.solved);
  const remainingTiles = [...document.querySelectorAll(".tile")];

  if(remaining.length !== 1 || remainingTiles.length !== 4){
    return;
  }

  const correctGroup = remaining[0];

  finalGuess.style.display = "block";
  finalGuessText.textContent =
    "Devine la dernière catégorie!";

  finalGuessChoices.innerHTML = "";

  const currentGameKeys =
    solution.map(g => g.key);

  const wrongOptions =
    shuffle(
      pool.filter(cat =>
        !currentGameKeys.includes(cat.key)
      )
    ).slice(0,3);

  const options =
    shuffle([
      {
        key:correctGroup.key,
        name:correctGroup.name
      },
      ...wrongOptions.map(cat => ({
        key:cat.key,
        name:cat.name
      }))
    ]);

  options.forEach(opt=>{
    const btn = document.createElement("button");

    btn.className = "final-choice";
    btn.textContent = opt.name;
    btn.onclick = () => checkFinalGuess(opt.key);

    finalGuessChoices.appendChild(btn);
  });

  finalGuess.dataset.correctKey = correctGroup.key;
}

function checkFinalGuess(chosenKey){
  if(gameOver) return;

  const correctKey = finalGuess.dataset.correctKey;

  if(!correctKey){
    message.textContent = "Aucune dernière catégorie à valider.";
    return;
  }

  if(chosenKey !== correctKey){
    const detail = {activeKey:correctKey, clickedKey:chosenKey, reason:"final-guess"};
    mistakeCount++;
    mtcRecordMistake(detail);
    updateGameStatus();

    const limit = getMtcMistakeLimit();
    if(mistakeCount >= limit){
      triggerGameOver("5 erreurs.");
      return;
    }

    message.textContent =
      `Ce n’est pas la bonne catégorie. Erreur ${mistakeCount}/${mtcLimitText(limit)}.`;

    return;
  }

  const group = solution.find(g => g.key === correctKey);

  if(!group){
    message.textContent = "Erreur : catégorie introuvable.";
    return;
  }

  finalGuess.style.display = "none";
  finalGuess.dataset.correctKey = "";
  finalGuessChoices.innerHTML = "";

  group._solvedBy = "final";
  solveGroup(group);
}

function clearSelection(){
  selected = [];

  document.querySelectorAll(".tile.selected").forEach(tile=>{
    tile.classList.remove("selected");
  });

  document.querySelectorAll(".tile").forEach(tile=>{
    tile.style.boxShadow = "";
    tile.style.background = "transparent";
    tile.style.borderColor = "transparent";
    tile.style.filter = "";
    tile.style.color = "var(--text-color)";
    tile.style.opacity = "1";
  });

  grid.classList.remove("has-selection");

  message.textContent = "";
  updateSelectionFeedback();
}

function giveHint(){
  if(gameOver) return;

  const hintLimit = getMtcHintLimit();

  if(hintLimit <= 0){
    updateGameStatus();
    message.textContent = "Mode Examen : les astuces sont désactivées.";
    return;
  }

  if(cheatCount >= hintLimit){
    hintButton.disabled = true;
    hintButton.style.opacity = "0.35";
    hintButton.style.pointerEvents = "none";

    message.textContent = "Plus aucune ☘︎ disponible :(";
    return;
  }

  cheatCount++;
  updateGameStatus();

  if(cheatCount >= hintLimit){
    hintButton.disabled = true;
    hintButton.style.opacity = "0.35";
    hintButton.style.pointerEvents = "none";
  }

  const unsolved = solution.filter(g=>!g.solved);

  if(unsolved.length === 0){
    message.textContent =
      `☘︎ ASTUCE : ${cheatCount}/${mtcLimitText(hintLimit)}.`;
    hint.textContent = "☘︎ Le puzzle est terminé.";
    return;
  }

  let targetGroup = null;

  if(selected.length > 0){
    const possibleGroups = unsolved.filter(group =>
      selected.every(p => group.points.includes(p))
    );

    if(possibleGroups.length === 1){
      targetGroup = possibleGroups[0];
    }else{
      message.textContent =
        `☘︎ ASTUCE : ${cheatCount}/${mtcLimitText(hintLimit)}.`;
      hint.textContent =
        "☘︎ Les points sélectionnés ne semblent pas appartenir à une même catégorie.";
      return;
    }
  }else{
    if(!hintCategory || hintCategory.solved){
      hintCategory = shuffle(unsolved)[0];
      hintStep = 0;
    }

    targetGroup = hintCategory;
  }

  if(!hintCategory || hintCategory.key !== targetGroup.key){
    hintCategory = targetGroup;
    hintStep = 0;
  }

  recordStatsCategoryHint(targetGroup);

  const forceTileHint = selected.length >= 2;

  if(forceTileHint){
    const remainingPoints =
      targetGroup.points.filter(p => !selected.includes(p));

    const point =
      remainingPoints[
        Math.min(Math.max(0, hintStep), Math.max(0, remainingPoints.length - 1))
      ];

    hint.textContent = point
      ? "☘︎ Une autre tuile : " + point
      : "☘︎ Tu as déjà toutes les tuiles de ce groupe.";
  }else if(hintStep === 0){
    hint.textContent = "☘︎ " + targetGroup.name;
  }else{
    const remainingPoints =
      targetGroup.points.filter(p => !selected.includes(p));

    const point =
      remainingPoints[
        Math.min(hintStep - 1, remainingPoints.length - 1)
      ];

    const label =
      hintStep === 1
        ? "Un autre point de cette catégorie"
        : "Encore un autre point";

    hint.textContent = "☘︎ " + label + " : " + point;
  }

  hintStep++;

  message.textContent =
    cheatCount >= hintLimit
      ? `☘︎ ASTUCE : ${cheatCount}/${mtcLimitText(hintLimit)}. Dernière ☘︎ astuce utilisée !`
      : `☘︎ ASTUCE : ${cheatCount}/${mtcLimitText(hintLimit)}.`;
}

function applyPreset(pageBg,text,shadow){
  pageBgPicker.value = pageBg;
  textPicker.value = text;
  shadowPicker.value = shadow;

  saveColorSetting("mtc_pageBg", pageBg, "--page-bg");
  saveColorSetting("mtc_text", text, "--text-color");
  saveColorSetting("mtc_shadow", shadow, "--shadow-color");
}

function resetAppearance(){
  document.body.classList.remove("darkroom");
  localStorage.removeItem("mtc_darkroom");

  applyPreset("#FCFCFA","#271629","#0000FF");

  localStorage.setItem("mtc_fontSize", "18");
  fontSizeSlider.value = 18;
  document.documentElement.style.setProperty("--ui-font-size", "18px");
}

function applyDarkroomMode(){
  document.body.classList.remove("night-invert");
  localStorage.removeItem("mtc_night_invert");
  document.body.classList.add("darkroom");
  applyPreset(
    "#000000",
    "#ff3b1f",
    "#ff3b1f",
    "#ff3b1f"
  );

  localStorage.setItem("mtc_darkroom", "1");
}

function shortPointLine(point){
  const details = POINT_DETAILS[point] || {};

  const pinyin = details.pinyin || "";
  const hanzi = details.hanzi || "";
  const fr =
    details.nom_francais ||
    details.nom_complet ||
    "";

  return [
    formatPointCode(point),
    pinyin,
    hanzi,
    fr
  ].filter(Boolean).join(" ");
}

function pointListByCanal(section){
  return Object.entries(section)
    .map(([label,points]) => {
      return `
${displayLabel(label)}
${points.map(p => "• " + shortPointLine(p)).join("\n")}
`;
    })
    .join("\n");
}

function togglePointPanel(){

  pointPanel.classList.toggle("open");

  if(pointPanel.classList.contains("open")){

    panelToggle.innerHTML = "&gt;";

    document.body.classList.add("panel-open");

  }else{

    panelToggle.innerHTML = "&lt;";

    document.body.classList.remove("panel-open");
  }
}

function applyNightInvertMode(){

  document.body.classList.remove("darkroom");
  localStorage.removeItem("mtc_darkroom");

  applyPreset(
    "#271629", // ancien texte devient fond
    "#FCFCFA", // ancien fond devient texte
    "#0000FF"  // halo inchangé
  );
}

pageBgPicker.oninput =
  e => saveColorSetting("mtc_pageBg", e.target.value, "--page-bg");

textPicker.oninput =
  e => saveColorSetting("mtc_text", e.target.value, "--text-color");

shadowPicker.oninput =
  e => saveColorSetting("mtc_shadow", e.target.value, "--shadow-color");

fontSizeSlider.oninput = e => {
  const size = e.target.value;

  localStorage.setItem("mtc_fontSize", size);

  document.documentElement
    .style
    .setProperty("--ui-font-size", size + "px");
};

pool = buildPool();
applySettings();
fillManualSelectors();
renderStatsPanel();
updateBasketCount();
updateComparisonButtonLabel();
newGame();


window.addEventListener("mtc-study-domain-changed", event=>{
  const domain = event?.detail?.domain || getCurrentStudyDomainForTutorial();

  if(domain === "acupuncture" || domain === "pharmacology"){
    maybeStartTutorialForCurrentDomain(domain === "pharmacology" ? 360 : 180);
  }
});

document.addEventListener("DOMContentLoaded", ()=>{
  enableMobilePointPanelSwipeClose();
  setupSupportCoffeeReminder();

  maybeStartTutorialForCurrentDomain(240);
});
