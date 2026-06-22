// Node twin for Two Costumes, One Sine core. Zero-dep. Run: `node cross/two-costumes/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at
// the same two ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves
// the 5 rows the in-page pill proves, PLUS the byte-twin parity row (index.html CORE === core.mjs CORE
// char-for-char) and the code-disjointness grep (the θ-adapter names no LC fn; the LC-adapter names no
// SW integrator symbol — only omega0). ONE law: x'' + ω²x = 0, in two costumes.
//
//   1.  SAME ω        — |LC.omega(L,C) − SW.omega0(G·L·C)| < 1e-9 over an L×C sweep.
//   2.  SAME FUNCTION OF TIME — normalized states agree over a full period < 1e-9 (each core's own rk4).
//   3.  CONVENTION (===) — pendOmega === SW.omega0, L_pend === G·L·C, pendEnergy uses G verbatim.
//   4.  NEG-CONTROL   — a damped leg diverges > 1e-4 AND its energy is monotone-down; free twin flat.
//   5.  CLASSIFIER bites both ways — free ✓ for both free legs AND ✗ for the damped legs.
//   6.  BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE; adapters code-disjoint;
//       both parents imported at the same two ../ hops.
//   7.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as LC from '../../lodestone-hall/the-lc-tank/core.mjs';
import * as SW from '../../swing-ship/core.mjs';
import {
  G, Q0, TWO_PI, matchedLength, pendOmega, lcSweep,
  lcBoot, lcOmega, lcStep, lcEnergy, lcNormalized,
  pendStep, pendEnergy, pendBoot, pendNormalized,
  classify, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nTwo Costumes, One Sine — Node twin (an LC tank and a fixed-length pendulum keep one x″+ω²x=0)\n');
const sweep = lcSweep();

// ── ROW 1: SAME ω — two laws, one frequency ────────────────────────────────────────────────────────
console.log('— Row 1: same ω — |ω_LC(L,C) − ω₀_pend(G·L·C)| < 1e-9 over the L×C sweep —');
{
  let worst = 0, worstAt = '';
  for (const [L, C] of sweep) {
    const d = Math.abs(lcOmega(L, C) - pendOmega(matchedLength(L, C)));
    if (d > worst) { worst = d; worstAt = 'L=' + L + ' C=' + C; }
  }
  ck('|ω_LC − ω₀_pend(G·L·C)| < 1e-9 across the sweep (the g cancels — no fudge factor)',
    worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at ' + worstAt + ' over ' + sweep.length + ' pairs');
  // and they really are EQUAL enough to coincide on the ribbon at every pair
  let coincident = 0;
  for (const [L, C] of sweep) if (Math.abs(lcOmega(L, C) - pendOmega(matchedLength(L, C))) < 1e-9) coincident++;
  ck('both costumes ride the SAME ω at every (L,C)', coincident === sweep.length, coincident + '/' + sweep.length + ' coincident');
}

// ── ROW 2: SAME FUNCTION OF TIME — the headline ────────────────────────────────────────────────────
console.log('\n— Row 2 (HEADLINE): normalized states agree over a full period < 1e-9 (each core its OWN rk4) —');
{
  let worst = 0, worstAt = '';
  for (const [L, C] of sweep) {
    const Lp = matchedLength(L, C), w = lcOmega(L, C), T = TWO_PI / w, N = 1600, h = T / N;
    let sLC = lcBoot(), sP = pendBoot(), wm = 0;
    for (let k = 1; k <= N; k++) {
      sLC = lcStep(sLC, h, L, C);
      sP = pendStep(sP, h, Lp, 0);
      const nl = lcNormalized(sLC, L, C), np = pendNormalized(sP, Lp);
      wm = Math.max(wm, Math.abs(nl[0] - np[0]), Math.abs(nl[1] - np[1]));
    }
    if (wm > worst) { worst = wm; worstAt = 'L=' + L + ' C=' + C; }
  }
  ck('max(|q̂−θ̂|,|î−θ̇̂|) < 1e-9 over a full period — the two states ARE one cosine of time',
    worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at ' + worstAt);
  // the î scale matters: i / (ω·Q0) is load-bearing. Confirm the velocity normalization gives a unit ring.
  const w = lcOmega(1, 1), T = TWO_PI / w, N = 4; let s = lcBoot(), maxR = 0;
  for (let k = 0; k <= N; k++) { const n = lcNormalized(s, 1, 1); maxR = Math.max(maxR, Math.hypot(n[0], n[1])); s = lcStep(s, T / N / 64, 1, 1); }
  ck('the î = i/(ω·Q0) scale traces a UNIT ring (|(q̂,î)| ≈ 1) — the load-bearing normalization', Math.abs(maxR - 1) < 1e-3, 'max radius=' + maxR.toFixed(6));
}

// ── ROW 3: CONVENTION-HONESTY (byte-exact ===) ─────────────────────────────────────────────────────
console.log('\n— Row 3: convention honesty — pendOmega === SW.omega0, L_pend === G·L·C, energy uses G verbatim —');
{
  let okW = true, okL = true, okE = true, witness = '';
  for (const [L, C] of sweep) {
    const Lp = matchedLength(L, C);
    if (!(pendOmega(Lp) === SW.omega0(Lp))) { okW = false; witness = 'L=' + L; break; }
    if (!(matchedLength(L, C) === G * L * C)) { okL = false; witness = 'L=' + L; break; }
    const pr = [0.1, 0.07];
    if (!(pendEnergy(pr, Lp) === 0.5 * pr[1] * pr[1] + 0.5 * (G / Lp) * pr[0] * pr[0])) { okE = false; witness = 'L=' + L; break; }
  }
  ck('pendOmega(L_pend) === SW.omega0(L_pend) byte-exact (ω₀ read from the parent, never re-typed √)', okW, okW ? 'exact at all ' + sweep.length + ' pairs' : 'FAILS at ' + witness);
  ck('matchedLength(L,C) === G·L·C byte-exact (the bridge has no smuggled factor)', okL, okL ? 'exact' : 'FAILS at ' + witness);
  ck('pendEnergy === ½θ̇²+½(g/L)θ² with G verbatim (no smuggled 2π/½)', okE, okE ? 'exact' : 'FAILS at ' + witness);
}

// ── ROW 4: NEG-CONTROL DIVERGENCE + ENERGY ─────────────────────────────────────────────────────────
console.log('\n— Row 4 (neg-control): a damped twin diverges > 1e-4 AND its energy bleeds; the free twin holds flat —');
{
  const L = 1, C = 1, Lp = matchedLength(L, C), w = lcOmega(L, C), T = TWO_PI / w, N = 1600 * 8, h = T * 8 / N;
  let sFree = pendBoot(), sDamp = pendBoot(), beta = 0.08, maxDiv = 0;
  for (let k = 1; k <= N; k++) {
    sFree = pendStep(sFree, h, Lp, 0);
    sDamp = pendStep(sDamp, h, Lp, beta);
    maxDiv = Math.max(maxDiv, Math.abs(sFree[0] - sDamp[0]));
  }
  ck('a damped pendulum twin DIVERGES from its free partner by > 1e-4 (its arc visibly winds down)', maxDiv > 1e-4, 'maxDiv=' + maxDiv.toFixed(4));
  const cd = classify('pend', L, C, 0, beta, 24);
  const cf = classify('pend', L, C, 0, 0, 24);
  ck('the damped leg energy is strictly monotone-down AND eEnd < E0·(1−1e-6) (it bleeds)', cd.monotoneDown && cd.eEndRatio < 1 - 1e-6, 'eEnd/E0=' + cd.eEndRatio.toExponential(3));
  ck('the FREE partner energy stays flat < 1e-9 (a conserved twin never bleeds)', cf.span < 1e-9, 'free span=' + cf.span.toExponential(2));
}

// ── ROW 5: CLASSIFIER bites BOTH ways ──────────────────────────────────────────────────────────────
console.log('\n— Row 5: the conserved-energy classifier returns free ✓ for free legs AND ✗ for damped legs —');
{
  const L = 1, C = 1, beta = 0.08, R = 0.1;
  const lcFree = classify('lc', L, C, 0, 0);
  const penFree = classify('pend', L, C, 0, 0);
  const penDamp = classify('pend', L, C, 0, beta);
  const lcDamp = classify('lc', L, C, R, 0);
  ck('free LC leg → free ✓', lcFree.free, 'span=' + lcFree.span.toExponential(2));
  ck('free pendulum leg → free ✓', penFree.free, 'span=' + penFree.span.toExponential(2));
  ck('damped pendulum leg → ✗ (bleeds)', !penDamp.free, 'eEnd/E0=' + penDamp.eEndRatio.toExponential(2));
  ck('damped (RLC) tank leg → ✗ (bleeds) — the classifier is not vacuous', !lcDamp.free, 'eEnd/E0=' + lcDamp.eEndRatio.toExponential(2));
}

// ── ROW 6: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS ─────────────────────────────────────────────────
console.log('\n— Row 6: byte-twin parity (index.html CORE === core.mjs CORE) + adapter disjointness —');
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

  // the two adapters are code-DISJOINT by grep: the θ block names no LC fn; the LC block names no SW
  // INTEGRATOR symbol (only omega0 is permitted, and it is read OUTSIDE the LC adapter, via pendOmega).
  const LC_B = '// ─ LC-ADAPTER BEGIN ─', LC_E = '// ─ LC-ADAPTER END ─';
  const TH_B = '// ─ THETA-ADAPTER BEGIN ─', TH_E = '// ─ THETA-ADAPTER END ─';
  const lcBody = coreSrc.slice(coreSrc.indexOf(LC_B), coreSrc.indexOf(LC_E));
  const thBody = coreSrc.slice(coreSrc.indexOf(TH_B), coreSrc.indexOf(TH_E));
  ck('the θ-adapter names NO lc-tank symbol (LC.* / lcStep / lcEnergy / lcOmega / lcBoot)',
    !/\bLC\.|lcStep|lcEnergy|lcOmega|lcBoot|lcNormalized/.test(thBody), 'reads only its own linear stepper');
  ck('the LC-adapter names NO swing-ship integrator (SW.deriv / SW.rk4Step / pendStep / pendDeriv)',
    !/SW\.deriv|SW\.rk4Step|pendStep|pendDeriv/.test(lcBody), 'reads only the lc-tank q-stepper');
  // and the LC-adapter carries the Mathieu-free guarantee: it never names SW at all (its ω is LC.omega).
  ck('the LC-adapter names NO swing-ship symbol whatsoever (the tank is read purely from the lc-tank core)',
    !/\bSW\./.test(lcBody), 'no SW.* inside the LC adapter');
}

// ── ROW 7: PARITY with the shared runSelfTest ──────────────────────────────────────────────────────
console.log('\n— Row 7: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all rows', r.ok, r.passed + '/' + r.total);
}

console.log('\n—— Two Costumes Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
