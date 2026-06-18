# The Tangle Bench — changelog

The Sewing Room's **fourth** bench. Where the Knot Tabulator *computes* a knot's
determinant and the Unknotting Bench lets you *untie* a disguise, the Tangle Bench
shows where a knot **comes from**: agitate a strand and watch it writhe, and a live
detector reads the wing's own **|Δ(−1)|** straight off the geometry — the *same*
integer the Tabulator computes combinatorially.

## Architecture (mirrors the unknotting-bench)
- **`tangle-core.mjs`** — the DOM-free core. IMPORTS the shared knot math
  (`gaussToCrossings` / `knotDeterminant` / `isRealizable` / `diagramCode` / `makeRng`)
  from `../knot-tabulator/knot-core.mjs` — the single authority, never redefined. The
  genuinely-new code lives between `// ===== TANGLE CORE BEGIN/END =====` sentinels:
  the **geometry→Gauss detector** (`segInt` · `crossingSign` · `geomToGauss` ·
  `closeArc` · `detLive`), the hand-authored **reference polylines**, the **braid-
  closure entropy harness** (`braidGauss` · `runTrial` · `cohortP` · `wilson`), the
  **teeth** (`countCrossingsFake` · `constantPFake`), the **clock-free 3-D sim**
  (`makeWorld`), and the SOLE oracle `runSelfTest()`.
- **`index.html`** — the in-character Sewing-Room bench. Imports the shared math as a
  module; inlines a **byte-identical twin** of the core slice between the sentinels.
  Canvas-rendered live strand (a gold tube with casing-gap under-passes), the SHAKE
  (hold) + PULL-TIGHT (tap) verbs, LENGTH + VIGOR sliders, the live KNOTTED/loop
  headline + det readout, and the published P-vs-A entropy spark-line.
- **`tangle-core.test.mjs`** — the Node twin: runs `runSelfTest()`, deeper Node-only
  asserts (detector parity, braid specimens, monotonicity with disjoint Wilson, the
  neg-control, the teeth, clock-free replay), then re-extracts the inlined slice and
  proves it **char-for-char === the module** + import-provenance + no-redefinition.

## The honest physics (a call this bench makes openly)
A *sealed* loop can never change its knot type without passing through itself — a
theorem, and the self-avoidance here forbids the pass-through. So the thing you shake
is an **open** strand (two free ends — the dropped garden hose), which genuinely
tangles, exactly as a real agitated string does (Raymer–Smith 2007). The detector
**closes** the open arc the standard way (a return path routed far outside the frame,
adding no crossing) and reads the knot of the closure.

## The proven claims (Node twin === in-page pill, both call `runSelfTest()`)
- **a — DETECTOR SOUNDNESS / PARITY.** `detLive` on the reference polylines reads
  unknot **1**, trefoil **3**, figure-8 **5** — equal to the Tabulator's combinatorial
  `knotDeterminant(diagramCode())`. Two disjoint roads, one integer.
- **b — ENTROPY MONOTONICITY.** On 3-strand braid closures, P(knot) climbs from **0**
  at A=0 to **≈0.69** at A=80 over a fixed 200-seed battery, gap ≥0.6 with
  **non-overlapping** Wilson 95% intervals ([0,0.019] vs [0.623,0.750]); the P-vs-A row
  is non-decreasing (τ=0.05).
- **c — NEG-CONTROL.** The A=0 cohort is 100% the unknot (det≡1, P=0). Entropy needs
  room to act.
- **bridge — INTEGRITY.** On every reference diagram `geomToGauss` is realizable, each
  crossing id appears exactly twice, and the token count == the raw segment-crossing
  count.
- **teeth.** A crossing-COUNT fake calls a disguised unknot (4 projected crossings,
  |Δ|=1) "KNOTTED"; a constant-P fake fails the monotonicity. The claims are not vacuous.
- **replay.** The clock-free sim replays byte-identical under a fixed seed + schedule.

## Registration
- 4th card added to `sewing-room/index.html` (glyph 🧶, kind "topology · entropy · the
  knot determinant", a self-test ✓ proof span); the landing self-test bumped to count
  **4** benches with the new exact-href + claim-text checks; lede/footer corrected
  "Three → Four". The bench topbar back-links the Sewing Room and sib-links the
  Tabulator + Unknotting Bench.

## Status
`node tangle-bench/tangle-core.test.mjs` → **31/31 ALL GREEN** (byte-twin identical,
replay byte-identical). In-page pill **6/6 ✓**.
