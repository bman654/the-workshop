// ============================================================================
//  THE BEATING BENCH — the BEAT CORE: the sole authority for the claim
//  "consonance is the place where the beating stops." Pure, dependency-free
//  (DOM-free). This module owns the bench's NEW physics:
//
//    • beatRate(f0, ratio, nPartials) — the AUDIBLE beat rate between the
//      nearest-frequency pair of partials of a steady DRONE (at f0, harmonics
//      k·f0) and a DRAGGED tone (at f0·ratio, harmonics k·f0·ratio). The throb
//      you hear IS |f_lo − f_hi| of that closest pair. At a JUST ratio p/q the
//      drone's p-th partial and the dragged tone's q-th partial land on the
//      SAME frequency (p·f0), so the nearest-pair beat is EXACTLY 0 — the throb
//      dies to silence. Detune off the ratio and that pair separates and beats.
//
//    • nearestStillZone(ratio) — which named just interval (P5, M3, …) the
//      dragged ratio is closest to. Delegates to ../pitch-core.mjs's
//      nearestJustName (single-sourced — the ratios are NOT re-typed here).
//
//  This BEAT CORE REUSES the just-interval lattice (JUST_SET / JUST_NAME /
//  nearestDev / nearestJustName) and the pitch law (cents / foldToOctave) from
//  ../pitch-core.mjs's OUT OF TUNE CORE + COMMA CORE blocks — it does NOT
//  re-type a single ratio. The Beating Bench page (the-beating-bench/index.html)
//  inlines a BYTE-TWIN of the BEAT CORE slice between the sentinels below; its
//  Node twin (core.test.mjs) re-extracts that slice and asserts it is char-for-
//  char this module, AND that the page's inlined OUT OF TUNE CORE slice is
//  char-for-char ../pitch-core.mjs. The in-page pill and the Node twin both call
//  THIS runBeatSelfTest, so "self-test green" cannot drift.
// ============================================================================

import {
  JUST_SET, JUST_NAME, nearestDev, nearestDevAbs, nearestJustName,
  foldToOctave, cents,
} from '../pitch-core.mjs';

// ===== BEAT CORE (inlined byte-twin) BEGIN =====
// A DRONE at f0 carries harmonic partials at k·f0 (k = 1..N). A second tone
// DRAGGED to f0·ratio carries partials at k·f0·ratio. Two partials — one from
// each voice — that are CLOSE in frequency interfere and BEAT at the difference
// of their frequencies; the SLOWEST, most-audible throb is the one between the
// NEAREST such pair. This is the bench's central physics: it is computed HERE
// once and shared by the page's needle + the test, so the seen and heard agree.

// the default partial count we listen across (drone & dragged both get 1..N).
const N_PARTIALS = 8;

// build the ascending partial frequencies of a voice: [g, 2g, …, N·g].
function partials(g, n = N_PARTIALS) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push(k * g);
  return out;
}

// the NEAREST-PARTIAL BEAT: scan every (drone-partial, dragged-partial) pair and
// return the SMALLEST |Δf| among pairs that are within a perceptual-roughness
// window of each other (a partial only beats audibly against a near neighbour —
// partials a wide interval apart are heard as separate tones, not a throb). The
// window is set in PROPORTION to f0 so it scales with register. Returns the beat
// rate in Hz (≥ 0); 0 means a pair coincided exactly (a just ratio's silence).
function beatRate(f0, ratio, n = N_PARTIALS) {
  const droneP = partials(f0, n);
  const dragP = partials(f0 * ratio, n);
  const window = f0;                 // pairs farther apart than f0 don't throb as one
  let best = Infinity;
  for (const a of droneP) {
    for (const b of dragP) {
      const d = Math.abs(a - b);
      if (d <= window && d < best) best = d;
    }
  }
  // if no pair fell inside the window (shouldn't happen for ratios in [1,2]),
  // fall back to the globally nearest pair so the function is total.
  if (best === Infinity) {
    for (const a of droneP) for (const b of dragP) {
      const d = Math.abs(a - b); if (d < best) best = d;
    }
  }
  return best;
}

// the frequencies of the nearest-beating pair (for the page's two sliding
// traces): returns { fLo, fHi, beat } where beat === |fHi − fLo| === beatRate.
function nearestPair(f0, ratio, n = N_PARTIALS) {
  const droneP = partials(f0, n);
  const dragP = partials(f0 * ratio, n);
  const window = f0;
  let best = Infinity, fa = droneP[0], fb = dragP[0];
  for (const a of droneP) for (const b of dragP) {
    const d = Math.abs(a - b);
    if (d <= window && d < best) { best = d; fa = a; fb = b; }
  }
  if (best === Infinity) for (const a of droneP) for (const b of dragP) {
    const d = Math.abs(a - b); if (d < best) { best = d; fa = a; fb = b; }
  }
  const fLo = Math.min(fa, fb), fHi = Math.max(fa, fb);
  return { fLo, fHi, beat: fHi - fLo };
}

// WHICH just ratios actually fall SILENT depends on how many partials we listen
// across: a ratio reaches a dead stop only when SOME drone partial coincides with
// SOME dragged partial WITHIN the N we hear. A simple ratio p/q (in lowest terms)
// first coincides at drone-partial p ≡ dragged-partial q (both at p·f0); if either
// p or q exceeds N that coincidence is never reached, so the interval keeps a
// residual throb. So the SILENT islands are exactly the SIMPLE-ratio just
// intervals — which, beautifully, ARE the classical consonances (unison, m3, M3,
// P4, P5, m6, M6, octave) — while the complex just ratios (m2 16/15, M2 9/8, the
// tritone 45/32, m7 9/5, M7 15/8) never still: dissonance is the throb that won't die.
// We DERIVE this set from beatRate itself (no re-typed list): a JUST_SET member is
// "still" iff its nearest-pair beat is 0 at the bench's partial count.
function silentZoneIndices(f0, n = N_PARTIALS) {
  const idx = [];
  for (let i = 0; i < JUST_SET.length; i++) {
    if (beatRate(f0, JUST_SET[i], n) < 1e-7) idx.push(i);
  }
  return idx;
}

// which named just interval the dragged ratio is closest to (the lit still-zone's
// label) — and the signed/abs cents deviation to it. Single-sourced: the ratio
// set + names + nearestJustName all come from ../pitch-core.mjs; NOT re-typed.
function nearestStillZone(ratio) {
  const folded = foldToOctave(ratio);
  return {
    name: nearestJustName(folded),
    dev: nearestDev(folded),
    devAbs: nearestDevAbs(folded),
  };
}

// the still-zones, as renderable bands: each just ratio in [1,2] with its name,
// its ratio, its centre in cents, and whether it falls SILENT at the bench's
// partial count (the lit islands) or keeps a residual throb (a dim, dissonant tick).
function stillZones(f0, n = N_PARTIALS) {
  const silent = new Set(silentZoneIndices(f0, n));
  const zones = [];
  for (let i = 0; i < JUST_SET.length; i++) {
    zones.push({
      name: JUST_NAME[i], ratio: JUST_SET[i], cents: cents(JUST_SET[i]),
      silent: silent.has(i),
    });
  }
  return zones;
}

// a syntonic-comma-detuned ditone: a JUST major third (5/4) NUDGED by 81/80 (the
// syntonic comma) lands on the Pythagorean ditone 81/64 — visually "almost M3",
// but it is NOT a JUST_SET member, so its nearest partials do NOT coincide and it
// STILL THROBS. This is the load-bearing negative control (defined HERE, used by
// the page's "compare" button and asserted nonzero by the test): true stillness
// cannot be faked by snapping to the nearest semitone or by mere visual proximity.
const SYNTONIC_COMMA = 81 / 80;
const JUST_M3 = 5 / 4;
const DITONE = JUST_M3 * SYNTONIC_COMMA;     // = 81/64, the Pythagorean ditone

// ── runBeatSelfTest(f0) — the SOLE ORACLE. Same shape as the sibling benches:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS so they cannot disagree. f0 is the drone's fundamental (Hz); the
// claims are scale-free but a concrete f0 makes the detail numbers legible.
function runBeatSelfTest(f0 = 220) {
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const EPS = 1e-9;

  // LEG 1 — the heard beat IS |Δf| of the nearest partial pair: beatRate equals
  //   the difference of the two frequencies nearestPair reports, to the bit, for a
  //   sweep of detuned ratios. The needle reads the same number the traces show.
  {
    let ok = true, worst = 0;
    for (let k = 0; k <= 200; k++) {
      const r = 1 + k / 200;                  // ratios across the whole octave [1,2]
      const br = beatRate(f0, r);
      const np = nearestPair(f0, r);
      const d = Math.abs(br - np.beat);
      worst = Math.max(worst, d);
      if (d > EPS) ok = false;
    }
    T('LEG 1 — needle = |Δf|: the beat rate === |fHi − fLo| of the nearest partial pair, to the bit, across the whole octave — what you HEAR is what the two traces SHOW',
      ok, ok ? `worst |beatRate − |Δf|| = ${worst.toExponential(2)} Hz over 201 ratios`
             : `a ratio disagreed (worst ${worst.toExponential(2)} Hz)`);
  }

  // LEG 2 — islands of stillness ARE the consonances: at each SIMPLE-ratio just
  //   interval (p,q ≤ N) the nearest partial pair coincides, so beatRate is
  //   EXACTLY 0 (to ε) — and these are precisely the classical consonances
  //   (unison, m3, M3, P4, P5, m6, M6, octave). The COMPLEX just ratios
  //   (m2, M2, tritone, m7, M7) keep a residual throb: dissonance never stills.
  {
    const silent = silentZoneIndices(f0);
    const silentNames = silent.map(i => JUST_NAME[i]);
    const EXPECT_SILENT = ['unison', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'octave'];
    let zeroOK = true, worstZero = 0;
    for (const i of silent) { const br = beatRate(f0, JUST_SET[i]); worstZero = Math.max(worstZero, br); if (br > EPS) zeroOK = false; }
    // every NON-silent just ratio MUST keep a real throb (load-bearing: the set is
    // not silent-by-default — the complex ratios are provably still beating).
    let throbOK = true, minThrob = Infinity;
    for (let i = 0; i < JUST_SET.length; i++) if (!silent.includes(i)) {
      const br = beatRate(f0, JUST_SET[i]); minThrob = Math.min(minThrob, br); if (br <= 1e-3) throbOK = false;
    }
    const setOK = silentNames.length === EXPECT_SILENT.length &&
      EXPECT_SILENT.every((n, k) => silentNames[k] === n);
    T('LEG 2 — islands of stillness: the just ratios that beat EXACTLY 0 (to ε) are precisely the classical consonances (unison · m3 · M3 · P4 · P5 · m6 · M6 · octave) — and EVERY complex just ratio keeps a residual throb (dissonance never stills)',
      zeroOK && throbOK && setOK,
      (zeroOK && throbOK && setOK)
        ? `silent: ${silentNames.join(' · ')} (all 0 Hz, worst ${worstZero.toExponential(2)}) · the rest throb ≥ ${minThrob.toFixed(2)} Hz`
        : `silentSet=[${silentNames.join(',')}] zeroOK=${zeroOK} throbOK=${throbOK} (min throb ${minThrob.toFixed(2)})`);
  }

  // LEG 3 — named islands: at each SILENT just ratio nearestStillZone names the
  //   SAME interval pitch-core's nearestJustName returns for the FOLDED ratio,
  //   with 0¢ deviation — the lit island's label is single-sourced, not re-typed.
  //   (The octave 2/1 folds to 1/1; the page lays the octave island at the rail's
  //   far end explicitly, so here we name the ratios just inside the octave.)
  {
    let ok = true, mism = '';
    for (let i = 0; i < JUST_SET.length; i++) {
      const r = JUST_SET[i];
      const folded = foldToOctave(r);
      if (folded === 1 && r !== 1) continue;     // 2/1 folds to unison — handled by the rail, not named here
      const z = nearestStillZone(r);
      const want = JUST_NAME[i];
      if (z.name !== want) { ok = false; mism = `${r} → ${z.name} ≠ ${want}`; }
      if (z.devAbs > EPS) ok = false;            // at a just ratio the dev to itself is 0
    }
    T('LEG 3 — named islands: at each in-octave just ratio nearestStillZone\'s name === the index-aligned JUST_NAME member (P5, M3, P4…) with 0¢ deviation — the label is single-sourced to pitch-core, never re-typed',
      ok, ok ? `all in-octave just ratios name-match nearestJustName at 0¢ deviation`
             : `mismatch: ${mism}`);
  }

  // LEG 4 — NEGATIVE CONTROL (load-bearing): the syntonic-comma-detuned ditone
  //   (just M3 × 81/80 = 81/64) is NOT a just-set member, so its nearest partials
  //   do NOT coincide — it STILL THROBS (beatRate nonzero). "In tune" cannot be
  //   faked by visual proximity to M3: only the true 5/4 reaches silence.
  {
    const brJust = beatRate(f0, JUST_M3);          // 5/4 → silence
    const brDit  = beatRate(f0, DITONE);           // 81/64 → still beats
    const ditCents = cents(DITONE / JUST_M3);      // the syntonic comma, in cents (~21.5¢)
    const ok = brJust <= EPS && brDit > 1e-3 &&
               Math.abs(ditCents - 21.506) < 0.01; // syntonic comma = 21.506¢
    T('LEG 4 — negative control: the just M3 (5/4) reaches DEAD SILENCE, but nudging it by the syntonic comma 81/80 → 81/64 STILL THROBS (nonzero) — proximity to M3 cannot fake stillness; only the true ratio is silent',
      ok, ok ? `5/4 beats ${brJust.toExponential(2)} Hz (silent) · 81/64 beats ${brDit.toFixed(3)} Hz (throb) · the nudge is ${ditCents.toFixed(3)}¢`
             : `5/4 ${brJust.toExponential(2)} / 81/64 ${brDit.toFixed(3)} / comma ${ditCents.toFixed(3)}¢`);
  }

  // LEG 5 — the throb QUICKENS as you drag away and SLOWS to a stop returning:
  //   sweeping the ratio toward a just island, |beatRate| decreases monotonically
  //   to 0 at the island and increases leaving it — the dead stop is a true minimum.
  //   (Checked around the P5 at 3/2: the beat is 0 there and strictly positive on
  //   both sides for a small neighbourhood.)
  {
    const P5 = 3 / 2;
    const atP5 = beatRate(f0, P5);
    let monoUp = true, monoDown = true, prevUp = -1, prevDown = -1;
    for (let k = 1; k <= 40; k++) {
      const e = k * 0.0008;                        // small detune fraction
      const up = beatRate(f0, P5 * (1 + e));
      const dn = beatRate(f0, P5 * (1 - e));
      if (up <= prevUp - EPS) monoUp = false;       // beat grows leaving on the sharp side
      if (dn <= prevDown - EPS) monoDown = false;    // …and on the flat side
      prevUp = up; prevDown = dn;
    }
    const ok = atP5 <= EPS && monoUp && monoDown &&
               beatRate(f0, P5 * 1.01) > atP5 && beatRate(f0, P5 * 0.99) > atP5;
    T('LEG 5 — a true minimum: the beat is 0 AT the P5 (3/2) and grows STRICTLY on both sides as you drag away — the silence is a real dead-stop you slow into, not a flat plateau',
      ok, ok ? `beat at 3/2 = ${atP5.toExponential(2)} Hz · grows both sides (monotone ✓) · +1% → ${beatRate(f0, P5*1.01).toFixed(2)} Hz`
             : `atP5 ${atP5.toExponential(2)} · monoUp ${monoUp} monoDown ${monoDown}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== BEAT CORE END =====

export {
  N_PARTIALS, partials, beatRate, nearestPair, nearestStillZone, stillZones,
  silentZoneIndices, SYNTONIC_COMMA, JUST_M3, DITONE, runBeatSelfTest,
};
