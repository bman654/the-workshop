/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for The Cartesian Diver.

   This is a CLAIM-FREE delight piece: it prints no number and proves no theorem.
   What it OWES is a payoff-liveness twin — that the toy's payoffs actually FIRE.
   It drives the SAME core.mjs the page renders from (the render inlines it
   byte-for-byte via forge), so the page and this twin can never disagree.

   Run:  node core.test.mjs      (exit 0 = every payoff fires)
   ════════════════════════════════════════════════════════════════════════════ */
import {
  makeDiver, step, airVolume, pressure, interiorEquilibrium,
  equilibriumPressure, trembleAmp, runLiveness, breathStep, STILL_Y, P0, H, SQ_GAIN
} from './core.mjs';

let passed = 0, failed = 0;
const ok  = (name, cond, extra='') => { (cond ? passed++ : failed++);
  console.log(`  ${cond ? '✓' : '✗ FAIL'}  ${name}${extra ? '   ' + extra : ''}`); };

console.log('\nThe Cartesian Diver — payoff-liveness twin\n');

/* ── the bundled suite the page also runs (window.__diverLiveness) ── */
const L = runLiveness();
console.log('bundled liveness suite (shared with the page):');
ok('SQUEEZE SINKS — a firm squeeze runs him to the floor', L.squeezeSinks, `y→${L._sinkY.toFixed(3)}`);
ok('RELEASE RISES — letting go floats him to the neck',    L.releaseRises, `y→${L._riseY.toFixed(3)}`);
ok('BUBBLE SHRINKS — Boyle compresses the belly pocket',   L.bubbleShrinks, `ratio ${L._shrink.toFixed(2)}`);
ok('REFUSES TO HOLD — neutral repels either way',          L.refusesToHold, `up→${L._up.toFixed(3)} dn→${L._dn.toFixed(3)} (y0 ${L._y0})`);
ok('HOLD DECAYS — a driven hold at neutral runs away',     L.holdDecays, `drift ${L._drift.toFixed(3)}`);
ok('SESSION RESUMES — a restored depth stays put',         L.sessionResumes, `y→${L._resumeY.toFixed(3)}`);
ok('HELD BREATH — swells in the still band, releases outside', L.breathAccrues, `in→${L._cin.toFixed(2)} out→${L._cout.toFixed(2)}`);

/* ── extra structural checks on the mechanism ── */
console.log('\nmechanism sanity:');

// at rest he floats: net acceleration at the neck (sq=0, y=0) is upward.
{
  const d = makeDiver();
  const r = step(d, 0, 1e-6);          // tiny tick just to read net
  ok('at rest he floats (net accel is upward at the neck)', r.net < 0, `net ${r.net.toFixed(3)}`);
}

// pressure rises with BOTH squeeze and depth (the two ways the bubble shrinks).
{
  const d = makeDiver();
  ok('pressure rises with squeeze', pressure(d, 0.8, 0) > pressure(d, 0.0, 0));
  ok('pressure rises with depth',   pressure(d, 0.0, 0.9) > pressure(d, 0.0, 0.0));
}

// the render's still-line squeeze really balances mid-bottle (net ≈ 0 there).
{
  const d = makeDiver();
  const { y0, sqHold } = interiorEquilibrium(d, 0.5);
  d.y = y0;
  const r = step(d, sqHold, 1e-6);
  ok('still-line squeeze balances the marked depth (net ≈ 0)', Math.abs(r.net) < 1e-3, `net ${r.net.toExponential(2)}`);
}

// the honest tremble is large at neutral, small when firmly moving.
{
  const near = trembleAmp(0.0);
  const far  = trembleAmp(2.0);
  ok('tremble blows up at neutral, glassy when firm', near > 0.9 && far < 0.1, `neutral ${near.toFixed(2)} firm ${far.toFixed(2)}`);
}

// a stronger squeeze always shrinks the pocket further (monotone Boyle).
{
  const d = makeDiver();
  let mono = true, prev = airVolume(d, 0);
  for (let s = 0.1; s <= 1.0; s += 0.1){ const a = airVolume(d, s); if (a >= prev) mono = false; prev = a; }
  ok('bubble shrinks monotonically with squeeze', mono);
}

console.log(`\n${failed === 0 ? '✅ ALL PAYOFFS FIRE' : '❌ ' + failed + ' FAILED'} — ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
