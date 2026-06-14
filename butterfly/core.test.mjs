// ============================================================================
//  THE BUTTERFLY — Node twin of the in-page self-test.
//  Run:  node butterfly/core.test.mjs
//  Proves the 3-part falsifiable claim EXACT, with INDEPENDENT re-derivations
//  (not just the bundled self-test), and asserts the core inlined in index.html
//  is byte-identical to this module (re-extraction parity), so "self-test green"
//  can't drift.
// ============================================================================
import {
  cExp, cMul, maxDiff,
  isPow2, nextPow2,
  fft, ifft, dft, idft,
  conv, fftConvolve, roundArr, maxAbsDiff,
  makeRng, randomSignal, randomPoly,
  bitReverse, fftStages, fftIterative,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// (A) A hand-checked DFT of a known signal: the DFT of [1,1,1,1] is [4,0,0,0].
{
  const x = [1, 1, 1, 1].map(function (v) { return { re: v, im: 0 }; });
  const X = dft(x);
  const expected = [{ re: 4, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }];
  check('DFT of [1,1,1,1] == [4,0,0,0] (hand-checked)', maxDiff(X, expected) < 1e-12,
        'X[0]=' + X[0].re.toFixed(6));
  // and a single-frequency tone: x[n]=cos(2π·n/N) has all energy in bins 1 and N−1.
  const N = 8;
  const tone = [];
  for (let n = 0; n < N; n++) tone.push({ re: Math.cos(2 * Math.PI * n / N), im: 0 });
  const T = dft(tone);
  check('DFT of cos(2πn/8): bin 1 and bin 7 carry N/2=4, the rest ~0',
        Math.abs(T[1].re - 4) < 1e-10 && Math.abs(T[7].re - 4) < 1e-10 &&
        Math.abs(T[2].re) < 1e-10 && Math.abs(T[3].re) < 1e-10,
        'T[1]=' + T[1].re.toFixed(4) + ' T[7]=' + T[7].re.toFixed(4));
}

// (B) FAST == SLOW across a wide seed sweep with a DIFFERENT PRNG seed than the
//     bundled test, larger N — they still agree to machine precision.
{
  let worst = 0;
  const rng = makeRng(0xDEADBEEF);
  for (const N of [2, 4, 8, 16, 32, 64, 128, 256]) {
    for (let trial = 0; trial < 8; trial++) {
      const x = randomSignal(rng, N);
      worst = Math.max(worst, maxDiff(fft(x), dft(x)));
    }
  }
  check('fft == dft over N up to 256, fresh seeds, worst |Δ| < 1e-11', worst < 1e-11,
        'worst |Δ| = ' + worst.toExponential(2));
}

// (C) ROUND-TRIP both ways with random COMPLEX signals (not just real).
{
  let worstF = 0, worstS = 0;
  const rng = makeRng(0xC0FFEE);
  for (const N of [2, 8, 32, 128]) {
    for (let t = 0; t < 6; t++) {
      const x = randomSignal(rng, N);
      worstF = Math.max(worstF, maxDiff(ifft(fft(x)), x));
      worstS = Math.max(worstS, maxDiff(idft(dft(x)), x));
    }
  }
  check('ifft(fft(x)) == x (complex signals) to <1e-12', worstF < 1e-12, 'worst |Δ| = ' + worstF.toExponential(2));
  check('idft(dft(x)) == x (complex signals) to <1e-12', worstS < 1e-12, 'worst |Δ| = ' + worstS.toExponential(2));
}

// (D) The staged (drawable) FFT agrees with the recursive fft() AND its final
//     stage is exactly the bit-reversal-free natural-order result.
{
  let worst = 0;
  const rng = makeRng(0xABAD1DEA);
  for (const N of [2, 4, 8, 16, 32]) {
    for (let t = 0; t < 6; t++) {
      const x = randomSignal(rng, N);
      worst = Math.max(worst, maxDiff(fftIterative(x), fft(x)));
    }
  }
  check('staged/iterative FFT == recursive fft() (the animated picture is faithful)', worst < 1e-12,
        'worst |Δ| = ' + worst.toExponential(2));
  // bit-reversal sanity: for 8 points, bitReverse(1,3)=4, bitReverse(3,3)=6.
  check('bitReverse(1,3)==4 and bitReverse(3,3)==6 (the lane permutation)',
        bitReverse(1, 3) === 4 && bitReverse(3, 3) === 6);
  // the number of butterflies in stage s of a length-N FFT is N/2; total = (N/2)·log2 N.
  {
    const N = 16;
    const x = randomSignal(makeRng(7), N);
    const stages = fftStages(x, -1);
    let totalBf = 0;
    for (let s = 1; s < stages.length; s++) totalBf += stages[s].butterflies.length;
    check('a length-16 FFT has (N/2)·log2 N = 32 butterflies across 4 stages',
          stages.length === 5 && totalBf === 32, 'stages=' + (stages.length - 1) + ' butterflies=' + totalBf);
  }
}

// (E) THE CONVOLUTION THEOREM — independent of the bundled test: a hand-checked
//     polynomial product, then a wide random sweep with byte-identical rounding.
{
  // (1+2x)·(3+4x) = 3 + 10x + 8x²  ⇒  conv([1,2],[3,4]) = [3,10,8].
  check('conv([1,2],[3,4]) == [3,10,8] (hand-checked polynomial product)',
        JSON.stringify(conv([1, 2], [3, 4])) === JSON.stringify([3, 10, 8]));
  // the FFT route, zero-padded, byte-identical after rounding:
  check('fftConvolve([1,2],[3,4],pad) rounds to [3,10,8] (FFT route, byte-identical)',
        JSON.stringify(roundArr(fftConvolve([1, 2], [3, 4], true), 6)) === JSON.stringify([3, 10, 8]));

  let worst = 0, allByte = true;
  const rng = makeRng(0x5EEDED);
  for (let t = 0; t < 80; t++) {
    const la = 1 + (t % 12), lb = 1 + ((t * 5) % 10);
    const a = randomPoly(rng, la, -12, 12);
    const b = randomPoly(rng, lb, -12, 12);
    const slow = conv(a, b);
    const fast = fftConvolve(a, b, true);
    worst = Math.max(worst, maxAbsDiff(slow, fast));
    if (JSON.stringify(roundArr(slow, 6)) !== JSON.stringify(roundArr(fast, 6))) allByte = false;
  }
  check('convolution theorem: FFT-conv == schoolbook conv to <1e-9 over 80 polys', worst < 1e-9,
        'worst |Δ| = ' + worst.toExponential(2));
  check('convolution theorem: rounded(6dp) vectors BYTE-IDENTICAL over 80 polys', allByte,
        allByte ? 'all char-for-char equal' : 'a pair differed!');
}

// (F) TEETH — the circular (un-padded) convolution PROVABLY differs from linear,
//     on a case where the wraparound is non-trivial, AND matches the aliasing
//     model linear[i] + linear[i+N].  (Independent of the bundled test.)
{
  const a = [3, 1, 4, 1, 5, 9];   // length 6
  const b = [2, 6, 5, 3, 5, 8];   // length 6 ⇒ linear length 11, circular length 8 (nextPow2(6))
  const linear = conv(a, b);                  // length 11
  const circular = fftConvolve(a, b, false);  // length nextPow2(max(6,6)) = 8 ⇒ coeffs 8,9,10 wrap
  const N = circular.length;
  const aliased = new Array(N).fill(0);
  for (let i = 0; i < linear.length; i++) aliased[i % N] += linear[i];
  let aliasErr = 0, headDiff = 0;
  for (let i = 0; i < N; i++) {
    aliasErr = Math.max(aliasErr, Math.abs(circular[i] - aliased[i]));
    headDiff = Math.max(headDiff, Math.abs(circular[i] - (linear[i] || 0)));
  }
  check('TEETH: circular conv == linear with the tail wrapped (aliasing identity)', aliasErr < 1e-9,
        'alias-model |Δ| = ' + aliasErr.toExponential(2));
  check('TEETH: circular conv PROVABLY DIFFERS from linear (the wraparound bites)', headDiff > 1,
        'max corruption = ' + headDiff.toFixed(2));
  // a wraparound case where lengths force aliasing hardest: equal length-4 polys.
  {
    const x = [1, 2, 3, 4], y = [5, 6, 7, 8];
    const lin = conv(x, y);                 // length 7
    const circ = fftConvolve(x, y, false);  // length 4
    check('TEETH: 4×4 circular length is 4 (no headroom) and differs from the length-7 linear',
          circ.length === 4 && Math.abs(circ[0] - lin[0]) > 1,
          'circ[0]=' + circ[0] + ' vs lin[0]=' + lin[0]);
  }
}

// (G) POWER-OF-TWO guards.
{
  check('isPow2: 1,2,4,8,16,256 true; 0,3,6,7,12 false',
        [1, 2, 4, 8, 16, 256].every(isPow2) && ![0, 3, 6, 7, 12].some(isPow2));
  check('nextPow2: 5→8, 8→8, 9→16, 1000→1024',
        nextPow2(5) === 8 && nextPow2(8) === 8 && nextPow2(9) === 16 && nextPow2(1000) === 1024);
  let threw = false;
  try { fft([{ re: 1, im: 0 }, { re: 2, im: 0 }, { re: 3, im: 0 }]); } catch (e) { threw = true; }
  check('fft of a non-power-of-two length THROWS (radix-2 only)', threw);
}

// (H) SOURCE-DISJOINTNESS asserted independently here too: the fast-path source
//     must never reference the slow path.
{
  const fastSrc = [fft, ifft, fftStages, fftIterative].map(function (f) { return f.toString(); }).join('\n');
  check('the FFT path source never calls dft/idft (independent grep)',
        !/\bi?dft\s*\(/.test(fastSrc));
  // and conversely the schoolbook conv never calls fft:
  check('the schoolbook conv source never calls fft/ifft (independent grep)',
        !/\bi?fft\s*\(/.test(conv.toString()));
}

// (I) Determinism: two full runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const b = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === b);
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== BUTTERFLY CORE sentinels).
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== BUTTERFLY CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BUTTERFLY CORE =====';

  // Extract from the module: everything from the first helper to the export.
  const modBody = modSrc
    .slice(modSrc.indexOf('function cx('), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the BUTTERFLY CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    // the page wraps the same functions in an IIFE and drops `export`; compare
    // the shared bodies, normalised for leading indentation.
    const norm = function (s) { return s.replace(/^\s+/gm, '').replace(/\r/g, '').trim(); };
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
