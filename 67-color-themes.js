/* ============================================================
   67-color-themes.js
   Thèmes d'affichage « paires de couleurs » (fond & lettres) dans le
   panneau Affichage, comme dans l'Assistant :
   - un clic sur un thème applique le fond, les lettres et le halo ;
   - « Inverser le fond et les lettres » s'applique à tous les thèmes ;
   - « Thème personnalisé » : les sélecteurs Fond, Lettres et Halo ;
     « Effacer le thème perso » revient au thème d'origine ;
   - SYNCHRO avec l'Assistant et tes autres appareils : app/theme_synchro.json
     du dépôt de données GitHub (le même que la synchro des notes).
     Format : { maj:<ms>, theme:"" | "custom" | "#fond/#lettres" (minuscules),
     inverse:bool, contraste:bool, perso:{"--bg":…, …} | null } ; le plus récent l'emporte.
   Correspondance des couleurs du thème perso (noms de l'Assistant → jeu) :
     --bg → --page-bg (fond), --ink → --text-color (lettres), --accent → --shadow-color (halo).
     Les autres couleurs de l'Assistant (--panel, --muted, --line, --danger…) n'ont pas
     d'équivalent dans le jeu : elles sont gardées telles quelles dans le fichier partagé.
   ============================================================ */
(function(){
  "use strict";

  // les deux modes existants (labo photo, nuit) en tête, avec leur aperçu ; puis les paires de couleurs
  const THEMES = [
    ["Mode labo photo", "", "#000000", "#FF3B1F", "applyDarkroomMode"],
    ["Mode nuit", "", "#271629", "#FCFCFA", "applyNightInvertMode"],
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
  const ORIGIN = ["#FCFCFA", "#271629", "#0000FF"];   // thème d'origine du jeu : fond, lettres, halo
  const K = {id:"mtc_theme_id", inv:"mtc_theme_invert", perso:"mtc_theme_custom", maj:"mtc_theme_sync_maj", contraste:"mtc_theme_contraste"};
  const FILE = "app/theme_synchro.json";

  const st = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  const low = s => String(s || "").toLowerCase();
  const idOf = t => (t[2] + "/" + t[3]).toLowerCase();
  const nameOf = t => t[1] ? t[0] + " & " + t[1] : t[0];
  const inverted = () => st.get(K.inv) === "1";
  const perso = () => { try{ const o = JSON.parse(st.get(K.perso) || "null"); return o && typeof o === "object" ? o : null; }catch(e){ return null; } };
  // thème courant : celui retenu, à défaut déduit des couleurs affichées (anciens réglages)
  function currentId(){
    const saved = st.get(K.id);
    if(saved !== null) return saved;
    if(document.body.classList.contains("darkroom")) return idOf(THEMES[0]);
    const bg = low(st.get("mtc_pageBg")), fg = low(st.get("mtc_text"));
    const t = THEMES.find(x => low(x[2]) === bg && low(x[3]) === fg);
    return t ? idOf(t) : (bg && bg !== low(ORIGIN[0]) ? "custom" : "");
  }

  function setColors(bg, fg, halo){
    document.body.classList.remove("darkroom", "night-invert");
    st.del("mtc_darkroom"); st.del("mtc_night_invert");
    if(typeof window.applyPreset === "function") window.applyPreset(bg, fg, halo);
    else [["mtc_pageBg", "--page-bg", bg], ["mtc_text", "--text-color", fg], ["mtc_shadow", "--shadow-color", halo]].forEach(([k, v, c]) => {
      st.set(k, c); document.documentElement.style.setProperty(v, c);
    });
  }
  // applique un thème (identifiant « #fond/#lettres », "" = origine, "custom" = perso), inversion comprise
  function applyId(id){
    const inv = inverted();
    if(id === "custom"){
      const p = perso() || {};
      const bg = p["--bg"] || ORIGIN[0], fg = p["--ink"] || ORIGIN[1], halo = p["--accent"] || fg;
      inv ? setColors(fg, bg, halo) : setColors(bg, fg, halo);
      return;
    }
    if(!id){ inv ? setColors(ORIGIN[1], ORIGIN[0], ORIGIN[2]) : setColors(ORIGIN[0], ORIGIN[1], ORIGIN[2]); return; }
    const t = THEMES.find(x => idOf(x) === id);
    if(!t) return;
    if(!inv && t[4] && typeof window[t[4]] === "function"){ window[t[4]](); return; }
    inv ? setColors(t[3], t[2], t[2]) : setColors(t[2], t[3], t[3]);
  }

  function refresh(){
    const id = currentId();
    document.querySelectorAll("#mtcColorThemes button[data-theme]").forEach(b => b.classList.toggle("on", b.dataset.theme === id));
    const inv = document.getElementById("mtcThemeInvert"); if(inv) inv.checked = inverted();
    const cb = document.querySelector('#mtcColorThemes button[data-theme="custom"]');
    if(cb){ const p = perso() || {}; cb.style.background = p["--bg"] || ORIGIN[0]; cb.style.color = p["--ink"] || ORIGIN[1]; }
  }
  // un choix fait ici : retenu, appliqué, puis envoyé à l'Assistant et aux autres appareils
  function choose(id){
    st.set(K.id, id);
    applyId(id);
    refresh();
    changed();
  }

  function ensureStyle(){
    if(document.getElementById("mtcColorThemesStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcColorThemesStyle";
    style.textContent = `
#mtcColorThemes{ margin-top:10px; }
#mtcColorThemes .mtc-themes-title{ font-size:11px; font-weight:700; opacity:.75; margin:0 0 5px; }
#mtcColorThemes .mtc-themes-grid{ display:grid; grid-template-columns:repeat(6, 1fr); gap:5px; }
#mtcColorThemes .mtc-themes-grid button{ all:unset; box-sizing:border-box; cursor:pointer; border-radius:7px; height:34px; display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:15px; letter-spacing:-.02em; box-shadow:0 1px 3px rgba(0,0,0,.18); outline:2px solid transparent; outline-offset:2px; transition:transform .12s; }
#mtcColorThemes .mtc-themes-grid button:hover{ transform:translateY(-1px); }
#mtcColorThemes .mtc-themes-grid button:focus-visible{ outline-color:var(--text-color, #111); }
#mtcColorThemes .mtc-themes-grid button.on{ outline-color:var(--text-color, #111); }
#mtcColorThemes .mtc-themes-opts{ display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; margin-top:8px; font-size:12px; }
#mtcColorThemes .mtc-themes-opts label{ display:inline-flex; align-items:center; gap:5px; cursor:pointer; }
#mtcColorThemes .mtc-themes-opts .lnk{ all:unset; cursor:pointer; text-decoration:underline; text-underline-offset:3px; font-size:12px; }
#mtcColorThemes .mtc-themes-note{ font-size:11px; opacity:.7; margin:6px 0 0; }
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
      THEMES.map(t => '<button type="button" data-theme="' + idOf(t) + '" style="background:' + t[2] + ";color:" + t[3] + '" title="' + nameOf(t).replace(/&/g, "&amp;") + '" aria-label="Thème ' + nameOf(t).replace(/&/g, "et") + '">Aa</button>').join("") +
      '<button type="button" data-theme="custom" title="Thème personnalisé (sélecteurs Fond, Lettres, Halo)" aria-label="Thème personnalisé">Aa</button></div>' +
      '<div class="mtc-themes-opts"><label><input type="checkbox" id="mtcThemeInvert"> Inverser le fond et les lettres</label>' +
      '<button type="button" class="lnk" id="mtcThemeClearCustom">Effacer le thème perso</button></div>' +
      '<p class="mtc-themes-note">Thème personnalisé : règle le fond, les lettres et le halo avec les sélecteurs. Le thème choisi suit sur l’Assistant et tes autres appareils quand la synchronisation GitHub est réglée.</p>';
    const presets = panel.querySelector(".settings-presets");
    // les boutons texte « Mode labo photo » et « Mode nuit » sont remplacés par leurs aperçus
    panel.querySelectorAll('.settings-presets button[onclick*="applyDarkroomMode"], .settings-presets button[onclick*="applyNightInvertMode"]').forEach(b => { b.style.display = "none"; });
    if(presets) presets.insertAdjacentElement("afterend", box); else panel.appendChild(box);
    box.addEventListener("click", e => {
      const b = e.target.closest("button[data-theme]");
      if(b) choose(b.dataset.theme);
    });
    document.getElementById("mtcThemeInvert").addEventListener("change", e => { st.set(K.inv, e.target.checked ? "1" : "0"); applyId(currentId()); refresh(); changed(); });
    document.getElementById("mtcThemeClearCustom").addEventListener("click", () => { st.del(K.perso); choose(""); });
    // sélecteurs Fond / Lettres / Halo : ils font le thème personnalisé (les autres couleurs de l'Assistant sont gardées)
    [["pageBgPicker", "--bg"], ["textPicker", "--ink"], ["shadowPicker", "--accent"]].forEach(([pid, v]) => {
      const inp = document.getElementById(pid); if(!inp) return;
      inp.addEventListener("input", () => {
        const p = perso() || {}, inv = inverted();
        p["--bg"] = (inv ? document.getElementById("textPicker") : document.getElementById("pageBgPicker")).value;
        p["--ink"] = (inv ? document.getElementById("pageBgPicker") : document.getElementById("textPicker")).value;
        p["--accent"] = document.getElementById("shadowPicker").value;
        st.set(K.perso, JSON.stringify(p)); st.set(K.id, "custom");
        refresh(); changed();
      });
    });
    // « ↺ Réinitialiser » : thème d'origine
    const reset = panel.querySelector('.settings-presets button[onclick*="resetAppearance"]');
    if(reset) reset.addEventListener("click", () => { st.set(K.id, ""); st.set(K.inv, "0"); setTimeout(refresh, 0); changed(); });
    refresh();
    startSync();
  }

  /* ---------- synchronisation avec l'Assistant et tes autres appareils ---------- */
  let timer = null;
  const cfg = () => typeof window.mtcGithubSyncConfig === "function" ? window.mtcGithubSyncConfig() : null;
  const api = c => "https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/contents/" + FILE;
  const hdr = c => ({"Authorization":"Bearer " + c.token, "Accept":"application/vnd.github+json"});
  const b64d = s => decodeURIComponent(escape(atob(String(s).replace(/\n/g, ""))));
  const b64e = s => btoa(unescape(encodeURIComponent(s)));
  async function readFile(c){
    const r = await fetch(api(c) + "?ref=" + encodeURIComponent(c.branch || "main"), {headers:hdr(c), cache:"no-store"});
    if(r.status === 404) return {sha:null, data:null};
    if(!r.ok) throw new Error("thème : " + r.status);
    const j = await r.json();
    let data = null; try{ data = JSON.parse(b64d(j.content)); }catch(e){}
    return {sha:j.sha, data};
  }
  function changed(){
    st.set(K.maj, String(Date.now()));
    if(!cfg()) return;
    clearTimeout(timer); timer = setTimeout(send, 2500);   // un seul envoi pour des changements rapprochés
  }
  async function send(){
    timer = null;
    const c = cfg(); if(!c) return;
    const contraste = st.get(K.contraste);
    const state = {maj:+(st.get(K.maj) || Date.now()), theme:currentId(), inverse:inverted(), contraste:contraste === null ? true : contraste !== "0", perso:perso()};
    const put = async sha => fetch(api(c), {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, hdr(c)),
      body:JSON.stringify(Object.assign({message:"Thème : choix synchronisé depuis le jeu", content:b64e(JSON.stringify(state, null, 2) + "\n"), branch:c.branch || "main"}, sha ? {sha} : {}))});
    try{
      let f = await readFile(c);
      let r = await put(f.sha);
      if(r.status === 409 || r.status === 422){ f = await readFile(c); r = await put(f.sha); }   // l'Assistant a écrit entre-temps : on relit et on réessaie une fois
    }catch(e){}
  }
  // choix plus récent fait ailleurs (Assistant ou autre appareil) : appliqué ici
  async function pull(){
    const c = cfg(); if(!c || timer) return;
    try{
      const {data:d} = await readFile(c);
      if(!d || typeof d !== "object" || !((d.maj || 0) > +(st.get(K.maj) || 0))) return;
      const id = low(d.theme || "");
      if(id && id !== "custom" && !THEMES.some(t => idOf(t) === id)) return;
      st.set(K.inv, d.inverse ? "1" : "0");
      if(typeof d.contraste === "boolean") st.set(K.contraste, d.contraste ? "1" : "0");
      if(d.perso && typeof d.perso === "object") st.set(K.perso, JSON.stringify(d.perso));
      st.set(K.id, id); st.set(K.maj, String(d.maj));
      applyId(id); refresh();
    }catch(e){}
  }
  let started = false;
  function startSync(){
    if(started) return; started = true;
    (async () => {
      for(let i = 0; i < 40 && !cfg(); i++) await new Promise(r => setTimeout(r, 500));   // attend les réglages de synchro
      await pull();
      setInterval(pull, 60000);
      document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") pull(); });
    })();
  }

  window.mtcThemeApply = applyId;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
