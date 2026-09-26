/* ============================================================
   61-cards-bw-image.js
   Optimisation d'une image en couleur pour une impression en noir et
   blanc (cartes imprimables, voir 60-pharma-cards.js) :
   - conversion en niveaux de gris ;
   - les traits très pâles (contours pêche des mains/pieds…) sont renforcés,
     sans toucher aux grands aplats clairs (os, ombrages) ;
   - les aplats de couleur (muscles bruns, cuir chevelu gris…) sont éclaircis
     en conservant le contraste avec tout ce qui est plus foncé (texte,
     traits, pointillés, pastilles) ;
   - un liseré blanc puis noir est dessiné autour des points que
     l'utilisatrice a repérés (une pastille de même gris que son fond ne se
     voit plus en noir et blanc).
   Aucune dépendance : fonctions pures sur un Blob, résultat = Blob JPEG.
   ============================================================ */
(function(){
  "use strict";

  const FILL_LEVELS = {
    none:0,
    light:178,
    medium:203,
    strong:222
  };

  // --- Décodage ---------------------------------------------------------------

  async function decode(blob, maxSide){
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", {willReadFrequently:true});
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    if(bitmap.close) bitmap.close();
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for(let i = 0, p = 0; i < gray.length; i++, p += 4){
      gray[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    }
    return {w, h, rgba, gray};
  }

  // --- Filtres (tableaux typés, séparables) --------------------------------------

  function boxBlur(src, w, h, r){
    if(r < 1) return Float32Array.from(src);
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    const size = 2 * r + 1;
    for(let y = 0; y < h; y++){
      const row = y * w;
      let sum = 0;
      for(let x = -r; x <= r; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
      for(let x = 0; x < w; x++){
        tmp[row + x] = sum / size;
        sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for(let x = 0; x < w; x++){
      let sum = 0;
      for(let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for(let y = 0; y < h; y++){
        out[y * w + x] = sum / size;
        sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  function morph(src, w, h, r, takeMax){
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    for(let y = 0; y < h; y++){
      const row = y * w;
      for(let x = 0; x < w; x++){
        let best = takeMax ? -1 : 1e9;
        for(let k = -r; k <= r; k++){
          const v = src[row + Math.min(w - 1, Math.max(0, x + k))];
          if(takeMax ? v > best : v < best) best = v;
        }
        tmp[row + x] = best;
      }
    }
    for(let x = 0; x < w; x++){
      for(let y = 0; y < h; y++){
        let best = takeMax ? -1 : 1e9;
        for(let k = -r; k <= r; k++){
          const v = tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
          if(takeMax ? v > best : v < best) best = v;
        }
        out[y * w + x] = best;
      }
    }
    return out;
  }

  // --- Détection des aplats ------------------------------------------------------

  // Poids d'aplat (0..1) : une zone est un aplat quand elle est sombre (gris <
  // 215) sur une étendue bien plus large qu'un trait, un texte ou une pastille.
  function fillWeight(gray, w, h){
    const side = Math.max(w, h);
    const r = Math.max(3, Math.round(side / 120));
    const dark = new Float32Array(gray.length);
    for(let i = 0; i < gray.length; i++) dark[i] = gray[i] < 215 ? 1 : 0;
    const density = boxBlur(dark, w, h, r);
    const weight = new Float32Array(gray.length);
    for(let i = 0; i < weight.length; i++){
      const t = (density[i] - 0.72) / 0.2;
      weight[i] = t <= 0 ? 0 : (t >= 1 ? 1 : t);
    }
    return {weight:boxBlur(weight, w, h, Math.max(1, Math.round(r / 3))), radius:r};
  }

  async function coverage(blob){
    const img = await decode(blob, 480);
    const fill = fillWeight(img.gray, img.w, img.h).weight;
    let sum = 0;
    for(let i = 0; i < fill.length; i++) sum += fill[i];
    return sum / fill.length;
  }

  // --- Optimisation --------------------------------------------------------------

  function optimizeGray(img, level){
    const {w, h, gray} = img;
    const side = Math.max(w, h);
    const target = FILL_LEVELS[level] === undefined ? FILL_LEVELS.medium : FILL_LEVELS[level];
    const out = new Float32Array(gray.length);

    // 1) traits pâles : sur fond clair, tout ce qui est plus sombre que son
    //    voisinage immédiat (fermeture morphologique) est renforcé.
    const rc = Math.max(2, Math.round(side / 350));
    const closed = morph(morph(gray, w, h, rc, true), w, h, rc, false);
    for(let i = 0; i < gray.length; i++){
      const bg = closed[i];
      const g = gray[i];
      if(bg > 185 && g < bg){
        out[i] = Math.max(0, bg - 2.0 * (bg - g));
      }else{
        out[i] = g;
      }
    }

    if(target > 0){
      // 2) aplats : niveau local du fond (moyenne pondérée par le poids d'aplat)
      const {weight, radius} = fillWeight(gray, w, h);
      const weighted = new Float32Array(gray.length);
      for(let i = 0; i < gray.length; i++) weighted[i] = gray[i] * weight[i];
      const num = boxBlur(weighted, w, h, radius * 2);
      const den = boxBlur(weight, w, h, radius * 2);
      for(let i = 0; i < gray.length; i++){
        const wt = weight[i];
        if(wt <= 0) continue;
        const F = den[i] > 0.02 ? num[i] / den[i] : 160;
        if(F >= target) continue;
        const g = gray[i];
        // courbe locale : le niveau du fond F devient `target`, les valeurs plus
        // sombres (texte, traits, pastilles) sont mises à l'échelle (noir = noir),
        // les plus claires rejoignent le blanc.
        const mapped = g <= F ? g * target / Math.max(F, 1) : target + (g - F) * (255 - target) / Math.max(255 - F, 1);
        out[i] = out[i] * (1 - wt) + mapped * wt;
      }
    }
    return out;
  }

  // Rayon d'une pastille repérée : on s'éloigne du centre tant que la couleur
  // reste proche de celle du point cliqué.
  function markerRadius(img, cx, cy){
    const {w, h, rgba} = img;
    const side = Math.max(w, h);
    const minR = Math.max(3, side * 0.006);
    const maxR = side * 0.03;
    const px = Math.round(cx), py = Math.round(cy);
    const at = (x, y) => {
      const p = (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4;
      return [rgba[p], rgba[p + 1], rgba[p + 2]];
    };
    const c0 = at(px, py);
    const radii = [];
    for(let a = 0; a < 16; a++){
      const dx = Math.cos(a * Math.PI / 8), dy = Math.sin(a * Math.PI / 8);
      let r = 1;
      for(; r < maxR; r += 0.5){
        const c = at(Math.round(px + dx * r), Math.round(py + dy * r));
        const d = Math.abs(c[0] - c0[0]) + Math.abs(c[1] - c0[1]) + Math.abs(c[2] - c0[2]);
        if(d > 70) break;
      }
      radii.push(r);
    }
    radii.sort((x, y) => x - y);
    const median = radii[Math.floor(radii.length / 2)];
    return Math.min(maxR, Math.max(minR, median));
  }

  function drawMarkers(ctx, img, markers){
    (markers || []).forEach(marker => {
      const cx = marker[0] * img.w;
      const cy = marker[1] * img.h;
      const r = markerRadius(img, cx, cy);
      const white = Math.max(2, r * 0.5);
      const black = Math.max(1.6, r * 0.28);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, r + white / 2, 0, Math.PI * 2);
      ctx.lineWidth = white;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r + white + black / 2, 0, Math.PI * 2);
      ctx.lineWidth = black;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    });
  }

  // Blob d'entrée -> canvas optimisé (niveaux de gris + repères).
  async function render(blob, options){
    const opts = options || {};
    const img = await decode(blob, opts.maxSide || 2000);
    const result = optimizeGray(img, opts.level || "medium");
    const canvas = document.createElement("canvas");
    canvas.width = img.w;
    canvas.height = img.h;
    const ctx = canvas.getContext("2d");
    const data = ctx.createImageData(img.w, img.h);
    for(let i = 0, p = 0; i < result.length; i++, p += 4){
      const v = result[i] < 0 ? 0 : (result[i] > 255 ? 255 : Math.round(result[i]));
      data.data[p] = v;
      data.data[p + 1] = v;
      data.data[p + 2] = v;
      data.data[p + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    drawMarkers(ctx, img, opts.markers);
    return canvas;
  }

  async function process(blob, options){
    const canvas = await render(blob, options);
    return new Promise((resolve, reject) => {
      canvas.toBlob(out => out ? resolve(out) : reject(new Error("export impossible")), "image/jpeg", 0.92);
    });
  }

  window.MTCCardsBW = {process, render, coverage, FILL_LEVELS};
})();
