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

export {
  semiToFreq, noteName, MIDDLE_C_HZ,
  JUST_FIFTH, OCTAVE, PYTHAGOREAN_COMMA, pythagoreanComma,
  cents, foldToOctave, temperedFifth, fifthRatio, equalTemperFifth,
  stackFifths, gapCents, residualCents, runSelfTest,
};
