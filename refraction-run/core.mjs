// ============================================================================
//  THE PHOTON'S ERRAND — the estate's ONE Fermat / Snell / eikonal core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every least-time / refraction / eikonal number
//  the room shows. The page inlines the slab between the REFRACTION-RUN CORE
//  BEGIN / END sentinels byte-for-byte; core.test.mjs proves the inlined copy is
//  identical (indentation-normalised) to this file, so page, pill, and Node twin
//  can never silently drift.
//
//  THE ONE IDEA — FERMAT'S PRINCIPLE, MADE A GAME. A photon crosses a stack of
//  horizontal strata, each of constant index nᵢ. It leaves an emitter at the top
//  and must arrive at a focus at the bottom. It is FREE to cross each interface at
//  any horizontal position xₖ. Of all the broken-line paths that reach the focus,
//  light takes the one of LEAST OPTICAL PATH LENGTH
//        L(X) = Σ nᵢ · ‖segᵢ‖     (the running ∫ n·ds, the gauge reading).
//  The minimiser is NOT searched-for in a sloppy way: L is a CONVEX function of the
//  free crossings X = (x₁,…,x_K) — a positively-weighted sum of Euclidean norms —
//  so it has exactly one stationary point and it is the global minimum. At that
//  minimum, ∂L/∂xₖ = 0 at EVERY interface, and that single condition, written out,
//  IS Snell's law:  nₖ·sinθₖ = nₖ₊₁·sinθₖ₊₁  (angles from the vertical normal).
//  "The gauge stopped bleeding" and "Snell holds at every interface" are provably
//  ONE statement — this file asserts them equal, twice (analytic gradient and a
//  central-difference numeric gradient agree to <1e-9).
//
//  THE GRADED BLOCK → THE EIKONAL. Stack many thin sub-strata whose index rises
//  smoothly with depth and the least-time path stops being a few straight kinks and
//  becomes a smooth CURVE — the eikonal ray. Along it the Bouguer invariant
//  n(y)·sinθ(y) is CONSTANT. We ship the graded block as a FINITE stack of M thin
//  layers and assert the invariant to machine-ε ON THE SHIPPED M — we do NOT claim
//  a continuum limit the shipped resolution cannot hit. The visible curve is the
//  polyline through those M crossings; a flat-slab stack alone can never show it.
//
//  THE SOLVER (load-bearing). Naive multivariate Newton goes NaN for many
//  interfaces (a step can overshoot a segment to near-zero length, blowing up the
//  Hessian). We DO NOT use it. Instead: SAFEGUARDED COORDINATE DESCENT. Each xₖ's
//  1-D sub-problem is itself strictly convex (∂L/∂xₖ is monotone increasing in xₖ),
//  so we solve it with a bracket-guarded Newton that falls back to bisection the
//  instant a step leaves the bracket or fails to decrease |slope|. Sweeping the
//  coordinates to a fixed point converges to |∇L| < 1e-13 even at M=16.
//
//  NEG-CONTROLS, both proven in the twin:
//   1. All nᵢ equal ⇒ the minimiser is the STRAIGHT segment (every crossing
//      collinear, zero kink, ∇L=0) — the n≡1 dial detent, the trivial-optics floor.
//   2. A focus-REACHING non-Fermat path has STRICTLY larger L AND nonzero ∇L — so
//      WIN isolates LEAST-TIME-through-varying-n, not the mere fact of arrival.
//  And a DECIDABLE WIN INVARIANT: over a grid of candidate flown paths the WIN
//  predicate (arrived ∧ L≈L* ∧ Snell-everywhere) fires on the Fermat path and on
//  NO other.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): refraction-run/index.html
//  inlines the block between the REFRACTION-RUN CORE sentinels byte-for-byte; the
//  twin byte-parity-checks the inlined copy so it can never drift. AND the page's
//  camera reuses vantage/core.mjs projectNorm UNFORKED — the twin asserts a
//  pre-composed world-translation then projectNorm equals projectNorm of the
//  translated point, and greps vantage's own sentinel block, so the proven optic
//  can never silently fork.
// ============================================================================

// === REFRACTION-RUN CORE BEGIN ===
"use strict";

// ── A STACK is the scene's optical geometry. The probe travels top → bottom.
//   src      : [x, y]   emitter, ABOVE the first interface (smaller y = higher up)
//   tgt      : [x, y]   focus, BELOW the last interface
//   ys       : [y₁ … y_K]  the K interface depths, strictly increasing (top→bottom)
//   n        : [n₀ … n_K]  the K+1 layer indices; n[i] is the layer BELOW interface
//                          i−1 and ABOVE interface i (n[0] is the topmost layer that
//                          src sits in; n[K] is the bottom layer that tgt sits in).
// The free variables are the K crossing x-positions X = [x₁ … x_K].
// (src and tgt x/y are fixed; only where the ray crosses each interface is free.)

// stratumIndex(p) → array of segment indices the path travels through, length K+1.
// Layer i is traversed between crossing point i−1 and crossing point i, where
// crossing 0 is src and crossing K+1 is tgt. We expose it for readability.

// the K+1 points of a broken-line path given the K free crossings X:
//   [ src, (x₁,y₁), (x₂,y₂), …, (x_K,y_K), tgt ]
function pathPoints(p, X){
  const pts = [p.src.slice()];
  for (let k = 0; k < p.ys.length; k++) pts.push([X[k], p.ys[k]]);
  pts.push(p.tgt.slice());
  return pts;
}

// opticalLength(p, X): L = Σ nᵢ·‖segᵢ‖, the running ∫ n·ds (the gauge reading).
// Segment i (0-based) runs from point i to point i+1 inside layer of index n[i].
function opticalLength(p, X){
  const pts = pathPoints(p, X);
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++){
    const a = pts[i], b = pts[i + 1];
    L += p.n[i] * Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return L;
}

// gradL(p, X): ANALYTIC ∇L over the free crossings. Only the two segments touching
// crossing k depend on xₖ:
//   ∂L/∂xₖ = nₖ·(xₖ − x_{k-1})/d_{in}  +  n_{k+1}·(xₖ − x_{k+1})/d_{out}
// where d_in is the segment arriving at crossing k (index n[k]) and d_out the one
// leaving it (index n[k+1]). The first term is nₖ·sinθ_in, the second −n_{k+1}·sinθ_out
// (with sign), so ∂L/∂xₖ = nₖ·sinθ_in − n_{k+1}·sinθ_out → 0 IS Snell at interface k.
function gradL(p, X){
  const pts = pathPoints(p, X);          // pts[0]=src, pts[k+1]=crossing k, last=tgt
  const K = p.ys.length;
  const g = new Array(K);
  for (let k = 0; k < K; k++){
    const prev = pts[k];                  // point before crossing k (src or crossing k-1)
    const here = pts[k + 1];              // crossing k = [xₖ, yₖ]
    const next = pts[k + 2];              // point after crossing k (crossing k+1 or tgt)
    const dIn  = Math.hypot(here[0] - prev[0], here[1] - prev[1]);
    const dOut = Math.hypot(next[0] - here[0], next[1] - here[1]);
    const nIn  = p.n[k];                  // index of the incoming segment (layer above k)
    const nOut = p.n[k + 1];              // index of the outgoing segment (layer below k)
    g[k] = nIn * (here[0] - prev[0]) / dIn + nOut * (here[0] - next[0]) / dOut;
  }
  return g;
}

// numGradL(p, X, h): central-difference numeric gradient (independent witness).
function numGradL(p, X, h){
  h = h || 1e-6;
  const K = X.length, g = new Array(K);
  for (let k = 0; k < K; k++){
    const Xp = X.slice(); Xp[k] += h;
    const Xm = X.slice(); Xm[k] -= h;
    g[k] = (opticalLength(p, Xp) - opticalLength(p, Xm)) / (2 * h);
  }
  return g;
}

// snellResiduals(p, X): per-interface |nₖ·sinθ_in − n_{k+1}·sinθ_out|. This is the
// SAME quantity as |∂L/∂xₖ| (gauge-slope == Snell-defect, asserted equal in the
// twin) but named for the physics readout the protractors show.
function snellResiduals(p, X){
  return gradL(p, X).map(Math.abs);
}

// angles(p, X): per-interface { in, out, sinIn, sinOut } from the VERTICAL normal.
// sinθ = horizontal-run / segment-length. Used by the ghost diagram's protractors.
function angles(p, X){
  const pts = pathPoints(p, X);
  const K = p.ys.length, out = [];
  for (let k = 0; k < K; k++){
    const prev = pts[k], here = pts[k + 1], next = pts[k + 2];
    const dIn  = Math.hypot(here[0] - prev[0], here[1] - prev[1]);
    const dOut = Math.hypot(next[0] - here[0], next[1] - here[1]);
    const sinIn  = (here[0] - prev[0]) / dIn;     // signed: + = bending right going down
    const sinOut = (next[0] - here[0]) / dOut;
    out.push({ in: Math.asin(Math.max(-1, Math.min(1, sinIn))),
               out: Math.asin(Math.max(-1, Math.min(1, sinOut))),
               sinIn, sinOut });
  }
  return out;
}

// ── THE SOLVER: SAFEGUARDED COORDINATE DESCENT ──────────────────────────────
// Each coordinate's 1-D sub-problem minimises L over xₖ with all others fixed.
// dL/dxₖ is strictly increasing in xₖ (the 1-D restriction of a convex function),
// so its unique root is found by a bracket-guarded Newton: start from a bracket
// [lo,hi] known to straddle the root (slope(lo)<0<slope(hi)), try a Newton step,
// and REJECT it (fall back to the bisection midpoint) whenever it leaves the
// bracket or fails to shrink |slope|. This never goes NaN — that is the whole point.

// dSlope/dxₖ at fixed neighbours — the 1-D second derivative, strictly positive.
function coordSlopeAndCurv(p, X, k){
  const pts = pathPoints(p, X);
  const prev = pts[k], here = pts[k + 1], next = pts[k + 2];
  const dx1 = here[0] - prev[0], dy1 = here[1] - prev[1];
  const dx2 = here[0] - next[0], dy2 = here[1] - next[1];
  const d1 = Math.hypot(dx1, dy1), d2 = Math.hypot(dx2, dy2);
  const nIn = p.n[k], nOut = p.n[k + 1];
  const slope = nIn * dx1 / d1 + nOut * dx2 / d2;
  // d/dx of (n·(x−a)/hypot(x−a,Δy)) = n·Δy²/hypot³  (>0)
  const curv = nIn * (dy1 * dy1) / (d1 * d1 * d1) + nOut * (dy2 * dy2) / (d2 * d2 * d2);
  return { slope, curv };
}

function solveCoord(p, X, k){
  // bracket the root: x must lie between the two neighbour x's extended generously.
  const pts = pathPoints(p, X);
  const xPrev = pts[k][0], xNext = pts[k + 2][0];
  let lo = Math.min(xPrev, xNext) - 1e6;
  let hi = Math.max(xPrev, xNext) + 1e6;
  // the root of dL/dxₖ is between the neighbour x-coords (convexity); clamp bracket.
  // ensure slope(lo)<0<slope(hi)
  const Xl = X.slice(); Xl[k] = lo;
  const Xh = X.slice(); Xh[k] = hi;
  let sLo = coordSlopeAndCurv(p, Xl, k).slope;
  let sHi = coordSlopeAndCurv(p, Xh, k).slope;
  if (!(sLo < 0 && sHi > 0)) return X[k];        // degenerate (e.g. zero-length); keep
  let x = X[k];
  for (let it = 0; it < 100; it++){
    const Xt = X.slice(); Xt[k] = x;
    const { slope, curv } = coordSlopeAndCurv(p, Xt, k);
    if (Math.abs(slope) < 1e-15) break;
    if (slope > 0) hi = x; else lo = x;
    // Newton step, guarded into the bracket
    let xN = x - slope / curv;
    if (!(xN > lo && xN < hi) || !isFinite(xN)) xN = 0.5 * (lo + hi);   // bisection fallback
    if (Math.abs(xN - x) < 1e-15) { x = xN; break; }
    x = xN;
  }
  return x;
}

// solveFermat(p, opts): coordinate-descent to the least-time crossings X*.
// Returns { X, L, grad, sweeps }. Deterministic: starts from the straight-line
// crossings (a pure function of the scene) and sweeps to a fixed point.
function straightLineCrossings(p){
  // where the straight src→tgt segment cuts each interface depth yₖ
  const [sx, sy] = p.src, [tx, ty] = p.tgt;
  return p.ys.map(y => sx + (tx - sx) * (y - sy) / (ty - sy));
}

// hessianTri(p, X): the TRIDIAGONAL Hessian of L. L couples xₖ only to its two
// neighbours (the shared segments), so ∂²L/∂xₖ² (diag) and ∂²L/∂xₖ∂xₖ₊₁ (off-diag)
// are all that survive. Returns { d:[diag], e:[super=sub] }. Each diagonal entry is
// strictly positive (convexity), so the system is SPD and the Thomas solve is stable.
function hessianTri(p, X){
  const pts = pathPoints(p, X);
  const K = p.ys.length;
  const d = new Array(K), e = new Array(Math.max(0, K - 1));
  for (let k = 0; k < K; k++){
    const prev = pts[k], here = pts[k + 1], next = pts[k + 2];
    const dx1 = here[0]-prev[0], dy1 = here[1]-prev[1];
    const dx2 = here[0]-next[0], dy2 = here[1]-next[1];
    const d1 = Math.hypot(dx1, dy1), d2 = Math.hypot(dx2, dy2);
    const nIn = p.n[k], nOut = p.n[k + 1];
    // ∂²L/∂xₖ² = nIn·dy1²/d1³ + nOut·dy2²/d2³  (>0)
    d[k] = nIn * (dy1*dy1)/(d1*d1*d1) + nOut * (dy2*dy2)/(d2*d2*d2);
  }
  for (let k = 0; k < K - 1; k++){
    // ∂²L/∂xₖ∂xₖ₊₁ : only the SHARED segment (layer k+1, between crossings k & k+1)
    const a = pts[k + 1], b = pts[k + 2];        // crossing k and crossing k+1
    const dx = a[0]-b[0], dy = a[1]-b[1];
    const dd = Math.hypot(dx, dy);
    const nMid = p.n[k + 1];
    e[k] = -nMid * (dy*dy)/(dd*dd*dd);           // cross term, negative
  }
  return { d, e };
}

// thomasSolve(d, e, b): solve the symmetric tridiagonal SPD system (diag d,
// off-diag e) for x where (Tridiag)·x = b. Stable forward/back sweep; never NaN
// for an SPD system. Returns x.
function thomasSolve(d, e, b){
  const n = d.length;
  if (n === 0) return [];
  const cp = new Array(n), dp = new Array(n);
  cp[0] = (n > 1 ? e[0] : 0) / d[0];
  dp[0] = b[0] / d[0];
  for (let i = 1; i < n; i++){
    const m = d[i] - e[i - 1] * cp[i - 1];
    cp[i] = (i < n - 1 ? e[i] : 0) / m;
    dp[i] = (b[i] - e[i - 1] * dp[i - 1]) / m;
  }
  const x = new Array(n);
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

function solveFermat(p, opts){
  opts = opts || {};
  const tol = opts.tol != null ? opts.tol : 1e-12;
  const maxSweeps = opts.maxSweeps || 200;
  let X = (opts.X0 ? opts.X0.slice() : straightLineCrossings(p));
  const K = X.length;
  let sweeps = 0;
  // PHASE 1 — safeguarded coordinate descent gets us into the quadratic basin
  // robustly (no NaN even from a bad start; each 1-D sub-problem is convex).
  for (; sweeps < maxSweeps; sweeps++){
    for (let k = 0; k < K; k++) X[k] = solveCoord(p, X, k);
    const g = gradL(p, X);
    let gmax = 0; for (const v of g) gmax = Math.max(gmax, Math.abs(v));
    if (gmax < tol) return { X, L: opticalLength(p, X), grad: g, sweeps: sweeps + 1 };
    if (gmax < 1e-3) break;            // close enough — hand off to Newton polish
  }
  // PHASE 2 — damped tridiagonal Newton polish to machine-ε. The Hessian is SPD
  // tridiagonal; the step is line-searched (halved while it fails to shrink |∇L|)
  // so it can NEVER overshoot into a near-zero segment and go NaN (naive Newton's
  // failure mode). Quadratic convergence drives |∇L| to ~1e-14.
  for (let it = 0; it < 60; it++){
    const g = gradL(p, X);
    let gmax = 0; for (const v of g) gmax = Math.max(gmax, Math.abs(v));
    if (gmax < tol) break;
    const H = hessianTri(p, X);
    const step = thomasSolve(H.d, H.e, g);        // solve H·step = ∇L  → x -= step
    if (!step.every(isFinite)) break;
    // line search: take the largest damping α∈{1,½,¼,…} that reduces |∇L|
    let alpha = 1, improved = false;
    for (let ls = 0; ls < 30; ls++){
      const Xt = X.map((x, k) => x - alpha * step[k]);
      const gt = gradL(p, Xt);
      let gtmax = 0; for (const v of gt) gtmax = Math.max(gtmax, Math.abs(v));
      if (gtmax < gmax){ X = Xt; improved = true; break; }
      alpha *= 0.5;
    }
    if (!improved) break;             // already at the floor of representable precision
    sweeps++;
  }
  return { X, L: opticalLength(p, X), grad: gradL(p, X), sweeps };
}

// ── THE GRADED BLOCK as a finite stack of M thin sub-strata. n(y) rises smoothly
// from nTop to nBot across [yTop, yBot]; we sample M+1 interface depths inside the
// block and the per-layer index at each sub-layer's MIDPOINT. The eikonal invariant
// n(y)·sinθ is then asserted constant across the block's crossings (machine-ε at M).
function gradedProfile(yTop, yBot, nTop, nBot){
  // a smooth monotone profile n(y); any monotone curve works — use a gentle quad.
  return function(y){
    const t = (y - yTop) / (yBot - yTop);          // 0..1 across the block
    return nTop + (nBot - nTop) * (t * t * 0.5 + t * 0.5);   // monotone, n'(0)=0.5·Δ
  };
}

// bouguerInvariant(p, X, layerStart, layerCount): n(layer)·sinθ along the graded
// crossings — should be constant. layerStart is the first layer index that is part
// of the graded block; layerCount how many. Returns the array of n·sinθ values.
function bouguerInvariant(p, X){
  // n·sinθ for the OUTGOING segment of every layer; for a least-time path this is
  // the Bouguer constant across all layers (the discrete eikonal first integral).
  const pts = pathPoints(p, X);
  const vals = [];
  for (let i = 0; i < pts.length - 1; i++){
    const a = pts[i], b = pts[i + 1];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sin = (b[0] - a[0]) / d;                 // angle from vertical normal
    vals.push(p.n[i] * sin);
  }
  return vals;
}

// ── WIN PREDICATE — decidable. A flown path (its K crossings Xf, plus whether it
// arrived at the focus within arriveTol) WINS iff it arrived AND its L matches L*
// within Lstar·relTol AND every interface satisfies Snell within snellTol. Pure,
// so the twin can run it over a grid and assert it fires on the Fermat path alone.
function winPredicate(p, Xf, arrived, ref, tol){
  tol = tol || {};
  const relTol   = tol.relTol   != null ? tol.relTol   : 1e-6;
  const snellTol = tol.snellTol != null ? tol.snellTol : 1e-6;
  if (!arrived) return false;
  const L = opticalLength(p, Xf);
  if (Math.abs(L - ref.Lstar) > ref.Lstar * relTol) return false;
  const res = snellResiduals(p, Xf);
  for (const r of res) if (r > snellTol) return false;
  return true;
}

// ── SCENE BUILDER — the rounds. A round is a pure function of its config, so the
// scene is reproducible. Indices: air 1.00, water 1.33, flint 1.62; the graded
// block is appended as M thin sub-layers for R3+.
function buildRound(round){
  // geometry in tank units: y grows downward, x spans the tank width.
  const sx = -2.4, sy = -3.4;          // emitter, top-left of the tank
  const tx = 2.8;                      // focus x (right side)
  if (round === 1){
    // R1: air → water, ONE interface.
    const ys = [-1.0];
    const n  = [1.00, 1.33];
    const ty = 2.2;
    return finalize({ src:[sx,sy], tgt:[tx,ty], ys, n }, { round, graded:null });
  }
  if (round === 2){
    // R2: air → water → flint, TWO interfaces (doglegs twice).
    const ys = [-1.2, 0.4];
    const n  = [1.00, 1.33, 1.62];
    const ty = 2.6;
    return finalize({ src:[sx,sy], tgt:[tx,ty], ys, n }, { round, graded:null });
  }
  // R3 (and R4 = R3 + a decoy focus): air → water → flint → GRADED block to the floor.
  const M = 8;                          // graded sub-layers
  const yBlockTop = 0.8, yBlockBot = 3.2;
  const nBlockTop = 1.62, nBlockBot = 2.10;
  const prof = gradedProfile(yBlockTop, yBlockBot, nBlockTop, nBlockBot);
  const ys = [-1.2, 0.2];               // air→water, water→flint
  const n  = [1.00, 1.33, 1.62];        // air, water, flint (down to yBlockTop)
  // append M graded sub-layers spanning [yBlockTop, yBlockBot]. Each sub-layer m
  // occupies the band between its top and bottom interface; we push its BOTTOM
  // interface depth and the index sampled at the sub-layer's MIDPOINT (a representative
  // constant index for that thin band — the discrete eikonal stack).
  for (let m = 1; m <= M; m++){
    const y = yBlockTop + (yBlockBot - yBlockTop) * m / M;          // sub-layer m's bottom interface
    ys.push(y);
    const yMid = yBlockTop + (yBlockBot - yBlockTop) * (m - 0.5) / M;
    n.push(prof(yMid));                 // constant index of sub-layer m (its midpoint sample)
  }
  // n is now [air, water, flint, g1, g2, …, gM] (length K+1): n[i] is the index of the
  // layer ABOVE interface i / BELOW interface i−1; the LAST element gM is the bottom
  // layer the focus sits in. The graded crossings polyline IS the visible eikonal curve.
  const ty = 3.6;                       // focus below the graded block
  const decoy = (round >= 4) ? { x: -1.6, y: ty } : null;   // R4 tempts the wrong side
  return finalize({ src:[sx,sy], tgt:[tx,ty], ys, n },
                  { round, graded:{ top:yBlockTop, bot:yBlockBot, M, prof }, decoy });
}

// finalize: solve the round's Fermat path + reference numbers ONCE, attach them.
function finalize(p, meta){
  const sol = solveFermat(p);
  return Object.assign({}, p, meta, {
    Xstar: sol.X, Lstar: sol.L, gradMax: sol.grad.reduce((a,v)=>Math.max(a,Math.abs(v)),0),
    Lstraight: opticalLength(p, straightLineCrossings(p)),
  });
}

// straightShotLength(p): L of the literal straight src→tgt line (ignores interfaces).
// At n≡1 this EQUALS Lstar (the dial detent). Used by the n→1 punchline.
function straightShotLength(p){
  return Math.hypot(p.tgt[0] - p.src[0], p.tgt[1] - p.src[1]) *
         (p.n.reduce((a,b)=>a+b,0) / p.n.length);   // mean index along the straight line
}

// withIndices(p, nNew): a copy of the scene with a new index array (the n→1 dial
// sweeps every nᵢ toward 1, blending by t∈[0,1]).
function dialIndices(p, t){
  // t=0 → original indices; t=1 → all indices = 1 (trivial optics).
  return p.n.map(ni => ni + (1 - ni) * t);
}

// ── THE SELF-TEST: prove every claim numerically, separate tolerances ──────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-9;

  const rounds = [1, 2, 3, 4].map(buildRound);

  // (a) SNELL + STATIONARITY on EVERY shipped round: at X*, |∂L/∂xₖ| < 1e-9 (Snell),
  // analytic ∇L < 1e-9, AND the central-difference numeric gradient agrees < 1e-9.
  {
    let worstSnell = 0, worstGrad = 0, worstNum = 0, conv = true;
    for (const p of rounds){
      const res = snellResiduals(p, p.Xstar);
      const ga  = gradL(p, p.Xstar);
      const gn  = numGradL(p, p.Xstar, 1e-6);
      for (let k = 0; k < p.Xstar.length; k++){
        worstSnell = Math.max(worstSnell, res[k]);
        worstGrad  = Math.max(worstGrad, Math.abs(ga[k]));
        worstNum   = Math.max(worstNum, Math.abs(ga[k] - gn[k]));
      }
      if (!(p.gradMax < EPS)) conv = false;
    }
    ck('a · Snell at every interface + ∇L stationary + numeric agrees (<1e-9), all 4 rounds',
       worstSnell < EPS && worstGrad < EPS && worstNum < EPS && conv,
       'snell ' + worstSnell.toExponential(2) + ' · |∇L| ' + worstGrad.toExponential(2)
       + ' · |analytic−numeric| ' + worstNum.toExponential(2));
  }

  // (b) GRADED BLOCK → EIKONAL (finite-M): the Bouguer invariant n·sinθ is constant
  // across the graded crossings on the SHIPPED M (machine-ε), and the curve is not
  // straight (a genuine bend a flat stack can't show).
  {
    const p = rounds[2];                          // R3 has the graded block
    const inv = bouguerInvariant(p, p.Xstar);
    // the graded sub-layers are the LAST p.graded.M layers' OUTGOING segments
    const start = p.n.length - p.graded.M;        // first graded layer index
    let mn = Infinity, mx = -Infinity;
    for (let i = start; i < inv.length; i++){ mn = Math.min(mn, inv[i]); mx = Math.max(mx, inv[i]); }
    const spread = mx - mn;
    // also: it must actually CURVE — adjacent graded crossings change x-slope
    const pts = pathPoints(p, p.Xstar);
    let slopeChange = 0, prevSlope = null;
    for (let i = start; i < pts.length - 1; i++){
      const a = pts[i], b = pts[i + 1];
      const s = (b[0] - a[0]) / (b[1] - a[1]);    // dx/dy
      if (prevSlope != null) slopeChange += Math.abs(s - prevSlope);
      prevSlope = s;
    }
    ck('b · graded block: Bouguer n·sinθ constant across M=' + p.graded.M
       + ' crossings (<1e-9) AND the ray genuinely curves',
       spread < EPS && slopeChange > 1e-3,
       'n·sinθ spread ' + spread.toExponential(2) + ' · total |Δslope| ' + slopeChange.toFixed(4));
  }

  // (NEG-CONTROL 1) all nᵢ equal ⇒ the minimiser is the STRAIGHT segment: every
  // crossing collinear with src→tgt, zero kink, ∇L=0. Tested on R3's geometry.
  {
    const base = rounds[2];
    const flat = Object.assign({}, base, { n: base.n.map(() => 1.0) });
    const sol = solveFermat(flat);
    const straight = straightLineCrossings(flat);
    let maxDev = 0;
    for (let k = 0; k < sol.X.length; k++) maxDev = Math.max(maxDev, Math.abs(sol.X[k] - straight[k]));
    const gmax = sol.grad.reduce((a,v)=>Math.max(a,Math.abs(v)), 0);
    // collinearity: every crossing lies on the straight line (dev≈0)
    ck('NEG1 · all nᵢ=1 ⇒ minimiser is the straight segment (crossings collinear, ∇L=0)',
       maxDev < 1e-9 && gmax < 1e-9,
       'max |x*−straight| ' + maxDev.toExponential(2) + ' · |∇L| ' + gmax.toExponential(2));
  }

  // (NEG-CONTROL 2) a focus-REACHING non-Fermat path has STRICTLY larger L AND a
  // nonzero gradient — arrival alone is not least-time. Sample a family of arriving
  // paths (perturbations of X*) and confirm each is strictly worse with nonzero ∇L.
  {
    const p = rounds[1];                          // R2, two interfaces
    let allWorse = true, allBent = true, minExcess = Infinity, minGrad = Infinity;
    for (const eps of [0.3, -0.4, 0.7, -0.25, 0.5]){
      const Xf = p.Xstar.map((x, k) => x + eps * (k % 2 === 0 ? 1 : -1));   // arrives (tgt fixed)
      const L = opticalLength(p, Xf);
      const g = gradL(p, Xf);
      const gmax = g.reduce((a,v)=>Math.max(a,Math.abs(v)), 0);
      const excess = L - p.Lstar;
      if (!(excess > 1e-6)) allWorse = false;
      if (!(gmax > 1e-6)) allBent = false;
      minExcess = Math.min(minExcess, excess);
      minGrad = Math.min(minGrad, gmax);
    }
    ck('NEG2 · arrival ≠ least-time: focus-reaching non-Fermat paths have larger L AND ∇L≠0',
       allWorse && allBent,
       'min ΔL ' + minExcess.toExponential(2) + ' · min |∇L| ' + minGrad.toExponential(2));
  }

  // (c) DECIDABLE WIN INVARIANT: over a grid of candidate flown paths the WIN
  // predicate fires EXACTLY on the Fermat path and on no other.
  {
    const p = rounds[1];
    const ref = { Lstar: p.Lstar };
    let firedOnStar = winPredicate(p, p.Xstar, true, ref);
    let firedElsewhere = 0, tested = 0;
    // grid of perturbed arriving paths
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++){
      if (a === 0 && b === 0) continue;
      const Xf = [p.Xstar[0] + a * 0.15, p.Xstar[1] + b * 0.15];
      tested++;
      if (winPredicate(p, Xf, true, ref)) firedElsewhere++;
    }
    // also: a path that does NOT arrive never wins, even if shaped like X*
    const notArrived = winPredicate(p, p.Xstar, false, ref);
    ck('c · decidable WIN: predicate fires on the Fermat path ONLY (grid of ' + tested
       + ' others all reject; non-arrival rejects)',
       firedOnStar && firedElsewhere === 0 && !notArrived,
       'star=' + firedOnStar + ' others-fired=' + firedElsewhere + ' nonArrive=' + notArrived);
  }

  // (d) DETERMINISM — buildRound is a pure function (same round ⇒ same X*).
  {
    const a = buildRound(3), b = buildRound(3);
    let same = a.Xstar.length === b.Xstar.length;
    for (let k = 0; k < a.Xstar.length; k++) if (a.Xstar[k] !== b.Xstar[k]) same = false;
    ck('d · determinism: buildRound(r) reproduces the exact same scene + X*',
       same && a.Lstar === b.Lstar, 'Lstar=' + a.Lstar.toFixed(6));
  }

  // (e) SOLVER ROBUSTNESS — convergence on a stress stack of M=16 interfaces with
  // wild indices: the safeguarded descent reaches |∇L|<1e-9 (naive Newton goes NaN).
  {
    const ys = [], n = [1.0];
    for (let i = 1; i <= 16; i++){ ys.push(-2 + i * 0.3); n.push(1.0 + Math.sin(i) * 0.4 + 0.8); }
    const p = { src:[-3, -2.5], tgt:[3, 3.5], ys, n };
    const sol = solveFermat(p, { tol: 1e-13 });
    const gmax = sol.grad.reduce((a,v)=>Math.max(a,Math.abs(v)), 0);
    const finite = sol.X.every(isFinite);
    ck('e · solver robust: safeguarded descent on M=16 wild stack reaches |∇L|<1e-9 (no NaN)',
       finite && gmax < 1e-9, 'M=16 |∇L| ' + gmax.toExponential(2) + ' sweeps=' + sol.sweeps);
  }

  // (f) n→1 DIAL PUNCHLINE: as t→1 all indices → 1 and the optimal path → the
  // straight segment (the optimum L → straight-line geometric length).
  {
    const p = rounds[2];
    const flat = Object.assign({}, p, { n: dialIndices(p, 1) });
    const sol = solveFermat(flat);
    const straightGeom = Math.hypot(p.tgt[0] - p.src[0], p.tgt[1] - p.src[1]);  // n=1 → L = length
    const err = Math.abs(sol.L - straightGeom);
    ck('f · n→1 dial: with every nᵢ=1 the least path L equals the straight-shot length (trivial optics)',
       err < 1e-9, '|L(n=1) − straight| ' + err.toExponential(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// === REFRACTION-RUN CORE END ===

export {
  pathPoints, opticalLength, gradL, numGradL, snellResiduals, angles,
  coordSlopeAndCurv, solveCoord, hessianTri, thomasSolve,
  straightLineCrossings, solveFermat,
  gradedProfile, bouguerInvariant, winPredicate, buildRound, finalize,
  straightShotLength, dialIndices, runSelfTest,
};
