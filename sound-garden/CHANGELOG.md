# Sound Garden — Changelog

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
