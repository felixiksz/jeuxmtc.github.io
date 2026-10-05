// Publie les formules de l'Outil diagnostique dans le site (formules/formules-data.js), pour que le module
// Formules fonctionne sans synchro GitHub.
// usage : node tools/formules-publish.js <chemin du clone Assistant-MTC>
const fs = require("fs"), path = require("path");
const src = process.argv[2];
if(!src) throw new Error("usage : node tools/formules-publish.js <clone Assistant-MTC>");
const root = path.join(src, "formules");
const index = JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
const formules = {};
index.forEach(e => {
  try{ formules[e.id] = JSON.parse(fs.readFileSync(path.join(root, e.chemin), "utf8")); }
  catch(err){ console.error("manquant :", e.chemin); }
});
const out = path.join(__dirname, "..", "formules", "formules-data.js");
fs.writeFileSync(out, "/* Formules de l’Outil diagnostique, publiées pour le module Formules (bêta). Généré par tools/formules-publish.js. */\n" +
  "window.MTC_FORMULES = " + JSON.stringify({publishedAt:new Date().toISOString(), index, formules}) + ";\n", "utf8");
console.log(index.length, "formules →", out);
