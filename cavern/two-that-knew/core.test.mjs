// ============================================================================
//  THE CAVERN · TWO THAT KNEW — Node twin of the entangled-pair core.
//  Run:  node cavern/two-that-knew/core.test.mjs
//
//  Proves Bell/CHSH headless. (1) E computed two independent ways agree to ε —
//  the closed form −cos(a−b) and the Born-rule projector ⟨ψ⁻|σ(a)⊗σ(b)|ψ⁻⟩ — so
//  E IS the Born rule. (2) the hero numbers exact. (3) THE HEADLINE: at the
//  canonical dials S = 2√2 and crosses the classical ceiling 2. (4) Tsirelson is
//  the ceiling over a random search. (5) the local-hidden-variable control caps
//  at EXACTLY 2 (the exhaustive 16-case algebraic proof + a swept dial grid), and
//  the quantum-vs-LHV gap at CANON is the whole point (>0.8). (6) the seeded
//  per-pair sampler reproduces E and is deterministic. (7) the BYTE-TWIN parity
//  (slice in index.html === core.mjs char-for-char). (8) the anti-circularity
//  grep. process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  correlation, chsh, CANON, TSIRELSON, CLASSICAL_CEILING,
  correlationProjector, sigma, kron2, PSI_MINUS,
  lhvA, lhvB, E_LHV, chshLHV, mulberry32, sampleSinglet,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const D = Math.PI / 180;
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

console.log('\n— Rung (1): TWO DERIVATIONS AGREE — correlation(closed) === ⟨ψ⁻|σ(a)⊗σ(b)|ψ⁻⟩ (Born) —');
{
  let worst = 0, npts = 0;
  for (let i = 0; i <= 360; i++) for (let j = 0; j <= 360; j++){
    const a = i * D, b = j * D;
    worst = Math.max(worst, Math.abs(correlation(a, b) - correlationProjector(a, b)));
    npts++;
  }
  check('E(a,b) === Born-rule projector over a dense (a,b) angle grid (worst < 1e-12)',
        worst < 1e-12, npts.toLocaleString() + ' points · max |Δ| = ' + worst.toExponential(2) +
        '  — so E = −cos(a−b) IS the Born rule, not assumed');
}

console.log('\n— Rung (2): HERO NUMBERS — exact —');
{
  check('E(0,0) Object.is −1 exactly (perfect anti-correlation: opposite every time)', Object.is(correlation(0, 0), -1));
  check('E(0,π) within 1e-15 of +1 (always the same)', Math.abs(correlation(0, Math.PI) - 1) < 1e-15,
        'E = ' + correlation(0, Math.PI).toFixed(17));
  // E(0,π/2) = −cos(π/2): the IEEE value of π/2 makes cos ≈ 6.12e-17, so the
  // correlation vanishes to machine ε (not bit-zero — that float doesn't exist).
  check('E(0,π/2) within 1e-15 of 0 (anti-corr vanishes at 90°)', Math.abs(correlation(0, Math.PI / 2)) < 1e-15,
        'E = ' + correlation(0, Math.PI / 2).toExponential(2));
  check('E(0,π/4) within 1e-15 of −1/√2', Math.abs(correlation(0, Math.PI / 4) - (-1 / Math.SQRT2)) < 1e-15,
        'E = ' + correlation(0, Math.PI / 4).toFixed(17));
}

console.log('\n— Rung (3): THE HEADLINE — S(CANON) = 2√2 and CROSSES the classical ceiling 2 —');
{
  const S = chsh(CANON.a, CANON.ap, CANON.b, CANON.bp);
  check('chsh(CANON) within 1e-9 of TSIRELSON = 2√2', Math.abs(S - TSIRELSON) < 1e-9,
        'S = ' + S.toPrecision(18) + ' · |Δ| = ' + Math.abs(S - TSIRELSON).toExponential(2));
  check('chsh(CANON) > CLASSICAL_CEILING (the wall it crosses)', S > CLASSICAL_CEILING,
        'S = ' + S.toFixed(6) + ' > 2 — a local hidden-variable world cannot reach here');
  // pin the four component E terms (±0.70710678)
  const e1 = correlation(CANON.a, CANON.b),  e2 = correlation(CANON.a, CANON.bp);
  const e3 = correlation(CANON.ap, CANON.b), e4 = correlation(CANON.ap, CANON.bp);
  const r = x => x.toFixed(8);
  const pinned = r(e1) === '-0.70710678' && r(e2) === '0.70710678' &&
                 r(e3) === '-0.70710678' && r(e4) === '-0.70710678';
  check('the four CANON terms pinned: E(0,45)=E(90,45)=E(90,135)=−0.70710678, E(0,135)=+0.70710678', pinned,
        'S = |' + r(e1) + ' − (' + r(e2) + ') + (' + r(e3) + ') + (' + r(e4) + ')| = 4/√2');
}

console.log('\n— Rung (4): TSIRELSON IS THE CEILING — no dials beat 2√2 —');
{
  const rng = mulberry32(0x7C1A0001);
  let worstOver = 0, maxS = 0, tries = 120000;
  for (let t = 0; t < tries; t++){
    const a = rng() * 2 * Math.PI, ap = rng() * 2 * Math.PI, b = rng() * 2 * Math.PI, bp = rng() * 2 * Math.PI;
    const S = chsh(a, ap, b, bp);
    if (S > maxS) maxS = S;
    worstOver = Math.max(worstOver, S - TSIRELSON);
  }
  check('random-searched ' + tries.toLocaleString() + ' quadruples: chsh ≤ TSIRELSON + 1e-12 always', worstOver <= 1e-12,
        'max chsh = ' + maxS.toFixed(8) + ' · worst overshoot = ' + worstOver.toExponential(2));
}

console.log('\n— Rung (5): NEG-CONTROL CAPPED AT 2 — the local-hidden-variable wall —');
{
  // (5a) the EXHAUSTIVE 16-case algebraic cap: Bell's inequality in finitely many
  // lines. Over all 2^4 sign-assignments of the four pre-decided answers, the CHSH
  // combination's absolute value tops out at EXACTLY 2 (integer-tight).
  let maxAlg = 0;
  for (const Aa of [1, -1]) for (const Aap of [1, -1]) for (const Bb of [1, -1]) for (const Bbp of [1, -1]){
    const v = Math.abs(Aa * Bb - Aa * Bbp + Aap * Bb + Aap * Bbp);
    if (v > maxAlg) maxAlg = v;
  }
  check('EXHAUSTIVE 16-case algebraic cap === 2 EXACTLY (any pre-painted coins obey |±±±±| ≤ 2)',
        maxAlg === 2, 'max over all 2^4 sign assignments = ' + maxAlg + ' (integer-tight)');

  // (5b) the realized LHV correlation E_LHV swept over a fine dial grid never beats 2.
  const N = 720;
  let maxLHV = 0, npts = 0;
  const STEP = 10;                                   // 36 angles each → 36^4 quadruples
  for (let i = 0; i < 360; i += STEP) for (let j = 0; j < 360; j += STEP)
    for (let k = 0; k < 360; k += STEP) for (let l = 0; l < 360; l += STEP){
      const S = chshLHV(i * D, j * D, k * D, l * D, N);
      if (S > maxLHV) maxLHV = S;
      npts++;
    }
  check('swept LHV dial grid (36^4 = ' + npts.toLocaleString() + ' quadruples): chshLHV ≤ 2 + 1e-9 always',
        maxLHV <= CLASSICAL_CEILING + 1e-9, 'max chshLHV = ' + maxLHV.toFixed(6));

  // (5c) at CANON the LHV is pinned at 2 while quantum reads 2√2 — the strict gap.
  const sLHV = chshLHV(CANON.a, CANON.ap, CANON.b, CANON.bp, 20000);
  const sQ = chsh(CANON.a, CANON.ap, CANON.b, CANON.bp);
  check('chshLHV(CANON) within 1e-9 of 2 (pinned at the wall)', Math.abs(sLHV - 2) < 1e-9,
        'chshLHV(CANON) = ' + sLHV.toFixed(8));
  check('THE GAP: chsh(CANON) > chshLHV(CANON) + 0.8 (quantum clears the wall by ≈0.828)',
        sQ > sLHV + 0.8, 'quantum ' + sQ.toFixed(6) + ' − LHV ' + sLHV.toFixed(6) + ' = ' + (sQ - sLHV).toFixed(6));
}

console.log('\n— Rung (6): SEEDED SAMPLER — sampleSinglet reproduces E and is deterministic —');
{
  const SEED = 0x2BAE0001, N = 200000;
  let allInBand = true, worstZ = 0;
  for (const dDeg of [0, 45, 90, 135, 180]){
    const a = 0, b = dDeg * D;
    const rng = mulberry32(SEED);
    let sum = 0;
    for (let i = 0; i < N; i++){ const p = sampleSinglet(a, b, rng); sum += p.left * p.right; }
    const mean = sum / N;
    const E = correlation(a, b);
    // mean of ±1 products: variance = 1 − E^2, so σ of the mean = sqrt((1−E^2)/N)
    const sigma = Math.sqrt(Math.max(1 - E * E, 1e-12) / N);
    const z = sigma > 0 ? Math.abs(mean - E) / sigma : 0;
    if (E === 1 || E === -1){ if (Math.abs(mean - E) > 1e-12) allInBand = false; }
    else if (z > 4) allInBand = false;
    worstZ = Math.max(worstZ, z);
  }
  check('seeded 200k means land within ±4σ of E(a,b) at Δ∈{0,45,90,135,180}°', allInBand,
        'worst |mean−E|/σ = ' + worstZ.toFixed(2) + 'σ');

  // determinism: same seed → byte-identical means twice
  function run(){ const rng = mulberry32(SEED); let s = 0; for (let i = 0; i < 50000; i++){ const p = sampleSinglet(0, 45 * D, rng); s += p.left * p.right; } return s; }
  check('same seed → byte-identical accumulate (determinism)', run() === run(), 'sum = ' + run() + ' both runs');

  // mulberry32 literal pin — the first draw can't drift
  const firstDraw = mulberry32(0x2BAE0001)();
  check('mulberry32(0x2BAE0001) first draw is the pinned literal (PRNG can’t drift)',
        Object.is(firstDraw, 0.43883559899404645), 'first draw = ' + firstDraw);
}

console.log('\n— Rung (7): BYTE-TWIN PARITY — the inlined slice === the module, char-for-char —');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const pageSlice = sliceBetween(page, BEGIN, END);
  check("the page's CORE === core.mjs, char-for-char",
        modSlice != null && pageSlice != null && modSlice.length === pageSlice.length && modSlice === pageSlice,
        modSlice === pageSlice ? 'slice ' + pageSlice.length + ' chars identical'
          : 'DRIFT (mod ' + (modSlice && modSlice.length) + ' vs page ' + (pageSlice && pageSlice.length) + ')');
}

console.log('\n— Rung (8): ANTI-CIRCULARITY GREP — the page COMPUTES E/S only inside the sentinels —');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const i = page.indexOf(BEGIN), j = page.indexOf(END);
  const outside = page.slice(0, i) + page.slice(j);
  const forbid = [
    [/-\s*Math\.cos\s*\([^)]*-[^)]*\)/, 'a second −cos(a−b) form'],
    [/function\s+correlation\b/, 'a second correlation()'],
    [/function\s+chsh\b/, 'a second chsh()'],
    [/function\s+correlationProjector\b/, 'a second correlationProjector()'],
    [/PSI_MINUS/, 'a second PSI_MINUS'],
  ];
  const hits = forbid.filter(f => f[0].test(outside)).map(f => f[1]);
  check('outside the sentinels: NO second derivation of E or S (page may DISPLAY, never COMPUTE)',
        hits.length === 0, hits.length ? 'FOUND: ' + hits.join(' · ') : 'clean — the core is the sole authority');
}

console.log('\n—— The Cavern · Two That Knew · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
