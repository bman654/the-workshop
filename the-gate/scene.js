/* ═══════════════════════════════════════════════════════════════════════════
   scene.js  —  the SVG composition + rough greybox draw fns  (window.Gate.scene)

   GREYBOX pass: rough shapes, but the LAYOUT / PROPORTION / LAYER-ORDER are right
   per the reference image + description.md. Final art comes from the asset foundry
   (Phase C) — these draw fns are placeholders that establish each asset's box,
   anchor, scale, perspective so the spec can be derived from the approved scene.

   viewBox 1600×900 (16:9). Layer stack back→front, each its own <g>:
     1 sky         full-bleed vertical gradient (sky.top→sky.horizon)
     2 skyObjects  moon|sun above the manor + placeholder labeled asterism (left)
     3 clouds      (empty group — obscures only sky/sky-objects)
     4 farScenery  observatory on a hill (L), manor (C, distant), greenhouse (R)
     5 midground   grass, road through the gate to the manor, trees/bushes
     6 furniture   the Cairn room-rep + label; undercroft hatch (R, predicate-gated)
     7 gate        brass double gate (2 leaves, closed), gears, gnomon, plaque
     8 (fx canvas is a sibling <canvas>, not an SVG layer — owned by the boot html)
     9 (UI chrome is HTML — owned by the boot html)

   Palette-swappable shapes use fill="var(--role)" / stroke="var(--role)". Emissive
   parts use the GLOW var roles (palette-immune). colormap.js writes all --role vars
   onto the scene root.

   Split note (CLAUDE.md <1000 lines): the GATE assembly (leaves/gears/gnomon/
   plaque) lives in scene-gate.js; the BUILDINGS live in scene-buildings.js. This
   file owns the layer skeleton, sky, midground, furniture, and orchestration.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var S = {};

  var NS = 'http://www.w3.org/2000/svg';
  var VB_W = 1600, VB_H = 900;
  S.VB_W = VB_W; S.VB_H = VB_H;

  /* ── tiny SVG helpers ─────────────────────────────────────────────────────── */
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function group(id, parent) { return el('g', { id: id }, parent); }
  S.el = el; S.group = group; S.NS = NS;

  // expose refs the boot dispatcher / animations need
  S.refs = {};

  /* ── build(): construct the whole SVG into a host element. Returns the <svg>. ─ */
  S.build = function (host) {
    // clear
    while (host.firstChild) host.removeChild(host.firstChild);

    var svg = el('svg', {
      id: 'gate-svg',
      viewBox: '0 0 ' + VB_W + ' ' + VB_H,
      preserveAspectRatio: 'xMidYMid slice',
      width: '100%', height: '100%'
    }, host);
    S.refs.svg = svg;

    // defs (gradients/filters built once)
    var defs = el('defs', {}, svg);
    buildDefs(defs);

    // LAYER 1 — sky
    var sky = group('layer-sky', svg);
    el('rect', { x: 0, y: 0, width: VB_W, height: VB_H, fill: 'url(#sky-grad)' }, sky);
    drawStarfield(sky);

    // LAYER 2 — sky objects (moon/sun + asterism)
    var skyObjects = group('layer-sky-objects', svg);
    S.refs.skyObjects = skyObjects;

    // LAYER 3 — clouds (placeholder/empty; obscures only sky + sky-objects)
    var clouds = group('layer-clouds', svg);
    S.refs.clouds = clouds;

    // LAYER 4 — far scenery (observatory + hill | manor). The greenhouse is NO
    // longer here: it is a FORWARD building (base below the horizon), so drawing it
    // in far-scenery let the midground grass rect (layer 5) paint over its body —
    // only a sliver of ridge survived. It now draws in the FORWARD furniture layer
    // (layer 6), IN FRONT OF the grass, like the undercroft hatch.
    var farScenery = group('layer-far-scenery', svg);
    var B = Gate.scenebuildings;
    if (B) {
      if (B.drawMist) B.drawMist(farScenery, S);    // horizon haze (behind buildings)
      B.drawHillAndObservatory(farScenery, S);      // LEFT
      B.drawManor(farScenery, S);                   // CENTER (distant, behind gate)
    }

    // LAYER 5 — midground (grass, road, trees/bushes)
    var midground = group('layer-midground', svg);
    drawGrounds(midground);
    drawTrees(midground);

    // LAYER 6 — grounds furniture, all IN FRONT OF the grass plane:
    //   greenhouse (forward-right glasshouse) → cairn rep → undercroft hatch.
    // The greenhouse draws FIRST so the undercroft hatch (more forward, lower on the
    // grounds) reads in FRONT of / beside it — both cleanly readable on the right.
    var furniture = group('layer-furniture', svg);
    if (B) B.drawGreenhouse(furniture, S);          // RIGHT (forward, in front of grass)
    drawRoomRep(furniture);
    drawUndercroftHatch(furniture);

    // LAYER 7 — the gate (foreground frame)
    var gateLayer = group('layer-gate', svg);
    if (Gate.scenegate) Gate.scenegate.drawGate(gateLayer, S);

    // initial sky objects for the current band
    S.refreshSkyObjects();

    return svg;
  };

  /* ── defs: the sky gradient + a soft glow filter for emissives ──────────────── */
  function buildDefs(defs) {
    var grad = el('linearGradient', { id: 'sky-grad', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': 'var(--sky\\.top)' }, grad);
    el('stop', { offset: '100%', 'stop-color': 'var(--sky\\.horizon)' }, grad);
    // NB: CSS custom props with a dot in the name need escaping in url()/var()
    // references inside attributes; we instead set stop-color via JS below to be safe.
    grad.childNodes[0].setAttribute('stop-color', 'var(--sky-top-ref)');
    grad.childNodes[1].setAttribute('stop-color', 'var(--sky-horizon-ref)');

    // soft warm glow for emissive halos
    var f = el('filter', { id: 'glow-soft', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '7', result: 'b' }, f);
    var m = el('feMerge', {}, f);
    el('feMergeNode', { 'in': 'b' }, m);
    el('feMergeNode', { 'in': 'SourceGraphic' }, m);

    // a tighter glow for stars
    var f2 = el('filter', { id: 'glow-star', x: '-200%', y: '-200%', width: '500%', height: '500%' }, defs);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '3', result: 'b2' }, f2);
    var m2 = el('feMerge', {}, f2);
    el('feMergeNode', { 'in': 'b2' }, m2);
    el('feMergeNode', { 'in': 'SourceGraphic' }, m2);

    // a WIDE, blur-ONLY feather for the moon's lit-limb glow. Unlike glow-soft this
    // does NOT merge the source back in — we want a pure blurred copy of the LIT
    // crescent/gibbous shape so the halo follows the illuminated edge and fades to
    // nothing as it wraps toward the dark limb (no glow on the dark side).
    var f3 = el('filter', { id: 'glow-moon', x: '-90%', y: '-90%', width: '280%', height: '280%' }, defs);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '16' }, f3);
  }

  /* ── a faint full-bleed starfield (always present; reads at night) ───────────── */
  function drawStarfield(parent) {
    var g = group('starfield', parent);
    // deterministic scatter so it doesn't twinkle-jump on re-renders
    var seed = 1337;
    function rng() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < 90; i++) {
      var x = rng() * VB_W, y = rng() * (VB_H * 0.55);
      var r = 0.5 + rng() * 1.1;
      el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2),
        fill: 'var(--asterism-star-ref, #f0d489)', opacity: (0.25 + rng() * 0.4).toFixed(2) }, g);
    }
    S.refs.starfield = g;
  }

  /* ── LAYER 2 refresh: moon (night) OR sun (day/dusk) + the asterism ─────────── */
  S.refreshSkyObjects = function () {
    var g = S.refs.skyObjects;
    if (!g) return;
    while (g.firstChild) g.removeChild(g.firstChild);
    var band = Gate.timeofday ? Gate.timeofday.band() : 'night';

    // the disc sits DIRECTLY ABOVE the centered manor (manor at x800) → upper sky,
    // clear of the gate crest (which peaks at ~y146)
    var discX = 800, discY = 124, discR = 64;
    if (band === 'night') drawMoon(g, discX, discY, discR);
    else drawSun(g, discX, discY, discR, band);

    // asterism in OPEN sky to the upper-LEFT of the disc — placed in the top-left
    // (x<360, above the observatory) so it never clips behind the gate bars and its
    // label is fully legible.
    drawAsterism(g, 70, 24, 180);
  };

  /* ── PHASE-PARAMETRIC moon ──────────────────────────────────────────────────
     drawMoon(g, cx, cy, r) reads three params off S:
       S._moonFrac : illuminated fraction 0..1 (0 new · 0.5 quarter · 1 full)
       S._moonSide : +1 = lit on the RIGHT (waxing) · -1 = lit on the LEFT (waning)
     and renders, back→front:
       (Fix 2) a near-DARK full disc (structural night tone, sampled from the
               resolved observatory.body) so the unlit sphere nearly merges into
               the night sky — only a faint hint of form, never mid-grey.
       (Fix 3) a soft GLOW that hugs only the LIT limb: a blurred copy of the
               illuminated crescent/gibbous PATH itself, so the halo follows the
               lit edge and fades to nothing toward the dark side (no dark-limb
               glow). Near-full → the lit shape is almost the whole disc, so the
               glow approaches a full ring; thin crescent → a bright arc only.
       the bright emissive LIT region (var(--moon.disc)).
       a faint top-edge highlight along the lit limb ("lit from above").

     TODO Phase D: feed sky-core.mjs moonPhase()/terminator() output
       {illuminatedFraction, litSide, curvature} into S.setMoonPhase() instead of
       the ?moon dev pin, so the drawn phase matches the user's real date. */
  function drawMoon(g, cx, cy, r) {
    var moonG = group('moon', g);
    var frac = clamp01(S._moonFrac == null ? 0.6 : S._moonFrac);
    var side = (S._moonSide === -1) ? -1 : 1;       // default waxing (lit right)

    // (Fix 2) the dark sphere — structural-dark, NOT mid-grey. Prefer the resolved
    // observatory.body tone (the night structural dark); fall back to a deep tint.
    var darkFill = resolvedRole('observatory.body') ||
      'var(--observatory-body-ref, #181c26)';
    el('circle', { cx: cx, cy: cy, r: r, fill: darkFill }, moonG);
    // a whisper of rim form on the dark side so it isn't a flat hole
    el('circle', { cx: cx, cy: cy, r: r, fill: 'none',
      stroke: 'var(--brass-stroke-ref, #4a4436)', 'stroke-width': '0.8', opacity: '0.22' }, moonG);

    // the LIT-region path (crescent/gibbous bounded by limb + terminator).
    var litD = litRegionPath(cx, cy, r, frac, side);

    if (litD) {
      // (Fix 3 / restore) glow = blurred copies of the LIT shape (pure feather, no
      // source merge) → naturally hugs the illuminated limb, zero glow on the dark
      // side. TWO layers: a WIDE soft halo + a TIGHTER brighter bloom so the glow
      // is clearly VISIBLE on the lit limb (crescent → bright arc, near-full → ring)
      // without spilling onto the dark side.
      el('path', { d: litD, fill: 'var(--moon-disc-ref, #f2ead2)',
        opacity: '0.85', filter: 'url(#glow-moon)' }, moonG);   // wide soft halo
      el('path', { d: litD, fill: 'var(--moon-disc-ref, #f2ead2)',
        opacity: '0.6', filter: 'url(#glow-star)' }, moonG);    // tight inner bloom
      // the bright emissive lit region
      el('path', { d: litD, fill: 'var(--moon-disc-ref, #f2ead2)' }, moonG);
      // faint top-edge highlight along the lit limb ("lit from above")
      var hx = cx + side * r * 0.18;
      el('path', { d: 'M ' + (hx - side * r * 0.5) + ' ' + (cy - r * 0.6) +
        ' A ' + r + ' ' + r + ' 0 0 ' + (side > 0 ? 1 : 0) + ' ' + (hx + side * r * 0.4) + ' ' + (cy - r * 0.72),
        fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.3' }, moonG);
    }
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  /* resolvedRole(role): read a resolved CSS var (dash alias) so the moon's dark
     side tracks the live palette/brightness. The vars are written on #stage; the
     svg is a descendant, so walk UP from it to the first node carrying the alias.
     Returns null if not available yet (caller falls back to the default tint). */
  function resolvedRole(role) {
    try {
      var node = S.refs && S.refs.svg;
      while (node) {
        var v = node.style && node.style.getPropertyValue(dashName(role));
        if (v) return v;
        node = node.parentNode;
      }
    } catch (e) {}
    return null;
  }

  /* litRegionPath(cx,cy,r,frac,side): the illuminated portion as a closed path.
     Built from the OUTER limb semicircle (on the lit side) + the TERMINATOR arc.
       frac=0   → null (new moon, nothing lit)
       frac=1   → full disc circle
       0<frac<1 → crescent (frac<0.5) or gibbous (frac>0.5)
     The terminator is a half-ellipse with semi-minor axis tx = r·|1−2·frac|
     (the projected day/night boundary); its bulge direction flips at frac=0.5. */
  function litRegionPath(cx, cy, r, frac, side) {
    if (frac <= 0.001) return null;
    if (frac >= 0.999) {
      // full disc
      return 'M ' + (cx - r) + ' ' + cy +
        ' A ' + r + ' ' + r + ' 0 1 1 ' + (cx + r) + ' ' + cy +
        ' A ' + r + ' ' + r + ' 0 1 1 ' + (cx - r) + ' ' + cy + ' Z';
    }
    var topY = cy - r, botY = cy + r;
    var tx = r * Math.abs(1 - 2 * frac);   // terminator semi-minor axis
    // OUTER limb: the visible semicircle on the LIT side, from top → bottom.
    // For side=+1 (lit right) we sweep the RIGHT half (clockwise, sweep=1);
    // for side=-1 (lit left) we sweep the LEFT half (sweep=0).
    var limbSweep = side > 0 ? 1 : 0;
    // TERMINATOR: half-ellipse from bottom → top closing the inner edge.
    // gibbous (frac>0.5): terminator bows AWAY from lit side → same sweep dir as limb.
    // crescent (frac<0.5): terminator bows INTO lit side → opposite sweep.
    var gibbous = frac > 0.5;
    var termSweep;
    if (side > 0) termSweep = gibbous ? 1 : 0;   // lit right
    else          termSweep = gibbous ? 0 : 1;   // lit left
    return 'M ' + cx + ' ' + topY +
      ' A ' + r + ' ' + r + ' 0 0 ' + limbSweep + ' ' + cx + ' ' + botY +
      ' A ' + tx + ' ' + r + ' 0 0 ' + termSweep + ' ' + cx + ' ' + topY + ' Z';
  }

  function drawSun(g, cx, cy, r, band) {
    var sunG = group('sun', g);
    // dusk → lower toward horizon; day → higher
    var y = band === 'dusk' ? cy + 70 : cy;
    el('circle', { cx: cx, cy: y, r: r * 2.0, fill: 'var(--sun-disc-ref, #ffe9a8)',
      opacity: band === 'dusk' ? '0.22' : '0.14', filter: 'url(#glow-soft)' }, sunG);
    el('circle', { cx: cx, cy: y, r: r, fill: 'var(--sun-disc-ref, #ffe9a8)' }, sunG);
  }

  function drawAsterism(g, ox, oy, size) {
    if (!Gate.asterism) return;
    var fig = Gate.asterism.current();
    if (!fig) return; // Phase D: nothing unlocked → draw nothing
    var astG = group('asterism', g);
    var sc = size / 100;
    function px(p) { return ox + p.x * sc; }
    function py(p) { return oy + p.y * sc; }
    // lines first
    for (var i = 0; i < fig.lines.length; i++) {
      var a = fig.stars[fig.lines[i][0]], b = fig.stars[fig.lines[i][1]];
      el('line', { x1: px(a).toFixed(1), y1: py(a).toFixed(1), x2: px(b).toFixed(1), y2: py(b).toFixed(1),
        stroke: 'var(--asterism-line-ref, #c9a24a)', 'stroke-width': '1.6', opacity: '0.62' }, astG);
    }
    // stars
    for (var j = 0; j < fig.stars.length; j++) {
      var s = fig.stars[j];
      el('circle', { cx: px(s).toFixed(1), cy: py(s).toFixed(1), r: (s.mag === 1 ? 4.2 : 3.0).toFixed(1),
        fill: 'var(--asterism-star-ref, #f0d489)', filter: 'url(#glow-star)' }, astG);
    }
    // engraved italic label below
    var lx = ox + size * 0.5, ly = oy + size * 0.92;
    var t = el('text', { x: lx.toFixed(1), y: ly.toFixed(1), 'text-anchor': 'middle',
      'font-family': 'Georgia, serif', 'font-style': 'italic', 'font-size': '20',
      fill: 'var(--asterism-line-ref, #c9a24a)', opacity: '0.85' }, astG);
    t.textContent = fig.name;
    if (fig.myth) {
      var t2 = el('text', { x: lx.toFixed(1), y: (ly + 20).toFixed(1), 'text-anchor': 'middle',
        'font-family': 'ui-monospace, monospace', 'font-size': '11', 'letter-spacing': '0.18em',
        fill: 'var(--asterism-line-ref, #c9a24a)', opacity: '0.5' }, astG);
      t2.textContent = fig.myth.toUpperCase();
    }
  }

  /* ── LAYER 5 — grounds: midground grass + road to the manor + a NEAR foreground
     APRON the gate stands on (the single biggest depth cue: foreground apron →
     midground grounds → distant buildings → sky). ───────────────────────────── */
  function drawGrounds(parent) {
    // MIDGROUND ground rises from the horizon (~y 470) toward the viewer
    var groundTop = 470;
    el('rect', { x: 0, y: groundTop, width: VB_W, height: VB_H - groundTop, fill: 'var(--grass-ref, #3c4a50)' }, parent);
    // a soft grade band just under the horizon so the midground isn't flat
    el('rect', { x: 0, y: groundTop, width: VB_W, height: 70, fill: 'var(--hill-ref, #2c3742)', opacity: '0.45' }, parent);

    // ROAD: a tapering ribbon from the gate seam (front, x800) straight back to the
    // CENTERED manor doorway (x800, y472). Wide at the front, narrow at the manor —
    // the road the opened gate reveals, leading to the destination.
    var road = 'M 706 900 L 894 900 L 832 478 L 768 478 Z';
    el('path', { d: road, fill: 'var(--road-ref, #5a5f6a)' }, parent);
    // a paler crown down the middle (lit from above) + kerb edges
    el('path', { d: 'M 800 900 L 800 478', fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.16' }, parent);
    el('path', { d: 'M 706 900 L 768 478', fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.12' }, parent);

    // a couple of lamp posts flanking the road just inside the grounds (emissive)
    drawLamp(parent, 612, 520, 64);
    drawLamp(parent, 988, 520, 64);

    // ── FOREGROUND APRON: a band of NEAR paving across the very bottom that the
    // gate + piers stand ON. Cobbled stone, lit from above, receding to a back edge
    // (a shallow trapezoid) so it reads as ground tilting away under the gate. ──
    var g = group('foreground-apron', parent);
    var apronTopY = 812;              // back edge of the apron
    // the paving slab (stone), widening toward the viewer
    el('path', { d: 'M -40 ' + apronTopY + ' L ' + (VB_W + 40) + ' ' + apronTopY +
      ' L ' + (VB_W + 40) + ' ' + VB_H + ' L -40 ' + VB_H + ' Z',
      fill: 'var(--stone-ref, #6a7079)' }, g);
    // a darker mortar shadow just under the back edge (sits the apron in front)
    el('rect', { x: -40, y: apronTopY, width: VB_W + 80, height: 8, fill: 'rgba(0,0,0,.28)' }, g);
    // top-lit front lip of the back edge
    el('line', { x1: -40, y1: apronTopY + 1, x2: VB_W + 40, y2: apronTopY + 1,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.18' }, g);
    // cobble joints — converging paving lines fanning toward the viewer (perspective)
    var jointCount = 9;
    for (var ci = 0; ci <= jointCount; ci++) {
      var t = ci / jointCount;
      var backX = 120 + t * (VB_W - 240);          // joints span the apron at the back
      var frontX = -120 + t * (VB_W + 240);        // fan wider at the front
      el('line', { x1: backX.toFixed(0), y1: apronTopY, x2: frontX.toFixed(0), y2: VB_H,
        stroke: 'rgba(0,0,0,.20)', 'stroke-width': '1.2' }, g);
    }
    // a couple of horizontal course lines (paving rows) with subtle near-edge light
    var rowYs = [apronTopY + 26, apronTopY + 56];
    for (var ri = 0; ri < rowYs.length; ri++) {
      el('line', { x1: -40, y1: rowYs[ri], x2: VB_W + 40, y2: rowYs[ri],
        stroke: 'rgba(0,0,0,.16)', 'stroke-width': '1.2' }, g);
    }
  }

  function drawLamp(parent, x, baseY, h) {
    var g = group(null, parent);
    // post (brass idiom: dark body + brass stroke)
    el('rect', { x: x - 3, y: baseY - h, width: 6, height: h, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // lantern head
    el('rect', { x: x - 8, y: baseY - h - 14, width: 16, height: 16, rx: 2, fill: 'rgba(11,14,22,.85)',
      stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.2' }, g);
    // emissive flame (palette-immune)
    el('circle', { cx: x, cy: baseY - h - 6, r: 18, fill: 'var(--lamp-flame-ref, #ffd27a)',
      opacity: '0.22', filter: 'url(#glow-soft)' }, g);
    el('circle', { cx: x, cy: baseY - h - 6, r: 4, fill: 'var(--lamp-flame-ref, #ffd27a)' }, g);
  }

  /* ── trees/bushes (placeholder; sway comes later in weather-fx) ──────────────── */
  function drawTrees(parent) {
    var g = group('trees', parent);
    // varied sizes for a natural grounds; kept OUTSIDE the gate footprint
    // (gate spans x400..1200) so they frame, not obscure.
    drawTree(g, 96, 556, 1.35);
    drawTree(g, 250, 600, 0.85);
    drawTree(g, 348, 572, 1.05);
    drawBush(g, 300, 700, 1.0);
    // RIGHT-side trees FRAME the forward greenhouse (footprint ~x1291..1496) rather
    // than sit under its translucent glass — one to its LEFT (between pier + house),
    // one tucked to its far RIGHT at the frame edge. (Trees are midground, BEHIND the
    // greenhouse now, so any overlap would show foliage THROUGH the glass.)
    drawTree(g, 1232, 588, 1.2);
    drawTree(g, 1548, 624, 0.78);
    drawBush(g, 1500, 724, 1.1);
    drawBush(g, 1240, 706, 0.85);
    S.refs.trees = g;
  }
  function drawTree(parent, x, baseY, sc) {
    var g = group(null, parent);
    el('rect', { x: x - 5 * sc, y: baseY - 60 * sc, width: 10 * sc, height: 60 * sc,
      fill: 'var(--tree-trunk-ref, #2a2620)' }, g);
    el('ellipse', { cx: x, cy: baseY - 75 * sc, rx: 38 * sc, ry: 46 * sc,
      fill: 'var(--tree-foliage-ref, #2c3a40)' }, g);
    // top-edge highlight (lit from above)
    el('path', { d: 'M ' + (x - 24 * sc) + ' ' + (baseY - 100 * sc) +
      ' A ' + (32 * sc) + ' ' + (32 * sc) + ' 0 0 1 ' + (x + 18 * sc) + ' ' + (baseY - 110 * sc),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.15' }, g);
  }
  function drawBush(parent, x, baseY, sc) {
    var g = group(null, parent);
    el('ellipse', { cx: x, cy: baseY, rx: 34 * sc, ry: 22 * sc, fill: 'var(--tree-foliage-ref, #2c3a40)' }, g);
    el('ellipse', { cx: x - 22 * sc, cy: baseY + 4, rx: 20 * sc, ry: 16 * sc, fill: 'var(--tree-foliage-ref, #2c3a40)' }, g);
    el('ellipse', { cx: x + 22 * sc, cy: baseY + 4, rx: 20 * sc, ry: 16 * sc, fill: 'var(--tree-foliage-ref, #2c3a40)' }, g);
  }

  /* ── LAYER 6 — the room-rep (Cairn) + label, in front of the observatory rise ── */
  function drawRoomRep(parent) {
    if (!Gate.rooms) return;
    var pick = Gate.rooms.pick();
    var g = group('room-rep', parent);
    var baseX = 230, baseY = 720;   // bottom-left grounds, in front of the rise
    if (pick.rep === 'cairn') drawCairn(g, baseX, baseY);
    // label below
    var t = el('text', { x: baseX, y: baseY + 34, 'text-anchor': 'middle',
      'font-family': 'Georgia, serif', 'font-size': '20', 'font-style': 'italic',
      fill: 'var(--brass-stroke-ref, #c9a24a)' }, g);
    t.textContent = pick.name;
    // a little brass plate under the label
    var tw = (pick.name.length * 11) + 28;
    el('rect', { x: baseX - tw / 2, y: baseY + 18, width: tw, height: 24, rx: 3,
      fill: 'rgba(11,14,22,.55)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1' }, g);
    g.appendChild(t); // re-append so text sits above the plate
    S.refs.roomRep = g;
  }

  /* the Cairn: a stack of polished black brass-rimmed stones (rough greybox). */
  function drawCairn(parent, cx, baseY) {
    var g = group('cairn', parent);
    var stones = [
      { w: 78, h: 34, dy: 0 },
      { w: 64, h: 28, dy: -30 },
      { w: 50, h: 24, dy: -54 },
      { w: 38, h: 19, dy: -74 },
      { w: 26, h: 14, dy: -90 }
    ];
    var y = baseY;
    for (var i = 0; i < stones.length; i++) {
      var st = stones[i];
      el('ellipse', { cx: cx, cy: y + st.dy, rx: st.w / 2, ry: st.h / 2,
        fill: '#0c0e14', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
      // top-edge brass-bright sheen ("lit from above" on a polished stone)
      el('path', { d: 'M ' + (cx - st.w * 0.32) + ' ' + (y + st.dy - st.h * 0.18) +
        ' A ' + (st.w * 0.36) + ' ' + (st.h * 0.36) + ' 0 0 1 ' + (cx + st.w * 0.2) + ' ' + (y + st.dy - st.h * 0.28),
        fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.1', opacity: '0.5' }, g);
    }
  }

  /* ── undercroft hatch — a FRONT-ON double cellar / bilco door set INTO the
     ground, on the RIGHT in front of the (now smaller) greenhouse. We stand in
     FRONT and slightly ABOVE, looking down INTO the hole — NOT an isometric corner.
     The OPENING is a rectangle lying flat on the ground in perspective: the NEAR
     edge (bottom, closest) is WIDER, the FAR edge (top, into the distance) is
     NARROWER. Two doors SIDE BY SIDE hinged on OPPOSITE OUTER edges — the LEFT door
     on the opening's LEFT edge, the RIGHT door on the RIGHT edge — both flung OPEN
     OUTWARD, away from the centerline, lying back on the grass. The emissive
     undercroft.glow seeps up from the dark depths.
     Shown only when the unlock predicate is true (earned) OR forced via ?undercroft=1. */
  function drawUndercroftHatch(parent) {
    if (!undercroftOpen()) return;
    var g = group('undercroft-hatch', parent);
    var FR = 'var(--brass-stroke-ref, #c9a24a)';

    // OPENING rectangle in ground perspective (front-on, receding away from viewer).
    // Centred in the right grounds, forward of (lower than) the shrunken greenhouse.
    var cx = 1300;                  // centerline of the opening
    var yNear = 742, yFar = 678;    // bottom (near) + top (far) edges of the hole
    var wNear = 78, wFar = 52;      // half-widths: NEAR wider, FAR narrower (perspective)
    var Lnear = cx - wNear, Rnear = cx + wNear;   // near corners
    var Lfar  = cx - wFar,  Rfar  = cx + wFar;    // far corners

    // a thin stone curb/lip ringing the opening, set into the grass — drawn first,
    // slightly larger than the hole, so the rim reads as a built collar.
    var cb = 8;
    el('path', { d: 'M ' + (Lnear - cb) + ' ' + (yNear + cb * 0.5) +
      ' L ' + (Lfar - cb) + ' ' + (yFar - cb * 0.4) +
      ' L ' + (Rfar + cb) + ' ' + (yFar - cb * 0.4) +
      ' L ' + (Rnear + cb) + ' ' + (yNear + cb * 0.5) + ' Z',
      fill: 'var(--stone-ref, #6a7079)', stroke: FR, 'stroke-width': '1.2' }, g);

    // the DARK OPENING — a rectangular hole lying flat, receding (trapezoid). This is
    // the void you'd walk DOWN into; it reads dark (or scary-lit) from its depths.
    var holeD = 'M ' + Lnear + ' ' + yNear +
      ' L ' + Lfar + ' ' + yFar +
      ' L ' + Rfar + ' ' + yFar +
      ' L ' + Rnear + ' ' + yNear + ' Z';
    el('path', { d: holeD, fill: 'rgba(6,7,11,.97)', stroke: FR, 'stroke-width': '1.4' }, g);

    // a hint of the FAR WALL / first steps descending — a darker inner band at the
    // far edge so the eye reads DEPTH (you could step down into it).
    el('path', { d: 'M ' + (Lfar + 4) + ' ' + yFar +
      ' L ' + (Rfar - 4) + ' ' + yFar +
      ' L ' + (Rfar - 8) + ' ' + (yFar + 14) +
      ' L ' + (Lfar + 8) + ' ' + (yFar + 14) + ' Z',
      fill: 'rgba(0,0,0,.55)' }, g);

    // the emissive GLOW seeping UP from the depths (palette-immune). Pooled in the
    // hole (smaller than the opening, biased to the FAR/lower-interior) so it reads
    // as menacing light rising from below, not a flat fill. undercroft.glow VALUE
    // sets the mood (deep red-violet = scary, not welcoming).
    var gw = wNear * 0.62, gwf = wFar * 0.55;
    var gyN = yNear - 8, gyF = yFar + 6;
    el('path', { d: 'M ' + (cx - gw) + ' ' + gyN +
      ' L ' + (cx - gwf) + ' ' + gyF +
      ' L ' + (cx + gwf) + ' ' + gyF +
      ' L ' + (cx + gw) + ' ' + gyN + ' Z',
      fill: 'var(--undercroft-glow-ref, #6e1430)', opacity: '0.6', filter: 'url(#glow-soft)' }, g);

    // ── TWO DOORS side by side, flung OPEN OUTWARD, hinged on the OPPOSITE OUTER
    // edges. Each open leaf lies BACK on the grass alongside the opening (a flat-ish
    // trapezoid extending outward from its hinge edge). Drawn AFTER the hole so the
    // leaves sit on the ground beside it, framing the dark rectangle. ──
    var leafRun = 56;               // how far each open leaf reaches outward
    // LEFT door: hinged on the opening's LEFT edge (Lnear..Lfar), opens to the LEFT.
    var lhNx = Lnear, lhNy = yNear;          // near hinge point (on left edge)
    var lhFx = Lfar,  lhFy = yFar;           // far  hinge point (on left edge)
    el('path', { d: 'M ' + lhNx + ' ' + lhNy +
      ' L ' + lhFx + ' ' + lhFy +
      ' L ' + (lhFx - leafRun * 0.78) + ' ' + (lhFy - 4) +
      ' L ' + (lhNx - leafRun) + ' ' + (lhNy + 2) + ' Z',
      fill: 'rgba(13,16,22,.92)', stroke: FR, 'stroke-width': '1.4' }, g);
    // left leaf plank lines + outer-edge brass sheen ("lit from above")
    el('line', { x1: lhNx - leafRun, y1: lhNy + 2, x2: lhFx - leafRun * 0.78, y2: lhFy - 4,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.4' }, g);
    el('line', { x1: (lhNx + lhNx - leafRun) / 2, y1: (lhNy + lhNy + 2) / 2,
      x2: (lhFx + lhFx - leafRun * 0.78) / 2, y2: (lhFy + lhFy - 4) / 2,
      stroke: FR, 'stroke-width': '0.8', opacity: '0.55' }, g);

    // RIGHT door: hinged on the opening's RIGHT edge (Rnear..Rfar), opens to the RIGHT.
    var rhNx = Rnear, rhNy = yNear;
    var rhFx = Rfar,  rhFy = yFar;
    el('path', { d: 'M ' + rhNx + ' ' + rhNy +
      ' L ' + rhFx + ' ' + rhFy +
      ' L ' + (rhFx + leafRun * 0.78) + ' ' + (rhFy - 4) +
      ' L ' + (rhNx + leafRun) + ' ' + (rhNy + 2) + ' Z',
      fill: 'rgba(13,16,22,.92)', stroke: FR, 'stroke-width': '1.4' }, g);
    el('line', { x1: rhNx + leafRun, y1: rhNy + 2, x2: rhFx + leafRun * 0.78, y2: rhFy - 4,
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.4' }, g);
    el('line', { x1: (rhNx + rhNx + leafRun) / 2, y1: (rhNy + rhNy + 2) / 2,
      x2: (rhFx + rhFx + leafRun * 0.78) / 2, y2: (rhFy + rhFy - 4) / 2,
      stroke: FR, 'stroke-width': '0.8', opacity: '0.55' }, g);

    S.refs.undercroft = g;
  }

  /* mirror index.src.html revealUndercroft EXACTLY: navigable state, not eligibility.
     PRODUCTION stays earned-only; the dev flag (?undercroft=1 → setDevUndercroft)
     only FORCES it visible for review — it does NOT change the earned-unlock logic. */
  function undercroftOpen() {
    if (S._devUndercroft) return true;           // dev review override
    var WS = root.WS;
    if (!WS || !WS.store) return false;
    var store = WS.store();
    if (!store.ok) return false; // file:// or storage off → nothing unlocked
    return store.has('ws:seen:undercroft-rune') || store.has('ws:seen:undercroft');
  }
  S.undercroftOpen = undercroftOpen;

  /* setDevUndercroft(on): the ?undercroft=1 dev override (boot calls this before
     build). Forces the greybox hatch visible for review only. */
  S.setDevUndercroft = function (on) { S._devUndercroft = !!on; };

  /* ── colormap plumbing: the var roles in colormap have dots ('sky.top'); CSS
     custom-prop names with dots are legal but awkward inside SVG attr var() refs.
     So we MIRROR every resolved role to a dash-named alias var (--sky-top-ref)
     that the SVG attributes reference. applyVars() does the mirroring. ─────────── */
  function dashName(role) { return '--' + role.replace(/\./g, '-') + '-ref'; }
  S.dashName = dashName;

  /* applyResolved(vars): vars is colormap.resolve() output keyed '--sky.top' etc.
     Write BOTH the canonical dotted var AND the dash alias onto the scene root. */
  S.applyResolved = function (rootEl, vars) {
    if (!rootEl) return;
    for (var k in vars) {
      if (!Object.prototype.hasOwnProperty.call(vars, k)) continue;
      rootEl.style.setProperty(k, vars[k]);                 // --sky.top
      var role = k.replace(/^--/, '');
      rootEl.style.setProperty(dashName(role), vars[k]);    // --sky-top-ref
    }
  };

  /* setMoonK(k): stash the illuminated fraction. In dev, ?moon=<0..1> drives BOTH
     the brightness moonK (consumed by the boot's colormap.B) AND the DRAWN phase
     fraction here, so a preview at ?moon=0.2 shows a thin crescent + dim scene and
     ?moon=0.8 shows a fat gibbous + bright scene. Default lit side = right (waxing). */
  S.setMoonK = function (k) {
    S._moonK = k;
    if (S._moonFrac == null || S._moonPhasePinned !== true) S._moonFrac = k;
  };

  /* setMoonPhase({illuminatedFraction, litSide}): the Phase-D entry point. When
     sky-core.mjs supplies the real phase, call this BEFORE refreshSkyObjects() to
     drive the drawn moon from the user's actual date. litSide: 'right'|'left'
     (+1 waxing / −1 waning). Pins the fraction so setMoonK can't overwrite it. */
  S.setMoonPhase = function (p) {
    if (!p) return;
    if (p.illuminatedFraction != null) S._moonFrac = p.illuminatedFraction;
    if (p.litSide != null) S._moonSide = (p.litSide === 'left' || p.litSide === -1) ? -1 : 1;
    S._moonPhasePinned = true;
  };

  Gate.scene = S;

  if (typeof module !== 'undefined' && module.exports) { module.exports = S; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
