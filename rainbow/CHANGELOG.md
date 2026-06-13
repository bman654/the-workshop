# The Rainbow — CHANGELOG

A single self-contained `index.html` for the Hall of Mirrors optics wing.
Vanilla HTML/CSS/JS, zero dependencies, no network/assets. Derives the rainbow
from first principles: parallel sunlight traced through a spherical water drop.

## What it does

- **Single-drop view** — a magnified droplet showing the incoming parallel ray
  fan, refraction in / k internal reflection(s) / refraction out, and the
  emergent rays bunching at the angle of minimum deviation (the caustic). The
  rainbow ray is drawn in true wavelength colours so dispersion is visible. A
  live **D(b) plot** marks the minimum (the Descartes ray). Drag on the view or
  use the slider to set the impact parameter b; a sweep animation walks b.
- **Sky view** — the observer's antisolar point with the full circular
  **primary (≈42°)** and **secondary (≈51°)** bows at their correct angular
  radii, true colour ordering (red outermost on the primary, reversed on the
  secondary), **Alexander's dark band** shaded between them, sky/ground, and a
  **sun-elevation slider** that lifts/sinks the arc relative to the horizon.
- **Supernumerary arcs** toggle (faint Airy-style arcs just inside the primary).
- Three cosmetic **skins** (Estate / Slate / Dusk) — recolour only.
- **PNG ×2** export of both stacked views.
- Drops the `ws:seen:rainbow` localStorage breadcrumb on load.

## Physics

All angles derive from Snell's law + the deviation formula — nothing is baked:

- `sin i = b`, `sin i = n·sin r` (Snell).
- `D_k(i) = 2(i − r) + k·(π − 2r)`.
- D_min found by **numerically minimising** `D_k` over b (coarse scan + golden
  section refine), then bow radius = `|180° − D_min|`.
- `n(λ)` is a Cauchy fit for water, `n = A + B/λ²`, anchored to
  n(400nm)=1.3440 (violet) and n(700nm)=1.3310 (red).
- Colours are a true **wavelength→sRGB** piecewise map (Bruton), not a
  hand-picked gradient.

## Self-test (proves the physics — 9/9)

The headless `runSelfTest()` (also exported for Node) asserts:

1. Snell `sin i = n·sin r` across all b (maxErr ~2e-16).
2. The rainbow ray is a true stationary point (dD/db≈0) and a minimum (curv>0).
3. **Primary bow radius (mid λ) = 42.00°** (target 42.0 ± 0.3°).
4. **Secondary bow radius (mid λ) = 51.04°** (target 51 ± 0.5°).
5. Primary dispersion ordering: red radius (42.37°) > violet radius (40.51°).
6. n(λ) monotone decreasing across the visible band.
7. Alexander's band (43–50°) free of any primary/secondary caustic for every
   visible λ.
8. The independent **geometric drop trace** reproduces the deviation formula for
   the primary (maxErr 0.0) — the rendered ray geometry IS the closed-form physics.
9. Bow geometry is **skin-invariant** (the physics takes no skin argument).

## Verification

- Self-test extracted and run under Node: **9/9 PASS**.
- Browser-verified (agent-browser, session `hom-rainbow`, viewport 1400×1000):
  self-test chip green **9/9 ✓**, zero console errors/warnings (in-page
  console.error/warn capture during the test returned empty), both views render,
  the sky shows the 42°/51° double bow with the dark band between, and
  interactions (b drag/slider, k=1↔2, sun elevation, skins, toggles) all work.
  Switching skins left the computed radii byte-identical.
