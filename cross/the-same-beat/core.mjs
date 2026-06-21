// ============================================================================
//  THE SAME BEAT — a clock PENDULUM and a singing WINE GLASS keep one law. Logic core.
//
//  THE ONE IDEA. There is exactly ONE oscillator law, ω = √(stiffness ÷ inertia),
//  worn in two costumes that never met. A seconds-pendulum's beat is set by
//  ω = √(G/L) — gravity is the stiffness, the rod length L the inverse-stiffness
//  knob (long rod ⇒ soft ⇒ slow). A wine-glass rim's mode-2 breathing is set by
//  ω₀ = √(k_eff/m_eff) — the rim's flexural stiffness over its modal mass. Both are
//  the SAME √. So ONE master dial L drives BOTH bays: it lengthens the rod AND sets
//  the glass's natural frequency to ω₀ = √(G/L). Tune the glass to the rod's beat
//  and both ride the SAME point on one gold √-ray — one frequency, two confessions.
//
//    • THE PENDULUM (hours/escapement/core.mjs — "The Escapement"). For small swings
//      T = 2π√(L/G), with NO θ₀ in it — that absence IS isochronism: widen the swing,
//      the beat is unchanged. So ω = 2π/T = √(G/L), dead independent of amplitude.
//      The wide-swing TRUTH is elliptic: T(θ₀)=4√(L/G)·K(sin θ₀/2), strictly slower.
//
//    • THE GLASS (resonance/core.mjs — "The Singing Glass"). A driven, damped rim mode
//      ẍ + γẋ + ω₀²x = (F/m)cos ωt. Its steady amplitude A(ω) peaks at ω₀ and the lag
//      δ runs 0 → π/2 → π through resonance. We set ω₀ ON the ray: ω₀ = √(G/L). Drive
//      it AT ω₀ and the rim breathes wide with a quarter-turn lag; drive OFF and it
//      collapses toward the quasi-static floor with the lag fleeing 0.
//
//  THE COINCIDENCE. ω₀ (glass) and √(G/L) (pendulum) are the SAME number by the SAME
//  √(stiffness/inertia) law, for EVERY L. One ray, two markers, one point of light.
//  It is GENUINE, not a fudge: the negative controls BREAK the law in BOTH costumes —
//  crank the pendulum's θ₀ and the elliptic period peels off the ideal beat (the warm
//  marker slides DOWN off the ray); drive the glass off ω₀ and the amplitude collapses
//  and the phase leaves π/2. The √-limit, not the apparatus, makes them one beat.
//
//  THE FORM (form expresses content). A two-bay brass diorama. LEFT bay = the rod
//  itself swinging (the brass shaft + bob, an escape-wheel flicking a tooth per beat),
//  NOT a plotted curve. RIGHT bay = the wine-glass rim breathing its mode-2 ellipse,
//  R(θ)=R₀(1+disp·cos2θ), the EXACT form from resonance/index.src.html. CENTER = one
//  gold √-ray, screen-x linear in ω, two jewels riding it (a WARM rod marker, a COOL
//  glass marker). Set the dial + tune the glass and both pin to one tick.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for their
//  own physics; this module IMPORTS them byte-untouched (native ES modules, BOTH two
//  ../ hops, since cross/<leaf>/ is one dir deeper than a top-level bench), so the
//  imports sit ABOVE the CORE region and are NOT part of the byte-twin slab. The two
//  adapters below are code-DISJOINT (the escapement block names no resonance fn, the
//  glass block names no escapement fn — a grep assertion in the Node twin) and re-type
//  NO √(G/L): the pendulum ω is DERIVED from the exported PERIOD, then asserted equal
//  to √(G/L); the glass ω₀ is SET on the ray with no 2π / ½ factor smuggled in.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. SAME RAY — |glassPoint(L).omega0 − pendulumPoint(L).omegaRay| < 1e-9 AND
//       |pendulumPoint(L).omega − √(G/L)| < 1e-9 over an L sweep (worst ~8.9e-16):
//       both costumes ride ONE √-ray.
//    2. ISOCHRONISM — periodIdeal takes NO θ₀, so pendulumPoint(L,θ₀).Tideal is
//       identical across θ₀∈[0.5°,89°] for fixed L (variance === 0).
//    3. CONVENTION-HONESTY (byte-exact ===) — glassPoint(L).w0 === √(E.G/L) AND
//       pendulumPoint(L).omega === 2π/periodIdeal(L): no smuggled factor either side.
//    4. NEG-CONTROL ROD — pendulumPoint(L,80°).driftRatio > 1.05 (the elliptic period
//       runs slow), strictly increasing in θ₀, → 1 as θ₀ → 0 (anti-vacuity).
//    5. NEG-CONTROL GLASS — glassDriven(L, 0.4·ω₀).amp < ampAtRes/8 AND .phase < 0.05
//       (in-step collapse toward the static floor); AND phaseAtRes === π/2 EXACTLY.
//    6. BYTE-TWIN PARITY (Node twin) — index.html CORE === core.mjs CORE char-for-char,
//       and the two adapters are code-disjoint by grep.
// ============================================================================

import * as E from '../../hours/escapement/core.mjs';   // PERIOD authority (the pendulum)
import * as R from '../../resonance/core.mjs';          // ω₀-as-param authority (the glass)

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED CONSTANTS — lifted from the escapement parent, never re-typed ════════════════════════
const G = E.G;                                                  // standard gravity (m/s²), from the parent
const TWO_PI = 2 * Math.PI;
const { LMIN, LMAX, THETA0_MIN, THETA0_MAX } = E.LIMITS;       // the rod-length + amplitude knob ranges

// omegaRay(L): THE √-RAY — ω = √(G/L). This is the x-axis the diorama is built on. It is the SAME
// √(stiffness/inertia) the pendulum beats by (G=stiffness, L=inverse-stiffness) and the glass sings
// by (ω₀ set on it). The master dial is L ∈ [LMIN,LMAX]; one knob → BOTH bays; readout √(G/L).
function omegaRay(L){ return Math.sqrt(G / L); }

// the L sweep the self-test walks (a fine step so the coincidence is checked at many lengths).
const L_LO = LMIN, L_HI = LMAX;
function lSweep(){ const xs = []; for (let L = LMIN; L <= LMAX + 1e-12; L += 0.0137) xs.push(L); return xs; }

// ══ THE ESCAPEMENT ADAPTER — reads the rod's exported PERIOD; ω is DERIVED from it, never re-typed ══
// ─ ESCAPEMENT-ADAPTER BEGIN ─
// pendulumPoint(L, theta0): the rod's reading at length L and swing amplitude θ₀. The ideal beat
// ω = 2π / periodIdeal(L) is DERIVED FROM THE EXPORTED PERIOD (convention bridge #1: ω from the period,
// never re-typed √(G/L)); omegaRay(L) is the same number by √(G/L). Tideal is amplitude-BLIND (no θ₀ —
// isochronism); Treal is the elliptic finite-amplitude period (runs slow); driftRatio = Treal/Tideal.
function pendulumPoint(L, theta0){
  const Tideal = E.periodIdeal(L);                 // the parent's small-angle period 2π√(L/G)
  const Treal  = E.periodReal(theta0, L);          // the parent's exact elliptic period (≥ Tideal)
  return {
    L, theta0,
    omega: TWO_PI / Tideal,                         // ω DERIVED from the exported PERIOD (bridge #1)
    omegaRay: omegaRay(L),                          // the √-ray coordinate (= ω, asserted equal)
    Tideal, Treal,
    driftRatio: Treal / Tideal,                     // > 1 at wide swing; → 1 as θ₀ → 0
  };
}
// ─ ESCAPEMENT-ADAPTER END ─

// ══ THE GLASS ADAPTER — sets ω₀ ON the ray; the resonance core owns A(ω) and δ(ω) ══════════════════
// ─ GLASS-ADAPTER BEGIN ─
// glassPoint(L, gamma, Fm): the rim's reading. ω₀ is SET ON THE RAY — w0 = omegaRay(L) — with NO 2π
// and NO ½ factor (convention bridge #2: ω₀ set on the ray, no smuggled scale). The resonance core's
// own closed forms give the on-ω₀ amplitude and the π/2 lag. p carries the driven-oscillator params.
function glassPoint(L, gamma = 0.06, Fm = 1.0){
  const w0 = omegaRay(L);
  const p = { w0, gamma, Fm };
  return {
    L, w0, p,
    omega0: w0,
    omegaRay: omegaRay(L),                          // identical to w0 by construction (the same ray)
    ampAtRes: R.ampClosed(w0, p),                    // the rim's steady amplitude driven AT ω₀
    phaseAtRes: R.phaseClosed(w0, p),                // = π/2 EXACTLY at ω₀ (the resonance signature)
  };
}
// glassDriven(L, omegaDrive, gamma, Fm): drive the rim OFF ω₀ — the neg-control. Far below ω₀ the
// amplitude collapses toward the quasi-static floor and the lag flees 0 (the rim shivers in step).
function glassDriven(L, omegaDrive, gamma = 0.06, Fm = 1.0){
  const p = { w0: omegaRay(L), gamma, Fm };
  return {
    omegaDrive,
    amp: R.ampClosed(omegaDrive, p),
    phase: R.phaseClosed(omegaDrive, p),
  };
}
// tuneToBeat(L, targetAmp, gamma, Fm): use the PARENT'S OWN solver to land/confirm the resonance peak
// on the beat. bisectAmp searches ω∈[0.3·ω₀, ω₀] for where A crosses targetAmp; the peak sits on the
// ray, so the glass's own solver confirms the coincidence rather than us asserting it.
function tuneToBeat(L, targetAmp, gamma = 0.06, Fm = 1.0){
  const w0 = omegaRay(L);
  const p = { w0, gamma, Fm };
  return R.bisectAmp(p, targetAmp, 0.3 * w0, w0);
}
// ─ GLASS-ADAPTER END ─

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const Ls = lSweep();

  // LEG 1 — SAME RAY: both costumes ride ONE √-ray. The glass's ω₀ equals the pendulum's √(G/L)
  // coordinate, AND the pendulum's DERIVED ω (2π/Tideal) equals √(G/L), to < 1e-9 over the L sweep.
  {
    let worst = 0, worstL = 0;
    for (const L of Ls){
      const pen = pendulumPoint(L, 10 * Math.PI / 180);
      const gla = glassPoint(L);
      const d1 = Math.abs(gla.omega0 - pen.omegaRay);
      const d2 = Math.abs(pen.omega - omegaRay(L));
      const d = Math.max(d1, d2);
      if (d > worst){ worst = d; worstL = L; }
    }
    ck('1 · same ray: |ω₀_glass − √(G/L)| AND |ω_pendulum − √(G/L)| < 1e-9 over L∈[LMIN,LMAX] (both costumes ONE √-ray)',
       worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at L=' + worstL.toFixed(4));
  }

  // LEG 2 — ISOCHRONISM by construction: periodIdeal takes NO θ₀, so Tideal is IDENTICAL across a wide
  // band of θ₀ at fixed L (variance === 0). The ideal beat literally cannot read the amplitude.
  {
    const L = 1.0;
    const thetas = [0.5, 10, 30, 60, 89].map(d => d * Math.PI / 180);
    const tids = thetas.map(th => pendulumPoint(L, th).Tideal);
    const v = tids.map(t => Math.abs(t - tids[0]));
    const maxDev = Math.max(...v);
    ck('2 · isochronism: pendulumPoint(L,θ₀).Tideal identical across θ₀∈[0.5°,89°] (periodIdeal has NO θ₀ — variance===0)',
       maxDev === 0, 'maxDev=' + maxDev + ' over 5 amplitudes at L=' + L);
  }

  // LEG 3 — CONVENTION-HONESTY (byte-exact ===): no smuggled factor either side. The glass's w0 is
  // EXACTLY √(E.G/L); the pendulum's ω is EXACTLY 2π/periodIdeal(L). Proves the ray is the genuine law.
  {
    let ok = true, witness = '';
    for (const L of Ls){
      const wg = glassPoint(L).w0, want = Math.sqrt(E.G / L);
      const wp = pendulumPoint(L, 0.2).omega, wantP = TWO_PI / E.periodIdeal(L);
      if (!(wg === want && wp === wantP)){ ok = false; witness = 'L=' + L.toFixed(4); break; }
    }
    ck('3 · convention honesty (===): glassPoint(L).w0 === √(E.G/L) AND pendulumPoint(L).omega === 2π/periodIdeal(L) (no smuggled factor)',
       ok, ok ? 'byte-exact over the sweep' : 'FAILS at ' + witness);
  }

  // LEG 4 — NEG-CONTROL ROD: at a wide swing the elliptic period runs SLOW. driftRatio(80°) > 1.05,
  // strictly increasing in θ₀, and → 1 as θ₀ → 0 (anti-vacuity). The marker peels off the ray.
  {
    const L = 1.0;
    const wide = pendulumPoint(L, 80 * Math.PI / 180).driftRatio;
    // strictly increasing in θ₀
    const seq = [5, 20, 40, 60, 80].map(d => pendulumPoint(L, d * Math.PI / 180).driftRatio);
    let monotone = true; for (let i = 1; i < seq.length; i++) if (!(seq[i] > seq[i-1])) monotone = false;
    // → 1 as θ₀ → 0 (anti-vacuity)
    const tiny = pendulumPoint(L, 0.5 * Math.PI / 180).driftRatio;
    ck('4 · neg-control rod: driftRatio(80°) > 1.05, strictly increasing in θ₀, → 1 as θ₀→0 (the elliptic period peels off — anti-vacuity)',
       wide > 1.05 && monotone && Math.abs(tiny - 1) < 1e-4,
       'drift(80°)=' + wide.toFixed(4) + ' monotone=' + monotone + ' drift(0.5°)=' + tiny.toFixed(7));
  }

  // LEG 5 — NEG-CONTROL GLASS: drive OFF ω₀ (at 0.4·ω₀) and the rim collapses — amp < ampAtRes/8 AND
  // the lag flees toward 0 (< 0.05 rad, in-step shiver toward the static floor). AND at ω₀ the lag is
  // EXACTLY π/2 (the resonance signature). The √-limit, not the apparatus.
  {
    let ok = true, witness = '';
    for (const L of [0.5, 1.0, 1.5]){
      const g = glassPoint(L);
      const off = glassDriven(L, 0.4 * g.w0);
      const collapsed = off.amp < g.ampAtRes / 8;
      const inStep = off.phase < 0.05;
      const quarter = Math.abs(g.phaseAtRes - Math.PI / 2) < 1e-12;
      if (!(collapsed && inStep && quarter)){ ok = false; witness = 'L=' + L; break; }
    }
    // report the worst ratio/phase witnessed at L=1
    const g1 = glassPoint(1.0); const off1 = glassDriven(1.0, 0.4 * g1.w0);
    ck('5 · neg-control glass: off-ω₀ amp < ampAtRes/8 AND phase < 0.05 (in-step collapse) AND phaseAtRes === π/2 exactly',
       ok, ok ? 'ampRatio=' + (off1.amp / g1.ampAtRes).toExponential(2) + ' offPhase=' + off1.phase.toFixed(4) + ' resPhase=π/2'
              : 'FAILS at ' + witness);
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  G, TWO_PI, LMIN, LMAX, THETA0_MIN, THETA0_MAX, L_LO, L_HI,
  omegaRay, lSweep,
  pendulumPoint, glassPoint, glassDriven, tuneToBeat,
  runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Same Beat — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
