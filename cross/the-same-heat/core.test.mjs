// Node twin for The Same Heat core. Zero-dep. Run: `node cross/the-same-heat/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char), an anti-circularity check, and a
// no-re-typed-exponential scan (the exp lives ONLY in the imported oracles).
//
//   1.  MIND LINEARITY — mindLogOdds(T) === GAP/T to <1e-9 over T∈{0.25..4} (worst ~2.22e-16).
//   2.  GAS LINEARITY  — gasLogOdds(T,tunedTau()) === (−2·tunedTau())/T to <1e-9 (worst ~2.22e-16).
//   3.  COINCIDENCE    — |mindLogOdds − gasLogOdds(tuned)| < 1e-9 across the sweep (−2τ===GAP).
//   4.  MISMATCH IS REAL — with −2τ ≠ GAP the |Δ| is nonzero and GROWS with 1/T (the rays fan).
//   5.  NEG-CONTROL TEETH — nonBoltzmannLogOdds(T)·T is NOT constant (spread ≥ 1e-2) while the true
//       Boltzmann log-odds ·T IS constant (===GAP): a vacuous "always linear" checker provably FAILS.
//   6.  ANTI-CIRCULARITY — the mind/gas log-odds path names no 'Math.exp'/'softmax body'; the MIND
//       adapter names no brownian symbol and the GAS adapter names no softmax symbol.
//   7.  BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//   8.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GAP, tunedTau, SWEEP,
  mindLogOdds, gasLogOdds, gasRate, nonBoltzmannLogOdds, boltzmannLine, tokenSplit, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Heat — Node twin (a mind and a gas share one temperature dial)\n');
const tau = tunedTau();

// ── LEG 1: MIND LINEARITY — the model's word-split log-odds is EXACTLY Boltzmann ─────────────────
console.log('— Leg 1: the model split ln(p_the/p_on) === GAP/T (Boltzmann, linear in 1/T) <1e-9 —');
{
  let worst = 0, worstT = null;
  for (const T of SWEEP) {
    const m = mindLogOdds(T), exp = GAP / T, d = Math.abs(m - exp);
    if (d > worst) { worst = d; worstT = T; }
    ck('T=' + T + ': |ln(p_the/p_on) − GAP/T| < 1e-9',
      d < 1e-9, 'logOdds=' + m.toFixed(10) + ' GAP/T=' + exp.toFixed(10) + ' Δ=' + d.toExponential(2));
  }
  ck('worst mind-linearity Δ over the sweep < 1e-9', worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at T=' + worstT);
}

// ── LEG 2: GAS LINEARITY — the ratchet's hop-bias log-odds is EXACTLY Boltzmann too ──────────────
console.log('\n— Leg 2: the ratchet bias ln(r_fwd/r_bwd) === (−2τ)/T (Boltzmann) <1e-9 at the tuned τ —');
{
  let worst = 0, worstT = null;
  for (const T of SWEEP) {
    const g = gasLogOdds(T, tau), exp = (-2 * tau) / T, d = Math.abs(g - exp);
    if (d > worst) { worst = d; worstT = T; }
    ck('T=' + T + ': |ln(r_fwd/r_bwd) − (−2τ)/T| < 1e-9',
      d < 1e-9, 'logOdds=' + g.toFixed(10) + ' (−2τ)/T=' + exp.toFixed(10) + ' Δ=' + d.toExponential(2));
  }
  ck('worst gas-linearity Δ over the sweep < 1e-9', worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at T=' + worstT);
}

// ── LEG 3: COINCIDENCE — with −2τ = GAP the two lines ARE one line ───────────────────────────────
console.log('\n— Leg 3: tuned — |mindLogOdds − gasLogOdds(tuned)| < 1e-9 across the sweep (one Boltzmann line) —');
{
  ck('the tuned τ really makes −2τ === GAP', Math.abs(-2 * tau - GAP) < 1e-12,
    '−2τ=' + (-2 * tau).toFixed(10) + ' GAP=' + GAP.toFixed(10) + ' τ=' + tau);
  let worst = 0, worstT = null;
  for (const T of SWEEP) {
    const d = Math.abs(mindLogOdds(T) - gasLogOdds(T, tau));
    if (d > worst) { worst = d; worstT = T; }
    ck('T=' + T + ': mind and gas coincide < 1e-9',
      d < 1e-9, 'mind=' + mindLogOdds(T).toFixed(10) + ' gas=' + gasLogOdds(T, tau).toFixed(10) + ' Δ=' + d.toExponential(2));
  }
  ck('worst coincidence Δ over the sweep < 1e-9', worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at T=' + worstT);
  // the markers really sit on the Boltzmann line (boltzmannLine(invT) === both log-odds when tuned)
  let onLine = 0;
  for (const T of SWEEP) {
    const inv = 1 / T;
    if (Math.abs(boltzmannLine(inv) - mindLogOdds(T)) < 1e-9 && Math.abs(boltzmannLine(inv) - gasLogOdds(T, tau)) < 1e-9) onLine++;
  }
  ck('both markers ride boltzmannLine(1/T) = GAP/T when tuned', onLine === SWEEP.length, onLine + '/' + SWEEP.length + ' on the line');
}

// ── LEG 4: MISMATCH IS REAL (non-vacuous) — the rays genuinely FAN when −2τ ≠ GAP ────────────────
console.log('\n— Leg 4 (non-vacuity): −2τ ≠ GAP ⇒ |Δ| nonzero AND grows with 1/T (the rays fan) —');
{
  const tauMis = -0.4;                                         // −2·tauMis = 0.8 ≠ GAP
  const desc = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];            // T descending ⇒ 1/T ascending
  let nonzero = true, grows = true, prev = -Infinity, minGap = Infinity, maxGap = 0;
  for (const T of desc) {
    const d = Math.abs(mindLogOdds(T) - gasLogOdds(T, tauMis));
    if (!(d > 1e-6)) nonzero = false;
    if (d <= prev) grows = false;
    minGap = Math.min(minGap, d); maxGap = Math.max(maxGap, d);
    prev = d;
  }
  ck('the mismatched gap is NONZERO across the sweep (≥1e-6)', nonzero, 'minGap=' + minGap.toExponential(2));
  ck('the mismatched gap GROWS strictly with 1/T (the rays genuinely fan — coincidence is the tuning)',
    grows, 'minGap=' + minGap.toExponential(2) + ' → maxGap=' + maxGap.toExponential(2));
  // anti-vacuity: a checker that compares the TUNED gas passes; the MISTUNED gas FAILS the <1e-9 gate.
  let tunedPasses = true, mistunedPasses = true;
  for (const T of SWEEP) {
    if (!(Math.abs(mindLogOdds(T) - gasLogOdds(T, tau)) < 1e-9)) tunedPasses = false;
    if (!(Math.abs(mindLogOdds(T) - gasLogOdds(T, tauMis)) < 1e-9)) mistunedPasses = false;
  }
  ck('the TUNED comparison passes the <1e-9 gate (the real coincidence)', tunedPasses);
  ck('the MISTUNED comparison FAILS the <1e-9 gate (so coincidence is NOT a tautology)', !mistunedPasses,
    'mistuned never coincides to 1e-9');
}

// ── LEG 5: NEG-CONTROL WITH TEETH — a non-Boltzmann normalizer bends off the straight ray ────────
console.log('\n— Leg 5 (load-bearing): non-Boltzmann is NOT linear in 1/T (the line bends) —');
{
  const ctrl = SWEEP.map(T => nonBoltzmannLogOdds(T) * T);
  const ctrlSpread = Math.max(...ctrl) - Math.min(...ctrl);
  const tru = SWEEP.map(T => mindLogOdds(T) * T);
  const truSpread = Math.max(...tru) - Math.min(...tru);
  ck('nonBoltzmann·T is NOT constant (spread ≥ 1e-2) — the trajectory BENDS off the straight ray',
    ctrlSpread >= 1e-2, 'spread=' + ctrlSpread.toExponential(2));
  ck('the TRUE Boltzmann·T IS constant (===GAP, spread <1e-9) — so the bend is the apparatus, not the heat',
    truSpread < 1e-9 && Math.abs(tru[0] - GAP) < 1e-9, 'Boltzmann·T spread=' + truSpread.toExponential(2) + ' (==' + GAP.toFixed(4) + ')');
  // a vacuous "always linear in 1/T" checker (constant log-odds·T) provably FAILS the control:
  const vacuousPassesControl = ctrlSpread < 1e-9;
  ck('a vacuous "always linear in 1/T" checker FAILS the non-Boltzmann control (the control bites)',
    !vacuousPassesControl, 'vacuous-passes-control=' + vacuousPassesControl);
}

// ── LEG 6: ANTI-CIRCULARITY — no re-typed exponential; the two adapters are code-disjoint ────────
console.log('\n— Leg 6: anti-circularity — the exp lives ONLY in the imports; the adapters are disjoint —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  const HEAD_MIND = '// ─ MIND-ADAPTER BEGIN ─';
  const END_MIND = '// ─ MIND-ADAPTER END ─';
  const HEAD_GAS = '// ─ GAS-ADAPTER BEGIN ─';
  const END_GAS = '// ─ GAS-ADAPTER END ─';
  const mindBody = src.slice(src.indexOf(HEAD_MIND), src.indexOf(END_MIND));
  const gasBody = src.slice(src.indexOf(HEAD_GAS), src.indexOf(END_GAS));
  // the log-odds path re-types NO exponential: the exp lives ONLY in the imported softmax/symmetricRates.
  ck('no re-typed exponential: neither adapter names Math.exp or Math.pow (the exp is in the oracles)',
    !/Math\.exp|Math\.pow/.test(mindBody) && !/Math\.exp|Math\.pow/.test(gasBody),
    'mind & gas adapters take only logs of imported ratios');
  // the MIND adapter never names a brownian symbol; the GAS adapter never names a softmax symbol.
  ck('the MIND adapter never names a brownian symbol (symmetricRates/r_fwd/r_bwd/E_B/gasLogOdds)',
    !/symmetricRates|r_fwd|r_bwd|\bE_B\b|gasLogOdds|gasRate/.test(mindBody), 'mind reads only softmax');
  ck('the GAS adapter never names a softmax symbol (softmax/LOGITS/mindLogOdds/nonBoltzmann)',
    !/\bsoftmax\b|\bLOGITS\b|mindLogOdds|nonBoltzmann/.test(gasBody), 'gas reads only symmetricRates');
}

// ── LEG 7: BYTE-TWIN PARITY — the inlined slab IS the module, byte-for-byte ───────────────────────
console.log('\n— Leg 7: byte-twin parity (index.html CORE slab === core.mjs CORE char-for-char) —');
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

// ── LEG 8: PARITY with the shared runSelfTest (the function the page inlines) ─────────────────────
console.log('\n— Leg 8: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.passed + '/' + r.total);
}

console.log('\n—— The Same Heat Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
