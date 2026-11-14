/* ============================================================
   anki-sync.js
   Les paquets Anki importés (et leur avancement) suivent tes appareils, par le dépôt GitHub PRIVÉ de la synchro des notes
   (mêmes réglages : clé, propriétaire, dépôt, branche — 59-github-sync.js, mtc_github_sync_*).
   Dans le dépôt, dossier jeu/anki/ :
     index.json     la liste des paquets : nom, date d'import, nombre de morceaux, ou « supprimé »
     packs/<id>/N   le fichier .apkg d'origine, découpé en morceaux de 12 Mo (images et sons compris)
     progress.json  l'avancement de chaque carte : le plus récent l'emporte
   Un autre appareil télécharge le fichier et le relit avec le même importeur.
   Garde-fou : rien n'est envoyé si GitHub ne confirme pas que le dépôt est privé.
   ============================================================ */
(function(root){
  "use strict";
  const S = root.MTCAnkiStore;
  const DIR = "jeu/anki/", INDEX = DIR + "index.json", PROG = DIR + "progress.json";
  const PART = (+localStorage.getItem("mtc_anki_part_test") || 0) || 12 * 1024 * 1024, MAX = 150 * 1024 * 1024;   // le réglage « test » ne sert qu'à vérifier le découpage
  const DEL_KEY = "mtc_anki_deleted_v1", LAST_KEY = "mtc_anki_sync_last_v1";
  const g = k => { try{ return localStorage.getItem(k) || ""; }catch(e){ return ""; } };
  const readJson = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }catch(e){ return d; } };
  const enc = encodeURIComponent;
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);

  function cfg(){
    const c = {token:g("mtc_github_sync_token"), owner:g("mtc_github_sync_owner"), repo:g("mtc_github_sync_repo"), branch:g("mtc_github_sync_branch") || "main"};
    return c.token && c.owner && c.repo ? c : null;
  }
  const repoUrl = c => "https://api.github.com/repos/" + enc(c.owner) + "/" + enc(c.repo);
  const fileUrl = (c, p) => repoUrl(c) + "/contents/" + p.split("/").map(enc).join("/");
  const head = (c, accept) => ({"Authorization":"Bearer " + c.token, "Accept":accept || "application/vnd.github+json"});
  const RAW = "application/vnd.github.raw+json";
  const toB64 = s => btoa(unescape(enc(s)));
  const fromB64 = s => decodeURIComponent(escape(atob(String(s).replace(/\s/g, ""))));
  const blobB64 = blob => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1] || ""); r.onerror = () => ko(r.error); r.readAsDataURL(blob); });
  const fail = (what, res) => { const e = new Error(what + " (GitHub " + res.status + ")"); e.status = res.status; return e; };

  let privateOk = "";   // « propriétaire/dépôt » vérifié privé pendant cette page
  async function checkPrivate(c){
    const id = c.owner + "/" + c.repo;
    if(privateOk === id) return;
    const res = await fetch(repoUrl(c), {headers:head(c), cache:"no-store"});
    if(res.status === 401) throw new Error("la clé est refusée : expirée, révoquée ou mal copiée");
    if(res.status === 404 || res.status === 403) throw new Error("la clé n’a pas accès au dépôt « " + id + " » (il faut Contents : lecture et écriture)");
    if(!res.ok) throw fail("dépôt illisible", res);
    const info = await res.json();
    if(info.private !== true) throw new Error("le dépôt « " + id + " » n’est pas privé : les paquets n’y sont pas envoyés");
    privateOk = id;
  }

  async function getJson(c, path){
    const res = await fetch(fileUrl(c, path) + "?ref=" + enc(c.branch), {headers:head(c), cache:"no-store"});
    if(res.status === 404) return {sha:null, data:null};
    if(!res.ok) throw fail("lecture de " + path, res);
    const p = await res.json();
    if(p.content) return {sha:p.sha, data:JSON.parse(fromB64(p.content))};
    const raw = await fetch(fileUrl(c, path) + "?ref=" + enc(c.branch), {headers:head(c, RAW), cache:"no-store"});   // plus de 1 Mo : contenu à part
    if(!raw.ok) throw fail("lecture de " + path, raw);
    return {sha:p.sha, data:JSON.parse(await raw.text())};
  }
  async function shaOf(c, path){
    const res = await fetch(fileUrl(c, path) + "?ref=" + enc(c.branch), {headers:head(c), cache:"no-store"});
    if(res.status === 404) return null;
    if(!res.ok) throw fail("lecture de " + path, res);
    return (await res.json()).sha || null;
  }
  async function put(c, path, b64, sha, message){
    const body = {message:message, content:b64, branch:c.branch}; if(sha) body.sha = sha;
    const res = await fetch(fileUrl(c, path), {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, head(c)), body:JSON.stringify(body)});
    if(!res.ok) throw fail("envoi de " + path, res);
  }
  async function remove(c, path){
    try{
      const sha = await shaOf(c, path); if(!sha) return;
      await fetch(fileUrl(c, path), {method:"DELETE", headers:Object.assign({"Content-Type":"application/json"}, head(c)), body:JSON.stringify({message:"Jeu MTC : cartes", sha, branch:c.branch})});
    }catch(e){}
  }
  async function putJson(c, path, data, sha, message){ await put(c, path, toB64(JSON.stringify(data)), sha, message); }

  // un fichier .apkg → morceaux sur GitHub, et retour
  async function upload(c, id, blob, say){
    const n = Math.max(1, Math.ceil(blob.size / PART));
    for(let i = 0; i < n; i++){
      say("envoi " + (i + 1) + "/" + n);
      const path = DIR + "packs/" + id + "/" + i, b64 = await blobB64(blob.slice(i * PART, (i + 1) * PART));
      await put(c, path, b64, await shaOf(c, path), "Jeu MTC : cartes");
    }
    return n;
  }
  async function download(c, id, n, say){
    const chunks = []; let total = 0;
    for(let i = 0; i < n; i++){
      say("téléchargement " + (i + 1) + "/" + n);
      const res = await fetch(fileUrl(c, DIR + "packs/" + id + "/" + i) + "?ref=" + enc(c.branch), {headers:head(c, RAW), cache:"no-store"});
      if(!res.ok) throw fail("téléchargement d’un morceau", res);
      const b = new Uint8Array(await res.arrayBuffer()); chunks.push(b); total += b.length;
    }
    const all = new Uint8Array(total); let o = 0; chunks.forEach(b => { all.set(b, o); o += b.length; });
    return all;
  }

  const readDel = () => { const d = readJson(DEL_KEY, {}); return isObj(d) ? d : {}; };
  const writeDel = d => { try{ localStorage.setItem(DEL_KEY, JSON.stringify(d)); }catch(e){} };
  function markDeleted(id){ const d = readDel(); d[id] = Date.now(); writeDel(d); }

  const arr = r => [r.stage, r.reps, r.lapses, r.seen, r.due];
  const rec = (id, a) => ({id, stage:a[0], reps:a[1], lapses:a[2], seen:a[3], due:a[4]});

  // hooks : say(texte), ingest(bytes, {id, name, size, at}) → Promise, dropPack(id) → Promise
  async function syncOnce(h){
    const c = cfg(); if(!c) return null;
    const say = t => { try{ h.say && h.say(t); }catch(e){} };
    say("vérification du dépôt");
    await checkPrivate(c);
    const out = {up:[], down:[], removed:[], noFile:[], big:[], progress:0};

    say("lecture de la liste");
    let ix = await getJson(c, INDEX);
    let index = ix.data && isObj(ix.data.packs) ? ix.data : {v:1, packs:{}};
    const mine = {};   // ce que cet appareil change dans la liste (rejoué si un autre appareil écrit en même temps)
    const local = await S.packs(), by = {}; local.forEach(p => { by[p.id] = p; });
    const dels = readDel(); let delsChanged = false;

    // 1. paquets supprimés ici
    for(const id of Object.keys(dels)){
      const r = index.packs[id], ts = dels[id];
      if((by[id] && by[id].at > ts) || (r && !r.deleted && r.at > ts)){ delete dels[id]; delsChanged = true; continue; }   // réimporté depuis
      if(!r || !r.deleted){ mine[id] = {name:r ? r.name : "", at:r ? r.at : 0, deleted:true, deletedAt:ts, parts:r ? r.parts : 0}; }
    }
    // 2. paquets venus d'ailleurs
    for(const [id, r] of Object.entries(index.packs)){
      const l = by[id];
      if(r.deleted){ if(l && l.at <= r.deletedAt){ await h.dropPack(id); delete by[id]; out.removed.push(l.name); } continue; }
      if(mine[id]) continue;
      if(!l || r.at > l.at){
        say("« " + r.name + " » : téléchargement");
        const bytes = await download(c, id, r.parts, t => say("« " + r.name + " » : " + t));
        await h.ingest(bytes, {id, name:r.name, size:r.size, at:r.at});
        out.down.push(r.name);
      }
    }
    // 3. paquets importés ici
    for(const p of Object.values(by)){
      const r = index.packs[p.id], mr = mine[p.id];
      if(mr) continue;
      if(r && ((!r.deleted && r.at >= p.at) || (r.deleted && r.deletedAt >= p.at))) continue;
      const file = await S.fileOf(p.id);
      if(!file){ out.noFile.push(p.name); continue; }
      if(file.size > MAX){ out.big.push(p.name); continue; }
      const n = await upload(c, p.id, file, t => say("« " + p.name + " » : " + t));
      mine[p.id] = {name:p.name, size:file.size, at:p.at, parts:n};
      out.up.push(p.name);
    }
    // 4. la liste
    if(Object.keys(mine).length){
      for(let attempt = 0; ; attempt++){
        Object.assign(index.packs, mine);
        try{ await putJson(c, INDEX, index, ix.sha, "Jeu MTC : cartes"); break; }
        catch(e){
          if(attempt >= 3 || (e.status !== 409 && e.status !== 422)) throw e;
          ix = await getJson(c, INDEX); index = ix.data && isObj(ix.data.packs) ? ix.data : {v:1, packs:{}};
        }
      }
      for(const [id, m] of Object.entries(mine)){   // fichiers des paquets supprimés
        if(m.deleted) for(let i = 0; i < (m.parts || 0); i++) await remove(c, DIR + "packs/" + id + "/" + i);
      }
    }
    if(delsChanged) writeDel(dels);

    // 5. avancement : pour chaque carte, l'interrogation la plus récente l'emporte
    say("avancement");
    for(let attempt = 0; ; attempt++){
      const px = await getJson(c, PROG), rem = px.data && isObj(px.data.c) ? px.data : {v:1, c:{}};
      const mineP = await S.getAll("progress"), localById = {}; mineP.forEach(r => { if(r && r.seen) localById[r.id] = r; });
      let remoteChanged = false; const toLocal = [];
      Object.values(localById).forEach(r => { const a = rem.c[r.id]; if(!a || a[3] < r.seen){ rem.c[r.id] = arr(r); remoteChanged = true; } });
      Object.entries(rem.c).forEach(([id, a]) => { const l = localById[id]; if(!l || l.seen < a[3]) toLocal.push(rec(id, a)); });
      if(toLocal.length){ await S.putMany("progress", toLocal); out.progress = toLocal.length; }
      if(!remoteChanged) break;
      try{ await putJson(c, PROG, rem, px.sha, "Jeu MTC : avancement des cartes"); break; }
      catch(e){ if(attempt >= 3 || (e.status !== 409 && e.status !== 422)) throw e; }
    }
    return out;
  }

  // ---- file d'attente : une synchro à la fois ----
  let running = false, again = false, timer = 0, lastHooks = null;
  function summary(o){
    if(!o) return "";
    const bits = [];
    if(o.up.length) bits.push(o.up.length + " paquet" + (o.up.length > 1 ? "s" : "") + " envoyé" + (o.up.length > 1 ? "s" : ""));
    if(o.down.length) bits.push(o.down.length + " reçu" + (o.down.length > 1 ? "s" : ""));
    if(o.removed.length) bits.push(o.removed.length + " supprimé" + (o.removed.length > 1 ? "s" : "") + " ailleurs");
    if(o.progress) bits.push("avancement mis à jour");
    return bits.join(", ");
  }
  async function run(h){
    h = h || lastHooks || {}; lastHooks = h;
    if(!cfg()) return {off:true};
    if(running){ again = true; return {busy:true}; }
    running = true; let res = null;
    try{
      res = await syncOnce(h);
      const t = new Date().toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"}), s = summary(res);
      let note = "Synchronisé à " + t + (s ? " : " + s : "");
      if(res.noFile.length) note += " · à réimporter une fois pour être envoyé : " + res.noFile.join(", ");
      if(res.big.length) note += " · trop gros pour être envoyé (plus de 150 Mo) : " + res.big.join(", ");
      try{ localStorage.setItem(LAST_KEY, JSON.stringify({ok:true, text:note, at:Date.now()})); }catch(e){}
      if(h.done) h.done(res, note);
    }catch(error){
      const note = "Pas synchronisé : " + (error && error.message || error);
      try{ localStorage.setItem(LAST_KEY, JSON.stringify({ok:false, text:note, at:Date.now()})); }catch(e){}
      if(h.done) h.done(null, note, error);
    }finally{
      running = false;
      if(again){ again = false; schedule(1500); }
    }
    return res;
  }
  function schedule(delay){ clearTimeout(timer); timer = setTimeout(() => { timer = 0; run(); }, delay == null ? 4000 : delay); }
  const last = () => readJson(LAST_KEY, null);

  root.MTCAnkiSync = {configured:() => !!cfg(), run, schedule, markDeleted, last, busy:() => running, hooks:h => { lastHooks = h; }};
})(window);
