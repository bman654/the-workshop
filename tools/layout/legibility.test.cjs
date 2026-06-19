/* ════════════════════════════════════════════════════════════════════════════
   legibility.test.cjs — proves the LEGIBILITY CONSCIENCE's four claims + its
   falsifiable geometry crux. GREEN (exit 0) is the regression guard that lives
   here (NOT in smoke.cjs, whose live-door legibility red is an intended WARNING).

   The four DoD claims:
     1. clean-positive control (6 rooms, 1/district, spread) → composite < threshold (PASS)
     2. crowded-negative control (12 in one wing)            → composite > threshold (FAIL)
     3. MONOTONICITY: add-rooms-to-one-district sweep n=2..12 → density AND composite
        strictly non-decreasing (no inversion)
     4. THRESHOLD DERIVATION asserted from the controls (clean << threshold << crowded)
   Plus: facet-2 exact-integer crossing-counter unit proofs, and a renderAscii smoke.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const assert = require('assert');
const Layout = require('./layout.js');
const Leg = require('./legibility.cjs');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  ' + detail : '')); }
}

/* ── THE SHARED CONTROL CORPUS (defined ONCE — resolves coupling #4) ────────── */
// clean-positive: 6 rooms, 1 per district, well spread.
const CLEAN = [
  { id: 'a', room: 'Alpha',   piece: 'Alpha',   tag: 'one', district: 'manor',       tier: 2, wing: 'studies', footprint: 'house-wing' },
  { id: 'b', room: 'Beta',    piece: 'Beta',    tag: 'two', district: 'observatory', tier: 1,                  footprint: 'tower' },
  { id: 'c', room: 'Gamma',   piece: 'Gamma',   tag: 'three', district: 'grounds',   tier: 2, wing: 'works',   footprint: 'engine' },
  { id: 'd', room: 'Delta',   piece: 'Delta',   tag: 'four', district: 'cavern',     tier: 1,                  footprint: 'cave' },
  { id: 'e', room: 'Epsilon', piece: 'Epsilon', tag: 'five', district: 'outbuilding', tier: 3,                 footprint: 'shed' },
  { id: 'f', room: 'Zeta',    piece: 'Zeta',    tag: 'six', district: 'grounds',     tier: 2, wing: 'optics',  footprint: 'hall' }
];
// crowded-negative: 12 rooms stuffed into the grounds amusements wing.
function crowdedCorpus(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({
    id: 'x' + i, room: 'Crowded Room ' + i, piece: 'Crowded Piece ' + i, tag: 'jammed',
    district: 'grounds', tier: 1, wing: 'amusements', footprint: 'arcade', order: i
  });
  return out;
}
const CROWDED = crowdedCorpus(12);

console.log('=== legibility.test.cjs ===\n');

/* ── CLAIM 1 + 2: the two controls straddle the threshold ──────────────────── */
const cleanRep = Leg.score(Layout.solve(CLEAN), CLEAN);
const crowdedRep = Leg.score(Layout.solve(CROWDED), CROWDED);

console.log('Controls:');
console.log('  clean   composite =', cleanRep.overall.composite, '(' + cleanRep.overall.verdict + ')');
console.log('  crowded composite =', crowdedRep.overall.composite, '(' + crowdedRep.overall.verdict + ')\n');

ok('clean-positive PASSES (composite < threshold)',
  cleanRep.pass && cleanRep.overall.composite < Leg.THRESHOLD,
  '[' + cleanRep.overall.composite + ' < ' + Leg.THRESHOLD + ']');
ok('crowded-negative FAILS (composite > threshold)',
  !crowdedRep.pass && crowdedRep.overall.composite > Leg.THRESHOLD,
  '[' + crowdedRep.overall.composite + ' > ' + Leg.THRESHOLD + ']');

/* ── CLAIM 4: the threshold's derivation is asserted from the controls ──────── */
// derivation: with the weights fixed, THRESHOLD must sit strictly BETWEEN the
// clean composite and the crowded composite, with margin on both sides.
ok('threshold derives from controls: clean << threshold << crowded',
  cleanRep.overall.composite < Leg.THRESHOLD - 0.05 &&
  crowdedRep.overall.composite > Leg.THRESHOLD + 0.05,
  '[' + cleanRep.overall.composite + ' << ' + Leg.THRESHOLD + ' << ' + crowdedRep.overall.composite + ']');
// the weights are the documented blend (gap dominant) and sum to 1.
ok('weights are gap-dominant and normalized',
  Leg.WEIGHTS.gap === 0.5 && Leg.WEIGHTS.density === 0.3 && Leg.WEIGHTS.leader === 0.2 &&
  Math.abs(Leg.WEIGHTS.gap + Leg.WEIGHTS.density + Leg.WEIGHTS.leader - 1) < 1e-9,
  '[gap=' + Leg.WEIGHTS.gap + ' density=' + Leg.WEIGHTS.density + ' leader=' + Leg.WEIGHTS.leader + ']');

/* ── CLAIM 3: monotonicity — density AND composite non-decreasing across the
   add-rooms-to-one-district sweep n=2..12. No inversion. ───────────────────── */
console.log('\nMonotonicity sweep (grounds/amusements):');
let prevDens = -1, prevComp = -1, densMono = true, compMono = true;
const EPS = 1e-9;
for (let n = 2; n <= 12; n++) {
  const corpus = crowdedCorpus(n);
  const rep = Leg.score(Layout.solve(corpus), corpus);
  const dens = rep.overall.density;
  const comp = rep.overall.composite;
  if (dens < prevDens - EPS) densMono = false;
  if (comp < prevComp - EPS) compMono = false;
  const inv = (dens < prevDens - EPS || comp < prevComp - EPS) ? '  <-- INVERSION' : '';
  console.log('  n=' + String(n).padStart(2) + '  density=' + dens.toFixed(3) + '  composite=' + comp.toFixed(3) + inv);
  prevDens = dens; prevComp = comp;
}
ok('density is monotone non-decreasing across the sweep', densMono);
ok('composite is monotone non-decreasing across the sweep', compMono);

/* ── FACET 2 crux: EXACT-INTEGER crossing-counter unit proofs ──────────────── */
console.log('\nFacet-2 crossing-counter (exact integers):');
// two segments that cross in their interiors → exactly 1
const segCrossA = { x0: 0, y0: 0, x1: 10, y1: 10 };
const segCrossB = { x0: 0, y0: 10, x1: 10, y1: 0 };
ok('two crossing segments → 1', Leg.countCrossings([segCrossA, segCrossB]) === 1,
  '[got ' + Leg.countCrossings([segCrossA, segCrossB]) + ']');
// parallel segments → 0
const parA = { x0: 0, y0: 0, x1: 10, y1: 0 };
const parB = { x0: 0, y0: 5, x1: 10, y1: 5 };
ok('parallel segments → 0', Leg.countCrossings([parA, parB]) === 0,
  '[got ' + Leg.countCrossings([parA, parB]) + ']');
// segments sharing an endpoint (sibling stubs to one centre) → 0
const shareA = { x0: 5, y0: 5, x1: 0, y1: 0 };
const shareB = { x0: 5, y0: 5, x1: 10, y1: 0 };
ok('shared-endpoint (sibling stubs) → 0', Leg.countCrossings([shareA, shareB]) === 0,
  '[got ' + Leg.countCrossings([shareA, shareB]) + ']');
// a non-crossing disjoint pair → 0
const disjA = { x0: 0, y0: 0, x1: 1, y1: 1 };
const disjB = { x0: 9, y0: 9, x1: 10, y1: 10 };
ok('disjoint segments → 0', Leg.countCrossings([disjA, disjB]) === 0);
// three pairwise-crossing segments (a triangle of chords) → exactly 3
const t1 = { x0: 0, y0: 0, x1: 10, y1: 6 };
const t2 = { x0: 0, y0: 6, x1: 10, y1: 0 };
const t3 = { x0: 5, y0: -2, x1: 5, y1: 8 };
ok('three mutually-crossing segments → 3', Leg.countCrossings([t1, t2, t3]) === 3,
  '[got ' + Leg.countCrossings([t1, t2, t3]) + ']');

// segIntersectsRect: a leader stabbing a rect interior vs missing it.
ok('leader through rect interior → intrusion',
  Leg.segIntersectsRect(0, 5, 20, 5, { x: 8, y: 0, w: 4, h: 10 }, 0) === true);
ok('leader missing rect → no intrusion',
  Leg.segIntersectsRect(0, 50, 20, 50, { x: 8, y: 0, w: 4, h: 10 }, 0) === false);

/* ── renderAscii smoke: non-empty, names the verdict + the hottest district ─── */
console.log('\nrenderAscii smoke:');
const plate = Leg.renderAscii(crowdedRep);
ok('renderAscii returns a non-empty plate', typeof plate === 'string' && plate.length > 100);
ok('plate contains the verdict', plate.includes(crowdedRep.overall.verdict));
ok('plate names the pressure-hottest district',
  crowdedRep.overall.pressureHottest && plate.includes(crowdedRep.overall.pressureHottest.district));
ok('plate carries the proxy-honesty header (#103)', plate.includes('#103'));

/* ── shared label model: one model, no facet builds its own boxes ──────────── */
const m = Leg.buildLabelModel(CLEAN, Layout.solve(CLEAN));
ok('buildLabelModel returns one box per placed POI', m.boxes.length === CLEAN.length,
  '[' + m.boxes.length + '/' + CLEAN.length + ']');
ok('every box carries owner id + district + a leader segment',
  m.boxes.every(b => b.id && b.district && b.leader && typeof b.leader.x0 === 'number'));

console.log('\n' + (fail ? ('✗ ' + fail + ' FAILED, ' + pass + ' passed') : ('✓ ALL ' + pass + ' LEGIBILITY CHECKS PASS')));
process.exit(fail ? 1 : 0);
