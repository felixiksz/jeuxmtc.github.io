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
const N = require("./formules-nettoyage.js");
const data = N.clean({publishedAt:new Date().toISOString(), index, formules}), bad = N.verifier(data);
if(bad.length){ console.error(bad.length + " passage(s) à reprendre avant de publier :\n" + bad.join("\n")); process.exit(1); }
const out = path.join(__dirname, "..", "formules", "formules-data.js");
fs.writeFileSync(out, "window.MTC_FORMULES = " + JSON.stringify(data) + ";\n", "utf8");
console.log(index.length, "formules →", out);
