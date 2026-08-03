/* ============================================================
   57-daily-reminder.js
   Rappel quotidien optionnel, sans serveur : une notification locale
   dès que l'app est rouverte un jour où l'on n'a pas encore joué, plus
   une tentative de rappel en tâche de fond (Periodic Background Sync,
   Chrome/Android uniquement, pas garanti) via sw.js. Rien de tout ça
   ne nécessite d'infrastructure côté serveur — tout part de l'appareil.
   ============================================================ */
(function(){
  "use strict";

  const ENABLED_KEY = "mtc_daily_reminder_enabled";
  const SHOWN_TODAY_KEY = "mtc_daily_reminder_shown_date";
  const STREAK_KEY = "mtc_daily_streak_v1";
  const PERIODIC_SYNC_TAG = "mtc-daily-reminder";

  const REMINDER_DB_NAME = "mtc_reminder_db";
  const REMINDER_STORE_NAME = "state";
  const REMINDER_DB_VERSION = 1;

  function todayLocalDateString(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function isEnabled(){
    try{ return localStorage.getItem(ENABLED_KEY) === "1"; }catch(error){ return false; }
  }

  function setEnabled(value){
    try{ localStorage.setItem(ENABLED_KEY, value ? "1" : "0"); }catch(error){}
  }

  function lastPlayedDate(){
    try{
      const raw = localStorage.getItem(STREAK_KEY);
      if(!raw) return "";
      return String(JSON.parse(raw).lastPlayedDate || "");
    }catch(error){ return ""; }
  }

  function hasPlayedToday(){
    return lastPlayedDate() === todayLocalDateString();
  }

  function alreadyShownToday(){
    try{ return localStorage.getItem(SHOWN_TODAY_KEY) === todayLocalDateString(); }catch(error){ return false; }
  }

  function markShownToday(){
    try{ localStorage.setItem(SHOWN_TODAY_KEY, todayLocalDateString()); }catch(error){}
  }

  // Miroir dans IndexedDB : un service worker ne peut pas lire
  // localStorage, donc c'est la seule façon pour le rappel en tâche de
  // fond (periodicsync, voir sw.js) de savoir si on a déjà joué
  // aujourd'hui sans réseau ni serveur.
  function openReminderDb(){
    return new Promise((resolve, reject) => {
      if(!window.indexedDB){ reject(new Error("indexedDB indisponible")); return; }
      const request = indexedDB.open(REMINDER_DB_NAME, REMINDER_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if(!db.objectStoreNames.contains(REMINDER_STORE_NAME)){
          db.createObjectStore(REMINDER_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function mirrorLastPlayedDateToIndexedDb(){
    const date = lastPlayedDate();
    if(!date) return;
    openReminderDb().then(db => {
      const tx = db.transaction(REMINDER_STORE_NAME, "readwrite");
      tx.objectStore(REMINDER_STORE_NAME).put(date, "lastPlayedDate");
    }).catch(()=>{});
  }

  function showLocalReminderIfDue(){
    if(!isEnabled()) return;
    if(hasPlayedToday()) return;
    if(alreadyShownToday()) return;
    if(typeof Notification === "undefined" || Notification.permission !== "granted") return;

    markShownToday();
    try{
      const notification = new Notification("🔔 Pas encore joué aujourd'hui !", {
        body:"Une petite partie de Connections MTC pour garder ta série ?",
        icon:"favicon.svg",
        tag:PERIODIC_SYNC_TAG
      });
      notification.onclick = () => {
        try{ window.focus(); }catch(error){}
        notification.close();
      };
    }catch(error){}
  }

  function wrapRecordStatsGameFinished(){
    const original = window.recordStatsGameFinished;
    if(typeof original !== "function" || original.__dailyReminderWrapped) return;

    const wrapped = function(won){
      const result = original.apply(this, arguments);
      if(won) mirrorLastPlayedDateToIndexedDb();
      return result;
    };
    wrapped.__dailyReminderWrapped = true;
    window.recordStatsGameFinished = wrapped;
  }

  async function registerPeriodicSync(){
    try{
      if(!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      if(!("periodicSync" in registration)) return;
      if(!navigator.permissions || !navigator.permissions.query) return;
      const status = await navigator.permissions.query({name:"periodic-background-sync"});
      if(status.state !== "granted") return;
      await registration.periodicSync.register(PERIODIC_SYNC_TAG, {minInterval:20 * 60 * 60 * 1000});
    }catch(error){}
  }

  async function unregisterPeriodicSync(){
    try{
      if(!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      if(registration.periodicSync) await registration.periodicSync.unregister(PERIODIC_SYNC_TAG);
    }catch(error){}
  }

  function renderBellState(button){
    const on = isEnabled();
    button.classList.toggle("mtc-reminder-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.title = on
      ? "Rappels quotidiens activés — clique pour désactiver"
      : "Activer un rappel si tu n'as pas encore joué aujourd'hui";
  }

  async function toggleReminder(button){
    if(!isEnabled()){
      if(typeof Notification === "undefined"){
        alert("Les notifications ne sont pas prises en charge par ce navigateur.");
        return;
      }
      if(Notification.permission === "default"){
        try{ await Notification.requestPermission(); }catch(error){}
      }
      if(Notification.permission !== "granted"){
        alert("Autorise les notifications pour ce site dans les réglages de ton navigateur pour activer les rappels.");
        renderBellState(button);
        return;
      }
      setEnabled(true);
      mirrorLastPlayedDateToIndexedDb();
      registerPeriodicSync();
    }else{
      setEnabled(false);
      unregisterPeriodicSync();
    }
    renderBellState(button);
  }

  function checkOnVisible(){
    if(document.visibilityState === "visible") showLocalReminderIfDue();
  }

  function boot(){
    const button = document.getElementById("mtcDailyReminderButton");
    if(!button) return;

    button.addEventListener("click", () => toggleReminder(button));
    renderBellState(button);

    wrapRecordStatsGameFinished();
    if(isEnabled()) mirrorLastPlayedDateToIndexedDb();

    window.setTimeout(showLocalReminderIfDue, 1500);
    document.addEventListener("visibilitychange", checkOnVisible);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
