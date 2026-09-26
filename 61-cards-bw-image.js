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
    light:208,
    medium:226,
    strong:240
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
    const maxR = side * 0.02;
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
        if(d > 48) break;
      }
      radii.push(r);
    }
    radii.sort((x, y) => x - y);
    const median = radii[Math.floor(radii.length / 2)];
    return Math.min(maxR, Math.max(minR, median));
  }

  // Chaque point est redessiné à sa taille exacte : contour noir, remplissage
  // blanc (à colorier). marker = [x, y, rayon] en fractions (rayon en fraction
  // du plus grand côté, facultatif : sinon estimé d'après la couleur).
  function drawMarkers(ctx, img, markers){
    const side = Math.max(img.w, img.h);
    (markers || []).forEach(marker => {
      const cx = marker[0] * img.w;
      const cy = marker[1] * img.h;
      const r = Math.max(3, marker[2] ? marker[2] * side : markerRadius(img, cx, cy));
      const lw = Math.max(1.6, r * 0.2);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.08 + lw * 0.1, 0, Math.PI * 2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    });
  }

  // --- Détection automatique des points ----------------------------------------
  // Transformée de Hough sur les bords de couleur (vote dans la direction du
  // gradient) : les points sont des disques pleins de couleur unie, de taille
  // à peu près constante. Un candidat n'est gardé que si son intérieur est
  // uni et nettement différent de son voisinage (ce qui écarte les lettres
  // "o", les chiffres et les graduations). Précision privilégiée : mieux vaut
  // manquer un point (à ajouter d'un clic) que d'en inventer un.
  async function detect(blob){
    const img = await decode(blob, 1000);
    const {w, h, rgba} = img;
    const side = Math.max(w, h);
    const n = w * h;

    // gradient de couleur : on garde, pixel par pixel, le canal le plus fort
    const gx = new Float32Array(n);
    const gy = new Float32Array(n);
    for(let c = 0; c < 3; c++){
      const plane = new Float32Array(n);
      for(let i = 0, p = c; i < n; i++, p += 4) plane[i] = rgba[p];
      const sm = boxBlur(plane, w, h, 1);
      for(let y = 1; y < h - 1; y++){
        for(let x = 1; x < w - 1; x++){
          const i = y * w + x;
          const dx = sm[i + 1] - sm[i - 1];
          const dy = sm[i + w] - sm[i - w];
          if(dx * dx + dy * dy > gx[i] * gx[i] + gy[i] * gy[i]){ gx[i] = dx; gy[i] = dy; }
        }
      }
    }
    const ex = [], ey = [], ux = [], uy = [];
    for(let i = 0; i < n; i++){
      const m = Math.hypot(gx[i], gy[i]);
      if(m > 22){ ex.push(i % w); ey.push((i / w) | 0); ux.push(gx[i] / m); uy.push(gy[i] / m); }
    }

    const rmin = Math.max(3, Math.round(side * 0.0055));
    const rmax = Math.max(rmin + 2, Math.round(side * 0.022));
    const step = Math.max(1, Math.floor((rmax - rmin) / 9));
    const best = new Float32Array(n);
    const bestR = new Int16Array(n);
    for(let r = rmin; r <= rmax; r += step){
      const acc = new Float32Array(n);
      for(let k = 0; k < ex.length; k++){
        for(let sign = -1; sign <= 1; sign += 2){
          const cx = Math.round(ex[k] + sign * ux[k] * r);
          const cy = Math.round(ey[k] + sign * uy[k] * r);
          if(cx >= 0 && cx < w && cy >= 0 && cy < h) acc[cy * w + cx] += 1;
        }
      }
      const norm = 9 / (2 * Math.PI * r);
      const smooth = boxBlur(acc, w, h, 1);
      for(let i = 0; i < n; i++){
        const v = smooth[i] * norm;
        if(v > best[i]){ best[i] = v; bestR[i] = r; }
      }
    }

    const cands = [];
    for(let i = 0; i < n; i++){
      if(best[i] >= 1.4){
        const r = bestR[i];
        if(r >= side * 0.0075){
          cands.push({x:i % w, y:(i / w) | 0, r, s:best[i]});
        }
      }
    }
    cands.sort((a, b) => b.s - a.s);

    const found = [];
    for(const c of cands){
      if(found.some(f => (c.x - f.x) ** 2 + (c.y - f.y) ** 2 < (1.6 * Math.max(c.r, f.r)) ** 2)) continue;
      // intérieur / anneau extérieur
      const inner = [0, 0, 0], ringVals = [[], [], []], edge = [0, 0, 0], innerSq = [0, 0, 0];
      let ni = 0, nr = 0, ne = 0;
      const y0 = Math.max(0, c.y - 3 * c.r), y1 = Math.min(h - 1, c.y + 3 * c.r);
      const x0 = Math.max(0, c.x - 3 * c.r), x1 = Math.min(w - 1, c.x + 3 * c.r);
      for(let y = y0; y <= y1; y++){
        for(let x = x0; x <= x1; x++){
          const d = Math.hypot(y - c.y, x - c.x);
          const p = (y * w + x) * 4;
          if(d <= c.r * 0.7){
            for(let k = 0; k < 3; k++){ inner[k] += rgba[p + k]; innerSq[k] += rgba[p + k] * rgba[p + k]; }
            ni++;
          }else if(d >= c.r * 0.75 && d <= c.r * 0.95){
            for(let k = 0; k < 3; k++) edge[k] += rgba[p + k];
            ne++;
          }else if(d >= c.r * 1.35 && d <= c.r * 2.1){
            for(let k = 0; k < 3; k++) ringVals[k].push(rgba[p + k]);
            nr++;
          }
        }
      }
      if(!ni || !nr || !ne) continue;
      let diff = 0, std = 0, solid = 0;
      for(let k = 0; k < 3; k++){
        const sorted = ringVals[k].sort((a, b) => a - b);
        const mi = inner[k] / ni, mr = sorted[sorted.length >> 1]; // médiane : le fond, pas les lettres voisines
        diff += Math.abs(mi - mr) / 3;
        solid += Math.abs(mi - edge[k] / ne) / 3;
        std += Math.sqrt(Math.max(0, innerSq[k] / ni - mi * mi)) / 3;
      }
      // disque plein : l'intérieur a la même couleur que le bord (une lettre "o" ou "c" a un intérieur vide)
      if(diff < 22 || std > 28 || solid > 30) continue;
      // uniformité : au moins 85 % du disque a la couleur de son centre (une lettre
      // "o" ou "c" a un vide au milieu)
      const core = [0, 0, 0];
      let nc = 0;
      for(let y = y0; y <= y1; y++){
        for(let x = x0; x <= x1; x++){
          if(Math.hypot(y - c.y, x - c.x) <= c.r * 0.5){
            const p = (y * w + x) * 4;
            for(let k = 0; k < 3; k++) core[k] += rgba[p + k];
            nc++;
          }
        }
      }
      if(!nc) continue;
      for(let k = 0; k < 3; k++) core[k] /= nc;
      let match = 0, total = 0;
      for(let y = y0; y <= y1; y++){
        for(let x = x0; x <= x1; x++){
          if(Math.hypot(y - c.y, x - c.x) <= c.r * 0.85){
            const p = (y * w + x) * 4;
            const dist = Math.abs(rgba[p] - core[0]) + Math.abs(rgba[p + 1] - core[1]) + Math.abs(rgba[p + 2] - core[2]);
            if(dist < 45) match++;
            total++;
          }
        }
      }
      if(!total || match / total < 0.85) continue;
      found.push(c);
    }
    return found.map(c => [Number((c.x / w).toFixed(5)), Number((c.y / h).toFixed(5)), Number((c.r / side).toFixed(5))]);
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

  window.MTCCardsBW = {process, render, coverage, detect, FILL_LEVELS};
})();
