/* === 40-comparison-loading-history.js
   - Ouvre le panneau comparaison immédiatement avec une barre DOS avant le rendu lourd.
   - Ne modifie pas le moteur de comparaison : il décale seulement le rendu pour que l'UI respire.
*/
(function(){
  "use strict";

  const previousOpen = window.openComparisonPanel;
  const previousToggle = window.toggleComparisonPanel;
  const previousRender = window.renderComparisonPanel;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function waitFrame(){
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  function isPharma(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function filledCount(){
    try{
      const key = isPharma() ? "mtc_pharma_comparison_slots_v1" : "connections_mtc_comparison_points_v1";
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean).length : 0;
    }catch(error){ return 0; }
  }

  function barText(percent){
    const total = 30;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const filled = Math.max(0, Math.min(total, Math.round((p / 100) * total)));
    return "[" + "█".repeat(filled) + "░".repeat(total - filled) + "]";
  }

  function loadingHtml(percent, status){
    const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    const count = filledCount();
    const label = isPharma() ? "SM" : "POINTS";
    return `
      <div class="mtc-comparison-loading" aria-live="polite">
        <div class="mtc-compare-progress-dos" role="status" aria-label="Chargement du panneau de comparaison">
          <div class="mtc-compare-progress-head">
            <span class="mtc-compare-progress-prompt">C:\\MTC\\COMPARE&gt;</span>
            <span>${String(p).padStart(3,"0")}%</span>
          </div>
          <span class="mtc-compare-progress-status">${esc(count ? `${count} ${label} EN COMPARAISON` : "PANNEAU VIDE")}</span>
          <span class="mtc-compare-progress-bar">${barText(p)}</span>
          <span class="mtc-compare-progress-status">${esc(status || "PRÉPARATION DU TABLEAU...")}</span>
        </div>
        <p class="mtc-comparison-loading-note">Chargement de la comparaison…</p>
      </div>
    `;
  }

  function setLoading(percent, status){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    content.innerHTML = loadingHtml(percent, status);
  }

  async function renderComparisonWithBreathingRoom(){
    const panel = byId("comparisonPanel");
    const content = byId("comparisonPanelContent");
    if(!panel || !content) return;

    if(typeof window.closeAllBottomPanels === "function"){
      window.closeAllBottomPanels("comparisonPanel");
    }
    panel.classList.add("open");
    setLoading(4, "OUVERTURE DU PANNEAU...");

    // Deux frames : la première ouvre le panneau, la seconde laisse la barre se peindre.
    await waitFrame();
    setLoading(18, "LECTURE DES ÉLÉMENTS...");
    await waitFrame();
    setLoading(36, "CONSTRUCTION DES LIGNES...");
    await waitFrame();

    try{
      if(typeof previousRender === "function"){
        previousRender.apply(window, arguments);
      }else if(typeof previousOpen === "function"){
        previousOpen.apply(window, arguments);
      }
    }catch(error){
      console.error("Erreur rendu comparaison", error);
      setLoading(100, "ERREUR DE CHARGEMENT.");
      return;
    }

    // Petit signal visuel si le rendu a été assez rapide pour que la barre soit encore visible.
    requestAnimationFrame(() => {
      const loading = content.querySelector(".mtc-comparison-loading");
      if(loading) setLoading(100, "COMPARAISON PRÊTE.");
    });
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
