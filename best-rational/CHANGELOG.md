# The Best Rational — CHANGELOG

A number-theory bench: continued fractions, the convergents (best rational
approximations), and the Stern–Brocot tree. The estate's first foray into
**number theory** (only incidental prime/φ mentions existed before).

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
