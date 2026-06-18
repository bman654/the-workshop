# Two Roads, One Rhythm — SPEC

A **cross** exhibit (a garden piece reachable via the Workbench and as a reciprocal vein from The Road Into
Chaos — no front-door map footprint). It lifts ONE engine — the period-doubling superstable-ladder solver from
`bifurcation/core.mjs` — and feeds it two different smooth humps so that **one number — Feigenbaum's δ — falls
out of two roads at once**, and the *shared rhythm* is the thing you watch.

## The one idea (form expresses content): universality, made conditional

Feed the SAME engine a logistic hump and a sine hump and they climb their period-doubling ladders at the SAME
shrinking instants — both windows between successive doublings shrink by the universal ratio

  δ = lim (R_{n−1} − R_{n−2}) / (R_n − R_{n−1}) → 4.6692016…   (Feigenbaum's constant)

The two maps live on different r-axes ([0,4] vs [0,1]) and their rung *values* differ wildly
(R₁_logistic = 1+√5 = 3.2360680, R₁_sine = 0.7777338). Yet the *ratio* of their shrinking windows lands on the
same number. **Same WHEN, different WHERE — that is universality.** And it is CONDITIONAL on a smooth quadratic
maximum: the tent map (a corner, not a curve) climbs ONE rung and then can never fork — no cascade, δ undefined.

## The form (one brass instrument, two stacked roads, one gold ruler)

- A single antique brass-rivet panel. The honest shared coordinate is the **rung index d** (an integer 0..8),
  NOT a raw r — the maps live on different r-axes, so the only thing they truthfully share is *which doubling*.
- ONE contact dial sets d. Turning it advances BOTH roads to their d-th superstable parameter R_d
  simultaneously; each road draws its cascade as a recursively SPLITTING trunk (1→2→4→8→16). Both roads fork on
  the SAME detent at the SAME frame — the eye sees both ladders sprout a new generation in unison.
- Rung y-values come from the engine's own clustering of the superstable orbit at R_d (drawn == tested) — never
  a second clusterer.
- A live δ meter under each smooth road reads `cascadeReading(map, d).delta` crawling toward a gold 4.6692016…
  etched on the shared ruler.
- **The tent neg-control** is a shipped, touchable dial state: a brass toggle picks the second road's map
  (sine | tent). In TENT mode the smooth road keeps forking with its δ → 4.6692 while the tent climbs its lone
  rung then SHATTERS into a no-rhythm ember band; its δ readout reads "— (no cascade)" (driven by
  `!hasCascade`, never NaN gymnastics) and the lock chip reads "✕ the tent refuses to fork — δ undefined".

## The single source (drawn == tested == the pill)

`core.mjs` lifts the engine VERBATIM from `bifurcation/core.mjs` (mechanical s/^export //) — the algorithm is
provably the same. The whole CORE region (between `// === CORE BEGIN ===` / `// === CORE END ===`) is inlined
**byte-identically** into `index.html`; `core.test.mjs` re-extracts both and asserts char-for-char parity. The
page, the test, and the pill all consume the SAME wrapper `cascadeReading(map, N)`.

`cascadeReading` returns `{rungs, R, ratios, delta, hasCascade}`. CRITICAL: `feigenbaumRatios` returns
`{ratios, best}`, and for the tent `best` is NaN — EVERY caller branches on `hasCascade` (a boolean), never on
`isNaN(delta)`, never a NaN comparison.

## The claims it makes checkable (in-page pill + core.test.mjs)

- **A UNIVERSALITY** — |δ_logistic − δ_sine| < 0.01 at depth ≥6 (measured 8.48e-4).
- **B IT'S δ** — both within 0.01 of FEIGENBAUM_DELTA (4.669201609).
- **C CONVERGES** — the last ratio is closer to δ than the first (a limit, not luck).
- **D NEG-CONTROL (integer signal)** — at depth 8 rungs read logistic=9, sine=9, tent=1.
- **E NEG-CONTROL (no δ)** — the tent has no cascade and its δ is NaN (ratios: 0).
- **F ANTI-VACUITY** — an always-4.669 classifier has NO tent ladder to ratio ⇒ it FAILS the tent.
- **L5 ANCHORS** — R₁_logistic ≈ 1+√5 and R₁_sine ≈ 0.77773 are DIFFERENT rung values with the SAME ratio
  limit: one δ from two different roads (anti-circularity).
- **L6 DETERMINISM** — the tent yields exactly one rung, reproducibly.
- **L7 BYTE-TWIN PARITY** — index.html CORE region === core.mjs CORE char-for-char.
- **L8 PILL PARITY** — `runSelfTest().pass === total`.

## Accessibility

`prefers-reduced-motion: reduce` JUMPS both ladders straight to the final forked end-state (no rAF tween); all
meaning (lockstep, rhythm, δ convergence, tent refusal) is fully readable from the static end-state. 0
horizontal overflow at 1280 and 390.

## Reciprocal cross-links (no new front-door footprint)

- `bifurcation/index.html` .backs gains a crumb → `../cross/two-roads-one-rhythm/index.html`.
- `workbench/index.html` Computation group gains a card (glyph ⇈) after The Same Threshold.
- The page drops its own breadcrumb `ws:seen:cross-two-roads-one-rhythm` on boot.
