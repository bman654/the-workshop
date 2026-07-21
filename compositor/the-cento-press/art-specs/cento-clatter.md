# ART SPEC — `cento-clatter` · the spilled slug

Part of **The Cento Press** (`compositor/the-cento-press/index.html`) — a working print shop whose
walls fill with the house's own words. Five in-house sounds carry the machine; all five are crude
WebAudio stand-ins today (a filtered noise burst with an exponential envelope), which is enough to
carry the *sequence* and nothing like enough to carry the *feel*.

## What this one is

The signature sound of the piece's curation loop. A slug of standing type is tipped out of
the galley and drops back into its box — **lead landing on lead**, then settling. It fires once per
spill, and the spill is the mechanic the whole galley exists for, so this sound carries a lot of the
piece's tactility.

## Art direction

**Lead on lead in a wooden box.** Dense, dull, heavy-metal — lead is soft and does not
ring; it goes *chock*, not *ting*. Two or three distinct impacts in quick succession (the slug hits,
tips, settles), progressively quieter and lower, with a little wooden box resonance around them and a
last small scatter as it comes to rest. The timing between impacts should feel physical — not
evenly spaced. No bell, no chime, no metal ring, nothing bright.

Target length: **≈0.55 s**.

## The EXACT API the candidate code must expose

The estate's standard `Gate.sfx` builder contract (see `the-gate/audio-creak.js` for a worked
example of the file shape). A plain IIFE script, no modules, no imports:

```js
(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  Gate.sfx['cento-clatter'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
    // ctx  : an AudioContext (may be an OfflineAudioContext when rendered/judged)
    // dest : the AudioNode to connect into — NEVER connect to ctx.destination
    // dur  : the intended length in seconds
    // when : ctx.currentTime-relative start offset in seconds
    // seed : integer; drive ALL randomness from a mulberry32 seeded with it
    // Schedule everything and return. No callbacks, no setTimeout, no rAF.
  };
}(typeof self !== 'undefined' ? self : this));
```

### Hard requirements

1. **Determinism.** A seeded `mulberry32(seed)` drives every random value (noise samples, jitter,
   timing). **No `Math.random`, no `Date`, no `performance.now`** — the offline WAV the judges hear
   must be byte-for-byte the one that ships.
2. **Connect to `dest`, never `ctx.destination`.** The page owns the master gain and the mute.
3. Schedule against `ctx.currentTime + when`. Everything must be scheduled synchronously.
4. Peaks well under 0 dBFS — target a true peak around **−6 dBFS**; this fires often and must never
   clip or fatigue.
5. Fully synthesised: oscillators, buffers you fill yourself, filters, envelopes. **No samples, no
   external files, no network.** Nothing foraged.
6. Clean up after itself — stop every source; no node runs past `when + dur`.

## The room it plays in

A warm, dark, wooden print shop. Everything here is **wood, cast iron, lead, ink and paper**. No
brass, no bells, no music, no tonality that reads as a UI chime. These are the noises a machine and a
material make; they should sound like they were recorded a metre away in a small room with soft
furnishings, not close-miked and not reverberant.

**Muted by default** — the visitor opts in. So when they do turn it on, it has to be worth it.

## How it wires in

`compositor/the-cento-press/index.html` has an `SFX` object (search for `const SFX={`) whose members
are the crude stand-ins. The wiring builder loads the forged module with a `<script>` tag and
re-points the matching `SFX` member at
`Gate.sfx['cento-clatter']({ ctx: ac(), dest: <the page's master gain>, dur: 0.55, seed: <varied per call> })`,
then deletes the stand-in. The page's existing mute (`ws:pref:muted`, muted by default) and the
user-gesture unlock stay exactly as they are.

**Module the winner installs into:** `compositor/the-cento-press/cento-clatter.js`

## The bar

Does it sound like a heavy soft-metal object dropped into a wooden compartment and settling —
dull, dense, satisfying? Would you click the spill button again just to hear it?
