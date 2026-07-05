/* === Bucket 8 correctifs : mobile ACU/PHARMA, stats ACU %, comparaison ACU, export/import notes+images === */
(function(){
  "use strict";

  const ACU_NOTE_PREFIX = "mtc_point_note_";
  const ACU_ESPRIT_PREFIX = "mtc_point_esprit_";
  const ACU_ASSOC_PREFIX = "mtc_point_associations_";
  const ACU_VS_PREFIX = "mtc_point_vs_";
  const ACU_PRECAUTION_PREFIX = "mtc_point_precaution_";
  const ACU_IMAGE_PREFIX = "mtc_point_image_";
  const PHARMA_HANZI_PREFIX = "mtc_pharma_herb_hanzi_";
  const PHARMA_ESPRIT_PREFIX = "mtc_pharma_herb_esprit_";
  const PHARMA_NOTE_PREFIX = "mtc_pharma_herb_notes_";
  const PHARMA_ASSOC_PREFIX = "mtc_pharma_herb_associations_";
  const PHARMA_FORMULES_PREFIX = "mtc_pharma_herb_formules_";
  const PHARMA_VS_PREFIX = "mtc_pharma_herb_vs_";
  const PHARMA_PRECAUTION_PREFIX = "mtc_pharma_herb_precaution_";
  const PHARMA_SYNONYMES_PREFIX = "mtc_pharma_herb_synonymes_";
  const PHARMA_SYNTHESE_PREFIX = "mtc_pharma_herb_synthese_";
  const PHARMA_INGREDIENTS_PREFIX = "mtc_pharma_herb_ingredients_";
  const PHARMA_RECHERCHES_MODERNES_PREFIX = "mtc_pharma_herb_recherches_modernes_";
  const PHARMA_INDICATIONS_PREFIX = "mtc_pharma_herb_indications_";
  const PHARMA_CONTRE_INDICATIONS_PREFIX = "mtc_pharma_herb_contre_indications_";
  const PHARMA_PREPARATION_PREFIX = "mtc_pharma_herb_preparation_";
  const PHARMA_IMAGE_PREFIX = "mtc_pharma_herb_image_";

  const previous = {
    renderStatsPanel: window.renderStatsPanel,
    renderStatsPanelIfOpen: window.renderStatsPanelIfOpen,
    renderComparisonPanel: window.renderComparisonPanel,
    renderComparisonPanelIfOpen: window.renderComparisonPanelIfOpen,
    exportPersonalNotes: window.exportPersonalNotes,
    importPersonalNotesFromFile: window.importPersonalNotesFromFile,
    startTour: window.startTour
  };

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

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

  function clamp01(value){
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function percent(value){
    return Math.round(clamp01(value) * 100) + "%";
  }

  function formatDuration(ms){
    if(!(Number(ms) > 0)) return "—";
    const totalSeconds = Math.max(1, Math.round(Number(ms) / 1000));
    if(totalSeconds < 60) return totalSeconds + "s";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m${String(seconds).padStart(2,"0")}`;
  }

  function safeLocalStorageEntries(prefix){
    const out = {};
    try{
      for(let index = 0; index < localStorage.length; index++){
        const key = localStorage.key(index);
        if(key && key.startsWith(prefix)){
          out[key.slice(prefix.length)] = localStorage.getItem(key) || "";
        }
      }
    }catch(error){}
    return out;
  }


  const STATUS_IMPORT_KEY = "mtc_personal_data_status_imported_at";
  const STATUS_MODIFIED_KEY = "mtc_personal_data_status_modified_at";
  const STATUS_EXPORTED_KEY = "mtc_personal_data_status_exported_at";
  const STATUS_TOUCHED_KEY = "mtc_personal_data_status_visible";
  const IMPORT_HISTORY_KEY = "mtc_personal_data_import_history_v1";
  const IMPORT_HISTORY_MAX = 8;
  let personalDataImportInProgress = false;
  let lastImportCompatibleCount = 0;

  function personalDataPrefixes(){
    return [
      ACU_NOTE_PREFIX,
      ACU_ESPRIT_PREFIX,
      ACU_ASSOC_PREFIX,
      ACU_VS_PREFIX,
      ACU_PRECAUTION_PREFIX,
      ACU_IMAGE_PREFIX,
      PHARMA_HANZI_PREFIX,
      PHARMA_ESPRIT_PREFIX,
      PHARMA_NOTE_PREFIX,
      PHARMA_ASSOC_PREFIX,
      PHARMA_FORMULES_PREFIX,
      PHARMA_VS_PREFIX,
      PHARMA_PRECAUTION_PREFIX,
      PHARMA_SYNONYMES_PREFIX,
      PHARMA_SYNTHESE_PREFIX,
      PHARMA_INGREDIENTS_PREFIX,
      PHARMA_RECHERCHES_MODERNES_PREFIX,
      PHARMA_INDICATIONS_PREFIX,
      PHARMA_CONTRE_INDICATIONS_PREFIX,
      PHARMA_PREPARATION_PREFIX,
      PHARMA_IMAGE_PREFIX
    ];
  }

  function isPersonalDataStorageKey(key){
    const clean = String(key || "");
    if(!clean || clean.startsWith("mtc_personal_data_status_")) return false;
    return personalDataPrefixes().some(prefix => clean.startsWith(prefix));
  }

  function importHistoryPrefixes(){
    // On garde l’historique léger : les images base64 peuvent saturer localStorage.
    // Elles restent exportées dans les sauvegardes classiques, mais ne sont pas dupliquées dans la timeline.
    return personalDataPrefixes().filter(prefix => prefix !== PHARMA_IMAGE_PREFIX && prefix !== ACU_IMAGE_PREFIX);
  }

  function capturePersonalTextDataSnapshot(){
    const data = {};
    const prefixes = importHistoryPrefixes();
    try{
      for(let index = 0; index < localStorage.length; index++){
        const key = localStorage.key(index);
        if(key && prefixes.some(prefix => key.startsWith(prefix))){
          data[key] = localStorage.getItem(key) || "";
        }
      }
    }catch(error){}
    return data;
  }

  function loadImportHistory(){
    try{
      const raw = localStorage.getItem(IMPORT_HISTORY_KEY) || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(item => item && item.data) : [];
    }catch(error){
      return [];
    }
  }

  function saveImportHistory(history){
    try{
      localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify((history || []).slice(0, IMPORT_HISTORY_MAX)));
    }catch(error){
      console.warn("Historique import trop volumineux : snapshot ignoré.", error);
    }
    renderImportHistoryTimeline();
  }

  function pushImportHistorySnapshot(label){
    const data = capturePersonalTextDataSnapshot();
    const hasData = Object.keys(data).length > 0;
    const entry = {
      id: "snap_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      at: new Date().toISOString(),
      label: label || "avant import",
      data
    };
    const history = loadImportHistory();
    history.unshift(entry);
    saveImportHistory(history);
    return hasData;
  }

  function restoreImportHistorySnapshot(snapshotId){
    const history = loadImportHistory();
    const entry = history.find(item => item && item.id === snapshotId);
    if(!entry || !entry.data) return false;
    const prefixes = importHistoryPrefixes();
    try{
      const toRemove = [];
      for(let index = 0; index < localStorage.length; index++){
        const key = localStorage.key(index);
        if(key && prefixes.some(prefix => key.startsWith(prefix))) toRemove.push(key);
      }
      toRemove.forEach(key => localStorage.removeItem(key));
      Object.entries(entry.data).forEach(([key, value]) => localStorage.setItem(key, String(value ?? "")));
      markPersonalDataStatus("modified");
      if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
      if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
      if(typeof window.refreshCurrentPointPanel === "function") window.refreshCurrentPointPanel();
      if(typeof window.refreshCurrentPharmaHerbPanel === "function") window.refreshCurrentPharmaHerbPanel();
      document.dispatchEvent(new CustomEvent("pharma-herb-edited", {detail:{field:"restore"}}));
      renderImportHistoryTimeline();
      const message = document.getElementById("message");
      if(message) message.textContent = "Version locale restaurée depuis l’historique.";
      return true;
    }catch(error){
      console.error(error);
      const message = document.getElementById("message");
      if(message) message.textContent = "Restauration impossible : stockage local inaccessible.";
      return false;
    }
  }

  function shortTimelineDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "?";
    const pad = n => String(n).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth()+1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function ensureImportHistoryStyle(){
    if(document.getElementById("mtcImportHistoryTimelineStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcImportHistoryTimelineStyle";
    style.textContent = `
      /* Ligne statut à son emplacement fixe discret, mais sous les panneaux.
         Les overlays recherche/comparaison/cheatsheet passent donc au-dessus et la masquent. */
      #mtcPersonalDataStatus,#mtcPersonalDataStatus.visible{
        position:fixed!important;
        left:8px!important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 18px)!important;
        right:auto!important;top:auto!important;inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 18px) 8px!important;
        z-index:18!important;
        display:block!important;
        box-sizing:border-box!important;
        width:auto!important;
        max-width:min(92vw, 680px)!important;
        margin:0!important;
        padding:2px 5px!important;
        font-size:10px!important;
        line-height:1.22!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
        pointer-events:none!important;
        opacity:.64!important;
        transform:none!important;
        background:transparent!important;
        box-shadow:none!important;
        border:0!important;
        color:color-mix(in srgb, var(--text-color, #111) 70%, transparent)!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }
      #mtcPersonalDataStatus .mtc-status-dates{display:inline!important;}
      #mtcPersonalDataStatus .mtc-status-history-link{appearance:none;border:0;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;padding:0;margin-left:.35em;cursor:pointer;text-decoration:underline;text-decoration-thickness:.06em;text-underline-offset:.18em;opacity:.78;pointer-events:auto!important;position:relative!important;z-index:1!important;}
      #mtcPersonalDataStatus .mtc-status-history-link:hover,#mtcPersonalDataStatus .mtc-status-history-link:focus-visible{opacity:1;outline:none;}
      #mtcPersonalDataStatus .mtc-status-history-popover{display:none;margin-top:.28rem;padding-top:.22rem;border-top:1px solid currentColor;opacity:.92;pointer-events:auto!important;}
      #mtcPersonalDataStatus.history-open{z-index:24!important;}
      #mtcPersonalDataStatus.history-open .mtc-status-history-popover{display:flex;align-items:center;gap:.34rem;flex-wrap:wrap;}
      #mtcPersonalDataStatus .mtc-import-history-dot{appearance:none;border:0;background:transparent;color:inherit;width:.86rem;height:.86rem;border-radius:999px;padding:0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;opacity:.66;position:relative;pointer-events:auto!important;}
      #mtcPersonalDataStatus .mtc-import-history-dot::before{content:"";display:block;width:.42rem;height:.42rem;border-radius:999px;background:currentColor;box-shadow:0 0 0 2px rgba(0,0,0,.08);}
      #mtcPersonalDataStatus .mtc-import-history-dot:hover,#mtcPersonalDataStatus .mtc-import-history-dot:focus-visible{opacity:1;outline:none;}
      #mtcPersonalDataStatus .mtc-import-history-clear{appearance:none;border:0;background:transparent;color:inherit;opacity:.55;cursor:pointer;font:inherit;padding:0 .08rem;pointer-events:auto!important;text-decoration:underline;text-underline-offset:.18em;}
      #mtcPersonalDataStatus .mtc-import-history-empty{opacity:.62;}
      @media(max-width:650px){
        #mtcPersonalDataStatus,#mtcPersonalDataStatus.visible{
          left:7px!important;
          bottom:calc(env(safe-area-inset-bottom, 0px) + 42px)!important;
          inset:auto auto calc(env(safe-area-inset-bottom, 0px) + 42px) 7px!important;
          max-width:94vw!important;
          font-size:9.2px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function importHistoryPopoverHtml(){
    const history = loadImportHistory();
    if(!history.length) return `<span class="mtc-import-history-empty">aucun historique</span>`;
    const dots = history.slice().reverse().map(entry => `
      <button
        type="button"
        class="mtc-import-history-dot"
        data-import-history-restore="${attr(entry.id)}"
        title="Restaurer la base locale : ${attr(shortTimelineDate(entry.at))} (${attr(entry.label || "avant import")})"
        aria-label="Restaurer la base locale : ${attr(shortTimelineDate(entry.at))}"
      ></button>
    `).join("");
    return `${dots}<button type="button" class="mtc-import-history-clear" data-import-history-clear="1" title="Vider l’historique des imports">effacer</button>`;
  }

  function renderImportHistoryTimeline(){
    // Historique intégré dans la ligne discrète des dates : pas de pastille flottante en bas.
    ensureImportHistoryStyle();
    const box = document.getElementById("mtcPersonalDataStatus");
    if(box && box.classList.contains("visible")) refreshPersonalDataStatusBox();
  }

  document.addEventListener("click", event => {
    const restore = event.target && event.target.closest && event.target.closest("[data-import-history-restore]");
    if(restore){
      event.preventDefault();
      event.stopPropagation();
      const id = restore.getAttribute("data-import-history-restore") || "";
      const history = loadImportHistory();
      const entry = history.find(item => item && item.id === id);
      const label = entry ? shortTimelineDate(entry.at) : "ce point";
      if(confirm(`Restaurer la base locale à l’état du ${label} ?\n\nLes champs texte locaux actuels seront remplacés par ce snapshot. Les images locales ne sont pas modifiées.`)){
        restoreImportHistorySnapshot(id);
      }
      return;
    }
    const clear = event.target && event.target.closest && event.target.closest("[data-import-history-clear]");
    if(clear){
      event.preventDefault();
      event.stopPropagation();
      if(confirm("Vider l’historique des imports ?")){
        try{ localStorage.removeItem(IMPORT_HISTORY_KEY); }catch(error){}
        renderImportHistoryTimeline();
      }
      return;
    }
    const toggle = event.target && event.target.closest && event.target.closest("[data-import-history-toggle]");
    if(toggle){
      event.preventDefault();
      event.stopPropagation();
      const box = document.getElementById("mtcPersonalDataStatus");
      if(box) box.classList.toggle("history-open");
    }
  }, true);

  function formatStatusDateTime(value){
    if(!value) return "—";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "—";
    const pad = number => String(number).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function ensurePersonalDataStatusBox(){
    let box = document.getElementById("mtcPersonalDataStatus");
    if(!box){
      box = document.createElement("div");
      box.id = "mtcPersonalDataStatus";
      box.setAttribute("aria-live", "polite");
      box.setAttribute("aria-label", "Statut import et modification des notes");
    }
    // La ligne reste attachée au body en position fixed basse.
    // Son z-index bas la place sous les panneaux recherche/comparaison/cheatsheet.
    if(box.parentElement !== document.body || box.nextElementSibling){
      document.body.appendChild(box);
    }
    return box;
  }

  function refreshPersonalDataStatusBox(){
    if(!document.body) return;
    let visible = "";
    let importedAt = "";
    let exportedAt = "";
    let modifiedAt = "";
    try{
      visible = localStorage.getItem(STATUS_TOUCHED_KEY) || "";
      importedAt = localStorage.getItem(STATUS_IMPORT_KEY) || "";
      exportedAt = localStorage.getItem(STATUS_EXPORTED_KEY) || "";
      modifiedAt = localStorage.getItem(STATUS_MODIFIED_KEY) || "";
    }catch(error){}

    const existing = document.getElementById("mtcPersonalDataStatus");
    if(!visible && !importedAt && !exportedAt && !modifiedAt){
      if(existing) existing.classList.remove("visible");
      return;
    }

    const box = ensurePersonalDataStatusBox();
    const wasOpen = box.classList.contains("history-open");
    const history = loadImportHistory();
    box.innerHTML = `
      <span class="mtc-status-dates">export : ${esc(formatStatusDateTime(exportedAt))}, import : ${esc(formatStatusDateTime(importedAt))}, modifié : ${esc(formatStatusDateTime(modifiedAt))}</span>
      <button type="button" class="mtc-status-history-link" data-import-history-toggle="1">historique${history.length ? ` (${history.length})` : ""}</button>
      <span class="mtc-status-history-popover" aria-label="Historique des imports">${importHistoryPopoverHtml()}</span>
    `;
    box.classList.toggle("history-open", wasOpen);
    box.classList.add("visible");
  }

  function markPersonalDataStatus(kind, options){
    const now = new Date().toISOString();
    const opts = options || {};
    try{
      localStorage.setItem(STATUS_TOUCHED_KEY, "1");
      if(kind === "import"){
        localStorage.setItem(STATUS_IMPORT_KEY, now);
        if(opts.markModified !== false) localStorage.setItem(STATUS_MODIFIED_KEY, now);
      }else if(kind === "export"){
        localStorage.setItem(STATUS_EXPORTED_KEY, now);
      }else if(kind === "modified"){
        localStorage.setItem(STATUS_MODIFIED_KEY, now);
      }
    }catch(error){}
    refreshPersonalDataStatusBox();
  }

  function initPersonalDataStatusBox(){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", refreshPersonalDataStatusBox, {once:true});
    }else{
      refreshPersonalDataStatusBox();
    }
  }

  function initPersonalDataModificationWatch(){
    if(window.__mtcPersonalDataModificationWatchReady) return;
    window.__mtcPersonalDataModificationWatchReady = true;

    try{
      const originalSetItem = Storage.prototype.setItem;
      if(originalSetItem && !originalSetItem.__mtcPersonalDataStatusPatched){
        const patched = function(key, value){
          const result = originalSetItem.apply(this, arguments);
          try{
            if(this === window.localStorage && !personalDataImportInProgress && isPersonalDataStorageKey(key)){
              markPersonalDataStatus("modified");
            }
          }catch(error){}
          return result;
        };
        patched.__mtcPersonalDataStatusPatched = true;
        Storage.prototype.setItem = patched;
      }
    }catch(error){}

    document.addEventListener("mtc-personal-data-modified", () => {
      if(!personalDataImportInProgress) markPersonalDataStatus("modified");
    });
    document.addEventListener("mtc-personal-data-imported", () => {
      markPersonalDataStatus("import");
    });
    document.addEventListener("mtc-personal-data-exported", () => {
      markPersonalDataStatus("export");
    });
  }

  initPersonalDataStatusBox();
  initPersonalDataModificationWatch();
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderImportHistoryTimeline, {once:true});
  else renderImportHistoryTimeline();

  function yieldToImportUi(){
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  function ensureImportExportProgressBox(){
    let box = document.getElementById("mtcImportExportProgress");
    if(!box){
      box = document.createElement("div");
      box.id = "mtcImportExportProgress";
      box.setAttribute("aria-live", "polite");
      box.innerHTML = '<span class="mtc-import-export-progress-label"></span><span class="mtc-import-export-progress-bar"><span></span></span>';
      document.body.appendChild(box);
    }
    return box;
  }

  function setImportExportProgress(label, percent){
    const box = ensureImportExportProgressBox();
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const text = String(label || "TRAITEMENT").toUpperCase();
    box.classList.add("visible");
    const labelEl = box.querySelector(".mtc-import-export-progress-label");
    const bar = box.querySelector(".mtc-import-export-progress-bar > span");
    if(labelEl) labelEl.textContent = `${text} ${Math.round(p).toString().padStart(3, "0")}%`;
    if(bar) bar.style.width = `${p}%`;
  }

  function hideImportExportProgress(delay){
    const box = document.getElementById("mtcImportExportProgress");
    if(!box) return;
    setTimeout(() => box.classList.remove("visible"), delay == null ? 450 : delay);
  }

  async function applyImportChunk(label, progress, fn){
    setImportExportProgress(label, progress);
    await yieldToImportUi();
    return fn();
  }

  function normalizeImportKey(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/[’']/g,"'")
      .replace(/[\s._-]+/g, " ")
      .trim();
  }

  function compactImportKey(value){
    return normalizeImportKey(value).replace(/\s+/g, "");
  }

  function pointCodeWithSpaceForImport(point){
    return String(point || "").replace(/^([A-Za-z]+)(\d.*)$/,"$1 $2");
  }

  function pointListForImport(){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS) return Object.keys(POINT_DETAILS);
    }catch(error){}
    return Object.keys(window.POINT_DETAILS || {});
  }

  function detailsForImportPoint(point){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point]) return POINT_DETAILS[point];
    }catch(error){}
    return (window.POINT_DETAILS && window.POINT_DETAILS[point]) || {};
  }

  function pointMatchesImportLabel(point, label){
    const details = detailsForImportPoint(point);
    const key = normalizeImportKey(label);
    const compact = compactImportKey(label);
    const aliases = [
      point,
      pointCodeWithSpaceForImport(point),
      details.pinyin,
      details.hanzi,
      details.nom_francais,
      details.nom_complet
    ].map(normalizeImportKey).filter(Boolean);
    const compactAliases = aliases.map(item => item.replace(/\s+/g, ""));
    return aliases.includes(key) || compactAliases.includes(compact);
  }

  function findImportPoint(label){
    const clean = String(label || "").trim();
    if(!clean) return "";
    return pointListForImport().find(point => pointMatchesImportLabel(point, clean)) || "";
  }

  function pharmaHerbsForImport(){
    return Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
  }

  function herbMatchesImportLabel(herb, label){
    const key = normalizeImportKey(label);
    const compact = compactImportKey(label);
    const aliases = [
      herb && herb.id,
      herb && herb.code,
      herb && herb.pinyin,
      herb && herb.pinyinSansTons,
      herb && herb.hanzi,
      herb && herb.nom
    ].map(normalizeImportKey).filter(Boolean);
    const compactAliases = aliases.map(item => item.replace(/\s+/g, ""));
    return aliases.includes(key) || compactAliases.includes(compact);
  }

  function findImportHerb(label){
    const clean = String(label || "").trim();
    if(!clean) return null;
    const direct = pharmaHerbsForImport().find(herb => herbMatchesImportLabel(herb, clean));
    if(direct) return direct;

    // Tolérance utile pour les imports issus de tableaux :
    // 芥子 doit pouvoir retrouver 白芥子, etc.
    if(/[\u3400-\u9fff]/.test(clean)){
      return pharmaHerbsForImport().find(herb => {
        const hz = String((herb && herb.hanzi) || "").trim();
        return hz && (hz === clean || hz.endsWith(clean) || clean.endsWith(hz));
      }) || null;
    }
    return null;
  }

  function normalizeMergeText(value){
    return String(value ?? "")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim();
  }

  function normalizeMergeKey(value){
    return normalizeMergeText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPlaceholderLocalValue(field, id, existing){
    const clean = normalizeMergeText(existing);
    if(!clean) return true;
    const key = normalizeMergeKey(clean).replace(/\s+/g, "");
    const herb = findImportHerb(id);
    const aliases = [
      id,
      herb && herb.id,
      herb && herb.code,
      herb && herb.pinyin,
      herb && herb.pinyinSansTons,
      herb && herb.hanzi,
      herb && herb.nom
    ].filter(Boolean).map(value => normalizeMergeKey(value).replace(/\s+/g, ""));
    if(field === "associations") return aliases.some(alias => key === alias + "+" || key === alias);
    if(field === "vs") return aliases.some(alias => key === alias + "vs" || key === alias);
    return false;
  }


  function valueHasImportContent(value){
    if(Array.isArray(value)) return value.some(valueHasImportContent);
    if(value && typeof value === "object") return Object.values(value).some(valueHasImportContent);
    return normalizeMergeText(value).length > 0;
  }

  function hasKnownImportTarget(rawId){
    const id = String(rawId || "").trim();
    if(!id) return false;
    return Boolean(findImportHerb(id) || findImportPoint(id) || /^[A-Z]{1,4}\d+[A-Z]?$/i.test(id));
  }

  function mergeLocalValue(prefix, id, incoming, field, options){
    const next = normalizeMergeText(incoming);
    if(!next) return false;
    const storageKey = prefix + id;
    const shouldReplace = Boolean(options && options.replace);
    let existing = "";
    try{ existing = localStorage.getItem(storageKey) || ""; }catch(error){}
    const current = normalizeMergeText(existing);
    let merged = next;
    if(shouldReplace){
      try{
        if(current === next) return false;
        localStorage.setItem(storageKey, next);
        return true;
      }catch(error){
        return false;
      }
    }
    if(current && !isPlaceholderLocalValue(field, id, current)){
      const currentKey = normalizeMergeKey(current);
      const nextKey = normalizeMergeKey(next);
      if(currentKey === nextKey || currentKey.includes(nextKey)) return false;
      if(nextKey.includes(currentKey)) merged = next;
      else merged = `${current}\n\n${next}`;
    }
    try{
      localStorage.setItem(storageKey, merged);
      return true;
    }catch(error){
      return false;
    }
  }

  function setPrefixedValues(prefix, values, field, options){
    if(!values || typeof values !== "object") return 0;
    let count = 0;
    Object.entries(values).forEach(([rawId, value]) => {
      // Solution robuste : dans les imports, on accepte l’ID interne (PT4),
      // le pinyin (Gui Zhi / Guì zhī), le hanzi (桂枝) ou le nom affiché.
      // Le stockage local, lui, reste toujours indexé par ID interne stable.
      let id = String(rawId || "").trim();
      const herb = findImportHerb(id);
      const point = findImportPoint(id);
      if(herb && herb.id) id = herb.id;
      else if(point) id = point;
      if(valueHasImportContent(value) && (herb || point || hasKnownImportTarget(rawId))) lastImportCompatibleCount++;
      if(mergeLocalValue(prefix, id, value, field || "", options || {})) count++;
    });
    return count;
  }

  function routeLegacyNotes(values){
    if(!values || typeof values !== "object") return 0;
    let count = 0;
    Object.entries(values).forEach(([label, value]) => {
      const herb = findImportHerb(label);
      const point = findImportPoint(label);
      try{
        if(herb && !point){
          localStorage.setItem(PHARMA_NOTE_PREFIX + herb.id, String(value ?? ""));
          count++;
          return;
        }
        if(point){
          localStorage.setItem(ACU_NOTE_PREFIX + point, String(value ?? ""));
          count++;
          return;
        }
        // Ancien export très libre : si l’entrée ne ressemble pas à un point,
        // on tente d’abord la pharmacopée, sinon on garde la note ACU telle quelle.
        if(herb){
          localStorage.setItem(PHARMA_NOTE_PREFIX + herb.id, String(value ?? ""));
        }else{
          localStorage.setItem(ACU_NOTE_PREFIX + label, String(value ?? ""));
        }
        count++;
      }catch(error){}
    });
    return count;
  }

  function exportTimestampForFilename(date){
    const pad = value => String(value).padStart(2, "0");
    const d = date || new Date();
    return [
      d.getFullYear(),
      pad(d.getMonth() + 1),
      pad(d.getDate())
    ].join("-") + "_" + [
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds())
    ].join("h");
  }

  function addTimestampToFilename(filename, date){
    const timestamp = exportTimestampForFilename(date);
    const dotIndex = filename.lastIndexOf(".");
    if(dotIndex > 0){
      return filename.slice(0, dotIndex) + "_" + timestamp + filename.slice(dotIndex);
    }
    return filename + "_" + timestamp;
  }

  function downloadJson(payload, filename){
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = addTimestampToFilename(filename || "connections-mtc-export.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 600);
  }

  window.exportPersonalNotes = function(){
    (async () => {
      setImportExportProgress("EXPORT", 4);
      await yieldToImportUi();
      const acuNotes = safeLocalStorageEntries(ACU_NOTE_PREFIX);
      setImportExportProgress("EXPORT", 35);
      await yieldToImportUi();
      const payload = {
      app:"Connections MTC",
      type:"personal-data",
      version:5,
      exportedAt:new Date().toISOString(),
      // Compatibilité avec les anciens imports : les notes ACU restent aussi au niveau racine.
      notes:acuNotes,
      acupuncture:{
        notes:acuNotes,
        esprits:safeLocalStorageEntries(ACU_ESPRIT_PREFIX),
        associations:safeLocalStorageEntries(ACU_ASSOC_PREFIX),
        vs:safeLocalStorageEntries(ACU_VS_PREFIX),
        precautions:safeLocalStorageEntries(ACU_PRECAUTION_PREFIX),
        images:safeLocalStorageEntries(ACU_IMAGE_PREFIX)
      },
      pharmacology:{
        hanzi:safeLocalStorageEntries(PHARMA_HANZI_PREFIX),
        esprits:safeLocalStorageEntries(PHARMA_ESPRIT_PREFIX),
        notes:safeLocalStorageEntries(PHARMA_NOTE_PREFIX),
        associations:safeLocalStorageEntries(PHARMA_ASSOC_PREFIX),
        formules:safeLocalStorageEntries(PHARMA_FORMULES_PREFIX),
        vs:safeLocalStorageEntries(PHARMA_VS_PREFIX),
        precautions:safeLocalStorageEntries(PHARMA_PRECAUTION_PREFIX),
        synonymes:safeLocalStorageEntries(PHARMA_SYNONYMES_PREFIX),
        syntheses:safeLocalStorageEntries(PHARMA_SYNTHESE_PREFIX),
        ingredients:safeLocalStorageEntries(PHARMA_INGREDIENTS_PREFIX),
        recherches_modernes:safeLocalStorageEntries(PHARMA_RECHERCHES_MODERNES_PREFIX),
        indications:safeLocalStorageEntries(PHARMA_INDICATIONS_PREFIX),
        contre_indications:safeLocalStorageEntries(PHARMA_CONTRE_INDICATIONS_PREFIX),
        preparations:safeLocalStorageEntries(PHARMA_PREPARATION_PREFIX),
        images:safeLocalStorageEntries(PHARMA_IMAGE_PREFIX)
      }
    };

      setImportExportProgress("EXPORT", 78);
      await yieldToImportUi();
      downloadJson(payload, "connections-mtc-notes-images.json");
      setImportExportProgress("EXPORT", 100);
      markPersonalDataStatus("export");
      document.dispatchEvent(new CustomEvent("mtc-personal-data-exported", {detail:{exportedAt:payload.exportedAt}}));

      const message = document.getElementById("message");
      if(message){
        message.textContent = "Export créé : notes, esprits, associations, VS, formules, précautions et images locales.";
      }
      hideImportExportProgress();
    })().catch(error => {
      console.error(error);
      hideImportExportProgress();
      const message = document.getElementById("message");
      if(message) message.textContent = "Export impossible.";
    });
  };


  function normalizeImportFieldName(value){
    const raw = String(value || "").trim().toLocaleLowerCase("fr-FR");
    const clean = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
    const aliases = {
      hanzis:"hanzi",
      caracteres:"hanzi",
      caracteres_chinois:"hanzi",
      ingredients:"ingredients",
      ingredient:"ingredients",
      recherches_modernes:"recherches_modernes",
      recherche_moderne:"recherches_modernes",
      modern_research:"recherches_modernes",
      indications:"indications",
      contre_indications:"contre_indications",
      contraindications:"contre_indications",
      contre_indication:"contre_indications",
      preparation:"preparation",
      preparations:"preparation",
      synthese:"synthese",
      syntheses:"synthese",
      precautions:"precautions",
      precaution:"precautions"
    };
    return aliases[clean] || clean;
  }

  function importReplaceFieldSet(parsed, pharma){
    const officialReplace = new Set(["hanzi", "ingredients", "recherches_modernes", "indications", "precautions", "contre_indications", "preparation", "synthese"]);
    const values = [];
    function addList(list){
      if(Array.isArray(list)) list.forEach(item => values.push(String(item || "")));
    }
    addList(parsed && (parsed.replaceFields || parsed._replaceFields || parsed.importReplaceFields));
    addList(pharma && (pharma.replaceFields || pharma._replaceFields || pharma.importReplaceFields));
    const mode = String((parsed && (parsed.importMode || parsed.mode || parsed._importMode)) || "").toLocaleLowerCase("fr-FR");
    const replaceAllOfficial = mode.includes("replace-official-pharma-xlsx-fields") || values.some(value => normalizeImportFieldName(value) === "official_xlsx" || normalizeImportFieldName(value) === "official_pharma_xlsx");
    const out = new Set();
    if(replaceAllOfficial) officialReplace.forEach(field => out.add(field));
    values.forEach(value => {
      const clean = normalizeImportFieldName(value);
      if(clean) out.add(clean);
    });
    return out;
  }

  function importFieldOptions(replaceSet, field){
    const clean = normalizeImportFieldName(field);
    return {replace: replaceSet && replaceSet.has(clean)};
  }

  window.importPersonalNotesFromFile = function(input){
    const file = input && input.files && input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const message = document.getElementById("message");
      try{
        personalDataImportInProgress = true;
        lastImportCompatibleCount = 0;
        setImportExportProgress("IMPORT", 4);
        await yieldToImportUi();
        const parsed = JSON.parse(String(reader.result || "{}"));
        setImportExportProgress("IMPORT", 14);
        await yieldToImportUi();
        let count = 0;
        pushImportHistorySnapshot("avant import");
        setImportExportProgress("IMPORT", 22);
        await yieldToImportUi();

        // Ancien format : {type:"personal-notes", notes:{...}}.
        // Les clés sont maintenant routées : point ACU => note ACU, substance PHARMA => note PHARMA.
        if(parsed.type === "personal-notes" || parsed.notes){
          count += await applyImportChunk("IMPORT", 28, () => routeLegacyNotes(parsed.notes || parsed));
        }else if(parsed && !parsed.acupuncture && !parsed.pharmacology && typeof parsed === "object"){
          count += await applyImportChunk("IMPORT", 28, () => routeLegacyNotes(parsed));
        }

        // Compatibilité avec différents noms possibles venant d’anciens exports.
        if(parsed.acupuncture){
          count += await applyImportChunk("IMPORT", 32, () => setPrefixedValues(ACU_NOTE_PREFIX, parsed.acupuncture.notes || parsed.acupuncture.note, "notes"));
          count += await applyImportChunk("IMPORT", 35, () => setPrefixedValues(ACU_ESPRIT_PREFIX, parsed.acupuncture.esprits || parsed.acupuncture.esprit, "esprit"));
          count += await applyImportChunk("IMPORT", 38, () => setPrefixedValues(ACU_ASSOC_PREFIX, parsed.acupuncture.associations || parsed.acupuncture.association, "associations"));
          count += await applyImportChunk("IMPORT", 41, () => setPrefixedValues(ACU_VS_PREFIX, parsed.acupuncture.vs || parsed.acupuncture.comparaisons || parsed.acupuncture.comparison, "vs"));
          count += await applyImportChunk("IMPORT", 44, () => setPrefixedValues(ACU_PRECAUTION_PREFIX, parsed.acupuncture.precautions || parsed.acupuncture.precaution, "precautions"));
          count += await applyImportChunk("IMPORT", 46, () => setPrefixedValues(ACU_IMAGE_PREFIX, parsed.acupuncture.images || parsed.acupuncture.image, "images"));
        }

        const looksLikeDirectPharmaImport = parsed && typeof parsed === "object" && (
          parsed.hanzi || parsed.hanzis || parsed.ingredients || parsed.recherches_modernes || parsed.indications ||
          parsed.associations || parsed.formules || parsed.precautions || parsed.contre_indications || parsed.preparations || parsed.syntheses || parsed.vs
        );
        if(parsed.pharmacology || parsed.pharma || parsed.herbs || looksLikeDirectPharmaImport){
          const pharma = parsed.pharmacology || parsed.pharma || parsed.herbs || parsed || {};
          const replaceSet = importReplaceFieldSet(parsed, pharma);
          count += await applyImportChunk("IMPORT", 48, () => setPrefixedValues(PHARMA_HANZI_PREFIX, pharma.hanzi || pharma.hanzis || pharma.caracteres || pharma.caractères, "hanzi", importFieldOptions(replaceSet, "hanzi")));
          count += await applyImportChunk("IMPORT", 51, () => setPrefixedValues(PHARMA_ESPRIT_PREFIX, pharma.esprits || pharma.esprit, "esprit"));
          count += await applyImportChunk("IMPORT", 54, () => setPrefixedValues(PHARMA_NOTE_PREFIX, pharma.notes || pharma.note, "notes"));
          count += await applyImportChunk("IMPORT", 57, () => setPrefixedValues(PHARMA_ASSOC_PREFIX, pharma.associations || pharma.association, "associations"));
          count += await applyImportChunk("IMPORT", 60, () => setPrefixedValues(PHARMA_FORMULES_PREFIX, pharma.formules || pharma.formulas || pharma.formule, "formules"));
          count += await applyImportChunk("IMPORT", 63, () => setPrefixedValues(PHARMA_VS_PREFIX, pharma.vs || pharma.comparaisons || pharma.comparison, "vs"));
          count += await applyImportChunk("IMPORT", 66, () => setPrefixedValues(PHARMA_PRECAUTION_PREFIX, pharma.precautions || pharma.précautions || pharma.precaution || pharma.précaution, "precautions", importFieldOptions(replaceSet, "precautions")));
          count += await applyImportChunk("IMPORT", 69, () => setPrefixedValues(PHARMA_SYNONYMES_PREFIX, pharma.synonymes || pharma.synonyms || pharma.noms_alternatifs, "synonymes"));
          count += await applyImportChunk("IMPORT", 72, () => setPrefixedValues(PHARMA_SYNTHESE_PREFIX, pharma.syntheses || pharma.synthèses || pharma.synthese || pharma.synthèse, "synthese", importFieldOptions(replaceSet, "synthese")));
          count += await applyImportChunk("IMPORT", 75, () => setPrefixedValues(PHARMA_INGREDIENTS_PREFIX, pharma.ingredients || pharma.ingrédients, "ingredients", importFieldOptions(replaceSet, "ingredients")));
          count += await applyImportChunk("IMPORT", 78, () => setPrefixedValues(PHARMA_RECHERCHES_MODERNES_PREFIX, pharma.recherches_modernes || pharma.recherche_moderne || pharma.modern_research, "recherches_modernes", importFieldOptions(replaceSet, "recherches_modernes")));
          count += await applyImportChunk("IMPORT", 81, () => setPrefixedValues(PHARMA_INDICATIONS_PREFIX, pharma.indications || pharma.indications_locales || pharma.indications_complementaires, "indications", importFieldOptions(replaceSet, "indications")));
          count += await applyImportChunk("IMPORT", 84, () => setPrefixedValues(PHARMA_CONTRE_INDICATIONS_PREFIX, pharma.contre_indications || pharma.contraindications || pharma.contre_indications_locales, "contre_indications", importFieldOptions(replaceSet, "contre_indications")));
          count += await applyImportChunk("IMPORT", 87, () => setPrefixedValues(PHARMA_PREPARATION_PREFIX, pharma.preparations || pharma.préparations || pharma.preparation || pharma.préparation, "preparation", importFieldOptions(replaceSet, "preparation")));
          count += await applyImportChunk("IMPORT", 90, () => setPrefixedValues(PHARMA_IMAGE_PREFIX, pharma.images || pharma.image, "images"));
        }

        personalDataImportInProgress = false;
        setImportExportProgress("IMPORT", 96);
        await yieldToImportUi();
        markPersonalDataStatus("import");
        document.dispatchEvent(new CustomEvent("pharma-herb-edited", {detail:{field:"import"}}));
        document.dispatchEvent(new CustomEvent("mtc-personal-data-imported", {detail:{count}}));
        setImportExportProgress("IMPORT", 100);
        const refreshAfterImport = () => {
          if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
          if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
          if(typeof window.refreshCurrentPointPanel === "function") window.refreshCurrentPointPanel();
          if(typeof window.refreshCurrentPharmaHerbPanel === "function") window.refreshCurrentPharmaHerbPanel();
        };
        if(window.requestIdleCallback) requestIdleCallback(refreshAfterImport, {timeout:500});
        else setTimeout(refreshAfterImport, 40);

        if(message){
          if(lastImportCompatibleCount){
            message.textContent = count
              ? `Import terminé : ${lastImportCompatibleCount} champ(s) compatible(s) lu(s), ${count} élément(s) modifié(s).`
              : `Import terminé : ${lastImportCompatibleCount} champ(s) compatible(s) lu(s), base déjà à jour.`;
          }else{
            message.textContent = "Import terminé, mais aucun élément compatible n’a été trouvé.";
          }
        }
      }catch(error){
        personalDataImportInProgress = false;
        console.error(error);
        if(message) message.textContent = "Import impossible : fichier de notes/images invalide.";
      }finally{
        personalDataImportInProgress = false;
        hideImportExportProgress();
        if(input) input.value = "";
      }
    };
    reader.readAsText(file);
  };

  function initMobileDomainSwitchFix(){
    const wrap = document.getElementById("studyDomainSwitch");
    const toggle = document.getElementById("studyDomainToggle");
    if(!wrap || !toggle || wrap.dataset.mobileFixReady === "1") return;
    wrap.dataset.mobileFixReady = "1";

    function isMobileLike(){
      return Boolean(
        (window.matchMedia && window.matchMedia("(max-width:520px)").matches) ||
        (window.matchMedia && window.matchMedia("(pointer:coarse)").matches)
      );
    }

    wrap.addEventListener("click", event => {
      if(!isMobileLike()) return;
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

      const next = !toggle.checked;
      toggle.checked = next;
      if(typeof window.toggleStudyDomainFromControl === "function"){
        window.toggleStudyDomainFromControl(next);
      }
    }, true);
  }

  function acuStatsRows(){
    if(typeof window.loadMtcStats !== "function" || typeof window.getAllStatsRows !== "function") return null;
    const stats = window.loadMtcStats();
    const rows = window.getAllStatsRows(stats);
    return {stats, rows};
  }

  function acuStatsList(rows, formatter, empty="—"){
    if(!rows.length) return `<p class="stats-small">${esc(empty)}</p>`;
    return `<ul class="stats-list acu-stats-percent-list">${rows.map(row => `<li>${formatter(row)}</li>`).join("")}</ul>`;
  }

  function acuStatsRowLine(row){
    const success = row.seen ? row.solved / row.seen : 0;
    return `
      <strong>${esc(row.name)}</strong>
      <span class="stats-meta">
        réussite ${row.solved || 0}/${row.seen || 0} · ${percent(success)} · couverture ${row.totalPoints ? `${row.seenPointsCount}/${row.totalPoints} · ${percent(row.coverage)}` : "—"} · maîtrise ${percent(row.mastery || 0)}
      </span>
    `;
  }

  function renderAcuStatsPanelWithPercentages(){
    const content = document.getElementById("statsPanelContent");
    const data = acuStatsRows();
    if(!content || !data){
      if(typeof previous.renderStatsPanel === "function") return previous.renderStatsPanel.apply(this, arguments);
      return;
    }

    const {stats, rows} = data;
    const played = rows.filter(row => row.seen > 0);
    const finished = Number(stats.gamesFinished || 0);
    const winRate = finished ? Number(stats.wins || 0) / finished : 0;
    const totalSeen = rows.reduce((sum,row) => sum + (row.totalPoints || 0), 0);
    const totalCovered = rows.reduce((sum,row) => sum + (row.seenPointsCount || 0), 0);
    const globalCoverage = totalSeen ? totalCovered / totalSeen : 0;
    const avgMastery = played.length
      ? played.reduce((sum,row) => sum + Number(row.mastery || 0), 0) / played.length
      : 0;
    const avgTimeRows = played.filter(row => Number(row.avgSolveMs) > 0);
    const avgTime = avgTimeRows.length
      ? avgTimeRows.reduce((sum,row) => sum + Number(row.avgSolveMs || 0), 0) / avgTimeRows.length
      : 0;

    const toReview = [...rows]
      .sort((a,b) => (a.mastery || 0) - (b.mastery || 0) || (a.coverage || 0) - (b.coverage || 0))
      .slice(0,8);
    const best = [...played]
      .sort((a,b) => (b.mastery || 0) - (a.mastery || 0) || (b.coverage || 0) - (a.coverage || 0))
      .slice(0,8);
    const coverage = [...rows]
      .sort((a,b) => (a.coverage || 0) - (b.coverage || 0))
      .slice(0,8);
    const slow = [...avgTimeRows]
      .sort((a,b) => Number(b.avgSolveMs || 0) - Number(a.avgSolveMs || 0))
      .slice(0,8);

    const mode = typeof window.getAutoPracticeMode === "function" ? window.getAutoPracticeMode() : "balanced";
    const modeLabel = typeof window.autoPracticeModeLabel === "function" ? window.autoPracticeModeLabel(mode) : "Mixte";

    content.innerHTML = `
      <div class="point-header"><span class="point-code">Stats ACU</span></div>
      <p class="stats-intro">Les statistiques ACU affichent maintenant les mêmes repères que PHARMA : réussite, couverture et maîtrise en pourcentages.</p>

      <div class="pharma-stats-summary acu-stats-summary">
        <div><strong>${Number(stats.gamesStarted || 0)}</strong><span>parties lancées</span></div>
        <div><strong>${finished}</strong><span>parties terminées</span></div>
        <div><strong>${Number(stats.wins || 0)}</strong><span>victoires</span></div>
        <div><strong>${percent(winRate)}</strong><span>réussite</span></div>
        <div><strong>${percent(globalCoverage)}</strong><span>couverture</span></div>
        <div><strong>${percent(avgMastery)}</strong><span>maîtrise moyenne</span></div>
        <div><strong>${formatDuration(avgTime)}</strong><span>temps moyen</span></div>
        <div><strong>${Number(stats.totalMistakes || 0)}</strong><span>erreurs</span></div>
      </div>

      <div class="stats-card">
        <h3>Mode Auto</h3>
        <p class="stats-small">Mode actuel : ${esc(modeLabel)}. Le mode Auto peut s’appuyer sur la couverture et la maîtrise pour doser les prochaines grilles.</p>
      </div>

      <div class="stats-grid">
        <div class="stats-card"><h3>À réviser</h3>${acuStatsList(toReview, acuStatsRowLine, "Rien à proposer.")}</div>
        <div class="stats-card"><h3>Meilleures maîtrises</h3>${acuStatsList(best, acuStatsRowLine, "Pas encore assez de données.")}</div>
        <div class="stats-card"><h3>Couverture faible</h3>${acuStatsList(coverage, acuStatsRowLine, "Aucune catégorie disponible.")}</div>
        <div class="stats-card"><h3>Plus lent</h3>${acuStatsList(slow, row => `
          <strong>${esc(row.name)}</strong>
          <span class="stats-meta">temps moyen ${formatDuration(row.avgSolveMs)} · maîtrise ${percent(row.mastery || 0)} · couverture ${percent(row.coverage || 0)}</span>
        `, "Pas encore de temps mesuré.")}</div>
      </div>
    `;
  }

  function cleanField(value){
    const text = String(value ?? "").trim();
    if(!text || text === "Aucune" || text === "(Aucune)") return "";
    return text;
  }

  function fieldValueHtml(value){
    const clean = cleanField(value);
    return clean ? esc(clean).replace(/\n/g,"<br>") : `<span class="comparison-empty">—</span>`;
  }

  function pointTitle(point){
    return typeof window.searchPointTitle === "function"
      ? window.searchPointTitle(point)
      : (typeof window.formatPointCode === "function" ? window.formatPointCode(point) : String(point || ""));
  }

  function pointMeta(point){
    return typeof window.searchPointMeta === "function" ? window.searchPointMeta(point) : "";
  }

  function comparisonSlots(){
    const raw = typeof window.getComparisonPoints === "function" ? window.getComparisonPoints() : [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return raw.map((point,index) => ({point,index,label:(typeof window.comparisonSlotLabel === "function" ? window.comparisonSlotLabel(index) : letters[index] || String(index + 1))}))
      .filter(slot => !!slot.point);
  }

  function detailsForPoint(point){
    /* Les données de fiche détaillée ACU sont la source unique du comparateur.
       On ignore volontairement les catégories internes du jeu. */
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

  function notesForPoint(point, details){
    if(typeof window.getEditablePointNote === "function") return window.getEditablePointNote(point, details.notes || "");
    return details.notes || "";
  }

  function acuComparisonFieldRows(slots){
    /* Même liste que la fiche détaillée ACU visible :
       - en-tête : Point, Pinyin, Hanzi, Nom en français ;
       - sections : Localisation, Méthodes, Catégories du point,
         Correspondances, Actions, Indications, Associations, Notes.
       On ne met plus le champ interne des catégories utilisées par le jeu. */
    const rows = [
      ["Point", slot => detailsForPoint(slot.point).point || slot.point],
      ["Pinyin", slot => detailsForPoint(slot.point).pinyin],
      ["Hanzi", slot => detailsForPoint(slot.point).hanzi],
      ["Nom en français", slot => detailsForPoint(slot.point).nom_francais || detailsForPoint(slot.point).nom_complet],
      ["Localisation", slot => detailsForPoint(slot.point).localisation],
      ["Méthode de localisation", slot => detailsForPoint(slot.point).methode_localisation],
      ["Méthode de travail", slot => detailsForPoint(slot.point).methode_travail],
      ["Catégories du point", slot => detailsForPoint(slot.point).categories_du_point],
      ["Correspondances", slot => detailsForPoint(slot.point).correspondances],
      ["Actions", slot => detailsForPoint(slot.point).actions],
      ["Indications", slot => detailsForPoint(slot.point).indications],
      ["Associations", slot => detailsForPoint(slot.point).associations],
      ["Notes", slot => notesForPoint(slot.point, detailsForPoint(slot.point))]
    ];

    return rows;
  }

  function renderAcuComparisonPanelMatrix(){
    const content = document.getElementById("comparisonPanelContent");
    if(!content) return;

    const slots = comparisonSlots();
    const count = Math.max(2, slots.length);

    if(!slots.length){
      content.innerHTML = `
        <div class="point-header"><span class="point-code">Comparaison</span></div>
        <p class="stats-small">Aucun point n’est encore placé en comparaison. Ajoute des points depuis le panier.</p>
      `;
      return;
    }

    const headers = slots.map(slot => `
      <div class="acu-comparison-herb-header">
        <div class="search-result-title"><span class="comparison-slot-label">${esc(slot.label)}</span>${pointTitle(slot.point)}</div>
        <div class="search-result-meta">${esc(pointMeta(slot.point))}</div>
        <div class="comparison-actions">
          <button type="button" onclick="openPointPanelDirect('${attr(slot.point)}')">Fiche</button>
          <button type="button" onclick="clearComparisonPoint(${Number(slot.index) || 0})">×</button>
        </div>
      </div>
    `).join("");

    const rows = acuComparisonFieldRows(slots).map(([label, getter]) => `
      <div class="acu-comparison-row-label">${esc(label)}</div>
      ${slots.map(slot => `<div class="acu-comparison-cell">${fieldValueHtml(getter(slot))}</div>`).join("")}
    `).join("");

    content.innerHTML = `
      <div class="point-header"><span class="point-code">Comparaison ACU A–Z</span></div>
      <p class="stats-intro">Les champs de la fiche détaillée sont alignés horizontalement pour comparer plus facilement les points.</p>
      <div class="acu-comparison-matrix" style="--comparison-count:${count}">
        <div class="acu-comparison-corner"></div>
        ${headers}
        ${rows}
      </div>
    `;

    if(typeof window.enhancePointReferencesInPanel === "function"){
      window.enhancePointReferencesInPanel(content);
    }
  }

  window.renderStatsPanel = function(){
    if(isPharma()) return previous.renderStatsPanel ? previous.renderStatsPanel.apply(this, arguments) : undefined;
    return renderAcuStatsPanelWithPercentages();
  };

  window.renderStatsPanelIfOpen = function(){
    const panel = document.getElementById("statsPanel");
    if(panel && panel.classList.contains("open")) return window.renderStatsPanel();
  };

  window.renderComparisonPanel = function(){
    if(isPharma()) return previous.renderComparisonPanel ? previous.renderComparisonPanel.apply(this, arguments) : undefined;
    return renderAcuComparisonPanelMatrix();
  };

  window.renderComparisonPanelIfOpen = function(){
    const panel = document.getElementById("comparisonPanel");
    if(panel && panel.classList.contains("open")) return window.renderComparisonPanel();
  };

  if(typeof previous.startTour === "function"){
    window.startTour = function(){
      const result = previous.startTour.apply(this, arguments);
      try{
        if(Array.isArray(tourSteps) && !tourSteps.some(step => step && step.selector === "#exportNotesButton")){
          const insertAt = Math.max(0, tourSteps.findIndex(step => step && step.selector === "#suggestionMailButton"));
          const steps = [
            {
              selector:"#exportNotesButton",
              title:"Export",
              text:"Ce bouton sauvegarde tes notes personnelles ACU, tes Esprits et notes PHARMA, ainsi que les images locales ajoutées aux fiches ACU/PHARMA. Le fichier reste sur ton appareil.",
              fallback:() => document.querySelector("#footerTitle"),
              position:"aboveBottom"
            },
            {
              selector:"#importNotesButton",
              title:"Import",
              text:"Ce bouton réimporte le fichier d’export : notes/esprits/associations/VS/précautions ACU, Esprits, notes, associations, VS, formules, précautions PHARMA et images locales. C’est utile pour changer de navigateur, d’ordinateur ou restaurer une sauvegarde.",
              fallback:() => document.querySelector("#footerTitle"),
              position:"aboveBottom"
            }
          ];
          tourSteps.splice(insertAt >= 0 ? insertAt : tourSteps.length - 1, 0, ...steps);
        }
      }catch(error){
        // Si le tour guidé change plus tard, on garde le tour original intact.
      }
      return result;
    };
  }

  function ready(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    initMobileDomainSwitchFix();
    const exportButton = document.getElementById("exportNotesButton");
    const importButton = document.getElementById("importNotesButton");
    if(exportButton){
      exportButton.title = "Exporter notes/esprits/associations/VS/précautions ACU, esprits/notes/associations/VS/formules/précautions PHARMA et images locales";
      exportButton.setAttribute("aria-label", "Exporter notes et images locales");
    }
    if(importButton){
      importButton.title = "Importer notes/esprits/associations/VS/précautions ACU, esprits/notes/associations/VS/formules/précautions PHARMA et images locales";
      importButton.setAttribute("aria-label", "Importer notes et images locales");
    }
  });

  window.addEventListener("resize", initMobileDomainSwitchFix);
})();
