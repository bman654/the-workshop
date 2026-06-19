// ============================================================================
//  THE OVERTONE RACK — the OVERTONE CORE: the sole authority for the claim
//  "a pitch is the SPACING of its overtones, not its lowest rung." This module
//  owns the rack's physics — pure, dependency-free (DOM-free):
//
//    • A timbre is a stack of harmonic partials at f₀, 2f₀, 3f₀, … each with its
//      own amplitude. A sawtooth is aₙ = 1/n on EVERY harmonic; a square is
//      aₙ = 1/n on the ODD harmonics and 0 on the even ones. The page draws and
//      PLAYS the SAME additive sum y(t) = Σ aₙ·sin(2π·n·t) — one law, one ear,
//      one eye.
//
//    • THE REVEAL: pull the fundamental's fader to zero and the tone keeps its
//      PITCH. The float-safe tolerance-GCD estimator (estimateF0) recovers the
//      same f₀ from the SPACING of the surviving partials — with the fundamental
//      present, with it removed, on the odd-only square set, at two fundamentals.
//      Your ear does the same trick: it rebuilds the missing fundamental.
//
//    • THE NEGATIVE CONTROL: retune the rack INHARMONICALLY (partial n at
//      f₀·n^1.4 instead of f₀·n) and the SAME estimator returns failure — the
//      partials no longer share a common divisor, so there is no fundamental to
//      rebuild. The failure is the INPUT, not a broken estimator: feed it a
//      genuinely harmonic stack and it succeeds again.
//
//  This OVERTONE CORE single-sources the harmonic ladder from
//  ../the-beating-bench/core.mjs (its `partials` — k·g, never re-typed here) and
//  the pitch anchor from ../pitch-core.mjs (semiToFreq). The Overtone Rack page
//  (the-overtone-rack/index.html) inlines a BYTE-TWIN of the OVERTONE CORE slice
//  between the sentinels below, char-for-char; the Node twin (core.test.mjs)
//  re-extracts that slice and asserts it is identical, re-derives f₀ at fresh
//  fundamentals, sweeps the inharmonic boundary, and proves the amplitude /
//  estimator literals live in ONE file. The in-page pill and the Node twin both
//  call THIS runRackSelfTest, so "self-test green" cannot drift.
//
//  Note on the byte-twin's shape: the OVERTONE CORE block is IMPORT-FREE — it
//  receives the harmonic-ladder function (`partialsFn`), `f0`, and `f0Alt` as
//  PARAMETERS. This lets the page inline the slice without forcing a load order
//  (PITCH CORE / the bench's `partials` are wired in separately, outside the
//  slice), and keeps the single-source grep honest: the k·g ladder is imported,
//  never re-typed; the amplitude law 1/n lives only inside this slice.
// ============================================================================

import { partials } from '../the-beating-bench/core.mjs';   // the harmonic ladder k·g — single-sourced, never re-typed
import { semiToFreq } from '../pitch-core.mjs';             // the pitch anchor — semiToFreq, never re-typed

// the rack's two fundamentals, DERIVED from the pitch anchor (no Hz literal is
// re-typed). SEMI_F0 sits low enough that twelve partials stay well under ~2 kHz;
// SEMI_F0_ALT is a second, lower fundamental the self-test re-derives f₀ at, so
// the recovery is proven scale-free rather than tuned to one register.
const SEMI_F0 = -9;
const F0 = semiToFreq(SEMI_F0);          // ≈155.56 Hz — the rack's home pitch
const SEMI_F0_ALT = -21;
const F0_ALT = semiToFreq(SEMI_F0_ALT);  // ≈77.78 Hz — an octave-down second fundamental for re-derivation

// ===== OVERTONE CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: every function that needs the harmonic ladder takes `partialsFn`
// (= the bench's `partials`, k·g) as a parameter, and f₀ as a parameter — so the
// page can inline this block verbatim regardless of script load order, and the
// k·g ladder is never re-typed inside the slice (the single-source grep checks).

// the number of faders on the rack (twelve brass rungs).
const RACK_SIZE = 12;

// THE AMPLITUDE LAWS — the ONLY place these coefficients live as code (the
// single-source grep asserts the 1/n literal appears in exactly one file).
//   sawtooth: every harmonic at 1/n      → a bright, buzzy ramp
//   square  : odd harmonics at 1/n, evens silent → a hollow, clarinet-ish tone
function sawAmp(n){ return 1 / n; }
function squareAmp(n){ return (n % 2 === 1) ? 1 / n : 0; }

// the preset dispatcher: a named analytic timbre → its amplitude on harmonic n.
// 'sine' is the pure fundamental (a₁=1, all else 0). Presets re-type NOTHING —
// the page reads its fader values from THIS, never a hand-typed array.
function analyticCoeff(shape, n){
  if (shape === 'saw') return sawAmp(n);
  if (shape === 'square') return squareAmp(n);
  if (shape === 'sine') return n === 1 ? 1 : 0;
  return 0;
}

// build the RACK_SIZE-long amplitude vectors for the analytic presets.
function sawRack(size = RACK_SIZE){ const a = []; for (let n = 1; n <= size; n++) a.push(sawAmp(n)); return a; }
function squareRack(size = RACK_SIZE){ const a = []; for (let n = 1; n <= size; n++) a.push(squareAmp(n)); return a; }

// THE SUM the audio plays AND the trace draws — one additive law, two surfaces.
//   y(t) = Σ aₙ·sin(2π·(n)·t)   (n = i+1; silent partials skipped)
// t is in PERIODS of the fundamental (one period is t ∈ [0,1)), so the shape is
// register-free; the page scales it to f₀ for the ear and to pixels for the eye.
function additiveSample(amps, t){
  let s = 0;
  for (let i = 0; i < amps.length; i++){
    const a = amps[i];
    if (a === 0) continue;
    s += a * Math.sin(2 * Math.PI * (i + 1) * t);
  }
  return s;
}

// one period of the additive waveform, sampled at `res` points over t ∈ [0,1).
function waveform(amps, res = 512){
  const out = new Float64Array(res);
  for (let k = 0; k < res; k++) out[k] = additiveSample(amps, k / res);
  return out;
}

// the 1-based indices of the partials that are actually sounding (amp above the
// numerical floor). The feed for both the estimator and the live readouts.
function activeHarmonics(amps, floor = 1e-9){
  const out = [];
  for (let i = 0; i < amps.length; i++) if (Math.abs(amps[i]) > floor) out.push(i + 1);
  return out;
}

// THE ONE PLACE the inharmonic stretch lives: partial n sits at multiplier n for
// a true harmonic stack, or n^1.4 when the rack is detuned inharmonic. BOTH the
// audio retune and the estimator feed read THIS — they cannot disagree.
const INHARM_STRETCH = 1.4;
function partialMultiplier(n, inharmonic){ return inharmonic ? Math.pow(n, INHARM_STRETCH) : n; }

// the frequencies of the ACTIVE partials, as a flat array (the estimator's feed).
// Harmonic: the ladder is partialsFn(f0, N) = [f0, 2f0, …] (single-sourced k·g).
// Inharmonic: each partial is f0·partialMultiplier(i+1, true) = f0·(i+1)^1.4.
function activeFreqs(amps, f0, partialsFn, inharmonic = false, floor = 1e-9){
  const ladder = inharmonic
    ? amps.map((_, i) => f0 * partialMultiplier(i + 1, true))
    : partialsFn(f0, amps.length);
  const out = [];
  for (let i = 0; i < amps.length; i++) if (Math.abs(amps[i]) > floor) out.push(ladder[i]);
  return out;
}

// the ACTIVE partials as rich records [{n, freq, amp}] (the UI's feed). The freq
// comes from the SAME partialMultiplier law activeFreqs uses — one law, two shapes.
function activePartials(amps, f0, partialsFn, inharmonic = false, floor = 1e-9){
  const ladder = inharmonic
    ? amps.map((_, i) => f0 * partialMultiplier(i + 1, true))
    : partialsFn(f0, amps.length);
  const out = [];
  for (let i = 0; i < amps.length; i++) if (Math.abs(amps[i]) > floor) out.push({ n: i + 1, freq: ladder[i], amp: amps[i] });
  return out;
}

// THE ESTIMATOR — recover the fundamental from a set of partial frequencies by
// the greatest common divisor of their spacing. Float-safe: a tolerance-guarded
// Euclidean reduction (exact integer GCD is meaningless on floats). The relative
// tolerance EST_REL_TOL is the only knob; EST_MAX_N caps the harmonic index a
// partial may sit at (a partial at 5000× the candidate fundamental is not a
// rebuild, it is a collapse).
const EST_REL_TOL = 1e-3;
const EST_MAX_N = 64;

// the float-safe GCD: Euclid's a % b until b falls below the absolute tolerance,
// with a hard guard so a pathological input cannot spin forever.
function floatGcd(a, b, tol){
  a = Math.abs(a); b = Math.abs(b);
  let guard = 0;
  while (b > tol){
    const t = a % b; a = b; b = t;
    if (++guard > 100000) break;
  }
  return a;
}

// estimateF0(freqs) → { ok, f0, worstRes, maxN, reason? }. Sort the positive
// freqs; the tolerance scales with the lowest. Reduce the GCD across all of
// them. If the GCD collapses toward zero (no common divisor — the inharmonic
// case) it fails. Otherwise every partial must land on an integer multiple of
// the recovered f₀ within EST_REL_TOL, with that integer in [1, EST_MAX_N].
function estimateF0(freqs){
  const s = freqs.filter(f => f > 0).slice().sort((x, y) => x - y);
  if (s.length === 0) return { ok: false, f0: 0, worstRes: Infinity, maxN: 0, reason: 'empty' };
  const tol = s[0] * EST_REL_TOL;
  let g = s[0];
  for (let i = 1; i < s.length; i++) g = floatGcd(g, s[i], tol);
  if (!(g > 0) || !isFinite(g)) return { ok: false, f0: g, worstRes: Infinity, maxN: 0, reason: 'gcd-collapse' };
  let worst = 0, maxN = 0, inRange = true;
  for (const f of s){
    const n = Math.round(f / g);
    if (n < 1 || n > EST_MAX_N) inRange = false;
    if (n > maxN) maxN = n;
    const res = Math.abs(f / g - n);
    if (res > worst) worst = res;
  }
  const ok = inRange && worst <= EST_REL_TOL;
  return { ok, f0: g, worstRes: worst, maxN };
}

// the inharmonic partial frequencies f0·n^1.4 for a list of partial indices —
// the negative-control feed (a stack with NO common fundamental).
function inharmonicFreqs(f0, ns){ return ns.map(n => f0 * Math.pow(n, INHARM_STRETCH)); }

// ── runRackSelfTest(f0, f0Alt, partialsFn) — the SOLE ORACLE. Same shape as the
// sibling leaves: { pass, total, lines:[{name, ok, detail}] }. The in-page pill
// and the Node twin both call THIS, so they cannot disagree. f0/f0Alt are the
// two fundamentals; partialsFn is the bench's harmonic ladder (k·g).
function runRackSelfTest(f0, f0Alt, partialsFn){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // LEG 1 — THE AMPLITUDE LAWS, to the bit: the sawtooth rack is 1/n on every
  //   harmonic, and the square rack is 1/n on the odds and exactly 0 on the
  //   evens. These are the timbre recipes the faders snap to; they are computed,
  //   never typed.
  {
    const saw = sawRack(), sq = squareRack();
    let ok = true, worst = 0;
    for (let n = 1; n <= RACK_SIZE; n++){
      const dSaw = Math.abs(saw[n - 1] - 1 / n);
      const wantSq = (n % 2 === 1) ? 1 / n : 0;
      const dSq = Math.abs(sq[n - 1] - wantSq);
      worst = Math.max(worst, dSaw, dSq);
      if (dSaw > 0 || dSq > 0) ok = false;
    }
    T('LEG 1 — the amplitude laws: the sawtooth rack is aₙ = 1/n on every harmonic and the square rack is 1/n on the odds, 0 on the evens — the timbre recipes are computed to the bit, never a typed array',
      ok, ok ? `saw[1..12] = 1/n exact · square = 1/n odd / 0 even exact (worst Δ ${worst.toExponential(2)})`
             : `mismatch (worst Δ ${worst.toExponential(2)})`);
  }

  // LEG 2 — THE SUM IS THE SHAPE: the additive square-wave sum is positive in
  //   the first half-period and negative in the second (a square is ±-symmetric
  //   about the half-period), and at the quarter-point t=1/4 the odd-harmonic sum
  //   Σ (1/n)·sin(πn/2) is the Leibniz series → π/4. The sum the ear hears IS the
  //   trace the eye sees.
  {
    const sq = squareRack();
    // sign over the two half-periods (sample inside each, avoiding the zero crossings)
    let posFirst = true, negSecond = true;
    for (let k = 1; k < 16; k++){
      const t1 = k / 32;          // (0, 1/2)
      const t2 = 0.5 + k / 32;    // (1/2, 1)
      if (additiveSample(sq, t1) <= 0) posFirst = false;
      if (additiveSample(sq, t2) >= 0) negSecond = false;
    }
    // the quarter-point value of the (1/n odd) sum is the Leibniz partial sum → π/4
    const quarter = additiveSample(sq, 0.25);
    const leibniz = (() => { let s = 0; for (let n = 1; n <= RACK_SIZE; n += 2) s += (1 / n) * Math.sin(Math.PI * n / 2); return s; })();
    const quarterOK = Math.abs(quarter - leibniz) < 1e-12 && Math.abs(leibniz - Math.PI / 4) < 0.05;
    const ok = posFirst && negSecond && quarterOK;
    T('LEG 2 — the sum IS the trace: the additive square sum is positive in the first half-period and negative in the second, and its quarter-point value is the Leibniz partial sum Σ(1/n)sin(πn/2) → π/4 — the heard sum and the drawn curve are one function',
      ok, ok ? `half-periods +/− ✓ · y(¼) = ${quarter.toFixed(5)} ≈ π/4 (${(Math.PI / 4).toFixed(5)}, 12-term partial)`
             : `posFirst=${posFirst} negSecond=${negSecond} y(¼)=${quarter.toFixed(5)}`);
  }

  // LEG 3 — THE MISSING FUNDAMENTAL: estimateF0 over the ACTIVE partials recovers
  //   the SAME f₀ with the fundamental partial present AND removed (slice(1)) AND
  //   on the odd-only (square) set — re-derived at BOTH f0 and f0Alt. The pitch is
  //   the SPACING; pulling the bottom rung does not move it.
  {
    let ok = true, worst = 0; const rows = [];
    for (const [label, base] of [['f0', f0], ['f0Alt', f0Alt]]){
      const saw = sawRack(), sq = squareRack();
      const full = activeFreqs(saw, base, partialsFn, false);
      const pulled = full.slice(1);                                  // fundamental removed
      const odd = activeFreqs(sq, base, partialsFn, false);          // odd-only set
      const oddPulled = odd.slice(1);                                // odd-only, fundamental removed
      for (const [tag, fr] of [['full', full], ['pulled', pulled], ['odd', odd], ['oddPulled', oddPulled]]){
        const est = estimateF0(fr);
        const rel = Math.abs(est.f0 - base) / base;
        worst = Math.max(worst, rel);
        if (!(est.ok && rel <= EST_REL_TOL)) { ok = false; rows.push(`${label}/${tag} FAIL (ok=${est.ok}, Δ=${rel.toExponential(2)})`); }
      }
    }
    T('LEG 3 — the missing fundamental: estimateF0 over the active partials recovers the SAME f₀ with the fundamental present AND removed AND on the odd-only set, re-derived at TWO fundamentals — the pitch lives in the spacing, not the lowest rung',
      ok, ok ? `f₀ recovered at both fundamentals, fundamental present & pulled & odd-only — worst |Δf₀|/f₀ = ${worst.toExponential(2)} ≤ ${EST_REL_TOL}`
             : rows.join(' · '));
  }

  // LEG 4 — THE NEGATIVE CONTROL: the SAME estimator fails on an inharmonic stack
  //   (partials at f0·n^1.4, no common divisor) but succeeds on the matching
  //   harmonic stack (partials at f0·n) — only the SPACING changed. The failure is
  //   the input, not a broken estimator.
  {
    const ns = [1, 2, 3, 4, 5, 6, 7, 8];
    const inh = estimateF0(inharmonicFreqs(f0, ns));
    const har = estimateF0(ns.map(n => n * f0));
    const ok = inh.ok === false && har.ok === true && Math.abs(har.f0 - f0) / f0 <= EST_REL_TOL;
    T('LEG 4 — the negative control: the SAME estimator returns FAILURE on an inharmonic rack (partials at f₀·n^1.4 — no common fundamental) yet SUCCEEDS on the matching harmonic rack (f₀·n) — only the spacing changed; the failure is the input, not the estimator',
      ok, ok ? `inharmonic → ok:false (${inh.reason || 'no common divisor'}, worstRes ${inh.worstRes.toExponential(2)}) · harmonic → ok:true, f₀ ${har.f0.toFixed(2)} Hz`
             : `inh.ok=${inh.ok} har.ok=${har.ok} har.f0=${har.f0.toFixed(2)}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== OVERTONE CORE END =====

export {
  RACK_SIZE, sawAmp, squareAmp, analyticCoeff, sawRack, squareRack,
  additiveSample, waveform, activeHarmonics, partialMultiplier,
  activeFreqs, activePartials, estimateF0, floatGcd, inharmonicFreqs,
  EST_REL_TOL, EST_MAX_N, INHARM_STRETCH, runRackSelfTest,
  partials, semiToFreq, F0, F0_ALT, SEMI_F0,
};
