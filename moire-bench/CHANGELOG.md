# The Moiré Bench — changelog

## #124 — sown (the bloom)

A dark optical bench where two cosine line-gratings overlap and a slow moiré
fringe swims up — a third pattern neither grid contains, the **spatial beat** of
two combs. Ships in the blue "wave nature of light" family beside The Diffraction
Grating and The Reciprocal Twins. Follows the proven sampling-theorem /
butterfly-voice mold (imports the Butterfly's FFT, hand-inlines two byte-twin
cores into the page).

### The one idea
The brightness the eye sees through two transparencies is their **product**, and
`cos A · cos B = ½[cos(A−B) + cos(A+B)]`. The **difference** term `cos(A−B)`
oscillates at `|k₁−k₂|` — far slower than either carrier — and that slow envelope
is the moiré band. Its spacing is `D = 1/|k₁−k₂|`, which contains both closed
forms exactly:
- **rotation** (equal pitch `p`, relative angle `θ`): `D = p/(2·sin θ/2)`
- **two-pitch** (parallel, `p₁,p₂`): `D = p₁p₂/|p₁−p₂|`

### The proof (`moire-core.mjs` + the in-page chip, one shared `runSelfTest`)
Six legs, every number live:
- **A** rotation law — measured fringe-D (2-D FFT peak of the composited field)
  matches `p/(2·sin θ/2)` to <1% across θ∈[4°,18°].
- **B** two-pitch law — measured D matches `p₁p₂/|p₁−p₂|` to <1%.
- **C** unified law — `D = 1/|k₁−k₂|` === both closed forms to 1e-9.
- **D** **load-bearing neg-control** — θ=0 & p₁=p₂ ⇒ combs coincide ⇒ NO fringe:
  the low-band peak is < 1e-6 of the carrier (a Blackman–Harris window's −92 dB
  sidelobes make this floor reachable), and `measureSpacing` returns `Infinity`
  (never 0/NaN). A vacuous always-fringe renderer FAILS here.
- **E** render-Nyquist guard — an over-fine grating (1.5 px/period, below the hard
  Nyquist of 2) does NOT report the true beat (rel.err ≈ 69%); the guard is real.
- **F** imported-transform contract — `fft`/`toComplex` imported from
  `../butterfly/core.mjs`; a non-pow-2 fft throws. This file types no FFT.

### The bench (one canvas, one field)
- The canvas paints `composite()` and the FFT measures `composite()` — one field,
  one authority; nothing re-derives the math. The moiré band is the **emergent**
  low-frequency envelope of the painted product (no extra fringe is drawn, so the
  neg-control paints visibly FLAT).
- **drag the stage** = phase-translate the top comb (D-invariant — slides the
  fringe, never trips the agreement dot). **θ dial** (atan2-unwrap drag, pointer-
  capture, keyboard, Home=0°), **pitch sliders**. **ROTATION | TWO-PITCH** is a
  HARD mode swap (the inactive law's controls are DOM-hidden + aria-hidden; in
  two-pitch θ is pinned 0 with a visible tag). **flatten → no fringe** reaches the
  neg-control in both modes without fine motor control.
- A debounced `measureSpacing` drives the agreement dot (green <3%, calm blue in
  the neg-control with "no fringe is the correct answer here"). A cosmetic ±2%
  breathe glow rides the located band, suppressed when spacing→∞.

### Node twin (`moire-core.test.mjs`) — 13/13
The six shared legs + deeper rotation/two-pitch/neg-control sweeps +
anti-circularity grep + two byte-twin parity checks (the inlined MOIRE CORE block
=== the module; the inlined BUTTERFLY CORE block === the slice butterfly's page
inlines — the page's fft IS the Butterfly's fft).

### Registered
Hall of Mirrors (wave-nature-of-light group: card + two-comb vignette + "self-test
proves" line + wave-group kin line), the Workbench Computation deck, and reciprocal
cross-links with The Diffraction Grating (a `.back` crumb) and The Reciprocal Twins
(the `.sib` kin line).
