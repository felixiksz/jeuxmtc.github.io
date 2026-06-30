/* === Comparaison ACU/PHARMA : matrice lisible sans perdre les repères visuels PHARMA === */
(function(){
  "use strict";

  const ACU_KEY = "connections_mtc_comparison_points_v1";
  const PHARMA_KEY = "mtc_pharma_comparison_slots_v1";
  const SLOT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const PHARMA_ESPRIT_PREFIX = "mtc_pharma_herb_esprit_";
  const PHARMA_NOTES_PREFIX = "mtc_pharma_herb_notes_";
  const PHARMA_ASSOC_PREFIX = "mtc_pharma_herb_associations_";
  const PHARMA_FORMULES_PREFIX = "mtc_pharma_herb_formules_";
  const PHARMA_VS_PREFIX = "mtc_pharma_herb_vs_";
  const PHARMA_PRECAUTION_PREFIX = "mtc_pharma_herb_precaution_";
  const ACU_ESPRIT_PREFIX = "mtc_point_esprit_";
  const ACU_NOTE_PREFIX = "mtc_point_note_";
  const ACU_ASSOC_PREFIX = "mtc_point_associations_";
  const ACU_VS_PREFIX = "mtc_point_vs_";

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){ return document.getElementById(id); }

  function esc(value){
    if(typeof window.escapeHtml === "function") return window.escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function attr(value){
    if(typeof window.escapeAttribute === "function") return window.escapeAttribute(value);
    return esc(value).replace(/`/g,"&#096;");
  }

  function text(value){
    return String(value ?? "")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .trim();
  }

  function normalizeKey(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/[’']/g,"'")
      .replace(/\s+/g," ")
      .trim();
  }

  function cleanValue(value){
    const clean = Array.isArray(value)
      ? value.map(text).filter(Boolean).join("\n")
      : text(value);
    if(!clean || clean === "Aucune" || clean === "(Aucune)") return "";
    return clean;
  }

  function displayValue(value){
    const clean = cleanValue(value);
    if(!clean) return `<span class="mtc-compare-empty">—</span>`;
    return esc(clean).replace(/\n/g,"<br>");
  }

  function slotLabel(index){
    if(typeof window.comparisonSlotLabel === "function") return window.comparisonSlotLabel(index);
    return SLOT_LETTERS[Number(index) || 0] || String((Number(index) || 0) + 1);
  }

  function readJson(key, fallback){
    try{
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    }catch(error){
      return fallback;
    }
  }

  function getAcuSlots(){
    const raw = typeof window.getComparisonPoints === "function"
      ? window.getComparisonPoints()
      : readJson(ACU_KEY, []);
    return (Array.isArray(raw) ? raw : [])
      .map((point, index) => ({id:String(point || ""), index, label:slotLabel(index)}))
      .filter(slot => !!slot.id);
  }

  function getPharmaSlots(){
    const raw = readJson(PHARMA_KEY, []);
    return (Array.isArray(raw) ? raw : [])
      .map((herbId, index) => ({id:String(herbId || ""), index, label:slotLabel(index)}))
      .filter(slot => !!slot.id && !!getHerb(slot.id));
  }

  function getPointDetails(point){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point]) return POINT_DETAILS[point];
    }catch(error){}
    return (window.POINT_DETAILS && window.POINT_DETAILS[point]) || {};
  }

  function getHerb(id){
    const herbs = Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
    return herbs.find(item => String(item.id) === String(id) || String(item.code) === String(id));
  }

  function herbTitle(herb){
    if(!herb) return "";
    const pinyin = text(herb.pinyin || herb.pinyinSansTons || herb.code);
    const hanzi = text(herb.hanzi);
    return [pinyin, hanzi].filter(Boolean).join(" ");
  }

  function herbCommon(herb){ return text(herb?.nom || ""); }

  function herbClassLabel(herb){
    if(!herb) return "";
    return [herb.classCode || "", herb.classe || ""].filter(Boolean).join(" · ");
  }

  function localStorageValue(prefix, id, fallback){
    try{
      const stored = localStorage.getItem(prefix + id);
      if(stored !== null) return stored;
    }catch(error){}
    return fallback || "";
  }

  function herbEsprit(herb){
    if(!herb) return "";
    if(typeof window.getPharmaHerbEsprit === "function"){
      return text(window.getPharmaHerbEsprit(herb.id) || herb.esprit || "");
    }
    return text(localStorageValue(PHARMA_ESPRIT_PREFIX, herb.id, herb.esprit || ""));
  }

  function herbNotes(herb){
    if(!herb) return "";
    return text(localStorageValue(PHARMA_NOTES_PREFIX, herb.id, herb.notes || ""));
  }

  function herbAssociations(herb){
    if(!herb) return "";
    return text(localStorageValue(PHARMA_ASSOC_PREFIX, herb.id, herb.associations || herb.association || ""));
  }

  function herbFormules(herb){
    if(!herb) return "";
    return text(localStorageValue(PHARMA_FORMULES_PREFIX, herb.id, herb.formules || herb.formulas || ""));
  }

  function herbVs(herb){
    if(!herb) return "";
    return text(localStorageValue(PHARMA_VS_PREFIX, herb.id, herb.vs || herb.comparaison || herb.compare || ""));
  }

  function herbPrecaution(herb){
    if(!herb) return "";
    return text(localStorageValue(PHARMA_PRECAUTION_PREFIX, herb.id, herb.precaution || herb.precautions || ""));
  }

  function setLocalStorageValue(prefix, id, value){
    try{ localStorage.setItem(prefix + id, String(value ?? "")); }catch(error){}
  }

  function pointTitle(point){
    if(typeof window.searchPointTitle === "function") return window.searchPointTitle(point);
    if(typeof window.formatPointCode === "function") return window.formatPointCode(point);
    return point;
  }

  function pointMeta(point){
    return typeof window.searchPointMeta === "function" ? window.searchPointMeta(point) : "";
  }

  function pointNote(point, details){
    return typeof window.getEditablePointNote === "function"
      ? window.getEditablePointNote(point, details.notes || "")
      : (details.notes || "");
  }

  function splitActionText(value){
    if(Array.isArray(value)) return value.flatMap(splitActionText);
    return text(value)
      .split(/\n+|\s*[•·]\s+|\s*;\s*/g)
      .map(item => item.replace(/^[-–—]\s*/, "").trim())
      .filter(Boolean);
  }

  function pointActions(point){
    const details = getPointDetails(point);
    return splitActionText(details.actions || details.fonctions || "");
  }

  function herbActions(herb){
    if(!herb) return [];
    return splitActionText(Array.isArray(herb.actions) ? herb.actions : (herb.actions || ""));
  }

  function unionActionRows(slots, actionGetter){
    const map = new Map();
    slots.forEach(slot => {
      actionGetter(slot).forEach(label => {
        const key = normalizeKey(label);
        if(key && !map.has(key)) map.set(key, label);
      });
    });
    return Array.from(map.entries()).map(([key,label]) => ({key,label}));
  }

  function actionCount(slots, actionKey, actionGetter){
    return slots.reduce((count, slot) => count + (hasAction(slot, actionKey, actionGetter) ? 1 : 0), 0);
  }

  function hasAction(slot, actionKey, actionGetter){
    return actionGetter(slot).some(label => normalizeKey(label) === actionKey);
  }

  function removeButtonHtml(slot){
    return `
      <button
        type="button"
        class="mtc-compare-remove"
        onclick="window.clearComparisonSlotClean && window.clearComparisonSlotClean(${Number(slot.index) || 0}, event)"
        title="Retirer de la comparaison"
        aria-label="Retirer de la comparaison"
      >
        <span class="mtc-compare-trash" aria-hidden="true">🗑</span>
      </button>
    `;
  }

  function clearAllButtonHtml(){
    return `
      <button
        type="button"
        class="mtc-compare-clear-all"
        onclick="window.clearComparisonPanelClean && window.clearComparisonPanelClean(event)"
        title="Vider le panneau de comparaison"
        aria-label="Vider le panneau de comparaison"
      >Vider</button>
    `;
  }

  function compareTitlebarHtml(title){
    return `
      <div class="point-header mtc-compare-panel-header mtc-compare-titlebar">
        <span class="point-code">${esc(title)}</span>
        ${clearAllButtonHtml()}
      </div>
    `;
  }

  function acuHeaderHtml(slot){
    const title = pointTitle(slot.id);
    const meta = pointMeta(slot.id);
    return `
      <div
        class="mtc-compare-header acu-compare-header mtc-compare-row-head"
        data-comparison-slot="${attr(slot.label)}"
        data-compare-id="${attr(slot.id)}"
        draggable="true"
        title="Glisser pour déplacer cette colonne"
      >
        ${removeButtonHtml(slot)}
        <button
          type="button"
          class="mtc-compare-name-button"
          onclick="event.preventDefault(); event.stopPropagation(); if(window.openPointPanelDirect) window.openPointPanelDirect('${attr(slot.id)}'); else if(window.openPointPanel) window.openPointPanel('${attr(slot.id)}');"
          title="Ouvrir la fiche de ${attr(title)}"
        >
          <span class="mtc-compare-main-name">${esc(title)}</span>
          ${meta ? `<span class="mtc-compare-sub-name">${esc(meta)}</span>` : ""}
        </button>
      </div>
    `;
  }

  function pharmaHeaderHtml(slot, localIndex, slots){
    const herb = getHerb(slot.id);
    const title = herbTitle(herb) || slot.id;
    const common = herbCommon(herb);
    const style = columnNatureStyleForPharmaSlot(slot, localIndex, slots);
    const gradientClass = style ? " has-column-gradient" : "";
    return `
      <div
        class="mtc-compare-header pharma-compare-header mtc-compare-row-head${gradientClass}"
        data-comparison-slot="${attr(slot.label)}"
        data-compare-id="${attr(slot.id)}"
        draggable="true"
        title="Glisser pour déplacer cette colonne"
        style="${attr(style)}"
      >
        ${removeButtonHtml(slot)}
        <button
          type="button"
          class="mtc-compare-name-button"
          onclick="event.preventDefault(); event.stopPropagation(); if(window.openPharmaHerbPanel) window.openPharmaHerbPanel('${attr(slot.id)}');"
          title="Ouvrir la fiche de ${attr(title)}"
        >
          <span class="mtc-compare-main-name">${esc(title)}</span>
          ${common ? `<span class="mtc-compare-sub-name">${esc(common)}</span>` : ""}
        </button>
      </div>
    `;
  }


  function pharmaAddHeaderHtml(){
    return `
      <div class="mtc-compare-header pharma-compare-header mtc-compare-row-head mtc-compare-add-header">
        <label class="mtc-compare-add-label">Ajouter</label>
        <input
          type="text"
          class="mtc-compare-add-input"
          data-pharma-compare-add-input="1"
          list="pharmaCompareAddList"
          placeholder="Taper une substance…"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        >
        <datalist id="pharmaCompareAddList"></datalist>
      </div>
    `;
  }

  function rowHtml(label, slots, getter, options){
    const opts = options || {};
    const indexClass = (opts.rowIndex || 0) % 2 ? "mtc-compare-row-odd" : "mtc-compare-row-even";
    const rowKind = opts.rowKind ? `mtc-compare-row-${opts.rowKind}` : "";
    return `
      <div class="mtc-compare-row-label ${indexClass} ${rowKind} ${opts.rowClass || ""}">${esc(label)}</div>
      ${slots.map((slot, localIndex) => {
        const value = getter(slot, localIndex, slots);
        const html = opts.html ? String(value || `<span class="mtc-compare-empty">—</span>`) : displayValue(value);
        const columnStyle = opts.columnStyle ? (opts.columnStyle(slot, localIndex, slots) || "") : "";
        const gradientClass = columnStyle ? "has-column-gradient" : "";
        return `<div class="mtc-compare-cell ${indexClass} ${rowKind} ${opts.cellClass || ""} ${gradientClass}" style="${attr(columnStyle)}">${html}</div>`;
      }).join("")}
      ${opts.addEmptyColumn ? `<div class="mtc-compare-cell ${indexClass} ${rowKind} mtc-compare-add-cell"></div>` : ""}
    `;
  }

  function actionMatrixHtml(slots, actionGetter, startIndex, options){
    const opts = options || {};
    const rows = unionActionRows(slots, actionGetter);
    if(!rows.length) return "";
    return rows.map((action, i) => {
      const count = actionCount(slots, action.key, actionGetter);
      const distinct = count > 0 && count < slots.length;
      const unique = count === 1;
      const indexClass = ((startIndex || 0) + i) % 2 ? "mtc-compare-row-odd" : "mtc-compare-row-even";
      const stateClass = unique ? "is-unique" : (distinct ? "is-distinct" : "is-common");
      return `
        <div class="mtc-compare-row-label mtc-compare-action-label ${indexClass} ${stateClass}">${esc(action.label)}</div>
        ${slots.map((slot, localIndex) => {
          const yes = hasAction(slot, action.key, actionGetter);
          const columnStyle = opts.columnStyle ? (opts.columnStyle(slot, localIndex, slots) || "") : "";
          const gradientClass = columnStyle ? "has-column-gradient" : "";
          return `<div class="mtc-compare-cell mtc-compare-x-cell ${indexClass} ${stateClass} ${gradientClass}" style="${attr(columnStyle)}">${yes ? `<span class="mtc-compare-x ${stateClass}">X</span>` : ""}</div>`;
        }).join("")}
        ${opts.addEmptyColumn ? `<div class="mtc-compare-cell mtc-compare-x-cell ${indexClass} mtc-compare-add-cell"></div>` : ""}
      `;
    }).join("");
  }

  function herbSearchName(herb){
    if(!herb) return "";
    return [herb.pinyinSansTons || herb.pinyin || herb.code, herb.hanzi, herb.nom]
      .map(text)
      .filter(Boolean)
      .join(" ");
  }

  function herbDisplayNameForLink(herb){
    return text(herb?.pinyinSansTons || herb?.pinyin || herb?.code || herb?.id || "");
  }

  function herbExactMatch(label){
    const key = normalizeKey(label);
    if(!key) return null;
    const herbs = Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
    return herbs.find(herb => {
      const aliases = [herb.id, herb.code, herb.pinyinSansTons, herb.pinyin, herb.hanzi, herb.nom, herbTitle(herb), herbSearchName(herb)]
        .map(normalizeKey)
        .filter(Boolean);
      return aliases.includes(key);
    }) || null;
  }

  function linkedReferenceTextHtml(value, exactMatch, displayNameForLink, refAttr, cssClass, titleGetter){
    const raw = text(value);
    if(!raw) return "";
    const parts = raw.split(/(\n|[,;+=]|\bvs\.?\b)/gi);
    return parts.map(part => {
      if(part === "\n") return "<br>";
      if([",", ";", "+", "="].includes(part)) return ` ${esc(part)} `;
      if(/^vs\.?$/i.test(part.trim())) return ` ${esc(part.trim())} `;
      const leading = part.match(/^\s*/)?.[0] || "";
      const trailing = part.match(/\s*$/)?.[0] || "";
      const core = part.trim();
      if(!core) return esc(part);
      const item = exactMatch(core);
      if(!item) return esc(part);
      const label = displayNameForLink(item) || core;
      const id = item.id || item.point || item.code || core;
      const title = titleGetter ? titleGetter(item, label) : label;
      return `${esc(leading)}<button type="button" class="${cssClass}" contenteditable="false" ${refAttr}="${attr(id)}" title="${attr(title)}">${esc(label)}</button>${esc(trailing)}`;
    }).join("");
  }

  function linkedHerbTextHtml(value){
    return linkedReferenceTextHtml(
      value,
      herbExactMatch,
      herbDisplayNameForLink,
      "data-pharma-ref-id",
      "pharma-association-link",
      (herb, label) => `Ouvrir ${herbTitle(herb) || label}`
    );
  }

  function defaultAssociationText(herb){
    const name = herbDisplayNameForLink(herb) || text(herb?.pinyin || herb?.code || herb?.id || "");
    return name ? `${name} + ` : "";
  }

  function defaultVsText(herb){
    const name = herbDisplayNameForLink(herb) || text(herb?.pinyin || herb?.code || herb?.id || "");
    return name ? `${name} vs ` : "";
  }

  function editablePharmaCellHtml(herb, field, value){
    const clean = cleanValue(value);
    const meta = {
      esprit:{placeholder:"Résumé global…", title:"Modifier l’esprit de cette substance"},
      notes:{placeholder:"Notes personnelles…", title:"Modifier les notes de cette substance"},
      associations:{placeholder:"Associations…", title:"Ajouter des associations avec assistance"},
      vs:{placeholder:"Comparaison…", title:"Noter les différences entre substances avec assistance"},
      formules:{placeholder:"Formules…", title:"Noter les formules qui contiennent cette substance"},
      precaution:{placeholder:"Précautions…", title:"Noter les précautions"}
    }[field] || {placeholder:"Écrire…", title:"Modifier"};
    const linkAssist = field === "associations" || field === "vs";
    const shown = !clean && field === "associations" ? defaultAssociationText(herb) : (!clean && field === "vs" ? defaultVsText(herb) : clean);
    const html = linkAssist
      ? linkedHerbTextHtml(shown)
      : (shown ? esc(shown).replace(/\n/g,"<br>") : "");
    return `
      <div
        class="pharma-comparison-editable pharma-comparison-editable-${attr(field)}"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        spellcheck="false"
        data-pharma-compare-edit="${attr(field)}"
        data-pharma-herb-id="${attr(herb?.id || "")}"
        data-raw-value="${attr(clean)}"
        ${linkAssist ? 'data-pharma-link-assist="1"' : ''}
        data-placeholder="${attr(meta.placeholder)}"
        title="${attr(meta.title)}">${html}</div>
    `;
  }


  function pointList(){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS) return Object.keys(POINT_DETAILS);
    }catch(error){}
    return Object.keys(window.POINT_DETAILS || {});
  }

  function compactKey(value){
    return normalizeKey(value).replace(/[\s._-]+/g, "");
  }

  function pointCodeWithSpace(point){
    return String(point || "").replace(/^([A-Za-z]+)(\d.*)$/,"$1 $2");
  }

  function pointSearchName(point){
    const details = getPointDetails(point);
    return [
      point,
      pointCodeWithSpace(point),
      pointTitle(point),
      details.pinyin,
      details.hanzi,
      details.nom_francais,
      details.nom_complet
    ].map(text).filter(Boolean).join(" ");
  }

  function pointDisplayNameForLink(point){
    return text(pointCodeWithSpace(point) || point || "");
  }

  function pointExactMatch(label){
    const key = normalizeKey(label);
    const compact = compactKey(label);
    if(!key) return null;
    return pointList().find(point => {
      const details = getPointDetails(point);
      const aliases = [point, pointCodeWithSpace(point), pointTitle(point), details.pinyin, details.hanzi, details.nom_francais, details.nom_complet]
        .map(normalizeKey)
        .filter(Boolean);
      const compactAliases = aliases.map(item => item.replace(/[\s._-]+/g, ""));
      return aliases.includes(key) || compactAliases.includes(compact);
    }) || null;
  }

  function linkedPointTextHtml(value){
    return linkedReferenceTextHtml(
      value,
      pointExactMatch,
      pointDisplayNameForLink,
      "data-acu-ref-id",
      "acu-association-link",
      point => `Ouvrir ${pointTitle(point)}`
    );
  }

  function acuAddHeaderHtml(){
    return `
      <div class="mtc-compare-header acu-compare-header mtc-compare-row-head mtc-compare-add-header">
        <label class="mtc-compare-add-label">Ajouter</label>
        <input
          type="text"
          class="mtc-compare-add-input"
          data-acu-compare-add-input="1"
          list="acuCompareAddList"
          placeholder="Taper un point…"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        >
        <datalist id="acuCompareAddList"></datalist>
      </div>
    `;
  }

  function acuEsprit(point, details){
    return text(localStorageValue(ACU_ESPRIT_PREFIX, point, details?.esprit || ""));
  }

  function acuAssociations(point, details){
    return text(localStorageValue(ACU_ASSOC_PREFIX, point, details?.associations || ""));
  }

  function acuVs(point, details){
    return text(localStorageValue(ACU_VS_PREFIX, point, details?.vs || details?.comparaison || ""));
  }

  function acuNote(point, details){
    return typeof window.getEditablePointNote === "function"
      ? window.getEditablePointNote(point, details?.notes || "")
      : text(localStorageValue(ACU_NOTE_PREFIX, point, details?.notes || ""));
  }

  function defaultAcuAssociationText(point){
    const name = pointDisplayNameForLink(point) || pointTitle(point) || point;
    return name ? `${name} + ` : "";
  }

  function defaultAcuVsText(point){
    const name = pointDisplayNameForLink(point) || pointTitle(point) || point;
    return name ? `${name} vs ` : "";
  }

  function editableAcuCellHtml(point, field, value){
    const clean = cleanValue(value);
    const meta = {
      esprit:{placeholder:"Esprit du point…", title:"Modifier l’esprit de ce point"},
      notes:{placeholder:"Notes personnelles…", title:"Modifier les notes de ce point"},
      associations:{placeholder:"Associations…", title:"Ajouter des associations de points avec assistance"},
      vs:{placeholder:"Comparaison…", title:"Noter les différences entre points avec assistance"}
    }[field] || {placeholder:"Écrire…", title:"Modifier"};
    const linkAssist = field === "associations" || field === "vs";
    const shown = !clean && field === "associations" ? defaultAcuAssociationText(point) : (!clean && field === "vs" ? defaultAcuVsText(point) : clean);
    const html = linkAssist ? linkedPointTextHtml(shown) : (shown ? esc(shown).replace(/\n/g,"<br>") : "");
    return `
      <div
        class="acu-comparison-editable acu-comparison-editable-${attr(field)}"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        spellcheck="false"
        data-acu-compare-edit="${attr(field)}"
        data-acu-point-id="${attr(point)}"
        data-raw-value="${attr(clean)}"
        ${linkAssist ? 'data-acu-link-assist="1"' : ''}
        data-placeholder="${attr(meta.placeholder)}"
        title="${attr(meta.title)}">${html}</div>
    `;
  }

  function renderAcuComparisonPanelClean(){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    const slots = getAcuSlots();
    const count = Math.max(1, slots.length + 1);

    if(!slots.length){
      content.innerHTML = `
        ${compareTitlebarHtml("Comparaison ACU")}
        <div class="mtc-compare-empty-add">
          <p class="stats-small">Aucun point n’est encore placé en comparaison. Ajoute un point en tapant son nom ci-dessous.</p>
          ${acuAddHeaderHtml()}
        </div>
      `;
      return;
    }

    const rows = [
      ["Esprit", slot => editableAcuCellHtml(slot.id, "esprit", acuEsprit(slot.id, getPointDetails(slot.id))), {html:true, rowKind:"esprit", cellClass:"acu-esprit-cell"}],
      ["Pinyin", slot => getPointDetails(slot.id).pinyin, {}],
      ["Hanzi", slot => getPointDetails(slot.id).hanzi, {}],
      ["Nom en français", slot => getPointDetails(slot.id).nom_francais || getPointDetails(slot.id).nom_complet, {}],
      ["Localisation", slot => getPointDetails(slot.id).localisation, {}],
      ["Méthode de localisation", slot => getPointDetails(slot.id).methode_localisation, {}],
      ["Méthode de travail", slot => getPointDetails(slot.id).methode_travail, {}],
      ["Catégories du point", slot => getPointDetails(slot.id).categories_du_point, {}],
      ["Correspondances", slot => getPointDetails(slot.id).correspondances, {}],
      ["Indications", slot => getPointDetails(slot.id).indications, {}],
      ["Associations", slot => editableAcuCellHtml(slot.id, "associations", acuAssociations(slot.id, getPointDetails(slot.id))), {html:true, rowKind:"associations", cellClass:"acu-associations-cell"}],
      ["VS.", slot => editableAcuCellHtml(slot.id, "vs", acuVs(slot.id, getPointDetails(slot.id))), {html:true, rowKind:"comparaison", cellClass:"acu-vs-cell"}]
    ];

    const actionStart = rows.length;
    const notesIndex = actionStart + unionActionRows(slots, slot => pointActions(slot.id)).length;

    content.innerHTML = `
      ${compareTitlebarHtml("Comparaison ACU")}
      <div class="mtc-compare-scroll" role="region" aria-label="Tableau de comparaison ACU">
        <div class="mtc-compare-matrix mtc-compare-acu" style="--comparison-count:${count}">
          <div class="mtc-compare-corner mtc-compare-row-head"></div>
          ${slots.map(acuHeaderHtml).join("")}
          ${acuAddHeaderHtml()}
          ${rows.map(([label, getter, options], index) => rowHtml(label, slots, getter, Object.assign({}, options || {}, {rowIndex:index, addEmptyColumn:true}))).join("")}
          ${actionMatrixHtml(slots, slot => pointActions(slot.id), actionStart, {addEmptyColumn:true})}
          ${rowHtml("Notes", slots, slot => editableAcuCellHtml(slot.id, "notes", acuNote(slot.id, getPointDetails(slot.id))), {rowIndex:notesIndex, html:true, rowKind:"notes", cellClass:"acu-notes-cell", addEmptyColumn:true})}
        </div>
      </div>
    `;

    if(typeof window.enhancePointReferencesInPanel === "function"){
      window.enhancePointReferencesInPanel(content);
    }
  }

  function fieldTokenLabels(field, herb){
    if(typeof window.getPharmaFieldTokenLabels === "function"){
      try{ return window.getPharmaFieldTokenLabels(field, herb) || []; }catch(error){}
    }
    const value = field === "tropism" ? herb?.tropisme : herb?.[field];
    return splitActionText(String(value || "").replace(/,/g,"\n"));
  }

  function tropismClass(label){
    const key = normalizeKey(label);
    if(["f", "vb", "foie", "vesicule biliaire", "vésicule biliaire"].includes(key)) return "tropism-wood";
    if(["c", "ig", "ec", "tf", "coeur", "cœur", "intestin grele", "intestin grêle", "enveloppe du coeur", "enveloppe du cœur", "trois foyers"].includes(key)) return "tropism-fire";
    if(["rt", "e", "rate", "estomac"].includes(key)) return "tropism-earth";
    if(["p", "gi", "poumon", "gros intestin"].includes(key)) return "tropism-metal";
    if(["rn", "v", "rein", "reins", "vessie"].includes(key)) return "tropism-water";
    return "tropism-axis";
  }

  function tropismTokensHtml(herb){
    const labels = fieldTokenLabels("tropism", herb);
    if(!labels.length) return `<span class="mtc-compare-empty">—</span>`;
    return labels.map(label => `<span class="pharma-token-chip pharma-tropism-token ${attr(tropismClass(label))}">${esc(label)}</span>`).join(" ");
  }

  function natureStopFromToken(token){
    const key = normalizeKey(token);
    if(!key) return null;
    const light = key.includes("leger") || key.includes("légèrement") || key.includes("peu ");
    const strong = key.includes("++") || key.includes("tres") || key.includes("très") || key.includes("fort") || key.includes("extreme") || key.includes("extrême");
    // La toxicité ne doit jamais entrer dans le dégradé de Nature :
    // elle reste une information textuelle dans la cellule, pas une couleur de colonne.
    if(isToxicLabel(token)) return null;
    if(key.includes("chaude") || key.includes("chaud")){
      if(light || key.includes("tiede") || key.includes("tiède")) return "rgba(255,57,44,.11)";
      if(strong) return "rgba(255,38,28,.34)";
      return "rgba(255,48,38,.25)";
    }
    if(key.includes("tiede") || key.includes("tiède")) return "rgba(255,57,44,.12)";
    if(key.includes("neutre") || key.includes("equilibree") || key.includes("équilibrée") || key.includes("equilibre") || key.includes("équilibre")) return "rgba(255,255,255,.15)";
    if(key.includes("froide") || key.includes("froid")){
      if(light) return "rgba(25,92,255,.10)";
      if(strong) return "rgba(25,82,255,.34)";
      return "rgba(25,92,255,.25)";
    }
    if(key.includes("fraiche") || key.includes("fraîche") || key.includes("frais")) return "rgba(25,92,255,.12)";
    return null;
  }

  function rgbaParts(css){
    const match = String(css || "").match(/rgba?\(([^)]+)\)/i);
    if(!match) return [255,255,255,0];
    const parts = match[1].split(",").map(part => part.trim());
    return [
      Number(parts[0]) || 0,
      Number(parts[1]) || 0,
      Number(parts[2]) || 0,
      parts[3] === undefined ? 1 : Math.max(0, Math.min(1, Number(parts[3]) || 0))
    ];
  }

  function rgbaCss(parts){
    return `rgba(${Math.round(parts[0])},${Math.round(parts[1])},${Math.round(parts[2])},${Math.round((parts[3] || 0) * 1000) / 1000})`;
  }

  function mixColor(a, b){
    const aa = rgbaParts(a);
    const bb = rgbaParts(b);
    return rgbaCss([
      (aa[0] + bb[0]) / 2,
      (aa[1] + bb[1]) / 2,
      (aa[2] + bb[2]) / 2,
      Math.max(aa[3], bb[3]) * .82
    ]);
  }

  function natureStops(labels){
    const raw = (labels || []).map(text).filter(Boolean);
    const stops = [];
    raw.forEach(label => {
      const parts = label
        .replace(/[()]/g, " ")
        .split(/[,;·•\/]+|\s+et\s+|\s+ou\s+/i)
        .map(item => item.trim())
        .filter(Boolean);
      (parts.length ? parts : [label]).forEach(part => {
        const color = natureStopFromToken(part);
        if(color) stops.push(color);
      });
    });
    return stops;
  }

  function herbNatureColors(herb){
    if(!herb) return [];
    const labels = fieldTokenLabels("nature", herb);
    return natureStops(labels);
  }

  function hasToxicity(herb){
    return toxicityLabels(herb).length > 0;
  }

  function natureGradientStyleForHerb(herb, previousHerb, nextHerb){
    const ownRaw = herbNatureColors(herb);
    if(!ownRaw.length) return "";
    const own = ownRaw.length === 1 ? [ownRaw[0], ownRaw[0]] : ownRaw;
    const prev = previousHerb ? herbNatureColors(previousHerb) : [];
    const next = nextHerb ? herbNatureColors(nextHerb) : [];
    const ownFirst = own[0];
    const ownLast = own[own.length - 1];
    const leftBoundary = prev.length ? mixColor(prev[prev.length - 1], ownFirst) : ownFirst;
    const rightBoundary = next.length ? mixColor(ownLast, next[0]) : ownLast;
    const stops = [];
    stops.push(`${leftBoundary} 0%`);
    stops.push(`${ownFirst} 8%`);
    if(own.length === 2 && own[0] === own[1]){
      stops.push(`${ownFirst} 92%`);
    }else{
      own.forEach((color, index) => {
        const pos = 14 + Math.round((index / Math.max(1, own.length - 1)) * 72);
        stops.push(`${color} ${pos}%`);
      });
      stops.push(`${ownLast} 92%`);
    }
    stops.push(`${rightBoundary} 100%`);
    return `--nature-gradient:linear-gradient(90deg, ${stops.join(", ")});`;
  }


  function columnNatureStyleForPharmaSlot(slot, localIndex, slots){
    const herb = getHerb(slot?.id);
    if(!herb) return "";
    const previousHerb = localIndex > 0 ? getHerb(slots[localIndex - 1]?.id) : null;
    const nextHerb = localIndex < slots.length - 1 ? getHerb(slots[localIndex + 1]?.id) : null;
    const style = natureGradientStyleForHerb(herb, previousHerb, nextHerb);
    return style ? style.replace("--nature-gradient:", "--column-nature-gradient:") : "";
  }

  function natureTokensHtml(herb){
    const labels = fieldTokenLabels("nature", herb).filter(label => !isToxicLabel(label));
    if(!labels.length) return `<span class="mtc-compare-empty">—</span>`;
    return labels.map(label => `<span class="pharma-token-chip pharma-nature-token">${esc(label)}</span>`).join(" ");
  }

  function natureCellHtml(herb, localIndex, slots){
    const labels = fieldTokenLabels("nature", herb);
    const previousHerb = localIndex > 0 ? getHerb(slots[localIndex - 1]?.id) : null;
    const nextHerb = localIndex < slots.length - 1 ? getHerb(slots[localIndex + 1]?.id) : null;
    const toxicity = toxicityTokensHtml(herb);
    const body = [natureTokensHtml(herb), toxicity].filter(Boolean).join(" ");
    const toxicClass = hasToxicity(herb) ? " is-toxic-cell" : "";
    return `<div class="mtc-nature-gradient-inner${toxicClass}" style="${attr(natureGradientStyleForHerb(herb, previousHerb, nextHerb))}">${body}</div>`;
  }

  function flavorStrengthClass(label){
    const key = normalizeKey(label);
    if(key.includes("++") || key.includes("tres") || key.includes("fort") || key.includes("prononce")) return "flavor-strong";
    if(key.includes("leger") || key.includes("légèrement") || key.includes("faible")) return "flavor-light";
    return "flavor-normal";
  }

  function flavorClass(label){
    const key = normalizeKey(label);
    if(key.includes("amer")) return "flavor-bitter";
    if(key.includes("piquant") || key.includes("acre") || key.includes("âcre")) return "flavor-pungent";
    if(key.includes("doux") || key.includes("douce")) return "flavor-sweet";
    if(key.includes("acide") || key.includes("aigre")) return "flavor-sour";
    if(key.includes("sale") || key.includes("salé") || key.includes("salin")) return "flavor-salty";
    return "flavor-other";
  }

  function flavorTokensHtml(herb){
    const labels = fieldTokenLabels("saveur", herb);
    if(!labels.length) return `<span class="mtc-compare-empty">—</span>`;
    return labels.map(label => `<span class="pharma-token-chip pharma-flavor-token ${attr(flavorClass(label))} ${attr(flavorStrengthClass(label))}">${esc(label)}</span>`).join(" ");
  }

  function isToxicLabel(label){
    const key = normalizeKey(label);
    return key.includes("toxique") || key.includes("toxicity") || key.includes("toxicite") || key.includes("toxicité");
  }

  function toxicityTokensHtml(herb){
    const labels = toxicityLabels(herb);
    if(!labels.length) return "";
    return labels.map(label => `<span class="pharma-token-chip pharma-toxicity-token">${esc(label)}</span>`).join(" ");
  }

  function toxicityLabels(herb){
    const labels = [
      ...fieldTokenLabels("toxicity", herb),
      ...fieldTokenLabels("toxicite", herb),
      ...fieldTokenLabels("nature", herb).filter(isToxicLabel)
    ].map(text).filter(Boolean);
    const seen = new Set();
    return labels.filter(label => {
      const key = normalizeKey(label);
      if(!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }


  function renderPharmaComparisonPanelClean(){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    const slots = getPharmaSlots();
    const count = Math.max(1, slots.length + 1);

    if(!slots.length){
      content.innerHTML = `
        ${compareTitlebarHtml("Comparaison PHARMA")}
        <div class="mtc-compare-empty-add">
          <p class="stats-small">Aucune substance n’est encore placée en comparaison. Ajoute une substance en tapant son nom ci-dessous.</p>
          ${pharmaAddHeaderHtml()}
        </div>
      `;
      return;
    }

    let rowIndex = 0;
    const baseRows = [
      ["Esprit", slot => editablePharmaCellHtml(getHerb(slot.id), "esprit", herbEsprit(getHerb(slot.id))), {html:true, rowKind:"esprit", cellClass:"pharma-esprit-cell"}],
      ["Classe", slot => herbClassLabel(getHerb(slot.id)), {rowKind:"classe"}],
      ["Nature", (slot, localIndex, allSlots) => natureCellHtml(getHerb(slot.id), localIndex, allSlots), {html:true, rowKind:"nature", cellClass:"mtc-compare-nature-cell"}],
      ["Saveur", slot => flavorTokensHtml(getHerb(slot.id)), {html:true, rowKind:"saveur", cellClass:"mtc-compare-flavor-cell"}],
      ["Tropisme", slot => tropismTokensHtml(getHerb(slot.id)), {html:true, rowKind:"tropisme", cellClass:"mtc-compare-tropism-cell"}],
      ["Posologie", slot => getHerb(slot.id)?.posologie, {rowKind:"posologie"}],
      ["Précaution", slot => editablePharmaCellHtml(getHerb(slot.id), "precaution", herbPrecaution(getHerb(slot.id))), {html:true, rowKind:"precaution", cellClass:"pharma-precaution-cell"}],
      ["Associations", slot => editablePharmaCellHtml(getHerb(slot.id), "associations", herbAssociations(getHerb(slot.id))), {html:true, rowKind:"associations", cellClass:"pharma-associations-cell"}],
      ["VS.", slot => editablePharmaCellHtml(getHerb(slot.id), "vs", herbVs(getHerb(slot.id))), {html:true, rowKind:"comparaison", cellClass:"pharma-vs-cell"}],
      ["Formules", slot => editablePharmaCellHtml(getHerb(slot.id), "formules", herbFormules(getHerb(slot.id))), {html:true, rowKind:"formules", cellClass:"pharma-formules-cell"}]
    ];

    const rowsHtml = baseRows.map(([label, getter, options]) => {
      const html = rowHtml(label, slots, getter, Object.assign({}, options, {rowIndex, columnStyle:columnNatureStyleForPharmaSlot, addEmptyColumn:true}));
      rowIndex += 1;
      return html;
    }).join("");

    const actionsHtml = actionMatrixHtml(slots, slot => herbActions(getHerb(slot.id)), rowIndex, {columnStyle:columnNatureStyleForPharmaSlot, addEmptyColumn:true});
    rowIndex += unionActionRows(slots, slot => herbActions(getHerb(slot.id))).length;

    const notesHtml = rowHtml("Notes", slots, slot => editablePharmaCellHtml(getHerb(slot.id), "notes", herbNotes(getHerb(slot.id))), {
      html:true,
      rowKind:"notes",
      cellClass:"pharma-notes-cell",
      rowIndex,
      columnStyle:columnNatureStyleForPharmaSlot,
      addEmptyColumn:true
    });

    content.innerHTML = `
      ${compareTitlebarHtml("Comparaison PHARMA")}
      <div class="mtc-compare-scroll" role="region" aria-label="Tableau de comparaison PHARMA">
        <div class="mtc-compare-matrix mtc-compare-pharma" style="--comparison-count:${count}">
          <div class="mtc-compare-corner mtc-compare-row-head"></div>
          ${slots.map((slot, localIndex) => pharmaHeaderHtml(slot, localIndex, slots)).join("")}
          ${pharmaAddHeaderHtml()}
          ${rowsHtml}
          ${actionsHtml}
          ${notesHtml}
        </div>
      </div>
    `;
  }

  window.clearComparisonPanelClean = function(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    const slots = isPharma() ? getPharmaSlots() : getAcuSlots();
    slots.forEach(slot => {
      if(typeof window.clearComparisonPoint === "function") window.clearComparisonPoint(slot.index);
    });
    try{
      localStorage.setItem(isPharma() ? PHARMA_KEY : ACU_KEY, JSON.stringify([]));
    }catch(error){}
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    setTimeout(() => {
      if(typeof window.renderComparisonPanel === "function") window.renderComparisonPanel();
      if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
    }, 0);
  };

  window.clearComparisonSlotClean = function(slotIndex, event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    if(typeof window.clearComparisonPoint === "function"){
      window.clearComparisonPoint(slotIndex);
    }
    setTimeout(() => {
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
    }, 0);
  };

  window.renderComparisonPanel = function(){
    if(isPharma()) return renderPharmaComparisonPanelClean();
    return renderAcuComparisonPanelClean();
  };

  window.renderComparisonPanelIfOpen = function(){
    const panel = byId("comparisonPanel");
    if(panel && panel.classList.contains("open")) return window.renderComparisonPanel();
  };

  window.openComparisonPanel = function(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(typeof window.closeAllBottomPanels === "function") window.closeAllBottomPanels("comparisonPanel");
    window.renderComparisonPanel();
    panel.classList.add("open");
  };

  window.toggleComparisonPanel = function(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openComparisonPanel();
  };

  function shouldUseMobileSynthesisButtons(){
    try{
      return window.matchMedia && (
        window.matchMedia("(max-width: 699px)").matches ||
        window.matchMedia("(pointer: coarse)").matches
      );
    }catch(error){
      return false;
    }
  }

  function removePharmaSolvedInfoButtons(){
    document.querySelectorAll(".pharma-solved-info-button").forEach(button => button.remove());
    document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(item => item.classList.remove("pharma-synthesis-open"));
  }

  function addPharmaSolvedInfoButtons(root){
    if(!isPharma() || !shouldUseMobileSynthesisButtons()){
      removePharmaSolvedInfoButtons();
      return;
    }
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".pharma-solved-point[data-esprit-tooltip]").forEach(item => {
      if(item.querySelector(".pharma-solved-info-button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-info-button pharma-solved-info-button";
      button.title = "Afficher la synthèse";
      button.setAttribute("aria-label", "Afficher la synthèse de cette substance");
      button.textContent = "💡";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(other => {
          if(other !== item) other.classList.remove("pharma-synthesis-open");
        });
        item.classList.toggle("pharma-synthesis-open");
      });
      item.appendChild(button);
    });
  }

  document.addEventListener("click", event => {
    if(!event.target.closest(".pharma-solved-info-button") && !event.target.closest(".pharma-solved-point.pharma-synthesis-open")){
      document.querySelectorAll(".pharma-solved-point.pharma-synthesis-open").forEach(item => item.classList.remove("pharma-synthesis-open"));
    }
  }, true);

  const observer = new MutationObserver(mutations => {
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node => {
        if(node.nodeType === 1) addPharmaSolvedInfoButtons(node);
      });
    }
  });

  function init(){
    addPharmaSolvedInfoButtons(document);
    const solved = byId("solved");
    if(solved) observer.observe(solved, {childList:true, subtree:true});
    try{
      const media = window.matchMedia("(max-width: 699px), (pointer: coarse)");
      const refresh = () => addPharmaSolvedInfoButtons(document);
      if(media.addEventListener) media.addEventListener("change", refresh);
      else if(media.addListener) media.addListener(refresh);
    }catch(error){}
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();



  function saveAcuEditable(editable){
    if(!editable) return;
    const point = editable.dataset.acuPointId || "";
    const field = editable.dataset.acuCompareEdit || "";
    if(!point) return;
    const value = String(editable.innerText || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if(field === "esprit") setLocalStorageValue(ACU_ESPRIT_PREFIX, point, value);
    if(field === "notes") setLocalStorageValue(ACU_NOTE_PREFIX, point, value);
    if(field === "associations") setLocalStorageValue(ACU_ASSOC_PREFIX, point, value);
    if(field === "vs") setLocalStorageValue(ACU_VS_PREFIX, point, value);
  }

  function addPointFromComparisonInput(input){
    if(!input) return false;
    const value = String(input.value || "").trim();
    if(!value) return false;
    let point = pointExactMatch(value);
    if(!point){
      const suggestions = pointSuggestions(value);
      point = suggestions[0] || null;
    }
    if(!point) return false;
    if(typeof window.addPointToComparison === "function"){
      window.addPointToComparison(point, {autoOpen:false});
    }else{
      const raw = readJson(ACU_KEY, []);
      const slots = Array.isArray(raw) ? raw : [];
      if(!slots.includes(point)) slots.push(point);
      try{ localStorage.setItem(ACU_KEY, JSON.stringify(slots)); }catch(error){}
    }
    input.value = "";
    setTimeout(() => {
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
      if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
      if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
    }, 0);
    return true;
  }

  function addHerbFromComparisonInput(input){
    if(!input) return false;
    const value = String(input.value || "").trim();
    if(!value) return false;
    let herb = herbExactMatch(value);
    if(!herb){
      const suggestions = associationSuggestions(value);
      herb = suggestions[0] || null;
    }
    if(!herb) return false;
    if(typeof window.addPointToComparison === "function"){
      window.addPointToComparison(herb.id, {autoOpen:false});
    }else{
      const raw = readJson(PHARMA_KEY, []);
      const slots = Array.isArray(raw) ? raw : [];
      if(!slots.includes(herb.id)) slots.push(herb.id);
      try{ localStorage.setItem(PHARMA_KEY, JSON.stringify(slots)); }catch(error){}
    }
    input.value = "";
    setTimeout(() => {
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
      if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
      if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
    }, 0);
    return true;
  }

  function compactIdsFromStorage(key){
    const raw = readJson(key, []);
    return (Array.isArray(raw) ? raw : []).map(item => String(item || "")).filter(Boolean);
  }

  function reorderComparisonIds(fromId, toId){
    const key = isPharma() ? PHARMA_KEY : ACU_KEY;
    const ids = compactIdsFromStorage(key);
    const from = ids.indexOf(String(fromId || ""));
    const to = ids.indexOf(String(toId || ""));
    if(from < 0 || to < 0 || from === to) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try{ localStorage.setItem(key, JSON.stringify(ids)); }catch(error){}
    if(typeof window.updateComparisonButtonLabel === "function") window.updateComparisonButtonLabel();
    if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
    if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
  }

  document.addEventListener("dragstart", event => {
    const header = event.target?.closest?.(".mtc-compare-header[draggable='true'][data-compare-id]");
    if(!header) return;
    header.classList.add("is-dragging");
    try{
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", header.dataset.compareId || "");
    }catch(error){}
  });

  document.addEventListener("dragend", event => {
    event.target?.closest?.(".mtc-compare-header")?.classList.remove("is-dragging");
  });

  document.addEventListener("dragover", event => {
    const header = event.target?.closest?.(".mtc-compare-header[draggable='true'][data-compare-id]");
    if(!header) return;
    event.preventDefault();
    header.classList.add("is-drag-over");
  });

  document.addEventListener("dragleave", event => {
    event.target?.closest?.(".mtc-compare-header")?.classList.remove("is-drag-over");
  });

  document.addEventListener("drop", event => {
    const header = event.target?.closest?.(".mtc-compare-header[draggable='true'][data-compare-id]");
    if(!header) return;
    event.preventDefault();
    header.classList.remove("is-drag-over");
    let fromId = "";
    try{ fromId = event.dataTransfer.getData("text/plain"); }catch(error){}
    reorderComparisonIds(fromId, header.dataset.compareId || "");
  });

  document.addEventListener("keydown", event => {
    const pharmaInput = event.target?.closest?.("[data-pharma-compare-add-input]");
    const acuInput = event.target?.closest?.("[data-acu-compare-add-input]");
    const input = pharmaInput || acuInput;
    if(!input) return;
    if(event.key === "Enter"){
      event.preventDefault();
      if(pharmaInput) addHerbFromComparisonInput(pharmaInput);
      if(acuInput) addPointFromComparisonInput(acuInput);
    }
  });

  document.addEventListener("change", event => {
    const pharmaInput = event.target?.closest?.("[data-pharma-compare-add-input]");
    const acuInput = event.target?.closest?.("[data-acu-compare-add-input]");
    if(pharmaInput) addHerbFromComparisonInput(pharmaInput);
    if(acuInput) addPointFromComparisonInput(acuInput);
  });

  function savePharmaEditable(editable){
    if(!editable) return;
    const herbId = editable.dataset.pharmaHerbId || "";
    const field = editable.dataset.pharmaCompareEdit || "";
    if(!herbId) return;
    const value = String(editable.innerText || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if(field === "esprit") setLocalStorageValue(PHARMA_ESPRIT_PREFIX, herbId, value);
    if(field === "notes") setLocalStorageValue(PHARMA_NOTES_PREFIX, herbId, value);
    if(field === "associations") setLocalStorageValue(PHARMA_ASSOC_PREFIX, herbId, value);
    if(field === "vs") setLocalStorageValue(PHARMA_VS_PREFIX, herbId, value);
    if(field === "formules") setLocalStorageValue(PHARMA_FORMULES_PREFIX, herbId, value);
    if(field === "precaution") setLocalStorageValue(PHARMA_PRECAUTION_PREFIX, herbId, value);
  }

  function startsWithAnyAlias(aliases, key, compact){
    return (aliases || []).some(alias => {
      const normalized = normalizeKey(alias);
      const compactAlias = compactKey(alias);
      return (key && normalized.startsWith(key)) || (compact && compactAlias.startsWith(compact));
    });
  }

  function pointSuggestionAliases(point){
    const details = getPointDetails(point);
    /*
      Autocomplete ACU strict : on ne cherche plus dans tous les textes
      de la fiche (nom français, nom complet, titre…), car cela faisait
      remonter des points qui ne commençaient pas par la saisie.
      Pour ajouter/comparer un point, on filtre seulement sur :
      - le code du point : V1, V 1, DM1, DM 1…
      - le pinyin du nom du point.
    */
    const code = text(point);
    const codeSpaced = text(pointCodeWithSpace(point));
    const pinyin = text(details.pinyin);
    const pinyinPlain = pinyin
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return [code, codeSpaced, pinyin, pinyinPlain].map(text).filter(Boolean);
  }

  function herbSuggestionAliases(herb){
    return [
      herb?.pinyinSansTons,
      herb?.pinyin,
      herb?.code,
      herb?.id,
      herb?.hanzi,
      herb?.nom,
      herbTitle(herb),
      herbSearchName(herb)
    ].map(text).filter(Boolean);
  }

  function pointSuggestions(query){
    const key = normalizeKey(query);
    const compact = compactKey(query);
    if(key.length < 1) return [];
    return pointList()
      .map(point => ({point, aliases: pointSuggestionAliases(point)}))
      .filter(item => startsWithAnyAlias(item.aliases, key, compact))
      .sort((a, b) => {
        const aCode = compactKey(a.point);
        const bCode = compactKey(b.point);
        const aExactPrefix = aCode.startsWith(compact) ? 0 : 1;
        const bExactPrefix = bCode.startsWith(compact) ? 0 : 1;
        if(aExactPrefix !== bExactPrefix) return aExactPrefix - bExactPrefix;
        return aCode.localeCompare(bCode, "fr-FR", {numeric:true});
      })
      .slice(0, 9)
      .map(item => item.point);
  }

  function associationSuggestions(query){
    const key = normalizeKey(query);
    const compact = compactKey(query);
    if(key.length < 1) return [];
    const herbs = Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
    return herbs
      .map(herb => ({herb, aliases: herbSuggestionAliases(herb)}))
      .filter(item => startsWithAnyAlias(item.aliases, key, compact))
      .slice(0, 7)
      .map(item => item.herb);
  }

  function updateCompareAddDatalist(input){
    if(!input) return;
    const isAcuInput = !!input.closest?.("[data-acu-compare-add-input], input[data-acu-compare-add-input]") || input.hasAttribute?.("data-acu-compare-add-input");
    const isPharmaInput = !!input.closest?.("[data-pharma-compare-add-input], input[data-pharma-compare-add-input]") || input.hasAttribute?.("data-pharma-compare-add-input");
    const query = String(input.value || "").trim();
    const listId = input.getAttribute("list") || "";
    const list = listId ? document.getElementById(listId) : null;
    if(!list) return;
    if(!query){
      list.innerHTML = "";
      return;
    }
    if(isAcuInput){
      list.innerHTML = pointSuggestions(query)
        .map(point => `<option value="${attr(pointCodeWithSpace(point))}">${esc(pointTitle(point))}</option>`)
        .join("");
    }else if(isPharmaInput){
      list.innerHTML = associationSuggestions(query)
        .map(herb => `<option value="${attr(herbSearchName(herb))}"></option>`)
        .join("");
    }
  }

  function selectionOffsetInEditable(editable){
    if(!editable) return -1;
    const selection = window.getSelection && window.getSelection();
    if(!selection || !selection.rangeCount) return -1;
    const range = selection.getRangeAt(0);
    if(!editable.contains(range.endContainer)) return -1;
    const probe = range.cloneRange();
    probe.selectNodeContents(editable);
    probe.setEnd(range.endContainer, range.endOffset);
    return String(probe.toString() || "").length;
  }

  function setCaretAtEnd(editable){
    if(!editable || !document.createRange || !window.getSelection) return;
    editable.focus();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function plainifyLinkAssistEditable(editable, moveCaretToEnd){
    if(!editable || editable.dataset.assistPlainMode === "1") return;
    const raw = String(editable.innerText || "").replace(/\u00a0/g, " ");
    if(editable.querySelector("a") || editable.querySelector("button") || editable.innerHTML.includes("&")){
      editable.textContent = raw;
    }
    editable.dataset.assistPlainMode = "1";
    if(moveCaretToEnd) setCaretAtEnd(editable);
  }

  function linkifiedHtmlForEditable(editable, value){
    const raw = String(value || "");
    if(!editable) return esc(raw).replace(/\n/g, "<br>");
    if(editable.dataset.pharmaLinkAssist === "1") return linkedHerbTextHtml(raw);
    if(editable.dataset.acuLinkAssist === "1") return linkedPointTextHtml(raw);
    return esc(raw).replace(/\n/g, "<br>");
  }

  function linkifyLinkAssistEditable(editable, value, moveCaretToEnd){
    if(!editable) return;
    const raw = String(value != null ? value : editable.innerText || "").replace(/\u00a0/g, " ");
    editable.innerHTML = linkifiedHtmlForEditable(editable, raw);
    editable.dataset.assistPlainMode = "0";
    if(moveCaretToEnd) setCaretAtEnd(editable);
  }

  function currentAssistRange(raw, editable){
    const source = String(raw || "");
    const caret = selectionOffsetInEditable(editable);
    const end = caret >= 0 ? caret : source.length;
    const before = source.slice(0, end);
    const re = /[,;+=\n:]|\bvs\.?\b/gi;
    let match;
    let start = 0;
    while((match = re.exec(before))){
      start = match.index + match[0].length;
    }
    while(start < end && /\s/.test(source[start])) start++;
    return {start, end};
  }

  function currentAssocQuery(editable){
    if(editable) plainifyLinkAssistEditable(editable, false);
    const raw = String(editable?.innerText || "");
    const range = currentAssistRange(raw, editable);
    return raw.slice(range.start, range.end).trim();
  }

  function ensureSuggestionBox(){
    let box = document.getElementById("pharmaAssociationSuggestBox");
    if(!box){
      box = document.createElement("div");
      box.id = "pharmaAssociationSuggestBox";
      box.className = "pharma-association-suggest-box";
      box.setAttribute("role", "listbox");
      document.body.appendChild(box);
    }
    return box;
  }

  function hideAssociationSuggestions(){
    const box = document.getElementById("pharmaAssociationSuggestBox");
    if(box) box.classList.remove("open");
  }

  function updateAssociationSuggestions(editable){
    const pharmaAssist = editable?.dataset?.pharmaLinkAssist === "1";
    const acuAssist = editable?.dataset?.acuLinkAssist === "1";
    if(!editable || (!pharmaAssist && !acuAssist)){
      hideAssociationSuggestions();
      return;
    }
    const query = currentAssocQuery(editable);
    const suggestions = pharmaAssist ? associationSuggestions(query) : pointSuggestions(query);
    if(!suggestions.length){
      hideAssociationSuggestions();
      return;
    }
    const box = ensureSuggestionBox();
    if(pharmaAssist){
      box.innerHTML = suggestions.map(herb => `
        <button type="button" data-suggestion-herb-id="${attr(herb.id)}">
          <strong>${esc(herbDisplayNameForLink(herb) || herb.id)}</strong>
          ${herb.nom ? `<span>${esc(herb.nom)}</span>` : ""}
        </button>
      `).join("");
      box.dataset.targetKind = "pharma";
      box.dataset.targetId = editable.dataset.pharmaHerbId || "";
      box.dataset.targetField = editable.dataset.pharmaCompareEdit || "";
    }else{
      box.innerHTML = suggestions.map(point => `
        <button type="button" data-suggestion-point-id="${attr(point)}">
          <strong>${esc(pointDisplayNameForLink(point) || point)}</strong>
          ${pointTitle(point) ? `<span>${esc(pointTitle(point))}</span>` : ""}
        </button>
      `).join("");
      box.dataset.targetKind = "acu";
      box.dataset.targetId = editable.dataset.acuPointId || "";
      box.dataset.targetField = editable.dataset.acuCompareEdit || "";
    }
    const rect = editable.getBoundingClientRect();
    box.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 260))}px`;
    box.style.top = `${Math.min(window.innerHeight - 80, rect.bottom + 6)}px`;
    box.classList.add("open");
  }

  function separatorAfterSuggestion(editable){
    const field = editable?.dataset?.pharmaCompareEdit || editable?.dataset?.acuCompareEdit || "";
    if(field === "associations") return " + ";
    if(field === "vs") return " vs ";
    return " ";
  }

  function insertSuggestionIntoEditable(editable, label, saveFn){
    if(!editable || !label) return;
    plainifyLinkAssistEditable(editable, false);
    const raw = String(editable.innerText || "");
    const range = currentAssistRange(raw, editable);
    const before = raw.slice(0, range.start);
    const after = raw.slice(range.end);
    const separator = separatorAfterSuggestion(editable);
    const next = (before + label + separator + after.replace(/^\s+/, "")).replace(/[ \t]{2,}/g, " ");

    /*
      Après une suggestion, on ré-affiche immédiatement les références sous forme
      de liens. Le champ redevient automatiquement du texte simple dès qu'on
      clique dans une zone non-lien pour continuer à écrire ou supprimer un mot.
      Cela évite le bug du champ VS où les éléments ajoutés restaient tous en
      texte non cliquable jusqu'au prochain rendu complet.
    */
    linkifyLinkAssistEditable(editable, next, true);
    saveFn(editable);
    hideAssociationSuggestions();
  }

  function insertAssociationSuggestion(editable, herb){
    if(!editable || !herb) return;
    insertSuggestionIntoEditable(editable, herbDisplayNameForLink(herb) || herb.id, savePharmaEditable);
  }

  function insertPointSuggestion(editable, point){
    if(!editable || !point) return;
    insertSuggestionIntoEditable(editable, pointDisplayNameForLink(point) || point, saveAcuEditable);
  }

  document.addEventListener("input", event => {
    const pharmaAddInput = event.target?.closest?.("[data-pharma-compare-add-input]");
    const acuAddInput = event.target?.closest?.("[data-acu-compare-add-input]");
    if(pharmaAddInput || acuAddInput){
      updateCompareAddDatalist(pharmaAddInput || acuAddInput);
      return;
    }
    const acuEditable = event.target?.closest?.("[data-acu-compare-edit]");
    if(acuEditable && !isPharma()){
      saveAcuEditable(acuEditable);
      if(acuEditable.dataset.acuLinkAssist === "1") updateAssociationSuggestions(acuEditable);
      return;
    }
    const editable = event.target?.closest?.("[data-pharma-compare-edit]");
    if(!editable || !isPharma()) return;
    savePharmaEditable(editable);
    if(editable.dataset.pharmaLinkAssist === "1") updateAssociationSuggestions(editable);
  });

  document.addEventListener("focusin", event => {
    const editable = event.target?.closest?.("[data-pharma-link-assist='1'], [data-acu-link-assist='1']");
    if(editable){
      plainifyLinkAssistEditable(editable, true);
      updateAssociationSuggestions(editable);
    }
  });

  document.addEventListener("mousedown", event => {
    const editable = event.target?.closest?.("[data-pharma-link-assist='1'], [data-acu-link-assist='1']");
    if(!editable) return;
    if(event.target?.closest?.("[data-pharma-ref-id], [data-acu-ref-id], .pharma-association-suggest-box")) return;
    plainifyLinkAssistEditable(editable, false);
  }, true);

  document.addEventListener("focusout", event => {
    const acuEditable = event.target?.closest?.("[data-acu-compare-edit]");
    if(acuEditable && !isPharma()){
      saveAcuEditable(acuEditable);
      setTimeout(() => {
        if(!document.activeElement?.closest?.(".pharma-association-suggest-box")) hideAssociationSuggestions();
        if(["associations", "vs"].includes(acuEditable.dataset.acuCompareEdit || "") && typeof window.renderComparisonPanelIfOpen === "function"){
          window.renderComparisonPanelIfOpen();
        }
      }, 120);
      return;
    }
    const editable = event.target?.closest?.("[data-pharma-compare-edit]");
    if(!editable || !isPharma()) return;
    savePharmaEditable(editable);
    setTimeout(() => {
      if(!document.activeElement?.closest?.(".pharma-association-suggest-box")) hideAssociationSuggestions();
      if(["associations", "vs", "formules"].includes(editable.dataset.pharmaCompareEdit || "") && typeof window.renderComparisonPanelIfOpen === "function"){
        window.renderComparisonPanelIfOpen();
      }
    }, 120);
  });

  document.addEventListener("mousedown", event => {
    const herbSuggestion = event.target?.closest?.("[data-suggestion-herb-id]");
    const pointSuggestion = event.target?.closest?.("[data-suggestion-point-id]");
    if(!herbSuggestion && !pointSuggestion) return;
    event.preventDefault();
    const box = (herbSuggestion || pointSuggestion).closest(".pharma-association-suggest-box");
    const targetKind = box?.dataset.targetKind || "pharma";
    const targetId = box?.dataset.targetId || "";
    const targetField = box?.dataset.targetField || "";
    if(targetKind === "acu"){
      const pointId = pointSuggestion?.dataset.suggestionPointId || "";
      const editable = Array.from(document.querySelectorAll("[data-acu-link-assist='1']"))
        .find(item => String(item.dataset.acuPointId || "") === String(targetId) && String(item.dataset.acuCompareEdit || "") === String(targetField));
      insertPointSuggestion(editable, pointId);
    }else{
      const herbId = herbSuggestion?.dataset.suggestionHerbId || "";
      const editable = Array.from(document.querySelectorAll("[data-pharma-link-assist='1']"))
        .find(item => String(item.dataset.pharmaHerbId || "") === String(targetId) && String(item.dataset.pharmaCompareEdit || "") === String(targetField));
      insertAssociationSuggestion(editable, getHerb(herbId));
    }
  }, true);

  document.addEventListener("click", event => {
    const pharmaRef = event.target?.closest?.("[data-pharma-ref-id]");
    const acuRef = event.target?.closest?.("[data-acu-ref-id]");
    if(!pharmaRef && !acuRef) return;
    event.preventDefault();
    event.stopPropagation();
    if(pharmaRef && typeof window.openPharmaHerbPanel === "function") window.openPharmaHerbPanel(pharmaRef.dataset.pharmaRefId || "");
    if(acuRef){
      const point = acuRef.dataset.acuRefId || "";
      if(typeof window.openPointPanelDirect === "function") window.openPointPanelDirect(point);
      else if(typeof window.openPointPanel === "function") window.openPointPanel(point);
    }
  });

  const previousStartTour = window.startTour;
  if(typeof previousStartTour === "function"){
    window.startTour = function(){
      const result = previousStartTour.apply(this, arguments);
      try{
        if(typeof tourSteps !== "undefined" && Array.isArray(tourSteps)){
          const step = tourSteps.find(item => item && item.selector === "#comparisonButton");
          if(step && !String(step.text || "").includes("nom de colonne")){
            step.text += " Dans le panneau, clique sur le nom de colonne pour ouvrir la fiche. Utilise la petite corbeille 🗑 pour retirer un élément de la comparaison ; tu peux aussi glisser les noms de colonne pour réordonner. Les lignes de fonctions montrent par X à quelles substances ou points chaque fonction s’applique. Associations et VS. proposent les substances en PHARMA ou les points en ACU pendant la saisie, avec +, = ou vs comme séparateurs. La colonne de droite permet d’ajouter une substance ou un point en tapant son nom.";
          }
          const sheet = tourSteps.find(item => item && item.selector === "#cheatsheetButton");
          if(sheet && !String(sheet.text || "").includes("colonne réservée")){
            sheet.text += " Sur téléphone, le bouton + reste dans une colonne réservée pour éviter que les noms longs bloquent l’ajout au panier.";
          }
        }
      }catch(error){}
      return result;
    };
  }
})();
