/* ============================================================
   17-15-no-auto-open-from-basket.js
   Source: ancien bloc <script> #17 (hors JSON-LD)
   id original: mtc-final-true-comparison-slot-message-patch
   ============================================================ */

/* === Patch final : le message affiche toujours le vrai slot A-Z === */
(function(){
  const MAX_SLOTS = 26;
  const SLOT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function isPanelOpen(id){
    const panel = document.getElementById(id);
    return !!(panel && panel.classList.contains("open"));
  }

  function shouldSuppressAutoOpen(options){
    const opts = options || {};
    return opts.autoOpen === false
      || isPanelOpen("advancedSearchPanel")
      || isPanelOpen("reviewBasketPanel");
  }

  function slots(){
    let current = [];

    if(typeof getComparisonPoints === "function"){
      current = getComparisonPoints() || [];
    }else{
      try{
        current = JSON.parse(localStorage.getItem("connections_mtc_comparison_points_v1") || "[]") || [];
      }catch(error){
        current = [];
      }
    }

    current = Array.isArray(current) ? current.slice(0, MAX_SLOTS) : [];
    while(current.length < MAX_SLOTS) current.push("");
    return current.map(point => point ? String(point) : "");
  }

  function saveSlots(nextSlots){
    const cleanSlots = Array.isArray(nextSlots)
      ? nextSlots.slice(0, MAX_SLOTS).map(point => point ? String(point) : "")
      : [];

    while(cleanSlots.length < MAX_SLOTS) cleanSlots.push("");

    if(typeof saveComparisonPoints === "function"){
      saveComparisonPoints(cleanSlots);
    }else{
      localStorage.setItem("connections_mtc_comparison_points_v1", JSON.stringify(cleanSlots));
      if(typeof updateComparisonButtonLabel === "function") updateComparisonButtonLabel();
      if(typeof renderComparisonPanelIfOpen === "function") renderComparisonPanelIfOpen();
      if(typeof renderReviewBasketPanelIfOpen === "function") renderReviewBasketPanelIfOpen();
    }
  }

  function slotLabel(index){
    const number = Number(index);
    if(typeof comparisonSlotLabel === "function") return comparisonSlotLabel(number);
    return SLOT_LETTERS[number] || "";
  }

  function pointLabel(point){
    if(typeof formatPointCode === "function") return formatPointCode(point);
    return String(point || "");
  }

  function messageText(text){
    if(typeof message !== "undefined" && message){
      message.textContent = text;
    }
  }

  function indexOfPoint(point, currentSlots){
    return currentSlots.findIndex(saved => saved === point);
  }

  function firstFreeSlot(currentSlots){
    return currentSlots.findIndex(saved => !saved);
  }

  function countFilled(currentSlots){
    return currentSlots.filter(Boolean).length;
  }

  function messageForPlaced(point, index){
    return `${pointLabel(point)} placé en comparaison (${slotLabel(index)}).`;
  }

  function messageForAlreadyPlaced(point, index){
    return `${pointLabel(point)} est déjà en comparaison (${slotLabel(index)}).`;
  }

  function maybeOpenComparison(currentSlots, suppressAutoOpen){
    if(!suppressAutoOpen && countFilled(currentSlots) >= 2 && typeof openComparisonPanel === "function"){
      openComparisonPanel();
    }
  }

  window.addPointToComparison = function(point, options){
    point = String(point || "").trim();
    if(!point) return null;

    const suppressAutoOpen = shouldSuppressAutoOpen(options);
    let currentSlots = slots();
    let actualIndex = indexOfPoint(point, currentSlots);

    if(actualIndex >= 0){
      maybeOpenComparison(currentSlots, suppressAutoOpen);
      messageText(messageForAlreadyPlaced(point, actualIndex));
      return { point, slotIndex: actualIndex, slotLabel: slotLabel(actualIndex), alreadyPresent: true };
    }

    const freeIndex = firstFreeSlot(currentSlots);
    if(freeIndex < 0){
      messageText("La comparaison est pleine : A à Z sont déjà occupés.");
      maybeOpenComparison(currentSlots, suppressAutoOpen);
      return null;
    }

    currentSlots[freeIndex] = point;
    saveSlots(currentSlots);

    /* On relit le stockage après saveComparisonPoints, car certaines fonctions
       peuvent normaliser/réordonner les slots. Le message utilise donc le vrai slot. */
    currentSlots = slots();
    actualIndex = indexOfPoint(point, currentSlots);
    if(actualIndex < 0) actualIndex = freeIndex;

    maybeOpenComparison(currentSlots, suppressAutoOpen);
    messageText(messageForPlaced(point, actualIndex));

    return { point, slotIndex: actualIndex, slotLabel: slotLabel(actualIndex), alreadyPresent: false };
  };

  window.setComparisonPoint = function(point, slotIndex, options){
    point = String(point || "").trim();
    if(!point) return null;

    if(slotIndex === undefined || slotIndex === null || slotIndex === ""){
      return addPointToComparison(point, options);
    }

    const suppressAutoOpen = shouldSuppressAutoOpen(options);
    const requestedIndex = Math.max(0, Math.min(MAX_SLOTS - 1, Number(slotIndex) || 0));

    let currentSlots = slots();
    const oldIndex = indexOfPoint(point, currentSlots);

    if(oldIndex >= 0 && oldIndex !== requestedIndex){
      currentSlots[oldIndex] = "";
    }

    currentSlots[requestedIndex] = point;
    saveSlots(currentSlots);

    currentSlots = slots();
    let actualIndex = indexOfPoint(point, currentSlots);
    if(actualIndex < 0) actualIndex = requestedIndex;

    maybeOpenComparison(currentSlots, suppressAutoOpen);
    messageText(messageForPlaced(point, actualIndex));

    return { point, slotIndex: actualIndex, slotLabel: slotLabel(actualIndex), requestedSlotIndex: requestedIndex };
  };

  if(typeof renderReviewBasketPanelIfOpen === "function"){
    renderReviewBasketPanelIfOpen();
  }
})();
