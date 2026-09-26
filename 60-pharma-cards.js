/* ============================================================
   60-pharma-cards.js
   Cartes de révision imprimables, pour les substances médicinales ET
   pour les points d'acupuncture : 8 cartes par feuille A4 (2 colonnes
   x 4 lignes, rectangles égaux), choix des cartes, des champs du recto
   et du verso, impression recto-verso avec le verso repositionné selon
   le sens de retournement de la feuille. Noir et blanc uniquement : les
   étiquettes (nature, saveur, catégories…) sont des rectangles et les
   nomenclatures (tropisme, canal) des cercles, à colorier soi-même.
   Le document imprimé est totalement indépendant du CSS du jeu (page
   HTML autonome ouverte dans un nouvel onglet) : "Imprimer" ou
   "Enregistrer en PDF" depuis la boîte de dialogue du navigateur.
   ============================================================ */
(function(){
  "use strict";

  const SETTINGS_KEY = "mtc_pharma_cards_settings_v1";
  const HERB_BASKET_KEY = "mtc_pharma_review_basket_v1";
  const CARDS_PER_SHEET = 8;
  const COLS = 2;
  const ROWS = 4;
  // 297 mm / 4 = 74.25 mm : on retire un soupçon (74.1) pour que la feuille
  // tienne dans la page sans provoquer de page blanche finale (arrondis du
  // navigateur), la même géométrie étant utilisée au recto et au verso.
  const SLOT_W_MM = 105;
  const SLOT_H_MM = 74.1;

  // Champs "d'identité" : affichés en en-tête de carte (le reste = détails).
  const IDENTITY_KEYS = ["code", "classe", "canal", "hanzi", "pinyin", "nom"];

  const POINT_CANAL_ORDER = ["P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F", "RM", "DM"];
  const POINT_CODE_REGEX = /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)(\d+)$/;

  const DEFAULT_OPTIONS = {
    mode:"duplex",
    flip:"long",
    dx:0,
    dy:0,
    margin:4.5,
    cutlines:true
  };

  let settings = null;
  let modal = null;
  let previewTimer = 0;
  let hdRestoreTried = false;
  let hdMessage = "";

  // --- Utilitaires ----------------------------------------------------------

  function esc(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeSearch(value){
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLocaleLowerCase("fr-FR");
  }

  function cap(text){
    const t = String(text || "").trim();
    return t ? t.charAt(0).toLocaleUpperCase("fr-FR") + t.slice(1) : "";
  }

  function readJson(key, fallback){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed == null ? fallback : parsed;
    }catch(error){ return fallback; }
  }

  function storedOr(prefix, id, fallback){
    try{
      const value = localStorage.getItem(prefix + id);
      return value === null ? fallback : value;
    }catch(error){ return fallback; }
  }

  function cleanText(value){
    return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim();
  }

  // Une ligne par élément, sans les puces/émojis de tête ("•", "➢", "-", "🖇️"…).
  function linesOf(value){
    return cleanText(value)
      .split("\n")
      .map(line => line.replace(/^[\s•\-–·*➢\p{Extended_Pictographic}️‍]+/u, "").trim())
      .filter(Boolean);
  }

  // --- Analyse des valeurs nature / saveur / tropisme (substances) ------------

  // Sépare sur , ; et retours à la ligne, sauf à l'intérieur de parenthèses
  // (ex. "Froid (Frais selon certain.es)" reste un seul élément).
  function splitTopLevel(text){
    const out = [];
    let depth = 0;
    let current = "";
    for(const ch of String(text || "")){
      if(ch === "(") depth++;
      else if(ch === ")") depth = Math.max(0, depth - 1);
      if(depth === 0 && (ch === "," || ch === ";" || ch === "\n")){
        out.push(current);
        current = "";
      }else{
        current += ch;
      }
    }
    out.push(current);
    return out.map(item => item.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  const SAVEUR_WORDS = /^(acide|amer|amère|doux|piquant|piquent|sal[ée]|astringent|fade|insipide)$/i;

  // Certaines saveurs sont saisies séparées par un simple espace
  // ("Piquant Amer") : on ne les scinde que si CHAQUE mot est une saveur connue.
  function splitSaveur(text){
    const out = [];
    splitTopLevel(text).forEach(token => {
      if(!/[()\/+]/.test(token)){
        const words = token.split(" ");
        if(words.length > 1 && words.every(word => SAVEUR_WORDS.test(word))){
          out.push(...words);
          return;
        }
      }
      out.push(token);
    });
    return out.map(cap);
  }

  // La toxicité est saisie dans le même champ que la nature ("Tiède, Toxique",
  // "Tiède (Faible toxicité)") : rectangle en pointillés à part.
  function splitNature(text){
    const nature = [];
    const toxicity = [];
    splitTopLevel(text).forEach(token => {
      let rest = token.replace(/\(([^)]*toxi[^)]*)\)/ig, (match, inner) => {
        toxicity.push(cap(inner.trim()));
        return "";
      }).replace(/\s+/g, " ").trim();
      if(!rest) return;
      if(/toxi/i.test(rest)) toxicity.push(cap(rest));
      else nature.push(cap(rest));
    });
    // "Neutre / Equilibré" est UNE seule nature (le jeu l'affiche en deux
    // morceaux) : un seul rectangle, pas deux à colorier.
    for(let i = 0; i < nature.length - 1; i++){
      if(/^neutre$/i.test(nature[i]) && /^[eé]quilibr/i.test(nature[i + 1])){
        nature.splice(i, 2, "Neutre / Équilibré");
      }
    }
    return {nature, toxicity};
  }

  // Tropisme : on retrouve chaque organe cité (même écrit de façons variées :
  // "Rein", "Reins", "Esto.", "(GI)", "[canaux VB"…) et on l'affiche par sa
  // nomenclature (P, GI, E, Rt, C, IG, V, Rn, EC, TF, VB, F). Ordre d'apparition.
  const TROPISM_PATTERNS = [
    ["EC", "enveloppe du coeur|maitre du coeur|pericarde|\\bec\\b"],
    ["TF", "triple rechauffeur|trois foyers|san jiao|\\btf\\b"],
    ["VB", "vesicule biliaire|\\bvb\\b"],
    ["GI", "gros intestins?|\\bgi\\b"],
    ["IG", "intestin gr[eê]le|\\big\\b"],
    ["P", "poumons?|\\bp\\b"],
    ["E", "estomac|esto\\b\\.?|\\be\\b"],
    ["Rt", "rate|\\brt\\b"],
    ["C", "coeur|\\bc\\b"],
    ["V", "vessie|\\bv\\b"],
    ["Rn", "reins?|\\brn\\b"],
    ["F", "foie|\\bf\\b"]
  ];
  const TROPISM_REGEX = new RegExp(TROPISM_PATTERNS.map(item => "(" + item[1] + ")").join("|"), "g");

  function tropismCodes(text){
    const plain = String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/Œ/g, "oe").toLowerCase();
    const codes = [];
    for(const match of plain.matchAll(TROPISM_REGEX)){
      const index = match.slice(1).findIndex(group => group !== undefined);
      const code = TROPISM_PATTERNS[index][0];
      if(!codes.includes(code)) codes.push(code);
    }
    return codes;
  }

  const rects = labels => labels.map(label => ({kind:"rect", label}));

  function natureTags(record){
    const parts = splitNature(record.nature);
    return rects(parts.nature).concat(parts.toxicity.map(label => ({kind:"rect", label, tox:true})));
  }

  function saveurTags(record){
    return rects(splitSaveur(record.saveur));
  }

  // Pris élément par élément : les organes deviennent des cercles (sans
  // doublon), un élément qui n'est pas un organe (ex. le niveau "Shào yīn"
  // que le jeu ajoute après les codes) reste un rectangle.
  function tropismeTags(record){
    const seen = new Set();
    const orbs = [];
    const extras = [];
    splitTopLevel(record.tropisme).forEach(token => {
      const codes = tropismCodes(token);
      if(codes.length){
        codes.forEach(code => {
          if(!seen.has(code)){ seen.add(code); orbs.push({kind:"orb", label:code}); }
        });
      }else{
        const label = cap(token.replace(/[\[\]()]/g, "").trim());
        if(label) extras.push({kind:"rect", label});
      }
    });
    return orbs.concat(extras);
  }

  // --- Champs, préréglages et jeux de données ----------------------------------

  const HERB_FIELDS = [
    {key:"code", label:"Code (ex. AF3), en gris dans le coin", kind:"code"},
    {key:"classe", label:"Classe", kind:"classe"},
    {key:"hanzi", label:"Hanzi", kind:"hanzi"},
    {key:"pinyin", label:"Pinyin", kind:"pinyin"},
    {key:"nom", label:"Nom français", kind:"nom"},
    {key:"nature", label:"Nature (rectangles à colorier)", kind:"shapes", title:"Nature", tags:natureTags},
    {key:"saveur", label:"Saveur (rectangles à colorier)", kind:"shapes", title:"Saveur", tags:saveurTags},
    {key:"tropisme", label:"Tropisme (nomenclature en cercle)", kind:"shapes", title:"Tropisme", tags:tropismeTags},
    {key:"posologie", label:"Posologie", kind:"inline", title:"Posologie"},
    {key:"actions", label:"Actions", kind:"list", title:"Actions"},
    {key:"esprit", label:"Esprit", kind:"block", title:"Esprit"},
    {key:"indications", label:"Indications", kind:"block", title:"Indications"},
    {key:"contre_indications", label:"Contre-indications", kind:"block", title:"Contre-indications"},
    {key:"precaution", label:"Précaution", kind:"block", title:"Précaution"},
    {key:"associations", label:"Associations", kind:"block", title:"Associations"},
    {key:"vs", label:"VS.", kind:"block", title:"VS."},
    {key:"formules", label:"Formules", kind:"block", title:"Formules"},
    {key:"synonymes", label:"Synonymes", kind:"block", title:"Synonymes"},
    {key:"synthese", label:"Synthèse", kind:"block", title:"Synthèse"},
    {key:"ingredients", label:"Ingrédients", kind:"block", title:"Ingrédients"},
    {key:"recherches_modernes", label:"Recherches modernes", kind:"block", title:"Recherches modernes"},
    {key:"preparation", label:"Préparation", kind:"block", title:"Préparation"},
    {key:"notes", label:"Notes", kind:"block", title:"Notes"},
    {key:"image", label:"Image locale", kind:"image"}
  ];

  const HERB_PRESETS = {
    pinyin:{
      label:"Pinyin + hanzi → le reste",
      recto:["code", "hanzi", "pinyin"],
      verso:["nom", "nature", "saveur", "tropisme", "posologie", "actions"]
    },
    nom:{
      label:"Nom français → le reste",
      recto:["code", "nom"],
      verso:["hanzi", "pinyin", "nature", "saveur", "tropisme", "posologie", "actions"]
    },
    actions:{
      label:"Actions → la substance",
      recto:["actions"],
      verso:["code", "hanzi", "pinyin", "nom", "nature", "saveur", "tropisme", "posologie"]
    }
  };

  const POINT_FIELDS = [
    {key:"code", label:"Code du point (ex. GI 4)", kind:"code"},
    {key:"canal", label:"Canal (nomenclature en cercle)", kind:"canal"},
    {key:"hanzi", label:"Hanzi", kind:"hanzi"},
    {key:"pinyin", label:"Pinyin", kind:"pinyin"},
    {key:"nom", label:"Nom français", kind:"nom"},
    {key:"categories", label:"Catégories du point (rectangles à colorier)", kind:"shapes", title:"Catégories", tags:record => rects(record.categories)},
    {key:"correspondances", label:"Correspondances (rectangles à colorier)", kind:"shapes", title:"Correspondances", tags:record => rects(record.correspondances)},
    {key:"localisation", label:"Localisation", kind:"block", title:"Localisation"},
    {key:"methode_localisation", label:"Méthode de localisation", kind:"block", title:"Méthode de localisation"},
    {key:"methode_travail", label:"Méthode de travail", kind:"block", title:"Méthode de travail"},
    {key:"actions", label:"Actions", kind:"list", title:"Actions"},
    {key:"indications", label:"Indications", kind:"list", title:"Indications"},
    {key:"psycho", label:"Indications psycho-émotionnelles (privé)", kind:"list", title:"Indications psycho-émotionnelles", adminOnly:true},
    {key:"esprit", label:"Esprit", kind:"block", title:"Esprit"},
    {key:"associations", label:"Associations", kind:"block", title:"Associations"},
    {key:"vs", label:"VS.", kind:"block", title:"VS."},
    {key:"precaution", label:"Précaution", kind:"block", title:"Précaution"},
    {key:"notes", label:"Notes", kind:"block", title:"Notes"},
    {key:"extras", label:"Sections ajoutées via la synchro (ex. psycho-émotionnel)", kind:"extras"},
    {key:"image_memo", label:"Image mémo (sans nom ni code)", kind:"image"},
    {key:"image", label:"Image locale", kind:"image"}
  ];

  const POINT_PRESETS = {
    code:{
      label:"Code + canal → le reste",
      recto:["code", "canal"],
      verso:["code", "pinyin", "hanzi", "nom", "categories", "localisation", "actions"]
    },
    pinyin:{
      label:"Pinyin + hanzi → code et fiche",
      recto:["hanzi", "pinyin"],
      verso:["code", "canal", "nom", "categories", "localisation", "actions"]
    },
    localisation:{
      label:"Localisation → le point",
      recto:["localisation"],
      verso:["code", "canal", "pinyin", "hanzi", "nom", "categories", "actions"]
    }
  };

  // Cartes "catégorie / image HD" : recto = catégorie(s) du point + actions,
  // verso = image de localisation la plus grande possible + nomenclature et
  // noms. Une carte par point appartenant à au moins une catégorie du jeu.
  const HD_FIELDS = [
    {key:"catphrases", label:"Catégorie(s) du point, avec le canal", kind:"shapes", title:"Catégories", big:true, tags:record => rects(record.catphrases)},
    {key:"actions", label:"Actions", kind:"list", title:"Actions"},
    {key:"code", label:"Nomenclature (ex. E 34)", kind:"code"},
    {key:"hanzi", label:"Nom chinois — hanzi", kind:"hanzi"},
    {key:"pinyin", label:"Nom chinois — pinyin", kind:"pinyin"},
    {key:"nom", label:"Nom français", kind:"nom"},
    {key:"image_hd", label:"Image de localisation (HD, dossier local)", kind:"hdimage"}
  ];

  const HD_PRESETS = {
    std:{
      label:"Catégorie + actions → image et noms",
      recto:["catphrases", "actions"],
      verso:["code", "hanzi", "pinyin", "nom", "image_hd"]
    }
  };

  // --- Jeu de données : substances ---------------------------------------------

  function allHerbs(){
    return Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
  }

  function herbRecord(id){
    return typeof window.getPharmaHerbCardRecord === "function" ? window.getPharmaHerbCardRecord(id) : null;
  }

  function herbItems(){
    const classes = Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];
    const order = classes.map(item => item.code);
    const herbs = allHerbs();
    herbs.forEach(herb => { if(!order.includes(herb.classCode)) order.push(herb.classCode); });
    const items = [];
    order.forEach(code => {
      const name = (classes.find(item => item.code === code) || {}).nom || code;
      herbs.filter(herb => herb.classCode === code).forEach(herb => {
        items.push({
          id:herb.id,
          group:code,
          groupName:name,
          code:herb.code || herb.id,
          title:(herb.pinyin || herb.pinyinSansTons || herb.code || herb.id) + (herb.hanzi ? " · " + herb.hanzi : ""),
          sub:herb.nom || "",
          priority:Boolean(herb.prioritaire),
          search:normalizeSearch([herb.pinyin, herb.pinyinSansTons, herb.hanzi, herb.nom, herb.code, herb.classe].join(" "))
        });
      });
    });
    return items;
  }

  // --- Jeu de données : points d'acupuncture ------------------------------------

  function pointDetails(){
    return window.POINT_DETAILS && typeof window.POINT_DETAILS === "object" ? window.POINT_DETAILS : {};
  }

  function pointCanal(id){
    const match = String(id).match(POINT_CODE_REGEX);
    return match ? match[1] : "";
  }

  function pointCode(id){
    return typeof window.formatPointCode === "function" ? window.formatPointCode(id) : String(id);
  }

  function pointImage(prefix, id){
    try{
      return window.MTC_IMAGE_STORE ? (window.MTC_IMAGE_STORE.getImage(prefix, String(id)) || "") : "";
    }catch(error){ return ""; }
  }

  // Valeurs "effectives" d'un point : fiche publiée + ajouts locaux
  // (notes, associations, esprit, vs, précautions, images), comme dans la
  // fiche et le comparateur du jeu.
  function pointRecord(id){
    const details = pointDetails()[id];
    if(!details) return null;
    const note = typeof window.getEditablePointNote === "function"
      ? window.getEditablePointNote(id, details.notes || "")
      : storedOr("mtc_point_note_", id, details.notes || "");
    const extras = Array.isArray(details.__githubExtraFields)
      ? details.__githubExtraFields
        .filter(field => field && field.label && field.value)
        .map(field => ({key:String(field.key || ""), label:String(field.label), value:cleanText(field.value)}))
      : [];
    const psychoField = extras.find(field => /psycho/i.test(field.key));
    return {
      id,
      code:pointCode(id),
      canal:pointCanal(id),
      pinyin:cleanText(details.pinyin),
      hanzi:cleanText(details.hanzi),
      nom:cleanText(details.nom_francais || details.nom_complet),
      categories:linesOf(details.categories_du_point),
      correspondances:linesOf(details.correspondances),
      localisation:cleanText(details.localisation),
      methode_localisation:cleanText(details.methode_localisation),
      methode_travail:cleanText(details.methode_travail),
      actions:linesOf(details.actions),
      indications:linesOf(details.indications),
      psycho:psychoField ? linesOf(psychoField.value) : [],
      esprit:cleanText(storedOr("mtc_point_esprit_", id, details.esprit || "")),
      associations:cleanText(storedOr("mtc_point_associations_", id, details.associations || "")),
      vs:cleanText(storedOr("mtc_point_vs_", id, details.vs || details.comparaison || "")),
      precaution:cleanText(storedOr("mtc_point_precaution_", id, details.precaution || details.precautions || "")),
      notes:cleanText(note),
      extras,
      image:pointImage("mtc_point_image_", id),
      image_memo:pointImage("mtc_point_image_memo_", id)
    };
  }

  function pointIds(){
    let ids = [];
    try{
      if(typeof window.allSearchPoints === "function") ids = window.allSearchPoints();
    }catch(error){ ids = []; }
    if(!Array.isArray(ids) || !ids.length) ids = Object.keys(pointDetails());
    const known = pointDetails();
    return ids.map(String).filter(id => known[id]);
  }

  function pointItems(){
    // CANAL_LABELS est une const top-level de 04-03-core-game.js (pas une propriété de window).
    const labels = typeof CANAL_LABELS === "object" && CANAL_LABELS ? CANAL_LABELS : {};
    const details = pointDetails();
    const groups = {};
    pointIds().forEach(id => {
      const canal = pointCanal(id);
      (groups[canal] = groups[canal] || []).push(id);
    });
    const items = [];
    POINT_CANAL_ORDER.concat([""]).forEach(canal => {
      (groups[canal] || []).forEach(id => {
        const d = details[id] || {};
        items.push({
          id,
          group:canal || "autres",
          groupName:canal ? canal + " — " + (labels[canal] || canal) : "Autres points (hors méridien)",
          code:pointCode(id),
          title:(d.pinyin || pointCode(id)) + (d.hanzi ? " · " + d.hanzi : ""),
          sub:d.nom_francais || d.nom_complet || "",
          priority:false,
          psycho:Array.isArray(d.__githubExtraFields) && d.__githubExtraFields.some(field => field && /psycho/i.test(field.key || "") && field.value),
          search:normalizeSearch([pointCode(id), id, d.pinyin, d.hanzi, d.nom_francais, d.nom_complet, labels[canal]].join(" "))
        });
      });
    });
    return items;
  }

  function pointBasketIds(){
    try{
      const list = typeof window.getReviewBasket === "function" ? window.getReviewBasket() : [];
      return Array.isArray(list) ? list.map(String) : [];
    }catch(error){ return []; }
  }

  function herbBasketIds(){
    const list = readJson(HERB_BASKET_KEY, []);
    return Array.isArray(list) ? list.map(String) : [];
  }

  // --- Cartes catégorie / image HD --------------------------------------------

  // Libellé de chaque appartenance à une catégorie, formulé comme dans le quiz
  // ("Xì-Crevasse du Zú yáng míng") mais avec "Point" devant et le singulier
  // pour les catégories nommées au pluriel.
  const HD_CATEGORY_OVERRIDES = {
    Points_generaux:"Point général",
    Les_4_mers:"Point des 4 mers",
    Points_fantomes_de_Sun_Si_Miao:"Point fantôme de Sūn Sī Miǎo"
  };

  let hdCategoryCache = null;

  // Index point -> lignes de catégorie, calculé depuis les catégories du jeu
  // (buildPool, la même source que la grille et le quiz).
  function hdCategoryIndex(){
    if(hdCategoryCache) return hdCategoryCache;
    const index = {};
    let pool = [];
    try{ pool = typeof buildPool === "function" ? buildPool() : []; }catch(error){ pool = []; }
    pool.forEach(category => {
      (category.points || []).forEach(point => {
        const phrases = typeof window.mtcQuizPointPhrases === "function"
          ? window.mtcQuizPointPhrases(category.key, category.name, point)
          : {categoryPhrase:String(category.name || ""), canalPhrase:""};
        const canal = phrases.canalPhrase ? " " + phrases.canalPhrase : "";
        const line = HD_CATEGORY_OVERRIDES[category.key]
          ? HD_CATEGORY_OVERRIDES[category.key] + canal
          : "Point " + phrases.categoryPhrase + canal;
        (index[point] = index[point] || []).push(line);
      });
    });
    hdCategoryCache = index;
    return index;
  }

  // Choix de l'image quand un point en a plusieurs (fichiers "E18_1.jpg",
  // "E18_2.jpg"…) : une seule image par défaut (la n°1), sauf indication
  // contraire ci-dessous — numéros des images à garder, dans l'ordre.
  const HD_IMAGE_PRIORITY = {
    E1:[1],
    E18:[2],
    GI15:[1],
    GI19:[1],
    GI20:[2],
    Rt10:[2],
    Rt15:[2],
    VB31:[1, 2],
    C7:[1],
    EC3:[1],
    EC8:[1],
    EC9:[1, 2],
    F4:[1, 2],
    GI11:[1],
    IG3:[2],
    Rt9:[1, 2],
    V28:[1],
    VB30:[1, 2]
  };
  const HD_DB_NAME = "mtc_cards_hd_images";
  const HD_IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;

  const HD_IMAGES = {
    entries:new Map(),   // id -> [{variant, name, blob|url}]
    urlCache:new Map(),  // name -> adresse d'objet (blob:)
    setEntries(list){
      this.entries = new Map();
      (list || []).forEach(entry => {
        if(!this.entries.has(entry.id)) this.entries.set(entry.id, []);
        this.entries.get(entry.id).push(entry);
      });
      this.entries.forEach(items => items.sort((a, b) => a.variant - b.variant));
    },
    // Outil de test : {id: [adresses]}.
    setUrls(object){
      const list = [];
      Object.keys(object || {}).forEach(id => {
        [].concat(object[id]).forEach((url, index) => list.push({id, variant:index + 1, name:id + "_" + index, url}));
      });
      this.setEntries(list);
    },
    urlOf(entry){
      if(entry.url) return entry.url;
      if(!this.urlCache.has(entry.name)) this.urlCache.set(entry.name, URL.createObjectURL(entry.blob));
      return this.urlCache.get(entry.name);
    },
    processed:new Map(), // clé (fichier + réglages + repères) -> adresse de l'image optimisée
    chosenEntries(id){
      const items = this.entries.get(String(id)) || [];
      if(!items.length) return [];
      const wanted = HD_IMAGE_PRIORITY[id];
      let chosen;
      if(wanted){
        chosen = wanted.map(variant => items.find(entry => entry.variant === variant)).filter(Boolean);
        if(!chosen.length) chosen = [items[0]];
      }else{
        chosen = [items[0]];
      }
      return chosen;
    },
    bwKey(entry){
      return entry.name + "|" + settings.hdBWLevel + "|" + (settings.hdDots ? "d" : "n") + "|" + hdMarkers.signature(entry.name);
    },
    get(id){
      const useBW = Boolean(settings && settings.hdBW);
      return this.chosenEntries(id).map(entry => {
        if(useBW){
          const optimized = this.processed.get(this.bwKey(entry));
          if(optimized) return optimized;
        }
        return this.urlOf(entry);
      });
    },
    size(){ return this.entries.size; }
  };

  // Nom de fichier -> point : "E34.jpg", "rt10_2.jpg" (sans tenir compte des
  // majuscules) ou, pour les points hors méridien, le pinyin sans accents ni
  // espaces ("AnMian.jpg" -> Ān mián).
  let hdNameIndex = null;

  function hdKey(text){
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function hdBuildNameIndex(){
    const ids = {};
    const pinyin = {};
    const details = pointDetails();
    Object.keys(details).forEach(id => {
      ids[id.toLowerCase()] = id;
      const key = hdKey(details[id].pinyin);
      if(key && !pinyin[key]) pinyin[key] = id;
    });
    hdNameIndex = {ids, pinyin};
  }

  function hdMatchFileName(fileName){
    if(!hdNameIndex) hdBuildNameIndex();
    const base = String(fileName).replace(/\.[^.]+$/, "");
    const match = base.match(/^(.*?)(?:_(\d+))?$/);
    const key = match[1];
    const id = hdNameIndex.ids[key.toLowerCase()] || (!POINT_CODE_REGEX.test(key) ? hdNameIndex.pinyin[hdKey(key)] : "");
    return id ? {id, variant:match[2] ? Number(match[2]) : 0} : null;
  }

  // --- Mémorisation dans le navigateur (IndexedDB) : le dossier n'est à
  // choisir qu'une fois, pas à chaque ouverture. ---------------------------

  function hdOpenDb(){
    return new Promise((resolve, reject) => {
      if(typeof indexedDB === "undefined"){ reject(new Error("IndexedDB indisponible")); return; }
      const request = indexedDB.open(HD_DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("images", {keyPath:"name"});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function hdSaveEntries(list){
    const db = await hdOpenDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      store.clear();
      list.forEach(entry => store.put({name:entry.name, id:entry.id, variant:entry.variant, blob:entry.blob}));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function hdLoadEntries(){
    const db = await hdOpenDb();
    const list = await new Promise((resolve, reject) => {
      const request = db.transaction("images", "readonly").objectStore("images").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return list;
  }

  async function hdForget(){
    try{
      const db = await hdOpenDb();
      await new Promise(resolve => {
        const tx = db.transaction("images", "readwrite");
        tx.objectStore("images").clear();
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
      db.close();
    }catch(error){}
    HD_IMAGES.setEntries([]);
  }

  // Dossier (ou fichiers) choisi par l'utilisatrice : on garde les images
  // reconnues, chacune sous son nom de fichier ; le reste est ignoré.
  async function hdLoadFiles(fileList){
    const files = Array.from(fileList || []).filter(file => HD_IMAGE_EXT.test(file.name));
    const list = [];
    let ignored = 0;
    files.forEach(file => {
      const match = hdMatchFileName(file.name);
      if(match) list.push({id:match.id, variant:match.variant, name:file.name, blob:file});
      else ignored++;
    });
    HD_IMAGES.setEntries(list);
    let saved = true;
    try{ await hdSaveEntries(list); }catch(error){ saved = false; }
    return {matched:list.length, ignored, saved};
  }

  async function hdRestore(){
    if(HD_IMAGES.size()) return true;
    try{
      const list = await hdLoadEntries();
      if(list.length) HD_IMAGES.setEntries(list);
      return list.length > 0;
    }catch(error){ return false; }
  }

  // --- Points des images : détection automatique + corrections -------------------
  // Chaque point est redessiné (contour noir, remplissage blanc). Les points
  // sont d'abord détectés automatiquement (précision privilégiée : un point
  // manqué s'ajoute d'un clic, un faux point se retire d'un clic). Les
  // corrections sont mémorisées par fichier : {add:[[x,y],...], hide:[[x,y],...]}
  // en fractions de la largeur/hauteur. (Ancien format : simple liste = add.)
  // L'outil de vérification n'est proposé qu'avec ?admin=1 dans l'adresse.
  function isAdmin(){
    try{ return new URLSearchParams(window.location.search).get("admin") === "1"; }catch(error){ return false; }
  }
  const HD_MARKERS_KEY = "mtc_cards_hd_markers_v1";
  const HD_DOTS_KEY = "mtc_cards_hd_dots_v3";
  const hdMarkers = {
    data:null,
    load(){
      if(!this.data) this.data = readJson(HD_MARKERS_KEY, {}) || {};
      return this.data;
    },
    get(name){
      const raw = this.load()[name];
      if(!raw) return {add:[], hide:[]};
      if(Array.isArray(raw)) return {add:raw, hide:[]};
      return {add:raw.add || [], hide:raw.hide || []};
    },
    set(name, value){
      const data = this.load();
      if(value && (value.add.length || value.hide.length)) data[name] = value; else delete data[name];
      try{ localStorage.setItem(HD_MARKERS_KEY, JSON.stringify(data)); }catch(error){}
    },
    signature(name){ return JSON.stringify(this.get(name)); },
    count(){ return Object.keys(this.load()).length; }
  };

  async function hdEntryBlob(entry){
    if(entry.blob) return entry.blob;
    return (await fetch(entry.url)).blob();
  }

  // Points détectés automatiquement, gardés en mémoire et dans le navigateur
  // (la détection prend environ 0,3 s par image).
  const hdAuto = {
    data:null,
    pending:new Map(),
    load(){
      if(!this.data) this.data = readJson(HD_DOTS_KEY, {}) || {};
      return this.data;
    },
    peek(name){ return this.load()[name]; },
    get(entry){
      const cached = this.peek(entry.name);
      if(cached) return Promise.resolve(cached);
      if(!window.MTCCardsBW) return Promise.resolve([]);
      if(this.pending.has(entry.name)) return this.pending.get(entry.name);
      const job = (async () => {
        let list = [];
        try{ list = await window.MTCCardsBW.detect(await hdEntryBlob(entry)); }catch(error){ list = []; }
        this.load()[entry.name] = list;
        this.pending.delete(entry.name);
        this.persistSoon();
        return list;
      })();
      this.pending.set(entry.name, job);
      return job;
    },
    persistSoon(){
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        try{ localStorage.setItem(HD_DOTS_KEY, JSON.stringify(this.load())); }catch(error){}
      }, 800);
    }
  };

  function hdNear(a, b, tolerance){
    return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance;
  }

  // Points à dessiner : détectés (sauf ceux que l'utilisatrice a retirés) +
  // ajoutés à la main ; un ajout tombant sur un point détecté reprend sa
  // position et sa taille exactes.
  function hdEffectiveMarkers(name, auto){
    const saved = hdMarkers.get(name);
    const useAuto = !settings || settings.hdDots !== false;
    const autos = useAuto ? (auto || []).filter(a => !saved.hide.some(hide => hdNear(a, hide, 0.02))) : [];
    const used = new Set();
    const adds = saved.add.map(m => {
      const index = autos.findIndex((a, i) => !used.has(i) && hdNear(a, m, Math.max(0.015, (a[2] || 0.01) * 1.6)));
      if(index >= 0){ used.add(index); return autos[index]; }
      return m;
    });
    return autos.filter((a, i) => !used.has(i)).concat(adds);
  }

  // Optimise (noir et blanc) les images des points donnés, si l'option est
  // active ; résultat gardé en mémoire pour ne pas refaire le travail.
  async function hdPrepareBW(ids, onProgress){
    if(!settings || !settings.hdBW || !window.MTCCardsBW) return;
    const jobs = [];
    ids.forEach(id => HD_IMAGES.chosenEntries(id).forEach(entry => {
      const key = HD_IMAGES.bwKey(entry);
      if(!HD_IMAGES.processed.has(key)) jobs.push({entry, key});
    }));
    let done = 0;
    for(const job of jobs){
      try{
        const auto = settings.hdDots ? await hdAuto.get(job.entry) : [];
        const blob = await window.MTCCardsBW.process(await hdEntryBlob(job.entry), {
          level:settings.hdBWLevel,
          markers:hdEffectiveMarkers(job.entry.name, auto)
        });
        HD_IMAGES.processed.set(job.key, URL.createObjectURL(blob));
      }catch(error){
        HD_IMAGES.processed.set(job.key, HD_IMAGES.urlOf(job.entry));
      }
      done++;
      if(onProgress) onProgress(done, jobs.length);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  function hdRecord(id){
    const base = pointRecord(id);
    if(!base) return null;
    return Object.assign({}, base, {
      catphrases:hdCategoryIndex()[id] || [],
      hdImages:HD_IMAGES.get(id)
    });
  }

  // Points appartenant à au moins une catégorie du jeu ; en option, aussi ceux
  // qui n'en ont pas mais dont une image existe dans le dossier.
  function hdItems(){
    const index = hdCategoryIndex();
    const uncategorized = Boolean(settings && settings.hdUncat);
    const librarySize = HD_IMAGES.size();
    return pointItems()
      .filter(item => index[item.id] || (uncategorized && HD_IMAGES.entries.has(item.id)))
      .map(item => Object.assign({}, item, {noimg:librarySize > 0 && !HD_IMAGES.entries.has(item.id)}));
  }

  const DATASETS = {
    herbs:{
      id:"herbs",
      tab:"Substances médicinales",
      nouns:"substance(s)",
      listTitle:"Substances",
      docTitle:"Cartes de révision — substances médicinales",
      intro:"8 cartes par feuille A4, noir et blanc. Nature et saveur sont des rectangles, le tropisme une nomenclature en cercle : à colorier soi-même.",
      groupsLabel:"Toutes les classes",
      hasPriority:true,
      fields:HERB_FIELDS,
      presets:HERB_PRESETS,
      defaultPreset:"pinyin",
      items:herbItems,
      record:herbRecord,
      basketIds:herbBasketIds
    },
    points:{
      id:"points",
      tab:"Points d'acupuncture",
      nouns:"point(s)",
      listTitle:"Points d'acupuncture",
      docTitle:"Cartes de révision — points d'acupuncture",
      intro:"8 cartes par feuille A4, noir et blanc. Les catégories et correspondances sont des rectangles, le canal une nomenclature en cercle : à colorier soi-même.",
      groupsLabel:"Tous les canaux",
      hasPriority:false,
      fields:POINT_FIELDS,
      presets:POINT_PRESETS,
      defaultPreset:"code",
      items:pointItems,
      record:pointRecord,
      basketIds:pointBasketIds
    },
    acuhd:{
      id:"acuhd",
      tab:"Points · image HD",
      nouns:"point(s)",
      listTitle:"Points appartenant à une catégorie",
      docTitle:"Cartes points — catégories et image HD",
      intro:"Une carte par point appartenant à une catégorie du jeu. Recto : catégorie(s) et actions. Verso : image de localisation en grand, nomenclature et noms.",
      groupsLabel:"Tous les canaux",
      hasPriority:false,
      fields:HD_FIELDS,
      presets:HD_PRESETS,
      defaultPreset:"std",
      items:hdItems,
      record:hdRecord,
      basketIds:pointBasketIds
    }
  };

  function datasetDefaults(ds){
    const preset = ds.presets[ds.defaultPreset];
    return {selected:[], recto:preset.recto.slice(), verso:preset.verso.slice()};
  }

  function ds(){ return DATASETS[settings.dataset] || DATASETS.herbs; }
  function cur(){ return settings[ds().id]; }

  function normalizeDatasetSettings(raw, dataset){
    const base = datasetDefaults(dataset);
    const src = raw && typeof raw === "object" ? raw : {};
    return {
      selected:Array.isArray(src.selected) ? src.selected.map(String) : base.selected,
      recto:Array.isArray(src.recto) ? src.recto : base.recto,
      verso:Array.isArray(src.verso) ? src.verso : base.verso
    };
  }

  function loadSettings(){
    const stored = readJson(SETTINGS_KEY, null);
    const src = stored && typeof stored === "object" ? stored : {};
    const merged = Object.assign({}, DEFAULT_OPTIONS);
    ["mode", "flip", "cutlines"].forEach(key => { if(src[key] !== undefined) merged[key] = src[key]; });
    merged.dx = Number(src.dx) || 0;
    merged.dy = Number(src.dy) || 0;
    merged.margin = Number(src.margin) || DEFAULT_OPTIONS.margin;
    merged.hdUncat = Boolean(src.hdUncat);
    merged.hdOnlyImage = src.hdOnlyImage === undefined ? true : Boolean(src.hdOnlyImage);
    merged.hdBW = src.hdBW === undefined ? true : Boolean(src.hdBW);
    merged.hdDots = src.hdDots === undefined ? true : Boolean(src.hdDots);
    merged.hdBWLevel = ["none", "light", "medium", "strong"].includes(src.hdBWLevel) ? src.hdBWLevel : "medium";
    merged.dataset = DATASETS[src.dataset] ? src.dataset : "herbs";
    // Ancien format (avant les points) : selected/recto/verso à la racine = substances.
    merged.herbs = normalizeDatasetSettings(src.herbs || (src.selected ? src : null), DATASETS.herbs);
    merged.points = normalizeDatasetSettings(src.points, DATASETS.points);
    merged.acuhd = normalizeDatasetSettings(src.acuhd, DATASETS.acuhd);
    return merged;
  }

  function saveSettings(){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(error){}
  }

  // --- Rendu d'une carte -----------------------------------------------------

  function fieldHasData(field, record){
    if(typeof field.tags === "function") return field.tags(record).length > 0;
    const value = record[field.key];
    if(field.kind === "list" || field.kind === "extras") return Array.isArray(value) && value.length > 0;
    return Boolean(String(value || "").trim());
  }

  function orbHtml(label){
    const text = String(label);
    return '<span class="orb' + (text.length > 3 ? " long" : "") + '">' + esc(text) + "</span>";
  }

  function tagHtml(item){
    return item.kind === "orb"
      ? orbHtml(item.label)
      : '<span class="rect' + (item.tox ? " tox" : "") + '">' + esc(item.label) + "</span>";
  }

  function cardInnerHtml(record, selectedKeys, fields){
    const fieldList = fields || HERB_FIELDS;
    const selected = new Set(selectedKeys);
    if(selected.has("image_hd") && fieldList.some(field => field.key === "image_hd")) return hdVersoHtml(record, selected);
    const chosen = fieldList.filter(field => selected.has(field.key) && fieldHasData(field, record));
    const identity = chosen.filter(field => IDENTITY_KEYS.includes(field.key));
    const details = chosen.filter(field => !IDENTITY_KEYS.includes(field.key));
    const has = key => identity.some(field => field.key === key);

    const classeHtml = has("classe") ? '<div class="classe">' + esc(record.classe) + "</div>" : "";
    const canalHtml = has("canal") ? orbHtml(record.canal) : "";
    const hanziHtml = has("hanzi") ? '<span class="hanzi">' + esc(record.hanzi) + "</span>" : "";
    const pinyinHtml = has("pinyin") ? '<span class="pinyin">' + esc(record.pinyin) + "</span>" : "";
    const nomHtml = has("nom") ? '<div class="nom">' + esc(record.nom) + "</div>" : "";

    // Recto d'identité seul (aucun détail) : contenu centré et grand.
    if(!details.length){
      const naming = has("hanzi") || has("pinyin") || has("nom");
      // Le code est en gris dans le coin, sauf s'il est la seule chose à
      // deviner/montrer (recto "code + canal") : alors il est grand, au centre.
      const codeBig = has("code") && !naming;
      const corner = has("code") && naming ? '<span class="corner">' + esc(record.code) + "</span>" : "";
      return '<div class="card-inner ident-only' + (corner ? " has-corner" : "") + '">' + corner + classeHtml +
        (codeBig ? '<div class="code-big">' + esc(record.code) + "</div>" : "") +
        canalHtml +
        (hanziHtml ? '<div class="hanzi-big">' + esc(record.hanzi) + "</div>" : "") +
        (pinyinHtml ? '<div class="pinyin-big">' + esc(record.pinyin) + "</div>" : "") +
        nomHtml + "</div>";
    }

    const cornerHtml = has("code") ? '<span class="corner">' + esc(record.code) + "</span>" : "";
    // Une image est présente : elle prend toute la place restante, le reste
    // du contenu est compacté (voir .has-pic dans la feuille de style).
    const hasPic = details.some(field => field.kind === "image");
    // Identité seule + image : l'en-tête peut passer en colonne à gauche
    // quand l'image (portrait) y gagne de la place (choix fait à l'impression).
    const picIdent = hasPic && details.every(field => field.kind === "image");
    let picHtml = "";
    let html = "";
    if(classeHtml || canalHtml) html += '<div class="hd">' + classeHtml + canalHtml + "</div>";
    if(pinyinHtml || hanziHtml) html += '<div class="ident">' + pinyinHtml + hanziHtml + "</div>";
    html += nomHtml;
    if(identity.some(field => field.key !== "code")) html += '<div class="rule"></div>';

    // Étiquettes : rectangles avec le texte dedans, nomenclatures dans un
    // cercle — à colorier. Tout sur une même ligne (qui passe à la suivante
    // si besoin) pour gagner de la place.
    const tagFields = details.filter(field => typeof field.tags === "function");
    if(tagFields.length){
      html += '<div class="tags' + (tagFields.some(field => field.big) ? ' big' : '') + '">' + tagFields.map(field =>
        '<div class="tag-group"><div class="lbl">' + esc(field.title) + '</div><div class="tag-row">' +
        field.tags(record).map(tagHtml).join("") + "</div></div>"
      ).join("") + "</div>";
    }

    details.filter(field => typeof field.tags !== "function").forEach(field => {
      const value = record[field.key];
      if(field.kind === "inline"){
        html += '<div class="inline"><span class="lbl">' + esc(field.title) + "</span> " + esc(value) + "</div>";
      }else if(field.kind === "list"){
        html += '<div class="blk"><div class="lbl">' + esc(field.title) + '</div><ul class="lst' + (value.length >= 5 ? " cols" : "") + '">' +
          value.map(item => "<li>" + esc(item) + "</li>").join("") + "</ul></div>";
      }else if(field.kind === "extras"){
        value.forEach(extra => {
          html += '<div class="blk"><div class="lbl">' + esc(extra.label) + '</div><div class="txt">' + esc(extra.value) + "</div></div>";
        });
      }else if(field.kind === "image"){
        picHtml += '<img class="pic" alt="" src="' + esc(value) + '">';
      }else{
        html += '<div class="blk"><div class="lbl">' + esc(field.title) + '</div><div class="txt">' + esc(value) + "</div></div>";
      }
    });
    return '<div class="card-inner' + (cornerHtml ? " has-corner" : "") + (hasPic ? " has-pic" : "") + (picIdent ? " pic-ident" : "") + '">' + cornerHtml +
      (hasPic ? '<div class="pic-info">' + html + "</div>" + picHtml : html) + "</div>";
  }

  // Verso image : bandeau (ou colonne) de nomenclature + noms, et l'image de
  // localisation la plus grande possible. Le choix bandeau/colonne et
  // l'arrangement des images sont faits à l'impression selon leurs
  // proportions réelles (voir hdLayout dans le script du document).
  function hdVersoHtml(record, selected){
    const has = key => selected.has(key);
    const parts = [];
    if(has("code") && record.code) parts.push('<span class="hd-code">' + esc(record.code) + '</span>');
    if(has("hanzi") && record.hanzi) parts.push('<span class="hd-hanzi">' + esc(record.hanzi) + '</span>');
    if(has("pinyin") && record.pinyin) parts.push('<span class="hd-pinyin">' + esc(record.pinyin) + '</span>');
    if(has("nom") && record.nom) parts.push('<span class="hd-nom">' + esc(record.nom) + '</span>');
    const images = (record.hdImages || []).map(src => '<img alt="" src="' + esc(src) + '">').join("");
    return '<div class="card-inner hd-verso layout-top">' +
      (parts.length ? '<div class="hd-head">' + parts.join("") + '</div>' : "") +
      '<div class="hd-imgs">' + (images || '<span class="hd-noimg">image à ajouter</span>') + '</div></div>';
  }

  function testCardInnerHtml(n, side){
    return '<div class="card-inner ident-only"><div class="lbl">' + (side === "verso" ? "VERSO" : "RECTO") + "</div>" +
      '<div class="hanzi-big">' + n + "</div>" +
      '<div class="nom">' + (side === "verso" ? "au dos de la carte n° " : "carte n° ") + n + "</div></div>";
  }

  // --- Composition des feuilles ---------------------------------------------

  // Le recto occupe les emplacements dans l'ordre de lecture. Au verso, la
  // carte doit tomber exactement AU DOS de son recto une fois la feuille
  // retournée :
  //  - retournement sur le bord LONG (le plus courant, comme tourner la page
  //    d'un livre) : les colonnes sont inversées, les lignes restent ;
  //  - retournement sur le bord COURT (comme un calendrier) : les lignes
  //    sont inversées, les colonnes restent.
  function backSlotSource(row, col, flip){
    return flip === "short" ? (ROWS - 1 - row) * COLS + col : row * COLS + (COLS - 1 - col);
  }

  function slotsFor(chunk, side, flip){
    const slots = new Array(CARDS_PER_SHEET).fill(null);
    for(let row = 0; row < ROWS; row++){
      for(let col = 0; col < COLS; col++){
        const target = row * COLS + col;
        slots[target] = chunk[side === "recto" ? target : backSlotSource(row, col, flip)] || null;
      }
    }
    return slots;
  }

  function cutLinesHtml(){
    let html = '<i class="cut v" style="left:' + SLOT_W_MM + 'mm"></i>';
    for(let row = 1; row < ROWS; row++){
      html += '<i class="cut h" style="top:' + (row * SLOT_H_MM) + 'mm"></i>';
    }
    return html;
  }

  function sheetHtml(slots, side, opts, cardFn){
    const cells = slots.map(item => {
      if(!item) return '<div class="slot empty"></div>';
      return '<div class="slot"><div class="card" data-fs="12">' + cardFn(item, side) + "</div></div>";
    }).join("");
    const cuts = side === "recto" && opts.cutlines ? cutLinesHtml() : "";
    const shift = side === "verso"
      ? ' style="--dx:' + (Number(opts.dx) || 0) + "mm;--dy:" + (Number(opts.dy) || 0) + 'mm"'
      : "";
    return '<section class="sheet ' + side + '"' + shift + '><div class="grid">' + cells + "</div>" + cuts + "</section>";
  }

  // Séquence de pages selon le mode : recto/verso alternés (impression
  // recto-verso automatique), ou seulement les rectos / seulement les versos
  // (recto-verso manuel : on imprime un côté, on remet les feuilles, on
  // imprime l'autre).
  function buildPagesHtml(items, opts, cardFn, limitSheets){
    const chunks = [];
    for(let i = 0; i < items.length; i += CARDS_PER_SHEET) chunks.push(items.slice(i, i + CARDS_PER_SHEET));
    const useChunks = limitSheets ? chunks.slice(0, limitSheets) : chunks;
    const pages = [];
    const recto = chunk => sheetHtml(slotsFor(chunk, "recto", opts.flip), "recto", opts, cardFn);
    const verso = chunk => sheetHtml(slotsFor(chunk, "verso", opts.flip), "verso", opts, cardFn);
    if(opts.mode === "recto") useChunks.forEach(chunk => pages.push(recto(chunk)));
    else if(opts.mode === "verso") useChunks.forEach(chunk => pages.push(verso(chunk)));
    else useChunks.forEach(chunk => { pages.push(recto(chunk)); pages.push(verso(chunk)); });
    return {html:pages.join(""), sheets:chunks.length, pages:opts.mode === "duplex" ? chunks.length * 2 : chunks.length};
  }

  // --- Document imprimable (autonome) ----------------------------------------

  const DOC_CSS = [
    "@page{size:210mm 297mm;margin:0}",
    "*{box-sizing:border-box}",
    "html,body{margin:0;padding:0;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
    "body{font-family:'Libre Baskerville',Georgia,'Times New Roman',serif}",
    ".sheet{position:relative;width:210mm;height:296.6mm;overflow:hidden;background:#fff;break-after:page;page-break-after:always}",
    ".sheet:last-of-type{break-after:auto;page-break-after:auto}",
    ".grid{position:absolute;left:0;top:0;display:grid;grid-template-columns:repeat(2," + SLOT_W_MM + "mm);grid-template-rows:repeat(4," + SLOT_H_MM + "mm)}",
    ".sheet.verso .grid{transform:translate(var(--dx,0mm),var(--dy,0mm))}",
    ".slot{position:relative;width:" + SLOT_W_MM + "mm;height:" + SLOT_H_MM + "mm}",
    ".cut{position:absolute;border:0 dashed #000;opacity:.5;pointer-events:none}",
    ".cut.v{top:0;height:100%;border-left-width:.2mm}",
    ".cut.h{left:0;width:100%;border-top-width:.2mm}",
    ".card{position:absolute;inset:var(--m,4.5mm);border:.35mm solid #000;border-radius:3.2mm;padding:2.6mm 3.2mm;font-size:var(--fs,9pt);line-height:1.25;overflow:hidden}",
    ".card.overflow{border-style:dashed}",
    ".card-inner{position:relative;height:100%;display:flex;flex-direction:column;gap:.4em;overflow:hidden}",
    ".card-inner>*{flex:none;min-width:0}",
    ".hd{display:flex;justify-content:flex-start;align-items:center;gap:.6em}",
    ".classe,.lbl{font-family:Archivo,Arial,sans-serif;font-weight:800;letter-spacing:.07em;text-transform:uppercase;font-size:.6em}",
    ".corner{position:absolute;top:0;right:0;font-family:Archivo,Arial,sans-serif;font-weight:700;font-size:.72em;color:#8a8a8a;letter-spacing:.03em}",
    ".has-corner .hd,.has-corner .ident{padding-right:3.6em}",
    ".ident{display:flex;flex-wrap:wrap;align-items:baseline;gap:.05em .6em}",
    ".pinyin{font-weight:700;font-size:1.5em;line-height:1.1}",
    ".hanzi{font-family:'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun','Source Han Serif SC',serif;font-size:1.45em;line-height:1.1}",
    ".nom{font-style:italic;font-size:.95em}",
    ".rule{border-top:.2mm solid #000;opacity:.45}",
    ".tags{display:flex;flex-wrap:wrap;gap:.25em 1em;align-items:flex-end}",
    ".tag-group{display:flex;flex-direction:column;gap:.15em}",
    ".tag-group .lbl{font-size:.5em;opacity:.75}",
    ".tag-row{display:flex;flex-wrap:wrap;gap:.3em;align-items:center}",
    ".rect{display:inline-block;max-width:42mm;border:.3mm solid #000;border-radius:1mm;padding:.2em .6em;font-family:Archivo,Arial,sans-serif;font-size:.82em;line-height:1.15}",
    ".rect.tox{border-style:dashed}",
    ".orb{display:inline-flex;align-items:center;justify-content:center;width:2.1em;height:2.1em;border:.3mm solid #000;border-radius:50%;font-family:Archivo,Arial,sans-serif;font-weight:700;font-size:.8em;line-height:1}",
    ".orb.long{width:auto;min-width:2.1em;padding:0 .6em;border-radius:99px}",
    ".inline{font-size:.9em}",
    ".inline .lbl{margin-right:.4em}",
    ".blk .txt{white-space:pre-line;font-size:.9em}",
    ".blk .lbl{margin-bottom:.15em}",
    ".lst{list-style:none;margin:0;padding:0;font-size:.9em}",
    ".lst.cols{column-count:2;column-gap:1.2em}",
    ".lst li{position:relative;padding-left:1em;break-inside:avoid}",
    ".lst li::before{content:'\\2022';position:absolute;left:.15em}",
    ".pic{display:block;align-self:center;max-width:100%;height:calc(var(--fs,9pt)*4.5);object-fit:contain}",
    ".has-pic{gap:.2em}",
    ".has-pic .pinyin{font-size:1.1em}",
    ".has-pic .hanzi{font-size:1.05em}",
    ".has-pic .nom{font-size:.8em;line-height:1.1}",
    ".has-pic .rule{display:none}",
    ".has-pic .blk .txt,.has-pic .lst{font-size:.78em;line-height:1.15}",
    ".has-pic .lbl{font-size:.48em;margin-bottom:0}",
    ".has-pic .tag-group .lbl{font-size:.45em}",
    ".has-pic .tags{gap:.1em .6em}",
    ".has-pic .corner{font-size:.6em}",
    ".has-pic.has-corner .hd,.has-pic.has-corner .ident{padding-right:3em}",
    ".has-pic>.pic{flex:1 1 0;min-height:0;width:100%;height:auto;align-self:stretch;object-fit:contain}",
    ".pic-info{display:flex;flex-direction:column;gap:.2em;min-width:0}",
    ".pic-side{flex-direction:row;gap:1.6mm}",
    ".pic-side>.pic-info{flex:0 0 32%;width:32%;padding-top:1.3em}",
    ".pic-side>.pic{width:auto;height:100%;min-width:0;min-height:0;flex:1 1 0}",
    ".has-pic.pic-side .corner{left:0;right:auto}",
    ".has-pic.pic-side .ident,.has-pic.pic-side .hd{padding-right:0}",
    ".pic-side .ident{flex-direction:column;align-items:flex-start;gap:.05em}",
    ".pic-ident:not(.pic-side)>.pic-info{flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:0 .6em;padding-right:3em}",
    ".pic-ident:not(.pic-side) .ident,.pic-ident:not(.pic-side) .hd{padding-right:0}",
    ".pic-ident:not(.pic-side) .nom{margin-left:.1em}",
    ".ident-only{justify-content:center;align-items:center;text-align:center;gap:.3em}",
    ".hanzi-big{font-family:'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun','Source Han Serif SC',serif;font-size:3.6em;line-height:1.05}",
    ".pinyin-big{font-weight:700;font-size:2.1em;line-height:1.1}",
    ".code-big{font-weight:700;font-size:3.6em;line-height:1.05}",
    ".ident-only .nom{font-size:1.15em}",
    ".tags.big .tag-row{flex-direction:column;align-items:flex-start;gap:.35em}",
    ".tags.big .rect{font-size:1.05em;font-weight:700;max-width:100%;padding:.3em .7em}",
    ".card.hd-card{padding:1.8mm 2mm}",
    ".hd-verso{display:flex;gap:1.4mm}",
    ".hd-verso.layout-top{flex-direction:column}",
    ".hd-verso.layout-side{flex-direction:row}",
    ".hd-head{flex:none;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .55em;line-height:1.15}",
    ".layout-side .hd-head{flex-direction:column;flex-wrap:nowrap;width:26mm;align-items:flex-start;gap:.2em}",
    ".hd-code{font-weight:700;font-size:1.55em;line-height:1.05}",
    ".hd-hanzi{font-family:'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun','Source Han Serif SC',serif;font-size:1.3em}",
    ".hd-pinyin{font-weight:700;font-size:.92em}",
    ".hd-nom{font-style:italic;font-size:.8em}",
    ".layout-top .hd-nom{margin-left:auto}",
    ".hd-imgs{flex:1 1 0;min-width:0;min-height:0;display:flex;gap:1mm;align-items:stretch;justify-content:center}",
    ".hd-verso.arr-col .hd-imgs{flex-direction:column}",
    ".hd-imgs img{flex:1 1 0;min-width:0;min-height:0;object-fit:contain}",
    ".hd-noimg{align-self:center;margin:auto;font:italic .7em Archivo,Arial,sans-serif;color:#888}",
    ".toolbar{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #999;padding:10px 14px;font:14px/1.4 Archivo,Arial,sans-serif;display:flex;gap:14px;align-items:center;flex-wrap:wrap}",
    ".toolbar button{font:700 14px Archivo,Arial,sans-serif;padding:9px 16px;border:1.5px solid #000;border-radius:99px;background:#fff;cursor:pointer}",
    ".toolbar .tip{flex:1 1 320px;font-size:13px;color:#333}",
    ".toolbar .warn{flex-basis:100%;font-weight:700}",
    "@media screen{body{background:#d9d9d9}.sheets{padding:10px 0}.sheet{margin:12px auto;box-shadow:0 2px 12px rgba(0,0,0,.3)}body.preview{background:#f4f4f4}body.preview .sheets{display:flex;gap:14px;justify-content:center;align-items:flex-start;padding:6px}body.preview .sheet{margin:0;flex:none}}",
    "@media print{.toolbar{display:none!important}.sheet{margin:0;box-shadow:none}}"
  ].join("\n");

  // Ajuste la taille du texte de chaque carte pour qu'elle tienne dans son
  // cadre (minimum lisible : 5,4 pt) ; une carte encore trop remplie reçoit
  // un cadre en pointillés et une alerte dans la barre d'outils.
  const DOC_SCRIPT = [
    "(function(){",
    "function fit(card){",
    " var inner=card.querySelector('.card-inner');if(!inner)return false;",
    " var fs=parseFloat(card.getAttribute('data-fs'))||9;",
    " var pic=inner.classList.contains('has-pic')?inner.querySelector('.pic'):null;",
    " if(pic)fs=Math.min(fs,8);",
    " card.style.setProperty('--fs',fs+'pt');",
    " function bad(){return inner.scrollHeight>inner.clientHeight+1||(pic&&pic.clientHeight<inner.clientHeight*0.62);}",
    " while(bad()&&fs>5.4){fs-=0.25;card.style.setProperty('--fs',fs+'pt');}",
    " var over=inner.scrollHeight>inner.clientHeight+1;",
    " if(over)card.classList.add('overflow');",
    " return over;",
    "}",
    "function bestFit(bw,bh,asp){",
    " var gap=4,i,sumA=0,sumInv=0;",
    " if(asp.length===1){var s=Math.min(bw/asp[0],bh);return {area:s*asp[0]*s,arr:'row'};}",
    " for(i=0;i<asp.length;i++){sumA+=asp[i];sumInv+=1/asp[i];}",
    " var g=gap*(asp.length-1);",
    " var hRow=Math.max(0,Math.min(bh,(bw-g)/sumA)),aRow=hRow*hRow*sumA;",
    " var wCol=Math.max(0,Math.min(bw,(bh-g)/sumInv)),aCol=wCol*wCol*sumInv;",
    " return aRow>=aCol?{area:aRow,arr:'row'}:{area:aCol,arr:'col'};",
    "}",
    "function hdPrepare(card){",
    " var v=card.querySelector('.hd-verso');",
    " if(!v)return Promise.all(Array.prototype.slice.call(card.querySelectorAll('.has-pic .pic')).map(function(im){return new Promise(function(res){",
    "  if(im.complete){res();return;}",
    "  im.addEventListener('load',res);im.addEventListener('error',res);",
    " });}));",
    " card.classList.add('hd-card');card.setAttribute('data-fs','10');card.style.setProperty('--fs','10pt');",
    " var imgs=Array.prototype.slice.call(v.querySelectorAll('.hd-imgs img'));",
    " return Promise.all(imgs.map(function(im){return new Promise(function(res){",
    "  if(im.complete){res();return;}",
    "  im.addEventListener('load',res);im.addEventListener('error',res);",
    " });}));",
    "}",
    "function hdLayout(card){",
    " var v=card.querySelector('.hd-verso');if(!v)return;",
    " var imgs=Array.prototype.slice.call(v.querySelectorAll('.hd-imgs img')).filter(function(im){return im.naturalWidth>0;});",
    " if(!imgs.length)return;",
    " var asp=imgs.map(function(im){return im.naturalWidth/im.naturalHeight;});",
    " var best=null;",
    " ['top','side'].forEach(function(mode){",
    "  v.className='card-inner hd-verso layout-'+mode;",
    "  var box=v.querySelector('.hd-imgs');",
    "  var f=bestFit(box.clientWidth,box.clientHeight,asp);",
    "  if(!best||f.area>best.area+1)best={area:f.area,mode:mode,arr:f.arr};",
    " });",
    " v.className='card-inner hd-verso layout-'+best.mode+' arr-'+(best.arr==='col'?'col':'row');",
    " imgs.forEach(function(im,i){im.style.flexGrow=(best.arr==='col'?1/asp[i]:asp[i]);});",
    "}",
    "function picLayout(card){",
    " var inner=card.querySelector('.card-inner.pic-ident');if(!inner)return;",
    " var im=inner.querySelector('.pic');if(!im||!im.naturalWidth)return;",
    " var info=inner.querySelector('.pic-info');if(!info)return;",
    " card.style.setProperty('--fs','8pt');inner.classList.remove('pic-side');",
    " var asp=im.naturalWidth/im.naturalHeight,iw=inner.clientWidth,ih=inner.clientHeight;",
    " var s1=Math.min(iw/asp,Math.max(0,ih-info.offsetHeight-4)),a1=s1*s1*asp;",
    " var s2=Math.min(Math.max(0,iw*0.68-4)/asp,ih),a2=s2*s2*asp;",
    " if(a2>a1*1.08)inner.classList.add('pic-side');",
    "}",
    "function finish(cards){",
    " var over=0;",
    " cards.forEach(function(card){hdLayout(card);picLayout(card);if(fit(card))over++;});",
    " var warn=document.getElementById('warn');",
    " if(warn&&over){warn.hidden=false;warn.textContent=over+' carte(s) trop remplie(s) (cadre en pointillés) : du texte est coupé. Retirez un champ dans la fenêtre de réglage.';}",
    " if(document.body.classList.contains('preview')){",
    "  var n=document.querySelectorAll('.sheet').length||1;",
    "  var w=n*793.7+(n-1)*14+12;",
    "  var z=Math.min(1,(window.innerWidth-12)/w);",
    "  document.body.style.zoom=z;",
    "  try{parent.postMessage({mtcCardsPreviewHeight:(1121+12)*z},'*');}catch(e){}",
    " }",
    " if(window.__MTC_AUTOPRINT)setTimeout(function(){window.print();},350);",
    "}",
    "function run(){",
    " var cards=Array.prototype.slice.call(document.querySelectorAll('.card'));",
    " Promise.all(cards.map(hdPrepare)).then(function(){finish(cards);},function(){finish(cards);});",
    "}",
    "var ready=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();",
    "ready.then(run,run);",
    "})();"
  ].join("\n");

  const FONT_LINKS =
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">';

  function buildDocument(pagesHtml, opts){
    const margin = Number(opts.margin) || DEFAULT_OPTIONS.margin;
    const toolbar = opts.preview ? "" :
      '<div class="toolbar"><button type="button" onclick="window.print()">Imprimer / Enregistrer en PDF</button>' +
      '<div class="tip">Dans la fenêtre d\'impression : <b>échelle 100 %</b> (pas « Ajuster à la page »), <b>marges : aucune</b>, format <b>A4</b>' +
      (opts.mode !== "recto" ? ", <b>recto-verso : retourner sur le bord " + (opts.flip === "short" ? "COURT" : "LONG") + "</b>" : "") +
      ". Faites d'abord un essai sur une seule feuille.</div><div class=\"warn\" id=\"warn\" hidden></div></div>";
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>" + esc(opts.title || "Cartes de révision") + "</title>" + FONT_LINKS +
      "<style>" + DOC_CSS + ".card{--m:" + margin + "mm}</style></head>" +
      '<body class="' + (opts.preview ? "preview" : "") + '">' + toolbar +
      '<main class="sheets">' + pagesHtml + "</main>" +
      "<script>" + (opts.autoprint ? "window.__MTC_AUTOPRINT=true;" : "") + DOC_SCRIPT + "<\/script></body></html>";
  }

  // --- Sélection / réglages --------------------------------------------------

  function selectedRecords(){
    const dataset = ds();
    const wanted = new Set(cur().selected);
    // Ordre de la liste (classes / canaux), pas de l'ordre de cochage.
    return dataset.items()
      .filter(item => wanted.has(item.id))
      .map(item => dataset.record(item.id))
      .filter(Boolean);
  }

  function optionsFromSettings(){
    return {
      mode:settings.mode,
      flip:settings.flip,
      dx:settings.dx,
      dy:settings.dy,
      margin:settings.margin,
      cutlines:settings.cutlines
    };
  }

  function cardFnFor(){
    const dataset = ds();
    const state = cur();
    return (record, side) => cardInnerHtml(record, side === "recto" ? state.recto : state.verso, dataset.fields);
  }

  function buildRealDocument(preview){
    const records = selectedRecords();
    const opts = optionsFromSettings();
    const built = buildPagesHtml(records, opts, cardFnFor(), preview ? 1 : 0);
    return {
      records,
      built,
      html:buildDocument(built.html, Object.assign({}, opts, {preview, autoprint:!preview, title:ds().docTitle}))
    };
  }

  // Feuille test : 8 cartes numérotées, recto puis verso, pour vérifier à
  // l'œil (feuille à contre-jour) que le verso tombe bien derrière le recto.
  function buildTestDocument(preview){
    const items = [];
    for(let n = 1; n <= CARDS_PER_SHEET; n++) items.push(n);
    const opts = Object.assign(optionsFromSettings(), {mode:"duplex"});
    const built = buildPagesHtml(items, opts, (n, side) => testCardInnerHtml(n, side), 0);
    return buildDocument(built.html, Object.assign({}, opts, {preview, autoprint:!preview, title:"Feuille test — cartes"}));
  }

  function openForPrint(source){
    const ready = Promise.resolve(source);
    // La fenêtre doit s'ouvrir pendant le clic, avant tout travail asynchrone.
    const win = window.open("", "_blank");
    if(win){
      try{
        win.document.write('<!doctype html><meta charset="utf-8"><title>Préparation…</title><p style="font:16px sans-serif;padding:24px">Préparation des cartes…</p>');
      }catch(error){}
      ready.then(html => {
        let url = "";
        try{ url = URL.createObjectURL(new Blob([html], {type:"text/html"})); }catch(error){}
        if(url) win.location.href = url;
      }).catch(() => { try{ win.close(); }catch(error){} });
      return true;
    }

    // Fenêtre bloquée : impression via un cadre caché (moins fiable sur mobile).
    ready.then(html => {
      const frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
      document.body.appendChild(frame);
      frame.onload = () => {
        try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(error){}
        setTimeout(() => frame.remove(), 60000);
      };
      frame.srcdoc = html;
    });
    return false;
  }

  // --- Fenêtre de réglage -----------------------------------------------------

  function byId(id){ return document.getElementById(id); }

  const TITLE_ICON = '<svg viewBox="0 0 100 100" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="rotate(-15 50 50)"><rect x="22" y="14" width="40" height="58" rx="6"/></g><g transform="rotate(11 50 50)"><rect x="36" y="26" width="40" height="58" rx="6" style="fill:var(--page-bg,#fff)"/><path d="M47 47h18M47 60h10"/></g></svg>';

  function itemRowHtml(item){
    return '<label class="mtc-cards-herb" data-item-row="' + esc(item.id) + '" data-group-code="' + esc(item.group) + '" data-search="' + esc(item.search) +
      '" data-priority="' + (item.priority ? "1" : "0") + '" data-noimg="' + (item.noimg ? "1" : "0") + '" data-psycho="' + (item.psycho ? "1" : "0") + '"><input type="checkbox" data-item-id="' + esc(item.id) + '">' +
      '<span class="mtc-cards-herb-code">' + esc(item.code) + "</span>" +
      '<span class="mtc-cards-herb-name">' + esc(item.title) + (item.sub ? " <em>" + esc(item.sub) + "</em>" : "") +
      (item.noimg ? ' <span class="mtc-cards-noimg">sans image</span>' : "") + "</span></label>";
  }

  function listHtml(items){
    const order = [];
    const groups = {};
    items.forEach(item => {
      if(!groups[item.group]){ groups[item.group] = {name:item.groupName, items:[]}; order.push(item.group); }
      groups[item.group].items.push(item);
    });
    return order.map(code => {
      const group = groups[code];
      return '<div class="mtc-cards-group" data-group="' + esc(code) + '"><label class="mtc-cards-group-head"><input type="checkbox" data-group-toggle="' + esc(code) + '"><strong>' +
        esc(group.name) + '</strong><span class="mtc-cards-count">' + group.items.length + "</span></label>" + group.items.map(itemRowHtml).join("") + "</div>";
    }).join("");
  }

  function groupOptionsHtml(items, allLabel){
    const seen = {};
    let html = '<option value="">' + esc(allLabel) + "</option>";
    items.forEach(item => {
      if(seen[item.group]) return;
      seen[item.group] = true;
      html += '<option value="' + esc(item.group) + '">' + esc(item.groupName) + "</option>";
    });
    return html;
  }

  function fieldsTableHtml(fields){
    return '<table class="mtc-cards-fields"><thead><tr><th>Champ</th><th>Recto</th><th>Verso</th></tr></thead><tbody>' +
      fields.filter(field => !field.adminOnly || isAdmin()).map(field =>
        "<tr><td>" + esc(field.label) + '</td><td><input type="checkbox" data-field-side="recto" data-field="' + field.key +
        '"></td><td><input type="checkbox" data-field-side="verso" data-field="' + field.key + '"></td></tr>'
      ).join("") + "</tbody></table>";
  }

  function ensureModal(){
    if(modal) return modal;
    modal = document.createElement("div");
    modal.className = "mtc-cards-modal";
    modal.id = "mtcCardsModal";
    modal.innerHTML =
      '<div class="mtc-cards-card" role="dialog" aria-modal="true" aria-labelledby="mtcCardsTitle">' +
        '<header class="mtc-cards-head"><h2 id="mtcCardsTitle"><span class="mtc-cards-title-icon">' + TITLE_ICON + "</span> Cartes de révision à imprimer" + (isAdmin() ? ' <small style="font-weight:400;opacity:.55;font-size:.55em">admin · v13</small>' : "") + "</h2>" +
        '<button type="button" class="mtc-cards-x" data-cards-close aria-label="Fermer">×</button></header>' +
        '<div class="mtc-cards-scroll">' +
          '<div class="mtc-cards-tabs" id="mtcCardsTabs" role="tablist">' +
            Object.keys(DATASETS).map(key => '<button type="button" role="tab" data-cards-tab="' + key + '">' + esc(DATASETS[key].tab) + "</button>").join("") +
          "</div>" +
          '<p class="mtc-cards-intro" id="mtcCardsIntro"></p>' +

          '<section><h3 id="mtcCardsListTitle">1 · Sélection</h3>' +
            '<div class="mtc-cards-hd" id="mtcCardsHdPanel" hidden>' +
              '<div class="mtc-cards-buttons">' +
                '<button type="button" data-cards-act="hd-pick-folder">Choisir le dossier d\'images…</button>' +
                '<button type="button" data-cards-act="hd-pick-files">Ajouter des images…</button>' +
                '<button type="button" data-cards-act="hd-forget">Oublier les images</button>' +
              "</div>" +
              '<input type="file" id="mtcCardsHdFolder" webkitdirectory multiple hidden>' +
              '<input type="file" id="mtcCardsHdFiles" accept="image/*" multiple hidden>' +
              '<p class="mtc-cards-note" id="mtcCardsHdStatus"></p>' +
              '<div class="mtc-cards-options mtc-cards-bw">' +
                '<label class="mtc-cards-inline"><input type="checkbox" id="mtcCardsHdBW"> optimiser les images pour l\'impression noir et blanc</label>' +
                '<label class="mtc-cards-inline"><input type="checkbox" id="mtcCardsHdDots"> points : contour noir, remplissage blanc (à colorier)</label>' +
                '<label>Aplats de couleur<select id="mtcCardsHdLevel">' +
                  '<option value="none">inchangés</option>' +
                  '<option value="light">un peu plus clairs</option>' +
                  '<option value="medium">plus clairs (recommandé)</option>' +
                  '<option value="strong">très clairs</option>' +
                "</select></label>" +
                (isAdmin() ? '<button type="button" data-cards-act="hd-markers">Vérifier les points…</button>' +
                  '<button type="button" data-cards-act="hd-export">Exporter mes corrections</button>' +
                  '<button type="button" data-cards-act="hd-import">Importer des corrections…</button>' +
                  '<input type="file" id="mtcCardsMkImport" accept="application/json,.json" hidden>' : "") +
              "</div>" +
              (isAdmin() ? '<p class="mtc-cards-note" id="mtcCardsMkStatus"></p>' : "") +
            "</div>" +
            '<div class="mtc-cards-filters">' +
              '<input type="search" id="mtcCardsSearch" placeholder="Rechercher (pinyin, hanzi, nom, code)…" autocomplete="off">' +
              '<select id="mtcCardsClass"></select>' +
              '<label class="mtc-cards-inline" id="mtcCardsPriorityWrap"><input type="checkbox" id="mtcCardsPriority"> prioritaires</label>' +
              '<label class="mtc-cards-inline" id="mtcCardsHasImageWrap"><input type="checkbox" id="mtcCardsHasImage"> seulement avec image</label>' +
              '<label class="mtc-cards-inline" id="mtcCardsPsychoWrap" hidden><input type="checkbox" id="mtcCardsPsycho"> seulement avec indications psycho-émotionnelles</label>' +
              '<label class="mtc-cards-inline" id="mtcCardsUncatWrap"><input type="checkbox" id="mtcCardsUncat"> inclure les points sans catégorie</label>' +
            "</div>" +
            '<p class="mtc-cards-note" id="mtcCardsPsychoInfo" hidden></p>' +
            '<div class="mtc-cards-buttons">' +
              '<button type="button" data-cards-act="check-visible">Cocher les affichées</button>' +
              '<button type="button" data-cards-act="uncheck-visible">Décocher les affichées</button>' +
              '<button type="button" data-cards-act="basket">Ajouter le panier de révision</button>' +
              '<button type="button" data-cards-act="hd-categorized" id="mtcCardsCategorizedBtn">Sélectionner uniquement les points avec catégorie</button>' +
              (isAdmin() ? '<button type="button" data-cards-act="psycho-only" id="mtcCardsPsychoBtn">Sélectionner uniquement les points avec indications psycho-émotionnelles</button>' : "") +
              '<button type="button" data-cards-act="clear">Tout vider</button>' +
            "</div>" +
            '<div class="mtc-cards-list" id="mtcCardsList"></div>' +
          "</section>" +

          '<section><h3>2 · Contenu des cartes</h3>' +
            '<div class="mtc-cards-buttons" id="mtcCardsPresets"></div>' +
            '<div id="mtcCardsFields"></div>' +
          "</section>" +

          '<section><h3>3 · Impression</h3><div class="mtc-cards-options">' +
            '<label>Mode<select id="mtcCardsMode">' +
              '<option value="duplex">Recto-verso automatique (pages alternées)</option>' +
              '<option value="recto">Rectos seulement</option>' +
              '<option value="verso">Versos seulement</option>' +
            "</select></label>" +
            '<label>Retournement de la feuille<select id="mtcCardsFlip">' +
              '<option value="long">Sur le bord long (le plus courant)</option>' +
              '<option value="short">Sur le bord court</option>' +
            "</select></label>" +
            '<label>Marge autour des cartes<select id="mtcCardsMargin">' +
              [3, 4, 4.5, 5, 6, 7].map(v => '<option value="' + v + '">' + String(v).replace(".", ",") + " mm</option>").join("") +
            "</select></label>" +
            '<label>Décalage du verso — horizontal (mm)<input type="number" id="mtcCardsDx" step="0.1" min="-10" max="10"></label>' +
            '<label>Décalage du verso — vertical (mm)<input type="number" id="mtcCardsDy" step="0.1" min="-10" max="10"></label>' +
            '<label class="mtc-cards-inline"><input type="checkbox" id="mtcCardsCut"> traits de coupe pointillés (au recto)</label>' +
          "</div>" +
          '<p class="mtc-cards-note">Le verso est automatiquement disposé en miroir pour tomber derrière son recto. ' +
          "Imprimez d'abord la <b>feuille test</b> (recto-verso) et regardez-la à contre-jour : si le verso est décalé, corrigez avec les décalages ci-dessus.</p></section>" +

          '<section><h3>Aperçu</h3><p class="mtc-cards-note" id="mtcCardsPreviewNote"></p>' +
            '<iframe id="mtcCardsPreview" title="Aperçu des cartes" class="mtc-cards-preview"></iframe></section>' +
        "</div>" +
        '<footer class="mtc-cards-foot"><span id="mtcCardsSummary" class="mtc-cards-summary"></span>' +
          '<button type="button" data-cards-act="test">Feuille test</button>' +
          '<button type="button" data-cards-act="print" class="mtc-cards-primary">Imprimer / PDF</button></footer>' +
      "</div>";
    document.body.appendChild(modal);
    wireModal();
    return modal;
  }

  // Remplit tout ce qui dépend du jeu de données actif (liste, filtres,
  // préréglages, tableau des champs, textes).
  function populateDataset(){
    const dataset = ds();
    const items = dataset.items();
    modal.querySelectorAll("[data-cards-tab]").forEach(button => {
      const active = button.getAttribute("data-cards-tab") === dataset.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    byId("mtcCardsIntro").textContent = dataset.intro;
    byId("mtcCardsListTitle").textContent = "1 · " + dataset.listTitle;
    byId("mtcCardsClass").innerHTML = groupOptionsHtml(items, dataset.groupsLabel);
    byId("mtcCardsSearch").value = "";
    byId("mtcCardsPriority").checked = false;
    byId("mtcCardsPriorityWrap").hidden = !dataset.hasPriority;
    const isHd = dataset.id === "acuhd";
    byId("mtcCardsHdPanel").hidden = !isHd;
    byId("mtcCardsHasImageWrap").hidden = !isHd;
    byId("mtcCardsPsychoWrap").hidden = !(isAdmin() && dataset.id !== "herbs");
    if(byId("mtcCardsPsychoWrap").hidden) byId("mtcCardsPsycho").checked = false;
    const psychoInfo = byId("mtcCardsPsychoInfo");
    psychoInfo.hidden = byId("mtcCardsPsychoWrap").hidden;
    if(!psychoInfo.hidden){
      const total = items.filter(item => item.psycho).length;
      psychoInfo.innerHTML = total
        ? total + " point(s) de cette liste ont des indications psycho-émotionnelles dans ce navigateur."
        : "Aucune indication psycho-émotionnelle trouvée dans ce navigateur : la synchro GitHub n'a pas (encore) rempli les fiches ici. " +
          '<button type="button" data-cards-act="open-sync">Ouvrir la synchro GitHub</button>';
    }
    byId("mtcCardsUncatWrap").hidden = !isHd;
    byId("mtcCardsCategorizedBtn").hidden = !isHd;
    if(byId("mtcCardsPsychoBtn")) byId("mtcCardsPsychoBtn").hidden = dataset.id === "herbs";
    updateHdStatus();
    if(isHd && !hdRestoreTried){
      hdRestoreTried = true;
      hdRestore().then(restored => {
        if(restored && modal && modal.classList.contains("visible") && ds().id === "acuhd"){
          hdMessage = "";
          populateDataset();
        }
      });
    }
    byId("mtcCardsList").innerHTML = listHtml(items);
    byId("mtcCardsPresets").innerHTML = Object.keys(dataset.presets)
      .map(key => '<button type="button" data-cards-preset="' + key + '">' + esc(dataset.presets[key].label) + "</button>").join("");
    byId("mtcCardsFields").innerHTML = fieldsTableHtml(dataset.fields);
    syncControlsFromSettings();
    applyFilters();
    updateSummary();
    renderPreview();
  }

  function syncControlsFromSettings(){
    const state = cur();
    const selected = new Set(state.selected);
    modal.querySelectorAll("[data-item-id]").forEach(box => { box.checked = selected.has(box.getAttribute("data-item-id")); });
    modal.querySelectorAll("[data-field]").forEach(box => {
      box.checked = (state[box.getAttribute("data-field-side")] || []).includes(box.getAttribute("data-field"));
    });
    byId("mtcCardsMode").value = settings.mode;
    byId("mtcCardsFlip").value = settings.flip;
    byId("mtcCardsMargin").value = String(settings.margin);
    byId("mtcCardsDx").value = String(settings.dx);
    byId("mtcCardsDy").value = String(settings.dy);
    byId("mtcCardsCut").checked = Boolean(settings.cutlines);
    byId("mtcCardsUncat").checked = Boolean(settings.hdUncat);
    byId("mtcCardsHasImage").checked = Boolean(settings.hdOnlyImage);
    byId("mtcCardsHdBW").checked = Boolean(settings.hdBW);
    byId("mtcCardsHdDots").checked = Boolean(settings.hdDots);
    byId("mtcCardsHdLevel").value = settings.hdBWLevel;
    updateGroupBoxes();
  }

  function updateGroupBoxes(){
    modal.querySelectorAll("[data-group]").forEach(group => {
      const boxes = Array.from(group.querySelectorAll("[data-item-id]"));
      const checked = boxes.filter(box => box.checked).length;
      const toggle = group.querySelector("[data-group-toggle]");
      if(toggle){
        toggle.checked = checked > 0 && checked === boxes.length;
        toggle.indeterminate = checked > 0 && checked < boxes.length;
      }
    });
  }

  function applyFilters(){
    const term = normalizeSearch(byId("mtcCardsSearch").value).trim();
    const group = byId("mtcCardsClass").value;
    const priorityOnly = byId("mtcCardsPriority").checked;
    const imageOnly = ds().id === "acuhd" && byId("mtcCardsHasImage").checked;
    const psychoOnly = isAdmin() && ds().id !== "herbs" && byId("mtcCardsPsycho").checked;
    modal.querySelectorAll("[data-item-row]").forEach(row => {
      const ok = (!term || row.getAttribute("data-search").includes(term)) &&
        (!group || row.getAttribute("data-group-code") === group) &&
        (!priorityOnly || row.getAttribute("data-priority") === "1") &&
        (!imageOnly || row.getAttribute("data-noimg") !== "1") &&
        (!psychoOnly || row.getAttribute("data-psycho") === "1");
      row.hidden = !ok;
    });
    modal.querySelectorAll("[data-group]").forEach(groupEl => {
      groupEl.hidden = !groupEl.querySelector("[data-item-row]:not([hidden])");
    });
  }

  function collectSelection(){
    cur().selected = Array.from(modal.querySelectorAll("[data-item-id]:checked")).map(box => box.getAttribute("data-item-id"));
  }

  function collectFields(){
    const state = cur();
    ["recto", "verso"].forEach(side => {
      state[side] = Array.from(modal.querySelectorAll('[data-field-side="' + side + '"]:checked')).map(box => box.getAttribute("data-field"));
    });
  }

  function collectOptions(){
    settings.mode = byId("mtcCardsMode").value;
    settings.flip = byId("mtcCardsFlip").value;
    settings.margin = Number(byId("mtcCardsMargin").value) || DEFAULT_OPTIONS.margin;
    settings.dx = Number(byId("mtcCardsDx").value) || 0;
    settings.dy = Number(byId("mtcCardsDy").value) || 0;
    settings.cutlines = byId("mtcCardsCut").checked;
    settings.hdUncat = byId("mtcCardsUncat").checked;
    settings.hdOnlyImage = byId("mtcCardsHasImage").checked;
    settings.hdBW = byId("mtcCardsHdBW").checked;
    settings.hdDots = byId("mtcCardsHdDots").checked;
    settings.hdBWLevel = byId("mtcCardsHdLevel").value;
  }

  function updateHdStatus(){
    const node = byId("mtcCardsHdStatus");
    if(!node) return;
    const total = HD_IMAGES.size();
    const mk = byId("mtcCardsMkStatus");
    if(mk) mk.textContent = hdMarkers.count() + " image(s) avec corrections manuelles (points détectés automatiquement : contour noir, remplissage blanc).";
    if(hdMessage){ node.textContent = hdMessage; return; }
    node.textContent = total
      ? total + " point(s) avec image (dossier mémorisé dans ce navigateur)."
      : "Aucune image chargée : choisis le dossier « localisation de points » (une seule fois, il est ensuite mémorisé).";
  }

  async function onHdFilesChosen(input){
    hdMessage = "Lecture des images…";
    updateHdStatus();
    const result = await hdLoadFiles(input.files);
    input.value = "";
    hdMessage = result.matched + " image(s) reconnue(s)" +
      (result.ignored ? ", " + result.ignored + " ignorée(s) (nom non reconnu)" : "") +
      (result.saved ? " — mémorisées dans ce navigateur." : " — non mémorisées (stockage indisponible).");
    populateDataset();
    updateHdStatus();
  }

  function updateSummary(){
    const dataset = ds();
    const count = cur().selected.length;
    const sheets = Math.ceil(count / CARDS_PER_SHEET);
    const pages = settings.mode === "duplex" ? sheets * 2 : sheets;
    byId("mtcCardsSummary").textContent = count
      ? count + " " + dataset.nouns + " · " + sheets + " feuille(s) · " + pages + " page(s) imprimée(s)"
      : "Aucune sélection";
  }

  function schedulePreview(){
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 350);
  }

  let previewToken = 0;

  async function renderPreview(){
    const frame = byId("mtcCardsPreview");
    const note = byId("mtcCardsPreviewNote");
    if(!frame || !modal || !modal.classList.contains("visible")) return;
    if(!cur().selected.length){
      note.textContent = "Cochez au moins un élément pour voir l'aperçu.";
      frame.srcdoc = "";
      frame.style.height = "0";
      return;
    }
    const token = ++previewToken;
    if(ds().id === "acuhd" && settings.hdBW){
      const ids = selectedRecords().slice(0, CARDS_PER_SHEET).map(record => record.id);
      note.textContent = "Optimisation des images pour le noir et blanc…";
      await hdPrepareBW(ids, (done, total) => {
        if(token === previewToken) note.textContent = "Optimisation des images pour le noir et blanc… " + done + "/" + total;
      });
      if(token !== previewToken) return;
    }
    const doc = buildRealDocument(true);
    const shown = Math.min(CARDS_PER_SHEET, doc.records.length);
    note.textContent = "Aperçu de la première feuille (" + shown + " carte(s)) — " +
      (settings.mode === "duplex" ? "recto à gauche, verso à droite tel qu'il sera imprimé." : settings.mode === "recto" ? "recto." : "verso.");
    frame.srcdoc = doc.html;
  }

  function onChange(){
    collectSelection();
    collectFields();
    collectOptions();
    saveSettings();
    updateGroupBoxes();
    updateSummary();
    schedulePreview();
  }

  function setChecked(selector, predicate, value){
    modal.querySelectorAll(selector).forEach(box => { if(predicate(box)) box.checked = value; });
  }

  function handleAction(action){
    if(action === "check-visible" || action === "uncheck-visible"){
      setChecked("[data-item-id]", box => !box.closest("[data-item-row]").hidden, action === "check-visible");
    }else if(action === "clear"){
      setChecked("[data-item-id]", () => true, false);
    }else if(action === "open-sync"){
      const syncButton = byId("mtcGithubSyncButton");
      if(!syncButton){ window.alert("Le bouton de synchronisation GitHub est introuvable dans la barre du site."); return; }
      closeModal();
      syncButton.click();
      return;
    }else if(action === "psycho-only"){
      if(!isAdmin()) return;
      setChecked("[data-item-id]", () => true, false);
      setChecked("[data-item-id]", box => box.closest("[data-item-row]").getAttribute("data-psycho") === "1", true);
      const found = modal.querySelectorAll('[data-item-id]:checked').length;
      if(!found) window.alert("Aucun point avec indications psycho-émotionnelles : lance d'abord la synchro GitHub (bouton de synchronisation du site), puis rouvre cette fenêtre.");
    }else if(action === "hd-categorized"){
      const index = hdCategoryIndex();
      setChecked("[data-item-id]", () => true, false);
      setChecked("[data-item-id]", box => Boolean(index[box.getAttribute("data-item-id")]), true);
    }else if(action === "basket"){
      const ids = new Set(ds().basketIds());
      if(!ids.size){ window.alert("Le panier de révision est vide."); return; }
      setChecked("[data-item-id]", box => ids.has(box.getAttribute("data-item-id")), true);
    }else if(action === "hd-pick-folder"){
      byId("mtcCardsHdFolder").click();
      return;
    }else if(action === "hd-pick-files"){
      byId("mtcCardsHdFiles").click();
      return;
    }else if(action === "hd-markers"){
      openMarkerTool();
      return;
    }else if(action === "hd-export"){
      hdExportMarkers();
      return;
    }else if(action === "hd-import"){
      byId("mtcCardsMkImport").click();
      return;
    }else if(action === "hd-forget"){
      hdForget().then(() => { hdMessage = "Images oubliées."; populateDataset(); updateHdStatus(); });
      return;
    }else if(action === "print"){
      collectSelection();
      if(!cur().selected.length){ window.alert("Coche au moins un élément."); return; }
      if(ds().id === "acuhd" && !HD_IMAGES.size() && !window.confirm("Aucune image n'est chargée : les versos auront un cadre vide. Continuer ?")) return;
      onChange();
      openForPrint((async () => {
        if(ds().id === "acuhd" && settings.hdBW){
          const ids = selectedRecords().map(record => record.id);
          await hdPrepareBW(ids, (done, total) => { byId("mtcCardsSummary").textContent = "Optimisation des images… " + done + "/" + total; });
          updateSummary();
        }
        return buildRealDocument(false).html;
      })());
      return;
    }else if(action === "test"){
      onChange();
      openForPrint(buildTestDocument(false));
      return;
    }
    onChange();
  }

  function switchDataset(id){
    if(!DATASETS[id] || id === settings.dataset) return;
    collectSelection();
    collectFields();
    settings.dataset = id;
    saveSettings();
    populateDataset();
  }

  // --- Outil de vérification des points (noir et blanc) --------------------------
  // À gauche l'image en couleur : cercles bleus = points détectés, rouges =
  // ajoutés à la main, gris pointillés = détectés mais retirés. Un clic sur
  // une zone vide ajoute un point, un clic sur un point le retire (ou le
  // rétablit). À droite : le résultat noir et blanc.

  let mkEl = null;
  let mkState = null;
  let mkRenderToken = 0;

  function mkEnsure(){
    if(mkEl) return mkEl;
    mkEl = document.createElement("div");
    mkEl.className = "mtc-cards-mk";
    mkEl.id = "mtcCardsMk";
    mkEl.innerHTML =
      '<div class="mtc-cards-mk-card" role="dialog" aria-modal="true">' +
        '<header class="mtc-cards-mk-head"><strong id="mtcMkTitle">Vérification des points</strong>' +
        '<button type="button" class="mtc-cards-x" data-mk="close" aria-label="Fermer">×</button></header>' +
        '<p class="mtc-cards-note">Cercles <b style="color:#1c5fd0">bleus</b> : points détectés automatiquement. <b style="color:#e0201b">Rouge</b> : ajouté par toi. Clique sur une zone vide pour <b>ajouter</b> un point manquant, sur un cercle pour le <b>retirer</b> (reclique pour le rétablir). Deux points très proches : utilise le <b>zoom</b>, ou maintiens <b>Maj</b> en cliquant pour forcer l\'ajout. À droite : le résultat en noir et blanc.</p>' +
        '<div class="mtc-cards-mk-views">' +
          '<div><div class="mtc-cards-mk-cap">Original — clique ici</div><canvas id="mtcMkCanvas"></canvas></div>' +
          '<div><div class="mtc-cards-mk-cap">Noir et blanc</div><canvas id="mtcMkPreview"></canvas></div>' +
        "</div>" +
        '<footer class="mtc-cards-mk-foot">' +
          '<button type="button" data-mk="prev">◀ Précédent</button>' +
          '<span id="mtcMkCount" class="mtc-cards-summary"></span>' +
          '<button type="button" data-mk="next">Suivant ▶</button>' +
          '<select id="mtcMkFilter">' +
            '<option value="all">Toutes les images</option>' +
            '<option value="fills">Images à aplats de couleur</option>' +
            '<option value="none">Aucun point détecté</option>' +
          "</select>" +
          '<select id="mtcMkZoom" title="Zoom"><option value="1">Zoom ×1</option><option value="2">Zoom ×2</option><option value="3">Zoom ×3</option></select>' +
          '<button type="button" data-mk="clear">Réinitialiser cette image</button>' +
          '<button type="button" data-mk="close" class="mtc-cards-primary">Terminer</button>' +
        "</footer>" +
        '<p class="mtc-cards-note" id="mtcMkProgress"></p>' +
      "</div>";
    document.body.appendChild(mkEl);
    mkEl.addEventListener("click", event => {
      const action = event.target.closest("[data-mk]");
      if(!action) return;
      const name = action.getAttribute("data-mk");
      if(name === "close") mkClose();
      else if(name === "prev") mkGo(-1);
      else if(name === "next") mkGo(1);
      else if(name === "clear") mkClear();
    });
    mkEl.querySelector("#mtcMkCanvas").addEventListener("click", mkCanvasClick);
    mkEl.querySelector("#mtcMkFilter").addEventListener("change", () => { mkApplyFilter(); mkShow(); });
    mkEl.querySelector("#mtcMkZoom").addEventListener("change", () => mkShow());
    document.addEventListener("keydown", event => {
      if(!mkEl || !mkEl.classList.contains("visible")) return;
      if(event.key === "ArrowLeft") mkGo(-1);
      else if(event.key === "ArrowRight") mkGo(1);
    });
    return mkEl;
  }

  function mkAllEntries(){
    const seen = new Set();
    const list = [];
    ds().items().forEach(item => HD_IMAGES.chosenEntries(item.id).forEach(entry => {
      if(seen.has(entry.name)) return;
      seen.add(entry.name);
      list.push({entry, code:item.code});
    }));
    return list;
  }

  function mkApplyFilter(){
    const mode = byId("mtcMkFilter").value;
    const currentName = mkState.filtered[mkState.index] && mkState.filtered[mkState.index].entry.name;
    mkState.filtered = mkState.all.filter(item => {
      const name = item.entry.name;
      if(mode === "fills"){
        const cover = mkState.coverage.get(name);
        return cover === undefined || cover >= 0.04 || hdMarkers.count() && hdMarkers.get(name).add.length > 0;
      }
      if(mode === "none"){
        const auto = hdAuto.peek(name);
        return auto !== undefined && auto.length === 0;
      }
      return true;
    });
    const keep = mkState.filtered.findIndex(item => item.entry.name === currentName);
    mkState.index = keep >= 0 ? keep : 0;
  }

  // Export / import des corrections (pour passer d'un navigateur à l'autre).
  function hdExportMarkers(){
    if(!isAdmin()) return;
    const payload = {type:"mtc-cards-hd-markers", version:1, markers:hdMarkers.load()};
    const blob = new Blob([JSON.stringify(payload, null, 1)], {type:"application/json"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "corrections-points-hd.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  }

  async function hdImportMarkers(file){
    if(!isAdmin() || !file) return;
    let payload;
    try{ payload = JSON.parse(await file.text()); }catch(error){ window.alert("Fichier illisible."); return; }
    const source = payload && payload.type === "mtc-cards-hd-markers" ? payload.markers : null;
    if(!source || typeof source !== "object"){ window.alert("Ce fichier ne contient pas de corrections de points."); return; }
    let count = 0;
    Object.keys(source).forEach(name => {
      const raw = source[name];
      const value = Array.isArray(raw) ? {add:raw, hide:[]} : {add:(raw && raw.add) || [], hide:(raw && raw.hide) || []};
      if(!value.add.length && !value.hide.length) return;
      hdMarkers.set(name, value);
      count++;
    });
    HD_IMAGES.processed.clear();
    updateHdStatus();
    schedulePreview();
    window.alert(count + " image(s) avec corrections importée(s).");
  }

  async function openMarkerTool(){
    if(!isAdmin()) return;
    if(!HD_IMAGES.size()){ window.alert("Charge d'abord le dossier d'images."); return; }
    if(!window.MTCCardsBW){ window.alert("Le module d'optimisation d'image n'est pas chargé."); return; }
    mkEnsure().classList.add("visible");
    mkState = {all:mkAllEntries(), filtered:[], index:0, coverage:new Map(), run:++mkRenderToken};
    const runId = mkState.run;
    const progress = byId("mtcMkProgress");
    const title = byId("mtcMkTitle");
    for(let i = 0; i < mkState.all.length; i++){
      const item = mkState.all[i];
      title.textContent = "Analyse des images… " + (i + 1) + "/" + mkState.all.length;
      try{ mkState.coverage.set(item.entry.name, await window.MTCCardsBW.coverage(await hdEntryBlob(item.entry))); }
      catch(error){ mkState.coverage.set(item.entry.name, 1); }
      if(i % 6 === 5) await new Promise(resolve => setTimeout(resolve, 0));
    }
    mkApplyFilter();
    mkShow();
    // Détection des points de toutes les images, en arrière-plan (mémorisée).
    let detected = 0;
    for(const item of mkState.all){
      if(!mkEl.classList.contains("visible") || !mkState || mkState.run !== runId) return;
      if(hdAuto.peek(item.entry.name) === undefined){
        progress.textContent = "Détection des points… " + detected + "/" + mkState.all.length;
        await hdAuto.get(item.entry);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      detected++;
    }
    progress.textContent = "Détection terminée : " + mkState.all.length + " image(s) analysée(s).";
    if(byId("mtcMkFilter").value === "none"){ mkApplyFilter(); mkShow(); }
  }

  function mkClose(){
    if(!mkEl) return;
    mkEl.classList.remove("visible");
    if(mkState) mkState.run = -1;
    hdAuto.persistSoon();
    updateHdStatus();
    schedulePreview();
  }

  function mkGo(step){
    if(!mkState || !mkState.filtered.length) return;
    mkState.index = (mkState.index + step + mkState.filtered.length) % mkState.filtered.length;
    mkShow();
  }

  function mkClear(){
    const item = mkState && mkState.filtered[mkState.index];
    if(!item) return;
    hdMarkers.set(item.entry.name, {add:[], hide:[]});
    mkShow();
  }

  async function mkShow(){
    const item = mkState.filtered[mkState.index];
    const title = byId("mtcMkTitle");
    const count = byId("mtcMkCount");
    const left = byId("mtcMkCanvas");
    const right = byId("mtcMkPreview");
    if(!item){
      title.textContent = "Vérification des points";
      count.textContent = "Aucune image avec ce filtre.";
      left.width = left.height = right.width = right.height = 1;
      return;
    }
    const token = ++mkRenderToken;
    mkState.run = mkState.run;
    title.textContent = item.code + " — " + item.entry.name;
    const blob = await hdEntryBlob(item.entry);
    const bitmap = await createImageBitmap(blob);
    const auto = await hdAuto.get(item.entry);
    if(token !== mkRenderToken) return;
    mkState.auto = auto;
    const saved = hdMarkers.get(item.entry.name);
    count.textContent = (mkState.index + 1) + " / " + mkState.filtered.length + " · " + auto.length + " détecté(s), " + saved.add.length + " ajouté(s), " + saved.hide.length + " retiré(s)";
    const maxW = Math.max(240, Math.min(560, Math.floor((window.innerWidth - 60) / 2)));
    const maxH = Math.max(240, Math.floor(window.innerHeight * 0.55));
    const zoom = Number(byId("mtcMkZoom").value) || 1;
    mkEl.classList.toggle("zoomed", zoom > 1);
    const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height) * zoom;
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    left.width = w; left.height = h;
    right.width = w; right.height = h;
    mkState.bitmap = bitmap;
    mkState.size = {w, h};
    mkDrawLeft();
    window.clearTimeout(mkState.timer);
    mkState.timer = window.setTimeout(async () => {
      const level = settings.hdBWLevel;
      const canvas = await window.MTCCardsBW.render(blob, {level, markers:hdEffectiveMarkers(item.entry.name, auto), maxSide:900});
      if(token !== mkRenderToken) return;
      const ctx = right.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h);
    }, 120);
  }

  function mkDrawLeft(){
    const item = mkState.filtered[mkState.index];
    const left = byId("mtcMkCanvas");
    const ctx = left.getContext("2d");
    const {w, h} = mkState.size;
    const side = Math.max(w, h);
    ctx.drawImage(mkState.bitmap, 0, 0, w, h);
    const saved = hdMarkers.get(item.entry.name);
    (mkState.auto || []).forEach(a => {
      const hidden = saved.hide.some(hide => hdNear(a, hide, 0.02));
      ctx.lineWidth = 2;
      ctx.strokeStyle = hidden ? "#888" : "#1c5fd0";
      ctx.setLineDash(hidden ? [4, 3] : []);
      ctx.beginPath();
      ctx.arc(a[0] * w, a[1] * h, Math.max(6, (a[2] || 0.01) * side) + 3, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    saved.add.forEach(marker => {
      const x = marker[0] * w, y = marker[1] * h;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e0201b";
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
    });
  }

  function mkCanvasClick(event){
    const item = mkState && mkState.filtered[mkState.index];
    if(!item || !mkState.size) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const {w, h} = mkState.size;
    const side = Math.max(w, h);
    const saved = hdMarkers.get(item.entry.name);
    const fx = Number((x / w).toFixed(5));
    const fy = Number((y / h).toFixed(5));
    const distPx = marker => Math.hypot(marker[0] * w - x, marker[1] * h - y);

    // cible la plus proche dont le cercle contient le clic (Maj = ajout forcé)
    let target = null;
    if(!event.shiftKey){
      saved.add.forEach((marker, index) => {
        const d = distPx(marker);
        if(d <= 9 && (!target || d < target.d)) target = {d, kind:"add", index};
      });
      (mkState.auto || []).forEach(a => {
        const d = distPx(a);
        if(d <= Math.max(6, (a[2] || 0.01) * side) + 4 && (!target || d < target.d)) target = {d, kind:"auto", a};
      });
    }
    if(target && target.kind === "add"){
      saved.add.splice(target.index, 1);
    }else if(target){
      const hideIndex = saved.hide.findIndex(hide => hdNear(target.a, hide, 0.02));
      if(hideIndex >= 0) saved.hide.splice(hideIndex, 1);
      else saved.hide.push([target.a[0], target.a[1]]);
    }else{
      saved.add.push([fx, fy]);
    }
    hdMarkers.set(item.entry.name, saved);
    mkShow();
  }

  function wireModal(){
    modal.addEventListener("click", event => {
      if(event.target === modal){ closeModal(); return; }
      if(event.target.closest("[data-cards-close]")){ closeModal(); return; }
      const tabBtn = event.target.closest("[data-cards-tab]");
      if(tabBtn){ switchDataset(tabBtn.getAttribute("data-cards-tab")); return; }
      const actBtn = event.target.closest("[data-cards-act]");
      if(actBtn){ handleAction(actBtn.getAttribute("data-cards-act")); return; }
      const presetBtn = event.target.closest("[data-cards-preset]");
      if(presetBtn){
        const preset = ds().presets[presetBtn.getAttribute("data-cards-preset")];
        cur().recto = preset.recto.slice();
        cur().verso = preset.verso.slice();
        syncControlsFromSettings();
        onChange();
      }
    });
    modal.addEventListener("change", event => {
      const groupToggle = event.target.closest("[data-group-toggle]");
      if(groupToggle){
        const code = groupToggle.getAttribute("data-group-toggle");
        modal.querySelectorAll('[data-item-row][data-group-code="' + code + '"]').forEach(row => {
          if(!row.hidden) row.querySelector("[data-item-id]").checked = groupToggle.checked;
        });
      }
      onChange();
      if(event.target.id === "mtcCardsUncat"){ populateDataset(); }
    });
    byId("mtcCardsSearch").addEventListener("input", applyFilters);
    byId("mtcCardsClass").addEventListener("change", applyFilters);
    byId("mtcCardsPriority").addEventListener("change", applyFilters);
    byId("mtcCardsHasImage").addEventListener("change", applyFilters);
    const importInput = byId("mtcCardsMkImport");
    if(importInput) importInput.addEventListener("change", () => { hdImportMarkers(importInput.files && importInput.files[0]); importInput.value = ""; });
    byId("mtcCardsPsycho").addEventListener("change", applyFilters);
    byId("mtcCardsHdFolder").addEventListener("change", event => onHdFilesChosen(event.target));
    byId("mtcCardsHdFiles").addEventListener("change", event => onHdFilesChosen(event.target));
    ["mtcCardsDx", "mtcCardsDy"].forEach(id => byId(id).addEventListener("input", onChange));
    document.addEventListener("keydown", event => {
      if(event.key === "Escape" && mkEl && mkEl.classList.contains("visible")){ mkClose(); return; }
      if(event.key === "Escape" && modal.classList.contains("visible")) closeModal();
    });
    window.addEventListener("message", event => {
      const height = event.data && event.data.mtcCardsPreviewHeight;
      const frame = byId("mtcCardsPreview");
      if(height && frame && event.source === frame.contentWindow) frame.style.height = Math.ceil(height + 12) + "px";
    });
  }

  function openModal(datasetId){
    settings = loadSettings();
    if(DATASETS[datasetId]) settings.dataset = datasetId;
    ensureModal();
    modal.classList.add("visible");
    document.body.classList.add("mtc-cards-open");
    populateDataset();
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove("visible");
    document.body.classList.remove("mtc-cards-open");
  }

  function boot(){
    const button = byId("pharmaCardsButton");
    if(button && !button.dataset.mtcCardsBound){
      button.dataset.mtcCardsBound = "1";
      button.addEventListener("click", event => {
        event.preventDefault();
        openModal();
      });
    }
    // Aide au débogage / tests automatisés.
    window.MTCPharmaCards = {
      open:openModal, close:closeModal, datasets:DATASETS, slotsFor, backSlotSource,
      splitNature, splitSaveur, splitTopLevel, tropismCodes, linesOf, pointRecord,
      cardInnerHtml, buildDocument, buildPagesHtml, hdImages:HD_IMAGES, hdMarkers, hdPrepareBW, hdCategoryIndex, hdMatchFileName, hdLoadFiles, hdRestore
    };
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
