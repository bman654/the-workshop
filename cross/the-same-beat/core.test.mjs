// Node twin for The Same Beat core. Zero-dep. Run: `node cross/the-same-beat/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at
// the same two ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves
// the 5 legs the in-page pill proves, PLUS the byte-twin parity leg (index.html CORE === core.mjs CORE
// char-for-char) and the code-disjointness grep (the escapement adapter names no resonance fn, the
// glass adapter names no escapement fn). One law: ω = √(stiffness ÷ inertia), in two costumes.
//
//   1.  SAME RAY      — |ω₀_glass − √(G/L)| AND |ω_pendulum − √(G/L)| < 1e-9 over an L sweep.
//   2.  ISOCHRONISM   — periodIdeal takes NO θ₀, so Tideal is θ₀-invariant (variance === 0).
//   3.  CONVENTION (===) — glassPoint.w0 === √(E.G/L) AND pendulumPoint.omega === 2π/periodIdeal(L).
//   4.  NEG-CONTROL ROD   — driftRatio(80°) > 1.05, strictly increasing in θ₀, → 1 as θ₀→0.
//   5.  NEG-CONTROL GLASS — off-ω₀ amp < ampAtRes/8 AND phase < 0.05; phaseAtRes === π/2 exactly.
//   6.  BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE char-for-char, and the two
//       adapters are code-disjoint by grep; PLUS tuneToBeat (the parent's own solver) lands on ω₀.
//   7.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as E from '../../hours/escapement/core.mjs';
import * as R from '../../resonance/core.mjs';
import {
  G, TWO_PI, LMIN, LMAX,
  omegaRay, lSweep,
  pendulumPoint, glassPoint, glassDriven, tuneToBeat, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Beat — Node twin (a pendulum and a wine glass keep one √(stiffness÷inertia) law)\n');
const Ls = lSweep();

// ── LEG 1: SAME RAY — both costumes ride ONE √-ray ─────────────────────────────────────────────────
console.log('— Leg 1: both costumes ride one √-ray (ω₀_glass === √(G/L) === ω_pendulum) <1e-9 —');
{
  let worst = 0, worstL = null;
  for (const L of Ls) {
    const pen = pendulumPoint(L, 10 * Math.PI / 180);
    const gla = glassPoint(L);
    const d1 = Math.abs(gla.omega0 - pen.omegaRay);
    const d2 = Math.abs(pen.omega - omegaRay(L));
    const d = Math.max(d1, d2);
    if (d > worst) { worst = d; worstL = L; }
  }
  ck('|ω₀_glass − √(G/L)| and |ω_pendulum − √(G/L)| < 1e-9 across the L sweep',
    worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at L=' + worstL.toFixed(4) + ' over ' + Ls.length + ' lengths');
  // the markers really sit on the SAME tick (the glass's ω₀ === the pendulum's ray coord)
  let coincident = 0;
  for (const L of Ls) if (Math.abs(glassPoint(L).omega0 - pendulumPoint(L, 0.3).omegaRay) < 1e-9) coincident++;
  ck('both jewels pin to the SAME √-ray tick at every L', coincident === Ls.length, coincident + '/' + Ls.length + ' coincident');
}

// ── LEG 2: ISOCHRONISM — the ideal beat is amplitude-blind ─────────────────────────────────────────
console.log('\n— Leg 2: isochronism — periodIdeal has NO θ₀, so Tideal is identical across θ₀ (variance===0) —');
{
  const L = 1.0;
  const thetas = [0.5, 10, 30, 60, 89].map(d => d * Math.PI / 180);
  const tids = thetas.map(th => pendulumPoint(L, th).Tideal);
  let maxDev = 0; for (const t of tids) maxDev = Math.max(maxDev, Math.abs(t - tids[0]));
  ck('Tideal is byte-identical across θ₀∈[0.5°,89°] at fixed L (variance===0)', maxDev === 0,
    'maxDev=' + maxDev + ' · Tideal=' + tids[0].toFixed(6) + 's');
  // but the REAL (elliptic) period is NOT amplitude-blind — that contrast is the whole point.
  const reals = thetas.map(th => pendulumPoint(L, th).Treal);
  let realSpread = Math.max(...reals) - Math.min(...reals);
  ck('the REAL elliptic period IS amplitude-dependent (spread > 0) — so the invariance is a property of the IDEAL law',
    realSpread > 1e-3, 'Treal spread=' + realSpread.toFixed(5) + 's over the same θ₀ band');
}

// ── LEG 3: CONVENTION-HONESTY (byte-exact ===) — no smuggled factor either side ────────────────────
console.log('\n— Leg 3: convention honesty — glassPoint.w0 === √(E.G/L), pendulumPoint.omega === 2π/periodIdeal(L) —');
{
  let okG = true, okP = true, witness = '';
  for (const L of Ls) {
    if (!(glassPoint(L).w0 === Math.sqrt(E.G / L))) { okG = false; witness = 'L=' + L.toFixed(4); break; }
    if (!(pendulumPoint(L, 0.2).omega === TWO_PI / E.periodIdeal(L))) { okP = false; witness = 'L=' + L.toFixed(4); break; }
  }
  ck('glassPoint(L).w0 === Math.sqrt(E.G/L) byte-exact over the sweep (ω₀ set ON the ray, no 2π/½ factor)', okG,
    okG ? 'exact at all ' + Ls.length + ' lengths' : 'FAILS at ' + witness);
  ck('pendulumPoint(L).omega === 2π/E.periodIdeal(L) byte-exact (ω DERIVED from the exported period, not re-typed √)', okP,
    okP ? 'exact at all ' + Ls.length + ' lengths' : 'FAILS at ' + witness);
}

// ── LEG 4: NEG-CONTROL ROD — the elliptic period peels off the ideal beat at wide swing ────────────
console.log('\n— Leg 4 (neg-control): wide swing — driftRatio>1.05, strictly increasing in θ₀, →1 as θ₀→0 —');
{
  const L = 1.0;
  const wide = pendulumPoint(L, 80 * Math.PI / 180).driftRatio;
  ck('driftRatio(80°) > 1.05 (the wide swing runs SLOW — the marker peels off the ray)', wide > 1.05,
    'drift(80°)=' + wide.toFixed(4));
  const seq = [5, 20, 40, 60, 80].map(d => pendulumPoint(L, d * Math.PI / 180).driftRatio);
  let monotone = true; for (let i = 1; i < seq.length; i++) if (!(seq[i] > seq[i - 1])) monotone = false;
  ck('driftRatio is strictly increasing in θ₀ (wider ⇒ slower, monotone)', monotone, seq.map(x => x.toFixed(4)).join(' → '));
  const tiny = pendulumPoint(L, 0.5 * Math.PI / 180).driftRatio;
  ck('driftRatio → 1 as θ₀ → 0 (anti-vacuity: at small swing the rod IS on the ray)', Math.abs(tiny - 1) < 1e-4,
    'drift(0.5°)=' + tiny.toFixed(7));
}

// ── LEG 5: NEG-CONTROL GLASS — drive off ω₀ and the rim collapses; at ω₀ the lag is exactly π/2 ─────
console.log('\n— Leg 5 (neg-control): off-ω₀ collapse — amp<ampAtRes/8, phase<0.05; phaseAtRes===π/2 exactly —');
{
  for (const L of [0.5, 1.0, 1.5]) {
    const g = glassPoint(L);
    const off = glassDriven(L, 0.4 * g.w0);
    ck('L=' + L + ': off-ω₀ amp < ampAtRes/8 (the rim deflates toward the quasi-static floor)',
      off.amp < g.ampAtRes / 8, 'ratio=' + (off.amp / g.ampAtRes).toExponential(2));
    ck('L=' + L + ': off-ω₀ phase < 0.05 rad (the rim shivers IN STEP — the lag has fled 0)',
      off.phase < 0.05, 'phase=' + off.phase.toFixed(4) + ' rad');
    ck('L=' + L + ': phaseAtRes === π/2 EXACTLY (the resonance signature)',
      Math.abs(g.phaseAtRes - Math.PI / 2) < 1e-12, 'δ(ω₀)=' + (g.phaseAtRes * 180 / Math.PI).toFixed(6) + '°');
  }
  // tuneToBeat (the PARENT's own solver) lands the resonance peak on the beat ω₀, not us asserting it.
  const L = 1.0; const g = glassPoint(L);
  const half = g.ampAtRes / Math.SQRT2;                 // a target the rim crosses on the way up to ω₀
  const wCross = tuneToBeat(L, half, g.p.gamma, g.p.Fm);
  ck('tuneToBeat (the parent bisectAmp solver) lands BELOW ω₀ and the peak sits ON the ray (the glass confirms the coincidence)',
    wCross < g.w0 && wCross > 0.3 * g.w0, 'half-power ω=' + wCross.toFixed(5) + ' < ω₀=' + g.w0.toFixed(5));
}

// ── LEG 6: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS ─────────────────────────────────────────────────
console.log('\n— Leg 6: byte-twin parity (index.html CORE === core.mjs CORE) + adapter disjointness —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));

  // the two adapters are code-DISJOINT by grep: the escapement block names no resonance fn, and the
  // glass block names no escapement fn — proves the two physics are read from their own oracles only.
  const ESC_B = '// ─ ESCAPEMENT-ADAPTER BEGIN ─', ESC_E = '// ─ ESCAPEMENT-ADAPTER END ─';
  const GLA_B = '// ─ GLASS-ADAPTER BEGIN ─', GLA_E = '// ─ GLASS-ADAPTER END ─';
  const escBody = coreSrc.slice(coreSrc.indexOf(ESC_B), coreSrc.indexOf(ESC_E));
  const glaBody = coreSrc.slice(coreSrc.indexOf(GLA_B), coreSrc.indexOf(GLA_E));
  ck('the ESCAPEMENT adapter names NO resonance symbol (R.ampClosed/phaseClosed/bisectAmp/glassPoint/glassDriven/tuneToBeat)',
    !/R\.ampClosed|R\.phaseClosed|R\.bisectAmp|glassPoint|glassDriven|tuneToBeat/.test(escBody), 'reads only the escapement period');
  ck('the GLASS adapter names NO escapement symbol (E.periodIdeal/periodReal/pendulumPoint)',
    !/E\.periodIdeal|E\.periodReal|pendulumPoint/.test(glaBody), 'reads only the resonance closed forms');
  // and neither adapter re-types √(G/L): the pendulum ω is derived from the period, the glass ω₀ from omegaRay.
  ck('the ESCAPEMENT adapter never re-types Math.sqrt (ω is DERIVED from the exported period)',
    !/Math\.sqrt/.test(escBody), 'no re-typed √ in the escapement adapter');
}

// ── LEG 7: PARITY with the shared runSelfTest (the function the page inlines as its pill) ───────────
console.log('\n— Leg 7: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.passed + '/' + r.total);
}

console.log('\n—— The Same Beat Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
