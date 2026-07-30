# The Northern Light — CHANGELOG

## born, 2026-07-30 — the colour is a clock

`lodestone-hall/the-northern-light/` — the Lodestone Hall's field, at planetary scale.
A frozen plain at two in the morning, spruce on the skyline, and a curtain in the sky
you can stand under, look straight up into, or step 790 km east of and read edge-on
against a ruler in kilometres.

Grep-confirmed absent before this: nothing in 485 pieces was about the aurora, or about
the magnetosphere, or about forbidden transitions, or about quenching.

### The one thing the room is about

**An excited atom is a stopwatch.** It holds its photon for a characteristic time; if a
collision reaches it first the energy goes to heat and no light is made. Atomic oxygen
has two states whose lifetimes differ by a factor of 155:

* **O(¹S) → 557.7 nm**, τ = 0.75 s — half-quenched at **85 km**
* **O(¹D) → 630.0 nm**, τ = 117 s — half-quenched at **295 km**, and only 6% of
  excitations survive at 200 km

So the red can only shine where nothing will touch it for two minutes and the green
lives all the way down to where the electrons stop. **The same number decides how fast
each colour can move**: green tracks a flickering ray, red is a slow ghost. One
lifetime, two visible consequences — where the colour lives, and how fast it can change.

### What is running

* **A per-species atmosphere.** Diffusive equilibrium for N₂, O₂ and O, integrated by
  RK4 through a Bates temperature profile from 120 km anchors; mixed air below the
  turbopause with the standard atomic-oxygen bulge near 97 km. Compared **out of sample**
  against the US Standard Atmosphere 1976 mass-density column from 100 to 500 km: worst
  error **9.9%** over five decades, and nothing above the anchor was fitted to it. The
  exospheric temperature is a dial (700–1300 K) and it moves 300 km density by ×6.
* **A dissipation function derived, not fitted.** Range-energy law + continuous slowing
  down + an isotropic pitch-angle distribution inside the loss cone gives
  `Λ(x) = (2x/n)∫ₓ¹ (1−v)^(−(n−1)/n) v^(−2) dv`, and swapping the order of integration
  proves `∫₀¹Λ dx = 1` **exactly**. The quadrature honours it to 2 parts in 10⁷. The
  singular inner integral is killed by two exact substitutions, one at each end.
* **Four emissions with their real lifetimes**, integrated as first-order kinetics at
  every kilometre of the column, so the picture lags the beam by exactly what the
  chemistry says and by nothing else.
* **The estate's own CIE 1931 observer** (`tools/spectrum/wavelength.mjs`) and sRGB
  matrix (`tools/blackbody/core.mjs`), fed a line spectrum with the hc/λ weighting that
  turns a photon count into a radiance. 557.7 nm lands at (0.360, 0.637) — a *yellow*
  green — and needs 14% desaturation to fit inside sRGB. The page prints that number.
* **A second observer: your dark-adapted eye.** Cones supply the hue, rods add
  achromatic light, and the mix follows the scene's own luminance. A kilorayleigh is
  1.9e−4 cd/m², dimmer than the moonless night sky, so most auroras are barely coloured
  at all to a person — and 630.0 nm is worth a tenth to a rod what it is to a camera.
  That is the whole answer to "why is my photograph redder than my memory".

### The thing that was wrong first, and the fix

The first build targeted the green line at **atomic oxygen**, which is nine tenths of the
air above 200 km — so the green climbed with altitude and the entire sky came out an even
yellow. The green line is not made out of oxygen alone: most auroral O(¹S) arrives by the
**Barth mechanism**, N₂(A) handing its energy to an O atom, so the production follows the
**nitrogen** fraction, which collapses above 200 km. Changing one field gives the green a
ceiling and lets the red float clear above it. Nothing else was tuned. The twin now holds
that in place: green at 300 km must be under a thousandth of its peak.

### The twin — `node lodestone-hall/the-northern-light/aurora.test.mjs`, 55 checks, green

Including two tests worth naming:

* **The stopping altitudes must be WRONG, in the right direction.** This room models no
  backscatter and no angular diffusion, and both push deposition *upward*, so its peaks
  must land below the published Rees curve at every energy — which is a far sharper
  statement than "close to it". They do: 157/180, 121/140, 105/110, 94/95 km.
* **The Arrhenius factor is load-bearing.** O(¹S)+O₂ is 4.0e−12·exp(−865/T); using the
  room-temperature value at the 187 K mesopause moves the green line's floor 25 km. The
  test plants the wrong rate and measures the difference.

### Verified in a real browser

Served on :8841, session `nl-verify-8841`, torn down. Real input-level events only
(`tools/cdp/pointer.mjs`): the dials, the four views, the eye/camera toggle, the substorm,
and a genuine pointer drag that moved yaw and pitch. **The time claim was measured in the
running page, not just in the twin** — a `columns()` hook reads the live emission the
renderer is drawing from, and strobing the beam at 1.2 Hz gives a violet column swinging
by ×25, a green column by 59%, and a red column by 17%.
