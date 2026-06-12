# Caustic — changelog

## Build 1
First build of **Caustic**, a steerable 2D optical light-bench (workshop "interactive
toy" vein; brand-new subject: light & refraction). Single self-contained vanilla
HTML/CSS/JS file, 0 dependencies, 0 network, no audio.

### What it does
- A dark optical bench (full-window Canvas 2D). Drag emitters, mirrors, lenses,
  prisms, blocks, and glass droplets; light re-traces live by **real geometric
  optics** as things move. No win state, no score — a sandbox you steer.
- **Emitter** (fan / single beam / point; white, hue, or *spectrum* rainbow fan),
  **Mirror** (law of reflection), **Lens** (ideal thin-lens ray transfer,
  signed focal length — convex converges, concave diverges), **Prism** (Snell
  refraction in/out + total internal reflection + Cauchy dispersion → rainbow),
  **Block** (opaque absorber), **Droplet** (curved-surface refraction).
- Direct manipulation: pointer events to drag the body and a rotate ring; click to
  select → contextual sliders (angle, focal length, index n, ray count, spread,
  size/length, colour). ⌫/Del or a button to remove.
- Seeded reproducibility: pure `buildScene(seed)` lays out a reproducible pleasing
  bench; same seed ⇒ byte-identical scene; ⟳ re-rolls.
- Curated presets: **Prism** (white→rainbow), **Spectrum** (wider rainbow),
  **Focus** (fan→converging lens→focus), **Kaleidoscope** (a fan ping-ponging in a
  narrow mirrored channel), **Total Internal Reflection** (beam TIRs inside a dense
  prism), **Droplet** (dispersion on a curved surface).
- 3 cosmetic style skins (Blueprint / Spectral / Graphite) that change ONLY
  appearance — the ray trace fingerprint is identical across all of them.
- Glow slider, Clear, Delete-selected, **PNG ×2** export, seed input + re-roll.
- Reduced-motion respected (the scene is static unless something changes; only
  re-traces on edit, draws via requestAnimationFrame). `ws:seen:optics` breadcrumb
  dropped in a try/catch.

### The optics (real & proven)
A headless self-test calls the REAL trace/optics functions on load, logs PASS per
check, and shows a green topbar chip **"optics verified — 7/7 ✓"** (never ships red).
Checks:
1. Reflection law — θi == θr about the normal (<1e-9); double-reflect is identity.
2. Snell exactness — n1·sinθi == n2·sinθt (<1e-9); a parallel-faced slab emerges
   parallel to entry (<1e-9).
3. Total internal reflection — threshold matches θc = asin(1/n) to <1e-6 (just
   below transmits, just above reflects).
4. Thin-lens focusing — a bundle parallel to the optical axis (any lens angle, any
   f>0) converges to the focal point at distance f (<1e-6); the center ray is
   undeviated (<1e-9); f<0 back-projections meet at the virtual focus.
5. Dispersion — n(λ) Cauchy, monotone decreasing in λ; through a prism the
   deviation is strictly ordered (violet bends most, red least).
6. Energy/decay — intensities non-negative and non-increasing along a path; the
   trace terminates within maxBounces even in an adversarial mirror box.
7. Seed purity / style-invariance — `buildScene(seed)` is pure (same seed identical,
   fresh seed differs); the ray-trace fingerprint is identical across cosmetic styles.

The self-test core is extractable and also passes under Node (7/7).

### Verification
- Headless Node re-run of the extracted core: **7/7 passed**.
- Real browser (served origin, 1400×900): chip GREEN **7/7**; console clean
  (**0 errors / 0 warnings / 0 page-errors**) across initial load, all 6 presets,
  all 3 style switches, two re-rolls, a real pointer-event drag, the prism index
  slider, a lens focal-length sweep (260→400→−300), and PNG export.
- Prism/Spectrum visibly fan a near-white beam into an ordered rainbow on exit;
  Focus converges a 13-ray amber fan to a clean focal point past the lens.

### Notable bugs found & fixed during the build (root causes)
- **Lens axis convention mismatch.** `elementSurfaces` builds the lens plane along
  the element's local y-axis (optical axis = the `ang` direction), but the self-test
  and the lens defaults/presets assumed `axis = ang − π/2` and used `ang = π/2`. The
  parallel bundle therefore never struck the lens plane. Fixed by standardising on
  one convention everywhere — **optical axis = the element's `ang` direction** — in
  the test, `makeElement`, `buildScene`, and the Focus preset.
- **Degenerate dispersion test geometry.** The first prism test ray grazed the base
  and total-internally-reflected, producing a near-symmetric path whose deviation was
  wavelength-independent. The optics were correct; the geometry was wrong. Fixed by
  using the classic two-slanted-face path (enter the upper-left face, exit the right
  face, no base interaction), which yields strictly λ-ordered deviation.
- **Preset geometry tuning.** Re-tuned Prism/Spectrum so every wavelength takes the
  clean two-face path (no stray base TIR), the TIR preset so the beam actually enters
  the prism and reflects internally, and Kaleidoscope into a narrow channel so rays
  ping-pong many times instead of escaping after one bounce.
