/* ============================================================
   13-11-point-links-final-fix.js
   Source: ancien bloc <script> #13 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Comparaison de A à Z : ajout automatique et panneau horizontal === */
(function(){
  const MAX_COMPARISON_SLOTS = 26;
  const SLOT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function slotsEmpty(){
    return Array.from({length:MAX_COMPARISON_SLOTS}, () => "");
  }

  function validPoint(point){
    point = String(point || "").trim();
    return point && typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point]
      ? point
      : point;
  }

  window.comparisonSlotLabel = function(slotIndex){
    const index = Number(slotIndex);
    return SLOT_LETTERS[index] || "";
  };

  window.getComparisonPoints = function(){
    try{
      const parsed = JSON.parse(
        localStorage.getItem(MTC_COMPARISON_POINTS_KEY) || "[]"
      );

      const slots = slotsEmpty();

      if(Array.isArray(parsed)){
        parsed.slice(0, MAX_COMPARISON_SLOTS).forEach((point, index) => {
          slots[index] = point ? String(point) : "";
        });
      }

      return slots;
    }catch(error){
      return slotsEmpty();
    }
  };

  window.saveComparisonPoints = function(points){
    const slots = slotsEmpty();

    if(Array.isArray(points)){
      points.slice(0, MAX_COMPARISON_SLOTS).forEach((point, index) => {
        slots[index] = point ? String(point) : "";
      });
    }

    try{ localStorage.setItem(
      MTC_COMPARISON_POINTS_KEY,
      JSON.stringify(slots)
    ); }catch(error){}

    updateComparisonButtonLabel();
    renderComparisonPanelIfOpen();
    renderReviewBasketPanelIfOpen();
  };

  function filledComparisonSlots(){
    return getComparisonPoints()
      .map((point, index) => ({point, index, label:comparisonSlotLabel(index)}))
      .filter(slot => !!slot.point);
  }

  function firstFreeComparisonSlot(slots){
    return slots.findIndex(point => !point);
  }

  function comparisonSlotIndexOf(point, slots){
    return slots.findIndex(saved => saved === point);
  }

  window.updateComparisonButtonLabel = function(){
    const button = document.getElementById("comparisonButton");
    if(!button) return;

    const count = filledComparisonSlots().length;

    button.textContent = count > 0
      ? `A–Z (${count}/26)`
      : "A–Z";

    button.title = "Comparer plusieurs points, de A à Z";
    button.setAttribute("aria-label", button.title);
  };

  window.addPointToComparison = function(point){
    point = validPoint(point);
    if(!point) return;

    const slots = getComparisonPoints();
    const alreadyIndex = comparisonSlotIndexOf(point, slots);

    if(alreadyIndex >= 0){
      if(filledComparisonSlots().length >= 2){
        openComparisonPanel();
      }
      if(typeof message !== "undefined" && message){
        message.textContent = `${formatPointCode(point)} est déjà en comparaison (${comparisonSlotLabel(alreadyIndex)}).`;
      }
      return;
    }

    const index = firstFreeComparisonSlot(slots);

    if(index < 0){
      if(typeof message !== "undefined" && message){
        message.textContent = "La comparaison est pleine : A à Z sont déjà occupés.";
      }
      openComparisonPanel();
      return;
    }

    slots[index] = point;
    saveComparisonPoints(slots);

    const filledCount = slots.filter(Boolean).length;

    if(filledCount >= 2){
      openComparisonPanel();
    }else if(typeof message !== "undefined" && message){
      message.textContent = `${formatPointCode(point)} placé en comparaison (${comparisonSlotLabel(index)}). Ajoute un deuxième point.`;
    }
  };

  window.setComparisonPoint = function(point, slotIndex){
    point = validPoint(point);
    if(!point) return;

    if(slotIndex === undefined || slotIndex === null || slotIndex === ""){
      addPointToComparison(point);
      return;
    }

    const index = Math.max(
      0,
      Math.min(MAX_COMPARISON_SLOTS - 1, Number(slotIndex) || 0)
    );

    const slots = getComparisonPoints();
    const alreadyIndex = comparisonSlotIndexOf(point, slots);

    if(alreadyIndex >= 0 && alreadyIndex !== index){
      slots[alreadyIndex] = "";
    }

    slots[index] = point;
    saveComparisonPoints(slots);

    if(slots.filter(Boolean).length >= 2){
      openComparisonPanel();
    }else if(typeof message !== "undefined" && message){
      message.textContent = `${formatPointCode(point)} placé en comparaison (${comparisonSlotLabel(index)}). Ajoute un deuxième point.`;
    }
  };

  window.clearComparisonPoint = function(slotIndex){
    const slots = getComparisonPoints();
    const index = Math.max(
      0,
      Math.min(MAX_COMPARISON_SLOTS - 1, Number(slotIndex) || 0)
    );

    slots[index] = "";
    saveComparisonPoints(slots);
  };

  window.comparisonValueBlock = function(title, value){
    const clean = flattenSearchText(value || "").trim();

    if(!clean) return "";

    return `
      <div class="comparison-field">
        <span class="comparison-field-title">${escapeHtml(title)}</span>
        <div class="comparison-field-value">${escapeHtml(clean)}</div>
      </div>
    `;
  };

  window.comparisonCardHtml = function(slotIndex, point){
    if(!point) return "";

    const details = POINT_DETAILS[point] || {};
    const notes = getEditablePointNote(point, details.notes || "");
    const label = comparisonSlotLabel(slotIndex);

    return `
      <div class="comparison-card" data-comparison-slot="${escapeAttribute(label)}">
        <div class="search-result-title">
          <span class="comparison-slot-label">${escapeHtml(label)}</span>
          ${searchPointTitle(point)}
        </div>
        <div class="search-result-meta">${escapeHtml(searchPointMeta(point))}</div>

        <div class="comparison-actions">
          <button type="button" onclick="openPointPanelDirect('${escapeAttribute(point)}')">Ouvrir la fiche</button>
          <button type="button" onclick="clearComparisonPoint(${slotIndex})">Retirer</button>
        </div>

        ${comparisonValueBlock("Catégories", pointCategoryNames(point).join(" · "))}
        ${comparisonValueBlock("Correspondances", details.correspondances)}
        ${comparisonValueBlock("Fonctions", details.actions || details.fonctions)}
        ${comparisonValueBlock("Indications", details.indications)}
        ${comparisonValueBlock("Notes", notes)}
      </div>
    `;
  };

  window.renderComparisonPanel = function(){
    const content = document.getElementById("comparisonPanelContent");
    if(!content) return;

    const filled = filledComparisonSlots();
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
        Les points restent alignés en colonnes. Sur téléphone, le panneau s’étend horizontalement : fais glisser vers la gauche ou la droite pour comparer les mêmes champs.
      </p>

      <div class="comparison-grid comparison-grid-az" style="--comparison-count:${count}">
        ${filled.map(slot => comparisonCardHtml(slot.index, slot.point)).join("")}
      </div>
    `;
  };

  window.openComparisonPanel = function(){
    const panel = document.getElementById("comparisonPanel");
    if(!panel) return;

    const filled = filledComparisonSlots();
    if(filled.length < 2){
      if(typeof message !== "undefined" && message){
        message.textContent = "Ajoute au moins deux points pour ouvrir la comparaison.";
      }
      openReviewBasketPanel();
      return;
    }

    closeAllBottomPanels("comparisonPanel");
    renderComparisonPanel();
    panel.classList.add("open");
  };

  window.toggleComparisonPanel = function(){
    const panel = document.getElementById("comparisonPanel");
    if(!panel) return;

    if(panel.classList.contains("open")){
      closeComparisonPanel();
    }else{
      openComparisonPanel();
    }
  };

  window.renderComparisonPanelIfOpen = function(){
    const panel = document.getElementById("comparisonPanel");
    if(panel && panel.classList.contains("open")){
      renderComparisonPanel();
    }
  };

  function comparisonBasketButtonHtml(point){
    const slots = getComparisonPoints();
    const index = comparisonSlotIndexOf(point, slots);

    if(index >= 0){
      const label = comparisonSlotLabel(index);
      return `
        <button
          type="button"
          class="comparison-present-button"
          onclick="openComparisonPanel()"
          title="Déjà en comparaison : ${escapeAttribute(label)}"
          aria-label="Déjà en comparaison : ${escapeAttribute(label)}"
        >${escapeHtml(label)}</button>
      `;
    }

    return `
      <button
        type="button"
        class="comparison-add-button"
        onclick="addPointToComparison('${escapeAttribute(point)}')"
        title="Ajouter à la comparaison"
        aria-label="Ajouter à la comparaison"
      >+</button>
    `;
  }

  window.basketListHtml = function(){
    const basket = getReviewBasket();

    if(!basket.length){
      return `<p class="stats-small">Ton panier est vide. Ajoute des points depuis la recherche, le Cheatsheet, une fiche point ou une catégorie validée.</p>`;
    }

    return `
      <p class="stats-small">Clique sur un point pour ouvrir sa fiche. Le bouton + l’ajoute à la comparaison, automatiquement de A jusqu’à Z.</p>

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
                ${comparisonBasketButtonHtml(point)}

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
  };

  const oldRenderStatsPanelIfOpen = window.renderStatsPanelIfOpen;
  window.renderStatsPanelIfOpen = function(){
    if(typeof oldRenderStatsPanelIfOpen === "function"){
      oldRenderStatsPanelIfOpen.apply(this, arguments);
    }
    updateComparisonButtonLabel();
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", updateComparisonButtonLabel);
  }else{
    updateComparisonButtonLabel();
  }
})();
