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

  window.GateArt = window.GateArt || {};
  window.GateArt.drawFace = drawFace;
  window.GateArt.drawMidway = drawMidway;
})();
