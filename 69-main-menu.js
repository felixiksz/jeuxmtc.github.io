/* ============================================================
   69-main-menu.js
   Réorganisation de l'écran principal en grand menu (proposition C) :
   « ≡ Menu » ouvre quatre entrées — Jouer, Réviser, Mon suivi, Réglages —
   avec les fonctions du jeu en index (nom, description). Chaque ligne
   réutilise les fonctions existantes (panneaux, modules, cartes…) sans
   les modifier. Restent visibles en permanence : la série en bas à
   gauche, l'enveloppe en bas à droite, la grille et ses contrôles.
   Textes validés (2026-10-05).
   ============================================================ */
(function(){
  "use strict";

  const TAB_KEY = "mtc_main_menu_tab_v1";
  const DISCUSSIONS_URL = "https://github.com/felixiksz/jeuxmtc.github.io/discussions";
  const ENTRIES = [["jouer", "Jouer"], ["reviser", "Réviser"], ["suivi", "Mon suivi"], ["reglages", "Réglages"]];

  const byId = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
  const isPharma = () => document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  const isAdmin = () => typeof window.mtcIsAdmin === "function" ? window.mtcIsAdmin() : false;
  const isPublic = m => { const p = window.MTC_BETA && window.MTC_BETA.public; return p && typeof p === "object" ? !!p[m] : !!p; };
  const call = (name, ...args) => { if(typeof window[name] === "function") return window[name](...args); };
  const clickId = id => { const el = byId(id); if(el) el.click(); };
  const module = (dir, hash) => { window.location.href = dir + "/index.html" + (isAdmin() ? "?admin=1" : "") + (hash ? "#" + hash : ""); };
  let tab = "jouer";
  try{ tab = localStorage.getItem(TAB_KEY) || "jouer"; }catch(error){}
  if(!ENTRIES.some(e => e[0] === tab)) tab = "jouer";

  // Affichage : la fenêtre flottante se place sous son ancien bouton (masqué) → on la recentre en haut
  function openSettings(){
    setTimeout(() => {
      call("toggleSettings");
      const p = byId("settingsPanel");
      if(p && p.style.display !== "none"){
        const w = p.getBoundingClientRect().width || 330;
        p.style.left = Math.max(10, (window.innerWidth - w) / 2) + "px";
        p.style.top = "56px";
      }
    }, 30);
  }
  function openMastery(){
    call("toggleStatsPanel");
    setTimeout(() => { const card = byId("mtcQuizMasteryCard"); if(card) card.scrollIntoView({block:"start", behavior:"smooth"}); }, 350);
  }
  function reminderState(){
    const b = byId("mtcDailyReminderButton");
    return b && b.getAttribute("aria-pressed") === "true" ? "activé" : "désactivé";
  }

  // [nom, description, action, étiquette ("b" bêta, "s" bientôt), sous-actions]
  function items(){
    const pharma = isPharma(), admin = isAdmin();
    const what = pharma ? "substances" : "points";
    const I = {
      jouer: pharma ? [
        ["Grille", "Le jeu principal, version pharmacopée.", () => {}],
        (admin || isPublic("formules")) && ["Substance manquante", "Retrouver la substance cachée d’une formule.", () => module("formules", "jeu"), "b"],
        (admin || isPublic("formules")) && ["Cas clinique", "Faire un diagnostic de pharmacopée.", () => module("formules", "cas"), "b"]
      ] : [
        ["Grille", "Le jeu principal : retrouver les groupes de quatre points.", () => {}],
        window.MTCQuizTest && ["Quiz", "Questions à choix sur les points.", () => window.MTCQuizTest.open()],
        (admin || isPublic("trajets")) && ["Équilibrer", "Rééquilibrer des canaux atteints selon les six systèmes de Dr Tán.", () => module("trajets", "equilibrer"), "b"],
        (admin || isPublic("trajets")) && ["Itinéraire", "Relier deux points par le plan des intersections.", () => module("trajets", "itineraire"), "b"]
      ],
      reviser: [
        ["Mémo", pharma ? "Toutes les substances, rangées par catégorie." : "Tous les points, rangés par catégorie.", () => call("openCheatsheetPanel")],
        ["Recherche", pharma ? "Substances par nom, nature, saveur, tropisme." : "Points, points d’intersection, huit merveilleux vaisseaux.", () => call("toggleAdvancedSearchPanel")],
        ["Comparer A | B", "Plusieurs " + what + " côte à côte.", () => call("toggleComparisonPanel")],
        byId("pharmaCardsButton") && ["Cartes mémo", "Cartes de révision à imprimer, recto verso.", () => clickId("pharmaCardsButton")],
        !pharma && (admin || isPublic("trajets")) && ["Trajets", "Le trajet de chaque canal, en texte et en plan.", () => module("trajets"), "b"],
        !pharma && (admin || isPublic("trajets")) && ["Plan des intersections", "Les points d’intersection, les six systèmes de Dr Tán et les canaux distincts.", () => module("trajets", "reseau"), "b"],
        pharma && (admin || isPublic("formules")) && ["Formules", "Les fiches des formules.", () => module("formules"), "b"]
      ],
      suivi: [
        ["Statistiques", "Réussites, temps, évolution.", () => call("toggleStatsPanel")],
        ["Panier", "Les " + what + " mis" + (pharma ? "es" : "") + " de côté pour les revoir.", () => call("toggleReviewBasketPanel")],
        !pharma && ["Maîtrise", "Le niveau atteint sur chaque point.", openMastery],
        ["Série", "Les jours de jeu d’affilée, rappel quotidien : " + reminderState() + ".", () => { clickId("mtcDailyReminderButton"); render(); }, null, null, true]
      ],
      reglages: [
        ["Affichage", "Thèmes de couleurs, son, prononciation.", openSettings],
        ["Aide", "Les tutoriels de chaque écran.", () => setTimeout(() => call("startTour"), 30)],
        admin && byId("mtcGithubSyncButton") && ["Synchronisation", "Tes notes sur plusieurs appareils.", () => clickId("mtcGithubSyncButton")],
        ["Notes", "Exporter ou importer tes notes et images.", null, null, [["Exporter", () => call("exportPersonalNotes")], ["Importer", () => call("openImportPersonalNotesDialog")]]],
        ["Corrections", "Les commentaires publics des modules bêta.", () => window.open(DISCUSSIONS_URL, "_blank", "noopener")],
        byId("mtcOfflineButton") && ["Hors connexion", "Préparer le jeu pour jouer sans internet.", () => clickId("mtcOfflineButton")]
      ]
    };
    Object.keys(I).forEach(k => { I[k] = I[k].filter(Boolean); });
    return I;
  }

  let menu = null, current = {};
  function itemHtml(it, k, i){
    const [name, desc, action, tag, subs] = it;
    const tagHtml = tag === "b" ? '<span class="mm-tag">bêta</span>' : tag === "s" ? '<span class="mm-tag soon">bientôt</span>' : "";
    const subHtml = subs ? subs.map((s, j) => '<span class="mm-sub" data-sub="' + j + '">' + esc(s[0]) + "</span>").join("") : esc(desc);
    return '<button type="button" class="mm-item' + (action || subs ? "" : " soon") + '" data-k="' + k + '" data-i="' + i + '">' +
      '<span class="mm-n">' + esc(name) + tagHtml + '</span><span class="mm-d">' + (subs ? '<span style="display:block;margin-bottom:4px">' + esc(desc) + "</span>" : "") + subHtml + "</span></button>";
  }
  function render(){
    if(!menu) return;
    current = items();
    const pharma = isPharma();
    const list = k => current[k].map((it, i) => itemHtml(it, k, i)).join("");
    menu.innerHTML =
      '<div class="mm-head"><button type="button" id="mtcMenuClose">× Fermer</button>' + domainSwitchHtml() + "</div>" +
      '<div class="mm-body"><div class="mm-list">' + list(tab) + "</div>" +
      '<div class="mm-entries">' + ENTRIES.map(([k, label]) =>
        '<button type="button" class="mm-entry' + (k === tab ? " on" : "") + '" data-tab="' + k + '">' + label + "</button>" +
        (k === tab ? '<div class="mm-phone-list">' + list(k) + "</div>" : "")).join("") + "</div></div>";
    menu.setAttribute("data-dom", pharma ? "pharma" : "acu");
  }
  function domainSwitchHtml(){
    const pharma = isPharma();
    return '<span class="mtc-domain-switch"><button type="button" data-domain="acupuncture" class="' + (pharma ? "" : "on") + '">Acu</button>/' +
      '<button type="button" data-domain="pharmacology" class="' + (pharma ? "on" : "") + '">Pharma</button></span>';
  }
  function open(which){
    if(which) tab = which;
    if(!menu){
      menu = document.createElement("div");
      menu.id = "mtcMainMenu";
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-label", "Menu");
      document.body.appendChild(menu);
      menu.addEventListener("click", onMenuClick);
    }
    render();
    menu.classList.add("open");
    document.body.classList.add("mtc-menu-open");
  }
  function close(){
    if(menu) menu.classList.remove("open");
    document.body.classList.remove("mtc-menu-open");
  }
  function onMenuClick(e){
    const t = e.target;
    if(t.closest("#mtcMenuClose")){ close(); return; }
    const d = t.closest("[data-domain]");
    if(d){ setDomain(d.dataset.domain); return; }
    const en = t.closest(".mm-entry");
    if(en){ tab = en.dataset.tab; try{ localStorage.setItem(TAB_KEY, tab); }catch(error){} render(); return; }
    const row = t.closest(".mm-item");
    if(!row) return;
    const it = (current[row.dataset.k] || [])[+row.dataset.i];
    if(!it) return;
    const sub = t.closest(".mm-sub");
    if(it[4]){ if(sub){ close(); it[4][+sub.dataset.sub][1](); } return; }
    if(!it[2]) return;
    if(!it[5]) close();   // « Série » : l'interrupteur du rappel laisse le menu ouvert
    it[2]();
  }
  function setDomain(value){
    const select = byId("studyDomainSelect");
    if(select) select.value = value;
    call("chooseStudyDomain", value);
    setTimeout(() => { render(); paintTopSwitch(); }, 60);
  }

  // série : toujours affichée en bas à gauche
  function streakCount(){
    try{
      const s = JSON.parse(localStorage.getItem("mtc_daily_streak_v1") || "{}");
      const d = new Date(), y = new Date(); y.setDate(y.getDate() - 1);
      const f = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
      return s.lastPlayedDate === f(d) || s.lastPlayedDate === f(y) ? Number(s.count) || 0 : 0;
    }catch(error){ return 0; }
  }
  function paintStreak(){
    const el = byId("mtcStreakCorner");
    if(!el) return;
    const n = streakCount();
    el.innerHTML = "Série " + n + "<small>jour" + (n > 1 ? "s" : "") + "</small>";
  }
  function paintTopSwitch(){
    const host = byId("mtcTopDomainSwitch");
    if(host) host.innerHTML = domainSwitchHtml();
  }

  // la visite guidée : les boutons regroupés dans le menu sont remplacés par une étape « Menu »
  const MOVED = ["#mtcDailyReminderButton", ".topbar-row button[onclick*='toggleSettings()']", "#statsButton", "#advancedSearchButton",
    "#reviewBasketButton", "#comparisonButton", "#studyDomainSelect", "#fullscreenToggleButton", "#pharmaCardsButton",
    "#exportNotesButton", "#importNotesButton", "#mtcOfflineButton", "#cheatsheetButton"];
  function patchTour(){
    let steps;
    try{ steps = tourSteps; }catch(error){ return; }
    if(!Array.isArray(steps)) return;
    for(let i = steps.length - 1; i >= 0; i--) if(steps[i] && MOVED.includes(steps[i].selector)) steps.splice(i, 1);
    if(steps.some(s => s && s.selector === "#mtcMenuButton")) return;
    const after = steps.findIndex(s => s && s.selector === ".topbar-row button[onclick*='newGame()']");
    steps.splice(after >= 0 ? after + 1 : 1, 0,
      {selector:"#mtcMenuButton", title:"Menu", text:"Le menu regroupe tout le reste : Jouer (les jeux), Réviser (mémo, recherche, comparaison, cartes, modules bêta), Mon suivi (statistiques, panier, série et rappel) et Réglages (affichage, aide, export et import des notes, hors connexion)."},
      {selector:"#mtcTopDomainSwitch", title:"Acu / Pharma", text:"Ici tu peux changer de matière en cours de route."},
      {selector:"#mtcStreakCorner", title:"Série", text:"Le nombre de jours de jeu d’affilée. Clique sur la série pour ouvrir Mon suivi et activer le rappel quotidien.", position:"aboveBottom"});
  }

  function boot(){
    const row = document.querySelector(".topbar-main-row");
    if(!row || byId("mtcMenuButton")) return;
    document.body.classList.add("mtc-menu-ui");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "mtcMenuButton";
    btn.textContent = "≡ Menu";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.addEventListener("click", () => open());
    row.insertBefore(btn, row.firstChild);
    const sw = document.createElement("span");
    sw.id = "mtcTopDomainSwitch";
    row.appendChild(sw);
    paintTopSwitch();
    sw.addEventListener("click", e => { const d = e.target.closest("[data-domain]"); if(d) setDomain(d.dataset.domain); });
    const streak = document.createElement("button");
    streak.type = "button";
    streak.id = "mtcStreakCorner";
    streak.title = "Série de jours de jeu d’affilée";
    streak.addEventListener("click", () => open("suivi"));
    document.body.appendChild(streak);
    // enveloppe : sortie de la barre du bas (dont le cadre décale les éléments « fixes ») pour rester au coin
    const mail = byId("suggestionMailButton");
    if(mail) document.body.appendChild(mail);
    paintStreak();
    const badge = byId("dailyStreakBadge");
    if(badge) new MutationObserver(paintStreak).observe(badge, {childList:true, subtree:true, characterData:true});
    window.addEventListener("storage", e => { if(e.key === "mtc_daily_streak_v1") paintStreak(); });
    new MutationObserver(() => { paintTopSwitch(); if(menu && menu.classList.contains("open")) render(); })
      .observe(document.documentElement, {attributes:true, attributeFilter:["data-study-domain"]});
    document.addEventListener("keydown", e => { if(e.key === "Escape" && menu && menu.classList.contains("open")) close(); });
    if(typeof window.startTour === "function"){
      const original = window.startTour;
      window.startTour = function(){ close(); const r = original.apply(this, arguments); patchTour(); return r; };
    }
  }
  window.mtcOpenMainMenu = open;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
