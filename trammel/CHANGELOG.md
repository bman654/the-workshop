# The Trammel of Archimedes — Changelog

A working **trammel of Archimedes** (the ellipsograph): a rigid rod whose two
pins are captive in two slots that cross at right angles. Pin the constraint and
a pen fixed at station `d` along the rod has **no choice** but to trace a perfect
ellipse — `x²/a² + y²/b² = 1`, with the semi-axes exactly the two rod-segments
(`a = |L−d|` on the X-slot, `b = |d|` on the Y-slot). The curve is **computed by
the linkage**, not plotted point by point — a theorem in brass. Kin to The
Spirograph (gears) and The Planimeter (a rolling wheel) — the third of the
Workbench's brass drawing-engines.

## 2026-06-19 — v1 (initial build, cycle #173)

### What it is
- A self-contained `trammel/` piece: `index.html` (~870 lines, inline CSS +
  canvas + vanilla JS, no build/libraries/network), plus a `core.mjs` math
  authority and a `core.test.mjs` Node twin. Reuses the Planimeter's
  brass/blueprint/boxwood skin, topbar, panel, HUD, self-test chip, 2× PNG.
- Lives on the Workbench in the **drawing-engines** vein, immediately after The
  Spirograph; no front-door/map footprint, a uniform `ws:seen:trammel`
  breadcrumb like its siblings.

### The mechanism (real, not faked)
- **Canonical convention (LOCKED in `core.mjs`):** `pinA = (L·cosθ, 0)` on the
  X-slot, `pinB = (0, L·sinθ)` on the Y-slot; the pen at station `d` from pinA
  sits at `((L−d)·cosθ, d·sinθ)`. So `a = |L−d|` (X), `b = |d|` (Y), and the
  predicate is `x²/a² + y²/b² = 1`.
- **The page draws ONLY what the core returns.** The core block is **inlined
  byte-for-byte** between sentinels in `index.html`; `core.test.mjs`
  byte-parity-checks the page copy against `core.mjs`, so the rendered mechanism
  can never drift from the proven math. Skins are cosmetic and never touch
  geometry.
- **`tracedPoint(L,d,θ)`** is the exact closed form the page animates — no trig
  on a slot angle, just the mechanical position. This is why the LINE degeneracy
  is a HARD `=== 0`: at `d=0` the y-term is `0·sinθ === 0` for every θ; at `d=L`
  the x-term is `0·cosθ === 0`.

### Two hero verbs
- **CRANK** — drag the rod angularly about the slot-cross; `dθ` is unwrapped,
  with inertial coast under per-second friction (killable on a new grab; a
  near-origin twitch guard). The pen lays a glowing ellipse trail.
- **MORPH** — drag the bead / the station slider; magnetic detents snap to
  **CIRCLE** at `d = L/2` (`a === b`, `c === 0`) and to **LINE** at `d = 0` /
  `d = L` (one axis vanishes; HARD `0`).

### Two witnesses + a falsifier (the "if-math, prove-it" register, in moderation)
- **On-ellipse residual** — every traced point satisfies the predicate to
  machine precision.
- **Gardener's string** — toggle foci tacks + two taut strings; the focal sum is
  pinned to `2·max(a,b)` — a second, independent proof that the linkage draws a
  TRUE ellipse (constant focal sum).
- **Tilt-a-slot (break the promise)** — knock the Y-slot off square and the hot
  trail peels away from the dashed ghost ellipse; the fit residual blows up
  (`≫ ε`) and the page says so. Set the tilt back to 0° and it snaps home.
  Exactness needs the slots EXACTLY perpendicular.

### Verification
- `node trammel/core.test.mjs` → **19/19 checks pass**, byte-parity IDENTICAL.
  Re-runs the page self-test plus HEAVY independent sweeps (12 `(L,d)` pairs ×
  8000-step θ + 1000 random draws).
- In-page self-test chip: **"trammel verified — 7/7 ✓"**. WITNESS-1 on-ellipse
  `maxResid ≈ 4.4e-16`, WITNESS-2 focal-string `maxResid ≈ 1.8e-15`; CIRCLE
  `a===b & c===0` exact; LINE hard `0`; NEG-CONTROL every tilted φ FAILS `>1e-6`
  (min tilted residual `2.5e-1`); MONOTONE morph.
- Fresh-eyes publisher review (cycle #173): auto-sweep lays a clean amber
  ellipse, 0 console.assert failures / 0 JS errors over a full sweep; morph to
  circle reads residual `0.0e+0`; LINE degeneracy reads `0.0e+0`; Tilt at 28°
  reads `fit residual 1.4e-1 ≫ ε` and snaps home at 0°; gardener's string draws
  foci + taut strings; all three skins work; 2× PNG export downloads
  `trammel_L<L>_d<d>.png`; no horizontal overflow at 1400px or 390px (mobile).
