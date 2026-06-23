/* ═══════════════════════════════════════════════════════════════════════════
   scene-gate.js  —  the brass double gate assembly  (window.Gate.scenegate)

   TAKE 1 — "The Wrought Crown."  A grand Victorian wrought-iron-and-brass double
   gate. The character: disciplined ornament — heavy edge stiles framing a register
   of finialled bars you see the manor THROUGH, a band of interlaced C-scrolls
   carrying a central heart-and-volute medallion, masonry piers crowned with brass
   lanterns whose glass globes BLAZE at night, a flattened-gothic crest with a
   sunburst tympanum and an orb-and-spire finial, a working clockwork gear-train at
   the seam, an engraved sundial (the tap target), and a brass nameplate.

   Brass idiom (NOT a gradient): dark body rgba(11,14,22,.85) + brass STROKE
   var(--brass-stroke-ref) ~1.4px + a warm glow (#glow-soft) + var(--brass-bright-ref)
   top-edge highlights on UP-facing edges. Lit from above: brightest sheen on each
   shape's TOP edge, shadows fall down/forward.

   Refs published for the sequence animation (UNCHANGED interface):
     S.refs.leftLeaf, S.refs.rightLeaf  — the swinging <g> groups (vertical hinges,
       foreshorten via scaleX about the OUTER pier edge),
     S.refs.seamFollow — the seam ornaments (gears + gnomon + plaque) that RIDE the
       right leaf on open (same foreshorten, pinned to the right hinge),
     S.refs.gears (spinning gear cluster), S.refs.gnomon (#gnomon-target tap target).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var G = {};

  // gate geometry within the 1600×900 viewBox: centered, foreground, tall, GRAND.
  var CX = 800;          // center seam
  var TOP = 232;         // top of the leaves
  var BOT = 900;         // gate runs off the bottom edge (foreground)
  var HALF = 328;        // each leaf half-width → leaves span 472..1128 (opening)
  var PIER_W = 72;       // SUBSTANTIAL masonry columns
  var LEFT_PIER_CX = 436;   // outer edge x400
  var RIGHT_PIER_CX = 1164; // outer edge x1200
  // the leaves hinge on the INNER pier edges
  var LEFT_HINGE = LEFT_PIER_CX + PIER_W / 2;   // x=472
  var RIGHT_HINGE = RIGHT_PIER_CX - PIER_W / 2; // x=1128
  G.CX = CX; G.TOP = TOP; G.BOT = BOT;

  // shared palette role refs (dash -ref alias + NIGHT-value fallback)
  var IRON   = 'var(--gate-iron-ref, #14171f)';
  var BRASS  = 'var(--brass-stroke-ref, #9c8350)';
  var BRIGHT = 'var(--brass-bright-ref, #cdb375)';
  var STONE  = 'var(--stone-ref, #6a7079)';
  var FLAME  = 'var(--lamp-flame-ref, #ffd27a)';
  var BODY   = 'rgba(11,14,22,.85)';   // the estate brass DARK BODY (not swapped)
  var SOFT   = 'url(#glow-soft)';

  function f1(n) { return (Math.round(n * 10) / 10); }

  /* ── a single finialled vertical bar: dark core + brass edge + collar + spear ── */
  function drawBar(S, g, bx, topY, botY) {
    // dark iron core
    S.el('line', { x1: bx, y1: topY, x2: bx, y2: botY, stroke: IRON, 'stroke-width': '4.2' }, g);
    // brass edge highlight (thin, sits slightly left = top-lit on a round bar)
    S.el('line', { x1: bx - 0.9, y1: topY, x2: bx - 0.9, y2: botY, stroke: BRASS, 'stroke-width': '1.1', opacity: '0.85' }, g);
    // a small brass collar (knop) where the bar passes the top rail
    S.el('rect', { x: bx - 3, y: topY + 16, width: 6, height: 7, rx: 1.4, fill: BODY,
      stroke: BRASS, 'stroke-width': '1' }, g);
    // spear finial near the top
    S.el('path', { d: 'M ' + (bx - 5.5) + ' ' + (topY + 2) + ' L ' + bx + ' ' + (topY - 15) +
      ' L ' + (bx + 5.5) + ' ' + (topY + 2) + ' Z', fill: BODY, stroke: BRASS, 'stroke-width': '1.1' }, g);
    // bright glint up the spear edge
    S.el('line', { x1: bx - 0.5, y1: topY - 1, x2: bx - 0.5, y2: topY - 14, stroke: BRIGHT,
      'stroke-width': '1', opacity: '0.85' }, g);
  }

  /* ── one gate leaf: wrought-iron frame, finialled bars, scroll band, stiles ──── */
  function drawLeaf(S, parent, hingeX, dir) {
    // dir = +1 (right leaf, hinge on right pier) | -1 (left leaf, hinge on left pier)
    var g = S.group(dir < 0 ? 'gate-left-leaf' : 'gate-right-leaf', parent);
    var x0 = dir < 0 ? hingeX : hingeX - HALF;   // left edge of this leaf's box
    var w = HALF;
    var x1 = x0 + w;
    var top = TOP, h = BOT - TOP;

    // rails (the cross-bars that carry the vertical bars)
    var topRail = top + 22;
    var midRail = top + 168;
    var lowRail = top + 392;
    var botRail = top + 596;

    // ── finialled vertical bars (you see the manor through them) ──
    var inset = 22;                                  // keep bars off the stiles
    var bx0 = x0 + inset, bx1 = x1 - inset;
    var nBars = 8;
    var step = (bx1 - bx0) / nBars;
    for (var i = 0; i <= nBars; i++) {
      var bx = bx0 + i * step;
      drawBar(S, g, bx, topRail, BOT);
    }

    // ── horizontal rails (dark body + brass edge + top-lit bright) ──
    var rails = [topRail, midRail, lowRail, botRail];
    for (var r = 0; r < rails.length; r++) {
      var ry = rails[r];
      S.el('rect', { x: x0 + 4, y: ry - 3.2, width: w - 8, height: 6.4, fill: BODY,
        stroke: BRASS, 'stroke-width': '1.2' }, g);
      S.el('line', { x1: x0 + 5, y1: ry - 2.6, x2: x1 - 5, y2: ry - 2.6, stroke: BRIGHT,
        'stroke-width': '1', opacity: '0.6' }, g);
    }

    // ── upper scroll register: opposed C-scrolls converging on a central
    //    heart-and-volute medallion. Disciplined, Victorian. ──
    var lc = x0 + w / 2;
    var bandTop = topRail + 6, bandBot = midRail - 6;
    var bandMid = (bandTop + bandBot) / 2;
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var ox = lc + sgn * 58;
      // upper C
      S.el('path', { d:
        'M ' + ox + ' ' + bandTop +
        ' C ' + (ox + sgn * 30) + ' ' + bandTop + ' ' + (ox + sgn * 36) + ' ' + (bandMid - 8) +
        ' ' + (ox + sgn * 8) + ' ' + (bandMid - 2) +
        ' C ' + (ox - sgn * 14) + ' ' + (bandMid + 3) + ' ' + (ox - sgn * 4) + ' ' + (bandMid - 14) +
        ' ' + ox + ' ' + (bandMid - 12),
        fill: 'none', stroke: BRASS, 'stroke-width': '2.1', opacity: '0.9', filter: SOFT }, g);
      // lower mirror C
      S.el('path', { d:
        'M ' + ox + ' ' + bandBot +
        ' C ' + (ox + sgn * 30) + ' ' + bandBot + ' ' + (ox + sgn * 36) + ' ' + (bandMid + 8) +
        ' ' + (ox + sgn * 8) + ' ' + (bandMid + 2) +
        ' C ' + (ox - sgn * 14) + ' ' + (bandMid - 3) + ' ' + (ox - sgn * 4) + ' ' + (bandMid + 14) +
        ' ' + ox + ' ' + (bandMid + 12),
        fill: 'none', stroke: BRASS, 'stroke-width': '2.1', opacity: '0.9' }, g);
    }
    // central medallion: a double ring with four radiating petal-tips + brass boss
    var mR = (bandBot - bandTop) / 2 - 2;
    S.el('circle', { cx: lc, cy: bandMid, r: mR, fill: BODY, stroke: IRON, 'stroke-width': '3.6' }, g);
    S.el('circle', { cx: lc, cy: bandMid, r: mR, fill: 'none', stroke: BRASS, 'stroke-width': '1.8', filter: SOFT }, g);
    S.el('circle', { cx: lc, cy: bandMid, r: mR * 0.62, fill: 'none', stroke: BRASS, 'stroke-width': '1.2', opacity: '0.85' }, g);
    // four small radiating petal-tips on the cardinal axes
    for (var q = 0; q < 4; q++) {
      var qa = q * Math.PI / 2;
      var px0 = lc + Math.cos(qa) * mR, py0 = bandMid + Math.sin(qa) * mR;
      var px1 = lc + Math.cos(qa) * (mR + 5), py1 = bandMid + Math.sin(qa) * (mR + 5);
      S.el('line', { x1: f1(px0), y1: f1(py0), x2: f1(px1), y2: f1(py1), stroke: BRASS, 'stroke-width': '1.6', opacity: '0.8' }, g);
      S.el('circle', { cx: f1(px1), cy: f1(py1), r: 1.6, fill: BODY, stroke: BRASS, 'stroke-width': '0.8' }, g);
    }
    // top-lit sheen on the medallion's upper arc
    S.el('path', { d: 'M ' + f1(lc - mR * 0.7) + ' ' + f1(bandMid - mR * 0.7) +
      ' A ' + f1(mR) + ' ' + f1(mR) + ' 0 0 1 ' + f1(lc + mR * 0.7) + ' ' + f1(bandMid - mR * 0.7),
      fill: 'none', stroke: BRIGHT, 'stroke-width': '1', opacity: '0.5' }, g);
    S.el('circle', { cx: lc, cy: bandMid, r: 3.4, fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    S.el('circle', { cx: lc - 1, cy: bandMid - 1, r: 1.2, fill: BRIGHT, opacity: '0.9' }, g);

    // ── a lower register: a clean symmetric anthemion (paired S-scrolls springing
    //    from a central stem) between low & bottom rail — legible, not a tangle. ──
    var lb0 = lowRail + 10, lbm = lb0 + 46;
    // central stem rising from the bottom rail toward a small brass bud
    S.el('line', { x1: lc, y1: botRail - 4, x2: lc, y2: lbm - 10, stroke: BRASS, 'stroke-width': '1.8', opacity: '0.85' }, g);
    S.el('circle', { cx: lc, cy: lbm - 13, r: 3, fill: BODY, stroke: BRASS, 'stroke-width': '1.1' }, g);
    S.el('circle', { cx: lc - 0.8, cy: lbm - 13.8, r: 1, fill: BRIGHT, opacity: '0.85' }, g);
    for (var sg2 = -1; sg2 <= 1; sg2 += 2) {
      // an S-scroll curling outward then back — mirrored about the leaf center
      S.el('path', { d:
        'M ' + lc + ' ' + (lbm - 6) +
        ' C ' + (lc + sg2 * 26) + ' ' + (lbm - 6) + ' ' + (lc + sg2 * 40) + ' ' + lb0 +
        ' ' + (lc + sg2 * 34) + ' ' + (lb0 + 16) +
        ' C ' + (lc + sg2 * 30) + ' ' + (lb0 + 28) + ' ' + (lc + sg2 * 18) + ' ' + (lb0 + 22) +
        ' ' + (lc + sg2 * 22) + ' ' + (lb0 + 14),
        fill: 'none', stroke: BRASS, 'stroke-width': '1.9', opacity: '0.85' }, g);
    }

    // ── HEAVY edge stiles (outer hinge stile + inner meeting stile), drawn LAST so
    //    they read as solid forged bars framing the openwork. ──
    var stileW = 14;
    var osx = (dir < 0) ? x0 : x1 - stileW;                 // outer (hinge) stile
    S.el('rect', { x: osx, y: top, width: stileW, height: h, fill: BODY, stroke: BRASS, 'stroke-width': '1.6' }, g);
    S.el('line', { x1: osx + 1.6, y1: top + 1, x2: osx + 1.6, y2: BOT, stroke: BRIGHT, 'stroke-width': '1', opacity: '0.55' }, g);
    var isx = (dir < 0) ? x1 - stileW : x0;                 // inner (meeting/seam) stile
    S.el('rect', { x: isx, y: top, width: stileW, height: h, fill: BODY, stroke: BRASS, 'stroke-width': '1.6' }, g);
    S.el('line', { x1: isx + 1.6, y1: top + 1, x2: isx + 1.6, y2: BOT, stroke: BRIGHT, 'stroke-width': '1', opacity: '0.45' }, g);
    // rivet bosses up the outer stile (forged detail)
    for (var rv = top + 40; rv < BOT - 40; rv += 150) {
      S.el('circle', { cx: osx + stileW / 2, cy: rv, r: 2, fill: BODY, stroke: BRASS, 'stroke-width': '0.9' }, g);
      S.el('circle', { cx: osx + stileW / 2 - 0.6, cy: rv - 0.6, r: 0.7, fill: BRIGHT, opacity: '0.8' }, g);
    }
    // continuous bright top edge along the leaf top
    S.el('line', { x1: x0 + 2, y1: top + 1, x2: x1 - 2, y2: top + 1, stroke: BRIGHT, 'stroke-width': '1.2', opacity: '0.5' }, g);

    // hinge = OUTER pier edge → scaleX foreshorten about that edge.
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = (dir < 0 ? '0% 0%' : '100% 0%');
    return g;
  }

  /* ── the arched / scrolled CREST: flattened-gothic arch + sunburst tympanum +
     volute springer scrolls + central orb-and-spire finial. Static. ──────────── */
  function drawCrest(S, parent) {
    var g = S.group('gate-crest', parent);
    var span = RIGHT_HINGE - LEFT_HINGE;
    var L = LEFT_HINGE, R = RIGHT_HINGE;
    var baseY = TOP - 4;
    var peak = TOP - 86;

    var archUp = 'M ' + L + ' ' + baseY +
      ' C ' + (L + span * 0.18) + ' ' + (peak + 8) + ' ' + (CX - span * 0.16) + ' ' + peak + ' ' + CX + ' ' + peak +
      ' C ' + (CX + span * 0.16) + ' ' + peak + ' ' + (R - span * 0.18) + ' ' + (peak + 8) + ' ' + R + ' ' + baseY;
    var chordY = baseY - 2;
    // tympanum field
    S.el('path', { d: archUp + ' L ' + R + ' ' + chordY + ' L ' + L + ' ' + chordY + ' Z',
      fill: 'rgba(11,14,22,.55)' }, g);

    // sunburst rays from the finial base down into the tympanum
    var burstY = peak + 6;
    for (var ray = -5; ray <= 5; ray++) {
      var t = ray / 5;
      var rx = CX + t * span * 0.40;
      var ryEnd = chordY - 4 - (1 - Math.abs(t)) * 16;
      S.el('line', { x1: CX, y1: burstY, x2: f1(rx), y2: f1(ryEnd), stroke: BRASS,
        'stroke-width': (ray === 0 ? '1.6' : '1'), opacity: (0.28 + 0.20 * (1 - Math.abs(t))) }, g);
    }

    // the arch sweep: dark body band + brass stroke + top-lit crown sheen
    S.el('path', { d: archUp, fill: 'none', stroke: IRON, 'stroke-width': '8' }, g);
    S.el('path', { d: archUp, fill: 'none', stroke: BRASS, 'stroke-width': '2.6', filter: SOFT }, g);
    S.el('path', { d: 'M ' + (CX - span * 0.20) + ' ' + (peak + 1) + ' Q ' + CX + ' ' + (peak - 3) +
      ' ' + (CX + span * 0.20) + ' ' + (peak + 1), fill: 'none', stroke: BRIGHT, 'stroke-width': '1.6', opacity: '0.7' }, g);

    // springer volute scrolls under each side of the arch
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var sxp = CX + sgn * span * 0.32;
      S.el('path', { d:
        'M ' + sxp + ' ' + (peak + 30) +
        ' C ' + (sxp + sgn * 44) + ' ' + (peak + 26) + ' ' + (sxp + sgn * 50) + ' ' + (peak + 64) +
        ' ' + (sxp + sgn * 18) + ' ' + (peak + 70) +
        ' C ' + (sxp - sgn * 6) + ' ' + (peak + 74) + ' ' + (sxp + sgn * 6) + ' ' + (peak + 52) +
        ' ' + (sxp + sgn * 2) + ' ' + (peak + 54),
        fill: 'none', stroke: BRASS, 'stroke-width': '2.2', opacity: '0.88' }, g);
    }

    // central orb-and-spire finial
    S.el('line', { x1: CX, y1: burstY, x2: CX, y2: peak - 30, stroke: BRASS, 'stroke-width': '2.6' }, g);
    S.el('circle', { cx: CX, cy: peak - 36, r: 7.5, fill: BODY, stroke: BRASS, 'stroke-width': '1.8' }, g);
    S.el('circle', { cx: CX, cy: peak - 36, r: 7.5, fill: 'none', stroke: BRASS, 'stroke-width': '1', opacity: '0.6', filter: SOFT }, g);
    S.el('circle', { cx: CX - 2.4, cy: peak - 38.4, r: 2, fill: BRIGHT, opacity: '0.9' }, g);
    S.el('path', { d: 'M ' + (CX - 4.5) + ' ' + (peak - 42) + ' L ' + CX + ' ' + (peak - 60) +
      ' L ' + (CX + 4.5) + ' ' + (peak - 42) + ' Z', fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('line', { x1: CX - 0.6, y1: peak - 43, x2: CX - 0.6, y2: peak - 58, stroke: BRIGHT, 'stroke-width': '1', opacity: '0.85' }, g);
    return g;
  }

  /* ── a PIER: stacked-stone column + stepped brass cap + an EMISSIVE brass lantern
     holding a glass globe (the night payoff) + finial. ───────────────────────── */
  function drawPier(S, parent, cx) {
    var g = S.group(null, parent);
    var hw = PIER_W / 2;
    var capY = TOP - 24;
    var bodyTop = capY + 4;

    // column body (stacked stone)
    S.el('rect', { x: cx - hw, y: bodyTop, width: PIER_W, height: BOT - bodyTop,
      fill: STONE, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // masonry courses + faint mortar
    for (var cy = bodyTop + 72; cy < BOT; cy += 72) {
      S.el('line', { x1: cx - hw, y1: cy, x2: cx + hw, y2: cy, stroke: 'rgba(0,0,0,.32)', 'stroke-width': '1.4' }, g);
      S.el('line', { x1: cx - hw, y1: cy + 1.4, x2: cx + hw, y2: cy + 1.4, stroke: 'rgba(255,255,255,.05)', 'stroke-width': '1' }, g);
    }
    // recessed center panel (light catch)
    S.el('rect', { x: cx - hw + 12, y: bodyTop + 30, width: PIER_W - 24, height: BOT - bodyTop - 96,
      fill: 'rgba(0,0,0,.10)', stroke: 'rgba(0,0,0,.24)', 'stroke-width': '1.2' }, g);
    // left-edge top-lit sheen
    S.el('line', { x1: cx - hw + 1.6, y1: bodyTop, x2: cx - hw + 1.6, y2: BOT, stroke: BRIGHT, 'stroke-width': '1.4', opacity: '0.20' }, g);

    // warm LANTERN-WASH pooling down the upper pier stone (grafted from Take 3 —
    // adds dimensionality; EMISSIVE FLAME so it warms the stone at night and
    // recedes in day). Sits under the cap, fading downward.
    S.el('rect', { x: cx - hw, y: bodyTop, width: PIER_W, height: 150, fill: FLAME, opacity: '0.10', filter: SOFT }, g);

    // stepped brass CAP — three courses
    S.el('rect', { x: cx - hw - 6, y: capY, width: PIER_W + 12, height: 14, fill: STONE, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('rect', { x: cx - hw - 12, y: capY - 11, width: PIER_W + 24, height: 11, fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('rect', { x: cx - hw - 16, y: capY - 22, width: PIER_W + 32, height: 11, rx: 2, fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('line', { x1: cx - hw - 14, y1: capY - 21, x2: cx + hw + 14, y2: capY - 21, stroke: BRIGHT, 'stroke-width': '1.3', opacity: '0.6' }, g);

    // ── brass LANTERN base + cage on the cap ──
    var lampBaseY = capY - 22;
    S.el('rect', { x: cx - 11, y: lampBaseY - 16, width: 22, height: 16, rx: 2, fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('line', { x1: cx - 11, y1: lampBaseY - 15, x2: cx + 11, y2: lampBaseY - 15, stroke: BRIGHT, 'stroke-width': '1', opacity: '0.5' }, g);

    var globeY = lampBaseY - 30;
    // ── EMISSIVE lamp globe (palette-IMMUNE — BLAZES at night). Layered halos. ──
    S.el('circle', { cx: cx, cy: globeY, r: 34, fill: FLAME, opacity: '0.16', filter: SOFT }, g);
    S.el('circle', { cx: cx, cy: globeY, r: 20, fill: FLAME, opacity: '0.34', filter: SOFT }, g);
    // lantern cage uprights around the globe
    S.el('path', { d: 'M ' + (cx - 9) + ' ' + (lampBaseY - 16) + ' L ' + (cx - 7) + ' ' + (globeY - 11) +
      ' M ' + (cx + 9) + ' ' + (lampBaseY - 16) + ' L ' + (cx + 7) + ' ' + (globeY - 11),
      fill: 'none', stroke: BRASS, 'stroke-width': '1.3' }, g);
    // glass globe (emissive fill + brass rim)
    S.el('circle', { cx: cx, cy: globeY, r: 10, fill: FLAME, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // bright hot core
    S.el('circle', { cx: cx, cy: globeY, r: 4.4, fill: '#fff3d6', opacity: '0.95' }, g);
    // glass specular bead
    S.el('circle', { cx: cx - 3.2, cy: globeY - 3.2, r: 1.8, fill: '#ffffff', opacity: '0.85' }, g);
    // lantern cap + finial spike
    S.el('path', { d: 'M ' + (cx - 8) + ' ' + (globeY - 10) + ' L ' + cx + ' ' + (globeY - 18) +
      ' L ' + (cx + 8) + ' ' + (globeY - 10) + ' Z', fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    S.el('line', { x1: cx, y1: globeY - 18, x2: cx, y2: globeY - 27, stroke: BRASS, 'stroke-width': '2' }, g);
    S.el('circle', { cx: cx, cy: globeY - 29, r: 2.4, fill: BRIGHT }, g);
    return g;
  }

  /* ── a clockwork gear (toothed disc) — cut teeth, beveled hub, spokes, sheen ─── */
  function drawGear(S, parent, cx, cy, rOuter, teeth) {
    var g = S.group(null, parent);
    var rPitch = rOuter * 0.82, rInner = rOuter * 0.70, rHub = rOuter * 0.30;

    // trapezoidal cut teeth ring
    var pts = [];
    for (var i = 0; i < teeth; i++) {
      var a0 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
      var stepA = (Math.PI * 2) / teeth;
      var aw = stepA * 0.30;     // tooth top half-width
      var ar = stepA * 0.46;     // tooth root half-width
      pts.push([cx + Math.cos(a0 - ar) * rInner, cy + Math.sin(a0 - ar) * rInner]);
      pts.push([cx + Math.cos(a0 - aw) * rOuter, cy + Math.sin(a0 - aw) * rOuter]);
      pts.push([cx + Math.cos(a0 + aw) * rOuter, cy + Math.sin(a0 + aw) * rOuter]);
      pts.push([cx + Math.cos(a0 + ar) * rInner, cy + Math.sin(a0 + ar) * rInner]);
    }
    var ps = pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ');
    S.el('polygon', { points: ps, fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // pitch-circle rim
    S.el('circle', { cx: cx, cy: cy, r: f1(rPitch), fill: 'none', stroke: BRASS, 'stroke-width': '1', opacity: '0.8' }, g);

    // spokes (4): dark bar + brass center line
    for (var s = 0; s < 4; s++) {
      var aa = (s / 4) * Math.PI * 2 + Math.PI / 4;
      var ix = cx + Math.cos(aa) * rHub, iy = cy + Math.sin(aa) * rHub;
      var ox = cx + Math.cos(aa) * rInner * 0.92, oy = cy + Math.sin(aa) * rInner * 0.92;
      S.el('line', { x1: f1(ix), y1: f1(iy), x2: f1(ox), y2: f1(oy), stroke: IRON, 'stroke-width': '3.4' }, g);
      S.el('line', { x1: f1(ix), y1: f1(iy), x2: f1(ox), y2: f1(oy), stroke: BRASS, 'stroke-width': '1.1', opacity: '0.85' }, g);
    }
    // hub
    S.el('circle', { cx: cx, cy: cy, r: f1(rHub), fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    S.el('circle', { cx: cx, cy: cy, r: f1(rHub * 0.4), fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    // top-left sheen arc (lit from above)
    S.el('path', { d: 'M ' + f1(cx - rPitch * 0.62) + ' ' + f1(cy - rPitch * 0.52) +
      ' A ' + f1(rPitch) + ' ' + f1(rPitch) + ' 0 0 1 ' + f1(cx + rPitch * 0.10) + ' ' + f1(cy - rPitch * 0.82),
      fill: 'none', stroke: BRIGHT, 'stroke-width': '1.4', opacity: '0.55', filter: SOFT }, g);
    // hub top glint
    S.el('circle', { cx: cx - rHub * 0.35, cy: cy - rHub * 0.4, r: 1.6, fill: BRIGHT, opacity: '0.85' }, g);

    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = '50% 50%';
    return g;
  }

  /* ── the SUNDIAL gnomon: brass dial + hour marks + raised blade + shadow
     (tap target → time-of-day cycle). ──────────────────────────────────────── */
  function drawGnomon(S, parent, cx, cy) {
    var g = S.group('gnomon-target', parent);
    var R = 38;
    S.el('circle', { cx: cx, cy: cy, r: R + 8, fill: 'transparent' }, g);
    S.el('circle', { cx: cx, cy: cy, r: R, fill: 'rgba(11,14,22,.9)', stroke: BRASS, 'stroke-width': '2.2' }, g);
    S.el('circle', { cx: cx, cy: cy, r: R - 4, fill: 'none', stroke: BRASS, 'stroke-width': '0.9', opacity: '0.55' }, g);
    // bright top-lit rim arc
    S.el('path', { d: 'M ' + f1(cx - R * 0.7) + ' ' + f1(cy - R * 0.7) +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + f1(cx + R * 0.7) + ' ' + f1(cy - R * 0.7),
      fill: 'none', stroke: BRIGHT, 'stroke-width': '1.4', opacity: '0.5' }, g);
    // hour marks
    for (var hm = 0; hm < 12; hm++) {
      var a = (hm / 12) * Math.PI * 2 - Math.PI / 2;
      var inner = (hm % 3 === 0) ? R - 10 : R - 6;
      S.el('line', {
        x1: f1(cx + Math.cos(a) * inner), y1: f1(cy + Math.sin(a) * inner),
        x2: f1(cx + Math.cos(a) * (R - 3)), y2: f1(cy + Math.sin(a) * (R - 3)),
        stroke: BRASS, 'stroke-width': (hm % 3 === 0) ? '2.2' : '1.1', opacity: '0.9' }, g);
    }
    // cast shadow
    S.el('path', { d: 'M ' + cx + ' ' + (cy + 4) + ' L ' + f1(cx - R * 0.62) + ' ' + f1(cy + R * 0.30) +
      ' L ' + f1(cx - R * 0.40) + ' ' + f1(cy + R * 0.42) + ' Z', fill: 'rgba(0,0,0,.45)' }, g);
    // raised blade
    S.el('path', { d: 'M ' + (cx - 2) + ' ' + (cy + 6) + ' L ' + f1(cx + R * 0.66) + ' ' + (cy + 6) +
      ' L ' + (cx - 2) + ' ' + f1(cy - R * 0.7) + ' Z',
      fill: '#e6bd6f', stroke: BRASS, 'stroke-width': '1.2' }, g);
    S.el('line', { x1: cx - 2, y1: cy + 6, x2: cx - 2, y2: f1(cy - R * 0.7), stroke: BRIGHT, 'stroke-width': '1.2', opacity: '0.85' }, g);
    // center boss
    S.el('circle', { cx: cx, cy: cy + 4, r: 3, fill: 'rgba(11,14,22,.9)', stroke: BRASS, 'stroke-width': '1' }, g);
    // pulsing hint glow
    var hint = S.el('circle', { cx: cx, cy: cy, r: R + 4, fill: 'none', stroke: BRIGHT,
      'stroke-width': '1.2', opacity: '0.0', filter: SOFT }, g);
    hint.setAttribute('class', 'gnomon-hint');
    return g;
  }

  /* ── the engraved brass plaque (nameplate / wordmark logo) ──────────────────── */
  function drawPlaque(S, parent) {
    var g = S.group('plaque', parent);
    var px = CX, py = 720, w = 300, h = 90;
    var x0 = px - w / 2, y0 = py - h / 2;
    S.el('rect', { x: x0, y: y0, width: w, height: h, rx: 7, fill: 'rgba(11,14,22,.9)', stroke: BRASS, 'stroke-width': '2.2' }, g);
    S.el('rect', { x: x0 + 7, y: y0 + 7, width: w - 14, height: h - 14, rx: 4, fill: 'none', stroke: BRASS, 'stroke-width': '1', opacity: '0.5' }, g);
    S.el('line', { x1: x0 + 6, y1: y0 + 3.5, x2: x0 + w - 6, y2: y0 + 3.5, stroke: BRIGHT, 'stroke-width': '1.2', opacity: '0.6' }, g);
    // corner rosette bosses
    var cs = [[x0 + 12, y0 + 12], [x0 + w - 12, y0 + 12], [x0 + 12, y0 + h - 12], [x0 + w - 12, y0 + h - 12]];
    for (var c = 0; c < cs.length; c++) {
      S.el('circle', { cx: cs[c][0], cy: cs[c][1], r: 2.4, fill: BODY, stroke: BRASS, 'stroke-width': '0.9' }, g);
      S.el('circle', { cx: cs[c][0] - 0.6, cy: cs[c][1] - 0.6, r: 0.8, fill: BRIGHT, opacity: '0.8' }, g);
    }
    var t1 = S.el('text', { x: px, y: py - 6, 'text-anchor': 'middle',
      'font-family': 'Georgia, serif', 'font-weight': '500', 'font-size': '32', fill: BRIGHT }, g);
    t1.textContent = 'The Orrery Estate';
    var t2 = S.el('text', { x: px, y: py + 24, 'text-anchor': 'middle',
      'font-family': 'ui-monospace, monospace', 'font-size': '13', 'letter-spacing': '0.28em', fill: BRASS }, g);
    t2.textContent = 'CLICK TO OPEN';
    return g;
  }

  /* ── drawGate: assemble the whole gate into a layer <g>. ─────────────────────── */
  G.drawGate = function (parent, S) {
    var g = S.group('gate-assembly', parent);

    var leftLeaf = drawLeaf(S, g, LEFT_HINGE, -1);
    var rightLeaf = drawLeaf(S, g, RIGHT_HINGE, +1);
    S.refs.leftLeaf = leftLeaf;
    S.refs.rightLeaf = rightLeaf;

    // ── seam ornaments RIDE the right leaf ──────────────────────────────────
    // The gear-train, gnomon, and plaque are mounted at the seam. They must swing
    // open WITH a door, not hang floating in the gap. We park them in a follow
    // group that gets the SAME foreshorten transform as the right leaf (swing()).
    // Its transform-origin is pinned to the right hinge in view-box coords so the
    // pivot matches the leaf exactly, regardless of the group's own bounding box —
    // and because the gears keep their OWN inner rotate (spin), the spin and the
    // swing compose cleanly (parent foreshorten × child rotate).
    var seamFollow = S.group('gate-seam', g);
    seamFollow.style.transformBox = 'view-box';
    seamFollow.style.transformOrigin = RIGHT_HINGE + 'px ' + TOP + 'px';   // 1128,232
    S.refs.seamFollow = seamFollow;

    // central clockwork gear-train straddling the SEAM (rides the right leaf).
    // GY nudges the whole cluster DOWN so the train clears the manor's lower
    // window band (judges' fix (a)) while staying clear of the plaque below.
    var GY = 16;
    var driverY = 470 + GY;
    var gears = S.group('gears', seamFollow);
    drawGear(S, gears, CX, driverY, 72, 22);    // big driver
    // ── self-lit SUN-GEAR at the heart of the driver (the orrery payoff, grafted
    //    from Take 3). EMISSIVE FLAME role → BLAZES at night, recedes in day via
    //    dayRecede(lamp.flame). Drawn BEFORE the meshing train so the surrounding
    //    gears overlap its halo edge and it nests in the cluster, never washing
    //    out the manor behind it. ──
    S.el('circle', { cx: CX, cy: driverY, r: 24, fill: FLAME, opacity: '0.14', filter: SOFT }, gears);
    S.el('circle', { cx: CX, cy: driverY, r: 14, fill: FLAME, opacity: '0.55', filter: SOFT }, gears);
    S.el('circle', { cx: CX, cy: driverY, r: 11, fill: FLAME, opacity: '0.9', stroke: BRASS, 'stroke-width': '1.4' }, gears);
    S.el('circle', { cx: CX, cy: driverY, r: 5, fill: '#fff3d6' }, gears);
    S.el('circle', { cx: CX - 2, cy: driverY - 2, r: 1.8, fill: '#ffffff', opacity: '0.9' }, gears);
    // the meshing train fanning out around the driver
    drawGear(S, gears, CX - 84, 548 + GY, 44, 15);
    drawGear(S, gears, CX + 80, 544 + GY, 50, 16);
    drawGear(S, gears, CX + 10, 372 + GY, 34, 12);
    drawGear(S, gears, CX - 70, 410 + GY, 26, 11);
    gears.style.transformBox = 'fill-box';
    gears.style.transformOrigin = '50% 50%';
    S.refs.gears = gears;

    // the SUNDIAL gnomon among the gears (tap → time-of-day); rides the right leaf
    var gnomon = drawGnomon(S, seamFollow, CX - 2, 632);
    S.refs.gnomon = gnomon;

    // the plaque — also a seam ornament, so it rides the right leaf with the gears.
    // (Drawn here, INTO the follow group, before the crest/piers; it doesn't overlap
    // them, so the visible stacking is unchanged from drawing it last.)
    drawPlaque(S, seamFollow);

    // the ornate arched CREST across the seam (static crown)
    drawCrest(S, g);

    // piers OUTSIDE the leaves (drawn last so solid stone overlaps hinge edges +
    // the lamp-globes sit clearly on top)
    drawPier(S, g, LEFT_PIER_CX);
    drawPier(S, g, RIGHT_PIER_CX);

    return g;
  };

  /* ── swing(openFrac): open the leaves on their VERTICAL pier hinges. ────────── */
  G.swing = function (openFrac, S) {
    var f = Math.max(0, Math.min(1, openFrac));
    var ang = (80 * Math.PI / 180) * f;
    var sx = Math.cos(ang);
    var skew = 4 * f;
    if (S.refs.leftLeaf)  S.refs.leftLeaf.style.transform  = 'scaleX(' + sx.toFixed(4) + ') skewY(' + (skew).toFixed(2) + 'deg)';
    if (S.refs.rightLeaf) S.refs.rightLeaf.style.transform = 'scaleX(' + sx.toFixed(4) + ') skewY(' + (-skew).toFixed(2) + 'deg)';
    // the seam ornaments (gears + gnomon + plaque) ride the RIGHT leaf: same
    // foreshorten, same pivot (right hinge) — so they swing open with the door
    // instead of floating in the gap. Their own inner transforms (gear spin) compose.
    if (S.refs.seamFollow) S.refs.seamFollow.style.transform = 'scaleX(' + sx.toFixed(4) + ') skewY(' + (-skew).toFixed(2) + 'deg)';
  };

  /* ── spinGears(turns): rotate the gear cluster by `turns` revolutions. ─────── */
  G.spinGears = function (turns, S) {
    if (S.refs.gears) S.refs.gears.style.transform = 'rotate(' + (turns * 360) + 'deg)';
  };

  Gate.scenegate = G;

  if (typeof module !== 'undefined' && module.exports) { module.exports = G; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
