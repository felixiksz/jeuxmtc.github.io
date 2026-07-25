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
      badge.textContent = `🔥 ${streak.count}`;
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
