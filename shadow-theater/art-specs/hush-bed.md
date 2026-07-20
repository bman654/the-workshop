# Art spec — `hush-bed` (sound): the LANTERN HUSH BED

## What this asset is
The ambient VOICE of The Shadow Theater: the room-tone of a warm, quiet room lit by
a single lamp. A HUSH, not a drone — barely there, felt more than heard, and it
**BREATHES**: a slow (~0.15–0.4 Hz) amplitude random-walk, as if the lamp's flame
wavers. The piece sings its own air, so the page wears NO estate air chip. Muted by
default; it must NEVER machine-gun or swell into a wall of noise.

Ingredients (keep the anatomy, make it warmer + more alive):
- a **low, lowpassed brown room-tone** — the dark warm body of the sound (~1/f²,
  lowpass ~300–400 Hz);
- a **faint warm-lamp hiss** — a quiet, higher, gently bandpassed layer (a hair of
  air), well below the room-tone;
- a **slow amplitude random-walk** — the breath: the master gain wanders within a
  warm band on a ~2.5–6.5 s period.

The PLACEHOLDER (`sound-hush.js`) is a real WebAudio bed (brown noise + hiss + a slow
LFO random-walk) and already reads dark + breathing on the bench (audio-lens:
no clip, centroid ~169 Hz, ~5 breath onsets over 4 s). This asset makes it **warmer,
rounder, more alive** — same API.

## House rules this MUST honour (non-negotiable)
- Pure WebAudio, no samples/files, no foraged reverb. Everything synthesized on the
  ctx it is handed.
- Creates NOTHING at module load. The page's `Sound` orchestrator owns gesture-unlock
  and the shared mute; the bed is only ever *started* by `HushBed.start`.
- Deterministic from `seed` on the offline bench (module `mulberry32`, no
  `Math.random` in the offline-scheduled graph) so the rendered WAV the judge hears
  is stable.
- Quiet + smooth: no clipping, no onset/offset click, and the breath must be GENTLE
  (never a fast tremolo, never a machine-gun of ticks).

## The EXACT API the candidate code must expose
Replace the graph in `sound-hush.js`, keeping BOTH exports + signatures identical
(mirrors the Split-Flap dual-use idiom EXACTLY):

```js
// LIVE bed — the orchestrator starts this once, on the live ctx, into `dest`
// (a GainNode -> destination). Returns a handle with stop(). Fades in from silence
// and keeps breathing until stop() (which fades out cleanly).
//   opts = { gain?:number (~0.5), seed?:number, when?:number }
window.HushBed = { start: function (ctx, dest, opts) { return { stop: function(){…} }; } };

// OFFLINE bench builder — the foundry renders this to a WAV and audio-lens's it.
// Render a fixed slice with a VISIBLE slow amplitude wobble (a couple of breaths).
//   opts = { ctx, dest, dur, when, seed }
Gate.sfx['hush-bed'] = function (opts) { return { stop: function(){} }; };
```

## Render / judge bench
Universal WAV bench. `durSec: 4.0`. The offline builder must render several seconds
with at least two visible breaths so the audio-lens confirms the slow wobble.

## Judge focus (one line)
Does it read as a **warm, dark, breathing lantern hush** — a low brown room-tone with
a faint warm hiss and a slow amplitude wander — quiet, smooth, never a drone or a
machine-gun, with **no clipping and a dark spectral centroid**?

## Constraints
- Keep BOTH exports + signatures; keep the live/offline dual-use.
- VERIFY each forged take with the **audio-lens** skill BEFORE synth: RMS present
  (not silent), NO clipping (peak < 0 dBFS), DARK centroid (low, ~150–300 Hz), and a
  visible slow amplitude wobble (a handful of gentle onsets over the render, not a
  buzz).
- No pitch/tone that reads as a note; this is texture, not music.
