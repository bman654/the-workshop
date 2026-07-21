# ART SPEC — `cento-creak` · the strain creak

Part of **The Cento Press** (`compositor/the-cento-press/index.html`) — a working print shop whose
walls fill with the house's own words. Five in-house sounds carry the machine; all five are crude
WebAudio stand-ins today (a filtered noise burst with an exponential envelope), which is enough to
carry the *sequence* and nothing like enough to carry the *feel*.

## What this one is

The press complaining under load. It fires repeatedly (every ~105–175 ms) through the last
third of the revolution, and both its pitch and its loudness track two live values the page passes
through `seed`-varied calls: how much **strain** is on the frame and how fast the **hand** is moving.
It is the whole reason the crank feels heavy — the ear supplies the effort the hand only infers.

## Art direction

**Stick-slip in timber and iron.** Not a door hinge, not a floorboard: the low, grainy,
slightly pitched groan of a loaded wooden frame with an iron shaft turning in it. Band-limited and
LOW — the energy wants to live around 170–450 Hz with a rough, granular texture (irregular stick-slip
events, not a smooth tone sweep). It should feel continuous when the calls overlap and never resolve
into a recognisable musical pitch. A hint of dryness, as of unoiled wood.

Because the page calls this many times with different seeds, **each call must differ audibly** — the
grain, the exact centre, the envelope — so a run of them sounds like one continuous groan under a
moving hand rather than a loop.

Target length: **≈0.2 s**.

## The EXACT API the candidate code must expose

The estate's standard `Gate.sfx` builder contract (see `the-gate/audio-creak.js` for a worked
example of the file shape). A plain IIFE script, no modules, no imports:

```js
(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  Gate.sfx['cento-creak'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
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
`Gate.sfx['cento-creak']({ ctx: ac(), dest: <the page's master gain>, dur: 0.2, seed: <varied per call> })`,
then deletes the stand-in. The page's existing mute (`ws:pref:muted`, muted by default) and the
user-gesture unlock stay exactly as they are.

**Module the winner installs into:** `compositor/the-cento-press/cento-creak.js`

## The bar

Chain eight calls back to back: does it sound like a heavy machine being hauled through its
hardest stretch? Is it rough and wooden rather than tonal or synthetic? Does it stay under the
ratchet in the mix?
