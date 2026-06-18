// ============================================================================
//  THE MOIRÉ BENCH — core math (the SOLE math authority for this bench).
//
//  THE ONE IDEA.  Lay two line-gratings over each other and a THIRD pattern that
//  neither grid contains swims up — the moiré fringe. It is the SPATIAL BEAT of
//  two combs, exactly as two near-equal audio tones beat in time. The brightness
//  the eye sees through two transparencies is their PRODUCT, and a product of two
//  cosines carries a sum AND a DIFFERENCE term:
//      cos A · cos B = ½[cos(A−B) + cos(A+B)].
//  The DIFFERENCE term cos(A−B) oscillates at the wavevector |k₁−k₂| — far slower
//  than either carrier — and THAT slow envelope is the moiré band. Its spacing is
//
//      D = 1 / |k₁ − k₂|,   k = (1/p)·(cosφ, sinφ)   [cycles per unit length]
//
//  THE TWO CLOSED FORMS this unified law contains (both Node-verified === to it):
//    • ROTATION (two EQUAL pitches p at relative angle θ):
//          |k₁−k₂| = (1/p)·2|sin(θ/2)|   ⇒   D = p / (2·sin(θ/2)).
//    • TWO-PITCH (PARALLEL, φ=0, pitches p₁,p₂):
//          |k₁−k₂| = |1/p₁ − 1/p₂|       ⇒   D = p₁·p₂ / |p₁−p₂|.
//
//  THE LOAD-BEARING NEGATIVE CONTROL.  When the two combs COINCIDE (θ=0 AND
//  p₁=p₂) the difference term vanishes: k₁=k₂, |k₁−k₂|=0, D→∞. There is NO
//  fringe — a flat field is the correct answer. A vacuous "always draw a fringe"
//  renderer would FAIL here, so measureSpacing returns {spacing:Infinity} (never
//  0/NaN) and leg D asserts the measured low-band peak is < 1e-6 of the carrier.
//
//  THE MEASUREMENT.  measureSpacing FFTs the SAME composite() field the canvas
//  paints (no re-derived shader), DC-removed and separable-Hann windowed, then
//  finds the strongest peak in the LOW band BELOW the carrier frequencies and
//  refines it parabolically to sub-bin. The measured D matches each closed form
//  to <1% across rotation and two-pitch sweeps (proven in runSelfTest).
//
//  ANTI-CIRCULARITY.  This file types NO FFT. The 1-D radix-2 transform is
//  IMPORTED from ../butterfly/core.mjs (fft/toComplex) and used SEPARABLY (rows
//  then columns) to build the 2-D magnitude; a grep in the Node twin asserts this
//  module re-implements no transform internals and DOES import the transform.
//
//  RENDER-NYQUIST GUARD.  A grating finer than ~4 px/period aliases on a pixel
//  grid; clampTheta keeps the requested θ inside the regime where the BEAT stays
//  ≥ ~3·p (well above the render Nyquist), and nyquistFloorOK(pPx) rejects an
//  over-fine pitch. Leg E proves an over-fine grating does NOT report the true
//  beat (the guard is real, not decorative).
// ============================================================================

import { fft, toComplex } from '../butterfly/core.mjs';

// ===== MOIRE CORE (inlined byte-twin) BEGIN =====
const TWO_PI = Math.PI * 2;

// ── grating(x,y,p,phi): one raised-cosine line-grating, value in [0,1]. The
//    line normal points along (cosφ, sinφ); p is the period (units of length).
//    0.5(1+cos(2π·(x cosφ + y sinφ)/p)). This is exactly what the canvas paints
//    for a single comb, and what composite multiplies. ──
function grating(x, y, p, phi){
  const u = (x * Math.cos(phi) + y * Math.sin(phi)) / p;
  return 0.5 * (1 + Math.cos(TWO_PI * u));
}

// ── composite(x,y,p1,phi1,p2,phi2): the brightness the EYE sees through two
//    overlaid transparencies = the PRODUCT of the two gratings, value in [0,1].
//    This is the single field both the canvas and the FFT consume — there is no
//    second, re-derived intensity function anywhere. ──
function composite(x, y, p1, phi1, p2, phi2){
  return grating(x, y, p1, phi1) * grating(x, y, p2, phi2);
}

// ── wavevector(p,phi): the spatial-frequency vector in CYCLES per unit length,
//    k = (1/p)·(cosφ, sinφ). |k| = 1/p is the comb's spatial frequency. ──
function wavevector(p, phi){
  return { kx: Math.cos(phi) / p, ky: Math.sin(phi) / p };
}

// ── diffMag(p1,phi1,p2,phi2): |k₁−k₂|, the spatial frequency of the moiré beat
//    (the difference term cos(A−B)). The unified spacing is its reciprocal. ──
function diffMag(p1, phi1, p2, phi2){
  const a = wavevector(p1, phi1), b = wavevector(p2, phi2);
  return Math.hypot(a.kx - b.kx, a.ky - b.ky);
}

// ── spacingRotation(p,theta): D = p/(2·sin(θ/2)) for two EQUAL pitches at
//    relative angle θ. θ=0 ⇒ Infinity (combs coincide, no beat). ──
function spacingRotation(p, theta){
  const s = Math.sin(theta / 2);
  if (s === 0) return Infinity;
  return p / (2 * Math.abs(s));
}

// ── spacingTwoPitch(p1,p2): D = p₁p₂/|p₁−p₂| for two PARALLEL combs of differing
//    pitch. p₁===p₂ ⇒ Infinity (the combs coincide, no beat). ──
function spacingTwoPitch(p1, p2){
  if (p1 === p2) return Infinity;
  return (p1 * p2) / Math.abs(p1 - p2);
}

// ── spacingUnified(p1,phi1,p2,phi2): the ONE closed form the live readout calls,
//    D = 1/|k₁−k₂|. Reduces to spacingRotation (equal p) and spacingTwoPitch
//    (φ₁=φ₂) exactly. |k₁−k₂|=0 ⇒ Infinity (the neg-control). ──
function spacingUnified(p1, phi1, p2, phi2){
  const d = diffMag(p1, phi1, p2, phi2);
  if (d === 0) return Infinity;
  return 1 / d;
}

// ── apodize(n,N): the Blackman–Harris 4-term window weight, applied separably
//    (row×col) to suppress the spectral leakage from the field's hard edges. Its
//    −92 dB far sidelobes are LOAD-BEARING: they drop the leakage floor of the
//    carrier lines below 1e-6 of the carrier peak, so the coincident-comb
//    neg-control reads a genuinely EMPTY low band (a Hann window's −31 dB
//    sidelobes leak ~6e-6 and would defeat the < 1e-6 neg-control assertion). ──
function apodize(n, N){
  const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
  const w = TWO_PI * n / (N - 1);
  return a0 - a1 * Math.cos(w) + a2 * Math.cos(2 * w) - a3 * Math.cos(3 * w);
}

// ── fft2mag(field,N): the 2-D magnitude spectrum of an N×N real field, built
//    SEPARABLY from the IMPORTED 1-D fft (rows first, then columns). DC is
//    removed (subtract the mean) and a separable Blackman–Harris window applied
//    BEFORE the transform. Returns a Float64Array of length N*N, |F[ky*N+kx]|,
//    with the zero frequency at index 0 (standard FFT ordering, kx,ky ∈ [0,N)). ──
function fft2mag(field, N){
  // mean-subtract (kill DC so the carriers/beat dominate the spectrum)
  let mean = 0;
  for (let i = 0; i < N * N; i++) mean += field[i];
  mean /= (N * N);
  // separable Blackman–Harris apodization + DC removal into a complex grid
  const wcol = new Float64Array(N);
  for (let n = 0; n < N; n++) wcol[n] = apodize(n, N);
  // rows of complex {re,im}
  const re = new Float64Array(N * N);
  const im = new Float64Array(N * N);
  for (let y = 0; y < N; y++){
    const wy = wcol[y];
    // transform this row with the imported 1-D fft
    const rowIn = new Array(N);
    for (let x = 0; x < N; x++){
      rowIn[x] = { re: (field[y * N + x] - mean) * wcol[x] * wy, im: 0 };
    }
    const R = fft(rowIn);
    for (let x = 0; x < N; x++){ re[y * N + x] = R[x].re; im[y * N + x] = R[x].im; }
  }
  // transform each column
  const out = new Float64Array(N * N);
  const colIn = new Array(N);
  for (let x = 0; x < N; x++){
    for (let y = 0; y < N; y++) colIn[y] = { re: re[y * N + x], im: im[y * N + x] };
    const C = fft(colIn);
    for (let y = 0; y < N; y++) out[y * N + x] = Math.hypot(C[y].re, C[y].im);
  }
  return out;
}

// ── nyquistFloorOK(pPx): a grating sampled finer than ~4 px/period aliases on a
//    pixel grid. True iff the on-screen pitch (in px) is ≥ 4. ──
function nyquistFloorOK(pPx){ return pPx >= 4; }

// ── clampTheta(theta,p): clamp the relative angle into the regime where the beat
//    stays measurable — D = p/(2 sin(θ/2)) ≥ ~3·p means sin(θ/2) ≤ 1/6, i.e.
//    |θ| ≤ 2·asin(1/6) ≈ 19.2°. Below that floor (incl. the θ=0 neg-control) the
//    fringe is wide and well above the render Nyquist; above it the beat would
//    crowd the carriers. Returns θ clamped to [−θmax, θmax]. ──
function clampTheta(theta, p){
  const thetaMax = 2 * Math.asin(1 / 6);   // beat ≥ 3·p
  if (theta > thetaMax) return thetaMax;
  if (theta < -thetaMax) return -thetaMax;
  return theta;
}

// ── measureSpacing(p1,phi1,p2,phi2,N,ds): build the composite field on an N×N
//    grid at sample spacing ds (units of length per pixel), FFT it (fft2mag),
//    and find the strongest peak in the LOW band STRICTLY BELOW the carrier
//    frequencies (|k| < min(1/p1,1/p2)·0.9). Parabolic sub-bin refine in both
//    axes. Returns {spacing, peak, kx, ky} where spacing = 1/|k_peak| in length
//    units. When there is NO low-band peak above noise — the combs coincide —
//    returns {spacing:Infinity, peak:<carrier peak>, kx:0, ky:0}: the neg-control
//    sentinel, never 0/NaN. ──
function measureSpacing(p1, phi1, p2, phi2, N, ds){
  // build the field the eye sees, on an N×N grid centred at the origin
  const field = new Float64Array(N * N);
  for (let yy = 0; yy < N; yy++){
    const y = (yy - N / 2) * ds;
    for (let xx = 0; xx < N; xx++){
      const x = (xx - N / 2) * ds;
      field[yy * N + xx] = composite(x, y, p1, phi1, p2, phi2);
    }
  }
  const mag = fft2mag(field, N);
  // frequency per bin index: cycles per unit length. Bin k along an axis maps to
  // frequency f = k/(N·ds) for k ≤ N/2, and (k−N)/(N·ds) for k > N/2 (negative).
  const df = 1 / (N * ds);
  const carrierF = Math.min(1 / p1, 1 / p2);
  // search WELL below the lower carrier: the moiré beat |k₁−k₂| is always a small
  // fraction of the carrier for similar combs (the regime clampTheta enforces),
  // and 0.6·carrier keeps the carrier's own apodization skirt out of the band.
  const lowCut = carrierF * 0.6;
  // find the strongest peak in the low band (excluding the exact DC bin), and the
  // overall carrier peak for the neg-control comparison.
  let bestLow = -1, bky = 0, bkx = 0;
  let carrierPeak = -1;
  function freqOf(k){ return (k <= N / 2 ? k : k - N) / (N * ds); }
  for (let ky = 0; ky < N; ky++){
    const fy = freqOf(ky);
    for (let kx = 0; kx < N; kx++){
      const fx = freqOf(kx);
      const f = Math.hypot(fx, fy);
      const m = mag[ky * N + kx];
      if (m > carrierPeak) carrierPeak = m;
      if (f === 0) continue;                // skip residual DC
      if (f < lowCut && m > bestLow){ bestLow = m; bky = ky; bkx = kx; }
    }
  }
  // neg-control: the low band holds no real peak (everything there is < 1e-6 of
  // the carrier) ⇒ the combs coincide ⇒ no fringe. lowPeak/carrierPeak is the
  // honest emptiness ratio leg D asserts is < 1e-6.
  const lowRatio = carrierPeak > 0 ? Math.max(bestLow, 0) / carrierPeak : 0;
  if (bestLow < carrierPeak * 1e-6 || bestLow <= 0){
    return { spacing: Infinity, peak: carrierPeak, lowPeak: Math.max(bestLow, 0), lowRatio: lowRatio, kx: 0, ky: 0 };
  }
  // parabolic sub-bin refine along each axis (use the wrapped neighbour bins)
  function wrap(k){ return ((k % N) + N) % N; }
  function magAt(ky, kx){ return mag[wrap(ky) * N + wrap(kx)]; }
  function refine(center, fixedOther, axis){
    // axis 0 = refine kx (other fixed = ky); axis 1 = refine ky
    let a, b, c;
    if (axis === 0){ a = magAt(fixedOther, center - 1); b = magAt(fixedOther, center); c = magAt(fixedOther, center + 1); }
    else { a = magAt(center - 1, fixedOther); b = magAt(center, fixedOther); c = magAt(center + 1, fixedOther); }
    const denom = (a - 2 * b + c);
    if (denom === 0) return 0;
    let delta = 0.5 * (a - c) / denom;
    if (!(delta > -1 && delta < 1)) delta = 0;
    return delta;
  }
  const dxRef = refine(bkx, bky, 0);
  const dyRef = refine(bky, bkx, 1);
  const kxIdx = (bkx <= N / 2 ? bkx : bkx - N) + dxRef;
  const kyIdx = (bky <= N / 2 ? bky : bky - N) + dyRef;
  const fx = kxIdx * df, fy = kyIdx * df;
  const fmag = Math.hypot(fx, fy);
  return { spacing: fmag === 0 ? Infinity : 1 / fmag, peak: bestLow, lowPeak: bestLow, lowRatio: lowRatio, kx: fx, ky: fy };
}

// ============================================================================
//  THE SELF-TEST — the SOLE oracle both the in-page pill and the Node twin call.
//  Every leg is a concrete numeric assertion with a stated target; `detail`
//  reports the LIVE measured number, never the word "perfect".
// ============================================================================
function runSelfTest(){
  const lines = [];
  function ok(name, cond, detail){ lines.push({ name: name, ok: !!cond, detail: detail }); }
  const N = 256;                  // power of two — the FFT's only requirement
  // the measurement grid samples the CARRIER at 4 px/period (ds = p/4): the
  // carrier sits well above the render Nyquist while the window still spans many
  // beats, so the beat peak is sharp and far from the carrier skirt.

  // ── A  ROTATION LAW: measured D matches p/(2 sin(θ/2)) to <1% across a sweep ──
  {
    const p = 12;                 // length units
    const ds = p / 4;             // carrier sampled at 4 px/period (above Nyquist)
    let worst = 0, worstTheta = 0;
    for (let deg = 4; deg <= 18; deg += 2){
      const theta = deg * Math.PI / 180;
      const predicted = spacingRotation(p, theta);
      const m = measureSpacing(p, theta / 2, p, -theta / 2, N, ds);
      const rel = Math.abs(m.spacing - predicted) / predicted;
      if (rel > worst){ worst = rel; worstTheta = deg; }
    }
    ok('A rotation law: measured fringe-D matches D=p/(2·sin(θ/2)) to <1% across θ∈[4°,18°] (FFT of the composited field vs the closed form)',
       worst < 0.01,
       'worst rel.err=' + (worst * 100).toFixed(3) + '% @ θ=' + worstTheta + '°');
  }

  // ── B  TWO-PITCH LAW: measured D matches p₁p₂/|p₁−p₂| to <1% across a sweep ──
  {
    const p1 = 12;
    const ds = p1 / 4;
    let worst = 0, worstP2 = 0;
    for (let p2 = 12.6; p2 <= 15.5; p2 += 0.4){
      const predicted = spacingTwoPitch(p1, p2);
      const m = measureSpacing(p1, 0, p2, 0, N, ds);
      const rel = Math.abs(m.spacing - predicted) / predicted;
      if (rel > worst){ worst = rel; worstP2 = p2; }
    }
    ok('B two-pitch law: measured fringe-D matches D=p₁p₂/|p₁−p₂| to <1% across p₂∈[12.6,15.4] (parallel combs, θ=0)',
       worst < 0.01,
       'worst rel.err=' + (worst * 100).toFixed(3) + '% @ p₂=' + worstP2.toFixed(1));
  }

  // ── C  UNIFIED LAW === both closed forms to 1e-9 (the one readout authority) ──
  {
    const p = 12, theta = 9 * Math.PI / 180;
    const dRot = spacingRotation(p, theta);
    const dUniRot = spacingUnified(p, theta / 2, p, -theta / 2);
    const p1 = 12, p2 = 13.5;
    const dTwo = spacingTwoPitch(p1, p2);
    const dUniTwo = spacingUnified(p1, 0, p2, 0);
    const errRot = Math.abs(dUniRot - dRot);
    const errTwo = Math.abs(dUniTwo - dTwo);
    ok('C unified law: D=1/|k₁−k₂| === p/(2 sin(θ/2)) AND === p₁p₂/|p₁−p₂| to 1e-9 — the single readout authority contains both closed forms',
       errRot < 1e-9 && errTwo < 1e-9,
       'rotation Δ=' + errRot.toExponential(2) + ' · two-pitch Δ=' + errTwo.toExponential(2));
  }

  // ── D  NEGATIVE CONTROL (load-bearing): coincident combs ⇒ NO fringe ──
  // θ=0 AND p₁=p₂. The low band must hold no peak above 1e-6·carrier, so a
  // vacuous always-fringe renderer FAILS here. measureSpacing returns Infinity.
  {
    const p = 12, ds = p / 4;     // carrier well-sampled; no beat exists
    const m = measureSpacing(p, 0, p, 0, N, ds);
    const ratio = m.lowRatio;     // strongest low-band peak / carrier peak
    ok('D neg-control (load-bearing): θ=0 & p₁=p₂ ⇒ combs coincide ⇒ NO fringe — the low-band peak is < 1e-6 of the carrier and measured D = ∞ (a vacuous always-fringe renderer fails here)',
       m.spacing === Infinity && ratio < 1e-6,
       'measured D=' + (m.spacing === Infinity ? '∞' : m.spacing.toFixed(2)) + ' · low/carrier=' + ratio.toExponential(2));
  }

  // ── E  RENDER-NYQUIST GUARD: an over-fine grating does NOT report the true beat ──
  // Sample the SAME rotation config below the HARD Nyquist of 2 samples/period
  // (1.5 px/period); the carrier aliases and the measured beat is badly WRONG
  // (rel.err ≥ 5%), proving the guard is real. nyquistFloorOK (floor 4) flags the
  // over-fine pitch while passing the well-sampled 4 px/period grid.
  {
    const p = 12, theta = 9 * Math.PI / 180;
    const predicted = spacingRotation(p, theta);
    const dsFine = p / 1.5;       // 1.5 px/period < 2 (the hard Nyquist) ⇒ aliasing
    const m = measureSpacing(p, theta / 2, p, -theta / 2, N, dsFine);
    const rel = m.spacing === Infinity ? 1 : Math.abs(m.spacing - predicted) / predicted;
    const floorBlocks = !nyquistFloorOK(1.5) && nyquistFloorOK(4);
    ok('E render-Nyquist guard: an over-fine grating (1.5 px/period < the hard Nyquist 2) does NOT report the true beat (rel.err ≥ 5%), and nyquistFloorOK flags it — the guard is real, not decorative',
       rel >= 0.05 && floorBlocks,
       'aliased rel.err=' + (rel * 100).toFixed(1) + '% (true D=' + predicted.toFixed(2) + ', measured=' + (m.spacing === Infinity ? '∞' : m.spacing.toFixed(2)) + ') · floor flags fine=' + floorBlocks);
  }

  // ── F  IMPORTED-TRANSFORM CONTRACT: fft/toComplex are imported; non-pow2 throws ──
  {
    const importsOk = (typeof fft === 'function') && (typeof toComplex === 'function');
    let threw = false;
    try { fft(toComplex(new Array(100).fill(0))); } catch (e){ threw = /power-of-two/.test(String(e.message)); }
    ok('F imported-transform contract: fft/toComplex are IMPORTED from butterfly/core.mjs and fft on a length-100 (non-pow-2) input THROWS the power-of-two error (this file types no FFT)',
       importsOk && threw,
       'imports ok=' + importsOk + ' · non-pow2 fft throws=' + threw);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass: pass, total: lines.length, lines: lines };
}
// ===== MOIRE CORE END =====

export {
  grating, composite, wavevector, diffMag,
  spacingRotation, spacingTwoPitch, spacingUnified,
  measureSpacing, fft2mag, nyquistFloorOK, clampTheta,
  runSelfTest,
};
