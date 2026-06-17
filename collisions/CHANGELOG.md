# The Clack Counter — π, spelled in collisions · CHANGELOG

A frictionless lane, a heavy block **M**, a light block **m=1**, and a wall.
Shove M and the brass counter ticks once per collision while real pitched
clacks fire — and when the lane falls silent the count is a prefix of π:

- ratio **1 : 1** → **3**  (π ≈ 3)
- ratio **100 : 1** → **31**  (π ≈ 3.1…)
- ratio **10⁴ : 1** → **314**  (π ≈ 3.14…)
- ratio **10⁶ : 1** → **3141**  (π ≈ 3.141…)

This is Galperin's billiard. The collision count for mass ratio 100ᴺ : 1 is the
first N+1 digits of π — **π is a tally you HEAR**, not a number you compute. The
on-screen lane REPLAYS the Core's exact event timeline, so what you see and hear
is exactly what the proof counts (dual truth).

## v1 — cycle #105 (2026-06)

### The room
- `core.mjs` (158L) — the **SOLE PHYSICS AUTHORITY** (DOM-free, shared by the page
  and the headless twin). Three cross-checked views of one truth:
  - `closedCount(M,m) = ⌈π / atan√(m/M)⌉ − 1` — a single arithmetic expression
    (the wedge-billiard / unfolding formula), **not** a stepped loop.
  - `velocityCount` — a count-only ground truth derived in velocity space.
  - `simulate(M,m)` — an event-driven engine: analytic time-to-next-collision,
    exact jumps, exact elastic update `((M−m)·vH + 2m·vL)/(M+m)` + wall flips,
    returning the ordered event timeline the page replays.
  - plus `naiveFloorCount` (the boundary-trap control), `isPiPrefix`, `PI_DIGITS`,
    `RATIOS`.
- `core.test.mjs` (143L) — the Node twin, **85 assertions, exit 0**.
- `index.src.html` (611L) — the touchable + audible page; `forge:include` inlines
  `core.mjs`.
- `index.html` (769L) — the forge-built page, core inlined **byte-faithful**
  (0 leaked exports; signatures match).

### The experience
- The big brass tabular-nums counter ticks up per collision; warm ~180Hz knock
  for block-block, bright ~620Hz tick for the wall, a 4ms voice-cap on the burst.
- The counter locks **GREEN** on settle and the prophecy spells **π ≈ 3.1…**.
- A 4-stop ratio dial (1 / 100 / 10⁴ / 10⁶), a shove slider, drag-to-shove, a
  slow-mo scrub, and a **step 1 clack** single-stepper.
- An optional collapsible **"why π?"** phase-space wedge: `u = (√M·v_M, √m·v_m)`
  on the energy half-circle, a fan of rays θ = atan√(m/M) apart, lit one per
  clack, driven by the SAME Core — the geometry that makes the count be π.

### Self-test (all GREEN, exit 0)
`node collisions/core.test.mjs` → **85 passed, 0 failed**:
1. `closedCount == velocityCount == eventCount == {3, 31, 314, 3141}` for N=0..3,
   the closed form via the wedge formula (not a loop).
2. event-engine count === closed form for every tested ratio incl. off-family
   {2, 50, 1000, 64, 7, 256, 3, 9}.
3. KE conserved at **every** event to <1e-12 AND momentum conserved at every
   **block-block** event to <1e-9 (a wall hit legitimately flips total P, so P is
   checked block-block only; the test also proves the wall DOES flip total P,
   justifying the exclusion).
4. NEG CONTROL: {2, 50, 1000, 64, 7, 256, 9} are not π-prefixes.
5. BOUNDARY TRAP: naive `floor(π/θ)` gives 4 at 1:1 (true=3) and 6 at 3:1
   (true=5); `ceil−1` gives the truth, and `ceil−1` === the event count at both.

### Registration (additive)
- one PLACES record in `index.src.html` (id `collisions`, glyph 🎱, accent #e8b86b
  brass, grounds / tier2 / wing:number — kin to The Numbers Room, zero new
  taxonomy) → forge-rebuilt `index.html`.
- a `collisions` field star in `tools/sky/sky.js` CATALOG at (1180,560), clear of
  every footprint/furniture/pool/viewbox edge (≥126px from the nearest star).
- `ws:seen:collisions` breadcrumb drops on visit.

### Builder fixes vs the prototype
- mobile @390 header/counter vertical overlap fixed (counter top=52 clears header
  bottom=43); the long title overflowing into the self-test pill fixed (pill goes
  compact "self-test ✓" below 560px).
- a real step-button bug from the prototype port: idle state was wrongly marked
  settled so "step 1 clack" never advanced — now `settled` is set only by
  `markSettled()`; single-step advances exactly one event per click.

### Publisher fresh-eyes (cycle #105) — SHIPPED CLEAN, one polish fix
Reviewed live (served on an uncommon port, agent-browser session `ws-clack-pub105`,
both torn down by exact PID / session name — Brandon's :3001/:4380 untouched):
- in-page self-test pill GREEN `self-test ✓ 3·31·314·3141`; console exactly ONE
  entry (the SELF-TEST PASS log) — **0 errors/warnings**.
- drove 100:1 to settle → counter locks **GREEN at 31**, prophecy **π ≈ 3.1…**;
  the "why π?" wedge renders as a legible 31-ray fan (θ=5.71°, rays lit 31/31)
  with the escape dot.
- **0 horizontal overflow** @1280 AND @390 (scrollW==innerW), **0 nested anchors**;
  mobile header clears the counter and the pill goes compact.
- front door renders the room card (231×74, visible) → `collisions/index.html`,
  no overflow, no nested anchors; sky bijection 73/73 · layout smoke PASS ·
  hours 69/69 · `forge --check --all` all 36 current · `forge --audit-seen
  --strict` exit 0 (collisions drops its breadcrumb).
- **POLISH FIX:** the centered on-ramp hint dismissed only on a full SHOVE, so it
  lingered over the lane when single-stepping from cold. Now `doShoveSilentStep()`
  hides it on the first step too (verified live: step from cold → hint opacity 0,
  counter advances to exactly 1). Re-forged `index.src.html → index.html`,
  re-verified core twin 85/85 + 0 leaked exports.

Provenance → [../ROADMAP.md](../ROADMAP.md) BLOOMED #105 in `### exhibit` +
[../worklog/2026-06.md](../worklog/2026-06.md) cycle #105.
