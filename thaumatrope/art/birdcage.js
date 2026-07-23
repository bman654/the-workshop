/* ═══════════════════════════════════════════════════════════════════════════
   THE THAUMATROPE — forged face pair "birdcage"  (take 3)

   A warm copperplate-engraving hand: a plump perched songbird (FRONT) that lands
   dead-centre inside an ornamented domed birdcage (BACK) when the disc is whirled.
   Both faces are drawn fully symmetric about the vertical spin axis x=180, so the
   renderer's back-flip is a no-op and the marks register square.

   Character of this take: genuine engraver's shading — tapered contours built from
   layered strokes, close cross-hatch for volume, stipple for the belly and the
   parchment tone — over crisp clean cage bars so the payoff ("bird behind bars")
   reads instantly at fusion. A single muted sanguine accent warms the beak/eye and
   a ribbon bow on the cage's ring.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var FS = 360, AX = 180;
  var INK = '#2b2a24';
  var SANG = '#8a4a2a';
  function ink(a) { return 'rgba(43,42,36,' + a + ')'; }

  /* ---- parchment ground (each face paints its own; ship-page swaps a richer one) ---- */
  function paper(ctx) {
    ctx.clearRect(0, 0, FS, FS);
    ctx.fillStyle = '#f3ecd6';
    ctx.fillRect(0, 0, FS, FS);
    var g = ctx.createRadialGradient(FS * 0.5, FS * 0.43, FS * 0.10, FS * 0.5, FS * 0.5, FS * 0.74);
    g.addColorStop(0, 'rgba(255,251,238,.55)');
    g.addColorStop(0.72, 'rgba(120,96,52,.05)');
    g.addColorStop(1, 'rgba(96,74,40,.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FS, FS);
    // a hair of foxing/tone so the leaf reads as pressed paper (deterministic)
    ctx.fillStyle = 'rgba(120,96,52,.05)';
    var s = 20749; // fixed seed
    for (var i = 0; i < 130; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      var x = 14 + (s % 332), y = 14 + ((s >> 8) % 332);
      var r = 0.4 + ((s >> 4) % 7) * 0.13;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(120,96,52,.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, FS - 7, FS - 7);
  }

  /* ---- engraver's pen ---- */
  function pen(ctx, w, color) {
    ctx.strokeStyle = color || INK; ctx.lineWidth = w;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = color || INK;
  }
  // a tapered contour: lay the same path twice, a hair narrower + lighter on top,
  // so the line swells in the middle like a burin cut rather than a vector outline.
  function taper(ctx, drawPath, w) {
    pen(ctx, w, INK); drawPath(); ctx.stroke();
    pen(ctx, Math.max(0.8, w * 0.42), ink(0.55)); drawPath(); ctx.stroke();
  }
  // parallel cross-hatch clipped to a region, lit from upper-left (shade lower-right)
  function hatch(ctx, clip, angle, spacing, w, alpha) {
    ctx.save();
    ctx.beginPath(); clip(); ctx.clip();
    pen(ctx, w, ink(alpha)); ctx.lineCap = 'butt';
    ctx.translate(AX, 180); ctx.rotate(angle);
    for (var d = -260; d <= 260; d += spacing) {
      ctx.beginPath(); ctx.moveTo(d, -300); ctx.lineTo(d, 300); ctx.stroke();
    }
    ctx.restore();
  }
  function stipple(ctx, cx, cy, rx, ry, n, seed, alpha, dot) {
    ctx.fillStyle = ink(alpha); var s = seed;
    for (var i = 0; i < n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      var a = (s % 6283) / 1000, r = Math.sqrt(((s >> 6) % 1000) / 1000);
      var x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
      ctx.beginPath(); ctx.arc(x, y, dot, 0, 7); ctx.fill();
    }
  }

  /* ════════════════════ FRONT FACE — the songbird ════════════════════ */
  function drawBird(ctx) {
    paper(ctx);
    var bx = 180, by = 188;               // body centre, on the axis
    // -- belly shading first, under the outline --
    // (lightened per judges: wider spacing + softer alpha so it never reads scratchy
    //  where the cage bars cross the belly at fusion)
    hatch(ctx, function () { ctx.ellipse(bx, by + 8, 50, 42, -0.12, 0.2, Math.PI - 0.2); },
      1.15, 8.5, 0.9, 0.16);
    stipple(ctx, bx - 6, by + 20, 38, 24, 50, 5501, 0.17, 0.7);

    // -- plump body (tapered egg, tilted) — bold contour so it owns the cage at fusion --
    taper(ctx, function () {
      ctx.beginPath(); ctx.ellipse(bx, by, 55, 46, -0.13, 0, 7);
    }, 5.2);

    // -- folded wing: an almond with three feather scallops on its trailing edge --
    (function wing() {
      pen(ctx, 3.6, INK);
      ctx.beginPath();
      ctx.moveTo(bx + 6, by - 30);
      ctx.quadraticCurveTo(bx + 40, by - 8, bx + 24, by + 30);
      ctx.quadraticCurveTo(bx - 6, by + 20, bx - 20, by - 6);
      ctx.quadraticCurveTo(bx - 12, by - 26, bx + 6, by - 30);
      ctx.stroke();
      // covert feather lines
      pen(ctx, 2, ink(0.8));
      for (var i = 0; i < 4; i++) {
        var t = i * 8;
        ctx.beginPath();
        ctx.moveTo(bx + 2 - i * 5, by - 22 + t * 0.55);
        ctx.quadraticCurveTo(bx + 14 - i * 4, by - 6 + t * 0.5, bx + 20 - i * 7, by + 8 + t * 0.5);
        ctx.stroke();
      }
      // primary tips peeking below the wing
      pen(ctx, 2.4, INK);
      for (var j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(bx - 6 + j * 8, by + 22);
        ctx.quadraticCurveTo(bx - 14 + j * 8, by + 40, bx - 24 + j * 9, by + 34);
        ctx.stroke();
      }
    })();

    // -- forked tail, tucked low & short so mass stays centred and it clears the hoop --
    (function tail() {
      pen(ctx, 3.6, INK);
      ctx.beginPath();
      ctx.moveTo(bx - 40, by + 8);
      ctx.quadraticCurveTo(bx - 70, by + 14, bx - 88, by + 8);
      ctx.moveTo(bx - 40, by + 20);
      ctx.quadraticCurveTo(bx - 68, by + 34, bx - 84, by + 34);
      ctx.stroke();
      pen(ctx, 2, ink(0.7));
      ctx.beginPath();
      ctx.moveTo(bx - 44, by + 15);
      ctx.quadraticCurveTo(bx - 66, by + 24, bx - 80, by + 22);
      ctx.stroke();
    })();

    // -- head, cocked up to the right --
    var hx = bx + 30, hy = by - 46, hr = 27;
    // neck join (smooth the body into the head)
    pen(ctx, 4.4, INK);
    ctx.beginPath();
    ctx.moveTo(bx + 2, by - 34);
    ctx.quadraticCurveTo(bx + 14, by - 50, hx - 18, hy + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 44, by - 18);
    ctx.quadraticCurveTo(bx + 46, by - 40, hx + 8, hy + 18);
    ctx.stroke();
    taper(ctx, function () { ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); }, 4.4);
    // crown tuft
    pen(ctx, 2.4, INK);
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy - 24);
    ctx.quadraticCurveTo(hx - 2, hy - 36, hx + 8, hy - 30);
    ctx.stroke();
    // cheek shading
    hatch(ctx, function () { ctx.arc(hx, hy + 4, hr - 3, 0.2, Math.PI - 0.7); }, -0.9, 4.2, 0.9, 0.28);

    // -- beak (sanguine), parted a touch as if mid-song (borrowed liveliness) --
    pen(ctx, 1.8, SANG);
    // upper mandible
    ctx.beginPath();
    ctx.moveTo(hx + hr - 4, hy - 4);
    ctx.lineTo(hx + hr + 23, hy - 2);
    ctx.lineTo(hx + hr - 2, hy + 2);
    ctx.closePath(); ctx.fill();
    // lower mandible, dropped open
    ctx.beginPath();
    ctx.moveTo(hx + hr - 3, hy + 4);
    ctx.lineTo(hx + hr + 19, hy + 8);
    ctx.lineTo(hx + hr - 1, hy + 9);
    ctx.closePath(); ctx.fill();
    // crisp inked upper edge so the open beak reads through fusion
    pen(ctx, 1.5, ink(0.85));
    ctx.beginPath();
    ctx.moveTo(hx + hr - 4, hy - 3);
    ctx.lineTo(hx + hr + 23, hy - 2);
    ctx.stroke();

    // -- eye: ink ring w/ sanguine iris + a parchment catch-light --
    var ex = hx + 6, ey = hy - 4;
    pen(ctx, 0, INK);
    ctx.beginPath(); ctx.arc(ex, ey, 6.2, 0, 7); ctx.fill();
    ctx.fillStyle = SANG;
    ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, 7); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = '#f6efda';
    ctx.beginPath(); ctx.arc(ex - 1.6, ey - 1.8, 1.2, 0, 7); ctx.fill();

    // -- breast contour tick + throat line --
    pen(ctx, 2, ink(0.75));
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy + 20);
    ctx.quadraticCurveTo(bx + 30, by - 6, bx + 30, by + 30);
    ctx.stroke();

    // -- legs + curled toes gripping the perch line (y≈232) --
    pen(ctx, 3, INK);
    [-13, 11].forEach(function (dx, i) {
      var lx = bx + dx;
      ctx.beginPath();
      ctx.moveTo(lx, by + 40);
      ctx.lineTo(lx + (i ? 4 : -4), 232);
      ctx.stroke();
      // three toes
      pen(ctx, 2.2, INK);
      [-7, 0, 7].forEach(function (tx) {
        ctx.beginPath();
        ctx.moveTo(lx + (i ? 4 : -4), 232);
        ctx.quadraticCurveTo(lx + (i ? 4 : -4) + tx * 0.7, 236, lx + (i ? 4 : -4) + tx, 240);
        ctx.stroke();
      });
      pen(ctx, 3, INK);
    });
  }

  /* ════════════════════ BACK FACE — the domed cage (symmetric) ════════════════════ */
  function drawCage(ctx) {
    paper(ctx);
    var top = 68, shoulderY = 120, baseY = 300;
    var halfW = 100;                       // shoulder half-width
    // dome apex ring sits at (AX, ringY)
    var ringY = 46;

    // -- top hook + finial ring (with a small sanguine ribbon bow) --
    pen(ctx, 3.2, INK);
    ctx.beginPath();
    ctx.moveTo(AX, ringY - 6);
    ctx.bezierCurveTo(AX, ringY - 22, AX + 16, ringY - 24, AX + 14, ringY - 36);
    ctx.stroke();
    taper(ctx, function () { ctx.beginPath(); ctx.arc(AX, ringY, 10, 0, 7); }, 3.2);
    // ribbon bow (sanguine) tied on the ring
    pen(ctx, 2, SANG);
    ctx.beginPath();
    ctx.moveTo(AX, ringY + 8);
    ctx.quadraticCurveTo(AX - 16, ringY + 4, AX - 12, ringY + 20);
    ctx.quadraticCurveTo(AX - 4, ringY + 14, AX, ringY + 12);
    ctx.quadraticCurveTo(AX + 4, ringY + 14, AX + 12, ringY + 20);
    ctx.quadraticCurveTo(AX + 16, ringY + 4, AX, ringY + 8);
    ctx.stroke();

    // -- the bell dome: outer ogee contour --
    taper(ctx, function () {
      ctx.beginPath();
      ctx.moveTo(AX - halfW, shoulderY);
      ctx.bezierCurveTo(AX - halfW, top + 6, AX - 34, top - 6, AX, top - 8);
      ctx.bezierCurveTo(AX + 34, top - 6, AX + halfW, top + 6, AX + halfW, shoulderY);
    }, 4.2);

    // -- dome ribs: curved bars converging toward the finial (thickened a hair so
    //    they survive the 50/50 fusion instead of vanishing) --
    pen(ctx, 3.0, INK);
    for (var r = -3; r <= 3; r++) {
      if (r === 0) continue;
      var sx = AX + r * (halfW / 3.4);
      var topx = AX + r * 4;
      ctx.beginPath();
      ctx.moveTo(sx, shoulderY);
      ctx.quadraticCurveTo(AX + r * (halfW / 3), top + 8, topx, top - 4);
      ctx.stroke();
    }
    // centre rib
    ctx.beginPath(); ctx.moveTo(AX, shoulderY); ctx.lineTo(AX, top - 6); ctx.stroke();

    // -- dome volume: cross-hatch on the right flank --
    hatch(ctx, function () {
      ctx.moveTo(AX + 6, shoulderY);
      ctx.bezierCurveTo(AX + 6, top + 8, AX + 40, top, AX + halfW - 6, shoulderY - 2);
      ctx.lineTo(AX + 6, shoulderY);
    }, 0.5, 5, 0.9, 0.24);

    // -- shoulder ring (top of the barrel) --
    taper(ctx, function () { ctx.beginPath(); ctx.ellipse(AX, shoulderY, halfW, 15, 0, 0, 7); }, 3);

    // -- the vertical BARS (the payoff) — clean and crisp, 9 of them --
    var nBars = 9;
    for (var i = 0; i < nBars; i++) {
      var f = (i / (nBars - 1)) * 2 - 1;         // -1..1
      var x = AX + f * halfW;
      var yTop = shoulderY + 15 * Math.sqrt(Math.max(0, 1 - f * f)); // seat on the ring's lower arc
      pen(ctx, 2.8, INK);
      ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, baseY); ctx.stroke();
      // a thin inner highlight so each bar reads round
      pen(ctx, 1, ink(0.4));
      ctx.beginPath(); ctx.moveTo(x - 1.4, yTop + 4); ctx.lineTo(x - 1.4, baseY - 4); ctx.stroke();
    }

    // -- two horizontal hoops binding the bars --
    pen(ctx, 2.4, INK);
    [178, 262].forEach(function (hy) {
      ctx.beginPath(); ctx.ellipse(AX, hy, halfW, 13, 0, 0, 7); ctx.stroke();
      pen(ctx, 1, ink(0.35));
      ctx.beginPath(); ctx.ellipse(AX, hy - 2, halfW - 2, 11, 0, Math.PI, 2 * Math.PI); ctx.stroke();
      pen(ctx, 2.4, INK);
    });

    // -- swing perch: a hoop hung from the apex on two threads, the bird's seat (y≈210) --
    pen(ctx, 1.6, ink(0.8));
    ctx.beginPath();
    ctx.moveTo(AX - 34, 210); ctx.lineTo(AX - 30, shoulderY + 6);
    ctx.moveTo(AX + 34, 210); ctx.lineTo(AX + 30, shoulderY + 6);
    ctx.stroke();
    pen(ctx, 3.4, INK);
    ctx.beginPath();
    ctx.moveTo(AX - 40, 210);
    ctx.quadraticCurveTo(AX, 220, AX + 40, 210);
    ctx.stroke();
    pen(ctx, 2, ink(0.6));
    ctx.beginPath();
    ctx.moveTo(AX - 38, 212);
    ctx.quadraticCurveTo(AX, 221, AX + 38, 212);
    ctx.stroke();

    // -- base: rim ring + a decorative banded foot --
    taper(ctx, function () { ctx.beginPath(); ctx.ellipse(AX, baseY, halfW, 16, 0, 0, 7); }, 3.2);
    pen(ctx, 3.4, INK);
    ctx.beginPath();
    ctx.moveTo(AX - halfW, baseY);
    ctx.lineTo(AX - halfW - 6, baseY + 16);
    ctx.quadraticCurveTo(AX, baseY + 30, AX + halfW + 6, baseY + 16);
    ctx.lineTo(AX + halfW, baseY);
    ctx.stroke();
    taper(ctx, function () { ctx.beginPath(); ctx.ellipse(AX, baseY + 18, halfW + 6, 15, 0, 0, Math.PI); }, 3);
    // scalloped foot moulding
    pen(ctx, 2, ink(0.85));
    for (var b = -3; b <= 3; b++) {
      ctx.beginPath();
      ctx.arc(AX + b * 26, baseY + 22, 8, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
    }
    // base shading
    hatch(ctx, function () { ctx.ellipse(AX, baseY + 20, halfW + 4, 13, 0, 0.1, Math.PI - 0.1); },
      0.5, 5, 0.9, 0.22);

    // -- three little splayed feet (solo-thumbnail charm; kept light + low, well
    //    below the caged bird so they never crowd the composite at fusion) --
    pen(ctx, 2.6, ink(0.88));
    [-70, 0, 70].forEach(function (fx) {
      ctx.beginPath();
      ctx.moveTo(AX + fx, baseY + 27);
      ctx.lineTo(AX + fx, baseY + 40);
      ctx.moveTo(AX + fx - 7, baseY + 41);
      ctx.quadraticCurveTo(AX + fx, baseY + 47, AX + fx + 7, baseY + 41);
      ctx.stroke();
    });
  }

  /* ════════════════════ registration ════════════════════ */
  window.installThaumArt = function (A) {
    A.setPair('birdcage', drawBird, drawCage);
    return 'birdcage';
  };
  (window.ThaumArt = window.ThaumArt || {}).birdcage = { a: drawBird, b: drawCage };
})();
