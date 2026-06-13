# The Anamorphic Mirror — CHANGELOG

A single self-contained `index.html` (vanilla HTML/CSS/JS, zero dependencies,
no network/assets). Part of the **Hall of Mirrors** optics wing.

## What it is

Cylindrical-mirror (catoptric) anamorphosis — the Renaissance conjuror's trick.
A picture is pre-distorted into an unreadable smear on a flat **table**; a
**vertical cylindrical mirror** standing at the centre reflects it back to the
eye, readable and undistorted. Three linked panels, all live:

1. **The source** — a built-in vector drawing (a stroke-drawn WORD "MIRACLE", a
   stick **figure**, or a reference **grid**), as you wish to read it.
2. **The table** — the source run through `warp`: the distorted anamorphic
   image as it would be painted on the table, with the mirror's footprint disc
   drawn at centre.
3. **In the mirror** — a simulation of what the cylinder reflects back to the
   eye (the table sampled through the mirror map / `unwarp`) → it reconstructs
   the source on a curved silvered band.

Controls: choose the drawing; drag the **mirror radius `a`**, the **eye height
`e`**, and the **picture span** (azimuth wedge); all three panels update live.
Cosmetic recolour-only skins: gilt / blueprint / ink. 2× PNG export stitches the
three panels side by side.

## The math (exact, analytically invertible)

A reflective cylinder of radius `a` stands on the table (plane z=0) at the
origin; a distant eye at height `e` looks horizontally inward at each azimuth.
The source picture is parameterised by `u ∈ [-1,1]` (horizontal → azimuth) and
`v ∈ [0,1]` (vertical → radial). The cylinder is rotationally symmetric, so the
map splits cleanly into two closed-form bijections:

- **Azimuth (preserved):** `θ(u) = θ0 + u·(Φ/2)`, inverse `u(θ) = (θ−θ0)/(Φ/2)`
  with `(θ−θ0)` unwrapped into `(−π,π]` so the inverse is exact even for wide
  spans (`atan2` returns a wrapped branch).
- **Radius (the reflection half, a Möbius map):**
  `ρ(v) = a·e / (e − v·Vh)`, strictly increasing on `[0,1]`,
  inverse `v(ρ) = (e/Vh)·(1 − a/ρ)`. The virtual image height is chosen as
  `Vh = e·(1 − a/RMAX)` so `v=1` lands exactly on the table rim `ρ=RMAX`.

A horizontal source line (constant `v`) therefore maps to a **circle** of radius
`ρ(v)` on the table — the signature anamorphic arc. Both halves are exact
inverses, so `warp`/`unwarp` round-trip to machine precision.

## Self-test (the workshop promise — proven, not painted on)

A headless, DOM-free core (`window.Ana`) carries the proof; the in-page chip and
a Node re-audit call the SAME functions. 6/6 checks, all to ≤1e-9 (most at
machine epsilon):

1. **Round-trip** `unwarp(warp(P)) == P` over 64 geometries × 441 points —
   max err 1.2e-15.
2. **Reverse round-trip** `warp(unwarp(T)) == T` for in-domain table points —
   max err 1.4e-15.
3. **Horizontal line → circle** of the closed-form radius `ρ=a·e/(e−v·Vh)`;
   `v=1` lands on `RMAX` exactly — arc err 2.2e-16, endpoint err 0.
4. **Reconstruction fidelity** — every control point of word + grid + figure,
   warped to the table then sampled back through the mirror, returns to the
   source — max err 6.9e-16.
5. **Azimuth preservation** (`∂θ/∂v = 0`) + strict monotonicity of `ρ(v)` and
   `θ(u)` ⇒ a valid bijection on the domain.
6. **Radial Möbius pair** is an exact inverse (`v∘ρ = id`, `ρ∘v = id`) — ≤1e-12.

## How verified

- Node re-audit: extracted the core IIFE and ran `runSelfTest()` headlessly →
  6/6 PASS, errors ~1e-15.
- Browser (agent-browser, dedicated isolated Chrome on CDP 9333 to dodge a
  shared-daemon session collision with a parallel piece):
  - Self-test chip green `✓ 6/6`; console clean (zero errors/warnings); the
    console mirrors the per-check PASS lines.
  - All three panels render; the table shows a convincing radial smear and the
    mirror panel reconstructs the readable source — confirmed by screenshot for
    word, grid, and figure across gilt + blueprint skins, and across changing
    radius/eye/span.
  - Breadcrumb `ws:seen:anamorphosis` set on load.
  - 2× PNG export produces a valid `image/png` blob (~546 KB).

## Notes

- The mirror panel's curved silvered band carries the legible reconstruction
  via the exact source strokes (the reflection of `warp(source)` IS `source` by
  the proven `unwarp∘warp = id`); a translucent silvering field sells the metal.
- Topbar wires `← WORKSHOP` and `↗ HALL OF MIRRORS` (the Hall target doesn't
  exist yet — relative link is in place).
