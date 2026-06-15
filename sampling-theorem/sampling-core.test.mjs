// ============================================================================
//  THE SAMPLING THEOREM — Node twin of the in-page self-test.
//  Run:  node sampling-theorem/sampling-core.test.mjs
//
//  Re-proves the same legs the in-page pill proves (via the shared runSelfTest),
//  then adds Node-only re-derivations:
//    • a SWEEP — every bin c>128 aliases BYTE-EXACT to (256−c), every c<128
//      reconstructs clean (the claim across the whole band, not one preset).
//    • ANTI-CIRCULARITY GREP — sampling-core.mjs holds NO FFT digit-literals and
//      never references `dft` (the transform is IMPORTED, not re-typed here).
//    • BYTE-TWIN PARITY (two checks, the exact sliceBetween helper from
//      voice-core.test.mjs): (1) the inlined SAMPLING CORE block === the module's
//      slice; (2) the inlined BUTTERFLY CORE block === the SAME slice
//      butterfly/index.html inlines (so "the page's fft IS the Butterfly's fft").
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  runSelfTest, sampleToneLUT, foldedFreq, spectrum, reconstructPeriodic,
  sourceValue, N_DEFAULT,
} from './sampling-core.mjs';
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

// ── 1. THE FULL SHARED SELF-TEST (the seven legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the seven legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. THE SWEEP — every c>128 aliases byte-exact to 256−c. ───────────────────
{
  const N = N_DEFAULT;
  let worstMis = 0, worstDiff = 0, worstWrongPeak = 0;
  for (let c = N / 2 + 1; c < N; c++){
    const cAlias = N - c;                          // ∈ [1, 127]
    const xTrue = sampleToneLUT(c, N);
    const xAlias = sampleToneLUT(cAlias, N);
    let mis = 0, md = 0;
    for (let i = 0; i < N; i++){
      const d = Math.abs(xTrue[i] - xAlias[i]);
      if (d > md) md = d;
      if (xTrue[i] !== xAlias[i]) mis++;
    }
    worstMis = Math.max(worstMis, mis);
    worstDiff = Math.max(worstDiff, md);
    // the imported FFT must place the peak at the folded (low) bin
    const sp = spectrum(xTrue);
    if (sp.kPeakLow !== cAlias) worstWrongPeak++;
  }
  check('SWEEP (alias): every bin c ∈ [129,255] samples BYTE-EXACT (===) to its fold 256−c, and the imported FFT peaks at the folded bin every time',
        worstMis === 0 && worstDiff === 0 && worstWrongPeak === 0,
        '127 bins · worst mismatched=' + worstMis + ' · worst maxAbsDiff=' + worstDiff + ' · FFT peak-at-wrong-bin count=' + worstWrongPeak);
}

// ── 3. THE SWEEP — every c<128 reconstructs clean below Nyquist. ──────────────
{
  const N = N_DEFAULT, fs = 64;                    // Δf = fs/N = 0.25 Hz
  let worstErr = 0, worstC = 0;
  const P = N / fs;
  const ts = new Float64Array(211);
  for (let i = 0; i < ts.length; i++) ts[i] = (i + 0.4137) / ts.length * P;
  // a representative sweep of single-component band-limited cosines, bin c < N/2
  for (let c = 1; c < N / 2; c += 1){
    const f = c * fs / N;                          // < fs/2, below Nyquist
    const comps = [{ f, amp: 1 }];
    const samples = new Float64Array(N);
    for (let n = 0; n < N; n++) samples[n] = sourceValue(comps, n / fs);
    const recon = reconstructPeriodic(samples, fs, ts);
    let err = 0;
    for (let i = 0; i < ts.length; i++) err = Math.max(err, Math.abs(recon[i] - sourceValue(comps, ts[i])));
    if (err > worstErr){ worstErr = err; worstC = c; }
  }
  check('SWEEP (reconstruct): every band-limited cosine bin c ∈ [1,127] (f<fs/2) reconstructs to <1e-9 via the periodic kernel — below the line, exact',
        worstErr < 1e-9,
        '127 bins · worst maxAbsErr=' + worstErr.toExponential(2) + ' @ c=' + worstC);
}

// ── 4. foldedFreq names the alias across the whole undersampled band. ─────────
{
  const N = N_DEFAULT, fs = 30;
  let worst = 0;
  for (let c = N / 2 + 1; c < N; c++){
    const f = c * fs / N, cAlias = N - c;
    const expected = cAlias * fs / N;
    worst = Math.max(worst, Math.abs(foldedFreq(f, fs) - expected));
  }
  check('foldedFreq names the alias across c ∈ [129,255]: |foldedFreq(f,fs) − (256−c)·fs/N| < 1e-12 every bin',
        worst < 1e-12, 'worst Δ = ' + worst.toExponential(2) + ' Hz');
}

console.log('\n— Anti-circularity (the transform is IMPORTED, not re-typed here) —');

// ── 5. ANTI-CIRCULARITY GREP — no FFT digit-math, no dft, in sampling-core. ───
{
  const src = readFileSync(join(__dir, 'sampling-core.mjs'), 'utf8');
  const noDft = !/\bdft\s*\(/.test(src) && !/\bidft\s*\(/.test(src);
  // sampling-core must not implement its own FFT: it has no bit-reversal / twiddle
  // recursion / butterfly recombination — those live ONLY in butterfly/core.mjs.
  const noFftGuts = !/bitReverse|fftRadix2|twiddle|W_N|e\^\(.2.i/.test(src);
  // it imports the transform rather than spelling it out
  const importsTransform = /import\s*\{[^}]*\bfft\b[^}]*\}\s*from\s*['"]\.\.\/butterfly\/core\.mjs['"]/.test(src);
  check('anti-circularity grep: sampling-core.mjs references no dft/idft, contains no FFT internals (bitReverse/twiddle/butterfly), and IMPORTS fft from ../butterfly/core.mjs',
        noDft && noFftGuts && importsTransform,
        'no dft=' + noDft + ' · no fft-guts=' + noFftGuts + ' · imports transform=' + importsTransform);
}

console.log('\n— Byte-twin parity (the two inlined cores === their sources, char-for-char) —');

// ── 6. SAMPLING-CORE byte-twin: page's inline sampling block === the module. ──
{
  const BEGIN = '// ===== SAMPLING CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== SAMPLING CORE END =====';
  const mod = readFileSync(join(__dir, 'sampling-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('sampling-core byte-twin: index.html sampling block is char-for-char sampling-core.mjs (between sentinels)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? 'slice ' + modSlice.length + ' chars identical' : 'DRIFT (mod ' + modSlice.length + ' vs page ' + pageSlice.length + ')'));
}

// ── 7. BUTTERFLY-CORE byte-twin: page's inline butterfly block === the SAME
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

console.log('\n—— The Sampling Theorem Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
