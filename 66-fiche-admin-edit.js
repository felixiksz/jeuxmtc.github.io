/* ============================================================
   66-fiche-admin-edit.js
   Correction des fiches (points d'acupuncture et substances) en mode
   admin. Les corrections publiées sont dans fiches-corrections.js
   (lu par tout le monde) ; une correction enregistrée s'applique
   tout de suite sur l'appareil, puis « Publier » l'écrit dans le dépôt
   GitHub du site (clé GitHub gardée seulement dans le localStorage de
   l'appareil, jamais dans le code). « Exporter » télécharge le fichier
   si la publication n'est pas possible.
   ============================================================ */
(function(){
  "use strict";

  const LOCAL_KEY = "mtc_fiche_corrections_local_v1";
  const TOKEN_KEY = "mtc_admin_publish_token";
  const REPO = {owner:"felixiksz", repo:"jeuxmtc.github.io", branch:"main", path:"fiches-corrections.js"};

  const FIELDS = {
    points:[
      ["pinyin", "Pinyin"], ["hanzi", "Hanzi"], ["nom_francais", "Nom français"],
      ["localisation", "Localisation"], ["methode_localisation", "Méthode de localisation"], ["methode_travail", "Méthode de travail"],
      ["categories_du_point", "Catégories du point"], ["correspondances", "Correspondances"], ["actions", "Actions"],
      ["indications", "Indications"], ["associations", "Associations"], ["notes", "Notes"]
    ],
    pharma:[
      ["pinyin", "Pinyin"], ["hanzi", "Hanzi"], ["nom", "Nom"], ["nature", "Nature"], ["saveur", "Saveur"],
      ["tropisme", "Tropisme"], ["posologie", "Posologie"], ["actions", "Actions (une par ligne)"], ["esprit", "Esprit"],
      ["indications", "Indications"], ["contre_indications", "Contre-indications"], ["precaution", "Précaution"],
      ["associations", "Associations"], ["vs", "VS."], ["formules", "Formules"], ["synonymes", "Synonymes"],
      ["synthese", "Synthèse ZL"], ["ingredients", "Ingrédients"], ["recherches_modernes", "Recherches modernes"], ["preparation", "Préparation"]
    ]
  };
  const LIST_FIELDS = {pharma:new Set(["actions"])};

  const empty = () => ({points:{}, pharma:{}});
  const clone = value => JSON.parse(JSON.stringify(value));
  let PUBLISHED = normalize(window.MTC_FICHE_CORRECTIONS);
  let LOCAL = empty();
  try{ LOCAL = normalize(JSON.parse(localStorage.getItem(LOCAL_KEY) || "null")); }catch(error){}
  const ORIG = {};          // "domaine|id|champ" -> valeur d'avant correction
  const APPLIED = {};       // "domaine|id|champ" -> valeur appliquée
  let editing = null;       // "domaine|id" en cours d'édition

  function normalize(obj){
    const out = empty();
    if(obj && typeof obj === "object") ["points", "pharma"].forEach(d => { if(obj[d] && typeof obj[d] === "object") out[d] = clone(obj[d]); });
    return out;
  }
  function isAdmin(){
    try{
      const q = new URLSearchParams(window.location.search).get("admin");
      if(q === "0") return false;
      return q === "1" || localStorage.getItem("mtc_admin") === "1";
    }catch(error){ return false; }
  }
  function esc(value){
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  const same = (a, b) => JSON.stringify(a == null ? "" : a) === JSON.stringify(b == null ? "" : b);

  function recordOf(domain, id){
    if(domain === "points"){
      const all = window.POINT_DETAILS || (typeof POINT_DETAILS !== "undefined" ? POINT_DETAILS : null);
      return all ? all[id] || null : null;
    }
    return (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : []).find(h => h && h.id === id) || null;
  }
  function merged(){
    const out = clone(PUBLISHED);
    ["points", "pharma"].forEach(d => Object.entries(LOCAL[d]).forEach(([id, fields]) => { out[d][id] = Object.assign(out[d][id] || {}, fields); }));
    return out;
  }
  function originalOf(domain, id, field){
    const k = domain + "|" + id + "|" + field;
    if(k in ORIG) return ORIG[k];
    const rec = recordOf(domain, id);
    return rec ? rec[field] : undefined;
  }

  // applique (ou ré-applique) les corrections sur les données du jeu
  function applyAll(){
    const all = merged();
    ["points", "pharma"].forEach(domain => Object.entries(all[domain]).forEach(([id, fields]) => {
      const rec = recordOf(domain, id);
      if(!rec) return;
      let nameTouched = false;
      Object.entries(fields).forEach(([field, value]) => {
        const k = domain + "|" + id + "|" + field;
        // la synchro GitHub a pu remplacer la valeur : la nouvelle valeur devient l'original
        if(!(k in ORIG) || (k in APPLIED && !same(rec[field], APPLIED[k]))) ORIG[k] = rec[field] === undefined ? "" : clone(rec[field]);
        rec[field] = clone(value);
        APPLIED[k] = clone(value);
        if(domain === "points" && ["pinyin", "hanzi", "nom_francais"].includes(field)) nameTouched = true;
      });
      if(nameTouched && rec.nom_complet) rec.nom_complet = [rec.pinyin, rec.hanzi, rec.nom_francais].filter(Boolean).join(" ");
    }));
  }
  // une correction identique à l'original n'en est plus une
  function prune(obj){
    ["points", "pharma"].forEach(domain => Object.keys(obj[domain]).forEach(id => {
      Object.keys(obj[domain][id]).forEach(field => { if(same(obj[domain][id][field], originalOf(domain, id, field))) delete obj[domain][id][field]; });
      if(!Object.keys(obj[domain][id]).length) delete obj[domain][id];
    }));
    return obj;
  }
  function saveLocal(){ try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(LOCAL)); }catch(error){} }
  function pendingCount(){ return ["points", "pharma"].reduce((n, d) => n + Object.values(LOCAL[d]).reduce((m, f) => m + Object.keys(f).length, 0), 0); }

  // ---- publication ----
  function serialize(obj){
    return "/* Corrections des fiches faites en mode admin (bouton « ✎ Corriger la fiche »).\n" +
      "   Fichier écrit par le jeu lui-même (bouton « Publier ») : ne pas modifier à la main sans raison. */\n" +
      "window.MTC_FICHE_CORRECTIONS = " + JSON.stringify(obj, null, 2) + ";\n";
  }
  function parse(text){
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if(a < 0 || b < a) return empty();
    return normalize(JSON.parse(text.slice(a, b + 1)));
  }
  const toBase64 = str => btoa(unescape(encodeURIComponent(str)));
  const fromBase64 = str => decodeURIComponent(escape(atob(String(str).replace(/\n/g, ""))));

  async function publish(){
    let token = "";
    try{ token = localStorage.getItem(TOKEN_KEY) || ""; }catch(error){}
    if(!token){
      token = (window.prompt("Clé GitHub pour publier les corrections (jeton « fine-grained » avec le droit Contents : Read and write sur " +
        REPO.owner + "/" + REPO.repo + ").\nElle reste seulement sur cet appareil.") || "").trim();
      if(!token) return "Publication annulée.";
      try{ localStorage.setItem(TOKEN_KEY, token); }catch(error){}
    }
    const api = "https://api.github.com/repos/" + REPO.owner + "/" + REPO.repo + "/contents/" + REPO.path;
    const headers = {"Authorization":"Bearer " + token, "Accept":"application/vnd.github+json"};
    // on repart du fichier en ligne (une autre machine a pu publier entre-temps)
    const got = await fetch(api + "?ref=" + REPO.branch, {headers, cache:"no-store"});
    if(got.status === 401 || got.status === 403){ try{ localStorage.removeItem(TOKEN_KEY); }catch(error){} throw new Error("clé GitHub refusée (elle a été oubliée : réessaie avec une autre)"); }
    let sha = null, remote = empty();
    if(got.ok){ const j = await got.json(); sha = j.sha; remote = parse(fromBase64(j.content)); }
    else if(got.status !== 404) throw new Error("lecture impossible (" + got.status + ")");
    const next = clone(remote);
    ["points", "pharma"].forEach(d => Object.entries(LOCAL[d]).forEach(([id, fields]) => { next[d][id] = Object.assign(next[d][id] || {}, clone(fields)); }));
    prune(next);
    const ids = ["points", "pharma"].flatMap(d => Object.keys(LOCAL[d]));
    const body = {message:"Fiches : corrections admin (" + (ids.slice(0, 6).join(", ") || "nettoyage") + (ids.length > 6 ? "…" : "") + ")", content:toBase64(serialize(next)), branch:REPO.branch};
    if(sha) body.sha = sha;
    const put = await fetch(api, {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, headers), body:JSON.stringify(body)});
    if(put.status === 401 || put.status === 403){ try{ localStorage.removeItem(TOKEN_KEY); }catch(error){} throw new Error("clé GitHub sans droit d'écriture (elle a été oubliée)"); }
    if(!put.ok) throw new Error("écriture impossible (" + put.status + ")");
    PUBLISHED = next; LOCAL = empty(); saveLocal(); applyAll();
    return "Publié ✓ — visible par tout le monde d'ici une à deux minutes.";
  }
  function exportFile(){
    const blob = new Blob([serialize(prune(merged()))], {type:"text/javascript"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "fiches-corrections.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---- interface (fiche ouverte) ----
  function barHtml(domain, id){
    const n = pendingCount(), corrected = !!(merged()[domain][id]);
    return '<div class="mtc-fiche-admin-bar"><button type="button" class="mtc-fiche-btn" data-fiche-act="edit">✎ Corriger la fiche</button>' +
      (corrected ? '<span class="mtc-fiche-flag" title="Cette fiche contient des corrections admin">corrigée</span>' : "") +
      (n ? '<span class="mtc-fiche-pending">' + n + " correction" + (n > 1 ? "s" : "") + ' en attente · <button type="button" class="mtc-fiche-link" data-fiche-act="publish">Publier</button> · <button type="button" class="mtc-fiche-link" data-fiche-act="export">Exporter</button></span>' : "") +
      '<span class="mtc-fiche-status" aria-live="polite"></span></div>';
  }
  function formHtml(domain, id){
    const rec = recordOf(domain, id) || {};
    const list = LIST_FIELDS[domain] || new Set();
    const fields = FIELDS[domain].map(([field, label]) => {
      const raw = rec[field], value = Array.isArray(raw) ? raw.join("\n") : String(raw == null ? "" : raw);
      const changed = !same(rec[field], originalOf(domain, id, field));
      const rows = Math.min(14, Math.max(field === "pinyin" || field === "hanzi" || field.startsWith("nom") ? 1 : 2, value.split("\n").length + Math.floor(value.length / 70)));
      return '<label class="mtc-fiche-field' + (changed ? " changed" : "") + '"><span class="mtc-fiche-label">' + esc(label) +
        (changed ? ' <button type="button" class="mtc-fiche-link" data-fiche-act="reset" data-field="' + field + '" title="Revenir à la valeur d\'origine">↺ original</button>' : "") +
        '</span><textarea name="' + field + '" rows="' + rows + '"' + (list.has(field) ? ' data-list="1"' : "") + ">" + esc(value) + "</textarea></label>";
    }).join("");
    return '<form class="mtc-fiche-form"><p class="mtc-fiche-help">Correction admin — enregistrée tout de suite sur cet appareil ; « Publier » la rend visible pour tout le monde.</p>' + fields +
      '<div class="mtc-fiche-actions"><button type="submit" class="mtc-fiche-btn primary">Enregistrer</button><button type="button" class="mtc-fiche-btn" data-fiche-act="cancel">Annuler</button></div></form>';
  }
  function blockHtml(domain, id){
    if(!isAdmin()) return "";
    const open = editing === domain + "|" + id;
    return '<div class="mtc-fiche-admin' + (open ? " editing" : "") + '" data-fiche-domain="' + domain + '" data-fiche-id="' + esc(id) + '">' + barHtml(domain, id) + (open ? formHtml(domain, id) : "") + "</div>";
  }
  function bind(container, rerender){
    const box = container && container.querySelector(".mtc-fiche-admin");
    if(!box || box.__bound) return;
    box.__bound = true;
    const domain = box.dataset.ficheDomain, id = box.dataset.ficheId, status = box.querySelector(".mtc-fiche-status");
    box.addEventListener("keydown", e => e.stopPropagation());
    box.addEventListener("click", async e => {
      const b = e.target.closest("[data-fiche-act]");
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      const act = b.dataset.ficheAct;
      if(act === "edit"){ editing = editing === domain + "|" + id ? null : domain + "|" + id; rerender(); }
      else if(act === "cancel"){ editing = null; rerender(); }
      else if(act === "reset"){
        const ta = box.querySelector('textarea[name="' + b.dataset.field + '"]'), o = originalOf(domain, id, b.dataset.field);
        if(ta) ta.value = Array.isArray(o) ? o.join("\n") : String(o == null ? "" : o);
      }
      else if(act === "export") exportFile();
      else if(act === "publish"){
        b.disabled = true; if(status) status.textContent = "Publication…";
        let msg;
        try{ msg = await publish(); }catch(error){ msg = "Échec de la publication : " + error.message; }
        rerender();
        const s = container.querySelector(".mtc-fiche-admin .mtc-fiche-status");
        if(s) s.textContent = msg;
      }
    });
    const form = box.querySelector(".mtc-fiche-form");
    if(form) form.addEventListener("submit", e => {
      e.preventDefault();
      const rec = recordOf(domain, id);
      if(!rec) return;
      form.querySelectorAll("textarea[name]").forEach(ta => {
        const field = ta.name;
        let value = ta.value.replace(/\r\n?/g, "\n").replace(/\s+$/, "");
        if(ta.dataset.list) value = value.split("\n").map(s => s.trim()).filter(Boolean);
        const current = rec[field];
        const cur = Array.isArray(current) || ta.dataset.list ? current : String(current == null ? "" : current).replace(/\s+$/, "");
        if(same(value, cur)) return;
        LOCAL[domain][id] = LOCAL[domain][id] || {};
        LOCAL[domain][id][field] = value;
      });
      applyAll();
      // une valeur remise à l'original reste « en attente » si elle annule une correction déjà publiée
      Object.keys(LOCAL[domain][id] || {}).forEach(field => {
        if(same(LOCAL[domain][id][field], originalOf(domain, id, field)) && !(PUBLISHED[domain][id] && field in PUBLISHED[domain][id])) delete LOCAL[domain][id][field];
      });
      if(LOCAL[domain][id] && !Object.keys(LOCAL[domain][id]).length) delete LOCAL[domain][id];
      saveLocal();
      editing = null;
      rerender();
      const s = container.querySelector(".mtc-fiche-admin .mtc-fiche-status");
      if(s) s.textContent = pendingCount() ? "Enregistré sur cet appareil — pense à publier." : "Enregistré.";
    });
  }

  // points : crochets déjà prévus dans 05-04-final-corrections.js
  window.renderMtcFullRecordEditor = function(domain, id){ return blockHtml(domain === "acupuncture" ? "points" : domain, id); };
  window.bindMtcFullRecordEditor = bind;
  // substances : appelé par 24-22-pharma-herb-panel.js à l'ouverture d'une fiche
  window.mtcFicheAdminDecorate = function(domain, id, container, rerender){
    if(!isAdmin() || !container) return;
    const header = container.querySelector(".pharma-herb-header");
    if(!header) return;
    header.insertAdjacentHTML("afterend", blockHtml(domain, id));
    bind(container, rerender);
  };

  function ensureStyle(){
    if(document.getElementById("mtcFicheAdminStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcFicheAdminStyle";
    style.textContent = `
.mtc-fiche-admin{ margin:6px 0 10px; text-align:left; }
.mtc-fiche-admin.editing ~ *{ display:none !important; }
.mtc-fiche-admin-bar{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-size:12.5px; }
.mtc-fiche-btn{ font:inherit; font-size:12.5px; font-weight:700; padding:4px 10px; border-radius:999px; border:1px solid var(--border-color, #ccd); background:var(--page-bg, #fff); color:var(--text-color, #111); cursor:pointer; }
.mtc-fiche-btn.primary{ background:#2f6fde; border-color:#2f6fde; color:#fff; }
.mtc-fiche-link{ font:inherit; border:0; background:none; padding:0; color:#2f6fde; text-decoration:underline; cursor:pointer; }
.mtc-fiche-flag{ font-size:11px; font-weight:800; padding:1px 7px; border-radius:999px; background:#fff1c2; color:#7a5a00; }
.mtc-fiche-pending{ color:#a15c00; font-weight:700; }
.mtc-fiche-status{ font-weight:700; }
.mtc-fiche-form{ display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.mtc-fiche-help{ margin:0; font-size:12px; opacity:.75; }
.mtc-fiche-field{ display:flex; flex-direction:column; gap:3px; font-size:12px; font-weight:700; }
.mtc-fiche-field textarea{ font:inherit; font-weight:400; font-size:13.5px; line-height:1.4; padding:6px 8px; border-radius:8px; border:1px solid var(--border-color, #ccd); background:var(--page-bg, #fff); color:var(--text-color, #111); resize:vertical; width:100%; box-sizing:border-box; }
.mtc-fiche-field.changed textarea{ border-color:#e0a800; box-shadow:0 0 0 2px rgba(224,168,0,.18); }
.mtc-fiche-actions{ display:flex; gap:8px; position:sticky; bottom:0; padding:6px 0; background:var(--page-bg, #fff); }
`;
    document.head.appendChild(style);
  }

  applyAll();
  // après une synchro GitHub (Assistant Diagnostic) les fiches des points sont réécrites : on ré-applique
  window.addEventListener("mtc-github-sync", () => { applyAll(); try{ if(window.refreshCurrentPointPanel) window.refreshCurrentPointPanel(); }catch(error){} });
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureStyle, {once:true});
  else ensureStyle();
})();
