/* ═══════════════════════════════════════════════════════════════════════════
   THE THAUMATROPE — PARCHMENT GROUND

   A warm aged-parchment leaf painted opaquely under every card face. Built in a
   SINGLE deterministic per-pixel pass so the mottle, the centre-bright / edge-dark
   vignette, and the fine paper-tooth grain fuse into one continuous surface with
   no visible tiling seam — then a hairline warm cut-edge and a whisper of foxing
   are laid on top. Low-contrast + opaque by construction: it lives UNDER the ink
   line-art and never fights it.

   The vignette is radial/isotropic and the grain is a well-mixed per-pixel hash —
   deliberately NO axis-aligned structure (no laid-lines, no square-cell / XOR
   hash, no one-directional gradient), so it can never band into vertical slats.

   Contract: full-face painter replacing ThaumFaces.paper(ctx). 360×360, opaque.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  var FS = 360;

  // Base parchment tone (estate warm cream) as linear channel values.
  var BASE_R = 243, BASE_G = 236, BASE_B = 214;

  // Deterministic PRNG (mulberry32) — identical every call so the raster is stable.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  // A tileable-free coarse value-noise lattice, bilinearly + smoothstep interpolated.
  function makeLattice(rnd, n) {
    var g = new Float32Array((n + 1) * (n + 1));
    for (var i = 0; i < g.length; i++) g[i] = rnd();
    return {
      n: n, g: g,
      at: function (nx, ny) {              // nx,ny in [0,1]
        var gx = nx * n, gy = ny * n;
        var x0 = gx | 0, y0 = gy | 0;
        if (x0 >= n) x0 = n - 1; if (y0 >= n) y0 = n - 1;
        var fx = smooth(gx - x0), fy = smooth(gy - y0);
        var row0 = y0 * (n + 1), row1 = row0 + (n + 1);
        var i00 = this.g[row0 + x0], i10 = this.g[row0 + x0 + 1];
        var i01 = this.g[row1 + x0], i11 = this.g[row1 + x0 + 1];
        var top = i00 + (i10 - i00) * fx;
        var bot = i01 + (i11 - i01) * fx;
        return top + (bot - top) * fy;     // [0,1]
      }
    };
  }

  function clamp8(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function paintParchment(ctx) {
    var rnd = mulberry32(0x9E3779B1);

    // Three octaves of warm mottle — broad cloudy unevenness + a mid stain + a
    // finer grain of aged tone. Coarse dominates so the character stays soft and
    // isotropic; the extra octave adds a little more aged life at large scale.
    var coarse = makeLattice(rnd, 7);      // ~51px cells: gentle stains
    var mid = makeLattice(rnd, 11);        // ~33px cells: aged cloudiness
    var fine = makeLattice(rnd, 17);       // ~21px cells: paper unevenness

    // Vignette geometry: light pooled slightly ABOVE centre so the round card
    // catches the top and falls into soft shadow toward the rim.
    var cx = FS * 0.5, cy = FS * 0.44;
    var rx = FS * 0.62, ry = FS * 0.66;

    var img = ctx.createImageData(FS, FS);
    var data = img.data;
    var p = 0;
    for (var y = 0; y < FS; y++) {
      var ndy = (y - cy) / ry;
      for (var x = 0; x < FS; x++) {
        var ndx = (x - cx) / rx;
        // radial falloff 0 (centre) → ~1 (rim)
        var d = Math.sqrt(ndx * ndx + ndy * ndy);
        if (d > 1) d = 1;
        var vig = smooth(d);               // eased edge shadow weight
        var lit = 1 - vig;                 // centre light weight

        var nx = x / FS, ny = y / FS;
        // Warm mottle: centred around 0, low amplitude. Coarse dominates; a hair
        // more coarse/mid weight than before for a touch more aged unevenness.
        var m = (coarse.at(nx, ny) - 0.5) * 1.90
              + (mid.at(nx, ny) - 0.5) * 0.85
              + (fine.at(nx, ny) - 0.5) * 0.70;

        // Fine paper tooth — a well-mixed per-pixel integer hash so the grain is
        // isotropic (no axis banding), tiny amplitude (nudged up a hair so a
        // large-scale single-face inspection still reads as fibrous paper).
        var h = (x * 374761393 + y * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h ^= h >>> 16;
        var grain = (((h >>> 0) / 4294967296) - 0.5) * 3.9;

        // Compose per channel. Centre brightens gently; rim darkens warm
        // (blue falls fastest → the shadow stays golden, never grey).
        var r = BASE_R + lit * 8 - vig * 15 + m * 7 + grain;
        var g = BASE_G + lit * 6 - vig * 20 + m * 5 + grain;
        var b = BASE_B + lit * 3 - vig * 32 + m * 2 + grain * 0.7;

        data[p] = clamp8(r);
        data[p + 1] = clamp8(g);
        data[p + 2] = clamp8(b);
        data[p + 3] = 255;                 // fully opaque
        p += 4;
      }
    }
    ctx.putImageData(img, 0, 0);

    // ── whisper of foxing: a handful of soft, tiny age-specks. A couple more
    //    than before, a hair more visible — still err toward clean, still placed
    //    by the seeded PRNG (isotropic, no directional structure).
    var foxN = 10;
    for (var f = 0; f < foxN; f++) {
      var fxx = 22 + rnd() * (FS - 44);
      var fyy = 22 + rnd() * (FS - 44);
      var fr = 2.2 + rnd() * 3.6;
      var a = 0.055 + rnd() * 0.07;
      var spec = ctx.createRadialGradient(fxx, fyy, 0, fxx, fyy, fr);
      spec.addColorStop(0, 'rgba(150,110,60,' + a.toFixed(3) + ')');
      spec.addColorStop(1, 'rgba(150,110,60,0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(fxx, fyy, fr, 0, 7);
      ctx.fill();
    }

    // ── hairline cut edge: a warm inset border with a faint bright lip just
    // inside it, so the rim reads as a real trimmed leaf.
    ctx.strokeStyle = 'rgba(120,96,52,.26)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, FS - 9, FS - 9);
    ctx.strokeStyle = 'rgba(255,250,236,.20)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 6.5, FS - 13, FS - 13);
  }

  // Registration: expose for the wiring builder AND the preview harness.
  root.installThaumArt = function (A) {
    A.setPaper(paintParchment);
    return 'paper';
  };
  (root.ThaumArt = root.ThaumArt || {}).paper = paintParchment;
})(typeof window !== 'undefined' ? window : globalThis);
