/* ============================================================
   05-04-final-corrections.js
   Source: ancien bloc <script> #5 (hors JSON-LD)
   id original: mtc-final-corrections-script
   ============================================================ */

(function(){
  function mtcRegularPointCode(point){
    return /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\s*\d+$/i.test(String(point || ""));
  }

  window.pointBasketActionHtml = function(point){
    return "";
  };

  function mtcPointHeaderHtml(point, details){
    details = details || {};

    const pinyin = details.pinyin || "";
    const hanzi = details.hanzi || "";
    const nomFrancais = details.nom_francais || details.nom_complet || "";
    const showCode = mtcRegularPointCode(point);

    const codeHtml = showCode
      ? `<span class="point-code">${formatPointCode(point)}</span>`
      : "";

    const pieces = [
      codeHtml,
      pinyin ? `<span class="point-pinyin-inline">${colorizePinyin(pinyin)}</span>` : "",
      hanzi ? `<span class="point-hanzi-inline">${hanzi}</span>` : "",
      nomFrancais ? `<span class="point-fr-inline">${escapeHtml(nomFrancais)}</span>` : ""
    ].filter(Boolean);

    const joined = pieces.join(`<span class="point-separator">·</span>`);

    return `
      <div class="point-header">
        ${joined || `<span class="point-code">${formatPointCode(point)}</span>`}
        ${basketButtonHtml(point, "point-header-basket-button", true)}
      </div>
    `;
  }

  function mtcSectionsForPoint(details){
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

  function mtcCategoryExplanationItems(key){
    if(typeof getCategoryExplanationItems === "function"){
      try{
        const items = getCategoryExplanationItems(key);
        return Array.isArray(items) ? items : [];
      }catch(error){}
    }

    const aliases = {
      JING_PUITS:"Points_Jing_Puits",
      YING_JAILLISSEMENT:"Points_Ying_Jaillissement",
      SHU_RIVIERE:"Points_Shu_Riviere",
      JING_FLEUVE:"Points_Jing_Fleuve",
      HE_REUNION:"Points_He_Reunion",
      Points_Jing_Puits:"JING_PUITS",
      Points_Ying_Jaillissement:"YING_JAILLISSEMENT",
      Points_Shu_Riviere:"SHU_RIVIERE",
      Points_Jing_Fleuve:"JING_FLEUVE",
      Points_He_Reunion:"HE_REUNION"
    };

    return (
      CATEGORY_EXPLANATIONS?.[key] ||
      CATEGORY_EXPLANATIONS?.[aliases[key]] ||
      []
    );
  }

  function mtcCategoryExplanationTextForTooltip(key){
    const items = mtcCategoryExplanationItems(key);
    if(!items.length) return "";
    return `<ul>${items.map(item => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
  }

  function mtcCategoryInfoButtons(line){
    if(typeof categoryInfoKeysForText !== "function") return "";

    let keys = [];
    try{
      keys = categoryInfoKeysForText(line) || [];
    }catch(error){
      keys = [];
    }

    keys = keys.filter(key => mtcCategoryExplanationItems(key).length);
    if(!keys.length) return "";

    return keys.map(key => `
      <span class="category-inline-info-wrap">
        <button type="button" class="category-inline-info" aria-label="Fonctions de ${escapeAttribute(DISPLAY_NAMES[key] || displayLabel(key))}">i</button>
        <span class="category-inline-info-tooltip">
          <strong>${escapeHtml(DISPLAY_NAMES[key] || displayLabel(key))}</strong>
          ${mtcCategoryExplanationTextForTooltip(key)}
        </span>
      </span>
    `).join("");
  }

  function mtcFormatPointSectionValue(title, value){
    if(title !== "Catégories du point"){
      return value;
    }

    return String(value || "")
      .split(/\n/)
      .map(line => `${escapeHtml(line)}${mtcCategoryInfoButtons(line)}`)
      .join("\n");
  }

  function mtcPointAssociationsValue(point, fallback){
    try{
      const stored = localStorage.getItem("mtc_point_associations_" + point);
      if(stored !== null) return stored;
    }catch(error){}
    return String(fallback || "");
  }

  function mtcAssociationsDisplayHtml(value){
    const clean = String(value || "").trim();
    return clean
      ? escapeHtml(clean).replace(/\n/g,"<br>")
      : '<span class="point-association-empty">Aucune association renseignée.</span>';
  }

  window.updatePointAssociationsFromTextarea = function(textarea){
    if(!textarea) return;
    const point = String(textarea.dataset.point || "");
    if(!point) return;
    const value = String(textarea.value || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    try{ localStorage.setItem("mtc_point_associations_" + point, value); }catch(error){}
    try{
      if(window.POINT_DETAILS && window.POINT_DETAILS[point]) window.POINT_DETAILS[point].associations = value;
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS[point]) POINT_DETAILS[point].associations = value;
    }catch(error){}
    const section = textarea.closest(".point-associations-section");
    const display = section && section.querySelector(".point-association-display");
    if(display) display.innerHTML = mtcAssociationsDisplayHtml(value);
  };

  window.commitPointAssociationsFromTextarea = function(textarea){
    if(!textarea) return;
    window.updatePointAssociationsFromTextarea(textarea);
    const point = String(textarea.dataset.point || "");
    let details = null;
    try{ details = (window.POINT_DETAILS && window.POINT_DETAILS[point]) || (typeof POINT_DETAILS !== "undefined" ? POINT_DETAILS[point] : null); }catch(error){}
    if(window.MTC_DATABASE_ADMIN_MODE && details && window.mtcDatabaseEditor && typeof window.mtcDatabaseEditor.saveRecord === "function"){
      window.mtcDatabaseEditor.saveRecord("acupuncture", point, Object.assign({}, details, {associations:textarea.value}), ["associations"]);
    }
    document.dispatchEvent(new CustomEvent("acu-point-edited", {detail:{point,field:"associations"}}));
  };

  window.togglePointAssociationsEdit = function(button){
    if(!window.MTC_DATABASE_ADMIN_MODE || !button) return;
    const section = button.closest(".point-associations-section");
    if(!section) return;
    const textarea = section.querySelector(".point-association-textarea");
    const display = section.querySelector(".point-association-display");
    if(!textarea || !display) return;
    const opening = textarea.hidden;
    textarea.hidden = !opening;
    display.hidden = opening;
    button.setAttribute("aria-pressed", opening ? "true" : "false");
    button.textContent = opening ? "✓" : "✎";
    button.title = opening ? "Terminer la correction" : "Corriger les associations";
    if(opening){
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }else{
      window.commitPointAssociationsFromTextarea(textarea);
    }
  };

  function mtcRenderAssociationsSection(point, value){
    const current = mtcPointAssociationsValue(point, value);
    const clean = String(current || "").trim();
    const display = clean
      ? (typeof window.mtcLinkifiedAcuAssistHtml === "function"
          ? window.mtcLinkifiedAcuAssistHtml(clean)
          : mtcAssociationsDisplayHtml(clean))
      : "";

    return `
      <details class="point-info-section point-associations-section" open>
        <summary class="point-associations-summary">
          <span>Associations</span>
        </summary>
        <div class="acu-assisted-editable-block point-associations-public-editor">
          <div class="mtc-assisted-edit-wrap">
            <div
              class="acu-comparison-editable acu-comparison-editable-associations mtc-assisted-link-editable"
              contenteditable="false"
              role="textbox"
              aria-multiline="true"
              spellcheck="false"
              data-acu-compare-edit="associations"
              data-acu-point-id="${escapeAttribute(point)}"
              data-acu-link-assist="1"
              data-assist-editing="0"
              data-raw-value="${escapeAttribute(clean)}"
              data-placeholder="Ajoute une association de points…"
              title="Modifier les associations avec saisie assistée">${display}</div>
            <button type="button" class="mtc-assisted-edit-pencil" data-assisted-edit-trigger="1" title="Modifier les associations" aria-label="Modifier les associations">✎</button>
          </div>
          <div class="point-association-hint">Tape le nom ou le code d’un point, puis choisis-le dans les propositions. La correction est enregistrée automatiquement dans ce navigateur.</div>
        </div>
      </details>
    `;
  }

  window.renderPointInfoSections = function(sections, point){
    return sections
      .filter(([title,value]) =>
        title === "Notes" ||
        title === "Associations" ||
        (
          value &&
          value !== "(Aucune)" &&
          value !== "Aucune"
        )
      )
      .map(([title,value]) => {
        if(title === "Associations"){
          return mtcRenderAssociationsSection(point, value);
        }
        if(title === "Notes"){
          const noteValue = getEditablePointNote(point, value);
          return `
            <details class="point-info-section point-note-section" open>
              <summary class="point-note-summary">
                <span>${title}</span>
                <button
                  type="button"
                  class="point-note-edit-button"
                  onclick="togglePointNoteEdit(this)"
                  title="Modifier les notes"
                  aria-label="Modifier les notes"
                >✎</button>
              </summary>

              <div class="point-note-display">
                ${formatNoteTextForDisplay(noteValue)}
              </div>

              <textarea
                class="point-note-textarea"
                data-point="${escapeAttribute(point)}"
                oninput="savePointNoteFromTextarea(this)"
                style="display:none;"
                placeholder="Ajoute tes remarques personnelles sur ce point..."
              >${escapeHtml(noteValue)}</textarea>

              <div class="point-note-hint">
                Clique sur le crayon pour écrire. Tes notes restent dans ce navigateur. Tu peux toujours les exporter pour les sauvegarder, puis importer pour les récupérer sur un autre appareil ou navigateur.
              </div>
            </details>
          `;
        }

        return `
          <details class="point-info-section">
            <summary>${escapeHtml(title)}</summary>
            <div>${mtcFormatPointSectionValue(title, value)}</div>
          </details>
        `;
      })
      .join("");
  };

  window.openPointPanel = function(point){
    currentPointPanelPoint = point;

    const isSolvedPoint =
      solution.some(group =>
        group.solved &&
        group.points.includes(point)
      );

    if(!isSolvedPoint) return;

    const details = POINT_DETAILS[point];
    if(details && !Object.prototype.hasOwnProperty.call(details,"associations")) details.associations = "";

    if(!details){
      pointPanelContent.innerHTML = `
        <div class="point-header">
          <span class="point-code">${formatPointCode(point)}</span>
          ${basketButtonHtml(point, "point-header-basket-button", true)}
        </div>
        <p>Aucune fiche trouvée pour ce point.</p>
      `;
    }else{
      const fullEditor = typeof window.renderMtcFullRecordEditor === "function"
        ? window.renderMtcFullRecordEditor("acupuncture", point, details)
        : "";
      pointPanelContent.innerHTML = `
        ${mtcPointHeaderHtml(point, details)}
        ${fullEditor}
        ${renderPointInfoSections(mtcSectionsForPoint(details), point)}
      `;
    }

    pointPanel.classList.add("available");
    pointPanel.classList.add("open");
    panelToggle.innerHTML = "&gt;";
    document.body.classList.add("panel-open");
    if(typeof window.bindMtcFullRecordEditor === "function"){
      window.bindMtcFullRecordEditor(pointPanelContent, () => window.openPointPanelDirect(point));
    }

    showProgressHintSoon(
      "point_basket_button_plus",
      ".point-header-basket-button",
      "Panier de révision",
      "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier de révision.",
      {},
      360
    );

    showProgressHintSoon(
      "point_notes",
      ".point-note-edit-button",
      "Notes perso",
      "En cliquant sur le crayon, tu peux ajouter tes remarques sur ce point. Elles restent dans ton navigateur.",
      {},
      760
    );
  };

  window.openPointPanelDirect = function(point){
    currentPointPanelPoint = point;

    const details = POINT_DETAILS[point];
    if(details && !Object.prototype.hasOwnProperty.call(details,"associations")) details.associations = "";

    if(!details){
      pointPanelContent.innerHTML = `
        <div class="point-header">
          <span class="point-code">${formatPointCode(point)}</span>
          ${basketButtonHtml(point, "point-header-basket-button", true)}
        </div>
        <p>Aucune fiche trouvée pour ce point.</p>
      `;
    }else{
      const fullEditor = typeof window.renderMtcFullRecordEditor === "function"
        ? window.renderMtcFullRecordEditor("acupuncture", point, details)
        : "";
      pointPanelContent.innerHTML = `
        ${mtcPointHeaderHtml(point, details)}
        ${fullEditor}
        ${renderPointInfoSections(mtcSectionsForPoint(details), point)}
      `;
    }

    pointPanel.classList.add("available");
    pointPanel.classList.add("open");
    panelToggle.innerHTML = "&gt;";
    document.body.classList.add("panel-open");
    if(typeof window.bindMtcFullRecordEditor === "function"){
      window.bindMtcFullRecordEditor(pointPanelContent, () => window.openPointPanelDirect(point));
    }
  };

  window.refreshCurrentPointPanel = function(){
    try{
      if(currentPointPanelPoint) window.openPointPanelDirect(currentPointPanelPoint);
    }catch(error){}
  };

  window.solveGroup = function(group){
    group.solved = true;
    solvedCount++;

    recordStatsCategorySolved(group);

    const row = document.createElement("div");
    row.className = "solved-row";
    row.dataset.categoryKey = group.key;

    row.innerHTML = `
      <div class="solved-title">
        <span>${group.name}</span>

        ${
          gameOver
            ? `
              <button
                class="category-info-button"
                onclick="toggleCategoryExplanation(this)"
                title="Explication"
              >
                💡
              </button>
            `
            : ""
        }
      </div>

      <div class="category-explanation" style="display:none;">
        ${CATEGORY_EXPLANATIONS[group.key] || "Explication à compléter pour cette catégorie."}
      </div>

      <div class="solved-points">
        ${group.points.map(p=>`
          <div class="solved-point" data-point="${escapeAttribute(p)}">
            ${formatPointCode(p)}
            ${basketButtonHtml(p, "solved-point-basket-button", true)}
          </div>
        `).join("")}
      </div>
    `;

    solved.appendChild(row);

    row.querySelectorAll(".solved-point").forEach(el=>{
      el.onclick = event => {
        if(event.target.closest("[data-basket-point]")) return;
        openPointPanel(el.dataset.point);
      };
    });

    document.querySelectorAll(".tile").forEach(tile=>{
      if(group.points.includes(tile.dataset.point)){
        tile.remove();
      }
    });

    selected = [];
    message.textContent = "Catégorie trouvée !";
    hint.textContent = "";

    if(hintCategory && hintCategory.key === group.key){
      hintCategory = null;
      hintStep = 0;
    }

    prepareFinalGuess();

    if(!localStorage.getItem("mtc_point_panel_hint_seen")){
      showPanelHint();
      try{ localStorage.setItem("mtc_point_panel_hint_seen","1"); }catch(error){}
    }

    showProgressHintSoon(
      "first_category",
      "#solved .solved-row:last-child",
      "Catégorie trouvée",
      "Bien joué. En cliquant sur un point rangé ici, tu ouvres sa fiche détaillée."
    );

    showProgressHintSoon(
      "solved_point_basket_plus",
      "#solved .solved-row:last-child .solved-point-basket-button",
      "Panier de révision",
      "En cliquant sur +, tu mets ce point de côté pour le retrouver dans ton panier de révision.",
      {},
      920
    );

    if(solvedCount === 4 && !gameOver){
      recordStatsGameFinished(true);
      gameOver = true;
      document.body.classList.add("game-complete");
      showEndReviewScreen("win");
    }
  };

  window.renderCheatsheetPanel = function(){
    function flattenLocal(value){
      if(!value) return [];
      if(Array.isArray(value)) return value.flatMap(flattenLocal);
      if(typeof value === "object") return Object.values(value).flatMap(flattenLocal);
      return [String(value)];
    }

    function pointFullName(point){
      const code = String(point).trim();
      const d = POINT_DETAILS[code] || {};
      return `
        ${basketButtonHtml(code, "cheatsheet-basket-button", true)}
        <button
          type="button"
          class="cheatsheet-point-link"
          onclick="openPointPanelDirect('${escapeAttribute(code)}')"
        >
          ${formatPointCode(code)}
        </button>
        ${d.pinyin || ""}
        ${d.hanzi || ""}
        ${d.nom_francais || d.nom_complet || ""}
      `;
    }

    function line(labelText, value){
      const points = flattenLocal(value);
      if(points.length === 0) return "";
      return `
        <div class="cheatsheet-line">
          <strong>${labelText}</strong> : ${points.map(pointFullName).join(", ")}
        </div>
      `;
    }

    function simplePointLines(value){
      return flattenLocal(value).map(point => `
        <div class="cheatsheet-line">
          ${pointFullName(point)}
        </div>
      `);
    }

    function section(title, rows){
      const cleanRows = rows.filter(Boolean);
      if(cleanRows.length === 0) return "";
      return `
        <details class="cheatsheet-section">
          <summary>${title}</summary>
          <div>${cleanRows.join("")}</div>
        </details>
      `;
    }

    function label(key){
      return LABEL_NAMES[key] || displayLabel(key);
    }

    const canalOrder = [
      "IG","V","TF","VB","GI","E",
      "P","Rt","C","Rn","EC","F",
      "RM","DM"
    ];

    let html = `
      <div class="point-header">
        <span class="point-code">Cheatsheet</span>
      </div>
    `;

    Object.entries(RAW_DATA.Categories_de_points || {}).forEach(([key,value])=>{
      const title = DISPLAY_NAMES[key] || key;
      if([
        "Points_Jing_Puits",
        "Points_Ying_Jaillissement",
        "Points_Shu_Riviere",
        "Points_Jing_Fleuve",
        "Points_He_Reunion",
        "Points_Yuan_Source",
        "Points_Xi_Crevasse",
        "Points_Luo_Liaison"
      ].includes(key)){
        html += section(
          title,
          canalOrder.map(canal =>
            line(
              labelForCanalOrVessel(canal),
              flattenLocal(value).filter(p => canalOfPoint(p) === canal)
            )
          )
        );
      }else{
        html += section(title, simplePointLines(value));
      }
    });

    [
      "Points_d_ouverture_des_merveilleux_vaisseaux",
      "Points_Hui_Reunion",
      "Points_generaux",
      "Les_4_mers"
    ].forEach(sectionKey=>{
      const data = RAW_DATA[sectionKey];
      if(!data) return;
      html += section(
        DISPLAY_NAMES[sectionKey] || sectionKey,
        Object.entries(data).map(([labelKey,points]) =>
          line(label(labelKey), points)
        )
      );
    });

    [
      "Points_fenetre_du_ciel",
      "Points_pour_faire_revenir_le_Yang",
      "Points_fantomes_de_Sun_Si_Miao"
    ].forEach(sectionKey=>{
      const data = RAW_DATA[sectionKey];
      if(!data) return;
      html += section(
        DISPLAY_NAMES[sectionKey] || sectionKey,
        simplePointLines(data)
      );
    });

    if(typeof POINT_DETAILS !== "undefined"){
      function extraordinarySortLabel(point){
        const d = POINT_DETAILS[point] || {};
        return String(d.pinyin || d.nom_francais || d.nom_complet || point)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g,"")
          .toLowerCase();
      }

      const extraordinaryPoints =
        Object.keys(POINT_DETAILS)
          .filter(point => !mtcRegularPointCode(point))
          .sort((a,b) => extraordinarySortLabel(a).localeCompare(extraordinarySortLabel(b), "fr"));

      html += section("Points extraordinaires", simplePointLines(extraordinaryPoints));
    }

    cheatsheetPanelContent.innerHTML = html;
    updateBasketButtons();
  };

  window.extraSearchCategoryGroups = function(){
    return [
      {
        section:"Points_d_ouverture_des_merveilleux_vaisseaux",
        prefix:"Merveilleux vaisseaux",
        data:RAW_DATA.Points_d_ouverture_des_merveilleux_vaisseaux || {}
      }
    ];
  };

  window.categoryDisplayNameFromSearchKey = function(key){
    if(!key) return "";
    if(key.includes("::")){
      const [section, subkey] = key.split("::");
      const prefix =
        section === "Points_d_ouverture_des_merveilleux_vaisseaux"
          ? "Merveilleux vaisseaux"
          : (DISPLAY_NAMES[section] || displayLabel(section));
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

    extraSearchCategoryGroups().forEach(group=>{
      Object.keys(group.data || {}).forEach(key=>{
        options.push({
          key:`${group.section}::${key}`,
          name:`${group.prefix} — ${LABEL_NAMES[key] || CANAL_LABELS[key] || displayLabel(key)}`
        });
      });
    });

    return options
      .sort((a,b)=>normalizeSearchText(a.name).localeCompare(normalizeSearchText(b.name), "fr"))
      .map(cat => `<option value="${escapeAttribute(cat.key)}">${escapeHtml(cat.name)}</option>`)
      .join("");
  };

  window.pointCategoryKeys = function(point){
    if(!pool || !pool.length) pool = buildPool();

    const keys = pool
      .filter(cat => (cat.points || []).includes(point))
      .map(cat => cat.key);

    extraSearchCategoryGroups().forEach(group=>{
      Object.entries(group.data || {}).forEach(([key,value])=>{
        if(flattenPoints(value).includes(point)){
          keys.push(`${group.section}::${key}`);
        }
      });
    });

    return keys;
  };

  window.pointCategoryNames = function(point){
    return pointCategoryKeys(point).map(categoryDisplayNameFromSearchKey);
  };

  window.pointMatchesCategory = function(point, categoryKey){
    if(!categoryKey) return true;
    return pointCategoryKeys(point).includes(categoryKey);
  };

  window.renderAdvancedSearchPanel = function(){
    const content = document.getElementById("advancedSearchPanelContent");
    if(!content) return;

    const currentFilters = getAdvancedSearchFilters();
    const hasCorrespondenceFilter = currentFilters.correspondences.includes(MTC_CORRESPONDENCE_FILTER_ANY);
    const resultsAll = advancedSearchResults();
    const results = resultsAll.slice(0,80);
    const total = resultsAll.length;

    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Recherche avancée</span>
      </div>

      <p class="stats-intro">
        Recherche un point par mot-clé, catégorie, canal du point ou correspondance. Tu peux limiter le mot-clé au nom, aux fonctions, aux indications ou aux notes.
      </p>

      <div class="search-controls">
        <label class="search-control">
          <span>Mot-clé</span>
          <input
            id="advancedSearchKeywords"
            type="search"
            value="${escapeAttribute(currentFilters.keywords)}"
            placeholder="ex. douleur, luò, Estomac, Rt4..."
            oninput="renderAdvancedSearchResults()"
          >
        </label>

        <div class="search-scope-options" aria-label="Champs de recherche">
          <span>Rechercher dans :</span>
          <label><input type="checkbox" name="advancedSearchScope" value="name" ${searchScopeChecked(currentFilters.scopes,"name")} onchange="renderAdvancedSearchResults()"> nom</label>
          <label><input type="checkbox" name="advancedSearchScope" value="functions" ${searchScopeChecked(currentFilters.scopes,"functions")} onchange="renderAdvancedSearchResults()"> fonctions</label>
          <label><input type="checkbox" name="advancedSearchScope" value="indications" ${searchScopeChecked(currentFilters.scopes,"indications")} onchange="renderAdvancedSearchResults()"> indications</label>
          <label><input type="checkbox" name="advancedSearchScope" value="notes" ${searchScopeChecked(currentFilters.scopes,"notes")} onchange="renderAdvancedSearchResults()"> notes</label>
        </div>

        <label class="search-control">
          <span>Catégorie de points</span>
          <select id="advancedSearchCategory" onchange="renderAdvancedSearchResults()">
            <option value="">Toutes les catégories</option>
            ${categoryOptionsHtml()}
          </select>
        </label>

        <label class="search-control">
          <span>Canal du point</span>
          <select id="advancedSearchCanal" onchange="renderAdvancedSearchResults()">
            <option value="">Tous les canaux</option>
            ${canalOptionsHtml()}
          </select>
        </label>

        <div class="search-control search-correspondence-control">
          <span>Point d’intersection</span>
          <label class="search-correspondence-any">
            <input
              type="checkbox"
              name="advancedSearchCorrespondence"
              value="${MTC_CORRESPONDENCE_FILTER_ANY}"
              ${correspondenceChecked(currentFilters.correspondences, MTC_CORRESPONDENCE_FILTER_ANY)}
              onchange="renderAdvancedSearchPanel()"
            >
            points ayant une intersection
          </label>

          ${hasCorrespondenceFilter
            ? `<div class="correspondence-checklist" aria-label="Correspondance">${correspondenceChecklistHtml(currentFilters.correspondences)}</div>`
            : ""
          }
        </div>
      </div>

      <div class="search-actions">
        <button type="button" onclick="resetAdvancedSearchFilters()">Réinitialiser les filtres</button>
      </div>

      <h3 class="search-section-title">Résultats</h3>
      <div id="advancedSearchResults"></div>
    `;

    document.getElementById("advancedSearchCategory").value = currentFilters.category;
    document.getElementById("advancedSearchCanal").value = currentFilters.canal;

    renderAdvancedSearchResultsWith(results, total);
  };

  window.basketListHtml = function(){
    const basket = getReviewBasket();

    if(!basket.length){
      return `<p class="stats-small">Ton panier est vide. Ajoute des points depuis la recherche, le Cheatsheet, une fiche point ou une catégorie validée.</p>`;
    }

    return `
      <p class="stats-small">Clique sur un point pour ouvrir sa fiche. Choisis A et B pour comparer deux points.</p>

      <ul class="basket-list review-basket-grid">
        ${basket.map(point => `
          <li class="basket-list-item review-basket-item" title="${escapeAttribute(searchPointTitle(point))}">
            <div
              class="compact-point-row review-basket-row"
              onclick="openPointPanelDirect('${escapeAttribute(point)}')"
              role="button"
              tabindex="0"
              onkeydown="openBasketLineWithKeyboard(event,'${escapeAttribute(point)}')"
            >
              <span class="compact-point-code review-basket-code">
                ${compactPointLabel(point)}
              </span>

              <span class="compact-point-tools basket-item-buttons review-basket-tools" onclick="event.stopPropagation()">
                <button
                  type="button"
                  class="comparison-slot-button"
                  onclick="setComparisonPoint('${escapeAttribute(point)}',0)"
                  title="Comparer en A"
                >A</button>

                <button
                  type="button"
                  class="comparison-slot-button"
                  onclick="setComparisonPoint('${escapeAttribute(point)}',1)"
                  title="Comparer en B"
                >B</button>

                <button
                  type="button"
                  class="basket-remove-button"
                  onclick="removePointFromReviewBasket('${escapeAttribute(point)}')"
                  title="Retirer du panier"
                >×</button>
              </span>
            </div>
          </li>
        `).join("")}
      </ul>
    `;
  };

  window.renderReviewBasketPanel = function(){
    const content = document.getElementById("reviewBasketPanelContent");
    if(!content) return;

    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Panier de révision</span>
      </div>

      <p class="stats-intro">
        Mets ici les points que tu veux revoir plus tard. Le panier reste enregistré dans ce navigateur, même après une mise à jour du jeu.
      </p>

      <div class="search-actions">
        <button type="button" onclick="clearReviewBasket()">Vider le panier</button>
        <button type="button" onclick="openAdvancedSearchFromBasket()">Ouvrir la recherche</button>
      </div>

      <div id="reviewBasketContent">${basketListHtml()}</div>
    `;

    updateBasketButtons();

    if(getReviewBasket().length){
      showProgressHintSoon(
        "basket_comparison_buttons_ab",
        ".comparison-slot-button",
        "Comparer deux points",
        "Choisis A pour le premier point et B pour le deuxième. Le panneau Comparaison s’affiche seulement quand les deux sont choisis.",
        {position:"aboveBottom"},
        520
      );
    }
  };

  window.openReviewBasketPanel = function(){
    const panel = document.getElementById("reviewBasketPanel");
    if(!panel) return;

    closeAllBottomPanels("reviewBasketPanel");
    renderReviewBasketPanel();
    panel.classList.add("open");

    showProgressHintSoon(
      "review_basket_panel_ab",
      "#reviewBasketPanel",
      "Panier",
      "Le panier garde les points à réviser. Clique sur un code pour ouvrir sa fiche, ou choisis A et B pour comparer deux points.",
      {position:"aboveBottom"},
      320
    );
  };

  window.newGame = function(){
    removeAssociationLinks();

    document
      .querySelectorAll(".association-postit")
      .forEach(el=>el.remove());

    document.body.classList.remove("game-complete");
    document.body.classList.remove("game-finished");

    mistakeCount = 0;
    cheatCount = 0;
    gameOver = false;
    currentGameStatsClosed = false;

    updateGameStatus();

    if(typeof hintButton !== "undefined"){
      hintButton.disabled = false;
      hintButton.style.opacity = "1";
      hintButton.style.pointerEvents = "auto";
    }

    if(typeof revealButton !== "undefined"){
      revealButton.style.display = "none";
    }

    selected = [];
    solution = [];
    solvedCount = 0;
    categoryColors = {};
    hintCategory = null;
    hintStep = 0;

    message.textContent = "";
    hint.textContent = "";
    solved.innerHTML = "";
    grid.innerHTML = "";

    finalGuess.style.display = "none";
    finalGuess.dataset.correctKey = "";
    finalGuessChoices.innerHTML = "";

    if(!Array.isArray(CATEGORY_COLORS) || CATEGORY_COLORS.length < 4){
      generateCategoryColors();
    }

    const cats =
      currentMode() === "manual"
        ? chooseManualCategories()
        : chooseCompatibleCategories();

    if(!cats || cats.length !== 4){
      message.textContent = "Impossible de créer une partie. Choisis plus de catégories ou relance.";
      return;
    }

    cats.forEach((cat,index)=>{
      const alreadyUsed = solution.flatMap(g => g.points || []);
      const availablePoints = cat.points.filter(p => !alreadyUsed.includes(p));
      const pts =
        availablePoints.length >= 4
          ? pickFourVariedPoints(cat.key, availablePoints)
          : pickFourVariedPoints(cat.key, cat.points);

      categoryColors[cat.key] = CATEGORY_COLORS[index] || "#cccccc";

      solution.push({
        key:cat.key,
        name:cat.name,
        points:pts,
        solved:false
      });
    });

    recordStatsGameStarted(solution);

    const board = distributeBoard(solution);

    if(!board || board.length !== 16){
      message.textContent = "Erreur : la grille n’a pas pu être générée.";
      return;
    }

    board.forEach(point=>{
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.point = point;
      tile.innerHTML = `<span>${formatPointCode(point)}</span>`;
      tile.onclick = () => toggleTile(tile, point);
      grid.appendChild(tile);
    });

    if(currentMode() === "manual"){
      manualControls.style.display = "none";
      manualEditButton.style.display = "inline-block";
    }else{
      manualControls.style.display = "none";
      manualEditButton.style.display = "none";
    }
  };

  function moveCheatsheetButtonToFooter(){
    const footer = document.getElementById("footerMainTools");
    const cheatsheetButton = document.getElementById("cheatsheetButton");
    const statsButton = document.getElementById("statsButton");
    if(!footer || !cheatsheetButton) return;
    if(cheatsheetButton.parentElement !== footer){
      footer.insertBefore(cheatsheetButton, statsButton || footer.firstChild);
    }
  }

  moveCheatsheetButtonToFooter();
  updateBasketButtons();
  updateBasketCount();
  updateComparisonButtonLabel();
  renderAdvancedSearchPanelIfOpen();
  renderReviewBasketPanelIfOpen();
  renderStatsPanelIfOpen();

  // La grille générée avant ce correctif doit aussi pouvoir compter une victoire.
  currentGameStatsClosed = false;
})();
