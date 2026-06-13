# The Spectroscope — CHANGELOG

A single-file, zero-dependency optics bench for the Hall of Mirrors wing. It
disperses white light two ways and reads the real line spectra of six sources.

## What was built

- **Two dispersing elements (switchable):**
  - **Prism** — Cauchy dispersion `n(λ) = A + B/λ²` of crown-glass (n≈1.5167 @ 589 nm).
    A continuous spectrum is fanned out of the exit face using real **minimum-deviation**
    geometry (`Dmin = 2·asin(n·sin(A/2)) − A`), so violet (higher n) bends most and red
    least — correctly ordered. Apex angle is adjustable 30–75°. Snell is applied at both
    faces in the physics core (`prismDeviation`).
  - **Diffraction grating** — the grating equation `d·sinθ_m = m·λ`. Renders the m=0
    undispersed beam plus ±1, ±2 orders fanned by wavelength; higher orders spread wider
    and visibly overlap. Lines/mm adjustable 100–1200.
- **Six sources**, read as line/continuous spectra with every line at its TRUE colour:
  - **Continuous** — smooth rainbow band.
  - **Hydrogen (Balmer)** — Hα/Hβ/Hγ/Hδ **computed live** from the Rydberg formula
    `1/λ = R_H(1/4 − 1/n²)`, n=3..6 (not hard-coded).
  - **Sodium** — D doublet 589.0 / 589.6 nm.
  - **Mercury** — 404.7 / 435.8 / 546.1 / 577.0 / 579.1 nm.
  - **Neon** — a cluster of strong reds/oranges (585–693 nm).
  - **Solar (Fraunhofer)** — continuous band crossed by DARK lines at Ca-K 393.4, Ca-H
    396.8, H 410.2/434.0/486.1/656.3, Mg-b 517.0, Na-D 589.0 nm.
- Wavelength axis (nm) under the spectrum with tick labels; named lines are labelled.
- **wavelength→sRGB** via a multi-lobe Gaussian fit to the CIE 1931 colour-matching
  functions → XYZ → linear sRGB (D65) → gamma. Returns black outside ~[380,750] nm.
- 2× PNG export; three cosmetic recolour-only skins (Brass / Cobalt / Noir); breadcrumb
  `ws:seen:spectroscope`; topbar links to `../index.html` and `../hall-of-mirrors/index.html`.

## Physics note — Rydberg constant & air vs. vacuum

The brief's constant `1.0973731568e7` is **R∞** (infinite nuclear mass). Using it raw
gives Hα = 656.11 nm, ~0.19 nm short of the literature 656.3 — failing the 0.1 nm bar.
The correct hydrogen value is the **reduced-mass-corrected** `R_H = R∞·M_p/(M_p+m_e)`
(≈ 1.09677583e7, computed in code, not hard-coded). That yields the **vacuum** Balmer
wavelengths (Hα = 656.29 nm — matching real vacuum hydrogen). The textbook reference
values 656.3/486.1/434.0/410.2 are **air** wavelengths, so the self-test compares the
computed **air** wavelengths (`vacuum λ / n_air`, n_air = 1.000277). Result: Hα = 656.29 nm
(air) vs 656.3, max error 0.053 nm across the four lines. Displayed line spectra use air
wavelengths so all sources are on the same (air) footing.

## Self-test (proves the physics) — 7/7 ✓

1. **Balmer** lines from Rydberg < 0.1 nm vs literature (computed, not hard-coded). Hα 656.29 (air) vs 656.3; max err 0.053 nm.
2. **Grating** `d·sinθ = m·λ` exact (residual ≤ 1e-9·d over random λ/m) AND higher orders more dispersed (`|dθ/dλ|` rises with m).
3. **Prism** Snell holds at both faces and `r1+r2=A` (≤ 1e-9) over random angles/indices.
4. **Prism** dispersion sign: violet deviates more than red (n(λ) decreasing with λ).
5. **Prism** minimum-deviation symmetry: at the symmetric incidence i1==i2, r1==r2, and D==Dmin (≤ 1e-9).
6. **wavelength→RGB** returns black outside [380,750], in-gamut/sane inside, correct hue ordering (red R-dominant, blue B-dominant, green G-dominant).
7. **Sources** integrity: hydrogen lines equal the computed Balmer set; Na doublet split = 0.6 nm; all listed lines fall in [380,750].

The chip in the topbar shows `checking…` → `7/7 ✓` (green); the summary is logged to console.

## How it was verified

- **Headless (Node):** extracted the pure physics core (no DOM) and ran `runSelfTest()` → 7/7.
- **Browser (agent-browser, session `hom-spectroscope`):** loaded
  `http://localhost:8103/spectroscope/index.html?v=1`.
  - Chip GREEN `7/7 ✓`.
  - Console: zero warnings, zero uncaught exceptions, zero page-originated errors. (The
    only network 404 is the browser's automatic `/favicon.ico` probe — shared by every
    workshop piece, none of which declares a favicon; not page-initiated.)
  - Rendered & screenshot-checked: prism dispersion (correctly-ordered rainbow), grating
    orders (m=0, ±1, ±2 fanned, higher orders overlapping), hydrogen Balmer emission
    (four lines at correct nm/colour), solar Fraunhofer dark lines on a continuous band.
  - Confirmed **0 requestAnimationFrame callbacks/sec when idle** — the scene is purely
    event-driven (redraw on change only), so 60fps is trivially met with no idle cost.
  - PNG export and apex/grating sliders exercised without errors.
