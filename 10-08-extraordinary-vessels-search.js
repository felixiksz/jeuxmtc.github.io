/* ============================================================
   10-08-extraordinary-vessels-search.js
   Source: ancien bloc <script> #10 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Recherche Intersections : mode de correspondance + inclure/exclure === */
(function(){
  const EXTRA_PREFIX = "EXTRA_VESSEL::";

  function helpHtml(text){
    if(typeof searchHelp === "function") return searchHelp(text);
    return `<span class="search-help-wrap"><button type="button" class="search-help" tabindex="0" aria-label="Aide">?</button><span class="search-help-text">${escapeHtml(text)}</span></span>`;
  }

  function intersectionHelpHtml(text){
    return `
      <span class="intersection-help-wrap">
        <button type="button" class="intersection-help-button" tabindex="0" aria-label="Aide">?</button>
        <span class="intersection-help-text">${escapeHtml(text)}</span>
      </span>
    `;
  }

  window.getAdvancedSearchIntersectionMatchMode = function(){
    const switchInput = document.getElementById("advancedSearchIntersectionMatchSwitch");
    if(switchInput){
      return switchInput.checked ? "all" : "any";
    }

    return document.querySelector("input[name='advancedSearchIntersectionMatch']:checked")?.value || "any";
  };

  window.getAdvancedSearchIntersectionActionMode = function(){
    const switchInput = document.getElementById("advancedSearchIntersectionActionSwitch");
    if(switchInput){
      return switchInput.checked ? "exclude" : "include";
    }

    return document.querySelector("input[name='advancedSearchIntersectionAction']:checked")?.value || "include";
  };

  window.intersectionModeChecked = function(current, value){
    return current === value ? "checked" : "";
  };

  function extraordinaryGroupFromValueForSearch(value){
    const raw = String(value || "");
    if(!raw.startsWith(EXTRA_PREFIX)) return null;
    const key = raw.slice(EXTRA_PREFIX.length);
    return (window.MTC_EXTRAORDINARY_VESSEL_INTERSECTIONS || [])
      .find(group => group.key === key) || null;
  }

  function cleanPointCodeForSearch(point){
    return String(point || "").replace(/\s+/g, "").trim();
  }

  function pointMatchesExtraordinaryGroupForSearch(point, group){
    if(!group || !Array.isArray(group.points)) return false;

    const ownCanalByExtraordinaryKey = {
      Ren_Mai:"RM",
      Du_Mai:"DM"
    };

    const ownCanal = ownCanalByExtraordinaryKey[group.key];
    if(ownCanal && canalOfPoint(point) === ownCanal){
      return true;
    }

    return group.points.includes(cleanPointCodeForSearch(point));
  }

  function extraordinaryFilterValueForSearch(key){
    return `${EXTRA_PREFIX}${key}`;
  }

  window.pointMatchesSingleCorrespondenceCanal = function(point, value){
    if(!value) return true;

    if(value === MTC_CORRESPONDENCE_FILTER_ANY){
      return pointHasCorrespondence(point);
    }

    const extraordinaryGroup = extraordinaryGroupFromValueForSearch(value);
    if(extraordinaryGroup){
      return pointMatchesExtraordinaryGroupForSearch(point, extraordinaryGroup);
    }

    /* Dans Intersections, un canal coché doit aussi inclure tous ses propres points. */
    if(MTC_SEARCH_CANAL_ORDER.includes(value) && canalOfPoint(point) === value){
      return true;
    }

    const text = pointCorrespondenceSearchText(point);
    if(!text) return false;

    const tokens = MTC_SEARCH_CORRESPONDENCE_CHANNEL_KEYWORDS[value] || [];

    return tokens
      .map(normalizeSearchText)
      .filter(token => token.length > 2)
      .some(token => text.includes(token));
  };

  window.pointMatchesCorrespondenceCanal = function(point, correspondences, matchMode = "any", actionMode = "include"){
    const selected = Array.isArray(correspondences)
      ? correspondences.filter(Boolean)
      : (correspondences ? [correspondences] : []);

    if(!selected.length) return true;

    const withoutAny = selected.filter(value => value !== MTC_CORRESPONDENCE_FILTER_ANY);

    let matches;

    if(!withoutAny.length){
      matches = pointHasCorrespondence(point);
    }else if(matchMode === "all"){
      matches = withoutAny.every(value =>
        pointMatchesSingleCorrespondenceCanal(point, value)
      );
    }else{
      matches = withoutAny.some(value =>
        pointMatchesSingleCorrespondenceCanal(point, value)
      );
    }

    return actionMode === "exclude" ? !matches : matches;
  };

  window.getAdvancedSearchFilters = function(){
    return {
      keywords:document.getElementById("advancedSearchKeywords")?.value || "",
      scopes:getAdvancedSearchScopes(),
      category:document.getElementById("advancedSearchCategory")?.value || "",
      canal:document.getElementById("advancedSearchCanal")?.value || "",
      correspondences:getAdvancedSearchCorrespondences(),
      intersectionMatchMode:getAdvancedSearchIntersectionMatchMode(),
      intersectionActionMode:getAdvancedSearchIntersectionActionMode()
    };
  };

  window.advancedSearchResults = function(){
    const filters = getAdvancedSearchFilters();

    return allSearchPoints()
      .filter(point => pointMatchesKeywords(point, filters.keywords, filters.scopes))
      .filter(point => pointMatchesCategory(point, filters.category))
      .filter(point => pointMatchesCanal(point, filters.canal))
      .filter(point => pointMatchesCorrespondenceCanal(
        point,
        filters.correspondences,
        filters.intersectionMatchMode,
        filters.intersectionActionMode
      ));
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

    const extraordinaryHtml = (window.MTC_EXTRAORDINARY_VESSEL_INTERSECTIONS || []).map(group => {
      const value = extraordinaryFilterValueForSearch(group.key);
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

  function intersectionOptionsHtml(currentFilters){
    const actionIsExclude = currentFilters.intersectionActionMode === "exclude";
    const matchIsAll = currentFilters.intersectionMatchMode === "all";

    return `
      <div class="intersection-filter-options" aria-label="Mode de filtrage des intersections">
        <div class="intersection-filter-row">
          <span class="intersection-filter-label">
            <span class="intersection-label-text">Action</span>
            ${intersectionHelpHtml("Inclure montre les points liés aux intersections cochées. Exclure retire ces points des résultats.")}
          </span>

          <span class="intersection-switch-line" aria-label="Inclure ou exclure les intersections cochées">
            <span class="intersection-switch-value ${actionIsExclude ? "" : "active"}">Inclure</span>
            <label class="switch intersection-switch">
              <input
                id="advancedSearchIntersectionActionSwitch"
                type="checkbox"
                ${actionIsExclude ? "checked" : ""}
                onchange="renderAdvancedSearchPanel()"
                aria-label="Exclure les intersections cochées"
              >
              <span class="slider"></span>
            </label>
            <span class="intersection-switch-value ${actionIsExclude ? "active" : ""}">Exclure</span>
          </span>
        </div>

        <div class="intersection-filter-row">
          <span class="intersection-filter-label">
            <span class="intersection-label-text">Lien</span>
            ${intersectionHelpHtml("Au moins un trouve les points liés à n’importe quel canal coché. Tous trouve seulement les points liés à tous les canaux cochés en même temps.")}
          </span>

          <span class="intersection-switch-line" aria-label="Au moins un canal ou tous les canaux cochés">
            <span class="intersection-switch-value ${matchIsAll ? "" : "active"}">Au moins un</span>
            <label class="switch intersection-switch">
              <input
                id="advancedSearchIntersectionMatchSwitch"
                type="checkbox"
                ${matchIsAll ? "checked" : ""}
                onchange="renderAdvancedSearchPanel()"
                aria-label="Exiger tous les canaux cochés"
              >
              <span class="slider"></span>
            </label>
            <span class="intersection-switch-value ${matchIsAll ? "active" : ""}">Tous</span>
          </span>
        </div>
      </div>
    `;
  }

  window.renderAdvancedSearchPanel = function(){
    const content = document.getElementById("advancedSearchPanelContent");
    if(!content) return;

    const currentFilters = getAdvancedSearchFilters();
    const hasIntersectionFilter = currentFilters.correspondences.includes(MTC_CORRESPONDENCE_FILTER_ANY);
    const resultsAll = advancedSearchResults();
    const results = resultsAll.slice(0,80);
    const total = resultsAll.length;

    const help = helpHtml;

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
            ${help("Limite le mot-clé à certains champs. Par défaut, tous les champs sont cochés, y compris précautions et formules.")}
          </span>
          <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
          <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
          <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
          <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
          <label><input type="checkbox" name="advancedSearchScope" value="precautions" ${searchScopeChecked(currentFilters.scopes,"precautions")} onchange="renderAdvancedSearchResults()"> précautions</label>
          <label><input type="checkbox" name="advancedSearchScope" value="formules" ${searchScopeChecked(currentFilters.scopes,"formules")} onchange="renderAdvancedSearchResults()"> formules</label>
        </div>

        <div class="search-control search-correspondence-control">
          <span class="search-control-label">
            Intersections
            ${help("Filtre les points jiāo huì-intersection : points où plusieurs canaux ou vaisseaux se croisent. Les huit merveilleux vaisseaux sont disponibles ici.")}
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
            ? `${intersectionOptionsHtml(currentFilters)}<div class="correspondence-checklist" aria-label="Intersections">${correspondenceChecklistHtml(currentFilters.correspondences)}</div>`
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
