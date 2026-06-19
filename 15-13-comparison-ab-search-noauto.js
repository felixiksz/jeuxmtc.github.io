/* ============================================================
   15-13-comparison-ab-search-noauto.js
   Source: ancien bloc <script> #15 (hors JSON-LD)
   id original: mtc-final-comparison-all-fields-patch
   ============================================================ */

/* === Patch final : comparaison = tous les champs de fiche + phrase tuto plurielle === */
(function(){
  const SLOT_LETTERS_FINAL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function esc(value){
    if(typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function attr(value){
    if(typeof escapeAttribute === "function") return escapeAttribute(value);
    return esc(value);
  }

  function cleanField(value){
    if(value === null || value === undefined) return "";
    const text = String(value).trim();
    if(!text || text === "Aucune" || text === "(Aucune)") return "";
    return text;
  }

  function textWithBreaks(value){
    return esc(cleanField(value)).replace(/\n/g, "<br>");
  }

  function slotLabel(index){
    if(typeof comparisonSlotLabel === "function") return comparisonSlotLabel(index);
    return SLOT_LETTERS_FINAL[Number(index) || 0] || "";
  }

  function filledSlots(){
    const slots = typeof getComparisonPoints === "function" ? getComparisonPoints() : [];
    return slots
      .map((point, index) => ({point, index, label:slotLabel(index)}))
      .filter(slot => !!slot.point);
  }

  function comparisonSectionHtml(title, value, options){
    const clean = cleanField(value);
    if(!clean) return "";

    const opts = options || {};
    const linkClass = opts.linkPoints ? " js-point-ref-content" : "";

    return `
      <div class="comparison-field">
        <span class="comparison-field-title">${esc(title)}</span>
        <div class="comparison-field-value${linkClass}">${textWithBreaks(clean)}</div>
      </div>
    `;
  }

  function acuPointDetails(point){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point]){
        return POINT_DETAILS[point];
      }
    }catch(error){}

    if(typeof window !== "undefined" && window.POINT_DETAILS && window.POINT_DETAILS[point]){
      return window.POINT_DETAILS[point];
    }

    return {};
  }

  function comparisonSectionsForPoint(point, details){
    details = details || {};
    const customNotes = typeof getEditablePointNote === "function"
      ? getEditablePointNote(point, details.notes || "")
      : (details.notes || "");

    const sections = [
      ["Localisation", details.localisation],
      ["Méthode de localisation", details.methode_localisation],
      ["Méthode de travail", details.methode_travail],
      ["Catégories du point", details.categories_du_point],
      ["Correspondances", details.correspondances],
      ["Actions", details.actions || details.fonctions],
      ["Indications", details.indications],
      ["Associations", details.associations, {linkPoints:true}],
      ["Notes", customNotes, {linkPoints:true}]
    ];

    const alreadyUsed = new Set([
      "point", "pinyin", "hanzi", "nom_francais", "nom_complet",
      "localisation", "methode_localisation", "methode_travail",
      "categories_du_point", "correspondances", "actions", "fonctions",
      "indications", "associations", "notes",
      "canal", "_source_sheet", "_source_row"
    ]);

    Object.keys(details || {}).forEach(key => {
      if(alreadyUsed.has(key)) return;
      const value = details[key];
      if(!cleanField(value)) return;
      const title = typeof displayLabel === "function"
        ? displayLabel(key)
        : key.replace(/_/g, " ");
      sections.push([title, value]);
    });

    return sections;
  }

  window.comparisonCardHtml = function(slotIndex, point){
    if(!point) return "";

    const details = acuPointDetails(point);

    const label = slotLabel(slotIndex);
    const title = typeof searchPointTitle === "function"
      ? searchPointTitle(point)
      : (typeof formatPointCode === "function" ? formatPointCode(point) : String(point));
    const meta = typeof searchPointMeta === "function" ? searchPointMeta(point) : "";

    const fieldsHtml = comparisonSectionsForPoint(point, details)
      .map(([sectionTitle, value, options]) => comparisonSectionHtml(sectionTitle, value, options))
      .join("");

    return `
      <div class="comparison-card" data-comparison-slot="${attr(label)}">
        <div class="search-result-title">
          <span class="comparison-slot-label">${esc(label)}</span>
          ${title}
        </div>
        <div class="search-result-meta">${esc(meta)}</div>

        <div class="comparison-actions">
          <button type="button" onclick="openPointPanelDirect('${attr(point)}')">Ouvrir la fiche</button>
          <button type="button" onclick="clearComparisonPoint(${Number(slotIndex) || 0})">Retirer</button>
        </div>

        ${fieldsHtml || `<p class="comparison-empty">Aucune fiche détaillée trouvée pour ce point.</p>`}
      </div>
    `;
  };

  window.renderComparisonPanel = function(){
    const content = document.getElementById("comparisonPanelContent");
    if(!content) return;

    const filled = filledSlots();
    const count = Math.max(filled.length, 2);

    if(!filled.length){
      content.innerHTML = `
        <div class="point-header">
          <span class="point-code">Comparaison</span>
        </div>
        <p class="stats-small">Aucun point n’est encore placé en comparaison. Ajoute des points depuis le panier.</p>
      `;
      return;
    }

    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Comparaison A–Z</span>
      </div>

      <p class="stats-intro">
        Les points restent alignés en colonnes. Le panneau affiche les champs de la fiche : localisation, méthodes, catégories, correspondances, actions, indications, associations et notes.
      </p>

      <div class="comparison-grid comparison-grid-az" style="--comparison-count:${count}">
        ${filled.map(slot => comparisonCardHtml(slot.index, slot.point)).join("")}
      </div>
    `;

    if(typeof enhancePointReferencesInPanel === "function"){
      enhancePointReferencesInPanel(content);
    }
  };

  if(typeof updateComparisonButtonLabel === "function"){
    updateComparisonButtonLabel();
  }

  if(typeof renderComparisonPanelIfOpen === "function"){
    renderComparisonPanelIfOpen();
  }
})();
