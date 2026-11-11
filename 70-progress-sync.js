/* ============================================================
   70-progress-sync.js
   Progression synchronisée entre appareils, avec la clé GitHub de la
   synchro des notes (59-github-sync.js) : fichier jeu/progression.json
   du même dépôt privé.
   - statistiques (parties, erreurs, confusions, jours) : chaque appareil
     écrit sa part, le jeu affiche la somme de tous les appareils ;
   - niveau de chaque point (révisions « À revoir ») : l'interrogation la
     plus récente l'emporte ;
   - série quotidienne : date la plus récente, série prolongée d'un
     appareil à l'autre ;
   - paniers, files de révision, points comparés : la dernière
     modification l'emporte (réunion si les deux appareils ont changé) ;
   - collection (points trouvés) : réunion, le plus grand nombre de fois l'emporte ;
     maîtrise par canal (Réseaux) : la dernière modification l'emporte ;
   - objectif du jour : chaque appareil écrit son compte du jour, le jeu affiche la somme.
   ============================================================ */
(function(){
  "use strict";

  const PATH = "jeu/progression.json";
  const STATE_KEY = "mtc_progress_sync_state_v1";
  const COUNTERS = ["connections_mtc_stats_v1", "mtc_pharma_stats_v1"];
  const SHARED = {
    "connections_mtc_review_basket_v1": "union",
    "mtc_pharma_review_basket_v1": "union",
    "mtc_acu_review_queue_v1": "union",
    "connections_mtc_comparison_points_v1": "latest",
    "mtc_pharma_comparison_slots_v1": "latest",
    "mtc_collection_v1": "collection",
    "mtc_circuits_mastery_v1": "latest"
  };
  const GOAL_KEY = "mtc_daily_goal_v1", GOAL_OTHERS_KEY = "mtc_daily_goal_others_v1";
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  // collection : points trouvés sur l'un ou l'autre appareil (le plus grand nombre de fois)
  function mergeCollection(a, b){
    const out = {acu:{}, pharma:{}};
    [a, b].forEach(o => ["acu", "pharma"].forEach(dom => {
      const src = o && o[dom] || {};
      Object.keys(src).forEach(id => { out[dom][id] = Math.max(out[dom][id] || 0, Number(src[id]) || 0); });
    }));
    return out;
  }
  const STREAK_KEY = "mtc_daily_streak_v1";
  const MASTERY_PREFIX = "mtc_quiz_mastery_";

  let applying = false, running = false, again = false, timer = 0;

  // réglages de la synchro des notes (59-github-sync.js) ; dans les modules (Réseaux, Formules, Trajets), lus directement
  function directCfg(){
    const g = k => { try{ return localStorage.getItem(k) || ""; }catch(e){ return ""; } };
    const c = {token:g("mtc_github_sync_token"), owner:g("mtc_github_sync_owner"), repo:g("mtc_github_sync_repo"), branch:g("mtc_github_sync_branch") || "main"};
    return c.token && c.owner && c.repo ? c : null;
  }
  const cfgOf = () => typeof window.mtcGithubSyncConfig === "function" ? window.mtcGithubSyncConfig() : directCfg();
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function parse(raw, fallback){ try{ const v = JSON.parse(raw); return v == null ? fallback : v; }catch(e){ return fallback; } }
  function readJson(key, fallback){ try{ return parse(localStorage.getItem(key), fallback); }catch(e){ return fallback; } }

  function loadState(){
    const s = readJson(STATE_KEY, {}) || {};
    s.others = isObj(s.others) ? s.others : {};
    s.base = isObj(s.base) ? s.base : {};
    s.baseAt = isObj(s.baseAt) ? s.baseAt : {};
    if(!s.device) s.device = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    return s;
  }
  function saveState(s){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(s)); }catch(e){} }
  function write(key, value){
    applying = true;
    try{
      if(value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }catch(e){}
    applying = false;
  }

  // élément de liste sans ses horodatages : la même erreur notée sur deux appareils ne compte qu'une fois
  const itemKey = x => isObj(x)
    ? JSON.stringify(Object.keys(x).sort().filter(k => !/^(when|at|date|last|time)/i.test(k)).map(k => [k, x[k]]))
    : JSON.stringify(x);
  function unionArr(a, b, cap){
    const seen = new Set(), out = [];
    [...(a || []), ...(b || [])].forEach(x => { const k = itemKey(x); if(!seen.has(k)){ seen.add(k); out.push(x); } });
    return cap ? out.slice(0, cap) : out;
  }

  // --- compteurs : somme des appareils -------------------------------------
  function add(a, b, key){
    if(a == null) return clone(b);
    if(b == null) return clone(a);
    if(typeof a === "number" && typeof b === "number") return key === "version" ? a : a + b;
    if(Array.isArray(a) && Array.isArray(b)) return unionArr(a, b, 80);
    if(isObj(a) && isObj(b)){
      const out = {};
      new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => { out[k] = add(a[k], b[k], k); });
      return out;
    }
    if(typeof a === "string" && typeof b === "string") return a >= b ? a : b; // dates : la plus récente
    return clone(a);
  }
  function sub(a, b, key){
    if(a == null || b == null) return clone(a);
    if(typeof a === "number" && typeof b === "number") return key === "version" ? a : Math.max(0, a - b);
    if(isObj(a) && isObj(b)){
      const out = {};
      Object.keys(a).forEach(k => { out[k] = sub(a[k], b[k], k); });
      return out;
    }
    return clone(a);
  }
  // progression d'un autre appareil déjà copiée ici (import de sauvegarde) : à ne pas compter deux fois
  function alreadyContains(local, others){
    const d1 = local && local.days, d2 = others && others.days;
    if(!isObj(d1) || !isObj(d2)) return false;
    const days = Object.keys(d2);
    if(!days.length) return false;
    let equal = 0;
    const all = days.every(day => {
      const a = d1[day], b = d2[day];
      if(!isObj(a) || !isObj(b)) return false;
      if(same(a, b)) equal++;
      return Object.keys(b).every(k => typeof b[k] !== "number" || (Number(a[k]) || 0) >= b[k]);
    });
    return all && equal * 2 >= days.length;
  }

  // --- série quotidienne -----------------------------------------------------
  function dayBefore(date){
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function mergeStreak(a, b){
    const norm = s => ({count:Number(s && s.count) || 0, lastPlayedDate:String(s && s.lastPlayedDate || "")});
    a = norm(a); b = norm(b);
    if(!a.lastPlayedDate) return b;
    if(!b.lastPlayedDate) return a;
    if(a.lastPlayedDate === b.lastPlayedDate) return {count:Math.max(a.count, b.count), lastPlayedDate:a.lastPlayedDate};
    const [late, early] = a.lastPlayedDate > b.lastPlayedDate ? [a, b] : [b, a];
    const count = early.lastPlayedDate === dayBefore(late.lastPlayedDate) ? Math.max(late.count, early.count + 1) : late.count;
    return {count, lastPlayedDate:late.lastPlayedDate};
  }

  // --- niveau des points : l'interrogation la plus récente --------------------
  function newerRecord(a, b){
    if(!a) return b;
    if(!b) return a;
    const ta = String(a.lastSeenAt || ""), tb = String(b.lastSeenAt || "");
    if(ta !== tb) return ta > tb ? a : b;
    return (Number(b.seen) || 0) > (Number(a.seen) || 0) ? b : a;
  }
  function localMastery(){
    const out = {};
    try{
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if(k && k.indexOf(MASTERY_PREFIX) === 0){
          const rec = parse(localStorage.getItem(k), null);
          if(isObj(rec)) out[k.slice(MASTERY_PREFIX.length)] = rec;
        }
      }
    }catch(e){}
    return out;
  }

  // --- GitHub ----------------------------------------------------------------
  const apiUrl = cfg => `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${PATH}`;
  const headers = cfg => ({"Authorization":"Bearer " + cfg.token, "Accept":"application/vnd.github+json"});
  function toBase64(str){ return btoa(unescape(encodeURIComponent(str))); }
  function fromBase64(b64){ return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, "")))); }

  async function fetchFile(cfg){
    const res = await fetch(`${apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, {headers:headers(cfg), cache:"no-store"});
    if(res.status === 404) return {sha:null, data:null};
    if(!res.ok) throw new Error(`GitHub a répondu ${res.status} pour ${PATH}`);
    const payload = await res.json();
    if(!payload.content && payload.download_url){
      const raw = await fetch(payload.download_url, {headers:headers(cfg), cache:"no-store"});
      return {sha:payload.sha, data:parse(await raw.text(), null)};
    }
    return {sha:payload.sha, data:parse(fromBase64(payload.content || ""), null)};
  }
  async function putFile(cfg, data, sha){
    const body = {message:"Jeu MTC : progression", content:toBase64(JSON.stringify(data, null, 1)), branch:cfg.branch};
    if(sha) body.sha = sha;
    const res = await fetch(apiUrl(cfg), {method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, headers(cfg)), body:JSON.stringify(body)});
    if(!res.ok){ const err = new Error(`Envoi de la progression impossible (${res.status})`); err.status = res.status; throw err; }
  }

  function deviceName(){
    const ua = navigator.userAgent || "";
    const kind = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablette"
      : /iPhone|Android.*Mobile/i.test(ua) ? "téléphone" : "ordinateur";
    const browser = /Firefox\//.test(ua) ? "Firefox" : /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "navigateur";
    return kind + " (" + browser + ")";
  }

  // --- une synchronisation complète ----------------------------------------
  async function syncOnce(cfg){
    const file = await fetchFile(cfg);
    const remote = isObj(file.data) ? file.data : {};
    const devices = isObj(remote.devices) ? clone(remote.devices) : {};
    const shared = isObj(remote.shared) ? clone(remote.shared) : {};
    const state = loadState();
    const me = state.device;
    const now = new Date().toISOString();
    let changedHere = false;

    // à partir d'ici, tout est synchrone : le jeu ne peut pas écrire entre la lecture et l'écriture
    const mine = isObj(devices[me]) ? devices[me] : {};
    mine.name = deviceName();
    mine.counters = isObj(mine.counters) ? mine.counters : {};

    COUNTERS.forEach(k => {
      const local = readJson(k, null);
      let othersSum = null;
      Object.entries(devices).forEach(([id, dev]) => {
        if(id !== me && dev && isObj(dev.counters) && dev.counters[k]) othersSum = add(othersSum, dev.counters[k], "");
      });
      let applied;
      if(Object.prototype.hasOwnProperty.call(state.others, k)) applied = state.others[k];
      else applied = local && othersSum && alreadyContains(local, othersSum) ? othersSum : null;
      const own = isObj(local) ? sub(local, applied, "") : null;
      const merged = add(own, othersSum, "");
      if(merged && !same(merged, local)){ write(k, merged); changedHere = true; }
      state.others[k] = othersSum;
      if(own) mine.counters[k] = own;
    });
    // les compteurs déjà ajoutés sont notés tout de suite (ils sont maintenant dans les données locales)
    saveState(state);

    const nextShared = {}, nextBase = {}, nextBaseAt = {};
    Object.entries(SHARED).forEach(([k, mode]) => {
      let local = null;
      try{ local = localStorage.getItem(k); }catch(e){}
      const r = isObj(shared[k]) ? shared[k] : null;
      const localChanged = local != null && local !== state.base[k];
      const remoteChanged = !!r && r.at !== state.baseAt[k];
      let final = local, at = state.baseAt[k] || null;
      if(localChanged && remoteChanged){
        final = mode === "union" ? JSON.stringify(unionArr(parse(local, []), parse(r.value, []), k === "mtc_acu_review_queue_v1" ? 80 : 0))
          : mode === "collection" ? JSON.stringify(mergeCollection(parse(local, {}), parse(r.value, {}))) : local;
        at = now;
      }else if(localChanged){
        at = now;
      }else if(remoteChanged){
        final = r.value; at = r.at;
      }
      if(final !== local && final != null){ write(k, final); changedHere = true; }
      if(final != null){ nextShared[k] = {value:final, at:at || now}; nextBase[k] = final; nextBaseAt[k] = nextShared[k].at; }
      else if(r){ nextShared[k] = r; }
    });

    const streak = mergeStreak(readJson(STREAK_KEY, null), remote.streak);
    if(streak.lastPlayedDate && !same(streak, readJson(STREAK_KEY, null))){ write(STREAK_KEY, streak); changedHere = true; }

    const mastery = {};
    const localM = localMastery(), remoteM = isObj(remote.mastery) ? remote.mastery : {};
    new Set([...Object.keys(localM), ...Object.keys(remoteM)]).forEach(p => {
      const rec = newerRecord(localM[p], remoteM[p]);
      if(!rec) return;
      mastery[p] = rec;
      if(!same(rec, localM[p])){ write(MASTERY_PREFIX + p, rec); changedHere = true; }
    });

    // objectif du jour : le compte de cet appareil, et la somme des autres appareils pour aujourd'hui
    const goal = readJson(GOAL_KEY, null), day = today();
    mine.goal = goal && goal.d === day ? {d:day, n:Number(goal.n) || 0} : {d:day, n:0};
    let others = 0;
    Object.entries(devices).forEach(([id, dev]) => { if(id !== me && dev && isObj(dev.goal) && dev.goal.d === day) others += Number(dev.goal.n) || 0; });
    const prevOthers = readJson(GOAL_OTHERS_KEY, null);
    if(!prevOthers || prevOthers.d !== day || prevOthers.n !== others){ write(GOAL_OTHERS_KEY, {d:day, n:others}); changedHere = true; }

    mine.updatedAt = now;
    devices[me] = mine;
    const next = {version:1, devices, shared:nextShared, streak:streak.lastPlayedDate ? streak : (remote.streak || null), mastery};
    const strip = d => { const c = clone(d) || {}; delete c.updatedAt; Object.values(c.devices || {}).forEach(x => { if(x) delete x.updatedAt; }); return c; };
    if(!same(strip(next), strip(remote))){
      next.updatedAt = now;
      await putFile(cfg, next, file.sha);
    }
    // ce que GitHub contient maintenant : point de départ de la prochaine comparaison
    const after = loadState();
    after.base = nextBase; after.baseAt = nextBaseAt; after.lastSync = now;
    after.deviceCount = Object.keys(devices).length;
    saveState(after);
    return changedHere;
  }

  function refreshScreens(){
    ["renderStatsPanelIfOpen", "updateBasketCount", "renderReviewBasketPanelIfOpen", "renderAdvancedSearchPanelIfOpen", "mtcRenderStreakBadge", "mtcDrawGoal"].forEach(name => {
      try{ if(typeof window[name] === "function") window[name](); }catch(e){}
    });
  }

  function showStatus(text){
    let el = document.getElementById("mtcProgressSyncStatus");
    const host = document.getElementById("mtcGithubSyncStatus");
    if(!el && host && host.parentNode){
      el = document.createElement("div");
      el.id = "mtcProgressSyncStatus";
      el.className = "mtc-github-sync-last";
      host.parentNode.insertBefore(el, host.nextSibling);
    }
    if(el) el.textContent = text;
  }

  async function run(){
    const cfg = cfgOf();
    if(!cfg) return;
    if(running){ again = true; return; }
    running = true;
    try{
      let changed;
      try{ changed = await syncOnce(cfg); }
      catch(error){
        // écriture concurrente d'un autre appareil : on relit et on recommence une fois
        if(error && (error.status === 409 || error.status === 422)) changed = await syncOnce(cfg);
        else throw error;
      }
      if(changed) refreshScreens();
      const st = loadState();
      showStatus("Progression synchronisée à " + new Date().toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"}) +
        (st.deviceCount > 1 ? " (" + st.deviceCount + " appareils)" : ""));
    }catch(error){
      showStatus("Progression non synchronisée : " + (error && error.message || error));
      try{ localStorage.setItem("mtc_progress_sync_last_error", new Date().toISOString() + " — " + (error && error.message || error)); }catch(e){}
    }finally{
      running = false;
      if(again){ again = false; schedule(1500); }
    }
  }

  function schedule(delay){
    clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; run(); }, delay);
  }

  // une partie, un quiz, un panier modifiés : envoi quelques secondes après
  const tracked = key => COUNTERS.includes(key) || Object.prototype.hasOwnProperty.call(SHARED, key) || key === STREAK_KEY || key === GOAL_KEY || String(key).indexOf(MASTERY_PREFIX) === 0;
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value){
    const result = originalSetItem.apply(this, arguments);
    try{ if(!applying && this === window.localStorage && tracked(key) && cfgOf()) schedule(8000); }catch(e){}
    return result;
  };

  // après chaque synchro des notes (ouverture, retour sur l'onglet, bouton « Synchroniser maintenant »)
  window.addEventListener("mtc-github-sync", event => {
    if(event && event.detail && event.detail.source === "github") schedule(500);
  });
  // en quittant l'onglet ou l'appli : envoi immédiat de ce qui attend ; en y revenant : on reprend ce que les autres appareils ont fait
  document.addEventListener("visibilitychange", () => {
    if(document.hidden && timer){ clearTimeout(timer); timer = 0; run(); }
    else if(!document.hidden && cfgOf()) schedule(1200);
  });
  // modules (pas de synchro des notes pour lancer la première synchro) : une synchro à l'ouverture
  if(typeof window.mtcGithubSyncConfig !== "function" && cfgOf()) schedule(1500);

  window.mtcProgressSyncNow = run;
})();
