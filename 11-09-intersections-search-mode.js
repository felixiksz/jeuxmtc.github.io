/* ============================================================
   11-09-intersections-search-mode.js
   Source: ancien bloc <script> #11 (hors JSON-LD)
   id original: mtc-fullscreen-links-script
   ============================================================ */

(function(){
  const POINT_CANONICAL_ALIASES = {
    P:"P",
    GI:"GI",
    GL:"GI",
    E:"E",
    RT:"Rt",
    RP:"Rt",
    C:"C",
    IG:"IG",
    LG:"IG",
    V:"V",
    RN:"Rn",
    R:"Rn",
    EC:"EC",
    MC:"EC",
    TF:"TF",
    TR:"TF",
    VB:"VB",
    F:"F",
    RM:"RM",
    REN:"RM",
    VC:"RM",
    DM:"DM",
    DU:"DM",
    VG:"DM"
  };

  function normalizePointCodeFromParts(rawCanal, rawNumber){
    let canal = String(rawCanal || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const number = String(rawNumber || "").trim();
    if(!canal || !number) return "";

    canal = canal.toUpperCase();

    /* Confusions fréquentes : IG tapé lG, GI tapé Gl. */
    if(/^[IL]G$/.test(canal)) canal = "IG";
    if(/^G[IL]$/.test(canal)) canal = "GI";

    const normalizedCanal = POINT_CANONICAL_ALIASES[canal];
    if(!normalizedCanal) return "";

    return normalizedCanal + number;
  }

  function pointExists(point){
    return !!(point && window.POINT_DETAILS && POINT_DETAILS[point]);
  }

  function pointReferenceHtml(point){
    const label = typeof formatPointCode === "function"
      ? formatPointCode(point)
      : String(point).replace(/^([A-Za-zÀ-ÿ]+)\s*(\d+)$/, "$1 $2");

    const openButton = `
      <button
        type="button"
        class="inline-point-link"
        onclick="event.stopPropagation(); openPointPanelDirect('${escapeAttribute(point)}')"
        title="Ouvrir la fiche ${escapeAttribute(label)}"
        aria-label="Ouvrir la fiche ${escapeAttribute(label)}"
      >${escapeHtml(label)}</button>
    `;

    const basketButton = typeof basketButtonHtml === "function"
      ? basketButtonHtml(point, "inline-point-basket-button", true)
      : "";

    return openButton + basketButton;
  }

  window.linkPointReferencesInText = function(value){
    const text = String(value || "");
    if(!text) return "";

    const regex = /(^|[^A-Za-zÀ-ÿ0-9])((?:GI|Gl|G[IiLl]|IG|lG|LG|[iIlL]G|Rt|RT|RP|Rn|RN|EC|MC|TF|TR|VB|RM|REN|VC|DM|DU|VG|P|E|C|V|R|F)\s*[-.]?\s*(\d{1,2}))(?![A-Za-zÀ-ÿ0-9])/g;

    let html = "";
    let lastIndex = 0;
    let match;

    while((match = regex.exec(text)) !== null){
      const prefix = match[1] || "";
      const fullReference = match[2] || "";
      const number = match[3] || "";
      const matchStart = match.index + prefix.length;
      const matchEnd = match.index + match[0].length;
      const canalPart = fullReference.replace(number, "").replace(/[-.\s]/g, "");
      const normalizedPoint = normalizePointCodeFromParts(canalPart, number);

      if(!pointExists(normalizedPoint)){
        continue;
      }

      html += escapeHtml(text.slice(lastIndex, matchStart));
      html += pointReferenceHtml(normalizedPoint);
      lastIndex = matchEnd;
    }

    html += escapeHtml(text.slice(lastIndex));
    return html;
  };

  function linkedTextWithBreaks(value){
    return linkPointReferencesInText(value).replace(/\n/g, "<br>");
  }

  window.formatNoteTextForDisplay = function(value){
    const clean = String(value || "").trim();

    if(!clean){
      return `<span class="point-note-empty">Aucune note pour l’instant.</span>`;
    }

    return linkedTextWithBreaks(clean);
  };

  function categoryInfoForLine(line){
    if(typeof categoryInlineInfoButtons !== "function") return "";
    try{
      return categoryInlineInfoButtons(line) || "";
    }catch(error){
      return "";
    }
  }

  function formatPanelSectionValue(title, value){
    const raw = String(value || "");

    if(title === "Catégories du point"){
      return raw
        .split(/\n/)
        .map(line => `${escapeHtml(line)}${categoryInfoForLine(line)}`)
        .join("\n");
    }

    if(title === "Associations"){
      return linkedTextWithBreaks(raw);
    }

    return escapeHtml(raw);
  }

  window.renderPointInfoSections = function(sections, point){
    return sections
      .filter(([title,value]) =>
        title === "Notes" ||
        (
          value &&
          value !== "(Aucune)" &&
          value !== "Aucune"
        )
      )
      .map(([title,value]) => {
        if(title === "Notes"){
          const noteValue = getEditablePointNote(point, value);

          return `
            <details class="point-info-section point-note-section" open>
              <summary class="point-note-summary">
                <span>${escapeHtml(title)}</span>
                <button
                  type="button"
                  class="point-note-edit-button"
                  onclick="togglePointNoteEdit(this)"
                  title="Modifier les notes"
                  aria-label="Modifier les notes"
                >✎</button>
              </summary>

              <div class="point-note-display">
                ${formatNoteTextForDisplay(noteValue)}
              </div>

              <textarea
                class="point-note-textarea"
                data-point="${escapeAttribute(point)}"
                oninput="savePointNoteFromTextarea(this)"
                style="display:none;"
                placeholder="Ajoute tes remarques personnelles sur ce point..."
              >${escapeHtml(noteValue)}</textarea>

              <div class="point-note-hint">
                Clique sur le crayon pour écrire. Tes notes restent dans ce navigateur. Tu peux toujours les exporter pour les sauvegarder, puis importer pour les récupérer sur un autre appareil ou navigateur.
              </div>
            </details>
          `;
        }

        return `
          <details class="point-info-section">
            <summary>${escapeHtml(title)}</summary>
            <div>${formatPanelSectionValue(title, value)}</div>
          </details>
        `;
      })
      .join("");
  };

  function browserFullscreenElement(){
    return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null;
  }

  window.updateFullscreenToggleButton = function(){
    const button = document.getElementById("fullscreenToggleButton");
    if(!button) return;

    const active = !!browserFullscreenElement();
    button.textContent = active ? "↙" : "⛶";
    button.title = active ? "Revenir en mode normal" : "Passer en plein écran";
    button.setAttribute("aria-label", button.title);
  };

  window.toggleFullscreenMode = function(){
    const active = !!browserFullscreenElement();

    if(active){
      const exit = document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if(exit){
        try{ exit.call(document); }catch(error){ console.error(error); }
      }
      return;
    }

    const root = document.documentElement;
    const request = root.requestFullscreen ||
      root.webkitRequestFullscreen ||
      root.mozRequestFullScreen ||
      root.msRequestFullscreen;

    if(request){
      try{ request.call(root); }catch(error){ console.error(error); }
    }
  };

  function installFullscreenButton(){
    if(document.getElementById("fullscreenToggleButton")) return;

    const firstTopbarRow = document.querySelector(".topbar .topbar-row");
    if(!firstTopbarRow) return;

    const button = document.createElement("button");
    button.id = "fullscreenToggleButton";
    button.type = "button";
    button.className = "fullscreen-toggle-button";
    button.onclick = toggleFullscreenMode;

    firstTopbarRow.appendChild(button);
    updateFullscreenToggleButton();
  }

  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"]
    .forEach(eventName => document.addEventListener(eventName, updateFullscreenToggleButton));

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", installFullscreenButton);
  }else{
    installFullscreenButton();
  }
})();
