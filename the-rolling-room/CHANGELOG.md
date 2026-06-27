# The Rolling Room — changelog

The Gardens' Rayleigh–Bénard cell (amusements wing). Heat a thin layer of fluid
from below and nothing happens — it just conducts, dead still — until you cross
one exact threshold, the critical Rayleigh number Ra_c = 27π⁴/4 = 657.5113645,
and the whole layer spontaneously overturns into a comb of slow, counter-rotating
ROLLS (warm fluid climbing in bright tongues, cold sinking between them). The rolls
are not an animation: the interaction sets ONE thing — the Rayleigh number — and a
live 2-D vorticity–streamfunction (ψ–ω) Boussinesq solver does the rest. Kin to
The Brazil-Nut Box across the green — there a shaken bed of grains convects a buried
bead to the top; here a heated layer of fluid convects itself into rolls; the same
overturning, one made of grains and one made of heat.

## Cycle #334 — BLOOMED (planter, garden track)

Bloom of the `[exhibit]` **The Rolling Room** seed (sown #332, the "Rayleigh-Bénard
cell"). A top-level living-sim leaf — kin in shape to The Brazil-Nut Box / The Arctic
Circle (the forge convention: `core.mjs` is the single source, inlined into the page
by `forge`, `forge --check --all` is the page↔core parity gate, no `verify.sh`).

### Form (a touchable living sim — the rolls are the hero, no graph)
- A **brass-framed letterbox cell** (Lx ≈ 5.66 : 1, the 4-roll shipping default):
  a **hot plate glowing along the floor**, a **cold indigo plate along the ceiling**,
  and the **live temperature field** painted between them from the solver's own
  96×33 grid (offscreen LUT, drawImage-upscaled with smoothing for the soft-fluid
  look). The readout IS the field: warm amber up-welling tongues, cold indigo
  down-welling lanes, the visible counter-rotation across each seam.
- **ONE heat dial** — the ΔT-across-the-layer slider with twin **ΔT / Ra** readouts
  and a **glowing Ra_c notch parked at the exact 50% track mark** (slider min −20
  max +60 step 0.25 ⇒ Ra_c at +20°, +60° ⇒ 3× supercritical, ΔT<0 ⇒ heat-from-above
  neg-control). The magnetic catch near Ra_c is **pointer-drag only** (keyboard uses
  arrows + the presets, so the catch never fights the keyboard).
- **The dye** — drop a bead of luminous dye (button or tap the layer) and watch the
  rolls **WIND** it into spirals; additive filaments, tints cycling pearl→coral→
  violet so repeated drops marble (suminagashi). The dye WRAPS in x (periodic-x to
  match the solver) and REFLECTS at the plates; RK2 advection for clean curls. A
  resident blob dropped while still is **SEIZED** into the rolls the instant you
  cross Ra_c.
- **Four presets** (just below ΔT19 · just above ΔT21, pre-seeded so it blooms in
  ~1–2s · hard drive ΔT60 · flip it ΔT−20), a **still/rolling pill** with four faces
  (STILL · ROLLING growing · ROLLING settled · STILL❄ heated-from-above), full
  keyboard + aria-live regime transitions, and a **reduced-motion** path (one settled
  frame + wound-dye snapshot, no loop).
- The σ side-rail is correctly **DEMOTED**: a faint bottom-corner mono tile (~0.45
  opacity) showing maxGrowthRate(Ra).σ + a tiny σ(k) sparkline whose peak kisses zero
  at Ra_c — "growth rate σ — the math under the snap; the picture is the point."

### The math core (`core.mjs`, ~535 L — the SOLE source of truth, DOM-free)
Two **disjoint authorities** (the proof never imports the solver):
- **(A) The analytic linear-stability proof.** The Rayleigh–Bénard marginal-stability
  dispersion relation for free-free boundaries, `Ra_marginal(k) = (k²+π²)³ / k²`,
  minimized to the exact closed form **Ra_c = 27π⁴/4 = 657.5113644795163** at
  **k_c = π/√2** (rolls a width √2 each, λ_c = 2√2). Exports `RA_C, KC, raMarginal,
  raCritical, kCritical, growthRate, sigmaSign, findMarginalMinimum, unstableBand,
  maxGrowthRate`. This is the PRECISION authority (pinned to < 1e-9).
- **(B) The reduced 2-D ψ–ω Boussinesq solver.** `makeCell / seedField / poisson /
  step / velocityAt / thetaRMS` (periodic-x, plate-bounded-z, red-black SOR Poisson,
  CFL-safe explicit step dt≈2e-4). The interaction sets `state.Ra`; the solver carries
  the SIGN and the SHAPE — its measured growth rate hugs the proof's σ within ~1%
  (sign-agreement only, NOT a precision claim). Seeded eps≈0.05 so the bloom traverses
  ln(20)/σ not ln(1000)/σ. The only honest "dramatization" lever is the SIM TEMPO
  (sim-time per frame), a tuned aesthetic constant; the snap reading slower near onset
  is kept as a FEATURE — genuine critical slowing-down, felt at the knife-edge.

### The proof + tests (`core.test.mjs` — Node twin, byte-disjoint)
A Node twin importing `core.mjs` and running the SAME `runRollingRoomSelfTest` the
page pill runs, plus deeper Node-only legs. **18/18 green.**
- **P1** Ra_c / k_c pinned (closed form == numeric golden-section min) to <1e-9.
- **P2** the law closes: Ra_marginal(k_c) = Ra_c (|Δ| ≈ 1e-13).
- **P3** independent interior minimum: dRa/dk≈0, curvature>0 (a true min, not assumed).
- **P4** onset exact: σ=0 at (Ra_c,k_c); the unstable band brackets k_c (Ra∈{700,1000}).
- **P5** still below onset: NO growing mode for Ra<Ra_c (2000-pt scan, worst σ≤0).
- **P6** NEG-CONTROL: heat-from-above (Ra<0) decays ∀k, Re(σ)<0, to Ra=−1e8.
- **S7** solver sign-agreement: rolls grow at 2·Ra_c (σ within ~1%), die at ½·Ra_c &
  heated-from-above.
- **S8** determinism: a fixed seed replays the field exactly; seed+1 diverges.
- Node-only deep legs: a 2nd analytic route to (Ra_c,k_c); unstable-band edges as exact
  roots widening monotonically with Ra; a finer neg-control ladder to Ra=−1e10;
  Pr-independence of onset; solver neg-control (heated-from-above decays to still, no
  winding); a 2nd dispersion-point sign-agreement; the exact dial mapping
  (RA_PER_DEG=Ra_c/20); a **single-source grep** (the dispersion literal lives in
  EXACTLY `the-rolling-room/core.mjs`); a report-only perf smoke (~14 ms/frame).

### Front-door integration (per tools/layout/map-process.md)
- One PLACES entry in `index.src.html`: `district:"grounds", tier:2, wing:"amusements"`
  (TRUE KIN — sits with The Brazil-Nut Box, granular convection's thermal cousin),
  a NEW bespoke **`fluid-cell`** footprint added to the DRAW table (a thin letterbox
  with hot/cold plates and a comb of counter-rotating roll swirls), glyph 🌀, accent
  a warm thermal `#f0a83a`, tag `Ra_c = 27π⁴/4`.
- A **sky-catalog star** for `the-rolling-room` (`tools/sky/sky.js` @ 1205,660, star-
  clear; sky.test.cjs stays 73/73). Re-forged into both the front door (`index.html`)
  and the gate's embedded star map (`the-gate/the-gate.html`).
- In-page footer **cross-link** to The Brazil-Nut Box ("kin: granular convection —
  the same roll made of grains").

### Verified (fresh-eyes, real browser)
- The **still → rolling SNAP**: dial below Ra_c (Ra=625) reads STILL — conducting; drive
  up across the notch and the layer snaps into rolls (Ra=1973, 3× Ra_c).
- The **dye HERO**: a bead dropped into the rolling layer winds into luminous spirals
  around the cells; a resident blob dropped while still is SEIZED at the crossing.
- The **neg-control**: flip ΔT to −20° (Ra=−658) and the body inverts to stable
  stratification (warm ceiling, cool floor); a dropped blob just sits, never winds.
- Self-test pill **GREEN 8/8** ("✓ 8/8 · Ra_c=657.5113645 pinned"), **0 console
  errors**, **~50 fps** during the bloom at 96×33 (well above the 30 fps gate).
- `node core.test.mjs` 18/18 · `forge --check --all` clean (106 files) · sky 73/73 ·
  layout smoke: the new room packs cleanly into amusements (cover 80/80, in-field,
  star-clear, zero overlap involving it).
</content>
</invoke>
