/* scene-dressing.js — THE CALENDAR'S SEASONAL DRESSING (E2/E3a, DESIGN §9.3/§9.4):
   one post-build pass, fallen snow + bare winter. Pure; rest-state writes NOTHING (§9.1). */

(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  var SD = Gate.scenedressing = Gate.scenedressing || {};
  // §9.3 DESIGN PROPERTY: TUNE (SP-SEE-G-tunable) + BARE_JIT (authored ART, _foliage order)
  SD.TUNE = { crownFadeTree: 0.72, crownFadeMarc: 0.30, crownFadeBush: 0.45, armOpacity: 0.85 };
  var BARE_JIT = [0, .12, .05, .09, .14, .03, .07, .11];
  var SNOW = 'var(--snow-drift-ref, #b6c2d4)';  // §9.4 — snow is a palette role
  function f(n) { return Math.round(n * 10) / 10; }
  function o(v) { return (v < 0 ? 0 : v > 1 ? 1 : v).toFixed(3); }
  // fixed skeleton so plan()/count() deep-equal:
  function skeleton() {
    return {
      gate:   { 'snow-pier-cap': 0, 'snow-pier-edge': 0, 'snow-crest': 0 },
      roofs:  { 'snow-stall': 0, 'snow-ridge': 0 },
      ground: { 'snow-lamp': 0, 'snow-lip-line': 0, 'snow-lip-patch': 0,
                'snow-drive': 0, 'snow-horizon': 0, 'snow-ring': 0 }
    };
  }
  // §9.8-s9c: plan(s) — pure, seed-free, counts FIXED per tier.
  SD.plan = function (s) {
    var p = skeleton();
    var S = Gate.scene, seats = (S && S._groundSeats) ? S._groundSeats.length : 8;
    if (s > 0.15) { p.gate['snow-pier-cap'] = 2; p.gate['snow-pier-edge'] = 2; }
    if (s > 0.45) { p.gate['snow-crest'] = 1; }
    if (s > 0.30) { p.roofs['snow-stall'] = 3; p.roofs['snow-ridge'] = 1;
                    p.ground['snow-lamp'] = 2; p.ground['snow-lip-line'] = 1; }
    if (s > 0.45) { p.ground['snow-lip-patch'] = 5; p.ground['snow-ring'] = seats; }
    if (s > 0.60) { p.ground['snow-drive'] = 3; p.ground['snow-horizon'] = 1; }
    return p;
  };
  // count() — what was actually drawn:
  SD.count = function () {
    var p = skeleton();
    var svg = Gate.scene && Gate.scene.refs && Gate.scene.refs.svg;
    if (!svg) return p;
    var idOf = { 'dress-snow-gate': 'gate', 'dress-snow-roofs': 'roofs', 'dress-snow-ground': 'ground' };
    for (var id in idOf) {
      var g = svg.querySelector('#' + id); if (!g) continue;
      var kids = g.childNodes, bucket = p[idOf[id]];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i].getAttribute && kids[i].getAttribute('class');
        if (c && bucket.hasOwnProperty(c)) bucket[c]++;
      }
    }
    return p;
  };
  // §9.4 — fallen snow: three id'd groups; one seeded stream, fixed seat order, geometry only:
  function drawSnow(S, s, date) {
    var svg = S.refs && S.refs.svg; if (!svg) return;
    var el = S.el;
    var mid = svg.querySelector('#layer-midground');
    var furn = svg.querySelector('#layer-furniture');
    var gate = svg.querySelector('#layer-gate');
    // ground: after #layer-midground; roofs/gate: last child of furniture/gate
    var gGround = el('g', { id: 'dress-snow-ground' });
    if (mid && mid.parentNode) mid.parentNode.insertBefore(gGround, mid.nextSibling); else svg.appendChild(gGround);
    var gRoofs = el('g', { id: 'dress-snow-roofs' }, furn || svg);
    var gGate  = el('g', { id: 'dress-snow-gate' }, gate || svg);
    var C = (typeof Calendar !== 'undefined') ? Calendar : root.Calendar;
    var rng = (C && C.mulberry32 && date)
      ? C.mulberry32(C.hash2(C.dateSeed(date.y, date.m, date.d), 0x6A7E))
      : function () { return 0.5; };
    function lens(g, cx, cy, rx, ry, op, cls) {
      el('ellipse', { cx: f(cx), cy: f(cy), rx: f(rx), ry: f(ry), fill: SNOW, opacity: o(op), 'class': cls }, g);
    }
    function line(g, d, w, op, cls) {
      el('path', { d: d, fill: 'none', stroke: SNOW, 'stroke-width': w, opacity: o(op), 'class': cls }, g);
    }
    if (s > 0.15) {  // pier caps ×2: lens + top-edge stroke
      var pry = 5 * (0.6 + 0.4 * s), pfo = 0.55 + 0.3 * s, peo = 0.5 * s;
      [436, 1164].forEach(function (cx) {
        lens(gGate, cx, 197, 30, pry, pfo, 'snow-pier-cap');
        line(gGate, 'M ' + f(cx - 25.5) + ' ' + f(197 - pry * 0.2) + ' Q ' + cx + ' ' + f(197 - pry * 1.4) +
          ' ' + f(cx + 25.5) + ' ' + f(197 - pry * 0.2), 1.5, peo, 'snow-pier-edge');
      });
    }
    if (s > 0.45) line(gGate, 'M 472 166 Q 800 126 1128 166', 2.2, 0.4 * s, 'snow-crest');  // crest
    if (s > 0.30) {  // stall ×3 + ridge + lamps ×2 + lip line
      for (var i = 0; i < 3; i++) {
        var t = i / 2;
        var sx = 1310 + 140 * t + (rng() - 0.5) * 24;
        var sy = 582 - 22 * t + (rng() - 0.5) * 8;
        lens(gRoofs, sx, sy, 14 + rng() * 10, 3 + rng(), 0.5 + 0.3 * s, 'snow-stall');
      }
      line(gRoofs, 'M 1331.7 478.6 L 1455.8 452.2', 2, 0.45 * s, 'snow-ridge');
      [600, 1000].forEach(function (lx) { lens(gGround, lx, 443, 7, 2.2, 0.55 + 0.3 * s, 'snow-lamp'); });
      line(gGround, 'M -40 811 L 1640 811', 2.4, 0.5 * s, 'snow-lip-line');
    }
    if (s > 0.45) {  // lip patches ×5 + ground rings
      for (var j = 0; j < 5; j++) {
        var lt = 0.15 + 0.7 * (j / 4);
        lens(gGround, 200 + 1200 * rng(), 820 + 60 * lt, 26 + rng() * 34, 4 + rng() * 3, 0.2 + 0.4 * s, 'snow-lip-patch');
      }
      var seats = S._groundSeats || [];
      for (var k = 0; k < seats.length; k++) {
        var st = seats[k];
        lens(gGround, st.x, st.y, st.r, st.r * 0.18, 0.35 * s, 'snow-ring');
      }
    }
    if (s > 0.60) {  // drive ×3 + horizon band
      for (var m = 0; m < 3; m++) {
        var dt = 0.2 + 0.3 * m, hw = 94 - 62 * dt;
        lens(gGround, 800 + (rng() - 0.5) * hw * 0.6, 900 - 422 * dt, hw * 0.5 * (0.7 + rng() * 0.3), 3 + rng() * 1.5, 0.28 * s, 'snow-drive');
      }
      el('rect', { x: 0, y: 468, width: 1600, height: 2.5, fill: SNOW, opacity: o(0.3 * s), 'class': 'snow-horizon' }, gGround);
    }
  }
  // §9.3 — bare winter. Rest-state: bare === 0 writes NOTHING (multiplicative stagger).
  function applyBare(S, bare) {
    if (!(bare > 0)) return;  // rest-state / identity
    var fol = S._foliage || [], T = SD.TUNE;
    for (var i = 0; i < fol.length; i++) {
      var fo = fol[i];
      var bareT = bare * (1 - (i < BARE_JIT.length ? BARE_JIT[i] : 0));
      var fade = fo.marc ? T.crownFadeMarc : (fo.kind === 'bush' ? T.crownFadeBush : T.crownFadeTree);
      if (fo.el) fo.el.setAttribute('opacity', (1 - fade * bareT).toFixed(3));
      fo.mul = 1 - 0.7 * bareT;  // bare wood still moves a little
      if (fo.kind === 'tree' && fo.el && fo.el.parentNode) {
        var arms = fo.el.parentNode.querySelectorAll('.bare-armature');
        var ao = (T.armOpacity * bareT).toFixed(3);
        for (var a = 0; a < arms.length; a++) arms[a].setAttribute('opacity', ao);
      }
    }
  }
  // the one wiring seam (§9.1): once after S.build(host):
  SD.apply = function (S, season) {
    if (!S || !season || !season.dress) return;  // write NOTHING
    var d = season.dress;
    drawSnow(S, +d.snow || 0, season.date);  // snow = 0 ⇒ empty groups (inert)
    applyBare(S, +d.bare || 0);  // bare = 0 ⇒ no writes (rest state)
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Gate; }
}(typeof globalThis !== 'undefined' ? globalThis : this));
