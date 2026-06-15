// ============================================================================
//  THE RYDBERG CONSTANT — Node twin of the in-page self-test.
//  Run:  node rydberg/rydberg-core.test.mjs
//
//  Re-proves the same four legs the in-page pill proves (via the shared
//  runSelfTest), then adds DEEPER Node-only checks that would be too slow in the
//  pill, asserts the SINGLE-SOURCE discipline holds (anti-circularity grep +
//  value-identity of the truth constant), and proves both byte-twins (the rydberg
//  core inlined in index.html, and the spectroscope physics core) are char-for-char
//  the imported authority — so "self-test green" can't drift from the module.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  NS, T_DOF2_68, T_DOF2_95,
  buildPoints, fitL2SE, recoverR, runSelfTest,
  RYDBERG_H, balmerWavelengthNm, balmerWavelengthAirNm,
  fitL2, gdFit, fitL1, makeRng, gauss,
} from './rydberg-core.mjs';
import { RYDBERG_H as SPECTRO_RYDBERG_H } from '../spectroscope/spectroscope-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

// ── 1. THE FULL SHARED SELF-TEST (the four legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the four legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. THE HEADLINE COVERAGE on 20k seeds (where 68.3/94.8 was measured). ─────
// In the pill we run 2000 seeds (fast); here 20000 to pin the asymptotic coverage.
{
  const noiseFrac = 0.001, NSEED = 20000;
  let sumR = 0, in68 = 0, in95 = 0, in1 = 0;
  for (let s = 1; s <= NSEED; s++) {
    const P = buildPoints({ medium: 'vacuum', noiseFrac, seed: s });
    const f = fitL2(P);
    const R = -f.m;
    const SE_R = fitL2SE(P, f).SE_m;
    sumR += R;
    if (Math.abs(R - RYDBERG_H) <= 1 * SE_R) in1++;
    if (Math.abs(R - RYDBERG_H) <= T_DOF2_68 * SE_R) in68++;
    if (Math.abs(R - RYDBERG_H) <= T_DOF2_95 * SE_R) in95++;
  }
  const bias = Math.abs(sumR / NSEED - RYDBERG_H) / RYDBERG_H;
  const c1 = in1 / NSEED, c68 = in68 / NSEED, c95 = in95 / NSEED;
  check('coverage @20k seeds: t68·SE ≈ 68.3% ∈[0.66,0.71] and t95·SE ≈ 94.8% ∈[0.93,0.96]',
        c68 >= 0.66 && c68 <= 0.71 && c95 >= 0.93 && c95 <= 0.96,
        `bias ${(bias * 100).toFixed(4)}% · 1·SE=${(c1 * 100).toFixed(1)}% t68=${(c68 * 100).toFixed(1)}% t95=${(c95 * 100).toFixed(1)}%`);
  // the WHOLE POINT of the t-band: ±1·SE under-covers (the naive normal claim fails).
  check('±1·SE under-covers (≈ 57.5%, NOT 68%) — why the Student-t(2) band is load-bearing',
        c1 > 0.54 && c1 < 0.61, `±1·SE covers ${(c1 * 100).toFixed(1)}% (a "68% within 1·SE" claim WOULD FAIL)`);
}

// ── 3. THE AIR TRAP to the ppm: exactly (n_air−1) on both −m and 4b. ──────────
{
  const Pa = buildPoints({ medium: 'air', noiseFrac: 0, seed: 1 });
  const f = fitL2(Pa);
  const ppmSlope = ((-f.m) - RYDBERG_H) / RYDBERG_H * 1e6;
  const ppmInter = (4 * f.b - RYDBERG_H) / RYDBERG_H * 1e6;
  const ppmExpect = (balmerWavelengthNm(3) / balmerWavelengthAirNm(3) - 1) * 1e6; // (n_air−1)
  check('air trap == 277.00 ppm on −m AND 4b, to 0.01 ppm, with R²≈1',
        Math.abs(ppmSlope - ppmExpect) < 1e-3 && Math.abs(ppmInter - ppmExpect) < 1e-3 && Math.abs(f.r2 - 1) < 1e-9,
        `−m ${ppmSlope.toFixed(2)} ppm · 4b ${ppmInter.toFixed(2)} ppm · expect ${ppmExpect.toFixed(2)} ppm · R²=${f.r2.toFixed(12)}`);
}

// ── 4. NOISELESS IDENTITY to machine-eps, re-derived here. ────────────────────
{
  const P = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 7 });
  const f = fitL2(P);
  const relSlope = Math.abs((-f.m) - RYDBERG_H) / RYDBERG_H;
  const agree = Math.abs((-f.m) - 4 * f.b) / RYDBERG_H;
  check('noiseless identity: −m == R_H to ~1e-15 and −m == 4b bit-identical (seed-invariant @ σ=0)',
        relSlope < 1e-12 && agree === 0 && f.sse < 1e-18,
        `−m rel ${relSlope.toExponential(2)} · |−m−4b|/R ${agree.toExponential(2)} · Σr² ${f.sse.toExponential(2)}`);
}

// ── 5. SEED STABILITY: turning σ GROWS the same pattern (sign-stable jitter). ──
// gauss consumes a fixed 2 pulls/point and is σ-independent, so the per-point noise
// at σ=2x is exactly 2x the noise at σ=1x (same seed) — same pattern, not reshuffled.
{
  const lo = buildPoints({ medium: 'vacuum', noiseFrac: 0.001, seed: 42 });
  const hi = buildPoints({ medium: 'vacuum', noiseFrac: 0.002, seed: 42 });
  const tru = buildPoints({ medium: 'vacuum', noiseFrac: 0, seed: 42 });
  let okPattern = true, maxRatioErr = 0;
  for (let i = 0; i < NS.length; i++) {
    const dLo = lo[i].y - tru[i].y, dHi = hi[i].y - tru[i].y;
    if (Math.abs(dLo) > 1e-12) {
      const ratioErr = Math.abs(dHi / dLo - 2);
      maxRatioErr = Math.max(maxRatioErr, ratioErr);
      if (ratioErr > 1e-9) okPattern = false;
    }
  }
  check('σ-knob grows the SAME jitter pattern (2×σ ⇒ 2× each per-point offset, never reshuffled)',
        okPattern, `max ratio err ${maxRatioErr.toExponential(2)}`);
}

console.log('\n— Single-source discipline (the proofs the numbers are not re-typed) —');

// ── 6. TRUTH-SOURCE VALUE IDENTITY: the constant we grade R against IS the ─────
// spectroscope's own RYDBERG_H (same value reached through rydberg-core's re-export
// AND through a direct import of spectroscope-core) — not a copy.
{
  check('truth-source identity: rydberg-core RYDBERG_H === spectroscope-core RYDBERG_H (one value, not a copy)',
        RYDBERG_H === SPECTRO_RYDBERG_H, `R_H = ${RYDBERG_H.toExponential(10)} /m`);
}

// ── 7. ANTI-CIRCULARITY GREP: rydberg-core source names NO physics digit-literal. ─
{
  const src = readFileSync(join(__dir, 'rydberg-core.mjs'), 'utf8');
  const forbidden = ['1.09677', '1.0973731568', '1.000277'];
  const hit = forbidden.filter(s => src.includes(s));
  check('anti-circularity grep: rydberg-core.mjs contains NONE of R_H/R∞/n_air’s digit-literals (they live only in spectroscope-core)',
        hit.length === 0, hit.length === 0 ? 'clean — 0 forbidden literals' : 'FOUND: ' + hit.join(', '));
}

console.log('\n— Byte-twin parity (the inlined cores === the modules, char-for-char) —');

// ── 8. RYDBERG byte-twin: the core inlined in index.html === rydberg-core.mjs. ─
{
  const BEGIN = '// ===== RYDBERG CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== RYDBERG CORE END =====';
  const mod = readFileSync(join(__dir, 'rydberg-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('rydberg byte-twin: index.html core is char-for-char rydberg-core.mjs (between sentinels)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length} chars)`));
}

// ── 9. SPECTROSCOPE byte-twin (Step 0 extraction): the inlined physics block ───
// in spectroscope/index.html === spectroscope-core.mjs, char-for-char.
{
  const BEGIN = '// ===== SPECTROSCOPE PHYSICS CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== SPECTROSCOPE PHYSICS CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'spectroscope', 'spectroscope-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, '..', 'spectroscope', 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('spectroscope byte-twin: index.html physics block is char-for-char spectroscope-core.mjs (Step 0 extraction)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length} chars)`));
}

function sliceBetween(text, begin, end) {
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

console.log(`\n—— Rydberg Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
