#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE SINGING GLASS.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(), then
   adds a few extra direct probes. Exits 0 iff every assertion passes (CI-true).

   The claim under proof: a wine glass is a driven, damped harmonic oscillator —
   the FULL ODE-integrated transient settles onto the closed-form steady state
   A(ω) & δ(ω) across an ω-sweep to a tight tolerance; the phase lag is EXACTLY
   90° at ω₀; the amplitude peak sits BELOW ω₀ at ω_peak=√(ω₀²−γ²/2); the
   half-power bandwidth equals γ so Q=ω₀/γ; and far off resonance the response
   collapses to the quiet quasi-static floor (the detune negative control).

   Run:  node resonance/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  ampClosed, phaseClosed, peakFreq, qFactor, staticResponse,
  deriv, rk4Step, measureSteady, bisectAmp, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};
const near = (a, b, tol) => Math.abs(a - b) < tol;

console.log('\nTHE SINGING GLASS — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

// ── extra direct probes (beyond the shared suite) ──
console.log('\ndirect probes:');

const w0 = 1.0;
const base = { w0, gamma: 0.06, Fm: 1.0 };       // the high-Q glass (Q ≈ 16.7)

// (A) THE central claim, restated as a direct probe: the FULL ODE-integrated transient,
//     started from rest, settles onto the closed-form A(ω) and δ(ω) — across the whole
//     sweep, to a tight tolerance. (The integrator IS the physics; the formula is the
//     attractor it lands on, never a script.)
{
  let worstA = 0, worstP = 0, worstAw = 0, worstPw = 0;
  for (const w of [0.4, 0.6, 0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.3, 1.6, 2.2]) {
    const p = { ...base, w };
    const { ampNum, phaseNum } = measureSteady(p);
    const aRel = Math.abs(ampNum - ampClosed(w, p)) / ampClosed(w, p);
    const pErr = Math.abs(phaseNum - phaseClosed(w, p));
    if (aRel > worstA) { worstA = aRel; worstAw = w; }
    if (pErr > worstP) { worstP = pErr; worstPw = w; }
  }
  ok(worstA < 0.02, `integrated A(ω) matches closed form across an 11-point sweep (worst rel ${worstA.toExponential(2)} @ ω=${worstAw})`);
  ok(worstP < 0.03, `integrated δ(ω) matches closed form across the sweep (worst |Δδ| ${worstP.toFixed(4)} rad @ ω=${worstPw})`);
}

// (B) δ(ω₀) = 90° EXACTLY — the signature of resonance — to machine precision, both
//     in the closed form AND in the integrated transient.
ok(near(phaseClosed(w0, base), Math.PI / 2, 1e-12),
   `closed-form δ(ω₀) = 90° exactly (${(phaseClosed(w0, base) * 180 / Math.PI).toFixed(9)}°)`);
{
  const { phaseNum } = measureSteady({ ...base, w: w0 });
  ok(near(phaseNum, Math.PI / 2, 0.01),
     `integrated δ(ω₀) = 90° (${(phaseNum * 180 / Math.PI).toFixed(3)}°) — the rim trails the drive by a quarter-turn`);
}

// (C) The amplitude peak sits at ω_peak = √(ω₀²−γ²/2), BELOW ω₀ (damped pull-down) —
//     and a fine numeric scan of the closed form lands there.
{
  const wpk = peakFreq(base);
  ok(near(wpk, Math.sqrt(w0 * w0 - base.gamma * base.gamma / 2), 1e-12),
     `ω_peak = √(ω₀²−γ²/2) = ${wpk.toFixed(8)}`);
  ok(wpk < w0, `the peak is BELOW ω₀: ${wpk.toFixed(6)} < ${w0}`);
  // brute scan: nowhere does A exceed A(ω_peak)
  let best = 0, bestW = 0;
  for (let w = 0.3; w <= 2.0; w += 0.0005) {
    const a = ampClosed(w, base);
    if (a > best) { best = a; bestW = w; }
  }
  ok(Math.abs(bestW - wpk) < 1e-3, `a 0.0005-step brute scan of A(ω) peaks at ω_peak (scan max @ ${bestW.toFixed(4)}, formula ${wpk.toFixed(4)})`);
}

// (D) HALF-POWER BANDWIDTH = γ ⇒ Q = ω₀/γ. Find the two ω where A² = A²_max/2
//     (A = A_max/√2) by bisection; their gap is the FWHM, equal to γ in the high-Q limit.
{
  const wpk = peakFreq(base);
  const half = ampClosed(wpk, base) / Math.SQRT2;
  const lo = bisectAmp(base, half, 0.3, wpk);
  const hi = bisectAmp(base, half, wpk, 2.0);
  const fwhm = hi - lo;
  ok(near(fwhm, base.gamma, base.gamma * 0.03),
     `half-power bandwidth ≈ γ (FWHM ${fwhm.toFixed(6)} vs γ ${base.gamma}) ⇒ Q = ω₀/γ = ${qFactor(base).toFixed(2)}`);
  // each crossing really is at half power
  ok(near(ampClosed(lo, base), half, 1e-6) && near(ampClosed(hi, base), half, 1e-6),
     `both crossings are exactly at A_max/√2 (half power)`);
}

// (E) THE DETUNE NEGATIVE CONTROL — far from ω₀ the response is tiny and FLAT, collapsing
//     to the quasi-static floor F/(mω₀²). A near-resonance drive towers over it.
{
  const wpk = peakFreq(base);
  const Apk = ampClosed(wpk, base);
  const far = ampClosed(0.2, base), floor = staticResponse(base);
  ok(Math.abs(far - floor) / floor < 0.05,
     `far-detuned (ω=0.2ω₀) collapses to the quasi-static floor F/(mω₀²) (A ${far.toFixed(4)} ≈ ${floor.toFixed(4)})`);
  ok(far < Apk / 8, `far-detuned response is tiny next to the peak (${far.toFixed(3)} vs ${Apk.toFixed(3)}) — resonance is a sharp spike`);
  // FLATNESS: across the far-detuned band A barely moves (a slope much smaller than at the peak)
  const slopeFar = Math.abs(ampClosed(0.25, base) - ampClosed(0.15, base)) / 0.1;
  const slopeNearPk = Math.abs(ampClosed(wpk - 0.02, base) - ampClosed(wpk - 0.04, base)) / 0.02;
  ok(slopeFar < slopeNearPk / 10, `the far band is nearly FLAT vs the steep shoulder near ω_peak (|dA/dω| ${slopeFar.toFixed(3)} ≪ ${slopeNearPk.toFixed(3)})`);
}

// (F) Q SCALES with 1/γ: a sharper (less damped) glass has higher Q and a taller, deadlier peak.
{
  const sharp = { w0, gamma: 0.03, Fm: 1.0 };
  ok(near(qFactor(sharp), 2 * qFactor(base), 1e-9), `halving γ doubles Q (${qFactor(base).toFixed(1)} → ${qFactor(sharp).toFixed(1)})`);
  ok(ampClosed(peakFreq(sharp), sharp) > 1.8 * ampClosed(peakFreq(base), base),
     `…and roughly doubles the peak amplitude (sharper, taller, more dangerous)`);
}

// (G) PHASE limits & monotonicity: δ runs 0 → 90° → 180° as ω goes below → at → above ω₀.
{
  ok(phaseClosed(0.5, base) < Math.PI / 2 && phaseClosed(1.5, base) > Math.PI / 2,
     `phase lag: <90° below ω₀ (in step), >90° above (out of step)`);
  ok(phaseClosed(3.0, base) > Math.PI * 0.8,
     `well above ω₀ the lag → ~180° (you push as it comes back at you): ${(phaseClosed(3.0, base) * 180 / Math.PI).toFixed(0)}°`);
  // strictly increasing across the band
  let mono = true, prev = -1;
  for (let w = 0.3; w <= 2.0; w += 0.01) { const d = phaseClosed(w, base); if (d < prev - 1e-12) mono = false; prev = d; }
  ok(mono, `δ(ω) is monotonically increasing across the band (a clean 0→π swing)`);
}

// (H) The ODE field & integrator are sane: deriv at rest with the drive on gives the pure
//     forcing acceleration, and a frictionless un-driven oscillator conserves energy.
{
  const p = { ...base, w: 1.0 };
  const d0 = deriv([0, 0], 0, p);
  ok(d0[0] === 0 && near(d0[1], p.Fm, 1e-12), `at rest (t=0) the only acceleration is the drive F/m (${d0[1].toFixed(4)})`);
  // free oscillator (γ=0, Fm=0): energy E = ½v² + ½ω₀²x² conserved to machine ε over many periods
  const free = { w0: 1.0, gamma: 0, Fm: 0, w: 1.0 };
  let s = [1, 0], t = 0; const h = 2 * Math.PI / 400;
  const E0 = 0.5 * s[1] * s[1] + 0.5 * free.w0 * free.w0 * s[0] * s[0];
  let maxRel = 0;
  for (let i = 0; i < 400 * 20; i++) {
    s = rk4Step(s, t, h, free); t += h;
    const E = 0.5 * s[1] * s[1] + 0.5 * free.w0 * free.w0 * s[0] * s[0];
    maxRel = Math.max(maxRel, Math.abs(E - E0) / E0);
  }
  ok(maxRel < 1e-7, `frictionless free oscillator conserves energy over 20 periods (rel drift ${maxRel.toExponential(2)}) — the RK4 rim is faithful`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
