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
     1. a BESPOKE SCENE  — districtScenes[<districtId>] (foundry-forged; empty until W3.3).
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
                  onto the group as data-district-art. On a registered HIT: draw the scene,
                  flush its @keyframes, {kind:'scene'}. On a MISS or a THROWN scene: clear any
                  partial art and draw the monogram plinth → {kind:'monogram'}.

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

  // ── THE REGISTRY (foundry-filled at W3.3; empty here → every district monograms) ──
  var districtScenes = {};
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
        return { kind: "scene", label: (r && r.label) || fn.name };
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
