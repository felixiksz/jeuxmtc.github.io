/* ============================================================
   search-modes.js
   Recherche avancée des points : quatre façons de chercher, surlignage des termes dans les résultats
   (titre, sous-titre, extrait) et dans la fiche ouverte. Se pose par-dessus la recherche existante.
   Réglage mémorisé : mtc_search_mode_v1 (tous / proches / exact / un).
   ============================================================ */
(function(){
  "use strict";
  const KEY = "mtc_search_mode_v1";
  const MODES = [
    ["tous", "Tous les mots", "Tous les mots doivent être dans la fiche, où que ce soit. Chaque mot est cherché par son début, au singulier comme au pluriel."],
    ["proches", "Mots proches", "Tous les mots, mais rapprochés : dans un même passage (quelques mots d’écart au plus)."],
    ["exact", "« » Expression exacte", "La suite de mots telle quelle (par exemple « foie gras » ne trouve pas « foie » ici et « gras » là). Tu peux aussi mettre une expression entre guillemets dans n’importe quel mode."],
    ["un", "Un des mots", "Au moins un des mots ; les points qui en contiennent le plus passent en tête."]
  ];
  let mode = "tous";
  try{ const m = localStorage.getItem(KEY); if(MODES.some(x => x[0] === m)) mode = m; }catch(e){}
  const pharma = () => document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  const lib = () => (MODES.find(x => x[0] === mode) || MODES[0])[1];

  // Comparaison sans accents, sans casse, apostrophes unifiées ; un caractère reste un caractère (les positions restent valables).
  const car = c => { const d = c.normalize("NFD")[0] || c; return /\s/.test(d) ? " " : "’‘`´".includes(d) ? "'" : d.toLowerCase(); };
  const normSimple = s => Array.from(String(s == null ? "" : s), car).join("");
  const normMatch = s => normSimple(s).replace(/\s+/g, " ").trim();
  const esc = s => typeof escapeHtml === "function" ? escapeHtml(s) : String(s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));

  const ENTIER = "\u0001";   // marque un terme à chercher en mots entiers
  const lisible = t => String(t).replace(/\u0001/g, "");
  // termes : chaque mot, ou une expression entre guillemets (guillemet pas encore refermé compris) ; en mode exact, toute la saisie
  function termes(query){
    const brut = String(query == null ? "" : query);
    if(mode === "exact"){ const t = normMatch(brut.replace(/["«»“”]/g, " ")); return t ? [ENTIER + t] : []; }
    const res = [];
    let reste = brut.replace(/["«“]([^"»”]+)["»”]/g, (_, p) => { const t = normMatch(p); if(t) res.push(ENTIER + t); return " "; });
    const ouv = reste.match(/["«“]([^"»”]*)$/);
    if(ouv){ const t = normMatch(ouv[1]); if(t) res.push(ENTIER + t); reste = reste.slice(0, ouv.index); }
    normMatch(reste).split(" ").filter(Boolean).forEach(w => res.push(w));
    return res;
  }
  // Un mot se cherche par son début (« insom » trouve « insomnie », « dents » ne trouve pas « accidents »), au singulier comme au pluriel
  // (« dent » = « dents »). Un mot de trois lettres ou moins, une expression entre guillemets et le mode « Expression exacte » se cherchent en
  // mots entiers. Une étoile ouvre le début (« *ite » trouve « arthrite ») ou la fin (« dent* ») d'un mot. Les codes (Rt4) et les hanzi se cherchent tels quels.
  const ech = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const RX = new Map();
  function rxOf(t){
    if(RX.has(t)) return RX.get(t);
    const marque = t.charCodeAt(0) === 1, brut = marque ? t.slice(1) : t;
    const gauche = brut.startsWith("*"), droite = brut.length > 1 && brut.endsWith("*"), coeur = brut.replace(/^\*+|\*+$/g, "").trim();
    let r = null;
    if(coeur){
      const tel = /[0-9]/.test(coeur) || /[㐀-鿿]/.test(coeur);
      const entier = marque || coeur.length <= 3 || coeur.includes(" ");
      const racine = w => w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w;
      const motif = tel ? ech(coeur).replace(/ +/g, " +")
        : entier ? coeur.split(" ").map(w => w.length > 3 ? ech(racine(w)) + "[sx]?" : ech(w)).join(" +")
        : ech(racine(coeur));
      r = new RegExp((tel || gauche ? "()" : "(^|[^\\p{L}\\p{N}])") + "(" + motif + ")" + (tel || droite || !entier ? "" : "(?![\\p{L}\\p{N}])"), "gu");
    }
    if(RX.size > 300) RX.clear();
    RX.set(t, r);
    return r;
  }
  // positions [début, fin] des occurrences d'un terme dans un texte déjà normalisé
  function trouves(h, t, max){
    const re = rxOf(t); if(!re) return [];
    re.lastIndex = 0;
    const out = []; let m;
    while((m = re.exec(h)) && out.length < (max || 400)){ const d = m.index + m[1].length; out.push([d, d + m[2].length]); }
    return out;
  }
  const contient = (h, t) => trouves(h, t, 1).length > 0;

  // mots rapprochés : chacun a une occurrence à moins de `fen` caractères d'une occurrence du mot le plus rare
  function proche(h, mots, fen){
    fen = fen || 80;
    if(mots.length < 2) return true;
    const pos = mots.map(m => trouves(h, m).map(x => x[0]));
    if(pos.some(l => !l.length)) return false;
    let bi = 0; pos.forEach((l, k) => { if(l.length < pos[bi].length) bi = k; });
    return pos[bi].some(p => pos.every((l, k) => k === bi || l.some(q => Math.abs(q - p) <= fen)));
  }

  const compte = (mots, h) => mots.filter(w => contient(h, w)).length;
  const correspond = (mots, h) => mode === "un" ? mots.some(w => contient(h, w)) : mots.every(w => contient(h, w)) && (mode !== "proches" || proche(h, mots));
  const motsActifs = () => { const i = document.getElementById("pharmaSearchKeywords") || document.getElementById("advancedSearchKeywords"); return termes(i ? i.value : ""); };
  const barreHtml = () => '<div class="srm" role="group" aria-label="Façon de chercher">' +
    MODES.map(([k, l, aide]) => '<button type="button" data-m="' + k + '" aria-pressed="' + (k === mode) + '" title="' + esc(aide) + '">' + esc(l) + "</button>").join("") +
    '<span class="srm-note">Un mot se cherche par son début (insom trouve insomnie), au singulier comme au pluriel. Entre guillemets : mots entiers. *ite cherche une fin de mot.</span></div>';

  // texte échappé, termes surlignés ; si la longueur normalisée diffère, pas de surlignage
  function marque(texte, mots){
    texte = String(texte == null ? "" : texte);
    const m = (mots || []).filter(Boolean);
    if(!m.length) return esc(texte);
    const chars = Array.from(texte), nt = Array.from(normSimple(texte));
    if(chars.length !== nt.length) return esc(texte);
    const nts = nt.join(""), on = new Array(chars.length).fill(false);
    m.forEach(w => trouves(nts, w).forEach(([d, f]) => { for(let k = d; k < f; k++) on[k] = true; }));
    let html = "", k = 0;
    while(k < chars.length){
      let e = k; while(e < chars.length && on[e] === on[k]) e++;
      const s = esc(chars.slice(k, e).join(""));
      html += on[k] ? '<mark class="surlignage">' + s + "</mark>" : s;
      k = e;
    }
    return html;
  }
  // passage du texte autour du premier terme trouvé, dans le champ qui en contient le plus ; le titre répété est retiré (au plus 4 fois)
  function extrait(champs, mots, titre, avant, apres){
    avant = avant || 60; apres = apres || 130;
    const nt = normSimple(String(titre || "")).trim();
    let meilleur = null;
    (champs || []).forEach(c => {
      let src = String(c == null ? "" : c), enBloc = false;
      // texte en blocs séparés par une ligne vide (par exemple un bloc par point, comme les points Huá Tuó) : seul le bloc où se trouvent les mots est montré,
      // sur une ligne, avec son titre devant
      if(/\n\s*\n/.test(src)){
        let bloc = null;
        src.split(/\n\s*\n/).forEach(b => { const nb = mots.filter(w => trouves(normSimple(b), w, 1).length).length; if(nb && (!bloc || nb > bloc.nb)) bloc = {b, nb}; });
        if(bloc){ enBloc = true; const ls = bloc.b.split("\n").map(l => l.replace(/^\s*[-•➢]\s*/, "").trim()).filter(Boolean); src = ls.length > 1 && ls[0].length <= 24 ? ls[0] + " · " + ls.slice(1).join(" · ") : ls.join(" · "); }
      }
      let t = src.replace(/\S*_\S*/g, " ").replace(/\s+/g, " ").trim();
      if(nt.length > 3) for(let g = 0; g < 4; g++){ const p = normSimple(t).indexOf(nt); if(p < 0 || p > 300) break; t = (t.slice(0, p) + " " + t.slice(p + nt.length)).replace(/\s+/g, " ").trim(); }
      if(!t) return;
      const n = normSimple(t); let nb = 0, idx = -1;
      mots.forEach(w => { const ps = trouves(n, w, 1); if(ps.length){ nb++; const j = ps[0][0]; if(idx < 0 || j < idx) idx = j; } });
      if(nb && (!meilleur || nb > meilleur.nb)) meilleur = {t, idx, nb, enBloc};
    });
    if(!meilleur) return "";
    const t = meilleur.t, idx = meilleur.idx;
    let d = Math.max(0, idx - avant), f = Math.min(t.length, idx + apres);
    if(meilleur.enBloc && t.length <= 320){ d = 0; f = t.length; }   // un bloc court est montré en entier, titre compris
    if(d > 0){ const e = t.indexOf(" ", d); if(e >= 0 && e < idx) d = e + 1; }
    if(f < t.length){ const e = t.lastIndexOf(" ", f); if(e > idx) f = e; }
    return (d > 0 ? "… " : "") + t.slice(d, f).trim() + (f < t.length ? " …" : "");
  }

  function blocHtml(titre, sous, champs, mots){
    const ctx = extrait(champs, mots, titre);
    return '<span class="srx">' + (titre ? '<span class="srx-t">' + marque(titre, mots) + "</span>" : "") +
      (sous ? '<span class="srx-s">' + marque(sous, mots) + "</span>" : "") + (ctx ? '<span class="srx-c">' + marque(ctx, mots) + "</span>" : "") + "</span>";
  }

  // ---- la recherche existante, complétée ----
  const prevMatch = window.pointMatchesKeywords;
  window.pointMatchesKeywords = function(point, keywords, scopes, m){
    if(pharma() || typeof prevMatch !== "function") return typeof prevMatch === "function" ? prevMatch.apply(this, arguments) : true;
    const mots = termes(keywords);
    if(!mots.length) return true;
    const h = normMatch(pointSearchHaystack(point, scopes));
    if(m === "phrase") return contient(h, normMatch(String(keywords).replace(/["«»“”*]/g, " ")));
    return correspond(mots, h);
  };

  const prevResults = window.advancedSearchResults;
  window.advancedSearchResults = function(){
    const r = prevResults.apply(this, arguments);
    if(pharma() || mode !== "un") return r;
    const f = getAdvancedSearchFilters(), mots = termes(f.keywords);
    if(mots.length < 2) return r;
    const nb = new Map(r.map(p => { const h = normMatch(pointSearchHaystack(p, f.scopes)); return [p, compte(mots, h)]; }));
    return r.map((p, i) => [p, i]).sort((a, b) => nb.get(b[0]) - nb.get(a[0]) || a[1] - b[1]).map(x => x[0]);
  };

  // chaque résultat : titre, sous-titre et extrait, termes surlignés
  const prevRow = window.advancedSearchResultHtml;
  window.advancedSearchResultHtml = function(point){
    const html = prevRow.apply(this, arguments);
    if(pharma()) return html;
    try{
      const f = getAdvancedSearchFilters(), mots = termes(f.keywords);
      if(!mots.length) return html;
      const d = POINT_DETAILS[point] || {};
      const titre = [d.pinyin, d.hanzi, d.nom_francais || d.nom_complet].filter(Boolean).join(" · ");
      const sous = typeof searchPointMeta === "function" ? searchPointMeta(point) : "";
      const champs = (f.scopes && f.scopes.length ? f.scopes : MTC_SEARCH_SCOPES).map(s => pointSearchTextForScope(point, s));
      const bloc = blocHtml(titre, sous, champs, mots);
      if(!/<span class="compact-point-code">[\s\S]*?<\/span>/.test(html)) return html;
      return html.replace(/(<span class="compact-point-code">[\s\S]*?<\/span>)/, "$1" + bloc).replace('<li class="search-result-item', '<li class="search-result-item search-result-rich');
    }catch(e){ return html; }
  };

  // aucun résultat : le message rappelle la façon de chercher (réaffiché après le passage d'autres modules sur la zone des résultats)
  function messageVide(){
    const c = document.getElementById("advancedSearchResults");
    if(!c || c.querySelector(".search-results-list")) return;
    const mots = motsActifs();
    if(!mots.length) return;
    c.querySelectorAll("p.stats-small:not(.srx-vide)").forEach(x => x.remove());
    let p = c.querySelector(".srx-vide");
    if(!p){ p = document.createElement("p"); p.className = "srx-vide"; c.appendChild(p); }
    p.textContent = (pharma() ? "Aucune substance ne correspond à « " : "Aucun point ne correspond à « ") + mots.map(lisible).join(" + ") + " » (" + lib().replace(/^« » /, "") + ")." + (mode === "un" ? "" : " Essaie une façon de chercher plus large, juste au-dessus.");
  }
  const prevWith = window.renderAdvancedSearchResultsWith;
  window.renderAdvancedSearchResultsWith = function(results, total){
    prevWith.apply(this, arguments);
    if(pharma()) return;
    if(total && results && total > results.length){ ajouterPlus(results.length, total); return; }
    if(total) return;
    programmerMessageVide();
  };
  // la liste s'arrête à 80 résultats : un bouton affiche les autres
  function ajouterPlus(n, total){
    const c = document.getElementById("advancedSearchResults"); if(!c || c.querySelector(".srx-plus")) return;
    c.insertAdjacentHTML("beforeend", '<button type="button" class="srx-plus">Afficher les ' + (total - n) + " autres résultats</button>");
    c.querySelector(".srx-plus").addEventListener("click", () => { prevWith.call(window, window.advancedSearchResults(), total); });
  }
  function programmerMessageVide(){ messageVide(); setTimeout(messageVide, 30); setTimeout(messageVide, 150); }

  // rangée de boutons sous le champ de recherche (reste visible même sans résultat)
  function injecterModes(){
    if(pharma()) return;
    const input = document.getElementById("advancedSearchKeywords"); if(!input) return;
    const zone = input.closest(".search-control") || input.parentElement; if(!zone) return;
    if(zone.nextElementSibling && zone.nextElementSibling.classList.contains("srm")) return;
    zone.insertAdjacentHTML("afterend", barreHtml());
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest(".srm button[data-m]"); if(!b) return;
    mode = b.dataset.m;
    try{ localStorage.setItem(KEY, mode); }catch(e){}
    document.querySelectorAll(".srm button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.m === mode)));
    if(typeof renderAdvancedSearchResults === "function") renderAdvancedSearchResults();
  });
  const prevPanel = window.renderAdvancedSearchPanel;
  window.renderAdvancedSearchPanel = function(){
    const r = typeof prevPanel === "function" ? prevPanel.apply(this, arguments) : undefined;
    try{ injecterModes(); }catch(e){}
    return r;
  };

  // fiche ouverte depuis un résultat : termes surlignés, défilement jusqu'au premier (le contenu peut se charger encore : quelques essais)
  function surlignerOuvert(mots, essai){
    essai = essai || 0;
    const racine = document.getElementById("pointPanelContent");
    if(!racine || !mots.length) return;
    racine.querySelectorAll("mark.gsr-fluo").forEach(x => { const p = x.parentNode; p.replaceChild(document.createTextNode(x.textContent), x); p.normalize(); });
    const SAUTE = "mark, script, style, textarea, input, select, svg, button";
    const noeuds = [], tw = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    for(let n = tw.nextNode(); n; n = tw.nextNode()){ if(n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest(SAUTE))) noeuds.push(n); }
    let premier = null;
    noeuds.forEach(n => {
      const txt = n.nodeValue, nt = normSimple(txt);
      if(Array.from(txt).length !== Array.from(nt).length) return;
      const plages = [];
      mots.forEach(w => trouves(nt, w).forEach(p => plages.push(p)));
      if(!plages.length) return;
      plages.sort((x, y) => x[0] - y[0]);
      const fus = []; plages.forEach(p => { const l = fus[fus.length - 1]; if(l && p[0] <= l[1]) l[1] = Math.max(l[1], p[1]); else fus.push(p.slice()); });
      const frag = document.createDocumentFragment(); let i = 0;
      fus.forEach(([d, f]) => {
        if(d > i) frag.appendChild(document.createTextNode(txt.slice(i, d)));
        const mk = document.createElement("mark"); mk.className = "surlignage gsr-fluo"; mk.textContent = txt.slice(d, f); frag.appendChild(mk); if(!premier) premier = mk; i = f;
      });
      if(i < txt.length) frag.appendChild(document.createTextNode(txt.slice(i)));
      n.parentNode.replaceChild(frag, n);
    });
    if(premier){
      for(let d = premier.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
      premier.scrollIntoView({block:"center", behavior:"auto"});
    }else if(essai < 5) setTimeout(() => surlignerOuvert(mots, essai + 1), 700);
  }
  const ouvrir = ev => {
    const row = ev.target.closest && ev.target.closest("#advancedSearchResults .compact-point-row");
    if(!row || ev.target.closest(".compact-point-tools")) return;
    if(ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
    const mots = motsActifs();
    if(mots.length) setTimeout(() => surlignerOuvert(mots, 0), 450);
  };
  document.addEventListener("click", ouvrir, true);
  document.addEventListener("keydown", ouvrir, true);

  window.mtcSearch = {marque, termes, normMatch, correspond, compte, barreHtml, blocHtml, programmerMessageVide, lib, get mode(){ return mode; }, motsActifs};

  // présentation
  const st = document.createElement("style");
  st.textContent =
    ".srx-vide{ display:block !important; font-size:.85rem; line-height:1.4; margin:8px 0; }" +
    ".srm{ display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 10px; grid-column:1 / -1; width:100%; }" +
    ".srm button{ background:none; border:1px solid var(--shadow-color, currentColor); color:var(--text-color, inherit); padding:5px 10px; font:700 .72rem 'Archivo', sans-serif; letter-spacing:.03em; cursor:pointer; border-radius:0; }" +
    ".srx-plus{ display:block; margin:12px 0 4px; background:none; border:1px solid var(--shadow-color, currentColor); color:var(--text-color, inherit); padding:7px 12px; font:700 .76rem 'Archivo', sans-serif; letter-spacing:.03em; cursor:pointer; border-radius:0; }" +
    ".srm-note{ flex-basis:100%; font-size:.74rem; line-height:1.35; opacity:.7; }" +
    ".srm button[aria-pressed='true']{ border-color:var(--text-color, currentColor); box-shadow:inset 0 -2px 0 var(--text-color, currentColor); }" +
    "mark.surlignage{ background:#f4ff00; color:#000; font-weight:inherit; padding:0 .12em; border-radius:2px; box-shadow:0 0 0 1px #c9d100; }" +
    "mark.gsr-fluo{ scroll-margin-top:8rem; }" +
    "html body #advancedSearchPanel .search-results-list:has(.search-result-rich){ display:block !important; grid-template-columns:none !important; column-count:auto !important; gap:0 !important; }" +
    "html body #advancedSearchPanel .search-result-rich{ display:block !important; width:100% !important; max-width:none !important; margin:0 !important; padding:0 !important; float:none !important; }" +
    "html body #advancedSearchPanel .search-result-rich .compact-point-row{ display:flex !important; align-items:flex-start !important; justify-content:flex-start !important; gap:12px !important; width:100% !important; padding:9px 10px !important; border-radius:10px !important; box-shadow:none; }" +
    "html body #advancedSearchPanel .search-result-rich .compact-point-row:hover, html body #advancedSearchPanel .search-result-rich .compact-point-row:active{ box-shadow:0 3px 10px var(--shadow-color) !important; }" +
    "html body #advancedSearchPanel .search-result-rich .compact-point-code{ flex:0 0 auto !important; width:auto !important; min-width:3.2em; max-width:8.5em !important; white-space:normal !important; overflow:visible !important; line-height:1.25 !important; }" +
    "html body #advancedSearchPanel .search-result-rich.pharma-search-result-item .compact-point-code{ flex:0 0 7.2em !important; width:7.2em !important; }" +
    "html body #advancedSearchPanel .search-result-rich:not(.pharma-search-result-item) .compact-point-code{ flex:0 0 3.8em !important; width:3.8em !important; }" +
    "html body #advancedSearchPanel .search-result-rich .compact-point-tools{ flex:0 0 auto; margin-left:auto; }" +
    "html body #advancedSearchPanel .search-result-rich .srx{ flex:1 1 0; min-width:0; display:block; text-align:left; font-weight:400; text-transform:none; letter-spacing:0; font-size:.85rem; }" +
    ".search-result-rich .srx > span{ display:block; }" +
    ".search-result-rich .srx-t{ font-weight:700; font-size:.9rem; }" +
    ".search-result-rich .srx-s{ font-size:.78rem; opacity:.75; }" +
    ".search-result-rich .srx-c{ font-size:.8rem; line-height:1.35; margin-top:3px; padding-left:8px; border-left:2px solid var(--shadow-color, currentColor); }";
  document.head.appendChild(st);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { try{ injecterModes(); }catch(e){} }); else { try{ injecterModes(); }catch(e){} }
})();
