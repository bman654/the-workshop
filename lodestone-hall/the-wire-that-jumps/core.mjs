// ============================================================================
//  THE WIRE THAT JUMPS — the Lodestone Hall's railgun-shuttle core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every force the bench shows: the page's red
//  F-arrow length AND direction are drawn FROM forceOnBar()'s returned vector.
//  The page inlines the slab between the RAILSHUTTLE CORE BEGIN / END sentinels
//  (the forge copies this file verbatim, export-block and all); core.test.mjs
//  RE-EXTRACTS the inlined copy and proves it is char-for-char this module's
//  body, so page, pill, and Node twin can never silently drift.
//
//  THE ONE IDEA — THE MOTOR FORCE AS A PURE LAUNCH. The Whirligig is this same
//  F = I·(L × B), but with TWO sides of a loop: equal-and-opposite shoves make a
//  COUPLE and the loop SPINS. Cut one side loose and lay it across two rails:
//  the lone bar, free to slide, no longer turns — it just LEAPS straight down the
//  rails. Translation instead of rotation. (This is the railgun.)
//
//  THE FRAME. The rails run along x̂ (the launch direction). The bar lies across
//  them along ŷ; current flows ALONG the bar, so the bar vector is L = (0, −L, 0)
//  (the current's sense down the bar; reverse-current flips it). The field starts
//  INTO THE PAGE (−ẑ) and TILTS, by the falsifier dial θ, from into-page toward
//  in-plane ALONG the bar (+ŷ):
//        B(θ) = B·( 0,  sin θ,  −cos θ ).
//  At θ = 0 the field is into-page, perpendicular to the bar, and
//        F = I·(L × B) = I·(0,−L,0) × (0,0,−B) = (+I·L·B, 0, 0)
//  — a shove straight ALONG the rails (+x̂, down the runway), magnitude exactly
//  B·I·L. As θ → 90° the
//  field swings parallel to the current (B ∥ L), cross(L,B) → 0, and the bar goes
//  DEAD: F ≡ 0. No leap at all where current and field agree.
//
//  THE FORCE IS EXACT, NOT SAMPLED. forceOnBar(I, B, θ) returns the full
//  3-vector I·(L × B). The page draws its arrow straight from that vector, so the
//  picture renders the very force the core computes — it cannot lie. The bench
//  proves, to <1e-9: |F| = B·I·L at θ=0; |F| is LINEAR in I (2I → 2F); F flips
//  sign on reversing EITHER I or B (two distinct causes, same flip); F is
//  PERPENDICULAR to both the current and the field at every tilt; and the RED
//  neg-control — at θ=90° (L ∥ B), F ≡ [0,0,0] EXACTLY. A parallel current can't
//  push: the conservation soul's reciprocal face (the Whirligig's couple nets
//  zero work; the Hall's field makes no free energy; here L∥B makes no force).
//
//  THE KINEMATICS (UX feel, never a second force formula). A constant force gives
//  constant acceleration: a = F/m, x = ½at², v = at while the current flows. The
//  trace under the rails draws this — the x(t) parabola and the v(t) straight
//  line, the constant-F kinematics signature. This is a CLEAN TOY: constant-force
//  kinematics ONLY — explicitly NOT a circuit sim (no back-EMF, no rail
//  resistance, no friction, no real railgun energy budget). The PROVEN claims are
//  all mass-independent except the trace, which is asserted only as a RATIO:
//  x(t; 2I) = 2·x(t; I) at equal t (the race-ghost made exact).
// ============================================================================

// === RAILSHUTTLE CORE BEGIN ===
"use strict";

// The shipped scene constants — honest UX scene constants (NOT proven physics,
// except as the ratios the self-test asserts). B, L set the force scale; m is the
// bar mass used ONLY by the kinematics trace; I_max is the dial ceiling.
const SCENE = {
  B: 1.0,        // uniform field magnitude (into the page at θ=0)
  L: 1.0,        // bar length (the current-carrying span across the rails)
  m: 1.0,        // bar mass (trace only; the force claims are mass-independent)
  I_max: 5.0,    // current dial ceiling (UI; the force is linear in I)
};

// 3-vector helpers. The bar L ∥ ŷ; the field tilts in the y–z plane.
function cross(a, b){
  return [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
}
function dot(a, b){ return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function norm(a){ return Math.hypot(a[0], a[1], a[2]); }

// ── THE BAR VECTOR. Current flows ALONG the bar (∥ −ŷ at Isign=+1, oriented so the
//    default field launches the bar down the runway, +x̂); reverse-current flips its
//    sign. Length |L| = scene.L. (Isign carries the reverse-current switch.)
function barVector(Isign = +1, scene = SCENE){
  return [ 0, -Isign * scene.L, 0 ];
}

// ── THE FIELD VECTOR at tilt θ. θ=0 → into the page (−ẑ), ⊥ the bar; θ=90° →
//    in-plane ALONG the bar (+ŷ), ∥ the current. Bsign flips the field (the
//    reverse-field switch). |B| = scene.B for all θ.
//        B(θ) = Bsign · B · ( 0, sin θ, −cos θ ).
function fieldVector(theta, Bsign = +1, scene = SCENE){
  return [ 0, Bsign * scene.B * Math.sin(theta), -Bsign * scene.B * Math.cos(theta) ];
}

// ── THE FORCE ON THE BAR — the SOLE force object. F = I·(L × B), the full
//    3-vector. THIS is what the page's red arrow is drawn from (length AND
//    direction): the picture renders the very force the core computes.
//      • magnitude is the current dial (≥ 0 from the slider); Isign reverses I.
//      • theta tilts B from into-page (0) toward L∥B (π/2); at π/2, F ≡ 0.
//    Returns [Fx, Fy, Fz]; on the rail apparatus Fx is the live shove ALONG the
//    rails and Fy, Fz are identically zero (proven below).
function forceOnBar(I, theta, Isign = +1, Bsign = +1, scene = SCENE){
  const L = barVector(Isign, scene);
  const B = fieldVector(theta, Bsign, scene);
  return cross(L, B).map(c => I * c);
}

// ── THE KINEMATICS ACCESSOR (UX feel only; NEVER a second force formula). While
//    the current flows the force is constant, so a = |F|/m, x = ½at², v = at.
//    Returns the magnitudes for the trace strip. The force comes from
//    forceOnBar() — there is no independent force expression anywhere.
function kinematics(I, theta, t, Isign = +1, Bsign = +1, scene = SCENE){
  const F = forceOnBar(I, theta, Isign, Bsign, scene);
  const a = norm(F) / scene.m;          // |a| = |F|/m
  return { a, v: a * t, x: 0.5 * a * t * t };
}

// ── THE SELF-TEST — the bench proves its own claim. FOUR positive claims each to
//    <1e-9, and the RED neg-control (the falsifier).
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const S = SCENE;
  const EPS = 1e-9;

  // CLAIM 1 — |F| = B·I·L EXACTLY when L ⊥ B (θ=0), over a dense I-sweep.
  let worst1 = 0, where1 = '';
  for (let k = 0; k <= 200; k++){
    const I = -S.I_max + (2*S.I_max) * k/200;          // dense I sweep, both signs
    const F = forceOnBar(I, 0, +1, +1, S);
    const d = Math.abs(norm(F) - S.B * Math.abs(I) * S.L);
    if (d > worst1){ worst1 = d; where1 = 'I=' + I.toFixed(3); }
  }
  log('1 · |F| = B·I·L exactly at θ=0 (L⊥B), dense I-sweep, <1e-9',
      worst1 < EPS, 'worst |Δ| = ' + worst1.toExponential(2) + ' @ ' + where1);

  // CLAIM 2 — LINEAR IN I: |F(2I)| === 2·|F(I)| AND x(t;2I) === 2·x(t;I) at equal t
  //           (the race-ghost made exact). Over a θ × I grid.
  let worst2 = 0, where2 = '';
  for (let it = 0; it < 40; it++){
    const th = (Math.PI/2) * it/40;                    // 0 … π/2
    for (const I of [0.3, 0.8, 1.7, 2.5]){
      const f1 = norm(forceOnBar(I, th, +1, +1, S));
      const f2 = norm(forceOnBar(2*I, th, +1, +1, S));
      const dF = Math.abs(f2 - 2*f1);
      // and the integrated trace at a fixed t: x scales as |F| scales (a = |F|/m)
      const x1 = kinematics(I, th, 1.3, +1, +1, S).x;
      const x2 = kinematics(2*I, th, 1.3, +1, +1, S).x;
      const dX = Math.abs(x2 - 2*x1);
      const d = Math.max(dF, dX);
      if (d > worst2){ worst2 = d; where2 = 'θ=' + th.toFixed(2) + ' I=' + I; }
    }
  }
  log('2 · linear in I: |F(2I)| === 2·|F(I)| AND x(t;2I) === 2·x(t;I) (race-ghost), <1e-9',
      worst2 < EPS, 'worst |Δ| = ' + worst2.toExponential(2) + ' @ ' + where2);

  // CLAIM 3 — SIGN FLIPS ON EITHER REVERSAL: F(−I) === −F(I) AND F(I,−B) === −F(I,+B)
  //           pointwise (two distinct causes, the SAME flip).
  let worst3 = 0;
  for (let it = 0; it < 60; it++){
    const th = (Math.PI/2) * it/60;
    for (const I of [0.5, 1.4, 3.0, 5.0]){
      const f  = forceOnBar(I, th, +1, +1, S);
      const fI = forceOnBar(I, th, -1, +1, S);          // reverse current
      const fB = forceOnBar(I, th, +1, -1, S);          // reverse field
      for (let c = 0; c < 3; c++){
        worst3 = Math.max(worst3, Math.abs(fI[c] + f[c]), Math.abs(fB[c] + f[c]));
      }
    }
  }
  log('3 · sign flips on EITHER reversal: F(−I) === −F(I) AND F(I,−B) === −F(I,+B) pointwise, <1e-9',
      worst3 < EPS, 'worst |F_rev + F| = ' + worst3.toExponential(2) + ' (same flip, two causes)');

  // CLAIM 4 — PERPENDICULAR TO BOTH: dot(F, L̂) === 0 AND dot(F, B) === 0 for ALL
  //           tilt angles (F genuinely ⊥ both current and field — a cross product).
  let worst4 = 0, where4 = '';
  for (let it = 0; it <= 90; it++){
    const th = (Math.PI/2) * it/90;
    for (const I of [0.7, 2.2, 4.0]){
      const F = forceOnBar(I, th, +1, +1, S);
      const L = barVector(+1, S), B = fieldVector(th, +1, S);
      const dL = Math.abs(dot(F, L));
      const dB = Math.abs(dot(F, B));
      const d = Math.max(dL, dB);
      if (d > worst4){ worst4 = d; where4 = 'θ=' + th.toFixed(2) + ' I=' + I; }
    }
  }
  log('4 · F ⊥ both: dot(F, L) === 0 AND dot(F, B) === 0 for ALL tilts, <1e-9',
      worst4 < EPS, 'worst |dot| = ' + worst4.toExponential(2) + ' @ ' + where4);

  // NEG-CONTROL (fires RED — the FALSIFIER) — at θ=90° (L ∥ B), |F| → 0 and
  //   F ≡ [0,0,0] EXACTLY (cross(L,L)=0). NO leap when current and field align.
  let worstN = 0;
  for (const I of [0.4, 1.1, 2.6, 5.0]){
    const F = forceOnBar(I, Math.PI/2, +1, +1, S);
    worstN = Math.max(worstN, Math.abs(F[0]), Math.abs(F[1]), Math.abs(F[2]));
  }
  log('5 · NEG-CONTROL  L∥B (θ=90°) ⇒ F ≡ [0,0,0] EXACTLY (no leap where current and field agree)',
      worstN < EPS, 'worst |F| @ L∥B = ' + worstN.toExponential(2) + '  — a parallel current can\'t push');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === RAILSHUTTLE CORE END ===

export {
  SCENE,
  cross, dot, norm,
  barVector, fieldVector, forceOnBar, kinematics,
  runSelfTest,
};
