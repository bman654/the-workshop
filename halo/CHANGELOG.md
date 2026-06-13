# The Halo — Changelog

Atmospheric ice-crystal optics for the Hall of Mirrors — the rainbow's frozen twin.

## v1 — initial build

- **Two linked views**, single self-contained zero-dependency HTML file.
  - *Single ice crystal*: a magnified hexagonal crystal with the active 60°/90°
    refracting wedge highlighted, the selected ray traced through it, true-colour
    minimum-deviation rays showing dispersion, and a live D(i) plot marking the
    minimum-deviation (halo) ray.
  - *Sky*: sun at adjustable elevation with the 22° halo, 46° halo, sundogs
    (parhelia), circumzenithal arc, and parhelic circle drawn at their correct
    angular positions. Coloured where the phenomenon is coloured (true
    wavelength→sRGB), white where it is white.
- **Physics from first principles** — Snell's law through a prism of apex angle A,
  `D(i₁) = i₁ + i₂ − A`, minimised numerically over incidence (no baked angles).
  - n_ice(λ): Cauchy fit, n(400nm)=1.317, n(700nm)=1.307 (mid ≈ 1.309).
  - Sundog separation uses the Fraser effective-index model
    `n_eff = √(n² − sin²e)/cos e` so parhelia drift outward as the sun rises.
  - Circumzenithal arc gated by the top-face→side-face TIR cutoff (~32.4°).
- **Self-test: 10/10 ✓** (green chip + console). Proves, among others:
  22° halo = 21.76° (21.8 ± 0.3), 46° halo = 45.52° (45.7 ± 0.5), red edge inside
  blue (correct dispersion sign), sundog ≈22° at low sun and increasing with
  elevation, CZA cutoff ≈32.4° (~32.2 target), geometric ray trace == prism
  formula (maxErr ~1e-16), and skin-invariance of all geometry.
- Sun-elevation slider; per-phenomenon toggles; incidence slider + drag-on-crystal;
  ray-fan and incidence-sweep animation; recolour-only skins (Estate / Slate /
  Frost — geometry asserted skin-invariant); 2× PNG export.
- Clean console, 60fps. Topbar links to the Workshop and Hall of Mirrors; drops the
  `ws:seen:halo` breadcrumb on load.
