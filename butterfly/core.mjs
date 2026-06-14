// ============================================================================
//  THE BUTTERFLY  —  core math (the single source of truth).
//
//  THE ONE IDEA.  The radix-2 Cooley–Tukey FFT: a length-N (N a power of two)
//  signal split into its even- and odd-indexed halves, each transformed, then
//  recombined by BUTTERFLIES with twiddle factors W_N^k = e^(−2πi·k/N).  The
//  whole point is that this divide-and-conquer "fast" path gives the EXACT SAME
//  answer as the brute-force O(N²) "slow" DFT — and once you trust that, the
//  FFT turns the convolution theorem into an EXACT, byte-identical computation:
//  multiplying two polynomials becomes pointwise multiplication in frequency.
//
//  THE FALSIFIABLE CLAIM (proven below, machine-precision):
//    (1) FAST == SLOW.  The recursive radix-2 `fft(x)` equals the source-disjoint
//        naive `dft(x)` (direct Σ x[n]·e^(−2πi·kn/N)) to <1e-12 over many seeds,
//        and `ifft(fft(x)) == x` round-trips to ~1e-12.  The FFT and the DFT are
//        INDEPENDENT code paths — the FFT NEVER calls `dft` — which is exactly
//        what makes "they agree" load-bearing.  A source grep asserts that.
//    (2) THE CONVOLUTION THEOREM, EXACT.  Two polynomials multiplied two
//        source-disjoint ways — schoolbook O(n²) `conv(a,b)` vs
//        `ifft(fft(â)·fft(b̂))` zero-padded to the next power of two ≥
//        len(a)+len(b)−1 — give coefficient vectors equal to ~1e-9 (and, after
//        rounding, byte-identical).
//    (3) TEETH (a negative control that BITES).  Drop the zero-padding and the
//        CIRCULAR convolution `ifft(fft(a)·fft(b))` (same length, no pad)
//        PROVABLY DIFFERS from linear `conv(a,b)` — the wraparound aliasing the
//        padding exists to prevent.
//
//  CONVENTIONS.  A complex number is a plain {re, im} object.  A "signal" is an
//  array of those.  Everything here is exact arithmetic on doubles — no RNG in
//  the transforms themselves; the self-test seeds its own deterministic PRNG.
// ============================================================================

// ---------------------------------------------------------------------------
//  COMPLEX HELPERS  — minimal {re,im} arithmetic.
// ---------------------------------------------------------------------------
function cx(re, im) { return { re: re, im: im === undefined ? 0 : im }; }
function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
function cMul(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
// e^(iθ) as a complex number.
function cExp(theta) { return { re: Math.cos(theta), im: Math.sin(theta) }; }
// worst-case (max) magnitude of the difference between two complex arrays.
function maxDiff(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    const dr = a[i].re - b[i].re, di = a[i].im - b[i].im;
    m = Math.max(m, Math.hypot(dr, di));
  }
  return m;
}

// ---------------------------------------------------------------------------
//  IS-POWER-OF-TWO and the next power of two ≥ n.
// ---------------------------------------------------------------------------
function isPow2(n) { return n >= 1 && (n & (n - 1)) === 0; }
function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ---------------------------------------------------------------------------
//  THE FAST PATH — recursive radix-2 Cooley–Tukey FFT.
//
//  This is a pure decimation-in-time recursion: split into even/odd index
//  halves, transform each (recursively), and butterfly back together with the
//  twiddle W_N^k = e^(sign·2πi·k/N).  `sign` is −1 for the forward transform
//  (fft) and +1 for the inverse (ifft).  N MUST be a power of two.
//
//  CRITICAL: this function NEVER calls `dft`.  Its only dependencies are the
//  complex helpers and itself.  That source-disjointness is what makes the
//  fft==dft agreement a real cross-check, not a tautology.
// ---------------------------------------------------------------------------
function fftRadix2(x, sign) {
  const N = x.length;
  if (N === 1) return [{ re: x[0].re, im: x[0].im }];
  if (!isPow2(N)) throw new Error('radix-2 FFT needs a power-of-two length, got ' + N);
  const half = N / 2;
  const even = new Array(half), odd = new Array(half);
  for (let i = 0; i < half; i++) {
    even[i] = x[2 * i];
    odd[i] = x[2 * i + 1];
  }
  const E = fftRadix2(even, sign);
  const O = fftRadix2(odd, sign);
  const out = new Array(N);
  for (let k = 0; k < half; k++) {
    // twiddle factor W_N^k = e^(sign·2πi·k/N)
    const tw = cExp(sign * 2 * Math.PI * k / N);
    const t = cMul(tw, O[k]);
    out[k] = cAdd(E[k], t);          // top wing
    out[k + half] = cSub(E[k], t);   // bottom wing
  }
  return out;
}

// Forward FFT (no normalisation, sign = −1).
function fft(x) { return fftRadix2(x, -1); }

// Inverse FFT (sign = +1, then divide by N).
function ifft(X) {
  const N = X.length;
  const y = fftRadix2(X, +1);
  return y.map(function (v) { return { re: v.re / N, im: v.im / N }; });
}

// ---------------------------------------------------------------------------
//  THE SLOW PATH — naive O(N²) DFT, a SEPARATE code path.
//
//  Direct evaluation of  X[k] = Σ_n x[n]·e^(−2πi·kn/N).  This shares NO code
//  with the FFT recursion (only the complex helpers).  It exists solely so the
//  self-test can assert fft(x) == dft(x): two strangers' code, the same answer.
//  This is INTENTIONALLY the naive double loop — do not "optimise" it into the
//  FFT, or the agreement check loses its meaning.
// ---------------------------------------------------------------------------
function dft(x) {
  const N = x.length;
  const out = new Array(N);
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const ang = -2 * Math.PI * k * n / N;
      const c = Math.cos(ang), s = Math.sin(ang);
      // x[n] · (c + i·s)
      re += x[n].re * c - x[n].im * s;
      im += x[n].re * s + x[n].im * c;
    }
    out[k] = { re: re, im: im };
  }
  return out;
}

// Naive inverse DFT (the slow counterpart of ifft) — also a separate path,
// used to round-trip-check the slow transform on its own.
function idft(X) {
  const N = X.length;
  const out = new Array(N);
  for (let n = 0; n < N; n++) {
    let re = 0, im = 0;
    for (let k = 0; k < N; k++) {
      const ang = 2 * Math.PI * k * n / N;
      const c = Math.cos(ang), s = Math.sin(ang);
      re += X[k].re * c - X[k].im * s;
      im += X[k].re * s + X[k].im * c;
    }
    out[n] = { re: re / N, im: im / N };
  }
  return out;
}

// ---------------------------------------------------------------------------
//  THE SCHOOLBOOK CONVOLUTION — O(n²) coefficient multiplication of two
//  polynomials a, b (real coefficient arrays, ascending powers).  Result length
//  is len(a)+len(b)−1.  This is the GROUND TRUTH the FFT must reproduce.  It
//  shares NO code with the transforms.
// ---------------------------------------------------------------------------
function conv(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] += a[i] * b[j];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
//  CONVOLUTION VIA THE FFT.  Real coefficient arrays a, b.  When `pad` is true
//  (the LINEAR convolution) we zero-pad both to N = nextPow2(len(a)+len(b)−1),
//  so the cyclic FFT convolution has room and reproduces the linear answer.
//  When `pad` is false (the CIRCULAR convolution — the TEETH) we force both to a
//  common length WITHOUT the headroom, so wraparound aliasing corrupts the tail.
//
//  Returns the real parts of ifft(fft(â)·fft(b̂)), trimmed to `outLen`.
// ---------------------------------------------------------------------------
function toComplex(arr) { return arr.map(function (v) { return { re: v, im: 0 }; }); }

function fftConvolve(a, b, pad) {
  const linLen = a.length + b.length - 1;
  let N;
  if (pad) {
    N = nextPow2(linLen);            // headroom ⇒ linear convolution
  } else {
    N = nextPow2(Math.max(a.length, b.length)); // no headroom ⇒ circular (aliased)
  }
  const A = toComplex(a.concat(new Array(N - a.length).fill(0)));
  const B = toComplex(b.concat(new Array(N - b.length).fill(0)));
  const FA = fft(A), FB = fft(B);
  const prod = new Array(N);
  for (let k = 0; k < N; k++) prod[k] = cMul(FA[k], FB[k]);
  const y = ifft(prod);
  const outLen = pad ? linLen : N;
  const out = new Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = y[i].re;
  return out;
}

// Round a real array to a small number of decimals — used so the convolution
// theorem can be asserted BYTE-IDENTICAL (the residual is pure float noise).
function roundArr(arr, decimals) {
  const f = Math.pow(10, decimals === undefined ? 6 : decimals);
  return arr.map(function (v) {
    const r = Math.round(v * f) / f;
    return r === 0 ? 0 : r; // normalise −0 to 0
  });
}

// max absolute difference between two real arrays (length-padded with 0).
function maxAbsDiff(a, b) {
  const n = Math.max(a.length, b.length);
  let m = 0;
  for (let i = 0; i < n; i++) m = Math.max(m, Math.abs((a[i] || 0) - (b[i] || 0)));
  return m;
}

// ---------------------------------------------------------------------------
//  A small deterministic PRNG (mulberry32) so the self-test's "many seeds" are
//  reproducible — the transforms themselves never touch it.
// ---------------------------------------------------------------------------
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// a random complex signal of length N with components in [−1, 1).
function randomSignal(rng, N) {
  const out = new Array(N);
  for (let i = 0; i < N; i++) out[i] = { re: 2 * rng() - 1, im: 2 * rng() - 1 };
  return out;
}
// a random integer-coefficient polynomial of length len, coeffs in [−lo, hi].
function randomPoly(rng, len, lo, hi) {
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = lo + Math.floor(rng() * (hi - lo + 1));
  return out;
}

// ---------------------------------------------------------------------------
//  THE BUTTERFLY-DIAGRAM TRACE — for the animated view.  Returns, for a length-N
//  signal, the per-STAGE state of an iterative (bit-reversed) radix-2 FFT so the
//  page can draw the lanes splitting and the butterflies recombining.  This is a
//  RENDER aid; it is verified to agree with the recursive fft() so the picture
//  is not lying.  N must be a power of two.
// ---------------------------------------------------------------------------
function bitReverse(i, bits) {
  let r = 0;
  for (let b = 0; b < bits; b++) { r = (r << 1) | (i & 1); i >>= 1; }
  return r;
}
function fftStages(x, sign) {
  const N = x.length;
  if (!isPow2(N)) throw new Error('fftStages needs a power-of-two length');
  const bits = Math.round(Math.log2(N));
  // permute into bit-reversed order
  const a = new Array(N);
  for (let i = 0; i < N; i++) a[i] = x[bitReverse(i, bits)];
  const stages = [{ data: a.map(function (v) { return { re: v.re, im: v.im }; }), butterflies: [] }];
  for (let len = 2; len <= N; len *= 2) {
    const half = len / 2;
    const butterflies = [];
    for (let start = 0; start < N; start += len) {
      for (let k = 0; k < half; k++) {
        const tw = cExp((sign === undefined ? -1 : sign) * 2 * Math.PI * k / len);
        const i = start + k, j = start + k + half;
        const t = cMul(tw, a[j]);
        const top = cAdd(a[i], t), bot = cSub(a[i], t);
        butterflies.push({ i: i, j: j, k: k, len: len, tw: tw });
        a[i] = top; a[j] = bot;
      }
    }
    stages.push({ data: a.map(function (v) { return { re: v.re, im: v.im }; }), butterflies: butterflies });
  }
  return stages;
}
// the iterative result (last stage) — used to prove the staged path matches fft().
function fftIterative(x) {
  const stages = fftStages(x, -1);
  return stages[stages.length - 1].data;
}

// ============================================================================
//  THE SELF-TEST — proves the 3-part falsifiable claim EXACT.
// ============================================================================
function runSelfTest() {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name: name, pass: !!cond, info: info }); }

  // ----- CLAIM (1): FAST == SLOW, over many seeds -----
  {
    let worst = 0, worstRt = 0;
    const sizes = [2, 4, 8, 16, 32, 64];
    const rng = makeRng(0x1234abcd);
    for (let trial = 0; trial < 60; trial++) {
      const N = sizes[trial % sizes.length];
      const x = randomSignal(rng, N);
      const fast = fft(x);
      const slow = dft(x);                 // SOURCE-DISJOINT path
      worst = Math.max(worst, maxDiff(fast, slow));
      const back = ifft(fft(x));           // round-trip
      worstRt = Math.max(worstRt, maxDiff(back, x));
    }
    detail.fftVsDft = worst;
    detail.roundTrip = worstRt;
    ok('FAST == SLOW: fft(x) == naive dft(x) to <1e-12 over 60 seeds',
       worst < 1e-12, 'worst |Δ| = ' + worst.toExponential(2));
    ok('ifft(fft(x)) == x round-trips to <1e-12',
       worstRt < 1e-12, 'worst |Δ| = ' + worstRt.toExponential(2));
  }

  // ----- CLAIM (1b): the FFT path is SOURCE-DISJOINT from the DFT -----
  // The function bodies that make up the fast path must never mention `dft`.
  {
    const fftBodies = [fftRadix2, fft, ifft, fftStages, fftIterative]
      .map(function (f) { return f.toString(); }).join('\n');
    const callsDft = /\bdft\s*\(/.test(fftBodies) || /\bidft\s*\(/.test(fftBodies);
    detail.fftCallsDft = callsDft;
    ok('source-disjoint: the FFT path never calls dft/idft (the agreement is load-bearing)',
       !callsDft, callsDft ? 'FFT references dft — NOT disjoint!' : 'fast path is independent of the slow path');
  }

  // ----- CLAIM (1c): the staged (drawable) FFT matches the recursive fft() -----
  {
    let worst = 0;
    const rng = makeRng(0x55aa55aa);
    for (let trial = 0; trial < 20; trial++) {
      const N = [2, 4, 8, 16][trial % 4];
      const x = randomSignal(rng, N);
      worst = Math.max(worst, maxDiff(fftIterative(x), fft(x)));
    }
    detail.stagedVsRecursive = worst;
    ok('the animated staged FFT == the recursive fft() (the picture is not lying)',
       worst < 1e-12, 'worst |Δ| = ' + worst.toExponential(2));
  }

  // ----- CLAIM (1d): the slow path round-trips on its own (idft∘dft == id) -----
  {
    let worst = 0;
    const rng = makeRng(0x0f0f0f0f);
    for (let trial = 0; trial < 12; trial++) {
      const N = [2, 4, 8, 16][trial % 4];
      const x = randomSignal(rng, N);
      worst = Math.max(worst, maxDiff(idft(dft(x)), x));
    }
    detail.dftRoundTrip = worst;
    ok('the slow path round-trips too: idft(dft(x)) == x to <1e-12',
       worst < 1e-12, 'worst |Δ| = ' + worst.toExponential(2));
  }

  // ----- CLAIM (2): THE CONVOLUTION THEOREM, EXACT (linear, zero-padded) -----
  {
    let worstResidual = 0, allByteIdentical = true, firstBad = null;
    const rng = makeRng(0x9e3779b9);
    for (let trial = 0; trial < 40; trial++) {
      const la = 2 + (trial % 7), lb = 3 + ((trial * 3) % 6);
      const a = randomPoly(rng, la, -9, 9);
      const b = randomPoly(rng, lb, -9, 9);
      const slow = conv(a, b);                       // SOURCE-DISJOINT schoolbook
      const fast = fftConvolve(a, b, true);          // zero-padded ⇒ linear
      worstResidual = Math.max(worstResidual, maxAbsDiff(slow, fast));
      // after the rounding the test states, the two are byte-identical:
      const sR = JSON.stringify(roundArr(slow, 6));
      const fR = JSON.stringify(roundArr(fast, 6));
      if (sR !== fR) { allByteIdentical = false; if (!firstBad) firstBad = { a: a, b: b, slow: slow, fast: fast }; }
    }
    detail.convResidual = worstResidual;
    detail.convByteIdentical = allByteIdentical;
    ok('convolution theorem: ifft(fft·fft) == schoolbook conv to <1e-9 (40 random polys)',
       worstResidual < 1e-9, 'worst |Δ| = ' + worstResidual.toExponential(2));
    ok('convolution theorem: rounded(6dp) coefficient vectors are BYTE-IDENTICAL',
       allByteIdentical, allByteIdentical ? 'every pair char-for-char equal' : 'a pair differed!');
  }

  // ----- CLAIM (3): TEETH — circular (un-padded) PROVABLY DIFFERS from linear -----
  {
    // A wraparound-nontrivial case: two polys whose linear product is longer than
    // the circular length, so the tail MUST alias back onto the head.
    const a = [1, 2, 3, 4];      // length 4
    const b = [5, 6, 7, 8];      // length 4 ⇒ linear length 7, circular length 4
    const linear = conv(a, b);                  // length 7
    const circular = fftConvolve(a, b, false);  // length 4 (aliased)
    const linearViaFft = fftConvolve(a, b, true); // sanity: padded matches schoolbook
    // The circular result, length 4, equals linear with its tail wrapped:
    //   circ[i] = linear[i] + linear[i+4]  (the aliasing identity)
    const N = circular.length;
    const aliased = new Array(N).fill(0);
    for (let i = 0; i < linear.length; i++) aliased[i % N] += linear[i];
    let aliasErr = 0;
    for (let i = 0; i < N; i++) aliasErr = Math.max(aliasErr, Math.abs(circular[i] - aliased[i]));
    // and it DIFFERS from the (truncated) linear head — the wraparound corrupts it:
    let headDiff = 0;
    for (let i = 0; i < N; i++) headDiff = Math.max(headDiff, Math.abs(circular[i] - linear[i]));
    detail.teethAliasErr = aliasErr;
    detail.teethHeadDiff = headDiff;
    detail.teethCircular = circular;
    detail.teethLinear = linear;
    ok('TEETH: padded FFT-conv still matches schoolbook (the control is sound)',
       maxAbsDiff(linear, linearViaFft) < 1e-9,
       'padded |Δ| = ' + maxAbsDiff(linear, linearViaFft).toExponential(2));
    ok('TEETH: circular (un-padded) conv == linear with the tail WRAPPED (the aliasing identity)',
       aliasErr < 1e-9, 'alias-model |Δ| = ' + aliasErr.toExponential(2));
    ok('TEETH: circular conv PROVABLY DIFFERS from linear (wraparound corrupts the head)',
       headDiff > 1, 'max corruption = ' + headDiff.toFixed(2) + ' (≫ 0 ⇒ padding is necessary)');
  }

  // ----- determinism -----
  {
    const rng1 = makeRng(42), rng2 = makeRng(42);
    const x1 = randomSignal(rng1, 8), x2 = randomSignal(rng2, 8);
    const d = maxDiff(fft(x1), fft(x2));
    ok('deterministic: identical seeds ⇒ identical transforms', d === 0, 'Δ = ' + d);
  }

  const pass = checks.filter(function (c) { return c.pass; }).length;
  return { pass: pass, total: checks.length, checks: checks, detail: detail };
}

export {
  cx, cAdd, cSub, cMul, cExp, maxDiff,
  isPow2, nextPow2,
  fftRadix2, fft, ifft, dft, idft,
  conv, toComplex, fftConvolve, roundArr, maxAbsDiff,
  makeRng, randomSignal, randomPoly,
  bitReverse, fftStages, fftIterative,
  runSelfTest,
};
