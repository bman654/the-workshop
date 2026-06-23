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

    // LAYER 4 — far scenery (observatory + hill | manor | greenhouse)
    var farScenery = group('layer-far-scenery', svg);
    var B = Gate.scenebuildings;
    if (B) {
      B.drawHillAndObservatory(farScenery, S);     // LEFT
      B.drawManor(farScenery, S);                   // CENTER (distant)
      B.drawGreenhouse(farScenery, S);              // RIGHT
    }

    // LAYER 5 — midground (grass, road, trees/bushes)
    var midground = group('layer-midground', svg);
    drawGrounds(midground);
    drawTrees(midground);

    // LAYER 6 — grounds furniture (cairn rep + label, undercroft hatch)
    var furniture = group('layer-furniture', svg);
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

    // the disc sits above the manor (manor is center-right) → place upper-right
    var discX = 1180, discY = 175, discR = 64;
    if (band === 'night') drawMoon(g, discX, discY, discR);
    else drawSun(g, discX, discY, discR, band);

    // asterism to the LEFT of the disc
    drawAsterism(g, 820, 120, 250);
  };

  /* greybox moon: a lit disc with a rough terminator placeholder (real moon math
     is owned by another agent's sky-core.mjs — NOT included this pass). */
  function drawMoon(g, cx, cy, r) {
    var moonG = group('moon', g);
    // halo
    el('circle', { cx: cx, cy: cy, r: r * 1.7, fill: 'var(--moon-disc-ref, #f2ead2)',
      opacity: '0.10', filter: 'url(#glow-soft)' }, moonG);
    // full disc
    el('circle', { cx: cx, cy: cy, r: r, fill: 'var(--moon-disc-ref, #f2ead2)' }, moonG);
    // rough terminator: a darker crescent overlay offset to the right (placeholder
    // ~60% illuminated). Phase D replaces with real terminator geometry.
    var moonK = (S._moonK == null) ? 0.6 : S._moonK;
    var shade = el('path', {
      d: terminatorPath(cx, cy, r, moonK),
      fill: 'var(--sky-top-ref, #0a1326)', opacity: '0.55'
    }, moonG);
    shade.setAttribute('aria-hidden', 'true');
    // faint top-edge brass highlight ("lit from above")
    el('path', { d: 'M ' + (cx - r * 0.7) + ' ' + (cy - r * 0.55) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r * 0.7) + ' ' + (cy - r * 0.55),
      fill: 'none', stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1.2', opacity: '0.35' }, moonG);
  }

  // a crude terminator: a vertical-ish ellipse whose width tracks (1-2k) of r.
  function terminatorPath(cx, cy, r, k) {
    var off = (1 - 2 * k) * r;        // k=1 full → off=-r (no shade); k=0 new → off=+r
    return 'M ' + cx + ' ' + (cy - r) +
      ' A ' + Math.abs(off) + ' ' + r + ' 0 0 ' + (off >= 0 ? 1 : 0) + ' ' + cx + ' ' + (cy + r) +
      ' A ' + r + ' ' + r + ' 0 0 ' + (off >= 0 ? 1 : 1) + ' ' + cx + ' ' + (cy - r) + ' Z';
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

  /* ── LAYER 5 — grounds: grass band + road through the gate to the manor ─────── */
  function drawGrounds(parent) {
    // ground rises from the horizon (~y 470) to the bottom
    var groundTop = 470;
    el('rect', { x: 0, y: groundTop, width: VB_W, height: VB_H - groundTop, fill: 'var(--grass-ref, #3c4a50)' }, parent);
    // a soft grade band so it isn't flat
    el('rect', { x: 0, y: groundTop, width: VB_W, height: 80, fill: 'var(--hill-ref, #2c3742)', opacity: '0.5' }, parent);

    // ROAD: a winding ribbon from the gate center (bottom ~x800) up to the manor
    // (center-right ~x1120,y470). Drawn as a tapering polygon — wide at front,
    // narrow at the manor. Passes through the gate's center.
    var road = 'M 720 900 L 880 900 L 1010 540 L 1140 480 L 1100 480 L 980 540 L 760 900 Z';
    el('path', { d: road, fill: 'var(--road-ref, #5a5f6a)' }, parent);
    // center line / kerb highlight (lit from above on the near edge)
    el('path', { d: 'M 880 900 L 1010 540 L 1140 480', fill: 'none',
      stroke: 'var(--brass-bright-ref, #f0d489)', 'stroke-width': '1', opacity: '0.18' }, parent);

    // a couple of lamp posts along the road (emissive flames)
    drawLamp(parent, 640, 560, 70);
    drawLamp(parent, 1180, 470, 50);
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
    drawTree(g, 120, 560, 1.3);
    drawTree(g, 300, 600, 0.9);
    drawBush(g, 480, 760, 1.1);
    drawBush(g, 1300, 720, 1.2);
    drawTree(g, 1480, 600, 1.0);
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

  /* ── undercroft hatch — only when the unlock predicate is true (placeholder) ─── */
  function drawUndercroftHatch(parent) {
    var open = undercroftOpen();
    if (!open) return;
    var g = group('undercroft-hatch', parent);
    var x = 1340, y = 800;        // near the greenhouse, RIGHT
    // slanted cellar door (a parallelogram lid)
    el('path', { d: 'M ' + x + ' ' + y + ' l 110 -28 l 26 40 l -110 28 Z',
      fill: 'rgba(11,14,22,.9)', stroke: 'var(--brass-stroke-ref, #c9a24a)', 'stroke-width': '1.4' }, g);
    // emissive glow from the gap (palette-immune)
    el('path', { d: 'M ' + (x + 8) + ' ' + (y + 4) + ' l 108 -27 l 6 9 l -108 27 Z',
      fill: 'var(--undercroft-glow-ref, #d8a94a)', opacity: '0.55', filter: 'url(#glow-soft)' }, g);
    S.refs.undercroft = g;
  }

  /* mirror index.src.html revealUndercroft EXACTLY: navigable state, not eligibility. */
  function undercroftOpen() {
    var WS = root.WS;
    if (!WS || !WS.store) return false;
    var store = WS.store();
    if (!store.ok) return false; // file:// or storage off → nothing unlocked
    return store.has('ws:seen:undercroft-rune') || store.has('ws:seen:undercroft');
  }
  S.undercroftOpen = undercroftOpen;

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

  /* setMoonK(k): stash the illuminated fraction for the greybox terminator. */
  S.setMoonK = function (k) { S._moonK = k; };

  Gate.scene = S;

  if (typeof module !== 'undefined' && module.exports) { module.exports = S; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
