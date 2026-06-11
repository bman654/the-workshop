# Sound Garden — Changelog

## 2026-06-11 — Lattice (new instrument)

Added `lattice.html`, the rack's **seventh** instrument and its sequenced-melody voice
(Whitney = orbital chimes, Drift = ambient chord, Euclid = Euclidean rhythm, Rain =
tuned-pool plinks, Loom = plucked arpeggios, Carillon = bells, **Lattice = a Tenori-on-like
pitch×time step-sequencer you can *see*** — the one whose correctness is screenshot-provable).

- **Concept — a glowing pitch × time lattice.** A 16-column × 14-row grid; columns are time
  steps, rows are pitches (bottom→top = low→high). A bright **playhead column** sweeps
  left→right on a musical clock (8th-note feel, loops); when it crosses a lit cell that cell
  **fires** — its note plays and it blooms (scale-up + expanding ripple ring + flash). The
  opening pattern is a **pure function of the seed** (xmur3 + mulberry32, separate streams for
  pattern / evolution / visuals), biased toward music — a low-pad anchor on strong beats, a
  small-interval lead random-walk through mid rows, call/response echoing the first half into
  a transposed second half, and rare high sparkle on offbeats — *not* random static. It
  **evolves**: every few bars a couple of cells cross-fade on/off (Evolve rate; 0 = frozen),
  so it never repeats. Click/drag toggles cells to play along; default is autonomous self-play.
- **Voices — three soft synth layers in distinct aqua hues.** Low **pad** (detuned triangles +
  sub-sine, slow attack, long soft tail; bottom rows), mid **lead** (triangle + sine octave +
  fifth-ish partial, bell-ish pluck; mid rows), high **sparkle** (sine + 2× + 4×, fast bright
  pluck, short tail; top rows). Pitch register picks the voice, so the texture is layered and
  readable.
- **In-scale by construction (provably consonant).** Each row *is* a scale degree ascending
  from the root through the chosen scale (pentatonic maj/min, Dorian, Lydian, major,
  Mixolydian, whole-tone, Hirajoshi — all chosen so any lit subset is consonant). There is no
  code path that schedules an out-of-scale frequency. Verified: an offline render of seed 2718
  scheduled 79 notes, **0 out of scale**, and the pitch classes actually sounded
  (`{0,2,4,7,9}`) exactly equal the C-pentatonic-major ladder.
- **Never clips.** Master chain: bus → low-pass (8.2 kHz) → soft-clip tanh waveshaper (2×
  oversample) → brick-wall limiter (threshold −8 dB, ratio 20) → master gain (well below
  unity) → destination, with a bounded feedback delay (fb 0.34 < 1) + synthesized convolution
  reverb for shimmer. Polyphony cap (24) with oldest-voice stealing; oscillators self-disconnect
  on `ended` (no node leak — bounded state confirmed across 200 regen/mutate ops). Measured
  peak ≈ **−37 dBFS / 0 % clipped** at the calm default; even at max tempo/density/reverb/volume
  the worst case was **−11.9 dBFS / 0 % clipped**.
- **Lens-native (silent verification).** The 3-voice synth + the column sequencer run unchanged
  under an `OfflineAudioContext`; `window.__renderOffline(seconds, seed)` renders the evolving
  pattern → 16-bit stereo WAV `Blob` (and triggers a download). The rendered WAV, dropped through
  `tools/audio-lens/` (self-tests 12/12 green), independently read back peak **−38.8 dBFS,
  clipping = false, 0 %**, centroid 320 Hz — the courteous, no-speakers path.
- **Visuals (the verifiable surface):** a dark aqua field; off cells are faint dots, on cells
  glow in their voice's hue and brighten near the playhead, the playhead is a soft sweeping band
  with a bright center line, and fired cells bloom + send expanding ripple rings. ~60fps;
  devicePixelRatio-aware; alive on load and while paused (the playhead sweeps on a visual clock
  when the audio context isn't running, so the lattice is screenshot-verifiable regardless of
  audio state); audible sound gated behind an explicit ▶ begin. Controls: Seed/dice, Scale,
  Root, Tempo, Density, Evolve, Reverb, Volume, Pause, Mute, Regenerate, Clear
  (keys: space/m/r/g/c/h).
- **Verified (visual-first, courteous — live audio kept muted + volume 0 throughout):**
  - *Sweep + fire:* in `agent-browser` (unique session `lattice-verify`, file://) the visual
    playhead advanced smoothly (headPos 2.6 → 6.6 → 10.7 → 14.7 → wrap) and cells bloomed with
    ripple rings exactly under the playhead column — frames at col 5 vs col 13 show different
    cells firing in time with its position.
  - *Seed:* seed 2718 loaded twice ⇒ identical pattern; 2718 vs 4242 vs 99 ⇒ different patterns.
  - *Evolve:* Evolve 0.7 mutated the pattern over steps (signature changed, density drifted);
    Evolve 0 froze it (forced mutations were no-ops).
  - *Audio (silent path):* offline render + Audio Lens as above — in-scale, no clip, no leak.
  - *Health:* steady ~60 fps; **zero console errors/warnings**; pause stops audio scheduling
    cleanly (`pumpAudio` early-returns when not playing).
- Accent `#5fe6c4` (aqua). Thumbnail `assets/lattice.png` (1280×720) — a gorgeous lit pattern
  mid-sweep with the playhead band and a blooming cell.

### Rack
- No grid change — the responsive `auto-fit` grid flows the now-seven instruments cleanly
  (3 + 3 + 1). README brought current (the table had drifted to 3 rows; now lists all 7).

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
