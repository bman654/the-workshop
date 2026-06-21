// ============================================================================
//  THE TRANSIT — logic core (find a planet you never see, by the light it
//  steals). A dark planet of unknown size crosses the face of a glowing star;
//  the only evidence is the tiny dip in the star's brightness while it passes.
//  You hunt the planet's RADIUS — and the depth of the dip hands it to you.
//
//  THE ONE IDEA. Treat the star as a uniform luminous disc of radius R_* and
//  the planet as an opaque disc of radius R_p. While the planet is in front, it
//  blocks exactly the OVERLAP AREA of the two discs. The fractional drop in
//  brightness is that blocked area over the star's area:
//      depth(t) = A_overlap(R_*, R_p, d(t)) / (π R_*²)
//  with d(t) the centre-to-centre separation as the planet slides across. For a
//  FULL transit (the planet entirely inside the disc at mid-passage) the deepest
//  point is the whole planet:  A_overlap = π R_p²,  so
//      ΔF/F = (R_p / R_*)²   EXACTLY.
//  That is the crux: the dip's depth is the SQUARE of the radius ratio. Measure
//  the depth, take its square root, and you have the planet's size — no image of
//  the planet ever needed. The forward map depth = ρ² and the inverse ρ = √depth
//  are EXACTLY invertible, which is why the game can score your guess to machine
//  precision against the truth that drew the dip.
//
//  WHY A GRAZE IS DIFFERENT (and why you must hunt ρ, not √depth). If the planet
//  only clips the LIMB — a grazing transit, impact parameter b near 1 — it never
//  sits fully inside the disc, so the deepest overlap is LESS than π R_p² and the
//  dip is shallower than ρ² with NO flat bottom (a pointed V, not a tub). Reading
//  ρ = √(max depth) off a graze UNDER-reports the planet: the naive square-root
//  is a trap the geometry sets. So the hunted, graded quantity is the true radius
//  ratio ρ; the flat-bottom badge tells you when √depth is honest and when it lies.
//
//  HONEST SCOPE — engraved here and shown on the page. Everything is
//  DIMENSIONLESS: the star is a UNIFORM disc of radius 1, the planet a disc of
//  radius ρ = R_p/R_*, the impact parameter b the closest centre-to-centre
//  approach in stellar radii. depth === ρ² is EXACT only for this uniform disc.
//  Real stars are limb-darkened (brighter at centre, dimmer at the edge), which
//  rounds the dip's shoulders and changes the depth a little — the page DEPICTS a
//  limb-darkened glow for beauty, but the modelled physics is the uniform disc,
//  and no proved number leans on the darkening. No noise, no orbital dynamics,
//  no inclination beyond the single impact parameter b.
//
//  SOURCING (anti-drift, encoded as a test in core.test.mjs): the page inlines
//  the block between the TRANSIT CORE sentinels byte-for-byte; the twin
//  byte-parity-checks the inlined copy against this file so it can never drift.
//
//  Zero-dep ESM. No randomness except the explicit LCG; no wall-clock anywhere.
// ============================================================================

// ===== TRANSIT CORE (byte-identical to core.mjs) =====
"use strict";

const PI = Math.PI;

// ── lensOverlap(R, r, d): the AREA of intersection of two discs, radii R and r,
//    centres a distance d apart. This single primitive is the SOLE geometry; every
//    photometric quantity is derived from it. Branch-exact:
//      · disjoint  (d ≥ R + r)      → 0                       (no overlap)
//      · contained (d ≤ |R − r|)    → π·min(R,r)²             (the smaller disc,
//        EXACTLY — NO acos, so a fully-interior planet returns π r² to machine ε
//        with zero trig round-off; this is what makes depth === ρ² exact)
//      · partial   (otherwise)      → the classic two-circle "lens" (kite) area:
//            r²·acos((d²+r²−R²)/(2dr)) + R²·acos((d²+R²−r²)/(2dR))
//            − ½·√((−d+r+R)(d+r−R)(d−r+R)(d+r+R))
//        (the two circular segments; the √ term is the shared chord's triangle).
function lensOverlap(R, r, d){
  R = Math.abs(R); r = Math.abs(r); d = Math.abs(d);
  if (d >= R + r) return 0;                       // disjoint
  if (d <= Math.abs(R - r)) return PI * Math.min(R, r) * Math.min(R, r); // one inside the other
  const r2 = r * r, R2 = R * R, d2 = d * d;
  const a1 = Math.acos(clampUnit((d2 + r2 - R2) / (2 * d * r)));
  const a2 = Math.acos(clampUnit((d2 + R2 - r2) / (2 * d * R)));
  // the triangle term via Heron-like product (kept non-negative against round-off)
  const tri = Math.sqrt(Math.max(0, (-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R)));
  return r2 * a1 + R2 * a2 - 0.5 * tri;
}

// guard an acos argument into [-1, 1] against tiny float overshoot at the seams.
function clampUnit(x){ return x < -1 ? -1 : x > 1 ? 1 : x; }

// ── the photometry, ALL derived from lensOverlap with R_* ≡ 1 ───────────────
// The star is the unit disc (radius 1, area π). ρ = R_p/R_* is the planet's
// radius ratio; b is the impact parameter (closest centre-to-centre approach in
// stellar radii); x is the along-track offset of the planet's centre from the
// mid-transit point (also in stellar radii). The instantaneous separation is
// d = hypot(x, b).

// depthAt(rho, b, x): the fractional brightness DROP at along-track offset x —
// blocked area over the star's area. depth ∈ [0, ρ²].
function depthAt(rho, b, x){
  const d = Math.hypot(x, b);
  return lensOverlap(1, rho, d) / PI;
}

// brightnessAt(rho, b, x): the star's fractional brightness at offset x (1 = full).
function brightnessAt(rho, b, x){ return 1 - depthAt(rho, b, x); }

// maxDepth(rho, b): the DEEPEST dip over the whole passage — at mid-transit (x=0,
// d=b, the closest approach). For a full transit this is ρ² exactly; for a graze
// it is strictly less.
function maxDepth(rho, b){ return depthAt(rho, b, 0); }

// transitKind(rho, b): the geometry's verdict on the passage — the SINGLE source
// of the full/graze/none distinction (the curve badge and the dealer both read
// THIS, so the label can never disagree with the drawn dip).
//   · 'none'  : b ≥ 1 + ρ  → the discs never overlap (no transit at all)
//   · 'full'  : b ≤ 1 − ρ  → the planet is wholly inside the disc at mid-transit
//   · 'graze' : otherwise  → it only clips the limb (a partial overlap throughout)
function transitKind(rho, b){
  if (b >= 1 + rho) return 'none';
  if (b <= 1 - rho) return 'full';
  return 'graze';
}

// flatHalfWidth(rho, b): the half-width (in x) of the FLAT-BOTTOM interval — the
// span over which the planet is fully inside the disc (d ≤ 1 − ρ), so the depth is
// pinned at ρ². √max(0,(1−ρ)²−b²). Zero ⇒ no flat bottom (a graze, a pointed V).
function flatHalfWidth(rho, b){ return Math.sqrt(Math.max(0, (1 - rho) * (1 - rho) - b * b)); }

// contactHalfWidth(rho, b): the half-width (in x) of the whole transit — first to
// last contact, where the discs first touch (d = 1 + ρ). √max(0,(1+ρ)²−b²).
function contactHalfWidth(rho, b){ return Math.sqrt(Math.max(0, (1 + rho) * (1 + rho) - b * b)); }

// depthFromRatio(rho): the FULL-transit forward map — depth = ρ² (exact for the
// uniform disc, the headline claim).
function depthFromRatio(rho){ return rho * rho; }

// ratioFromDepth(d): the inverse — ρ = √depth. Exact inverse of depthFromRatio.
// (Reading this off a GRAZE under-reports ρ; that is the trap the game grades against.)
function ratioFromDepth(d){ return Math.sqrt(Math.max(0, d)); }

// ── makeRng(seed): the estate-standard LCG (Numerical Recipes constants), so any
//    randomised deal is reproducible. Exported verbatim (drifting-star's copy). ──
function makeRng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ── SCORING (GameLoop facet) — graded against the TRUE ρ ────────────────────
// The planet's radius is the hunted quantity. scoreGuess is a pure function of
// the absolute miss |ρ̂ − ρ_true|, banded by a FRACTION of the truth (so a guess
// is judged in proportion to how big the planet is) with an ABSOLUTE floor (so the
// tiniest planet, where a fixed fraction would be an impossibly thin target, is
// still winnable). It ALWAYS grades ρ̂ against rhoTrue — never against
// √(maxDepth), which would reward the naive graze misread.
const SCORE = {
  bullFrac: 0.06,   // within 6% of the true radius (or the floor) ⇒ bullseye
  goodFrac: 0.18,   // within 18% ⇒ a scoring hit; beyond ⇒ zero base
  floorAbs: 0.004,  // absolute tolerance floor (in ρ units) so a tiny planet is winnable
  bullBase: 1000,   // the points for a perfect call
};

// scoreGuess(rhoGuess, rhoTrue): the graded result. Returns the absolute & relative
// miss, the band, and a BASE point value (before any streak multiplier):
//   · the effective tolerance unit tol = max(goodFrac·ρ_true, floorAbs) sets the scale;
//   · relErr = |ρ̂ − ρ_true| / tol  (0 = perfect, 1 = at the edge of the good band);
//   · raw = max(0, 1 − relErr)  (a linear falloff to the band edge);
//   · base = round(bullBase · raw²)  (squared so near-misses fall off gracefully).
//   · band: 'bull' if within bullFrac·ρ_true (or floorAbs), 'good' if within the
//     good band, else 'miss' (base 0 — a try-again).
function scoreGuess(rhoGuess, rhoTrue){
  const absErr = Math.abs(rhoGuess - rhoTrue);
  const goodTol = Math.max(SCORE.goodFrac * rhoTrue, SCORE.floorAbs);
  const bullTol = Math.max(SCORE.bullFrac * rhoTrue, SCORE.floorAbs);
  const relErr = absErr / goodTol;
  const raw = Math.max(0, 1 - relErr);
  const base = Math.round(SCORE.bullBase * raw * raw);
  let band;
  if (absErr <= bullTol) band = 'bull';
  else if (absErr <= goodTol) band = 'good';
  else band = 'miss';
  return { absErr, relErr, raw, base, band, rhoGuess, rhoTrue, goodTol, bullTol };
}

// roundScore(scoreObj, streakBefore): apply the streak multiplier to a base score.
// Each consecutive scoring round (band !== 'miss') adds 15% — the streak is the
// number of scoring rounds BEFORE this one. A miss resets the streak (handled by
// the caller) and earns its base (0) unmultiplied.
function roundScore(scoreObj, streakBefore){
  const mult = 1 + 0.15 * Math.max(0, streakBefore || 0);
  const points = Math.round(scoreObj.base * mult);
  return { points, mult, base: scoreObj.base, band: scoreObj.band };
}

// ── dealPlanet(rng): the GAME's randomiser — pick a planet to hunt ──────────
// Draw a radius ratio in [RHO_MIN, RHO_MAX]; ~GRAZE_FRAC of deals are GRAZES (the
// planet only clips the limb), the rest FULL transits. The full/graze split uses
// core's transitKind geometry as the SINGLE source of truth, so a deal labelled
// 'full' is provably full and a 'graze' provably grazes — the kind can never lie.
//   · FULL : b ∈ [0, (1 − ρ)·FULL_B_FRAC]  (comfortably inside ⇒ a flat-bottomed tub)
//   · GRAZE: b ∈ (1 − ρ, (1 + ρ)·GRAZE_B_FRAC)  (clips the limb ⇒ a pointed V)
const DEAL = {
  rhoMin: 0.05, rhoMax: 0.22,
  grazeFrac: 0.30,
  fullBFrac: 0.85,    // a full deal's b stays within this fraction of (1−ρ)
  grazeBFrac: 0.90,   // a graze deal's b stays within this fraction of (1+ρ)
};

function dealPlanet(rng){
  const rhoTrue = DEAL.rhoMin + rng() * (DEAL.rhoMax - DEAL.rhoMin);
  let b;
  if (rng() < DEAL.grazeFrac){
    // GRAZE: b strictly above (1−ρ) up to a fraction of (1+ρ)
    const lo = 1 - rhoTrue, hi = (1 + rhoTrue) * DEAL.grazeBFrac;
    b = lo + rng() * (hi - lo);
  } else {
    // FULL: b from 0 up to a fraction of (1−ρ)
    b = rng() * (1 - rhoTrue) * DEAL.fullBFrac;
  }
  return { rhoTrue, b, kind: transitKind(rhoTrue, b) };
}

// SCENE — the UI defaults the page reads (so the page and the test agree on the
// game's framing). transitSpan is the along-track range x ∈ [−span, +span] the
// WATCH phase sweeps (a little past last contact for the widest planet).
const SCENE = {
  rhoLaunch: 0.12,     // the sandbox's opening planet
  bLaunch: 0.30,
  watchSpan: 1.35,     // x sweeps ±this during a passage (past contact for ρ≤0.22)
  caliperMin: 0.02,    // the caliper's ρ̂ range
  caliperMax: 0.30,
  displayGain: 25,     // the HERO LAMP's visual gain (display-only; never scored/proved)
};

// ── runSelfTest(): the in-page pill AND the Node twin both call THIS. Proves the
//    photometry claims EXACT, with the same fixed seeds so the pill is reproducible.
const TOL_TIGHT = 1e-12;   // the exact algebraic claims (depth===ρ² etc.)
const TOL_NUM   = 1e-9;    // the independent numerical re-derivation of the area

function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // (1) FULL → depth === ρ² to machine precision, and FLAT across the flat interval.
  {
    const rho = 0.13, b = 0.20;                       // comfortably full
    const md = maxDepth(rho, b);
    let flatOk = Math.abs(md - rho * rho) < TOL_TIGHT;
    let worst = Math.abs(md - rho * rho);
    const hw = flatHalfWidth(rho, b);
    // sample across the flat interval: depth must stay pinned at ρ²
    for (let i = 0; i <= 12; i++){
      const x = (-hw) + (2 * hw) * (i / 12);
      const dd = depthAt(rho, b, x);
      const e = Math.abs(dd - rho * rho);
      if (e > worst) worst = e;
      if (e >= TOL_TIGHT) flatOk = false;
    }
    ck('1 · FULL: depth === ρ² exact, flat across the whole flat-bottom interval',
       flatOk, 'max|depth − ρ²| = ' + worst.toExponential(2) + ' (tol ' + TOL_TIGHT + ')');
  }

  // (2) GRAZE → max depth < ρ² strictly, flatHalfWidth === 0, and the dip is
  //     strictly single-peaked (monotone down moving away from mid-transit both ways).
  {
    const rho = 0.15, b = 0.92;                       // a clear graze (b > 1−ρ = 0.85)
    const md = maxDepth(rho, b);
    const shallower = md < rho * rho - 1e-9;
    const noFlat = flatHalfWidth(rho, b) === 0;
    // single-peaked: sample x ≥ 0 to last contact; depth must strictly decrease.
    const hw = contactHalfWidth(rho, b);
    let mono = true, prev = md;
    for (let i = 1; i <= 40; i++){
      const x = hw * (i / 40);
      const dd = depthAt(rho, b, x);
      if (!(dd < prev + 1e-15)) mono = false;        // never rises moving outward
      prev = dd;
    }
    ck('2 · GRAZE: max depth < ρ² strictly, no flat bottom, dip strictly single-peaked',
       shallower && noFlat && mono,
       'maxDepth=' + md.toExponential(3) + ' < ρ²=' + (rho * rho).toExponential(3) +
       ' · flatHW=' + flatHalfWidth(rho, b) + ' · monotone=' + mono);
  }

  // (3) NEG-CONTROL — no transit (b ≥ 1 + ρ): zero dip everywhere, contactHalfWidth 0.
  {
    const rho = 0.10, b = 1 + rho + 0.05;             // strictly outside contact
    const md = maxDepth(rho, b);
    const zeroEverywhere = md === 0 && depthAt(rho, b, 0) === 0 && depthAt(rho, b, 0.4) === 0;
    const noContact = contactHalfWidth(rho, b) === 0;
    const kindNone = transitKind(rho, b) === 'none';
    ck('3 · NEG-CONTROL: b ≥ 1+ρ ⇒ depth === 0 exactly, contactHalfWidth 0, kind none',
       zeroEverywhere && noContact && kindNone,
       'maxDepth=' + md + ' contactHW=' + contactHalfWidth(rho, b) + ' kind=' + transitKind(rho, b));
  }

  // (4) ROUND-TRIP — the caliper depth↔radius-ratio map is an exact inverse pair,
  //     and for a full transit ratioFromDepth(maxDepth) recovers ρ exactly.
  {
    const rng = makeRng(0xC0FFEE);
    let worst = 0;
    for (let i = 0; i < 300; i++){
      const rho = 0.05 + rng() * 0.20;
      // depthFromRatio ∘ ratioFromDepth and the reverse
      const d = depthFromRatio(rho);
      const back = ratioFromDepth(d);
      worst = Math.max(worst, Math.abs(back - rho));
      // for a full transit (b small) maxDepth === ρ² and √ recovers ρ
      const b = (1 - rho) * 0.4;
      const recov = ratioFromDepth(maxDepth(rho, b));
      worst = Math.max(worst, Math.abs(recov - rho));
    }
    ck('4 · ROUND-TRIP: ratioFromDepth(depthFromRatio(ρ))===ρ and √(maxDepth)===ρ for full',
       worst < TOL_TIGHT, 'max round-trip error = ' + worst.toExponential(2) + ' (tol ' + TOL_TIGHT + ')');
  }

  // (5) INDEPENDENT re-derivation — the lens-overlap area computed a SECOND way,
  //     by numerical integration, agrees with lensOverlap to <1e-9. We integrate
  //     the overlap area as ∫ (vertical chord length inside BOTH discs) dx over the
  //     overlap band, with the planet's centre at separation d on the x-axis: for
  //     each x the overlap column runs from the lower to the upper of the two discs'
  //     chord half-heights — exactly the area shared by both circles. Simpson on a
  //     fine grid (the θ-free strip form; the √ edge is integrably mild here).
  {
    const cases = [[1, 0.13, 0.8], [1, 0.2, 0.9], [1, 0.15, 0.95], [1, 0.07, 0.99]];
    let worst = 0;
    for (const [R, r, d] of cases){
      const exact = lensOverlap(R, r, d);
      const num = lensOverlapNumeric(R, r, d);
      worst = Math.max(worst, Math.abs(exact - num));
    }
    ck('5 · INDEPENDENT: lensOverlap re-derived by numeric integration agrees < 1e-9',
       worst < TOL_NUM, 'max|exact − numeric| = ' + worst.toExponential(2) + ' (tol ' + TOL_NUM + ')');
  }

  // (6) transitKind BOUNDARY spot-checks — the labels switch exactly at b = 1∓ρ.
  {
    const rho = 0.12;
    const justFull  = transitKind(rho, (1 - rho) - 1e-6) === 'full';
    const justGraze = transitKind(rho, (1 - rho) + 1e-6) === 'graze';
    const justNone  = transitKind(rho, (1 + rho) + 1e-6) === 'none';
    const stillGraze = transitKind(rho, (1 + rho) - 1e-6) === 'graze';
    ck('6 · transitKind boundaries: full↔graze at b=1−ρ, graze↔none at b=1+ρ',
       justFull && justGraze && justNone && stillGraze,
       'full=' + justFull + ' graze=' + justGraze + ' none=' + justNone + ' edge=' + stillGraze);
  }

  // (7) SCORING HONESTY — ρ̂ === ρ_true gives a bullseye at base 1000; a wild guess
  //     gives base 0; the relative error is exact.
  {
    const perfect = scoreGuess(0.14, 0.14);
    const wild = scoreGuess(0.30, 0.10);
    const bullOk = perfect.band === 'bull' && perfect.base === SCORE.bullBase && perfect.absErr === 0;
    const missOk = wild.band === 'miss' && wild.base === 0;
    // exactness of the miss
    const s = scoreGuess(0.11, 0.10);
    const errOk = Math.abs(s.absErr - 0.01) < TOL_TIGHT;
    ck('7 · SCORING: ρ̂===ρ_true ⇒ bull base 1000; wild ⇒ base 0; |miss| exact',
       bullOk && missOk && errOk,
       'perfect base=' + perfect.base + ' wild base=' + wild.base + ' |err|=' + s.absErr.toFixed(4));
  }

  // (8) DEALER COVERAGE + GRAZE INTEGRITY — over 500 deals every rhoTrue is in
  //     range, every 'full' is provably full (b ≤ (1−ρ)·fullBFrac and kind full),
  //     every 'graze' provably grazes (b > 1−ρ and kind graze), and the graze rate
  //     is close to GRAZE_FRAC. The deal's kind label always matches transitKind.
  {
    const rng = makeRng(20260620);
    let grazes = 0, ok = true;
    for (let i = 0; i < 500; i++){
      const { rhoTrue, b, kind } = dealPlanet(rng);
      if (rhoTrue < DEAL.rhoMin - 1e-12 || rhoTrue > DEAL.rhoMax + 1e-12) ok = false;
      if (kind !== transitKind(rhoTrue, b)) ok = false;          // label can't lie
      if (kind === 'full'){
        if (!(b <= (1 - rhoTrue) * DEAL.fullBFrac + 1e-12)) ok = false;
        if (transitKind(rhoTrue, b) !== 'full') ok = false;
      } else if (kind === 'graze'){
        grazes++;
        if (!(b > 1 - rhoTrue)) ok = false;
        if (transitKind(rhoTrue, b) !== 'graze') ok = false;
      } else ok = false;                                          // never deal 'none'
    }
    const rate = grazes / 500;
    const rateOk = Math.abs(rate - DEAL.grazeFrac) < 0.07;
    ck('8 · DEALER: 500 deals all in range, kind never lies, graze-rate ≈ 30%',
       ok && rateOk, 'graze-rate=' + (rate * 100).toFixed(1) + '% (target ' + (DEAL.grazeFrac * 100) + '%)');
  }

  // (9) WINNABILITY — a representative FULL and a representative GRAZE are both
  //     winnable: the true ρ, read from the evidence the right way, lands a bull.
  //     For the full, √(maxDepth) IS ρ; for the graze, the honest read is the true
  //     ρ (the flat-bottom badge warns √depth is short) — guessing ρ_true scores a bull.
  {
    const full = { rho: 0.16, b: 0.2 };
    const graze = { rho: 0.16, b: 0.92 };
    const fullGuess = ratioFromDepth(maxDepth(full.rho, full.b));   // √depth honest here
    const fullBull = scoreGuess(fullGuess, full.rho).band === 'bull';
    const grazeBull = scoreGuess(graze.rho, graze.rho).band === 'bull'; // hunt true ρ
    // and the graze's naive √depth is NOT a bull (it under-reports) — the trap is real
    const naive = ratioFromDepth(maxDepth(graze.rho, graze.b));
    const trapReal = scoreGuess(naive, graze.rho).band !== 'bull';
    ck('9 · WINNABILITY: full & graze both winnable; the graze √depth trap is real',
       fullBull && grazeBull && trapReal,
       'full √depth bull=' + fullBull + ' graze ρ bull=' + grazeBull + ' naive trap=' + trapReal);
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}

// lensOverlapNumeric(R, r, d): an INDEPENDENT computation of the overlap area, by
// integrating the shared vertical chord length over x. Place disc R's centre at
// the origin and disc r's centre at (d, 0). At horizontal position x a point is in
// disc R iff |y| ≤ √(R²−x²) and in disc r iff |y| ≤ √(r²−(x−d)²); the shared column
// half-height is the min of the two (where both are real), so the overlap area is
//   ∫ 2·min(√(R²−x²), √(r²−(x−d)²)) dx over the x-band where both are real.
// Composite Simpson on a fine grid — a genuinely different route than the acos form.
function lensOverlapNumeric(R, r, d){
  // x-band where BOTH discs have real chords: [max(−R, d−r), min(R, d+r)]
  const xlo = Math.max(-R, d - r);
  const xhi = Math.min(R, d + r);
  if (!(xhi > xlo)) return 0;
  const Ngrid = 2000000;                 // 2e6 strips (even) — ample for <1e-9
  const n = Ngrid;                        // already even
  const h = (xhi - xlo) / n;
  const f = (x) => {
    const a = R * R - x * x;
    const c = r * r - (x - d) * (x - d);
    const ha = a > 0 ? Math.sqrt(a) : 0;  // disc-R chord half-height at x
    const hc = c > 0 ? Math.sqrt(c) : 0;  // disc-r chord half-height at x
    return 2 * Math.min(ha, hc);          // shared column height
  };
  let sum = f(xlo) + f(xhi);
  for (let i = 1; i < n; i++){
    sum += (i % 2 ? 4 : 2) * f(xlo + i * h);
  }
  return (h / 3) * sum;
}
// ===== END TRANSIT CORE =====

export {
  PI,
  lensOverlap, clampUnit, depthAt, brightnessAt, maxDepth, transitKind,
  flatHalfWidth, contactHalfWidth, depthFromRatio, ratioFromDepth,
  makeRng, SCORE, scoreGuess, roundScore, DEAL, dealPlanet, SCENE,
  TOL_TIGHT, TOL_NUM, runSelfTest, lensOverlapNumeric,
};
