#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   estate.test.cjs — THE POLAR ESTATE GATE (layout engine v2, WS1 §9.1). Replaces
   smoke.cjs (retired in the same commit): the CROWDING_BASELINE ratchet is gone; the
   hard per-plate legibility gates live in legibility.test (armed by wave, §9.1).

   Drives the v2 facade (layout.js) against the LIVE, migrated PLACES read straight out of
   index.src.html (the single source of truth — the emit-mirror extraction idiom; the
   estate.fixture.cjs stand-in retired its role when W1.1 flipped the page). The live table
   is PRE-GATHER through W1 (all 93 rooms keep their POIs; the §2.6 gather retires rows in
   W2.8), so the census assertions are PLACES-DERIVED and hold at every wave. It proves the
   §9.1 invariants:
     · angle+tier deeds unique · same-tier separation ≥ 180/(t+1) · road+lane span
       clearance ≥ 1.5° · quantized tier radii monotone (·24) · district hulls pairwise
       disjoint (ALL pairs) · every footprint inside its district hull · no footprint
       overlap · plates partition total/disjoint · road samples in the wedge · viewBox
       quantized (·20) · solve()+plates() double-run BYTE-IDENTICAL · the superset return
       shape (world/structures/graph/basement/fold).
   And the §9.3 NEG-CONTROLS (each FAILS LOUD — synthetic fixture districts, never a live
   §2.1 row): over-capacity · on the road radian · duplicate deed · same-tier too close ·
   lane-violating span · unknown layoutFn · infeasible capacity · the detachOff fold control ·
   a deliberately-collided formation fixture · unknown district/cluster.

   Run: node tools/layout/estate.test.cjs   (pure Node; no DOM; part of the layout suite)
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const Contract = require('./contract.js');
const Sky = require('../sky/sky.js');   // the emitted polar CATALOG — for the star-vs-footprint sweep
/* the LIVE, migrated PLACES literal — a pure data array — evaluated out of index.src.html
   (identical to emit-mirror.cjs, so adding/removing a room can never drift this gate). */
const _src = fs.readFileSync(path.join(__dirname, '..', '..', 'index.src.html'), 'utf8');
const _pStart = _src.indexOf('const PLACES = [');
const _pEnd = _src.indexOf('\n];', _pStart);
if (_pStart < 0 || _pEnd < 0) throw new Error('estate.test: could not find the PLACES array in index.src.html');
// eslint-disable-next-line no-eval
const PLACES = eval('(' + _src.slice(_pStart + 'const PLACES = '.length, _pEnd + 2) + ')');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function throws(name, fn, match) {
  try { fn(); fail++; console.log('  ✗ FAIL ' + name + ' — expected a throw, got none'); }
  catch (e) {
    if (match && !match.test(e.message)) { fail++; console.log('  ✗ FAIL ' + name + ' — wrong error: ' + e.message.split('\n')[0]); }
    else { pass++; console.log('  ✓ ' + name); }
  }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ── geometry helpers (the gates' own math; independent of the facade's) ── */
function rectsOverlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
function bboxOf(f) { return f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 } : { x: f.x, y: f.y, w: f.w, h: f.h }; }
function footOverlaps(foot) {                       // pairwise: discs by centre distance, rects by bbox
  const ids = Object.keys(foot).sort(); let n = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const A = foot[ids[i]], B = foot[ids[j]];
    if (A.r != null && B.r != null) { if (Math.hypot(A.x - B.x, A.y - B.y) < A.r + B.r - 0.15) n++; }
    else if (rectsOverlap(bboxOf(A), bboxOf(B))) n++;
  }
  return n;
}
function spanHitsWedge(span, wedge, m) {
  const copies = [span, [span[0] + 360, span[1] + 360], [span[0] - 360, span[1] - 360]];
  return copies.some(s => s[0] < wedge[1] + m && s[1] > wedge[0] - m);
}

console.log('estate.test.cjs — the polar estate gate (v2)\n');

const sol = Layout.solve(PLACES);
const pl = Layout.plates(PLACES);
const world = sol.world;
const CONTRACTS = Contract.CONTRACTS;

/* ── 1. census + superset shape ─────────────────────────────────────────────── */
console.log('§1.9 superset return shape');
ok('solve() returns the v1 superset keys', ['foot', 'footMeta', 'wingRects', 'districtRects', 'graph', 'door'].every(k => k in sol));
ok('+ world model (viewBox, centre, R array, freeSlots)',
  world && typeof world.viewBox === 'string' && world.centre && Array.isArray(world.R) && world.freeSlots);
ok('+ structures [{district, box, label, tallies}]',
  Array.isArray(sol.structures) && sol.structures.length > 0 &&
  sol.structures.every(s => s.district && s.box && s.label && s.tallies));
ok('graph carries {door,spine,avenues,aisles,stubs}',
  sol.graph.door && sol.graph.spine && Array.isArray(sol.graph.avenues) && Array.isArray(sol.graph.aisles) && Array.isArray(sol.graph.stubs));
const detachedD = new Set(Object.keys(pl.detached));
const parentRooms = PLACES.filter(p => !p.locked && !detachedD.has(p.district));
ok('every parent room seats exactly one footprint (PLACES-derived; ' + parentRooms.length + ' pre-gather → 44 after the §2.6 gather)',
  Object.keys(sol.foot).length === parentRooms.length,
  'foot=' + Object.keys(sol.foot).length + ' parentRooms=' + parentRooms.length);
ok('11 district precincts (10 non-fairground + the fairground gate face)', sol.districtRects.length === 11,
  'got ' + sol.districtRects.length);

/* ── 2. the polar angular law (positive: the real deeds satisfy it) ──────────── */
console.log('\n§1.5 angular law (on the real deeds)');
const deeds = {}; let dupDeed = false;
Object.keys(CONTRACTS).forEach(id => {
  const c = CONTRACTS[id]; if (id === 'manor' || c.road) return;
  const k = c.tier + '|' + c.angle; if (deeds[k]) dupDeed = true; deeds[k] = id;
});
ok('every (angle, orbit) deed is unique', !dupDeed);
let sepOK = true;
world.tiers.forEach(t => {
  const ds = Object.keys(world.districts).filter(id => world.districts[id].tier === t)
    .map(id => world.districts[id]).sort((a, b) => a.angle - b.angle);
  const minSep = 180 / (t + 1);
  for (let i = 0; i < ds.length && ds.length > 1; i++) {
    const a = ds[i], b = ds[(i + 1) % ds.length];
    const dth = (b.angle - a.angle + 360) % 360;
    if (dth < minSep - 1e-6) sepOK = false;
  }
});
ok('same-tier separation ≥ 180/(orbit+1)', sepOK);
let clearOK = true;
Object.keys(world.districts).forEach(id => {
  const d = world.districts[id];
  const span = [d.angle - d.alpha, d.angle + d.alpha];
  if (spanHitsWedge(span, [168, 192], 1.5)) clearOK = false;                     // the road wedge
  Contract.LANES.forEach(L => { if (d.tier >= L.startTier && spanHitsWedge(span, L.span, 1.5)) clearOK = false; });
});
ok('every span clears the road + sky lanes by ≥ 1.5°', clearOK);

/* ── 3. radii + viewBox derivation ──────────────────────────────────────────── */
console.log('\n§1.4/§1.7 radii + viewBox');
ok('tier radii quantized to 24 and strictly monotone',
  world.R[1] % 24 === 0 && world.R[2] % 24 === 0 && world.R[3] % 24 === 0 && world.R[1] < world.R[2] && world.R[2] < world.R[3],
  JSON.stringify(world.R));
ok('viewBox W,H quantized to 20 + square (the sky annulus dominates)',
  world.W % 20 === 0 && world.H % 20 === 0 && world.W === world.H && world.viewBox === '0 0 ' + world.W + ' ' + world.H);
ok('K_MAX derived = ceil(W / 360)', world.K_MAX === Math.ceil(world.W / 360), 'K_MAX=' + world.K_MAX);
ok('first-solve world is 3100×3100 (the committed oracle)', world.W === 3100, 'W=' + world.W);

/* ── 4. hulls + footprints ──────────────────────────────────────────────────── */
console.log('\n§9.1 hulls + footprints');
let hullColl = 0;
for (let i = 0; i < sol.districtRects.length; i++) for (let j = i + 1; j < sol.districtRects.length; j++)
  if (rectsOverlap(sol.districtRects[i], sol.districtRects[j])) hullColl++;
ok('district hulls pairwise disjoint (ALL pairs)', hullColl === 0, hullColl + ' overlaps');
const drBy = {}; sol.districtRects.forEach(d => drBy[d.district] = d);
let outOfHull = 0;
Object.keys(sol.foot).forEach(id => {
  const bb = bboxOf(sol.foot[id]), h = drBy[sol.footMeta[id].district];
  if (!(bb.x >= h.x - 0.2 && bb.y >= h.y - 0.2 && bb.x + bb.w <= h.x + h.w + 0.2 && bb.y + bb.h <= h.y + h.h + 0.2)) { outOfHull++; }
});
ok('every footprint inside its district hull', outOfHull === 0, outOfHull + ' out');
ok('no footprint overlaps (discs by centre distance, rects by bbox)', footOverlaps(sol.foot) === 0);

/* ── 4b. the SKY star-vs-footprint sweep (the retired smoke's role; §3.1/§3.4) ──
   The emitted polar CATALOG (sky.js) must be current vs THIS live solve — every star
   hangs on the ring OUTSIDE every solved footprint + the manor structure box, and
   inside the viewBox. This mirrors derive-sky.mjs verify()'s footprint check against
   the same solve, so the estate gate catches a stale/colliding slab directly. ── */
console.log('\n§3.1 sky — star-vs-footprint sweep');
(function () {
  const STAR_PAD = 12;
  const CATALOG = Sky.CATALOG;
  const boxes = Object.keys(sol.foot).map((id) => Object.assign({ id }, bboxOf(sol.foot[id])));
  const manorStruct = (sol.structures || []).find((s) => s.district === 'manor' && s.box);
  if (manorStruct) boxes.push(Object.assign({ id: 'manor-pool' }, manorStruct.box));
  const starHit = (s, b) => (s.x + STAR_PAD > b.x && s.x - STAR_PAD < b.x + b.w && s.y + STAR_PAD > b.y && s.y - STAR_PAD < b.y + b.h);
  let inBox = true, clear = true, nStars = 0;
  for (const id in CATALOG) {
    nStars++;
    const s = CATALOG[id];
    if (s.x - STAR_PAD < 0 || s.y - STAR_PAD < 0 || s.x + STAR_PAD > world.W || s.y + STAR_PAD > world.H) { inBox = false; console.log('    · ' + id + ' out of viewBox at (' + s.x + ',' + s.y + ')'); }
    for (const b of boxes) if (starHit(s, b)) { clear = false; console.log('    · ' + id + ' over footprint ' + b.id); }
  }
  ok('every catalog star lies inside the 3100² viewBox (' + nStars + ' stars)', inBox);
  ok('every catalog star clears every solved footprint + the manor pool', clear);
})();

/* ── 5. plates partition + road + fold + basement ───────────────────────────── */
console.log('\n§1.9 plates: partition, road, fold, basement');
const live = PLACES.filter(p => !p.locked);
const seen = {}; let dupPlate = false, missing = 0;
Object.keys(pl.members).forEach(pid => pl.members[pid].forEach(r => { if (seen[r.id]) dupPlate = true; seen[r.id] = true; }));
live.forEach(r => { if (!seen[r.id]) missing++; });
ok('plates partition every live room exactly once (total + disjoint)', !dupPlate && missing === 0,
  'dup=' + dupPlate + ' missing=' + missing);
const c = world.centre; let wedgeBad = 0;
for (let t = 0; t <= 24; t++) {
  const p = { x: sol.road[0].x + (sol.road[1].x - sol.road[0].x) * t / 24, y: sol.road[0].y + (sol.road[1].y - sol.road[0].y) * t / 24 };
  const ang = (Math.atan2(p.x - c.x, -(p.y - c.y)) * 180 / Math.PI + 360) % 360;
  if (ang < 168 || ang > 192) wedgeBad++;
}
ok('road samples all lie in the wedge [168°,192°]', wedgeBad === 0);
ok('the fold detaches exactly {fairground}', JSON.stringify(Object.keys(pl.detached).sort()) === '["fairground"]');
const fairRooms = PLACES.filter(p => p.district === 'fairground' && !p.locked);
ok('child:fairground carries every fairground room (' + fairRooms.length + ' tiles)',
  (pl.members['child:fairground'] || []).length === fairRooms.length,
  'tiles=' + (pl.members['child:fairground'] || []).length + ' fairRooms=' + fairRooms.length);
ok('a gate face at the fairground polar centre, descent edge child↔manor',
  pl.gates.length === 1 && pl.gates[0].district === 'fairground' && pl.gates[0].box.w === 96 && pl.gates[0].box.h === 120 &&
  pl.parentOf['child:fairground'] === 'manor' && pl.edges.some(e => e[0] === 'child:fairground' && e[1] === 'manor'));
const RF = Layout.RELAY_FIELD, cl = pl.childLayout['child:fairground'];
let relayIn = true;
Object.keys(cl.foot).forEach(id => {
  const f = cl.foot[id];
  if (f.x < c.x - RF.w / 2 - 0.2 || f.x + f.w > c.x + RF.w / 2 + 0.2 || f.y < c.y - RF.h / 2 - 0.2 || f.y + f.h > c.y + RF.h / 2 + 0.2) relayIn = false;
});
ok('child tiles lay out inside RELAY_FIELD (1116×668, centred in world)', relayIn);
const b0 = Layout.basementSlot(0), b1 = Layout.basementSlot(1);
ok('basementSlot aliases beneathSlot/sealedStudySlot',
  JSON.stringify(Layout.beneathSlot()) === JSON.stringify(b0) && JSON.stringify(Layout.sealedStudySlot()) === JSON.stringify(b1));
const bu = Layout.basementUnion();
ok('the manor plate bbox encloses the basement band',
  pl.bbox.manor.x <= bu.x + 0.2 && pl.bbox.manor.y <= bu.y + 0.2 &&
  pl.bbox.manor.x + pl.bbox.manor.w >= bu.x + bu.w - 0.2 && pl.bbox.manor.y + pl.bbox.manor.h >= bu.y + bu.h - 0.2);

/* ── 6. determinism ─────────────────────────────────────────────────────────── */
console.log('\n§1.6 determinism');
ok('solve() double-runs byte-identical', JSON.stringify(Layout.solve(PLACES)) === JSON.stringify(Layout.solve(PLACES)));
ok('plates() double-runs byte-identical', JSON.stringify(Layout.plates(PLACES)) === JSON.stringify(Layout.plates(PLACES)));

/* ── 7. NEG-CONTROLS (each FAILS LOUD; synthetic districts, never a live §2.1 row) ── */
console.log('\n§9.3 neg-controls (each must throw)');
// a minimal, VALID synthetic table: the pole + one clean tier-1 district (angle 30 clears
// the road [168,192] and both lanes [82,94]/[246,258]). Each control clones + injures it.
function synthBase() {
  return {
    manor: { tier: 0, theme: { label: 'M', hue: '#111', tint: 0.04, style: 'x' }, layoutFn: 'greathouse', frame: { w: 280, h: 200 }, capacity: 23, clusters: [] },
    alpha: { tier: 1, angle: 30, theme: { label: 'A', hue: '#222', tint: 0.04, style: 'x' }, layoutFn: 'court', frame: { w: 240, h: 180 }, capacity: 6, clusters: [] }
  };
}
const alphaRooms = n => Array.from({ length: n }, (_, i) => ({ id: 'a' + i, district: 'alpha', tier: 2, order: i }));
// the base itself must SOLVE (so each failure isolates the injury)
ok('the synthetic base solves cleanly', (() => { Layout.solve(alphaRooms(3), { contracts: synthBase() }); return true; })());

throws('over-capacity district (4 rooms in a cap-3 district)', () => {
  const C = synthBase(); C.alpha.capacity = 3; Layout.solve(alphaRooms(4), { contracts: C });
}, /AT CAPACITY/);
throws('district on the road radian (angle 180)', () => {
  const C = synthBase(); C.alpha.angle = 180; Layout.solve([], { contracts: C });
}, /road|wedge/);
throws('two districts share a deed (angle+orbit)', () => {
  const C = synthBase(); C.beta = clone(C.alpha); C.beta.theme.label = 'B'; Layout.solve([], { contracts: C });
}, /deed|unique/);
throws('same-tier districts too close (5° at orbit 1)', () => {
  const C = synthBase(); C.beta = clone(C.alpha); C.beta.angle = 35; C.beta.theme.label = 'B'; Layout.solve([], { contracts: C });
});
throws('lane-violating span (centre inside the east sky lane)', () => {
  const C = synthBase(); C.alpha.angle = 88; Layout.solve([], { contracts: C });
}, /lane/);
throws('unknown layoutFn', () => {
  const C = synthBase(); C.alpha.layoutFn = 'bogus'; Layout.solve([], { contracts: C });
}, /layoutFn/);
throws('infeasible declared capacity (999 in a court)', () => {
  const C = synthBase(); C.alpha.capacity = 999; Layout.solve([], { contracts: C });
}, /seats at most|feasibl|capacity/);
throws('the detachOff fold neg-control (the fairground cannot fit its dormant knot)', () => {
  Layout.plates(PLACES, { detachOff: true });
});
throws('unknown district (room declares a district with no contract)', () => {
  Layout.solve([{ id: 'x', district: 'atlantis', tier: 2, order: 1 }]);
}, /unknown district/);
throws('unknown cluster (illegal wing in a real district)', () => {
  Layout.solve([{ id: 'x', district: 'opticks', tier: 2, order: 1, wing: 'amusements' }]);
}, /cluster/);
// a deliberately-collided formation fixture: the overlap gate itself must have teeth
ok('the overlap gate flags a deliberately-collided fixture',
  footOverlaps({ a: { x: 0, y: 0, w: 20, h: 20 }, b: { x: 10, y: 10, w: 20, h: 20 } }) > 0);

/* ── tally ──────────────────────────────────────────────────────────────────── */
console.log('\n' + (fail === 0 ? '✓ ALL ESTATE CHECKS PASS' : '✗ ' + fail + ' FAILED') + '  (' + pass + ' passed, ' + fail + ' failed)');
process.exit(fail === 0 ? 0 : 1);
