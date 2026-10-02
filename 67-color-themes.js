/* ============================================================
   67-color-themes.js
   Thèmes d'affichage « paires de couleurs » (fond & lettres) dans le
   panneau Affichage. Un clic applique le fond, les lettres et le halo
   (couleur des lettres) avec les mêmes réglages que les sélecteurs de
   couleur ; « ↺ Réinitialiser » revient au thème d'origine.
   ============================================================ */
(function(){
  "use strict";

  const THEMES = [
    ["Tasman", "Blue Gem", "#CFDDCD", "#5616AF"],
    ["Fern Frond", "Confetti", "#576B1B", "#EBD957"],
    ["Wistful", "Blue Gem", "#A7AFD3", "#2F0899"],
    ["Snuff", "Fern Frond", "#E6DDE9", "#51712B"],
    ["Logan", "Brown Rust", "#B2B2D2", "#A8503C"],
    ["Mischka", "Blue", "#DFD8E6", "#1D07E4"],
    ["Bleached Cedar", "Portage", "#352542", "#7D9AE3"],
    ["Orange Roughy", "Swans Down", "#BA561F", "#D8EDED"],
    ["Martinique", "Ochre", "#302E4A", "#CF7E23"],
    ["Japanese Laurel", "Starship", "#036F02", "#F0DD48"],
    ["Prelude", "Pueblo", "#D2CDEA", "#74301C"],
    ["Blue Gem", "Screamin' Green", "#4B15BB", "#93F06A"],
    ["Mischka", "Japanese Laurel", "#D4D6E6", "#0E7E07"],
    ["Royal Blue", "Crater Brown", "#5F59DF", "#4A2724"],
    ["Tasman", "Dark Blue", "#D1DBD5", "#2B03D3"]
  ];

  const get = k => { try{ return (localStorage.getItem(k) || "").toLowerCase(); }catch(error){ return ""; } };
  const isActive = t => get("mtc_pageBg") === t[2].toLowerCase() && get("mtc_text") === t[3].toLowerCase();

  function apply(t){
    document.body.classList.remove("darkroom", "night-invert");
    try{ localStorage.removeItem("mtc_darkroom"); localStorage.removeItem("mtc_night_invert"); }catch(error){}
    if(typeof window.applyPreset === "function") window.applyPreset(t[2], t[3], t[3]);
    else{
      [["mtc_pageBg", "--page-bg", t[2]], ["mtc_text", "--text-color", t[3]], ["mtc_shadow", "--shadow-color", t[3]]].forEach(([k, v, c]) => {
        try{ localStorage.setItem(k, c); }catch(error){}
        document.documentElement.style.setProperty(v, c);
      });
    }
    refresh();
  }

  function refresh(){
    document.querySelectorAll("#mtcColorThemes button[data-theme]").forEach(b => {
      b.classList.toggle("on", isActive(THEMES[+b.dataset.theme]));
    });
  }

  function ensureStyle(){
    if(document.getElementById("mtcColorThemesStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcColorThemesStyle";
    style.textContent = `
#mtcColorThemes{ margin-top:10px; }
#mtcColorThemes .mtc-themes-title{ font-size:11px; font-weight:700; opacity:.75; margin:0 0 5px; }
#mtcColorThemes .mtc-themes-grid{ display:grid; grid-template-columns:repeat(5, 1fr); gap:5px; }
#mtcColorThemes button{ all:unset; box-sizing:border-box; cursor:pointer; border-radius:7px; height:34px; display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:15px; letter-spacing:-.02em; box-shadow:0 1px 3px rgba(0,0,0,.18); outline:2px solid transparent; outline-offset:2px; transition:transform .12s; }
#mtcColorThemes button:hover{ transform:translateY(-1px); }
#mtcColorThemes button:focus-visible{ outline-color:var(--text-color, #111); }
#mtcColorThemes button.on{ outline-color:var(--text-color, #111); }
`;
    document.head.appendChild(style);
  }

  function boot(){
    const panel = document.getElementById("settingsPanel");
    if(!panel || document.getElementById("mtcColorThemes")) return;
    ensureStyle();
    const box = document.createElement("div");
    box.id = "mtcColorThemes";
    box.innerHTML = '<p class="mtc-themes-title">Thèmes</p><div class="mtc-themes-grid">' +
      THEMES.map((t, i) => '<button type="button" data-theme="' + i + '" style="background:' + t[2] + ";color:" + t[3] + '" title="' + t[0] + " &amp; " + t[1] + '" aria-label="Thème ' + t[0] + " et " + t[1] + '">Aa</button>').join("") + "</div>";
    const presets = panel.querySelector(".settings-presets");
    if(presets) presets.insertAdjacentElement("afterend", box); else panel.appendChild(box);
    box.addEventListener("click", e => {
      const b = e.target.closest("button[data-theme]");
      if(b) apply(THEMES[+b.dataset.theme]);
    });
    // réinitialiser, mode labo photo, mode nuit ou sélecteurs : l'état « thème actif » suit
    panel.addEventListener("click", () => setTimeout(refresh, 0));
    panel.addEventListener("input", () => setTimeout(refresh, 0));
    refresh();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
