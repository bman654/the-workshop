# THE TEN-FOLD GLASS — the sound of the detent

**The subject:** the single sound this room makes. A brass coarse-focus drum
seating into a machined detent groove, under a leaf spring — heard from a hand's
distance, in a quiet room.

The placeholder is a triangle-wave blip plus a 196 Hz sine body. It is *fine* and
it is not *right*: it sounds like a UI tick, not like metal dropping into metal.

## What it must sound like

* **A pawl on brass**, not a click track. There is a tiny scrape as the spring
  crests the ridge, then the *drop* — a short, dense, inharmonic transient — and
  then the drum's own body ringing briefly under it, low and woody-metallic and
  gone in under a quarter second.
* **Small.** Peak well under full scale; this fires up to a few times a second
  when the wheel is spun, so it must never fatigue or stack into a buzz.
* **Alive, not identical.** Successive strikes must differ slightly (the `seed`
  argument drives that) — a real detent never clicks twice the same.
* **`strength` must be audible as force**, not just volume: a hard seat is
  brighter and has more body; a light one is a dry tick.

## The contract

Your take is a **JS module file** — classic script, no imports/exports/deps —
containing the estate's standard sfx builder shape:

```js
Gate.sfx = Gate.sfx || {};
Gate.sfx['tenfold-detent'] = function ({ ctx, dest, dur, when = 0, seed = 1, strength = 1 }) {
  // build the graph, connect to dest, schedule everything at `when`
  // return nothing; schedule only — no ctx.resume(), no global state
};
```

* It must work identically on a live `AudioContext` **and** on an
  `OfflineAudioContext` (the bench renders it offline to a WAV). So: no
  `setTimeout`, no `requestAnimationFrame`, no reading `ctx.currentTime` as a
  base — schedule everything relative to `when`.
* Connect only to `dest`, never to `ctx.destination`.
* Every node must be `start()`ed and `stop()`ped within `when + dur`; leave
  nothing running.
* `strength` ∈ [0.3, 1]. `seed` is an integer; use it for all randomness so a
  take is reproducible.
* Pure WebAudio synthesis — oscillators, noise buffers you generate yourself,
  filters, envelopes. **No sample files, nothing foraged.**

Worked examples of this exact contract live in `the-gate/audio-creak.js` and
`the-gate/audio-gears.js`.

## Render / judging

`durSec` 0.45 — a single strike at `strength = 1`, with silence either side.
Judged on: does it sound like *machined brass seating*, is the transient tight
and unfatiguing, does it stay well clear of clipping, and would you enjoy hearing
it forty times in a row while spinning the wheel down the ladder.

## How it wires in

The winner is installed as `ten-fold/sfx.js` and forge-included into
`ten-fold/index.src.html`. The page's `click(strength)` function then calls
`Gate.sfx['tenfold-detent']({ ctx: ac, dest: ac.destination, dur: 0.45, when:
ac.currentTime, seed: (Math.random()*1e6)|0, strength })` in place of its inline
oscillator graph, keeping the existing user-gesture unlock and the shared
`ws:pref:muted` respect exactly as they are.
