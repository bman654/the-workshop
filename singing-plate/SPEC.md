# The Singing Plate — SPEC

*A Chladni vibration bench that **solves** the plate eigenproblem.*

The third piece in the workshop's wave-physics trilogy on the Workbench's "Toys &
benches" shelf — **Caustic** (optics / ray-tracing), **Ripple** (traveling-wave
superposition), and now the **Plate** (the standing-wave eigenproblem). It is the
first piece in the workshop to discretize a differential operator and compute its
spectrum: a genuine sparse spectral solver, not an animation of a stored formula.

---

## §0 — THE CRUX (the one claim everything else serves)

A real vibrating plate, driven at a resonant frequency, makes scattered sand flee
the shaking **antinodes** and pile on the still **nodal lines** — the *Chladni
figures*. This bench does not replay a known pattern. It:

1. **Discretizes the operator.** It builds the sparse, symmetric discrete
   negative-Laplacian **−Δ** (the 5-point stencil, scaled by 1/h²) over the
   plate's masked shape — a square or an inscribed circular drum — with either a
   **clamped** (Dirichlet u=0 outside) or **free** (Neumann ∂u/∂n=0, reflective)
   boundary.

2. **Solves the eigenproblem.** It finds the low end of the spectrum of that
   operator — **−Δu = λu** — with a from-scratch, **deterministic, seeded
   Rayleigh–Ritz Lanczos** eigensolver (full re-orthogonalization → a dense
   projected matrix H = QᵀLQ → cyclic-Jacobi diagonalization → Ritz pairs lifted
   back). No external dependencies. The eigenvectors are the standing **modes**;
   √λ are the **eigenfrequencies**.

3. **Proves it.** A headless Node harness (`tools/plate/plate.test.cjs`) and an
   in-page green chip — **calling the SAME core, never a copy** — assert the
   computed eigenfrequencies match the closed forms: the square's
   λ = π²(p²+q²) and the circular drum's λ = (j_{m,k}/R)² (Bessel-zero ratios).

4. **Scatters the sand.** Seeded grains advance each frame by
   **Δxy = −η·∇(u²) + jitter·|u|·noise** — pushed down the u²-gradient (off the
   antinodes) and shaken in proportion to |u| (hard at the antinodes, still at the
   nodes) — so they accumulate on the nodal lines. The figure you watch IS the
   solved eigenvector's zero set.

**Distinct from the Strange Garden's `chladni.html`** (verified): that piece is a
watch-only animation of a *hardcoded* closed form
`cos(mπx)cos(nπy) − cos(nπx)cos(mπy)` with **zero eigensolver**. This bench
numerically **solves** the eigenproblem for arbitrary masked shapes and boundary
conditions, then proves the spectrum — a fundamentally different machine.

---

## The core (`tools/plate/plate.js`) — pure, DOM-free, deterministic

A dual-use IIFE attaching a `Plate` global (and `module.exports = Plate` under
Node; forge strips that guard when inlining into the page). Byte-identical module
idiom to `tools/ws/ws.js`.

| Function | What it does |
|---|---|
| `buildMask(shape, N)` | interior grid of a square / inscribed unit-disk on an N×N lattice (h = 1/(N−1)); returns `{N,h,inside,idx,n,cells}` |
| `buildOperator(mask, boundary)` | sparse symmetric −Δ (5-point); Dirichlet for `'clamped'`, reflective Neumann for `'free'`; exposes `mul(x)`, `maxAsymmetry()` |
| `buildBiharmonic(mask)` | **(labelled stretch)** the 4th-order plate operator Δ² as L∘L — experimental, no analytic check, never required to ship |
| `lanczos(op, K, seed[,opts])` | seeded Rayleigh–Ritz Lanczos → the smallest K eigenpairs ascending, `{vals,vecs,m}` |
| `jacobiEig(A, m)` | dense symmetric cyclic-Jacobi (diagonalizes the small projected H) |
| `freq` / `eigfreqs` / `nearestMode` | √λ readouts + nearest-eigenfrequency lookup (the resonance snap) |
| `modeField(eig, mask, k)` | mode k lifted onto the full N×N grid (0 outside) + min/max |
| `nodalFingerprint(eig, k)` | rounded sign-pattern (−/0/+) FNV hash of a mode — the determinism/skin-invariance witness |
| `makeGrains` / `stepGrains` / `accumulate` / `settleDensity` | the seeded sand sim + a node/antinode density-contrast metric |
| `solve(state)` | one-call: mask + operator + eigenpairs for `{shape,boundary,gridN,K,seed,operator?}` |

### A documented, honest property: degeneracy
A single-start Lanczos builds its Krylov space from one random vector, so for an
*exactly degenerate* eigenvalue (e.g. the square's (2,1)/(1,2) pair, both λ=5π²)
it recovers **one** representative — the second copy is orthogonal to the whole
Krylov sequence. The returned `vals` is therefore the ascending list of **distinct**
eigenvalues (each resonance once): π²·{2,5,8,10,13,…} for the square, and
(j_{m,k}/R)² over ascending Bessel zeros for the disk. This is the physically
meaningful spectrum and is exactly what the self-test verifies.

---

## The self-test (`tools/plate/plate.test.cjs` + the in-page chip) — 5 claims

- **A — square convergence.** The 5 lowest *distinct* eigenvalues track
  π²·{2,5,8,10,13}, and the error **shrinks as the grid refines** (24→44) — the
  hallmark of a real discretization, not a tuned constant.
- **B — circle Bessel ratios.** The fundamental matches (j₀,₁/R)², the first three
  distinct modes track (j₀,₁, j₁,₁, j₂,₁)/R², and the **scale-free** ratio λ₂/λ₁
  matches (j₁,₁/j₀,₁)² — the cleanest possible proof we solved the real drum.
- **C — orthonormality + symmetry.** Gram(V) ≈ I to ~1e-15, max|L−Lᵀ| = 0 exactly,
  and the eigen-residual ‖Lv − λv‖ ≈ 0 (genuine eigenpairs).
- **D — sand on nodes.** After settling, mean grain density over near-nodal cells
  is ≥ 3× the density over antinodal cells (both shapes).
- **E — determinism + skin-invariance.** Same seed → byte-identical `eigfreqs[]` +
  `nodalFingerprint`; all 3 skins produce identical spectra/figures (the core
  never sees a skin); the boundary toggle genuinely changes the spectrum (free has
  a ~zero constant mode, clamped does not).

`node tools/plate/plate.test.cjs` → **18/18 PASS, exit 0**. (It runs ~a dozen
genuine sparse eigensolves — real spectral work, a few seconds, no shortcuts.) The
in-page chip runs a compact 8-check version of the same claims via the same core
and reads **"plate verified — 8/8 ✓"**.

---

## The page (`singing-plate/index.html`, forged from `index.src.html`)

Frosted-sidebar chrome matching Caustic / Ripple. Controls:

- **shape** toggle (square ⇄ circular drum)
- **boundary** toggle (clamped ⇄ free)
- **mode** ◀ index ▶ with a live eigenfrequency + λ readout
- a small **spectrum strip** (bars at each √λ; lit current mode; click to jump)
- **find resonance**: a drive-frequency sweep that **snaps to the nearest
  eigenfrequency** (off-resonance → "the plate stays quiet"; on → "rings")
- **grain count**, **amplitude**, ▶/⏸, **re-scatter**
- **3 skins** — *Lab* (amber sand on slate) · *Schlieren* (monochrome) ·
  *Blueprint* (cyan) — **palette-only, geometry-identical** by construction
- **2× PNG export** (canvas-native, captioned, never tainted)
- `← workshop` back-link · an in-page green **self-test chip**

**No audio** (courtesy on a shared work laptop). Reduced-motion: pauses and settles
the figure statically (no animation). Records `ws:seen:singing-plate` at parse time.

---

## House rules honored
Zero-dependency, single-file shipped artifact, relative links, dark-drafting
aesthetic. The math lives in exactly one place (`tools/plate/plate.js`), inlined by
forge and exercised identically by the Node test and the in-page chip.
