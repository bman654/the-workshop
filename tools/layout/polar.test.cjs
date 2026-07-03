#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   polar.test.cjs — the polar contract's determinism + §2.1 conformance gate (W0.1).

   Proves contract.js + polar.js against the BINDING §2.1 table:
     · schema validation passes on the real CONTRACTS, and FAILS LOUD on planted defects
       (neg-controls: dup deed, unknown cluster, missing layoutFn, orbit under-separation);
     · the solver reproduces the committed oracle's geometry (R1/R2/R3, world 3100×3100,
       R_sky/R_gate, camera K constants, the freeSlots menu);
     · §1.6 DETERMINISM: solve() double-runs BYTE-IDENTICAL, and freeSlots too;
     · the ONE shared hash (fnv1a32/hash01) is stable + in-range;
     · SINGLE SOURCE OF TRUTH: polar's default ROAD/LANES equal contract.js's.

   Run: node tools/layout/polar.test.cjs   (pure Node; no DOM; part of the layout suite)
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const assert = require('assert');
const Contract = require('./contract.js');
const Polar = require('./polar.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function throws(name, fn, match) {
  try { fn(); fail++; console.log('  ✗ FAIL ' + name + ' — expected a throw, got none'); }
  catch (e) {
    if (match && !match.test(e.message)) { fail++; console.log('  ✗ FAIL ' + name + ' — wrong error: ' + e.message); }
    else { pass++; console.log('  ✓ ' + name); }
  }
}
// a deep clone that survives a mutated neg-control without touching the shared table
const clone = (o) => JSON.parse(JSON.stringify(o));

console.log('polar.test.cjs — the polar contract\n');

/* ── 1. schema validation on the real deeds ─────────────────────────────────── */
console.log('§1.2 schema validation');
ok('validate(CONTRACTS) passes', Contract.validate(Contract.CONTRACTS) === true);
// every district: required fields present
ok('every contract has layoutFn + frame + integer capacity',
  Object.keys(Contract.CONTRACTS).every(id => {
    const c = Contract.CONTRACTS[id];
    const frameOK = c.frame && (c.frame.r != null || (c.frame.w != null && c.frame.h != null));
    return c.layoutFn && frameOK && Number.isInteger(c.capacity) && c.capacity >= 0;
  }));
ok('manor is orbit 0 with no angle',
  Contract.CONTRACTS.manor.tier === 0 && Contract.CONTRACTS.manor.angle == null);
ok('approach owns the road, holds no orbit deed',
  Contract.CONTRACTS.approach.road && Contract.CONTRACTS.approach.tier == null && Contract.CONTRACTS.approach.angle == null);
ok('fairground carries detach on the contract (not the room)', Contract.CONTRACTS.fairground.detach === true);
ok('every declared cluster has CLUSTER_META', Object.keys(Contract.CONTRACTS).every(id =>
  (Contract.CONTRACTS[id].clusters || []).every(cl => !!Contract.CLUSTER_META[cl])));
ok('WING_META is the CLUSTER_META compat alias', Contract.WING_META === Contract.CLUSTER_META);

/* ── neg-controls: validation FAILS LOUD on planted defects ─────────────────── */
console.log('\n§1.2 negative controls (must throw)');
throws('duplicate polar deed throws', () => {
  const c = clone(Contract.CONTRACTS); c.opticks.angle = 270; c.number.angle = 270; c.number.tier = 2;
  Contract.validate(c);
}, /share the polar deed/);
throws('unknown cluster throws', () => {
  const c = clone(Contract.CONTRACTS); c.works.clusters = c.works.clusters.concat(['no-such-wing']);
  Contract.validate(c);
}, /unknown cluster/);
throws('missing layoutFn throws the gated-failure template', () => {
  const c = clone(Contract.CONTRACTS); delete c.works.layoutFn;
  Contract.validate(c);
}, /no default packer/);
throws('unknown layoutFn throws when formations are known', () => {
  const c = clone(Contract.CONTRACTS); c.works.layoutFn = 'grid';
  Contract.validate(c, ['court', 'crescent', 'knot', 'rings', 'pascal', 'ashlar', 'roadside', 'greathouse']);
}, /unknown "grid"/);
throws('non-integer capacity throws', () => {
  const c = clone(Contract.CONTRACTS); c.works.capacity = 12.5;
  Contract.validate(c);
}, /integer capacity/);

/* ── 2. solver reproduces the committed oracle geometry ─────────────────────── */
console.log('\n§1.4–§1.7 solve reproduces the oracle');
const sol = Polar.solve(Contract.CONTRACTS, { road: Contract.ROAD, lanes: Contract.LANES });
const w = sol.world;
console.log('  world extent: ' + w.viewBox + '  (R1=' + w.R[1] + ' R2=' + w.R[2] + ' R3=' + w.R[3] + ')');
ok('R1 = 408', w.R[1] === 408, String(w.R[1]));
ok('R2 = 792', w.R[2] === 792, String(w.R[2]));
ok('R3 = 1080', w.R[3] === 1080, String(w.R[3]));
ok('world is 3100 × 3100 (square)', w.W === 3100 && w.H === 3100, w.viewBox);
ok('viewBox string derived', w.viewBox === '0 0 3100 3100', w.viewBox);
ok('R_sky = 1233', w.Rsky === 1233, String(w.Rsky));
ok('R_gate = 1243, inside the ring outer edge 1473', w.Rgate === 1243 && w.skyOuter === 1473);
ok('manor centre (1549,1549) keeps every coord positive', w.centre.x === 1549 && w.centre.y === 1549);
ok('camera K_MIN=1, K_MAX=9, K_LOD strictly inside', w.K_MIN === 1 && w.K_MAX === 9 && w.K_LOD > 1 && w.K_LOD < 9, 'K_LOD=' + w.K_LOD);
ok('K_LOD = 3.44 (the oracle value)', w.K_LOD === 3.44, String(w.K_LOD));
// every solved district sits inside the world with a legal span
ok('every district emits positive coords inside the world',
  Object.keys(sol.districts).every(id => {
    const d = sol.districts[id];
    return d.x >= 0 && d.y >= 0 && d.x <= w.W && d.y <= w.H;
  }));
// all emitted coords are 0.1-quantized
ok('all emitted radii/coords round to 0.1',
  Object.keys(sol.districts).every(id => {
    const d = sol.districts[id];
    const q = v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;
    return q(d.r) && q(d.x) && q(d.y) && q(d.rho) && q(d.alpha);
  }));

/* ── 3. determinism: double-solve byte-compare (§1.6) ───────────────────────── */
console.log('\n§1.6 determinism');
const a = JSON.stringify(Polar.solve(Contract.CONTRACTS, { road: Contract.ROAD, lanes: Contract.LANES }));
const b = JSON.stringify(Polar.solve(Contract.CONTRACTS, { road: Contract.ROAD, lanes: Contract.LANES }));
ok('solve() double-runs byte-identical', a === b, 'len ' + a.length + ' vs ' + b.length);
const districts = Polar.tieredDistricts(Contract.CONTRACTS);
const fs1 = JSON.stringify([1, 2, 3].map(t => Polar.freeSlots(districts, w.R, w.maxRho, t, 140, Contract.ROAD, Contract.LANES)));
const fs2 = JSON.stringify([1, 2, 3].map(t => Polar.freeSlots(districts, w.R, w.maxRho, t, 140, Contract.ROAD, Contract.LANES)));
ok('freeSlots double-runs byte-identical', fs1 === fs2);
ok('polar module source calls no Math.random / Date / Intl API',
  !/Math\.random\s*\(|new Date\b|Date\.(now|parse|UTC)|Intl\./.test(require('fs').readFileSync(__dirname + '/polar.js', 'utf8')));

/* ── 4. freeSlots menu matches §1.5's illustrative values ───────────────────── */
console.log('\n§1.5 freeSlots');
const fsT1 = Polar.freeSlots(districts, w.R, w.maxRho, 1, 140, Contract.ROAD, Contract.LANES);
const fsT2 = Polar.freeSlots(districts, w.R, w.maxRho, 2, 140, Contract.ROAD, Contract.LANES);
const fsT3 = Polar.freeSlots(districts, w.R, w.maxRho, 3, 140, Contract.ROAD, Contract.LANES);
ok('orbit 1 is FULL — the menu is honestly empty', fsT1.ranges.length === 0);
ok('orbit 2 has one window ≈[132,148]', fsT2.ranges.length === 1 && fsT2.ranges[0][0] === 132 && fsT2.ranges[0][1] === 148,
  JSON.stringify(fsT2.ranges));
ok('orbit 3 is wide open', fsT3.ranges.length >= 1 && (fsT3.ranges[fsT3.ranges.length - 1][1] - fsT3.ranges[0][0]) > 120,
  JSON.stringify(fsT3.ranges));

/* ── 5. the HARD angular / clearance law throws on violation ────────────────── */
console.log('\n§1.5/§1.4 the hard law throws');
throws('a district span leaning over the road throws', () => {
  // number → 192° keeps every orbit-2 separation ≥60° but swings its span onto the [168,192] wedge
  const c = clone(Contract.CONTRACTS); c.number.angle = 192;
  Polar.solve(c, { road: Contract.ROAD, lanes: Contract.LANES });
}, /leans within|road/);
throws('orbit under-separation throws', () => {
  const c = clone(Contract.CONTRACTS); c.gardens.angle = 130;   // 5° from works@125, orbit 1 needs 90
  Polar.solve(c, { road: Contract.ROAD, lanes: Contract.LANES });
}, /apart|needs/);

/* ── 6. the ONE shared hash (§1.6) ──────────────────────────────────────────── */
console.log('\n§1.6 fnv1a32 / hash01');
ok('fnv1a32 is deterministic', Polar.fnv1a32('works') === Polar.fnv1a32('works'));
ok('hash01 in [0,1)', ['works', 'gardens', 'observatory', 'x'].every(s => {
  const h = Polar.hash01(s); return h >= 0 && h < 1;
}));
ok('distinct ids hash distinctly', Polar.fnv1a32('works') !== Polar.fnv1a32('gardens'));

/* ── 7. single source of truth: polar defaults == contract reservations ─────── */
console.log('\nsingle source of truth (ROAD/LANES)');
ok('polar default ROAD equals contract.ROAD',
  JSON.stringify(Polar.CONST.ROAD) === JSON.stringify(Contract.ROAD));
ok('polar default LANES equal contract.LANES',
  JSON.stringify(Polar.CONST.LANES) === JSON.stringify(Contract.LANES));

console.log('\n' + (fail ? fail + ' FAILURES / ' : '') + pass + ' checks passed');
process.exit(fail ? 1 : 0);
