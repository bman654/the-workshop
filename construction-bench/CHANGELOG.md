# The Construction Bench — CHANGELOG

## #284 (2026-06-22) — founded: The Impossibility Theatre & the Standpipe

The estate's first straightedge-and-compass STAGE, and the founding bench of a new
grounds wing, **FIGURES YOU CONSTRUCT** (slug `figures-you-construct`, accent `#6f9fc0`),
neighbour to DRAWING ENGINES. Where The Drawing Room draws ONE curve from a fixed
linkage, here you ASSEMBLE a figure from intersections — and watch an impossible move
refuse to land, then land under one flipped tool.

### The show (three beats, opened mid-construction)
- **Beat 1 — you try.** A cream drafting-vellum stage under a faint blue grid, theatre-lit.
  The toolbar is exactly TWO honest primitives: **LINE** (through two existing points) and
  **CIRCLE** (centre + a point it passes through). Every NEW point is born ONLY as an
  intersection (line∩line, line∩circle, circle∩circle) — you cannot place a free dot. The
  trisection of 60° opens ~80% built (two seed rays from O, a ghosted 20° target).
- **Beat 2 — you claim → UNREACHABLE.** CLAIM your point is the trisector and the bench
  runs its exact coordinate against the target's minimal polynomial; it provably misses,
  and the certificate fires **AS THE STANDPIPE** — a brass pipe with rungs welded ONLY at
  the powers of 2 (1·2·4·8·16, linear-in-log). The trisection bead wants degree 3, there
  is NO RUNG THERE, and it hangs glowing red in the gap between rungs 2 and 4 while a
  cartouche engraves the reason: cos20° solves the irreducible cubic **8x³−6x−1**, degree
  3, RRT witness (no rational root), 3 ∤ 2ᵏ ⇒ outside any line-circle program.
- **Beat 3 — reveal.** A brass NEUSIS toggle (marked ruler) lights after the honest tools
  provably miss; the verging move LANDS the degree-3 root exactly, a rung grows at height
  3, the bead seats, and the cartouche flips to **CONSTRUCTED (with neusis)** — the
  certificate VOIDED. The punchline: impossibility is a property of the two HONEST tools,
  not a wall in space.

### The playbill
- **Warm-ups (you can build):** regular pentagon (cos72° → 4x²+2x−1, degree 2, tower 2);
  Gauss's 17-gon (cos(2π/17), minPoly degree 8 = 2³ on the cartouche, tower height 16 = 2⁴).
- **The impossible bill:** trisect 60° (8x³−6x−1), double the cube (∛2 → x³−2), regular
  heptagon (2cos(2π/7) → x³+x²−2x−1) — each stamps UNREACHABLE deg-3, each LANDS under neusis.

### The math core (`core.mjs`, the SOLE authority, DOM-free)
- A coordinate is an **exact expression tree** over an iterated quadratic field tower
  ℚ⊂ℚ(√a)⊂ℚ(√a,√b)…: leaves are BigInt rationals + nested √; nodes +,−,×,÷,√ closed in
  the type, each carrying a float shadow. line∩line stays in the current field; line∩circle
  and circle∩circle introduce AT MOST ONE new √ (the discriminant / radical line) — so the
  field degree is a power of 2 **by construction**, with a rational-square collapse so √4→2
  doesn't inflate the tower.
- `certify(target, {neusis?})` returns the certificate: `{reachable, minPoly, degree,
  irreducible, witness, towerHeight}`. `reachable` is DERIVED (degree a power of 2 for the
  honest tools; degree 3 additionally under neusis). Cubic irreducibility is witnessed by the
  **rational-root test** (a cubic with no rational root is irreducible over ℚ); deg-2/deg-8
  successes are witnessed by the exhibited constructible tower (no over-claim of RRT past cubics).
- `neusisLand(target)` root-finds the degree-3 target to <1e-9 (the verging move as a solve).

### The self-test (`core.test.mjs`, Node twin, exit 0, 19/19)
- **C1** EXACT == FLOAT <1e-9 over 2600 random honest constructions (worst |Δ| = 0).
- **C2** every constructed point's degree is a power of 2 (pentagon→2, √(2+√3)→4, line∩line→1).
- **C3** the three impossibility certificates: 8x³−6x−1, x³−2, x³+x²−2x−1 — each degree 3,
  irreducible, RRT witness, unreachable; 3 ∤ 2ᵏ for k≤64.
- **C4** NEG-CONTROL tool-relative: neusis LANDS exactly the three deg-3 targets the honest
  tools fail.
- **C5** NEG-CONTROL false-equal: a claimed point >1e-2 off fails its minimal-poly root test.
- **C6** DAG invariance: deg-3 stays unreachable under rotation; the perp-bisector is honest.
- **byte-twin parity:** the page's inlined CORE region === core.mjs CORE region (the forge
  guarantees it); the in-page pill runs the SAME `runSelfTest()` → 6/6.

### Footprint & wiring
- New top-level room `construction-bench/`: `core.mjs` · `core.test.mjs` · `index.src.html`
  with `<!-- forge:include core.mjs -->` between the CORE sentinels · the FORGED `index.html`
  (re-emit via `node tools/forge/forge.mjs construction-bench/index.src.html`) · this CHANGELOG.
- Front door: one PLACES entry (`construction-bench`, tier 1, wing `figures-you-construct`,
  footprint `construction-bench`, skyStar, companion "The Galois Cabinet"); a new
  `drawConstructionBench` footprint drawer (drafting table + compass figure + brass standpipe
  with a deg-3 bead hanging in the gap) registered in the dispatch table.
- `tools/layout/layout.js`: `WING_META['figures-you-construct']` + `GROUNDS_WINGS` region
  `{x:1058→790, y:336, w:168, h:232}` (the east-edge band had a catalog star dead-centre;
  re-homed to the genuinely star-free central-east corridor right of the manor). smoke.cjs
  fixture updated; `assertGroundsWingsDisjoint` confirms it disjoint from all 10 grounds wings.

M (bigSwingsBuilt) advances 25 → 26.
