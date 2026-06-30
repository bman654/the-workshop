// ============================================================================
//  THE BARREL HOUSE — pin-barrel/core.mjs — the SOLE byte-exact authority.
//
//  A music box where TIME IS THE CRANK. A barrel is a pin-lattice on a (θ,tooth)
//  grid: θ = angular position around the drum (one period P = STEPS = a full
//  turn), tooth = vertical index on the comb. The crank→read TRANSPORT is a PURE
//  function of the crank's ABSOLUTE (unwrapped) position: as the hand sweeps the
//  drum from one position to another, every pin whose step is congruent (mod P)
//  to a position inside the swept half-open interval plucks its comb-tooth. The
//  studs you SEE crossing the read-bar and the notes you HEAR are ONE object at
//  ONE instant. Pure, dependency-free, DOM-free: the same math the page renders
//  and the headless twin proves.
//
//  THE PITCH LATTICE IS A TORUS on the COLUMN (θ) axis (everything is mod STEPS),
//  so a wrap across the seam is exact. The CANON is a PURE DELAY canon —
//  dTooth = [0,0,0] — so NO pin is ever transposed off the comb and NO pin is
//  ever clamped or dropped. CRITICAL ANTI-DEFECT: there is NO `.filter(row<N)`
//  anywhere in this module. If a future barrel wants a tooth transpose it MUST
//  wrap it on a tooth-torus (mod TEETH) so the offset map stays a true bijection
//  — a pin is moved, never dropped. The COUNT-EQUALITY law (every voice has the
//  same pin count as voice 0) makes "a dropped note" a hard test failure forever.
//
//  THE TRANSPORT YOU HEAR IS THE RULE THE LOGIC COMPUTES. crossing() is the SOLE
//  "what is heard now" authority; the page plucks EXACTLY the pins it returns and
//  the twin proves a forward sweep of N periods plucks every pin exactly N times
//  (no drops, no doubles) — the visible == heard identity.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): each barrel page inlines this
//  file VIA forge between the PIN-BARREL CORE sentinels, so a stale page trips
//  `forge --check`; the twin ALSO byte-parity-checks the inlined block against
//  this module body. One oracle, no second copy.
// ============================================================================

// ===== PIN-BARREL CORE (byte-identical to core.mjs) =====
const TEETH = 17;          // comb teeth (vertical lattice height)
const STEPS = 48;          // angular lattice resolution around the drum (one period P)
const TAU = Math.PI * 2;

// A pentatonic-stack comb so any chord of voices is consonant (tooth → MIDI).
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36, 38]; // 17 teeth
function teethToMidi(t) { return 60 + SCALE[((t % TEETH) + TEETH) % TEETH]; }

// The base melody: a short tune as (stepIndex → tooth) pins, on voice 0.
// stepIndex ∈ [0,STEPS), tooth ∈ [0,TEETH). This is ONE voice's engraving.
const MELODY = [
  [0, 5], [3, 7], [6, 9], [9, 7], [12, 5], [15, 8], [18, 10], [21, 8],
  [24, 6], [27, 9], [30, 11], [33, 9], [36, 7], [39, 10], [42, 12], [45, 10]
];

// CANON offset law: voice k = voice 0 shifted by a fixed angular delay dPhase[k]
// (in lattice steps) and a tooth transpose dTooth[k]. "Three voices chase one
// tune." dTooth = [0,0,0] keeps it a PURE DELAY canon (same pitches, delayed) so
// no pin leaves the comb. dPhase divides P=48, so the round closes by rotation.
const CANON = { voices: 3, dPhase: [0, 16, 32], dTooth: [0, 0, 0] };

// transform one (step,tooth) by voice k's offset, ON THE TORUS (mod STEPS, mod
// TEETH) — a true bijection, never a clamp/drop. The SOLE offset law; the oracle
// re-derives the canon by an independent route, NEVER by calling this.
function canonStep(step, k) { return (((step + CANON.dPhase[k]) % STEPS) + STEPS) % STEPS; }
function canonTooth(tooth, k) { return (((tooth + CANON.dTooth[k]) % TEETH) + TEETH) % TEETH; }

// the canon barrel: 3 voice-copies of MELODY, each offset by the canon law.
function pinsCanon() {
  const pins = [];
  for (let k = 0; k < CANON.voices; k++)
    for (const [s, t] of MELODY)
      pins.push({ step: canonStep(s, k), tooth: canonTooth(t, k), voice: k, retro: false });
  return pins;
}

// the crab canon: voice 0 forward, voice 1 = exact retrograde reflection
// θ → (P-1-θ) on the same teeth (read backward at the same instant).
function pinsCrab() {
  const pins = [];
  for (const [s, t] of MELODY) pins.push({ step: s, tooth: t, voice: 0, retro: false });
  for (const [s, t] of MELODY)
    pins.push({ step: (((STEPS - 1 - s) % STEPS) + STEPS) % STEPS, tooth: t, voice: 1, retro: true });
  return pins;
}

// a deterministic random barrel — the "not a canon" neg-control source.
function randomBarrel(seed) {
  let a = seed >>> 0;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pins = [];
  for (let i = 0; i < MELODY.length * 3; i++)
    pins.push({ step: Math.floor(rnd() * STEPS), tooth: Math.floor(rnd() * TEETH), voice: i % 3, retro: false });
  return pins;
}

// THE TRANSPORT. crank position is tracked ABSOLUTE (unwrapped); a sweep from
// fromAbs to toAbs plucks every pin whose step s has an integer-congruent
// position s + n·P inside the swept half-open interval (lo, hi]. A forward sweep
// of N periods plucks every pin exactly N times — no drops, no doubles. Reverse
// (toAbs < fromAbs) tags each pluck reversed:true for a swelled attack. This is
// the SOLE "what is heard now" authority; the page plucks exactly this set.
function crossing(pins, fromAbs, toAbs) {
  const out = [];
  const lo = Math.min(fromAbs, toAbs), hi = Math.max(fromAbs, toAbs);
  const rev = toAbs < fromAbs;
  for (const p of pins) {
    const n = Math.ceil((lo - p.step) / STEPS);            // first congruent position ≥ lo
    for (let pos = p.step + n * STEPS; pos <= hi + 1e-9; pos += STEPS)
      if (pos > lo + 1e-9 && pos <= hi + 1e-9) out.push(rev ? { ...p, reversed: true } : p);
  }
  return out;
}

// THE MATE-LAW (the loupe's reveal). Given a pin and a barrel kind, return the
// CANON OFFSET-PARTNER it pairs with — sourced from the SAME offset law the field
// is built from, NEVER from a clamp. For the canon: voice k's pin maps to the
// matching cell in voice (k+1) mod voices (the next copy chasing it round). For
// the crab: voice 0 ↔ its reflection in voice 1. Returns the partner {step,tooth,
// voice} or null. Used to draw the dashed mate-line + light the twin.
function mateOf(p, kind) {
  if (kind === 'crab') {
    const v = p.voice === 0 ? 1 : 0;
    const step = (((STEPS - 1 - p.step) % STEPS) + STEPS) % STEPS;
    return { step, tooth: p.tooth, voice: v, retro: v === 1 };
  }
  // canon: chase to the next voice copy. Undo this voice's offset, re-apply the
  // next voice's offset — pure law, both directions wrap on the torus.
  const kFrom = p.voice, kTo = (p.voice + 1) % CANON.voices;
  // base cell (voice-0 frame): undo kFrom's offset on the torus.
  const baseStep = (((p.step - CANON.dPhase[kFrom]) % STEPS) + STEPS) % STEPS;
  const baseTooth = (((p.tooth - CANON.dTooth[kFrom]) % TEETH) + TEETH) % TEETH;
  return { step: canonStep(baseStep, kTo), tooth: canonTooth(baseTooth, kTo), voice: kTo, retro: false };
}

const FIELD = { TEETH, STEPS, TAU };
// ===== END PIN-BARREL CORE =====

export {
  TEETH, STEPS, TAU, SCALE, MELODY, CANON, FIELD,
  teethToMidi, canonStep, canonTooth,
  pinsCanon, pinsCrab, randomBarrel, crossing, mateOf
};
