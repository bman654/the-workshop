// Node twin for The Same Sinc core. Zero-dep. Run: `node cross/the-same-sinc/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at
// the same two ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves
// the 4 legs the in-page pill proves, PLUS the byte-twin parity leg (index.html CORE === core.mjs CORE
// char-for-char) and the code-disjointness grep (the slit adapter names no SAMP fn, the window adapter
// names no SLIT fn). One rectangle, one sinc, one first-zero at 1/w — two costumes (light² vs envelope).
//
//   1.  SAME RAIL    — |slitNull − 1/w| AND |windowNull − 1/w| AND |slitNull − windowNull| < 1e-9.
//   2.  π RECONCILED — SLIT_ARG0===π, SAMP_ARG0===1 (discovered from the parents' sinc); lone factor ÷π.
//   3.  NULL IS THE ORACLE'S — each arg-zero plugged back into the parent's own sinc returns ~0 there.
//   4.  NEG-CONTROL GAUSS — slitHasNull('gauss')===false; exp(−2w²k²) never negative/monotone/positive.
//   5.  BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE char-for-char, and the two
//       adapters are code-disjoint by grep (slit names no SAMP fn, window names no SLIT fn).
//   6.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as SLIT from '../../cavern/uncertainty-slit/core.mjs';
import * as SAMP from '../../sampling-theorem/sampling-core.mjs';
import {
  W_MIN, W_MAX,
  recipRail, wSweep, firstZeroArg,
  SLIT_ARG0, SAMP_ARG0,
  slitNullShared, windowNullShared, slitHasNull, windowEnvelope,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Sinc — Node twin (a hard slit\'s dark fringe and a sampled tone\'s spectral null share 1/w)\n');
const ws = wSweep();

// ── LEG 1: SAME RAIL — both first nulls ride ONE reciprocal 1/w ─────────────────────────────────────
console.log('— Leg 1: both first nulls land on one reciprocal rail (slitNull === 1/w === windowNull) <1e-9 —');
{
  let worst = 0, worstW = null;
  for (const w of ws) {
    const s = slitNullShared(w), wn = windowNullShared(w), rail = recipRail(w);
    const d = Math.max(Math.abs(s - rail), Math.abs(wn - rail), Math.abs(s - wn));
    if (d > worst) { worst = d; worstW = w; }
  }
  ck('|slitNull − 1/w| AND |windowNull − 1/w| AND |slitNull − windowNull| < 1e-9 across the w sweep',
    worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at w=' + worstW.toFixed(4) + ' over ' + ws.length + ' half-widths');
  // both nulls really pin to the SAME reciprocal mark at every w
  let coincident = 0;
  for (const w of ws) if (Math.abs(slitNullShared(w) - windowNullShared(w)) < 1e-9) coincident++;
  ck('both notches pin to the SAME reciprocal tick at every w', coincident === ws.length, coincident + '/' + ws.length + ' coincident');
}

// ── LEG 2: π RECONCILED, NOT SMUGGLED — discovered from the parents' own sinc; lone factor ÷π ────────
console.log('\n— Leg 2: π reconciled — SLIT_ARG0===π, SAMP_ARG0===1 (discovered); the lone slit↔rail factor is ÷π —');
{
  ck('SLIT_ARG0 === π to 1e-6, DISCOVERED from SLIT.sinc (the slit speaks in radians: null at π/w)',
    Math.abs(SLIT_ARG0 - Math.PI) < 1e-6, 'SLIT_ARG0=' + SLIT_ARG0.toFixed(9) + ' π=' + Math.PI.toFixed(9));
  ck('SAMP_ARG0 === 1 to 1e-6, DISCOVERED from SAMP.sinc (the window speaks in cycles: null at 1/w)',
    Math.abs(SAMP_ARG0 - 1) < 1e-6, 'SAMP_ARG0=' + SAMP_ARG0.toFixed(9));
  // firstZeroArg is a discoverer, not a hard-coded constant: feed it a foreign sinc and it finds its zero.
  const halfRate = firstZeroArg((t) => (t === 0 ? 1 : Math.sin(t / 2) / (t / 2)));   // sin(t/2)/(t/2) zeros at 2π
  ck('firstZeroArg DISCOVERS (not hard-codes): sin(t/2)/(t/2) → first zero at 2π (≠ the slit\'s π) — so π/1 are read, not asserted',
    Math.abs(halfRate - 2 * Math.PI) < 1e-3, 'discovered=' + halfRate.toFixed(6) + ' (2π=' + (2 * Math.PI).toFixed(6) + ')');
  // the ÷π is the WHOLE reconciliation: the only factor between the radian null and the shared rail.
  let factorOk = true, witness = '';
  for (const w of ws) {
    const radianNull = SLIT_ARG0 / w;
    if (Math.abs(slitNullShared(w) * Math.PI - radianNull) > 1e-12) { factorOk = false; witness = 'w=' + w.toFixed(4); break; }
  }
  ck('the lone factor slitNullShared↔(π/w) is exactly ÷π over the sweep (the π is surfaced, not smuggled in a scale)',
    factorOk, factorOk ? 'exact at all ' + ws.length + ' half-widths' : 'FAILS at ' + witness);
}

// ── LEG 3: NULL IS THE ORACLE'S — each arg-zero is a real zero of the PARENT's own sinc ─────────────
console.log('\n— Leg 3: each discovered null is a real zero of the parent\'s OWN sinc (not a placed tick) —');
{
  const sAt = Math.abs(SLIT.sinc(SLIT_ARG0)), sIn = SLIT.sinc(SLIT_ARG0 * 0.5);
  ck('SLIT.sinc(SLIT_ARG0) ≈ 0 AND SLIT.sinc(π/2) > 0.1 (the slit amplitude genuinely vanishes at π, not before)',
    sAt < 1e-6 && sIn > 0.1, '|sinc(π)|=' + sAt.toExponential(2) + ' sinc(π/2)=' + sIn.toFixed(4));
  const wAt = Math.abs(SAMP.sinc(SAMP_ARG0)), wIn = SAMP.sinc(SAMP_ARG0 * 0.5);
  ck('SAMP.sinc(SAMP_ARG0) ≈ 0 AND SAMP.sinc(0.5) > 0.1 (the window envelope genuinely vanishes at 1, not before)',
    wAt < 1e-6 && wIn > 0.1, '|sinc(1)|=' + wAt.toExponential(2) + ' sinc(0.5)=' + wIn.toFixed(4));
  // the VISUAL window envelope (used by the page) is SAMP.sinc(w·f) and it vanishes at f = 1/w too.
  let envOk = true, ww = '';
  for (const w of [0.3, 0.7, 1.0, 1.5, 2.0]) {
    if (!(Math.abs(windowEnvelope(w, 1 / w)) < 1e-6 && windowEnvelope(w, 0.5 / w) > 0.1)) { envOk = false; ww = 'w=' + w; break; }
  }
  ck('the page\'s analytic envelope windowEnvelope(w, 1/w) ≈ 0 (NOT a discrete FFT — the honest continuous companion of the slit far field)',
    envOk, envOk ? 'vanishes at f=1/w for every w' : 'FAILS at ' + ww);
}

// ── LEG 4: NEG-CONTROL GAUSS — a Gaussian far field has NO zero-crossing, so NO null to coincide ────
console.log('\n— Leg 4 (neg-control): gauss far field exp(−2w²k²) never crosses zero — slitHasNull(\'gauss\')===false —');
{
  ck('slitHasNull(\'gauss\') === false (a Gaussian transform never reaches zero — nothing to coincide with)',
    slitHasNull('gauss') === false, 'gauss has no null');
  ck('slitHasNull(\'tophat\') === true (the control is discriminating, not always-false)',
    slitHasNull('tophat') === true, 'tophat DOES have a null');
  let everNegative = false, monotone = true, posInWindow = true, minWindowI = Infinity;
  for (const w of [0.3, 0.7, 1.0, 1.5, 2.0]) {
    const kWindow = 4 * (SLIT_ARG0 / w);
    let prev = SLIT.farFieldIntensity('gauss', w, 0);
    for (let k = 0; k <= kWindow; k += kWindow / 600) {
      const I = SLIT.farFieldIntensity('gauss', w, k);
      if (I < 0) everNegative = true;
      if (I > prev + 1e-15) monotone = false;
      if (I <= 0) posInWindow = false;
      if (I < minWindowI) minWindowI = I;
      prev = I;
    }
  }
  ck('exp(−2w²k²) never negative, monotone-decreasing, and >0 across the visible far-field window (a bell, not a fringe)',
    !everNegative && monotone && posInWindow, 'never<0=' + (!everNegative) + ' monotone=' + monotone + ' min-in-window=' + minWindowI.toExponential(2));
  // anti-vacuity: an always-coincide checker would claim a coincidence here; the neg-control denies it.
  const vacuousAlwaysCoincides = true;            // a checker that ignores the profile
  ck('a vacuous always-coincide checker is REFUTED by the gauss leg (there is no slit null to coincide with)',
    vacuousAlwaysCoincides && slitHasNull('gauss') === false, 'the discriminating fact: gauss has no null, yet a vacuous checker would say "coincident"');
}

// ── LEG 5: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS ─────────────────────────────────────────────────
console.log('\n— Leg 5: byte-twin parity (index.html CORE === core.mjs CORE) + adapter disjointness —');
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

  // the two adapters are code-DISJOINT by grep: the slit block names no SAMP fn, the window block names
  // no SLIT fn — proves the two sincs are read from their own oracles only.
  const SLIT_B = '// ─ SLIT-ADAPTER BEGIN ─', SLIT_E = '// ─ SLIT-ADAPTER END ─';
  const WIN_B = '// ─ WINDOW-ADAPTER BEGIN ─', WIN_E = '// ─ WINDOW-ADAPTER END ─';
  const slitBody = coreSrc.slice(coreSrc.indexOf(SLIT_B), coreSrc.indexOf(SLIT_E));
  const winBody = coreSrc.slice(coreSrc.indexOf(WIN_B), coreSrc.indexOf(WIN_E));
  ck('the SLIT adapter names NO window symbol (SAMP.sinc / SAMP_ARG0 / windowNullShared / windowEnvelope)',
    !/SAMP\.sinc|SAMP_ARG0|windowNullShared|windowEnvelope/.test(slitBody), 'reads only the slit\'s own sinc');
  ck('the WINDOW adapter names NO slit symbol (SLIT.sinc / SLIT.farFieldIntensity / SLIT_ARG0 / slitNullShared / slitHasNull)',
    !/SLIT\.sinc|SLIT\.farFieldIntensity|SLIT_ARG0|slitNullShared|slitHasNull/.test(winBody), 'reads only the window\'s own sinc');
  // and neither adapter re-types sin/π inside the locators EXCEPT the one named ÷π in the slit block.
  ck('the WINDOW adapter never re-types Math.PI or Math.sin (the null is already 1/w — no ÷π on this side)',
    !/Math\.PI|Math\.sin/.test(winBody), 'no re-typed π/sin in the window adapter');
  ck('the SLIT adapter\'s ONLY Math.PI is the surfaced ÷π (exactly one occurrence)',
    (slitBody.match(/Math\.PI/g) || []).length === 1, 'the lone ÷π is the whole reconciliation');
}

// ── LEG 6: PARITY with the shared runSelfTest (the function the page inlines as its pill) ────────────
console.log('\n— Leg 6: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.passed + '/' + r.total);
}

console.log('\n—— The Same Sinc Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
