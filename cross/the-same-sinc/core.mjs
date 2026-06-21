// ============================================================================
//  THE SAME SINC — a hard-edged SLIT's first dark fringe and a sampled TONE's first
//  spectral null are the SAME reciprocal 1/w, worn in two domains. Logic core.
//
//  THE ONE IDEA. A rectangle of half-width w has exactly ONE Fourier transform: a
//  sinc. Two benches that never met each read it through their own window, and each
//  sees its FIRST ZERO land at the SAME reciprocal coordinate 1/w.
//
//    • THE SLIT (cavern/uncertainty-slit/core.mjs — "The Squeeze"). A hard-edged
//      top-hat aperture A(x)=1 on |x|<w fans its far field into an INTENSITY
//      |Ã(k)|² = sinc²(k·w), sinc(t)=sin(t)/t. The first DARK fringe is where the
//      AMPLITUDE sinc(k·w) first crosses zero — at argument k·w = π, i.e. k₁ = π/w.
//      The slit "speaks in radians" (angular k): its null is at π/w.
//
//    • THE TONE (sampling-theorem/sampling-core.mjs — "The Sampling Theorem"). A
//      window of half-width w laid over a tone has the NORMALISED-sinc amplitude
//      envelope |sinc(f·w)|, sinc(x)=sin(πx)/(πx). Its first spectral NULL is where
//      that envelope first crosses zero — at argument f·w = 1, i.e. f₁ = 1/w. The
//      window "speaks in cycles" (ordinary frequency f): its null is at 1/w.
//
//  THE COINCIDENCE. The slit's first null k₁ = π/w and the window's first null
//  f₁ = 1/w are the SAME reciprocal once the slit's RADIAN null is divided by π:
//  (π/w)/π = 1/w = f₁, for EVERY w. ONE rectangle, ONE sinc, ONE first-zero at 1/w —
//  two costumes (light-squared vs the bare envelope) on the SAME x-mapping.
//
//  THE π, SURFACED — NEVER SMUGGLED. The lone factor that reconciles the two is a
//  single ÷π: the slit's null is in radians (π/w), the window's in cycles (1/w);
//  divide the slit's radian null by π and they are identical. That π is the costume
//  change, shown on the frame as a gold "÷π" gate — not hidden in a scale factor.
//  And it is DISCOVERED, not asserted: firstZeroArg scans each PARENT's OWN exported
//  sinc for its first sign change and returns the argument-zero. The slit's sinc has
//  its first zero at π; the window's normalised sinc at 1. We re-type neither — we
//  read them off the parents' functions, then divide the slit's by Math.PI exactly.
//
//  CRITICAL (the slit INTENSITY has a DOUBLE root). sinc²(k·w) TOUCHES zero at the
//  null without changing sign — bisecting the SQUARED intensity for a sign change is
//  unsound. So the slit null-locator brackets the first sign-change of the AMPLITUDE
//  SLIT.sinc(k·w) (which DOES cross), then the VISUAL renders intensity = that². We
//  never bisect the squared intensity.
//
//  THE FREE NEG-CONTROL — a tophat↔gauss knife-switch. The slit core also exports a
//  GAUSSIAN profile whose far field is exp(−2w²k²) — strictly positive, NO zeros. Flip
//  to 'gauss' and the slit's amber skin has NO first null at all: nothing to coincide
//  with. The window's teal null stays. The apparatus is unchanged — only the EDGES
//  changed — proving it is the rectangle's HARD edges, not the widget, that force 1/w.
//  An always-"coincident" checker FAILS this leg (anti-vacuity).
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for their
//  own sinc; this module IMPORTS them byte-untouched (native ES modules, BOTH two ../
//  hops, since cross/<leaf>/ is one dir deeper than a top-level bench), so the imports
//  sit ABOVE the CORE region and are NOT part of the byte-twin slab. The two adapters
//  below are code-DISJOINT (the slit block names no SAMP fn, the window block names no
//  SLIT fn — a grep assertion in the Node twin) and re-type NO sin/π inside the
//  locators except the ONE named ÷π that IS the surfaced reconciliation.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. SAME RAIL — |slitNullShared(w) − 1/w| AND |windowNullShared(w) − 1/w| AND
//       |slitNullShared(w) − windowNullShared(w)| all < 1e-9 over w∈[0.3,2.0]: both
//       first nulls land on the SAME reciprocal 1/w.
//    2. π RECONCILED, NOT SMUGGLED — SLIT_ARG0 === π and SAMP_ARG0 === 1 (both to
//       1e-6), DISCOVERED from the parents' own sinc; slitNullShared's only factor is
//       exactly that π.
//    3. NULL IS THE ORACLE'S — each firstZeroArg result plugged back into the parent's
//       OWN sinc returns ~0 there and >0 just inside (genuinely where it vanishes).
//    4. NEG-CONTROL GAUSS — slitHasNull('gauss')===false and SLIT.farFieldIntensity
//       ('gauss',w,k) > 0 over a dense k-sweep (never crosses zero) ⇒ no null to
//       coincide; a vacuous always-coincide checker FAILS this leg.
//    5. BYTE-TWIN PARITY + DISJOINTNESS (Node twin) — index.html CORE === core.mjs
//       CORE char-for-char, and the two adapters are code-disjoint by grep.
// ============================================================================

import * as SLIT from '../../cavern/uncertainty-slit/core.mjs';   // sinc, farFieldIntensity (the slit)
import * as SAMP from '../../sampling-theorem/sampling-core.mjs';  // sinc (normalised) (the window)

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED CONSTANTS — the half-width sweep both costumes are checked on ═════════════════════════
const W_MIN = 0.3, W_MAX = 2.0;     // the rectangle half-width knob range (one dial → both skins)

// recipRail(w): THE RECIPROCAL RAIL — u = 1/w. This is the shared x-axis the whole frame is built on.
// Both first nulls land on it; the live readout reads 1/w from HERE, never a re-typed literal.
function recipRail(w){ return 1 / w; }

// the w sweep the self-test walks (a fine step so the coincidence is checked at many half-widths).
function wSweep(){ const xs = []; for (let w = W_MIN; w <= W_MAX + 1e-12; w += 0.0137) xs.push(w); return xs; }

// firstZeroArg(sincFn): DISCOVER the argument of a sinc's FIRST positive zero from the PARENT's OWN
// function — never re-typed. sinc(0)=+1; step out in t until the value first goes ≤0 (a real sign
// change of the AMPLITUDE — sinc crosses, it does not merely touch), then bisect that bracket to the
// zero. Returns the argument-zero t₁ (= π for sin(t)/t, = 1 for sin(πx)/(πx)). The lone source of the
// shared nulls below, so the π and the 1 are provably the parents', not ours.
function firstZeroArg(sincFn){
  let prev = sincFn(0);                              // +1 at the origin
  const STEP = 1e-3;
  let a = 0, b = 0;
  for (let t = STEP; t <= 8; t += STEP){
    const cur = sincFn(t);
    if (prev > 0 && cur <= 0){ a = t - STEP; b = t; break; }   // first downward sign change
    prev = cur;
  }
  for (let i = 0; i < 80; i++){                       // bisect the sign-change bracket to the zero
    const m = 0.5 * (a + b);
    if (sincFn(a) * sincFn(m) <= 0) b = m; else a = m;
  }
  return 0.5 * (a + b);
}

// ══ THE SLIT ADAPTER — reads the slit's OWN amplitude sinc; the null is at (π/w)/π, the ONE ÷π ═══════
// ─ SLIT-ADAPTER BEGIN ─
// SLIT_ARG0: the first zero of the slit's amplitude sinc(t)=sin(t)/t, DISCOVERED from SLIT.sinc — it is
// π (radians). slitNullShared(w): the slit's far-field first DARK fringe at k₁ = SLIT_ARG0/w (radians),
// THEN divided by π — the ONE surfaced ÷π that turns the slit's radian null into the shared reciprocal
// 1/w. The slit "speaks in radians"; ÷π is the costume change, shown. slitHasNull(profile): a top-hat's
// hard edges give a true zero-crossing sinc; a Gaussian's far field exp(−2w²k²) never reaches zero, so
// it has NO null — the neg-control. (This block names NO SAMP symbol — code-disjoint by grep.)
const SLIT_ARG0 = firstZeroArg(SLIT.sinc);            // === π, discovered from the slit's own sinc
function slitNullShared(w){ return (SLIT_ARG0 / w) / Math.PI; }   // k₁/π — the ONE visible ÷π
function slitHasNull(profile){ return profile !== 'gauss'; }     // gauss far field exp(...) > 0 everywhere
// ─ SLIT-ADAPTER END ─

// ══ THE WINDOW ADAPTER — reads the window's OWN normalised sinc; the null is already at 1/w ══════════
// ─ WINDOW-ADAPTER BEGIN ─
// SAMP_ARG0: the first zero of the window's NORMALISED sinc(x)=sin(πx)/(πx), DISCOVERED from SAMP.sinc —
// it is 1 (cycle). windowNullShared(w): the sampled tone's amplitude envelope |sinc(f·w)| first spectral
// NULL at f₁ = SAMP_ARG0/w = 1/w — already a clean reciprocal (the window "speaks in cycles", no ÷π).
// We use the ANALYTIC envelope SAMP.sinc(w·f), NOT sampleTone/spectrum/FFT: the discrete DTFT Dirichlet
// kernel has a slightly different first null and an N-dependence — the analytic envelope is the honest
// continuous companion of the slit's continuous far field. (This block names NO SLIT symbol — disjoint.)
const SAMP_ARG0 = firstZeroArg(SAMP.sinc);           // === 1, discovered from the window's own sinc
function windowNullShared(w){ return SAMP_ARG0 / w; }            // f₁ = 1/w (no ÷π — cycles already)
function windowEnvelope(w, f){ return SAMP.sinc(w * f); }        // the analytic amplitude envelope (visual)
// ─ WINDOW-ADAPTER END ─

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const ws = wSweep();

  // LEG 1 — SAME RAIL: both first nulls land on ONE reciprocal 1/w. The slit's (π/w)/π and the
  // window's 1/w each equal 1/w, AND equal each other, to < 1e-9 over the w sweep.
  {
    let worst = 0, worstW = 0;
    for (const w of ws){
      const s = slitNullShared(w), wn = windowNullShared(w), rail = recipRail(w);
      const d1 = Math.abs(s - rail);
      const d2 = Math.abs(wn - rail);
      const d3 = Math.abs(s - wn);
      const d = Math.max(d1, d2, d3);
      if (d > worst){ worst = d; worstW = w; }
    }
    ck('1 · same rail: |slitNull − 1/w| AND |windowNull − 1/w| AND |slitNull − windowNull| < 1e-9 over w∈[0.3,2.0] (both first nulls ONE reciprocal)',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at w=' + worstW.toFixed(4));
  }

  // LEG 2 — π RECONCILED, NOT SMUGGLED: the two argument-zeros are DISCOVERED from the parents' OWN
  // sinc — the slit's is π, the window's is 1 — and slitNullShared's lone factor is exactly that π.
  {
    const piOk = Math.abs(SLIT_ARG0 - Math.PI) < 1e-6;
    const oneOk = Math.abs(SAMP_ARG0 - 1) < 1e-6;
    // the ÷π is the WHOLE reconciliation: slitNullShared(w)·π === SLIT_ARG0/w (the radian null), i.e. the
    // only factor between the slit's radian null and the shared rail is that single π — nothing else.
    let factorOk = true, witness = '';
    for (const w of ws){
      const radianNull = SLIT_ARG0 / w;               // k₁ in radians (the slit's native null)
      if (Math.abs(slitNullShared(w) * Math.PI - radianNull) > 1e-12){ factorOk = false; witness = 'w=' + w.toFixed(4); break; }
    }
    ck('2 · π reconciled, not smuggled: SLIT_ARG0===π AND SAMP_ARG0===1 (discovered from the parents\' sinc); the lone factor slit↔rail is exactly ÷π',
       piOk && oneOk && factorOk,
       'SLIT_ARG0=' + SLIT_ARG0.toFixed(9) + ' SAMP_ARG0=' + SAMP_ARG0.toFixed(9) + (factorOk ? ' · ÷π exact' : ' · factor FAILS at ' + witness));
  }

  // LEG 3 — NULL IS THE ORACLE'S: each discovered argument-zero, plugged back into the PARENT's own
  // sinc, returns ~0 there and >0 just inside — it is genuinely where the parent's function vanishes,
  // not a hand-placed tick. (Slit amplitude sinc and window normalised sinc, each on its own oracle.)
  {
    const sAt = Math.abs(SLIT.sinc(SLIT_ARG0)), sIn = SLIT.sinc(SLIT_ARG0 * 0.5);
    const wAt = Math.abs(SAMP.sinc(SAMP_ARG0)), wIn = SAMP.sinc(SAMP_ARG0 * 0.5);
    const ok = sAt < 1e-6 && sIn > 0.1 && wAt < 1e-6 && wIn > 0.1;
    ck('3 · null is the oracle\'s: SLIT.sinc(SLIT_ARG0)≈0 & >0 just inside, SAMP.sinc(SAMP_ARG0)≈0 & >0 just inside (a real zero of the parent, not a placed tick)',
       ok, 'slit |sinc(π)|=' + sAt.toExponential(2) + ' sinc(π/2)=' + sIn.toFixed(4) + ' · win |sinc(1)|=' + wAt.toExponential(2) + ' sinc(0.5)=' + wIn.toFixed(4));
  }

  // LEG 4 — NEG-CONTROL GAUSS: flip the slit to a Gaussian profile and its far field exp(−2w²k²) is
  // strictly positive across the bench window where the tophat's first dark fringe lives, and NEVER goes
  // negative anywhere (it only decays toward 0 asymptotically, monotonically — no zero CROSSING). So
  // slitHasNull('gauss')===false: there is NO null to coincide with. (We assert positivity across the
  // visible window — out past k·w ≳ 26 the double-precision exp UNDERFLOWS to 0.0, a representation
  // limit, not a sign change; the discriminating facts are: never negative, monotone-decreasing, and
  // strictly positive where the tophat's null actually sits.) A vacuous always-coincide checker FAILS
  // here. The hard EDGES, not the widget, force 1/w.
  {
    const noNull = slitHasNull('gauss') === false;
    let everNegative = false, monotone = true, posInWindow = true, minWindowI = Infinity, witnessW = 0;
    for (const w of [0.3, 0.7, 1.0, 1.5, 2.0]){
      const k1 = SLIT_ARG0 / w;                        // the tophat's first dark fringe for this w
      const kWindow = 4 * k1;                          // a few lobes past it — the visible far-field band
      let prev = SLIT.farFieldIntensity('gauss', w, 0);
      for (let k = 0; k <= kWindow; k += kWindow / 600){
        const I = SLIT.farFieldIntensity('gauss', w, k);
        if (I < 0) everNegative = true;                // never crosses below zero (it's an exp)
        if (I > prev + 1e-15) monotone = false;        // strictly non-increasing in |k| (a bell)
        if (I <= 0){ posInWindow = false; }            // strictly positive across the visible window
        if (I < minWindowI){ minWindowI = I; witnessW = w; }
        prev = I;
      }
    }
    // tophat DOES have a null (sanity: the control is discriminating, not always-true)
    const tophatHasNull = slitHasNull('tophat') === true;
    ck('4 · neg-control gauss: slitHasNull(\'gauss\')===false — exp(−2w²k²) never negative, monotone, >0 across the visible window (NO zero-crossing ⇒ NO null; a vacuous always-coincide checker FAILS)',
       noNull && !everNegative && monotone && posInWindow && tophatHasNull,
       'never<0=' + (!everNegative) + ' monotone=' + monotone + ' min-in-window=' + minWindowI.toExponential(2) + ' (>0, at w=' + witnessW.toFixed(2) + ') · tophat has a null=' + tophatHasNull);
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  W_MIN, W_MAX,
  recipRail, wSweep, firstZeroArg,
  SLIT_ARG0, SAMP_ARG0,
  slitNullShared, windowNullShared, slitHasNull, windowEnvelope,
  runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Same Sinc — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
