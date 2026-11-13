/* ============================================================
   anki-cards.js
   Affichage des cinq familles de cartes Anki : basic, mc (réponses en lettres), mc10 (réponses en 1 et 0),
   cloze (trous) et match (paires). Le contenu d'un paquet n'est jamais fiable : tout le HTML des champs passe
   par un filtre qui ne garde que la mise en forme (gras, listes, tableaux, images du paquet…) ; scripts, cadres,
   liens, styles et adresses externes sont supprimés.
   MTCAnkiCards.mount(zone, note, card, H)  H = {bar(boutons), finish(ok), ctx}
   ============================================================ */
(function(root){
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };

  // ---------- filtre du HTML ----------
  const KEEP = new Set("b strong i em u s strike del sub sup br p div span ul ol li table thead tbody tfoot tr td th hr blockquote code pre small big center h1 h2 h3 h4 h5 h6 font".split(" "));
  const DROP = new Set("script style iframe object embed link meta noscript template svg math audio video source canvas form input button select textarea base title head".split(" "));
  const CLASS_OK = /^(tone[0-5]|cz-[a-z]+)$/;
  const STYLE_OK = {"color":1, "background-color":1, "font-weight":1, "font-style":1, "text-decoration":1, "white-space":1};
  const VALUE_OK = /^[#\w(),.% -]+$/;
  function cleanStyle(s){
    return String(s || "").split(";").map(d => { const i = d.indexOf(":"); if(i < 0) return ""; const k = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
      return STYLE_OK[k] && VALUE_OK.test(v) && !/url|expression|javascript/i.test(v) ? k + ":" + v : ""; }).filter(Boolean).join(";");
  }
  function walk(src, dst, ctx){
    src.childNodes.forEach(n => {
      if(n.nodeType === 3){ dst.appendChild(document.createTextNode(n.nodeValue)); return; }
      if(n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if(tag === "img"){
        const name = n.getAttribute("src") || "", u = ctx.urls[name] || ctx.urls[ctx.dec(name)];
        if(u){ const im = document.createElement("img"); im.src = u; im.alt = String(n.getAttribute("alt") || "").slice(0, 200); dst.appendChild(im); }
        return;
      }
      if(DROP.has(tag)) return;
      if(!KEEP.has(tag)){ walk(n, dst, ctx); return; }        // balise inconnue : on garde son texte
      const e = document.createElement(tag === "font" ? "span" : tag);
      const cls = String(n.getAttribute("class") || "").split(/\s+/).filter(c => CLASS_OK.test(c)).join(" "); if(cls) e.className = cls;
      let st = cleanStyle(n.getAttribute("style"));
      if(tag === "font" && n.getAttribute("color") && VALUE_OK.test(n.getAttribute("color"))) st = ("color:" + n.getAttribute("color") + ";" + st);
      if(st) e.setAttribute("style", st);
      if((tag === "td" || tag === "th")){ ["colspan", "rowspan"].forEach(a => { const v = parseInt(n.getAttribute(a), 10); if(v > 0 && v < 50) e.setAttribute(a, v); }); }
      walk(n, e, ctx); dst.appendChild(e);
    });
  }
  // [sound:fichier.mp3] devient un bouton de lecture
  function soundify(rootEl, ctx){
    const tw = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT), list = [];
    while(tw.nextNode()) if(/\[sound:[^\]]+\]/.test(tw.currentNode.nodeValue)) list.push(tw.currentNode);
    list.forEach(t => {
      const parts = t.nodeValue.split(/(\[sound:[^\]]+\])/), frag = document.createDocumentFragment();
      parts.forEach(p => { const m = /^\[sound:([^\]]+)\]$/.exec(p);
        if(m){ const b = el("button", "snd", "▶"); b.type = "button"; b.setAttribute("aria-label", "Écouter"); b.dataset.snd = m[1]; b.addEventListener("click", ev => { ev.stopPropagation(); ctx.play(m[1]); }); frag.appendChild(b); }
        else if(p) frag.appendChild(document.createTextNode(p)); });
      t.parentNode.replaceChild(frag, t);
    });
  }
  function html(s, ctx){
    const out = document.createElement("div");
    const doc = new DOMParser().parseFromString("<body>" + String(s == null ? "" : s).replace(/<!--[\s\S]*?-->/g, "") + "</body>", "text/html");
    walk(doc.body, out, ctx); soundify(out, ctx);
    return out;
  }
  const textOf = (s, ctx) => html(s, ctx).textContent.replace(/ /g, " ").trim();

  // ---------- champs ----------
  const lower = f => { const m = {}; Object.keys(f).forEach(k => { m[k.toLowerCase().trim()] = f[k]; }); return m; };
  const empty = v => v == null || String(v).replace(/<[^>]*>/g, "").replace(/&nbsp;|\s/g, "") === "" && !/<img|\[sound:/i.test(String(v));
  const firstOf = (L, names) => names.find(n => L[n] != null && !empty(L[n]));

  const block = (label, node) => { const d = el("div", "blk"); if(label) d.appendChild(el("span", "lbl", esc(label))); d.appendChild(node); return d; };
  // pinyin, hanzi et sons : la ligne chinoise des cartes de ta collection
  function chineseLine(L, ctx, used){
    const hz = firstOf(L, ["hanzi", "chinois", "simplified"]), py = firstOf(L, ["pinyin"]), au = firstOf(L, ["audio", "sound", "son"]);
    if(!hz && !py && !au) return null;
    const d = el("div", "zh");
    if(hz){ used.add(hz); d.appendChild(el("span", "hz")).appendChild(html(L[hz], ctx)); }
    if(py){ used.add(py); d.appendChild(el("span", "py")).appendChild(html(L[py], ctx)); }
    if(au){ used.add(au); d.appendChild(html(L[au], ctx)); }
    return d;
  }

  // ---------- 1. recto / verso ----------
  function basic(zone, note, card, H, forced){
    const L = lower(note.fields), ctx = H.ctx, keys = Object.keys(L);
    let fk = firstOf(L, ["front", "recto", "question", "fronttext", "texte", "content"]) || keys.find(k => !empty(L[k])), bk = firstOf(L, ["back", "verso", "réponse", "reponse", "backtext", "traduction"]);
    if(forced){ L.__f = forced.front; L.__b = forced.back; fk = "__f"; bk = "__b"; keys.length = 0; }   // les champs d'origine (question, items…) sont déjà dans le recto / verso
    let rev = card.ord === 1 && note.model && /invers|revers/i.test(note.model); if(rev){ const t = fk; fk = bk || fk; bk = t; }
    const used = new Set([fk, bk]);
    const q = el("div", "q"); if(fk) q.appendChild(html(L[fk], ctx)); else q.textContent = "(carte vide)";
    if(!fk || empty(L[fk])){ const im = firstOf(L, ["image"]); if(im){ used.add(im); q.appendChild(html(L[im], ctx)); } }
    zone.appendChild(q);
    const ans = el("div", "ans"); ans.hidden = true; zone.appendChild(ans);
    H.bar([{t:"Afficher la réponse", cls:"main", on:() => {
      if(bk && !empty(L[bk])) ans.appendChild(block("", html(L[bk], ctx)));
      const im = firstOf(L, ["image"]); if(im && !used.has(im)){ used.add(im); ans.appendChild(html(L[im], ctx)); }
      const zh = chineseLine(L, ctx, used); if(zh) ans.appendChild(zh);
      keys.forEach(k => { if(!used.has(k) && !empty(L[k])){ used.add(k); const lab = k.replace(/_/g, " "); ans.appendChild(block(lab.charAt(0).toUpperCase() + lab.slice(1), html(L[k], ctx))); } });
      ans.hidden = false; H.autoplay(ans);
      H.bar([{t:"À revoir", cls:"no", on:() => H.finish(false)}, {t:"Je savais", cls:"ok", on:() => H.finish(true)}]);
    }}]);
  }

  // ---------- 2. texte à trous ----------
  const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;
  function cloze(zone, note, card, H){
    const L = lower(note.fields), ctx = H.ctx, keys = Object.keys(L);
    const tk = keys.find(k => /\{\{c\d+::/.test(L[k])) || firstOf(L, ["content", "text", "texte"]) || keys[0];
    // Tous les trous du texte sont cachés en même temps ; toucher un trou le dévoile (les trous du même numéro ensemble).
    const parts = [], marked = (tk ? String(L[tk]) : "").replace(CLOZE, (m, k, a, hint) => { parts.push({n:+k, a, hint:hint ? hint.replace(/<[^>]*>/g, "").trim() : ""}); return "" + (parts.length - 1) + ""; });
    const q = el("div", "q"), body = html(marked, ctx); q.appendChild(body); zone.appendChild(q);
    const spans = [];
    const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT), hit = [];
    while(tw.nextNode()) if(/\d+/.test(tw.currentNode.nodeValue)) hit.push(tw.currentNode);
    hit.forEach(t => {
      const frag = document.createDocumentFragment();
      t.nodeValue.split(/(\d+)/).forEach(p => { const m = /^(\d+)$/.exec(p);
        if(!m){ if(p) frag.appendChild(document.createTextNode(p)); return; }
        const part = parts[+m[1]], s = el("span", "cz-blank", esc("[" + (part.hint || "…") + "]"));
        s.setAttribute("role", "button"); s.tabIndex = 0; s.title = "Toucher pour dévoiler";
        spans.push({s, part}); s.addEventListener("click", () => reveal(part.n)); s.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); reveal(part.n); } });
        frag.appendChild(s); });
      t.parentNode.replaceChild(frag, t);
    });
    const shown = new Set(), numbers = [...new Set(parts.map(p => p.n))];
    const ans = el("div", "ans"); ans.hidden = true; zone.appendChild(ans);
    function reveal(n){
      if(shown.has(n)) return; shown.add(n);
      spans.forEach(x => { if(x.part.n !== n) return; x.s.className = "cz-hl"; x.s.removeAttribute("role"); x.s.removeAttribute("tabindex"); x.s.removeAttribute("title"); x.s.replaceChildren(...html(x.part.a, ctx).childNodes); });
      if(shown.size >= numbers.length) finish(); else bar();
    }
    function bar(){ const left = numbers.length - shown.size; H.bar([{t:numbers.length > 1 && shown.size === 0 ? "Tout dévoiler" : left > 1 ? "Dévoiler les " + left + " trous" : "Dévoiler le dernier trou", cls:"main", on:() => numbers.forEach(reveal)}]); }
    function finish(){
      keys.forEach(k => { if(k !== tk && !/^cloze99$/.test(k) && !empty(L[k])){ const lab = k.replace(/_/g, " "); ans.appendChild(block(lab.charAt(0).toUpperCase() + lab.slice(1), html(L[k], ctx))); } });
      ans.hidden = !ans.childNodes.length; H.autoplay(zone);
      H.bar([{t:"À revoir", cls:"no", on:() => H.finish(false)}, {t:"Je savais", cls:"ok", on:() => H.finish(true)}]);
    }
    if(!numbers.length){ H.bar([{t:"Afficher la réponse", cls:"main", on:finish}]); } else bar();
  }

  // ---------- 3 et 4. choix multiples ----------
  // opts : [{html, good}] ; mode : "multi" | "single" | "kprim"
  function choices(zone, note, card, H, o){
    const ctx = H.ctx;
    const q = el("div", "q"); q.appendChild(html(o.question, ctx)); zone.appendChild(q);
    const list = el("div", "opts"); zone.appendChild(list);
    const state = o.opts.map(() => null);   // null, true (coché / vrai) ou false (faux, en kprim)
    const rows = o.opts.map((opt, i) => {
      const r = el("div", "opt" + (o.mode === "kprim" ? " kp" : o.mode === "multi" ? " multi" : ""));   // case ronde : un seul choix ; case carrée : plusieurs choix
      if(o.mode !== "kprim") r.appendChild(el("span", "tag"));   // pas de lettre ni de numéro : une case ronde qui se remplit à la sélection
      r.appendChild(el("div", "txt")).appendChild(html(opt.html, ctx));
      if(o.mode === "kprim"){
        const yn = el("span", "yn"); [["Vrai", true], ["Faux", false]].forEach(([t, v]) => { const b = el("button", "", t); b.type = "button"; b.addEventListener("click", () => { if(done) return; state[i] = v; paint(); }); b.dataset.v = String(v); yn.appendChild(b); });
        r.appendChild(yn);
      }else{
        r.setAttribute("role", "button"); r.tabIndex = 0;
        const tap = () => { if(done) return; if(o.mode === "single") state.fill(null); state[i] = state[i] ? null : true; paint(); };
        r.addEventListener("click", () => { tap(); r.blur(); }); r.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); tap(); } });
      }
      list.appendChild(r); return r;
    });
    let done = false;
    const complete = () => o.mode === "kprim" ? state.every(v => v !== null) : state.some(v => v === true);
    function paint(){
      rows.forEach((r, i) => { r.classList.toggle("on", state[i] === true && o.mode !== "kprim"); if(o.mode === "kprim") r.querySelectorAll(".yn button").forEach(b => b.classList.toggle("on", String(state[i]) === b.dataset.v)); });
      H.bar([{t:"Valider", cls:"main", disabled:!complete(), on:check}]);
    }
    function check(){
      done = true;
      const good = o.opts.map(x => !!x.good);
      const ok = o.mode === "kprim" ? good.every((g, i) => state[i] === g) : good.every((g, i) => (state[i] === true) === g);
      rows.forEach((r, i) => {
        if(o.mode === "kprim"){ r.classList.add(state[i] === good[i] ? "good" : "bad"); r.querySelector(".txt").appendChild(el("span", "verdict", good[i] ? " · vrai" : " · faux")); return; }
        const chosen = state[i] === true;
        r.classList.add(good[i] ? "good" : chosen ? "bad" : "neutral");
        if(good[i] && !chosen) r.classList.add("missed");
      });
      const ans = el("div", "ans"); (o.after || []).forEach(a => { if(a) ans.appendChild(a); }); if(ans.childNodes.length) zone.appendChild(ans);
      H.autoplay(zone);
      H.finish(ok);
    }
    paint();
  }
  function mc(zone, note, card, H){
    const L = lower(note.fields), ctx = H.ctx, letters = "abcdefghij".split("").filter(k => L[k] != null && !empty(L[k]));
    const want = new Set((textOf(L.answers || "", ctx).toLowerCase().match(/[a-j]/g) || []));
    const used = new Set(["question", "answers", "number"].concat(letters));
    const after = []; const ex = firstOf(L, ["explanation"]); if(ex){ used.add(ex); after.push(block("Explication", html(L[ex], ctx))); }
    const rf = firstOf(L, ["ref"]); if(rf){ used.add(rf); after.push(block("Référence", html(L[rf], ctx))); }
    const zh = chineseLine(L, ctx, used); if(zh) after.push(zh);
    choices(zone, note, card, H, {question:L.question || "", letters, mode:"multi", opts:letters.map(k => ({html:L[k], good:want.has(k)})), after});
  }
  function mc10(zone, note, card, H){
    const L = lower(note.fields), ctx = H.ctx, qk = Object.keys(L).find(k => /^qtype/.test(k));
    const idx = []; for(let i = 1; i <= 12; i++) if(L["q_" + i] != null && !empty(L["q_" + i])) idx.push(i);
    const flags = (textOf(L.answers || "", ctx).match(/[01]/g) || []).map(x => x === "1");
    const good = idx.map((i, k) => !!flags[k]), count = good.filter(Boolean).length;
    const t = String(textOf(L[qk] || "", ctx)).trim();
    const mode = t === "0" ? "kprim" : t === "2" ? "single" : t === "1" ? "multi" : (count === 1 ? "single" : "multi");
    const used = new Set(["question", "answers", "title", qk].concat(idx.map(i => "q_" + i)));
    const after = [];
    [["réponse", "Réponse"], ["reponse", "Réponse"], ["extra 1", "Complément"], ["mémo", "Mémo"], ["memo", "Mémo"], ["sources", "Sources"]].forEach(([k, lab]) => { if(L[k] != null && !empty(L[k]) && !used.has(k)){ used.add(k); after.push(block(lab, html(L[k], ctx))); } });
    const zh = chineseLine(L, ctx, used); if(zh) after.push(zh);
    choices(zone, note, card, H, {question:L.question || "", mode, opts:idx.map((i, k) => ({html:L["q_" + i], good:good[k]})), after});
  }

  // ---------- 5. paires ----------
  // Lignes d'un champ : on coupe aux <br>, aux blocs (div, p, li, tableaux, titres) et aux retours à la ligne.
  const lines = s => String(s || "").replace(/<br[^>]*>|<\/?(?:div|p|li|ul|ol|tr|table|tbody|thead|blockquote|h[1-6])\b[^>]*>/gi, "\n").split(/\r?\n|\u2028/);
  const plain = s => String(s).replace(/<[^>]*>/g, "").replace(/&nbsp;|\u00a0/g, " ").trim();
  // une ligne « gauche::droite » (les trous {{c1::…}} d'un texte à trous n'en sont pas)
  const pairOf = l => { if(/\{\{c\d+::/.test(l)) return null; const i = l.indexOf("::"); if(i < 0) return null; const a = l.slice(0, i), b = l.slice(i + 2); return plain(a) && plain(b) ? [a, b] : null; };
  const splitPairs = text => lines(text).map(pairOf).filter(Boolean);
  const pairLines = text => lines(text).filter(l => pairOf(l)).length;
  // le champ qui contient les paires, et le reste du texte (la consigne)
  function pairsOf(L){
    const keys = Object.keys(L).filter(k => !empty(L[k]));
    const best = (L.items != null && pairLines(L.items) >= 1) ? "items" : keys.sort((a, b) => pairLines(L[b]) - pairLines(L[a]))[0];
    if(!best || !pairLines(L[best])) return null;
    const rest = lines(L[best]).filter(l => !pairOf(l) && plain(l)).join("<br>");
    const intro = ["question", "front", "recto"].filter(k => k !== best).map(k => L[k]).find(x => x && !empty(x));   // la consigne peut être dans un autre champ
    const question = [intro, rest].filter(x => x && !empty(x)).join("<br>");
    return {pairs:splitPairs(L[best]), question, note:L.note};
  }
  function match(zone, note, card, H){
    const L = lower(note.fields), ctx = H.ctx, P = pairsOf(L) || {pairs:[], question:L.question || "", note:L.note}, pairs = P.pairs;
    if(pairs.length < 2){ return basic(zone, note, card, H, {front:(P.question ? P.question + "<br>" : "") + (pairs[0] ? pairs[0][0] : L.items || ""), back:pairs[0] ? pairs[0][1] : ""}); }
    L.note = P.note;
    zone.appendChild(el("div", "q")).appendChild(html(P.question || "Associe chaque élément.", ctx));
    const rowsEl = el("div", "pairs"), pool = el("div", "pool"); zone.appendChild(rowsEl); zone.appendChild(pool);
    const key = s => textOf(s, ctx).toLowerCase();
    const order = pairs.map((p, i) => i).sort(() => Math.random() - .5);   // l'ordre des réponses est mélangé
    const val = pairs.map(() => null);       // index (dans pairs) du choix placé sur chaque ligne
    let active = 0, done = false;
    const rows = pairs.map((p, i) => {
      const r = el("div", "prow"); r.appendChild(el("div", "pl")).appendChild(html(p[0], ctx));
      const slot = el("button", "slot", "…"); slot.type = "button"; r.appendChild(slot);
      slot.addEventListener("click", () => { if(done) return; if(val[i] != null) val[i] = null; active = i; paint(); });
      rowsEl.appendChild(r); return {r, slot};
    });
    const chips = order.map(j => { const c = el("button", "chip"); c.type = "button"; c.appendChild(html(pairs[j][1], ctx));
      c.addEventListener("click", () => { if(done || val.includes(j)) return; val[active] = j; const nx = val.findIndex(v => v == null); active = nx < 0 ? active : nx; paint(); });
      pool.appendChild(c); return {c, j}; });
    function paint(){
      rows.forEach((x, i) => { x.r.classList.toggle("act", i === active && !done); x.slot.replaceChildren(); if(val[i] == null) x.slot.textContent = "…"; else x.slot.appendChild(html(pairs[val[i]][1], ctx)); });
      chips.forEach(x => { x.c.disabled = val.includes(x.j); });
      H.bar([{t:"Valider", cls:"main", disabled:val.some(v => v == null), on:check}]);
    }
    function check(){
      done = true; let ok = true;
      rows.forEach((x, i) => { const right = val[i] != null && key(pairs[val[i]][1]) === key(pairs[i][1]); if(!right){ ok = false; x.r.classList.add("bad"); x.r.appendChild(el("div", "fix")).appendChild(html(pairs[i][1], ctx)); } else x.r.classList.add("good"); x.r.classList.remove("act"); });
      pool.hidden = true;
      if(L.note && !empty(L.note)) zone.appendChild(el("div", "ans")).appendChild(html(L.note, ctx));
      H.finish(ok);
    }
    paint();
  }

  const TYPES = {basic, cloze, mc, mc10, match};
  // Un recto / verso dont un champ contient plusieurs lignes « gauche::droite » est une carte de paires : le type de note n'est pas toujours reconnu.
  function typeOf(note){
    if(note.type === "basic"){ const L = lower(note.fields); if(Object.keys(L).some(k => pairLines(L[k]) >= 2)) return "match"; }
    return note.type;
  }
  function mount(zone, note, card, H){ (TYPES[typeOf(note)] || basic)(zone, note, card, H); }
  const mediaNames = note => { const set = new Set(); Object.values(note.fields).forEach(v => { String(v).replace(/(?:src)\s*=\s*["']([^"']+)["']/gi, (m, a) => { set.add(a); return m; }).replace(/\[sound:([^\]]+)\]/g, (m, a) => { set.add(a); return m; }); }); return [...set]; };

  root.MTCAnkiCards = {mount, html, mediaNames, splitPairs, TYPES};
})(window);
