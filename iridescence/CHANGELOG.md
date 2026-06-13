# Iridescence — changelog

A single self-contained `index.html` for the Hall of Mirrors optics wing.
Thin-film interference — the colours of soap bubbles, oil on a puddle and
Newton's rings — computed from real physics, never a hand-picked hue ramp.

## What it does

Three switchable modes, all coloured by the same spectral pipeline:

- **Newton's rings** — a plano-convex lens of radius of curvature `R` on a flat
  plate. Air-gap thickness `t = r²/(2R)`. In reflected light there is one π phase
  shift (at the glass-bottom reflection), so DARK rings fall at `2t = mλ`
  (`r_m = √(mRλ)`) and the CENTRE (`t = 0`) is dark. White light renders each
  wavelength's rings at its own spacing → coloured fringes; a monochromatic mode
  shows clean dark/bright rings in the chosen wavelength's hue. Sliders: radius
  of curvature, lens tilt.
- **Soap film** — a vertical film draining to a wedge: thinnest at the top
  (`t → 0` → a "Newton black" band, destructive for every λ), thicker toward the
  bottom, with the classic descending colour sequence. The drain animates, so the
  black band grows and the fringes migrate.
- **Oil slick** — a thin oil film (`n ≈ 1.45`) whose thickness varies smoothly in
  2D, giving the characteristic drifting swirls of interference colour.

Hover anywhere to read the local thickness, optical path / order, and the
reflected spectrum (a live tinted spectrum strip + colour chip). 2× PNG export,
three cosmetic recolour-only skins (Estate / Slate / Ivory), reduced-motion safe.

## The physics

- **Reflectance** `R(λ) = R0·sin²(δ/2)` with phase `δ = 4π n t cosθ′ / λ` — the
  two-beam, single-π-shift model. `sin²` (not `cos²`) bakes in the extra π so
  `t = 0` and `2t = mλ` are both dark, matching the reflected-light Newton's-rings
  bookkeeping. Snell's law gives the internal angle `cosθ′`.
- **True perceived colour:** the reflected spectrum is integrated against the
  **CIE 1931 2° colour-matching functions** (Wyman–Sloan–Shirley 2013 multi-lobe
  Gaussian analytic fit, sampled on a 380–780 nm / 5 nm grid) under a **CIE D65**
  illuminant → XYZ → linear sRGB → gamma sRGB, with a desaturate-toward-white
  gamut map. White-point normalised so a perfect reflector → white. The on-screen
  colours are the real film colours, not a gradient.

## Self-test (proves the physics — 9/9)

A headless `runSelfTest()` (callable from Node and shown in the topbar chip)
asserts computed physics against closed-form ground truth:

1. Newton dark-ring radii `r_m == √(mRλ)` and `2t == mλ` at those radii (< 1e-6).
2. Those dark rings are dark: reflectance ≈ 0 at `r_m` (< 1e-12).
3. Centre `t = 0` is a reflectance minimum for every λ; first bright at `t = λ/4`.
4. Colour pipeline calibrated: a flat spectrum under equal-energy → neutral
   chromaticity `x ≈ y ≈ 1/3` (err < 0.01); a perfect reflector under D65 lands on
   the D65 white point (0.3127, 0.3290) (err < 0.02).
5. A narrow single-wavelength spectrum → chromaticity near that λ's spectral-locus
   point (err < 0.05) for 450/520/580/620 nm.
6. Monochromatic ring radius ∝ √λ: `r_m(λ2)/r_m(λ1) == √(λ2/λ1)` (< 1e-9).
7. Reflectance is periodic in `t` with period `λ/2n`; Snell internal `cosθ′` exact.
8. Determinism / skin-invariance: same film → identical colour; `Δt` differs.

## How verified

- `runSelfTest()` extracted and run under Node → 9/9 PASS.
- Browser (agent-browser, session `hom-iridescence`, `python3 -m http.server`):
  topbar chip green "iridescence verified — 9/9 ✓"; re-running the self-test live
  in the page returned 9/9 with **zero** `console.error` calls (clean console);
  animated oil mode measured **61 fps**; 2× PNG export produces an
  `iridescence-<mode>.png` blob download.
- Visual: Newton's rings render with a dark centre and coloured fringes (white)
  / clean dark-bright rings (mono); soap film shows a dark top band then the
  descending colour sequence; oil slick shows iridescent swirls. All three modes
  switch correctly.

## Notes

- Zero dependencies, no network, no build — vanilla HTML/CSS/JS in one file.
- Breadcrumb `ws:seen:iridescence` dropped on load.
- Topbar links to `../index.html` and `../hall-of-mirrors/index.html` (the Hall
  target does not exist yet; the relative link is wired anyway).
