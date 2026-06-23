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
  var GROUND_TOP = 470;                  // the grass-plane line (SPEC §1.3 occlusion boundary)
  var HORIZON_FRAC = GROUND_TOP / VB_H;  // 0.522 — used to anchor the letterbox backdrop
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
      // CONTAIN (not cover): honor the 16:9 scene aspect and NEVER clip it
      // off-screen. On an off-aspect viewport (e.g. a tall 1:2 portrait window) the
      // whole scene stays visible, letterboxed; #stage paints sky/ground-toned bars
      // behind the bars so they continue the scene instead of showing a raw frame.
      preserveAspectRatio: 'xMidYMid meet',
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

  /* ── fitStageBackdrop(stageEl): seamless letterbox bars ─────────────────────────
     The scene SVG is shown with preserveAspectRatio "xMidYMid meet" (contain) so it
     NEVER clips off-screen — but on an off-aspect viewport it letterboxes, and the
     bars would otherwise expose a raw page-bg frame. We paint #stage with a backdrop
     that EXACTLY extends the scene's own sky/ground PAST the scene rectangle:
       • solid sky.top above the scene's top edge (a portrait window's top bar),
       • the sky gradient (sky.top→sky.horizon) from the scene top down to the grass
         line, matching the side bars of an ultrawide window,
       • solid grass from the grass line to the bottom (a portrait window's lower bar).
     Colors are band-resolved var() refs, so a recolor reflows the bars for free; only
     the px breakpoints depend on viewport size, so the boot recalls this on resize. */
  S.fitStageBackdrop = function (stageEl) {
    if (!stageEl) return;
    var W = stageEl.clientWidth || VB_W, H = stageEl.clientHeight || VB_H;
    var scale = Math.min(W / VB_W, H / VB_H);   // "meet" = fit the whole scene
    var rH = VB_H * scale;                       // rendered scene height (px)
    var topY = Math.max(0, (H - rH) / 2);        // scene's top edge in viewport px
    var horY = topY + HORIZON_FRAC * rH;         // grass-plane line in viewport px
    function c(role) { return 'var(' + dashName(role) + ',var(--bg))'; }
    stageEl.style.background =
      'linear-gradient(to bottom,' +
        c('sky.top') + ' 0,' +
        c('sky.top') + ' ' + topY.toFixed(1) + 'px,' +
        c('sky.horizon') + ' ' + horY.toFixed(1) + 'px,' +
        c('grass') + ' ' + horY.toFixed(1) + 'px,' +
        c('grass') + ' 100%)';
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
  /* ── grounds-local deterministic PRNG (stable across re-renders, no twinkle-jump),
     plus a 1-decimal rounder; both private to drawGrounds/drawLamp. ─────────────── */
  function groundsRng(seed) {
    var s = (seed * 2246822519) & 0x7fffffff || 1;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  function g1f(n) { return (Math.round(n * 10) / 10); }

  /* ── TAKE 3 — "the kept gravel court." A quiet, lush estate stage: a deep opaque
     grass plane that lightens toward an atmospheric horizon, with a low pelt of
     tonal mottling + sparse tufts only where the eye expects them (the horizon line
     and the road verges); a believable raked-GRAVEL drive to the manor with a lit
     crown, kerb stones and faint scatter; two brass lamp-posts; and a NEAR cobbled
     APRON of HINTED individual flagstones receding to a top-lit back lip — the big
     depth cue. All swappable color via roles, so it goes lush by day / dark by night;
     only the lamp globes glow. Lit from above throughout. RESTRAINT: the stage stays
     quiet so the hero gate + the manor keep the eye. ────────────────────────────── */
  function drawGrounds(parent) {
    var GRASS = 'var(--grass-ref, #3c4a50)';
    var HILL  = 'var(--hill-ref, #2c3742)';
    var ROAD  = 'var(--road-ref, #5a5f6a)';
    var STONE = 'var(--stone-ref, #6a7079)';
    var BRI   = 'var(--brass-bright-ref, #f0d489)';
    var groundTop = GROUND_TOP;

    // ════ THE GRASS PLANE — the HARD occlusion boundary (SPEC §1.3). A full-width,
    //   FULL-OPACITY fill x0..1600 / y470..900 hiding the manor/observatory bases. ════
    el('rect', { x: 0, y: groundTop, width: VB_W, height: VB_H - groundTop, fill: GRASS }, parent);

    // atmospheric LIGHTENING toward the horizon — the hill-toned grade band, stacked
    // in three softening passes so the meadow recedes into haze instead of a hard line.
    var grade = group('grass-grade', parent);
    el('rect', { x: 0, y: groundTop, width: VB_W, height: 78, fill: HILL, opacity: '0.42' }, grade);
    el('rect', { x: 0, y: groundTop, width: VB_W, height: 44, fill: HILL, opacity: '0.30' }, grade);
    el('rect', { x: 0, y: groundTop, width: VB_W, height: 20, fill: 'var(--mist-ref, #7c8aa0)', opacity: '0.22' }, grade);

    // TONAL MOTTLING — a sparse pelt of broad soft patches across the meadow giving
    // the plane subtle life without busy-ness. Light patches up top (catching the
    // sky), darker hollows lower/forward. Deterministic so it never jitters.
    var mott = group('grass-mottle', parent);
    var mr = groundsRng(91);
    for (var mi = 0; mi < 26; mi++) {
      var my = groundTop + 30 + mr() * 300;
      var depth = (my - groundTop) / 330;            // 0 at horizon → 1 forward
      var mx = mr() * VB_W;
      var mw = 70 + mr() * 150 + depth * 90;          // wider toward the viewer
      var mh = 14 + mr() * 22 + depth * 16;
      var light = mr() > 0.5;
      el('ellipse', { cx: g1f(mx), cy: g1f(my), rx: g1f(mw), ry: g1f(mh),
        fill: light ? BRI : '#000',
        opacity: (light ? (0.05 + depth * 0.04) : (0.07 + depth * 0.07)).toFixed(3) }, mott);
    }

    // ════ THE DRIVE — a raked-gravel ribbon from the gate seam (front, wide) back to
    //   the CENTERED manor door (narrow). Kept the exact taper + destination. ════
    var roadG = group('drive', parent);
    var Lf = 706, Rf = 894, Lb = 768, Rb = 832;      // front (y900) / back (y478) rails
    var yF = 900, yB = 478;
    function dLx(t) { return Lf + (Lb - Lf) * t; }   // t: 0 front → 1 back
    function dRx(t) { return Rf + (Rb - Rf) * t; }
    function dY(t)  { return yF + (yB - yF) * t; }
    var roadD = 'M ' + Lf + ' ' + yF + ' L ' + Rf + ' ' + yF +
                ' L ' + Rb + ' ' + yB + ' L ' + Lb + ' ' + yB + ' Z';
    // a soft cast shadow hugging the drive's edges so it beds into the grass
    el('path', { d: 'M ' + (Lf - 10) + ' ' + yF + ' L ' + (Rf + 10) + ' ' + yF +
      ' L ' + (Rb + 5) + ' ' + yB + ' L ' + (Lb - 5) + ' ' + yB + ' Z',
      fill: '#000', opacity: '0.22', filter: 'url(#glow-soft)' }, roadG);
    // the gravel bed
    el('path', { d: roadD, fill: ROAD }, roadG);
    // a darker centre-worn hollow either side of the crown (cart-track wear)
    el('path', { d: 'M ' + (Lf + 36) + ' ' + yF + ' L ' + (Lf + 70) + ' ' + yF +
      ' L ' + dLx(1) + ' ' + yB + ' L ' + (Lb + 14) + ' ' + yB + ' Z',
      fill: '#000', opacity: '0.10' }, roadG);
    el('path', { d: 'M ' + (Rf - 70) + ' ' + yF + ' L ' + (Rf - 36) + ' ' + yF +
      ' L ' + (Rb - 14) + ' ' + yB + ' L ' + dRx(1) + ' ' + yB + ' Z',
      fill: '#000', opacity: '0.10' }, roadG);
    // GRAVEL SCATTER — tiny stones speckled down the drive (perspective: bigger/closer
    // toward the front), a couple lit on top. Sparse so the drive reads raked, not busy.
    var gr = groundsRng(401);
    for (var gi = 0; gi < 44; gi++) {
      var t = gr() * gr();                            // bias toward the front (closer)
      var ty = dY(t);
      var spanL = dLx(t) + 6, spanR = dRx(t) - 6;
      var gx = spanL + gr() * (spanR - spanL);
      var grad = 1 - t;                                // 1 front → 0 back
      var rr = 0.7 + grad * 1.8;
      var lit = gr() > 0.62;
      el('circle', { cx: g1f(gx), cy: g1f(ty), r: g1f(rr),
        fill: lit ? BRI : '#000', opacity: (lit ? 0.22 : 0.18).toFixed(2) }, roadG);
    }
    // KERB STONES down each verge — a top-lit brass-bright edge that beds the drive,
    // brightest at the near front, fading back (lit from above).
    el('path', { d: 'M ' + Lf + ' ' + yF + ' L ' + Lb + ' ' + yB, fill: 'none',
      stroke: BRI, 'stroke-width': '1.6', opacity: '0.22' }, roadG);
    el('path', { d: 'M ' + Rf + ' ' + yF + ' L ' + Rb + ' ' + yB, fill: 'none',
      stroke: BRI, 'stroke-width': '1.6', opacity: '0.22' }, roadG);
    // the lit crown down the centre (raised, catching the sky)
    el('path', { d: 'M 800 ' + yF + ' L 800 ' + yB, fill: 'none',
      stroke: BRI, 'stroke-width': '2', opacity: '0.16' }, roadG);
    // a few faint cross-flags (paving seams) stepping back up the drive (perspective)
    var flagTs = [0.12, 0.30, 0.52, 0.76];
    for (var fi = 0; fi < flagTs.length; fi++) {
      var ft = flagTs[fi];
      el('line', { x1: g1f(dLx(ft)), y1: g1f(dY(ft)), x2: g1f(dRx(ft)), y2: g1f(dY(ft)),
        stroke: '#000', 'stroke-width': '1', opacity: (0.16 * (1 - ft) + 0.05).toFixed(2) }, roadG);
    }

    // ════ TUFTS — sparse grass blades only along the horizon line + the drive verges,
    //   so texture sits exactly where the eye reads the meadow's edges. ════
    drawTufts(parent);

    // two brass lamp-posts flanking the road just inside the grounds (emissive).
    // Nudged a touch OUTBOARD (x600 / x1000) so each warm globe sits over dark manor
    // wall, not over a lit window pane, and given more HEIGHT (h78, foot lowered to
    // y538) so they read as proper estate lamp-posts rather than bollards.
    drawLamp(parent, 600, 538, 78);
    drawLamp(parent, 1000, 538, 78);

    // ════ FOREGROUND APRON — the near cobbled paving the gate + piers stand ON.
    //   A shallow trapezoid (back edge y812 → y900) of HINTED individual flagstones in
    //   a fanning perspective grid, with a top-lit back lip. The biggest depth cue. ══
    var g = group('foreground-apron', parent);
    var apronTopY = 812;
    var aBackL = -40, aBackR = VB_W + 40;            // back edge (narrower visually due to fan)
    var aFrontL = -120, aFrontR = VB_W + 120;        // front edge (fans wider toward viewer)
    function aLx(t) { return aBackL + (aFrontL - aBackL) * t; }
    function aRx(t) { return aBackR + (aFrontR - aBackR) * t; }
    function aY(t)  { return apronTopY + (VB_H - apronTopY) * t; }
    // the paving slab (stone)
    el('path', { d: 'M ' + aBackL + ' ' + apronTopY + ' L ' + aBackR + ' ' + apronTopY +
      ' L ' + aFrontR + ' ' + VB_H + ' L ' + aFrontL + ' ' + VB_H + ' Z',
      fill: STONE }, g);
    // a subtle overall down-shade so the apron darkens away from the lit back lip
    el('path', { d: 'M ' + g1f(aLx(0.45)) + ' ' + g1f(aY(0.45)) + ' L ' + g1f(aRx(0.45)) + ' ' + g1f(aY(0.45)) +
      ' L ' + aFrontR + ' ' + VB_H + ' L ' + aFrontL + ' ' + VB_H + ' Z',
      fill: '#000', opacity: '0.10' }, g);

    // ════ PER-STONE FLAGSTONES (grafted from take 2) — the apron reads as INDIVIDUAL
    //   laid stones, not a uniform grid: a fanning grid of perspective joints + stagger-
    //   bonded course rows, each stone given its own slightly lighter/darker tonal face,
    //   a recessed left+bottom joint shadow, and a thin top-lit lip on its up-facing
    //   (back) edge. Deterministic so it never jitters. The single biggest depth cue. ══
    var ar = groundsRng(777);
    var cols = 18;
    var rowTs = [0.0, 0.20, 0.44, 0.72, 1.0];
    for (var ri = 0; ri < rowTs.length - 1; ri++) {
      var t0 = rowTs[ri], t1 = rowTs[ri + 1];
      var y0 = aY(t0), y1 = aY(t1);
      var stagger = (ri % 2) * 0.5;                  // alternate-row half-stone offset (bond)
      for (var jx = -1; jx < cols; jx++) {
        var cL = jx + stagger, cR = jx + 1 + stagger;
        var fcL = Math.max(0, cL / cols), fcR = Math.min(1, cR / cols);
        if (fcR <= 0 || fcL >= 1) continue;
        // stone quad corners (perspective: top edge from back row, bottom from front)
        var x0L = aLx(t0) + (aRx(t0) - aLx(t0)) * fcL;
        var x0R = aLx(t0) + (aRx(t0) - aLx(t0)) * fcR;
        var x1L = aLx(t1) + (aRx(t1) - aLx(t1)) * fcL;
        var x1R = aLx(t1) + (aRx(t1) - aLx(t1)) * fcR;
        var tint = ar();                              // gentle per-stone tonal variation
        // a hair more per-stone contrast than take 2 so the variation survives thumbnail
        var faceOp = (tint > 0.74) ? 0.09 : (tint < 0.26 ? -1 : 0);
        if (faceOp > 0) {                             // a slightly LIGHTER stone face
          el('path', { d: 'M ' + g1f(x0L) + ' ' + g1f(y0) + ' L ' + g1f(x0R) + ' ' + g1f(y0) +
            ' L ' + g1f(x1R) + ' ' + g1f(y1) + ' L ' + g1f(x1L) + ' ' + g1f(y1) + ' Z',
            fill: BRI, opacity: faceOp.toFixed(2) }, g);
        } else if (faceOp < 0) {                      // a slightly DARKER stone face
          el('path', { d: 'M ' + g1f(x0L) + ' ' + g1f(y0) + ' L ' + g1f(x0R) + ' ' + g1f(y0) +
            ' L ' + g1f(x1R) + ' ' + g1f(y1) + ' L ' + g1f(x1L) + ' ' + g1f(y1) + ' Z',
            fill: '#000', opacity: '0.10' }, g);
        }
        // recessed joint shadow on the stone's LEFT edge (lit from above → left in shade)
        el('path', { d: 'M ' + g1f(x0L) + ' ' + g1f(y0) + ' L ' + g1f(x1L) + ' ' + g1f(y1),
          stroke: '#000', 'stroke-width': '1.1', opacity: '0.20', fill: 'none' }, g);
        // a thin top-lit lip on the stone's UP-facing (back) edge
        el('path', { d: 'M ' + g1f(x0L + 1) + ' ' + g1f(y0 + 0.8) + ' L ' + g1f(x0R - 1) + ' ' + g1f(y0 + 0.8),
          stroke: BRI, 'stroke-width': '0.8', opacity: '0.09', fill: 'none' }, g);
      }
      // the course row joint (horizontal seam) at the bottom of this row
      el('path', { d: 'M ' + g1f(aLx(t1)) + ' ' + g1f(y1) + ' L ' + g1f(aRx(t1)) + ' ' + g1f(y1),
        stroke: '#000', 'stroke-width': '1.2', opacity: (0.22 - t1 * 0.08).toFixed(2), fill: 'none' }, g);
    }
    // a darker mortar shadow just under the back edge (sits the apron in front)
    el('rect', { x: aBackL, y: apronTopY, width: aBackR - aBackL, height: 8, fill: 'rgba(0,0,0,.30)' }, g);
    // top-lit front lip of the back edge — the apron's up-facing leading coping
    el('line', { x1: aBackL, y1: apronTopY + 1, x2: aBackR, y2: apronTopY + 1,
      stroke: BRI, 'stroke-width': '1.4', opacity: '0.26' }, g);
  }

  /* sparse grass TUFTS — small fan-of-blades clusters along the horizon line and the
     drive verges, drawn over the opaque plane so they texture only the read edges. */
  function drawTufts(parent) {
    var g = group('grass-tufts', parent);
    var FOL = 'var(--tree-foliage-ref, #2c3a40)';
    var GRASS = 'var(--grass-ref, #3c4a50)';
    var BRI = 'var(--brass-bright-ref, #f0d489)';
    var tr = groundsRng(53);
    function tuft(cx, by, sc, lit) {
      var blades = 3 + Math.floor(tr() * 3);
      for (var b = 0; b < blades; b++) {
        var spread = (b - (blades - 1) / 2) * 3.0 * sc;
        var lean = (tr() - 0.5) * 6 * sc;
        var hgt = (8 + tr() * 7) * sc;
        el('path', { d: 'M ' + g1f(cx + spread) + ' ' + g1f(by) +
          ' Q ' + g1f(cx + spread + lean * 0.5) + ' ' + g1f(by - hgt * 0.6) + ' ' +
          g1f(cx + spread + lean) + ' ' + g1f(by - hgt),
          fill: 'none', stroke: (lit && b === blades - 1) ? BRI : FOL,
          'stroke-width': g1f(1.0 * sc), 'stroke-linecap': 'round',
          opacity: (lit && b === blades - 1) ? '0.30' : '0.55' }, g);
      }
    }
    // a thin scatter ALONG THE HORIZON (small + faint — distance)
    for (var hi = 0; hi < 22; hi++) {
      var hx = tr() * VB_W;
      tuft(hx, 478 + tr() * 14, 0.5 + tr() * 0.3, tr() > 0.7);
    }
    // clusters hugging the DRIVE VERGES (a touch larger, catching the lamp/sky)
    var verge = [ [700, 880], [900, 880], [742, 660], [858, 660], [760, 540], [840, 540] ];
    for (var vi = 0; vi < verge.length; vi++) {
      var depth = 1 - (verge[vi][1] - 470) / 430;
      tuft(verge[vi][0], verge[vi][1], 0.8 + (1 - depth) * 0.6, true);
    }
    // a faint blanket of low GRASS-toned tufts to soften the bare plane near mid-field
    for (var li = 0; li < 14; li++) {
      var lx = tr() * VB_W, ly = 520 + tr() * 240;
      var blades = 2 + Math.floor(tr() * 2), sc = 0.6 + tr() * 0.4;
      for (var bb = 0; bb < blades; bb++) {
        var sp = (bb - (blades - 1) / 2) * 2.6 * sc;
        var hh = (6 + tr() * 5) * sc;
        el('path', { d: 'M ' + g1f(lx + sp) + ' ' + g1f(ly) +
          ' L ' + g1f(lx + sp + (tr() - 0.5) * 4) + ' ' + g1f(ly - hh),
          fill: 'none', stroke: GRASS, 'stroke-width': g1f(1.0 * sc),
          'stroke-linecap': 'round', opacity: '0.40' }, g);
      }
    }
  }

  function drawLamp(parent, x, baseY, h) {
    var g = group(null, parent);
    var BODY = 'rgba(11,14,22,.85)';
    var BRASS = 'var(--brass-stroke-ref, #c9a24a)';
    var BRI = 'var(--brass-bright-ref, #f0d489)';
    var FLAME = 'var(--lamp-flame-ref, #ffd27a)';
    var fL = function (n) { return (Math.round(n * 10) / 10); };
    var topY = baseY - h;                 // where the post meets the lantern collar

    // a soft cast shadow at the foot so the post stands on the grass (light from above)
    el('ellipse', { cx: x + 3, cy: baseY + 3, rx: 11, ry: 4, fill: '#000', opacity: '0.26' }, g);

    // ── stepped stone-dark BASE plinth (grafted from take 2: a crisper two-step foot) ──
    el('rect', { x: x - 7, y: baseY - 5, width: 14, height: 6, rx: 1, fill: BODY,
      stroke: BRASS, 'stroke-width': '1' }, g);
    el('rect', { x: x - 5, y: baseY - 9, width: 10, height: 5, rx: 1, fill: BODY,
      stroke: BRASS, 'stroke-width': '1' }, g);
    el('line', { x1: x - 6, y1: baseY - 4.4, x2: x + 6, y2: baseY - 4.4,
      stroke: BRI, 'stroke-width': '0.9', opacity: '0.4' }, g);

    // ── tapered POST (grafted from take 2: wider at the foot, narrower at the lantern —
    //    a more legible brass column than a straight shaft) ──
    el('path', { d: 'M ' + fL(x - 3.4) + ' ' + fL(baseY - 9) +
      ' L ' + fL(x + 3.4) + ' ' + fL(baseY - 9) +
      ' L ' + fL(x + 2.2) + ' ' + fL(topY + 3) +
      ' L ' + fL(x - 2.2) + ' ' + fL(topY + 3) + ' Z',
      fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    // a brass-bright sheen up the post's left (up-light) edge
    el('line', { x1: fL(x - 2.0), y1: fL(topY + 6), x2: fL(x - 3.0), y2: fL(baseY - 11),
      stroke: BRI, 'stroke-width': '0.9', opacity: '0.30' }, g);
    // a mid collar where the post meets the lantern
    el('rect', { x: x - 5, y: topY + 1, width: 10, height: 4, rx: 1, fill: BODY,
      stroke: BRASS, 'stroke-width': '1' }, g);

    // ── LANTERN HOUSING (grafted from take 2) — a glazed cage: dark body + brass
    //    stroke, a vertical glazing bar, and a flared brass-bright cap up top
    //    (lit from above). Cleaner proportions than take 3's straight cage. ──
    var lh = 17, lw = 17;
    var lx = x - lw / 2, ly = topY - lh + 2;
    // glass body (dark cage)
    el('path', { d: 'M ' + fL(lx + 1.5) + ' ' + fL(ly + lh) +
      ' L ' + fL(lx - 0.5) + ' ' + fL(ly + 2) +
      ' L ' + fL(lx + lw + 0.5) + ' ' + fL(ly + 2) +
      ' L ' + fL(lx + lw - 1.5) + ' ' + fL(ly + lh) + ' Z',
      fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    // glazing bar (vertical muntin)
    el('line', { x1: fL(x), y1: fL(ly + 2), x2: fL(x), y2: fL(ly + lh),
      stroke: BRASS, 'stroke-width': '0.8', opacity: '0.7' }, g);
    // flared CAP (a stepped brass roof) — top-lit
    el('path', { d: 'M ' + fL(lx - 2) + ' ' + fL(ly + 2) +
      ' L ' + fL(x) + ' ' + fL(ly - 5) +
      ' L ' + fL(lx + lw + 2) + ' ' + fL(ly + 2) + ' Z',
      fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('path', { d: 'M ' + fL(lx - 2) + ' ' + fL(ly + 2) + ' L ' + fL(x) + ' ' + fL(ly - 5),
      stroke: BRI, 'stroke-width': '1.1', opacity: '0.4', fill: 'none' }, g);
    // finial atop the cap
    el('circle', { cx: x, cy: ly - 7, r: 1.8, fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: x - 0.6, cy: ly - 7.6, r: 0.7, fill: BRI, opacity: '0.85' }, g);

    // ── EMISSIVE GLOBE (kept from take 3 — its strongest asset: a 3-layer warm point:
    //    wide soft halo + a tight bright bloom + a hot core + a glint). Sits inside the
    //    lantern cage (globe nudged DOWN to the cage centre per the judges). The hot
    //    core is trimmed ~12% (3.4 → 3.0) so the road lamp stays unambiguously SECONDARY
    //    to the pier lamps at full-moon brightness. Palette-immune so it blazes at night
    //    + recedes (but stays lit) by day. ──
    var globeY = ly + lh * 0.52;
    el('circle', { cx: x, cy: globeY, r: 18, fill: FLAME, opacity: '0.22', filter: 'url(#glow-soft)' }, g);
    el('circle', { cx: x, cy: globeY, r: 7, fill: FLAME, opacity: '0.5', filter: 'url(#glow-star)' }, g);
    el('circle', { cx: x, cy: globeY, r: 3.0, fill: FLAME }, g);
    el('circle', { cx: x - 1, cy: globeY - 1, r: 1.1, fill: '#fff', opacity: '0.7' }, g);
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
  // The bespoke rep draw fns, keyed by repKey. Any pick whose rep is NOT in this
  // map (the Glyph Stand fallback 'glyph-stand', or an unknown key) draws the
  // Glyph Stand placeholder. Future bespoke reps register their draw fn here.
  var REP_DRAW = {
    cairn: function (g, baseX, baseY, pick) { drawCairn(g, baseX, baseY); },
    'cavern-mound': function (g, baseX, baseY, pick) { drawRepCavern(g, baseX, baseY, pick); },
    'ripple-tank': function (g, baseX, baseY, pick) { drawRepRipple(g, baseX, baseY, pick); },
    'organ-pipes': function (g, baseX, baseY, pick) { drawRepOrganPipes(g, baseX, baseY, pick); }
  };

  function drawRoomRep(parent) {
    if (!Gate.rooms) return;
    var pick = Gate.rooms.pick(S._devRoom);
    var g = group('room-rep', parent);
    var baseX = 230, baseY = 720;   // bottom-left grounds, in front of the rise
    var draw = REP_DRAW[pick.rep] || drawGlyphStand;
    draw(g, baseX, baseY, pick);
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

  /* ── the CAVERN room-rep (The Physics Cavern, room id 'physics-lab') ──────────
     A squat rocky OUTCROP / mound: dark cool faceted ROCK (rep.swatch1 body +
     rep.swatch2 strata/light-catch) with brass-bright TOP-lit edges where the
     overhead light grazes the up-facing facets; at its base a dark ARCHED cave
     MOUTH glowing TEAL from within (rep.glow1, #7fd4c0) — pooled, brightest deep
     in the throat, fading out to the rim. LOW + WIDE, bottom-aligned at baseY,
     centered about cx. Estate idiom: faceted (not a blob), lit from above, glow
     is emissive (blazes at night via dayRecede, recedes in day). Aspect ~150×120
     inside [78..156]×[114..228]. */
  function drawRepCavern(parent, cx, baseY, pick) {
    var g = group('cavern-mound', parent);
    var ROCK = 'var(--rep-swatch1-ref, #6a7079)';        // swappable dark rock body
    var LITE = 'var(--rep-swatch2-ref, #878f99)';        // swappable lighter strata / light-catch facet
    var BRASS = 'var(--brass-stroke-ref, #9c8350)';      // brass edge stroke
    var BRI = 'var(--brass-bright-ref, #cdb375)';        // brass-bright TOP sheen
    var GLOW = 'var(--rep-glow1-ref, #7fd4c0)';          // EMISSIVE teal cave glow
    var fx = function (n) { return (Math.round(n * 10) / 10); };

    var W = 152, H = 104;                  // LOW + WIDE footprint (squat, hugging ground)
    var halfW = W / 2;                     // 76
    var topY = baseY - H;                  // y616 — mound crest region
    var L = cx - halfW, R = cx + halfW;    // x154 .. x306

    // a private soft-feather filter for the cave glow's deep pooled light
    var defs = parent.ownerSVGElement && parent.ownerSVGElement.querySelector('defs');
    if (defs && !defs.querySelector('#cavern-maw-glow')) {
      var fG = el('filter', { id: 'cavern-maw-glow', x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs);
      el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '5.5' }, fG);
    }

    // ── soft contact shadow so the mound sits ON the grass (light from above) ──
    el('ellipse', { cx: cx + 6, cy: baseY + 2, rx: halfW * 0.98, ry: 8,
      fill: '#000', opacity: '0.30', filter: 'url(#glow-soft)' }, g);

    // ════════════ ROCK BODY — a craggy, BLOCKY low outcrop silhouette ════════════
    // Built as a jagged, asymmetric run of angular ledges/steps — a broken rocky
    // mound, NOT a smooth dome or a tent. A higher-but-stubby left massif, a
    // notched saddle, a lower stepped right bench, and a heavy BROW that overhangs
    // the cave mouth. Many short angular segments → reads as fractured stone.
    var browY = topY + 40;                          // the overhanging brow top (over the maw)
    var bodyD =
      'M ' + fx(L) + ' ' + fx(baseY) +                              // ground left
      ' L ' + fx(L + 2) + ' ' + fx(baseY - 34) +                    // left lower face
      ' L ' + fx(cx - 60) + ' ' + fx(baseY - 50) +                  // left ledge step
      ' L ' + fx(cx - 66) + ' ' + fx(topY + 34) +                   // up the left massif
      ' L ' + fx(cx - 48) + ' ' + fx(topY + 14) +                   // left shoulder
      ' L ' + fx(cx - 34) + ' ' + fx(topY + 6) +                    // left sub-peak (the crest)
      ' L ' + fx(cx - 20) + ' ' + fx(topY + 20) +                   // down into notch
      ' L ' + fx(cx - 6) + ' ' + fx(topY + 10) +                    // small mid-peak
      ' L ' + fx(cx + 10) + ' ' + fx(topY + 30) +                   // saddle low point
      ' L ' + fx(cx + 30) + ' ' + fx(topY + 18) +                   // right shoulder rise
      ' L ' + fx(cx + 46) + ' ' + fx(topY + 38) +                   // step down
      ' L ' + fx(cx + 60) + ' ' + fx(topY + 34) +                   // right bench top
      ' L ' + fx(R - 4) + ' ' + fx(baseY - 52) +                    // right upper slope
      ' L ' + fx(R) + ' ' + fx(baseY - 26) +                        // right lower face
      ' L ' + fx(R - 2) + ' ' + fx(baseY) +                         // ground right
      ' Z';
    el('path', { d: bodyD, fill: ROCK, stroke: BRASS, 'stroke-width': '1.4',
      filter: 'url(#glow-soft)' }, g);

    // ════════════ FACET PLANES — lighter up/left-facing light-catch planes ════════
    // Up- and left-facing planes catch overhead light (LITE); down/right faces stay
    // ROCK. Big, distinct planes that break the silhouette into clear rock facets.
    // left massif up-face (the big lit shoulder) — broken into TWO planes by a fold
    // crease so the largest facet never reads as one flat sheet (graft fix).
    el('path', { d: 'M ' + fx(cx - 66) + ' ' + fx(topY + 34) +
      ' L ' + fx(cx - 48) + ' ' + fx(topY + 14) +
      ' L ' + fx(cx - 41) + ' ' + fx(topY + 22) +
      ' L ' + fx(cx - 50) + ' ' + fx(topY + 44) +
      ' L ' + fx(cx - 56) + ' ' + fx(topY + 52) + ' Z',
      fill: LITE, opacity: '0.60' }, g);
    // the lower-right sub-plane of the same shoulder (turns slightly away → dimmer)
    el('path', { d: 'M ' + fx(cx - 48) + ' ' + fx(topY + 14) +
      ' L ' + fx(cx - 34) + ' ' + fx(topY + 6) +
      ' L ' + fx(cx - 30) + ' ' + fx(topY + 30) +
      ' L ' + fx(cx - 50) + ' ' + fx(topY + 44) +
      ' L ' + fx(cx - 41) + ' ' + fx(topY + 22) + ' Z',
      fill: LITE, opacity: '0.44' }, g);
    // a thin shadow crease along the fold (reads as the break between planes)
    el('path', { d: 'M ' + fx(cx - 50) + ' ' + fx(topY + 44) + ' L ' + fx(cx - 41) + ' ' + fx(topY + 22),
      fill: 'none', stroke: 'rgba(0,0,0,.22)', 'stroke-width': '1', 'stroke-linecap': 'round' }, g);
    // mid-peak lit cap
    el('path', { d: 'M ' + fx(cx - 20) + ' ' + fx(topY + 20) +
      ' L ' + fx(cx - 6) + ' ' + fx(topY + 10) +
      ' L ' + fx(cx + 4) + ' ' + fx(topY + 30) +
      ' L ' + fx(cx - 12) + ' ' + fx(topY + 36) + ' Z',
      fill: LITE, opacity: '0.46' }, g);
    // right shoulder up-plane
    el('path', { d: 'M ' + fx(cx + 10) + ' ' + fx(topY + 30) +
      ' L ' + fx(cx + 30) + ' ' + fx(topY + 18) +
      ' L ' + fx(cx + 46) + ' ' + fx(topY + 38) +
      ' L ' + fx(cx + 28) + ' ' + fx(topY + 48) + ' Z',
      fill: LITE, opacity: '0.40' }, g);
    // a sharp bright chip on the crest sub-peak
    el('path', { d: 'M ' + fx(cx - 48) + ' ' + fx(topY + 14) +
      ' L ' + fx(cx - 34) + ' ' + fx(topY + 6) +
      ' L ' + fx(cx - 38) + ' ' + fx(topY + 20) + ' Z',
      fill: LITE, opacity: '0.66' }, g);
    // down/right SHADOW faces (a touch of dark to read the right side as turning away)
    el('path', { d: 'M ' + fx(cx + 60) + ' ' + fx(topY + 34) +
      ' L ' + fx(R - 4) + ' ' + fx(baseY - 52) +
      ' L ' + fx(R) + ' ' + fx(baseY - 26) +
      ' L ' + fx(cx + 54) + ' ' + fx(baseY - 22) + ' Z',
      fill: 'rgba(0,0,0,.18)' }, g);

    // ════════════ STRATA — broken sedimentary bedding LEDGES (grafted) ═══════════
    // A few short bedding ledges (NOT full-width courses): each is a thin lighter
    // slab inset from the rock edges + dipping slightly, carrying a brass-bright TOP
    // edge (lit from above) and an under-ledge shadow. Broken/inset so it reads as
    // weathered bedrock, never as masonry courses. Clipped to the squat body by an
    // edge sampler that tightens the span as the mound narrows upward.
    var leftEdgeAt = function (y) {            // approx left silhouette x at height y
      var t = Math.max(0, Math.min(1, (baseY - y) / H));
      return L + 4 + t * 56;                   // foot ~L+4, crest region ~cx-16
    };
    var rightEdgeAt = function (y) {           // approx right silhouette x at height y
      var t = Math.max(0, Math.min(1, (baseY - y) / H));
      return R - 4 - t * 16;                   // right flank only mildly inset (lower bench)
    };
    var beds = [
      { y: baseY - 22, x0f: 0.08, x1f: 0.60, dip: 3 },
      { y: baseY - 40, x0f: 0.18, x1f: 0.74, dip: -2 },
      { y: baseY - 56, x0f: 0.28, x1f: 0.64, dip: 2 },
      { y: baseY - 72, x0f: 0.32, x1f: 0.56, dip: -1 }
    ];
    for (var bi = 0; bi < beds.length; bi++) {
      var bd = beds[bi];
      var le = leftEdgeAt(bd.y), re = rightEdgeAt(bd.y);
      var span = re - le;
      var sx = le + span * bd.x0f, ex = le + span * bd.x1f;
      // a faint tonal slab below the ledge (lighter strata band)
      el('path', { d: 'M ' + fx(sx) + ' ' + fx(bd.y) + ' L ' + fx(ex) + ' ' + fx(bd.y + bd.dip) +
        ' L ' + fx(ex - 4) + ' ' + fx(bd.y + bd.dip + 9) + ' L ' + fx(sx + 4) + ' ' + fx(bd.y + 9) + ' Z',
        fill: LITE, stroke: 'none', opacity: (bi % 2 ? '0.50' : '0.30') }, g);
      // brass-bright bedding line riding the ledge's UP edge (lit from above)
      el('line', { x1: fx(sx), y1: fx(bd.y + 0.4), x2: fx(ex), y2: fx(bd.y + bd.dip + 0.4),
        stroke: BRI, 'stroke-width': '1', opacity: (bi % 2 ? '0.42' : '0.30') }, g);
      // soft shadow under the bedding ledge
      el('line', { x1: fx(sx + 4), y1: fx(bd.y + 9), x2: fx(ex - 4), y2: fx(bd.y + bd.dip + 9),
        stroke: 'rgba(0,0,0,.30)', 'stroke-width': '1' }, g);
    }
    // a couple of short vertical joint cracks (fractured stone)
    el('path', { d: 'M ' + fx(cx - 30) + ' ' + fx(baseY - 6) + ' L ' + fx(cx - 33) + ' ' + fx(baseY - 36),
      fill: 'none', stroke: 'rgba(0,0,0,.24)', 'stroke-width': '1.4', 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M ' + fx(cx + 50) + ' ' + fx(baseY - 4) + ' L ' + fx(cx + 47) + ' ' + fx(baseY - 40),
      fill: 'none', stroke: 'rgba(0,0,0,.22)', 'stroke-width': '1.4', 'stroke-linecap': 'round' }, g);

    // ════════════ BRASS-BRIGHT TOP EDGES — sheen on UP-facing rim facets ══════════
    // Trace the jagged up-facing ridgeline in brass-bright so the overhead light
    // reads as caught on the stone's top edges, matching the gate brass idiom.
    el('path', { d: 'M ' + fx(cx - 66) + ' ' + fx(topY + 34) +
      ' L ' + fx(cx - 48) + ' ' + fx(topY + 14) +
      ' L ' + fx(cx - 34) + ' ' + fx(topY + 6) +
      ' L ' + fx(cx - 20) + ' ' + fx(topY + 20) +
      ' L ' + fx(cx - 6) + ' ' + fx(topY + 10) +
      ' L ' + fx(cx + 10) + ' ' + fx(topY + 30) +
      ' L ' + fx(cx + 30) + ' ' + fx(topY + 18) +
      ' L ' + fx(cx + 46) + ' ' + fx(topY + 38) +
      ' L ' + fx(cx + 60) + ' ' + fx(topY + 34),
      fill: 'none', stroke: BRI, 'stroke-width': '1.2', opacity: '0.50',
      'stroke-linejoin': 'round', filter: 'url(#glow-soft)' }, g);
    // a brighter accent on the crest sub-peak itself
    el('path', { d: 'M ' + fx(cx - 48) + ' ' + fx(topY + 14) +
      ' L ' + fx(cx - 34) + ' ' + fx(topY + 6) +
      ' L ' + fx(cx - 22) + ' ' + fx(topY + 14),
      fill: 'none', stroke: BRI, 'stroke-width': '1.6', opacity: '0.82',
      'stroke-linecap': 'round' }, g);

    // ════════════ CAVE MOUTH — dark arched opening, glowing TEAL from within ══════
    // Sits near the base, slightly right of the crest so it nestles under the
    // overhang. Pooled glow: a wide soft halo deep in the throat, a brighter inner
    // pool, then the dark arch rim on top so the light reads as coming FROM inside.
    var mawCx = cx + 6, mawBaseY = baseY - 4;     // mouth sits just above groundline
    var mawW = 56, mawH = 58;                      // arch span / height
    var mawHalf = mawW / 2;
    var mawTopY = mawBaseY - mawH;
    // arched-opening path: flat floor + tall pointed-ish arch (springs from floor)
    var archD =
      'M ' + fx(mawCx - mawHalf) + ' ' + fx(mawBaseY) +
      ' L ' + fx(mawCx - mawHalf) + ' ' + fx(mawBaseY - mawH * 0.42) +
      ' Q ' + fx(mawCx - mawHalf) + ' ' + fx(mawTopY) + ' ' + fx(mawCx) + ' ' + fx(mawTopY) +
      ' Q ' + fx(mawCx + mawHalf) + ' ' + fx(mawTopY) + ' ' + fx(mawCx + mawHalf) + ' ' + fx(mawBaseY - mawH * 0.42) +
      ' L ' + fx(mawCx + mawHalf) + ' ' + fx(mawBaseY) +
      ' Z';

    // GRAFT (judges' consensus): replace Take 1's centered glowing egg-pool with
    // Take 2's THROAT-POOL treatment — a tapering tongue of teal rising from the
    // floor and narrowing UP into the dark (brightest deep + low, feathering toward
    // the arch) — kept inside Take 1's wider/lower maw shape (no vertical sidewalls).

    // 1) deep pooled glow — soft teal bloom seated low/deep in the throat. TIGHTENED
    //    from the winner (was rx 1.55·half / ry 0.62·H, slightly oversized + soft).
    el('ellipse', { cx: mawCx, cy: mawBaseY - mawH * 0.26, rx: mawHalf * 1.18, ry: mawH * 0.50,
      fill: GLOW, opacity: '0.34', filter: 'url(#cavern-maw-glow)' }, g);
    // 2) the dark mouth cavity (so the rim of the opening reads dark against rock)
    el('path', { d: archD, fill: 'rgba(6,10,12,.96)' }, g);
    // 3) THROAT POOL — a tapering tongue of light rising from the floor and narrowing
    //    up into the dark; feathered so it reads as pooled light in a recess, not an
    //    egg. Sized to Take 1's maw (mawHalf span, mawH height, foot on mawBaseY).
    var throatD = 'M ' + fx(mawCx - mawHalf * 0.66) + ' ' + fx(mawBaseY - 3) +
      ' Q ' + fx(mawCx - mawHalf * 0.58) + ' ' + fx(mawBaseY - mawH * 0.55) + ' ' + fx(mawCx - mawHalf * 0.16) + ' ' + fx(mawBaseY - mawH * 0.66) +
      ' Q ' + fx(mawCx) + ' ' + fx(mawBaseY - mawH * 0.70) + ' ' + fx(mawCx + mawHalf * 0.16) + ' ' + fx(mawBaseY - mawH * 0.66) +
      ' Q ' + fx(mawCx + mawHalf * 0.58) + ' ' + fx(mawBaseY - mawH * 0.55) + ' ' + fx(mawCx + mawHalf * 0.66) + ' ' + fx(mawBaseY - 3) + ' Z';
    el('path', { d: throatD, fill: GLOW, opacity: '0.70', filter: 'url(#cavern-maw-glow)' }, g);
    // 4) a hot teal core pooled DEEP and LOW in the throat (brightest point)
    el('ellipse', { cx: mawCx, cy: mawBaseY - mawH * 0.20, rx: mawHalf * 0.34, ry: mawH * 0.15,
      fill: GLOW, opacity: '0.95', filter: 'url(#cavern-maw-glow)' }, g);
    el('ellipse', { cx: mawCx, cy: mawBaseY - mawH * 0.19, rx: mawHalf * 0.16, ry: mawH * 0.075,
      fill: '#eafff8', opacity: '0.30', filter: 'url(#cavern-maw-glow)' }, g);
    // 5) teal light SPILL up the inner faces of the arch (rim catches the glow),
    //    following Take 1's arch curve — NOT vertical doorway walls.
    el('path', { d: 'M ' + fx(mawCx - mawHalf + 3) + ' ' + fx(mawBaseY - 4) +
      ' L ' + fx(mawCx - mawHalf + 3) + ' ' + fx(mawBaseY - mawH * 0.42) +
      ' Q ' + fx(mawCx - mawHalf + 3) + ' ' + fx(mawTopY + 4) + ' ' + fx(mawCx) + ' ' + fx(mawTopY + 4),
      fill: 'none', stroke: GLOW, 'stroke-width': '1.4', opacity: '0.42' }, g);
    el('path', { d: 'M ' + fx(mawCx + mawHalf - 3) + ' ' + fx(mawBaseY - 4) +
      ' L ' + fx(mawCx + mawHalf - 3) + ' ' + fx(mawBaseY - mawH * 0.42) +
      ' Q ' + fx(mawCx + mawHalf - 3) + ' ' + fx(mawTopY + 4) + ' ' + fx(mawCx) + ' ' + fx(mawTopY + 4),
      fill: 'none', stroke: GLOW, 'stroke-width': '1.2', opacity: '0.30' }, g);
    // 6) re-stroke the arch rim in brass — THICKENED + BRIGHTENED (graft fix) so the
    //    carved mouth lintel reads as estate brass, with a warm glow.
    el('path', { d: 'M ' + fx(mawCx - mawHalf) + ' ' + fx(mawBaseY - mawH * 0.42) +
      ' Q ' + fx(mawCx - mawHalf) + ' ' + fx(mawTopY) + ' ' + fx(mawCx) + ' ' + fx(mawTopY) +
      ' Q ' + fx(mawCx + mawHalf) + ' ' + fx(mawTopY) + ' ' + fx(mawCx + mawHalf) + ' ' + fx(mawBaseY - mawH * 0.42),
      fill: 'none', stroke: BRASS, 'stroke-width': '1.8', opacity: '0.85',
      filter: 'url(#glow-soft)' }, g);
    // 7) brass-bright top-lit catch riding the arch keystone (overhead light)
    el('path', { d: 'M ' + fx(mawCx - 13) + ' ' + fx(mawTopY + 3) +
      ' Q ' + fx(mawCx) + ' ' + fx(mawTopY - 1.5) + ' ' + fx(mawCx + 13) + ' ' + fx(mawTopY + 3),
      fill: 'none', stroke: BRI, 'stroke-width': '1.6', opacity: '0.80',
      'stroke-linecap': 'round' }, g);
    // 8) GRAFT — Take 2's forged brass KEYSTONE lintel: a small chevron + boss stud
    //    seated on the arch crown, tying the maw into the estate brass idiom.
    el('path', { d: 'M ' + fx(mawCx - 8) + ' ' + fx(mawTopY - 2) +
      ' L ' + fx(mawCx) + ' ' + fx(mawTopY - 8) + ' L ' + fx(mawCx + 8) + ' ' + fx(mawTopY - 2),
      fill: 'none', stroke: BRI, 'stroke-width': '1.4', opacity: '0.62',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('circle', { cx: fx(mawCx), cy: fx(mawTopY - 6), r: 2.4, fill: 'rgba(11,14,22,.85)',
      stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('circle', { cx: fx(mawCx - 0.6), cy: fx(mawTopY - 6.6), r: 1, fill: BRI, opacity: '0.88' }, g);
    // 9) a faint teal lick of light spilling onto the rock floor at the mouth's foot
    el('ellipse', { cx: mawCx, cy: mawBaseY + 1, rx: mawHalf * 0.82, ry: 4.5,
      fill: GLOW, opacity: '0.42', filter: 'url(#cavern-maw-glow)' }, g);

    S.refs.cavernRep = g;
  }

  /* ── the RIPPLE TANK room-rep (The Ripple Tank, room id 'ripple') ─────────────
     A wide shallow rectangular WATER TRAY on short brass legs: a low brass FRAME
     holding a sheet of water seen at a slight overhead tilt (a foreshortened top
     plane) so the SURFACE reads. The water is swappable blue/cyan (rep.swatch1
     deep body + rep.swatch2 lighter highlight) and carries CONCENTRIC RIPPLE
     RINGS radiating from an off-centre source point, with a faint caustic SHIMMER
     (rep.glow1, #7fe0e8) catching the light along the wave crests. Brass body:
     dark body rgba(11,14,22,.85) + brass stroke + brass-bright TOP-lit rim + short
     legs, all lit from above. HORIZONTAL aspect (WIDE + SHORT): ~150×84 inside
     [78..156]×[114..228]. Quiet estate instrument, not a cartoon puddle. */
  function drawRepRipple(parent, cx, baseY, pick) {
    var g = group('ripple-tank', parent);
    var WATER = 'var(--rep-swatch1-ref, #6a7079)';       // swappable deep water body
    var WLITE = 'var(--rep-swatch2-ref, #878f99)';       // swappable lighter water highlight
    var DARK = 'rgba(11,14,22,.85)';                     // estate brass dark body
    var BRASS = 'var(--brass-stroke-ref, #9c8350)';      // brass edge stroke
    var BRI = 'var(--brass-bright-ref, #cdb375)';        // brass-bright TOP sheen
    var SHIM = 'var(--rep-glow1-ref, #7fd4c0)';          // EMISSIVE caustic shimmer
    var fx = function (n) { return (Math.round(n * 10) / 10); };

    // ── footprint: WIDE + SHORT. tray rim at rimY, water plane tilts up behind. ──
    var W = 150;                          // tray full width
    var halfW = W / 2;                    // 75 → x155 .. x305
    var legH = 16;                        // short legs lift the tray off the grass
    var frameH = 22;                      // the visible front lip / wall thickness
    var rimY = baseY - legH;              // y704 — bottom of the tray body (front lip foot)
    var frontTopY = rimY - frameH;        // y682 — top of the front lip (near rim edge)
    var backRise = 30;                    // how far the far rim sits ABOVE the near rim
    var backTopY = frontTopY - backRise;  // y652 — far rim line (top of the tilted plane)
    var L = cx - halfW, R = cx + halfW;   // x155 .. x305
    // the tilted WATER PLANE is a trapezoid: wide near edge (front), inset far edge
    var inset = 9;                        // perspective inset of the far edge
    var nearL = L + 7, nearR = R - 7;     // near (front) water edge
    var farL = L + inset, farR = R - inset; // far (back) water edge

    // a private soft-feather filter for the caustic shimmer's pooled light
    var defs = parent.ownerSVGElement && parent.ownerSVGElement.querySelector('defs');
    if (defs && !defs.querySelector('#ripple-shimmer')) {
      var fS = el('filter', { id: 'ripple-shimmer', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
      el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '2.2' }, fS);
    }
    // a clip so the ripple rings never spill past the water plane
    if (defs && !defs.querySelector('#ripple-water-clip')) {
      var clip = el('clipPath', { id: 'ripple-water-clip' }, defs);
      el('path', { d: 'M ' + fx(nearL) + ' ' + fx(frontTopY) +
        ' L ' + fx(nearR) + ' ' + fx(frontTopY) +
        ' L ' + fx(farR) + ' ' + fx(backTopY) +
        ' L ' + fx(farL) + ' ' + fx(backTopY) + ' Z' }, clip);
    }

    // ── soft contact shadow so the tray sits ON the grass (light from above) ──
    // Tightened to UNDER the footprint (was offset +5 / rx halfW*0.9 which feathered
    // a grey halo out past the right leg). Centred, narrower, so no stray bleed.
    el('ellipse', { cx: cx + 1, cy: baseY + 2, rx: halfW * 0.78, ry: 6,
      fill: '#000', opacity: '0.30', filter: 'url(#glow-soft)' }, g);

    // ════════════ SHORT LEGS — two front + a hint of back, brass-edged ═══════════
    var legW = 9;
    var legs = [cx - halfW + 16, cx + halfW - 16];   // front-left, front-right
    for (var li = 0; li < legs.length; li++) {
      var lx = legs[li];
      el('rect', { x: fx(lx - legW / 2), y: fx(rimY - 1), width: legW, height: legH + 2,
        fill: DARK, stroke: BRASS, 'stroke-width': '1.4' }, g);
      // a tiny brass foot pad
      el('rect', { x: fx(lx - legW / 2 - 1.5), y: fx(baseY - 2.5), width: legW + 3, height: 3.5, rx: 1.3,
        fill: DARK, stroke: BRASS, 'stroke-width': '1.1' }, g);
      // brass-bright top-lit sliver down the leg's near edge
      el('line', { x1: fx(lx - legW / 2 + 0.6), y1: fx(rimY + 1), x2: fx(lx - legW / 2 + 0.6), y2: fx(baseY - 3),
        stroke: BRI, 'stroke-width': '1', opacity: '0.5' }, g);
    }

    // ════════════ THE WATER SHEET — the tilted top plane, drawn FIRST ════════════
    // deep water body fills the tilted trapezoid
    el('path', { d: 'M ' + fx(nearL) + ' ' + fx(frontTopY) +
      ' L ' + fx(nearR) + ' ' + fx(frontTopY) +
      ' L ' + fx(farR) + ' ' + fx(backTopY) +
      ' L ' + fx(farL) + ' ' + fx(backTopY) + ' Z',
      fill: WATER }, g);
    // a lighter wash toward the FAR/upper edge (water lightens with sky reflection up top)
    el('path', { d: 'M ' + fx(farL) + ' ' + fx(backTopY) +
      ' L ' + fx(farR) + ' ' + fx(backTopY) +
      ' L ' + fx((nearR + farR) / 2) + ' ' + fx((frontTopY + backTopY) / 2) +
      ' L ' + fx((nearL + farL) / 2) + ' ' + fx((frontTopY + backTopY) / 2) + ' Z',
      fill: WLITE, opacity: '0.40' }, g);

    // ════════════ CONCENTRIC RIPPLE RINGS — radiating from a source point ════════
    // The rings are flattened ellipses (the surface is seen at a tilt, so circles
    // foreshorten vertically). They emanate from an off-centre drop point, fading
    // outward, each carrying a bright caustic crest on its UPPER (lit) arc.
    var srcX = cx - 14;                                  // drop point, slightly left of centre
    var srcY = (frontTopY + backTopY) / 2 + 4;          // mid plane, a touch forward
    var ringClip = 'url(#ripple-water-clip)';
    // The rings RIPPLE: each crest is BORN at the strike point, scales outward, and
    // fades into the water at the rim — staggered begins give one continuous wavefront.
    // Built as ambient SMIL so the tank ripples with NO JS tick (S.refs.rippleRep stays
    // the Phase-D handle if a richer engine ever wants to drive it). Foreshortening is
    // preserved under scale because ry = rx·squash scales uniformly; non-scaling-stroke
    // keeps the crest lines delicate at every radius.
    var squash = 0.34;                                   // vertical foreshorten of the rings
    var RP = 3.6;                                        // ripple period (s)
    var NR = 5;                                          // rings in flight at once
    var BASE = 52;                                       // un-scaled crest radius (scaled sF→eF)
    var sF = 0.12, eF = 1.55;                            // birth / rim scale factors
    // a centred shimmer-crest arc (the upper lit arc) at radius BASE — scales with its ring
    var aL = -BASE * 0.78, aR = BASE * 0.78, aY = -BASE * squash * 0.62;
    var arcD = 'M ' + fx(aL) + ' ' + fx(aY) + ' A ' + fx(BASE) + ' ' + fx(BASE * squash) +
               ' 0 0 1 ' + fx(aR) + ' ' + fx(aY);
    // clip stays on an UNTRANSFORMED wrapper so the water-trapezoid clip is in absolute
    // coords; the strike point is the moving origin for the rings + pip nested inside it.
    var clipWrap = el('g', { 'clip-path': ringClip }, g);
    var rsrc = el('g', { transform: 'translate(' + fx(srcX) + ' ' + fx(srcY) + ')' }, clipWrap);
    for (var ri = 0; ri < NR; ri++) {
      var begin = fx(ri * (RP / NR)) + 's';
      var rgrp = el('g', {}, rsrc);
      // dark trough just outside the crest — relief at DAY brightness
      el('ellipse', { cx: 0, cy: 0, rx: fx(BASE + 1.6), ry: fx((BASE + 1.6) * squash),
        fill: 'none', stroke: 'rgba(0,0,0,.30)', 'stroke-width': '0.9',
        'vector-effect': 'non-scaling-stroke' }, rgrp);
      // the lighter wave crest (water highlight)
      el('ellipse', { cx: 0, cy: 0, rx: fx(BASE), ry: fx(BASE * squash),
        fill: 'none', stroke: WLITE, 'stroke-width': '1.5',
        'vector-effect': 'non-scaling-stroke' }, rgrp);
      // emissive caustic shimmer riding the upper lit arc
      el('path', { d: arcD, fill: 'none', stroke: SHIM, 'stroke-width': '1.1',
        'vector-effect': 'non-scaling-stroke', filter: 'url(#ripple-shimmer)' }, rgrp);
      // grow the wavefront outward (eased), forever
      el('animateTransform', { attributeName: 'transform', type: 'scale',
        values: sF + ';' + eF, dur: RP + 's', begin: begin, repeatCount: 'indefinite',
        calcMode: 'spline', keySplines: '0.25 0.1 0.35 1' }, rgrp);
      // born-bright, then fade into the water at the rim
      el('animate', { attributeName: 'opacity', values: '0;0.55;0.16;0',
        keyTimes: '0;0.12;0.7;1', dur: RP + 's', begin: begin, repeatCount: 'indefinite' }, rgrp);
    }
    // the bright drop point — a hot caustic pip where each wave is born, breathing in
    // time with the emanation (pooled bloom + hot pip + white spark).
    var pip = el('g', { transform: 'translate(' + fx(srcX) + ' ' + fx(srcY) + ')' }, clipWrap);
    el('ellipse', { cx: 0, cy: 0, rx: 8.5, ry: fx(8.5 * squash),
      fill: SHIM, opacity: '0.34', filter: 'url(#ripple-shimmer)' }, pip);
    el('ellipse', { cx: 0, cy: 0, rx: 3.6, ry: fx(3.6 * squash),
      fill: SHIM, opacity: '0.95', filter: 'url(#ripple-shimmer)' }, pip);
    el('ellipse', { cx: 0, cy: 0, rx: 1.5, ry: fx(1.5 * squash), fill: '#eafffb', opacity: '0.6' }, pip);
    el('animate', { attributeName: 'opacity', values: '0.62;1;0.62',
      keyTimes: '0;0.12;1', dur: RP + 's', begin: '0s', repeatCount: 'indefinite' }, pip);

    // ════════════ FAR RIM — the back wall lip behind the water (brass) ═══════════
    el('path', { d: 'M ' + fx(farL - 4) + ' ' + fx(backTopY - 4) +
      ' L ' + fx(farR + 4) + ' ' + fx(backTopY - 4) +
      ' L ' + fx(farR) + ' ' + fx(backTopY + 0.5) +
      ' L ' + fx(farL) + ' ' + fx(backTopY + 0.5) + ' Z',
      fill: DARK, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // brass-bright top-lit sheen on the far rim's UP edge (lit from above)
    el('line', { x1: fx(farL - 2), y1: fx(backTopY - 4 + 0.6), x2: fx(farR + 2), y2: fx(backTopY - 4 + 0.6),
      stroke: BRI, 'stroke-width': '1.2', opacity: '0.7' }, g);

    // ════════════ FRONT LIP — the near wall of the tray (the thick front face) ════
    // a slim chamfer connecting the near water edge down to the front lip top
    el('path', { d: 'M ' + fx(nearL) + ' ' + fx(frontTopY) +
      ' L ' + fx(nearR) + ' ' + fx(frontTopY) +
      ' L ' + fx(R) + ' ' + fx(frontTopY + 4) +
      ' L ' + fx(L) + ' ' + fx(frontTopY + 4) + ' Z',
      fill: WATER, opacity: '0.55' }, g);
    // the front face wall (the tray body the viewer sees head-on)
    el('path', { d: 'M ' + fx(L) + ' ' + fx(frontTopY + 4) +
      ' L ' + fx(R) + ' ' + fx(frontTopY + 4) +
      ' L ' + fx(R - 2) + ' ' + fx(rimY) +
      ' L ' + fx(L + 2) + ' ' + fx(rimY) + ' Z',
      fill: DARK, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // brass-bright top-lit rim along the FRONT lip's upper edge (the brightest line)
    el('line', { x1: fx(L + 1), y1: fx(frontTopY + 4 + 0.7), x2: fx(R - 1), y2: fx(frontTopY + 4 + 0.7),
      stroke: BRI, 'stroke-width': '1.4', opacity: '0.82' }, g);
    // a soft warm glow on the front rim so the brass reads as lit, not flat
    el('line', { x1: fx(L + 4), y1: fx(frontTopY + 4.4), x2: fx(R - 4), y2: fx(frontTopY + 4.4),
      stroke: BRI, 'stroke-width': '2.2', opacity: '0.28', filter: 'url(#glow-soft)' }, g);
    // two small brass corner studs on the front lip (estate furniture detail)
    el('circle', { cx: fx(L + 10), cy: fx(frontTopY + 4), r: 1.8, fill: DARK, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(R - 10), cy: fx(frontTopY + 4), r: 1.8, fill: DARK, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(L + 10), cy: fx(frontTopY + 3.5), r: 0.7, fill: BRI, opacity: '0.85' }, g);
    el('circle', { cx: fx(R - 10), cy: fx(frontTopY + 3.5), r: 0.7, fill: BRI, opacity: '0.85' }, g);
    // brass side stiles down the front-left and front-right corners
    el('line', { x1: fx(L + 1.5), y1: fx(frontTopY + 4), x2: fx(L + 2.5), y2: fx(rimY),
      stroke: BRI, 'stroke-width': '1', opacity: '0.45' }, g);
    el('line', { x1: fx(R - 1.5), y1: fx(frontTopY + 4), x2: fx(R - 2.5), y2: fx(rimY),
      stroke: BRI, 'stroke-width': '1', opacity: '0.35' }, g);

    // ── RIVETED PLATE detail on the front body (graft from take 3's rim craft) — turns
    //    the plain dark box into a lab instrument, not a speaker cabinet. Three faint
    //    brass plate seams break the front face into riveted panels, each seam carrying
    //    a column of small rivet dots; the body face is slightly inset top→bottom so the
    //    seams follow the box's mild taper.
    var seamFracs = [0.28, 0.5, 0.72];
    for (var si = 0; si < seamFracs.length; si++) {
      var sf = seamFracs[si];
      var sxT = L + 4 + (R - 4 - (L + 4)) * sf;      // x at the box TOP (frontTopY+5)
      var sxB = (L + 2) + ((R - 2) - (L + 2)) * sf;  // x at the box FOOT (rimY) — follows taper
      el('line', { x1: fx(sxT), y1: fx(frontTopY + 6), x2: fx(sxB), y2: fx(rimY - 1.5),
        stroke: BRASS, 'stroke-width': '0.9', opacity: '0.40' }, g);
      // rivet dots down the seam (three per seam), brass with a tiny top-lit catch
      for (var rd = 0; rd < 3; rd++) {
        var rt = 0.22 + rd * 0.30;
        var rdx = sxT + (sxB - sxT) * rt;
        var rdy = (frontTopY + 6) + ((rimY - 1.5) - (frontTopY + 6)) * rt;
        el('circle', { cx: fx(rdx), cy: fx(rdy), r: 1, fill: DARK, stroke: BRASS, 'stroke-width': '0.7' }, g);
        el('circle', { cx: fx(rdx), cy: fx(rdy - 0.4), r: 0.4, fill: BRI, opacity: '0.7' }, g);
      }
    }
    // two flush LEVEL-SCREW bosses on the front body sides (the tray's adjusters),
    // seated into the lower corners of the front face — instrument jewel detail.
    var bossY = rimY - frameH * 0.42;
    el('circle', { cx: fx(L + 7), cy: fx(bossY), r: 2.2, fill: DARK, stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('circle', { cx: fx(R - 7), cy: fx(bossY), r: 2.2, fill: DARK, stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('circle', { cx: fx(L + 6.4), cy: fx(bossY - 0.6), r: 0.8, fill: BRI, opacity: '0.8' }, g);
    el('circle', { cx: fx(R - 7.6), cy: fx(bossY - 0.6), r: 0.8, fill: BRI, opacity: '0.8' }, g);
    // a slim screw-slot across each boss (sells them as adjusters, not just studs)
    el('line', { x1: fx(L + 5.4), y1: fx(bossY), x2: fx(L + 8.6), y2: fx(bossY),
      stroke: BRASS, 'stroke-width': '0.7', opacity: '0.7' }, g);
    el('line', { x1: fx(R - 8.6), y1: fx(bossY), x2: fx(R - 5.4), y2: fx(bossY),
      stroke: BRASS, 'stroke-width': '0.7', opacity: '0.7' }, g);

    S.refs.rippleRep = g;
  }

  /* ── the ORGAN-PIPES room-rep (The Music Room, room id 'sound-garden') ─────────
     A rank of graduated brass ORGAN PIPES rising from a carved dark-wood CONSOLE:
     a row of round brass flue pipes stepped to a TALLEST-CENTER skyline (a classic
     mitred organ facade), each pipe a vertical brass tube with a cylindrical
     top-lit sheen down its left flank (lit from above-left, matching the gate), a
     brass-bright TOP rim + an upper-lip pipe-MOUTH that catches the overhead light,
     and a tapered conical FOOT seating it on the console toe-board. The console
     body is the swappable dark wood (rep.swatch1) with brass mouldings + a lit
     VIOLET stop-knob (rep.glow1, #cf7bff) — the night payoff that says "this room
     makes music". VERTICAL aspect (TALL + NARROW): ~108 wide × ~196 tall, bottom-
     aligned at baseY, centered about cx, inside [78..156]×[114..228]. Estate idiom:
     dark body rgba(11,14,22,.85) + brass stroke + brass-bright top edges; the only
     emissive is the violet stop + a soft console aura. */
  function drawRepOrganPipes(parent, cx, baseY, pick) {
    var g = group('organ-pipes', parent);
    var WOOD = 'var(--rep-swatch1-ref, #2e261c)';        // swappable dark wood console body
    var DARK = 'rgba(11,14,22,.85)';                     // estate brass dark body (pipe tubes)
    var BRASS = 'var(--brass-stroke-ref, #9c8350)';      // brass edge stroke
    var BRI = 'var(--brass-bright-ref, #cdb375)';        // brass-bright TOP / left sheen
    var VIO = 'var(--rep-glow1-ref, #cf7bff)';           // EMISSIVE violet music accent
    var fx = function (n) { return (Math.round(n * 10) / 10); };

    // ── footprint: TALL + NARROW. console at the foot, pipes grow UPWARD. ──
    var W = 108;                          // overall console width
    var halfW = W / 2;                    // 54 → x176 .. x284
    var conH = 36;                        // carved console block height
    var conTopY = baseY - conH;           // top of the console (pipes spring above)
    var conL = cx - halfW, conR = cx + halfW;

    // a private soft-feather filter for the violet stop's aura
    var defs = parent.ownerSVGElement && parent.ownerSVGElement.querySelector('defs');
    if (defs && !defs.querySelector('#organ-stop-glow')) {
      var fG = el('filter', { id: 'organ-stop-glow', x: '-120%', y: '-120%', width: '340%', height: '340%' }, defs);
      el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '4' }, fG);
    }

    // ── soft contact shadow so the console sits ON the grass (light from above) ──
    el('ellipse', { cx: cx + 5, cy: baseY + 3, rx: halfW * 0.94, ry: 8,
      fill: '#000', opacity: '0.30', filter: 'url(#glow-soft)' }, g);

    // ════════════ THE PIPE RANK — graduated round brass flue pipes ════════════════
    // 7 pipes stepped to a TALLEST-CENTER skyline. Each entry: x-offset from cx,
    // body radius, and total speaking length (foot+body) measured UP from the
    // toe-board (conTopY). Drawn back-to-front so the foreground centre pipe overlaps
    // its neighbours and the row reads as a packed rank, not a fence of equal sticks.
    var toeY = conTopY + 4;               // toe-board the pipe feet seat on
    var pipes = [
      { dx: -45, r: 8.5, len: 92 },
      { dx: -30, r: 9.5, len: 124 },
      { dx: -16, r: 10.5, len: 150 },
      { dx: 0, r: 12, len: 170 },        // tallest centre pipe
      { dx: 16, r: 10.5, len: 144 },
      { dx: 30, r: 9.5, len: 116 },
      { dx: 44, r: 8.5, len: 84 }
    ];
    // draw order: outermost first, working inward so centre sits ON TOP
    var order = [0, 6, 1, 5, 2, 4, 3];
    for (var oi = 0; oi < order.length; oi++) {
      var p = pipes[order[oi]];
      var px = cx + p.dx;
      var r = p.r;
      var topY = toeY - p.len;            // crown of this pipe
      var footLen = 22;                   // conical foot height
      var bodyBot = toeY - footLen;       // where the cylindrical body meets the foot
      var bodyTopY = topY + 8;            // body starts just below the crown lip

      // ── conical FOOT: a tapered cone from a point at the toe up to the body width
      var footD = 'M ' + fx(px) + ' ' + fx(toeY) +
        ' L ' + fx(px - r * 0.92) + ' ' + fx(bodyBot) +
        ' L ' + fx(px + r * 0.92) + ' ' + fx(bodyBot) + ' Z';
      el('path', { d: footD, fill: DARK, stroke: BRASS, 'stroke-width': '1.3',
        filter: 'url(#glow-soft)' }, g);
      // brass-bright catch down the foot's left (up-lit) edge
      el('line', { x1: fx(px - r * 0.34), y1: fx(bodyBot + 2), x2: fx(px - 1), y2: fx(toeY - 1),
        stroke: BRI, 'stroke-width': '1', opacity: '0.34' }, g);

      // ── cylindrical BODY: an OPEN-MOUTHED tube. The wall rises to a hollow bored
      //    crown (graft from Take 3 — the strongest 'open flue pipe' read), seated on
      //    Take 1's fuller round body. The tube proper runs up to bodyCrownY; the
      //    speaking end is an open elliptical BORE rimmed in brass. ──
      var crownY = topY + r * 0.42;        // where the tube wall meets the open rim plane
      var rimRy = Math.max(3.4, r * 0.52); // depth of the open bore oval (fuller pipe → deeper bore)
      el('rect', { x: fx(px - r), y: fx(crownY), width: fx(r * 2), height: fx(bodyBot - crownY),
        rx: 1.5, fill: DARK, stroke: BRASS, 'stroke-width': '1.4', filter: 'url(#glow-soft)' }, g);
      // the dark hollow BORE — an open ellipse capping the tube (the speaking end)
      el('ellipse', { cx: fx(px), cy: fx(crownY), rx: fx(r - 0.6), ry: fx(rimRy),
        fill: 'rgba(0,0,0,.58)', stroke: BRASS, 'stroke-width': '1.3' }, g);

      // ── cylindrical SHADING: a lighter brass sheen band down the LEFT flank
      //    (light from above-left), then a thin dark core toward the right so the
      //    tube reads round, not flat. ──
      el('rect', { x: fx(px - r + 1.2), y: fx(crownY), width: fx(r * 0.78), height: fx(bodyBot - crownY),
        rx: 1.2, fill: BRI, opacity: '0.24' }, g);
      // a brighter specular column near the left highlight (polished-brass glint)
      el('rect', { x: fx(px - r + 1.8), y: fx(crownY), width: fx(r * 0.26), height: fx(bodyBot - crownY),
        rx: 1, fill: BRI, opacity: '0.40' }, g);
      // a thin hot specular line on the up-lit edge so the tube reads polished
      el('line', { x1: fx(px - r + 2.4), y1: fx(crownY + 2), x2: fx(px - r + 2.4), y2: fx(bodyBot - 2),
        stroke: BRI, 'stroke-width': '1', opacity: '0.5' }, g);
      // dark core toward the right so the cylinder turns away (rounds the tube)
      el('rect', { x: fx(px + r * 0.40), y: fx(crownY), width: fx(r * 0.52), height: fx(bodyBot - crownY),
        fill: 'rgba(0,0,0,.30)' }, g);

      // ── brass-bright BACK rim of the open bore — the brightest catch (lit above) ──
      el('path', { d: 'M ' + fx(px - r + 0.8) + ' ' + fx(crownY) +
        ' A ' + fx(r - 0.6) + ' ' + fx(rimRy) + ' 0 0 1 ' + fx(px + r - 0.8) + ' ' + fx(crownY),
        fill: 'none', stroke: BRI, 'stroke-width': '1.5', opacity: '0.85',
        'stroke-linecap': 'round' }, g);
      // a brass collar band just below the mouth (the pipe's neck ferrule)
      el('line', { x1: fx(px - r + 1), y1: fx(crownY + rimRy + 1.6), x2: fx(px + r - 1), y2: fx(crownY + rimRy + 1.6),
        stroke: BRI, 'stroke-width': '1', opacity: '0.5' }, g);

      // ── the pipe MOUTH: an upper-lip cut a third of the way down — a small
      //    brass-rimmed inverted-V flue mouth that catches the light (reads as an
      //    organ flue pipe, not a plain rod). ──
      var mouthY = bodyBot - (bodyBot - bodyTopY) * 0.34;
      var mw = r * 0.84;
      // dark mouth recess
      el('path', { d: 'M ' + fx(px - mw) + ' ' + fx(mouthY) +
        ' L ' + fx(px) + ' ' + fx(mouthY - 7) +
        ' L ' + fx(px + mw) + ' ' + fx(mouthY) +
        ' L ' + fx(px + mw) + ' ' + fx(mouthY + 4) +
        ' L ' + fx(px - mw) + ' ' + fx(mouthY + 4) + ' Z',
        fill: 'rgba(0,0,0,.42)', stroke: BRASS, 'stroke-width': '1' }, g);
      // brass-bright lip on the up-facing inverted-V (lit from above)
      el('path', { d: 'M ' + fx(px - mw) + ' ' + fx(mouthY) +
        ' L ' + fx(px) + ' ' + fx(mouthY - 7) + ' L ' + fx(px + mw) + ' ' + fx(mouthY),
        fill: 'none', stroke: BRI, 'stroke-width': '1.2', opacity: '0.78',
        'stroke-linejoin': 'round' }, g);
      // a tiny brass languid bar across the mouth foot
      el('line', { x1: fx(px - mw), y1: fx(mouthY + 4), x2: fx(px + mw), y2: fx(mouthY + 4),
        stroke: BRASS, 'stroke-width': '1', opacity: '0.7' }, g);
    }

    // ════════════ THE CONSOLE — a carved dark-wood block the pipes rise from ══════
    // stepped plinth: a wider base course + the main console body + a brass impost
    // shelf the pipe feet stand on.
    // base course (widest)
    el('rect', { x: fx(conL - 5), y: fx(baseY - 11), width: fx(W + 10), height: 11, rx: 2.5,
      fill: WOOD, stroke: BRASS, 'stroke-width': '1.4', filter: 'url(#glow-soft)' }, g);
    // main console body
    el('rect', { x: fx(conL), y: fx(conTopY), width: fx(W), height: fx(conH - 11), rx: 2,
      fill: WOOD, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // a recessed carved panel on the console face (light-catch reveal)
    el('rect', { x: fx(conL + 8), y: fx(conTopY + 5), width: fx(W - 16), height: fx(conH - 11 - 10), rx: 1.5,
      fill: 'rgba(0,0,0,.20)', stroke: 'rgba(0,0,0,.28)', 'stroke-width': '1' }, g);
    // ── the KEYBOARD MANUAL — a thin brass-lipped keybed across the console face
    //    (graft from Take 3 — the single best 'this is a playable organ console' cue).
    //    Seated in the upper reveal of the recessed panel; the lit violet stop sits
    //    below it. ──
    var kbX = conL + 13, kbW = W - 26, kbY = conTopY + 7.5, kbH = 5;
    el('rect', { x: fx(kbX), y: fx(kbY), width: fx(kbW), height: kbH, rx: 1,
      fill: '#d9d2c2', stroke: BRASS, 'stroke-width': '0.9', opacity: '0.85' }, g);
    // black-key ticks across the manual (short marks reading as keys)
    var nKeys = 13;
    for (var k = 1; k < nKeys; k++) {
      var kx = kbX + (kbW / nKeys) * k;
      el('line', { x1: fx(kx), y1: fx(kbY + 0.6), x2: fx(kx), y2: fx(kbY + kbH * 0.6),
        stroke: 'rgba(11,14,22,.85)', 'stroke-width': '0.9' }, g);
    }
    // brass-bright top-lit lip of the keybed (lit from above)
    el('line', { x1: fx(kbX), y1: fx(kbY + 0.5), x2: fx(kbX + kbW), y2: fx(kbY + 0.5),
      stroke: BRI, 'stroke-width': '0.9', opacity: '0.55' }, g);
    // brass IMPOST shelf — the toe-board the pipe feet seat on (a brass moulding)
    el('rect', { x: fx(conL + 2), y: fx(conTopY - 4), width: fx(W - 4), height: 6, rx: 1.5,
      fill: DARK, stroke: BRASS, 'stroke-width': '1.3' }, g);
    // brass-bright top edges (lit from above) on the impost + base course
    el('line', { x1: fx(conL + 3), y1: fx(conTopY - 3.2), x2: fx(conR - 3), y2: fx(conTopY - 3.2),
      stroke: BRI, 'stroke-width': '1.2', opacity: '0.6' }, g);
    el('line', { x1: fx(conL - 3), y1: fx(baseY - 10.2), x2: fx(conR + 3), y2: fx(baseY - 10.2),
      stroke: BRI, 'stroke-width': '1', opacity: '0.4' }, g);
    // brass-bright sheen up the console's left (up-lit) edge
    el('line', { x1: fx(conL + 1.4), y1: fx(baseY - 12), x2: fx(conL + 1.4), y2: fx(conTopY + 2),
      stroke: BRI, 'stroke-width': '1.1', opacity: '0.34' }, g);

    // ════════════ THE LIT VIOLET STOP-KNOB — the night payoff (rep.glow1) ═════════
    // a small drawn brass stop-knob on the console face, its jewel glowing violet —
    // EMISSIVE so it blazes at night + recedes in day (dayRecede). A soft aura pools
    // around it; a flanking pair of dimmer drawstops echoes a stop-jamb.
    var stopY = conTopY + (conH - 11) - 4.5;     // seated low on the face, below the manual
    // soft violet aura at the console
    el('ellipse', { cx: cx, cy: stopY, rx: 15, ry: 9, fill: VIO, opacity: '0.22',
      filter: 'url(#organ-stop-glow)' }, g);
    // brass knob ring + glowing jewel core
    el('circle', { cx: fx(cx), cy: fx(stopY), r: 5.2, fill: DARK, stroke: BRASS, 'stroke-width': '1.4' }, g);
    el('circle', { cx: fx(cx), cy: fx(stopY), r: 3, fill: VIO, opacity: '0.95',
      filter: 'url(#organ-stop-glow)' }, g);
    el('circle', { cx: fx(cx - 0.8), cy: fx(stopY - 0.8), r: 1.1, fill: '#fff', opacity: '0.55' }, g);
    // brass-bright top rim on the knob (lit from above)
    el('path', { d: 'M ' + fx(cx - 3.4) + ' ' + fx(stopY - 3) + ' Q ' + fx(cx) + ' ' + fx(stopY - 5.6) + ' ' + fx(cx + 3.4) + ' ' + fx(stopY - 3),
      fill: 'none', stroke: BRI, 'stroke-width': '1.1', opacity: '0.7', 'stroke-linecap': 'round' }, g);
    // two flanking COMPANION drawstops — defined brass rings with a top-lit catch so
    // they read clearly as a stop-jamb (winner-fix: don't let them vanish).
    var sjx = 23;
    for (var si = -1; si <= 1; si += 2) {
      el('circle', { cx: fx(cx + si * sjx), cy: fx(stopY), r: 3.8, fill: DARK, stroke: BRASS, 'stroke-width': '1.4' }, g);
      // a small recessed jewel face so the companion stop has a visible eye
      el('circle', { cx: fx(cx + si * sjx), cy: fx(stopY), r: 1.6, fill: 'rgba(0,0,0,.45)', stroke: BRASS, 'stroke-width': '0.7' }, g);
      // brass-bright top-lit glint on the ring (lit from above)
      el('path', { d: 'M ' + fx(cx + si * sjx - 2.6) + ' ' + fx(stopY - 2.4) + ' Q ' + fx(cx + si * sjx) + ' ' + fx(stopY - 4.3) + ' ' + fx(cx + si * sjx + 2.6) + ' ' + fx(stopY - 2.4),
        fill: 'none', stroke: BRI, 'stroke-width': '1', opacity: '0.7', 'stroke-linecap': 'round' }, g);
    }

    S.refs.organRep = g;
  }

  /* ── the GLYPH STAND — the fallback rep for every room WITHOUT a bespoke rep
     (§4.2 / §5.7). A GREYBOX PLACEHOLDER (a foundry beauty pass comes later): a
     simple brass-edged stone PLINTH bottom-aligned at the ground line, holding the
     room's glyph in a small framed slot, with the room's accent as a self-lit pip.
     The plinth body reads as a swappable surface via --rep-swatch1-ref so it dims
     with B and recolors per band; brass edges via --brass-stroke/bright-ref; lit
     from above. The accent pip uses the room's OWN accent hex directly (a per-room
     self-lit marker, like the slab's accent dot) rather than a glow slot.
     Bottom-aligned at baseY (~y720, the ground line); sized within the rep range
     (width ~96, height ~138 → inside [78..156] × [114..228]). NOT ornate. */
  function drawGlyphStand(parent, cx, baseY, pick) {
    var g = group('glyph-stand', parent);
    var BODY = 'var(--rep-swatch1-ref, #6a7079)';        // swappable stone body
    var DARK = 'rgba(11,14,22,.85)';                      // estate brass dark body
    var BRASS = 'var(--brass-stroke-ref, #c9a24a)';      // brass edge stroke
    var BRI = 'var(--brass-bright-ref, #f0d489)';        // brass-bright TOP sheen
    var accent = (pick && pick.accent) || '#9aa0a8';     // room's self-lit accent pip
    var glyph = (pick && pick.glyph) || '◆';
    var fx = function (n) { return (Math.round(n * 10) / 10); };

    // TAKE 1 — "the museum label-plinth": a dignified stone pedestal carrying an
    // ARCHED brass display cartouche. Stepped masonry base → tapered shaft (lit
    // left edge, recessed light-catch panel, mortar course) → brass cornice → an
    // arched-top brass-framed slot holding the room's glyph, with corner studs and
    // a self-lit accent jewel crowning the arch keystone. Restraint: one tall quiet
    // fixture, read-at-distance silhouette, all brass top-lit from above.

    var W = 102, H = 150;                 // overall footprint (inside [78..156]x[114..228])
    var topY = baseY - H;                 // cartouche top
    var halfW = W / 2;

    // ── soft cast shadow so the plinth stands ON the grass (light from above) ──
    el('ellipse', { cx: cx + 5, cy: baseY + 3, rx: halfW * 0.82, ry: 8.5,
      fill: '#000', opacity: '0.28', filter: 'url(#glow-soft)' }, g);

    // ════════════ STEPPED STONE BASE (two courses + a plinth riser) ════════════
    // lower (widest) course
    el('rect', { x: fx(cx - halfW), y: fx(baseY - 13), width: W, height: 13, rx: 2,
      fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // chamfer shadow on the lower course's forward face
    el('rect', { x: fx(cx - halfW + 1.4), y: fx(baseY - 5), width: W - 2.8, height: 4,
      fill: 'rgba(0,0,0,.20)' }, g);
    // upper course (stepped in)
    el('rect', { x: fx(cx - halfW + 9), y: fx(baseY - 24), width: W - 18, height: 12, rx: 2,
      fill: BODY, stroke: BRASS, 'stroke-width': '1.3' }, g);
    // top-lit lips on each up-facing course edge
    el('line', { x1: fx(cx - halfW + 3), y1: fx(baseY - 12.2), x2: fx(cx + halfW - 3), y2: fx(baseY - 12.2),
      stroke: BRI, 'stroke-width': '1', opacity: '0.32' }, g);
    el('line', { x1: fx(cx - halfW + 12), y1: fx(baseY - 23.2), x2: fx(cx + halfW - 12), y2: fx(baseY - 23.2),
      stroke: BRI, 'stroke-width': '1', opacity: '0.40' }, g);

    // ════════════ SHAFT — slender tapered pillar rising from the base ════════════
    var shaftBot = baseY - 24;
    var shaftTopY = topY + 30;            // cornice begins here
    var shBotW = W - 30, shTopW = W - 40; // gentle upward taper
    var sbL = cx - shBotW / 2, sbR = cx + shBotW / 2;
    var stL = cx - shTopW / 2, stR = cx + shTopW / 2;
    el('path', { d: 'M ' + fx(sbL) + ' ' + fx(shaftBot) + ' L ' + fx(stL) + ' ' + fx(shaftTopY) +
      ' L ' + fx(stR) + ' ' + fx(shaftTopY) + ' L ' + fx(sbR) + ' ' + fx(shaftBot) + ' Z',
      fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    // recessed light-catch panel down the shaft face (like the gate piers)
    el('path', { d: 'M ' + fx(sbL + 7) + ' ' + fx(shaftBot - 5) + ' L ' + fx(stL + 6) + ' ' + fx(shaftTopY + 5) +
      ' L ' + fx(stR - 6) + ' ' + fx(shaftTopY + 5) + ' L ' + fx(sbR - 7) + ' ' + fx(shaftBot - 5) + ' Z',
      fill: 'rgba(0,0,0,.12)', stroke: 'rgba(0,0,0,.22)', 'stroke-width': '1' }, g);
    // brass-bright catch riding the panel's LEFT (up-lit) reveal — lifts the
    // column structure so it stays legible at night, not a black void.
    el('line', { x1: fx(sbL + 8.2), y1: fx(shaftBot - 7), x2: fx(stL + 7.2), y2: fx(shaftTopY + 7),
      stroke: BRI, 'stroke-width': '1', opacity: '0.20' }, g);
    // a DELIBERATE brass-collared course-marker banding the shaft (a machined
    // band + a center boss, grafted from Take 2's boss idiom) — reads as a
    // purposeful course, never as a crack/seam in the stone.
    var midY = (shaftBot + shaftTopY) / 2;
    var mFrac = (shaftBot - midY) / (shaftBot - shaftTopY);
    var mL = sbL + (stL - sbL) * mFrac, mR = sbR + (stR - sbR) * mFrac;
    var bandH = 5;
    // recessed band body with a brass edge on each rail
    el('rect', { x: fx(mL + 2), y: fx(midY - bandH / 2), width: fx(mR - mL - 4), height: bandH, rx: 1.2,
      fill: 'rgba(0,0,0,.22)', stroke: BRASS, 'stroke-width': '1.1' }, g);
    // brass-bright top rail of the band (lit from above)
    el('line', { x1: fx(mL + 3), y1: fx(midY - bandH / 2 + 0.6), x2: fx(mR - 3), y2: fx(midY - bandH / 2 + 0.6),
      stroke: BRI, 'stroke-width': '1', opacity: '0.42' }, g);
    // center machined boss — a small brass rivet seated mid-course
    el('circle', { cx: fx(cx), cy: fx(midY), r: 3, fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('circle', { cx: fx(cx - 0.6), cy: fx(midY - 0.6), r: 1.1, fill: BRI, opacity: '0.9' }, g);
    // brass-bright sheen up the shaft's LEFT (up-lit) edge — lifted so the
    // column structure stays legible at night.
    el('line', { x1: fx(sbL + 1.6), y1: fx(shaftBot - 3), x2: fx(stL + 1.6), y2: fx(shaftTopY + 3),
      stroke: BRI, 'stroke-width': '1.3', opacity: '0.40' }, g);

    // ════════════ CORNICE — a stepped brass collar capping the shaft ════════════
    var corY = shaftTopY - 8, corW = W - 22, corL = cx - corW / 2;
    el('rect', { x: fx(corL), y: fx(corY), width: corW, height: 12, rx: 2,
      fill: BODY, stroke: BRASS, 'stroke-width': '1.4' }, g);
    el('rect', { x: fx(corL - 4), y: fx(corY - 5), width: corW + 8, height: 6, rx: 1.5,
      fill: BODY, stroke: BRASS, 'stroke-width': '1.3' }, g);
    // cornice top-edge sheen — lifted so the collar reads as the structural
    // shelf the cartouche seats onto, even at night.
    el('line', { x1: fx(corL - 3), y1: fx(corY - 4.4), x2: fx(corL + corW + 3), y2: fx(corY - 4.4),
      stroke: BRI, 'stroke-width': '1.2', opacity: '0.62' }, g);

    // ════════════ ARCHED DISPLAY CARTOUCHE — the brass-framed glyph slot ════════
    var slotW = 70, slotH = 50;
    var slotX = cx - slotW / 2;
    var slotBot = corY - 6;               // sits just above the cornice
    var slotTop = slotBot - slotH;        // straight-side top, arch springs above
    var archR = slotW / 2;                // semicircular arch radius
    var archApex = slotTop - archR;       // peak of the arch
    // glyph center: midpoint of the FULL arched opening (apex..base), nudged down
    // slightly so the optical mass of the emoji sits centered in the cartouche.
    var slotCy = (archApex + slotBot) / 2 + 8.5;
    // arched frame outline: up the left, semicircle over, down the right, base
    var frameD = 'M ' + fx(slotX) + ' ' + fx(slotBot) +
      ' L ' + fx(slotX) + ' ' + fx(slotTop) +
      ' A ' + fx(archR) + ' ' + fx(archR) + ' 0 0 1 ' + fx(slotX + slotW) + ' ' + fx(slotTop) +
      ' L ' + fx(slotX + slotW) + ' ' + fx(slotBot) + ' Z';
    // outer brass frame body (the estate dark brass body)
    el('path', { d: frameD, fill: DARK, stroke: BRASS, 'stroke-width': '1.8', filter: 'url(#glow-soft)' }, g);
    el('path', { d: frameD, fill: 'none', stroke: BRASS, 'stroke-width': '1.8' }, g);
    // inner bevel reveal (a thinner brass line inset — a framed reveal)
    var inset = 5;
    var ix = slotX + inset, iw = slotW - inset * 2, ir = archR - inset;
    var iTop = slotTop, iApexY = iTop - ir;
    var innerD = 'M ' + fx(ix) + ' ' + fx(slotBot - inset) +
      ' L ' + fx(ix) + ' ' + fx(iTop) +
      ' A ' + fx(ir) + ' ' + fx(ir) + ' 0 0 1 ' + fx(ix + iw) + ' ' + fx(iTop) +
      ' L ' + fx(ix + iw) + ' ' + fx(slotBot - inset) + ' Z';
    el('path', { d: innerD, fill: 'rgba(0,0,0,.30)', stroke: BRASS, 'stroke-width': '1', opacity: '0.85' }, g);
    // brass-bright sheen riding the TOP of the arch (lit from above)
    el('path', { d: 'M ' + fx(slotX + 3) + ' ' + fx(slotTop) +
      ' A ' + fx(archR - 3) + ' ' + fx(archR - 3) + ' 0 0 1 ' + fx(slotX + slotW - 3) + ' ' + fx(slotTop),
      fill: 'none', stroke: BRI, 'stroke-width': '1.3', opacity: '0.55' }, g);

    // ── brass YOKE seating the cartouche onto the cornice (grafted from Take 2's
    // explicit attachment idiom): a short collar bridging the frame base down to
    // the cornice shelf, so the arch visibly SEATS rather than just stacks. ──
    var yokeW = slotW - 18, yokeL = cx - yokeW / 2;
    el('rect', { x: fx(yokeL), y: fx(slotBot - 1), width: yokeW, height: fx((corY - 5) - (slotBot - 1)), rx: 1.4,
      fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    el('line', { x1: fx(yokeL + 1), y1: fx(slotBot - 0.4), x2: fx(yokeL + yokeW - 1), y2: fx(slotBot - 0.4),
      stroke: BRI, 'stroke-width': '1', opacity: '0.45' }, g);

    // corner studs (brass rosettes) anchoring all FOUR corners of the cartouche
    // (lower corners + the arch springline corners) for estate-brass symmetry.
    var studY = slotBot - 5;
    var springY = slotTop + 2;            // where the arch springs from the verticals
    el('circle', { cx: fx(slotX + 4), cy: fx(studY), r: 2.3, fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(slotX + slotW - 4), cy: fx(studY), r: 2.3, fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(slotX + 4), cy: fx(springY), r: 2.3, fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(slotX + slotW - 4), cy: fx(springY), r: 2.3, fill: BODY, stroke: BRASS, 'stroke-width': '1' }, g);
    el('circle', { cx: fx(slotX + 4), cy: fx(studY - 0.7), r: 0.9, fill: BRI, opacity: '0.85' }, g);
    el('circle', { cx: fx(slotX + slotW - 4), cy: fx(studY - 0.7), r: 0.9, fill: BRI, opacity: '0.85' }, g);
    el('circle', { cx: fx(slotX + 4), cy: fx(springY - 0.7), r: 0.9, fill: BRI, opacity: '0.85' }, g);
    el('circle', { cx: fx(slotX + slotW - 4), cy: fx(springY - 0.7), r: 0.9, fill: BRI, opacity: '0.85' }, g);

    // ── the room's GLYPH, centered in the arched reveal ──
    var gt = el('text', { x: fx(cx), y: fx(slotCy + 4), 'text-anchor': 'middle',
      'dominant-baseline': 'central', 'font-size': '40',
      'font-family': 'Georgia, serif' }, g);
    gt.textContent = glyph;

    // ════════════ KEYSTONE ACCENT JEWEL — a self-lit pip crowning the arch ═══════
    // the room's OWN accent treated as a self-lit marker; layered soft halo + hot
    // core (the night payoff for an otherwise-receding stone fixture).
    var jewelY = archApex - 5;
    // wide soft accent halo (the room's color, glowing)
    el('circle', { cx: fx(cx), cy: fx(jewelY), r: 7.5, fill: accent, opacity: '0.55', filter: 'url(#glow-soft)' }, g);
    // a small brass keystone setting cradling the jewel
    el('path', { d: 'M ' + fx(cx - 6.5) + ' ' + fx(jewelY + 6) + ' L ' + fx(cx - 4.2) + ' ' + fx(jewelY - 4.5) +
      ' L ' + fx(cx + 4.2) + ' ' + fx(jewelY - 4.5) + ' L ' + fx(cx + 6.5) + ' ' + fx(jewelY + 6) + ' Z',
      fill: BODY, stroke: BRASS, 'stroke-width': '1.2' }, g);
    // the jewel: brass setting-rim (always reads) + accent fill + hot bright core,
    // so even a near-black accent still reads as a lit gem in its brass bezel.
    el('circle', { cx: fx(cx), cy: fx(jewelY), r: 3.6, fill: accent, stroke: BRASS, 'stroke-width': '1.1', filter: 'url(#glow-soft)' }, g);
    el('circle', { cx: fx(cx), cy: fx(jewelY), r: 3.6, fill: accent, stroke: BRASS, 'stroke-width': '1.1' }, g);
    el('circle', { cx: fx(cx - 0.7), cy: fx(jewelY - 0.7), r: 1.3, fill: BRI, opacity: '0.92' }, g);
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

  /* setDevRoom(id): the ?room=<id> dev override (boot calls this before build).
     Pins WHICH room's rep renders in the grounds slot; null/empty keeps the
     Cairn-default pick. Drives Gate.rooms.pick(_devRoom) in drawRoomRep. */
  S.setDevRoom = function (id) { S._devRoom = id || null; };

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
