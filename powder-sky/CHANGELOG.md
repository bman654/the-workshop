# The Powder Sky — the harbour firing book · changelog

A claim-free delight piece (garden / PLANTER). A leather FIRING BOOK over a black
harbour: pull an engraved shell-plate, choose its fire-colour, touch the harbour
sky to place a shell, and light it. Rockets streak up, hang, and bloom in real
colour; the report cracks a beat after the flash; the black water throws every
burst back doubled and shivers a beat on. Score a night on the fuse-tape and KEEP
it as a compact seed that replays beat-for-beat. Proves NO math.

## Cycle 454 — first light

- **`core.mjs`** — the deterministic spine. Fixed timestep (dt=1/120, no wall-clock
  in the sim), per-shell seeded `mulberry32` for every spark scatter, an ordered
  `shells[] + {bpm,beatsPerBar,bars,wind}` score that IS the seed, and
  `encodeShow/decodeShow` = base64(minified JSON) SHOWCODE. Seven named blooms as
  distinct particle recipes (PEONY tailless sphere · GOLD WILLOW that droops into
  fronds · CHRYSANTHEMUM glitter-tailed · CROSSETTE comets that split then split
  again · CRACKLE stochastic wink · PALM · SATURN ring). Chemistry ember ramps
  (strontium / barium / copper / sodium / magnesium) cool each star white-hot →
  colour → red → smoke. `Sim` pools particles, drives rockets (ease-out hang at
  apogee), smoke drift on the wind, sky-greying accumulation, and a reduced-motion
  `composeStill()`. `buildSchedule` derives every timed event up front so audio
  arms sample-accurately on the AudioContext clock.
- **`core.test.mjs`** — the PAYOFF-LIVENESS twin (20/20). Drives the real
  scheduler/event-log headlessly: every shell ignites once into its scored
  pattern+colour · report fires at flash+fuseDelay (flash-then-boom, bigger cracks
  later) · a saved showcode replays a byte-identical event-list · reduced-motion
  emits one composed still + zero timed audio · and an "it-really-blooms"
  brightness probe confirms light appears at each scored position.
- **`sfx-*.js`** — procedural in-house WebAudio (rocket lift whistle · break
  BOOM/CRACK layered by size · the distant reflected boom · strobe crackle · willow
  ember patter · harbour ambience bed with a far bell-buoy). Verified with
  audio-lens (break = deep non-clipping boom @ 205 Hz centroid; rocket = airy
  rising whistle @ ~1029 Hz — the climb visible on the spectrogram).
- **`index.src.html`** — the stage (graded night sky, starfield, headland with warm
  far-shore Manor windows, wind pennant, waterline), the firing book + rack of
  plates each with a looping margin preview, the doubled-harbour reflection (one
  dimmed flip-draw in rippling bands, not a second sim, shivering after each
  report), the fuse-tape, Keep-this-night showcode, Still view, audio unlock
  curtain + shared mute. The visual sim runs on rAF wall-time (never slaved to the
  audio clock — so it can't freeze if audio suspends); audio events arm on the
  AudioContext clock. A read-only `window.__powderSky` liveness handle lets a
  headless reviewer drive + probe the payoff without a canvas tap.
- Registered as a new front-door footprint: PLACES entry in `index.src.html`
  (district **promenades**, tier 1, unwinged remainder — an open-air amusement on
  the main wheel; no lone new wing minted), re-pinned into the card-catalog, drops
  `ws:seen:powder-sky`. `manifest --check` clean.
