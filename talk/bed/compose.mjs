/* ============================================================================
   THE PROJECTION ROOM's COMPOSER — bed manifest → deterministic event score.

   Film 4's music bed. A different piece from the trailer's (that one is a
   trailer: crucible → collapse → fun zone); this is a QUIET BED under six
   minutes of spoken narration — it must never compete with the voice. Same
   estate palette (trailer-bed/palette.mjs: Loom's Karplus-Strong, the Gate's
   celesta glass, the pad bed language), new composition.

   THE ARC (SPEC): curiosity (CH1) → mechanism (CH2–CH3) → wonder, peaking at
   the CH4 crescendo → warmth (CH5) → resolve (CH6).

   THE GERM: the SIX-CHECK MOTIF — six rising A-minor-pentatonic notes
   (A3 C4 D4 E4 G4 A4), one per preflight row, first heard as CH1's six checks
   flip green on camera. It is restated firmer at CH4's "computed from this
   film's own cue sheet" beat, and rippled all-at-once at CH6's SIX GREEN —
   the film's music literally grows out of its opening machinery.

   Every ANCHOR time comes from manifest.json (generated from the cue lock —
   word timestamps, invariant 4). Musical pickups/spreads INSIDE locked
   windows (a riser rising INTO the anchored peak, echo spacing, the door-
   swing quote) are composition constants, expressed relative to anchors.

   Keys: A minor ↔ C major (relative-mode pivot, the estate's shared set).
   Pulse: 52 BPM — the trailer's "early" tempo, kept for the whole bed.
   Deterministic: no Math.random / Date; per-event seeding happens in render.
   ============================================================================ */

import { semiToFreq } from '../../sound-garden/pitch-core.mjs';

const IDX = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
              'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
function n(name){
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error('bad note name: ' + name);
  return semiToFreq((parseInt(m[2],10) - 4) * 12 + IDX[m[1]]);
}

export const BED_BPM = 52;

/* the germ — six rising penta notes, one per preflight check */
const SIX = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4'];

export function compose(m){
  const totalS = m.totalMs / 1000;
  const beat = 60 / BED_BPM, bar = 4 * beat;
  const events = [];
  let seq = 0;
  const push = (t, voice, params, opts = {}) => {
    if (t < 0 || t >= totalS) return;
    events.push({ t, voice, params, gain: opts.gain ?? 1, pan: opts.pan ?? 0,
                  layer: opts.layer ?? 'misc', seq: seq++ });
  };
  const sec = ms => ms / 1000;
  const CH = Object.fromEntries(m.chapters.map(c => [c.id, { at: sec(c.wallStartMs), end: sec(c.wallEndMs) }]));
  const MK = Object.fromEntries(Object.entries(m.marks).map(([k, v]) =>
    [k, Array.isArray(v) ? v.map(sec) : sec(v)]));
  const SW = { announce: sec(m.swell.announceMs), gapStart: sec(m.swell.gapStartMs),
               peak: sec(m.swell.peakMs), resolve: sec(m.swell.resolveMs) };

  /* deterministic per-slot hash for the CH5 lattice grid (trailer lineage) */
  const slotRnd = (a, b) => {
    let h = ((m.seed ?? 4207) | 0) ^ 0x9E3779B9;
    h = Math.imul(h ^ a, 0x85EBCA6B); h ^= h >>> 13;
    h = Math.imul(h ^ b, 0xC2B2AE35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  /* ============================ CH1 — CURIOSITY ==============================
     Near-stillness. A low A breathes in from black; the six checks flip green
     and each gets its note — the germ, stated for the first time. The hard cut
     to the live aquarium gets one low pluck: the machine exists. */
  {
    const c = CH.p01;
    push(c.at, 'pad', { freqs: [n('A2'), n('E3')], dur: MK.ch1Cut - c.at + 0.8,
      attack: 2.6, release: 1.8, gain: 0.11 }, { layer: 'pad' });
    MK.ch1Rows.forEach((t, i) =>
      push(t, 'celesta', { freq: n(SIX[i]), dec: 2.1, vel: 0.30 + 0.02 * i },
        { gain: 0.55, pan: (i % 2 ? 0.25 : -0.25), layer: 'motif' }));
    push(MK.ch1Cut, 'ks', { freq: n('A2'), dur: 2.6, brightness: 0.25, vel: 0.6 },
      { gain: 0.5, pan: -0.12, layer: 'bass' });
    push(MK.ch1Cut, 'celesta', { freq: n('E5'), dec: 1.6, vel: 0.26 },
      { gain: 0.5, pan: 0.2, layer: 'motif' });
    push(MK.ch1Cut + 0.3, 'pad', { freqs: [n('A2'), n('E3'), n('A3')],
      dur: c.end - MK.ch1Cut - 0.3, attack: 2.2, release: 2.0, gain: 0.12 }, { layer: 'pad' });
  }

  /* ======================= CH2 — THE MACHINE WAKES ===========================
     Mechanism begins: an escapement tick on the off-beats, a slow root below,
     and each live action row (aquarium / lever / frame) answered by one rising
     glass note. */
  {
    const c = CH.p02;
    push(c.at, 'pad', { freqs: [n('A2'), n('E3'), n('A3')], dur: c.end - c.at,
      attack: 2.4, release: 2.0, gain: 0.12 }, { layer: 'pad' });
    const nBars = Math.floor((c.end - c.at) / bar);
    for (let b = 0; b < nBars; b++){
      const t0 = c.at + b * bar;
      push(t0, 'ks', { freq: n(b % 2 ? 'E2' : 'A2'), dur: 2.4, brightness: 0.22, vel: 0.55 },
        { gain: 0.38, pan: -0.12, layer: 'bass' });
      for (let e = 0; e < 2; e++)
        push(t0 + (2 * e + 1) * beat + beat / 2, 'tick', { gain: 1 },
          { gain: 0.06, pan: 0.3, layer: 'perc' });
    }
    ['E4', 'G4', 'A4'].forEach((note, i) =>
      push(MK.ch2Rows[i], 'celesta', { freq: n(note), dec: 1.7, vel: 0.32 },
        { gain: 0.55, pan: 0.18, layer: 'motif' }));
  }

  /* ==================== CH3 — THE CAPTIONS ARE LISTENING =====================
     The mechanism deepens. A sunset warms the room on its word; the byte-cell
     plate counts itself in four rising steps. */
  {
    const c = CH.p03;
    push(c.at, 'pad', { freqs: [n('A2'), n('E3'), n('G3')], dur: c.end - c.at,
      attack: 2.4, release: 2.0, gain: 0.12 }, { layer: 'pad' });
    const nBars = Math.floor((c.end - c.at) / bar);
    for (let b = 0; b < nBars; b++){
      const t0 = c.at + b * bar;
      push(t0, 'ks', { freq: n(b % 4 === 3 ? 'G2' : 'A2'), dur: 2.4, brightness: 0.22, vel: 0.5 },
        { gain: 0.36, pan: -0.12, layer: 'bass' });
      for (let e = 0; e < 2; e++)
        push(t0 + (2 * e + 1) * beat + beat / 2, 'tick', { gain: 1 },
          { gain: 0.06, pan: 0.3, layer: 'perc' });
    }
    push(MK.ch3Sunset, 'celesta', { freq: n('G3'), dec: 2.4, vel: 0.34 },
      { gain: 0.55, pan: -0.1, layer: 'motif' });
    push(MK.ch3Sunset + 0.02, 'celesta', { freq: n('E4'), dec: 2.4, vel: 0.30 },
      { gain: 0.55, pan: 0.1, layer: 'motif' });
    ['C5', 'D5', 'E5', 'G5'].forEach((note, i) =>
      push(MK.ch3Steps[i], 'celesta', { freq: n(note), dec: 1.4, vel: 0.30 },
        { gain: 0.5, pan: -0.3 + 0.2 * i, layer: 'motif' }));
    push(MK.ch3Hide, 'celesta', { freq: n('A4'), dec: 1.8, vel: 0.28 },
      { gain: 0.5, pan: 0, layer: 'motif' });
  }

  /* ========================= CH4 — ONE CLOCK =================================
     The heart. A patient Am→F→C→G cycle under the timing-file self-viewer;
     the war story dims the room (bare pad, a flat-5 wink, the glass goes
     silent); "it keeps the voice's time now" brings the light back in C major.
     Eight files get eight pings. Then the film talks about THIS score — the
     germ restated — and the whole bed rises into the one moment it is alone:
     the crescendo, whose crest is cue-locked inside the true-VO gap. */
  {
    const c = CH.p04a;
    const dark = MK.ch4BrokenCut, light = MK.ch4FixedLand;
    const CYCLE = [['A2', ['A2', 'E3', 'A3']], ['F2', ['F2', 'C3', 'A3']],
                   ['C2', ['C3', 'E3', 'G3']], ['G2', ['G2', 'D3', 'B3']]];
    /* phase 1 — patient cycle, two bars per chord, up to the dark turn */
    for (let b = 0; ; b++){
      const t0 = c.at + b * 2 * bar;
      if (t0 >= dark - 0.5) break;
      const [root, padNotes] = CYCLE[b % 4];
      push(t0, 'pad', { freqs: padNotes.map(n), dur: Math.min(2 * bar + 0.4, dark - t0),
        attack: 1.6, release: 1.4, gain: 0.11 }, { layer: 'pad' });
      push(t0, 'ks', { freq: n(root), dur: 2.6, brightness: 0.24, vel: 0.5 },
        { gain: 0.36, pan: -0.12, layer: 'bass' });
      push(t0 + 2 * beat + beat / 2, 'tick', { gain: 1 },
        { gain: 0.055, pan: 0.3, layer: 'perc' });
    }
    push(MK.ch4Looking, 'celesta', { freq: n('E4'), dec: 1.8, vel: 0.30 },
      { gain: 0.5, pan: 0.15, layer: 'motif' });
    push(MK.ch4Docks, 'celesta', { freq: n('G4'), dec: 1.8, vel: 0.32 },
      { gain: 0.5, pan: -0.15, layer: 'motif' });
    push(MK.ch4Docks + 0.02, 'celesta', { freq: n('C5'), dec: 1.8, vel: 0.28 },
      { gain: 0.5, pan: 0.15, layer: 'motif' });

    /* phase 2 — the war story: the room dims. Bare fifth, one flat-5 wink,
       ticks halve, no glass — the second clock nobody was watching. */
    push(dark, 'pad', { freqs: [n('A2'), n('E3')], dur: light - dark,
      attack: 1.2, release: 1.0, gain: 0.11 }, { layer: 'pad' });
    push(dark + bar, 'ks', { freq: n('Eb3'), dur: 1.8, brightness: 0.4, vel: 0.42 },
      { gain: 0.34, pan: -0.2, layer: 'bass' });
    for (let t = dark; t < light - 0.5; t += 2 * bar)
      push(t + 2 * beat + beat / 2, 'tick', { gain: 1 },
        { gain: 0.05, pan: 0.3, layer: 'perc' });

    /* phase 3 — "it keeps the voice's time now": light returns, C major */
    push(light, 'pad', { freqs: [n('C3'), n('E3'), n('G3')], dur: MK.ch4Score - light,
      attack: 1.4, release: 1.6, gain: 0.12 }, { layer: 'pad' });
    ['C5', 'E5', 'G5'].forEach((note, i) =>
      push(light + i * 0.16, 'celesta', { freq: n(note), dec: 1.9, vel: 0.36 - 0.03 * i },
        { gain: 0.55, pan: -0.2 + 0.2 * i, layer: 'motif' }));
    for (let t = light + 2 * bar; t < MK.ch4Files[0] - 1; t += 2 * bar)
      push(t, 'ks', { freq: n('C2'), dur: 2.4, brightness: 0.24, vel: 0.46 },
        { gain: 0.34, pan: -0.12, layer: 'bass' });

    /* eight files, eight pings, spread across the locked plate window L→R */
    {
      const [r, h] = MK.ch4Files, step = (h - r) / 8;
      const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5'];
      NOTES.forEach((note, k) =>
        push(r + k * step, 'celesta', { freq: n(note), dec: 0.9, vel: 0.28 },
          { gain: 0.5, pan: -0.7 + 0.2 * k, layer: 'motif' }));
    }

    /* phase 4 — the score speaks of itself: the germ, firmer; then the BUILD.
       From the "cue sheet" beat to the announce word the bed gathers — bass
       walks up, pad brightens, ticks double — so the crescendo has somewhere
       to come from. All anchors locked; the build fills the locked span. */
    SIX.forEach((note, i) =>
      push(MK.ch4Score + i * beat * 0.5, 'celesta', { freq: n(note), dec: 1.6, vel: 0.42 },
        { gain: 0.58, pan: (i % 2 ? 0.25 : -0.25), layer: 'motif' }));
    {
      const b0 = MK.ch4Score, span = SW.announce - b0;   /* ~12.8 s build */
      push(b0, 'pad', { freqs: [n('C3'), n('G3'), n('C4')], dur: span + 1.2,
        attack: 2.0, release: 0.8, gain: 0.13 }, { layer: 'pad' });
      push(b0 + span * 0.5, 'pad', { freqs: [n('E3'), n('G3'), n('E4')], dur: span * 0.5 + 1.2,
        attack: 2.2, release: 0.8, gain: 0.11 }, { layer: 'pad' });
      const WALK = ['C2', 'D2', 'E2', 'G2', 'A2', 'B2', 'C3', 'D3'];
      WALK.forEach((note, k) =>
        push(b0 + (k * span) / WALK.length, 'ks',
          { freq: n(note), dur: 1.8, brightness: 0.3, vel: 0.44 + 0.02 * k },
          { gain: 0.36, pan: -0.1, layer: 'bass' }));
      for (let k = 0; ; k++){
        const t = b0 + k * beat / 2;
        if (t >= SW.announce - 0.2) break;
        if (k % 2 === 1) push(t, 'tick', { gain: 1 },
          { gain: 0.05 + 0.04 * ((t - b0) / span), pan: 0.25, layer: 'perc' });
      }
    }

    /* THE CRESCENDO — announced on the word, alone in the true-VO gap.
       Riser rises from "crescendo" INTO the locked peak; the bloom is a
       C-major glass cascade over a full pad; the afterglow decays under
       p04b's "Right on cue", which gets its own landing note. */
    push(SW.announce, 'chirp', { dur: SW.peak - SW.announce, f0: 130, fmax: 1050, gain: 0.34 },
      { layer: 'fx' });
    push(SW.announce, 'pad', { freqs: [n('C3'), n('E3'), n('G3'), n('C4')],
      dur: SW.resolve - SW.announce + 2.0, attack: SW.peak - SW.announce,
      release: 2.6, gain: 0.30 }, { layer: 'pad' });
    push(SW.peak, 'subdrop', { f0: 90, f1: 38, dur: 0.9, gain: 0.5 }, { layer: 'fx' });
    push(SW.peak, 'ks', { freq: n('C2'), dur: 3.0, brightness: 0.5, vel: 0.95 },
      { gain: 0.55, layer: 'bass' });
    push(SW.peak, 'ks', { freq: n('G2'), dur: 3.0, brightness: 0.5, vel: 0.8 },
      { gain: 0.45, layer: 'bass' });
    ['C4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((note, k) =>
      push(SW.peak + 0.07 * k, 'celesta', { freq: n(note), dec: 2.6, vel: 0.9 - 0.06 * k },
        { gain: 0.62, pan: (k % 2 ? 0.35 : -0.35), layer: 'motif' }));
    push(SW.peak + 0.6, 'pad', { freqs: [n('C3'), n('E3'), n('G3')],
      dur: CH.p04b.end - (SW.peak + 0.6), attack: 0.8, release: 2.4, gain: 0.14 },
      { layer: 'pad' });

    /* p04b — "Right on cue": the score lands a note exactly on the word */
    push(MK.ch4bRight, 'celesta', { freq: n('C5'), dec: 2.0, vel: 0.5 },
      { gain: 0.58, pan: 0.1, layer: 'motif' });
    push(MK.ch4bFiles, 'celesta', { freq: n('E5'), dec: 1.6, vel: 0.3 },
      { gain: 0.5, pan: -0.2, layer: 'motif' });
  }

  /* ========================= CH5 — WARMTH ====================================
     Draft two. C major; a becalmed lattice grid shimmers wide and quiet; the
     six storyboard shots run up the pentatonic as the wall fills; the critique
     leans minor and the go-around resolves it upward ("try again" as play);
     the slate stamps DRAFT 2 — two clear notes, because the count is two. */
  {
    const c = CH.p05;
    const nBars = Math.floor((c.end - c.at) / bar);
    const PADS = [['C3', 'E3', 'G3'], ['F2', 'C3', 'A3'], ['A2', 'C3', 'E3'], ['G2', 'D3', 'B3']];
    const ROOTS = ['C2', 'G2', 'A2', 'F2'];
    for (let b = 0; b < nBars; b++){
      const t0 = c.at + b * bar;
      if (b % 4 === 0)
        push(t0, 'pad', { freqs: PADS[(b / 4) % 4 | 0].map(n), dur: 4 * bar + 0.4,
          attack: 1.8, release: 1.6, gain: 0.115 }, { layer: 'pad' });
      if (b % 2 === 0)
        push(t0, 'ks', { freq: n(ROOTS[(b / 2) % 4 | 0]), dur: 2.6, brightness: 0.24, vel: 0.48 },
          { gain: 0.34, pan: -0.12, layer: 'bass' });
    }
    /* the becalmed lattice — seeded eighth-note grid, sparse, wide, tiny */
    {
      const PENTA = ['C5', 'D5', 'E5', 'G5', 'A5'];
      const g0 = c.at + 2, g1 = c.end - 6;
      const k0 = Math.ceil((g0 - c.at) / (beat / 2));
      for (let k = k0; ; k++){
        const t = c.at + k * (beat / 2);
        if (t >= g1) break;
        if (slotRnd(k, 11) >= 0.15) continue;
        const note = PENTA[Math.floor(slotRnd(k, 12) * PENTA.length)];
        push(t, 'celesta', { freq: n(note), dec: 0.9, vel: 0.16 + 0.12 * slotRnd(k, 13) },
          { gain: 0.45, pan: (slotRnd(k, 14) * 2 - 1) * 0.7, layer: 'chime' });
      }
    }
    ['E5', 'G5'].forEach((note, i) =>
      push(MK.ch5SeedLit[i], 'celesta', { freq: n(note), dec: 1.4, vel: 0.3 },
        { gain: 0.5, pan: 0.2 - 0.4 * i, layer: 'motif' }));
    ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'].forEach((note, i) =>
      push(MK.ch5Shots[i], 'celesta', { freq: n(note), dec: 1.1, vel: 0.3 },
        { gain: 0.5, pan: -0.5 + 0.2 * i, layer: 'motif' }));
    /* the critique: two descending doubts, a firm kind stamp, then the
       go-around — the Correction motif inverted into play (trailer lineage) */
    push(MK.ch5Crits[0], 'celesta', { freq: n('A4'), dec: 1.4, vel: 0.3 },
      { gain: 0.5, pan: -0.15, layer: 'motif' });
    push(MK.ch5Crits[1], 'celesta', { freq: n('G4'), dec: 1.4, vel: 0.3 },
      { gain: 0.5, pan: 0.15, layer: 'motif' });
    push(MK.ch5Revise, 'celesta', { freq: n('D4'), dec: 1.8, vel: 0.36 },
      { gain: 0.55, pan: 0, layer: 'motif' });
    push(MK.ch5Revise + 0.02, 'celesta', { freq: n('A4'), dec: 1.8, vel: 0.3 },
      { gain: 0.55, pan: 0, layer: 'motif' });
    ['C4', 'D4', 'E4', 'G4'].forEach((note, i) =>
      push(MK.ch5Loop + i * beat / 2, 'celesta', { freq: n(note), dec: 1.2, vel: 0.32 },
        { gain: 0.5, pan: 0.1, layer: 'motif' }));
    push(MK.ch5Heard, 'celesta', { freq: n('E6'), dec: 1.2, vel: 0.2 },
      { gain: 0.45, pan: 0.3, layer: 'motif' });
    push(MK.ch5Read, 'celesta', { freq: n('G5'), dec: 1.2, vel: 0.24 },
      { gain: 0.45, pan: -0.3, layer: 'motif' });
    /* DRAFT 2 — two notes, one per draft */
    push(MK.ch5Stamp, 'celesta', { freq: n('G4'), dec: 1.6, vel: 0.4 },
      { gain: 0.55, pan: -0.1, layer: 'motif' });
    push(MK.ch5Stamp + beat / 2, 'celesta', { freq: n('C5'), dec: 2.2, vel: 0.44 },
      { gain: 0.55, pan: 0.1, layer: 'motif' });
  }

  /* ======================== CH6 — RESOLVE ====================================
     Press record. The recap re-lights the mechanism (germ notes 1–3); the red
     row — the human — is the bed's one warm PLUCK among the glass. The
     preflight re-run ripples all six germ notes at SIX GREEN, then holds its
     breath at "and waits" (composed silence). The hand's three clicks tick.
     The mirror recurses as a dying echo. The door opens onto the A-minor
     staircase quote, its last note landing exactly as the door stands open —
     then the bed exhales past the end of the voice. */
  {
    const c = CH.p06;
    push(c.at, 'pad', { freqs: [n('A2'), n('E3'), n('A3')], dur: MK.ch6PfWaits - c.at,
      attack: 2.2, release: 1.6, gain: 0.12 }, { layer: 'pad' });
    const nBars = Math.floor((MK.ch6MirrorDeep - c.at) / (2 * bar));
    for (let b = 0; b < nBars; b++)
      push(c.at + b * 2 * bar, 'ks', { freq: n(b % 2 ? 'E2' : 'A2'), dur: 2.4,
        brightness: 0.22, vel: 0.46 }, { gain: 0.32, pan: -0.12, layer: 'bass' });

    MK.ch6Recap.forEach((t, i) =>
      push(t, 'celesta', { freq: n(SIX[i]), dec: 1.7, vel: 0.32 },
        { gain: 0.55, pan: (i % 2 ? 0.2 : -0.2), layer: 'motif' }));
    push(MK.ch6Human, 'ks', { freq: n('G3'), dur: 2.2, brightness: 0.35, vel: 0.6 },
      { gain: 0.5, pan: 0, layer: 'motif' });        /* the human: wood, not glass */

    SIX.forEach((note, i) =>
      push(MK.ch6PfGreen + i * 0.11, 'celesta', { freq: n(note), dec: 1.3, vel: 0.34 },
        { gain: 0.55, pan: (i % 2 ? 0.3 : -0.3), layer: 'motif' }));
    /* MK.ch6PfWaits: "… and waits." — nothing. The bed holds its breath too. */
    push(MK.ch6PfWaits + 2.2, 'pad', { freqs: [n('A2'), n('E3'), n('A3')],
      dur: MK.ch6EndDoor - (MK.ch6PfWaits + 2.2), attack: 1.8, release: 1.6, gain: 0.115 },
      { layer: 'pad' });

    MK.ch6Clicks.forEach((t, i) => {
      push(t, 'tick', { gain: 1, freq: 3600 }, { gain: 0.16, pan: 0.1, layer: 'perc' });
      push(t, 'celesta', { freq: n(['A5', 'E5', 'A4'][i]), dec: 1.1, vel: 0.26 },
        { gain: 0.5, pan: -0.1, layer: 'motif' });
    });
    MK.ch6Trim.forEach(t =>
      push(t, 'tick', { gain: 1, freq: 5200 }, { gain: 0.13, pan: 0.25, layer: 'perc' }));

    /* the mirror: one note recursing — each copy later, quieter, farther out */
    for (let k = 0; k < 5; k++)
      push(MK.ch6MirrorDeep + k * 0.28, 'celesta',
        { freq: n('E5'), dec: 1.5, vel: 0.36 * Math.pow(0.72, k) },
        { gain: 0.55, pan: (k % 2 ? 0.5 : -0.5) * (0.4 + 0.15 * k), layer: 'motif' });

    /* the door — the staircase quote in A minor spans the swing, landing with
       the door fully open; a final open-A pad carries the fade past the voice */
    {
      const d0 = MK.ch6EndDoor, d1 = MK.ch6EndOpen;
      push(d0 - 2 * bar, 'pad', { freqs: [n('C3'), n('E3'), n('G3')], dur: 2 * bar + 0.4,
        attack: 1.6, release: 1.4, gain: 0.115 }, { layer: 'pad' });
      const QUOTE = [['A4', 0.00, 2.4, 0.42], ['C5', 0.31, 2.4, 0.44],
                     ['E5', 0.65, 3.0, 0.46], ['A5', 1.00, 4.2, 0.5]];
      for (const [note, frac, dec, vel] of QUOTE)
        push(d0 + frac * (d1 - d0), 'celesta', { freq: n(note), dec, vel },
          { gain: 0.6, pan: 0.1, layer: 'motif' });
      push(d0, 'pad', { freqs: [n('A2'), n('E3'), n('A3'), n('E4')],
        dur: totalS - d0 - 1.0, attack: 1.8, release: 1.0, gain: 0.14 }, { layer: 'pad' });
    }
  }

  return {
    events,
    meta: {
      swell: SW, totalS,
      counts: events.reduce((a, e) => (a[e.layer] = (a[e.layer] || 0) + 1, a), {}),
    },
  };
}
