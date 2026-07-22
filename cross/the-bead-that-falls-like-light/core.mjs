// ============================================================================
//  THE BEAD THAT FALLS LIKE LIGHT — a cross of The Brachistochrone (the curve of
//  fastest descent) × The Photon's Errand (Fermat / Snell / the eikonal ray).
//  Logic core (the SOLE math authority for the bench).
//
//  THE ONE IDEA. Drop a bead down a frictionless ramp from A to B. Its speed at
//  depth y is v(y)=√(2gy) (energy conservation). Of all ramps, the CYCLOID is the
//  fastest — the brachistochrone. Now shine a photon through a stack of glass whose
//  index rises so that n(y) ∝ 1/v(y) = 1/√(2gy). Of all paths, light takes the one
//  of least time — and it is the SAME cycloid. Two utterly different laws, one road:
//    • BEAD  — the Beltrami first integral of ∫√(1+y'²)/√(2gy) dx is  sinθ(y)/v(y) = const.
//    • LIGHT — Bouguer's invariant of a graded medium is                n(y)·sinθ(y) = const.
//  With n ∝ 1/v the two constants are the SAME statement, so the least-time bead path
//  and the least-time light ray are literally one curve. The gold bead (cycloid) and
//  the teal photon (a refraction ray solved by the OTHER core) land in a DEAD HEAT;
//  your hand-drawn amber ramp can only ever chase them — you fall like light, never
//  beat it.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for their
//  own physics; we import them byte-untouched (native ES modules, two ../ hops):
//    • brachistochrone — solveCycloid / cycloidTime / descentTimeFn / buildTimeTable /
//      posAtTime (the bead's certified cycloid solver + descent-time quadrature +
//      time→arclength animation table). Just lifted out of its page into core.mjs.
//    • refraction-run  — solveFermat / bouguerInvariant / gradedProfile (the photon's
//      certified least-optical-path solver + the discrete eikonal first integral).
//  This cross core is the SOLE authority for the BRIDGE — the graded index n∝1/√(2gy),
//  the shared sinθ/v invariant, and the drawn-ramp family — and it names NO integrator
//  of either parent, only their public solvers.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. INVARIANT — on the cycloid, sinθ(y)/v(y) is constant (relSpread < 1e-4), AND
//       refraction-run's OWN bouguerInvariant on the equivalent n∝1/√(2gy) graded round
//       is constant to machine-ε — the SAME law, proven in BOTH shipped cores.
//    2. SAME ROAD — the photon's least-time crossings lie on brachistochrone's cycloid
//       (perpendicular offset < 1e-2 tank units at the shipped M) AND the photon's
//       optical time ≈ the cycloid descent time.
//    3. NEG-CONTROL — on the straight ramp (or any non-cycloid ramp) var(sinθ/v) is
//       > 50× the cycloid's AND descentTimeFn(ramp) > cycloidTime STRICTLY. A vacuous
//       "always steady / always tie" checker must FAIL here.
//    4. PAYOFF-LIVENESS — in the animation clock the cycloid bead and the photon reach
//       x=xB within < 1 frame of each other (dead heat ENACTED) and both strictly
//       precede the straight ramp by a visible margin; AND the ACTUAL rendered photon
//       polyline, fed through the SAME invariant code that drives the live widget,
//       flips it to the green/steady state — the payoff fires on the real render.
//    5. BYTE-TWIN — index.html CORE === core.mjs CORE char-for-char; both parents are
//       imported at the same two ../ hops and drive the shipped numbers.
// ============================================================================

// the bead's authority — the brachistochrone core (just lifted out of its page):
import * as BRACH from '../../brachistochrone/core.mjs';
// the photon's authority — the estate's ONE Fermat / Snell / eikonal core:
import * as REFR from '../../refraction-run/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE FIXED STAGE — A=(0,0) top-left → B=(XB,YB) lower-right. YB/XB chosen so the
//    reference cycloid reaches B at θ=π (its flat bottom): the light path coasts
//    dead-level into the finish, and the speed-strata are brightest exactly at B. ══
const G = 9.81;                    // gravity (m/s²)
const XB = 2.2, YB = 1.4;          // finish post B in tank units (thB = π)
const YMIN = 1e-9;                 // cusp clamp: v→0 and n→∞ at y=0 (the shared singularity)
const PHOTON_M = 64;               // graded sub-layers for the photon stack
const PHOTON_MAXSWEEPS = 1000;     // coordinate-descent budget (near-cusp stacks are stiff)
const INV_SKIP_FRAC = 0.05;        // sample the sinθ/v invariant away from the touchy cusp skirt
const LATCH_REL = 0.02;            // "dead heat" latch: within 2% of Tstar (a hand-drawn
                                   //   y(x) ramp can never take the cycloid's vertical dive,
                                   //   so the last sliver is light's alone — that IS the lesson).
const INTERIOR_KNOTS = 6;          // draggable interior knots (endpoints A/B are pinned)
const KNOT_BIAS = 1.7;             // preset knots crowd toward the cusp (where curvature is high)

// v(y) = √(2gy): the bead's speed at depth y (energy conservation). Clamped at the cusp.
function speedAt(y, g = G){ return Math.sqrt(2 * g * Math.max(y, YMIN)); }

// n(y) = 1/v(y) = 1/√(2gy): the graded index whose least-time ray IS the brachistochrone.
// (Any n ∝ 1/v works — the constant cancels in Fermat; C=1 makes optical length = time.)
function indexAt(y, g = G){ return 1 / speedAt(y, g); }

// ── THE REFERENCE CYCLOID (the gold bead's road), from the brachistochrone core ──────
function refCycloid(xB = XB, yB = YB){ return BRACH.solveCycloid(xB, yB); }
function cycloidTstar(c, g = G){ return BRACH.cycloidTime(c.r, c.thB, g); }

// cycloid depth y at horizontal x (invert x=r(θ−sinθ) by bisection in θ∈[0,θB]).
function cycloidYatX(c, x){
  let lo = 1e-12, hi = c.thB;
  for (let i = 0; i < 80; i++){ const m = 0.5 * (lo + hi); if (c.r * (m - Math.sin(m)) < x) lo = m; else hi = m; }
  const th = 0.5 * (lo + hi); return c.r * (1 - Math.cos(th));
}
// cycloid horizontal x at depth y (invert 1−cosθ=y/r).
function cycloidXatY(c, y){ const th = Math.acos(Math.max(-1, Math.min(1, 1 - y / c.r))); return c.r * (th - Math.sin(th)); }

// the gold bead's full polyline A→B (physics coords, y down), N segments.
function cycloidPolyline(c, N){
  const p = [];
  for (let i = 0; i <= N; i++){ const th = c.thB * i / N; p.push({ x: c.r * (th - Math.sin(th)), y: c.r * (1 - Math.cos(th)) }); }
  return p;
}
// the cycloid arc between two depths (used to draw the photon's cusp slice analytically,
// where n→∞ makes the discrete Fermat stack ill-conditioned — the same integrable cusp).
function cycloidArc(c, y0, y1, N){
  const th0 = Math.acos(Math.max(-1, Math.min(1, 1 - y0 / c.r)));
  const th1 = Math.acos(Math.max(-1, Math.min(1, 1 - y1 / c.r)));
  const p = [];
  for (let i = 0; i <= N; i++){ const th = th0 + (th1 - th0) * i / N; p.push({ x: c.r * (th - Math.sin(th)), y: c.r * (1 - Math.cos(th)) }); }
  return p;
}

// ── THE PHOTON — a graded stack with n(y)∝1/√(2gy), solved by refraction-run ─────────
// buildPhotonScene: a refraction-run scene { src, tgt, ys, n }. The stack spans
// [yTop, YB] with M thin sub-layers; the index of each layer is sampled at its MIDPOINT
// depth (never at the cusp). yTop sits a hair below A so the near-cusp region (where
// n→∞) is drawn as the analytic cycloid continuation, not solved — refraction-run's own
// finite-M honesty. src sits ON the cycloid at yTop so the ray's endpoints match it.
function buildPhotonScene(c, xB = XB, yB = YB, g = G, M = PHOTON_M){
  const yTop = yB * (0.5 / M);                 // first interface's rough scale, below the cusp
  const ys = [];
  for (let k = 1; k <= M; k++) ys.push(yTop + (yB - yTop) * (k / M));   // uniform interfaces
  const depths = [yTop, ...ys, yB];
  const n = [];
  for (let i = 0; i < depths.length - 1; i++){ const ymid = 0.5 * (depths[i] + depths[i + 1]); n.push(indexAt(ymid, g)); }
  const srcX = cycloidXatY(c, yTop);
  return { src: [srcX, yTop], tgt: [xB, yB], ys, n, yTop };
}

// solvePhoton: least-optical-path crossings via refraction-run's solveFermat, then the
// rendered polyline = analytic cycloid arc A→yTop  +  the solved crossings  +  B.
function solvePhoton(c, xB = XB, yB = YB, g = G, M = PHOTON_M){
  const scene = buildPhotonScene(c, xB, yB, g, M);
  const sol = REFR.solveFermat({ src: scene.src, tgt: scene.tgt, ys: scene.ys, n: scene.n },
                               { tol: 1e-13, maxSweeps: PHOTON_MAXSWEEPS });
  const poly = cycloidArc(c, 0, scene.yTop, 48);      // the cusp slice, drawn as the true curve
  for (let k = 0; k < scene.ys.length; k++) poly.push({ x: sol.X[k], y: scene.ys[k] });
  poly.push({ x: xB, y: yB });
  const gradMax = sol.grad.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
  return { scene, sol, poly, X: sol.X, L: sol.L, gradMax };
}

// bouguer invariant n·sinθ across the photon's graded crossings (refraction-run's own fn).
function photonBouguer(scene, X){ return REFR.bouguerInvariant({ src: scene.src, tgt: scene.tgt, ys: scene.ys, n: scene.n }, X); }

// ── THE SHARED INVARIANT — sinθ(y)/v(y) along ANY polyline (the live widget's engine) ─
// Sampled at each segment's midpoint depth; segments whose midpoint is above the cusp
// skirt (ymid < skipY) are dropped (sinθ→0 and v→0 there make the 0/0 ratio touchy).
// Returns { vals, mean, var, relSpread, cov, n }. cov (coefficient of variation) drives
// the breathing green→amber→red chip: 0 = dead-flat like the cycloid, large = jittery.
function invariantAlong(pts, g = G, skipY){
  if (skipY == null) skipY = YB * INV_SKIP_FRAC;
  const vals = [];
  for (let i = 1; i < pts.length; i++){
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y, ds = Math.hypot(dx, dy);
    if (ds < 1e-12) continue;
    const ymid = 0.5 * (a.y + b.y);
    if (ymid < skipY) continue;
    const sin = Math.abs(dx) / ds;              // sinθ, θ from the vertical (dx per arc)
    vals.push(sin / speedAt(ymid, g));
  }
  if (!vals.length) return { vals: [], mean: 0, var: 0, relSpread: 0, cov: 0, n: 0 };
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  let vr = 0; for (const v of vals) vr += (v - mean) * (v - mean); vr /= vals.length;
  let mn = Infinity, mx = -Infinity; for (const v of vals){ if (v < mn) mn = v; if (v > mx) mx = v; }
  return { vals, mean, var: vr, relSpread: mean ? (mx - mn) / mean : 0, cov: mean ? Math.sqrt(vr) / mean : 0, n: vals.length };
}

// exact-tangent sinθ/v on the cycloid (parametric, machine-ε constant). Independent
// witness that the invariant really is constant on the true curve (not just the polyline).
function cycloidInvariantExact(c, g = G, N){
  N = N || 400; const vals = [];
  for (let i = 1; i < N; i++){                   // skip i=0 (cusp) and i=N
    const th = c.thB * i / N;
    const dx = c.r * (1 - Math.cos(th)), dy = c.r * Math.sin(th);   // dx/dθ, dy/dθ
    const ds = Math.hypot(dx, dy);
    const sin = dx / ds;                          // sinθ from vertical
    const y = c.r * (1 - Math.cos(th));
    vals.push(sin / speedAt(y, g));
  }
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  let mn = Infinity, mx = -Infinity; for (const v of vals){ if (v < mn) mn = v; if (v > mx) mx = v; }
  return { mean, relSpread: (mx - mn) / mean };
}

// the widget's colour state from a coefficient of variation (0 = dead-flat gold cycloid).
// Calibrated so a well-traced hand ramp (cov ~0.02–0.06) earns green, a partly-tuned ramp
// sits amber, and the straight ramp (cov ~0.4) stays red — a real, discriminating gradient.
function invariantState(cov){
  if (cov < 0.08) return 'steady';       // green — you are tuning into the law
  if (cov < 0.30) return 'near';         // amber
  return 'far';                          // red — far from the least-time curve
}

// ══ THE DRAWN RAMP — a monotone cubic Hermite y(x) through pinned A/B + interior knots ══
// x is the independent variable, so the curve is ALWAYS a single-valued function of x
// (no loops — the design's "reject non-function" is structural, not a runtime check).
// Fritsch–Carlson tangent limiting keeps y monotone-nondecreasing (a true downhill ramp,
// so v=√(2gy) never stalls and the descent time stays finite — landmine (b)).
function sanitizeKnots(interior, xB = XB, yB = YB){
  // interior: [{x,y}] with x,y in tank units. Clamp into the box, sort, enforce strictly
  // increasing x (min gap) and monotone-nondecreasing y in (0, yB]. Endpoints A/B pinned.
  const gap = xB * 0.02, out = [];
  const src = interior.slice().sort((a, b) => a.x - b.x);
  let lastX = 0, lastY = 0;
  for (const k of src){
    let x = Math.min(Math.max(k.x, lastX + gap), xB - gap);
    let y = Math.min(Math.max(k.y, lastY), yB);      // monotone-nondecreasing, ≤ yB
    if (x <= lastX) continue;
    out.push({ x, y }); lastX = x; lastY = y;
  }
  return out;
}
function makeRamp(interior, xB = XB, yB = YB){
  const kn = sanitizeKnots(interior, xB, yB);
  const kx = [0], ky = [0];
  for (const k of kn){ kx.push(k.x); ky.push(k.y); }
  kx.push(xB); ky.push(yB);
  const n = kx.length, h = [], d = [];
  for (let i = 0; i < n - 1; i++){ h.push(kx[i + 1] - kx[i]); d.push((ky[i + 1] - ky[i]) / (kx[i + 1] - kx[i])); }
  const m = new Array(n);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++){ m[i] = (d[i - 1] * d[i] <= 0) ? 0 : (d[i - 1] + d[i]) / 2; }
  for (let i = 0; i < n - 1; i++){                    // Fritsch–Carlson monotonicity clamp
    if (d[i] === 0){ m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9){ const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  const seg = (x) => { let i = 0; while (i < n - 2 && x > kx[i + 1]) i++; return i; };
  const yFn = (x) => {
    if (x <= 0) return 0; if (x >= xB) return yB;
    const i = seg(x), t = (x - kx[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2*t3-3*t2+1)*ky[i] + (t3-2*t2+t)*h[i]*m[i] + (-2*t3+3*t2)*ky[i+1] + (t3-t2)*h[i]*m[i+1];
  };
  const ypFn = (x) => {
    const xc = Math.min(Math.max(x, 1e-9), xB - 1e-9);
    const i = seg(xc), t = (xc - kx[i]) / h[i], t2 = t * t;
    return ((6*t2-6*t)*ky[i] + (3*t2-4*t+1)*h[i]*m[i] + (-6*t2+6*t)*ky[i+1] + (3*t2-2*t)*h[i]*m[i+1]) / h[i];
  };
  const poly = [];
  const N = 240;
  for (let i = 0; i <= N; i++){ const x = xB * i / N; poly.push({ x, y: yFn(x) }); }
  return { yFn, ypFn, poly, knots: kn, kx, ky };
}
// the straight ramp (the default / worst honest competitor) as a ramp object.
function straightRamp(xB = XB, yB = YB){ return makeRamp([], xB, yB); }
// interior knots sampled ON the cycloid (the "best a hand can trace" preset).
function cycloidKnots(c, xB = XB, count = INTERIOR_KNOTS){
  const kn = []; for (let j = 1; j <= count; j++){ const x = xB * Math.pow(j / (count + 1), KNOT_BIAS); kn.push({ x, y: cycloidYatX(c, x) }); }
  return kn;
}

// the drawn ramp's descent time (brachistochrone's regularized quadrature) + its % gap.
function rampDescentTime(ramp, xB = XB, g = G, N){ return BRACH.descentTimeFn(ramp.yFn, ramp.ypFn, xB, g, N || 40000); }
function gapToLight(Tramp, Tstar){ return { ms: (Tramp - Tstar) * 1000, rel: Tramp / Tstar - 1, latched: (Tramp / Tstar - 1) <= LATCH_REL }; }

// ══ THE ANIMATION CLOCK — one release, three runners, timed by the SHARED table ══════
// Every runner is timed by brachistochrone's buildTimeTable (genuine v=√(2gy) along the
// arc), so the gold bead and the teal photon — both riding the cycloid — arrive together,
// and the amber ramp lags by its honest penalty. posAtTime reads a runner's position.
function timeTable(poly, g = G){ return BRACH.buildTimeTable(poly, g); }
function posOnTable(tbl, t){ return BRACH.posAtTime(tbl, t); }

// build all three runners' tables from the current ramp (+ the fixed gold/photon roads).
function buildRunners(interior, xB = XB, yB = YB, g = G, M = PHOTON_M){
  const c = refCycloid(xB, yB);
  const gold = cycloidPolyline(c, 900);
  const phot = solvePhoton(c, xB, yB, g, M);
  const ramp = makeRamp(interior, xB, yB);
  const goldTbl = timeTable(gold, g);
  const photTbl = timeTable(phot.poly, g);
  const rampTbl = timeTable(ramp.poly, g);
  const Tstar = cycloidTstar(c, g);
  return {
    c, Tstar,
    gold:   { poly: gold,       tbl: goldTbl, T: goldTbl.total },
    photon: { poly: phot.poly,  tbl: photTbl, T: photTbl.total, scene: phot.scene, X: phot.X, L: phot.L, gradMax: phot.gradMax },
    ramp:   { poly: ramp.poly,  tbl: rampTbl, T: rampTbl.total, ramp, Tdesc: rampDescentTime(ramp, xB, g) },
  };
}

// =================================================================== SELFTEST
function runSelfTest(){
  const items = []; let pass = 0;
  const check = (ok, label, detail) => { items.push({ ok: !!ok, label, detail }); if (ok) pass++; };
  const g = G, xB = XB, yB = YB, M = PHOTON_M;
  const c = refCycloid(xB, yB);
  const Tstar = cycloidTstar(c, g);

  // (1) INVARIANT — sinθ/v constant on the cycloid, cross-checked against BOTH cores.
  const exact = cycloidInvariantExact(c, g, 600);
  const phot = solvePhoton(c, xB, yB, g, M);
  const bou = photonBouguer(phot.scene, phot.X);
  let bmn = Infinity, bmx = -Infinity; for (const v of bou){ if (v < bmn) bmn = v; if (v > bmx) bmx = v; }
  const bouRel = (bmx - bmn) / Math.abs(0.5 * (bmx + bmn));
  check(exact.relSpread < 1e-4 && bouRel < 1e-9,
    "Invariant holds in BOTH cores: sin&theta;/v const on the cycloid, n&middot;sin&theta; const in the graded ray",
    "cycloid sin&theta;/v relSpread <b>" + exact.relSpread.toExponential(2) + "</b> (&lt;1e&#8722;4) &middot; refraction-run n&middot;sin&theta; relSpread <b>" + bouRel.toExponential(2) + "</b> (machine&#8209;&epsilon;)");

  // (2) SAME ROAD — the photon's crossings lie on the cycloid AND its time ≈ Tstar.
  const cyc = cycloidPolyline(c, 2000);
  const perp = (px, py) => { let mmin = 1e9; for (let i = 1; i < cyc.length; i++){ const ax = cyc[i-1].x, ay = cyc[i-1].y, bx = cyc[i].x, by = cyc[i].y; const ux = bx-ax, uy = by-ay, L2 = ux*ux+uy*uy; let t = ((px-ax)*ux+(py-ay)*uy)/L2; t = Math.max(0, Math.min(1, t)); mmin = Math.min(mmin, Math.hypot(px-(ax+t*ux), py-(ay+t*uy))); } return mmin; };
  let worstPerp = 0; for (let k = 0; k < phot.X.length; k++) worstPerp = Math.max(worstPerp, perp(phot.X[k], phot.scene.ys[k]));
  const photTbl = timeTable(phot.poly, g);
  const timeGapMs = Math.abs(photTbl.total - Tstar) * 1000;
  check(phot.gradMax < 1e-9 && worstPerp < 1e-2 && timeGapMs < 8,
    "SAME ROAD: the photon's least-time ray lies on the cycloid and clocks the same time",
    "&nabla;L <b>" + phot.gradMax.toExponential(2) + "</b> &middot; max &perp; offset <b>" + worstPerp.toExponential(2) + "</b> tank units &middot; |T<sub>photon</sub>&minus;T*| <b>" + timeGapMs.toFixed(3) + "</b> ms");

  // (3) NEG-CONTROL — the straight ramp breaks the invariant AND is strictly slower.
  const straight = straightRamp(xB, yB);
  const cycInv = invariantAlong(cyc, g);
  const stInv = invariantAlong(straight.poly, g);
  const Tstraight = rampDescentTime(straight, xB, g);
  const varRatio = cycInv.var > 0 ? stInv.var / cycInv.var : Infinity;
  check(varRatio > 50 && Tstraight > Tstar + 1e-6,
    "NEG&#8209;CONTROL: a straight ramp shatters the invariant AND is strictly slower (no vacuous tie)",
    "var(sin&theta;/v) ratio straight:cycloid <b>" + varRatio.toExponential(2) + "</b> (&gt;50&times;) &middot; T<sub>straight</sub> <b>" + Tstraight.toFixed(4) + "</b> &gt; T* <b>" + Tstar.toFixed(4) + "</b> s");

  // (4a) PAYOFF-LIVENESS — dead heat ENACTED: gold bead & photon finish within <1 frame,
  //      both strictly before the straight ramp by a visible margin.
  const goldTbl = timeTable(cycloidPolyline(c, 900), g);
  const straightTbl = timeTable(straight.poly, g);
  const heatMs = Math.abs(photTbl.total - goldTbl.total) * 1000;
  const leadMs = (straightTbl.total - Math.max(photTbl.total, goldTbl.total)) * 1000;
  check(heatMs < 16 && leadMs > 30,
    "PAYOFF (dead heat ENACTED): gold bead &amp; photon finish within &lt;1 frame; both beat the straight ramp",
    "|T<sub>gold</sub>&minus;T<sub>photon</sub>| <b>" + heatMs.toFixed(3) + "</b> ms (&lt;16) &middot; margin over straight <b>" + leadMs.toFixed(1) + "</b> ms (&gt;30)");

  // (4b) PAYOFF-LIVENESS — the ACTUAL rendered photon polyline, fed through the SAME
  //      invariant code the live widget uses, flips it to the green/steady state.
  const photInv = invariantAlong(phot.poly, g);
  const st = invariantState(photInv.cov);
  check(st === 'steady' && photInv.cov < 0.03,
    "PAYOFF (widget fires on the real render): the rendered photon road drives the live chip to STEADY green",
    "photon polyline cov <b>" + photInv.cov.toExponential(2) + "</b> &rarr; state <b>" + st + "</b> (steady)");

  // (5) DETERMINISM — the whole scene is a pure function of the fixed stage.
  const a = solvePhoton(c, xB, yB, g, M), b = solvePhoton(c, xB, yB, g, M);
  let same = a.X.length === b.X.length; for (let k = 0; k < a.X.length; k++) if (a.X[k] !== b.X[k]) same = false;
  check(same && cycloidTstar(refCycloid(xB, yB), g) === Tstar,
    "Deterministic (identical stage &rarr; bit&#8209;identical cycloid, photon, and time)",
    "photon crossings + T* reproduce exactly on repeat");

  return { items, pass, total: items.length,
    Tstar, Tphoton: photTbl.total, Tstraight,
    cycRelSpread: exact.relSpread, bouRel, worstPerp, gradMax: phot.gradMax };
}
// === CORE END ===

export {
  G, XB, YB, YMIN, PHOTON_M, LATCH_REL, INTERIOR_KNOTS,
  speedAt, indexAt, refCycloid, cycloidTstar, cycloidYatX, cycloidXatY,
  cycloidPolyline, cycloidArc, buildPhotonScene, solvePhoton, photonBouguer,
  invariantAlong, cycloidInvariantExact, invariantState,
  sanitizeKnots, makeRamp, straightRamp, cycloidKnots,
  rampDescentTime, gapToLight, timeTable, posOnTable, buildRunners, runSelfTest,
};
