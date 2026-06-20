// ============================================================================
//  THE WHIRLIGIG — the Lodestone Hall's reciprocal MOTOR core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every torque / force / work number the bench
//  shows. The page inlines the slab between the WHIRLIGIG CORE BEGIN / END
//  sentinels (the forge directive copies this file verbatim, export-block and
//  all); core.test.mjs RE-EXTRACTS the inlined copy and proves it is char-for-
//  char this module's body, so page, pill, and Node twin can never silently drift.
//
//  THE ONE IDEA — A MOTOR IS A GENERATOR RUN BACKWARDS. The Lodestone Hall is the
//  forward face: MOVE a magnet past a loop and the changing flux makes a current
//  (EMF = −dΦ/dt). The Whirligig is the SAME loop and the SAME field, run the
//  other way: PUSH a current I through the loop and the field SHOVES each wire
//  with the Lorentz force F = I·(L × B). The two long sides get equal-and-opposite
//  shoves — a COUPLE — and the loop TURNS. There is no battery of motion; the only
//  spin is the one you make by pushing current.
//
//  THE TORQUE IS EXACT, NOT SAMPLED. A rectangular loop of N turns, area A, hangs
//  on a horizontal axle (ẑ) between horseshoe poles whose field is uniform,
//  B = (Bsign·B, 0, 0). At loop angle θ the plane's in-plane axis is
//        u = (−sinθ, cosθ, 0),
//  and the two LONG sides (length w ∥ ẑ) sit at ±(s/2)·u, where the short side
//  s = A/w (so area = w·s = A). Each long side carries current in the opposite
//  sense, L_i = (0, 0, −i·comSign·w) for side i ∈ {+1, −1}; the Lorentz force on
//  it is F_i = I·(L_i × B). Summing the axle torque r×F over all four sides — the
//  two SHORT sides contribute EXACTLY zero axle torque (their force has no moment
//  about ẑ) — gives the closed form
//        τ(θ) = N · I · A · B · sinθ · Bsign.
//  We DERIVE this by literally summing forcePerSide() (the SAME vectors the
//  diorama draws as arrows) and assert it equals the closed form to <1e-9 over a
//  θ × current sweep. The picture renders the torque's own terms — it cannot lie.
//
//  THE COMMUTATOR — WHY PLAIN DC ONLY ROCKS. τ ∝ sinθ flips sign every half-turn,
//  so over a full revolution the loop's net work is ∮τ dθ = 0: it ROCKS about the
//  field and stalls at the dead spots θ = 0, π. The trick that makes it a MOTOR is
//  the COMMUTATOR: a split-ring that REVERSES THE CURRENT SENSE every half-turn,
//  at exactly θ = 0 and π, so the couple always pushes the SAME way round. We model
//  it as a current-sense factor injected into L (NOT a field flip, NOT torque-
//  gating): commutatorSign(θ) = +1 for θ∈[0,π), −1 for θ∈[π,2π). The commutated
//  torque is then one-signed, |N·I·A·B·sinθ|, and the work per revolution becomes
//        ∮ commutatedTau dθ = 4·N·I·A·B  > 0.
//  ONE model: the page multiplies the same sign into the arrows AND its spin
//  integrator, the gauge integrates the same — picture and gauge can never disagree.
//
//  NEG-CONTROL, proven RED in the twin: WITHOUT the commutator there is no motor.
//  ∮ τ dθ over a full turn === 0 to the bit (the loop nets ZERO work — it only
//  ROCKS). It is the COMMUTATOR, not the field, that makes it a motor. This mirrors
//  the Hall's Lenz free-energy neg-control: the same conservation soul, reciprocal
//  face — energy there, net WORK here.
//
//  RECIPROCITY. This is the Lodestone Hall's loop run the other way: there you MOVE
//  it to make a current; here the current MOVES it. Same wire, same field, arrow
//  reversed. The Whirligig keeps its OWN torque core (it imports nothing from the
//  Hall) — the reciprocity is in the physics, not a shared dependency.
// ============================================================================

// === WHIRLIGIG CORE BEGIN ===
"use strict";

// The shipped scene constants — the loop's own apparatus. N·A·B are the literal
// "same loop & field" the Lodestone Hall's coil rests on (a loop in a field), here
// driven by a current instead of moved through the field. `w` is the long-side
// length (∥ the axle); the short side is A/w so the enclosed area is exactly A.
const SCENE = {
  N: 80,        // loop turns (each links the same couple → factor N)
  A: 1.0,       // loop area (enclosed; long·short = A)
  B: 1.0,       // uniform field magnitude between the poles
  w: 1.2,       // long-side length (∥ axle ẑ); short side = A/w
  I_max: 5.0,   // current dial ceiling (UI; the torque is linear in I)
};

// 3-vector helpers (axle = ẑ; field along x̂).
function cross(a, b){
  return [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
}

// ── THE PER-SIDE LORENTZ FORCE on the TWO long sides. At angle θ the in-plane
//    axis is u = (−sinθ, cosθ, 0); the long sides sit at ±(s/2)·u with s = A/w,
//    carry current L_i = (0,0, −i·comSign·w), and feel F_i = I·(L_i × B) with
//    B = (Bsign·B, 0, 0). Returns the two {r, F} pairs — r the side's position
//    (lever arm from the axle), F the force vector. THIS is the accessor the
//    diorama draws its red couple-arrows from: the picture renders the very
//    vectors the torque sums. (comSign is the commutator's current-sense factor.)
function forcePerSide(theta, I, comSign = +1, Bsign = +1, scene = SCENE){
  const { A, B, w } = scene;
  const s = A / w;                                  // short side (lever separation)
  const u = [ -Math.sin(theta), Math.cos(theta), 0 ];
  const Bv = [ Bsign * B, 0, 0 ];
  const out = [];
  for (const i of [ +1, -1 ]){
    const r = [ i*(s/2)*u[0], i*(s/2)*u[1], 0 ];     // lever arm to long side i
    const L = [ 0, 0, -i*comSign*w ];                // current sense (opposite per side)
    const F = cross(L, Bv).map(c => I*c);            // F = I·(L × B)
    out.push({ r, F });
  }
  return out;
}

// ── THE SHORT-SIDE forces (∥ u, length s, at ±(w/2)·ẑ). They feel a real Lorentz
//    force but it has NO moment about the axle ẑ — included so the torque sum is
//    an honest sum over ALL FOUR sides, and the test can assert their axle torque
//    is EXACTLY zero (the couple lives only on the long sides).
function shortSideForces(theta, I, Bsign = +1, scene = SCENE){
  const { A, B, w } = scene;
  const s = A / w;
  const u = [ -Math.sin(theta), Math.cos(theta), 0 ];
  const Bv = [ Bsign * B, 0, 0 ];
  const out = [];
  for (const zside of [ +1, -1 ]){
    const r = [ 0, 0, zside*(w/2) ];                 // at ±(w/2) along the axle
    const L = [ zside*s*u[0], zside*s*u[1], 0 ];      // short side ∥ u
    const F = cross(L, Bv).map(c => I*c);
    out.push({ r, F });
  }
  return out;
}

// ── THE TORQUE about the axle ẑ — the SOLE torque object. Sum r×F over the four
//    sides (long via forcePerSide, short via shortSideForces) and take the ẑ
//    component, times N turns. Equals the closed form N·I·A·B·sinθ·Bsign;
//    reversing the current (I<0) or the field (Bsign=−1) each flips the sign.
function whirligigTorque(theta, I, Bsign = +1, scene = SCENE){
  let tz = 0;
  for (const { r, F } of forcePerSide(theta, I, +1, Bsign, scene)) tz += cross(r, F)[2];
  for (const { r, F } of shortSideForces(theta, I, Bsign, scene))   tz += cross(r, F)[2];
  return scene.N * tz;
}

// ── THE COMMUTATOR — a current-SENSE factor (±1) that flips at the dead spots
//    θ = 0 and π. THE adjudicated model: it is injected into L (a current reversal),
//    NOT a B-flip and NOT torque-gating. The page multiplies it into the arrows AND
//    its spin integrator; the gauge integrates with it — one model, picture and
//    gauge can never disagree.
function commutatorSign(theta){
  const t = ((theta % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
  return t < Math.PI ? +1 : -1;
}

// The commutated torque: one-signed |N·I·A·B·sinθ|. (Equivalent to summing the
// per-side r×F with comSign = commutatorSign(θ) injected into L — proven in the twin.)
function commutatedTau(theta, I, Bsign = +1, scene = SCENE){
  return whirligigTorque(theta, I, Bsign, scene) * commutatorSign(theta);
}

// ── WORK PER REVOLUTION — the numeric ∮ of the torque over one full turn [0,2π].
//    commutatorOn → ∮ commutatedTau dθ = 4·N·I·A·B (the loop does net work, it is a
//    MOTOR). commutatorOff → ∮ whirligigTorque dθ = 0 (it only ROCKS — the
//    neg-control). Midpoint quadrature; S large enough that the OFF integral is
//    zero to the bit and the ON integral hits 4NIAB to quadrature precision.
function workPerRev(commutatorOn, I, Bsign = +1, scene = SCENE, S = 20000){
  let acc = 0;
  const d = 2*Math.PI / S;
  for (let k = 0; k < S; k++){
    const th = 2*Math.PI*(k + 0.5)/S;                // midpoint
    acc += (commutatorOn ? commutatedTau(th, I, Bsign, scene)
                         : whirligigTorque(th, I, Bsign, scene)) * d;
  }
  return acc;
}

// ── THE SELF-TEST — the bench proves its own claim. FOUR positive claims each to
//    <1e-9 (plus a quadrature-bounded work check), and the RED neg-control.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const S = SCENE;

  // CLAIM 1 — τ === N·I·A·B·sinθ, DERIVED by summing F = I·L×B over the four sides
  //           (forcePerSide + shortSideForces), === closed form over a θ × current
  //           sweep, worst |Δ| < 1e-9.
  let worst1 = 0, where1 = '';
  for (let k = 0; k < 240; k++){
    const th = 2*Math.PI*k/240;
    for (const I of [0.3, 1, 2.5, 5]){
      const derived = whirligigTorque(th, I, +1, S);
      const closed  = S.N * I * S.A * S.B * Math.sin(th);
      const d = Math.abs(derived - closed);
      if (d > worst1){ worst1 = d; where1 = 'θ=' + th.toFixed(2) + ' I=' + I; }
    }
  }
  log('1 · τ = N·I·A·B·sinθ  (four-side F = I·L×B sum === closed form, θ×current sweep, <1e-9)',
      worst1 < 1e-9, 'worst |Δ| = ' + worst1.toExponential(2) + ' @ ' + where1);

  // CLAIM 2 — WORK PER REV with the commutator > 0, === ∮commutatedTau dθ (its own
  //           numeric integral, identical) AND === 4·N·I·A·B (to quadrature).
  const I2 = 2.0;
  const wOn = workPerRev(true, I2, +1, S);
  const wOnIndep = (() => { let a = 0, n = 20000, d = 2*Math.PI/n;
    for (let k = 0; k < n; k++) a += commutatedTau(2*Math.PI*(k+0.5)/n, I2, +1, S)*d; return a; })();
  const target = 4 * S.N * I2 * S.A * S.B;
  const c2 = wOn > 0 && Math.abs(wOn - wOnIndep) < 1e-9 && Math.abs(wOn - target) < 1e-4;
  log('2 · work/rev WITH commutator > 0, === ∮commutatedTau dθ (<1e-9) and === 4·N·I·A·B',
      c2, '∮ = ' + wOn.toFixed(4) + ', 4NIAB = ' + target.toFixed(4) + ', |Δself| = ' + Math.abs(wOn-wOnIndep).toExponential(2));

  // CLAIM 3 — B-REVERSAL flips τ sign exactly: τ(θ,I,+1) === −τ(θ,I,−1) pointwise.
  let worst3 = 0;
  for (let k = 0; k < 200; k++){
    const th = 2*Math.PI*k/200;
    const p = whirligigTorque(th, 2.0, +1, S), m = whirligigTorque(th, 2.0, -1, S);
    worst3 = Math.max(worst3, Math.abs(p + m));
  }
  log('3 · B-reversal flips τ sign exactly  (τ(θ,I,+1) === −τ(θ,I,−1) pointwise, <1e-9)',
      worst3 < 1e-9, 'worst |τ₊ + τ₋| = ' + worst3.toExponential(2));

  // CLAIM 4 (BRIDGE) — PICTURE === CORE: the per-side force vectors forcePerSide()
  //           returns sum (r×F) to EXACTLY whirligigTorque() (long-side part) — the
  //           arrows the diorama draws are provably the torque's own terms.
  let worst4 = 0;
  for (let k = 0; k < 180; k++){
    const th = 2*Math.PI*k/180;
    let tzLong = 0;
    for (const { r, F } of forcePerSide(th, 2.0, +1, +1, S)) tzLong += cross(r, F)[2];
    // the short sides add exactly zero axle torque, so N·tzLong must equal the full torque
    let tzShort = 0;
    for (const { r, F } of shortSideForces(th, 2.0, +1, S)) tzShort += cross(r, F)[2];
    const full = whirligigTorque(th, 2.0, +1, S);
    worst4 = Math.max(worst4, Math.abs(S.N*tzLong - full), Math.abs(tzShort));
  }
  log('4 · picture === core: forcePerSide arrows sum (r×F) === τ (short sides 0 axle torque), <1e-9',
      worst4 < 1e-9, 'worst |N·Σr×F − τ| & |short axle τ| = ' + worst4.toExponential(2));

  // NEG-CONTROL (fires RED) — commutator OFF ⇒ ∮ whirligigTorque dθ === 0 to the
  //   bit over a full turn. The loop nets ZERO work — it only ROCKS. It is the
  //   COMMUTATOR, not the field, that makes it a motor.
  const wOff = workPerRev(false, 2.0, +1, S);
  const cN = Math.abs(wOff) < 1e-9;
  log('5 · NEG-CONTROL  commutator OFF ⇒ ∮τ dθ === 0  (nets zero work — only ROCKS; the commutator makes the motor)',
      cN, '∮τ dθ (no commutator) = ' + wOff.toExponential(2) + '  — WITHOUT the commutator there is no motor');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === WHIRLIGIG CORE END ===

export {
  SCENE,
  cross, forcePerSide, shortSideForces,
  whirligigTorque, commutatorSign, commutatedTau, workPerRev,
  runSelfTest,
};
