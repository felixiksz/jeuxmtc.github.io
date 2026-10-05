/* ============================================================
   modules-theme.js
   Applique aux modules Trajets et Formules le thème d'affichage
   choisi dans le jeu (même origine : mêmes réglages enregistrés).
   La couleur d'accent (liens, titres) est le halo, sauf s'il se lit
   mal sur le fond : on prend alors la couleur des lettres.
   ============================================================ */
(function(){
  "use strict";
  const get = k => { try{ return localStorage.getItem(k) || ""; }catch(error){ return ""; } };
  const rgb = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim()); if(!m) return null; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

  function apply(){
    const dark = get("mtc_darkroom") === "1";
    const bg = dark ? "#000000" : get("mtc_pageBg") || "#FCFCFA";
    const text = dark ? "#ff3b1f" : get("mtc_text") || "#271629";
    const halo = dark ? "#ff3b1f" : get("mtc_shadow") || "#0000FF";
    const b = rgb(bg), t = rgb(text), h = rgb(halo);
    const accent = b && h && contrast(b, h) >= 3 ? halo : text;
    const root = document.documentElement;
    root.style.setProperty("--page-bg", bg);
    root.style.setProperty("--text-color", text);
    root.style.setProperty("--shadow-color", halo);
    root.style.setProperty("--mtc-accent", accent);
    root.classList.toggle("mtc-dark", !!(b && lum(b) < .2));
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content = bg;
  }
  apply();
  // thème changé dans un autre onglet du jeu
  window.addEventListener("storage", e => { if(!e.key || /^mtc_(pageBg|text|shadow|darkroom)$/.test(e.key)) apply(); });
})();
