/* ============================================================
   anki-import.js
   Lecture d'un paquet Anki (.apkg) : archive zip, base SQLite, médias.
   Trois formats d'export existent :
     - ancien       : collection.anki2   (schéma 11, modèles en JSON dans la table col), médias en JSON
     - intermédiaire: collection.anki21  (même schéma), médias en JSON
     - récent       : collection.anki21b (schéma 18, compressé en Zstandard), médias en protobuf compressé, chaque fichier compressé
   Le contenu est classé en cinq familles de cartes :
     basic  (recto / verso : Front, Back, Mémo, Image, Hanzi, Pinyin, Audio…)
     mc     (choix multiples, réponses en lettres : question, a…j, answers)
     mc10   (choix multiples « 10 options » : Question, QType, Answers en 1 et 0, Q_1…Q_12)
     cloze  (texte à trous {{c1::…}})
     match  (paires « gauche::droite », modèle IKKZ)
   Rien n'est envoyé nulle part : tout est lu dans le navigateur.
   MTCAnkiImport.parse(octets, {libs, locateFile, onMedia, onStep}) → {decks, models, notes, cards, stats}
   ============================================================ */
(function(root){
  "use strict";

  // ---- protobuf : juste ce qu'il faut ----
  function varint(b, i){ let n = 0, s = 0, x; do{ x = b[i++]; n += (x & 0x7f) * Math.pow(2, s); s += 7; }while(x & 0x80); return [n, i]; }
  function pbFields(b){
    const out = {}; let i = 0;
    while(i < b.length){
      let k; [k, i] = varint(b, i); const f = Math.floor(k / 8), w = k & 7; let v;
      if(w === 0) [v, i] = varint(b, i);
      else if(w === 2){ let l; [l, i] = varint(b, i); v = b.subarray(i, i + l); i += l; }
      else if(w === 1){ v = b.subarray(i, i + 8); i += 8; }
      else if(w === 5){ v = b.subarray(i, i + 4); i += 4; }
      else break;
      (out[f] = out[f] || []).push(v);
    }
    return out;
  }
  const utf8 = b => new TextDecoder("utf-8").decode(b);

  // ---- classement des types de notes ----
  function classify(model){
    const n = model.fields.map(f => f.toLowerCase().trim()), has = x => n.includes(x), name = model.name.toLowerCase();
    if(n.some(f => /^qtype/.test(f)) && has("answers")) return "mc10";
    if(has("question") && has("a") && has("b") && has("answers")) return "mc";
    if(has("items") && (has("question") || /match|ikkz|pair|associ/.test(name))) return "match";
    if(model.cloze || /cloze|trous/.test(name)) return "cloze";
    return "basic";
  }
  const deckPath = name => String(name).split(/\x1f|::/).filter(Boolean);

  // ---- lecture ----
  async function parse(input, opt){
    opt = opt || {};
    const libs = Object.assign({initSqlJs:root.initSqlJs, fflate:root.fflate, fzstd:root.fzstd}, opt.libs || {});
    const step = t => { if(opt.onStep) opt.onStep(t); };
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const {fflate, fzstd} = libs;

    step("Ouverture de l’archive");
    const head = fflate.unzipSync(bytes, {filter: f => !/^\d+$/.test(f.name)});
    let dbBytes, latest = false;
    if(head["collection.anki21b"]){ dbBytes = fzstd.decompress(head["collection.anki21b"]); latest = true; }
    else if(head["collection.anki21"]) dbBytes = head["collection.anki21"];
    else if(head["collection.anki2"]) dbBytes = head["collection.anki2"];
    else throw new Error("Ce fichier n’est pas un paquet Anki (.apkg) : aucune collection dedans.");

    step("Lecture des cartes");
    const SQL = await libs.initSqlJs({locateFile: opt.locateFile || (f => "vendor/" + f)});
    const db = new SQL.Database(dbBytes);
    const all = (sql) => { const r = db.exec(sql); return r.length ? r[0].values : []; };
    const tables = new Set(all("select name from sqlite_master where type='table'").map(r => r[0]));

    // modèles (types de notes) et paquets
    const models = {}, decks = {};
    if(tables.has("notetypes")){
      // schéma récent. NOT INDEXED : les index des noms utilisent une collation propre à Anki que SQLite ne connaît pas
      const fields = {}, tmpl = {};
      all("select ntid, ord, name from fields not indexed").forEach(([id, ord, name]) => { (fields[id] = fields[id] || [])[ord] = name; });
      all("select ntid, ord from templates not indexed").forEach(([id]) => { tmpl[id] = (tmpl[id] || 0) + 1; });
      all("select id, name, config from notetypes not indexed").forEach(([id, name, cfg]) => {
        let kind = 0; try{ const f = pbFields(cfg); kind = (f[1] || [0])[0]; }catch(e){}
        models[id] = {id, name, fields:(fields[id] || []).filter(x => x != null), templates:tmpl[id] || 1, cloze:kind === 1};
      });
      all("select id, name from decks not indexed").forEach(([id, name]) => { decks[id] = deckPath(name); });
    }else{
      const col = all("select models, decks from col")[0];
      const M = JSON.parse(col[0]), D = JSON.parse(col[1]);
      Object.keys(M).forEach(id => { const m = M[id]; models[id] = {id:+id, name:m.name, fields:m.flds.slice().sort((a, b) => a.ord - b.ord).map(f => f.name), templates:(m.tmpls || []).length || 1, cloze:m.type === 1}; });
      Object.keys(D).forEach(id => { decks[id] = deckPath(D[id].name); });
    }
    Object.values(models).forEach(m => { m.type = classify(m); });

    const notes = {};
    all("select id, mid, guid, flds, tags from notes").forEach(([id, mid, guid, flds, tags]) => {
      const m = models[mid]; if(!m) return;
      const v = String(flds).split("\x1f"), f = {};
      m.fields.forEach((name, i) => { if(v[i] != null && String(v[i]).trim() !== "") f[name] = v[i]; });
      notes[id] = {id:guid, mid:+mid, type:m.type, model:m.name, fields:f, tags:String(tags || "").trim()};
    });
    const cards = [], used = new Set();
    const clozeSeen = new Set();
    all("select id, nid, did, odid, ord from cards order by ord").forEach(([id, nid, did, odid, ord]) => {
      const n = notes[nid]; if(!n) return;
      // texte à trous : Anki fait une carte par numéro de trou ; ici tous les trous sont posés sur une seule carte, chacun se dévoile à part
      if(n.type === "cloze"){ if(clozeSeen.has(nid)) return; clozeSeen.add(nid); }
      const d = odid ? odid : did, key = n.id + ":" + ord;
      if(used.has(key)) return; used.add(key);
      cards.push({id:key, nid:n.id, deck:String(d), ord});
    });
    db.close();

    // seuls les paquets qui contiennent des cartes
    const usedDecks = new Set(cards.map(c => c.deck)), deckList = [];
    Object.keys(decks).forEach(id => { if(usedDecks.has(id)) deckList.push({id, path:decks[id]}); });

    // ---- médias : seulement ceux que les notes utilisent ----
    const wanted = new Set();
    const grab = s => { String(s).replace(/(?:src|data-src)\s*=\s*["']([^"']+)["']/gi, (m, a) => { wanted.add(a); wanted.add(safeDecode(a)); return m; }).replace(/\[sound:([^\]]+)\]/g, (m, a) => { wanted.add(a); return m; }); };
    Object.values(notes).forEach(n => Object.values(n.fields).forEach(grab));
    let mediaCount = 0;
    if(opt.onMedia && head["media"]){
      step("Images et sons");
      let list = [];   // index du fichier dans l'archive → nom
      try{
        const txt = utf8(head["media"]);
        if(txt.trim()[0] === "{"){ const o = JSON.parse(txt); Object.keys(o).forEach(k => { list[+k] = o[k]; }); }
        else throw 0;
      }catch(e){
        // protobuf compressé : MediaEntries { repeated MediaEntry entries = 1 }, MediaEntry { string name = 1; … }
        const raw = fzstd.decompress(head["media"]);
        list = (pbFields(raw)[1] || []).map(m => { const f = pbFields(m); return f[1] ? utf8(f[1][0]) : ""; });
      }
      const todo = [];
      list.forEach((name, i) => { if(name && (wanted.has(name) || wanted.has(safeDecode(name)))) todo.push([String(i), name]); });
      for(let a = 0; a < todo.length; a += 120){
        const part = todo.slice(a, a + 120), set = new Set(part.map(p => p[0]));
        const files = fflate.unzipSync(bytes, {filter: f => set.has(f.name)});
        for(const [idx, name] of part){
          let data = files[idx]; if(!data) continue;
          if(latest){ try{ data = fzstd.decompress(data); }catch(e){} }
          await opt.onMedia(name, data); mediaCount++;
        }
        step("Images et sons : " + Math.min(a + 120, todo.length) + " sur " + todo.length);
      }
    }

    const stats = {notes:Object.keys(notes).length, cards:cards.length, media:mediaCount, byType:{}};
    const noteById = {}; Object.values(notes).forEach(n => { noteById[n.id] = n; });
    cards.forEach(c => { const t = noteById[c.nid].type; stats.byType[t] = (stats.byType[t] || 0) + 1; });
    return {decks:deckList, models, notes:Object.values(notes), cards, stats};
  }
  function safeDecode(s){ try{ return decodeURIComponent(s); }catch(e){ return s; } }

  const MIME = {png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml", bmp:"image/bmp", avif:"image/avif",
    mp3:"audio/mpeg", ogg:"audio/ogg", oga:"audio/ogg", opus:"audio/ogg", wav:"audio/wav", m4a:"audio/mp4", aac:"audio/aac", flac:"audio/flac", webm:"audio/webm"};
  const mimeOf = name => MIME[String(name).split(".").pop().toLowerCase()] || "application/octet-stream";

  root.MTCAnkiImport = {parse, mimeOf, classify, safeDecode};
  if(typeof module !== "undefined" && module.exports) module.exports = root.MTCAnkiImport;
})(typeof window !== "undefined" ? window : globalThis);
