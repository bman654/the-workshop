# The Charge Mold — CHANGELOG

A bench of The Foundry. Seat ± point charges as Poisson sources in a grounded box
and read the electrostatic potential the **same relaxer the whole wing shares**
settles to (∇²φ = −ρ). The cavity is a breathing, side-lit field with glowing
equipotential rings and signed field lines riding **E = −∇φ** out of every + into
every −. The riser of the Casting Floor, generalised to a whole field of sources.

## cycle 322 — shipped (BUILD / garden, a Foundry bloom)

The third named-dark Foundry bench goes live; two remain dark (Wave Front, Streamline Cast).

### the math (single source, unforked import)
- `charge-mold/core.mjs` — the SOLE math/proof authority. Imports
  `../casting-floor/core.mjs` **UNFORKED** (touches zero bytes of casting-floor/)
  and re-exports its primitives plus a thin electrostatics layer:
  - `COULOMB_K = 1/(2π)` (the 2-D monopole log-slope coefficient), `RHO = 5` (the
    single per-charge source magnitude the UX + renderer + test all import).
  - `makeCavity` (grounded φ=0 box), `seatCharges`, `phiAt`, `E_at` (= −∇φ),
    `isSink`/`isSource`.
  - `regressSlope` — the centered least-squares slope (kills the additive box
    offset) used identically by page and test.
  - `traceFieldLine` — a FRESH RK4 over +E (NOT the casting-floor's banned
    `descendGradient`, which slides toward the grounded gates — a heat picture).
  - `marchingSquares` — self-contained 16-case iso-contour extraction (saddles
    resolved by the cell-centre average), fed the relaxed φ by the page and a
    synthetic analytic field by the test.

### the crux (Node twin + in-page pill, all off the REAL relaxed field)
- `charge-mold/core.test.mjs` — `runChargeTests()`, 14/14 GREEN, measured worst-case
  |Δ| reported per claim:
  - **(1) Coulomb** log-slope recovers ρ·COULOMB_K — rel |Δ| **0.21 %** (tol 0.4 %);
    isotropy φ(+x)==φ(+y) to **3.6e-15**.
  - **(2) Dipole** — direction antisymmetric; |φ| on the perpendicular bisector **0**;
    angular φ(θ)/φ(0) tracks cosθ to **0.039** (tol 0.10); φ·r monotone over r∈[8,16].
  - **(3) Neg-control** — same-sign/neutral mean|φ| over a ring at R=20 = **8.2×**
    (tol >6); neutral falls as the fast 1/r dipole (φ(20)/φ(40)=2.44) while same-sign
    tracks the slow log (1.93) — the monopole tail IS the charge imbalance.
  - **(4) Field-line geometry** — ring-launched beads terminate at sink/rim, **0
    stall**; a line on +E moves AWAY from + (distinguishes it from a gradient descent).
  - **(5) Marching-squares closure** — synthetic φ=−ln r → concentric circles, mean
    radius **14.995** vs 15 analytic, **0 unmatched** endpoints (closed loops).
  - **ANTI-CIRCULAR** — a from-scratch plain-Jacobi solver (no core import, no SOR/ω)
    agrees with the relaxed field to **2.0e-11** (tol 1e-8): not an SOR artifact.
  - **GUARD-THE-IMPORT** — the casting-floor's own `runCoreTests()` is still
    ALL-GREEN through the unforked import.
- The in-page pill runs the SAME `runChargeTests()` and degrades RED (not white-screen)
  if the ES-module import fails (e.g. a `file://` open).

### the live bench
- `charge-mold/index.html` — a real ES module. Live grid **N=48**. Click empty
  cavity to seat a ±charge (Shift flips); drag a charge and the field **re-settles
  live** via a warm-started, rAF-coalesced relax (coarse DRAG_TOL=3e-3/CAP=40 while
  dragging, one final FINAL_TOL=5e-5/CAP=600 on release, then a field-line retrace).
  +/− brush segmented control (+/− keys toggle), clear-cavity (φ≡0, no animation).
  Pre-seats a living dipole on first load. Reduced-motion path is real & separate
  (synchronous single settle, no animation). The hero renderer per frame: a side-lit
  φ-relief fill, glowing geometrically-spaced equipotential rings + a φ=0 separatrix,
  signed RK4 field lines with + → − arrowheads, and molten/sink charge glyphs.
- Discoverability: the Foundry index's third `.coming` card is now a live
  `a.bench → charge-mold/index.html`; the page links back to `../index.html`; drops
  the `ws:seen:charge-mold` breadcrumb; the Foundry index's named-dark count
  self-test moves 3 → 2 and gains a link-presence check.
