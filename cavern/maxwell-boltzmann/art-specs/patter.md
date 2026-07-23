# Art asset — the disc-on-lid patter (sound)

This is where **"pressure you HEAR getting harder"** lives. Each disc that strikes the
lid makes a tiny tick; hundreds a second become a *patter*, and as you pile weight on and
the gas compresses, the hit-rate climbs — the patter grows **denser and sharper**. The
placeholder is a bare square-wave blip. This asset replaces the single tick with a warm,
granular, felt-on-metal micro-impact.

## Art direction

- **A single micro-tick: a grain of disc-on-metal.** Very short (5–25 ms), soft-edged, a
  little pitched-noise "tk" with a hint of the lid's metal ring. NOT a click track — it
  must sum politely, because dozens land per second and the *texture of the density* is
  the instrument. Think fine gravel on a steel drum, not a snare.
- **`hardness` maps to attack + brightness.** A parameter `hardness` (0..1, driven by the
  live hit-rate / compression) sharpens the attack and lifts the spectral centroid: a
  slack gas → soft, dark, sparse taps; a crushed gas → tight, bright, dense patter. Keep
  each grain quiet (peak ≲ 0.05) so the crowd doesn't clip; the master is muted-aware.
- Deterministic given `seed` for micro-variation (so it's not a machine-gun of identical
  clicks). No samples, no reverb tail.

## EXACT API the candidate code must expose

Install a builder as **`window.LidSfx.patter`** with the `Gate.sfx`-style contract:

```js
window.LidSfx = window.LidSfx || {};
window.LidSfx.patter = function (o) {
  // o = { ctx, dest, when, dur, gain, hardness, seed }
  //   ctx      : AudioContext
  //   dest     : AudioNode — connect your grain's output HERE (a muted-aware master)
  //   when     : ctx-time to start
  //   dur      : ~grain length target (s), ~0.02
  //   gain     : 0..1 peak (already scaled small per grain)
  //   hardness : 0..1 — attack sharpness + brightness (compression)
  //   seed     : Number — deterministic micro-variation
  // Schedule ONE grain. Create your own nodes, connect to dest, start at `when`, stop by
  // ~when+dur. Do not touch dest.gain.
};
```

For the WAV bench render one grain at `hardness≈0.8`, `dur≈0.03`. Keep the body free of
page globals so it renders both on the bench and on the page.

## How it wires in

The winner's body replaces the `patter:` method inside the inline `Sfx` object in
`cavern/maxwell-boltzmann/lid.html` (the placeholder throttles + plays a square blip when
`hitRate` is high). Wire it so each call passes `hardness` derived from `live.hitRate`
(and/or the compression `1 − y/Y_CEIL`), keeping the existing rate-throttle so grain
density tracks the real hit-rate. Honour `ws:pref:muted`.
