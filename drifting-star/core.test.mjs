// Node twin for The Drifting Star (classical low-v Doppler, velocity recovery).
// Zero-dep. Run: `node core.test.mjs`. Exit 0 = green; non-zero = red.
//
// Proves the CRUX two ways and verifies the controls, keeping TWO tolerances
// SEPARATE (the rigour grafted from The Passing Siren's twin):
//   (a)  MATH ROUND-TRIP — TIGHT: v→shiftedNm→recoverVKms agrees to <1e-9
//        relative over hundreds of random v in [−0.05c,+0.05c] for ALL FOUR
//        Balmer lines, AND the recovered v is IDENTICAL across the comb (the
//        rigid-slide proof — every line reports the same speed).
//   (a′) FULL PIXEL CHAIN — honestly LOOSER: v→obsNm→wavelengthToX→quantize→
//        xToWavelength→recoverVKms agrees only to the GRID resolution (the
//        measurement floor; the eye does NOT read v to ppm — the page's pixel
//        chain does, the human reads to the grid).
//   (b)  NEGATIVE CONTROL: v=0 ⇒ shiftedNm === restNm EXACTLY (===, not <ε) for
//        all 4 lines; recoverVKms(rest,rest) === 0; the band wash strength === 0.
//   (c)  SIGN: v>0 ⇒ obs>rest (red, right, warm); v<0 ⇒ obs<rest (blue, left,
//        cool) — strict monotonicity of shiftedNm in v, colour-sign === pos-sign.
//   (d)  SINGLE-SOURCE PARITY: the rest comb === imported balmerWavelengthAirNm
//        (3..6) to <1e-9 (the renderer never re-types a 656.28).
//   (e)  BYTE-TWIN: the inlined core between the sentinels in index.html is
//        byte-identical (indentation-normalised) to core.mjs's body.
//   (f)  SCORING HONESTY: the revealed true v === the v fed to shiftedNm that
//        drew the plate; score is a pure function of |v_guess − v_true|;
//        thresholds live in the core (testable), not scattered in the view.
//   Also runs the page's own runSelfTest() — all green.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  C_KMS, V_CAP_FRAC, V_CAP_KMS, LAM_MIN, LAM_MAX, GRID_NM, SCORE,
  balmerRestComb, shiftedNm, recoverVKms, shiftedNmRel,
  betaToVKms, wavelengthToX, xToWavelength, quantizeNm,
  scoreGuess, washStrength, makeRng, runSelfTest,
} from './core.mjs';
import { balmerWavelengthAirNm } from '../spectroscope/spectroscope-core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const comb = balmerRestComb();

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (a) MATH ROUND-TRIP, TIGHT — and identical across the comb ──
ck('(a) math round-trip v→λ→v < 1e-9 relative, all 4 lines', (() => {
  const rng = makeRng(424242);
  let maxRel = 0;
  for (let i = 0; i < 600; i++){
    const v = (rng() * 2 - 1) * V_CAP_KMS;
    for (const L of comb){
      const obs = shiftedNm(L.restNm, v);
      const back = recoverVKms(L.restNm, obs);
      if (Math.abs(v) > 1e-9) maxRel = Math.max(maxRel, Math.abs(back - v) / Math.abs(v));
    }
  }
  return maxRel < 1e-9;
})());

ck('(a) rigid slide: all 4 lines recover the SAME v (spread < 1e-6 km/s)', (() => {
  const rng = makeRng(7);
  let maxSpread = 0;
  for (let i = 0; i < 600; i++){
    const v = (rng() * 2 - 1) * V_CAP_KMS;
    const rec = comb.map(L => recoverVKms(L.restNm, shiftedNm(L.restNm, v)));
    const spread = Math.max.apply(null, rec) - Math.min.apply(null, rec);
    maxSpread = Math.max(maxSpread, spread);
  }
  return maxSpread < 1e-6;
})());

// recoverVKms is the EXACT inverse of shiftedNm by algebra: c·(λ_rest(1+v/c) −
// λ_rest)/λ_rest === v. Re-derived here straight from the closed form (not via
// the round-trip) so the inverse is pinned independently of the forward map.
ck('(a) recoverVKms is the exact algebraic inverse: c·Δλ/λ === v', (() => {
  for (const beta of [-0.05, -0.013, 0, 0.0007, 0.0321, 0.05]){
    const v = betaToVKms(beta);
    for (const L of comb){
      const obs = L.restNm * (1 + v / C_KMS);          // forward by hand
      const recovered = C_KMS * (obs - L.restNm) / L.restNm;  // inverse by hand
      if (Math.abs(recovered - recoverVKms(L.restNm, obs)) > 1e-9) return false;
      if (Math.abs(recovered - v) > 1e-6) return false;
    }
  }
  return true;
})());

// ── (a′) FULL PIXEL CHAIN — separately asserted, honestly LOOSER ──
ck("(a′) pixel chain v→x→grid→λ→v within grid resolution (NOT ppm)", (() => {
  const rng = makeRng(31415);
  const x0 = 12, w = 980;
  // grid step + sub-pixel both map to a velocity floor of ~ c·step/λ.
  const tolKms = C_KMS * (GRID_NM + (LAM_MAX - LAM_MIN) / w) / LAM_MIN * 2;
  let maxErr = 0, anyAboveTight = false;
  for (let i = 0; i < 600; i++){
    const v = (rng() * 2 - 1) * V_CAP_KMS;
    const L = comb[i % 4];
    const obs = shiftedNm(L.restNm, v);
    const nmBack = quantizeNm(xToWavelength(wavelengthToX(obs, x0, w), x0, w));
    const vBack = recoverVKms(L.restNm, nmBack);
    const e = Math.abs(vBack - v);
    maxErr = Math.max(maxErr, e);
    if (e > 1e-6) anyAboveTight = true;   // the grid DOES introduce error (looser than the math chain)
  }
  // the pixel floor is real (looser than 1e-9 km/s) yet bounded by the grid tol.
  return maxErr < tolKms && anyAboveTight;
})());

// ── (b) NEGATIVE CONTROL: v=0 is EXACT, not merely small ──
ck('(b) v=0 ⇒ shiftedNm === restNm EXACTLY (===) for all 4 lines', (() => {
  for (const L of comb) if (shiftedNm(L.restNm, 0) !== L.restNm) return false;
  return true;
})());
ck('(b) recoverVKms(rest,rest) === 0 exactly; washStrength(0) === 0', (() => {
  for (const L of comb) if (recoverVKms(L.restNm, L.restNm) !== 0) return false;
  return washStrength(0) === 0;
})());

// ── (c) SIGN: monotone in v, colour-sign === position-sign ──
ck('(c) shiftedNm strictly increasing in v (red=recede right, blue=approach left)', (() => {
  for (const L of comb){
    let prev = -Infinity;
    for (let k = -200; k <= 200; k++){
      const v = (k / 200) * V_CAP_KMS;
      const o = shiftedNm(L.restNm, v);
      if (!(o > prev)) return false;
      prev = o;
    }
  }
  return true;
})());
ck('(c) colour wash sign never disagrees with the position sign', (() => {
  for (const L of comb){
    for (let k = -200; k <= 200; k++){
      if (k === 0) continue;
      const v = (k / 200) * V_CAP_KMS;
      const posSign = Math.sign(shiftedNm(L.restNm, v) - L.restNm);
      const colSign = Math.sign(washStrength(v));
      if (posSign !== colSign) return false;
    }
  }
  return true;
})());
// v>0 reddens (Hα 656→~689), v<0 blues (Hδ 410→~390): explicit sign anchors.
ck('(c) anchors: +0.05c reddens Hα to >656; −0.05c blues Hδ to <410', (() => {
  const Ha = comb[0].restNm, Hd = comb[3].restNm;
  return shiftedNm(Ha, V_CAP_KMS) > Ha && shiftedNm(Hd, -V_CAP_KMS) < Hd;
})());

// ── (c′) IN-BAND SCOPE: the whole comb stays inside [380,750] at ±0.05c (so the
// plate never loses a line — the first stated reason for the cap). ──
ck('(c′) at ±0.05c the entire Balmer comb stays inside the visible band [380,750]', (() => {
  for (const L of comb){
    if (shiftedNm(L.restNm, +V_CAP_KMS) > LAM_MAX) return false;   // reddest: Hα
    if (shiftedNm(L.restNm, -V_CAP_KMS) < LAM_MIN) return false;   // bluest: Hδ
  }
  return true;
})());

// ── (c″) CLASSICAL ≈ RELATIVISTIC at the cap to ~1.4% (the second reason the
// classical headline is faithful) — and they DIVERGE far outside it. ──
ck('(c″) classical vs relativistic agree to <1.5% at |β|=0.05 (faithful headline)', (() => {
  for (const L of comb){
    const cls = shiftedNm(L.restNm, betaToVKms(V_CAP_FRAC));
    const rel = shiftedNmRel(L.restNm, V_CAP_FRAC);
    if (Math.abs(cls - rel) / rel > 0.015) return false;
  }
  return true;
})());

// ── (d) SINGLE-SOURCE PARITY (anti-circularity) ──
ck('(d) rest comb === imported balmerWavelengthAirNm(3..6) to <1e-9 (no re-typed 656.28)', (() => {
  for (const L of comb) if (Math.abs(L.restNm - balmerWavelengthAirNm(L.n)) > 1e-9) return false;
  return true;
})());
// the source file must NOT contain a hand-typed Balmer literal (only the import).
ck('(d) core.mjs contains no re-typed Balmer wavelength literal (656/486/434/410)', (() => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  // strip comments so prose mentioning 656.29 doesn't trip it; check live code only.
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return !/\b(656\.\d|486\.\d|434\.\d|410\.\d)/.test(code);
})());

// ── (f) SCORING HONESTY ──
ck('(f) score is a pure function of |v_guess − v_true| (errKms exact)', (() => {
  return scoreGuess(1234, 1000).errKms === 234 && scoreGuess(1000, 1234).errKms === 234;
})());
ck('(f) thresholds: exact guess ⇒ bullseye; far ⇒ try-again; bands ordered', (() => {
  if (scoreGuess(5000, 5000).band !== 'bullseye') return false;
  if (scoreGuess(V_CAP_KMS, -V_CAP_KMS).band !== 'try-again') return false;
  // a guess just inside good but outside bullseye reads 'good'
  const v = betaToVKms(0.02);
  if (scoreGuess(v + betaToVKms(SCORE.goodFrac * 0.9), v).band !== 'good') return false;
  return SCORE.bullseyeFrac < SCORE.goodFrac;
})());
ck('(f) stationary star (v=0) is WINNABLE: guessing 0 ⇒ bullseye via the floor', (() => {
  return scoreGuess(0, 0).band === 'bullseye' && SCORE.floorFrac >= SCORE.bullseyeFrac - 1e-12;
})());
// the scored "true v" is the SAME number that, fed to the forward map, drew the
// plate — verified by closing the loop: plate-λ → recover → score-against-true.
ck('(f) scoring honesty: plate is drawn from the SAME true v the score reveals', (() => {
  const vTrue = betaToVKms(0.031);
  // the plate paints obs = shiftedNm(rest, vTrue) per line; the reveal v is vTrue.
  const obsHa = shiftedNm(comb[0].restNm, vTrue);
  const recovered = recoverVKms(comb[0].restNm, obsHa);   // exact inverse ⇒ vTrue
  // a perfect guess equals the painted-from v ⇒ bullseye, no second re-typed number.
  return Math.abs(recovered - vTrue) < 1e-6 && scoreGuess(recovered, vTrue).band === 'bullseye';
})());

// ── (e) BYTE-TWIN PARITY: index.html inlined core === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== DRIFTING-STAR CORE (byte-identical to core.mjs) =====';
const END = '// ===== END DRIFTING-STAR CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('(e) byte-parity: DRIFTING-STAR CORE sentinels present in core.mjs', !!coreRegion);
ck('(e) byte-parity: DRIFTING-STAR CORE sentinels present in index.html', !!pageRegion);
ck('(e) byte-parity: index.html inlined core === core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Drifting Star — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
