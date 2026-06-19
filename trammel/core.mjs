// ============================================================================
//  THE TRAMMEL OF ARCHIMEDES — logic core (the ellipsograph: two perpendicular
//  slots, one rigid rod, two captive pins. A pen fixed at a station on the rod
//  is FORCED to trace a perfect ellipse — not plotted point-by-point, COMPUTED
//  by a mechanical constraint. The third brass drawing-engine, kin to The
//  Spirograph (gears) and The Planimeter (a rolling wheel). Pure, zero-dep.
//
//  THE ONE IDEA. Pin A rides the X-slot (the line y=0); pin B rides the Y-slot
//  (the line x=0). The two pins are joined by a rigid rod of length L. As the
//  rod sweeps an angle θ, pin A sits at (L·cosθ, 0) and pin B at (0, L·sinθ).
//  A pen rigidly fixed at station d measured FROM pin A along the rod sits at
//
//        pen(θ) = ( (L−d)·cosθ ,  d·sinθ ).
//
//  Eliminate θ (cos²+sin²=1) and the pen obeys, for ALL θ, the EXACT identity
//
//        x² / a²  +  y² / b²  =  1 ,   a = |L−d| (on X),  b = |d| (on Y).
//
//  The ellipse is a THEOREM of the linkage, not a fit. d=0 ⇒ b=0, a pure
//  horizontal LINE; d=L ⇒ a=0, a pure vertical LINE; d=L/2 ⇒ a=b, a CIRCLE;
//  everything between is an ellipse. Drag the pen station and the figure morphs
//  line → ellipse → circle → ellipse → line, all from this one closed form.
//
//  WHERE THE PERPENDICULARITY LIVES. The clean a-on-X / b-on-Y ellipse needs the
//  two slots to be PERPENDICULAR. tracedTilted() is the general φ-slot form used
//  ONLY by the negative control: tilt the Y-slot off 90° and the traced figure
//  is still a (rotated, sheared) ellipse, but it is NO LONGER the axis-aligned
//  x²/a²+y²/b²=1 — that naive fit blows past a 1e-6 tolerance. So the predicate
//  is FALSIFIABLE: it holds iff the slots are square, and the page lets you
//  break it and watch the trail peel off the dashed ghost.
//
//  TWO INDEPENDENT WITNESSES. The on-ellipse residual (the algebraic predicate)
//  and the focal-string residual (|P−f₁|+|P−f₂| = 2·max(a,b), the gardener's
//  string) are computed by DIFFERENT methods; both vanish to <1e-12 over a full
//  sweep, so their agreement is a genuine proof, not a tautology.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the block
//  between the TRAMMEL CORE sentinels byte-for-byte; the twin byte-parity-checks
//  the inlined copy so the rendered mechanism can never drift from the proof.
// ============================================================================

// ===== TRAMMEL CORE (byte-identical to core.mjs) =====
"use strict";

const PERP = Math.PI / 2;     // the square-slot angle: the predicate holds iff φ===PERP
const EPS_TILT = 1e-6;        // a tilted-slot figure must miss the axis-aligned fit by MORE than this

// ── the traced point — THE closed form the page animates (no trig on a slot
// angle; the exact mechanical position). pen = ((L−d)·cosθ, d·sinθ). This is
// why the LINE degeneracy is a HARD ===0: at d=0 the y-term is 0·sinθ===0 for
// every θ, and at d=L the x-term is 0·cosθ===0. ──
function tracedPoint(L, d, t){
  return { x: (L - d) * Math.cos(t), y: d * Math.sin(t) };
}

// ── the GENERAL tilted-slot form (NEG-CONTROL ONLY). The X-slot stays on y=0;
// the Y-slot is rotated to make angle φ with the X-slot. Pin A rides the X-slot
// at A=(α,0); pin B rides the tilted line at B=β·(cosφ,sinφ); the rod AB has
// length L; the pen sits at station d along A→B. Solving |AB|=L with B on the
// tilted ray gives β = L·sinθ/sinφ and α = L·cosθ + β·cosφ. At φ===PERP this
// agrees with tracedPoint to ~3.5e-16 (cosmetic), but the page animates
// tracedPoint so the LINE test is exact. ──
function tracedTilted(L, d, t, phi){
  const beta = L * Math.sin(t) / Math.sin(phi);
  const alpha = L * Math.cos(t) + beta * Math.cos(phi);
  const A = { x: alpha, y: 0 };
  const B = { x: beta * Math.cos(phi), y: beta * Math.sin(phi) };
  return { x: A.x + (d / L) * (B.x - A.x), y: A.y + (d / L) * (B.y - A.y) };
}

// ── semi-axes: SINGLE source. a = pen→far-pin distance on the X-axis;
// b = pen→near-pin distance on the Y-axis. ──
function semiAxes(L, d){
  return { a: Math.abs(L - d), b: Math.abs(d) };
}

// ── the full station geometry the renderer draws from in ONE call ──
function station(L, d, t){
  const pen = tracedPoint(L, d, t);
  const pinA = { x: L * Math.cos(t), y: 0 };   // rides the X-slot (the far pin)
  const pinB = { x: 0, y: L * Math.sin(t) };   // rides the Y-slot (the near pin)
  const { a, b } = semiAxes(L, d);
  return { pen, pinA, pinB, a, b, t, L, d };
}

// ── WITNESS-1: the on-ellipse residual (the public predicate). At a degenerate
// detent (a===0 or b===0) the figure is a LINE: the residual is the distance
// off that line (|x| if a===0, |y| if b===0), which is ===0 on the traced point. ──
function ellipseResidual(L, d, x, y){
  const { a, b } = semiAxes(L, d);
  if (a === 0) return Math.abs(x);     // vertical line x=0
  if (b === 0) return Math.abs(y);     // horizontal line y=0
  return x * x / (a * a) + y * y / (b * b) - 1;
}

// ── the foci: c = √|A²−B²| with A=max(a,b), B=min(a,b). The major axis is
// HORIZONTAL when a≥b ⇒ foci on the X-axis (±c,0); VERTICAL otherwise ⇒ (0,±c).
// twoA = 2·max(a,b) is the constant focal-string length. ──
function foci(L, d){
  const { a, b } = semiAxes(L, d);
  const A = Math.max(a, b), B = Math.min(a, b);
  const c = Math.sqrt(Math.abs(A * A - B * B));
  const horiz = a >= b;
  return {
    f1: horiz ? { x: -c, y: 0 } : { x: 0, y: -c },
    f2: horiz ? { x:  c, y: 0 } : { x: 0, y:  c },
    c, twoA: 2 * A
  };
}

// ── WITNESS-2: the focal-string residual (an INDEPENDENT oracle — the
// gardener's-string definition). |P−f₁| + |P−f₂| − 2·max(a,b) === 0 on the
// ellipse. (Undefined as a constant for the line detents, where foci coincide
// with the endpoints; the test only applies it to true ellipses.) ──
function focalResidual(L, d, x, y){
  const { f1, f2, twoA } = foci(L, d);
  const d1 = Math.hypot(x - f1.x, y - f1.y);
  const d2 = Math.hypot(x - f2.x, y - f2.y);
  return d1 + d2 - twoA;
}

// ── a small deterministic PRNG (LCG, same constants as parallax-baseline) so
// random sweeps are reproducible. ──
function makeRng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ── the self-test: prove the claims numerically (two-tolerance discipline) ───
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const PAIRS = [[3,1],[3,1.5],[3,0.4],[5,2.5],[2,0.2],[6,4]];

  // (1) WITNESS-1 on-ellipse, TIGHT: every traced point satisfies the predicate.
  // (2) WITNESS-2 focal-string, TIGHT: independent oracle, same sweep.
  // (3) WITNESSES AGREE: BOTH < 1e-12 at every sample simultaneously.
  {
    let maxEll = 0, maxFoc = 0, bothOK = true;
    const rng = makeRng(0x7A11);
    for (const [L, d] of PAIRS){
      for (let i = 0; i <= 2000; i++){
        const t = 2 * Math.PI * i / 2000;
        const p = tracedPoint(L, d, t);
        const re = Math.abs(ellipseResidual(L, d, p.x, p.y));
        maxEll = Math.max(maxEll, re);
        let rf = 0;
        if (d !== 0 && d !== L){ rf = Math.abs(focalResidual(L, d, p.x, p.y)); maxFoc = Math.max(maxFoc, rf); }
        if (!(re < 1e-12 && rf < 1e-12)) bothOK = false;
      }
      // random θ draws too (not just the uniform grid)
      for (let i = 0; i < 400; i++){
        const t = rng() * 2 * Math.PI;
        const p = tracedPoint(L, d, t);
        const re = Math.abs(ellipseResidual(L, d, p.x, p.y));
        maxEll = Math.max(maxEll, re);
        if (d !== 0 && d !== L) maxFoc = Math.max(maxFoc, Math.abs(focalResidual(L, d, p.x, p.y)));
      }
    }
    ck('1 · WITNESS-1 on-ellipse residual < 1e-12 over full (L,d)×θ sweep + random draws',
       maxEll < 1e-12, 'maxEll=' + maxEll.toExponential(2));
    ck('2 · WITNESS-2 focal-string residual < 1e-12 (independent oracle, |P−f₁|+|P−f₂|=2·max(a,b))',
       maxFoc < 1e-12, 'maxFoc=' + maxFoc.toExponential(2));
    ck('3 · WITNESSES AGREE: both < 1e-12 simultaneously at every sample',
       bothOK, 'bothOK=' + bothOK);
  }

  // (4) CIRCLE: d===L/2 ⇒ a===b exactly and c===0 (foci coincide).
  {
    let ok = true;
    for (const L of [2, 3, 4, 5, 6]){
      const { a, b } = semiAxes(L, L / 2);
      const f = foci(L, L / 2);
      if (!(a === b && f.c === 0)) ok = false;
    }
    ck('4 · CIRCLE d=L/2 ⇒ a===b (exact) AND c===0 (foci coincide)', ok, 'exact=' + ok);
  }

  // (5) LINE EXACT via tracedPoint: d===0 ⇒ y===0 ∀θ; d===L ⇒ x===0 ∀θ (HARD 0,
  // not <ε). MUST use tracedPoint (the exact closed form), not tracedTilted@PERP.
  {
    let hardH = true, hardV = true;
    for (let i = 0; i <= 1500; i++){
      const t = 2 * Math.PI * i / 1500;
      if (tracedPoint(5, 0, t).y !== 0) hardH = false;   // d=0 → horizontal line
      if (tracedPoint(5, 5, t).x !== 0) hardV = false;   // d=L → vertical line
    }
    ck('5 · LINE exact via tracedPoint: d=0 ⇒ y===0 ∀θ, d=L ⇒ x===0 ∀θ (hard 0, not <ε)',
       hardH && hardV, 'd=0 y===0:' + hardH + ' d=L x===0:' + hardV);
  }

  // (6) NEG-CONTROL TILT (load-bearing & FALSIFIABLE): tracedTilted at φ===PERP
  // still satisfies the axis-aligned fit (< 1e-12); for φ ≠ PERP it must FAIL
  // (residual > 1e-6). Assert BOTH directions.
  {
    let perpOK = 0;
    for (let i = 1; i <= 600; i++){
      const t = 2 * Math.PI * i / 600;
      const p = tracedTilted(3, 1, t, PERP);
      perpOK = Math.max(perpOK, Math.abs(ellipseResidual(3, 1, p.x, p.y)));
    }
    let allTiltFail = true, worstTilt = Infinity;
    for (const phi of [PERP + 0.2, Math.PI / 3, 1.2, PERP - 0.15]){
      let mx = 0;
      for (let i = 1; i <= 600; i++){
        const t = 2 * Math.PI * i / 600;
        const p = tracedTilted(3, 1, t, phi);
        mx = Math.max(mx, Math.abs(ellipseResidual(3, 1, p.x, p.y)));
      }
      if (!(mx > EPS_TILT)) allTiltFail = false;
      worstTilt = Math.min(worstTilt, mx);
    }
    ck('6 · NEG-CONTROL: φ=PERP fits axis-aligned (<1e-12) BUT every tilted φ FAILS it (>1e-6)',
       perpOK < 1e-12 && allTiltFail,
       'perp=' + perpOK.toExponential(2) + ' min tilted resid=' + worstTilt.toExponential(2));
  }

  // (7) MONOTONE morph: as d:0→L/2, b grows 0→L/2, a shrinks L→L/2, and the
  // eccentricity strictly decreases (the morph is geometry, not a lookup table).
  {
    const L = 4;
    let monoB = true, monoA = true, monoE = true;
    let prevB = -Infinity, prevA = Infinity, prevE = Infinity;
    for (let k = 0; k <= 80; k++){
      const d = (L / 2) * k / 80;
      const { a, b } = semiAxes(L, d);
      const A = Math.max(a, b), B = Math.min(a, b);
      const e = Math.sqrt(1 - (B * B) / (A * A));
      if (!(b >= prevB)) monoB = false;
      if (!(a <= prevA)) monoA = false;
      if (k > 0 && !(e < prevE)) monoE = false;
      prevB = b; prevA = a; prevE = e;
    }
    ck('7 · MONOTONE morph d:0→L/2 — b grows, a shrinks, eccentricity strictly ↓ (geometry, not a table)',
       monoB && monoA && monoE, 'b↑=' + monoB + ' a↓=' + monoA + ' e↓=' + monoE);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END TRAMMEL CORE =====

export {
  PERP, EPS_TILT,
  tracedPoint, tracedTilted, semiAxes, station,
  ellipseResidual, foci, focalResidual, makeRng, runSelfTest,
};
