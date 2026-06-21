// ============================================================================
//  THE SAME HEAT — a MIND and a GAS share one temperature dial. Logic core.
//
//  THE ONE IDEA. There is exactly ONE exponential law, e^(−E/T), under two knobs
//  that never met. A language model's softmax turns logits into a token split
//  with a temperature T; a Brownian ratchet's hop rates turn a barrier into a
//  forward/backward bias with a temperature T. Both are Boltzmann. So the SAME
//  bead, dragged once, moves a mind's word-split AND a gas's ratchet-bias in
//  lockstep — and when you tune the gas's load so −2τ equals the model's logit
//  gap, the two log-odds COINCIDE on one straight line through the origin.
//
//    • THE MIND (clockwork/core.mjs — "The Temperature Dial"). softmax(z,T) gives
//      p_i ∝ e^(z_i/T). For two tokens 'the' (z_a) and 'on' (z_b) the log-odds is
//          ln(p_a/p_b) = (z_a − z_b)/T = GAP/T            ← EXACTLY linear in 1/T.
//      Cold (T→0): 'the' brims, 'on' empties (greedy). Hot (T→∞): both → 50/50.
//
//    • THE GAS (engine-room/brownian/core.mjs — "The Brownian Ratchet"). The
//      single-bath hop rates are Arrhenius factors r_fwd = e^(−(E_B+τ)/T),
//      r_bwd = e^(−(E_B−τ)/T). Their log-odds is
//          ln(r_fwd/r_bwd) = (−(E_B+τ) + (E_B−τ))/T = (−2τ)/T  ← also linear in 1/T.
//      Cold: the wheel creeps forward decisively. Hot: it jitters net-zero.
//
//  THE COLLAPSE. Both log-odds are lines through the origin (T→∞ ⇒ 50/50), so the
//  ONLY freedom is the slope. The mind's slope is GAP; the gas's slope is −2τ. Set
//  −2τ = GAP (i.e. τ = −GAP/2 = −0.65) and the two lines are the SAME line, to
//  machine precision, for EVERY T. That is the whole game: tune one knob to make a
//  gas's hop-bias the mirror of a model's word-split. It is GENUINE, not a fudge —
//  open mismatched (−2τ ≠ GAP) and the gas rides a SEPARATE ray that visibly fans
//  apart; the gap |Δ| = |GAP − (−2τ)|/T GROWS with 1/T (the rays diverge), so the
//  coincidence is the TUNING, never a tautology.
//
//  THE FORM (form expresses content). A brass-and-glass antique instrument. LEFT
//  bay = the mind (two glass cylinders 'the' & 'on' filling to softmax(LOGITS,T)).
//  RIGHT bay = the gas (a toothed brass wheel spinning ∝ r_fwd−r_bwd, history-free).
//  ONE thermostat bead rides a capillary that pierces the dividing mullion — the
//  same object seen through both windows; you cannot drag them apart. A plumb-line
//  drops from the bead into a gold-ray panel landing on x = 1/T, where a cool-blue
//  MIND marker (GAP/T) and an ember-red GAS marker (−2τ/T) ride their rays. Tune
//  −2τ to the gap and they SNAP onto one gold Boltzmann line.
//
//  THE NEGATIVE CONTROL (the differentiator, load-bearing). A knife-switch swaps
//  softmax's exp for a NON-Boltzmann normalizer p_i ∝ (z_i/T + c). Its log-odds is
//  ln((z_a/T+c)/(z_b/T+c)) — NOT linear in 1/T, so the blue marker's trajectory
//  BENDS off the straight ray and NO τ can ever align a bent curve with a straight
//  one. The point: it is the EXPONENTIAL e^(−E/T) — shared by softmax and Arrhenius
//  — that makes T the same dial, not the apparatus.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for
//  their own physics; this module IMPORTS them byte-untouched (native ES, resolved
//  by the browser as modules — BOTH two ../ hops, since cross/<leaf>/ is one dir
//  deeper than a top-level bench), so the imports sit ABOVE the CORE region and are
//  NOT part of the byte-twin slab. The adapter below is the ONLY new logic and
//  re-types NO exponential: the exp() lives ONLY in the imported oracles. index.html
//  inlines this whole CORE region byte-identically between the same sentinels; the
//  byte-twin parity leg proves the page IS this module, char-for-char.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. MIND LINEARITY  — mindLogOdds(T) === GAP/T to <1e-9 over T∈{0.25..4}
//       (worst measured 2.22e-16): the word-split log-odds is exactly Boltzmann.
//    2. GAS LINEARITY   — gasLogOdds(T, tunedTau()) === (−2·tunedTau())/T to <1e-9
//       (worst 1.67e-16): the hop-bias log-odds is exactly Boltzmann too.
//    3. COINCIDENCE     — |mindLogOdds − gasLogOdds(tuned)| < 1e-9 across the sweep
//       (worst 1.67e-16): with −2τ = GAP the two lines ARE one line.
//    4. MISMATCH IS REAL (non-vacuous) — with −2τ ≠ GAP the |Δ| is nonzero AND
//       GROWS with 1/T (the rays genuinely fan), so coincidence is the tuning.
//    5. NEG-CONTROL WITH TEETH — nonBoltzmannLogOdds(T)·T is NOT constant (spread
//       over the sweep ≥ 1e-2), so a vacuous "always linear in 1/T" checker FAILS.
//    6. ANTI-CIRCULARITY — the mind/gas log-odds path names no 'Math.exp' / softmax
//       body; the exponential lives ONLY in the imports; the MIND adapter names no
//       brownian symbol and the GAS adapter names no softmax symbol.
//    7. BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE
//       char-for-char.
// ============================================================================

import { softmax, LOGITS } from '../../clockwork/core.mjs';            // CORE A oracle (the mind)
import { symmetricRates, E_B } from '../../engine-room/brownian/core.mjs'; // CORE B oracle (the gas)

// === CORE BEGIN ===
"use strict";

// ══ THE TWO TOKENS — 'the' vs 'on' in the frozen toy vocabulary ════════════════════════════════════
// LOGITS = [3.4('the'),0.7,0.2,2.1('on'),2.9,...] — see clockwork/core.mjs. A_IDX/B_IDX pick the
// pair whose split we read; GAP = z_a − z_b = 1.3 is the mind's Boltzmann slope (the logit gap).
const A_IDX = 0, B_IDX = 3;                                   // 'the' vs 'on'
const GAP = LOGITS[A_IDX] - LOGITS[B_IDX];                    // = 1.3 (z_'the' − z_'on')

// tunedTau(): the load τ at which the gas's slope −2τ equals the mind's slope GAP. Set −2τ = GAP ⇒
// τ = −GAP/2 = −0.65: at this τ the two log-odds lines coincide for EVERY T (the merge).
const tunedTau = () => -GAP / 2;                              // −2·tunedTau() === GAP ⇒ rays coincide

// ══ THE MIND ADAPTER — reads softmax LIVE; the exp() lives in the imported oracle, never here ══════
// ─ MIND-ADAPTER BEGIN ─
// mindLogOdds(T): the model's word-split log-odds ln(p_'the'/p_'on'). Because p_i ∝ e^(z_i/T) the
// ratio's exponentials cancel to (z_a − z_b)/T = GAP/T — EXACTLY linear in 1/T. Cold T spikes to
// 'the'; hot T → 50/50 (log-odds → 0). The exp is inside softmax(); this fn only takes a ratio's log.
function mindLogOdds(T){
  const p = softmax(LOGITS, T);
  return Math.log(p[A_IDX] / p[B_IDX]);
}
// nonBoltzmannLogOdds(T, c): the NEG-CONTROL. Swap softmax's exp for a LINEAR mix p_i ∝ (z_i/T + c).
// The log-odds ln((z_a/T+c)/(z_b/T+c)) is NOT linear in 1/T — multiply by T and it is NOT constant —
// so the blue marker BENDS off the straight ray and no τ can align a bent curve with a straight one.
function nonBoltzmannLogOdds(T, c = 10){
  const za = LOGITS[A_IDX] / T, zb = LOGITS[B_IDX] / T;      // the raw scaled logits (no exp)
  return Math.log((za + c) / (zb + c));                       // a non-exponential normalizer ⇒ bends
}
// ─ MIND-ADAPTER END ─

// ══ THE GAS ADAPTER — reads the ratchet's single-bath rates LIVE; the exp() lives in the oracle ════
// ─ GAS-ADAPTER BEGIN ─
// gasLogOdds(T, tau): the ratchet's hop-bias log-odds ln(r_fwd/r_bwd). With r_fwd = e^(−(E_B+τ)/T)
// and r_bwd = e^(−(E_B−τ)/T) the barrier E_B cancels and the load doubles: (−(E_B+τ)+(E_B−τ))/T =
// (−2τ)/T — EXACTLY linear in 1/T. Cold T drives a decisive bias; hot T → net zero (log-odds → 0).
function gasLogOdds(T, tau){
  const r = symmetricRates(T, tau, E_B);
  return Math.log(r.r_fwd / r.r_bwd);
}
// gasRate(T, tau): the live forward/backward rates, for the wheel's HISTORY-FREE idle spin — the
// wheel renders the CURRENT angular velocity ∝ (r_fwd − r_bwd), never an accumulating odometer.
function gasRate(T, tau){
  return symmetricRates(T, tau, E_B);                         // { r_fwd, r_bwd }
}
// ─ GAS-ADAPTER END ─

// ══ THE BOLTZMANN LINE — the one ray both markers ride when tuned ═══════════════════════════════════
// boltzmannLine(invT): the master ray, slope GAP through the origin (T→∞ ⇒ invT=0 ⇒ 50/50). Both
// mindLogOdds and gasLogOdds(tuned) sit on it; the bronze (mistuned) ray has slope −2τ ≠ GAP and fans.
function boltzmannLine(invT){ return GAP * invT; }

// the softmax token split at T, for the LEFT bay's two glass cylinders (live levels of 'the' & 'on').
function tokenSplit(T){ const p = softmax(LOGITS, T); return { the: p[A_IDX], on: p[B_IDX], p }; }

// the temperature window the bead rides and the test sweeps. TIGHT enough that both the cold-spike and
// the hot-flatten endpoints are reachable in one short throw: T∈[0.25,4] ⇒ 1/T∈[0.25,4].
const T_LO = 0.25, T_HI = 4;
const SWEEP = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const tau = tunedTau();

  // LEG 1 — MIND LINEARITY: the word-split log-odds is EXACTLY Boltzmann, ln(p_a/p_b) === GAP/T to
  // <1e-9 over the sweep (worst ~2.22e-16). The model's split is the exponential law, dead linear in 1/T.
  {
    let worst = 0, worstT = 0;
    for (const T of SWEEP){
      const d = Math.abs(mindLogOdds(T) - GAP / T);
      if (d > worst){ worst = d; worstT = T; }
    }
    ck('1 · mind linearity: ln(p_the/p_on) === GAP/T over T∈[0.25,4] < 1e-9 (the model split is Boltzmann)',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at T=' + worstT);
  }

  // LEG 2 — GAS LINEARITY: the hop-bias log-odds is EXACTLY Boltzmann too, ln(r_fwd/r_bwd) ===
  // (−2τ)/T to <1e-9 at the tuned τ (worst ~1.67e-16). The ratchet bias is the SAME exponential law.
  {
    let worst = 0, worstT = 0;
    for (const T of SWEEP){
      const d = Math.abs(gasLogOdds(T, tau) - (-2 * tau) / T);
      if (d > worst){ worst = d; worstT = T; }
    }
    ck('2 · gas linearity: ln(r_fwd/r_bwd) === (−2τ)/T over T∈[0.25,4] < 1e-9 (the ratchet bias is Boltzmann)',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at T=' + worstT);
  }

  // LEG 3 — COINCIDENCE: with −2τ = GAP the two log-odds ARE one line, |mind − gas(tuned)| < 1e-9
  // across the whole sweep (worst ~1.67e-16). One bead, one heat — a mind's split is a gas's bias.
  {
    let worst = 0, worstT = 0;
    for (const T of SWEEP){
      const d = Math.abs(mindLogOdds(T) - gasLogOdds(T, tau));
      if (d > worst){ worst = d; worstT = T; }
    }
    ck('3 · coincidence: |mindLogOdds − gasLogOdds(tuned)| < 1e-9 over the sweep (−2τ===GAP ⇒ one Boltzmann line)',
       worst < 1e-9 && Math.abs(-2 * tau - GAP) < 1e-12,
       'worst=' + worst.toExponential(2) + ' at T=' + worstT + ' · −2τ=' + (-2 * tau).toFixed(4) + ' GAP=' + GAP.toFixed(4));
  }

  // LEG 4 — MISMATCH IS REAL (non-vacuous): with −2τ ≠ GAP (use τ such that −2τ = 0.8) the gap |Δ| is
  // nonzero AND GROWS with 1/T (the rays genuinely FAN), so the coincidence is the tuning, not a
  // tautology. |Δ| = |GAP − 0.8|/T = 0.5/T — strictly increasing as T falls.
  {
    const tauMis = -0.4;                                       // −2·tauMis = 0.8 ≠ GAP
    let nonzero = true, growsIn1overT = true, prev = -Infinity, minGap = Infinity;
    // sweep T DESCENDING so 1/T ASCENDS; |Δ| must be strictly increasing.
    const desc = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
    for (const T of desc){
      const d = Math.abs(mindLogOdds(T) - gasLogOdds(T, tauMis));
      if (d <= prev) growsIn1overT = false;                   // strictly rising as 1/T rises
      if (!(d > 1e-6)) nonzero = false;
      minGap = Math.min(minGap, d);
      prev = d;
    }
    ck('4 · mismatch is real: −2τ ≠ GAP ⇒ |Δ| nonzero AND grows with 1/T (the rays fan — coincidence is the tuning)',
       nonzero && growsIn1overT, 'minGap=' + minGap.toExponential(2) + ' grows-in-1/T=' + growsIn1overT);
  }

  // LEG 5 — NEG-CONTROL WITH TEETH: a non-Boltzmann normalizer is NOT linear in 1/T — nonBoltzmann·T
  // is NOT constant (spread ≥ 1e-2 over the sweep), so a vacuous "always linear" checker FAILS the
  // bent curve. (A correct Boltzmann log-odds ·T IS constant = GAP — that's exactly what bends here.)
  {
    const vals = SWEEP.map(T => nonBoltzmannLogOdds(T) * T);
    const spread = Math.max(...vals) - Math.min(...vals);
    // sanity: the TRUE mind log-odds ·T is constant (== GAP) — the control bends, the law does not.
    const trueVals = SWEEP.map(T => mindLogOdds(T) * T);
    const trueSpread = Math.max(...trueVals) - Math.min(...trueVals);
    ck('5 · neg-control teeth: nonBoltzmann·T is NOT constant (spread ≥ 1e-2) while Boltzmann·T === GAP (a vacuous "always linear" checker fails)',
       spread >= 1e-2 && trueSpread < 1e-9,
       'nonB·T spread=' + spread.toExponential(2) + ' · Boltzmann·T spread=' + trueSpread.toExponential(2) + ' (===GAP)');
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  A_IDX, B_IDX, GAP, tunedTau, T_LO, T_HI, SWEEP,
  mindLogOdds, gasLogOdds, gasRate, nonBoltzmannLogOdds, boltzmannLine, tokenSplit,
  runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Same Heat — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
