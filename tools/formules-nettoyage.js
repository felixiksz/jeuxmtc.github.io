const fs = require("fs"), path = require("path");

const DROP = ["source", "a_verifier"];

const REPLACE = [
  [/Par ailleurs, une note indique que (Lǐ Shí Zhēn propose)/g, "Par ailleurs, $1"],
  [/Má Xìng Shí Gān Tāng : traité dans le cours sur les prescriptions piquantes fraîches qui libèrent la surface \(voir fiche séparée ma_xing_shi_gan_tang\)\./g, "Má Xìng Shí Gān Tāng : prescription piquante fraîche qui libère la surface (voir sa fiche)."],
  [/ — note : les pages 6-7 du document rattachent aussi cette formule aux (prescriptions piquantes fraîches qui libèrent la surface \(xīn liáng jiě biǎo jì\))/g, " — aussi rattachée aux $1"],
  [/Une note savante \(citant Qín Bó Wèi\) souligne un débat historique :/g, "Débat historique (cité par Qín Bó Wèi) :"],
  [/Fang Zheng \(selon la plateforme Yao Dao\) : /g, "Fang Zheng : "],
  [/D'après les notes manuscrites : nausées/g, "Nausées"],
  [/Une note évoque aussi une morphologie \((« [^»]+ »)\) dont le sens clinique exact n'est pas certain\./g, "Morphologie : $1."],
  [/Note manuscrite peu lisible évoquant un arrêt du traitement en cas de diarrhée trop importante (\([^)]*\)) — lecture incertaine, à vérifier\./g, "Arrêt du traitement en cas de diarrhée trop importante $1."],
  [/D'après la note manuscrite, cette formule est présentée comme/g, "Cette formule se présente comme"],
  [/ — traitée dans le cours des prescriptions qui mobilisent le qì \(xíng qì jì\), non détaillée dans ce document\./g, " — variante des prescriptions qui mobilisent le qì (xíng qì jì)."],
  [/ \(le texte indique '[^)]*\)/g, " dans une grande quantité d'eau"],
  [/\(xīn wēn selon le texte\)/g, "(xīn wēn)"],
  [/D['’]après (le|un) mémo de synthèse (du cours sur les formules qui tiédissent l['’]interne|du même support de cours|du cours) : /g, ""],
  [/Morphologie : \((« [^»]+ »)\)\./g, "Morphologie : $1."],
  [/ \(doses non précisées dans le document\)/g, " (doses non précisées)"],
  [/Variations données dans le document : /g, "Variations : "],
  [/ mentionnée dans le document \(« Aucune »\)/g, ""],
  [/ \[sic, tel qu'écrit dans le PDF\]/g, ""],
  [/composition classique connue de/g, "composition classique de"],
  [/, mais cette correspondance n'est pas confirmée explicitement par un texte imprimé dans ce document \(voir a_verifier\)\./g, "."],
  [/ explicitement listée dans le document/g, ""],
  [/ décrits dans le document :/g, " :"],
  [/ citées dans le document :/g, " :"],
  [/traitée dans (les prescriptions)/g, "classée dans $1"],
  [/, non détaillée dans ce document/g, ""],
  [/(^|\n|; |\. )Note( additionnelle| générale)? : (\S)/g, (m, a, b, c) => a + c.toUpperCase()],
  [/ — note : /g, " ; "]
];

function cleanText(s){
  let t = String(s);
  REPLACE.forEach(([re, to]) => { t = t.replace(re, to); });
  return t;
}
function walk(v){
  if(typeof v === "string") return cleanText(v);
  if(Array.isArray(v)) return v.map(walk);
  if(v && typeof v === "object"){ const o = {}; Object.keys(v).forEach(k => { if(!DROP.includes(k)) o[k] = walk(v[k]); }); return o; }
  return v;
}
function clean(data){ return walk(data); }

const INTERDIT = /manuscrit|\bcours\b(?<!au cours)(?<!en cours)(?<!long cours)|\bPDF\b|plateforme|Yao Dao|mémo de synthèse|le document|ce document|pages? \d|enseignant|à vérifier|carte mentale|C:\\\\Users/i;
function verifier(data){
  const bad = [];
  (function w(v, p){
    if(typeof v === "string"){ if(INTERDIT.test(v)) bad.push(p + " :: " + v.slice(0, 160)); }
    else if(Array.isArray(v)) v.forEach((x, i) => w(x, p + "[" + i + "]"));
    else if(v && typeof v === "object") Object.keys(v).forEach(k => w(v[k], p + "." + k));
  })(data, "");
  return bad;
}

module.exports = {clean, verifier, cleanText};

if(require.main === module){
  const file = path.join(__dirname, "..", "formules", "formules-data.js");
  const src = fs.readFileSync(file, "utf8");
  const m = src.match(/^([\s\S]*?window\.MTC_FORMULES = )([\s\S]*?);\s*$/);
  if(!m) throw new Error("format inattendu");
  const data = clean(JSON.parse(m[2])), bad = verifier(data);
  if(bad.length){ console.error(bad.length + " passage(s) à reprendre :\n" + bad.join("\n")); process.exit(1); }
  fs.writeFileSync(file, m[1] + JSON.stringify(data) + ";\n", "utf8");
  console.log("nettoyé :", file);
}
