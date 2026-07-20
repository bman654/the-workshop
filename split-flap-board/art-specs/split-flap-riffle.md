# Art spec — `split-flap-riffle` (sound): the light RIFFLE tick

## What this asset is
The thin, dry tick a leaf makes on a **quick riffle step** — the fast in-between flips a
tile makes as it races round the ring before its final land clack. Deliberately quiet
and papery: when many tiles are mid-cascade these overlap into a **soft clatter**, the
sound of a whole board turning over. It is the humble companion to the hero land clack
(`split-flap-clack`): same material world (woody, dry, mechanical), lower energy, higher
and lighter.

The board's `Sound` orchestrator throttles these globally (~1 every 21 ms) so a
fast-streaming board clatters rather than buzzes; the voice itself just plays one tick.

The PLACEHOLDER (`sound-riffle.js`) is a single short bandpass-noise burst (~2.6 kHz).
This asset makes it **woodier and drier** — the flap of a leaf brushing past, not an
electronic tick — same API.

## House rules this MUST honour (non-negotiable)
- Pure WebAudio, no samples/files. Creates nothing at module load.
- Deterministic from `seed` (module `mulberry32`, no `Math.random`).
- Very short (~10–18 ms audible) and **quiet** (peak well below the land clack) so many
  overlapping ticks read as texture, never as a wall of noise; no onset/offset click.

## The EXACT API the candidate code must expose
Replace the voice body in `sound-riffle.js`, keeping BOTH exports + signatures:

```js
// LIVE voice — one light riffle tick, called per riffle step on the live ctx.
//   opts = { when:number (ctx time), seed:number }
window.SFRiffle = { voice: function (ctx, dest, opts) { … } };

// OFFLINE bench builder — renders a STREAM of ~28 ticks over ~1 s (a full board
// mid-cascade at the orchestrator's throttle cadence) so the judge hears the CLATTER
// texture, not one lonely tick.
Gate.sfx['split-flap-riffle'] = function (opts) { /* opts: {ctx,dest,when,seed,dur} */ … };
```

## Render / judge bench
Universal WAV bench. `durSec: 1.2`. The offline builder streams ~28 jittered ticks so
the render is the clatter of a full board mid-cascade.

## Judge focus (one line)
Does a stream of these read as a **dry, woody, papery clatter** of leaves turning —
light, quiet, mechanical — with **no metallic-bright ring and no buzz** when overlapped?

## Constraints
- Keep the exports + signatures. Peak level clearly below the land clack.
- Must sit as the same material family as `split-flap-clack` (woody/dry), just lighter.
- VERIFY forged takes with the **audio-lens** skill (level / centroid / no tone) before synth.
