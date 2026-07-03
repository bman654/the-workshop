/* ════════════════════════════════════════════════════════════════════════════
   legibility.test.cjs — proves the LEGIBILITY CONSCIENCE's four claims + its
   falsifiable geometry crux. GREEN (exit 0) is the regression guard that lives
   here (NOT in smoke.cjs, whose live-door legibility red is an intended WARNING).

   The DoD claims (v2 — polar, §9.1):
     1. clean-positive control (6 rooms, 1 per POLAR district, spread) → composite < threshold
     2. crowded-negative control (a tight hand-placed cluster)         → composite > threshold
     3. MONOTONICITY: growing that cluster n=2..12 → density AND composite strictly
        non-decreasing (measured on a controlled cluster, not the packer — the polar
        formations pack non-monotonically as n grows, so a packer sweep would confound it)
     4. THRESHOLD DERIVATION asserted from the controls (clean << threshold << crowded)
     5. THE HARD PER-DISTRICT-PLATE GATE (replaces the dead CROWDING_BASELINE ratchet):
        every district plate, re-laid into RELAY_FIELD + name-only, scores < 0.30 over the
        LIVE PLACES — achievable pre-gather because LABEL_BOUNDS is world-derived (§1.7).
        The ESTATE-plate composite (structure labels) self-skips until W1.3.
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
// clean-positive: 6 rooms, 1 per POLAR district (§2.1), well spread — the packer seats
// each in its own precinct across the world, so the conscience reads it LEGIBLE.
const CLEAN = [
  { id: 'a', room: 'Alpha',   piece: 'Alpha',   tag: 'one',   district: 'manor',       tier: 2, footprint: 'house-wing' },
  { id: 'b', room: 'Beta',    piece: 'Beta',    tag: 'two',   district: 'observatory', tier: 1, footprint: 'tower' },
  { id: 'c', room: 'Gamma',   piece: 'Gamma',   tag: 'three', district: 'gardens',     tier: 2, footprint: 'hall' },
  { id: 'd', room: 'Delta',   piece: 'Delta',   tag: 'four',  district: 'cavern',      tier: 1, footprint: 'cave' },
  { id: 'e', room: 'Epsilon', piece: 'Epsilon', tag: 'five',  district: 'outbuilding', tier: 3, footprint: 'shed' },
  { id: 'f', room: 'Zeta',    piece: 'Zeta',    tag: 'six',   district: 'works',       tier: 2, footprint: 'engine' }
];
// crowded-negative + the monotonicity sweep: n footprints HAND-PLACED on a tight grid
// near the world core. This proves the CONSCIENCE (not the packer): adding a room to a
// fixed cluster strictly raises the density peak AND the composite, with no packer
// re-arrangement to confound the sweep (the polar formations pack non-monotonically as n
// grows — a real repo fact, so the monotonicity claim is measured on a controlled cluster).
function crowdedSolution(n) {
  const foot = {}, footMeta = {}, places = [];
  const cx = 1400, cy = 1400, COLW = 70, ROWH = 52; // tight → labels compete
  for (let i = 0; i < n; i++) {
    const c = i % 3, r = Math.floor(i / 3);
    foot['x' + i] = { x: cx + c * COLW, y: cy + r * ROWH, w: 44, h: 32 };
    footMeta['x' + i] = { district: 'number', tier: 2 };
    places.push({ id: 'x' + i, room: 'Crowded Room ' + i, piece: 'Crowded Piece ' + i, tag: 'jammed', district: 'number', tier: 2, order: i });
  }
  return { solution: { foot, footMeta, graph: null }, places };
}
function crowdedRepOf(n) { const c = crowdedSolution(n); return Leg.score(c.solution, c.places); }

console.log('=== legibility.test.cjs ===\n');

/* ── CLAIM 1 + 2: the two controls straddle the threshold ──────────────────── */
const cleanRep = Leg.score(Layout.solve(CLEAN), CLEAN);
const crowdedRep = crowdedRepOf(12);

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
console.log('\nMonotonicity sweep (a tight hand-placed cluster, n=2..12):');
let prevDens = -1, prevComp = -1, densMono = true, compMono = true;
const EPS = 1e-9;
for (let n = 2; n <= 12; n++) {
  const rep = crowdedRepOf(n);
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

/* ── NAME-ONLY mode (the PLATE self-test's construction rule, #262) ─────────── */
console.log('\nName-only label mode (#262 — drops the "PIECE · tag" sub-line):');
// a room whose UPPERCASE sub-line is much WIDER than its name: full box >> name box.
const wide = [{ id: 'w', room: 'Hex', piece: 'The Game That Cannot Tie', tag: 'union-find',
  district: 'number', tier: 2, footprint: 'numbers-room' }];
const solW = Layout.solve(wide);
const full = Leg.buildLabelModel(wide, solW);
const nameO = Leg.buildLabelModel(wide, solW, { nameOnly: true });
ok('name-only box is NARROWER than the full label box (sub-line dropped)',
  nameO.boxes[0].box.w < full.boxes[0].box.w,
  '[name=' + nameO.boxes[0].box.w.toFixed(0) + ' < full=' + full.boxes[0].box.w.toFixed(0) + ']');
ok('name-only box width == nameLen·CHAR_W_NAME + 2·PAD (exact)',
  Math.abs(nameO.boxes[0].box.w - ('Hex'.length * Leg.CHAR_W_NAME + 2 * Leg.PAD)) < 1e-9);
ok('name-only box height == BOX_H_NAME + 2·PAD (exact)',
  Math.abs(nameO.boxes[0].box.h - (Leg.BOX_H_NAME + 2 * Leg.PAD)) < 1e-9);
// a relaySide override seats the box on the requested side (the re-lay's L/R fan)
const seated = Leg.buildLabelModel([{ ...wide[0], relaySide: 'left' }], solW, { nameOnly: true });
const anchorX = solW.foot.w.x + solW.foot.w.w / 2;
ok('relaySide:left seats the name-only box to the LEFT of the footprint anchor',
  seated.boxes[0].box.x + seated.boxes[0].box.w <= anchorX,
  '[box right=' + (seated.boxes[0].box.x + seated.boxes[0].box.w).toFixed(0) + ' ≤ anchor=' + anchorX.toFixed(0) + ']');

/* ── THE PLATE PARTITION (#262 — "More Than One Front Door") ────────────────── */
console.log('\nPlate partition (Layout.plates over the live PLACES):');
const fs2 = require('fs');
const path2 = require('path');
const SRC2 = path2.join(__dirname, '..', '..', 'index.src.html');
const src2 = fs2.readFileSync(SRC2, 'utf8');
const a2 = src2.indexOf('const PLACES = ['), b2 = src2.indexOf('\n];', a2);
// eslint-disable-next-line no-eval
const LIVE2 = eval('(' + src2.slice(a2 + 'const PLACES = '.length, b2 + 2) + ')').filter(p => !p.locked);
const PP = Layout.plates(LIVE2);

// total + disjoint
let tot = 0; const seen2 = new Set(); let dup2 = false;
for (const id of PP.ids) for (const r of PP.members[id]) { if (seen2.has(r.id)) dup2 = true; seen2.add(r.id); tot++; }
ok('partition is TOTAL + DISJOINT (every live room → exactly one plate)',
  tot === LIVE2.length && seen2.size === LIVE2.length && !dup2,
  '[' + tot + '/' + LIVE2.length + ' rooms, ' + PP.ids.length + ' plates]');

// re-lay a plate's rooms into the airy RELAY_FIELD and attach each room's OUTWARD fan
// side (sideById) — the exact geometry the page uses when you ENTER a plate. Without the
// side a right-column label fans LEFT into its neighbour's footprint, a FALSE collision
// (relayPlate returns {foot,footMeta,sideById} in v2 — the old relay.places is gone).
function scorePlate(members, opts) {
  const relay = Layout.relayPlate(members);
  const placed = members.map(r => ({ ...r, relaySide: relay.sideById[r.id] }));
  return Leg.score({ foot: relay.foot, footMeta: relay.footMeta, graph: null }, placed, opts);
}

/* ── THE HARD PER-DISTRICT-PLATE GATE (§9.1 — replaces the dead CROWDING_BASELINE
   ratchet). Every district plate, re-laid and name-only, scores < 0.30. This is now
   ACHIEVABLE pre-gather: LABEL_BOUNDS is world-derived (§1.7 — labels seat by their
   footprints, not clamped to the retired 1440×900 box), and the outward fan keeps a
   plate's own labels apart. The ESTATE-plate composite (the district-STRUCTURE labels)
   arms at W1.3 when the structures render — it SELF-SKIPS below. ─────────────────── */
let floorAll = true; const worst = { id: null, c: -1 };
for (const id of PP.ids) {
  const rep = scorePlate(PP.members[id], { nameOnly: true });
  if (rep.overall.composite >= Leg.THRESHOLD) floorAll = false;
  if (rep.overall.composite > worst.c) { worst.id = id; worst.c = rep.overall.composite; }
}
ok('HARD GATE: every district plate clears < 0.30 ALONE (re-lay + name-only)', floorAll,
  '[worst: ' + worst.id + ' = ' + worst.c.toFixed(3) + ' < ' + Leg.THRESHOLD + ']');

// NEG-CONTROL 1: all rooms on ONE plate, full labels → CROWDED (the gate has teeth).
const ncAll = scorePlate(LIVE2, {});
ok('NEG-CONTROL: all ' + LIVE2.length + ' rooms on ONE plate (full labels) → CROWDED',
  ncAll.overall.composite >= Leg.THRESHOLD,
  '[' + ncAll.overall.composite.toFixed(3) + ' ≥ ' + Leg.THRESHOLD + ']');

// NEG-CONTROL 2: name-only is load-bearing — a plate where FULL fails but name-only passes.
let loadBearing = false, lbId = null;
for (const id of PP.ids) {
  const f = scorePlate(PP.members[id], {});
  const n = scorePlate(PP.members[id], { nameOnly: true });
  if (f.overall.composite >= Leg.THRESHOLD && n.overall.composite < Leg.THRESHOLD) { loadBearing = true; lbId = lbId || id; }
}
ok('NEG-CONTROL: name-only is LOAD-BEARING (a plate reads CROWDED full / LEGIBLE name-only)',
  loadBearing, lbId ? '[' + lbId + ']' : '');

/* ── the ESTATE plate (district-STRUCTURE labels, ~11) — arms at W1.3 (round 4): the
   structure labels are rendered by the LOD wave, so this composite SELF-SKIPS here,
   reported not-yet-armed rather than green (the pill stays honest at every wave). ── */
console.log('  ⏭ ESTATE-plate composite (structure labels) — not yet armed (arms at W1.3, §10)');

// reciprocal + connected road graph
let recip2 = true;
for (const a in PP.adj) for (const c in PP.adj[a]) if (!(PP.adj[c] && PP.adj[c][a])) recip2 = false;
const q2 = ['manor'], vis2 = new Set(q2);
while (q2.length) { const x = q2.shift(); for (const y in (PP.adj[x] || {})) if (!vis2.has(y)) { vis2.add(y); q2.push(y); } }
ok('road graph reciprocates (A↔B ⇔ B↔A) and every plate is reachable from the door',
  recip2 && vis2.size === PP.ids.length, '[' + PP.edges.length + ' edges, ' + vis2.size + '/' + PP.ids.length + ' reachable]');

// beneath rides the manor plate (the extension is load-bearing)
const bs2 = PP.beneath, mb2 = PP.bbox.manor;
const enc2 = bs2.x >= mb2.x && bs2.y >= mb2.y && bs2.x + bs2.w <= mb2.x + mb2.w && bs2.y + bs2.h <= mb2.y + mb2.h;
ok('the BENEATH slot is enclosed by the (extended) manor plate bbox', enc2);

console.log('\n' + (fail ? ('✗ ' + fail + ' FAILED, ' + pass + ' passed') : ('✓ ALL ' + pass + ' LEGIBILITY CHECKS PASS')));
process.exit(fail ? 1 : 0);
