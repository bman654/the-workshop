/* ═══════════════════════════════════════════════════════════════════════════
   FISH ↔ BOWL — a forged thaumatrope pair (FINAL, synthesized)

   Base = Take 1 (the round bowl, its registration, and its crossfade-clean
   fusion — the fish lands centred INSIDE the water). Grafted in = Take 2's
   fish craft: a plumper fantail body, tapering swelling-line ribbon fin rays,
   overlapping crescent scales clipped to the body, a gill plate, curved belly
   hatch-shading, a catchlit sanguine-ringed eye, and a sparing sanguine gold
   wash so the fish reads GOLD without breaking the ink idiom. The fish is kept
   compact/central (scaled + seated at the bowl's mid-water) so it stays crisp
   through the spin and fully inside the glass; both faces are inked a notch
   bolder so neither washes out in the 50/50 whirl. Ink #2b2a24 over parchment.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  var FS = 360;
  var PAPER = '#f3ecd6', INK = '#2b2a24', SANG = '#8a4a2a';

  /* ── parchment ground: warm fill + soft vignette + a leaf edge ── */
  function paper(ctx) {
    ctx.clearRect(0, 0, FS, FS);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, FS, FS);
    var g = ctx.createRadialGradient(FS * 0.5, FS * 0.44, FS * 0.12, FS * 0.5, FS * 0.52, FS * 0.74);
    g.addColorStop(0, 'rgba(255,250,235,.5)');
    g.addColorStop(1, 'rgba(120,96,52,.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FS, FS);
    ctx.strokeStyle = 'rgba(120,96,52,.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, FS - 9, FS - 9);
  }

  function pen(ctx, w, col) {
    ctx.strokeStyle = col || INK; ctx.lineWidth = w;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = col || INK;
  }

  /* A short tapering hatch stroke — the copperplate weight-line. */
  function hatch(ctx, x0, y0, x1, y1, w) {
    ctx.lineWidth = w; ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }

  /* deterministic PRNG so stipple/pebble jitter never changes per mount */
  function rng(s) {
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function qpt(p0, pc, p1) {                   // quadratic sampler t∈[0,1] → [x,y]
    return function (t) {
      var u = 1 - t;
      return [u * u * p0[0] + 2 * u * t * pc[0] + t * t * p1[0],
              u * u * p0[1] + 2 * u * t * pc[1] + t * t * p1[1]];
    };
  }
  /* a filled tapering ribbon along a sampled path — the engraver's swelling line */
  function ribbon(ctx, sample, w0, w1, steps) {
    var L = [], R = [], i, t, p, q, dx, dy, len, nx, ny, w;
    for (i = 0; i <= steps; i++) {
      t = i / steps; p = sample(t);
      if (i < steps) { q = sample(Math.min(1, t + 1e-3)); dx = q[0] - p[0]; dy = q[1] - p[1]; }
      else { q = sample(t - 1e-3); dx = p[0] - q[0]; dy = p[1] - q[1]; }
      len = Math.hypot(dx, dy) || 1; nx = -dy / len; ny = dx / len;
      w = (w0 + (w1 - w0) * t) / 2;
      L.push([p[0] + nx * w, p[1] + ny * w]);
      R.push([p[0] - nx * w, p[1] - ny * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath(); ctx.fill();
  }

  /* ════════════════════════════ FRONT :: the goldfish ══════════════════════
     Take 2's fish, inked bolder and seated compact/central at the bowl's
     mid-water. The whole fish is scaled about its own centre and nudged down so
     it lands inside Take 1's glass on all sides and rides just under the
     waterline. Facing left. */
  function drawFish(ctx) {
    paper(ctx);
    var cx = 180, cy = 186;

    /* seat the fish compact + central: scale about (cx,cy), then drop into mid-water */
    ctx.save();
    ctx.translate(0, 14);
    ctx.translate(cx, cy); ctx.scale(0.84, 0.84); ctx.translate(-cx, -cy);

    /* body outline (facing left, plump belly, narrowing to the caudal peduncle) */
    var body = new Path2D();
    body.moveTo(cx - 66, cy - 3);                                   // nose
    body.bezierCurveTo(cx - 56, cy - 30, cx - 30, cy - 44, cx - 2, cy - 43);
    body.bezierCurveTo(cx + 24, cy - 42, cx + 40, cy - 30, cx + 50, cy - 9);
    body.bezierCurveTo(cx + 53, cy - 3, cx + 53, cy + 3, cx + 50, cy + 9);   // peduncle
    body.bezierCurveTo(cx + 40, cy + 29, cx + 22, cy + 43, cx - 8, cy + 45);
    body.bezierCurveTo(cx - 36, cy + 47, cx - 58, cy + 22, cx - 66, cy - 3);
    body.closePath();

    /* sanguine gold wash under the ink — sparing but a touch stronger so it reads gold */
    ctx.save();
    ctx.globalAlpha = 0.22; ctx.fillStyle = SANG; ctx.fill(body);
    ctx.globalAlpha = 1;
    ctx.restore();

    /* ── fantail: two flowing lobes with tapering rays, behind the body ── */
    var ped = [cx + 50, cy];
    pen(ctx, 1.4, INK);
    // membrane outline of the tail (drawn in a touch so it stays inside the glass)
    ctx.beginPath();
    ctx.moveTo(cx + 48, cy - 8);
    ctx.bezierCurveTo(cx + 88, cy - 54, cx + 112, cy - 46, cx + 106, cy - 37);
    ctx.bezierCurveTo(cx + 95, cy - 24, cx + 92, cy - 7, cx + 88, cy + 2);   // upper→notch
    ctx.bezierCurveTo(cx + 94, cy + 17, cx + 107, cy + 32, cx + 101, cy + 47);
    ctx.bezierCurveTo(cx + 91, cy + 58, cx + 71, cy + 38, cx + 48, cy + 8);  // lower→peduncle
    ctx.closePath();
    ctx.globalAlpha = 0.13; ctx.fillStyle = SANG; ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    // tail fin rays (tapering ribbons splaying from the peduncle)
    var rays = [
      [[cx + 102, cy - 42], 5.4], [[cx + 96, cy - 21], 4.8], [[cx + 88, cy - 4], 4.4],
      [[cx + 94, cy + 15], 4.8], [[cx + 99, cy + 42], 5.4]
    ];
    rays.forEach(function (r) {
      var mid = [(ped[0] + r[0][0]) / 2 + 4, (ped[1] + r[0][1]) / 2];
      ribbon(ctx, qpt(ped, mid, r[0]), r[1], 0.5, 14);
    });

    /* ── dorsal fin (a low sail with rays; trimmed so it rides at the waterline,
          not spiking above it) ── */
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 41);
    ctx.bezierCurveTo(cx - 2, cy - 52, cx + 10, cy - 55, cx + 20, cy - 51);
    ctx.bezierCurveTo(cx + 28, cy - 48, cx + 33, cy - 42, cx + 34, cy - 34);
    ctx.globalAlpha = 0.13; ctx.fillStyle = SANG; ctx.fill(); ctx.globalAlpha = 1;
    pen(ctx, 2.6, INK); ctx.stroke();
    pen(ctx, 1.4, INK);
    for (var d = 0; d < 4; d++) {
      var fx = cx - 2 + d * 9;
      ctx.beginPath(); ctx.moveTo(fx, cy - 39 - d * 1.2);
      ctx.lineTo(cx + 1 + d * 7, cy - 49 + d * 3.5); ctx.stroke();
    }

    /* ── pelvic / anal fin (small, lower belly) ── */
    ribbon(ctx, qpt([cx + 6, cy + 42], [cx + 18, cy + 60], [cx + 30, cy + 66]), 6.5, 0.6, 12);
    ribbon(ctx, qpt([cx - 6, cy + 44], [cx + 2, cy + 62], [cx + 10, cy + 66]), 5.4, 0.6, 12);

    /* ── body outline stroke — bold so the fish holds presence at fusion ── */
    pen(ctx, 4.6, INK); ctx.stroke(body);

    /* ── scales: overlapping crescents, clipped to the body ── */
    ctx.save(); ctx.clip(body);
    pen(ctx, 1.3, 'rgba(43,42,36,.62)');
    for (var col = 0; col < 7; col++) {
      var sx = cx - 26 + col * 12;
      var off = (col % 2) * 6;
      for (var row = -4; row <= 4; row++) {
        var syc = cy + off + row * 12;
        ctx.beginPath();
        ctx.arc(sx, syc, 7, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
    }
    /* belly shading — curved hatch on the underside for volume */
    pen(ctx, 1.2, 'rgba(43,42,36,.48)');
    for (var h = 0; h < 6; h++) {
      var hx = cx - 30 + h * 12;
      ctx.beginPath();
      ctx.moveTo(hx, cy + 20);
      ctx.quadraticCurveTo(hx + 4, cy + 34, hx + 2, cy + 44);
      ctx.stroke();
    }
    ctx.restore();

    /* ── gill plate line ── */
    pen(ctx, 2.6, INK);
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy - 26);
    ctx.quadraticCurveTo(cx - 46, cy, cx - 30, cy + 24);
    ctx.stroke();

    /* ── pectoral fin, fanned down-back from behind the gill ── */
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 6);
    ctx.bezierCurveTo(cx - 20, cy + 26, cx - 6, cy + 34, cx + 6, cy + 30);
    ctx.bezierCurveTo(cx - 6, cy + 24, cx - 16, cy + 16, cx - 26, cy + 6);
    ctx.globalAlpha = 0.13; ctx.fillStyle = SANG; ctx.fill(); ctx.globalAlpha = 1;
    pen(ctx, 1.8, INK); ctx.stroke();
    for (var pf = 0; pf < 3; pf++) {
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 9);
      ctx.lineTo(cx - 14 + pf * 8, cy + 28 - pf * 2); ctx.stroke();
    }

    /* ── mouth ── */
    pen(ctx, 2.4, SANG);
    ctx.beginPath();
    ctx.moveTo(cx - 66, cy - 2);
    ctx.quadraticCurveTo(cx - 73, cy + 1, cx - 63, cy + 5);
    ctx.stroke();

    /* ── eye: sanguine iris ring, ink pupil + paper glint ── */
    var ex = cx - 46, ey = cy - 7;
    pen(ctx, 2.4, SANG);
    ctx.beginPath(); ctx.arc(ex, ey, 8.4, 0, 7); ctx.stroke();
    pen(ctx, 2.4, INK);
    ctx.beginPath(); ctx.arc(ex, ey, 8, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 5.4, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 1.8, ey - 1.8, 1.8, 0, 7); ctx.fillStyle = PAPER; ctx.fill();

    ctx.restore();
  }

  /* ═══════════════════════════ BACK :: the round bowl (near-symmetric) ═════════════
     Take 1's winning bowl, inked a notch bolder and with the front waterline
     raised so it rides the fish's back instead of clipping across it. */
  function drawBowl(ctx) {
    paper(ctx);
    var cx = 180;
    var bellyY = 206, rBelly = 112;   // sphere belly
    var rimY = 116, rimHalf = 68;     // rim opening half-width
    var waterY = 143, waterHalf = 98; // waterline height + half-width there (raised)

    // --- water body: a faint cool wash inside the glass so the fish reads "in water" ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - rimHalf + 4, rimY);
    ctx.bezierCurveTo(cx - rBelly, rimY + 40, cx - rBelly, bellyY + 70, cx, bellyY + 108);
    ctx.bezierCurveTo(cx + rBelly, bellyY + 70, cx + rBelly, rimY + 40, cx + rimHalf - 4, rimY);
    ctx.closePath();
    ctx.clip();
    var wg = ctx.createLinearGradient(0, waterY, 0, bellyY + 100);
    wg.addColorStop(0, 'rgba(96,120,120,.15)');
    wg.addColorStop(1, 'rgba(60,86,92,.18)');
    ctx.fillStyle = wg;
    ctx.fillRect(cx - rBelly, waterY, rBelly * 2, 220);
    ctx.restore();

    // --- the glass vessel outline ---
    pen(ctx, 6);
    ctx.beginPath();
    ctx.moveTo(cx - rimHalf, rimY);
    ctx.bezierCurveTo(cx - rBelly, rimY + 44, cx - rBelly, bellyY + 72, cx, bellyY + 110); // left belly to bottom
    ctx.bezierCurveTo(cx + rBelly, bellyY + 72, cx + rBelly, rimY + 44, cx + rimHalf, rimY); // bottom to right rim
    ctx.stroke();

    // --- the rim: a flared lip ellipse ---
    pen(ctx, 5);
    ctx.beginPath(); ctx.ellipse(cx, rimY, rimHalf, 15, 0, 0, 7); ctx.stroke();
    // a thin second lip line for glass thickness
    pen(ctx, 2.2);
    ctx.beginPath(); ctx.ellipse(cx, rimY + 5, rimHalf - 4, 12, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();

    // --- waterline: darker near edge (front), lighter far edge (back) ---
    pen(ctx, 3.4, 'rgba(43,42,36,.78)');
    ctx.beginPath(); ctx.ellipse(cx, waterY, waterHalf, 20, 0, 0.02, Math.PI - 0.02); ctx.stroke(); // front arc
    pen(ctx, 1.8, 'rgba(43,42,36,.42)');
    ctx.beginPath(); ctx.ellipse(cx, waterY, waterHalf, 20, 0, Math.PI, 2 * Math.PI); ctx.stroke(); // back arc
    // surface shimmer dashes
    pen(ctx, 1.6, 'rgba(43,42,36,.5)');
    hatch(ctx, cx - 40, waterY + 6, cx - 18, waterY + 6, 1.5);
    hatch(ctx, cx + 8, waterY + 9, cx + 34, waterY + 9, 1.5);

    // --- glass highlights (roundness) on the upper-left arc ---
    pen(ctx, 3.4, 'rgba(255,250,236,.7)');
    ctx.beginPath();
    ctx.moveTo(cx - 78, 176);
    ctx.quadraticCurveTo(cx - 96, 214, cx - 72, 256);
    ctx.stroke();
    pen(ctx, 1.8, 'rgba(255,250,236,.55)');
    ctx.beginPath();
    ctx.moveTo(cx - 62, 178);
    ctx.quadraticCurveTo(cx - 78, 210, cx - 60, 246);
    ctx.stroke();

    // --- bubbles rising (right side) ---
    pen(ctx, 2);
    [[cx + 52, 182, 5], [cx + 60, 164, 3.4], [cx + 55, 150, 2.4]].forEach(function (b) {
      ctx.beginPath(); ctx.arc(b[0], b[1], b[2], 0, 7); ctx.stroke();
    });

    // --- gravel bed at the base (rounded pebbles) ---
    pen(ctx, 2.4);
    var peb = [[cx - 46, 292, 13], [cx - 18, 300, 15], [cx + 14, 298, 14],
               [cx + 44, 294, 12], [cx - 32, 306, 10], [cx + 30, 306, 11]];
    peb.forEach(function (p) {
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], p[2], p[2] * 0.62, 0, Math.PI * 1.02, Math.PI * 2.02);
      ctx.stroke();
    });

    // --- water fronds rising from the gravel, kept OFF the vertical axis (so
    //     they read as background weeds, not a line through the fused fish) and
    //     short, ending well below the fish's water-seat ---
    pen(ctx, 2.8, 'rgba(58,72,52,.82)');
    ctx.beginPath();
    ctx.moveTo(cx - 58, 290);
    ctx.quadraticCurveTo(cx - 74, 262, cx - 62, 236);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 52, 292);
    ctx.quadraticCurveTo(cx - 40, 262, cx - 48, 240);
    ctx.stroke();
    pen(ctx, 1.9, 'rgba(58,72,52,.68)');
    ctx.beginPath();
    ctx.moveTo(cx - 62, 288);
    ctx.quadraticCurveTo(cx - 86, 260, cx - 80, 244);
    ctx.stroke();
  }

  /* ── register for BOTH the preview harness and the shipped build ── */
  root.installThaumArt = function (A) {
    A.setPair('fishbowl', drawFish, drawBowl);
    return 'fishbowl';
  };
  (root.ThaumArt = root.ThaumArt || {}).fishbowl = { a: drawFish, b: drawBowl };
})(typeof window !== 'undefined' ? window : globalThis);
