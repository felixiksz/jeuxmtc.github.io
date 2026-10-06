/* ============================================================
   69-main-menu.js
   Réorganisation de l'écran principal en grand menu (proposition C) :
   « ≡ Menu » ouvre quatre entrées — Jouer, Réviser, Suivi, Réglages —
   avec les fonctions du jeu en index (nom, description). Chaque ligne
   réutilise les fonctions existantes (panneaux, modules, cartes…) sans
   les modifier. Restent visibles en permanence : la série en bas à
   gauche, l'enveloppe en bas à droite, la grille et ses contrôles.
   Textes validés (2026-10-05).
   ============================================================ */
(function(){
  "use strict";

  const TAB_KEY = "mtc_main_menu_tab_v1";
  // numéro de version du jeu : majeur.mineur (le premier chiffre change pour une refonte, le second pour des ajouts)
  const MTC_VERSION = "2.0";
  window.MTC_VERSION = MTC_VERSION;
  // soutiens du projet : soutiens.js, modifiable en mode admin (Réglages → Soutiens), publié sur le dépôt
  const supporters = () => (Array.isArray(window.MTC_SUPPORTERS) ? window.MTC_SUPPORTERS : []).map(s => String(s).trim()).filter(Boolean);
  // en bas à droite du menu ; les prénoms défilent dans une petite fenêtre (la liste a vocation à s'allonger)
  const thanksHtml = () => {
    const THANKS = supporters();
    if(!THANKS.length) return "";
    const names = THANKS.map(esc).join(", ");
    const dur = Math.max(9, Math.round((names.length * 0.62 + 12) / 1.4));
    return '<span class="mm-thanks">Projet soutenu par :' +
      '<span class="mm-ticker" style="--tk-dur:' + dur + 's"><span class="mm-ticker-track">' +
      '<span class="mm-ticker-copy">' + names + '</span><span class="mm-ticker-copy" aria-hidden="true">' + names + "</span>" +
      "</span></span>Merci !</span>";
  };
  const DISCUSSIONS_URL = "https://github.com/felixiksz/jeuxmtc.github.io/discussions";
  const ENTRIES = [["jouer", "Jouer"], ["reviser", "Réviser"], ["suivi", "Suivi"], ["reglages", "Réglages"]];

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
  // ligne d'état des notes (28-26) et bouton « Nouveauté » (47) : rangés dans le menu au lieu du bas de l'écran
  function notesStatus(){
    const d = document.querySelector("#mtcPersonalDataStatus .mtc-status-dates");
    return d && d.textContent.trim() ? " (" + d.textContent.trim() + ")" : "";
  }
  function noveltyButton(){
    const b = byId("mtcPharmaImportNovelty");
    return b && !b.disabled && b.classList.contains("visible") ? b : null;
  }
  // publie soutiens.js sur le dépôt avec la clé GitHub de l'admin (la même que pour publier les fiches)
  async function editSupporters(){
    const cur = supporters().join(", ");
    const raw = window.prompt("Prénoms des soutiens, séparés par des virgules (dans l'ordre d'affichage) :", cur);
    if(raw === null) return;
    const list = raw.split(",").map(s => s.trim()).filter(Boolean);
    if(list.join(", ") === cur) return;
    const TOKEN_KEY = "mtc_admin_publish_token", REPO = "felixiksz/jeuxmtc.github.io", PATH = "soutiens.js";
    let token = "";
    try{ token = localStorage.getItem(TOKEN_KEY) || ""; }catch(error){}
    if(!token){
      token = (window.prompt("Clé GitHub pour publier (jeton « fine-grained » avec Contents : Read and write sur " + REPO + "). Elle reste seulement sur cet appareil.") || "").trim();
      if(!token) return;
      try{ localStorage.setItem(TOKEN_KEY, token); }catch(error){}
    }
    const text = "/* Soutiens du projet, affichés en bas du menu (« Projet soutenu par : … Merci ! »).\n" +
      "   Fichier écrit par le jeu lui-même (mode admin : Menu → Réglages → Soutiens). */\n" +
      "window.MTC_SUPPORTERS = " + JSON.stringify(list, null, 2) + ";\n";
    const api = "https://api.github.com/repos/" + REPO + "/contents/" + PATH;
    const headers = {"Authorization":"Bearer " + token, "Accept":"application/vnd.github+json"};
    try{
      const got = await fetch(api + "?ref=main", {headers, cache:"no-store"});
      if(got.status === 401 || got.status === 403){ try{ localStorage.removeItem(TOKEN_KEY); }catch(error){} throw new Error("clé GitHub refusée (elle a été oubliée : réessaie)"); }
      const sha = got.ok ? (await got.json()).sha : null;
      const body = {message:"Soutiens : liste mise à jour", content:btoa(unescape(encodeURIComponent(text))), branch:"main"};
      if(sha) body.sha = sha;
      const put = await fetch(api, {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, headers), body:JSON.stringify(body)});
      if(!put.ok) throw new Error("écriture impossible (" + put.status + ")");
      window.MTC_SUPPORTERS = list;
      render();
      window.alert("Soutiens publiés : visibles par tout le monde d'ici une à deux minutes.");
    }catch(error){ window.alert("Publication impossible : " + error.message); }
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
        ["Équilibrer", "Rééquilibrer des canaux atteints selon les six systèmes de Dr Tán.", () => module("equilibrer"), "b"],
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
        admin && ["Soutiens", "Les prénoms de « Projet soutenu par » (en bas du menu) : modifier et publier.", editSupporters],
        ["Notes", "Exporter ou importer tes notes et images." + notesStatus(), null, null, [["Exporter", () => call("exportPersonalNotes")], ["Importer", () => call("openImportPersonalNotesDialog")]]],
        pharma && noveltyButton() && ["Fiches pharma complètes", "Nouveauté : ajouter les fiches complètes des substances.", () => noveltyButton().click()],
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
        '<button type="button" class="mm-entry' + (k === tab ? " on" : "") + '" data-tab="' + k + '"><span class="mm-lw"><span class="mm-lbl">' + label + '</span><span class="mm-sum">' + current[k].map(it => esc(it[0])).join('<i class="mm-star">✦</i>') + "</span></span></button>" +
        (k === tab ? '<div class="mm-phone-list">' + list(k) + "</div>" : "")).join("") + "</div></div>" +
      '<div class="mm-foot"><span class="mm-version">Connections MTC<i class="mm-star">✦</i>v' + MTC_VERSION + "</span>" + thanksHtml() + "</div>";
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
      menu.addEventListener("mouseover", onEntryHover);
      menu.addEventListener("mouseout", e => { if(e.target.closest && e.target.closest(".mm-entry")) clearTimeout(hoverTimer); });
    }
    render();
    menu.classList.add("open");
    document.body.classList.add("mtc-menu-open");
  }
  function close(){
    if(menu) menu.classList.remove("open");
    document.body.classList.remove("mtc-menu-open");
  }
  // sur ordinateur : passer sur un grand mot affiche sa liste, sans cliquer (court délai pour ignorer un simple passage)
  let hoverTimer = 0;
  const canHover = () => window.matchMedia && window.matchMedia("(hover:hover) and (min-width:761px)").matches;
  function showTab(k){
    if(!menu || !current[k] || k === tab) return;
    tab = k;
    try{ localStorage.setItem(TAB_KEY, tab); }catch(error){}
    const listEl = menu.querySelector(".mm-list");
    if(listEl) listEl.innerHTML = current[k].map((it, i) => itemHtml(it, k, i)).join("");
    menu.querySelectorAll(".mm-entry").forEach(b => b.classList.toggle("on", b.dataset.tab === k));
  }
  function onEntryHover(e){
    const en = e.target.closest && e.target.closest(".mm-entry");
    if(!en || !canHover() || en.dataset.tab === tab) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showTab(en.dataset.tab), 110);
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
  // soutien : une demande discrète, une seule fois par série, le jour où elle atteint SUPPORT_ASK_DAYS jours
  // (la série est identifiée par son premier jour, pour ne pas redemander pendant la même série)
  const SUPPORT_ASK_DAYS = 15;
  const SUPPORT_ASK_KEY = "mtc_support_ask_series_v1";
  function supportLink(){ const d = byId("supportCoffeeButton"); return (d && d.getAttribute("href")) || "https://paypal.me/emesepap1"; }
  function maybeAskSupport(){
    let s;
    try{ s = JSON.parse(localStorage.getItem("mtc_daily_streak_v1") || "{}"); }catch(error){ return; }
    const n = streakCount();
    if(n < SUPPORT_ASK_DAYS || !s.lastPlayedDate || byId("mtcSupportAsk")) return;
    const start = new Date(s.lastPlayedDate + "T12:00:00"); start.setDate(start.getDate() - (Number(s.count) - 1));
    const seriesId = start.toISOString().slice(0, 10);
    try{ if(localStorage.getItem(SUPPORT_ASK_KEY) === seriesId) return; localStorage.setItem(SUPPORT_ASK_KEY, seriesId); }catch(error){ return; }
    const box = document.createElement("div");
    box.id = "mtcSupportAsk";
    box.setAttribute("role", "status");
    box.innerHTML = '<p><b>' + n + " jours de révision d’affilée, bravo !</b> Connections MTC est gratuit et sans publicité. " +
      "S’il t’aide dans tes révisions, un petit soutien le fait vivre.</p>" +
      '<p class="mtc-ask-note">Pour figurer parmi les mécènes du projet, merci d’indiquer ton prénom ou alias dans la note PayPal.</p>' +
      '<div class="mtc-ask-actions">' + (window.mtcSupportAmounts || [3, 5, 10]).concat([0]).map(v =>
        '<a href="' + esc(window.mtcSupportAmountUrl ? window.mtcSupportAmountUrl(v) : supportLink()) + '" target="_blank" rel="noopener noreferrer" class="mtc-ask-go">' + (v ? v + " €" : "Montant libre") + "</a>").join("") +
      '<button type="button" id="mtcSupportAskLater">Plus tard</button></div>';
    document.body.appendChild(box);
    const close = () => box.remove();
    byId("mtcSupportAskLater").addEventListener("click", close);
    box.querySelectorAll(".mtc-ask-go").forEach(l => l.addEventListener("click", () => {
      try{ if(typeof markSupportCoffeeClicked === "function") markSupportCoffeeClicked(); }catch(error){}
      setTimeout(close, 300);
    }));
  }
  // « Soutenir le jeu » écrit à côté de la goutte (même lien), seulement quand la goutte est visible
  function ensureSupportLabel(){
    const drop = byId("supportCoffeeButton");
    let label = byId("mtcSupportLabel");
    if(!label){
      label = document.createElement("a");
      label.id = "mtcSupportLabel";
      label.textContent = "Soutenir le jeu";
      label.target = "_blank"; label.rel = "noopener noreferrer";
      label.addEventListener("click", e => { const d = byId("supportCoffeeButton"); if(d){ e.preventDefault(); d.click(); } });
      document.body.appendChild(label);
      // la goutte et le texte forment un seul bouton : le survol de l'un éclaire les deux
      const hover = on => { label.classList.toggle("mtc-support-hover", on); const d = byId("supportCoffeeButton"); if(d) d.classList.toggle("mtc-support-hover", on); };
      label.addEventListener("mouseenter", () => hover(true));
      label.addEventListener("mouseleave", () => hover(false));
      if(drop){ drop.addEventListener("mouseenter", () => hover(true)); drop.addEventListener("mouseleave", () => hover(false)); }
    }
    label.href = supportLink();
    const r = drop && drop.getBoundingClientRect();
    const shown = !!(r && r.width && getComputedStyle(drop).display !== "none" && getComputedStyle(drop).visibility !== "hidden");
    label.style.display = shown ? "" : "none";
    if(shown){
      label.style.right = Math.max(8, window.innerWidth - r.left + 6) + "px";
      label.style.top = (r.top + r.height / 2) + "px";
    }
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
    steps.forEach(s => { if(s && s.selector === ".practice-row .mode-switch") s.selector = "#mtcAutoManual"; });
    if(steps.some(s => s && s.selector === "#mtcMenuButton")) return;
    const after = steps.findIndex(s => s && s.selector === ".topbar-row button[onclick*='newGame()']");
    steps.splice(after >= 0 ? after + 1 : 1, 0,
      {selector:"#mtcMenuButton", title:"Menu", text:"Le menu regroupe tout le reste : Jouer (les jeux), Réviser (mémo, recherche, comparaison, cartes, modules bêta), Suivi (statistiques, panier, série et rappel) et Réglages (affichage, aide, export et import des notes, hors connexion)."},
      {selector:"#mtcTopDomainSwitch", title:"Acu / Pharma", text:"Ici tu peux changer de matière en cours de route."},
      {selector:"#mtcStreakCorner", title:"Série", text:"Le nombre de jours de jeu d’affilée. Clique sur la série pour ouvrir Suivi et activer le rappel quotidien.", position:"aboveBottom"});
  }

  // réglages de la partie sur une ligne : Auto / Manuel (texte, comme Acu / Pharma), Facile–Difficile, puis le son et
  // le cadenas de la grille ; la colombe et le dinosaure (modes de jeu) restent sous « Astuce »
  function arrangeControls(){
    const row = document.querySelector(".practice-row");
    if(!row) return;
    const cb = byId("modeToggle");
    if(cb && !byId("mtcAutoManual")){
      const sw = document.createElement("span");
      sw.id = "mtcAutoManual";
      sw.className = "mtc-domain-switch";
      sw.innerHTML = '<button type="button" data-am="auto">Auto</button>/<button type="button" data-am="manual">Manuel</button>';
      row.insertBefore(sw, row.querySelector(".mode-switch") || row.firstChild);
      const paint = () => {
        sw.querySelector('[data-am="auto"]').classList.toggle("on", !cb.checked);
        sw.querySelector('[data-am="manual"]').classList.toggle("on", cb.checked);
      };
      sw.addEventListener("click", e => {
        const b = e.target.closest("[data-am]");
        if(!b) return;
        const want = b.dataset.am === "manual";
        if(cb.checked !== want){ cb.checked = want; cb.dispatchEvent(new Event("change", {bubbles:true})); }
        paint();
      });
      cb.addEventListener("change", paint);
      paint();
    }
    let icons = byId("mtcGameIcons");
    if(!icons){ icons = document.createElement("span"); icons.id = "mtcGameIcons"; row.appendChild(icons); }
    const audio = byId("mtcAudioModeToggle"), lock = byId("gridLockIndicator");
    if(audio && row.firstChild !== audio) row.insertBefore(audio, row.firstChild);
    if(lock && lock.parentElement !== icons) icons.appendChild(lock);
    const due = byId("mtcDueReviewButton");   // « À revoir N » (52-quiz-mode) : juste avant le cadenas
    if(due && due.nextSibling !== icons) row.insertBefore(due, icons);
    const manual = byId("manualEditButton");
    if(manual && manual.parentElement === row && manual.nextSibling !== icons) row.insertBefore(manual, icons);
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
    // goutte de sang : elle tombe et se pose juste à gauche de l'enveloppe, centrée sur sa hauteur
    // (le jeu la fait tomber jusqu'à un « sol » : ce sol devient la ligne de l'enveloppe, et sa position x est recalée)
    const drop = byId("supportCoffeeButton");
    if(drop){
      document.body.appendChild(drop);
      // quand le jeu « range » la goutte (déjà cliquée, ou fin de l'animation), elle retournait dans l'ancienne barre du bas,
      // dont le cadre décalait sa position : elle reste désormais dans la page, au coin de l'écran
      if(typeof window.restoreSupportCoffeeButtonToFooter === "function") window.restoreSupportCoffeeButtonToFooter = el => { if(el) document.body.appendChild(el); };
      const mailBox = () => { const m = byId("suggestionMailButton"); const r = m && m.getBoundingClientRect(); return r && r.width ? r : null; };
      const dropX = () => { const r = mailBox(), w = drop.offsetWidth || 30; return r ? Math.max(6, r.left - 27 - w / 2) : Math.max(6, window.innerWidth - 70 - w / 2); };
      const dropGround = () => { const r = mailBox(), h = drop.offsetHeight || 30; return r ? r.top + (r.height - h) / 2 : window.innerHeight - h - 12; };
      const pin = () => { try{ if(typeof supportBloodDropState !== "undefined" && supportBloodDropState) supportBloodDropState.x = dropX(); }catch(error){} };
      if(typeof window.panelGroundForSupportBloodDrop === "function" && !window.panelGroundForSupportBloodDrop.mtcPinned){
        window.panelGroundForSupportBloodDrop = function(){ return dropGround(); };
        window.panelGroundForSupportBloodDrop.mtcPinned = true;
      }
      if(typeof window.stepSupportBloodDropPhysics === "function" && !window.stepSupportBloodDropPhysics.mtcPinned){
        const step = window.stepSupportBloodDropPhysics;
        window.stepSupportBloodDropPhysics = function(){ pin(); return step.apply(this, arguments); };
        window.stepSupportBloodDropPhysics.mtcPinned = true;
      }
      pin();
      // fenêtre redimensionnée : on replace la goutte tout de suite (sans attendre l'image suivante)
      window.addEventListener("resize", () => {
        pin();
        try{
          const s = typeof supportBloodDropState !== "undefined" ? supportBloodDropState : null;
          if(s && drop.classList.contains("support-blooddrop-moving")){
            s.y = Math.min(s.y, dropGround());
            drop.style.setProperty("transform", "translate3d(" + s.x + "px, " + s.y + "px, 0) rotate(0deg)", "important");
          }
        }catch(error){}
      });
    }
    paintStreak();
    setTimeout(maybeAskSupport, 2500);
    ensureSupportLabel();
    setInterval(ensureSupportLabel, 700);
    window.addEventListener("resize", ensureSupportLabel);
    const badge = byId("dailyStreakBadge");
    if(badge) new MutationObserver(paintStreak).observe(badge, {childList:true, subtree:true, characterData:true});
    window.addEventListener("storage", e => { if(e.key === "mtc_daily_streak_v1") paintStreak(); });
    new MutationObserver(() => { paintTopSwitch(); if(menu && menu.classList.contains("open")) render(); })
      .observe(document.documentElement, {attributes:true, attributeFilter:["data-study-domain"]});
    document.addEventListener("keydown", e => { if(e.key === "Escape" && menu && menu.classList.contains("open")) close(); });
    arrangeControls();
    const gm = byId("gameplayModeTopline"), ba = document.querySelector(".bottom-actions");
    if(gm && ba && gm.parentElement !== ba) ba.appendChild(gm);
    document.body.classList.remove("mtc-menu-loading");   // tout est en place : on affiche
    if(typeof window.startTour === "function"){
      const original = window.startTour;
      window.startTour = function(){ close(); const r = original.apply(this, arguments); patchTour(); return r; };
    }
  }
  window.mtcOpenMainMenu = open;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
