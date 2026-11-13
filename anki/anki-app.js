/* ============================================================
   anki-app.js
   Écrans du module Cartes Anki : accueil (importer, paquets, choix), séance de révision, bilan.
   Accès : admins seulement tant que « anki » n'est pas ouvert dans beta-config.js (beta-gate.js).
   Les boutons d'action sont dans une barre fixée en bas de l'écran, sous le pouce.
   ============================================================ */
(function(){
  "use strict";
  if(!window.mtcBetaGate || !window.mtcBetaGate({module:"anki", title:"Cartes Anki"})){
    if(!window.mtcBetaGate) document.body.innerHTML = '<p style="padding:24px;font-family:system-ui,sans-serif">Page réservée.</p>';
    return;
  }
  const S = window.MTCAnkiStore, I = window.MTCAnkiImport, C = window.MTCAnkiCards;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const app = $("app"), bar = $("bar"), barIn = bar.querySelector(".in"), topr = $("topr");
  const TYPE_NAME = {basic:"recto / verso", mc:"choix (lettres)", mc10:"choix (10 options)", cloze:"texte à trous", match:"paires"};
  const nb = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const pref = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
  const setPref = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };

  // ---------- barre du bas ----------
  function setBar(list){
    barIn.innerHTML = "";
    (list || []).forEach(b => { const x = document.createElement("button"); x.type = "button"; x.className = "sc " + (b.cls || ""); x.textContent = b.t; x.disabled = !!b.disabled; x.addEventListener("click", () => { if(!x.disabled) b.on(); }); barIn.appendChild(x); });
    bar.hidden = !(list && list.length);
  }

  // ---------- état ----------
  let PACKS = [], DECKS = [], CARDS = [], PROG = {}, SELECTED = new Set(), OPEN = new Set(), LEN = +pref("mtc_anki_len", 20) || 20, MSG = "";
  async function load(){
    PACKS = await S.packs(); DECKS = await S.getAll("decks"); CARDS = await S.getAll("cards");
    PROG = {}; (await S.getAll("progress")).forEach(p => { PROG[p.id] = p; });
  }

  // arbre des paquets : chaque paquet Anki « A::B::C » devient une branche
  function tree(){
    const root = {name:"", path:[], kids:new Map(), ids:[], total:0};
    const byId = {}; DECKS.forEach(d => { byId[d.id] = d; });
    DECKS.forEach(d => { let n = root; const pk = PACKS.find(p => p.id === d.packId); const path = (PACKS.length > 1 && pk ? [pk.name] : []).concat(d.path.length ? d.path : ["Par défaut"]);
      path.forEach((seg, i) => { if(!n.kids.has(seg)) n.kids.set(seg, {name:seg, path:path.slice(0, i + 1), kids:new Map(), ids:[], total:0, due:0, fresh:0}); n = n.kids.get(seg); }); n.ids.push(d.id); });
    const now = Date.now(), cnt = {}; CARDS.forEach(c => { (cnt[c.deck] = cnt[c.deck] || []).push(c); });
    (function sum(n){ n.cards = []; n.ids.forEach(id => { n.cards.push(...(cnt[id] || [])); }); n.kids.forEach(k => { sum(k); n.cards.push(...k.cards); });
      n.total = n.cards.length; n.due = n.cards.filter(c => PROG[c.id] && PROG[c.id].due <= now).length; n.fresh = n.cards.filter(c => !PROG[c.id]).length; })(root);
    return root;
  }
  const key = n => n.path.join("␟");
  function treeHtml(n, depth){
    return [...n.kids.values()].filter(k => k.total > 0).sort((a, b) => a.name.localeCompare(b.name, "fr", {numeric:true})).map(k => {
      const open = OPEN.has(key(k)), sel = SELECTED.has(key(k));
      return '<div class="dk' + (sel ? " sel" : "") + '" style="padding-left:' + (depth * 16) + 'px"><button type="button" class="chev' + (k.kids.size ? "" : " none") + '" data-open="' + esc(key(k)) + '" aria-label="Déplier">' + (open ? "▾" : "▸") + "</button>" +
        '<button type="button" class="nm" data-sel="' + esc(key(k)) + '"><span>' + esc(k.name) + "</span><i>" + nb(k.total) + " carte" + (k.total > 1 ? "s" : "") + (k.due ? " · " + nb(k.due) + " à revoir" : "") + (k.fresh ? " · " + nb(k.fresh) + " nouvelle" + (k.fresh > 1 ? "s" : "") : "") + "</i></button></div>" + (open ? treeHtml(k, depth + 1) : "");
    }).join("");
  }
  function find(n, k){ for(const c of n.kids.values()){ if(key(c) === k) return c; const r = find(c, k); if(r) return r; } return null; }
  function selectedCards(){
    const t = tree(), seen = new Set(), out = [];
    SELECTED.forEach(k => { const n = find(t, k); if(n) n.cards.forEach(c => { if(!seen.has(c.id)){ seen.add(c.id); out.push(c); } }); });
    return out;
  }

  // ---------- accueil ----------
  async function home(){
    await load();
    topr.textContent = ""; setBar(null);
    const sel = selectedCards(), now = Date.now();
    const due = sel.filter(c => PROG[c.id] && PROG[c.id].due <= now).length, fresh = sel.filter(c => !PROG[c.id]).length, take = Math.min(LEN, due + fresh);
    const t = tree();
    app.innerHTML = '<h1>Cartes Anki</h1><p class="lead">Tes paquets Anki, révisés dans le jeu. Les cartes restent sur cet appareil.</p>' +
      '<label class="sc acc btn imp" for="file">Importer un paquet (.apkg) →</label><div class="msg" id="msg">' + MSG + "</div>" +
      (PACKS.length ? "" : '<p class="help"><b>Comment faire :</b> dans Anki, ouvre ton paquet, puis <b>Fichier ▸ Exporter</b>, format <b>Paquet Anki (*.apkg)</b>, en cochant <b>Inclure les médias</b>. Envoie ensuite le fichier sur ce téléphone et choisis-le ici. Les types de cartes reconnus : recto / verso, choix multiples (lettres, ou 1 et 0 sur 10 options), texte à trous, paires.</p>') +
      (PACKS.length ? "<h2>Mes paquets</h2>" + PACKS.map(p => '<div class="pack"><div><span>' + esc(p.name) + "</span><i>" + nb(p.cards) + " cartes · " + Object.keys(p.byType || {}).map(k => nb(p.byType[k]) + " " + (TYPE_NAME[k] || k)).join(", ") + '</i></div><button type="button" class="sc t" data-del="' + esc(p.id) + '">Supprimer</button></div>').join("") : "") +
      (PACKS.length ? '<h2>Que veux-tu réviser ?</h2><p class="lead" style="margin:0">Touche un paquet pour le choisir (ses sous-paquets sont compris), ▸ pour le déplier.</p><div class="tree">' + treeHtml(t, 0) + "</div>" +
        '<div class="len"><span class="sc t">Cartes</span>' + [10, 20, 50].map(n => '<button type="button" class="sc' + (LEN === n ? " on" : "") + '" data-len="' + n + '">' + n + "</button>").join("") + "</div>" : "");
    MSG = "";   // le message d'importation ne s'affiche qu'une fois
    setBar(PACKS.length ? [{t:sel.length ? (take ? "Réviser · " + take + " carte" + (take > 1 ? "s" : "") + " →" : "Rien à réviser pour l’instant") : "Choisis un paquet", cls:"main", disabled:!take, on:start}] : null);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-open], [data-sel], [data-del], [data-len]"); if(!b || !app.contains(b)) return;
    if(b.dataset.open != null){ const k = b.dataset.open; OPEN.has(k) ? OPEN.delete(k) : OPEN.add(k); return home(); }
    if(b.dataset.sel != null){ const k = b.dataset.sel; SELECTED.has(k) ? SELECTED.delete(k) : SELECTED.add(k); return home(); }
    if(b.dataset.len){ LEN = +b.dataset.len; setPref("mtc_anki_len", LEN); return home(); }
    if(b.dataset.del){ const p = PACKS.find(x => x.id === b.dataset.del); if(p && confirm("Supprimer « " + p.name + " » de cet appareil ? Ton paquet Anki d’origine n’est pas touché.")) S.removePack(p.id).then(() => { SELECTED.clear(); MSG = ""; home(); }); }
  });

  // ---------- importation ----------
  const hash = str => { let h = 0x811c9dc5; for(const ch of str){ h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); };
  async function importFile(f){
    const say = (t, cls) => { const m = $("msg"); if(m) m.innerHTML = '<span class="' + (cls || "t") + '">' + esc(t) + "</span>"; };
    try{
      say("Lecture de « " + f.name + " »…");
      const buf = new Uint8Array(await f.arrayBuffer()), media = [];
      const id = "p" + hash(f.name + "|" + f.size);
      const parsed = await I.parse(buf, {onStep:t => say(f.name + " : " + t + "…"), locateFile:n => "vendor/" + n,
        onMedia:(name, data) => { media.push({id:id + "|" + name, packId:id, name, blob:new Blob([data], {type:I.mimeOf(name)})}); }});
      if(!parsed.cards.length) throw new Error("ce paquet ne contient aucune carte.");
      say("Enregistrement sur l’appareil…");
      await S.removePack(id);   // un paquet déjà importé est remplacé (l'avancement des cartes est gardé)
      await S.savePack(parsed, {id, name:f.name.replace(/\.apkg$/i, ""), size:f.size}, media);
      try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
      return {ok:true, name:f.name, stats:parsed.stats};
    }catch(err){ console.error(err); return {ok:false, name:f.name, error:String(err && err.message || err)}; }
  }
  // Les cartes sont reconnues par leur identifiant Anki : si un nouveau paquet reprend les cartes d'un paquet déjà importé
  // (même export sous un autre nom, version mise à jour), l'ancien paquet est mis à jour, et supprimé s'il ne lui reste rien.
  async function reconcile(){
    const packs = await S.packs(), cards = await S.getAll("cards"), notes = await S.getAll("notes"), type = {}; notes.forEach(n => { type[n.id] = n.type; });
    const gone = [];
    for(const p of packs){
      const mine = cards.filter(c => c.packId === p.id);
      if(!mine.length){ await S.removePack(p.id); gone.push(p.name); continue; }
      if(mine.length !== p.cards){ const by = {}; mine.forEach(c => { by[type[c.nid]] = (by[type[c.nid]] || 0) + 1; }); await S.putMany("packs", [Object.assign({}, p, {cards:mine.length, byType:by})]); }
    }
    return gone;
  }
  $("file").addEventListener("change", async e => {
    const files = [...e.target.files]; e.target.value = ""; if(!files.length) return;
    let msg = "";
    for(const f of files){
      const r = await importFile(f);
      msg += r.ok ? '<span class="okc">Ajouté : ' + esc(r.name) + "</span> · " + nb(r.stats.cards) + " cartes, " + nb(r.stats.media) + " images et sons<br>" : '<span class="err">« ' + esc(r.name) + " » n’a pas pu être lu : " + esc(r.error) + "</span><br>";
    }
    const gone = await reconcile();
    if(gone.length) msg += '<span class="t">Remplacé par le nouveau paquet (mêmes cartes) : ' + esc(gone.join(", ")) + "</span><br>";
    MSG = msg; await home();
  });

  // ---------- séance ----------
  let SES = null, AUDIO = null;
  async function start(){
    const now = Date.now(), cards = selectedCards();
    const due = cards.filter(c => PROG[c.id] && PROG[c.id].due <= now).sort((a, b) => PROG[a.id].due - PROG[b.id].due);
    const fresh = cards.filter(c => !PROG[c.id]).sort(() => Math.random() - .5);
    const pick = due.concat(fresh).slice(0, LEN);
    if(!pick.length) return;
    const notes = await S.getMany("notes", pick.map(c => c.nid));
    SES = {list:pick.map((c, i) => ({card:c, note:notes[i]})).filter(x => x.note), i:0, res:[], done:false};
    show();
  }
  function stop(){ if(AUDIO){ try{ AUDIO.pause(); }catch(e){} } SES = null; home(); }
  async function show(){
    const x = SES.list[SES.i], zone = document.createElement("div"); zone.className = "card";
    topr.innerHTML = '<button type="button" class="sc t" id="quit">Terminer</button>';
    $("quit").onclick = () => end(true);
    const ctx = {urls:{}, dec:I.safeDecode, play};
    await Promise.all(C.mediaNames(x.note).map(async n => { ctx.urls[n] = await S.mediaUrl(x.note.packId, n); }));
    app.innerHTML = '<div class="prog">' + SES.list.map((_, i) => '<i class="' + (SES.res[i] === true ? "ok" : SES.res[i] === false ? "no" : i === SES.i ? "cur" : "") + '"></i>').join("") + "</div>";
    app.appendChild(zone);
    let over = false;
    const H = {ctx, bar:setBar, autoplay:el => { if(pref("mtc_anki_autoplay", "1") === "1"){ const b = el.querySelector(".snd"); if(b) b.click(); } },
      finish:async ok => {
        if(over) return; over = true; SES.res[SES.i] = ok;
        try{ await S.saveProgress(x.card.id, ok); }catch(e){}
        if(ok){ if(window.mtcCelebrate) window.mtcCelebrate(1); } else if(window.mtcMiss) window.mtcMiss();
        if(window.mtcRecordDailyPlay) window.mtcRecordDailyPlay();
        const last = SES.i >= SES.list.length - 1;
        setBar([{t:last ? "Voir le bilan →" : "Suivant →", cls:"main", on:() => { if(last) end(false); else { SES.i++; show(); } }}]);
        const p = app.querySelector(".prog"); if(p) p.children[SES.i].className = ok ? "ok" : "no";
      }};
    C.mount(zone, x.note, x.card, H);
    window.scrollTo(0, 0);
  }
  function play(name){
    const x = SES && SES.list[SES.i]; if(!x) return;
    S.mediaUrl(x.note.packId, name).then(u => { if(!u) return; try{ if(AUDIO) AUDIO.pause(); AUDIO = new Audio(u); AUDIO.play().catch(() => {}); }catch(e){} });
  }
  async function end(early){
    topr.textContent = ""; const r = SES.res, got = r.filter(v => v === true).length, seen = r.filter(v => v !== undefined).length;
    app.innerHTML = '<h1>Séance terminée</h1><p class="sum"><b>' + got + "</b> sur " + seen + " carte" + (seen > 1 ? "s" : "") + " sues du premier coup.</p>" +
      '<p class="help">' + (seen - got ? (seen - got) + " carte" + (seen - got > 1 ? "s" : "") + " reviendront en tête de la prochaine séance. " : "") + "Les cartes sues reviennent dans 1 jour, puis 3, 7, 14 jours… selon tes réussites.</p>";
    setBar([{t:"Une autre séance", cls:"", on:() => { SES = null; start2(); }}, {t:"Mes paquets", cls:"main", on:stop}]);
    if(!early && seen === SES.list.length && got === seen && window.mtcFinale) window.mtcFinale("Séance parfaite", seen + " cartes sues", {etoiles:"✦✦✦"});
  }
  async function start2(){ await load(); await start(); }

  window.addEventListener("pagehide", () => { if(AUDIO) try{ AUDIO.pause(); }catch(e){} });
  S.open().then(home).catch(err => { app.innerHTML = '<p class="err">Le stockage de cet appareil n’est pas disponible (navigation privée ?) : ' + esc(err && err.message || err) + "</p>"; });
})();
