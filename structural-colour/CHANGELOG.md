# The Bragg Stack — structural colour — CHANGELOG

A Hall of Mirrors bench (the 14th), in the "wave nature of light" group beside the
Diffraction Grating. Structural colour: colour from periodic *geometry*, not pigment.

## v1 — 2026-06-13 (Opus 4.8, `/fun` BUILD session)

**The one big idea.** Stack many thin, transparent dielectric layers alternating a
high index `n_H` with a low index `n_L`, each a quarter-wave thick (`n·d = λ₀/4`),
and the structure alone reflects a whole *band* of colour — a **photonic band gap**.
No dye, no absorption: every interface reflects a faint echo, and at the design
wavelength they add in phase into a near-perfect mirror for that band. This is the
mechanism behind a Morpho butterfly's blue, a peacock feather, opal, a beetle's
shell, and a dielectric mirror. The reflected band **blue-shifts as you tilt** the
stack — the unmistakable fingerprint of structural (not pigment) colour.

**The falsifiable crux — two completely independent routes, one answer.**
- **Route B (the picture):** the reflectance `R(λ,θ)` of the *whole finite stack* is
  computed by the **transfer-matrix method** — multiply the 2×2 Abelès characteristic
  matrix of every layer, interface by interface. It knows nothing about "bands".
- **Route A (the why):** treat the *infinite* periodic stack with Bloch/Floquet band
  theory — one unit cell (H+L) has a transfer matrix `M_cell`, and a propagating mode
  needs `cos(KΛ) = ½·tr(M_cell)`. Wherever `|½·tr M_cell| > 1` there is **no real K**
  → light cannot propagate → a stop band / photonic band gap. It knows nothing about
  the finite stack.
- The self-test asserts the finite-stack reflectance is high **exactly** where the
  unit-cell band theory forbids propagation (`worst disagreement 0.000%` of the
  visible band), that the band centre lands on the analytic Bragg wavelength
  `λ₀ = 4·n_H·d_H` and its width on the closed form
  `Δλ/λ₀ = (4/π)·asin((n_H−n_L)/(n_H+n_L))` — **to machine precision in the frequency
  domain** (subtle, correct physics: the gap is symmetric in `1/λ`, not `λ`, so the
  wavelength midpoint is red-biased ~3% — only the frequency-domain centre is exact).

**Self-test 8/8 in-page · 15/15 Node** (`tools/structural-colour/`). The 8 CORE checks:
the crux (two routes coincide) · band centre==Bragg λ₀ & width==closed form (freq-exact,
err 0e+0 / 5e-13%) · the gap deepens with N (R→1, >0.999 by N=20) · the structural-colour
**blue-shift** with angle (60+nm bluer at 50°, monotone) · energy conserved & physical
(R never exceeds 1, gap reflects strongly, off-band stays low) · falsifiable (a detuned
non-quarter-wave stack's real band centre moves *away* from the quarter-wave formula's
prediction) · the CIE pipeline (R≡1 → neutral white under D65; a short-centre stack reads
blue, a long-centre stack reads red) · determinism. The Node test adds 7 textbook
cross-checks the page never sees (450nm design → freq-centre 450.000nm; bandwidth 33.835%
for TiO₂/SiO₂; air|glass single interface == exactly 4% Fresnel; 1 bilayer reflects weakly
vs 20 ~perfectly; s & p both blue-shift; determinism).

**The page (form expresses content) — three stacked views:**
1. **The stack in cross-section** — the alternating H/L layers drawn to physical scale,
   with the white incoming ray at your viewing angle and the band-coloured reflected ray.
2. **The proof plot** — `R(λ)` from the TMM painted in true wavelength colour, the
   band gap (from the independent band function) shaded under it, the dashed band
   function `½·tr M_cell` overlaid (it leaves `±1` exactly across the gap), band edges
   marked, a true-colour wavelength strip on the axis.
3. **The swatch** — the actual reflected colour, which visibly blue-shifts as you tilt.
Controls: viewing angle θ (the blue-shift), periods (1–40), design λ₀, n_H, n_L, a
polarisation toggle (unpolarised / s / p), and 5 real-material presets (Morpho blue,
Peacock green, Beetle gold, Opal red, Dielectric mirror). PNG ×2. Drops
`ws:seen:structural-colour` on a direct visit.

**Browser-verified** (served origin :8791, agent-browser, cache-busted): chip **8/8**,
breadcrumb written, **0 console errors**. Default green stack: band centre exactly
520.0nm, gap 445–625nm, peak reflectance 100.00%. Tilt to 40° → centre 480.2nm (40nm
bluer, live). Morpho-blue preset at 45° → vivid rgb(93,177,255), centre 417nm.

**Integration.** Added as the 14th Hall card (`hall-of-mirrors/index.html`), "wave
nature of light" group, beside the Diffraction Grating, with a layer-stack vignette
(butterfly glyph) + hover animation (the band brightens, the reflected ray fires).
**Deliberately NOT a Feat of Light** — the Hall's 9-feat "The Optician" capstone AND
the hidden Light Mixer unlock both key on exactly the 9 `ws:flag:earned-*` flags, so a
10th feat would silently break both. Re-verified: 14 cards, feats still **0/9**.

**Distinct from its neighbours.** Iridescence is a *single* thin film (~2 interfaces,
two-beam interference); this is a *periodic multilayer* (a 1-D photonic crystal, band
theory). The Diffraction Grating is *transverse* periodicity → angular orders; this is
*longitudinal* periodicity → spectral bands. Three different corners of one physics.

Files: `structural-colour/index.html` (CORE inlined byte-for-byte),
`tools/structural-colour/structural-colour.js` (the DOM-free CORE),
`tools/structural-colour/structural-colour.test.cjs` (the Node harness).
