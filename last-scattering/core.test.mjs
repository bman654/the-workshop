// ============================================================================
//  Node twin for THE SKY THAT WAS ONCE FOG core (last scattering / cosmology).
//  Zero-dep.  Run:  node last-scattering/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM a SECOND way, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) re-derive T_obs = T_rec/(1+z) against a hand-computed 1+z, INDEPENDENT of
//       skyTemperature (a second witness the cooling is the metric stretch).
//   (2) PARITY re-proof — import temperature() DIRECTLY from first-light here too and
//       assert skyTemperature(z,Tr) === temperature(1+z,Tr) over a wide sweep. The
//       readout is First Light's own function, not a coincidentally-close copy.
//   (3) spot values: z=1100 ⇒ 2.7248 K; z=1 ⇒ 1500 K; the T·(1+z) invariant exact.
//   (4) frozen metric z=0 ⇒ T_REC exactly (no Doppler term); monotone-decreasing.
//   (MOTTLE) the anisotropy field: RMS ≈ 1e-5 (within tol) and zero-mean over the
//       sphere; deterministic across two calls; never feeds the temperature law.
//   (BYTE-TWIN) index.html's inlined LAST-SCATTERING CORE slab is byte-identical
//       (indentation-normalised) to core.mjs, and the char counts match.
// ============================================================================

import {
  SCENE,
  skyTemperature, stretch,
  blackbodyRGB, domeColour,
  mottle, mottleRaw, MOTTLE_STATS,
  runSelfTest,
} from './core.mjs';
// PARITY re-proof: import temperature DIRECTLY from First Light in the TEST too.
import { temperature as flTemperature, onePlusZ as flOnePlusZ } from '../first-light/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here ───
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (1) re-derive T_obs = T_rec/(1+z) against a HAND-computed 1+z ───────────────
{
  let worstT = 0, worstS = 0;
  for (let k = 0; k <= 110; k++){
    const z = 0.1 + k * 12;                       // a wide z sweep, well past z_rec
    const onePlusZhand = 1 + z;                   // hand-computed, no core call
    const Tobs = SCENE.T_REC / onePlusZhand;      // hand-computed expected
    worstT = Math.max(worstT, Math.abs(skyTemperature(z) - Tobs));
    worstS = Math.max(worstS, Math.abs(stretch(z) - onePlusZhand));
  }
  check('(1) T_obs === T_rec/(1+z) re-derived against a hand-computed 1+z, INDEPENDENT of skyTemperature (<1e-9)',
    worstT < EPS && worstS < EPS, 'worst |ΔT| ' + worstT.toExponential(2) + ', worst |Δ(1+z)| ' + worstS.toExponential(2));
}

// ── (2) PARITY re-proof — skyTemperature === first-light's temperature() ───────
{
  let worst = 0;
  for (let k = 0; k <= 120; k++){
    const z = k * 11.5;
    for (const Tr of [SCENE.T_REC, 1.0, 2700, 13.6]){
      worst = Math.max(worst, Math.abs(skyTemperature(z, Tr) - flTemperature(1 + z, Tr)));
    }
  }
  check('(2) PARITY: skyTemperature(z,Tr) === first-light temperature(1+z,Tr) over a wide sweep — the readout IS First Light',
    worst < EPS, 'worst ' + worst.toExponential(2));
  // the wing-twin tripwire, re-asserted against first-light's own onePlusZ
  check('(2b) wing-twin tripwire: first-light onePlusZ(1/1101,1) === 1101 (fires RED if its law moves)',
    Math.abs(flOnePlusZ(1 / 1101, 1) - 1101) < EPS, 'onePlusZ ' + flOnePlusZ(1 / 1101, 1).toFixed(9));
}

// ── (3) spot values + the T·(1+z) invariant exact ──────────────────────────────
{
  const t1100 = skyTemperature(1100);
  const t1 = skyTemperature(1);
  check('(3a) spot z=1100 ⇒ 2.7248 K (≈2.725 headline)', Math.abs(t1100 - 2.7248) < 1e-3, 'T = ' + t1100.toFixed(5) + ' K');
  check('(3b) spot z=1 ⇒ 1500 K exactly (T_rec/2)', Math.abs(t1 - 1500) < EPS, 'T = ' + t1.toFixed(6) + ' K');
  // T·(1+z) invariant === T_REC at every z to machine ε (the dome-side mirror of T·a)
  let invWorst = 0;
  for (let k = 0; k <= 80; k++){
    const z = k * 17;
    invWorst = Math.max(invWorst, Math.abs(skyTemperature(z) * (1 + z) - SCENE.T_REC));
  }
  check('(3c) T·(1+z) === T_rec invariant at every z (<1e-9, EXACT)', invWorst < EPS, 'worst ' + invWorst.toExponential(2));
  // the JUMP-TO-TODAY z lands EXACTLY on 2.725
  check('(3d) Z_TODAY lands skyTemperature EXACTLY on 2.725 K', Math.abs(skyTemperature(SCENE.Z_TODAY) - 2.725) < 1e-12,
    'T(Z_TODAY) = ' + skyTemperature(SCENE.Z_TODAY).toFixed(12));
}

// ── (4) frozen metric (z=0) ⇒ T_REC exactly; monotone-decreasing ───────────────
{
  let frozenWorst = 0;
  for (let k = 0; k <= 50; k++){
    const Tr = 500 + k * 80;
    frozenWorst = Math.max(frozenWorst, Math.abs(skyTemperature(0, Tr) - Tr));
  }
  check('(4a) frozen metric z=0 ⇒ skyTemperature === T_rec EXACTLY (no Doppler / recession term)', frozenWorst === 0,
    'worst dev ' + frozenWorst.toExponential(2));
  let monotone = true, prev = Infinity, viol = '';
  for (let k = 0; k <= 400; k++){
    const z = SCENE.Z_MAX * (k / 400);
    const T = skyTemperature(z);
    if (!(T < prev)){ monotone = false; viol = 'at z=' + z.toFixed(2); break; }
    prev = T;
  }
  check('(4b) skyTemperature STRICTLY monotone-decreasing in z (the whole dome cools in lockstep)', monotone, viol);
  // isotropy is structural: skyTemperature takes NO angular argument — same T every direction
  check('(4c) isotropy structural: skyTemperature has no angular argument (every direction reads the identical T)',
    skyTemperature.length === 2, 'arity ' + skyTemperature.length);
}

// ── (MOTTLE) the anisotropy texture: RMS ≈ 1e-5, zero-mean, deterministic ───────
{
  // measure RMS + mean over a solid-angle-weighted sphere grid (cos(lat) weight)
  let sw = 0, swv = 0, swv2 = 0;
  const NLON = 120, NLAT = 60;
  for (let j = 0; j < NLAT; j++){
    const lat = -Math.PI / 2 + (j + 0.5) / NLAT * Math.PI;
    const w = Math.cos(lat);
    for (let i = 0; i < NLON; i++){
      const lon = (i + 0.5) / NLON * 2 * Math.PI;
      const v = mottle(lon, lat);
      sw += w; swv += w * v; swv2 += w * v * v;
    }
  }
  const mean = swv / sw;
  const rms = Math.sqrt(Math.max(swv2 / sw - mean * mean, 0));
  // within 5% of 1e-5 (the grid here differs from the core's calibration grid, so a
  // small tolerance is honest — the amplitude is right to a part in 20)
  check('(MOTTLE-a) anisotropy RMS ≈ 1e-5 (1 part in 10⁵)', Math.abs(rms - SCENE.ANISO_RMS) < 0.05 * SCENE.ANISO_RMS,
    'rms ' + rms.toExponential(3) + ' vs ' + SCENE.ANISO_RMS.toExponential(0));
  check('(MOTTLE-b) anisotropy zero-mean over the sphere', Math.abs(mean) < 1e-3 * SCENE.ANISO_RMS,
    '|mean| ' + Math.abs(mean).toExponential(2));
  // deterministic: two calls agree exactly
  let detOk = true;
  for (let t = 0; t < 50; t++){
    const lon = (t * 0.7) % (2 * Math.PI), lat = -1 + (t * 0.13) % 2;
    if (mottle(lon, lat) !== mottle(lon, lat)) detOk = false;
  }
  check('(MOTTLE-c) deterministic (RNG-free): two calls agree exactly', detOk);
  // claim-free: mottle is bounded small and never enters skyTemperature
  let maxAbs = 0;
  for (let j = 0; j < NLAT; j++){
    const lat = -Math.PI / 2 + (j + 0.5) / NLAT * Math.PI;
    for (let i = 0; i < NLON; i++){
      const lon = (i + 0.5) / NLON * 2 * Math.PI;
      maxAbs = Math.max(maxAbs, Math.abs(mottle(lon, lat)));
    }
  }
  check('(MOTTLE-d) anisotropy is a small bounded modulation (peak ≲ 5×RMS), a texture not a claim', maxAbs < 5 * SCENE.ANISO_RMS,
    'peak ' + maxAbs.toExponential(2));
}

// ── (COLOUR) the perceptual map: no RGB asserted, just sanity that it paints ────
{
  // hot dome reads luminous (lum 1, bluish-white near 3000 K); cold dome reads dim cream
  const hot = domeColour(3000), cold = domeColour(2.725);
  const hotOk = hot.lum === 1.0 && hot.rgb.every(c => c >= 0 && c <= 255);
  const coldOk = cold.lum < 0.2 && cold.rgb.every(c => c >= 0 && c <= 255);
  check('(COLOUR) domeColour: hot is luminous (lum=1), cold is a dim cream wash (lum<0.2) — perceptual, no physics claim',
    hotOk && coldOk, 'hot lum ' + hot.lum.toFixed(2) + ' rgb ' + hot.rgb.map(c => c.toFixed(0)) + ' · cold lum ' + cold.lum.toFixed(2) + ' rgb ' + cold.rgb.map(c => c.toFixed(0)));
  // blackbody floors at the ember (no negative channels at the floor)
  check('(COLOUR-b) blackbodyRGB floors cleanly at the ~1000 K ember (channels in [0,255])',
    blackbodyRGB(1000).every(c => c >= 0 && c <= 255), 'rgb(1000K) ' + blackbodyRGB(1000).map(c => c.toFixed(0)));
}

// ── BYTE-TWIN PARITY: the page's inlined LAST-SCATTERING CORE slab === core.mjs ──
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === LAST-SCATTERING CORE BEGIN ===';
  const END = '// === LAST-SCATTERING CORE END ===';
  function region(text){
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  }
  function norm(s){
    return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  }
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('byte-parity: index.html inlined core === core.mjs (indentation-normalised)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('chars ' + norm(pageRegion).length + ' vs ' + norm(coreRegion).length) : 'index.html not built yet (run forge)');
}

console.log('\nThe Sky That Was Once Fog — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
