// ============================================================================
//  THE CAVERN · THE STUBBORN SPINNER — Node twin of the rigid-rotor ladder core.
//  Run:  node cavern/the-stubborn-spinner/core.test.mjs
//
//  Three layers (mirrors hydrogen/spin):
//   (1) the BUNDLED self-test (the exact function the in-page pill runs) passes.
//   (2) INDEPENDENT re-derivations against hand-tabulated literals — NOT routed
//       through the bundled checks: E_ℓ, gaps, the ratio pair at ℓ=0, the trap
//       (cheat's gap2 also === 2), the line combs (even vs odd), degeneracy.
//   (3) BYTE-TWIN PARITY: re-extract the CORE slice from BOTH core.mjs and
//       index.html and assert char-for-char identical (spin's proven method).
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  Erot, Echeat, degeneracy, gap, gap2, gapRatio, lineFreq,
  shelves, nearestShelf, strain,
  TONE_BASE_HZ, TONE_PER_UNIT, gapToHz, transitionHz, transitionHzCheat, spectrumHz, spectrumHzCheat,
  evaluateSpectrum, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}
const arrEq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

console.log('\n— Layer (1): THE BUNDLED SELF-TEST (the same runSelfTest the in-page pill runs) —');
{
  const r = runSelfTest();
  for (const c of r.checks) console.log('    ' + (c.ok ? '✓' : '✗') + ' ' + c.name + (c.detail ? '  ·  ' + c.detail : ''));
  check('bundled runSelfTest: pass === total', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Layer (2): INDEPENDENT RE-DERIVATIONS — against hand-tabulated literals —');
{
  // E_ℓ = ℏ²ℓ(ℓ+1)/2I (ℏ²/2I=1) — the literal table ℓ=0..6
  const Eliteral = [0, 2, 6, 12, 20, 30, 42];
  check('E_ℓ === [0,2,6,12,20,30,42] for ℓ=0..6 (closed form ℓ(ℓ+1))',
        arrEq([0, 1, 2, 3, 4, 5, 6].map(Erot), Eliteral), Eliteral.join(','));

  // gaps ∝ 2(ℓ+1) — the even comb
  const gapsLiteral = [2, 4, 6, 8, 10, 12];
  check('gaps === [2,4,6,8,10,12] (even comb, ℓ=0..5)',
        arrEq([0, 1, 2, 3, 4, 5].map(l => gap(Erot, l)), gapsLiteral), gapsLiteral.join(','));

  // the ratio pair at ℓ=0 — the sharpest separation: rotor 2, cheat 3
  check('gapRatio at ℓ=0 === (2, 3) — rotor 2/1, cheat 3/1 (the FIRST-RUNG split)',
        gapRatio(Erot, 0) === 2 && gapRatio(Echeat, 0) === 3,
        'rotor ' + gapRatio(Erot, 0) + ' vs cheat ' + gapRatio(Echeat, 0));

  // THE TRAP, independently: the cheat's gaps-of-gaps ALSO === 2 (so the ratio does
  // the separating work, not the curvature). cheat gaps are {1,3,5,7,…}, 2nd-diff 2.
  let cheatGap2is2 = true;
  for (let l = 0; l + 2 <= 12; l++) if (gap2(Echeat, l) !== 2) cheatGap2is2 = false;
  const cheatGaps = [0, 1, 2, 3].map(l => gap(Echeat, l));
  check("the trap: cheat's gap2 ALSO === 2 over ℓ=0..10 (curvature can't separate; the ratio does)",
        cheatGap2is2 && arrEq(cheatGaps, [1, 3, 5, 7]),
        'cheat gaps ' + cheatGaps.join(',') + ' (odd comb) — same constant curvature 2 as the rotor');

  // line combs: rotor lines are the EVEN comb {2,4,6,8}; cheat lines the ODD comb {1,3,5,7}.
  const rotorLines = [0, 1, 2, 3].map(l => lineFreq(Erot, l));
  const cheatLines = [0, 1, 2, 3].map(l => lineFreq(Echeat, l));
  check('lineFreq comb: rotor {2,4,6,8} EVEN · cheat {1,3,5,7} ODD',
        arrEq(rotorLines, [2, 4, 6, 8]) && arrEq(cheatLines, [1, 3, 5, 7]),
        'rotor ' + rotorLines.join(',') + ' · cheat ' + cheatLines.join(','));

  // degeneracy 2ℓ+1 and the partial-sum-is-a-square identity
  check('degeneracy 1,3,5,7 (ℓ=0..3) and Σ_{0..n}(2ℓ+1) = (n+1)²',
        arrEq([0, 1, 2, 3].map(degeneracy), [1, 3, 5, 7]) &&
        [0, 1, 2, 3, 4].every(n => { let s = 0; for (let l = 0; l <= n; l++) s += degeneracy(l); return s === (n + 1) * (n + 1); }),
        'each level holds 2ℓ+1 m-orientations');
}

console.log('\n— Layer (2b): THE CLAIM, SPLIT — each DoD assertion on its own, <1e-12 over ℓ=0..20 —');
{
  // E_ℓ = ℏ²ℓ(ℓ+1)/2I exact
  let eW = 0; for (let l = 0; l <= 20; l++) eW = Math.max(eW, Math.abs(Erot(l) - l * (l + 1)));
  check('CLAIM E_ℓ = ℏ²ℓ(ℓ+1)/2I to <1e-12 over ℓ=0..20', eW < 1e-12, 'max |Δ| = ' + eW.toExponential(2));

  // gaps ∝ 2(ℓ+1) exact (ℓ+1≤20 ⇒ ℓ=0..19)
  let gW = 0; for (let l = 0; l <= 19; l++) gW = Math.max(gW, Math.abs(gap(Erot, l) - 2 * (l + 1)));
  check('CLAIM gaps ∝ 2(ℓ+1) to <1e-12 over ℓ=0..19', gW < 1e-12, 'max |Δ| = ' + gW.toExponential(2));

  // second-difference constant 2 (needs ℓ+2≤20 ⇒ ℓ=0..18)
  let sW = 0; for (let l = 0; l <= 18; l++) sW = Math.max(sW, Math.abs(gap2(Erot, l) - 2));
  check('CLAIM second-difference constant === 2 to <1e-12 over ℓ=0..18', sW < 1e-12, 'max |gap2−2| = ' + sW.toExponential(2));

  // degeneracy 2ℓ+1 exact
  let dOk = true; for (let l = 0; l <= 20; l++) if (degeneracy(l) !== 2 * l + 1) dOk = false;
  check('CLAIM degeneracy === 2ℓ+1 exact over ℓ=0..20', dOk, 'integer-exact');
}

console.log('\n— Layer (2c): SHELVES, NEAREST-SHELF, STRAIN, AUDIO — the touch + sound surfaces —');
{
  // shelves ω_ℓ = √(ℓ(ℓ+1)); ω_0 = 0 (genuinely still); strictly widening
  const sh = shelves(8);
  check('shelves ω_ℓ = √(ℓ(ℓ+1)): ω_0 === 0 (ℓ=0 STILL), ω_1 === √2, strictly increasing',
        sh[0] === 0 && Math.abs(sh[1] - Math.SQRT2) < 1e-12 && sh.every((v, i) => i === 0 || v > sh[i - 1]),
        'ω = ' + sh.map(v => v.toFixed(2)).join(', '));

  // nearestShelf snaps a mid-gap drive to the closer shelf; the gaps WIDEN up the ladder
  check('nearestShelf catches the closer perch (drive just under √2 → ℓ=1, drive 0.1 → ℓ=0)',
        nearestShelf(1.30, sh) === 1 && nearestShelf(0.10, sh) === 0,
        'the dial refuses every intermediate rate, falling to an allowed ℓ');

  // strain is 0 on a shelf, positive mid-gap, and heavier up the ladder (ΔE-weighted)
  const onShelf = strain(sh[3], 3, sh, Erot);
  const midLow = strain((sh[1] + sh[2]) / 2, 1, sh, Erot);   // mid-gap low on the ladder
  const midHigh = strain((sh[5] + sh[6]) / 2, 5, sh, Erot);  // mid-gap high on the ladder
  check('strain: 0 exactly on a shelf, > 0 mid-gap, and HEAVIER up the ladder (ΔE-weighted spring)',
        onShelf === 0 && midLow > 0 && midHigh > midLow,
        'on-shelf ' + onShelf.toFixed(3) + ' · mid-low ' + midLow.toFixed(3) + ' < mid-high ' + midHigh.toFixed(3));

  // audio: linear map — the rotor's energy gaps (2,4,6,8) are arithmetic, so the
  // LINEAR Hz map makes the transition tones arithmetic too: each line is exactly
  // 2·TONE_PER_UNIT Hz above the last (the audible widening), and the tone SECOND
  // difference is exactly 0. ℓ=0→1 on base.
  let rising = true, stepOk = true, curveOk = true;
  for (let l = 0; l <= 6; l++){
    if (transitionHz(l + 1) <= transitionHz(l)) rising = false;
    if (l + 1 <= 6 && transitionHz(l + 1) - transitionHz(l) !== 2 * TONE_PER_UNIT) stepOk = false;
    if (l + 2 <= 6){
      const sd = (transitionHz(l + 2) - transitionHz(l + 1)) - (transitionHz(l + 1) - transitionHz(l));
      if (sd !== 0) curveOk = false;
    }
  }
  check('transitionHz strictly increasing (the audible ladder rises with widening steps)', rising,
        spectrumHz(6).map(h => Math.round(h)).join(', ') + ' Hz');
  check('Hz FIRST-difference === 2·TONE_PER_UNIT === ' + (2 * TONE_PER_UNIT) + ' Hz EXACTLY, tone 2nd-diff === 0 (linear map of an arithmetic gap comb)',
        stepOk && curveOk, 'equal energy-gap increments → equal Hz increments');
  check('ℓ=0→1 lands exactly on TONE_BASE_HZ === ' + TONE_BASE_HZ + ' Hz', transitionHz(0) === TONE_BASE_HZ,
        'gapToHz(2) = base');

  // rotor vs cheat spectra DIFFER beyond tolerance at ℓ≥1 (fires if the cheat were wired in)
  const sR = spectrumHz(6), sC = spectrumHzCheat(6);
  let diffOk = true; for (let l = 1; l <= 6; l++) if (Math.abs(sR[l] - sC[l]) <= 1) diffOk = false;
  check('rotor vs cheat audible spectra differ by > tolerance at every ℓ≥1', diffOk,
        'ℓ=1 rotor ' + Math.round(sR[1]) + ' Hz vs cheat ' + Math.round(sC[1]) + ' Hz');

  // the lamp verdict, independent of the bundled check
  check('evaluateSpectrum verdict: Erot → ROTOR, Echeat → CHEAT (keyed to the RATIO)',
        evaluateSpectrum(Erot, 12).verdict === 'ROTOR' && evaluateSpectrum(Echeat, 12).verdict === 'CHEAT' &&
        evaluateSpectrum(Echeat, 12).secondDiffConst === true,   // cheat curvature still looks "constant"
        'the cheat reports secondDiffConst===true yet verdicts CHEAT — the ratio overrules the curvature');
}

console.log('\n— Layer (3): BYTE-TWIN PARITY — the inlined slice === the module, char-for-char —');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check("the page's ROTOR CORE === core.mjs, char-for-char",
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice === pageSlice ? 'slice ' + (pageSlice ? pageSlice.length : 0) + ' chars identical'
          : 'DRIFT (mod ' + (modSlice && modSlice.length) + ' vs page ' + (pageSlice && pageSlice.length) + ')');

  // anti-circularity: outside the sentinels the page must NOT redefine the ladder
  const i = page.indexOf(BEGIN), j = page.indexOf(END);
  const outside = page.slice(0, i) + page.slice(j);
  const noSecond = !/function\s+Erot\b/.test(outside) &&
                   !/function\s+gapRatio\b/.test(outside) &&
                   !/function\s+evaluateSpectrum\b/.test(outside);
  check('anti-circularity: the page DEFINES the ladder ONLY inside the sentinels', noSecond,
        'no second Erot / gapRatio / evaluateSpectrum outside the core');
}

console.log('\n—— The Cavern · The Stubborn Spinner · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
