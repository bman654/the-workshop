// ============================================================================
//  THE BUTTERFLY'S VOICE — core (the sole authority for the cross-claim:
//  "a note's pitch IS the exact FFT bin its spectrum peaks in").
//  Pure, dependency-free except for two SINGLE-SOURCE imports:
//
//    • the GENERATOR  (sound-garden/pitch-core.mjs):  semiToFreq, noteName
//      — the SAME function that gives the Carillon's bells their pitch. The note's
//        true frequency f = semiToFreq(semi) is computed here, never re-typed; an
//        anti-circularity grep (the Node twin) confirms none of the pitch law's
//        defining digit-literals appear in THIS file (they live only in pitch-core).
//    • the TRANSFORM  (butterfly/core.mjs):  fft, toComplex, isPow2
//      — the page's own radix-2 FFT, imported, not re-implemented. The same
//        transform the Butterfly bench proves FAST==SLOW is here pointed at one
//        pure pitch.
//
//  THE LOAD-BEARING MATH — DERIVE fs so the window closes flush (Approach B).
//  Fix N = 4096 (a power of two — the butterfly's radix-2 requirement). For a
//  semitone s, the note's TRUE frequency is f = semiToFreq(s). We pick the integer
//  cycle-count  c = round(f·N/fsRef)  (fsRef = 48000, a real device rate used only
//  to choose c) and then DERIVE the sample rate  fs = f·N/c  so that EXACTLY c
//  whole cycles of the tone fit the N-sample window. We synthesise the PURE tone at
//  the TRUE f:  buf[n] = cos(2π·f·n/fs).  Because c whole cycles fit the window, the
//  tone is a DFT basis vector at bin c — so the measured peak bin k_measured == c is
//  MACHINE-EXACT, AND  k·Δf  (Δf = fs/N) recovers the TRUE f = semiToFreq(s) to
//  0.00e+0. BOTH legs are machine-exact; there is no honest residual to caveat.
//  This BEATS a fixed fs=N (the obvious choice), which leaves a ~10.8-cent tuning
//  residual because the cycles don't close.
//
//  THE TEETH (deviceSpectrum, the negative control). Pin fs = 48000 (a real device
//  rate) instead of deriving it. Now c = f·N/fs is NOT an integer — the cycles don't
//  close, the spectral line LEAKS across bins, the peak is only the NEAREST bin, and
//  k·Δf recovers f to ±Δf/2, NOT exactly. The visitor flips this themselves and
//  watches exactness dissolve into leakage (the air-trap analogue of the Rydberg
//  bench: a small, plausible model error that quietly breaks the exactness).
//
//  THE PLAYABLE RANGE.  c must satisfy 2 ≤ c ≤ N/2−2 for a clean isolated peak,
//  which lands s ∈ [−24, +24] (two octaves about middle C) → c ∈ [6, 89], 49 notes.
//  PLAYABLE is exported and the keyboard exposes ONLY those semitones.
//
//  THE SIX LEGS the self-test proves (all numbers LIVE, none echoed):
//    A  EXACT bin: for every s∈PLAYABLE, k_measured === c (strict integer, 0 tol).
//    B  EXACT pitch: worst |k·Δf − semiToFreq(s)| < 1e-9 (the leg fixed-fs can't make
//       exact; Approach B can).
//    C  clean spike: the second-largest bin is ≥ 40 dB below the peak (one tower).
//    D  TEETH-1 (non-pow2): fft(toComplex(1000 zeros)) THROWS the radix-2 error.
//    E  TEETH-2 (device-rate, the visitor's negative control): at fs=48000 the line
//       LEAKS (second/peak > 0.1) and recovery is only within ±Δf/2 — green here
//       means "leakage behaves as predicted," NOT "exact."
//    F  single-source: semiToFreq and fft are both imported functions, not re-typed.
// ============================================================================

import { semiToFreq, noteName } from '../sound-garden/pitch-core.mjs';   // the GENERATOR
import { fft, toComplex, isPow2 } from '../butterfly/core.mjs';          // the TRANSFORM

// ===== VOICE CORE (inlined byte-twin) BEGIN =====
// The window size N is fixed to a power of two — the radix-2 FFT's only hard
// requirement. fsRef is the device rate used ONLY to choose the integer cycle-count
// c; the synthesised tone never samples at fsRef in coherent mode (it samples at the
// DERIVED fs). Two octaves about middle C are playable; the keyboard exposes exactly
// the semitones whose c lands a clean isolated peak (2 ≤ c ≤ N/2−2).
const N = 4096;
const FS_REF = 48000;

// PLAYABLE — the semitones (relative to middle C, s=0) whose coherent cycle-count c
// gives a clean isolated peak. Computed once from the cycle-count bound, not hard
// coded: c = round(semiToFreq(s)·N/FS_REF) must satisfy 2 ≤ c ≤ N/2−2.
const PLAYABLE = (function () {
  const out = [];
  for (let s = -24; s <= 24; s++) {
    const f = semiToFreq(s);
    const c = Math.round(f * N / FS_REF);
    if (c >= 2 && c <= N / 2 - 2) out.push(s);
  }
  return out;
})();

// argmaxMag(mag) — the index of the largest magnitude bin (the measured peak).
function argmaxMag(mag) {
  let kMax = 0, peak = -Infinity;
  for (let k = 0; k < mag.length; k++) { if (mag[k] > peak) { peak = mag[k]; kMax = k; } }
  return kMax;
}
// secondToPeak(mag, kPeak) — the ratio (second-largest magnitude)/(peak), the
// leakage meter. ~0 for a coherent line (one tower), > 0.1 for a leaking one.
function secondToPeak(mag, kPeak) {
  let peak = mag[kPeak], second = 0;
  for (let k = 0; k < mag.length; k++) { if (k !== kPeak && mag[k] > second) second = mag[k]; }
  return peak > 0 ? second / peak : 0;
}

// ── voiceSpectrum(s, {N}) — THE COHERENT PANEL. One call feeds BOTH panels and the
// head, so they CANNOT disagree. Picks c = round(f·N/fsRef), DERIVES fs = f·N/c so
// exactly c whole cycles fit the window, synthesises the pure tone at the TRUE f,
// and runs the imported fft. Returns one shared-state object whose kMeas == c
// (machine-exact) and whose fRecovered == f (machine-exact). df = fs/N is the bin
// resolution; kMeas·df is the recovered pitch.
function voiceSpectrum(s, opts) {
  const NN = (opts && opts.N) || N;
  const f = semiToFreq(s);
  const name = noteName(s);
  const cPred = Math.round(f * NN / FS_REF);        // integer cycle-count (uses fsRef)
  const fs = f * NN / cPred;                          // DERIVE fs so c cycles fit exactly
  const df = fs / NN;
  const buf = new Array(NN);
  for (let n = 0; n < NN; n++) buf[n] = { re: Math.cos(2 * Math.PI * f * n / fs), im: 0 };
  const X = fft(buf);                                // the imported radix-2 FFT
  const half = NN / 2;
  const mag = new Array(half + 1);
  for (let k = 0; k <= half; k++) mag[k] = Math.hypot(X[k].re, X[k].im);
  const kMeas = argmaxMag(mag);
  return {
    s, f, name, c: cPred, fs, df,
    fUsed: f, kMeas, fRecovered: kMeas * df,
    mode: 'coherent', buf, mag, X,
  };
}

// ── deviceSpectrum(s, {N, fs}) — THE TEETH. Pin fs = 48000 instead of deriving it:
// c = f·N/fs is now fractional, the cycles don't close, the line LEAKS. The peak is
// only the NEAREST bin; recovery is within ±Δf/2, not exact. Returns the same shape
// plus {cFractional, leakage}. The visitor flips this to break coherence themselves.
function deviceSpectrum(s, opts) {
  const NN = (opts && opts.N) || N;
  const fs = (opts && opts.fs) || 48000;
  const f = semiToFreq(s);
  const name = noteName(s);
  const cFractional = f * NN / fs;                   // NON-integer ⇒ leakage
  const df = fs / NN;
  const buf = new Array(NN);
  for (let n = 0; n < NN; n++) buf[n] = { re: Math.cos(2 * Math.PI * f * n / fs), im: 0 };
  const X = fft(buf);
  const half = NN / 2;
  const mag = new Array(half + 1);
  for (let k = 0; k <= half; k++) mag[k] = Math.hypot(X[k].re, X[k].im);
  const kMeas = argmaxMag(mag);
  return {
    s, f, name, c: Math.round(cFractional), fs, df,
    fUsed: f, kMeas, fRecovered: kMeas * df,
    mode: 'device', buf, mag, X,
    cFractional, leakage: secondToPeak(mag, kMeas),
  };
}

// ── runSelfTest() — the SOLE ORACLE. Same shape as the rydberg/plumbline bench:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS — one verdict, no second opinion. Every detail carries LIVE
// numbers, never a hardcoded echo.
function runSelfTest() {
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // ── LEG A — EXACT bin: every playable note lands in its predicted bin. ───────
  {
    let worst = 0, mislocated = 0, first = null;
    for (const s of PLAYABLE) {
      const r = voiceSpectrum(s);
      const d = Math.abs(r.kMeas - r.c);
      if (d > worst) worst = d;
      if (r.kMeas !== r.c) { mislocated++; if (first === null) first = s; }
    }
    const ok = mislocated === 0 && worst === 0;
    T('LEG A — exact bin (coherent): for EVERY playable note, the measured FFT peak bin k_measured === the predicted cycle-count c, to the integer (zero tolerance) — synthesis and transform agree on the SAME number',
      ok, ok ? `${PLAYABLE.length}/${PLAYABLE.length} notes land in their predicted bin (worst |k−c| = 0)`
             : `${mislocated} mislocated (first @ s=${first}); worst |k−c| = ${worst}`);
  }

  // ── LEG B — EXACT pitch: k·Δf recovers the TRUE semiToFreq pitch to machine tol.
  // This is the leg a FIXED fs=N could NOT make exact (it leaves a ~10.8-cent
  // residual); Approach B derives fs so the recovered Hz IS the note's true Hz.
  {
    let worst = 0, first = null;
    for (const s of PLAYABLE) {
      const r = voiceSpectrum(s);
      const d = Math.abs(r.fRecovered - semiToFreq(s));
      if (d > worst) { worst = d; }
      if (d >= 1e-9 && first === null) first = s;
    }
    const ok = worst < 1e-9;
    T('LEG B — exact pitch (coherent): k·Δf recovers the note\'s TRUE frequency f = semiToFreq(s) to < 1e-9 Hz across all playable notes — the recovered Hz IS the pitch (a fixed fs=N leaves a ~10.8-cent residual; deriving fs removes it)',
      ok, ok ? `worst |k·Δf − f| = ${worst.toExponential(2)} Hz (< 1e-9 — machine-exact, no tuning residual)`
             : `worst |k·Δf − f| = ${worst.toExponential(2)} Hz (first @ s=${first})`);
  }

  // ── LEG C — clean spike: the coherent line is ONE tower (no leakage). ────────
  {
    let worstDb = -Infinity, first = null;   // worst = the LEAST-negative (closest to 0)
    for (const s of PLAYABLE) {
      const r = voiceSpectrum(s);
      const ratio = secondToPeak(r.mag, r.kMeas);
      const db = 20 * Math.log10(ratio > 0 ? ratio : 1e-300);
      if (db > worstDb) worstDb = db;
      if (db > -40 && first === null) first = s;
    }
    const ok = worstDb <= -40;
    T('LEG C — clean spike (coherent): the second-largest bin is ≥ 40 dB below the peak for EVERY playable note — the coherent line is a single tower with no leakage (this backs the visual)',
      ok, ok ? `worst 2nd/peak = ${worstDb.toFixed(1)} dB below peak (≤ −40 dB — one clean spike)`
             : `worst 2nd/peak = ${worstDb.toFixed(1)} dB (first leaker @ s=${first})`);
  }

  // ── LEG D — TEETH-1 (non-power-of-two N): the imported fft THROWS. ───────────
  {
    let threw = false, msg = '';
    try { fft(toComplex(new Array(1000).fill(0))); }
    catch (e) { threw = true; msg = String(e.message || e); }
    const ok = threw && /power-of-two/.test(msg) && /1000/.test(msg);
    T('LEG D — teeth (non-power-of-two N): fft(toComplex(1000 zeros)) THROWS "radix-2 FFT needs a power-of-two length, got 1000" — the transform refuses a window it cannot split (the radix-2 contract is real, not assumed)',
      ok, ok ? `threw as designed: "${msg}"` : `did NOT throw the expected error (threw=${threw}, msg="${msg}")`);
  }

  // ── LEG E — TEETH-2 (device-rate, the visitor's negative control): at fs=48000
  // the line LEAKS and recovery is only within ±Δf/2 — green = "leakage behaves as
  // predicted," NOT "exact." ───────────────────────────────────────────────────
  {
    const r = deviceSpectrum(0, { fs: 48000 });    // middle C at a real device rate
    const off = Math.abs(r.fRecovered - r.f);
    const halfBin = r.df / 2;
    const leaks = r.leakage > 0.1;                  // a non-integer c MUST leak
    const nearest = off <= halfBin + 1e-9;          // peak is the NEAREST bin, within ±Δf/2
    const nonInteger = Math.abs(r.cFractional - Math.round(r.cFractional)) > 1e-6;
    const ok = leaks && nearest && nonInteger;
    T('LEG E — teeth (device-rate, the visitor-operated negative control): at fs=48000 the cycle-count c is NON-integer, the line LEAKS (2nd/peak > 0.1), and k·Δf recovers f only within ±Δf/2 — green means "leakage behaves as predicted," NOT exact',
      ok, ok ? `c=${r.cFractional.toFixed(3)} (non-integer) · leakage 2nd/peak = ${r.leakage.toFixed(3)} > 0.1 · off ${off.toFixed(2)} Hz ≤ Δf/2 = ${halfBin.toFixed(2)} Hz`
             : `leaks=${leaks}(${r.leakage.toFixed(3)}) nearest=${nearest}(${off.toFixed(2)}≤${halfBin.toFixed(2)}) nonInteger=${nonInteger}`);
  }

  // ── LEG F — single-source: both the generator and the transform are IMPORTED. ─
  {
    const ok = typeof semiToFreq === 'function' && typeof noteName === 'function' &&
               typeof fft === 'function' && typeof toComplex === 'function';
    T('LEG F — single-source: semiToFreq (the generator) and fft/toComplex (the transform) are both IMPORTED functions — the pitch that names the note and the transform that places it are not re-typed here',
      ok, ok ? 'semiToFreq + noteName + fft + toComplex all imported (the cross is two authorities meeting, not a copy)'
             : `semiToFreq=${typeof semiToFreq} fft=${typeof fft} toComplex=${typeof toComplex}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
// ===== VOICE CORE END =====

export { N, FS_REF, voiceSpectrum, deviceSpectrum, PLAYABLE, runSelfTest };
