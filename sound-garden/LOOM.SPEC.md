# Loom — a 5th Sound Garden instrument (SPEC)

*A generative loom that weaves evolving chord progressions into shimmering arpeggios on plucked
strings.* The **harmony/progression** instrument the rack is missing — Whitney = orbital polyrhythm,
Drift = static ambient chord, Euclid = rhythm, Rain = percussive in-scale plinks; **Loom** is melodic
+ chordal *motion* (a chord progression, arpeggiated, ever-evolving). Self-contained
`sound-garden/loom.html`, vanilla JS + Canvas + Web Audio, **zero deps, no network/CDN/web-fonts**,
relative paths, `"use strict"`. Matches the rack aesthetic; back-link `← sound garden` / `← the workshop`.

## The instrument
- **Warp = strings, weft = time.** A set of vertical **strings** (the warp), each tuned to a scale
  degree across ~2 octaves in a selectable **scale + root** (so everything is consonant). A
  left→right **shuttle/playhead** (the weft) sweeps, plucking strings according to the current
  pattern — the woven "cloth" is the score you see being made.
- **Generative harmony:** a seeded engine walks an evolving **chord progression** (diatonic — e.g.
  I–vi–IV–V style motion, or modal), and for each chord weaves an **arpeggio/figuration** across the
  strings (up/down/inside-out patterns, with gentle variation). The progression and figuration drift
  slowly over time so it never repeats. All notes are in-scale by construction.
- **Voice:** a **Karplus–Strong plucked string** (or a warm plucked/harp tone) — the signature
  timbre, distinct from Rain's struck plink and Whitney's chime. Velocity/brightness vary. **Hard
  limiter / master gain** (never clips). **Polyphony cap + voice-stealing.** Gentle **reverb** for
  bloom. Optional soft **sub/pad** on the chord root for warmth (toggle).
- **Musical guardrails (verify with the Lens):** in-scale always; master through a limiter (no
  clipping); polyphony capped; arpeggio onsets on a tempo grid (a **Tempo** control); progression
  changes are smooth/voice-led. *Musical*, never cluttered or atonal.

## Visual (dark, beautiful, screenshot-verifiable; ~60fps, animates on rAF independent of audio)
The warp strings glowing, the shuttle sweeping, plucked strings **ringing** (a travelling
vibration/glow down the string + a soft bloom), the woven pattern accreting as faint threads/light
left-to-right then fading — a living tapestry. Pitch→colour (low→high). Re-roll visibly changes the
weave (new progression + figuration).

## Controls (small panel, rack-consistent)
Seed + dice/re-roll · Scale · Root · **Tempo** · **Density** (notes per chord / arp speed) ·
**Motion** (how fast the progression evolves) · **Octave range** · Reverb · Pad on/off · Volume ·
Pause · Mute. Keyboard niceties (space/m/p/r) welcome.

## CRITICAL — SILENT during all testing (a person may be asleep)
Audible sound only starts on an explicit user click (autoplay rules) — the builder must **NOT** click
start / never let sound play through the speakers. Verify visuals with the rAF sim running (no audio).
Verify SOUND only via the **offline render** (`OfflineAudioContext` = silent) → the Audio Lens.

## Lens-native (so the sound is verifiable by sight)
Factor the synth/scheduler to accept an **injected AudioContext** so it runs under
`OfflineAudioContext`. Expose `window.__renderOffline(seconds, seed)` → renders that many seconds of
the generative weave offline and returns a WAV `Blob` (and/or triggers a download). The permanent
"let me hear" hook + verification path. (Pattern already used by `sound-garden/rain.html` — mirror it.)

## Verification (self-verify; UNIQUE agent-browser session `loom-build` — never the default tab)
1. **Visual:** open `file://`; screenshot the live weave (strings + shuttle + ringing plucks +
   accreting pattern); re-roll → screenshot (visibly different); confirm ~60fps and **zero console
   errors**. Do **not** start audio.
2. **Sonic (via the Audio Lens, silent):** `window.__renderOffline(~14, seed)` → WAV (save under
   `/tmp/loom-build/`); open `../../tools/audio-lens/index.html`, drop it in, Render & Analyze;
   screenshot the spectrogram + features. **Confirm: no clipping (peak < 0 dBFS, 0% clipped);
   detected pitches land on the chosen scale; clear chordal/arpeggiated structure that EVOLVES over
   time (a changing progression, not one static chord — distinct from Drift).** If the Lens shows
   clipping or out-of-scale content, fix the synth/levels/snapping and re-render until clean.
3. Report the Lens findings (peak dBFS, %clip, detected notes vs scale, evidence of progression
   change) + all screenshots.

## Deliverables + rack integration
1. `sound-garden/loom.html`.
2. `sound-garden/assets/loom.png` — a 16:10 thumbnail (the glowing woven tapestry mid-weave).
3. Add a manifest entry to `sound-garden/instruments.js`: `file:"loom.html"`, `name:"Loom"`,
   `blurb:"a seeded loom weaves evolving chord progressions into shimmering plucked arpeggios"`,
   `accent:` a warm thread-gold/amber (e.g. `#e8b765`).
4. **Rack grid:** make `sound-garden/index.html`'s desktop grid **responsive** —
   `grid-template-columns:repeat(auto-fit,minmax(240px,1fr))` (like Arcade) — so the now-**5**
   instruments (and any future count) flow cleanly with no orphan. Verify the rack screenshots well.
5. `sound-garden/CHANGELOG.md` — append a build entry.

## House rules
- One self-contained HTML file (+ thumb + manifest/rack edits above). No network/CDN/web-fonts.
- Do NOT edit the front-door `index.html` or other projects. Do NOT git commit (the parent reviews + commits).
