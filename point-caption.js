/* ============================================================
   point-caption.js
   Jeu principal (grille) : le dernier point (ou la dernière substance)
   choisi s'affiche quelques secondes en bas de l'écran — code, pinyin,
   nom français. En mode audio, après le nom chinois, le nom français est
   lu à voix haute. Quand le choix déclenche une félicitation (groupe
   trouvé, grille résolue), elle passe d'abord : les noms viennent après.
   Réglages → « Nom du point choisi » : affichage (mtc_point_caption, "0" = coupé) et
   voix en mode audio (mtc_point_voice : "zh" nom chinois, "fr" nom français, "both" les deux).
   ============================================================ */
(function(){
  "use strict";
  const on = k => { try{ return localStorage.getItem(k) !== "0"; }catch(e){ return true; } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const pharma = () => document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  const norm = s => String(s || "").replace(/[^㐀-鿿]/g, "");

  // point ou substance d'après son nom chinois (le jeu ne transmet que le hanzi au lecteur audio)
  let byHanzi = null, byHanziPharma = null;
  function find(hanzi){
    const h = norm(hanzi); if(!h) return null;
    if(pharma()){
      if(!byHanziPharma){ byHanziPharma = {}; (window.PHARMA_HERBS || []).forEach(x => { const k = norm(x.hanzi); if(k && !byHanziPharma[k]) byHanziPharma[k] = x; }); }
      const x = byHanziPharma[h];
      return x ? {code:"", pinyin:x.pinyin || x.pinyinSansTons || "", fr:x.nom || ""} : null;
    }
    if(!byHanzi){ byHanzi = {}; const P = window.POINT_DETAILS || {}; Object.keys(P).forEach(id => { const k = norm(P[id].hanzi); if(k && !byHanzi[k]) byHanzi[k] = id; }); }
    const id = byHanzi[h]; if(!id) return null;
    const d = (window.POINT_DETAILS || {})[id] || {};
    return {code:String(id).replace(/^([A-Za-zÀ-ÿ]+)\s*(\d+)$/, "$1 $2"), pinyin:d.pinyin || "", fr:d.nom_francais || ""};
  }

  // pinyin coloré selon les tons, comme dans les fiches
  function pyHtml(t){ try{ if(typeof colorizePinyin === "function") return colorizePinyin(t); }catch(e){} return esc(t); }
  let box = null, hideTimer = 0;
  function show(info){
    if(!on("mtc_point_caption") || !info) return;
    if(!document.getElementById("mtcPointCaptionStyle")){
      const st = document.createElement("style"); st.id = "mtcPointCaptionStyle";
      st.textContent = "#mtcPointCaption{ position:fixed; left:50%; bottom:76px; transform:translate(-50%, 10px); z-index:8000; pointer-events:none; opacity:0; max-width:calc(100vw - 32px);" +
        // comme un sous-titre : pas de fond, juste le texte, détaché de la grille par un léger halo de la couleur du fond
        " color:var(--text-color, #271629); padding:2px 8px; text-align:center; text-shadow:0 0 3px var(--page-bg, #fcfcfa), 0 0 8px var(--page-bg, #fcfcfa), 0 0 14px var(--page-bg, #fcfcfa);" +
        " transition:opacity .3s, transform .3s; font-family:'Libre Baskerville', Georgia, serif; }" +
        "#mtcPointCaption.on{ opacity:1; transform:translate(-50%, 0); }" +
        "#mtcPointCaption b{ font:800 1rem 'Archivo', sans-serif; margin-right:6px; } #mtcPointCaption .py{ font-size:1rem; }" +
        "#mtcPointCaption i{ display:block; font-size:.88rem; opacity:.8; }";
      document.head.appendChild(st);
    }
    if(!box){ box = document.createElement("div"); box.id = "mtcPointCaption"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    box.innerHTML = (info.code ? "<b>" + esc(info.code) + "</b>" : "") + '<span class="py">' + pyHtml(info.pinyin) + "</span>" + (info.fr ? "<i>" + esc(info.fr) + "</i>" : "");
    box.classList.add("on");
    clearTimeout(hideTimer); hideTimer = setTimeout(() => box.classList.remove("on"), 3800);
  }
  // Les mots chinois des noms français (lǐ, qì, shāng…) sont réécrits pour que la voix française les dise
  // à peu près comme en chinois, au lieu d'épeler « l » ou de lire « kui ».
  const PY_FR = {li:"lie", qi:"tchi", shang:"chang", ding:"dingue", yin:"yine", yang:"yang", shou:"cheou", shao:"chao", fu:"fou", shu:"chou",
    xi:"si", luo:"louo", du:"dou", mai:"maï", po:"po", yi:"yi", hun:"houn", zhi:"dji", kunlun:"kouenlouenne", qiao:"tchiao", shen:"chenne",
    zu:"dzou", hua:"houa", tuo:"touo", bei:"beï"};
  const FR_WORDS = /^(où|à|là|déjà|voilà|çà)$/i;
  const TONED = /[āáǎēěīíǐìōóǒòūúǔǖǘǚǜ]|[àù]/i;
  function frSay(text){
    // crochets retirés, variantes « a/b » et lignes lues comme une énumération
    text = String(text).replace(/[\[\]]/g, "").replace(/\s*[\/\n]+\s*/g, ", ").replace(/\s+/g, " ").trim();
    return String(text).replace(/[A-Za-zÀ-ÿĀ-ſǍ-ǜ]+/g, w => {
      if(FR_WORDS.test(w)) return w;
      const k = w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const isPy = TONED.test(w) || /^qi$/i.test(w) || (/[^a-z]/i.test(w) && PY_FR[k]);
      if(!isPy) return w;
      return PY_FR[k] || k.replace(/^zh/, "dj").replace(/^sh/, "ch").replace(/^x/, "s").replace(/^q/, "tch").replace(/u/g, "ou");
    }).replace(/[\s.,;:!?…]+$/, "") + ".";   // un point final : la voix se pose au lieu de remonter
  }
  // Noms enregistrés à l'avance avec la voix Denise (audio-fr/, liste dans audio-fr/liste.js, refaite par
  // tools/voix-fr.py) : fichier nommé d'après une empreinte du texte lu.
  function frKey(said){
    let h = 0x811c9dc5;
    for(const b of new TextEncoder().encode(said)){ h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  let ctx = null;
  const buffers = new Map();
  function audioCtx(){
    if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; if(AC){ try{ ctx = new AC(); }catch(e){} } }
    return ctx;
  }
  // le téléphone ne laisse jouer le son qu'après un toucher : on réveille le lecteur à chaque toucher
  window.addEventListener("pointerdown", () => { const c = audioCtx(); if(c && c.state !== "running") c.resume().catch(() => {}); }, {capture:true, passive:true});
  function loadFr(key){
    if(!buffers.has(key)){
      const c = audioCtx();
      buffers.set(key, !c ? Promise.reject() : fetch("audio-fr/" + key + ".mp3").then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); })
        .then(ab => new Promise((ok, ko) => c.decodeAudioData(ab, ok, ko))));
      buffers.get(key).catch(() => buffers.delete(key));
    }
    return buffers.get(key);
  }
  let src = null;
  function playRecorded(key){
    return loadFr(key).then(buf => {
      const c = audioCtx(); if(!c) throw 0;
      try{ if(src) src.stop(); }catch(e){}
      src = c.createBufferSource(); src.buffer = buf;
      // même force que le nom chinois (fichiers chinois plus forts, joués à 0,42)
      const g = c.createGain(); g.gain.value = .7; src.connect(g); g.connect(c.destination); src.start();
    });
  }
  // nom français lu après le nom chinois : l'enregistrement s'il existe, sinon la synthèse vocale de l'appareil
  let sayTimer = 0;
  function sayFrench(text, delay){
    clearTimeout(sayTimer);
    if(!text) return;
    const said = frSay(text), key = frKey(said);
    const rec = (window.MTC_FR_AUDIO || "").indexOf(key) >= 0;
    if(rec) loadFr(key).catch(() => {});   // préchargé pendant le nom chinois
    sayTimer = setTimeout(() => {
      if(rec) playRecorded(key).catch(() => speak(said)); else speak(said);
    }, delay);
  }
  function speak(said){
      if(!("speechSynthesis" in window)) return;
      try{
        const u = new SpeechSynthesisUtterance(said);
        u.lang = "fr-FR"; u.rate = .95; u.pitch = .95; u.volume = .6;
        // la voix la plus naturelle disponible sur l'appareil (voix neuronales, premium, Siri, Google), en français de France
        const score = x => (/natural|neural|premium|enhanced|amélioré|siri/i.test(x.name) ? 8 : 0) + (/online|google/i.test(x.name) ? 4 : 0) +
          (/^fr[-_]FR/i.test(x.lang) ? 2 : 0) + (/julie|denise|amélie|audrey|thomas/i.test(x.name) ? 1 : 0);
        const v = (window.speechSynthesis.getVoices() || []).filter(x => /^fr/i.test(x.lang)).sort((a, b) => score(b) - score(a))[0];
        if(v) u.voice = v;
        window.speechSynthesis.speak(u);
      }catch(e){}
  }

  function hook(){
    const orig = window.mtcAudioModePlayHanzi;
    if(typeof orig !== "function" || orig.__mtcCaption) return;
    const w = function(hanzi){
      const args = arguments, self = this;
      // un court instant pour savoir si ce choix déclenche une félicitation : elle passe d'abord
      setTimeout(() => {
        const wait = Math.max(0, (window.mtcFxEndsAt || 0) - performance.now());
        setTimeout(() => {
          const info = find(hanzi);
          show(info);
          let voice = "both"; try{ voice = localStorage.getItem("mtc_point_voice") || "both"; }catch(e){}
          const audio = typeof window.isMtcAudioModeEnabled === "function" && window.isMtcAudioModeEnabled();
          // nom chinois (sauf si on ne veut que le français), puis nom français (sauf si on ne veut que le chinois)
          let played = false;
          if(voice !== "fr"){ try{ played = orig.apply(self, args); }catch(e){} }
          if(audio && voice !== "zh" && info && info.fr) sayFrench(info.fr, played ? 1300 : 0);
        }, wait);
      }, 60);
      return true;
    };
    w.__mtcCaption = true;
    window.mtcAudioModePlayHanzi = w;
  }
  if(document.readyState === "complete") hook(); else window.addEventListener("load", () => setTimeout(hook, 0));
})();
