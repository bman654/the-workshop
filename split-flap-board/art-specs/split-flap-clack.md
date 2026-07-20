# Art spec — `split-flap-clack` (sound): the hero LAND clack

## What this asset is
The moment a split-flap tile's final leaf SNAPS home — the payoff sound of the whole
board. A **dry, woody, mechanical** clack: the leaf's edge striking its stop. It must
read as a real Solari flap coming to rest, not a synthetic click. It carries a tiny
delayed **settle-tick** for the leaf's overshoot/rebound (the leaf slaps, bounces a
hair, settles). A full board resolves as dozens of these ~28 ms apart, so the family
must NOT machine-gun: the builder round-robins four seed variants, and this asset is
the voice that produces them.

The PLACEHOLDER (`sound-clack.js`) is a hand-built bandpass-noise knock + triangle
body-thump + top tick + settle-tick, already round-robined across four variants. This
asset makes it **woodier, drier, more like real struck plastic-over-metal** — same API.

## House rules this MUST honour (non-negotiable)
- **Pure WebAudio, no samples/files, no foraged reverb.** Everything synthesized on the
  ctx it is handed.
- Creates NOTHING at module load. The board's `Sound` orchestrator owns gesture-unlock
  and the shared mute; the voice is only ever *called* to play (it may create/cache
  buffers on the passed ctx, but must not touch `window`/globals at load).
- Deterministic from `seed` (use the module's `mulberry32`, no `Math.random` in the
  scheduled graph) so the rendered WAV the judge hears is the graph that ships.
- Short and punchy: a single land is ~60–90 ms of audible energy; no long tail, no
  ring-out, no DC-offset click at onset/offset.

## The EXACT API the candidate code must expose
Replace the voice body in `sound-clack.js`, keeping BOTH exports and every signature
identical:

```js
// LIVE voice — the orchestrator calls this once per tile-land, on the live ctx,
// connecting into `dest` (a GainNode -> DynamicsCompressor -> destination).
//   opts = { when:number (ctx time), seed:number (round-robin variant), vel:0..1 }
window.SFClack = {
  voice: function (ctx, dest, opts) { … }
};

// OFFLINE bench builder — the foundry renders this to a WAV and judges it.
// It MUST fire a short round-robin BURST (four lands ~0.11 s apart, seeds seed..seed+3)
// so the judge hears the VARIANT FAMILY and can score machine-gun-ness, not one clack.
Gate.sfx['split-flap-clack'] = function (opts) { /* opts: {ctx,dest,when,seed,dur} */ … };
```

Recommended ingredient anatomy (keep, but make each read woodier):
- a **dry woody impact** — bandpass-filtered noise burst, centre ~1650–1850 Hz, Q ~1,
  ~45 ms, the leaf edge meeting the stop;
- a **low body-thump** — a short triangle (or filtered sine) ~140–165 Hz dropping in
  pitch over ~75 ms, the mass of the leaf;
- a **top tick** — a very short high bandpass noise (~3.4 kHz), the crisp edge contact;
- a **delayed settle-tick** — a tiny high tick ~70–90 ms after the land, the rebound.
Vary centre freq / body pitch / settle delay across the four seed variants so no two
lands are identical.

## Render / judge bench
Universal WAV bench. `durSec: 1.2`. The offline builder fires four round-robin lands so
the render is a short clatter, not one hit.

## Judge focus (one line)
Does it sound like a **dry, woody, mechanical** split-flap clack — four distinct
variants that clatter rather than machine-gun — with **no metallic-bright ring, no
foraged reverb**, punchy and short?

## Constraints
- Keep the two exports + signatures; keep the four-variant round-robin (via `seed`).
- No clipping (the orchestrator's compressor glues the board, but a single voice must
  not clip on its own); no onset/offset clicks; honour `vel` for a softer/harder land.
- VERIFY each forged take with the **audio-lens** skill (clipping / spectral centroid /
  no unintended tone) before synth.
