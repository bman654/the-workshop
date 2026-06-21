// Node twin for The Ring Made of One Star. Zero-dep. Run: `node einstein-ring/core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count (equal-area-sweep style).
//
// Proves the lensing claims INDEPENDENTLY of the page's in-page pill:
//   CLAIM 1 EXACT ROOTS — across β ∈ {0,.3,1,2,5} × θ_E ∈ {.1,.5,1,2,5}, both images are exact
//           roots of the lens equation β = θ − θ_E²/θ to < 1e-12 (measured ~1.2e-13), and Vieta
//           holds exactly: θ₊·θ₋ = −θ_E², θ₊ + θ₋ = β.
//   CLAIM 2 RING + SPLIT — β=0 ⇒ θ± = ±θ_E (the full Einstein ring) to ε; β>0 ⇒ θ₊>θ_E AND
//           |θ₋|<θ_E (one image outside the ring, one inside, opposite side) — no violations.
//   CLAIM 3 θ_E ∝ √M — θ_E(cM)/θ_E(M) = √c for c ∈ {2,3,4,9,100}; θ_E(0) = 0.
//   CLAIM 4 MAGNIFICATION — (a) |μ₊|+|μ₋| = totalMag to < 1e-12; (b) totalMag ≥ 1 always;
//           (c) the BONUS invariant: SIGNED μ₊+μ₋ = 1 to < 1e-12 (light redistributed, never
//           created); (d) per-image μ± match the u-space closed forms.
//   NEG-CONTROL — θ_E = 0 ⇒ imagePositions {single:true, theta:β}, no second image;
//           magnification(_,0) = 1; totalMag(_,0) = 1.
//   β→0 DIVERGENCE HONEST — totalMag(β,1) ~ 1/u and finite for β ∈ {1,.1,.01,1e-4}; ===Infinity
//           ONLY at β = 0 (the point-source ring is infinitely thin; the page's finite width keeps
//           it physical).
//   DOMAIN GUARDS — thetaEinstein(−1)/NaN/Inf → NaN; imagePositions(θ_E<0/non-finite) → null.
//   BYTE-TWIN PARITY — the CORE region inlined in index.html is byte-identical (indentation-
//           normalized) to core.mjs's CORE region.
//
// NOTE ON TOLERANCES: every assertion guard is 1e-12, comfortably above the measured residuals
// (~1.2e-13 worst root, ~6e-14 magnification, ~5e-15 the signed-sum invariant). The "ring read as
// one star" is a PERCEPTION claim handled by the page's render eyeball pass — it is deliberately
// NOT asserted here.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  EINSTEIN_K,
  thetaEinstein, imagePositions, magnification, totalMag, lensEq, imagePair,
  SNAP_BAND, LOCK_EPS, MU_DISPLAY_CAP, runSelfTest
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ok   ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; fails.push(name); console.log('  FAIL ' + name + (info ? '  [' + info + ']' : '')); }
}

console.log('The Ring Made of One Star — core.test.mjs\n');

const BETAS = [0, 0.3, 1, 2, 5];
const THETA_ES = [0.1, 0.5, 1, 2, 5];

// ── (a) the core's own self-test is all-green ──
console.log('· core self-test (the same legs the in-page pill runs):');
const st = runSelfTest();
for (const c of st.checks) ck('selftest · ' + c.name, c.pass, c.info);

// ── CLAIM 1 · EXACT ROOTS + Vieta across the β × θ_E grid ──
console.log('\n· CLAIM 1 — θ± are exact roots of β = θ − θ_E²/θ (+ Vieta):');
{
  let worstRoot = 0, worstV1 = 0, worstV2 = 0;
  for (const b of BETAS) for (const tE of THETA_ES) {
    const p = imagePositions(b, tE);
    worstRoot = Math.max(worstRoot,
      Math.abs(lensEq(p.thetaPlus, tE) - b), Math.abs(lensEq(p.thetaMinus, tE) - b));
    worstV1 = Math.max(worstV1, Math.abs(p.thetaPlus * p.thetaMinus - (-tE * tE)));
    worstV2 = Math.max(worstV2, Math.abs(p.thetaPlus + p.thetaMinus - b));
  }
  ck('residual |lensEq(θ±) − β| < 1e-12 across the grid',
    worstRoot < 1e-12, 'worst residual ' + worstRoot.toExponential(2));
  ck('Vieta θ₊·θ₋ = −θ_E² (exact)', worstV1 < 1e-12, 'worst |Δ| ' + worstV1.toExponential(2));
  ck('Vieta θ₊ + θ₋ = β (exact)', worstV2 < 1e-12, 'worst |Δ| ' + worstV2.toExponential(2));
}

// ── CLAIM 2 · RING (β=0) + SPLIT (β>0 ⇒ one out, one in) ──
console.log('\n· CLAIM 2 — β=0 closes a full ring at ±θ_E; β>0 splits one-out / one-in:');
for (const tE of THETA_ES) {
  const r = imagePositions(0, tE);
  const ringErr = Math.max(Math.abs(r.thetaPlus - tE), Math.abs(r.thetaMinus + tE));
  ck('θ_E=' + tE + ' · β=0 ⇒ θ± = ±θ_E (the full ring)',
    ringErr < 1e-12, '|Δ| ' + ringErr.toExponential(2));
}
{
  let viol = 0, worstOut = Infinity, worstIn = 0;
  for (const b of BETAS) {
    if (b === 0) continue;
    for (const tE of THETA_ES) {
      const p = imagePositions(b, tE);
      if (!(p.thetaPlus > tE && Math.abs(p.thetaMinus) < tE && p.thetaMinus < 0)) viol++;
      worstOut = Math.min(worstOut, p.thetaPlus - tE);
      worstIn = Math.max(worstIn, Math.abs(p.thetaMinus));   // must stay < tE
    }
  }
  ck('β>0 ⇒ θ₊>θ_E (outer, +side) AND θ₋<0, |θ₋|<θ_E (inner, opposite) — no violations',
    viol === 0, viol + ' violations');
}

// ── CLAIM 3 · θ_E ∝ √M ──
console.log('\n· CLAIM 3 — the Einstein angle grows as √M:');
{
  let worst = 0;
  for (const c of [2, 3, 4, 9, 100]) {
    const ratio = thetaEinstein(c * 1.7) / thetaEinstein(1.7);
    worst = Math.max(worst, Math.abs(ratio - Math.sqrt(c)));
  }
  ck('θ_E(cM)/θ_E(M) = √c for c ∈ {2,3,4,9,100}',
    worst < 1e-12, 'worst |Δ| ' + worst.toExponential(2));
  ck('θ_E(0) = 0 (no mass, no ring)', thetaEinstein(0) === 0);
}

// ── CLAIM 4 · MAGNIFICATION (sum, floor, signed invariant, per-image closed forms) ──
console.log('\n· CLAIM 4 — magnification: brightness sum, ≥1 floor, the μ₊+μ₋=1 invariant:');
{
  let worstAbs = 0, worstSigned = 0, minTotal = Infinity, worstMuPlus = 0, worstMuMinus = 0;
  for (const b of BETAS) for (const tE of THETA_ES) {
    if (b === 0) continue;   // β=0 is the honest ∞ case, tested separately
    const pr = imagePair(b, tE);
    worstAbs = Math.max(worstAbs, Math.abs(pr.muTotalAbs - totalMag(b, tE)));
    worstSigned = Math.max(worstSigned, Math.abs(pr.muTotalSigned - 1));
    minTotal = Math.min(minTotal, pr.muTotalAbs);
    // per-image u-space closed forms: μ± = ½ ± (u²+2)/(2u√(u²+4))
    const u = b / tE;
    const muPlusClosed = 0.5 + (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
    const muMinusClosed = 0.5 - (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
    worstMuPlus = Math.max(worstMuPlus, Math.abs(pr.muPlus - muPlusClosed));
    worstMuMinus = Math.max(worstMuMinus, Math.abs(pr.muMinus - muMinusClosed));
  }
  ck('|μ₊|+|μ₋| = totalMag closed form to < 1e-12', worstAbs < 1e-12, 'worst |Δ| ' + worstAbs.toExponential(2));
  ck('totalMag ≥ 1 everywhere (brightness floor)', minTotal >= 1 - 1e-12, 'min ' + minTotal.toFixed(6));
  ck('BONUS: SIGNED μ₊+μ₋ = 1 to < 1e-12 (light redistributed, never created)',
    worstSigned < 1e-12, 'worst |Δ| ' + worstSigned.toExponential(2));
  ck('per-image μ± match the u-space closed forms', worstMuPlus < 1e-12 && worstMuMinus < 1e-12,
    'μ₊ ' + worstMuPlus.toExponential(2) + ', μ₋ ' + worstMuMinus.toExponential(2));
}

// ── NEG-CONTROL — θ_E = 0 ⇒ one un-bent image, μ = 1, no second image ──
console.log('\n· NEG-CONTROL — no mass ⇒ the lens does nothing:');
{
  const p = imagePositions(1.3, 0);
  ck('θ_E=0 ⇒ {single:true, theta:β}, thetaMinus === null',
    p.single === true && p.theta === 1.3 && p.thetaMinus === null,
    'single image at θ=' + p.theta);
  ck('magnification(_, 0) = 1 (un-bent)', magnification(1.3, 0) === 1);
  ck('totalMag(_, 0) = 1 (no brightening)', totalMag(1.3, 0) === 1);
  const pr = imagePair(2.4, 0);
  ck('imagePair(θ_E=0) reports single, μ=1, no second image',
    pr.single === true && pr.thetaMinus === null && pr.muTotalAbs === 1);
}

// ── β→0 DIVERGENCE HONEST — finite for β>0, Infinity ONLY at β=0 ──
console.log('\n· β→0 DIVERGENCE — finite for β>0, honestly ∞ only at perfect alignment:');
{
  let allFinite = true;
  const tE = 1;
  for (const b of [1, 0.1, 0.01, 1e-4]) {
    const m = totalMag(b, tE);
    if (!isFinite(m)) allFinite = false;
    // ~1/u behaviour as u→0: u·μ → 1
    // (just a sanity note in the info string)
  }
  ck('totalMag(β,1) finite for β ∈ {1,.1,.01,1e-4}', allFinite,
    'μ(1e-4,1) = ' + totalMag(1e-4, 1).toExponential(2));
  ck('totalMag(0, 1) === Infinity (the honest ∞ at β=0)', totalMag(0, 1) === Infinity);
  // ~1/u: u·μ_total → 1 as u→0
  const u = 1e-4, approxErr = Math.abs(u * totalMag(u, 1) - 1);
  ck('u·μ_total → 1 as u→0 (the 1/u divergence)', approxErr < 1e-3, '|uμ − 1| ' + approxErr.toExponential(2));
}

// ── DOMAIN GUARDS ──
console.log('\n· DOMAIN GUARDS — bad inputs → NaN / null, never silent garbage:');
ck('thetaEinstein(−1) → NaN', Number.isNaN(thetaEinstein(-1)));
ck('thetaEinstein(NaN) → NaN', Number.isNaN(thetaEinstein(NaN)));
ck('thetaEinstein(Infinity) → NaN', Number.isNaN(thetaEinstein(Infinity)));
ck('imagePositions(1, θ_E<0) → null', imagePositions(1, -0.5) === null);
ck('imagePositions(NaN, 1) → null', imagePositions(NaN, 1) === null);
ck('imagePositions(1, Infinity) → null', imagePositions(1, Infinity) === null);

// ── shared UX constants are present and sane (meter/snap/render import these) ──
console.log('\n· SHARED UX CONSTANTS — exported so meter/snap/render agree:');
ck('SNAP_BAND, LOCK_EPS, MU_DISPLAY_CAP exported & ordered',
  SNAP_BAND > LOCK_EPS && LOCK_EPS > 0 && MU_DISPLAY_CAP > 100,
  'SNAP ' + SNAP_BAND + ' > LOCK ' + LOCK_EPS + ', cap ' + MU_DISPLAY_CAP);
ck('EINSTEIN_K = 1 (declared illustrative constant)', EINSTEIN_K === 1);

// ── BYTE-TWIN PARITY — index.html's inlined core === core.mjs CORE region ──
console.log('\n· BYTE-TWIN PARITY — the page inlines core.mjs byte-identically:');
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageSrc = '';
try { pageSrc = readFileSync(join(here, 'index.html'), 'utf8'); } catch (e) { /* forged later */ }
const BEGIN = '/* CORE BEGIN';
const END = '/* CORE END */';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
function norm(s) {
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = pageSrc ? region(pageSrc) : null;
ck('CORE sentinels present in core.mjs', !!coreRegion);
if (pageSrc) {
  ck('CORE sentinels present in index.html', !!pageRegion);
  ck('index.html inlined core === core.mjs CORE region (indentation-normalized)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion && coreRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED');
} else {
  console.log('  ..   index.html not forged yet — skipping page byte-parity (run forge, then re-test)');
}

// ── report ──
console.log('\n' + (fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
console.log('  Lens: β=0 closes a full ring at θ_E (images θ±=±θ_E); brightness |μ₊|+|μ₋|≥1; no mass ⇒ one un-bent image.');
if (fail) { console.log('\n  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
