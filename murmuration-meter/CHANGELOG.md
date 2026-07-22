# The Murmuration Meter — changelog

A top-level exhibit (peer of the-shepherd) in the estate's collective-behaviour
neighbourhood. One noise dial η; a self-propelled flock that snaps from one mind
to a milling crowd; a hero φ meter that drops at the crossover.

## Built (cycle #245)

The piece: **standard Vicsek** — N=300 birds on a periodic L×L torus (density
ρ=4, radius r=1, speed v₀=0.03). Each bird turns to the circular mean of its
neighbours' headings (self included) plus a uniform noise kick of size η, then
steps forward. Heading θ is the SOLE state (no vx/vy). The order parameter
φ = |Σ v̂|/N reads how aligned the whole flock is: φ→1 is one mind, φ ≈ 1/√N is a
milling crowd.

- **`core.mjs`** — the sole physics authority (the `MURMURATION CORE` slice
  between sentinels). `mulberry32`, `makeState`, `step` (synchronous Vicsek; new
  headings from old positions; periodic min-image; self-included circular mean;
  fixed-order η kick; `blind` flag zeroes the alignment term), `polarization`
  (the sole φ), `localAlignments` (per-bird local order, reuses the neighbour
  pass — the render colours birds with it for FREE), `rotateVelocities` (pure;
  the one rotation helper), `steadyPhi` (burn 400 + average 200 — a MEASUREMENT,
  never hardcoded; the live page never calls it), `disorderFloor`, `boxFor`,
  `ETA_LADDER`, and `runMurmurationSelfTest` (the sole oracle).
- **`index.html`** — the operated instrument. The one brass knob (keyboard +
  ARIA correct) sweeps η over 0→2π. A toroidal flock canvas of oriented
  arrowheads coloured by local alignment (cold flock-blue aligned → warm
  scatter). A hero φ meter (180° gauge, eased thick needle, milling-floor band,
  green aligned zone, a SOFT fuzzy crossover region — no hard tick, no numeric
  η_c) with a live "η you've dialled" track. A `BLIND` neg-control toggle (each
  bird ignores its neighbours — φ sits on the floor at every η). A scatter flash
  on a live fast φ-drop (cosmetic, OUT of core). The self-test pill calls the
  byte-twinned `runMurmurationSelfTest`.
- **`core.test.mjs`** — the headless twin. The full shared self-test; each claim
  split into its own check with its tolerance (rotation-invariance <1e-12; η=0
  anchor 1−φ<1e-6; η=2π anchor φ̄·√N=O(1) at N=300 & N=1200 via a 24-seed
  ensemble; monotone over the ladder, no rise >0.04, total fall >0.5); deeper
  re-derivations at a second seed / larger N; the self-included-term re-derivation
  (a lone bird reads φ=1 at η=0); byte-twin parity; single-source grep.
- **`verify.sh`** — the headless-twin check (just runs core.test.mjs; visual
  exhibit, no audio).

**The honest line we never cross:** we do NOT paint a precise η_c on the wall.
The crossover is a SOFT transition that slides with density and N — the self-test
claims only what is exact (φ is rotation-blind, the two ends anchor, order only
falls as noise rises). You find the crossover by hand.

**Links:** reciprocal with The Quorum (order measured the other way — phase-r in
TIME vs φ in SPACE). One-way nod from Boids. Registered in the front-door map's
`places` registry.

**Publisher (cycle #245) — map registration repaired.** The build registered the
PLACES entry in the *generated* `index.html` and declared a brand-new
`footprint:"flock"` that had no draw function in the map's `DRAW` registry, so
`DRAW["flock"](…)` threw mid-render and the front-door map ABORTED at this entry —
silently dropping this POI and every place after it (engine-room onward; 32 of 52
POIs rendered). Fixed at the source: moved the entry into `index.src.html` (the
canonical source the builder should have edited), authored a real `drawFlock`
footprint (a scatter of oriented arrowhead-birds, mostly of one mind, plus a small
noise-dial arc — content-expressing) registered in `DRAW`, and re-forged
`index.html`. The map now renders all 52 POIs; the 🐦 footprint + glyph + label
place clean and the breadcrumb passes `forge --audit-seen`.

## Re-souled → **The Roost** (cycle #468, a `[rework]` seed bloomed)

The old page was an *instrument with a proof*: a hero brass φ gauge, a noise knob,
a readouts grid, a BLIND neg-control toggle, a self-test pill fronting the
experience. The estate had drifted toward that "instrument-with-a-proof"
monoculture; this rework re-souls the room into a **full-bleed living diorama** —
delight first — while keeping the proven physics exactly.

- **The core is UNTOUCHED.** `core.mjs` + `core.test.mjs` are byte-verbatim; the
  page still inlines the same `MURMURATION CORE` slice char-for-char (byte-twin
  parity + single-source still green, 13/13). No Hz/dynamics math was re-typed. The
  claim it proves — *order only falls as noise rises* — still lives in the headless
  twin, unchanged. Every cinematic layer is **render-side steering applied AFTER
  the untouched `step()`**, adding NO rng to the core loop.
- **The piece.** 340 Vicsek birds drawn as heading-oriented streaks over a graded
  twilight sky. An ambient time-of-day clock (~52 s auto-loop, a slim scrubber to
  scrub) drives an 8-keyframe sky palette (night→dawn→day→golden→rose dusk→night),
  a setting sun, rising stars, the core's real η dial (loose ~3.3 by day → ~0.75 at
  golden hour), a golden-hour precession **wheel**, a gentle **cohesion** nudge
  toward the flock's torus-circular-mean centroid, and a **roost** attractor at a
  recursively-grown bare tree that fills with perched birds as night deepens and
  releases them at dawn.
- **Graft A — the agitation rim.** Each bird's warm backlit rim is lit from an EMA
  of its coherent turn-rate *above the flock's ambient*, so the ink is near-black
  silhouette everywhere except the sharpest turning fronts — the falcon's wake and
  hard banking read as a warm agitation wave through a dark cloud.
- **Graft B — the weighted falcon.** The cursor-predator chases through a
  spring+damped integrator (it lags and overshoots — you feel its mass), drawn as a
  swept-wing raptor. Nearby flyers are pushed away (∝ (1−d/R)²), opening a local
  density **vacuole**; the core's own alignment heals the gap behind it. Softened
  vs. the prototypes so a stationary cursor **splits-and-reforms** rather than
  scattering the whole flock.
- **φ demoted to a whisper-chip.** No hero gauge, no readouts grid, no self-test
  pill up front. φ survives as the estate's quiet corner self-test-chip idiom: a
  hushed dot that reveals `φ = …` and, on click, a card with the meaning + the
  still-green 3/3 self-test + the kin links. A caption notes that **at night φ
  reflects the perched birds** (all at rest, one heading) — a stillness reading,
  not an airborne-order claim.
- **Payoff-liveness twin (delight, not theorem).** A `window.__murmuration` handle
  on the LIVE render path exposes the state, a step-driver, `setPhase`, the roost
  point, the falcon injector and `livenessTest()`, which drives the REAL path (not
  a shadow sim) and asserts the FELT payoffs FIRE: (1) the falcon opens a density
  vacuole that reseals, (2) the dusk transition drains ≥90% of the flock into the
  roost, (3) φ is computable on demand. Verified 3/3 headless.
- **Intentionally dropped for the re-soul:** the surfaced `localAlignments`
  per-bird colour AND the `BLIND` neg-control toggle are no longer fronted — the
  functions remain in the byte-twinned core (they must, for parity) but the diorama
  does not render them. This is a delight re-soul, not a lab bench.

**Links (both ways, preserved):** kin to The Quorum, The Phantom Jam, The Shepherd,
and the Strange Garden's Boids live in the whisper-chip's card; the copy keeps this
differentiated from Boids (a dusk murmuration with weather, a predator and a roost —
not an ornament generator). Route + `ws:seen:murmuration-meter` breadcrumb kept;
the front-door map entry (in `index.src.html`) and the manifest are unchanged (a
deepen — 67 rooms, no footprint/count change).
