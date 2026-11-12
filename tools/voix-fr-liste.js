// Liste des noms français à enregistrer (points et substances), tels que la voix les lit :
// même réécriture (frSay) et même empreinte (frKey) que point-caption.js. Sortie JSON : [{key, said}].
// Utilisé par tools/voix-fr.py.
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const sandbox = {console, TextEncoder};
sandbox.window = sandbox; sandbox.self = sandbox;
sandbox.document = {documentElement:{getAttribute(){ return null; }}, addEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, readyState:"loading"};
sandbox.addEventListener = () => {};
sandbox.localStorage = {getItem(){ return null; }, setItem(){}};
vm.createContext(sandbox);
for(const f of ["02-01-point-details-data.js", "22-20-pharma-data.js"]){
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, {filename:f});
}
const src = fs.readFileSync(path.join(root, "point-caption.js"), "utf8");
const a = src.indexOf("  const PY_FR"), b = src.indexOf("  let ctx = null;");
const {frSay, frKey} = new Function(src.slice(a, b) + "; return {frSay, frKey};")();
const names = [];
Object.values(sandbox.POINT_DETAILS || {}).forEach(d => d && d.nom_francais && names.push(d.nom_francais));
(sandbox.PHARMA_HERBS || []).forEach(x => x && x.nom && names.push(x.nom));
const seen = new Map();
names.forEach(n => { const said = frSay(n); seen.set(frKey(said), said); });
process.stdout.write(JSON.stringify([...seen].map(([key, said]) => ({key, said}))));
