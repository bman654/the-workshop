// ============================================================================
//  Node twin for WHY THE SKY IS BLUE core (the Rayleigh scattering tank).
//  Zero-dep.  Run:  node why-the-sky-is-blue/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM a SECOND way, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) INDEPENDENT RE-DERIVATION: recompute (700/400)⁴, the centroid, and the
//       Beer–Lambert values BY HAND (no core call) and assert equality.
//   (2) STRONGER SWEEPS: a wider L range, multiple turbidities, and SEVERAL
//       illuminant shapes (flat / red-tilted / blue-tilted) — the monotone-
//       reddening holds for ALL of them (it is the PHYSICS, not the solar curve).
//   (3) THE COVARIANCE IDENTITY taken to the limit: cov<0 everywhere AND
//       dD/dL = −Cov_w(λ,c) to machine tolerance under a tiny step.
//   (BYTE-TWIN) index.html's inlined WHY-THE-SKY-IS-BLUE CORE slab is byte-
//       identical (indentation-normalised) to core.mjs, and the char counts match.
// ============================================================================

import {
  SCENE,
  rayleighCrossSection, scatterRatio, transmit, airmass,
  VISIBLE, solarSpectrum, sideScatteredSpectrum, transmittedSpectrum,
  dominantWavelength, weightedMoments,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// helper: centroid of an arbitrary {lam, I} spectrum, computed independently here
function centroidHand(pairs){
  let n = 0, d = 0;
  for (const { lam, I } of pairs){ n += lam * I; d += I; }
  return d > 0 ? n / d : 0;
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here ───
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (1) INDEPENDENT RE-DERIVATION — by hand, no core call where it counts ──────
{
  // (1a) (700/400)⁴ by hand vs scatterRatio
  const byHand = (700 / 400) * (700 / 400) * (700 / 400) * (700 / 400);
  check('(1a) scatterRatio(400,700) === (700/400)⁴ re-derived by hand === 9.37890625 EXACT',
    scatterRatio(400, 700) === byHand && byHand === 9.37890625, 'byHand ' + byHand);

  // (1b) Beer–Lambert values by hand vs transmit(), across λ and L
  let blWorst = 0;
  for (const lam of [380, 450, 550, 650, 700]){
    for (const L of [0, 1, 5, 12, 30]){
      const expected = Math.exp(-SCENE.K_REF * Math.pow(lam, -4) * L);   // I0=1
      blWorst = Math.max(blWorst, Math.abs(transmit(1, lam, SCENE.K_REF, L) - expected));
    }
  }
  check('(1b) transmit(I0,λ,k,L) === I0·exp(−k·λ⁻⁴·L) re-derived by hand (<1e-9)', blWorst < EPS,
    'worst Δ ' + blWorst.toExponential(2));

  // (1c) the side-glow centroid re-summed by hand from I0·(550/λ)⁴ vs dominantWavelength
  const glowHand = centroidHand(solarSpectrum().map(({ lam, I0 }) => ({ lam, I: I0 * Math.pow(SCENE.LAM_REF / lam, 4) })));
  const glowCore = dominantWavelength(sideScatteredSpectrum());
  check('(1c) side-glow centroid re-summed by hand === dominantWavelength(sideScattered) and lands in the blue band (<500)',
    Math.abs(glowHand - glowCore) < 1e-9 && glowCore < SCENE.BLUE_HI, 'hand ' + glowHand.toFixed(3) + ' vs core ' + glowCore.toFixed(3));

  // (1d) airmass: zenith ⇒ 1; toward the horizon it grows and clamps at L_MAX
  const up = airmass(0);
  const low = airmass(Math.PI / 4);
  const horizon = airmass(Math.PI / 2);   // beyond the clamp angle ⇒ exactly L_MAX
  check('(1d) airmass: straight-up === 1, sec(45°) === √2, horizon clamps to L_MAX EXACTLY',
    Math.abs(up - 1) < EPS && Math.abs(low - Math.SQRT2) < EPS && Math.abs(horizon - SCENE.L_MAX) < 1e-7,
    'up ' + up.toFixed(6) + ', 45° ' + low.toFixed(6) + ', horizon ' + horizon.toFixed(4));
}

// ── (2) STRONGER SWEEPS — monotone reddening under MANY illuminants & turbidities ─
{
  // build a transmitted spectrum from an ARBITRARY illuminant I0(λ), so we prove the
  // reddening is the physics, not the shipped solar curve.
  function transmitFrom(illum, L, k){
    return VISIBLE.map((lam, i) => ({ lam, I0: illum[i], I: illum[i] * Math.exp(-k * Math.pow(lam, -4) * L) }));
  }
  const flat     = VISIBLE.map(() => 1);
  const redTilt  = VISIBLE.map(lam => 0.2 + (lam - SCENE.LAM_MIN) / (SCENE.LAM_MAX - SCENE.LAM_MIN)); // rises to red
  const blueTilt = VISIBLE.map(lam => 0.2 + (SCENE.LAM_MAX - lam) / (SCENE.LAM_MAX - SCENE.LAM_MIN)); // rises to blue

  let allMono = true, worstCase = '';
  for (const [name, illum] of [['flat', flat], ['red-tilted', redTilt], ['blue-tilted', blueTilt]]){
    for (const turb of [0.5, 1, 2, 4]){
      const k = SCENE.K_REF * turb;
      let prev = -Infinity;
      for (let m = 0; m <= 150; m++){
        const L = (SCENE.L_MAX * 1.5) * (m / 150);   // a WIDER L range than the scene uses
        const D = centroidHand(transmitFrom(illum, L, k));
        if (m > 0 && !(D > prev)){ allMono = false; worstCase = name + ' turb=' + turb + ' at L=' + L.toFixed(2); break; }
        prev = D;
      }
      if (!allMono) break;
    }
    if (!allMono) break;
  }
  check('(2a) transmitted centroid STRICTLY reddens in L for flat / red-tilted / blue-tilted illuminants × 4 turbidities × a WIDER L range',
    allMono, allMono ? 'monotone for all 12 (illuminant × turbidity) combinations' : ('FAILS: ' + worstCase));

  // (2b) transmission strictly decreasing in L for every λ under multiple turbidities
  let tStrict = true, tViol = '';
  for (const turb of [0.25, 1, 3]){
    const k = SCENE.K_REF * turb;
    for (const lam of VISIBLE){
      let prev = Infinity;
      for (let m = 0; m <= 80; m++){
        const L = (SCENE.L_MAX * 1.5) * (m / 80);
        const T = transmit(1, lam, k, L);
        if (m > 0 && !(T < prev)){ tStrict = false; tViol = 'turb=' + turb + ' λ=' + lam.toFixed(0); break; }
        prev = T;
      }
      if (!tStrict) break;
    }
    if (!tStrict) break;
  }
  check('(2b) transmission strictly decreasing in L for every λ across turbidities {0.25,1,3} and the wider L range', tStrict,
    tStrict ? 'strict everywhere' : ('FAILS: ' + tViol));

  // (2c) the neg-control survives stronger probing: at k=0 the centroid NEVER moves
  let nullDrift = 0;
  const D0 = centroidHand(transmitFrom(flat, 0, 0));
  for (let m = 0; m <= 100; m++){ nullDrift = Math.max(nullDrift, Math.abs(centroidHand(transmitFrom(flat, SCENE.L_MAX * m / 100, 0)) - D0)); }
  check('(2c) neg-control: with NO medium (k=0) the transmitted centroid is FLAT in L — no reddening, worst Δ === 0',
    nullDrift === 0, 'worst Δ ' + nullDrift.toExponential(2));
}

// ── (3) THE COVARIANCE IDENTITY taken to the limit ─────────────────────────────
{
  const spec = transmittedSpectrum(0, 1);   // I0 carrier
  let covMax = -Infinity, idWorst = 0;
  const h = 1e-4;
  for (let m = 1; m <= 60; m++){
    const L = SCENE.L_MAX * (m / 60);
    const mom = weightedMoments(spec, SCENE.K_REF, L);
    covMax = Math.max(covMax, mom.cov);
    const Dp = dominantWavelength(transmittedSpectrum(L + h, 1));
    const Dm = dominantWavelength(transmittedSpectrum(L - h, 1));
    const dDdL = (Dp - Dm) / (2 * h);
    idWorst = Math.max(idWorst, Math.abs(dDdL - (-mom.cov)) / Math.max(1e-12, Math.abs(mom.cov)));
  }
  check('(3a) covariance Cov_w(λ,c) < 0 over the whole sweep (sign-certain reddening: c=κλ⁻⁴ anti-monotone in λ)',
    covMax < 0, 'max cov ' + covMax.toExponential(3));
  check('(3b) the identity dD/dL === −Cov_w(λ,c) holds to machine tolerance under a tiny step (<1e-5 rel)',
    idWorst < 1e-5, 'worst rel ' + idWorst.toExponential(2));
  // (3c) the element key is LOCKED as {lam, I0, I} — the scene depends on I0 to render dimming
  const sample = transmittedSpectrum(5, 1)[0];
  check('(3c) transmittedSpectrum element key is LOCKED as {lam, I0, I} (I0 present so the scene renders dimming as darkening)',
    'lam' in sample && 'I0' in sample && 'I' in sample && sample.I0 >= sample.I, 'keys ' + Object.keys(sample).join(','));
}

// ── BYTE-TWIN PARITY: the page's inlined WHY-THE-SKY-IS-BLUE CORE slab === core.mjs ──
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === WHY-THE-SKY-IS-BLUE CORE BEGIN ===';
  const END = '// === WHY-THE-SKY-IS-BLUE CORE END ===';
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

console.log('\nWhy the Sky Is Blue — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
