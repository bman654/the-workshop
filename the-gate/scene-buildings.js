/* ═══════════════════════════════════════════════════════════════════════════
   scene-buildings.js  —  rough front-elevations  (window.Gate.scenebuildings)

   GREYBOX buildings. The estate's draw* helpers are TOP-DOWN floorplans (reference
   only) — these are FRESH FRONT-ELEVATIONS authored for the gate scene. Rough on
   purpose: they establish each building's bounding box / anchor / scale /
   perspective so the foundry (Phase C) can render final art into the same boxes.

   All shapes are palette-swappable (fill="var(--role-ref)"); windows are emissive
   (var(--window-lit-ref), palette-immune) so they glow at night. "Lit from above"
   = top-edge brass-bright highlights.

   Three buildings, per the reference composition:
     • Observatory on a hill  — LEFT
     • Manor house            — CENTER (distant, beyond the gate)
     • Greenhouse             — RIGHT
   Each draw fn takes (parent <g>, S) where S = Gate.scene (helpers + viewBox).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var B = {};

  function litWindow(S, parent, x, y, w, h) {
    S.el('rect', { x: x, y: y, width: w, height: h, rx: 1,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.92' }, parent);
    // soft halo so it reads as a light source at night
    S.el('rect', { x: x - 3, y: y - 3, width: w + 6, height: h + 6, rx: 2,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.18', filter: 'url(#glow-soft)' }, parent);
  }

  /* ── LEFT: a hill with a black/brass observatory on top (the Observatory Rise) ─ */
  B.drawHillAndObservatory = function (parent, S) {
    var g = S.group('observatory-rise', parent);
    // the hill — a soft mound rising on the left, peak ~x230,y300
    S.el('path', { d: 'M -40 480 Q 120 300 320 330 Q 460 350 540 480 Z',
      fill: 'var(--hill-ref, #2c3742)' }, g);
    // top-edge grass highlight
    S.el('path', { d: 'M -40 480 Q 120 300 320 330 Q 460 350 540 480',
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.12' }, g);

    // observatory building atop the hill, around x=210, base y=360
    var ox = 210, oy = 360;
    // tower body (dark, brass-stroked)
    S.el('rect', { x: ox - 42, y: oy - 70, width: 84, height: 70, fill: 'var(--observatory-body-ref, #181c26)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    // dome
    S.el('path', { d: 'M ' + (ox - 46) + ' ' + (oy - 70) + ' A 46 40 0 0 1 ' + (ox + 46) + ' ' + (oy - 70) + ' Z',
      fill: 'var(--observatory-dome-ref, #3a4250)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    // dome top-edge brass sheen
    S.el('path', { d: 'M ' + (ox - 30) + ' ' + (oy - 96) + ' A 32 28 0 0 1 ' + (ox + 24) + ' ' + (oy - 102),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.5' }, g);
    // telescope slit + a glint
    S.el('line', { x1: ox - 4, y1: oy - 104, x2: ox + 22, y2: oy - 128,
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '3' }, g);
    // a lit window or two
    litWindow(S, g, ox - 30, oy - 48, 14, 18);
    litWindow(S, g, ox + 14, oy - 48, 14, 18);
  };

  /* ── CENTER: the manor house (distant, beyond the gate) ─────────────────────── */
  B.drawManor = function (parent, S) {
    var g = S.group('manor', parent);
    // anchor: center-right, distant — base y ~470, footprint ~x980..1280
    var mx = 1120, baseY = 470, w = 300, h = 130;
    var left = mx - w / 2, top = baseY - h;

    // main block (pale wall)
    S.el('rect', { x: left, y: top, width: w, height: h, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // wings (lower flanks)
    S.el('rect', { x: left - 50, y: top + 40, width: 60, height: h - 40, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.8' }, g);
    S.el('rect', { x: left + w - 10, y: top + 40, width: 60, height: h - 40, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.8' }, g);

    // roof (mansard) — top-lit edge
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 46) +
      ' L ' + (left + w + 8) + ' ' + top + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 46),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.45' }, g);

    // central clock tower (a manor signature — nods to the orrery)
    var tx = left + w * 0.5;
    S.el('rect', { x: tx - 22, y: top - 110, width: 44, height: 70, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (tx - 26) + ' ' + (top - 110) + ' L ' + tx + ' ' + (top - 150) +
      ' L ' + (tx + 26) + ' ' + (top - 110) + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // clock face (brass ring + emissive center)
    S.el('circle', { cx: tx, cy: top - 78, r: 11, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    S.el('circle', { cx: tx, cy: top - 78, r: 4, fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.85' }, g);

    // rows of lit windows (emissive) — candle-glow from the manor
    var cols = 6, rows = 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var wx = left + 24 + c * ((w - 48) / (cols - 1)) - 7;
        var wy = top + 24 + r * 44;
        litWindow(S, g, wx, wy, 14, 22);
      }
    }
    // a couple of wing windows
    litWindow(S, g, left - 36, top + 60, 12, 18);
    litWindow(S, g, left + w + 14, top + 60, 12, 18);
  };

  /* ── RIGHT: the greenhouse (glasshouse front-elevation) ─────────────────────── */
  B.drawGreenhouse = function (parent, S) {
    var g = S.group('greenhouse', parent);
    // anchor: far right, near ground — base y ~470, footprint ~x1380..1580
    var gx = 1470, baseY = 470, w = 180, h = 90;
    var left = gx - w / 2, top = baseY - h;

    // glass body
    S.el('rect', { x: left, y: top, width: w, height: h, fill: 'var(--greenhouse-glass-ref, #5a7280)',
      opacity: '0.65', stroke: 'var(--greenhouse-frame-ref, #222a30)', 'stroke-width': '1' }, g);
    // pitched glass roof
    S.el('path', { d: 'M ' + (left - 6) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 40) +
      ' L ' + (left + w + 6) + ' ' + top + ' Z', fill: 'var(--greenhouse-glass-ref, #5a7280)',
      opacity: '0.6', stroke: 'var(--greenhouse-frame-ref, #222a30)', 'stroke-width': '1' }, g);
    // glazing bars (frame)
    var bars = 5;
    for (var i = 1; i < bars; i++) {
      var bx = left + i * (w / bars);
      S.el('line', { x1: bx, y1: top, x2: bx, y2: top + h, stroke: 'var(--greenhouse-frame-ref, #222a30)', 'stroke-width': '1' }, g);
    }
    S.el('line', { x1: left, y1: top + h * 0.5, x2: left + w, y2: top + h * 0.5,
      stroke: 'var(--greenhouse-frame-ref, #222a30)', 'stroke-width': '1' }, g);
    // ridge top-edge brass sheen
    S.el('path', { d: 'M ' + (left - 6) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 40),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.3' }, g);
    // a faint inner glow (plants/lanterns) — emissive, subtle
    S.el('rect', { x: left + 8, y: top + h * 0.45, width: w - 16, height: h * 0.45,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.10', filter: 'url(#glow-soft)' }, g);
  };

  Gate.scenebuildings = B;

  if (typeof module !== 'undefined' && module.exports) { module.exports = B; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
