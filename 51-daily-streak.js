/* ============================================================
   51-daily-streak.js
   Série quotidienne : compte les jours consécutifs où l'utilisateur
   a terminé au moins une partie (gagnée). Affiche une pastille 🔥
   dans la barre du haut et un message de félicitations ponctuel
   après une partie gagnée qui prolonge la série.
   ============================================================ */
(function(){
  "use strict";

  const STREAK_KEY = "mtc_daily_streak_v1";

  function todayLocalDateString(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function yesterdayLocalDateString(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function loadStreak(){
    try{
      const raw = localStorage.getItem(STREAK_KEY);
      if(!raw) return {count: 0, lastPlayedDate: ""};
      const parsed = JSON.parse(raw);
      return {
        count: Number(parsed.count) || 0,
        lastPlayedDate: String(parsed.lastPlayedDate || "")
      };
    }catch(error){
      return {count: 0, lastPlayedDate: ""};
    }
  }

  function saveStreak(streak){
    try{ localStorage.setItem(STREAK_KEY, JSON.stringify(streak)); }catch(error){}
  }

  function renderBadge(streak){
    const badge = document.getElementById("dailyStreakBadge");
    if(!badge) return;
    if(streak.count > 0){
      badge.style.display = "";
      badge.innerHTML = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;"><path d="M15.359 21.751C17.382 21.121 20 19.254 20 15c0-4.622-5.056-9.586-8.427-12.154c-.557-.424-1.357-.119-1.617.53C8.31 7.496 4 11.855 4 15c0 3.107 2.246 5.309 4.081 6.372"/><path d="M15.359 21.751c-.432.134-.715-.369-.457-.74c.88-1.265 1.898-3.195 1.898-5.01c0-1.951-1.644-4.254-2.928-5.675c-.293-.324-.805-.11-.821.328c-.053 1.45-.282 3.388-1.268 4.908a.412.412 0 0 1-.677.036c-.308-.39-.616-.871-.924-1.251c-.166-.205-.466-.208-.657-.027c-.747.707-1.792 1.809-1.792 3.18c0 .99.472 2.22.958 3.174c.22.433-.189.941-.61.698"/></svg><span>${streak.count}</span>`;
    }else{
      badge.style.display = "none";
      badge.textContent = "";
    }
  }

  function showStreakMessage(text){
    const message = document.getElementById("message");
    if(message) message.textContent = text;
  }

  function recordTodaysWin(){
    const streak = loadStreak();
    const today = todayLocalDateString();

    if(streak.lastPlayedDate === today){
      renderBadge(streak);
      return;
    }

    const yesterday = yesterdayLocalDateString();
    const continuing = streak.lastPlayedDate === yesterday;
    const nextCount = continuing ? streak.count + 1 : 1;
    const next = {count: nextCount, lastPlayedDate: today};

    saveStreak(next);
    renderBadge(next);

    if(nextCount > 1){
      showStreakMessage(`Bravo, ${nextCount} jours d'affilée !`);
    }else{
      showStreakMessage("Série commencée : reviens demain pour continuer !");
    }
  }

  function wrapRecordStatsGameFinished(){
    const original = window.recordStatsGameFinished;
    if(typeof original !== "function" || original.__dailyStreakWrapped) return;

    const wrapped = function(won){
      const result = original.apply(this, arguments);
      if(won) recordTodaysWin();
      return result;
    };
    wrapped.__dailyStreakWrapped = true;
    window.recordStatsGameFinished = wrapped;
  }

  wrapRecordStatsGameFinished();
  renderBadge(loadStreak());
})();
