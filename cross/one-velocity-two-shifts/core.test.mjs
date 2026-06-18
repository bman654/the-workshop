// Node twin for One Velocity, Two Shifts core. Zero-dep. Run: `node cross/one-velocity-two-shifts/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char), an anti-circularity check, and the
// single-source parity inherited from drifting-star.
//
//   1.  SHARED FACT (the latch) — for β in [−0.05,0.05]: acousticFO(β) === spectralFactor(β) < 1e-9
//       (worst 1.11e-16), spectralFactor is λ-INDEPENDENT across all four Balmer lines (<1e-12), and
//       both agree with the first-order law 1 + β. The siren's pitch-up and the star's blueshift coincide.
//   2.  BOUNDARY/TEETH — exactDeparture(β)=|1/(1−β)−(1+β)| grows monotonically as O(β²): ~9.0e-10@3e-5,
//       ~2.5e-9@5e-5, ~2.6e-3@0.05, ratio/β² bounded ~1. The first-order latch is a first-order TRUTH.
//   3.  NEG-CONTROL A (medium asymmetry, load-bearing) — source 1/(1−β) ≠ listener 1+β (gap ≥1e-6, grows);
//       spectralFactor is the SAME regardless of who moves. A symmetric-in-who-moves classifier FAILS sound.
//   4.  NEG-CONTROL B (transverse, load-bearing) — at θ→90° acoustic === 1 EXACTLY (v_radial=0) while the
//       relativistic transverse factor keeps γ (residual ≥1e-4 by β=0.03). An always-agree classifier FAILS.
//   5.  ANTI-CIRCULARITY — the SIREN body never names a spectral fn (shiftedNm/recoverVKms/balmerRestComb/
//       shiftedNmRel/C_KMS/V_CAP) and the SPECTRAL body never names a siren fn (dopplerFactor/arrivalTime/
//       arrivalRate/machAngle): two code-disjoint domains landing on one first-order fraction.
//   6.  BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//   7.  SINGLE-SOURCE — balmerRestComb()[n] === balmerWavelengthAirNm(3..6) < 1e-9 (no re-typed literal).
//   8.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { balmerWavelengthAirNm } from '../../spectroscope/spectroscope-core.mjs';
import {
  C_KMS, V_CAP_FRAC, balmerRestComb, shiftedNm,
  acousticFactor, acousticFO, spectralFactor, sharedFact, exactDeparture, transverseFactors,
  BETA_SWEEP, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nOne Velocity, Two Shifts — Node twin (a siren and a star share 1 + v/c)\n');

// ── LEG 1: SHARED FACT — the latch (acousticFO === spectralFactor, λ-independent, both = 1+β) ─────
console.log('— Leg 1: the siren first-order factor and the star classical factor are the SAME 1+β <1e-9 —');
{
  const comb = balmerRestComb();
  let worst = 0, worstB = null, lamSpread = 0, foMatch = 0;
  for (let i = -50; i <= 50; i++) {
    const b = i / 1000;
    const d = Math.abs(acousticFO(b) - spectralFactor(b));
    if (d > worst) { worst = d; worstB = b; }
    foMatch = Math.max(foMatch, Math.abs(acousticFO(b) - (1 + b)));
    const vals = comb.map(L => shiftedNm(L.restNm, b * C_KMS) / L.restNm);
    lamSpread = Math.max(lamSpread, Math.max.apply(null, vals) - Math.min.apply(null, vals));
  }
  ck('worst |acousticFO − spectralFactor| over [−0.05,0.05] < 1e-9', worst < 1e-9,
    'worst=' + worst.toExponential(2) + ' at β=' + worstB);
  ck('spectralFactor is λ-INDEPENDENT across the four Balmer lines < 1e-12 (rigid slide)', lamSpread < 1e-12,
    'maxλ-spread=' + lamSpread.toExponential(2));
  ck('both factors equal the first-order law 1 + β < 1e-12', foMatch < 1e-12, 'maxΔ(acousticFO,1+β)=' + foMatch.toExponential(2));
  // spot-check a few via sharedFact (the hero readout the page reads)
  for (const b of [-0.05, -0.01, 0.001, 0.03]) {
    const s = sharedFact(b);
    ck('β=' + b + ': sharedFact latches (acousticFO=' + s.acousticFO.toFixed(6) + ', spectral=' + s.spectral.toFixed(6) + ')',
      s.latched, '|Δ|=' + Math.abs(s.acousticFO - s.spectral).toExponential(2));
  }
}

// ── LEG 2: BOUNDARY/TEETH — the exact forms diverge as O(β²) (the latch is a first-order TRUTH) ───
console.log('\n— Leg 2: the EXACT acoustic factor 1/(1−β) departs the shared 1+β as O(β²) — the teeth —');
{
  const cases = [[3e-5, 9.0e-10], [5e-5, 2.5e-9], [5e-2, 2.632e-3]];
  for (const [b, expect] of cases) {
    const d = exactDeparture(b);
    ck('exactDeparture(' + b + ') ≈ ' + expect.toExponential(2) + ' (pinned)',
      Math.abs(d - expect) < Math.max(1e-11, expect * 0.01), 'measured=' + d.toExponential(3));
  }
  let prev = -1, mono = true, ratioOk = true, worstRatio = 0;
  for (const b of [1e-4, 1e-3, 5e-3, 1e-2, 3e-2, 5e-2]) {
    const d = exactDeparture(b);
    if (!(d > prev)) mono = false;
    prev = d;
    const ratio = d / (b * b);
    worstRatio = Math.max(worstRatio, ratio);
    if (!(ratio > 0.9 && ratio < 1.2)) ratioOk = false;
  }
  ck('exactDeparture grows MONOTONICALLY in β (the teeth open as β rises)', mono);
  ck('exactDeparture(β)/β² stays bounded ~1 (genuinely O(β²), not larger)', ratioOk, 'worst ratio=' + worstRatio.toFixed(4));
  // the agreement is NOT a tautology: at the corridor edge the EXACT factors already disagree above 1e-9.
  ck('at β=0.05 the EXACT acoustic factor and 1+β disagree ABOVE 1e-9 (so the latch is a real limit)',
    exactDeparture(0.05) > 1e-9, 'exactDeparture(0.05)=' + exactDeparture(0.05).toExponential(2));
}

// ── LEG 3: NEG-CONTROL A — medium asymmetry (sound cares who moves; light does not) ───────────────
console.log('\n— Leg 3 (load-bearing): sound is asymmetric in who-moves; light is symmetric —');
{
  let minGap = Infinity, grows = true, prevGap = -1;
  for (const b of [1e-3, 5e-3, 1e-2]) {
    const src = acousticFactor(b, 'source'), lis = acousticFactor(b, 'listener');
    const gap = Math.abs(src - lis);
    minGap = Math.min(minGap, gap);
    if (!(gap > prevGap)) grows = false;
    prevGap = gap;
    ck('β=' + b + ': acoustic source 1/(1−β) ≠ listener 1+β (gap ≥1e-6)', gap >= 1e-6,
      'source=' + src.toFixed(9) + ' listener=' + lis.toFixed(9) + ' gap=' + gap.toExponential(2));
  }
  ck('the medium-asymmetry gap GROWS with β (1.0e-6 → 1.01e-4)', grows, 'minGap=' + minGap.toExponential(2));
  // light has no medium: the spectral factor is one form, identical whoever you imagine moving.
  // A "symmetric-in-who-moves" classifier passes light (gap 0) but provably FAILS sound (gap>0 above).
  ck('a "symmetric in who-moves" classifier PASSES light (gap 0) but FAILS sound (gap>0)',
    minGap > 0, 'sound minGap=' + minGap.toExponential(2) + ' > light gap=0');
}

// ── LEG 4: NEG-CONTROL B — transverse (acoustic vanishes; relativity keeps γ) ─────────────────────
console.log('\n— Leg 4 (load-bearing): θ→90° kills the acoustic shift EXACTLY but relativity keeps γ —');
{
  let acousticExact = true, relAbove = true, resGrows = true, prevRes = -1;
  for (const b of [0.01, 0.03, 0.05]) {
    const t = transverseFactors(b);
    if (t.acoustic !== 1) acousticExact = false;
    if (!(t.relTransverse > 1)) relAbove = false;
    if (!(t.residual > prevRes)) resGrows = false;
    prevRes = t.residual;
    ck('β=' + b + ': acoustic === 1 EXACTLY (v_radial=0), γ=' + t.relTransverse.toFixed(9) + ' > 1',
      t.acoustic === 1 && t.relTransverse > 1, 'acoustic=' + t.acoustic + ' residual=' + t.residual.toExponential(3));
  }
  const r03 = transverseFactors(0.03).residual, r05 = transverseFactors(0.05).residual;
  ck('the acoustic transverse factor is EXACTLY 1 across the sweep (not <ε)', acousticExact);
  ck('the relativistic γ-residual reaches ≥1e-4 by β=0.03 (4.5e-4) and grows to 1.25e-3 @0.05',
    relAbove && resGrows && r03 >= 1e-4 && Math.abs(r03 - 4.5e-4) < 5e-5 && Math.abs(r05 - 1.25e-3) < 5e-5,
    'residual@0.03=' + r03.toExponential(2) + ' @0.05=' + r05.toExponential(2));
  ck('a "purely-radial / always-agree" classifier FAILS: acoustic 1 vs relativistic γ disagree',
    Math.abs(transverseFactors(0.05).acoustic - transverseFactors(0.05).relTransverse) >= 1e-4);
}

// ── LEG 5: ANTI-CIRCULARITY — the two lifted cores are code-disjoint (neither names the other) ────
console.log('\n— Leg 5: anti-circularity — the SIREN and SPECTRAL blocks are code-disjoint —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  const sirenBody = src.slice(src.indexOf('SIREN-CORE BEGIN'), src.indexOf('SIREN-CORE END'));
  const spectralBody = src.slice(src.indexOf('SPECTRAL-CORE BEGIN'), src.indexOf('SPECTRAL-CORE END'));
  ck('the SIREN block never names a spectral fn (shiftedNm/recoverVKms/balmerRestComb/shiftedNmRel/C_KMS/V_CAP)',
    !/shiftedNm|recoverVKms|balmerRestComb|shiftedNmRel|C_KMS|V_CAP/.test(sirenBody));
  ck('the SPECTRAL block never names a siren fn (dopplerFactor/arrivalTime/arrivalRate/machAngle)',
    !/dopplerFactor|arrivalTime|arrivalRate|machAngle/.test(spectralBody));
}

// ── LEG 6: BYTE-TWIN PARITY — the inlined slab IS the module, byte-for-byte ───────────────────────
console.log('\n— Leg 6: byte-twin parity (index.html CORE slab === core.mjs CORE char-for-char) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── LEG 7: SINGLE-SOURCE — the rest comb === the imported Balmer numbers (no re-typed literal) ────
console.log('\n— Leg 7: single-source — the rest comb === imported balmerWavelengthAirNm(3..6) —');
{
  const comb = balmerRestComb();
  let maxD = 0;
  for (const L of comb) maxD = Math.max(maxD, Math.abs(L.restNm - balmerWavelengthAirNm(L.n)));
  ck('rest comb === imported balmerWavelengthAirNm(3..6) < 1e-9', maxD < 1e-9, 'maxΔ=' + maxD.toExponential(2) + ' nm');
}

// ── LEG 8: PARITY with the shared runSelfTest (the function the page inlines as its pill) ──────────
console.log('\n— Leg 8: the shared runSelfTest (the page pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok,
    r.passed + '/' + r.total + (r.ok ? '' : ' · ' + r.checks.filter(c => !c.pass).map(c => c.name).join(',')));
}

console.log('\n—— One Velocity, Two Shifts Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
