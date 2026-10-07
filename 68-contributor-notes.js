/* ============================================================
   68-contributor-notes.js
   Mode contributeur (modules bêta Trajets / Formules) : une personne
   qui accepte de contribuer accède, dans les fiches des points et des
   substances, aux notes partagées :
   - les notes perso de l'admin (notes-admin.js), intégrées directement dans le champ
     d'origine de la fiche, dans la couleur de l'autrice et signées de son nom
     (pas pour l'admin elle-même, ni ce que la personne a déjà dans ses propres notes) ;
   - un fil « Notes des contributeur·ices » par fiche (giscus), où chaque note
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
    loading = new Promise(res => { const s = document.createElement("script"); s.src = "notes-admin.js?v=20261007-b"; s.onload = s.onerror = () => res(); document.head.appendChild(s); })
      .then(() => { mergeIntoAdmin(); refresh(); });
  }
  let loadingContrib = null;
  function loadContrib(){
    if(window.MTC_CONTRIBUTIONS || loadingContrib) return;
    loadingContrib = fetch("contributions.json?t=" + Date.now(), {cache:"no-store"})
      .then(r => r.ok ? r.json() : {authors:{}}).catch(() => ({authors:{}}))
      .then(j => { window.MTC_CONTRIBUTIONS = j && j.authors ? j : {authors:{}}; refresh(); });
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
.mtc-contrib .row button{ font:inherit !important; font-size:.85em !important; font-weight:700 !important; text-transform:none !important; letter-spacing:0 !important; border:0 !important; background:transparent !important; box-shadow:none !important; color:inherit; padding:0 !important; margin:0 !important; text-decoration:underline; text-underline-offset:3px; cursor:pointer; }
.mtc-contrib .row button:hover{ transform:none !important; text-shadow:0 3px 12px var(--shadow-color, rgba(0,0,0,.2)); }
.mtc-contrib .row .quit{ font-weight:400 !important; opacity:.6; }
.mtc-shared-in{ color:var(--a); margin:4px 0 8px; text-align:left; }
.mtc-shared-in .txt{ white-space:pre-line; margin:0; line-height:1.5; }
.mtc-shared-in .by{ display:block; font-size:.78em; font-style:italic; opacity:.85; margin-top:2px; }
.mtc-contrib .by-legend{ font-size:.82em; color:var(--a); margin-right:4px; }
.mtc-contrib-veil{ position:fixed; inset:0; z-index:12000; background:rgba(20,18,40,.55); display:flex; align-items:center; justify-content:center; padding:16px; }
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
      '<h2 id="mtcContribTitle">Contribuer au jeu</h2>' +
      "<p>En contribuant aux fiches des points et des substances, et aux modules bêta (Trajets, Formules), tu accèdes aux <b>notes partagées</b> : elles apparaissent en couleur directement dans les champs des fiches, signées de leur auteur·ice. Tu peux partager les tiennes en un clic : Menu → Réglages → Notes → Partager.</p>" +
      '<label><input type="checkbox" class="c1"><span>Je participe à la vérification et à l’amélioration des fiches et des modules (corrections, vérifications, notes).</span></label>' +
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

  // sous l'en-tête : la légende de la couleur, le fil des notes signées et « ne plus contribuer » (les notes sont dans les champs)
  function block(domain, id, label){
    if(!enabled() || !id) return "";
    style();
    if(!isContributor() && !isAdmin()) return '<div class="mtc-contrib"><button type="button" class="mtc-contrib-join" data-contrib="join" title="Accéder aux notes partagées">Contribuer et afficher les contributions</button></div>';
    loadNotes();
    return '<div class="mtc-contrib"><div class="row">' +
      '<button type="button" data-contrib="thread" data-domain="' + domain + '" data-id="' + esc(id) + '" data-label="' + esc(label || id) + '">Notes signées des contributeur·ices</button>' +
      '<button type="button" class="quit" data-contrib="quit">ne plus contribuer</button></div></div>';
  }

  // notes partagées dans le champ d'origine de la fiche, dans la couleur de l'autrice
  const authorName = () => (window.MTC_SHARED_NOTES && window.MTC_SHARED_NOTES.author) || "emesepap, admin";
  // (les associations des substances viennent du cours : pas des notes de l'autrice, donc pas en couleur)
  const PHARMA_FIELDS = {esprits:"esprit", notes:"notes", associations:"associations", formules:"formules", vs:"vs", syntheses:"synthese", precautions:"precaution",
    ingredients:"ingredients", recherches_modernes:"recherches_modernes", indications:"indications", contre_indications:"contre_indications", preparations:"preparation", synonymes:"synonymes"};
  const POINT_KEYS = {notes:"mtc_point_note_", associations:"mtc_point_associations_", esprits:"mtc_point_esprit_", vs:"mtc_point_vs_", precautions:"mtc_point_precaution_"};
  const POINT_FIELDS = {notes:"Notes", associations:"Associations", esprits:"Esprit", vs:"VS", precautions:"Précaution"};
  const flat = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  // qui a des notes sur cette fiche : l'admin (sauf pour elle-même : ses notes sont dans ses champs, mergeIntoAdmin)
  // puis chaque contributeur·ice qui a partagé ses notes (contributions.json), chacun·e dans sa couleur
  function sourcesFor(domain, id){
    const list = [];
    if(!enabled() || !id || !(isContributor() || isAdmin())) return list;
    loadNotes(); loadContrib();
    const S = window.MTC_SHARED_NOTES;
    if(!isAdmin() && S && S[domain] && S[domain][id]){
      const fields = Object.assign({}, S[domain][id]);
      if(domain === "pharma") delete fields.associations;   // associations des substances : viennent du cours
      list.push({name:authorName().split(",")[0], color:authorColor(authorName()), fields});
    }
    const C = window.MTC_CONTRIBUTIONS;
    Object.entries((C && C.authors) || {}).forEach(([login, a]) => {
      const fields = a && a[domain] && a[domain][id];
      if(fields) list.push({name:login, color:authorColor(login), fields});
    });
    return list;
  }
  // seulement les lignes que la personne n'a pas déjà dans le champ (ni répétées dans la note elle-même)
  function freshPart(text, already){
    const have = flat(already), seen = new Set();
    return String(text || "").split(/\n\s*\n/).map(par => par.split("\n").filter(line => {
      const f = flat(line);
      if(!f) return false;
      if(seen.has(f) || (f.length > 2 && have.includes(f))) return false;
      seen.add(f);
      return true;
    }).join("\n")).filter(Boolean).join("\n\n");
  }
  function sharedHtml(text, src){
    return '<div class="mtc-shared-in" data-by="' + esc(src.name) + '" style="--a:' + src.color + '" title="Note partagée de ' + esc(src.name) + '"><p class="txt">' + esc(text) + '</p><span class="by">— ' + esc(src.name) + "</span></div>";
  }
  // à la suite du champ, ou de la dernière note partagée déjà affichée dans ce champ
  function placeShared(sec, box, html){
    const prev = [...sec.querySelectorAll(".mtc-shared-in")].pop();
    if(prev) insertInBox(prev, html);
    else if(box) insertInBox(box, html);
    else sec.insertAdjacentHTML("beforeend", html);
  }
  function insertInBox(box, html){
    box.insertAdjacentHTML("afterend", html);
    const el = box.nextElementSibling, cs = getComputedStyle(box);
    el.style.background = cs.backgroundColor;
    el.style.margin = "0 0 " + cs.marginBottom;
    el.style.padding = "2px " + cs.paddingRight + " " + cs.paddingBottom + " " + cs.paddingLeft;
    el.style.borderRadius = "0 0 " + cs.borderBottomRightRadius + " " + cs.borderBottomLeftRadius;
    el.style.width = box.offsetWidth ? box.offsetWidth + "px" : "";
    el.style.boxSizing = "border-box";
    box.style.marginBottom = "0";
    box.style.borderBottomLeftRadius = box.style.borderBottomRightRadius = "0";
  }
  function decoratePharma(container, id){
    const sources = sourcesFor("pharma", id);
    if(!container || !sources.length) return;
    style();
    sources.forEach(src => Object.entries(PHARMA_FIELDS).forEach(([k, field]) => {
      const sec = container.querySelector(".pharma-editable-" + field);
      if(!src.fields[k] || !sec || sec.querySelector('.mtc-shared-in[data-by="' + CSS.escape(src.name) + '"]')) return;
      const ta = sec.querySelector("textarea");
      const text = freshPart(src.fields[k], (ta ? ta.value : "") + "\n" + sec.textContent);
      if(text) placeShared(sec, ta, sharedHtml(text, src));
    }));
  }
  function decoratePoint(){
    const content = document.getElementById("pointPanelContent");
    let id = null;
    try{ id = currentPointPanelPoint; }catch(e){}
    // le même panneau sert aux substances : seulement pour une fiche de point
    if(!content || document.documentElement.getAttribute("data-study-domain") === "pharmacology" || content.querySelector(".pharma-herb-header")) return;
    const sources = sourcesFor("points", id);
    if(!sources.length) return;
    style();
    sources.forEach(src => Object.entries(POINT_FIELDS).forEach(([k, label]) => {
      if(!src.fields[k]) return;
      const sections = [...content.querySelectorAll("details.point-info-section")];
      let sec = sections.find(d => { const s = d.querySelector("summary"); return s && s.textContent.replace("✎", "").trim().toLowerCase().startsWith(label.toLowerCase()); });
      if(sec && sec.querySelector('.mtc-shared-in[data-by="' + CSS.escape(src.name) + '"]')) return;
      const ta = sec && sec.querySelector("textarea");
      let stored = "";
      try{ stored = localStorage.getItem(POINT_KEYS[k] + id) || ""; }catch(e){}
      const text = freshPart(src.fields[k], [stored, ta ? ta.value : "", sec ? sec.textContent : ""].join("\n"));
      if(!text) return;
      if(!sec){
        content.insertAdjacentHTML("beforeend", '<details class="point-info-section" open><summary>' + esc(label === "VS" ? "VS." : label) + "</summary></details>");
        sec = content.lastElementChild;
      }
      placeShared(sec, sec.querySelector(".acu-comparison-editable") || sec.querySelector(".point-note-display"), sharedHtml(text, src));
    }));
  }
  function watchPointPanel(){
    const content = document.getElementById("pointPanelContent");
    if(!content || content.dataset.mtcSharedWatch) return;
    content.dataset.mtcSharedWatch = "1";
    new MutationObserver(decoratePoint).observe(content, {childList:true});
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
    if(domain === "pharma") decoratePharma(container, id);
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
  // ADMIN : toutes les notes partagées sont les siennes. Une fois par version de notes-admin.js, les lignes qui
  // manquent dans ce navigateur sont ajoutées à ses propres champs (modifiables, sans couleur). Sauvegarde des
  // valeurs d'avant dans mtc_shared_merge_backup_v1.
  const MERGED_KEY = "mtc_shared_merged_v1";
  const ADMIN_FIELDS = {
    points:{notes:["mtc_point_note_", "notes"], associations:["mtc_point_associations_", "associations"], vs:["mtc_point_vs_", "vs"],
      esprits:["mtc_point_esprit_", "esprit"], precautions:["mtc_point_precaution_", "precaution"]},
    pharma:{esprits:["mtc_pharma_herb_esprit_", "esprit"], notes:["mtc_pharma_herb_notes_", "notes"], associations:["mtc_pharma_herb_associations_", "associations"],
      formules:["mtc_pharma_herb_formules_", "formules"], vs:["mtc_pharma_herb_vs_", "vs"], syntheses:["mtc_pharma_herb_synthese_", "synthese"],
      synonymes:["mtc_pharma_herb_synonymes_", "synonymes"], ingredients:["mtc_pharma_herb_ingredients_", "ingredients"],
      recherches_modernes:["mtc_pharma_herb_recherches_modernes_", "recherches_modernes"],
      // champs où le jeu ajoute déjà le texte de la fiche à la note : la note seule suffit
      precautions:["mtc_pharma_herb_precaution_", null], indications:["mtc_pharma_herb_indications_", null],
      contre_indications:["mtc_pharma_herb_contre_indications_", null], preparations:["mtc_pharma_herb_preparation_", null]}
  };
  function mergeIntoAdmin(){
    const S = window.MTC_SHARED_NOTES;
    if(!isAdmin() || !S) return;
    const version = S.exportedAt || "1";
    try{ if(localStorage.getItem(MERGED_KEY) === version) return; }catch(e){ return; }
    const record = (domain, id) => domain === "points"
      ? ((window.POINT_DETAILS || (typeof POINT_DETAILS !== "undefined" ? POINT_DETAILS : {}))[id] || {})
      : ((window.PHARMA_HERBS || []).find(h => h && h.id === id) || {});
    let backup = {};
    try{ backup = JSON.parse(localStorage.getItem("mtc_shared_merge_backup_v1") || "{}"); }catch(e){}
    let changed = 0;
    ["points", "pharma"].forEach(domain => Object.entries(S[domain] || {}).forEach(([id, fields]) => {
      Object.entries(fields).forEach(([k, text]) => {
        const map = ADMIN_FIELDS[domain][k];
        if(!map) return;
        const key = map[0] + id;
        const stored = localStorage.getItem(key);
        const base = stored !== null ? stored : (map[1] ? String(record(domain, id)[map[1]] || "") : "");
        const missing = freshPart(text, base);
        if(!missing) return;
        if(!(key in backup)) backup[key] = stored;
        localStorage.setItem(key, base.trim() ? base.replace(/\s+$/, "") + "\n\n" + missing : missing);
        changed++;
      });
    }));
    try{
      localStorage.setItem("mtc_shared_merge_backup_v1", JSON.stringify(backup));
      localStorage.setItem(MERGED_KEY, version);
    }catch(e){}
    if(changed) refresh();
  }
  const DISCUSSION_NEW = "https://github.com/felixiksz/jeuxmtc.github.io/discussions/new?category=contributions";
  const PUBLIC_FIELD = {precautions:"precaution", indications:"indications", contre_indications:"contre_indications", preparations:"preparation"};
  function collectMyNotes(){
    const out = {points:{}, pharma:{}};
    let n = 0;
    const points = window.POINT_DETAILS || (typeof POINT_DETAILS !== "undefined" ? POINT_DETAILS : {});
    const herbs = {}; (window.PHARMA_HERBS || []).forEach(h => { if(h && h.id) herbs[h.id] = h; });
    ["points", "pharma"].forEach(domain => Object.entries(ADMIN_FIELDS[domain]).forEach(([k, [prefix, field]]) => {
      for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if(!key || !key.startsWith(prefix)) continue;
        const id = key.slice(prefix.length);
        const rec = domain === "points" ? points[id] : herbs[id];
        if(!rec) continue;
        const published = String(rec[field || PUBLIC_FIELD[k]] || "");
        const mine = freshPart(localStorage.getItem(key) || "", published);
        if(!mine || flat(mine).length < 3) continue;
        (out[domain][id] = out[domain][id] || {})[k] = mine;
        n++;
      }
    }));
    return {notes:out, count:n};
  }
  function shareParts(notes){
    const entries = [];
    ["points", "pharma"].forEach(d => Object.entries(notes[d]).forEach(([id, f]) => entries.push([d, id, f])));
    const parts = [];
    let cur = {mtc_notes:1, points:{}, pharma:{}}, size = 0;
    entries.forEach(([d, id, f]) => {
      const s = JSON.stringify(f).length + id.length + 10;
      if(size + s > 55000 && size){ parts.push(cur); cur = {mtc_notes:1, points:{}, pharma:{}}; size = 0; }
      cur[d][id] = f; size += s;
    });
    parts.push(cur);
    return parts.map((p, i) => "Notes partagées depuis Connections MTC" + (parts.length > 1 ? " (partie " + (i + 1) + "/" + parts.length + ")" : "") +
      " : ne pas modifier le bloc ci-dessous.\n\n```json\n" + JSON.stringify(p) + "\n```\n");
  }
  async function copy(text){
    try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false; try{ ok = document.execCommand("copy"); }catch(e){} ta.remove(); return ok;
  }
  async function shareNotes(){
    style();
    if(!isContributor() && !isAdmin()){ join(); return; }
    const {notes, count} = collectMyNotes();
    if(!count){ window.alert("Aucune note perso à partager : tes notes ne diffèrent pas du contenu du jeu."); return; }
    const parts = shareParts(notes);
    const title = encodeURIComponent("Mes notes");
    let url = DISCUSSION_NEW + "&title=" + title;
    const direct = parts.length === 1 && parts[0].length < 5500;
    if(direct) url += "&body=" + encodeURIComponent(parts[0]);
    else await copy(parts[0]);
    window.open(url, "_blank", "noopener");
    const veil = document.createElement("div");
    veil.className = "mtc-contrib-veil";
    veil.innerHTML = '<div class="mtc-contrib-box" role="dialog" aria-modal="true"><h2>Partager mes notes</h2>' +
      "<p>" + count + " note" + (count > 1 ? "s" : "") + " perso à partager (seulement ce qui diffère du contenu du jeu).</p>" +
      (direct ? "<p>Sur la page GitHub qui vient de s’ouvrir, tes notes sont déjà dans le message : clique sur <b>« Start discussion »</b>.</p>"
        : "<p>Sur la page GitHub qui vient de s’ouvrir : clique dans le message, colle (<b>Ctrl+V</b>, ou appui long puis « Coller »), puis clique sur <b>« Start discussion »</b>.</p>" +
          (parts.length > 1 ? "<p>Tes notes sont en " + parts.length + " parties : publie la partie 1 comme ci-dessus, puis colle chaque partie suivante en commentaire de la même discussion.</p><p class=\"row\">" +
            parts.map((_, i) => '<button type="button" data-part="' + i + '">Copier la partie ' + (i + 1) + "</button>").join(" ") + "</p>" : "")) +
      "<p><small>Elles apparaîtront d’ici une à deux minutes chez les contributeur·ices, dans ta couleur, signées de ton nom GitHub. Pour les mettre à jour plus tard, partage à nouveau : les nouvelles remplacent les anciennes.</small></p>" +
      '<div class="btns"><button type="button" class="go" data-close>J’ai compris</button></div></div>';
    document.body.appendChild(veil);
    veil.addEventListener("click", async e => {
      const b = e.target.closest("button");
      if(!b) return;
      if(b.hasAttribute("data-close")) veil.remove();
      else if(b.dataset.part){ const ok = await copy(parts[+b.dataset.part]); b.textContent = ok ? "Partie " + (+b.dataset.part + 1) + " copiée" : "Copie impossible"; }
    });
  }
  window.mtcShareNotes = shareNotes;

  if((isContributor() || isAdmin()) && enabled()){ loadNotes(); loadContrib(); }
  if(window.MTC_SHARED_NOTES) mergeIntoAdmin();
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchPointPanel); else watchPointPanel();
})();
