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
    // anchor: dead-center, GRAND — base sits ON the horizon (y=472, no float).
    // The gate OPENING is x472..1128 (centered x800); the manor is scaled UP to
    // ALMOST FILL it — main block + flanking wings span ~x506..1094, a small margin
    // inside the piers so the bars FRAME it without clipping. Taller flanking
    // massing adds weight without ballooning the central footprint.
    var mx = 800, baseY = 472, w = 388, h = 120;
    var left = mx - w / 2, top = baseY - h;   // main block x606..994

    // main block (pale wall)
    S.el('rect', { x: left, y: top, width: w, height: h, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);

    // TALLER flanking wings (added visual WEIGHT) — taller than the old flanks but
    // grounded to the same baseY; they reach OUT toward (not into) the piers so the
    // whole manor mass almost fills the opening. wingTop is HIGHER than the old
    // top+34 so the wings read as substantial taller massing on the sides.
    var wingW = 100, wingTop = top + 18;
    var lwX = left - wingW + 6;                 // left wing  x512..612
    var rwX = left + w - 6;                     // right wing x988..1088
    S.el('rect', { x: lwX, y: wingTop, width: wingW, height: baseY - wingTop, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.9' }, g);
    S.el('rect', { x: rwX, y: wingTop, width: wingW, height: baseY - wingTop, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.9' }, g);
    // low hip roofs capping the wings (top-lit) so they read as massing, not boxes
    S.el('path', { d: 'M ' + (lwX - 4) + ' ' + wingTop + ' L ' + (lwX + wingW * 0.5) + ' ' + (wingTop - 26) +
      ' L ' + (lwX + wingW + 4) + ' ' + wingTop + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.9' }, g);
    S.el('path', { d: 'M ' + (rwX - 4) + ' ' + wingTop + ' L ' + (rwX + wingW * 0.5) + ' ' + (wingTop - 26) +
      ' L ' + (rwX + wingW + 4) + ' ' + wingTop + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '0.9' }, g);

    // roof (mansard) over the main block — top-lit edge
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 46) +
      ' L ' + (left + w + 8) + ' ' + top + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (left - 8) + ' ' + top + ' L ' + (left + w * 0.5) + ' ' + (top - 46),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.45' }, g);

    // central clock tower (a manor signature — nods to the orrery)
    var tx = left + w * 0.5;
    S.el('rect', { x: tx - 20, y: top - 96, width: 40, height: 62, fill: 'var(--manor-wall-ref, #aeb6c6)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    S.el('path', { d: 'M ' + (tx - 24) + ' ' + (top - 96) + ' L ' + tx + ' ' + (top - 132) +
      ' L ' + (tx + 24) + ' ' + (top - 96) + ' Z', fill: 'var(--manor-roof-ref, #3a4150)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    // clock face (brass ring + emissive center)
    S.el('circle', { cx: tx, cy: top - 66, r: 10, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.3' }, g);
    S.el('circle', { cx: tx, cy: top - 66, r: 3.6, fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.85' }, g);

    // a lit doorway at the foot of the central axis — the road's terminus
    S.el('rect', { x: tx - 9, y: baseY - 30, width: 18, height: 30, rx: 1,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.9' }, g);

    // rows of lit windows (emissive) — candle-glow from the manor
    var cols = 6, rows = 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var wx = left + 26 + c * ((w - 52) / (cols - 1)) - 6;
        var wy = top + 24 + r * 44;
        litWindow(S, g, wx, wy, 13, 20);
      }
    }
    // wing windows (two tiers each — the taller massing reads as occupied)
    litWindow(S, g, lwX + 20, wingTop + 28, 12, 18);
    litWindow(S, g, lwX + 58, wingTop + 28, 12, 18);
    litWindow(S, g, lwX + 20, wingTop + 70, 12, 18);
    litWindow(S, g, lwX + 58, wingTop + 70, 12, 18);
    litWindow(S, g, rwX + 22, wingTop + 28, 12, 18);
    litWindow(S, g, rwX + 60, wingTop + 28, 12, 18);
    litWindow(S, g, rwX + 22, wingTop + 70, 12, 18);
    litWindow(S, g, rwX + 60, wingTop + 70, 12, 18);
  };

  /* ── RIGHT: the greenhouse — a 3/4 CORNER view Victorian glasshouse ───────────
     Drawn FORWARD into the midground (base BELOW the manor's horizon at y470, so
     it reads as CLOSER) and at a 3/4 angle so we see TWO faces meeting at a near
     vertical corner: a FRONT GABLE face (left) + a SIDE WALL receding back-right,
     with the ridge roof angled in perspective and the gable end showing. Sits to
     the RIGHT of the right pier (cap edge ~x1214), clear of the frame, leaving the
     ground in front for the undercroft hatch. A dimensional glasshouse, not a
     flat decal. Palette: frame=greenhouse.frame, panes=greenhouse.glass; a faint
     warm window.lit interior glow at night. */
  B.drawGreenhouse = function (parent, S) {
    var g = S.group('greenhouse', parent);
    var FR = 'var(--greenhouse-frame-ref, #222a30)';
    var GL = 'var(--greenhouse-glass-ref, #5a7280)';

    // ── box corners (a 3/4 projection: front face square-on, side wall sheared
    // up-and-right with perspective foreshortening). Near vertical corner is the
    // edge shared by both faces; the front face is to its LEFT, side wall RIGHT. ──
    // SCALED DOWN (SC) but the SHAPE is preserved EXACTLY — every dimension is the
    // same proportion as before, just × SC — so the owner's loved 3/4 silhouette is
    // unchanged, only smaller. Anchored slightly lower + forward-right so its TOP
    // (gable apex) sits clearly BELOW the manor roofline → it reads as SECONDARY.
    var SC = 0.66;
    var ncx = 1372, baseY = 600;      // NEAR corner foot (the closest point)
    var wallH = 132 * SC;             // eave height at the near corner
    var frontW = 122 * SC;            // front-face apparent width (to the left)
    var sideRun = 188 * SC, sideRise = 40 * SC; // side wall recede (right) + perspective rise
    var sideH = wallH - 26 * SC;      // far eave is lower (smaller w/ distance)

    // front face foot-left / eave-left / eave-corner / foot-corner
    var fL = ncx - frontW, fEaveY = baseY - wallH;
    // side far foot / far eave
    var sFx = ncx + sideRun, sFy = baseY - sideRise;
    var sEaveY = sFy - sideH;

    // ── SIDE WALL (recedes back-right) — drawn first (behind the front face) ──
    var sideD = 'M ' + ncx + ' ' + baseY +
      ' L ' + ncx + ' ' + fEaveY +
      ' L ' + sFx + ' ' + sEaveY +
      ' L ' + sFx + ' ' + sFy + ' Z';
    S.el('path', { d: sideD, fill: GL, opacity: '0.55', stroke: FR, 'stroke-width': '1.4' }, g);

    // ── FRONT GABLE FACE ──
    var frontD = 'M ' + fL + ' ' + baseY +
      ' L ' + fL + ' ' + fEaveY +
      ' L ' + ncx + ' ' + fEaveY +
      ' L ' + ncx + ' ' + baseY + ' Z';
    S.el('path', { d: frontD, fill: GL, opacity: '0.7', stroke: FR, 'stroke-width': '1.6' }, g);

    // ── GABLE TRIANGLE on the front face (the pitched glass end) ──
    var ridgeFrontX = (fL + ncx) / 2;          // ridge apex above the front face
    var ridgeApexY = fEaveY - 52 * SC;         // gable rise scaled with the rest
    var gableD = 'M ' + fL + ' ' + fEaveY +
      ' L ' + ridgeFrontX + ' ' + ridgeApexY +
      ' L ' + ncx + ' ' + fEaveY + ' Z';
    S.el('path', { d: gableD, fill: GL, opacity: '0.62', stroke: FR, 'stroke-width': '1.6' }, g);

    // ── RIDGE ROOF PLANE (recedes back-right in perspective) ──
    var ridgeBackX = ridgeFrontX + sideRun, ridgeBackY = ridgeApexY - sideRise;
    var roofD = 'M ' + ridgeFrontX + ' ' + ridgeApexY +
      ' L ' + ridgeBackX + ' ' + ridgeBackY +
      ' L ' + sFx + ' ' + sEaveY +
      ' L ' + ncx + ' ' + fEaveY + ' Z';
    S.el('path', { d: roofD, fill: GL, opacity: '0.5', stroke: FR, 'stroke-width': '1.4' }, g);
    // far gable end of the roof (back triangle, faint) so the ridge reads as a prism
    S.el('path', { d: 'M ' + sFx + ' ' + sEaveY + ' L ' + ridgeBackX + ' ' + ridgeBackY +
      ' L ' + (sFx) + ' ' + sEaveY + ' Z', fill: 'none', stroke: FR, 'stroke-width': '1' }, g);

    // ── GLAZING BARS ──
    // front face verticals
    var fbars = 4;
    for (var i = 1; i < fbars; i++) {
      var bx = fL + i * (frontW / fbars);
      S.el('line', { x1: bx, y1: fEaveY, x2: bx, y2: baseY, stroke: FR, 'stroke-width': '1' }, g);
    }
    // front face mid rail
    S.el('line', { x1: fL, y1: (fEaveY + baseY) / 2, x2: ncx, y2: (fEaveY + baseY) / 2,
      stroke: FR, 'stroke-width': '1' }, g);
    // side wall verticals (converge toward the far corner = perspective)
    var sbars = 5;
    for (var j = 1; j < sbars; j++) {
      var t = j / sbars;
      var topx = ncx + t * (sFx - ncx), topy = fEaveY + t * (sEaveY - fEaveY);
      var botx = ncx + t * (sFx - ncx), boty = baseY + t * (sFy - baseY);
      S.el('line', { x1: topx, y1: topy, x2: botx, y2: boty, stroke: FR, 'stroke-width': '0.9' }, g);
    }
    // roof glazing bars along the ridge (front→back)
    var rbars = 4;
    for (var k = 1; k < rbars; k++) {
      var rt = k / rbars;
      var ex = ncx + rt * (sFx - ncx), ey = fEaveY + rt * (sEaveY - fEaveY);
      var rx = ridgeFrontX + rt * (ridgeBackX - ridgeFrontX), ry = ridgeApexY + rt * (ridgeBackY - ridgeApexY);
      S.el('line', { x1: ex, y1: ey, x2: rx, y2: ry, stroke: FR, 'stroke-width': '0.8' }, g);
    }

    // ── near vertical corner post (emphasise the 3/4 edge) + ridge brass sheen ──
    S.el('line', { x1: ncx, y1: baseY, x2: ncx, y2: fEaveY, stroke: FR, 'stroke-width': '2' }, g);
    S.el('line', { x1: fL, y1: fEaveY, x2: ridgeFrontX, y2: ridgeApexY,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.35' }, g);
    S.el('line', { x1: ridgeFrontX, y1: ridgeApexY, x2: ridgeBackX, y2: ridgeBackY,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.35' }, g);

    // ── faint warm INTERIOR GLOW (plants/lanterns) seen through the glass at
    // night — emissive (window.lit GLOW role, palette/brightness-immune). ──
    S.el('rect', { x: fL + 8 * SC, y: baseY - wallH * 0.5, width: frontW - 16 * SC, height: wallH * 0.5 - 6 * SC,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.12', filter: 'url(#glow-soft)' }, g);
    // a brighter low pip so it reads as a light source at night
    S.el('rect', { x: ncx - 30 * SC, y: baseY - 34 * SC, width: 22 * SC, height: 24 * SC, rx: 1,
      fill: 'var(--window-lit-ref, #ffcf73)', opacity: '0.16' }, g);
  };

  Gate.scenebuildings = B;

  if (typeof module !== 'undefined' && module.exports) { module.exports = B; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
