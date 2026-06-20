// Node twin for The Balance Points. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the SHAPE of the restricted circular three-body problem's equilibrium field — the five
// exact zeros of ∇Ω, the equilateral L4/L5 (the 60° as r1=r2=1), the L4 stability eigenvalues
// flipping real-part sign across the Gascheau bound 27μ(1−μ)=1, the implicit-Coriolis integrator
// conserving the Jacobi constant, and the μ-bound neg-control (bounded below μ_G, ejecting above).
// Independent of the page's runSelfTest where it matters:
//   (a) runs the core's own runRestricted3BodySelfTest() — all legs green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest at independent points:
//         · finite-difference of Ω vs the analytic ∇Ω (central diff) at independent (μ, x, y),
//         · finite-difference of ∇Ω vs the analytic second partials (Hessian) at L4,
//         · the eigenvalue λ⁴ + (4−Oxx−Oyy)λ² + (OxxOyy−Oxy²) actually annihilates each λ (residual≈0),
//         · a BISECTION root of dOmdx in each collinear bracket matches lagrangePoints to <1e-9,
//         · the exact Gascheau root: 27μ(1−μ)=1 and μ_G = (1−√(1−4/27))/2 agree,
//         · maxEigenRealPart = 0 below μ_G and > 0 above, on a FINER μ grid than the page,
//         · the Jacobi constant is conserved on a LONGER bounded horizon than the page,
//         · the neg-control bounded/eject split reproduced at INDEPENDENT μ pairs,
//         · the wrong-Coriolis-sign anti-myth: a sign-flipped integrator stays BOUNDED and
//           conserves a mirror Jacobi (the honest reason the self-test does NOT claim sign→eject),
//         · domain guards (∇Ω finite at/near both primaries; collinearRoot rejects a non-bracket);
//   (c) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  G, OMEGA, GASCHEAU_MU, SQRT3_2,
  primaryX, secondaryX, r1, r2,
  Omega, dOmdx, dOmdy, gradOmega,
  d2Omdx2, d2Omdy2, d2Omdxdy,
  collinearRoot, lagrangePoints, lagrangeTriangular,
  partialsL4, csqrt, eigenLambdas, maxEigenRealPart, gascheauBound, l4Stable,
  coriolisHalfKick, stepProbe, jacobiC,
  witness, runRestricted3BodySelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the core's own self-test is all-green ──
const st = runRestricted3BodySelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// FD-vs-GRADIENT — central difference of Ω recovers ∇Ω at independent (μ, x, y), AWAY from primaries.
ck('FD-vs-∇Ω: central diff of Ω === [dOmdx, dOmdy] at independent points  [<1e-6]', (() => {
  let mx = 0;
  for (const mu of [0.005, 0.0231, 0.07]){
    for (const [x, y] of [[0.3, 0.4], [-0.6, 0.5], [1.3, -0.2], [0.49, SQRT3_2]]){
      const h = 1e-6;
      const fdx = (Omega(x + h, y, mu) - Omega(x - h, y, mu)) / (2 * h);
      const fdy = (Omega(x, y + h, mu) - Omega(x, y - h, mu)) / (2 * h);
      mx = Math.max(mx, Math.abs(fdx - dOmdx(x, y, mu)), Math.abs(fdy - dOmdy(x, y, mu)));
    }
  }
  return mx < 1e-6;
})());

// FD-vs-HESSIAN — central diff of ∇Ω recovers the analytic second partials at L4 over a μ sweep.
ck('FD-vs-Hessian: central diff of ∇Ω === [Oxx, Oyy, Oxy] at L4  [<1e-5]', (() => {
  let mx = 0;
  for (const mu of [0.01, 0.0385, 0.06]){
    const [x, y] = lagrangeTriangular(mu, +1);
    const h = 1e-5;
    const Oxx = (dOmdx(x + h, y, mu) - dOmdx(x - h, y, mu)) / (2 * h);
    const Oyy = (dOmdy(x, y + h, mu) - dOmdy(x, y - h, mu)) / (2 * h);
    const Oxy = (dOmdx(x, y + h, mu) - dOmdx(x, y - h, mu)) / (2 * h);
    const P = partialsL4(mu);
    mx = Math.max(mx, Math.abs(Oxx - P.Oxx), Math.abs(Oyy - P.Oyy), Math.abs(Oxy - P.Oxy));
  }
  return mx < 1e-5;
})());

// EIGEN RESIDUAL — each λ actually annihilates the biquadratic λ⁴ + pλ² + q (complex residual ≈ 0).
ck('eigen residual: every λ solves λ⁴ + (4−Oxx−Oyy)λ² + (OxxOyy−Oxy²) = 0  [|residual| < 1e-9]', (() => {
  let mx = 0;
  for (const mu of [0.01, 0.05, 0.1]){
    const P = partialsL4(mu);
    const p = 4 - P.Oxx - P.Oyy, q = P.Oxx * P.Oyy - P.Oxy * P.Oxy;
    for (const l of eigenLambdas(mu)){
      // λ² and λ⁴ in complex arithmetic
      const l2 = { re: l.re * l.re - l.im * l.im, im: 2 * l.re * l.im };
      const l4 = { re: l2.re * l2.re - l2.im * l2.im, im: 2 * l2.re * l2.im };
      const re = l4.re + p * l2.re + q, im = l4.im + p * l2.im;
      mx = Math.max(mx, Math.hypot(re, im));
    }
  }
  return mx < 1e-9;
})());

// BISECTION ROOTS — a plain bisection of dOmdx in each collinear bracket matches lagrangePoints.
ck('bisection: independent bisection of dOmdx in each bracket === lagrangePoints L1,L2,L3  [<1e-9]', (() => {
  function bisect(mu, lo, hi){
    const f = (x) => dOmdx(x, 0, mu);
    let a = lo, b = hi, fa = f(a);
    for (let i = 0; i < 200; i++){ const m = 0.5 * (a + b), fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
    return 0.5 * (a + b);
  }
  let mx = 0;
  for (const mu of [0.003, 0.01, 0.04, 0.09]){
    const Lp = lagrangePoints(mu);
    const px = primaryX(mu), sx = secondaryX(mu);
    mx = Math.max(mx, Math.abs(bisect(mu, px + 1e-7, sx - 1e-7) - Lp.L1[0]));
    mx = Math.max(mx, Math.abs(bisect(mu, sx + 1e-7, 2) - Lp.L2[0]));
    mx = Math.max(mx, Math.abs(bisect(mu, -2, px - 1e-7) - Lp.L3[0]));
  }
  return mx < 1e-9;
})());

// GASCHEAU EXACT — 27μ(1−μ)=1 at μ_G, and μ_G matches the closed form to machine precision.
ck('Gascheau: 27·μ_G·(1−μ_G) === 1 and μ_G === (1−√(1−4/27))/2  [<1e-13]', (() => {
  const closed = (1 - Math.sqrt(1 - 4 / 27)) / 2;
  return Math.abs(gascheauBound(GASCHEAU_MU) - 1) < 1e-13 && Math.abs(GASCHEAU_MU - closed) < 1e-15;
})());

// SIGN FLIP on a FINER grid than the page — exactly one crossing, at μ_G; monotone-ish past it.
ck('sign flip (fine grid): maxRe(λ) === 0 for all μ < μ_G and > 0 for all μ > μ_G  [201-pt sweep]', (() => {
  let ok = true;
  for (let i = 1; i < 100; i++){
    const mu = (i / 100) * GASCHEAU_MU * 0.999;           // strictly below
    if (!(maxEigenRealPart(mu) < 1e-9)) ok = false;
  }
  for (let i = 1; i <= 100; i++){
    const mu = GASCHEAU_MU + (i / 100) * (0.5 - GASCHEAU_MU);  // above, up to μ=½
    if (!(maxEigenRealPart(mu) > 1e-9)) ok = false;
  }
  // and l4Stable agrees with the sign of maxRe across the bound
  ok = ok && l4Stable(0.02) && l4Stable(GASCHEAU_MU - 1e-3) && !l4Stable(0.05) && !l4Stable(0.1);
  return ok;
})());

// JACOBI on a LONGER bounded horizon than the page (μ=0.01 release stays bounded, C conserved).
const jac = (() => {
  const mu = 0.01, dt = 0.004, off = 0.015;
  const [lx, ly] = lagrangeTriangular(mu, +1);
  let s = { x: lx + off, y: ly, vx: 0, vy: 0 };
  const C0 = jacobiC(s, mu);
  let maxErr = 0, maxDist = 0;
  for (let i = 0; i < 40000; i++){
    s = stepProbe(s, dt, mu);
    maxErr = Math.max(maxErr, Math.abs(jacobiC(s, mu) - C0));
    maxDist = Math.max(maxDist, Math.hypot(s.x - lx, s.y - ly));
  }
  return { maxErr, maxDist };
})();
ck('Jacobi (long horizon): |C − C0| < 1e-3 over 40k steps and the μ=0.01 release stays bounded (< 0.5)',
   jac.maxErr < 1e-3 && jac.maxDist < 0.5);

// NEG-CONTROL at INDEPENDENT μ pairs — bounded for several μ < μ_G, ejecting for several μ > μ_G.
ck('neg-control (independent μ): bounded for μ∈{0.005,0.01,0.02} · ejects for μ∈{0.06,0.08,0.12}', (() => {
  const dt = 0.004, off = 0.015, esc = 5, horizon = 40000;
  function excursion(mu){
    const [lx, ly] = lagrangeTriangular(mu, +1);
    let s = { x: lx + off, y: ly, vx: 0, vy: 0 }, mx = 0;
    for (let i = 0; i < horizon; i++){
      s = stepProbe(s, dt, mu);
      const d = Math.hypot(s.x - lx, s.y - ly);
      if (d > mx) mx = d;
      if (d > esc) break;
    }
    return mx;
  }
  for (const mu of [0.005, 0.01, 0.02]) if (!(excursion(mu) < 0.6)) return false;
  for (const mu of [0.06, 0.08, 0.12]) if (!(excursion(mu) > esc)) return false;
  return true;
})());

// ANTI-MYTH: a wrong-Coriolis-sign integrator stays BOUNDED and conserves a MIRROR Jacobi — this
// is precisely why the self-test does NOT claim "flipped sign ejects." (Reproduce the falsification.)
ck('anti-myth: flipped-Coriolis-sign integrator stays bounded at μ=0.01 and conserves Jacobi (sign≠discriminator)', (() => {
  // a stepper identical to stepProbe but with the Coriolis sign reversed (R → −R).
  function halfKickFlipped(vx, vy, gx, gy, dt){
    const h = dt / 2, bx = vx + h * gx, by = vy + h * gy, det = 1 + dt * dt;
    // (I + dt·R)⁻¹ = (1/det)·[[1, −dt],[dt, 1]]
    return [(bx - dt * by) / det, (dt * bx + by) / det];
  }
  function stepFlipped(s, dt, mu){
    let { x, y, vx, vy } = s;
    let g = gradOmega(x, y, mu); [vx, vy] = halfKickFlipped(vx, vy, g[0], g[1], dt);
    x += dt * vx; y += dt * vy;
    g = gradOmega(x, y, mu); [vx, vy] = halfKickFlipped(vx, vy, g[0], g[1], dt);
    return { x, y, vx, vy };
  }
  const mu = 0.01, dt = 0.004, off = 0.015;
  const [lx, ly] = lagrangeTriangular(mu, +1);
  let s = { x: lx + off, y: ly, vx: 0, vy: 0 };
  const C0 = jacobiC(s, mu);
  let maxErr = 0, maxDist = 0;
  for (let i = 0; i < 20000; i++){
    s = stepFlipped(s, dt, mu);
    maxErr = Math.max(maxErr, Math.abs(jacobiC(s, mu) - C0));
    maxDist = Math.max(maxDist, Math.hypot(s.x - lx, s.y - ly));
  }
  return maxDist < 0.5 && maxErr < 1e-3;   // bounded AND Jacobi-conserving — the flip does NOT eject
})());

// DOMAIN GUARDS — ∇Ω finite at/near both primaries; collinearRoot rejects a non-bracket (NaN).
ck('domain guard: ∇Ω finite at/near both primaries; collinearRoot(no-sign-change) === NaN', (() => {
  const mu = 0.01, px = primaryX(mu), sx = secondaryX(mu);
  for (const [x, y] of [[px, 0], [sx, 0], [px + 1e-13, 0], [sx, -1e-13]]){
    const g = gradOmega(x, y, mu);
    if (!Number.isFinite(g[0]) || !Number.isFinite(g[1]) || !Number.isFinite(Omega(x, y, mu))) return false;
  }
  // a bracket with no sign change ⇒ NaN (the caller bug is surfaced, not papered over)
  return Number.isNaN(collinearRoot(mu, 0.3, 0.45));
})());

// ── (c) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== RESTRICTED-3BODY CORE (byte-identical to core.mjs) =====';
const END = '// ===== END RESTRICTED-3BODY CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: RESTRICTED-3BODY CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: RESTRICTED-3BODY CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
const Lp = lagrangePoints(0.01);
console.log('The Balance Points — core.test.mjs');
console.log('  core self-test: ' + st.passed + '/' + st.total + ' legs green');
console.log('  Gascheau bound μ_G = ' + GASCHEAU_MU.toFixed(15) + ' · 27μ(1−μ)−1 = ' + (gascheauBound(GASCHEAU_MU) - 1).toExponential(2));
console.log('  L points (μ=0.01): L1=' + Lp.L1[0].toFixed(6) + ' L2=' + Lp.L2[0].toFixed(6) + ' L3=' + Lp.L3[0].toFixed(6)
  + ' L4=[' + Lp.L4[0].toFixed(3) + ',' + Lp.L4[1].toFixed(3) + ']');
console.log('  maxRe(λ): μ=0.01 → ' + maxEigenRealPart(0.01).toExponential(2) + ' (stable) · μ=0.06 → ' + maxEigenRealPart(0.06).toExponential(2) + ' (unstable)');
console.log('  Jacobi conservation (40k steps, μ=0.01 bounded release): max|ΔC| = ' + jac.maxErr.toExponential(2) + ' · maxDist = ' + jac.maxDist.toFixed(3));
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
