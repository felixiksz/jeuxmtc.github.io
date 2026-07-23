
/* 46 — Mode Mémo léger : colonnes nom ↔ synthèse */
(function(){
  "use strict";

  const STORAGE_ACU = "mtcMemoAcuEsprit.v1";
  const STORAGE_PHARMA = "mtcMemoPharmaSyntheses.v1";
  const STORAGE_SESSION = "mtcMemoSession.v1";
  const ACU_IMAGE_PREFIX = "mtc_point_image_";
  const ACU_IMAGE_MEMO_PREFIX = "mtc_point_image_memo_";
  const MATCH_MODE_KEY = "mtcMemoAcuMatchMode.v1";
  const state = {
    hasSession:false,
    matchMode:"localisation",
    phase:"idle",
    gridSignature:"",
    pairs:[],
    visiblePairs:[],
    selectedName:null,
    selectedSummary:null,
    matched:new Set(),
    attempts:0,
    matchIndex:0,
    foundPairs:[],
    slideCurrentId:null,
    hintTargetId:null,
    hintStep:0,
    easyMode:false,
    easyColorMap:new Map(),
    observer:null
  };

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function isFinished(){ return document.body.classList.contains("game-finished") || document.body.classList.contains("game-complete"); }
  function cleanText(value){ return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
  function cleanLines(value){ return String(value == null ? "" : value).replace(/\r\n/g,"\n").replace(/\r/g,"\n").split(/\n+/).map(line => cleanText(line)).filter(Boolean); }
  function loadStore(key){
    try{
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    }catch(error){ return {}; }
  }
  function saveStore(key, data){
    try{ localStorage.setItem(key, JSON.stringify(data || {})); }catch(error){}
  }
  function saveSession(){
    if(!state.gridSignature || !state.hasSession) return;
    const payload = {
      at:Date.now(),
      domain:isPharma() ? "pharma" : "acu",
      matchMode:state.matchMode,
      gridSignature:state.gridSignature,
      phase:state.phase,
      pairs:state.pairs.map(pair => ({id:pair.id, rawId:pair.rawId, kind:pair.kind, label:pair.label, summary:pair.summary, summaryImage:pair.summaryImage, summaryLabel:pair.summaryLabel, commonName:pair.commonName, className:pair.className, classKey:pair.classKey, classLabel:pair.classLabel, placeholder:pair.placeholder})),
      matched:Array.from(state.matched),
      attempts:state.attempts,
      matchIndex:state.matchIndex,
      foundPairs:state.foundPairs,
      easyMode:state.easyMode,
      finished:state.visiblePairs.length > 0 && state.matched.size === state.visiblePairs.length
    };
    saveStore(STORAGE_SESSION, payload);
  }
  function loadSession(signature){
    const saved = loadStore(STORAGE_SESSION);
    if(!saved || saved.gridSignature !== signature) return null;
    if(saved.domain !== (isPharma() ? "pharma" : "acu")) return null;
    if(!isPharma() && (saved.matchMode || "localisation") !== state.matchMode) return null;
    return saved;
  }
  function clearSession(){
    try{ localStorage.removeItem(STORAGE_SESSION); }catch(error){}
  }
  function shuffle(items){
    const copy = Array.isArray(items) ? items.slice() : [];
    for(let i = copy.length - 1; i > 0; i -= 1){
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }
  function escapeHtml(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  // Mode facile : 7 couleurs choisies à partir d'une photo de smarties,
  // affinées avec l'utilisatrice (brun/rouge éclaircis pour le contraste,
  // rouge réchauffé pour se distinguer du rose). Classées ici pour que les
  // 4 premières catégories rencontrées (le cas courant : une grille ACU a
  // 4 catégories) reçoivent les couleurs les plus faciles à distinguer
  // entre elles ; les suivantes n'arrivent que s'il y a plus de 4 catégories.
  const EASY_MODE_COLORS = ["#6FA8CC", "#E67561", "#7FA06C", "#9C93CC", "#B8946A", "#CD93B3", "#D6D571"];
  function assignEasyColors(pairs){
    state.easyColorMap = new Map();
    let nextIndex = 0;
    (pairs || []).forEach(pair => {
      const key = pair && pair.classKey;
      if(!key || state.easyColorMap.has(key)) return;
      state.easyColorMap.set(key, EASY_MODE_COLORS[nextIndex % EASY_MODE_COLORS.length]);
      nextIndex += 1;
    });
  }
  function easyModeColorForKey(value){
    return state.easyColorMap.get(value) || EASY_MODE_COLORS[0];
  }
  function pairSignature(pairs){
    return (pairs || []).map(pair => pair.id).filter(Boolean).sort().join("|");
  }
  function getPointCodeLabel(point){
    const code = String(point || "");
    return cleanText(typeof window.formatPointCode === "function" ? window.formatPointCode(code) : code) || code;
  }
  function getPointLabel(point){
    const code = String(point || "");
    const displayCode = getPointCodeLabel(code);
    const details = window.POINT_DETAILS && window.POINT_DETAILS[code] ? window.POINT_DETAILS[code] : null;
    const pinyin = details && details.pinyin ? " " + details.pinyin : "";
    const hanzi = details && details.hanzi ? " " + details.hanzi : "";
    return cleanText(displayCode + pinyin + hanzi) || code;
  }
  function getHerbLabel(herb){
    if(!herb) return "";
    return cleanText(herb.pinyin || herb.nom || herb.id || herb.code || "").replace(/[\u3400-\u9FFF]+/g, "").replace(/\s+/g, " ").trim();
  }
  function findPharmaHerb(rawId, herb){
    const herbs = Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
    const key = cleanText(rawId || herb?.id || herb?.code || "");
    const pinyin = cleanText(herb?.pinyin || "");
    return herbs.find(item => String(item.id || item.code || "") === key)
      || herbs.find(item => pinyin && cleanText(item.pinyin || "") === pinyin)
      || null;
  }
  function getPharmaClassName(herb){
    const direct = cleanText(herb?.classe || herb?.className || "");
    if(direct) return direct;
    const code = cleanText(herb?.classCode || "");
    const classes = Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];
    const found = classes.find(item => String(item.code || "") === code);
    return cleanText(found?.nom || "");
  }
  function getPharmaCommonName(herb){
    return cleanText(herb?.nom || herb?.nomCommun || herb?.nom_commun || herb?.commonName || "");
  }
  function getCurrentSolutionGroups(){
    try{
      if(typeof window.solution !== "undefined" && Array.isArray(window.solution)) return window.solution;
      if(typeof solution !== "undefined" && Array.isArray(solution)) return solution;
    }catch(error){}
    return [];
  }
  function detailsForAcuPoint(point){
    try{
      if(typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point]) return POINT_DETAILS[point];
    }catch(error){}
    return (window.POINT_DETAILS && window.POINT_DETAILS[point]) || {};
  }
  function makeAcuPlaceholder(point, details){
    const lines = [];
    cleanLines(details.categories_du_point || details.categories || "").forEach(line => lines.push("•  " + line));
    cleanLines(details.correspondances || "").forEach(line => lines.push("🖇️ " + line));
    return lines.join("\n");
  }
  function getAcuMemoInfo(point){
    const code = String(point || "");
    const groups = getCurrentSolutionGroups();
    const found = groups
      .filter(group => group && Array.isArray(group.points) && group.points.map(String).includes(code))
      .map(group => ({
        name:cleanText(group.name || group.key || ""),
        points:group.points.map(String).filter(Boolean)
      }))
      .filter(group => group.name || group.points.length);

    if(!found.length) return {classKey:"", classLabel:""};
    const primary = found[0];
    return {
      classKey:cleanText(primary.name || primary.points.join(",")),
      classLabel:cleanText(primary.name || "Catégorie")
    };
  }

  function getPointImage(point){
    // La version "memo" (sans nom/code visible) est prioritaire quand elle existe,
    // pour ne pas pouvoir lire la réponse sur l'image pendant le jeu ; sinon on
    // retombe sur l'image normale de la fiche du point.
    try{
      const key = String(point || "");
      return localStorage.getItem(ACU_IMAGE_MEMO_PREFIX + key) || localStorage.getItem(ACU_IMAGE_PREFIX + key) || "";
    }catch(error){ return ""; }
  }
  function loadMatchMode(){
    try{
      const saved = localStorage.getItem(MATCH_MODE_KEY);
      return saved === "image" ? "image" : "localisation";
    }catch(error){ return "localisation"; }
  }
  function saveMatchMode(mode){
    try{ localStorage.setItem(MATCH_MODE_KEY, mode === "image" ? "image" : "localisation"); }catch(error){}
  }

  function applySavedAcuSyntheses(){
    const saved = loadStore(STORAGE_ACU);
    if(!window.POINT_DETAILS) return saved;
    Object.keys(saved).forEach(point => {
      const text = cleanText(saved[point]);
      if(text && window.POINT_DETAILS[point]) window.POINT_DETAILS[point].espritAcu = text;
    });
    return saved;
  }
  function collectCurrentAcuPoints(){
    let points = [];
    const groups = getCurrentSolutionGroups();
    if(groups.length){
      points = groups.flatMap(group => Array.isArray(group.points) ? group.points : []);
    }
    if(points.length < 1){
      // Une fois la partie terminée, les tuiles .tile sont retirées du DOM
      // au fur et à mesure (04-03-core-game.js), donc on retombe sur les
      // .solved-point restants avant d'essayer les tuiles encore présentes.
      points = Array.from(document.querySelectorAll("#solved .solved-point[data-point]"))
        .map(el => el.dataset.point)
        .filter(Boolean);
    }
    if(points.length < 1){
      points = Array.from(document.querySelectorAll("#grid .tile[data-point]"))
        .map(tile => tile.dataset.point)
        .filter(Boolean);
    }

    const unique = [];
    const seen = new Set();
    points.forEach(point => {
      const key = String(point || "");
      if(key && !seen.has(key)){
        seen.add(key);
        unique.push(key);
      }
    });
    return unique;
  }
  function captureAcuPairs(){
    const saved = applySavedAcuSyntheses();
    const unique = collectCurrentAcuPoints();

    const imageMode = state.matchMode === "image";
    const pool = imageMode ? unique.filter(point => getPointImage(point)) : unique;

    return pool.slice(0, 16).map(point => {
      const details = detailsForAcuPoint(point);
      const info = getAcuMemoInfo(point);
      const base = {
        id:"acu:" + point,
        rawId:point,
        kind:"acu",
        // Uniquement la nomenclature (ex. "TF 8") : le pinyin/hanzi n'aide pas
        // à associer un point à sa localisation, et alourdit la tuile.
        label:getPointCodeLabel(point),
        promptTitle:getPointCodeLabel(point),
        placeholder:makeAcuPlaceholder(point, details),
        classKey:info.classKey,
        classLabel:info.classLabel
      };
      if(imageMode){
        // L'image locale sert de contenu visuel de la tuile ; le texte de
        // secours (accessibilité/placeholder) reste la localisation si connue.
        return Object.assign(base, {
          summary:cleanText(details.localisation || base.promptTitle),
          summaryImage:getPointImage(point),
          summaryLabel:"image"
        });
      }
      // Le mémo ACU associe le nom du point à sa localisation anatomique
      // (donnée déjà présente pour chaque point, donc pas besoin d'écrire
      // quoi que ce soit avant de jouer). Un ancien "esprit" personnalisé
      // ou une synthèse éditée manuellement restent prioritaires si présents.
      return Object.assign(base, {
        summary:cleanText(saved[point] || details.localisation || details.espritAcu || ""),
        summaryLabel:"localisation"
      });
    });
  }
  function capturePharmaPairs(){
    let board = [];
    try{
      if(typeof window.getCurrentPharmaGameState === "function"){
        const current = window.getCurrentPharmaGameState();
        if(current && Array.isArray(current.board)) board = current.board.slice();
      }
    }catch(error){}
    if(!board.length){
      board = Array.from(document.querySelectorAll("#grid .tile[data-herb-id], #grid .pharma-tile[data-herb-id]"))
        .map(tile => ({id:tile.dataset.herbId || tile.dataset.id || "", pinyin:tile.textContent || ""}))
        .filter(herb => herb.id || herb.pinyin);
    }
    const saved = loadStore(STORAGE_PHARMA);
    const seen = new Set();
    return board.filter(Boolean).map(herb => {
      const firstRawId = String(herb.id || herb.code || herb.pinyin || "");
      const fullHerb = Object.assign({}, findPharmaHerb(firstRawId, herb) || {}, herb);
      const rawId = String(fullHerb.id || fullHerb.code || firstRawId || "");
      if(!rawId || seen.has(rawId)) return null;
      seen.add(rawId);
      const className = getPharmaClassName(fullHerb);
      const summary = cleanText(saved[rawId] || fullHerb.esprit || "");
      return {
        id:"pharma:" + rawId,
        rawId,
        kind:"pharma",
        label:getHerbLabel(fullHerb),
        promptTitle:getHerbLabel(fullHerb),
        summary,
        summaryLabel:"esprit",
        commonName:getPharmaCommonName(fullHerb),
        className,
        classKey:cleanText(fullHerb.classCode || className),
        classLabel:className
      };
    }).filter(Boolean).slice(0, 16);
  }
  function capturePairs(){ return isPharma() ? capturePharmaPairs() : captureAcuPairs(); }

  function ensureOverlay(){
    let overlay = byId("mtcMemoOverlay");
    if(overlay) return overlay;
    overlay = document.createElement("section");
    overlay.id = "mtcMemoOverlay";
    overlay.className = "mtc-memo-overlay";
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("role", "dialog");
    overlay.innerHTML = '<div class="mtc-memo-shell"><div id="mtcMemoContent"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
      if(event.target === overlay) closeMemo();
    });
    return overlay;
  }
  function setOverlayVisible(visible){
    const overlay = ensureOverlay();
    overlay.classList.toggle("visible", Boolean(visible));
    overlay.setAttribute("aria-hidden", visible ? "false" : "true");
    document.body.classList.toggle("mtc-memo-open", Boolean(visible));
    if(!visible) document.body.classList.remove("mtc-memo-prep-open");
  }
  function content(){ ensureOverlay(); return byId("mtcMemoContent"); }
  function headerHtml(title, subtitle){
    return '' +
      '<div class="mtc-memo-header">' +
        '<div>' +
          '<h2>' + escapeHtml(title) + '</h2>' +
          (subtitle ? '<p>' + escapeHtml(subtitle) + '</p>' : '') +
        '</div>' +
        '<button type="button" class="mtc-memo-close" data-memo-action="close" aria-label="Fermer le mémo">×</button>' +
      '</div>';
  }
  function closeMemo(){
    saveSession();
    setOverlayVisible(false);
  }
  function resetSessionForPairs(pairs, signature){
    state.hasSession = false;
    state.phase = "idle";
    state.gridSignature = signature || pairSignature(pairs);
    state.pairs = pairs || [];
    state.visiblePairs = [];
    state.selectedName = null;
    state.selectedSummary = null;
    state.matched = new Set();
    state.attempts = 0;
    state.matchIndex = 0;
    state.foundPairs = [];
    resetMemoHint(null);
  }
  function restoreSession(saved, currentPairs){
    const currentById = new Map((currentPairs || []).map(pair => [pair.id, pair]));
    const savedPairs = Array.isArray(saved.pairs) ? saved.pairs : [];
    const merged = savedPairs.map(savedPair => Object.assign({}, currentById.get(savedPair.id) || {}, savedPair))
      .filter(pair => pair && pair.id && cleanText(pair.summary));
    if(!merged.length) return false;
    state.hasSession = true;
    state.phase = saved.phase === "prep" ? "prep" : "game";
    state.gridSignature = saved.gridSignature;
    state.pairs = merged;
    state.visiblePairs = merged.slice();
    state.matched = new Set(Array.isArray(saved.matched) ? saved.matched : []);
    state.attempts = Number(saved.attempts) || 0;
    state.matchIndex = Number(saved.matchIndex) || state.matched.size || 0;
    state.foundPairs = Array.isArray(saved.foundPairs) ? saved.foundPairs.filter(item => item && item.id) : [];
    if(!state.foundPairs.length && state.matched.size){
      let index = 0;
      state.foundPairs = Array.from(state.matched).map(id => ({id, label:"paire " + (++index), hue:(index * 47) % 360}));
      state.matchIndex = index;
    }
    state.easyMode = Boolean(saved.easyMode);
    state.selectedName = null;
    state.selectedSummary = null;
    resetMemoHint(null);
    return true;
  }
  function openMemo(){
    if(isPharma()){
      launchMemoFlow();
      return;
    }
    renderMatchModeChoice();
  }
  function hasAnyMemoSafeImage(){
    try{
      for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if(key && key.startsWith(ACU_IMAGE_MEMO_PREFIX)) return true;
      }
    }catch(error){}
    return false;
  }
  function resetMemoSafeImages(){
    if(!confirm("Effacer toutes les images anti-triche du mode mémo ? Les images normales de la fiche du point ne sont pas touchées.")) return;
    try{
      const toRemove = [];
      for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if(key && key.startsWith(ACU_IMAGE_MEMO_PREFIX)) toRemove.push(key);
      }
      toRemove.forEach(key => { try{ localStorage.removeItem(key); }catch(error){} });
    }catch(error){}
    renderMatchModeChoice();
  }
  function renderMatchModeChoice(){
    state.hasSession = false;
    state.phase = "choice";
    setOverlayVisible(true);
    const current = loadMatchMode();
    const hasAnyLocalImage = collectCurrentAcuPoints().some(point => getPointImage(point));
    const resetButton = hasAnyMemoSafeImage()
      ? '<button type="button" data-memo-action="reset-memo-images" class="secondary">Réinitialiser les images anti-triche</button>'
      : "";
    content().innerHTML = headerHtml("Mémo — que veux-tu associer aux points ?", "") +
      '<div class="mtc-memo-choice">' +
        '<button type="button" class="mtc-memo-choice-option' + (current === "localisation" ? " is-current" : "") + '" data-memo-action="choose-mode" data-mode="localisation">' +
          '<strong>Nom ↔ Localisation</strong>' +
          '<span>Associe chaque point à sa description anatomique.</span>' +
        '</button>' +
        '<button type="button" class="mtc-memo-choice-option' + (current === "image" ? " is-current" : "") + '" data-memo-action="choose-mode" data-mode="image"' + (hasAnyLocalImage ? "" : " disabled") + '>' +
          '<strong>Nom ↔ Image</strong>' +
          '<span>' + (hasAnyLocalImage ? "Associe chaque point à son image locale." : "Aucune image locale importée pour l’instant.") + '</span>' +
        '</button>' +
      '</div>' +
      '<div class="mtc-memo-actions bottom">' +
        '<button type="button" data-memo-action="close" class="secondary">Retour</button>' +
        resetButton +
      '</div>';
  }
  function chooseMatchMode(mode){
    const clean = mode === "image" ? "image" : "localisation";
    state.matchMode = clean;
    saveMatchMode(clean);
    launchMemoFlow();
  }
  function launchMemoFlow(){
    const pairs = capturePairs();
    if(!pairs.length){
      alert(state.matchMode === "image"
        ? "Aucun point de cette grille n’a d’image locale importée."
        : "Je n'arrive pas à récupérer la grille actuelle pour le mémo.");
      renderMatchModeChoice();
      return;
    }
    const signature = pairSignature(pairs);
    const existingContent = content();
    if(state.hasSession && state.gridSignature === signature && existingContent && existingContent.innerHTML.trim()){
      setOverlayVisible(true);
      if(state.phase === "prep") document.body.classList.add("mtc-memo-prep-open");
      return;
    }
    const saved = loadSession(signature);
    if(saved && restoreSession(saved, pairs)){
      setOverlayVisible(true);
      renderMemoGame();
      return;
    }
    resetSessionForPairs(pairs, signature);
    setOverlayVisible(true);
    const missing = state.pairs.filter(pair => !cleanText(pair.summary));
    if(missing.length) renderSynthPrompt(missing);
    else startMemoGame(state.pairs);
  }
  function renderSynthPrompt(missingPairs){
    state.hasSession = true;
    state.phase = "prep";
    saveSession();
    document.body.classList.add("mtc-memo-prep-open");
    const allMissing = Array.isArray(missingPairs) ? missingPairs : state.pairs.filter(pair => !cleanText(pair.summary));
    const subject = isPharma() ? "substances" : "points";
    const intro = isPharma()
      ? "Certaines substances n’ont pas encore de champ ESPRIT. Écris une synthèse courte pour lancer le mémo."
      : "Localisation manquante pour ces points : écris toi-même une courte description pour lancer le mémo.";
    const rows = allMissing.map(pair => {
      const placeholder = pair.kind === "acu" && pair.placeholder ? pair.placeholder : "Synthèse courte…";
      const rowClass = pair.kind === "acu" ? " mtc-memo-synth-row-acu" : "";
      return (
        '<label class="mtc-memo-synth-row' + rowClass + '" data-pair-id="' + escapeHtml(pair.id) + '">' +
          '<span>' + escapeHtml(pair.promptTitle || pair.label) + '</span>' +
          '<textarea maxlength="360" rows="4" placeholder="' + escapeHtml(placeholder) + '">' + escapeHtml(pair.summary || "") + '</textarea>' +
        '</label>'
      );
    }).join("");
    content().innerHTML = headerHtml("Préparer le mémo", intro) +
      '<div class="mtc-memo-actions prep-top">' +
        '<button type="button" data-memo-action="save-synth">Enregistrer et lancer</button>' +
        '<button type="button" data-memo-action="close" class="secondary">Retour</button>' +
      '</div>' +
      '<div class="mtc-memo-prep-note">' + allMissing.length + ' ' + subject + ' à compléter.</div>' +
      '<div class="mtc-memo-synth-list">' + rows + '</div>';
  }
  function saveSynthesesAndLaunch(){
    const rows = Array.from(document.querySelectorAll(".mtc-memo-synth-row"));
    let hasEmpty = false;
    const acuStore = loadStore(STORAGE_ACU);
    const pharmaStore = loadStore(STORAGE_PHARMA);
    rows.forEach(row => {
      row.classList.remove("empty");
      const id = row.getAttribute("data-pair-id") || "";
      const textarea = row.querySelector("textarea");
      const value = cleanText(textarea ? textarea.value : "");
      const pair = state.pairs.find(item => item.id === id);
      if(!pair) return;
      if(!value){
        hasEmpty = true;
        row.classList.add("empty");
        return;
      }
      pair.summary = value;
      if(pair.kind === "acu"){
        acuStore[pair.rawId] = value;
        if(window.POINT_DETAILS && window.POINT_DETAILS[pair.rawId]) window.POINT_DETAILS[pair.rawId].espritAcu = value;
      }else{
        pharmaStore[pair.rawId] = value;
      }
    });
    if(hasEmpty){
      const note = document.querySelector(".mtc-memo-prep-note");
      if(note) note.textContent = "Complète les champs vides avant de lancer.";
      const firstEmpty = document.querySelector(".mtc-memo-synth-row.empty textarea");
      if(firstEmpty && typeof firstEmpty.scrollIntoView === "function") firstEmpty.scrollIntoView({block:"center", behavior:"smooth"});
      return;
    }
    saveStore(STORAGE_ACU, acuStore);
    saveStore(STORAGE_PHARMA, pharmaStore);
    startMemoGame(state.pairs);
  }
  function startMemoGame(pairs){
    document.body.classList.remove("mtc-memo-prep-open");
    state.hasSession = true;
    state.phase = "game";
    state.pairs = pairs.filter(pair => cleanText(pair.summary)).slice(0, 16);
    state.visiblePairs = state.pairs.slice();
    state.matched = new Set();
    state.attempts = 0;
    state.matchIndex = 0;
    state.foundPairs = [];
    state.slideCurrentId = null;
    state.selectedName = null;
    state.selectedSummary = null;
    resetMemoHint(null);
    saveSession();
    renderMemoGame();
  }
  function currentHintId(){
    if(state.selectedName) return state.selectedName.getAttribute("data-id");
    if(state.selectedSummary) return state.selectedSummary.getAttribute("data-id");
    return state.hintTargetId || "";
  }
  function resetMemoHint(targetId){
    state.hintTargetId = targetId || null;
    state.hintStep = 0;
    updateMemoHint("");
  }
  function updateMemoHint(html){
    const box = byId("mtcMemoHint");
    if(box) box.innerHTML = html || "";
  }
  function revealMemoHint(){
    if(!isPharma()){
      updateMemoHint("Astuce disponible côté pharma.");
      return;
    }
    const id = currentHintId();
    if(!id){
      updateMemoHint("Sélectionne d’abord une substance ou une synthèse.");
      return;
    }
    const pair = state.visiblePairs.find(item => item.id === id);
    if(!pair || pair.kind !== "pharma"){
      updateMemoHint("Astuce disponible pour les substances.");
      return;
    }
    if(state.hintTargetId !== id){
      state.hintTargetId = id;
      state.hintStep = 0;
    }
    state.hintStep = Math.min(state.hintStep + 1, 2);
    const common = pair.commonName ? escapeHtml(pair.commonName) : "nom commun non renseigné";
    const cls = pair.className ? escapeHtml(pair.className) : "classe non renseignée";
    let html = '<span class="mtc-memo-hint-line"><b>Nom commun</b> : ' + common + '</span>';
    if(state.hintStep >= 2) html += '<span class="mtc-memo-hint-line"><b>Classe</b> : ' + cls + '</span>';
    else html += '<span class="mtc-memo-hint-next">Encore une astuce : classe</span>';
    updateMemoHint(html);
  }
  function easyClass(pair){
    return state.easyMode && pair && pair.classKey ? " memo-easy" : "";
  }
  function easyAttrs(pair){
    if(!state.easyMode || !pair || !pair.classKey) return "";
    const color = easyModeColorForKey(pair.classKey);
    const title = pair.classLabel ? ' title="' + escapeHtml(pair.classLabel) + '"' : "";
    return ' style="--memo-easy-color:' + color + '" data-easy-key="' + escapeHtml(pair.classKey) + '"' + title;
  }
  function renderMemoGame(){
    document.body.classList.remove("mtc-memo-prep-open");
    state.phase = "game";
    assignEasyColors(state.pairs);
    const hintButton = isPharma() ? '<button type="button" data-memo-action="hint" class="secondary memo-hint-button">Astuce</button>' : '';
    const easyActive = state.easyMode ? " is-active" : "";
    content().innerHTML = headerHtml("Mémo", "") +
      '<div class="mtc-memo-toolbar">' +
        '<span id="mtcMemoScore">0/' + state.visiblePairs.length + ' · 0 essai</span>' +
        hintButton +
        '<button type="button" data-memo-action="toggle-easy" class="secondary memo-easy-button' + easyActive + '" aria-pressed="' + (state.easyMode ? 'true' : 'false') + '">MODE FACILE</button>' +
        '<span id="mtcMemoHint" class="mtc-memo-hint" aria-live="polite"></span>' +
      '</div>' +
      '<div id="mtcMemoBoard"></div>' +
      '<div class="mtc-memo-actions bottom">' +
        '<button type="button" data-memo-action="restart">Rejouer le mémo</button>' +
        '<button type="button" data-memo-action="close" class="secondary">Retour à la grille</button>' +
        '<button type="button" data-memo-action="edit-synth" class="secondary memo-edit-synth">Synthèses</button>' +
      '</div>';
    if(state.matchMode === "image" && !isPharma()) renderSlideBoard();
    else renderColumnsBoard();
    updateScore();
    saveSession();
  }
  function summaryContentHtml(pair){
    if(pair.summaryImage){
      return '<img src="' + escapeHtml(pair.summaryImage) + '" alt="' + escapeHtml(pair.summary || pair.label) + '" loading="lazy">';
    }
    return escapeHtml(pair.summary);
  }
  function renderFoundPairs(){
    return state.foundPairs.map(found => {
      const pair = state.visiblePairs.find(item => item.id === found.id);
      if(!pair) return "";
      return '<article class="mtc-memo-found-pair" data-found-id="' + escapeHtml(pair.id) + '" style="--memo-match-hue:' + String(found.hue) + '">' +
        '<span class="mtc-memo-found-badge">' + escapeHtml(found.label) + '</span>' +
        '<b>' + escapeHtml(pair.label) + '</b>' +
        (pair.summaryImage ? '<em class="has-image">' + summaryContentHtml(pair) + '</em>' : '<em>' + escapeHtml(pair.summary) + '</em>') +
      '</article>';
    }).join("");
  }
  function renderColumnsBoard(){
    const board = byId("mtcMemoBoard");
    if(!board) return;
    const unmatched = state.visiblePairs.filter(pair => !state.matched.has(pair.id));
    const names = shuffle(unmatched);
    const summaries = shuffle(unmatched);
    board.innerHTML =
      '<div class="mtc-memo-columns">' +
        '<div class="mtc-memo-col memo-names-col" aria-label="Substances ou points">' + names.map(pair => {
          const kindClass = pair.kind === "pharma" ? " memo-pharma-name" : " memo-acu-name";
          return '<button type="button" class="mtc-memo-item memo-name' + kindClass + easyClass(pair) + '"' + easyAttrs(pair) + ' data-id="' + escapeHtml(pair.id) + '">' + escapeHtml(pair.label) + '</button>';
        }).join("") + '</div>' +
        '<div class="mtc-memo-col memo-summaries-col" aria-label="Synthèses">' + summaries.map(pair => (
          '<button type="button" class="mtc-memo-item memo-summary' + (pair.summaryImage ? " has-image" : "") + easyClass(pair) + '"' + easyAttrs(pair) + ' data-id="' + escapeHtml(pair.id) + '" data-summary-label="' + escapeHtml(pair.summaryLabel || "info") + '">' + summaryContentHtml(pair) + '</button>'
        )).join("") + '</div>' +
      '</div>' +
      '<div class="mtc-memo-found-zone" aria-live="polite">' +
        '<div class="mtc-memo-found-title">Paires trouvées</div>' +
        '<div id="mtcMemoFoundPairs" class="mtc-memo-found-pairs">' + renderFoundPairs() + '</div>' +
      '</div>';
  }
  function showMemoBravo(){
    const board = byId("mtcMemoBoard");
    if(!board || byId("mtcMemoWin")) return;
    board.insertAdjacentHTML("beforebegin", '<div id="mtcMemoWin" class="game-over-title bravo-punch mtc-memo-win">BRAVO !</div>');
  }
  function updateScore(){
    const score = byId("mtcMemoScore");
    if(score) score.textContent = state.matched.size + "/" + state.visiblePairs.length + " · " + state.attempts + (state.attempts > 1 ? " essais" : " essai");
    if(state.matched.size === state.visiblePairs.length && state.visiblePairs.length){
      showMemoBravo();
    }
  }
  function markWrong(elements){
    elements.filter(Boolean).forEach(el => el.classList.add("wrong"));
    window.setTimeout(() => elements.filter(Boolean).forEach(el => el.classList.remove("wrong", "selected")), 520);
  }
  function recordMatch(id){
    if(!id || state.matched.has(id)) return null;
    state.matchIndex += 1;
    const label = "paire " + state.matchIndex;
    const hue = (state.matchIndex * 47) % 360;
    state.matched.add(id);
    state.foundPairs.push({id, label, hue});
    const zone = byId("mtcMemoFoundPairs");
    const pair = state.visiblePairs.find(item => item.id === id);
    if(zone && pair){
      const summaryHtml = pair.summaryImage ? '<em class="has-image">' + summaryContentHtml(pair) + '</em>' : '<em>' + escapeHtml(pair.summary) + '</em>';
      zone.insertAdjacentHTML("beforeend", '<article class="mtc-memo-found-pair" data-found-id="' + escapeHtml(pair.id) + '" style="--memo-match-hue:' + String(hue) + '"><span class="mtc-memo-found-badge">' + escapeHtml(label) + '</span><b>' + escapeHtml(pair.label) + '</b>' + summaryHtml + '</article>');
    }
    resetMemoHint(null);
    saveSession();
    return {label, hue};
  }
  function applyMatchedVisual(elements, id){
    const result = recordMatch(id);
    if(!result) return;
    elements.filter(Boolean).forEach(el => {
      el.classList.add("matched");
      el.classList.remove("selected");
      el.setAttribute("data-match-label", result.label);
      el.style.setProperty("--memo-match-hue", String(result.hue));
      window.setTimeout(() => { if(el && el.parentNode) el.remove(); }, 120);
    });
  }
  function pickSlideCandidate(){
    const unmatched = state.visiblePairs.filter(pair => !state.matched.has(pair.id));
    if(!unmatched.length){ state.slideCurrentId = null; return null; }
    const still = unmatched.find(pair => pair.id === state.slideCurrentId);
    if(still) return still;
    const pick = unmatched[Math.floor(Math.random() * unmatched.length)];
    state.slideCurrentId = pick.id;
    return pick;
  }
  function renderSlideBoard(){
    const board = byId("mtcMemoBoard");
    if(!board) return;
    const current = pickSlideCandidate();
    if(!current){
      board.innerHTML = '<div class="mtc-memo-found-zone" aria-live="polite">' +
        '<div class="mtc-memo-found-title">Paires trouvées</div>' +
        '<div id="mtcMemoFoundPairs" class="mtc-memo-found-pairs">' + renderFoundPairs() + '</div>' +
      '</div>';
      return;
    }
    const unmatched = state.visiblePairs.filter(pair => !state.matched.has(pair.id));
    const options = shuffle(unmatched);
    board.innerHTML =
      '<div class="mtc-memo-slide">' +
        '<div class="mtc-memo-slide-card' + (current.summaryImage ? " has-image" : "") + '">' + summaryContentHtml(current) + '</div>' +
        '<div class="mtc-memo-slide-options">' + options.map(pair => {
          const kindClass = pair.kind === "pharma" ? " memo-pharma-name" : " memo-acu-name";
          return '<button type="button" class="mtc-memo-item memo-name mtc-memo-slide-option' + kindClass + easyClass(pair) + '"' + easyAttrs(pair) + ' data-slide-answer="' + escapeHtml(pair.id) + '">' + escapeHtml(pair.label) + '</button>';
        }).join("") + '</div>' +
      '</div>' +
      '<div class="mtc-memo-found-zone" aria-live="polite">' +
        '<div class="mtc-memo-found-title">Paires trouvées</div>' +
        '<div id="mtcMemoFoundPairs" class="mtc-memo-found-pairs">' + renderFoundPairs() + '</div>' +
      '</div>';
  }
  function handleSlideClick(button){
    if(!button) return;
    const answerId = button.getAttribute("data-slide-answer");
    const current = state.visiblePairs.find(pair => pair.id === state.slideCurrentId);
    if(!current) return;
    state.attempts += 1;
    if(answerId === current.id){
      recordMatch(current.id);
      state.slideCurrentId = null;
      updateScore();
      renderSlideBoard();
    }else{
      markWrong([button]);
      updateScore();
      saveSession();
    }
  }
  function handleColumnsClick(button){
    if(!button || button.classList.contains("matched")) return;
    const id = button.getAttribute("data-id");
    if(state.hintTargetId !== id) resetMemoHint(id);
    if(button.classList.contains("memo-name")){
      document.querySelectorAll(".memo-name.selected").forEach(el => el.classList.remove("selected"));
      state.selectedName = button;
      button.classList.add("selected");
    }else{
      document.querySelectorAll(".memo-summary.selected").forEach(el => el.classList.remove("selected"));
      state.selectedSummary = button;
      button.classList.add("selected");
    }
    if(!state.selectedName || !state.selectedSummary) return;
    state.attempts += 1;
    const nameId = state.selectedName.getAttribute("data-id");
    const summaryId = state.selectedSummary.getAttribute("data-id");
    if(nameId && nameId === summaryId) applyMatchedVisual([state.selectedName, state.selectedSummary], nameId);
    else markWrong([state.selectedName, state.selectedSummary]);
    state.selectedName = null;
    state.selectedSummary = null;
    updateScore();
    saveSession();
  }
  function restartMemo(){
    state.matched = new Set();
    state.attempts = 0;
    state.matchIndex = 0;
    state.foundPairs = [];
    state.slideCurrentId = null;
    state.selectedName = null;
    state.selectedSummary = null;
    resetMemoHint(null);
    clearSession();
    saveSession();
    renderMemoGame();
  }
  function editSyntheses(){ renderSynthPrompt(state.pairs); }
  function toggleEasyMode(){
    state.easyMode = !state.easyMode;
    state.selectedName = null;
    state.selectedSummary = null;
    resetMemoHint(null);
    saveSession();
    renderMemoGame();
  }
  function handleAction(action, button){
    if(action === "close") closeMemo();
    else if(action === "save-synth") saveSynthesesAndLaunch();
    else if(action === "restart") restartMemo();
    else if(action === "edit-synth") editSyntheses();
    else if(action === "hint") revealMemoHint();
    else if(action === "toggle-easy") toggleEasyMode();
    else if(action === "open") openMemo();
    else if(action === "choose-mode") chooseMatchMode(button && button.getAttribute("data-mode"));
    else if(action === "reset-memo-images") resetMemoSafeImages();
  }
  function ensureMemoButton(){
    if(!isFinished()) return;
    let wrap = byId("mtcReplaySameGridWrap");
    const messageEl = byId("message");
    if(!wrap && messageEl){
      wrap = document.createElement("div");
      wrap.id = "mtcReplaySameGridWrap";
      messageEl.insertAdjacentElement("afterend", wrap);
    }
    if(!wrap || byId("mtcMemoStartButton")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "mtcMemoStartButton";
    btn.title = "Lancer le mémo avec cette grille";
    btn.innerHTML = '<span aria-hidden="true">⚔︎</span><span class="mtc-replay-label">mémo</span>';
    btn.addEventListener("click", event => {
      event.preventDefault();
      openMemo();
    });
    wrap.appendChild(btn);
  }
  function removeMemoButtonIfNeeded(){ if(!isFinished()) byId("mtcMemoStartButton")?.remove(); }
  function install(){
    applySavedAcuSyntheses();
    state.matchMode = loadMatchMode();
    document.addEventListener("click", event => {
      const actionButton = event.target && event.target.closest ? event.target.closest("[data-memo-action]") : null;
      if(actionButton){
        event.preventDefault();
        if(actionButton.disabled) return;
        handleAction(actionButton.getAttribute("data-memo-action"), actionButton);
        return;
      }
      const slideOption = event.target && event.target.closest ? event.target.closest("[data-slide-answer]") : null;
      if(slideOption){
        event.preventDefault();
        handleSlideClick(slideOption);
        return;
      }
      const columnItem = event.target && event.target.closest ? event.target.closest(".mtc-memo-item") : null;
      if(columnItem){
        event.preventDefault();
        handleColumnsClick(columnItem);
      }
    }, true);

    state.observer = new MutationObserver(() => {
      ensureMemoButton();
      removeMemoButtonIfNeeded();
    });
    state.observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
    window.setTimeout(ensureMemoButton, 400);
    window.MTCMemoTest = {open:openMemo, close:closeMemo, capture:capturePairs, state:state, save:saveSession};
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();

