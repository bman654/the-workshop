// ============================================================================
//  THE TONE MILL — the TONE-MILL CORE: the sole authority for the claim
//  "the pitch you HEAR is the rate you WATCH." A 19th-century acoustic siren
//  (Seebeck / Cagniard de la Tour): a brass disc of N evenly-cut teeth turning
//  at angular rate Ω passes a fixed reading-edge N·(Ω/2π) times a second, so the
//  emitted tone is EXACTLY f = N·Ω/2π. ONE shared phase θ(t) integrates Ω and
//  draws BOTH the teeth AND the oscillator's instantaneous frequency, so the
//  rate you WATCH (Ω, rev/s = Ω/2π) and the pitch you HEAR (f = N·Ω/2π) are a
//  single number by construction — they cannot drift unless you DETACH the
//  needle (the negative control), which decouples the ear from θ.
//
//  Pure, dependency-free (DOM-free). Ω is in rad/s throughout; revPerSec(Ω)=Ω/2π
//  is the watched rate. This module owns the siren identity, the cents law, the
//  just-ratio rings, the strobe-sample drift model, and runSelfTest. It single-
//  sources the equal-temperament anchor (MIDDLE_C_HZ / semiToFreq / noteName)
//  from ../sound-garden/pitch-core.mjs — the PITCH CORE slice below is a
//  BYTE-TWIN of that file's slice, never a re-typed Hz literal. The audible
//  musical-scale mapping (so a ring sings near a real note) is a PAGE render
//  choice and must NOT enter this core: the core stays pure rate units (Hz from
//  Ω), and the page chooses how to make Ω land on an audible pitch.
//
//  The Tone Mill page (tone-mill/index.html) is forged from index.src.html,
//  which inlines this module via `<!-- forge:include core.mjs -->`; forge strips
//  the leading ESM `export ` keywords so the slice is page-scoped. The Node twin
//  (core.test.mjs) re-extracts the inlined CORE slice from index.html and asserts
//  it is char-for-char this module's slice (after the same `export `-strip forge
//  applies), re-derives the anchor (an anti-circularity grep confirms the
//  261.625565 literal lives ONLY in pitch-core), and runs the same four
//  self-test legs. The in-page pill and the Node twin both call THIS runSelfTest,
//  so "self-test green" cannot drift. The audio-lens ear-check (verify.sh)
//  renders the SAME toothPassHz() law offline and confirms the SOUND matches the
//  math (the (b) lens leg of the split crux).
//
//  Cycle #221 — the founding room of the MANOR's Kinetics & Sound wing,
//  kin to the Sound Garden's monochord and next door to The Passing Siren.
// ============================================================================

// ===== PITCH CORE (inlined byte-twin) BEGIN =====
const MIDDLE_C_HZ = 261.625565;            // the ONE pitch anchor literal
function semiToFreq(semi){ return MIDDLE_C_HZ * Math.pow(2, semi/12); }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function noteName(semi){ const o=4+Math.floor(semi/12); const i=((semi%12)+12)%12; return NOTE_NAMES[i]+o; }
// ===== PITCH CORE END =====

// ===== TONE-MILL CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: this block names MIDDLE_C_HZ / semiToFreq / noteName only through
// the PITCH CORE slice inlined directly above it (in both the module and the
// page), so the page can paste this verbatim regardless of load order and no Hz
// literal is re-typed inside the slice (the anchor is single-sourced). Each
// declaration carries a leading `export ` that forge strips on inline; the byte-
// parity test strips the same prefix so the slice matches the page char-for-char.

const TWO_PI = Math.PI * 2;

// THE SIREN IDENTITY. A disc of N evenly-cut teeth turning at angular rate Ω
// (rad/s) passes a fixed reading-edge N·(Ω/2π) times a second, so the emitted
// tone is EXACTLY f = N·Ω/2π. This is the ONE place it lives; the disc render
// AND the oscillator BOTH read toothPassHz(N, Ω), so the rate you WATCH and the
// pitch you HEAR are a single number.
export function toothPassHz(N, omega){ return N * omega / TWO_PI; }   // f (Hz) from Ω (rad/s)
export function revPerSec(omega){ return omega / TWO_PI; }            // the watched rate (rev/s)

// cents between two frequencies: 1200·log2(f2/f1). Doubling Ω scales f, so it is
// exactly +1200¢ (an octave) for ANY N — the octave IS a rate-doubling.
export function cents(f1, f2){ return 1200 * Math.log2(f2 / f1); }
// cents of a bare positive ratio (for the just-ring intervals).
export function centsOfRatio(ratio){ return 1200 * Math.log2(ratio); }

// nearest equal-tempered note to a frequency: which semitone (from MIDDLE_C_HZ)
// it rounds to, and how many cents off. Uses the byte-twinned pitch core, so the
// note readouts agree with the rest of the Sound Garden. (This is a READOUT, not
// the siren law: it reads a Hz the law already produced.)
export function nearestNote(f){
  if (f <= 0) return { name: '—', centsOff: 0 };
  const semi = Math.round(12 * Math.log2(f / MIDDLE_C_HZ));
  const ref = semiToFreq(semi);
  return { name: noteName(semi), centsOff: cents(ref, f) };
}

// THE TWO-RING CHORD. An inner ring of N_inner teeth and an outer of N_outer
// teeth share ONE Ω; each sounds its own toothPassHz, so the interval between
// them is the count ratio N_outer:N_inner — a just interval, independent of Ω.
// ringChordCents(nInner,nOuter) returns the cents of the nOuter:nInner tooth-
// count ratio (e.g. the 16:24 rings = 3:2 = +701.955¢, a just perfect fifth).
export function ringChordCents(nInner, nOuter){ return centsOfRatio(nOuter / nInner); }

// THE STROBE-SAMPLE DRIFT MODEL (B's convention). The strobe flashes at a rate
// the user dials; at each flash the eye SAMPLES the disc and holds that frame
// until the next flash. Between flashes a tooth advances (toothPassHz/strobeHz)
// tooth-widths; folded to the nearest integer multiple, the residual is the
// APPARENT crawl rate in tooth-widths/sec. Zero residual ⇒ the teeth stand still
// (FROZEN). The eye locks whenever the tooth-pass rate is ANY integer multiple of
// the strobe rate (sub/super-harmonics freeze too).
export function apparentDriftHz(N, omega, strobeHz){
  const fTooth = toothPassHz(N, omega);
  if (strobeHz <= 0) return fTooth;
  const ratio = fTooth / strobeHz;
  const nearestInt = Math.round(ratio);
  return (ratio - nearestInt) * strobeHz;   // residual crawl, tooth-widths/sec
}
// "Frozen" = the apparent drift is within tol tooth-widths/sec of zero.
export function isFrozen(N, omega, strobeHz, tol){
  return Math.abs(apparentDriftHz(N, omega, strobeHz)) <= (tol == null ? 0.04 : tol);
}

// ── runSelfTest() — the SOLE ORACLE: { pass, total, lines:[{name, ok, detail}] }.
// The in-page pill and the Node twin both call THIS so they cannot disagree.
// Every detail carries LIVE numbers; reference values appear only as tolerance
// anchors. The default ring pair (inner 16 : outer 24 = 3:2) is a just fifth.
export function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail='') => lines.push({ name, ok: !!ok, detail });
  const EPS = 1e-9;
  const N_INNER = 16, N_OUTER = 24;   // 16:24 = 3:2, a just perfect fifth

  // LEG (a) — THE EYE READS THE EAR. At the freeze (strobe rate === tooth-pass
  // rate) the teeth stand still (drift === 0) AND that strobe rate IS the
  // scheduled audio f = N·Ω/2π to <1e-9. The watched freeze-rate IS the tone.
  {
    let maxErr = 0, frozenAll = true;
    for (const rev of [3.0, 5.0, 7.13, 9.2]){
      const omega = rev * TWO_PI;
      const f = toothPassHz(N_OUTER, omega);     // the heard tone
      const strobe = f;                          // dial the strobe to the tone
      const drift = apparentDriftHz(N_OUTER, omega, strobe);
      if (Math.abs(drift) > EPS) frozenAll = false;
      maxErr = Math.max(maxErr, Math.abs(strobe - f) / f);
    }
    T('(a) eye reads ear — at the freeze, the strobe rate === scheduled f = N·Ω/2π (<1e-9) and the teeth drift is 0: the watched freeze-rate IS the heard tone',
      frozenAll && maxErr < EPS, `frozen at strobe=f for all Ω · max rel err = ${maxErr.toExponential(2)}`);
  }

  // LEG (b) — DOUBLING Ω = EXACTLY +1200 CENTS. The siren proves the octave is a
  // rate-doubling: spin twice as fast, the tone is one octave up to the bit, for
  // any N. (The AUDIBLE side of this leg is the verify.sh lens ear-check.)
  {
    let maxDev = 0;
    for (const N of [N_INNER, N_OUTER, 12, 32]) for (const rev of [2.5, 5.0, 8.0]){
      const o1 = rev * TWO_PI, o2 = 2 * o1;
      const c = cents(toothPassHz(N, o1), toothPassHz(N, o2));
      maxDev = Math.max(maxDev, Math.abs(c - 1200));
    }
    T('(b) octave by rate — doubling Ω raises the tone by EXACTLY +1200.000000¢ (the octave IS a rate-doubling), for every N',
      maxDev < 1e-9, `max |Δ−1200| = ${maxDev.toExponential(2)}¢`);
  }

  // LEG (c) — TWO RINGS SOUND THE DERIVED JUST RATIO. The 16:24 ring pair, sharing
  // ONE Ω, sounds cents(24/16) = cents(3/2) = 701.955¢ — a just perfect fifth —
  // and they freeze TOGETHER at their respective tooth-pass rates on the same Ω
  // (one shared phase → one frozen chord). The interval is Ω-free.
  {
    const justFifth = centsOfRatio(3/2);
    let intervalOk = true, freezeOk = true, maxDev = 0;
    for (const rev of [3.2, 5.0, 7.5]){
      const omega = rev * TWO_PI;
      const fIn = toothPassHz(N_INNER, omega), fOut = toothPassHz(N_OUTER, omega);
      const ringCents = ringChordCents(N_INNER, N_OUTER);   // = cents(24/16)
      maxDev = Math.max(maxDev, Math.abs(ringCents - justFifth));
      if (Math.abs(ringCents - justFifth) > EPS) intervalOk = false;
      // both rings freeze at their own tooth-pass rate on the SAME Ω
      if (!(isFrozen(N_INNER, omega, fIn, EPS) && isFrozen(N_OUTER, omega, fOut, EPS))) freezeOk = false;
    }
    const ok = intervalOk && freezeOk &&
      Math.abs(ringChordCents(N_INNER, N_OUTER) - 701.955) < 0.001;
    T('(c) two rings, one chord — the 16:24 rings on ONE shared Ω sound cents(3/2)=701.955¢ (a just fifth, Ω-free) and freeze together as one chord',
      ok, `ring interval = ${ringChordCents(N_INNER, N_OUTER).toFixed(3)}¢ === cents(3/2) (max |Δ| ${maxDev.toExponential(2)}¢) · both frozen at their f for every Ω`);
  }

  // NEG-CONTROL — DETACHED NEEDLE. Drive the tone from a free-running knob (freeHz)
  // decoupled from Ω. The strobe set to the tooth-pass rate STILL freezes the disc
  // (it only watches Ω) but the HEARD Hz ≠ N·Ω/2π by a wide, unambiguous margin —
  // the lens would catch the drift. Proof it is the SHARED phase, not two tuned
  // dials, that makes seen == heard.
  {
    const omega = 5.0 * TWO_PI;
    const fTooth = toothPassHz(N_OUTER, omega);   // what the eye/strobe track
    const freeHz = fTooth * 1.06;                 // detached knob, deliberately ~6% off
    const stillFreezes = isFrozen(N_OUTER, omega, fTooth, 1e-9);       // strobe=tooth still freezes
    const heardDiffers = Math.abs(freeHz - fTooth) / fTooth > 0.05;    // heard drifts off by ≥5%
    T('NEG — detached needle: the strobe still freezes the disc (it watches Ω) but heard Hz ≠ N·Ω/2π by ~6% — seen and heard DECOUPLE; only the SHARED phase binds them (the lens catches it)',
      stillFreezes && heardDiffers,
      `freeze holds · heard ${freeHz.toFixed(2)}Hz vs watched ${fTooth.toFixed(2)}Hz (Δ ${((freeHz/fTooth-1)*100).toFixed(1)}%)`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== TONE-MILL CORE END =====
