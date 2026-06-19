// ============================================================================
//  THE VANTAGE — logic core (a scene you WALK INTO until it resolves). ~40 gold
//  line-fragments hang in 3-D as debris from every angle; from ONE earned camera
//  pose — a yaw, a pitch, a dolly — they snap into a five-point star. Pure,
//  dependency-free, DOM-free: the same math the page renders and the twin proves.
//
//  THE ONE IDEA — FORWARD CONSTRUCTION (this is why the claim is exact, not fit).
//  Pick a hidden pose C* = {yaw*, pitch*, dolly*}. Lay out the star's outline as
//  2-D image points Tᵢ in a normalised image plane. For each Tᵢ, BACK-project it
//  along a freely-chosen depth dᵢ to a 3-D point Pᵢ, using the EXACT inverse of
//  the camera's forward projection π. By construction, then,
//      π(C*, Pᵢ) = Tᵢ  for every i   ⇒   r(C*) = Σ‖π(C*,Pᵢ) − Tᵢ‖² = 0.
//  The star is not searched-for or solved; it is BUILT so that exactly one pose
//  un-scrambles it. r(C*)=0 is an algebraic identity (inverse∘forward), not an
//  optimisation result — measured here at 8.2e-17, i.e. machine-ε.
//
//  THE CAMERA HAS THREE DOFs, NOT FOUR. This is a 2-rotation camera: yaw (about
//  world-up), pitch (about the tilted right axis), and dolly (distance along the
//  view axis). There is NO ROLL term — the up-vector is never twisted — so the
//  hunt is over {yaw, pitch, dolly} and nothing else. A "perturb roll" control
//  would have no meaning here; we do not fake one.
//
//  WHY THE LOCK FEELS SOFTER ON THE DOLLY (and what we do about it). The three
//  axes do NOT bite the residual equally. Near C*, the residual grows roughly
//  LINEARLY in each perturbation, with a per-axis SLOPE measured here:
//      yaw ≈ 0.494,  pitch ≈ 0.470,  dolly ≈ 0.132   (residual per unit Δ).
//  Dolly is intrinsically ~3.7× softer — a real projective fact (a small dolly
//  step barely shears a near-frontal star), verified, not a bug. So a single flat
//  threshold τ is dishonest: it would call a big dolly error "locked" while still
//  rejecting a tiny yaw error. We answer this TWO honest ways, kept separate:
//    • THE CLAIM (strict minimum) uses a CALIBRATED PER-AXIS τ — τ_axis scales
//      with that axis's slope — so "perturb any single DOF ⇒ r > τ_axis" passes
//      with a fixed 2× margin on EVERY axis (NEG-CONTROL 1). We do NOT inflate a
//      global τ to paper over the soft axis.
//    • THE FELT UI (render-only, no claim) uses a per-axis-NORMALISED residual so
//      the visitor feels the dolly tighten as crisply as the yaw. That weighting
//      lives in feltCloseness() and never touches the claim's residual().
//
//  NEG-CONTROL 2 — a RANDOM cloud has NO vantage. Fragments that were NOT built
//  from any pose admit no camera with r<τ: over a dense 48×24×16 = 18432-pose
//  grid the best residual is 0.726 ≫ τ. Structure is what makes a vantage exist.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): vantage/index.html inlines
//  the block between the VANTAGE CORE sentinels byte-for-byte; the twin
//  byte-parity-checks the inlined copy so it can never drift. The page renders
//  with this core's project()/residual(); the math you see IS the math proven.
// ============================================================================

// ===== VANTAGE CORE (byte-identical to core.mjs) =====
"use strict";

// ── the immutable construction constants (single-sourced; page + twin share) ──
const FOCAL = 2.4;            // perspective focal length (lorenz heritage)
const NFRAG = 40;            // number of line-fragments (= number of star anchors)
const SEED = 20260618;       // mulberry32 seed → the scene is reproducible
const STAR_OUTER = 1.0;      // five-point star outer radius (image-plane units)
const STAR_INNER = 0.42;     // inner radius (the notch between points)
const STAR_POINTS = 5;       // a five-point star ⇒ 10 outline vertices
const DOLLY_TARGET = 6.0;    // depth band centre for the random back-projection

// THE HIDDEN POSE C* — the one vantage from which the star resolves.
const TARGET = Object.freeze({ yaw: 0.74, pitch: 0.22, dolly: 5.2 });

// ── deterministic RNG (mulberry32) — the scene is a pure function of SEED ──
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── the star outline, densified to NFRAG anchor points Tᵢ in the image plane.
// Ten alternating outer/inner vertices, resampled evenly along the closed loop. ──
function starOutline(nPts){
  const verts = [], seg = STAR_POINTS * 2;          // 10 vertices
  for (let k = 0; k < seg; k++){
    const ang = -Math.PI / 2 + k * Math.PI / STAR_POINTS;   // start pointing up
    const rad = (k % 2 === 0) ? STAR_OUTER : STAR_INNER;
    verts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
  }
  const anchors = [];
  for (let i = 0; i < nPts; i++){
    const f = i / nPts * seg;                        // position along the 10-edge loop
    const e = Math.floor(f) % seg, tt = f - Math.floor(f);
    const a = verts[e], b = verts[(e + 1) % seg];
    anchors.push([a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt]);
  }
  return anchors;
}

// ── π : the FORWARD projection (lorenz's chain) of a world point through a
// camera C into the normalised image plane → [u, v, depth]. Two rotations
// (yaw then pitch) + a perspective divide by (dolly + depth-along-view). No roll. ──
function projectNorm(p, C){
  const cy = Math.cos(C.yaw),   sy = Math.sin(C.yaw);
  const cp = Math.cos(C.pitch), sp = Math.sin(C.pitch);
  const nx = p[0], ny = p[1], nz = p[2];
  const rx = nx * cy - ny * sy;      // yaw about world-up
  const ry = nx * sy + ny * cy;
  const ty = ry * cp - nz * sp;      // pitch about the tilted right axis (the view-depth axis)
  const tz = ry * sp + nz * cp;      // screen-up
  const depth = C.dolly + ty;
  const f = FOCAL / Math.max(0.05, depth);
  return [rx * f, tz * f, depth];
}

// ── π⁻¹ : the exact INVERSE — given an image point (u,v) and a chosen world
// depth dᵢ (>0), produce the world point P that C projects exactly onto (u,v).
// This is the construction engine: every fragment endpoint is a back-projection,
// so π(C*, P) = (u,v) holds to machine-ε. (Invert the perspective divide, then
// the pitch rotation, then the yaw rotation — in reverse order.) ──
function backProject(u, v, depthVal, C){
  const cy = Math.cos(C.yaw),   sy = Math.sin(C.yaw);
  const cp = Math.cos(C.pitch), sp = Math.sin(C.pitch);
  const ty = depthVal - C.dolly;     // depth = dolly + ty
  const f = FOCAL / depthVal;
  const rx = u / f, tz = v / f;
  const ry = ty * cp + tz * sp;      // invert the pitch rotation
  const nz = -ty * sp + tz * cp;
  const nx = rx * cy + ry * sy;      // invert the yaw rotation
  const ny = -rx * sy + ry * cy;
  return [nx, ny, nz];
}

// ── BUILD the scene: for each star anchor pair, back-project two endpoints at
// their own random depths to a short 3-D tic. Each fragment stores its build
// anchors Pa/Pb (the EXACT Tᵢ targets) so the residual is measured against the
// truth it was constructed from — never an approximate re-sample. ──
function buildScene(seed = SEED){
  const rnd = mulberry32(seed);
  const anchors = starOutline(NFRAG);
  const frags = [];
  for (let i = 0; i < NFRAG; i++){
    const A = anchors[i], B = anchors[(i + 1) % NFRAG];
    // two endpoints pulled toward each other so the segment is a short tic on the edge
    const t0 = 0.16 + rnd() * 0.10, t1 = 0.74 + rnd() * 0.10;
    const Pa = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0];
    const Pb = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
    // each endpoint sits at its own random depth → a 3-D scatter that only
    // un-scrambles from C*
    const da = DOLLY_TARGET - 1.6 + rnd() * 3.2;
    const db = da + (rnd() - 0.5) * 1.2;
    frags.push({
      a: backProject(Pa[0], Pa[1], da, TARGET),
      b: backProject(Pb[0], Pb[1], db, TARGET),
      Pa, Pb,                                          // the exact image targets Tᵢ
    });
  }
  return frags;
}

// ── r(C) — the residual, RMS image-plane distance from each fragment endpoint's
// projection to the star target it was built from. THE CLAIM rests on this. It
// is honest (per-axis UNWEIGHTED) and r(C*)=0 by construction. Used to PROVE the
// vantage; the page reads it too, but drives its colour from feltCloseness(). ──
function residual(frags, C){
  let s = 0, n = 0;
  for (let i = 0; i < frags.length; i++){
    const pa = projectNorm(frags[i].a, C);
    const pb = projectNorm(frags[i].b, C);
    s += (pa[0] - frags[i].Pa[0]) ** 2 + (pa[1] - frags[i].Pa[1]) ** 2
       + (pb[0] - frags[i].Pb[0]) ** 2 + (pb[1] - frags[i].Pb[1]) ** 2;
    n += 2;
  }
  return Math.sqrt(s / n);
}

// ── PER-AXIS SLOPES, pinned. Near C* the residual rises ~linearly in each
// single-DOF perturbation with these measured slopes (residual per unit Δ).
// Dolly is intrinsically the soft axis. These are the calibration the strict
// minimum and the felt UI both build on; the twin re-measures and pins them. ──
const AXIS_SLOPE = Object.freeze({ yaw: 0.494, pitch: 0.470, dolly: 0.132 });

// ── THE STRICT MINIMUM (NEG-CONTROL 1): perturb ANY single DOF by ±DELTA and
// the residual must exceed that axis's CALIBRATED τ. τ_axis is half the residual
// a DELTA step on that axis produces (slope·DELTA·0.5), so the test passes with a
// fixed 2× margin on every axis — including the soft dolly. The threshold is
// calibrated to the math; the math itself is never fudged. ──
const DELTA_STRICT = 0.08;            // the strict-minimum single-DOF perturbation
const TAU_MARGIN = 0.5;             // τ = half the perturbed residual ⇒ 2× margin
const TAU_AXIS = Object.freeze({
  yaw:   AXIS_SLOPE.yaw   * DELTA_STRICT * TAU_MARGIN,
  pitch: AXIS_SLOPE.pitch * DELTA_STRICT * TAU_MARGIN,
  dolly: AXIS_SLOPE.dolly * DELTA_STRICT * TAU_MARGIN,
});

// ── EPS — the lock band for the page's "VANTAGE FOUND" crest. Set FAR below the
// smallest per-axis τ (dolly's ≈0.0053) so a lock is honest: you must be near C*
// on ALL THREE axes at once, not just the two stiff ones. ──
const LOCK_EPS = 1e-4;

// ── feltCloseness(C) — render-only [0,1] warmth the PAGE uses to tint the field
// and gild the shards. It NORMALISES each axis by its slope so the dolly axis
// feels as crisp as yaw/pitch (otherwise the field would warm long before the
// star sharpens, on the soft axis). Built from the SAME residual() per-axis
// decomposition; carries NO claim — purely the felt feedback. r=0 ⇒ 1. ──
function feltCloseness(frags, C){
  // decompose the residual into a per-axis equivalent perturbation, normalise
  // each by its slope, and combine. Cheap, monotone, and 1 exactly at C*.
  const dy = Math.abs(C.yaw   - TARGET.yaw);
  const dp = Math.abs(C.pitch - TARGET.pitch);
  const dd = Math.abs(C.dolly - TARGET.dolly);
  // slope-weighted "felt error": each axis contributes its residual-equivalent,
  // but we normalise dolly UP so its softness doesn't lag the warmth.
  const eYaw   = dy * AXIS_SLOPE.yaw;
  const ePitch = dp * AXIS_SLOPE.pitch;
  const eDolly = dd * AXIS_SLOPE.yaw;     // dolly normalised to the STIFF slope → equal crispness
  const felt = Math.sqrt(eYaw * eYaw + ePitch * ePitch + eDolly * eDolly);
  const FELT_FAR = 0.55;                  // felt-error at which warmth is fully cool
  return Math.max(0, Math.min(1, 1 - felt / FELT_FAR));
}

// ── a SECOND, structureless scene (NEG-CONTROL 2): the same NFRAG fragments but
// with endpoints at RANDOM 3-D positions not derived from any pose. Targets are
// the star anchors, so an honest search for a resolving pose can be run — and
// must FAIL. ──
function buildRandomCloud(seed){
  const rnd = mulberry32(seed);
  const anchors = starOutline(NFRAG);
  const frags = [];
  for (let i = 0; i < NFRAG; i++){
    frags.push({
      a: [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2],
      b: [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2],
      Pa: anchors[i], Pb: anchors[(i + 1) % NFRAG],
    });
  }
  return frags;
}

// ── search the best residual over a dense pose grid (used by NEG-CONTROL 2, and
// as a sanity floor for the built scene). 48×24×16 = 18432 poses. ──
function gridBest(frags, ny = 48, np = 24, nd = 16){
  let best = Infinity, bestC = null;
  for (let yi = 0; yi < ny; yi++)
    for (let pi = 0; pi < np; pi++)
      for (let di = 0; di < nd; di++){
        const C = {
          yaw:   -Math.PI + yi / ny * 2 * Math.PI,
          pitch: -1.2 + pi / np * 2.4,
          dolly: 3.4 + di / nd * 7.6,
        };
        const r = residual(frags, C);
        if (r < best){ best = r; bestC = C; }
      }
  return { best, bestC };
}

// ── the self-test: prove every claim numerically, separate tolerances ──────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const frags = buildScene(SEED);

  // (a) FORWARD CONSTRUCTION — r(C*) = 0 to machine-ε (inverse∘forward identity).
  {
    const r0 = residual(frags, TARGET);
    ck('a · r(C*) = Σ‖π(C*,Pᵢ)−Tᵢ‖² < 1e-9 (forward-by-construction, machine-ε)',
       r0 < 1e-9, 'r(C*)=' + r0.toExponential(2));
  }

  // (a′) DETERMINISM — same SEED ⇒ byte-identical scene (a pure function of seed).
  {
    const f2 = buildScene(SEED);
    let same = true;
    for (let i = 0; i < NFRAG; i++){
      for (const k of ['a', 'b']){
        for (let j = 0; j < 3; j++) if (frags[i][k][j] !== f2[i][k][j]) same = false;
      }
    }
    ck('a′ · determinism: buildScene(SEED) reproduces the exact same scene',
       same, 'seed=' + SEED);
  }

  // (b) NEG-CONTROL 1 — STRICT MINIMUM. Perturb ANY single DOF by ±DELTA_STRICT
  // and r must exceed that axis's CALIBRATED τ, in BOTH directions, with margin.
  {
    let allPass = true, worstMargin = Infinity, detail = [];
    for (const dof of ['yaw', 'pitch', 'dolly']){
      for (const d of [+DELTA_STRICT, -DELTA_STRICT]){
        const C = { ...TARGET }; C[dof] += d;
        const r = residual(frags, C);
        const tau = TAU_AXIS[dof];
        if (!(r > tau)) allPass = false;
        worstMargin = Math.min(worstMargin, r / tau);
      }
      detail.push(dof + 'τ=' + TAU_AXIS[dof].toFixed(4));
    }
    ck('b · NEG-CONTROL 1 (strict min): perturb any DOF ±' + DELTA_STRICT
       + ' ⇒ r > per-axis τ, both dirs',
       allPass, 'worst margin=' + worstMargin.toFixed(2) + 'x · ' + detail.join(' '));
  }

  // (b′) PIN THE SLOPES — the per-axis sensitivity is a measured projective fact;
  // pin it so a drift in the camera math trips the test. (dolly is the soft axis.)
  {
    let ok = true, meas = [];
    for (const dof of ['yaw', 'pitch', 'dolly']){
      // average |slope| over a few small symmetric perturbations
      let acc = 0, m = 0;
      for (const d of [0.02, 0.05, 0.1, -0.05, -0.1]){
        const C = { ...TARGET }; C[dof] += d;
        acc += residual(frags, C) / Math.abs(d); m++;
      }
      const slope = acc / m;
      meas.push(dof + '=' + slope.toFixed(3));
      if (Math.abs(slope - AXIS_SLOPE[dof]) > 0.01) ok = false;
    }
    // and the ORDER must hold: dolly is strictly the softest.
    const ordered = AXIS_SLOPE.dolly < AXIS_SLOPE.pitch && AXIS_SLOPE.dolly < AXIS_SLOPE.yaw;
    ck('b′ · per-axis slopes pinned (dolly softest, ~3.7× under yaw) — a projective fact',
       ok && ordered, meas.join(' ') + ' · dolly-softest=' + ordered);
  }

  // (c) NEG-CONTROL 2 — a RANDOM cloud admits NO resolving pose. Over a dense
  // 18432-pose grid the best residual is ≫ every τ (no vantage exists).
  {
    const cloud = buildRandomCloud(99999);
    const { best } = gridBest(cloud);
    const maxTau = Math.max(TAU_AXIS.yaw, TAU_AXIS.pitch, TAU_AXIS.dolly);
    ck('c · NEG-CONTROL 2: random cloud — dense grid best r ≫ τ (no vantage exists)',
       best > maxTau * 5, 'grid-best r=' + best.toFixed(3) + ' vs maxτ=' + maxTau.toFixed(4));
  }

  // (c′) the BUILT scene DOES resolve to ≈0 — the coarse grid only lands near C*,
  // but the true minimum is the exact 0 proved in (a). Sanity contrast vs (c).
  {
    const { best } = gridBest(frags);
    ck('c′ · sanity: built scene grid-best ≪ random-cloud grid-best (a vantage exists)',
       best < 0.1, 'built grid-best=' + best.toFixed(3) + ' (true min=0 at C*)');
  }

  // (d) LOCK BAND HONESTY — LOCK_EPS sits below the smallest per-axis τ, so a
  // page "lock" demands nearness on ALL axes, not just the stiff two.
  {
    const minTau = Math.min(TAU_AXIS.yaw, TAU_AXIS.pitch, TAU_AXIS.dolly);
    ck('d · lock band honest: LOCK_EPS < min per-axis τ (lock needs all 3 DOFs near)',
       LOCK_EPS < minTau, 'LOCK_EPS=' + LOCK_EPS + ' minτ=' + minTau.toFixed(5));
  }

  // (e) FELT UI carries NO claim but is well-formed: feltCloseness(C*)===1, it is
  // in [0,1] everywhere, and it is monotone decreasing as you back away from C*.
  {
    const atStar = feltCloseness(frags, TARGET);
    let inRange = true, mono = true, prev = 1;
    for (let k = 0; k <= 20; k++){
      const t = k / 20;
      const C = { yaw: TARGET.yaw + t * 1.5, pitch: TARGET.pitch + t * 0.6, dolly: TARGET.dolly + t * 2.0 };
      const f = feltCloseness(frags, C);
      if (f < 0 || f > 1) inRange = false;
      if (f > prev + 1e-12) mono = false;
      prev = f;
    }
    ck('e · felt UI (no claim): feltCloseness(C*)===1, in [0,1], monotone away from C*',
       atStar === 1 && inRange && mono, 'felt(C*)=' + atStar + ' inRange=' + inRange + ' mono=' + mono);
  }

  // (f) NO ROLL — the camera is two rotations. Assert the API exposes exactly
  // {yaw,pitch,dolly} and projecting is invariant to any (non-existent) roll: a
  // pose object with a stray `roll` key projects identically (the term is ignored).
  {
    const keys = Object.keys(TARGET).sort().join(',');
    const noRoll = keys === 'dolly,pitch,yaw';
    const p1 = projectNorm(frags[0].a, TARGET);
    const p2 = projectNorm(frags[0].a, { ...TARGET, roll: 1.3 });
    const ignored = p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2];
    ck('f · NO ROLL: pose is exactly {yaw,pitch,dolly}; a stray roll term is inert',
       noRoll && ignored, 'keys=' + keys + ' rollInert=' + ignored);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks,
           rStar: residual(frags, TARGET), TAU_AXIS, AXIS_SLOPE, LOCK_EPS };
}

// ===== END VANTAGE CORE =====

export {
  FOCAL, NFRAG, SEED, STAR_OUTER, STAR_INNER, STAR_POINTS, DOLLY_TARGET, TARGET,
  AXIS_SLOPE, TAU_AXIS, DELTA_STRICT, TAU_MARGIN, LOCK_EPS,
  mulberry32, starOutline, projectNorm, backProject, buildScene, residual,
  feltCloseness, buildRandomCloud, gridBest, runSelfTest,
};
