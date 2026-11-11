/* ============================================================
   celebrate.js
   Récompenses d'une bonne réponse, partagées par tous les jeux
   (jeu principal, Réseaux, Équilibrer, Trajets, Formules) :
   - la page s'éclaire d'un vert doux et diffus, qui monte puis s'efface ;
   - une petite vibration du téléphone (Android ; l'iPhone ne vibre pas depuis le web) ;
   - la série de bonnes réponses d'affilée : à 5, 10, 15… et au record battu,
     un mot discret s'affiche et la lueur est plus forte.
   - un son de jeu vidéo doux, dans une même tonalité pendant la session (réussites en majeur, erreurs en mineur) ;
   - l'objectif du jour : 20 bonnes réponses, tous jeux confondus (mtcDailyGoal) ;
   Réglages → Sons et vibration : mtc_fx_sound / mtc_fx_vibrate ("0" = coupé).
   window.mtcCelebrate(force) : bonne réponse (force 2 = sans-faute plus intense).
   window.mtcMiss() : réponse fausse, la série repart de zéro.
   window.mtcAnnounce(titre, détail) : un mot discret au milieu de l'écran (paliers…).
   ============================================================ */
(function(){
  "use strict";
  if(window.mtcCelebrate) return;
  const BEST = "mtc_streak_best", GOAL = 20, DAY = "mtc_daily_goal_v1";
  const pref = k => { try{ return localStorage.getItem(k) !== "0"; }catch(e){ return true; } };
  // sons de jeu vidéo synthétisés (pas de fichier) : sinusoïdes et triangles, attaque immédiate, un peu de réverbération.
  // Une tonalité tirée au début de la session (gardée d'une page à l'autre) ; chaque son prend une variante au hasard :
  // petite réussite (4 variantes, majeur), grande réussite — série, palier, record, objectif du jour (3 variantes, majeur),
  // erreur (4 variantes, mineur, sur la même note de base). Un seul son à la fois : le précédent s'éteint en douceur.
  let ac = null, out = null, rev = null, bus = null, lastAt = 0, lastKind = "";
  const KEY = (() => {
    try{ const k = sessionStorage.getItem("mtc_fx_key"); if(k != null) return +k; }catch(e){}
    const k = [0, 2, 3, 5, 7, -2, -4][Math.floor(Math.random() * 7)];
    try{ sessionStorage.setItem("mtc_fx_key", String(k)); }catch(e){}
    return k;
  })();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function audio(){
    if(!ac){
      // téléphone : tampon audio plus grand (pas de craquements), volume général plus bas et limiteur (pas de saturation),
      // écho léger fait d'un simple retard (la réverbération par convolution coûtait trop au processeur)
      const AC = window.AudioContext || window.webkitAudioContext;
      try{ ac = new AC({latencyHint:"playback"}); }catch(e){ ac = new AC(); }
      const lim = ac.createDynamicsCompressor();
      lim.threshold.value = -14; lim.knee.value = 8; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .2;
      lim.connect(ac.destination);
      out = ac.createGain(); out.gain.value = .5; out.connect(lim);
      rev = ac.createDelay(1); rev.delayTime.value = .13;
      const fb = ac.createGain(), wet = ac.createGain(), tone = ac.createBiquadFilter();
      fb.gain.value = .28; wet.gain.value = .22; tone.type = "lowpass"; tone.frequency.value = 2400;
      // appareils modestes (peu de mémoire ou de cœurs) : pas d'écho du tout, le son reste sec
      const low = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      if(!low){ rev.connect(tone); tone.connect(fb); fb.connect(rev); tone.connect(wet); wet.connect(out); }
    }
    if(ac.state === "suspended") ac.resume();
    return ac;
  }
  function note(m, t0, dur, o){
    o = o || {};
    const a = ac, t = a.currentTime + t0, f = 440 * Math.pow(2, (m - 69) / 12), vol = o.vol || .16;
    const voice = (freq, v, d) => {
      const s = a.createOscillator(), g = a.createGain();
      s.type = o.type && freq === f ? o.type : "sine"; s.frequency.setValueAtTime(freq, t);
      if(o.glide) s.frequency.exponentialRampToValueAtTime(freq * Math.pow(2, o.glide / 12), t + d * .8);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01);
      g.gain.exponentialRampToValueAtTime(v * .35, t + Math.min(.12, d * .4)); g.gain.exponentialRampToValueAtTime(.0005, t + d);
      s.connect(g); g.connect(bus); s.start(t); s.stop(t + d + .05);
    };
    voice(f, vol, dur);
    if(o.oct) voice(f * 2, vol * .18, dur * .6);
  }
  const SOUNDS = {
    good: [
      b => [0, 4, 7].forEach((x, j) => note(b + x, j * .055, .42, {oct:1, vol:.14})),
      b => { note(b, 0, .18, {oct:1}); note(b + 12, .09, .5, {oct:1, vol:.13}); },
      b => note(b, 0, .32, {glide:7, oct:1, vol:.16}),
      b => [7, 4, 12].forEach((x, j) => note(b + x, j * .07, .5, {type:"triangle", vol:.1}))
    ],
    big: [
      b => { [0, 4, 7].forEach((x, j) => note(b + x, j * .07, .2, {oct:1, vol:.13})); [0, 4, 7, 12].forEach(x => note(b + x, .24, .9, {oct:1, vol:.09})); },
      b => { [0, 2, 4, 5, 7, 9, 11, 12].forEach((x, j) => note(b + x, j * .04, .18, {vol:.1, type:"triangle"})); [12, 16, 19].forEach(x => note(b + x, .36, .8, {oct:1, vol:.1})); },
      b => [[0, 4, 7], [5, 9, 12], [7, 11, 14], [12, 16, 19]].forEach((c, j) => c.forEach(x => note(b + x, j * .13, j === 3 ? .95 : .16, {oct:j === 3 ? 1 : 0, vol:j === 3 ? .09 : .08})))
    ],
    miss: [
      b => { note(b + 3, 0, .22, {type:"triangle", vol:.16}); note(b, .16, .55, {type:"triangle", vol:.16}); },
      b => note(b + 5, 0, .6, {glide:-7, type:"triangle", vol:.17}),
      b => [0, 3, 7].forEach(x => note(b - 12 + x, 0, .65, {vol:.11, glide:-1})),
      b => { note(b + 1, 0, .2, {vol:.15}); note(b - 6, .18, .6, {vol:.15, type:"triangle"}); }
    ]
  };
  const BASE = {good:72, big:67, miss:60};
  function play(kind){
    if(!pref("mtc_fx_sound")) return;
    try{
      const a = audio(), now = performance.now();
      const set = kind === "good" || kind === "miss" ? kind : "big";   // série, palier, record, objectif : grande réussite
      // même son déclenché plusieurs fois coup sur coup : on ne le rejoue pas
      if(set === lastKind && now - lastAt < 400) return;
      lastKind = set; lastAt = now;
      if(bus){ const old = bus; old.gain.setTargetAtTime(0, a.currentTime, .03); setTimeout(() => { try{ old.disconnect(); }catch(e){} }, 400); }
      bus = a.createGain(); bus.gain.value = 1; bus.connect(out); bus.connect(rev);
      pick(SOUNDS[set])(BASE[set] + KEY);
    }catch(e){}
  }
  // petite bonne réponse (une case, un système, un canal…) : son et courte vibration, chacun réglable (Réglages → Sons et vibration)
  window.mtcPlayFx = function(kind){
    play(kind);
    if(kind === "good" && navigator.vibrate && pref("mtc_fx_vibrate")) try{ navigator.vibrate(15); }catch(e){}
  };
  // objectif du jour : bonnes réponses comptées par date, tous jeux confondus
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function dayCount(add){
    let o = {};
    try{ o = JSON.parse(localStorage.getItem(DAY) || "{}"); }catch(e){}
    if(o.d !== today()) o = {d:today(), n:0};
    if(add){ o.n++; try{ localStorage.setItem(DAY, JSON.stringify(o)); }catch(e){} }
    return o.n;
  }
  window.mtcDailyGoal = () => ({done:dayCount(false), goal:GOAL});
  const css =
    ".mtc-glow{ position:fixed; inset:0; pointer-events:none; z-index:2147483000; opacity:0;" +
    " background:radial-gradient(ellipse 75% 70% at 50% 45%, rgba(52,178,96,.10) 0%, rgba(52,178,96,.20) 55%, rgba(40,160,84,.42) 100%); }" +
    ".mtc-glow.go{ animation:mtcGlow 1.7s ease-out forwards; }" +
    ".mtc-glow.big{ animation:mtcGlowBig 2.6s ease-out forwards; }" +
    "@keyframes mtcGlow{ 0%{ opacity:0; } 22%{ opacity:.75; } 100%{ opacity:0; } }" +
    "@keyframes mtcGlowBig{ 0%{ opacity:0; } 18%{ opacity:1; } 45%{ opacity:.8; } 100%{ opacity:0; } }" +
    ".mtc-streak{ position:fixed; left:50%; top:38%; transform:translate(-50%, -50%); pointer-events:none; z-index:2147483001; opacity:0;" +
    " font:italic 400 clamp(1.4rem, 5vw, 2.1rem) 'Libre Baskerville', Georgia, serif; color:#1a8a3a; text-align:center; white-space:nowrap;" +
    " text-shadow:0 0 18px rgba(255,255,255,.9), 0 0 2px rgba(255,255,255,.9); }" +
    ".mtc-streak small{ display:block; font:700 .72rem 'Archivo', sans-serif; letter-spacing:.12em; text-transform:uppercase; font-style:normal; margin-top:4px; }" +
    ".mtc-streak.go{ animation:mtcStreak 2.4s ease-out forwards; }" +
    ".mtc-bounce{ animation:mtcBounce .55s cubic-bezier(.3,1.6,.5,1); }" +
    "g.mtc-bounce, svg .mtc-bounce{ transform-box:fill-box; transform-origin:center; }" +
    "@keyframes mtcBounce{ 0%{ transform:scale(1); } 45%{ transform:scale(1.22); } 100%{ transform:scale(1); } }" +
    ".mtc-grain{ position:fixed; inset:0; pointer-events:none; z-index:2147482999; mix-blend-mode:overlay; opacity:.18; background-size:180px 180px;" +
    " -webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%, transparent 78%, #000 100%); mask-image:radial-gradient(ellipse 50% 50% at 50% 50%, transparent 78%, #000 100%); }" +
    ".mtc-goalbar{ position:absolute; left:0; right:0; bottom:0; height:3px; pointer-events:none; z-index:2; background:rgba(26,138,58,.12); }" +
    ".mtc-goalbar i{ display:block; height:100%; width:0; background:#1a8a3a; transition:width 1s cubic-bezier(.2,.8,.2,1); }" +
    ".mtc-goalbar.top{ position:fixed; top:0; bottom:auto; z-index:9800; }" +
    ".mtc-goalbar.full i{ background:#1a8a3a; box-shadow:0 0 6px rgba(26,138,58,.6); }" +
    ".mtc-goalbar b{ position:absolute; right:10px; top:7px; font:700 .7rem 'Archivo', sans-serif; letter-spacing:.06em; color:#1a8a3a; opacity:0; transition:opacity .4s; white-space:nowrap; background:var(--page-bg, #fcfcfa); padding:1px 6px; border-radius:3px; }" +
    ".mtc-goalbar.show b{ opacity:1; }" +
    "@keyframes mtcStreak{ 0%{ opacity:0; transform:translate(-50%, -40%); } 15%{ opacity:1; transform:translate(-50%, -50%); } 70%{ opacity:1; } 100%{ opacity:0; transform:translate(-50%, -62%); } }";
  let glow = null, word = null, streak = 0, recordShown = false;
  const best = () => { try{ return +localStorage.getItem(BEST) || 0; }catch(e){ return 0; } };
  function ensure(){
    if(glow && glow.isConnected) return;
    if(!document.getElementById("mtcGlowStyle")){
      const st = document.createElement("style"); st.id = "mtcGlowStyle"; st.textContent = css;
      (document.head || document.documentElement).appendChild(st);
    }
    const host = document.body || document.documentElement;
    glow = document.createElement("div"); glow.className = "mtc-glow"; glow.setAttribute("aria-hidden", "true"); host.appendChild(glow);
    word = document.createElement("div"); word.className = "mtc-streak"; word.setAttribute("aria-live", "polite"); host.appendChild(word);
  }
  // objectif du jour : un fin trait vert le long du bas de la barre du haut, qui se remplit ; « 7 / 20 » s'affiche quand il avance
  let goalEl = null, goalTimer = 0;
  function drawGoal(flash){
    try{
      ensure();
      if(!goalEl || !goalEl.isConnected){
        const host = document.querySelector(".topbar") || document.querySelector("body > header");
        goalEl = document.createElement("div"); goalEl.className = "mtc-goalbar"; goalEl.innerHTML = "<i></i><b></b>";
        if(host && host.getBoundingClientRect().height < 150 && !document.getElementById("netToggle")){
          if(getComputedStyle(host).position === "static") host.style.position = "relative";
          host.appendChild(goalEl);
        }else{ goalEl.classList.add("top"); document.body.appendChild(goalEl); }
      }
      const n = dayCount(false), w = Math.min(100, n / GOAL * 100);
      goalEl.title = "Objectif du jour : " + Math.min(n, GOAL) + " / " + GOAL + " bonnes réponses, tous jeux confondus";
      goalEl.querySelector("b").textContent = n >= GOAL ? "objectif du jour atteint" : "objectif du jour · " + n + " / " + GOAL;
      goalEl.classList.toggle("full", n >= GOAL);
      requestAnimationFrame(() => requestAnimationFrame(() => { goalEl.querySelector("i").style.width = w + "%"; }));
      if(flash){ goalEl.classList.add("show"); clearTimeout(goalTimer); goalTimer = setTimeout(() => goalEl.classList.remove("show"), 2200); }
    }catch(e){}
  }
  window.mtcDrawGoal = drawGoal;
  // bonne réponse : l'élément trouvé rebondit (case, système, canal, membre, groupe…)
  window.mtcBounce = function(el){
    try{ ensure(); if(!el) return; el.classList.remove("mtc-bounce"); void el.getBoundingClientRect(); el.classList.add("mtc-bounce");
      setTimeout(() => el.classList.remove("mtc-bounce"), 600); }catch(e){}
  };
  // grain de papier photo, très léger, sur les ombres et les halos (mélange « overlay » : le blanc reste blanc, le noir reste noir)
  function addGrain(){
    try{
      const low = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      if(low || document.querySelector(".mtc-grain") || !document.body) return;
      ensure();
      const c = document.createElement("canvas"); c.width = c.height = 180;
      const x = c.getContext("2d"), d = x.createImageData(180, 180);
      for(let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      const g = document.createElement("div"); g.className = "mtc-grain"; g.setAttribute("aria-hidden", "true");
      g.style.backgroundImage = "url(" + c.toDataURL() + ")";
      document.body.appendChild(g);
    }catch(e){}
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", addGrain); else addGrain();
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => drawGoal(false)); else drawGoal(false);
  const replay = (el, cls) => { el.classList.remove("go", "big"); void el.offsetWidth; el.classList.add(cls); };
  function say(html){ word.innerHTML = html; replay(word, "go"); }
  // opts.count === false : lueur, son et vibration seulement (ne compte ni dans la série ni dans l'objectif du jour)
  window.mtcCelebrate = function(force, opts){
    try{
      ensure();
      if(opts && opts.count === false){
        replay(glow, force >= 2 ? "big" : "go"); play(force >= 2 ? "serie" : "good");
        if(navigator.vibrate && pref("mtc_fx_vibrate")) navigator.vibrate(force >= 2 ? [25, 70, 25] : 20);
        return;
      }
      streak++;
      let strong = force >= 2, fx = "good";
      const b = best();
      if(streak > b){
        try{ localStorage.setItem(BEST, String(streak)); }catch(e){}
        // record battu : annoncé une fois par série, et seulement au-delà d'un petit record
        if(b >= 5 && !recordShown){ recordShown = true; strong = true; fx = "palier"; say("Nouveau record<small>" + streak + " d’affilée</small>"); }
      }
      if(streak % 5 === 0 && !(recordShown && streak === b + 1)){ strong = true; fx = "serie"; say("Série de " + streak + "<small>bonnes réponses d’affilée</small>"); }
      const n = dayCount(true);
      if(n === GOAL){ strong = true; fx = "objectif"; say("Objectif du jour atteint<small>" + GOAL + " bonnes réponses</small>"); }
      replay(glow, strong ? "big" : "go");
      play(fx);
      if(navigator.vibrate && pref("mtc_fx_vibrate")) navigator.vibrate(strong ? [25, 70, 25] : 20);
      drawGoal(true);
      document.dispatchEvent(new CustomEvent("mtc-good", {detail:{streak, day:n, goal:GOAL}}));
    }catch(error){}
  };
  window.mtcMiss = function(){ streak = 0; recordShown = false; play("miss"); };
  window.mtcAnnounce = function(title, detail){ try{ ensure(); say(title + (detail ? "<small>" + detail + "</small>" : "")); replay(glow, "big"); play("palier"); }catch(e){} };
  window.mtcStreak = () => ({current:streak, best:best()});

  // jeu principal : un groupe trouvé par læ joueur·se (pas les solutions révélées en fin de partie) ; une erreur casse la série
  function hookMainGame(){
    const orig = window.solveGroup;
    if(typeof orig === "function" && !orig.__mtcGlow){
      const wrapped = function(group){
        const by = group && group._solvedBy;
        const res = orig.apply(this, arguments);
        if(by === "points" || by === "final"){ window.mtcCelebrate(1); const rows = document.querySelectorAll(".solved-row"); window.mtcBounce(rows[rows.length - 1]); }
        return res;
      };
      wrapped.__mtcGlow = true;
      window.solveGroup = wrapped;
    }
    const miss = window.mtcRecordMistake;
    if(typeof miss === "function" && !miss.__mtcGlow){
      const w = function(detail){
        window.mtcMiss();
        const res = miss.apply(this, arguments);
        // combinaison fausse, mais 3 points sur 4 appartiennent au même groupe : on le dit tout de suite
        try{
          const pts = detail && detail.points, sol = typeof solution !== "undefined" ? solution : null;
          if(detail && detail.reason === "wrong-combo" && pts && sol && sol.some(g => !g.solved && pts.filter(p => g.points.includes(p)).length === 3)){
            setTimeout(() => { const m = document.getElementById("message"); if(m && !/Presque/.test(m.textContent)) m.textContent = "Presque : 3 points sur 4 vont ensemble. " + m.textContent; }, 0);
          }
        }catch(e){}
        return res;
      };
      w.__mtcGlow = true;
      window.mtcRecordMistake = w;
    }
  }
  if(document.readyState === "complete") hookMainGame(); else window.addEventListener("load", hookMainGame);
})();
