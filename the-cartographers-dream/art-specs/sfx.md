# The Cartographer's Dream — SFX spec

Three in-house `Gate.sfx` WebAudio builders. Estate contract:
`Gate.sfx.<key>({ ctx, dest, dur, when=0, seed=1, param }) -> { stop(at) }`, deterministic (seeded
`mulberry32`, never `Math.random` inside the builder), dual-use on a live OR OfflineAudioContext.
Muteable via the shared `ws:pref:muted` (never a per-page key); unlocked on the first user gesture.

## `nib` (`sfx-nib.js`) — the pen-scratch of ink on vellum
- **Character:** a short, dry, PAPERY scratch grain — no tone, no click train. Played in overlapping
  bursts WHILE the lantern lights new cells; falls silent at rest.
- **`param`** = normalized reveal activity 0..1: raises the bandpass center (1.4k→4k Hz) and the grain
  level (0.05→0.14 peak) and the page's re-trigger rate, so a busy sweep sounds busier than a slow one.
- **Build:** lowpassed noise buffer → highpass 700 → bandpass (center rises with param) → fast papery
  gain env (8ms attack, exp decay over `dur`).
- **Verified (audio-lens):** no clipping (0%), centroid ~3.4k (dry-scratch band), peak ~-26 dBFS (quiet).

## `fwump` (`sfx-fwump.js`) — a fresh sheet settling
- **Character:** a soft LOW paper-thump (the settle) + a brief AIRY high-passed flutter (the edge
  riffling). One-shot on RE-SEAL (new sheet). No tone, no click.
- **Build:** two taps off one noise buffer — a lowpass body (520→120 Hz sweep, fast decay) + a highpass
  air swell (2.2k). Peaks ~-18 dBFS.
- **Verified:** no clipping; low body + air present.

## `ting` (`sfx-ting.js`) — a brass compass chime
- **Character:** a gentle struck-brass note (a soft bell), warm not glassy. One-shot on compass bearing-
  LOCK (needle settles to true north at rest) and on the first CARTOUCHE title.
- **Build:** three sine partials (784 G5 fundamental + 1174 + 1568), fast pluck env, master 0.16.
- **Verified:** no clipping; reads G4/G5 warm brass; peak ~-12 dBFS.
