/* ═══════════════════════════════════════════════════════════════════════════
   THE THAUMATROPE — forged face art: RIDER ↔ HORSE   (take 2)

   Warm ink-on-parchment copperplate engraving. FRONT = a spirited jockey seated
   forward; BACK = a striding saddle-horse in side profile, authored ALREADY-
   MIRRORED (the page flips the back about x=180). Registration crux: the rider's
   seat lands on the horse's saddle line at (x≈180, y≈205) — mounted, not floating
   or sinking. A small saddle-blanket is inked on the horse's back, centred so the
   flip keeps it under the seat.

   Character of this take: engraver's WEIGHT — confident tapering contours plus
   genuine cross-hatch / stipple modelling on the barrel, haunch and jacket, a
   flowing mane and tail, a dull-sanguine accent on cap band and nostril. A horse
   with life in it and a rider who is riding.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var FS = 360;
  var PAPER = '#f3ecd6', INK = '#2b2a24', SANGUINE = '#8a4a2a';

  /* ── parchment ground (own copy; the shipped page swaps a richer one) ── */
  function paper(ctx) {
    ctx.clearRect(0, 0, FS, FS);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, FS, FS);
    var g = ctx.createRadialGradient(FS * 0.5, FS * 0.44, FS * 0.12, FS * 0.5, FS * 0.5, FS * 0.72);
    g.addColorStop(0, 'rgba(255,250,235,.5)');
    g.addColorStop(1, 'rgba(120,96,52,.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, FS, FS);
    ctx.strokeStyle = 'rgba(120,96,52,.16)'; ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, FS - 7, FS - 7);
  }

  /* ── engraver's toolkit ────────────────────────────────────────────── */
  function pen(ctx, w, col) {
    ctx.strokeStyle = col || INK; ctx.lineWidth = w;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = col || INK;
  }
  // a confident tapering contour: draw a polyline whose width swells then thins.
  function taper(ctx, pts, wMax, wEnd, col) {
    if (wEnd == null) wEnd = 1.2;
    var n = pts.length;
    for (var i = 0; i < n - 1; i++) {
      var t = i / (n - 2 || 1);
      // parabolic swell: thin at both ends, fat in the belly of the stroke
      var w = wEnd + (wMax - wEnd) * (1 - Math.pow(2 * t - 1, 2));
      pen(ctx, Math.max(0.7, w), col);
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
  }
  // clip to a path, then rule parallel hatch lines across the bounding box.
  function hatch(ctx, pathFn, ang, gap, w, alpha, col) {
    ctx.save();
    ctx.beginPath(); pathFn(ctx); ctx.clip();
    ctx.globalAlpha = alpha; pen(ctx, w, col);
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var nx = -dy, ny = dx;                    // step direction (normal to the lines)
    var R = FS * 1.5;
    for (var s = -R; s <= R; s += gap) {
      var px = FS / 2 + nx * s, py = FS / 2 + ny * s;
      ctx.beginPath();
      ctx.moveTo(px - dx * R, py - dy * R);
      ctx.lineTo(px + dx * R, py + dy * R);
      ctx.stroke();
    }
    ctx.restore();
  }
  // deterministic stipple within a clip path
  function stipple(ctx, pathFn, count, r, alpha, seed) {
    ctx.save();
    ctx.beginPath(); pathFn(ctx); ctx.clip();
    ctx.globalAlpha = alpha; ctx.fillStyle = INK;
    var s = seed || 1;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < count; i++) {
      var x = rnd() * FS, y = rnd() * FS;
      ctx.beginPath(); ctx.arc(x, y, r * (0.6 + 0.8 * rnd()), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function poly(ctx, pts, close) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  }

  /* ══════════════ BACK FACE — the HORSE (drawn head-RIGHT; the page flips
        it about x=180 so the final composite reads head-LEFT). Saddle line kept
        level through the centre at y≈205 so the flip does not shift the seat. ══ */
  function horseBodyPath(ctx) {
    // closed silhouette of the barrel+shoulder+haunch (no legs/neck)
    poly(ctx, [
      [232, 200],            // withers
      [206, 205], [180, 206], [150, 205], [130, 205],   // level back through centre
      [116, 214],            // point of croup / dock
      [116, 246], [124, 268],                            // buttock
      [140, 280], [168, 285], [196, 283],               // belly rise (flank→belly)
      [226, 276], [244, 262],                            // sheath / girth
      [250, 236], [246, 214], [238, 202]                 // chest up to shoulder/withers
    ], true);
  }
  function horseHaunchPath(ctx) {
    poly(ctx, [[116, 214], [150, 205], [158, 244], [148, 274], [124, 268], [116, 246]], true);
  }
  function drawHorse(ctx) {
    paper(ctx);

    // ground shadow whisper under the hooves (very light, warm)
    ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = INK;
    ctx.beginPath(); ctx.ellipse(178, 326, 96, 9, 0, 0, 7); ctx.fill(); ctx.restore();

    // FAR legs first (behind), a touch lighter so they recede
    pen(ctx, 5, 'rgba(43,42,36,.72)');
    taper(ctx, [[210, 262], [214, 292], [216, 318], [222, 322]], 6, 2, 'rgba(43,42,36,.72)'); // far fore
    taper(ctx, [[152, 262], [150, 292], [152, 318], [158, 322]], 6, 2, 'rgba(43,42,36,.72)'); // far hind
    // hoof caps (far)
    pen(ctx, 6, 'rgba(43,42,36,.72)');
    ctx.beginPath(); ctx.moveTo(216, 322); ctx.lineTo(226, 322); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150, 322); ctx.lineTo(160, 322); ctx.stroke();

    // BODY silhouette — heavy confident contour (graft: bolder outline so the
    // mount carries more presence at whirl on the dark exhibit frame)
    pen(ctx, 4.3);
    horseBodyPath(ctx); ctx.stroke();

    // NECK + HEAD (right side). Crest line (top) and throat line (front).
    // crest: withers → poll, a proud arch — heavy taper contrast (fat crest, fine poll)
    taper(ctx, [[232, 200], [252, 182], [274, 162], [292, 150], [300, 148]], 8.5, 2);
    // throat/underside of neck: chest → jaw
    taper(ctx, [[248, 220], [268, 204], [288, 190], [300, 182]], 6.5, 2);
    // head: poll → face → nose → muzzle → jaw
    pen(ctx, 3.9);
    ctx.beginPath();
    ctx.moveTo(300, 148);
    ctx.quadraticCurveTo(318, 156, 320, 178);        // forehead → nose bridge
    ctx.quadraticCurveTo(321, 194, 312, 202);         // nose → muzzle
    ctx.quadraticCurveTo(302, 206, 298, 196);         // lower lip → chin
    ctx.quadraticCurveTo(297, 188, 300, 182);         // jaw
    ctx.stroke();
    // ears
    pen(ctx, 2.6);
    ctx.beginPath(); ctx.moveTo(296, 150); ctx.lineTo(292, 138); ctx.lineTo(300, 148); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(303, 149); ctx.lineTo(302, 137); ctx.lineTo(309, 149); ctx.stroke();
    // eye + nostril (nostril gets a whisper of sanguine)
    ctx.beginPath(); ctx.arc(306, 166, 2.4, 0, 7); ctx.fill();
    pen(ctx, 2.2, SANGUINE);
    ctx.beginPath(); ctx.arc(314, 190, 2.6, 0.4, 4.2); ctx.stroke();

    // MANE — short crisp strokes falling off the crest
    pen(ctx, 2.0);
    var mane = [[236, 197], [244, 190], [252, 182], [261, 174], [270, 166], [279, 159], [288, 153]];
    for (var m = 0; m < mane.length; m++) {
      var mx = mane[m][0], my = mane[m][1];
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 7, my + 13); ctx.stroke();
    }
    // forelock
    ctx.beginPath(); ctx.moveTo(300, 150); ctx.lineTo(308, 160); ctx.stroke();

    // LEGS — near pair, striding, with knee/cannon/fetlock articulation
    pen(ctx, 3.6);
    taper(ctx, [[236, 260], [240, 286], [241, 308], [242, 320]], 9, 3);      // near fore (upper→cannon)
    taper(ctx, [[130, 260], [136, 282], [141, 306], [143, 320]], 9, 3);      // near hind
    // hooves (near) — solid little wedges
    pen(ctx, 2.6);
    ctx.beginPath(); ctx.moveTo(237, 320); ctx.lineTo(249, 320); ctx.lineTo(247, 326); ctx.lineTo(238, 326); ctx.closePath(); ctx.fill(); // near-fore
    ctx.beginPath(); ctx.moveTo(138, 320); ctx.lineTo(150, 320); ctx.lineTo(148, 326); ctx.lineTo(139, 326); ctx.closePath(); ctx.fill(); // near-hind
    // knee (fore) + hock (hind) articulation, and a fetlock tuft
    pen(ctx, 2.0);
    ctx.beginPath(); ctx.arc(239, 286, 3.2, -0.4, 2.6); ctx.stroke();        // fore knee
    ctx.beginPath(); ctx.arc(138, 282, 3.6, 0.6, 3.8); ctx.stroke();          // hind hock
    ctx.beginPath(); ctx.moveTo(240, 314); ctx.lineTo(236, 319); ctx.moveTo(141, 314); ctx.lineTo(137, 319); ctx.stroke(); // fetlock

    // TAIL — flowing off the dock, down-left, wavy engraver strokes
    pen(ctx, 3.0);
    ctx.beginPath();
    ctx.moveTo(116, 214);
    ctx.bezierCurveTo(96, 232, 92, 268, 100, 300);
    ctx.stroke();
    var tail = [[110, 220], [102, 244], [98, 268], [100, 292],
                [118, 224], [113, 250], [112, 278],
                [104, 236], [99, 260]];
    pen(ctx, 1.8);
    for (var t = 0; t < tail.length; t++) {
      var tx = tail[t][0], ty = tail[t][1];
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 6, ty + 12, tx - 4, ty + 22); ctx.stroke();
    }

    // ── MODELLING: cross-hatch the barrel underside + haunch; stipple the belly ──
    hatch(ctx, horseBodyPath, 1.15, 6.5, 1.0, 0.16);                 // primary shade (down-right)
    hatch(ctx, horseHaunchPath, 1.15, 5.0, 1.1, 0.20);              // haunch rounding
    hatch(ctx, horseHaunchPath, -0.35, 6.0, 1.0, 0.13);            // cross set on the haunch
    stipple(ctx, horseBodyPath, 260, 0.7, 0.10, 7);                 // grain on the barrel
    // a bright crescent on the top of the barrel stays clean (lit from above) — no hatch there

    // muscle accents: shoulder and stifle sweeps
    pen(ctx, 1.6, 'rgba(43,42,36,.5)');
    ctx.beginPath(); ctx.moveTo(238, 210); ctx.quadraticCurveTo(246, 236, 240, 262); ctx.stroke(); // shoulder
    ctx.beginPath(); ctx.moveTo(150, 214); ctx.quadraticCurveTo(160, 240, 150, 268); ctx.stroke(); // stifle
    ctx.beginPath(); ctx.moveTo(180, 262); ctx.quadraticCurveTo(196, 272, 214, 266); ctx.stroke(); // girth

    // ── SADDLE on the back (centred; symmetric enough that the flip keeps it
    //    under the seat). Reinforces "the rider is mounted." ──
    pen(ctx, 3.0);
    ctx.beginPath();
    ctx.moveTo(148, 208);
    ctx.quadraticCurveTo(150, 196, 168, 195);      // cantle
    ctx.quadraticCurveTo(184, 193, 200, 196);
    ctx.quadraticCurveTo(214, 198, 214, 208);      // pommel
    ctx.stroke();
    // saddle-flap under the seat
    pen(ctx, 2.4);
    ctx.beginPath();
    ctx.moveTo(200, 205); ctx.quadraticCurveTo(206, 222, 198, 236);
    ctx.quadraticCurveTo(184, 240, 176, 234); ctx.stroke();
    // stirrup leather hint hanging from the flap
    ctx.beginPath(); ctx.moveTo(190, 236); ctx.lineTo(188, 252); ctx.stroke();
    ctx.beginPath(); ctx.arc(188, 256, 4, 0, 7); ctx.stroke();
    // saddle-blanket edge peeking below
    pen(ctx, 1.8, 'rgba(43,42,36,.6)');
    ctx.beginPath(); ctx.moveTo(150, 214); ctx.lineTo(160, 224); ctx.lineTo(200, 222); ctx.lineTo(210, 213); ctx.stroke();
  }

  /* ══════════════ FRONT FACE — the RIDER (NOT flipped; faces LEFT to match the
        flipped horse). Seat at (x≈180, y≈205); head ≈ y112; boots ≈ y250. ══ */
  function riderJacketPath(ctx) {
    poly(ctx, [[168, 138], [186, 136], [192, 166], [194, 196], [180, 204],
               [166, 200], [162, 170], [162, 148]], true);
  }
  function drawRider(ctx) {
    paper(ctx);

    // reins first (behind the hands): from hands forward-left toward the (flipped) mouth
    pen(ctx, 2.2);
    ctx.beginPath(); ctx.moveTo(138, 172); ctx.quadraticCurveTo(120, 182, 104, 196); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(142, 176); ctx.quadraticCurveTo(122, 188, 106, 202); ctx.stroke();

    // ── HEAD + JOCKEY CAP (facing left) ──
    pen(ctx, 3.0);
    // skull
    ctx.beginPath(); ctx.arc(166, 114, 15, 0, 7); ctx.stroke();
    // cap crown — SOLID dull-sanguine dome (graft: a warm focal point that
    // survives the whirl, per the judges, not just a thin band); peak jutting left.
    ctx.save();
    ctx.fillStyle = SANGUINE;
    ctx.beginPath();
    ctx.moveTo(181, 110);
    ctx.quadraticCurveTo(181, 93, 162, 93);          // crown back→top
    ctx.quadraticCurveTo(150, 94, 149, 111);         // down the front of the dome
    ctx.quadraticCurveTo(158, 108, 168, 108);        // under-brim back to crown
    ctx.quadraticCurveTo(176, 108, 181, 110);
    ctx.closePath(); ctx.fill();
    // peak / brim jutting forward-left
    ctx.beginPath();
    ctx.moveTo(150, 110); ctx.lineTo(138, 112);      // peak tip (forward/left)
    ctx.quadraticCurveTo(146, 115, 151, 114);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // ink outline over the crown for engraving weight
    pen(ctx, 2.4);
    ctx.beginPath();
    ctx.moveTo(181, 110);
    ctx.quadraticCurveTo(181, 93, 162, 93);
    ctx.quadraticCurveTo(150, 94, 149, 111);
    ctx.lineTo(138, 112);                            // peak tip
    ctx.lineTo(151, 114);
    ctx.stroke();
    // cap seam — a fine ink line under the crown
    pen(ctx, 1.6, 'rgba(43,42,36,.55)');
    ctx.beginPath(); ctx.moveTo(150, 112); ctx.quadraticCurveTo(165, 117, 181, 110); ctx.stroke();
    // face detail: brow line, nose hint, chin
    pen(ctx, 1.8);
    ctx.beginPath(); ctx.arc(157, 116, 1.6, 0, 7); ctx.fill();                     // eye
    ctx.beginPath(); ctx.moveTo(152, 120); ctx.lineTo(149, 124); ctx.lineTo(153, 126); ctx.stroke(); // nose
    ctx.beginPath(); ctx.moveTo(155, 130); ctx.quadraticCurveTo(160, 132, 164, 129); ctx.stroke();    // jaw/chin

    // ── TORSO / JACKET, leaning forward (racing seat) ── graft: inked a shade
    // heavier so the jockey holds like the bolder sibling takes, not washed out.
    pen(ctx, 3.7);
    // back line (spine): nape → seat
    taper(ctx, [[176, 130], [186, 150], [192, 176], [190, 198], [182, 205]], 7.2, 2.6);
    // chest/front line: throat → belly
    taper(ctx, [[160, 132], [162, 156], [166, 182], [172, 200]], 6, 2.6);
    // shoulder cap
    ctx.beginPath(); ctx.moveTo(160, 132); ctx.quadraticCurveTo(172, 128, 178, 134); ctx.stroke();
    // collar
    pen(ctx, 2.0);
    ctx.beginPath(); ctx.moveTo(163, 131); ctx.lineTo(170, 137); ctx.lineTo(177, 132); ctx.stroke();

    // ── ARM reaching to the reins ──
    pen(ctx, 3.8);
    // upper arm shoulder→elbow, forearm elbow→hand
    taper(ctx, [[172, 140], [158, 152], [146, 164], [140, 172]], 7, 3.2);
    // gloved fist on the reins
    pen(ctx, 3.0);
    ctx.beginPath(); ctx.arc(138, 173, 5, 0, 7); ctx.stroke();

    // ── LEGS: parted straddle over the flank. Near leg = a proper riding leg
    //    (thigh forward, knee bent, shin dropping to a heel-down boot in the
    //    stirrup); far leg drops behind, so the two read clearly PARTED. ──
    pen(ctx, 4.2);
    // near leg: hip → thigh (forward) → knee → shin (back down) → boot
    taper(ctx, [[184, 203], [172, 214], [162, 226], [160, 240], [162, 250]], 10, 3.8);
    // far leg: hip → behind the near one, dropping a touch further back/higher
    taper(ctx, [[180, 202], [178, 218], [178, 236], [177, 250]], 8, 3.2);
    // boots — heels down into stirrups (toe forward/left)
    pen(ctx, 4.0);
    ctx.beginPath(); ctx.moveTo(162, 250); ctx.lineTo(150, 252); ctx.quadraticCurveTo(148, 256, 152, 257); ctx.lineTo(163, 255); ctx.closePath(); ctx.fill(); // near boot
    pen(ctx, 3.6);
    ctx.beginPath(); ctx.moveTo(177, 250); ctx.lineTo(168, 252); ctx.quadraticCurveTo(167, 256, 170, 257); ctx.lineTo(178, 255); ctx.closePath(); ctx.fill(); // far boot
    // knee mark
    pen(ctx, 1.8);
    ctx.beginPath(); ctx.arc(162, 227, 3, 0.2, 3.4); ctx.stroke();

    // ── MODELLING on the jacket: light cross-hatch + a couple of fold lines ──
    hatch(ctx, riderJacketPath, 1.2, 5.5, 1.0, 0.19);
    hatch(ctx, riderJacketPath, -0.4, 7.0, 0.9, 0.12);
    pen(ctx, 1.5, 'rgba(43,42,36,.6)');
    ctx.beginPath(); ctx.moveTo(174, 152); ctx.quadraticCurveTo(182, 172, 184, 194); ctx.stroke(); // fold
    ctx.beginPath(); ctx.moveTo(166, 158); ctx.quadraticCurveTo(170, 178, 176, 196); ctx.stroke(); // fold
    ctx.beginPath(); ctx.moveTo(170, 150); ctx.quadraticCurveTo(176, 170, 180, 195); ctx.stroke(); // fold (added)
    // silk sash accent across the chest (sanguine, sparing)
    pen(ctx, 2.2, SANGUINE);
    ctx.beginPath(); ctx.moveTo(162, 150); ctx.lineTo(186, 168); ctx.stroke();
  }

  /* ── expose the exact API the harness + shipped page expect ── */
  window.installThaumArt = function (A) {
    A.setPair('riderhorse', drawRider, drawHorse);   // front, back(pre-mirrored)
    return 'riderhorse';
  };
  (window.ThaumArt = window.ThaumArt || {}).riderhorse = { a: drawRider, b: drawHorse };
})();
