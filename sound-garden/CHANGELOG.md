# Sound Garden — Changelog

## 2026-06-11 — Carillon (new instrument)

Added `carillon.html`, the rack's sixth instrument and its struck-inharmonic-metal
voice (Whitney = orbital chimes, Drift = ambient chord, Euclid = Euclidean rhythm,
Rain = tuned-pool plinks, Loom = plucked-string arpeggios, **Carillon =
bells/gongs** — the resonant, inharmonic timbre the rack lacked).

- **Concept — a seeded carillon.** A ring of 8 tuned bells (a classic peal),
  each fundamental snapped to a selectable consonant scale + root, ascending from
  the tenor. A change-ringing engine rings the bells in a "row", then mutates the
  order by a few adjacent swaps each round (plain-hunt / bob-flavoured) so the
  permutation slowly evolves and never repeats. The long bell decays overlap
  successive strikes into shifting harmony; occasional struck chords; tempo,
  density and swap-count drift via seeded smooth-noise.
- **Voice — inharmonic bell (the signature).** Each strike is additive over
  bell-like partial ratios: hum 0.5×, prime 1× (the strike tone), tierce 1.19×
  (the bittersweet minor-third overtone), quint 1.5×, nominal 2×, plus higher
  inharmonic ringers (2.55/3.42/4.18×). Each partial carries its own gain + a long
  exponential decay (global tail 2–6 s, scaled by the Decay control, velocity, and
  bell size — big low bells ring longest); higher partials die sooner (struck
  metal). A fast metallic attack + a brief band-filtered noise burst gives the
  clapper bite. Reads as a bell/gong, not a sine or a pluck.
- **Musical guardrails:** every fundamental is in-scale by construction; master
  runs bus → soft-clip waveshaper → brick-wall limiter (threshold −6 dB, ratio 20)
  → master, so the long overlapping tails never clip; polyphony cap (14) with
  graceful voice-stealing (steal the oldest — its tail has decayed most); gentle
  convolution reverb (3.4 s impulse) for cathedral bloom; optional low **drone**
  (root + octave + fifth, an octave below the tenor, slow swell).
- **Lens-native:** the bell synth + change-ringing scheduler are factored to accept
  an injected `AudioContext`, so the exact same code runs under an
  `OfflineAudioContext`. `window.__renderOffline(seconds, seed)` renders the peal
  offline → 16-bit stereo WAV `Blob` (and triggers a download). Permanent "let me
  hear" hook; verified via the Audio Lens.
- **Visuals:** dark warm canvas — a ring of bells (big bronze tenor → small pale-gold
  treble, pitch→colour) that glow + bloom on strike and fade with the decay,
  expanding concentric resonance rings, faint sympathetic shimmer on octave-related
  bells, sparks flying off each strike, the current row traced as faint chords
  between consecutive bells, and a centre glow pulsing with total ringing energy.
  ~60fps, animates on `requestAnimationFrame` independently of audio (alive on load
  via a seeded visual-only ringer); audible sound gated behind an explicit click.
  Controls: Seed/dice, Scale, Root, Tempo, Density, Decay/Resonance, Motion, Reverb,
  Drone, Volume, Pause, Mute (keys: space/m/d/r/h).
- **Verified via the Audio Lens (offline, silent):** see the build report for
  peak dBFS / %clip / strike pitches vs scale / evolution evidence.
- Accent `#c79a4b` (bronze/brass). Thumbnail `assets/carillon.png` (16:10).

### Rack
- No grid change — the responsive `auto-fit` grid (added with Loom) flows the now-six
  instruments cleanly as 2 rows of 3.

## 2026-06-11 — Loom (new instrument)

Added `loom.html`, the rack's fifth instrument and its harmony / chord-progression
voice (Whitney = orbital chimes, Drift = static ambient chord, Euclid = Euclidean
rhythm, Rain = tuned-pool plinks, **Loom = an evolving, arpeggiated chord
progression** — the melodic/chordal *motion* the rack was missing).

- **Concept — a generative loom.** The **warp** is a field of vertical strings,
  each tuned to a degree of a selectable consonant scale across 1–3 octaves
  (selectable root) — every note in-scale by construction. The **weft** is time:
  a left→right **shuttle/playhead** sweeps and plucks strings per the current
  arpeggio figure. A seeded engine walks an evolving **diatonic chord
  progression** (weighted functional motion — I→vi→IV→V-style, voice-led) and,
  per chord, weaves an arpeggio (up / down / up-down / in-out / out-in / root-top
  / broken). Chord length (Motion), notes-per-chord (Density) and the figure all
  drift, so the cloth never repeats and never leaves the key.
- **Voice — Karplus–Strong plucked string** (the signature timbre). Rendered with
  the authentic KS algorithm *into an AudioBuffer in JS* (delay line of one period,
  noise excitation, 2-tap moving-average + loss), then played via a BufferSource.
  This is numerically stable and deterministic — a WebAudio `DelayNode` feedback
  loop is unstable (round-trip gain ≥ 1 → runaway) and, when un-terminated, makes
  `OfflineAudioContext` stop processing later voices (→ silence after a few
  seconds). Buffer-rendering fixes both.
- **Musical guardrails:** in-scale always; master through a soft-clip waveshaper +
  brick-wall limiter (never clips); polyphony cap (16) with graceful voice-stealing
  (duck the oldest); arpeggio onsets on a tempo grid; optional soft **pad** drone
  that follows the current chord root (voice-led); gentle convolution reverb.
- **Lens-native:** the synth voice + progression/weave engine are factored to accept
  an injected `AudioContext`, so the exact same code runs under an
  `OfflineAudioContext`. `window.__renderOffline(seconds, seed)` renders the
  generative weave offline → 16-bit stereo WAV `Blob` (and triggers a download).
  Permanent "let me hear" hook; verified via the Audio Lens.
- **Visuals:** dark canvas — a field of glowing warp strings (pitch→colour,
  amber→rose across the register), a luminous sweeping shuttle, plucked strings
  ringing (a sine-bowed vibration + travelling pluck packet + a bloom), and an
  accreting woven cloth (weft knots laid behind the live weave, fading slowly).
  ~60fps, animates on `requestAnimationFrame` independently of audio (alive on
  load via a seeded visual-only weaver); audible sound gated behind an explicit
  click. Controls: Seed/dice, Scale, Root, Tempo, Density, Motion, Octave range,
  Reverb, Pad, Volume, Pause, Mute (keys: space/m/p/r/h).
- **Verified via the Audio Lens (offline, silent):** seed 1618 / C major →
  peak −7.5 dBFS, 0.000% clipped, tonic detected C3; seed 42 / C major →
  peak −7.0 dBFS, 0.000% clipped, tonic detected F3 (the IV that opens that
  seed). Windowed pitch analysis: 92–100% of detected pitches in-scale, with the
  dominant pitch-set clearly *moving* between chords across each clip (iii→I→vi
  vs IV→vi→V→I for the two seeds) — an evolving progression, not a static drone.
- Accent `#e8b765`. Thumbnail `assets/loom.png` (1280×800, 16:10).

### Rack
- Desktop grid changed from `repeat(2,1fr)` → `repeat(auto-fit,minmax(240px,1fr))`
  so the now-five instruments (and any future count) flow cleanly with no orphan.

## 2026-06-10 — Rain (new instrument)

Added `rain.html`, the rack's fourth instrument and its melody/harmony-forward,
struck/plucked voice (Whitney = orbital chimes, Drift = ambient chord, Euclid =
Euclidean rhythm, Rain = tuned-pool rain).

- **Concept:** a seeded generative rain falls on a tuned pool. The horizontal
  extent maps x → nearest pitch in a selectable consonant scale (~2 octaves,
  selectable root), so every drop is in-scale by construction. Each drop falls
  (visual streak), strikes the pool (impact flash + expanding ripple), and
  triggers a warm struck/plucked voice. Slowly-drifting intensity + wind
  (seeded smooth-noise) keep the texture evolving and never-repeating.
- **Voices:** Glass / Marimba / Pluck / Bell — additive partial recipes with
  fast attack + exponential decay and a soft water-impact tick.
- **Musical guardrails:** all pitches snap to the scale; master runs through a
  soft-clip waveshaper + brick-wall limiter (never clips); polyphony cap (18)
  with graceful voice-stealing (steal oldest); optional onset quantize
  (free ↔ 8th-note grid) with a tempo control; gentle convolution reverb;
  optional soft pad/drone on root + octave + fifth.
- **Lens-native:** the synth voice + generative scheduler are factored to accept
  an injected `AudioContext`, so the exact same code runs under an
  `OfflineAudioContext`. `window.__renderOffline(seconds, seed)` renders the
  generative pattern offline → 16-bit stereo WAV `Blob` (and triggers a
  download). Permanent "let me hear" hook; verified via the Audio Lens.
- **Visuals:** dark canvas — falling rain streaks, a reflective water-line with
  faint tuned "strings", glowing impact flashes + expanding ripples (with
  reflections), pitch-coloured (low→high across the blue/violet spectrum).
  Animates on `requestAnimationFrame` independently of audio (alive on load via
  a seeded visual-only scheduler); audible sound gated behind an explicit click.
- Accent `#6fb6ff`. Thumbnail `assets/rain.png` (16:10).

### Rack
- Desktop grid changed from `repeat(3,1fr)` → `repeat(2,1fr)` for a clean 2×2
  now that there are four instruments.
