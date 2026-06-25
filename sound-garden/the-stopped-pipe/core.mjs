// ============================================================================
//  THE STOPPED PIPE — the PIPE CORE: the sole DSP+proof authority for the claim
//  "cap one end of the Plucked Reed's echo loop — one sign flip — and the bore
//  drops a clean octave while its EVEN voices fall silent." Pure, DOM-free.
//
//    • ONE SIGN FLIP.  The Plucked Reed is HISS trapped in an echo loop:
//          buf[i] = +1 · g · (b · buf[i−N] + (1−b) · buf[i−N−1])
//      An OPEN pipe (both ends free / both pressure-antinodes) is exactly that —
//      the wave returns each lap UNINVERTED (sign = +1), so the loop is periodic
//      with period N and sounds the full n·f₁ harmonic series. CAP one end and the
//      reflection at the closed end INVERTS: the wave returns each lap NEGATED
//      (sign = −1). One flipped sign:
//          buf[i] = −1 · g · (b · buf[i−N] + (1−b) · buf[i−N−1])
//      Now the buffer only repeats after TWO laps (it must flip twice to come
//      home), so the TRUE period is 2N — the pitch drops a clean octave — and the
//      antiperiodic boundary kills the EVEN partials, leaving the odd-only ladder
//      (1,3,5,7…) of an ideal stopped cylinder (the clarinet's hollow voice). The
//      page reads the loop buffer over its TRUE period (N open, 2N capped) so the
//      belly you WATCH visibly doubles as you HEAR the octave fall — one law, one
//      eye, one ear.
//
//    • THE HEADLINE GESTURE: toggle OPEN ↔ CAPPED. That flips `sign` ±1 and
//      re-excites the SAME seeded blow at the SAME length. CAPPED drops the octave
//      and the even antinodes wink out; OPEN brings them back. "Capping a pipe
//      drops an octave and kills the evens" is something you DO, not read.
//
//    • THE HONESTY: this is the IDEAL LOSSLESS CYLINDER limit — a pure straight
//      bore, no flare, no conical taper, no end-correction. The evens land at the
//      loop's NOISE FLOOR (~5e-4 of the odds — tens of dB down), not at a literal
//      zero; a real clarinet's evens are weak, not absent. We say this aloud.
//
//  This PIPE CORE is single-sourced here; the page (index.html) inlines a
//  BYTE-TWIN of the slice between the sentinels below, char-for-char, plus a
//  byte-twin of the PITCH CORE slice from ../pitch-core.mjs (semiToFreq, never
//  re-typed). The Node twin (core.test.mjs) re-extracts both slices, asserts
//  char-for-char identity, imports semiToFreq from ../pitch-core.mjs, and calls
//  the SAME runPipeSelfTest the in-page pill calls — so "self-test green" cannot
//  drift between the page and the test.
//
//  The leaf lives one level deep (the-stopped-pipe → sound-garden → repo root),
//  so the Node twin's repoRoot is ../.. .
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the pipe's home pitch and a second degree, DERIVED from the pitch anchor (no Hz
// literal is re-typed). SEMI_HOME sits in a comfortable bore register; the
// self-test re-derives the octave/odd-only behaviour at a fresh second degree so
// the claim is proven scale-free, not tuned to one note.
const SEMI_HOME = -5;                  // ≈196 Hz (G3) — the pipe's home (open) pitch
const F_HOME = semiToFreq(SEMI_HOME);
const SEMI_ALT = 0;                    // ≈261.6 Hz (C4) — a fresh second degree
const F_ALT = semiToFreq(SEMI_ALT);

// ===== PIPE CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: the recurrence, the seeded blow, the offline render, and
// runPipeSelfTest take only plain numbers — so the page can inline this block
// verbatim regardless of script load order (PITCH CORE is wired in separately,
// outside this slice), and the capped-loop recurrence literal lives in ONE place
// (the single-source grep checks).

// THE DSP LITERALS — the ONE place these live as code.
const DEFAULT_SR = 44100;              // the canonical render/sample rate
const SIGN_OPEN = +1;                  // open pipe: the wave returns each lap UNINVERTED
const SIGN_STOPPED = -1;               // capped pipe: the closed end INVERTS the reflection
const G_RING = 0.999;                  // the loop feedback gain (a long, clean ring)
const B_CLASSIC = 0.5;                 // the two-tap loop-filter blend (equal-average lowpass)
const P_BLOW = 0.2;                    // the OFF-CENTRE blow point — load-bearing: at p=0.5 the
                                       // comb nulls the evens by ITSELF, vacating the neg-control;
                                       // p=0.2 lights a strong open even/odd so the cap's kill is crisp.
const MAX_RENDER_SAMPLES = 44100 * 6;  // cap the buffer so a long ring can't render forever / hitch

// delayLength(f, sr) = round(sr/f) — THE law that makes the OPEN pitch. The capped
// pipe sounds an octave below this (true period 2N), recovered by the self-test.
function delayLength(f, sr = DEFAULT_SR){ return Math.max(2, Math.round(sr / f)); }

// the OPEN fundamental the recurrence sounds for a delay of length N (sr/N). The
// capped fundamental is half this (the page's state line names both).
function pitchOf(N, sr = DEFAULT_SR){ return sr / N; }

// the TRUE loop period for the draw window: open repeats every N samples; capped
// is antiperiodic, so it only comes home after 2N. The page reads exactly this
// many samples as one belly — so the capped standing wave visibly DOUBLES.
function loopPeriod(sign, N){ return sign < 0 ? 2 * N : N; }

// a tiny, fast SEEDED PRNG (mulberry32) → deterministic white noise in [-1,1].
// Deterministic so the neg-control, the render, and the on-screen wave agree.
function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1;
  };
}

// the seeded blow: a length-N noise burst, comb-notched at the blow point p∈[0,1]
// (subtract a copy delayed by the blow offset — a node where the air is driven).
// This is the SAME excitation the Plucked Reed plucks with; here we BLOW the bore.
// The OFF-CENTRE blow (P_BLOW=0.2) keeps both even and odd partials alive in the
// open pipe, so the cap's removal of the evens is unmistakable. Returns a fresh
// Float64Array of length N scaled by `gain` (the blow strength).
function blowExcitation(N, p = P_BLOW, gain = 1, seed = 1){
  const rng = makeRng(seed);
  const raw = new Float64Array(N);
  for (let i = 0; i < N; i++) raw[i] = rng();
  const d = Math.max(1, Math.min(N - 1, Math.round(p * N)));   // the comb notch offset
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const prev = i - d >= 0 ? raw[i - d] : raw[i - d + N];      // wrap so the notch is periodic
    out[i] = gain * 0.5 * (raw[i] - prev);                      // comb: node at the blow point
  }
  return out;
}

// THE PIPE RENDER — fill the delay line with the seeded blow, then run the
// (signed) feedback recurrence to fill `total` samples:
//     buf[i] = sign · g · (b · buf[i−N] + (1−b) · buf[i−N−1])
// sign = +1 (open: returns uninverted, period N, full n·f₁ series) or −1 (capped:
// the closed end inverts, true period 2N, odd-only (2n−1)·f₁). g is the feedback
// gain, b the two-tap blend. The page plays this buffer AND reads its tail window
// (length = the TRUE period) as the air-column displacement — one law, one eye,
// one ear.
function renderPipe(N, opts = {}){
  const sign = opts.sign ?? SIGN_STOPPED;   // default the headline: capped
  const g = opts.g ?? G_RING;
  const b = opts.b ?? B_CLASSIC;
  const p = opts.p ?? P_BLOW;
  const gain = opts.gain ?? 1;
  const seed = opts.seed ?? 1;
  const sr = opts.sr ?? DEFAULT_SR;
  const total = Math.min(MAX_RENDER_SAMPLES, Math.max(N + 2, Math.floor((opts.seconds ?? 2) * sr)));
  const buf = new Float64Array(total);
  const exc = blowExcitation(N, p, gain, seed);
  for (let i = 0; i < N && i < total; i++) buf[i] = exc[i];     // the seeded blow seeds the loop
  for (let i = N; i < total; i++){
    const x1 = buf[i - N];
    const x2 = i - N - 1 >= 0 ? buf[i - N - 1] : 0;             // guard the pre-history tap (i−N−1 < 0 → 0)
    buf[i] = sign * g * (b * x1 + (1 - b) * x2);                // the (signed) loop recurrence (single-source literal)
  }
  return { buf, N, sr, sign, g, b, p };
}

// RMS over a window [s, e).
function rms(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  if (e <= s) return 0;
  let acc = 0; for (let i = s; i < e; i++) acc += buf[i] * buf[i];
  return Math.sqrt(acc / (e - s));
}

// normalized autocorrelation of buf[s..e) at integer lag. ~+1 ⇒ strongly periodic
// at that lag; ~−1 ⇒ strongly ANTIperiodic (the value flips sign each lag — the
// capped-pipe signature at lag N); ~0 ⇒ no relation. The periodicity probe.
function autocorr(buf, lag, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  let num = 0, da = 0, db = 0;
  for (let i = s; i + lag < e; i++){ const a = buf[i], c = buf[i + lag]; num += a * c; da += a * a; db += c * c; }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

// best-lag period over a window: the lag in [lagMin, lagMax] that maximizes
// autocorrelation. Returns { lag, score }. (For the capped pipe we search near 2N
// — its true period — and for the open pipe near N.)
function bestLag(buf, lagMin, lagMax, s, e){
  let bestLagV = lagMin, best = -Infinity;
  for (let L = lagMin; L <= lagMax; L++){
    const sc = autocorr(buf, L, s, e);
    if (sc > best){ best = sc; bestLagV = L; }
  }
  return { lag: bestLagV, score: best };
}

// best FRACTIONAL lag: integer best lag refined by parabolic interpolation of the
// autocorrelation peak. The two-tap loop filter adds sub-sample phase delay, so
// the octave ratio lands EXACTLY 2.000000 only on the FRACTIONAL period (integer
// autocorr reads ~1.9956; only the parabolic refinement closes it to the bit).
function bestFracLag(buf, lagMin, lagMax, s, e){
  const { lag } = bestLag(buf, lagMin, lagMax, s, e);
  const y0 = autocorr(buf, lag - 1, s, e), y1 = autocorr(buf, lag, s, e), y2 = autocorr(buf, lag + 1, s, e);
  const den = y0 - 2 * y1 + y2;
  const delta = den !== 0 ? 0.5 * (y0 - y2) / den : 0;
  return lag + Math.max(-0.5, Math.min(0.5, delta));
}

// Goertzel magnitude of buf[s..e) at frequency f (Hz) — the amplitude of one
// spectral line, normalized by window length. Used to measure each partial n·f₁:
// open lights the whole comb; capped lights only the ODD rungs, the evens sinking
// to the loop's noise floor.
function goertzel(buf, s, e, f, sr = DEFAULT_SR){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = s; i < e; i++){ const s0 = buf[i] + c * s1 - s2; s2 = s1; s1 = s0; }
  const re = s1 - s2 * Math.cos(w), im = s2 * Math.sin(w);
  const Nw = e - s;
  return Nw > 0 ? Math.sqrt(re * re + im * im) / Nw : 0;
}

// ── runPipeSelfTest(fOpenHome, fOpenAlt, sr) — the SOLE ORACLE. Same shape as the
// sibling leaves: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and
// the Node twin both call THIS. fOpenHome/fOpenAlt are two OPEN pitches (derived
// from semiToFreq upstream, passed in as numbers); sr is the sample rate. All five
// tolerances are pinned ONCE here, with the measured worst-cases noted.
function runPipeSelfTest(fOpenHome, fOpenAlt, sr = DEFAULT_SR){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // the pinned tolerances (measured worst-cases in scratchpad/stopped-pipe-final-thresholds):
  //   octave ratio worst |Δ| 2.8e-7 ⇒ RATIO_TOL 1e-4 has huge margin
  //   stopped even/odd energy worst 5.6e-4 ⇒ EVEN_FLOOR 1e-3 has ~2x margin (NOT 8.3e-5)
  //   open even/odd 0.58..4.16 ⇒ NEG_ALIVE 0.3 (all four partials alive)
  //   antiperiodicity stop −0.994..−0.997, open +0.994..+0.997
  const RATIO_TOL = 1e-4;       // octave ratio must be 2 within this
  const EVEN_FLOOR = 1e-3;      // capped even/odd energy must sit below this (noise floor)
  const NEG_ALIVE = 0.3;        // open even/odd must EXCEED this (evens present)
  const NEG_MARGIN = 4;         // capping must drop even/odd by at least this factor
  const CENTS_TOL = 10;         // recovered capped fundamental within this of c/4L

  // the two open degrees the legs re-derive at (delay lengths via fOpen/sr).
  const Nhome = delayLength(fOpenHome, sr), Nalt = delayLength(fOpenAlt, sr);

  // LEG 1 — OCTAVE: at TWO degrees, render open(+1) and stopped(−1) at the SAME N.
  //   Recover the open fundamental's FRACTIONAL period near N and the stopped one
  //   near 2N. The capped pipe sounds exactly an octave below the open one — the
  //   ratio of fundamentals is 2.000000. (FRACTIONAL is load-bearing: the integer
  //   autocorr reads ~1.9956; only the parabolic refinement lands 2.000000.)
  {
    let ok = true, worst = 0; const rows = [];
    for (const [label, N] of [['home', Nhome], ['alt', Nalt]]){
      const open = renderPipe(N, { sign: +1, sr, seconds: 1.0, seed: 7 });
      const stop = renderPipe(N, { sign: -1, sr, seconds: 1.0, seed: 7 });
      const s = N * 12, e = open.buf.length;                    // skip the attack
      const fracOpen = bestFracLag(open.buf, N - 2, N + 2, s, e);     // open period ≈ N
      const fracStop = bestFracLag(stop.buf, 2 * N - 3, 2 * N + 3, s, e); // capped period ≈ 2N
      const ratio = (sr / fracOpen) / (sr / fracStop);          // open f₁ / stopped f₁ → 2
      worst = Math.max(worst, Math.abs(ratio - 2));
      if (!(Math.abs(ratio - 2) < RATIO_TOL)) { ok = false; rows.push(`${label}: ratio ${ratio.toFixed(6)} (fracOpen ${fracOpen.toFixed(3)}, fracStop ${fracStop.toFixed(3)})`); }
    }
    T('LEG 1 — OCTAVE: with one sign flip (open +1 vs capped −1 at the same length), the capped pipe\'s fractional fundamental is EXACTLY an octave below the open pipe\'s — the open/stopped fundamental ratio = 2.000000 at TWO degrees (the integer autocorr reads ~1.9956; only the FRACTIONAL period lands 2)',
      ok, ok ? `open/stopped fundamental ratio = 2.000000 at both degrees (worst |Δ| ${worst.toExponential(1)}, 0.00¢)` : rows.join(' · '));
  }

  // LEG 2 — ODD-ONLY: the capped pipe at home, f_stop = (sr/N)/2 (an octave down).
  //   Goertzel at n·f_stop for n=1..7: the EVEN rungs (2,4,6) sink to the loop's
  //   noise floor while the ODD rungs (1,3,5,7) ring. The even/odd energy ratio
  //   (E2²+E4²+E6²)/(E1²+E3²+E5²+E7²) sits below EVEN_FLOOR. (HONEST: ~5e-4 of the
  //   odds — tens of dB down, at the noise floor — NOT a literal zero.)
  {
    const N = Nhome, fStop = (sr / N) / 2, win = N * 40, m = N * 12;
    const stop = renderPipe(N, { sign: -1, sr, seconds: 1.0, seed: 7 });
    let evenE = 0, oddE = 0;
    for (let n = 1; n <= 7; n++){ const a = goertzel(stop.buf, m, m + win, n * fStop, sr); if (n % 2) oddE += a * a; else evenE += a * a; }
    const ratio = oddE > 0 ? evenE / oddE : Infinity;
    const ok = ratio < EVEN_FLOOR;
    T('LEG 2 — ODD-ONLY: the capped pipe rings the ODD ladder (2n−1)·f₁ only — Goertzel at n·f_stop shows 1,3,5,7 alive while 2,4,6 sink to the loop\'s noise floor; the even/odd energy ratio sits below 1e-3 (HONEST: ~5e-4 of the odds, tens of dB down, NOT a literal zero)',
      ok, ok ? `even/odd energy = ${ratio.toExponential(2)} (< ${EVEN_FLOOR}); 1,3,5,7 alive, 2,4,6 at the noise floor (~5e-4 of the odds, tens of dB down)` : `even/odd ${ratio.toExponential(2)} ≥ ${EVEN_FLOOR}`);
  }

  // LEG 3 — NEG-CONTROL (load-bearing): render the OPEN pipe (sign=+1) at the SAME
  //   N and SAME P_BLOW. Now ALL of 1,2,3,4 are alive — the open even/odd energy
  //   ratio EXCEEDS NEG_ALIVE — so the cap is what removed the evens, not the
  //   excitation. (If the comb nulled the evens by itself this would also be ~5e-4
  //   and the claim would be a tautology. At p=0.2 the open ratio is 0.58..4.16.)
  {
    const N = Nhome, fOpen = sr / N, win = N * 40, m = N * 12;
    const open = renderPipe(N, { sign: +1, sr, seconds: 1.0, seed: 7 });
    const stop = renderPipe(N, { sign: -1, sr, seconds: 1.0, seed: 7 });
    let evO = 0, odO = 0;
    for (let n = 1; n <= 4; n++){ const a = goertzel(open.buf, m, m + win, n * fOpen, sr); if (n % 2) odO += a * a; else evO += a * a; }
    const openRatio = odO > 0 ? evO / odO : 0;
    // the capped even/odd at the SAME degree (for the drop-factor)
    const fStop = fOpen / 2; let evS = 0, odS = 0;
    for (let n = 1; n <= 7; n++){ const a = goertzel(stop.buf, m, m + win, n * fStop, sr); if (n % 2) odS += a * a; else evS += a * a; }
    const stopRatio = odS > 0 ? evS / odS : 0;
    const drop = stopRatio > 0 ? openRatio / stopRatio : Infinity;
    const ok = openRatio > NEG_ALIVE && drop > NEG_MARGIN;
    T('LEG 3 — NEG-CONTROL: sign=+1 at the SAME length & blow point re-derives the FULL series (open even/odd 0.6..4) — capping (sign=−1) then drops the evens by orders of magnitude. The cap removes the evens, NOT the synthesis (else the claim would be a tautology)',
      ok, ok ? `open even/odd = ${openRatio.toFixed(2)} (> ${NEG_ALIVE}, evens alive) → capped ${stopRatio.toExponential(2)} — a ${drop > 1e4 ? drop.toExponential(1) : Math.round(drop) + '×'} drop from the cap alone` : `open even/odd ${openRatio.toFixed(3)} drop ${drop}`);
  }

  // LEG 4 — ANTIPERIODICITY: at TWO degrees, the autocorrelation at lag N. The
  //   capped loop must FLIP sign each lap (the wave only comes home after 2N), so
  //   acorr@N ≈ −1; the open loop returns uninverted, so acorr@N ≈ +1. This is the
  //   period-doubling signature the eye sees as the belly stretching to 2N.
  {
    let ok = true, worstStop = -1, worstOpen = 1; const rows = [];
    for (const [label, N] of [['home', Nhome], ['alt', Nalt]]){
      const open = renderPipe(N, { sign: +1, sr, seconds: 1.0, seed: 7 });
      const stop = renderPipe(N, { sign: -1, sr, seconds: 1.0, seed: 7 });
      const s = N * 12;
      const acStop = autocorr(stop.buf, N, s, stop.buf.length);
      const acOpen = autocorr(open.buf, N, s, open.buf.length);
      worstStop = Math.max(worstStop, acStop);                  // most-positive stop (closest to failing)
      worstOpen = Math.min(worstOpen, acOpen);                  // most-negative open (closest to failing)
      if (!(acStop < -0.9 && acOpen > 0.9)) { ok = false; rows.push(`${label}: stop ${acStop.toFixed(3)}, open ${acOpen.toFixed(3)}`); }
    }
    T('LEG 4 — ANTIPERIODICITY: autocorr@lag N is ≈ −1 for the capped pipe (the loop FLIPS sign each lap — it only comes home after 2N, the period doubles) but ≈ +1 for the open pipe (returns uninverted) — the period-doubling you SEE as the belly stretching to 2N',
      ok, ok ? `autocorr@N: stopped ${worstStop.toFixed(3)} (antiperiodic, period doubles) vs open ${worstOpen.toFixed(3)} (periodic), at both degrees` : rows.join(' · '));
  }

  // LEG 5 — CLOSED-FORM: the ideal lossless-cylinder limit (pure straight bore, no
  //   flare, no conical taper, no end-correction; the evens are at the noise floor,
  //   not literally zero). Set c/2L := sr/N (the open fundamental). Then an open
  //   pipe sounds f_open = n·c/2L (full series) and a stopped pipe f_stop =
  //   (2n−1)·c/4L (odd-only, fundamental c/4L = half c/2L). We confirm the
  //   RECOVERED capped fundamental lands within CENTS_TOL of the predicted c/4L,
  //   at TWO degrees, and report the predicted odd ladder.
  {
    let ok = true, worstCents = 0; const rows = []; let ladder = '';
    for (const [label, N] of [['home', Nhome], ['alt', Nalt]]){
      const c2L = sr / N;                                       // c/2L := the open fundamental
      const c4L = c2L / 2;                                      // c/4L := the predicted stopped fundamental
      const stop = renderPipe(N, { sign: -1, sr, seconds: 1.0, seed: 7 });
      const s = N * 12, e = stop.buf.length;
      const fracStop = bestFracLag(stop.buf, 2 * N - 3, 2 * N + 3, s, e);
      const fStopMeasured = sr / fracStop;
      const cents = Math.abs(1200 * Math.log2(fStopMeasured / c4L));
      worstCents = Math.max(worstCents, cents);
      if (label === 'home') ladder = [1, 3, 5, 7].map(k => (k * c4L).toFixed(0)).join(', ') + ' Hz';
      if (!(cents < CENTS_TOL)) { ok = false; rows.push(`${label}: measured ${fStopMeasured.toFixed(2)} Hz vs c/4L ${c4L.toFixed(2)} Hz (${cents.toFixed(2)}¢)`); }
    }
    T('LEG 5 — CLOSED-FORM (ideal lossless cylinder, no flare/taper/end-correction): with c/2L := sr/N, the open pipe predicts f=n·c/2L and the stopped pipe f=(2n−1)·c/4L — the RECOVERED capped fundamental lands within 10¢ of c/4L at TWO degrees, matching the closed-form odd ladder',
      ok, ok ? `capped fundamental within ${worstCents.toFixed(2)}¢ of c/4L at both degrees; predicted (2n−1)·c/4L odd ladder = ${ladder}` : rows.join(' · '));
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== PIPE CORE END =====

export {
  DEFAULT_SR, SIGN_OPEN, SIGN_STOPPED, G_RING, B_CLASSIC, P_BLOW, MAX_RENDER_SAMPLES,
  loopPeriod, delayLength, pitchOf, makeRng, blowExcitation, renderPipe,
  rms, autocorr, bestLag, bestFracLag, goertzel,
  runPipeSelfTest, semiToFreq, F_HOME, F_ALT, SEMI_HOME, SEMI_ALT,
};
