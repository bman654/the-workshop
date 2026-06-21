# The Transit — changelog

A top-level **observatory POI**: a scored guess-game where a dark planet of random
size crosses a glowing star, and you find it only by the light it steals.

## #248 — born (BUILD/garden, planter)

The estate's first **exoplanet** piece, and the first front-door game whose hunted
quantity is read off a brightness dip you watch in real time.

**The idea.** A star is a uniform luminous disc; a dark planet of radius ρ = R_p/R_*
crosses it at impact parameter b. While it passes, it blocks exactly the *overlap
area* of the two discs, so the star's fractional brightness drop is
`depth = A_overlap / (π R_*²)`. For a **full** transit the deepest point is the whole
planet, π R_p², so **ΔF/F = (R_p/R_*)² exactly** — the dip's depth is the *square* of
the radius ratio, and ρ = √depth. A **graze** (b near 1) is the trap: the planet only
clips the limb, the dip is shallow with **no flat bottom**, and √depth *under-reports*
the size. So the game grades you on the true ρ, never on the naive √(max depth).

**Files.**
- `core.mjs` — the Photometry + GameLoop facets. A single primitive `lensOverlap(R,r,d)`
  (branch-exact: disjoint→0, contained→π·min² with no acos, else the two-acos kite form);
  every quantity derived from it (`depthAt`, `maxDepth`, `transitKind`, `flatHalfWidth`,
  `contactHalfWidth`, `depthFromRatio`=ρ², `ratioFromDepth`=√d). `scoreGuess` grades
  |ρ̂−ρ_true| in fractions-of-truth with an absolute floor (tiny planets winnable);
  `roundScore` applies the 0.15·streak multiplier. `dealPlanet` uses core's `transitKind`
  as the single source of the full/graze label, so the label can never lie. The estate-
  standard `makeRng` LCG and a shared `runSelfTest()` for both the pill and the twin.
- `core.test.mjs` — the Node twin. Runs the 9-leg self-test, then independent
  re-derivations not routed through it: a **third** area route (Monte-Carlo darts) and a
  swept-grid Simpson route both agree with `lensOverlap`; FULL depth=ρ² over a fine ρ×b
  grid; graze strictly shallower over a b-sweep; the inverse pair; zero-dip neg-control
  over an x-sweep; mirror symmetry depthAt(x)=depthAt(−x); caliper-grid winnability over
  2000 deals; streak exactness; the drawn-dip-is-the-graded-truth contract. Plus the
  byte-parity check on the inlined `=== TRANSIT CORE ===` slab. **22/22 green.**
- `index.src.html` / `index.html` — the forged page (byte-true). A 4-phase game
  (WATCH → MEASURE → LOCKED → NEXT): the star dims live as the planet crosses, the hero
  brightness lamp sags (×25 display gain on the puck only; the % and curve show true
  values), the light-curve trough draws the dip with a FLAT-BOTTOM ✓ / POINTED-V badge
  from `flatHalfWidth`; you drag a brass vernier caliper to ρ̂ (a ghost disc on the star
  sizes your guess), lock it, and the gold truth disc reveals over your guess. A sandbox
  toggle lets you drag a known planet first. dimFrac is always read from `depthAt`; the
  score always from `maxDepth`/`scoreGuess` — no re-typed ρ² on the page.
- `verify.sh` — the gate: Node twin, map smoke (transit slot star-clear), forge --check
  --all current, audit-seen drops ws:seen:transit, both reciprocal cross-links resolve.

**Registration.** Front-door PLACES entry (`district:observatory, tier:1,
wing:exoplanets, footprint:tower, prefer:[right,bottom]`) in `index.src.html`; the
matching mirror in `tools/layout/smoke.cjs`'s hardcoded PLACES (so the map smoke
exercises the new slot); reciprocal cross-link **transit ↔ first-light** (a chip on each
topbar; first-light re-forged).

**Honest scope.** Dimensionless, a uniform disc. depth=ρ² is exact only for the uniform
disc; the limb-darkened glow is *depicted for beauty, not modelled*, and no scored/proved
number leans on it. No noise, no orbital dynamics beyond the single impact parameter b.
