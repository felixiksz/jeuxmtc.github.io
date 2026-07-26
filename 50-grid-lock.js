/* ============================================================
   50-grid-lock.js
   Verrouillage de grille : fige les 4 catégories et les 16 points
   de la partie en cours pour pouvoir la rejouer à l'identique,
   même après avoir fermé et rouvert la page. Fonctionne quel que
   soit le mode (auto/manuel) ou le domaine (ACU/PHARMA).
   ============================================================ */
(function(){
  "use strict";

  function domain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology" ? "pharma" : "acu";
  }

  function lockKey(){
    return "mtc_grid_lock_" + domain();
  }

  function loadLock(){
    try{
      const raw = localStorage.getItem(lockKey());
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      if(parsed && parsed.enabled && Array.isArray(parsed.categories) && parsed.categories.length === 4){
        return parsed;
      }
    }catch(error){}
    return null;
  }

  function saveLock(categoriesSnapshot){
    try{
      localStorage.setItem(lockKey(), JSON.stringify({
        enabled: true,
        categories: categoriesSnapshot,
        savedAt: new Date().toISOString()
      }));
    }catch(error){}
  }

  function clearLock(){
    try{ localStorage.removeItem(lockKey()); }catch(error){}
  }

  function isLockEnabled(){
    return !!loadLock();
  }

  function snapshotCurrentSolution(){
    const solution = typeof window.getCurrentGridSolution === "function" ? window.getCurrentGridSolution() : null;
    if(!Array.isArray(solution) || solution.length !== 4) return null;
    return solution.map(group => ({key: group.key, points: (group.points || []).slice()}));
  }

  function setMessage(text){
    const message = document.getElementById("message");
    if(message) message.textContent = text;
  }

  window.isGridLockEnabled = isLockEnabled;

  window.confirmNewGame = function(){
    if(isLockEnabled()){
      const proceed = confirm(
        "Cette grille est verrouillée : recommencer va réinitialiser ta progression sur les mêmes points (elle ne change pas). Continuer ?"
      );
      if(!proceed) return;
    }
    if(typeof window.newGame === "function") window.newGame();
  };

  window.toggleGridLock = function(enabled){
    if(enabled){
      const snapshot = snapshotCurrentSolution();
      if(snapshot){
        saveLock(snapshot);
        setMessage("Grille verrouillée : elle reste la même à chaque partie et à la réouverture du jeu.");
      }
    }else{
      clearLock();
      setMessage("Grille déverrouillée : une nouvelle grille aléatoire sera générée.");
    }
    syncToggleUi();
  };

  function syncToggleUi(){
    const enabled = isLockEnabled();
    const toggle = document.getElementById("gridLockToggle");
    if(toggle) toggle.checked = enabled;
    const indicator = document.getElementById("gridLockIndicator");
    if(indicator) indicator.style.display = enabled ? "" : "none";
  }

  function wrapCategoryChooser(name){
    const original = window[name];
    if(typeof original !== "function" || original.__gridLockWrapped) return;

    const wrapped = function(){
      const lock = loadLock();
      if(lock){
        const pool = typeof window.getCurrentGridPool === "function" ? window.getCurrentGridPool() : [];
        const byKey = new Map((pool || []).map(cat => [cat.key, cat]));
        const rebuilt = lock.categories
          .map(entry => byKey.get(entry.key))
          .filter(Boolean);
        if(rebuilt.length === 4) return rebuilt;
      }
      return original.apply(this, arguments);
    };
    wrapped.__gridLockWrapped = true;
    window[name] = wrapped;
  }

  function wrapPointPicker(){
    const original = window.pickFourVariedPoints;
    if(typeof original !== "function" || original.__gridLockWrapped) return;

    const wrapped = function(categoryKey, points){
      const lock = loadLock();
      if(lock){
        const entry = lock.categories.find(item => item.key === categoryKey);
        if(entry && Array.isArray(entry.points) && entry.points.length === 4){
          const allPresent = entry.points.every(p => (points || []).includes(p));
          if(allPresent) return entry.points.slice();
        }
      }
      return original.apply(this, arguments);
    };
    wrapped.__gridLockWrapped = true;
    window.pickFourVariedPoints = wrapped;
  }

  wrapCategoryChooser("chooseCompatibleCategories");
  wrapCategoryChooser("chooseManualCategories");
  wrapPointPicker();

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", syncToggleUi);
  }else{
    syncToggleUi();
  }

  window.addEventListener("mtc-study-domain-changed", syncToggleUi);
})();
