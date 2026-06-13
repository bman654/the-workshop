# The Spyglass — changelog

A telescope optical-diagram bench for the Hall of Mirrors optics wing. Single
self-contained `index.html`, vanilla HTML/CSS/JS, zero dependencies, no network.

## What it does

A live ray-traced "fargazer" showing how a telescope makes a far thing look near
(and upside-down). Two switchable instruments:

- **Keplerian refractor** — a converging objective (long f_obj) and a converging
  eyepiece (short f_eye) sharing a focal plane (tube length = f_obj + f_eye).
  Parallel rays from a distant object tilted by α form a **real, inverted**
  intermediate image at the shared focal plane; the eyepiece relays it to a
  virtual image at infinity subtending the larger angle β = M·α. Draws the
  marginal + chief rays, marks the intermediate image (inverted arrow) and the
  exit pupil, and reports **M = f_obj/f_eye** (signed negative = inverted), tube
  length, and apparent angle.
- **Newtonian reflector** — a **parabolic** primary mirror y = x²/(4f) brings the
  parallel axial bundle to a single prime focus (no spherical aberration); a flat
  45° diagonal folds the converging cone out to a side eyepiece. Draws the
  parabola, the converging cone, the diagonal fold, and the prime focus (0, f).

Beside the bench: a **naked-eye (1×)** view and the **magnified, inverted**
telescopic view of the same little sky (a moon with a crater + a double star), so
the magnification and inversion are visible at a glance. The telescopic view's
on-screen zoom is bounded for legibility (a cosmetic display choice); the labelled
magnification and the inversion are the honest M.

Controls: drag f_obj, f_eye, aperture, and object tilt α — M and every ray update
live. Three cosmetic recolour-only skins (Brass / Blueprint / Ivory). A 2× PNG
export button. Topbar links back to the Workshop and up to the Hall of Mirrors.

## Self-test — 9/9 ✓ (proves the physics is exact)

The `.selftest` chip runs a headless suite that calls the **real** physics
functions (not copies). All algebraic identities assert to ≤1e-9; the ray-trace
and parabola checks land at machine precision:

1. Parallel bundle focuses **exactly** at x = f_obj (image distance == f_obj) — err 1.1e-13
2. Gaussian lens equation 1/v − 1/u = 1/f exact for finite objects — err 8.7e-19
3. Two-ray trace meets at the predicted image point (v, mag·h) — err 1.1e-14
4. **M = f_obj/f_eye** exact (closed form over an 80-point sweep) — err 0
5. Ray-traced angular mag tan β / tan α == −f_obj/f_eye, bundle stays afocal — err 3.6e-14
6. System **inverts**: sign(M) negative for every (f_obj, f_eye)
7. **Parabola** y = x²/(4f): 24 parallel axial rays all pass through focus (0, f) — err 7.5e-14 (NO spherical aberration)
8. Contrast with teeth: a **spherical** mirror misses its paraxial focus by 134.7 px (real spherical aberration) while the parabola misses by 8.5e-14 — proving the parabola's exactness has teeth
9. Geometry identical across all skins (the trace reads no style argument)

`console.log`s the summary; chip turns green "spyglass verified — 9/9 ✓".

## How it was verified

- Headless: extracted the pure core and ran `runSelfTest()` under Node → 9/9, all
  errors at the magnitudes above.
- Browser (agent-browser, session `hom-spyglass`, http.server on :8102): chip green
  9/9, **zero console errors/warnings** after sweeping both instruments across the
  full slider ranges + all skins + reset, both instruments render with correct ray
  paths, dragging focal lengths updates M live, the magnified+inverted view is
  clearly visible (moon/crater and double-star flip between the 1× and telescopic
  views), and the 2× PNG export produces a valid 1156×1800 (2×) PNG.

## Notes

- Refractor uses paraxial thin-lens transfer written as an exact ray map
  (slope_out = slope_in − y/f), so the focal-plane and afocal identities hold to
  machine precision. The reflector uses the exact reflection law against the true
  parabola normal.
- Skins are recolour-only; check #9 (and the structural fact that no physics
  function takes a style argument) guarantees geometry is skin-invariant.
