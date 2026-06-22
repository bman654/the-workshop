# 🎵 Sound Garden

*Generative audio-visual instruments — music grown from geometry.*

The workshop's ear. Where the Strange Garden gives you systems to *watch*, the Sound Garden
gives you systems to *hear* (and watch). Each is one self-contained HTML file, **zero
dependencies** — all sound synthesised live with the Web Audio API, no audio files.

> Audio needs a click to begin (browser autoplay rules). Open `index.html` (the rack),
> pick an instrument, and press **▶ begin**.

## Instruments

| Instrument | What it is |
|---|---|
| **Whitney Music Box** (`whitney.html`) | Concentric rings of orbiting dots; each chimes a note from a consonant scale as it crosses the line. Their differing periods spiral apart and realign, weaving ever-shifting polyrhythmic music. Pick scale/root/tempo/timbre/reverb. |
| **Drift** (`drift.html`) | Sustained voices breathe a slow, ever-drifting consonant chord — an Eno-ish ambient pad/drone under a vast procedural reverb, with a soft cloud-bloom visual. |
| **Euclidean Rhythms** (`euclid.html`) | Circular tracks spread their beats evenly (Bjorklund) into braided polyrhythms — synth percussion on a tight audio-clock scheduler, with rotating beat-rings. |
| **Rain** (`rain.html`) | Seeded rain falls on a tuned pool — each drop plinks a note in scale, rings, and ripples away across the water. |
| **Loom** (`loom.html`) | A seeded loom weaves an evolving diatonic chord progression into shimmering Karplus–Strong plucked arpeggios; a shuttle sweeps the warp of tuned strings. |
| **Carillon** (`carillon.html`) | A ring of tuned bells rung in slowly-evolving change-ringing permutations; long inharmonic decays overlap into shifting, resonant harmony. |
| **Lattice** (`lattice.html`) | A glowing pitch × time grid (a Tenori-on you can *see*): a playhead column sweeps left→right; lit cells chime in scale and bloom as it crosses them. The seeded pattern is musical by construction and gently mutates so it never repeats. Pick scale/root/tempo/density/evolve; click cells to play along. |
| **Grain Mill** (`grain-mill.html`) | The **granular** family the rack lacked (pluck/FM/additive/formant/Shepard/beating all present — never grains). Tip a held cello tone into a brass hopper and it shatters into hundreds of glowing **sound-grains**; slide GRAIN SIZE (long = pitch ↔ short = breath) and DENSITY (sparse plinks ↔ continuous wash) to melt one note into rain → a drone → mist. The luminous cloud is driven by the same grains it plays. (Grains of *sound*, not the number-grains of the Benford Mill.) |
| **Gamelan** (`gamelan.html`) | Two interlocking parts — polos and sangsih — weave into one gap-free stream on inharmonic metallophones tuned to slendro or pelog (genuine non-12-TET, defined in cents). |
| **Monochord** (`monochord.html`) | Pluck, slide, and touch one tensioned string — its overtones are an exactly even ladder you can see and hear (fₙ/f₁ = n). Pinch a node and the harmonic isolates. |

A little ensemble: **melody** (Whitney), **harmony** (Drift), **rhythm** (Euclid),
**texture** (Rain), **chordal motion** (Loom), **resonance** (Carillon), a
**sequencer you can watch** (Lattice), and **grain texture** (Grain Mill).
(`index.html` is the rack listing them; `instruments.js` is its manifest.)

## A note on verification

The visual systems elsewhere are browser-verified by screenshot; **audio can't be heard by a
headless agent.** So for these, what's verified is: the Web Audio graph builds and runs on the
start gesture, notes schedule steadily, voices are pooled (no node leak), there's no clipping/
errors, and the visual animates. The actual *pleasantness* is engineered (consonant scales,
mellow synthesis, gentle reverb, a master limiter) rather than ear-confirmed. Have a listen and
tell me if anything sounds off.

The newer **lens-native** instruments (Carillon, Lattice, Monochord, Grain Mill) go further: their
synth + scheduler run unchanged under an `OfflineAudioContext`, so `window.__renderOffline(seconds,
seed)` renders the sound to a WAV **silently** (no speakers) and it can be measured by eye + number
through `tools/audio-lens/` — peak dBFS, % clipped, and detected pitches vs scale. **Grain Mill** is
verified at *both slider extremes*: sparse Rain (peak −13.7 dBFS, 0 % clipped, an audible plink) and
dense Wash (peak −13.8 dBFS, 0 % clipped, a continuous mist) both land in band with the held cello
pitch preserved — the equal-power overlap comp + the 64-grain cap mean the densest wash never clips.
**Lattice** is the
most directly verifiable of all: because it's a *visible* pitch×time sequencer, you can confirm
it works from a single screenshot (playhead position + lit cells + a bloom flash), and its
rendered audio measures peak ≈ −37 dBFS / 0 % clipped with every scheduled note provably
in-scale (rows *are* the scale degrees).

Built by Claude in its creative space.
