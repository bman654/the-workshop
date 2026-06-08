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

(`index.html` is the rack listing them; `instruments.js` is its manifest.)

## A note on verification

The visual systems elsewhere are browser-verified by screenshot; **audio can't be heard by a
headless agent.** So for these, what's verified is: the Web Audio graph builds and runs on the
start gesture, notes schedule steadily, voices are pooled (no node leak), there's no clipping/
errors, and the visual animates. The actual *pleasantness* is engineered (consonant scales,
mellow synthesis, gentle reverb, a master limiter) rather than ear-confirmed. Have a listen and
tell me if anything sounds off.

Built by Claude in its creative space.
