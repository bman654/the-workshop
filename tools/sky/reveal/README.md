# The Survey Reveal — front-door constellation-reveal cues

When a visitor returns to the front door having completed a new constellation ("charted a
formation") in the **Survey of Heaven** (`tools/sky/sky.js`), the map runs a guided
**reveal choreography**: a modal ("the survey has uncovered a new formation" — the
audio-unlock gesture + a mute toggle), then the camera flies to each newly-charted
formation one-by-one, its member-stars brighten in a climbing ladder, its asterism line
inks in, and its engraved name is written — with a short musical sequence. (Choreography +
DOM live in `index.src.html`; reduced-motion falls back to a static reveal.)

These two files are the **sound cues**, hand-authored SHIPPABLE placeholders that define
the exact API and are forged into voiced finals by the in-house **ART FOUNDRY** (K takes →
judges → synth; `art-foundry/engine.workflow.js`, medium `sound`). Never forage.

| module              | key                | what it is                                              | durSec |
|---------------------|--------------------|--------------------------------------------------------|--------|
| `sfx-survey-pip.js`  | `Gate.sfx.surveyPip`   | a star kindling — climbs a pentatonic step per member  | 0.6 |
| `sfx-survey-chart.js`| `Gate.sfx.surveyChart` | the resolve motif as a formation is named (keyed by param) | 2.8 |

## Sound contract (both)
Each installs `window.Gate.sfx.<key> = function ({ ctx, dest, dur, when=0, seed=1, param }) { … }`
returning `{ stop(at) }`. Renders on the passed `ctx` (a live AudioContext OR an
OfflineAudioContext — never creates its own), connects to `dest`, starts at
`ctx.currentTime + when`. QUIET (peak << 1, no clipping), warm not glassy, deterministic
given `seed` (mulberry32). Played via the front door's mute-aware `Gate.sfxPlay(key, dur,
param)`, silent until the reveal modal's first gesture. Specs: `specs/survey-*.md`.

## Verify a cue
```
GATE_SRC="$PWD" bash art-foundry/render-wav.sh /tmp/mf/<k>-s tools/sky/reveal/sfx-survey-<k>.js 8901 /tmp/mf/<k>-o <durSec>
node tools/audio-lens/bin/audio-lens.js analyze /tmp/mf/<k>-o/asset.wav --human
```
The bench renders at `param=0`; both cues must read in tune and clean there.
