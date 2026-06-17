#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE CONTRARY STONE.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(), then
   adds a few extra direct probes. Exits 0 iff every assertion passes (CI-true).

   The claim under proof: a rattleback's wrong-way spin REVERSES and SETTLES into the
   single favored spin sense — emergent from the integrator, never scripted — while a
   diagonal-tensor control spins happily both ways and energy is conserved to machine ε.

   Run:  node rattleback/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  deriv, energy, energySplit, rk4Step, integrate,
  epsOfSkew, epsOfSkewDeg, favoredSign, K_SKEW, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};

console.log('\nTHE CONTRARY STONE — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

// ── extra direct probes (beyond the shared suite) ──
console.log('\ndirect probes:');

const h = 0.003, N = 240000, w0 = 1.0;
const seedV = s => [s * w0, 0, 0, 0.08, 0];

// epsOfSkew: zero at 0, sign-flipping, peaks near 45°, odd in δ.
ok(epsOfSkew(0) === 0, 'epsOfSkew(0) === 0 exactly (diagonal tensor)');
ok(epsOfSkewDeg(20) > 0 && epsOfSkewDeg(-20) < 0, 'eps sign follows the sign of δ');
ok(Math.abs(epsOfSkewDeg(20) + epsOfSkewDeg(-20)) < 1e-15, 'eps is ODD in δ (ε(-δ) = -ε(δ))');
ok(Math.abs(epsOfSkewDeg(45) - K_SKEW) < 1e-12, 'eps peaks at δ=45° to K_SKEW');
ok(favoredSign(0) === 0, 'favoredSign(0) === 0 (diagonal has no preference)');

// THE central claim, restated as a direct probe: for a strong favored skew, BOTH
// launches END at the favored sign — and we integrate long past the reversal so a
// transient slosh that re-crossed would be caught (guards C's "crossed once" trap).
const eps = epsOfSkewDeg(25);
const FAV = favoredSign(eps);            // +1
const P = { eps, wp: 1.0, wq: 1.7, mu: 0.02 };
const favEnd = integrate(seedV(+1), h, N, P).v;
const wrongEnd = integrate(seedV(-1), h, N, P).v;
ok(Math.sign(favEnd[0]) === FAV, `favored launch FINAL sign = favored (${favEnd[0].toFixed(4)})`);
ok(Math.sign(wrongEnd[0]) === FAV, `wrong launch FINAL sign = favored, i.e. it REVERSED (${wrongEnd[0].toFixed(4)})`);

// the reversal must be a MONOTONE settle, not a flicker: sample the wrong-way run and
// confirm n crosses zero exactly once and then never returns negative.
{
  let v = seedV(-1), crossings = 0, prev = v[0], reCrossed = false, everPos = false;
  for (let i = 0; i < N; i++) {
    v = rk4Step(v, h, P);
    if (Math.sign(v[0]) !== Math.sign(prev) && v[0] !== 0) crossings++;
    if (v[0] > 0.02) everPos = true;
    if (everPos && v[0] < -0.02) reCrossed = true;
    prev = v[0];
  }
  ok(crossings === 1, `wrong-way spin crosses zero EXACTLY once (got ${crossings})`);
  ok(!reCrossed, 'after reversing the spin never swings back negative (settled, not sloshing)');
}

// energy is conserved on the (frictionless) reversing run to machine ε — the reversal
// is genuine SPIN→ROCK→SPIN transfer, not numerical injection.
{
  const Pf = { eps, wp: 1.0, wq: 1.7, mu: 0 };
  const run = integrate(seedV(-1), h, N, Pf);
  const rel = run.maxDrift / run.E0;
  ok(rel < 1e-9, `frictionless reversing run conserves energy (rel drift ${rel.toExponential(2)})`);
  // and the transfer is REAL: at the reversal the rock energy must have BULGED above
  // the spin's start, then drained back — sample the worst rock fraction.
  let v = seedV(-1), maxRock = 0;
  for (let i = 0; i < N; i++) { v = rk4Step(v, h, Pf); const es = energySplit(v, Pf); maxRock = Math.max(maxRock, es.rock); }
  ok(maxRock > 0.5, `rock energy genuinely bulged mid-reversal (peak rock ${maxRock.toFixed(3)} of E0 ${run.E0.toFixed(3)})`);
}

// dn ≥ 0 for ε>0 (the spin is only ever DRIVEN UP toward favored, never down past it).
{
  const samples = [[-0.4, 0.3, -0.2], [0.4, 0.1, 0.5], [-0.9, 0.05, 0.05]];
  let allNonNeg = true;
  for (const [n, A, B] of samples) { const d = deriv([n, A, B, 0, 0], { eps, wp: 1, wq: 1.7, mu: 0 }); if (d[0] < -1e-15) allNonNeg = false; }
  ok(allNonNeg, 'dn ≥ 0 for ε>0 (spin driven only toward the favored sense)');
}

// negative control restated directly: diagonal tensor keeps EACH launch's sign.
{
  const Pd = { eps: 0, wp: 1.0, wq: 1.7, mu: 0 };
  const up = integrate(seedV(+1), h, N, Pd).v, dn = integrate(seedV(-1), h, N, Pd).v;
  ok(Math.sign(up[0]) === +1 && Math.sign(dn[0]) === -1, 'diagonal tensor: both launches keep their own sign (no reversal)');
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
