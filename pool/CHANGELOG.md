# The Pool That Dances — changelog

A Hall of Mirrors bench. *The sun gathers on the folds where wavelets focus.* A top-down sunlit pool;
the sun pours straight down and every wrinkle on the water is a tiny lens, focusing the parallel sun
into a bright net of light on the floor — a **caustic**. You sculpt it by dragging the surface:
**pinch** a bump for a knot of light, **rake** a wave-train into rolling bright ribbons, **smooth** it
flat. No graph anywhere — the dancing caustic itself is the medium you touch. Flatten the water with
**Still the pool** and the floor goes perfectly uniform: the neg-control, made tactile.

## Built (cycle #290, BUILD/garden — the planter)

- **`core.mjs`** — the SOLE math authority (zero-dep ESM, no DOM). Two layers under one contract.
  - **The surface** — an analytic sum-of-wavelets height field, NOT a PDE grid. Two C^∞ primitives:
    a radial **bump** `A·e^(-r²/2σ²)` (a lens) and a windowed **ripple patch**
    `A·e^(-r²/2σ²)·cos(K·(p-c)+φ)` (a comb), each with an **exact closed-form gradient** (never
    finite-differenced). Each wavelet breathes near-critically-damped (`A★·e^(-γΔt)·(1+β·cos ωΔt)`) so
    a poke wobbles and relaxes; ripple patches roll an internal phase. An idle shimmer (M≈3 slow
    large-σ drifting patches, same primitive/code path) keeps the net dancing untouched. Bounded
    `N_max≈24` with LRU-reap; a seeded **xorshift32** makes the shimmer reproducible. `smoothNear`
    fast-decays touched wavelets; `still()` zeroes every `A★` ⇒ `h≡0` literally. Exposes the SOLE
    optics contract `surf = { h, hx, hy }` (+ a one-pass `sample` fast-path returning the identical
    analytic values).
  - **The optics** — the landing map `F`: GLSL `refract` (TIR-guarded) the vertical sun `[0,0,-1]` at
    `n = normalize(-hx,-hy,1)`, march to the floor `z=-d`, → `(Fx,Fy)`. `jacobian` = ONE central diff
    of F (`e=1e-5`), `det = Fxx·Fyy−Fxy·Fyx`; **brightness = min(cap, 1/|det J|)**. `foldContour`
    traces the `det J=0` zero-set by bisecting sign-changes along axis-aligned grid lines (captures
    cusps a radial fan skips). `depositedLight` is the honest surface-side change-of-variables;
    `floorHistogram` bins the floor brightness. Fixtures: `flatSurface`, `tiltSurface(a,b)`,
    `frozenSurface(specs)`, `pokeFan`, `witnessSurface`.
  - **`runSelfTest()`** proves, with exact tolerances: **(0)** analytic `hx,hy` === FD(h) < 1e-9;
    **(1a)** `|detJ|<1e-3 ⇒ 1/|detJ|>200`, smooth-interior median O(1); **(1b)** fold/smooth contrast
    > 40× (measured ≫1000×); **(1c)** brightest-1% floor cells sit ON the caustic `F(detJ=0)` (median
    ≤1, mean ≤2 floor-cells; 99th-pct ≤8 cusp-width band — the √-fold has integrable width, stated as
    a band); **(2)** conservation `∫floor = (2L)²` to <1e-6 for flat + pokes, escaped=0, drift<1e-6;
    **(3)** flat neg-control `max|detJ−1|<1e-9`, empty zero-set, uniform floor; **(3b)** affine oracle —
    a linear tilt gives spatially-constant `det J` (no fold) across sun angles, =1 iff flat; **(4)**
    `still() ⇒ h≡0,hx≡0,hy≡0`.

- **`core.test.mjs`** — the Node twin (the mirage discipline). (a) runs the page's `runSelfTest()`;
  (b) INDEPENDENT re-derivations at fresh params the page never uses — a 40-surface analytic-vs-FD
  gradient fan, conservation on a fresh **30-poke** PRNG fan (+flat), the affine-tilt oracle across
  random `(a,b,sunTilt)`, a fresh fold/contrast battery, the neg-control on a fresh off-center grid,
  image coincidence on a fresh curved surface; (c) **BYTE-PARITY** of the `POOL CORE` slice between
  `core.mjs` and `index.html`. `node pool/core.test.mjs` → **16/16, exit 0.**

- **`index.src.html` → `index.html`** (forged; self-contained, no deps, no network). The CORE is
  FORGE-INLINED byte-for-byte between the `// ===== POOL CORE … =====` sentinels; the page RUNS the
  inlined copy and the pill reruns the SAME `runSelfTest()` the twin proves. Two stacked canvases:
  **`#floor`** painted from the core's brightness field (landing map evaluated once per surface node,
  `det J` from grid neighbours, `1/|det J|` deposited into a low-res buffer) over a cool tiled-pool
  base ramp + an additive warm-gold caustic glow + a half-res bloom pass (≈60 fps) + optional
  channel-offset dispersion (a render trick; the self-test reads un-split brightness). **`#fx`** carries
  only affordance chrome. Gestures: segmented PINCH (◦ a knot) · RAKE (∿ combed ribbons) · SMOOTH (⌇
  even floor); double-tap empty water = pinch; trackpad-safe. Controls: DEPTH dial, optional SUN-ANGLE
  (default 0), **Still the pool** (the touchable neg-control), an optional **fold-line** overlay (the
  `det J=0` contour mapped to the floor — teaches claim 1 without a chart), dispersion toggle. Ripple's
  topbar/voice copied; a green **selftest pill**; `prefers-reduced-motion` freezes idle drift, keeps
  touch. Drops `ws:seen:pool` on first paint.

- **Discoverability:** front-door PLACES entry `{ id:"pool", glyph:"💧", accent:"#f0c8a0",
  district:"grounds", tier:1, wing:"optics", footprint:"tank", companion:Ripple }`; a Hall of Mirrors
  hub card in the warm "Rays, lenses & mirrors" band right after **Caustic** (distinct `.v-poolnet`
  vignette, hue `#f0c8a0`); a reciprocal `.kin` line under Ripple's lede. `assets/pool.png` hero shot.

### Honest scope

- **Conservation is a FIXED-TIME property** — per frame, across deformations. The slow relaxation
  gently lowers curvature over seconds; flux is still conserved each frame. (Stated on the page caption,
  the pill detail, and POOL.SPEC.)
- The caustic is a **√-FOLD** with an integrable width that fattens to a few floor-cells at the cusp
  tips, so the image-coincidence claim is a tight **band** (median/mean on the fold; a sparse cusp tail),
  not exact equality.
- The dispersion channel-offset and the grout-tile texture are **cosmetic** — the core never reads them.

### Verified

`node pool/core.test.mjs` → 16/16, exit 0 · `forge --check` (pool + root) → no drift ·
`forge --audit-seen` → pool drops `ws:seen:pool` · in-browser (agent-browser): opens to a top-down
sunlit pool with a LIVE caustic net, pinch→knot / rake→ribbons / smooth→even all work, "Still the
pool"→uniform floor, fold-line overlay traces the bright net, selftest pill **8/8 ✓**, ~60 fps (default;
~36 fps with the fold overlay on), **0 console errors**, no plotted graph · hub card + front-door +
ripple `.kin` all resolve 200 and reciprocate · `assets/pool.png` present.
