/* ============================================================
   07-06-search-normalization.js
   Source: ancien bloc <script> #7 (hors JSON-LD)
   id original: -
   ============================================================ */

/* Recherche : normalisation robuste + correspondances lisibles */
function normalizeSearchText(value){
  return String(value ?? "")
    .replace(/œ/g,"oe")
    .replace(/Œ/g,"OE")
    .replace(/æ/g,"ae")
    .replace(/Æ/g,"AE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[’‘`´]/g,"'")
    .replace(/[^a-z0-9]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function searchWordVariants(word){
  const clean = normalizeSearchText(word);
  if(!clean) return [];

  const variants = new Set([clean]);

  if(clean.length >= 5){
    variants.add(clean.replace(/e$/,""));
    variants.add(clean.replace(/es$/,""));
    variants.add(clean.replace(/s$/,""));
  }

  if(clean === "diabete" || clean === "diabetes"){
    variants.add("diabet");
    variants.add("diabetiforme");
  }

  return [...variants].filter(value => value.length >= 2);
}

function pointMatchesKeywords(point, keywords, scopes){
  const query = normalizeSearchText(keywords).trim();
  if(!query) return true;

  const haystack = pointSearchHaystack(point, scopes);

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every(word =>
      searchWordVariants(word).some(variant =>
        haystack.includes(variant)
      )
    );
}

function correspondenceChecklistHtml(selected = []){
  const values = Array.isArray(selected) ? selected : [];

  return MTC_SEARCH_CANAL_ORDER
    .map(canal => `
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
    `)
    .join("");
}
