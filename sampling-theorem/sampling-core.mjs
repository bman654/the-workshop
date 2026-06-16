// ============================================================================
//  THE SAMPLING THEOREM — core math (the SOLE math authority for this bench).
//
//  THE ONE IDEA.  A signal sampled at rate fs carries every frequency BELOW the
//  Nyquist line fs/2 *exactly* — Whittaker–Shannon threads a sinc through the
//  samples and recovers the band-limited source to machine precision. ABOVE the
//  line it is a MASQUERADE: a tone at f and its alias at |f − round(f/fs)·fs|
//  produce the BYTE-IDENTICAL sample vector, so the samples cannot tell them
//  apart, and the reconstruction provably rebuilds the GHOST, never the original.
//
//  THE ONE LOCKED DECISION (propagates everywhere): the source signal and the
//  tone-sampler are ZERO-PHASE COSINES, a·cos(2πf·t).  This is load-bearing, not
//  cosmetic.  Node-verified: a cosine and its alias sample BYTE-EXACT (worst diff
//  exactly 0), because cos is EVEN — cos(2π(fs−f)·n/fs) = cos(2πf·n/fs) at every
//  integer n.  A SINE basis would sign-FLIP the alias (worst diff 2), breaking
//  Claim B.  So every signal here is a cosine sum; never a sine.
//
//  THE FALSIFIABLE CLAIMS (proven in runSelfTest, machine-precision):
//    (A) PERFECT RECONSTRUCTION below Nyquist — a band-limited cosine sum, all
//        components below fs/2, reconstructed via the PERIODIC Whittaker–Shannon
//        (Dirichlet) kernel at hundreds of dense off-grid points, matches the
//        source to < 1e-9 (Node-verified 8.1e-14).  [The finite-window PLAIN
//        Whittaker–Shannon caps at ~1e0; the periodic Dirichlet kernel removes
//        that truncation error — that is WHY reconstructPeriodic is the proof
//        authority for Leg A, not plain reconstruct.]
//    (B) ALIASING IS BYTE-EXACT above Nyquist — an undersampled cosine at bin c
//        and the folded-alias cosine at bin (N−c) produce the SAME integer-cycle
//        sample vector, asserted strictly === (not ~1e-14) via the folded-cosine
//        LUT.  The imported radix-2 FFT places the spectral peak at the FOLDED
//        bin, never at c (the line at the WRONG frequency).
//
//  ANTI-CIRCULARITY.  The sinc & folding digit-math live ONLY in this file.  The
//  TRANSFORM is IMPORTED from ../butterfly/core.mjs (fft/toComplex/isPow2); this
//  module never re-types an FFT and never references `dft`.  A grep in the Node
//  twin asserts that.
//
//  N = 256 is the SINGLE power of two for the whole bench.  Proof presets choose
//  fs & component frequencies so f·N/fs ∈ ℤ ("coherent"): band-limited comps use
//  c < 128 (reconstruct clean); the undersampled tone uses c > 128 (aliases
//  byte-exact to bin 256−c).
// ============================================================================

import { fft, toComplex, isPow2 } from '../butterfly/core.mjs';

// ===== SAMPLING CORE (inlined byte-twin) BEGIN =====
const N_DEFAULT = 256;            // the SINGLE power of two for the whole bench

// ── normalised sinc: sin(πx)/(πx), with sinc(0)=1. Allocates nothing (fps). ──
function sinc(x){
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

// ── the alias Hz: the distance from f to the nearest multiple of fs. Keep this
//    formula CHAR-IDENTICAL to the lede/card prose (anti-drift). ──
function foldedFreq(f, fs){ return Math.abs(f - Math.round(f / fs) * fs); }

// ── apparentRate: the SIGNED stroboscopic alias — what the EYE reconstructs when a
//    rate-f source is seen only at flash-rate fs. Per flash the spoke advances f/fs
//    cycles; the eye picks the SMALLEST-magnitude equivalent advance in (−½,½], so the
//    rendered rate is frac·fs, SIGNED. |apparentRate| === foldedFreq (the unsigned
//    alias Hz); the SIGN is the regime: + true/forward, − the backward phantom.
//    Below Nyquist (f<fs/2 ⇒ round=0) apparent===f, no fold. AT Nyquist (f=fs/2) JS
//    round-half-up makes frac=−½ ⇒ apparent=−fs/2: the spoke lands ANTIPODALLY each
//    flash — the FREEZE (read it off |apparent|·2===fs, NOT apparent===0). ──
function apparentRate(f, fs){
  const frac = f / fs - Math.round(f / fs);   // ∈ (−½, ½]
  return frac * fs;                            // signed apparent cycles/s
}

// ── aliasOf: the folded frequency + how many fs-widths it folded + whether it
//    actually aliases (f above the Nyquist line fs/2). ──
function aliasOf(f, fs){
  const foldCount = Math.round(f / fs);
  return { fAlias: foldedFreq(f, fs), foldCount: foldCount, aliased: f > fs / 2 };
}

// ── the Nyquist line. ──
function nyquist(fs){ return fs / 2; }

// ── sampleTone: a plain zero-phase cosine, sampled at fs for N samples. This is
//    the DRAWING sampler (float cos). amp·cos(2πf·n/fs). ──
function sampleTone(f, fs, N, amp){
  if (amp === undefined) amp = 1;
  const out = new Float64Array(N);
  for (let n = 0; n < N; n++) out[n] = amp * Math.cos(2 * Math.PI * f * n / fs);
  return out;
}

// ── sourceValue: the continuous source = a sum of zero-phase cosine components
//    {f, amp} evaluated at continuous time t. The GROUND TRUTH curve. ──
function sourceValue(components, t){
  let v = 0;
  for (let i = 0; i < components.length; i++){
    v += components[i].amp * Math.cos(2 * Math.PI * components[i].f * t);
  }
  return v;
}

// ── reconstruct: plain Whittaker–Shannon. x_r(t) = Σ x[n]·sinc((t−nT)/T), T=1/fs.
//    This is the LIVE VISUAL reconstruction (the curve drawn through the dots).
//    Accepts a SCALAR t or a Float64Array of t (vectorised for fps). The finite
//    window truncates the ideal infinite sum, so this caps at ~1e0 on a dense
//    grid — for the PROOF use reconstructPeriodic. Allocates one output only. ──
function reconstruct(samples, fs, t){
  const T = 1 / fs, M = samples.length;
  if (typeof t === 'number'){
    let s = 0;
    for (let n = 0; n < M; n++) s += samples[n] * sinc((t - n * T) / T);
    return s;
  }
  const out = new Float64Array(t.length);
  for (let i = 0; i < t.length; i++){
    let s = 0;
    const ti = t[i];
    for (let n = 0; n < M; n++) s += samples[n] * sinc((ti - n * T) / T);
    out[i] = s;
  }
  return out;
}

// ── reconstructPeriodic: the PROOF authority for Leg A. For M samples taken over
//    one period, the periodic band-limited interpolation uses the DIRICHLET
//    kernel (the periodic sinc) instead of the truncated ordinary sinc, which
//    removes the finite-window error. Accepts scalar OR Float64Array t.
//
//    D_M(θ) = sin(M·θ/2) / (M·tan(θ/2))  for EVEN M (the periodic-sinc kernel —
//      the tan denominator, not sin, is the even-M form);
//    x_r(t) = Σ x[n]·D_M( 2π·fs·(t − nT)/M ),  T = 1/fs, period P = M·T.
//    At θ→0 the kernel → 1. Node-verified residual ~5e-14 on dense off-grid t. ──
function dirichlet(theta, M){
  // periodic sinc for an EVEN number of samples M:
  //   sin(M θ/2) / (M tan(θ/2)), with the removable singularity at θ≡0 → 1.
  const tt = Math.tan(theta / 2);
  if (Math.abs(tt) < 1e-12) return 1;        // θ ≡ 0 (mod 2π) ⇒ the kernel → 1
  return Math.sin(M * theta / 2) / (M * tt);
}
function reconstructPeriodic(samples, fs, t){
  const T = 1 / fs, M = samples.length;
  const w = 2 * Math.PI * fs / M;     // = 2π / P,  P = M·T  (one full period)
  if (typeof t === 'number'){
    let acc = 0;
    for (let n = 0; n < M; n++) acc += samples[n] * dirichlet(w * (t - n * T), M);
    return acc;
  }
  const out = new Float64Array(t.length);
  for (let i = 0; i < t.length; i++){
    let acc = 0;
    const ti = t[i];
    for (let n = 0; n < M; n++) acc += samples[n] * dirichlet(w * (ti - n * T), M);
    out[i] = acc;
  }
  return out;
}

// ── the integer-cycle folded-cosine LUT — what makes Leg B strictly ===, not
//    ~1e-14. For a component at integer bin c on an N-point window:
//      half[k] = cos(2πk/N) for k ∈ [0, N/2]   (computed ONCE)
//      fold(k) = k > N/2 ? N − k : k            (the cosine's even-symmetry fold)
//      cosFold(idx) = half[ fold( ((idx % N) + N) % N ) ]
//    A cosine at bin c and at bin (N−c) read the SAME half[] entries at every
//    index, so their sample vectors are BIT-FOR-BIT identical. ──
function sampleToneLUT(c, N, amp){
  if (amp === undefined) amp = 1;
  const half = new Float64Array(N / 2 + 1);
  for (let k = 0; k <= N / 2; k++) half[k] = Math.cos(2 * Math.PI * k / N);
  function fold(k){ return k > N / 2 ? N - k : k; }
  const out = new Float64Array(N);
  for (let idx = 0; idx < N; idx++){
    const m = (((c * idx) % N) + N) % N;   // the phase index, wrapped into [0,N)
    out[idx] = amp * half[fold(m)];
  }
  return out;
}

// ── spectrum: wraps the IMPORTED radix-2 fft. Returns the one-sided magnitude
//    |X[k]| for k ∈ [0, N/2], the peak bin, and the peak bin restricted to the
//    low half [0, N/2] (the FOLDED bin the line actually lands in). ──
function spectrum(samples){
  const N = samples.length;
  if (!isPow2(N)) throw new Error('spectrum needs a power-of-two length, got ' + N);
  const X = fft(toComplex(Array.from(samples)));
  const half = N / 2;
  const mag = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) mag[k] = Math.hypot(X[k].re, X[k].im);
  let kPeak = 0, best = -1, kPeakLow = 0, bestLow = -1;
  for (let k = 0; k < N; k++){
    const m = Math.hypot(X[k].re, X[k].im);
    if (m > best){ best = m; kPeak = k; }
  }
  for (let k = 0; k <= half; k++){
    if (mag[k] > bestLow){ bestLow = mag[k]; kPeakLow = k; }
  }
  return { mag: mag, kPeak: kPeak, kPeakLow: kPeakLow };
}

// ============================================================================
//  THE SELF-TEST — the SOLE oracle both the in-page pill and the Node twin call.
//  Every leg is a concrete numeric assertion with a stated target; `detail`
//  reports the LIVE number, never the word "perfect".
// ============================================================================
function runSelfTest(){
  const lines = [];
  function ok(name, cond, detail){ lines.push({ name: name, ok: !!cond, detail: detail }); }
  const N = N_DEFAULT;

  // ── A1  PERFECT RECONSTRUCTION (the periodic Dirichlet kernel, the proof) ──
  // Band-limited cosine sum, all bins c<128 integer ⇒ all f<fs/2. Reconstruct at
  // ≥500 dense OFF-GRID t and assert maxAbsErr<1e-9. Also report what the PLAIN
  // (truncated) Whittaker–Shannon would have left, to name why periodic matters.
  let ledeTol = 0;
  {
    const fs = 64;                         // Δf = fs/N = 0.25 Hz
    const comps = [{ c: 5, amp: 1 }, { c: 13, amp: 0.6 }, { c: 27, amp: 0.4 }];
    const sourceComps = comps.map(co => ({ f: co.c * fs / N, amp: co.amp }));
    const samples = new Float64Array(N);
    for (let n = 0; n < N; n++) samples[n] = sourceValue(sourceComps, n / fs);
    // dense off-grid t across one period P = N/fs
    const P = N / fs, M = 503;
    const ts = new Float64Array(M);
    for (let i = 0; i < M; i++) ts[i] = (i + 0.4137) / M * P;   // off the sample grid
    const reconP = reconstructPeriodic(samples, fs, ts);
    const reconW = reconstruct(samples, fs, ts);
    let errP = 0, errW = 0;
    for (let i = 0; i < M; i++){
      const truth = sourceValue(sourceComps, ts[i]);
      errP = Math.max(errP, Math.abs(reconP[i] - truth));
      errW = Math.max(errW, Math.abs(reconW[i] - truth));
    }
    ledeTol = errP;
    ok('A1 perfect-reconstruction: band-limited cosine sum recovered by the periodic Dirichlet kernel to <1e-9 at 503 off-grid t (plain finite-window W–S caps at ~1e0 — why periodic is load-bearing)',
       errP < 1e-9,
       'Dirichlet maxAbsErr=' + errP.toExponential(2) + '  ·  plain W–S maxAbsErr=' + errW.toExponential(2) + ' (the truncation the kernel removes)');
  }

  // ── B1  ALIASING IS BYTE-EXACT (strict ===, the strongest indistinguishable) ──
  {
    const c = 200, cAlias = N - c;          // 200 → 56
    const xTrue = sampleToneLUT(c, N);
    const xAlias = sampleToneLUT(cAlias, N);
    let mismatched = 0, maxAbsDiff = 0;
    const everEqual = xTrue.every((v, i) => {
      const d = Math.abs(v - xAlias[i]);
      if (d > maxAbsDiff) maxAbsDiff = d;
      if (v !== xAlias[i]) mismatched++;
      return v === xAlias[i];
    });
    ok('B1 aliasing byte-exact: cos@bin ' + c + ' and cos@bin ' + cAlias + ' (=N−c) sample STRICTLY === (every v===, maxAbsDiff===0) — the strongest "indistinguishable"',
       everEqual === true && maxAbsDiff === 0 && mismatched === 0,
       'mismatched=' + mismatched + '  ·  maxAbsDiff=' + maxAbsDiff + ' (exact 0, not ~1e-14)');
  }

  // ── B2  THE LIE IN FREQUENCY (the imported fft) ──
  // The imported radix-2 FFT of the undersampled comb peaks at the FOLDED bin,
  // not at c. This is the required imported-transform leg.
  {
    const c = 200, cAlias = N - c;          // 56
    const xTrue = sampleToneLUT(c, N);
    const sp = spectrum(xTrue);
    ok('B2 the lie in frequency: the IMPORTED radix-2 FFT places the peak at the FOLDED bin ' + cAlias + ' (=min(c,N−c)), NOT at c=' + c + ' (the line at the WRONG frequency)',
       sp.kPeakLow === Math.min(c, cAlias),
       'kPeakLow=' + sp.kPeakLow + '  ·  expected min(' + c + ',' + cAlias + ')=' + Math.min(c, cAlias) + '  ·  full-band kPeak=' + sp.kPeak);
  }

  // ── B3  foldedFreq NAMES the alias (the Hz the pill displays) ──
  {
    const c = 200, cAlias = N - c, fs = 30;  // Δf = fs/N
    const f = c * fs / N;
    const expected = cAlias * fs / N;
    const got = foldedFreq(f, fs);
    ok('B3 foldedFreq names the alias: foldedFreq(f,fs) === (N−c)·fs/N to machine tol (the Hz the pill shows)',
       Math.abs(got - expected) < 1e-12,
       'foldedFreq=' + got.toFixed(6) + ' Hz  ·  (N−c)·fs/N=' + expected.toFixed(6) + ' Hz  ·  Δ=' + Math.abs(got - expected).toExponential(2));
  }

  // ── C  POSITIVE CONTROL — below Nyquist the picture does not lie ──
  {
    const fs = 64;
    const comps = [{ c: 7, amp: 1 }, { c: 19, amp: 0.5 }];
    const sourceComps = comps.map(co => ({ f: co.c * fs / N, amp: co.amp }));
    const samples = new Float64Array(N);
    for (let n = 0; n < N; n++) samples[n] = sourceValue(sourceComps, n / fs);
    const sp = spectrum(samples);
    // every component bin is below Nyquist (N/2=128); no spectral energy above it.
    const half = N / 2;
    // measure energy strictly above the highest true component bin and below N/2
    const maxBin = Math.max.apply(null, comps.map(co => co.c));
    let leak = 0;
    for (let k = maxBin + 1; k <= half; k++) leak = Math.max(leak, sp.mag[k]);
    // reconstruction error
    const P = N / fs, M = 401;
    const ts = new Float64Array(M);
    for (let i = 0; i < M; i++) ts[i] = (i + 0.27) / M * P;
    const recon = reconstructPeriodic(samples, fs, ts);
    let err = 0;
    for (let i = 0; i < M; i++) err = Math.max(err, Math.abs(recon[i] - sourceValue(sourceComps, ts[i])));
    const peakInBand = comps.some(co => co.c === sp.kPeakLow);
    ok('C positive control: all spectral lines at true bins (' + comps.map(co => co.c).join(', ') + ') below Nyquist 128, ~0 energy above the top line, reconstruction <1e-9 — below the line the picture does not lie',
       peakInBand && leak < 1e-6 && err < 1e-9,
       'peak bin=' + sp.kPeakLow + '  ·  max |X[k]| above top line=' + leak.toExponential(2) + '  ·  reconErr=' + err.toExponential(2));
  }

  // ── D  NEGATIVE CONTROL (honest) — the reconstruction reproduces the GHOST ──
  // Reconstruct the undersampled sample vector. It must DIFFER from the true
  // source (>0.5) AND MATCH the alias source (<1e-9): the masquerade behaves
  // exactly as predicted. Green here = "the masquerade is exact," NOT "recon works."
  {
    const fs = 30, c = 200, cAlias = N - c;  // 200 undersampled → ghost at 56
    const fTrue = c * fs / N, fAlias = cAlias * fs / N;
    const samples = sampleTone(fTrue, fs, N);   // the undersampled comb
    const trueComps = [{ f: fTrue, amp: 1 }];
    const aliasComps = [{ f: fAlias, amp: 1 }];
    const P = N / fs, M = 401;
    const ts = new Float64Array(M);
    for (let i = 0; i < M; i++) ts[i] = (i + 0.33) / M * P;
    const recon = reconstructPeriodic(samples, fs, ts);
    let errTrue = 0, errAlias = 0;
    for (let i = 0; i < M; i++){
      errTrue = Math.max(errTrue, Math.abs(recon[i] - sourceValue(trueComps, ts[i])));
      errAlias = Math.max(errAlias, Math.abs(recon[i] - sourceValue(aliasComps, ts[i])));
    }
    ok('D negative control (honest): the reconstruction of the undersampled tone DIFFERS from the true source (>0.5) but reproduces the ALIAS source (<1e-9) — it provably rebuilds the GHOST, never the original',
       errTrue > 0.5 && errAlias < 1e-9,
       'maxAbsErr(recon vs TRUE f=' + fTrue.toFixed(3) + 'Hz)=' + errTrue.toFixed(3) + ' (≫0)  ·  maxAbsErr(recon vs GHOST f=' + fAlias.toFixed(3) + 'Hz)=' + errAlias.toExponential(2) + ' (≈0)');
  }

  // ── E  SINGLE-SOURCE / RADIX-2 CONTRACT (the imported transform) ──
  {
    const importsOk = (typeof fft === 'function') && (typeof toComplex === 'function') && (typeof isPow2 === 'function');
    let threw = false;
    try { fft(toComplex(new Array(100).fill(0))); } catch (e){ threw = /power-of-two/.test(String(e.message)); }
    ok('E single-source/radix-2 contract: fft/toComplex/isPow2 are IMPORTED from butterfly/core.mjs, and fft on a length-100 (non-pow-2) input THROWS the power-of-two error',
       importsOk && threw,
       'imports ok=' + importsOk + '  ·  non-pow2 fft throws=' + threw);
  }

  // ── F  THE WHEEL'S APPARENT RATE === THE SIGNED FOLD (the phantom IS the math) ──
  {
    const fs = 8;
    const fBelow = 3, fFreeze = 4, fAbove = 7;          // below / AT Nyquist (fs/2=4) / above
    const apBelow = apparentRate(fBelow, fs);           // === f (true forward)
    const apFreeze = apparentRate(fFreeze, fs);         // |·|·2===fs (the freeze, antipodal)
    const apAbove = apparentRate(fAbove, fs);           // NEGATIVE (backward phantom)
    const magMatch = Math.abs(Math.abs(apAbove) - foldedFreq(fAbove, fs)) < 1e-12;
    const signsOk = Math.abs(apBelow - fBelow) < 1e-12 && Math.abs(Math.abs(apFreeze) * 2 - fs) < 1e-12 && apAbove < 0;
    // single-source: the drawn spoke-X (cos θ_n) IS core.sampleTone at f, every flash
    const xs = sampleTone(fAbove, fs, 64); let drawDiff = 0;
    for (let n = 0; n < 64; n++) drawDiff = Math.max(drawDiff, Math.abs(xs[n] - Math.cos(2 * Math.PI * fAbove * n / fs)));
    // NEG CONTROL: continuous light / well-oversampled ⇒ apparent === true to ε
    const apTrue = apparentRate(fBelow, 1000 * fBelow);
    const negCtl = Math.abs(apTrue - fBelow) < 1e-12;
    ok('F wheel apparent rate === signed fold: above Nyquist apparent NEGATIVE (backward) with |apparent|===foldedFreq; below it apparent===f (true); AT Nyquist the freeze (|apparent|·2===fs, the antipodal standing wheel); the drawn spoke-X IS core.sampleTone (drift 0); continuous-light neg-control apparent===true to ε',
       magMatch && signsOk && drawDiff === 0 && negCtl,
       'apparent(above)=' + apAbove.toFixed(3) + ' (fold ' + foldedFreq(fAbove, fs).toFixed(3) + ', backward) · apparent(below)=' + apBelow.toFixed(3) + '=f · freeze |ap|·2=' + (Math.abs(apFreeze) * 2).toFixed(3) + '=fs · spoke-vs-core drift=' + drawDiff + ' · neg-ctl Δ=' + Math.abs(apTrue - fBelow).toExponential(2));
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass: pass, total: lines.length, lines: lines, ledeTol: ledeTol };
}
// ===== SAMPLING CORE END =====

export {
  sinc, foldedFreq, apparentRate, aliasOf, nyquist,
  sampleTone, sourceValue, reconstruct, reconstructPeriodic,
  sampleToneLUT, spectrum,
  runSelfTest, N_DEFAULT,
};
