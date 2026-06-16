# The Sandpile — changelog

The seventh bench of the Numbers Room. The abelian sandpile model, made touchable: pour grains
onto a 33×33 grid, watch one grain start an avalanche that crosses the whole pile, and — the
headline — watch two copies of the same unstable pile settle in two different firing orders and
land **byte-identical**. Order-freedom is the abelian theorem; it turns these heaps into a finite
abelian group with a single recurrent identity **e**.

## Architecture (euclid-engine triad)

- **core.mjs** — the single source of truth, between `// === CORE BEGIN ===` / `// === CORE END ===`.
  `mulberry32` (seeded PRNG) · `neighborsOf` / `unstableIndices` · order policies (`pickFirst`,
  `pickLast`, `pickRandom`) · `toppleToStable` (the correct rule, returns grid + topple count) ·
  `toppleSteps` (a step generator the page animates against — the watched cascade IS the core path) ·
  `add` / `combine` (the ⊕ group op) · `maximalStable` / `identity` (Creutz's burning trick) ·
  `toppleStateDependentToStable` (the negative control).
- **index.html** — the touchable piece. The CORE region is inlined **byte-identical** between the
  same sentinels; the page reads its physics only from that inlined core. Four escalating
  interactions: ① drop/drag-paint a grain (live cascade off `toppleSteps`); ② rain / drop-1000 /
  hold-to-rain with a drama HUD (live avalanche-size meter, eruption flash, scrolling size-log,
  "biggest yet" trophy, muted WebAudio thud); ③ **topple it twice** (two twins, row-major vs
  shuffled, land byte-identical with a "✓ identical · both took N topples" stamp + reshuffle); ④
  **reveal the identity e** (lazy + cached, fourfold-symmetric mandala, `e ⊕ e → e`). A collapsed,
  EMPIRICAL-flagged log–log size-distribution side-rail (a fit, not a theorem; finite-size cutoff).
- **core.test.mjs** — the Node twin (zero-dep). GREEN exit 0.

## Claims & self-test (mirrored in the in-page pill and the Node twin)

- **ABELIAN (exact, the soul):** 300 random unstable piles × 6 firing orders (row-major, reverse,
  4 seeded shuffles) all stabilize to a **byte-identical** final grid, all cells ≤ 3. BONUS (Dhar):
  the total topple count is identical across orders too — verified 300/300.
- **IDENTITY (exact):** `e = identity(L)` is stable; `e ⊕ e === e` byte-identical at 13×13, 33×33,
  and 41×41; and `e ⊕ x === x` for a recurrent `x` (e is the neutral element).
- **NEGATIVE CONTROL (discriminating):** the **state-dependent** topple rule — split the 4 shed
  grains 2·1·1·0 by the neighbours' *current* heights — **breaks** byte-identity across orders
  (300/300 piles order-dependent). The test reds if this control ever passes.
  - *Why fixed-vector controls were rejected:* any state-blind fixed topple vector (double-count one
    neighbour, leak-only-3, etc.) stays **confluent** — byte-identical across every order (proven:
    300 piles × 6 orders, allSame:true) — so it would ship a silently-green control that proves
    nothing. The lesson the control teaches *is* the theorem: order-independence is exactly the price
    of a state-blind spill.
- **EMPIRICAL (asserted as a NON-claim):** the avalanche-size distribution is sanity-checked as
  heavy-tailed (max ≫ median); no power-law exponent is asserted, and the finite grid truncates the
  tail (finite-size cutoff). Kept honest, never the headline.
- **BYTE-TWIN PARITY:** the CORE region of index.html is asserted byte-identical to core.mjs.
- **Hand anchors:** a 3×3 center cell at 4 topples exactly once (4 neighbours +1); a 3×3 corner at 4
  loses 2 grains to the sink; neighbour counts (interior 4, corner 2, edge 3).

## Registration

- Added as the 7th `.bench.exact` card on the Numbers-Room landing; bench count bumped 6→7 in the
  hero lede, the footer prose, and the landing self-test (`benches.length === 7` + a new
  "Sandpile bench present" check, so a partial edit reds rather than silently lagging).
- Twin cross-links wired both ways with the Strange Garden's contemplative big-pile sandpile mandala
  ("watch the mandala settle" there vs "poke it and prove it forgets" here).
- Front-door breadcrumb: `ws:seen:sandpile`.

## History

- **2026-06-15** — built fresh on the euclid-engine pattern (cycle #56). Backbone = "topple it
  twice" headline; A's travelling-wavefront render (per-cell `lastToppledFrame`, flat fill +
  additive bloom, no DOM-per-cell); B's drama HUD. core.test.mjs GREEN, 21/21, exit 0.
