/* === PHARMA Bucket 3 : jeu jouable v1 ===
   Mécanique : regrouper les substances par classe.
   - exactement 4 catégories par grille ;
   - groupes variables de 2 à 4 substances ;
   - validation automatique quand la classe active est complète ;
   - compteur n/N de la classe active uniquement ;
   - si on clique une autre classe, la sélection précédente est réinitialisée ;
   - le moteur ACU est conservé et seulement routé via newGame(). */
(function(){
  "use strict";

  const PHARMA_CATEGORY_COUNT = 4;
  const MIN_HERBS_PER_CLASS = 2;
  const MAX_HERBS_PER_CLASS = 4;
  const SHOW_COMMON_NAME_STORAGE_KEY = "mtc_pharma_show_common_name_hover";
  const SHOW_SOLVED_NATURE_STORAGE_KEY = "mtc_pharma_show_solved_nature";
  const SHOW_SOLVED_TROPISM_STORAGE_KEY = "mtc_pharma_show_solved_tropism";
  const SHOW_SOLVED_TOXICITY_STORAGE_KEY = "mtc_pharma_show_solved_toxicity";
  const PRIORITY_MODE_STORAGE_KEY = "mtc_pharma_priority_mode_v1";
  const MANUAL_CLASSES_STORAGE_KEY = "mtc_pharma_manual_classes_v1";

  const pharmaState = {
    originalNewGame:null,
    originalToggleManualMode:null,
    originalToggleManualChecklist:null,
    originalToggleSettings:null,
    board:[],
    groups:[],
    activeClassCode:null,
    selectedIds:[],
    solvedClassCodes:new Set(),
    running:false
  };

  function isPharmaDomain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){
    return document.getElementById(id);
  }

  function shuffle(array){
    const copy = Array.isArray(array) ? array.slice() : [];
    for(let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function titleCasePinyin(value){
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1).toLocaleLowerCase("fr-FR"))
      .join(" ");
  }

  function getHerbLabel(herb){
    return titleCasePinyin(herb?.pinyin || herb?.pinyinSansTons || herb?.nom || herb?.code || herb?.id || "");
  }

  function getHerbCommonName(herb){
    return herb?.nom || "";
  }

  function normalizeText(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDisplayText(value){
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\s*\n\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getNatureInfo(herb){
    const rawNature = herb?.nature || "";
    const nature = normalizeText(rawNature);

    const tiers = [
      {key:"hot", tests:["tres chaud", "chaud"], color:"#d7191c", bg:"rgba(215,25,28,.20)"},
      {key:"warm", tests:["tiede", "tiede ", "tiede,"], color:"#f07c24", bg:"rgba(240,124,36,.20)"},
      {key:"slightly-warm", tests:["legerement tiede", "legerement chaud"], color:"#fdae61", bg:"rgba(253,174,97,.20)"},
      {key:"neutral", tests:["neutre", "equilibre", "equilibree", "equilibre"], color:"#d6c27a", bg:"rgba(214,194,122,.20)"},
      {key:"slightly-cool", tests:["legerement fraiche", "legerement frais"], color:"#abd9e9", bg:"rgba(171,217,233,.22)"},
      {key:"cool", tests:["fraiche", "frais"], color:"#5bb6d6", bg:"rgba(91,182,214,.22)"},
      {key:"slightly-cold", tests:["legerement froid", "legerement froide"], color:"#5e88d1", bg:"rgba(94,136,209,.22)"},
      {key:"cold", tests:["froid", "froide"], color:"#2c54a2", bg:"rgba(44,84,162,.23)"}
    ];

    // Les mentions "légèrement" doivent primer sur les termes simples.
    const priority = [
      "slightly-warm",
      "slightly-cool",
      "slightly-cold",
      "hot",
      "warm",
      "neutral",
      "cool",
      "cold"
    ];

    for(const key of priority){
      const tier = tiers.find(item => item.key === key);
      if(tier && tier.tests.some(test => nature.includes(test))){
        return {
          key:tier.key,
          color:tier.color,
          bg:tier.bg,
          label:rawNature
        };
      }
    }

    return {key:"unknown", color:"", bg:"", label:rawNature};
  }

  function getPharmaDisplayField(field, herb, fallback){
    if(typeof window.getPharmaDisplayFieldLabels === "function"){
      return window.getPharmaDisplayFieldLabels(field, herb, fallback);
    }
    if(typeof window.getPharmaFieldTokenLabels === "function"){
      const labels = window.getPharmaFieldTokenLabels(field, herb);
      if(Array.isArray(labels) && labels.length){
        return labels.join(", ");
      }
    }
    return normalizeDisplayText(fallback || "");
  }

  function getToxicityLabel(herb){
    return getPharmaDisplayField("toxicity", herb, "");
  }

  function getClassSizeForBoard(pharmaClass){
    const count = Number(pharmaClass?.count || 0);
    if(count < MIN_HERBS_PER_CLASS) return 0;
    return Math.min(MAX_HERBS_PER_CLASS, count);
  }

  function getClassPool(){
    const classes = typeof window.getPharmaPlayableClasses === "function"
      ? window.getPharmaPlayableClasses()
      : (Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : []);

    return classes.filter(item => item && getClassSizeForBoard(item) >= MIN_HERBS_PER_CLASS);
  }

  function findClassCombination(){
    const context = getSelectionContext();
    let classPool = getClassPool();

    if(context.mode === "manual"){
      const selectedCodes = new Set(context.manualClassCodes || []);

      if(selectedCodes.size < PHARMA_CATEGORY_COUNT){
        const message = byId("message");
        if(message) message.textContent = "Choisis au moins 4 classes.";
        return [];
      }

      classPool = classPool.filter(pharmaClass => selectedCodes.has(String(pharmaClass.code)));

      if(classPool.length < PHARMA_CATEGORY_COUNT){
        const message = byId("message");
        if(message) message.textContent = "Choisis au moins 4 classes jouables.";
        return [];
      }
    }

    return classPool
      .map(pharmaClass => ({
        pharmaClass,
        score:weightedClassScore(pharmaClass, context)
      }))
      .sort((a,b) => b.score - a.score)
      .slice(0, PHARMA_CATEGORY_COUNT)
      .map(item => item.pharmaClass);
  }

  function pickHerbsForClass(pharmaClass){
    const herbs = typeof window.getPharmaHerbsByClass === "function"
      ? window.getPharmaHerbsByClass(pharmaClass.code)
      : (window.PHARMA_HERBS || []).filter(item => item.classCode === pharmaClass.code);

    const context = getSelectionContext();
    const size = getClassSizeForBoard(pharmaClass);

    return sortHerbsForContext(herbs, context).slice(0, size);
  }

  function buildPharmaSolution(){
    const chosenClasses = findClassCombination();

    return chosenClasses.map((pharmaClass, index) => {
      const herbs = pickHerbsForClass(pharmaClass);
      return {
        key:pharmaClass.code,
        name:pharmaClass.nom,
        classCode:pharmaClass.code,
        herbs,
        herbIds:herbs.map(item => item.id),
        size:herbs.length,
        solved:false,
        color:Array.isArray(window.CATEGORY_COLORS)
          ? window.CATEGORY_COLORS[index % window.CATEGORY_COLORS.length]
          : "var(--shadow-color)"
      };
    }).filter(group => group.herbs.length > 0);
  }

  function getGroupForHerbId(herbId){
    return pharmaState.groups.find(group => group.herbIds.includes(herbId)) || null;
  }

  function getHerbById(herbId){
    return pharmaState.board.find(item => item.id === herbId) || null;
  }

  function getActiveGroup(){
    if(!pharmaState.activeClassCode) return null;
    return pharmaState.groups.find(group => group.classCode === pharmaState.activeClassCode && !group.solved) || null;
  }

  function shakePharmaElement(element){
    if(!element) return;
    element.classList.remove("shake");
    // Force le redémarrage de l’animation si l’erreur arrive deux fois sur la même tuile.
    void element.offsetWidth;
    element.classList.add("shake");
    setTimeout(() => element.classList.remove("shake"), 380);
  }

  const PHARMA_CHEER_SIGNS = ["•‿•", "ᵕ̈", "◝(ᵔᗜᵔ)◜", "☻️"];

  function pharmaCheerSign(){
    return PHARMA_CHEER_SIGNS[Math.floor(Math.random() * PHARMA_CHEER_SIGNS.length)];
  }

  function pharmaGoodChoiceMessage(label){
    return `${label} ${pharmaCheerSign()}`;
  }

  function getRemainingPharmaTiles(){
    return [...document.querySelectorAll("#grid .tile")];
  }

  function isLastUnsolvedGroup(group){
    if(!group || group.solved) return false;
    const remainingGroups = pharmaState.groups.filter(item => !item.solved);
    const remainingTiles = getRemainingPharmaTiles();
    return remainingGroups.length === 1 && remainingGroups[0] === group && remainingTiles.length === group.size;
  }

  function clearPharmaFinalGuess(){
    const finalGuess = byId("finalGuess");
    const finalGuessChoices = byId("finalGuessChoices");
    if(finalGuess){
      finalGuess.classList.remove("pharma-final-guess-visible");
      finalGuess.style.setProperty("display", "none", "important");
      finalGuess.dataset.correctKey = "";
    }
    if(finalGuessChoices) finalGuessChoices.innerHTML = "";
  }

  function clearPharmaSelection(){
    document.querySelectorAll("#grid .tile.selected").forEach(tile => {
      tile.classList.remove("selected");
      tile.style.filter = "";
      tile.style.color = "";
      tile.style.opacity = "";
    });

    pharmaState.activeClassCode = null;
    pharmaState.selectedIds = [];
    updatePharmaCounter();
  }

  function updatePharmaCounter(){
    const message = byId("message");
    if(!message || !isPharmaDomain()) return;

    const group = getActiveGroup();
    if(!group){
      message.textContent = "";
      return;
    }

    message.textContent = `${pharmaState.selectedIds.length}/${group.size}`;
  }
  function getBooleanSetting(storageKey, fallback){
    try{
      const value = localStorage.getItem(storageKey);
      if(value === null) return Boolean(fallback);
      return value === "1";
    }catch(error){
      return Boolean(fallback);
    }
  }

  function setBooleanSetting(storageKey, value){
    try{
      localStorage.setItem(storageKey, value ? "1" : "0");
    }catch(error){
      /* Le réglage reste simplement non mémorisé si localStorage est indisponible. */
    }

    syncPharmaDisplaySettings();
  }

  function getCommonNameHoverSetting(){
    return getBooleanSetting(SHOW_COMMON_NAME_STORAGE_KEY, false);
  }

  function setCommonNameHoverSetting(value){
    setBooleanSetting(SHOW_COMMON_NAME_STORAGE_KEY, value);
  }

  function getModeToggleElement(){
    return byId("modeToggle");
  }

  function isManualMode(){
    const toggle = getModeToggleElement();
    return Boolean(toggle && toggle.checked);
  }

  function normalizePriorityMode(value){
    return value === "essential" ? "essential" : "all";
  }

  function getPharmaPriorityMode(){
    try{
      return normalizePriorityMode(localStorage.getItem(PRIORITY_MODE_STORAGE_KEY));
    }catch(error){
      return "all";
    }
  }

  function setPharmaPriorityMode(mode, options = {}){
    const cleanMode = normalizePriorityMode(mode);

    try{
      localStorage.setItem(PRIORITY_MODE_STORAGE_KEY, cleanMode);
    }catch(error){
      /* Réglage non persistant si localStorage est indisponible. */
    }

    syncPharmaManualPriorityUI();

    const shouldReload =
      options.reload !== false &&
      isPharmaDomain() &&
      isManualMode() &&
      pharmaState.running;

    if(shouldReload){
      setTimeout(startPharmaGame, 0);
    }
  }

  function getManualClassCodes(){
    try{
      const parsed = JSON.parse(localStorage.getItem(MANUAL_CLASSES_STORAGE_KEY) || "[]");
      if(!Array.isArray(parsed)) return [];
      return parsed.map(String).filter(Boolean);
    }catch(error){
      return [];
    }
  }

  function setManualClassCodes(codes, options = {}){
    const cleanCodes = Array.from(new Set((codes || []).map(String).filter(Boolean)));

    try{
      localStorage.setItem(MANUAL_CLASSES_STORAGE_KEY, JSON.stringify(cleanCodes));
    }catch(error){
      /* Réglage non persistant si localStorage est indisponible. */
    }

    if(options.reload !== false && isPharmaDomain() && isManualMode() && pharmaState.running){
      setTimeout(startPharmaGame, 0);
    }
  }

  function getManualClassSelectionSet(){
    return new Set(getManualClassCodes());
  }

  function getEssentialIdSet(){
    if(typeof window.getPharmaEssentialIds === "function"){
      return new Set(window.getPharmaEssentialIds().map(String));
    }

    return new Set((Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .filter(herb => herb && herb.prioritaire)
      .map(herb => String(herb.id)));
  }

  function isEssentialHerb(herb){
    if(!herb) return false;
    return getEssentialIdSet().has(String(herb.id));
  }

  function getPharmaAutoMode(){
    if(typeof window.getAutoPracticeMode === "function"){
      return window.getAutoPracticeMode();
    }

    return "balanced";
  }

  function getSelectionContext(){
    if(isManualMode()){
      return {
        mode:"manual",
        priority:getPharmaPriorityMode(),
        manualClassCodes:getManualClassCodes()
      };
    }

    return {
      mode:"auto",
      priority:getPharmaAutoMode(),
      manualClassCodes:[]
    };
  }

  function weightedClassScore(pharmaClass, context){
    const herbs = typeof window.getPharmaHerbsByClass === "function"
      ? window.getPharmaHerbsByClass(pharmaClass.code)
      : (window.PHARMA_HERBS || []).filter(item => item.classCode === pharmaClass.code);

    const essentialIds = getEssentialIdSet();
    const essentialCount = herbs.filter(herb => essentialIds.has(String(herb.id))).length;
    const totalCount = herbs.length || 1;
    const essentialRatio = essentialCount / totalCount;
    let score = Math.random();

    if(context.mode === "manual" && context.priority === "essential"){
      // Priorité forte, mais non exclusive : les classes sans essentielles peuvent encore compléter la grille.
      score += essentialCount > 0 ? 4 : 0;
      score += Math.min(essentialCount, 4) * 1.5;
      score += essentialRatio;
      if(typeof window.getPharmaAdaptiveClassBonus === "function"){
        score += Number(window.getPharmaAdaptiveClassBonus(pharmaClass, context) || 0);
      }
      return score;
    }

    if(context.mode === "auto"){
      // En auto, le slider Facile/Mixte/Difficile prend le relais.
      // Sans stats PHARMA détaillées pour l'instant, on utilise les essentielles comme proxy doux de facilité.
      if(context.priority === "easy"){
        score += essentialCount > 0 ? 2.2 : 0;
        score += essentialRatio;
      }else if(context.priority === "hard"){
        score += essentialCount === 0 ? 1.2 : 0;
        score += (1 - essentialRatio) * .8;
      }else{
        score += essentialRatio * .4;
      }
    }

    if(typeof window.getPharmaAdaptiveClassBonus === "function"){
      score += Number(window.getPharmaAdaptiveClassBonus(pharmaClass, context) || 0);
    }

    return score;
  }

  function sortHerbsForContext(herbs, context){
    const shuffled = shuffle(herbs);

    if(context.mode === "manual" && context.priority === "essential"){
      const essentialIds = getEssentialIdSet();
      const essential = shuffle(shuffled.filter(herb => essentialIds.has(String(herb.id))));
      const others = shuffle(shuffled.filter(herb => !essentialIds.has(String(herb.id))));
      return essential.concat(others);
    }

    if(context.mode === "auto"){
      const essentialIds = getEssentialIdSet();
      const essential = shuffle(shuffled.filter(herb => essentialIds.has(String(herb.id))));
      const others = shuffle(shuffled.filter(herb => !essentialIds.has(String(herb.id))));

      if(context.priority === "easy"){
        return essential.concat(others);
      }

      if(context.priority === "hard"){
        return others.concat(essential);
      }

      const mixed = [];
      while(essential.length || others.length){
        if(essential.length && Math.random() < .5) mixed.push(essential.pop());
        if(others.length) mixed.push(others.pop());
        if(essential.length && !mixed.includes(essential[essential.length - 1]) && Math.random() < .35) mixed.push(essential.pop());
      }
      return mixed;
    }

    return shuffled;
  }

  function syncCheckbox(id, enabled){
    const checkbox = byId(id);
    if(checkbox) checkbox.checked = enabled;
  }

  function toggleClassOnRoot(className, enabled){
    document.documentElement.classList.toggle(className, enabled);
    document.body?.classList.toggle(className, enabled);
  }

  function syncPharmaDisplaySettings(){
    const showCommonName = getBooleanSetting(SHOW_COMMON_NAME_STORAGE_KEY, false);

    toggleClassOnRoot("pharma-show-common-name", showCommonName);

    // Les anciens réglages “tuiles validées : nature / tropismes / toxicité” ont été retirés
    // du menu Affichage. On force donc leur désactivation même si une ancienne valeur
    // localStorage existe encore dans le navigateur.
    toggleClassOnRoot("pharma-show-solved-nature", false);
    toggleClassOnRoot("pharma-show-solved-tropism", false);
    toggleClassOnRoot("pharma-show-solved-toxicity", false);

    syncCheckbox("pharmaShowCommonNameToggle", showCommonName);

    updatePharmaDisplayControlVisibility();
  }


  function renderPharmaTile(herb){
    const tile = document.createElement("div");
    tile.className = "tile pharma-tile";
    tile.dataset.herbId = herb.id;
    tile.dataset.classCode = herb.classCode;

    const commonName = getHerbCommonName(herb);
    tile.innerHTML = `
      <span class="pharma-tile-label">${escapeHtml(getHerbLabel(herb))}</span>
      ${commonName ? `<span class="pharma-common-tooltip">${escapeHtml(commonName)}</span>` : ""}
    `;

    tile.addEventListener("click", () => handlePharmaTileClick(tile, herb.id));
    return tile;
  }

  function renderPharmaSolvedGroup(group){
    const solved = byId("solved");
    if(!solved) return;

    const row = document.createElement("div");
    row.className = "solved-row pharma-solved-row";

    const title = document.createElement("div");
    title.className = "solved-title";
    title.textContent = group.name;

    const points = document.createElement("div");
    points.className = "solved-points";

    group.herbs.forEach(herb => {
      const item = document.createElement("div");
      item.className = "solved-point pharma-solved-point";
      item.dataset.herbId = herb.id;

      const natureInfo = getNatureInfo(herb);
      if(natureInfo.key && natureInfo.key !== "unknown"){
        item.dataset.pharmaNatureTier = natureInfo.key;
        item.style.setProperty("--pharma-nature-color", natureInfo.color);
        item.style.setProperty("--pharma-nature-bg", natureInfo.bg);
      }

      const toxicityLabel = getToxicityLabel(herb);
      if(toxicityLabel){
        item.dataset.pharmaToxic = "1";
      }

      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("title", "Ouvrir la fiche");

      const openHerbPanel = () => {
        if(typeof window.openPharmaHerbPanel === "function"){
          window.openPharmaHerbPanel(herb.id);
        }
      };

      item.addEventListener("click", openHerbPanel);
      item.addEventListener("keydown", event => {
        if(event.key === "Enter" || event.key === " "){
          event.preventDefault();
          openHerbPanel();
        }
      });

      const commonName = getHerbCommonName(herb);
      const tropism = getPharmaDisplayField("tropism", herb, herb.tropisme);
      const toxicity = getToxicityLabel(herb);
      const esprit = String(
        (typeof window.getPharmaHerbEsprit === "function" ? window.getPharmaHerbEsprit(herb.id) : "")
        || herb.esprit
        || ""
      ).trim();

      item.innerHTML = `
        <span class="pharma-solved-chinese-name">${escapeHtml(getHerbLabel(herb))}</span>
        ${commonName ? `<small class="pharma-solved-common-name">${escapeHtml(commonName)}</small>` : ""}
        ${tropism ? `<small class="pharma-solved-tropism">${escapeHtml(tropism)}</small>` : ""}
        ${toxicity ? `<small class="pharma-solved-toxicity">${escapeHtml(toxicity)}</small>` : ""}
        ${esprit ? `<span class="pharma-solved-esprit-tooltip">${escapeHtml(esprit)}</span>` : ""}
      `;
      points.appendChild(item);
    });

    row.appendChild(title);
    row.appendChild(points);
    solved.appendChild(row);
  }

  function solvePharmaGroup(group){
    if(!group || group.solved) return;

    group.solved = true;
    pharmaState.solvedClassCodes.add(group.classCode);

    group.herbIds.forEach(herbId => {
      const tile = document.querySelector(`#grid .tile[data-herb-id="${CSS.escape(herbId)}"]`);
      if(tile){
        tile.classList.add("pharma-solved-fade");
        setTimeout(() => tile.remove(), 120);
      }
    });

    renderPharmaSolvedGroup(group);

    const message = byId("message");
    if(message){
      message.textContent = pharmaGoodChoiceMessage("Classe trouvée !");
    }

    if(typeof window.onPharmaClassSolved === "function"){
      window.onPharmaClassSolved(group);
    }

    pharmaState.activeClassCode = null;
    pharmaState.selectedIds = [];
    updatePharmaCounter();

    if(pharmaState.groups.every(item => item.solved)){
      if(typeof window.onPharmaGameWon === "function"){
        window.onPharmaGameWon();
      }else{
        const message = byId("message");
        if(message) message.textContent = "✓";
        document.body.classList.add("game-complete");
      }
      return;
    }

    // Comme côté ACU : dès qu’il ne reste plus que la dernière classe,
    // on ne demande plus de sélectionner les dernières tuiles. On affiche
    // directement la devinette de catégorie/classe.
    setTimeout(() => {
      const remainingGroups = pharmaState.groups.filter(item => !item.solved);
      const remainingTiles = getRemainingPharmaTiles();
      if(remainingGroups.length === 1 && remainingTiles.length === remainingGroups[0].size){
        preparePharmaFinalGuess(remainingGroups[0]);
      }
    }, 170);
  }

  function preparePharmaFinalGuess(group){
    if(!group || group.solved) return;

    const finalGuess = byId("finalGuess");
    const finalGuessText = byId("finalGuessText");
    const finalGuessChoices = byId("finalGuessChoices");
    const message = byId("message");

    if(!finalGuess || !finalGuessText || !finalGuessChoices) return;

    clearPharmaSelection();

    finalGuess.classList.add("pharma-final-guess-visible");
    finalGuess.style.setProperty("display", "block", "important");
    finalGuess.dataset.correctKey = group.key;
    finalGuessText.textContent = "Devine la dernière classe !";
    finalGuessChoices.innerHTML = "";

    const currentGameKeys = pharmaState.groups.map(item => String(item.key));
    const pool = getClassPool()
      .filter(item => item && !currentGameKeys.includes(String(item.code)));

    const wrongOptions = shuffle(pool).slice(0, 3).map(item => ({
      key:String(item.code),
      name:item.nom || item.code
    }));

    const options = shuffle([
      {key:String(group.key), name:group.name},
      ...wrongOptions
    ]);

    options.forEach(option => {
      const button = document.createElement("button");
      button.className = "final-choice";
      button.type = "button";
      button.textContent = option.name;
      button.addEventListener("click", () => checkPharmaFinalGuess(option.key, button));
      finalGuessChoices.appendChild(button);
    });

    if(message){
      message.textContent = "Dernière étape : les dernières substances ne sont pas validées automatiquement. Devine leur classe avec les choix proposés.";
    }
  }

  function checkPharmaFinalGuess(chosenKey, button){
    if(!isPharmaDomain()) return;

    const finalGuess = byId("finalGuess");
    const message = byId("message");
    const correctKey = finalGuess ? String(finalGuess.dataset.correctKey || "") : "";

    if(!correctKey){
      if(message) message.textContent = "Aucune dernière classe à valider.";
      return;
    }

    if(String(chosenKey) !== correctKey){
      shakePharmaElement(button);

      const shouldContinue = typeof window.onPharmaMistake === "function"
        ? window.onPharmaMistake({
            activeClassCode:correctKey,
            clickedClassCode:String(chosenKey || ""),
            clickedHerbId:"",
            selectedIds:pharmaState.selectedIds.slice(),
            reason:"final-guess"
          })
        : true;

      if(shouldContinue !== false && message && !message.textContent){
        message.textContent = "Ce n’est pas la bonne classe.";
      }

      return;
    }

    const group = pharmaState.groups.find(item => String(item.key) === correctKey);
    if(!group){
      if(message) message.textContent = "Erreur : classe introuvable.";
      return;
    }

    clearPharmaFinalGuess();
    group._solvedBy = "final";
    solvePharmaGroup(group);
  }

  function handlePharmaTileClick(tile, herbId){
    if(!isPharmaDomain()) return;

    const finalGuess = byId("finalGuess");
    if(finalGuess && finalGuess.dataset.correctKey){
      const message = byId("message");
      if(message) message.textContent = "Dernière étape : devine la classe avec les choix proposés.";
      return;
    }

    const group = getGroupForHerbId(herbId);
    if(!group || group.solved) return;

    const isDifferentActiveClass =
      pharmaState.activeClassCode &&
      pharmaState.activeClassCode !== group.classCode;

    if(isDifferentActiveClass){
      shakePharmaElement(tile);

      const shouldContinue = typeof window.onPharmaMistake === "function"
        ? window.onPharmaMistake({
            activeClassCode:pharmaState.activeClassCode,
            clickedClassCode:group.classCode,
            clickedHerbId:herbId,
            selectedIds:pharmaState.selectedIds.slice(),
            reason:"wrong-class"
          })
        : true;

      // Comme côté ACU : la tuile incompatible secoue, mais ne remplace pas la sélection en cours.
      // La classe déjà commencée reste donc lisible et la mauvaise tuile n’est pas sélectionnée.
      if(shouldContinue !== false) updatePharmaCounter();
      return;
    }

    pharmaState.activeClassCode = group.classCode;

    if(tile.classList.contains("selected")){
      tile.classList.remove("selected");
      pharmaState.selectedIds = pharmaState.selectedIds.filter(id => id !== herbId);

      if(pharmaState.selectedIds.length === 0){
        pharmaState.activeClassCode = null;
      }

      updatePharmaCounter();
      return;
    }

    tile.classList.add("selected");

    if(!pharmaState.selectedIds.includes(herbId)){
      pharmaState.selectedIds.push(herbId);
    }

    updatePharmaCounter();

    if(pharmaState.selectedIds.length === group.size){
      setTimeout(() => {
        const stillComplete =
          pharmaState.activeClassCode === group.classCode &&
          group.herbIds.every(id => pharmaState.selectedIds.includes(id));

        if(!stillComplete) return;

        if(isLastUnsolvedGroup(group)){
          preparePharmaFinalGuess(group);
          return;
        }

        solvePharmaGroup(group);
      }, 180);
    }
  }

  function closeAcupuncturePanelsForPharma(){
    document.querySelectorAll(".open").forEach(element => element.classList.remove("open"));
    document.body.classList.remove("panel-open", "game-finished", "game-complete");
  }

  function startPharmaGame(){
    if(!Array.isArray(window.PHARMA_HERBS) || !Array.isArray(window.PHARMA_CLASSES)){
      const message = byId("message");
      if(message) message.textContent = "Données PHARMA indisponibles.";
      return;
    }

    closeAcupuncturePanelsForPharma();

    const message = byId("message");
    const hint = byId("hint");
    const solved = byId("solved");
    const grid = byId("grid");
    const finalGuess = byId("finalGuess");
    const finalGuessChoices = byId("finalGuessChoices");
    const manualControls = byId("manualControls");
    const manualEditButton = byId("manualEditButton");

    if(message) message.textContent = "";
    if(hint) hint.textContent = "";
    if(solved) solved.innerHTML = "";
    if(grid) grid.innerHTML = "";
    if(finalGuess){
      finalGuess.classList.remove("pharma-final-guess-visible");
      finalGuess.style.setProperty("display", "none", "important");
      finalGuess.dataset.correctKey = "";
    }
    if(finalGuessChoices) finalGuessChoices.innerHTML = "";
    if(manualControls) manualControls.style.display = "none";
    if(manualEditButton) manualEditButton.style.display = "none";
    syncPharmaManualControls();

    pharmaState.groups = buildPharmaSolution();
    pharmaState.board = shuffle(pharmaState.groups.flatMap(group => group.herbs));
    pharmaState.activeClassCode = null;
    pharmaState.selectedIds = [];
    pharmaState.solvedClassCodes = new Set();
    pharmaState.running = true;

    if(!grid || pharmaState.groups.length !== PHARMA_CATEGORY_COUNT || pharmaState.board.length === 0){
      if(message && !message.textContent) message.textContent = "Erreur PHARMA.";
      return;
    }

    if(typeof window.resetPharmaLivesHints === "function"){
      window.resetPharmaLivesHints();
    }

    if(typeof window.onPharmaGameStarted === "function"){
      window.onPharmaGameStarted(pharmaState.groups, pharmaState.board);
    }

    pharmaState.board.forEach(herb => {
      grid.appendChild(renderPharmaTile(herb));
    });

  }

  function leavePharmaMode(){
    // Toujours nettoyer l’interface PHARMA, même si une partie PHARMA n’était pas encore lancée.
    // Sinon les classes CSS / contrôles PHARMA peuvent rester visibles côté ACU.
    pharmaState.running = false;
    pharmaState.board = [];
    pharmaState.groups = [];
    pharmaState.activeClassCode = null;
    pharmaState.selectedIds = [];
    pharmaState.solvedClassCodes = new Set();
    hidePharmaManualControls();
  }

  function routeNewGame(){
    if(isPharmaDomain()){
      startPharmaGame();
      return;
    }

    leavePharmaMode();

    if(typeof pharmaState.originalNewGame === "function"){
      pharmaState.originalNewGame.apply(this, arguments);
    }
  }

  function syncPharmaManualPriorityUI(){
    const toggle = byId("pharmaPriorityToggle");
    const mode = getPharmaPriorityMode();

    if(toggle){
      toggle.checked = mode === "essential";
    }

    document.documentElement.classList.toggle("pharma-priority-essential", mode === "essential");
    document.body?.classList.toggle("pharma-priority-essential", mode === "essential");
  }

  function bindPharmaPriorityToggle(){
    const toggle = byId("pharmaPriorityToggle");
    if(!toggle || toggle.dataset.pharmaPriorityReady === "1") return;

    toggle.dataset.pharmaPriorityReady = "1";
    toggle.addEventListener("change", () => {
      setPharmaPriorityMode(toggle.checked ? "essential" : "all");
    });
  }

  function setPharmaManualPanelOpen(isOpen){
    document.documentElement.classList.toggle("pharma-manual-panel-open", !!isOpen);
    document.body?.classList.toggle("pharma-manual-panel-open", !!isOpen);

    const manualControls = byId("manualControls");
    const manualEditButton = byId("manualEditButton");

    if(manualControls){
      manualControls.style.display = isOpen ? "flex" : "none";
    }

    if(manualEditButton){
      manualEditButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      manualEditButton.classList.toggle("is-open", !!isOpen);
    }
  }

  function isPharmaManualPanelOpen(){
    return document.documentElement.classList.contains("pharma-manual-panel-open");
  }

  function ensurePharmaPriorityInlineControl(){
    let wrap = byId("pharmaPriorityInlineWrap");

    if(!wrap){
      const row = document.querySelector(".practice-row");
      const sliderWrap = byId("practiceDifficultySliderWrap");
      if(!row) return null;

      wrap = document.createElement("div");
      wrap.id = "pharmaPriorityInlineWrap";
      wrap.className = "mode-switch pharma-priority-switch pharma-priority-inline-wrap";
      wrap.setAttribute("aria-label", "Priorité du tirage PHARMA");
      wrap.innerHTML = `
        <span class="pharma-priority-title">Priorité:</span>
        <span>Toutes les SM</span>
        <label class="switch">
          <input id="pharmaPriorityToggle" type="checkbox">
          <span class="slider"></span>
        </label>
        <span>SM essentielles</span>
      `;

      if(sliderWrap && sliderWrap.parentElement === row){
        sliderWrap.insertAdjacentElement("afterend", wrap);
      }else{
        row.appendChild(wrap);
      }
    }

    syncPharmaManualPriorityUI();
    bindPharmaPriorityToggle();
    return wrap;
  }

  function updatePharmaManualClassHelp(){
    const manualHelp = byId("manualHelp");
    const manualChecklist = byId("manualChecklist");
    if(!manualHelp || !manualChecklist) return;

    const checkedCount = manualChecklist.querySelectorAll("input:checked").length;
    manualHelp.textContent = checkedCount < PHARMA_CATEGORY_COUNT
      ? "Choisis au moins 4 classes!"
      : "";
  }

  function preparePharmaManualPanel(){
    ensurePharmaPriorityInlineControl();
    renderPharmaManualClassChecklist();
    updatePharmaManualClassHelp();
  }

  function classSortLabel(item){
    return String(item?.nom || item?.code || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR");
  }

  function getManualPlayableClasses(){
    return getClassPool()
      .slice()
      .sort((a,b) => classSortLabel(a).localeCompare(classSortLabel(b), "fr"));
  }

  function renderPharmaManualClassChecklist(){
    const manualChecklist = byId("manualChecklist");
    if(!manualChecklist) return;

    const selectedCodes = getManualClassSelectionSet();
    manualChecklist.innerHTML = "";

    getManualPlayableClasses().forEach(pharmaClass => {
      const label = document.createElement("label");
      label.className = "manual-checkitem pharma-manual-class-checkitem";
      label.addEventListener("click", event => {
        event.stopPropagation();
      });

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = pharmaClass.code;
      checkbox.checked = selectedCodes.has(String(pharmaClass.code));
      label.classList.toggle("is-checked", checkbox.checked);

      checkbox.addEventListener("click", event => {
        event.stopPropagation();
      });

      checkbox.addEventListener("change", event => {
        event.stopPropagation();
        label.classList.toggle("is-checked", checkbox.checked);
        const checkedCodes = Array.from(manualChecklist.querySelectorAll("input:checked"))
          .map(input => input.value);
        setManualClassCodes(checkedCodes, {reload:false});
        updatePharmaManualClassHelp();
        setPharmaManualPanelOpen(true);
      });

      const codeSpan = document.createElement("span");
      codeSpan.className = "pharma-manual-class-code";
      codeSpan.textContent = pharmaClass.code;

      const separatorSpan = document.createElement("span");
      separatorSpan.className = "pharma-manual-class-separator";
      separatorSpan.textContent = " · ";

      const nameSpan = document.createElement("span");
      nameSpan.className = "pharma-manual-class-name";
      nameSpan.textContent = pharmaClass.nom;

      label.appendChild(checkbox);
      label.appendChild(codeSpan);
      label.appendChild(separatorSpan);
      label.appendChild(nameSpan);
      manualChecklist.appendChild(label);
    });
  }

  function renderPharmaManualControls(){
    const manualControls = byId("manualControls");
    const manualEditButton = byId("manualEditButton");

    document.documentElement.classList.add("pharma-manual-mode");
    document.body?.classList.add("pharma-manual-mode");

    if(manualEditButton){
      manualEditButton.style.display = "inline-block";
      manualEditButton.classList.add("pharma-manual-classes-toggle");
      manualEditButton.textContent = "CLASSES DE PHARMA";
      manualEditButton.setAttribute("aria-controls", "manualControls");
      manualEditButton.setAttribute("aria-expanded", "false");
      manualEditButton.classList.toggle("is-open", false);
    }

    preparePharmaManualPanel();

    if(manualControls){
      manualControls.style.display = "none";
    }
    setPharmaManualPanelOpen(false);
  }

  function togglePharmaManualClassPanel(){
    if(!isPharmaDomain() || !isManualMode()) return false;

    const nextOpen = !isPharmaManualPanelOpen();
    if(nextOpen){
      preparePharmaManualPanel();
    }
    setPharmaManualPanelOpen(nextOpen);
    return true;
  }

  function routeToggleManualChecklist(){
    if(togglePharmaManualClassPanel()) return;

    if(typeof pharmaState.originalToggleManualChecklist === "function"){
      pharmaState.originalToggleManualChecklist.apply(this, arguments);
    }
  }

  function hidePharmaManualControls(){
    const manualControls = byId("manualControls");
    const manualEditButton = byId("manualEditButton");
    const priorityWrap = byId("pharmaPriorityInlineWrap");

    document.documentElement.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");
    document.body?.classList.remove("pharma-manual-mode", "pharma-manual-panel-open", "pharma-priority-essential");

    if(priorityWrap) priorityWrap.style.display = "none";
    if(manualControls) manualControls.style.display = "none";
    if(manualEditButton){
      manualEditButton.style.display = "none";
      manualEditButton.textContent = "Catégories de points";
      manualEditButton.removeAttribute("aria-controls");
      manualEditButton.removeAttribute("aria-expanded");
    }
  }

  function syncPharmaManualControls(){
    if(!isPharmaDomain()){
      hidePharmaManualControls();
      return;
    }

    ensurePharmaPriorityInlineControl();

    if(isManualMode()){
      renderPharmaManualControls();
    }else{
      hidePharmaManualControls();
    }

    if(typeof window.updatePracticeModeSwitch === "function"){
      window.updatePracticeModeSwitch();
    }
  }

  function routeToggleManualMode(){
    if(isPharmaDomain()){
      syncPharmaManualControls();
      return;
    }

    if(typeof pharmaState.originalToggleManualMode === "function"){
      pharmaState.originalToggleManualMode.apply(this, arguments);
    }
  }

  function getSavedAcupunctureManualCategoryCount(){
    try{
      const parsed = JSON.parse(localStorage.getItem("mtc_manual_categories") || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean).length : 0;
    }catch(error){
      return 0;
    }
  }

  function clearBoardForDomainSwitch(){
    const message = byId("message");
    const hint = byId("hint");
    const solved = byId("solved");
    const grid = byId("grid");
    const finalGuess = byId("finalGuess");
    const finalGuessChoices = byId("finalGuessChoices");

    if(message) message.textContent = "";
    if(hint) hint.textContent = "";
    if(solved) solved.innerHTML = "";
    if(grid) grid.innerHTML = "";
    if(finalGuess){
      finalGuess.classList.remove("pharma-final-guess-visible");
      finalGuess.style.setProperty("display", "none", "important");
      finalGuess.dataset.correctKey = "";
    }
    if(finalGuessChoices) finalGuessChoices.innerHTML = "";
  }

  function restoreAcupunctureManualInterfaceAfterPharma(){
    const manualControls = byId("manualControls");
    const manualEditButton = byId("manualEditButton");
    const manualHelp = byId("manualHelp");

    if(manualEditButton){
      manualEditButton.textContent = "Catégories de points";
      manualEditButton.removeAttribute("aria-controls");
      manualEditButton.removeAttribute("aria-expanded");
    }

    if(manualHelp){
      manualHelp.textContent = "Choisis au moins 4 catégories!";
    }

    if(isManualMode() && typeof pharmaState.originalToggleManualMode === "function"){
      // Recharge la vraie liste ACU dans #manualChecklist, puis referme le panneau comme dans l’interface normale.
      pharmaState.originalToggleManualMode();
      if(manualControls) manualControls.style.display = "none";
      if(manualEditButton) manualEditButton.style.display = "inline-block";
    }else{
      if(manualControls) manualControls.style.display = "none";
      if(manualEditButton) manualEditButton.style.display = "none";
    }
  }

  function syncWithDomain(){
    if(isPharmaDomain()){
      startPharmaGame();
    }else{
      const wasRunning = pharmaState.running;
      leavePharmaMode();
      restoreAcupunctureManualInterfaceAfterPharma();

      if(wasRunning && typeof pharmaState.originalNewGame === "function"){
        if(isManualMode() && getSavedAcupunctureManualCategoryCount() < 4){
          // Pas de message d’erreur : on laisse simplement le bouton CATÉGORIES DE POINTS disponible.
          clearBoardForDomainSwitch();
          return;
        }

        pharmaState.originalNewGame();
      }
    }
  }

  function updatePharmaDisplayControlVisibility(){
    const shouldShow = isPharmaDomain();

    document
      .querySelectorAll("#settingsPanel .pharma-display-setting, #settingsPanel .pharma-common-name-setting")
      .forEach(label => {
        label.style.display = shouldShow ? "flex" : "none";
      });
  }

  function ensurePharmaDisplayControl(config){
    const panel = byId("settingsPanel");
    if(!panel) return null;

    const grid = panel.querySelector(".settings-grid") || panel;
    let checkbox = byId(config.id);
    let label = checkbox ? checkbox.closest("label") : null;

    if(!label){
      label = document.createElement("label");
      checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = config.id;

      const span = document.createElement("span");
      span.textContent = config.label;

      label.appendChild(span);
      label.appendChild(checkbox);
    }

    label.classList.add("pharma-display-setting");
    config.classes.forEach(className => label.classList.add(className));

    const span = label.querySelector("span");
    if(span) span.textContent = config.label;

    const firstNonPharmaLabel = Array.from(grid.children).find(child => {
      return child.tagName === "LABEL" && !child.classList.contains("pharma-display-setting");
    });

    if(label.parentElement !== grid){
      grid.insertBefore(label, firstNonPharmaLabel || grid.firstChild);
    }else if(firstNonPharmaLabel && Array.from(grid.children).indexOf(label) > Array.from(grid.children).indexOf(firstNonPharmaLabel)){
      grid.insertBefore(label, firstNonPharmaLabel);
    }

    return checkbox;
  }

  function ensurePharmaDisplayControls(){
    const controls = [
      {
        id:"pharmaShowCommonNameToggle",
        storageKey:SHOW_COMMON_NAME_STORAGE_KEY,
        label:"Tuiles non validées : nom commun au survol",
        classes:["pharma-common-name-setting"]
      }
    ];

    controls.forEach(config => {
      ensurePharmaDisplayControl(config);
      bindPharmaSettingToggle(config.id, config.storageKey);
    });

    syncPharmaDisplaySettings();
    updatePharmaDisplayControlVisibility();
  }

  function bindPharmaSettingToggle(id, storageKey){
    const checkbox = byId(id);
    if(!checkbox || checkbox.dataset.pharmaReady === "1") return;

    checkbox.dataset.pharmaReady = "1";
    checkbox.addEventListener("change", () => {
      setBooleanSetting(storageKey, checkbox.checked);
    });
  }

  function routeToggleSettings(){
    ensurePharmaDisplayControls();

    if(typeof pharmaState.originalToggleSettings === "function"){
      pharmaState.originalToggleSettings.apply(this, arguments);
    }

    ensurePharmaDisplayControls();
  }

  function initPharmaGameV1(){
    ensurePharmaDisplayControls();

    if(!pharmaState.originalToggleSettings && typeof window.toggleSettings === "function"){
      pharmaState.originalToggleSettings = window.toggleSettings;
      window.toggleSettings = routeToggleSettings;
    }

    if(!pharmaState.originalNewGame){
      pharmaState.originalNewGame = window.newGame;
      window.newGame = routeNewGame;
    }

    if(!pharmaState.originalToggleManualMode && typeof window.toggleManualMode === "function"){
      pharmaState.originalToggleManualMode = window.toggleManualMode;
      window.toggleManualMode = routeToggleManualMode;
    }


    if(!pharmaState.originalToggleManualChecklist && typeof window.toggleManualChecklist === "function"){
      pharmaState.originalToggleManualChecklist = window.toggleManualChecklist;
      window.toggleManualChecklist = routeToggleManualChecklist;
    }

    const observer = new MutationObserver(mutations => {
      if(mutations.some(item => item.attributeName === "data-study-domain")){
        ensurePharmaDisplayControls();
        syncWithDomain();
      }
    });

    observer.observe(document.documentElement, {attributes:true});

    document.addEventListener("pharma-essentials-changed", () => {
      syncPharmaManualPriorityUI();
      if(isPharmaDomain() && isManualMode() && getPharmaPriorityMode() === "essential" && pharmaState.running){
        startPharmaGame();
      }
    });

    syncPharmaManualPriorityUI();
    syncPharmaManualControls();

    if(isPharmaDomain()){
      startPharmaGame();
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initPharmaGameV1);
  }else{
    initPharmaGameV1();
  }

  function revealAllPharmaSolutions(){
    const grid = byId("grid");
    clearPharmaFinalGuess();
    pharmaState.groups.forEach(group => {
      if(!group.solved){
        group.solved = true;
        renderPharmaSolvedGroup(group);
      }
    });
    if(grid) grid.innerHTML = "";
    pharmaState.activeClassCode = null;
    pharmaState.selectedIds = [];
    pharmaState.running = false;
    updatePharmaCounter();
  }

  window.revealAllPharmaSolutions = revealAllPharmaSolutions;
  window.startPharmaGame = startPharmaGame;
  window.getPharmaManualClassCodes = getManualClassCodes;
  window.setPharmaManualClassCodes = setManualClassCodes;
  window.ensurePharmaDisplayControls = ensurePharmaDisplayControls;
  window.getPharmaPriorityMode = getPharmaPriorityMode;
  window.setPharmaPriorityMode = setPharmaPriorityMode;
  window.syncPharmaManualControls = syncPharmaManualControls;
  window.togglePharmaCommonNameHover = function(checked){
    setCommonNameHoverSetting(Boolean(checked));
  };
  window.syncPharmaDisplaySettings = syncPharmaDisplaySettings;
  window.getCurrentPharmaGameState = function(){
    return {
      board:pharmaState.board.slice(),
      groups:pharmaState.groups.map(group => ({
        key:group.key,
        name:group.name,
        size:group.size,
        solved:group.solved,
        herbIds:group.herbIds.slice()
      })),
      activeClassCode:pharmaState.activeClassCode,
      selectedIds:pharmaState.selectedIds.slice()
    };
  };
})();
