# ART SPEC — `cento-kiss` · the platen kiss

Part of **The Cento Press** (`compositor/the-cento-press/index.html`) — a working print shop whose
walls fill with the house's own words. Five in-house sounds carry the machine; all five are crude
WebAudio stand-ins today (a filtered noise burst with an exponential envelope), which is enough to
carry the *sequence* and nothing like enough to carry the *feel*.

## What this one is

The single low thunk at the moment the cylinder first meets the packed forme — the instant
the press stops running free and starts to bite. It fires **once per pull**, at `turn = 0.44`, and it
is the sound that tells the hand the haul is beginning. Immediately after it the creak starts and the
crank gets heavy.

## Art direction

**Weight.** A big, soft, low impact — heavy iron settling onto packed paper and lead, felt
more than heard. Fundamental down around 55–90 Hz with a fast decay, a brief compression of the
packing above it (a short muffled paper/felt squash), and a faint iron ring that dies almost at once.
Absolutely no click, no snap, no drum. This should read as MASS. If it makes the listener's chest
expect the rest of the pull to be hard work, it is right.

Target length: **≈0.45 s**.

## The EXACT API the candidate code must expose

The estate's standard `Gate.sfx` builder contract (see `the-gate/audio-creak.js` for a worked
example of the file shape). A plain IIFE script, no modules, no imports:

```js
(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  Gate.sfx['cento-kiss'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
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
`Gate.sfx['cento-kiss']({ ctx: ac(), dest: <the page's master gain>, dur: 0.45, seed: <varied per call> })`,
then deletes the stand-in. The page's existing mute (`ws:pref:muted`, muted by default) and the
user-gesture unlock stay exactly as they are.

**Module the winner installs into:** `compositor/the-cento-press/cento-kiss.js`

## The bar

Does it land like several kilos of iron meeting packed paper? Is there real low-end weight
without boom or clipping? Does it promise effort?
