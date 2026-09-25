/* ============================================================
   60-pharma-cards.js
   Cartes de révision imprimables pour les substances médicinales :
   8 cartes par feuille A4 (2 colonnes x 4 lignes, rectangles égaux),
   choix des substances, des champs du recto et du verso, impression
   recto-verso avec le verso repositionné selon le sens de retournement
   de la feuille. Noir et blanc uniquement : nature / saveur / tropisme
   sont des formes vides à colorier, pas des champs colorés.
   Le document imprimé est totalement indépendant du CSS du jeu (page
   HTML autonome ouverte dans un nouvel onglet) : "Imprimer" ou
   "Enregistrer en PDF" depuis la boîte de dialogue du navigateur.
   ============================================================ */
(function(){
  "use strict";

  const SETTINGS_KEY = "mtc_pharma_cards_settings_v1";
  const BASKET_KEY = "mtc_pharma_review_basket_v1";
  const CARDS_PER_SHEET = 8;
  const COLS = 2;
  const ROWS = 4;
  // 297 mm / 4 = 74.25 mm : on retire un soupçon (74.1) pour que la feuille
  // tienne dans la page sans provoquer de page blanche finale (arrondis du
  // navigateur), la même géométrie étant utilisée au recto et au verso.
  const SLOT_W_MM = 105;
  const SLOT_H_MM = 74.1;

  const IDENTITY_KEYS = ["code", "classe", "hanzi", "pinyin", "nom"];

  // Ordre = ordre d'apparition sur la carte.
  const FIELDS = [
    {key:"code", label:"Code (ex. A5)", kind:"code"},
    {key:"classe", label:"Classe", kind:"classe"},
    {key:"hanzi", label:"Hanzi", kind:"hanzi"},
    {key:"pinyin", label:"Pinyin", kind:"pinyin"},
    {key:"nom", label:"Nom français", kind:"nom"},
    {key:"nature", label:"Nature — formes à colorier", kind:"shapes", shape:"circle", title:"Nature"},
    {key:"saveur", label:"Saveur — formes à colorier", kind:"shapes", shape:"drop", title:"Saveur"},
    {key:"tropisme", label:"Tropisme — formes à colorier", kind:"shapes", shape:"hex", title:"Tropisme"},
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

  const PRESETS = {
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

  const DEFAULTS = {
    selected:[],
    recto:PRESETS.pinyin.recto.slice(),
    verso:PRESETS.pinyin.verso.slice(),
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

  function allHerbs(){
    return Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [];
  }

  function recordFor(id){
    return typeof window.getPharmaHerbCardRecord === "function" ? window.getPharmaHerbCardRecord(id) : null;
  }

  function readBasketIds(){
    try{
      const parsed = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.map(String) : [];
    }catch(error){ return []; }
  }

  function loadSettings(){
    let stored = null;
    try{ stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); }catch(error){}
    const merged = Object.assign({}, DEFAULTS, stored && typeof stored === "object" ? stored : {});
    merged.selected = Array.isArray(merged.selected) ? merged.selected.map(String) : [];
    merged.recto = Array.isArray(merged.recto) ? merged.recto : DEFAULTS.recto.slice();
    merged.verso = Array.isArray(merged.verso) ? merged.verso : DEFAULTS.verso.slice();
    merged.dx = Number(merged.dx) || 0;
    merged.dy = Number(merged.dy) || 0;
    merged.margin = Number(merged.margin) || DEFAULTS.margin;
    return merged;
  }

  function saveSettings(){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(error){}
  }

  // --- Analyse des valeurs nature / saveur / tropisme -------------------------

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
  // "Tiède (Faible toxicité)") : forme triangle à part, pas un cercle de nature.
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
    return {nature, toxicity};
  }

  function shapesFor(field, record){
    if(field.key === "nature"){
      const parts = splitNature(record.nature);
      return parts.nature.map(label => ({shape:"circle", label}))
        .concat(parts.toxicity.map(label => ({shape:"tri", label})));
    }
    if(field.key === "saveur"){
      return splitSaveur(record.saveur).map(label => ({shape:"drop", label}));
    }
    return splitTopLevel(record.tropisme).map(cap).map(label => ({shape:"hex", label}));
  }

  const SHAPE_SVG = {
    circle:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.6"/></svg>',
    drop:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8C9 6.3 4.3 10.8 4.3 15.4a7.7 7.7 0 0 0 15.4 0C19.7 10.8 15 6.3 12 1.8z"/></svg>',
    hex:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l9.4 5.4v10L12 22.4 2.6 17V7z"/></svg>',
    tri:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l10.2 18.2H1.8z"/></svg>'
  };

  // --- Rendu d'une carte -----------------------------------------------------

  function fieldHasData(field, record){
    const value = record[field.key];
    if(field.kind === "shapes") return shapesFor(field, record).length > 0;
    if(field.kind === "list") return Array.isArray(value) && value.length > 0;
    return Boolean(String(value || "").trim());
  }

  function cardInnerHtml(record, selectedKeys){
    const selected = new Set(selectedKeys);
    const chosen = FIELDS.filter(field => selected.has(field.key) && fieldHasData(field, record));
    const identity = chosen.filter(field => IDENTITY_KEYS.includes(field.key));
    const details = chosen.filter(field => !IDENTITY_KEYS.includes(field.key));
    const has = key => identity.some(field => field.key === key);

    const classeHtml = has("classe") ? '<div class="classe">' + esc(record.classe) + "</div>" : "";
    const codeHtml = has("code") ? '<span class="code">' + esc(record.code) + "</span>" : "";
    const hanziHtml = has("hanzi") ? '<span class="hanzi">' + esc(record.hanzi) + "</span>" : "";
    const pinyinHtml = has("pinyin") ? '<span class="pinyin">' + esc(record.pinyin) + "</span>" : "";
    const nomHtml = has("nom") ? '<div class="nom">' + esc(record.nom) + "</div>" : "";

    // Recto "d'identité" seule (ex. pinyin + hanzi) : contenu centré et grand.
    if(!details.length){
      return '<div class="card-inner ident-only">' + classeHtml +
        (hanziHtml ? '<div class="hanzi-big">' + esc(record.hanzi) + "</div>" : "") +
        (pinyinHtml ? '<div class="pinyin-big">' + esc(record.pinyin) + "</div>" : "") +
        nomHtml +
        (codeHtml ? '<div class="code-wrap">' + codeHtml + "</div>" : "") +
        "</div>";
    }

    let html = '<div class="card-inner">';
    if(classeHtml || codeHtml) html += '<div class="hd"><div>' + classeHtml + "</div>" + codeHtml + "</div>";
    if(pinyinHtml || hanziHtml) html += '<div class="ident">' + pinyinHtml + hanziHtml + "</div>";
    html += nomHtml;
    if(identity.length) html += '<div class="rule"></div>';

    // Formes à colorier : nature / saveur / tropisme regroupées sur une ligne.
    const shapeFields = details.filter(field => field.kind === "shapes");
    if(shapeFields.length){
      html += '<div class="shape-groups">' + shapeFields.map(field => {
        return '<div class="shape-group"><div class="lbl">' + esc(field.title) + '</div><div class="shape-row">' +
          shapesFor(field, record).map(item =>
            '<div class="shape">' + SHAPE_SVG[item.shape] + "<span>" + esc(item.label) + "</span></div>"
          ).join("") + "</div></div>";
      }).join("") + "</div>";
    }

    details.filter(field => field.kind !== "shapes").forEach(field => {
      const value = record[field.key];
      if(field.kind === "inline"){
        html += '<div class="inline"><span class="lbl">' + esc(field.title) + "</span> " + esc(value) + "</div>";
      }else if(field.kind === "list"){
        html += '<div class="blk"><div class="lbl">' + esc(field.title) + '</div><ul class="lst">' +
          value.map(item => "<li>" + esc(item) + "</li>").join("") + "</ul></div>";
      }else if(field.kind === "image"){
        html += '<img class="pic" alt="" src="' + esc(value) + '">';
      }else{
        html += '<div class="blk"><div class="lbl">' + esc(field.title) + '</div><div class="txt">' + esc(value) + "</div></div>";
      }
    });
    return html + "</div>";
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
      return '<div class="slot"><div class="card" data-fs="9">' + cardFn(item, side) + "</div></div>";
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
    ".card-inner{height:100%;display:flex;flex-direction:column;gap:.4em;overflow:hidden}",
    ".card-inner>*{flex:none;min-width:0}",
    ".hd{display:flex;justify-content:space-between;align-items:flex-start;gap:.5em}",
    ".classe,.lbl{font-family:Archivo,Arial,sans-serif;font-weight:800;letter-spacing:.07em;text-transform:uppercase;font-size:.6em}",
    ".code{font-family:Archivo,Arial,sans-serif;font-weight:700;font-size:.7em;border:.25mm solid #000;border-radius:99px;padding:.05em .6em;white-space:nowrap}",
    ".ident{display:flex;flex-wrap:wrap;align-items:baseline;gap:.05em .6em}",
    ".pinyin{font-weight:700;font-size:1.5em;line-height:1.1}",
    ".hanzi{font-family:'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun','Source Han Serif SC',serif;font-size:1.45em;line-height:1.1}",
    ".nom{font-style:italic;font-size:.95em}",
    ".rule{border-top:.2mm solid #000;opacity:.45}",
    ".shape-groups{display:flex;flex-wrap:wrap;gap:.5em 1.4em;align-items:flex-start}",
    ".shape-group .lbl{margin-bottom:.25em}",
    ".shape-row{display:flex;flex-wrap:wrap;gap:.35em .8em;align-items:flex-start}",
    ".shape{display:flex;flex-direction:column;align-items:center;max-width:23mm;text-align:center}",
    ".shape svg{width:max(5.2mm,calc(var(--fs,9pt)*2.5));height:max(5.2mm,calc(var(--fs,9pt)*2.5));fill:none;stroke:#000;stroke-width:1.3;stroke-linejoin:round}",
    ".shape span{font-family:Archivo,Arial,sans-serif;font-size:.62em;line-height:1.1;margin-top:.15em}",
    ".inline{font-size:.9em}",
    ".inline .lbl{margin-right:.4em}",
    ".blk .txt{white-space:pre-line;font-size:.9em}",
    ".blk .lbl{margin-bottom:.15em}",
    ".lst{list-style:none;margin:0;padding:0;font-size:.9em}",
    ".lst li{position:relative;padding-left:1em}",
    ".lst li::before{content:'\\2022';position:absolute;left:.15em}",
    ".pic{display:block;align-self:center;max-width:100%;height:calc(var(--fs,9pt)*4.5);object-fit:contain}",
    ".ident-only{justify-content:center;align-items:center;text-align:center;gap:.3em}",
    ".hanzi-big{font-family:'Noto Serif SC','Noto Serif CJK SC','Songti SC','SimSun','Source Han Serif SC',serif;font-size:3.6em;line-height:1.05}",
    ".pinyin-big{font-weight:700;font-size:2.1em;line-height:1.1}",
    ".ident-only .nom{font-size:1.15em}",
    ".code-wrap{margin-top:.3em}",
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
    " card.style.setProperty('--fs',fs+'pt');",
    " while(inner.scrollHeight>inner.clientHeight+1&&fs>5.4){fs-=0.25;card.style.setProperty('--fs',fs+'pt');}",
    " var over=inner.scrollHeight>inner.clientHeight+1;",
    " if(over)card.classList.add('overflow');",
    " return over;",
    "}",
    "function run(){",
    " var over=0;",
    " Array.prototype.forEach.call(document.querySelectorAll('.card'),function(card){if(fit(card))over++;});",
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
    "var ready=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();",
    "ready.then(run,run);",
    "})();"
  ].join("\n");

  const FONT_LINKS =
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">';

  function buildDocument(pagesHtml, opts){
    const margin = Number(opts.margin) || DEFAULTS.margin;
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
    const wanted = new Set(settings.selected);
    return allHerbs()
      .filter(herb => herb && wanted.has(herb.id))
      .map(herb => recordFor(herb.id))
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
    return (record, side) => cardInnerHtml(record, side === "recto" ? settings.recto : settings.verso);
  }

  function buildRealDocument(preview){
    const records = selectedRecords();
    const opts = optionsFromSettings();
    const built = buildPagesHtml(records, opts, cardFnFor(), preview ? 1 : 0);
    return {
      records,
      built,
      html:buildDocument(built.html, Object.assign({}, opts, {preview, autoprint:!preview, title:"Cartes de révision — substances"}))
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

  function openForPrint(html){
    let url = "";
    try{
      url = URL.createObjectURL(new Blob([html], {type:"text/html"}));
    }catch(error){ url = ""; }
    const win = url ? window.open(url, "_blank") : null;
    if(win) return true;

    // Fenêtre bloquée : impression via un cadre caché (moins fiable sur mobile).
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    frame.onload = () => {
      try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(error){}
      setTimeout(() => frame.remove(), 60000);
    };
    frame.srcdoc = html;
    return false;
  }

  // --- Fenêtre de réglage -----------------------------------------------------

  function byId(id){ return document.getElementById(id); }

  function herbRowHtml(herb){
    const rec = herb;
    const search = normalizeSearch([rec.pinyin, rec.pinyinSansTons, rec.hanzi, rec.nom, rec.code, rec.classe].join(" "));
    const label = (rec.pinyin || rec.pinyinSansTons || rec.code || rec.id);
    return '<label class="mtc-cards-herb" data-herb-row="' + esc(herb.id) + '" data-class="' + esc(herb.classCode) + '" data-search="' + esc(search) +
      '" data-priority="' + (herb.prioritaire ? "1" : "0") + '"><input type="checkbox" data-herb-id="' + esc(herb.id) + '">' +
      '<span class="mtc-cards-herb-code">' + esc(herb.code || herb.id) + "</span>" +
      '<span class="mtc-cards-herb-name">' + esc(label) + (herb.hanzi ? " · " + esc(herb.hanzi) : "") +
      (herb.nom ? ' <em>' + esc(herb.nom) + "</em>" : "") + "</span></label>";
  }

  function buildHerbList(){
    const classes = Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];
    const herbs = allHerbs();
    const order = classes.map(item => item.code);
    herbs.forEach(herb => { if(!order.includes(herb.classCode)) order.push(herb.classCode); });
    return order.map(code => {
      const list = herbs.filter(herb => herb.classCode === code);
      if(!list.length) return "";
      const name = (classes.find(item => item.code === code) || {}).nom || list[0].classe || code;
      return '<div class="mtc-cards-group" data-group="' + esc(code) + '"><label class="mtc-cards-group-head"><input type="checkbox" data-group-toggle="' + esc(code) + '"><strong>' +
        esc(name) + '</strong><span class="mtc-cards-count">' + list.length + "</span></label>" + list.map(herbRowHtml).join("") + "</div>";
    }).join("");
  }

  function fieldsTableHtml(){
    return '<table class="mtc-cards-fields"><thead><tr><th>Champ</th><th>Recto</th><th>Verso</th></tr></thead><tbody>' +
      FIELDS.map(field =>
        "<tr><td>" + esc(field.label) + '</td><td><input type="checkbox" data-field-side="recto" data-field="' + field.key +
        '"></td><td><input type="checkbox" data-field-side="verso" data-field="' + field.key + '"></td></tr>'
      ).join("") + "</tbody></table>";
  }

  function classOptionsHtml(){
    const classes = Array.isArray(window.PHARMA_CLASSES) ? window.PHARMA_CLASSES : [];
    return '<option value="">Toutes les classes</option>' +
      classes.map(item => '<option value="' + esc(item.code) + '">' + esc(item.nom) + "</option>").join("");
  }

  function ensureModal(){
    if(modal) return modal;
    modal = document.createElement("div");
    modal.className = "mtc-cards-modal";
    modal.id = "mtcCardsModal";
    modal.innerHTML =
      '<div class="mtc-cards-card" role="dialog" aria-modal="true" aria-labelledby="mtcCardsTitle">' +
        '<header class="mtc-cards-head"><h2 id="mtcCardsTitle">🃏 Cartes de révision à imprimer</h2>' +
        '<button type="button" class="mtc-cards-x" data-cards-close aria-label="Fermer">×</button></header>' +
        '<div class="mtc-cards-scroll">' +
          '<p class="mtc-cards-intro">8 cartes par feuille A4, noir et blanc. Nature, saveur et tropisme sont des formes vides à colorier soi-même.</p>' +

          '<section><h3>1 · Substances</h3>' +
            '<div class="mtc-cards-filters">' +
              '<input type="search" id="mtcCardsSearch" placeholder="Rechercher (pinyin, hanzi, nom, code)…" autocomplete="off">' +
              '<select id="mtcCardsClass">' + classOptionsHtml() + "</select>" +
              '<label class="mtc-cards-inline"><input type="checkbox" id="mtcCardsPriority"> prioritaires</label>' +
            "</div>" +
            '<div class="mtc-cards-buttons">' +
              '<button type="button" data-cards-act="check-visible">Cocher les affichées</button>' +
              '<button type="button" data-cards-act="uncheck-visible">Décocher les affichées</button>' +
              '<button type="button" data-cards-act="basket">Ajouter le panier de révision</button>' +
              '<button type="button" data-cards-act="clear">Tout vider</button>' +
            "</div>" +
            '<div class="mtc-cards-list" id="mtcCardsList">' + buildHerbList() + "</div>" +
          "</section>" +

          '<section><h3>2 · Contenu des cartes</h3>' +
            '<div class="mtc-cards-buttons" id="mtcCardsPresets">' +
              Object.keys(PRESETS).map(key => '<button type="button" data-cards-preset="' + key + '">' + esc(PRESETS[key].label) + "</button>").join("") +
            "</div>" + fieldsTableHtml() +
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

  function syncControlsFromSettings(){
    const selected = new Set(settings.selected);
    modal.querySelectorAll("[data-herb-id]").forEach(box => { box.checked = selected.has(box.getAttribute("data-herb-id")); });
    modal.querySelectorAll("[data-field]").forEach(box => {
      box.checked = (settings[box.getAttribute("data-field-side")] || []).includes(box.getAttribute("data-field"));
    });
    byId("mtcCardsMode").value = settings.mode;
    byId("mtcCardsFlip").value = settings.flip;
    byId("mtcCardsMargin").value = String(settings.margin);
    byId("mtcCardsDx").value = String(settings.dx);
    byId("mtcCardsDy").value = String(settings.dy);
    byId("mtcCardsCut").checked = Boolean(settings.cutlines);
    updateGroupBoxes();
  }

  function updateGroupBoxes(){
    modal.querySelectorAll("[data-group]").forEach(group => {
      const boxes = Array.from(group.querySelectorAll("[data-herb-id]"));
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
    const cls = byId("mtcCardsClass").value;
    const priorityOnly = byId("mtcCardsPriority").checked;
    modal.querySelectorAll("[data-herb-row]").forEach(row => {
      const ok = (!term || row.getAttribute("data-search").includes(term)) &&
        (!cls || row.getAttribute("data-class") === cls) &&
        (!priorityOnly || row.getAttribute("data-priority") === "1");
      row.hidden = !ok;
    });
    modal.querySelectorAll("[data-group]").forEach(group => {
      group.hidden = !group.querySelector("[data-herb-row]:not([hidden])");
    });
  }

  function collectSelection(){
    settings.selected = Array.from(modal.querySelectorAll("[data-herb-id]:checked")).map(box => box.getAttribute("data-herb-id"));
  }

  function collectFields(){
    ["recto", "verso"].forEach(side => {
      settings[side] = Array.from(modal.querySelectorAll('[data-field-side="' + side + '"]:checked')).map(box => box.getAttribute("data-field"));
    });
  }

  function collectOptions(){
    settings.mode = byId("mtcCardsMode").value;
    settings.flip = byId("mtcCardsFlip").value;
    settings.margin = Number(byId("mtcCardsMargin").value) || DEFAULTS.margin;
    settings.dx = Number(byId("mtcCardsDx").value) || 0;
    settings.dy = Number(byId("mtcCardsDy").value) || 0;
    settings.cutlines = byId("mtcCardsCut").checked;
  }

  function updateSummary(){
    const count = settings.selected.length;
    const sheets = Math.ceil(count / CARDS_PER_SHEET);
    const pages = settings.mode === "duplex" ? sheets * 2 : sheets;
    byId("mtcCardsSummary").textContent = count
      ? count + " substance(s) · " + sheets + " feuille(s) · " + pages + " page(s) imprimée(s)"
      : "Aucune substance sélectionnée";
  }

  function schedulePreview(){
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 350);
  }

  function renderPreview(){
    const frame = byId("mtcCardsPreview");
    const note = byId("mtcCardsPreviewNote");
    if(!frame || !modal || !modal.classList.contains("visible")) return;
    if(!settings.selected.length){
      note.textContent = "Cochez au moins une substance pour voir l'aperçu.";
      frame.srcdoc = "";
      frame.style.height = "0";
      return;
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
      setChecked("[data-herb-id]", box => !box.closest("[data-herb-row]").hidden, action === "check-visible");
    }else if(action === "clear"){
      setChecked("[data-herb-id]", () => true, false);
    }else if(action === "basket"){
      const ids = new Set(readBasketIds());
      if(!ids.size){ window.alert("Le panier de révision est vide."); return; }
      setChecked("[data-herb-id]", box => ids.has(box.getAttribute("data-herb-id")), true);
    }else if(action === "print"){
      collectSelection();
      if(!settings.selected.length){ window.alert("Coche au moins une substance."); return; }
      onChange();
      openForPrint(buildRealDocument(false).html);
      return;
    }else if(action === "test"){
      onChange();
      openForPrint(buildTestDocument(false));
      return;
    }
    onChange();
  }

  function wireModal(){
    modal.addEventListener("click", event => {
      if(event.target === modal){ closeModal(); return; }
      const closeBtn = event.target.closest("[data-cards-close]");
      if(closeBtn){ closeModal(); return; }
      const actBtn = event.target.closest("[data-cards-act]");
      if(actBtn){ handleAction(actBtn.getAttribute("data-cards-act")); return; }
      const presetBtn = event.target.closest("[data-cards-preset]");
      if(presetBtn){
        const preset = PRESETS[presetBtn.getAttribute("data-cards-preset")];
        settings.recto = preset.recto.slice();
        settings.verso = preset.verso.slice();
        syncControlsFromSettings();
        onChange();
      }
    });
    modal.addEventListener("change", event => {
      const groupToggle = event.target.closest("[data-group-toggle]");
      if(groupToggle){
        const code = groupToggle.getAttribute("data-group-toggle");
        modal.querySelectorAll('[data-herb-row][data-class="' + code + '"]').forEach(row => {
          if(!row.hidden) row.querySelector("[data-herb-id]").checked = groupToggle.checked;
        });
      }
      onChange();
    });
    byId("mtcCardsSearch").addEventListener("input", applyFilters);
    byId("mtcCardsClass").addEventListener("change", applyFilters);
    byId("mtcCardsPriority").addEventListener("change", applyFilters);
    ["mtcCardsDx", "mtcCardsDy"].forEach(id => byId(id).addEventListener("input", onChange));
    document.addEventListener("keydown", event => {
      if(event.key === "Escape" && modal.classList.contains("visible")) closeModal();
    });
    window.addEventListener("message", event => {
      const height = event.data && event.data.mtcCardsPreviewHeight;
      const frame = byId("mtcCardsPreview");
      if(height && frame && event.source === frame.contentWindow) frame.style.height = Math.ceil(height + 12) + "px";
    });
  }

  function openModal(){
    settings = loadSettings();
    ensureModal();
    syncControlsFromSettings();
    applyFilters();
    updateSummary();
    modal.classList.add("visible");
    document.body.classList.add("mtc-cards-open");
    renderPreview();
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
    window.MTCPharmaCards = {open:openModal, close:closeModal, slotsFor, backSlotSource, splitNature, splitSaveur, splitTopLevel, cardInnerHtml, buildDocument, buildPagesHtml};
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
