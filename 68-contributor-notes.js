/* ============================================================
   68-contributor-notes.js
   Mode contributeur (modules bêta Trajets / Formules) : une personne
   qui accepte de contribuer accède, dans les fiches des points et des
   substances, aux notes partagées :
   - les notes perso de l'admin (notes-admin.js, signées « emesepap, admin ») ;
   - un fil « Notes des contributeurs » par fiche (giscus), où chaque note
     est signée du nom de profil GitHub de son auteur, pour pouvoir le
     contacter en cas d'incompréhension.
   Visible seulement pour l'admin, ou pour tous quand MTC_BETA.public.
   ============================================================ */
(function(){
  "use strict";
  const KEY = "mtc_contributor_v1";
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const LABELS = {
    points:{esprits:"Esprit", notes:"Notes", associations:"Associations", vs:"VS.", precautions:"Précautions"},
    pharma:{esprits:"Esprit", notes:"Notes", associations:"Associations", formules:"Formules", vs:"VS.", precautions:"Précaution", synonymes:"Synonymes",
      syntheses:"Synthèse", ingredients:"Ingrédients", recherches_modernes:"Recherches modernes", indications:"Indications", contre_indications:"Contre-indications", preparations:"Préparation"}
  };
  // une couleur fixe par auteur (calculée depuis son nom) : ses notes sont reconnaissables sans répéter sa signature
  function authorColor(name){
    let h = 0;
    for(const ch of String(name || "")) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return "hsl(" + (h % 360) + ", 62%, 42%)";
  }
  const isAdmin = () => { try{ return localStorage.getItem("mtc_admin") === "1" || new URLSearchParams(location.search).get("admin") === "1"; }catch(e){ return false; } };
  const enabled = () => { const p = window.MTC_BETA && window.MTC_BETA.public; return isAdmin() || (p && typeof p === "object" ? Object.values(p).some(Boolean) : !!p); };
  const isContributor = () => { try{ return !!localStorage.getItem(KEY); }catch(e){ return false; } };

  let loading = null;
  function loadNotes(){
    if(window.MTC_SHARED_NOTES || loading) return;
    loading = new Promise(res => { const s = document.createElement("script"); s.src = "notes-admin.js?v=20261002"; s.onload = s.onerror = () => res(); document.head.appendChild(s); })
      .then(refresh);
  }
  function refresh(){
    try{ if(window.refreshCurrentPointPanel) window.refreshCurrentPointPanel(); }catch(e){}
    try{ if(window.refreshCurrentPharmaHerbPanel) window.refreshCurrentPharmaHerbPanel(); }catch(e){}
  }

  function style(){
    if(document.getElementById("mtcContribStyle")) return;
    const s = document.createElement("style");
    s.id = "mtcContribStyle";
    s.textContent = `
.mtc-contrib{ margin:8px 0 12px; text-align:left; font-size:.92em; }
.mtc-contrib-join{ font:inherit; font-size:.85em; font-weight:700; border:1px dashed currentColor; background:transparent; color:inherit; border-radius:999px; padding:3px 11px; cursor:pointer; opacity:.75; }
.mtc-contrib-join:hover{ opacity:1; }
.mtc-contrib details{ border:1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius:12px; padding:6px 12px; }
.mtc-contrib summary{ cursor:pointer; font-weight:800; }
.mtc-contrib h5{ margin:10px 0 2px; font-size:.82em; text-transform:uppercase; letter-spacing:.04em; opacity:.7; }
.mtc-contrib .txt{ white-space:pre-line; margin:0; line-height:1.5; }
.mtc-contrib .legend{ margin:8px 0 4px; font-size:.82em; display:flex; align-items:center; gap:6px; opacity:.85; }
.mtc-contrib .dot{ width:11px; height:11px; border-radius:50%; background:var(--a); flex:none; }
.mtc-contrib .note{ border-left:4px solid var(--a); background:color-mix(in srgb, var(--a) 9%, transparent); border-radius:0 8px 8px 0; padding:4px 10px 6px; margin:6px 0; }
.mtc-contrib .note h5{ margin:2px 0; color:var(--a); opacity:1; }
.mtc-contrib .row{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:8px; }
.mtc-contrib .row button{ font:inherit; font-size:.85em; font-weight:700; border:1px solid currentColor; background:transparent; color:inherit; border-radius:999px; padding:3px 11px; cursor:pointer; }
.mtc-contrib .row .quit{ border:0; text-decoration:underline; font-weight:400; opacity:.6; padding:0; }
.mtc-contrib-veil{ position:fixed; inset:0; z-index:1200; background:rgba(20,18,40,.55); display:flex; align-items:center; justify-content:center; padding:16px; }
.mtc-contrib-box{ background:#fff; color:#111; max-width:540px; width:100%; border-radius:16px; padding:20px 22px; box-shadow:0 12px 40px rgba(0,0,0,.25); font:15px/1.55 "Archivo", system-ui, sans-serif; text-align:left; }
.mtc-contrib-box h2{ margin:0 0 6px; font-size:1.2rem; }
.mtc-contrib-box label{ display:flex; gap:9px; align-items:flex-start; margin:8px 0; cursor:pointer; }
.mtc-contrib-box input{ margin-top:4px; accent-color:#2b2bff; width:17px; height:17px; flex:none; }
.mtc-contrib-box .btns{ display:flex; gap:8px; justify-content:flex-end; margin-top:14px; }
.mtc-contrib-box button{ font:inherit; font-weight:700; border:1px solid #ccd; background:#fff; color:#111; border-radius:999px; padding:6px 14px; cursor:pointer; }
.mtc-contrib-box button.go{ background:#2b2bff; border-color:#2b2bff; color:#fff; }
.mtc-contrib-box button:disabled{ opacity:.4; cursor:default; }
.mtc-contrib-box a{ color:#2b2bff; }
`;
    document.head.appendChild(s);
  }

  function join(){
    style();
    const veil = document.createElement("div");
    veil.className = "mtc-contrib-veil";
    veil.innerHTML = '<div class="mtc-contrib-box" role="dialog" aria-modal="true" aria-labelledby="mtcContribTitle">' +
      '<h2 id="mtcContribTitle">Contribuer aux modules bêta</h2>' +
      "<p>En contribuant à Trajets et Formules, tu accèdes aux <b>notes des autres contributeurs</b> dans les fiches des points et des substances.</p>" +
      '<label><input type="checkbox" class="c1"><span>Je participe à la vérification et à l’amélioration des modules (corrections, vérifications, notes).</span></label>' +
      '<label><input type="checkbox" class="c2"><span>Mes notes seront signées de <b>mon nom de profil GitHub</b>, pour qu’on puisse me contacter en cas d’incompréhension. Pas encore de profil ? <a href="https://github.com/signup" target="_blank" rel="noopener">Créer un profil GitHub</a>.</span></label>' +
      '<label><input type="checkbox" class="c3"><span>J’utilise les notes des autres pour mon apprentissage et je ne les diffuse pas en dehors du jeu.</span></label>' +
      '<div class="btns"><button type="button" class="no">Annuler</button><button type="button" class="go" disabled>Je contribue</button></div></div>';
    document.body.appendChild(veil);
    const boxes = [...veil.querySelectorAll("input")], go = veil.querySelector(".go");
    boxes.forEach(b => b.addEventListener("change", () => { go.disabled = !boxes.every(x => x.checked); }));
    veil.querySelector(".no").addEventListener("click", () => veil.remove());
    go.addEventListener("click", () => {
      try{ localStorage.setItem(KEY, new Date().toISOString()); }catch(e){}
      veil.remove();
      loadNotes(); refresh();
    });
  }

  function block(domain, id, label){
    if(!enabled() || !id) return "";
    style();
    if(!isContributor()) return '<div class="mtc-contrib"><button type="button" class="mtc-contrib-join" data-contrib="join" title="Accéder aux notes des autres contributeurs">Contribuer — notes des contributeurs</button></div>';
    loadNotes();
    const shared = window.MTC_SHARED_NOTES, mine = shared && shared[domain] && shared[domain][id];
    const fields = mine ? Object.entries(mine) : [];
    const labels = LABELS[domain] || {};
    const author = (shared && shared.author) || "emesepap, admin", col = authorColor(author);
    return '<div class="mtc-contrib"><details' + (fields.length ? " open" : "") + "><summary>Notes des contributeurs" + (fields.length ? " (" + fields.length + ")" : "") + "</summary>" +
      (fields.length ? '<p class="legend"><span class="dot" style="--a:' + col + '"></span>' + esc(author) + "</p>" +
        fields.map(([k, v]) => '<div class="note" style="--a:' + col + '" title="' + esc(author) + '"><h5>' + esc(labels[k] || k) + '</h5><p class="txt">' + esc(v) + "</p></div>").join("")
        : (shared ? "<p class=\"txt\">Pas encore de note partagée sur cette fiche.</p>" : "<p class=\"txt\">Chargement…</p>")) +
      '<div class="row"><button type="button" data-contrib="thread" data-domain="' + domain + '" data-id="' + esc(id) + '" data-label="' + esc(label || id) + '">Notes signées des contributeurs</button>' +
      '<button type="button" class="quit" data-contrib="quit">ne plus contribuer</button></div></details></div>';
  }

  // points : à la suite de l'éditeur admin de la fiche (05-04-final-corrections.js appelle ce crochet)
  const origRender = window.renderMtcFullRecordEditor;
  window.renderMtcFullRecordEditor = function(domain, id, details){
    const base = typeof origRender === "function" ? origRender(domain, id, details) : "";
    const label = details ? [id, details.pinyin].filter(Boolean).join(" · ") : id;
    return base + block(domain === "acupuncture" ? "points" : domain, id, label);
  };
  // substances : sous l'en-tête de la fiche (24-22-pharma-herb-panel.js appelle ce crochet)
  const origDecorate = window.mtcFicheAdminDecorate;
  window.mtcFicheAdminDecorate = function(domain, id, container, rerender){
    if(typeof origDecorate === "function") origDecorate(domain, id, container, rerender);
    if(!container || !enabled()) return;
    const anchor = container.querySelector(".mtc-fiche-admin") || container.querySelector(".pharma-herb-header");
    const herb = (window.PHARMA_HERBS || []).find(h => h && h.id === id);
    if(anchor) anchor.insertAdjacentHTML("afterend", block(domain, id, herb ? (herb.pinyin || id) : id));
  };

  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-contrib]");
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.contrib;
    if(a === "join") join();
    else if(a === "quit"){ try{ localStorage.removeItem(KEY); }catch(err){} refresh(); }
    else if(a === "thread" && window.mtcOpenCorrections){
      const kind = b.dataset.domain === "pharma" ? "substance" : "point";
      window.mtcOpenCorrections("Notes — " + kind + " " + b.dataset.id, b.dataset.label, "notes");
    }
  }, true);
  if(isContributor() && enabled()) loadNotes();
})();
