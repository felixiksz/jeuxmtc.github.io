
/* 47 — Image locale ACU + bouton nouveauté pharma */
(function(){
  "use strict";
  const ACU_IMAGE_PREFIX = "mtc_point_image_";
  const IMPORTED_KEY = "mtc_personal_data_status_imported_at";
  const OFFICIAL_PHARMA_IMPORT_URLS = [
    "Import_tableau%20pharma_pro(1).json",
    "Import_tableau%20pharma_pro%281%29.json",
    "Import_tableau pharma_pro(1).json"
  ];

  function byId(id){ return document.getElementById(id); }
  function isPharma(){ return document.documentElement.getAttribute("data-study-domain") === "pharmacology"; }
  function esc(value){
    if(typeof window.escapeHtml === "function") return window.escapeHtml(value);
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function attr(value){
    if(typeof window.escapeAttribute === "function") return window.escapeAttribute(value);
    return esc(value).replace(/`/g,"&#096;");
  }
  function formatPoint(point){
    try{ if(typeof window.formatPointCode === "function") return window.formatPointCode(point); }catch(error){}
    return String(point || "");
  }
  function storageGet(key){ try{ return localStorage.getItem(key) || ""; }catch(error){ return ""; } }
  function storageSet(key, value){ try{ localStorage.setItem(key, value || ""); }catch(error){} }
  function storageRemove(key){ try{ localStorage.removeItem(key); }catch(error){} }
  function pointImageKey(point){ return ACU_IMAGE_PREFIX + String(point || ""); }
  function getPointImage(point){ return storageGet(pointImageKey(point)); }
  function setPointImage(point, value){ value ? storageSet(pointImageKey(point), value) : storageRemove(pointImageKey(point)); }
  function resizeImageFileToDataUrl(file, callback){
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || 1) * ratio));
        const height = Math.max(1, Math.round((img.height || 1) * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => callback(String(reader.result || ""));
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }
  function renderAcuImageBlock(point){
    const img = getPointImage(point);
    const hasImage = Boolean(img);
    const label = formatPoint(point);
    return `
      <section class="acu-image-block ${hasImage ? "has-image" : "is-empty"}" data-acu-image-block="${attr(point)}">
        <div class="acu-image-title">Image locale</div>
        <div class="acu-image-preview">
          ${hasImage ? `<img src="${attr(img)}" alt="Image locale de ${attr(label)}">` : `<span class="acu-image-empty">Aucune image locale</span>`}
        </div>
        <div class="acu-image-actions">
          <label class="acu-image-upload">
            <span>${hasImage ? "Modifier l’image" : "Choisir une image"}</span>
            <input type="file" accept="image/*" data-acu-image-input="${attr(point)}">
          </label>
          <button type="button" data-acu-image-remove="${attr(point)}" ${hasImage ? "" : "disabled"}>Supprimer</button>
        </div>
        <p class="acu-image-note">Image enregistrée localement dans ce navigateur.</p>
      </section>
    `;
  }
  function bindAcuImageBlock(point){
    document.querySelectorAll("[data-acu-image-input]").forEach(input => {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if(!file) return;
        resizeImageFileToDataUrl(file, dataUrl => {
          setPointImage(point, dataUrl);
          enhanceAcuPanel(point, true);
          document.dispatchEvent(new CustomEvent("mtc-personal-data-modified", {detail:{point, field:"acu_image"}}));
        });
      }, {once:true});
    });
    document.querySelectorAll("[data-acu-image-remove]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        setPointImage(point, "");
        enhanceAcuPanel(point, true);
        document.dispatchEvent(new CustomEvent("mtc-personal-data-modified", {detail:{point, field:"acu_image"}}));
      }, {once:true});
    });
  }
  function enhanceAcuPanel(point, replace){
    if(isPharma()) return;
    const content = byId("pointPanelContent");
    if(!content || !point) return;
    const existing = content.querySelector(".acu-image-block");
    const html = renderAcuImageBlock(point);
    if(existing && replace){
      existing.outerHTML = html;
    }else if(!existing){
      content.insertAdjacentHTML("afterbegin", html);
    }
    bindAcuImageBlock(point);
  }
  function wrapPointOpeners(){
    if(window.__mtcAcuLocalImageWrapped) return;
    window.__mtcAcuLocalImageWrapped = true;
    const previousDirect = window.openPointPanelDirect;
    const previousPanel = window.openPointPanel;
    if(typeof previousDirect === "function"){
      window.openPointPanelDirect = function(point){
        const result = previousDirect.apply(this, arguments);
        setTimeout(() => enhanceAcuPanel(String(point || ""), false), 0);
        return result;
      };
    }
    if(typeof previousPanel === "function"){
      window.openPointPanel = function(point){
        const result = previousPanel.apply(this, arguments);
        setTimeout(() => enhanceAcuPanel(String(point || ""), false), 0);
        return result;
      };
    }
  }

  function ensureNoveltyStyle(){
    if(byId("mtcImportNoveltyStyle")) return;
    const style = document.createElement("style");
    style.id = "mtcImportNoveltyStyle";
    style.textContent = `
      #mtcPharmaImportNovelty{
        position:fixed!important;
        right:10px!important;
        bottom:calc(env(safe-area-inset-bottom, 0px) + 18px)!important;
        z-index:48!important;
        display:none;
        max-width:min(42vw, 360px)!important;
        padding:2px 5px!important;
        border:0!important;
        background:transparent!important;
        color:color-mix(in srgb, var(--text-color, #111) 72%, transparent)!important;
        box-shadow:none!important;
        font:600 10px/1.22 "Archivo", system-ui, sans-serif!important;
        letter-spacing:.01em!important;
        text-align:right!important;
        text-transform:none!important;
        opacity:.68!important;
        cursor:pointer!important;
      }
      #mtcPharmaImportNovelty .novelty-word{
        text-transform:uppercase!important;
        letter-spacing:.02em!important;
      }
      html[data-study-domain="pharmacology"] body:not(.mtc-memo-open) #mtcPharmaImportNovelty.visible{display:block!important;}
      #mtcPharmaImportNovelty:active{opacity:1!important;transform:translateY(1px);}
      #mtcPharmaImportNovelty[disabled]{opacity:.9!important;cursor:progress!important;}
      @media(max-width:699px){
        #mtcPharmaImportNovelty{
          right:12px!important;
          bottom:calc(env(safe-area-inset-bottom, 0px) + 92px)!important;
          font-size:9px!important;
          max-width:calc(100vw - 24px)!important;
          line-height:1.18!important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  function hasImported(){ return Boolean(storageGet(IMPORTED_KEY)); }
  async function fetchOfficialPharmaImportText(){
    let lastError = null;
    for(const url of OFFICIAL_PHARMA_IMPORT_URLS){
      try{
        const response = await fetch(url, {cache:"no-store"});
        if(!response.ok) throw new Error("HTTP " + response.status);
        return await response.text();
      }catch(error){
        lastError = error;
      }
    }
    throw lastError || new Error("Fichier introuvable");
  }
  async function importOfficialPharmaFromRoot(button){
    const message = byId("message");
    if(button && button.dataset.loading === "1") return;
    if(button){
      button.dataset.loading = "1";
      button.disabled = true;
      button.innerHTML = "✷<span class=\"novelty-word\">NOUVEAUTÉ</span> : ajout en cours…";
    }
    if(message) message.textContent = "Import des fiches détaillées…";
    try{
      const text = await fetchOfficialPharmaImportText();
      const file = new File([text], "Import_tableau pharma_pro(1).json", {type:"application/json"});
      if(typeof window.importPersonalNotesFromFile !== "function") throw new Error("Fonction d'import introuvable");
      window.importPersonalNotesFromFile({files:[file], value:""});
    }catch(error){
      console.error(error);
      if(message) message.textContent = "Import impossible : fichier JSON introuvable au root.";
      if(button){
        button.dataset.loading = "0";
        button.disabled = false;
        button.innerHTML = "✷<span class=\"novelty-word\">NOUVEAUTÉ</span> : ajouter les fiches pharma complètes";
      }
    }
  }
  function ensureNoveltyButton(){
    ensureNoveltyStyle();
    let button = byId("mtcPharmaImportNovelty");
    if(!button){
      button = document.createElement("button");
      button.id = "mtcPharmaImportNovelty";
      button.type = "button";
      button.innerHTML = "✷<span class=\"novelty-word\">NOUVEAUTÉ</span> : ajouter les fiches pharma complètes";
      button.addEventListener("click", event => {
        event.preventDefault();
        importOfficialPharmaFromRoot(button);
      });
      document.body.appendChild(button);
    }
    if(button.dataset.loading !== "1") button.classList.toggle("visible", isPharma() && !hasImported());
  }
  function init(){
    wrapPointOpeners();
    ensureNoveltyButton();
    const obs = new MutationObserver(() => ensureNoveltyButton());
    obs.observe(document.documentElement, {attributes:true, attributeFilter:["data-study-domain"]});
    document.addEventListener("mtc-personal-data-imported", () => setTimeout(ensureNoveltyButton, 0));
    window.addEventListener("storage", event => { if(event.key === IMPORTED_KEY) ensureNoveltyButton(); });
    setInterval(ensureNoveltyButton, 1500);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();

