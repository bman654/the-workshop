// ============================================================================
//  THE ENDLESS STAIRCASE — the STAIRCASE CORE: the sole authority for the claim
//  "a tone can climb forever and never leave the room." This module owns the
//  Shepard/Risset endless-glissando physics — pure, dependency-free (DOM-free):
//
//    • A bank of sine partials sits one octave apart: fₖ = f₀·2^(k + θ/12), where
//      θ is the dial's reading in SEMITONES (unbounded — it climbs forever). A
//      FIXED Gaussian-in-log-frequency BELL weights each partial's amplitude:
//      partials near the centre of hearing bloom loud, partials at the edges fade
//      to nothing. As θ climbs, every partial slides up THROUGH the stationary
//      bell — a new faint partial wakes at the bottom exactly as the top one dies.
//
//    • THE ILLUSION, made literal: octave spacing means a 12-semitone shift maps
//      partial k onto where partial (k+1) just was — to the BIT (same IEEE-754
//      double). The bell is a pure function of frequency, so the amplitude lands
//      identically too. So shPartials(θ) and shPartials(θ+12) are the SAME
//      {f, a} multiset: the chord folds home every octave while the dial counter
//      keeps climbing. The spectral centroid (in log₂-Hz, where the bell is
//      symmetric) therefore stays inside a bounded band and returns exactly to
//      its start at θ=12. The tone rises endlessly yet never leaves the room.
//
//    • THE NEGATIVE CONTROL (the LADDER): remove the bell — give every partial a
//      FLAT unit amplitude — and the SAME partials, the SAME octave spacing, no
//      longer fold. The centroid climbs strictly monotonically, exactly +1 octave
//      per octave-shift, and EXITS the band: the tone just climbs and leaves. The
//      loop is born of the FIXED BELL, not the octave spacing.
//
//  This STAIRCASE CORE single-sources the pitch anchor from ../pitch-core.mjs
//  (semiToFreq — f₀ = C0 = semiToFreq(−48), never re-typed). The Endless Staircase
//  page (the-endless-staircase/index.html) inlines a BYTE-TWIN of both the PITCH
//  CORE slice and the STAIRCASE CORE slice between the sentinels below,
//  char-for-char; the Node twin (core.test.mjs) re-extracts each slice and asserts
//  parity, re-derives the anchor, and runs the same four self-test legs. The
//  in-page pill and the Node twin both call THIS runStaircaseSelfTest, so
//  "self-test green" cannot drift. The audio-lens ear-check (verify.sh) renders
//  the SAME shPartials() law offline and confirms the SOUND matches the math.
//
//  Cycle #177 — a seen-and-heard auditory-illusion leaf of the Sound Garden.
// ============================================================================

// ===== PITCH CORE (inlined byte-twin) BEGIN =====
const MIDDLE_C_HZ = 261.625565;            // the ONE pitch anchor literal
function semiToFreq(semi){ return MIDDLE_C_HZ * Math.pow(2, semi/12); }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function noteName(semi){ const o=4+Math.floor(semi/12); const i=((semi%12)+12)%12; return NOTE_NAMES[i]+o; }
// ===== PITCH CORE END =====

// ===== STAIRCASE CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: this block names MIDDLE_C_HZ / semiToFreq only through the PITCH
// CORE slice inlined directly above it (in both the module and the page), so the
// page can paste this verbatim regardless of load order and no Hz literal is
// re-typed inside the slice (the anchor is DERIVED: SH_F0 = semiToFreq(−48)).

// the bank's lowest partial — C0, DERIVED from the pitch anchor (semiToFreq(−48),
// four octaves below middle C). NO new Hz literal: the anchor is single-sourced.
const SH_F0 = MIDDLE_C_HZ / 16;            // = semiToFreq(−48) = C0 ≈ 16.35 Hz
// nine octave-spaced partials (k = 0..8 ⇒ C0..C8) span the audible bell.
const SH_N = 9;
// the bell centre, in log₂-Hz: MIDDLE C (semiToFreq(0)), which is the GEOMETRIC
// MIDDLE rung of the C0..C8 bank (k = 4). DERIVED from the anchor (one fixed
// mid-screen glow) — NO new literal. Centring the bell in the bank is what makes
// the illusion symmetric: the loud partials are flanked equally above and below,
// so the recycled chord folds home exactly and the flat ladder escapes cleanly.
const SH_LOG_CTR = Math.log2(semiToFreq(0));
// the bell width in OCTAVES (log₂ units) — a free timbre dial, ear-tuned in build:
// 1.8 gives a rich ~8-partial chord, a visibly-bounded band (~0.10 oct wide), and
// a ~0.9-octave clear margin for the flat-ladder escape (the negative control).
const SH_SIGMA = 1.8;

// THE FIXED BELL — a Gaussian in log₂-frequency, pinned forever at SH_LOG_CTR.
// The amplitude you SEE (the glow-band) and the amplitude you HEAR are this one
// function. x is the partial's distance from centre in OCTAVES.
function shEnvelope(fHz){
  const x = Math.log2(fHz) - SH_LOG_CTR;
  return Math.exp(-(x*x) / (2 * SH_SIGMA * SH_SIGMA));
}

// the fractional part of a real number (in [0,1)). The recycling operator: the
// ILLUSION reads its phase as frac(θ/12), so a partial that climbs out the top is
// reborn at the bottom and the partial set is GENUINELY PERIODIC in θ (period 12).
function shFrac(x){ return x - Math.floor(x); }

// THE ONE PARTIAL SET every surface consumes — the synth, the helix, the pill,
// the Node twin, the offline render. theta is in SEMITONES (unbounded — it climbs
// forever). The two constructions, selected by `flat`, ARE the illusion vs its
// negative control:
//   • ILLUSION (flat = false): phase = frac(θ/12) — the rising chord RECYCLES.
//     A partial climbing past the top is reborn at the bottom, so shPartials(θ)
//     and shPartials(θ+12) are the SAME {f, a} multiset to the bit. The fixed bell
//     weights it: the chord folds home every octave while the dial counter climbs.
//   • LADDER (flat = true): phase = θ/12 — the SAME nine partials, FLAT amplitude,
//     but NO recycling: a single rigid stack that just keeps climbing. The bell is
//     gone AND the wrap is gone — together they are the illusion; strip them and
//     the tone climbs out of the room and never returns.
function shPartials(theta, { flat = false } = {}){
  const phase = flat ? (theta/12) : shFrac(theta/12);
  const out = [];
  for (let k = 0; k < SH_N; k++){
    const f = SH_F0 * Math.pow(2, k + phase);
    const a = flat ? 1 : shEnvelope(f);
    out.push({ k, f, a });
  }
  return out;
}

// the spectral centroid in LOG₂-Hz (the bell is symmetric there): the amplitude-
// weighted mean of log₂(f) over the partial set. The number the band-test tracks.
function centroidLog2(theta, opts){
  const ps = shPartials(theta, opts);
  let num = 0, den = 0;
  for (const p of ps){ num += p.a * Math.log2(p.f); den += p.a; }
  return den > 0 ? num/den : 0;
}

// THE BAND — DERIVED, not a magic number: the min/max of the ILLUSION centroid
// over a fine 0→12 sweep, padded by a tiny epsilon. The pill, the Node twin, and
// verify.sh all assert against THESE bounds, so they cannot disagree.
const CENTROID_BAND = (() => {
  let lo = Infinity, hi = -Infinity;
  const STEPS = 2400;
  for (let i = 0; i <= STEPS; i++){
    const c = centroidLog2((i/STEPS) * 12, { flat: false });
    if (c < lo) lo = c;
    if (c > hi) hi = c;
  }
  const eps = 1e-9;
  return { lo: lo - eps, hi: hi + eps };
})();

// ── runStaircaseSelfTest() — the SOLE ORACLE. Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS, so they cannot disagree. Four legs prove the illusion exact.
function runStaircaseSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // LEG A — CYCLIC TO THE BIT: for EVERY phase θ ∈ {0..11} (and the half-steps
  //   between), the ILLUSION partial set at θ+12 is the SAME {f, a} multiset as at
  //   θ. Because the illusion reads phase = frac(θ/12) and frac(θ/12) = frac((θ+12)/12)
  //   to the bit, every rung's frequency is the identical IEEE-754 double; the bell
  //   is a pure function of frequency ⇒ the identical amplitude. The recycling wrap
  //   closes the loop at every phase, not only zero. (Half-steps are tested too so
  //   this is not merely an integer-grid coincidence.)
  {
    let ok = true, worstA = 0, worstR = 0;
    const phases = [];
    for (let i = 0; i < 24; i++) phases.push(i * 0.5);   // 0, 0.5, 1, … 11.5
    for (const theta of phases){
      const lo = shPartials(theta);
      const hi = shPartials(theta + 12);
      for (let k = 0; k < SH_N; k++){
        const a = lo[k], b = hi[k];
        const ratio = a.f / b.f;                         // should be exactly 1
        const da = Math.abs(a.a - b.a);
        worstR = Math.max(worstR, Math.abs(ratio - 1));
        worstA = Math.max(worstA, da);
        if (Math.abs(ratio - 1) >= 1e-9 || da >= 1e-9) ok = false;
      }
    }
    T('LEG A — cyclic to the bit: at EVERY phase θ (24 phases over an octave, integers AND half-steps), the illusion\'s partial set at θ+12 is the SAME {f, a} multiset as at θ — the recycling wrap (phase = frac(θ/12)) makes every rung the identical IEEE-754 double and the fixed bell gives the identical amplitude; the chord folds home at every phase, not only zero',
      ok, ok ? `24 phases × ${SH_N} rungs identical: worst freq-ratio dev ${worstR.toExponential(2)} · worst Δamp ${worstA.toExponential(2)} (both < 1e-9)`
             : `mismatch — worst ratio dev ${worstR.toExponential(2)} · worst Δamp ${worstA.toExponential(2)}`);
  }

  // LEG B — CENTROID BANDED & PERIODIC: across a fine 0→12 sweep the ILLUSION
  //   centroid stays inside CENTROID_BAND, and it returns EXACTLY to its start at
  //   θ=12 (|c(12) − c(0)| < 1e-9). The tone climbs forever yet the brightness
  //   never escapes a fixed window and resets every octave.
  {
    let inBand = true, worst = 0;
    const STEPS = 1200;
    for (let i = 0; i <= STEPS; i++){
      const c = centroidLog2((i/STEPS) * 12, { flat: false });
      if (c < CENTROID_BAND.lo || c > CENTROID_BAND.hi){ inBand = false; }
    }
    const c0 = centroidLog2(0, { flat: false });
    const c12 = centroidLog2(12, { flat: false });
    const residual = Math.abs(c12 - c0);
    const ok = inBand && residual < 1e-9;
    const widthOct = CENTROID_BAND.hi - CENTROID_BAND.lo;
    T('LEG B — centroid banded & periodic: across the full 0→12 glissando the illusion\'s spectral centroid stays inside a bounded band and returns EXACTLY to its start at θ=12 — the brightness never escapes a fixed window and resets every octave',
      ok, ok ? `band width ${widthOct.toFixed(4)} oct · cycle residual |c(12)−c(0)| = ${residual.toExponential(2)} (< 1e-9)`
             : `inBand=${inBand} · residual ${residual.toExponential(2)} · band width ${widthOct.toFixed(4)} oct`);
  }

  // LEG C — NEG-CONTROL ESCAPES (the load-bearing discriminator): the LADDER
  //   (flat envelope, same partials, same spacing) climbs STRICTLY monotonically
  //   and exactly +1 octave per octave-shift, so it EXITS the band. The loop is
  //   born of the FIXED BELL, not the octave spacing.
  {
    const cf0 = centroidLog2(0, { flat: true });
    const cf12 = centroidLog2(12, { flat: true });
    const perOctaveErr = Math.abs((cf12 - cf0) - 1);          // should be exactly +1 octave
    // strictly increasing across the sweep
    let strictlyUp = true, prev = -Infinity;
    const STEPS = 240;
    for (let i = 0; i <= STEPS; i++){
      const c = centroidLog2((i/STEPS) * 12, { flat: true });
      if (c <= prev) strictlyUp = false;
      prev = c;
    }
    // and it leaves the illusion's band before θ=12
    const escapes = cf12 > CENTROID_BAND.hi;
    const ok = perOctaveErr < 1e-9 && strictlyUp && escapes;
    T('LEG C — the negative control escapes: the LADDER (flat envelope, SAME partials & octave spacing, bell removed) climbs strictly monotonically and exactly +1 octave per octave-shift, exiting the band — the loop is born of the fixed bell, not the spacing',
      ok, ok ? `flat centroid rose exactly +1 oct/octave (err ${perOctaveErr.toExponential(2)}) · strictly increasing · escaped band top by ${(cf12 - CENTROID_BAND.hi).toFixed(3)} oct`
             : `perOctaveErr ${perOctaveErr.toExponential(2)} · strictlyUp=${strictlyUp} · escapes=${escapes}`);
  }

  // LEG D — ALWAYS A BOUNDED CHORD: at every step of the illusion at least three
  //   partials carry audible amplitude (a > 0.05) and no partial exceeds 1 (the
  //   bell peak) — the tone never fades to silence nor spikes, so the additive sum
  //   + compressor cannot clip the offline render.
  {
    let ok = true, minAudible = Infinity, maxAmp = 0;
    const STEPS = 600;
    for (let i = 0; i <= STEPS; i++){
      const ps = shPartials((i/STEPS) * 12, { flat: false });
      let audible = 0;
      for (const p of ps){ if (p.a > 0.05) audible++; if (p.a > maxAmp) maxAmp = p.a; }
      minAudible = Math.min(minAudible, audible);
      if (audible < 3 || ps.some(p => p.a > 1 + 1e-12)) ok = false;
    }
    T('LEG D — always a bounded chord: at every step ≥3 partials carry audible amplitude (a > 0.05) and no partial exceeds the bell peak (a ≤ 1) — the tone never fades to silence nor spikes, so the additive sum cannot clip',
      ok, ok ? `min audible partials per step ${minAudible} (≥3) · max amplitude ${maxAmp.toFixed(4)} (≤1)`
             : `minAudible ${minAudible} · maxAmp ${maxAmp.toFixed(4)}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== STAIRCASE CORE END =====

export {
  MIDDLE_C_HZ, semiToFreq, noteName,
  SH_F0, SH_N, SH_LOG_CTR, SH_SIGMA,
  shEnvelope, shFrac, shPartials, centroidLog2, CENTROID_BAND,
  runStaircaseSelfTest,
};
