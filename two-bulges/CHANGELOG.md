# The Tide Wheel — CHANGELOG

## #268 — first bloom: why two high tides a day, as a turnable orrery-of-water

**What it is.** A top-down, single-canvas orrery you turn with your hand. A blue Earth-disk wears its
ocean as a deformable cyan **shell**; an amber Moon-bead rides a dashed orbit. **Grab the Moon and spin
it around** (slow auto-orbit by default so it is alive before you touch it; arrow keys advance it;
`prefers-reduced-motion` stills the auto-orbit and lets the drag stand). Both tidal bulges track the
bead in real time — the **near** one toward the Moon, the **far** one pinned exactly 180° opposite on
the same axis. The answer to the room's title — *why two high tides a day?* — is acted out, not asserted.

**The hero "why" — the REVEAL knob.** A single slider 0→1 paints ≤36 arrows on the ocean ring:

```
arrow_shown(θ) = moonAccelAt(point(θ), d) − REVEAL · centreAccel(d)
```

with a dashed **ghost centre-arrow** at the hub always showing the quantity being subtracted.

- **REVEAL = 0** — every arrow points Moon-ward, longest near, shortest far. *The Moon pulls the whole
  ocean toward it. So why two bulges?*
- **dragging up** — the arrows shrink and rotate: near stays outward-toward-Moon, **far flips
  outward-away**, the equator curls inward.
- **REVEAL = 1** — the pure tidal residual: two outward stretches along the axis, an inward squeeze at
  the sides. *Subtract the average pull and what is LEFT is a stretch, outward at both poles. Two bulges.*

**The coast flag + tide gauge.** A flag pinned at a fixed coast reads the water **depth** off the very
blob you see and draws it as a live tide-gauge strip beside the wheel (a gauge, not a pre-plotted curve).
A HIGH counter ticks each time the flag passes a bulge — one Moon-lap → **2 highs, 2 lows**. Caption
honesty: dragging the Moon advances the **relative** Earth–Moon angle; a real day's two tides come from
**Earth rotating** under the Moon-locked bulges (geometrically the same picture).

**Two more controls.** A **MOON-DISTANCE** slider lands the 1/d³ gut-punch — pull close and the bulges
balloon, with a felt readout (*"2× closer → tide ×8"*). A **UNIFORM-FIELD** neg-control replaces the
1/d² Moon with one constant pull — **same strength, no gradient** — and the residual collapses to nothing,
the arrows vanish, the ocean relaxes to a perfect circle, the coast goes flat. *Same pull, no gradient,
no tide. The bulge IS the difference.*

**The frame (the contract every facet obeys).** Earth's centre at the origin, ocean radius R = 1; the
Moon on the +x axis at distance d > R; G = M = 1. A surface point at angle θ (from the Earth–Moon line)
is `point(θ) = [cosθ, sinθ]`. `moonAccelAt(P,d) = (Moon−P)/|Moon−P|³`; `centreAccel(d) = [1/d², 0]`;
`tidalResidual(θ,d) = moonAccelAt(point(θ)) − centreAccel(d)` — THE TIDE. The equilibrium ocean shape is
`bulgeHeight(θ) ∝ 3cos²θ − 3/2` (P₂, mean-subtracted on the ring so it conserves volume). The one screen
y-flip lives only in the render layer; the core is pure, DOM-free, and never flips y.

**The honesty (a hard, non-negotiable requirement).** The near and far bulges are equal **to leading
order only**, not exactly — the near one is a hair bigger (`+3R²/d⁴`). The leading stretch
`leadingStretch(d) = 2GMR/d³` is exactly ∝1/d³; the FULL field's near/far ratio converges to 8 *from
above*, monotonically (convergence, not faked exactness). The prose says "equal to leading order" and the
test tolerances are a deliberate `c·(R/d)` bound, **never machine-ε** — asserting exactness there would be
a lie. The blob is the **equilibrium static tide** (no lag, basins, or continents), drawn at a labelled
visual **GAIN** because real tides are microscopic next to Earth's radius.

**Proven.** `two-bulges/core.mjs` is the sole authority, inlined byte-identically into `index.html` (forge
include + CORE sentinels). An in-page pill shows ✓ 6/6 and `node two-bulges/core.test.mjs` exits 0,
re-deriving each claim a second independent way (hand-rolled vectors) and byte-twin-checking the page's
slab === core.mjs:

1. **STRETCH SIGNS** — `tidalAlongAxis(0) > 0` (outward near), `tidalAlongAxis(π) < 0` (outward-away),
   `tidalAlongAxis(π/2) < 0` (squeeze), over a d-sweep. The quadrupole, as signs.
2. **NEAR≈FAR TO LEADING ORDER** — `|near|/|far| → 1` with `|ratio−1| < c·(R/d)` (bounded, ≠ 0); each
   magnitude agrees with `2GMR/d³` to O(R/d). HONESTY guard: near ≠ far exactly.
3. **1/d³ SCALING** — `leadingStretch(2d) === leadingStretch(d)/8` to <1e-9; the full-field ratio → 8
   monotonically from above (convergence, not exactness).
4. **UNIFORM NEG-CONTROL** — `uniformResidual(θ) ≡ [0,0]` exactly (machine-ε) ∀θ ∀d; uniform bulge ≡ circle.
5. **P₂ SHAPE** — peaks equal at θ=0 and θ=π to <1e-12, minima equal at the sides, angular mean 0
   (volume-conserving), plus the magic-angle pinch: the un-offset `3cos²θ−1` zeros at `±arccos(1/√3) = 54.7356°`.

Plus domain guards (d ≤ R, non-finite d, a point at the Moon → NaN) and byte-twin parity.

**Kin (never imported).** Sibling to the **Orrery** (the real Moon wheeling the real Earth; reciprocal
cross-link both ways) and to **The Tidal Field** in the Stellar Forge (the same tidal gradient taken to the
Roche limit, where it tears a moon into a ring). The tidal-field core stays an independent file — same
physics family, different register. Sits in the observatory's *celestial-mechanics* wing beside the
Equal-Area Sweep and the Einstein Ring.

**Scope cuts (explicit).** No split-stage beach / side-on coast cross-section — the on-rim flag + tide
gauge carries the double-high payoff. No Sun / spring–neap this cycle — left as a follow-on seed.

**Files.** `core.mjs` (the DOM-free authority), `core.test.mjs` (the Node twin), `index.src.html` →
forge'd `index.html`, this `CHANGELOG.md`. Registered in the front-door PLACES (observatory ·
celestial-mechanics · tower) with a reciprocal Orrery cross-link.
