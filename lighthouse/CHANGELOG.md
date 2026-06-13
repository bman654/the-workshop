# The Lighthouse — CHANGELOG

A live optical bench for the **Fresnel lens**: how a thick converging lens can be
*collapsed* into concentric rings of prism, keeping the focus but losing the bulk —
the innovation that let a lighthouse throw a beam for miles. Belongs to the Hall of
Mirrors optics wing (Rainbow, Spyglass, Spectroscope, Polariser, …).

## What it is

A single self-contained `index.html` (no build, no libraries, no network, no external
assets). Vanilla HTML/CSS/JS, inline `<canvas>` render. ~876 lines.

### The physics (real, not faked)

- **Parent lens → Fresnel lens.** An ideal converging lens of focal length `f` is divided
  into `N` concentric annular **zones**. Each zone becomes a thin **prism facet** whose
  slope bends a horizontal incoming ray to the common focus `F = (f, 0)`. The wasted bulk
  glass between facets is removed — the lens collapses to a flat saw-tooth sheet.
- **Exact Snell's law facet solver.** For each zone at radius `r` the facet (slope) angle
  is found by **vector Snell's law** at the slanted front facet and the flat back surface
  (glass index `n`), root-found (bisection) so the traced ray passes through `F` to machine
  precision. **No thin-prism / small-angle approximation anywhere** — the front-facet normal
  is `(-cos a, +sin a)`, the back is flat (`+x`), and the ray is traced air→glass→air.
- **Reciprocity → the lighthouse beam.** A point source at `F` exits each zone **collimated**
  (a parallel beam) — that's how a lighthouse uses it. Lighthouse mode places a lamp at `F`,
  the Fresnel lens collimates it into a warm-gold parallel beam, and a Rotate control sweeps it.

### Controls

- Focal length `f` (1.2–3.6 m), rings `N` (4–24 — the sheet gets finer as N rises),
  glass index `n` (1.40–1.70).
- View toggle: **Parent lens ↔ Fresnel ↔ Lighthouse**.
- Lighthouse Rotate toggle (auto-suppressed under `prefers-reduced-motion`).
- Three cosmetic skins (Estate / Amber / Slate) — purely colour, never geometry.

## Self-test (built-in, visible chip + click-to-expand detail panel)

All checks traced by exact Snell's law. **5 / 5 PASS** (browser, f=2.2, n=1.49, aperture 1.6):

| Check | Result |
|---|---|
| **Focus convergence** — every zone bends a parallel ray through F (400 radii × 2 halves) | **max miss 9.99e-16 m** (≈ float epsilon; tol < 1e-9) |
| **Reciprocity** — source at F exits each zone collimated (200 radii) | **max exit angle 0.00e+0 rad** |
| **Equivalence** — Fresnel focal length == intended f; lensmaker R=(n−1)f reported | **f_eff 2.200000000 m** (err 2.2e-15; R=1.078) |
| **Determinism** — geometry is a pure function of (f,N,n); recompute is bit-identical | 12 facets bit-identical |
| **Falsifiable** — a 1e-6 rad facet error breaks focus beyond tolerance | perturbed miss 1.21e-6 m (> 1e-9 tol) |

The falsifiability check proves the suite actually constrains the geometry: perturbing a
single facet by one microradian fails the focus tolerance by ~1000×.

## Verification (real browser, agent-browser)

- Screenshots: parent lens, Fresnel (rings + rays → F), lighthouse beam, N=22 fine rings,
  mobile-380. Saved under `/tmp/lighthouse/`.
- **Console clean** — 0 errors after exercising every control (mode + skin switches, self-test).
- **60.0 fps** in rotating lighthouse mode (avg 16.67 ms/frame, max 16.80 ms).
- **Mobile 380px** — no horizontal overflow (docW == winW == 380), controls usable.
- **`prefers-reduced-motion`** respected — `beamAngle` is gated on `state.rotate && !reduceMotion`;
  boot disables rotation under reduced-motion (verified equivalent to the working Rotate-off path).
- **Back-links** — `← workshop` → `../index.html`, `← Hall of Mirrors` → `../hall-of-mirrors/index.html`.
- Breadcrumb `ws:seen:lighthouse=1` set on load (try/catch). **No feat flags touched** — this is a
  study bench, not one of the 9 feats.

## Notes / caveats

- The on-screen saw-tooth facet *depth* is a cosmetic exaggeration (the real sheet is thin);
  the facet *slope angles* drawn are the exact solved geometry. Skins only set colours.
- The parent-lens biconvex silhouette is illustrative shape; its rays are drawn as the ideal
  converging bundle (a perfect lens has no aberration either), consistent with the Fresnel build.
