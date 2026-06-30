/* === Bucket 8 correctifs : mobile ACU/PHARMA, stats ACU %, comparaison ACU, export/import notes+images === */
(function(){
  "use strict";

  const ACU_NOTE_PREFIX = "mtc_point_note_";
  const ACU_ESPRIT_PREFIX = "mtc_point_esprit_";
  const ACU_ASSOC_PREFIX = "mtc_point_associations_";
  const ACU_VS_PREFIX = "mtc_point_vs_";
  const PHARMA_ESPRIT_PREFIX = "mtc_pharma_herb_esprit_";
  const PHARMA_NOTE_PREFIX = "mtc_pharma_herb_notes_";
  const PHARMA_ASSOC_PREFIX = "mtc_pharma_herb_associations_";
  const PHARMA_FORMULES_PREFIX = "mtc_pharma_herb_formules_";
  const PHARMA_VS_PREFIX = "mtc_pharma_herb_vs_";
  const PHARMA_PRECAUTION_PREFIX = "mtc_pharma_herb_precaution_";
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
    return pharmaHerbsForImport().find(herb => herbMatchesImportLabel(herb, clean)) || null;
  }

  function setPrefixedValues(prefix, values){
    if(!values || typeof values !== "object") return 0;
    let count = 0;
    Object.entries(values).forEach(([id, value]) => {
      try{
        localStorage.setItem(prefix + id, String(value ?? ""));
        count++;
      }catch(error){}
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
    const acuNotes = safeLocalStorageEntries(ACU_NOTE_PREFIX);
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
        vs:safeLocalStorageEntries(ACU_VS_PREFIX)
      },
      pharmacology:{
        esprits:safeLocalStorageEntries(PHARMA_ESPRIT_PREFIX),
        notes:safeLocalStorageEntries(PHARMA_NOTE_PREFIX),
        associations:safeLocalStorageEntries(PHARMA_ASSOC_PREFIX),
        formules:safeLocalStorageEntries(PHARMA_FORMULES_PREFIX),
        vs:safeLocalStorageEntries(PHARMA_VS_PREFIX),
        precautions:safeLocalStorageEntries(PHARMA_PRECAUTION_PREFIX),
        images:safeLocalStorageEntries(PHARMA_IMAGE_PREFIX)
      }
    };

    downloadJson(payload, "connections-mtc-notes-images.json");

    const message = document.getElementById("message");
    if(message){
      message.textContent = "Export créé : notes, esprits, associations, VS, formules, précautions et images locales.";
    }
  };

  window.importPersonalNotesFromFile = function(input){
    const file = input && input.files && input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const message = document.getElementById("message");
      try{
        const parsed = JSON.parse(String(reader.result || "{}"));
        let count = 0;

        // Ancien format : {type:"personal-notes", notes:{...}}.
        // Les clés sont maintenant routées : point ACU => note ACU, substance PHARMA => note PHARMA.
        if(parsed.type === "personal-notes" || parsed.notes){
          count += routeLegacyNotes(parsed.notes || parsed);
        }else if(parsed && !parsed.acupuncture && !parsed.pharmacology && typeof parsed === "object"){
          count += routeLegacyNotes(parsed);
        }

        // Compatibilité avec différents noms possibles venant d’anciens exports.
        if(parsed.acupuncture){
          count += setPrefixedValues(ACU_NOTE_PREFIX, parsed.acupuncture.notes || parsed.acupuncture.note);
          count += setPrefixedValues(ACU_ESPRIT_PREFIX, parsed.acupuncture.esprits || parsed.acupuncture.esprit);
          count += setPrefixedValues(ACU_ASSOC_PREFIX, parsed.acupuncture.associations || parsed.acupuncture.association);
          count += setPrefixedValues(ACU_VS_PREFIX, parsed.acupuncture.vs || parsed.acupuncture.comparaisons || parsed.acupuncture.comparison);
        }

        if(parsed.pharmacology || parsed.pharma || parsed.herbs){
          const pharma = parsed.pharmacology || parsed.pharma || parsed.herbs || {};
          count += setPrefixedValues(PHARMA_ESPRIT_PREFIX, pharma.esprits || pharma.esprit);
          count += setPrefixedValues(PHARMA_NOTE_PREFIX, pharma.notes || pharma.note);
          count += setPrefixedValues(PHARMA_ASSOC_PREFIX, pharma.associations || pharma.association);
          count += setPrefixedValues(PHARMA_FORMULES_PREFIX, pharma.formules || pharma.formulas || pharma.formule);
          count += setPrefixedValues(PHARMA_VS_PREFIX, pharma.vs || pharma.comparaisons || pharma.comparison);
          count += setPrefixedValues(PHARMA_PRECAUTION_PREFIX, pharma.precautions || pharma.precaution);
          count += setPrefixedValues(PHARMA_IMAGE_PREFIX, pharma.images || pharma.image);
        }

        if(typeof window.renderComparisonPanelIfOpen === "function") window.renderComparisonPanelIfOpen();
        if(typeof window.renderReviewBasketPanelIfOpen === "function") window.renderReviewBasketPanelIfOpen();
        if(typeof window.refreshCurrentPointPanel === "function") window.refreshCurrentPointPanel();
        document.dispatchEvent(new CustomEvent("pharma-herb-edited", {detail:{field:"import"}}));
        document.dispatchEvent(new CustomEvent("mtc-personal-data-imported", {detail:{count}}));

        if(message){
          message.textContent = count
            ? `Import terminé : ${count} élément(s) récupéré(s).`
            : "Import terminé, mais aucun élément compatible n’a été trouvé.";
        }
      }catch(error){
        console.error(error);
        if(message) message.textContent = "Import impossible : fichier de notes/images invalide.";
      }finally{
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
              text:"Ce bouton sauvegarde tes notes personnelles ACU, tes Esprits et notes PHARMA, ainsi que les images locales ajoutées aux fiches PHARMA. Le fichier reste sur ton appareil.",
              fallback:() => document.querySelector("#footerTitle"),
              position:"aboveBottom"
            },
            {
              selector:"#importNotesButton",
              title:"Import",
              text:"Ce bouton réimporte le fichier d’export : notes/esprits/associations/VS ACU, Esprits, notes, associations, VS, formules, précautions PHARMA et images locales. C’est utile pour changer de navigateur, d’ordinateur ou restaurer une sauvegarde.",
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
      exportButton.title = "Exporter notes/esprits/associations/VS ACU, esprits/notes/associations/VS/formules/précautions PHARMA et images locales";
      exportButton.setAttribute("aria-label", "Exporter notes et images locales");
    }
    if(importButton){
      importButton.title = "Importer notes/esprits/associations/VS ACU, esprits/notes/associations/VS/formules/précautions PHARMA et images locales";
      importButton.setAttribute("aria-label", "Importer notes et images locales");
    }
  });

  window.addEventListener("resize", initMobileDomainSwitchFix);
})();
