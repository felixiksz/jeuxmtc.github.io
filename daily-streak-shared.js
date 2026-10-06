/* ============================================================
   daily-streak-shared.js
   Série de jours de jeu, partagée par tous les jeux du site (grille,
   quiz, mémo, Substance manquante, Cas clinique, Itinéraire,
   Équilibrer) : une manche terminée dans n'importe quel jeu compte
   pour la journée. Même enregistrement que 51-daily-streak.js
   (localStorage « mtc_daily_streak_v1 », même origine pour tout le site).
   ============================================================ */
(function(){
  "use strict";
  const KEY = "mtc_daily_streak_v1";
  const day = offset => { const d = new Date(); d.setDate(d.getDate() + (offset || 0)); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function load(){ try{ const s = JSON.parse(localStorage.getItem(KEY) || "{}"); return {count:Number(s.count) || 0, lastPlayedDate:String(s.lastPlayedDate || "")}; }catch(error){ return {count:0, lastPlayedDate:""}; } }
  // renvoie la série du jour (et l'enregistre si c'est la première manche de la journée)
  window.mtcRecordDailyPlay = window.mtcRecordDailyPlay || function(){
    const s = load(), today = day(0);
    if(s.lastPlayedDate === today) return s;
    const next = {count:s.lastPlayedDate === day(-1) ? s.count + 1 : 1, lastPlayedDate:today};
    try{ localStorage.setItem(KEY, JSON.stringify(next)); }catch(error){}
    return next;
  };
})();
