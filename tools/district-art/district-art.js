/* ════════════════════════════════════════════════════════════════════════════
   district-art.js — §5.2 THE DISTRICT ART, the estate-tier forged reps (the #411
   fairground-gate idiom promoted estate-wide).

   This module installs `window.DistrictArt`, the art the estate-tier LOD looks for when
   it draws each district's STRUCTURE (the engraved building the fit-view reads as a place,
   the visible half of the "buildings-with-souls" cure). It mirrors GateArt's proven
   architecture exactly (a registry of bespoke scenes + a never-blank procedural fallback +
   a self-contained draw entry), so the rich foundry-forged reps are a pure drop-in and the
   page is fully testable WITHOUT them.

   ── THE THREE-TIER FALLBACK (§5.2) ──
     1. a BESPOKE SCENE  — districtScenes[<districtId>]. At T3.2 (foundry PREP) the 8 district
        reps are registered as STUBS that provisionally draw the monogram (§5.3); the ART FOUNDRY
        forges each bespoke scene into its stub body at T3.3 (siblings byte-identical).
     2. the MONOGRAM PLINTH — this module's own procedural never-blank fallback: an engraved
        district initial on a tiered plinth + a faint hull etch. Drawn whenever no scene is
        registered (or a scene throws). NEVER blank.
     3. a PLAIN TINT HULL — the PAGE's inline drawDistrictPlaceholder, used only if this whole
        module is absent or drawDistrict throws outright (the same drop-in guarantee gate-art
        gives drawFace).

   ── THE API (append SVG into the given <g>; SVG namespace; viewBox units) ──

     window.DistrictArt.drawDistrict(g, district, box, accent) → {kind, label}
       g        — an SVG <g class="district-rep"> already in the DOM (in #structures); append
                  into it. The page sets `--c:<accent>` on the group so `.eng-accent`/`.fillp`
                  resolve the district accent; the module does NOT set the group transform.
       district — { id, label, accent } — the district being drawn (id keys the registry).
       box      — { x, y, w, h, cx, cy } the DRAWN (display-clamped) structure box in viewBox
                  units (~[110,260]px). A scene fills the box; leave the FOOT clear — the PAGE
                  draws the depth tally there (§5.5, as it draws the "15 AMUSEMENTS" teaser).
       accent   — the district accent hex (threaded as `--c` by the page; scenes may re-use it).
       RETURNS  — { kind:'scene'|'monogram', label } — the liveness handle the page mirrors
                  onto the group as data-district-art. On a registered HIT: draw the scene, flush
                  its @keyframes, and report the scene's OWN returned kind (default 'scene'; a T3.2
                  provisional stub draws + returns the monogram, so it reports 'monogram'
                  truthfully). On a MISS or a THROWN scene: clear any partial art and draw the
                  monogram plinth → {kind:'monogram'}.

   Art direction: the estate's brass-stroke-on-ink hand (brass #c9a24a strokes, accent-tinted
   paper fills) at an ESTATE register — calm at rest, an `.anim` group runs only when its
   `.district-rep` is hovered / focused / given the `.awake` liveness hook; reduced motion holds
   the rich static frame. Scenes are built to tools/district-art/art-specs/ (W3.3).
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  var BRASS = "#c9a24a";
  // a tiny local element factory (this module runs in page scope but is SELF-CONTAINED — it
  // does NOT depend on the page's `el`/`roundRectPath`/`r01`, so the placeholder/forged swap
  // is clean and the module tests headless without the page).
  function E(n, a) {
    var e = document.createElementNS(SVGNS, n);
    for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    return e;
  }
  function n(v) { return Math.round(v * 100) / 100; }   // keep path data tidy
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return "M" + n(x + r) + " " + n(y) + " H" + n(x + w - r) +
      " A" + n(r) + " " + n(r) + " 0 0 1 " + n(x + w) + " " + n(y + r) + " V" + n(y + h - r) +
      " A" + n(r) + " " + n(r) + " 0 0 1 " + n(x + w - r) + " " + n(y + h) + " H" + n(x + r) +
      " A" + n(r) + " " + n(r) + " 0 0 1 " + n(x) + " " + n(y + h - r) + " V" + n(y + r) +
      " A" + n(r) + " " + n(r) + " 0 0 1 " + n(x + r) + " " + n(y) + " Z";
  }
  // ── scene drawing helpers (the estate's shading + hit-catch hand) ────────────
  var _uid = 0;                                    // unique clip ids for engraved hatching
  // a diagonal engraved HATCH filling a rect region (clipped) — the estate's shading hand.
  function hatch(g, x, y, w, h, gap, deg, op) {
    var id = "dah" + (_uid++);
    var cp = E("clipPath", { id: id });
    cp.appendChild(E("rect", { x: n(x), y: n(y), width: n(w), height: n(h) }));
    g.appendChild(cp);
    var wrap = E("g", { "clip-path": "url(#" + id + ")" });
    var rad = deg * Math.PI / 180, dx = Math.cos(rad), dy = Math.sin(rad), nx = -dy, ny = dx;
    var cx = x + w / 2, cy = y + h / 2, L = Math.abs(w) + Math.abs(h);
    for (var s = -L; s <= L; s += gap) {
      var mx = cx + nx * s, my = cy + ny * s;
      wrap.appendChild(E("line", { x1: n(mx - dx * L), y1: n(my - dy * L), x2: n(mx + dx * L), y2: n(my + dy * L),
        "class": "eng-hatch", "stroke-width": 0.4, opacity: (op != null ? op : 0.35) }));
    }
    g.appendChild(wrap);
    return wrap;
  }
  // the full-box transparent-but-PAINTED hit surface. SVG hit-tests PAINTED pixels, and a scene is
  // mostly thin brass strokes over negative space, so a real pointer click in a gap would fall
  // THROUGH the .district-rep <g> and miss (or be stolen by #sheet). A fill of rgba(0,0,0,0) is
  // painted (fill != none), so the whole box catches — gate-art's proven .gate-hit under-paint,
  // the standing #369/#376 house lesson. FIRST in paint order so it under-paints the art.
  function hitRect(g, box) {
    g.appendChild(E("rect", { x: n(box.x), y: n(box.y), width: n(box.w), height: n(box.h),
      fill: "rgba(0,0,0,0)", stroke: "none", "class": "struct-hit" }));
  }

  // ── THE ANIMATION GRAMMAR (mirrors gate-art.js) ──────────────────────────────
  // A scene's motion is a generated-to-match @keyframes injected once per build into a shared
  // style tag, and is CALM AT REST — the `.district-rep .anim` CSS holds play-state paused
  // until the rep wakes. Scenes push rules while they draw; drawDistrict flushes them on a hit.
  var _kf = [];               // rules collected while the current scene draws
  var _kfStyle = null;
  function kfSheet() {
    if (!_kfStyle || !_kfStyle.isConnected) {
      _kfStyle = document.createElement("style");
      _kfStyle.setAttribute("data-district-art-kf", "");
      (document.head || document.documentElement).appendChild(_kfStyle);
    }
    return _kfStyle;
  }
  function flushKF() { if (_kf.length) { kfSheet().textContent += "\n" + _kf.join("\n"); _kf.length = 0; } }
  // the standard KF verbs a scene binds to an `.anim` group (name is the scene's to choose):
  function spinKF(name, dir) { _kf.push("@keyframes " + name + "{from{transform:rotate(0)}to{transform:rotate(" + (dir < 0 ? -360 : 360) + "deg)}}"); return name; }
  function bobKF(name, ax, ay) { _kf.push("@keyframes " + name + "{0%,100%{transform:translate(0,0)}50%{transform:translate(" + n(ax) + "px," + n(ay) + "px)}}"); return name; }
  function swayKF(name, deg) { _kf.push("@keyframes " + name + "{0%,100%{transform:rotate(" + n(-deg) + "deg)}50%{transform:rotate(" + n(deg) + "deg)}}"); return name; }
  function flowKF(name, d) { _kf.push("@keyframes " + name + "{from{stroke-dashoffset:0}to{stroke-dashoffset:" + n(-d) + "}}"); return name; }
  // helper: an `.anim` <g> bound to a keyframes name (longhands so the `.anim` class's
  // paused-at-rest / infinite / linear still apply — never a shorthand that would override).
  function animGroup(name, dur, extra) {
    return E("g", { "class": "anim", style: "animation-name:" + name + ";animation-duration:" + dur + "s" + (extra ? (";" + extra) : "") });
  }

  // ── TIER 2: THE MONOGRAM PLINTH (the module's own never-blank fallback) ───────
  // Procedural: a tiered plinth + inner rule, an engraved district INITIAL, and a faint hull
  // etch (a low ground-line beneath the letter). Uses the SAME classes the page has always
  // styled (.struct-plinth/.struct-plinth-inner/.struct-mono) so the promoted monogram is
  // pixel-identical to the placeholder T1.3 shipped; the hull etch is a light .eng-fine add.
  // The FOOT is left clear — the page seats the depth tally there.
  function initialOf(district) {
    var s = (district && (district.label || district.id)) || "";
    return s.replace(/^THE\s+/i, "").charAt(0).toUpperCase() || "·";
  }
  function drawMonogram(g, district, box, accent) {
    var x = box.x, y = box.y, w = box.w, h = box.h;
    var cx = (box.cx != null) ? box.cx : x + w / 2;
    var cy = (box.cy != null) ? box.cy : y + h / 2;
    g.appendChild(E("path", { d: roundRect(x, y, w, h, 10), "class": "struct-plinth" }));
    g.appendChild(E("path", { d: roundRect(x + 7, y + 7, w - 14, h - 14, 7), "class": "struct-plinth-inner" }));
    // a faint engraved hull etch — a ground line the initial rests on (the §5.2 "hull etch").
    var gy = n(y + h * 0.62);
    g.appendChild(E("line", { x1: n(x + w * 0.24), y1: gy, x2: n(x + w * 0.76), y2: gy, "class": "eng-fine" }));
    var t = E("text", { x: n(cx), y: n(cy - 6), "text-anchor": "middle", "class": "struct-mono" });
    t.textContent = initialOf(district);
    g.appendChild(t);
    return { kind: "monogram", label: initialOf(district) + " monogram" };
  }

  // ── THE REGISTRY (§5.3) ──────────────────────────────────────────────────────
  // Keyed by districtId → the scene draw fn. At T3.2 (foundry PREP) it holds the 8
  // district-rep STUBS below (the deterministic "registry entry + stub fn" wiring of §5.3,
  // the rep-spec 3-edit pattern adapted to this module). Each stub PROVISIONALLY draws the
  // honest MONOGRAM PLINTH — so the page is never blank and reads exactly as it did before,
  // and `data-district-art` truthfully reports "monogram" — until the ART FOUNDRY forges the
  // bespoke scene into that ONE function body at T3.3 (every sibling stays byte-identical, the
  // proven foundry operation). manor / fairground / gatehouse / gate-lodge are NOT district
  // structures (the page draws their own bespoke art), so they are not registered here.
  var districtScenes = {};

  // ── THE 8 DISTRICT-REP STUBS (T3.2 scaffold — foundry-elevated at T3.3) ──────
  // The foundry batch forges each asset by replacing ONLY the matching drawRep* body with the
  // §5.3 scene; the stub's provisional body is the never-blank monogram, so any un-forged rep
  // still reads. A forged scene returns { label } (or { kind:'scene', label }); drawDistrict
  // reports the returned kind, so these stubs honestly read 'monogram' until then.
  // Each fills its display-clamped hull, leaves the FOOT clear for the page tally, under-paints a
  // transparent hit surface (real clicks catch in negative space), and keeps its motion in a single
  // quiet .anim group (paused until the rep wakes; reduced-motion holds). A scene returns { label }
  // so drawDistrict reports kind:'scene'. rep-number stays the honest monogram — the gate-dom
  // platewalk drives it as the estate's live monogram-fallback exemplar (§5.4), so a monogram is
  // always present in the built DOM for that gate to prove the never-blank fallback path.

  function drawRepWorks(g, district, box, accent) {        // rep-works — the working yard (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, gy = y + h * 0.80;
    hitRect(g, box);
    g.appendChild(E("line", { x1: n(x + w * 0.03), y1: n(gy), x2: n(x + w * 0.97), y2: n(gy), "class": "eng-fine" }));
    // the dressed-ashlar ARCH (left) — two piers + a round arch + a keystone tick
    var pL = x + w * 0.07, pR = x + w * 0.245, pW = w * 0.04, spring = y + h * 0.44, top = y + h * 0.24, mid = (pL + pR + pW) / 2;
    [pL, pR].forEach(function (px) { g.appendChild(E("path", { d: roundRect(px, spring, pW, gy - spring, 1), "class": "eng fillp", "stroke-width": 1 })); });
    g.appendChild(E("path", { d: "M" + n(pL) + " " + n(spring) + " Q" + n(pL) + " " + n(top) + " " + n(mid) + " " + n(top) + " Q" + n(pR + pW) + " " + n(top) + " " + n(pR + pW) + " " + n(spring), "class": "eng", "stroke-width": 1.1, fill: "none" }));
    g.appendChild(E("path", { d: "M" + n(mid - 2) + " " + n(top) + " l4 0 l-1 4 l-2 0 z", "class": "eng", "stroke-width": 0.8, fill: "none" }));
    // a gantry CRANE over a casting PIT (centre)
    var gL = x + w * 0.40, gR = x + w * 0.56, gTop = y + h * 0.22;
    g.appendChild(E("line", { x1: n(gL), y1: n(gy), x2: n(gL), y2: n(gTop), "class": "eng", "stroke-width": 1 }));
    g.appendChild(E("line", { x1: n(gR), y1: n(gy), x2: n(gR), y2: n(gTop), "class": "eng", "stroke-width": 1 }));
    g.appendChild(E("line", { x1: n(gL - 3), y1: n(gTop), x2: n(gR + 3), y2: n(gTop), "class": "eng", "stroke-width": 1.2 }));
    g.appendChild(E("line", { x1: n(gL), y1: n(gy), x2: n(gR), y2: n(gTop), "class": "eng-hatch", "stroke-width": 0.5, opacity: 0.5 }));
    var hx = x + w * 0.48;
    g.appendChild(E("line", { x1: n(hx), y1: n(gTop), x2: n(hx), y2: n(y + h * 0.58), "class": "eng-fine" }));
    var px0 = x + w * 0.42, px1 = x + w * 0.54;
    g.appendChild(E("path", { d: "M" + n(px0) + " " + n(gy) + " L" + n(px0 + w * 0.02) + " " + n(gy - h * 0.06) + " H" + n(px1 - w * 0.02) + " L" + n(px1) + " " + n(gy) + " Z", fill: "rgba(255,150,60,0.28)", stroke: accent, "stroke-width": 0.7 }));
    // the two CHIMNEYS (right), one smoking a drifting ribbon
    var c1 = x + w * 0.66, c2 = x + w * 0.80, cW = w * 0.05, cTop = y + h * 0.16;
    [c1, c2].forEach(function (cx0) {
      g.appendChild(E("path", { d: roundRect(cx0, cTop, cW, gy - cTop, 1), "class": "eng fillp", "stroke-width": 1 }));
      g.appendChild(E("rect", { x: n(cx0 - 1), y: n(cTop), width: n(cW + 2), height: n(h * 0.02), "class": "eng", "stroke-width": 0.8, fill: "none" }));
      hatch(g, cx0, cTop + h * 0.04, cW, gy - cTop - h * 0.04, 3.2, 0, 0.3);
    });
    var sx = c1 + cW / 2, sTop = cTop - 1;
    flowKF("worksSmoke", 20);
    var sg = animGroup("worksSmoke", 5);
    sg.appendChild(E("path", { d: "M" + n(sx) + " " + n(sTop) + " q" + n(-w * 0.03) + " " + n(-h * 0.05) + " " + n(w * 0.01) + " " + n(-h * 0.10) + " q" + n(w * 0.03) + " " + n(-h * 0.05) + " " + n(-w * 0.01) + " " + n(-h * 0.10),
      "class": "eng-accent", "stroke-width": 1, fill: "none", "stroke-dasharray": "2.5 3.5", opacity: 0.7 }));
    g.appendChild(sg);
    // the LODESTONE coil on a plinth (front-right)
    var lx = x + w * 0.90, ly = y + h * 0.62;
    g.appendChild(E("rect", { x: n(lx - w * 0.05), y: n(ly + h * 0.06), width: n(w * 0.10), height: n(h * 0.05), "class": "eng fillp", "stroke-width": 0.8 }));
    g.appendChild(E("path", { d: "M" + n(lx - w * 0.035) + " " + n(ly + h * 0.06) + " V" + n(ly) + " a" + n(w * 0.035) + " " + n(w * 0.035) + " 0 0 1 " + n(w * 0.07) + " 0 V" + n(ly + h * 0.06), "class": "eng-accent", "stroke-width": 1.2, fill: "none" }));
    g.appendChild(E("path", { d: "M" + n(lx - w * 0.018) + " " + n(ly + h * 0.06) + " V" + n(ly + h * 0.012) + " a" + n(w * 0.018) + " " + n(w * 0.018) + " 0 0 1 " + n(w * 0.036) + " 0 V" + n(ly + h * 0.06), "class": "eng-accent", "stroke-width": 1, fill: "none", opacity: 0.7 }));
    return { label: "the working yard" };
  }

  function drawRepGardens(g, district, box, accent) {       // rep-gardens — the glasshouse range (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, gy = y + h * 0.80;
    hitRect(g, box);
    g.appendChild(E("line", { x1: n(x + w * 0.03), y1: n(gy), x2: n(x + w * 0.97), y2: n(gy), "class": "eng-fine" }));
    var houses = 3, hw = w * 0.26, gap = w * 0.03, x0 = x + w * 0.06, body = y + h * 0.44, vh = h * 0.20;
    for (var i = 0; i < houses; i++) {
      var hx = x0 + i * (hw + gap);
      // barrel-vault glass house — the vault roof + body
      g.appendChild(E("path", { d: "M" + n(hx) + " " + n(body) + " Q" + n(hx + hw / 2) + " " + n(body - vh) + " " + n(hx + hw) + " " + n(body) + " V" + n(gy) + " H" + n(hx) + " Z", "class": "eng fillp", "stroke-width": 1 }));
      g.appendChild(E("line", { x1: n(hx), y1: n(body), x2: n(hx + hw), y2: n(body), "class": "eng-fine" }));
      // glazing bars rising toward the ridge
      for (var b = 1; b < 4; b++) {
        var bt = body - vh * (1 - Math.abs(b / 4 - 0.5) * 1.4);
        g.appendChild(E("line", { x1: n(hx + hw * b / 4), y1: n(bt), x2: n(hx + hw * b / 4), y2: n(gy), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.55 }));
      }
      // a roof finial + a potting table along the front
      g.appendChild(E("line", { x1: n(hx + hw / 2), y1: n(body - vh), x2: n(hx + hw / 2), y2: n(body - vh - h * 0.05), "class": "eng", "stroke-width": 0.8 }));
      g.appendChild(E("circle", { cx: n(hx + hw / 2), cy: n(body - vh - h * 0.055), r: 1.2, fill: accent, stroke: "none" }));
      g.appendChild(E("line", { x1: n(hx + hw * 0.15), y1: n(gy - h * 0.04), x2: n(hx + hw * 0.85), y2: n(gy - h * 0.04), "class": "eng-fine", opacity: 0.6 }));
    }
    // the weather-vane cloud turning over the third house
    var vx = x0 + 2 * (hw + gap) + hw / 2, vy = y + h * 0.16;
    g.appendChild(E("line", { x1: n(vx), y1: n(y + h * 0.24), x2: n(vx), y2: n(vy), "class": "eng", "stroke-width": 0.8 }));
    swayKF("gardVane", 26);
    var va = animGroup("gardVane", 7);
    va.appendChild(E("path", { d: "M-7 0 H6 M6 0 l-3 -2 M6 0 l-3 2 M-7 0 l2 -2 M-7 0 l2 2", "class": "eng-accent", "stroke-width": 1, fill: "none" }));
    var vpiv = E("g", { transform: "translate(" + n(vx) + " " + n(vy) + ")" });
    vpiv.appendChild(va); g.appendChild(vpiv);
    return { label: "the glasshouse range" };
  }

  function drawRepObservatory(g, district, box, accent) {   // rep-observatory — the rise + dome (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, cx = x + w * 0.5, gy = y + h * 0.82;
    hitRect(g, box);
    // the stepped RISE — nested contour rings climbing to the summit
    var rings = 5, baseY = gy, peakY = y + h * 0.40;
    for (var i = 0; i < rings; i++) {
      var t = i / (rings - 1), ry = baseY - (baseY - peakY) * t, rw = w * (0.46 - 0.30 * t);
      g.appendChild(E("path", { d: "M" + n(cx - rw) + " " + n(ry) + " Q" + n(cx) + " " + n(ry - h * 0.03) + " " + n(cx + rw) + " " + n(ry), "class": (i === 0 ? "eng" : "eng-fine"), "stroke-width": (i === 0 ? 1 : 0.6), fill: "none", opacity: (i === 0 ? 1 : 0.6) }));
    }
    // the DOME crowning the summit (two quadratics = an unambiguous up-bulge)
    var domeCy = peakY, domeR = w * 0.14;
    g.appendChild(E("path", { d: "M" + n(cx - domeR) + " " + n(domeCy) + " Q" + n(cx - domeR) + " " + n(domeCy - domeR * 1.25) + " " + n(cx) + " " + n(domeCy - domeR) + " Q" + n(cx + domeR) + " " + n(domeCy - domeR * 1.25) + " " + n(cx + domeR) + " " + n(domeCy) + " Z", "class": "eng fillp", "stroke-width": 1.1 }));
    // the open observing SLIT + a tilted refractor + a base band
    g.appendChild(E("path", { d: "M" + n(cx - 2) + " " + n(domeCy) + " L" + n(cx - 3) + " " + n(domeCy - domeR * 0.85) + " L" + n(cx + 3) + " " + n(domeCy - domeR * 0.85) + " L" + n(cx + 2) + " " + n(domeCy) + " Z", "class": "eng fillp-ink", "stroke-width": 0.7 }));
    g.appendChild(E("line", { x1: n(cx), y1: n(domeCy - domeR * 0.4), x2: n(cx + domeR * 1.3), y2: n(domeCy - domeR * 1.5), "class": "eng-accent", "stroke-width": 1.4 }));
    g.appendChild(E("circle", { cx: n(cx + domeR * 1.3), cy: n(domeCy - domeR * 1.5), r: 1.5, fill: accent, stroke: "none" }));
    g.appendChild(E("line", { x1: n(cx - domeR - 1), y1: n(domeCy), x2: n(cx + domeR + 1), y2: n(domeCy), "class": "eng", "stroke-width": 1 }));
    // the small ORRERY finial — a ring + bead turning on wake, on a post beside the dome
    var ox = x + w * 0.74, oy = y + h * 0.30;
    g.appendChild(E("line", { x1: n(ox), y1: n(oy), x2: n(ox), y2: n(oy + h * 0.10), "class": "eng-fine" }));
    spinKF("obsOrrery", 1);
    var oa = animGroup("obsOrrery", 9);
    oa.appendChild(E("circle", { cx: 0, cy: 0, r: n(w * 0.05), "class": "eng", "stroke-width": 0.7, fill: "none" }));
    oa.appendChild(E("circle", { cx: n(w * 0.05), cy: 0, r: 1.5, fill: accent, stroke: "none" }));
    oa.appendChild(E("circle", { cx: 0, cy: 0, r: 1, fill: accent, stroke: "none" }));
    var opiv = E("g", { transform: "translate(" + n(ox) + " " + n(oy) + ")" });
    opiv.appendChild(oa); g.appendChild(opiv);
    return { label: "the observatory rise" };
  }

  function drawRepPromenades(g, district, box, accent) {    // rep-promenades — the crescent walk (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, cx = x + w * 0.5, gy = y + h * 0.74;
    hitRect(g, box);
    g.appendChild(E("line", { x1: n(x + w * 0.04), y1: n(gy), x2: n(x + w * 0.96), y2: n(gy), "class": "eng-fine" }));
    // the colonnade ARC — a shallow arc with slim columns dropping to the walk
    var top = y + h * 0.20, ncol = 7, cw = w * 0.66, cx0 = cx - cw / 2, arc = "M" + n(cx0) + " " + n(top + h * 0.10);
    for (var s = 0; s <= 10; s++) { var at = s / 10, ax = cx0 + cw * at, ay = top + h * 0.10 - Math.sin(Math.PI * at) * h * 0.10; arc += " L" + n(ax) + " " + n(ay); }
    g.appendChild(E("path", { d: arc, "class": "eng", "stroke-width": 1, fill: "none" }));
    for (var c = 0; c < ncol; c++) { var ct = c / (ncol - 1), colx = cx0 + cw * ct, coly = top + h * 0.10 - Math.sin(Math.PI * ct) * h * 0.10;
      g.appendChild(E("line", { x1: n(colx), y1: n(coly), x2: n(colx), y2: n(gy), "class": "eng-fine", "stroke-width": 0.7, opacity: 0.7 })); }
    // twelve diminishing procession stones receding toward the centre (perspective)
    for (var p = 0; p < 12; p++) { var side = (p % 2) ? 1 : -1, k = Math.floor(p / 2), pt = k / 5;
      var stx = cx + side * (w * 0.06 + w * 0.36 * pt), sty = gy - 2, sr = 1.6 + 2.2 * pt;
      g.appendChild(E("ellipse", { cx: n(stx), cy: n(sty), rx: n(sr), ry: n(sr * 0.5), "class": "eng fillp", "stroke-width": 0.6 })); }
    // the sundial GNOMON at the centre + its easing shadow (a small sway reads as time passing)
    g.appendChild(E("path", { d: "M" + n(cx) + " " + n(gy) + " L" + n(cx) + " " + n(gy - h * 0.34) + " L" + n(cx + w * 0.03) + " " + n(gy) + " Z", "class": "eng fillp", "stroke-width": 1 }));
    swayKF("promShadow", 6);
    var sh = animGroup("promShadow", 6);
    sh.appendChild(E("line", { x1: 0, y1: 0, x2: n(w * 0.15), y2: 0, "class": "eng-accent", "stroke-width": 1, opacity: 0.6 }));
    var spiv = E("g", { transform: "translate(" + n(cx) + " " + n(gy) + ")" });
    spiv.appendChild(sh); g.appendChild(spiv);
    return { label: "the crescent walk" };
  }

  function drawRepNumber(g, district, box, accent) {        // rep-number — the honest monogram (§5.4)
    // KEPT as the monogram plinth: the gate-dom platewalk (§9.1) drives THE NUMBER GARDEN as the
    // estate's live monogram-fallback exemplar, so a real monogram is always present in the built
    // DOM to prove the never-blank path. (A bespoke Pascal-garden scene is deferred, §5.4/§5.6.)
    return drawMonogram(g, district, box, accent);
  }

  function drawRepOpticks(g, district, box, accent) {       // rep-opticks — the light court (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, cx = x + w * 0.5, gy = y + h * 0.72;
    hitRect(g, box);
    // the long low GALLERY with window bays
    var gx = x + w * 0.10, gw = w * 0.80, gtop = y + h * 0.40;
    g.appendChild(E("rect", { x: n(gx), y: n(gtop), width: n(gw), height: n(gy - gtop), "class": "eng fillp", "stroke-width": 1 }));
    for (var b = 1; b < 6; b++) g.appendChild(E("line", { x1: n(gx + gw * b / 6), y1: n(gtop), x2: n(gx + gw * b / 6), y2: n(gy), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.5 }));
    // the PRISM skylight at the apex + a shaft entering it
    var ptop = y + h * 0.16;
    g.appendChild(E("path", { d: "M" + n(cx - w * 0.05) + " " + n(gtop) + " L" + n(cx) + " " + n(ptop) + " L" + n(cx + w * 0.05) + " " + n(gtop) + " Z", "class": "eng fillp", "stroke-width": 1 }));
    g.appendChild(E("line", { x1: n(cx - w * 0.16), y1: n(ptop - h * 0.02), x2: n(cx), y2: n(y + h * 0.30), "class": "eng-accent", "stroke-width": 0.8, opacity: 0.6 }));
    // the SPECTRUM FAN thrown down onto the pool — shimmers on wake
    swayKF("optFan", 3);
    var fan = animGroup("optFan", 7);
    var fx = cx, fy = y + h * 0.30, rays = 7;
    for (var r = 0; r < rays; r++) { var rt = r / (rays - 1), ang = (-0.5 + rt) * 0.9, ex = fx + Math.sin(ang) * w * 0.34;
      fan.appendChild(E("line", { x1: n(fx), y1: n(fy), x2: n(ex), y2: n(gy), "class": (r % 2 ? "eng-accent" : "eng-fine"), "stroke-width": (r % 2 ? 0.9 : 0.6), opacity: 0.6 })); }
    g.appendChild(fan);
    // the REFLECTING POOL along the foot + faint ripples
    g.appendChild(E("line", { x1: n(x + w * 0.06), y1: n(gy), x2: n(x + w * 0.94), y2: n(gy), "class": "eng", "stroke-width": 1 }));
    for (var rp = 0; rp < 3; rp++) g.appendChild(E("line", { x1: n(x + w * (0.20 + rp * 0.22)), y1: n(gy + h * 0.04), x2: n(x + w * (0.34 + rp * 0.22)), y2: n(gy + h * 0.04), "class": "eng-fine", opacity: 0.4 }));
    return { label: "the light court" };
  }

  function drawRepCavern(g, district, box, accent) {        // rep-cavern — the cave mouth + adit (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, cx = x + w * 0.5, gy = y + h * 0.80;
    hitRect(g, box);
    // the rocky HILLSIDE — a rounded hump, hatched
    g.appendChild(E("path", { d: "M" + n(x + w * 0.04) + " " + n(gy) + " Q" + n(x + w * 0.10) + " " + n(y + h * 0.18) + " " + n(cx) + " " + n(y + h * 0.14) + " Q" + n(x + w * 0.90) + " " + n(y + h * 0.18) + " " + n(x + w * 0.96) + " " + n(gy) + " Z", "class": "eng fillp", "stroke-width": 1 }));
    hatch(g, x + w * 0.04, y + h * 0.14, w * 0.92, gy - (y + h * 0.14), 4, 24, 0.22);
    // the cave MAW — a dark arch — with a faint teal glow (quiet, not gaudy)
    var mw = w * 0.30, mx = cx - mw / 2, mtop = y + h * 0.42, mh = gy - mtop;
    g.appendChild(E("ellipse", { cx: n(cx), cy: n(gy - mh * 0.35), rx: n(mw * 0.34), ry: n(mh * 0.34), fill: accent, opacity: 0.16, stroke: "none" }));
    g.appendChild(E("path", { d: "M" + n(mx) + " " + n(gy) + " V" + n(mtop + mw * 0.5) + " Q" + n(mx) + " " + n(mtop) + " " + n(cx) + " " + n(mtop) + " Q" + n(mx + mw) + " " + n(mtop) + " " + n(mx + mw) + " " + n(mtop + mw * 0.5) + " V" + n(gy) + " Z", "class": "eng fillp-ink", "stroke-width": 0.8 }));
    // the braced timber ADIT frame (two posts + a lintel)
    g.appendChild(E("line", { x1: n(mx - 2), y1: n(gy), x2: n(mx - 2), y2: n(mtop + mw * 0.4), "class": "eng", "stroke-width": 1.1 }));
    g.appendChild(E("line", { x1: n(mx + mw + 2), y1: n(gy), x2: n(mx + mw + 2), y2: n(mtop + mw * 0.4), "class": "eng", "stroke-width": 1.1 }));
    g.appendChild(E("line", { x1: n(mx - 4), y1: n(mtop + mw * 0.4), x2: n(mx + mw + 4), y2: n(mtop + mw * 0.4), "class": "eng", "stroke-width": 1.2 }));
    // the MINE-RAIL running out of the mouth toward the foreground
    g.appendChild(E("line", { x1: n(cx - mw * 0.18), y1: n(gy), x2: n(cx - mw * 0.5), y2: n(gy + h * 0.05), "class": "eng-fine" }));
    g.appendChild(E("line", { x1: n(cx + mw * 0.18), y1: n(gy), x2: n(cx + mw * 0.5), y2: n(gy + h * 0.05), "class": "eng-fine" }));
    for (var st = 1; st <= 2; st++) g.appendChild(E("line", { x1: n(cx - mw * (0.2 + st * 0.12)), y1: n(gy + h * 0.02 * st), x2: n(cx + mw * (0.2 + st * 0.12)), y2: n(gy + h * 0.02 * st), "class": "eng-hatch", "stroke-width": 0.4, opacity: 0.4 }));
    return { label: "the cave mouth" };
  }

  function drawRepOutbuilding(g, district, box, accent) {   // rep-outbuilding — the maker's shed (§5.3)
    var x = box.x, y = box.y, w = box.w, h = box.h, cx = x + w * 0.5, gy = y + h * 0.80;
    hitRect(g, box);
    g.appendChild(E("line", { x1: n(x + w * 0.06), y1: n(gy), x2: n(x + w * 0.94), y2: n(gy), "class": "eng-fine" }));
    // the shed BODY + pitched roof + a door
    var bx = x + w * 0.16, bw = w * 0.68, btop = y + h * 0.42;
    g.appendChild(E("rect", { x: n(bx), y: n(btop), width: n(bw), height: n(gy - btop), "class": "eng fillp", "stroke-width": 1 }));
    g.appendChild(E("path", { d: "M" + n(bx - 3) + " " + n(btop) + " L" + n(cx) + " " + n(y + h * 0.26) + " L" + n(bx + bw + 3) + " " + n(btop) + " Z", "class": "eng fillp", "stroke-width": 1 }));
    g.appendChild(E("rect", { x: n(bx + bw * 0.10), y: n(btop + h * 0.12), width: n(bw * 0.20), height: n(gy - btop - h * 0.12), "class": "eng-fine", fill: "none", "stroke-width": 0.7 }));
    // the lit warm WINDOW with a tool-wall silhouette (a saw + a set-square)
    var wx = bx + bw * 0.40, wy = btop + h * 0.13, ww = bw * 0.44, wh = h * 0.22;
    g.appendChild(E("rect", { x: n(wx), y: n(wy), width: n(ww), height: n(wh), fill: "rgba(255,209,128,0.26)", stroke: "rgba(255,209,128,0.75)", "stroke-width": 0.8 }));
    g.appendChild(E("path", { d: "M" + n(wx + ww * 0.10) + " " + n(wy + wh * 0.70) + " L" + n(wx + ww * 0.40) + " " + n(wy + wh * 0.22) + " L" + n(wx + ww * 0.40) + " " + n(wy + wh * 0.70) + " Z", "class": "eng", "stroke-width": 0.6, fill: "none" }));
    g.appendChild(E("path", { d: "M" + n(wx + ww * 0.55) + " " + n(wy + wh * 0.22) + " V" + n(wy + wh * 0.70) + " H" + n(wx + ww * 0.85), "class": "eng", "stroke-width": 0.6, fill: "none" }));
    // the workbench + a lamp glowing warm at rest
    var lx = bx + bw * 0.22, ly = gy - h * 0.03;
    g.appendChild(E("line", { x1: n(bx + bw * 0.10), y1: n(ly), x2: n(bx + bw * 0.42), y2: n(ly), "class": "eng", "stroke-width": 0.9 }));
    g.appendChild(E("circle", { cx: n(lx), cy: n(ly - h * 0.06), r: n(w * 0.06), fill: "rgba(255,190,110,0.14)", stroke: "none" }));
    g.appendChild(E("circle", { cx: n(lx), cy: n(ly - h * 0.06), r: n(w * 0.03), fill: "rgba(255,190,110,0.5)", stroke: accent, "stroke-width": 0.6 }));
    return { label: "the maker's shed" };
  }
  districtScenes["works"] = drawRepWorks;
  districtScenes["gardens"] = drawRepGardens;
  districtScenes["observatory"] = drawRepObservatory;
  districtScenes["promenades"] = drawRepPromenades;
  districtScenes["number"] = drawRepNumber;
  districtScenes["opticks"] = drawRepOpticks;
  districtScenes["cavern"] = drawRepCavern;
  districtScenes["outbuilding"] = drawRepOutbuilding;

  function resolveScene(district) {
    return (district && districtScenes[district.id]) || null;
  }

  // ── drawDistrict — the hook the estate-tier LOD calls per district structure ──
  function drawDistrict(g, district, box, accent) {
    _kf = [];
    accent = accent || (district && district.accent) || BRASS;
    var fn = resolveScene(district);
    if (fn) {
      try {
        var r = fn(g, district, box, accent);
        flushKF();
        // Honor the scene's OWN returned kind (default 'scene' when it returns just a label).
        // A T3.2 provisional stub returns drawMonogram's { kind:'monogram' }, so data-district-art
        // reads 'monogram' truthfully; a foundry-forged scene returns 'scene' (or a bare label).
        return { kind: (r && r.kind) || "scene", label: (r && r.label) || fn.name };
      } catch (err) {
        _kf = [];
        while (g.firstChild) g.removeChild(g.firstChild);   // never a cluttered half-scene
        if (typeof console !== "undefined" && console.warn)
          console.warn("[DistrictArt] scene threw for " + (district && district.id) + ":", err && err.message);
      }
    }
    return drawMonogram(g, district, box, accent);
  }

  window.DistrictArt = window.DistrictArt || {};
  window.DistrictArt.drawDistrict = drawDistrict;
  window.DistrictArt.drawMonogram = drawMonogram;
  window.DistrictArt.districtScenes = districtScenes;
  window.DistrictArt.resolveScene = resolveScene;
  // the animation grammar verbs — exposed so a scene authored as a registered stub (or the
  // liveness twin) can generate a real @keyframes without reaching into the module internals.
  window.DistrictArt.anim = { spinKF: spinKF, bobKF: bobKF, swayKF: swayKF, flowKF: flowKF, group: animGroup, flush: flushKF };
})();
