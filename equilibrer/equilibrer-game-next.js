// Jeu « Équilibrer », partagé par equilibrer/index.html et le module Réseaux (circuits/index.html).
// mtcEquilibrer(main) renvoie {start, render} : start tire un nouveau cas, render dessine le jeu dans main.
window.mtcEquilibrer = function(main){
  "use strict";
  // Jeu « Équilibrer » : des canaux sont atteints ; choisir le moins de canaux équilibrants possible selon les six
  // systèmes des canaux unis de Dr Richard Tán (cours « Les six systèmes des canaux unis »). Horloge chinoise des douze
  // canaux ; rèn mài et dū mài hors de l'horloge, sur le passage du yíng qì (F → RM → DM → P), seulement pour le
  // système 1. Un canal atteint peut en équilibrer un autre (pas lui-même).
  // explications du jeu rangées derrière un « ? » (ouvert ou fermé : le choix reste d'un jeu à l'autre)
  const aide = html => '<details class="aide"' + (window.mtcAideOpen ? " open" : "") + '><summary title="Explications" aria-label="Explications">?</summary><p class="src">' + html + "</p></details>";
  main.addEventListener("toggle", e => { if(e.target.classList && e.target.classList.contains("aide")) window.mtcAideOpen = e.target.open; }, true);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const TAN_SYSTEMS = {
    1:{name:"grands canaux de même nom (tóng míng)", pairs:[["P", "Rt"], ["GI", "E"], ["C", "Rn"], ["IG", "V"], ["EC", "F"], ["TF", "VB"], ["DM", "RM"]]},
    2:{name:"six couches (zàng fǔ bié tōng)", pairs:[["P", "V"], ["GI", "F"], ["E", "EC"], ["Rt", "IG"], ["C", "VB"], ["Rn", "TF"]]},
    3:{name:"biǎo / lǐ (surface / interne)", pairs:[["P", "GI"], ["E", "Rt"], ["C", "IG"], ["V", "Rn"], ["EC", "TF"], ["VB", "F"]]},
    4:{name:"horloge opposée (zǐ wǔ)", pairs:[["P", "V"], ["GI", "Rn"], ["E", "EC"], ["Rt", "TF"], ["C", "VB"], ["IG", "F"]]},
    5:{name:"canaux voisins sur l’horloge (liú zhù)", pairs:[["P", "F"], ["GI", "E"], ["Rt", "C"], ["IG", "V"], ["Rn", "EC"], ["TF", "VB"]]}
  };
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
  const B = {on:new Set([1, 2, 3, 4, 5]), aff:[], pick:new Set(), done:false, hint:false, score:0, played:0, lvl:1, sols:[], view:-1};
  try{ const s = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("mtc_trajets_balance") || "{}"); if(Array.isArray(s.on) && s.on.length) B.on = new Set(s.on); B.hint = !!s.hint; B.score = s.score || 0; B.played = s.played || 0;
    if(Number.isInteger(s.lvl)) B.lvl = Math.max(0, Math.min(LEVELS.length - 1, s.lvl)); }catch(e){}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify({on:[...B.on], hint:B.hint, score:B.score, played:B.played, lvl:B.lvl})); }catch(e){} };
  const lvlTxt = i => "Niveau " + (i + 1) + " · " + LEVELS[i] + " canaux atteints";
  const links = (b, a) => b === a ? [] : [...B.on].filter(n => TAN_SYSTEMS[n].pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
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
        (by.length ? ' <span class="balsm">équilibré par</span> ' + by.map(([b, l]) => chip(b) + ' <span class="balsm">(syst. ' + l.join(", ") + ")</span>").join(", ") : ' <span class="balsm">pas encore équilibré</span>') + "</li>";
    }).join("");
    const table = '<details class="balsyst"><summary>Rappel : les cinq systèmes</summary><table><tr><th>Système</th><th>Paires de canaux</th></tr>' +
      Object.entries(TAN_SYSTEMS).map(([n, s]) => "<tr><td><b>" + n + "</b> · " + esc(s.name) + "</td><td>" + s.pairs.map(([a, b]) => chip(a) + "–" + chip(b)).join(" · ") + "</td></tr>").join("") +
      "<tr><td><b>6</b> · même canal (zì jǐ)</td><td>le canal se rééquilibre lui-même : pas utilisé dans ce jeu</td></tr></table></details>";
    main.innerHTML =
      '<div class="balbar">' +
      aide('Des canaux sont atteints : clique sur le moins de canaux possible pour les rééquilibrer tous, selon les six systèmes des canaux unis de Dr Tán. Un canal atteint peut en équilibrer un autre. Rèn mài et dū mài ne comptent que pour le système 1.<br>Les boutons 1 à 5 choisissent les systèmes. « Indices » affiche sur chaque canal le nombre de canaux atteints qu’il équilibre. Après la vérification, clique sur une solution pour la voir sur le cercle.') +
      '<span class="balsysgrp" title="Systèmes">' + [1, 2, 3, 4, 5].map(n => '<button type="button" class="balsysbtn' + (B.on.has(n) ? " on" : "") + '" data-n="' + n + '" title="Système ' + n + " : " + esc(TAN_SYSTEMS[n].name) + '">' + n + "</button>").join("") + "</span>" +
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
      if(B.pick.size === k){ B.head = '<span class="balok">' + praise() + "</span>"; B.solLbl = "Autres solutions possibles"; B.sols = others.slice(0, 8); }
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
    const fmt = s => s.map(b => chip(b) + ' <span class="balsm">(→ ' + B.aff.filter(x => links(b, x).length).map(x => esc(x) + " syst. " + links(b, x).join(", ")).join(" ; ") + ")</span>").join(" + ");
    return B.head + (B.sols.length ? '<br><span class="balsm">' + B.solLbl + " — clique pour voir sur le cercle :</span>" +
      B.sols.map((s, i) => '<button type="button" class="balsol' + (B.view === i ? " on" : "") + '" data-i="' + i + '">' + fmt(s) + "</button>").join("") : "");
  }
  return {start:newCase, render};
};
