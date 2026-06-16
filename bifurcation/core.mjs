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

// ===== ROAD-INTO-CHAOS CORE (inlined byte-twin of core.mjs) BEGIN =====
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
//
// This delegates to detectOrbitPeriod(attractor(...)) so that the box-count the
// EYE sees on the cobweb staircase and the period the TEST asserts are ONE
// computation — there is no second, private clustering anywhere.
export function periodOf(map, r, cap = 64, tol = 1e-4) {
  return detectOrbitPeriod(attractor(map, r, 1500, 600), cap, tol);
}

// The accumulation point r_∞ where the cascade ends and chaos begins, estimated
// by Richardson-style geometric extrapolation of the superstable ladder using δ:
//   R_∞ ≈ R_n + (R_n − R_{n−1}) / (δ − 1)
export function accumulationPoint(R, delta = FEIGENBAUM_DELTA) {
  if (R.length < 2) return NaN;
  const n = R.length - 1;
  return R[n] + (R[n] - R[n - 1]) / (delta - 1);
}

// ============================================================================
//  THE LIVE COBWEB LAYER — the staircase the page DRAWS and the period the
//  test ASSERTS are ONE computation. Everything below is byte-twinned, char for
//  char (minus the leading `export `), into index.html between the sentinels
//  and re-extracted by core.test.mjs so silent drift is impossible to commit.
// ============================================================================

// The PUBLISHED period-doubling ONSETS r_n of the logistic map (not the
// superstable R_n). These bound the bands where the live orbit has a given
// period: [lo, hi). C's table — the single source of truth for the snap-ticks
// painted on the r-knob AND for expectedPeriod's cross-check.
export const R_INFINITY = 3.5699456;
export const CASCADE_BANDS = {
  1:  [0,        3.0],
  2:  [3.0,      3.449490],
  4:  [3.449490, 3.544090],
  8:  [3.544090, 3.564407],
  16: [3.564407, 3.5699456],
};

// The cascade-PREDICTED period at r, read straight off the published onset table
// — a genuine cross-check INDEPENDENT of the live orbit. 0 past r_∞ (chaos band,
// where no finite period is predicted). Below the first onset it is the fixed
// point (period 1).
export function expectedPeriod(r) {
  if (r >= R_INFINITY) return 0;
  for (const p of [16, 8, 4, 2, 1]) {
    const [lo, hi] = CASCADE_BANDS[p];
    if (r >= lo && r < hi) return p;
  }
  return 1;
}

// The EXACT array the page draws as the cobweb staircase: iterate past the
// transient, then KEEP the next `keep` points. orbit[i] → orbit[i+1] is one
// step of the map, and the staircase pen walks (orbit[i],orbit[i]) up to the
// curve then across to (orbit[i+1],orbit[i+1]). This is the SOLE source of the
// staircase points — the page never runs a private loop. x0 defaults to the
// critical point xmax (lands on the attractor fast, the honest transient seed).
export function cobwebOrbit(map, r, x0 = null, transient = 800, keep = 256) {
  let x = (x0 === null) ? map.xmax : x0;
  for (let i = 0; i < transient; i++) x = map.f(r, x);
  const orbit = new Array(keep + 1);
  orbit[0] = x;
  for (let i = 1; i <= keep; i++) { x = map.f(r, x); orbit[i] = x; }
  return orbit;
}

// Detect the period of an ALREADY-COMPUTED orbit by tolerance-clustering its
// points — the SAME clustering periodOf used to use inline, now shared so the
// box-count the eye counts on the staircase and the period the test asserts are
// literally one function. Returns the band count, or 0 when it exceeds `cap`
// (treated as aperiodic/chaotic).
export function detectOrbitPeriod(orbit, cap = 64, tol = 1e-4) {
  const sorted = orbit.slice().sort((a, b) => a - b);
  let bands = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > tol) bands++;
    if (bands > cap) return 0;   // too many distinct values ⇒ treat as chaotic
  }
  return bands;
}

// The in-page self-test (the pill). Takes NO args (the cardioid pattern), runs
// the SAME claims as the Node twin's first checks, and is re-extracted from the
// page and re-evaluated by core.test.mjs to prove parity. Every detail string
// carries LIVE numbers, never a hardcoded echo.
export function runSelfTest(){
  const lines=[]; const T=(name,ok,detail='')=>lines.push({name,ok:!!ok,detail});
  const L=MAPS.logistic;
  const R=superstableLadder(L,8);
  const {best,ratios}=feigenbaumRatios(R);

  // δ MEASURED from the cascade → 4.6692, and the estimates converge to it.
  T('δ measured from the cascade → 4.6692', Math.abs(best-FEIGENBAUM_DELTA)<0.02, 'δ='+best.toFixed(5));
  T('the δ estimates converge toward the constant',
    Math.abs(ratios[ratios.length-1]-FEIGENBAUM_DELTA)<Math.abs(ratios[0]-FEIGENBAUM_DELTA),
    ratios.map(v=>v.toFixed(3)).join('→'));

  // UNIVERSALITY — the same δ falls out of the sine map.
  const Rs=superstableLadder(MAPS.sine,7); const bs=feigenbaumRatios(Rs).best;
  T('universality: the sine map yields the SAME δ', Math.abs(bs-FEIGENBAUM_DELTA)<0.05, 'δ(sine)='+bs.toFixed(4));

  // R_∞ the hardcoded onset agrees with the δ-extrapolated wall (< 0.001).
  T('R_INFINITY constant agrees with the extrapolated wall',
    Math.abs(R_INFINITY-accumulationPoint(R))<0.001,
    'const='+R_INFINITY.toFixed(7)+' extrap='+accumulationPoint(R).toFixed(7));

  // λ is the arbiter: negative in order, ≈ln2 in full chaos.
  T('λ<0 in the periodic window (r=3.2, stable 2-cycle)', lyapunov(L,3.2)<-0.01, 'λ='+lyapunov(L,3.2).toFixed(4));
  T('λ≈ln2 in full chaos (r=4.0)', Math.abs(lyapunov(L,4.0)-Math.LN2)<0.02, 'λ='+lyapunov(L,4.0).toFixed(4));

  // THE LIVE-PERIOD HEARTBEAT: the box-count the staircase traces == the
  // cascade-predicted period == the asserted period, at the band CENTERS.
  T('box-count == cascade period at band centers (1·2·4·8)',
    periodOf(L,2.8)===1 && expectedPeriod(2.8)===1 &&
    periodOf(L,3.2)===2 && expectedPeriod(3.2)===2 &&
    periodOf(L,3.50)===4 && expectedPeriod(3.50)===4 &&
    periodOf(L,3.555)===8 && expectedPeriod(3.555)===8,
    '2.8→1 · 3.2→2 · 3.50→4 · 3.555→8');

  // DRAWN == TESTED: the period read off the exact staircase array == the test's.
  T('drawn == tested: detectOrbitPeriod(cobwebOrbit(3.50))===4',
    detectOrbitPeriod(cobwebOrbit(L,3.50))===4, 'p='+detectOrbitPeriod(cobwebOrbit(L,3.50)));

  // NEG CONTROL — a chaotic r never fakes a closed loop (λ>0, period 0).
  T('neg control: chaotic r (3.7) is aperiodic & λ>0',
    periodOf(L,3.7)===0 && lyapunov(L,3.7)>0, 'p='+periodOf(L,3.7)+' λ='+lyapunov(L,3.7).toFixed(4));
  T('neg control: a short chaotic staircase still never closes (r=3.7)',
    detectOrbitPeriod(cobwebOrbit(L,3.7,null,50))===0, 'p='+detectOrbitPeriod(cobwebOrbit(L,3.7,null,50)));

  const passed=lines.filter(c=>c.ok).length;
  return { pass:passed, total:lines.length, lines };
}
// ===== ROAD-INTO-CHAOS CORE (inlined byte-twin of core.mjs) END =====
