# Rain — a new Sound Garden instrument (SPEC)

*Seeded rain falls on a tuned pool — each drop plinks a note in a consonant scale, rings, and
ripples away; intensity and wind drift slowly so it is ever-changing.* The melody/harmony-forward,
struck/plucked-timbre instrument the rack is missing (Whitney = orbital polyrhythm chimes, Drift =
ambient drifting chord, Euclid = Euclidean rhythm). Self-contained `sound-garden/rain.html`, vanilla
JS + Canvas + Web Audio, **zero deps, no network/CDN**, relative paths, `"use strict"`. Matches the
rack's aesthetic; back-link `← the workshop` → `../index.html` (and/or `← sound garden`).

## The instrument
- **Tuned pool / array:** the horizontal extent maps **x → pitch** across a chosen **scale** (e.g.
  major-pentatonic / minor-pentatonic / Dorian / Lydian — selectable) over ~2 octaves, rooted at a
  selectable note. A drop landing at x plays the nearest scale pitch. (So every note is in-scale —
  consonant by construction.)
- **Drops:** a seeded generative rain — Poisson arrivals with a slowly-varying **intensity** and a
  **wind** bias on x (both drift over time via smooth noise) so the texture keeps evolving and never
  repeats. Each drop: falls (visual streak), strikes the pool (impact flash + expanding **ripple**),
  and triggers a **voice**.
- **Voice:** a warm struck/plucked tone — glassy/marimba/plucked-string character (e.g. a couple of
  detuned partials + fast attack + exponential decay, or Karplus–Strong pluck). Velocity from drop
  size/speed. **Hard limiter / master gain** so dense rain never clips. **Voice-stealing / polyphony
  cap** so it stays clean under heavy rain. Gentle **reverb** (convolution with a short synthesized
  impulse, or a feedback-delay network) for space. Optional soft **pad/drone** underneath on the
  root/fifth for warmth (toggle).
- **Musical guardrails (important — verify with the Lens):** all pitches snap to the scale; master
  through a limiter (no clipping); polyphony capped with graceful voice-stealing; optional light
  **onset quantize** to a soft grid (a "tempo"/"quantize" control 0 = free rain → 1 = on-grid) so it
  can be rhythmic rather than mushy. Keep it *musical*, never cluttered.

## Visual (dark, beautiful, screenshot-verifiable; ~60fps)
Falling rain streaks; a reflective "pool"/water-line (or a row of faint tuned bars) across the
canvas; glowing **impact flashes + concentric ripples** that fade; subtle pitch colour (low→high
across the spectrum). The whole scene animates on `requestAnimationFrame` **independently of audio**
so it looks alive immediately. Re-roll visibly changes the rain character.

## Controls (a small panel, rack-consistent)
Seed + dice/re-roll · Scale (pentatonic/Dorian/Lydian/…) · Root · Density (rain intensity) ·
Wind · Quantize (free↔grid) + Tempo · Voice/timbre · Reverb · Pad on/off · master shown clipping-safe.

## CRITICAL — audio is SILENT during all testing (Brandon may be asleep)
Per browser autoplay rules, **audible** sound only starts on an explicit user click — the builder
must **NOT** click start / must never let sound play through the speakers. Verify visuals with the
rAF simulation running (no audio needed). Verify SOUND only via the **offline render** path below
(`OfflineAudioContext` makes no sound). The page shows visuals on load; "▶ click to begin" gates audio.

## Lens-native (so the sound is verifiable by sight)
Factor the synth/scheduler to accept an **injected AudioContext** so it runs under
`OfflineAudioContext`. Expose `window.__renderOffline(seconds, seed)` → renders that many seconds of
the generative pattern offline and returns a WAV `Blob` (and/or triggers a download). This is the
permanent "let me hear" hook and the verification path.

## Verification (self-verify; UNIQUE agent-browser session `rain-build` — never the default tab)
1. **Visual:** open `file://`; screenshot the live rain (streaks + ripples + impacts), re-roll →
   screenshot (visibly different); confirm ~60fps and **zero console errors**. Do **not** start audio.
2. **Sonic (via the Audio Lens, silent):** call `window.__renderOffline(~12, seed)` to get a WAV;
   open `../../tools/audio-lens/index.html`, drop the WAV in, Render & Analyze; screenshot the
   spectrogram + feature readout. **Confirm: no clipping (peak < 0 dBFS, 0% clipped), detected
   pitches land on the chosen scale, content evolves over time (not static).** If the Lens shows
   clipping or out-of-scale content, **fix the synth/levels/snapping and re-render until clean.**
3. Report the Lens findings (peak dBFS, %clip, detected notes vs scale) + all screenshots.

## Deliverables + rack integration
1. `sound-garden/rain.html`.
2. `sound-garden/assets/rain.png` — a 16:10 thumbnail (a moody, beautiful frame: rain + glowing
   ripples), reasonable size.
3. Add a manifest entry to `sound-garden/instruments.js` (`window.INSTRUMENTS`): `file:"rain.html"`,
   `name:"Rain"`, `blurb:"seeded rain falls on a tuned pool — each drop plinks a note in scale, rings, and ripples away"`,
   `accent:` a rain-blue (e.g. `#6fb6ff`).
4. **Rack grid:** the rack is now **4 instruments** — change `sound-garden/index.html`'s desktop grid
   from `repeat(3,1fr)` to **`repeat(2,1fr)`** so it reads as a clean **2×2** (verify the rack page
   screenshots cleanly with 4 cards).
5. `sound-garden/CHANGELOG.md` — append a build entry (create if absent).

## House rules
- One self-contained HTML file (+ its thumb + the manifest/rack edits above). No network/CDN/web-fonts.
- Do NOT edit the front-door `index.html` or other projects. Do NOT git commit (the parent reviews + commits).
