# Carillon — a 6th Sound Garden instrument (SPEC)

*A seeded carillon: tuned bells — inharmonic, resonant — rung in slowly-evolving change-ringing
permutations that overlap into shifting harmony.* The **struck-inharmonic-metal** timbre the rack
lacks (Whitney = chimes/polyrhythm, Drift = pads, Euclid = rhythm, Rain = plucked glass, Loom =
plucked string → **Carillon = bells/gongs**). Self-contained `sound-garden/carillon.html`, vanilla
JS + Canvas + Web Audio, **zero deps, no network/CDN/web-fonts**, relative paths, `"use strict"`.
Matches the rack aesthetic; back-link `← sound garden`.

## The instrument
- **A ring/set of tuned bells** mapped to a selectable **scale + root** (~1–2 octaves). Each bell's
  fundamental (its strike/prime tone) is in-scale.
- **Bell timbre (the signature):** bells are **inharmonic** — synthesize each strike from a few
  partials at bell-like ratios (e.g. hum ≈0.5×, prime 1×, **tierce ≈1.2× (the minor-third overtone
  that gives bells their bittersweet ring)**, quint ≈1.5×, nominal ≈2×), each its own gain +
  **long exponential decay** (2–6 s), with a fast metallic attack. FM or additive — your call — but
  it must read as a *bell/gong*, not a sine or a pluck. A subtle strike transient/noise click helps.
- **Generative ringing:** a seeded engine rings the bells in **slowly-evolving permutations** —
  inspired by English **change-ringing** (a "row" of bells rung in order, the order mutating by
  small adjacent swaps each round — plain-hunt / bob-style), but kept *musical*: long decays let
  successive strikes **overlap into shifting harmony**, and an occasional held/struck chord. Tempo
  drifts gently; the permutation evolves so it never repeats. Optionally a soft low **drone/tail**
  for resonance (toggle).
- **Guardrails (verify with the Lens):** strike fundamentals snap to the scale; master through a
  **limiter** (long bell tails + overlaps must NOT clip — watch cumulative level); **polyphony cap +
  voice-stealing** (bells decay long, so many can overlap — cap it). Gentle reverb for cathedral
  bloom. *Resonant and contemplative, never muddy or clipping.*

## Visual (dark, beautiful, screenshot-verifiable; ~60fps, rAF independent of audio)
A ring (or arc/tower) of **bells/discs/bars** that **glow + ripple/shimmer on strike** and fade with
the bell's decay; concentric resonance rings; faint sympathetic shimmer on related bells; pitch→colour
(low/large→deep, high/small→bright). The current "row"/order subtly visualised (e.g. a moving
highlight tracing the permutation). Re-roll visibly changes the tuning/pattern.

## Controls (small panel, rack-consistent)
Seed + dice/re-roll · Scale · Root · Tempo · Density (strikes/round) · Decay/Resonance (bell tail
length) · Method/Motion (how fast the permutation evolves) · Reverb · Drone on/off · Volume · Pause · Mute.

## CRITICAL — SILENT during all testing (a person may be asleep)
Audible sound only on explicit user click (autoplay rules) — the builder must **NOT** click start /
never let sound through the speakers. Verify visuals with the rAF sim (no audio); verify SOUND only
via the **offline render** (`OfflineAudioContext` = silent) → the Audio Lens.

## Lens-native (so the sound is verifiable by sight) — mirror `sound-garden/rain.html`
Factor synth/scheduler against an **injected AudioContext**; expose
`window.__renderOffline(seconds, seed)` → renders that many seconds offline → WAV `Blob` (+ download).

## Verification (self-verify; UNIQUE agent-browser session `carillon-build` — never the default tab)
1. **Visual:** open `file://`; screenshot the live ring (bells glowing/rippling on strike); re-roll →
   screenshot (visibly different); ~60fps; **zero console errors**. Do NOT start audio.
2. **Sonic (via the Lens, silent):** `window.__renderOffline(~16, seed)` → WAV (save `/tmp/carillon-build/`);
   open `../../tools/audio-lens/index.html`, drop it in, Render & Analyze; screenshot spectrogram +
   features. **Confirm: peak < 0 dBFS and 0% clipped (despite long overlapping tails); the strike
   fundamentals land on the chosen scale; long bell decays + an EVOLVING pattern over time (shifting
   strikes, not one static tone).** NB: bells are intentionally **inharmonic**, so expect rich partial
   stacks (not clean harmonics) and the Lens's harmonic pitch read may flag overtones — judge by the
   strongest/strike tones landing in-scale + no clipping + evolution. If it clips, reduce per-voice
   level / tighten the limiter / lower polyphony and re-render until clean.
3. Report Lens findings (peak dBFS, %clip, strike pitches vs scale, evidence of evolution) + screenshots.

## Deliverables + rack integration
1. `sound-garden/carillon.html`.
2. `sound-garden/assets/carillon.png` — 16:10 thumbnail (the glowing bell-ring mid-peal).
3. Manifest entry in `sound-garden/instruments.js`: `file:"carillon.html"`, `name:"Carillon"`,
   `blurb:"tuned bells ring slow, overlapping changes — inharmonic, resonant, ever-shifting"`,
   `accent:` a bronze/brass (e.g. `#c79a4b`).
4. The rack grid is already responsive `auto-fit` — **no grid change needed** (6 instruments flow as
   2 rows of 3). Just verify the rack screenshots cleanly with 6 cards.
5. `sound-garden/CHANGELOG.md` — append a build entry.

## House rules
- One self-contained HTML file (+ thumb + manifest/CHANGELOG edits). No network/CDN/web-fonts.
- Do NOT edit the front-door `index.html` or other projects. Do NOT git commit (parent reviews + commits).
