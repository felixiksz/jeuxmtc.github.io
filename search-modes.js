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
    ["tous", "Tous les mots", "Tous les mots doivent être dans la fiche, où que ce soit."],
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

  // termes : chaque mot, ou une expression entre guillemets (guillemet pas encore refermé compris) ; en mode exact, toute la saisie
  function termes(query){
    const brut = String(query == null ? "" : query);
    if(mode === "exact"){ const t = normMatch(brut.replace(/["«»“”]/g, " ")); return t ? [t] : []; }
    const res = [];
    let reste = brut.replace(/["«“]([^"»”]+)["»”]/g, (_, p) => { const t = normMatch(p); if(t) res.push(t); return " "; });
    const ouv = reste.match(/["«“]([^"»”]*)$/);
    if(ouv){ const t = normMatch(ouv[1]); if(t) res.push(t); reste = reste.slice(0, ouv.index); }
    normMatch(reste).split(" ").filter(Boolean).forEach(w => res.push(w));
    return res;
  }
  // mots rapprochés : chacun a une occurrence à moins de `fen` caractères d'une occurrence du mot le plus rare
  function proche(h, mots, fen){
    fen = fen || 80;
    if(mots.length < 2) return true;
    const pos = mots.map(m => { const l = []; let i = 0, j; while((j = h.indexOf(m, i)) >= 0 && l.length < 400){ l.push(j); i = j + 1; } return l; });
    if(pos.some(l => !l.length)) return false;
    let bi = 0; pos.forEach((l, k) => { if(l.length < pos[bi].length) bi = k; });
    return pos[bi].some(p => pos.every((l, k) => k === bi || l.some(q => Math.abs(q - p) <= fen)));
  }

  const compte = (mots, h) => mots.filter(w => h.includes(w)).length;
  const correspond = (mots, h) => mode === "un" ? mots.some(w => h.includes(w)) : mots.every(w => h.includes(w)) && (mode !== "proches" || proche(h, mots));
  const motsActifs = () => { const i = document.getElementById("pharmaSearchKeywords") || document.getElementById("advancedSearchKeywords"); return termes(i ? i.value : ""); };
  const barreHtml = () => '<div class="srm" role="group" aria-label="Façon de chercher">' +
    MODES.map(([k, l, aide]) => '<button type="button" data-m="' + k + '" aria-pressed="' + (k === mode) + '" title="' + esc(aide) + '">' + esc(l) + "</button>").join("") + "</div>";

  // texte échappé, termes surlignés ; si la longueur normalisée diffère, pas de surlignage
  function marque(texte, mots){
    texte = String(texte == null ? "" : texte);
    const m = (mots || []).filter(Boolean);
    if(!m.length) return esc(texte);
    const chars = Array.from(texte), nt = Array.from(normSimple(texte));
    if(chars.length !== nt.length) return esc(texte);
    const nts = nt.join(""), on = new Array(chars.length).fill(false);
    m.forEach(w => { let j, i = 0; while((j = nts.indexOf(w, i)) >= 0){ for(let k = j; k < j + w.length; k++) on[k] = true; i = j + w.length; } });
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
      let t = String(c == null ? "" : c).replace(/\S*_\S*/g, " ").replace(/\s+/g, " ").trim();
      if(nt.length > 3) for(let g = 0; g < 4; g++){ const p = normSimple(t).indexOf(nt); if(p < 0 || p > 300) break; t = (t.slice(0, p) + " " + t.slice(p + nt.length)).replace(/\s+/g, " ").trim(); }
      if(!t) return;
      const n = normSimple(t); let nb = 0, idx = -1;
      mots.forEach(w => { const j = n.indexOf(w); if(j >= 0){ nb++; if(idx < 0 || j < idx) idx = j; } });
      if(nb && (!meilleur || nb > meilleur.nb)) meilleur = {t, idx, nb};
    });
    if(!meilleur) return "";
    const t = meilleur.t, idx = meilleur.idx;
    let d = Math.max(0, idx - avant), f = Math.min(t.length, idx + apres);
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
    if(m === "phrase") return h.includes(normMatch(keywords));
    if(mode === "un") return mots.some(w => h.includes(w));
    return mots.every(w => h.includes(w)) && (mode !== "proches" || proche(h, mots));
  };

  const prevResults = window.advancedSearchResults;
  window.advancedSearchResults = function(){
    const r = prevResults.apply(this, arguments);
    if(pharma() || mode !== "un") return r;
    const f = getAdvancedSearchFilters(), mots = termes(f.keywords);
    if(mots.length < 2) return r;
    const nb = new Map(r.map(p => { const h = normMatch(pointSearchHaystack(p, f.scopes)); return [p, mots.filter(w => h.includes(w)).length]; }));
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
    p.textContent = (pharma() ? "Aucune substance ne correspond à « " : "Aucun point ne correspond à « ") + mots.join(" + ") + " » (" + lib().replace(/^« » /, "") + ")." + (mode === "un" ? "" : " Essaie une façon de chercher plus large, juste au-dessus.");
  }
  const prevWith = window.renderAdvancedSearchResultsWith;
  window.renderAdvancedSearchResultsWith = function(results, total){
    prevWith.apply(this, arguments);
    if(pharma() || total) return;
    programmerMessageVide();
  };
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
      mots.forEach(w => { let j, i = 0; while((j = nt.indexOf(w, i)) >= 0){ plages.push([j, j + w.length]); i = j + w.length; } });
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
    ".srm button[aria-pressed='true']{ border-color:var(--text-color, currentColor); box-shadow:inset 0 -2px 0 var(--text-color, currentColor); }" +
    "mark.surlignage{ background:#f4ff00; color:#000; font-weight:inherit; padding:0 .12em; border-radius:2px; box-shadow:0 0 0 1px #c9d100; }" +
    "mark.gsr-fluo{ scroll-margin-top:8rem; }" +
    ".search-results-list:has(.search-result-rich){ display:block !important; }" +
    ".search-result-rich{ display:block !important; width:100% !important; max-width:none !important; }" +
    ".search-result-rich .compact-point-row{ display:flex !important; align-items:flex-start; gap:12px; width:100%; }" +
    ".search-result-rich .compact-point-code{ flex:0 0 auto !important; width:auto !important; min-width:3.2em; }" +
    ".search-result-rich .compact-point-tools{ flex:0 0 auto; margin-left:auto; }" +
    ".search-result-rich .srx{ flex:1 1 0; min-width:0; display:block; text-align:left; font-weight:400; text-transform:none; letter-spacing:0; font-size:.85rem; }" +
    ".search-result-rich .srx > span{ display:block; }" +
    ".search-result-rich .srx-t{ font-weight:700; font-size:.9rem; }" +
    ".search-result-rich .srx-s{ font-size:.78rem; opacity:.75; }" +
    ".search-result-rich .srx-c{ font-size:.8rem; line-height:1.35; margin-top:3px; padding-left:8px; border-left:2px solid var(--shadow-color, currentColor); }";
  document.head.appendChild(st);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { try{ injecterModes(); }catch(e){} }); else { try{ injecterModes(); }catch(e){} }
})();
