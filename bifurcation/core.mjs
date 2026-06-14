// ============================================================================
//  The Road Into Chaos — logistic-map bifurcation CORE
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  The map:   x → r·x·(1−x)         on x∈[0,1], for the parameter r∈[0,4].
//
//  As r climbs, a stable fixed point gives way to a stable 2-cycle, then a
//  4-cycle, 8-cycle, 16-cycle … — the PERIOD-DOUBLING CASCADE — and the windows
//  between successive doublings shrink by a UNIVERSAL ratio. The bifurcation
//  parameters r_n converge geometrically:
//
//        δ = lim_{n→∞} (r_{n−1} − r_{n−2}) / (r_n − r_{n−1})  →  4.6692016…
//
//  That δ — Feigenbaum's constant — is the same for ANY map with a smooth
//  quadratic maximum (sine map, cosine map, …). This bench MEASURES it and
//  asserts it. The cascade is not drawn — the road into chaos is MEASURED, and
//  the measurement is falsifiable.
//
//  How we pin the r_n precisely: at the SUPERSTABLE parameter R_n of a 2^n-cycle,
//  the critical point x=1/2 is a member of the cycle (the multiplier is 0). The
//  superstable points R_n also converge by the SAME δ (Feigenbaum showed both
//  ladders share the limit), and they are root-findable to machine precision —
//  far cleaner than chasing the exact onset r_n. We bracket-and-bisect the
//  function  Q_n(r) = f^{2^n}(1/2; r) − 1/2  for its first root above R_{n−1}.
// ============================================================================

export const FEIGENBAUM_DELTA = 4.669201609102990;  // the universal constant
export const FEIGENBAUM_ALPHA = 2.502907875095892;  // the spatial scaling (kept for reference)

// The logistic map and a family of "tent/sine" maps that share δ (universality).
export const MAPS = {
  logistic: { lo: 0, hi: 4,        f: (r, x) => r * x * (1 - x),               xmax: 0.5,
              label: 'logistic  x → r·x(1−x)' },
  // sine map  x → r·sin(πx)/π·… we use the standard r·sin(πx) on [0,1], r∈[0,1].
  sine:     { lo: 0, hi: 1,        f: (r, x) => r * Math.sin(Math.PI * x),     xmax: 0.5,
              label: 'sine  x → r·sin(πx)' },
  // cubic-flavoured quadratic-max variant (still a smooth single hump) for contrast
  cosine:   { lo: 0, hi: 2,        f: (r, x) => r * (1 - Math.cos(Math.PI * x)) / 2, xmax: 1,
              label: 'cosine  x → r·(1−cos πx)/2' },
};

// Iterate the map n times from x0 (used for trajectories / the superstable test).
export function iterate(map, r, x0, n) {
  let x = x0;
  for (let i = 0; i < n; i++) x = map.f(r, x);
  return x;
}

// f^{2^n}(xmax) − xmax. At a superstable 2^n-cycle this is exactly 0, because the
// critical point xmax is on the cycle and returns to itself after 2^n steps.
function superstableResidual(map, r, n) {
  const period = 1 << n;            // 2^n
  return iterate(map, r, map.xmax, period) - map.xmax;
}

// Bisection root of g on [a,b] with a sign change; ~52 halvings → double precision.
function bisect(g, a, b, iters = 80) {
  let ga = g(a), gb = g(b);
  if (ga === 0) return a;
  if (gb === 0) return b;
  if (ga * gb > 0) return NaN;      // no bracketed root
  for (let i = 0; i < iters; i++) {
    const m = 0.5 * (a + b), gm = g(m);
    if (gm === 0) return m;
    if (ga * gm < 0) { b = m; gb = gm; } else { a = m; ga = gm; }
  }
  return 0.5 * (a + b);
}

// Find the superstable parameter R_n for the 2^n-cycle (n=0,1,2,…). We scan r
// upward in fine steps from a lower bound, looking for the FIRST sign change of
// the residual above the previous superstable point, then bisect it.
//   R_0 (period 1, the fixed point) of the logistic map is r=2 (x*=1/2 ⇒ r·¼=½).
export function superstablePoint(map, n, lowerBound, scanStep = 1e-4) {
  const g = (r) => superstableResidual(map, r, n);
  let a = lowerBound + 1e-7;
  let ga = g(a);
  // March upward until the residual changes sign; that brackets the next root.
  let r = a;
  for (r = a + scanStep; r <= map.hi + 1e-9; r += scanStep) {
    const gr = g(r);
    if (!isFinite(gr)) continue;
    if (ga * gr < 0) return bisect(g, r - scanStep, r);
    ga = gr; a = r;
  }
  return NaN;
}

// Build the ladder of superstable points R_0..R_{N} for a map, marching each
// search up from the previous rung so we always grab the NEXT doubling.
export function superstableLadder(map, N, scanStep = 2e-5) {
  const R = [];
  let lower = map.lo;
  for (let n = 0; n <= N; n++) {
    // The doublings crowd together fast, so refine the scan step as n grows.
    const step = scanStep / Math.pow(1.9, Math.max(0, n - 2));
    const rn = superstablePoint(map, n, n === 0 ? map.lo : R[n - 1], step);
    if (!isFinite(rn)) break;
    R.push(rn);
    lower = rn;
  }
  return R;
}

// Feigenbaum ratios from a ladder of bifurcation/superstable parameters:
//   δ_n = (R_{n−1} − R_{n−2}) / (R_n − R_{n−1})
// The sequence converges to δ ≈ 4.6692. Returns the per-step ratios and the
// best (last, most-converged) estimate.
export function feigenbaumRatios(R) {
  const ratios = [];
  for (let n = 2; n < R.length; n++) {
    const num = R[n - 1] - R[n - 2];
    const den = R[n] - R[n - 1];
    ratios.push(num / den);
  }
  return { ratios, best: ratios.length ? ratios[ratios.length - 1] : NaN };
}

// ============================================================================
//  Orbit diagram + Lyapunov exponent (the "is it chaos?" witness)
// ============================================================================

// Sample the long-term orbit (attractor) at parameter r: iterate past the
// transient, then collect `keep` points. Returns the set of visited x-values.
export function attractor(map, r, transient = 600, keep = 400) {
  let x = map.xmax;     // start from the critical point — lands on the attractor fast
  for (let i = 0; i < transient; i++) x = map.f(r, x);
  const pts = new Array(keep);
  for (let i = 0; i < keep; i++) { x = map.f(r, x); pts[i] = x; }
  return pts;
}

// The Lyapunov exponent λ(r): the average log|f′| along the orbit. λ<0 ⇒ a stable
// periodic orbit (nearby trajectories converge); λ>0 ⇒ sensitive dependence —
// CHAOS — the honest, quantitative definition of "the road has ended in chaos".
// f′(x) for the logistic map is r(1−2x); we differentiate numerically so it works
// for ANY map in the family.
export function lyapunov(map, r, transient = 500, steps = 8000) {
  // Start from a GENERIC interior point, NOT the critical point xmax. The
  // critical point is special: for the logistic map at r=4 it is pre-periodic
  // (0.5→1→0, a fixed point) and lands on a measure-zero orbit whose average is
  // ln4=2ln2, not the ergodic ln2. A generic seed explores the true chaotic
  // measure, so the time-average converges to the correct Lyapunov exponent.
  let x = 0.1 + 0.3 * (map.xmax || 0.5);   // an off-symmetry interior point
  if (x <= 0 || x >= 1) x = 0.137;
  for (let i = 0; i < transient; i++) x = map.f(r, x);
  let sum = 0, counted = 0;
  const h = 1e-7;
  for (let i = 0; i < steps; i++) {
    const d = (map.f(r, x + h) - map.f(r, x - h)) / (2 * h);   // f′(x)
    const a = Math.abs(d);
    if (a > 1e-12 && isFinite(a)) { sum += Math.log(a); counted++; }
    x = map.f(r, x);
  }
  return counted ? sum / counted : -Infinity;
}

// Detect the period of the attractor at r (1,2,4,8,… or 0 for "aperiodic/chaos")
// by tolerance-clustering the kept orbit points. Returns the number of distinct
// bands, capped — a clean way to colour the orbit diagram by period.
export function periodOf(map, r, cap = 64, tol = 1e-4) {
  const pts = attractor(map, r, 1500, 600);
  const sorted = pts.slice().sort((a, b) => a - b);
  let bands = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > tol) bands++;
    if (bands > cap) return 0;   // too many distinct values ⇒ treat as chaotic
  }
  return bands;
}

// The accumulation point r_∞ where the cascade ends and chaos begins, estimated
// by Richardson-style geometric extrapolation of the superstable ladder using δ:
//   R_∞ ≈ R_n + (R_n − R_{n−1}) / (δ − 1)
export function accumulationPoint(R, delta = FEIGENBAUM_DELTA) {
  if (R.length < 2) return NaN;
  const n = R.length - 1;
  return R[n] + (R[n] - R[n - 1]) / (delta - 1);
}
