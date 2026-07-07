/* ============================================================
   12-10-fullscreen-links.js
   Source: ancien bloc <script> #12 (hors JSON-LD)
   id original: mtc-final-point-links-fix-script
   ============================================================ */

(function(){
  const POINT_LINK_ALIASES = {
    P:"P",
    PO:"P",
    LU:"P",
    GI:"GI",
    G1:"GI",
    GL:"GI",
    LI:"GI",
    E:"E",
    ES:"E",
    ST:"E",
    RT:"Rt",
    RP:"Rt",
    SP:"Rt",
    C:"C",
    HT:"C",
    IG:"IG",
    IL:"IG",
    LG:"IG",
    SI:"IG",
    V:"V",
    BL:"V",
    R:"Rn",
    RN:"Rn",
    RE:"Rn",
    KI:"Rn",
    EC:"EC",
    MC:"EC",
    PC:"EC",
    TF:"TF",
    TR:"TF",
    SJ:"TF",
    VB:"VB",
    GB:"VB",
    F:"F",
    LR:"F",
    RM:"RM",
    REN:"RM",
    VC:"RM",
    DM:"DM",
    DU:"DM",
    VG:"DM"
  };

  function safeEscapeHtml(value){
    if(typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function safeEscapeAttribute(value){
    if(typeof escapeAttribute === "function") return escapeAttribute(value);
    return safeEscapeHtml(value);
  }

  function normalizePointReference(canal, number){
    let c = String(canal || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

    c = c.replace(/[^A-Z0-9]/g, "");

    /* Confusions fréquentes au clavier ou à l’OCR : IG/lG/LG, GI/Gl/G1. */
    if(c === "LG" || c === "IL") c = "IG";
    if(c === "GL" || c === "G1") c = "GI";

    const canonical = POINT_LINK_ALIASES[c];
    if(!canonical) return "";

    const n = String(number || "").replace(/^0+/, "") || String(number || "");
    const point = canonical + n;

    return (typeof POINT_DETAILS !== "undefined" && POINT_DETAILS && POINT_DETAILS[point])
      ? point
      : "";
  }

  function displayPoint(point){
    if(typeof formatPointCode === "function") return formatPointCode(point);
    return String(point || "").replace(/^([A-Za-z]+)(\d+)$/, "$1 $2");
  }

  function makeInlinePointLink(point){
    const label = displayPoint(point);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-point-link";
    button.textContent = label;
    button.title = "Ouvrir la fiche " + label;
    button.setAttribute("aria-label", "Ouvrir la fiche " + label);
    button.addEventListener("click", function(event){
      event.stopPropagation();
      if(typeof openPointPanelDirect === "function"){
        openPointPanelDirect(point);
      }
    });
    return button;
  }

  function makeInlineBasketButton(point){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-point-basket-button";
    button.dataset.basketPoint = point;
    button.dataset.basketCompact = "1";
    button.textContent = "+";
    button.title = "Mettre de côté";
    button.setAttribute("aria-label", "Mettre de côté");
    button.addEventListener("click", function(event){
      event.stopPropagation();
      if(typeof toggleReviewBasketPoint === "function"){
        toggleReviewBasketPoint(point);
      }
    });
    return button;
  }

  const pointReferenceRegex = /(^|[^A-Za-zÀ-ÿ0-9])((?:GI|Gl|GL|G1|IG|lG|LG|IL|Rt|RT|RP|Rn|RN|EC|MC|TF|TR|VB|RM|REN|VC|DM|DU|VG|P|E|C|V|R|F)\s*[-.]?\s*(\d{1,2}))(?![A-Za-zÀ-ÿ0-9])/gi;

  function replacePointReferencesInTextNode(textNode){
    const text = textNode.nodeValue || "";
    pointReferenceRegex.lastIndex = 0;

    let match;
    let lastIndex = 0;
    let changed = false;
    const fragment = document.createDocumentFragment();

    while((match = pointReferenceRegex.exec(text)) !== null){
      const prefix = match[1] || "";
      const fullReference = match[2] || "";
      const number = match[3] || "";
      const matchStart = match.index + prefix.length;
      const matchEnd = match.index + match[0].length;
      const canal = fullReference.replace(number, "").replace(/[-.\s]/g, "");
      const point = normalizePointReference(canal, number);

      if(!point) continue;

      fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
      fragment.appendChild(makeInlinePointLink(point));
      fragment.appendChild(makeInlineBasketButton(point));
      lastIndex = matchEnd;
      changed = true;
    }

    if(!changed) return;

    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    textNode.parentNode.replaceChild(fragment, textNode);
  }

  function shouldSkipNode(node){
    if(!node || node.nodeType !== 1) return false;
    return !!node.closest("button,a,textarea,script,style,select,.inline-point-link,.inline-point-basket-button");
  }

  window.enhancePointReferencesInPanel = function(root){
    root = root || document.getElementById("pointPanelContent");
    if(!root) return;

    const targets = root.querySelectorAll(".js-point-ref-content, .point-note-display");

    targets.forEach(target => {
      const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node){
            if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if(shouldSkipNode(node.parentElement)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(replacePointReferencesInTextNode);
    });
  };

  function plainTextWithBreaks(value){
    return safeEscapeHtml(String(value || "").trim()).replace(/\n/g, "<br>");
  }

  function pointNoteDisplayHtml(value){
    const clean = String(value || "").trim();
    if(!clean) return `<span class="point-note-empty">Aucune note pour l’instant.</span>`;
    return plainTextWithBreaks(clean);
  }

  window.formatNoteTextForDisplay = pointNoteDisplayHtml;

  function categoryInfoForLineFinal(line){
    if(typeof categoryInlineInfoButtons !== "function") return "";
    try{ return categoryInlineInfoButtons(line) || ""; }
    catch(error){ return ""; }
  }

  function pointAssociationsValueFinal(point, fallback){
    try{
      const stored = localStorage.getItem("mtc_point_associations_" + String(point || ""));
      if(stored !== null) return stored;
    }catch(error){}
    return String(fallback || "");
  }

  function pointAssociationsDisplayHtmlFinal(value){
    const clean = String(value || "").trim();
    if(!clean) return `<span class="point-association-empty">Aucune association renseignée.</span>`;
    return `<span class="js-point-ref-content">${plainTextWithBreaks(clean)}</span>`;
  }

  function renderPointAssociationsSectionFinal(point, value){
    const current = pointAssociationsValueFinal(point, value);
    const admin = Boolean(window.MTC_DATABASE_ADMIN_MODE);
    return `
      <details class="point-info-section point-associations-section" open>
        <summary class="point-associations-summary">
          <span>Associations</span>
          ${admin ? `<button type="button" class="point-association-edit-button" onclick="event.preventDefault();event.stopPropagation();togglePointAssociationsEdit(this)" title="Corriger les associations" aria-label="Corriger les associations" aria-pressed="false">✎</button>` : ""}
        </summary>
        <div class="point-association-display js-point-ref-content">${pointAssociationsDisplayHtmlFinal(current)}</div>
        ${admin ? `<textarea hidden class="point-association-textarea" data-point="${safeEscapeAttribute(point)}" oninput="updatePointAssociationsFromTextarea(this)" onblur="commitPointAssociationsFromTextarea(this)" placeholder="Ajoute les associations de ce point…">${safeEscapeHtml(current)}</textarea>` : ""}
      </details>
    `;
  }

  window.renderPointInfoSections = function(sections, point){
    return sections
      .filter(([title,value]) =>
        title === "Notes" ||
        title === "Associations" ||
        (
          value &&
          value !== "(Aucune)" &&
          value !== "Aucune"
        )
      )
      .map(([title,value]) => {
        if(title === "Associations"){
          return renderPointAssociationsSectionFinal(point, value);
        }

        if(title === "Notes"){
          const noteValue = typeof getEditablePointNote === "function"
            ? getEditablePointNote(point, value)
            : (value || "");

          return `
            <details class="point-info-section point-note-section" open>
              <summary class="point-note-summary">
                <span>${safeEscapeHtml(title)}</span>
                <button
                  type="button"
                  class="point-note-edit-button"
                  onclick="togglePointNoteEdit(this)"
                  title="Modifier les notes"
                  aria-label="Modifier les notes"
                >✎</button>
              </summary>

              <div class="point-note-display js-point-ref-content">
                ${pointNoteDisplayHtml(noteValue)}
              </div>

              <textarea
                class="point-note-textarea"
                data-point="${safeEscapeAttribute(point)}"
                oninput="savePointNoteFromTextarea(this)"
                style="display:none;"
                placeholder="Ajoute tes remarques personnelles sur ce point..."
              >${safeEscapeHtml(noteValue)}</textarea>

              <div class="point-note-hint">
                Clique sur le crayon pour écrire. Tes notes restent dans ce navigateur. Tu peux toujours les exporter pour les sauvegarder, puis importer pour les récupérer sur un autre appareil ou navigateur.
              </div>
            </details>
          `;
        }

        let content;
        if(title === "Catégories du point"){
          content = String(value || "")
            .split(/\n/)
            .map(line => `${safeEscapeHtml(line)}${categoryInfoForLineFinal(line)}`)
            .join("\n");
        }else{
          content = plainTextWithBreaks(value);
        }

        return `
          <details class="point-info-section">
            <summary>${safeEscapeHtml(title)}</summary>
            <div>${content}</div>
          </details>
        `;
      })
      .join("");
  };

  window.savePointNoteFromTextarea = function(textarea){
    const point = textarea?.dataset?.point;
    if(!point) return;

    try{
      if(typeof noteStorageKey === "function"){
        localStorage.setItem(noteStorageKey(point), textarea.value);
      }else{
        localStorage.setItem("mtc_point_note_" + String(point), textarea.value);
      }
    }catch(error){
      console.error(error);
    }

    const section = textarea.closest(".point-info-section");
    const display = section?.querySelector(".point-note-display");

    if(display){
      display.innerHTML = pointNoteDisplayHtml(textarea.value);
      display.classList.add("js-point-ref-content");
      enhancePointReferencesInPanel(section);
    }
  };

  function wrapPanelOpenFunction(name){
    const original = window[name];
    if(typeof original !== "function" || original.__pointLinksFixed) return;

    const wrapped = function(){
      const result = original.apply(this, arguments);
      enhancePointReferencesInPanel(document.getElementById("pointPanelContent"));
      return result;
    };

    wrapped.__pointLinksFixed = true;
    window[name] = wrapped;
  }

  wrapPanelOpenFunction("openPointPanel");
  wrapPanelOpenFunction("openPointPanelDirect");

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      enhancePointReferencesInPanel(document.getElementById("pointPanelContent"));
    });
  }else{
    enhancePointReferencesInPanel(document.getElementById("pointPanelContent"));
  }
})();
