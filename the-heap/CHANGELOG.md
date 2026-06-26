# The Heap That Knows Its Own Angle — changelog

A side-on brass assay tray of dry grain that always settles at the **angle of repose**
θ_r = atan(μ), no matter how much you pour or how you spin the tray. Friction alone, on
one dial. The granular/earth bench beside The Brazil-Nut Box.

## Cycle 330 — sown & bloomed (BUILD/garden, planter)

The first build. Shipped as a new top-level exhibit in the granular/earth corner.

### What it is
- **Gravity is fixed straight DOWN; the TRAY rotates by φ.** A brass plumb-bob hangs as the
  gravity reference and stays plumb while the tray turns under it. A settled free surface
  always rests at the same angle θ_r from TRUE horizontal — "the tray spins, the sand keeps
  its angle."
- **Three brass instruments** down the left: the primary **μ-DIAL** (a draggable rotary with
  engraved material detents — glass beads ~22°, dry rice ~20°, dry sand ~34°, gravel ~42°,
  glue, frictionless; a hidden range input + aria for a11y), a **TILT-WHEEL** for φ (or grab
  the tray edge), and the **PROTRACTOR** pinned at the toe of the downhill face — a brass
  needle on the free face and a glowing indigo θ_r tick that ride to a kiss at rest.
- **The killer demo:** hold the tray still and turn μ DOWN — the θ_r tick sweeps down through
  the needle and at the crossing the face LETS GO and cascades, re-settling at the new lower
  atan(μ). Turn μ up toward glue → it stands ever steeper to vertical; toward frictionless →
  it cannot stand, a puddle. Pour (bigger, same angle) and dump-&-re-pour (different mess,
  same angle) make pour- and history-independence touchable.
- **Dual render = content:** the static brass-lit height field PLUS a thin rolling layer of
  tumbling grain-sprites spawned FROM the relaxation flux, so the picture cannot drift from
  the proof. Grain colour morphs with μ (smooth pale beads → dark angular sandstone). Soft
  procedural WebAudio (cascade hiss / slump thunk / dial detent ticks) behind a begin-curtain,
  on the shared estate mute.

### The physics core (`core.mjs`, DOM-free, the sole authority)
- Single-valued height field `z` over columns ⟂ the tray floor (dx=1). World-frame facet
  angle `θ_world(i) = atan2(z[i]−z[i+1], dx) + φ`. **Slip predicate (Mohr–Coulomb):** facet i
  slips iff `|θ_world(i)| > θ_r`, with θ_r = atan(μ).
- **Relaxation** = BCRE rolling-layer flux: each over-steep facet sheds grain downhill, flux ∝
  angle excess, capped per-facet so it can never overshoot θ_r (the cap makes each sweep a
  stable contraction ⇒ the converged angle is GAIN- and sweep-order-independent). Σz conserved
  exactly by construction; the bulk carries NO randomness, so the proved angle is exact.
- The protractor needle = a least-squares line fit over the avalanched span, grain-aware
  (bare floor reads φ but holds no grain to shed, so it is ignored).

### The proof (8 legs in-page + a Node twin; `forge --check` is the parity gate)
- **CRUX-1** the slip boolean flips EXACTLY at β = θ_r (bisected flip Δ < 0.001°).
- **CRUX-2** (headline) the relaxed face = θ_r across 13 diverse heaps × pour amounts × tilt
  histories, variance ≈ 0 (the needle ignores amount & history).
- **CRUX-3** the needle = atan(μ) over a μ ladder, strictly monotone (exact to 0.000°).
- **CRUX-4** GLUE (μ→∞, θ_r→90°): a level heap never sheds at any tilt — it stands.
- **CRUX-5** FRICTIONLESS (μ→0, θ_r→0): the grain relaxes world-flat — it cannot stand.
- **CRUX-6** AVALANCHE-ON-μ: lowering μ at a fixed tilt fires a cascade & re-settles at the
  new atan(μ); raising μ fires nothing.
- **VALIDITY** Σz conserved through relaxation; bounded termination; gain/order-independence.
- **Node twin** (`core.test.mjs`) re-runs the battery verbatim + deeper legs: a φ∈[−30,30]°
  "the tray spins, the sand keeps its angle" sweep, a fine μ ladder, an order/gain-independence
  panel, a long mass-conservation drive, an 855-point slip truth table, an avalanche-on-μ
  panel, and the single-source grep (the θ_world kernel literal lives in exactly core.mjs).
  16/16 green.

### Registration
- Front-door POI in the grounds/amusements granular cluster (companion: The Brazil-Nut Box);
  a `the-heap` field star in the SW earth-corner of `tools/sky/sky.js` (sky.test 73/73);
  the-gate re-forged to pick up the star; `WS.seen('the-heap')` + the literal `ws:seen:the-heap`
  breadcrumb. `forge --check --all` clean (104 files).

### Honesty / scope
- z is single-valued (no overhangs): GLUE = "tilt a level heap, it never sheds" (β=φ<90°), not
  a vertical cliff. Columns ⟂ the tray floor is the standard tilted-coordinate idealization —
  exact for the proved angle invariant; transient transport is approximate. Closed walls keep
  the pour/history claims clean; at extreme tilt (the uphill face driven past ~80° in the tray
  frame) grain piles against the downhill wall rather than spilling — the documented regime,
  read away from in the headline sweep. Named materials are illustrative; the exact claim is
  only θ_r = atan(μ).
