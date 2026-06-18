/* ============================================================
   14-12-comparison-az.js
   Source: ancien bloc <script> #14 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Patch : bouton A|B + pas d’ouverture auto depuis Recherche === */
(function(){
  const MAX_COMPARISON_SLOTS_PATCH = 26;

  function comparisonSlotsPatch(){
    if(typeof getComparisonPoints === "function"){
      const slots = getComparisonPoints();
      while(slots.length < MAX_COMPARISON_SLOTS_PATCH) slots.push("");
      return slots.slice(0, MAX_COMPARISON_SLOTS_PATCH);
    }
    return Array.from({length:MAX_COMPARISON_SLOTS_PATCH}, () => "");
  }

  function firstFreeSlotPatch(slots){
    return slots.findIndex(point => !point);
  }

  function slotIndexOfPatch(point, slots){
    return slots.findIndex(saved => saved === point);
  }

  function slotLabelPatch(index){
    return typeof comparisonSlotLabel === "function"
      ? comparisonSlotLabel(index)
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] || "";
  }

  function pointLabelPatch(point){
    return typeof formatPointCode === "function" ? formatPointCode(point) : String(point);
  }

  function isAdvancedSearchOpenPatch(){
    const panel = document.getElementById("advancedSearchPanel");
    return !!(panel && panel.classList.contains("open"));
  }

  function maybeOpenComparisonPatch(shouldOpen){
    if(shouldOpen && typeof openComparisonPanel === "function"){
      openComparisonPanel();
    }
  }

  window.updateComparisonButtonLabel = function(){
    const button = document.getElementById("comparisonButton");
    if(!button) return;

    const slots = comparisonSlotsPatch();
    const count = slots.filter(Boolean).length;
    const max = MAX_COMPARISON_SLOTS_PATCH;

    button.textContent = count > 0
      ? `A|B (${count}/${max})`
      : "A|B";

    const label = count > 0
      ? `Comparer les points (${count}/${max})`
      : "Comparer les points";

    button.title = label;
    button.setAttribute("aria-label", label);
  };

  window.addPointToComparison = function(point, options){
    point = String(point || "").trim();
    if(!point) return;

    const opts = options || {};
    const suppressAutoOpen = opts.autoOpen === false || isAdvancedSearchOpenPatch();

    const slots = comparisonSlotsPatch();
    const alreadyIndex = slotIndexOfPatch(point, slots);

    if(alreadyIndex >= 0){
      const enoughToCompare = slots.filter(Boolean).length >= 2;
      maybeOpenComparisonPatch(enoughToCompare && !suppressAutoOpen);

      if(typeof message !== "undefined" && message){
        message.textContent = `${pointLabelPatch(point)} est déjà en comparaison (${slotLabelPatch(alreadyIndex)}).`;
      }
      return;
    }

    const index = firstFreeSlotPatch(slots);

    if(index < 0){
      if(typeof message !== "undefined" && message){
        message.textContent = "La comparaison est pleine : A à Z sont déjà occupés.";
      }
      maybeOpenComparisonPatch(!suppressAutoOpen);
      return;
    }

    slots[index] = point;

    if(typeof saveComparisonPoints === "function"){
      saveComparisonPoints(slots);
    }

    const filledCount = slots.filter(Boolean).length;

    if(filledCount >= 2 && !suppressAutoOpen){
      openComparisonPanel();
    }else if(typeof message !== "undefined" && message){
      message.textContent = `${pointLabelPatch(point)} placé en comparaison (${slotLabelPatch(index)}).`;
    }
  };

  window.setComparisonPoint = function(point, slotIndex, options){
    point = String(point || "").trim();
    if(!point) return;

    if(slotIndex === undefined || slotIndex === null || slotIndex === ""){
      addPointToComparison(point, options);
      return;
    }

    const opts = options || {};
    const suppressAutoOpen = opts.autoOpen === false || isAdvancedSearchOpenPatch();

    const index = Math.max(
      0,
      Math.min(MAX_COMPARISON_SLOTS_PATCH - 1, Number(slotIndex) || 0)
    );

    const slots = comparisonSlotsPatch();
    const alreadyIndex = slotIndexOfPatch(point, slots);

    if(alreadyIndex >= 0 && alreadyIndex !== index){
      slots[alreadyIndex] = "";
    }

    slots[index] = point;

    if(typeof saveComparisonPoints === "function"){
      saveComparisonPoints(slots);
    }

    const filledCount = slots.filter(Boolean).length;

    if(filledCount >= 2 && !suppressAutoOpen){
      openComparisonPanel();
      if(typeof showProgressHintSoon === "function"){
        showProgressHintSoon(
          "comparison_ready",
          "#comparisonPanel",
          "Comparaison",
          "Les points sont côte à côte pour comparer rapidement leurs catégories, correspondances, fonctions, indications et notes.",
          {position:"aboveBottom"},
          420
        );
      }
    }else if(typeof message !== "undefined" && message){
      message.textContent = `${pointLabelPatch(point)} placé en comparaison (${slotLabelPatch(index)}).`;
    }
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", updateComparisonButtonLabel);
  }else{
    updateComparisonButtonLabel();
  }
})();
