# The Diffraction Grating — changelog

## v1 (2026-06-13) — the 13th Hall of Mirrors bench

**What it is.** A Fraunhofer (far-field) diffraction bench for the Hall of Mirrors'
"wave nature of light" group, sitting beside the Polariser. Its one big idea: in the
far field the intensity of light passing an aperture is the **squared magnitude of the
Fourier transform of the aperture's transmission function** — aperture shape ↔
diffraction pattern is a Fourier pair. Everything the bench shows falls out of that:

- a **single slit** of width `a` → `I = sinc²(β)`, `β = π·a·sinθ/λ`, dark fringes
  exactly at `a·sinθ = mλ`, central lobe twice as wide as the rest;
- **N equal slits** (a grating, pitch `d`) → the sinc envelope times the interference
  comb `[sin(Nα)/sin(α)]²`, `α = π·d·sinθ/λ`, with principal maxima of height **N²** at
  `d·sinθ = mλ` (the grating equation), separated by `N−1` zeros and `N−2` secondary
  maxima. Raising N **sharpens** the orders (half-width `= λ/(N·d) ∝ 1/N`) — why a
  grating out-resolves two slits. `N=1` collapses to the pure single slit; `N=2` is
  Young's double slit (`bracket = 4cos²α`).
- **white light** fans every order into a true-wavelength spectrum — a grating *is* a
  spectrometer.
- **missing orders**: when `d/a` is an integer, every `(d/a)`-th order lands on a slit-
  envelope zero and vanishes (here flagged + drawn suppressed).

**The falsifiable crux.** The page renders the closed form above; to prove that curve
really *is* the Fourier transform of the drawn slits, the CORE also computes the
Fraunhofer integral a **second, independent way** — a direct discrete sum
`Σ t(x)·e^{-ikx sinθ}·dx` over the sampled aperture, using NO sinc and NO grating
identity. The plot overlays those FT samples (white dots) on the analytic curve so you
can *see* them coincide; the self-test asserts they agree to **3.65e-5** (peak-relative)
across the whole pattern for single slit / double slit / N-slit gratings.

**Self-test 8/8** (in-page chip = Node `tools/diffraction/diffraction.test.cjs`, which
requires the SAME `tools/diffraction/diffraction.js` CORE the page inlines):
1. THE FOURIER CRUX — analytic `I(θ)` == `|FT of the sampled aperture|²` across the whole
   pattern, all configs (max rel err 3.65e-5).
2. single-slit dark fringes exactly at `a·sinθ = mλ` (envelope = 0 there).
3. grating orders exactly at `d·sinθ = mλ`, principal height = N², missing orders
   (d/a=3) suppressed.
4. principal maxima sharpen with N (half-width = λ/(N·d) ∝ 1/N).
5. `N=2` bracket == Young's `4cos²α`; `N=1` collapses to the pure single slit.
6. energy conserved between the closed form and the FT route (Parseval).
7. FALSIFIABLE — the wrong half-integer minima law `(m+½)λ/a` is NOT dark (rejected).
8. deterministic — pure functions, byte-identical on repeat (no RNG/clock/state).

The Node test adds 5 independent cross-checks (textbook first-minimum angle 2.866°;
red bends more than blue in m=1; central peak == N² for N∈{1,2,3,5,8,13}; exactly N−2
secondary maxima for N=5; doubling λ doubles the order angle). **13/13 green** in Node.

**The page.** Three stacked views — the **aperture** (N slits drawn to scale, with `a`/`d`
dimension ticks, true-colour glow), the **far screen** (the diffraction pattern you'd
see, painted from the real intensity in true wavelength colour; white-light mode fans
each order into a spectrum), and the **intensity plot** `I(sinθ)` (the green closed-form
curve, the white independent-FT dots on top of it, the dashed sinc envelope, green order
marks with missing orders flagged). Controls: N (1–24), slit width a, pitch d (clamped
≥ a), wavelength λ / white-light toggle, show toggles (FT samples / envelope / order
marks), drag-the-plot to read off any angle, PNG ×2 export. A live "the proof" line
reports the current FT-vs-analytic agreement. Drops `ws:seen:diffraction`.

**Integration.** Added as the 13th card in `hall-of-mirrors/index.html` ("wave nature of
light" group, beside the Polariser) with a fringe-comb vignette + hover animation.
**Deliberately NOT a Feat of Light** — the Hall's 9-feat capstone and the hidden Light
Mixer's unlock predicate both key on exactly the 9 `ws:flag:earned-*` flags, so a 10th
feat would break them. This bench enriches the wing without touching that count.

Browser-verified on a served origin (agent-browser): chip 8/8, breadcrumb written, 0
console errors; single slit (pure sinc, central lobe 2× wide, first dark at 7.90°),
5-slit grating (orders at d·sinθ=mλ, missing every 4th for d/a=4, FT dots on the curve),
12-slit white light (sharp orders each fanned into a spectrum). Hall index re-verified:
13 cards, feats still 0/9.

No `tools/`-side render dependency beyond the CORE; fully self-contained single file.
