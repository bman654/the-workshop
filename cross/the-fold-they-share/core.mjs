// ============================================================================
//  THE FOLD THEY SHARE — logic core (a wagon-wheel strobe aliasing in TIME and a
//  moiré fringe beating in SPACE are the SAME arithmetic). Pure, dependency-free:
//  the two domain cores are lifted BYTE-FOR-BYTE from their rooms and a thin
//  adapter joins them. index.html inlines this whole CORE region byte-identically.
//
//  THE ONE IDEA.  Turn ONE brass dial — the spoke rate of a spinning wheel, swept
//  about a fixed strobe — and two phenomena that never met fold to the SAME slow
//  apparent rate. Both are a DIFFERENCE OF RECIPROCALS folded down to a beat:
//
//    • THE WHEEL (sampling-theorem/sampling-core.mjs). A spoked wheel spins at
//      `spokeRate` rev/s, seen only at flash-rate `strobe` per second. The eye
//      reconstructs the SMALLEST-magnitude equivalent advance per flash — the
//      SIGNED stroboscopic alias apparentRate(spokeRate, strobe). Near the
//      fundamental fold its magnitude is |spokeRate − strobe| = |1/T_w − 1/T_s|,
//      the difference of the two RECIPROCAL periods. The SIGN is the drama: just
//      below the strobe the wheel crawls BACKWARD (the movie phantom), at
//      spokeRate===strobe it FREEZES, just above it crawls forward.
//
//    • THE GRATINGS (moire-bench/moire-core.mjs). Two PARALLEL line-gratings of
//      pitch p₁,p₂ multiply to a brightness whose slow moiré band has spatial
//      frequency |1/p₁ − 1/p₂| and spacing D = p₁p₂/|p₁−p₂| (spacingTwoPitch).
//      The reciprocal-beat magnitude is 1/D = |1/p₁ − 1/p₂| — again a difference
//      of two RECIPROCAL periods.
//
//  THE LATCH.  Map the wheel's two periods onto the gratings' two pitches —
//  p₁ ← 1/spokeRate (the wheel's period), p₂ ← 1/strobe (the strobe's period).
//  Then 1/spacingTwoPitch(1/spokeRate, 1/strobe) = |spokeRate − strobe|, and
//  inside the fundamental beat band (|spokeRate − strobe| ≤ strobe/2, the only
//  band where the eye does not fold past the first multiple)
//      |apparentRate(spokeRate, strobe)|  ===  1 / spacingTwoPitch(1/spokeRate, 1/strobe)
//  to machine zero (worst 7.1e-15 across a dense sweep). One difference-of-
//  reciprocals fact, read once in TIME and once in SPACE. The hero chip latches
//  GOLD on that agreement (<1e-9). It is NOT a tautology: it is the SAME closed
//  form evaluated through two code-disjoint cores that never call each other.
//
//  THE SIGNED PHANTOM (real, not symmetric).  The reciprocal-beat magnitude is
//  unsigned, but apparentRate carries a SIGN: < 0 when spokeRate sits just below
//  the strobe (the wheel runs backward), > 0 just above, EXACTLY 0 at coincidence.
//  That sign is the wagon-wheel reversal — the test pins it leg by leg.
//
//  THE LOAD-BEARING NEGATIVE CONTROL (the COINCIDENCE leg, both halves shipped).
//  Set strobe === spokeRate (equivalently p₁ === p₂) and the fold goes to ZERO on
//  BOTH sides at once: apparentRate === 0 (the wheel stands DEAD STILL) and
//  spacingTwoPitch === Infinity (the moiré field goes FLAT, D→∞ — "no fringe is
//  the correct answer"). A vacuous "two combs always beat" / "a strobed wheel
//  always drifts" classifier PASSES every off-coincidence case and provably FAILS
//  here: the ABSENCE of a beat is the right answer, and the cores report it as a
//  clean limit (apparentRate exactly 0, spacing exactly Infinity), never NaN.
//
//  SINGLE-SOURCE DISCIPLINE.  The two cores below are lifted byte-faithfully from
//  their rooms and NEVER call each other (anti-circularity: the TIME block never
//  names a moiré fn and vice versa). A thin adapter sits on TOP and reads each
//  independently. index.html inlines this whole CORE region byte-identically
//  between the same sentinels; the byte-twin parity leg proves the page IS this
//  module, char-for-char, AND each lifted block === its parent core's source.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. SHARED FACT — for a dense sweep of spokeRate inside the fundamental band:
//       |apparentRate(spokeRate, strobe)| === 1/spacingTwoPitch(1/spokeRate,
//       1/strobe) to <1e-9 (worst ~7e-15). One difference of reciprocals, two
//       domains.
//    2. SIGNED PHANTOM — apparentRate < 0 just below the strobe (BACKWARD), > 0
//       just above (forward), EXACTLY 0 at coincidence: the wagon-wheel reversal
//       is real, not a symmetric magnitude.
//    3. NEG-CONTROL (COINCIDENCE, load-bearing) — at spokeRate===strobe (p₁===p₂)
//       apparentRate === 0 EXACTLY and spacingTwoPitch === Infinity: both halves
//       hit the no-beat limit, so an "always beats" classifier provably FAILS.
//    4. ANTI-CIRCULARITY — the TIME block never names spacingTwoPitch and the
//       SPACE block never names apparentRate/foldedFreq: two code-disjoint domains
//       landing on one difference-of-reciprocals fold.
//    5. BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE.
//    6. PARENT PARITY — each lifted block === the byte-for-byte source of the
//       function it was lifted from in its freshly-read parent core file.
// ============================================================================

// === CORE BEGIN ===
"use strict";

// ══ CORE A: THE WHEEL — lifted VERBATIM from sampling-theorem/sampling-core.mjs ══
// ───────────────────────────────────────────────────────────────────── SAMPLING-CORE BEGIN
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
// ───────────────────────────────────────────────────────────────────── SAMPLING-CORE END

// ══ CORE B: THE GRATINGS — lifted VERBATIM from moire-bench/moire-core.mjs ══
// ───────────────────────────────────────────────────────────────────────── MOIRE-CORE BEGIN
// ── spacingTwoPitch(p1,p2): D = p₁p₂/|p₁−p₂| for two PARALLEL combs of differing
//    pitch. p₁===p₂ ⇒ Infinity (the combs coincide, no beat). ──
function spacingTwoPitch(p1, p2){
  if (p1 === p2) return Infinity;
  return (p1 * p2) / Math.abs(p1 - p2);
}
// ───────────────────────────────────────────────────────────────────────── MOIRE-CORE END

// ══ THE THIN ADAPTER (the ONLY new logic) — one dial drives BOTH disjoint cores ══════════════════
// The two cores NEVER call each other (grep-confirmable). This adapter maps the wheel's two periods
// onto the gratings' two pitches and reads each half independently, then compares.
//   p₁ ← 1/spokeRate  (the wheel's rotation period)
//   p₂ ← 1/strobe     (the strobe's flash period)
// so the moiré reciprocal-beat magnitude 1/spacingTwoPitch(p₁,p₂) = |1/p₁ − 1/p₂| = |spokeRate − strobe|.

// reciprocalBeat(spokeRate, strobe): the SPACE half read THROUGH the moiré core. = 1/D where
// D = spacingTwoPitch(1/spokeRate, 1/strobe). The chain is: two periods → two pitches → moiré spacing
// → its reciprocal. At coincidence (spokeRate===strobe ⇒ p₁===p₂) D===Infinity so this is EXACTLY 0.
function reciprocalBeat(spokeRate, strobe){
  const D = spacingTwoPitch(1 / spokeRate, 1 / strobe);
  return D === Infinity ? 0 : 1 / D;
}

// apparentRateOf(spokeRate, strobe): the TIME half read THROUGH the sampling core. The SIGNED
// stroboscopic alias — its magnitude is the apparent crawl, its sign the forward/backward regime.
function apparentRateOf(spokeRate, strobe){
  return apparentRate(spokeRate, strobe);
}

// inFundamentalBand(spokeRate, strobe): the only band where the eye does NOT fold past the first
// strobe multiple — |spokeRate − strobe| ≤ strobe/2. Inside it |apparentRate| === reciprocalBeat to
// machine zero (one strobe-multiple apart, a single difference of reciprocals). Outside it the eye
// folds against a HIGHER multiple of the strobe and |apparentRate| measures distance to THAT multiple
// while reciprocalBeat still measures distance to the first — they part by design, not by error.
function inFundamentalBand(spokeRate, strobe){
  return Math.abs(spokeRate - strobe) <= strobe / 2;
}

// sharedFold(spokeRate, strobe): the hero readout. Inside the fundamental band the latch fires on the
// agreement |apparentRate| === reciprocalBeat (<1e-9). `apparent` keeps the SIGN (the wheel's drama);
// `direction` names the regime; `spacing` is the moiré D (∞ at coincidence). The cores never touch —
// this reads each and compares.
function sharedFold(spokeRate, strobe){
  const apparent = apparentRateOf(spokeRate, strobe);
  const beat = reciprocalBeat(spokeRate, strobe);
  const inBand = inFundamentalBand(spokeRate, strobe);
  return {
    spokeRate,
    strobe,
    apparent,                                   // signed apparent rate (the wheel)
    apparentMag: Math.abs(apparent),
    reciprocalBeat: beat,                       // |1/p₁ − 1/p₂| (the gratings)
    spacing: spacingTwoPitch(1 / spokeRate, 1 / strobe),
    inFundamentalBand: inBand,
    direction: apparent > 1e-12 ? 'forward' : apparent < -1e-12 ? 'backward' : 'frozen',
    latched: inBand && Math.abs(Math.abs(apparent) - beat) < 1e-9,
  };
}

// the visible corridor the page and the test sweep over: spokeRate within the fundamental band of a
// reference strobe. STROBE_REF is the dial's anchor (a cinema-plausible 24 flashes/s).
const STROBE_REF = 24;
const SPOKE_MIN = STROBE_REF / 2 + 1e-6;        // just inside the lower band edge (avoid the f=fs/2 freeze tie)
const SPOKE_MAX = STROBE_REF * 1.5 - 1e-6;      // just inside the upper band edge

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ═══════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const strobe = STROBE_REF;

  // LEG 1 — SHARED FACT (the headline latch): inside the fundamental band, |apparentRate(spokeRate,
  // strobe)| === reciprocalBeat(spokeRate, strobe) to <1e-9 across a dense sweep. One difference of
  // reciprocals, read once in TIME (the wheel) and once in SPACE (the gratings).
  {
    let worst = 0, worstAt = null, n = 0;
    for (let i = 0; i <= 400; i++){
      const spokeRate = SPOKE_MIN + (SPOKE_MAX - SPOKE_MIN) * i / 400;
      if (!inFundamentalBand(spokeRate, strobe)) continue;
      const d = Math.abs(Math.abs(apparentRateOf(spokeRate, strobe)) - reciprocalBeat(spokeRate, strobe));
      if (d > worst){ worst = d; worstAt = spokeRate; }
      n++;
    }
    ck('1 · shared fold: |apparentRate| === reciprocalBeat over the fundamental band < 1e-9',
       worst < 1e-9 && n > 100,
       'worst=' + worst.toExponential(2) + ' at spokeRate=' + (worstAt == null ? '∅' : worstAt.toFixed(4)) + ' over ' + n + ' pts');
  }

  // LEG 2 — SIGNED PHANTOM: apparentRate < 0 just below the strobe (the wheel runs BACKWARD), > 0 just
  // above (forward), EXACTLY 0 at coincidence. The magnitude still matches reciprocalBeat in every
  // case — the sign is the wagon-wheel reversal, not a symmetric number.
  {
    const below = apparentRateOf(strobe - 1, strobe);     // just below ⇒ backward
    const above = apparentRateOf(strobe + 1, strobe);     // just above ⇒ forward
    const at = apparentRateOf(strobe, strobe);            // coincidence ⇒ frozen
    const magBelow = Math.abs(Math.abs(below) - reciprocalBeat(strobe - 1, strobe)) < 1e-9;
    const magAbove = Math.abs(Math.abs(above) - reciprocalBeat(strobe + 1, strobe)) < 1e-9;
    ck('2 · signed phantom: apparent < 0 below the strobe (BACKWARD), > 0 above, === 0 at coincidence; |·| still matches the beat',
       below < 0 && above > 0 && at === 0 && magBelow && magAbove,
       'below=' + below.toFixed(3) + ' above=' + above.toFixed(3) + ' at=' + at);
  }

  // LEG 3 — NEG-CONTROL (COINCIDENCE, load-bearing): strobe===spokeRate (p₁===p₂) drives BOTH halves
  // to the no-beat limit — apparentRate === 0 EXACTLY and spacingTwoPitch === Infinity — so a vacuous
  // "always beats / always drifts" classifier provably FAILS. The absence of a beat is the right
  // answer, reported as a clean limit (never NaN).
  {
    let allZero = true, allInf = true, noNaN = true;
    for (const s of [12, 18, 24, 30, 36]){
      const ap = apparentRateOf(s, s);
      const sp = spacingTwoPitch(1 / s, 1 / s);
      if (ap !== 0) allZero = false;
      if (sp !== Infinity) allInf = false;
      if (Number.isNaN(ap) || Number.isNaN(sp)) noNaN = false;
    }
    // the classifier bites: every OFF-coincidence point in-band DOES beat (apparent ≠ 0, spacing finite),
    // so "always beats" is not vacuously true — it is exactly the coincidence point that falsifies it.
    const offBeats = apparentRateOf(20, 24) !== 0 && spacingTwoPitch(1 / 20, 1 / 24) !== Infinity;
    ck('3 · coincidence neg-control: apparent === 0 AND spacing === Infinity at p₁===p₂ (both halves flat); off-coincidence beats',
       allZero && allInf && noNaN && offBeats,
       'apparent===0 ' + allZero + ' · spacing===∞ ' + allInf + ' · no NaN ' + noNaN + ' · off-coincidence beats ' + offBeats);
  }

  // LEG 4 — ANTI-CIRCULARITY: the two lifted blocks are code-disjoint. (Re-proven structurally in the
  // Node twin against the file text; here we assert the simple behavioural fact that each half can be
  // evaluated independently and the magnitudes still coincide — the sharing is a fact, not a call.)
  {
    const apHalf = Math.abs(apparentRateOf(20, 24));      // TIME half alone
    const beatHalf = reciprocalBeat(20, 24);              // SPACE half alone
    ck('4 · code-disjoint coincidence: the TIME half and the SPACE half, evaluated independently, agree < 1e-9',
       Math.abs(apHalf - beatHalf) < 1e-9,
       '|apparent|=' + apHalf.toFixed(6) + ' reciprocalBeat=' + beatHalf.toFixed(6));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  // CORE A — the wheel (sampling-theorem)
  foldedFreq, apparentRate,
  // CORE B — the gratings (moire-bench)
  spacingTwoPitch,
  // the adapter + self-test
  reciprocalBeat, apparentRateOf, inFundamentalBand, sharedFold,
  STROBE_REF, SPOKE_MIN, SPOKE_MAX, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region
// above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('The Fold They Share — core self-test: ' + r.passed + '/' + r.total +
    (r.ok ? ' ✓' : ' ✗ ' + r.checks.filter(c => !c.pass).map(c => c.name).join(',')));
  process.exit(r.ok ? 0 : 1);
}
