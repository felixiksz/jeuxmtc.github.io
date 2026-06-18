/* ============================================================
   16-14-comparison-all-fields.js
   Source: ancien bloc <script> #16 (hors JSON-LD)
   id original: mtc-final-no-auto-open-from-basket-patch
   ============================================================ */

/* === Patch final : ajout comparaison depuis panier sans ouverture automatique === */
(function(){
  function isReviewBasketOpen(){
    const panel = document.getElementById("reviewBasketPanel");
    return !!(panel && panel.classList.contains("open"));
  }

  function messageText(text){
    if(typeof message !== "undefined" && message){
      message.textContent = text;
    }
  }

  const previousAddPointToComparison = window.addPointToComparison;
  if(typeof previousAddPointToComparison === "function"){
    window.addPointToComparison = function(point, options){
      const opts = Object.assign({}, options || {});

      /* Quand l’ajout vient du panier, on ajoute silencieusement :
         le panneau Comparaison ne s’ouvre plus tout seul. */
      if(isReviewBasketOpen()){
        opts.autoOpen = false;
      }

      const result = previousAddPointToComparison.call(this, point, opts);

      if(isReviewBasketOpen()){
        const label = typeof formatPointCode === "function" ? formatPointCode(point) : String(point || "");
        messageText(`${label} ajouté à la comparaison. Ouvre A|B quand tu veux comparer.`);
      }

      return result;
    };
  }

  const previousSetComparisonPoint = window.setComparisonPoint;
  if(typeof previousSetComparisonPoint === "function"){
    window.setComparisonPoint = function(point, slotIndex, options){
      const opts = Object.assign({}, options || {});

      if(isReviewBasketOpen()){
        opts.autoOpen = false;
      }

      return previousSetComparisonPoint.call(this, point, slotIndex, opts);
    };
  }

  if(typeof renderReviewBasketPanelIfOpen === "function"){
    renderReviewBasketPanelIfOpen();
  }
})();
