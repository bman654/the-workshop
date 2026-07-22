# Art asset — the marimba voice (sound)

A single pitched mallet note, struck when a bob passes through the bottom of its
swing. Fifteen threads over ~2.7 octaves of a major-pentatonic ladder (longest = low);
in the chaos they scatter into a gentle rippling cascade, and at each recurrence they
collapse into a soft unison chord. The placeholder is a bare sine + triangle octave;
this asset replaces it with a warm, woody, in-tune marimba/mallet voice.

## Art direction

- **Warm, woody, pitched, short.** A marimba/mallet bar: a strong fundamental, a fast
  percussive attack (a few ms), a fast exponential decay to silence, a faint pitched
  overtone (a marimba bar rings mostly at ~1 and a quiet partial near the 4th harmonic),
  and a *tiny* noise transient at the very onset (the felt mallet's tick) — kin to, but
  softer and rounder than, the cradle's brass clack. NO long sustain, NO reverb tail
  baked in, NO detune drift, NO buzz. It should sit politely so a chord of many lands
  as a bloom, not a wall.
- **In tune.** The note plays at the exact `freq` passed in — do not add fixed detune;
  a hair of onset inharmonicity for character is fine but the perceived pitch must be
  `freq`. (The bench maps bob n → a major-pentatonic degree, A3 base, over ~2.7 octaves;
  verify a rendered note with `audio-lens` reads the intended pitch, cents ≈ 0.)
- **Dynamics.** `gain` (0..1) is the strike loudness (swelled by the bob's speed). The
  low threads get a longer, darker `dur`; the high threads shorter/brighter — honour
  the `dur` passed. Peak must not clip; the whole graph runs into a muted master, so
  aim for a clean single-note peak ≲ 0.5 and let polyphony sum safely.
- Pure WebAudio, deterministic given inputs (a `seed` is available if you want a
  micro-varied mallet tick; keep it subtle). No samples, no external files.

## EXACT API the candidate code must expose

Define, in the candidate file (a JS builder module), a function installed as
**`PA.marimba`** with this contract:

```js
PA.marimba = function (o) {
  // o = { ctx, dest, freq, when, dur, gain, seed }
  //   ctx  : AudioContext
  //   dest : AudioNode  — connect your voice's output HERE (the muted master gain)
  //   freq : Number Hz  — the fundamental; play exactly this pitch
  //   when : Number     — ctx-time to start (already includes a small lead)
  //   dur  : Number s   — target note length (schedule your decay to end by ~when+dur)
  //   gain : Number 0..1— peak loudness
  //   seed : Number?    — optional; for a subtle deterministic mallet-tick variation
  // Schedule ONE note. Create your own oscillators/gains/filters, connect to `dest`,
  // start at `when`, and stop by ~when+dur (+ a short release). Do not touch dest.gain.
};
```

For the foundry's universal WAV bench the same voice is exercised as a
`Gate.sfx`-style builder — render one note at a fixed `freq` (e.g. 440 Hz), `dur`
(~0.6 s), into an offline context and analyse. Keep the body free of page globals so it
runs both on the page (`PA.marimba(o)`) and on the bench.

## How it wires in

The winner replaces the `PA.marimba` placeholder body in
`cavern/pendulum-wave/art.js`. The page already calls
`PA.marimba({ctx, dest: master, freq: noteFreq(i), when, dur, gain})` on each bob's
downward bottom-crossing, with `master` a muted GainNode that honours `ws:pref:muted`
and starts silent (this bench opts out of sound until a gesture). **After installing,
re-forge** the page and keep `forge --check --all` clean.

## Judging

- **judgeFocus:** does it sound like a warm, in-tune wooden marimba mallet — fast
  woody attack, clean fast decay, correct pitch (cents ≈ 0), a soft onset tick, no buzz
  or clipping — and does a stack of them bloom rather than wall up?
- **durSec:** 0.6
