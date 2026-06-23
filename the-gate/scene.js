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

  /* ── trees/bushes — rounded estate grounds framing the scene ────────────────────
     ART (foundry, take 1): each tree is a TAPERED trunk (root-flare + a hinted
     limb) carrying a layered foliage MASS built from many overlapping crown lobes —
     a dark shadow underbelly (down/forward), a mid body in tree.foliage, and small
     top-lit highlight clumps rimmed with brass.bright so the crown catches light
     from above. NOT a flat lollipop. Bushes are low 3-lobe shrubs with the same
     shadow-belly / lit-crown logic. All color is via palette roles, so the grounds
     recede to dark silhouettes at night and read lush green by day. The crown lobes
     are emitted as a single child <g> per tree (`tree-crown`) about which a future
     gentle sway would pivot — but NO animation is added here (sway is Phase D). */
  function drawTrees(parent) {
    var g = group('trees', parent);
    // LEFT cluster — frames the observatory rise + flanks the cairn slot. Kept OUT
    // of the room-rep slot CORE (x152..308 below y492) so a tall rep isn't crowded:
    // the big tree sits at x96 (crown to ~x150), the others at x250/x348 keep their
    // bulk above/around the slot, not fattened into its core.
    drawTree(g, 96, 556, 1.35);
    drawTree(g, 250, 600, 0.85);
    drawTree(g, 348, 572, 1.05);
    drawBush(g, 300, 700, 1.0);
    // RIGHT cluster — FRAMES the forward greenhouse (footprint ~x1291..1496) rather
    // than sit under its translucent glass: one to its LEFT (between pier + house),
    // one tucked to the far-RIGHT frame edge. (Trees are midground, BEHIND the
    // greenhouse, so any overlap would otherwise show foliage THROUGH the glass.)
    drawTree(g, 1232, 588, 1.2);
    drawTree(g, 1548, 624, 0.78);
    drawBush(g, 1500, 724, 1.1);
    drawBush(g, 1240, 706, 0.85);
    S.refs.trees = g;
  }

  /* a tiny deterministic PRNG seeded per-instance so every tree gets its own crown
     scatter but the scene is STABLE across re-renders (no twinkle-jump). */
  function foliageRng(seed) {
    var s = (seed * 2654435761) & 0x7fffffff || 1;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  function f1f(n) { return (Math.round(n * 10) / 10); }

  function drawTree(parent, x, baseY, sc) {
    var g = group(null, parent);
    var FOL  = 'var(--tree-foliage-ref, #2c3a40)';
    var TRK  = 'var(--tree-trunk-ref, #2a2620)';
    var BRI  = 'var(--brass-bright-ref, #cdb375)';
    var rnd  = foliageRng(Math.round(x * 7 + baseY));

    // crown geometry: a soft rounded mass centered above the trunk. The two trees
    // flanking the cairn slot (x≈250 & x≈348) get a TALLER/NARROWER, more
    // topiary/estate-manicured silhouette so the four don't read as one cloned
    // species — same unified-lobe-mass construction, just a stretched proportion.
    var manicured = (x > 200 && x < 380);
    var crownCY = baseY - (manicured ? 88 : 78) * sc;     // mass center (taller for cairn-side)
    var crownRX = (manicured ? 33 : 40) * sc, crownRY = (manicured ? 54 : 48) * sc;

    // ── TRUNK: a tapered column (wider at the root, narrower at the crown) with a
    //    root flare and two forked limbs reaching into the canopy. Drawn first so the
    //    foliage mass sits over its top. ──
    var trunkTopY = crownCY + crownRY * 0.30;   // trunk vanishes into the canopy
    var rootW = 7.2 * sc, topW = 4.0 * sc;
    el('path', { d:
      'M ' + f1f(x - rootW) + ' ' + f1f(baseY) +
      ' C ' + f1f(x - rootW * 0.55) + ' ' + f1f(baseY - 14 * sc) + ' ' + f1f(x - topW) + ' ' + f1f(trunkTopY + 18 * sc) + ' ' + f1f(x - topW) + ' ' + f1f(trunkTopY) +
      ' L ' + f1f(x + topW) + ' ' + f1f(trunkTopY) +
      ' C ' + f1f(x + topW) + ' ' + f1f(trunkTopY + 18 * sc) + ' ' + f1f(x + rootW * 0.55) + ' ' + f1f(baseY - 14 * sc) + ' ' + f1f(x + rootW) + ' ' + f1f(baseY) +
      ' Z', fill: TRK }, g);
    // root flares splaying onto the ground
    el('path', { d: 'M ' + f1f(x - rootW) + ' ' + f1f(baseY) +
      ' Q ' + f1f(x - rootW * 2.1) + ' ' + f1f(baseY - 1) + ' ' + f1f(x - rootW * 2.6) + ' ' + f1f(baseY + 2 * sc) +
      ' L ' + f1f(x - rootW * 0.7) + ' ' + f1f(baseY + 2 * sc) + ' Z', fill: TRK }, g);
    el('path', { d: 'M ' + f1f(x + rootW) + ' ' + f1f(baseY) +
      ' Q ' + f1f(x + rootW * 2.1) + ' ' + f1f(baseY - 1) + ' ' + f1f(x + rootW * 2.6) + ' ' + f1f(baseY + 2 * sc) +
      ' L ' + f1f(x + rootW * 0.7) + ' ' + f1f(baseY + 2 * sc) + ' Z', fill: TRK }, g);
    // two forked limbs climbing into the canopy (a touch more structural credibility
    // than a single hinted branch — and it individuates the trunks). The left limb
    // reaches longer/higher; the right is shorter, so the fork reads asymmetric.
    el('path', { d: 'M ' + f1f(x - topW * 0.4) + ' ' + f1f(trunkTopY + 6 * sc) +
      ' Q ' + f1f(x - 14 * sc) + ' ' + f1f(crownCY + 6 * sc) + ' ' + f1f(x - 20 * sc) + ' ' + f1f(crownCY - 6 * sc),
      fill: 'none', stroke: TRK, 'stroke-width': f1f(3.0 * sc), 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M ' + f1f(x + topW * 0.4) + ' ' + f1f(trunkTopY + 7 * sc) +
      ' Q ' + f1f(x + 12 * sc) + ' ' + f1f(crownCY + 10 * sc) + ' ' + f1f(x + 17 * sc) + ' ' + f1f(crownCY - 1 * sc),
      fill: 'none', stroke: TRK, 'stroke-width': f1f(2.6 * sc), 'stroke-linecap': 'round' }, g);
    // faint top-lit sheen up the trunk's left edge (lit from above/left)
    el('line', { x1: f1f(x - topW * 0.7), y1: f1f(trunkTopY + 4 * sc), x2: f1f(x - rootW * 0.7), y2: f1f(baseY - 6 * sc),
      stroke: BRI, 'stroke-width': '1', opacity: '0.14' }, g);

    // ── FOLIAGE MASS — a single crown <g> (the natural sway pivot) built in layers:
    //    (1) a dark SHADOW belly offset down/forward,
    //    (2) the mid BODY mass in tree.foliage,
    //    (3) inner clumping (a few darker overlay lobes for tonal depth),
    //    (4) top-lit highlight lobes + a brass-bright crown rim. ──
    var crown = group(null, g);

    // a soft blob = several overlapping ellipses around a center.
    function blob(cx, cy, rx, ry, fill, op, n) {
      var i, a, dr;
      el('ellipse', { cx: f1f(cx), cy: f1f(cy), rx: f1f(rx), ry: f1f(ry),
        fill: fill, opacity: op == null ? '1' : String(op) }, crown);
      for (i = 0; i < n; i++) {
        a = (i / n) * Math.PI * 2 + rnd() * 0.8;
        dr = 0.45 + rnd() * 0.4;
        el('ellipse', { cx: f1f(cx + Math.cos(a) * rx * dr), cy: f1f(cy + Math.sin(a) * ry * dr * 0.85),
          rx: f1f(rx * (0.42 + rnd() * 0.22)), ry: f1f(ry * (0.42 + rnd() * 0.22)),
          fill: fill, opacity: op == null ? '1' : String(op) }, crown);
      }
    }

    // (1) SHADOW belly — the mass darkened, nudged DOWN/FORWARD (shadow falls down)
    blob(x + 4 * sc, crownCY + crownRY * 0.34, crownRX * 1.02, crownRY * 0.92, FOL, null, 7);
    el('ellipse', { cx: f1f(x + 4 * sc), cy: f1f(crownCY + crownRY * 0.34),
      rx: f1f(crownRX * 1.02), ry: f1f(crownRY * 0.92), fill: '#000', opacity: '0.24' }, crown);

    // (2) mid BODY — the main crown silhouette in tree.foliage
    blob(x, crownCY, crownRX, crownRY, FOL, null, 9);

    // (3) inner CLUMPING — a couple of darker overlay lobes so the mass isn't flat
    el('ellipse', { cx: f1f(x + crownRX * 0.30), cy: f1f(crownCY + crownRY * 0.10),
      rx: f1f(crownRX * 0.46), ry: f1f(crownRY * 0.46), fill: '#000', opacity: '0.18' }, crown);
    el('ellipse', { cx: f1f(x - crownRX * 0.34), cy: f1f(crownCY + crownRY * 0.22),
      rx: f1f(crownRX * 0.38), ry: f1f(crownRY * 0.40), fill: '#000', opacity: '0.14' }, crown);

    // (4) TOP-LIT highlight lobes — small clumps on the UP-facing crown, brightened
    //     by a thin brass-bright wash so the canopy catches light from above. These
    //     read as a faint sheen at night and lush sunlit clumps by day.
    var hi = 4;
    for (var k = 0; k < hi; k++) {
      var hx = x + (k - (hi - 1) / 2) * crownRX * 0.40 + (rnd() - 0.5) * 5 * sc;
      var hy = crownCY - crownRY * 0.40 - rnd() * 7 * sc;
      var hr = crownRX * (0.26 + rnd() * 0.12);
      // a soft foliage clump...
      el('ellipse', { cx: f1f(hx), cy: f1f(hy), rx: f1f(hr), ry: f1f(hr * 0.8), fill: FOL }, crown);
      // ...with a gentle brass-bright sheen on its UP-facing crest (soft, not a spot)
      el('ellipse', { cx: f1f(hx - hr * 0.12), cy: f1f(hy - hr * 0.26), rx: f1f(hr * 0.66), ry: f1f(hr * 0.42),
        fill: BRI, opacity: '0.10' }, crown);
    }
    // a brass-bright crown rim along the top-left limb ("lit from above")
    el('path', { d: 'M ' + f1f(x - crownRX * 0.72) + ' ' + f1f(crownCY - crownRY * 0.34) +
      ' A ' + f1f(crownRX * 0.9) + ' ' + f1f(crownRY * 0.9) + ' 0 0 1 ' +
      f1f(x + crownRX * 0.46) + ' ' + f1f(crownCY - crownRY * 0.66),
      fill: 'none', stroke: BRI, 'stroke-width': f1f(1.2), opacity: '0.30' }, crown);
  }

  function drawBush(parent, x, baseY, sc) {
    var g = group(null, parent);
    var FOL = 'var(--tree-foliage-ref, #2c3a40)';
    var BRI = 'var(--brass-bright-ref, #cdb375)';
    var rnd = foliageRng(Math.round(x * 11 + baseY + 3));

    // three overlapping lobes (center tallest), each a soft clustered blob, sitting
    // on the ground line. A dark belly under the front + top-lit crowns.
    var lobes = [
      { dx: -24 * sc, dy: 5 * sc, rx: 21 * sc, ry: 16 * sc },
      { dx:  24 * sc, dy: 5 * sc, rx: 21 * sc, ry: 16 * sc },
      { dx:   0,      dy: -2 * sc, rx: 26 * sc, ry: 22 * sc }
    ];

    function clump(cx, cy, rx, ry, fill, op) {
      el('ellipse', { cx: f1f(cx), cy: f1f(cy), rx: f1f(rx), ry: f1f(ry), fill: fill,
        opacity: op == null ? '1' : String(op) }, g);
      for (var i = 0; i < 4; i++) {
        var a = (i / 4) * Math.PI * 2 + rnd() * 0.9;
        el('ellipse', { cx: f1f(cx + Math.cos(a) * rx * 0.42), cy: f1f(cy + Math.sin(a) * ry * 0.4),
          rx: f1f(rx * (0.46 + rnd() * 0.2)), ry: f1f(ry * (0.46 + rnd() * 0.2)),
          fill: fill, opacity: op == null ? '1' : String(op) }, g);
      }
    }

    // dark shadow belly across the base (shadow falls down/forward)
    el('ellipse', { cx: f1f(x), cy: f1f(baseY + 8 * sc), rx: f1f(36 * sc), ry: f1f(12 * sc),
      fill: '#000', opacity: '0.22' }, g);
    // the three foliage lobes
    var i;
    for (i = 0; i < lobes.length; i++) {
      var L = lobes[i];
      clump(x + L.dx, baseY + L.dy, L.rx, L.ry, FOL);
    }
    // a darker overlay tuck between lobes for internal depth
    el('ellipse', { cx: f1f(x), cy: f1f(baseY + 6 * sc), rx: f1f(18 * sc), ry: f1f(12 * sc),
      fill: '#000', opacity: '0.16' }, g);
    // top-lit crown sheen on each lobe (UP-facing edge)
    for (i = 0; i < lobes.length; i++) {
      var M = lobes[i];
      el('ellipse', { cx: f1f(x + M.dx - M.rx * 0.1), cy: f1f(baseY + M.dy - M.ry * 0.5),
        rx: f1f(M.rx * 0.6), ry: f1f(M.ry * 0.34), fill: BRI, opacity: '0.14' }, g);
    }
    // a brass-bright rim along the central lobe's top ("lit from above")
    el('path', { d: 'M ' + f1f(x - 17 * sc) + ' ' + f1f(baseY - 16 * sc) +
      ' A ' + f1f(24 * sc) + ' ' + f1f(20 * sc) + ' 0 0 1 ' + f1f(x + 15 * sc) + ' ' + f1f(baseY - 18 * sc),
      fill: 'none', stroke: BRI, 'stroke-width': '1', opacity: '0.26' }, g);
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
    var FR  = 'var(--brass-stroke-ref, #9c8350)';   // brass stroke
    var BRI = 'var(--brass-bright-ref, #cdb375)';    // brass-bright TOP-edge sheen
    var STONE = 'var(--stone-ref, #6a7079)';         // swappable curb stone
    var GLOW = 'var(--undercroft-glow-ref, #8a123a)';// EMISSIVE deep crimson depth-glow
    var fx = function (n) { return (Math.round(n * 10) / 10); };

    // ── TAKE 3 — "the carved stoop." A heavy coursed-stone cellar mouth set into the
    //    earth: a thick block curb with visible joints, a flight of stone steps
    //    descending into the dark, and a deep crimson menace pooling far/lower. Two
    //    heavy TIMBER leaves on iron strap-hinges thrown open on the OUTER edges, lying
    //    back on the grass with their own cast shadows. Lit from above throughout. ──

    // OPENING in ground perspective (front-on, receding away). Near edge WIDER, far
    // edge NARROWER. Centred in the right grounds, forward of the greenhouse.
    var cx = 1300;
    var yNear = 742, yFar = 678;    // near (bottom) + far (top) edges of the hole
    var wNear = 80, wFar = 50;      // half-widths: NEAR wider, FAR narrower (perspective)
    var Lnear = cx - wNear, Rnear = cx + wNear;
    var Lfar  = cx - wFar,  Rfar  = cx + wFar;
    // linear-interpolate a point along the LEFT / RIGHT receding rail (t: 0 near → 1 far)
    function Lx(t) { return Lnear + (Lfar - Lnear) * t; }
    function Rx(t) { return Rnear + (Rfar - Rnear) * t; }
    function Yy(t) { return yNear + (yFar - yNear) * t; }

    // ground SHADOW the whole mouth casts into the grass — a soft dark halo forward/below
    // (light comes from above) so the curb reads as a raised, real built collar.
    el('ellipse', { cx: cx + 6, cy: yNear + 14, rx: wNear + 30, ry: 26,
      fill: '#000', opacity: '0.26', filter: 'url(#glow-soft)' }, g);

    // ── STONE CURB — a thick coursed block ring around the rim, drawn as an outer
    //    trapezoid minus the hole, with the NEAR (top-facing) face brass-bright lit. ──
    var cb = 13;                    // curb thickness at the near edge (tapers far)
    var cbf = 9;
    var oLn = Lnear - cb, oLf = Lfar - cbf, oRf = Rfar + cbf, oRn = Rnear + cb;
    var oyN = yNear + cb * 0.55, oyF = yFar - cbf * 0.5;
    // curb body (outer ring) — single filled trapezoid; the hole paints over its centre
    el('path', { d: 'M ' + fx(oLn) + ' ' + fx(oyN) +
      ' L ' + fx(oLf) + ' ' + fx(oyF) +
      ' L ' + fx(oRf) + ' ' + fx(oyF) +
      ' L ' + fx(oRn) + ' ' + fx(oyN) + ' Z',
      fill: STONE, stroke: FR, 'stroke-width': '1.4', filter: 'url(#glow-soft)' }, g);
    // a darker inner-bevel band so the curb has thickness (the cut face going down)
    el('path', { d: 'M ' + fx(Lnear) + ' ' + fx(yNear) +
      ' L ' + fx(Lfar) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar) + ' ' + fx(yFar) +
      ' L ' + fx(Rnear) + ' ' + fx(yNear) +
      ' L ' + fx(oRn) + ' ' + fx(oyN) +
      ' L ' + fx(oRf) + ' ' + fx(oyF) +
      ' L ' + fx(oLf) + ' ' + fx(oyF) +
      ' L ' + fx(oLn) + ' ' + fx(oyN) + ' Z',
      fill: '#000', opacity: '0.20' }, g);
    // block JOINTS carved across the curb (radial seams out from each rim corner)
    var joints = [ [-0.62, oLn, oyN, Lnear, yNear], [0.62, oRn, oyN, Rnear, yNear],
                   [-0.3, (oLn + oLf) / 2, (oyN + oyF) / 2, Lx(0.5), Yy(0.5)],
                   [0.3, (oRn + oRf) / 2, (oyN + oyF) / 2, Rx(0.5), Yy(0.5)] ];
    for (var j = 0; j < joints.length; j++) {
      var J = joints[j];
      el('line', { x1: fx(J[1]), y1: fx(J[2]), x2: fx(J[3]), y2: fx(J[4]),
        stroke: '#000', 'stroke-width': '1', opacity: '0.30' }, g);
    }
    // a front-corner joint on each near return (the curb's two near block ends)
    el('line', { x1: fx(oLn), y1: fx(oyN), x2: fx(Lnear), y2: fx(yNear),
      stroke: '#000', 'stroke-width': '1', opacity: '0.28' }, g);
    el('line', { x1: fx(oRn), y1: fx(oyN), x2: fx(Rnear), y2: fx(yNear),
      stroke: '#000', 'stroke-width': '1', opacity: '0.28' }, g);
    // brass-bright TOP-edge sheen on the NEAR coping (the up-facing curb lip catches light)
    el('path', { d: 'M ' + fx(oLn + 2) + ' ' + fx(oyN - 1) + ' L ' + fx(oRn - 2) + ' ' + fx(oyN - 1),
      fill: 'none', stroke: BRI, 'stroke-width': '1.4', opacity: '0.5' }, g);
    el('path', { d: 'M ' + fx(oLn + 2) + ' ' + fx(oyN - 1) + ' L ' + fx(oLf + 2) + ' ' + fx(oyF),
      fill: 'none', stroke: BRI, 'stroke-width': '1', opacity: '0.32' }, g);
    el('path', { d: 'M ' + fx(oRn - 2) + ' ' + fx(oyN - 1) + ' L ' + fx(oRf - 2) + ' ' + fx(oyF),
      fill: 'none', stroke: BRI, 'stroke-width': '1', opacity: '0.32' }, g);

    // ── THE VOID + DESCENDING STONE STEPS ──
    // Base of the hole: near-black so the depth reads bottomless behind the steps/glow.
    var holeD = 'M ' + fx(Lnear) + ' ' + fx(yNear) +
      ' L ' + fx(Lfar) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar) + ' ' + fx(yFar) +
      ' L ' + fx(Rnear) + ' ' + fx(yNear) + ' Z';
    el('path', { d: holeD, fill: 'rgba(5,5,9,.99)', stroke: FR, 'stroke-width': '1.6' }, g);

    // ── EMISSIVE DEPTH-GLOW (drawn FIRST, low in the throat) — deep crimson pooling
    //    from the depths, biased FAR/LOWER. The steps are then drawn OVER the near half
    //    so they stay legible as dark stone treads with the glow showing between them
    //    and burning brightest at the far back of the throat. NEVER yellow. ──
    // 1) a dim crimson FILL across the whole void floor so the depth never reads dead-flat
    el('path', { d: holeD, fill: GLOW, opacity: '0.16' }, g);
    // 2) the pooled source: a feathered hot band concentrated at the FAR/back interior
    el('path', { d: 'M ' + fx(Lx(0.55)) + ' ' + fx(Yy(0.55)) +
      ' L ' + fx(Lfar + 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar - 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rx(0.55)) + ' ' + fx(Yy(0.55)) + ' Z',
      fill: GLOW, opacity: '0.5', filter: 'url(#glow-soft)' }, g);
    // 3) a tighter, brighter core hugging the very back (the molten seam at the bottom of the stair)
    el('path', { d: 'M ' + fx(Lx(0.80)) + ' ' + fx(Yy(0.80)) +
      ' L ' + fx(Lfar + 8) + ' ' + fx(yFar + 2) +
      ' L ' + fx(Rfar - 8) + ' ' + fx(yFar + 2) +
      ' L ' + fx(Rx(0.80)) + ' ' + fx(Yy(0.80)) + ' Z',
      fill: GLOW, opacity: '0.66', filter: 'url(#glow-soft)' }, g);
    // 4) a DEEP-crimson shade pulled HARDER over the back band so the source reads as
    //    spec blood-wine #8a123a, never hot pink. (judge fix a) Two passes: a wide cool
    //    wash across the upper interior, then a darker cap right at the far lip.
    el('path', { d: 'M ' + fx(Lx(0.62)) + ' ' + fx(Yy(0.62)) +
      ' L ' + fx(Lfar + 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar - 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rx(0.62)) + ' ' + fx(Yy(0.62)) + ' Z',
      fill: '#3a0518', opacity: '0.40', filter: 'url(#glow-soft)' }, g);
    el('path', { d: 'M ' + fx(Lfar + 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar - 2) + ' ' + fx(yFar) +
      ' L ' + fx(Rx(0.9)) + ' ' + fx(Yy(0.9)) +
      ' L ' + fx(Lx(0.9)) + ' ' + fx(Yy(0.9)) + ' Z',
      fill: '#3a0518', opacity: '0.5' }, g);

    // a flight of STONE STEPS marching down/away from the NEAR edge into the throat,
    // drawn OVER the glow so the near treads read as solid dark stone and the crimson
    // burns up BETWEEN them — a true descending-stair depth cue. Treads dim with depth.
    var nSteps = 4;
    for (var s = 0; s < nSteps; s++) {
      var depth = s / nSteps;                            // 0 near → 1 far
      var t0 = depth, t1 = (s + 0.58) / nSteps;          // lit tread band
      var tb = (s + 1) / nSteps;                         // riser back edge
      // tread face — solid dark stone near, fading toward the back so the glow wins deep
      el('path', { d: 'M ' + fx(Lx(t0)) + ' ' + fx(Yy(t0)) +
        ' L ' + fx(Lx(t1)) + ' ' + fx(Yy(t1)) +
        ' L ' + fx(Rx(t1)) + ' ' + fx(Yy(t1)) +
        ' L ' + fx(Rx(t0)) + ' ' + fx(Yy(t0)) + ' Z',
        fill: STONE, opacity: String(Math.max(0.0, 0.5 - depth * 0.42)) }, g);
      // dark base under the tread so the step has body even where stone-fade is low
      el('path', { d: 'M ' + fx(Lx(t0)) + ' ' + fx(Yy(t0)) +
        ' L ' + fx(Lx(t1)) + ' ' + fx(Yy(t1)) +
        ' L ' + fx(Rx(t1)) + ' ' + fx(Yy(t1)) +
        ' L ' + fx(Rx(t0)) + ' ' + fx(Yy(t0)) + ' Z',
        fill: '#05050a', opacity: String(Math.max(0.0, 0.55 - depth * 0.5)) }, g);
      // riser (the vertical drop) — near-black, lets the glow read as a thin hot line below it
      el('path', { d: 'M ' + fx(Lx(t1)) + ' ' + fx(Yy(t1)) +
        ' L ' + fx(Lx(tb)) + ' ' + fx(Yy(tb)) +
        ' L ' + fx(Rx(tb)) + ' ' + fx(Yy(tb)) +
        ' L ' + fx(Rx(t1)) + ' ' + fx(Yy(t1)) + ' Z',
        fill: '#04040a', opacity: String(0.85 - depth * 0.25) }, g);
      // crimson nosing: a hot rim where each tread's far lip meets the glowing riser-gap
      el('line', { x1: fx(Lx(t1) + 3), y1: fx(Yy(t1)), x2: fx(Rx(t1) - 3), y2: fx(Yy(t1)),
        stroke: GLOW, 'stroke-width': '1.4', opacity: String(0.3 + depth * 0.35) }, g);
      // brass-bright catch on each near tread nosing (faint top-light from above)
      if (s < 2) el('line', { x1: fx(Lx(t0) + 4), y1: fx(Yy(t0) - 0.6), x2: fx(Rx(t0) - 4), y2: fx(Yy(t0) - 0.6),
        stroke: BRI, 'stroke-width': '0.8', opacity: String(0.3 - depth * 0.4) }, g);
    }

    // crimson cast UP onto the inner FAR wall (light climbing the back of the throat)
    el('path', { d: 'M ' + fx(Lfar + 3) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar - 3) + ' ' + fx(yFar) +
      ' L ' + fx(Rfar - 7) + ' ' + fx(yFar + 8) +
      ' L ' + fx(Lfar + 7) + ' ' + fx(yFar + 8) + ' Z',
      fill: GLOW, opacity: '0.4', filter: 'url(#glow-soft)' }, g);
    // a faint crimson wash licking the far coping (the glow lighting the back lip from below)
    el('ellipse', { cx: cx, cy: yFar + 4, rx: wFar - 4, ry: 9,
      fill: GLOW, opacity: '0.3', filter: 'url(#glow-soft)' }, g);

    // ── DARK NEAR-THROAT VIGNETTE (graft from take 1, judge fix b) — a near-black shade
    //    dragged UP over the very lip / front of the mouth so the near edge of the pit
    //    reads black before the stair descends. Tuned to deepen the front lip WITHOUT
    //    burying the upper treads: a strong cap right at the near edge fading back to the
    //    first tread. The pit gives its light back grudgingly — this sells "looking DOWN
    //    into a deep hole" rather than a backlit panel. (kept off the lit far stair)
    el('path', { d: 'M ' + fx(Lnear + 3) + ' ' + fx(yNear) +
      ' L ' + fx(Lx(0.30) + 5) + ' ' + fx(Yy(0.30)) +
      ' L ' + fx(Rx(0.30) - 5) + ' ' + fx(Yy(0.30)) +
      ' L ' + fx(Rnear - 3) + ' ' + fx(yNear) + ' Z',
      fill: 'rgba(3,3,6,.86)', filter: 'url(#glow-soft)' }, g);
    // a second, lighter feathered band carrying the shadow a touch deeper (gradient-free)
    el('path', { d: 'M ' + fx(Lx(0.30) + 5) + ' ' + fx(Yy(0.30)) +
      ' L ' + fx(Lx(0.48) + 5) + ' ' + fx(Yy(0.48)) +
      ' L ' + fx(Rx(0.48) - 5) + ' ' + fx(Yy(0.48)) +
      ' L ' + fx(Rx(0.30) - 5) + ' ' + fx(Yy(0.30)) + ' Z',
      fill: 'rgba(3,3,6,.5)', filter: 'url(#glow-soft)' }, g);

    // ── TWO TIMBER LEAVES flung OPEN on OPPOSITE OUTER hinges, laid back on the grass.
    //    Each is a heavy plank door (dark estate body + brass-stroke frame) with plank
    //    seams, end-cleats, an iron strap-hinge at the hinge edge, and a ring pull. ──
    var leafRun = 60;               // how far an open leaf reaches outward from its hinge
    var bodyFill = 'rgba(10,13,20,.95)';  // heavier, darker plank body (judge fix b)
    var edgeFill = 'rgba(7,9,14,.97)';    // the door's THICKNESS band (edge-stile)

    function leaf(dir, hNx, hNy, hFx, hFy) {
      var lg = group(null, g);
      var oNx = hNx + dir * leafRun,        oNy = hNy + 3;     // outer NEAR corner
      var oFx = hFx + dir * leafRun * 0.80, oFy = hFy - 3;     // outer FAR corner
      // cast shadow of the laid-back leaf on the grass (offset down/forward)
      el('path', { d: 'M ' + fx(hNx) + ' ' + fx(hNy + 5) +
        ' L ' + fx(hFx) + ' ' + fx(hFy + 4) +
        ' L ' + fx(oFx) + ' ' + fx(oFy + 6) +
        ' L ' + fx(oNx) + ' ' + fx(oNy + 7) + ' Z',
        fill: '#000', opacity: '0.22', filter: 'url(#glow-soft)' }, lg);
      // EDGE-STILE (graft from take 2, judge fix b) — the door's THICKNESS read end-on:
      // a darker band dropping below the leaf's near edge so the plank is solid timber,
      // not a flat panel. Drawn BEFORE the face so the face caps it cleanly on top.
      var eth = 7;
      el('path', { d: 'M ' + fx(hNx) + ' ' + fx(hNy) +
        ' L ' + fx(oNx) + ' ' + fx(oNy) +
        ' L ' + fx(oNx) + ' ' + fx(oNy + eth) +
        ' L ' + fx(hNx) + ' ' + fx(hNy + eth) + ' Z',
        fill: edgeFill, stroke: FR, 'stroke-width': '1' }, lg);
      // the plank body
      el('path', { d: 'M ' + fx(hNx) + ' ' + fx(hNy) +
        ' L ' + fx(hFx) + ' ' + fx(hFy) +
        ' L ' + fx(oFx) + ' ' + fx(oFy) +
        ' L ' + fx(oNx) + ' ' + fx(oNy) + ' Z',
        fill: bodyFill, stroke: FR, 'stroke-width': '1.4', filter: 'url(#glow-soft)' }, lg);
      // PLANK boards: 3 boards with alternating subtle warm/dark tonal banding so the
      // timber reads as grained wood, then the dark seams + a brass-bright catch between.
      var nP = 3;
      for (var b0 = 0; b0 < nP; b0++) {
        var fa = b0 / nP, fb = (b0 + 1) / nP;
        var nAx = hNx + (oNx - hNx) * fa, nAy = hNy + (oNy - hNy) * fa;
        var nBx = hNx + (oNx - hNx) * fb, nBy = hNy + (oNy - hNy) * fb;
        var fAx = hFx + (oFx - hFx) * fa, fAy = hFy + (oFy - hFy) * fa;
        var fBx = hFx + (oFx - hFx) * fb, fBy = hFy + (oFy - hFy) * fb;
        // alternate boards: a warm brass-stroke wash vs a dark wash (grain) — pushed
        // harder (judge fix 3) so the timber is legible as planks at scene scale.
        el('path', { d: 'M ' + fx(nAx) + ' ' + fx(nAy) + ' L ' + fx(fAx) + ' ' + fx(fAy) +
          ' L ' + fx(fBx) + ' ' + fx(fBy) + ' L ' + fx(nBx) + ' ' + fx(nBy) + ' Z',
          fill: (b0 % 2 === 0) ? FR : '#000', opacity: (b0 % 2 === 0) ? '0.16' : '0.30' }, lg);
      }
      for (var p = 1; p < nP; p++) {
        var fp = p / nP;
        var aX = hNx + (oNx - hNx) * fp, aY = hNy + (oNy - hNy) * fp;   // along near edge
        var bX = hFx + (oFx - hFx) * fp, bY = hFy + (oFy - hFy) * fp;   // along far edge
        el('line', { x1: fx(aX), y1: fx(aY), x2: fx(bX), y2: fx(bY),
          stroke: '#000', 'stroke-width': '1', opacity: '0.45' }, lg);
        el('line', { x1: fx(aX), y1: fx(aY - 1), x2: fx(bX), y2: fx(bY - 1),
          stroke: BRI, 'stroke-width': '0.6', opacity: '0.26' }, lg);
      }
      // END-CLEATS: a batten across each end (near & outer) binding the planks
      el('line', { x1: fx(hNx), y1: fx(hNy), x2: fx(oNx), y2: fx(oNy),
        stroke: FR, 'stroke-width': '2', opacity: '0.7' }, lg);      // near cleat (hinge end's near rail)
      el('line', { x1: fx(hFx), y1: fx(hFy), x2: fx(oFx), y2: fx(oFy),
        stroke: FR, 'stroke-width': '1.6', opacity: '0.6' }, lg);    // far cleat
      // brass-bright TOP/outer-edge sheen (lit from above): the leaf's up-facing far + outer edges
      el('line', { x1: fx(hFx), y1: fx(hFy - 1), x2: fx(oFx), y2: fx(oFy - 1),
        stroke: BRI, 'stroke-width': '1.2', opacity: '0.5' }, lg);
      el('line', { x1: fx(oNx), y1: fx(oNy - 1), x2: fx(oFx), y2: fx(oFy - 1),
        stroke: BRI, 'stroke-width': '1', opacity: '0.42' }, lg);
      // IRON STRAP-HINGE at the hinge edge: a long brass-strapped band with two bolts,
      // plus the hinge barrel knuckles seated in the curb.
      var smx = (hNx + oNx) / 2, smy = (hNy + oNy) / 2;   // strap reaches in from near hinge
      el('path', { d: 'M ' + fx(hNx + dir * 3) + ' ' + fx(hNy) +
        ' L ' + fx(smx) + ' ' + fx(smy) +
        ' L ' + fx((hFx + oFx) / 2) + ' ' + fx((hFy + oFy) / 2) +
        ' L ' + fx(hFx + dir * 3) + ' ' + fx(hFy) + ' Z',
        fill: 'none', stroke: FR, 'stroke-width': '1.4', opacity: '0.85' }, lg);
      el('line', { x1: fx(hNx + dir * 3) + 0, y1: fx(hNy), x2: fx(smx), y2: fx(smy),
        stroke: BRI, 'stroke-width': '0.7', opacity: '0.4' }, lg);
      // strap bolts
      el('circle', { cx: fx(hNx + dir * 6), cy: fx(hNy - 1), r: 2, fill: bodyFill, stroke: FR, 'stroke-width': '0.9' }, lg);
      el('circle', { cx: fx(hNx + dir * 6 - 0.6), cy: fx(hNy - 1.6), r: 0.8, fill: BRI, opacity: '0.85' }, lg);
      el('circle', { cx: fx(smx + dir * 2), cy: fx(smy), r: 1.8, fill: bodyFill, stroke: FR, 'stroke-width': '0.8' }, lg);
      el('circle', { cx: fx(smx + dir * 2 - 0.5), cy: fx(smy - 0.6), r: 0.7, fill: BRI, opacity: '0.8' }, lg);
      // hinge BARREL knuckles seated along the rim — pintle pins at the hinge line
      // (near + mid + far, graft from take 2's pintle-knuckle-at-the-rim detail).
      el('circle', { cx: fx(hNx), cy: fx(hNy), r: 2.6, fill: bodyFill, stroke: FR, 'stroke-width': '1.1' }, lg);
      el('circle', { cx: fx(hNx - 0.7), cy: fx(hNy - 0.9), r: 0.9, fill: BRI, opacity: '0.85' }, lg);
      el('circle', { cx: fx((hNx + hFx) / 2), cy: fx((hNy + hFy) / 2), r: 2.3, fill: bodyFill, stroke: FR, 'stroke-width': '1' }, lg);
      el('circle', { cx: fx((hNx + hFx) / 2 - 0.6), cy: fx((hNy + hFy) / 2 - 0.8), r: 0.8, fill: BRI, opacity: '0.82' }, lg);
      el('circle', { cx: fx(hFx), cy: fx(hFy), r: 2.1, fill: bodyFill, stroke: FR, 'stroke-width': '1' }, lg);
      el('circle', { cx: fx(hFx - 0.6), cy: fx(hFy - 0.8), r: 0.7, fill: BRI, opacity: '0.8' }, lg);
      // RING PULL on the outer edge of the leaf
      var prx = (oNx + oFx) / 2, pry = (oNy + oFy) / 2;
      el('circle', { cx: fx(prx), cy: fx(pry), r: 4, fill: 'none', stroke: FR, 'stroke-width': '1.6' }, lg);
      el('circle', { cx: fx(prx), cy: fx(pry), r: 4, fill: 'none', stroke: BRI, 'stroke-width': '0.7', opacity: '0.5' }, lg);
      el('circle', { cx: fx(prx), cy: fx(pry - 4), r: 1.4, fill: bodyFill, stroke: FR, 'stroke-width': '0.9' }, lg);  // mount plate
      return lg;
    }

    // LEFT leaf hinged on the opening's LEFT edge, opens LEFT (dir = -1).
    leaf(-1, Lnear, yNear, Lfar, yFar);
    // RIGHT leaf hinged on the opening's RIGHT edge, opens RIGHT (dir = +1).
    leaf(+1, Rnear, yNear, Rfar, yFar);

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
