/* ============================================================
   01-00-recherche-rendu-compact.js
   Source: ancien bloc <script> #1 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Recherche v2 : rendu compact, Intersections, sans sous-titres === */
(function(){
  function searchHelp(text){
    return `
      <span class="search-help-wrap">
        <button type="button" class="search-help" tabindex="0" aria-label="Aide">?</button>
        <span class="search-help-text">${escapeHtml(text)}</span>
      </span>
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

    content.innerHTML = `
      <div class="search-compact-head">
        <h2 class="search-panel-title">Recherche</h2>
        ${searchHelp("Recherche un point par mot-clé, catégorie, canal du point ou intersections. Les champs cochés indiquent où le mot-clé est cherché.")}
      </div>

      <div class="search-controls">
        <label class="search-control search-keyword-control">
          <span class="search-control-label">
            Mot-clé
            ${searchHelp("Exemples : douleur, luò, Estomac, Rt4. La recherche ignore les accents et accepte les variantes proches.")}
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
            ${searchHelp("Limite le mot-clé à certains champs. Par défaut, tous les champs sont cochés.")}
          </span>
          <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
          <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
          <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
          <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
        </div>

        <div class="search-control search-correspondence-control">
          <span class="search-control-label">
            Intersections
            ${searchHelp("Filtre les points d’intersection : des points où plusieurs canaux ou vaisseaux se croisent.")}
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

    if(categorySelect) categorySelect.value = currentFilters.category;
    if(canalSelect) canalSelect.value = currentFilters.canal;

    renderAdvancedSearchResultsWith(results, total);
  };

  window.openAdvancedSearchPanel = function(){
    const panel = document.getElementById("advancedSearchPanel");
    if(!panel) return;

    closeAllBottomPanels("advancedSearchPanel");
    renderAdvancedSearchPanel();
    panel.classList.add("open");
  };
})();
