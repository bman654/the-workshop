/* ════════════════════════════════════════════════════════════════════════════
   gate-art.js — #369 THE FAIRGROUND GATE, the in-house forged art for the descent layer.

   This module installs `window.GateArt`, the art the platewalk module looks for when it
   draws the gate FACE (the in-map threshold that descends into the amusements child layer)
   and the child MIDWAY ground (the cobbled promenade the descended sheet reads as a place).
   If this module is absent (or a draw fn throws), the page falls back to the inline block-art
   placeholders in index.src.html (drawGateFacePlaceholder / drawMidwayPlaceholder) — so the
   system is fully testable WITHOUT the rich art, and the rich art is a pure drop-in.

   ── THE API (both fns append SVG into the given <g>; SVG namespace; viewBox units) ──

     window.GateArt.drawFace(g, box, accent)
       g      — an SVG <g class="gate-face"> already in the DOM (in #pois); append into it.
       box    — { x, y, w, h } the gate footprint in viewBox units (≈96×120).
       accent — the wing accent string ("#37f7e0").
       MUST include exactly one element of class "gate-glow" (the keyway glow that pulses via
       CSS) and exactly one of class "gate-chev" (the beckoning descend chevron). Does NOT set
       the group's transform. Does NOT draw the count legend (the page adds .gate-text).

     window.GateArt.drawMidway(g, bbox, accent)
       g      — an SVG <g class="child-midway"> (in #pois, behind the tiles, hidden until descent).
       bbox   — { x, y, w, h } the child plate's relay envelope in viewBox units (≈315×560).
       accent — the wing accent string. Keep FAINT (it sits UNDER the tiles); no text.

   Art direction: the estate's brass-stroke-on-ink hand (brass #c9a24a strokes, accent-tinted
   paper fills) at a FAIRGROUND register. Built to the-fairground-gate/art-specs/{gate-face,midway}.md.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  var BRASS = "#c9a24a";
  // tiny local element factory (this module runs in page scope but is self-contained —
  // it does NOT depend on the page's `el` helper, so the placeholder/forged swap is clean).
  function E(n, a) {
    var e = document.createElementNS(SVGNS, n);
    for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    return e;
  }
  function n(v) { return Math.round(v * 100) / 100; } // keep path data tidy

  // ── THE GATE FACE ─────────────────────────────────────────────────────────────
  // A surveyed-plan midway ARCH over a gabled TICKET BOOTH: strung bunting on the crown,
  // a warm glowing booth window, and a LIT TEAL THRESHOLD (the gate-glow keyway) you step
  // through, with a beckoning descend chevron at its foot. Reads as "a quarter you ENTER,"
  // legible at ~96×120, in brass-on-ink. The page lays the engraved count legend above + on
  // the fascia separately, so the top ~6px and the booth-fascia centre are kept clear.
  function drawFace(g, box, accent) {
    var x = box.x, y = box.y, w = box.w, h = box.h;
    accent = accent || "#37f7e0";
    var cx = x + w * 0.5;

    // 0. THE HIT-AREA (#369 bug-fix) — an invisible full-box rect, FIRST in paint order so it
    //    under-paints all the art. SVG hit-tests only PAINTED pixels, and the gate art is thin
    //    brass strokes + an open arch (mostly negative space), so a REAL pointer click in the
    //    arch would otherwise fall THROUGH the .gate-face <g> and miss. A fill of "rgba(0,0,0,0)"
    //    (fully transparent, but PAINTED) makes the whole footprint — arch void included —
    //    catch the click and descend. (fill:"none" would NOT hit-test; the fill must exist.)
    g.appendChild(E("rect", { x: n(x), y: n(y), width: n(w), height: n(h),
      fill: "rgba(0,0,0,0)", stroke: "none", "class": "gate-hit" }));

    // geometry (ALL absolute coords derived from the box origin x,y — never mix abs/rel) ----
    var archTop = y + 6;                 // crown of the arch (leave top ~6px for the legend)
    var archSpring = y + h * 0.34;       // where the arch shoulders meet the piers
    var inset = w * 0.10;                // pier inset from the box edge (a relative width)
    var pierW = w * 0.085;               // pier thickness
    var lPier = x + inset;               // left pier inner-x (absolute)
    var rPier = x + w - inset - pierW;   // right pier inner-x (absolute)
    var by = y + h * 0.50;               // booth roof datum
    var bw = w * 0.66, bx = cx - bw / 2; // booth box
    var bBot = y + h - 2;

    // 1. the two slim PIERS the arch springs from (brass-line columns) -------------
    [lPier, rPier].forEach(function (px) {
      g.appendChild(E("rect", { x: n(px), y: n(archSpring), width: n(pierW), height: n(bBot - archSpring),
        rx: 0.6, "class": "gate-fill" }));
      // a small brass capital band atop each pier
      g.appendChild(E("line", { x1: n(px - 1), y1: n(archSpring), x2: n(px + pierW + 1), y2: n(archSpring),
        "class": "gate-line" }));
    });

    // 2. the rounded MIDWAY ARCH spanning the piers, springing into a half-round crown
    var lOut = lPier, rOut = rPier + pierW;             // arch outer footing (pier outer edges)
    var lIn = lPier + pierW, rIn = rPier;
    var cyArch = archSpring;                            // the springing line
    // outer arch face (filled), then an inner concentric arch line (the soffit) — a real gateway
    var dOuter = "M" + n(lOut) + " " + n(cyArch) +
                 " Q" + n(lOut) + " " + n(archTop) + " " + n(cx) + " " + n(archTop) +
                 " Q" + n(rOut) + " " + n(archTop) + " " + n(rOut) + " " + n(cyArch) +
                 " H" + n(rIn) +
                 " Q" + n(rIn) + " " + n(archTop + 5) + " " + n(cx) + " " + n(archTop + 5) +
                 " Q" + n(lIn) + " " + n(archTop + 5) + " " + n(lIn) + " " + n(cyArch) + " Z";
    g.appendChild(E("path", { d: dOuter, "class": "gate-fill" }));
    // a keystone tick at the crown
    g.appendChild(E("path", { d: "M" + n(cx - 2.5) + " " + n(archTop) + " l5 0 l-1 5 l-3 0 z",
      "class": "gate-line" }));

    // 3. STRUNG BUNTING along the arch crown — the detail that says "FAIR" loudest --
    //    a sagging swag line following the arch + little triangular pennants hanging from it.
    var swag = "M" + n(lOut + 1) + " " + n(cyArch - 1) +
               " Q" + n(cx) + " " + n(archTop - 4) + " " + n(rOut - 1) + " " + n(cyArch - 1);
    g.appendChild(E("path", { d: swag, "class": "gate-line", fill: "none", "stroke-width": 0.8, opacity: 0.7 }));
    var NF = 7;
    for (var i = 0; i < NF; i++) {
      var t = i / (NF - 1);
      // point along the quadratic swag (B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2)
      var mt = 1 - t;
      var px = mt * mt * (lOut + 1) + 2 * mt * t * cx + t * t * (rOut - 1);
      var py = mt * mt * (cyArch - 1) + 2 * mt * t * (archTop - 4) + t * t * (cyArch - 1);
      var fillC = (i % 2 === 0) ? accent : BRASS;
      g.appendChild(E("path", { d: "M" + n(px - 2.4) + " " + n(py) + " L" + n(px + 2.4) + " " + n(py) +
        " L" + n(px) + " " + n(py + 5.2) + " Z", fill: fillC, stroke: "none", opacity: 0.62 }));
    }

    // 4. the gabled TICKET BOOTH nested under the arch ----------------------------
    // gable roof
    g.appendChild(E("path", { d: "M" + n(bx - 3) + " " + n(by) + " L" + n(cx) + " " + n(by - 9) +
      " L" + n(bx + bw + 3) + " " + n(by) + " Z", "class": "gate-fill" }));
    g.appendChild(E("line", { x1: n(cx), y1: n(by - 9), x2: n(cx), y2: n(by - 5), "class": "gate-line",
      "stroke-width": 0.7, opacity: 0.6 })); // a tiny finial
    // booth body
    g.appendChild(E("rect", { x: n(bx), y: n(by), width: n(bw), height: n(bBot - by), rx: 1, "class": "gate-fill" }));
    // a fascia rule under the roof (the booth's sign band — page legend sits centred on it)
    g.appendChild(E("line", { x1: n(bx + 1), y1: n(by + 6), x2: n(bx + bw - 1), y2: n(by + 6),
      "class": "gate-line", "stroke-width": 0.7, opacity: 0.55 }));
    // the warm GLOWING booth window (lit from inside — open for business). Brass-warm, small.
    var winW = bw * 0.42, winH = (bBot - by - 8) * 0.5, winX = cx - winW / 2, winY = by + 8;
    g.appendChild(E("rect", { x: n(winX), y: n(winY), width: n(winW), height: n(winH), rx: 0.8,
      fill: "rgba(255,209,128,0.30)", stroke: "rgba(255,209,128,0.8)", "stroke-width": 0.8 }));
    g.appendChild(E("line", { x1: n(cx), y1: n(winY), x2: n(cx), y2: n(winY + winH),
      stroke: "rgba(255,209,128,0.55)", "stroke-width": 0.5 })); // window mullion

    // 5. the LIT THRESHOLD — the gate-glow keyway: the teal mouth you step through ----
    //    a tall rounded portal centred under the arch soffit, OVER the booth (the booth is
    //    open, the threshold glows beyond it). This is the single .gate-glow element (CSS pulses it).
    var kw = w * 0.30, kx = cx - kw / 2, ky = archSpring - 1, kh = (by - archSpring) + 12;
    var dGlow = "M" + n(kx) + " " + n(ky + kh) +
                " V" + n(ky + kh * 0.38) +
                " Q" + n(kx) + " " + n(ky) + " " + n(cx) + " " + n(ky) +
                " Q" + n(kx + kw) + " " + n(ky) + " " + n(kx + kw) + " " + n(ky + kh * 0.38) +
                " V" + n(ky + kh) + " Z";
    g.appendChild(E("path", { d: dGlow, "class": "gate-glow" }));
    // a thin brass keyway outline framing the glow (so the lit mouth reads as a built threshold)
    g.appendChild(E("path", { d: dGlow, "class": "gate-line", fill: "none", "stroke-width": 0.9, opacity: 0.7 }));

    // 6. the beckoning DESCEND CHEVRON (the single .gate-chev) at the threshold foot --
    var chY = by + (bBot - by) * 0.62;
    // a faint LEADING chevron above (a doubled "down here" read) — NOT .gate-chev (the contract
    // wants exactly one animated chev); this one is static accent, the beckon bob lives below it.
    g.appendChild(E("path", { d: "M" + n(cx - 4) + " " + n(chY - 5) + " l4 4 l4 -4",
      stroke: accent, "stroke-width": 1, fill: "none", opacity: 0.38 }));
    // the one animated descend chevron (CSS gatebeckon bobs it)
    g.appendChild(E("path", { d: "M" + n(cx - 5) + " " + n(chY) + " l5 5 l5 -5", "class": "gate-chev" }));
  }

  // ── THE CHILD MIDWAY GROUND ─────────────────────────────────────────────────────
  // A faint cobbled fairground MIDWAY under the re-laid tiles: a central promenade spine,
  // a sparse paved-ground hatch crossing it, distant strung pennants arcing across the top,
  // and a far gate silhouette at the avenue's end. Atmosphere, not furniture — it sits UNDER
  // the tiles (opacity ~0.1–0.25), turning a blank re-lay into an arrived-at PLACE.
  function drawMidway(g, bbox, accent) {
    var x = bbox.x, y = bbox.y, w = bbox.w, h = bbox.h;
    accent = accent || "#37f7e0";
    var pad = Math.min(12, w * 0.04);
    var ax = x + w * 0.5;                 // the avenue spine
    var top = y + pad, bot = y + h - pad;

    // 1. the central PROMENADE — a soft double avenue line (the path between the rides) ----
    var avW = w * 0.10;                   // avenue half-width
    g.appendChild(E("line", { x1: n(ax - avW), y1: n(top), x2: n(ax - avW), y2: n(bot),
      stroke: BRASS, "stroke-width": 0.7, opacity: 0.14 }));
    g.appendChild(E("line", { x1: n(ax + avW), y1: n(top), x2: n(ax + avW), y2: n(bot),
      stroke: BRASS, "stroke-width": 0.7, opacity: 0.14 }));
    // the dashed centre spine
    g.appendChild(E("line", { x1: n(ax), y1: n(top), x2: n(ax), y2: n(bot),
      stroke: BRASS, "stroke-width": 0.7, opacity: 0.12, "stroke-dasharray": "5 8" }));

    // 2. the COBBLED ground hatch — short faint ticks crossing the avenue (a built floor) ---
    var rows = Math.max(6, Math.floor((bot - top) / 30));
    for (var r = 0; r <= rows; r++) {
      var yy = top + (bot - top) * r / rows;
      // cobble ticks step inward toward the avenue (a paved promenade, not a full grid)
      g.appendChild(E("line", { x1: n(ax - avW), y1: n(yy), x2: n(ax + avW), y2: n(yy),
        stroke: BRASS, "stroke-width": 0.5, opacity: 0.085 }));
      // a couple of flanking cobble ticks either side (the midway widens out)
      g.appendChild(E("line", { x1: n(ax - avW * 2.4), y1: n(yy + 4), x2: n(ax - avW * 1.4), y2: n(yy + 4),
        stroke: BRASS, "stroke-width": 0.5, opacity: 0.06 }));
      g.appendChild(E("line", { x1: n(ax + avW * 1.4), y1: n(yy + 4), x2: n(ax + avW * 2.4), y2: n(yy + 4),
        stroke: BRASS, "stroke-width": 0.5, opacity: 0.06 }));
    }

    // 3. DISTANT STRUNG PENNANTS arcing across the top — the fair, glimpsed down the avenue --
    function buntingRow(by0, sag, count, op) {
      var lx = x + pad, rx = x + w - pad;
      var swag = "M" + n(lx) + " " + n(by0) + " Q" + n(ax) + " " + n(by0 + sag) + " " + n(rx) + " " + n(by0);
      g.appendChild(E("path", { d: swag, stroke: BRASS, "stroke-width": 0.6, fill: "none", opacity: op }));
      for (var i = 0; i < count; i++) {
        var t = i / (count - 1);
        var mt = 1 - t;
        var px = mt * mt * lx + 2 * mt * t * ax + t * t * rx;
        var py = mt * mt * by0 + 2 * mt * t * (by0 + sag) + t * t * by0;
        var fillC = (i % 2 === 0) ? accent : BRASS;
        g.appendChild(E("path", { d: "M" + n(px - 3) + " " + n(py) + " L" + n(px + 3) + " " + n(py) +
          " L" + n(px) + " " + n(py + 7) + " Z", fill: fillC, stroke: "none", opacity: op + 0.04 }));
      }
    }
    buntingRow(top + 4, 14, 9, 0.16);

    // 4. a FAR GATE silhouette at the avenue's foot — where the midway runs off to --------
    var fgW = w * 0.22, fgH = h * 0.05, fgX = ax - fgW / 2, fgY = bot - fgH;
    g.appendChild(E("path", { d: "M" + n(fgX) + " " + n(fgY + fgH) + " V" + n(fgY + fgH * 0.4) +
      " Q" + n(fgX) + " " + n(fgY) + " " + n(ax) + " " + n(fgY) +
      " Q" + n(fgX + fgW) + " " + n(fgY) + " " + n(fgX + fgW) + " " + n(fgY + fgH * 0.4) +
      " V" + n(fgY + fgH), stroke: BRASS, "stroke-width": 0.6, fill: "none", opacity: 0.12 }));
    // two faint footlight dots flanking the far gate (the avenue lit at its end)
    g.appendChild(E("circle", { cx: n(ax - fgW * 0.5), cy: n(fgY + fgH), r: 1.3, fill: accent, opacity: 0.16 }));
    g.appendChild(E("circle", { cx: n(ax + fgW * 0.5), cy: n(fgY + fgH), r: 1.3, fill: accent, opacity: 0.16 }));
  }

  /* ════════════════════════════════════════════════════════════════════════════
     #411 THE ENGRAVED BROADSHEET FAIR — the per-POI CHILD-SCENE registry.

     When the descended fairground child map draws an amusement tile, it calls
     GateArt.drawChildScene(g, poi, box, accent) ONCE per amusement. This installs a
     themed brass-on-ink ENGRAVED VIGNETTE for every amusement, keyed by POI id (with
     a footprint-tier fallback), so the descended quarter reads as a fairway you want
     to walk — not a flat emoji grid. A MISS or a THROWN scene falls back cleanly to
     the emoji tile (drawEmojiTile), so any un-registered id still renders and the
     next detach:true child inherits the same drop-in guarantee as drawFace above.

     Register (same hand as drawFace): brass #c9a24a strokes, color-mix accent fills,
     woodcut cross-hatch. Motion is GENERATED to match the drawn geometry (CSS
     @keyframes injected once per build) and is CALM AT REST — a scene animates only
     while its .poi is hovered / focused (or given the .awake test hook); reduced
     motion holds the rich static frame. Built to art-specs/child-scenes.md. ── */

  function add(p, t, a) { var e = E(t, a); p.appendChild(e); return e; }

  // ── the injected-keyframes sheet (ONE per document; unique names via _seq) ──────
  var _kf = [];          // rules collected while the current scene draws
  var _seq = 0;          // monotonic → unique keyframe / clip names across all tiles
  var _hid = 0;          // unique clip-path id counter
  var _kfStyle = null;
  function kfSheet() {
    if (!_kfStyle || !_kfStyle.isConnected) {
      _kfStyle = document.createElement("style");
      _kfStyle.setAttribute("data-gate-art-kf", "");
      (document.head || document.documentElement).appendChild(_kfStyle);
    }
    return _kfStyle;
  }
  function flushKF() { if (_kf.length) { kfSheet().textContent += "\n" + _kf.join("\n"); _kf.length = 0; } }

  /* ── engraving toolkit (the woodcut hand) ─────────────────────────────────────── */

  // fill a clipped shape with parallel hatch lines at an angle (the shade of a woodcut).
  function hatch(parent, clipShape, bbox, angle, gap, op, sw, stroke) {
    var id = "gah" + (_hid++);
    var cp = E("clipPath", { id: id });
    cp.appendChild(clipShape);
    parent.appendChild(cp);
    var g = add(parent, "g", { "clip-path": "url(#" + id + ")" });
    var cx = bbox.x + bbox.w / 2, cy = bbox.y + bbox.h / 2, ext = Math.max(bbox.w, bbox.h) * 1.3;
    var rg = add(g, "g", { transform: "rotate(" + n(angle) + " " + n(cx) + " " + n(cy) + ")" });
    for (var yy = cy - ext; yy <= cy + ext; yy += gap) {
      add(rg, "line", { x1: n(cx - ext), y1: n(yy), x2: n(cx + ext), y2: n(yy),
        stroke: stroke || BRASS, "stroke-width": sw || 0.5, opacity: op || 0.22, "class": "eng-hatch" });
    }
    return g;
  }
  function rectHatch(parent, x, y, w, h, angle, gap, op) {
    hatch(parent, E("rect", { x: n(x), y: n(y), width: n(w), height: n(h) }), { x: x, y: y, w: w, h: h }, angle, gap, op);
  }
  // a strung line of triangular pennants (bunting) along a shallow sag
  function pennants(parent, x1, y1, x2, y2, sag, count, accent, op) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
    add(parent, "path", { d: "M" + n(x1) + " " + n(y1) + " Q" + n(mx) + " " + n(my) + " " + n(x2) + " " + n(y2),
      "class": "eng", "stroke-width": 0.7, opacity: (op || 0.55) });
    for (var i = 0; i < count; i++) {
      var t = (i + 0.5) / count, mt = 1 - t;
      var px = mt * mt * x1 + 2 * mt * t * mx + t * t * x2, py = mt * mt * y1 + 2 * mt * t * my + t * t * y2;
      add(parent, "path", { d: "M" + n(px - 2.2) + " " + n(py) + " L" + n(px + 2.2) + " " + n(py) + " L" + n(px) + " " + n(py + 4.6) + " Z",
        fill: (i % 2 === 0 ? accent : BRASS), stroke: "none", opacity: (op || 0.55) + 0.08 });
    }
  }
  // a scalloped valance edge (the canvas fringe under a canopy)
  function scallopEdge(parent, x, y, w, count, drop, cls) {
    var seg = w / count, d = "M" + n(x) + " " + n(y);
    for (var i = 0; i < count; i++) {
      var sx = x + seg * i, ex = sx + seg;
      d += " C" + n(sx + seg * 0.16) + " " + n(y + drop) + " " + n(ex - seg * 0.16) + " " + n(y + drop) + " " + n(ex) + " " + n(y);
    }
    add(parent, "path", { d: d, "class": cls || "eng", "stroke-width": 0.85 });
  }
  // an N-point star outline
  function star(parent, cx, cy, rO, rI, pts, cls, extra) {
    var d = "";
    for (var i = 0; i < pts * 2; i++) { var r = (i % 2 ? rI : rO), a = -Math.PI / 2 + i * Math.PI / pts;
      d += (i ? "L" : "M") + n(cx + r * Math.cos(a)) + " " + n(cy + r * Math.sin(a)); }
    d += "Z"; return add(parent, "path", Object.assign({ d: d, "class": cls || "eng" }, extra || {}));
  }
  // pad a spinner group's bbox so transform-origin:center == the pivot (0,0)
  function padCenter(g, r) { add(g, "circle", { cx: 0, cy: 0, r: n(r), fill: "none", stroke: "none" }); }
  // Catmull-Rom densify (for a smooth rail)
  function catmull(P, per) {
    var out = [];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      for (var s = 0; s < per; s++) { var t = s / per, t2 = t * t, t3 = t2 * t;
        out.push({ x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
                   y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) }); }
    }
    out.push(P[P.length - 1]); return out;
  }
  function polyD(pts) { var d = "M" + n(pts[0].x) + " " + n(pts[0].y); for (var i = 1; i < pts.length; i++) d += " L" + n(pts[i].x) + " " + n(pts[i].y); return d; }

  /* ── keyframe emitters (motion generated to MATCH the drawn geometry) ─────────── */
  // a car following a dense polyline (deltas from pt0, banked to the local tangent)
  function coasterKF(name, pts) {
    var N = pts.length - 1, s = "@keyframes " + name + "{";
    for (var i = 0; i <= N; i++) {
      var dx = pts[i].x - pts[0].x, dy = pts[i].y - pts[0].y;
      var a = pts[Math.min(i + 1, N)], b = pts[Math.max(i - 1, 0)];
      var rot = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
      s += n(i / N * 100) + "%{transform:translate(" + n(dx) + "px," + n(dy) + "px) rotate(" + n(rot) + "deg)}";
    }
    _kf.push(s + "}");
  }
  // an element orbiting an ellipse; draw it at the returned start point so paused == spread.
  function ellipseKF(name, rx, ry, steps, phase0) {
    var sx = rx * Math.cos(phase0), sy = ry * Math.sin(phase0), s = "@keyframes " + name + "{";
    for (var i = 0; i <= steps; i++) { var p = i / steps, a = phase0 + p * 2 * Math.PI;
      s += n(p * 100) + "%{transform:translate(" + n(rx * Math.cos(a) - sx) + "px," + n(ry * Math.sin(a) - sy) + "px)}"; }
    _kf.push(s + "}"); return { sx: sx, sy: sy };
  }
  function spinKF(name, dir) { _kf.push("@keyframes " + name + "{from{transform:rotate(0)}to{transform:rotate(" + (dir < 0 ? -360 : 360) + "deg)}}"); }
  function scrollKF(name, dist) { _kf.push("@keyframes " + name + "{from{transform:translateX(0)}to{transform:translateX(" + n(-dist) + "px)}}"); }
  function bobKF(name, ax, ay) { _kf.push("@keyframes " + name + "{0%,100%{transform:translate(0,0)}50%{transform:translate(" + n(ax) + "px," + n(ay) + "px)}}"); }
  function swayKF(name, deg) { _kf.push("@keyframes " + name + "{0%,100%{transform:rotate(" + n(-deg) + "deg)}50%{transform:rotate(" + n(deg) + "deg)}}"); }
  function flowKF(name, d) { _kf.push("@keyframes " + name + "{from{stroke-dashoffset:0}to{stroke-dashoffset:" + n(-d) + "}}"); }
  // fall + fade (a trickle grain / a mote): translate by (dx,dy) fading out
  function fallKF(name, dx, dy) { _kf.push("@keyframes " + name + "{0%{transform:translate(0,0);opacity:.9}80%{opacity:.55}100%{transform:translate(" + n(dx) + "px," + n(dy) + "px);opacity:0}}"); }

  function anim(g, name, dur, extra) {
    return add(g, "g", { "class": "anim", style: "animation-name:" + name + ";animation-duration:" + dur + "s" + (extra ? (";" + extra) : "") });
  }

  /* ════════════════════════════════════════════════════════════════════════════
     THE VIGNETTES — each drawn brass-on-ink into `box`, in absolute viewBox coords.
     Signature: draw(g, poi, box, accent). Hero silhouette reads at the descended tile
     scale; the fine orbiting figures are a motion bonus. ── */

  function groundLine(g, box, gy) {
    add(g, "line", { x1: n(box.x + box.w * 0.03), y1: n(gy), x2: n(box.x + box.w * 0.97), y2: n(gy), "class": "eng-fine" });
    rectHatch(g, box.x + box.w * 0.03, gy + 0.5, box.w * 0.94, box.h * 0.06, 16, 3.4, 0.09);
  }
  function flag(g, x, y, up, accent) { add(g, "line", { x1: n(x), y1: n(y), x2: n(x), y2: n(y - up), "class": "eng" });
    add(g, "path", { d: "M" + n(x) + " " + n(y - up) + " l6 2 l-6 2 z", fill: accent, stroke: "none" }); }

  // 1 · midway → THE COASTER: a lattice trestle with a car cresting the lift-hill.
  function drawCoaster(g, poi, box, accent) {
    var uid = "cr" + (_seq++), gy = box.y + box.h - box.h * 0.14;
    var key = [{ x: box.x + box.w * 0.05, y: gy - box.h * 0.16 },
               { x: box.x + box.w * 0.16, y: gy - box.h * 0.30 },
               { x: box.x + box.w * 0.32, y: box.y + box.h * 0.10 },   // lift-hill crest
               { x: box.x + box.w * 0.55, y: gy - box.h * 0.04 },      // valley
               { x: box.x + box.w * 0.76, y: box.y + box.h * 0.42 },   // second hill
               { x: box.x + box.w * 0.96, y: gy - box.h * 0.12 }];
    var dense = catmull(key, 16);
    groundLine(g, box, gy);
    function railY(xq) { for (var i = 0; i < dense.length - 1; i++) { if (xq >= dense[i].x && xq <= dense[i + 1].x) {
      var t = (xq - dense[i].x) / ((dense[i + 1].x - dense[i].x) || 1); return dense[i].y + t * (dense[i + 1].y - dense[i].y); } } return gy - 8; }
    var x0 = box.x + box.w * 0.08, x1 = box.x + box.w - box.w * 0.06, step = (x1 - x0) / 9, prevX = null;
    for (var px = x0; px <= x1 + 0.5; px += step) {
      var ry = railY(px);
      add(g, "line", { x1: n(px), y1: n(ry), x2: n(px), y2: n(gy), "class": "eng-fine" });
      if (prevX != null) { var pyc = railY(prevX);
        add(g, "line", { x1: n(prevX), y1: n(pyc), x2: n(px), y2: n(gy), "class": "eng-hatch", "stroke-width": 0.5, opacity: 0.42 });
        add(g, "line", { x1: n(prevX), y1: n(gy), x2: n(px), y2: n(ry), "class": "eng-hatch", "stroke-width": 0.5, opacity: 0.42 }); }
      prevX = px;
    }
    add(g, "path", { d: polyD(dense), "class": "eng", "stroke-width": 1.4 });
    add(g, "path", { d: polyD(dense.map(function (p) { return { x: p.x, y: p.y + 2.4 }; })), "class": "eng-fine" });
    add(g, "path", { d: polyD(dense.slice(0, Math.floor(dense.length * 0.30))), "class": "eng-fine", "stroke-dasharray": "1.4 2.6", opacity: 0.55 });
    flag(g, key[2].x, key[2].y - 1, box.h * 0.11, accent);
    coasterKF("crun_" + uid, dense);
    var placer = add(g, "g", { transform: "translate(" + n(dense[0].x) + " " + n(dense[0].y - 4.5) + ")" });
    var car = anim(placer, "crun_" + uid, 3.8);
    add(car, "path", { d: "M-9 0 q0 4 3.4 4 h11 q3.4 0 3.4 -4 v-2.4 q0 -1.6 -1.6 -1.6 h-14.6 q-1.6 0 -1.6 1.6 z", "class": "eng fillp", "stroke-width": 1 });
    add(car, "circle", { cx: -4, cy: -3.6, r: 1.7, fill: accent, stroke: BRASS, "stroke-width": 0.4 });
    add(car, "circle", { cx: 4, cy: -3.6, r: 1.7, fill: accent, stroke: BRASS, "stroke-width": 0.4 });
    add(car, "circle", { cx: -4.6, cy: 4, r: 1.3, "class": "eng-fine" });
    add(car, "circle", { cx: 4.6, cy: 4, r: 1.3, "class": "eng-fine" });
  }

  // generic fp:pavilion base — a striped marquee tent (a show pavilion). Returns eave datum.
  function pavilionShell(g, box, accent, opts) {
    opts = opts || {};
    var cx = box.x + box.w / 2, gy = box.y + box.h - box.h * 0.12;
    var apex = box.y + box.h * (opts.apex || 0.06), eaveY = box.y + box.h * (opts.eave || 0.40), tentR = box.w * (opts.r || 0.42);
    groundLine(g, box, gy);
    var tD = "M" + n(cx) + " " + n(apex) + " L" + n(cx - tentR) + " " + n(eaveY) + " L" + n(cx + tentR) + " " + n(eaveY) + " Z";
    add(g, "path", { d: tD, "class": "fillp-ink", stroke: "none" });
    var stripes = 8;
    for (var i = 0; i < stripes; i++) {
      var xL = cx - tentR + 2 * tentR * (i / stripes), xR = cx - tentR + 2 * tentR * ((i + 1) / stripes);
      var d = "M" + n(cx) + " " + n(apex) + " L" + n(xL) + " " + n(eaveY) + " L" + n(xR) + " " + n(eaveY) + " Z";
      if (i % 2) hatch(g, E("path", { d: d }), { x: Math.min(xL, cx) - 2, y: apex, w: Math.abs(xR - cx) + Math.abs(xL - cx) + 4, h: eaveY - apex }, 90, 2.6, 0.32);
      add(g, "line", { x1: n(cx), y1: n(apex), x2: n(xL), y2: n(eaveY), "class": "eng-fine" });
    }
    add(g, "path", { d: tD, "class": "eng", "stroke-width": 1.3 });
    flag(g, cx, apex, box.h * 0.11, accent);
    scallopEdge(g, cx - tentR, eaveY, tentR * 2, 10, box.h * 0.055, "eng");
    // side poles + the open front arch (the mouth)
    add(g, "line", { x1: n(cx - tentR + 2), y1: n(eaveY), x2: n(cx - tentR + 2), y2: n(gy), "class": "eng-fine" });
    add(g, "line", { x1: n(cx + tentR - 2), y1: n(eaveY), x2: n(cx + tentR - 2), y2: n(gy), "class": "eng-fine" });
    add(g, "path", { d: "M" + n(cx - tentR * 0.5) + " " + n(gy) + " V" + n(eaveY + 5) + " Q" + n(cx - tentR * 0.5) + " " + n(eaveY - 3) + " " + n(cx) + " " + n(eaveY - 3) +
      " Q" + n(cx + tentR * 0.5) + " " + n(eaveY - 3) + " " + n(cx + tentR * 0.5) + " " + n(eaveY + 5) + " V" + n(gy), "class": "eng-fine" });
    return { cx: cx, gy: gy, eaveY: eaveY, apex: apex, tentR: tentR };
  }
  function drawPavilionBase(g, poi, box, accent) {
    var s = pavilionShell(g, box, accent, {});
    // a hanging show-board on the fascia
    add(g, "rect", { x: n(s.cx - box.w * 0.13), y: n(s.eaveY + box.h * 0.10), width: n(box.w * 0.26), height: n(box.h * 0.16), rx: 1.4, "class": "eng fillp" });
    add(g, "line", { x1: n(s.cx - box.w * 0.09), y1: n(s.eaveY + box.h * 0.18), x2: n(s.cx + box.w * 0.09), y2: n(s.eaveY + box.h * 0.18), "class": "eng-fine" });
  }

  // 2 · spinning-chair → THE STAR-FLYER (chair swing): chairs fling out on chains and orbit.
  //     Hero: the crowned pole + splayed chairs; L = Iω made a ride.
  function drawChairSwing(g, poi, box, accent) {
    var uid = "cs" + (_seq++), cx = box.x + box.w / 2, gy = box.y + box.h - box.h * 0.12;
    var topY = box.y + box.h * 0.10, canopyY = box.y + box.h * 0.26, canR = box.w * 0.22;
    groundLine(g, box, gy);
    add(g, "line", { x1: n(cx), y1: n(canopyY), x2: n(cx), y2: n(gy - 2), "class": "eng", "stroke-width": 1.5 });
    // the crown canopy (a small gored cone) + finial flag
    var gores = 8;
    for (var i = 0; i < gores; i++) { var a0 = cx - canR + 2 * canR * i / gores, a1 = cx - canR + 2 * canR * (i + 1) / gores;
      add(g, "path", { d: "M" + n(cx) + " " + n(topY) + " L" + n(a0) + " " + n(canopyY) + " L" + n(a1) + " " + n(canopyY) + " Z", "class": (i % 2 ? "fillp" : "fillp-ink"), stroke: "none" });
      add(g, "line", { x1: n(cx), y1: n(topY), x2: n(a0), y2: n(canopyY), "class": "eng-fine" }); }
    add(g, "path", { d: "M" + n(cx - canR) + " " + n(canopyY) + " Q" + n(cx) + " " + n(topY - 3) + " " + n(cx + canR) + " " + n(canopyY), "class": "eng", "stroke-width": 1.1 });
    flag(g, cx, topY - 1, box.h * 0.10, accent);
    add(g, "circle", { cx: n(cx), cy: n(canopyY - 1), r: 2, "class": "eng fillp" });
    // the orbiting chairs, flung out on chains (elliptical orbit for perspective)
    var orbitRx = box.w * 0.36, orbitRy = box.h * 0.11, hubY = canopyY + box.h * 0.06, NC = 5;
    var ring = add(g, "g", { transform: "translate(" + n(cx) + " " + n(hubY) + ")" });
    // faint spoke arms from the hub out to the chair ring
    for (var k = 0; k < NC; k++) { var ph = k / NC * 2 * Math.PI; add(ring, "line", { x1: 0, y1: 0, x2: n(orbitRx * Math.cos(ph)), y2: n(orbitRy * Math.sin(ph)), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.3 }); }
    for (var c = 0; c < NC; c++) { var phc = c / NC * 2 * Math.PI + 0.4;
      var st = ellipseKF("csw_" + uid + "_" + c, orbitRx, orbitRy, 60, phc);
      var placer = add(ring, "g", { transform: "translate(" + n(st.sx) + " " + n(st.sy) + ")" });
      var mv = anim(placer, "csw_" + uid + "_" + c, 5.2);
      // chain + a little chair with a rider dot
      add(mv, "line", { x1: 0, y1: n(-hubY + canopyY + box.h * 0.02), x2: 0, y2: -1, "class": "eng-fine", opacity: 0.5 });
      add(mv, "path", { d: "M-2.6 -1 h5.2 v3 q0 1.4 -2.6 1.4 q-2.6 0 -2.6 -1.4 z", "class": "eng fillp", "stroke-width": 0.8 });
      add(mv, "circle", { cx: 0, cy: -2.2, r: 1.4, fill: accent, stroke: BRASS, "stroke-width": 0.4 }); }
  }

  // 3 · the-top → THE FERRIS WHEEL: the wheel turns; gondolas stay level (won't fall).
  function drawFerris(g, poi, box, accent) {
    var uid = "fw" + (_seq++), cx = box.x + box.w / 2, gy = box.y + box.h - box.h * 0.12;
    var wy = box.y + box.h * 0.44, R = Math.min(box.w * 0.40, box.h * 0.40);
    groundLine(g, box, gy);
    add(g, "line", { x1: n(cx), y1: n(wy), x2: n(cx - R * 0.6), y2: n(gy), "class": "eng", "stroke-width": 1.4 });
    add(g, "line", { x1: n(cx), y1: n(wy), x2: n(cx + R * 0.6), y2: n(gy), "class": "eng", "stroke-width": 1.4 });
    add(g, "line", { x1: n(cx - R * 0.34), y1: n(wy + (gy - wy) * 0.55), x2: n(cx + R * 0.34), y2: n(wy + (gy - wy) * 0.55), "class": "eng-fine" });
    spinKF("wh_" + uid, 1); spinKF("whR_" + uid, -1);
    var hub = add(g, "g", { transform: "translate(" + n(cx) + " " + n(wy) + ")" });
    var wheel = anim(hub, "wh_" + uid, 9);
    padCenter(wheel, R + 6);
    add(wheel, "circle", { cx: 0, cy: 0, r: n(R), "class": "eng fillp", "stroke-width": 1.3 });
    add(wheel, "circle", { cx: 0, cy: 0, r: n(R - 2.6), "class": "eng-fine" });
    add(wheel, "circle", { cx: 0, cy: 0, r: 2.8, "class": "eng fillp" });
    var NG = 8;
    for (var k = 0; k < NG; k++) { var a = k / NG * 2 * Math.PI, rx = Math.cos(a) * R, ry = Math.sin(a) * R;
      add(wheel, "line", { x1: 0, y1: 0, x2: n(rx), y2: n(ry), "class": "eng-fine" });
      var gp = add(wheel, "g", { transform: "translate(" + n(rx) + " " + n(ry) + ")" });
      var lvl = anim(gp, "whR_" + uid, 9);
      add(lvl, "line", { x1: 0, y1: 0, x2: 0, y2: 2.4, "class": "eng-fine" });
      add(lvl, "path", { d: "M-3.4 2.4 h6.8 v2.8 q0 2.8 -3.4 2.8 q-3.4 0 -3.4 -2.8 z", "class": (k % 2 ? "eng fillp" : "eng fillp-ink"), "stroke-width": 0.85 });
      add(lvl, "circle", { cx: 0, cy: 5, r: 1, fill: accent, stroke: "none" }); }
    for (var s = 0; s < NG * 2; s++) { var aa = s / (NG * 2) * 2 * Math.PI; add(wheel, "circle", { cx: n(Math.cos(aa) * R), cy: n(Math.sin(aa) * R), r: 0.8, fill: accent, stroke: "none", opacity: 0.8 }); }
  }

  // 4 · the-phantom-jam → THE BUMPER RING: a striped pavilion; cars circle the rink.
  function drawBumperTent(g, poi, box, accent) {
    var uid = "bp" + (_seq++);
    var s = pavilionShell(g, box, accent, { r: 0.44, eave: 0.36 });
    var fY = s.gy - box.h * 0.05, fRx = box.w * 0.38, fRy = box.h * 0.10;
    add(g, "ellipse", { cx: n(s.cx), cy: n(fY), rx: n(fRx), ry: n(fRy), "class": "eng-fine" });
    var orbitRx = fRx * 0.72, orbitRy = fRy * 0.82, NC = 4;
    var ring = add(g, "g", { transform: "translate(" + n(s.cx) + " " + n(fY - 3) + ")" });
    for (var c = 0; c < NC; c++) { var ph = c / NC * 2 * Math.PI;
      var st = ellipseKF("bmp_" + uid + "_" + c, orbitRx, orbitRy, 60, ph);
      var placer = add(ring, "g", { transform: "translate(" + n(st.sx) + " " + n(st.sy) + ")" });
      var mv = anim(placer, "bmp_" + uid + "_" + c, 5.4);
      add(mv, "ellipse", { cx: 0, cy: 0, rx: 6, ry: 3.4, "class": "eng fillp", "stroke-width": 0.9 });
      add(mv, "path", { d: "M-2 -0.8 q2 -4 4 0", "class": "eng-fine" });
      add(mv, "circle", { cx: 0.6, cy: -2.2, r: 1.2, fill: accent, stroke: BRASS, "stroke-width": 0.3 });
      add(mv, "line", { x1: 2, y1: -2.6, x2: 2.6, y2: -8, "class": "eng-fine" });
      add(mv, "path", { d: "M2.6 -8 l2.2 0.7 l-2.2 0.7 z", fill: accent, stroke: "none" }); }
  }

  // 5 · warren → THE CROSSING: a checker platform (▦) with a warden lantern on a patrol beat.
  function drawWarren(g, poi, box, accent) {
    var uid = "wr" + (_seq++), gy = box.y + box.h - box.h * 0.14;
    var px = box.x + box.w * 0.10, pw = box.w * 0.80, pyTop = box.y + box.h * 0.34, pfloor = gy - box.h * 0.06;
    groundLine(g, box, gy);
    // a scalloped canvas awning over the game floor
    var awnY = box.y + box.h * 0.14, aStr = 9;
    for (var i = 0; i < aStr; i++) { var xL = px - 3 + (pw + 6) * i / aStr, xR = px - 3 + (pw + 6) * (i + 1) / aStr;
      if (i % 2) hatch(g, E("path", { d: "M" + n(xL) + " " + n(awnY) + " H" + n(xR) + " V" + n(awnY + box.h * 0.09) + " H" + n(xL) + " Z" }), { x: xL, y: awnY, w: xR - xL, h: box.h * 0.1 }, 90, 2.3, 0.30); }
    add(g, "rect", { x: n(px - 3), y: n(awnY), width: n(pw + 6), height: n(box.h * 0.09), "class": "eng", "stroke-width": 1 });
    scallopEdge(g, px - 3, awnY + box.h * 0.09, pw + 6, 11, box.h * 0.05, "eng");
    add(g, "line", { x1: n(px), y1: n(awnY + box.h * 0.09), x2: n(px), y2: n(pfloor), "class": "eng-fine" });
    add(g, "line", { x1: n(px + pw), y1: n(awnY + box.h * 0.09), x2: n(px + pw), y2: n(pfloor), "class": "eng-fine" });
    // the checker crossing floor (in perspective): the ▦ grid
    var cols = 7, rows = 3, cellY = (pfloor - pyTop) / rows;
    for (var rr = 0; rr < rows; rr++) { var yy = pyTop + rr * cellY;
      for (var cc = 0; cc < cols; cc++) { var xx = px + cc * pw / cols;
        if ((rr + cc) % 2 === 0) hatch(g, E("rect", { x: n(xx), y: n(yy), width: n(pw / cols), height: n(cellY) }), { x: xx, y: yy, w: pw / cols, h: cellY }, 45, 2.4, 0.24); } }
    add(g, "rect", { x: n(px), y: n(pyTop), width: n(pw), height: n(pfloor - pyTop), "class": "eng-fine" });
    for (var c2 = 1; c2 < cols; c2++) add(g, "line", { x1: n(px + c2 * pw / cols), y1: n(pyTop), x2: n(px + c2 * pw / cols), y2: n(pfloor), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.4 });
    for (var r2 = 1; r2 < rows; r2++) add(g, "line", { x1: n(px), y1: n(pyTop + r2 * cellY), x2: n(px + pw), y2: n(pyTop + r2 * cellY), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.4 });
    // the WARDEN — a lantern figure patrolling a beat left↔right across the middle row
    var beat = pw - box.w * 0.14, wardY = pyTop + cellY * 1.5;
    var placer = add(g, "g", { transform: "translate(" + n(px + box.w * 0.07) + " " + n(wardY) + ")" });
    // pace back and forth: use a sway on translate via bob (x only), symmetric
    bobKF("wardb_" + uid, beat, 0);
    var mv = anim(placer, "wardb_" + uid, 6);
    add(mv, "line", { x1: 0, y1: -box.h * 0.14, x2: 0, y2: 0, "class": "eng" });
    add(mv, "circle", { cx: 0, cy: n(-box.h * 0.19), r: 2, "class": "eng fillp" });
    add(mv, "circle", { cx: 0, cy: n(-box.h * 0.19), r: 3.4, fill: accent, opacity: 0.28 });     // lantern glow
    add(mv, "path", { d: "M-2.4 " + n(-box.h * 0.14) + " l2.4 -" + n(box.h * 0.05) + " l2.4 " + n(box.h * 0.05) + " z", "class": "eng-fine" });
  }

  // 6 · the-rolling-room → CONVECTION ROLLS: a letterbox cell, hot floor / cold ceiling,
  //     a comb of counter-rotating rolls. Ra_c made a ride.
  function drawConvectionRolls(g, poi, box, accent) {
    var uid = "cv" + (_seq++);
    var mx = box.x + box.w * 0.08, mw = box.w * 0.84, myTop = box.y + box.h * 0.20, mh = box.h * 0.58;
    // cold ceiling plate (indigo) + hot floor plate (glow), framed cell
    add(g, "rect", { x: n(mx), y: n(myTop - box.h * 0.05), width: n(mw), height: n(box.h * 0.05), fill: "rgba(120,150,220,0.22)", stroke: BRASS, "stroke-width": 0.6 });
    add(g, "rect", { x: n(mx), y: n(myTop + mh), width: n(mw), height: n(box.h * 0.055), fill: "rgba(240,140,60,0.30)", stroke: BRASS, "stroke-width": 0.6 });
    add(g, "rect", { x: n(mx), y: n(myTop), width: n(mw), height: n(mh), "class": "eng fillp-ink", "stroke-width": 1.1 });
    // the rolls — alternating spin direction; each a spiral inside its cell
    var rolls = 4, rw = mw / rolls, rcy = myTop + mh / 2, rr = Math.min(rw * 0.42, mh * 0.42);
    spinKF("rollA_" + uid, 1); spinKF("rollB_" + uid, -1);
    for (var i = 0; i < rolls; i++) { var rcx = mx + rw * (i + 0.5), nm = (i % 2 ? "rollA_" : "rollB_") + uid;
      var hub = add(g, "g", { transform: "translate(" + n(rcx) + " " + n(rcy) + ")" });
      var roll = anim(hub, nm, 7);
      padCenter(roll, rr + 1);
      // an engraved involute spiral (the overturning roll)
      var d = "M0 0", steps = 26, turns = 2.2;
      for (var s = 1; s <= steps; s++) { var a = s / steps * turns * 2 * Math.PI, rad = rr * s / steps; d += " L" + n(rad * Math.cos(a)) + " " + n(rad * Math.sin(a)); }
      add(roll, "path", { d: d, "class": "eng-accent", "stroke-width": 0.9, fill: "none" });
      add(roll, "circle", { cx: 0, cy: 0, r: n(rr), "class": "eng-fine" });
      // two chevrons on the rim marking the rotation sense
      add(roll, "path", { d: "M" + n(rr - 2) + " -2 l3 2 l-3 2", "class": "eng", "stroke-width": 0.8, fill: "none" }); }
    // seam ticks between rolls (the up/down-welling boundaries)
    for (var j = 1; j < rolls; j++) add(g, "line", { x1: n(mx + rw * j), y1: n(myTop), x2: n(mx + rw * j), y2: n(myTop + mh), "class": "eng-hatch", "stroke-width": 0.5, opacity: 0.45, "stroke-dasharray": "2 3" });
  }

  // 7 · brazil-nut-box → THE SHAKER JAR: a tall brass-framed glass box of grains, the risen nut.
  function drawShakerJar(g, poi, box, accent) {
    var uid = "bn" + (_seq++), gy = box.y + box.h - box.h * 0.10;
    var jw = box.w * 0.40, jx = box.x + box.w / 2 - jw / 2, jtop = box.y + box.h * 0.10, jh = gy - jtop;
    groundLine(g, box, gy);
    // the whole jar shakes (a small horizontal wobble)
    bobKF("shake_" + uid, box.w * 0.02, 0);
    var jar = anim(g, "shake_" + uid, 0.5);
    // glass box + brass frame
    add(jar, "rect", { x: n(jx), y: n(jtop), width: n(jw), height: n(jh), rx: 1.4, "class": "eng fillp-ink", "stroke-width": 1.3 });
    // the sand bed (hatched fill in the lower ~62%)
    var bedY = jtop + jh * 0.30, bedH = jh - (bedY - jtop) - 2;
    hatch(jar, E("rect", { x: n(jx + 1.5), y: n(bedY), width: n(jw - 3), height: n(bedH) }), { x: jx, y: bedY, w: jw, h: bedH }, 0, 2.4, 0.30);
    // scattered grain motes
    for (var i = 0; i < 10; i++) { var gx = jx + 3 + (jw - 6) * ((i * 0.37) % 1), gyy = bedY + 3 + (bedH - 6) * ((i * 0.61) % 1);
      add(jar, "circle", { cx: n(gx), cy: n(gyy), r: 0.7, "class": "eng-fine" }); }
    // the risen NUT — a big luminous bead at the surface, a comet trail below it
    var nutX = box.x + box.w / 2, nutY = bedY + 2, nutR = Math.min(jw * 0.26, 5.5);
    add(jar, "line", { x1: n(nutX), y1: n(gy - 3), x2: n(nutX), y2: n(nutY), "class": "eng-fine", opacity: 0.4, "stroke-dasharray": "1.4 2.4" });
    add(jar, "circle", { cx: n(nutX), cy: n(nutY), r: n(nutR + 1.6), fill: accent, opacity: 0.22 });
    add(jar, "circle", { cx: n(nutX), cy: n(nutY), r: n(nutR), "class": "eng fillp", "stroke-width": 1 });
    add(jar, "circle", { cx: n(nutX - nutR * 0.3), cy: n(nutY - nutR * 0.3), r: n(nutR * 0.3), fill: accent, stroke: "none", opacity: 0.8 });
    // a hand-grip tab on the jar side (you grab + shake)
    add(jar, "path", { d: "M" + n(jx + jw) + " " + n(jtop + jh * 0.5) + " q6 0 6 5 q0 5 -6 5", "class": "eng-fine", fill: "none" });
  }

  // 8 · daedalus → THE MAZE PLATE: a head-on labyrinth; a glowing clew threads the path.
  function drawMazePlate(g, poi, box, accent) {
    var uid = "mz" + (_seq++);
    var mx = box.x + box.w * 0.10, my = box.y + box.h * 0.12, mw = box.w * 0.80, mh = box.h * 0.72;
    add(g, "rect", { x: n(mx), y: n(my), width: n(mw), height: n(mh), rx: 1.4, "class": "eng fillp", "stroke-width": 1.2 });
    // a deterministic recursive-ish hedge pattern (concentric slots with gaps)
    var rings = 4;
    for (var i = 1; i <= rings; i++) { var ins = i * Math.min(mw, mh) * 0.5 / (rings + 1);
      var rx = mx + ins, ry = my + ins, rw = mw - ins * 2, rh = mh - ins * 2;
      // a rectangle ring with a gap on an alternating side
      var gapSide = i % 4;
      var d = "M" + n(rx) + " " + n(ry) + " ";
      if (gapSide === 0) d += "H" + n(rx + rw * 0.42) + " M" + n(rx + rw * 0.58) + " " + n(ry) + " H" + n(rx + rw); else d += "H" + n(rx + rw);
      d += " V" + n(ry + rh) + " H" + n(rx) + " Z";
      add(g, "path", { d: d, "class": "eng-fine", fill: "none" });
      // interior stubs (the branching hedges)
      add(g, "line", { x1: n(rx + rw * 0.5), y1: n(ry), x2: n(rx + rw * 0.5), y2: n(ry + rh * 0.3), "class": "eng-hatch", "stroke-width": 0.5, opacity: 0.5 }); }
    // the maze mouth
    add(g, "rect", { x: n(mx + mw * 0.44), y: n(my - 1), width: n(mw * 0.12), height: 2.4, fill: "var(--paper)", stroke: "none" });
    // the CLEW — a bright accent thread that marches along a serpentine path (the solve)
    var path = "M" + n(mx + mw * 0.5) + " " + n(my) +
      " V" + n(my + mh * 0.24) + " H" + n(mx + mw * 0.24) + " V" + n(my + mh * 0.5) +
      " H" + n(mx + mw * 0.72) + " V" + n(my + mh * 0.74) + " H" + n(mx + mw * 0.42) +
      " V" + n(my + mh * 0.9);
    add(g, "path", { d: path, "class": "eng-accent", "stroke-width": 0.8, opacity: 0.35, fill: "none" });
    flowKF("clew_" + uid, 12);
    var clew = anim(g, "clew_" + uid, 3.2);
    add(clew, "path", { d: path, "class": "eng-accent anim-stroke", "stroke-width": 1.4, fill: "none", "stroke-dasharray": "3 9", "stroke-linecap": "round" });
    add(clew, "circle", { cx: n(mx + mw * 0.5), cy: n(my), r: 1.6, fill: accent, stroke: "none" });   // Ariadne's clew spool at the mouth
  }

  // 9 · murmuration-meter → THE STARLING FLOCK: an engraved murmuration that wheels.
  function drawStarlingFlock(g, poi, box, accent) {
    var uid = "mm" + (_seq++), gy = box.y + box.h - box.h * 0.10;
    // horizon + a bare tree at the corner (roost)
    add(g, "line", { x1: n(box.x + box.w * 0.04), y1: n(gy), x2: n(box.x + box.w * 0.96), y2: n(gy), "class": "eng-fine" });
    var tx = box.x + box.w * 0.14, ttop = box.y + box.h * 0.42;
    add(g, "line", { x1: n(tx), y1: n(gy), x2: n(tx), y2: n(ttop), "class": "eng" });
    for (var b = 0; b < 4; b++) { var by = ttop + b * box.h * 0.05, ln = box.h * (0.15 - b * 0.02), sgn = (b % 2 ? 1 : -1);
      add(g, "line", { x1: n(tx), y1: n(by), x2: n(tx + sgn * ln), y2: n(by - ln * 0.5), "class": "eng-fine" }); }
    // the flock cloud — a swarm of tiny bird chevrons drawn around (fcx,fcy); the whole
    // cloud wheels (a sway rotate about its own bbox centre ≈ the cloud centre).
    var fcx = box.x + box.w * 0.60, fcy = box.y + box.h * 0.36, fw = box.w * 0.5, fh = box.h * 0.44;
    swayKF("wheel_" + uid, 7);
    var cloud = anim(g, "wheel_" + uid, 8);
    // a lens-shaped density: denser in the middle
    var N = 46;
    for (var i = 0; i < N; i++) {
      var u = (i * 0.6180339887) % 1, v = (i * 0.7548776662) % 1;
      var ang = u * 2 * Math.PI, rad = Math.sqrt(v);
      var bx = fcx + Math.cos(ang) * rad * fw * 0.5, by = fcy + Math.sin(ang) * rad * fh * 0.5;
      var sc = 0.7 + 0.5 * (1 - rad), tilt = (u - 0.5) * 20;
      add(cloud, "path", { d: "M" + n(bx - 2 * sc) + " " + n(by) + " Q" + n(bx) + " " + n(by - 1.4 * sc) + " " + n(bx) + " " + n(by) + " Q" + n(bx) + " " + n(by - 1.4 * sc) + " " + n(bx + 2 * sc) + " " + n(by),
        "class": (rad < 0.4 ? "eng" : "eng-fine"), "stroke-width": (rad < 0.4 ? 0.8 : 0.5), fill: "none", transform: "rotate(" + n(tilt) + " " + n(bx) + " " + n(by) + ")" });
    }
    // the "one mind" reading tick — a small brass needle rail at the foot
    add(g, "line", { x1: n(box.x + box.w * 0.30), y1: n(gy - 2), x2: n(box.x + box.w * 0.70), y2: n(gy - 2), "class": "eng-fine", opacity: 0.4 });
    add(g, "circle", { cx: n(box.x + box.w * 0.66), cy: n(gy - 2), r: 1.3, fill: accent, stroke: "none" });
  }

  // 10 · puzzle-pavilion → THE PUZZLE PAVILION: the pavilion shell + a hanging deduction board.
  function drawPuzzlePavilion(g, poi, box, accent) {
    var uid = "pz" + (_seq++);
    var s = pavilionShell(g, box, accent, { r: 0.40, eave: 0.38 });
    // a hanging deduction board (a small nonogram grid + a pearl loop over it)
    var bw = box.w * 0.30, bh = box.h * 0.22, bx = s.cx - bw / 2, by = s.eaveY + box.h * 0.10;
    add(g, "rect", { x: n(bx), y: n(by), width: n(bw), height: n(bh), rx: 1.2, "class": "eng fillp", "stroke-width": 1 });
    var gc = 4, gr = 3;
    for (var c = 1; c < gc; c++) add(g, "line", { x1: n(bx + bw * c / gc), y1: n(by), x2: n(bx + bw * c / gc), y2: n(by + bh), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.5 });
    for (var r = 1; r < gr; r++) add(g, "line", { x1: n(bx), y1: n(by + bh * r / gr), x2: n(bx + bw), y2: n(by + bh * r / gr), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.5 });
    // filled cells (a proven pattern)
    var fill = [[0, 0], [1, 1], [2, 0], [3, 2], [1, 2]];
    for (var f = 0; f < fill.length; f++) hatch(g, E("rect", { x: n(bx + bw * fill[f][0] / gc), y: n(by + bh * fill[f][1] / gr), width: n(bw / gc), height: n(bh / gr) }), { x: bx + bw * fill[f][0] / gc, y: by + bh * fill[f][1] / gr, w: bw / gc, h: bh / gr }, 45, 1.8, 0.4);
    // the pearl-loop — a closed accent loop that marches (the "draw one loop" verb)
    var loop = "M" + n(bx + bw * 0.18) + " " + n(by + bh * 0.3) + " H" + n(bx + bw * 0.7) + " V" + n(by + bh * 0.7) + " H" + n(bx + bw * 0.18) + " Z";
    flowKF("loop_" + uid, 10);
    var lp = anim(g, "loop_" + uid, 3.6);
    add(lp, "path", { d: loop, "class": "eng-accent", "stroke-width": 1.1, fill: "none", "stroke-dasharray": "2.4 3.6" });
  }

  // 11 · the-heap → THE ASSAYER'S TRAY: a side-on tray with a sand cone at its angle of repose.
  function drawSandHeap(g, poi, box, accent) {
    var uid = "hp" + (_seq++), gy = box.y + box.h - box.h * 0.16;
    var tx = box.x + box.w * 0.12, tw = box.w * 0.76, trayH = box.h * 0.10, trayY = gy;
    // the tray
    add(g, "path", { d: "M" + n(tx - 3) + " " + n(trayY) + " L" + n(tx) + " " + n(trayY + trayH) + " H" + n(tx + tw) + " L" + n(tx + tw + 3) + " " + n(trayY) + "", "class": "eng", "stroke-width": 1.2, fill: "none" });
    // the heap — a symmetric cone at ~34°; hatched fill
    var apex = box.x + box.w / 2, apexY = box.y + box.h * 0.30, baseHW = tw * 0.42;
    var heap = "M" + n(apex - baseHW) + " " + n(trayY) + " L" + n(apex) + " " + n(apexY) + " L" + n(apex + baseHW) + " " + n(trayY) + " Z";
    add(g, "path", { d: heap, "class": "eng fillp", "stroke-width": 1.1 });
    hatch(g, E("path", { d: heap }), { x: apex - baseHW, y: apexY, w: baseHW * 2, h: trayY - apexY }, 34, 2.4, 0.26);
    // the protractor + plumb needle kissing the free face
    add(g, "path", { d: "M" + n(apex) + " " + n(apexY) + " A " + n(baseHW * 0.5) + " " + n(baseHW * 0.5) + " 0 0 1 " + n(apex + baseHW * 0.42) + " " + n(apexY + baseHW * 0.28), "class": "eng-fine", fill: "none", opacity: 0.5 });
    add(g, "line", { x1: n(apex), y1: n(apexY), x2: n(apex), y2: n(apexY + baseHW * 0.5), "class": "eng-fine", opacity: 0.5 });
    add(g, "line", { x1: n(apex), y1: n(apexY), x2: n(apex + baseHW * 0.42), y2: n(trayY), "class": "eng-accent", "stroke-width": 0.9 });
    // a thin trickle of grains cascading down the downhill face (the avalanche)
    var fx = apex + baseHW * 0.5, fy = apexY + (trayY - apexY) * 0.28;
    fallKF("trickle_" + uid, baseHW * 0.42, (trayY - fy) * 0.9);
    for (var k = 0; k < 3; k++) { var tr = anim(g, "trickle_" + uid, 1.6, "animation-delay:" + (k * 0.5) + "s");
      add(tr, "circle", { cx: n(fx - k * 2), cy: n(fy + k * 2), r: 0.9, fill: accent, stroke: "none" }); }
  }

  // 12 · the-level-ride → THE LEVEL RIDE: a plank glides dead level over a tumbling Reuleaux.
  function drawLevelRide(g, poi, box, accent) {
    var uid = "lr" + (_seq++), gy = box.y + box.h - box.h * 0.14;
    add(g, "line", { x1: n(box.x + box.w * 0.05), y1: n(gy), x2: n(box.x + box.w * 0.95), y2: n(gy), "class": "eng-fine" });
    var W = box.w * 0.30;                                  // the constant width == plank height above floor
    var plankY = gy - W;
    // the level plank + a marble that never rolls
    add(g, "rect", { x: n(box.x + box.w * 0.14), y: n(plankY - box.h * 0.045), width: n(box.w * 0.72), height: n(box.h * 0.045), rx: 1, "class": "eng fillp", "stroke-width": 1.1 });
    add(g, "circle", { cx: n(box.x + box.w * 0.5), cy: n(plankY - box.h * 0.045 - 2.2), r: 2.2, fill: accent, stroke: BRASS, "stroke-width": 0.5 });
    // "dead level" rule marks along the plank underside
    for (var t = 0; t <= 4; t++) add(g, "line", { x1: n(box.x + box.w * (0.2 + t * 0.15)), y1: n(plankY), x2: n(box.x + box.w * (0.2 + t * 0.15)), y2: n(plankY + 2), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.5 });
    // the tumbling Reuleaux triangle (width W) under the plank — it rolls, plank stays level
    var rcx = box.x + box.w * 0.5, rR = W;                 // Reuleaux "radius" = width
    spinKF("roll_" + uid, 1);
    var pivot = add(g, "g", { transform: "translate(" + n(rcx) + " " + n(gy - W * 0.5) + ")" });
    var shp = anim(pivot, "roll_" + uid, 6);
    padCenter(shp, W * 0.62);
    // a Reuleaux triangle from three arcs, each centred on the opposite vertex
    var vr = W * 0.577;                                    // circum-radius so width == W
    var V = [];
    for (var i = 0; i < 3; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 3; V.push({ x: vr * Math.cos(a), y: vr * Math.sin(a) }); }
    var d = "M" + n(V[0].x) + " " + n(V[0].y);
    for (var i2 = 0; i2 < 3; i2++) { var to = V[(i2 + 1) % 3]; d += " A " + n(W) + " " + n(W) + " 0 0 1 " + n(to.x) + " " + n(to.y); }
    d += " Z";
    add(shp, "path", { d: d, "class": "eng fillp", "stroke-width": 1.2 });
    // the faint compass-arc guides (the construction) + a hub dot
    for (var i3 = 0; i3 < 3; i3++) add(shp, "line", { x1: 0, y1: 0, x2: n(V[i3].x), y2: n(V[i3].y), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.35 });
    add(shp, "circle", { cx: 0, cy: 0, r: 1.2, fill: accent, stroke: "none" });
  }

  // 13 · the-shepherd → THE FOLD: a brass pen with a gate, a flock, and a working dog.
  function drawShepherdPen(g, poi, box, accent) {
    var uid = "sh" + (_seq++), gy = box.y + box.h - box.h * 0.12;
    // pasture ground
    add(g, "line", { x1: n(box.x + box.w * 0.04), y1: n(gy), x2: n(box.x + box.w * 0.96), y2: n(gy), "class": "eng-fine" });
    rectHatch(g, box.x + box.w * 0.04, box.y + box.h * 0.5, box.w * 0.92, gy - (box.y + box.h * 0.5), 8, 6, 0.06);
    // the brass FOLD (a pen at the right) with a gate gap
    var px = box.x + box.w * 0.62, py = box.y + box.h * 0.30, pw = box.w * 0.30, ph = box.h * 0.48;
    var rail = "M" + n(px) + " " + n(py + ph * 0.34) + " V" + n(py) + " H" + n(px + pw) + " V" + n(py + ph) + " H" + n(px) + " V" + n(py + ph * 0.66);
    add(g, "path", { d: rail, "class": "eng", "stroke-width": 1.3, fill: "none" });
    // pen posts
    for (var t = 0; t <= 4; t++) add(g, "line", { x1: n(px + pw * t / 4), y1: n(py), x2: n(px + pw * t / 4), y2: n(py + ph), "class": "eng-fine", opacity: 0.6 });
    add(g, "circle", { cx: n(px), cy: n(py + ph * 0.5), r: 1.4, fill: accent, stroke: "none" });        // the lit gate post
    // the flock — a scatter of sheep drifting toward the gate (bob), + a dog circling
    var flockX = box.x + box.w * 0.24, flockY = box.y + box.h * 0.58;
    bobKF("drift_" + uid, box.w * 0.05, -box.h * 0.02);
    var herd = anim(g, "drift_" + uid, 5);
    var sheep = [[0, 0], [box.w * 0.08, box.h * 0.06], [box.w * 0.14, -box.h * 0.03], [box.w * 0.05, box.h * 0.12]];
    for (var i = 0; i < sheep.length; i++) drawSheep(herd, flockX + sheep[i][0], flockY + sheep[i][1], accent);
    // the working dog on a small orbit at the flock's left flank
    var dogRx = box.w * 0.10, dogRy = box.h * 0.08;
    var st = ellipseKF("dog_" + uid, dogRx, dogRy, 60, 0);
    var dp = add(g, "g", { transform: "translate(" + n(flockX - box.w * 0.12 + st.sx) + " " + n(flockY + st.sy) + ")" });
    var dog = anim(dp, "dog_" + uid, 4);
    add(dog, "ellipse", { cx: 0, cy: 0, rx: 3, ry: 1.6, fill: accent, stroke: BRASS, "stroke-width": 0.4 });
    add(dog, "circle", { cx: 2.6, cy: -1, r: 1.1, fill: accent, stroke: "none" });
    add(dog, "line", { x1: -3, y1: -0.4, x2: -4.4, y2: -1.8, "class": "eng-fine" });
  }
  function drawSheep(parent, x, y, accent) {
    var s = add(parent, "g", { transform: "translate(" + n(x) + " " + n(y) + ")" });
    add(s, "path", { d: "M-4 0 q-1.4 -3.4 2 -3.6 q0.6 -2.2 3 -2 q2 -0.2 2 1.6 q1.6 0.4 1.2 2.2 q0.2 2.6 -3 2.4 q-1.6 1.4 -3.4 0.2 q-2.4 0.4 -1.4 -3 z", "class": "eng fillp", "stroke-width": 0.7 });
    add(s, "circle", { cx: 3.2, cy: -1.6, r: 1, "class": "eng fillp-ink", "stroke-width": 0.5 });   // head
    add(s, "line", { x1: -2, y1: 1.4, x2: -2.2, y2: 3, "class": "eng-fine" });
    add(s, "line", { x1: 1, y1: 1.6, x2: 1.2, y2: 3.2, "class": "eng-fine" });
  }

  // 14 · the-standing-stones → THE CROMLECH: a trilithon ring silhouette on a field.
  function drawCromlech(g, poi, box, accent) {
    var uid = "st" + (_seq++), gy = box.y + box.h - box.h * 0.12;
    add(g, "line", { x1: n(box.x + box.w * 0.04), y1: n(gy), x2: n(box.x + box.w * 0.96), y2: n(gy), "class": "eng-fine" });
    rectHatch(g, box.x + box.w * 0.04, box.y + box.h * 0.55, box.w * 0.92, gy - (box.y + box.h * 0.55), 8, 6, 0.06);
    // the ring of standing stones (in perspective ellipse) — uprights + one lintel trilithon
    var cx = box.x + box.w * 0.5, cy = box.y + box.h * 0.62, erx = box.w * 0.38, ery = box.h * 0.14;
    var NS = 7;
    for (var i = 0; i < NS; i++) { var a = Math.PI + i / (NS - 1) * Math.PI;          // back arc only (upper)
      var sx = cx + Math.cos(a) * erx, sy = cy + Math.sin(a) * ery;
      var sh = box.h * (0.20 + 0.06 * Math.sin(i)); var sw = box.w * 0.05;
      add(g, "path", { d: "M" + n(sx - sw / 2) + " " + n(sy) + " v" + n(-sh) + " q0 -2 " + n(sw / 2) + " -2 q" + n(sw / 2) + " 0 " + n(sw / 2) + " 2 v" + n(sh) + " z", "class": "eng fillp", "stroke-width": 1 });
      hatch(g, E("rect", { x: n(sx - sw / 2), y: n(sy - sh), width: n(sw), height: n(sh) }), { x: sx - sw / 2, y: sy - sh, w: sw, h: sh }, 80, 2.2, 0.24); }
    // the front trilithon (two uprights + a lintel) — the hero silhouette
    var t1 = cx - box.w * 0.12, t2 = cx + box.w * 0.12, topY = cy - box.h * 0.30, upW = box.w * 0.06;
    [t1, t2].forEach(function (ux) { add(g, "rect", { x: n(ux - upW / 2), y: n(topY), width: n(upW), height: n(cy - topY + ery * 0.5), "class": "eng fillp", "stroke-width": 1.1 });
      hatch(g, E("rect", { x: n(ux - upW / 2), y: n(topY), width: n(upW), height: n(cy - topY) }), { x: ux - upW / 2, y: topY, w: upW, h: cy - topY }, 80, 2.2, 0.26); });
    add(g, "rect", { x: n(t1 - upW * 0.7), y: n(topY - box.h * 0.06), width: n(t2 - t1 + upW * 1.4), height: n(box.h * 0.06), "class": "eng fillp", "stroke-width": 1.1 });
    // a single sheep left over on the field, ambling (the placed-then-release kin)
    bobKF("amble_" + uid, box.w * 0.06, 0);
    var mv = anim(g, "amble_" + uid, 6);
    drawSheep(mv, box.x + box.w * 0.2, cy + box.h * 0.04, accent);
  }

  // 15 · arcade → THE CABINET: an upright coin-op with a glowing hero screen + a vector blip.
  function drawArcadeCabinet(g, poi, box, accent) {
    var uid = "ar" + (_seq++), gy = box.y + box.h - box.h * 0.10;
    add(g, "line", { x1: n(box.x + box.w * 0.06), y1: n(gy), x2: n(box.x + box.w * 0.94), y2: n(gy), "class": "eng-fine" });
    var cw = box.w * 0.44, cx = box.x + box.w / 2 - cw / 2, ctop = box.y + box.h * 0.08, chh = gy - ctop;
    // cabinet body (a raked upright with a marquee, screen, control panel)
    add(g, "path", { d: "M" + n(cx) + " " + n(gy) + " V" + n(ctop + chh * 0.16) + " L" + n(cx + cw * 0.14) + " " + n(ctop) + " H" + n(cx + cw * 0.86) + " L" + n(cx + cw) + " " + n(ctop + chh * 0.16) + " V" + n(gy) + " Z", "class": "eng fillp", "stroke-width": 1.3 });
    // marquee band (lit)
    add(g, "rect", { x: n(cx + cw * 0.12), y: n(ctop + chh * 0.03), width: n(cw * 0.76), height: n(chh * 0.12), rx: 0.8, fill: accent, opacity: 0.24, stroke: BRASS, "stroke-width": 0.6 });
    // the SCREEN — a glowing hero screen with a bouncing vector blip
    var sx = cx + cw * 0.14, sy = ctop + chh * 0.22, sw = cw * 0.72, sh = chh * 0.42;
    add(g, "rect", { x: n(sx), y: n(sy), width: n(sw), height: n(sh), rx: 1, "class": "eng fillp-ink", "stroke-width": 1 });
    add(g, "rect", { x: n(sx + 0.5), y: n(sy + 0.5), width: n(sw - 1), height: n(sh - 1), fill: accent, opacity: 0.12, stroke: "none" });
    // a couple of static vector blocks (a breakout wall) + the moving blip
    for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) add(g, "rect", { x: n(sx + 2 + c * (sw - 4) / 4), y: n(sy + 2 + r * 3), width: n((sw - 4) / 4 - 1), height: 2, fill: accent, opacity: 0.5, stroke: "none" });
    coasterKF("blip_" + uid, [{ x: 0, y: 0 }, { x: sw * 0.5, y: sh * 0.4 }, { x: sw * 0.2, y: sh * 0.7 }, { x: sw * 0.7, y: sh * 0.55 }, { x: 0, y: 0 }]);
    var bp = add(g, "g", { transform: "translate(" + n(sx + sw * 0.2) + " " + n(sy + sh * 0.3) + ")" });
    var blip = anim(bp, "blip_" + uid, 4);
    add(blip, "rect", { x: -1.1, y: -1.1, width: 2.2, height: 2.2, fill: accent, stroke: "none" });
    // control panel + coin slot + joystick
    add(g, "rect", { x: n(sx), y: n(sy + sh + chh * 0.04), width: n(sw), height: n(chh * 0.1), "class": "eng-fine" });
    add(g, "circle", { cx: n(cx + cw * 0.34), cy: n(sy + sh + chh * 0.09), r: 1.6, "class": "eng fillp" });
    add(g, "line", { x1: n(cx + cw * 0.34), y1: n(sy + sh + chh * 0.09), x2: n(cx + cw * 0.34), y2: n(sy + sh + chh * 0.04), "class": "eng" });
    add(g, "circle", { cx: n(cx + cw * 0.34), cy: n(sy + sh + chh * 0.03), r: 1, fill: accent, stroke: "none" });
    add(g, "rect", { x: n(cx + cw * 0.58), y: n(sy + sh + chh * 0.06), width: n(cw * 0.08), height: n(chh * 0.04), fill: "none", stroke: BRASS, "stroke-width": 0.5 });  // coin slot
  }

  // FALLBACK — the current-style emoji-on-tile (what an un-registered POI still gets).
  function drawEmojiTile(g, poi, box, accent) {
    var cx = box.x + box.w / 2, cy = box.y + box.h / 2, r = Math.min(box.w, box.h);
    add(g, "circle", { cx: n(cx), cy: n(cy), r: n(r * 0.30), "class": "child-kindle", fill: accent, opacity: 0.14 });
    var s = r * 0.44;
    add(g, "rect", { x: n(cx - s / 2), y: n(cy - s / 2), width: n(s), height: n(s), rx: 3, "class": "eng-fine", opacity: 0.4 });
    var t = add(g, "text", { x: n(cx), y: n(cy + box.h * 0.11), "text-anchor": "middle", "class": "child-glyph",
      style: "font-size:" + n(r * 0.34) + "px" });
    t.textContent = (poi && poi.glyph) || "◇";
  }

  /* ════════════ THE PER-POI CHILD-SCENE REGISTRY (the reusable hook) ════════════ */
  var childScenes = {
    // literal rides
    "midway": drawCoaster,
    "the-phantom-jam": drawBumperTent,
    "the-top": drawFerris,
    "spinning-chair": drawChairSwing,
    "the-level-ride": drawLevelRide,
    "arcade": drawArcadeCabinet,
    // the abstract amusements, honoured at the fairground register
    "warren": drawWarren,
    "the-rolling-room": drawConvectionRolls,
    "brazil-nut-box": drawShakerJar,
    "the-heap": drawSandHeap,
    "daedalus": drawMazePlate,
    "murmuration-meter": drawStarlingFlock,
    "puzzle-pavilion": drawPuzzlePavilion,
    "the-shepherd": drawShepherdPen,
    "the-standing-stones": drawCromlech,
    // ── footprint-tier fallbacks (a future detach:true child inherits by footprint) ──
    "fp:pavilion": drawPavilionBase
  };
  var SCENE_LABEL = {
    drawCoaster: "coaster trestle", drawBumperTent: "bumper ring", drawFerris: "ferris wheel",
    drawChairSwing: "star-flyer", drawLevelRide: "level ride", drawArcadeCabinet: "arcade cabinet",
    drawWarren: "the crossing", drawConvectionRolls: "convection rolls", drawShakerJar: "shaker jar",
    drawSandHeap: "assayer's tray", drawMazePlate: "maze plate", drawStarlingFlock: "starling flock",
    drawPuzzlePavilion: "puzzle pavilion", drawShepherdPen: "the fold", drawCromlech: "the cromlech",
    drawPavilionBase: "show pavilion"
  };

  // resolve(id) — the TWO-TIER lookup: id first, then footprint tier (fp:<footprint>).
  function resolveScene(poi) {
    return childScenes[poi.id] || (poi.footprint ? childScenes["fp:" + poi.footprint] : null) || null;
  }

  // drawChildScene(g, poi, box, accent) — the hook the child map calls per amusement.
  //   On a HIT: draw the engraved scene, flush its keyframes, return {kind:'scene', label}.
  //   On a MISS or a THROWN scene: clear any partial art and draw the emoji tile → {kind:'emoji'}.
  function drawChildScene(g, poi, box, accent) {
    _kf = [];
    accent = accent || (poi && poi.accent) || "#c9a24a";
    var fn = resolveScene(poi || {});
    if (fn) {
      try {
        fn(g, poi, box, accent);
        flushKF();
        return { kind: "scene", label: (SCENE_LABEL[fn.name] || fn.name), fn: fn.name };
      } catch (err) {
        _kf = [];
        while (g.firstChild) g.removeChild(g.firstChild);   // never a cluttered half-scene
        if (typeof console !== "undefined" && console.warn) console.warn("[GateArt] child-scene threw for " + (poi && poi.id) + ":", err && err.message);
      }
    }
    drawEmojiTile(g, poi, box, accent);
    return { kind: "emoji", label: "emoji-tile fallback" };
  }

  window.GateArt = window.GateArt || {};
  window.GateArt.drawFace = drawFace;
  window.GateArt.drawMidway = drawMidway;
  window.GateArt.childScenes = childScenes;
  window.GateArt.resolveScene = resolveScene;
  window.GateArt.drawChildScene = drawChildScene;
  window.GateArt.drawEmojiTile = drawEmojiTile;
})();
