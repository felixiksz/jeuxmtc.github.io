/* 44 — Bouton léger pour rejouer exactement la même grille, sans lasso */
(function(){
  "use strict";

  const state = {acu:null, pharma:null, bodyObserver:null, solvedObserver:null};

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isFinished(){ return document.body.classList.contains("game-finished") || document.body.classList.contains("game-complete"); }

  function cloneAcuSnapshot(){
    try{
      if(typeof solution === "undefined" || !Array.isArray(solution) || !solution.length) return null;
      const groups = solution.map(group => ({
        key:String(group.key || ""),
        name:String(group.name || group.key || ""),
        points:Array.isArray(group.points) ? group.points.map(String) : [],
        color:(typeof categoryColors !== "undefined" && categoryColors && group.key) ? categoryColors[group.key] : ""
      })).filter(group => group.points.length === 4);
      if(groups.length !== 4) return null;
      const domBoard = [...document.querySelectorAll("#grid .tile[data-point]")]
        .map(tile => String(tile.dataset.point || ""))
        .filter(Boolean);
      const fallbackBoard = groups.flatMap(group => group.points);
      const board = domBoard.length === 16 ? domBoard : fallbackBoard;
      return {type:"acu", groups, board};
    }catch(error){
      return null;
    }
  }

  function clonePharmaSnapshot(){
    try{
      if(typeof window.getCurrentPharmaGameState !== "function") return null;
      const current = window.getCurrentPharmaGameState();
      if(!current || !Array.isArray(current.board) || !current.board.length || !Array.isArray(current.groups) || !current.groups.length) return null;
      return {
        type:"pharma",
        board:current.board.map(herb => Object.assign({}, herb)),
        groups:current.groups.map(group => ({
          key:String(group.key || group.classCode || ""),
          name:String(group.name || group.key || ""),
          classCode:String(group.classCode || group.key || ""),
          herbIds:Array.isArray(group.herbIds) ? group.herbIds.map(String) : [],
          size:Number(group.size || 0)
        })).filter(group => group.herbIds.length)
      };
    }catch(error){
      return null;
    }
  }

  function captureCurrentGame(){
    const snap = isPharma() ? clonePharmaSnapshot() : cloneAcuSnapshot();
    if(snap){
      if(snap.type === "pharma") state.pharma = snap;
      else state.acu = snap;
    }
    return snap;
  }

  function installCaptureWrappers(){
    if(typeof window.newGame === "function" && !window.newGame.__mtcSimpleReplayCapture){
      const original = window.newGame;
      const wrapped = function(){
        removeReplayButton();
        const result = original.apply(this, arguments);
        window.setTimeout(captureCurrentGame, 120);
        window.setTimeout(removeReplayButtonIfNeeded, 160);
        return result;
      };
      wrapped.__mtcSimpleReplayCapture = true;
      window.newGame = wrapped;
    }

    if(typeof window.startPharmaGame === "function" && !window.startPharmaGame.__mtcSimpleReplayCapture){
      const originalPharma = window.startPharmaGame;
      const wrappedPharma = function(){
        removeReplayButton();
        const result = originalPharma.apply(this, arguments);
        window.setTimeout(captureCurrentGame, 120);
        window.setTimeout(removeReplayButtonIfNeeded, 160);
        return result;
      };
      wrappedPharma.__mtcSimpleReplayCapture = true;
      window.startPharmaGame = wrappedPharma;
    }
  }

  function resetSharedInterface(){
    try{ if(typeof closePointPanelCompletely === "function") closePointPanelCompletely(); }catch(error){}
    try{ if(typeof removeAssociationLinks === "function") removeAssociationLinks(); }catch(error){}
    document.querySelectorAll(".association-postit, .category-postit").forEach(el => el.remove());
    document.body.classList.remove("game-complete", "game-finished", "panel-open");
  }

  function startAcuReplay(){
    const snap = state.acu || cloneAcuSnapshot();
    if(!snap || !Array.isArray(snap.groups) || snap.groups.length !== 4 || !Array.isArray(snap.board) || snap.board.length !== 16){
      alert("Impossible de rejouer cette grille.");
      return false;
    }

    resetSharedInterface();

    try{ mistakeCount = 0; }catch(error){}
    try{ cheatCount = 0; }catch(error){}
    try{ currentAcuRunErrors = []; }catch(error){}
    try{ gameOver = false; }catch(error){}
    try{ selected = []; }catch(error){}
    try{ solvedCount = 0; }catch(error){}
    try{ hintCategory = null; hintStep = 0; }catch(error){}

    if(typeof message !== "undefined" && message) message.textContent = "";
    if(typeof hint !== "undefined" && hint) hint.textContent = "";
    if(typeof solved !== "undefined" && solved) solved.innerHTML = "";
    if(typeof grid !== "undefined" && grid) grid.innerHTML = "";
    if(typeof finalGuess !== "undefined" && finalGuess){
      finalGuess.style.display = "none";
      finalGuess.dataset.correctKey = "";
    }
    if(typeof finalGuessChoices !== "undefined" && finalGuessChoices) finalGuessChoices.innerHTML = "";

    try{
      if(!Array.isArray(CATEGORY_COLORS) || CATEGORY_COLORS.length < 4){
        generateCategoryColors();
      }
    }catch(error){}

    try{ solution = []; }catch(error){}
    try{ categoryColors = {}; }catch(error){}

    snap.groups.forEach((group, index) => {
      const copy = {
        key:group.key,
        name:group.name,
        points:group.points.slice(0, 4),
        solved:false
      };
      try{ categoryColors[copy.key] = group.color || (CATEGORY_COLORS && CATEGORY_COLORS[index]) || "#cccccc"; }catch(error){}
      try{ solution.push(copy); }catch(error){}
    });

    snap.board.forEach(point => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.point = point;
      tile.innerHTML = `<span>${typeof formatPointCode === "function" ? formatPointCode(point) : point}</span>`;
      tile.onclick = () => toggleTile(tile, point);
      grid.appendChild(tile);
    });

    try{ if(typeof updateGameStatus === "function") updateGameStatus(); }catch(error){}
    try{ if(typeof recordStatsGameStarted === "function") recordStatsGameStarted(solution); }catch(error){}

    state.acu = {
      type:"acu",
      groups:snap.groups.map(group => ({key:group.key, name:group.name, points:group.points.slice(), color:group.color || ""})),
      board:snap.board.slice()
    };
    removeReplayButton();
    return true;
  }

  function startPharmaReplay(){
    const snap = state.pharma || clonePharmaSnapshot();
    if(!snap || typeof window.startPharmaReplayGame !== "function"){
      alert("Impossible de rejouer cette grille.");
      return false;
    }
    resetSharedInterface();
    window.startPharmaReplayGame(snap);
    window.setTimeout(captureCurrentGame, 120);
    removeReplayButton();
    return true;
  }

  function replaySameGrid(){
    const before = isPharma() ? state.pharma : state.acu;
    if(!before) captureCurrentGame();
    return isPharma() ? startPharmaReplay() : startAcuReplay();
  }

  function ensureReplayButton(){
    if(!isFinished()) return;
    const messageEl = byId("message");
    const solvedEl = byId("solved");
    if(!messageEl || !solvedEl || !solvedEl.querySelector(".solved-point")) return;
    if(isPharma() && !state.pharma) captureCurrentGame();
    if(!isPharma() && !state.acu) captureCurrentGame();
    if(byId("mtcReplaySameGridWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "mtcReplaySameGridWrap";
    wrap.innerHTML = `
      <button type="button" id="mtcReplaySameGridButton" title="Rejouer exactement les mêmes tuiles">
        <span aria-hidden="true">↻</span><span class="mtc-replay-label">même grille</span>
      </button>
    `;
    messageEl.insertAdjacentElement("afterend", wrap);
    byId("mtcReplaySameGridButton")?.addEventListener("click", replaySameGrid, {passive:false});
  }

  function removeReplayButton(){
    byId("mtcReplaySameGridWrap")?.remove();
  }

  function removeReplayButtonIfNeeded(){
    if(!isFinished()) removeReplayButton();
  }

  function init(){
    installCaptureWrappers();
    window.setTimeout(captureCurrentGame, 420);

    const solvedEl = byId("solved");
    state.bodyObserver = new MutationObserver(() => {
      installCaptureWrappers();
      ensureReplayButton();
      removeReplayButtonIfNeeded();
    });
    state.bodyObserver.observe(document.body, {attributes:true, attributeFilter:["class"]});

    if(solvedEl){
      state.solvedObserver = new MutationObserver(() => {
        ensureReplayButton();
        removeReplayButtonIfNeeded();
      });
      state.solvedObserver.observe(solvedEl, {childList:true});
    }

    document.addEventListener("click", event => {
      if(event.target && event.target.closest && event.target.closest("#mtcReplaySameGridButton")){
        event.preventDefault();
      }
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();
