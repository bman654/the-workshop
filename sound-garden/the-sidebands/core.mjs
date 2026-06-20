// ============================================================================
//  THE SIDEBANDS — the FM-SPECTRUM CORE: the sole authority for the claim
//  "frequency-modulate a carrier and it sprouts a symmetric COMB of sidebands at
//  fc ± n·fm, each one exactly |Jₙ(β)| tall — and at β ≈ 2.4048 the carrier itself
//  goes silent." This module owns the bench's physics — pure, dependency-free
//  (DOM-free):
//
//    • THE FM LAW: a carrier of frequency fc whose phase is wobbled by a modulator
//      of frequency fm and DEPTH β is y(t) = cos(2π·fc·t + β·sin(2π·fm·t)). The
//      Jacobi–Anger expansion turns that one wiggling tone into an INFINITE sum of
//      steady tones: y = Σₙ Jₙ(β)·cos(2π(fc + n·fm)t), n ∈ ℤ. So the spectrum is a
//      COMB: a rung at the carrier fc (n=0) and a symmetric pair of sidebands at
//      every fc ± n·fm, and the height of the n-th rung is the n-th Bessel function
//      of the first kind evaluated at the depth, |Jₙ(β)|. Push β and the comb
//      grows; the energy never leaves — it only redistributes among the rungs.
//
//    • THE CARRIER NULL — the staged razor. J₀ (the carrier's own height) is 1 at
//      β=0 and then OSCILLATES, crossing zero at β = 2.404825557…, the first zero
//      of J₀. AT that depth the center rung vanishes: the loudest tone — the one you
//      "played" — goes completely silent while the sidebands flood. The pitch you
//      aimed at is the one pitch that isn't there.
//
//    • ENERGY IS CONSERVED: Σₙ Jₙ(β)² = 1 for every β (a Bessel identity). FM moves
//      energy among the rungs but never creates or destroys it — the total is always
//      exactly one. At the carrier null that whole "1" lives entirely in the sidebands.
//
//    • THE NEGATIVE CONTROL: set the depth β = 0 and Jₙ(0) is 1 for n=0 and a TRUE 0
//      for every n≠0. The comb collapses to a lone pure carrier — every sideband is
//      not small, it is literally zero. The comb is the depth; remove it and there
//      is one rung and silence on either side.
//
//  This FM-SPECTRUM CORE single-sources the pitch anchor from ../pitch-core.mjs
//  (semiToFreq, never re-typed). The Sidebands page (the-sidebands/index.html)
//  inlines a BYTE-TWIN of the CORE slice between the sentinels below, char-for-char;
//  the Node twin (core.test.mjs) re-extracts that slice and asserts it is identical,
//  re-derives the |Jₙ(β)| comb at fresh carrier/depth and across a β-sweep by a
//  second independent method (the Bessel power series), and proves the FM law lives
//  in ONE file. The in-page pill and the Node twin both call THIS
//  runSidebandSelfTest, so "self-test green" cannot drift.
//
//  Note on the byte-twin's shape: the FM-SPECTRUM CORE block is IMPORT-FREE — it
//  takes the carrier fc, modulator fm and depth β as PARAMETERS. This lets the page
//  inline the slice without forcing a load order (the PITCH CORE wiring that derives
//  FC/FM lives OUTSIDE the slice), and keeps the single-source grep honest: the
//  pitch anchor is imported, never re-typed; the Bessel recurrence lives only here.
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the bench's carrier and modulator, DERIVED from the pitch anchor (no Hz literal
// is re-typed). FC is middle C (≈261.63 Hz); FM = FC/16 (an integer ratio fc:fm =
// 16:1, so every comb tooth fc ± n·fm lands on an exact bin of the leakage-free
// analysis window). The ratio is 16 (not a smaller number) so the comb's lower teeth
// fc − n·fm stay POSITIVE for every order the analysis touches — a tooth that crossed
// 0 Hz would fold onto a positive bin (a real cosine at −g IS a cosine at +g) and
// contaminate the per-tooth read. At fc = 16·fm the colliding partner of upper tooth
// n is order −(32+n), whose |Jₙ| is negligible (<1e-12) for all β the bench reaches.
// BETA is the live hero depth; J0_ZERO1 is the first zero of J₀ — the staged razor.
const SEMI_FC = 0;                          // middle C as a semitone offset
const FC = semiToFreq(SEMI_FC);             // ≈261.63 Hz — the carrier (the center rung)
const FM = FC / 16;                         // ≈16.35 Hz — the modulator (integer ratio fc:fm = 16:1)
const BETA = 2.0;                           // the live hero depth (a full comb, carrier still alight)
const J0_ZERO1 = 2.404825557695773;         // the first zero of J₀ — where the carrier rung goes dark

// ===== BESSEL CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: every function takes the carrier fc, modulator fm and depth β (and,
// where needed, the order n) as PARAMETERS — so the page can inline this block
// verbatim regardless of script load order, and the pitch anchor is never re-typed
// inside the slice (the single-source grep checks). The Bessel recurrence
// `besselJarray` lives here and ONLY here.

// THE BESSEL ENGINE — Jₙ(x) for all orders 0..nMax at once, by Miller's DOWNWARD
// recurrence. The recurrence J_{n-1}(x) = (2n/x)·Jₙ(x) − J_{n+1}(x) is numerically
// UNSTABLE upward (round-off explodes) but STABLE downward, so we start at a high
// index M (well above both nMax and |x|), seed J_{M+1}=0 / J_M=1e-300 (an arbitrary
// tiny start), recur DOWN to 0, then fix the unknown overall scale with the Neumann
// identity J₀ + 2(J₂ + J₄ + …) = 1 (exact for all x, needs no reference value). An
// on-the-fly ×1e-250 rescale guards against overflow for large x. Sign for negative
// x follows Jₙ(−x) = (−1)ⁿ Jₙ(x). This single function is the SOLE source of every
// sideband height the bench draws, sounds, and asserts.
function besselJarray(x, nMax, extra = 18){
  const ax = Math.abs(x);
  let M = Math.max(nMax, Math.ceil(ax)) + extra;   // start comfortably above max(nMax, |x|)
  if (M % 2 === 1) M += 1;                          // even start index for clean Neumann parity
  const j = new Float64Array(M + 2);
  j[M + 1] = 0;
  j[M] = 1e-300;                                    // tiny seed; the overall scale is fixed below
  for (let n = M; n >= 1; n--){
    j[n - 1] = (2 * n / (ax === 0 ? 1 : ax)) * j[n] - j[n + 1];
    if (Math.abs(j[n - 1]) > 1e250){               // rescale on the fly to dodge overflow
      const s = 1e-250;
      for (let k = n - 1; k <= M; k++) j[k] *= s;
    }
  }
  let norm = j[0];                                  // Neumann normalizer: J₀ + 2·Σ_{k≥1} J_{2k} = 1
  for (let k = 2; k <= M; k += 2) norm += 2 * j[k];
  const out = new Float64Array(nMax + 1);
  for (let n = 0; n <= nMax; n++) out[n] = j[n] / norm;
  if (ax === 0){ out.fill(0); out[0] = 1; }         // x=0: J₀(0)=1, Jₙ(0)=0 (recurrence divides by x)
  if (x < 0) for (let n = 1; n <= nMax; n += 2) out[n] = -out[n];   // Jₙ(−x) = (−1)ⁿ Jₙ(x)
  return out;
}

// a single Bessel value Jₙ(x), pulled from the array engine above.
function besselJ(n, x){ return besselJarray(x, Math.abs(n))[Math.abs(n)]; }

// the n-th sideband's AMPLITUDE = |Jₙ(β)| — the height of the rung at fc ± n·fm.
// (n=0 is the carrier rung |J₀(β)|.) The magnitude, because the page draws heights
// and the lens reads peak magnitudes; the SIGN of Jₙ lives in the time-domain phase.
function sidebandAmp(n, beta){ return Math.abs(besselJ(n, beta)); }

// the n-th sideband's FREQUENCY = fc + n·fm (n<0 are the lower sidebands). EXACT
// integer arithmetic when fc, fm are integers; the comb is evenly spaced by fm.
function sidebandFreq(fc, fm, n){ return fc + n * fm; }

// the whole comb of sideband AMPLITUDES |Jₙ(β)| for orders n = 0..nMax (the upper
// half; the comb is symmetric, |J_{−n}| = |Jₙ|). Reads from besselJarray ONCE.
function combAmps(beta, nMax){
  const arr = besselJarray(beta, nMax);
  const out = new Float64Array(nMax + 1);
  for (let n = 0; n <= nMax; n++) out[n] = Math.abs(arr[n]);
  return out;
}

// the carrier rung's amplitude alone, |J₀(β)| — turns to ~0 at β = J0_ZERO1.
function carrierAmp(beta){ return Math.abs(besselJ(0, beta)); }

// the total comb energy Σₙ Jₙ(β)² over all integer orders (J₀² + 2·Σ_{n≥1} Jₙ²),
// which the Bessel identity says is EXACTLY 1 for every β. nMax must be high enough
// to capture the tail (the comb's effective width is ≈ β + a few).
function combEnergy(beta, nMax = 60){
  const arr = besselJarray(beta, nMax);
  let s = arr[0] * arr[0];
  for (let n = 1; n <= nMax; n++) s += 2 * arr[n] * arr[n];
  return s;
}

// THE FM LAW — one carrier whose phase is wobbled by a modulator of depth β. This
// is the ONLY place the FM time-domain law lives as code (the single-source grep
// asserts this fragment appears in exactly one file). β = 0 → a pure carrier.
function fmSample(fc, fm, beta, t){ return Math.cos(2 * Math.PI * fc * t + beta * Math.sin(2 * Math.PI * fm * t)); }

// render N samples of the FM signal y(t) = fmSample(fc, fm, beta, t) at `sampleRate`.
// Used for ad-hoc renders and (via analysisWindow) for the leakage-free measurement
// windows the test legs probe.
function renderFM(fc, fm, beta, sampleRate, N){
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const t = i / sampleRate;
    out[i] = fmSample(fc, fm, beta, t);
  }
  return out;
}

// a self-contained single-bin DFT: the DFT-bin magnitude of `samples` at frequency
// `freq`, normalised by N so a cosine of amplitude c reads c/2. A DIRECT correlation
// against cos/sin at `freq` — not the recursive Goertzel, whose error grows over N
// samples; the direct sum keeps the analytic identities exact to <1e-9 even over a
// long window. The test feeds it renderFM(...) to MEASURE each comb tooth and
// confront it with |Jₙ(β)|/2.
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

// THE LEAKAGE-FREE WINDOW: with an INTEGER carrier:modulator ratio (FM = FC/16, so
// fc = 16·fm), every comb tooth fc + n·fm is an integer multiple of fm. Render
// exactly `periods` periods of fm with `spp` samples per fm-period — then the
// effective sample rate SR = spp·fm puts every tooth on an EXACT DFT bin (bin =
// its fm-multiple × periods), so the single-bin DFT reads |Jₙ(β)|/2 to machine
// epsilon, with no window roundoff from a non-commensurate sample rate. Returns
// { SR, N }. (The carrier itself is the 16·periods-th bin.)
function analysisWindow(fm, spp = 512, periods = 64){
  const SR = spp * fm;       // samples per second = samples-per-fm-period × fm-periods-per-second
  const N = spp * periods;   // total samples = one fm-period's worth × the number of periods
  return { SR, N };
}

// ── runSidebandSelfTest(fc, fm, beta) — the SOLE ORACLE. Same shape as the sibling
// leaves: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the
// Node twin both call THIS, so they cannot disagree. fc/fm are the carrier and
// modulator; beta is the depth. Five legs prove the FM comb is a real, exact
// |Jₙ(β)| spectrum, that energy is conserved, that the carrier nulls at the first
// J₀ zero, and that β=0 is a lone pure carrier.
function runSidebandSelfTest(fc, fm, beta){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // an INDEPENDENT Bessel by the power series Jₙ(x) = Σ_m (−1)^m /(m!(m+n)!)·(x/2)^(2m+n)
  // — a second method (not the recurrence) so LEG 1 is a true confrontation, not a
  // restatement. Defined inside the oracle so the slice stays self-contained.
  function besselSeries(n, x){
    const h = x / 2;
    let term = Math.pow(h, n);
    for (let k = 2; k <= n; k++) term /= k;          // term₀ = hⁿ/n!
    let sum = term; const h2 = h * h;
    for (let m = 1; m < 200; m++){
      term *= -h2 / (m * (m + n));
      sum += term;
      if (Math.abs(term) < 1e-18 * (Math.abs(sum) + 1e-300)) break;
    }
    return sum;
  }

  // LEG 1 — THE COMB IS THE BESSEL LADDER (second-method confrontation): combAmps
  //   from the downward recurrence equals |besselSeries(n,β)| over an (n ≤ 16, β ∈
  //   [0.5,12]) grid to <1e-9. Two disjoint algorithms agree — the sideband heights
  //   really ARE the Bessel functions, not a fit.
  {
    let ok = true, worst = 0, worstAt = null;
    for (let b = 0.5; b <= 12.0001; b += 0.5){
      const amps = combAmps(b, 16);
      for (let n = 0; n <= 16; n++){
        const ref = Math.abs(besselSeries(n, b));
        const d = Math.abs(amps[n] - ref);
        if (d > worst){ worst = d; worstAt = { n, b: Math.round(b * 10) / 10 }; }
        if (d >= 1e-9) ok = false;
      }
    }
    T('LEG 1 — the comb IS the Bessel ladder: combAmps (Miller downward recurrence) equals the INDEPENDENT power-series |Jₙ(β)| over an (n ≤ 16, β ∈ [0.5,12]) grid to <1e-9 — two disjoint algorithms agree, the sideband heights really are Jₙ(β)',
      ok, ok ? `recurrence === series to <1e-9 across the grid (worst Δ ${worst.toExponential(2)} at n=${worstAt.n}, β=${worstAt.b})`
             : `mismatch (worst Δ ${worst.toExponential(2)} at n=${worstAt.n}, β=${worstAt.b})`);
  }

  // LEG 2 — ENERGY IS CONSERVED: Σₙ Jₙ(β)² = 1 for every β across [0,12] to <1e-9.
  //   FM redistributes energy among the rungs but never creates or destroys it; the
  //   total is always exactly one.
  {
    let ok = true, worst = 0, worstAt = null;
    for (let b = 0; b <= 12.0001; b += 0.5){
      const e = combEnergy(b, 60);
      const d = Math.abs(e - 1);
      if (d > worst){ worst = d; worstAt = Math.round(b * 10) / 10; }
      if (d >= 1e-9) ok = false;
    }
    T('LEG 2 — energy conserved: Σₙ Jₙ(β)² = 1 for every β across [0,12] to <1e-9 — FM only redistributes energy among the comb rungs, the total is always exactly one',
      ok, ok ? `Σ Jₙ² = 1 to <1e-9 across the sweep (worst |Σ−1| ${worst.toExponential(2)} at β=${worstAt})`
             : `energy off (worst |Σ−1| ${worst.toExponential(2)} at β=${worstAt})`);
  }

  // LEG 3 — THE CARRIER NULL is real: |J₀(J0_ZERO1)| < 1e-9 at the analytic first
  //   zero, AND the first three J₀ zeros located by bisection match the references
  //   to <1e-9. The carrier really does vanish at β ≈ 2.4048 — it is a zero of J₀,
  //   not a numerical accident.
  {
    const J0Z1 = 2.404825557695773;
    const atZero = Math.abs(besselJ(0, J0Z1));
    const J0 = x => besselJ(0, x);
    const findZero = (a, c) => {
      let fa = J0(a);
      for (let i = 0; i < 200; i++){
        const m = (a + c) / 2, fm0 = J0(m);
        if (fa * fm0 <= 0) c = m; else { a = m; fa = fm0; }
      }
      return (a + c) / 2;
    };
    const z1 = findZero(2.0, 3.0), z2 = findZero(5.0, 6.0), z3 = findZero(8.0, 9.0);
    const ref = [2.404825557695773, 5.520078110286311, 8.653727912911012];
    const dz = Math.max(Math.abs(z1 - ref[0]), Math.abs(z2 - ref[1]), Math.abs(z3 - ref[2]));
    const ok = atZero < 1e-9 && dz < 1e-9;
    T('LEG 3 — the carrier null is real: |J₀(2.4048255…)| < 1e-9 at the analytic first zero, and the first three J₀ zeros found by bisection match the references to <1e-9 — the carrier rung vanishes at a true zero of J₀',
      ok, `|J₀(z₁)| = ${atZero.toExponential(2)} (<1e-9) · located zeros [${z1.toFixed(9)}, ${z2.toFixed(9)}, ${z3.toFixed(9)}] vs refs, worst Δ ${dz.toExponential(2)}`);
  }

  // LEG 4 — THE HEARD COMB matches the math (band-independent): the DFT of the
  //   rendered FM signal reads |Jₙ(β)|/2 at the carrier and the first five upper
  //   sidebands to <1e-9, AND at β = J0_ZERO1 the carrier bin reads ~0 while the
  //   sidebands survive. analysisWindow pins every tooth on an exact bin, so this
  //   holds at ANY carrier band — the comb the ear gets is the comb the math draws.
  {
    const { SR, N } = analysisWindow(fm);
    const y = renderFM(fc, fm, beta, SR, N);
    let ok = true, worst = 0; const rows = [];
    for (let n = 0; n <= 5; n++){
      const measured = goertzelMag(y, sidebandFreq(fc, fm, n), SR);
      const want = sidebandAmp(n, beta) / 2;       // a cosine of amplitude |Jₙ| reads |Jₙ|/2
      const d = Math.abs(measured - want); worst = Math.max(worst, d);
      if (d >= 1e-9){ ok = false; rows.push(`n=${n} ${measured.toExponential(3)}≠${want.toExponential(3)}`); }
    }
    // the carrier-null render: at β = J0_ZERO1 the carrier bin is ~0 while a sideband lives
    const yNull = renderFM(fc, fm, J0_ZERO1, SR, N);
    const carrierNull = goertzelMag(yNull, fc, SR);
    const sideAlive = goertzelMag(yNull, sidebandFreq(fc, fm, 1), SR);
    const nullOK = carrierNull < 1e-9 && sideAlive > 0.01;
    ok = ok && nullOK;
    T('LEG 4 — the heard comb matches the math: the DFT of the rendered FM signal reads |Jₙ(β)|/2 at the carrier + first five sidebands to <1e-9, AND at β=2.4048 the carrier bin reads ~0 while the sidebands survive — band-independent (every tooth on an exact bin)',
      ok, ok ? `comb teeth match |Jₙ(β)|/2 (worst Δ ${worst.toExponential(2)}) · carrier-null bin ${carrierNull.toExponential(2)} (<1e-9) while sideband ${sideAlive.toFixed(4)} alive`
             : `${rows.join(', ')} · null carrier ${carrierNull.toExponential(2)} / sideband ${sideAlive.toFixed(4)}`);
  }

  // LEG 5 — THE NEGATIVE CONTROL, to a true zero: at β=0, J₀(0) === 1 EXACTLY and
  //   every Jₙ(0) for n≥1 is the literal 0 — not small, zero. The comb collapses to
  //   a lone pure carrier; remove the depth and there is nothing on either side.
  {
    const amps = combAmps(0, 8);
    const carrierOne = amps[0] === 1;
    let allZero = true; const vals = [];
    for (let n = 1; n <= 8; n++){ vals.push(amps[n]); if (amps[n] !== 0) allZero = false; }
    const ok = carrierOne && allZero;
    T('LEG 5 — the negative control: at β=0, J₀(0) === 1 exactly and every sideband Jₙ(0) (n≥1) is a TRUE 0 — the comb collapses to a lone pure carrier; the comb is the depth, remove it and there is silence on either side',
      ok, ok ? `J₀(0) === 1 (exact) · J₁..J₈(0) all === 0 [${vals.join(', ')}]`
             : `J₀(0)=${amps[0]} · sidebands [${vals.join(', ')}]`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== BESSEL CORE END =====

export {
  SEMI_FC, FC, FM, BETA, J0_ZERO1,
  besselJarray, besselJ, sidebandAmp, sidebandFreq, combAmps, carrierAmp, combEnergy,
  fmSample, renderFM, goertzelMag, analysisWindow, runSidebandSelfTest,
  semiToFreq,
};
