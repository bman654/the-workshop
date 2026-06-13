# The Singing Plate — changelog

## 2026-06-13 — Initial build (Chladni eigenproblem bench)

Built `singing-plate/index.html` (forged from `index.src.html`) + the pure core
`tools/plate/plate.js` + the headless test `tools/plate/plate.test.cjs`. The third
piece in the wave-physics trilogy on the Workbench's "Toys & benches" shelf —
**Caustic** (optics), **Ripple** (traveling waves), and now the **Plate** (the
standing-wave eigenproblem). The workshop's first **spectral solver**: it
discretizes a differential operator and computes its spectrum.

Clearly distinct from the Strange Garden's watch-only `chladni.html` (a hardcoded
`cos(mπx)cos(nπy) − cos(nπx)cos(mπy)` animation with no eigensolver). This bench
numerically **solves** −Δu = λu for arbitrary masked shapes + boundary conditions
and proves the eigenfrequencies against the closed forms.

### What I built

- **Pure, DOM-free CORE** (`tools/plate/plate.js`, dual-use `Plate` global / Node
  module; the single source of truth for both the page and the test):
  - `buildMask(shape, N)` — interior grid of a square / inscribed unit-disk on an
    N×N lattice (h = 1/(N−1)).
  - `buildOperator(mask, boundary)` — the sparse symmetric discrete −Δ (5-point
    stencil ÷ h²); **Dirichlet** u=0 outside for `clamped`, reflective **Neumann**
    ∂u/∂n=0 (ghost folds onto the diagonal) for `free`. Exposes `mul(x)` and
    `maxAsymmetry()`.
  - `lanczos(op, K, seed)` — a from-scratch, **deterministic, seeded
    Rayleigh–Ritz Lanczos**: build the Krylov basis with full
    re-orthogonalization, form the dense projected H = QᵀLQ, diagonalize it with
    `jacobiEig` (cyclic Jacobi), lift the smallest-K Ritz pairs back to Rⁿ,
    ascending. No external dependencies.
  - `modeField`, `nodalFingerprint`, `freq`/`eigfreqs`/`nearestMode`,
    `makeGrains`/`stepGrains`/`accumulate`/`settleDensity`, and a one-call
    `solve(state)`.
  - `buildBiharmonic(mask)` — the 4th-order plate operator Δ² (L∘L) shipped as a
    clearly-**labelled experimental stretch mode** (no analytic check; the
    membrane −Δ ships as the proven default).

- **Headless self-test** (`tools/plate/plate.test.cjs`) — proves the 5 claims by
  calling the real core: (A) square eigenvalues → π²·{2,5,8,10,13} with the error
  **shrinking as the grid refines**; (B) circle fundamental ≈ (j₀,₁/R)² and the
  scale-free ratio λ₂/λ₁ = (j₁,₁/j₀,₁)²; (C) Gram(V) ≈ I + max|L−Lᵀ| = 0 + tiny
  eigen-residual; (D) sand settles on the nodes (≥ 3× density vs antinodes);
  (E) determinism + skin-invariance + a load-bearing boundary toggle.
  **18/18 PASS, exit 0.**

- **The page** — frosted-sidebar chrome matching Caustic/Ripple: shape + boundary
  toggles, a mode ◀ index ▶ stepper with a live eigenfrequency/λ readout, a
  clickable **spectrum strip** of √λ bars, a **find-resonance** drive sweep that
  snaps to the nearest eigenfrequency, grain/amplitude sliders, ▶/⏸ + re-scatter,
  3 **palette-only** skins (Lab / Schlieren / Blueprint), canvas-native **2× PNG
  export**, a `← workshop` back-link, and an in-page green self-test chip
  (**plate verified — 8/8 ✓**) computed by the same core. **No audio.**
  Reduced-motion settles the figure statically. Records `ws:seen:singing-plate`.

### Design notes / honest caveats
- **Smallest-eigenvalue resolution.** Plain Lanczos converges to the
  largest-magnitude end first; the physically interesting modes are the *smallest*
  λ. Rather than a fragile spectral fold, the solver uses Rayleigh–Ritz with a
  generous Krylov dimension (full reorth makes this cheap for these ~1–4k-DOF
  problems) and diagonalizes the dense projected operator — robust and accurate.
- **Degeneracy.** A single-start Lanczos recovers one representative of each
  exactly-degenerate eigenspace, so the spectrum is reported as the ascending
  *distinct* eigenvalues (each resonance once). Documented in the core + tested
  accordingly — this is the physically meaningful spectrum.
- **Higher radial circle modes** (j₀,₂ …, carrying a nodal *circle*) are sensitive
  to the staircase boundary and need a much finer grid; the test verifies the
  three robust low drum modes + the scale-free ratio.
- **Biharmonic plate (Δ²)** is an experimental, clearly-labelled stretch operator;
  the proven membrane (−Δ, Helmholtz/drumhead) ships as the default.
- The Node test runs ~a dozen genuine sparse eigensolves (a few seconds) — real
  spectral work, not a fixed fudge.
