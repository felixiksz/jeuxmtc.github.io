/* === PHARMA Bucket 4 : fiches des substances médicinales ===
   Réutilise le panneau latéral existant, sans modifier les fiches ACU.
   En PHARMA, les tuiles trouvées peuvent ouvrir une fiche plante. */
(function(){
  "use strict";

  const ESPRIT_STORAGE_PREFIX = "mtc_pharma_herb_esprit_";
  const NOTES_STORAGE_PREFIX = "mtc_pharma_herb_notes_";
  const IMAGE_STORAGE_PREFIX = "mtc_pharma_herb_image_";

  function isPharmaDomain(){
    return document.documentElement.getAttribute("data-study-domain") === "pharmacology";
  }

  function byId(id){
    return document.getElementById(id);
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function escapeAttribute(value){
    return escapeHtml(value).replace(/`/g,"&#096;");
  }

  function titleCasePinyin(value){
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1).toLocaleLowerCase("fr-FR"))
      .join(" ");
  }

  function getHerbById(herbId){
    return (Array.isArray(window.PHARMA_HERBS) ? window.PHARMA_HERBS : [])
      .find(herb => herb && herb.id === herbId) || null;
  }

  function containsCjk(value){
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function getHerbLabel(herb){
    const preferred = herb?.pinyin && !containsCjk(herb.pinyin) ? herb.pinyin : "";
    const fallback = herb?.pinyinSansTons && !containsCjk(herb.pinyinSansTons) ? herb.pinyinSansTons : "";
    return titleCasePinyin(preferred || fallback || herb?.nom || herb?.code || herb?.id || "");
  }

  function getPinyinToneClass(word){
    const toneMap = {
      tone1:"āēīōūǖĀĒĪŌŪǕ",
      tone2:"áéíóúǘÁÉÍÓÚǗ",
      tone3:"ǎěǐǒǔǚǍĚǏǑǓǙ",
      tone4:"àèìòùǜÀÈÌÒÙǛ"
    };

    for(const [cls, chars] of Object.entries(toneMap)){
      if([...String(word || "")].some(ch => chars.includes(ch))) return cls;
    }

    return "tone5";
  }

  function colorizePharmaPinyin(value){
    const words = String(value || "").split(/\s+/).filter(Boolean);
    if(!words.length) return "";

    return words.map(word => `<span class="${getPinyinToneClass(word)}">${escapeHtml(word)}</span>`).join(" ");
  }

  function getMissingDetailedFields(herb){
    if(!herb) return [];

    const checks = [
      ["nature", herb.nature],
      ["saveur", herb.saveur],
      ["tropisme", herb.tropisme],
      ["posologie", herb.posologie],
      ["actions", Array.isArray(herb.actions) ? herb.actions.filter(Boolean).join(" ") : herb.actions]
    ];

    return checks
      .filter(([, value]) => !normalizeMultiline(value))
      .map(([field]) => field);
  }

  function renderIncompleteNotice(herb){
    const missing = Array.isArray(herb?.incompleteFields) && herb.incompleteFields.length
      ? herb.incompleteFields
      : getMissingDetailedFields(herb);

    if(!herb?.missingDetailedSheet && !missing.length) return "";

    const label = missing.length
      ? `Fiche encore partielle : ${escapeHtml(missing.join(", "))}.`
      : "Fiche encore partielle.";

    return `<p class="pharma-incomplete-notice">${label}</p>`;
  }

  function getStoredValue(prefix, herbId){
    try{
      const value = localStorage.getItem(prefix + herbId);
      return value === null ? null : value;
    }catch(error){
      return null;
    }
  }

  function setStoredValue(prefix, herbId, value){
    try{
      localStorage.setItem(prefix + herbId, String(value ?? ""));
    }catch(error){
      /* Si localStorage est indisponible, l'édition reste simplement non persistante. */
    }
  }

  function getHerbEsprit(herb){
    const stored = getStoredValue(ESPRIT_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : (herb.esprit || "");
  }

  function getHerbNotes(herb){
    const stored = getStoredValue(NOTES_STORAGE_PREFIX, herb.id);
    return stored !== null ? stored : "";
  }

  function normalizeMultiline(value){
    return String(value || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim();
  }

  function renderValue(value){
    const text = normalizeMultiline(value);
    if(!text) return "";
    return escapeHtml(text).replace(/\n/g,"<br>");
  }

  function renderList(values){
    const items = Array.isArray(values)
      ? values.map(item => normalizeMultiline(item)).filter(Boolean)
      : [];

    if(!items.length) return "";

    return `<ul class="pharma-field-list">${items.map(item => `<li>${renderValue(item)}</li>`).join("")}</ul>`;
  }

  function getHerbImage(herb){
    return getStoredValue(IMAGE_STORAGE_PREFIX, herb.id) || "";
  }

  function setHerbImage(herbId, value){
    setStoredValue(IMAGE_STORAGE_PREFIX, herbId, value || "");
  }

  function renderImageBlock(herb){
    const img = getHerbImage(herb);
    const hasImage = Boolean(img);
    return `
      <section class="pharma-image-block ${hasImage ? "has-image" : "is-empty"}" data-pharma-image-block="${escapeAttribute(herb.id)}">
        <div class="pharma-image-title">Image locale</div>
        <div class="pharma-image-preview">
          ${hasImage ? `<img src="${escapeAttribute(img)}" alt="Image locale de ${escapeAttribute(getHerbLabel(herb))}">` : `<span class="pharma-image-empty">Aucune image locale</span>`}
        </div>
        <div class="pharma-image-actions">
          <label class="pharma-image-upload">
            <span>${hasImage ? "Modifier l’image" : "Choisir une image"}</span>
            <input type="file" accept="image/*" data-pharma-image-input="${escapeAttribute(herb.id)}">
          </label>
          <button type="button" data-pharma-image-remove="${escapeAttribute(herb.id)}" ${hasImage ? "" : "disabled"}>Supprimer</button>
        </div>
        <p class="pharma-image-note">Image enregistrée localement dans ce navigateur.</p>
      </section>
    `;
  }

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

  function renderInfoSection(title, value){
    let rendered = "";

    if(Array.isArray(value)){
      rendered = renderList(value);
    }else{
      rendered = renderValue(value);
    }

    if(!rendered) return "";

    return `
      <details class="point-info-section pharma-info-section" open>
        <summary>${escapeHtml(title)}</summary>
        <div>${rendered}</div>
      </details>
    `;
  }

  function getDisplayFieldLabels(field, herb, fallback){
    if(typeof window.getPharmaDisplayFieldLabels === "function"){
      return window.getPharmaDisplayFieldLabels(field, herb, fallback);
    }
    return normalizeMultiline(fallback || "");
  }

  function renderEditableBlock({title, value, placeholder, field}){
    return `
      <section class="pharma-editable-block pharma-editable-${escapeAttribute(field)}">
        <div class="pharma-editable-title">${escapeHtml(title)}</div>
        <textarea
          class="pharma-editable-textarea"
          data-pharma-edit-field="${escapeAttribute(field)}"
          placeholder="${escapeAttribute(placeholder || "")}">${escapeHtml(value || "")}</textarea>
      </section>
    `;
  }

  function bindEditors(herb){
    document.querySelectorAll("[data-pharma-image-input]").forEach(input => {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if(!file) return;
        resizeImageFileToDataUrl(file, dataUrl => {
          try{
            setHerbImage(herb.id, dataUrl);
            openPharmaHerbPanel(herb.id);
            document.dispatchEvent(new CustomEvent("pharma-herb-edited", {detail:{herbId:herb.id, field:"image"}}));
          }catch(error){
            const message = byId("message");
            if(message) message.textContent = "Image trop lourde pour l’enregistrement local.";
          }
        });
      });
    });

    document.querySelectorAll("[data-pharma-image-remove]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        setHerbImage(herb.id, "");
        openPharmaHerbPanel(herb.id);
        document.dispatchEvent(new CustomEvent("pharma-herb-edited", {detail:{herbId:herb.id, field:"image"}}));
      });
    });

    document.querySelectorAll("[data-pharma-edit-field]").forEach(textarea => {
      const field = textarea.getAttribute("data-pharma-edit-field");

      textarea.addEventListener("input", () => {
        if(field === "esprit"){
          setStoredValue(ESPRIT_STORAGE_PREFIX, herb.id, textarea.value);
        }

        if(field === "notes"){
          setStoredValue(NOTES_STORAGE_PREFIX, herb.id, textarea.value);
        }

        document.dispatchEvent(new CustomEvent("pharma-herb-edited", {
          detail:{herbId:herb.id, field}
        }));
      });
    });
  }

  function openPanelWithContent(html, herb){
    const panel = byId("pointPanel");
    const toggle = byId("panelToggle");
    const content = byId("pointPanelContent");

    if(!panel || !content) return;

    content.innerHTML = html;

    panel.classList.add("available", "open", "pharma-herb-panel");
    panel.setAttribute("data-panel-kind", "pharma-herb");

    if(toggle){
      toggle.innerHTML = "&gt;";
    }

    document.body.classList.add("panel-open");
    bindEditors(herb);
    if(window.updatePharmaBasketButtons) window.updatePharmaBasketButtons(herb.id);
  }

  function openPharmaHerbPanel(herbId){
    if(!isPharmaDomain()) return;

    const herb = getHerbById(herbId);

    if(!herb){
      openPanelWithContent(`
        <div class="point-header pharma-herb-header">
          <span class="point-code">${escapeHtml(herbId || "?")}</span>
        </div>
        <p>Aucune fiche trouvée pour cette substance.</p>
      `, {id:herbId || "unknown"});
      return;
    }

    const pinyin = getHerbLabel(herb);
    const hanzi = herb.hanzi || "";
    const nom = herb.nom || "";

    const natureLabels = [getDisplayFieldLabels("nature", herb, herb.nature), getDisplayFieldLabels("toxicity", herb, "")]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .join(", ");

    const sections = [
      ["Classe", herb.classe],
      ["Nature", natureLabels],
      ["Saveur", getDisplayFieldLabels("saveur", herb, herb.saveur)],
      ["Tropisme", getDisplayFieldLabels("tropism", herb, herb.tropisme)],
      ["Posologie", herb.posologie],
      ["Actions", herb.actions],
      ["Indications", herb.indications],
      ["Contre-indications", herb.contre_indications || herb.contraindications],
      ["Préparation", herb.preparation]
    ];

    const html = `
      ${renderImageBlock(herb)}

      <div class="point-header pharma-herb-header">
        <span class="point-code pharma-herb-pinyin">${colorizePharmaPinyin(pinyin)}</span>
        ${hanzi ? `<span class="point-separator">·</span><span class="point-hanzi-inline">${escapeHtml(hanzi)}</span>` : ""}
        ${nom ? `<span class="point-separator">·</span><span class="point-fr-inline">${escapeHtml(nom)}</span>` : ""}
        <button
          type="button"
          class="pharma-herb-panel-basket-add pharma-basket-button"
          data-pharma-basket-herb="${escapeAttribute(herb.id)}"
          onclick="event.preventDefault(); event.stopPropagation(); if(window.togglePharmaBasketHerb) window.togglePharmaBasketHerb('${escapeAttribute(herb.id)}')"
          title="Ajouter/retirer du panier de révision"
          aria-label="Ajouter/retirer cette substance du panier de révision"
        >+</button>
      </div>

      ${renderIncompleteNotice(herb)}

      ${renderEditableBlock({
        title:"Esprit",
        value:getHerbEsprit(herb),
        placeholder:"Résumé court des actions principales…",
        field:"esprit"
      })}

      ${sections.map(([title, value]) => renderInfoSection(title, value)).join("")}

      ${renderEditableBlock({
        title:"Notes personnelles",
        value:getHerbNotes(herb),
        placeholder:"Ajouter une note personnelle…",
        field:"notes"
      })}
    `;

    openPanelWithContent(html, herb);
  }

  window.getPharmaHerbImage = function(herbId){
    const herb = getHerbById(herbId);
    return herb ? getHerbImage(herb) : "";
  };

  window.getPharmaHerbEsprit = function(herbId){
    const herb = getHerbById(herbId);
    return herb ? getHerbEsprit(herb) : "";
  };

  window.openPharmaHerbPanel = openPharmaHerbPanel;
})();
