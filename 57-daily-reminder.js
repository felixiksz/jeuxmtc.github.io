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
    notify();
  }

  // Sur Android, « new Notification() » est refusé (il faut passer par le
  // service worker) : c'était une des raisons pour lesquelles le rappel ne
  // s'affichait jamais. On passe donc d'abord par le service worker.
  async function notify(){
    const title = "🔔 Pas encore joué aujourd'hui !";
    const options = {
      body:"Une petite partie de Connections MTC pour garder ta série ?",
      icon:"icon-192.png",
      tag:PERIODIC_SYNC_TAG
    };
    try{
      if("serviceWorker" in navigator){
        const registration = await navigator.serviceWorker.getRegistration();
        if(registration && registration.showNotification){
          await registration.showNotification(title, options);
          return;
        }
      }
    }catch(error){}
    try{
      const notification = new Notification(title, options);
      notification.onclick = () => {
        try{ window.focus(); }catch(error){}
        notification.close();
      };
    }catch(error){}
  }

  // --- Heure du rappel -------------------------------------------------
  const TIME_KEY = "mtc_daily_reminder_time";
  const CALENDAR_KEY = "mtc_daily_reminder_calendar";
  const SITE_URL = "https://felixiksz.github.io/jeuxmtc.github.io/";

  function reminderTime(){
    try{
      const value = localStorage.getItem(TIME_KEY);
      if(/^\d{2}:\d{2}$/.test(value || "")) return value;
    }catch(error){}
    return "19:00";
  }

  function setReminderTime(value){
    if(/^\d{2}:\d{2}$/.test(value || "")){
      try{ localStorage.setItem(TIME_KEY, value); }catch(error){}
    }
  }

  function calendarAdded(){
    try{ return Boolean(localStorage.getItem(CALENDAR_KEY)); }catch(error){ return false; }
  }

  // Onglet resté ouvert (même en arrière-plan) : rappel à l'heure choisie.
  function checkTimedReminder(){
    if(!isEnabled()) return;
    const [h, m] = reminderTime().split(":").map(Number);
    const now = new Date();
    if(now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    showLocalReminderIfDue();
  }

  // --- Rappel dans l'agenda : fiable sur tous les appareils (iPhone,
  // Android, ordinateur), même site fermé, sans serveur ni notification
  // du navigateur. ---------------------------------------------------------
  function pad(n){ return String(n).padStart(2, "0"); }

  function icsEscape(text){
    return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function nextStart(time){
    const [h, m] = time.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    if(start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
    return start;
  }

  function localStamp(date){
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + "T" + pad(date.getHours()) + pad(date.getMinutes()) + "00";
  }

  function downloadIcs(time){
    const start = nextStart(time);
    const now = new Date();
    const utc = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + "Z";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Connections MTC//Rappel quotidien//FR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:connections-mtc-rappel-" + now.getTime() + "@felixiksz.github.io",
      "DTSTAMP:" + utc,
      // heure « flottante » : toujours à l'heure locale de l'appareil
      "DTSTART:" + localStamp(start),
      "DURATION:PT10M",
      "RRULE:FREQ=DAILY",
      "SUMMARY:" + icsEscape("Connections MTC — une petite partie ?"),
      "DESCRIPTION:" + icsEscape("5 minutes de révision : " + SITE_URL),
      "URL:" + SITE_URL,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + icsEscape("Connections MTC — une petite partie ?"),
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n") + "\r\n"], {type:"text/calendar;charset=utf-8"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rappel-connections-mtc.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }

  function googleCalendarUrl(time){
    const start = nextStart(time);
    const end = new Date(start.getTime() + 10 * 60 * 1000);
    let zone = "";
    try{ zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; }catch(error){}
    const params = new URLSearchParams({
      action:"TEMPLATE",
      text:"Connections MTC — une petite partie ?",
      details:"5 minutes de révision : " + SITE_URL,
      dates:localStamp(start) + "/" + localStamp(end),
      recur:"RRULE:FREQ=DAILY"
    });
    if(zone) params.set("ctz", zone);
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  // --- Petite fenêtre de réglage ------------------------------------------
  let panel = null;

  function closePanel(){
    if(panel){ panel.remove(); panel = null; }
    document.removeEventListener("click", outsideClose, true);
  }

  function outsideClose(event){
    if(!event.isTrusted) return; // le clic simulé du téléchargement ne doit pas fermer la fenêtre
    if(panel && !panel.contains(event.target) && !event.target.closest("#mtcDailyReminderButton")) closePanel();
  }

  function openPanel(button){
    if(panel){ closePanel(); return; }
    panel = document.createElement("div");
    panel.className = "mtc-reminder-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Rappel quotidien");
    const notifSupported = typeof Notification !== "undefined";
    panel.innerHTML =
      '<div class="mtc-reminder-head"><strong>🔔 Rappel quotidien</strong>' +
      '<button type="button" class="mtc-reminder-x" data-reminder="close" aria-label="Fermer">×</button></div>' +
      '<label class="mtc-reminder-time">Heure du rappel <input type="time" id="mtcReminderTime" value="' + reminderTime() + '"></label>' +
      '<p class="mtc-reminder-lead">Le plus fiable, sur tous les appareils (même site fermé) : un rappel quotidien dans ton agenda.</p>' +
      '<div class="mtc-reminder-actions">' +
        '<button type="button" data-reminder="ics">📅 Ajouter à mon agenda</button>' +
        '<a class="mtc-reminder-link" data-reminder="google" target="_blank" rel="noopener">Google Agenda</a>' +
      "</div>" +
      '<p class="mtc-reminder-small">« Ajouter à mon agenda » télécharge un petit fichier : ouvre-le pour l\'ajouter à Calendrier (iPhone, Mac), Outlook, etc. Sur Android, utilise plutôt « Google Agenda ».</p>' +
      '<hr>' +
      '<label class="mtc-reminder-check"><input type="checkbox" id="mtcReminderNotif"' + (isEnabled() ? " checked" : "") + (notifSupported ? "" : " disabled") + '> Notification du navigateur</label>' +
      '<p class="mtc-reminder-small">' + (notifSupported
        ? "S'affiche si le site est ouvert (même en arrière-plan) à l'heure choisie, ou à ta prochaine visite si tu n'as pas encore joué. Sur Android avec le site installé, Chrome peut aussi l'envoyer site fermé (sans garantie)."
        : "Ce navigateur ne gère pas les notifications.") + "</p>";
    document.body.appendChild(panel);

    const rect = button.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 16);
    panel.style.width = width + "px";
    panel.style.left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2)) + "px";
    panel.style.top = (rect.bottom + 8) + "px";

    const timeInput = panel.querySelector("#mtcReminderTime");
    const google = panel.querySelector('[data-reminder="google"]');
    const refreshGoogle = () => { google.href = googleCalendarUrl(reminderTime()); };
    refreshGoogle();
    timeInput.addEventListener("change", () => { setReminderTime(timeInput.value); refreshGoogle(); });
    google.addEventListener("click", () => {
      try{ localStorage.setItem(CALENDAR_KEY, "google " + reminderTime()); }catch(error){}
      renderBellState(button);
    });
    panel.querySelector('[data-reminder="ics"]').addEventListener("click", () => {
      setReminderTime(timeInput.value);
      downloadIcs(reminderTime());
      try{ localStorage.setItem(CALENDAR_KEY, "ics " + reminderTime()); }catch(error){}
      renderBellState(button);
    });
    panel.querySelector('[data-reminder="close"]').addEventListener("click", closePanel);
    const notifBox = panel.querySelector("#mtcReminderNotif");
    notifBox.addEventListener("change", async () => {
      await toggleReminder(button, notifBox.checked);
      notifBox.checked = isEnabled();
    });
    window.setTimeout(() => document.addEventListener("click", outsideClose, true), 0);
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
      // Pas de pré-vérification de permission : l'enregistrement échoue de
      // lui-même si Chrome ne l'autorise pas (site non installé…).
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
    const on = isEnabled() || calendarAdded();
    button.classList.toggle("mtc-reminder-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.title = on
      ? "Rappel quotidien activé (" + reminderTime() + ") — clique pour le régler"
      : "Programmer un rappel quotidien";
    // Le texte dit explicitement l'état : un simple changement de
    // couleur ne se voit pas sur tous les thèmes (ex. thème tout en
    // rouge, où "activé" et "désactivé" avaient l'air identiques).
    const label = document.getElementById("mtcDailyReminderLabel");
    if(label) label.textContent = on ? "Rappel : activé" : "Rappel : désactivé";
  }

  async function toggleReminder(button, wanted){
    const turnOn = typeof wanted === "boolean" ? wanted : !isEnabled();
    if(turnOn === isEnabled()){ renderBellState(button); return; }
    if(turnOn){
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
    if(document.visibilityState === "visible") checkTimedReminder();
  }

  function boot(){
    const button = document.getElementById("mtcDailyReminderButton");
    if(!button) return;

    button.addEventListener("click", event => { event.stopPropagation(); openPanel(button); });
    renderBellState(button);

    wrapRecordStatsGameFinished();
    if(isEnabled()){
      mirrorLastPlayedDateToIndexedDb();
      registerPeriodicSync();
    }

    // À l'ouverture : seulement si l'heure du rappel est passée ; puis
    // vérification chaque minute tant que l'onglet reste ouvert.
    window.setTimeout(checkTimedReminder, 1500);
    window.setInterval(checkTimedReminder, 60 * 1000);
    document.addEventListener("visibilitychange", checkOnVisible);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
