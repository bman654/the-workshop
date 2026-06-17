# The Golden Seed-Head — CHANGELOG

## v1 — planted (cycle #93)

The 8th Numbers-Room bench, and the cross-piece between two parents:
**strange-garden/pieces/phyllotaxis** (the pure-art sunflower) and
**best-rational** (φ's continued-fraction ladder, proven exact).

### The one idea
A sunflower lays floret *n* at angle *n·θ*, radius √n (Vogel's model). At the
golden angle θ = 2π(2−φ) the head packs into two interleaved spiral families —
the *parastichies* — and their two arm-counts are always two **consecutive
Fibonacci numbers**, which are exactly two consecutive **denominators q_k, q_{k+1}
of φ = [1;1,1,…]**. Count the arms and you have read the slowest-converging
fraction in mathematics, off a flower.

### Form (no graph anywhere)
- A live Vogel seed-head fills the stage canvas, warm-gold floret ramp (sibling
  to the Strange Garden's phyllotaxis).
- The hero control is a **brass protractor dial** that sets θ, with engraved
  detents at rational turns (½ ⅖ ⅜ 5⁄13 ¼ ⅐) and a deeper **golden** detent at
  137.5°; a magnetic sticky-pull snaps it to golden, shift-drag = fine vernier.
- The two dominant families are auto-tinted (cool-gold CW / warm-amber CCW,
  unclaimed florets dimmed ~35%) and a big readout shows the live integer pair
  "55 ↻ · 89 ↺". Grow N or sweep the dial and the integers **click** up the
  Fibonacci ladder in lock-step, never landing between.
- **Trace** an arm with the cursor: the family under it lights gold and pulses
  (every g-th seed), a counter ticks the arms, and the earned count stamps onto
  the ladder rail. Trace both families → adjacent rungs → a wax-stamp verdict:
  "THESE ARE THE SAME NUMBERS — 55, 89 = q_k, q_{k+1} of φ."
- **Negative control on the same dial:** turn to a rational p/q detent and the
  spirals collapse into exactly q dead-straight radial spokes; the readout flips
  to "q spokes — no spiral pair — CF terminated", the rail strikes through.
- The companion **rail** is φ's convergent ladder as a thin engraved rung stack
  (denominators from the imported `convergentsOf(φ)` core); two brass needles
  rest on the two rungs the arm-counts equal — always adjacent.
- A soft chime on golden lock + per-arm ticks; **muted by default**, never
  load-bearing, fully legible silent. Honors `prefers-reduced-motion`.

### The math, proven exact
`core.mjs` has two **disjoint layers** asserted to agree:
- **(A) the ladder layer** — copied *verbatim* from `best-rational/core.mjs`
  (`cfExpand · cfOfRational · convergents · convergentsOf · fib · gcd`); the sole
  authority for φ's convergents. Pure number theory, knows nothing of packing.
- **(B) the packing/parastichy layer** — new here, shares no code with (A):
  `vogel · familyArms · spokeCountExact · nearestNeighborGaps · dominantFamilies
  · predictedDenominators`. Pure geometry, knows nothing of continued fractions.

`runSelfTest()` (7 claims, integer-exact, no float in any verdict): the ladder =
Fibonacci ratios · spokeCountExact = q/gcd · familyArms.size = g · **the BRIDGE**
(at golden the geometric detector's dominant pair === a consecutive pair of
φ-convergent denominators, Fibonacci AND consecutive AND climbing with N across
N ∈ {200,500,987,1500,2500,4000}) · the negative control (rational → no pair, q
spokes, finite CF) · the trace↔claim bond (the hand-traced count = familyArms = g
= the convergent denominator) · purity (137.3° breaks the consecutive pair).

`core.test.mjs` runs `runSelfTest()` verbatim plus Node-only depth (the bridge
per N, the monotone climb, negative-control teeth, purity teeth, validation) and
the byte-identical re-extraction parity test — **52/52 GREEN**, exit 0. The page
inlines (A)+(B) **byte-identical** between the SEEDHEAD-CORE sentinels.

### Detection note
`dominantFamilies` picks the **top-two gaps by tally** (not "any two Fibonacci in
the list") — at golden the top of the tally is often 3–4 Fibonacci numbers, and
only the top-two-by-count are the consecutive pair the flower actually shows at
that N. They are provably adjacent Fibonacci; the negative control's smear
(137.3° → 21, 97) is real, not cosmetic.
