// ============================================================================
//  THE PANTOGRAPH THAT KEEPS ITS SHAPE — logic core (a Scheiner pantograph: a
//  rigid four-bar parallelogram linkage that COPIES a hand-traced figure at a
//  dialed scale s. You drag the tracer T over a master; the pen P lays a copy
//  enlarged (or shrunk) by exactly s — and the copy is FAITHFUL to machine-ε
//  because the four bars hold an open parallelogram, never collapsing to a stick.
//  The fourth brass drawing-engine of the estate, kin to The Straightedge
//  (linkage, exact line), The Trammel (ellipse), The Spirograph (rosette).
//  Pure, DOM-free, zero-dependency. The SOLE pantograph authority.
//
//  THE ESTATE-CORRECTION. The Straightedge's SPEC (linkage/SPEC.md, "What shipped
//  and what didn't") DROPPED a pantograph, reasoning its exact-affine claim
//  (pen = O + s·(input − O)) was only achievable as the degenerate collinear
//  proportional-rod — "a straight stick on screen" — so a visually-faithful free-
//  roaming PARALLELOGRAM whose rigid bars also hold length was thought impossible.
//  That conflated two SEPARATE facts: (1) the COLLINEARITY THEOREM — O, T, P lie
//  on one line — and (2) the open-parallelogram FORM. A real Scheiner four-bar
//  keeps ALL FOUR bars at non-zero extent (the parallelogram stays OPEN forever,
//  apex height ≥ 1.66 here), and YET, SOLVED from the dragged tracer, P obeys the
//  exact affine map P = O + s·(T − O) to machine-ε. The exactness lives in the
//  PARALLELOGRAM (equal-direction bars of scaled length), not in any stick. Here
//  it is, drawn by hand.
//
//  THE ONE IDEA — the RR-SOLVE (input is the HAND, output is derived). A fixed
//  brass fulcrum O is bolted to the table. The hand drives tracer T. Joint A is
//  the apex where the long bar |OA| = p meets the cross bar |TA| = q:
//
//        A  =  circle(O, p) ∩ circle(T, q),   open-parallelogram branch.
//
//  A fixed elbow-sign (+1) selects the open branch so the cell never flips. Then
//  the pen bars extend the SAME directions by the scale s:
//
//        B  =  O + s·(A − O)            (|OB| = s·p, parallel to OA)
//        P  =  B + s·(T − A)            (|BP| = s·q, parallel to AT)
//
//  Substitute and the A terms cancel ALGEBRAICALLY:
//
//        P  =  O + s·(A − O) + s·(T − A)  =  O + s·(T − O).
//
//  So P is the exact affine image of T about O at ratio s — a THEOREM of the
//  linkage, derived from the rigid solve, NOT assigned. Collinearity of O, T, P
//  (area(O,T,P) = 0) and |OP| / |OT| = s are CONSEQUENCES, witnessed here against
//  an INDEPENDENT affine oracle computed straight from O + s·(T − O).
//
//  THE FOUR BARS (rigid, always): OA = p, TA = q, OB = s·p, BP = s·q. The cell
//  O–A–?–T closes; B and P ride the scaled rays. The OPEN form is guaranteed by
//  clamping T to the reachable annulus [|p − q|, p + q] about O, so a hand that
//  drags out of reach clamps to the boundary — never a NaN, never a branch-flip.
//
//  THE DETUNE KNOB (the falsifiable neg-control, in the HAND not a test file). A
//  GENUINE bar-length factor f perturbs the ONE short pen bar B→P:
//
//        P  =  B + f·s·(T − A).
//
//  At f = 1 the parallelogram is true: collinearity + ratio clean to < 1e-12. At
//  ANY f ≠ 1 the bar is the wrong length, the parallelogram shears OPEN, the taut
//  ruled line through O, T, P BOWS, the copy peels off the affine oracle, and
//  area(O,T,P) climbs off zero (f = 1.03 → area 0.137, shear 0.120; f = 0.95 →
//  0.229, 0.200 — both directions, both ≫ 1e-2). The area is NOT faked: a real
//  bar length is wrong, and exactness provably DIES.
//
//  THE INVERSE MAP (T ↔ P swap). Swapping tracer and pen sends s → 1/s; the SAME
//  machine runs the inverse affine map and round-trips T back to itself to < 1e-12.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the block
//  between the PANTOGRAPH CORE sentinels byte-for-byte; the twin byte-parity-checks
//  the inlined copy so the rendered mechanism can never drift from the proof.
// ============================================================================

// ===== PANTOGRAPH CORE (byte-identical to core.mjs) =====
"use strict";

const ELBOW = 1;          // the fixed open-parallelogram branch sign (never flips)
const EPS_DETUNE = 1e-2;  // a detuned (f≠1) figure must miss collinearity by MORE than this

// ── tiny 2-vector helpers (plain objects, no class — the renderer reads {x,y}) ──
function vsub(a, b){ return { x: a.x - b.x, y: a.y - b.y }; }
function vadd(a, b){ return { x: a.x + b.x, y: a.y + b.y }; }
function vscale(a, k){ return { x: a.x * k, y: a.y * k }; }
function vlen(a){ return Math.hypot(a.x, a.y); }
function vcross(a, b){ return a.x * b.y - a.y * b.x; }   // z of a×b
function vdist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }

// ── CLAMP the tracer to the reachable annulus [|p−q|, p+q] about O. A hand that
// drags out of reach lands on the boundary radius along the SAME direction — the
// linkage stays solvable (no NaN), the elbow sign cannot flip. Returns the
// effective tracer the mechanism actually follows. ──
function clampTracer(O, T, p, q){
  const d = vsub(T, O);
  const dd = vlen(d);
  const lo = Math.abs(p - q), hi = p + q;
  if (dd === 0){ return { x: O.x + lo, y: O.y }; }   // degenerate: sit on the inner ring
  if (dd >= lo && dd <= hi) return { x: T.x, y: T.y };
  const r = dd < lo ? lo : hi;
  return { x: O.x + d.x / dd * r, y: O.y + d.y / dd * r };
}

// ── JOINT A — the RR (revolute–revolute) intersection of circle(O,p) and
// circle(T,q), picking the open-parallelogram branch by the fixed elbow sign.
// Closed form (circle–circle): along O→T at distance a sits the chord foot; the
// apex is ±h off it on the perpendicular. NO iteration. T is assumed already
// clamped to the annulus so h² ≥ 0. ──
function jointA(O, T, p, q, elbow){
  const d = vsub(T, O);
  const dd = vlen(d);
  const ux = d.x / dd, uy = d.y / dd;          // unit O→T
  const a = (p * p - q * q + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, p * p - a * a));
  const fx = O.x + ux * a, fy = O.y + uy * a;   // chord foot
  // perpendicular to O→T is (−uy, ux); elbow sign picks the branch
  return { x: fx - uy * elbow * h, y: fy + ux * elbow * h };
}

// ── the INDEPENDENT affine oracle: where an ideal scaled copy of T lands,
// computed straight from the map P = O + s·(T − O) — NOT from the rigid solve.
// The page draws this as the faint GHOST under the live ink, so the copy-vs-ideal
// comparison on stage is genuine (two different computations), not a tautology. ──
function affineOracle(O, T, s){
  return { x: O.x + s * (T.x - O.x), y: O.y + s * (T.y - O.y) };
}

// ── SOLVE — the full station the renderer draws from in ONE call. Input is the
// HAND (tracer Traw); everything else is DERIVED. f is the detune factor on the
// short pen bar B→P (f=1 ⇒ true parallelogram). Returns every joint, the four
// bar lengths, the collinearity area, the apex height (open-ness), and the affine
// error |P − oracle|. ──
function solve(O, Traw, p, q, s, elbow, f = 1){
  const T = clampTracer(O, Traw, p, q);
  const A = jointA(O, T, p, q, elbow);
  const B = vadd(O, vscale(vsub(A, O), s));        // |OB| = s·|OA| = s·p, ∥ OA
  const P = vadd(B, vscale(vsub(T, A), f * s));    // |BP| = f·s·|TA| = f·s·q, ∥ AT (f=1: true)
  // collinearity: twice the signed area of triangle O,T,P (=0 iff collinear)
  const area = 0.5 * Math.abs(vcross(vsub(T, O), vsub(P, O)));
  // apex height: distance of A off the line O→T (the open-parallelogram floor)
  const OT = vsub(T, O), lOT = vlen(OT);
  const heightA = lOT === 0 ? 0 : Math.abs(vcross(OT, vsub(A, O))) / lOT;
  // affine error against the independent oracle
  const orc = affineOracle(O, T, s);
  const affErr = vdist(P, orc);
  // the ratio |OP| / |OT| (≡ s at f=1)
  const ratio = lOT === 0 ? 0 : vdist(O, P) / lOT;
  const barLengths = { OA: vdist(O, A), TA: vdist(T, A), OB: vdist(O, B), BP: vdist(B, P) };
  return { O, T, A, B, P, area, heightA, affErr, ratio, oracle: orc, barLengths, clamped: (T.x !== Traw.x || T.y !== Traw.y) };
}

// ── the DEFAULT rig + master. p=2.4, q=2.0, s=2.0; the master is a 5-point star
// centred at (1.7, 0.15) of base radius 0.7 — verified to sit inside the annulus
// [0.4, 4.4] about O with margin (T∈[0.97, 2.61]) so a continuous trace keeps ONE
// elbow sign and the apex height never falls below 1.66 (observed min 1.749). ──
const RIG = { O: { x: 0, y: 0 }, p: 2.4, q: 2.0, s: 2.0, elbow: ELBOW };
const MASTER = { cx: 1.7, cy: 0.15, R: 0.7, wob: 0.30, lobes: 5 };

// the master figure as a closed point list (a 5-point star drawn by a wobbling
// radius). Param u∈[0,1] → a point on the engraved master, the path the hand
// would trace. Deterministic; the renderer samples this for the engraving + the
// auto-trace gesture under reduced motion.
function masterPoint(u, m = MASTER){
  const th = 2 * Math.PI * u;
  const rr = m.R * (1 + m.wob * Math.cos(m.lobes * th));
  return { x: m.cx + rr * Math.cos(th), y: m.cy + rr * Math.sin(th) };
}
function masterPath(n = 240, m = MASTER){
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(masterPoint(i / n, m));
  return pts;
}

// the swap: tracer ↔ pen sends s → 1/s. Same bars, same fulcrum; the machine runs
// the inverse affine map. (We expose the ratio transform; the page re-roles which
// joint the hand holds and recomputes ink/ghost from the same solve.)
function swapRatio(s){ return 1 / s; }

// ── a small deterministic PRNG (LCG, same constants as the trammel) so random
// sweeps are reproducible. ──
function makeRng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ── a stable joint fingerprint (determinism / skin-invariance witness). Rounds
// each joint coordinate to 1e-9 and concatenates — same inputs ⇒ same string.
// The core has NO skin parameter, so geometry is identical across skins. ──
function fingerprint(O, T, p, q, s, elbow, f = 1){
  const r = solve(O, T, p, q, s, elbow, f);
  const q9 = v => Math.round(v * 1e9) / 1e9;
  return [r.A, r.B, r.P].map(pt => q9(pt.x) + ',' + q9(pt.y)).join('|');
}

// ── the self-test: prove the claims numerically, EACH split, at the HONEST
// tolerance (two-tolerance discipline). ──────────────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const { O, p, q, s, elbow } = RIG;

  // a heavy master sweep (the figure the hand traces) + random draws in the annulus
  function sweepT(cb){
    const N = 4000;
    for (let i = 0; i <= N; i++) cb(masterPoint(i / N));
    // random draws strictly inside the annulus (already-reachable points)
    const rng = makeRng(0x5CE1);
    for (let i = 0; i < 1200; i++){
      const ang = rng() * 2 * Math.PI;
      const rad = (Math.abs(p - q) + 0.2) + rng() * ((p + q - 0.2) - (Math.abs(p - q) + 0.2));
      cb({ x: O.x + rad * Math.cos(ang), y: O.y + rad * Math.sin(ang) });
    }
  }

  // (1) COLLINEARITY — area(O,T,P) < 1e-12 across the whole sweep, from the
  // closed-form RR-solve (NO iteration; P is DERIVED, not P:=O+s(T−O)). The strong
  // form: collinearity is a CONSEQUENCE of the rigid parallelogram.
  {
    let maxArea = 0;
    sweepT(T => { maxArea = Math.max(maxArea, solve(O, T, p, q, s, elbow, 1).area); });
    ck('1 · COLLINEARITY area(O,T,P) < 1e-12 over the master sweep (closed-form RR-solve, P DERIVED)',
       maxArea < 1e-12, 'maxArea=' + maxArea.toExponential(2));
  }

  // (2) RATIO + LOCUS — |OP|/|OT| ≡ s AND P == the INDEPENDENT affine oracle to
  // <1e-12; the inverse map (s→1/s) round-trips T to <1e-12.
  {
    let maxRatioErr = 0, maxAff = 0, maxRound = 0;
    sweepT(T => {
      const r = solve(O, T, p, q, s, elbow, 1);
      maxRatioErr = Math.max(maxRatioErr, Math.abs(r.ratio - s));
      maxAff = Math.max(maxAff, r.affErr);
      // inverse: pen P becomes the new tracer at ratio 1/s about O ⇒ lands back on T
      const inv = solve(O, r.P, s * p, s * q, swapRatio(s), elbow, 1);
      maxRound = Math.max(maxRound, vdist(inv.P, r.T));
    });
    ck('2 · RATIO+LOCUS |OP|/|OT|≡s AND P==affine-oracle <1e-12 AND inverse round-trips T <1e-12',
       maxRatioErr < 1e-12 && maxAff < 1e-12 && maxRound < 1e-12,
       'ratioErr=' + maxRatioErr.toExponential(2) + ' aff=' + maxAff.toExponential(2) + ' round=' + maxRound.toExponential(2));
  }

  // (3) RIGID 4-BAR + NON-DEGENERACY — all four bar lengths (p, q, s·p, s·q) hold
  // to machine-ε EVERYWHERE in the reachable annulus (the full sweep), AND over the
  // MASTER FIGURE the hand actually traces the open-parallelogram apex height stays
  // > a floor (a REAL parallelogram, NOT a stick). The apex floor is a property of
  // the master path (the designed default rig sits the whole figure well off both
  // annulus rings); near the bare annulus boundary the cell naturally squashes,
  // which is exactly why the tracer is clamped onto a master that never goes there.
  {
    let maxBarErr = 0;
    sweepT(T => {
      const r = solve(O, T, p, q, s, elbow, 1);
      maxBarErr = Math.max(maxBarErr,
        Math.abs(r.barLengths.OA - p), Math.abs(r.barLengths.TA - q),
        Math.abs(r.barLengths.OB - s * p), Math.abs(r.barLengths.BP - s * q));
    });
    let minH = Infinity;
    const MN = 6000;
    for (let i = 0; i <= MN; i++) minH = Math.min(minH, solve(O, masterPoint(i / MN), p, q, s, elbow, 1).heightA);
    ck('3 · RIGID 4-BAR bars {p,q,s·p,s·q} hold to machine-ε (full annulus) AND master-figure apex height > 1.66 (open, not a stick)',
       maxBarErr < 1e-9 && minH > 1.66,
       'maxBarErr=' + maxBarErr.toExponential(2) + ' minMasterApexHeight=' + minH.toFixed(3));
  }

  // (4) NEG-CONTROL (load-bearing, FALSIFIABLE = the detune knob) — at f=1
  // collinearity+ratio clean <1e-12; EVERY f≠1 (BOTH directions) makes |area| >
  // 1e-2 AND the copy shear from the affine oracle > 1e-2. Honest bar-length
  // perturbation (the WRONG short bar), never a faked area.
  {
    let f1Area = 0, f1Aff = 0;
    sweepT(T => {
      const r = solve(O, T, p, q, s, elbow, 1);
      f1Area = Math.max(f1Area, r.area); f1Aff = Math.max(f1Aff, r.affErr);
    });
    let allFail = true, worstArea = Infinity, worstShear = Infinity;
    for (const f of [1.03, 0.95, 1.06, 0.9]){
      let mxArea = 0, mxShear = 0;
      sweepT(T => {
        const r = solve(O, T, p, q, s, elbow, f);
        mxArea = Math.max(mxArea, r.area); mxShear = Math.max(mxShear, r.affErr);
      });
      if (!(mxArea > EPS_DETUNE && mxShear > EPS_DETUNE)) allFail = false;
      worstArea = Math.min(worstArea, mxArea); worstShear = Math.min(worstShear, mxShear);
    }
    ck('4 · NEG-CONTROL detune: f=1 clean (<1e-12) BUT every f≠1 bows area >1e-2 AND shears copy >1e-2',
       f1Area < 1e-12 && f1Aff < 1e-12 && allFail,
       'f1 area=' + f1Area.toExponential(2) + ' · min detuned area=' + worstArea.toFixed(3) + ' shear=' + worstShear.toFixed(3));
  }

  // (5) DETERMINISM / SKIN-INVARIANCE — same (O,T,p,q,s,elbow,f) → byte-identical
  // joint fingerprint; the core has NO skin parameter so geometry is skin-blind.
  {
    let ok = true;
    const probes = [masterPoint(0.13), masterPoint(0.51), masterPoint(0.87), { x: 1.9, y: -0.4 }];
    for (const T of probes){
      const a = fingerprint(O, T, p, q, s, elbow, 1);
      const b = fingerprint(O, T, p, q, s, elbow, 1);
      if (a !== b) ok = false;
    }
    // CLAMP safety: a far-out drag never NaNs (lands on the annulus boundary)
    let nanFree = true;
    const far = solve(O, { x: 99, y: 40 }, p, q, s, elbow, 1);
    for (const v of [far.A.x, far.A.y, far.B.x, far.B.y, far.P.x, far.P.y]) if (!isFinite(v)) nanFree = false;
    ck('5 · DETERMINISM: identical inputs ⇒ byte-identical joint fingerprint AND far drag clamps NaN-free',
       ok && nanFree && far.clamped, 'stable=' + ok + ' clampedNaNfree=' + (nanFree && far.clamped));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END PANTOGRAPH CORE =====

export {
  ELBOW, EPS_DETUNE, RIG, MASTER,
  vsub, vadd, vscale, vlen, vcross, vdist,
  clampTracer, jointA, affineOracle, solve,
  masterPoint, masterPath, swapRatio, makeRng, fingerprint, runSelfTest,
};
