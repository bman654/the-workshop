# The Arctic Circle — changelog

The Gardens' Cold Frame (glasshouses wing). Order has a coastline: a uniformly-random
domino tiling of an Aztec diamond, assembled by domino-shuffling, whose four corners
freeze into forced one-orientation brick-walls while the centre churns — the boundary
between frozen and temperate is, as the diamond grows, the inscribed circle.

## Cycle #307 — BLOOMED (planter, garden track)

Bloom of the `[exhibit]` **The Arctic Circle** seed (sown #303). A top-level
generative/living leaf — kin to the Strange Garden's living systems and Kirigami's
symmetry next door.

### Form (living/generative, NO graph — the thing you press and watch)
- A **brass-framed Aztec diamond** on a dark cold-frame canvas. Each domino is coloured
  by **orientation** (four hues, far apart): **N** ice-blue (top), **S** amber (bottom),
  **W** orchid (left), **E** sea-green (right) — so the four frozen corners read at a
  glance against the multicolour centre.
- **❄ GROW** runs domino-shuffling from order 1 up to the dial — destroy doomed pairs,
  slide survivors, coin-flip fresh pairs into the holes — animating each step, the four
  corners visibly freezing as the centre keeps churning.
- A **SIZE dial** (n = 4..64) ripens it: bigger n, sharper coast, larger frozen corners.
- **↻ Re-roll** samples a fresh uniform tiling at the same size (it's a distribution,
  not one fixed picture); **⏭ Instant** skips the animation.
- A dashed **ghost-circle** overlays the inscribed disk the disorder hugs (toggle).
- A readout cartouche: the live **temperate fraction** with a π/4 target tick on its bar,
  and a **frozen-corners** tile (N S W E in their colours).

### The math core (`core.mjs`, 667 L — the SOLE source of truth, DOM-free)
- **The shuffle** (EKLP): `shuffleStep(gridK, k, rng)` — destruction (bad 2×2 blocks
  pointing into each other), sliding (each survivor moves one cell in its slide vector),
  creation (empty 2×2 holes filled by a fair coin). `sampleTiling(n, rng)` runs it from
  order 1. A deterministic xorshift32 `makeRng(seed)` so the page, the in-page test, and
  the Node twin sample byte-identical tilings.
- **The classifier**: `classifyFrozen` flood-fills the four monochromatic frozen corners
  from the diamond's tips; `temperateFraction` is the churn's cell-share; `cornerReport`
  certifies each corner mono + non-empty. `inscribedRadius(n)=n/√2` drives the overlay.

### Self-test — three cruxes at three registers (each with a neg-control)
- **CRUX-1 (EXACT, per-tiling):** every flood-filled frozen corner is strictly
  monochromatic in its forced orientation (N/S/W/E), in every sample; the four corners
  are pairwise disjoint. NEG-CONTROL: a corrupted cell inside the top corner is detected.
- **CRUX-2 (MEASURED, asymptotic):** the temperate fraction climbs **monotonically**
  toward **π/4** as n grows (the inscribed disk is π/4 of the diamond by area), within a
  named band — stated as a measured-over-large-n claim, NOT an exact equality.
  NEG-CONTROL: a deterministic all-frozen brick-wall reads temperate fraction **0**.
- **CRUX-3 (EXACT, sampler-sanity):** order-n admits exactly **2^(n(n+1)/2)** tilings —
  an exhaustive small-n backtracking enumeration matches the formula (n=1..5), catching a
  biased shuffler; a uniformity histogram reaches all 8 (n=2) and all 64 (n=3) tilings.
- In-page pill **7/7**; Node twin `core.test.mjs` **18/18 ALL GREEN** (exit 0) with deeper
  cross-checks (validity to n=48, CRUX-3 to n=5, corner-disjointness, a 24k/64k-draw
  uniformity sweep, seed determinism).

### Honesty notes
- WHICH cells freeze is asymptotic (at tiny n the disorder can reach a tip), so CRUX-1's
  exact per-tiling invariant is stated as "any brick-wall the tip-flood reaches is
  monochromatic in the tip's forced orientation" — true for every n — and the page's
  frozen-corners tile reads "forming…" only when a corner hasn't formed.
- CRUX-2's convergence is genuinely slow (the frozen↔temperate boundary fluctuates at
  scale n^{2/3}); the claim is monotone-toward-π/4 within a generous band, never exact.

### Front-door registration
- New PLACES entry `arctic-circle` (The Gardens · Cold Frame, ❄️, accent #bfe6ff),
  district `grounds`, tier 2, wing `glasshouses` — kin to Strange Garden / Tessellarium.
  Drops its own `ws:seen:arctic-circle` breadcrumb (forge --audit-seen --strict clean).
- forge regenerated; `forge --check --all` clean (94 files); sky 73/73; layout smoke
  exit 0. No catalog star minted (a content-only no-op skyStar; the bench lights nothing
  in the Survey of Heaven, matching siblings that don't claim a hand-placed star).
