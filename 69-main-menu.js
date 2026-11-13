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
  const MTC_VERSION = "2.3";
  window.MTC_VERSION = MTC_VERSION;
  // soutiens du projet : soutiens.js, modifiable en mode admin (Réglages → Soutiens), publié sur le dépôt
  const supporters = () => (Array.isArray(window.MTC_SUPPORTERS) ? window.MTC_SUPPORTERS : []).map(s => String(s).trim()).filter(Boolean);
  // en bas à droite du menu ; les prénoms défilent dans une petite fenêtre (la liste a vocation à s'allonger)
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = rgb => { const c = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hueSat = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    let hh = 0;
    if(d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(hh * 60 + 360) % 360, s];
  };
  function themeBackground(){
    const el = document.getElementById("mtcMainMenu") || document.body;
    const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    return m && m.length >= 3 ? m.slice(0, 3).map(Number) : [250, 250, 248];
  }
  // couleur lisible sur le fond : null si sa teinte est trop proche d'un fond coloré (sauf force), sinon éclaircie ou foncée
  function readable(rgb, bg, force){
    const [hc] = hueSat(rgb), [hb, sb] = hueSat(bg);
    const dh = Math.min(Math.abs(hc - hb), 360 - Math.abs(hc - hb));
    if(!force && sb > .2 && dh < 32) return null;
    const toward = lum(bg) < .3 ? 255 : 0;
    let c = rgb.slice();
    for(let k = 0; k < 10 && contrast(c, bg) < 3.2; k++) c = c.map(v => Math.round(v + (toward - v) * .15));
    return "rgb(" + c.join(",") + ")";
  }
  const thanksHtml = () => {
    const THANKS = supporters();
    if(!THANKS.length) return "";
    // chaque prénom reçoit automatiquement sa couleur vive, tirée de son nom, jamais celle de son voisin (ni du premier
    // pour le dernier, puisque la liste défile en boucle), jamais rouge à côté de bleu (le drapeau français) ;
    // les couleurs s'adaptent au thème : celles trop proches du fond sont écartées, les autres éclaircies ou foncées pour rester lisibles
    const PALETTE = [["rouge", "#d33a2c"], ["vert", "#2e9a4a"], ["bleu", "#2b5fd9"], ["jaune", "#d9a400"], ["violet", "#8a3fd1"], ["orange", "#e6731a"], ["turquoise", "#139e9a"]];
    const bg = themeBackground();
    let COLORS = PALETTE.map(([name, hex]) => [name, readable(hexRgb(hex), bg)]).filter(c => c[1]);
    if(COLORS.length < 4) COLORS = PALETTE.map(([name, hex]) => [name, readable(hexRgb(hex), bg, true)]);
    const flag = (a, b) => a && b && ((a === "rouge" && b === "bleu") || (a === "bleu" && b === "rouge"));
    const pick = [];
    THANKS.forEach((n, k) => {
      let h = 0;
      for(const ch of n.toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0;
      let i = h % COLORS.length;
      const near = [pick[k - 1], k === THANKS.length - 1 && k > 1 ? pick[0] : undefined].filter(x => x !== undefined).map(x => COLORS[x][0]);
      for(let tries = 0; tries < COLORS.length && near.some(nm => nm === COLORS[i][0] || flag(nm, COLORS[i][0])); tries++) i = (i + 1) % COLORS.length;
      pick.push(i);
    });
    const colorOf = k => COLORS[pick[k]][1];
    // pas de virgule : un blanc d'environ une seconde de défilement entre deux prénoms
    const names = THANKS.map((n, k) => '<span style="color:' + colorOf(k) + '">' + esc(n) + "</span>").join('<span class="mm-gap" aria-hidden="true"></span>');
    const dur = Math.max(9, Math.round((THANKS.join("").length * 0.62 + (THANKS.length - 1) * 1.6 + 12) / 1.4));
    return '<span class="mm-thanks">Projet soutenu par :' +
      '<span class="mm-ticker" style="--tk-dur:' + dur + 's"><span class="mm-ticker-track">' +
      '<span class="mm-ticker-copy">' + names + '</span><span class="mm-ticker-copy" aria-hidden="true">' + names + "</span>" +
      '</span></span><span class="mm-heart" aria-hidden="true">❤︎</span>Merci !</span>';
  };
  const DISCUSSIONS_URL = "https://github.com/felixiksz/jeuxmtc.github.io/discussions";
  const fxOn = k => { try{ return localStorage.getItem(k) !== "0"; }catch(e){ return true; } };
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
    // mode coach : le programme du jour (accueil/)
    const NOUVEL_ACCUEIL = ["Entraînement du jour", "Le programme du coach : quatre sujets, différents chaque jour.", () => module("accueil")];
    const I = {
      jouer: pharma ? [
        NOUVEL_ACCUEIL,
        ["Grille", "Le jeu principal, version pharmacopée.", () => {}],
        (admin || isPublic("formules")) && ["Substance manquante", "Retrouver la substance cachée d’une formule.", () => module("formules", "jeu"), "b"],
        (admin || isPublic("formules")) && ["Cas clinique", "Faire un diagnostic de pharmacopée.", () => module("formules", "cas"), "b"]
      ] : [
        NOUVEL_ACCUEIL,
        ["Grille", "Le jeu principal : retrouver les groupes de quatre points.", () => {}],
        window.MTCQuizTest && ["Quiz", "Questions à choix sur les points.", () => window.MTCQuizTest.open()],
        // série Réseaux (bêta) : elle contient Équilibrer ; tant qu'elle n'est pas ouverte, les joueur·ses gardent Équilibrer seul
        (admin || isPublic("circuits")) ? ["「 ✦ RÉSEAUX ✦ 」", "Les six systèmes et les circuits de Dr Tán : équilibrer, fermer un circuit, trois plaintes, propagation, familles, quatre membres.", () => module("circuits"), "b"]
          : ["Équilibrer", "Rééquilibrer des canaux atteints selon les six systèmes de Dr Tán.", () => module("equilibrer"), "b"],
        (admin || isPublic("trajets")) && ["Correspondance", "Un métro arrêté par des travaux : trouver la station où il peut changer de canal.", () => { window.location.href = "trajets/correspondance.html"; }, "b"]
      ],
      reviser: [
        ["Mémo", pharma ? "Toutes les substances, rangées par catégorie." : "Tous les points, rangés par catégorie.", () => call("openCheatsheetPanel")],
        ["Recherche", pharma ? "Substances par nom, nature, saveur, tropisme." : "Points, points d’intersection, huit merveilleux vaisseaux.", () => call("toggleAdvancedSearchPanel")],
        ["Comparer A | B", "Plusieurs " + what + " côte à côte.", () => call("toggleComparisonPanel")],
        byId("pharmaCardsButton") && ["Cartes mémo", "Cartes de révision à imprimer, recto verso.", () => clickId("pharmaCardsButton")],
        !pharma && (admin || isPublic("trajets")) && ["Trajets", "Le trajet de chaque canal, en texte et en plan.", () => module("trajets"), "b"],
        !pharma && (admin || isPublic("trajets")) && ["Plan des intersections", "Les points d’intersection de chaque canal et les canaux qui s’y croisent ; le plan en colonnes, avec les six systèmes de Dr Tán et les canaux distincts.", () => { window.location.href = "trajets/plan.html"; }, "b"],
        pharma && (admin || isPublic("formules")) && ["Formules", "Les fiches des formules.", () => module("formules"), "b"],
        // fonctions jusque-là cachées dans les modules, mises en avant dans le menu
        !pharma && (admin || isPublic("trajets")) && ["Zones de correspondance", "Un lieu du corps, et tous les trajets qui y passent.", () => module("trajets", "lieux")],
        !pharma && window.MTCQuizTest && ["À revoir", "Les points arrivés à échéance, en quiz.", () => window.MTCQuizTest.startDueReviewQuiz()]
      ],
      suivi: [
        ["Statistiques", "Réussites, temps, évolution.", () => call("toggleStatsPanel")],
        ["Panier", "Les " + what + " mis" + (pharma ? "es" : "") + " de côté pour les revoir.", () => call("toggleReviewBasketPanel")],
        // collection : collection.js
        window.mtcOpenCollection && ["Collection", (pharma ? "Les substances" : "Les points") + " trouvé" + (pharma ? "es" : "s") + " dans les groupes, " + (pharma ? "classe par classe." : "canal par canal."), () => window.mtcOpenCollection()],
        ["Série", "Les jours de jeu d’affilée, rappel quotidien : " + reminderState() + ".", () => { clickId("mtcDailyReminderButton"); render(); }, null, null, true]
      ],
      reglages: [
        ["Affichage", "Thèmes de couleurs, son, prononciation.", openSettings],
        ["Aide", "Les tutoriels de chaque écran.", () => setTimeout(() => call("startTour"), 30)],
        // jeu principal : le dernier point choisi affiché quelques secondes, et son nom français lu en mode audio (point-caption.js)
        ["Nom du point choisi", "Dans la grille : le code, le pinyin et le nom français du dernier point choisi, quelques secondes. En mode audio : entendre le nom chinois, le nom français, ou les deux.", null, null,
          (() => {
            const cap = fxOn("mtc_point_caption"), capFn = () => { try{ localStorage.setItem("mtc_point_caption", cap ? "0" : "1"); }catch(e){} };
            capFn.stay = true;
            let voice = "both"; try{ voice = localStorage.getItem("mtc_point_voice") || "both"; }catch(e){}
            const voices = [["zh", "Chinois"], ["fr", "Français"], ["both", "Les deux"]].map(([v, label]) => {
              const fn = () => { try{ localStorage.setItem("mtc_point_voice", v); }catch(e){} };
              fn.stay = true;
              return [label + (voice === v ? " ✓" : ""), fn];
            });
            return [["Affichage : " + (cap ? "oui" : "non"), capFn]].concat(voices);
          })()],
        // guide d'installation en raccourci (install-guide.js)
        window.mtcOpenInstallGuide && ["Sur l’écran d’accueil", window.mtcIsInstalled && window.mtcIsInstalled() ? "Le jeu est installé sur cet appareil." : "Ajouter le jeu en raccourci, comme une application : le guide pour ton téléphone ou ton ordinateur.", () => window.mtcOpenInstallGuide()],
        // récompenses des bonnes réponses (celebrate.js) : un clic change le réglage sans fermer le menu
        // mode coach : le site s'ouvre sur l'entraînement du jour ; désactivé, il s'ouvre sur la grille. Le choix est gardé sur l'appareil.
        ["Mode coach", "À l’ouverture, un entraînement varié chaque jour, sur des sujets différents. Désactivé : le site s’ouvre sur la grille.", null, null,
          (() => { const on = fxOn("mtc_coach"), fn = () => { try{ localStorage.setItem("mtc_coach", on ? "0" : "1"); }catch(e){} }; fn.stay = true; return [["Mode coach : " + (on ? "oui" : "non"), fn]]; })()],
        ["Sons et vibration", "À chaque réponse : un son doux, une petite vibration du téléphone.", null, null,
          [["mtc_fx_sound", "Sons"], ["mtc_fx_vibrate", "Vibration"]].map(([key, label]) => {
            const on = fxOn(key), fn = () => { try{ localStorage.setItem(key, on ? "0" : "1"); }catch(e){} if(!on && key === "mtc_fx_sound" && window.mtcPlayFx) window.mtcPlayFx("good"); };
            fn.stay = true;
            return [label + " : " + (on ? "oui" : "non"), fn];
          })],
        admin && byId("mtcGithubSyncButton") && ["Synchronisation", "Tes notes sur plusieurs appareils.", () => clickId("mtcGithubSyncButton")],
        admin && ["Soutiens", "Les prénoms de « Projet soutenu par » (en bas du menu) : modifier et publier.", editSupporters],
        ["Notes", "Exporter ou importer tes notes et images, ou les partager avec les contributeur·ices." + notesStatus(), null, null, [["Exporter", () => call("exportPersonalNotes")], ["Importer", () => call("openImportPersonalNotesDialog")], ["Partager", () => call("mtcShareNotes")]]],
        ["Corrections", "Les commentaires publics des modules bêta.", () => window.open(DISCUSSIONS_URL, "_blank", "noopener")],
        byId("mtcOfflineButton") && ["Hors connexion", "Préparer le jeu pour jouer sans internet.", () => clickId("mtcOfflineButton")],
        // mêmes montants que la goutte de sang (04-03-core-game.js : mtcSupportAmounts, mtcSupportAmountUrl)
        ["Soutenir le projet", "Ce jeu est gratuit et sans publicité. Je l’ai conçu dans un esprit d’entraide : la construction de la base de données m’a pris à elle seule plusieurs mois. Toute contribution est bienvenue et me permettra de nourrir mon sang pendant le développement d’autres outils similaires 🙏. Pour figurer parmi les mécènes, indique ton prénom ou alias dans la note PayPal.", null, null,
          (window.mtcSupportAmounts || [3, 5, 10]).concat([0]).map(v => [v ? v + " €" : "Montant libre", () => giveSupport(v)])]
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
    portrait();
  }
  function domainSwitchHtml(){
    const pharma = isPharma();
    return '<span class="mtc-domain-switch"><button type="button" data-domain="acupuncture" class="' + (pharma ? "" : "on") + '">Acu</button>/' +
      '<button type="button" data-domain="pharmacology" class="' + (pharma ? "on" : "") + '">Pharma</button></span>';
  }
  // « Soutenir le projet » : mon portrait en trame de points, aux couleurs du thème (points du halo sur le fond) ;
  // un petit rebond à l'ouverture du menu, il se penche au survol. Rien si l'image n'est pas là.
  function portrait(){
    menu.querySelectorAll(".mm-item").forEach(b => {
      const n = b.querySelector(".mm-n");
      if(!n || !/^Soutenir le projet/.test(n.textContent) || b.querySelector(".mm-portrait")) return;
      const img = new Image();
      img.onload = () => {
        const p = document.createElement("span"); p.className = "mm-portrait"; p.setAttribute("aria-hidden", "true");
        b.classList.add("mm-has-portrait"); b.insertBefore(p, b.firstChild);
      };
      img.src = "portrait-trame.png";
    });
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
  // Menu ouvert depuis la page d'entraînement (accueil/, lien #ouvrir-menu) : le fermer sans rien choisir ramène à cette page,
  // qui remplace la grille tant que le mode coach est actif.
  let fromTraining = false;
  function backToTraining(){
    if(!fromTraining) return;
    fromTraining = false;
    if(fxOn("mtc_coach")) window.location.replace("accueil/index.html");
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
    if(t.closest("#mtcMenuClose")){ close(); backToTraining(); return; }
    const d = t.closest("[data-domain]");
    if(d){ setDomain(d.dataset.domain); return; }
    const en = t.closest(".mm-entry");
    if(en){ tab = en.dataset.tab; try{ localStorage.setItem(TAB_KEY, tab); }catch(error){} render(); return; }
    const row = t.closest(".mm-item");
    if(!row) return;
    const it = (current[row.dataset.k] || [])[+row.dataset.i];
    if(!it) return;
    const sub = t.closest(".mm-sub");
    if(it[4]){ if(sub){ const fn = it[4][+sub.dataset.sub][1]; if(fn.stay){ fn(); render(); } else { fromTraining = false; close(); fn(); } } return; }
    if(!it[2]) return;
    fromTraining = false;
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
  // don depuis Réglages → Soutenir le projet : même lien PayPal que la goutte, et la goutte se range comme après un don
  function giveSupport(v){
    try{ if(typeof markSupportCoffeeClicked === "function") markSupportCoffeeClicked(); if(typeof hideSupportBloodDrop === "function") hideSupportBloodDrop(); }catch(error){}
    try{ window.open(window.mtcSupportAmountUrl ? window.mtcSupportAmountUrl(v) : supportLink(), "_blank", "noopener,noreferrer"); }catch(error){}
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
    box.innerHTML = '<p><b>' + n + " jours de révision d’affilée, bravo !</b> Ce jeu est gratuit et sans publicité. " +
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
    const mail = byId("suggestionMailButton"), m = mail && mail.getBoundingClientRect();
    const panelOpen = [...document.querySelectorAll(BOTTOM_PANELS)].some(p => p.classList.contains("open"));
    const shown = !!(r && r.width && m && m.width && !panelOpen && getComputedStyle(drop).display !== "none" && getComputedStyle(drop).visibility !== "hidden");
    label.style.display = shown ? "" : "none";
    if(shown){
      // place de repos de la goutte : à gauche de l'enveloppe (la goutte peut bouger, le texte reste)
      const restLeft = m.left - 27 - (drop.offsetWidth || 28) / 2;
      label.style.right = Math.max(8, window.innerWidth - restLeft + 6) + "px";
      label.style.top = (m.top + m.height / 2) + "px";
    }
  }
  // panneaux du bas (la goutte animée s'y pose et rebondit ; la goutte au repos, elle, reste à sa place)
  const BOTTOM_PANELS = ".stats-panel, .advanced-search-panel, .review-basket-panel, .comparison-panel";
  function paintTopSwitch(){
    const host = byId("mtcTopDomainSwitch");
    if(host) host.innerHTML = domainSwitchHtml();
  }

  // la visite guidée : les boutons regroupés dans le menu sont remplacés par une étape « Menu »
  const MOVED = ["#mtcDailyReminderButton", ".topbar-row button[onclick*='toggleSettings()']", "#statsButton", "#advancedSearchButton",
    "#reviewBasketButton", "#comparisonButton", "#studyDomainSelect", "#fullscreenToggleButton", "#pharmaCardsButton",
    "#exportNotesButton", "#importNotesButton", "#mtcOfflineButton", "#cheatsheetButton", "[data-import-history-toggle]"];
  // recherche : le curseur se place tout de suite dans la barre de recherche à l'ouverture du panneau
  // recherche, panier, A|B en icônes, en bas au centre (ils ouvrent les panneaux habituels)
  function bottomIcons(){
    if(byId("mtcBottomIcons")) return;
    const svg = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
    const ICONS = [
      ["advancedSearchButton", "Recherche", svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>')],
      ["reviewBasketButton", "Panier", svg('<path d="M3.5 9h17l-1.8 10.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8 9l3-5.5M16 9l-3-5.5"/>')],
      ["comparisonButton", "Comparer A | B", svg('<rect x="3" y="5" width="7.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="7.5" height="14" rx="1.5"/>')]
    ];
    // collection (collection.js) : un petit atlas de pastilles, certaines allumées
    if(window.mtcOpenCollection) ICONS.push(["__collection", "Collection", svg('<circle cx="5.5" cy="6" r="2.2" fill="currentColor"/><circle cx="12" cy="6" r="2.2"/><circle cx="18.5" cy="6" r="2.2" fill="currentColor"/><circle cx="5.5" cy="12.5" r="2.2"/><circle cx="12" cy="12.5" r="2.2" fill="currentColor"/><circle cx="18.5" cy="12.5" r="2.2"/><circle cx="5.5" cy="19" r="2.2" fill="currentColor"/><circle cx="12" cy="19" r="2.2"/><circle cx="18.5" cy="19" r="2.2"/>')]);
    const box = document.createElement("nav");
    box.id = "mtcBottomIcons";
    box.setAttribute("aria-label", "Outils de révision");
    box.innerHTML = ICONS.map(([id, label, icon]) => '<button type="button" data-for="' + id + '" title="' + label + '" aria-label="' + label + '">' + icon + "</button>").join("");
    box.addEventListener("click", e => { const b = e.target.closest("[data-for]"); if(!b) return; if(b.dataset.for === "__collection") window.mtcOpenCollection(); else clickId(b.dataset.for); });
    document.body.appendChild(box);
  }
  // mot cherché surligné en fluo dans la fiche ouverte (sans tenir compte des accents ni des majuscules)
  const fold = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function searchTerms(){
    const panel = byId("advancedSearchPanel");
    const input = panel && [...panel.querySelectorAll('input[type="search"], input[type="text"], input:not([type])')].find(i => i.value.trim());
    if(!input) return null;
    const q = fold(input.value).replace(/\s+/g, " ").trim();
    return {phrase:q.includes(" ") ? q : null, words:q.split(/[\s,;]+/).filter(w => w.length >= 3)};
  }
  function clearSearchMarks(root){
    if(window.CSS && CSS.highlights) CSS.highlights.delete("mtc-search");
    (root || document).querySelectorAll(".mtc-search-excerpt").forEach(x => x.remove());
    (root || document).querySelectorAll("mark.mtc-search-mark").forEach(m => m.replaceWith(...m.childNodes));
  }
  // texte sans accents, avec la position de chaque caractère dans le texte d'origine
  function flatten(text){
    let flat = "", map = [];
    for(let i = 0; i < text.length; i++){ const f = fold(text[i]); for(const c of f){ flat += c; map.push(i); } }
    return {flat, map};
  }
  function findIn(text, terms){
    const {flat, map} = flatten(text), hits = [];
    terms.forEach(w => {
      let at = flat.indexOf(w);
      while(at >= 0){ hits.push([map[at], map[at + w.length - 1] + 1]); at = flat.indexOf(w, at + w.length); }
    });
    return hits.sort((a, b) => a[0] - b[0]);
  }
  function collect(content, terms){
    const ranges = [], areas = [];
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {acceptNode:n =>
      n.parentElement.closest("script, style, textarea, button, .mtc-contrib, .mtc-search-excerpt") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
    for(let n = walker.nextNode(); n; n = walker.nextNode()){
      findIn(n.data, terms).forEach(([s, e]) => { const r = document.createRange(); r.setStart(n, s); r.setEnd(n, e); ranges.push(r); });
    }
    // champs modifiables (zones de texte) : on ne peut pas y surligner, on montre un extrait au-dessus
    content.querySelectorAll("textarea").forEach(ta => {
      if(ta.closest(".mtc-contrib") || !ta.value) return;
      const hits = findIn(ta.value, terms);
      if(hits.length) areas.push({ta, hits});
    });
    return {ranges, areas};
  }
  function excerptHtml(text, hits){
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return hits.slice(0, 3).map(([s, e]) => {
      let a = Math.max(0, s - 70), b = Math.min(text.length, e + 70);
      // l'extrait commence et finit sur des mots entiers
      if(a > 0){ const sp = text.slice(a, s).search(/\s/); if(sp >= 0) a += sp + 1; }
      if(b < text.length){ const sp = text.slice(e, b).search(/\s\S*$/); if(sp >= 0) b = e + sp; }
      return (a > 0 ? "… " : "") + esc(text.slice(a, s)) + '<mark class="mtc-search-mark">' + esc(text.slice(s, e)) + "</mark>" + esc(text.slice(e, b)) + (b < text.length ? " …" : "");
    }).join("<br>");
  }
  function highlightFiche(){
    const content = byId("pointPanelContent");
    if(!content) return;
    clearSearchMarks(content);
    const terms = searchTerms();
    if(!terms || (!terms.phrase && !terms.words.length)) return;
    // l'expression entière d'abord ; ses mots un par un seulement si elle n'est nulle part dans la fiche
    let found = terms.phrase ? collect(content, [terms.phrase]) : {ranges:[], areas:[]};
    if(!found.ranges.length && !found.areas.length && terms.words.length) found = collect(content, terms.words);
    const {ranges, areas} = found;
    if(!ranges.length && !areas.length) return;
    const excerpts = areas.map(({ta, hits}) => {
      const box = document.createElement("div");
      box.className = "mtc-search-excerpt";
      box.innerHTML = excerptHtml(ta.value, hits);
      ta.parentNode.insertBefore(box, ta);
      const d = ta.closest("details"); if(d) d.open = true;
      // la zone de texte défile aussi jusqu'au mot
      try{ ta.scrollTop = Math.max(0, ta.scrollHeight * hits[0][0] / ta.value.length - ta.clientHeight / 2); }catch(e){}
      return box;
    });
    // rubriques repliées qui contiennent le mot : ouvertes
    ranges.forEach(r => { const d = r.startContainer.parentElement.closest("details"); if(d) d.open = true; });
    // balises <mark> (marche dans tous les navigateurs, y compris Firefox et les tablettes) ; de la fin vers le début
    // pour que les positions dans un même texte restent justes
    const marks = [];
    ranges.slice().reverse().forEach(r => { const m = document.createElement("mark"); m.className = "mtc-search-mark"; try{ r.surroundContents(m); marks.unshift(m); }catch(e){} });
    // la fiche descend jusqu'au premier mot trouvé (après l'ouverture du panneau)
    const first = [marks[0], excerpts[0]].filter(Boolean).sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)[0];
    if(first) [80, 700].forEach(ms => setTimeout(() => { if(first.isConnected) first.scrollIntoView({block:"center", behavior:ms > 100 ? "smooth" : "auto"}); }, ms));
  }
  function watchSearchHighlight(){
    const content = byId("pointPanelContent");
    if(!content || content.dataset.mtcSearchMark) return;
    content.dataset.mtcSearchMark = "1";
    let timer = 0;
    const later = () => { clearTimeout(timer); timer = setTimeout(highlightFiche, 120); };
    new MutationObserver(later).observe(content, {childList:true});
    const panel = byId("advancedSearchPanel");
    if(panel) panel.addEventListener("input", later);
  }
  function watchSearchFocus(){
    const panel = byId("advancedSearchPanel");
    if(!panel || panel.dataset.mtcFocusWatch) return;
    panel.dataset.mtcFocusWatch = "1";
    let wasOpen = panel.classList.contains("open"), until = 0;
    // le contenu du panneau est (re)dessiné juste après l'ouverture : on remet le curseur tant que la personne n'a rien touché
    const focusInput = () => {
      if(!panel.classList.contains("open") || Date.now() > until || panel.contains(document.activeElement)) return;
      const input = [...panel.querySelectorAll('input[type="search"], input[type="text"], input:not([type])')].find(i => i.offsetParent !== null);
      if(input){ try{ input.focus({preventScroll:true}); }catch(e){} }
    };
    new MutationObserver(() => {
      const open = panel.classList.contains("open");
      if(open && !wasOpen){ until = Date.now() + 1500; [60, 250, 600, 1200].forEach(ms => setTimeout(focusInput, ms)); }
      wasOpen = open;
    }).observe(panel, {attributes:true, attributeFilter:["class"]});
    new MutationObserver(() => setTimeout(focusInput, 0)).observe(panel, {childList:true, subtree:true});
    panel.addEventListener("pointerdown", () => { until = 0; });
  }
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
      {selector:"#mtcStreakCorner", title:"Série", text:"Le nombre de jours de jeu d’affilée. Clique sur la série pour ouvrir le Suivi et activer le rappel quotidien.", position:"aboveBottom"});
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
      const dropGround = () => {
        const r = mailBox(), h = drop.offsetHeight || 30;
        let g = r ? r.top + (r.height - h) / 2 : window.innerHeight - h - 12;
        document.querySelectorAll(BOTTOM_PANELS).forEach(p => {
          if(!p.classList.contains("open")) return;
          const pr = p.getBoundingClientRect();
          if(pr.top > 0 && pr.top < window.innerHeight && pr.height > 40) g = Math.min(g, pr.top - h + 2);
        });
        return g;
      };
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
    setInterval(() => { if(!document.hidden) ensureSupportLabel(); }, 1500);
    watchSearchHighlight();
    window.addEventListener("resize", ensureSupportLabel);
    const badge = byId("dailyStreakBadge");
    if(badge) new MutationObserver(paintStreak).observe(badge, {childList:true, subtree:true, characterData:true});
    window.addEventListener("storage", e => { if(e.key === "mtc_daily_streak_v1") paintStreak(); });
    new MutationObserver(() => { paintTopSwitch(); if(menu && menu.classList.contains("open")) render(); })
      .observe(document.documentElement, {attributes:true, attributeFilter:["data-study-domain"]});
    document.addEventListener("keydown", e => { if(e.key === "Escape" && menu && menu.classList.contains("open")){ close(); backToTraining(); } });
    arrangeControls();
    watchSearchFocus();
    bottomIcons();
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
  // lien direct depuis une autre page (barre d'outils des modules, accueil) : index.html#ouvrir-recherche, -memo, -comparer…
  function openFromHash(){
    const m = /^#ouvrir-([a-z]+)$/.exec(location.hash);
    if(!m) return;
    const action = {memo:() => call("openCheatsheetPanel"), recherche:() => call("toggleAdvancedSearchPanel"), comparer:() => call("toggleComparisonPanel"), cartes:() => clickId("pharmaCardsButton"),
      stats:() => call("toggleStatsPanel"), panier:() => call("toggleReviewBasketPanel"), collection:() => call("mtcOpenCollection"), quiz:() => { if(window.MTCQuizTest) window.MTCQuizTest.open(); }, menu:() => { fromTraining = true; open(); }, revoir:() => { if(window.MTCQuizTest) window.MTCQuizTest.startDueReviewQuiz(); }}[m[1]];
    try{ history.replaceState(null, "", location.pathname + location.search); }catch(error){}
    if(action) setTimeout(action, m[1] === "menu" ? 0 : 700);
  }
  if(document.readyState === "complete") openFromHash(); else window.addEventListener("load", openFromHash);
  window.addEventListener("hashchange", openFromHash);
})();
