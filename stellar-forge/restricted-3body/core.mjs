// The Balance Points — logic core (the field where two pulls plus the spin cancel).
//
// THE WHOLE POINT: put two bodies — a Sun and an Earth — into a circular orbit about their
// shared barycenter, then ride in the frame that TURNS WITH THEM. In that co-rotating frame
// the two primaries hang still, frozen on the x-axis, and a third, MASSLESS probe feels not
// one pull but THREE things at once: the Sun's gravity, the Earth's gravity, and the outward
// CENTRIFUGAL push of the spin. Add them and the result is the gradient of a single scalar
// "effective potential" Ω. There are exactly FIVE places in the whole plane where all three
// cancel — where ∇Ω = 0 — and a probe set down there hangs forever. They are the five
// Lagrange points L1…L5, and they are not a catalogue: they are the exact zeros of a field.
//
// THE EFFECTIVE POTENTIAL (the one field everything reads). Scale so G ≡ 1, the total mass ≡ 1,
// the separation ≡ 1, and the angular rate ω ≡ 1. Let μ be the secondary's mass fraction, so the
// primary (mass 1−μ) sits at x = −μ and the secondary (mass μ) at x = 1−μ on the rotating x-axis.
// With r1 = dist to the primary and r2 = dist to the secondary,
//      Ω(x,y) = ½(x² + y²) + (1−μ)/r1 + μ/r2.
// The first ½(x²+y²) term is the centrifugal potential of the ω≡1 spin; the two 1/r terms are the
// gravity wells. The rotating-frame equation of motion is ẍ = ∂Ω/∂x + 2ẏ, ÿ = ∂Ω/∂y − 2ẋ — the
// ±2(ẋ,ẏ) terms are the CORIOLIS force (the trap: it does no work, so it never appears in Ω, yet
// it is what turns a slide into a looping tadpole). The five equilibria are ∇Ω = 0, velocity = 0.
//
// THE FIVE BALANCE POINTS.
//   · COLLINEAR L1, L2, L3 lie on the x-axis (y = 0). There ∂Ω/∂y ≡ 0 automatically, and ∂Ω/∂x
//     is a smooth function with exactly one sign-change in each of three brackets — between the
//     primaries (L1 ∈ (−μ, 1−μ)), beyond the secondary (L2 ∈ (1−μ, 2)), and behind the primary
//     (L3 ∈ (−2, −μ)). collinearRoot() finds each by a SAFEGUARDED Newton–bisection hybrid that
//     can NEVER step outside its bracket (the Lifeguard anti-fling pattern): a Newton step is
//     taken only if it stays inside and shrinks the interval; otherwise it bisects. This is why a
//     naive Newton — which loves to fling off across the 1/r² singularities toward a primary —
//     is refused.
//   · TRIANGULAR L4, L5 are the two points that form an EQUILATERAL triangle with the primaries:
//     x = ½ − μ, y = ±√3/2. There r1 = r2 = 1 EXACTLY (closed form, no solve), and ∇Ω = 0 falls
//     out of the equilateral geometry. The famous "60°" is asserted here as r1 === r2 === 1.
//
// THE STABILITY FLIP (the bench's exact, falsifiable law). Linearize the rotating-frame motion
// about L4. The 4×4 companion matrix's eigenvalues come from a biquadratic in λ²:
//      λ⁴ + (4 − Ω_xx − Ω_yy) λ² + (Ω_xx Ω_yy − Ω_xy²) = 0.
// Evaluated at the equilateral point this reduces to the classic condition: L4/L5 are LINEARLY
// STABLE (all eigenvalues pure-imaginary ⇒ max real part = 0 ⇒ a bounded libration) when the
// mass ratio is small enough, and UNSTABLE (a real-positive eigenvalue ⇒ exponential ejection)
// when it is too large. The crossing is the GASCHEAU (Routh) bound, the exact root of
//      27 · μ_G · (1 − μ_G) = 1   ⇒   μ_G = (1 − √(1 − 4/27)) / 2 = 0.03852089650455137…
// maxEigenRealPart(μ) is 0 (to machine precision) for μ < μ_G and strictly positive for μ > μ_G.
// THIS is the bench's headline proof: the calm of the Trojan points is born of a SMALL mass
// ratio, not of the 60° geometry alone — push μ past the bound and the equilateral triangle is
// still there, but it no longer holds.
//
// THE NEG-CONTROL (the flip made motion — the bite that actually bites). Release a probe at rest
// a small position offset (0.015) from L4 and integrate the full rotating-frame motion. Below the
// bound (μ = 0.01, Earth–Moon-ish) it stays bounded — it librates a tadpole that closes on itself.
// Above the bound (μ = 0.06) the SAME release diverges past an escape radius. The discriminator is
// μ crossing μ_G, made visible as: does the released probe stay home, or get flung away? This is
// the eigenvalue flip you can watch.
//
// AN HONEST NOTE ON THE CORIOLIS SIGN (anti-myth). It is folklore that flipping the Coriolis sign
// "ejects the probe / blows the Jacobi constant up." It does NOT: a sign flip is a near-symmetry
// of the L4 libration — a wrong-sign integrator stays bounded and conserves a MIRROR Jacobi to
// ~1e-15. So this core does NOT assert "flipped sign ejects." The Coriolis sign is pinned instead
// by (a) the Jacobi constant — a grossly wrong integrator fails Jacobi conservation (leg 4) — and
// (b) the LIVE page's directed, prograde tadpole sense (a visual canary). The falsifiable
// discriminator is the μ-bound neg-control (leg 5), not a sign-flip ejection claim.
//
// THE INTEGRATOR. The rotating-frame motion has a velocity-dependent Coriolis term, so a plain
// Verlet is not symplectic here. stepProbe is an IMPLICIT-Coriolis kick–drift–kick: each half-kick
// solves the 2×2 linear system for the velocity that includes its own Coriolis response (a fixed
// 2×2 with determinant 1 + (dt)², inverted in closed form). It conserves the Jacobi constant
// C = 2Ω − v² to a tight bar and is the SINGLE integrator source — the page imports this, never a
// separate approximate stepper.
//
// THE SCOPE (honest). The restricted, circular, planar three-body problem: the two primaries are
// on a fixed circular orbit (their own motion is prescribed, not solved), the probe is massless
// (it never pulls back), and everything lives in the orbital plane. No eccentricity, no third
// dimension, no radiation. Every claim below is a dimensionless geometric or spectral fact — a
// zero of ∇Ω, an equilateral r1=r2=1, a sign-flip of an eigenvalue at an exact μ_G — never a
// catalogue number.
//
// SOURCING (anti-drift): index.html inlines the block between the RESTRICTED-3BODY CORE sentinels
// byte-for-byte; core.test.mjs byte-parity-checks the inlined copy so it can never silently drift.
// Zero-dep ESM. No randomness in the math, no wall-clock — every exported function is a pure total
// function (the LCG lives in the view layer's decorative starfield, never a claim).

// ===== RESTRICTED-3BODY CORE (byte-identical to core.mjs) =====
"use strict";

const G = 1;                 // gravitational constant, set to 1 (scaled units)
const OMEGA = 1;             // angular rate of the co-rotating frame, set to 1 (scaled units)
// the Gascheau (Routh) mass-ratio bound: the exact root of 27·μ(1−μ) = 1 in (0, ½).
const GASCHEAU_MU = (1 - Math.sqrt(1 - 4 / 27)) / 2;   // = 0.03852089650455137…
const SQRT3_2 = Math.sqrt(3) / 2;                        // √3/2, the L4/L5 height

// ── the two primaries on the rotating x-axis ──
// primary (mass 1−μ) at x = −μ; secondary (mass μ) at x = 1−μ. Their separation is 1; the
// barycenter is the origin. r1, r2 are the distances from a field point (x,y) to each.
function primaryX(mu){ return -mu; }
function secondaryX(mu){ return 1 - mu; }
function r1(x, y, mu){ const dx = x + mu;       return Math.sqrt(dx * dx + y * y); }
function r2(x, y, mu){ const dx = x - (1 - mu); return Math.sqrt(dx * dx + y * y); }

// ── the effective potential Ω and its gradient (the ONE field everything reads) ──
// Ω = ½(x²+y²) + (1−μ)/r1 + μ/r2. Convention: ∇Ω is the conservative part of the rotating-frame
// acceleration (so the EOM is ẍ = Ω_x + 2ẏ, ÿ = Ω_y − 2ẋ — the Coriolis terms are added in the
// integrator, never in Ω). Guards r < 1e-12 at a primary → the singular term contributes 0 (no NaN).
function Omega(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const ta = a < 1e-12 ? 0 : (1 - mu) / a;
  const tb = b < 1e-12 ? 0 : mu / b;
  return 0.5 * (x * x + y * y) + ta + tb;
}
function dOmdx(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const ga = a < 1e-12 ? 0 : (1 - mu) * (x + mu) / (a * a * a);
  const gb = b < 1e-12 ? 0 : mu * (x - (1 - mu)) / (b * b * b);
  return x - ga - gb;
}
function dOmdy(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const ga = a < 1e-12 ? 0 : (1 - mu) * y / (a * a * a);
  const gb = b < 1e-12 ? 0 : mu * y / (b * b * b);
  return y - ga - gb;
}
// the gradient as a vector (the "effective gravity" the live drag arrow shows).
function gradOmega(x, y, mu){ return [dOmdx(x, y, mu), dOmdy(x, y, mu)]; }

// second partials of Ω at a point (for the L4 stability eigenvalues). Closed form.
function d2Omdx2(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const a3 = a * a * a, a5 = a3 * a * a, b3 = b * b * b, b5 = b3 * b * b;
  const dxa = x + mu, dxb = x - (1 - mu);
  const ta = a < 1e-12 ? 0 : (1 - mu) * (1 / a3 - 3 * dxa * dxa / a5);
  const tb = b < 1e-12 ? 0 : mu * (1 / b3 - 3 * dxb * dxb / b5);
  return 1 - ta - tb;
}
function d2Omdy2(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const a3 = a * a * a, a5 = a3 * a * a, b3 = b * b * b, b5 = b3 * b * b;
  const ta = a < 1e-12 ? 0 : (1 - mu) * (1 / a3 - 3 * y * y / a5);
  const tb = b < 1e-12 ? 0 : mu * (1 / b3 - 3 * y * y / b5);
  return 1 - ta - tb;
}
function d2Omdxdy(x, y, mu){
  const a = r1(x, y, mu), b = r2(x, y, mu);
  const a5 = a * a * a * a * a, b5 = b * b * b * b * b;
  const dxa = x + mu, dxb = x - (1 - mu);
  const ta = a < 1e-12 ? 0 : (1 - mu) * 3 * dxa * y / a5;
  const tb = b < 1e-12 ? 0 : mu * 3 * dxb * y / b5;
  return ta + tb;     // ∂²Ω/∂x∂y = +Σ 3·dx·y·m/r⁵
}

// ── the collinear roots L1, L2, L3: SAFEGUARDED Newton–bisection on dOmdx(x,0) ──
// On y = 0, dOmdy ≡ 0, so equilibrium ⟺ dOmdx(x,0) = 0. dOmdx is monotone-with-one-root inside
// each bracket; the hybrid takes a Newton step only when it stays strictly inside the current
// bracket and reduces it, else bisects (the Lifeguard anti-fling guard: it can NEVER return a
// value outside [lo, hi], so it never flings across a singularity toward a primary).
function collinearRoot(mu, lo, hi){
  const f = (x) => dOmdx(x, 0, mu);
  // ∂(dOmdx)/∂x on y=0 is d2Omdx2(x,0).
  const fp = (x) => d2Omdx2(x, 0, mu);
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return NaN;                 // no sign change ⇒ no bracketed root (caller's bug)
  let x = 0.5 * (a + b);
  for (let i = 0; i < 200; i++){
    const fx = f(x);
    if (fx === 0 || (b - a) < 1e-15) break;
    // narrow the bracket using the sign of fx
    if (fa * fx < 0){ b = x; fb = fx; } else { a = x; fa = fx; }
    // try a Newton step from x; accept only if it lands strictly inside (a,b)
    const d = fp(x);
    let xNewton = (d !== 0 && Number.isFinite(d)) ? x - fx / d : Infinity;
    if (xNewton > a && xNewton < b){ x = xNewton; }
    else { x = 0.5 * (a + b); }                // bisect — the safeguard
  }
  return x;
}

// the five Lagrange points for a given μ, as [x, y] pairs (the field's exact zeros).
function lagrangePoints(mu){
  const sx = secondaryX(mu);                   // 1 − μ
  const L1 = [collinearRoot(mu, primaryX(mu) + 1e-9, sx - 1e-9), 0];
  const L2 = [collinearRoot(mu, sx + 1e-9, 2), 0];
  const L3 = [collinearRoot(mu, -2, primaryX(mu) - 1e-9), 0];
  const L4 = lagrangeTriangular(mu, +1);
  const L5 = lagrangeTriangular(mu, -1);
  return { L1, L2, L3, L4, L5 };
}
// the triangular points, closed form: x = ½ − μ, y = ±√3/2 (r1 = r2 = 1 exactly).
function lagrangeTriangular(mu, sign){ return [0.5 - mu, sign * SQRT3_2]; }

// ── the L4 stability eigenvalues (the headline law) ──
// At a point, the linearized rotating-frame motion has companion matrix whose eigenvalues solve
//      λ⁴ + (4 − Ω_xx − Ω_yy) λ² + (Ω_xx Ω_yy − Ω_xy²) = 0   (biquadratic in λ²).
// partialsL4 returns {Oxx, Oyy, Oxy} at L4; eigenLambdas returns the four λ (complex {re,im});
// maxEigenRealPart is max Re(λ): 0 (to machine precision) below μ_G, > 0 above it.
function partialsL4(mu){
  const [x, y] = lagrangeTriangular(mu, +1);
  return { Oxx: d2Omdx2(x, y, mu), Oyy: d2Omdy2(x, y, mu), Oxy: d2Omdxdy(x, y, mu) };
}
// complex sqrt of z = {re, im} (principal branch).
function csqrt(z){
  const m = Math.hypot(z.re, z.im), ang = Math.atan2(z.im, z.re), s = Math.sqrt(m);
  return { re: s * Math.cos(ang / 2), im: s * Math.sin(ang / 2) };
}
function eigenLambdas(mu){
  const { Oxx, Oyy, Oxy } = partialsL4(mu);
  const p = 4 - Oxx - Oyy;             // coeff of λ²
  const q = Oxx * Oyy - Oxy * Oxy;     // constant term
  const D = p * p - 4 * q;             // discriminant of the λ² quadratic
  // z = λ²: roots (−p ± √D)/2. Complex when D < 0.
  let zRoots;
  if (D >= 0){
    const s = Math.sqrt(D);
    zRoots = [{ re: (-p + s) / 2, im: 0 }, { re: (-p - s) / 2, im: 0 }];
  } else {
    const s = Math.sqrt(-D);
    zRoots = [{ re: -p / 2, im: s / 2 }, { re: -p / 2, im: -s / 2 }];
  }
  const lambdas = [];
  for (const z of zRoots){
    const w = csqrt(z);
    lambdas.push({ re: w.re, im: w.im });
    lambdas.push({ re: -w.re, im: -w.im });    // the ± pair
  }
  return lambdas;
}
function maxEigenRealPart(mu){
  let mx = -Infinity;
  for (const l of eigenLambdas(mu)) mx = Math.max(mx, l.re);
  return mx;
}
// the Gascheau bound check value: 27·μ(1−μ) (= 1 exactly at μ_G).
function gascheauBound(mu){ return 27 * mu * (1 - mu); }
// is L4/L5 linearly stable at this μ? (max real part ≈ 0 ⇒ stable; > 0 ⇒ ejects)
function l4Stable(mu){ return maxEigenRealPart(mu) < 1e-7; }

// ── the integrator: implicit-Coriolis kick–drift–kick (the SINGLE integrator source) ──
// State s = {x, y, vx, vy}. EOM: ẍ = Ω_x + 2ẏ, ÿ = Ω_y − 2ẋ. A half-kick solves the 2×2 linear
// system for the post-kick velocity that already includes its own Coriolis response:
//      v' = v + (dt/2)·(∇Ω(at fixed position) + 2·R·v'),   R = [[0,1],[−1,0]],
//   ⇒ (I − dt·R) v' = v + (dt/2)∇Ω, and (I − dt·R) = [[1,−dt],[dt,1]] has det = 1 + dt², inverted
// in closed form. This is symplectic-flavored and conserves the Jacobi constant C = 2Ω − v² to a
// tight bar. coriolisHalfKick does the velocity solve; stepProbe is KDK around one drift.
function coriolisHalfKick(vx, vy, gx, gy, dt){
  const h = dt / 2;
  const bx = vx + h * gx, by = vy + h * gy;     // v + (dt/2)∇Ω
  const det = 1 + dt * dt;                       // det of (I − dt·R)
  // (I − dt·R)⁻¹ = (1/det)·[[1, dt], [−dt, 1]]
  return [(bx + dt * by) / det, (-dt * bx + by) / det];
}
function stepProbe(s, dt, mu){
  let { x, y, vx, vy } = s;
  // half-kick at the current position
  let g = gradOmega(x, y, mu);
  [vx, vy] = coriolisHalfKick(vx, vy, g[0], g[1], dt);
  // drift
  x += dt * vx; y += dt * vy;
  // half-kick at the new position
  g = gradOmega(x, y, mu);
  [vx, vy] = coriolisHalfKick(vx, vy, g[0], g[1], dt);
  return { x, y, vx, vy };
}
// the Jacobi constant (the rotating-frame energy integral): C = 2Ω − v². Conserved by stepProbe.
function jacobiC(s, mu){ return 2 * Omega(s.x, s.y, mu) - (s.vx * s.vx + s.vy * s.vy); }

// ── the witness parameter set (the page's hero μ; the self-test's primary subject) ──
function witness(){ return { mu: 0.01 }; }

// ── the self-test: the bench proves its own claims numerically ──
function runRestricted3BodySelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // 1 · COLLINEAR ROOTS zero ∇Ω: |dOmdx(Li,0)| < 1e-9 at L1,L2,L3 over a μ sweep that straddles
  //     the bound. The safeguard guarantees each root stays inside its bracket (never flung off).
  {
    let maxAbs = 0, allInside = true;
    for (const mu of [0.001, 0.01, GASCHEAU_MU, 0.05]){
      const Lp = lagrangePoints(mu);
      for (const k of ['L1', 'L2', 'L3']){
        const [x] = Lp[k];
        maxAbs = Math.max(maxAbs, Math.abs(dOmdx(x, 0, mu)));
      }
      // anti-fling: each collinear root is inside its analytic bracket
      if (!(Lp.L1[0] > primaryX(mu) && Lp.L1[0] < secondaryX(mu))) allInside = false;
      if (!(Lp.L2[0] > secondaryX(mu) && Lp.L2[0] < 2)) allInside = false;
      if (!(Lp.L3[0] > -2 && Lp.L3[0] < primaryX(mu))) allInside = false;
    }
    ck('1 · COLLINEAR: |∇Ω| = 0 at L1,L2,L3 over μ∈{.001,.01,μ_G,.05}; each root inside its bracket (anti-fling)',
       maxAbs < 1e-9 && allInside, 'max|dOmdx| = ' + maxAbs.toExponential(2) + ' · all-inside=' + allInside);
  }

  // 2 · TRIANGULAR L4/L5 are EQUILATERAL (the 60° asserted as r1 = r2 = 1) and zero ∇Ω.
  {
    let maxR = 0, maxGrad = 0;
    for (const mu of [0.001, 0.01, 0.06]){
      for (const sgn of [+1, -1]){
        const [x, y] = lagrangeTriangular(mu, sgn);
        maxR = Math.max(maxR, Math.abs(r1(x, y, mu) - 1), Math.abs(r2(x, y, mu) - 1));
        maxGrad = Math.max(maxGrad, Math.abs(dOmdx(x, y, mu)), Math.abs(dOmdy(x, y, mu)));
      }
    }
    ck('2 · TRIANGULAR: L4/L5 equilateral (r1 = r2 = 1 ⇒ the 60° vertices) and ∇Ω = 0',
       maxR < 1e-12 && maxGrad < 1e-9, 'max|r−1| = ' + maxR.toExponential(2) + ' · max|∇Ω| = ' + maxGrad.toExponential(2));
  }

  // 3 · STABILITY FLIP across μ_G: 27·μ_G·(1−μ_G) = 1 exactly; maxEigenRealPart = 0 below the
  //     bound and > 0 above it. THE headline law — the calm is born of a small mass ratio.
  {
    const boundExact = Math.abs(gascheauBound(GASCHEAU_MU) - 1) < 1e-12;
    let belowAllZero = true, aboveAllPos = true;
    for (const mu of [0.001, 0.01, 0.02, 0.03, GASCHEAU_MU - 1e-4]){
      if (!(maxEigenRealPart(mu) < 1e-9)) belowAllZero = false;
    }
    for (const mu of [GASCHEAU_MU + 1e-4, 0.05, 0.06, 0.1, 0.2]){
      if (!(maxEigenRealPart(mu) > 1e-9)) aboveAllPos = false;
    }
    ck('3 · STABILITY FLIP: 27·μ_G·(1−μ_G) = 1 (μ_G = 0.0385208965…); maxRe(λ) = 0 below, > 0 above the bound',
       boundExact && belowAllZero && aboveAllPos,
       'μ_G=' + GASCHEAU_MU.toFixed(13) + ' · 27μ(1−μ)−1=' + (gascheauBound(GASCHEAU_MU) - 1).toExponential(2)
       + ' · below0=' + belowAllZero + ' · abovePos=' + aboveAllPos);
  }

  // 4 · JACOBI CONSERVED: along a μ=0.01 release off L4 (offset 0.015, stays bounded), |C − C0| is
  //     tiny. This is the INTEGRATOR's correctness gate (a grossly wrong stepper fails it) — NOT
  //     the Coriolis-sign discriminator (a flipped sign conserves a mirror Jacobi just as well).
  {
    const mu = 0.01, dt = 0.004, off = 0.015;
    const [lx, ly] = lagrangeTriangular(mu, +1);
    let s = { x: lx + off, y: ly, vx: 0, vy: 0 };
    const C0 = jacobiC(s, mu);
    let maxErr = 0;
    for (let i = 0; i < 20000; i++){
      s = stepProbe(s, dt, mu);
      maxErr = Math.max(maxErr, Math.abs(jacobiC(s, mu) - C0));
    }
    ck('4 · JACOBI: |C − C0| < 1e-3 along a bounded μ=0.01 release off L4 (the integrator correctness gate)',
       maxErr < 1e-3, 'max|ΔC| = ' + maxErr.toExponential(2) + ' over 20k steps (dt=0.004)');
  }

  // 5 · NEG-CONTROL (the bite): the SAME rest-release off L4 (position offset 0.015) stays BOUNDED
  //     at μ=0.01 (below μ_G) and EJECTS at μ=0.06 (above μ_G). The eigenvalue flip made motion —
  //     the discriminator is μ crossing the Gascheau bound, watchable as stay-home vs flung-away.
  {
    const dt = 0.004, off = 0.015, escapeRadius = 5, horizon = 40000, boundedBar = 0.5;
    function maxExcursion(mu){
      const [lx, ly] = lagrangeTriangular(mu, +1);
      let s = { x: lx + off, y: ly, vx: 0, vy: 0 };
      let mx = 0;
      for (let i = 0; i < horizon; i++){
        s = stepProbe(s, dt, mu);
        const d = Math.hypot(s.x - lx, s.y - ly);
        if (d > mx) mx = d;
        if (d > escapeRadius) break;     // ejected — stop early
      }
      return mx;
    }
    const held = maxExcursion(0.01);     // below μ_G → bounded
    const ejected = maxExcursion(0.06);  // above μ_G → diverges
    ck('5 · NEG-CONTROL: rest-release off L4 stays bounded at μ=0.01 (< 0.5) and EJECTS at μ=0.06 (> escape=5)',
       held < boundedBar && ejected > escapeRadius,
       'μ=0.01 maxDist=' + held.toFixed(3) + ' (held) · μ=0.06 maxDist=' + ejected.toFixed(3) + ' (ejected)');
  }

  // 6 · GUARD leg: ∇Ω finite (no NaN) at and very near both primaries; Ω finite near them too.
  {
    const mu = 0.01;
    const px = primaryX(mu), sx = secondaryX(mu);
    const pts = [[px, 0], [sx, 0], [px + 1e-13, 0], [sx, 1e-13], [px, -1e-13]];
    let ok = true;
    for (const [x, y] of pts){
      const g = gradOmega(x, y, mu);
      if (!Number.isFinite(g[0]) || !Number.isFinite(g[1]) || !Number.isFinite(Omega(x, y, mu))) ok = false;
    }
    ck('6 · GUARD: ∇Ω and Ω finite (no NaN) at and adjacent to both primaries (r < 1e-12 guards)',
       ok, 'all-finite-at/near-primaries = ' + ok);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END RESTRICTED-3BODY CORE =====

export {
  G, OMEGA, GASCHEAU_MU, SQRT3_2,
  primaryX, secondaryX, r1, r2,
  Omega, dOmdx, dOmdy, gradOmega,
  d2Omdx2, d2Omdy2, d2Omdxdy,
  collinearRoot, lagrangePoints, lagrangeTriangular,
  partialsL4, csqrt, eigenLambdas, maxEigenRealPart, gascheauBound, l4Stable,
  coriolisHalfKick, stepProbe, jacobiC,
  witness, runRestricted3BodySelfTest,
};
