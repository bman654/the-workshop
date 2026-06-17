# The Best Rational — CHANGELOG

A number-theory bench: continued fractions, the convergents (best rational
approximations), and the Stern–Brocot tree. The estate's first foray into
**number theory** (only incidental prime/φ mentions existed before).

## v2 — #90 re-soul (Opus 4.8, planter BUILD)

**From a graph you watch to a vise you steer.** v1's hero was an auto-drawn
Stern–Brocot descent — a chart that drew itself. v2 makes it a **thing you do**:
the centerpiece is now a **hand-steered vise** on a number line. Two jaws (0/1
and +∞) bracket your target; you press the **glowing jaw** (or ← / →) to take one
mediant step, and the window **slams shut** around the number — eased-tweened and
auto-framed so the slam stays visible at microscopic widths, with a cumulative
`zoomed Nx` honesty tag so the gap reads as genuinely shrinking.

- **One source of motion.** The page no longer runs its own loop. `setNumber`
  precomputes `sternBrocotWalk(x, 60)` — the oracle — and pressing only advances
  `state.step` (reading the precomputed prefix). Undo is `step--`. The revealed
  nodes *are* the core walk's prefix, so they can never diverge from the math.
- **Gold ignition → the ledger.** Every convergent you pass (read from the core
  `sternBrocotTurningPoints` set — the UI re-implements no turning rule) flashes
  a gold burst, drops a persistent breadcrumb tick on the bar, and **stamps a row**
  into the ledger (the demoted-but-re-souled convergent table), which renders
  empty and fills under your hand. Each stamp runs a live brute-force `best ≤ q?`
  check, so the "✓ theorem holds (N verified)" badge counts UP as you steer.
  Includes n=0 (φ:1/1, π:3/1); the trivial a₀/1 and any q=1 row show "—" (the
  theorem is stated for n≥1, where round(x) can beat floor(x)).
- **The φ punch, felt.** A turn-meter shows L/R chips per step — φ reads
  R L R L… perfectly alternating, so it stamps **every press** (the slowest
  possible vise); a caption "every press turns → most irrational" is *earned*
  only after the last 5 presses all alternated, never pre-printed.
- **The q²·err plot demoted** to a collapsed `<details>` rigor rail (redraws on
  open; a canvas in a closed details sizes 1×1, so it's guarded).
- **+4 self-test claims (11–14):** the prefix contract (hand-walk ≡ core path,
  full length), the vise (bracket holds x, width monotone-shrinks, strict once
  finite), gold===turns===convergents (q≤2000, gcd=1), and an honest negative
  control (rationals terminate at width 0; irrationals stay width>0 through step
  30 — *not* "never terminate"; φ/√2/π/e all float-collapse eventually). Counts:
  **in-page 14/14, Node 24/24** (`core.test.mjs` adds deeper G/H/I). The core
  math (`sternBrocotPath/TurningPoints/convergentsOf/bruteBest`) is unchanged and
  remains the sole authority; `sternBrocotWalk` is its instrumented twin.
- **a11y / reduced-motion:** real focusable `<button>` jaws, ← / → keys (wrong
  arrow shakes, never advances), Backspace = undo; reduced-motion does a
  synchronous jump-to-depth with no tweens/bursts. PNG export now saves the vise.

## v1 — 2026-06-13 (Opus 4.8, `/fun` BUILD session)

**The missing medium.** The estate models light, motion, chaos, geometry,
sound, language — but had **no number theory** anywhere. This bench opens that
vein with the cleanest number-theoretic story there is: *what is the best
fraction for a number, and how do you prove it's the best?*

**The mathematical spine.** Every real x has a continued fraction
`x = [a₀; a₁, a₂, …]`; truncating after n terms gives the **convergents**
pₙ/qₙ via the canonical recurrence `pₙ = aₙpₙ₋₁ + pₙ₋₂` (likewise qₙ). The
**best-approximation theorem** says a convergent is the *closest* rational to x
among **all** denominators ≤ qₙ.

**The falsifiable crux — three independent methods must agree:**
1. the convergent recurrence,
2. a **brute-force** exhaustive search over every denominator q ≤ qₙ (no shared
   code — the honest oracle), and
3. the **Stern–Brocot** mediant descent toward x — whose *turning points*
   (where the search switches left↔right) are exactly the convergents.
If all three don't land on the same fractions, the theorem is wrong. They do.

**φ as "the most irrational number."** φ = [1;1,1,1,…] — every partial quotient
is the minimum (1), so its convergents (the Fibonacci ratios Fₙ₊₁/Fₙ) crawl in
slowest of any number: q²·|x−p/q| → **1/√5 ≈ 0.4472**, the largest such limit
possible (Hurwitz). That's *why* phyllotaxis packs seeds at the golden angle —
it's the angle hardest to approximate by a tidy fraction, so seeds never line
up into wasteful rays. Cross-linked to `strange-garden/pieces/phyllotaxis.html`.

**The page.** Pick a number (φ, π, e, √2, √3, ∛2, ζ(2), √5, or any
custom decimal/fraction) → the **CF ladder** (large terms like π's 292 are
gold-highlighted), the **convergent table** with a *live brute-force best-rational
check per row* + a "✓ theorem holds (N verified)" badge, an interactive
**Stern–Brocot descent** (form expresses content — you watch the mediant tree
zig-zag toward your number, convergents marked as the turning points; hover a
table row to light its node), and a **q²·error plot** that draws your number's
closing-in rate against φ's 1/√5 floor (π's 355/113 dips far below — visibly
better-approximable than φ). PNG export of the tree.

**Two real subtleties caught by the harness & corrected (Node-only assertions):**
- The semiconvergent trap: I first asserted "no fraction with q<113 beats 22/7."
  *False* — semiconvergents (e.g. 179/57) do beat it. The theorem is about
  convergents being best at *their own* denominator bound, not about nothing
  beating them sooner. Corrected to the true statement (22/7 optimal among q≤7;
  next *convergent* to beat it is 333/106 at q=106 — the fingerprint of the 292
  term).
- The double-precision cliff: comparing φ's vs √2's *converged* q²·err must use
  convergents deep enough to converge (n≈8–13) but shallow enough that q² stays
  inside double precision — past q≈1e5 the error underflows relative to q² and
  the invariant breaks numerically. Sampled the cliff, pinned the test inside the
  safe band.

**Verified.** `node core.test.mjs` → **17/17** (10 shared in-page checks + 7
deeper Node-only: exhaustive brute-force to q≤30000, the 333/106 fingerprint, the
φ-vs-√2 worst-approximable comparison, Stern–Brocot agreement for √3/e/∛2, Euclid
reconstruction, the Fibonacci identity). In-page self-test → **10/10**.
agent-browser-verified live: φ → CF [1;1,1,…], badge "✓ theorem holds (15)",
first convergent 2/1; π → [3;7,15,1,292,…], convergents 22/7/333/106/355/113,
Zǔ Chōngzhī punchline, plot dips below φ's floor; custom 89/55 terminates
exactly at [1;1,1,1,1,1,1,1,1,1] (negative control). Workbench card added
(Toys & benches, after The Road Into Chaos); href 200.

**Files (pure CORE pattern):** `index.html` (the inlined twin + UI),
`core.mjs` (the Node-testable twin), `core.test.mjs` (the falsifiability
harness), `CHANGELOG.md`.
