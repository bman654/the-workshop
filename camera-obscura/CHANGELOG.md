# The Camera Obscura — Changelog

## v1 — initial build
The oldest optical instrument, laid open as a cross-section ray diagram with a live
projected image. A dark room with a single **pinhole** projects an **inverted, left–right
reversed** image of the scene onto the back wall.

### Physics (pure core, no DOM — the self-test calls these same functions)
- **Magnification** `m = v/u`; **image height** `H·v/u`.
- **Inversion** via `projectPoint(yObj,u,v) = −(v/u)·yObj` — a point above the axis lands
  below it; the chief rays from object top & bottom cross **exactly at the pinhole**.
- **Sharpness tradeoff:**
  - Geometric blur `B_geo = d·(u+v)/u` (∝ d, → d for a distant scene).
  - Diffraction blur `B_diff = 2.44·λ·v/d` (∝ 1/d, Airy).
  - Total `B = √(B_geo² + B_diff²)`.
- **Optimal pinhole — exact minimiser of the quadrature total:**
  `d_opt = √(2.44·λ·v · u/(u+v))`. The textbook **√(2.44·λ·v)** rule (Rayleigh) is its
  distant-scene limit (u→∞); shown alongside as the rule of thumb. (The naive √(2.44λv)
  is ~2–17% high for finite scene distance — the build originally hard-coded it and the
  self-test caught the discrepancy; fixed to the exact form.)
- Projected image is rendered by **convolving** a 1-D scene brightness profile with a
  normalised (energy-conserving) tent kernel sized by the current total blur, then
  inverted onto the wall — so the sweet spot is visibly crisp, big holes blur, tiny holes
  go diffraction-soft.

### Self-test (10/10, computed not hard-coded)
1. `m == v/u` ≤1e-9 over a u,v sweep.
2. image height `== H·v/u` ≤1e-9.
3. image inverted (sign flip), ratio `== −v/u` ≤1e-9.
4. chief rays from top & bottom cross at the pinhole (y==0) ≤1e-9.
5. `B_geo ∝ d` and `B_diff ∝ 1/d` ≤1e-9.
6. **headline:** analytic `d_opt = √(2.44λv·u/(u+v))` == numeric golden-section argmin of
   the real `blurTotal(d)` curve to ≤1e-6 (actual ~1.7e-8).
7. classic √(2.44λv) is the u→∞ limit of d_opt; exact d_opt ≤ it for finite u.
8. `blur(d_opt) ≤ blur(0.5·d_opt)` and `≤ blur(2·d_opt)` — a true minimum.
9. blur convolution conserves energy, lowers the peak as it widens, δ-kernel is identity.
10. geometry & blur identical across cosmetic skins (the model reads no style).

### UI
- Sliders: hole ⌀ d, image depth v, scene distance u, object height H, wavelength λ.
- "Snap to d_opt" button; blur-vs-diameter inset plot with the optimum marked (geo/diff/total
  curves, current-d marker, classic-rule tick).
- Three recolour-only skins (parchment / blueprint / ink) — geometry is skin-invariant.
- PNG ×2 export; clean console; green self-test chip.
