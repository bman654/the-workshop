#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   formations.test.cjs — the FORMATION HARNESS (W0.2, DESIGN §1.3).

   For EVERY formation × every district frame it serves, sweep n ∈ 1..maxCapacity and
   assert the §1.3 packer contract:
     · no slot overlap (clearance ≥ 6px, disc- and rect-aware);
     · every lot ≥ MIN_LOT (30px) wide;
     · the hull is CONTAINED in the declared frame (box, or disc for rings; roadside
       ignores its frame by design and is exempt);
     · pack() double-runs BYTE-IDENTICAL (§1.6 determinism);
     · slots preserve every room id, 1:1.
   And the live neg-control per formation: n = maxCapacity+1 MUST THROW.

   Run: node tools/layout/formations.test.cjs   (pure Node; no DOM; part of the layout suite)
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const assert = require('assert');
const F = require('./formations.js');
const FORMATIONS = F.FORMATIONS;
const MIN_LOT = F.MIN_LOT;
const GUT_FLOOR = 6;                 // the harness's non-overlap gutter floor
const EPS = 0.2;                     // slack for 0.1-rounding at the emit boundary

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function throws(name, fn, match) {
  try { fn(); fail++; console.log('  ✗ FAIL ' + name + ' — expected a throw, got none'); }
  catch (e) {
    if (match && !match.test(e.message)) { fail++; console.log('  ✗ FAIL ' + name + ' — wrong error: ' + e.message); }
    else { pass++; }
  }
}

/* ── clearance between two slots (disc/rect aware). ≥0 = apart by that gap; <0 = overlap. ── */
function clearance(a, b) {
  const ad = !!a.disc, bd = !!b.disc;
  if (ad && bd) {
    const dx = a.cx - b.cx, dy = a.cy - b.cy;
    return Math.sqrt(dx * dx + dy * dy) - a.r - b.r;
  }
  if (!ad && !bd) {
    const gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
    const gy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
    return Math.max(gx, gy);              // AABBs clear iff either axis separates
  }
  // disc vs rect: distance from the disc centre to the rect, minus r.
  const disc = ad ? a : b, rect = ad ? b : a;
  const nx = Math.max(rect.x, Math.min(disc.cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(disc.cy, rect.y + rect.h));
  const dx = disc.cx - nx, dy = disc.cy - ny;
  return Math.sqrt(dx * dx + dy * dy) - disc.r;
}

function minClearance(slots) {
  let m = Infinity;
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++)
      m = Math.min(m, clearance(slots[i], slots[j]));
  return m;
}

function hullFits(hull, frame, formation) {
  if (formation === 'roadside') return true;              // roadside ignores its frame (§1.3)
  if (formation === 'rings') return hull.r != null && hull.r <= frame.r + EPS;
  return hull.w <= frame.w + EPS && hull.h <= frame.h + EPS;
}

/* ── synthetic rooms: sorted-stable ids/orders; two clusters to exercise contiguity. ── */
function rooms(n, opts) {
  opts = opts || {};
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = { id: 'r' + String(i).padStart(2, '0'), order: i, tier: 2 };
    if (opts.clustered) r.wing = (i % 2 === 0) ? 'alpha' : 'beta';
    out.push(r);
  }
  return out;
}

/* ── the sweep: (label, frame, formationKey). Court serves three frames, knot two. ── */
const CASES = [
  ['greathouse', { w: 280, h: 200 }, 'greathouse'],
  ['rings/observatory', { r: 140 }, 'rings'],
  ['pascal/number', { w: 240, h: 170 }, 'pascal'],
  ['ashlar', { w: 240, h: 160 }, 'ashlar'],
  ['court/works', { w: 300, h: 220 }, 'court'],
  ['court/gardens', { w: 240, h: 180 }, 'court'],
  ['court/opticks', { w: 220, h: 150 }, 'court'],
  ['crescent/promenades', { w: 280, h: 130 }, 'crescent'],
  ['knot/cavern', { w: 150, h: 110 }, 'knot'],
  ['knot/outbuilding', { w: 140, h: 100 }, 'knot'],
  ['roadside/approach', { w: 120, h: 120 }, 'roadside']
];

console.log('formations.test.cjs — the 8-formation packer harness\n');

CASES.forEach(function (cs) {
  const label = cs[0], frame = cs[1], key = cs[2], fmt = FORMATIONS[key];
  const max = fmt.maxCapacity(frame);
  ok(label + ': maxCapacity ≥ 1', max >= 1, String(max));

  let sweepOverlap = true, sweepFloor = true, sweepHull = true, sweepIds = true, sweepDet = true;
  let worstClear = Infinity, worstFloor = Infinity;
  for (let n = 1; n <= max; n++) {
    const res = fmt.pack(rooms(n), frame);
    // 1:1 id preservation
    if (res.slots.length !== n) sweepIds = false;
    const ids = res.slots.map(s => s.id).sort();
    const want = rooms(n).map(r => r.id).sort();
    if (JSON.stringify(ids) !== JSON.stringify(want)) sweepIds = false;
    // no overlap
    if (n >= 2) { const c = minClearance(res.slots); worstClear = Math.min(worstClear, c); if (c < GUT_FLOOR - EPS) sweepOverlap = false; }
    // lot floor
    res.slots.forEach(s => { worstFloor = Math.min(worstFloor, s.w); if (s.w < MIN_LOT - EPS) sweepFloor = false; });
    // hull containment
    if (!hullFits(res.hull, frame, res.formation)) sweepHull = false;
    // determinism (byte-identical double run)
    if (JSON.stringify(res) !== JSON.stringify(fmt.pack(rooms(n), frame))) sweepDet = false;
  }
  ok(label + ': every n∈1..' + max + ' has NO slot overlap (≥' + GUT_FLOOR + 'px)', sweepOverlap, 'worst clearance ' + (isFinite(worstClear) ? worstClear.toFixed(1) : 'n/a'));
  ok(label + ': every lot ≥ MIN_LOT ' + MIN_LOT + 'px', sweepFloor, 'worst lot.w ' + (isFinite(worstFloor) ? worstFloor.toFixed(1) : 'n/a'));
  ok(label + ': hull contained in frame', sweepHull);
  ok(label + ': ids preserved 1:1', sweepIds);
  ok(label + ': pack double-runs byte-identical', sweepDet);

  // the live neg-control: n = maxCapacity+1 MUST throw.
  throws(label + ': n=' + (max + 1) + ' (cap+1) throws', function () { fmt.pack(rooms(max + 1), frame); }, /cannot seat|crush/);
});

/* ── structural spot-checks on the contract shape ────────────────────────────── */
console.log('\ncontract shape');
const cSample = FORMATIONS.court.pack(rooms(6, { clustered: true }), { w: 300, h: 220 });
ok('court returns {slots, clusterRects, hull}', Array.isArray(cSample.slots) && Array.isArray(cSample.clusterRects) && cSample.hull != null);
ok('court emits DISC footprints (cx,cy,r)', cSample.slots.every(s => s.disc && s.r != null && s.cx != null));
ok('court builds a clusterRect per cluster (2 clusters → 2 rects)', cSample.clusterRects.length === 2, JSON.stringify(cSample.clusterRects.map(r => r.cluster)));
const gSample = FORMATIONS.greathouse.pack(rooms(23), { w: 280, h: 200 });
ok('greathouse seats 23 (21 house + 2 basement overflow) with no overlap', gSample.slots.length === 23 && minClearance(gSample.slots) >= GUT_FLOOR - EPS, 'clear ' + minClearance(gSample.slots).toFixed(1));
ok('greathouse emits RECT footprints (no disc)', gSample.slots.every(s => !s.disc));
ok('greathouse.basementSlot(frame,0/1) are two disjoint reserved slots',
  (function () { const a = FORMATIONS.greathouse.basementSlot({ w: 280, h: 200 }, 0), b = FORMATIONS.greathouse.basementSlot({ w: 280, h: 200 }, 1); return clearance({ x: a.x, y: a.y, w: a.w, h: a.h }, { x: b.x, y: b.y, w: b.w, h: b.h }) > 0 && a.w >= MIN_LOT - EPS; })());
const kSample = FORMATIONS.knot.pack(rooms(1), { w: 150, h: 110 });
ok('knot n=1 degenerates to the anchor alone', kSample.slots.length === 1);
const rSample = FORMATIONS.roadside.pack(rooms(2), { w: 120, h: 120 });
ok('roadside seats its 2 stops', rSample.slots.length === 2 && rSample.slots.every(s => !s.disc));

/* ── determinism: the module source calls no Math.random / Date / Intl ───────── */
console.log('\n§1.6 determinism');
ok('formations.js calls no Math.random / Date / Intl API',
  !/Math\.random\s*\(|new Date\b|Date\.(now|parse|UTC)|Intl\./.test(require('fs').readFileSync(__dirname + '/formations.js', 'utf8')));

/* ── the registry is exactly the 8 declared formations ───────────────────────── */
ok('exactly 8 formations: greathouse rings pascal ashlar court crescent knot roadside',
  JSON.stringify(Object.keys(FORMATIONS).sort()) === JSON.stringify(['ashlar', 'court', 'crescent', 'greathouse', 'knot', 'pascal', 'rings', 'roadside']));

console.log('\n' + (fail ? fail + ' FAILURES / ' : '') + pass + ' checks passed');
process.exit(fail ? 1 : 0);
