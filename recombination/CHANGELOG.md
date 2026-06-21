# The Fog That Cleared — CHANGELOG

## Recombination (founding) · cycle 259

The cosmology wing's second room (tier 1, footprint tower), sibling to **First
Light** in the observatory's observatory-rise precinct. Where First Light dilates
the patch with no middle, this room shows the **same cooling universe one step
later**: the moment the fog let the light go.

### The form (the soul-verb = COOL)
A brass-edged box of hot plasma sits on the dark sky-field: **cyan-white free
electrons** sparking everywhere, **trapped light** unable to fly a step without
scattering off one — the box is OPAQUE, a glowing **fog you can see**. The single
gesture is the soul: pull the brass **T-collar DOWN** and the box COOLS.

- **The brass temperature collar** (right rail, log-τ range straddling τ*, a bright
  cream tick on the track where the recombination line sits). Pull down to cool —
  the temperature is what your hand did, not an abstract slider.
- As you cool, electrons find protons and fall into **neutral amber atoms**
  (RECOMBINATION). Captured sparks TWEEN cyan→amber toward a proton over ~250ms, so
  you SEE capture, not deletion. The drawn electron count = round(N_MAX·xₑ); xₑ from
  the core's Saha solver.
- **The fog is no hand-faked fade.** Its opacity is Beer–Lambert off the REAL mean
  free path: `alpha = 1 − exp(−L/λ)`. As xₑ collapses, λ→∞, and the scrim dissolves
  on its own. Measured: alpha 0.63 hot → 0.39 at τ* → 0.0000 cold.
- **The SNAP + CMB flash.** The instant the pull makes `isTransparent(τ)` flip true,
  the trapped light releases to straight rays and a radial **warm-cream wash** (the
  ancient light) blooms over ~1s, then settles to a thin halo. Re-heat re-traps — the
  threshold is reversible, and the neg-control proves it by hand.

### The tracked photon — picture === proof
One bright disc inside the box. Its step length is `min(meanFreePath(τ), cap)` — the
SAME λ the panel prints. Above τ* it scatters off a free electron almost every step
(`photonScatters` reads the core's xₑ): a dense zigzag **scribble going nowhere**,
ricochet counter live. Cool past τ* and it locks a straight outward heading and flies
**dead-straight out**, warm→white→**CMB cream** as it escapes. It auto-relaunches a
few seconds after escape so a visitor landing below threshold still sees the
transition. The caption reads the λ value from the SAME `meanFreePath` call.

### The instrument rail
Live rows for **kT** (τ = kT/χ), **xₑ** (free-electron fraction), **λ = 1/(nₑσ)** in
box-widths, **optical depth τ_opt = L/λ**, and **state** (OPAQUE/TRANSPARENT). Plus a
horizontal **log λ-bar** with a fixed threshold tick at λ = CLEAR_LAMBDA box-widths
that the fill races past and pins — you WATCH λ blow up exactly as the fog and the
glyph let go. Every number comes from the single `meanFreePath(view.tau)`.

### The neg-control (load-bearing, on-canvas)
A `.btnrow` toggle **✓ cool through recombination** vs **✗ hold the box HOT**.
Hold-hot PINS `view.tau = SCENE.tauHot` (feeding the SAME meanFreePath/photonScatters
path — no separate frozen branch), **greys the collar**, and shows an on-canvas badge
*"held at τ — waiting…"* with a ticking elapsed timer. No matter how long it runs:
xₑ stays high, λ bounded, the fog never thins, the photon keeps ricocheting. Caption:
**transparency is born of RECOMBINATION — crossing the temperature line — NOT of mere
elapsed time.** (Time is not in the model; only τ is.)

### The physics core — a dimensionless Saha equation
Work in reduced temperature **τ = kT/χ** (χ ~ 13.6 eV is the illustrative axis unit,
never defended). The ONE declared illustrative constant is `SAHA_A = 1e9`.

- `sahaS(τ,A) = A·τ^(3/2)·e^(−1/τ)` — the Saha ratio.
- `ionizedFraction(τ,A)` solves the Saha quadratic xₑ²/(1−xₑ)=S using the
  numerically **STABLE root** `xₑ = 2S/(S+√(S²+4S))` — NOT the subtractive
  `(−S+√(S²+4S))/2`, which catastrophically cancels for tiny S and goes non-monotone
  in float. The stable form is monotone to xₑ ≈ 1e-43 (verified).
- `meanFreePath(τ,A) = L0/xₑ` (diverges as xₑ→0). `opticalDepth = L/λ`.
- `crossingTau(A)` — bisection for xₑ=½ ⇔ S=½ (τ*≈0.058 at A=1e9), recomputed per-A
  so NO claim references an absolute temperature.
- `isTransparent(τ)` — the ONE shared predicate (λ ≥ CLEAR_LAMBDA). The glyph escape,
  the fog dissolve, AND the SNAP/flash all read THIS, firing at the SAME τ.
- `photonScatters(τ, stepFrac)` — pure: `stepFrac < min(1, xₑ)`. The render layer owns
  the seeded RNG and passes stepFrac in; the core stays pure (no RNG, no wall-clock).

### The self-test — FOUR claims, swept over SAHA_A ∈ {1e6, 1e9, 1e12}
1. **A · λ DIVERGES as xₑ→0** — cold-end λ > 1e6·λ(crossing), xₑ(cold) < 1e-6, per-A.
2. **B · λ MONOTONE-INCREASING as T falls** — sweep τ DOWN starting BELOW the xₑ≈1
   plateau (where the strict comparison would trip on the flat top), strict λ↑. Backed
   by the analytic note d/dτ[(3/2)lnτ − 1/τ] > 0 ⇒ S↑ ⇒ xₑ↑ ⇒ λ ↑ as τ↓.
3. **C · NEG-CONTROL held hot ⇒ λ BOUNDED** — at τ=tauHot, λ finite & small, xₑ > ½
   (still a fog), never transparent. Time never enters the model.
4. **D · picture === proof** — photonScatters HIGH above τ* (trapped), LOW below
   (streaming), wide margin. The glyph reads the SAME function.

In-page pill GREEN 4/4; `node recombination/core.test.mjs` exits 0 on **15/15** checks.

### The Node twin (core.test.mjs)
`[shared]` runs the SAME `runSelfTest()` the pill runs and mirrors its verdict. Then
re-derives each claim a SECOND way: the stable Saha root agrees with an **independent
Newton solve** of xₑ²/(1−xₑ)=S to < 1e-12 (measured worst rel ~3e-16); monotonicity
re-proven via the **sign of the finite-difference derivative of S(τ)** (dS/dτ > 0
across the band); held-hot λ bounded with τ_opt high; picture-proof consistency direct
from xₑ. **BYTE-TWIN parity:** index.html's inlined `// === RECOMBINATION CORE
BEGIN/END ===` slab is byte-identical (indentation-normalised) to core.mjs, char counts
match (8616 vs 8616) — region()/norm() helpers copied from first-light's twin verbatim.

### Hawking-honesty
By the collar + the engraved footer: *"Dimensionless Saha model in reduced τ=kT/χ;
constants DECLARED illustrative — this defends the SHAPE of recombination (a sharp
ionization crossing), not any recombination temperature. λ = 1/(nₑσ) · τ_opt = L/λ ·
xₑ→0 ⇒ λ→∞ ⇒ the box clears · a HOT box never crosses, never clears."* The τ axis is
annotated *"τ = kT/χ, χ ~ 13.6 eV (illustrative)."*

### The four-file forge
- `core.mjs` — the SOLE recombination authority, pure & DOM-free (sentinel-fenced).
- `core.test.mjs` — the Node twin, re-deriving every claim a second way + byte-parity.
- `index.src.html` → forged `index.html` byte-true (CORE BEGIN/END sentinels inlined
  byte-for-byte; `forge --check` passes).
- this `CHANGELOG.md`.

### Integration
- New top-level `recombination/`; PLACES entry in `index.src.html` AND
  `tools/layout/smoke.cjs` as `{district:'observatory', tier:1, wing:'cosmology',
  footprint:'tower', prefer:['left','bottom']}` — the second room in the cosmology
  wing First Light minted. `node tools/layout/smoke.cjs` passes (exit 0; the
  full-plate crowding warning is the intended #103, not a failure).
- **Reciprocal cross-link with First Light:** this page's topbar carries a warm
  `↗ First Light · the patch dilates, then the fog clears` chip; First Light's topbar
  gains a reciprocal `↗ The Fog That Cleared` chip (re-forged). Both hrefs resolve 200.
- Drops `ws:seen:recombination` on direct visit (forge --audit-seen ✓).
- Browser-verified: pill GREEN 4/4, clean console (only the self-test log line), 61fps,
  the SNAP fires on cooling past τ* (λ → 4e13 box-widths, photon flies free), and the
  held-hot neg-control keeps the box opaque (xₑ=1, λ=1) while the timer ticks.

### Publish-pass polish (cycle 259)
Fresh-eyes review caught a responsive collision: at laptop widths (≤~1440px) the long
First-Light cross-link chip forces the topbar's `.brand` to wrap to a second line, where
the gradient `<h1>` landed directly on top of the on-canvas `.wing-title` caption — and
that caption repeated the title verbatim, so the room name printed twice, overlapping, in
the top-left. Fixed by (1) dropping the redundant `.w` title line from the wing-title (the
title lives once now, in the topbar h1) and (2) nudging `.wing-title { top: 58px → 84px }`
to clear the topbar's natural 2-line wrap. The caption is now purely the on-canvas
description. Verified no overlap at 1280/1440 (and unchanged at 1920, single-line topbar);
self-tests still GREEN. The IDENTICAL collision in the sibling **First Light** was fixed
the same way, keeping the cosmology wing's two rooms coherent.
