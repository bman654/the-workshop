/* ═══════════════════════════════════════════════════════════════════════════
   scene-gate.js  —  the brass double gate assembly  (window.Gate.scenegate)

   The foreground HERO: a grand brass DOUBLE gate (two leaves, closed) flanked by
   substantial masonry PIERS with ornate brass caps + EMISSIVE lamp-globes on top
   (they glow at night — a payoff). An arched/scrolled CREST spans where the leaves
   meet; finial-topped vertical bars; the clockwork gear-train mounted at the seam
   that visibly drives the swing; a prominent brass SUNDIAL (the gnomon) among the
   gears (tap → time-of-day cycle); and an engraved brass plaque. You see the
   grounds + the centered manor THROUGH the bars; the road passes through the seam.

   GREYBOX: rough but correctly composed + the swing/turn MACHINERY is real.
   Brass idiom: dark body rgba(11,14,22,.85) + brass stroke var(--brass-stroke-ref)
   + warm glow + var(--brass-bright-ref) top-edge highlights. The leaves hinge on
   the INNER pier edges and swing OUTWARD.

   The gate spans ~50% of frame width (piers x400..1200, centered on the seam x800),
   so it READS as a grand estate entrance, not a garden gate. Observatory-hill stays
   to the LEFT of the left pier; greenhouse to the RIGHT of the right pier.

   Refs published for the sequence animation:
     S.refs.leftLeaf, S.refs.rightLeaf  — the swinging <g> groups (transform-box
       set so rotate() pivots at the hinge); the gear-train is PARENTED INTO the
       leaves so it travels with the swing while staying spinnable,
     S.refs.gears (the spinning gear group), S.refs.gnomon (the tap target).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var G = {};

  // gate geometry within the 1600×900 viewBox: centered, foreground, tall, GRAND.
  var CX = 800;          // center seam
  var TOP = 232;         // top of the leaves (taller → fills the dead sky)
  var BOT = 900;         // gate runs off the bottom edge (foreground)
  var HALF = 328;        // each leaf half-width → leaves span 472..1128 (opening)
  var PIER_W = 72;       // SUBSTANTIAL masonry columns
  var LEFT_PIER_CX = 436;   // outer edge x400
  var RIGHT_PIER_CX = 1164; // outer edge x1200
  // the leaves hinge on the INNER pier edges
  var LEFT_HINGE = LEFT_PIER_CX + PIER_W / 2;   // x=472
  var RIGHT_HINGE = RIGHT_PIER_CX - PIER_W / 2; // x=1128
  G.CX = CX; G.TOP = TOP; G.BOT = BOT;

  /* ── one gate leaf: a brass frame with vertical finialled bars + rails ──────── */
  function drawLeaf(S, parent, hingeX, dir) {
    // dir = +1 (right leaf, hinge on right pier) | -1 (left leaf, hinge on left pier)
    var g = S.group(dir < 0 ? 'gate-left-leaf' : 'gate-right-leaf', parent);
    var x0 = dir < 0 ? hingeX : hingeX - HALF;   // left edge of this leaf's box
    var w = HALF;
    var top = TOP, h = BOT - TOP;

    // outer frame (heavier stile on the leaf edges)
    S.el('rect', { x: x0, y: top, width: w, height: h, fill: 'rgba(11,14,22,.55)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '4' }, g);
    // top-edge brass-bright sheen
    S.el('line', { x1: x0 + 2, y1: top + 2, x2: x0 + w - 2, y2: top + 2,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.4', opacity: '0.6' }, g);

    // vertical bars (you see the grounds through them)
    var bars = 9;
    for (var i = 1; i < bars; i++) {
      var bx = x0 + i * (w / bars);
      S.el('line', { x1: bx, y1: top + 6, x2: bx, y2: BOT, stroke: 'var(--gate-iron-ref, #14171f)', 'stroke-width': '3.5' }, g);
      S.el('line', { x1: bx, y1: top + 6, x2: bx, y2: BOT, stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1', opacity: '0.7' }, g);
      // spear finial near the top
      S.el('path', { d: 'M ' + (bx - 5) + ' ' + (top + 6) + ' L ' + bx + ' ' + (top - 12) + ' L ' + (bx + 5) + ' ' + (top + 6) + ' Z',
        fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    }
    // horizontal rails (tie-bars that carry the bars)
    var rails = [top + 26, top + 150, top + 360, top + 560];
    for (var r = 0; r < rails.length; r++) {
      S.el('line', { x1: x0 + 2, y1: rails[r], x2: x0 + w - 2, y2: rails[r],
        stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2.6', opacity: '0.9' }, g);
    }

    // ── ornate scrollwork in the upper register (Victorian wrought feel) ──
    // a row of C-scrolls hanging from the top rail, mirrored about the leaf center
    var lc = x0 + w / 2;
    var scrollY = top + 26;
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var sx = lc + sgn * w * 0.26;
      S.el('path', {
        d: 'M ' + sx + ' ' + scrollY +
           ' q ' + (sgn * 34) + ' 8 ' + (sgn * 30) + ' 44' +
           ' q ' + (-sgn * 4) + ' 26 ' + (-sgn * 28) + ' 22',
        fill: 'none', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2', opacity: '0.85' }, g);
    }

    // set the hinge as the transform pivot (SVG transform-box + transform-origin).
    // Each leaf hinges on its PIER edge (the OUTER edge of its box) and swings the
    // free edge (the seam side) outward:
    //   left leaf  → hinge at its LEFT edge (the left pier)  → origin 0% 0%,
    //   right leaf → hinge at its RIGHT edge (the right pier) → origin 100% 0%.
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = (dir < 0 ? '0% 0%' : '100% 0%');
    return g;
  }

  /* ── the arched / scrolled CREST across the top of the two leaves ────────────
     A decorative cresting where the leaves meet — an arch with a brass volute and
     a central finial, giving the gate ORNATE HEIGHT. Drawn over the seam, between
     the piers. Static (doesn't swing — it's the crown the leaves close beneath). */
  function drawCrest(S, parent) {
    var g = S.group('gate-crest', parent);
    var span = RIGHT_HINGE - LEFT_HINGE;       // opening width
    var L = LEFT_HINGE, R = RIGHT_HINGE;
    var baseY = TOP - 4;
    var peak = TOP - 86;                        // arch rises above the leaf tops
    // the arch sweep (a flattened gothic curve), drawn as a stroked band
    var arch = 'M ' + L + ' ' + baseY +
               ' C ' + (L + span * 0.18) + ' ' + (peak + 8) + ' ' + (CX - span * 0.16) + ' ' + peak + ' ' + CX + ' ' + peak +
               ' C ' + (CX + span * 0.16) + ' ' + peak + ' ' + (R - span * 0.18) + ' ' + (peak + 8) + ' ' + R + ' ' + baseY;
    S.el('path', { d: arch, fill: 'none', stroke: 'var(--gate-iron-ref, #14171f)', 'stroke-width': '7' }, g);
    S.el('path', { d: arch, fill: 'none', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2.4' }, g);
    // top-lit sheen along the crown
    S.el('path', { d: 'M ' + (CX - span * 0.18) + ' ' + (peak + 1) + ' Q ' + CX + ' ' + (peak - 3) + ' ' + (CX + span * 0.18) + ' ' + (peak + 1),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.4', opacity: '0.6' }, g);

    // symmetric volute scrolls under the arch springers
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var sx = CX + sgn * span * 0.30;
      S.el('path', {
        d: 'M ' + sx + ' ' + (peak + 26) +
           ' q ' + (sgn * 40) + ' 2 ' + (sgn * 42) + ' 34' +
           ' q ' + (-sgn * 2) + ' 22 ' + (-sgn * 26) + ' 18',
        fill: 'none', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2.2', opacity: '0.85' }, g);
    }

    // central finial crowning the arch (a brass orb + spire)
    S.el('line', { x1: CX, y1: peak, x2: CX, y2: peak - 26,
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2.4' }, g);
    S.el('circle', { cx: CX, cy: peak - 30, r: 6, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.6' }, g);
    S.el('path', { d: 'M ' + (CX - 4) + ' ' + (peak - 34) + ' L ' + CX + ' ' + (peak - 48) + ' L ' + (CX + 4) + ' ' + (peak - 34) + ' Z',
      fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    S.el('circle', { cx: CX - 2, cy: peak - 32, r: 2, fill: 'var(--brass-bright-ref, #f0d489)', opacity: '0.85' }, g);
    return g;
  }

  /* ── a PIER: a substantial stone column with a stepped brass cap + an EMISSIVE
     lamp-globe / finial on top (glows at night — the payoff). ─────────────────── */
  function drawPier(S, parent, cx) {
    var g = S.group(null, parent);
    var capY = TOP - 24;             // where the cap sits
    var bodyTop = capY + 4;
    // column body
    S.el('rect', { x: cx - PIER_W / 2, y: bodyTop, width: PIER_W, height: BOT - bodyTop,
      fill: 'var(--stone-ref, #6a7079)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // masonry course lines (so it reads as stacked stone)
    for (var cy = bodyTop + 70; cy < BOT; cy += 70) {
      S.el('line', { x1: cx - PIER_W / 2, y1: cy, x2: cx + PIER_W / 2, y2: cy,
        stroke: 'rgba(0,0,0,.28)', 'stroke-width': '1.2' }, g);
    }
    // a recessed panel down the face (light catch)
    S.el('rect', { x: cx - PIER_W / 2 + 12, y: bodyTop + 30, width: PIER_W - 24, height: BOT - bodyTop - 90,
      fill: 'none', stroke: 'rgba(0,0,0,.22)', 'stroke-width': '1.2' }, g);
    // left-edge top-lit sheen
    S.el('line', { x1: cx - PIER_W / 2 + 1.5, y1: bodyTop, x2: cx - PIER_W / 2 + 1.5, y2: BOT,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.22' }, g);

    // stepped brass CAP (cornice) — two courses
    S.el('rect', { x: cx - PIER_W / 2 - 8, y: capY, width: PIER_W + 16, height: 14,
      fill: 'var(--stone-ref, #6a7079)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    S.el('rect', { x: cx - PIER_W / 2 - 14, y: capY - 12, width: PIER_W + 28, height: 12, rx: 2,
      fill: 'rgba(11,14,22,.85)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // cap top-edge brass-bright
    S.el('line', { x1: cx - PIER_W / 2 - 12, y1: capY - 11, x2: cx + PIER_W / 2 + 12, y2: capY - 11,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.55' }, g);

    // a brass LANTERN base on the cap
    var lampBaseY = capY - 12;
    S.el('rect', { x: cx - 9, y: lampBaseY - 14, width: 18, height: 14, rx: 2,
      fill: 'rgba(11,14,22,.9)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // the EMISSIVE lamp-globe / finial (palette-IMMUNE — blazes at night)
    var globeY = lampBaseY - 26;
    // soft halo
    S.el('circle', { cx: cx, cy: globeY, r: 22, fill: 'var(--lamp-flame-ref, #ffd27a)',
      opacity: '0.30', filter: 'url(#glow-soft)' }, g);
    // glass globe
    S.el('circle', { cx: cx, cy: globeY, r: 9, fill: 'var(--lamp-flame-ref, #ffd27a)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // bright core
    S.el('circle', { cx: cx, cy: globeY, r: 4, fill: 'var(--lamp-flame-ref, #ffd27a)' }, g);
    // a little brass finial spike crowning the globe
    S.el('line', { x1: cx, y1: globeY - 9, x2: cx, y2: globeY - 18,
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2' }, g);
    S.el('circle', { cx: cx, cy: globeY - 20, r: 2.4, fill: 'var(--brass-bright-ref, #f0d489)' }, g);
    return g;
  }

  /* ── a clockwork gear (toothed disc) ────────────────────────────────────────── */
  function drawGear(S, parent, cx, cy, rOuter, teeth) {
    var g = S.group(null, parent);
    var rInner = rOuter * 0.74, rHub = rOuter * 0.28;
    // teeth ring as a star-ish polygon
    var pts = [];
    var n = teeth * 2;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      var rr = (i % 2 === 0) ? rOuter : rInner;
      pts.push((cx + Math.cos(ang) * rr).toFixed(1) + ',' + (cy + Math.sin(ang) * rr).toFixed(1));
    }
    S.el('polygon', { points: pts.join(' '), fill: 'rgba(11,14,22,.9)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // rim
    S.el('circle', { cx: cx, cy: cy, r: rInner * 0.9, fill: 'none',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // hub
    S.el('circle', { cx: cx, cy: cy, r: rHub, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // spokes
    for (var s = 0; s < 4; s++) {
      var a = (s / 4) * Math.PI * 2;
      S.el('line', { x1: cx + Math.cos(a) * rHub, y1: cy + Math.sin(a) * rHub,
        x2: cx + Math.cos(a) * rInner * 0.85, y2: cy + Math.sin(a) * rInner * 0.85,
        stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    }
    // top-edge glint
    S.el('circle', { cx: cx - rOuter * 0.3, cy: cy - rOuter * 0.5, r: 2.2, fill: 'var(--brass-bright-ref, #f0d489)', opacity: '0.7' }, g);
    // pivot at center so the sequence can spin it
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = '50% 50%';
    return g;
  }

  /* ── the SUNDIAL gnomon: a brass dial face with hour marks + a raised blade
     casting a shadow (tap target → time-of-day cycle). Prominent, inviting. ───── */
  function drawGnomon(S, parent, cx, cy) {
    var g = S.group('gnomon-target', parent);
    var R = 38;
    // generous invisible hit-target
    S.el('circle', { cx: cx, cy: cy, r: R + 8, fill: 'transparent' }, g);
    // dial face (dark body + brass ring)
    S.el('circle', { cx: cx, cy: cy, r: R, fill: 'rgba(11,14,22,.9)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2' }, g);
    S.el('circle', { cx: cx, cy: cy, r: R, fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '0.8', opacity: '0.35' }, g);
    // hour marks around the rim (the half facing the sun gets the marks)
    for (var hm = 0; hm < 12; hm++) {
      var a = (hm / 12) * Math.PI * 2 - Math.PI / 2;
      var inner = (hm % 3 === 0) ? R - 9 : R - 5;
      S.el('line', {
        x1: (cx + Math.cos(a) * inner).toFixed(1), y1: (cy + Math.sin(a) * inner).toFixed(1),
        x2: (cx + Math.cos(a) * (R - 2)).toFixed(1), y2: (cy + Math.sin(a) * (R - 2)).toFixed(1),
        stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': (hm % 3 === 0) ? '2' : '1.1',
        opacity: '0.85' }, g);
    }
    // cast SHADOW of the blade onto the dial (greybox; the real shadow tracks the
    // sun in Phase D — this static one reads as a sundial)
    S.el('path', { d: 'M ' + cx + ' ' + (cy + 4) + ' L ' + (cx - R * 0.62) + ' ' + (cy + R * 0.30) +
      ' L ' + (cx - R * 0.40) + ' ' + (cy + R * 0.42) + ' Z',
      fill: 'rgba(0,0,0,.45)' }, g);
    // the raised gnomon BLADE (a right-triangle standing on the noon line)
    S.el('path', { d: 'M ' + (cx - 2) + ' ' + (cy + 6) + ' L ' + (cx + R * 0.66) + ' ' + (cy + 6) +
      ' L ' + (cx - 2) + ' ' + (cy - R * 0.7) + ' Z',
      fill: '#e6bd6f', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // blade top-edge bright (lit from above)
    S.el('line', { x1: cx - 2, y1: cy + 6, x2: cx - 2, y2: cy - R * 0.7,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.8' }, g);
    // center boss
    S.el('circle', { cx: cx, cy: cy + 4, r: 3, fill: 'rgba(11,14,22,.9)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // a soft pulsing hint glow so the tap target is discoverable
    var hint = S.el('circle', { cx: cx, cy: cy, r: R + 4, fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.0', filter: 'url(#glow-soft)' }, g);
    hint.setAttribute('class', 'gnomon-hint');
    return g;
  }

  /* ── the engraved brass plaque ──────────────────────────────────────────────── */
  function drawPlaque(S, parent) {
    var g = S.group('plaque', parent);
    var px = CX, py = 720, w = 300, h = 90;
    S.el('rect', { x: px - w / 2, y: py - h / 2, width: w, height: h, rx: 6,
      fill: 'rgba(11,14,22,.9)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2' }, g);
    // top-edge bright
    S.el('line', { x1: px - w / 2 + 4, y1: py - h / 2 + 3, x2: px + w / 2 - 4, y2: py - h / 2 + 3,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.55' }, g);
    var t1 = S.el('text', { x: px, y: py - 6, 'text-anchor': 'middle',
      'font-family': 'Georgia, serif', 'font-weight': '500', 'font-size': '32',
      fill: 'var(--brass-bright-ref, #f0d489)' }, g);
    t1.textContent = 'The Orrery Estate';
    var t2 = S.el('text', { x: px, y: py + 24, 'text-anchor': 'middle',
      'font-family': 'ui-monospace, monospace', 'font-size': '13', 'letter-spacing': '0.28em',
      fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    t2.textContent = 'CLICK TO ENTER';
    return g;
  }

  /* ── drawGate: assemble the whole gate into a layer <g>. ─────────────────────── */
  G.drawGate = function (parent, S) {
    var g = S.group('gate-assembly', parent);

    // the two leaves first (closed: left fills 472..800, right fills 800..1128).
    var leftLeaf = drawLeaf(S, g, LEFT_HINGE, -1);   // box x472..800, hinge x472 (left pier)
    var rightLeaf = drawLeaf(S, g, RIGHT_HINGE, +1); // box x800..1128, hinge x1128 (right pier)
    S.refs.leftLeaf = leftLeaf;
    S.refs.rightLeaf = rightLeaf;

    // central clockwork gear-train mounted ON the gate FACE, straddling the SEAM
    // where the two leaves meet — the big driver gear sits exactly on the meeting
    // stiles so it reads as the mechanism that turns the leaves. It's a direct child
    // of the assembly (not a leaf) so the swing reveals the road cleanly and the
    // gears never arc through the ground; spinGears() spins it about its own center.
    var gears = S.group('gears', g);
    // big driver gear centered on the seam (the visible "engine" of the gate)
    drawGear(S, gears, CX, 470, 72, 18);
    // train fanning out around it, reading as the drive chain
    drawGear(S, gears, CX - 84, 548, 44, 13);
    drawGear(S, gears, CX + 80, 544, 50, 14);
    drawGear(S, gears, CX + 10, 372, 34, 11);
    drawGear(S, gears, CX - 70, 410, 26, 10);
    // pivot the cluster about its own bbox center so spinGears() rotates it cleanly
    gears.style.transformBox = 'fill-box';
    gears.style.transformOrigin = '50% 50%';
    S.refs.gears = gears;

    // the SUNDIAL gnomon among the gears (prominent brass dial + raised blade),
    // also at the seam so it stays glued to the mechanism (tap → time-of-day)
    var gnomon = drawGnomon(S, g, CX - 2, 632);
    S.refs.gnomon = gnomon;

    // the ornate arched CREST across the seam (static crown the leaves close beneath)
    drawCrest(S, g);

    // piers OUTSIDE the leaves (drawn last so their solid stone overlaps the leaf
    // hinge edges + the lamp-globes sit clearly on top)
    drawPier(S, g, LEFT_PIER_CX);    // outer edge x400
    drawPier(S, g, RIGHT_PIER_CX);   // outer edge x1200

    // the plaque (in front, reads over the closed leaves)
    drawPlaque(S, g);

    return g;
  };

  /* ── swing(openFrac): open the leaves on their VERTICAL pier hinges. openFrac
     0=closed, 1=full open. A tall gate leaf swinging back on a vertical hinge
     projects (in 2D) as a HORIZONTAL foreshortening toward the hinge — NOT an
     in-plane rotation (which would tip the leaf over). So we scaleX each leaf from
     1 (closed) toward cos(angle) (open) about its hinge edge, with a small skew for
     a touch of perspective lift. The leaves stay upright and read as opening doors,
     revealing the road to the centered manor. Signature unchanged (sequence.js). */
  G.swing = function (openFrac, S) {
    var f = Math.max(0, Math.min(1, openFrac));
    var ang = (80 * Math.PI / 180) * f;          // hinge angle, up to 80°
    var sx = Math.cos(ang);                        // horizontal foreshortening
    var skew = 4 * f;                              // subtle perspective lift (deg)
    if (S.refs.leftLeaf)  S.refs.leftLeaf.style.transform  = 'scaleX(' + sx.toFixed(4) + ') skewY(' + (skew).toFixed(2) + 'deg)';
    if (S.refs.rightLeaf) S.refs.rightLeaf.style.transform = 'scaleX(' + sx.toFixed(4) + ') skewY(' + (-skew).toFixed(2) + 'deg)';
  };

  /* ── spinGears(turns): rotate the whole gear cluster by `turns` revolutions. ── */
  G.spinGears = function (turns, S) {
    if (S.refs.gears) S.refs.gears.style.transform = 'rotate(' + (turns * 360) + 'deg)';
  };

  Gate.scenegate = G;

  if (typeof module !== 'undefined' && module.exports) { module.exports = G; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
