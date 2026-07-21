/* ═══════════════════════════════════════════════════════════════════════════
   THE CENTO PRESS — paper-stock
   "The sheet is not a colour. It is a thickness."

   Everything here is drawn as VARIATION IN HOW MUCH PULP IS THERE, the way a
   mould-made rag sheet actually varies: a cloudy formation field (what you see
   when you hold the sheet up to a lamp), short rag fibres lying in the pulp,
   and the mould's own laid + chain wires printing themselves as thin spots.
   The deckle is one continuous wandering boundary where the pulp simply runs
   out — feathered by stacked translucent passes, never nibbled, with a few
   single fibres surviving out past the boundary half-transparent.

   Determinism is load-bearing: every per-sheet random number comes from o.rnd.
   The shared rag tile is built ONCE from a FIXED internal seed — it is the same
   rag in every sheet — so no sheet's appearance depends on render ORDER.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";
(function () {

  var TAU = Math.PI * 2;

  /* ── small maths ─────────────────────────────────────────────────────── */
  var sm = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };

  /* a tiny fixed-seed PRNG — for the shared rag tile ONLY, never per sheet */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* Tileable value-noise lattice, sampled with wrap so a field can repeat. */
  function lattice(rnd, gw, gh) {
    var g = new Float32Array((gw + 1) * (gh + 1)), x, y;
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) g[y * (gw + 1) + x] = rnd();
    for (y = 0; y < gh; y++) g[y * (gw + 1) + gw] = g[y * (gw + 1)];      /* wrap x */
    for (x = 0; x <= gw; x++) g[gh * (gw + 1) + x] = g[x];                /* wrap y */
    return { gw: gw, gh: gh, g: g };
  }
  function sample(f, u, v) {
    u -= Math.floor(u); v -= Math.floor(v);
    var x = u * f.gw, y = v * f.gh;
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = sm(x - x0), fy = sm(y - y0), w = f.gw + 1;
    var a = f.g[y0 * w + x0], b = f.g[y0 * w + x0 + 1];
    var c = f.g[(y0 + 1) * w + x0], d = f.g[(y0 + 1) * w + x0 + 1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }

  /* A 1-D wrapped noise walk — used for the deckle boundary and tide lines. */
  function walk1(rnd, n) {
    var k = new Float32Array(n), i;
    for (i = 0; i < n; i++) k[i] = rnd();
    return function (t) {                        /* t in 0..1, wraps */
      t -= Math.floor(t);
      var x = t * n, i0 = Math.floor(x), fx = sm(x - i0);
      return lerp(k[i0 % n], k[(i0 + 1) % n], fx);
    };
  }

  /* ── the formation field ──────────────────────────────────────────────
     Low-frequency cloudiness: where the pulp settled thick and thin on the
     mould. Rendered small and scaled up, so it stays soft at every size.   */
  function formationLayer(w, h, rnd, strength) {
    var CW = 112, CH = Math.round(CW * h / w);
    var c = document.createElement("canvas"); c.width = CW; c.height = CH;
    var x = c.getContext("2d");
    var img = x.createImageData(CW, CH), d = img.data;
    var f1 = lattice(rnd, 5, 7), f2 = lattice(rnd, 11, 16), f3 = lattice(rnd, 23, 33);
    var i, px, py, u, v, n;
    for (py = 0; py < CH; py++) {
      v = py / CH;
      for (px = 0; px < CW; px++) {
        u = px / CW;
        n = sample(f1, u, v) * 0.34 + sample(f2, u, v) * 0.38 + sample(f3, u, v) * 0.28;
        n = (n - 0.5) * 2;                       /* -1..1 */
        i = (py * CW + px) * 4;
        if (n < 0) {                             /* thin  → light, cooler */
          d[i] = 255; d[i + 1] = 253; d[i + 2] = 245;
          d[i + 3] = Math.round(clamp(-n, 0, 1) * strength * 255 * 0.95);
        } else {                                 /* thick → warm, denser  */
          d[i] = 176; d[i + 1] = 156; d[i + 2] = 120;
          d[i + 3] = Math.round(clamp(n, 0, 1) * strength * 255);
        }
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  /* ── THE RAG TILE ─────────────────────────────────────────────────────
     A seamless square of pulp: a few thousand short curved fibres, most only
     a shade off the stock, a handful paler and a rare unbleached shive.
     Orientation is near-isotropic — that is the tell of a hand-shaken
     mould-made sheet against a machine-made one, where every fibre lies with
     the grain.

     Built ONCE from a FIXED seed and cached. Two reasons, both load-bearing:
     it is ~13ms of work that all 12 live sheets can share, and drawing it
     from a per-sheet stream would make sheet N depend on whether sheet N-1
     rendered first — which self-test (f) exists to catch.                  */
  var TILE = 336, _rag = null;

  function ragTile() {
    if (_rag) return _rag;
    var c = document.createElement("canvas");
    c.width = c.height = TILE;
    var x = c.getContext("2d");
    var r = mulberry32(0x1EAF7A);
    x.lineCap = "round";

    var i, n = 2600;
    for (i = 0; i < n; i++) {
      var px = r() * TILE, py = r() * TILE;
      var len = 3.2 + r() * r() * 16;              /* most short, a few long */
      var ang = r() * TAU;
      var bow = (r() - 0.5) * len * 0.42;          /* fibres are not straight */
      var lw = 0.45 + r() * r() * 1.25;

      var tone = r();
      if (tone < 0.52) {
        x.strokeStyle = "rgba(126,107,76," + (0.022 + r() * 0.058).toFixed(4) + ")";
      } else if (tone < 0.94) {
        x.strokeStyle = "rgba(255,251,240," + (0.028 + r() * 0.078).toFixed(4) + ")";
      } else {
        /* the occasional unbleached shive — rare, and never black */
        x.strokeStyle = "rgba(104,84,56," + (0.055 + r() * 0.085).toFixed(4) + ")";
        lw = 0.5 + r() * 0.8;
      }
      x.lineWidth = lw;

      /* draw it, and repeat it across the seam so the tile wraps */
      var ex = Math.cos(ang) * len, ey = Math.sin(ang) * len;
      var nx = -Math.sin(ang) * bow, ny = Math.cos(ang) * bow;
      for (var ox = -1; ox <= 1; ox++) {
        for (var oy = -1; oy <= 1; oy++) {
          var gx = px + ox * TILE, gy = py + oy * TILE;
          if (gx < -24 || gx > TILE + 24 || gy < -24 || gy > TILE + 24) continue;
          x.beginPath();
          x.moveTo(gx, gy);
          x.quadraticCurveTo(gx + ex * 0.5 + nx, gy + ey * 0.5 + ny, gx + ex, gy + ey);
          x.stroke();
        }
      }
    }
    _rag = c;
    return c;
  }

  /* ═════════════════════════════════════════════════════════════════════ */
  window.CentoArt = window.CentoArt || {};
  window.CentoArt.paper = {

    /* ── THE STOCK ─────────────────────────────────────────────────────── */
    stock: function (ctx, o) {
      var w = o.w, h = o.h, rnd = o.rnd, age = clamp(o.age === undefined ? 0 : o.age, 0, 1);
      var i;

      ctx.save();

      /* 1 · the body of the sheet — cream rag, warming down the diagonal.
             Each sheet gets its own small bias in warmth and lightness: no
             two batches of rag came out of the vat quite the same, and a
             drying line of identically-toned sheets reads as wallpaper.    */
      var bw = (rnd() - 0.5) * 2, bl = (rnd() - 0.5) * 2;   /* -1..1 each */
      function stop(r, g, b) {
        return "rgb(" + Math.round(clamp(r + 4.2 * bw + 5.0 * bl, 0, 255)) + ","
          + Math.round(clamp(g + 1.0 * bw + 5.0 * bl, 0, 255)) + ","
          + Math.round(clamp(b - 5.4 * bw + 5.0 * bl, 0, 255)) + ")";
      }
      var g = ctx.createLinearGradient(0, 0, w * 0.62, h);
      g.addColorStop(0, stop(244, 236, 219));
      g.addColorStop(0.55, stop(234, 223, 199));
      g.addColorStop(1, stop(223, 210, 182));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      /* a sheet that has sat a while goes a shade deeper, never yellower.
         This wash goes UNDER the formation, so age never flattens the
         held-to-the-light depth.                                          */
      if (age > 0) {
        ctx.globalAlpha = 0.095 * age;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "#cbb794";
        ctx.fillRect(0, 0, w, h);
        /* handling darkens the margins first — where fingers and light get in */
        var eg0 = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.30, w * 0.5, h * 0.5, h * 0.72);
        eg0.addColorStop(0, "rgba(170,146,105,0)");
        eg0.addColorStop(1, "rgba(170,146,105," + (0.30 * age) + ")");
        ctx.globalAlpha = 1;
        ctx.fillStyle = eg0;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      /* 2 · formation — the cloudiness you see holding it to the lamp */
      var cloud = formationLayer(w, h, rnd, 0.115 + 0.045 * age);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(cloud, 0, 0, w, h);
      ctx.globalAlpha = 1;

      /* 3 · the mould's wires, printed as THIN SPOTS in the pulp.
             Laid lines: fine, close, across the sheet. Chain lines: far
             apart, the other way, each with its faint shadow of thicker
             pulp banked against it.

             Both live BELOW the edge of visible, and the laid PITCH itself
             wanders — a constant pitch near the rack size's Nyquist beats
             into a legible grating, which is the one way this can read as
             ruled notebook paper instead of paper.                        */
      var laidPhase = rnd() * 6, laidGap = 6.1 + rnd() * 0.5;
      var wobble = walk1(rnd, 24), pitch = walk1(rnd, 9);
      ctx.lineWidth = 1;
      for (var y = laidPhase; y < h; ) {
        var u = y / h;
        var yy = y + (wobble(u) - 0.5) * 2.2;
        ctx.strokeStyle = "rgba(255,252,243," + (0.021 + wobble(u + 0.31) * 0.020) + ")";
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        ctx.strokeStyle = "rgba(150,133,103,0.010)";
        ctx.beginPath(); ctx.moveTo(0, yy + 1.35); ctx.lineTo(w, yy + 1.35); ctx.stroke();
        y += laidGap * (0.86 + pitch(u) * 0.30);
      }
      var chainGap = 27 + rnd() * 4, chainPhase = 8 + rnd() * 18;
      for (var cx0 = chainPhase; cx0 < w; cx0 += chainGap) {
        var xx = cx0 + (wobble(cx0 / w + 0.7) - 0.5) * 3.4;
        var cg = ctx.createLinearGradient(xx - 9, 0, xx + 9, 0);
        cg.addColorStop(0.00, "rgba(150,132,101,0)");
        cg.addColorStop(0.32, "rgba(150,132,101,0.008)");
        cg.addColorStop(0.50, "rgba(255,252,244,0.024)");
        cg.addColorStop(0.68, "rgba(150,132,101,0.008)");
        cg.addColorStop(1.00, "rgba(150,132,101,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(xx - 9, 0, 18, h);
      }

      /* 4 · THE PULP ITSELF — the shared rag, laid three ways so that no
             tile edge and no repeat can be found: once at size, once
             mirrored and enlarged (the long fibres), once flipped and
             shrunk (the tooth, the fines between them).                   */
      var tile = ragTile();
      var pat = ctx.createPattern(tile, "repeat");
      if (pat) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.translate(-rnd() * TILE, -rnd() * TILE);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w + TILE * 2, h + TILE * 2);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.70;
        ctx.translate(w, 0); ctx.scale(-1, 1);
        var k1 = 1.44 + rnd() * 0.16;
        ctx.scale(k1, k1);
        ctx.translate(-rnd() * TILE, -rnd() * TILE);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w / k1 + TILE * 2, h / k1 + TILE * 2);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.46;
        ctx.translate(0, h); ctx.scale(1, -1);
        var k2 = 0.60 + rnd() * 0.07;
        ctx.scale(k2, k2);
        ctx.translate(-rnd() * TILE, -rnd() * TILE);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w / k2 + TILE * 2, h / k2 + TILE * 2);
        ctx.restore();

        ctx.globalAlpha = 1;
      }

      /* 5 · age, sparingly — a tide line, a little foxing, a hair.        */
      if (age > 0.02) {
        /* a damp corner that dried: the front is SOFT — a breath of warmth
           fading out, not a line. Blurred hard so it can never read as a
           fold or a seam.                                                  */
        if (age > 0.30) {
          var tw = walk1(rnd, 7), stepsT = 40, k;
          var corner = Math.floor(rnd() * 4);
          var reach = 0.30 + rnd() * 0.22;               /* how far it crept */
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          if (ctx.filter !== undefined) ctx.filter = "blur(16px)";
          ctx.beginPath();
          var ax = (corner === 1 || corner === 2) ? w : 0;
          var ay = (corner >= 2) ? h : 0;
          ctx.moveTo(ax, ay);
          for (k = 0; k <= stepsT; k++) {
            var a2 = (k / stepsT) * Math.PI / 2;
            var rr2 = (0.55 + tw(k / stepsT) * 0.9) * reach;
            var px2 = ax + (ax === 0 ? 1 : -1) * Math.cos(a2) * rr2 * w * 1.5;
            var py2 = ay + (ay === 0 ? 1 : -1) * Math.sin(a2) * rr2 * h * 1.5;
            ctx.lineTo(px2, py2);
          }
          ctx.closePath();
          ctx.fillStyle = "rgba(178,153,112," + (0.020 + 0.030 * age) + ")";
          ctx.fill();
          ctx.restore();
        }

        /* foxing: small warm blooms, more of them as the sheet ages */
        var nFox = Math.round(age * 5 + rnd() * 1.6);
        for (var f = 0; f < nFox; f++) {
          var fx2 = rnd() * w, fy2 = rnd() * h, fr = 7 + rnd() * rnd() * 46;
          var rg = ctx.createRadialGradient(fx2, fy2, 0, fx2, fy2, fr);
          var fa = (0.020 + rnd() * 0.032) * (0.30 + age);
          rg.addColorStop(0, "rgba(163,124,72," + fa + ")");
          rg.addColorStop(0.45, "rgba(163,124,72," + fa * 0.5 + ")");
          rg.addColorStop(1, "rgba(163,124,72,0)");
          ctx.fillStyle = rg;
          ctx.fillRect(fx2 - fr, fy2 - fr, fr * 2, fr * 2);
          /* the darker speck at a bloom's heart */
          if (rnd() < 0.5) {
            ctx.fillStyle = "rgba(126,92,52," + (0.10 + 0.18 * age) + ")";
            ctx.beginPath();
            ctx.arc(fx2 + (rnd() - 0.5) * 4, fy2 + (rnd() - 0.5) * 4, 0.5 + rnd() * 1.1, 0, TAU);
            ctx.fill();
          }
        }

        /* a hair, or a long dark fibre that got into the vat */
        if (age > 0.45 && rnd() < 0.85) {
          var hx = rnd() * w, hy = rnd() * h, ha = rnd() * TAU, hl = 16 + rnd() * 54;
          ctx.strokeStyle = "rgba(96,74,48," + (0.16 + 0.16 * age) + ")";
          ctx.lineWidth = 0.55; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(hx, hy);
          for (var q = 1; q <= 5; q++) {
            ha += (rnd() - 0.5) * 0.8;
            hx += Math.cos(ha) * hl / 5; hy += Math.sin(ha) * hl / 5;
            ctx.lineTo(hx, hy);
          }
          ctx.stroke();
        }
      }

      /* 6 · the sheet is not flat: the light falls off a touch at the
             margins, which is what makes it read as an object.            */
      var vg = ctx.createRadialGradient(w * 0.42, h * 0.34, h * 0.20, w * 0.5, h * 0.5, h * 0.78);
      vg.addColorStop(0, "rgba(120,102,74,0)");
      vg.addColorStop(1, "rgba(120,102,74,0.050)");
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      /* 7 · THE THINNING — the pulp shallows out toward every deckle long
             before it ends, so the last centimetre of stock is paler and
             has less substance. This is not decoration and it is not
             optional: the deckle pass leaves those pixels at half opacity
             against a dark wall, and only a PALE pixel reads there as paper
             thinning. A body-cream pixel at half alpha reads as char — that
             is exactly how a feather turns into a scorch mark.

             A tight bright ramp at the very edge, a broad faint one behind
             it. The bottom edge is carried a little paler still, because it
             is the one that hangs over the cell's own drop shadow.        */
      var RIMS = [[9, 0.30], [34, 0.058]];
      var BOTTOM_BIAS = 1.38;
      ctx.save();
      for (i = 0; i < RIMS.length; i++) {
        var rw = RIMS[i][0], ra = RIMS[i][1], eg;
        var c0 = "rgba(255,253,247," + ra + ")", c1 = "rgba(255,253,247,0)";
        var cb = "rgba(255,253,247," + (ra * BOTTOM_BIAS) + ")";
        eg = ctx.createLinearGradient(0, 0, 0, rw);
        eg.addColorStop(0, c0); eg.addColorStop(1, c1);
        ctx.fillStyle = eg; ctx.fillRect(0, 0, w, rw);
        eg = ctx.createLinearGradient(0, h, 0, h - rw);
        eg.addColorStop(0, cb); eg.addColorStop(1, c1);
        ctx.fillStyle = eg; ctx.fillRect(0, h - rw, w, rw);
        eg = ctx.createLinearGradient(0, 0, rw, 0);
        eg.addColorStop(0, c0); eg.addColorStop(1, c1);
        ctx.fillStyle = eg; ctx.fillRect(0, 0, rw, h);
        eg = ctx.createLinearGradient(w, 0, w - rw, 0);
        eg.addColorStop(0, c0); eg.addColorStop(1, c1);
        ctx.fillStyle = eg; ctx.fillRect(w - rw, 0, rw, h);
      }
      ctx.restore();

      ctx.restore();
    },

    /* ── THE DECKLE ────────────────────────────────────────────────────
       The pulp runs out. One continuous boundary per edge, wandering over
       tens of pixels; stacked translucent passes make the fibres thin away
       instead of chipping off; a tufted scatter of single fibres survives
       out past the boundary, half-transparent.

       The whole thing is composed on an offscreen MASK and taken out of the
       sheet in ONE destination-out drawImage. That is what makes survivors
       possible at all — on the mask, a stroke that REMOVES removal leaves a
       fibre standing outside the sheet's mean edge. Stacking k passes of
       alpha A onto the mask and taking the result out once is exactly
       equivalent to k destination-out passes: survival is (1-A)^k either
       way. Only ever REMOVES from ctx.                                    */
    deckle: function (ctx, o) {
      var w = o.w, h = o.h, rnd = o.rnd;
      var N = 256;                       /* samples along an edge          */
      var PASSES = 17;                   /* stacked translucency layers    */
      var A = 0.175;                     /* per-pass bite                  */

      /* Depth profile for one edge: a couple of near-straight stretches,
         one place where it truly wanders, plus a rare narrow peninsula of
         pulp that reaches out to the very edge. Every shaping term is
         smoothstepped — a linear tent here quantises into a visible step,
         which is the one thing that reads as damage rather than deckle.
         The ends taper, so the two edges meeting at a corner do not each
         take a full bite out of it.                                       */
      function profile(len) {
        var n1 = walk1(rnd, 5), n2 = walk1(rnd, 13), n3 = walk1(rnd, 31);
        var env = walk1(rnd, 4);
        var wanderAt = rnd(), wanderW = 0.13 + rnd() * 0.12;
        var pen = [], np = 1 + (rnd() < 0.6 ? 1 : 0), p;
        for (p = 0; p < np; p++) pen.push([rnd(), 0.010 + rnd() * 0.016]);
        var base = 3.4 + rnd() * 2.2, phase = rnd();
        var CT = 18 / len;                              /* corner taper span */
        return function (t) {
          var u = t + phase;
          var e = 0.30 + env(u * 0.9) * 1.05;                 /* quiet ↔ lively */
          var dw = Math.abs(((t - wanderAt) + 1.5) % 1 - 0.5);
          if (dw < wanderW) e += 1.5 * sm(1 - dw / wanderW);   /* the wanderer   */
          var n = n1(u) * 0.55 + n2(u * 1.0) * 0.30 + n3(u) * 0.15;
          var d = base * (0.42 + e * 0.72) * (0.42 + n * 1.25);
          for (var i = 0; i < pen.length; i++) {
            var dp = Math.abs(((t - pen[i][0]) + 1.5) % 1 - 0.5);
            if (dp < pen[i][1]) d *= 0.12 + 0.88 * sm(dp / pen[i][1]); /* pulp reaches out */
          }
          /* the corner belongs to both edges — let each ask for about half */
          var ct = sm(clamp(t / CT, 0, 1)) * sm(clamp((1 - t) / CT, 0, 1));
          return d * (0.52 + 0.48 * ct);
        };
      }

      /* (t along the edge, d inward from it) → sheet space */
      function pt(edge, t, d) {
        if (edge === 0) return [t * w, d];                 /* top    */
        if (edge === 1) return [w - d, t * h];             /* right  */
        if (edge === 2) return [(1 - t) * w, h - d];       /* bottom */
        return [d, (1 - t) * h];                           /* left   */
      }

      var m = document.createElement("canvas");
      m.width = w; m.height = h;
      var x = m.getContext("2d");
      x.fillStyle = "#fff";

      /* Fill the strip between an edge and its boundary curve, at a given
         fraction of full depth, with a little per-pass drift so the layers
         are not concentric — that drift is what reads as fibre.           */
      function eat(edge, prof, frac, jit) {
        var i, t, d, q;
        x.beginPath();
        for (i = 0; i <= N; i++) {
          t = i / N;
          d = prof(t) * frac + (jit ? (jit(t + frac) - 0.5) * 1.7 * frac : 0);
          if (d < 0) d = 0;
          q = pt(edge, t, d);
          if (i === 0) x.moveTo(q[0], q[1]); else x.lineTo(q[0], q[1]);
        }
        /* close out through the corners, well outside the canvas */
        if (edge === 0) { x.lineTo(w + 40, -40); x.lineTo(-40, -40); }
        else if (edge === 1) { x.lineTo(w + 40, h + 40); x.lineTo(w + 40, -40); }
        else if (edge === 2) { x.lineTo(-40, h + 40); x.lineTo(w + 40, h + 40); }
        else { x.lineTo(-40, -40); x.lineTo(-40, h + 40); }
        x.closePath();
        x.fill();
      }

      var edges = [], e;
      for (e = 0; e < 4; e++) {
        edges.push({ prof: profile(e % 2 === 0 ? w : h), jit: walk1(rnd, 64) });
      }

      /* the ramp: the outermost band is covered by every pass, the
         innermost by one — so the sheet thins away instead of stopping. */
      for (var k = PASSES; k >= 1; k--) {
        x.globalAlpha = A;
        for (e = 0; e < 4; e++) eat(e, edges[e].prof, k / PASSES, edges[e].jit);
      }

      /* the last hair of stock at the extreme edge goes entirely */
      x.globalAlpha = 1;
      for (e = 0; e < 4; e++) eat(e, edges[e].prof, 0.17, null);

      /* fibre grain along the boundary: a scatter of soft dabs that breaks
         the ramp into individual fibres running out                        */
      var n = 460, i2, ed, t2, dd, r, q2;
      for (i2 = 0; i2 < n; i2++) {
        ed = i2 & 3;
        t2 = rnd();
        dd = edges[ed].prof(t2) * (0.18 + rnd() * 1.05);
        r = 0.5 + rnd() * rnd() * 2.6;
        q2 = pt(ed, t2, dd);
        var dg = x.createRadialGradient(q2[0], q2[1], 0, q2[0], q2[1], r);
        var da = 0.10 + rnd() * 0.34;
        dg.addColorStop(0, "rgba(255,255,255," + da + ")");
        dg.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = dg;
        x.fillRect(q2[0] - r, q2[1] - r, r * 2, r * 2);
      }

      /* THE SURVIVORS — single fibres reaching out past where the sheet
         ends. On the mask they REMOVE removal, so they stand as pale
         half-transparent threads. Fibres leave a real deckle in TUFTS, not
         on a comb: most cluster around a handful of places where the pulp
         was thin, a few stray, and the reach is heavily biased short —
         many stubs, very few long ones.                                    */
      x.globalCompositeOperation = "destination-out";
      x.strokeStyle = "#fff";
      x.lineCap = "round";
      x.fillStyle = "#fff";
      for (e = 0; e < 4; e++) {
        var prof = edges[e].prof;
        var tufts = [], nt = 5 + Math.floor(rnd() * 4), j;
        for (j = 0; j < nt; j++) tufts.push([rnd(), 0.012 + rnd() * 0.045]);
        var count = 26 + Math.floor(rnd() * 16);
        for (j = 0; j < count; j++) {
          var t3;
          if (rnd() < 0.78) {
            var tf = tufts[Math.floor(rnd() * tufts.length)];
            t3 = tf[0] + (rnd() + rnd() - 1) * tf[1];
            if (t3 < 0) t3 = -t3;
            if (t3 > 1) t3 = 2 - t3;
          } else {
            t3 = rnd();
          }
          var b = prof(t3);
          var reach = 0.8 + Math.pow(rnd(), 2.6) * 5.2;   /* many short, few long */
          var lat = (rnd() - 0.5) * 3.6 / (e % 2 === 0 ? w : h);
          var inn = pt(e, t3, b + 1.6 + rnd() * 2.4);
          var out = pt(e, t3 + lat, b - reach);
          var mid = pt(e, t3 + lat * 0.5 + (rnd() - 0.5) * 2.4 / (e % 2 === 0 ? w : h),
            b + (reach * -0.15));
          x.globalAlpha = 0.13 + Math.pow(rnd(), 1.5) * 0.42;
          x.lineWidth = 0.40 + rnd() * 0.85;
          x.beginPath();
          x.moveTo(inn[0], inn[1]);
          x.quadraticCurveTo(mid[0], mid[1], out[0], out[1]);
          x.stroke();
        }
      }
      x.globalAlpha = 1;
      x.globalCompositeOperation = "source-over";

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.drawImage(m, 0, 0);
      ctx.restore();
    }
  };

})();
