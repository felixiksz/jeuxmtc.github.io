// Notes perso de l'admin à partager avec les contributeurs : tout ce qui, dans l'export du jeu, diffère du contenu
// partagé (fiches publiées + fichier d'import commun), sans les images. Écrit notes-admin.js.
// usage : node tools/notes-admin-build.js <export.json> [--write]
const fs = require("fs"), path = require("path");
const ROOT = "C:/Users/papem/Desktop/Jeu/jeuxmtc_clean";
const exp = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
global.window = {}; global.document = {readyState:"complete", getElementById:() => null, addEventListener(){}};
let src = fs.readFileSync(ROOT + "/02-01-point-details-data.js", "utf8").replace("const POINT_DETAILS", "global.POINT_DETAILS");
eval(src);
eval(fs.readFileSync(ROOT + "/22-20-pharma-data.js", "utf8"));
eval(fs.readFileSync(ROOT + "/fiches-corrections.js", "utf8"));
const P = global.POINT_DETAILS, H = {}; (window.PHARMA_HERBS || []).forEach(h => { H[h.id] = h; });
const corr = window.MTC_FICHE_CORRECTIONS || {points:{}, pharma:{}};
const imp = JSON.parse(fs.readFileSync(ROOT + "/Import_tableau pharma_pro(1).json", "utf8")).pharmacology || {};
const norm = s => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").replace(/[«»"’']/g, "").trim();
const TRIVIAL = new Set(["", "aucune", "aucune.", "aucun", "-", "—", "rien", "aucune preparation particuliere."]);
// partie propre à l'admin : texte entier si différent, reste seulement si le texte partagé y est inclus
function own(local, shared){
  const l = String(local || "").trim();
  if(!l || TRIVIAL.has(norm(l))) return "";
  const parts = shared.map(norm).filter(Boolean);
  const nl = norm(l);
  if(parts.some(s => s === nl || s.includes(nl))) return "";
  let rest = l;
  shared.forEach(s => { const t = String(s || "").trim(); if(t && rest.includes(t)) rest = rest.replace(t, ""); });
  rest = rest.replace(/^\s*[\n\r]+|[\n\r]+\s*$/g, "").trim();
  return rest && !TRIVIAL.has(norm(rest)) && norm(rest).length > 2 ? rest : "";
}
const out = {author:"emesepap, admin", exportedAt:exp.exportedAt || null, points:{}, pharma:{}};
const put = (dom, id, field, val) => { if(!val || !(dom === "points" ? P[id] : H[id])) return; (out[dom][id] = out[dom][id] || {})[field] = val; };
// ACU : notes perso (notes de premier niveau et acupuncture.notes), associations, esprits, vs, précautions
const ACU = {notes:["notes"], associations:["associations"], esprits:["esprit"], vs:["vs", "comparaison"], precautions:["precaution", "precautions"]};
const acu = Object.assign({}, exp.acupuncture || {});
acu.notes = Object.assign({}, acu.notes || {}, exp.notes || {});
Object.entries(ACU).forEach(([k, fields]) => Object.entries(acu[k] || {}).forEach(([id, v]) => {
  const d = P[id] || {}, c = (corr.points || {})[id] || {};
  put("points", id, k, own(v, fields.flatMap(f => [d[f], c[f]])));
}));
// PHARMA : tous les champs texte sauf hanzi et images
const PH = {esprits:["esprit"], notes:["notes"], associations:["associations", "association"], formules:["formules"], vs:["vs", "comparaison"],
  precautions:["precaution", "precautions"], synonymes:["synonymes"], syntheses:["synthese"], ingredients:["ingredients"],
  recherches_modernes:["recherches_modernes"], indications:["indications"], contre_indications:["contre_indications"], preparations:["preparation"]};
Object.entries(PH).forEach(([k, fields]) => Object.entries((exp.pharmacology || {})[k] || {}).forEach(([id, v]) => {
  const h = H[id] || {}, c = (corr.pharma || {})[id] || {};
  const shared = fields.flatMap(f => [h[f], c[f]]);
  Object.values(imp).forEach(block => { if(block && typeof block === "object" && block[id] != null) shared.push(block[id]); });
  [k, k.replace(/s$/, "")].forEach(kk => { const b = imp[kk]; if(b && b[id] != null) shared.push(b[id]); });
  put("pharma", id, k, own(v, shared));
}));
const count = d => Object.values(out[d]).reduce((n, f) => n + Object.keys(f).length, 0);
const byField = d => { const c = {}; Object.values(out[d]).forEach(f => Object.keys(f).forEach(k => { c[k] = (c[k] || 0) + 1; })); return c; };
console.log("points :", Object.keys(out.points).length, "fiches,", count("points"), "notes", JSON.stringify(byField("points")));
console.log("pharma :", Object.keys(out.pharma).length, "fiches,", count("pharma"), "notes", JSON.stringify(byField("pharma")));
const ex = Object.entries(out.pharma).slice(0, 3).map(([id, f]) => id + " " + JSON.stringify(f).slice(0, 220));
console.log(ex.join("\n"));
if(process.argv.includes("--write")){
  fs.writeFileSync(ROOT + "/notes-admin.js", "/* Notes partagées avec les contributeurs : notes perso de l'admin (emesepap) qui diffèrent du contenu publié.\n   Généré depuis un export du jeu ; ne pas modifier à la main. */\nwindow.MTC_SHARED_NOTES = " + JSON.stringify(out, null, 1) + ";\n", "utf8");
  console.log("notes-admin.js écrit");
}
