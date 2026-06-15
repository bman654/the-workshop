// ============================================================================
//  The Spectroscope — the physics-truth CORE (extracted, sole authority).
//  Pure, dependency-free. This file is the SOLE AUTHORITY for the Rydberg /
//  Balmer numbers; spectroscope/index.html inlines a BYTE-TWIN of the block
//  between the sentinels below (the partition.html / plumbline pattern), and a
//  3-line parity test in the page proves the inlined copy still computes the
//  SAME wavelengths. The Rydberg bench (rydberg/) imports {RYDBERG_H,
//  balmerWavelengthNm, balmerWavelengthAirNm} from HERE, so the constant the
//  blind line-fitter recovers and the constant it is graded against are ONE
//  value — never two re-typed copies (the anti-circularity proof).
//
//  THE NUMBERS — R_H is COMPUTED from three CODATA inputs + the reduced-mass
//  formula, never hard-coded; the textbook 656.3/486.1/434.0/410.2 nm are AIR
//  wavelengths (vacuum / n_air), the Rydberg formula yields VACUUM.
// ============================================================================

// ===== SPECTROSCOPE PHYSICS CORE (inlined byte-twin) BEGIN =====
// ---------- physical constants ---------------------------------------------
// R∞ = the Rydberg constant for infinite nuclear mass (CODATA). The Balmer
// formula needs the HYDROGEN Rydberg R_H = R∞·M/(M+mₑ) (reduced-mass corrected).
var RYDBERG_INF = 1.0973731568e7;                 // /m  (R∞, infinite nuclear mass)
var M_PROTON    = 1.67262192369e-27;              // kg
var M_ELECTRON  = 9.1093837015e-31;               // kg
// Hydrogen Rydberg = R∞ scaled by the proton/electron reduced mass. Computed,
// not hard-coded: ≈ 1.09677583e7 /m. Using R∞ directly (the "infinite mass"
// value) understates λ by the reduced-mass factor and misses Hα by ~0.19 nm.
var RYDBERG_H = RYDBERG_INF * M_PROTON / (M_PROTON + M_ELECTRON);
// Refractive index of standard air (dry, ~15 °C). The textbook Balmer values
// 656.3/486.1/434.0/410.2 nm are AIR wavelengths; the Rydberg formula yields
// VACUUM wavelengths, so we divide by n_air to compare like-for-like.
var N_AIR = 1.000277;

// ---------- Rydberg / Balmer -------------------------------------------------
// Balmer series: transitions n -> 2.  1/λ = R_H (1/2² − 1/n²).  Returns the
// VACUUM wavelength λ in nm. n must be an integer >= 3. (e.g. Hα → 656.29 nm.)
function balmerWavelengthNm(n){
  var invLambda = RYDBERG_H * (1/4 - 1/(n*n));   // /m
  var lambdaM = 1/invLambda;                      // m  (vacuum)
  return lambdaM * 1e9;                           // nm
}
// Air wavelength of a Balmer line — what a textbook table lists (vacuum / n_air).
function balmerWavelengthAirNm(n){
  return balmerWavelengthNm(n) / N_AIR;
}
// ===== SPECTROSCOPE PHYSICS CORE END =====

export {
  RYDBERG_INF, M_PROTON, M_ELECTRON, RYDBERG_H, N_AIR,
  balmerWavelengthNm, balmerWavelengthAirNm,
};
