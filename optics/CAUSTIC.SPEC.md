# Caustic — a steerable optical light-bench

*A tactile toy in the workshop's "interactive toy" vein (NOT a puzzle, NOT an arcade cabinet,
NOT a seeded visual press, NOT audio). You arrange optical elements on a dark bench and steer
beams of light; rays bend, split, reflect and focus by the real laws of geometric optics, in
real time, as you drag. Brand-new subject for the workshop: light & refraction.*

File: `optics/index.html` — single self-contained vanilla HTML/CSS/JS, **0 dependencies, 0 network, NO AUDIO.**
Home: reached from the front-door **footer** as a 4th off-to-one-side link (`light`), beside `puzzles · weave · colophon`.

## The toy (what the user does)

A dark optical bench (full-window Canvas 2D). The user places and **drags** elements; light
**re-traces live** every frame as things move. Direct manipulation is the whole joy — there is
no win state, no score, no generation puzzle. It is a sandbox you steer.

### Elements (each draggable; most also rotatable via a handle)
- **Emitter** — a source of light. Modes: a **fan** (N rays spread over an angle), a **single
  beam**, or a **point** (rays in all directions). Has position + aim angle + ray count + spread.
  Color: white, or a chosen hue, or **"spectrum"** (a rainbow fan whose rays carry distinct
  wavelengths so dispersion through a prism splits them — see Dispersion below).
- **Mirror** — a flat reflective segment (position, angle, length). Law of reflection.
- **Lens** — a thin spherical lens drawn as a vertical biconvex/biconcave shape, with a
  **focal length f** (signed: convex +f converging, concave −f diverging). Model it with the
  ideal **thin-lens ray transfer** at the lens plane (see Optics below) — this is the clean,
  provable model and looks beautiful (a fan converges to a focus).
- **Prism** — a solid glass triangle (equilateral by default), refractive index n. Rays refract
  by **Snell's law** entering and leaving; at steep internal angles you get **total internal
  reflection**. With a spectrum emitter, n varies by wavelength (Cauchy) → the prism fans white
  light into a rainbow. This is the signature moment.
- **Block** — an opaque absorber (rays stop). A plain rectangle/disc; useful for shaping.
- (Optional, only if time) a **circular lens/droplet** (a glass disc) — rays refract on a
  curved surface, can form a rainbow/caustic. Nice-to-have, not required.

### Controls (a glassy side panel, the workshop house style)
- A palette to **add** each element type (click to drop at center, then drag into place).
- **Select** an element → contextual sliders (angle, focal length, index n, ray count, spread,
  length, color/spectrum). Delete (⌫/Del or a button).
- **Seed + ⟳ re-roll**: a *seeded* arrangement generator (`buildScene(seed) → elements[]`) that
  lays out a pleasing, reproducible bench (e.g. an emitter + a prism + a lens + a mirror). Same
  seed ⇒ byte-identical scene. This satisfies the workshop's seeded-reproducibility tradition.
- **Presets** (curated, named): e.g. *Prism* (white→rainbow), *Focus* (fan→lens→focus),
  *Kaleidoscope* (rays between two angled mirrors), *Total Internal Reflection*, *Spectrum*.
- **Style toggle** (cosmetic only, must NOT change the physics): 2–3 looks, e.g.
  *Blueprint* (cyan on dark grid), *Spectral* (warm), *Graphite*. Switching style re-renders the
  same ray trace — prove it's cosmetic in the self-test (trace fingerprint identical across styles).
- **Trails / glow** intensity, **clear**, **PNG 2× export**, reduced-motion respect.
- A `← workshop` back-link + a green/red **self-test chip** in a fixed topbar (house convention).

## The optics (the model to implement — be exact)

Work in 2D. A ray = origin point + unit direction. Trace each ray by repeatedly finding the
**nearest** intersection with any element, applying that element's interaction, and continuing
with the outgoing ray; stop after `maxBounces` (e.g. 24) or when intensity decays below a floor
or it leaves the canvas. Carry an **intensity** (for fades/splits) and a **wavelength** (nm) per ray.

- **Reflection (mirror):** `d' = d − 2(d·n̂)n̂` where n̂ is the surface unit normal. Exact.
- **Refraction (Snell, at a flat glass surface — prism faces):** with incident unit dir `d`,
  surface normal `n̂` (pointing into the medium the ray is leaving), ratio `η = n1/n2`:
  `cosθi = −d·n̂`; `k = 1 − η²(1 − cosθi²)`. If `k < 0` → **total internal reflection** (reflect
  instead). Else `d' = η·d + (η·cosθi − √k)·n̂` (the standard vector Snell form). Normalize.
  Track which medium the ray is in (air n≈1.0 vs glass n) by entering/leaving prism faces.
- **Dispersion (Cauchy):** `n(λ) = A + B/λ²` (λ in µm). Pick A,B so e.g. crown-glass-ish:
  n≈1.52 at 589nm with visible spread ~0.008–0.02 across 400–700nm (tune B so the rainbow is
  *visible but physical*). Map wavelength→sRGB with a standard approximate spectral-color function
  for drawing. A "spectrum" emitter emits a fan of rays at sampled wavelengths.
- **Thin lens:** model the lens as a vertical plane at the lens center with half-height h and
  focal length f. When a ray crosses the lens plane within |y−yc|<h, apply the **ideal thin-lens
  transformation** in the paraxial-faithful but globally-consistent ray-transfer form: a ray
  hitting the lens plane at height `y` (relative to optical axis through lens center, along the
  lens's local frame) with incoming direction angle `u` leaves at the same point with outgoing
  angle `u'` such that `tan(u') = tan(u) − y/f` (lensmaker ray transfer; equivalently the ray
  bends toward the axis so that all rays parallel to the axis converge at distance f). Implement
  in the lens's local rotated frame, then rotate back. This guarantees the provable focusing
  invariant below. (This is the clean, testable lens; do NOT try to ray-trace two curved glass
  surfaces for the lens — the thin-lens transfer is the right model and is exactly verifiable.)
- **Block:** ray terminates.

## THE CRUX (workshop tradition) — the physics is REAL and PROVEN

A headless self-test runs on load, calls the **REAL** trace/optics functions (not a parallel
copy), logs PASS per check, and shows a green chip ("optics verified — N/N ✓"); **never ships red.**
Required checks (all must be exact to tight tolerances):

1. **Reflection law** — for random incidence angles on a mirror, the reflected ray's angle of
   reflection equals the angle of incidence (about the normal) to < 1e-9; reflecting twice about
   the same normal returns the original direction.
2. **Snell's law exactness** — for random incidence angles and index ratios, the emergent ray
   satisfies `n1·sinθi = n2·sinθt` to < 1e-9; and a ray passing through a parallel-faced slab
   (in one face, out the parallel face) emerges **parallel** to its entry direction (lateral
   shift only) to < 1e-9.
3. **Total internal reflection threshold** — for n>1 going glass→air, rays at incidence above
   the critical angle `θc = asin(1/n)` undergo TIR (no transmission), and just below θc they
   transmit; the boundary matches `θc` to < 1e-6.
4. **Thin-lens focusing** — a bundle of rays **parallel to the optical axis** (any lens angle,
   any f>0) all cross the axis at the focal point (distance f from the lens), i.e. they converge
   to a single point to < 1e-6 of the canvas; rays through the lens **center** pass undeviated.
   For f<0 (diverging) the back-projections meet at the virtual focus at −f. (This is the headline.)
5. **Dispersion ordering & monotonicity** — through a prism, `n(λ)` is monotonic decreasing in λ
   (blue bends more than red); the emergent deviation angle is strictly ordered by wavelength
   (violet deviates most). Assert the ordering across the visible band.
6. **Energy/decay sanity** — intensities are non-negative and non-increasing along a path; a
   split (if any) conserves the rule you choose; trace terminates (no infinite loop) within
   maxBounces for adversarial mirror-box configs.
7. **Seed purity / style-invariance** — `buildScene(seed)` is pure: same seed ⇒ identical scene
   fingerprint; a different seed differs; and the **ray-trace fingerprint is identical across all
   cosmetic styles** for one scene (style only re-renders — the workshop's signature invariant).

Extract the self-test core so it can also run under Node (the lead will independently re-run it).

## Quality bar (match the workshop)
- 60fps. Static scene = cheap (only re-trace on drag/animate; if you animate an emitter sweep,
  keep it smooth). 0 console errors / warnings / page-errors in a real browser on a served origin.
- All `localStorage` access try/catch-guarded (plays from `file://` too). Drop a
  `ws:seen:optics` breadcrumb (try/catch) for future hidden-world use — do NOT build an
  Undercroft secret or touch the front-door cards.
- Reduced-motion respected. Pointer events for drag (pointerdown/move/up), works on trackpad.
- Keep it a single file, ideally ~1000–1400 lines. House topbar + glassy panel aesthetic.

## Wiring (front door stays the curated 9 — do NOT redesign it)
- Add a `light` text link to the front-door `index.html` **footer** beside `weave` (the existing
  pattern: `puzzles · weave · light · colophon · source`).
- Add a short "Also on the workbench" README bullet for Caustic (alongside Latch/Loomlight).
- Topbar `← workshop` back-link in Caustic.
- `optics/CHANGELOG.md` (Build 1). This spec is input, commit it too.
