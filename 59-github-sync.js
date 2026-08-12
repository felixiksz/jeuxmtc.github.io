/* ============================================================
   59-github-sync.js
   Synchro optionnelle avec le dépôt GitHub privé de l'Assistant
   Diagnostic MTC (session sœur, même utilisatrice) : lecture de la
   base de référence par canal + écriture des champs personnels du
   Jeu (associations/notes/précautions) en plus dans les mêmes
   fichiers JSON. Sans token configuré, ce fichier ne fait STRICTEMENT
   rien — POINT_DETAILS reste la donnée statique embarquée, comme
   avant, zéro appel réseau. Le token n'est jamais dans le code
   source (ce site est public) : saisi une fois par l'utilisatrice
   dans la modale, gardé uniquement dans son localStorage.
   ============================================================ */
(function(){
  "use strict";

  const TOKEN_KEY = "mtc_github_sync_token";
  const OWNER_KEY = "mtc_github_sync_owner";
  const REPO_KEY = "mtc_github_sync_repo";
  const BRANCH_KEY = "mtc_github_sync_branch";
  const LAST_SUCCESS_KEY = "mtc_github_sync_last_success";

  // Les 14 canaux réguliers + Rèn Mài/Dū Mài ont des points propres ; les
  // 6 autres vaisseaux extraordinaires (Chōng/Dài/Yīn-Yáng Qiāo/Wéi Mài)
  // n'en ont pas — pas de fichier à charger pour eux côté Assistant.
  const CHANNEL_CODES = ["P","GI","E","Rt","C","IG","V","Rn","EC","TF","VB","F","RM","DM"];

  let modal = null;
  let statusEl = null;
  let syncInFlight = false;

  function byId(id){ return document.getElementById(id); }
  function storageGet(key){ try{ return localStorage.getItem(key) || ""; }catch(error){ return ""; } }
  function storageSet(key, value){ try{ localStorage.setItem(key, value || ""); }catch(error){} }

  function config(){
    return {
      token: storageGet(TOKEN_KEY),
      owner: storageGet(OWNER_KEY),
      repo: storageGet(REPO_KEY),
      branch: storageGet(BRANCH_KEY) || "main"
    };
  }

  function isConfigured(){
    const cfg = config();
    return Boolean(cfg.token && cfg.owner && cfg.repo);
  }

  // Chemin confirmé côté Assistant Diagnostic via `git ls-tree` sur leur dépôt :
  // pas de dossier "data/" à la racine.
  const CHANNEL_PATH_CANDIDATES = ["reference/points_canaux"];

  function apiBaseFor(cfg, relativePath){
    return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${relativePath}`;
  }

  function apiHeaders(cfg){
    return {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json"
    };
  }

  // atob/btoa ne gèrent que Latin1 ; le contenu peut avoir des accents/汉字.
  function utf8ToBase64(str){
    return btoa(unescape(encodeURIComponent(str)));
  }
  function base64ToUtf8(str){
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  }

  // --- Traduction de schéma : champs Assistant -> champs Jeu -------------

  function joinList(value, bullet){
    if(Array.isArray(value)) return value.map(item => bullet + String(item)).join("\n");
    return String(value == null ? "" : value);
  }

  // indications[] est un array d'objets {categorie, indication} côté Assistant
  // (confirmé par leur exemple réel) — le Jeu n'a pas de notion de catégorie
  // pour ce champ, juste une liste à puces "•  " comme les entrées existantes
  // (cf. 02-01-point-details-data.js), donc on ne garde que le texte.
  function joinIndications(value){
    if(!Array.isArray(value)) return String(value == null ? "" : value);
    return value.map(item => "•  " + String(item && typeof item === "object" ? item.indication : item)).join("\n");
  }

  // actions[] est déjà préfixé "➢ " côté Assistant (confirmé par leur exemple
  // réel) — un simple join, sinon on double le préfixe.
  function joinActions(value){
    if(!Array.isArray(value)) return String(value == null ? "" : value);
    return value.map(item => String(item)).join("\n");
  }

  function translateAssistantPoint(entry){
    const out = {};
    if(entry.pinyin != null) out.pinyin = entry.pinyin;
    if(entry.hanzi != null) out.hanzi = entry.hanzi;
    if(entry.nom_fr != null) out.nom_francais = entry.nom_fr;
    if(entry.localisation != null) out.localisation = entry.localisation;
    if(entry.methode_localisation != null) out.methode_localisation = entry.methode_localisation;
    if(entry.methode_travail != null) out.methode_travail = entry.methode_travail;
    if(entry.categories_point != null) out.categories_du_point = joinList(entry.categories_point, "");
    if(entry.indications != null) out.indications = joinIndications(entry.indications);
    if(entry.actions != null) out.actions = joinActions(entry.actions);
    // entry.images[] : hors scope, le Jeu gère ses images via MTC_IMAGE_STORE
    // (IndexedDB), un mécanisme complètement différent — pas de fusion ici.
    return out;
  }

  function mergeChannelIntoPointDetails(channelEntries){
    if(!Array.isArray(channelEntries)) return 0;
    let merged = 0;
    channelEntries.forEach(entry => {
      const code = entry && entry.point;
      if(!code) return;
      const translated = translateAssistantPoint(entry);
      if(!window.POINT_DETAILS[code]) window.POINT_DETAILS[code] = {point: code};
      Object.assign(window.POINT_DETAILS[code], translated);
      merged++;
    });
    return merged;
  }

  // --- Lecture -------------------------------------------------------------

  async function fetchChannelFile(cfg, code){
    let lastNotFound = true;
    for(const basePath of CHANNEL_PATH_CANDIDATES){
      const relativePath = `${basePath}/${code}.json`;
      const url = `${apiBaseFor(cfg, relativePath)}?ref=${encodeURIComponent(cfg.branch)}`;
      const response = await fetch(url, {headers: apiHeaders(cfg)});
      if(response.status === 404) continue;
      if(!response.ok) throw new Error(`GitHub a répondu ${response.status} pour ${relativePath}`);
      const payload = await response.json();
      const content = base64ToUtf8(payload.content || "");
      return {sha: payload.sha, data: JSON.parse(content), path: relativePath};
    }
    return null; // 404 sur les deux emplacements candidats : ce canal n'existe pas encore côté Assistant
  }

  async function syncFromGitHub(){
    if(!isConfigured()){
      setStatus("Configure un token, un propriétaire et un dépôt pour activer la synchro.");
      return;
    }
    if(syncInFlight) return;
    syncInFlight = true;
    setBusy(true);
    setStatus("Synchronisation en cours…");

    const cfg = config();
    let totalPoints = 0;
    let failedChannels = [];

    for(const code of CHANNEL_CODES){
      try{
        const file = await fetchChannelFile(cfg, code);
        if(!file) continue; // 404 : ce canal n'existe pas encore côté Assistant
        totalPoints += mergeChannelIntoPointDetails(file.data);
      }catch(error){
        failedChannels.push(code);
      }
    }

    try{
      if(typeof window.normalizeOldPointDetails === "function") window.normalizeOldPointDetails();
      if(typeof window.ensurePointAssociationsField === "function") window.ensurePointAssociationsField();
    }catch(error){}

    syncInFlight = false;
    setBusy(false);

    if(totalPoints > 0){
      storageSet(LAST_SUCCESS_KEY, new Date().toISOString());
    }

    const failSuffix = failedChannels.length
      ? ` (${failedChannels.length} canal/canaux en erreur : ${failedChannels.join(", ")})`
      : "";
    setStatus(
      totalPoints > 0
        ? `Synchronisé : ${totalPoints} point(s) mis à jour depuis GitHub${failSuffix}.`
        : `Aucune donnée récupérée${failSuffix || " — vérifie le token, le dépôt et le nom de la branche."}`
    );
    updateLastSyncLabel();
  }

  // --- Réparation ponctuelle (bug corrigé : la clé poussée était "notes" au
  // lieu de "note", créant une clé fantôme au lieu de mettre à jour la vraie) --

  async function repairDuplicateNoteKeys(){
    if(!isConfigured()){
      setStatus("Configure un token, un propriétaire et un dépôt d'abord.");
      return;
    }
    if(syncInFlight) return;
    syncInFlight = true;
    setBusy(true);
    setStatus("Réparation en cours…");

    const cfg = config();
    const repairedPoints = [];
    const failedChannels = [];

    for(const code of CHANNEL_CODES){
      try{
        const file = await fetchChannelFile(cfg, code);
        if(!file || !Array.isArray(file.data)) continue;
        let changed = false;
        file.data.forEach(entry => {
          if(entry && Object.prototype.hasOwnProperty.call(entry, "notes")){
            entry.note = entry.notes;
            delete entry.notes;
            changed = true;
            repairedPoints.push(entry.point);
            rememberBaseline("note", entry.point, entry.note);
          }
        });
        if(changed){
          await putChannelFile(cfg, file.path, file.data, file.sha, "Jeu MTC : réparation clé notes -> note");
        }
      }catch(error){
        failedChannels.push(code);
      }
    }

    syncInFlight = false;
    setBusy(false);

    const failSuffix = failedChannels.length
      ? ` (${failedChannels.length} canal/canaux en erreur : ${failedChannels.join(", ")})`
      : "";
    setStatus(
      repairedPoints.length > 0
        ? `Réparé : ${repairedPoints.length} point(s) (${repairedPoints.join(", ")})${failSuffix}.`
        : `Aucune clé "notes" fantôme trouvée${failSuffix}.`
    );
  }

  // --- Écriture --------------------------------------------------------------

  // Le champ ciblé (note/associations/precautions) est partagé par tout le
  // monde ayant accès au dépôt (l'utilisatrice sur plusieurs appareils,
  // potentiellement d'autres personnes) — un simple `entry[field] = value`
  // écraserait silencieusement ce qu'un autre appareil/personne aurait écrit
  // entretemps. On garde donc, par point+champ, la dernière valeur qu'ON a
  // nous-même écrite ; si la valeur distante actuelle ne correspond plus à
  // cette dernière valeur connue, quelqu'un d'autre l'a modifiée depuis :
  // on ajoute notre contenu à la suite plutôt que de le remplacer.
  function baselineKey(field, point){
    return `mtc_github_sync_baseline_${field}_${point}`;
  }

  function resolveFieldValue(entry, field, point, newValue){
    const remote = entry[field];
    const remoteText = remote == null ? "" : String(remote);
    const baseline = storageGet(baselineKey(field, point));
    if(!remoteText || remoteText === baseline || remoteText === newValue){
      return newValue;
    }
    // Divergence détectée : le contenu distant n'est ni vide, ni ce qu'on a
    // nous-même écrit en dernier, ni déjà identique à notre nouvelle valeur —
    // quelqu'un d'autre a modifié ce champ entretemps. On concatène pour ne
    // rien perdre, plutôt que d'écraser sa contribution.
    return remoteText + "\n\n— autre contribution —\n\n" + newValue;
  }

  function rememberBaseline(field, point, finalValue){
    storageSet(baselineKey(field, point), finalValue == null ? "" : String(finalValue));
  }

  async function pushPointFieldToGithub(point, field, value){
    if(!isConfigured()) return;
    const code = String(point || "").match(/^[A-Za-z]+/);
    if(!code) return;
    const cfg = config();

    try{
      const file = await fetchChannelFile(cfg, code[0]);
      if(!file || !Array.isArray(file.data)) return;

      const entry = file.data.find(item => item && item.point === point);
      if(!entry) return; // le point n'existe pas encore côté Assistant : rien à mettre à jour

      const finalValue = resolveFieldValue(entry, field, point, value);
      entry[field] = finalValue;

      await putChannelFile(cfg, file.path, file.data, file.sha, `Jeu MTC : mise à jour ${field} de ${point}`);
      rememberBaseline(field, point, finalValue);
    }catch(error){
      // Une seule retentative en cas de conflit (SHA périmé par une écriture
      // concurrente côté Assistant) ; l'écriture locale a de toute façon déjà
      // réussi avant cet appel, donc rien n'est perdu pour l'utilisatrice si
      // GitHub échoue ici.
      try{
        const retryFile = await fetchChannelFile(cfg, code[0]);
        if(retryFile && Array.isArray(retryFile.data)){
          const retryEntry = retryFile.data.find(item => item && item.point === point);
          if(retryEntry){
            const retryFinalValue = resolveFieldValue(retryEntry, field, point, value);
            retryEntry[field] = retryFinalValue;
            await putChannelFile(cfg, retryFile.path, retryFile.data, retryFile.sha, `Jeu MTC : mise à jour ${field} de ${point}`);
            rememberBaseline(field, point, retryFinalValue);
          }
        }
      }catch(retryError){}
    }
  }

  async function putChannelFile(cfg, relativePath, data, sha, message){
    const url = `${apiBaseFor(cfg, relativePath)}?ref=${encodeURIComponent(cfg.branch)}`;
    const body = {
      message,
      content: utf8ToBase64(JSON.stringify(data, null, 2)),
      sha,
      branch: cfg.branch
    };
    const response = await fetch(url, {
      method: "PUT",
      headers: Object.assign({"Content-Type": "application/json"}, apiHeaders(cfg)),
      body: JSON.stringify(body)
    });
    if(!response.ok) throw new Error(`PUT ${relativePath} a échoué (${response.status})`);
  }

  function wrapWithGithubPush(name, field, valueReader){
    const original = window[name];
    if(typeof original !== "function" || original.__githubPushWrapped) return;
    const wrapped = function(){
      const result = original.apply(this, arguments);
      try{
        if(!isConfigured()) return result;
        const point = valueReader.point(arguments);
        const value = valueReader.value(arguments, point);
        if(point && value != null) pushPointFieldToGithub(point, field, value);
      }catch(error){}
      return result;
    };
    wrapped.__githubPushWrapped = true;
    window[name] = wrapped;
  }

  function installWriteHooks(){
    // Notes : savePointNoteFromTextarea(textarea) — 12-10-fullscreen-links.js
    // Champ "note" (singulier) côté Assistant, confirmé par leur backfill —
    // pas "notes", qui créerait une clé séparée au lieu de mettre à jour la leur.
    wrapWithGithubPush("savePointNoteFromTextarea", "note", {
      point: args => args[0] && args[0].dataset && args[0].dataset.point,
      value: args => args[0] && args[0].value
    });

    // Associations : updatePointAssociationsFromTextarea(point, value) — 05-04-final-corrections.js
    wrapWithGithubPush("updatePointAssociationsFromTextarea", "associations", {
      point: args => args[0],
      value: args => args[1]
    });

    // Éditeur combiné : saveAcuEditable(editable) — 30-comparison-redesign.js
    // field ∈ esprit/notes/associations/vs/precaution ; on ne pousse que
    // ceux qu'on gère explicitement (precaution -> "precautions" côté Jeu).
    wrapWithGithubPush("saveAcuEditable", "__acu_editable__", {
      point: args => args[0] && args[0].dataset && args[0].dataset.acuPointId,
      value: () => null // valeur réelle gérée ci-dessous, voir installAcuEditableHook
    });
  }

  // saveAcuEditable pousse vers des champs différents selon dataset.acuCompareEdit ;
  // le wrapper générique ci-dessus ne suffit pas (un seul "field" fixe), donc
  // hook dédié qui lit le champ réel et le traduit vers le nom côté GitHub.
  function installAcuEditableHook(){
    const original = window.saveAcuEditable;
    if(typeof original !== "function" || original.__githubAcuEditableWrapped) return;
    const FIELD_MAP = {notes: "note", associations: "associations", precaution: "precautions"};
    const wrapped = function(editable){
      const result = original.apply(this, arguments);
      try{
        if(!isConfigured() || !editable || !editable.dataset) return result;
        const point = editable.dataset.acuPointId;
        const rawField = editable.dataset.acuCompareEdit;
        const field = FIELD_MAP[rawField];
        if(point && field) pushPointFieldToGithub(point, field, editable.innerText || "");
      }catch(error){}
      return result;
    };
    wrapped.__githubAcuEditableWrapped = true;
    window.saveAcuEditable = wrapped;
  }

  // --- Modale ----------------------------------------------------------------

  function setStatus(text){
    if(statusEl) statusEl.textContent = text;
  }

  function setBusy(isBusy){
    if(!modal) return;
    modal.querySelectorAll("button").forEach(btn => {
      if(!btn.matches("[data-github-close]")) btn.disabled = Boolean(isBusy);
    });
  }

  function updateLastSyncLabel(){
    const label = byId("mtcGithubSyncLastLabel");
    if(!label) return;
    const last = storageGet(LAST_SUCCESS_KEY);
    label.textContent = last
      ? "Dernière synchro réussie : " + new Date(last).toLocaleString("fr-FR")
      : "Jamais synchronisé.";
  }

  function ensureModal(){
    if(modal) return modal;
    const cfg = config();
    modal = document.createElement("div");
    modal.className = "mtc-github-sync-modal";
    modal.id = "mtcGithubSyncModal";
    modal.innerHTML = `
      <div class="mtc-github-sync-card" role="dialog" aria-modal="true" aria-labelledby="mtcGithubSyncTitle">
        <h2 id="mtcGithubSyncTitle">Synchro Assistant Diagnostic</h2>
        <p>Synchronise la base de points avec ton dépôt GitHub privé. Le token reste uniquement sur cet appareil, jamais dans le code du site.</p>
        <div class="mtc-github-sync-fields">
          <label>Propriétaire (owner)
            <input type="text" id="mtcGithubSyncOwner" autocomplete="off" spellcheck="false" value="${escapeAttr(cfg.owner)}">
          </label>
          <label>Dépôt
            <input type="text" id="mtcGithubSyncRepo" autocomplete="off" spellcheck="false" value="${escapeAttr(cfg.repo)}">
          </label>
          <label>Branche
            <input type="text" id="mtcGithubSyncBranch" autocomplete="off" spellcheck="false" placeholder="main" value="${escapeAttr(cfg.branch)}">
          </label>
          <label>Token (fine-grained, ce dépôt uniquement)
            <input type="password" id="mtcGithubSyncToken" autocomplete="off" spellcheck="false" value="${escapeAttr(cfg.token)}">
          </label>
        </div>
        <div class="mtc-github-sync-actions">
          <button type="button" data-github-save>Enregistrer</button>
          <button type="button" data-github-sync-now>Synchroniser maintenant</button>
          <button type="button" class="secondary" data-github-repair title="Corrige les points où une ancienne version du Jeu a écrit la note sous une mauvaise clé, invisible côté Assistant.">Réparer les notes dupliquées</button>
          <button type="button" class="secondary" data-github-close>Fermer</button>
        </div>
        <div class="mtc-github-sync-status" id="mtcGithubSyncStatus"></div>
        <div class="mtc-github-sync-last" id="mtcGithubSyncLastLabel"></div>
      </div>
    `;
    document.body.appendChild(modal);
    statusEl = byId("mtcGithubSyncStatus");

    modal.querySelector("[data-github-close]").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if(event.target === modal) closeModal(); });
    modal.querySelector("[data-github-save]").addEventListener("click", saveConfigFromModal);
    modal.querySelector("[data-github-sync-now]").addEventListener("click", () => {
      saveConfigFromModal();
      syncFromGitHub();
    });
    modal.querySelector("[data-github-repair]").addEventListener("click", () => {
      saveConfigFromModal();
      repairDuplicateNoteKeys();
    });

    updateLastSyncLabel();
    return modal;
  }

  function escapeAttr(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function saveConfigFromModal(){
    storageSet(OWNER_KEY, byId("mtcGithubSyncOwner")?.value.trim() || "");
    storageSet(REPO_KEY, byId("mtcGithubSyncRepo")?.value.trim() || "");
    storageSet(BRANCH_KEY, byId("mtcGithubSyncBranch")?.value.trim() || "main");
    storageSet(TOKEN_KEY, byId("mtcGithubSyncToken")?.value || "");
    setStatus(isConfigured() ? "Réglages enregistrés." : "Renseigne owner, dépôt et token pour activer la synchro.");
  }

  function openModal(){
    ensureModal();
    modal.classList.add("visible");
    setStatus(isConfigured() ? "Prêt à synchroniser." : "Configure un token, un propriétaire et un dépôt pour activer la synchro.");
    updateLastSyncLabel();
  }

  function closeModal(){
    if(modal) modal.classList.remove("visible");
  }

  function ensureButton(){
    if(byId("mtcGithubSyncButton")) return;
    const host = document.querySelector(".topbar-row.topbar-main-row .topbar-main-buttons");
    if(!host) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "mtcGithubSyncButton";
    button.title = "Synchroniser avec l'Assistant Diagnostic (GitHub)";
    button.setAttribute("aria-label", button.title);
    button.innerHTML = '<svg aria-hidden="true" fill="none" height="1.05em" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24" width="1.05em"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg> <span>Sync</span>';
    // 58-mobile-topbar-menu.js tague les boutons repliables une seule fois
    // au boot, avant que ce bouton-ci n'existe (son script est chargé après) ;
    // on pose donc la classe directement ici plutôt que de dépendre de son
    // passage, pour ne pas dépendre de l'ordre d'exécution entre les deux fichiers.
    button.classList.add("mtc-topbar-collapsible");
    button.addEventListener("click", event => {
      event.preventDefault();
      openModal();
    });
    host.appendChild(button);
  }

  function boot(){
    ensureButton();
    installWriteHooks();
    installAcuEditableHook();
    // Synchro auto en arrière-plan si déjà configuré, sans jamais bloquer
    // le chargement normal — le jeu doit être utilisable instantanément.
    window.setTimeout(() => {
      if(isConfigured()) syncFromGitHub();
    }, 3000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
