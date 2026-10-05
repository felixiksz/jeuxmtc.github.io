/* ============================================================
   beta-gate.js
   Accès aux modules bêta (Trajets, Formules) et panneau
   « Corrections » (commentaires publics giscus).
   - admin (?admin=1, mémorisé) : accès complet, outils d'édition ;
   - joueur : seulement si MTC_BETA.public, après avoir accepté la
     phase bêta et le principe des commentaires de correction publics ;
   - sinon : « Page réservée ».
   Utilisation dans une page : mtcBetaGate({module:"trajets", title:"Trajets des canaux"})
   renvoie false si la page doit s'arrêter.
   ============================================================ */
(function(){
  "use strict";
  const CONSENT_KEY = "mtc_beta_consent_v1";
  const cfg = () => window.MTC_BETA || {public:false, giscus:{}};
  // ouverture aux joueurs : un booléen pour tous les modules, ou un objet {trajets, formules}
  const isPublic = module => { const p = cfg().public; return p && typeof p === "object" ? (module ? !!p[module] : Object.values(p).some(Boolean)) : !!p; };
  window.mtcBetaIsPublic = isPublic;
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function isAdmin(){
    try{
      const q = new URLSearchParams(location.search).get("admin");
      if(q === "1") localStorage.setItem("mtc_admin", "1");
      else if(q === "0") localStorage.removeItem("mtc_admin");
      return localStorage.getItem("mtc_admin") === "1" || q === "1";
    }catch(e){ return new URLSearchParams(location.search).get("admin") === "1"; }
  }
  const consented = () => { try{ return !!localStorage.getItem(CONSENT_KEY); }catch(e){ return false; } };

  function style(){
    if(document.getElementById("mtcBetaStyle")) return;
    const s = document.createElement("style");
    s.id = "mtcBetaStyle";
    s.textContent = `
.mtc-beta-veil{ position:fixed; inset:0; z-index:1000; background:rgba(20,18,40,.55); display:flex; align-items:center; justify-content:center; padding:16px; }
.mtc-beta-box{ background:#fff; color:#111; max-width:520px; width:100%; border-radius:16px; padding:20px 22px; box-shadow:0 12px 40px rgba(0,0,0,.25); font:15px/1.55 "Archivo", system-ui, sans-serif; }
.mtc-beta-box h2{ margin:0 0 6px; font-size:1.25rem; }
.mtc-beta-box .b{ color:#2b2bff; font-weight:800; }
.mtc-beta-box p{ margin:0 0 10px; }
.mtc-beta-box label{ display:flex; gap:9px; align-items:flex-start; margin:8px 0; cursor:pointer; }
.mtc-beta-box input{ margin-top:4px; accent-color:#2b2bff; width:17px; height:17px; flex:none; }
.mtc-beta-box .row{ display:flex; gap:8px; justify-content:flex-end; margin-top:14px; flex-wrap:wrap; }
.mtc-beta-box button, .mtc-beta-box a.btn{ font:inherit; font-weight:700; border:1px solid #ccd; background:#fff; color:#111; border-radius:999px; padding:6px 14px; cursor:pointer; text-decoration:none; }
.mtc-beta-box button.go{ background:#2b2bff; border-color:#2b2bff; color:#fff; }
.mtc-beta-box button:disabled{ opacity:.4; cursor:default; }
.mtc-beta-box small{ color:#666; }
body.mtc-beta-player .admin-only, body.mtc-beta-player .edit-tools, body.mtc-beta-player #editToggle, body.mtc-beta-player .navrow input, body.mtc-beta-player .check-legend{ display:none !important; }
.mtc-corr-panel{ position:fixed; top:0; right:0; bottom:0; width:min(440px, 100vw); z-index:900; background:#fff; color:#111; box-shadow:-8px 0 30px rgba(0,0,0,.18); display:flex; flex-direction:column; font:14px/1.5 "Archivo", system-ui, sans-serif; transform:translateX(105%); transition:transform .2s ease; }
.mtc-corr-panel.open{ transform:none; }
.mtc-corr-panel header{ position:static; margin:0; display:flex; align-items:center; gap:8px; padding:12px 14px; border-bottom:1px solid #eee; }
.mtc-corr-panel header b{ flex:1; }
.mtc-corr-panel .x{ font:inherit; font-size:20px; border:0; background:none; cursor:pointer; }
.mtc-corr-panel .body{ overflow-y:auto; padding:12px 14px; flex:1; }
.mtc-corr-panel .hint{ color:#555; font-size:13px; margin:0 0 10px; }
.verifybtn{ font:inherit; font-size:.72rem; font-weight:700; margin-left:10px; border:1px solid #bfe3cb; background:#f2fbf4; color:#2c7a4b; border-radius:999px; padding:1px 9px; cursor:pointer; vertical-align:middle; white-space:nowrap; }
.verifybtn:hover{ border-color:#2c9a5c; }
.verifybtn.me{ background:#2c9a5c; border-color:#2c9a5c; color:#fff; }
@media (prefers-reduced-motion: reduce){ .mtc-corr-panel{ transition:none; } }
`;
    document.head.appendChild(s);
  }

  function showConsent(opts){
    style();
    const veil = document.createElement("div");
    veil.className = "mtc-beta-veil";
    veil.innerHTML = '<div class="mtc-beta-box" role="dialog" aria-modal="true" aria-labelledby="mtcBetaTitle">' +
      '<h2 id="mtcBetaTitle">' + esc(opts.title) + ' <span class="b">β</span></h2>' +
      "<p>Ce module est en <b>phase bêta</b> : il est encore en construction et en cours de vérification.</p>" +
      '<label><input type="checkbox" id="mtcBeta1"><span>J’ai compris que le contenu peut contenir des erreurs ou des imprécisions, et qu’il ne remplace pas le cours.</span></label>' +
      '<label><input type="checkbox" id="mtcBeta2"><span>J’accepte de signaler les erreurs que je repère en laissant des <b>commentaires de correction en ligne, visibles par tout le monde</b> (bouton « Corrections »). <small>Un compte GitHub est nécessaire pour écrire.</small></span></label>' +
      '<div class="row"><a class="btn" href="../index.html">Retour au jeu</a><button type="button" class="go" id="mtcBetaGo" disabled>J’accepte et j’entre</button></div></div>';
    document.body.appendChild(veil);
    const c1 = veil.querySelector("#mtcBeta1"), c2 = veil.querySelector("#mtcBeta2"), go = veil.querySelector("#mtcBetaGo");
    const upd = () => { go.disabled = !(c1.checked && c2.checked); };
    c1.addEventListener("change", upd); c2.addEventListener("change", upd);
    go.addEventListener("click", () => {
      try{ localStorage.setItem(CONSENT_KEY, new Date().toISOString()); }catch(e){}
      veil.remove();
      if(typeof opts.onAccept === "function") opts.onAccept();
    });
    c1.focus();
  }

  // ---- panneau « Corrections » : fil de commentaires giscus propre à chaque élément ----
  let panel = null, currentTerm = "", currentMode = "";
  function openCorrections(term, label, mode){
    style();
    const g = cfg().giscus || {};
    if(!panel){
      panel = document.createElement("aside");
      panel.className = "mtc-corr-panel";
      panel.setAttribute("aria-label", "Commentaires de correction");
      panel.innerHTML = '<header><b>Corrections</b><button type="button" class="x" aria-label="Fermer">×</button></header><div class="body"></div>';
      document.body.appendChild(panel);
      panel.querySelector(".x").addEventListener("click", () => panel.classList.remove("open"));
    }
    const body = panel.querySelector(".body");
    panel.classList.add("open");
    if(term === currentTerm && body.querySelector(".giscus") && mode === currentMode) return;
    currentTerm = term; currentMode = mode;
    const intro = mode === "notes"
      ? '<p class="hint"><b>Notes des contributeur·ices — ' + esc(label) + '</b></p><p class="hint">Écris ta note ci-dessous : elle est visible par les contributeur·ices et signée de ton nom de profil GitHub, pour qu’on puisse te contacter en cas d’incompréhension. Indique ta source si possible (cours, livre, enseignant).</p>'
      : mode === "verify"
      ? '<p class="hint"><b>Vérifier « ' + esc(label) + ' »</b></p><p class="hint">Tu as comparé ce trajet au cours et à son illustration, et il est juste ? Connecte-toi puis réagis avec <b>👍 sous le titre de la discussion</b> : chaque 👍 compte comme une vérification, visible par tous. Tu as trouvé une erreur ? Laisse plutôt un commentaire de correction, avec ta source si possible.</p>'
      : '<p class="hint">Commentaires de correction pour <b>' + esc(label) + "</b>. Ils sont publics : indique ce qui te semble faux et, si possible, ta source (page du cours, livre). Merci !</p>";
    if(!(g.repo && g.repoId && g.categoryId)){
      body.innerHTML = intro + '<p class="hint"><b>Les commentaires ne sont pas encore activés.</b>' + (isAdmin() ? " (Admin : activer les Discussions du dépôt, installer l’app giscus, créer la catégorie « " + esc(g.category || "Corrections bêta") + " », puis renseigner categoryId dans beta-config.js.)" : "") + "</p>";
      return;
    }
    body.innerHTML = intro + '<div class="giscus"></div>';
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    Object.entries({"data-repo":g.repo, "data-repo-id":g.repoId, "data-category":g.category, "data-category-id":g.categoryId,
      "data-mapping":"specific", "data-term":term, "data-strict":"1", "data-reactions-enabled":"1", "data-emit-metadata":"1",
      "data-input-position":"top", "data-theme":"light", "data-lang":"fr", "data-loading":"lazy"}).forEach(([k, v]) => s.setAttribute(k, v));
    body.appendChild(s);
  }

  const VKEY = "mtc_verify_counts_v1";
  const vcache = () => { try{ return JSON.parse(localStorage.getItem(VKEY) || "{}"); }catch(e){ return {}; } };
  function paintVerify(root){
    const c = vcache();
    (root || document).querySelectorAll(".verifybtn[data-verify]").forEach(b => {
      const v = c[b.dataset.verify], n = v ? v.n : 0;
      b.classList.toggle("me", !!(v && v.me));
      b.querySelector("span").textContent = n ? "vérifié par " + n : "Vérifier";
      b.title = (v && v.me ? "Tu as vérifié ce trajet. " : "") + (n ? n + " vérification" + (n > 1 ? "s" : "") + " publique" + (n > 1 ? "s" : "") : "Vérifier ce trajet (vérification publique)");
    });
  }
  window.addEventListener("message", e => {
    if(e.origin !== "https://giscus.app" || !e.data || !e.data.giscus || !e.data.giscus.discussion || !currentTerm) return;
    const r = (e.data.giscus.discussion.reactions || {}).THUMBS_UP || {};
    const c = vcache();
    c[currentTerm] = {n:r.count || 0, me:!!r.viewerHasReacted, at:Date.now()};
    try{ localStorage.setItem(VKEY, JSON.stringify(c)); }catch(err){}
    paintVerify();
  });
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".verifybtn[data-verify]");
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    openCorrections(b.dataset.verify, b.dataset.label || b.dataset.verify, "verify");
  }, true);
  window.mtcPaintVerify = paintVerify;

  window.mtcBetaGate = function(opts){
    style();
    const admin = isAdmin();
    if(admin) return true;
    if(!isPublic(opts && opts.module)){
      document.body.innerHTML = '<p style="padding:24px;font-family:system-ui,sans-serif">Page réservée.</p>';
      return false;
    }
    document.body.classList.add("mtc-beta-player");
    // retour au jeu sans passer en mode admin
    document.querySelectorAll('a[href*="index.html?admin=1"]').forEach(a => { a.href = "../index.html"; });
    if(!consented()) showConsent(opts || {});
    return true;
  };
  window.mtcBetaConsented = consented;
  window.mtcIsAdminPage = isAdmin;
  window.mtcOpenCorrections = openCorrections;
})();
