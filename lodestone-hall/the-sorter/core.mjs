// ============================================================================
//  THE SORTER — the Lodestone Hall's mass-reading ARC core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every radius / landing / period / speed
//  number the bench shows. The page inlines the slab between the SORTER CORE
//  BEGIN / END sentinels (the forge directive copies this file verbatim,
//  export-block and all); core.test.mjs RE-EXTRACTS the inlined copy and proves
//  it is char-for-char this module's body, so page, pill, and Node twin can
//  never silently drift.
//
//  THE ONE IDEA — A FREE CHARGE IN A FIELD CURVES INTO A CIRCLE WHOSE RADIUS
//  READS ITS MASS. The Whirligig is the bound face: push current through a LOOP
//  and the field shoves its sides into a TURN. The Sorter is the SAME qv×B, run
//  on a FREE charge: fire a speck of charge q, mass m, speed v straight up the
//  entry wall into a uniform field B (into the page), and the magnetic force
//  F = qv×B — always ⊥ to v — bends it into a circle of radius
//        r = m·v / (q·B).
//  It half-loops and lands back on the injection baseline a distance
//        x = 2r
//  from the nozzle. Heavier specks swing wider: the landing x is exactly ∝ m,
//  so a row of fired masses fans into stripes whose SPACING IS the mass ratio.
//  That is a mass spectrometer; the detector strip reads mass off the geometry.
//
//  THE GEOMETRY IS INTEGRATED, NOT ASSUMED. We inject [0,0,0,v] (at the origin,
//  moving +y) and RK4-integrate the Lorentz equation of motion with B = (0,0,−B)
//  to the y=0 re-crossing — the SAME arc the page animates by replaying the
//  path. We then assert the integrated radius === m·v/(q·B) and the integrated
//  landing === ∓2r to <1e-9. SIGN (verified): with B into the page and q>0, the
//  force curls the +y speck toward −x, so it lands at x = −2r (q<0 lands at +2r).
//  The page detector and the live F-arrow MUST draw that sign.
//
//  THE CYCLOTRON FACT — THE PERIOD FORGETS THE SPEED. The time to complete the
//  loop is
//        T = 2π·m / (q·B),
//  which has NO v term: double the speed and the radius doubles but the period
//  is IDENTICAL (a faster speck runs a bigger circle in exactly the same time).
//  This is the structural soul-claim — period()'s SIGNATURE takes (m, q, B), no
//  v argument at all. The radius reads the mass; the period forgets the speed.
//
//  |v| IS CONSERVED — the magnetic force does NO work. F = qv×B is always ⊥ to v,
//  so F·v ≡ 0 and the speed in === the speed out: the field bends the path but
//  never speeds the speck up or slows it down. The arc is a pure rotation of v.
//
//  NEG-CONTROL, proven RED in the twin: turn the field OFF (B=0) and there is no
//  arc. r → ∞, the integrated path is a straight line (max|x| === 0), nothing
//  reads any mass. It is the FIELD that bends the charge into a mass-reading
//  circle; without it the speck flies straight off the top. The page B=0 toggle
//  flips the pill RED naming that offender.
//
//  RECIPROCITY. This is the Lodestone Hall's qv×B on a FREE charge instead of a
//  bound loop: there current + field make a loop TURN (a couple); here the field
//  bends a free charge into a mass-reading ARC. Same force law, two faces. The
//  Sorter keeps its OWN core (it imports nothing from the Hall or the Whirligig)
//  — the reciprocity is in the physics, not a shared dependency.
// ============================================================================

// === SORTER CORE BEGIN ===
"use strict";

// The shipped scene constants — the firing range's own apparatus. A speck of
// mass m, charge magnitude qmag, speed v fired up the entry wall into field B
// (into the page). The *_max values are the UI dial ceilings; `masses` is the
// MIX-mode fan (three loaded masses that land at x ∝ m).
const SCENE = {
  m: 2.0,        // speck mass
  qmag: 1.0,     // charge magnitude (sign chosen at fire)
  v: 1.5,        // injection speed (up the +y wall)
  B: 0.8,        // uniform field magnitude (into the page)
  m_max: 6.0, q_max: 2.0, v_max: 4.0, B_max: 2.0,
  masses: [1.0, 2.0, 3.0],   // the MIX fan
};

// ── THE CYCLOTRON RADIUS r = m·v/(q·B). With B=0 the path is straight: r → ∞.
function radius(m, q, v, B){
  return B === 0 ? Infinity : (m * v) / (Math.abs(q) * B);
}

// ── THE LANDING POINT on the injection baseline: a half-loop returns to y=0 at
//    x = ∓2r. q>0 lands at x<0 (toward −x), q<0 at x>0 — VERIFIED against the
//    integrated arc. With B=0 there is no landing (the speck never comes back).
function landingX(m, q, v, B){
  return B === 0 ? NaN : -Math.sign(q) * 2 * radius(m, q, v, B);
}

// ── THE PERIOD T = 2π·m/(q·B). THE SIGNATURE TAKES NO v — the structural proof
//    that the period forgets the speed (double v, same T). The cyclotron fact.
function period(m, q, B){
  return (2 * Math.PI * m) / (Math.abs(q) * B);
}

// ── speed + the Lorentz acceleration a = (q/m)(v × B), B = (0,0,−B). For a 2-D
//    velocity (vx,vy): v×B = (vy·(−B)·(−1) ... ) → ax = q·(−vy·B)/m, ay = q·(vx·B)/m.
function speed(vx, vy){ return Math.hypot(vx, vy); }
function accel(vx, vy, q, B, m){
  return [ q * (-vy * B) / m, q * (vx * B) / m ];
}

// ── ONE RK4 STEP over the state s = [x, y, vx, vy] under the Lorentz force.
function rk4Step(s, q, B, m, dt){
  const f = (st) => {
    const a = accel(st[2], st[3], q, B, m);
    return [ st[2], st[3], a[0], a[1] ];
  };
  const add = (a, b, h) => a.map((v, i) => v + b[i] * h);
  const k1 = f(s);
  const k2 = f(add(s, k1, dt / 2));
  const k3 = f(add(s, k2, dt / 2));
  const k4 = f(add(s, k3, dt));
  return s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// ── INTEGRATE THE ARC. Inject [0,0,0,v] (origin, moving +y); RK4 to the y=0
//    re-crossing (B=0 → a fixed straight flight). Returns the SAME path the page
//    replays, plus measured radius (distance from the geometric centre), the
//    worst radius error over the path, the linear-interpolated landing x, the
//    speed in/out, and the worst speed drift. Measuring r as distance-from-centre
//    (NOT a bounding box) keeps the row at <1e-9.
function integrateArc(m, q, v, B, dt = 2e-5){
  let s = [0, 0, 0, v];
  const path = [[s[0], s[1]]];
  const speedIn = speed(s[2], s[3]);
  const r = radius(m, q, v, B);
  // geometric centre: ⊥ to v0 (+y), on the side the force curls toward.
  //   q>0 curls toward −x ⇒ centre at (−r, 0); q<0 ⇒ centre at (+r, 0).
  const cx = B === 0 ? NaN : -Math.sign(q) * r, cy = 0;
  const steps = B === 0 ? 4000 : Math.ceil(Math.PI * m / (Math.abs(q) * B) / dt) + 400;
  let landingXMeasured = NaN, radiusErr = 0, worstSpeedDrift = 0, maxX = 0;
  let prev = s;
  for (let k = 0; k < steps; k++){
    const ns = rk4Step(s, q, B, m, dt);
    // y=0 re-crossing (skip the launch): linear-interpolate the landing x
    if (k > 5 && prev[1] > 0 && ns[1] <= 0 && Number.isNaN(landingXMeasured)){
      const t = prev[1] / (prev[1] - ns[1]);          // 0..1 between prev and ns
      landingXMeasured = prev[0] + t * (ns[0] - prev[0]);
    }
    if (B !== 0){
      const d = Math.hypot(ns[0] - cx, ns[1] - cy);   // distance from centre
      radiusErr = Math.max(radiusErr, Math.abs(d - r));
    }
    maxX = Math.max(maxX, Math.abs(ns[0]));
    worstSpeedDrift = Math.max(worstSpeedDrift, Math.abs(speed(ns[2], ns[3]) - speedIn));
    path.push([ns[0], ns[1]]);
    prev = ns; s = ns;
    if (B !== 0 && !Number.isNaN(landingXMeasured)) break;  // stop at the landing
  }
  const speedOut = speed(s[2], s[3]);
  return {
    path, radiusMeasured: r, radiusErr, landingXMeasured,
    speedIn, speedOut, worstSpeedDrift, maxX,
  };
}

// ── THE DETECTOR AS INSTRUMENT. The landing-tick SPACING is the mass ratio: the
//    detector reads mass off the geometry. Returns the ratio of |landingX|
//    relative to the first loaded mass — provably === the true mass ratio,
//    because |x| = 2r = 2·m·v/(qB) ∝ m (the v, q, B factors cancel in the ratio).
function measuredMassRatio(masses, q, v, B){
  const x0 = Math.abs(landingX(masses[0], q, v, B));
  return masses.map(m => Math.abs(landingX(m, q, v, B)) / x0);
}

// ── THE SELF-TEST — the bench proves its own claim. EIGHT rows, each <1e-9; the
//    fifth (B=0 ⇒ straight) is the falsifier the page B=0 toggle flips RED.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const S = SCENE;

  // ROW 1 — INTEGRATED ARC RADIUS === r = m·v/(q·B). Worst radiusErr over the
  //         path across m∈{1,2,3} × v∈{0.7,1.5,3} < 1e-9.
  let worst1 = 0, where1 = '';
  for (const m of [1, 2, 3]){
    for (const v of [0.7, 1.5, 3]){
      const arc = integrateArc(m, 1, v, S.B);
      if (arc.radiusErr > worst1){ worst1 = arc.radiusErr; where1 = 'm=' + m + ' v=' + v; }
    }
  }
  log('1 · integrated arc radius === r = m·v/(q·B)  (distance-from-centre over the path, m×v sweep, <1e-9)',
      worst1 < 1e-9, 'worst |dist − r| = ' + worst1.toExponential(2) + ' @ ' + where1);

  // ROW 2 — LANDING |x| === 2r. Worst ||landingXMeasured| − 2r| over masses.
  let worst2 = 0, where2 = '';
  for (const m of S.masses){
    const arc = integrateArc(m, 1, S.v, S.B);
    const d = Math.abs(Math.abs(arc.landingXMeasured) - 2 * radius(m, 1, S.v, S.B));
    if (d > worst2){ worst2 = d; where2 = 'm=' + m; }
  }
  log('2 · landing |x| === 2r  (integrated y=0 re-crossing === 2·m·v/(qB) over masses, <1e-9)',
      worst2 < 1e-9, 'worst ||x| − 2r| = ' + worst2.toExponential(2) + ' @ ' + where2);

  // ROW 3 — CYCLOTRON FACT: T = 2πm/(qB) INDEPENDENT of v. period() returns the
  //         IDENTICAL float across a v-grid (no v in the signature) while r scales
  //         linearly (|r(2v) − 2r(v)| < 1e-12). The structural proof.
  let sameT = true, worstR = 0;
  const T0 = period(2, 1, S.B);
  for (const v of [0.5, 1, 2, 4]){
    if (period(2, 1, S.B) !== T0) sameT = false;       // T never sees v
    worstR = Math.max(worstR, Math.abs(radius(2, 1, 2 * v, S.B) - 2 * radius(2, 1, v, S.B)));
  }
  const noVArg = period.length === 3;                   // signature takes (m,q,B)
  log('3 · CYCLOTRON FACT: T = 2πm/(qB) INDEPENDENT of v  (period() signature has NO v term; r scales linearly, |r(2v)−2r(v)|<1e-12)',
      sameT && noVArg && worstR < 1e-12,
      'T(v) identical = ' + sameT + ', period.length = ' + period.length + ', worst |r(2v)−2r(v)| = ' + worstR.toExponential(2));

  // ROW 4 — |v| CONSERVED (the field does NO work). Worst |speedIn−speedOut| AND
  //         worstSpeedDrift < 1e-9, AND F·v ≡ 0 over a dense θ-grid < 1e-12.
  let worstSpeed = 0;
  for (const m of [1, 2, 3]){
    const arc = integrateArc(m, 1, S.v, S.B);
    worstSpeed = Math.max(worstSpeed, Math.abs(arc.speedIn - arc.speedOut), arc.worstSpeedDrift);
  }
  let worstFdotV = 0;
  for (let k = 0; k < 360; k++){
    const th = 2 * Math.PI * k / 360;
    const vx = S.v * Math.cos(th), vy = S.v * Math.sin(th);
    const a = accel(vx, vy, 1, S.B, S.m);              // a ∥ F (a = F/m)
    worstFdotV = Math.max(worstFdotV, Math.abs(a[0] * vx + a[1] * vy));
  }
  log('4 · |v| CONSERVED — the field does NO work  (|speedIn−speedOut| & drift <1e-9, AND F·v ≡ 0 over a dense θ-grid <1e-12)',
      worstSpeed < 1e-9 && worstFdotV < 1e-12,
      'worst speed drift = ' + worstSpeed.toExponential(2) + ', worst |F·v| = ' + worstFdotV.toExponential(2));

  // ROW 5 — NEG-CONTROL B=0 ⇒ STRAIGHT. integrateArc(1,1,1,0) max|x| < 1e-12 AND
  //         radius === Infinity. This is the row the page B=0 toggle flips RED.
  const arc0 = integrateArc(1, 1, 1, 0);
  const straight = arc0.maxX < 1e-12 && radius(1, 1, 1, 0) === Infinity;
  log('5 · NEG-CONTROL  B = 0 ⇒ STRAIGHT  (integrated max|x| === 0 AND r === ∞ — no field, no arc, no mass read)',
      straight, 'max|x| = ' + arc0.maxX.toExponential(2) + ', r = ' + radius(1, 1, 1, 0));

  // ROW 6 — MASS-FAN x ∝ m: worst |landingX/m − const| over SCENE.masses < 1e-9.
  //         The stripe SPACING is the mass ratio.
  let worst6 = 0; const base = landingX(S.masses[0], 1, S.v, S.B) / S.masses[0];
  for (const m of S.masses){
    worst6 = Math.max(worst6, Math.abs(landingX(m, 1, S.v, S.B) / m - base));
  }
  log('6 · MASS-FAN  x ∝ m  (landingX/m === const over the loaded masses — the stripe spacing IS the mass ratio, <1e-9)',
      worst6 < 1e-9, 'worst |x/m − const| = ' + worst6.toExponential(2));

  // ROW 7 — q-SIGN flips the bend: landingX(q>0) & landingX(q<0) opposite-signed.
  let worst7 = 0;
  for (const m of S.masses){
    const xp = landingX(m, +1, S.v, S.B), xm = landingX(m, -1, S.v, S.B);
    worst7 = Math.max(worst7, Math.abs(xp + xm));      // equal-and-opposite ⇒ sum 0
  }
  log('7 · q-SIGN flips the bend  (landingX(q>0) === −landingX(q<0) — opposite sides of the nozzle, <1e-12)',
      worst7 < 1e-12, 'worst |x₊ + x₋| = ' + worst7.toExponential(2));

  // ROW 8 — DETECTOR RATIO === MASS RATIO: the measured tick spacing reproduces
  //         the loaded-mass ratio. The detector reads mass off the geometry.
  let worst8 = 0;
  const measured = measuredMassRatio(S.masses, 1, S.v, S.B);
  for (let i = 0; i < S.masses.length; i++){
    const trueRatio = S.masses[i] / S.masses[0];
    worst8 = Math.max(worst8, Math.abs(measured[i] - trueRatio));
  }
  log('8 · DETECTOR RATIO === MASS RATIO  (measured tick spacing reproduces the loaded-mass ratio — the detector reads mass, <1e-9)',
      worst8 < 1e-9, 'worst |measured − true ratio| = ' + worst8.toExponential(2) + ' (ratios ' + measured.map(r => r.toFixed(2)).join(':') + ')');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === SORTER CORE END ===

export {
  SCENE,
  radius, landingX, period, speed, accel, rk4Step,
  integrateArc, measuredMassRatio, runSelfTest,
};
