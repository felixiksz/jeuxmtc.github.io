/* === 40-comparison-loading-history.js
   Barre de comparaison légère : réutilise exactement la barre import/export (#mtcImportExportProgress).
   Aucun rendu terminal séparé ici.
*/
(function(){
  "use strict";

  const previousOpen = window.openComparisonPanel;
  const previousToggle = window.toggleComparisonPanel;
  const previousRender = window.renderComparisonPanel;

  function byId(id){ return document.getElementById(id); }

  function waitFrame(){
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  function ensureSharedProgressBox(){
    let box = byId("mtcImportExportProgress");
    if(!box){
      box = document.createElement("div");
      box.id = "mtcImportExportProgress";
      box.setAttribute("aria-live", "polite");
      box.innerHTML = '<span class="mtc-import-export-progress-label"></span><span class="mtc-import-export-progress-bar"><span></span></span>';
      document.body.appendChild(box);
    }
    return box;
  }

  function setSharedProgress(label, percent){
    const box = ensureSharedProgressBox();
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const labelEl = box.querySelector(".mtc-import-export-progress-label");
    const bar = box.querySelector(".mtc-import-export-progress-bar > span");
    if(labelEl) labelEl.textContent = `${String(label || "COMPARAISON").toUpperCase()} ${Math.round(p).toString().padStart(3,"0")}%`;
    if(bar) bar.style.width = `${p}%`;
    box.classList.add("visible");
  }

  function hideSharedProgress(delay){
    const box = byId("mtcImportExportProgress");
    if(!box) return;
    window.setTimeout(() => box.classList.remove("visible"), delay == null ? 520 : delay);
  }

  function loadingHtml(status){
    return `
      <div class="mtc-comparison-loading" aria-live="polite">
        <p class="mtc-comparison-loading-note">${String(status || "Chargement de la comparaison…")}</p>
      </div>
    `;
  }

  function setLoading(percent, status){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    setSharedProgress(status || "comparaison", percent);
    content.innerHTML = loadingHtml(status || "Chargement de la comparaison…");
  }

  async function renderComparisonWithBreathingRoom(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;

    if(typeof window.closeAllBottomPanels === "function"){
      window.closeAllBottomPanels("comparisonPanel");
    }
    panel.classList.add("open");
    setLoading(4, "ouverture comparaison");

    await waitFrame();
    setLoading(18, "lecture des données");
    await waitFrame();
    setLoading(36, "construction du tableau");
    await waitFrame();

    try{
      if(typeof previousRender === "function"){
        previousRender.apply(window, arguments);
      }else if(typeof previousOpen === "function"){
        previousOpen.apply(window, arguments);
      }
      setSharedProgress("comparaison", 100);
      hideSharedProgress(520);
    }catch(error){
      console.error("Erreur rendu comparaison", error);
      setSharedProgress("erreur comparaison", 100);
      hideSharedProgress(1200);
      content.innerHTML = '<div class="mtc-comparison-loading" role="status">Erreur de chargement de la comparaison.</div>';
    }
  }

  window.openComparisonPanel = function(){
    return renderComparisonWithBreathingRoom.apply(this, arguments);
  };

  window.toggleComparisonPanel = function(){
    const panel = byId("comparisonPanel");
    if(!panel){
      if(typeof previousToggle === "function") return previousToggle.apply(this, arguments);
      return;
    }
    if(panel.classList.contains("open")){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openComparisonPanel.apply(this, arguments);
  };
})();
