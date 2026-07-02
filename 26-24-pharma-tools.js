/* === PHARMA Bucket 7 : Recherche / Panier / Comparaison séparés ===
   Objectif : en mode PHARMA, les outils du footer travaillent sur les substances médicinales.
   ACU garde ses fonctions originales et ses stockages séparés. */
(function(){
  "use strict";

  const PHARMA_BASKET_KEY = "mtc_pharma_review_basket_v1";
  const PHARMA_COMPARISON_KEY = "mtc_pharma_comparison_slots_v1";
  const MAX_COMPARISON_SLOTS = 26;
  const SLOT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const HANZI_STORAGE_PREFIX = "mtc_pharma_herb_hanzi_";
  const ESPRIT_STORAGE_PREFIX = "mtc_pharma_herb_esprit_";
  const NOTES_STORAGE_PREFIX = "mtc_pharma_herb_notes_";
  const FORMULES_STORAGE_PREFIX = "mtc_pharma_herb_formules_";
  const PRECAUTION_STORAGE_PREFIX = "mtc_pharma_herb_precaution_";
  const SYNONYMES_STORAGE_PREFIX = "mtc_pharma_herb_synonymes_";
  const SYNTHESE_STORAGE_PREFIX = "mtc_pharma_herb_synthese_";
  const INGREDIENTS_STORAGE_PREFIX = "mtc_pharma_herb_ingredients_";
  const RECHERCHES_MODERNES_STORAGE_PREFIX = "mtc_pharma_herb_recherches_modernes_";
  const INDICATIONS_STORAGE_PREFIX = "mtc_pharma_herb_indications_";
  const CONTRE_INDICATIONS_STORAGE_PREFIX = "mtc_pharma_herb_contre_indications_";
  const PREPARATION_STORAGE_PREFIX = "mtc_pharma_herb_preparation_";
  const SEARCH_SCOPES = ["name", "synonymes", "class", "nature", "saveur", "toxicity", "tropism", "actions", "indications", "contre_indications", "preparation", "notes", "synthese", "ingredients", "recherches_modernes", "precautions", "formules"];
  let pendingPharmaSearchFilterRequest = null;

  const previous = {
    openAdvancedSearchPanel: window.openAdvancedSearchPanel,
    toggleAdvancedSearchPanel: window.toggleAdvancedSearchPanel,
    renderAdvancedSearchPanel: window.renderAdvancedSearchPanel,
    renderAdvancedSearchResults: window.renderAdvancedSearchResults,
    resetAdvancedSearchFilters: window.resetAdvancedSearchFilters,
    openAdvancedSearchFromBasket: window.openAdvancedSearchFromBasket,
    openReviewBasketPanel: window.openReviewBasketPanel,
    toggleReviewBasketPanel: window.toggleReviewBasketPanel,
    renderReviewBasketPanel: window.renderReviewBasketPanel,
    renderReviewBasketPanelIfOpen: window.renderReviewBasketPanelIfOpen,
    clearReviewBasket: window.clearReviewBasket,
    openComparisonPanel: window.openComparisonPanel,
    toggleComparisonPanel: window.toggleComparisonPanel,
    renderComparisonPanel: window.renderComparisonPanel,
    renderComparisonPanelIfOpen: window.renderComparisonPanelIfOpen,
    updateComparisonButtonLabel: window.updateComparisonButtonLabel,
    setComparisonPoint: window.setComparisonPoint,
    addPointToComparison: window.addPointToComparison,
    clearComparisonPoint: window.clearComparisonPoint
  };

  function isPharmaDomain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){
    return document.getElementById(id);
  }

  function esc(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function attr(value){
    return esc(value).replace(/`/g,"&#096;");
  }

  function normalizeText(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr-FR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDisplay(value){
    return String(value || "")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .replace(/\s*\n\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCasePinyin(value){
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1).toLocaleLowerCase("fr-FR"))
      .join("\n");
  }

  function containsCjk(value){
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function herbLabel(herb){
    const preferred = herb?.pinyin && !containsCjk(herb.pinyin) ? herb.pinyin : "";
    const fallback = herb?.pinyinSansTons && !containsCjk(herb.pinyinSansTons) ? herb.pinyinSansTons : "";
    return titleCasePinyin(preferred || fallback || herb?.nom || herb?.code || herb?.id || "");
  }

  function herbTitle(herb){
    return [herbLabel(herb), getHerbHanzi(herb), herb?.nom || ""].filter(Boolean).join(" · ");
  }

  function herbMeta(herb){
    return [
      herb?.classe || "",
      fieldTokenLabels("nature", herb).join(", ") || herb?.nature || "",
      fieldTokenLabels("tropism", herb).join(", ") || (herb?.tropisme ? normalizeDisplay(herb.tropisme) : "")
    ]
      .filter(Boolean)
      .join(" — ");
  }

  function allHerbs(){
    return Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
  }

  function allClasses(){
    return Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];
  }

  function getHerbById(id){
    const cleanId = String(id || "");
    return allHerbs().find(herb => String(herb.id) === cleanId) || null;
  }

  function storageGetJson(key, fallback){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed === null ? fallback : parsed;
    }catch(error){
      return fallback;
    }
  }

  function storageSetJson(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
    }catch(error){
      /* localStorage indisponible : l'état restera seulement en mémoire visuelle. */
    }
  }

  function getStoredText(prefix, herbId){
    try{
      const value = localStorage.getItem(prefix + herbId);
      return value === null ? null : value;
    }catch(error){
      return null;
    }
  }

  function setStoredText(prefix, herbId, value){
    try{
      localStorage.setItem(prefix + herbId, String(value ?? ""));
    }catch(error){
      /* localStorage indisponible : l’édition reste seulement visuelle. */
    }
  }

  function getHerbHanzi(herb){
    if(!herb) return "";
    const stored = getStoredText(HANZI_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : (herb.hanzi || "");
  }

  function getHerbEsprit(herb){
    if(!herb) return "";
    const stored = getStoredText(ESPRIT_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : (herb.esprit || "");
  }

  function getHerbNotes(herb){
    if(!herb) return "";
    const stored = getStoredText(NOTES_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : "";
  }

  function getHerbSearchFormules(herb){
    if(!herb) return "";
    const stored = getStoredText(FORMULES_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : (herb.formules || herb.formulas || herb.formule || "");
  }

  function getHerbSearchPrecautions(herb){
    if(!herb) return "";
    const stored = getStoredText(PRECAUTION_STORAGE_PREFIX, herb.id);
    return [herb.precaution || "", herb.precautions || "", stored !== null ? stored : ""].join(" ");
  }

  function getStoredOrStaticText(prefix, herb, staticValues){
    if(!herb) return "";
    const stored = getStoredText(prefix, herb.id);
    return (Array.isArray(staticValues) ? staticValues : [staticValues]).concat(stored !== null ? [stored] : []).join(" ");
  }

  function getHerbSearchSynonymes(herb){
    return getStoredOrStaticText(SYNONYMES_STORAGE_PREFIX, herb, [herb?.synonymes, herb?.synonyms, herb?.noms_alternatifs]);
  }

  function getHerbSearchSynthese(herb){
    return getStoredOrStaticText(SYNTHESE_STORAGE_PREFIX, herb, [herb?.synthese, herb?.synthèse]);
  }

  function getHerbSearchIngredients(herb){
    return getStoredOrStaticText(INGREDIENTS_STORAGE_PREFIX, herb, [herb?.ingredients, herb?.ingrédients]);
  }

  function getHerbSearchRecherchesModernes(herb){
    return getStoredOrStaticText(RECHERCHES_MODERNES_STORAGE_PREFIX, herb, [herb?.recherches_modernes, herb?.recherche_moderne, herb?.modern_research]);
  }

  function getHerbSearchIndications(herb){
    return getStoredOrStaticText(INDICATIONS_STORAGE_PREFIX, herb, [herb?.indications, herb?.indications_locales, herb?.indications_complementaires]);
  }

  function getHerbSearchContreIndications(herb){
    return getStoredOrStaticText(CONTRE_INDICATIONS_STORAGE_PREFIX, herb, [herb?.contre_indications, herb?.contraindications, herb?.contre_indications_locales, herb?.contraindications_locales]);
  }

  function getHerbSearchPreparation(herb){
    return getStoredOrStaticText(PREPARATION_STORAGE_PREFIX, herb, [herb?.preparation, herb?.préparation, herb?.preparation_locale, herb?.preparation_complementaire]);
  }

  function splitValues(value){
    return String(value || "")
      .split(/[\n,;/]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function normalizeKey(value){
    return normalizeText(String(value || "")
      .replace(/[’‘`´]/g, "'")
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "oe")
      .replace(/[()\[\]{}]/g, " ")
      .replace(/[.,:;!?]/g, " ")
      .replace(/\s+/g, " "));
  }

  function rawFilterPieces(value){
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\[\]{}]/g, " ")
      .replace(/[()]/g, ",")
      .replace(/\bvoire?\b/gi, ",")
      .replace(/\bvoir\b/gi, ",")
      .replace(/\bou\b/gi, ",")
      .replace(/\bselon certain(?:\.e)?s?\b/gi, ",")
      .replace(/\s*\/\s*/g, ",")
      .replace(/\s*\n\s*/g, ",")
      .split(/[,;]+/)
      .map(item => item.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  }

  function addUnique(target, value){
    if(value && !target.includes(value)) target.push(value);
  }

  const NATURE_ORDER = [
    "Froide",
    "Légèrement froide",
    "Fraîche",
    "Légèrement fraîche",
    "Neutre",
    "Équilibrée",
    "Légèrement tiède",
    "Tiède",
    "Légèrement chaude",
    "Chaude"
  ];

  const TOXICITY_ORDER = [
    "Faible toxicité",
    "Légèrement toxique",
    "Toxique",
    "Très toxique"
  ];

  const FLAVOR_ORDER = [
    "Acide",
    "Astringent",
    "Légèrement amer",
    "Amer",
    "Amer ++",
    "Légèrement doux",
    "Doux",
    "Fade",
    "Insipide",
    "Légèrement piquant",
    "Piquant",
    "Salé"
  ];

  const TROPISM_ORDER = [
    "P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F",
    "Tài yīn", "Yáng míng", "Shào yīn", "Tài yáng", "Shào yáng", "Jué yīn"
  ];

  function orderIndex(label, order){
    const key = normalizeKey(label);
    const index = order.findIndex(item => normalizeKey(item) === key);
    return index >= 0 ? index : 999;
  }

  function sortLabelsByOrder(labels, order){
    return labels.slice().sort((a,b) => {
      const diff = orderIndex(a, order) - orderIndex(b, order);
      if(diff) return diff;
      return normalizeText(a).localeCompare(normalizeText(b), "fr");
    });
  }

  function canonicalNatureTokens(value){
    const tokens = [];
    rawFilterPieces(value).forEach(piece => {
      const key = normalizeKey(piece);
      if(!key) return;

      if(key.includes("legerement chaud")) addUnique(tokens, "Légèrement chaude");
      else if(/\bchaud/.test(key)) addUnique(tokens, "Chaude");

      if(key.includes("legerement tiede")) addUnique(tokens, "Légèrement tiède");
      else if(/\btiede/.test(key)) addUnique(tokens, "Tiède");

      if(/\bneutre\b/.test(key)) addUnique(tokens, "Neutre");
      if(key.includes("equilibre")) addUnique(tokens, "Équilibrée");

      if(key.includes("legerement froid")) addUnique(tokens, "Légèrement froide");
      else if(/\bfroid/.test(key)) addUnique(tokens, "Froide");

      if(key.includes("legerement frais") || key.includes("legerement fraiche")) addUnique(tokens, "Légèrement fraîche");
      else if(/\bfrais\b/.test(key) || /\bfraiche\b/.test(key)) addUnique(tokens, "Fraîche");
    });
    return sortLabelsByOrder(tokens, NATURE_ORDER);
  }

  function canonicalAromaticTokens(value){
    const tokens = [];
    rawFilterPieces(value).forEach(piece => {
      const key = normalizeKey(piece);
      if(key.includes("aromatique")) addUnique(tokens, "Aromatique");
    });
    return tokens;
  }

  function canonicalToxicityTokens(value){
    const tokens = [];
    rawFilterPieces(value).forEach(piece => {
      const key = normalizeKey(piece);
      if(!key) return;
      if(key.includes("tres toxique")) addUnique(tokens, "Très toxique");
      else if(key.includes("legerement toxique")) addUnique(tokens, "Légèrement toxique");
      else if(key.includes("faible toxicite")) addUnique(tokens, "Faible toxicité");
      else if(/\btoxique\b/.test(key)) addUnique(tokens, "Toxique");
    });
    return sortLabelsByOrder(tokens, TOXICITY_ORDER);
  }

  function canonicalFlavorTokens(value){
    const tokens = [];
    rawFilterPieces(value).forEach(piece => {
      const key = normalizeKey(piece);
      if(!key) return;

      if(key.includes("acide")) addUnique(tokens, "Acide");
      if(key.includes("astringent")) addUnique(tokens, "Astringent");
      if(key.includes("amer ++")) addUnique(tokens, "Amer ++");
      else if(key.includes("legerement amer")) addUnique(tokens, "Légèrement amer");
      else if(/\bamer\b/.test(key)) addUnique(tokens, "Amer");
      if(key.includes("legerement doux")) addUnique(tokens, "Légèrement doux");
      else if(/\bdoux\b/.test(key)) addUnique(tokens, "Doux");
      if(key.includes("fade")) addUnique(tokens, "Fade");
      if(key.includes("insipide")) addUnique(tokens, "Insipide");
      if(key.includes("legerement piquant")) addUnique(tokens, "Légèrement piquant");
      else if(/\bpiquant\b/.test(key) || /\bpiquent\b/.test(key)) addUnique(tokens, "Piquant");
      if(key.includes("sale")) addUnique(tokens, "Salé");
    });
    return sortLabelsByOrder(tokens, FLAVOR_ORDER);
  }

  function canonicalTropismTokens(value){
    const tokens = [];
    const pieces = rawFilterPieces(value);
    const key = normalizeKey(pieces.join(" "));
    if(!key) return tokens;

    if(key.includes("poumon") || /\bp\b/.test(key)) addUnique(tokens, "P");
    if(/\bgi\b/.test(key) || key.includes("gros intestin") || key.includes("gros intestins")) addUnique(tokens, "GI");
    if(key.includes("estomac") || /\besto\b/.test(key)) addUnique(tokens, "E");
    if(key.includes("rate") || /\brt\b/.test(key)) addUnique(tokens, "Rt");
    if(key.includes("coeur") || /\bc\b/.test(key)) addUnique(tokens, "C");
    if(/\big\b/.test(key) || key.includes("intestin grele") || key.includes("intestin greles")) addUnique(tokens, "IG");
    if(key.includes("vessie") || /\bv\b/.test(key)) addUnique(tokens, "V");
    if(key.includes("rein") || key.includes("reins") || /\brn\b/.test(key)) addUnique(tokens, "Rn");
    if(/\bec\b/.test(key) || key.includes("enveloppe du coeur")) addUnique(tokens, "EC");
    if(/\btf\b/.test(key) || key.includes("triple rechauffeur") || key.includes("trois foyers")) addUnique(tokens, "TF");
    if(/\bvb\b/.test(key) || key.includes("vesicule biliaire")) addUnique(tokens, "VB");
    if(key.includes("foie") || /\bf\b/.test(key)) addUnique(tokens, "F");

    if(key.includes("yang ming") || (tokens.includes("E") && tokens.includes("GI"))) addUnique(tokens, "Yáng míng");
    if(key.includes("tai yin") || (tokens.includes("P") && tokens.includes("Rt"))) addUnique(tokens, "Tài yīn");
    if(key.includes("shao yin") || (tokens.includes("Rn") && tokens.includes("C"))) addUnique(tokens, "Shào yīn");
    if(key.includes("tai yang") || (tokens.includes("V") && tokens.includes("IG"))) addUnique(tokens, "Tài yáng");
    if(key.includes("shao yang") || (tokens.includes("TF") && tokens.includes("VB"))) addUnique(tokens, "Shào yáng");
    if(key.includes("jue yin") || (tokens.includes("F") && tokens.includes("EC"))) addUnique(tokens, "Jué yīn");

    return sortLabelsByOrder(tokens, TROPISM_ORDER);
  }

  function splitActionParts(value){
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\s+\/\s+/g, "|")
      .split("|")
      .map(item => item.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function canonicalActionLabel(value){
    const clean = String(value || "").replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
    let key = normalizeKey(clean)
      .replace(/\bhulidite\b/g, "humidite")
      .replace(/\bhulidite\b/g, "humidite")
      .replace(/\bmucsites\b/g, "mucosites")
      .replace(/\bmucsites\b/g, "mucosites")
      .replace(/mucositesyin/g, "mucosites yin")
      .replace(/\btransormer\b/g, "transformer")
      .replace(/\bneutrealiser\b/g, "neutraliser")
      .replace(/\bfoeuts\b/g, "foetus")
      .replace(/\blasurpression\b/g, "la surpression")
      .replace(/\bleyang\b/g, "le yang")
      .replace(/\bevaprat?ion\b/g, "evaporation")
      .replace(/\bqi\b/g, "qi")
      .replace(/\s+/g, " ")
      .trim();

    const overrides = {
      "arreter le soif": "Arrêter la soif",
      "calmer le foetus": "Calmer le fœtus",
      "calmer le yang du foie": "Calmer le Yang du Foie",
      "eclaircir la vue": "Éclaircir la vue",
      "eclaircir les yeux": "Éclaircir les yeux",
      "eliminer l humidite": "Éliminer l’Humidité",
      "eliminer l humidite chaleur du foyer inferieur": "Éliminer l’Humidité-Chaleur du foyer inférieur",
      "exsuder l humidite": "Exsuder l’Humidité",
      "faire reculer l evaporation des os": "Faire reculer l’évaporation des os",
      "faire s ecouler les urines": "Faire s’écouler les urines",
      "humidifier la secheresse": "Humidifier la sécheresse",
      "humidifier le poumon": "Humidifier le Poumon",
      "humidifier les intestins": "Humidifier les Intestins",
      "liberer la canicule": "Libérer la Canicule",
      "liberer la surface": "Libérer la Surface",
      "mettre en ordre le qi": "Mettre en ordre le Qi",
      "neutraliser la toxine": "Neutraliser la toxine",
      "purger le feu": "Purger le Feu",
      "rafraichir le sang": "Rafraîchir le Sang",
      "regulariser le qi": "Régulariser le Qi",
      "regulariser le centre": "Régulariser le Centre",
      "soutenir le reins": "Soutenir les Reins",
      "soutenir le jing": "Soutenir le Jing",
      "tiedir le centre": "Tiédir le Centre",
      "transformer les mucosites": "Transformer les mucosités"
    };
    if(overrides[key]) return overrides[key];

    return clean
      .replace(/\bQI\b/g, "Qi")
      .replace(/\bYIN\b/g, "Yin")
      .replace(/coe?ur/gi, match => match.toLocaleLowerCase("fr-FR") === "coeur" ? "cœur" : match)
      .replace(/Eclaircir/g, "Éclaircir")
      .replace(/Eliminer/g, "Éliminer")
      .replace(/Equilibrer/g, "Équilibrer")
      .replace(/Eteindre/g, "Éteindre")
      .replace(/Eparpiller/g, "Éparpiller");
  }

  function canonicalActionKey(value){
    return normalizeKey(canonicalActionLabel(value))
      .replace(/\bhulidite\b/g, "humidite")
      .replace(/\bmucsites\b/g, "mucosites")
      .replace(/\bmucsites\b/g, "mucosites")
      .replace(/mucositesyin/g, "mucosites yin")
      .replace(/\btransormer\b/g, "transformer")
      .replace(/\bneutrealiser\b/g, "neutraliser")
      .replace(/\blasurpression\b/g, "la surpression")
      .replace(/\bleyang\b/g, "le yang")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalActionEntries(value){
    return splitActionParts(value).map(part => {
      const label = canonicalActionLabel(part);
      return { key: canonicalActionKey(label), label };
    }).filter(item => item.key && item.label);
  }

  function fieldTokenLabels(field, herb){
    if(field === "nature") return canonicalNatureTokens(herb?.nature);
    if(field === "saveur") return canonicalFlavorTokens(herb?.saveur);
    if(field === "aromatic") return canonicalAromaticTokens([herb?.nature, herb?.saveur].filter(Boolean).join(", "));
    if(field === "toxicity") return canonicalToxicityTokens([herb?.nature, herb?.saveur].filter(Boolean).join(", "));
    if(field === "tropism") return canonicalTropismTokens(herb?.tropisme);
    return [];
  }

  function optionObjectsFromLabels(labels, order){
    const map = new Map();
    labels.forEach(label => {
      const clean = normalizeDisplay(label);
      if(!clean) return;
      const key = normalizeKey(clean);
      if(!map.has(key)) map.set(key, { key, label: clean });
    });
    const items = Array.from(map.values());
    return items.sort((a,b) => {
      if(Array.isArray(order)){
        const diff = orderIndex(a.label, order) - orderIndex(b.label, order);
        if(diff) return diff;
      }
      return normalizeText(a.label).localeCompare(normalizeText(b.label), "fr");
    });
  }

  function uniqueSorted(values){
    const map = new Map();
    values.forEach(value => {
      const clean = normalizeDisplay(value);
      if(!clean) return;
      const key = normalizeText(clean);
      if(!map.has(key)) map.set(key, clean);
    });
    return Array.from(map.values()).sort((a,b) => normalizeText(a).localeCompare(normalizeText(b), "fr"));
  }

  function uniqueFieldOptions(field){
    const labels = allHerbs().flatMap(herb => fieldTokenLabels(field, herb));
    const orders = {
      nature: NATURE_ORDER,
      saveur: FLAVOR_ORDER,
      toxicity: TOXICITY_ORDER,
      tropism: TROPISM_ORDER
    };
    return optionObjectsFromLabels(labels, orders[field]);
  }

  function uniqueActionOptions(){
    const map = new Map();
    allHerbs().forEach(herb => {
      (Array.isArray(herb.actions) ? herb.actions : []).forEach(action => {
        canonicalActionEntries(action).forEach(entry => {
          if(!map.has(entry.key)) map.set(entry.key, entry.label);
        });
      });
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({key, label}))
      .sort((a,b) => normalizeText(a.label).localeCompare(normalizeText(b.label), "fr"));
  }

  function optionHtml(value, label){
    return `<option value="${attr(value)}">${esc(label || value)}</option>`;
  }

  function pharmaClassOptionsHtml(selected){
    return allClasses()
      .slice()
      .sort((a,b) => normalizeText(a.nom || a.code).localeCompare(normalizeText(b.nom || b.code), "fr"))
      .map(item => optionHtml(item.code, `${item.code} · ${item.nom}`))
      .join("");
  }

  function selectOptionsHtml(values){
    return values.map(value => optionHtml(value, value)).join("");
  }

  function checkedFilterValues(name){
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
  }

  function checkedFilterAttr(selected, key){
    return Array.isArray(selected) && selected.includes(key) ? "checked" : "";
  }

  function filterCheckboxHtml(name, option, selected){
    return `
      <label class="pharma-filter-chip">
        <input type="checkbox" name="${attr(name)}" value="${attr(option.key)}" ${checkedFilterAttr(selected, option.key)} onchange="updatePharmaFilterSelectionState(event, '${attr(name)}')">
        <span>${esc(option.label)}</span>
      </label>
    `;
  }

  function filterActiveInputName(name){
    return `${name}Active`;
  }

  function filterGroupIsActive(name, selected){
    const input = document.querySelector(`input[name="${filterActiveInputName(name)}"]`);
    if(input) return !!input.checked;
    return Array.isArray(selected) && selected.length > 0;
  }

  function setFilterGroupActive(name, active){
    const input = document.querySelector(`input[name="${filterActiveInputName(name)}"]`);
    if(input) input.checked = !!active;
  }

  function activeFilterCheckboxHtml(name, title, active){
    return `
      <input
        type="checkbox"
        class="pharma-filter-active-checkbox"
        name="${attr(filterActiveInputName(name))}"
        aria-label="Activer le filtre ${attr(title)}"
        title="Activer/désactiver ce filtre sans l’ouvrir"
        ${active ? "checked" : ""}
        onclick="event.stopPropagation()"
        onchange="handlePharmaFilterActiveToggle(event)"
      >
    `;
  }

  function filterLogicInputName(name){
    return `${name}Logic`;
  }

  function filterLogicMode(name){
    const input = document.querySelector(`input[name="${filterLogicInputName(name)}"]`);
    return input && input.value === "and" ? "and" : "or";
  }

  function filterLogicLabel(mode){
    return mode === "and" ? "ET" : "OU";
  }

  function updateFilterLogicButtons(name, mode){
    const cleanMode = mode === "and" ? "and" : "or";
    document.querySelectorAll(`[data-pharma-filter-logic="${name}"]`).forEach(group => {
      group.dataset.mode = cleanMode;
      group.querySelectorAll("button[data-mode]").forEach(button => {
        const active = button.dataset.mode === cleanMode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  }

  function setPharmaFilterLogic(event, name, mode){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    const cleanMode = mode === "and" ? "and" : "or";
    const inputName = filterLogicInputName(name);
    let input = document.querySelector(`input[name="${inputName}"]`);
    if(!input){
      input = document.createElement("input");
      input.type = "hidden";
      input.name = inputName;
      const content = byId("advancedSearchPanelContent");
      if(content) content.appendChild(input);
    }
    input.value = cleanMode;
    updateFilterLogicButtons(name, cleanMode);
    renderAdvancedSearchResults();
  }

  function togglePharmaFilterLogic(event, name){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    const next = filterLogicMode(name) === "and" ? "or" : "and";
    setPharmaFilterLogic(event, name, next);
  }

  function handlePharmaFilterActiveToggle(event){
    const target = event?.target;
    const details = target?.closest ? target.closest(".pharma-filter-details") : null;
    if(details) details.classList.toggle("pharma-filter-active", !!target.checked);
    renderAdvancedSearchResults();
  }

  function updatePharmaFilterSelectionState(event, name){
    const details = event?.target?.closest ? event.target.closest(".pharma-filter-details") : null;
    if(details){
      const checkedCount = details.querySelectorAll(`input[name="${name}"]:checked`).length;
      const title = details.querySelector(".pharma-filter-summary-title");
      if(title){
        let badge = title.querySelector(".pharma-filter-count");
        if(checkedCount){
          if(!badge){
            badge = document.createElement("span");
            badge.className = "pharma-filter-count";
            title.appendChild(badge);
          }
          badge.textContent = String(checkedCount);
        }else if(badge){
          badge.remove();
        }
      }
      setFilterGroupActive(name, checkedCount > 0);
      const logicWrap = details.querySelector(".pharma-filter-logic-wrap");
      if(logicWrap) logicWrap.classList.toggle("pharma-filter-logic-hidden", checkedCount < 2);
      if(checkedCount) details.open = true;
    }
    renderAdvancedSearchResults();
  }

  function filterLogicSwitchHtml(name, mode, selectedCount=0){
    const cleanMode = mode === "and" ? "and" : "or";
    const visibilityClass = Number(selectedCount) >= 2 ? "" : " pharma-filter-logic-hidden";
    return `
      <span class="pharma-filter-logic-wrap${visibilityClass}" data-pharma-filter-logic="${attr(name)}" data-mode="${attr(cleanMode)}" onclick="event.stopPropagation()" aria-label="Mode de correspondance ET ou OU">
        <input type="hidden" name="${attr(filterLogicInputName(name))}" value="${attr(cleanMode)}">
        <button
          type="button"
          class="pharma-filter-logic-choice ${cleanMode === 'and' ? 'active' : ''}"
          data-mode="and"
          aria-pressed="${cleanMode === 'and' ? 'true' : 'false'}"
          onclick="setPharmaFilterLogic(event, '${attr(name)}', 'and')"
          title="ET : la substance doit correspondre à tous les choix"
        >ET</button>
        <button
          type="button"
          class="pharma-filter-logic-choice ${cleanMode === 'or' ? 'active' : ''}"
          data-mode="or"
          aria-pressed="${cleanMode === 'or' ? 'true' : 'false'}"
          onclick="setPharmaFilterLogic(event, '${attr(name)}', 'or')"
          title="OU : la substance doit correspondre à au moins un choix"
        >OU</button>
      </span>
    `;
  }

  function filterCheckboxGroupHtml(name, title, options, selected, mode, showLogic=true, extraClass=""){
    const selectedCount = Array.isArray(selected) ? selected.length : 0;
    const active = filterGroupIsActive(name, selected);
    const countHtml = selectedCount ? `<span class="pharma-filter-count">${selectedCount}</span>` : "";
    const openAttr = selectedCount ? "open" : "";
    const logicHtml = showLogic ? filterLogicSwitchHtml(name, mode, selectedCount) : ``;
    return `
      <details class="search-control pharma-multifilter-control pharma-filter-details ${active ? 'pharma-filter-active' : ''} ${attr(extraClass)}" ${openAttr}>
        <summary class="pharma-filter-summary">
          ${activeFilterCheckboxHtml(name, title, active)}
          <span class="pharma-filter-summary-title">${esc(title)}${countHtml}</span>
          ${logicHtml}
        </summary>
        <div class="pharma-filter-checklist" data-filter-name="${attr(name)}">
          ${options.map(option => filterCheckboxHtml(name, option, selected)).join("")}
        </div>
      </details>
    `;
  }

  function filterSingleToggleHtml(name, title, options, selected){
    const option = Array.isArray(options) && options.length ? options[0] : {key: normalizeKey(title), label: title};
    const isChecked = Array.isArray(selected) && selected.includes(option.key);
    return `
      <label class="search-control pharma-single-toggle-control pharma-aromatic-toggle-control ${isChecked ? 'pharma-filter-active' : ''}">
        <input
          type="checkbox"
          class="pharma-filter-active-checkbox"
          name="${attr(name)}"
          value="${attr(option.key)}"
          ${isChecked ? "checked" : ""}
          onchange="this.closest('.pharma-single-toggle-control')?.classList.toggle('pharma-filter-active', this.checked); renderAdvancedSearchResults()"
        >
        <span>${esc(title)}</span>
      </label>
    `;
  }

  function getCheckedValues(name, fallback){
    const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`));
    if(!inputs.length) return fallback || [];
    const checked = inputs.filter(input => input.checked).map(input => input.value);
    return checked.length ? checked : (fallback || []);
  }

  function checkedAttr(values, value){
    return Array.isArray(values) && values.includes(value) ? "checked" : "";
  }

  function getPharmaSearchFilters(){
    const natures = checkedFilterValues("pharmaSearchNature");
    const saveurs = checkedFilterValues("pharmaSearchSaveur");
    const toxicities = checkedFilterValues("pharmaSearchToxicity");
    const tropisms = checkedFilterValues("pharmaSearchTropism");
    const actions = checkedFilterValues("pharmaSearchAction");
    return {
      keywords: byId("pharmaSearchKeywords")?.value || "",
      scopes: getCheckedValues("pharmaSearchScope", SEARCH_SCOPES),
      classCode: byId("pharmaSearchClass")?.value || "",
      natures,
      saveurs,
      toxicities,
      tropisms,
      actions,
      natureActive: filterGroupIsActive("pharmaSearchNature", natures),
      saveurActive: filterGroupIsActive("pharmaSearchSaveur", saveurs),
      toxicityActive: filterGroupIsActive("pharmaSearchToxicity", toxicities),
      tropismActive: filterGroupIsActive("pharmaSearchTropism", tropisms),
      actionActive: filterGroupIsActive("pharmaSearchAction", actions),
      natureLogic: filterLogicMode("pharmaSearchNature"),
      saveurLogic: filterLogicMode("pharmaSearchSaveur"),
      toxicityLogic: "or",
      tropismLogic: filterLogicMode("pharmaSearchTropism"),
      actionLogic: filterLogicMode("pharmaSearchAction")
    };
  }

  function herbSearchTextForScope(herb, scope){
    if(scope === "name"){
      return [herb?.id, herb?.code, herb?.pinyin, herb?.pinyinSansTons, getHerbHanzi(herb), herb?.hanzi, herb?.nom].join(" ");
    }
    if(scope === "synonymes") return getHerbSearchSynonymes(herb);
    if(scope === "class") return [herb?.classCode, herb?.classe].join(" ");
    if(scope === "nature") return fieldTokenLabels("nature", herb).join(" ");
    if(scope === "saveur") return fieldTokenLabels("saveur", herb).join(" ");
    if(scope === "toxicity") return fieldTokenLabels("toxicity", herb).join(" ");
    if(scope === "tropism") return fieldTokenLabels("tropism", herb).join(" ");
    if(scope === "actions") return Array.isArray(herb?.actions) ? herb.actions.concat(herb.actions.flatMap(action => canonicalActionEntries(action).map(entry => entry.label))).join(" ") : "";
    if(scope === "indications") return getHerbSearchIndications(herb);
    if(scope === "contre_indications") return getHerbSearchContreIndications(herb);
    if(scope === "preparation") return getHerbSearchPreparation(herb);
    if(scope === "notes") return [herb?.esprit || "", getHerbEsprit(herb), getHerbNotes(herb)].join(" ");
    if(scope === "synthese") return getHerbSearchSynthese(herb);
    if(scope === "ingredients") return getHerbSearchIngredients(herb);
    if(scope === "recherches_modernes") return getHerbSearchRecherchesModernes(herb);
    if(scope === "precautions") return getHerbSearchPrecautions(herb);
    if(scope === "formules") return getHerbSearchFormules(herb);
    return "";
  }

  function herbMatchesKeywords(herb, keywords, scopes){
    const query = normalizeText(keywords);
    if(!query) return true;
    const activeScopes = Array.isArray(scopes) && scopes.length ? scopes : SEARCH_SCOPES;
    const haystack = normalizeText(activeScopes.map(scope => herbSearchTextForScope(herb, scope)).join(" "));
    return query.split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  }

  function selectedKeysMatchHerbKeys(selectedKeys, herbKeys, logicMode){
    if(!Array.isArray(selectedKeys) || !selectedKeys.length) return true;
    const cleanSelected = selectedKeys.map(key => normalizeKey(key)).filter(Boolean);
    if(!cleanSelected.length) return true;
    if(logicMode === "and") return cleanSelected.every(key => herbKeys.includes(key));
    return cleanSelected.some(key => herbKeys.includes(key));
  }

  function herbMatchesFilterValues(herb, field, selectedKeys, logicMode){
    const herbKeys = fieldTokenLabels(field, herb).map(label => normalizeKey(label));
    return selectedKeysMatchHerbKeys(selectedKeys, herbKeys, logicMode);
  }

  function herbMatchesActions(herb, selectedKeys, logicMode){
    const herbKeys = (Array.isArray(herb?.actions) ? herb.actions : [])
      .flatMap(action => canonicalActionEntries(action).map(entry => entry.key));
    return selectedKeysMatchHerbKeys(selectedKeys, herbKeys, logicMode);
  }

  function pharmaSearchResults(){
    const filters = getPharmaSearchFilters();
    return allHerbs()
      .filter(herb => herbMatchesKeywords(herb, filters.keywords, filters.scopes))
      .filter(herb => !filters.classCode || String(herb.classCode) === filters.classCode)
      .filter(herb => herbMatchesFilterValues(herb, "nature", filters.natureActive ? filters.natures : [], filters.natureLogic))
      .filter(herb => herbMatchesFilterValues(herb, "saveur", filters.saveurActive ? filters.saveurs : [], filters.saveurLogic))
      .filter(herb => herbMatchesFilterValues(herb, "toxicity", filters.toxicityActive ? filters.toxicities : [], filters.toxicityLogic))
      .filter(herb => herbMatchesFilterValues(herb, "tropism", filters.tropismActive ? filters.tropisms : [], filters.tropismLogic))
      .filter(herb => herbMatchesActions(herb, filters.actionActive ? filters.actions : [], filters.actionLogic))
      .sort((a,b) => normalizeText(herbLabel(a)).localeCompare(normalizeText(herbLabel(b)), "fr"));
  }

  function scopeCheckboxHtml(scope, label, selected){
    return `<label><input type="checkbox" name="pharmaSearchScope" value="${attr(scope)}" ${checkedAttr(selected, scope)} onchange="renderAdvancedSearchResults()"> ${esc(label)}</label>`;
  }

  function renderPharmaSearchPanel(){
    const content = byId("advancedSearchPanelContent");
    if(!content) return;

    const filters = getPharmaSearchFilters();
    const resultsAll = pharmaSearchResults();
    const results = resultsAll.slice(0, 100);

    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Recherche PHARMA</span>
      </div>

      <p class="stats-intro">
        Recherche une substance médicinale par nom, synonymes, classe, nature, saveur, toxicité, tropisme, action, indications, notes, précautions, formules ou données locales.
      </p>

      <div class="search-controls pharma-search-controls">
        <label class="search-control">
          <span>Mot-clé</span>
          <input
            id="pharmaSearchKeywords"
            type="search"
            value="${attr(filters.keywords)}"
            placeholder="ex. Bái Sháo, froid, Rate, tonifier..."
            oninput="renderAdvancedSearchResults()"
          >
        </label>

        <div class="search-scope-options" aria-label="Champs de recherche PHARMA">
          <span>Rechercher dans :</span>
          ${scopeCheckboxHtml("name", "nom", filters.scopes)}
          ${scopeCheckboxHtml("synonymes", "synonymes", filters.scopes)}
          ${scopeCheckboxHtml("class", "classe", filters.scopes)}
          ${scopeCheckboxHtml("nature", "nature", filters.scopes)}
          ${scopeCheckboxHtml("saveur", "saveur", filters.scopes)}
          ${scopeCheckboxHtml("toxicity", "toxicité", filters.scopes)}
          ${scopeCheckboxHtml("tropism", "tropisme", filters.scopes)}
          ${scopeCheckboxHtml("actions", "actions", filters.scopes)}
          ${scopeCheckboxHtml("indications", "indications", filters.scopes)}
          ${scopeCheckboxHtml("contre_indications", "contre-indications", filters.scopes)}
          ${scopeCheckboxHtml("preparation", "préparation", filters.scopes)}
          ${scopeCheckboxHtml("notes", "esprit/notes", filters.scopes)}
          ${scopeCheckboxHtml("synthese", "synthèse ZL", filters.scopes)}
          ${scopeCheckboxHtml("ingredients", "ingrédients", filters.scopes)}
          ${scopeCheckboxHtml("recherches_modernes", "recherches modernes", filters.scopes)}
          ${scopeCheckboxHtml("precautions", "précautions", filters.scopes)}
          ${scopeCheckboxHtml("formules", "formules", filters.scopes)}
        </div>

        <label class="search-control">
          <span>Classe</span>
          <select id="pharmaSearchClass" onchange="renderAdvancedSearchResults()">
            <option value="">Toutes les classes</option>
            ${pharmaClassOptionsHtml(filters.classCode)}
          </select>
        </label>

        ${filterCheckboxGroupHtml("pharmaSearchNature", "Nature(s)", uniqueFieldOptions("nature"), filters.natures, filters.natureLogic)}

        ${filterCheckboxGroupHtml("pharmaSearchSaveur", "Saveur(s)", uniqueFieldOptions("saveur"), filters.saveurs, filters.saveurLogic)}

        ${filterCheckboxGroupHtml("pharmaSearchToxicity", "Toxicité", uniqueFieldOptions("toxicity"), filters.toxicities, filters.toxicityLogic, false)}

        ${filterCheckboxGroupHtml("pharmaSearchTropism", "Tropisme(s)", uniqueFieldOptions("tropism"), filters.tropisms, filters.tropismLogic)}

        ${filterCheckboxGroupHtml("pharmaSearchAction", "Action(s)", uniqueActionOptions(), filters.actions, filters.actionLogic, true, "pharma-action-filter")}
      </div>

      <div class="search-actions">
        <button type="button" onclick="resetAdvancedSearchFilters()">Réinitialiser les filtres</button>
      </div>

      <h3 class="search-section-title">Résultats</h3>
      <div id="advancedSearchResults"></div>
    `;

    const classSelect = byId("pharmaSearchClass");
    if(classSelect) classSelect.value = filters.classCode;

    renderPharmaSearchResultsWith(results, resultsAll.length);
  }

  function pharmaBasketButtonLabel(herbId){
    return isHerbInPharmaBasket(herbId) ? "Retirer du panier" : "Mettre de côté";
  }

  function pharmaBasketShortLabel(herbId){
    return isHerbInPharmaBasket(herbId) ? "×" : "+";
  }

  function pharmaBasketButtonHtml(herbId, className="search-result-basket"){
    const label = pharmaBasketButtonLabel(herbId);
    return `
      <button
        type="button"
        class="${attr(className)} pharma-basket-button"
        data-pharma-basket-herb="${attr(herbId)}"
        onclick="event.stopPropagation(); togglePharmaBasketHerb('${attr(herbId)}')"
        title="${attr(label)}"
        aria-label="${attr(label)}"
      >${esc(pharmaBasketShortLabel(herbId))}</button>
    `;
  }

  function pharmaSearchResultHtml(herb){
    return `
      <li class="search-result-item pharma-search-result-item">
        <div class="compact-point-row" onclick="openPharmaHerbPanel('${attr(herb.id)}')" title="${attr(herbTitle(herb))}" role="button" tabindex="0" onkeydown="openPharmaBasketLineWithKeyboard(event,'${attr(herb.id)}')">
          <span class="compact-point-code pharma-compact-herb-code">${esc(herbLabel(herb))}</span>
          <span class="compact-point-tools" onclick="event.stopPropagation()">
            ${pharmaBasketButtonHtml(herb.id)}
          </span>
        </div>
      </li>
    `;
  }

  function renderPharmaSearchResultsWith(results, total){
    const container = byId("advancedSearchResults");
    if(!container) return;

    if(!total){
      container.innerHTML = `<p class="stats-small">Aucune substance ne correspond aux filtres.</p>`;
      return;
    }

    const limitNote = total > results.length ? ` — ${results.length} affichées` : "";
    container.innerHTML = `
      <div class="search-result-count">${total} substance(s)${limitNote}</div>
      <ul class="search-results-list pharma-search-results-list">
        ${results.map(pharmaSearchResultHtml).join("")}
      </ul>
    `;
  }

  function renderPharmaSearchResults(){
    const resultsAll = pharmaSearchResults();
    renderPharmaSearchResultsWith(resultsAll.slice(0,100), resultsAll.length);
  }

  function resetPharmaSearchFilters(){
    ["pharmaSearchKeywords", "pharmaSearchClass"].forEach(id => {
      const element = byId(id);
      if(element) element.value = "";
    });
    document.querySelectorAll("input[name='pharmaSearchScope']").forEach(input => { input.checked = true; });
    document.querySelectorAll("input[name='pharmaSearchNature'], input[name='pharmaSearchSaveur'], input[name='pharmaSearchToxicity'], input[name='pharmaSearchTropism'], input[name='pharmaSearchAction'], input[name='pharmaSearchNatureActive'], input[name='pharmaSearchSaveurActive'], input[name='pharmaSearchToxicityActive'], input[name='pharmaSearchTropismActive'], input[name='pharmaSearchActionActive']")
      .forEach(input => { input.checked = false; });
    ["pharmaSearchNature", "pharmaSearchSaveur", "pharmaSearchToxicity", "pharmaSearchTropism", "pharmaSearchAction"].forEach(name => {
      const input = document.querySelector(`input[name="${filterLogicInputName(name)}"]`);
      if(input) input.value = "or";
      updateFilterLogicButtons(name, "or");
    });
    renderPharmaSearchResults();
  }

  function openPharmaSearchPanel(){
    const panel = byId("advancedSearchPanel");
    if(!panel) return;
    if(typeof closeAllBottomPanels === "function") closeAllBottomPanels("advancedSearchPanel");
    panel.classList.add("open");
    try{
      renderPharmaSearchPanel();
    }catch(error){
      const content = byId("advancedSearchPanelContent");
      if(content){
        content.innerHTML = `<div class="point-header"><span class="point-code">Recherche PHARMA</span></div><p class="stats-small">La recherche n’a pas pu s’afficher. Recharge la page ou signale cette erreur.</p>`;
      }
      console.error("Erreur Recherche PHARMA", error);
    }
    panel.classList.add("open");
  }

  function getPharmaBasket(){
    const parsed = storageGetJson(PHARMA_BASKET_KEY, []);
    if(!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(id => !!getHerbById(id));
  }

  function updatePharmaBasketButtonLabel(){
    const button = byId("reviewBasketButton");
    if(!button || !isPharmaDomain()) return;
    const count = getPharmaBasket().length;
    button.textContent = count > 0 ? `Panier (${count})` : "Panier";
    button.title = count > 0 ? `Panier de révision (${count})` : "Panier de révision";
    button.setAttribute("aria-label", button.title);
  }

  function getPharmaBasketCountLabel(){
    const count = getPharmaBasket().length;
    return count > 0 ? ` (${count})` : "";
  }

  function savePharmaBasket(ids){
    const cleanIds = Array.from(new Set((ids || []).map(String).filter(id => !!getHerbById(id))));
    storageSetJson(PHARMA_BASKET_KEY, cleanIds);
    updatePharmaBasketButtons();
    updatePharmaBasketButtonLabel();
    renderPharmaBasketPanelIfOpen();
  }

  function isHerbInPharmaBasket(herbId){
    return getPharmaBasket().includes(String(herbId || ""));
  }

  function togglePharmaBasketHerb(herbId){
    const id = String(herbId || "");
    if(!getHerbById(id)) return;
    const basket = getPharmaBasket();
    if(basket.includes(id)){
      savePharmaBasket(basket.filter(saved => saved !== id));
    }else{
      savePharmaBasket(basket.concat(id));
    }
  }

  function addPharmaBasketHerb(herbId){
    const id = String(herbId || "");
    if(!getHerbById(id)) return;
    const basket = getPharmaBasket();
    if(!basket.includes(id)) savePharmaBasket(basket.concat(id));
    else updatePharmaBasketButtons(id);
  }

  function removePharmaBasketHerb(herbId){
    savePharmaBasket(getPharmaBasket().filter(saved => saved !== String(herbId || "")));
  }

  function clearPharmaBasket(){
    savePharmaBasket([]);
  }

  function updatePharmaBasketButtons(herbId){
    const selector = herbId
      ? `[data-pharma-basket-herb="${cssEscape(String(herbId))}"]`
      : "[data-pharma-basket-herb]";

    document.querySelectorAll(selector).forEach(button => {
      const id = button.dataset.pharmaBasketHerb;
      const label = pharmaBasketButtonLabel(id);
      button.textContent = pharmaBasketShortLabel(id);
      button.title = label;
      button.setAttribute("aria-label", label);
      button.classList.toggle("is-active", isHerbInPharmaBasket(id));
    });
  }

  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/"/g, "\\\"");
  }

  function pharmaBasketListHtml(){
    const basket = getPharmaBasket();
    if(!basket.length){
      return `<p class="stats-small">Ton panier de révision est vide. Ajoute des substances depuis la recherche.</p>`;
    }

    return `
      <p class="stats-small">Clique sur une substance pour ouvrir sa fiche. Le bouton + l’ajoute à la comparaison.</p>
      <ul class="basket-list review-basket-grid pharma-basket-list">
        ${basket.map(herbId => {
          const herb = getHerbById(herbId);
          if(!herb) return "";
          return `
            <li class="basket-list-item review-basket-item pharma-basket-list-item" title="${attr(herbTitle(herb))}">
              <div
                class="compact-point-row review-basket-row pharma-review-basket-row"
                onclick="openPharmaHerbPanel('${attr(herb.id)}')"
                role="button"
                tabindex="0"
                onkeydown="openPharmaBasketLineWithKeyboard(event,'${attr(herb.id)}')"
              >
                <span class="compact-point-code review-basket-code pharma-review-basket-code">${esc(herbLabel(herb))}</span>
                <span class="compact-point-tools basket-item-buttons review-basket-tools pharma-review-basket-tools" onclick="event.stopPropagation()">
                  <button type="button" class="comparison-add-button pharma-add-comparison-button ${isHerbInPharmaComparison(herb.id) ? 'is-active' : ''}" data-pharma-comparison-herb="${attr(herb.id)}" onclick="togglePharmaComparisonHerb('${attr(herb.id)}',{autoOpen:false})" title="${attr(pharmaComparisonButtonLabel(herb.id))}" aria-label="${attr(pharmaComparisonButtonLabel(herb.id))}">${esc(pharmaComparisonShortLabel(herb.id))}</button>
                  <button type="button" class="basket-remove-button pharma-remove-basket-button" onclick="removePharmaBasketHerb('${attr(herb.id)}')" title="Retirer du panier" aria-label="Retirer du panier">×</button>
                </span>
              </div>
            </li>
          `;
        }).join("")}
      </ul>
    `;
  }

  function renderPharmaBasketPanel(){
    const content = byId("reviewBasketPanelContent");
    if(!content) return;
    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Panier de révision${esc(getPharmaBasketCountLabel())}</span>
      </div>

      <p class="stats-intro">
        Mets ici les substances médicinales que tu veux revoir plus tard. Le panier de révision PHARMA est séparé du panier ACU.
      </p>

      <div class="search-actions">
        <button type="button" onclick="clearReviewBasket()">Vider le panier</button>
        <button type="button" onclick="openAdvancedSearchFromBasket()">Ouvrir la recherche</button>
      </div>

      <div id="reviewBasketContent">${pharmaBasketListHtml()}</div>
    `;
  }

  function openPharmaBasketPanel(){
    const panel = byId("reviewBasketPanel");
    if(!panel) return;
    if(typeof closeAllBottomPanels === "function") closeAllBottomPanels("reviewBasketPanel");
    renderPharmaBasketPanel();
    panel.classList.add("open");
  }

  function renderPharmaBasketPanelIfOpen(){
    const panel = byId("reviewBasketPanel");
    if(panel && panel.classList.contains("open")) renderPharmaBasketPanel();
  }

  function getPharmaComparisonSlots(){
    const parsed = storageGetJson(PHARMA_COMPARISON_KEY, []);
    const slots = Array.isArray(parsed) ? parsed.map(value => value ? String(value) : "") : [];
    while(slots.length < MAX_COMPARISON_SLOTS) slots.push("");
    return slots.slice(0, MAX_COMPARISON_SLOTS);
  }

  function savePharmaComparisonSlots(slots){
    const clean = getPharmaComparisonSlots().map((_, index) => {
      const id = slots?.[index] ? String(slots[index]) : "";
      return getHerbById(id) ? id : "";
    });
    storageSetJson(PHARMA_COMPARISON_KEY, clean);
    updatePharmaComparisonButtonLabel();
    updatePharmaComparisonButtons();
    renderPharmaComparisonPanelIfOpen();
  }

  function slotLabel(index){
    return SLOT_LETTERS[Number(index) || 0] || "";
  }

  function firstFreeComparisonSlot(slots){
    return slots.findIndex(id => !id);
  }

  function setPharmaComparisonHerb(herbId, slotIndex, options){
    const id = String(herbId || "");
    if(!getHerbById(id)) return;

    if(slotIndex === undefined || slotIndex === null || slotIndex === ""){
      addPharmaHerbToComparison(id, options);
      return;
    }

    const index = Math.max(0, Math.min(MAX_COMPARISON_SLOTS - 1, Number(slotIndex) || 0));
    const slots = getPharmaComparisonSlots();
    const previousIndex = slots.findIndex(saved => saved === id);

    if(previousIndex >= 0 && previousIndex !== index){
      slots[previousIndex] = "";
    }

    slots[index] = id;
    savePharmaComparisonSlots(slots);

    const message = byId("message");
    if(message){
      message.textContent = `${herbLabel(getHerbById(id))} placé en comparaison (${slotLabel(index)}).`;
    }

    if(options && options.autoOpen){
      openPharmaComparisonPanel();
    }
  }

  function addPharmaHerbToComparison(herbId, options){
    const id = String(herbId || "");
    const herb = getHerbById(id);
    if(!herb) return;

    const slots = getPharmaComparisonSlots();
    const existingIndex = slots.findIndex(saved => saved === id);

    if(existingIndex >= 0){
      const message = byId("message");
      if(message) message.textContent = `${herbLabel(herb)} est déjà en comparaison (${slotLabel(existingIndex)}).`;
      return;
    }

    const index = firstFreeComparisonSlot(slots);
    if(index < 0){
      const message = byId("message");
      if(message) message.textContent = "La comparaison PHARMA est pleine : A à Z sont déjà occupés.";
      return;
    }

    slots[index] = id;
    savePharmaComparisonSlots(slots);

    const message = byId("message");
    if(message) message.textContent = `${herbLabel(herb)} placé en comparaison (${slotLabel(index)}).`;

    if(options && options.autoOpen){
      openPharmaComparisonPanel();
    }
  }

  function clearPharmaComparisonHerb(slotIndex){
    const slots = getPharmaComparisonSlots();
    const index = Math.max(0, Math.min(MAX_COMPARISON_SLOTS - 1, Number(slotIndex) || 0));
    slots[index] = "";
    savePharmaComparisonSlots(slots);
  }

  function isHerbInPharmaComparison(herbId){
    const id = String(herbId || "");
    return getPharmaComparisonSlots().includes(id);
  }

  function removePharmaComparisonHerbById(herbId){
    const id = String(herbId || "");
    if(!id) return;
    const slots = getPharmaComparisonSlots().map(saved => saved === id ? "" : saved);
    savePharmaComparisonSlots(slots);
  }

  function togglePharmaComparisonHerb(herbId, options){
    const id = String(herbId || "");
    if(!getHerbById(id)) return;
    if(isHerbInPharmaComparison(id)){
      removePharmaComparisonHerbById(id);
    }else{
      addPharmaHerbToComparison(id, options || {autoOpen:false});
    }
  }

  function pharmaComparisonButtonLabel(herbId){
    return isHerbInPharmaComparison(herbId) ? "Retirer de la comparaison" : "Ajouter à la comparaison";
  }

  function pharmaComparisonShortLabel(herbId){
    return isHerbInPharmaComparison(herbId) ? "×" : "+";
  }

  function updatePharmaComparisonButtons(herbId){
    const selector = herbId
      ? `[data-pharma-comparison-herb="${cssEscape(String(herbId))}"]`
      : "[data-pharma-comparison-herb]";
    document.querySelectorAll(selector).forEach(button => {
      const id = button.dataset.pharmaComparisonHerb;
      const label = pharmaComparisonButtonLabel(id);
      button.textContent = pharmaComparisonShortLabel(id);
      button.title = label;
      button.setAttribute("aria-label", label);
      button.classList.toggle("is-active", isHerbInPharmaComparison(id));
    });
  }

  function updatePharmaComparisonButtonLabel(){
    const button = byId("comparisonButton");
    if(!button) return;
    const count = getPharmaComparisonSlots().filter(Boolean).length;
    button.textContent = count > 0 ? `A|B (${count}/${MAX_COMPARISON_SLOTS})` : "A|B";
    const label = count > 0 ? `Comparer les substances (${count}/${MAX_COMPARISON_SLOTS})` : "Comparer les substances";
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  const COMMON_WORD_STOPWORDS = new Set([
    "avec", "dans", "des", "les", "une", "aux", "pour", "par", "sur", "sous", "sans", "chez", "qui", "que", "du", "de", "la", "le", "l", "et", "ou", "en", "un", "au", "a", "se", "sa", "son", "ses", "leur", "leurs", "plus", "moins", "très", "tres", "fait", "faire", "vers", "ainsi", "comme"
  ]);

  function wordsForHighlight(value){
    return Array.from(new Set(normalizeText(value)
      .split(/[^a-z0-9]+/i)
      .map(word => word.trim())
      .filter(word => word.length >= 3 && !COMMON_WORD_STOPWORDS.has(word))));
  }

  function commonWordsForValues(values){
    const sets = (values || [])
      .map(value => new Set(wordsForHighlight(value)))
      .filter(set => set.size);
    if(sets.length < 2) return new Set();
    const counts = new Map();
    sets.forEach(set => set.forEach(word => counts.set(word, (counts.get(word) || 0) + 1)));
    return new Set(Array.from(counts.entries()).filter(([, count]) => count >= 2).map(([word]) => word));
  }

  function highlightCommonWordsEscaped(text, commonWords){
    const raw = String(text || "");
    if(!raw) return "";
    const common = commonWords instanceof Set ? commonWords : new Set();
    const parts = raw.split(/(\p{L}[\p{L}'’\-]*|\d+)/gu);
    return parts.map(part => {
      const key = normalizeText(part).replace(/[^a-z0-9]+/gi, "");
      const safe = esc(part);
      return key && common.has(key) ? `<strong class="pharma-common-word">${safe}</strong>` : safe;
    }).join("");
  }

  function comparisonCellHighlightedHtml(value, commonWords, extraClass=""){
    const clean = Array.isArray(value)
      ? value.map(normalizeDisplay).filter(Boolean).join("\n")
      : normalizeDisplay(value);
    const html = clean ? highlightCommonWordsEscaped(clean, commonWords).replace(/\n/g,"<br>") : `<span class="pharma-empty">—</span>`;
    return `<div class="pharma-comparison-cell ${attr(extraClass)}">${html}</div>`;
  }

  function comparisonEditableCellHtml(herb, field, value, commonWords, extraClass=""){
    const clean = Array.isArray(value)
      ? value.map(normalizeDisplay).filter(Boolean).join("\n")
      : normalizeDisplay(value);
    const html = clean ? highlightCommonWordsEscaped(clean, commonWords).replace(/\n/g,"<br>") : "";
    const title = field === "esprit" ? "Modifier l’esprit de cette substance" : "Modifier les notes de cette substance";
    const placeholder = field === "esprit" ? "Résumé global…" : "Notes personnelles…";
    return `
      <div class="pharma-comparison-cell ${attr(extraClass)}">
        <div
          class="pharma-comparison-editable pharma-comparison-editable-${attr(field)}"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          spellcheck="false"
          data-pharma-compare-edit="${attr(field)}"
          data-pharma-herb-id="${attr(herb?.id || '')}"
          data-placeholder="${attr(placeholder)}"
          title="${attr(title)}">${html}</div>
      </div>
    `;
  }

  function sentenceCase(value){
    const clean = normalizeDisplay(value);
    if(!clean) return "";
    const lower = clean.toLocaleLowerCase("fr-FR");
    return lower.charAt(0).toLocaleUpperCase("fr-FR") + lower.slice(1);
  }

  function actionTextEntries(herb){
    const map = new Map();
    (Array.isArray(herb?.actions) ? herb.actions : []).forEach(action => {
      canonicalActionEntries(action).forEach(entry => {
        if(!map.has(entry.key)) map.set(entry.key, sentenceCase(entry.label));
      });
    });
    return Array.from(map.values());
  }

  function actionsTextHtml(herb, commonWords){
    const entries = actionTextEntries(herb);
    if(!entries.length) return `<span class="pharma-empty">—</span>`;
    return entries.map(label => `<div class="pharma-action-line">${highlightCommonWordsEscaped(label, commonWords)}</div>`).join("");
  }

  function comparisonCellHtml(value, extraClass=""){
    const clean = Array.isArray(value)
      ? value.map(normalizeDisplay).filter(Boolean).join("\n")
      : normalizeDisplay(value);
    return `<div class="pharma-comparison-cell ${attr(extraClass)}">${clean ? esc(clean).replace(/\n/g,"<br>") : `<span class="pharma-empty">—</span>`}</div>`;
  }

  function natureClass(label){
    const key = normalizeKey(label);
    if(key.includes("legerement froide")) return "nature-cold-light";
    if(key.includes("froide")) return "nature-cold-strong";
    if(key.includes("legerement fraiche")) return "nature-cool-light";
    if(key.includes("fraiche")) return "nature-cool";
    if(key.includes("legerement chaude")) return "nature-hot-light";
    if(key.includes("chaude")) return "nature-hot-strong";
    if(key.includes("tiede")) return "nature-warm";
    return "nature-neutral";
  }

  function tokenChipHtml(label, className=""){
    if(!label) return "";
    return `<span class="pharma-token-chip ${attr(className)}">${esc(label)}</span>`;
  }

  function natureTokensHtml(herb){
    return fieldTokenLabels("nature", herb).map(label => tokenChipHtml(label, `pharma-nature-token ${natureClass(label)}`)).join(" ") || `<span class="pharma-empty">—</span>`;
  }

  function flavorTokensHtml(herb){
    return fieldTokenLabels("saveur", herb).map(label => tokenChipHtml(label, "pharma-flavor-token")).join(" ") || `<span class="pharma-empty">—</span>`;
  }

  function toxicityTokensHtml(herb){
    return fieldTokenLabels("toxicity", herb).map(label => tokenChipHtml(label, "pharma-toxicity-token")).join(" ") || `<span class="pharma-empty">—</span>`;
  }

  function natureAndToxicityTokensHtml(herb){
    const nature = fieldTokenLabels("nature", herb).map(label => tokenChipHtml(label, `pharma-nature-token ${natureClass(label)}`));
    const toxicity = fieldTokenLabels("toxicity", herb).map(label => tokenChipHtml(label, "pharma-toxicity-token"));
    const merged = nature.concat(toxicity);
    return merged.length ? merged.join(" ") : `<span class="pharma-empty">—</span>`;
  }

  function tropismClass(label){
    const key = normalizeKey(label);
    if(["f", "vb"].includes(key)) return "tropism-wood";
    if(["c", "ig", "ec", "tf"].includes(key)) return "tropism-fire";
    if(["rt", "e"].includes(key)) return "tropism-earth";
    if(["p", "gi"].includes(key)) return "tropism-metal";
    if(["rn", "v"].includes(key)) return "tropism-water";
    return "tropism-axis";
  }

  function tropismTokensHtml(herb){
    return fieldTokenLabels("tropism", herb).map(label => tokenChipHtml(label, `pharma-tropism-token ${tropismClass(label)}`)).join(" ") || `<span class="pharma-empty">—</span>`;
  }

  function getClassLabel(herb){
    return [herb.classCode || "", herb.classe || ""].filter(Boolean).join(" · ");
  }

  function classLinkHtml(herb){
    const label = getClassLabel(herb);
    if(!label) return `<span class="pharma-empty">—</span>`;
    return `<button type="button" class="pharma-comparison-link" data-pharma-search-class="${attr(herb.classCode || '')}">${esc(label)}</button>`;
  }

  function actionLinksHtml(herb){
    const map = new Map();
    (Array.isArray(herb?.actions) ? herb.actions : []).forEach(action => {
      canonicalActionEntries(action).forEach(entry => {
        if(!map.has(entry.key)) map.set(entry.key, entry.label);
      });
    });
    if(!map.size) return `<span class="pharma-empty">—</span>`;
    return Array.from(map.entries()).map(([key, label]) => `<button type="button" class="pharma-comparison-link pharma-action-link" data-pharma-search-action="${attr(key)}">${esc(label)}</button>`).join(" ");
  }

  function comparisonHtmlCell(html, extraClass=""){
    return `<div class="pharma-comparison-cell ${attr(extraClass)}">${html || `<span class="pharma-empty">—</span>`}</div>`;
  }

  function pharmaComparisonHeaderHtml(slot){
    const herb = getHerbById(slot.herbId);
    const title = herbLabel(herb);
    return `
      <div class="pharma-comparison-herb-header" data-comparison-slot="${attr(slotLabel(slot.index))}">
        <div class="pharma-comparison-common-name">${esc(herb?.nom || "")}</div>
        <div class="pharma-comparison-main-name"><span class="comparison-slot-label">${esc(slotLabel(slot.index))}</span>${esc(title)}</div>
        <div class="comparison-actions pharma-comparison-actions">
          <button type="button" onclick="openPharmaHerbPanel('${attr(herb.id)}')">Fiche</button>
          <button type="button" onclick="clearComparisonPoint(${Number(slot.index) || 0})">×</button>
        </div>
      </div>
    `;
  }

  function comparisonRow(label, filled, renderer, rowClass=""){
    return `
      <div class="pharma-comparison-row-label ${attr(rowClass)}">${esc(label)}</div>
      ${filled.map(slot => renderer(getHerbById(slot.herbId), slot)).join("")}
    `;
  }

  function getToxicityLabel(herb){
    return fieldTokenLabels("toxicity", herb).join(", ");
  }

  function getDisplayFieldLabels(field, herb, fallback){
    const labels = fieldTokenLabels(field, herb).join(", ");
    return labels || normalizeDisplay(fallback || "");
  }

  function pharmaComparisonCardHtml(slotIndex, herbId){
    const herb = getHerbById(herbId);
    if(!herb) return "";
    return `
      <div class="comparison-card pharma-comparison-card" data-comparison-slot="${attr(slotLabel(slotIndex))}">
        ${pharmaComparisonHeaderHtml({index:slotIndex, herbId})}
        ${comparisonCellHtml(getHerbEsprit(herb), "pharma-esprit-cell")}
        ${comparisonHtmlCell(classLinkHtml(herb))}
        ${comparisonHtmlCell(natureAndToxicityTokensHtml(herb))}
        ${comparisonHtmlCell(flavorTokensHtml(herb))}
        ${comparisonHtmlCell(tropismTokensHtml(herb))}
        ${comparisonCellHtml(herb.posologie)}
        ${comparisonHtmlCell(actionsTextHtml(herb, new Set()), "pharma-actions-cell")}
        ${comparisonCellHtml(getHerbNotes(herb))}
      </div>
    `;
  }

  function renderPharmaComparisonPanel(){
    const content = byId("comparisonPanelContent");
    if(!content) return;
    const filled = getPharmaComparisonSlots()
      .map((herbId, index) => ({herbId, index}))
      .filter(slot => !!slot.herbId && !!getHerbById(slot.herbId));
    const count = Math.max(filled.length, 2);

    if(!filled.length){
      content.innerHTML = `
        <div class="point-header">
          <span class="point-code">Comparaison PHARMA</span>
        </div>
        <p class="stats-small">Aucune substance n’est encore placée en comparaison. Ajoute des substances depuis le panier.</p>
      `;
      return;
    }

    content.innerHTML = `
      <div class="point-header">
        <span class="point-code">Comparaison PHARMA A–Z</span>
      </div>

      <p class="stats-intro">
        Les champs identiques sont alignés côte à côte. Les mots communs entre plusieurs substances sont mis en gras.
      </p>

      ${(() => {
        const espritCommon = commonWordsForValues(filled.map(slot => getHerbEsprit(getHerbById(slot.herbId))));
        const posologieCommon = commonWordsForValues(filled.map(slot => getHerbById(slot.herbId)?.posologie || ""));
        const actionCommon = commonWordsForValues(filled.map(slot => actionTextEntries(getHerbById(slot.herbId)).join(" ")));
        const notesCommon = commonWordsForValues(filled.map(slot => getHerbNotes(getHerbById(slot.herbId))));
        return `
          <div class="pharma-comparison-matrix" style="--comparison-count:${count}">
            <div class="pharma-comparison-corner"></div>
            ${filled.map(pharmaComparisonHeaderHtml).join("")}
            ${comparisonRow("Esprit", filled, herb => comparisonEditableCellHtml(herb, "esprit", getHerbEsprit(herb), espritCommon, "pharma-esprit-cell"))}
            ${comparisonRow("Classe", filled, herb => comparisonHtmlCell(classLinkHtml(herb)))}
            ${comparisonRow("", filled, herb => comparisonHtmlCell(natureAndToxicityTokensHtml(herb), "pharma-token-cell"), "pharma-row-label-muted")}
            ${comparisonRow("", filled, herb => comparisonHtmlCell(flavorTokensHtml(herb), "pharma-token-cell"), "pharma-row-label-muted")}
            ${comparisonRow("", filled, herb => comparisonHtmlCell(tropismTokensHtml(herb), "pharma-token-cell"), "pharma-row-label-muted")}
            ${comparisonRow("Posologie", filled, herb => comparisonCellHighlightedHtml(herb.posologie, posologieCommon))}
            ${comparisonRow("Actions", filled, herb => comparisonHtmlCell(actionsTextHtml(herb, actionCommon), "pharma-actions-cell"))}
            ${comparisonRow("Notes", filled, herb => comparisonEditableCellHtml(herb, "notes", getHerbNotes(herb), notesCommon, "pharma-notes-cell"))}
          </div>
        `;
      })()}
    `;
  }

  function openPharmaComparisonPanel(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(typeof closeAllBottomPanels === "function") closeAllBottomPanels("comparisonPanel");
    renderPharmaComparisonPanel();
    panel.classList.add("open");
  }

  function renderPharmaComparisonPanelIfOpen(){
    const panel = byId("comparisonPanel");
    if(panel && panel.classList.contains("open")) renderPharmaComparisonPanel();
  }

  function updateDomainAwareComparisonButtonLabel(){
    if(isPharmaDomain()){
      updatePharmaComparisonButtonLabel();
    }else if(typeof previous.updateComparisonButtonLabel === "function"){
      previous.updateComparisonButtonLabel();
    }
  }

  function syncToolButtonTitles(){
    const searchButton = byId("advancedSearchButton");
    const basketButton = byId("reviewBasketButton");
    const comparisonButton = byId("comparisonButton");

    if(isPharmaDomain()){
      if(searchButton) searchButton.title = "Recherche PHARMA";
      updatePharmaBasketButtonLabel();
      if(comparisonButton && !getPharmaComparisonSlots().filter(Boolean).length){
        comparisonButton.title = "Comparer les substances";
      }
      updatePharmaComparisonButtonLabel();
    }else{
      if(searchButton) searchButton.title = "Recherche avancée";
      if(basketButton){
        basketButton.title = "Panier de révision";
        basketButton.setAttribute("aria-label", "Panier de révision");
      }
      if(typeof window.updateBasketCount === "function") window.updateBasketCount();
      else if(basketButton) basketButton.textContent = "Panier";
      if(typeof previous.updateComparisonButtonLabel === "function") previous.updateComparisonButtonLabel();
    }
  }

  function setSearchScopeToAll(){
    document.querySelectorAll("input[name='pharmaSearchScope']").forEach(input => { input.checked = true; });
  }

  function clearPharmaSearchFormSelections(){
    const keywords = byId("pharmaSearchKeywords");
    if(keywords) keywords.value = "";
    const classSelect = byId("pharmaSearchClass");
    if(classSelect) classSelect.value = "";
    document.querySelectorAll("input[name='pharmaSearchNature'], input[name='pharmaSearchSaveur'], input[name='pharmaSearchToxicity'], input[name='pharmaSearchTropism'], input[name='pharmaSearchAction'], input[name='pharmaSearchNatureActive'], input[name='pharmaSearchSaveurActive'], input[name='pharmaSearchToxicityActive'], input[name='pharmaSearchTropismActive'], input[name='pharmaSearchActionActive']").forEach(input => { input.checked = false; });
    setSearchScopeToAll();
  }

  function activateFilterDetailsFor(name){
    const input = document.querySelector(`input[name="${filterActiveInputName(name)}"]`);
    if(input) input.checked = true;
    const details = document.querySelector(`.pharma-filter-details input[name="${name}"]`)?.closest(".pharma-filter-details");
    if(details){
      details.open = true;
      details.classList.add("pharma-filter-active");
    }
    updatePharmaFilterSelectionState({target: document.querySelector(`input[name="${name}"]`)}, name);
  }

  function openPharmaSearchForClass(classCode){
    if(!isPharmaDomain()) return;
    openPharmaSearchPanel();
    clearPharmaSearchFormSelections();
    const classSelect = byId("pharmaSearchClass");
    if(classSelect) classSelect.value = String(classCode || "");
    renderPharmaSearchResults();
  }

  function openPharmaSearchForAction(actionKey){
    if(!isPharmaDomain()) return;
    openPharmaSearchPanel();
    clearPharmaSearchFormSelections();
    const key = String(actionKey || "");
    const checkbox = Array.from(document.querySelectorAll(`input[name="pharmaSearchAction"]`)).find(input => input.value === key);
    if(checkbox){
      checkbox.checked = true;
      setFilterGroupActive("pharmaSearchAction", true);
      const details = checkbox.closest(".pharma-filter-details");
      if(details){
        details.open = true;
        details.classList.add("pharma-filter-active");
        const title = details.querySelector(".pharma-filter-summary-title");
        const checkedCount = details.querySelectorAll(`input[name="pharmaSearchAction"]:checked`).length;
        if(title){
          let badge = title.querySelector(".pharma-filter-count");
          if(checkedCount){
            if(!badge){
              badge = document.createElement("span");
              badge.className = "pharma-filter-count";
              title.appendChild(badge);
            }
            badge.textContent = String(checkedCount);
          }
        }
      }
    }
    renderPharmaSearchResults();
  }

  window.renderAdvancedSearchPanel = function(){
    if(isPharmaDomain()) return renderPharmaSearchPanel();
    if(typeof previous.renderAdvancedSearchPanel === "function") return previous.renderAdvancedSearchPanel.apply(this, arguments);
  };

  window.renderAdvancedSearchResults = function(){
    if(isPharmaDomain()) return renderPharmaSearchResults();
    if(typeof previous.renderAdvancedSearchResults === "function") return previous.renderAdvancedSearchResults.apply(this, arguments);
  };

  window.resetAdvancedSearchFilters = function(){
    if(isPharmaDomain()) return resetPharmaSearchFilters();
    if(typeof previous.resetAdvancedSearchFilters === "function") return previous.resetAdvancedSearchFilters.apply(this, arguments);
  };

  window.openAdvancedSearchPanel = function(){
    if(isPharmaDomain()) return openPharmaSearchPanel();
    if(typeof previous.openAdvancedSearchPanel === "function") return previous.openAdvancedSearchPanel.apply(this, arguments);
  };

  window.toggleAdvancedSearchPanel = function(){
    const panel = byId("advancedSearchPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      if(typeof window.closeAdvancedSearchPanel === "function") return window.closeAdvancedSearchPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openAdvancedSearchPanel();
  };

  window.openAdvancedSearchFromBasket = function(){
    if(typeof window.closeReviewBasketPanel === "function") window.closeReviewBasketPanel();
    window.openAdvancedSearchPanel();
  };

  window.renderReviewBasketPanel = function(){
    if(isPharmaDomain()) return renderPharmaBasketPanel();
    if(typeof previous.renderReviewBasketPanel === "function") return previous.renderReviewBasketPanel.apply(this, arguments);
  };

  window.renderReviewBasketPanelIfOpen = function(){
    if(isPharmaDomain()) return renderPharmaBasketPanelIfOpen();
    if(typeof previous.renderReviewBasketPanelIfOpen === "function") return previous.renderReviewBasketPanelIfOpen.apply(this, arguments);
  };

  window.openReviewBasketPanel = function(){
    if(isPharmaDomain()) return openPharmaBasketPanel();
    if(typeof previous.openReviewBasketPanel === "function") return previous.openReviewBasketPanel.apply(this, arguments);
  };

  window.toggleReviewBasketPanel = function(){
    const panel = byId("reviewBasketPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      if(typeof window.closeReviewBasketPanel === "function") return window.closeReviewBasketPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openReviewBasketPanel();
  };

  window.clearReviewBasket = function(){
    if(isPharmaDomain()) return clearPharmaBasket();
    if(typeof previous.clearReviewBasket === "function") return previous.clearReviewBasket.apply(this, arguments);
  };

  window.updateComparisonButtonLabel = updateDomainAwareComparisonButtonLabel;

  window.openComparisonPanel = function(){
    if(isPharmaDomain()) return openPharmaComparisonPanel();
    if(typeof previous.openComparisonPanel === "function") return previous.openComparisonPanel.apply(this, arguments);
  };

  window.toggleComparisonPanel = function(){
    const panel = byId("comparisonPanel");
    if(!panel) return;
    if(panel.classList.contains("open")){
      if(typeof window.closeComparisonPanel === "function") return window.closeComparisonPanel();
      panel.classList.remove("open");
      return;
    }
    return window.openComparisonPanel();
  };

  window.renderComparisonPanel = function(){
    if(isPharmaDomain()) return renderPharmaComparisonPanel();
    if(typeof previous.renderComparisonPanel === "function") return previous.renderComparisonPanel.apply(this, arguments);
  };

  window.renderComparisonPanelIfOpen = function(){
    if(isPharmaDomain()) return renderPharmaComparisonPanelIfOpen();
    if(typeof previous.renderComparisonPanelIfOpen === "function") return previous.renderComparisonPanelIfOpen.apply(this, arguments);
  };

  window.setComparisonPoint = function(pointOrHerb, slotIndex, options){
    if(isPharmaDomain()) return setPharmaComparisonHerb(pointOrHerb, slotIndex, options || {autoOpen:false});
    if(typeof previous.setComparisonPoint === "function") return previous.setComparisonPoint.apply(this, arguments);
  };

  window.addPointToComparison = function(pointOrHerb, options){
    if(isPharmaDomain()) return addPharmaHerbToComparison(pointOrHerb, options || {autoOpen:false});
    if(typeof previous.addPointToComparison === "function") return previous.addPointToComparison.apply(this, arguments);
  };

  window.clearComparisonPoint = function(slotIndex){
    if(isPharmaDomain()) return clearPharmaComparisonHerb(slotIndex);
    if(typeof previous.clearComparisonPoint === "function") return previous.clearComparisonPoint.apply(this, arguments);
  };

  window.togglePharmaComparisonHerb = togglePharmaComparisonHerb;

  window.togglePharmaFilterLogic = togglePharmaFilterLogic;
  window.setPharmaFilterLogic = setPharmaFilterLogic;
  window.openPharmaSearchForClass = openPharmaSearchForClass;
  window.openPharmaSearchForAction = openPharmaSearchForAction;
  window.updatePharmaFilterSelectionState = updatePharmaFilterSelectionState;
  window.handlePharmaFilterActiveToggle = handlePharmaFilterActiveToggle;

  window.getPharmaFieldTokenLabels = fieldTokenLabels;
  window.getPharmaDisplayFieldLabels = getDisplayFieldLabels;

  window.togglePharmaBasketHerb = togglePharmaBasketHerb;
  window.addPharmaHerbToBasket = addPharmaBasketHerb;
  window.removePharmaBasketHerb = removePharmaBasketHerb;
  window.updatePharmaBasketButtons = updatePharmaBasketButtons;
  window.clearPharmaBasket = clearPharmaBasket;
  window.openPharmaBasketLineWithKeyboard = function(event, herbId){
    if(event.key === "Enter" || event.key === " "){
      event.preventDefault();
      if(typeof window.openPharmaHerbPanel === "function") window.openPharmaHerbPanel(herbId);
    }
  };

  document.addEventListener("click", event => {
    const classLink = event.target?.closest?.("[data-pharma-search-class]");
    if(classLink && isPharmaDomain()){
      event.preventDefault();
      event.stopPropagation();
      openPharmaSearchForClass(classLink.dataset.pharmaSearchClass || "");
      return;
    }

    const actionLink = event.target?.closest?.("[data-pharma-search-action]");
    if(actionLink && isPharmaDomain()){
      event.preventDefault();
      event.stopPropagation();
      openPharmaSearchForAction(actionLink.dataset.pharmaSearchAction || "");
    }
  });

  document.addEventListener("input", event => {
    const editable = event.target?.closest?.("[data-pharma-compare-edit]");
    if(!editable || !isPharmaDomain()) return;
    const herbId = editable.dataset.pharmaHerbId || "";
    const field = editable.dataset.pharmaCompareEdit || "";
    if(!herbId) return;

    const text = String(editable.innerText || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if(field === "esprit"){
      setStoredText(ESPRIT_STORAGE_PREFIX, herbId, text);
    }else if(field === "notes"){
      setStoredText(NOTES_STORAGE_PREFIX, herbId, text);
    }
  });

  document.addEventListener("paste", event => {
    const editable = event.target?.closest?.("[data-pharma-compare-edit]");
    if(!editable || !isPharmaDomain()) return;
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    document.execCommand("insertText", false, text);
  });

  document.addEventListener("pharma-herb-edited", () => {
    renderPharmaComparisonPanelIfOpen();
  });

  function syncPharmaSidePanelLayout(){
    const root = document.documentElement;

    function clearPanelSpace(){
      root.style.removeProperty("--pharma-left-occlusion");
      root.style.removeProperty("--pharma-right-occlusion");
    }

    if(!isPharmaDomain()){
      root.classList.remove("pharma-left-panel-open", "pharma-right-panel-open");
      clearPanelSpace();
      return;
    }

    const cheatsheetPanel = byId("cheatsheetPanel");
    const herbPanel = byId("pointPanel");
    const cheatsheetOpen = !!cheatsheetPanel?.classList.contains("open");
    const herbPanelOpen = !!herbPanel?.classList.contains("open");

    root.classList.toggle("pharma-left-panel-open", cheatsheetOpen);
    root.classList.toggle("pharma-right-panel-open", herbPanelOpen);

    if(window.innerWidth < 900){
      clearPanelSpace();
      return;
    }

    // Calcul linéaire : on réserve simplement la largeur réelle des panneaux ouverts.
    // Ne dépend pas de la position du body, afin d’éviter l’effet de rétroaction/exponentiel.
    const leftOverlap = cheatsheetOpen && cheatsheetPanel ? (cheatsheetPanel.offsetWidth || 0) : 0;
    const rightOverlap = herbPanelOpen && herbPanel ? (herbPanel.offsetWidth || 0) : 0;

    root.style.setProperty("--pharma-left-occlusion", `${Math.ceil(leftOverlap)}px`);
    root.style.setProperty("--pharma-right-occlusion", `${Math.ceil(rightOverlap)}px`);
  }

  const observer = new MutationObserver(mutations => {
    if(mutations.some(item => item.attributeName === "data-study-domain")){
      syncToolButtonTitles();
      syncPharmaSidePanelLayout();
    }
  });

  const sidePanelObserver = new MutationObserver(() => syncPharmaSidePanelLayout());

  function initPharmaTools(){
    observer.observe(document.documentElement, {attributes:true});
    ["cheatsheetPanel", "pointPanel"].forEach(id => {
      const panel = byId(id);
      if(panel) sidePanelObserver.observe(panel, {attributes:true, attributeFilter:["class"]});
    });
    syncToolButtonTitles();
    syncPharmaSidePanelLayout();
    window.addEventListener("resize", syncPharmaSidePanelLayout, {passive:true});
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initPharmaTools);
  }else{
    initPharmaTools();
  }
})();
