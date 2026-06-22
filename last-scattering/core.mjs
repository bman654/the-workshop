// ============================================================================
//  THE SKY THAT WAS ONCE FOG — the cosmology wing's ONE last-scattering core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This is the
//  THIRD room of the cosmology wing: First Light dilates the patch · The Fog That
//  Cleared recombines it · and HERE we stand inside the light it released — the
//  all-sky cosmic microwave background, the oldest photons, the wall of every
//  direction.
//
//  THE ONE IDEA — THE COOLING IS THE METRIC STRETCH, NOT A SOURCE MOVING. At
//  recombination (z ≈ 1100) the just-freed radiation was a ~3000 K white wall. The
//  universe then expanded by a factor 1+z, and the SAME metric law that stretches a
//  photon's wavelength stretches the whole blackbody spectrum: every direction cools
//  in lockstep by
//        T_obs = T_rec / (1 + z),      1 + z = a_now / a_then,
//  with NO Doppler / recession term anywhere — exactly as First Light's redshift is
//  geometry, not velocity. Pull the brass redshift collar UP (toward today) and the
//  whole dome cools from a blinding white wall to the faint 2.725 K cream we measure;
//  the ~1-part-in-10⁵ anisotropy freckles emerge from under the glare as it lifts.
//
//  ONE PHYSICS, ONE FUNCTION. skyTemperature() is NOT a new formula — it is a thin
//  call into First Light's OWN temperature(): T_obs = temperature(1+z, T_rec). The
//  picture you stand inside and the proof in the pill are the SAME line of code as
//  the wing's first room. The Node twin imports temperature() from first-light and
//  asserts skyTemperature() === temperature(1+z, ·) — parity, not a re-derivation.
//
//  THE EXACT CLAIM is the invariant, not the headline. T_REC = 3000 K and
//  Z_REC = 1100 are ILLUSTRATIVE scene constants (like recombination's SAHA_A): we
//  do NOT defend 2.725 as derived-exact. 3000/1101 = 2.7248 K, so the EXACT,
//  to-machine-ε claim is the T·(1+z) invariant (the dome-side mirror of First
//  Light's T·a); the 2.725 K headline is that value rounded (a < 2e-3 agreement).
//
//  THE NEG-CONTROL — NO DOPPLER TERM (inherited from the wing). Freeze the metric
//  (z = 0) and the sky reads T_REC exactly, 1+z === 1, the worst deviation across a
//  held sweep is EXACTLY 0. There is no angular argument to skyTemperature: every
//  direction reads the identical T, so the glow is isotropic by construction. The
//  room never calls recession(). The anisotropy is a separate, claim-free texture
//  (a ±1e-5 modulation on the colour) that NEVER feeds the temperature law.
// ============================================================================

// IMPORT, never re-type — First Light is the LITERAL source of truth for the
// temperature number. These three resolve to first-light's exports in Node; on the
// page they resolve to the same functions, inlined into scope by the forge build
// (see index.src.html). They sit OUTSIDE the CORE sentinels so the byte-twin region
// is identical to the page's inlined slab (where forge strips this import line).
import { temperature, onePlusZ, redshift } from '../first-light/core.mjs';

// === LAST-SCATTERING CORE BEGIN ===
"use strict";

// ── THE SHIPPED SCENE ───────────────────────────────────────────────────────
// T_REC and Z_REC are ILLUSTRATIVE scene constants (like recombination's SAHA_A);
// they set where the dome blazes and how far it cools — they defend NO exact
// recombination physics. The exact claim is T·(1+z); 2.725 is the rounded headline.
const SCENE = {
  T_REC: 3000,        // illustrative last-scattering temperature, kelvin (the white wall)
  T_NOW: 2.725,       // the headline temperature we measure today (3000/1101 = 2.7248, a <2e-3 round)
  Z_REC: 1100,        // illustrative redshift of last scattering
  Z_MAX: 1400,        // the collar's high-z end (meaningful landing well inside)
  Z_TODAY: 1099.9174311926606,  // 3000/2.725 − 1; lands skyTemperature EXACTLY on 2.725 (the JUMP-TO-TODAY snap)
  ANISO_RMS: 1e-5,    // the RMS amplitude of the CMB anisotropy (1 part in 10⁵)
  CMB_CREAM: [255, 233, 207],   // #ffe9cf — the faint cream wash of the cooled dome (wing-shared)
};

// ── THE COOLING LAW — the metric stretch, via First Light's OWN temperature() ──
// T_obs = T_rec / (1 + z) === temperature(1+z, T_rec). The dome's colour and the
// pill's number are this SAME call — picture and proof are one function.
function skyTemperature(z, Trec){
  return temperature(1 + z, Trec == null ? SCENE.T_REC : Trec);
}

// 1 + z = a_now / a_then, via First Light (a_now=1, a_then = 1/(1+z)). The stretch
// the whole spectrum undergoes between last scattering and today.
function stretch(z){
  return onePlusZ(1 / (1 + z), 1);
}

// ── COLOUR — the cosmology wing's first shared Planckian-locus authority ──────
// This is PERCEPTUAL colour. It carries NO physics claim and the self-test never
// asserts an RGB. (The temperature numbers above are the claim; this paints them.)
//
// blackbodyRGB: the Tanner-Helland piecewise polynomial (the exact one shipped in
// relativity/starbow). Floors at a ~1000 K ember; well-behaved over ~1000–40000 K.
function blackbodyRGB(T){
  const t = T / 100;
  let r, g, b;
  if (t <= 66){
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const cl = x => Math.max(0, Math.min(255, x));
  return [cl(r), cl(g), cl(b)];
}

function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function mix3(a, b, f){
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// domeColour — the TWO-STAGE honest map, keyed off the OBSERVED temperature Tobs
// (NOT a slider fraction). Above ~1000 K the dome shows luminous Planckian colour at
// full brightness; below, it fades through ember → faint CMB cream as it darkens, so
// the cooled sky reads as the dim cream wash we actually measure — never a bright lie.
function domeColour(Tobs){
  if (Tobs >= 1000){
    return { rgb: blackbodyRGB(Tobs), lum: 1.0 };
  }
  // log-fade from 1000 K (ember, f=0) down to 2.725 K (cream, f=1)
  const f = clamp01((Math.log(1000) - Math.log(Math.max(Tobs, 2.0))) /
                    (Math.log(1000) - Math.log(2.725)));
  return { rgb: mix3(blackbodyRGB(1000), SCENE.CMB_CREAM, f), lum: 1.0 - 0.86 * f };
}

// ── THE ANISOTROPY FIELD — deterministic, RNG-free, claim-free texture ────────
// A fixed sum of low-order real spherical-harmonic lobes plus a fine ~1° freckle,
// rescaled to be ZERO-MEAN over the sphere with RMS === SCENE.ANISO_RMS (1e-5). The
// picture and any test read the IDENTICAL field. It is a RELATIVE ±1e-5 modulation
// applied ON TOP of the dome colour (most visible when the dome is cold/dim); it
// NEVER feeds skyTemperature — the temperature law has no angular argument.
//
// lon ∈ [0, 2π), lat ∈ [-π/2, π/2]. The raw shape is fixed; MOTTLE_NORM (computed
// once below) rescales it to exactly unit RMS so the *=ANISO_RMS lands on spec.
function mottleRaw(lon, lat){
  const sLat = Math.sin(lat), cLat = Math.cos(lat);
  // a few large lobes (dipole-ish + quadrupole-ish + a couple of higher modes)
  let v = 0;
  v += 1.00 * cLat * Math.cos(lon);                 // ℓ=1 m=1
  v += 0.70 * sLat;                                  // ℓ=1 m=0
  v += 0.55 * (3 * sLat * sLat - 1);                 // ℓ=2 m=0
  v += 0.45 * cLat * cLat * Math.cos(2 * lon);       // ℓ=2 m=2
  v += 0.30 * cLat * sLat * Math.sin(lon);           // ℓ=2 m=1
  v += 0.22 * Math.pow(cLat, 3) * Math.cos(3 * lon); // ℓ=3 m=3
  // the fine ~1° freckle (a high-order ripple; the speckly cold spots)
  v += 0.16 * Math.cos(18 * lon) * Math.cos(14 * lat);
  v += 0.13 * Math.sin(23 * lon + 1.7) * Math.cos(19 * lat - 0.4);
  return v;
}

// Compute the raw field's mean and RMS over an equal-area-ish sphere grid ONCE, so
// mottle() can be exactly zero-mean and unit-RMS (then scaled to ANISO_RMS). The grid
// weights each sample by cos(lat) (the solid-angle element) so "over the sphere" is
// honest, not a lon/lat-rectangle average.
function mottleStats(){
  let sw = 0, swv = 0, swv2 = 0;
  const NLON = 96, NLAT = 48;
  for (let j = 0; j < NLAT; j++){
    const lat = -Math.PI / 2 + (j + 0.5) / NLAT * Math.PI;
    const w = Math.cos(lat);
    for (let i = 0; i < NLON; i++){
      const lon = (i + 0.5) / NLON * 2 * Math.PI;
      const v = mottleRaw(lon, lat);
      sw += w; swv += w * v; swv2 += w * v * v;
    }
  }
  const mean = swv / sw;
  const variance = swv2 / sw - mean * mean;
  return { mean, rms: Math.sqrt(Math.max(variance, 0)) };
}
const MOTTLE_STATS = mottleStats();

// mottle — the shipped anisotropy: zero-mean over the sphere, RMS === ANISO_RMS.
function mottle(lon, lat){
  return ((mottleRaw(lon, lat) - MOTTLE_STATS.mean) / MOTTLE_STATS.rms) * SCENE.ANISO_RMS;
}

// ── THE SELF-TEST — the dome proves its own claim ───────────────────────────
// FOUR claims, all <1e-9 where exact:
//  A · COOLING IS THE METRIC STRETCH: skyTemperature(z) === T_REC/(1+z) AND
//      stretch(z) === 1+z over a z∈{0..1100} sweep.
//  B · PARITY with First Light: skyTemperature(z,Tr) === temperature(1+z,Tr) — the
//      readout IS first-light's temperature(); plus the WING-TWIN TRIPWIRE
//      onePlusZ(1/1101,1) === 1101 (fires RED if first-light's law ever moves).
//  C · LANDS ON 2.725 K AT z≈1100: |skyTemperature(1100) − 2.725| < 2e-3 (headline)
//      AND the EXACT |skyTemperature(1100)·1101 − 3000| < 1e-9 (T·(1+z) invariant).
//  D · NO DOPPLER TERM: frozen metric (z=0) ⇒ skyTemperature(0) === T_REC EXACTLY,
//      1+z === 1, worst dev === 0; PLUS skyTemperature monotone-decreasing in z
//      (the whole dome cools in lockstep; isotropy is structural — no angular arg).
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const TOL = 1e-9;
  const { T_REC, Z_REC } = SCENE;

  // ── CLAIM A — COOLING IS THE METRIC STRETCH ────────────────────────────────
  let aTworst = 0, aSworst = 0;
  for (let k = 0; k <= 60; k++){
    const z = (Z_REC) * (k / 60);
    aTworst = Math.max(aTworst, Math.abs(skyTemperature(z) - T_REC / (1 + z)));
    aSworst = Math.max(aSworst, Math.abs(stretch(z) - (1 + z)));
  }
  const cA = aTworst < TOL && aSworst < TOL;
  log('A · cooling is the metric stretch: T_obs === T_rec/(1+z) AND stretch(z) === 1+z over z∈[0,1100] (<1e-9)',
      cA, 'worst |T−T_rec/(1+z)| ' + aTworst.toExponential(2) + ', worst |stretch−(1+z)| ' + aSworst.toExponential(2));

  // ── CLAIM B — PARITY with First Light + the wing-twin tripwire ─────────────
  let bWorst = 0;
  for (let k = 0; k <= 60; k++){
    const z = Z_REC * (k / 60);
    for (const Tr of [T_REC, 1.0, 2700]){
      bWorst = Math.max(bWorst, Math.abs(skyTemperature(z, Tr) - temperature(1 + z, Tr)));
    }
  }
  const tripwire = onePlusZ(1 / 1101, 1);          // === 1101 if first-light's law holds
  const cB = bWorst < TOL && Math.abs(tripwire - 1101) < TOL;
  log('B · parity: skyTemperature(z,Tr) === temperature(1+z,Tr) (the readout IS First Light) + wing-twin tripwire onePlusZ(1/1101,1)===1101',
      cB, 'parity worst ' + bWorst.toExponential(2) + ', tripwire ' + tripwire.toFixed(9));

  // ── CLAIM C — LANDS ON 2.725 K AT z≈1100 (headline + EXACT invariant) ──────
  const Tat = skyTemperature(Z_REC);
  const headline = Math.abs(Tat - 2.725) < 2e-3;
  const invariant = Math.abs(skyTemperature(Z_REC) * (1 + Z_REC) - T_REC) < TOL;
  const cC = headline && invariant;
  log('C · lands on 2.725 K at z=1100: |T(1100) − 2.725| < 2e-3 (headline) AND |T(1100)·1101 − 3000| < 1e-9 (T·(1+z) invariant, EXACT)',
      cC, 'T(1100) ' + Tat.toFixed(5) + ' K, |T·(1+z) − T_rec| ' + Math.abs(Tat * (1 + Z_REC) - T_REC).toExponential(2));

  // ── CLAIM D — NO DOPPLER TERM: frozen metric + monotone-decreasing ─────────
  let frozenWorst = 0;
  for (let k = 0; k <= 40; k++){
    // freeze the metric: z=0 means a_then=a_now, no stretch, no shift, for any Trec
    const Tr = 1000 + k * 100;
    frozenWorst = Math.max(frozenWorst, Math.abs(skyTemperature(0, Tr) - Tr), Math.abs(stretch(0) - 1));
  }
  // monotone-decreasing: every step up in z strictly cools the WHOLE dome (lockstep)
  let monotone = true, prev = Infinity;
  for (let k = 0; k <= 200; k++){
    const z = SCENE.Z_MAX * (k / 200);
    const T = skyTemperature(z);
    if (!(T < prev)){ monotone = false; break; }
    prev = T;
  }
  const cD = frozenWorst === 0 && monotone;
  log('D · NO Doppler term: frozen metric (z=0) ⇒ T === T_rec EXACTLY, 1+z === 1; AND T monotone-decreasing in z (whole dome cools in lockstep; isotropy structural)',
      cD, 'frozen worst ' + frozenWorst.toExponential(2) + ', monotone ' + monotone);

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === LAST-SCATTERING CORE END ===

export {
  // re-exported from First Light so the page inlines ONE chain of physics
  temperature, onePlusZ, redshift,
  SCENE,
  skyTemperature, stretch,
  blackbodyRGB, domeColour, mix3, clamp01,
  mottle, mottleRaw, mottleStats, MOTTLE_STATS,
  runSelfTest,
};
