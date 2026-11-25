/* ============================================================
   jeux-syndromes.js
   Données et petits outils communs aux jeux « Quel canal ? » et « Signe ou trajet ? » du module Trajets.
   Les syndromes des canaux et les zones traversées viennent de l'Assistant-MTC (data/syndromes/canaux/*.json et zones.json).
   Rien n'est publié avec le jeu : ils sont lus depuis le dépôt privé de l'Assistant, avec la clé de synchro GitHub de l'appareil
   (la même que circuits-assistant-sync.js), puis gardés dans la mémoire de l'appareil.
   Sans clé ni mémoire, les jeux n'ont rien à lire et le disent.
   ============================================================ */
(function(){
  "use strict";
  const KEY = "mtc_syndromes_canaux_v2";
  const FILES = {P:"poumon", GI:"gros_intestin", E:"estomac", Rt:"rate", C:"coeur", IG:"intestin_grele", V:"vessie", Rn:"rein", EC:"enveloppe_du_coeur", TF:"trois_foyers", VB:"vesicule_biliaire", F:"foie"};
  const ORD = Object.keys(FILES);
  const NAMES = {P:"Shǒu tài yīn — poumon", GI:"Shǒu yáng míng — gros intestin", E:"Zú yáng míng — estomac", Rt:"Zú tài yīn — rate",
    C:"Shǒu shào yīn — cœur", IG:"Shǒu tài yáng — intestin grêle", V:"Zú tài yáng — vessie", Rn:"Zú shào yīn — reins",
    EC:"Shǒu jué yīn — enveloppe du cœur", TF:"Shǒu shào yáng — trois foyers", VB:"Zú shào yáng — vésicule biliaire", F:"Zú jué yīn — foie"};
  // vaisseaux d'un canal, et types de passage correspondants dans zones.json
  const NIV = [["regulier", "Canal régulier"], ["luo", "Vaisseau liaison (luò)"], ["tendineux", "Canal tendineux"], ["grand_luo", "Grand luò"]];
  const NIVNOM = Object.fromEntries(NIV);
  const TYPES = {regulier:["régulier", "régulier (trajet interne)"], luo:["luo"], tendineux:["tendineux"], grand_luo:["grand luo"]};
  const get = k => { try{ return localStorage.getItem(k) || ""; }catch(e){ return ""; } };
  // caractères chinois retirés, comme dans le reste du jeu : « tài yīn (太阴) » devient « tài yīn »
  const clean = s => String(s || "").replace(/\s*\([㐀-鿿\s]+\)/g, "").replace(/\s+[㐀-鿿]+/g, "").replace(/\s*\(\s*\)/g, "").replace(/\s+([,.)…])/g, "$1").replace(/\s+/g, " ").trim();
  const b64 = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ""))));
  const cfg = () => ({token:get("mtc_github_sync_token"), owner:get("mtc_github_sync_owner"), repo:get("mtc_github_sync_repo"), branch:get("mtc_github_sync_branch") || "main"});
  const configured = () => { const c = cfg(); return !!(c.token && c.owner && c.repo); };
  let DATA = null, loading = false, error = "";
  try{ DATA = JSON.parse(get(KEY) || "null"); }catch(e){}
  async function read(c, path){
    const r = await fetch("https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/contents/" + path + "?ref=" + encodeURIComponent(c.branch),
      {headers:{"Authorization":"Bearer " + c.token, "Accept":"application/vnd.github+json"}, cache:"no-store"});
    if(!r.ok) throw new Error(path + " : " + r.status);
    return JSON.parse(b64((await r.json()).content));
  }
  // forme réduite : seulement ce que les jeux utilisent
  function compactCanal(d){
    const out = {code:d.code, nom:d.organe || "", pinyin:d.pinyin || ""};
    NIV.forEach(([n]) => {
      const v = d[n]; if(!v || !Array.isArray(v.lignes)) return;
      out[n] = v.lignes.filter(l => l && l.symptome && !l.generique).map(l => ({t:clean(l.symptome), m:clean(l.mecanisme), pv:l.plein_vide || ""}));
    });
    return out;
  }
  function compactZones(z){
    const out = {groupes:(z.groupes || []).map(g => ({id:g.id, label:g.label})), zones:{}, canaux:{}};
    (z.zones || []).forEach(x => { out.zones[x.id] = {label:x.label, groupe:x.groupe, motifs:(x.motifs || []).concat(x.motifs_implicites || [])}; });
    Object.values(z.canaux || {}).forEach(c => {
      const o = {};
      Object.entries(c.zones || {}).forEach(([zid, list]) => { o[zid] = (list || []).map(p => ({type:p.type, extrait:clean(p.extrait)})); });
      out.canaux[c.code] = o;
    });
    return out;
  }
  async function refresh(){
    const c = cfg(); if(!configured() || loading) return;
    loading = true; error = "";
    try{
      const canaux = {};
      const [, zj] = await Promise.all([
        Promise.all(Object.entries(FILES).map(async ([code, f]) => { canaux[code] = compactCanal(await read(c, "syndromes/canaux/" + f + ".json")); })),
        read(c, "syndromes/canaux/zones.json")
      ]);
      DATA = {at:Date.now(), canaux, zones:compactZones(zj)};
      try{ localStorage.setItem(KEY, JSON.stringify(DATA)); }catch(e){}
    }catch(e){ error = String(e && e.message || e); }
    loading = false;
    document.dispatchEvent(new CustomEvent("mtc-syndromes-ready"));
  }

  // ---- outils
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sans = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // couleurs des cinq mouvements, comme dans Correspondance et Réseaux
  const BASE = {E:"#d9a400", Rt:"#d9a400", VB:"#2f9a3c", F:"#2f9a3c", C:"#e0261b", IG:"#e0261b", EC:"#e0261b", TF:"#e0261b", V:"#1f5fd6", Rn:"#1f5fd6"};
  const YANG = new Set(["GI", "E", "IG", "V", "TF", "VB"]);
  const col = c => { const b = BASE[c] || "var(--text-color)"; return YANG.has(c) ? "color-mix(in srgb, " + b + " 72%, var(--page-bg))" : b; };
  const pill = c => '<span class="pl" style="background:' + col(c) + '" title="' + esc(NAMES[c] || c) + '">' + esc(c) + "</span>";
  // les zones d'un signe : celles dont un motif apparaît dans le texte (motifs écrits sans accents ; « \b » du fichier peut y être arrivé en caractère de contrôle)
  const RX = {};
  function zonesOfSign(text){
    const z = DATA && DATA.zones && DATA.zones.zones; if(!z) return [];
    const t = sans(text), out = [];
    Object.entries(z).forEach(([id, x]) => {
      const ok = (x.motifs || []).some(m => { const k = id + "|" + m; try{ return (RX[k] || (RX[k] = new RegExp(m.replace(/\x08/g, "\\b"), "i"))).test(t); }catch(e){ return false; } });
      if(ok) out.push(id);
    });
    return out;
  }
  // zones que traverse un canal dans un vaisseau (ou dans tous si le vaisseau est omis)
  function traversed(c, n){
    const zc = DATA && DATA.zones && DATA.zones.canaux[c] || {}, out = new Set();
    Object.entries(zc).forEach(([zid, list]) => { if(list.some(p => !n || TYPES[n].includes(p.type))) out.add(zid); });
    return out;
  }
  const zoneLabel = id => { const z = DATA && DATA.zones && DATA.zones.zones[id]; return z ? z.label : id; };
  const groupLabel = id => { const z = DATA && DATA.zones && DATA.zones.zones[id], g = z && DATA.zones.groupes.find(x => x.id === z.groupe); return g ? g.label : ""; };
  // signes psychiques : ils ne s'expliquent pas par une zone traversée mais par une connexion au cerveau, au cœur, ou par l'influence sur le sang, support du shen
  const PSY = /\b(?:phobi|frayeur|peur|effroi|terreur|psychos|manie|maniaque|depress|anxi|angoiss|agitation|agite|irritab|coler|tristesse|melanc|demence|folie|fou|delire|hallucin|insomn|reves?|memoire|pleure|pleurs|rire|chante|chanter|deshabill|dysphori|taciturne|apathie|confusion|obsess|hysteri|nervosit|humeur|emotion|stress|mental|shen|esprit|conscience|evanoui|syncope|lethargie|suicid|panique|sursaut|tracas|soucis|desespoir|culpab|honte)/;
  const estPsy = t => PSY.test(sans(t));
  const normTxt = t => String(t).toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
  const PTRX = /\b(?:P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\s?\d{1,2}\b/;
  // signes utilisables comme indice : ni nom de point, ni texte identique dans un autre canal
  function usableSigns(){
    if(!DATA || !DATA.canaux) return [];
    const seen = {};
    ORD.forEach(c => { const d = DATA.canaux[c]; if(d) NIV.forEach(([n]) => (d[n] || []).forEach(l => { (seen[normTxt(l.t)] = seen[normTxt(l.t)] || new Set()).add(c); })); });
    const out = [];
    ORD.forEach(c => { const d = DATA.canaux[c]; if(!d) return;
      NIV.forEach(([n]) => { const all = d[n] || [], ok = all.filter(l => !PTRX.test(l.t) && seen[normTxt(l.t)].size === 1); if(ok.length) out.push({c, n, all, ok}); }); });
    return out;
  }
  // message quand il n'y a rien à lire
  function vide(){
    return loading ? "Chargement des syndromes depuis l’Assistant…" : error ? "Les syndromes n’ont pas pu être lus : " + esc(error) :
      configured() ? "Les syndromes n’ont pas encore été reçus. Ils arrivent à l’ouverture de la page, quand la synchro GitHub de l’Assistant est réglée." :
      "Ce jeu lit les syndromes de l’Assistant : règle d’abord la synchro GitHub de l’Assistant sur cet appareil.";
  }
  window.mtcSyn = {configured, available:() => configured() || !!DATA, data:() => DATA, loading:() => loading, error:() => error, refresh,
    ORD, NAMES, NIV, NIVNOM, TYPES, esc, rnd, shuffle, col, pill, zonesOfSign, estPsy, traversed, zoneLabel, groupLabel, usableSigns, vide};
  if(document.readyState === "complete") refresh(); else window.addEventListener("load", refresh);
})();
