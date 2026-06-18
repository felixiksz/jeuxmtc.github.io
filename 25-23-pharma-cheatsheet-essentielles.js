/* === PHARMA Bucket 5 : cheatsheet par classes + choix manuel des SM essentielles ===
   - Les SM essentielles ne sont pas une classe.
   - Le bouton "SM essentielles" active seulement un mode d'édition avec cases à cocher.
   - La sélection part de la liste essentielle fournie, puis devient modifiable localement. */
(function(){
  "use strict";

  const ESSENTIAL_STORAGE_KEY = "mtc_pharma_essential_herb_ids_v1";

  function isPharmaDomain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){
    return document.getElementById(id);
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function escapeAttribute(value){
    return escapeHtml(value).replace(/`/g,"&#096;");
  }

  function titleCasePinyin(value){
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1).toLocaleLowerCase("fr-FR"))
      .join(" ");
  }

  function herbLabel(herb){
    return titleCasePinyin(herb?.pinyin || herb?.pinyinSansTons || herb?.nom || herb?.id || "");
  }

  function herbSortLabel(herb){
    return String(herb?.pinyinSansTons || herb?.pinyin || herb?.nom || herb?.id || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR");
  }

  function classSortLabel(item){
    return String(item?.nom || item?.code || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR");
  }

  function getDefaultEssentialIds(){
    return new Set((Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .filter(herb => herb && herb.prioritaire)
      .map(herb => herb.id));
  }

  function loadEssentialIds(){
    try{
      const raw = localStorage.getItem(ESSENTIAL_STORAGE_KEY);
      if(!raw) return getDefaultEssentialIds();
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return getDefaultEssentialIds();
      return new Set(parsed.map(String));
    }catch(error){
      return getDefaultEssentialIds();
    }
  }

  function saveEssentialIds(ids){
    try{
      localStorage.setItem(ESSENTIAL_STORAGE_KEY, JSON.stringify([...ids].sort()));
    }catch(error){
      /* Si localStorage est indisponible, les cases restent utilisables jusqu'au rechargement. */
    }
  }

  function setEssential(herbId, enabled){
    const ids = loadEssentialIds();
    if(enabled) ids.add(String(herbId));
    else ids.delete(String(herbId));
    saveEssentialIds(ids);
    updateEssentialLineState(herbId, enabled);
    updateClassEssentialCheckboxStates(ids);
    document.dispatchEvent(new CustomEvent("pharma-essentials-changed", {detail:{herbId:String(herbId), enabled:Boolean(enabled)}}));
  }

  function setClassEssential(classCode, enabled){
    const ids = loadEssentialIds();
    const herbs = (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .filter(herb => herb.classCode === classCode);

    herbs.forEach(herb => {
      if(enabled) ids.add(String(herb.id));
      else ids.delete(String(herb.id));
    });

    saveEssentialIds(ids);

    herbs.forEach(herb => updateEssentialLineState(herb.id, ids.has(String(herb.id))));

    document
      .querySelectorAll(`#cheatsheetPanelContent .pharma-essential-checkbox[data-class-code="${CSS.escape(String(classCode))}"]`)
      .forEach(checkbox => {
        checkbox.checked = Boolean(enabled);
      });

    updateClassEssentialCheckboxStates(ids);
    document.dispatchEvent(new CustomEvent("pharma-essentials-changed", {detail:{classCode:String(classCode), enabled:Boolean(enabled)}}));
  }

  function getClassHerbs(classCode){
    return (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .filter(herb => herb.classCode === classCode);
  }

  function updateClassEssentialCheckboxStates(existingIds){
    const ids = existingIds instanceof Set ? existingIds : loadEssentialIds();

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-essential-class-checkbox")
      .forEach(checkbox => {
        const classCode = checkbox.dataset.classCode;
        const herbs = getClassHerbs(classCode);
        const checkedCount = herbs.filter(herb => ids.has(String(herb.id))).length;

        checkbox.checked = herbs.length > 0 && checkedCount === herbs.length;
        checkbox.indeterminate = checkedCount > 0 && checkedCount < herbs.length;
      });
  }

  function updateEssentialLineState(herbId, enabled){
    document
      .querySelectorAll(`.pharma-cheatsheet-line[data-herb-id="${CSS.escape(String(herbId))}"]`)
      .forEach(line => line.classList.toggle("is-essential", Boolean(enabled)));
  }

  function groupHerbsByClass(){
    const herbs = Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
    const classes = Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];

    return classes
      .slice()
      .sort((a,b) => classSortLabel(a).localeCompare(classSortLabel(b), "fr"))
      .map(pharmaClass => {
        const classHerbs = herbs
          .filter(herb => herb.classCode === pharmaClass.code)
          .sort((a,b) => herbSortLabel(a).localeCompare(herbSortLabel(b), "fr"));

        return {pharmaClass, herbs:classHerbs};
      })
      .filter(group => group.herbs.length > 0);
  }

  function herbLineHtml(herb, essentialIds){
    const checked = essentialIds.has(herb.id);
    const common = String(herb.nom || "").trim();
    return `
      <div class="cheatsheet-line pharma-cheatsheet-line ${checked ? "is-essential" : ""}" data-herb-id="${escapeAttribute(herb.id)}">
        <label class="pharma-essential-checkbox-wrap" title="Ajouter / retirer des SM essentielles">
          <input
            type="checkbox"
            class="pharma-essential-checkbox"
            data-herb-id="${escapeAttribute(herb.id)}"
            ${checked ? "checked" : ""}
          >
        </label>
        <button
          type="button"
          class="pharma-cheatsheet-herb-link"
          data-herb-id="${escapeAttribute(herb.id)}"
          title="Ouvrir la fiche"
        >${escapeHtml(herbLabel(herb))}</button>
        ${common ? `<span class="pharma-cheatsheet-separator">·</span><span class="pharma-cheatsheet-common">${escapeHtml(common)}</span>` : ""}
        <button
          type="button"
          class="pharma-cheatsheet-basket-add pharma-basket-button"
          data-pharma-basket-herb="${escapeAttribute(herb.id)}"
          onclick="event.preventDefault(); event.stopPropagation(); if(window.togglePharmaBasketHerb) window.togglePharmaBasketHerb('${escapeAttribute(herb.id)}')"
          title="Ajouter/retirer du panier de révision"
          aria-label="Ajouter/retirer ${escapeAttribute(herbLabel(herb))} du panier de révision"
        >+</button>
      </div>
    `;
  }

  function renderPharmaCheatsheetPanel(){
    const content = byId("cheatsheetPanelContent");
    if(!content) return;

    const essentialIds = loadEssentialIds();
    const grouped = groupHerbsByClass();

    const sectionsHtml = grouped.map(group => {
      const classCode = String(group.pharmaClass.code || "").trim();
      const className = String(group.pharmaClass.nom || group.pharmaClass.code || "").trim();
      const summaryLabel = classCode
        ? `${classCode} · ${className}`
        : className;

      const allEssential = group.herbs.every(herb => essentialIds.has(herb.id));
      const someEssential = group.herbs.some(herb => essentialIds.has(herb.id));

      return `
        <details class="cheatsheet-section pharma-cheatsheet-section" data-class-code="${escapeAttribute(classCode)}">
          <summary>
            <label class="pharma-essential-class-checkbox-wrap" title="Ajouter / retirer toute la classe des SM essentielles">
              <input
                type="checkbox"
                class="pharma-essential-class-checkbox"
                data-class-code="${escapeAttribute(classCode)}"
                ${allEssential ? "checked" : ""}
                data-indeterminate="${someEssential && !allEssential ? "1" : "0"}"
              >
            </label>
            <span class="pharma-cheatsheet-class-code">${escapeHtml(classCode)}</span><span class="pharma-cheatsheet-class-separator"> · </span><span class="pharma-cheatsheet-class-name">${escapeHtml(className)}</span>
          </summary>
          <div>
            ${group.herbs.map(herb => herbLineHtml(herb, essentialIds)).join("")}
          </div>
        </details>
      `;
    }).join("");

    content.innerHTML = `
      <button type="button" id="pharmaEssentialToggle" class="pharma-cheatsheet-essential-toggle" aria-pressed="false">
        SM essentielles
      </button>
      <div class="point-header pharma-cheatsheet-header">
        <span class="point-code">Substances médicinales majeures</span>
      </div>
      ${sectionsHtml}
    `;

    bindPharmaCheatsheetInteractions();
    if(window.updatePharmaBasketButtons) window.updatePharmaBasketButtons();
  }

  function bindPharmaCheatsheetInteractions(){
    const panel = byId("cheatsheetPanel");
    const toggle = byId("pharmaEssentialToggle");

    if(toggle && panel){
      toggle.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const active = !panel.classList.contains("pharma-essential-edit-mode");
        panel.classList.toggle("pharma-essential-edit-mode", active);
        toggle.classList.toggle("is-active", active);
        toggle.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function keepCheatsheetOpen(event){
      /* Les cases à cocher sont dans le panneau : elles ne doivent ni fermer
         le panneau, ni déclencher l’ouverture/fermeture du <details>. */
      event.stopPropagation();
    }

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-essential-class-checkbox")
      .forEach(checkbox => {
        checkbox.indeterminate = checkbox.dataset.indeterminate === "1";
        checkbox.addEventListener("pointerdown", keepCheatsheetOpen);
        checkbox.addEventListener("mousedown", keepCheatsheetOpen);
        checkbox.addEventListener("click", keepCheatsheetOpen);
        checkbox.addEventListener("change", event => {
          event.stopPropagation();
          setClassEssential(checkbox.dataset.classCode, checkbox.checked);
        });
      });

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-essential-class-checkbox-wrap")
      .forEach(wrap => {
        wrap.addEventListener("pointerdown", keepCheatsheetOpen);
        wrap.addEventListener("mousedown", keepCheatsheetOpen);
        wrap.addEventListener("click", keepCheatsheetOpen);
      });

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-essential-checkbox")
      .forEach(checkbox => {
        checkbox.addEventListener("pointerdown", keepCheatsheetOpen);
        checkbox.addEventListener("mousedown", keepCheatsheetOpen);
        checkbox.addEventListener("click", keepCheatsheetOpen);
        checkbox.addEventListener("change", event => {
          event.stopPropagation();
          setEssential(checkbox.dataset.herbId, checkbox.checked);
        });
      });

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-essential-checkbox-wrap")
      .forEach(wrap => {
        wrap.addEventListener("pointerdown", keepCheatsheetOpen);
        wrap.addEventListener("mousedown", keepCheatsheetOpen);
        wrap.addEventListener("click", keepCheatsheetOpen);
      });

    updateClassEssentialCheckboxStates(loadEssentialIds());

    document
      .querySelectorAll("#cheatsheetPanelContent .pharma-cheatsheet-herb-link")
      .forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          const herbId = button.dataset.herbId;
          if(herbId && typeof window.openPharmaHerbPanel === "function"){
            window.openPharmaHerbPanel(herbId);
          }
        });
      });
  }

  function openPharmaCheatsheetPanel(){
    try{
      renderPharmaCheatsheetPanel();
      const panel = byId("cheatsheetPanel");
      const toggle = byId("cheatsheetToggle");
      if(panel){
        panel.classList.add("available");
        panel.classList.add("open");
      }
      if(toggle) toggle.innerHTML = "&lt;";
    }catch(error){
      console.error("Erreur cheatsheet PHARMA :", error);
      const message = byId("message");
      if(message) message.textContent = "Erreur dans le cheatsheet PHARMA. Regarde la console.";
    }
  }

  function closePharmaCheatsheetPanel(){
    const panel = byId("cheatsheetPanel");
    const toggle = byId("cheatsheetToggle");
    if(panel){
      panel.classList.remove("open");
      panel.classList.remove("pharma-essential-edit-mode");
    }
    const essentialToggle = byId("pharmaEssentialToggle");
    if(essentialToggle){
      essentialToggle.classList.remove("is-active");
      essentialToggle.setAttribute("aria-pressed", "false");
    }
    if(toggle) toggle.innerHTML = "&gt;";
  }

  function togglePharmaCheatsheetPanel(){
    const panel = byId("cheatsheetPanel");
    if(panel && panel.classList.contains("open")){
      closePharmaCheatsheetPanel();
    }else{
      openPharmaCheatsheetPanel();
    }
  }

  function initPharmaCheatsheet(){
    const originalRender = window.renderCheatsheetPanel;
    const originalOpen = window.openCheatsheetPanel;
    const originalToggle = window.toggleCheatsheetPanel;

    window.renderCheatsheetPanel = function(){
      if(isPharmaDomain()){
        renderPharmaCheatsheetPanel();
        return;
      }

      if(typeof originalRender === "function"){
        originalRender.apply(this, arguments);
      }
    };

    window.openCheatsheetPanel = function(){
      if(isPharmaDomain()){
        openPharmaCheatsheetPanel();
        return;
      }

      if(typeof originalOpen === "function"){
        originalOpen.apply(this, arguments);
      }
    };

    window.toggleCheatsheetPanel = function(){
      if(isPharmaDomain()){
        togglePharmaCheatsheetPanel();
        return;
      }

      if(typeof originalToggle === "function"){
        originalToggle.apply(this, arguments);
      }
    };

    // Sécurise aussi les anciens appels internes qui utilisent le nom global directement.
    try{
      if(typeof renderCheatsheetPanel === "function"){
        renderCheatsheetPanel = window.renderCheatsheetPanel;
      }
      if(typeof openCheatsheetPanel === "function"){
        openCheatsheetPanel = window.openCheatsheetPanel;
      }
      if(typeof toggleCheatsheetPanel === "function"){
        toggleCheatsheetPanel = window.toggleCheatsheetPanel;
      }
    }catch(error){
      /* Certains navigateurs ne permettent pas de réassigner le binding global : window suffit pour onclick. */
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initPharmaCheatsheet);
  }else{
    initPharmaCheatsheet();
  }

  window.getPharmaEssentialIds = function(){
    return [...loadEssentialIds()];
  };

  window.isPharmaHerbEssential = function(herbId){
    return loadEssentialIds().has(String(herbId));
  };

  window.renderPharmaCheatsheetPanel = renderPharmaCheatsheetPanel;
  window.openPharmaCheatsheetPanel = openPharmaCheatsheetPanel;
  window.closePharmaCheatsheetPanel = closePharmaCheatsheetPanel;
  window.togglePharmaCheatsheetPanel = togglePharmaCheatsheetPanel;
})();
