// Lancé par .github/workflows/contributions.yml : relit un fil « Notes — point P 7 » / « Notes — substance A9 »
// (bouton « Notes signées des contributeur·ices » d'une fiche) et range ses commentaires dans contributions.json
// (threads), signés du compte GitHub de leur auteur·ice. Le fil est relu en entier à chaque commentaire
// ajouté, modifié ou supprimé : contributions.json reflète toujours son état actuel.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "contributions.json");
const MAX = 4000;

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
const clean = v => String(v || "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, MAX);

(async () => {
  const data = await graphql(`query($id:ID!){ node(id:$id){ ... on Discussion {
    title url
    comments(first:100){ nodes{ body createdAt url isMinimized author{ login } } } } } }`, {id:process.env.DISCUSSION_ID});
  const d = data && data.node;
  const m = d && /^Notes\s+—\s+(point|substance)\s+(.+?)\s*$/.exec(d.title || "");
  if(!m) return console.log("Pas un fil de notes.");
  const domain = m[1] === "point" ? "points" : "pharma";
  const ids = knownIds();
  // identifiant tel qu'écrit dans le titre (« P7 », « A9 »), retrouvé même avec une espace (« P 7 »)
  const id = [...ids[domain]].find(k => k.replace(/\s+/g, "") === m[2].replace(/\s+/g, ""));
  if(!id) return console.log("Fiche inconnue : " + m[2]);
  const notes = (d.comments.nodes || [])
    .filter(c => c.author && !c.isMinimized && clean(c.body))
    .map(c => ({login:String(c.author.login).replace(/[^A-Za-z0-9-]/g, ""), text:clean(c.body), at:c.createdAt, url:c.url}))
    .filter(n => n.login);
  let all = {authors:{}};
  try{ all = JSON.parse(fs.readFileSync(OUT, "utf8")); }catch(e){}
  all.threads = all.threads || {points:{}, pharma:{}};
  all.threads[domain] = all.threads[domain] || {};
  if(notes.length) all.threads[domain][id] = notes;
  else delete all.threads[domain][id];
  all.updatedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(all, null, 1) + "\n");
  console.log(domain + " " + id + " : " + notes.length + " note(s) signée(s).");
})().catch(e => { console.error(e); process.exit(1); });
