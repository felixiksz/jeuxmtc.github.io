/* ============================================================
   65-special-point-labels.js
   Quand une catégorie est trouvée, la spécificité de certains points
   s'affiche quelques secondes sous leur case : yuán-source des tissus
   (gāo, huāng), luò-liaison (rèn mài, dū mài, grand luò de la rate),
   xì-crevasse et points d'ouverture des merveilleux vaisseaux,
   xià hé-réunion inférieure, points généraux.
   ============================================================ */
(function(){
  "use strict";

  const GROUPS = ["Points_Yuan_Source", "Points_Luo_Liaison", "Points_Xi_Crevasse",
    "Points_d_ouverture_des_merveilleux_vaisseaux", "Points_Xia_He_Reunion_inferieure", "Points_generaux"];
  const LUO = {RM15:"Rèn Mài", DM1:"Dū Mài", Rt21:"Grand luò de la Rate"};
  const SHOW_MS = 5500;

  function labelFor(key, point){
    if(key === "Points_Luo_Liaison") return LUO[point] || "";
    try{ return typeof window.getContextLabelForPoint === "function" ? String(window.getContextLabelForPoint(key, point) || "") : ""; }
    catch(error){ return ""; }
  }

  function ensureStyle(){
    if(document.getElementById("mtcSpecialLabelsStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcSpecialLabelsStyle";
    style.textContent = `
.solved-point.mtc-has-special{ position:relative; }
.mtc-special-label{
  position:absolute; left:50%; top:100%; transform:translate(-50%, 4px);
  z-index:5; white-space:nowrap; pointer-events:none;
  font-size:11px; line-height:1.2; font-weight:700; letter-spacing:.01em;
  padding:3px 8px; border-radius:999px;
  background:var(--page-bg, #fff); color:var(--text-color, #111);
  box-shadow:0 2px 10px var(--shadow-color, rgba(0,0,0,.25));
  animation:mtcSpecialIn .25s ease-out both;
}
.mtc-special-label.out{ animation:mtcSpecialOut .6s ease-in both; }
@keyframes mtcSpecialIn{ from{ opacity:0; transform:translate(-50%, -2px); } to{ opacity:1; transform:translate(-50%, 4px); } }
@keyframes mtcSpecialOut{ to{ opacity:0; transform:translate(-50%, 0); } }
@media (prefers-reduced-motion: reduce){ .mtc-special-label, .mtc-special-label.out{ animation:none; } }
`;
    document.head.appendChild(style);
  }

  function decorate(row){
    const key = row.dataset.categoryKey;
    if(!GROUPS.includes(key) || row.__mtcSpecialDone) return;
    row.__mtcSpecialDone = true;
    row.querySelectorAll(".solved-point[data-point]").forEach(el => {
      const label = labelFor(key, el.dataset.point);
      if(!label) return;
      ensureStyle();
      el.classList.add("mtc-has-special");
      const tag = document.createElement("span");
      tag.className = "mtc-special-label";
      tag.textContent = label;
      el.appendChild(tag);
      window.setTimeout(() => tag.classList.add("out"), SHOW_MS);
      window.setTimeout(() => { tag.remove(); el.classList.remove("mtc-has-special"); }, SHOW_MS + 700);
    });
  }

  function boot(){
    const solved = document.getElementById("solved");
    if(!solved) return;
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(n => {
      if(n.nodeType === 1 && n.classList.contains("solved-row")) decorate(n);
    }))).observe(solved, {childList:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
