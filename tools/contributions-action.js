// Lancé par .github/workflows/contributions.yml : lit une discussion « Contributions » (texte collé par le bouton
// « Partager mes notes » du jeu), vérifie les notes et les range dans contributions.json, signées du compte GitHub
// de la personne qui a publié. Un nouveau partage de la même personne remplace le précédent.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "contributions.json");

const FIELDS = {
  points:["notes", "associations", "esprits", "vs", "precautions"],
  pharma:["esprits", "notes", "associations", "formules", "vs", "syntheses", "precautions", "ingredients", "recherches_modernes",
    "indications", "contre_indications", "preparations", "synonymes"]
};
const MAX_FIELD = 8000, MAX_AUTHOR = 600000;

// identifiants connus (points et substances du jeu)
function knownIds(){
  global.window = global;
  global.document = {readyState:"complete", getElementById(){ return null; }, addEventListener(){}};
  eval(fs.readFileSync(path.join(ROOT, "02-01-point-details-data.js"), "utf8").replace("const POINT_DETAILS", "global.POINT_DETAILS"));
  eval(fs.readFileSync(path.join(ROOT, "22-20-pharma-data.js"), "utf8"));
  return {points:new Set(Object.keys(global.POINT_DETAILS || {})), pharma:new Set((global.PHARMA_HERBS || []).map(h => h && h.id).filter(Boolean))};
}

async function graphql(query, variables){
  const res = await fetch("https://api.github.com/graphql", {
    method:"POST",
    headers:{"Authorization":"Bearer " + process.env.GITHUB_TOKEN, "Content-Type":"application/json"},
    body:JSON.stringify({query, variables})
  });
  const json = await res.json();
  if(json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function blocks(text){
  const out = [];
  String(text || "").replace(/```(?:json)?\s*([\s\S]*?)```/g, (m, body) => { out.push(body); return m; });
  if(!out.length && /^\s*\{/.test(text || "")) out.push(text);
  return out.map(b => { try{ return JSON.parse(b); }catch(e){ return null; } }).filter(o => o && typeof o === "object" && o.mtc_notes);
}

function clean(value){
  if(typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, MAX_FIELD);
}

(async () => {
  const data = await graphql(`query($id:ID!){ node(id:$id){ ... on Discussion {
    url body author{ login } category{ slug }
    comments(first:100){ nodes{ body author{ login } } } } } }`, {id:process.env.DISCUSSION_ID});
  const d = data && data.node;
  if(!d || !d.category || d.category.slug !== "contributions" || !d.author) return console.log("Pas une contribution.");
  const login = String(d.author.login || "").replace(/[^A-Za-z0-9-]/g, "");
  if(!login) return;
  const parts = blocks(d.body).concat(...(d.comments.nodes || []).filter(c => c.author && c.author.login === d.author.login).map(c => blocks(c.body)));
  const ids = knownIds();
  const notes = {points:{}, pharma:{}};
  let size = 0;
  parts.forEach(p => ["points", "pharma"].forEach(domain => Object.entries(p[domain] || {}).forEach(([id, fields]) => {
    if(!ids[domain].has(id) || !fields || typeof fields !== "object") return;
    FIELDS[domain].forEach(f => {
      const v = clean(fields[f]);
      if(!v || size + v.length > MAX_AUTHOR) return;
      size += v.length;
      (notes[domain][id] = notes[domain][id] || {})[f] = v;
    });
  })));
  let all = {authors:{}};
  try{ all = JSON.parse(fs.readFileSync(OUT, "utf8")); }catch(e){}
  all.authors = all.authors || {};
  const count = Object.keys(notes.points).length + Object.keys(notes.pharma).length;
  if(count) all.authors[login] = {updatedAt:new Date().toISOString(), url:d.url, points:notes.points, pharma:notes.pharma};
  else if(parts.length) delete all.authors[login];   // partage vide : la personne retire ses notes
  else return console.log("Aucune note lisible dans cette discussion.");
  all.updatedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(all, null, 1) + "\n");
  console.log(login + " : " + count + " fiche(s).");
})().catch(e => { console.error(e); process.exit(1); });
