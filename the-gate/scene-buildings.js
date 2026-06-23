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

  /* ── a soft horizon HAZE/MIST band — sits behind the distant buildings to
     separate them from the midground (cheap depth). Drawn FIRST in the far-scenery
     layer so the buildings sit in front of it. Palette-swappable (mist role). ─── */
  B.drawMist = function (parent, S) {
    var g = S.group('horizon-mist', parent);
    var horizon = 470;
    // a gradient-free, layered haze: two soft bands fading down from the horizon
    S.el('rect', { x: 0, y: horizon - 64, width: S.VB_W, height: 64,
      fill: 'var(--mist-ref, #7c8aa0)', opacity: '0.18', filter: 'url(#glow-soft)' }, g);
    S.el('rect', { x: 0, y: horizon - 34, width: S.VB_W, height: 34,
      fill: 'var(--mist-ref, #7c8aa0)', opacity: '0.22', filter: 'url(#glow-soft)' }, g);
  };

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

    // observatory building atop the hill, around x=210, base y=360.
    // Reads as an OBSERVATORY: a domed CYLINDER (rounded shoulders) with a clear
    // telescope SLIT cut through the dome + the barrel pointing out of it.
    var ox = 210, oy = 360, bodyW = 92, bodyH = 64, domeRy = 38, domeRx = 50;
    var bodyTop = oy - bodyH;
    // cylinder body (rounded top corners suggest a drum, not a box)
    S.el('rect', { x: ox - bodyW / 2, y: bodyTop, width: bodyW, height: bodyH, rx: 6,
      fill: 'var(--observatory-body-ref, #181c26)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    // a brass ring course where the drum meets the dome
    S.el('line', { x1: ox - bodyW / 2, y1: bodyTop, x2: ox + bodyW / 2, y2: bodyTop,
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2' }, g);
    // hemispherical dome
    var domeTop = bodyTop - domeRy;
    S.el('path', { d: 'M ' + (ox - domeRx) + ' ' + bodyTop + ' A ' + domeRx + ' ' + domeRy +
      ' 0 0 1 ' + (ox + domeRx) + ' ' + bodyTop + ' Z',
      fill: 'var(--observatory-dome-ref, #3a4250)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    // the SHUTTER SLIT: a dark wedge cut from the dome crown to the rim, opening
    // up-and-right (so the telescope can look at the sky over the manor)
    S.el('path', { d: 'M ' + (ox + 4) + ' ' + bodyTop + ' L ' + (ox - 6) + ' ' + bodyTop +
      ' L ' + (ox + 8) + ' ' + (domeTop + 4) + ' L ' + (ox + 18) + ' ' + (domeTop + 8) + ' Z',
      fill: 'var(--observatory-body-ref, #181c26)' }, g);
    // dome top-edge brass sheen
    S.el('path', { d: 'M ' + (ox - 30) + ' ' + (bodyTop - domeRy * 0.7) + ' A 32 26 0 0 1 ' + (ox + 6) + ' ' + (domeTop + 2),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.5' }, g);
    // the TELESCOPE barrel poking out of the slit toward the sky
    S.el('line', { x1: ox + 6, y1: bodyTop - 6, x2: ox + 40, y2: domeTop - 18,
      stroke: 'var(--observatory-body-ref, #181c26)', 'stroke-width': '7', 'stroke-linecap': 'round' }, g);
    S.el('line', { x1: ox + 6, y1: bodyTop - 6, x2: ox + 40, y2: domeTop - 18,
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '2', 'stroke-linecap': 'round' }, g);
    S.el('circle', { cx: ox + 40, cy: domeTop - 18, r: 2.4, fill: 'var(--brass-bright-ref, #f0d489)', opacity: '0.8' }, g);
    // a lit window or two
    litWindow(S, g, ox - 30, oy - 44, 14, 18);
    litWindow(S, g, ox + 14, oy - 44, 14, 18);
  };

  /* ── CENTER: the manor house — the DESTINATION, centered behind the gate ──────
     Centered on the seam (x≈800) so the road through the opened gate leads straight
     to it; you glimpse it through the bars. Distant + slightly smaller than before
     so the gate dominates the foreground. Base meets the grounds cleanly at the
     horizon (no float). Sits between the piers, read THROUGH the gate. */
  B.drawManor = function (parent, S) {
    var g = S.group('manor', parent);
    // anchor: dead-center, distant — base sits ON the horizon (y=470, no float)
    var mx = 800, baseY = 472, w = 230, h = 104;
    var left = mx - w / 2, top = baseY - h;

    // main block (pale wall)
    S.el('rect', { x: left, y: top, width: w, height: h, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // wings (lower flanks) — grounded to the same baseY
    S.el('rect', { x: left - 42, y: top + 34, width: 50, height: baseY - (top + 34), fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.8' }, g);
    S.el('rect', { x: left + w - 8, y: top + 34, width: 50, height: baseY - (top + 34), fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.8' }, g);

    // roof (mansard) — top-lit edge
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 40) +
      ' L ' + (left + w + 8) + ' ' + top + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 40),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.45' }, g);

    // central clock tower (a manor signature — nods to the orrery)
    var tx = left + w * 0.5;
    S.el('rect', { x: tx - 18, y: top - 92, width: 36, height: 58, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (tx - 22) + ' ' + (top - 92) + ' L ' + tx + ' ' + (top - 126) +
      ' L ' + (tx + 22) + ' ' + (top - 92) + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // clock face (brass ring + emissive center)
    S.el('circle', { cx: tx, cy: top - 64, r: 9, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    S.el('circle', { cx: tx, cy: top - 64, r: 3.4, fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.85' }, g);

    // a lit doorway at the foot of the central axis — the road's terminus
    S.el('rect', { x: tx - 8, y: baseY - 26, width: 16, height: 26, rx: 1,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.9' }, g);

    // rows of lit windows (emissive) — candle-glow from the manor
    var cols = 5, rows = 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var wx = left + 22 + c * ((w - 44) / (cols - 1)) - 6;
        var wy = top + 20 + r * 38;
        litWindow(S, g, wx, wy, 12, 18);
      }
    }
    // a couple of wing windows
    litWindow(S, g, left - 30, top + 50, 10, 15);
    litWindow(S, g, left + w + 12, top + 50, 10, 15);
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
