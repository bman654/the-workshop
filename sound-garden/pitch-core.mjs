// ============================================================================
//  THE SOUND GARDEN — the PITCH CORE (extracted, the sole authority for a note's
//  pitch). Pure, dependency-free. This is the ONE place the equal-temperament
//  anchor literal (MIDDLE_C_HZ) and the semitone→frequency law live.
//
//  WHY IT EXISTS.  The Butterfly's Voice bench (butterfly-voice/) IMPORTS
//  semiToFreq + noteName from HERE, so the pitch that *generates* a note and the
//  pitch the FFT bin *recovers* are computed from ONE function — never two
//  re-typed copies. The bench's page inlines a BYTE-TWIN of the block between the
//  sentinels below, and the Node twin re-extracts that slice and asserts it is
//  char-for-char this module (so "self-test green" can't drift). An
//  anti-circularity grep in the Node twin confirms the digit-literals of the
//  pitch law (261.625565, 1.05946…) appear ONLY in this file.
//
//  NOT YET RETROFITTED into the six instruments (curator touch, out of scope) —
//  this module is the authority the bench imports; the instruments keep their own
//  inline pitch math for now. A future curation pass can single-source them too.
// ============================================================================

// ===== PITCH CORE (inlined byte-twin) BEGIN =====
const MIDDLE_C_HZ = 261.625565;            // the ONE pitch anchor literal
function semiToFreq(semi){ return MIDDLE_C_HZ * Math.pow(2, semi/12); }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function noteName(semi){ const o=4+Math.floor(semi/12); const i=((semi%12)+12)%12; return NOTE_NAMES[i]+o; }
// ===== PITCH CORE END =====

// ============================================================================
//  THE COMMA CORE — the sole authority for the claim "twelve true perfect
//  fifths overshoot seven octaves by the Pythagorean comma." Pure, dependency-
//  free. This is the ONE place the comma's defining ratio (the just fifth 3/2)
//  and the famous comma literal 531441/524288 live. The Comma bench
//  (sound-garden/the-comma/) inlines a BYTE-TWIN of the slice between the
//  sentinels below; its Node twin (the-comma/core.test.mjs) re-extracts that
//  slice and asserts it is char-for-char this module, and an anti-circularity
//  grep confirms the comma literal appears in exactly one file — HERE. The
//  in-page pill and the Node twin both call THIS runSelfTest, so "self-test
//  green" cannot drift between the two surfaces. (Appended #64; the PITCH CORE
//  block above is left byte-untouched so butterfly-voice keeps byte-twinning it.)
// ============================================================================

// ===== COMMA CORE (inlined byte-twin) BEGIN =====
// A just (Pythagorean) perfect fifth is the exact ratio 3/2; an octave is 2/1.
// Stacking twelve just fifths gives (3/2)^12; folding that down seven octaves
// (÷2^7) leaves the Pythagorean comma — the overshoot you can hear as a wolf.
const JUST_FIFTH = 3 / 2;                            // the true (just) perfect fifth
const OCTAVE = 2;                                    // one octave = doubling
// The Pythagorean comma as a pure ratio (>1): the ONE place its literal lives.
//   (3/2)^12 = 531441/4096, folded down 2^7 = 531441/524288 = 1.013643…
const PYTHAGOREAN_COMMA = 531441 / 524288;
function pythagoreanComma(){ return PYTHAGOREAN_COMMA; }            // the comma, as a ratio
// any positive ratio → cents:  cents = 1200·log2(ratio)
function cents(ratio){ return 1200 * Math.log2(ratio); }
// fold any ratio into one octave [1, 2):  the spoke's position on the clock.
function foldToOctave(ratio){ while(ratio >= OCTAVE) ratio /= OCTAVE; while(ratio < 1) ratio *= OCTAVE; return ratio; }
// the equal-tempered perfect fifth: 2^(7/12), which is EXACTLY 700 cents.
function temperedFifth(){ return Math.pow(OCTAVE, 7 / 12); }
// a fifth tempered by fraction t∈[0,1]: t=0 → just 3/2, t=1 → ET 2^(7/12).
// the temper is LINEAR IN CENTS, so cents(fifthRatio(t)) = (1−t)·just + t·ET.
function fifthRatio(t){ return Math.pow(OCTAVE, ((1 - t) * cents(JUST_FIFTH) + t * cents(temperedFifth())) / 1200); }
// the equal hair ET shaves off every fifth: comma/12 = 1.955 cents.
function equalTemperFifth(){ return cents(PYTHAGOREAN_COMMA) / 12; }
// wind n fifths of temper t, folding each running pitch into one octave. Returns
// the per-step folded ratios (the spokes) AND the un-folded raw product (the reach).
function stackFifths(n, t){
  const f = fifthRatio(t); const spokes = []; let raw = 1;
  for(let i = 1; i <= n; i++){ raw *= f; spokes.push(foldToOctave(raw)); }
  return { spokes, raw };
}
// the residual GAP after twelve fifths of temper t, vs the true octave home (2^7):
// how far the un-folded twelfth pitch sits past seven octaves, in cents.
//   just → +23.460 (the comma);  ET → 0 (the spiral shuts).
function gapCents(t){ const { raw } = stackFifths(12, t); return cents(raw / Math.pow(OCTAVE, 7)); }
// alias kept for symmetry with the bench prose ("the residual the wolf measures").
function residualCents(t){ return gapCents(t); }

// ── runSelfTest() — the SOLE ORACLE. Same shape as the butterfly/voice bench:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS so they cannot disagree. Every detail carries LIVE numbers; the
// comma is DERIVED here (cents∘fold∘(3/2)^12) with NO typed decimal — the famous
// 23.460 reference value lives only in the test oracle's tolerance check below.
function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail='') => lines.push({ name, ok: !!ok, detail });
  const EPS = 1e-9;
  const COMMA_REF = 23.460;                 // the famous value, used ONLY as a tolerance anchor here

  // LEG A — the comma is EXACT (two disjoint derivations agree to the bit):
  //   stacking 3/2 twelve times and folding 2^7 === the literal 531441/524288,
  //   AND twelve ET fifths fold to a pure octave (residual ≈ 0 within float eps).
  {
    let raw = 1; for(let i=0;i<12;i++) raw *= JUST_FIFTH;       // (3/2)^12
    const folded = raw / Math.pow(OCTAVE, 7);                   // fold 7 octaves down
    const exact = folded === PYTHAGOREAN_COMMA;                 // two disjoint routes, Δ=0
    const etCloses = Math.abs(gapCents(1)) < EPS;               // twelve ET fifths close
    T('LEG A — exact comma: (3/2)¹² folded ÷2⁷ === 531441/524288 to the bit (Δ=0, two disjoint derivations), and twelve ET fifths close with residual ≈ 0',
      exact && etCloses,
      exact ? `folded = ${folded} === 531441/524288 (Δ=0) · ET residual ${Math.abs(gapCents(1)).toExponential(2)}¢`
            : `folded ${folded} ≠ ${PYTHAGOREAN_COMMA}`);
  }
  // LEG B — that ratio IS 23.460 cents, and the just spiral overshoots by exactly that.
  {
    const c = cents(pythagoreanComma());
    const g = gapCents(0);
    const ok = Math.abs(c - COMMA_REF) < 0.001 && Math.abs(g - c) < EPS;
    T('LEG B — 23.460¢: cents(531441/524288) = 23.460¢, and winding twelve JUST fifths overshoots home by exactly that — the geometric gap IS the comma',
      ok, ok ? `cents = ${c.toFixed(6)}¢ ≈ 23.460¢ · just gap = ${g.toFixed(6)}¢ (equal)`
             : `cents ${c.toFixed(6)} vs gap ${g.toFixed(6)}`);
  }
  // LEG C — the equal hair: ET shaves EXACTLY comma/12 = 1.955¢ off every fifth
  //   (701.955¢ just → 700¢ ET), and twelve of those close the spiral.
  {
    const shave = cents(JUST_FIFTH) - cents(temperedFifth());   // per-fifth narrowing
    const commaOver12 = equalTemperFifth();                     // comma/12
    const justCents = cents(JUST_FIFTH);
    const ok = Math.abs(shave - commaOver12) < EPS &&
               Math.abs(shave - 1.955) < 0.001 &&
               Math.abs(justCents - 701.955) < 0.001;
    T('LEG C — equal hair: ET narrows each fifth by EXACTLY comma/12 = 1.955¢ (701.955¢ → 700¢) — the bench distributes one comma across twelve pegs',
      ok, ok ? `shave = ${shave.toFixed(6)}¢ === comma/12 = ${commaOver12.toFixed(6)}¢ · just fifth ${justCents.toFixed(3)}¢`
             : `shave ${shave.toFixed(6)} ≠ comma/12 ${commaOver12.toFixed(6)}`);
  }
  // LEG D — NEGATIVE CONTROL (load-bearing): identical machinery (12 multiplies +
  //   a fold) leaves the full comma for the 3/2 ratio but ≈0 for 2^(7/12) — the
  //   comma is a property of the JUST FIFTH, not of arithmetic round-off.
  {
    const gJust = gapCents(0), gEqual = Math.abs(gapCents(1));
    const ok = gEqual < EPS && Math.abs(gJust - COMMA_REF) < 0.001;
    T('LEG D — negative control: same 12 multiplies + fold leaves 23.460¢ for 3/2 but ≈0¢ for 2^(7/12) — the comma is the FIFTH\'S, not round-off',
      ok, ok ? `just leaves ${gJust.toFixed(3)}¢ · ET leaves ${gEqual.toExponential(2)}¢ — only the ratio changed`
             : `just ${gJust.toFixed(3)} / ET ${gEqual.toExponential(2)}`);
  }
  // LEG E — continuity: as the lever sweeps just→equal the gap shrinks STRICTLY &
  //   monotonically from the comma to 0 — gap(t) = comma·(1−t), no jump (the lever
  //   truly closes it). This backs the throb you HEAR decelerating to a dead stop.
  {
    let prev = Infinity, mono = true, worstLin = 0;
    const comma = cents(pythagoreanComma());
    for(let k=0;k<=100;k++){ const t=k/100; const g=gapCents(t);
      if(g > prev + EPS) mono = false; prev = g;
      worstLin = Math.max(worstLin, Math.abs(g - comma*(1-t))); }
    const ok = mono && worstLin < 1e-7;
    T('LEG E — continuity: sweeping the lever just→equal shrinks the gap STRICTLY & linearly from 23.460¢ to 0 (gap(t) = comma·(1−t)) — the lever closes it with no jump',
      ok, ok ? `monotone ✓ · worst |gap − comma·(1−t)| = ${worstLin.toExponential(2)}¢`
             : `monotone=${mono} · worst lin err ${worstLin.toExponential(2)}`);
  }
  // LEG F — per-fifth accumulation (the cents ruler): the running just stack climbs
  //   by exactly +1.955¢ of comma per peg, reaching the full comma at peg 12.
  {
    let ok = true, worst = 0;
    const per = equalTemperFifth();                            // 1.955¢ per peg
    for(let n=1;n<=12;n++){
      // the comma accumulated through n just fifths = how far the n-th just spoke
      // sits past where the ET spoke would land = n·(just − ET cents) = n·comma/12.
      const acc = n * (cents(JUST_FIFTH) - cents(temperedFifth()));
      const expect = n * per;
      worst = Math.max(worst, Math.abs(acc - expect));
      if (Math.abs(acc - expect) > EPS) ok = false;
    }
    ok = ok && Math.abs(12 * per - cents(pythagoreanComma())) < EPS;
    T('LEG F — cents ruler: the just stack accrues +1.955¢ of comma per peg (n·comma/12), reaching the full 23.460¢ at peg 12 — the ruler sums to the comma',
      ok, ok ? `12 × 1.955¢ = ${(12*per).toFixed(3)}¢ === comma · worst per-peg Δ = ${worst.toExponential(2)}¢`
             : `worst per-peg Δ ${worst.toExponential(2)}`);
  }

  let pass = 0; for(const l of lines) if(l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== COMMA CORE END =====

// ============================================================================
//  THE OUT OF TUNE CORE — the sole authority for the claim "Kepler's third law
//  a^(3/2) === period holds for every real planet, yet voicing each planet's
//  period as a pitch makes the solar-system chord land audibly OUT OF TUNE."
//  Pure, dependency-free. This block REUSES cents() and foldToOctave() from the
//  COMMA CORE block above (it MUST NOT re-define them — the pitch/cents law lives
//  in exactly one place). The Out of Tune bench (sound-garden/out-of-tune/) inlines
//  a BYTE-TWIN of the slice between the sentinels below; its Node twin
//  (out-of-tune/core.test.mjs) re-extracts that slice and asserts it is char-for-
//  char this module, and that the COMMA CORE / PITCH CORE blocks above are still
//  byte-untouched. The in-page pill and the Node twin both call THIS
//  runOutOfTuneSelfTest, so "self-test green" cannot drift. (Appended #76; every
//  byte above is left untouched so butterfly-voice and the-comma keep byte-twinning
//  their slices.)
// ============================================================================

// ===== OUT OF TUNE CORE (inlined byte-twin) BEGIN =====
// The 13-tone JUST set across one octave (the in-tune lattice the ear measures a
// chord AGAINST): unison, the just diatonic + chromatic ratios, the octave.
//   1/1 · 16/15 · 9/8 · 6/5 · 5/4 · 4/3 · 45/32 (the tritone) · 3/2 · 8/5 · 5/3 · 9/5 · 15/8 · 2/1.
const JUST_SET = [1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8, 2/1];
// the just ratio's musical name, index-aligned with JUST_SET (for the readout / rail).
const JUST_NAME = ['unison','m2','M2','m3','M3','P4','tritone','P5','m6','M6','m7','M7','octave'];
// SNAP: given a ratio already FOLDED into [1,2), the SIGNED cents deviation to the
// NEAREST just ratio (|dev| minimised). Positive = sharp of the just tone, negative
// = flat. This is the single source of "how out of tune is this interval." Reuses
// cents() from the COMMA CORE above — the pitch law is NOT re-typed here.
function nearestDev(folded){
  let best = Infinity;
  for(const j of JUST_SET){ const d = cents(folded / j); if(Math.abs(d) < Math.abs(best)) best = d; }
  return best;
}
function nearestDevAbs(folded){ return Math.abs(nearestDev(folded)); }
// the nearest just ratio's NAME for a folded ratio (for the tuning-rail caption).
function nearestJustName(folded){
  let best = Infinity, bi = 0;
  for(let i=0;i<JUST_SET.length;i++){ const d = Math.abs(cents(folded / JUST_SET[i])); if(d < best){ best = d; bi = i; } }
  return JUST_NAME[bi];
}

// the audible chord's voicing law: each planet's PERIOD (years) is folded into one
// octave above EARTH_PERIOD and rung at BASE_HZ. Earth (period 1) sits exactly on
// BASE_HZ; every other planet is one folded tone. ONE law, shared by synth + test.
const BASE_HZ = 220;               // A3 — Earth's home pitch
const EARTH_PERIOD = 1.0;          // Earth's period, the chord's anchor
function planetHz(period){ return BASE_HZ * foldToOctave(period / EARTH_PERIOD); }
// the DETUNING the readout / rail / wolf-thread / test measure is the ADJACENT
// period-RATIO folded vs nearest just (where the largest honest sourness lives —
// distinct from the chord's per-planet folded tone). Signed cents.
function adjacentDev(periodLo, periodHi){ return nearestDev(foldToOctave(periodHi / periodLo)); }

// the pinned LAW bands (stated with measured headroom):
//  KEPLER_REL_TOL = 0.10% — real worst is Neptune 0.0616% (1.6x headroom); a
//   corrupted period fails it by ~190x. DETUNE [3,60]¢ — the real measured adjacent
//   band is 5.35¢ (Earth→Mars off the M7) to 37.55¢ (Mercury→Venus off the M3).
const KEPLER_REL_TOL = 0.001;      // 0.10% — Kepler a^(3/2) === period band
const DETUNE_FLOOR   = 3.0;        // ¢ — below this an interval reads in-tune
const DETUNE_CEIL    = 60.0;       // ¢ — above this it would be a different interval
const CLEAN_THRESH   = 6.0;        // ¢ — a thread under this reads clean (teal, no throb)

// Kepler's third law as a residual: how far a^(3/2) sits from the stored period,
// as a fraction of the period. Real planets are ≤0.0616%; a corrupt body blows up.
function keplerRel(a, period){ return Math.abs(Math.pow(a, 1.5) - period) / period; }

// ── runOutOfTuneSelfTest(planets, concordia) — the SOLE ORACLE. Same shape as the
// other benches: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and
// the Node twin both call THIS so they cannot disagree. `planets` is the real-planet
// array (each {name,a,period}); `concordia` is the fictional exact-3:2 control. The
// Eris-X corrupt fixture is defined HERE (test-only, kept OUT of the playable dial).
// Every detail carries LIVE numbers; the pinned reference band lives only in the
// tolerance checks below.
function runOutOfTuneSelfTest(planets, concordia){
  const lines = [];
  const T = (name, ok, detail='') => lines.push({ name, ok: !!ok, detail });

  // LEG 1 — KEPLER: every real planet obeys a^(3/2) === period within 0.10%. The
  //   detail carries the LIVE worst residual (real worst ≈ 0.0616%, Neptune).
  {
    let ok = true, worst = 0, worstName = '';
    for(const p of planets){ const rel = keplerRel(p.a, p.period);
      if(rel >= KEPLER_REL_TOL) ok = false;
      if(rel > worst){ worst = rel; worstName = p.name; } }
    T('LEG 1 — Kepler holds: every real planet a^(3/2) === period within 0.10% — the orrery\'s independently-stored a and period agree under the third law (not a tautology)',
      ok && planets.length === 8,
      ok ? `worst real residual = ${(worst*100).toFixed(4)}% (${worstName}) · band ${(KEPLER_REL_TOL*100).toFixed(2)}% · ${planets.length} planets`
         : `a planet exceeded ${(KEPLER_REL_TOL*100).toFixed(2)}% (worst ${(worst*100).toFixed(4)}% ${worstName})`);
  }

  // LEG 2 — AUDIBLE DETUNING: every adjacent planet pair, voiced as a folded
  //   period-ratio, is NONZERO and lands in [3,60]¢ off the nearest just interval.
  //   The detail carries the LIVE band (real ≈ 5.35¢ Earth→Mars … 37.55¢ Merc→Venus).
  {
    let ok = true, lo = Infinity, hi = -Infinity, loP = '', hiP = '';
    for(let i=0;i<planets.length-1;i++){
      const dev = adjacentDev(planets[i].period, planets[i+1].period);
      const ad = Math.abs(dev);
      if(!(ad >= DETUNE_FLOOR && ad <= DETUNE_CEIL) || ad === 0) ok = false;
      if(ad < lo){ lo = ad; loP = planets[i].name+'→'+planets[i+1].name; }
      if(ad > hi){ hi = ad; hiP = planets[i].name+'→'+planets[i+1].name; }
    }
    T('LEG 2 — audibly out of tune: every adjacent pair is NONZERO and lands in [3,60]¢ off the nearest just interval — the solar-system chord is provably sour, not clean',
      ok, ok ? `band ${lo.toFixed(2)}¢ (${loP}) … ${hi.toFixed(2)}¢ (${hiP}) — all in [${DETUNE_FLOOR},${DETUNE_CEIL}]¢, none 0`
             : `a pair fell outside [${DETUNE_FLOOR},${DETUNE_CEIL}]¢ or snapped to 0`);
  }

  // LEG 3 — CONTROL A (Concordia, FICTIONAL): a planet whose period is an EXACT 3:2
  //   with Earth PASSES Kepler (checked by the BAND — a^1.5 = 1.4999999999999998 is
  //   1 ULP off 1.5, so === would FALSE-fail) AND its interval snaps to 0¢ BIT-EXACT
  //   (foldToOctave(1.5) is unchanged → cents(1.5/(3/2)) === 0). Clean by construction.
  {
    const rel = keplerRel(concordia.a, concordia.period);
    const keplerPasses = rel < KEPLER_REL_TOL;          // BAND, not ===
    const snap = cents(foldToOctave(concordia.period / EARTH_PERIOD) / (3/2));   // its fifth vs Earth
    const snapExactZero = snap === 0;                   // bit-exact 0 (division-free fold)
    const usedEqualsWouldFail = (Math.pow(concordia.a, 1.5) === concordia.period) === false;
    T('LEG 3 — control A (Concordia, fictional exact-3:2): PASSES Kepler via the BAND (a^1.5 is 1 ULP off period, so === would false-fail) AND snaps to 0¢ bit-exact — a clean fifth by construction',
      keplerPasses && snapExactZero && usedEqualsWouldFail,
      `Kepler rel = ${rel.toExponential(2)} (band ✓, === would ${usedEqualsWouldFail?'FALSE-fail':'pass'}) · interval dev = ${snap}¢ (bit-exact 0)`);
  }

  // LEG 4 — CONTROL B (Eris-X, corrupt test-only fixture, kept OUT of the dial):
  //   a body whose period DISAGREES with a^(3/2) FAILS the Kepler band — the law-check
  //   has teeth (it is not vacuously green). a:2.0 period:3.5 → a^1.5 = 2.828, off by 19%.
  {
    const erisX = { name:'Eris-X', a:2.0, period:3.5 };
    const rel = keplerRel(erisX.a, erisX.period);
    const fails = rel >= KEPLER_REL_TOL;                // it MUST fail → asserts RED elsewhere
    T('LEG 4 — control B (Eris-X, corrupt): a body with period ≠ a^(3/2) FAILS the Kepler band by ~190x — the law-check is non-vacuous (it can go red)',
      fails && rel > 0.10,
      `Eris-X a:2.0 period:3.5 → rel = ${(rel*100).toFixed(2)}% ≥ ${(KEPLER_REL_TOL*100).toFixed(2)}% — correctly REJECTED`);
  }

  let pass = 0; for(const l of lines) if(l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== OUT OF TUNE CORE END =====

export {
  semiToFreq, noteName, MIDDLE_C_HZ,
  JUST_FIFTH, OCTAVE, PYTHAGOREAN_COMMA, pythagoreanComma,
  cents, foldToOctave, temperedFifth, fifthRatio, equalTemperFifth,
  stackFifths, gapCents, residualCents, runSelfTest,
  JUST_SET, JUST_NAME, nearestDev, nearestDevAbs, nearestJustName,
  BASE_HZ, EARTH_PERIOD, planetHz, adjacentDev,
  KEPLER_REL_TOL, DETUNE_FLOOR, DETUNE_CEIL, CLEAN_THRESH, keplerRel,
  runOutOfTuneSelfTest,
};
