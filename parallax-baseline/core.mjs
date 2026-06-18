// ============================================================================
//  THE PARALLAX BASELINE — logic core (trigonometric stellar parallax, made
//  into a thing you operate: drag Earth across its orbit, blink the sky, SEE
//  the near star wobble, dial its angle on a brass micrometer, throw a switch
//  to read its distance in parsecs). Pure, dependency-free.
//
//  THE ONE IDEA. As Earth swings from one side of its orbit to the other, a
//  nearby star appears to shift against the fixed far field. The HALF of that
//  to-and-fro shift, measured from a one-AU baseline, is the PARALLAX angle p:
//      p[arcsec] = baseline[AU] / d[pc].
//  This is the DEFINITION of the parsec, not a fitted relation: 1 pc is exactly
//  the distance at which 1 AU subtends 1 arcsecond, so p=1" ⟺ d=1pc. The map is
//  an exact reciprocal, which is why MEASURE and RESOLVE are perfect inverses:
//      d[pc] = baseline[AU] / p[arcsec].
//
//  WHERE THE FACTOR OF TWO LIVES. p is a HALF-angle — what the micrometer reads
//  off a single one-AU baseline (Sun→Earth). The FULL Jan→Jul throw the eye
//  sees across the blink is 2p (apparentShiftArcsec). That factor of two lives
//  in EXACTLY ONE place (apparentShiftArcsec); no renderer re-derives it.
//
//  HONEST SCALE. Real stellar parallaxes are sub-arcsecond (Proxima, the
//  nearest star, is only 0.769") — invisible at screen scale. The page applies
//  a clearly-labelled VISUAL exaggeration ("sky ×N") to the on-screen pixel map
//  ONLY; it never touches this core and never touches the micrometer number.
//  shiftRadians is the HONEST true angle (no exaggeration) the renderer uses to
//  place the star; the small-angle identity shift≈tan(shift) holds to ~1e-9 for
//  every real stellar parallax, and the test PRINTS (does not hide) where it
//  breaks down at an absurd angle.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the
//  block between the PARALLAX-BASELINE CORE sentinels byte-for-byte; the twin
//  byte-parity-checks the inlined copy so it can never drift.
// ============================================================================

// ===== PARALLAX-BASELINE CORE (byte-identical to core.mjs) =====
"use strict";

const PC_DEF_ARCSEC = 1;               // 1 pc ≝ the distance at which 1 AU subtends 1" (the DEFINITION)
const ARCSEC_PER_RAD = 206264.806247;  // derived (180/π · 3600); used only to bridge to true radians, NOT the claim
const GRID_ARCSEC = 0.001;             // the micrometer drum's tick granularity (one shared const; the reading floor)
const P_FLOOR_ARCSEC = GRID_ARCSEC;    // below this the instrument honestly reads "no detectable shift"

// ── the parallax half-angle (THE claim) ─────────────────────────────────────
// p = baseline / d. This is the HALF-angle the micrometer reads off ONE one-AU
// baseline. Guards: a zero baseline measures nothing (===0); a non-finite
// distance (a star "at infinity") has no parallax (===0).
function parallaxArcsec(dPc, baselineAU = 1){
  if (baselineAU === 0) return 0;
  if (!isFinite(dPc)) return 0;
  return baselineAU / dPc;
}

// THE FULL throw the eye sees across a Jan→Jul blink: twice the half-angle.
// The factor of two lives HERE and ONLY here — no renderer re-derives it.
function apparentShiftArcsec(dPc, baselineAU = 1){
  return 2 * parallaxArcsec(dPc, baselineAU);
}

// SIGNED apparent offset for an arbitrary baseline projection b ∈ [−1,+1] AU.
// This is what the draggable Earth bead drives: at the orbit's extremes b=±1
// the star sits at ±p; at b=0 (line of sight through the Sun) it sits exactly
// at 0. The peak-to-peak swing b:+1→−1 is 2p === apparentShiftArcsec.
function apparentOffsetArcsec(dPc, b){
  return parallaxArcsec(dPc, 1) * b;
}

// RESOLVE: invert the definition to recover the distance. p===0 ⇒ ∞ (a star at
// infinity, or a zero baseline) — honest Infinity, never NaN.
function distancePc(pArcsec, baselineAU = 1){
  return pArcsec === 0 ? Infinity : baselineAU / pArcsec;
}

// The renderer placement bridge: the FULL throw expressed in HONEST true
// radians (no eye-exaggeration — that is the renderer's own ×N, applied later
// in pixel space). Small-angle: for every real stellar parallax this equals
// tan(shift) to ~1e-9.
function shiftRadians(dPc, baselineAU = 1){
  return apparentShiftArcsec(dPc, baselineAU) / ARCSEC_PER_RAD;
}

// ── the on-screen pixel map (one affine map; the VIEW layer facet 1 drives) ──
// arcsecToX maps a signed arcsec offset to a signed pixel offset about the
// plate centre, scaled by the VISUAL exaggeration exag (the "sky ×N" knob) and
// a pixels-per-arcsec base. xToArcsec is its exact inverse. The exaggeration
// lives HERE in the view map ONLY — never in parallaxArcsec / the micrometer.
const PX_PER_ARCSEC = 380;             // base pixel scale of the plate (before ×N)
function arcsecToX(arcsec, exag = 1, pxPerArcsec = PX_PER_ARCSEC){
  return arcsec * pxPerArcsec * exag;
}
function xToArcsec(x, exag = 1, pxPerArcsec = PX_PER_ARCSEC){
  return x / (pxPerArcsec * exag);
}

// quantize a true angle to the micrometer's reading grid (finite resolution).
function quantizeArcsec(p){
  return Math.round(p / GRID_ARCSEC) * GRID_ARCSEC;
}

// ── the catalogue: SINGLE-SOURCED here (the renderer's snap targets AND the
// test anchor are ONE value). Distances in pc; p is DERIVED, never re-typed. ──
function starTable(){
  return [
    { id: 'proxima',  label: 'Proxima Centauri', dPc: 1.30 },
    { id: 'sirius',   label: 'Sirius',           dPc: 2.64 },
    { id: 'cygni61',  label: '61 Cygni',         dPc: 3.50 },
  ];
}

// ── a small deterministic PRNG (drifting-star LCG constants, verbatim) so the
// far-star field is reproducible from a seed. ──
function makeRng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ── the self-test: prove the claims numerically (two SEPARATE tolerances) ────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // (a) ROUND-TRIP, TIGHT: d→parallaxArcsec→distancePc over log-spaced [0.5,100]pc
  // plus hundreds of random draws. Pure reciprocal ⇒ machine-ε.
  {
    let maxRel = 0;
    const ds = [];
    for (let i = 0; i <= 40; i++) ds.push(0.5 * Math.pow(200, i / 40));   // log [0.5,100]
    const rng = makeRng(0x9DB4);
    for (let i = 0; i < 400; i++) ds.push(0.5 + rng() * 99.5);
    for (const d of ds){
      const p = parallaxArcsec(d, 1);
      const back = distancePc(p, 1);
      maxRel = Math.max(maxRel, Math.abs(back - d) / d);
    }
    ck('a · round-trip d→p→d < 1e-12 rel over [0.5,100]pc (pure reciprocal, machine-ε)',
       maxRel < 1e-12, 'maxRel=' + maxRel.toExponential(2));
  }

  // (a′) READING-GRID, LOOSER: quantize p to the drum grid then recover; assert
  // against the grid-DERIVED bound (≈ GRID_ARCSEC·d²/baseline), NOT a flat ε —
  // distant stars are grid-limited (physically true: a tiny angle is hard to read).
  {
    let worstRatio = 0, allWithin = true;
    for (const d of [0.5, 1, 1.3, 2.64, 3.5, 10, 30, 100]){
      const p = parallaxArcsec(d, 1);
      const pQ = quantizeArcsec(p);
      const dQ = distancePc(pQ, 1);
      // d = 1/p ⇒ |Δd| ≈ d²·|Δp| ≤ d²·(GRID/2); use GRID as a generous bound.
      const bound = d * d * GRID_ARCSEC + 1e-9;
      const err = Math.abs(dQ - d);
      if (!(err <= bound)) allWithin = false;
      worstRatio = Math.max(worstRatio, err / bound);
    }
    ck('a′ · reading-grid recovery within grid-derived bound (distant stars grid-limited)',
       allWithin, 'worst err/bound=' + worstRatio.toFixed(3) + ' (grid=' + GRID_ARCSEC + '")');
  }

  // (b) NEG-CONTROL — star at infinity ⇒ zero everything (===, not <ε).
  {
    const ok = parallaxArcsec(Infinity) === 0
      && apparentShiftArcsec(Infinity) === 0
      && apparentOffsetArcsec(Infinity, 1) === 0
      && shiftRadians(Infinity) === 0;
    // near-limit: monotone →0, never negative, as d→huge
    let mono = true, prev = Infinity;
    for (const d of [1e3, 1e4, 1e5, 1e6, 1e9]){
      const p = parallaxArcsec(d);
      if (p < 0 || p > prev) mono = false;
      prev = p;
    }
    ck('b · NEG-CONTROL star at ∞: parallax/shift/offset/radians all ===0, near-limit →0 monotone',
       ok && mono, 'exact=' + ok + ' mono→0=' + mono);
  }

  // (c) NEG-CONTROL — zero baseline ⇒ zero shift for EVERY distance (===0).
  {
    let allZero = true;
    const rng = makeRng(7);
    for (let i = 0; i < 200; i++){
      const d = 0.5 + rng() * 99.5;
      if (parallaxArcsec(d, 0) !== 0) allZero = false;
      if (apparentOffsetArcsec(d, 0) !== 0) allZero = false;
    }
    ck('c · NEG-CONTROL zero baseline: parallaxArcsec(d,0)===0 AND offset(d,0)===0 ∀d (===0)',
       allZero, 'allZero=' + allZero);
  }

  // (d) MONOTONICITY / sign / linearity / the 2× identity.
  {
    let mono = true, prevP = Infinity;
    for (let d = 0.5; d <= 100; d += 0.5){
      const p = parallaxArcsec(d);
      if (!(p < prevP)) mono = false;   // strictly decreasing in d
      prevP = p;
    }
    let twoX = true, linear = true, peakToPeak = true;
    const rng = makeRng(0xBEAD);
    for (let i = 0; i < 200; i++){
      const d = 0.5 + rng() * 99.5;
      if (apparentShiftArcsec(d) !== 2 * parallaxArcsec(d)) twoX = false;
      if (Math.abs(parallaxArcsec(d, 2) - 2 * parallaxArcsec(d, 1)) > 1e-15) linear = false;
      const p2p = apparentOffsetArcsec(d, +1) - apparentOffsetArcsec(d, -1);
      if (Math.abs(p2p - apparentShiftArcsec(d)) > 1e-15) peakToPeak = false;
    }
    ck('d · p strictly ↓ in d; shift===2·p exactly; baseline-linear; b-sweep peak-to-peak===shift',
       mono && twoX && linear && peakToPeak,
       'mono=' + mono + ' 2×=' + twoX + ' linear=' + linear + ' p2p=' + peakToPeak);
  }

  // (e) DEFINITION ANCHOR — the immovable parsec fact (===).
  {
    const ok = parallaxArcsec(1, 1) === 1 && distancePc(1, 1) === 1 && PC_DEF_ARCSEC === 1;
    ck('e · DEFINITION anchor: parallaxArcsec(1,1)===1 and distancePc(1,1)===1 (the parsec)',
       ok, 'p(1,1)=' + parallaxArcsec(1, 1) + ' d(1,1)=' + distancePc(1, 1));
  }

  // (g) SMALL-ANGLE HONESTY — shiftRadians vs the arcsec identity holds to <1e-9
  // rel for every real stellar parallax (p ≤ 1"); PRINT the breakdown at an
  // absurd p (e.g. 100") rather than hide it.
  {
    let maxRel = 0;
    for (const d of [1, 1.3, 2.64, 3.5, 10, 100]){   // all give p ≤ 1"
      const rad = shiftRadians(d);
      const tan = 2 * Math.tan(parallaxArcsec(d) / ARCSEC_PER_RAD);  // honest geometric throw
      maxRel = Math.max(maxRel, Math.abs(rad - tan) / Math.abs(tan));
    }
    // the absurd case: p=100" (d=0.01pc) — small-angle visibly breaks; we REPORT it.
    const dAbsurd = 0.01;
    const radA = shiftRadians(dAbsurd);
    const tanA = 2 * Math.tan(parallaxArcsec(dAbsurd) / ARCSEC_PER_RAD);
    const breakRel = Math.abs(radA - tanA) / Math.abs(tanA);
    ck('g · small-angle honest <1e-9 rel for p≤1" (all real stars); breaks at p=100" (reported)',
       maxRel < 1e-9, 'real maxRel=' + maxRel.toExponential(2) + ' · absurd p=100" breakRel=' + breakRel.toExponential(2));
  }

  // (h) VIEW-LAYER — arcsecToX/xToArcsec exact inverses over a decade of zoom.
  {
    let maxRel = 0;
    const rng = makeRng(0xF1E1D);
    for (const exag of [1, 3.16, 10, 31.6, 100]){     // a decade-plus of ×N
      for (let i = 0; i < 200; i++){
        const a = (rng() * 2 - 1) * 1.0;              // arcsec in [−1,+1]
        const back = xToArcsec(arcsecToX(a, exag), exag);
        if (Math.abs(a) > 1e-12) maxRel = Math.max(maxRel, Math.abs(back - a) / Math.abs(a));
      }
    }
    ck('h · view-layer arcsecToX/xToArcsec exact inverses <1e-9 rel over a decade of ×N zoom',
       maxRel < 1e-9, 'maxRel=' + maxRel.toExponential(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END PARALLAX-BASELINE CORE =====

export {
  PC_DEF_ARCSEC, ARCSEC_PER_RAD, GRID_ARCSEC, P_FLOOR_ARCSEC, PX_PER_ARCSEC,
  parallaxArcsec, apparentShiftArcsec, apparentOffsetArcsec, distancePc, shiftRadians,
  arcsecToX, xToArcsec, quantizeArcsec, starTable, makeRng, runSelfTest,
};
