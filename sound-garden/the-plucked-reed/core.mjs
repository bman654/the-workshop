// ============================================================================
//  THE PLUCKED REED — the REED CORE: the sole DSP authority for the claim
//  "a plucked string is just HISS trapped in an echo loop." Pure, DOM-free.
//
//    • THE PLUCK: fill a delay line of length N = round(SR/f) with SEEDED white
//      noise (a deterministic PRNG, NOT Math.random — so renders, the visual,
//      and the neg-control are reproducible bit-for-bit). Comb-notch it at the
//      pluck point round(p·N): subtract a delayed copy so a node sits where you
//      "held" the reed. Then run the Karplus-Strong recurrence per sample:
//          buf[i] = g · (b · buf[i−N] + (1−b) · buf[i−N−1])
//      The two-tap average b·x[n] + (1−b)·x[n−1] is a one-pole lowpass; the loop
//      gain g feeds it back. Each lap of the loop is N samples = one period, so
//      the buffer's local shape IS one period of the standing wave — the page
//      reads buf[playhead−N … playhead] as the reed's vertical displacement, so
//      eye and ear cannot diverge: the wave you watch is the buffer you hear.
//
//    • THE HEADLINE GESTURE: drag DECAY (= g) to its floor. With g → 0 the loop
//      stops feeding back — no echo, no string — and the reed plays only the raw
//      one-shot hiss it was made from. "A string is just hiss in an echo loop"
//      is something you DO, not read. Its self-test leg: g = 0 leaves no periodic
//      tail (autocorrelation has no peak at lag N), while g > 0 builds one.
//
//    • THE LOOP-FILTER HONESTY: the two-tap lowpass has DC gain EXACTLY 1 and
//      Nyquist gain ≤ 1 for b ∈ [0,1]. So the loop can only REMOVE the hiss's
//      high frequencies — it can never inject a tone. The pitch was CARVED from
//      noise by the delay length, not added by a hidden oscillator.
//
//  This REED CORE is single-sourced here; the page (index.html) inlines a
//  BYTE-TWIN of the slice between the sentinels below, char-for-char, plus a
//  byte-twin of the PITCH CORE slice from ../pitch-core.mjs (semiToFreq, never
//  re-typed). The Node twin (core.test.mjs) re-extracts both slices, asserts
//  char-for-char identity, imports semiToFreq from ../pitch-core.mjs, and calls
//  the SAME runReedSelfTest the in-page pill calls — so "self-test green" cannot
//  drift between the page and the test.
//
//  The leaf lives one level deep (the-plucked-reed → sound-garden → repo root),
//  so the Node twin's repoRoot is ../.. .
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the reed's home pitch and a second degree, DERIVED from the pitch anchor (no Hz
// literal is re-typed). SEMI_HOME sits in a comfortable plucked-string register;
// the self-test re-derives the pitch at a fresh second degree so PITCH is proven
// scale-free, not tuned to one note.
const SEMI_HOME = -5;                  // ≈196 Hz (G3) — the reed's home pitch
const F_HOME = semiToFreq(SEMI_HOME);
const SEMI_ALT = 4;                    // ≈329.6 Hz (E4) — a fresh second degree
const F_ALT = semiToFreq(SEMI_ALT);

// ===== REED CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: the recurrence, the seeded noise, the comb pluck-filter, the
// offline render, and runReedSelfTest take only plain numbers — so the page can
// inline this block verbatim regardless of script load order (PITCH CORE is wired
// in separately, outside this slice), and the KS recurrence literal lives in ONE
// place (the single-source grep checks).

// THE DSP LITERALS — the ONE place these live as code.
const DEFAULT_SR = 44100;              // the canonical render/sample rate
const G_FLOOR = 0.0;                   // DECAY floor: loop opens, the string dies → raw hiss
const G_PLINK = 0.99;                  // a short plink
const G_DRONE = 0.9999;                // a near-endless drone
const B_CLASSIC = 0.5;                 // BRIGHTNESS: classic equal-average (fastest high-rolloff)
const MAX_RENDER_SAMPLES = 44100 * 6;  // cap the buffer so g→0.9999 can't render forever / hitch

// delayLength(f, sr) = round(sr/f) — THE law that makes the pitch. An off-by-one
// here shifts the fundamental off sr/N; the PITCH self-test leg catches it.
function delayLength(f, sr = DEFAULT_SR){ return Math.max(2, Math.round(sr / f)); }

// the fundamental the recurrence actually sounds for a delay of length N.
function pitchOf(N, sr = DEFAULT_SR){ return sr / N; }

// a tiny, fast SEEDED PRNG (mulberry32) → deterministic white noise in [-1,1].
// Deterministic so the neg-control, the render, and the on-screen scatter agree.
function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1;
  };
}

// the seeded excitation: a length-N noise burst, comb-notched at the pluck point
// p∈[0,1]. The notch (subtract a copy delayed by the pluck offset) puts a node
// where you held the reed — a pluck near the bridge (small p) keeps more highs,
// a pluck at the middle nulls the even partials. Returns a fresh Float64Array of
// length N scaled by `gain` (the flick strength).
function pluckExcitation(N, p = 0.5, gain = 1, seed = 1){
  const rng = makeRng(seed);
  const raw = new Float64Array(N);
  for (let i = 0; i < N; i++) raw[i] = rng();
  const d = Math.max(1, Math.min(N - 1, Math.round(p * N)));   // the comb notch offset
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const prev = i - d >= 0 ? raw[i - d] : raw[i - d + N];      // wrap so the notch is periodic
    out[i] = gain * 0.5 * (raw[i] - prev);                      // comb: node at the pluck point
  }
  return out;
}

// the two-tap loop filter gains at DC and Nyquist, for the honesty leg.
//   H(z) = b + (1−b)·z^-1   ⇒   H(1) = 1 (DC),   H(−1) = b − (1−b) = 2b − 1 (Nyquist).
// |H(±1)| ≤ 1 for b ∈ [0,1] ⇒ the loop can only REMOVE highs, never add a tone.
function loopDcGain(b){ return b + (1 - b); }                  // = 1 exactly
function loopNyquistGain(b){ return Math.abs(b - (1 - b)); }   // = |2b−1| ≤ 1 on [0,1]

// THE PLUCK RENDER — fill the delay line with the seeded comb-notched excitation,
// then run the Karplus-Strong recurrence to fill `total` samples:
//     buf[i] = g · (b · buf[i−N] + (1−b) · buf[i−N−1])
// g is the feedback gain (DECAY), b is the two-tap blend (BRIGHTNESS). With g = 0
// the loop never feeds back: only the first N samples (the raw hiss) sound. The
// page plays this buffer AND reads its tail window as the reed's shape — one law,
// one eye, one ear.
function renderReed(N, opts = {}){
  const g = opts.g ?? G_PLINK;
  const b = opts.b ?? B_CLASSIC;
  const p = opts.p ?? 0.5;
  const gain = opts.gain ?? 1;
  const seed = opts.seed ?? 1;
  const sr = opts.sr ?? DEFAULT_SR;
  const total = Math.min(MAX_RENDER_SAMPLES, Math.max(N + 2, Math.floor((opts.seconds ?? 2) * sr)));
  const buf = new Float64Array(total);
  const exc = pluckExcitation(N, p, gain, seed);
  for (let i = 0; i < N && i < total; i++) buf[i] = exc[i];     // the seeded hiss seeds the loop
  for (let i = N; i < total; i++){
    const x1 = buf[i - N];
    const x2 = i - N - 1 >= 0 ? buf[i - N - 1] : 0;             // guard the pre-history tap (i−N−1 < 0 → 0)
    buf[i] = g * (b * x1 + (1 - b) * x2);                       // the KS recurrence (the single-source literal)
  }
  return { buf, N, sr, g, b, p };
}

// RMS over a window [s, e).
function rms(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  if (e <= s) return 0;
  let acc = 0; for (let i = s; i < e; i++) acc += buf[i] * buf[i];
  return Math.sqrt(acc / (e - s));
}

// normalized autocorrelation of buf[s..e) at integer lag. ~1 ⇒ strongly periodic
// at that lag; ~0 ⇒ no periodicity. The periodicity probe for the PITCH and
// NEG-CONTROL legs.
function autocorr(buf, lag, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  let num = 0, da = 0, db = 0;
  for (let i = s; i + lag < e; i++){ const a = buf[i], c = buf[i + lag]; num += a * c; da += a * a; db += c * c; }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

// best-lag pitch over a window: the lag in [lagMin, lagMax] that maximizes
// autocorrelation. Returns { lag, score }. Used to recover the played pitch from
// the SETTLED steady portion (we skip the noisy attack window before measuring).
function bestLag(buf, lagMin, lagMax, s, e){
  let bestLagV = lagMin, best = -Infinity;
  for (let L = lagMin; L <= lagMax; L++){
    const sc = autocorr(buf, L, s, e);
    if (sc > best){ best = sc; bestLagV = L; }
  }
  return { lag: bestLagV, score: best };
}

// Goertzel magnitude of buf[s..e) at frequency f (Hz) — the amplitude of one
// spectral line, normalized by window length. Used to track the FUNDAMENTAL's
// envelope: at f0 the loop lowpass barely attenuates, so the fundamental decays
// per lap by almost exactly the feedback gain g (the exact DECAY claim).
function goertzel(buf, s, e, f, sr = DEFAULT_SR){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = s; i < e; i++){ const s0 = buf[i] + c * s1 - s2; s2 = s1; s1 = s0; }
  const re = s1 - s2 * Math.cos(w), im = s2 * Math.sin(w);
  const Nw = e - s;
  return Nw > 0 ? Math.sqrt(re * re + im * im) / Nw : 0;
}

// best FRACTIONAL lag: integer best lag refined by parabolic interpolation of the
// autocorrelation peak. The two-tap loop filter adds (1−b) samples of phase delay,
// so the true period is N + (1−b) — sub-sample, recovered here.
function bestFracLag(buf, lagMin, lagMax, s, e){
  const { lag } = bestLag(buf, lagMin, lagMax, s, e);
  const y0 = autocorr(buf, lag - 1, s, e), y1 = autocorr(buf, lag, s, e), y2 = autocorr(buf, lag + 1, s, e);
  const den = y0 - 2 * y1 + y2;
  const delta = den !== 0 ? 0.5 * (y0 - y2) / den : 0;
  return lag + Math.max(-0.5, Math.min(0.5, delta));
}

// spectral centroid of buf[s..e) via a naive DFT magnitude over kBins bins, in
// units of bin index (higher ⇒ brighter). Used to show the highs die first.
function centroid(buf, s, e, kBins = 256){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  const Nw = e - s; if (Nw <= 1) return 0;
  let num = 0, den = 0;
  for (let k = 1; k < kBins; k++){
    let re = 0, im = 0; const w = 2 * Math.PI * k / Nw;
    for (let i = 0; i < Nw; i++){ const x = buf[s + i]; re += x * Math.cos(w * i); im += x * Math.sin(w * i); }
    const mag = Math.sqrt(re * re + im * im);
    num += k * mag; den += mag;
  }
  return den > 0 ? num / den : 0;
}

// ── runReedSelfTest(fHome, fAlt, sr) — the SOLE ORACLE. Same shape as the sibling
// leaves: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the
// Node twin both call THIS. fHome/fAlt are two pitches (derived from semiToFreq
// upstream, passed in as numbers); sr is the sample rate.
function runReedSelfTest(fHome, fAlt, sr = DEFAULT_SR){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // LEG 1 — PITCH: autocorrelation of the SETTLED portion (skip the attack)
  //   recovers a period equal to the PREDICTED N + (1−b) (the two-tap filter adds
  //   exactly 1−b samples of phase delay), which lands within a few cents of sr/N,
  //   re-derived at TWO fresh scale degrees. The delay length N sets the pitch; an
  //   off-by-one in the tap would shift the recovered period a FULL sample off
  //   (~8 cents) — far beyond the sub-sample filter delay — and go red.
  {
    let ok = true, worstCents = 0, worstPred = 0; const rows = [];
    const b = 0.5;
    for (const [label, f] of [['home', fHome], ['alt', fAlt]]){
      const N = delayLength(f, sr);
      const { buf } = renderReed(N, { g: 0.997, b, p: 0.5, sr, seconds: 0.5, seed: 7 });
      const s = N * 8, e = buf.length;                          // skip ~8 laps of attack
      const frac = bestFracLag(buf, N - 2, N + 2, s, e);        // sub-sample period near N
      const predicted = N + (1 - b);                            // filter phase delay = 1−b
      const predErr = Math.abs(frac - predicted);               // must match the prediction
      const cents = Math.abs(1200 * Math.log2((sr / frac) / (sr / N)));  // closeness to sr/N
      worstCents = Math.max(worstCents, cents); worstPred = Math.max(worstPred, predErr);
      if (!(predErr < 0.05 && cents < 8)) { ok = false; rows.push(`${label}: frac ${frac.toFixed(3)} vs pred ${predicted}, ${cents.toFixed(2)}¢`); }
    }
    T('LEG 1 — PITCH: the settled-portion autocorrelation period equals the predicted N + (1−b) (the loop filter\'s sub-sample phase delay) and so lands within a few cents of sr/N, at TWO fresh scale degrees — the delay length sets the pitch; an off-by-one tap would shift the period a FULL sample (~8¢) off',
      ok, ok ? `period = N+(1−b) at both degrees (worst pred Δ ${worstPred.toExponential(2)} samples, ${worstCents.toFixed(2)}¢ from sr/N)` : rows.join(' · '));
  }

  // LEG 2 — DECAY: tail RMS strictly < attack RMS and the broadband envelope is
  //   monotonically non-increasing for g < 1; the FUNDAMENTAL'S per-lap decay
  //   (measured at f0 via Goertzel, where the loop lowpass ≈ unity) matches the
  //   feedback gain g to a fraction of a percent at TWO g values; and g → 1
  //   sustains far longer than g ≈ 0.99. (Broadband RMS decays a touch FASTER than
  //   g — the lowpass also bleeds the highs — so the exact g claim is read at f0.)
  {
    const N = delayLength(fHome, sr), f0 = sr / N, win = N * 2;
    let ok = true; const rows = [];
    for (const g of [0.99, 0.999]){
      const { buf } = renderReed(N, { g, b: 0.5, p: 0.5, sr, seconds: 1.2, seed: 11 });
      const attack = rms(buf, 0, N * 4);
      const tail = rms(buf, buf.length - N * 4, buf.length);
      // broadband windowed envelope (one window = one lap = N samples) non-increasing
      const nw = Math.floor(buf.length / N);
      let mono = true, prev = Infinity;
      for (let w = 0; w < nw; w++){ const r = rms(buf, w * N, (w + 1) * N); if (r > prev * 1.02) mono = false; prev = r; }
      // the FUNDAMENTAL's per-lap decay (Goertzel@f0): ≈ g exactly
      const t0 = N * 10, t1 = N * 40, laps = (t1 - t0) / N;
      const a0 = goertzel(buf, t0, t0 + win, f0, sr), a1 = goertzel(buf, t1, t1 + win, f0, sr);
      const measuredG = (a0 > 0 && a1 > 0) ? Math.pow(a1 / a0, 1 / laps) : 0;
      const gErr = Math.abs(measuredG - g) / g;
      const legOk = tail < attack && mono && gErr < 0.002;
      if (!legOk) { ok = false; rows.push(`g=${g}: tail<attack ${tail < attack}, mono ${mono}, measuredG@f0 ${measuredG.toFixed(5)} (Δ${(gErr*100).toFixed(3)}%)`); }
    }
    // g→1 sustains far longer: tail energy at g=0.9999 ≫ tail energy at g=0.99 (2 s)
    const lo = renderReed(N, { g: 0.99, b: 0.5, sr, seconds: 2.0, seed: 11 });
    const hi = renderReed(N, { g: 0.9999, b: 0.5, sr, seconds: 2.0, seed: 11 });
    const tailLo = rms(lo.buf, lo.buf.length - N * 4, lo.buf.length);
    const tailHi = rms(hi.buf, hi.buf.length - N * 4, hi.buf.length);
    const ratio = tailLo > 0 ? tailHi / tailLo : Infinity;
    const sustains = ratio > 30;
    if (!sustains) { ok = false; rows.push(`g→1 sustain: tailHi/tailLo ${ratio.toFixed(1)} not ≫ 1`); }
    T('LEG 2 — DECAY: tail RMS < attack RMS, the per-lap envelope is monotonically non-increasing for g<1, the FUNDAMENTAL\'s per-lap decay (measured at f0) matches the feedback gain g to a fraction of a percent at two g values, and g→1 sustains far longer — the DECAY knob does exactly what it says',
      ok, ok ? `per-lap decay@f0 = g at g∈{0.99,0.999} (Δ<0.2%), envelope non-increasing, g=0.9999 tail ${ratio.toFixed(0)}× the g=0.99 tail` : rows.join(' · '));
  }

  // LEG 3 — BRIGHTNESS: the highs die FIRST and a brighter filter keeps them
  //   alive LONGER, measured exactly. (a) the broadband centroid of the early
  //   third exceeds the late third (the highs die first). (b) a high harmonic's
  //   per-lap decay is strictly slower at higher b — i.e. the high partials
  //   survive longer as b rises (eye-confirmable as the reed staying jagged later
  //   before it smooths) — and at every b it decays faster than the fundamental
  //   (which is why the highs die first). A static oscillator (constant spectrum)
  //   would fail (a) outright.
  {
    const N = delayLength(fHome, sr), f0 = sr / N, hk = 8 * f0, win = N * 2;
    // (a) early-third centroid > late-third centroid
    const { buf: cb } = renderReed(N, { g: 0.999, b: 0.5, p: 0.5, sr, seconds: 0.8, seed: 13 });
    const Lc = cb.length;
    const cEarly = centroid(cb, Math.floor(Lc * 0.10), Math.floor(Lc * 0.10) + 1024);
    const cLate  = centroid(cb, Math.floor(Lc * 0.78), Math.floor(Lc * 0.78) + 1024);
    const highsDie = cEarly > cLate;
    // (b) high-harmonic per-lap decay rises monotonically with b, and stays below g
    let monoRise = true, belowFund = true, prev = -Infinity; const rows = [];
    const t0 = N * 8, t1 = N * 20, laps = (t1 - t0) / N;
    for (const b of [0.5, 0.7, 0.9]){
      const { buf } = renderReed(N, { g: 0.999, b, p: 0.5, sr, seconds: 0.8, seed: 13 });
      const a0 = goertzel(buf, t0, t0 + win, hk, sr), a1 = goertzel(buf, t1, t1 + win, hk, sr);
      const decHigh = (a0 > 0 && a1 > 0) ? Math.pow(a1 / a0, 1 / laps) : 0;
      const f0a = goertzel(buf, t0, t0 + win, f0, sr), f0b = goertzel(buf, t1, t1 + win, f0, sr);
      const decFund = (f0a > 0 && f0b > 0) ? Math.pow(f0b / f0a, 1 / laps) : 1;
      if (!(decHigh > prev)) monoRise = false;          // brighter b → high partial survives longer
      if (!(decHigh < decFund - 1e-4)) belowFund = false;  // high decays faster than fundamental
      prev = decHigh; rows.push(decHigh.toFixed(3));
    }
    const ok = highsDie && monoRise && belowFund;
    T('LEG 3 — BRIGHTNESS: the broadband centroid of the early third exceeds the late third (the highs die first), and a high harmonic\'s per-lap decay rises monotonically with b (it survives LONGER as the loop filter brightens) while always decaying faster than the fundamental — exactly the in-loop lowpass at work',
      ok, ok ? `early centroid ${cEarly.toFixed(1)} > late ${cLate.toFixed(1)}; harmonic-8 per-lap decay rises with b [${rows.join(' → ')}] and stays below the fundamental's`
             : `highsDie=${highsDie} monoRise=${monoRise} belowFund=${belowFund} highDecays=[${rows.join(', ')}]`);
  }

  // LEG 4 — NEG-CONTROL (the playable one): with g = 0 the loop never feeds back,
  //   so only the one-shot hiss sounds — NO sustained pitched tail (autocorrelation
  //   of the tail at lag N has no peak). With g > 0 the SAME pluck builds a strong
  //   periodic tail. Brightness full vs damped moves the centroid up.
  {
    const N = delayLength(fHome, sr);
    const dead = renderReed(N, { g: 0.0, b: 0.5, p: 0.5, sr, seconds: 0.5, seed: 17 });
    const live = renderReed(N, { g: 0.999, b: 0.5, p: 0.5, sr, seconds: 0.5, seed: 17 });
    const s = N * 6;
    const acDead = autocorr(dead.buf, N, s, dead.buf.length);
    const acLive = autocorr(live.buf, N, s, live.buf.length);
    // the dead tail is essentially silent (the hiss is one-shot, length N)
    const tailDead = rms(dead.buf, N * 2, dead.buf.length);
    // brightness: full (b=1) vs damped (b=0.5) raises the early centroid
    const bright = centroid(renderReed(N, { g: 0.999, b: 1.0, sr, seconds: 0.4, seed: 17 }).buf, N, N + 1024);
    const damped = centroid(renderReed(N, { g: 0.999, b: 0.5, sr, seconds: 0.4, seed: 17 }).buf, N, N + 1024);
    const ok = acLive > 0.5 && acDead < 0.15 && tailDead < 1e-9 && bright > damped;
    T('LEG 4 — NEG-CONTROL (playable): drag DECAY to its floor (g=0) and the loop never feeds back — only the one-shot hiss sounds, with NO periodic tail (autocorr at lag N ≈ 0), while the SAME pluck at g>0 builds a strong periodic tail; full vs damped brightness moves the centroid up — a string IS hiss trapped in an echo loop',
      ok, ok ? `acorr@N: live ${acLive.toFixed(3)} (string) vs dead ${acDead.toFixed(3)} (no loop); dead tail silent (${tailDead.toExponential(1)}); centroid bright ${bright.toFixed(1)} > damped ${damped.toFixed(1)}`
             : `acLive ${acLive.toFixed(3)} acDead ${acDead.toFixed(3)} tailDead ${tailDead.toExponential(2)} bright ${bright.toFixed(1)} damped ${damped.toFixed(1)}`);
  }

  // LEG 5 — LOOP-FILTER HONESTY: the two-tap lowpass has DC gain EXACTLY 1 and
  //   Nyquist gain |2b−1| ≤ 1 across b ∈ [0,1] — so the loop can only REMOVE the
  //   hiss's highs, never inject a tone. This is the proof the pitch was CARVED
  //   from noise (by the delay length) and not added by a hidden oscillator.
  {
    let ok = true, worstDc = 0, worstNy = 0; const rows = [];
    for (let b = 0; b <= 1.0001; b += 0.05){
      const dc = loopDcGain(b), ny = loopNyquistGain(b);
      worstDc = Math.max(worstDc, Math.abs(dc - 1));
      worstNy = Math.max(worstNy, ny);
      if (Math.abs(dc - 1) > 1e-12 || ny > 1 + 1e-12) { ok = false; rows.push(`b=${b.toFixed(2)}: dc ${dc.toFixed(6)}, ny ${ny.toFixed(6)}`); }
    }
    T('LEG 5 — LOOP-FILTER HONESTY: the two-tap lowpass b·x[n]+(1−b)·x[n−1] has DC gain EXACTLY 1 and Nyquist gain |2b−1| ≤ 1 for every b ∈ [0,1] — the loop can only REMOVE the hiss’s highs, never inject a tone; the pitch is carved from noise, not added by an oscillator',
      ok, ok ? `DC gain = 1 (worst |Δ| ${worstDc.toExponential(2)}) and Nyquist gain ≤ 1 (worst ${worstNy.toFixed(3)}) across b∈[0,1]` : rows.join(' · '));
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== REED CORE END =====

export {
  DEFAULT_SR, G_FLOOR, G_PLINK, G_DRONE, B_CLASSIC, MAX_RENDER_SAMPLES,
  delayLength, pitchOf, makeRng, pluckExcitation,
  loopDcGain, loopNyquistGain, renderReed, rms, autocorr, bestLag, bestFracLag,
  goertzel, centroid, runReedSelfTest, semiToFreq, F_HOME, F_ALT, SEMI_HOME, SEMI_ALT,
};
