/* === Bucket 8L : ACU image + synthèse locale, stats ACU lisibles === */
(function(){
  "use strict";

  const ACU_SYNTH_STORAGE_PREFIX = "mtc_acu_point_synthese_";
  const ACU_IMAGE_STORAGE_PREFIX = "mtc_acu_point_image_";

  function currentDomain(){
    return document.documentElement.getAttribute("data-study-domain") || "acupuncture";
  }

  function isAcuDomain(){
    return currentDomain() !== "pharmacology";
  }

  function byId(id){
    return document.getElementById(id);
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

  function safeFormatPointCode(point){
    if(typeof window.formatPointCode === "function") return window.formatPointCode(point);
    return String(point || "");
  }

  function safeColorizePinyin(value){
    if(typeof window.colorizePinyin === "function") return window.colorizePinyin(value || "");
    return esc(value || "");
  }

  function safeBasketButton(point){
    if(typeof window.basketButtonHtml === "function"){
      return window.basketButtonHtml(point, "point-header-basket-button", true);
    }
    return "";
  }

  function storageGet(prefix, id){
    try{
      const value = localStorage.getItem(prefix + String(id || ""));
      return value === null ? null : value;
    }catch(error){
      return null;
    }
  }

  function storageSet(prefix, id, value){
    try{
      localStorage.setItem(prefix + String(id || ""), String(value ?? ""));
    }catch(error){
      const message = byId("message");
      if(message) message.textContent = "Impossible d’enregistrer localement pour l’instant.";
    }
  }

  function getPointSynthese(point, details){
    const stored = storageGet(ACU_SYNTH_STORAGE_PREFIX, point);
    return stored !== null ? stored : (details?.synthese || details?.synthèse || "");
  }

  function getPointImage(point){
    return storageGet(ACU_IMAGE_STORAGE_PREFIX, point) || "";
  }

  function setPointImage(point, value){
    storageSet(ACU_IMAGE_STORAGE_PREFIX, point, value || "");
  }

  function mtcRegularPointCode(point){
    return /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\s*\d+$/i.test(String(point || ""));
  }

  function pointHeaderHtml(point, details){
    details = details || {};

    const pinyin = details.pinyin || "";
    const hanzi = details.hanzi || "";
    const nomFrancais = details.nom_francais || details.nom_complet || "";
    const showCode = mtcRegularPointCode(point);

    const pieces = [
      showCode ? `<span class="point-code">${safeFormatPointCode(point)}</span>` : "",
      pinyin ? `<span class="point-pinyin-inline">${safeColorizePinyin(pinyin)}</span>` : "",
      hanzi ? `<span class="point-hanzi-inline">${esc(hanzi)}</span>` : "",
      nomFrancais ? `<span class="point-fr-inline">${esc(nomFrancais)}</span>` : ""
    ].filter(Boolean);

    return `
      <div class="point-header acu-point-header">
        ${pieces.length ? pieces.join(`<span class="point-separator">·</span>`) : `<span class="point-code">${safeFormatPointCode(point)}</span>`}
        ${safeBasketButton(point)}
      </div>
    `;
  }


  function pointDetailsMap(){
    try{
      if(typeof POINT_DETAILS !== "undefined") return POINT_DETAILS || {};
    }catch(error){}
    return window.POINT_DETAILS || {};
  }

  function sectionsForPoint(details){
    details = details || {};
    return [
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
  }

  function renderImageBlock(point, details){
    const image = getPointImage(point);
    const hasImage = Boolean(image);
    const label = details?.pinyin || details?.nom_francais || point;

    return `
      <section class="acu-image-block ${hasImage ? "has-image" : "is-empty"}" data-acu-image-block="${attr(point)}">
        <div class="acu-image-title">Image locale</div>
        <div class="acu-image-preview">
          ${hasImage ? `<img src="${attr(image)}" alt="Image locale de ${attr(label)}">` : `<span class="acu-image-empty">Aucune image locale</span>`}
        </div>
        <div class="acu-image-actions">
          <label class="acu-image-upload">
            <span>${hasImage ? "Modifier l’image" : "Choisir une image"}</span>
            <input type="file" accept="image/*" data-acu-image-input="${attr(point)}">
          </label>
          <button type="button" data-acu-image-remove="${attr(point)}" ${hasImage ? "" : "disabled"}>Supprimer</button>
        </div>
        <p class="acu-image-note">Image enregistrée localement dans ce navigateur.</p>
      </section>
    `;
  }

  function renderSyntheseBlock(point, details){
    return `
      <section class="acu-editable-block acu-editable-synthese">
        <div class="acu-editable-title">Synthèse</div>
        <textarea
          class="acu-editable-textarea"
          data-acu-edit-field="synthese"
          data-acu-point="${attr(point)}"
          placeholder="Résumé court du point, à ta façon…">${esc(getPointSynthese(point, details))}</textarea>
      </section>
    `;
  }

  function resizeImageFileToDataUrl(file, callback){
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || 1) * ratio));
        const height = Math.max(1, Math.round((img.height || 1) * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };

      img.onerror = () => callback(String(reader.result || ""));
      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  }

  function bindAcuPanelEditors(point){
    document.querySelectorAll("[data-acu-image-input]").forEach(input => {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if(!file) return;

        resizeImageFileToDataUrl(file, dataUrl => {
          setPointImage(point, dataUrl);
          openPointPanelDirect(point);
          document.dispatchEvent(new CustomEvent("acu-point-edited", {detail:{point, field:"image"}}));
        });
      });
    });

    document.querySelectorAll("[data-acu-image-remove]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        setPointImage(point, "");
        openPointPanelDirect(point);
        document.dispatchEvent(new CustomEvent("acu-point-edited", {detail:{point, field:"image"}}));
      });
    });

    document.querySelectorAll("[data-acu-edit-field='synthese']").forEach(textarea => {
      textarea.addEventListener("input", () => {
        storageSet(ACU_SYNTH_STORAGE_PREFIX, point, textarea.value);
        document.dispatchEvent(new CustomEvent("acu-point-edited", {detail:{point, field:"synthese"}}));
      });
    });
  }

  function setPanelContent(point, details, missing){
    const panel = byId("pointPanel");
    const toggle = byId("panelToggle");
    const content = byId("pointPanelContent");
    if(!panel || !content) return;

    const sectionsHtml = details && typeof window.renderPointInfoSections === "function"
      ? window.renderPointInfoSections(sectionsForPoint(details), point)
      : "";

    content.innerHTML = `
      ${renderImageBlock(point, details || {})}
      ${pointHeaderHtml(point, details || {})}
      ${renderSyntheseBlock(point, details || {})}
      ${missing ? `<p>Aucune fiche trouvée pour ce point.</p>` : sectionsHtml}
    `;

    panel.classList.remove("pharma-herb-panel");
    panel.setAttribute("data-panel-kind", "acu-point");
    panel.classList.add("available", "open", "acu-point-panel");

    if(toggle) toggle.innerHTML = "&gt;";
    document.body.classList.add("panel-open");

    bindAcuPanelEditors(point);
    if(typeof window.updateBasketButtons === "function") window.updateBasketButtons();
  }

  function solvedPoint(point){
    try{
      return Array.isArray(solution) && solution.some(group => group && group.solved && Array.isArray(group.points) && group.points.includes(point));
    }catch(error){
      return false;
    }
  }

  function openAcuPointPanel(point, requireSolved){
    if(!isAcuDomain()) return;
    try{ currentPointPanelPoint = point; }catch(error){}

    if(requireSolved && !solvedPoint(point)) return;

    const details = pointDetailsMap()[point];
    setPanelContent(point, details, !details);

    if(requireSolved && typeof window.showProgressHintSoon === "function"){
      window.showProgressHintSoon(
        "point_basket_button_plus",
        ".point-header-basket-button",
        "Panier de révision",
        "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier de révision.",
        {},
        360
      );

      window.showProgressHintSoon(
        "point_notes",
        ".point-note-edit-button",
        "Notes perso",
        "En cliquant sur le crayon, tu peux ajouter tes remarques sur ce point. Elles restent dans ton navigateur.",
        {},
        760
      );
    }
  }

  window.getAcuPointImage = function(point){ return getPointImage(point); };
  window.getAcuPointSynthese = function(point){
    return getPointSynthese(point, pointDetailsMap()[point] || {});
  };

  window.openPointPanel = function(point){
    if(!isAcuDomain()) return;
    return openAcuPointPanel(point, true);
  };

  window.openPointPanelDirect = function(point){
    if(!isAcuDomain()) return;
    return openAcuPointPanel(point, false);
  };

  /* ---------- Stats ACU plus lisibles, sans changer les clés localStorage ---------- */

  const previousStats = {
    renderStatsPanel: window.renderStatsPanel,
    renderStatsPanelIfOpen: window.renderStatsPanelIfOpen,
    openStatsPanel: window.openStatsPanel,
    toggleStatsPanel: window.toggleStatsPanel
  };

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

  function statsList(rows, empty, formatter){
    if(!rows.length) return `<p class="stats-small">${esc(empty)}</p>`;
    return `<ul class="stats-list acu-stats-list">${rows.map(row => `<li>${formatter(row)}</li>`).join("")}</ul>`;
  }

  function modeLabel(){
    if(typeof window.getAutoPracticeMode === "function" && typeof window.autoPracticeModeLabel === "function"){
      return window.autoPracticeModeLabel(window.getAutoPracticeMode());
    }
    return "Mixte";
  }

  function modeButtons(){
    const mode = typeof window.getAutoPracticeMode === "function" ? window.getAutoPracticeMode() : "balanced";
    const button = (value, label) => `<button onclick="setAutoPracticeMode('${value}')" data-practice-mode="${value}" class="${mode === value ? "active" : ""}">${label}</button>`;
    return `<div class="stats-mode-buttons acu-stats-mode-buttons">${button("easy", "Facile")}${button("balanced", "Mixte")}${button("hard", "Difficile")}</div>`;
  }

  function renderAcuStatsPanel(){
    const content = byId("statsPanelContent");
    if(!content) return;

    const stats = typeof window.loadMtcStats === "function" ? window.loadMtcStats() : (typeof loadMtcStats === "function" ? loadMtcStats() : null);
    if(!stats){
      content.innerHTML = `<div class="point-header"><span class="point-code">Stats ACU</span></div><p class="stats-small">Statistiques indisponibles.</p>`;
      return;
    }

    const rows = typeof window.getAllStatsRows === "function" ? window.getAllStatsRows(stats) : [];
    const playedRows = rows.filter(row => (row.seen || 0) > 0);
    const solvedRows = rows.filter(row => (row.solved || 0) > 0);
    const finished = stats.gamesFinished || 0;
    const winRate = finished ? (stats.wins || 0) / finished : 0;
    const categoriesSeen = playedRows.length;
    const completeRows = rows.filter(row => (row.totalPoints || 0) > 0 && (row.coverage || 0) >= 1);
    const avgCategoryMsValues = solvedRows.map(row => Number(row.avgSolveMs)).filter(value => value > 0);
    const avgCategoryMs = avgCategoryMsValues.length
      ? avgCategoryMsValues.reduce((sum, value) => sum + value, 0) / avgCategoryMsValues.length
      : null;
    const hasRepresentativeStats = finished >= 10;

    const toReview = [...rows].sort((a,b) => {
      const aUnseen = (a.seen || 0) ? 0 : 1;
      const bUnseen = (b.seen || 0) ? 0 : 1;
      if(aUnseen !== bUnseen) return bUnseen - aUnseen;
      return (b.difficulty || 0) - (a.difficulty || 0) || (a.coverage || 0) - (b.coverage || 0);
    }).slice(0,8);

    const best = [...solvedRows]
      .sort((a,b) => (b.mastery || 0) - (a.mastery || 0) || (b.solved || 0) - (a.solved || 0))
      .slice(0,8);

    const mostWorked = [...playedRows]
      .sort((a,b) => (b.seen || 0) - (a.seen || 0) || (b.solved || 0) - (a.solved || 0))
      .slice(0,8);

    const lowCoverage = [...rows]
      .sort((a,b) => (a.coverage || 0) - (b.coverage || 0) || (b.difficulty || 0) - (a.difficulty || 0))
      .slice(0,8);

    const rowLine = row => `
      <strong>${esc(row.name || row.key || "—")}</strong>
      <span class="stats-meta">vue ${row.seen || 0} · réussie ${row.solved || 0} · couverture ${row.totalPoints ? `${row.seenPointsCount || 0}/${row.totalPoints}` : "—"} · maîtrise ${percent(row.mastery || 0)}</span>
    `;

    content.innerHTML = `
      <div class="point-header"><span class="point-code">Stats ACU</span></div>
      <p class="stats-intro">Ces statistiques ACU restent enregistrées localement dans ce navigateur et sont séparées des stats PHARMA.</p>

      <div class="acu-stats-summary">
        <div><strong>${finished}</strong><span>parties terminées</span></div>
        <div><strong>${stats.wins || 0}</strong><span>victoires</span></div>
        <div><strong>${percent(winRate)}</strong><span>réussite</span></div>
        <div><strong>${categoriesSeen}</strong><span>catégories vues</span></div>
        <div><strong>${completeRows.length}</strong><span>catégories complètes</span></div>
        <div><strong>${formatDuration(avgCategoryMs)}</strong><span>temps moyen/catégorie</span></div>
        <div><strong>${stats.totalMistakes || 0}</strong><span>erreurs</span></div>
        <div><strong>${stats.totalHintsUsed || 0}</strong><span>astuces</span></div>
        <div><strong>${esc(modeLabel())}</strong><span>mode auto</span></div>
      </div>

      ${hasRepresentativeStats ? `
        <div class="stats-card acu-stats-mode-card">
          <h3>Gameplay adaptatif</h3>
          ${modeButtons()}
          <p class="stats-small">Le mode Auto utilise les mêmes données déjà enregistrées : couverture réelle des points, catégories réussies, erreurs, astuces et temps moyen de résolution.</p>
        </div>

        <div class="stats-grid">
          <div class="stats-card"><h3>Catégories à retravailler</h3>${statsList(toReview, "Aucune donnée pour l’instant.", rowLine)}</div>
          <div class="stats-card"><h3>Catégories les mieux réussies</h3>${statsList(best, "Pas encore assez de réussites.", rowLine)}</div>
          <div class="stats-card"><h3>Catégories les plus révisées</h3>${statsList(mostWorked, "Aucune catégorie révisée.", rowLine)}</div>
          <div class="stats-card"><h3>Couverture des points</h3>${statsList(lowCoverage, "Aucune catégorie disponible.", row => `
            <strong>${esc(row.name || row.key || "—")}</strong><span class="stats-meta">${row.totalPoints ? `${row.seenPointsCount || 0}/${row.totalPoints}` : "—"} · ${percent(row.coverage || 0)}</span>
          `)}</div>
        </div>
      ` : `
        <div class="stats-card acu-stats-warmup">
          <h3>Données en cours de stabilisation</h3>
          <p class="stats-small">Les statistiques détaillées s’afficheront après 10 parties terminées, pour éviter de tirer des conclusions sur trop peu de grilles.</p>
          <p class="stats-small">Encore ${Math.max(0, 10 - finished)} partie(s) terminée(s) avant l’analyse détaillée.</p>
        </div>
      `}
    `;

    if(typeof window.updatePracticeModeSwitch === "function") window.updatePracticeModeSwitch();
  }

  window.renderAcuStatsPanel = renderAcuStatsPanel;

  window.renderStatsPanel = function(){
    if(!isAcuDomain() && typeof previousStats.renderStatsPanel === "function"){
      return previousStats.renderStatsPanel.apply(this, arguments);
    }
    return renderAcuStatsPanel();
  };

  window.renderStatsPanelIfOpen = function(){
    const panel = byId("statsPanel");
    if(!panel || !panel.classList.contains("open")) return;
    if(!isAcuDomain() && typeof previousStats.renderStatsPanelIfOpen === "function"){
      return previousStats.renderStatsPanelIfOpen.apply(this, arguments);
    }
    return renderAcuStatsPanel();
  };

  window.openStatsPanel = function(){
    if(!isAcuDomain() && typeof previousStats.openStatsPanel === "function"){
      return previousStats.openStatsPanel.apply(this, arguments);
    }

    const panel = byId("statsPanel");
    if(!panel) return;
    if(typeof window.closeAllBottomPanels === "function") window.closeAllBottomPanels("statsPanel");
    renderAcuStatsPanel();
    panel.classList.add("open");
  };

  window.toggleStatsPanel = function(){
    if(!isAcuDomain() && typeof previousStats.toggleStatsPanel === "function"){
      return previousStats.toggleStatsPanel.apply(this, arguments);
    }

    const panel = byId("statsPanel");
    if(!panel) return;
    if(panel.classList.contains("open")) panel.classList.remove("open");
    else window.openStatsPanel();
  };
})();
