/* ============================================================
   circuits-assistant-sync.js
   Indications, actions et mots-clés des circuits toujours à jour avec Assistant-MTC :
   base acupuncture/circuits/circuits.json (mots-clés : mots_cles.json), enrichie de tes notes
   (circuits_perso.json, « surcharges »). Chargé juste après circuits-data.js.
   - Sur les appareils qui ont la synchro GitHub (clé du dépôt Assistant-MTC) :
     la dernière version reçue est appliquée tout de suite (mémoire de l'appareil),
     puis relue en arrière-plan à chaque ouverture de Réseaux.
   - En mode admin avec la clé de publication du jeu : si elle diffère de
     circuits-data.js publié, le fichier est réécrit sur le dépôt du jeu,
     pour que tout le monde l'ait.
   ============================================================ */
(function(){
  "use strict";
  const CACHE = "mtc_circuits_assistant_v1";
  const get = k => { try{ return localStorage.getItem(k) || ""; }catch(e){ return ""; } };
  const circuits = () => window.MTC_CIRCUITS || [];
  const key = g => (g || []).slice().sort().join(",");
  // titres de paragraphe écrits en capitales dans tes notes (« GYNÉCO, ANDRO », « URINAIRE, EAU ») : ce ne sont pas des indications
  const titre = s => /[A-ZÀ-Ý]/.test(s) && !/[a-zà-ÿ]/.test(s);
  // caractères chinois retirés, comme dans le reste du jeu : « tài yīn (太阴) » → « tài yīn »
  const clean = s => String(s || "").replace(/\s*\([㐀-鿿]+\)/g, "").replace(/\s+[㐀-鿿]+/g, "")
    .replace(/\s*\(\s*\)/g, "").replace(/\s+([,.)…])/g, "$1").trim().replace(/\.$/, "");
  const snap = () => JSON.stringify(circuits().map(c => [c.indications, c.actions, c.mots || []]));
  const published = snap();

  function merge(base, perso, mots){
    const by = {};
    (base && base.circuits || []).forEach(c => { by[key(c.grille)] = c; });
    const sur = perso && perso.surcharges || {};
    let changed = false;
    circuits().forEach(g => {
      const a = by[key(g.grid)]; if(!a) return;
      const p = sur[a.id] || {};
      const ind = (p.indications || a.indications || []).map(clean).filter(x => x && !titre(x));
      const act = (p.actions || a.actions || []).map(clean).filter(x => x && !titre(x));
      if(ind.length && JSON.stringify(ind) !== JSON.stringify(g.indications)){ g.indications = ind; changed = true; }
      if(act.length && JSON.stringify(act) !== JSON.stringify(g.actions)){ g.actions = act; changed = true; }
      const mc = (p.mots_cles || (mots && mots.circuits && mots.circuits[a.id]) || []).map(clean).filter(Boolean);
      if(mc.length && JSON.stringify(mc) !== JSON.stringify(g.mots || [])){ g.mots = mc; changed = true; }
    });
    return changed;
  }
  // dernière version reçue : appliquée tout de suite, avant que les jeux ne lisent les circuits
  try{ const c = JSON.parse(get(CACHE) || "null"); if(c) merge(c.base, c.perso, c.mots); }catch(e){}

  const b64 = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ""))));
  async function readAssistant(cfg, path){
    const r = await fetch("https://api.github.com/repos/" + encodeURIComponent(cfg.owner) + "/" + encodeURIComponent(cfg.repo) + "/contents/" + path + "?ref=" + encodeURIComponent(cfg.branch),
      {headers:{"Authorization":"Bearer " + cfg.token, "Accept":"application/vnd.github+json"}, cache:"no-store"});
    if(!r.ok) throw new Error(path + " : " + r.status);
    return JSON.parse(b64((await r.json()).content));
  }
  // circuits-data.js régénéré à l'identique (mêmes en-têtes) avec les indications et actions à jour
  function fileText(){
    return "// Circuits thérapeutiques de Dr Tán, repris du cours « Les circuits thérapeutiques » (École Zhōng Lì, version du 27/10/2021).\n" +
      "// grid : [haut gauche, haut droite, bas gauche, bas droite] comme dans le cours (main en haut, pied en bas).\n" +
      "// autre : circuits qui ne reposent que sur l'équilibre dynamique (chapitre 13).\n" +
      "// Indications et actions : base des circuits d’Assistant-MTC (acupuncture/circuits/circuits.json), enrichie des notes personnelles (circuits_perso.json).\n" +
      "// mots : mots-clés de l’usage le plus courant (mots_cles.json, ou ceux modifiés dans l’application).\n" +
      "// Fichier réécrit automatiquement par circuits-assistant-sync.js quand Assistant-MTC change.\n" +
      "window.MTC_CIRCUITS = " + JSON.stringify(circuits(), null, 1) + ";\n";
  }
  async function publish(){
    const token = get("mtc_admin_publish_token"), admin = get("mtc_admin") === "1";
    if(!token || !admin) return;
    const api = "https://api.github.com/repos/felixiksz/jeuxmtc.github.io/contents/circuits/circuits-data.js";
    const headers = {"Authorization":"Bearer " + token, "Accept":"application/vnd.github+json"};
    const got = await fetch(api + "?ref=main", {headers, cache:"no-store"});
    if(!got.ok) return;
    const cur = await got.json(), text = fileText();
    if(b64(cur.content) === text) return;
    await fetch(api, {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, headers),
      body:JSON.stringify({message:"Circuits : indications, actions et mots-clés mis à jour depuis Assistant-MTC", content:btoa(unescape(encodeURIComponent(text))), sha:cur.sha, branch:"main"})});
  }
  async function refresh(){
    const cfg = {token:get("mtc_github_sync_token"), owner:get("mtc_github_sync_owner"), repo:get("mtc_github_sync_repo"), branch:get("mtc_github_sync_branch") || "main"};
    if(!cfg.token || !cfg.owner || !cfg.repo) return;
    try{
      const base = await readAssistant(cfg, "acupuncture/circuits/circuits.json");
      let perso = null; try{ perso = await readAssistant(cfg, "acupuncture/circuits/circuits_perso.json"); }catch(e){}
      let mots = null; try{ mots = await readAssistant(cfg, "acupuncture/circuits/mots_cles.json"); }catch(e){}
      try{ localStorage.setItem(CACHE, JSON.stringify({at:Date.now(), base, perso, mots})); }catch(e){}
      const changed = merge(base, perso, mots);
      if(changed) document.dispatchEvent(new CustomEvent("mtc-circuits-updated"));
      if(snap() !== published) await publish();
    }catch(e){ try{ localStorage.setItem("mtc_circuits_assistant_error", new Date().toISOString() + " — " + (e && e.message || e)); }catch(x){} }
  }
  if(document.readyState === "complete") refresh(); else window.addEventListener("load", refresh);
})();
