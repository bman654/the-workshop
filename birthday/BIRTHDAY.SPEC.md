# The Birthday Bench — SPEC

*The Numbers Room's 23rd bench. The birthday paradox, made a thing you SEAT, with zero probability
curve anywhere.*

## The soul

A pegboard of **d brass pegs** (one per calendar day, 365 by default) hangs above a growing **oak
bench**. Seat guests one at a time; each walks up, reaches for the peg of their birthday, and hangs a
luggage-tag. You'd guess the bench fills past a hundred before two reach for the same peg — *half of
365 is 183, surely* — but around the **23rd** guest a peg **RINGS**, a real clang. The surprise is
**spatial**: the bench freezes at the surprise count beside a faint ghost-row of ~180 chairs you will
never reach. No curve is ever plotted.

The wonder is exact, not vibes: a clash needs only **one coincidence among the C(n,2) pairs** of
guests, and pairs grow like n², so the crossing of ½ happens at ~√d, not d⁄2.

## The math core (`core.mjs` — the SOLE authority)

A sentinel-fenced slab `// ===== BIRTHDAY CORE … =====` … `// ===== END BIRTHDAY CORE =====` is
inlined **byte-identical** into `index.html` via the forge (`<!-- forge:include ./core.mjs -->`); the
`export {…}` list sits OUTSIDE the fence (the forge strips it), so byte-parity covers the LOGIC, not
the module syntax (the buffon precedent).

Functions:

- `makeRng(seed)` — xorshift32; `seed===0` reseeds to `0x9e3779b9` (xorshift is stuck at 0).
- `pickPeg(rng, d)` — `(rng()*d)|0`, a uniform birthday. The SOLE consumer-facing draw off the stream.
- `pNoClash(n, d)` = ∏_{i=0..n−1} (d−i)/d — exact P(first n guests all distinct).
- `pClash(n, d)` = 1 − pNoClash.
- `thresholdN(d)` — the smallest n with `pClash(n,d) ≥ ½`: the **MEDIAN** first-clash guest (an integer).
- `seatUntilClash(rng, d, cap)` — seats off the stream until a repeat; returns the first-clash count.
- `seatSteps(rng, d, cap)` — a generator yielding `{guest, peg, clash, with}` one guest at a time.
- `runSelfTest()` — returns `{ok, passed, total, checks}`.

### The eight in-page checks (all exact / integer)

1. `thresholdN(365) === 23` — the median first-clash.
2. `P(clash @ 23) ≈ 0.507297 > ½`.
3. `P(clash @ 22) ≈ 0.475695 < ½`.
4. A Monte-Carlo of the **SAME** xorshift32 seating (deterministic seed, N≈200k) converges to the
   exact `pClash(n,365)` for every n≤40 within `tol = 5/√N`. The pixels and the proof are one process.
5. Neg-control **d=1**: `pClash(2,1) === 1 && thresholdN(1) === 2` (the one-day world rings on guest 2).
6. The log-log slope of `thresholdN` vs d over a ladder ≈ ½ (asserted as a band `0.45 < slope < 0.55`)
   — the **√d trend**, not a point.
7. The ~1.2 constant anchor: `thresholdN(365)/√365 ∈ (1.15, 1.30)` (measured 1.204).
8. The MC median first-clash `=== 23` — the empirical twin of `thresholdN`.

**CRITICAL:** `thresholdN` is the **MEDIAN**. We never assert `E[N] ≈ 1.2·√d` — the MEAN is
`1.2533·√d = 23.94` for d=365, a different quantity.

### The Node twin (`core.test.mjs`)

(A) runs `runSelfTest()` (8 checks); (B) adds a **1/√N decay sweep** (N∈{50k,200k,800k}, the seating-MC
maxdev's log-log slope ∈ [−0.6,−0.4]) and a **wider √d-trend fit** (14 d-values, slope ∈ [0.47,0.53]);
(C) extracts the sentinel slab from both `core.mjs` and `index.html` and asserts **byte-equal**.
`node birthday/core.test.mjs` exits 0.

## The touchable scene (`index.src.html` → `index.html`)

Pure **SVG** (viewBox 1200×760), no canvas. Warm oak/brass palette. Three stacked physical objects:

- **PEGBOARD** (top): d brass pegs in a tidy grid; month ticks + a JAN…DEC hairline at d=365; peg
  radius and grid shrink above 365 so d=1000 isn't cramped; d=1 collapses to a single peg.
- **OAK BENCH** (middle): seats only the guests so far, plus a faint **ghost-row of ~180 empty chairs**
  to the right labelled "…you'd have guessed about here" — so the *so-FEW-chairs* surprise is spatial.
- **BRASS APRON** (bottom): engraved COUNT plates — CHAIRS USED, THE PEG THAT RANG `[Jul 26 · #16 ✦ #21]`,
  TAGS HUNG — plus the **twin-needle √d gauge** (live median rides round(1.2·√d)), the **party tally**
  (engraved last-20 clash-counts + a physical bead-stack histogram, one bead per party at its column,
  never a smoothed line), a "median 23" token, and a "½·365=183" hairline far right sitting **empty**.

### Interaction

- **seat next guest** (Space / button) → consumes `seatSteps()`/`makeRng(seed)`; the page NEVER draws
  a birthday or judges a collision — it dresses `{guest,peg,clash,with}` as a walking guest who hangs a
  tag (soft "tok") or fires the **CLANG**.
- **seat 'til it rings** auto-steps (~280ms).
- **THE CLANG** (the earned moment): the contested peg flashes + scales 1→1.8→1 with a 3-ring
  shockwave, both pegs flash, a brass arc joins them, the pegboard shakes ±2px, CHAIRS USED freezes
  (solid brass border + engraved ✓), THE PEG THAT RANG stamps the date + both guest numbers, and the
  ghost row dims. An optional gated WebAudio metallic strike (off by default, "♪ clang" toggle, honors
  `ws:pref:muted`, no asset).
- **fill the bench** lever (Enter): drops a FRESH party (new seed) that auto-seats rapidly (~40ms/guest)
  until the next clang — each pull lands a fresh ~23, the law "again and again."
- **the dial** sweeps d over `[1, 64, 128, 256, 365, 512, 1000]`, rebuilding the pegboard and the gauge.
- **NEG-1** (d=1): a single peg; guest 2 always rings it, deterministic.
- **NEG-2** (test the 183 guess): seats a representative party near the median 23 while the tarnished
  "183" plate is struck through — intuition visibly fails by ~8×, an order of magnitude.

### Critical coupling (anti-drift)

The **seating stream** (`pickPeg` via `makeRng(seed)`) is **sacrosanct** — only `seatSteps`/
`seatUntilClash` consume it. All animation jitter/timing draws from a SEPARATE rng or `Math.random`,
so an on-screen party byte-matches a twin replay of the same seed. The in-page pill runs the inlined
`core.runSelfTest()` (the 8 math claims) plus a few page DOM-wiring checks (365 pegs rendered, the page
generator's first-clash === core's, sentinels present, dayLabel mapping).

## Registration

- `ws:seen:birthday` crumb dropped on direct visit (forge `--audit-seen` clean).
- **Numbers Room**: a 23rd `<a class="bench exact" href="../birthday/index.html">` card (🎂); the four
  counts bumped together (prose 21→23, comment + check 22→23, exact 19→21); a present-check added.
- **Front door**: a PLACES entry `{ id:"birthday", footprint:"birthday", district:"grounds", tier:2,
  wing:"number", … }` + `drawBirthday(g,r)` registered in the DRAW object (a footprint with no DRAW key
  throws and breaks the whole map render).
- **Sibling link**: birthday ↔ galton (reciprocal `.kin` / `.bb-sib`); the second neighbour is the
  Numbers Room itself. No forced sandpile/latin-square links (no probability kinship).

## Definition of done

`node birthday/core.test.mjs` exits 0 · `node tools/forge/forge.mjs --check --all` passes ·
`--audit-seen` clean · the in-page pill is green (12/12) · the front door renders the footprint without
throwing · all cross-links resolve 200 in-repo and reciprocate.
