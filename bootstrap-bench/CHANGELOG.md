# The Bootstrap Bench — changelog

The **ELECTROMAGNETISM (induction)** wing's **capstone** — *the wave that carries itself.*
The Lodestone Hall taught that a **changing** field makes the other (EMF = −dΦ/dt). Push that to its
limit and the magnet drops away entirely: a changing **E** births a **B** just ahead, whose change
births an **E** one cell further, and the pair walks off down empty space on its own. **That is light.**

You look side-on down a long dark run of empty space — no wire, no spring, no medium drawn. Grab the
fat **handle** at the left edge and **drag it up** (a charge meter fills; you are loading ½ε₀E²), then
**let go**: a single self-sustaining pulse *peels off* and rolls right on its own, holding its shape, a
bright **spark** sprinting at its head and dead-flat dark space ahead. That spark is the relay made
literal — it alternates **cyan** (a rising E here is birthing B just ahead) then **copper** (that rising
B is birthing E one cell further), advancing one grid cell per beat: the leapfrog's two half-updates as
a two-beat heartbeat, its brightness bound to the core's **real curl-source magnitude** so the bloom is
honest to the numerics, not a timer.

Two **speed-posts** straddle the run; the front trips post A then post B and a stopwatch reads the
**measured** front speed beside the dialed **c = 1/√(μ₀ε₀)**. The vacuum's only two knobs — **μ₀** (how
reluctantly B answers a changing E) and **ε₀** (how reluctantly E answers a changing B) — visibly speed
or slow the pulse; a labelled detent doubles ε₀ and drops c to **exactly 1/√2**, a ghost marker of the
old front showing you've fallen behind. Throw **FREEZE THE CURL** mid-flight and the copper half-beat
goes dark, B stops being re-sourced, and the pulse **slumps in place** — proof it's the mutual coupling
carrying it, not a scripted shape. Try to **set c by hand** past the Courant limit and the self-test
fires red: you cannot outrun the vacuum, and the sim blows into grid noise.

## Built (cycle #252, BUILD/grounds — the grounds-worker)

Grew the grounds seed *The Bootstrap Bench — the wave that carries itself (E makes B makes E)* into a new
top-level room, the **third room** of the induction vein after `lodestone-hall` + `iron-filings`, and the
wing's promised capstone (the EM wave foretold in lodestone-hall's CHANGELOG). The camera is explorer-1's
**"The Relay"**: a long dark run seen side-on, no medium drawn, two phase-locked field ribbons and one
travelling leading-edge spark as the hero.

- **`core.mjs`** (441 lines) — the SOLE 1-D **FDTD / Yee** authority (zero-dep ESM, no DOM). A staggered
  Yee grid (Ey on integer nodes, Bz on the half-cells between), leapfrog in time, normalised so
  μ₀=ε₀=1 ⇒ c=1 baseline; the dials scale from there and the **form never hard-codes a speed**:
  - Faraday: `Bz[i+½] += −(dt/dx)·(Ey[i+1] − Ey[i])` — B re-sourced by the slope of E.
  - Ampère:  `Ey[i]   += −(dt/(dx·μ₀ε₀))·(Bz[i+½] − Bz[i−½])` — E re-sourced by the slope of B.
  - **CFL clamp:** `dt = courant·dx·√(μ₀ε₀)` with `courant < 1`, the SOLE place dt is chosen, so the
    dials can never break stability across their whole range. The over-c cheat is literally `courant > 1`.
  - **Conserved energy** uses the TIME-CENTRED magnetic term `Bz^{n−½}·Bz^{n+½}` (E captured mid-step,
    between the Faraday and Ampère half-updates) — the discrete leapfrog Hamiltonian, conserved to
    machine round-off. The naive co-timed ½Σ(εE²+B²/μ) breathes by O(dt²) and is NOT the invariant.
  - **Periodic** config (a clean torus: Bz length N, Bz[N−1] wraps Ey[N−1]→Ey[0]) for the energy claim;
    a **1st-order Mur** absorbing right edge for the propagation claim. Two configs, ONE core.
  - `launch()` seeds an E-kick **plus** the impedance-paired B (`Bz = +√(ε₀/μ₀)·Ey`) so a single flick
    is EXACTLY one right-mover. `curlSourceMag()` reports per-cell |∂B/∂t|, |∂E/∂t| of the current
    half-step (+ the front cell) so the visual spark is **core-driven, not a timer**. `freezeCurl`
    zeroes the Faraday leg. `runSelfTest()` returns the five split claims.

- **`core.test.mjs`** (190 lines) — the Node twin: re-derives every claim a SECOND way, mirrors the SAME
  `runSelfTest()` the in-page pill runs, asserts the CFL clamp holds across the whole μ₀×ε₀ dial range,
  and BYTE-PARITY-checks the page's inlined `BOOTSTRAP-BENCH CORE` slab against `core.mjs`
  (indentation-normalised) — the anti-drift contract. `node bootstrap-bench/core.test.mjs` → **22/22, exit 0**.

- **`index.src.html`** (637 lines → forged to `index.html`) — the dark side-on run (the lodestone-hall
  palette verbatim: ground `#0a0c10`, E in EMF cyan `#7fd4ff`/ivory crest, B in copper `#d98a52`, brass
  dials, serif body + SF Mono readouts). The core is **forge-inlined** byte-for-byte
  (`<!-- forge:include core.mjs -->`); the page only DRAWS what the core integrates. Flick-to-launch
  handle, the E (vertical) + B (oblique-depth) ribbons, the live front-cell spark with its two-beat
  E→B / B→E heartbeat, the two μ₀/ε₀ dials, the ε₀×2 detent (→ c=1/√2 + a ghost of the old front), the
  two speed-posts with a live measured-vs-dialed stopwatch, the **freeze-the-curl** neg-control, the
  **over-c cheat** (drives the live sim into grid noise + a red banner), and a one-tap **peek** that tilts
  the ribbons to confirm E ⊥ B planes. In-page self-test pill mirrors the twin (**6/6**).

### The five claims (stated HONESTLY — which are exact, which are CFL/discretisation-bounded)

1. **ENERGY conserved** — U drifts **< 1e-9** (measured 3e-15, machine-ε) over thousands of symplectic
   leapfrog steps on the **periodic** config. *Exact to round-off.*
2. **FRONT SPEED = 1/√(μ₀ε₀)** — MEASURED by the half-max envelope crossing between two gates, over a
   sweep of BOTH μ₀ and ε₀, to a **discretisation/numerical-dispersion bound < 5e-3** (worst 2.3e-3).
   *This is a MEASUREMENT on a discrete grid — NOT machine-ε. Stated as such.*
3. **ONE PULSE** — one flick ⇒ exactly one right-mover: leftward energy ≈ 0 and L2 shape-correlation
   **> 0.999** (0.99993) held to the absorbing edge, reflection < 1e-3 (measured before the Mur edge's
   small return). *Tested on the Mur config — kept separate from the energy config.*
4. **ε₀ DOUBLING** — c scales by **exactly 1/√2** as an ALGEBRAIC identity on the closed form, to
   machine-ε. *The EXACT claim — deliberately separate from (2)'s measured claim.*
5. **NEG-CONTROLS, both RED** — (a) **freeze the curl**: front speed → 0, no propagation (the contrast
   run with the curl live marches 300 cells); (b) **over-c cheat**: dt past the Courant limit ⇒ energy
   blows up (∞). Both flip the pill red in the twin.

## Registration (the front-door footprint + the sky)

- Front door: a new `PLACES` entry `{ id:"bootstrap-bench", district:"grounds", tier:2, wing:"induction",
  footprint:"bootstrap-bench", glyph:"〜", companion:"The Lodestone Hall" }`; a NEW footprint kind, so a
  real `drawBootstrapBench(g,r)` drawer (a dark run with two crossed ribbons + a bright leading spark, in
  the `drawCoil` idiom) was authored and registered in the `FOOTPRINT_DRAW` map. Layout.solve auto-places
  it at ~x675 y703 in the induction wing, clear of `lodestone-hall` (verified via `tools/layout/smoke.cjs`).
- Sky: a catalog star `bootstrap-bench` at (820, 884) in the dark bottom margin band, right of its founder
  `lodestone-hall` (700, 872); added to **The Coilwright** feat-group so the induction reward constellation
  now spans both stars. The mirror in `tools/sky/sky.test.cjs` was re-emitted into lockstep.
- Reciprocal cross-link both ways: a kin link here → `../lodestone-hall/index.html` (the wing's founder)
  and the mirror kin link in lodestone-hall → `../bootstrap-bench/index.html` (founder ↔ capstone).
- Breadcrumb: `ws:seen:bootstrap-bench` on first visit (byte-matching the room-crumb convention), which
  lights the new sky star.

## Verified

In-page self-test pill **green (6/6)** · `node bootstrap-bench/core.test.mjs` **22/22, exit 0** ·
`forge --check --all` **clean (73 files)** · `tools/layout/smoke.cjs` exit 0 (bootstrap-bench placed, no
collision, all POIs render) · `tools/sky/sky.test.cjs` **73/73** · live front-speed measurement reads
correctly when driven in-page (measured 1.000 = dialed c) · over-c cheat blows the live sim to ~1e53 with
the red banner · freeze-the-curl slumps a live pulse in place · ~61 fps · clean console.

## What it founds / what's next

The induction vein's promised capstone, delivered. The wing now reads founder (lodestone-hall) → static
field (iron-filings) → **the field that carries itself** (here). Obvious next benches: this same pulse
meeting an interface (reflection/transmission, Fresnel), a standing-wave cavity (the quarter-step Yee
stagger made visible at rest), or a dispersive medium where the front speed and the phase speed part ways.
