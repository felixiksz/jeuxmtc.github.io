/* ============================================================
   collection.js
   Collection : chaque point (acupuncture) ou substance (pharmacopée) trouvé
   dans un groupe du jeu principal s'allume dans un atlas, canal par canal
   ou classe par classe. Un canal (ou une classe) complet : palier annoncé.
   Ouverture : Menu → Suivi → Collection (window.mtcOpenCollection).
   Données : localStorage mtc_collection_v1 = {acu:{P9:2, …}, pharma:{CF3:1, …}}.
   ============================================================ */
(function(){
  "use strict";
  if(window.mtcOpenCollection) return;
  const KEY = "mtc_collection_v1";
  const CH = ["P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F", "RM", "DM"];
  const NAMES = {P:"Poumon", GI:"Gros intestin", E:"Estomac", Rt:"Rate", C:"Cœur", IG:"Intestin grêle", V:"Vessie", Rn:"Reins",
    EC:"Enveloppe du cœur", TF:"Trois foyers", VB:"Vésicule biliaire", F:"Foie", RM:"Rèn mài", DM:"Dū mài"};
  const COLOR = {E:"#d9a400", Rt:"#d9a400", VB:"#2f9a3c", F:"#2f9a3c", C:"#e0261b", IG:"#e0261b", EC:"#e0261b", TF:"#e0261b",
    V:"#1f5fd6", Rn:"#1f5fd6", RM:"#d77fa4", DM:"#6aa9d6"};
  const ink = c => COLOR[c] || "var(--text-color)";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const pharma = () => document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  const load = () => { try{ const o = JSON.parse(localStorage.getItem(KEY) || "{}"); return {acu:o.acu || {}, pharma:o.pharma || {}}; }catch(e){ return {acu:{}, pharma:{}}; } };
  const save = o => { try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} };
  const split = id => { const m = /^([A-Za-z]+?)(\d+)$/.exec(String(id).replace(/\s+/g, "")); return m ? [m[1], +m[2]] : null; };

  // groupes de l'atlas : canaux (points connus du jeu) ou classes de substances
  function groups(){
    if(pharma()){
      const by = {};
      (window.PHARMA_HERBS || []).forEach(h => { const k = h.classe || "Autres"; (by[k] = by[k] || []).push(h); });
      return Object.keys(by).map(k => ({key:k, title:k.replace(/^SM /, "Substances "), color:"var(--text-color)",
        items:by[k].map(h => ({id:h.id, label:h.pinyin || h.pinyinSansTons || h.id}))}));
    }
    const P = window.POINT_DETAILS || {}, by = {};
    Object.keys(P).forEach(id => { const s = split(id); if(s && CH.includes(s[0])) (by[s[0]] = by[s[0]] || []).push({id, n:s[1]}); });
    return CH.filter(c => by[c]).map(c => ({key:c, title:c + " · " + NAMES[c], color:ink(c),
      items:by[c].sort((a, b) => a.n - b.n).map(p => ({id:p.id, label:c + " " + p.n}))}));
  }

  // un groupe trouvé par læ joueur·se : ses points entrent dans la collection
  function add(points){
    const o = load(), dom = pharma() ? "pharma" : "acu", before = {};
    const gs = groups();
    gs.forEach(g => { before[g.key] = g.items.every(i => o[dom][i.id]); });
    points.forEach(p => { const id = String(p).replace(/\s+/g, ""); o[dom][id] = (o[dom][id] || 0) + 1; });
    save(o);
    // palier : un canal (ou une classe) complet
    gs.forEach(g => {
      if(!before[g.key] && g.items.length && g.items.every(i => o[dom][i.id]) && window.mtcAnnounce)
        setTimeout(() => window.mtcAnnounce(dom === "pharma" ? "Classe complète" : "Canal complet", g.title), 1200);
    });
  }
  function hook(){
    const orig = window.solveGroup;
    if(typeof orig !== "function" || orig.__mtcCollection) return;
    const w = function(group){
      const by = group && group._solvedBy, pts = group && group.points ? group.points.slice() : [];
      const res = orig.apply(this, arguments);
      if(by === "points" || by === "final") try{ add(pts); }catch(e){}
      return res;
    };
    w.__mtcCollection = true;
    // garde les marques des autres crochets (celebrate.js)
    Object.keys(orig).forEach(k => { try{ w[k] = orig[k]; }catch(e){} });
    window.solveGroup = w;
  }
  if(document.readyState === "complete") hook(); else window.addEventListener("load", () => setTimeout(hook, 0));

  const css =
    "#mtcCollection{ position:fixed; inset:0; z-index:9900; background:var(--page-bg, #fcfcfa); color:var(--text-color); overflow:auto; -webkit-overflow-scrolling:touch; }" +
    "#mtcCollection .cw{ max-width:860px; margin:0 auto; padding:18px 20px 60px; }" +
    "#mtcCollection .ch{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:6px; }" +
    "#mtcCollection h2{ font:800 1.05rem 'Archivo', sans-serif; letter-spacing:.08em; text-transform:uppercase; margin:0; }" +
    "#mtcCollection .x{ font:700 .8rem 'Archivo', sans-serif; letter-spacing:.06em; text-transform:uppercase; background:none; border:0; color:inherit; cursor:pointer; }" +
    "#mtcCollection .tot{ font-size:.85rem; margin:0 0 4px; } #mtcCollection .bar{ height:4px; border-radius:2px; background:color-mix(in srgb, var(--shadow-color) 16%, var(--page-bg)); margin:0 0 18px; overflow:hidden; }" +
    "#mtcCollection .bar i{ display:block; height:100%; background:var(--shadow-color); }" +
    "#mtcCollection .g{ display:grid; grid-template-columns:150px 1fr 56px; gap:6px 12px; align-items:center; padding:8px 0; border-top:1px solid var(--hair, rgba(0,0,0,.08)); }" +
    "#mtcCollection .gt{ font:700 .82rem 'Archivo', sans-serif; } #mtcCollection .gn{ font-size:.78rem; text-align:right; white-space:nowrap; }" +
    "#mtcCollection .dots{ display:flex; flex-wrap:wrap; gap:4px; }" +
    "#mtcCollection .d{ width:13px !important; height:13px !important; min-width:0 !important; min-height:0 !important; flex:0 0 13px; margin:0 !important; border-radius:50% !important; border:1.5px solid; box-sizing:border-box; padding:0 !important; background:transparent; box-shadow:none !important; cursor:pointer; }" +
    "body:has(#mtcCollection) #supportCoffeeButton, body:has(#mtcCollection) #mtcSupportLabel{ display:none !important; }" +
    "#mtcCollection .d:disabled{ cursor:default; opacity:.45; }" +
    "#mtcCollection .full .gt::after{ content:' ✦'; }" +
    "@media (max-width:600px){ #mtcCollection .g{ grid-template-columns:1fr 52px; } #mtcCollection .dots{ grid-column:1 / -1; grid-row:2; } }";
  window.mtcOpenCollection = function(){
    if(!document.getElementById("mtcCollectionStyle")){ const st = document.createElement("style"); st.id = "mtcCollectionStyle"; st.textContent = css; document.head.appendChild(st); }
    let el = document.getElementById("mtcCollection");
    if(!el){ el = document.createElement("div"); el.id = "mtcCollection"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Collection"); document.body.appendChild(el); }
    const o = load(), dom = pharma() ? "pharma" : "acu", have = o[dom], gs = groups();
    const total = gs.reduce((a, g) => a + g.items.length, 0), got = gs.reduce((a, g) => a + g.items.filter(i => have[i.id]).length, 0);
    el.innerHTML = '<div class="cw"><div class="ch"><h2>Collection</h2><button type="button" class="x" id="mtcCollClose">× Fermer</button></div>' +
      '<p class="tot">' + got + " / " + total + (dom === "pharma" ? " substances" : " points") + " trouvé" + (dom === "pharma" ? "es" : "s") + " dans les groupes du jeu.</p>" +
      '<div class="bar"><i style="width:' + (total ? got / total * 100 : 0).toFixed(1) + '%"></i></div>' +
      gs.map(g => {
        const n = g.items.filter(i => have[i.id]).length;
        return '<div class="g' + (n === g.items.length ? " full" : "") + '"><span class="gt" style="color:' + g.color + '">' + esc(g.title) + '</span><span class="dots">' +
          g.items.map(i => '<button type="button" class="d" data-id="' + esc(i.id) + '" title="' + esc(i.label) + (have[i.id] ? " · trouvé " + have[i.id] + " fois" : " · pas encore trouvé") + '" style="border-color:' + g.color + (have[i.id] ? ";background:" + g.color : "") + '"' + (have[i.id] ? "" : " disabled") + "></button>").join("") +
          '</span><span class="gn">' + n + " / " + g.items.length + "</span></div>";
      }).join("") + "</div>";
    const close = () => el.remove();
    el.querySelector("#mtcCollClose").addEventListener("click", close);
    // un point allumé : sa fiche s'ouvre
    el.querySelectorAll(".d:not([disabled])").forEach(b => b.addEventListener("click", () => {
      close();
      if(dom === "pharma"){ if(window.openPharmaHerbPanel) window.openPharmaHerbPanel(b.dataset.id); }
      else if(window.openPointPanelDirect) window.openPointPanelDirect(b.dataset.id);
    }));
  };
})();
