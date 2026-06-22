# The Brazil-Nut Box — changelog

The Gardens' Shaker Table (amusements wing). A buried heavy bead climbs to the top
when you SHAKE the box — the Brazil-nut effect (granular size segregation), the thing
that surfaces the big nut in a shaken can. The climb is a real consequence of the
granular rule, not a scripted animation: the bead rests on the TALLEST of its support
columns, so it ratchets up and resists sinking. Sibling of The Phantom Jam across the
green — there a smooth flow LOSES its order when the road is crowded; here disorder
SORTS itself the moment you shake it.

## Cycle #308 — BLOOMED (planter, garden track)

Bloom of the `[exhibit]` **The Brazil-Nut Box** seed. A top-level living-sim leaf —
kin in shape to The Arctic Circle (forge convention, no verify.sh) and kin in register
to The Phantom Jam / Murmuration in the Gardens.

### Form (a touchable living sim, NO graph — the thing you SHAKE and watch)
- A **brass-framed PORTRAIT glass box** (taller than wide — the vertical climb is the
  point), filled with warm sand grains, on a dark indigo cold-frame. The readout IS the
  **rising bead**: a luminous gold disk with an additive glow that pulses on each
  ratchet-up, a **mercury tick** in the right-wall brass gutter tracking its height, and
  a faint comet trail marking where it climbed FROM. No chart anywhere.
- **Controls you jog:** SHAKE AMPLITUDE slider (headline; 0 = the negative control you
  can feel), INTRUDER SIZE slider (drag to ×1 grain-size and the climb dies — neg-control
  B in your hand), GRAIN SIZE slider (texture), TAP/JOLT button (one visible shake per
  press), CONTINUOUS SHAKE toggle (off ⇒ the bed freezes flat — neg-control A), RE-BURY.
  Or **grab the glass and drag** to shake it yourself. ARIA + keyboard ±1 on every dial.
- A **CONVECTION-ROLL GHOST** (~0.10 alpha, up-the-middle/down-the-walls streamlines with
  advected dots, alpha pulsing with shake) labels the WHY — a DISPLAY, no claim.
- A live cartouche: **Intruder height** (fraction of fill-depth, surface tick at 1.0) and
  **Size ratio** (a bar warming red toward 1:1, telegraphing "symmetric won't sort" before
  you run it); a liveCap that lights when the bead first breaks the surface.

### The math core (`core.mjs`, ~310 L — the SOLE source of truth, DOM-free)
- **The support kernel** (explorer 0's validated mechanism — a naive 2D packing does NOT
  segregate, proven Δ=0, so a pure 2D grid does NOT carry the claim). The bead's footprint
  is R adjacent support columns; one **`shakeKernel`** jostles each column by a symmetric
  ±1 transient-void walk (P(up)=P(down)=amp/2, else hold); the rigid bead rests on the
  TALLEST column ⇒ **`by = max over k of col[k]`**, THE readout. A grain drops on any
  1-wide void (common); the bead sinks only when ALL R columns void at once (an AND over R
  walks — rare). So `by` = max of R unbiased ±1 walks: positive drift for R>1, **exactly 0
  for R=1** (an extreme-value theorem), and the drift GROWS with R.
- **`step2D`** co-steps the VISIBLE grain field by the SAME rule and ASSERTS its measured
  bead support equals the kernel `by` every cycle — picture == proof, they cannot drift.
- **`runEnsemble`** (single-sourced here, byte-twinnable) returns `heights[c]` = mean `by`
  over many seeded runs — the proof authority for every band claim.
- The estate's **mulberry32** PRNG verbatim from the-phantom-jam (the brief's design text
  flagged this as a deliberate override of any xorshift default; single-sourced here so the
  page + twin never drift).

### Self-test — five cruxes + supports, every claim a BAND/TREND on the ensemble mean
- **CRUX-1 MONOTONE CLIMB (one-sided):** from a buried start (<0.15) the ensemble-mean
  bead height is non-decreasing within `TOL_MONO_DIP`, ends in the surface band (>0.7),
  net rise ≥ `RISE_MIN`. R=4, amp=0.6, runs≥48, cycles=240.
- **CRUX-2 NEG-CONTROL A (shake off, one-sided flat):** amp=0 ⇒ every checkpoint within
  `TOL_FLAT` of the start (measured 0.000000). No shake, no climb.
- **CRUX-3 NEG-CONTROL B (symmetric, TWO-sided near zero):** R=1 ⇒ |net displacement frac|
  < `TOL_SYMMETRIC` (runs=200). It may diffuse either way but mustn't systematically
  climb. The one-sided/two-sided asymmetry vs CRUX-1 is itself part of the honesty.
- **CRUX-4 SIZE LADDER:** final ensemble-mean climb (raw `by`) strictly increasing in R
  across {1,2,3,4,6,8} — size asymmetry necessary AND graded.
- **DOSE-RESPONSE:** final mean non-decreasing in amp across {0,0.5,1.0}.
- **DETERMINISM both ways** (same seed exact / seed+1 diverges), **VALIDITY** (by===max(col)
  every step, grains conserved, footprint in-bounds — kernel-appropriate, NOT disk-overlap),
  a **second-seed re-derivation** of CRUX-1, and a **single-source grep** (the void-walk
  kernel literal is live `.mjs/.js` in EXACTLY `brazil-nut-box/core.mjs`).
- In-page pill **7/7**; Node twin `core.test.mjs` **16/16 ALL GREEN** (exit 0) with deeper
  layer-2 cross-checks (size ladder to R=10, a six-seed zero-drift panel, a finer dose
  ladder, 500-shake validity, a 240-cycle byte-replay, the single-source grep).

### Honesty notes
- The climb is a STOCHASTIC process: every claim is a tolerance band / trend on the
  ENSEMBLE MEAN, NEVER a per-step or per-seed equality, and no "cycles-to-surface" number
  is ever pinned (that would lie about a random walk). The only equality asserted is
  determinism (a fixed seed replays exactly).
- The 2D grain field is a faithful co-stepped VISUALIZATION, not a second physics — the
  kernel is canonical and `step2D` throws if the picture ever disagrees with the readout.
- The convection-roll ghost is descriptive (the WHY the Brazil-nut story tells), carrying
  no proof; the claim is carried entirely by `by = max of R walks`.

### Front-door registration
- New PLACES entry `brazil-nut-box` (The Gardens · The Shaker Table, 🥜, accent #caa45a),
  district `grounds`, tier 1, wing `amusements` — companion The Phantom Jam 🚗. Drops its
  own `ws:seen:brazil-nut-box` breadcrumb (forge --audit-seen clean). bigSwingsBuilt
  stays 28 (a Gardens leaf, no new wing).
- forge regenerated; `forge --check --all` clean (95 files); layout smoke exit 0 (the
  intended #103 crowding WARNING does not fail structural smoke); all 29 legibility checks
  pass. No catalog star minted (a content-only Gardens leaf, matching siblings).
