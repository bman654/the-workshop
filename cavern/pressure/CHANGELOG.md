# Where Pressure Comes From — CHANGELOG

The Cavern Newtonian-drift's **macroscopic-law bench**: the Maxwell–Boltzmann gas next
door measures a *temperature* but derives no macroscopic law. This bench takes the *same*
hard discs, tallies the momentum they hand the walls, and shows that drumbeat settle onto
**P·A = N·kT** — the exact ideal-gas law the Carnot engine one wing over simply *assumes*.
No law is plugged in; it is **counted off the walls**.

## v1 — the wall-momentum-flux bench (cycle #28, the M–B × Engine-Room `[cross]` sown #27)

### The one idea
A disc reflects off a wall: its perpendicular velocity flips sign, `v⊥ → −v⊥`, so the
momentum it hands the wall is

    Δp = |(−v⊥) − v⊥| = 2|v⊥|     (mass m = 1)

That is the whole atom of pressure — exact, no statistics. Sum the kicks over every wall
hit, divide by the perimeter you spread them over and the elapsed time, and you have a
force per unit length: a 2-D pressure,

    P = Σ 2|v⊥| / (perimeter · t)

Average that wall flux over a thermal gas and the virial bookkeeping collapses to
`P·A = N·kT` — the same `⟨½v²⟩ = kT` equipartition the M–B bell is fitted to. The live
running-P meter is shown **settling onto** the amber `N·kT/A` line; nothing is fitted.

### Architecture — single-source the collisions, own only the wall math
- **STEP 0 — `../maxwell-boltzmann/mb-core.mjs`** (NEW, ~75 lines): the M–B gas had its
  collision engine inline-only with no Node test. Extracted the SOLE collision authority
  (`rng`/`collideEqual`/`momentum`/`kinetic`/`speeds`/`kT_from`/`mbCdf`/`sampleMB`) into a
  module wrapped in `// ===== MB CORE … BEGIN/END =====` sentinels. The M–B page re-inlines
  that exact slice (export-stripped) between the same sentinels; its page-only χ² apparatus
  (`mbPdf`/`mbBinProb`/`chiSquareMB`/…) moved OUTSIDE the sentinels. `mb-core.test.mjs`
  (NEW, ~120 lines) re-proves the core headless **and** asserts the page slice === the
  module slice char-for-char (the M–B page's own pill stays **14/14** after the refactor).
- **`pressure-core.mjs`** (NEW, ~70 lines): the ONLY new math. `wallImpulse(v)=2|v|`,
  `makePressureMeter` (rectangle-ready, time-averaged `P=Σ2|v⊥|/(perimeter·t)`),
  `idealPressure2D=N·kT/A`, `idealZ`, `zCarnot`. It **imports** the collisions from
  `mb-core.mjs` and never re-derives them. An anti-circularity grep in the test asserts this
  file defines no `collideEqual`/`rng`/`sampleMB` of its own.
- **`index.html`** (self-contained, zero-dep) inlines BOTH cores as **byte-twins** between
  the same sentinels (MB-CORE 2417 chars · PRESSURE-CORE 2696 chars, both === their source).
  The hard-disc sim is byte-twinned from the M–B render/box/fitCanvas/substep loop with the
  wall-tally hook spliced into the four wall reflects (PRE-flip tally → flash → flip). Its
  own small box targets packing φ≈0.003 (NOT M–B's 0.06, measured to bias +15%).

### What the page does
- A live running-P meter scrolling and **settling onto** the amber `N·kT/A` line.
- A head-to-head: `P_wall` (counted off the walls) vs `P_law` (= N·kT/A), plus both `Z`
  values — `Z_sim = P·A/(N·kT) → 1` off the wall count, `Z_carnot ≡ 1` from the IMPORTED
  engine law. (See the honesty note below for why the cross is dimensionless, not a lucky
  meeting of two formulas.)
- A **movable right wall** (drag or slider) that squeezes A so P climbs to hold the line.
- A **teeth** toggle — the negative control. `½-count the kick` (one mirror, not two) drops
  P to exactly half and flips the head-to-head red ("✗ off by ~2×"); `non-thermal gas`
  (a delta) leaves P on the line — pressure is blind to thermality (pressure ≠ thermometer).

### The honesty note (the load-bearing caveat, shipped in-page)
"Agrees with Carnot" is **one law under one dictionary**: particle count `N` ↔ moles `n`,
Boltzmann `k_B` ↔ gas constant `R`, with `N·k_B = n·R`. Carnot ships a **3-D** gas with the
real `R = 8.314` baked into its `pressure(n,T,V)`; this bench is the **2-D** ideal law with
`k_B ≡ 1`. A literal `pressure(N,kT,A)` would read off by exactly that factor of `R` — so
the cross is asserted as the single **dimensionless** law `PV/(NkT) = 1`, once on each side
of the dictionary (`Z_carnot = 1` exactly, `Z_sim → 1` off the wall count). Same law, twice.
A Node-twin check asserts the page's `R_GAS` literal === the engine's exported `R_GAS`, so
the page's local `carnotPressure` (re-typed only because the page is import-free) can't drift.

### Self-test — the workshop's signature
- In-page pill **8/8** (4 rungs): Rung 1 `wallImpulse === 2|v|` (and NOT `|v|`); Rung 2 the
  virial `P·A/N === kT` exact + `kT_from === ⟨½v²⟩`; Rung 3 live convergence (residual
  reported, shrinking, never "perfect"); Rung 4 the dimensionless cross both ways (Carnot
  IMPORTED, `Z_carnot === 1` to 2e-16).
- `pressure-core.test.mjs` **14/14** (Node): the 4 rungs + the teeth-break + anti-circularity
  grep + both byte-twin parities + the dimensionless-Z cross importing the real
  `pressure()`/`R_GAS` from `engine-room/carnot/core.mjs`. A literal `pressure(N,kT,A)` is off
  by exactly `R = 8.3145`; ½-teeth snaps `Z_sim` to 0.5005.
- `mb-core.test.mjs` **9/9** (Node): the collision core re-proven headless + the M–B page
  byte-twin parity.

### The cross (4 legs + card + unlock)
- Carnot (`engine-room/carnot/index.html`): appended "derived next door from wall
  collisions →" after the existing M–B link (the M–B link is **kept**, not replaced).
- M–B gas: a top-nav "→ where its pressure comes from" + a closing-prose clause.
- This page's top-nav: "↔ the engine that assumes it" · "↔ the Maxwell–Boltzmann gas" ·
  "← The Cavern" · "⌂ The Workshop".
- The Cavern landing (`cavern/index.html`): a new 🧱 bench card after the M–B card, and
  `'pressure'` added to `NEWTONIAN_IDS` (the walk-both-drifts spatial unlock). The page
  drops the `ws:seen:pressure` breadcrumb (the Survey's food).

### Publisher fresh-eyes review (cycle #28)
agent-browser session `pressure-pub-cyc1`, http.server :8742. **Found no bug — shipped as
built.** Verified all four surfaces live: the exhibit pill **8/8 ✓**; **0 console errors**;
**0 nested anchors · 0 horizontal overflow** at 1280 AND at 390; **61 fps** under live
animation. Drove all three interactions: ½-count teeth → P_wall 73.83, Z_sim 0.494, red
"✗ off by ~2×"; delta teeth → stays green (pressure blind to thermality); wall squeeze
W=0.65 → A→0.650, P_wall climbed 148→226 to hold the law (Z_sim 0.986). The honest run
read P_wall 148.40 vs N·kT/A 149.31 → Z_sim 0.994, green "✓ P·A = N·kT to 0.6% · same law,
twice". The three registration surfaces verified: Cavern landing card (🧱, "Where Pressure
Comes From", 0 nested `<a>`, landing pill stays **27/27**); M–B page (both cross-links
resolve, pill stays **14/14**); Carnot (back-link resolves, M–B link still present, pill
stays **17/17**). The builder's three flagged concerns all check out as honest design
choices (Rung-3 convergence slack is genuine; the R_GAS Node-twin is the right anti-drift
guard for a self-contained page; the landing pill stays 27/27 without enumerating
'pressure' in openExpect — harmless).
