// ============================================================================
//  THE MOIRÉ BENCH — Node twin of the in-page self-test.
//  Run:  node moire-bench/moire-core.test.mjs
//
//  Re-proves the same legs the in-page pill proves (via the shared runSelfTest),
//  then adds Node-only re-derivations:
//    • DEEPER ROTATION SWEEP — every degree 3°→clampMax, measured D vs the closed
//      form, asserting <1% each step (the claim across the whole regime).
//    • DEEPER TWO-PITCH SWEEP — fine p₂ steps, measured D vs p₁p₂/|p₁−p₂|, <1%.
//    • ANTI-CIRCULARITY GREP — moire-core.mjs holds NO FFT digit-math and never
//      references dft/bitReverse/twiddle; it IMPORTS fft from ../butterfly/core.mjs.
//    • BYTE-TWIN PARITY (two checks, the sliceBetween helper): (1) the inlined
//      MOIRE CORE block in index.html === the module's slice; (2) the inlined
//      BUTTERFLY CORE block === the SAME slice butterfly/index.html inlines (so
//      "the page's fft IS the Butterfly's fft").
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  runSelfTest, measureSpacing, spacingRotation, spacingTwoPitch, clampTheta,
} from './moire-core.mjs';
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

// ── 1. THE FULL SHARED SELF-TEST (the six legs, identical to the pill). ────────
console.log('\n— The full in-page self-test (the six legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. DEEPER ROTATION SWEEP — every degree 3°→clampMax, measured vs closed. ───
{
  // N=512 here (the deepest Node-only re-derivation): the small-angle end has a
  // very wide fringe, so the extra resolution keeps even θ=3° under 1%.
  const N = 512, p = 12, ds = p / 4;   // carrier at 4 px/period, above Nyquist
  // clampMax in degrees (clampTheta's ceiling): θmax = 2·asin(1/6)
  const degMax = Math.floor(clampTheta(Math.PI, p) * 180 / Math.PI);
  let worst = 0, worstDeg = 0, steps = 0;
  for (let deg = 3; deg <= degMax; deg += 1){
    const theta = deg * Math.PI / 180;
    const predicted = spacingRotation(p, theta);
    const m = measureSpacing(p, theta / 2, p, -theta / 2, N, ds);
    const rel = Math.abs(m.spacing - predicted) / predicted;
    if (rel > worst){ worst = rel; worstDeg = deg; }
    steps++;
  }
  check('ROTATION SWEEP: every degree θ∈[3°,' + degMax + '°] measured D matches p/(2 sin(θ/2)) to <1% (the whole rotation regime, not one preset)',
        worst < 0.01 && steps > 10,
        steps + ' steps · worst rel.err=' + (worst * 100).toFixed(3) + '% @ θ=' + worstDeg + '°');
}

// ── 3. DEEPER TWO-PITCH SWEEP — fine p₂ steps, measured vs closed. ─────────────
{
  const N = 256, p1 = 12, ds = p1 / 4;
  let worst = 0, worstP2 = 0, steps = 0;
  for (let p2 = 12.4; p2 <= 16.0; p2 += 0.2){
    const predicted = spacingTwoPitch(p1, p2);
    const m = measureSpacing(p1, 0, p2, 0, N, ds);
    const rel = Math.abs(m.spacing - predicted) / predicted;
    if (rel > worst){ worst = rel; worstP2 = p2; }
    steps++;
  }
  check('TWO-PITCH SWEEP: fine p₂∈[12.4,16.0] measured D matches p₁p₂/|p₁−p₂| to <1% every step',
        worst < 0.01 && steps > 10,
        steps + ' steps · worst rel.err=' + (worst * 100).toFixed(3) + '% @ p₂=' + worstP2.toFixed(1));
}

// ── 3b. NEG-CONTROL SWEEP — every coincident config returns Infinity (no fringe). ─
{
  const N = 256;
  let bad = 0, steps = 0;
  for (let p = 8; p <= 16; p += 1){
    const ds = p / 4;
    const m = measureSpacing(p, 0, p, 0, N, ds);
    if (m.spacing !== Infinity) bad++;
    steps++;
  }
  check('NEG-CONTROL SWEEP: every coincident config (θ=0, p₁=p₂) returns spacing=∞ (never 0/NaN) — flat field, no fringe',
        bad === 0 && steps > 5, steps + ' pitches · non-∞ count=' + bad);
}

console.log('\n— Anti-circularity (the transform is IMPORTED, not re-typed here) —');

// ── 4. ANTI-CIRCULARITY GREP — no FFT digit-math, no dft, in moire-core. ───────
{
  const src = readFileSync(join(__dir, 'moire-core.mjs'), 'utf8');
  const noDft = !/\bdft\s*\(/.test(src) && !/\bidft\s*\(/.test(src);
  // moire-core must not implement its own FFT: no bit-reversal / twiddle recursion
  // / radix-2 butterfly — those live ONLY in butterfly/core.mjs.
  const noFftGuts = !/bitReverse|fftRadix2|twiddle|W_N/.test(src);
  const importsTransform = /import\s*\{[^}]*\bfft\b[^}]*\}\s*from\s*['"]\.\.\/butterfly\/core\.mjs['"]/.test(src);
  check('anti-circularity grep: moire-core.mjs references no dft/idft, contains no FFT internals (bitReverse/twiddle/fftRadix2), and IMPORTS fft from ../butterfly/core.mjs',
        noDft && noFftGuts && importsTransform,
        'no dft=' + noDft + ' · no fft-guts=' + noFftGuts + ' · imports transform=' + importsTransform);
}

console.log('\n— Byte-twin parity (the two inlined cores === their sources, char-for-char) —');

// ── 5. MOIRE-CORE byte-twin: page's inline moire block === the module. ─────────
{
  const BEGIN = '// ===== MOIRE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== MOIRE CORE END =====';
  const mod = readFileSync(join(__dir, 'moire-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('moire-core byte-twin: index.html moire block is char-for-char moire-core.mjs (between sentinels)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? 'slice ' + modSlice.length + ' chars identical' : 'DRIFT (mod ' + modSlice.length + ' vs page ' + pageSlice.length + ')'));
}

// ── 6. BUTTERFLY-CORE byte-twin: page's inline butterfly block === the SAME
//      slice butterfly/index.html inlines (the page's fft IS the Butterfly's fft).
{
  const BEGIN = '// ===== BUTTERFLY CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BUTTERFLY CORE =====';
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const butterflyPage = readFileSync(join(__dir, '..', 'butterfly', 'index.html'), 'utf8');
  const ourSlice = sliceBetween(page, BEGIN, END);
  const theirSlice = sliceBetween(butterflyPage, BEGIN, END);
  check('butterfly-core byte-twin: our inline butterfly block is char-for-char the SAME slice butterfly/index.html inlines (the page\'s fft IS the Butterfly\'s fft)',
        ourSlice != null && theirSlice != null && ourSlice === theirSlice,
        ourSlice == null ? 'our sentinels MISSING' : theirSlice == null ? 'butterfly sentinels MISSING' :
          (ourSlice === theirSlice ? 'slice ' + ourSlice.length + ' chars identical' : 'DRIFT (ours ' + ourSlice.length + ' vs butterfly ' + theirSlice.length + ')'));
}

console.log('\n—— The Moiré Bench Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
