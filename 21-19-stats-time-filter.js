/* ============================================================
   21-19-stats-time-filter.js
   Source: ancien bloc <script> #21 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Bulles d'aide Recherche flottantes : hors du panneau, non coupées === */
(function(){
  function ready(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function(){
    let floating = document.getElementById("searchFloatingHelpTooltip");
    if(!floating){
      floating = document.createElement("div");
      floating.id = "searchFloatingHelpTooltip";
      floating.className = "search-floating-help-tooltip";
      floating.setAttribute("role", "tooltip");
      document.body.appendChild(floating);
    }

    let hideTimer = null;

    function getText(wrap){
      const internal = wrap.querySelector(".search-help-text, .search-help-tooltip, .intersection-help-text");
      return internal ? internal.textContent.trim() : "";
    }

    function clamp(value, min, max){
      return Math.max(min, Math.min(value, max));
    }

    function showFromWrap(wrap){
      const text = getText(wrap);
      if(!text) return;

      clearTimeout(hideTimer);
      floating.textContent = text;
      floating.classList.add("visible");

      // Forcer une mesure propre après insertion du texte.
      const tooltipRect = floating.getBoundingClientRect();
      const panel = document.getElementById("advancedSearchPanel");
      const panelRect = panel ? panel.getBoundingClientRect() : {top: window.innerHeight * .25};
      const anchorRect = wrap.getBoundingClientRect();

      const margin = 12;
      const desiredLeft = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2);
      const left = clamp(desiredLeft, margin, window.innerWidth - tooltipRect.width - margin);

      // La bulle est dessinée au-dessus du cadre du panneau Recherche.
      let top = panelRect.top - tooltipRect.height - 12;
      if(top < margin) top = margin;

      const arrowLeft = clamp(
        anchorRect.left + (anchorRect.width / 2) - left,
        18,
        tooltipRect.width - 18
      );

      floating.style.left = left + "px";
      floating.style.top = top + "px";
      floating.style.setProperty("--search-help-arrow-left", arrowLeft + "px");
    }

    function hideSoon(){
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function(){
        floating.classList.remove("visible");
      }, 90);
    }

    document.addEventListener("mouseenter", function(event){
      const wrap = event.target.closest && event.target.closest("#advancedSearchPanel .search-help-wrap, #advancedSearchPanel .intersection-help-wrap");
      if(wrap) showFromWrap(wrap);
    }, true);

    document.addEventListener("mouseleave", function(event){
      const wrap = event.target.closest && event.target.closest("#advancedSearchPanel .search-help-wrap, #advancedSearchPanel .intersection-help-wrap");
      if(wrap) hideSoon();
    }, true);

    document.addEventListener("focusin", function(event){
      const wrap = event.target.closest && event.target.closest("#advancedSearchPanel .search-help-wrap, #advancedSearchPanel .intersection-help-wrap");
      if(wrap) showFromWrap(wrap);
    });

    document.addEventListener("focusout", function(event){
      const wrap = event.target.closest && event.target.closest("#advancedSearchPanel .search-help-wrap, #advancedSearchPanel .intersection-help-wrap");
      if(wrap) hideSoon();
    });

    document.addEventListener("click", function(event){
      const wrap = event.target.closest && event.target.closest("#advancedSearchPanel .search-help-wrap, #advancedSearchPanel .intersection-help-wrap");
      if(wrap){
        event.preventDefault();
        event.stopPropagation();
        if(floating.classList.contains("visible")) floating.classList.remove("visible");
        else showFromWrap(wrap);
      }else if(!event.target.closest || !event.target.closest("#searchFloatingHelpTooltip")){
        floating.classList.remove("visible");
      }
    }, true);

    window.addEventListener("resize", function(){
      floating.classList.remove("visible");
    });
    document.addEventListener("scroll", function(){
      floating.classList.remove("visible");
    }, true);
  });
})();
