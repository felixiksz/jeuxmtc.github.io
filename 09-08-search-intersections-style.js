/* ============================================================
   09-08-search-intersections-style.js
   Source: ancien bloc <script> #9 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Recherche vaisseaux extraordinaires : les vaisseaux deviennent des filtres d'intersections === */
(function(){
  const EXTRAORDINARY_INTERSECTION_PREFIX = "EXTRA_VESSEL::";

  const EXTRAORDINARY_VESSEL_INTERSECTIONS = [
    {
      key:"Chong_Mai",
      label:"Chōng Mài",
      shortLabel:"Chōng",
      points:[
        "RM1","E30","Rn11","Rn12","Rn13","Rn14","Rn15","RM7","Rn16","Rn17",
        "Rn18","Rn19","Rn20","Rn21","Rn22","Rn23","Rn24","Rn25","Rn26","Rn27"
      ]
    },
    {
      key:"Ren_Mai",
      label:"Rèn Mài",
      shortLabel:"Rèn",
      points:["DM1","DM26","DM28","E1"]
    },
    {
      key:"Du_Mai",
      label:"Dū Mài",
      shortLabel:"Dū",
      points:["RM1","V12","V11","V1","V35"]
    },
    {
      key:"Yin_Qiao_Mai",
      label:"Yīn Qiāo Mài",
      shortLabel:"Yīn Qiāo",
      points:["Rn2","Rn6","Rn8","E9","E12","V1"]
    },
    {
      key:"Yang_Qiao_Mai",
      label:"Yáng Qiāo Mài",
      shortLabel:"Yáng Qiāo",
      points:["V62","V61","V59","VB29","IG10","GI16","GI15","E9","E4","E3","E1","V1","VB20"]
    },
    {
      key:"Yin_Wei_Mai",
      label:"Yīn Wéi Mài",
      shortLabel:"Yīn Wéi",
      points:["Rn9","Rt12","Rt13","Rt15","Rt16","F14","RM22","RM23","VB14"]
    },
    {
      key:"Yang_Wei_Mai",
      label:"Yáng Wéi Mài",
      shortLabel:"Yáng Wéi",
      points:["V63","VB35","GI14","TF13","IG10","TF15","VB21","VB13","VB14","VB15","VB16","VB17","VB18","VB19","VB20","DM16","DM15"]
    },
    {
      key:"Dai_Mai",
      label:"Dài Mài",
      shortLabel:"Dài",
      points:["F13","VB26","VB27","VB28"]
    }
  ];

  window.MTC_EXTRAORDINARY_VESSEL_INTERSECTIONS = EXTRAORDINARY_VESSEL_INTERSECTIONS;

  function cleanPointCode(point){
    return String(point || "").replace(/\s+/g,"").trim();
  }

  function extraordinaryFilterValue(key){
    return `${EXTRAORDINARY_INTERSECTION_PREFIX}${key}`;
  }

  function extraordinaryGroupFromValue(value){
    const raw = String(value || "");
    if(!raw.startsWith(EXTRAORDINARY_INTERSECTION_PREFIX)) return null;

    const key = raw.slice(EXTRAORDINARY_INTERSECTION_PREFIX.length);
    return EXTRAORDINARY_VESSEL_INTERSECTIONS.find(group => group.key === key) || null;
  }

  function extraordinaryGroupsForPoint(point){
    const clean = cleanPointCode(point);
    return EXTRAORDINARY_VESSEL_INTERSECTIONS.filter(group =>
      group.points.includes(clean)
    );
  }

  function pointMatchesExtraordinaryGroup(point, group){
    if(!group) return false;
    return group.points.includes(cleanPointCode(point));
  }

  /* Les points d'ouverture des merveilleux vaisseaux ne sont plus proposés comme catégories de points. */
  window.extraSearchCategoryGroups = function(){
    return [];
  };

  window.categoryDisplayNameFromSearchKey = function(key){
    if(!key) return "";
    if(key.includes("::")){
      const [section, subkey] = key.split("::");
      const prefix = DISPLAY_NAMES[section] || displayLabel(section);
      const sub = LABEL_NAMES[subkey] || CANAL_LABELS[subkey] || displayLabel(subkey);
      return `${prefix} — ${sub}`;
    }
    return DISPLAY_NAMES[key] || displayLabel(key);
  };

  window.categoryOptionsHtml = function(){
    if(!pool || !pool.length) pool = buildPool();

    const options = pool.map(cat => ({
      key:cat.key,
      name:cat.name || DISPLAY_NAMES[cat.key] || displayLabel(cat.key)
    }));

    return options
      .sort((a,b)=>normalizeSearchText(a.name).localeCompare(normalizeSearchText(b.name), "fr"))
      .map(cat => `<option value="${escapeAttribute(cat.key)}">${escapeHtml(cat.name)}</option>`)
      .join("");
  };

  window.pointCategoryKeys = function(point){
    if(!pool || !pool.length) pool = buildPool();

    return pool
      .filter(cat => (cat.points || []).includes(point))
      .map(cat => cat.key);
  };

  window.pointCategoryNames = function(point){
    return pointCategoryKeys(point).map(categoryDisplayNameFromSearchKey);
  };

  window.pointMatchesCategory = function(point, categoryKey){
    if(!categoryKey) return true;
    return pointCategoryKeys(point).includes(categoryKey);
  };

  const previousPointCorrespondenceRawText = window.pointCorrespondenceRawText;

  window.pointCorrespondenceRawText = function(point){
    const original = typeof previousPointCorrespondenceRawText === "function"
      ? previousPointCorrespondenceRawText(point)
      : flattenSearchText((POINT_DETAILS[point] || {}).correspondances || "");

    const extraordinaryLabels = extraordinaryGroupsForPoint(point)
      .map(group => group.label)
      .join(" ");

    return [original, extraordinaryLabels].filter(Boolean).join(" ");
  };

  window.pointHasCorrespondence = function(point){
    const text = normalizeSearchText(pointCorrespondenceRawText(point));

    if(!text) return false;

    return ![
      "aucune",
      "sans correspondance",
      "pas de correspondance"
    ].some(emptyLabel => text === normalizeSearchText(emptyLabel));
  };

  window.pointCorrespondenceSearchText = function(point){
    return normalizeSearchText(pointCorrespondenceRawText(point));
  };

  window.pointMatchesSingleCorrespondenceCanal = function(point, value){
    if(!value) return true;

    if(value === MTC_CORRESPONDENCE_FILTER_ANY){
      return pointHasCorrespondence(point);
    }

    const extraordinaryGroup = extraordinaryGroupFromValue(value);
    if(extraordinaryGroup){
      return pointMatchesExtraordinaryGroup(point, extraordinaryGroup);
    }

    const text = pointCorrespondenceSearchText(point);
    if(!text) return false;

    const tokens = MTC_SEARCH_CORRESPONDENCE_CHANNEL_KEYWORDS[value] || [];

    return tokens
      .map(normalizeSearchText)
      .filter(token => token.length > 2)
      .some(token => text.includes(token));
  };

  window.pointMatchesCorrespondenceCanal = function(point, correspondences){
    const selected = Array.isArray(correspondences)
      ? correspondences.filter(Boolean)
      : (correspondences ? [correspondences] : []);

    if(!selected.length) return true;

    const withoutAny = selected.filter(value => value !== MTC_CORRESPONDENCE_FILTER_ANY);

    if(!withoutAny.length){
      return pointHasCorrespondence(point);
    }

    return withoutAny.some(value =>
      pointMatchesSingleCorrespondenceCanal(point, value)
    );
  };

  window.correspondenceChecklistHtml = function(selected = []){
    const values = Array.isArray(selected) ? selected : [];
    const regularCanals = MTC_SEARCH_CANAL_ORDER.filter(canal => !["RM","DM"].includes(canal));

    const regularHtml = regularCanals.map(canal => `
      <label title="${escapeAttribute(CANAL_LABELS[canal] || canal)}">
        <input
          type="checkbox"
          name="advancedSearchCorrespondence"
          value="${escapeAttribute(canal)}"
          ${correspondenceChecked(values, canal)}
          onchange="renderAdvancedSearchResults()"
        >
        <span class="correspondence-filter-code">${escapeHtml(canal)}</span>
        <span class="correspondence-filter-name">${escapeHtml(CANAL_LABELS[canal] || canal)}</span>
      </label>
    `).join("");

    const extraordinaryHtml = EXTRAORDINARY_VESSEL_INTERSECTIONS.map(group => {
      const value = extraordinaryFilterValue(group.key);
      return `
        <label title="${escapeAttribute(group.label)} · ${group.points.map(formatPointCode).join(", ")}">
          <input
            type="checkbox"
            name="advancedSearchCorrespondence"
            value="${escapeAttribute(value)}"
            ${correspondenceChecked(values, value)}
            onchange="renderAdvancedSearchResults()"
          >
          <span class="correspondence-filter-code">☍</span>
          <span class="correspondence-filter-name">${escapeHtml(group.label)}</span>
        </label>
      `;
    }).join("");

    return `
      <div class="intersection-filter-heading">Canaux principaux</div>
      ${regularHtml}
      <div class="intersection-filter-heading">Merveilleux vaisseaux</div>
      ${extraordinaryHtml}
    `;
  };

  window.renderAdvancedSearchPanel = function(){
    const content = document.getElementById("advancedSearchPanelContent");
    if(!content) return;

    const currentFilters = getAdvancedSearchFilters();
    const hasIntersectionFilter = currentFilters.correspondences.includes(MTC_CORRESPONDENCE_FILTER_ANY);
    const resultsAll = advancedSearchResults();
    const results = resultsAll.slice(0,80);
    const total = resultsAll.length;

    const help = typeof searchHelp === "function"
      ? searchHelp
      : (text => `<span class="search-help-wrap"><button type="button" class="search-help" tabindex="0" aria-label="Aide">?</button><span class="search-help-text">${escapeHtml(text)}</span></span>`);

    content.innerHTML = `
      <div class="search-compact-head">
        <h2 class="search-panel-title">Recherche</h2>
        ${help("Recherche un point par mot-clé, catégorie, canal du point ou intersections. Les merveilleux vaisseaux sont classés ici comme filtres d’intersections, pas comme catégories de points.")}
      </div>

      <div class="search-controls">
        <label class="search-control search-keyword-control">
          <span class="search-control-label">
            Mot-clé
            ${help("Exemples : douleur, luò, Estomac, Rt4. La recherche ignore les accents et accepte les variantes proches.")}
          </span>
          <input
            id="advancedSearchKeywords"
            type="search"
            value="${escapeAttribute(currentFilters.keywords)}"
            placeholder="douleur, luò, Estomac, Rt4..."
            oninput="renderAdvancedSearchResults()"
          >
        </label>

        <label class="search-control">
          <span class="search-control-label">Catégorie</span>
          <select id="advancedSearchCategory" onchange="renderAdvancedSearchResults()">
            <option value="">Toutes les catégories</option>
            ${categoryOptionsHtml()}
          </select>
        </label>

        <label class="search-control">
          <span class="search-control-label">Canal</span>
          <select id="advancedSearchCanal" onchange="renderAdvancedSearchResults()">
            <option value="">Tous les canaux</option>
            ${canalOptionsHtml()}
          </select>
        </label>

        <div class="search-scope-options" aria-label="Champs de recherche">
          <span>
            Dans
            ${help("Limite le mot-clé à certains champs. Par défaut, tous les champs sont cochés.")}
          </span>
          <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
          <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
          <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
          <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
        </div>

        <div class="search-control search-correspondence-control">
          <span class="search-control-label">
            Intersections
            ${help("Filtre les points jiāo huì-intersection : points où plusieurs canaux ou vaisseaux se croisent. Les huit merveilleux vaisseaux sont maintenant disponibles ici.")}
          </span>

          <label class="search-correspondence-any">
            <input
              type="checkbox"
              name="advancedSearchCorrespondence"
              value="${MTC_CORRESPONDENCE_FILTER_ANY}"
              ${correspondenceChecked(currentFilters.correspondences, MTC_CORRESPONDENCE_FILTER_ANY)}
              onchange="renderAdvancedSearchPanel()"
            >
            points d’intersection
          </label>

          ${hasIntersectionFilter
            ? `<div class="correspondence-checklist" aria-label="Intersections">${correspondenceChecklistHtml(currentFilters.correspondences)}</div>`
            : ""
          }
        </div>
      </div>

      <div class="search-actions">
        <button type="button" onclick="resetAdvancedSearchFilters()">Réinitialiser</button>
      </div>

      <h3 class="search-section-title">Résultats</h3>
      <div id="advancedSearchResults"></div>
    `;

    const categorySelect = document.getElementById("advancedSearchCategory");
    const canalSelect = document.getElementById("advancedSearchCanal");

    if(categorySelect){
      categorySelect.value = currentFilters.category;
    }

    if(canalSelect){
      canalSelect.value = currentFilters.canal;
    }

    renderAdvancedSearchResultsWith(results, total);
  };

  window.renderAdvancedSearchPanelIfOpen = function(){
    const panel = document.getElementById("advancedSearchPanel");
    if(panel && panel.classList.contains("open")){
      renderAdvancedSearchPanel();
    }
  };
})();
