// ============================================================================
//  THE TARTINI BENCH — the DIFFERENCE-TONE CORE: the sole authority for the claim
//  "a slightly-bent horn breeds a THIRD pitch nobody played, at exactly f₂−f₁."
//  This module owns the bench's physics — pure, dependency-free (DOM-free):
//
//    • Two pure tones, summed, are x(t) = cos(2πf₁t) + cos(2πf₂t) — nothing but
//      f₁ and f₂ live in that spectrum. Push them through a slightly-NONLINEAR
//      horn, y = hornTransfer(x, ε) = x + ε·x², and the quadratic term breeds new
//      components the input never carried: a DIFFERENCE tone at |f₂−f₁|, a SUM
//      tone at f₁+f₂, OCTAVES at 2f₁ and 2f₂, and a DC shift — all born of x², all
//      absent from the linear sum. Giuseppe Tartini heard the difference tone by
//      ear in 1714 ("il terzo suono"); it is a real component of the air, not a
//      perceptual trick — which is exactly what lets the Audio Lens find it.
//
//    • THE EXACT IDENTITY: (cos A + cos B)² expands to a constant ½+½, two
//      half-octaves ½cos2A + ½cos2B, and a cross term cos(A−B) + cos(A+B). So in
//      the Goertzel-bin convention (a cosine of amplitude c reads as c/2; DC, with
//      no negative-frequency twin to halve, reads as c) the horn's spectrum is, to
//      the bit: DIFF = ε/2, SUM = ε/2, each OCTAVE = ε/4, DC = ε — and on the
//      LINEAR path (ε=0) every one of them is EXACTLY 0 while f₁, f₂ stand at full
//      magnitude. The third pitch is the input fed through the bend, nothing added.
//
//    • THE NEGATIVE CONTROL: flip the horn LINEAR (ε=0, the identity y=x) and the
//      difference tone vanishes to a true zero — not a small number, the literal 0.
//      The bloom is the bend; remove the bend and there is nothing to bloom.
//
//  This DIFFERENCE-TONE CORE single-sources the pitch anchor from
//  ../pitch-core.mjs (semiToFreq, never re-typed). The Tartini Bench page
//  (the-tartini-bench/index.html) inlines a BYTE-TWIN of the CORE slice between
//  the sentinels below, char-for-char; the Node twin (core.test.mjs) re-extracts
//  that slice and asserts it is identical, re-derives the ε/2 identity at fresh
//  tones and across an ε-sweep, and proves the horn law lives in ONE file. The
//  in-page pill and the Node twin both call THIS runTartiniSelfTest, so "self-test
//  green" cannot drift.
//
//  Note on the byte-twin's shape: the DIFFERENCE-TONE CORE block is IMPORT-FREE —
//  it takes its tones (f₁, f₂) and ε as PARAMETERS. This lets the page inline the
//  slice without forcing a load order (the PITCH CORE wiring that derives F1/F2
//  lives OUTSIDE the slice), and keeps the single-source grep honest: the pitch
//  anchor is imported, never re-typed; the horn law lives only inside this slice.
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the bench's two played tones, DERIVED from the pitch anchor (no Hz literal is
// re-typed). F1 is the fulcrum (A3, ≈220 Hz); F2 sits a JUST major third above it
// (the 5/4 ratio), so the difference tone f₂−f₁ = F1·(5/4 − 1) = F1/4 falls out of
// ONE 5/4 law — a low A1 at ≈55 Hz, an octave-and-two below the fulcrum.
const F1 = semiToFreq(-3);          // ≈220 Hz — A3, the fulcrum tone (A4=440 is semiToFreq(+9))
const F2 = F1 * (5 / 4);            // =275 Hz — a just major third above F1
const EPS = 0.12;                   // the live horn's bend (facet-0's measured sweet spot)

// ===== DIFFERENCE-TONE CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: every function takes its tones (f1, f2) and the horn bend ε as
// PARAMETERS — so the page can inline this block verbatim regardless of script
// load order, and the pitch anchor is never re-typed inside the slice (the
// single-source grep checks). The horn law `hornTransfer` lives here and ONLY here.

// the difference tone — the third pitch nobody played. EXACT integer arithmetic
// when f1, f2 are integers; it is the absolute gap between the two tones.
function diffToneFreq(f1, f2){ return Math.abs(f2 - f1); }

// the sum tone — the other component the bend breeds, at f1+f2.
function sumToneFreq(f1, f2){ return f1 + f2; }

// THE HORN LAW — the ONLY place the nonlinearity lives as code (the single-source
// grep asserts this fragment appears in exactly one file). A slightly-bent horn is
// y = x + ε·x²: the linear term passes the input through untouched; the quadratic
// term is what breeds the difference, sum, octave, and DC components. LINEAR is
// ε = 0 (the identity y = x), and then the bend breeds nothing.
function hornTransfer(x, eps){ return x + eps * x * x; }

// the two pure tones, summed — the COSINE-phase stimulus fed to the horn. Cosine
// phase (not sine) is what makes the analytic spectrum coefficients below EXACT.
function stimulus(f1, f2, t){ return Math.cos(2 * Math.PI * f1 * t) + Math.cos(2 * Math.PI * f2 * t); }

// THE ANALYTIC SPECTRUM — the heart. (cos A + cos B)² = ½+½ + ½cos2A + ½cos2B +
// cos(A−B) + cos(A+B). In the Goertzel-bin convention (a cosine of amplitude c
// reads c/2; DC reads c, having no negative-frequency twin to halve) the horn
// output y = x + ε·x² has these EXACT bin magnitudes — the SOLE source of every
// coefficient the test and the page assert. Do NOT "fix" DC to ε/2: it is full ε.
function diffBinMag(eps){ return eps / 2; }        // |f₂−f₁| — the difference tone
function diffBinMagLinear(){ return 0; }            // ε=0 — exactly nothing
function sumBinMag(eps){ return eps / 2; }          // f₁+f₂ — the sum tone
function octaveBinMag(eps){ return eps / 4; }       // 2f₁ and 2f₂ — the octaves
function dcLevel(eps){ return eps; }                // f=0 — the DC shift (full ε)

// a self-contained single-bin DFT: the DFT-bin magnitude of `samples` at
// frequency `freq`, normalised by N so a cosine of amplitude c reads c/2 (and a
// DC constant c reads c). A DIRECT correlation against cos/sin at `freq` — not the
// recursive Goertzel, whose error grows over N samples; the direct sum keeps the
// analytic identities exact to <1e-9 even over a long window. The test legs feed
// it hornTransfer(stimulus(...)) to MEASURE the bin energies and confront them
// with the analytic coefficients above.
function goertzelMag(samples, freq, sampleRate){
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

// render N samples of the horn output y(t) = hornTransfer(stimulus(f1,f2,t), eps)
// at `sampleRate`. Used both for ad-hoc renders and (via analysisWindow) for the
// leakage-free measurement windows the test legs probe.
function renderHorn(f1, f2, eps, sampleRate, N){
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const t = i / sampleRate;
    out[i] = hornTransfer(stimulus(f1, f2, t), eps);
  }
  return out;
}

// THE LEAKAGE-FREE WINDOW: for the 5/4 bench, f1 = 4·fd and f2 = 5·fd, so EVERY
// bin the test probes (diff fd, f1, f2, 2f1, 2f2, sum, DC) is an integer multiple
// of the difference frequency fd = |f2−f1|. Render exactly `cycles` periods of fd
// with M samples per fd-period — then the effective sample rate SR = M·fd puts
// every probed bin on an EXACT DFT bin (bin = its fd-multiple × cycles), so the
// single-bin DFT reads the analytic coefficient to machine epsilon, with no window
// roundoff from a non-commensurate sample rate. Returns { SR, N }.
function analysisWindow(f1, f2, cyclesPerFdPeriod = 256, fdPeriods = 32){
  const fd = Math.abs(f2 - f1);
  const SR = cyclesPerFdPeriod * fd;   // M samples per fd-period
  const N = cyclesPerFdPeriod * fdPeriods;
  return { SR, N, fd };
}

// ── runTartiniSelfTest(f1, f2, eps) — the SOLE ORACLE. Same shape as the sibling
// leaves: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the
// Node twin both call THIS, so they cannot disagree. f1/f2 are the two tones; eps
// is the horn bend. Five legs prove the third pitch is a real, exact component of
// the nonlinear spectrum and EXACTLY absent from the linear one.
function runTartiniSelfTest(f1, f2, eps){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // the leakage-free measurement window: M samples per difference-tone period over
  // a whole number of difference-tone periods, so f1, f2 and every probed bin (diff,
  // sum, 2f1, 2f2, DC) lands on an EXACT DFT bin and the single-bin DFT reads the
  // analytic coefficient to machine epsilon (no spectral leakage, no window roundoff).
  const { SR, N } = analysisWindow(f1, f2);

  // LEG 1 — THE DIFFERENCE-TONE FREQUENCY, to the bit: diffToneFreq is exactly
  //   |f₂−f₁| across an integer (f1,f2) sweep — the third pitch sits at the exact
  //   gap, computed, never typed. Integer arithmetic, so Δ is literally 0.
  {
    let ok = true, worst = 0;
    for (let a = 100; a <= 400; a += 37){
      for (let b = a + 11; b <= a + 300; b += 53){
        const got = diffToneFreq(a, b), want = Math.abs(b - a);
        const d = Math.abs(got - want);
        worst = Math.max(worst, d);
        if (d !== 0) ok = false;
      }
    }
    T('LEG 1 — the difference-tone frequency: diffToneFreq(f₁,f₂) is EXACTLY |f₂−f₁| across an integer tone sweep — the third pitch sits at the exact gap, integer-exact, computed not typed',
      ok, ok ? `diffToneFreq = |f₂−f₁| to the bit across the sweep (worst Δ ${worst})`
             : `mismatch (worst Δ ${worst})`);
  }

  // LEG 2 — THE QUADRATIC-TERM IDENTITY: the Goertzel at the difference bin of the
  //   measured horn output equals diffBinMag(ε) = ε/2 to <1e-9. The bloom is real
  //   and its size is the bend: the third pitch is the input fed through x².
  {
    const y = renderHorn(f1, f2, eps, SR, N);
    const measured = goertzelMag(y, diffToneFreq(f1, f2), SR);
    const want = diffBinMag(eps);
    const d = Math.abs(measured - want);
    const ok = d < 1e-9;
    T('LEG 2 — the quadratic-term identity: the Goertzel at the |f₂−f₁| bin of the measured horn output equals diffBinMag(ε) = ε/2 to <1e-9 — the difference tone is a real spectral component, and its magnitude IS the bend',
      ok, `measured ${measured.toExponential(6)} vs ε/2 ${want.toExponential(6)} — Δ ${d.toExponential(2)}`);
  }

  // LEG 3 — THE LINEAR CONTROL, to a true zero: with the horn LINEAR (ε=0) the
  //   measured difference-bin energy is <1e-9 AND diffBinMagLinear() is EXACTLY 0.
  //   The bloom is the bend; flip the horn flat and there is literally nothing.
  {
    const y0 = renderHorn(f1, f2, 0, SR, N);
    const measured = goertzelMag(y0, diffToneFreq(f1, f2), SR);
    const analytic = diffBinMagLinear();
    const ok = measured < 1e-9 && analytic === 0;
    T('LEG 3 — the linear control: with the horn LINEAR (ε=0) the measured difference-bin energy is <1e-9 AND diffBinMagLinear() is EXACTLY 0 — the third pitch vanishes to a true zero when the bend is removed',
      ok, `measured ${measured.toExponential(2)} (<1e-9) · diffBinMagLinear() === 0: ${analytic === 0}`);
  }

  // LEG 4 — THE WHOLE x² EXPANSION, discriminated: every bin the bend breeds matches
  //   its analytic coefficient — SUM = ε/2, each OCTAVE (2f₁,2f₂) = ε/4, DC = ε — to
  //   <1e-9; AND on the LINEAR path ALL of {diff, sum, 2f₁, 2f₂} read ~0 while f₁, f₂
  //   stand at full magnitude (ε/2 reads as ½ on the linear fundamentals: amplitude 1
  //   → bin ½). This proves the entire quadratic expansion, not one lucky bin.
  {
    const y = renderHorn(f1, f2, eps, SR, N);
    const y0 = renderHorn(f1, f2, 0, SR, N);
    const fd = diffToneFreq(f1, f2), fs = sumToneFreq(f1, f2);
    const checks = [
      ['sum',    goertzelMag(y, fs, SR),       sumBinMag(eps)],
      ['2f₁',    goertzelMag(y, 2 * f1, SR),   octaveBinMag(eps)],
      ['2f₂',    goertzelMag(y, 2 * f2, SR),   octaveBinMag(eps)],
      ['DC',     goertzelMag(y, 0, SR),        dcLevel(eps)],
    ];
    let ok = true, worst = 0; const rows = [];
    for (const [name, got, want] of checks){
      const d = Math.abs(got - want); worst = Math.max(worst, d);
      if (d >= 1e-9){ ok = false; rows.push(`${name} ${got.toExponential(3)}≠${want.toExponential(3)}`); }
    }
    // linear path: diff/sum/octaves all ~0, fundamentals at full ½ magnitude
    const linBred = [fd, fs, 2 * f1, 2 * f2].map(f => goertzelMag(y0, f, SR));
    const linBredZero = linBred.every(m => m < 1e-9);
    const f1Mag = goertzelMag(y0, f1, SR), f2Mag = goertzelMag(y0, f2, SR);
    const fundsFull = Math.abs(f1Mag - 0.5) < 1e-9 && Math.abs(f2Mag - 0.5) < 1e-9;
    ok = ok && linBredZero && fundsFull;
    T('LEG 4 — the whole x² expansion: SUM = ε/2, each octave (2f₁,2f₂) = ε/4, DC = ε to <1e-9; AND on the LINEAR path diff/sum/2f₁/2f₂ all read ~0 while f₁,f₂ stand at full ½ magnitude — the entire quadratic expansion, not one lucky bin',
      ok, ok ? `horn bins match analytics (worst Δ ${worst.toExponential(2)}) · linear bred-bins all <1e-9 · f₁,f₂ = ½ exact`
             : `${rows.join(', ')} · linBredZero=${linBredZero} fundsFull=${fundsFull}`);
  }

  // LEG 5 — THE HERO VERB, as exact arithmetic: as f₂ slides UP away from f₁, the
  //   difference tone f₂−f₁ rises MONOTONICALLY and equals the gap at every step —
  //   the phantom dives away from the fulcrum by exactly the gap it opens. This is
  //   the arithmetic behind "slide f₂ up and the third pitch slides too."
  {
    let ok = true, prev = -Infinity, worst = 0; const steps = [];
    for (let b = f1 + 5; b <= f1 + 200; b += 17){
      const got = diffToneFreq(f1, b), want = b - f1;
      const d = Math.abs(got - want); worst = Math.max(worst, d);
      if (d > 1e-9) ok = false;
      if (!(got > prev)) ok = false;      // strictly increasing
      prev = got; steps.push(got);
    }
    T('LEG 5 — the hero verb as arithmetic: as f₂ slides up away from f₁, diffToneFreq rises MONOTONICALLY and equals the gap at every step — the exact behaviour behind "slide f₂ up and the third pitch slides with it"',
      ok, ok ? `monotone & === gap over ${steps.length} steps (worst Δ ${worst.toExponential(2)})`
             : `monotone/gap broke (worst Δ ${worst.toExponential(2)})`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== DIFFERENCE-TONE CORE END =====

export {
  F1, F2, EPS,
  diffToneFreq, sumToneFreq, hornTransfer, stimulus,
  diffBinMag, diffBinMagLinear, sumBinMag, octaveBinMag, dcLevel,
  goertzelMag, renderHorn, analysisWindow, runTartiniSelfTest,
  semiToFreq,
};
