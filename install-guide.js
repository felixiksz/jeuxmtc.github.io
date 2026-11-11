/* ============================================================
   install-guide.js
   Guide « Sur l'écran d'accueil » : comment ajouter le jeu en raccourci
   (application installée) selon l'appareil et le navigateur. L'appareil
   détecté est présenté en premier, les autres restent dépliables.
   Si le navigateur le permet (Chrome, Edge, Samsung…), un bouton installe
   directement. Ouverture : Menu → Réglages → Sur l'écran d'accueil
   (window.mtcOpenInstallGuide).
   ============================================================ */
(function(){
  "use strict";
  if(window.mtcOpenInstallGuide) return;
  let deferred = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", () => { deferred = null; const el = document.getElementById("mtcInstall"); if(el) render(el); });
  const installed = () => { try{ return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }catch(e){ return false; } };
  window.mtcIsInstalled = installed;

  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const samsung = /SamsungBrowser/.test(ua), firefox = /Firefox|FxiOS/.test(ua);
  const mac = /Macintosh/.test(ua) && !ios, safari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|FxiOS|Firefox/.test(ua);

  const GUIDES = [
    {id:"iphone", title:"iPhone et iPad", steps:[
      "Ouvre le jeu dans Safari (ou dans Chrome, Firefox ou Edge si ton iPhone est à jour).",
      "Touche le bouton Partager : le carré avec une flèche vers le haut, en bas de l’écran (en haut sur iPad, ou dans le menu ⋯).",
      "Fais défiler et touche « Sur l’écran d’accueil ».",
      "Garde le nom proposé et touche « Ajouter » : l’icône du jeu apparaît sur ton écran d’accueil."
    ]},
    {id:"android", title:"Android : Chrome, Brave, Edge", steps:[
      "Ouvre le jeu dans le navigateur.",
      "Touche le menu ⋮ (en haut à droite, ou en bas selon le navigateur).",
      "Touche « Installer l’application » ou « Ajouter à l’écran d’accueil ».",
      "Confirme avec « Installer » : l’icône du jeu apparaît avec tes applications."
    ]},
    {id:"samsung", title:"Android : Samsung Internet", steps:[
      "Touche le menu ≡ en bas de l’écran.",
      "Touche « Ajouter la page à », puis « Écran d’accueil ».",
      "Confirme avec « Ajouter »."
    ]},
    {id:"firefox", title:"Android : Firefox", steps:[
      "Touche le menu ⋮.",
      "Touche « Installer » ou « Ajouter à l’écran d’accueil ».",
      "Confirme avec « Ajouter »."
    ]},
    {id:"pc", title:"Ordinateur : Chrome, Edge, Brave", steps:[
      "Clique sur l’icône d’installation à droite de la barre d’adresse (un petit écran avec une flèche).",
      "Ou bien : menu ⋮ → « Enregistrer et partager » → « Installer la page en tant qu’application » (Chrome), ou menu ⋯ → « Applications » → « Installer ce site en tant qu’application » (Edge).",
      "Clique sur « Installer » : le jeu s’ouvre dans sa propre fenêtre et rejoint tes applications."
    ]},
    {id:"mac", title:"Mac : Safari", steps:[
      "Dans Safari (macOS Sonoma ou plus récent), clique sur le menu Fichier.",
      "Clique sur « Ajouter au Dock », puis sur « Ajouter » : le jeu s’ouvre ensuite comme une application."
    ]}
  ];
  const mine = ios ? "iphone" : samsung ? "samsung" : android && firefox ? "firefox" : android ? "android" : mac && safari ? "mac" : "pc";

  const css =
    "#mtcInstall{ position:fixed; inset:0; z-index:9900; background:var(--page-bg, #fcfcfa); color:var(--text-color); overflow:auto; -webkit-overflow-scrolling:touch; }" +
    "#mtcInstall .iw{ max-width:680px; margin:0 auto; padding:18px 20px 60px; line-height:1.6; }" +
    "#mtcInstall .ih{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }" +
    "#mtcInstall h2{ font:800 1.05rem 'Archivo', sans-serif; letter-spacing:.08em; text-transform:uppercase; margin:0; }" +
    "#mtcInstall h3{ font:800 .85rem 'Archivo', sans-serif; letter-spacing:.06em; text-transform:uppercase; margin:18px 0 6px; }" +
    "#mtcInstall .x, #mtcInstall .go{ font:700 .8rem 'Archivo', sans-serif; letter-spacing:.06em; text-transform:uppercase; background:none; border:0; color:inherit; cursor:pointer; }" +
    "#mtcInstall .go{ border:1.5px solid currentColor; border-radius:999px; padding:8px 16px; margin:6px 0 4px; }" +
    "#mtcInstall ol{ margin:0; padding-left:1.3em; } #mtcInstall li{ margin:4px 0; }" +
    "#mtcInstall details{ border-top:1px solid var(--hair, rgba(0,0,0,.08)); padding:8px 0; } #mtcInstall summary{ cursor:pointer; font-weight:700; }" +
    "#mtcInstall p, #mtcInstall li{ font-size:.92rem !important; line-height:1.6 !important; } #mtcInstall .sm{ font-size:.82rem !important; opacity:.75; }" +
    "body:has(#mtcInstall) #supportCoffeeButton, body:has(#mtcInstall) #mtcSupportLabel{ display:none !important; }";
  const steps = g => "<ol>" + g.steps.map(s => "<li>" + s + "</li>").join("") + "</ol>";
  function render(el){
    const first = GUIDES.find(g => g.id === mine), others = GUIDES.filter(g => g.id !== mine);
    el.innerHTML = '<div class="iw"><div class="ih"><h2>Sur l’écran d’accueil</h2><button type="button" class="x" id="mtcInstallClose">× Fermer</button></div>' +
      (installed()
        ? "<p>Le jeu est déjà installé sur cet appareil : tu l’ouvres depuis son icône.</p>"
        : "<p>Ajoute le jeu en raccourci : il s’ouvre comme une application, en plein écran, et fonctionne aussi sans internet une fois préparé (Menu → Réglages → Hors connexion).</p>") +
      (!installed() && deferred ? '<button type="button" class="go" id="mtcInstallNow">Installer maintenant</button><p class="sm">Ou suis les étapes ci-dessous.</p>' : "") +
      "<h3>" + first.title + " <span class=\"sm\">(ton appareil)</span></h3>" + steps(first) +
      '<h3>Autres appareils</h3>' + others.map(g => "<details><summary>" + g.title + "</summary>" + steps(g) + "</details>").join("") +
      '<p class="sm" style="margin-top:16px">Sur Android et sur ordinateur, le raccourci garde tes notes et ta progression. Sur iPhone et iPad, l’icône a sa propre mémoire : avant de l’utiliser, exporte tes notes depuis Safari (Menu → Réglages → Notes → Exporter), puis importe-les depuis l’icône.</p></div>';
    el.querySelector("#mtcInstallClose").addEventListener("click", () => el.remove());
    const go = el.querySelector("#mtcInstallNow");
    if(go) go.addEventListener("click", async () => { try{ deferred.prompt(); await deferred.userChoice; }catch(e){} deferred = null; render(el); });
  }
  window.mtcOpenInstallGuide = function(){
    if(!document.getElementById("mtcInstallStyle")){ const st = document.createElement("style"); st.id = "mtcInstallStyle"; st.textContent = css; document.head.appendChild(st); }
    let el = document.getElementById("mtcInstall");
    if(!el){ el = document.createElement("div"); el.id = "mtcInstall"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Sur l’écran d’accueil"); document.body.appendChild(el); }
    render(el);
  };
})();
