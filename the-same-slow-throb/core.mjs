// ============================================================================
//  THE SAME SLOW THROB — a HEARD beat and a SEEN crawl keep one law. Logic core.
//
//  THE ONE IDEA. A slow beat is just |f₁ − f₂| folded down — the SAME difference
//  worn two ways. Once as a sound you HEAR (two near-unison partials throbbing in
//  amplitude at |fHi − fLo|), once as a motion you SEE (a toothed siren disc that
//  appears to crawl under a strobe at the fold of its tooth-pass rate against the
//  flash rate). Both are |Δf|. ONE control-bar sets a single SLOW RATE target S and
//  drives BOTH rate-pairs so the throb PERIOD equals the crawl PERIOD: lock them
//  and the heard pulse swells exactly as the seen crawl advances one tooth — the
//  same |Δf| breathing in both senses at once.
//
//    • THE EAR-THROB (the-beating-bench/core.mjs — "The Beating Bench"). A drone at
//      fLo and a near-unison partner at fHi combine; their amplitude pulses at the
//      AUDIBLE beat rate beatRate(fLo, fHi/fLo) = |fHi − fLo| (the nearest partial
//      pair IS the two fundamentals for a near-unison pair). We SET fHi = fLo + S,
//      so the heard throb rate IS S — recovered through the bench's OWN beatRate.
//
//    • THE EYE-CRAWL (tone-mill/core.mjs — "The Tone Mill"). A disc of N teeth
//      turning at Ω passes its reading-edge at toothPassHz = N·Ω/2π. A strobe
//      flashing at strobeHz samples it; the apparent crawl is the residual fold
//      apparentDriftHz(N, Ω, strobeHz) = (r − round(r))·strobeHz, r = toothPass/strobe
//      — the wagon-wheel illusion. We SET the disc's tooth-pass rate to strobe + S
//      (one slow-beat above the flash), so the residual fold IS S — recovered
//      through the mill's OWN apparentDriftHz.
//
//  THE COINCIDENCE. Under LOCK both rate-pairs carry the SAME slow target S, so the
//  heard beatRate and the |seen apparentDriftHz| are the SAME number S, by two
//  STRUCTURALLY DIFFERENT laws — a frequency difference of audio partials, and a
//  strobe-alias fold of a rotation rate. It is GENUINE, not a fudge: there is no
//  smuggled factor (the ear is set as a Hz DIFFERENCE fHi−fLo; the eye as a Hz
//  OFFSET above the strobe; neither re-types the other's value), and the negative
//  control SPLITS the pair — pull Δ apart and the ear's throb SPEEDS up out of the
//  slow-beat band into roughness while the |eye|'s crawl SLOWS to a different rate,
//  so the two DIVERGE. Only the locked state survives the bridge.
//
//  THE STROBE NYQUIST (why the band has a ceiling). A strobe flashing at strobeHz
//  can only resolve a crawl up to strobeHz/2 — its Nyquist. Past that the eye folds
//  to a DIFFERENT alias (the sign flips), exactly as a strobe lies about a too-fast
//  wheel. So the shared slow target lives in (0, strobeHz/2); the lock is honest
//  only inside the strobe's own resolving band, and leaving it IS the neg-control.
//
//  THE FORM (form expresses content). NO graph. LEFT bay = the ear-throb: a single
//  tone disc that PULSES in size/brightness at the heard beat (the amplitude
//  envelope made visible), driven by two real synth partials. RIGHT bay = the
//  eye-crawl: the actual toothed siren disc rotating while a strobe flashes; the
//  apparent crawl is what the eye integrates. CENTER = one control-bar with a LOCK
//  toggle that snaps both pairs onto one slow rate (throb period === crawl period),
//  and an UNLOCK / pull-apart lever Δ that splits them.
//
//  SINGLE-SOURCE DISCIPLINE. The two parent cores are the SOLE authorities for
//  their own physics; this module IMPORTS them byte-untouched (native ES modules,
//  ONE ../ hop each, since the-same-slow-throb/ is a top-level leaf next to the
//  parents), so the imports sit ABOVE the CORE region and are NOT part of the
//  byte-twin slab. The two adapters below are code-DISJOINT (the ear block names no
//  tone-mill fn, the eye block names no beating-bench fn — a grep assertion in the
//  Node twin) and re-type NEITHER value: the ear rate is recovered from beatRate of
//  a SET fHi−fLo; the eye rate from apparentDriftHz of a SET tooth-pass offset.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. LOCK EQUALITY — |earBeat(S) − |eyeCrawl(S)|| < 1e-9 over a sweep of slow
//       targets S ∈ (0, strobe/2) (worst ~9e-14): one |Δf| in both senses.
//    2. CONVENTION-HONESTY — earBeat(S) recovers S to <1e-9 through the bench's OWN
//       beatRate (no re-typed S), AND |eyeCrawl(S)| recovers S to <1e-9 through the
//       mill's OWN apparentDriftHz (no smuggled factor either side).
//    3. NEG-CONTROL DIVERGE — splitting the pair (Δ>0) makes earBeat(S+Δ) and
//       |eyeCrawl(S−Δ)| DIVERGE (|diff| grows with Δ, strictly, → 0 as Δ → 0);
//       and at a wide Δ the ear leaves the slow-beat band (beat > BAND_HI → roughness).
//    4. NYQUIST FOLD — driving the eye past strobe/2 folds the apparent crawl to a
//       DIFFERENT alias (sign flip): the same |Δf| law, now lying like a strobe.
//    5. BYTE-TWIN PARITY (Node twin) — index.html CORE === core.mjs CORE char-for-
//       char, and the two adapters are code-disjoint by grep.
//
//  Cycle #301 — a cross in the Workbench's cross vein, kin to The Fold They Share
//  (a strobed wheel × a moiré beat) and The Same Beat (a rod × a glass).
// ============================================================================

import { beatRate, nearestPair } from '../sound-garden/the-beating-bench/core.mjs'; // the EAR: |Δf| of partials
import { apparentDriftHz, toothPassHz } from '../tone-mill/core.mjs';                // the EYE: strobe-alias fold

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED CONFIGURATION — the two costumes' fixed apparatus ══════════════════════════════════
const TWO_PI = 2 * Math.PI;
const F_LO = 300;        // the drone fundamental (Hz) — the ear's lower partial. fHi = F_LO + earTarget.
const N_TEETH = 16;      // the siren disc's tooth count.
const STROBE_HZ = 30;    // the strobe flash rate (Hz). Its Nyquist STROBE_HZ/2 = 15 Hz caps the slow band.
const SLOW_NYQUIST = STROBE_HZ / 2;              // = 15 Hz — the strobe's resolving ceiling for the crawl
const BAND_LO = 0.4;     // the slow-beat band floor (Hz): below this a throb is too slow to read as a pulse
const BAND_HI = 12;      // the slow-beat band ceiling (Hz): above this the heard beat is roughness, not a throb
// the lock target S lives in [BAND_LO, BAND_HI] ⊂ (0, SLOW_NYQUIST) so the eye stays in its principal alias.

// the slow-rate sweep the self-test walks (a fine step so the coincidence is checked at many rates).
function slowSweep(){ const xs = []; for (let S = BAND_LO; S <= BAND_HI + 1e-12; S += 0.0137) xs.push(S); return xs; }

// ══ THE EAR ADAPTER — sets the throb as a Hz DIFFERENCE; reads the bench's OWN beatRate ════════════
// ─ EAR-ADAPTER BEGIN ─
// earBeat(earTarget): the heard throb rate at a given target. The drone sits at F_LO; we SET its
// near-unison partner at fHi = F_LO + earTarget (the target is laid in as a frequency DIFFERENCE, never
// re-typed downstream). beatRate(F_LO, fHi/F_LO) — the bench's own law — returns |fHi − F_LO| of the
// nearest partial pair (= the two fundamentals at near-unison), so the recovered throb rate IS earTarget.
function earBeat(earTarget){
  const fHi = F_LO + earTarget;                       // the partner partial (target as a Hz DIFFERENCE)
  return beatRate(F_LO, fHi / F_LO);                  // the bench's own beat law → |fHi − F_LO|
}
// earPair(earTarget): the two beating frequencies + the heard beat, for the page's pulsing tone disc
// (the amplitude envelope pulses at .beat). Delegates to the bench's nearestPair — no re-derived envelope.
function earPair(earTarget){
  const fHi = F_LO + earTarget;
  const np = nearestPair(F_LO, fHi / F_LO);
  return { fLo: np.fLo, fHi: np.fHi, beat: np.beat };
}
// inSlowBand(rate): is a heard beat a clean slow THROB (BAND_LO ≤ rate ≤ BAND_HI), or has it sped up
// into ROUGHNESS (> BAND_HI)? The neg-control rides this: pull Δ wide and the ear leaves the band.
function inSlowBand(rate){ return rate >= BAND_LO && rate <= BAND_HI; }
// ─ EAR-ADAPTER END ─

// ══ THE EYE ADAPTER — sets the tooth-pass rate as a Hz OFFSET above the strobe; reads the mill's fold ═
// ─ EYE-ADAPTER BEGIN ─
// eyeCrawl(eyeTarget): the SIGNED apparent crawl at a given target. We SET the disc's tooth-pass rate to
// STROBE_HZ + eyeTarget (one slow-beat ABOVE the flash; the target laid in as a Hz OFFSET), by spinning
// it at omegaFor(eyeTarget). apparentDriftHz — the mill's own strobe-alias fold — returns the residual
// (r − round r)·strobe; inside the strobe's Nyquist that residual IS eyeTarget (round = 1). SIGNED so the
// Nyquist fold (sign flip past STROBE_HZ/2) is visible; the heard throb compares to its MAGNITUDE.
function omegaFor(eyeTarget){
  const fTooth = STROBE_HZ + eyeTarget;               // the tooth-pass rate (target as a Hz OFFSET above strobe)
  return fTooth * TWO_PI / N_TEETH;                   // the disc spin Ω that yields that tooth-pass rate
}
function eyeCrawl(eyeTarget){
  return apparentDriftHz(N_TEETH, omegaFor(eyeTarget), STROBE_HZ);   // the mill's own fold → ±residual
}
// eyeState(eyeTarget): the disc spin + tooth-pass rate + signed crawl, for the page's rotating disc.
function eyeState(eyeTarget){
  const omega = omegaFor(eyeTarget);
  return { omega, fTooth: toothPassHz(N_TEETH, omega), crawl: apparentDriftHz(N_TEETH, omega, STROBE_HZ) };
}
// ─ EYE-ADAPTER END ─

// ══ THE BRIDGE — one slow target S + a pull-apart Δ drive both pairs ════════════════════════════════
// lockPoint(S): the LOCKED reading at slow rate S (Δ=0). Both pairs carry S; .ear and |.eye| coincide.
function lockPoint(S){
  const ear = earBeat(S);
  const eye = eyeCrawl(S);
  return { S, ear, eye, eyeMag: Math.abs(eye), diff: Math.abs(ear - Math.abs(eye)), throbBand: inSlowBand(ear) };
}
// splitPoint(S, delta): the UNLOCKED reading. The pull-apart lever Δ raises the ear's target to S+Δ and
// lowers the eye's to S−Δ (clamped ≥ a hair above 0), so the throb speeds up while the crawl slows down.
function splitPoint(S, delta){
  const earTarget = S + delta;
  const eyeTarget = Math.max(0.05, S - delta);
  const ear = earBeat(earTarget);
  const eye = eyeCrawl(eyeTarget);
  return { S, delta, earTarget, eyeTarget, ear, eye, eyeMag: Math.abs(eye),
           diff: Math.abs(ear - Math.abs(eye)), throbBand: inSlowBand(ear) };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const EPS = 1e-9;
  const Ss = slowSweep();

  // LEG 1 — LOCK EQUALITY: one |Δf| in both senses. The heard throb rate and the |seen crawl| are the
  // SAME number across the whole slow-rate band — recovered through each parent's OWN law, no shared code.
  {
    let worst = 0, worstS = 0;
    for (const S of Ss){
      const p = lockPoint(S);
      if (p.diff > worst){ worst = p.diff; worstS = S; }
    }
    ck('1 · lock equality: |earBeat(S) − |eyeCrawl(S)|| < 1e-9 over S∈[' + BAND_LO + ',' + BAND_HI + '] (one |Δf|, two senses)',
       worst < EPS, 'worst=' + worst.toExponential(2) + ' at S=' + worstS.toFixed(3) + ' over ' + Ss.length + ' rates');
  }

  // LEG 2 — CONVENTION-HONESTY (no smuggled factor either side): earBeat recovers S through the bench's
  // OWN beatRate of a SET fHi−fLo, and |eyeCrawl| recovers S through the mill's OWN apparentDriftHz of a
  // SET tooth-pass offset. Each parent independently re-derives S; neither re-types the other's value.
  {
    let worstEar = 0, worstEye = 0;
    for (const S of Ss){
      worstEar = Math.max(worstEar, Math.abs(earBeat(S) - S));
      worstEye = Math.max(worstEye, Math.abs(Math.abs(eyeCrawl(S)) - S));
    }
    ck('2 · convention honesty: earBeat(S) → S through the bench\'s OWN beatRate AND |eyeCrawl(S)| → S through the mill\'s OWN apparentDriftHz, both < 1e-9 (no smuggled factor)',
       worstEar < EPS && worstEye < EPS, 'ear worst=' + worstEar.toExponential(2) + ' · eye worst=' + worstEye.toExponential(2));
  }

  // LEG 3 — NEG-CONTROL DIVERGE: splitting the pair makes the two rates part. |diff| grows strictly with
  // Δ and → 0 as Δ → 0 (anti-vacuity: the equality is a real coincidence-of-lock, not an identity). At a
  // wide split the ear leaves the slow-beat band (beat > BAND_HI → roughness): only the locked state holds.
  {
    const S = 6;
    const deltas = [0, 1, 2, 3, 4];
    const diffs = deltas.map(d => splitPoint(S, d).diff);
    let monotone = true; for (let i = 1; i < diffs.length; i++) if (!(diffs[i] > diffs[i-1])) monotone = false;
    const atZero = Math.abs(diffs[0]) < EPS;                                   // Δ=0 ⇒ they coincide
    const wideEar = splitPoint(S, 8).ear;                                      // S+Δ = 14 Hz — out of band
    const leavesBand = !inSlowBand(wideEar);                                   // → roughness, no clean throb
    ck('3 · neg-control diverge: pull Δ apart → |earBeat(S+Δ) − |eyeCrawl(S−Δ)|| grows strictly, →0 as Δ→0, and a wide Δ drives the ear OUT of the slow band into roughness (only LOCK survives)',
       monotone && atZero && leavesBand,
       'Δ→0 diff=' + diffs[0].toExponential(2) + ' · monotone=' + monotone + ' · ear@Δ=8 = ' + wideEar.toFixed(2) + 'Hz (band? ' + inSlowBand(wideEar) + ')');
  }

  // LEG 4 — NYQUIST FOLD: a strobe resolves a crawl only up to STROBE_HZ/2. Drive the eye PAST it and the
  // apparent crawl folds to a DIFFERENT alias (its SIGN flips) — the same |Δf| law, now lying like a real
  // strobe about a too-fast wheel. The honest lock lives strictly inside the strobe's resolving band.
  {
    const inBand   = eyeCrawl(SLOW_NYQUIST - 1);        // inside the band: positive, ≈ target (14 Hz)
    const pastFold = eyeCrawl(SLOW_NYQUIST + 3);        // past Nyquist: folds to a DIFFERENT alias (18→−12)
    const flips = (inBand > 0) && (pastFold < 0);                          // the apparent crawl reverses
    const differentAlias = Math.abs(Math.abs(pastFold) - Math.abs(inBand)) > 1; // and lands on a different rate
    ck('4 · Nyquist fold: driving the eye past strobe/2 folds the apparent crawl to a DIFFERENT alias (the crawl reverses and lands on a different rate) — the same |Δf| law, lying like a strobe',
       flips && differentAlias,
       'in-band=' + inBand.toFixed(3) + 'Hz (+) · past-fold=' + pastFold.toFixed(3) + 'Hz (−, different alias) at strobe Nyquist ' + SLOW_NYQUIST + 'Hz');
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  TWO_PI, F_LO, N_TEETH, STROBE_HZ, SLOW_NYQUIST, BAND_LO, BAND_HI,
  slowSweep, earBeat, earPair, inSlowBand, omegaFor, eyeCrawl, eyeState,
  lockPoint, splitPoint, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity + disjointness.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Same Slow Throb — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
