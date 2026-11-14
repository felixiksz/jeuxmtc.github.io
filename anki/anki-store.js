/* ============================================================
   anki-store.js
   Les paquets importés restent dans le navigateur de l'appareil (IndexedDB « mtc_anki_v1 »). Rien n'est publié ;
   seule la synchro (anki-sync.js) les envoie, vers le dépôt GitHub privé de la synchro des notes. Magasins :
     files     le fichier .apkg d'origine de chaque paquet (pour la synchro)
     packs     un paquet importé (nom, date, nombre de cartes)
     decks     les paquets Anki et sous-paquets d'un fichier (chemin « A > B > C »)
     notes     les notes (champs, type de carte)
     cards     une carte par note (et par trou pour un texte à trous)
     media     les images et sons utilisés par les notes
     progress  l'avancement de chaque carte : étape de répétition espacée et prochaine échéance
   Les notes sont reconnues par leur identifiant Anki (guid) : importer de nouveau un paquet mis à jour garde l'avancement.
   ============================================================ */
(function(root){
  "use strict";
  const DB = "mtc_anki_v1", VER = 2;
  let dbp = null;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise((ok, ko) => {
      const rq = indexedDB.open(DB, VER);
      rq.onupgradeneeded = () => {
        const d = rq.result, has = n => d.objectStoreNames.contains(n);
        if(!has("packs")) d.createObjectStore("packs", {keyPath:"id"});
        if(!has("decks")) d.createObjectStore("decks", {keyPath:"id"}).createIndex("pack", "packId");
        if(!has("notes")) d.createObjectStore("notes", {keyPath:"id"}).createIndex("pack", "packId");
        if(!has("cards")) d.createObjectStore("cards", {keyPath:"id"}).createIndex("pack", "packId");
        if(!has("media")) d.createObjectStore("media", {keyPath:"id"}).createIndex("pack", "packId");
        if(!has("progress")) d.createObjectStore("progress", {keyPath:"id"});
        if(!has("files")) d.createObjectStore("files", {keyPath:"id"});   // le fichier .apkg d'origine, pour l'envoyer vers les autres appareils
      };
      rq.onsuccess = () => ok(rq.result);
      rq.onerror = () => ko(rq.error);
    });
    return dbp;
  }
  const done = tx => new Promise((ok, ko) => { tx.oncomplete = () => ok(); tx.onerror = () => ko(tx.error); tx.onabort = () => ko(tx.error); });
  const reqp = r => new Promise((ok, ko) => { r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });

  async function putMany(store, rows){
    const d = await open();
    for(let i = 0; i < rows.length; i += 400){
      const tx = d.transaction(store, "readwrite"), s = tx.objectStore(store);
      rows.slice(i, i + 400).forEach(r => s.put(r));
      await done(tx);
    }
  }
  async function getAll(store, index, key){
    const d = await open(), s = d.transaction(store).objectStore(store);
    return reqp(index ? s.index(index).getAll(key) : s.getAll());
  }
  async function get(store, key){ const d = await open(); return reqp(d.transaction(store).objectStore(store).get(key)); }
  async function getMany(store, keys){
    const d = await open(), s = d.transaction(store).objectStore(store);
    return Promise.all(keys.map(k => reqp(s.get(k))));
  }
  async function deleteMany(store, keys){
    const d = await open();
    for(let i = 0; i < keys.length; i += 400){
      const tx = d.transaction(store, "readwrite"), s = tx.objectStore(store);
      keys.slice(i, i + 400).forEach(k => s.delete(k));
      await done(tx);
    }
  }
  async function removePack(packId){
    const d = await open();
    for(const store of ["decks", "notes", "cards", "media"]){
      const tx = d.transaction(store, "readwrite"), s = tx.objectStore(store), rq = s.index("pack").openKeyCursor(IDBKeyRange.only(packId));
      await new Promise((ok, ko) => { rq.onsuccess = () => { const c = rq.result; if(c){ s.delete(c.primaryKey); c.continue(); } else ok(); }; rq.onerror = () => ko(rq.error); });
      await done(tx);
    }
    const tx = d.transaction(["packs", "files"], "readwrite"); tx.objectStore("packs").delete(packId); tx.objectStore("files").delete(packId); await done(tx);
  }

  // ---- importer un paquet lu par MTCAnkiImport ----
  // info.at : date de l'import (reprise telle quelle pour un paquet reçu d'un autre appareil) ; info.file : le fichier .apkg à garder
  async function savePack(parsed, info, media){
    const packId = info.id, d = await open();
    if(info.file) await putMany("files", [{id:packId, blob:info.file}]);
    await putMany("packs", [{id:packId, name:info.name, size:info.size, at:info.at || Date.now(), notes:parsed.stats.notes, cards:parsed.stats.cards, byType:parsed.stats.byType, media:parsed.stats.media}]);
    await putMany("decks", parsed.decks.map(k => ({id:packId + ":" + k.id, packId, path:k.path})));
    await putMany("notes", parsed.notes.map(n => ({id:n.id, packId, type:n.type, model:n.model, fields:n.fields, tags:n.tags})));
    await putMany("cards", parsed.cards.map(c => ({id:c.id, packId, nid:c.nid, deck:packId + ":" + c.deck, ord:c.ord})));
    if(media) await putMany("media", media);
    return d;
  }
  async function packs(){ return (await getAll("packs")).sort((a, b) => b.at - a.at); }
  async function fileOf(packId){ const r = await get("files", packId); return r ? r.blob : null; }

  // ---- avancement : répétition espacée (étapes de 0 à 6) ----
  const DAYS = [1, 3, 7, 14, 30, 60, 120];
  async function progressOf(ids){ const r = await getMany("progress", ids); const m = {}; r.forEach(p => { if(p) m[p.id] = p; }); return m; }
  async function saveProgress(id, ok){
    const old = await get("progress", id) || {id, stage:-1, reps:0, lapses:0};
    const stage = ok ? Math.min(DAYS.length - 1, old.stage + 1) : 0;
    const rec = {id, stage, reps:old.reps + 1, lapses:old.lapses + (ok ? 0 : 1), seen:Date.now(), due:ok ? Date.now() + DAYS[stage] * 864e5 : Date.now()};
    await putMany("progress", [rec]);
    return rec;
  }

  // ---- médias d'une carte : adresses locales (blob:) créées au besoin ----
  const urls = new Map();
  async function mediaUrl(packId, name){
    const k = packId + "|" + name;
    if(urls.has(k)) return urls.get(k);
    let rec = await get("media", k);
    if(!rec){ const dec = root.MTCAnkiImport ? root.MTCAnkiImport.safeDecode(name) : name; if(dec !== name) rec = await get("media", packId + "|" + dec); }
    const u = rec ? URL.createObjectURL(rec.blob) : null;
    urls.set(k, u); return u;
  }

  root.MTCAnkiStore = {open, putMany, getAll, get, getMany, deleteMany, removePack, savePack, packs, fileOf, progressOf, saveProgress, mediaUrl, DAYS};
})(window);
