/* ============================================================================
   Audio Lens — FFT + windowing + STFT.
   Pure-JS radix-2 Cooley–Tukey, lifted verbatim from web/index.html.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   FFT — radix-2 Cooley–Tukey, in-place, iterative (bit reversal + butterflies).
   re[], im[] are Float64Array of length n (power of two). Forward transform.
   --------------------------------------------------------------------------- */
export function fft(re, im) {
  const n = re.length;
  if (n <= 1) return;
  if ((n & (n - 1)) !== 0) throw new Error("FFT length must be power of two: " + n);

  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  // butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;       // forward transform
    const wpr = Math.cos(ang), wpi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = i + k + half;
        const tr = wr * re[b] - wi * im[b];
        const ti = wr * im[b] + wi * re[b];
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr;        im[a] += ti;
        const nwr = wr * wpr - wi * wpi;   // advance twiddle
        wi = wr * wpi + wi * wpr;
        wr = nwr;
      }
    }
  }
}

// Hann window cache. Symmetric Hann: divides by (n-1). Do NOT switch to /n.
const hannCache = new Map();
export function hann(n) {
  let w = hannCache.get(n);
  if (w) return w;
  w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
  hannCache.set(n, w);
  return w;
}

/* ---------------------------------------------------------------------------
   STFT → array of magnitude spectra (linear magnitude per bin, 0..fftSize/2).
   Drops the trailing partial frame (start+fftSize<=n).
   --------------------------------------------------------------------------- */
export function stft(samples, fftSize, hopSize) {
  const win = hann(fftSize);
  const half = fftSize / 2;
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  const frames = [];
  const n = samples.length;
  for (let start = 0; start + fftSize <= n; start += hopSize) {
    for (let i = 0; i < fftSize; i++) { re[i] = samples[start + i] * win[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float32Array(half + 1);
    for (let k = 0; k <= half; k++) mag[k] = Math.hypot(re[k], im[k]);
    frames.push(mag);
  }
  return frames; // [frame][bin]
}
