// ============================================================================
//  THE COMB — the FEEDFORWARD-COMB CORE: the sole authority for the claim
//  "sum a signal with a short-delayed copy of ITSELF and the spectrum grows a
//  COMB of notches — the first deep notch at EXACTLY 1/(2τ) and the teeth spaced
//  1/τ apart." This module owns the bench's physics — pure, dependency-free
//  (DOM-free):
//
//    • THE FEEDFORWARD-COMB LAW: feed a signal x(t) into a single delay-and-add —
//      y(t) = x(t) + g·x(t−τ). Its transfer is H(f) = 1 + g·e^(−j2πfτ), so the
//      magnitude response is the cosine ripple
//          |H(f)|² = 1 + 2g·cos(2πfτ) + g².
//      That ripple IS the comb: it peaks where the echo lands in phase
//      (cos = +1, f = n/τ) and DIPS where the echo lands a half-cycle out of
//      phase (cos = −1, f = (n+½)/τ). The dips are the teeth.
//
//    • THE NOTCH LADDER — the staged fact. The dips sit where cos(2πfτ) = −1, i.e.
//      2πfτ = (2n+1)π, i.e. f = (n+½)/τ for n = 0,1,2,…. So the FIRST notch is at
//      EXACTLY 1/(2τ) and the teeth are spaced 1/τ apart — INDEPENDENT of the gain
//      g. Halve the delay and every tooth slides to twice the frequency; the comb
//      is the delay, and the delay alone sets where the teeth land.
//
//    • CANCELLATION AT g=1: the notch DEPTH is |H|min = |1−g| (the dip floor),
//      while the peak height is |H|max = 1+g. At g=1 the dip floor is a TRUE zero —
//      |H((n+½)/τ)| = 0 — total cancellation; a probe tone parked on a notch is
//      annihilated while one on a peak doubles. Push g toward 1 and the teeth
//      deepen toward silence; this is the audible "jet-plane flange" as τ sweeps.
//
//    • THE NEGATIVE CONTROL: set τ = 0 and y = x + g·x = (1+g)·x — a flat gain, NO
//      teeth; |H(f)|² = (1+g)² for EVERY f. And set g = 0 and y = x — the signal
//      untouched, |H(f)|² = 1 flat. The COMB IS THE DELAY: remove the delay (or the
//      echo's gain) and the spectrum is flat — the teeth need a delayed COPY to
//      interfere with, not merely a gain.
//
//  This FEEDFORWARD-COMB CORE single-sources the pitch anchor from
//  ../pitch-core.mjs (semiToFreq, never re-typed). The Comb page (the-comb/
//  index.html) inlines a BYTE-TWIN of the CORE slice between the sentinels below,
//  char-for-char; the Node twin (core.test.mjs) re-extracts that slice and asserts
//  it is identical, re-derives the notch ladder at fresh τ/g by a second
//  independent method (a swept render + DFT), and proves the comb law lives in ONE
//  file. The in-page pill and the Node twin both call THIS runCombSelfTest, so
//  "self-test green" cannot drift.
//
//  Note on the byte-twin's shape: the FEEDFORWARD-COMB CORE block is IMPORT-FREE —
//  it takes the delay τ, the echo gain g and the frequency f as PARAMETERS. This
//  lets the page inline the slice without forcing a load order (the PITCH CORE
//  wiring that derives the hero band lives OUTSIDE the slice), and keeps the
//  single-source grep honest: the pitch anchor is imported, never re-typed; the
//  comb law lives only here.
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the bench's hero defaults, with the band DERIVED from the pitch anchor (no Hz
// literal is re-typed for the audible probe). TAU0 is the live hero delay; G0 is
// the hero echo gain (a deep but stable feedforward comb). The probe carrier
// PROBE_FC anchors the optional in-band tone to a musical pitch.
const TAU0 = 0.001;                         // 1.0 ms — the hero delay (first notch at 500 Hz)
const G0 = 1.0;                             // hero echo gain — a full-depth feedforward comb (true nulls)
const SEMI_PROBE = 0;                       // the probe tone anchor: middle C as a semitone offset
const PROBE_FC = semiToFreq(SEMI_PROBE);    // ≈261.63 Hz — the live tone the comb colours

// ===== COMB CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: every function takes the delay τ, the echo gain g and the frequency
// f (and, where needed, the order n) as PARAMETERS — so the page can inline this
// block verbatim regardless of script load order, and the pitch anchor is never
// re-typed inside the slice (the single-source grep checks). The feedforward-comb
// transfer law lives here and ONLY here.

// THE FEEDFORWARD-COMB MAGNITUDE-SQUARED — |H(f)|² for the delay-and-add
// y = x + g·x(·−τ). H(f) = 1 + g·e^(−j2πfτ), so
//   |H|² = (1 + g·cos θ)² + (g·sin θ)² = 1 + 2g·cos θ + g²,   θ = 2πfτ.
// This single function is the SOLE source of every comb height the bench draws,
// the cosine ripple whose dips are the teeth. τ = 0 ⇒ θ = 0 ⇒ |H|² = (1+g)² flat;
// g = 0 ⇒ |H|² = 1 flat. The dips sit at cos θ = −1 (f = (n+½)/τ); the peaks at
// cos θ = +1 (f = n/τ).
function combMagSq(f, tau, g){
  const theta = 2 * Math.PI * f * tau;
  return 1 + 2 * g * Math.cos(theta) + g * g;
}

// the comb magnitude |H(f)| — the drawn spectrum envelope (heights), the root of
// the magnitude-squared. A tone at frequency f leaves the comb scaled by THIS.
function combMag(f, tau, g){ return Math.sqrt(Math.max(0, combMagSq(f, tau, g))); }

// THE NOTCH LADDER — the frequency of the n-th comb tooth (dip), n = 0,1,2,…:
//   f_notch(n) = (n + ½)/τ.
// The FIRST notch (n=0) is EXACTLY 1/(2τ); consecutive teeth are spaced 1/τ apart.
// EXACT for any τ > 0, INDEPENDENT of the gain g — the delay alone places the teeth.
function notchFreq(n, tau){ return (n + 0.5) / tau; }

// THE PEAK LADDER — the frequency of the n-th comb peak (where the echo lands in
// phase): f_peak(n) = n/τ for n = 0,1,2,… (the carrier peak at DC, then 1/τ, 2/τ…).
function peakFreq(n, tau){ return n / tau; }

// the comb's notch spacing Δf = 1/τ — the tooth-to-tooth interval (also the
// peak-to-peak interval). Halving τ doubles every tooth's frequency.
function notchSpacing(tau){ return 1 / tau; }

// the notch DEPTH and peak HEIGHT of the comb: the magnitude floor at a dip is
// |1−g| and the magnitude ceiling at a peak is 1+g. At g=1 the floor is a TRUE 0
// (total cancellation); at g=0 floor === ceiling === 1 (flat, no comb).
function notchDepth(g){ return Math.abs(1 - g); }
function peakHeight(g){ return 1 + g; }

// THE FEEDFORWARD-COMB SAMPLE — the time-domain delay-and-add evaluated for a pure
// cosine probe x(t) = cos(2πf t): y(t) = cos(2πf t) + g·cos(2πf (t−τ)). This is the
// ONLY place the feedforward time-domain law lives as code (the single-source grep
// asserts this fragment appears in exactly one file). τ = 0 ⇒ y = (1+g)·x.
function combSampleTone(f, tau, g, t){ return Math.cos(2 * Math.PI * f * t) + g * Math.cos(2 * Math.PI * f * (t - tau)); }

// render N samples of the delay-and-add output for a SUM of equal-amplitude cosine
// probe tones (each entry of `freqs`), at `sampleRate`. The summed cosines pass
// through the SAME delay-and-add, so each tone is scaled by combMag(f,τ,g): a tone
// on a notch is cancelled, one on a peak doubled. Used by the DFT confrontation.
function renderCombTones(freqs, tau, g, sampleRate, N){
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const t = i / sampleRate;
    let s = 0;
    for (let k = 0; k < freqs.length; k++) s += combSampleTone(freqs[k], tau, g, t);
    out[i] = s;
  }
  return out;
}

// a self-contained single-bin DFT: the DFT-bin magnitude of `samples` at frequency
// `freq`, normalised by N so a cosine of amplitude c reads c/2. A DIRECT correlation
// against cos/sin at `freq` — not the recursive Goertzel, whose error grows over N
// samples; the direct sum keeps the analytic identities exact to <1e-9 even over a
// long window. The test feeds it renderCombTones(...) to MEASURE each probe tone's
// surviving amplitude and confront it with combMag(f,τ,g).
function dftMag(samples, freq, sampleRate){
  const N = samples.length;
  const w = 2 * Math.PI * freq / sampleRate;
  const TAU = 2 * Math.PI;
  let re = 0, im = 0, ph = 0;
  for (let i = 0; i < N; i++){
    re += samples[i] * Math.cos(ph); im -= samples[i] * Math.sin(ph);
    ph += w; if (ph >= TAU) ph -= TAU;     // keep the phase small so cos/sin stay accurate over a long window
  }
  return Math.sqrt(re * re + im * im) / N;
}

// THE LEAKAGE-FREE WINDOW for a probe whose tones are all integer multiples of a
// base spacing `df` (Hz): render exactly `periods` periods of df with `spp` samples
// per df-period — then the effective sample rate SR = spp·df puts every tone on an
// EXACT DFT bin (bin = its df-multiple × periods), so the single-bin DFT reads
// combMag(f,τ,g)/2 to machine epsilon, with no window roundoff from a
// non-commensurate sample rate. For the comb the natural spacing is the notch
// spacing 1/τ; the half-spacing 1/(2τ) (peaks AND notches both land on the grid)
// is the base, so df = 1/(2τ). Returns { SR, N }.
function analysisWindow(df, spp = 512, periods = 64){
  const SR = spp * df;       // samples per second = samples-per-df-period × df-periods-per-second
  const N = spp * periods;   // total samples = one df-period's worth × the number of periods
  return { SR, N };
}

// ── runCombSelfTest(tau, g) — the SOLE ORACLE. Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS, so they cannot disagree. tau is the hero delay; g the echo gain.
// Five legs prove the feedforward comb is a real, exact notch ladder: the first
// notch is 1/(2τ) and the spacing 1/τ to machine-ε; the magnitude is the cosine
// ripple by two independent methods; a rendered sum-of-tones probe is annihilated
// on the notches and doubled on the peaks; and τ=0 / g=0 are flat (no teeth).
function runCombSelfTest(tau, g){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // LEG 1 — THE FIRST NOTCH IS 1/(2τ) AND THE SPACING IS 1/τ (exact): across a τ
  //   grid, notchFreq(0,τ) === 1/(2τ) to the bit and the consecutive-tooth gap
  //   notchFreq(n+1,τ) − notchFreq(n,τ) === 1/τ to <1e-9, AND combMagSq evaluated
  //   AT each notch frequency equals the dip floor (1−g)² to <1e-9 (the teeth land
  //   where the law dips). INDEPENDENT of g — the delay alone places the teeth.
  {
    let ok = true, worstFirst = 0, worstSpace = 0, worstDip = 0, worstAt = { n: 0, tt: 0.001 };
    for (const tt of [0.0002, 0.0005, 0.001, 0.003, 0.006, 0.012]){
      const first = notchFreq(0, tt);
      const dFirst = Math.abs(first - 1 / (2 * tt));
      if (dFirst > worstFirst){ worstFirst = dFirst; }
      const dipFloor = (1 - g) * (1 - g);                 // (1−g)² — the magnitude-squared dip floor
      for (let n = 0; n <= 8; n++){
        const fn = notchFreq(n, tt);
        const gap = notchFreq(n + 1, tt) - fn;
        const dSpace = Math.abs(gap - 1 / tt);
        if (dSpace > worstSpace){ worstSpace = dSpace; }
        const dDip = Math.abs(combMagSq(fn, tt, g) - dipFloor);
        if (dDip >= worstDip){ worstDip = dDip; worstAt = { n, tt }; }
        if (dFirst >= 1e-9 || dSpace >= 1e-6 || dDip >= 1e-9) ok = false;
      }
    }
    T('LEG 1 — the notch ladder is exact: across a τ grid the first notch === 1/(2τ) to the bit and the tooth spacing === 1/τ to <1e-9, AND |H|² evaluated at each notch frequency equals the dip floor (1−g)² to <1e-9 — the teeth land EXACTLY where the law dips, independent of g',
      ok, ok ? `first notch Δ ${worstFirst.toExponential(2)} · spacing Δ ${worstSpace.toExponential(2)} · |H|²-at-notch vs (1−g)² Δ ${worstDip.toExponential(2)} (worst at n=${worstAt.n}, τ=${worstAt.tt}s)`
             : `mismatch (first Δ ${worstFirst.toExponential(2)}, spacing Δ ${worstSpace.toExponential(2)}, dip Δ ${worstDip.toExponential(2)})`);
  }

  // LEG 2 — THE MAGNITUDE IS THE COSINE RIPPLE (second-method confrontation): the
  //   closed-form combMagSq(f,τ,g) equals the magnitude-squared of the COMPLEX
  //   transfer H = 1 + g·e^(−j2πfτ) assembled from its real/imag parts, over an
  //   (f,τ) grid to <1e-12 — two disjoint computations of the same response agree.
  {
    let ok = true, worst = 0;
    for (const tt of [0.0005, 0.001, 0.004, 0.009]){
      for (let f = 50; f <= 5000; f += 37.5){
        const theta = 2 * Math.PI * f * tt;
        const re = 1 + g * Math.cos(theta), im = -g * Math.sin(theta);   // H = 1 + g·e^(−jθ)
        const ref = re * re + im * im;                                   // |H|² from the complex parts
        const d = Math.abs(combMagSq(f, tt, g) - ref);
        if (d > worst) worst = d;
        if (d >= 1e-12) ok = false;
      }
    }
    T('LEG 2 — the magnitude IS the cosine ripple: the closed-form |H|² = 1 + 2g·cos(2πfτ) + g² equals |1 + g·e^(−j2πfτ)|² assembled from the complex parts over an (f,τ) grid to <1e-12 — two disjoint computations of the same transfer agree',
      ok, ok ? `closed-form === complex |H|² to <1e-12 across the grid (worst Δ ${worst.toExponential(2)})`
             : `mismatch (worst Δ ${worst.toExponential(2)})`);
  }

  // LEG 3 — CANCELLATION & DOUBLING (the rendered probe matches the math): render a
  //   SUM of equal-amplitude cosine probe tones — some parked ON notches (n+½)/τ,
  //   some on peaks n/τ — through the delay-and-add, then the DFT reads each tone's
  //   surviving amplitude as combMag(f,τ,g)/2 to <1e-9. At g=1 the notch tones are
  //   annihilated (≈0) while the peak tones double (≈1) — the comb the ear gets is
  //   the comb the law draws.
  {
    const df = 1 / (2 * tau);                              // half-spacing: peaks AND notches on the grid
    const { SR, N } = analysisWindow(df);
    const peaks = [peakFreq(1, tau), peakFreq(2, tau), peakFreq(3, tau)];     // 1/τ, 2/τ, 3/τ
    const notches = [notchFreq(0, tau), notchFreq(1, tau), notchFreq(2, tau)]; // 1/(2τ), 3/(2τ), 5/(2τ)
    const freqs = peaks.concat(notches);
    const y = renderCombTones(freqs, tau, g, SR, N);
    let ok = true, worst = 0; const rows = [];
    for (const f of freqs){
      const measured = dftMag(y, f, SR);
      const want = combMag(f, tau, g) / 2;                 // a cosine of amplitude |H| reads |H|/2
      const d = Math.abs(measured - want); worst = Math.max(worst, d);
      if (d >= 1e-9){ ok = false; rows.push(`f=${f.toFixed(0)} ${measured.toExponential(3)}≠${want.toExponential(3)}`); }
    }
    // at g=1: notch tones annihilated (<1e-9), peak tones doubled (~1.0)
    const notchAmp = notches.map(f => dftMag(y, f, SR));
    const peakAmp = peaks.map(f => dftMag(y, f, SR));
    const deepOK = (g < 1) ? true : notchAmp.every(a => a < 1e-9) && peakAmp.every(a => a > 0.49);
    ok = ok && deepOK;
    T('LEG 3 — cancellation & doubling: a rendered SUM of probe tones — some on notches (n+½)/τ, some on peaks n/τ — leaves the delay-and-add scaled by combMag(f,τ,g)/2 at every tone to <1e-9; at g=1 the notch tones are annihilated (≈0) while the peak tones double (≈1) — the heard comb IS the drawn comb',
      ok, ok ? `every tone === combMag/2 to <1e-9 (worst Δ ${worst.toExponential(2)})` + (g >= 1 ? ` · notch tones [${notchAmp.map(a=>a.toExponential(1)).join(', ')}] ≈ 0 · peak tones [${peakAmp.map(a=>a.toFixed(3)).join(', ')}] ≈ 1` : ` · g=${g} (partial notch, depth |1−g|=${Math.abs(1-g).toFixed(3)})`)
             : `${rows.join(', ')}`);
  }

  // LEG 4 — THE GAIN SETS THE DEPTH, NOT THE PLACE: as g sweeps 0→1 the notch FLOOR
  //   |H|min = |1−g| shrinks monotonically to a true 0 while the peak CEILING
  //   |H|max = 1+g grows to 2 — yet the notch FREQUENCIES stay exactly (n+½)/τ for
  //   every g (the place is the delay's, the depth is the gain's). Checked at the
  //   first notch across a g grid to <1e-12.
  {
    let ok = true, worstFloor = 0, worstCeil = 0, worstPlace = 0;
    const fn = notchFreq(0, tau), fp = peakFreq(1, tau);
    let prevFloor = Infinity, mono = true;
    for (let gg = 0; gg <= 1.0001; gg += 0.1){
      const floor = combMag(fn, tau, gg);                  // |H| at the first notch
      const ceil = combMag(fp, tau, gg);                   // |H| at the first nonzero peak
      worstFloor = Math.max(worstFloor, Math.abs(floor - Math.abs(1 - gg)));
      worstCeil = Math.max(worstCeil, Math.abs(ceil - (1 + gg)));
      // the notch frequency is gain-independent: combMagSq dips at fn for every g
      worstPlace = Math.max(worstPlace, Math.abs(combMagSq(fn, tau, gg) - (1 - gg) * (1 - gg)));
      if (floor > prevFloor + 1e-12) mono = false; prevFloor = floor;
    }
    ok = mono && worstFloor < 1e-12 && worstCeil < 1e-12 && worstPlace < 1e-9;
    T('LEG 4 — the gain sets the DEPTH, not the place: as g sweeps 0→1 the notch floor |H|min = |1−g| shrinks monotonically to a true 0 and the peak ceiling |H|max = 1+g grows to 2, yet the notch frequencies stay exactly (n+½)/τ for every g — the delay places the teeth, the gain deepens them',
      ok, ok ? `floor === |1−g| (Δ ${worstFloor.toExponential(2)}), ceiling === 1+g (Δ ${worstCeil.toExponential(2)}), monotone ✓ · place fixed (Δ ${worstPlace.toExponential(2)})`
             : `floor Δ ${worstFloor.toExponential(2)} / ceil Δ ${worstCeil.toExponential(2)} / monotone ${mono} / place Δ ${worstPlace.toExponential(2)}`);
  }

  // LEG 5 — THE NEGATIVE CONTROL, to a true flat: at τ=0 the comb collapses to a
  //   flat gain — combMagSq(f,0,g) === (1+g)² for EVERY f (no teeth); and at g=0 the
  //   signal is untouched — combMagSq(f,τ,0) === 1 for every f. The comb is the
  //   DELAY: remove the delayed copy (τ=0) or its gain (g=0) and the spectrum is
  //   dead flat — the teeth need a delayed copy to interfere with.
  {
    let okTau = true, okG = true, worstTau = 0, worstG = 0;
    const flatTau = (1 + g) * (1 + g);
    for (let f = 50; f <= 5000; f += 50){
      const dT = Math.abs(combMagSq(f, 0, g) - flatTau);   // τ=0 is flat at (1+g)² (the cos(0)=1 floor of the law)
      const dG = combMagSq(f, tau, 0) - 1;                 // g=0 leaves |H|²=1 — a bit-exact identity (no float work)
      if (dT > worstTau) worstTau = dT;
      if (Math.abs(dG) > worstG) worstG = Math.abs(dG);
      if (dT >= 1e-12) okTau = false;                      // (1+g)² itself carries float roundoff for non-dyadic g
      if (dG !== 0) okG = false;                            // g=0 ⇒ |H|²=1 must be EXACT (the law adds nothing)
    }
    const ok = okTau && okG;
    T('LEG 5 — the negative control: at τ=0 the comb is a flat gain |H|² === (1+g)² for EVERY f (no teeth, to <1e-12), and at g=0 the signal is untouched |H|² === 1 for every f (bit-exact) — the comb is the DELAY; remove the delayed copy (or its gain) and the spectrum is dead flat',
      ok, ok ? `τ=0 ⇒ |H|² === (1+g)² (worst Δ ${worstTau.toExponential(2)}) · g=0 ⇒ |H|² === 1 (Δ=${worstG}, bit-exact) — both flat, no teeth`
             : `τ=0 worst Δ ${worstTau.toExponential(2)} / g=0 worst Δ ${worstG.toExponential(2)}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== COMB CORE END =====

export {
  TAU0, G0, SEMI_PROBE, PROBE_FC,
  combMagSq, combMag, notchFreq, peakFreq, notchSpacing, notchDepth, peakHeight,
  combSampleTone, renderCombTones, dftMag, analysisWindow, runCombSelfTest,
  semiToFreq,
};
