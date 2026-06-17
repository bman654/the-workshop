// ============================================================================
//  THE DRIFTING STAR — logic core (the classical low-v Doppler, made into a
//  thing you read off a sliding comb). Pure, dependency-free except ONE
//  single-source import: the four Balmer REST wavelengths come from
//  spectroscope-core.mjs (the estate's sole authority for the Rydberg/Balmer
//  numbers), so the rest-line the renderer paints and the rest-line the test
//  grades against are ONE value — never a re-typed 656.28 (anti-circularity).
//
//  THE ONE IDEA. A star drifting along the line of sight shifts every spectral
//  line by the SAME fractional amount:  λ_obs / λ_rest = 1 + v/c  (the classical
//  low-v Doppler). So the whole hydrogen comb slides RIGID — redshift (v>0,
//  receding) reddens it RIGHT, blueshift (v<0, approaching) blues it LEFT — and
//  the gap between a rest line and its shifted twin reads back the speed:
//      v = c · Δλ / λ_rest = c · (λ_obs − λ_rest) / λ_rest.
//  This forward/inverse pair is EXACTLY invertible, which is why the game can
//  score your guess against the true v to machine precision.
//
//  SOLE AUTHORITY = the CLASSICAL form, because that is the crux the page
//  renders and the game inverts (v === c·Δλ/λ). We ALSO ship the relativistic
//  longitudinal form (shiftedNmRel) so the "how do we know" panel can SHOW the
//  correction beside the classical headline — we never hide it, we just don't
//  claim it. HONEST SCOPE: the speed cap is ±0.05c for two reasons —
//    (a) it keeps the whole Balmer comb (Hδ 410→~390 blued, Hα 656→~689 redded)
//        inside the visible band [380,750] so the plate never loses a line;
//    (b) at 0.05c the classical and relativistic forms agree to ~1.4%, so the
//        classical headline is faithful. (Rework path: swap shiftedNm→shiftedNmRel
//        in the renderer and pin THAT in the test — one line.)
//
//  SOURCING (anti-drift, encoded as a test in core.test.mjs): the page inlines
//  the block between the DRIFTING-STAR CORE sentinels byte-for-byte; the twin
//  byte-parity-checks the inlined copy against this file so it can never drift.
// ============================================================================

import { balmerWavelengthAirNm } from '../spectroscope/spectroscope-core.mjs';

// ===== DRIFTING-STAR CORE (byte-identical to core.mjs) =====
"use strict";

const C_KMS = 299792.458;        // speed of light, km/s (the conversion the readout uses)
const V_CAP_FRAC = 0.05;         // ±0.05c honest scope (keeps the comb in-band; classical faithful)

// The four Balmer REST wavelengths (air, nm), n=3..6 → Hα Hβ Hγ Hδ. SINGLE-SOURCE
// from spectroscope-core; the renderer's ghost comb and the test both read THESE.
function balmerRestComb(){
  return [
    { n: 3, label: 'Hα', restNm: balmerWavelengthAirNm(3) },
    { n: 4, label: 'Hβ', restNm: balmerWavelengthAirNm(4) },
    { n: 5, label: 'Hγ', restNm: balmerWavelengthAirNm(5) },
    { n: 6, label: 'Hδ', restNm: balmerWavelengthAirNm(6) },
  ];
}

// ── the classical Doppler (THE claim) ───────────────────────────────────────
// FORWARD: a line at rest wavelength restNm, seen from a star moving at vKms
// (sign: +receding/redshift, −approaching/blueshift), is observed at
//   λ_obs = λ_rest · (1 + v/c).
// v=0 ⇒ λ_obs === λ_rest EXACTLY (no float drift) — the negative control.
function shiftedNm(restNm, vKms){
  return restNm * (1 + vKms / C_KMS);
}
// EXACT INVERSE: recover the speed from a rest/observed pair.
//   v = c · (λ_obs − λ_rest) / λ_rest.
// recoverVKms(rest, rest) === 0 exactly; v→shiftedNm→recoverVKms round-trips to ε.
function recoverVKms(restNm, obsNm){
  return C_KMS * (obsNm - restNm) / restNm;
}

// RELATIVISTIC longitudinal Doppler (shown beside the classical headline, NOT
// claimed): λ_obs = λ_rest · sqrt((1+β)/(1−β)), β = v/c. At |β|≤0.05 it agrees
// with the classical (1+β) form to ~1.4%. Pass beta in units of c.
function shiftedNmRel(restNm, beta){
  return restNm * Math.sqrt((1 + beta) / (1 - beta));
}

// km/s ↔ fraction-of-c helpers (the cap, the scoring thresholds, all in β).
function vKmsToBeta(vKms){ return vKms / C_KMS; }
function betaToVKms(beta){ return beta * C_KMS; }
const V_CAP_KMS = V_CAP_FRAC * C_KMS;

// ── the pixel map (one affine map over the painted band) ─────────────────────
// The plate paints wavelengths LAM_MIN..LAM_MAX across a band of pixel width w.
// wavelengthToX/xToWavelength are exact inverses; the number the player reads is
// computed by THIS chain, the same one the test pins. Grid-quantizing a guess to
// GRID_NM turns a crosshair drag into a real (finite-resolution) measurement.
const LAM_MIN = 380, LAM_MAX = 750;     // visible band, nm (matches the spectroscope)
const GRID_NM = 0.02;                   // crosshair quantization (fine measurement grid)

function wavelengthToX(nm, x0, w){
  return x0 + (nm - LAM_MIN) / (LAM_MAX - LAM_MIN) * w;
}
function xToWavelength(x, x0, w){
  return LAM_MIN + (x - x0) / w * (LAM_MAX - LAM_MIN);
}
function quantizeNm(nm){
  return Math.round(nm / GRID_NM) * GRID_NM;
}

// ── scoring (lives in the core so the test pins it; the view never re-types) ──
// Verdict thresholds are a FRACTION of c (resolution-honest), with an absolute
// β-floor so a near-stationary / stationary star is winnable (you can't land
// inside 0.0001c of v=0 by pixel, so the floor opens BULLSEYE there).
const SCORE = {
  bullseyeFrac: 0.0015,   // |Δβ| ≤ 0.0015c → BULLSEYE  (~450 km/s — earned, but grid-achievable)
  goodFrac:     0.006,    // |Δβ| ≤ 0.006c  → GOOD       (~1800 km/s)
  floorFrac:    0.0015,   // absolute β floor so v≈0 is winnable at the grid limit
};
// Pure function of |v_guess − v_true|: returns {errKms, errBeta, band}.
// band ∈ 'bullseye' | 'good' | 'try-again'. The revealed true v is the SAME
// number fed to shiftedNm that drew the plate (scoring honesty — see the test).
function scoreGuess(vGuessKms, vTrueKms){
  const errKms = Math.abs(vGuessKms - vTrueKms);
  const errBeta = errKms / C_KMS;
  const floor = SCORE.floorFrac;
  let band;
  if (errBeta <= Math.max(SCORE.bullseyeFrac, floor)) band = 'bullseye';
  else if (errBeta <= SCORE.goodFrac) band = 'good';
  else band = 'try-again';
  return { errKms, errBeta, band };
}

// ── the self-test: prove the claims numerically (two SEPARATE tolerances) ────
// A small deterministic PRNG so the hundreds of random v are reproducible.
function makeRng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const comb = balmerRestComb();

  // (a) ROUND-TRIP, MATH CHAIN — TIGHT tolerance. v→shiftedNm→recoverVKms agrees
  // to <1e-9 relative over hundreds of random v in [−0.05c,+0.05c] for ALL FOUR
  // lines, AND the recovered v is IDENTICAL across the comb (the rigid-slide
  // proof: the same v falls out of every line because the slide is fractional).
  {
    const rng = makeRng(0x5C1E);
    let maxRel = 0, maxSpread = 0;
    for (let i = 0; i < 400; i++){
      const vTrue = (rng() * 2 - 1) * V_CAP_KMS;
      const recovered = [];
      for (const L of comb){
        const obs = shiftedNm(L.restNm, vTrue);
        const back = recoverVKms(L.restNm, obs);
        recovered.push(back);
        if (Math.abs(vTrue) > 1e-9) maxRel = Math.max(maxRel, Math.abs(back - vTrue) / Math.abs(vTrue));
      }
      // spread across the comb: all four lines must report the SAME v (rigid slide)
      const lo = Math.min.apply(null, recovered), hi = Math.max.apply(null, recovered);
      maxSpread = Math.max(maxSpread, Math.abs(hi - lo));
    }
    ck('a · math round-trip v→λ→v < 1e-9 rel, identical across the comb (rigid slide)',
       maxRel < 1e-9 && maxSpread < 1e-6, 'maxRel=' + maxRel.toExponential(2) + ' spread=' + maxSpread.toExponential(2) + ' km/s');
  }

  // (a′) FULL PIXEL CHAIN — separately-asserted, honestly-LOOSER tolerance. The
  // eye does NOT read v to ppm; the page's pixel→λ→v chain reads it to the GRID.
  // v→obsNm→wavelengthToX→quantize→xToWavelength→recoverVKms agrees with v to a
  // velocity tolerance derived from the grid resolution (documenting the floor).
  {
    const rng = makeRng(98765);
    const x0 = 0, w = 1200;                     // a representative band width (px)
    // grid step in nm maps to a v step of ~ c·GRID_NM/λ; bound it generously.
    const tolKms = C_KMS * (GRID_NM + (LAM_MAX - LAM_MIN) / w) / LAM_MIN * 2;
    let maxErr = 0;
    for (let i = 0; i < 400; i++){
      const vTrue = (rng() * 2 - 1) * V_CAP_KMS;
      const L = comb[i % 4];
      const obs = shiftedNm(L.restNm, vTrue);
      const px = wavelengthToX(obs, x0, w);
      // the crosshair lands on rest-λ for the guess; here we read the OBS pixel back
      const nmBack = quantizeNm(xToWavelength(px, x0, w));
      const vBack = recoverVKms(L.restNm, nmBack);
      maxErr = Math.max(maxErr, Math.abs(vBack - vTrue));
    }
    ck('a′ · pixel chain v→x→grid→λ→v within grid resolution (measurement floor, NOT ppm)',
       maxErr < tolKms, 'maxErr=' + maxErr.toFixed(1) + ' km/s ≤ ' + tolKms.toFixed(1));
  }

  // (b) NEGATIVE CONTROL: v=0 ⇒ shiftedNm === restNm EXACTLY (===, not <ε) for all
  // four lines; recoverVKms(rest,rest) === 0; the band wash strength is 0.
  {
    let exact = true, recoverZero = true;
    for (const L of comb){
      if (shiftedNm(L.restNm, 0) !== L.restNm) exact = false;
      if (recoverVKms(L.restNm, L.restNm) !== 0) recoverZero = false;
    }
    const wash = washStrength(0);
    ck('b · stationary star: λ_obs === λ_rest exactly, v===0, wash===0 (negative control)',
       exact && recoverZero && wash === 0, 'exact=' + exact + ' v0=' + recoverZero + ' wash=' + wash);
  }

  // (c) SIGN: v>0 ⇒ obs>rest (redshift, comb RIGHT, warm); v<0 ⇒ obs<rest (blue,
  // LEFT, cool). Asserted as STRICT monotonicity of shiftedNm in v, AND the
  // colour-sign (washStrength's sign) never disagreeing with the position-sign.
  {
    let mono = true, colourOk = true;
    const STEPS = 100;
    for (const L of comb){
      let prev = -Infinity;
      for (let k = -STEPS; k <= STEPS; k++){
        const v = (k / STEPS) * V_CAP_KMS;        // exact 0 at k=0, no float drift
        const o = shiftedNm(L.restNm, v);
        if (!(o > prev)) mono = false;            // strictly increasing in v
        prev = o;
        if (k === 0) continue;                    // rest: no shift, no sign to compare
        const posSign = Math.sign(o - L.restNm);   // + red(right), − blue(left)
        const colSign = Math.sign(washStrength(v));// + warm/red, − cool/blue
        if (posSign !== colSign) colourOk = false;
      }
    }
    ck('c · sign: shiftedNm strictly ↑ in v; colour-sign === position-sign (red=recede,blue=approach)',
       mono && colourOk, 'mono=' + mono + ' colour=' + colourOk);
  }

  // (d) SINGLE-SOURCE PARITY (anti-circularity): the rest comb === the imported
  // balmerWavelengthAirNm(3..6) to <1e-9 — never a re-typed line literal.
  {
    let maxD = 0;
    for (const L of comb) maxD = Math.max(maxD, Math.abs(L.restNm - balmerWavelengthAirNm(L.n)));
    ck('d · single-source: rest comb === imported balmerWavelengthAirNm(3..6) (no re-typed literal)',
       maxD < 1e-9, 'maxΔ=' + maxD.toExponential(2) + ' nm');
  }

  // (f) SCORING HONESTY: score is a pure function of |v_guess − v_true|; thresholds
  // live HERE (testable). A guess equal to the true v is a BULLSEYE; a wild guess
  // is TRY AGAIN; v=0 stationary is winnable (guess 0 ⇒ bullseye via the floor).
  {
    const t1 = scoreGuess(1000, 1000);                       // exact ⇒ bullseye
    const t2 = scoreGuess(0, 0);                             // stationary, exact ⇒ bullseye
    const t3 = scoreGuess(V_CAP_KMS, -V_CAP_KMS);            // opposite extreme ⇒ try-again
    const pure = scoreGuess(1234, 1000).errKms === 234;      // pure function of the gap
    ck('f · scoring: pure fn of |Δv|, exact⇒bullseye, stationary winnable, far⇒try-again',
       t1.band === 'bullseye' && t2.band === 'bullseye' && t3.band === 'try-again' && pure,
       'exact=' + t1.band + ' v0=' + t2.band + ' far=' + t3.band);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// Band-tint wash strength: a MOOD cue (not a claim). Signed in [−1,1]: + warm
// (redshift), − cool (blueshift), 0 at rest. Magnitude grows with |v|, capped.
// The LINE POSITIONS carry the physics; this only tints the whole plate.
function washStrength(vKms){
  const beta = vKms / C_KMS;
  const x = beta / V_CAP_FRAC;                  // normalise to the cap
  return Math.max(-1, Math.min(1, x));
}
// ===== END DRIFTING-STAR CORE =====

export {
  C_KMS, V_CAP_FRAC, V_CAP_KMS, LAM_MIN, LAM_MAX, GRID_NM, SCORE,
  balmerRestComb, shiftedNm, recoverVKms, shiftedNmRel,
  vKmsToBeta, betaToVKms, wavelengthToX, xToWavelength, quantizeNm,
  scoreGuess, washStrength, makeRng, runSelfTest,
};
