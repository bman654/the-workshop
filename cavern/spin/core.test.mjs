// ============================================================================
//  THE CAVERN · SPIN — Node twin of the spin-½ probability core.
//  Run:  node cavern/spin/core.test.mjs
//
//  Proves the Born rule headless (two independent derivations agree), pins the
//  hero cases exact, runs the erasure chain, the seeded convergence, the
//  classical-deflection negative control (the teeth), and the Node-only guards
//  the in-page pill can't run: the BYTE-TWIN parity (re-extract the CORE slice
//  from BOTH core.mjs and index.html, assert char-for-char identical) and the
//  anti-circularity grep (no second (1+…dot)/2 projector or cos(…/2)**2 outside
//  the sentinels in the page).  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  blochVec, pUp, pDown, spinorUp, overlap2, mulberry32, sampleSplit, classicalDeflect,
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
// The same closed↔projector check the in-page pill runs, here as the heart.
function pUpProjector(thn, phn, thm, phm){
  return overlap2(spinorUp(thm, phm), spinorUp(thn, phn));
}

console.log('\n— Rung (1): TWO DERIVATIONS AGREE — pUp(closed) === |⟨m+|n+⟩|² (projector) —');
{
  let worst = 0, samples = 0;
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++)
    for (let k = 0; k <= 12; k++) for (let l = 0; l <= 6; l++){
      const thn = Math.PI * i / 12, phn = 2 * Math.PI * j / 12;
      const thm = Math.PI * k / 12, phm = 2 * Math.PI * l / 6;
      const closed = pUp(blochVec(thn, phn), blochVec(thm, phm));
      const proj = pUpProjector(thn, phn, thm, phm);
      worst = Math.max(worst, Math.abs(closed - proj));
      samples++;
    }
  check('pUp === spinor-projector |⟨m+|n+⟩|² over a dense (θn,φn,θm,φm) grid (worst < 1e-12)',
        worst < 1e-12, samples.toLocaleString() + ' points · max |Δ| = ' + worst.toExponential(2));
}

console.log('\n— Rung (2): HERO CASES — exact, the headline numbers —');
{
  const z = blochVec(0, 0);
  const negz = blochVec(Math.PI, 0);
  const x = blochVec(Math.PI / 2, 0);
  const at60 = blochVec(Math.PI / 3, 0);
  check('θ=0   → P(↑) Object.is 1 exactly (state survives a same-axis measure)', Object.is(pUp(z, z), 1));
  check('θ=180 → P(↑) Object.is 0 exactly (antiparallel: never up)', Object.is(pUp(z, negz), 0));
  check('θ=90  → P(↑) === 0.5 EXACTLY (crossed analyzers — the half-angle, asserted ===)',
        pUp(z, x) === 0.5, 'pUp = ' + pUp(z, x));
  check('θ=60  → P(↑) === 0.75 to 1e-15 (cos²30° = ¾)', Math.abs(pUp(z, at60) - 0.75) < 1e-15,
        'pUp = ' + pUp(z, at60).toFixed(17));
}

console.log('\n— Rung (3): NORMALIZATION — pUp(n,m) + pUp(n,−m) === 1 exactly —');
{
  let worst = 0, allExact = true;
  for (let i = 0; i <= 16; i++) for (let j = 0; j <= 8; j++){
    const n = blochVec(Math.PI * i / 16, 2 * Math.PI * j / 8);
    const m = blochVec(Math.PI * (i + 3) / 16, 2 * Math.PI * (j + 2) / 8);
    const negm = [-m[0], -m[1], -m[2]];
    const s = pUp(n, m) + pUp(n, negm);
    worst = Math.max(worst, Math.abs(s - 1));
    if (s !== 1) allExact = false;            // ½(1+c) + ½(1−c) = 1 with no rounding
  }
  check('pUp(n,m) + pUp(n,−m) === 1 exactly for all sampled n,m (Object.is-tight)', allExact,
        'max |Σ−1| = ' + worst.toExponential(2));
  // pDown is the honest complement
  check('pDown(z,x) === 1 − pUp(z,x) === 0.5', pDown(blochVec(0,0), blochVec(Math.PI/2,0)) === 0.5);
}

console.log('\n— Rung (4): THE ERASURE CHAIN — prepare +z, measure x (½), take x-up, re-measure z (½) —');
{
  const z = blochVec(0, 0);
  const x = blochVec(Math.PI / 2, 0);            // +x axis
  // stage 1: prepare +z, measure along x → 50/50 (z carried no x-information)
  const pXgivenZ = pUp(z, x);
  // stage 2: the surviving beam is now prepared +x; re-measure z → 50/50.
  // The z-information is ERASED: a +x state is an equal z-superposition.
  const pZgivenX = pUp(x, z);
  check('+z measured along x → P(↑x) === 0.5 (no x-info in a z-state)', pXgivenZ === 0.5);
  check('then +x re-measured along z → P(↑z) === 0.5 (z is ERASED — the chained-projector identity)',
        pZgivenX === 0.5, 'purity gone: a +x state is 50/50 in z, regardless of the original +z prep');
  // the contrast: had we NOT inserted the x-measure, +z re-measured along z is 100% up
  check('control: +z measured along z (no x in between) → P(↑z) === 1 (purity intact)',
        pUp(z, z) === 1, 'so the ½ above is caused by the x-measurement, not by z itself');
}

console.log('\n— Rung (5): SEEDED CONVERGENCE — sampleSplit lands in the binomial ±4σ band; same seed → identical —');
{
  const z = blochVec(0, 0);
  const SEED = 0x5C1F0001, N = 200000;
  const thetas = [0, 30, 45, 60, 90, 120, 150, 180].map(d => d * Math.PI / 180);
  let allInBand = true, worstZ = 0;
  for (const th of thetas){
    const m = blochVec(th, 0);
    const p = pUp(z, m);
    const { up } = sampleSplit(p, N, mulberry32(SEED));
    const frac = up / N;
    const sigma = Math.sqrt(Math.max(p * (1 - p), 1e-12) / N);   // binomial σ of the fraction
    const zscore = sigma > 0 ? Math.abs(frac - p) / sigma : 0;    // p∈{0,1} → σ=0, frac must equal p
    if (p === 0 || p === 1){ if (frac !== p) allInBand = false; }
    else if (zscore > 4){ allInBand = false; }
    worstZ = Math.max(worstZ, zscore);
  }
  check('seeded 200k landed within the binomial ±4σ band of cos²(θ/2) at every θ', allInBand,
        'worst |frac−p|/σ = ' + worstZ.toFixed(2) + 'σ over ' + thetas.length + ' angles');

  // determinism: the SAME seed → byte-identical counts (twice)
  const m45 = blochVec(45 * Math.PI / 180, 0), p45 = pUp(z, m45);
  const a = sampleSplit(p45, N, mulberry32(SEED));
  const b = sampleSplit(p45, N, mulberry32(SEED));
  check('same seed → byte-identical counts (determinism asserted)', a.up === b.up && a.down === b.down,
        'up = ' + a.up + ' both runs');
  // mulberry32 literal pin — the first draw of seed 0x5C1F0001 can't drift
  const firstDraw = mulberry32(0x5C1F0001)();
  check('mulberry32(0x5C1F0001) first draw is the pinned literal (PRNG can\'t drift)',
        Object.is(firstDraw, 0.3510491873603314), 'first draw = ' + firstDraw);
}

console.log('\n— Rung (6): THE TEETH — the classical-deflection control is a SMEAR, not the two-pile quantum statistic —');
{
  // The decisive distinction Stern–Gerlach found in 1922 is NOT the mean — it
  // is the DISTRIBUTION. An unpolarized classical beam carries dipoles at every
  // orientation, so classicalDeflect(n,m) = n̂·m̂ spreads CONTINUOUSLY over the
  // FULL deflection range [−1, +1] and FILLS the middle of the screen. The
  // quantum beam lands at exactly TWO values (up or down) and NEVER the middle.
  // Swapping the honest two-valued sampler for the smeared classical continuum
  // would fill the gap the data refuses to fill — and flip the pill red.
  const z = blochVec(0, 0);

  // (a) the classical landing positions are a CONTINUUM that fills the gap.
  // Sweep the dipole tilt across all orientations a thermal source presents:
  const classicalLandings = new Set();
  let fillsMiddle = false;
  for (let i = 0; i <= 200; i++){
    const th = Math.PI * i / 200, m = blochVec(th, 0);
    const d = classicalDeflect(z, m);               // ∈ [−1, +1], smooth
    classicalLandings.add(d.toFixed(4));
    if (Math.abs(d) < 0.2) fillsMiddle = true;      // lands in the forbidden middle band
  }
  check('classicalDeflect spreads over a CONTINUUM (>150 distinct deflections), filling the screen',
        classicalLandings.size > 150 && fillsMiddle,
        classicalLandings.size + ' distinct landings · includes the middle band the quantum data leaves empty');

  // (b) the quantum sampler is strictly TWO-valued — the middle is ALWAYS empty.
  // sampleSplit only ever produces up / down; there is no continuous landing.
  const SEED = 0x5C1F0001, N = 50000;
  let everMiddle = false;
  for (const deg of [10, 45, 90, 135, 170]){
    const m = blochVec(deg * Math.PI / 180, 0), p = pUp(z, m);
    const { up, down } = sampleSplit(p, N, mulberry32(SEED));
    if (up + down !== N) everMiddle = true;          // any "lost" atom would mean a middle landing
  }
  check('the quantum sampler is strictly TWO-valued — every atom is up OR down, the middle stays empty',
        !everMiddle, 'up + down === N at every θ — exactly two spots, never a smear');

  // (c) so if you predicted landings from the classical law you would FAIL the
  // 50/50-at-90° two-spot law: the classical beam at 90° is NOT half-up/half-
  // down, it is a band centered on zero deflection — visibly the wrong physics.
  const m90 = blochVec(Math.PI / 2, 0);
  const classicalAt90 = classicalDeflect(z, m90);    // === 0 → lands DEAD CENTER (the empty band)
  const quantumAt90 = pUp(z, m90);                    // === 0.5 → half up, half down (two spots)
  check('at θ=90° the classical law lands DEAD CENTER (deflect≈0) where the quantum law forbids any atom',
        Math.abs(classicalAt90) < 1e-12 && quantumAt90 === 0.5,
        'classical deflect = ' + classicalAt90.toExponential(2) + ' (the empty middle) · quantum P(↑) = 0.5 (two spots) — the control fails the two-spot law');
}

console.log('\n— Rung (7): BYTE-TWIN PARITY — the inlined slice === the module, char-for-char —');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const pageSlice = sliceBetween(page, BEGIN, END);
  check("the page's SPIN CORE === core.mjs, char-for-char",
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice === pageSlice ? 'slice ' + pageSlice.length + ' chars identical'
          : 'DRIFT (mod ' + (modSlice && modSlice.length) + ' vs page ' + (pageSlice && pageSlice.length) + ')');

  // Anti-circularity: outside the sentinels, the page must NOT compute a second
  // Born ratio. Forbid any (1 + …dot…)/2 projector and any cos(…/2)**2 form,
  // and any second pUp/overlap2 definition outside the core.
  const i = page.indexOf(BEGIN), j = page.indexOf(END);
  const outside = page.slice(0, i) + page.slice(j);
  const noSecondProjector = !/\(\s*1\s*\+[^)]*\)\s*\/\s*2/.test(outside) &&
                            !/Math\.cos\s*\([^)]*\/\s*2\s*\)\s*\*\*\s*2/.test(outside) &&
                            !/Math\.pow\s*\(\s*Math\.cos\s*\([^)]*\/\s*2/.test(outside) &&
                            !/function\s+pUp\b/.test(outside) &&
                            !/function\s+overlap2\b/.test(outside);
  check('anti-circularity: the page COMPUTES the Born ratio ONLY inside the sentinels',
        noSecondProjector, 'no second (1+…dot)/2 · no cos(…/2)**2 · no local pUp/overlap2 outside the core');
}

console.log('\n—— The Cavern · Spin · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
