/* ═══════════════════════════════════════════════════════════════════════════
   scene-gate.js  —  the brass double gate assembly  (window.Gate.scenegate)

   The foreground hero: a brass DOUBLE gate (two leaves, closed), clockwork gears
   on its face, a small brass GNOMON among the gears (tap → time-of-day cycle), and
   an engraved brass plaque "The Orrery Estate" / "click to enter". You see the
   grounds + manor THROUGH the bars; the road passes through the gate's center.

   GREYBOX: rough but correctly composed + the swing/turn MACHINERY is real.
   Brass idiom: dark body rgba(11,14,22,.85) + brass stroke var(--brass-stroke-ref)
   + warm glow + var(--brass-bright-ref) top-edge highlights. The leaves hinge on
   the OUTER edges and swing OUTWARD (left leaf rotates about its left pier, right
   leaf about its right pier).

   Refs published for the sequence animation:
     S.refs.leftLeaf, S.refs.rightLeaf  — the swinging <g> groups (transform-box
       set so rotate() pivots at the hinge), S.refs.gears (the spinning gear group),
       S.refs.gnomon (the tap target).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var G = {};

  // gate geometry within the 1600×900 viewBox: centered, foreground, tall.
  // The opening spans x ~ 600..1000; piers just outside; leaves meet at x=800.
  var CX = 800;          // center seam
  var TOP = 300;         // top of the leaves
  var BOT = 900;         // gate runs off the bottom edge (foreground)
  var HALF = 200;        // each leaf half-width (so leaves span 600..1000)
  var PIER_W = 44;

  function brass(S, parent, attrs) {
    attrs.fill = attrs.fill || 'rgba(11,14,22,.85)';
    attrs.stroke = 'var(--brass-stroke-ref, #c9a24a)';
    attrs['stroke-width'] = attrs['stroke-width'] || '1.4';
    return S.el(attrs._tag || 'rect', attrs, parent);
  }

  /* ── one gate leaf: a brass frame with vertical bars + a few horizontal rails ── */
  function drawLeaf(S, parent, hingeX, dir) {
    // dir = +1 (right leaf, hinge on right pier) | -1 (left leaf, hinge on left pier)
    var g = S.group(dir < 0 ? 'gate-left-leaf' : 'gate-right-leaf', parent);
    var x0 = dir < 0 ? hingeX : hingeX - HALF;   // left edge of this leaf's box
    var w = HALF;
    var top = TOP, h = BOT - TOP;

    // outer frame
    S.el('rect', { x: x0, y: top, width: w, height: h, fill: 'rgba(11,14,22,.55)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '3' }, g);
    // top-edge brass-bright sheen
    S.el('line', { x1: x0 + 2, y1: top + 2, x2: x0 + w - 2, y2: top + 2,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.6' }, g);

    // vertical bars (you see the grounds through them)
    var bars = 7;
    for (var i = 1; i < bars; i++) {
      var bx = x0 + i * (w / bars);
      S.el('line', { x1: bx, y1: top + 6, x2: bx, y2: BOT, stroke: 'var(--gate-iron-ref, #14171f)', 'stroke-width': '3' }, g);
      S.el('line', { x1: bx, y1: top + 6, x2: bx, y2: BOT, stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1', opacity: '0.7' }, g);
      // spear finial near the top
      S.el('path', { d: 'M ' + (bx - 4) + ' ' + (top + 6) + ' L ' + bx + ' ' + (top - 8) + ' L ' + (bx + 4) + ' ' + (top + 6) + ' Z',
        fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    }
    // horizontal rails
    var rails = [top + 120, top + 320, top + 500];
    for (var r = 0; r < rails.length; r++) {
      S.el('line', { x1: x0 + 2, y1: rails[r], x2: x0 + w - 2, y2: rails[r],
        stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2.2', opacity: '0.85' }, g);
    }

    // set the hinge as the transform pivot (SVG transform-box + transform-origin)
    g.style.transformBox = 'fill-box';
    // hinge on the OUTER edge: right leaf pivots at its right edge → origin 100% 0;
    // left leaf pivots at its left edge → origin 0% 0.
    g.style.transformOrigin = (dir < 0 ? '0% 0%' : '100% 0%');
    return g;
  }

  /* ── a pier (stone column) flanking each side ───────────────────────────────── */
  function drawPier(S, parent, cx) {
    var g = S.group(null, parent);
    S.el('rect', { x: cx - PIER_W / 2, y: TOP - 40, width: PIER_W, height: BOT - TOP + 40,
      fill: 'var(--stone-ref, #6a7079)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // cap
    S.el('rect', { x: cx - PIER_W / 2 - 6, y: TOP - 54, width: PIER_W + 12, height: 16,
      fill: 'var(--stone-ref, #6a7079)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // a brass finial orb on top
    S.el('circle', { cx: cx, cy: TOP - 62, r: 8, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    S.el('circle', { cx: cx - 2, cy: TOP - 64, r: 2.5, fill: 'var(--brass-bright-ref, #f0d489)', opacity: '0.7' }, g);
    // top-lit edge
    S.el('line', { x1: cx - PIER_W / 2, y1: TOP - 40, x2: cx + PIER_W / 2, y2: TOP - 40,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.35' }, g);
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
    S.el('circle', { cx: cx - rOuter * 0.3, cy: cy - rOuter * 0.5, r: 2, fill: 'var(--brass-bright-ref, #f0d489)', opacity: '0.7' }, g);
    // pivot at center so the sequence can spin it
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = '50% 50%';
    return g;
  }

  /* ── the gnomon: a small brass triangular gnomon (tap target) ───────────────── */
  function drawGnomon(S, parent, cx, cy) {
    var g = S.group('gnomon-target', parent);
    // generous invisible hit-target
    S.el('circle', { cx: cx, cy: cy, r: 30, fill: 'transparent' }, g);
    // base dial ring
    S.el('circle', { cx: cx, cy: cy + 8, r: 18, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    // the gnomon style (a right-triangle blade) — brass furniture color
    S.el('path', { d: 'M ' + (cx - 12) + ' ' + (cy + 8) + ' L ' + (cx + 12) + ' ' + (cy + 8) +
      ' L ' + (cx + 12) + ' ' + (cy - 16) + ' Z', fill: '#e6bd6f',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // top-edge bright
    S.el('line', { x1: cx - 12, y1: cy + 8, x2: cx + 12, y2: cy - 16,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.7' }, g);
    // a soft pulsing hint glow so the tap target is discoverable
    var hint = S.el('circle', { cx: cx, cy: cy, r: 24, fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.0', filter: 'url(#glow-soft)' }, g);
    hint.setAttribute('class', 'gnomon-hint');
    return g;
  }

  /* ── the engraved brass plaque ──────────────────────────────────────────────── */
  function drawPlaque(S, parent) {
    var g = S.group('plaque', parent);
    var px = CX, py = 720, w = 280, h = 86;
    S.el('rect', { x: px - w / 2, y: py - h / 2, width: w, height: h, rx: 6,
      fill: 'rgba(11,14,22,.9)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2' }, g);
    // top-edge bright
    S.el('line', { x1: px - w / 2 + 4, y1: py - h / 2 + 3, x2: px + w / 2 - 4, y2: py - h / 2 + 3,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.55' }, g);
    var t1 = S.el('text', { x: px, y: py - 6, 'text-anchor': 'middle',
      'font-family': 'Georgia, serif', 'font-weight': '500', 'font-size': '30',
      fill: 'var(--brass-bright-ref, #f0d489)' }, g);
    t1.textContent = 'The Orrery Estate';
    var t2 = S.el('text', { x: px, y: py + 22, 'text-anchor': 'middle',
      'font-family': 'ui-monospace, monospace', 'font-size': '13', 'letter-spacing': '0.28em',
      fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    t2.textContent = 'CLICK TO ENTER';
    return g;
  }

  /* ── drawGate: assemble the whole gate into a layer <g>. ─────────────────────── */
  G.drawGate = function (parent, S) {
    var g = S.group('gate-assembly', parent);

    // piers (behind the leaves' hinge edges)
    drawPier(S, g, CX - HALF - PIER_W / 2 + 6);   // left pier ~ x 578
    drawPier(S, g, CX + HALF + PIER_W / 2 - 6);   // right pier ~ x 1022

    // the two leaves (closed: left fills 600..800, right fills 800..1000)
    var leftLeaf = drawLeaf(S, g, CX - HALF, -1);  // hinge at x=600 (left edge)
    var rightLeaf = drawLeaf(S, g, CX + HALF, +1); // hinge at x=1000 (right edge)
    S.refs.leftLeaf = leftLeaf;
    S.refs.rightLeaf = rightLeaf;

    // central clockwork cluster ON the gate face (over the seam)
    var gears = S.group('gears', g);
    drawGear(S, gears, CX, 470, 64, 16);
    drawGear(S, gears, CX - 70, 540, 40, 12);
    drawGear(S, gears, CX + 66, 538, 46, 13);
    drawGear(S, gears, CX + 8, 400, 30, 10);
    S.refs.gears = gears;

    // the gnomon among the gears
    var gnomon = drawGnomon(S, g, CX - 4, 612);
    S.refs.gnomon = gnomon;

    // the plaque
    drawPlaque(S, g);

    return g;
  };

  /* ── swing(openFrac): set the leaves' rotation. openFrac 0=closed, 1=full open.
     Outward swing: left leaf rotates negative (counter-clockwise opening left),
     right leaf positive. Used by the sequence's swing tween. ─────────────────── */
  G.swing = function (openFrac, S) {
    var deg = 78 * Math.max(0, Math.min(1, openFrac));
    if (S.refs.leftLeaf) S.refs.leftLeaf.style.transform = 'rotate(' + (-deg) + 'deg)';
    if (S.refs.rightLeaf) S.refs.rightLeaf.style.transform = 'rotate(' + (deg) + 'deg)';
  };

  /* ── spinGears(turns): rotate the whole gear cluster by `turns` revolutions. ── */
  G.spinGears = function (turns, S) {
    if (S.refs.gears) S.refs.gears.style.transform = 'rotate(' + (turns * 360) + 'deg)';
  };

  Gate.scenegate = G;

  if (typeof module !== 'undefined' && module.exports) { module.exports = G; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
