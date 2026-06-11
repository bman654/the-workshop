# Sound Garden — Changelog

## 2026-06-11 — Dwell accumulator wired into all 8 voices (patience unlock)

Added the **dwell accumulator IIFE** from `/UNLOCK.md` (verbatim, only the `id` differs per piece) to
**all 8 Sound Garden instruments**: `whitney.html` (id `whitney`), `drift.html`, `euclid.html`,
`rain.html`, `loom.html`, `carillon.html`, `lattice.html`, `quickening.html`. It is an isolated,
silent `try/catch` IIFE that does not touch the instrument — for the 6 standalone voices it sits just
before the closing `</script>` after the introspection hook; for `lattice` and `quickening` it sits
directly after their existing `ws:seen:` breadcrumb IIFE.

- **What it does.** While the tab is **visible**, every `TICK=5000` ms it adds 5 s to that piece's
  `ws:dwell:<id>` key, then sums **all** `ws:dwell:*` keys across the workshop; once the summed total
  crosses `THRESH=150000` (~2.5 min of lingering, across any combination of voices) it sets the
  one-time flag `ws:flag:patience`. Pauses when the tab is hidden (`document.hidden`).
- **Why it's safe.** Pure additive breadcrumb — wrapped in `try/catch`, degrades silently if storage
  is off, never read by the instrument. Audio is irrelevant: the tick runs on `setInterval` whether or
  not you press *begin*.
- **It drives the Undercroft's 2nd secret, "The Long Quiet"** (see `undercroft/CHANGELOG.md`) — the
  framework's **second trigger type: patience/dwell** (the first, Quickening, was an exploration combo).
- **Verified on the served origin** (`http://127.0.0.1:8765`, never `file://`): loading `drift.html`
  for ~12 s grew `ws:dwell:drift` 0 → 15000; pre-seeding `ws:dwell:lattice=148000` then loading
  `lattice.html` for ~12 s pushed the sum past threshold and set `ws:flag:patience=1`. `whitney.html`
  still loads with a clean console and an intact `__wmb` hook. All 8 IIFE bodies are byte-identical
  but for the `id` string.

## 2026-06-11 — Quickening (the Living Lattice — HIDDEN piece, the Undercroft)

Added `quickening.html`, **Lattice's sibling** and the first inhabitant of **The Undercroft**
(the hidden world — see `/UNLOCK.md`). It is **deliberately NOT in the rack** (`instruments.js`
untouched; the Sound Garden stays at 7 visible) — it is reached only from the Undercroft once
unlocked. Quickening is the audible incarnation of the Strange Garden's Game of Life: where
Lattice ran a seeded, hand-biased pattern, Quickening hands the grid to a **cellular automaton**
and the playhead **sonifies the living board**.

- **Concept — the board IS the CA world AND the sequencer.** A **24-column (time) × 16-row
  (pitch)** toroidal grid. ROWS map to the in-scale pitch ladder exactly as Lattice does (row =
  scale degree ascending from root ⇒ **every fired note is in-scale by construction**). A bright
  **playhead column** sweeps left→right on the musical clock; every **live** cell it crosses
  fires its row's note and blooms (scale-up + expanding ripple + flash).
- **Two clocks, reconciled.** The musical playhead sweeps columns (8th feel). The **CA
  generation clock** steps the board on an **"Evolve every {¼,½,1,2,4} bars"** cadence (default
  1 bar = one full playhead loop) — so you hear a bar, then it pops to the next generation: a
  self-rewriting sequencer. Implemented as a columns-per-generation counter so ¼/½-bar evolve
  *mid-loop* (shimmering) and 1/2/4-bar evolve *at loop boundaries*. **Live and offline step the
  CA on the identical cadence**, so the rendered WAV mirrors the evolving life.
- **Five rule families, each with a distinct sound mapping (kept consonant — colour selects
  octave/voice/timbre, never an arbitrary pitch):**
  - **Conway** B3/S23 — **age → velocity & brightness** (newborn = bright accent pop, elder =
    settled/quieter); voice by pitch register (low pad / mid lead / high sparkle).
  - **HighLife** B36/S23 — same mapping; its replicators keep the board lively.
  - **Immigration** (2-colour) — newborn takes the majority colour of its 3 parents; the two
    species sing as **2 timbres an octave apart**, panned L/R.
  - **QuadLife** (4-colour) — newborn = majority, or the **absent** colour on a 3-way tie (the
    canonical rule); **4 colours → 4 voices / octave offsets / pan positions** (low pad, lead,
    high sparkle, glass).
  - **Brian's Brain** — on/dying/off; **only "on" cells fire** (the moving wavefront); "dying"
    cells are visible but silent (amber ghost). Lots of motion ⇒ evolving rhythm.
- **Seeded, reproducible, never silent.** Initial soup is a pure function of seed × rule ×
  density (xmur3 + mulberry32); CA evolution is deterministic ⇒ the whole piece is reproducible
  by seed until poked. An **extinction guard** gently re-soups if the audible population stays ~0
  for a couple of loops, so it's never permanently silent. Controls: Seed/dice, Rule, Scale,
  Root, Tempo, Seed density, Evolve-every, Reverb, Volume; buttons Play/Pause, Mute, Reseed,
  Clear, **Inject glider**, **Inject soup**; **click/drag toggles cells** (play along, like a
  parent). Keys: space/m/r/g/s/n/c/h (n = step a generation).
- **Correctness — the CA self-test (the verifiable gate).** `window.__quickening.selfTest()`
  runs each canonical pattern on an **isolated 16×16 scratch board** (centred, no wrap
  interference): **glider** translates (+1,+1) after 4 gens, **blinker** is period-2, **block**
  is a still life, and **Brian's Brain** obeys its transition law (on→dying, dying→off, an off
  cell with exactly 2 on-neighbours → on). **All 4 cases PASS.**
- **Never clips / lens-native.** Same master chain as Lattice (bus → low-pass → soft-clip tanh →
  brick-wall limiter → master well below unity → dest; bounded feedback delay + convolution
  reverb; polyphony cap 28, self-disconnecting voices). `window.__renderOffline(seconds, seed)`
  renders the evolving CA under `OfflineAudioContext` → 16-bit stereo WAV + a silent self-check.
  **Offline audit (20 s each, every rule family): `outOfScale === 0`, `clipPct === 0`, `peakDb <
  0`, `notes > 0`:**
  - Conway — peak **−7.86 dBFS**, 0 % clip, 376 notes, 0 out of scale.
  - HighLife — peak **−9.20 dBFS**, 0 % clip, 336 notes, 0 out of scale.
  - Immigration — peak **−8.44 dBFS**, 0 % clip, 355 notes, 0 out of scale.
  - QuadLife — peak **−8.81 dBFS**, 0 % clip, 334 notes, 0 out of scale.
  - Brian's Brain — peak **−11.53 dBFS**, 0 % clip, **227 notes** (fewer — only "on" cells fire,
    confirming the wavefront mapping), 0 out of scale.
- **Hidden-world wiring.** Drops the breadcrumb **`ws:seen:quickening`** on load (verified
  written: a ms timestamp). The **"these go to eleven"** easter egg: when every range slider is
  simultaneously at max, a glowing **"11"** badge reveals and **`ws:flag:eleven`** is set (try/
  catch); it hides when a slider leaves max, and the flag persists once earned (all verified via
  `localStorage`). Back-link **`← the undercroft`** → `../undercroft/index.html`.
- **Visuals.** Live cells glow green-gold (hue by voice/colour, lightness by age); recently-dead
  cells leave **ghost trails**; Brian's-Brain dying cells show as silent amber rings; the
  playhead is a sweeping band with a bright center line; fired cells bloom + ripple; a **board-
  wide generation pulse** marks each CA step. Alive on load (visual sweep before audio unlock).
  HUD: rule · scale/root · seed · gen · pop · col · voices · fps.
- **Verified (visual-first, live audio kept muted — courtesy; offline render is the audio gate),
  unique `agent-browser` session over the served origin `http://127.0.0.1:8765`:** self-test
  4/4 PASS; steady **~60 fps**, **zero console errors/warnings**, playhead sweeping, cells alive
  and evolving (gen advancing, pop ~130), blooms firing under the head; offline audit clean for
  all 5 families (above); **seed reproducibility** — seed 42 stepped 15 gens twice ⇒ identical
  `signature()`, seed 99 differs; the "11" egg + `ws:seen:quickening` breadcrumb verified in
  `localStorage`.
- Accent `#7fe6a0` (luminous living green-gold, distinct from Lattice's aqua). Hero shot
  `assets/quickening-hero.png` — a lively mid-sweep Conway board (playhead band + blooming cells
  + ripples). ~1206 lines, self-contained, relative links only.

### Rack
- **No change** — Quickening is hidden by design; `instruments.js` and the visible 7-instrument
  rack are untouched.

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
