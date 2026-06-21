// The Heaviest Dwarfs Are the Smallest — logic core (a size you can weigh).
//
// THE WHOLE POINT: your gut says "more mass ⇒ bigger." A pile of sand, a planet, a drop of
// water — pour on more matter, it gets larger. A white dwarf does the OPPOSITE. Held up by
// electron DEGENERACY pressure (the same quantum refusal that holds the Scales next door up
// against gravity), a heavier dwarf is the SMALLER one. The extra weight squeezes the electrons
// into a tighter, denser ball — and at the Chandrasekhar mass the squeeze wins outright and the
// radius goes to ZERO. You never classify here; you watch the SIZE answer.
//
// Two laws race down one track, dealt EQUAL at one mass, then forced apart:
//
//   DEGENERATE (the white dwarf):  R_deg(M) = S_deg · M^(−1/3) · sqrt(max(0, 1 − (M/M_CH)^(4/3)))
//     · M^(−1/3) is the non-relativistic white-dwarf mass–radius INVERSION (R ∝ M^−1/3): pile on
//       mass, the body shrinks. This is the load-bearing SIGN — a NEGATIVE exponent.
//     · the sqrt(1 − (M/M_CH)^(4/3)) factor is the relativistic Chandrasekhar correction. As the
//       Fermi momentum of the electrons goes relativistic the support softens, and this factor
//       drives R → 0 EXACTLY at M = M_CH. The collapse is the factor's doing, not a magic floor.
//
//   NORMAL (the body intuition expects):  R_norm(M) = S_norm · M^(+1/3)
//     · a constant-density sphere: mass ∝ R³ ⇒ R ∝ M^(+1/3). A POSITIVE exponent — pile on mass,
//       it grows. This is the NEGATIVE CONTROL: flip the degenerate body's sign and you get this,
//       and neither the inversion nor the collapse happens. A +1/3 body never pinches.
//
// WHY THE NUMBERS ARE HONEST:
//   · M_CH = 1.44 M☉ is the Chandrasekhar limit (Chandrasekhar 1931); we pin 1.44 as the
//     representative ceiling, the same value the Scales bench uses for its lower gate.
//   · S_deg and S_norm are scale constants chosen for ONE reason only: to deal the two bodies the
//     SAME radius at M₀ = 0.90 M☉, so the crossing is a clean visual event. They set the meeting
//     point, NOT the physics. The load-bearing claims are the EXPONENT SIGNS (one negative, one
//     positive) and R_deg → 0 at M_CH — not any absolute SI radius. (Stated Hawking-style in the
//     page's proof footer.)
//
// The claim this core proves is therefore STRUCTURAL, four facts:
//   (1) OPPOSITE-SIGN MONOTONE SLOPES — over the sweep, R_deg strictly DECREASES and R_norm
//       strictly INCREASES (adjacent-pair checks, not just endpoints).
//   (2) CHANDRASEKHAR FROM THE EXPONENT — R_deg(M_CH) === 0 to machine ε, driven by the
//       relativistic factor and scaled to land exactly at 1.44.
//   (3) NEG-CONTROL — a +1/3 body never pinches: R_norm is bounded below by R_norm(M_MIN) > 0
//       across the whole sweep and stays positive at/past M_CH. Removing the sqrt factor from the
//       degenerate law (pure S_deg·M^−1/3) also stays strictly positive at M_CH — so the pinch is
//       the relativistic factor's doing, not the negative exponent's and not a floor.
//   (4) THE CROSSING IS UNIQUE — R_deg − R_norm changes sign EXACTLY ONCE over the sweep, at
//       M₀ = 0.90, so "momentarily equal" is a real single event.
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte
// between the MASS-RADIUS CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in
// index.html against this file's body so it can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — rDegenerate/rNormal are pure total functions.

// ===== MASS-RADIUS CORE (byte-identical to core.mjs) =====
"use strict";

// The Chandrasekhar limit: the hard floor where electron-degeneracy support fails and R → 0.
// ≈ 1.44 M☉ — the same value the Scales bench's lower gate uses.
const M_CH = 1.44;

// The sweep this bench lives in: entirely inside the white-dwarf band, [M_MIN, M_CH).
// (No TOV end here — the SIZE story is told before the body even becomes a neutron star.)
const M_MIN = 0.5;

// The mass at which the two bodies are dealt the SAME radius (the crossing event).
const M0 = 0.90;

// ── THE RAW LAWS (before scaling) ────────────────────────────────────────────────────────────
// degRaw(M): the non-relativistic inversion M^(−1/3) times the relativistic Chandrasekhar factor.
//   · M^(−1/3): the NEGATIVE-exponent inversion — heavier dwarf, smaller body.
//   · sqrt(max(0, 1 − (M/M_CH)^(4/3))): the relativistic softening that drives R → 0 at M_CH.
// clamped at 0 inside the sqrt so it is total (returns 0, never NaN, at/above M_CH).
function degRaw(M){
  const factor = 1 - Math.pow(M / M_CH, 4/3);
  return Math.pow(M, -1/3) * Math.sqrt(Math.max(0, factor));
}
// normRaw(M): the constant-density sphere, R ∝ M^(+1/3). The POSITIVE-exponent neg-control.
function normRaw(M){
  return Math.pow(M, 1/3);
}
// degRawNoRel(M): the degenerate law with the relativistic factor REMOVED — pure S·M^(−1/3).
// Used by the neg-control to show the pinch is the FACTOR's doing: this never reaches 0.
function degRawNoRel(M){
  return Math.pow(M, -1/3);
}

// ── THE SCALE CONSTANTS ──────────────────────────────────────────────────────────────────────
// Chosen for ONE reason: deal both bodies radius 1 at M₀ = 0.90. They set the meeting point, not
// the physics. The load-bearing facts are the exponent SIGNS and R_deg → 0 at M_CH.
const S_deg  = 1 / degRaw(M0);
const S_norm = 1 / normRaw(M0);

// ── THE TWO RADII (the depictions) ───────────────────────────────────────────────────────────
// rDegenerate(M): the white dwarf's radius (dimensionless; ×lane-px in the page). Shrinks with M,
// goes to 0 exactly at M_CH. Domain-guarded; total on [0, ∞) — returns 0 at/above M_CH.
function rDegenerate(M){
  if (typeof M !== 'number' || !Number.isFinite(M) || M < 0){
    throw new RangeError('mass must be a finite number ≥ 0 (solar masses); got ' + M);
  }
  return S_deg * degRaw(M);
}
// rNormal(M): the constant-density body's radius. Grows with M; never pinches. Domain-guarded.
function rNormal(M){
  if (typeof M !== 'number' || !Number.isFinite(M) || M < 0){
    throw new RangeError('mass must be a finite number ≥ 0 (solar masses); got ' + M);
  }
  return S_norm * normRaw(M);
}
// rDegenerateNoRel(M): the degenerate body WITHOUT the relativistic factor — the foil that shows
// the pinch belongs to the factor, not the negative exponent. Strictly positive everywhere > 0.
function rDegenerateNoRel(M){
  if (typeof M !== 'number' || !Number.isFinite(M) || M < 0){
    throw new RangeError('mass must be a finite number ≥ 0 (solar masses); got ' + M);
  }
  return S_deg * degRawNoRel(M);
}

// ── THE SELF-TEST — the bodies prove their own claim ─────────────────────────────────────────
// (1) OPPOSITE-SIGN MONOTONE SLOPES: over ≥500 samples on [M_MIN, M_CH), every adjacent pair has
//     ΔR_deg < 0 AND ΔR_norm > 0 (deg strictly decreasing, norm strictly increasing).
// (2) CHANDRASEKHAR FROM THE EXPONENT: R_deg(M_CH) === 0 to machine ε, and R_deg(1.43) is already
//     pinched to ≈0.12 of its M₀ value — driven by the relativistic factor, scaled to land at 1.44.
// (3) NEG-CONTROL: R_norm never pinches (bounded below by R_norm(M_MIN) > 0 across the sweep AND
//     positive at/past M_CH); and the relativistic-factor-removed degenerate body stays strictly
//     POSITIVE at M_CH — so the pinch is the factor's doing, not the sign's and not a floor.
// (4) THE CROSSING IS UNIQUE: R_deg − R_norm changes sign EXACTLY ONCE over the sweep, at M₀=0.90.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const N = 500;                                   // ≥500 adjacent-pair samples on [M_MIN, M_CH)

  // CLAIM 1 — opposite-sign monotone slopes (adjacent pairs, not just endpoints).
  let degDecr = true, normIncr = true, worstDeg = -Infinity, worstNorm = Infinity;
  let prevD = rDegenerate(M_MIN), prevN = rNormal(M_MIN);
  for (let i = 1; i <= N; i++){
    const M = M_MIN + (M_CH - M_MIN) * i / N;       // sweeps up to just shy of M_CH at i=N
    const d = rDegenerate(M), n = rNormal(M);
    const dD = d - prevD, dN = n - prevN;
    if (!(dD < 0)) degDecr = false;
    if (!(dN > 0)) normIncr = false;
    if (dD > worstDeg) worstDeg = dD;               // the least-negative deg step (closest to fail)
    if (dN < worstNorm) worstNorm = dN;             // the least-positive norm step (closest to fail)
    prevD = d; prevN = n;
  }
  log('1 · opposite-sign monotone slopes  (ΔR_deg<0 & ΔR_norm>0 over ' + N + ' adjacent pairs)',
      degDecr && normIncr,
      'deg strictly↓=' + degDecr + ' (worst Δ=' + worstDeg.toExponential(2) + ')  ·  ' +
      'norm strictly↑=' + normIncr + ' (worst Δ=' + worstNorm.toExponential(2) + ')');

  // CLAIM 2 — Chandrasekhar from the exponent: R_deg(M_CH)===0; R_deg(1.43)≈0.12·R_deg(M₀).
  const atCh = rDegenerate(M_CH);
  const ratio = rDegenerate(1.43) / rDegenerate(M0);
  log('2 · Chandrasekhar pinch from the relativistic factor  (R_deg(M_CH)=0; R_deg(1.43)≈0.12·R₀)',
      atCh === 0 && Math.abs(ratio - 0.12) < 0.02,
      'R_deg(' + M_CH + ')=' + atCh + '  ·  R_deg(1.43)/R_deg(' + M0 + ')=' + ratio.toFixed(4));

  // CLAIM 3 — neg-control: a +1/3 body never pinches; factor-removed deg stays positive at M_CH.
  const normFloor = rNormal(M_MIN);
  const normAtCh  = rNormal(M_CH);
  let normPositive = true;
  for (let i = 0; i <= N; i++){
    const M = M_MIN + (M_CH - M_MIN) * i / N;
    if (rNormal(M) < normFloor - 1e-12) normPositive = false;   // never dips below its M_MIN floor
  }
  const degNoRelAtCh = rDegenerateNoRel(M_CH);                   // pure M^−1/3 — never 0
  log('3 · NEG-CONTROL: +1/3 body never pinches; factor-removed deg stays positive at M_CH',
      normPositive && normFloor > 0 && normAtCh > 0 && degNoRelAtCh > 0,
      'R_norm floor=' + normFloor.toFixed(4) + ' (>0)  ·  R_norm(M_CH)=' + normAtCh.toFixed(4) +
      ' (>0)  ·  R_deg-no-rel(M_CH)=' + degNoRelAtCh.toFixed(4) + ' (>0, so the pinch is the factor)');

  // CLAIM 4 — the crossing is unique: sign(R_deg − R_norm) flips EXACTLY ONCE, at M₀=0.90.
  let crossings = 0, crossM = NaN, prevSign = null;
  for (let i = 0; i <= N; i++){
    const M = M_MIN + (M_CH - M_MIN) * i / N;
    const diff = rDegenerate(M) - rNormal(M);
    const s = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (s !== 0){
      if (prevSign !== null && s !== prevSign){ crossings++; crossM = M; }
      prevSign = s;
    }
  }
  log('4 · the crossing is unique  (R_deg − R_norm flips sign exactly once, at M₀=' + M0 + ')',
      crossings === 1 && Math.abs(crossM - M0) < 0.01,
      'crossings=' + crossings + ' at M≈' + (Number.isNaN(crossM) ? 'none' : crossM.toFixed(4)));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END MASS-RADIUS CORE =====

export {
  M_CH, M_MIN, M0,
  S_deg, S_norm,
  rDegenerate, rNormal, rDegenerateNoRel, runSelfTest,
};
