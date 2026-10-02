/* ============================================================
   beta-tour.js
   Petit tutoriel pas à pas pour les modules bêta : une bulle
   pointe chaque option (élément surligné), Précédent / Suivant /
   Passer. Montré une fois (clé dans localStorage), rejouable avec
   le bouton « ? ».
   mtcTour(steps, {key, force})
   step = {sel:"#id", title:"…", text:"…", before:() => {…}}
   ============================================================ */
(function(){
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  let state = null;

  function style(){
    if(document.getElementById("mtcTourStyle")) return;
    const s = document.createElement("style");
    s.id = "mtcTourStyle";
    s.textContent = `
.mtc-tour-ring{ position:fixed; z-index:1100; border:3px solid #ffd84d; border-radius:12px; box-shadow:0 0 0 9999px rgba(20,18,40,.38); pointer-events:none; transition:all .2s ease; }
.mtc-tour-bubble{ position:fixed; z-index:1101; width:min(360px, calc(100vw - 24px)); background:#fff; color:#111; border-radius:14px; padding:14px 16px 12px; box-shadow:0 10px 32px rgba(0,0,0,.28); font:14.5px/1.55 "Archivo", system-ui, sans-serif; }
.mtc-tour-bubble h3{ margin:0 0 6px; font-size:1.02rem; color:#2b2bff; }
.mtc-tour-bubble p{ margin:0 0 6px; }
.mtc-tour-bubble .nav{ display:flex; align-items:center; gap:6px; margin-top:10px; }
.mtc-tour-bubble .count{ font-size:12px; color:#777; margin-right:auto; }
.mtc-tour-bubble button{ font:inherit; font-size:13px; font-weight:700; border:1px solid #ccd; background:#fff; color:#111; border-radius:999px; padding:4px 12px; cursor:pointer; }
.mtc-tour-bubble button.go{ background:#2b2bff; border-color:#2b2bff; color:#fff; }
@media (prefers-reduced-motion: reduce){ .mtc-tour-ring{ transition:none; } }
`;
    document.head.appendChild(s);
  }
  function close(){
    if(!state) return;
    state.ring.remove(); state.bubble.remove();
    window.removeEventListener("resize", place); window.removeEventListener("keydown", onKey, true);
    try{ localStorage.setItem(state.key, "1"); }catch(e){}
    state = null;
  }
  function onKey(e){
    if(!state) return;
    if(e.key === "Escape"){ e.preventDefault(); close(); }
    else if(e.key === "ArrowRight" || e.key === "Enter"){ e.preventDefault(); go(1); }
    else if(e.key === "ArrowLeft"){ e.preventDefault(); go(-1); }
  }
  function target(){
    const st = state.steps[state.i];
    const sel = typeof st.sel === "function" ? st.sel() : st.sel;
    const el = sel ? document.querySelector(sel) : null;
    return el && el.getClientRects().length ? el : null;
  }
  function place(){
    if(!state) return;
    const el = target(), b = state.bubble, r = state.ring;
    if(!el){
      r.style.cssText = "left:50%;top:50%;width:0;height:0;";
      b.style.left = Math.max(12, (innerWidth - b.offsetWidth) / 2) + "px";
      b.style.top = Math.max(12, (innerHeight - b.offsetHeight) / 2) + "px";
      return;
    }
    const q = el.getBoundingClientRect(), pad = 6;
    r.style.cssText = "left:" + (q.left - pad) + "px;top:" + (q.top - pad) + "px;width:" + (q.width + pad * 2) + "px;height:" + (q.height + pad * 2) + "px;";
    const bw = b.offsetWidth, bh = b.offsetHeight;
    let top = q.bottom + 14;
    if(top + bh > innerHeight - 8) top = q.top - bh - 14;
    if(top < 8) top = Math.min(innerHeight - bh - 8, Math.max(8, q.top + 14));
    const left = Math.min(innerWidth - bw - 12, Math.max(12, q.left + q.width / 2 - bw / 2));
    b.style.left = left + "px"; b.style.top = top + "px";
  }
  function render(){
    const st = state.steps[state.i], n = state.steps.length;
    if(typeof st.before === "function"){ try{ st.before(); }catch(e){} }
    state.bubble.innerHTML = "<h3>" + esc(st.title) + "</h3>" + String(st.text).split("\n").map(p => "<p>" + esc(p) + "</p>").join("") +
      '<div class="nav"><span class="count">' + (state.i + 1) + " / " + n + '</span><button type="button" data-t="skip">Passer</button>' +
      (state.i ? '<button type="button" data-t="prev">← Précédent</button>' : "") +
      '<button type="button" class="go" data-t="next">' + (state.i === n - 1 ? "Terminer" : "Suivant →") + "</button></div>";
    const el = target();
    if(el) el.scrollIntoView({block:"nearest", inline:"nearest"});
    requestAnimationFrame(place);
    setTimeout(place, 250);
    const nx = state.bubble.querySelector('[data-t="next"]'); if(nx) nx.focus();
  }
  function go(d){
    if(!state) return;
    const i = state.i + d;
    if(i >= state.steps.length){ close(); return; }
    if(i < 0) return;
    state.i = i; render();
  }
  window.mtcTour = function(steps, opts){
    opts = opts || {};
    const key = opts.key || "mtc_tour";
    try{ if(!opts.force && localStorage.getItem(key)) return; }catch(e){}
    if(state && !opts.force) return;          // un tutoriel à la fois
    if(state) close();
    style();
    const ring = document.createElement("div"); ring.className = "mtc-tour-ring";
    const bubble = document.createElement("div"); bubble.className = "mtc-tour-bubble"; bubble.setAttribute("role", "dialog");
    document.body.append(ring, bubble);
    state = {steps, i:0, key, ring, bubble};
    bubble.addEventListener("click", e => {
      const b = e.target.closest("[data-t]"); if(!b) return;
      if(b.dataset.t === "skip") close(); else go(b.dataset.t === "next" ? 1 : -1);
    });
    window.addEventListener("resize", place);
    window.addEventListener("keydown", onKey, true);
    render();
  };
})();
