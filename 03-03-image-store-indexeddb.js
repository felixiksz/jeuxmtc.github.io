/* ============================================================
   03-03-image-store-indexeddb.js
   Stockage des images personnelles (points ACU + substances PHARMA) via
   IndexedDB au lieu de localStorage : la limite localStorage (5-10 Mo)
   est trop petite pour des centaines d'images encodées, IndexedDB
   n'a pas cette contrainte (quota lié à l'espace disque disponible).
   Ce module garde la même API synchrone (getImage/setImage) que
   l'ancien code via un cache mémoire chargé une fois au démarrage,
   pour ne pas devoir rendre tous les appelants asynchrones.
   ============================================================ */
(function(){
  "use strict";

  const DB_NAME = "mtc_images_db";
  const STORE_NAME = "images";
  const DB_VERSION = 1;
  const LEGACY_MIGRATION_FLAG = "mtc_idb_image_migration_v1_done";

  const ACU_IMAGE_PREFIX = "mtc_point_image_";
  const ACU_IMAGE_MEMO_PREFIX = "mtc_point_image_memo_";
  const PHARMA_IMAGE_PREFIX = "mtc_pharma_herb_image_";
  const IMAGE_PREFIXES = [ACU_IMAGE_PREFIX, ACU_IMAGE_MEMO_PREFIX, PHARMA_IMAGE_PREFIX];

  const cache = new Map();
  let dbPromise = null;
  let readyResolve;
  const readyPromise = new Promise(resolve => { readyResolve = resolve; });

  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if(!window.indexedDB){ reject(new Error("indexedDB indisponible")); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if(!db.objectStoreNames.contains(STORE_NAME)){
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  function idbGetAll(){
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const entries = [];
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if(cursor){
          entries.push([cursor.key, cursor.value]);
          cursor.continue();
        }else{
          resolve(entries);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    })).catch(error => { console.error("mtc image store: lecture échouée", error); return []; });
  }

  function idbPut(key, value){
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    })).catch(error => { console.error("mtc image store: écriture échouée", error); return false; });
  }

  function idbDelete(key){
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    })).catch(() => false);
  }

  function migrateLegacyLocalStorageImagesOnce(){
    try{
      if(localStorage.getItem(LEGACY_MIGRATION_FLAG)) return Promise.resolve();
    }catch(error){ return Promise.resolve(); }

    const legacyKeys = [];
    try{
      for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if(key && IMAGE_PREFIXES.some(prefix => key.startsWith(prefix))) legacyKeys.push(key);
      }
    }catch(error){ return Promise.resolve(); }

    if(!legacyKeys.length){
      try{ localStorage.setItem(LEGACY_MIGRATION_FLAG, "1"); }catch(error){}
      return Promise.resolve();
    }

    const writes = legacyKeys.map(key => {
      const value = localStorage.getItem(key) || "";
      cache.set(key, value);
      return idbPut(key, value);
    });

    return Promise.all(writes).then(() => {
      legacyKeys.forEach(key => { try{ localStorage.removeItem(key); }catch(error){} });
      try{ localStorage.setItem(LEGACY_MIGRATION_FLAG, "1"); }catch(error){}
    });
  }

  function loadCacheFromIndexedDb(){
    return idbGetAll().then(entries => {
      entries.forEach(([key, value]) => cache.set(key, value));
    });
  }

  migrateLegacyLocalStorageImagesOnce()
    .then(loadCacheFromIndexedDb)
    .catch(error => { console.error("mtc image store: initialisation échouée", error); })
    .then(() => {
      readyResolve();
      if(typeof window.refreshCurrentPointPanel === "function") window.refreshCurrentPointPanel();
      if(typeof window.refreshCurrentPharmaHerbPanel === "function") window.refreshCurrentPharmaHerbPanel();
    });

  function markModified(){
    try{ document.dispatchEvent(new CustomEvent("mtc-personal-data-modified")); }catch(error){}
  }

  function getImage(prefix, id){
    return cache.get(prefix + String(id || "")) || "";
  }

  function setImage(prefix, id, value){
    const key = prefix + String(id || "");
    const clean = value || "";
    markModified();
    if(clean){
      cache.set(key, clean);
      return idbPut(key, clean);
    }
    cache.delete(key);
    return idbDelete(key);
  }

  function entriesForPrefix(prefix){
    const out = {};
    cache.forEach((value, key) => {
      if(key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
    });
    return out;
  }

  function hasAnyForPrefix(prefix){
    for(const key of cache.keys()){
      if(key.startsWith(prefix)) return true;
    }
    return false;
  }

  function clearPrefix(prefix){
    const toRemove = [];
    cache.forEach((value, key) => { if(key.startsWith(prefix)) toRemove.push(key); });
    toRemove.forEach(key => { cache.delete(key); idbDelete(key); });
    if(toRemove.length) markModified();
    return toRemove.length;
  }

  window.mtcImageStoreReady = readyPromise;
  window.MTC_IMAGE_STORE = {
    ACU_IMAGE_PREFIX,
    ACU_IMAGE_MEMO_PREFIX,
    PHARMA_IMAGE_PREFIX,
    getImage,
    setImage,
    entriesForPrefix,
    hasAnyForPrefix,
    clearPrefix
  };
})();
