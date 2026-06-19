// The Micrometer Interferometer — logic core (halves of a wavelength you can count).
//
// THE WHOLE POINT: a Michelson interferometer splits one beam in two, sends each down an
// arm to a mirror, and recombines them. Move one mirror a distance Δd and that arm's light
// travels the EXTRA distance TWICE — out to the mirror and back — so the optical path
// difference between the arms is δ = ROUND_TRIP·Δd = 2·Δd. The recombined beam brightens and
// dims as δ sweeps through whole wavelengths; on a screen this is a set of concentric
// bullseye fringes, born/swallowed at the center as you turn the knob. Count N rings cross
// the center while you move the mirror by Δd, and you have MEASURED the wavelength:
//
//     δ = N·λ   and   δ = ROUND_TRIP·Δd = 2·Δd   ⇒   Δd = N·λ/2   ⇒   λ = 2·Δd/N.
//
// The page renders the actual instrument — source, beamsplitter, two arms, a sliding
// carriage, a live ring-pattern on the screen — and the rings ARE the readout. You never
// read a wavelength off a plotted curve; you turn a knob and watch the rings count it out.
//
// WHY THE FACTOR OF 2 IS THE SOUL:
//   ROUND_TRIP = 2 because the moving arm is traversed TWICE per round of the beam. Forget it
//   and you "recover" λ/2 — you undercount the wavelength by exactly a factor of two. That is
//   the single most common mistake with a Michelson, so it is the load-bearing negative
//   control here: recoverLambdaNaive uses ROUND_TRIP→1 and is wrong by ×2, by the bit.
//
// THE CLAIM THIS CORE PROVES (exact, not a fit):
//   (a) λ = 2·Δd/N to < 1e-9 across λ ∈ {400,500,532,633,700} nm, with Δd = N·λ/2, N=1000;
//   (b) NEG-CONTROL — the naive law (forgetting the round trip) recovers exactly λ/2, so
//       λ/naive === ROUND_TRIP === 2 to the bit, and |naive − λ| ≥ λ/2 so leg A rejects it;
//   (c) NEG-CONTROL — a DEAD screen (zero coherence) reports N=0 for any Δd and so can never
//       fake a wavelength: a flat detector disagrees with the live fringe count;
//   (d) the on-axis intensity is exactly the two-beam law I = (I0/2)(1+cos(2πδ/λ)), with
//       bright at δ = mλ and dark at δ = (m+½)λ;
//   (e) the ring law: ringAngle(centerOrder) is the smallest angle, rings grow outward toward
//       LOWER orders, and an order whose cosθ would exceed 1 has no ring (null).
//
// SOURCING (anti-drift, enforced by core.test.mjs): the page inlines this core byte-for-byte
// between the INTERFEROMETER CORE sentinels; core.test.mjs byte-parity-checks the inlined copy
// in index.html against this file's body so the two can never silently drift apart.
//
// Zero-dep ESM. No randomness, no wall-clock — every function is a pure total map on the reals.
// Division is taken LAST in each formula so the bit pattern is reproducible across JS engines.

// ===== INTERFEROMETER CORE (byte-identical to core.mjs) =====
"use strict";

// The round-trip factor: the moving arm is traversed TWICE per round (out to the mirror and
// back), so the path difference it contributes is 2·Δd. This is the SOUL of the instrument —
// the negative control is literally this constant set to 1, undercounting λ by exactly ×2.
const ROUND_TRIP = 2;

// A representative mirror displacement (1 mm) for the ring-geometry defaults below.
const D_REF = 1e-3;

// A representative source wavelength (HeNe red, 633 nm) for the ring-geometry defaults below.
const LAM_REF = 633e-9;

// ── GUARDS ───────────────────────────────────────────────────────────────────────────────
// Named, throwing guards so a non-physical input is a loud RangeError, never a silent NaN fate.
function guardFinite(x, n){
  if (typeof x !== 'number' || !Number.isFinite(x)){
    throw new RangeError(n + ' must be a finite number; got ' + x);
  }
}
function guardPos(x, n){
  guardFinite(x, n);
  if (x <= 0) throw new RangeError(n + ' must be > 0; got ' + x);
}

// ── THE INSTRUMENT'S MATH ──────────────────────────────────────────────────────────────────
// pathDifference(Δd): the optical path difference the moving arm introduces = ROUND_TRIP·Δd.
// The moving arm is traversed twice, so a displacement Δd lengthens the path by 2·Δd.
function pathDifference(dd){
  guardFinite(dd, 'dd');
  return ROUND_TRIP * dd;
}

// onAxisIntensity(δ, λ, I0): the recombined two-beam intensity for path difference δ.
// I = I0·cos²(π·δ/λ) ≡ (I0/2)(1 + cos(2π·δ/λ)). Bright at δ = mλ, dark at δ = (m+½)λ.
function onAxisIntensity(delta, lam, I0 = 1){
  guardFinite(delta, 'delta'); guardPos(lam, 'lam'); guardFinite(I0, 'I0');
  const c = Math.cos(Math.PI * delta / lam);
  return I0 * c * c;
}

// fringeCount(Δd, λ): how many whole fringes have crossed the center as the mirror moved Δd.
// N = δ/λ = ROUND_TRIP·Δd/λ. (Continuous here; the page truncates to an integer ring count.)
function fringeCount(dd, lam){
  guardFinite(dd, 'dd'); guardPos(lam, 'lam');
  return ROUND_TRIP * dd / lam;
}

// recoverLambda(Δd, N): THE CLAIM. Measure λ from a displacement Δd and the rings N it counted.
// λ = 2·Δd/N. This is the SOLE definition of the recovery law in the whole codebase.
function recoverLambda(dd, N){
  guardFinite(dd, 'dd'); guardPos(N, 'N');
  return ROUND_TRIP * dd / N;
}

// recoverLambdaNaive(Δd, N): THE NEGATIVE CONTROL. recoverLambda with the round trip forgotten
// (ROUND_TRIP → 1). It returns Δd/N = λ/2 — wrong by exactly a factor of two. The suite proves
// λ/naive === ROUND_TRIP === 2 to the bit, so leg A rejects it.
function recoverLambdaNaive(dd, N){
  guardFinite(dd, 'dd'); guardPos(N, 'N');
  return 1 * dd / N;
}

// ringAngle(m, d, λ): the angle θ (rad) of the m-th bright ring for path-difference 2d.
// A ray at angle θ has path difference 2·d·cosθ; the m-th bright ring satisfies
// ROUND_TRIP·d·cosθ = m·λ ⇒ cosθ = m·λ/(ROUND_TRIP·d). Returns null when |cosθ| > 1 (no ring).
function ringAngle(m, d = D_REF, lam = LAM_REF){
  guardFinite(m, 'm'); guardPos(d, 'd'); guardPos(lam, 'lam');
  const cos = m * lam / (ROUND_TRIP * d);
  if (cos > 1 || cos < -1) return null;
  return Math.acos(cos);
}

// centerOrder(d, λ): the order m of the (brightest, innermost) ring at the very center (θ=0),
// where cosθ = 1 ⇒ m = ROUND_TRIP·d/λ. Truncated to a whole order. The live counter rides this.
function centerOrder(d = D_REF, lam = LAM_REF){
  guardPos(d, 'd'); guardPos(lam, 'lam');
  return Math.floor(ROUND_TRIP * d / lam);
}

// ringIntensity(rNorm, Δd, λ, focal): the renderer's per-pixel brightness 0..1 at a normalized
// screen radius rNorm ∈ [0,1]. A pixel at radius rNorm maps to a ray angle θ = atan(rNorm·R/focal)
// (we fold R/focal into a fixed spread so the call stays cheap and pure); the path difference for
// that ray is ROUND_TRIP·Δd·cosθ, fed through the SAME two-beam law. Built ON the ring law so
// ROUND_TRIP stays single-sourced. Returns I/I0 ∈ [0,1].
function ringIntensity(rNorm, dd, lam, focal = 1){
  guardFinite(rNorm, 'rNorm'); guardFinite(dd, 'dd'); guardPos(lam, 'lam'); guardPos(focal, 'focal');
  const r = rNorm < 0 ? 0 : rNorm > 1 ? 1 : rNorm;
  // the edge ray's half-angle (its tangent), chosen wide enough that a turn of the knob blooms
  // several concentric rings across the screen disc; R/focal folded into SPREAD. The CENTER
  // (rNorm=0 → θ=0) is unaffected and still equals the on-axis law exactly (leg E pins this).
  const SPREAD = 4;                          // tan of the edge ray's angle (θmax ≈ 76°)
  const theta = Math.atan(r * SPREAD / focal);
  const cos = Math.cos(theta);
  const delta = ROUND_TRIP * dd * cos;
  const c = Math.cos(Math.PI * delta / lam);
  return c * c;                              // I0 = 1
}

// deadFringeCount(Δd): THE NEGATIVE CONTROL screen — zero coherence, no fringes, ever. Returns 0
// for any displacement. A dead detector that counted SOMETHING could fake a wavelength; this one
// can't, and the suite asserts it disagrees with the live fringeCount.
function deadFringeCount(_dd){
  return 0;
}

// ── THE SELF-TEST — the instrument proves its own claim ─────────────────────────────────────
// LEG A: λ = 2·Δd/N to < 1e-9 across λ∈{400,500,532,633,700}nm with Δd = N·λ/2, N=1000 (exact).
// LEG B (load-bearing neg-control): the naive law recovers λ/2 — λ/naive === ROUND_TRIP === 2 to
//        the bit, and |naive − λ| ≥ λ/2 so leg A would reject it. (Forget the round trip → ×2.)
// LEG C (neg-control): a dead screen reports N=0 for any Δd and disagrees with the live count.
// LEG D: the on-axis law equals (I0/2)(1+cos(2πδ/λ)) to < 1e-12; bright/dark anchors land.
// LEG E: ringAngle(centerOrder)≈0, rings grow outward toward lower orders, vanish past cosθ>1;
//        ringIntensity tracks the on-axis law at θ=0 and stays in [0,1].
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });

  // ── LEG A — λ = 2·Δd/N exact across several wavelengths ──
  // The recovered λ is bit-exact (worst error 0); the continuous fringe count rounds to
  // exactly N (it is N to within a floating-point ULP — the integer ring tally the page shows).
  {
    const N = 1000;
    const lams = [400e-9, 500e-9, 532e-9, 633e-9, 700e-9];
    let worst = 0, countOk = true;
    for (const lam of lams){
      const dd = N * lam / ROUND_TRIP;            // Δd = N·λ/2
      const err = Math.abs(recoverLambda(dd, N) - lam);
      if (err > worst) worst = err;
      if (Math.round(fringeCount(dd, lam)) !== N) countOk = false;
    }
    log('A · λ = 2·Δd/N to <1e-9 across 400–700nm  (and round(fringeCount(N·λ/2,λ))===N)',
        worst < 1e-9 && countOk,
        'worst |λ̂−λ| = ' + worst.toExponential(2) + ' m  (N=' + N + ')');
  }

  // ── LEG B — the naive law undercounts by exactly ×2 (the round-trip neg-control) ──
  {
    const N = 1000, lam = LAM_REF;
    const dd = N * lam / ROUND_TRIP;
    const naive = recoverLambdaNaive(dd, N);       // = λ/2
    const real = recoverLambda(dd, N);             // = λ
    const ratioExact = (real / naive) === ROUND_TRIP;    // === 2 to the bit
    const rejected = Math.abs(naive - lam) >= lam / 2 - 1e-9;
    log('B · NEG-CONTROL: naive (no round trip) recovers λ/2 — λ/naive === 2 to the bit, rejected by A',
        ratioExact && rejected,
        'forgetting the round trip undercounts by exactly ×2 · λ/naive=' + (real / naive));
  }

  // ── LEG C — a dead screen counts no fringes and can't fake a wavelength ──
  {
    const dds = [1e-6, 1e-3, 1];
    let dead0 = true, disagrees = true;
    for (const dd of dds){
      if (deadFringeCount(dd) !== 0) dead0 = false;
    }
    const live = fringeCount(D_REF, LAM_REF);
    if (!(live > 0 && deadFringeCount(D_REF) !== live)) disagrees = false;
    log('C · NEG-CONTROL: dead screen N=0 for any Δd, and disagrees with the live count',
        dead0 && disagrees,
        'a flat detector can\'t fake a wavelength · live N=' + live.toFixed(0));
  }

  // ── LEG D — the on-axis law is the two-beam cosine law; bright/dark anchors land ──
  {
    const lam = LAM_REF;
    let worst = 0;
    for (let k = 0; k <= 40; k++){
      const delta = (k / 40) * 5 * lam;            // sweep δ over five wavelengths
      const direct = onAxisIntensity(delta, lam);
      const law = 0.5 * (1 + Math.cos(2 * Math.PI * delta / lam));
      const e = Math.abs(direct - law);
      if (e > worst) worst = e;
    }
    const bright = onAxisIntensity(3 * lam, lam);   // δ = mλ → I = I0
    const dark = onAxisIntensity(3.5 * lam, lam);   // δ = (m+½)λ → I ≈ 0
    log('D · on-axis I ≡ (I0/2)(1+cos 2πδ/λ) to <1e-12; bright(δ=mλ)=1, dark(δ=(m+½)λ)≈0',
        worst < 1e-12 && Math.abs(bright - 1) < 1e-12 && dark < 1e-12,
        'worst Δ=' + worst.toExponential(2) + ' · bright=' + bright.toFixed(6) + ' dark=' + dark.toFixed(6));
  }

  // ── LEG E — ring geometry: innermost order has the smallest angle, rings grow outward ──
  // centerOrder is the highest order with cosθ ≤ 1, so it is the INNERMOST ring (smallest θ);
  // as the order decreases the rings grow outward; once m·λ/(2d) > 1 there is no ring (null).
  {
    const m0 = centerOrder();                       // innermost order (smallest angle)
    const aCenter = ringAngle(m0);
    const aLower = ringAngle(m0 - 1);
    const aLower2 = ringAngle(m0 - 2);
    const grows = aCenter !== null && aLower !== null && aLower2 !== null
               && aCenter < aLower && aLower < aLower2;
    // m0 is the smallest ring angle of all valid orders (m0+1 has no ring — it would need cosθ>1)
    const innermost = ringAngle(m0 + 1) === null && aCenter !== null;
    // a clearly-too-high order has no ring
    const noRing = ringAngle(Math.ceil(ROUND_TRIP * D_REF / LAM_REF) + 5) === null;
    // ringIntensity sanity: at rNorm=0 it equals the on-axis law / I0, and stays in [0,1]
    const ri0 = ringIntensity(0, D_REF, LAM_REF);
    const onAxis0 = onAxisIntensity(ROUND_TRIP * D_REF, LAM_REF);
    const riMatch = Math.abs(ri0 - onAxis0) < 1e-12;
    let inRange = true;
    for (let k = 0; k <= 20; k++){
      const v = ringIntensity(k / 20, D_REF, LAM_REF);
      if (v < 0 || v > 1) inRange = false;
    }
    log('E · ring geometry: innermost order smallest θ, rings grow toward lower orders, vanish past cosθ>1; ringIntensity ⊂ [0,1]',
        grows && innermost && noRing && riMatch && inRange,
        'θ(m0)=' + (aCenter !== null ? aCenter.toFixed(4) : 'null') +
        ' < θ(m0−1) < θ(m0−2); m0+1 has no ring · ringIntensity(0) matches on-axis');
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END INTERFEROMETER CORE =====

export {
  ROUND_TRIP, D_REF, LAM_REF,
  pathDifference, onAxisIntensity, fringeCount,
  recoverLambda, recoverLambdaNaive,
  ringAngle, centerOrder, ringIntensity,
  deadFringeCount, guardFinite, guardPos,
  runSelfTest,
};
