#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE TRADING BENCH.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(),
   then adds a few extra direct probes. Exits 0 iff every assertion passes.

   The claim under proof: two identical small-angle pendulums joined by a coupling
   spring are a pair of COUPLED OSCILLATORS. In normal coordinates s=θ₁+θ₂ (ω₁) and
   d=θ₁−θ₂ (ω₂=√(ω₁²+2K)) the system decouples into two independent SHM modes; the
   live closed-form sum reconstructs a direct RK4 integration of the coupled ODE to
   <1e-9 over a full beat; energy POURS fully from the pulled bob to its twin and
   back, the launched bob's slow envelope hitting 0 and the twin's hitting A at
   t=T_beat/2; total energy and each mode's energy are separately conserved; and as
   K→0 the beat period →∞ while the two PURE modes never trade at all (the neg-
   controls). Small-angle linear frame — the trade is exact in that regime.

   Run:  node the-trading-bench/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  modeFreqs, beatPeriod, closedForm, closedFormVel, envelopes,
  modeEnergies, totalEnergy, modeEnergyAmplitudes, perBobEnergy,
  deriv, rk4Step, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};
const near = (a, b, tol) => Math.abs(a - b) < tol;

console.log('\nTHE TRADING BENCH — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

// ── extra direct probes (beyond the shared suite) ──
console.log('\ndirect probes:');

const g = 9.81, L = 0.6, K = 0.9, A = 0.25;
const launch = { g, L, K, th1_0: A, th2_0: 0, v1_0: 0, v2_0: 0 };
const { w1, w2 } = modeFreqs(launch);
const Tbeat = beatPeriod(launch);

// (A) MODE FREQUENCIES: ω₁=√(g/L) (symmetric, spring slack), ω₂=√(g/L+2K) (stiffer).
ok(near(w1, Math.sqrt(g / L), 1e-12), `ω₁ = √(g/L) = ${w1.toFixed(6)} (the symmetric mode never stretches the spring)`);
ok(near(w2, Math.sqrt(g / L + 2 * K), 1e-12), `ω₂ = √(g/L+2K) = ${w2.toFixed(6)} (the antisymmetric mode feels the spring → stiffer)`);
ok(w2 > w1, `ω₂ > ω₁ — the coupling raises only the antisymmetric mode; the two carriers beat`);

// (B) BEAT PERIOD: T_beat = 2π/(ω₂−ω₁); the design's watchable ~29s at K=0.9.
ok(near(Tbeat, 2 * Math.PI / (w2 - w1), 1e-12), `T_beat = 2π/(ω₂−ω₁) = ${Tbeat.toFixed(2)} s`);

// (C) PARITY (restated, finer): the closed form reconstructs a direct RK4 of the
//     coupled ODE to machine-class precision across a full beat — the live page
//     ships the closed form (no drift), the integrator is its independent oracle.
{
  let s = [launch.th1_0, launch.th2_0, launch.v1_0, launch.v2_0];
  const steps = 40000, h = Tbeat / steps;
  let worst = 0, t = 0;
  for (let i = 0; i < steps; i++) {
    s = rk4Step(s, h, launch); t += h;
    const [c1, c2] = closedForm(t, launch);
    worst = Math.max(worst, Math.abs(s[0] - c1), Math.abs(s[1] - c2));
  }
  ok(worst < 1e-9, `40k-step RK4 of the coupled ODE matches the closed form over a full beat (worst |Δθ| ${worst.toExponential(2)})`);
  // and the closed-form VELOCITY matches a finite difference of the closed-form angle
  const dt = 1e-6, tm = Tbeat * 0.31;
  const [a0] = closedForm(tm, launch), [a1] = closedForm(tm + dt, launch);
  const [vca] = closedFormVel(tm, launch);
  ok(near((a1 - a0) / dt, vca, 1e-4), `closedFormVel matches d(closedForm)/dt (analytic velocity is consistent)`);
}

// (D) FULL TRADE — the launched bob empties, the twin brims, at exactly T_beat/2;
//     and at T_beat the energy has returned fully home (one full round trip).
{
  const env0 = envelopes(0, launch);
  ok(near(env0.envLaunched, A, 1e-12) && near(env0.envTwin, 0, 1e-12), `at t=0 the launched bob holds all the swing (env ${env0.envLaunched.toFixed(3)}), the twin none`);
  const half = envelopes(Tbeat / 2, launch);
  ok(near(half.envLaunched, 0, 1e-9) && near(half.envTwin, A, 1e-9), `at T_beat/2 the swing is FULLY across (launched ${half.envLaunched.toExponential(2)} → twin ${half.envTwin.toFixed(4)})`);
  const full = envelopes(Tbeat, launch);
  ok(near(full.envLaunched, A, 1e-9) && near(full.envTwin, 0, 1e-9), `at T_beat the swing has returned all the way home (launched ${full.envLaunched.toFixed(4)}, twin ${full.envTwin.toExponential(2)})`);
}

// (E) THE PER-BOB VIALS track the slow energy and SUM to the conserved total at
//     every instant — left drains exactly as right fills. Also: the per-bob energy
//     envelope tracks env² (energy ∝ amplitude²).
{
  const E0 = totalEnergy(0, launch);
  let worstSum = 0;
  for (let i = 0; i <= 1000; i++) {
    const t = (i / 1000) * Tbeat;
    const { e1, e2 } = perBobEnergy(t, launch);
    worstSum = Math.max(worstSum, Math.abs((e1 + e2) - E0) / E0);
  }
  ok(worstSum < 1e-12, `the two vials sum to the conserved total at all times (worst rel ${worstSum.toExponential(2)})`);
  // at T_beat/2 vial 1 ≈ 0 and vial 2 ≈ E0 (the full pour, in energy)
  const { e1, e2 } = perBobEnergy(Tbeat / 2, launch);
  ok(e1 / E0 < 0.02 && near(e2 / E0, 1, 0.02), `at T_beat/2 vial 1 ≈ empty (${(e1 / E0 * 100).toFixed(1)}%), vial 2 ≈ full (${(e2 / E0 * 100).toFixed(1)}%)`);
}

// (F) CONSERVATION — total + each mode separately, across MANY beats (drift-free
//     because the live ship is the closed form, not a stepper).
{
  const E0 = totalEnergy(0, launch);
  const m0 = modeEnergies(0, launch);
  let wt = 0, ws = 0, wd = 0;
  for (let i = 0; i <= 5000; i++) {
    const t = (i / 5000) * 6 * Tbeat;           // six full beats
    wt = Math.max(wt, Math.abs(totalEnergy(t, launch) - E0) / E0);
    const m = modeEnergies(t, launch);
    ws = Math.max(ws, Math.abs(m.Es - m0.Es) / Math.max(1e-12, m0.Es));
    wd = Math.max(wd, Math.abs(m.Ed - m0.Ed) / Math.max(1e-12, m0.Ed));
  }
  ok(wt < 1e-12, `total energy conserved over SIX beats (rel drift ${wt.toExponential(2)})`);
  ok(ws < 1e-12 && wd < 1e-12, `E_s, E_d each conserved over six beats — two independent energy boxes (worst ${Math.max(ws, wd).toExponential(2)})`);
}

// (G) MODE MIX — the single-bob launch is exactly ½(symmetric)+½(antisymmetric):
//     s₀=d₀=A so the launch energy splits with E_s/E_d ratio = ω₁²/ω₂² (each mode
//     carries ¼ω²A²). The "mode mix" line on the page reads off this split.
{
  const amps = modeEnergyAmplitudes(launch);
  const ratio = amps.Es / amps.Ed;
  ok(near(ratio, (w1 * w1) / (w2 * w2), 1e-12), `launch splits ½/½ in COORDINATE (s₀=d₀=A); in ENERGY the ratio is ω₁²/ω₂² = ${ratio.toFixed(4)}`);
  // both modes carry real, positive energy (the spring is genuinely loaded at launch)
  ok(amps.Es > 0 && amps.Ed > 0, `both normal modes carry energy at launch — the pull loads the coupling spring, not just bob 1`);
}

// (H) NEG-CONTROLS (restated as direct probes):
{
  // K→0 : T_beat blows up
  ok(beatPeriod({ g, L, K: 0.9 }) < beatPeriod({ g, L, K: 0.09 }), `weaker K ⇒ longer beat (lazier trade)`);
  ok(!isFinite(beatPeriod({ g, L, K: 0 })), `K=0 ⇒ T_beat = ∞ (the latch: no coupling, no trade — each vial holds forever)`);
  // SYMMETRIC pure mode never trades
  const sym = { g, L, K, th1_0: A, th2_0: A, v1_0: 0, v2_0: 0 };
  let md = 0;
  for (let i = 0; i <= 800; i++) { const [a, b] = closedForm((i / 800) * 3 * Tbeat, sym); md = Math.max(md, Math.abs(a - b)); }
  ok(md < 1e-12, `SYMMETRIC release: max|θ₁−θ₂| = ${md.toExponential(2)} over 3 beats — spring never stretches, no trade`);
  // MIRRORED pure mode never trades
  const mir = { g, L, K, th1_0: A, th2_0: -A, v1_0: 0, v2_0: 0 };
  let ms = 0;
  for (let i = 0; i <= 800; i++) { const [a, b] = closedForm((i / 800) * 3 * Tbeat, mir); ms = Math.max(ms, Math.abs(a + b)); }
  ok(ms < 1e-12, `MIRRORED release: max|θ₁+θ₂| = ${ms.toExponential(2)} over 3 beats — only ω₂ runs, no trade`);
}

// (I) THE ODE FIELD is sane: deriv at the pulled-aside rest state gives the right
//     restoring accelerations, and an UNCOUPLED pair (K=0) keeps each bob independent.
{
  const d0 = deriv([A, 0, 0, 0], launch);
  ok(d0[0] === 0 && d0[1] === 0, `deriv: at rest both angular velocities are 0`);
  // bob 1 pulled to A, bob 2 at 0: accel on 1 is restoring+spring, on 2 is spring only
  ok(near(d0[2], -(g / L) * A - K * A, 1e-12), `deriv: bob 1's accel = −(g/L)A − K·A (gravity + the loaded spring pulling it back)`);
  ok(near(d0[3], K * A, 1e-12), `deriv: bob 2's accel = +K·A (the spring tugs the silent twin toward bob 1)`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
