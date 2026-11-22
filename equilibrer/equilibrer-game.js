// Jeu « Équilibrer », partagé par equilibrer/index.html et le module Réseaux (circuits/index.html).
// mtcEquilibrer(main) renvoie {start, render} : start tire un nouveau cas, render dessine le jeu dans main.
window.mtcEquilibrer = function(main){
  "use strict";
  // Jeu « Équilibrer » : des canaux sont atteints ; choisir le moins de canaux équilibrants possible selon les six
  // systèmes des canaux unis de Dr Richard Tán. Horloge chinoise des douze
  // canaux ; rèn mài et dū mài hors de l'horloge, sur le passage du yíng qì (F → RM → DM → P), seulement pour le
  // système 1. Un canal atteint peut en équilibrer un autre ; avec le système 6, il s'équilibre lui-même.
  // explications du jeu rangées derrière un « ? » (ouvert ou fermé : le choix reste d'un jeu à l'autre)
  const aide = html => '<details class="aide"' + (window.mtcAideOpen ? " open" : "") + '><summary title="Explications" aria-label="Explications">?</summary><p class="src">' + html + "</p></details>";
  main.addEventListener("toggle", e => { if(e.target.classList && e.target.classList.contains("aide")) window.mtcAideOpen = e.target.open; }, true);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const TAN_SYSTEMS = {
    1:{name:"grands canaux de même nom (tóng míng)", pairs:[["P", "Rt"], ["GI", "E"], ["C", "Rn"], ["IG", "V"], ["EC", "F"], ["TF", "VB"], ["DM", "RM"]]},
    2:{name:"six couches (zàng fǔ bié tōng)", pairs:[["P", "V"], ["GI", "F"], ["E", "EC"], ["Rt", "IG"], ["C", "VB"], ["Rn", "TF"]]},
    3:{name:"biǎo / lǐ (surface / interne)", pairs:[["P", "GI"], ["E", "Rt"], ["C", "IG"], ["V", "Rn"], ["EC", "TF"], ["VB", "F"]]},
    4:{name:"horloge opposée (zǐ wǔ)", pairs:[["P", "V"], ["GI", "Rn"], ["E", "EC"], ["Rt", "TF"], ["C", "VB"], ["IG", "F"]]},
    5:{name:"canaux voisins sur l’horloge (liú zhù)", pairs:[["P", "F"], ["GI", "E"], ["Rt", "C"], ["IG", "V"], ["Rn", "EC"], ["TF", "VB"]]},
    6:{name:"le canal s’équilibre lui-même (zì jǐ)", pairs:[], self:true}
  };
  const NSYS = [1, 2, 3, 4, 5, 6];
  const NAMES = {P:"Shǒu tài yīn — poumon", GI:"Shǒu yáng míng — gros intestin", E:"Zú yáng míng — estomac", Rt:"Zú tài yīn — rate",
    C:"Shǒu shào yīn — cœur", IG:"Shǒu tài yáng — intestin grêle", V:"Zú tài yáng — vessie", Rn:"Zú shào yīn — reins",
    EC:"Shǒu jué yīn — enveloppe du cœur", TF:"Shǒu shào yáng — trois foyers", VB:"Zú shào yáng — vésicule biliaire", F:"Zú jué yīn — foie",
    RM:"Rèn mài", DM:"Dū mài"};
  const COLOR = {E:"#d9a400", Rt:"#d9a400", VB:"#2f9a3c", F:"#2f9a3c", C:"#e0261b", IG:"#e0261b", EC:"#e0261b", TF:"#e0261b",
    V:"#1f5fd6", Rn:"#1f5fd6", RM:"#d77fa4", DM:"#6aa9d6"};
  const ink = c => COLOR[c] || "var(--text-color)";   // métal (P, GI) : couleur des lettres du thème
  const ORD = ["P", "GI", "E", "Rt", "C", "IG", "V", "Rn", "EC", "TF", "VB", "F"];
  const ALL = ORD.concat(["RM", "DM"]);
  const YIN = new Set(["P", "Rt", "C", "Rn", "EC", "F", "RM"]);
  const KEY = "mtc_balance_game_v1";
  const PRAISE = ["Parfait !", "Super !", "Incroyable !", "Bravo !", "Au top !"];
  // félicitation (seulement pour un cas parfait) + lueur verte (celebrate.js)
  const praise = () => { if(window.mtcCelebrate) window.mtcCelebrate(1); return PRAISE[Math.floor(Math.random() * PRAISE.length)]; };
  // difficulté choisie avec un curseur : nombre de canaux atteints
  const LEVELS = [2, 3, 4, 5, 6];
  const B = {on:new Set(NSYS), aff:[], pick:new Set(), done:false, hint:false, score:0, played:0, lvl:1, sols:[], view:-1};
  try{ const s = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("mtc_trajets_balance") || "{}"); if(Array.isArray(s.on) && s.on.length){ B.on = new Set(s.on); if(!s.v6) B.on.add(6); } B.hint = !!s.hint; B.score = s.score || 0; B.played = s.played || 0;
    if(Number.isInteger(s.lvl)) B.lvl = Math.max(0, Math.min(LEVELS.length - 1, s.lvl)); }catch(e){}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify({v6:1, on:[...B.on], hint:B.hint, score:B.score, played:B.played, lvl:B.lvl})); }catch(e){} };
  const lvlTxt = i => "Niveau " + (i + 1) + " · " + LEVELS[i] + " canaux atteints";
  const links = (b, a) => b === a ? (B.on.has(6) && ORD.includes(a) ? [6] : []) : [...B.on].filter(n => TAN_SYSTEMS[n].pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
  const pos = c => {
    const pol = (a, r) => [170 + r * Math.cos(a), 170 + r * Math.sin(a)];
    if(c === "RM") return pol(128 * Math.PI / 180, 188);
    if(c === "DM") return pol(142 * Math.PI / 180, 188);
    return pol(-Math.PI / 2 + (ORD.indexOf(c) - ORD.indexOf("C")) * Math.PI / 6, 125);   // C à midi, en haut
  };
  function optimum(){
    for(let k = 1; k <= ALL.length; k++){
      const sols = [];
      const rec = (s, i) => {
        if(s.length === k){ if(B.aff.every(a => s.some(b => links(b, a).length))) sols.push(s.slice()); return; }
        for(let j = i; j < ALL.length; j++){ s.push(ALL[j]); rec(s, j + 1); s.pop(); }
      };
      rec([], 0);
      if(sols.length) return sols;
    }
    return [];
  }
  // tirage pondéré par la maîtrise par canal (module Réseaux) : un canal peu maîtrisé sort jusqu'à 3 fois plus souvent
  function weighted(pool){
    let ms = {}; try{ ms = JSON.parse(localStorage.getItem("mtc_circuits_mastery_v1") || "{}") || {}; }catch(e){}
    const w = pool.map(c => 1 + 2 * (1 - Math.min(8, (ms[c] && ms[c].v) || 0) / 8)), tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for(let i = 0; i < pool.length; i++){ r -= w[i]; if(r <= 0) return i; }
    return pool.length - 1;
  }
  function newCase(){
    for(let tries = 0; tries < 50; tries++){
      const n = LEVELS[B.lvl];
      const pool = B.on.has(1) && Math.random() < .2 ? ALL.slice() : ORD.slice();
      B.aff = [];
      while(B.aff.length < n){
        const c = pool.splice(weighted(pool), 1)[0];
        if((c === "RM" || c === "DM") && B.aff.some(x => x === "RM" || x === "DM")) continue;
        B.aff.push(c);
      }
      if(B.aff.every(a => ALL.some(b => links(b, a).length))) break;
    }
    B.pick = new Set(); B.done = false; B.head = ""; B.sols = []; B.view = -1; B.err = ""; B.round = (B.round || 0) + 1;
  }
  // canaux choisis à afficher sur le cercle : la réponse, ou la solution cliquée dans la liste après la vérification
  const shown = () => B.done && B.view >= 0 && B.sols[B.view] ? new Set(B.sols[B.view]) : B.pick;
  function render(){
    const D = shown(), viewing = D !== B.pick;
    const chip = c => '<b class="balc" style="color:' + ink(c) + '" title="' + esc(NAMES[c]) + '">' + esc(c) + "</b>";
    let g = '<circle cx="170" cy="170" r="125" fill="none" stroke="currentColor" stroke-opacity=".2"/>';
    const [f, rm, dm, pp] = ["F", "RM", "DM", "P"].map(pos);
    const seg = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, ux = dx / d * 21, uy = dy / d * 21;
      return "M" + (a[0] + ux) + " " + (a[1] + uy) + " L" + (b[0] - ux) + " " + (b[1] - uy); };
    g += '<path d="' + seg(f, rm) + " " + seg(rm, dm) + " " + seg(dm, pp) + '" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-dasharray="3 4"/>';
    const mid = [(rm[0] + dm[0]) / 2, (rm[1] + dm[1]) / 2], md = Math.hypot(mid[0] - 170, mid[1] - 170) || 1;
    g += '<text x="' + (mid[0] + (mid[0] - 170) / md * 34) + '" y="' + (mid[1] + (mid[1] - 170) / md * 34 + 3) + '" text-anchor="middle" class="balflow">YÍNG QÌ</text>';
    D.forEach(b => B.aff.forEach(a => {
      const l = links(b, a); if(!l.length) return;
      if(a === b){
        const [x, y] = pos(a), d = Math.hypot(x - 170, y - 170) || 1, cx = x + (x - 170) / d * 41, cy = y + (y - 170) / d * 41;
        g += '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="var(--page-bg)" stroke="var(--shadow-color)" stroke-width="1.8"/>' +
          '<text x="' + cx + '" y="' + (cy + 3.5) + '" text-anchor="middle" class="balsys">6</text>';
        return;
      }
      const [p1, p2] = [pos(b), pos(a)], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
      g += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="var(--shadow-color)" stroke-width="1.8"/>' +
        '<rect x="' + (mx - 14) + '" y="' + (my - 8) + '" width="28" height="16" fill="var(--page-bg)" stroke="var(--shadow-color)"/>' +
        '<text x="' + mx + '" y="' + (my + 3.5) + '" text-anchor="middle" class="balsys">' + l.join("·") + "</text>";
    }));
    ALL.forEach(c => {
      const [x, y] = pos(c), isA = B.aff.includes(c), isP = D.has(c), mv = c === "RM" || c === "DM", off = mv && !B.on.has(1);
      g += '<g class="balnode' + (off ? " off" : "") + '" data-c="' + c + '"><title>' + esc(NAMES[c]) + (off ? " — seulement dans le système 1" : "") + "</title>";
      if(isA) g += '<circle cx="' + x + '" cy="' + y + '" r="27" fill="none" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="4 3"/>';
      // après la vérification : une solution minimale entourée de vert, les canaux en trop de rouge
      if(B.done && viewing){ if(isP) g += '<circle cx="' + x + '" cy="' + y + '" r="31" fill="none" stroke="#1a8a3a" stroke-width="2.6"/>'; }
      else if(B.done && B.best){ if(B.best.includes(c)) g += '<circle cx="' + x + '" cy="' + y + '" r="31" fill="none" stroke="#1a8a3a" stroke-width="2.6"/>';
        else if(isP) g += '<circle cx="' + x + '" cy="' + y + '" r="31" fill="none" stroke="#c0392b" stroke-width="2.6"/>'; }
      // canaux yīn en pastille pleine de leur couleur, canaux yáng cerclés ; canal choisi : anneau épais couleur d'ombre
      if(isP) g += '<circle cx="' + x + '" cy="' + y + '" r="22.5" fill="none" stroke="var(--shadow-color)" stroke-width="4"/>';
      const yin = YIN.has(c);
      g += '<circle cx="' + x + '" cy="' + y + '" r="18" fill="' + (yin ? ink(c) : "var(--page-bg)") + '" stroke="' + ink(c) + '" stroke-width="1.6"/>';
      g += '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" class="ballbl" style="fill:' + (yin ? "var(--page-bg)" : ink(c)) + '">' + esc(c) + "</text>";
      if(B.hint){ const n = B.aff.filter(a => links(c, a).length).length; if(n) g += '<text x="' + (x + 19) + '" y="' + (y - 14) + '" class="balhint">' + n + "</text>"; }
      g += "</g>";
    });
    const cov = B.aff.map(a => {
      const by = [...D].map(b => [b, links(b, a)]).filter(x => x[1].length);
      return "<li>" + (by.length ? '<span class="balok">✓</span>' : '<span class="balno">—</span>') + chip(a) +
        (by.length ? ' <span class="balsm">équilibré par</span> ' + by.map(([b, l]) => (b === a ? '<span class="balsm">lui-même</span>' : chip(b)) + ' <span class="balsm">(syst. ' + l.join(", ") + ")</span>").join(", ") : ' <span class="balsm">pas encore équilibré</span>') + "</li>";
    }).join("");
    const table = '<details class="balsyst"><summary>Rappel : les six systèmes</summary><table><tr><th>Système</th><th>Paires de canaux</th></tr>' +
      Object.entries(TAN_SYSTEMS).map(([n, s]) => "<tr><td><b>" + n + "</b> · " + esc(s.name) + "</td><td>" + (s.self ? "chaque canal avec lui-même (hors rèn mài et dū mài)" : s.pairs.map(([a, b]) => chip(a) + "–" + chip(b)).join(" · ")) + "</td></tr>").join("") +
      "</table></details>";
    main.innerHTML =
      '<div class="balbar">' +
      aide('Des canaux sont atteints : clique sur le moins de canaux possible pour les rééquilibrer tous, selon les six systèmes des canaux unis de Dr Tán. Un canal atteint peut en équilibrer un autre, et avec le système 6 il s’équilibre lui-même. Rèn mài et dū mài ne comptent que pour le système 1.<br>Les boutons 1 à 6 choisissent les systèmes. « Indices » affiche sur chaque canal le nombre de canaux atteints qu’il équilibre. Après la vérification, clique sur une solution pour la voir sur le cercle.') +
      '<span class="balsysgrp" title="Systèmes">' + NSYS.map(n => '<button type="button" class="balsysbtn' + (B.on.has(n) ? " on" : "") + '" data-n="' + n + '" title="Système ' + n + " : " + esc(TAN_SYSTEMS[n].name) + '">' + n + "</button>").join("") + "</span>" +
      '<label title="Afficher sur chaque canal le nombre de canaux atteints qu’il équilibre"><input type="checkbox" id="balHint"' + (B.hint ? " checked" : "") + "> indices</label>" +
      '<span class="balscore" title="Cas résolus avec le minimum de canaux">' + B.score + (B.score > 1 ? " réussis" : " réussi") + "</span></div>" +
      '<div class="balbar ballvl"><span class="balsm">facile</span><input type="range" id="balLvl" min="0" max="' + (LEVELS.length - 1) + '" step="1" value="' + B.lvl + '" aria-label="Niveau">' +
      '<span class="balsm">difficile</span><b id="balLvlTxt">' + lvlTxt(B.lvl) + "</b></div>" +
      '<div class="ballay"><svg class="balclock" viewBox="-40 -50 420 420" role="img" aria-label="Horloge chinoise des douze canaux">' + g + "</svg>" +
      '<div><div class="ballbltop">Canaux atteints</div><p class="balcase">' + B.aff.map(chip).join(" · ") + '</p><ul class="balcov">' + cov + "</ul>" +
      '<div class="balact"><button type="button" class="tool" id="balVal"' + (B.done ? " disabled" : "") + '>Valider</button><button type="button" class="tool" id="balNext">Nouveau cas</button><button type="button" class="tool" id="balClr"' + (B.done ? " disabled" : "") + ">Effacer</button></div>" +
      '<div class="balres">' + resultHtml() + "</div>" + table + "</div></div>";
    main.querySelectorAll(".balnode").forEach(n => n.addEventListener("click", () => {
      const c = n.dataset.c;
      if(B.done || ((c === "RM" || c === "DM") && !B.on.has(1))) return;
      const covered = () => B.aff.filter(a => [...B.pick].some(b => links(b, a).length)).length, before = covered();
      B.pick.has(c) ? B.pick.delete(c) : B.pick.add(c);
      const gained = covered() > before;
      if(gained && window.mtcPlayFx) window.mtcPlayFx("good");
      render();
      if(gained && window.mtcBounce) window.mtcBounce(main.querySelector('.balnode[data-c="' + c + '"]'));
    }));
    main.querySelectorAll(".balsysbtn").forEach(b => b.addEventListener("click", () => {
      const n = +b.dataset.n;
      if(B.on.has(n) && B.on.size > 1) B.on.delete(n); else B.on.add(n);
      save(); newCase(); render();
    }));
    document.getElementById("balHint").addEventListener("change", e => { B.hint = e.target.checked; save(); render(); });
    const lv = document.getElementById("balLvl");
    lv.addEventListener("input", e => { document.getElementById("balLvlTxt").textContent = lvlTxt(+e.target.value); });
    lv.addEventListener("change", e => { B.lvl = +e.target.value; save(); newCase(); render(); });
    // une solution cliquée s'affiche sur le cercle ; un second clic revient à la réponse
    main.querySelectorAll(".balsol").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i; B.view = B.view === i ? -1 : i; render(); }));
    document.getElementById("balNext").addEventListener("click", () => { newCase(); render(); });
    document.getElementById("balClr").addEventListener("click", () => { B.pick.clear(); render(); });
    document.getElementById("balVal").addEventListener("click", () => {
      if(!B.aff.every(a => [...B.pick].some(b => links(b, a).length))){ B.err = '<span class="balno">Il reste des canaux non équilibrés.</span>'; render(); return; }
      const opt = optimum(), k = opt.length ? opt[0].length : 0;
      B.done = true; B.played++;
      B.best = B.pick.size === k ? [...B.pick] : (opt[0] || []);
      if(window.mtcRecordDailyPlay) window.mtcRecordDailyPlay();
      if(B.pick.size === k) B.score++; else if(window.mtcMiss) window.mtcMiss();
      // maîtrise par canal (module Réseaux) : les canaux atteints du cas
      document.dispatchEvent(new CustomEvent("mtc-mastery", {detail:{channels:B.aff.slice(), ok:B.pick.size === k}}));
      save();
      const mine = [...B.pick].sort().join("|");
      const others = opt.filter(s => s.slice().sort().join("|") !== mine);
      // solution minimale trouvée : juste une félicitation, et les autres solutions s'il y en a
      B.err = ""; B.view = -1;
      if(B.pick.size === k){ if(window.mtcFinale) window.mtcFinale("Cas équilibré", "avec le minimum : " + k + (k > 1 ? " canaux" : " canal"), {etoiles:"✦✦✦"}); B.head = '<span class="balok">' + praise() + "</span>"; B.solLbl = "Autres solutions possibles"; B.sols = others.slice(0, 8); }
      else { B.head = "Tout est équilibré avec " + B.pick.size + " canaux ; le minimum est <b>" + k + "</b>."; B.solLbl = "Solutions minimales" + (opt.length > 1 ? " (" + opt.length + ")" : ""); B.sols = opt.slice(0, 8); }
      render();
    });
    // validation automatique dès que tous les canaux atteints sont équilibrés (le bouton « Valider » reste caché)
    if(!B.done && B.aff.every(a => [...B.pick].some(b => links(b, a).length))){
      const sig = B.round + "|" + [...B.pick].sort().join(",");
      if(B.autoSig !== sig){ B.autoSig = sig; setTimeout(() => { const v = document.getElementById("balVal"); if(v && !B.done && B.round + "|" + [...B.pick].sort().join(",") === sig) v.click(); }, 350); }
    }
  }
  function resultHtml(){
    if(!B.done) return B.err || "";
    const chip = c => '<b class="balc" style="color:' + ink(c) + '">' + esc(c) + "</b>";
    const fmt = s => s.map(b => chip(b) + ' <span class="balsm">(→ ' + B.aff.filter(x => links(b, x).length).map(x => (x === b ? "lui-même" : esc(x)) + " syst. " + links(b, x).join(", ")).join(" ; ") + ")</span>").join(" + ");
    return B.head + (B.sols.length ? '<br><span class="balsm">' + B.solLbl + " — clique pour voir sur le cercle :</span>" +
      B.sols.map((s, i) => '<button type="button" class="balsol' + (B.view === i ? " on" : "") + '" data-i="' + i + '">' + fmt(s) + "</button>").join("") : "");
  }
  // ---- « Les six systèmes » : l'horloge pour lire les six connexions d'un canal, ou toutes les paires d'un système
  const HZ = {mode:"canal", c:"P", n:4};
  const partners = (c, n) => n === 6 ? (ORD.includes(c) ? [c] : []) : TAN_SYSTEMS[n].pairs.filter(p => p.includes(c)).map(p => p[0] === c ? p[1] : p[0]);
  // page A5 en noir et blanc : une ligne par canal, ses six connexions en pastilles (plein = yīn, cercle = yáng, pointillé = lui-même)
  function pageImprimable(){
    const S = [], col = i => 36 + i * 18, row = k => 49 + k * 11.5, F = 'font-family="Arial, Helvetica, sans-serif"';
    const chip = (c, x, y, self) => {
      const yin = YIN.has(c) && !self;
      return '<circle cx="' + x + '" cy="' + y + '" r="4.2" fill="' + (yin ? "#000" : "#fff") + '" stroke="#000" stroke-width="' + (self ? .3 : .45) + '"' + (self ? ' stroke-dasharray="0.9 0.7"' : "") + "/>" +
        '<text x="' + x + '" y="' + (y + 1.2) + '" text-anchor="middle" font-size="3.3" font-weight="700" fill="' + (yin ? "#fff" : "#000") + '" ' + F + ">" + esc(c) + "</text>";
    };
    S.push('<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="148mm" height="210mm" viewBox="0 0 148 210">');
    S.push('<rect width="148" height="210" fill="#fff"/>');
    S.push('<text x="14" y="22" font-size="5.2" font-weight="700" ' + F + ">Les six connexions de chaque canal</text>");
    NSYS.forEach((n, i) => S.push('<text x="' + col(i) + '" y="38" text-anchor="middle" font-size="4.2" font-weight="700" ' + F + ">" + n + "</text>"));
    S.push('<line x1="9" y1="42" x2="139" y2="42" stroke="#000" stroke-width=".3"/>');
    ORD.forEach((c, k) => {
      const y = row(k);
      S.push(chip(c, 16, y));
      NSYS.forEach((n, i) => S.push(chip(n === 6 ? c : partners(c, n)[0], col(i), y, n === 6)));
      if(k < ORD.length - 1) S.push('<line x1="9" y1="' + (y + 5.75) + '" x2="139" y2="' + (y + 5.75) + '" stroke="#000" stroke-width=".12"/>');
    });
    const lg = [NSYS.slice(0, 3), NSYS.slice(3)].map(g => g.map(n => n + " " + TAN_SYSTEMS[n].name.replace(/\s*\(.*\)$/, "").replace(/^grands canaux de /, "")).join("   ·   "));
    lg.forEach((t, i) => S.push('<text x="14" y="' + (190 + i * 5) + '" font-size="2.9" ' + F + ">" + esc(t) + "</text>"));
    S.push('<text x="14" y="201" font-size="2.9" ' + F + ">plein : yīn   ·   cercle : yáng   ·   pointillé : le canal avec lui-même</text>");
    S.push("</svg>\n");
    return S.join("\n");
  }
  function saveFile(blob, name){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function savePng(){
    const svg = pageImprimable(), url = URL.createObjectURL(new Blob([svg], {type:"image/svg+xml"}));
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const cv = document.createElement("canvas"); cv.width = 1748; cv.height = 2480;
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    saveFile(await new Promise(ok => cv.toBlob(ok, "image/png")), "connexions-des-canaux.png");
  }
  function renderHorloge(){
    const chip = c => '<b class="balc" style="color:' + ink(c) + '" title="' + esc(NAMES[c]) + '">' + esc(c) + "</b>";
    const go = c => '<button type="button" class="balgo" data-c="' + c + '" title="' + esc(NAMES[c]) + '">' + chip(c) + "</button>";
    const lines = [], eq = new Set(), selfs = new Set(), canal = HZ.mode === "canal";
    if(canal){
      const by = {};
      for(let n = 1; n <= 5; n++) partners(HZ.c, n).forEach(p => { (by[p] = by[p] || []).push(n); });
      Object.keys(by).forEach(p => { lines.push([HZ.c, p, by[p].join("·")]); eq.add(p); });
      if(partners(HZ.c, 6).length) selfs.add(HZ.c);
    }else if(HZ.n === 6){ ORD.forEach(c => { selfs.add(c); eq.add(c); }); }
    else TAN_SYSTEMS[HZ.n].pairs.forEach(([a, b]) => { lines.push([a, b, ""]); eq.add(a); eq.add(b); });
    let g = '<circle cx="170" cy="170" r="125" fill="none" stroke="currentColor" stroke-opacity=".2"/>';
    const [f, rm, dm, pp] = ["F", "RM", "DM", "P"].map(pos);
    const seg = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, ux = dx / d * 21, uy = dy / d * 21;
      return "M" + (a[0] + ux) + " " + (a[1] + uy) + " L" + (b[0] - ux) + " " + (b[1] - uy); };
    g += '<path d="' + seg(f, rm) + " " + seg(rm, dm) + " " + seg(dm, pp) + '" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-dasharray="3 4"/>';
    const mid = [(rm[0] + dm[0]) / 2, (rm[1] + dm[1]) / 2], md = Math.hypot(mid[0] - 170, mid[1] - 170) || 1;
    g += '<text x="' + (mid[0] + (mid[0] - 170) / md * 34) + '" y="' + (mid[1] + (mid[1] - 170) / md * 34 + 3) + '" text-anchor="middle" class="balflow">YÍNG QÌ</text>';
    lines.forEach(([a, b, l]) => {
      const p1 = pos(a), p2 = pos(b);
      g += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="var(--shadow-color)" stroke-width="1.8"/>';
      // numéro du système sur le trait ; pour deux canaux voisins (trait trop court), il est posé juste à l'extérieur du cercle
      const longTrait = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > 70;
      if(l && (longTrait || (ORD.includes(a) && ORD.includes(b)))){
        let mx = p1[0] + (p2[0] - p1[0]) * .68, my = p1[1] + (p2[1] - p1[1]) * .68;
        if(!longTrait){ const cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2, dd = Math.hypot(cx - 170, cy - 170) || 1; mx = cx + (cx - 170) / dd * 32; my = cy + (cy - 170) / dd * 32; }
        g +='<rect x="' + (mx - 14) + '" y="' + (my - 8) + '" width="28" height="16" fill="var(--page-bg)" stroke="var(--shadow-color)"/>' +
          '<text x="' + mx + '" y="' + (my + 3.5) + '" text-anchor="middle" class="balsys">' + l + "</text>";
      }
    });
    selfs.forEach(c => {
      const [x, y] = pos(c), d = Math.hypot(x - 170, y - 170) || 1, cx = x + (x - 170) / d * 41, cy = y + (y - 170) / d * 41;
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="var(--page-bg)" stroke="var(--shadow-color)" stroke-width="1.8"/>' +
        '<text x="' + cx + '" y="' + (cy + 3.5) + '" text-anchor="middle" class="balsys">6</text>';
    });
    ALL.forEach(c => {
      const [x, y] = pos(c), mv = c === "RM" || c === "DM", off = !canal && mv && HZ.n !== 1, yin = YIN.has(c);
      g += '<g class="balnode' + (off ? " off" : "") + '" data-c="' + c + '"><title>' + esc(NAMES[c]) + "</title>";
      if(canal && c === HZ.c) g += '<circle cx="' + x + '" cy="' + y + '" r="27" fill="none" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="4 3"/>';
      if(eq.has(c)) g += '<circle cx="' + x + '" cy="' + y + '" r="22.5" fill="none" stroke="var(--shadow-color)" stroke-width="4"/>';
      g += '<circle cx="' + x + '" cy="' + y + '" r="18" fill="' + (yin ? ink(c) : "var(--page-bg)") + '" stroke="' + ink(c) + '" stroke-width="1.6"/>';
      g += '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" class="ballbl" style="fill:' + (yin ? "var(--page-bg)" : ink(c)) + '">' + esc(c) + "</text></g>";
    });
    let side;
    if(canal){
      side = '<div class="ballbltop">Les six connexions de</div><p class="balcase">' + chip(HZ.c) + ' <span class="balsm">' + esc(NAMES[HZ.c]) + '</span></p><ul class="balcov">' +
        NSYS.map(n => {
          const ps = partners(HZ.c, n);
          return "<li><b>" + n + "</b> <span>" + esc(TAN_SYSTEMS[n].name) + "</span> " +
            (n === 6 ? (ps.length ? '<span class="balsm">→ lui-même</span>' : '<span class="balsm">— pas pour ce canal</span>') : ps.length ? '<span class="balsm">→</span> ' + ps.map(go).join(" ") : '<span class="balsm">— pas pour ce canal</span>') + "</li>";
        }).join("") + "</ul>" +
        '<p class="balsm">Anneau rouge : le canal choisi. Anneau épais : ses partenaires. Numéro sur le trait : le système. Clique sur un canal pour passer à lui.</p>';
    }else{
      const s = TAN_SYSTEMS[HZ.n];
      side = '<div class="ballbltop">Système ' + HZ.n + '</div><p class="balcase">' + esc(s.name) + '</p><ul class="balcov">' +
        (s.self ? '<li><span class="balsm">Chaque canal s’équilibre lui-même (hors rèn mài et dū mài).</span></li>' : s.pairs.map(([a, b]) => "<li>" + go(a) + ' <span class="balsm">↔</span> ' + go(b) + "</li>").join("")) + "</ul>";
    }
    const modeBtn = (m, t) => '<button type="button" class="balmode' + (HZ.mode === m ? " on" : "") + '" data-mode="' + m + '">' + t + "</button>";
    main.innerHTML = '<div class="balbar">' +
      aide("Choisis un canal : ses six connexions, selon les six systèmes des canaux unis de Dr Tán, se tracent sur l’horloge, un trait par système avec son numéro (le 6 est le canal avec lui-même). Ou choisis un système pour voir toutes ses paires d’un coup : le système 4, par exemple, relie les canaux opposés sur l’horloge. Clique sur un canal du cercle, ou sur un partenaire dans la liste, pour passer à ce canal.") +
      '<span class="balmodes">' + modeBtn("canal", "Un canal à la fois") + modeBtn("systeme", "Un système à la fois") + "</span>" +
      '<span class="balmodes"><button type="button" class="balmode" id="halSvg" title="Une page A5 en noir et blanc : une ligne par canal, ses six connexions">Page à imprimer · SVG</button><button type="button" class="balmode" id="halPng" title="La même page en image PNG, 300 points par pouce">PNG</button></span>' +
      (canal ? "" : '<span class="balsysgrp" title="Systèmes">' + NSYS.map(n => '<button type="button" class="balsysbtn' + (HZ.n === n ? " on" : "") + '" data-n="' + n + '" title="Système ' + n + " : " + esc(TAN_SYSTEMS[n].name) + '">' + n + "</button>").join("") + "</span>") +
      '</div><div class="ballay"><svg class="balclock" viewBox="-40 -50 420 420" role="img" aria-label="Horloge chinoise des douze canaux">' + g + "</svg><div>" + side + "</div></div>";
    main.querySelectorAll(".balnode").forEach(n => n.addEventListener("click", () => { if(n.classList.contains("off")) return; HZ.c = n.dataset.c; HZ.mode = "canal"; renderHorloge(); }));
    main.querySelectorAll(".balgo").forEach(b => b.addEventListener("click", () => { HZ.c = b.dataset.c; HZ.mode = "canal"; renderHorloge(); }));
    main.querySelectorAll(".balmode[data-mode]").forEach(b => b.addEventListener("click", () => { HZ.mode = b.dataset.mode; renderHorloge(); }));
    main.querySelectorAll(".balsysbtn").forEach(b => b.addEventListener("click", () => { HZ.n = +b.dataset.n; renderHorloge(); }));
    document.getElementById("halSvg").addEventListener("click", () => saveFile(new Blob([pageImprimable()], {type:"image/svg+xml"}), "connexions-des-canaux.svg"));
    document.getElementById("halPng").addEventListener("click", () => { savePng().catch(() => {}); });
  }
  return {start:newCase, render, horloge:{start(){}, render:renderHorloge}};
};
