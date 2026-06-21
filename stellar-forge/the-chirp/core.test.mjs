// Node twin for The Chirp. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the STRUCTURE of a radiation-reaction inspiral — two stars fall on their own by bleeding
// orbital energy into gravitational waves, the chirp rising as a^(−5)·(t_c−t)^(−3/8), governed by
// M_c alone — not a single tuned number. Independent of the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all 5 green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · the per-step energy balance cross-checked by a GENUINELY SEPARATE RK4 integrator of
//           dadt (vs the analytic aOfTime trajectory) — same a(t) to integrator tolerance,
//         · the −3/8 log-log slope of f vs (t_c − t),
//         · the M_c^(5/3) frequency-law consequence via dfGWdt,
//         · the swap (2a) and same-M_c (2b) invariances re-derived from scratch,
//         · the fGW === 2·fOrbital identity (the wave is twice the orbit),
//         · the closed-form aOfTime endpoint a(t_c) === 0 exactly,
//         · the domain guards: reqMass / reqSep RangeError, aOfTime(t≥t_c) === 0;
//   (c) the TWO neg-controls assert DISAGREEMENT explicitly (frozen Δf===0 & real Δf<0; wrong-exp
//       t_c ≠ correct t_c by >1e-3);
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  totalMass, reducedMass, chirpMass,
  eOrbit, omega, fOrbital, fGW, powerGW, dadt,
  tCoalesce, aOfTime, aMerge,
  dfGWdt, fGWofTime, fGWofTauRemaining,
  inspiralTrack, chirpFTrack, frozenTrack, tCoalesceWrongExp,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// SEPARATE RK4 INTEGRATOR of da/dt = −(64/5)μM²/a³, cross-checking the analytic aOfTime trajectory.
// This is a genuinely different numerical route (no aOfTime, no closed form) to a(t); it must track
// the analytic closed form to RK4 tolerance over the inspiral. If they agreed by construction the
// check would be vacuous — here the analytic path is closed-form and this path is a 4th-order ODE solve.
{
  const m1 = 30, m2 = 30, a0 = 12;
  const tc = tCoalesce(m1, m2, a0);
  const aM = aMerge(m1, m2);
  const tStop = tc * (1 - Math.pow(aM / a0, 4));
  const f = (a) => dadt(m1, m2, a);
  const N = 20000, h = tStop / N;
  let a = a0, maxRel = 0;
  for (let i = 0; i < N; i++){
    const t = i * h;
    if (a <= aM) break;
    // RK4 step on da/dt
    const k1 = f(a);
    const k2 = f(Math.max(a + 0.5 * h * k1, aM));
    const k3 = f(Math.max(a + 0.5 * h * k2, aM));
    const k4 = f(Math.max(a + h * k3, aM));
    a = a + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const aAnalytic = aOfTime(m1, m2, a0, t + h);
    if (aAnalytic > aM) maxRel = Math.max(maxRel, Math.abs(a - aAnalytic) / aAnalytic);
  }
  ck('RK4 of dadt tracks analytic aOfTime over the inspiral (independent ODE solve, rel<1e-5)  [maxRel=' + maxRel.toExponential(2) + ']',
     maxRel < 1e-5);
}

// PER-STEP ENERGY BALANCE re-derived directly (radiated === orbitLost), independent of runSelfTest.
{
  const tk = inspiralTrack(25, 40, 13, { steps: 1000 });
  let maxBal = 0;
  for (const r of tk.rows) maxBal = Math.max(maxBal, Math.abs(r.radiated - r.orbitLost));
  ck('per-step balance: |radiated − orbitLost| < 1e-9 every step (re-derived)  [max=' + maxBal.toExponential(2) + ']',
     maxBal < 1e-9);
}

// −3/8 LOG-LOG SLOPE of f vs (t_c − t), re-derived at independent sample points.
{
  const m1 = 18, m2 = 47, a0 = 16;
  const tc = tCoalesce(m1, m2, a0);
  const slope = (t1, t2) => (Math.log(fGWofTime(m1, m2, a0, t1)) - Math.log(fGWofTime(m1, m2, a0, t2)))
                          / (Math.log(tc - t1) - Math.log(tc - t2));
  const s = slope(tc * 0.1, tc * 0.7);
  ck('f ∝ (t_c−t)^(−3/8): log-log slope === −0.375 to <1e-6 (re-derived)  [slope=' + s.toFixed(9) + ']',
     Math.abs(s + 0.375) < 1e-6);
}

// M_c^(5/3) FREQUENCY-LAW via dfGWdt. The chirp obeys ḟ ∝ f^(11/3)·M_c^(5/3) (the detector's
// M_c-meter). We check the M_c-scaling: at a FIXED gravitational-wave frequency f*, the sweep rate
// ḟ scales as M_c^(5/3) across two different M_c values. Solve a/a0/t so both binaries sit at f*.
{
  // Two binaries, same f* (choose a so fGW(a)=f*). ḟ at f* should scale as M_c^(5/3).
  const fStar = 0.02;
  function sweepAtFStar(m1, m2){
    const M = totalMass(m1, m2);
    // a from fGW: f = (1/π)√(M/a³) ⇒ a = (M/(π f)²)^(1/3)
    const a = Math.cbrt(M / ((Math.PI * fStar) * (Math.PI * fStar)));
    const a0 = a * 1.5;                          // any a0 > a; ḟ depends only on the local state
    const t = tCoalesce(m1, m2, a0) * (1 - Math.pow(a / a0, 4));
    return dfGWdt(m1, m2, a0, t);
  }
  const A = { m1: 30, m2: 30 }, B = { m1: 12, m2: 12 };
  const sA = sweepAtFStar(A.m1, A.m2), sB = sweepAtFStar(B.m1, B.m2);
  const McA = chirpMass(A.m1, A.m2), McB = chirpMass(B.m1, B.m2);
  const ratioMeasured = sA / sB;
  const ratioPredicted = Math.pow(McA / McB, 5 / 3);
  ck('ḟ at fixed f* scales as M_c^(5/3) (the detector\'s M_c-meter)  [measured=' + ratioMeasured.toFixed(6) + ' predicted=' + ratioPredicted.toFixed(6) + ']',
     Math.abs(ratioMeasured - ratioPredicted) / ratioPredicted < 1e-9);
}

// SWAP INVARIANCE (2a) re-derived: the whole track byte-identical under m1↔m2.
{
  const A = inspiralTrack(17, 49, 15, { steps: 250 });
  const B = inspiralTrack(49, 17, 15, { steps: 250 });
  let same = A.rows.length === B.rows.length, maxD = 0;
  for (let i = 0; i < A.rows.length && same; i++)
    maxD = Math.max(maxD, Math.abs(A.rows[i].a - B.rows[i].a), Math.abs(A.rows[i].fGW - B.rows[i].fGW));
  ck('SWAP invariance re-derived: m1↔m2 ⇒ inspiralTrack byte-identical  [maxΔ=' + maxD.toExponential(2) + ']', same && maxD === 0);
}

// SAME-M_c INVARIANCE (2b) re-derived from scratch with a NEW partner pair, asserting the f-vs-τ
// track is identical WHILE the orbital geometry differs (the crux: hear-identical, geometry-differs).
{
  const Mc = chirpMass(20, 40);
  let lo = 1, hi = 400;                          // solve (28, m2) with the same M_c
  for (let i = 0; i < 200; i++){
    const mid = (lo + hi) / 2;
    const g = Math.pow(28 * mid, 3) / (28 + mid) - Math.pow(Mc, 5);
    if (g > 0) hi = mid; else lo = mid;
  }
  const m2b = (lo + hi) / 2;
  const fA = chirpFTrack(20, 40, { steps: 150, tauMax: 0.02 });
  const fB = chirpFTrack(28, m2b, { steps: 150, tauMax: 0.02 });
  let maxF = 0;
  for (let i = 0; i < fA.length; i++) maxF = Math.max(maxF, Math.abs(fA[i].fGW - fB[i].fGW) / fA[i].fGW);
  // geometry differs: at the SAME a0 the two pairs have different t_c (and different E_orbit).
  const geomDiffers = Math.abs(tCoalesce(20, 40, 12) - tCoalesce(28, m2b, 12)) > 1e-6
                   && Math.abs(eOrbit(20, 40, 10) - eOrbit(28, m2b, 10)) > 1e-6;
  ck('SAME-M_c invariance re-derived: f-vs-τ identical (rel<1e-9) WHILE geometry differs  [Mc=' + Mc.toFixed(4) + ' relΔf=' + maxF.toExponential(2) + ' geom≠:' + geomDiffers + ']',
     maxF < 1e-9 && geomDiffers);
}

// fGW === 2·fOrbital, the quadrupole doubling, over an (m,a) sweep.
{
  let maxD = 0;
  for (const m1 of [10, 30, 50]) for (const m2 of [12, 33, 48]) for (const a of [6, 11, 20, 35]){
    maxD = Math.max(maxD, Math.abs(fGW(m1, m2, a) - 2 * fOrbital(m1, m2, a)));
  }
  ck('fGW === 2·fOrbital exactly (the wave is twice the orbit)  [maxΔ=' + maxD.toExponential(2) + ']', maxD === 0);
}

// aOfTime endpoint: a(t_c) === 0 EXACTLY (the analytic merger, no integration error).
{
  let allZero = true;
  for (const [m1, m2, a0] of [[30, 30, 12], [10, 50, 18], [44, 19, 9]]){
    const tc = tCoalesce(m1, m2, a0);
    if (aOfTime(m1, m2, a0, tc) !== 0) allZero = false;
  }
  ck('aOfTime(t_c) === 0 exactly (the closed-form merger endpoint)', allZero);
}

// DOMAIN GUARDS — non-physical masses / separations / times throw RangeError; t≥t_c clamps to 0.
function throwsRange(fn){ try { fn(); return false; } catch (e){ return e instanceof RangeError; } }
ck('domain guard: chirpMass(0, 30) throws RangeError (mass > 0)', throwsRange(() => chirpMass(0, 30)));
ck('domain guard: chirpMass(30, -1) throws RangeError', throwsRange(() => chirpMass(30, -1)));
ck('domain guard: omega(30, 30, 0) throws RangeError (separation > 0)', throwsRange(() => omega(30, 30, 0)));
ck('domain guard: powerGW(30, 30, -5) throws RangeError', throwsRange(() => powerGW(30, 30, -5)));
ck('domain guard: tCoalesce(30, 30, NaN) throws RangeError', throwsRange(() => tCoalesce(30, 30, NaN)));
ck('domain guard: aOfTime(30, 30, 12, −1) throws RangeError (t ≥ 0)', throwsRange(() => aOfTime(30, 30, 12, -1)));
ck('domain edge: aOfTime(30,30,12, t≥t_c) === 0 (clamped, no negative root)',
   aOfTime(30, 30, 12, tCoalesce(30, 30, 12) * 2) === 0);

// ── (c) the TWO neg-controls assert DISAGREEMENT explicitly ──
{
  // FROZEN: Δf === 0 over the whole track; the REAL inspiral's Δf < 0 (pitch rises as a shrinks → f up,
  // but a falls so over the track fGW INCREASES; "Δf<0" here means the frozen vs real disagree: frozen
  // holds f flat, real sweeps f up). We assert frozen has zero sweep while the real track sweeps up.
  const fr = frozenTrack(30, 30, 12, { steps: 300 });
  let frozenFlat = true;
  for (let i = 1; i < fr.rows.length; i++) if (fr.rows[i].fGW !== fr.rows[0].fGW) frozenFlat = false;
  const real = inspiralTrack(30, 30, 12, { steps: 300 });
  const realRises = real.rows[real.rows.length - 1].fGW > real.rows[0].fGW;
  ck('NEG-CONTROL frozen: Δf === 0 (eternal circle) while the real inspiral fGW RISES — they DISAGREE',
     frozenFlat && realRises && !Number.isFinite(fr.tc));
}
{
  // WRONG-EXP: t_c with a0³ ≠ t_c with a0⁴ by > 1e-3.
  const right = tCoalesce(30, 30, 12);
  const wrong3 = tCoalesceWrongExp(30, 30, 12, 3);
  const wrong5 = tCoalesceWrongExp(30, 30, 12, 5);
  ck('NEG-CONTROL wrong-exp: t_c(a0³) and t_c(a0⁵) both disagree with t_c(a0⁴) by >1e-3',
     Math.abs(right - wrong3) > 1e-3 && Math.abs(right - wrong5) > 1e-3);
}

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== THE-CHIRP CORE (byte-identical to core.mjs) =====';
const END = '// ===== END THE-CHIRP CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: THE-CHIRP CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: THE-CHIRP CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Chirp — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
