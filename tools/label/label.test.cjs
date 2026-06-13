#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   label.test.cjs — headless self-test for the LabelPlacer engine.

   Run:  node tools/label/label.test.cjs
   Prints `PASS n/n` and exits non-zero on ANY failure. This is the workshop
   signature: the engine ships with a test that PROVES its core claim — given
   feasible input it finds a placement with 0 label-label AND 0 label-obstacle
   overlaps; it degrades gracefully on infeasible input.

   Asserts: (1) determinism, (2) bounds containment, (3) a feasible battery of
   24+ seeded scatters → 0 overlaps, (4) monotone SA improvement, (5) pin
   honored + avoided, (6) graceful infeasibility, (7) leader correctness.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

var LabelPlacer = require('./label.js');
var G = LabelPlacer.geom;

var passed = 0, total = 0, failures = [];
function check(name, cond) {
  total++;
  if (cond) { passed++; }
  else { failures.push(name); console.error('  FAIL: ' + name); }
}

/* deterministic helper PRNG for building test corpora (separate from the
   engine's own seed so the corpus itself is reproducible). */
function rngFrom(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Generate a SPARSE feasible-by-construction scatter: points on a loose grid
   with jitter, with labels small relative to cell pitch so a non-overlapping
   placement provably exists. Optionally sprinkle a few obstacles in the gaps. */
function sparseScatter(seed, count, withObstacles) {
  var rnd = rngFrom(seed);
  var bounds = { x: 0, y: 0, w: 1000, h: 700 };
  // choose a grid that comfortably fits `count` cells
  var cols = Math.ceil(Math.sqrt(count * 1000 / 700));
  var rows = Math.ceil(count / cols);
  var pitchX = 1000 / cols, pitchY = 700 / rows;
  var features = [], k = 0;
  for (var r = 0; r < rows && k < count; r++) {
    for (var c = 0; c < cols && k < count; c++) {
      var cx = pitchX * (c + 0.5), cy = pitchY * (r + 0.5);
      // small jitter, but keep clear of cell edges so labels never collide
      var jx = (rnd() - 0.5) * pitchX * 0.18;
      var jy = (rnd() - 0.5) * pitchY * 0.18;
      var lw = 30 + Math.floor(rnd() * 36);   // 30..66 wide
      var lh = 13 + Math.floor(rnd() * 5);    // 13..18 tall
      features.push({
        id: 'p' + k,
        anchor: { x: cx + jx, y: cy + jy },
        label: { w: lw, h: lh },
        gap: 7,
        prefer: ['ne', 'right', 'nw', 'left']
      });
      k++;
    }
  }
  var obstacles = [];
  if (withObstacles) {
    // place a couple of obstacles near grid-line intersections (the gaps),
    // small enough that the 8-slot model can always route around them
    var nob = 1 + Math.floor(rnd() * 2);
    for (var o = 0; o < nob; o++) {
      var oc = Math.floor(rnd() * (cols - 1)) + 0.5 + 0.5;
      var orr = Math.floor(rnd() * (rows - 1)) + 0.5 + 0.5;
      obstacles.push({
        x: pitchX * oc - 14, y: pitchY * orr - 10, w: 28, h: 20
      });
    }
  }
  return { bounds: bounds, features: features, obstacles: obstacles };
}

/* count real overlaps in a result using the engine's own geometry — proves the
   reported `overlaps` and the geometry agree, and lets us assert independently. */
function recount(spec, res) {
  var ll = 0, lo = 0, oob = 0;
  var ps = res.placements;
  for (var i = 0; i < ps.length; i++) {
    for (var j = i + 1; j < ps.length; j++) {
      if (G.rectsOverlap(ps[i].label, ps[j].label)) ll++;
    }
    var obs = spec.obstacles || [];
    for (var o = 0; o < obs.length; o++) {
      if (G.rectsOverlap(ps[i].label, obs[o])) lo++;
    }
    if (spec.bounds && !G.rectInside(ps[i].label, spec.bounds, 1e-6)) oob++;
  }
  return { ll: ll, lo: lo, oob: oob, total: ll + lo + oob };
}

/* ── 1. DETERMINISM ──────────────────────────────────────────────────────── */
{
  var spec = sparseScatter(42, 40, true);
  spec.seed = 12345;
  var a = LabelPlacer.solve(spec);
  var b = LabelPlacer.solve(spec);
  check('determinism: same (input, seed) → byte-identical placements',
    JSON.stringify(a) === JSON.stringify(b));

  // different seed CAN differ but must still be valid; mostly we assert a
  // second independent (input, seed) is also reproducible
  var spec2 = sparseScatter(42, 40, true); spec2.seed = 999;
  var c1 = LabelPlacer.solve(spec2), c2 = LabelPlacer.solve(spec2);
  check('determinism: a second seed is also reproducible',
    JSON.stringify(c1) === JSON.stringify(c2));
}

/* ── 2. BOUNDS CONTAINMENT ───────────────────────────────────────────────── */
{
  var allInside = true;
  for (var s = 0; s < 12; s++) {
    var spec = sparseScatter(100 + s, 24 + s, s % 2 === 0);
    spec.seed = 7 + s;
    var res = LabelPlacer.solve(spec);
    for (var p = 0; p < res.placements.length; p++) {
      if (!G.rectInside(res.placements[p].label, spec.bounds, 1e-6)) { allInside = false; break; }
    }
    if (!allInside) break;
  }
  check('bounds containment: every label fully inside bounds (feasible inputs)', allInside);
}

/* ── 3. FEASIBLE BATTERY → 0 OVERLAPS ────────────────────────────────────── */
{
  var BATTERY = 24;
  var clean = 0, detail = [];
  for (var t = 0; t < BATTERY; t++) {
    var count = 8 + (t % 5) * 8;             // 8..40 features, varied
    var withObs = (t % 3) === 0;             // some with obstacles
    var spec = sparseScatter(1000 + t * 17, count, withObs);
    spec.seed = 50 + t;
    spec.positions = (t % 4 === 0) ? 4 : 8;  // exercise both slot models
    var res = LabelPlacer.solve(spec);
    var rc = recount(spec, res);
    var ok = res.overlaps === 0 && rc.total === 0;
    if (ok) clean++;
    else detail.push('case#' + t + ' n=' + count + ' obs=' + withObs +
      ' reported=' + res.overlaps + ' recounted=' + JSON.stringify(rc));
  }
  if (detail.length) detail.forEach(function (d) { console.error('    ' + d); });
  check('feasible battery: ' + clean + '/' + BATTERY +
    ' seeded scatters reach 0 label↔label AND 0 label↔obstacle overlaps',
    clean === BATTERY);
}

/* ── 4. MONOTONE IMPROVEMENT ─────────────────────────────────────────────── */
{
  // a deliberately CONFLICTED start: tightly packed points so the
  // all-most-preferred initial layout overlaps badly; SA must not worsen it.
  var mono = true, worsened = [];
  for (var m = 0; m < 8; m++) {
    var rnd = rngFrom(2000 + m);
    var feats = [];
    var nn = 14 + m * 2;
    for (var i = 0; i < nn; i++) {
      feats.push({
        id: 'c' + i,
        anchor: { x: 60 + (rnd() * 300), y: 60 + (rnd() * 200) }, // crammed box
        label: { w: 70, h: 16 },
        gap: 6,
        prefer: ['right']  // force them all to the same side → guaranteed clash
      });
    }
    var spec = { bounds: { x: 0, y: 0, w: 500, h: 360 }, features: feats, seed: 314 + m };
    var res = LabelPlacer.solve(spec);
    if (res.energy > res.initialEnergy + 1e-6) { mono = false; worsened.push('m' + m + ' init=' + res.initialEnergy + ' final=' + res.energy); }
  }
  if (worsened.length) worsened.forEach(function (w) { console.error('    ' + w); });
  check('monotone improvement: SA final energy ≤ all-most-preferred initial energy (conflicted inputs)', mono);
}

/* ── 5. PIN HONORED + AVOIDED ────────────────────────────────────────────── */
{
  var spec = sparseScatter(77, 20, false);
  spec.seed = 4242;
  // pin feature index 0 to an exact rect; assert output matches and others
  // don't overlap it.
  var pinX = 480, pinY = 330, f0 = spec.features[0];
  f0.pin = { x: pinX, y: pinY, side: 'pinned' };
  var res = LabelPlacer.solve(spec);
  var pinned = null;
  for (var i = 0; i < res.placements.length; i++) {
    if (res.placements[i].id === f0.id) pinned = res.placements[i];
  }
  var exact = pinned && pinned.x === pinX && pinned.y === pinY &&
    pinned.side === 'pinned' &&
    pinned.label.x === pinX && pinned.label.y === pinY &&
    pinned.label.w === f0.label.w && pinned.label.h === f0.label.h;
  check('pin honored: pinned feature output equals its pin exactly', !!exact);

  // no OTHER label overlaps the pinned rect
  var pinRect = { x: pinX, y: pinY, w: f0.label.w, h: f0.label.h };
  var clear = true;
  for (var j = 0; j < res.placements.length; j++) {
    if (res.placements[j].id === f0.id) continue;
    if (G.rectsOverlap(res.placements[j].label, pinRect)) { clear = false; break; }
  }
  check('pin avoided: no free label overlaps the pinned rect', clear);
}

/* ── 6. GRACEFUL INFEASIBILITY ───────────────────────────────────────────── */
{
  // jam many big labels into a tiny frame — overlaps are unavoidable. The
  // engine must NOT crash, must return a bounded result, and must report a
  // residual that's at least better than the worst-preferred chaos.
  var feats = [], rnd = rngFrom(9090);
  for (var i = 0; i < 30; i++) {
    feats.push({
      id: 'x' + i,
      anchor: { x: 80 + rnd() * 140, y: 60 + rnd() * 100 }, // tiny crammed region
      label: { w: 90, h: 24 },
      gap: 8
    });
  }
  var spec = { bounds: { x: 0, y: 0, w: 320, h: 240 }, features: feats, seed: 1 };
  var threw = false, res = null;
  try { res = LabelPlacer.solve(spec); } catch (e) { threw = true; }
  check('graceful infeasibility: solve() does not throw on an over-dense scatter', !threw);
  check('graceful infeasibility: returns a well-formed result',
    !!res && res.placements.length === 30 && typeof res.overlaps === 'number' &&
    isFinite(res.energy));
  // every placement still carries finite coordinates + a leader
  var wellFormed = true;
  if (res) for (var k = 0; k < res.placements.length; k++) {
    var pl = res.placements[k];
    if (!isFinite(pl.x) || !isFinite(pl.y) || !pl.leader || pl.leader.length !== 2) wellFormed = false;
  }
  check('graceful infeasibility: all placements finite + carry a 2-point leader', wellFormed);
  // the optimizer should not END ABOVE its own initial energy (it minimizes the
  // residual rather than leaving it random/worse).
  check('graceful infeasibility: residual minimized (final energy ≤ initial)',
    !!res && res.energy <= res.initialEnergy + 1e-6);
}

/* ── 7. LEADER CORRECTNESS ───────────────────────────────────────────────── */
{
  var spec = sparseScatter(55, 30, true);
  spec.seed = 808;
  var res = LabelPlacer.solve(spec);
  // build an id→feature lookup for anchors
  var byId = {};
  spec.features.forEach(function (f) { byId[f.id] = f; });
  var leaderOk = true, why = '';
  for (var i = 0; i < res.placements.length; i++) {
    var pl = res.placements[i];
    var f = byId[pl.id];
    // leader[0] must be the anchor exactly
    if (pl.leader[0][0] !== f.anchor.x || pl.leader[0][1] !== f.anchor.y) {
      leaderOk = false; why = 'leader start ≠ anchor for ' + pl.id; break;
    }
    // leader[1] must be the nearest edge point of the chosen label rect
    var edge = G.nearestEdgePoint(f.anchor.x, f.anchor.y, pl.label);
    if (Math.abs(pl.leader[1][0] - edge[0]) > 1e-9 || Math.abs(pl.leader[1][1] - edge[1]) > 1e-9) {
      leaderOk = false; why = 'leader end ≠ nearest edge for ' + pl.id; break;
    }
    // and that endpoint must lie ON the label's perimeter (within eps)
    var onEdge =
      (Math.abs(pl.leader[1][0] - pl.label.x) < 1e-6 || Math.abs(pl.leader[1][0] - (pl.label.x + pl.label.w)) < 1e-6 ||
       (pl.leader[1][0] >= pl.label.x - 1e-6 && pl.leader[1][0] <= pl.label.x + pl.label.w + 1e-6)) &&
      (pl.leader[1][1] >= pl.label.y - 1e-6 && pl.leader[1][1] <= pl.label.y + pl.label.h + 1e-6);
    if (!onEdge) { leaderOk = false; why = 'leader end off-rect for ' + pl.id; break; }
  }
  if (!leaderOk) console.error('    ' + why);
  check('leader correctness: each leader joins the anchor to the label\'s nearest edge', leaderOk);
}

/* ── report ──────────────────────────────────────────────────────────────── */
console.log('\nThe Letterer — LabelPlacer self-test');
if (failures.length) {
  console.log('FAIL ' + passed + '/' + total);
  console.error('\n' + failures.length + ' assertion(s) failed.');
  process.exit(1);
} else {
  console.log('PASS ' + passed + '/' + total);
  process.exit(0);
}
