# Art spec — the aquarium soundscape (procedural, gated, one shared mute)

## Assets (three sound builders, one shared namespace)
All forged IN-HOUSE as WebAudio code (never samples), each a dual-use offline/live
builder on a shared `Aqua.sfx` namespace (the same shape as the gate's `Gate.sfx.*`).
Placeholder: the `audio` object in `index.src.html` (a flat filtered-noise bed + a
sine plink) stands in until these are forged.

- **key:** `sfx-water-bed` — medium `sound`, durSec 8, the looping ambient bed
- **key:** `sfx-bubble`    — medium `sound`, durSec 1, an occasional rising bubble one-shot
- **key:** `sfx-swish`     — medium `sound`, durSec 0.4, a fish-swish one-shot on feed/boil

## Art direction
A calm, immersive **deep-water** soundscape you'd leave running for an hour — NOT a
sound effect reel. The bed is the headline: a soft, dark, filtered-noise wash like
water moving in a large tank, with a very slow sub-Hz swell so it breathes; a faint
low resonance for the weight of deep water. Over it, sparse: an occasional rounded
**bubble** rising (a short upward pitch-glide, watery, not a video-game blip), and on
feed/startle a brief **swish** (a soft filtered-noise burst, the school turning as
one). Everything muted, low, and uncrowded — the silence between sounds is part of it.
Match the visual calm of the tank. One DynamicsCompressor limiter on the master so it
can never clip; all gains well under 0 dBFS.

## EXACT API (the builder contract — matches the gate's `Gate.sfx.*`)
```js
// the page creates: window.Aqua = window.Aqua || {}; Aqua.sfx = Aqua.sfx || {};
Aqua.sfx.waterBed = function ({ ctx, dest, dur, when = 0, seed = 1, intensity = 0.6 }) {
  // Build the LOOPING water bed into `dest` (a GainNode the page owns, already behind
  // the limiter + master). Start sources at ctx.currentTime + when. `dur` is the
  // render/loop length (the page loops a buffer source, or you build a continuous
  // graph). intensity 0..1 scales overall level. Determinism: seed a mulberry32, never
  // Math.random. Return { stop(at) } so the page can tear it down. Keep peak << 0 dBFS.
};
Aqua.sfx.bubble = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  // A single rising-bubble one-shot into `dest`. Short (~0.2–0.6s). Return optional {stop}.
};
Aqua.sfx.swish = function ({ ctx, dest, dur, when = 0, seed = 1, boil = 1 }) {
  // A single fish-swish one-shot into `dest` (filtered noise burst). `boil` 0..1 scales
  // brightness/level. Short (~0.2–0.4s).
};
```
- **Dual-use:** must run identically in a live `AudioContext` AND an `OfflineAudioContext`
  (the page's `window.__renderOffline(seconds)` renders the bed + a few bubbles → WAV for
  Audio Lens). Use only `ctx`, never globals.

## How it wires in
After forge installs the three builders (e.g. `art/audio-aquarium.js` exposing `Aqua.sfx`),
the wiring builder does `forge:include art/audio-aquarium.js`, then in the page's `audio`
object: `buildBed` calls `Aqua.sfx.waterBed({ctx,dest:this.master,...})`, `plink` calls
`Aqua.sfx.bubble`/`Aqua.sfx.swish`, and `__renderOffline` calls the same builders against
the offline ctx. The limiter, the master gain, the first-click gate, and the ONE shared
estate mute (`ws:pref:muted` via `WS`) all stay the page's job.

## Verification
Audio-lens the WAV from `window.__renderOffline(8)`: confirm it is NOT silent, not
clipping (peak < 0 dBFS), and reads as a dark low-passed bed (low spectral centroid)
with a few bubble transients — calm, not harsh.

**judgeFocus:** a calm, immersive deep-water bed (slow breathing swell, low resonance)
with sparse rounded bubbles and a soft school-swish — muted and uncrowded enough to leave
running for an hour, never clipping, never a sound-effect reel.
