/* ============================================================
   19-17-mobile-blooddrop-support.js
   Source: ancien bloc <script> #19 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Patch cheatsheet : Les 8 merveilleux vaisseaux — points d'intersection/trajet === */
(function(){
  "use strict";

  const EXTRAORDINARY_VESSEL_CHEATSHEET_POINTS = {
    ChongMai: {
      title: "Chōng mài",
      points: [
        "RM1","RM2","RM7","RM24",
        "E1","E30","E36","E37","E39","E42",
        "Rt1","Rt4","Rt12",
        "Rn1","Rn3","Rn6","Rn10","Rn11","Rn12","Rn13","Rn14","Rn15","Rn16","Rn17","Rn18","Rn19","Rn20","Rn21","Rn22","Rn23","Rn24","Rn25","Rn26","Rn27",
        "VB26",
        "DM1","DM4",
        "V11","V17","V40",
        "F1","F3"
      ]
    },
    RenMai: {
      title: "Rèn mài",
      points: [
        "P7","Rn6",
        "RM1","RM3","RM4","RM5","RM7","RM8","RM12","RM15","RM16","RM17","RM24",
        "E1","E4","Rt4","DM1","DM26","DM28"
      ]
    },
    DuMai: {
      title: "Dū mài",
      points: [
        "IG3","GI4","TF5",
        "V1","V2","V11","V12","V16","V23","V35",
        "RM1","RM24",
        "DM1","DM12","DM14","DM16","DM20","DM28",
        "E1","E4","VB20"
      ]
    },
    YinWeiMai: {
      title: "Yīn wéi mài",
      points: [
        "EC6","Rn9","Rt4","Rt12","Rt13","Rt15","Rt16","F14","RM17","RM22","RM23"
      ]
    },
    YangWeiMai: {
      title: "Yáng wéi mài",
      points: [
        "TF5","V63","VB35","VB21","E8","VB13","VB14","VB15","VB16","VB17","VB18","VB19","VB20","DM16","DM15",
        "GI14","IG10","TF13","TF15","VB23","VB24"
      ]
    },
    YinQiaoMai: {
      title: "Yīn qiāo mài",
      points: [
        "Rn2","Rn6","Rn8","P7","E9","E12","V1","C5"
      ]
    },
    YangQiaoMai: {
      title: "Yáng qiāo mài",
      points: [
        "V62","V61","V59","VB29","IG10","GI15","GI16","V1","E1","E2","E3","E4","VB20","IG3"
      ]
    },
    DaiMai: {
      title: "Dài mài",
      points: [
        "VB26","VB27","VB28","VB41","F13","RM8","Rn16","E25","Rt15","V23","V52","DM4","Rn23"
      ]
    }
  };

  function uniquePoints(points){
    const seen = new Set();
    return (points || []).filter(point=>{
      const code = String(point || "").trim();
      if(!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }

  function pointSortKey(point){
    const order = ["P","GI","E","Rt","C","IG","V","Rn","EC","TF","VB","F","RM","DM"];
    const match = String(point).match(/^([A-Za-z]+)(\d+)$/);
    if(!match) return [99, String(point)];
    const canalIndex = order.indexOf(match[1]);
    return [canalIndex < 0 ? 99 : canalIndex, Number(match[2])];
  }

  function sortedUniquePoints(points){
    return uniquePoints(points).sort((a,b)=>{
      const ka = pointSortKey(a);
      const kb = pointSortKey(b);
      if(ka[0] !== kb[0]) return ka[0] - kb[0];
      if(ka[1] !== kb[1]) return ka[1] - kb[1];
      return String(a).localeCompare(String(b), "fr");
    });
  }

  function addEightVesselCheatsheetStyles(){
    if(document.getElementById("eightVesselCheatsheetStyle")) return;
    const style = document.createElement("style");
    style.id = "eightVesselCheatsheetStyle";
    style.textContent = `
      .cheatsheet-vessel-subsection{
        margin:3px 0 5px;
        padding:0;
        border-top:1px solid rgba(0,0,0,.08);
      }

      .cheatsheet-vessel-subsection summary{
        cursor:pointer;
        padding:5px 0 3px;
        font-weight:800;
        opacity:.92;
      }

      .cheatsheet-vessel-points{
        padding:1px 0 5px 8px;
      }

      .cheatsheet-vessel-note{
        margin:0 0 7px;
        font-family:var(--ui-font-family);
        font-size:.76em;
        line-height:1.25;
        opacity:.62;
      }
    `;
    document.head.appendChild(style);
  }

  function overrideRenderCheatsheetPanelWithEightVessels(){
    if(typeof window.renderCheatsheetPanel !== "function") return;

    window.renderCheatsheetPanel = function(){
      addEightVesselCheatsheetStyles();

      function flattenLocal(value){
        if(!value) return [];
        if(Array.isArray(value)) return value.flatMap(flattenLocal);
        if(typeof value === "object") return Object.values(value).flatMap(flattenLocal);
        return [String(value)];
      }

      function pointFullName(point){
        const code = String(point).trim();
        const d = (typeof POINT_DETAILS !== "undefined" && POINT_DETAILS[code]) ? POINT_DETAILS[code] : {};
        return `
          ${typeof basketButtonHtml === "function" ? basketButtonHtml(code, "cheatsheet-basket-button", true) : ""}
          <button
            type="button"
            class="cheatsheet-point-link"
            onclick="openPointPanelDirect('${typeof escapeAttribute === "function" ? escapeAttribute(code) : code}')"
          >
            ${typeof formatPointCode === "function" ? formatPointCode(code) : code}
          </button>
          ${d.pinyin || ""}
          ${d.hanzi || ""}
          ${d.nom_francais || d.nom_complet || ""}
        `;
      }

      function line(labelText, value){
        const points = flattenLocal(value);
        if(points.length === 0) return "";
        return `
          <div class="cheatsheet-line">
            <strong>${labelText}</strong> : ${points.map(pointFullName).join(", ")}
          </div>
        `;
      }

      function simplePointLines(value){
        return flattenLocal(value).map(point => `
          <div class="cheatsheet-line">
            ${pointFullName(point)}
          </div>
        `);
      }

      function section(title, rows){
        const cleanRows = rows.filter(Boolean);
        if(cleanRows.length === 0) return "";
        return `
          <details class="cheatsheet-section">
            <summary>${title}</summary>
            <div>${cleanRows.join("")}</div>
          </details>
        `;
      }

      function label(key){
        return (typeof LABEL_NAMES !== "undefined" && LABEL_NAMES[key]) ||
               (typeof displayLabel === "function" ? displayLabel(key) : key);
      }

      function vesselSubsection(vessel){
        const points = sortedUniquePoints(vessel.points);
        return `
          <details class="cheatsheet-vessel-subsection">
            <summary>${vessel.title}</summary>
            <div class="cheatsheet-vessel-points">
              ${simplePointLines(points).join("")}
            </div>
          </details>
        `;
      }

      const canalOrder = [
        "IG","V","TF","VB","GI","E",
        "P","Rt","C","Rn","EC","F",
        "RM","DM"
      ];

      let html = `
        <div class="point-header">
          <span class="point-code">Cheatsheet</span>
        </div>
      `;

      Object.entries(RAW_DATA.Categories_de_points || {}).forEach(([key,value])=>{
        const title = DISPLAY_NAMES[key] || key;
        if([
          "Points_Jing_Puits",
          "Points_Ying_Jaillissement",
          "Points_Shu_Riviere",
          "Points_Jing_Fleuve",
          "Points_He_Reunion",
          "Points_Yuan_Source",
          "Points_Xi_Crevasse",
          "Points_Luo_Liaison"
        ].includes(key)){
          html += section(
            title,
            canalOrder.map(canal =>
              line(
                labelForCanalOrVessel(canal),
                flattenLocal(value).filter(p => canalOfPoint(p) === canal)
              )
            )
          );
        }else{
          html += section(title, simplePointLines(value));
        }
      });

      [
        "Points_d_ouverture_des_merveilleux_vaisseaux",
        "Points_Hui_Reunion",
        "Points_generaux",
        "Les_4_mers"
      ].forEach(sectionKey=>{
        const data = RAW_DATA[sectionKey];
        if(!data) return;
        html += section(
          DISPLAY_NAMES[sectionKey] || sectionKey,
          Object.entries(data).map(([labelKey,points]) =>
            line(label(labelKey), points)
          )
        );

        if(sectionKey === "Points_d_ouverture_des_merveilleux_vaisseaux"){
          html += `
            <details class="cheatsheet-section" data-cheatsheet-only="eight-vessels">
              <summary>Les 8 merveilleux vaisseaux</summary>
              <div>
                ${Object.values(EXTRAORDINARY_VESSEL_CHEATSHEET_POINTS).map(vesselSubsection).join("")}
              </div>
            </details>
          `;
        }
      });

      [
        "Points_fenetre_du_ciel",
        "Points_pour_faire_revenir_le_Yang",
        "Points_fantomes_de_Sun_Si_Miao"
      ].forEach(sectionKey=>{
        const data = RAW_DATA[sectionKey];
        if(!data) return;
        html += section(
          DISPLAY_NAMES[sectionKey] || sectionKey,
          simplePointLines(data)
        );
      });

      if(typeof POINT_DETAILS !== "undefined"){
        function isRegularPointCode(code){
          if(typeof mtcRegularPointCode === "function") return mtcRegularPointCode(code);
          return /^(P|GI|E|Rt|C|IG|V|Rn|EC|TF|VB|F|RM|DM)\d+$/.test(String(code));
        }

        function extraordinarySortLabel(point){
          const d = POINT_DETAILS[point] || {};
          return String(d.pinyin || d.nom_francais || d.nom_complet || point)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g,"")
            .toLowerCase();
        }

        const extraordinaryPoints = Object.keys(POINT_DETAILS)
          .filter(point => !isRegularPointCode(point))
          .sort((a,b) => extraordinarySortLabel(a).localeCompare(extraordinarySortLabel(b), "fr"));

        html += section("Points extraordinaires", simplePointLines(extraordinaryPoints));
      }

      cheatsheetPanelContent.innerHTML = html;
      if(typeof updateBasketButtons === "function") updateBasketButtons();
    };
  }

  overrideRenderCheatsheetPanelWithEightVessels();
  document.addEventListener("DOMContentLoaded", overrideRenderCheatsheetPanelWithEightVessels);
})();
