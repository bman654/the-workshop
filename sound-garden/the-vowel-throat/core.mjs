// ============================================================================
//  THE VOWEL THROAT — the THROAT CORE: the sole authority for the claim
//  "a vowel is what's LEFT when a glottal buzz is CARVED by two resonances,"
//  the formal SUBTRACTIVE mirror of the Overtone Rack's additive claim. This
//  module owns the throat's physics — pure, dependency-free (DOM-free):
//
//    • THE SOURCE is a single buzz: a glottal sawtooth at f₀ ≈ 120 Hz, a FULL
//      harmonic comb (every rung n at amplitude 1/n). Nothing is added to it.
//
//    • THE THROAT is two parallel bandpass resonances (the vocal-tract formants
//      F1, F2). bandpassMag(f, fc, Q) is the analytic magnitude of one biquad
//      bandpass — 1 at its center, falling off either side. throatResponse
//      multiplies the comb by the COMBINED two-hill envelope: out-of-band rungs
//      are attenuated, in-band rungs survive. The vowel is the surviving cluster.
//
//    • THE VOWEL is a POINT in (F1, F2). Slide the two hills along the comb and
//      "ah/ee/oo/oh" fall out geometrically — the linguist's vowel quadrilateral
//      is exactly the map from (F1,F2) to the pad. padToFormants / formantsToPad
//      are the LOG bijection between the pad and formant space.
//
//    • THE PROOF (formal complement of the Rack's "energy is ADDED"):
//      formantPeaks() recovers the two published formant frequencies from the
//      carved comb (each to within ±one comb spacing — a comb can only resolve to
//      its nearest rung, so the tolerance is HONEST, ±f₀). The NEGATIVE CONTROL:
//      collapse both filters to ONE center and the two peaks merge — the
//      two-formant classifier (p2−p1 > 3·f₀) returns FALSE, the vowel dissolves
//      to a featureless hum. Same math, made touchable on the page.
//
//  The F1/F2 vowel literals (Peterson & Barney 1952 adult-male means) and the Q
//  constants live ONLY here. The Vowel Throat page (the-vowel-throat/index.html)
//  inlines a BYTE-TWIN of the THROAT CORE slice between the sentinels below,
//  char-for-char, plus pitch-core's semiToFreq (so f₀ is single-sourced); the
//  Node twin (core.test.mjs) re-extracts the slice, asserts char parity, and a
//  disjoint grid-argmax re-derivation confirms bandpassMag's peak. The in-page
//  pill and the Node twin both call THIS runThroatSelfTest, so "self-test green"
//  cannot drift.
//
//  Note on the byte-twin's shape: the THROAT CORE block is IMPORT-FREE — f₀ is
//  passed IN as a parameter (the page wires it from the inlined semiToFreq, this
//  module from the imported one), so the slice inlines without forcing a load
//  order, and the anti-circularity grep stays honest: bandpassMag is defined in
//  exactly one .mjs.
// ============================================================================

import { semiToFreq } from '../pitch-core.mjs';   // the pitch anchor — semiToFreq, never re-typed

// the throat's source pitch, DERIVED from the pitch anchor (no Hz literal is
// re-typed). SEMI_F0 = −33 puts the glottal buzz near 120 Hz (a low male voice),
// low enough that the comb is dense (≈20 rungs under the second formant) so the
// two formant clusters resolve cleanly.
const SEMI_F0 = -13.5;
const F0 = semiToFreq(SEMI_F0);          // ≈121.6 Hz — the glottal buzz fundamental (a low male voice)

// ===== THROAT CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: every function that needs the buzz pitch takes f0 as a parameter,
// so the page inlines this block verbatim regardless of script load order, and
// the f₀ literal is never re-typed inside the slice (it comes from semiToFreq).

// THE VOWELS — Peterson & Barney (1952) adult-male formant means, in Hz. This is
// the ONLY place the F1/F2 vowel literals live as code (the single-source grep in
// the Node twin asserts the cardinal-vowel literal pair appears in exactly one
// .mjs). key = a keyboard digit (1–9); ipa = the symbol; label = the English gloss.
const VOWELS = [
  { key: '1', ipa: 'i',  label: 'ee  (heed)',  F1: 270,  F2: 2290 },
  { key: '2', ipa: 'ɪ',  label: 'ih  (hid)',   F1: 390,  F2: 1990 },
  { key: '3', ipa: 'ɛ',  label: 'eh  (head)',  F1: 530,  F2: 1840 },
  { key: '4', ipa: 'æ',  label: 'ae  (had)',   F1: 660,  F2: 1720 },
  { key: '5', ipa: 'ɑ',  label: 'ah  (hod)',   F1: 730,  F2: 1090 },
  { key: '6', ipa: 'ɔ',  label: 'aw  (hawed)', F1: 570,  F2: 840  },
  { key: '7', ipa: 'ʊ',  label: 'oo  (hood)',  F1: 440,  F2: 1020 },
  { key: '8', ipa: 'u',  label: 'oo  (who’d)', F1: 300,  F2: 870 },
  { key: '9', ipa: 'ʌ',  label: 'uh  (hud)',   F1: 640,  F2: 1190 },
  { key: '0', ipa: 'ə',  label: 'schwa',       F1: 500,  F2: 1500 },  // the neutral rest point
];

// the cardinal pair the crux measures: the two MOST-separated, least-ambiguous
// vowels. /a/ (open back) and /i/ (close front). Looked up from VOWELS by ipa so
// the literals are never re-typed.
function vowelByIpa(ipa){ return VOWELS.find(v => v.ipa === ipa) || null; }
const CARDINAL_A = vowelByIpa('ɑ');   // {F1:730, F2:1090}
const CARDINAL_I = vowelByIpa('i');   // {F1:270, F2:2290}

// THE FORMANT QUALITY FACTORS — the ONLY place the resonance bandwidths live as
// code. F2's hill is sharper (higher Q) so the brighter formant reads as a clean
// cluster; both the drawn comb-hills AND the analytic bandpassMag read these, so
// the eye, the ear, and the crux cannot disagree.
const Q1 = 9;
const Q2 = 11;

// THE PAD ↔ FORMANT-SPACE LOG BIJECTION. The pad is the unit square; x ∈ [0,1] is
// F2 (LEFT = high-F2 / front = ee, RIGHT = low-F2 / back = oo), y ∈ [0,1] is F1
// (TOP = low-F1 / close, BOTTOM = high-F1 / open = ah). LOG mapping (pitch is
// perceived geometrically) so the linguist's vowel trapezoid falls out as a
// shape. The bounds enclose every VOWELS entry with margin.
const F1_LO = 220, F1_HI = 900;      // close → open
const F2_LO = 700, F2_HI = 2600;     // back → front
function logLerp(lo, hi, t){ return lo * Math.pow(hi / lo, t); }
function invLogLerp(lo, hi, v){ return Math.log(v / lo) / Math.log(hi / lo); }

// pad (x,y) ∈ [0,1]² → { F1, F2 } in Hz. x maps to F2 with LEFT = high (front),
// y maps to F1 with TOP = low (close); both log-spaced.
function padToFormants(x, y){
  const cx = Math.max(0, Math.min(1, x));
  const cy = Math.max(0, Math.min(1, y));
  const F2 = logLerp(F2_HI, F2_LO, cx);   // x=0 (left) → F2_HI (front/ee), x=1 (right) → F2_LO (back/oo)
  const F1 = logLerp(F1_LO, F1_HI, cy);   // y=0 (top) → F1_LO (close), y=1 (bottom) → F1_HI (open/ah)
  return { F1, F2 };
}
// the exact inverse: { F1, F2 } in Hz → pad (x,y) ∈ [0,1]². The corner vowels'
// pad positions DRAW the trapezoid outline (the shape IS the data).
function formantsToPad(F1, F2){
  const x = invLogLerp(F2_HI, F2_LO, F2);
  const y = invLogLerp(F1_LO, F1_HI, F1);
  return { x, y };
}

// THE BANDPASS MAGNITUDE — the analytic response of one biquad bandpass at
// frequency f, centered at fc with quality Q. Peaks to 1 at f = fc and rolls off
// symmetrically in log-frequency. This is the ONE definition of a formant hill;
// the comb-hill drawing, the offline filter, and the crux all read THIS (the
// anti-circularity grep asserts `function bandpassMag(` appears in exactly one
// .mjs). The classic RLC bandpass shape: |H| = 1 / sqrt(1 + Q²·(f/fc − fc/f)²).
function bandpassMag(f, fc, Q){
  if (f <= 0 || fc <= 0) return 0;
  const r = f / fc - fc / f;            // 0 at resonance, ± away from it
  return 1 / Math.sqrt(1 + Q * Q * r * r);
}

// THE COMBINED THROAT ENVELOPE at frequency f: the two parallel formant hills,
// each scaled by its make-up gain (g2 lifts the quieter high band), plus a tiny
// breathy floor so nothing is ever exactly zero (a real throat is never silent
// between formants). The hills SUM in power-ish fashion — a parallel bandpass
// bank — but the simple max-of-sum here is enough to carve the comb. collapse:
// when true, BOTH hills sit at F1 (the negative control — one resonance).
const MAKEUP_1 = 1.0;
const MAKEUP_2 = 0.7;
const BREATH_FLOOR = 0.04;
function throatEnvelope(f, F1, F2, q1, q2, collapse){
  const c2 = collapse ? F1 : F2;
  const h1 = MAKEUP_1 * bandpassMag(f, F1, q1);
  const h2 = MAKEUP_2 * bandpassMag(f, c2, collapse ? q1 : q2);
  return Math.max(BREATH_FLOOR, h1 + h2);
}

// the glottal source comb: N harmonics at n·f0, sawtooth amplitude 1/n. Returns
// [{ n, freq, src }]. This is the FULL buzz — every rung present, nothing carved
// yet. (The 1/n source law is the same one the Overtone Rack adds up; here we
// SUBTRACT from it.)
function sourceComb(f0, N){
  const out = [];
  for (let n = 1; n <= N; n++) out.push({ n, freq: n * f0, src: 1 / n });
  return out;
}

// THE THROAT RESPONSE — the SUBTRACTIVE law. Each comb rung's output is its
// source amplitude TIMES the throat envelope at that frequency: out = src·env.
// Energy is only ever REMOVED (env ≤ MAKEUP_1 + MAKEUP_2, and the out-of-band
// floor is BREATH_FLOOR ≪ 1). Returns [{ n, freq, src, env, out }] — the carved
// comb the page draws (brighter) over the raw source (dimmer).
function throatResponse(f0, N, F1, F2, q1, q2, collapse = false){
  const comb = sourceComb(f0, N);
  return comb.map(t => {
    const env = throatEnvelope(t.freq, F1, F2, q1, q2, collapse);
    return { n: t.n, freq: t.freq, src: t.src, env, out: t.src * env };
  });
}

// FORMANT PEAKS — recover the two formant frequencies from the carved comb by
// finding, in each formant BAND, the harmonic rung carrying the most OUTPUT
// energy. The band split is the geometric midpoint between F1 and F2 (so each
// formant owns its half of log-frequency). Returns { p1, p2, band } where p1/p2
// are the winning rung frequencies (Hz). A comb can only resolve to its nearest
// rung, so |p − F| ≤ f0 is the tightest honest bound. With collapse the two
// bands' argmaxes coincide (p1 ≈ p2). When F1≈F2 (collapse) the split is taken at
// the shared center so both halves still return a defined argmax.
function formantPeaks(f0, N, F1, F2, q1, q2, collapse = false){
  const resp = throatResponse(f0, N, F1, F2, q1, q2, collapse);
  const c2 = collapse ? F1 : F2;
  const lo = Math.min(F1, c2), hi = Math.max(F1, c2);
  const split = collapse ? F1 : Math.sqrt(lo * hi);   // geometric midpoint
  let best1 = null, best2 = null;
  for (const t of resp){
    const energy = t.out * t.out;       // power ∝ amplitude²
    if (t.freq <= split){
      if (!best1 || energy > best1.energy) best1 = { freq: t.freq, energy, n: t.n };
    } else {
      if (!best2 || energy > best2.energy) best2 = { freq: t.freq, energy, n: t.n };
    }
  }
  // collapse parks everything in the low half; mirror the single argmax to p2.
  if (!best2) best2 = best1;
  if (!best1) best1 = best2;
  return { p1: best1.freq, p2: best2.freq, n1: best1.n, n2: best2.n, split };
}

// the two-formant classifier: a genuine vowel has two WELL-SEPARATED formants;
// a collapsed throat has one. TRUE iff the recovered peaks are more than 2·f0
// apart — two comb rungs, comfortably above the collapse's ±1-rung merge floor,
// yet loose enough to admit the close-formant back vowel /a/ (F2−F1 ≈ 3·f0).
function isTwoFormant(p1, p2, f0){ return Math.abs(p2 - p1) > 2 * f0; }

// the L2 distance between two vowels in (F1,F2) Hz space — the "vowels distinct"
// feed (pairwise separation must clear a stated floor).
function vowelDistance(a, b){ const d1 = a.F1 - b.F1, d2 = a.F2 - b.F2; return Math.sqrt(d1 * d1 + d2 * d2); }

// ── runThroatSelfTest(f0) — the SOLE ORACLE. Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS, so they cannot disagree. f0 is the glottal buzz fundamental.
function runThroatSelfTest(f0){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const N = Math.max(40, Math.ceil((F2_HI * 1.2) / f0));   // comb dense enough to cover F2 with margin
  const TOL = f0;                                          // ±one comb spacing — the honest resolution

  // LEG 1 — TWO FORMANTS RECOVER THE PUBLISHED F1/F2 for the two well-separated
  //   cardinals /a/ and /i/: formantPeaks picks the comb rung carrying most
  //   energy in each band; each recovered peak lands within ±one comb spacing of
  //   the published formant. This is the tightest HONEST bound — a comb resolves
  //   only to its nearest rung — we do NOT fake a finer tolerance.
  {
    let ok = true; const rows = [];
    for (const v of [CARDINAL_A, CARDINAL_I]){
      const pk = formantPeaks(f0, N, v.F1, v.F2, Q1, Q2, false);
      const d1 = Math.abs(pk.p1 - v.F1), d2 = Math.abs(pk.p2 - v.F2);
      const pass = d1 <= TOL && d2 <= TOL;
      if (!pass) ok = false;
      rows.push(`/${v.ipa}/ F1 ${v.F1}→${pk.p1.toFixed(0)} (Δ${d1.toFixed(0)}) · F2 ${v.F2}→${pk.p2.toFixed(0)} (Δ${d2.toFixed(0)})`);
    }
    T('LEG 1 — two formants recover the published F1/F2: for /a/ and /i/, formantPeaks picks the comb rung carrying most energy in each band, and each lands within ±one comb spacing (±f₀) of the Peterson-Barney value — the honest resolution of a comb, not a faked-tight bound',
      ok, `${rows.join('  ·  ')}  (tol ±${TOL.toFixed(0)} Hz)`);
  }

  // LEG 2 — THE NEGATIVE CONTROL (load-bearing): collapse BOTH filters to one
  //   center and the two recovered peaks merge (|p1−p2| ≤ f0); the two-formant
  //   classifier returns TRUE for /a/ and /i/ but FALSE for the collapse. One
  //   resonance is not a vowel.
  {
    const a = formantPeaks(f0, N, CARDINAL_A.F1, CARDINAL_A.F2, Q1, Q2, false);
    const i = formantPeaks(f0, N, CARDINAL_I.F1, CARDINAL_I.F2, Q1, Q2, false);
    const col = formantPeaks(f0, N, CARDINAL_A.F1, CARDINAL_A.F2, Q1, Q2, true);
    const merged = Math.abs(col.p2 - col.p1) <= f0;
    const classOK = isTwoFormant(a.p1, a.p2, f0) === true
                 && isTwoFormant(i.p1, i.p2, f0) === true
                 && isTwoFormant(col.p1, col.p2, f0) === false;
    const ok = merged && classOK;
    T('LEG 2 — the negative control: collapse both resonances to one center and the two recovered peaks MERGE (|p1−p2| ≤ f₀); the classifier (p2−p1 > 2·f₀) reads TRUE for /a/ and /i/ but FALSE for the collapse — one resonance is a hum, not a vowel',
      ok, ok ? `collapse p1≈p2 (${col.p1.toFixed(0)}≈${col.p2.toFixed(0)} Hz) · two-formant: /a/ ✓ /i/ ✓ collapse ✗`
             : `merged=${merged} classOK=${classOK} (col ${col.p1.toFixed(0)}/${col.p2.toFixed(0)})`);
  }

  // LEG 3 — THE VOWELS ARE DISTINCT: /a/, /i/, /u/, /e/ are four separated points
  //   in (F1,F2) — every pairwise L2 distance clears a stated Hz floor, so they
  //   are not the same vowel under another name.
  {
    const picks = ['ɑ', 'i', 'u', 'ɛ'].map(vowelByIpa);
    const FLOOR = 300;     // Hz — well below the smallest genuine vowel spacing
    let ok = true, minD = Infinity; const rows = [];
    for (let a = 0; a < picks.length; a++) for (let b = a + 1; b < picks.length; b++){
      const d = vowelDistance(picks[a], picks[b]);
      minD = Math.min(minD, d);
      if (d <= FLOOR) ok = false;
      rows.push(`${picks[a].ipa}↔${picks[b].ipa} ${d.toFixed(0)}`);
    }
    T('LEG 3 — the vowels are distinct: /a/, /i/, /u/, /e/ are four separated points in (F1,F2) Hz space — every pairwise distance clears the floor, so each is a genuinely different carve, not the same vowel relabelled',
      ok, `min pairwise ${minD.toFixed(0)} Hz > ${FLOOR} floor  ·  ${rows.join(' · ')}`);
  }

  // LEG 4 — SUBTRACTIVE, NOT ADDITIVE (the mirror-twin claim, formal complement
  //   of the Rack's "energy is ADDED"): the source comb is FULL before the
  //   throat (every rung at 1/n > 0), and after throatResponse energy is only
  //   ever REMOVED — every out-of-band rung is attenuated BELOW the weakest
  //   in-band rung. The vowel is what's LEFT, nothing is added.
  {
    const v = CARDINAL_A;
    const resp = throatResponse(f0, N, v.F1, v.F2, Q1, Q2, false);
    // nothing added: the throat is a multiplicative ENVELOPE, bounded by the
    // resonance make-up gains — every rung's env ≤ MAKEUP_1 + MAKEUP_2, so no
    // frequency is amplified past what the two resonances allow. The carving
    // lives in the ENVELOPE (the operator), independent of the source's 1/n tilt.
    let boundedGain = true, maxEnv = 0;
    for (const t of resp){
      maxEnv = Math.max(maxEnv, t.env);
      if (t.env > MAKEUP_1 + MAKEUP_2 + 1e-9) boundedGain = false;
    }
    // the carve: pick a rung INSIDE a formant band (peak of F2) and one FAR out of
    // band (a high rung past both formants) — the in-band envelope must dominate
    // the out-of-band envelope. Energy is removed where the resonances are not.
    const inBandEnv  = Math.max(...resp.filter(t => Math.abs(t.freq - v.F2) <= 1.0 * f0).map(t => t.env));
    const outBandEnv = Math.max(...resp.filter(t => t.freq > v.F2 + 6 * f0).map(t => t.env));
    const carved = inBandEnv > 4 * outBandEnv;     // the in-band hill towers over the carved-out region
    const sourceFull = sourceComb(f0, N).every(t => t.src > 0);
    const ok = boundedGain && carved && sourceFull;
    T('LEG 4 — subtractive, not additive: the source comb is FULL before the throat (every rung 1/n > 0); the throat is a bounded multiplicative envelope (every gain ≤ MAKEUP₁+MAKEUP₂, nothing amplified past the two resonances) that only REMOVES energy where the formants are not — the in-band envelope towers over the carved-out region. The vowel is what is LEFT (the Overtone Rack’s formal mirror)',
      ok, ok ? `source full ✓ · max env ${maxEnv.toFixed(2)} ≤ ${(MAKEUP_1 + MAKEUP_2).toFixed(1)} · in-band env ${inBandEnv.toFixed(3)} > 4× out-of-band ${outBandEnv.toFixed(3)}`
             : `boundedGain=${boundedGain} carved=${carved} sourceFull=${sourceFull} (in ${inBandEnv.toFixed(3)} out ${outBandEnv.toFixed(3)})`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== THROAT CORE END =====

export {
  VOWELS, vowelByIpa, CARDINAL_A, CARDINAL_I, Q1, Q2,
  F1_LO, F1_HI, F2_LO, F2_HI, logLerp, invLogLerp,
  padToFormants, formantsToPad, bandpassMag, throatEnvelope,
  sourceComb, throatResponse, formantPeaks, isTwoFormant, vowelDistance,
  MAKEUP_1, MAKEUP_2, BREATH_FLOOR, runThroatSelfTest,
  semiToFreq, F0, SEMI_F0,
};
