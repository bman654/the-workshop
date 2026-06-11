# Lattice — SPEC (Sound Garden, 7th instrument)

*A **visual-first** generative step-sequencer — a Tenori-on-like grid of light. A playhead sweeps a
pitch × time lattice; lit cells chime as it passes, in scale, forever consonant. Seeded and
self-evolving: the pattern blooms, mutates, and breathes on its own. The Sound Garden instrument whose
correctness you can **SEE** (so it's screenshot-verifiable), not just hear.*

One self-contained file: `sound-garden/lattice.html` — vanilla HTML/CSS/JS, Web Audio (synth only) +
canvas. **Zero deps, no network / CDN / web-fonts**, relative paths only. Accent **#5fe6c4** (aqua).

This is the idea-bench "**a step sequencer / Tenori-on you can SEE**" — built so its behaviour is
verifiable by sight (playhead position + lit cells + note-fire flashes), with audio quality confirmed
structurally + via `tools/audio-lens/`.

---

## The grid (the whole idea)
- A **pitch × time lattice**: columns = time steps (default **16**), rows = pitches (default **12–16**),
  mapped **bottom→top = low→high** through a **scale** (default major-pentatonic — pick a scale that is
  *always consonant* so any lit pattern sounds musical; offer a few: pentatonic / Dorian / Lydian /
  whole-tone). Lit cells = notes that fire when the playhead column reaches them.
- A **playhead**: a glowing column sweeps left→right on a musical clock, wrapping at the end (a loop).
  When it crosses a lit cell, that cell **fires**: its note plays AND it flashes / ripples outward.
- **Multiple voices (2–3 layers)** in distinct hues (e.g. aqua lead + a dimmer low-octave pad + a
  sparkle top), so the texture is rich and you can read the layers. Each voice = its own soft synth
  patch (e.g. triangle/sine pluck with a short bell-ish envelope; a soft pad for the low voice).

## Generative & self-evolving (it's a Sound Garden instrument — autonomous, not just a toy)
- The starting pattern is a **pure function of the seed** (xmur3 + mulberry32; separate streams),
  biased toward **musical** results (sparse, with pleasing intervals & a sense of phrase — NOT random
  static). Reproducible: same seed ⇒ same opening pattern.
- It **evolves**: every few bars the pattern gently **mutates** (a cell or two fade in / out, a voice
  shifts a motif, density drifts) so it's *never the same twice* and rewards leaving it running — like
  Drift / Loom / Rain. Keep evolution smooth and tasteful (cross-fade cell on/off; no jarring jumps).
- Optional **interactive** layer: clicking/dragging a cell toggles it (let the visitor play too), but
  the default experience is **autonomous self-play** (press ▶ to begin — browsers need a gesture).

## Sound (consonant, clean, never clipping)
- All notes drawn from the chosen scale ⇒ always in-key. Keep a calm tempo (default ~90–110 BPM feel;
  the step clock can be 8th/16th notes). Gentle dynamics.
- **Master chain:** sum voices → a soft master gain (well below 0 dBFS) → optional gentle limiter/soft
  saturator → destination. **No clipping even at full pattern density / max overlap.** A touch of
  reverb/delay is welcome for shimmer (keep feedback bounded; no runaway). Mind voice-count: cap
  simultaneous voices / reuse nodes; **no node leaks, no unbounded scheduling**.

## Visuals (the verifiable surface — make it gorgeous)
- A dark Sound-Garden field; the lattice as a grid of soft dots/cells. **Off** cells dim; **on** cells
  glow in their voice's hue; the **playhead column** is a bright sweeping band. On fire: the cell
  **blooms** (a quick scale-up + ripple) and maybe sends a soft pulse. Subtle, hypnotic, ~60fps.
- Show enough that a single screenshot proves it's working: a lit musical pattern + the playhead mid-
  sweep + a cell or two flashing. devicePixelRatio-aware; resizes crisply; **stop/idle cleanly** when
  paused (no audio scheduled, rAF can idle or draw static).

## Controls (match the Sound Garden chrome — see `rain.html` / `loom.html` / `carillon.html`)
- **▶ / ⏸**, a **⚄ seed + dice** (reseed → new pattern), **Tempo**, **Density** (how full the lattice
  blooms), **Scale** selector, **Evolve** rate (how fast it mutates; 0 = frozen), **Mute**, and a
  **Clear / Regenerate** action. Small, glassy controls like the other instruments; collapse/hide ok.
- The standard **`← sound garden`** back-link (copy `carillon.html`'s `a.back`, top-right), tinted to
  the aqua accent. (The rack `index.html` adds the `↗`/card automatically from `instruments.js`.)

## Performance / quality bar
- Steady **~60fps**; **zero console errors/warnings**; no audio glitches; **no clipping**; no memory
  growth over minutes (cap/reuse audio nodes; bounded reverb/delay; clean rAF + scheduler).

## Verification — VISUAL-FIRST (courteous on a workday: keep live audio MUTED/brief)
This instrument is built to be checked by SIGHT — lean on that; minimise loud playback (it plays on
Brandon's speakers). In a **uniquely-named agent-browser session** (never the default tab):
1. **Visual proof it works:** press ▶ (muted or volume near-zero); screenshot showing the **playhead
   sweeping**, a **musical lit pattern**, and **cells flashing** as the head crosses them. Capture a
   few frames to show the playhead advancing and cells firing in time with its position.
2. **Generative/seed:** same seed ⇒ same opening pattern (screenshot two loads). Different seeds ⇒
   different musical patterns. Leave it running → confirm the pattern **evolves** (mutates) over time.
3. **In-scale (structural):** confirm in code that every scheduled frequency is a member of the chosen
   scale (log/inspect the note table) — so it's provably consonant.
4. **No-clip / no-leak (structural + lens if feasible):** confirm master gain is well below unity and a
   limiter/soft-clip guards the bus; confirm audio-node count stays bounded over time (no leak). **If
   practical, run an offline render through `tools/audio-lens/`** (read its SPEC) to confirm peak <0 dBFS
   / 0% clip / in-scale / evolving — the silent, courteous path. If the lens integration is heavy, a
   short low-volume live listen + the structural checks suffice; say which you did.
5. Console clean throughout; ~60fps; pause stops scheduling. Report: visual frames, seed repro,
   evolution note, the in-scale check, the no-clip/no-leak check (+ lens result if run), fps/console,
   screenshot paths, line count.

## Deliverables
1. `sound-garden/lattice.html` — the instrument.
2. Append to `sound-garden/instruments.js`:
   `{ file:"lattice.html", name:"Lattice", blurb:"a glowing pitch×time lattice — a playhead sweeps, lit cells chime in scale, the seeded pattern blooms and evolves", accent:"#5fe6c4" }`
   (match existing formatting exactly).
3. `sound-garden/assets/lattice.png` — a 1280-wide (≈16:9-ish, like the others) screenshot of a
   gorgeous lit lattice mid-sweep (playhead + glowing pattern + a flash), for the rack card.
4. Update `sound-garden/README.md` (now **7** instruments) + `sound-garden/CHANGELOG.md` (build log +
   the verification results, incl. the in-scale + no-clip checks).

## House rules
- One self-contained file; **no network/CDN/web-fonts** (system mono/sans stacks). Web Audio synth only.
- Feel like a **Sound Garden** instrument (glassy controls, `← sound garden` back-link, the dark
  glowing aesthetic, autonomous generative behaviour). Distinct from **Euclid** (Euclid = circular
  Euclidean *rhythm*; Lattice = a melodic/harmonic **pitch×time** Tenori-on grid).
- **Do NOT edit other projects, the front-door `index.html`, or the top-level README/NOTES** — the
  front-door count bump + top-level docs are handled by the lead agent. You MAY edit `instruments.js`,
  `README.md`, `CHANGELOG.md` inside `sound-garden/` and add your `assets/lattice.png`.
