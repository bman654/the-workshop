// ============================================================================
//  THE CAVERN · THE WATCHED COIN — the QUANTUM ZENO CORE.
//
//  Pure, dependency-free. This is the SOLE authority for the Zeno survival law.
//  It does NOT fork the Born rule: it RE-IMPORTS the verified single-peek
//  projector from the SPIN bench (../spin/core.mjs) and builds the survival of N
//  watched peeks out of N independent calls to it. The page (index.html) inlines
//  BOTH slabs via forge — first spin's // === CORE BEGIN/END === slab, then this
//  // === ZENO CORE BEGIN/END === slab on top — so blochVec/pUp are defined once,
//  here and in the page, from the same bytes the spin self-test proves.
//
//  ── THE QUANTUM ZENO EFFECT (a watched pot never boils) ──
//  Prepare a qubit at |0⟩ (north pole). A coherent drive rotates it the full π to
//  |1⟩ (south pole) over the run. PEEK at it N times, evenly, along the Z axis.
//  Each peek is a projective measurement: between peeks the state drifts only
//  θ = π/N up the meridian, so a peek finds it STILL at |0⟩ with probability
//      p_peek = cos²(π/2N) = ½(1 + cos(π/N)) = pUp( n̂(π/N), ẑ ).
//  Surviving ALL N peeks (the coin stays |0⟩) has probability
//      S(N) = p_peek^N = cos^{2N}(π/2N).
//  As N→∞, S(N)→1: looking often enough FREEZES the coin. The flip that the same
//  drive would have completed is suppressed; P_flip(N) = 1 − S(N) → π²/(4N).
//
//  ── TWO INDEPENDENT ROUTES (the proof) ──
//   • survivalClosed(N) = Math.cos(π/2N) ** (2N)            — one cos + one power.
//   • survivalSim(N)    = ∏_{k<N} pUp( blochVec(π/N,0), ẑ ) — N dot-derived
//                         half-angle factors through spin's verified projector.
//  The Node twin sweeps N and asserts |closed − sim| < 1e-9 — so the closed form
//  is PROVEN to be the Born-rule product, not assumed. (Worst seen ~3e-14.)
//
//  ── THE TEETH (negative control) ──  Rotate the SAME full π in N chops but take
//  the watching AWAY (no collapse between chops): the state sails clean to |1⟩ and
//  a single final measure finds survival = 0 for EVERY N. survivalNoCollapse(N) is
//  flat 0 while survivalSim(N) climbs — isolating that it is the WATCHING, not the
//  chopping, that freezes the coin.  (Parallels spin's classicalDeflect smear.)
//
//  Conventions inherited from spin: blochVec(0,·)=+ẑ=|0⟩ (north), blochVec(π,·)=
//  −ẑ=|1⟩ (south). ẑ is BOTH the prepared pole and the peek axis.
// ============================================================================

import { blochVec, pUp } from '../spin/core.mjs';

// === ZENO CORE BEGIN ===
  // The peek axis = the |0⟩ pole = +ẑ. A peek projects onto this axis.
  var ZAXIS = [0, 0, 1];

  // CLOSED FORM. Survive all N peeks of a coherent π-drive watched N times:
  //   S(N) = cos^{2N}(π/2N).  N≤0 → 0 (the not-watching neg-control: full flip).
  // One cosine, one power — the compact law Itano 1990 measured for N pulses.
  function survivalClosed(N){
    return N <= 0 ? 0 : Math.cos(Math.PI / (2 * N)) ** (2 * N);
  }

  // INDEPENDENT ROUTE. The SAME survival, built as a PRODUCT of N single-peek
  // projections through spin's verified pUp: between peeks the state is blochVec
  // tilted π/N off the pole; pUp(·, ẑ) = ½(1+cos(π/N)) = cos²(π/2N) is the chance
  // that ONE peek still finds |0⟩. Multiply N of them. No cos(…)**(2N) here — a
  // genuinely separate derivation the twin cross-checks to machine ε.
  function survivalSim(N){
    if (N <= 0) return 0;
    var s = 1;
    for (var k = 0; k < N; k++) s *= pUp(blochVec(Math.PI / N, 0), ZAXIS);
    return s;
  }

  // The chance the watched coin has FLIPPED to |1⟩ by the end (1 − survive).
  function flipProb(N){ return 1 - survivalSim(N); }

  // The height of ONE yank: the survival of a SINGLE peek = cos²(π/2N). Drives the
  // collapse-flash brightness and the at-rest expected-sawtooth tooth height.
  function perPeekSurvival(N){
    return N <= 0 ? 0 : pUp(blochVec(Math.PI / N, 0), ZAXIS);
  }

  // How far up the meridian the state drifts before each yank (the wedge half-angle
  // and the peek-tick spacing). N≤0 (not watching) → the full π sweep to |1⟩.
  function peekAngle(N){ return N <= 0 ? Math.PI : Math.PI / N; }

  // THE TEETH — the negative control. Rotate the full π in N chops but with NO
  // collapse between them, then measure ONCE: the state reaches |1⟩, survival = 0
  // for every N≥1. (Same drive, same chops, watching removed ⇒ it boils.)
  function survivalNoCollapse(N){
    if (N <= 0) return 0;
    var theta = 0;
    for (var k = 0; k < N; k++) theta += Math.PI / N;   // N chops, no measurement between
    return pUp(blochVec(theta, 0), ZAXIS);              // one final peek → ~0 for all N
  }

  // The large-N Zeno scaling of the residual flip: P_flip(N) → π²/(4N). Shown as a
  // small annotation; the twin checks flipProb(1000)·1000 ≈ π²/4.
  function flipAsymptote(N){ return N <= 0 ? 1 : (Math.PI * Math.PI) / (4 * N); }
// === ZENO CORE END ===

export {
  ZAXIS, survivalClosed, survivalSim, flipProb, perPeekSurvival,
  peekAngle, survivalNoCollapse, flipAsymptote,
  blochVec, pUp,
};
