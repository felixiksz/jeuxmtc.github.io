/* === 34-targeted-requests.js
   Correctifs ciblés demandés : historique, tuto, audio fiches,
   recherche ACU points de transport + ordre naturel, drag lignes comparaison.
   Stats ACU : restaurées comme avant ce patch. === */
(function(){
  "use strict";

  const TRANSPORT_KEY = "__POINTS_TRANSPORT__";
  const TRANSPORT_KEYS = [
    "JING_PUITS", "YING_JAILLISSEMENT", "SHU_RIVIERE", "JING_FLEUVE", "HE_REUNION",
    "Points_Jing_Puits", "Points_Ying_Jaillissement", "Points_Shu_Riviere", "Points_Jing_Fleuve", "Points_He_Reunion"
  ];
  const TRANSPORT_CANONICAL_KEYS = new Set(["Points_Jing_Puits", "Points_Ying_Jaillissement", "Points_Shu_Riviere", "Points_Jing_Fleuve", "Points_He_Reunion"]);
  const CANAL_ORDER = ["P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F", "RM", "DM"];
  const ROW_ORDER_ACU_KEY = "mtc_compare_row_order_acu_v1";
  const ROW_ORDER_PHARMA_KEY = "mtc_compare_row_order_pharma_v4";
  const PHARMA_HANZI_PREFIX = "mtc_pharma_herb_hanzi_";

  const previous = {
    allSearchPoints: window.allSearchPoints,
    categoryOptionsHtml: window.categoryOptionsHtml,
    categoryDisplayNameFromSearchKey: window.categoryDisplayNameFromSearchKey,
    pointCategoryKeys: window.pointCategoryKeys,
    pointCategoryNames: window.pointCategoryNames,
    pointMatchesCategory: window.pointMatchesCategory,
    renderStatsPanel: window.renderStatsPanel,
    renderStatsPanelIfOpen: window.renderStatsPanelIfOpen,
    startTour: window.startTour,
    exportPersonalNotes: window.exportPersonalNotes,
    importPersonalNotesFromFile: window.importPersonalNotesFromFile,
    openPointPanel: window.openPointPanel,
    openPointPanelDirect: window.openPointPanelDirect,
    openPharmaHerbPanel: window.openPharmaHerbPanel
  };

  let lastPointId = "";
  let lastHerbId = "";

  function byId(id){ return document.getElementById(id); }
  function domain(){ return document.documentElement.getAttribute("data-study-domain") || window.MTC_STUDY_DOMAIN || ""; }
  function isAcu(){ return domain() === "acupuncture"; }
  function isPharma(){ return domain() === "pharmacology"; }
  function esc(value){
    if(typeof window.escapeHtml === "function") return window.escapeHtml(value);
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function attr(value){
    if(typeof window.escapeAttribute === "function") return window.escapeAttribute(value);
    return esc(value).replace(/`/g,"&#096;");
  }
  function normalize(value){
    if(typeof window.normalizeSearchText === "function") return window.normalizeSearchText(value);
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr-FR").trim();
  }
  function readJson(key, fallback){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed == null ? fallback : parsed;
    }catch(error){ return fallback; }
  }
  function storageRowOrderKey(){ return isPharma() ? ROW_ORDER_PHARMA_KEY : ROW_ORDER_ACU_KEY; }
  function cssEscape(value){
    const text = String(value == null ? "" : value);
    if(window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(text);
    return text.replace(/[^a-zA-Z0-9_-]/g, ch => "\\" + ch);
  }

  function setMessageSoon(text){
    setTimeout(() => {
      const message = byId("message") || window.message;
      if(message) message.textContent = text;
    }, 40);
  }

  /* Recherche ACU : option agrégée “Points de transport” + ordre naturel P, GI, E… */
  function flattenPoints(value){
    if(typeof window.flattenPoints === "function") return window.flattenPoints(value);
    if(Array.isArray(value)) return value.flatMap(flattenPoints);
    if(value && typeof value === "object") return Object.values(value).flatMap(flattenPoints);
    return value ? [String(value)] : [];
  }
  function canonicalCategoryKey(key){
    if(typeof window.canonicalAssociationKey === "function") return window.canonicalAssociationKey(key);
    const aliases = {
      JING_PUITS:"Points_Jing_Puits",
      YING_JAILLISSEMENT:"Points_Ying_Jaillissement",
      SHU_RIVIERE:"Points_Shu_Riviere",
      JING_FLEUVE:"Points_Jing_Fleuve",
      HE_REUNION:"Points_He_Reunion"
    };
    return aliases[key] || key;
  }
  function isTransportCategoryKey(key){
    return TRANSPORT_CANONICAL_KEYS.has(canonicalCategoryKey(key));
  }
  let transportCache = null;
  function transportPointSet(){
    if(transportCache) return transportCache;
    const set = new Set();
    const cats = window.RAW_DATA && RAW_DATA.Categories_de_points ? RAW_DATA.Categories_de_points : {};
    Object.entries(cats).forEach(([key, value]) => {
      if(isTransportCategoryKey(key)) flattenPoints(value).forEach(point => set.add(String(point)));
    });
    // Secours : si une autre couche renvoie déjà les familles de points par catégorie,
    // on agrège aussi ces clés canoniques.
    const points = typeof previous.allSearchPoints === "function" ? previous.allSearchPoints() : [];
    if(Array.isArray(points)){
      points.forEach(point => {
        const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys(point) : [];
        if(Array.isArray(keys) && keys.some(isTransportCategoryKey)) set.add(String(point));
      });
    }
    transportCache = set;
    return set;
  }
  function isTransportPoint(point){
    const text = String(point || "");
    if(transportPointSet().has(text)) return true;
    const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys(text) : [];
    return Array.isArray(keys) && keys.some(isTransportCategoryKey);
  }

  window.categoryDisplayNameFromSearchKey = function(key){
    if(key === TRANSPORT_KEY) return "Points de transport";
    if(typeof previous.categoryDisplayNameFromSearchKey === "function") return previous.categoryDisplayNameFromSearchKey.apply(this, arguments);
    return key || "";
  };

  window.categoryOptionsHtml = function(){
    const base = typeof previous.categoryOptionsHtml === "function" ? String(previous.categoryOptionsHtml.apply(this, arguments) || "") : "";
    if(base.includes(`value=\"${TRANSPORT_KEY}\"`) || base.includes(`value='${TRANSPORT_KEY}'`)) return base;
    const option = `<option value="${attr(TRANSPORT_KEY)}">Points de transport</option>`;
    const options = [option, base].filter(Boolean).join("");
    return options;
  };

  window.pointCategoryKeys = function(point){
    const keys = typeof previous.pointCategoryKeys === "function" ? previous.pointCategoryKeys.apply(this, arguments) : [];
    const out = Array.isArray(keys) ? keys.slice() : [];
    if(isTransportPoint(point) && !out.includes(TRANSPORT_KEY)) out.push(TRANSPORT_KEY);
    return out;
  };

  window.pointCategoryNames = function(point){
    return window.pointCategoryKeys(point).map(key => window.categoryDisplayNameFromSearchKey(key));
  };

  window.pointMatchesCategory = function(point, categoryKey){
    if(!categoryKey) return true;
    if(categoryKey === TRANSPORT_KEY) return isTransportPoint(point);
    if(typeof previous.pointMatchesCategory === "function") return previous.pointMatchesCategory.apply(this, arguments);
    return window.pointCategoryKeys(point).includes(categoryKey);
  };

  function parsePointCode(point){
    const raw = String(point || "").replace(/\s+/g, "").trim();
    const match = raw.match(/^([A-Za-zÀ-ÿ]+)(\d+)(.*)$/);
    let canal = "";
    let number = 9999;
    if(match){
      canal = match[1];
      number = Number(match[2]) || 9999;
    }else if(typeof window.canalOfPoint === "function"){
      canal = window.canalOfPoint(raw) || "";
    }
    const upper = canal.toUpperCase();
    const canonical = {P:"P", GI:"GI", E:"E", RT:"Rt", RP:"Rt", C:"C", IG:"IG", V:"V", RN:"Rn", R:"Rn", EC:"EC", MC:"EC", TF:"TF", TR:"TF", VB:"VB", F:"F", RM:"RM", REN:"RM", VC:"RM", DM:"DM", DU:"DM", VG:"DM"}[upper] || canal;
    const order = CANAL_ORDER.indexOf(canonical);
    return {canal:canonical, order:order >= 0 ? order : 999, number, raw};
  }
  function comparePointNatural(a,b){
    const pa = parsePointCode(a);
    const pb = parsePointCode(b);
    if(pa.order !== pb.order) return pa.order - pb.order;
    if(pa.number !== pb.number) return pa.number - pb.number;
    return normalize(pa.raw).localeCompare(normalize(pb.raw), "fr");
  }
  window.allSearchPoints = function(){
    let points = [];
    if(typeof previous.allSearchPoints === "function"){
      try{ points = previous.allSearchPoints.apply(this, arguments) || []; }catch(error){ points = []; }
    }
    if(!Array.isArray(points) || !points.length){
      const set = new Set();
      if(window.POINT_DETAILS) Object.keys(window.POINT_DETAILS).forEach(point => set.add(point));
      try{
        if(!window.pool || !pool.length) pool = buildPool();
        pool.forEach(cat => (cat.points || []).forEach(point => set.add(point)));
      }catch(error){}
      points = Array.from(set);
    }
    return Array.from(new Set(points.map(String))).sort(comparePointNatural);
  };

  /* Stats ACU : restaurées dans leur rendu antérieur. Ce patch ne remplace plus le panneau stats. */

  /* Historique import : fermeture claire + message d’aide. */
  function enhanceHistoryBox(){
    const box = byId("mtcPersonalDataStatus");
    if(!box) return;
    const toggle = box.querySelector("[data-import-history-toggle]");
    if(toggle){
      toggle.title = "Afficher / masquer l’historique des imports locaux";
      toggle.setAttribute("aria-label", "Afficher ou masquer l’historique des imports locaux");
    }
    const pop = box.querySelector(".mtc-status-history-popover");
    if(!pop) return;
    if(!pop.querySelector(".mtc-import-history-help")){
      const help = document.createElement("span");
      help.className = "mtc-import-history-help";
      help.textContent = "pastilles = restaurer une sauvegarde locale avant import ; notes/images seulement";
      pop.insertBefore(help, pop.firstChild || null);
    }
    if(!pop.querySelector("[data-import-history-close]")){
      const close = document.createElement("button");
      close.type = "button";
      close.className = "mtc-import-history-close";
      close.setAttribute("data-import-history-close", "1");
      close.textContent = "fermer";
      close.title = "Refermer l’historique";
      pop.appendChild(close);
    }
    maybeShowHistoryHint();
  }
  function maybeShowHistoryHint(){
    const key = "mtc_progress_hint_import_history_v2";
    const target = document.querySelector("[data-import-history-toggle]");
    if(!target || localStorage.getItem(key) === "1") return;
    localStorage.setItem(key, "1");
    if(typeof window.showProgressHintSoon === "function"){
      window.showProgressHintSoon(
        "import_history_v2",
        "[data-import-history-toggle]",
        "Historique d’import",
        "L’historique garde quelques sauvegardes locales créées avant les imports. Les pastilles permettent de restaurer les notes/images locales si un import écrase quelque chose.",
        {position:"aboveBottom"},
        420
      );
    }
  }
  document.addEventListener("click", event => {
    const close = event.target && event.target.closest && event.target.closest("[data-import-history-close]");
    if(close){
      event.preventDefault();
      event.stopPropagation();
      const box = byId("mtcPersonalDataStatus");
      if(box) box.classList.remove("history-open");
      return;
    }
    const box = byId("mtcPersonalDataStatus");
    if(box && box.classList.contains("history-open") && !event.target.closest("#mtcPersonalDataStatus")){
      box.classList.remove("history-open");
    }
  }, true);
  document.addEventListener("keydown", event => {
    if(event.key !== "Escape") return;
    const box = byId("mtcPersonalDataStatus");
    if(box) box.classList.remove("history-open");
  });

  /* Export/import : libellés courts et explicites “notes/images locales seulement”. */
  if(typeof previous.exportPersonalNotes === "function"){
    window.exportPersonalNotes = function(){
      const result = previous.exportPersonalNotes.apply(this, arguments);
      setMessageSoon("Export créé : notes/images locales seulement. La base du jeu n’est pas exportée.");
      return result;
    };
  }
  if(typeof previous.importPersonalNotesFromFile === "function"){
    window.importPersonalNotesFromFile = function(){
      // Ne pas afficher "import terminé" ici : l'import est asynchrone.
      // Le message final est géré par l'événement mtc-personal-data-imported,
      // sinon la barre de progression passe directement à 100%.
      return previous.importPersonalNotesFromFile.apply(this, arguments);
    };
  }
  document.addEventListener("mtc-personal-data-imported", event => {
    const count = event && event.detail ? Number(event.detail.count || 0) : 0;
    const failures = event && event.detail ? Number(event.detail.failures || 0) : 0;
    setTimeout(() => setMessageSoon(failures
      ? `Import incomplet : stockage plein sur cet appareil, ${failures} élément(s) non enregistré(s)${count ? ` (${count} réussi(s))` : ""}. Libère de l’espace dans ce navigateur puis réessaie.`
      : (count
        ? `Import notes/images locales terminé : ${count} élément(s) modifié(s).`
        : "Import notes/images locales terminé : rien à modifier.")), 120);
  });

  function refreshExportImportLabels(){
    const exportButton = byId("exportNotesButton");
    const importButton = byId("importNotesButton");
    if(exportButton){
      exportButton.title = "Exporter seulement les notes/champs personnels et images locales";
      exportButton.setAttribute("aria-label", "Exporter notes et images locales seulement");
    }
    if(importButton){
      importButton.title = "Importer seulement les notes/champs personnels et images locales";
      importButton.setAttribute("aria-label", "Importer notes et images locales seulement");
    }
  }

  /* Audio : bouton réinjecté dans toutes les fiches, pas seulement les tuiles de la grille. */
  function containsCjk(value){ return /[\u3400-\u9fff]/.test(String(value || "")); }
  function pharmaHanziFromId(id){
    const clean = String(id || "");
    if(!clean) return "";
    try{
      const stored = localStorage.getItem(PHARMA_HANZI_PREFIX + clean);
      if(stored) return stored;
    }catch(error){}
    const herb = (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : []).find(item => item && String(item.id) === clean);
    return herb ? String(herb.hanzi || "") : "";
  }
  function acuHanziFromPoint(point){
    const details = window.POINT_DETAILS && POINT_DETAILS[String(point || "")];
    return details ? String(details.hanzi || "") : "";
  }
  function currentHeaderHanzi(header){
    const explicit = header.querySelector(".point-hanzi-inline");
    const explicitText = explicit ? explicit.textContent : "";
    if(containsCjk(explicitText)) return explicitText.trim();
    if(header.classList.contains("pharma-herb-header")) return pharmaHanziFromId(lastHerbId);
    return acuHanziFromPoint(lastPointId);
  }
  function makeAudioButton(hanzi){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mtc-audio-button mtc-audio-button-34";
    button.textContent = "🔊";
    button.dataset.audioHanzi = hanzi;
    button.title = "Écouter la prononciation";
    button.setAttribute("aria-label", "Écouter la prononciation de " + hanzi);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if(typeof window.playMtcAudioByHanzi === "function") window.playMtcAudioByHanzi(hanzi, button);
    });
    return button;
  }
  let audioEnhanceRunning = false;
  let audioEnhanceTimer = 0;
  function ensureAudioInPanel(){
    if(audioEnhanceRunning) return;
    audioEnhanceRunning = true;
    try{
      const content = byId("pointPanelContent");
      if(!content) return;
      content.querySelectorAll(".point-header").forEach(header => {
        const hanzi = currentHeaderHanzi(header);
        if(!hanzi || !containsCjk(hanzi)) return;

        const own = header.querySelector(".mtc-audio-button-34");
        const foreignButtons = Array.from(header.querySelectorAll(".mtc-audio-button:not(.mtc-audio-button-34)"));

        // Important perf : ne pas supprimer/recréer le bouton s’il est déjà correct.
        // Sinon le MutationObserver de la fiche se relance en boucle et l’ouverture devient très lente.
        if(own && own.dataset.audioHanzi === hanzi){
          foreignButtons.forEach(node => node.remove());
          return;
        }

        if(own) own.remove();
        foreignButtons.forEach(node => node.remove());
        const button = makeAudioButton(hanzi);
        const hanziNode = header.querySelector(".point-hanzi-inline");
        if(hanziNode) hanziNode.insertAdjacentElement("afterend", button);
        else header.appendChild(button);
      });
      // On ne rappelle pas refreshMtcAudioButtons ici : ce correctif doit fonctionner
      // même pour les fiches qui ne viennent pas des tuiles actuellement affichées.
      if(typeof window.__mtcStableEnhancePointPanelHeader === "function") window.__mtcStableEnhancePointPanelHeader();
    }finally{
      audioEnhanceRunning = false;
    }
  }
  function scheduleEnsureAudioInPanel(delay){
    window.clearTimeout(audioEnhanceTimer);
    audioEnhanceTimer = window.setTimeout(ensureAudioInPanel, typeof delay === "number" ? delay : 0);
  }
  function wrapOpeners(){
    if(typeof previous.openPointPanel === "function"){
      window.openPointPanel = function(point){
        lastPointId = String(point || "");
        const result = previous.openPointPanel.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
    if(typeof previous.openPointPanelDirect === "function"){
      window.openPointPanelDirect = function(point){
        lastPointId = String(point || "");
        const result = previous.openPointPanelDirect.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
    if(typeof previous.openPharmaHerbPanel === "function"){
      window.openPharmaHerbPanel = function(herbId){
        lastHerbId = String(herbId || "");
        const result = previous.openPharmaHerbPanel.apply(this, arguments);
        scheduleEnsureAudioInPanel(0);
        scheduleEnsureAudioInPanel(80);
        return result;
      };
    }
  }

  /* Comparaison : drag tactile/souris des lignes, ordre sauvegardé. */
  function matrix(){ return document.querySelector("#comparisonPanelContent .mtc-compare-matrix"); }
  function rowKeys(mat){
    const keys = [];
    if(!mat) return keys;
    mat.querySelectorAll(":scope > .mtc-compare-row-label[data-mtc-compare-row-key]").forEach(label => {
      const key = label.getAttribute("data-mtc-compare-row-key") || "";
      if(key && !keys.includes(key)) keys.push(key);
    });
    return keys;
  }
  function nodesForRow(mat, key){
    if(!mat || !key) return [];
    return Array.from(mat.children).filter(node =>
      node && node.getAttribute && node.getAttribute("data-mtc-compare-row-key") === String(key)
    );
  }
  function rowLabelForKey(mat, key){
    if(!mat || !key) return null;
    return Array.from(mat.querySelectorAll(":scope > .mtc-compare-row-label[data-mtc-compare-row-key]")).find(node =>
      node.getAttribute("data-mtc-compare-row-key") === String(key)
    ) || null;
  }
  function rowKeyFromPoint(x, y){
    const target = document.elementFromPoint(x, y);
    const rowElement = target && target.closest && target.closest("#comparisonPanelContent [data-mtc-compare-row-key]");
    if(!rowElement) return {key:"", label:null, after:false};
    const key = rowElement.getAttribute("data-mtc-compare-row-key") || "";
    const mat = matrix();
    const label = rowLabelForKey(mat, key) || rowElement.closest(".mtc-compare-row-label");
    const rectTarget = label || rowElement;
    const rect = rectTarget.getBoundingClientRect();
    return {key, label, after:y > rect.top + rect.height / 2};
  }
  function applyRowOrder(order){
    const mat = matrix();
    if(!mat || !Array.isArray(order) || !order.length) return;
    const current = rowKeys(mat);
    const finalOrder = order.filter(key => current.includes(key));
    current.forEach(key => { if(!finalOrder.includes(key)) finalOrder.push(key); });
    const fragment = document.createDocumentFragment();
    finalOrder.forEach(key => nodesForRow(mat, key).forEach(node => fragment.appendChild(node)));
    mat.appendChild(fragment);
    try{ localStorage.setItem(storageRowOrderKey(), JSON.stringify(finalOrder)); }catch(error){}
  }
  function moveRow(fromKey, toKey, after){
    const mat = matrix();
    if(!mat || !fromKey || !toKey || fromKey === toKey) return;
    const keys = rowKeys(mat);
    const from = keys.indexOf(fromKey);
    const to = keys.indexOf(toKey);
    if(from < 0 || to < 0) return;
    const moved = keys.splice(from, 1)[0];
    let insert = keys.indexOf(toKey);
    if(insert < 0) insert = keys.length;
    if(after) insert += 1;
    keys.splice(insert, 0, moved);
    applyRowOrder(keys);
  }
  function applySavedRowOrderSoon(){
    setTimeout(() => applyRowOrder(readJson(storageRowOrderKey(), [])), 0);
  }
  function initPointerRowDrag(){
    let drag = null;
    function cleanHover(){
      document.querySelectorAll(".mtc-compare-row-label.is-row-drag-over").forEach(node => node.classList.remove("is-row-drag-over", "is-row-drag-after"));
    }
    document.addEventListener("pointerdown", event => {
      const label = event.target && event.target.closest && event.target.closest("#comparisonPanelContent .mtc-compare-row-label[data-mtc-compare-row-key]");
      if(!label || event.target.closest("button,a,input,textarea,select,[contenteditable='true']")) return;
      drag = {
        pointerId:event.pointerId,
        fromKey:label.getAttribute("data-mtc-compare-row-key") || "",
        startX:event.clientX,
        startY:event.clientY,
        active:false,
        overKey:"",
        after:false,
        label
      };
    }, true);
    document.addEventListener("pointermove", event => {
      if(!drag || drag.pointerId !== event.pointerId) return;
      const dx = Math.abs(event.clientX - drag.startX);
      const dy = Math.abs(event.clientY - drag.startY);
      if(!drag.active && Math.max(dx, dy) < 7) return;
      if(!drag.active){
        drag.active = true;
        drag.label.classList.add("is-row-dragging");
        document.body.classList.add("mtc-compare-touch-dragging");
        try{ drag.label.setPointerCapture(event.pointerId); }catch(error){}
      }
      event.preventDefault();
      cleanHover();
      const over = rowKeyFromPoint(event.clientX, event.clientY);
      if(!over.key || !over.label) return;
      drag.after = over.after;
      drag.overKey = over.key;
      over.label.classList.add("is-row-drag-over");
      over.label.classList.toggle("is-row-drag-after", drag.after);
    }, {capture:true, passive:false});
    function finish(event){
      if(!drag || (event.pointerId != null && drag.pointerId !== event.pointerId)) return;
      const current = drag;
      drag = null;
      cleanHover();
      document.body.classList.remove("mtc-compare-touch-dragging");
      if(current.label) current.label.classList.remove("is-row-dragging");
      if(current.active){
        if(!current.overKey && event.clientX != null && event.clientY != null){
          const over = rowKeyFromPoint(event.clientX, event.clientY);
          current.overKey = over.key;
          current.after = over.after;
        }
        event.preventDefault();
        event.stopPropagation();
        moveRow(current.fromKey, current.overKey, current.after);
      }
    }
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
  }

  /* ACU : restauration d'une secousse visible sur mauvaise sélection. */
  const originalShakeTile34 = window.shakeTile;
  window.shakeTile = function(tile){
    if(typeof originalShakeTile34 === "function"){
      try{ originalShakeTile34.apply(this, arguments); }catch(error){}
    }
    if(!tile || !tile.classList) return;
    tile.classList.remove("mtc-acu-shake-restore");
    void tile.offsetWidth;
    tile.classList.add("mtc-acu-shake-restore");
    setTimeout(() => tile.classList.remove("mtc-acu-shake-restore"), 420);
  };

  /* Visite guidée : textes plus courts + historique + export/import notes/images seulement. */
  function patchTour(){
    const current = window.startTour;
    if(typeof current !== "function" || current.__mtcTargetedTourWrapped) return;
    const wrapped = function(){
      const result = current.apply(this, arguments);
      try{
        if(Array.isArray(window.tourSteps) || (typeof tourSteps !== "undefined" && Array.isArray(tourSteps))){
          const steps = (typeof tourSteps !== "undefined" && Array.isArray(tourSteps)) ? tourSteps : window.tourSteps;
          const comparison = steps.find(step => step && step.selector === "#comparisonButton");
          if(comparison){
            comparison.text = isPharma()
              ? "Compare les SM côte à côte. A|B ajoute ou retire une substance ; dans le panneau, tu peux aussi réordonner les colonnes et les lignes."
              : "Compare les points côte à côte. A|B ajoute ou retire un point ; dans le panneau, tu peux aussi réordonner les colonnes et les lignes.";
          }
          const exportStep = steps.find(step => step && step.selector === "#exportNotesButton");
          if(exportStep) exportStep.text = "Exporte seulement tes notes/champs personnels et tes images locales. La base du jeu n’est pas exportée.";
          const importStep = steps.find(step => step && step.selector === "#importNotesButton");
          if(importStep) importStep.text = "Importe seulement un fichier de notes/images locales. L’historique permet de restaurer une sauvegarde locale avant import.";
          const searchStep = steps.find(step => step && step.selector === "#advancedSearchButton");
          if(searchStep && isAcu()) searchStep.text = "Filtre les points par mot-clé, catégorie, canal ou intersections. La catégorie Points de transport regroupe les cinq shū antiques.";
          if(!steps.some(step => step && step.selector === "[data-import-history-toggle]")){
            const insertAt = Math.max(0, steps.findIndex(step => step && step.selector === "#importNotesButton") + 1);
            steps.splice(insertAt > 0 ? insertAt : steps.length - 1, 0, {
              selector:"[data-import-history-toggle]",
              title:"Historique d’import",
              text:"Après un import, les pastilles restaurent une sauvegarde locale précédente. Cela concerne seulement les notes/images locales.",
              fallback:() => document.querySelector("#importNotesButton") || document.querySelector("#footerTitle"),
              position:"aboveBottom"
            });
          }
        }
      }catch(error){}
      return result;
    };
    wrapped.__mtcTargetedTourWrapped = true;
    window.startTour = wrapped;
  }

  function boot(){
    refreshExportImportLabels();
    enhanceHistoryBox();
    wrapOpeners();
    patchTour();
    initPointerRowDrag();
    applySavedRowOrderSoon();
    scheduleEnsureAudioInPanel(0);

    let historyEnhanceTimer = 0;
    const statusObserver = new MutationObserver(() => {
      window.clearTimeout(historyEnhanceTimer);
      historyEnhanceTimer = window.setTimeout(enhanceHistoryBox, 80);
    });
    if(document.body) statusObserver.observe(document.body, {childList:true, subtree:true});

    const pointContent = byId("pointPanelContent");
    if(pointContent && pointContent.dataset.mtcTargetedAudioObserver !== "1"){
      pointContent.dataset.mtcTargetedAudioObserver = "1";
      new MutationObserver(() => scheduleEnsureAudioInPanel(25)).observe(pointContent, {childList:true});
    }
  }

  document.addEventListener("mtc-personal-data-exported", () => setMessageSoon("Export créé : notes/images locales seulement. La base du jeu n’est pas exportée."));
  window.addEventListener("mtc-study-domain-changed", () => {
    setTimeout(() => {
      refreshExportImportLabels();
      enhanceHistoryBox();
      if(isAcu() && typeof window.renderAdvancedSearchPanelIfOpen === "function") window.renderAdvancedSearchPanelIfOpen();
      if(typeof window.renderStatsPanelIfOpen === "function") window.renderStatsPanelIfOpen();
      applySavedRowOrderSoon();
    }, 120);
  });
  document.addEventListener("comparison-panel-rendered", applySavedRowOrderSoon);
  const comparisonPanel = byId("comparisonPanelContent");
  if(comparisonPanel){
    new MutationObserver(() => applySavedRowOrderSoon()).observe(comparisonPanel, {childList:true, subtree:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
