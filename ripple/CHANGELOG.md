# Ripple — changelog

## 2026-06-12 — Initial build (wave-interference tank)

Built `ripple/index.html`: a self-contained, dependency-free, audio-free dark
"tank" of N draggable point sources whose circular waves interfere by exact
linear superposition. The wave-physics sibling to Caustic (optics bench),
sharing its dark-bench aesthetic, pure-CORE + headless-self-test discipline,
CSS-variable skin switcher, and canvas-native PNG export.

### What I built
- **Pure CORE** (no DOM, no skin, no render — the single source of truth):
  - `falloff(mode, r, λ)` — `none` (idealised = 1) or `real` (1/√(1+r/λ)).
  - `contribution(src, k, ω, t, mode, λ, x, y)` = `A·falloff(r)·cos(k·r − ω·t + φ)`.
  - `field(sources, …)` = `Σ_i contribution_i` — the value the renderer paints.
  - `resultantAmplitude(sources, k, ω, mode, λ, x, y)` — closed form
    `2A|cos((kΔ + Δφ)/2)|` for the equal-frequency two-source case, else the
    sampled max of `|field|` over one period (exact since all sources share ω).
  - `fieldFingerprint(…)` — stable hash of the field on a fixed lattice (proves
    skin-invariance: the CORE takes NO skin argument at all).
- **The same CORE** drives both the in-page renderer (`renderField` evaluates the
  identical Σcos per buffer pixel) and `runSelfTest()` (the topbar badge).
- **DOM app**: field rendered into a fixed ~300-px-wide offscreen ImageData buffer
  (diverging crest→zero→trough colour ramp, normalised by Σ|Ai|) then
  `drawImage`-upscaled smoothly to the display canvas; glowing draggable source
  discs drawn on top (selected one ringed, antiphase sources marked). Controls:
  Play/Pause, Wavelength λ, Frequency, Amplitude, Falloff (idealised/realistic),
  nodal-lines overlay, per-source Flip-phase, add (click empty water) / remove
  (Remove button, right-click, or Del). Presets: Two-source, Double-slit, Line
  array, Single drop, Clear. 3 skins (tank / schlieren / blueprint — cosmetic
  only). Export 2× PNG (canvas-native). Back-link, `ws:seen:ripple` breadcrumb,
  `prefers-reduced-motion` respected (starts paused, still fully interactive).

### How I verified
- **Headless first** — a /tmp Node harness extracts the SHIPPED CORE from
  `index.html` (the exact code the page runs) and asserts all of spec §1:
  - render==field vs an independent reference Σ over 500 random configs → `maxErr < 1e-9`.
  - superposition linearity `field({A,B}) == field({A})+field({B})` → `maxErr < 1e-12`.
  - **interference loci (the physics gate, falloff=none, two equal in-phase sources)**:
    perpendicular bisector R ≈ 2A; nodes at Δ=(n+½)λ have R ≈ 0; antinodes at
    Δ=nλ have R ≈ 2A. Probe points placed ANALYTICALLY on the path-difference
    hyperbola (X = ±(Δ/2)·√(1 + Y²/(a²−(Δ/2)²))), so `r1−r2 = Δ` is exact by
    construction. Closed-form `resultantAmplitude` cross-checked against the
    sampled max of `|field|` to `< 5e-3`. Antiphase (Δφ=π) flips the bisector
    from antinode to node (R≈0).
  - double-slit fringe spacing ≈ λL/d within 5% (measured in the paraxial
    near-axis window: d=160, λ=20, L=6000 → predicted 750 px; the central
    m=0,±1,±2 fringes are detected and their mean spacing compared).
  - determinism / skin-invariance via `fieldFingerprint` (identical inputs →
    identical hash; a t-shift differs).
  Result: **shipped runSelfTest() 8/8**, independent re-derivation **10/10**.
- **In a real browser** (served over http, agent-browser session `ripple-build`):
  badge green **ripple verified — 8/8 ✓**, **zero console errors**; two-source
  pattern symmetric with a bright bisector antinode; dragging a source
  re-interferes the fringes live; λ slider visibly changes fringe density (dense
  at λ=20, broad at λ=120); flip-phase turns the bright bisector into a dark node;
  pause freezes the field (two captures 0.6 s apart are byte-identical); the
  nodal-lines overlay traces the dark hyperbolae; Double-slit shows far-field
  fringes and Line array a steered wavefront; all 3 skins render the IDENTICAL
  field (fingerprint `556a133b:1593` byte-identical across tank/schlieren/blueprint),
  differing only in colour ramp; Export 2× PNG produces a valid 2000×1720 `image/png`
  (exactly 2× the 1000×860 canvas); back-link → `../index.html`; `ws:seen:ripple` set.
- **Perf**: field render (the heavy loop) on the 300×258 buffer costs ~6.7 ms at
  2 sources, ~21.6 ms at 6, ~29 ms at 8 (Node measurement; in-browser V8 + GPU
  upscale is faster) — comfortably 30-60 fps for the typical 2-6 source tank.

### Self-test result
`ripple verified — 8/8 ✓` (green). Console logs each PASS line. Headless harness
green too (8/8 shipped + 10/10 independent).

### Deviations from the spec
- **Double-slit modelled as two point sources** (not Huygens-array slits), as
  the spec explicitly permits ("ship the two-point-source version and note it").
  The far-field spacing matches λL/d to within 5% in the paraxial window.
- **Phase control** is a per-source "Flip phase" toggle on the selected source
  (the spec's stated acceptable form), rather than a continuous phase dial.
- Registered a card in the workbench **Toys & benches** group (next to Caustic),
  using the 🌊 glyph as suggested.
