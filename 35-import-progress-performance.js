/* === 35-import-progress-performance.js
   Barre d'import notes/images style terminal/MS-DOS.
   Objectif : apparaître dès le choix du fichier, progresser pendant la lecture,
   puis se terminer seulement quand l'import réel envoie mtc-personal-data-imported.
   Ne modifie pas les données importées. === */
(function(){
  "use strict";

  const previousImport = window.importPersonalNotesFromFile;
  const FileReaderProto = window.FileReader && window.FileReader.prototype;
  const originalReadAsText = FileReaderProto && FileReaderProto.readAsText;

  let box = null;
  let armedForImport = false;
  let importStartedAt = 0;
  let progressValue = 0;
  let softTimer = 0;
  let watchdogTimer = 0;
  let lastFileName = "fichier local";
  let lastFileSize = 0;

  function clampPercent(value){
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  function escText(value){
    return String(value == null ? "" : value).replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 110);
  }

  function humanSize(bytes){
    const value = Number(bytes) || 0;
    if(value < 1024) return value + " o";
    if(value < 1024 * 1024) return Math.round(value / 1024) + " Ko";
    return (value / (1024 * 1024)).toFixed(1).replace(".", ",") + " Mo";
  }

  function ensureBox(){
    if(box && document.body && document.body.contains(box)) return box;
    if(!document.body) return null;

    box = document.createElement("div");
    box.id = "mtcImportProgressDos";
    box.hidden = true;
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.innerHTML = [
      '<div class="mtc-dos-line mtc-dos-head"><span class="mtc-dos-prompt">C:\\MTC\\IMPORT&gt;</span><span data-dos-percent>000%</span></div>',
      '<div class="mtc-dos-line" data-dos-file>FICHIER: —</div>',
      '<div class="mtc-dos-bar"><span data-dos-bar>[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]</span></div>',
      '<div class="mtc-dos-line mtc-dos-status" data-dos-status>EN ATTENTE...</div>'
    ].join("");
    document.body.appendChild(box);
    return box;
  }

  function render(value, status){
    const node = ensureBox();
    if(!node) return;

    const percent = clampPercent(value);
    progressValue = Math.max(progressValue, percent);

    const total = 30;
    const filled = Math.max(0, Math.min(total, Math.round((progressValue / 100) * total)));
    const bar = "[" + "█".repeat(filled) + "░".repeat(total - filled) + "]";

    const percentNode = node.querySelector("[data-dos-percent]");
    const fileNode = node.querySelector("[data-dos-file]");
    const barNode = node.querySelector("[data-dos-bar]");
    const statusNode = node.querySelector("[data-dos-status]");

    if(percentNode) percentNode.textContent = String(progressValue).padStart(3, "0") + "%";
    if(fileNode) fileNode.textContent = "FICHIER: " + escText(lastFileName) + (lastFileSize ? "  (" + humanSize(lastFileSize) + ")" : "");
    if(barNode) barNode.textContent = bar;
    if(statusNode && status) statusNode.textContent = escText(status).toUpperCase();

    node.hidden = false;
    node.classList.toggle("is-complete", progressValue >= 100);
  }

  function resetTimers(){
    window.clearInterval(softTimer);
    window.clearTimeout(watchdogTimer);
    softTimer = 0;
    watchdogTimer = 0;
  }

  function startSoftProgress(){
    window.clearInterval(softTimer);
    softTimer = window.setInterval(() => {
      if(!importStartedAt) return;
      if(progressValue < 10) render(progressValue + 1, "INITIALISATION...");
      else if(progressValue < 42) render(progressValue + 1, "LECTURE DU JSON...");
      else if(progressValue < 68) render(progressValue + 1, "ANALYSE NOTES / IMAGES...");
      else if(progressValue < 92) render(progressValue + 1, "ÉCRITURE LOCALE...");
    }, 115);
  }

  function start(file, source){
    if(importStartedAt && Date.now() - importStartedAt < 900){
      if(file && file.name) lastFileName = file.name;
      if(file && file.size) lastFileSize = file.size;
      render(Math.max(progressValue, 2), source === "change" ? "FICHIER SÉLECTIONNÉ..." : "IMPORT EN COURS...");
      return;
    }
    resetTimers();
    armedForImport = true;
    importStartedAt = Date.now();
    progressValue = 0;
    lastFileName = file && file.name ? file.name : "fichier local";
    lastFileSize = file && file.size ? file.size : 0;
    render(1, source === "change" ? "FICHIER SÉLECTIONNÉ..." : "INITIALISATION IMPORT NOTES / IMAGES...");
    startSoftProgress();

    watchdogTimer = window.setTimeout(() => {
      if(!importStartedAt) return;
      const message = document.getElementById("message");
      const text = message ? String(message.textContent || "") : "";
      if(/import impossible|fichier .* invalide|erreur/i.test(text)){
        fail("IMPORT IMPOSSIBLE OU FICHIER INVALIDE.");
      }else if(progressValue < 96){
        render(96, "EN ATTENTE DE CONFIRMATION...");
      }
    }, 10000);
  }

  function finish(label){
    if(!importStartedAt && !box) return;
    resetTimers();
    armedForImport = false;
    render(100, label || "IMPORT TERMINÉ.");
    window.setTimeout(() => {
      if(box) box.hidden = true;
      importStartedAt = 0;
      progressValue = 0;
      lastFileName = "fichier local";
      lastFileSize = 0;
    }, 1700);
  }

  function fail(label){
    if(!importStartedAt && !box) return;
    resetTimers();
    armedForImport = false;
    const node = ensureBox();
    if(node) node.classList.add("is-error");
    render(Math.max(progressValue, 100), label || "IMPORT IMPOSSIBLE OU FICHIER INVALIDE.");
    window.setTimeout(() => {
      if(box){ box.hidden = true; box.classList.remove("is-error", "is-complete"); }
      importStartedAt = 0;
      progressValue = 0;
      lastFileName = "fichier local";
      lastFileSize = 0;
    }, 2600);
  }

  function attachReaderProgress(reader, file){
    if(!reader || reader.__mtcDosImportProgressAttached35) return;
    reader.__mtcDosImportProgressAttached35 = true;
    if(file && file.name) lastFileName = file.name;
    if(file && file.size) lastFileSize = file.size;

    reader.addEventListener("loadstart", () => {
      if(!importStartedAt) return;
      render(5, "LECTURE DU FICHIER...");
    });

    reader.addEventListener("progress", event => {
      if(!importStartedAt) return;
      if(event && event.lengthComputable && event.total > 0){
        const readPercent = event.loaded / event.total;
        render(6 + readPercent * 54, "LECTURE DU FICHIER...");
      }else{
        render(Math.max(progressValue, 24), "LECTURE DU FICHIER...");
      }
    });

    reader.addEventListener("load", () => {
      if(!importStartedAt) return;
      render(Math.max(progressValue, 62), "DÉCODAGE JSON...");
      window.setTimeout(() => {
        if(importStartedAt && progressValue < 82) render(82, "ÉCRITURE NOTES / IMAGES...");
      }, 35);
    });

    reader.addEventListener("error", () => fail("ERREUR DE LECTURE DU FICHIER."));
    reader.addEventListener("abort", () => fail("IMPORT ANNULÉ."));
  }

  if(FileReaderProto && originalReadAsText && !FileReaderProto.__mtcDosImportProgressReadAsText35b){
    FileReaderProto.readAsText = function(file){
      if(armedForImport || importStartedAt){
        attachReaderProgress(this, file);
        armedForImport = false;
      }
      return originalReadAsText.apply(this, arguments);
    };
    FileReaderProto.__mtcDosImportProgressReadAsText35b = true;
  }

  function attachInputStart(){
    const input = document.getElementById("notesImportInput");
    if(!input || input.dataset.mtcDosImportStart35 === "1") return;
    input.dataset.mtcDosImportStart35 = "1";
    input.addEventListener("change", event => {
      const file = event.target && event.target.files && event.target.files[0];
      if(file) start(file, "change");
    }, true);
  }

  if(typeof previousImport === "function" && !previousImport.__mtcDosImportProgressWrapped35b){
    const wrapped = function(input){
      const file = input && input.files && input.files[0];
      if(file) start(file, "function");
      try{
        return previousImport.apply(this, arguments);
      }catch(error){
        fail("IMPORT INTERROMPU.");
        throw error;
      }
    };
    wrapped.__mtcDosImportProgressWrapped35b = true;
    window.importPersonalNotesFromFile = wrapped;
  }

  document.addEventListener("mtc-personal-data-imported", event => {
    const count = event && event.detail ? Number(event.detail.count || 0) : 0;
    finish(count
      ? `IMPORT TERMINÉ : ${count} ÉLÉMENT(S) MODIFIÉ(S).`
      : "IMPORT TERMINÉ : AUCUN CHANGEMENT."
    );
  });

  document.addEventListener("mtc-personal-data-import-failed", () => fail("IMPORT IMPOSSIBLE OU FICHIER INVALIDE."));

  window.setInterval(() => {
    if(!importStartedAt) return;
    if(Date.now() - importStartedAt < 700) return;
    const message = document.getElementById("message");
    const text = message ? String(message.textContent || "") : "";
    if(/import impossible|fichier .* invalide|erreur/i.test(text)) fail("IMPORT IMPOSSIBLE OU FICHIER INVALIDE.");
  }, 700);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachInputStart, {once:true});
  else attachInputStart();
})();
