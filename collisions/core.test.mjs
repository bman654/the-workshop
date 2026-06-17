#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin proving THE CLACK COUNTER exact. Exit 0 = green.

   Proves, against the SAME core.mjs the page inlines:
     (1) closedCount == velocityCount == eventCount == {3,31,314,3141} for N=0..3,
         the closed form computed via the wedge formula (NOT a stepped loop).
     (2) the visible event engine's emitted count === the closed-form count for
         every tested ratio, including OFF-FAMILY ratios 2, 50, 1000, 64.
     (3) momentum & KE conserved to machine ε AT EACH EVENT — with the Explorer-2
         lesson encoded: KE is checked across ALL events, but momentum ONLY across
         block-block events (the wall absorbs impulse and legitimately flips total
         momentum; testing total P across a wall hit gives a spurious ~2.0 drift —
         that false failure is the bug that sank Explorer 2's self-test).
     (4) NEG CONTROL: a non-100-power ratio does NOT match any π-digit prefix.
     (5) THE BOUNDARY TRAP: naive floor(π/θ) != truth at 1:1 (gives 4 not 3) and
         3:1 (gives 6 not 5); ceil−1 == the exact truth.
   ════════════════════════════════════════════════════════════════════════════ */

import {
  closedCount, naiveFloorCount, velocityCount, simulate, eventCount,
  elasticBlockBlock, isPiPrefix, piPrefix, RATIOS,
} from './core.mjs';

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + `  (got ${a}, want ${b})`); }

// ── (1) closed == velocity == event == π-prefix for N = 0..3 ──────────────────
const PI_PREFIX = [3, 31, 314, 3141];
for (let N = 0; N <= 3; N++) {
  const M = Math.pow(100, N);
  const cf = closedCount(M, 1);
  const vc = velocityCount(M, 1);
  const ec = eventCount(M, 1);
  eq(cf, PI_PREFIX[N], `closedCount(100^${N}) == π-prefix`);
  eq(vc, PI_PREFIX[N], `velocityCount(100^${N}) == π-prefix`);
  eq(ec, PI_PREFIX[N], `eventCount(100^${N}) == π-prefix`);
  eq(cf, vc, `closed == velocity (100^${N})`);
  eq(cf, ec, `closed == event (100^${N})  [dual truth]`);
  // and the closed form really agrees with the explicit π digits
  eq(cf, piPrefix(N + 1), `closedCount(100^${N}) == first ${N + 1} digits of π`);
}

// ── (2) visible event engine count === closed form for many ratios (incl off-family)
for (const M of [...RATIOS, 2, 50, 1000, 64, 7, 256, 3, 9]) {
  const cf = closedCount(M, 1);
  const ec = eventCount(M, 1);
  const vc = velocityCount(M, 1);
  eq(ec, cf, `event-engine count === closed form  (M=${M})`);
  eq(vc, cf, `velocity count === closed form  (M=${M})`);
}

// ── (3) conservation AT EACH EVENT — KE across all, momentum ONLY block-block ──
(function () {
  // exercise a real-mass family + a couple off-family ratios
  for (const M of [1, 100, 10000, 1000000, 2, 50, 64]) {
    const m = 1;
    const { events, geom } = simulate(M, m);
    // initial state (pre-first-event)
    const vH0 = 1, vL0 = 0;
    const KE0 = 0.5 * M * vH0 * vH0 + 0.5 * m * vL0 * vL0;
    let prevVH = vH0, prevVL = vL0;
    let maxKErel = 0, maxPblockAbs = 0;
    for (const ev of events) {
      const KE = 0.5 * M * ev.vH * ev.vH + 0.5 * m * ev.vL * ev.vL;
      maxKErel = Math.max(maxKErel, Math.abs(KE - KE0) / KE0);    // KE invariant ALWAYS
      if (ev.kind === 'block') {
        // momentum is conserved ONLY across an elastic block-block event:
        // P_before === P_after.  P_before uses the velocities from BEFORE this event.
        const Pbefore = M * prevVH + m * prevVL;
        const Pafter = M * ev.vH + m * ev.vL;
        maxPblockAbs = Math.max(maxPblockAbs, Math.abs(Pafter - Pbefore));
      }
      prevVH = ev.vH; prevVL = ev.vL;
    }
    ok(maxKErel < 1e-12, `KE conserved at EVERY event to machine ε  (M=${M}, drift=${maxKErel.toExponential(2)})`);
    ok(maxPblockAbs < 1e-9, `momentum conserved at EVERY block-block event  (M=${M}, drift=${maxPblockAbs.toExponential(2)})`);
  }

  // EXPLORER-2 LANDMINE, made explicit: if we (wrongly) tested total momentum
  // ACROSS a wall hit, it would flip by ~2·m·|vL| — a spurious failure. Prove the
  // wall genuinely flips total P (so the naive test WOULD fire), justifying why we
  // exclude wall events above.
  const { events } = simulate(100, 1);
  const wallEv = events.find(e => e.kind === 'wall');
  ok(!!wallEv, 'there is at least one wall event to inspect');
  if (wallEv) {
    // reconstruct the pre-wall velocities: a wall event only negates vL, vH unchanged.
    const preVL = -wallEv.vL, preVH = wallEv.vH;
    const Pbefore = 100 * preVH + 1 * preVL;
    const Pafter = 100 * wallEv.vH + 1 * wallEv.vL;
    ok(Math.abs(Pafter - Pbefore) > 1e-6,
       'wall hit DOES flip total momentum (so testing P across it would falsely fail) — justifying the block-only momentum check');
  }
})();

// ── (4) NEG CONTROL — non-100-power ratios are NOT π-prefixes ──────────────────
for (const M of [2, 50, 1000, 64, 7, 256, 9]) {
  const c = closedCount(M, 1);
  ok(!isPiPrefix(c), `NEG-CONTROL: M=${M} count ${c} is NOT a π-prefix`);
}
// and the π-power ratios ARE π-prefixes (positive control)
for (let N = 0; N <= 3; N++) {
  ok(isPiPrefix(closedCount(Math.pow(100, N), 1)), `POS-CONTROL: 100^${N} count is a π-prefix`);
}

// ── (5) THE BOUNDARY TRAP — naive floor != truth at 1:1 and 3:1; ceil−1 right ─
(function () {
  // 1:1 → θ=π/4, π/θ=4. floor=4 (WRONG), ceil−1=3 (RIGHT).
  eq(naiveFloorCount(1, 1), 4, 'boundary trap: naive floor(π/θ) at 1:1 gives 4 (the wrong answer)');
  eq(closedCount(1, 1), 3, 'boundary trap: ceil−1 at 1:1 gives the true 3');
  ok(naiveFloorCount(1, 1) !== velocityCount(1, 1), 'boundary trap: naive floor != true count at 1:1');
  // 3:1 → θ=π/6, π/θ=6. floor=6 (WRONG), ceil−1=5 (RIGHT).
  eq(naiveFloorCount(3, 1), 6, 'boundary trap: naive floor(π/θ) at 3:1 gives 6 (the wrong answer)');
  eq(closedCount(3, 1), 5, 'boundary trap: ceil−1 at 3:1 gives the true 5');
  ok(naiveFloorCount(3, 1) !== velocityCount(3, 1), 'boundary trap: naive floor != true count at 3:1');
  // and ceil−1 agrees with the simulator at both
  eq(closedCount(1, 1), eventCount(1, 1), 'boundary trap: ceil−1 == event count at 1:1');
  eq(closedCount(3, 1), eventCount(3, 1), 'boundary trap: ceil−1 == event count at 3:1');
})();

// ── elastic update sanity: a single block-block step conserves P and KE ───────
(function () {
  const M = 137, m = 1, vH = 1.3, vL = -0.4;
  const [nH, nL] = elasticBlockBlock(M, m, vH, vL);
  const Pb = M * vH + m * vL, Pa = M * nH + m * nL;
  const Eb = 0.5 * M * vH * vH + 0.5 * m * vL * vL, Ea = 0.5 * M * nH * nH + 0.5 * m * nL * nL;
  ok(Math.abs(Pa - Pb) < 1e-9, 'elastic update conserves momentum (single step)');
  ok(Math.abs(Ea - Eb) / Eb < 1e-12, 'elastic update conserves KE (single step)');
})();

// ── report ────────────────────────────────────────────────────────────────────
console.log(`\nThe Clack Counter — core self-test: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('GREEN: closed == velocity == event == {3,31,314,3141}; off-family agrees; ' +
    'KE conserved at every event, momentum at every block-block event; ' +
    'neg-controls reject; the floor-vs-ceil boundary trap is pinned (1:1→3, 3:1→5).');
}
process.exit(fail === 0 ? 0 : 1);
