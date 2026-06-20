// The Lifeguard's Run — pure least-time / refraction core. The SOLE math authority.
// Zero-dependency ESM, NO DOM. The page (index.html) and the Node twin (core.test.mjs)
// both inline the slice between the LIFEGUARDS-RUN CORE sentinels BYTE-FOR-BYTE, so the
// picture, the in-page self-test, and the Node twin can never disagree about the math.
//
// THE STORY: a beam (or a lifeguard) starts in the FAST upper medium (speed v1) and must
// reach a target in the SLOW lower medium (speed v2), crossing a horizontal boundary. It
// is free to cross at any x. The path that takes the LEAST time is bent — and the bend it
// settles into IS Snell's law, sinθ1/v1 = sinθ2/v2. This file proves it.
//
// THE PARAM SHAPE (the contract every facet obeys):
//   p = { src:[sx,sy], tgt:[tx,ty], boundaryY, v1, v2, maximize? }
//     src in the FAST upper medium (speed v1); tgt in the SLOW lower medium (speed v2);
//     boundaryY strictly between sy and ty. The crossing point is X = [x, boundaryY].
//
// ===== LIFEGUARDS-RUN CORE (byte-identical to core.mjs) =====
// Leg lengths from the source/target to a crossing at horizontal position x:
//   a1 = vertical drop in the fast medium, a2 = vertical drop in the slow medium.
function legA1(p){ return Math.abs(p.boundaryY - p.src[1]); }
function legA2(p){ return Math.abs(p.tgt[1] - p.boundaryY); }
function dist1(x, p){ return Math.hypot(x - p.src[0], legA1(p)); }   // source → X
function dist2(x, p){ return Math.hypot(p.tgt[0] - x, legA2(p)); }   // X → target

// travelTime(x,p): the stopwatch number — time to go src→X in medium 1, X→tgt in medium 2.
//   t(x) = d1(x)/v1 + d2(x)/v2.
function travelTime(x, p){
  return dist1(x, p) / p.v1 + dist2(x, p) / p.v2;
}

// dtdx(x,p): dt/dx, written in the form that EXPOSES Snell. With
//   sinθ1 = (x − sx)/d1   (angle from the normal on the source side)
//   sinθ2 = (tx − x)/d2   (angle from the normal on the target side)
// we have   dt/dx = sinθ1/v1 − sinθ2/v2.   So dt/dx = 0  ⟺  sinθ1/v1 = sinθ2/v2 (Snell).
function dtdx(x, p){
  const d1 = dist1(x, p), d2 = dist2(x, p);
  return (x - p.src[0]) / (p.v1 * d1) - (p.tgt[0] - x) / (p.v2 * d2);
}

// d2tdx2(x,p): the second derivative. Each term is a1²/(v·d³)-style and STRICTLY POSITIVE,
// so t is strictly convex in x — there is exactly ONE stationary point and it is a MINIMUM
// (never a saddle, never a max). This is what makes "t''(x*) > 0" provable, not asserted.
function d2tdx2(x, p){
  const a1 = legA1(p), a2 = legA2(p);
  const d1 = dist1(x, p), d2 = dist2(x, p);
  return (a1 * a1) / (p.v1 * d1 * d1 * d1) + (a2 * a2) / (p.v2 * d2 * d2 * d2);
}

// snellResidual(x,p): the SAME expression as dtdx, named for the physics readout. One
// formula, two names — so "is the slope zero?" (the minimization gauge) and "is Snell
// satisfied?" (the law readout) are provably ONE number. (Asserted equal in the self-test.)
function snellResidual(x, p){
  return dtdx(x, p);
}

// angles(x,p): the geometry the wedges and the printed ratio read.
//   sin1 = (x−sx)/d1, sin2 = (tx−x)/d2; theta1/theta2 in radians from the normal.
function angles(x, p){
  const d1 = dist1(x, p), d2 = dist2(x, p);
  const sin1 = (x - p.src[0]) / d1;
  const sin2 = (p.tgt[0] - x) / d2;
  return {
    sin1, sin2,
    theta1: Math.asin(Math.max(-1, Math.min(1, sin1))),
    theta2: Math.asin(Math.max(-1, Math.min(1, sin2))),
  };
}

// xChord(p): the straight-line crossing — where the geometric chord src→tgt cuts the
// boundary. The Newton seed, and the x* for the v1===v2 (no-bend) negative control.
function xChord(p){
  const dy = p.tgt[1] - p.src[1];
  if (dy === 0) return p.src[0];
  const f = (p.boundaryY - p.src[1]) / dy;
  return p.src[0] + f * (p.tgt[0] - p.src[0]);
}

// minimizeTime(p): the time-minimizing crossing. SAFEGUARDED Newton (Newton-bisection
// hybrid) on dt/dx, seeded from the straight chord. Convexity guarantees a unique root in
// the bracket [loX,hiX] (dtdx(loX) < 0 < dtdx(hiX)); a pure Newton step is taken when it
// stays inside the bracket and shrinks it, otherwise the step is bisected. This keeps
// Newton's quadratic speed in the normal case while NEVER diverging — t is asymptotically
// linear at ±∞ (curvature → 0), so unbounded Newton would fling x to infinity on some
// asymmetric, large-v1/v2 geometries; the bracket forbids that. Returns {x, tMin, edge}.
// If p.maximize: time is convex so it has NO interior maximum; the larger-time extreme is
// at a chord-EXTENT endpoint (the absurd edge-hug foil). Return that endpoint + {edge:true}.
function minimizeTime(p){
  if (p.maximize){
    // Compare the two ends of the slider span [loX, hiX] (the same bracket the page draws).
    const span = chordSpan(p);
    const tLo = travelTime(span.loX, p), tHi = travelTime(span.hiX, p);
    const x = (tHi >= tLo) ? span.hiX : span.loX;
    return { x, tMin: travelTime(x, p), edge: true };
  }
  // Establish a sign-change bracket [lo,hi] with dtdx(lo) < 0 < dtdx(hi). The chord span
  // suffices for in-domain crossings; widen geometrically if a degenerate pushes the root out.
  const sp = chordSpan(p);
  let lo = sp.loX, hi = sp.hiX, flo = dtdx(lo, p), fhi = dtdx(hi, p), grow = 0;
  while ((!(flo < 0) || !(fhi > 0)) && grow < 60){
    lo -= 10; hi += 10; flo = dtdx(lo, p); fhi = dtdx(hi, p); grow++;
  }
  let x = xChord(p);
  if (!(x > lo && x < hi)) x = 0.5 * (lo + hi);     // seed inside the bracket
  for (let i = 0; i < 80; i++){
    const g = dtdx(x, p);
    if (g === 0) break;
    if (g < 0) lo = x; else hi = x;                 // tighten the bracket around the root
    const h = d2tdx2(x, p);
    let nx = (h > 0) ? x - g / h : Number.NaN;       // Newton step
    if (!Number.isFinite(nx) || nx <= lo || nx >= hi) nx = 0.5 * (lo + hi);  // safeguard → bisect
    const step = nx - x;
    x = nx;
    if (Math.abs(step) < 1e-15) break;
  }
  return { x, tMin: travelTime(x, p), edge: false };
}

// chordSpan(p): the x-bracket the slider rides — a little past both endpoints, so the
// minimum is always interior and both edge-hug extremes are reachable.
function chordSpan(p){
  const loX = Math.min(p.src[0], p.tgt[0]) - 1;
  const hiX = Math.max(p.src[0], p.tgt[0]) + 1;
  return { loX, hiX };
}

// minimizeBrute(p) (a.k.a. crossCheckRoot): the PRECISION authority. Bisection ROOT of
// dt/dx on the bracket — convexity guarantees dtdx(loX) < 0 < dtdx(hiX), so a sign-change
// bracket exists and bisection converges. This replaces a literal "value scan", which on a
// quadratic minimum provably stalls near sqrt(machine-eps) (~1e-7); the root finds x* to
// ~1e-16. Newton and this agree to <1e-9 (measured ~4.44e-16).
function minimizeBrute(p){
  const span = chordSpan(p);
  let lo = span.loX, hi = span.hiX;
  let flo = dtdx(lo, p), fhi = dtdx(hi, p);
  // Guard: if the bracket somehow doesn't straddle the root, widen once.
  if (flo > 0 || fhi < 0){
    lo -= 10; hi += 10; flo = dtdx(lo, p); fhi = dtdx(hi, p);
  }
  let mid = 0.5 * (lo + hi);
  for (let i = 0; i < 200; i++){
    mid = 0.5 * (lo + hi);
    const fm = dtdx(mid, p);
    if (fm === 0) break;
    if (fm < 0) lo = mid; else hi = mid;
  }
  return { x: mid, tMin: travelTime(mid, p) };
}
const crossCheckRoot = minimizeBrute;

// scanTime(p,N): N samples of {x,t} across the slider span — ONLY to DRAW the t-vs-X rail
// (the picture of the floor). NEVER a precision claim; x* comes from minimizeTime/Brute.
function scanTime(p, N){
  const span = chordSpan(p);
  const out = [];
  const n = Math.max(2, N | 0);
  for (let i = 0; i < n; i++){
    const x = span.loX + (span.hiX - span.loX) * i / (n - 1);
    out.push({ x, t: travelTime(x, p) });
  }
  return out;
}

// witness(): the canonical parameters the self-test + the page boot to.
//   src in the fast medium (v1=2.0) above the shore at y=0; tgt in the slow medium (v2=1.0)
//   below it. The least-time crossing is x* ≈ 2.934, t'' ≈ 0.186, residual ~5e-17 — a
//   beam that visibly bends TOWARD the normal entering the slow medium (v1 > v2).
function witness(){
  return { src: [-4, 3], tgt: [5, -4], boundaryY: 0, v1: 2.0, v2: 1.0 };
}

// runSelfTest(): prove the claims numerically. Returns {ok,passed,total,checks},
// each check {name,pass,info}. The page's pill and the Node twin both call THIS.
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const TOL = 1e-9;

  const paramSets = [
    witness(),
    { src: [-6, 4], tgt: [3, -2], boundaryY: 0, v1: 1.7, v2: 1.0 },
    { src: [-2, 5], tgt: [8, -3], boundaryY: 1, v1: 3.0, v2: 1.2 },
    { src: [-5, 2], tgt: [-1, -6], boundaryY: -1, v1: 2.5, v2: 0.8 },
    { src: [1, 6], tgt: [9, -1], boundaryY: 2, v1: 1.4, v2: 1.1 },
  ];

  // (1) STATIONARY ⟺ SNELL: at x* both |snellResidual| and |dt/dx| vanish (and are the
  // SAME number, by construction). The hand's "flat floor" IS Snell's law.
  {
    let maxRes = 0, maxSlope = 0, sameNumber = true;
    for (const p of paramSets){
      const x = minimizeTime(p).x;
      maxRes = Math.max(maxRes, Math.abs(snellResidual(x, p)));
      maxSlope = Math.max(maxSlope, Math.abs(dtdx(x, p)));
      if (snellResidual(x, p) !== dtdx(x, p)) sameNumber = false;
    }
    ck('1 · stationary ⟺ Snell: |snellResidual(x*)| & |dt/dx(x*)| < 1e-9, one number',
       maxRes < TOL && maxSlope < TOL && sameNumber,
       'res=' + maxRes.toExponential(2) + ' slope=' + maxSlope.toExponential(2) + ' identical=' + sameNumber);
  }

  // (2) MINIMIZER = ROOT: Newton's x* and the bisection ROOT agree to <1e-9 across all sets
  // (the precision cross-check that REPLACES a value scan, which would stall at ~1e-7).
  {
    let maxGap = 0;
    for (const p of paramSets){
      const a = minimizeTime(p).x, b = minimizeBrute(p).x;
      maxGap = Math.max(maxGap, Math.abs(a - b));
    }
    ck('2 · minimizer = root: |Newton x* − bisection root| < 1e-9 (not a value scan)',
       maxGap < TOL, 'maxGap=' + maxGap.toExponential(2));
  }

  // (3) TRUE MINIMUM: d2tdx2(x*) > 0 AND t(x*) is strictly below t at x*±h for h up to 1.0
  // (a real minimum, not merely stationary — the law is "LEAST", not "stationary").
  {
    let convex = true, isMin = true;
    for (const p of paramSets){
      const x = minimizeTime(p).x, t0 = travelTime(x, p);
      if (!(d2tdx2(x, p) > 0)) convex = false;
      for (const h of [1e-3, 0.1, 1.0]){
        if (!(travelTime(x + h, p) > t0 && travelTime(x - h, p) > t0)) isMin = false;
      }
    }
    ck('3 · true minimum: t″(x*) > 0 and t(x*) < t(x*±h) for h∈{1e-3,0.1,1.0}',
       convex && isMin, 'convex=' + convex + ' isMin=' + isMin);
  }

  // (4) SNELL RATIO: at x*, sinθ1/sinθ2 equals v1/v2 to <1e-9 (the law, stated as a ratio).
  {
    let maxErr = 0;
    for (const p of paramSets){
      const x = minimizeTime(p).x, a = angles(x, p);
      maxErr = Math.max(maxErr, Math.abs(a.sin1 / a.sin2 - p.v1 / p.v2));
    }
    ck('4 · Snell ratio: |sinθ1/sinθ2 − v1/v2| < 1e-9 at x*',
       maxErr < TOL, 'maxErr=' + maxErr.toExponential(2));
  }

  // (5) NEG-1 (v1 === v2 ⇒ straight): with equal speeds the least-time path IS the geometric
  // straight line (x* === xChord) and the angles are equal — no bend. Tested on a
  // NON-symmetric chord too, so it isn't passing by accident of symmetry.
  {
    const same = [
      { src: [-4, 3], tgt: [5, -4], boundaryY: 0, v1: 1.5, v2: 1.5 },
      { src: [-7, 5], tgt: [2, -3], boundaryY: 1, v1: 2.2, v2: 2.2 },  // non-symmetric
    ];
    let straight = true, equalAngles = true;
    for (const p of same){
      const x = minimizeTime(p).x;
      if (Math.abs(x - xChord(p)) > TOL) straight = false;
      const a = angles(x, p);
      if (Math.abs(a.theta1 - a.theta2) > TOL) equalAngles = false;
    }
    ck('5 · neg-1 (v1===v2 ⇒ straight): x* === xChord and θ1 === θ2 (non-symmetric too)',
       straight && equalAngles, 'straight=' + straight + ' equalAngles=' + equalAngles);
  }

  // (6) NEG-2 (maximize ⇒ edge): asking for the LONGEST time returns a chord-extent
  // endpoint (the absurd edge-crawl), with t strictly GREATER than the true minimum.
  {
    let edge = true, worse = true;
    for (const p of paramSets){
      const tMin = minimizeTime(p).tMin;
      const mp = Object.assign({}, p, { maximize: true });
      const r = minimizeTime(mp);
      const span = chordSpan(p);
      if (!(r.edge === true && (Math.abs(r.x - span.loX) < 1e-9 || Math.abs(r.x - span.hiX) < 1e-9))) edge = false;
      if (!(r.tMin > tMin + 1e-9)) worse = false;
    }
    ck('6 · neg-2 (maximize ⇒ edge): returns a chord-extent endpoint with t > t(x*)',
       edge && worse, 'edge=' + edge + ' worse=' + worse);
  }

  // (7) DOMAIN GUARDS: degenerate boundary (a1 or a2 → 0), vertical chord (tx===sx), v ≤ 0.
  // The numbers the PAGE paints — x* and t(x*) — stay FINITE in every degenerate geometry
  // (no NaN/Inf reaches the canvas). The slope/curvature formulas are genuinely UNDEFINED
  // exactly where a leg has zero length (θ2 has no meaning when the target lies on the
  // shore), so we assert them finite a hair OFF the degenerate point, where geometry exists.
  {
    const odd = [
      { src: [-4, 3], tgt: [5, 0], boundaryY: 0, v1: 2.0, v2: 1.0 },   // a2 → 0 (target on shore)
      { src: [-4, 0], tgt: [5, -4], boundaryY: 0, v1: 2.0, v2: 1.0 },  // a1 → 0 (source on shore)
      { src: [2, 3], tgt: [2, -4], boundaryY: 0, v1: 2.0, v2: 1.0 },   // vertical chord tx===sx
    ];
    let drawn = true, nearby = true;
    for (const p of odd){
      const x = minimizeTime(p).x, t = travelTime(x, p);
      if (!Number.isFinite(x) || !Number.isFinite(t)) drawn = false;          // what the page draws
      const xo = x + 0.25;                                                     // a hair off the degenerate
      if (![travelTime(xo, p), snellResidual(xo, p), d2tdx2(xo, p)].every(Number.isFinite)) nearby = false;
    }
    // v ≤ 0 must not silently produce a finite "answer" — travelTime should be ±Inf/NaN, i.e. NOT finite.
    const bad = { src: [-4, 3], tgt: [5, -4], boundaryY: 0, v1: 0, v2: 1.0 };
    const vGuard = !Number.isFinite(travelTime(0, bad));
    ck('7 · domain guards: x* & t(x*) finite at degeneracies; finite a hair off; v≤0 not finite',
       drawn && nearby && vGuard, 'drawn=' + drawn + ' nearby=' + nearby + ' vGuard=' + vGuard);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END LIFEGUARDS-RUN CORE =====

export {
  travelTime, dtdx, d2tdx2, snellResidual, angles,
  minimizeTime, minimizeBrute, scanTime, witness, runSelfTest,
};
