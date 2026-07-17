/* scene-dressing.js — THE CALENDAR'S SEASONAL DRESSING (E2/E3a/spring, DESIGN §9.3/§9.4, r24):
   one post-build pass — the bare winter (the BINARY canopy law + per-tree threshold + the
   optional marc-leaf held-leaf marks), the fallen snow (seat marks over the palette-whitened
   ground/roofs), and the spring flowering. Pure; rest-state writes NOTHING (§9.1). r24:
   canopy opacity is per-tree {0,1} ONLY (every fade retired); the seat table is v2 (a white
   greenhouse ROOF-PLANE replaces the retired stall lenses; the ground rings + horizon band
   are retired — the whole ground now whitens in the palette, §9.2/colormap); spring blooms. */

(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  var SD = Gate.scenedressing = Gate.scenedressing || {};

  // §9.3 DESIGN PROPERTY — TUNE (SP-SEE-G-tunable; defaults BINDING at build, retuned only by
  // design revision inside the identity law). r24: crownFade* are DELETED (no fade path exists);
  // base/spread set each tree's BINARY canopy threshold on the shared bare ramp.
  SD.TUNE = { bareThreshBase: 0.35, bareThreshSpread: 2.5, armOpacity: 0.9, marcLeafMarks: true };
  // authored ART (design property; changes only by revision) — indexed in _foliage order:
  var BARE_JIT = [0, .12, .05, .09, .14, .03, .07, .11];

  var SNOW  = 'var(--snow-drift-ref, #b6c2d4)';     // §9.4 — snow is a palette role
  var BLUSH = 'var(--spring-blush-ref, #e8a8c4)';   // §9.4-spring — the flowering palette roles
  var GOLD  = 'var(--spring-gold-ref, #ecc94e)';
  var BERRY = 'var(--spring-berry-ref, #c23b30)';
  var LEAF  = 'var(--tree-foliage-ref, #2c3a40)';   // the foliage role — a warm dead-leaf tan in
                                                    // deep winter (the r24 anchors), worn by the marks
  // the front-door autumn cartouche maple leaf (index.src.html drawMotif('autumn')), centred
  // at 0,0; scene-dressing shrinks it ~0.22 for the marcescent held-leaf marks (§9.3 r24).
  var MAPLE = 'M0 -25 L5 -16 L3.5 -13.5 L8 -8 L15 -10 L24 -3 L16 1 L9.5 4 L17 10 L19 15 ' +
              'L7 17.5 L0 21 L-7 17.5 L-19 15 L-17 10 L-9.5 4 L-16 1 L-24 -3 L-15 -10 L-8 -8 ' +
              'L-3.5 -13.5 L-5 -16 Z';

  function f(n) { return Math.round(n * 10) / 10; }
  function o(v) { return (v < 0 ? 0 : v > 1 ? 1 : v).toFixed(3); }
  // per-tree canopy threshold on the shared bare ramp (§9.3 r24): TH_i staggered by BARE_JIT.
  function thI(i) { return SD.TUNE.bareThreshBase + SD.TUNE.bareThreshSpread * (i < BARE_JIT.length ? BARE_JIT[i] : 0); }
  function rngOf(date, salt) {
    var C = (typeof Calendar !== 'undefined') ? Calendar : root.Calendar;
    return (C && C.mulberry32 && date)
      ? C.mulberry32(C.hash2(C.dateSeed(date.y, date.m, date.d), salt))
      : function () { return 0.5; };
  }
  function foliage() { var S = Gate.scene; return (S && S._foliage) ? S._foliage : []; }

  // ── the manifest (the tooth, §9.8-s9c) — plan(s,k,bare) is pure/seed-free; count() reads DOM ──
  function skeleton() {
    return {
      gate:   { 'snow-pier-cap': 0, 'snow-pier-edge': 0, 'snow-crest': 0 },
      roofs:  { 'snow-gh-roof': 0, 'snow-ridge': 0 },
      ground: { 'snow-lamp': 0, 'snow-lip-line': 0, 'snow-lip-patch': 0, 'snow-drive': 0 },
      spring: { 'spring-flower': 0, 'spring-wash': 0 },
      crown:  { 'spring-berry': 0, 'marc-leaf': 0 }   // crown-hosted → whole-SVG class scan
    };
  }
  // plan(s, k, bare) — snow + spring + bare scalars; counts FIXED per tier (§9.4). No seed.
  SD.plan = function (s, k, bare) {
    s = +s || 0; k = +k || 0; bare = +bare || 0;
    var p = skeleton(), fol = foliage(), i, trees = 0, marcBare = 0;
    for (i = 0; i < fol.length; i++) {
      if (fol[i].kind === 'tree') { trees++; if (fol[i].marc && bare >= thI(i)) marcBare++; }
    }
    if (s > 0.15) { p.gate['snow-pier-cap'] = 2; p.gate['snow-pier-edge'] = 2; p.roofs['snow-gh-roof'] = 1; }
    if (s > 0.30) { p.roofs['snow-ridge'] = 1; p.ground['snow-lamp'] = 2; p.ground['snow-lip-line'] = 1; }
    if (s > 0.45) { p.gate['snow-crest'] = 1; p.ground['snow-lip-patch'] = 5; }
    if (s > 0.60) { p.ground['snow-drive'] = 3; }
    if (k > 0.04) { p.spring['spring-flower'] = 48; p.spring['spring-wash'] = 6; p.crown['spring-berry'] = 6 * trees; }
    p.crown['marc-leaf'] = SD.TUNE.marcLeafMarks ? 5 * marcBare : 0;
    return p;
  };
  // count() — what was actually drawn (per group/class; crown marks via a whole-SVG scan):
  SD.count = function () {
    var p = skeleton();
    var svg = Gate.scene && Gate.scene.refs && Gate.scene.refs.svg;
    if (!svg) return p;
    var idOf = { 'dress-snow-gate': 'gate', 'dress-snow-roofs': 'roofs',
                 'dress-snow-ground': 'ground', 'dress-spring-ground': 'spring' };
    for (var id in idOf) {
      var g = svg.querySelector('#' + id); if (!g) continue;
      var kids = g.childNodes, bucket = p[idOf[id]];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i].getAttribute && kids[i].getAttribute('class');
        if (c && bucket.hasOwnProperty(c)) bucket[c]++;
      }
    }
    p.crown['spring-berry'] = svg.querySelectorAll('.spring-berry').length;
    p.crown['marc-leaf'] = svg.querySelectorAll('.marc-leaf').length;
    return p;
  };

  // §9.4 — fallen snow: three id'd groups; one seeded stream (geometry only), fixed seat order.
  // The ground/roofs WHITEN in the palette (§9.2 SNOW_COVER_K); this pass draws only the marks
  // the palette can't reach. drawn once at build; s ≤ .15 writes NOTHING (rest-state).
  function drawSnow(S, s, snowCover, date) {
    if (!(s > 0.15)) return;
    var svg = S.refs && S.refs.svg; if (!svg) return;
    var el = S.el;
    var mid = svg.querySelector('#layer-midground');
    var furn = svg.querySelector('#layer-furniture');
    var gate = svg.querySelector('#layer-gate');
    var gGround = el('g', { id: 'dress-snow-ground' });
    if (mid && mid.parentNode) mid.parentNode.insertBefore(gGround, mid.nextSibling); else svg.appendChild(gGround);
    var gRoofs = el('g', { id: 'dress-snow-roofs' }, furn || svg);
    var gGate  = el('g', { id: 'dress-snow-gate' }, gate || svg);
    var rng = rngOf(date, 0x6A7E);
    function lens(g, cx, cy, rx, ry, op_, cls) {
      el('ellipse', { cx: f(cx), cy: f(cy), rx: f(rx), ry: f(ry), fill: SNOW, opacity: o(op_), 'class': cls }, g);
    }
    function line(g, d, w, op_, cls) {
      el('path', { d: d, fill: 'none', stroke: SNOW, 'stroke-width': w, opacity: o(op_), 'class': cls }, g);
    }
    // pier caps ×2 (gate): a lens + a top-edge stroke — r24: whiter, heavier
    var pry = 6.5 * (0.55 + 0.45 * s);
    [436, 1164].forEach(function (cx) {
      lens(gGate, cx, 197, 33, pry, 0.7 + 0.3 * s, 'snow-pier-cap');
      line(gGate, 'M ' + f(cx - 28) + ' ' + f(197 - pry * 0.2) + ' Q ' + cx + ' ' + f(197 - pry * 1.4) +
        ' ' + f(cx + 28) + ' ' + f(197 - pry * 0.2), 1.6, 0.65 * s, 'snow-pier-edge');
    });
    // greenhouse ROOF-PLANE (roofs) — r24, REPLACES the retired stall lenses; a white-TOPPED
    // roof (never snow piled at the base). Opacity by ground cover, not seat depth.
    el('path', { d: 'M 1331.7 478.6 L 1455.8 452.2 L 1496.1 503.6 L 1372 512.9 Z',
      fill: SNOW, opacity: o(0.25 + 0.6 * snowCover), 'class': 'snow-gh-roof' }, gRoofs);
    if (s > 0.30) {  // greenhouse ridge + lamp caps ×2 + apron lip line
      line(gRoofs, 'M 1331.7 478.6 L 1455.8 452.2', 2, 0.45 * s, 'snow-ridge');
      [600, 1000].forEach(function (lx) { lens(gGround, lx, 443, 7, 2.2, 0.55 + 0.3 * s, 'snow-lamp'); });
      line(gGround, 'M -40 811 L 1640 811', 2.4, 0.5 * s, 'snow-lip-line');
    }
    if (s > 0.45) {  // gate crest + apron lip patches ×5 (seeded)
      line(gGate, 'M 472 166 Q 800 126 1128 166', 2.2, 0.4 * s, 'snow-crest');
      for (var j = 0; j < 5; j++) {
        lens(gGround, 200 + 1200 * rng(), 820 + 60 * (0.15 + 0.7 * (j / 4)),
          26 + rng() * 34, 4 + rng() * 3, 0.2 + 0.4 * s, 'snow-lip-patch');
      }
    }
    if (s > 0.60) {  // drive dusting ×3 (seeded) — never a cap on the kept ribbon
      for (var m = 0; m < 3; m++) {
        var dt = 0.2 + 0.3 * m, hw = 94 - 62 * dt;
        lens(gGround, 800 + (rng() - 0.5) * hw * 0.6, 900 - 422 * dt,
          hw * 0.5 * (0.7 + rng() * 0.3), 3 + rng() * 1.5, 0.28 * s, 'snow-drive');
      }
    }
  }

  // §9.4-spring — the flowering: crown berries (into each crown <g>, ride the sway), a vibrant
  // meadow (48 flowers + 6 washes in dress-spring-ground). One seeded stream, fixed draw order;
  // k ≤ .04 writes NOTHING (rest-state / midsummer).
  function drawSpring(S, k, date) {
    if (!(k > 0.04)) return;
    var svg = S.refs && S.refs.svg; if (!svg) return;
    var el = S.el, rng = rngOf(date, 0x5B10), fol = foliage(), i;
    // crown BERRIES — 6 per tree × all trees, appended INTO the registered crown <g>:
    for (i = 0; i < fol.length; i++) {
      var fo = fol[i];
      if (fo.kind !== 'tree' || !fo.el || fo.cx == null) continue;
      var sc = fo.rx / (fo.marc ? 33 : 40);   // tree scale from the crown envelope (§9.4)
      for (var b = 0; b < 6; b++) {
        var bx = fo.cx + (rng() * 2 - 1) * fo.rx * 0.7;
        var by = (fo.cy - fo.ry * 0.15) + (rng() * 2 - 1) * fo.ry * 0.45;
        var br = (1.5 + rng() * 0.8) * sc;
        el('circle', { cx: f(bx), cy: f(by), r: f(br), fill: BERRY,
          opacity: o(0.55 + 0.45 * k), 'class': 'spring-berry' }, fo.el);
      }
    }
    // ground FLOWERS + meadow washes — dress-spring-ground, immediately after #layer-midground:
    var mid = svg.querySelector('#layer-midground');
    var gG = el('g', { id: 'dress-spring-ground' });
    if (mid && mid.parentNode) mid.parentNode.insertBefore(gG, mid.nextSibling); else svg.appendChild(gG);
    function rails(y) { var t = (900 - y) / 422; return [706 + 62 * t, 894 - 62 * t]; }   // §drive taper
    for (var q = 0; q < 48; q++) {                 // 28 blush + 20 gold
      var fill = q < 28 ? BLUSH : GOLD;
      var fx0 = 30 + rng() * 1540;                 // x ∈ [30,1570]
      var fy = 486 + rng() * 320;                  // y ∈ [486,806] — meadow only, above the apron
      var depth = (fy - 470) / 430;                // nearer flowers larger (the mottle's perspective)
      var rx = (1.5 + rng() * 1.3) * (0.7 + 0.55 * depth);
      var op = o((0.55 + 0.35 * rng()) * (0.35 + 0.65 * k));
      var r = rails(fy), L = r[0] - 8, R = r[1] + 8;   // the drive stays kept: reflect out (no loop)
      if (fx0 > L && fx0 < R) fx0 = (fx0 - L < R - fx0) ? (2 * L - fx0) : (2 * R - fx0);
      el('ellipse', { cx: f(fx0), cy: f(fy), rx: f(rx), ry: f(rx * 0.8), fill: fill,
        opacity: op, 'class': 'spring-flower' }, gG);
    }
    for (var w = 0; w < 6; w++) {                  // soft drifts of bloom
      el('ellipse', { cx: f(30 + rng() * 1540), cy: f(486 + rng() * 320),
        rx: f(18 + rng() * 24), ry: f(4 + rng() * 4), fill: BLUSH,
        opacity: o(0.14 * k), 'class': 'spring-wash' }, gG);
    }
  }

  // §9.3 — the bare winter (BINARY canopy law). Rest-state: bare === 0 writes NOTHING (the
  // threshold TH_i ≥ .35 sits above bare === 0, so no canopy toggles and no write happens).
  function applyBare(S, bare, date) {
    if (!(bare > 0)) return;
    var fol = S._foliage || [], T = SD.TUNE, mrng = rngOf(date, 0x1EAF);   // marc-leaf scatter stream
    for (var i = 0; i < fol.length; i++) {
      var fo = fol[i];
      var jit = i < BARE_JIT.length ? BARE_JIT[i] : 0;
      var bareT = bare * (1 - jit);
      fo.mul = 1 - 0.7 * bareT;                    // sway damping — EVERY registration (dead twig stiffer)
      if (fo.kind !== 'tree') continue;            // BUSHES never toggle (binary law: constantly 1)
      var off = bare >= thI(i);                    // canopy OFF iff bare ≥ TH_i; else attribute absent = 1.0
      if (fo.el && off) fo.el.setAttribute('opacity', '0');
      if (fo.el && fo.el.parentNode && off) {      // armature toggles BINARY with its tree
        var arms = fo.el.parentNode.querySelectorAll('.bare-armature');
        for (var a = 0; a < arms.length; a++) arms[a].setAttribute('opacity', String(T.armOpacity));
      }
      // marcescent held-leaf marks (the manicured pair) — a FIXED 15-draw budget per MARC tree
      // (the marc set is phase-invariant, so positions are phase-stable), drawn into the trunk
      // group (visible on the bare crown) only when THIS tree's canopy is off:
      if (fo.marc) {
        var pos = [];
        for (var q = 0; q < 5; q++) pos.push([mrng(), mrng(), mrng()]);
        if (off && T.marcLeafMarks && fo.el && fo.el.parentNode && fo.cx != null) {
          var g = fo.el.parentNode;
          for (var q2 = 0; q2 < 5; q2++) {
            var mx = fo.cx + (pos[q2][0] * 2 - 1) * fo.rx * 0.6;
            var my = fo.cy + (pos[q2][1] * 2 - 1) * fo.ry * 0.5;
            S.el('path', { d: MAPLE, fill: LEAF, opacity: '1', 'class': 'marc-leaf',
              transform: 'translate(' + f(mx) + ' ' + f(my) + ') rotate(' + f(pos[q2][2] * 360) + ') scale(0.22)' }, g);
          }
        }
      }
    }
  }

  // the one wiring seam (§9.1): once, after S.build(host). Null season / midsummer ⇒ NOTHING.
  SD.apply = function (S, season) {
    if (!S || !season || !season.dress) return;
    var d = season.dress, date = season.date;
    applyBare(S, +d.bare || 0, date);              // the bare winter (canopy · armature · marc-leaf · sway)
    drawSnow(S, +d.snow || 0, +d.snowCover || 0, date);  // fallen-snow seat marks
    drawSpring(S, +d.spring || 0, date);           // the spring flowering
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Gate; }
}(typeof globalThis !== 'undefined' ? globalThis : this));
