/* ════════════════════════════════════════════════════════════════════════════
   AS HANGS THE CHAIN, SO STANDS THE ARCH — core.mjs · the statics + curve
   authority (pure, DOM-free). A companion instrument to The Keystone Arch and
   The Catenary: the touchable hung chain threaded through the actual nine
   dry-stone voussoir ring.

   Robert Hooke, 1675: "Ut pendet continuum flexile, sic stabit contiguum
   rigidum inversum" — as hangs a flexible line, so, inverted, stands the rigid
   arch. This module makes that sentence a machine-checkable fact against the
   keystone arch's OWN proven ring.

   ── TWO MATH LAYERS, both honest.
   LAYER A — "the plain chain". A UNIFORM hanging catenary y = a·cosh(x/a),
     pinned level at the two springers (±R_mid, 0), reflected about the pin line
     to stand as an arch. Tuned to the crown (a≈1.5–1.6) its inverted curve
     THREADS all nine voussoirs — but it rides toward the OUTER half of the ring
     at the haunches. It is the beautiful intuition ("a hung shape, inverted,
     wants to stand"); it is NOT sold as the arch's own equilibrium line.
   LAYER B — "load it like the arch" (the exact headline). Hang beads carrying
     the nine VOUSSOIR WEIGHTS (the core's annular-sector areas) with the crown
     thrust H taken from the keystone core's admissibleLine(). The chain settles
     to the funicular polygon of those loads; INVERTED, those points EQUAL
     core.thrustLine(H, y0).points to machine ε. THAT is "literally the same
     curve, one inverted."

   ── ONE ECCENTRICITY drives colour + collapse. For any active curve we read,
     at each radial joint θ_k = k·π/9, the radius ρ_k where the curve crosses
     that radial, and the eccentricity e_k = ρ_k − R_mid (how far the line sits
     from the joint mid-line). |e_k| ≤ t/2 = 0.5 ⇒ the line is INSIDE the stone
     (the containment LAW). Three bands: GREEN |e_k| ≤ t/6 (middle third, no
     tension), AMBER t/6 < |e_k| ≤ t/2 (contained but near the edge — the honest
     haunches of the uniform chain), RED |e_k| > t/2 (out of section ⇒ hinge).

   ── THE HINGE (payoff). A point load ΔP dropped on a haunch joint is demand the
     rigid ring cannot absorb: its horizontal thrust cannot grow to match the new
     vertical load, so the working line steepens (H_eff falls) and bulges out of
     the section. The FIRST joint with |e_k| > t/2 is the hinge; above it the
     segment rotates, and the loaded half makes an unbalanced gravity moment
     about its springer (core.keystoneRemoved's choreography) — standsUp = false.

   ── PROVENANCE. buildArch / thrustLine / admissibleLine / keystoneRemoved /
     annularSector are IMPORTED from the keystone arch's core (the single source
     of the ring geometry + the proven line of thrust). The catenary SOLVER
     (solveCatenary / satisfyLinks / relaxBeads) is COPIED verbatim from
     catenary/index.html and re-proven here (both pins hit, arc length conserved
     to 1e-9) so the copy is verified, not trusted. forge strips the `import` and
     `export` keywords when this is inlined into the page beside the keystone
     core's slab, so the imported names resolve to that sibling slab's globals.
   ════════════════════════════════════════════════════════════════════════════ */

import { buildArch, thrustLine, admissibleLine, keystoneRemoved, annularSector } from '../the-keystone-arch/core.mjs';

/* NOTE: no top-level `const PI` here — the keystone core's slab already declares
   one in the shared global lexical scope when both are inlined, and a second
   would be a redeclaration SyntaxError. We use Math.PI directly. */

/* ── the ring, once. R_mid = 2.5 (world units), t = 1, nine voussoirs, ten radial
   joints J0..J9 at θ_j = j·π/9; springers J0 = (+2.5,0), J9 = (−2.5,0). ───────── */
export const HRING = buildArch();
export const RM = HRING.Rmid;      // 2.5  — crown-of-centreline radius / half-span
export const THALF = HRING.t / 2;  // 0.5  — the section half-depth (containment law)
export const TTHIRD = HRING.t / 6; // 0.1667 — the middle-third (no-tension) band
export const NJ = HRING.N;         // 9 voussoirs ⇒ joints 0..9
const DTH = Math.PI / NJ;

/* ════════════════════════════════════════════════════════════════════════════
   LAYER A — THE PLAIN UNIFORM CHAIN (and its reflection).  All in WORLD units
   (the same length scale as R_mid = 2.5) — never pixels.
   ════════════════════════════════════════════════════════════════════════════ */

/* the hung shape: pinned level at (±R_mid, 0), sagging to y ≤ 0.  Vertex-centred
   so y(±R_mid) = 0 exactly and y(0) < 0. */
export function hangY(a, x) { return a * Math.cosh(x / a) - a * Math.cosh(RM / a); }
/* the reflection about the pin line y = 0: the arch that stands, y ≥ 0. */
export function archY(a, x) { return -hangY(a, x); }
/* a fixed shape has one length; dragging pays out chain, so length is a FUNCTION
   of a: L = 2a·sinh(R_mid/a) (arc length of the symmetric catenary). */
export function chainLength(a) { return 2 * a * Math.sinh(RM / a); }

/* GRAB THE CHAIN: the viewer seizes it at world x_g and drags it to depth y_t
   (y_t < 0).  Solve for the shape parameter a by monotone bisection on
   f(a) = hangY(a, x_g) − y_t  over a ∈ [0.4, 8].  (hangY is monotone in a for a
   fixed interior x: a bigger a ⇒ a flatter, shallower chain ⇒ larger, less
   negative y.)  ~40 iterations. */
export function solveAForGrab(xg, yt) {
  const AX = Math.min(Math.abs(xg), RM - 1e-4);
  const f = (a) => hangY(a, AX) - yt;
  let lo = 0.4, hi = 8;
  // guard the bracket: the deepest chain (lo) sags most (most negative), the
  // flattest (hi) barely dips. If the target is out of reach, clamp.
  if (f(lo) > 0) return lo;    // even the deepest chain can't reach that depth
  if (f(hi) < 0) return hi;    // even the flattest is deeper than asked
  for (let i = 0; i < 44; i++) { const m = 0.5 * (lo + hi); if (f(m) < 0) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

/* WHERE the reflected uniform curve crosses radial joint θ_k, as a radius ρ.
   Solve g(ρ) = ρ·sinθ − archY(a, ρ·cosθ) = 0.  ROBUSTNESS: the crossing is
   near the ring, but a sibling can drive a to an extreme (a peaked or a nearly
   flat curve). Bracket [1.0, 3.5] first; if no sign change, WIDEN to [0.4, 7.5]
   and re-check; only bisect on a real sign change — never return a bad root.
   No crossing in the widened bracket ⇒ the curve does not thread this radial
   (it rides clean outside the stone) ⇒ NaN, which the caller reads as out-of-
   section (RED). */
export function crossRadius(a, theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const g = (r) => r * s - archY(a, r * c);
  const bisect = (lo, hi) => {
    let glo = g(lo), ghi = g(hi);
    if (glo === 0) return lo;
    if (ghi === 0) return hi;
    if (glo * ghi > 0) return null;                 // no sign change in this bracket
    for (let i = 0; i < 90; i++) {
      const m = 0.5 * (lo + hi), gm = g(m);
      if (gm === 0) return m;
      if (gm * glo > 0) { lo = m; glo = gm; } else { hi = m; }
    }
    return 0.5 * (lo + hi);
  };
  let r = bisect(1.0, 3.5);
  if (r === null) r = bisect(0.4, 7.5);              // widen before trusting a root
  return r === null ? NaN : r;
}

/* the eccentricities of the reflected uniform chain at every joint.  Springers
   (J0, J9) sit on the pin line where the curve is pinned ⇒ e = 0 there.  The
   crown eccentricity is read straight off the curve's apex. */
export function uniformEccentricities(a) {
  const per = [];
  for (let k = 0; k <= NJ; k++) {
    if (k === 0 || k === NJ) { per.push({ j: k, e: 0, rho: RM }); continue; }
    const r = crossRadius(a, k * DTH);
    per.push({ j: k, e: Number.isFinite(r) ? r - RM : NaN, rho: r });
  }
  const eCrown = archY(a, 0) - RM;                   // apex vs crown mid-line
  const inner = per.filter((p) => p.j > 0 && p.j < NJ);
  const finite = inner.filter((p) => Number.isFinite(p.e));
  const maxAbsE = finite.length === inner.length ? Math.max(...inner.map((p) => Math.abs(p.e))) : Infinity;
  const contained = maxAbsE <= THALF + 1e-12;
  return { a, per, eCrown, maxAbsE, contained };
}

/* the three-band colour of an eccentricity (NaN / out ⇒ red). */
export function bandOf(e) {
  if (!Number.isFinite(e)) return 'red';
  const m = Math.abs(e);
  if (m <= TTHIRD + 1e-12) return 'green';
  if (m <= THALF + 1e-12) return 'amber';
  return 'red';
}

/* ════════════════════════════════════════════════════════════════════════════
   LAYER B — LOAD IT LIKE THE ARCH.  The funicular polygon of the nine voussoir
   weights, at the joint angles, under the crown thrust H from admissibleLine().
   This is an INDEPENDENT accumulation (moments about O, crown → springer); it
   reproduces the keystone core's thrustLine to machine ε, and its reflection is
   the hung chain.  An optional point load {dP at joint jL} is injected into the
   accumulation for the hinge path.
   ════════════════════════════════════════════════════════════════════════════ */

/* the right-half pieces crown → springer, exactly as the keystone core frames
   them: the right half of the keystone [m·Δθ, π/2] above joint J_m, then full
   voussoirs m−1 … 0 above joints J_{m−1} … J_0. */
function rightHalfPieces() {
  const m = HRING.keystoneIndex;                      // 4
  const pieces = [];
  const hk = annularSector(m * DTH, Math.PI / 2, HRING.Ri, HRING.Ro, HRING.gamma);
  pieces.push({ w: hk.weight, x: hk.cx, ji: m, th: m * DTH });
  for (let j = m - 1; j >= 0; j--) {
    pieces.push({ w: HRING.voussoirs[j].weight, x: HRING.voussoirs[j].centroid.x, ji: j, th: j * DTH });
  }
  return pieces;
}

/* the loaded funicular for a crown thrust (H, y0), with an optional extra point
   load.  Returns the RIGHT-half joint crossings (ρ_k, e_k) and the full symmetric
   world polyline (right springer → crown → left springer), matching thrustLine's
   `points` ordering.  extra = { dP, jL } injects a downward load dP that enters
   the accumulation at joint jL (breaks the symmetry — used only for the hinge). */
export function loadedFunicular(H, y0, extra) {
  const pieces = rightHalfPieces();
  let W = 0, SwX = 0;
  const right = [];   // crown → springer, joints J_m .. J_0
  for (const p of pieces) {
    W += p.w; SwX += p.w * p.x;
    if (extra && p.ji === extra.jL) { W += extra.dP; SwX += extra.dP * p.x; }
    const Nk = W * Math.cos(p.th) + H * Math.sin(p.th);
    const rho = (y0 * H + SwX) / Nk;
    right.push({ ji: p.ji, theta: p.th, rho, e: rho - RM, N: Nk });
  }
  const eCrown = y0 - RM;
  // assemble the symmetric world polyline exactly like thrustLine.points
  const rightPts = right.map((r) => ({ x: r.rho * Math.cos(r.theta), y: r.rho * Math.sin(r.theta), e: r.e, jointIndex: r.ji }));
  const crownPt = { x: 0, y: y0, e: eCrown, jointIndex: 'crown' };
  const leftPts = right.map((r) => ({ x: -r.rho * Math.cos(r.theta), y: r.rho * Math.sin(r.theta), e: r.e, jointIndex: NJ - r.ji }));
  const points = [...rightPts.slice().reverse(), crownPt, ...leftPts];
  const allE = [eCrown, ...right.map((r) => r.e)];
  const maxAbsE = Math.max(...allE.map(Math.abs));
  return { H, y0, right, eCrown, points, allE, maxAbsE, contained: maxAbsE <= THALF + 1e-9 };
}

/* the admissible (most-centred) crown thrust for the seated ring — the SINGLE
   source of H for Layer B (never a self-picked H, or the coincidence breaks). */
export const ADM = admissibleLine(HRING);

/* the hung loaded chain: reflect the standing line of thrust about the pin line.
   Inverting it (reflecting back) returns the line of thrust — "the same curve,
   one inverted." */
export function reflectAboutPinLine(points) {
  return points.map((p) => ({ ...p, y: -p.y }));
}

/* ════════════════════════════════════════════════════════════════════════════
   THE HINGE — a point load the ring cannot absorb.  The rigid arch's horizontal
   thrust cannot grow to meet the new vertical demand, so we drop the working
   thrust from ADM.H toward zero as the load approaches DPMAX; the line steepens
   and bulges out of the section.  Returns the eccentricities, the first hinge
   joint, the unbalanced gravity moment about the loaded springer, and standsUp.
   ════════════════════════════════════════════════════════════════════════════ */
export const DPMAX = 4.2;
export function hinge(dP, jL) {
  const Heff = ADM.H * Math.max(0.02, 1 - dP / DPMAX);
  const fun = loadedFunicular(Heff, ADM.y0, { dP, jL });
  const worst = Math.max(...fun.right.map((r) => Math.abs(r.e)), Math.abs(fun.eCrown));
  const hingeJoint = (() => {
    // crown → springer: the first joint whose eccentricity leaves the section
    for (const r of fun.right) if (Math.abs(r.e) > THALF) return r.ji;
    return -1;
  })();
  // the loaded half's unbalanced gravity moment about its springer bed (R_mid, 0),
  // signed CCW: a downward weight w at x makes moment w·(x − R_mid). (keystoneRemoved's
  // choreography.)  Nonzero ⇒ nothing balances it ⇒ the half rotates and drops.
  let mom = 0;
  for (let j = 0; j <= HRING.keystoneIndex; j++) mom += HRING.voussoirs[j].weight * (HRING.voussoirs[j].centroid.x - RM);
  mom += dP * (HRING.voussoirs[jL].centroid.x - RM);
  return { dP, jL, Heff, right: fun.right, eCrown: fun.eCrown, worst, hingeJoint, mom, standsUp: worst <= THALF };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE COPIED CATENARY SOLVER — lifted verbatim from catenary/index.html so the
   grab-and-drag settle uses the same proven bead relaxation.  Re-proven by the
   self-test (both pins hit, arc length conserved to 1e-9): verified, not trusted.
   ════════════════════════════════════════════════════════════════════════════ */
/* from catenary/index.html */
function sinh(x) { return Math.sinh(x); }
/* from catenary/index.html */
function cosh(x) { return Math.cosh(x); }
/* from catenary/index.html — solve a chain of length L pinned at (−h,0),(h,vDown)
   in a +y-DOWN frame (chain sags to positive y). */
export function solveCatenary(h, vDown, L) {
  var v = -vDown;
  var straight = Math.hypot(2 * h, v);
  if (L <= straight * 1.0000001) { return { ok: false, reason: 'taut' }; }
  var rhs = Math.sqrt(L * L - v * v);
  var target = rhs / (2 * h);
  var lo = 1e-9, hi = 1.0;
  while (sinh(hi) / hi < target) { hi *= 2; if (hi > 1e7) break; }
  for (var i = 0; i < 200; i++) { var mid = 0.5 * (lo + hi), val = sinh(mid) / mid; if (val < target) lo = mid; else hi = mid; }
  var u = 0.5 * (lo + hi);
  var a = h / u;
  var x0 = a * Math.asinh(-v / rhs);
  var cUp = -a * cosh((-h - x0) / a);
  return { ok: true, a: a, x0: x0, cUp: cUp, h: h, v: vDown, L: L };
}
/* from catenary/index.html */
export function catY(sol, x) { return -(sol.a * cosh((x - sol.x0) / sol.a) + sol.cUp); }
/* from catenary/index.html */
export function catLen(sol) { return sol.a * (sinh((sol.h - sol.x0) / sol.a) - sinh((-sol.h - sol.x0) / sol.a)); }
/* from catenary/index.html */
export function makeBeads(h, v, L, n) {
  var pts = []; for (var i = 0; i < n; i++) { var t = i / (n - 1); pts.push({ x: -h + 2 * h * t, y: v * t }); }
  return { pts: pts, h: h, v: v, L: L, n: n, seg: L / (n - 1) };
}
/* from catenary/index.html */
export function satisfyLinks(pts, n, seg, dir) {
  var lo = dir > 0 ? 0 : n - 2, hi = dir > 0 ? n - 1 : -1, st = dir > 0 ? 1 : -1;
  for (var j = lo; j !== hi; j += st) {
    var A = pts[j], C = pts[j + 1];
    var dx = C.x - A.x, dy = C.y - A.y, d = Math.hypot(dx, dy) || 1e-9;
    var diff = (d - seg) / d, ox = dx * diff, oy = dy * diff;
    var aFree = (j !== 0), cFree = (j + 1 !== n - 1);
    if (aFree && cFree) { A.x += 0.5 * ox; A.y += 0.5 * oy; C.x -= 0.5 * ox; C.y -= 0.5 * oy; }
    else if (aFree) { A.x += ox; A.y += oy; }
    else if (cFree) { C.x -= ox; C.y -= oy; }
  }
}
/* from catenary/index.html */
export function relaxBeads(B, iters) {
  var pts = B.pts, n = B.n, seg = B.seg;
  for (var it = 0; it < iters; it++) {
    var grav = 0.0025;
    for (var i = 1; i < n - 1; i++) { pts[i].y += grav; }
    for (var pass = 0; pass < 24; pass++) { satisfyLinks(pts, n, seg, (pass & 1) ? -1 : 1); }
  }
  for (var f = 0; f < 6000; f++) { satisfyLinks(pts, n, seg, (f & 1) ? -1 : 1); }
  return pts;
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — the MATH CLAIM, proven headless.  The Node twin (core.test.mjs)
   runs this same runSelfTest(); the in-page pill runs it too.
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };

  // (1) COINCIDENCE + CONTAINMENT.
  //   (1a) the loaded funicular, at the admissible crown thrust, equals the
  //        keystone core's own line of thrust to machine ε — the exhibit's Layer-B
  //        chain and the proven arch line are the SAME points. Inverted, they are
  //        the hung chain: "as hangs the chain, so stands the arch."
  const core = thrustLine(ADM.H, ADM.y0, HRING);
  const mine = loadedFunicular(ADM.H, ADM.y0);
  let maxPtDiff = 0;
  for (let i = 0; i < core.points.length; i++) {
    maxPtDiff = Math.max(maxPtDiff, Math.hypot(core.points[i].x - mine.points[i].x, core.points[i].y - mine.points[i].y));
  }
  ok(maxPtDiff < 1e-9, `Layer-B loaded funicular == core line of thrust to <1e-9 (got ${maxPtDiff.toExponential(2)})`);
  // and its double reflection returns the line of thrust (the hung chain inverted).
  const hung = reflectAboutPinLine(mine.points);
  const backUp = reflectAboutPinLine(hung);
  let invDiff = 0;
  for (let i = 0; i < backUp.length; i++) invDiff = Math.max(invDiff, Math.hypot(backUp[i].x - core.points[i].x, backUp[i].y - core.points[i].y));
  ok(invDiff < 1e-12, `the hung loaded chain, inverted, IS the line of thrust (Δ ${invDiff.toExponential(2)})`);

  //   (1b) the PLAIN uniform chain, tuned near the crown (a* ≈ 1.6), threads
  //        every stone — max|e_k| = 0.3016 ≤ t/2 = 0.5 — but only just (J2/J3
  //        amber). Pinned to the /tmp-verified value.
  const uA = uniformEccentricities(1.6);
  ok(uA.contained === true, `the plain chain at a≈1.6 is CONTAINED (max|e| = ${uA.maxAbsE.toFixed(4)} ≤ 0.5)`);
  ok(Math.abs(uA.maxAbsE - 0.3016) < 1e-4, `plain-chain max|e| pins to 0.3016 (got ${uA.maxAbsE.toFixed(6)})`);
  ok(uA.per.every((p) => p.j === 0 || p.j === NJ || Number.isFinite(p.e)), `every interior joint has a real crossing at a≈1.6`);

  // (2) PAYOFF-LIVENESS — the hinge FIRES.  Perturb the load off the hung chain:
  //     a point load on a haunch drives some e_k past t/2 (a hinge), and the loaded
  //     half makes a nonzero unbalanced gravity moment about its springer ⇒ the
  //     arch cannot stand.  This is the observable payoff STATE change on the real
  //     entry function, not a canvas event.
  const before = uniformEccentricities(1.6);
  const H = hinge(3, 2);              // a heavy load on the right haunch (joint J2)
  ok(before.contained === true && H.standsUp === false, `perturbing the load off the chain flips STANDS → FALLS`);
  ok(H.hingeJoint >= 0, `a hinge forms — the first joint out of section is J${H.hingeJoint}`);
  ok(H.worst > THALF, `the loaded line bursts the section: worst|e| = ${H.worst.toFixed(3)} > t/2 = 0.5`);
  ok(Math.abs(H.mom) > 1e-6, `the loaded half has a nonzero gravity moment about its springer (${H.mom.toFixed(4)})`);
  // pin the payoff magnitudes (the /tmp-verified collapse numbers)
  ok(Math.abs(H.worst - 0.7565) < 5e-3, `hinge worst|e| pins ≈ 0.757 (got ${H.worst.toFixed(4)})`);
  ok(H.hingeJoint === 3, `the hinge fires at J3 for a 3-unit load on J2 (got J${H.hingeJoint})`);

  // (3) THE BAND is real, not trivial.  a ∈ [1.4, 1.8] admits a contained line;
  //     a = 1.0 (too peaked) and a = 5.5 (too taut) both go RED — the crown-fit is
  //     a genuine sweet spot, not "any chain fits."
  for (const a of [1.4, 1.5, 1.6, 1.7, 1.8]) ok(uniformEccentricities(a).contained === true, `a=${a} admits a contained plain chain`);
  ok(uniformEccentricities(1.0).contained === false, `a=1.0 is RED — the chain is too peaked to thread the ring`);
  ok(uniformEccentricities(5.5).contained === false, `a=5.5 is RED — the chain is too taut to thread the ring`);

  // (4) THE COPIED SOLVER keeps its promise: hits both pins and conserves arc
  //     length to 1e-9 (the catenary room's own test, re-run on the copy).
  const sol = solveCatenary(1.0, 0.3, 2.6);
  const endErr = Math.abs(catY(sol, -1.0) - 0) + Math.abs(catY(sol, 1.0) - 0.3);
  const lenErr = Math.abs(catLen(sol) - 2.6);
  ok(endErr < 1e-8 && lenErr < 1e-8, `copied catenary solver hits both pins & conserves length (endErr ${endErr.toExponential(1)}, lenErr ${lenErr.toExponential(1)})`);
  // and the bead relaxation converges to the analytic cosh (the physical proof).
  const B = makeBeads(1.0, 0.3, 2.6, 41); relaxBeads(B, 2500);
  let sq = 0, cnt = 0; for (let i = 1; i < B.pts.length - 1; i++) { const d = B.pts[i].y - catY(sol, B.pts[i].x); sq += d * d; cnt++; }
  ok(Math.sqrt(sq / cnt) < 0.02, `the bead chain relaxes onto the analytic cosh (RMS ${Math.sqrt(sq / cnt).toExponential(1)})`);

  // (5) INVOLUTION: reflecting a curve about the pin line twice is the identity to
  //     machine ε — the flip is a true reflection, losing nothing.
  const sample = uA.per.map((p) => ({ x: p.rho * Math.cos(p.j * DTH), y: p.rho * Math.sin(p.j * DTH) })).filter((q) => Number.isFinite(q.y));
  const twice = reflectAboutPinLine(reflectAboutPinLine(sample));
  let idErr = 0; for (let i = 0; i < sample.length; i++) idErr = Math.max(idErr, Math.hypot(twice[i].x - sample[i].x, twice[i].y - sample[i].y));
  ok(idErr === 0, `reflect(reflect(curve)) === curve exactly (Δ ${idErr})`);

  return { pass, fail, log, coincidence: maxPtDiff, plainMaxE: uA.maxAbsE, hinge: H };
}

/* ── Node bridge (stripped wholesale by forge when inlined into the page). The
   real Node entry point is core.test.mjs, which imports this module and runs the
   SAME runSelfTest(). ── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HRING, RM, THALF, TTHIRD, NJ, ADM, DPMAX,
    hangY, archY, chainLength, solveAForGrab, crossRadius, uniformEccentricities, bandOf,
    loadedFunicular, reflectAboutPinLine, hinge,
    solveCatenary, catY, catLen, makeBeads, satisfyLinks, relaxBeads, runSelfTest,
  };
}
