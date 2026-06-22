# 💧 The Pool That Dances — build spec

*A top-down sunlit pool whose floor shows a **live caustic net** you reshape by dragging the water.
The sun pours straight down; every wrinkle on the surface is a tiny lens, and where the surface
curves it **focuses** the parallel sun into bright filaments on the floor — a caustic. Drag to sculpt
it: **pinch** a bump for a knot of light, **rake** a wave-train into rolling bright ribbons, **smooth**
it flat. No plotted graph anywhere — the dancing caustic itself is the medium you touch, the floor-light
its only readout. The Hall of Mirrors' physical water-cousin to the optical light-bench (single rays
through one lens) and the wave-cousin of the Ripple Tank (the same water, stirred from the side).*

Folder: `pool/`. Files: `pool/core.mjs` (the SOLE math authority) · `pool/core.test.mjs` (the Node
twin) · `pool/index.src.html` → **forged** to `pool/index.html` (self-contained, no deps, no network) ·
`assets/pool.png` (hero). Build log: `pool/CHANGELOG.md`.

> Distinct from **Caustic** (the optics light-bench traces single *rays* through lenses/mirrors) and
> from the **cardioid** envelope (a curve of reflected rays in a cup) — here the WHOLE FIELD focuses
> at once and you SCULPT the caustic by deforming the surface. Distinct from **Ripple** (waves on the
> surface, seen from the side) — this reads the surface as a refracting lens and shows the light it
> casts below.

---

## The two layers, one contract

### A. The surface — analytic sum-of-wavelets (NOT a PDE grid)

`h(x,y,t) = Σ_k A_k(t)·g_k(x,y) + idle shimmer`, over the unit domain `[-L,L]²` (L=1). Two C^∞
primitives, each with an **exact closed-form gradient** (gradients are never finite-differenced):

- **Radial bump (PINCH):** `g = A·exp(-r²/2σ²)` — a converging lens (a bright knot).
  `∇g = -(g/σ²)·(x-cx, y-cy)`.
- **Windowed ripple patch (RAKE):** `g = A·exp(-r²/2σ²)·cos(K·(p-c)+φ)`, with `K` along the drag
  direction → combed ribbons. Gradient by the product/chain rule.

Each wavelet carries a near-critically-damped breathing amplitude
`A_k(t) = A★·e^(-γΔt)·(1 + β·cos(ωΔt))` (γ ⇒ settle in ~7 s, β≈0.18), so a poke wobbles and slowly
relaxes — **life without a PDE**. Ripple patches also advance an internal phase so the ribbons ROLL.
The **idle shimmer** is M≈3 slow, large-σ, low-amplitude (≈0.04) drifting ripple patches (the same
primitive, the same code path) → a faint breathing net even untouched. Bounded cap N_max≈24 with
LRU-reap of the lowest |A|; spent wavelets (|A|<1e-4) are reaped. A deterministic seeded **xorshift32**
makes the shimmer reproducible (so the Node twin is deterministic). **SMOOTH** switches touched
wavelets to a fast decay (τ≈0.25 s) → the floor washes even. **Still the pool** suspends the shimmer
AND sets every `A★→0` ⇒ `h ≡ 0` literally — the neg-control *by construction*, made touchable.

The surface exposes the **SOLE optics contract**: `surf = { h(x,y), hx(x,y), hy(x,y) }` — all analytic.
(A `sample(x,y)` fast-path returns `[h,hx,hy]` in one pass — the identical analytic values, a render
optimisation, not a new physics.)

### B. The optics core — the landing map F and its Jacobian (the SOLE math authority)

The **landing map** `F`: refract the vertical sun `[0,0,-1]` at the surface normal
`n = normalize(-hx,-hy,1)` (GLSL `refract`, TIR-guarded), march the refracted ray down to the floor
`z = -d`, giving `(Fx,Fy)`. The **Jacobian** of F is taken by ONE central difference (`e=1e-5`) — the
outer numerical derivative over the analytic surface — and `det J = Fxx·Fyy − Fxy·Fyx`.
**Brightness = min(capBright, 1/|det J|)**.

> This is the proven path. We deliberately do NOT replace `det J` with an analytic Hessian; the
> central-difference Jacobian of the analytic surface is what makes the fold/brightness coincidence a
> real numerical certificate rather than an algebraic identity.

Param contract: `p = { surf, d:6, n_air:1, n_water:1.333, L:1, capBright:1e3, sunTilt:0 }`. The sun is
exactly vertical by default (`sunTilt=0`) so a flat surface ⇒ F = identity exactly. A SUN-ANGLE control
exists (default 0); when used, the neg-control is read as **det J ≡ 1**, not F = identity (see claim 3b).
Default `d=6`; folds open for `d ≳ 5`.

---

## The claims (exact tolerances) — proved by `runSelfTest()`, run by both the page pill and the twin

**(0) Analytic-gradient certificate.** For many random wavelet configs, the surface's analytic
`hx,hy` agree with the central difference of `h` to **< 1e-9** — certifying the Jacobian reads a TRUE
derivative of the ACTUAL rendered surface. *(maxErr ≈ 1.5e-10.)*

**(1) Fold = the bright net.**
- *(1a) Pointwise certificate (binning-free):* wherever `|det J| < εfold` (1e-3), `1/|det J| >
  BRIGHT_FLOOR` (200); the smooth interior (`|det J| > 0.3`) has median brightness O(1) (< 5).
- *(1b) Contrast:* fold/smooth brightness contrast **> 40×** on every poked surface. *(measured
  ≫ 1000× — the caustic is sharp.)*
- *(1c) Image coincidence (corroboration):* the brightest 1% of a 300² floor histogram sit ON the
  caustic — the IMAGE `F(detJ=0)` of the fold curve (the fold lives in surface coords; the caustic on
  the floor is its image). The coincidence is **tight** — median ≤ 1, mean ≤ 2 floor-cells — with a
  sparse cusp-width tail (99th-pct ≤ 8). **HONESTY:** the caustic is a √-FOLD with an *integrable
  width* that fattens to a few floor-cells at the cusp tips, so this is stated as a BAND, not exact
  equality. *(measured median ≈ 0.5, mean ≈ 0.9.)*

**(2) Conservation.** Total floor light is conserved across any deformation, by the honest
surface-side change-of-variables: a surface cell of area `dA_s` maps to a floor cell of area
`|det J|·dA_s` and deposits `1/|det J|` there, contributing `dA_s`; the total is therefore the surface
area `(2L)²` **exactly**, for ANY height field (the `1/|det J|` singularity is integrable, so the cap
never touches the integral). Asserted for flat AND ≥4 arbitrary pokes:
`|deposited − surfaceArea| < 1e-6·surfaceArea`, `escaped === 0` (6L box guard), cross-surface drift
< 1e-6. *(maxRel ≈ 3e-12, drift 0.)*
> **HONESTY (fixed-time property):** conservation holds AT FIXED TIME — per frame, across deformations.
> The slow relaxation gently lowers curvature over seconds; flux is still conserved each frame. Phrase
> it as *"conserved across any deformation at fixed time."*

**(3) Neg-control (flat ⇒ identity).** A flat surface gives `max|det J − 1| < 1e-9` over a 9×9
OFF-CENTER grid, **zero** fold crossings anywhere, and a uniform floor (`max − min < 1e-6`, = 1).
*(maxErr ≈ 9e-12, foldPts = 0.)*

**(3b) Affine oracle / sun-angle neg-control.** A linear-tilt surface `h = a·x + b·y` makes the landing
map **affine**, so `det J` is spatially **constant** (a fold-free map — no caustic — even under a
tilted sun), and equals 1 EXACTLY precisely when the water is flat (`a=b=0`). This is the honest
sun-angle neg-control: tilting the sun over flat-but-sloped water can never fabricate a fold, because a
constant `det J` has no zero-set. Asserted: `det J` constant to < 1e-6 across the domain for several
`(a,b,sunTilt)`, and `= 1` to < 1e-9 when flat. *A ground-truth the central-diff Jacobian cannot fake.*

**(4) `still()` ⇒ `h ≡ 0, hx ≡ 0, hy ≡ 0`** over a grid — the touchable neg-control by construction
(the "Still the pool" button).

### The twin (`core.test.mjs`) — the mirage discipline, three layers

- **(a)** run the page's `runSelfTest()` — every check green;
- **(b)** INDEPENDENT re-derivations at params the page never uses — a fresh 40-surface analytic-vs-FD
  gradient fan; conservation on a fresh **30-poke** deterministic PRNG fan (+flat); the affine-tilt
  closed-form oracle across random `(a,b,sunTilt)`; a fresh fold/contrast battery; the neg-control on a
  fresh off-center grid; image coincidence on a fresh curved surface;
- **(c)** **BYTE-PARITY:** the slice between the `// ===== POOL CORE … =====` sentinels in `core.mjs`
  and in `index.html` (indentation-normalized) must be IDENTICAL — so the painting can never drift from
  this test. `node pool/core.test.mjs` → exit 0 = all green (16/16).

---

## The look + wiring

Two stacked canvases in `#stage` (`touch-action:none`, `cursor:crosshair`). **`#floor`** is painted
from the core's brightness field each frame: the core's landing map is evaluated once per surface node
(an oversampled SG≈252 grid), `det J` read from the grid's own central differences (the same
central-difference Jacobian, derived for free from neighbours — the render reads the core's landing
field, never re-implements the math), and `1/|det J|` deposited into a low-res floor buffer. Then a
cool tiled-pool base ramp (deep→floor→shallow blue-green, with a faint baked grout-tile texture — purely
cosmetic, never read by the core) + an **additive warm-gold caustic glow** so knots bloom past white and
the dark gaps between filaments show the cool floor; one half-res additive **bloom** pass holds 60 fps;
an optional cheap **channel-offset dispersion** (a render trick, never a physics claim — the self-test
reads the un-split brightness). **`#fx`** carries only affordance chrome (pointer touch-glow + poke
ripple-rings). The idle shimmer keeps the net dancing even untouched; `prefers-reduced-motion` freezes
the idle drift but keeps touch.

Chrome copies Ripple's voice: the right glass `#panel`, the warm `.lede`, the topbar
`.back/.brand/.tag/.twin/.selftest`. Controls: a TOOL segmented PINCH·RAKE·SMOOTH, a DEPTH dial `d`, an
optional SUN-ANGLE nudge (default 0), a **Still the pool** button (the touchable neg-control), an
optional **fold-line** overlay (the `det J = 0` contour mapped to the floor — teaches claim 1 without a
chart), and a dispersion toggle. One mono poetic caption: *"light gathers on the folds where wavelets
focus."* The **selftest pill** reruns the SAME `runSelfTest()` the twin proves. On first paint the page
drops `ws:seen:pool` + dispatches `CustomEvent('ws:seen',{detail:'pool'})` (id matches the PLACES id
"pool"; `forge --audit-seen` greps it).

## Discoverability

- **Front door** (`index.src.html` PLACES, reforged): `{ id:"pool", glyph:"💧", accent:"#f0c8a0",
  district:"grounds", tier:1, wing:"optics", footprint:"tank", companion:Ripple }`.
- **Hall of Mirrors hub** card in the warm "Rays, lenses & mirrors" band, right after **Caustic**, with
  a distinct `.v-poolnet` vignette (crossing bright filaments + 2 bloom-knots) and a hue inside the warm
  ramp (`#f0c8a0`/`#f3d0b0`).
- **Reciprocal Ripple link:** a `.kin` line under Ripple's lede → *"The same water, lit from above…"*.

## Definition of done (verified)

`node pool/core.test.mjs` → 16/16, exit 0 · `forge --check pool/index.src.html` + root → no drift ·
`forge --audit-seen` → pool drops `ws:seen:pool` · in-browser: opens to a top-down sunlit pool with a
LIVE caustic net, three gestures work (pinch→knot, rake→ribbons, smooth→even), "Still the pool"→uniform
floor, selftest pill ok, ~60 fps, 0 console errors, NO plotted graph · hub card + front-door + ripple
`.kin` all 200 and reciprocate · `assets/pool.png` hero present.
