# The Likelihood Sluice — room log

A brass-and-glass instrument where **belief decides WHEN to act**. The same additive
log-likelihood-ratio walk from The Belief Beam runs up one tall graduated glass column; a
walking brass float climbs or sinks as beads drop from a frosted hidden source. The Beam only
ever *poured* belief and never stopped — it has no notion of *enough*. This bench gives that
endless pour **two brass gates**: the instant the float touches the upper gate you ACCEPT H1,
the instant it touches the lower one you ACCEPT H0, and the walk **latches** — decided. You
don't set the gates by hand; you turn two knurled dials, the error rates α and β you'll
tolerate, and the gates slide to Wald's barriers. The Numbers Room's SPRT bench, and the
**sibling** of The Belief Beam next door: one law, the Beam *observes* it, the Sluice *acts* on it.

## The 4-file house pattern (the-coin-that-lies discipline) — with ONE borrowed core

- **core.mjs** — the SPRT slab between `// === SLUICE CORE BEGIN ===` / `// === SLUICE CORE END ===`
  sentinels (distinct from belief-beam's `CORE` sentinels so a page can inline BOTH without a
  collision). It adds **ZERO new inference math**: it `import`s belief-beam's verified
  `logLikRatioStep` / `makeSource` / `replayLogOdds` and defines only the two barriers + the
  latch. The import + export live OUTSIDE the sentinels (single-line import so the forge strips
  it; the inlined region is self-contained, exactly like every house core).
- **index.src.html** → **index.html** (forged byte-twin). The page inlines belief-beam's core
  FIRST (`<!-- forge:include ../belief-beam/core.mjs -->`) then `./core.mjs` (the watched-coin
  precedent: a page that borrows a sibling's verified law inlines it whole, then adds its own
  slab on top). The page holds ONLY presentation state (float position, fading wake, sliding
  gate bars, dial angles) and NEVER decides a verdict.
- **core.test.mjs** — the Node twin. Imports the SAME core.mjs; includes the verbatim byte-twin
  parity block for BOTH slabs (SLUICE + the borrowed belief-beam CORE) so neither can drift.

## The core (verified model — leans entirely on the Beam's law)

- **The two barriers** — functions of the tolerated error rates alone:
  `A = barrierAccept(α,β) = ln((1−β)/α)` (upper, ACCEPT H1) and
  `B = barrierReject(α,β) = ln(β/(1−α))` (lower, ACCEPT H0). The whole instrument is these two
  numbers and the float walking between them.
- **`runTrial`** draws the Beam's seedable hidden source WHOLE and slides the running log-LR `L`
  by the SAME verified `logLikRatioStep` — no second log-LR, no second log-odds, no re-derivation.
  It latches the instant `L` crosses a barrier, returning `{verdict, n, L, cards, A, B}` (the full
  card list lets the anti-fork test replay it through belief-beam's `replayLogOdds`).
- **`SLICES`** — the two binary `(i,j)` urn pairs offered: `soft` (i=0,j=1, three distinct nonzero
  step magnitudes, E[N]≈8 — a watchable walk) and `sharp` (i=0,j=2, where the GREEN bead is the
  visible INERT step-0 no-op — the bridge back to the Beam's claim (C); E[N]≈3).
- **Negative controls, both built into the same code path:** `runTrialInf` pins the barriers to
  ±∞ so no crossing is possible and the trial always ends `'open'` — proving the decision lives in
  the FINITE gates, not the walk; and an `i === j` slice gives every step 0, so `L` never moves.
- **HARD CONSTRAINT** (a real crash, documented in the core header): the Beam's `makeSource`
  hidden-urn picker indexes `(rng()*HYP)|0 ∈ {0,1,2}`, so a custom 2-row model crashes
  `sampleColour()`. The Sluice therefore uses ONLY the Beam's default three URNS and takes a
  binary `(i,j)` SLICE — which is also the true no-fork path (law, source, RNG all the Beam's).

## The exact claims (twin + in-page pill)

- **Wald's inequalities** — `α̂ ≤ α` and `β̂ ≤ β` by seeded Monte-Carlo (M=4000 in the twin, M=800
  live), asserted as `≤` and **never** `=` (an inequality, conservative by design).
- **The anti-fork identity** — the walk `L` IS belief-beam's order-free log-odds:
  `|L − replayLogOdds(cards, i, j)| < 1e-12` over 1000 trials, both slices. The Sluice cannot
  drift from the Beam; it only adds the gates and the latch.
- **The neg-controls fire** — ±∞ barriers latch ZERO times over many long runs; the `i === j`
  zero-step slice never moves `L`.
- **Modeled (labeled as modeled, NOT pinned exact)** — `E[N]_SPRT < matched-fixed-N` at equal
  error (Wald–Wolfowitz), shown empirically as an ordering.
- **Byte-twin parity** — both inlined slabs (SLUICE + the borrowed belief-beam CORE) are
  re-extracted from index.html and compared byte-identical, plus an anti-circularity check.

## The apparatus (Facet A)

- Inline SVG: a tall graduated glass column (Y_TOP 120 → Y_BOT 600, MID 360 the zero line), a
  walking brass float with a fading teal wake, TWO sliding gate bars with engraved plates + side
  lugs, an etched graduated brass scale up the right flank (ticks every 0.5 nat on one shared
  `pxPerUnit`), the frosted hidden source + its dashed chute. Reuses the Beam's exact palette/defs.
- Controls: **DRAW** (one bead), **auto-stream** (rAF-gated, one bead per beat — a watchable walk),
  **new coin** (reseat & refill), plus two knurled α/β dials (`role=slider`, drag / arrows / scroll,
  log-scaled, that animate the gates sliding). Keyboard: D / S / N + Tab-then-arrows on a dial.
- **The latch:** the gate clamps with a brass glint, the float locks, the centre verdict plate
  flips (scaleY), the N-plate engraves the stopping count, DRAW disables until a new coin re-arms.

## Registration

- Numbers Room landing (`numbers-room/index.html`): 29th bench card immediately after The Belief
  Beam (glyph 🚦, subtitle "Wald's sequential test (SPRT) · belief that decides WHEN to act",
  proof-footer matching the twin's claims). Landing self-test bumped to 29 (+ sluice-presence and
  content-honesty checks) → **40/40** pill; prose reconciled (Twenty-nine benches / Twenty-seven exact).
- Sky: catalog star `likelihood-sluice @ (1240,692, mag2)` — a tight companion 62px below
  belief-beam, verified clear of every catalog star. The Wagerer feat-group grown to TWO members
  `['belief-beam','likelihood-sluice']`, its tally now firing only when BOTH crumbs exist (the
  constellation earns its engraved name at two stars). The frozen capstone WINGS are byte-untouched.
- Reciprocal cross-link with `belief-beam/` (the inverse twin its CHANGELOG promised), both pages.
- Root `index.html` + `the-gate/the-gate.html` re-forged (both inline `tools/sky/sky.js`) so the
  new star renders.

## Self-test

`node likelihood-sluice/core.test.mjs` → **28/28** green, exit 0. In-page proof pill GREEN:
"self-test 5/5 ✓ · α̂≤α · β̂≤β · ±∞ never latches". A single-room bench — `bigSwingsBuilt` does NOT move.

## Publisher review (cycle #367)

- **Fresh-eyes pass — no defect found.** Served on :8973 (session `sluice-pub-367`, both torn down
  by PID/name). The instrument reads as a real apparatus (column on a brass-frame bench, two
  engraved gates, walking float, flipped verdict plate) — grounded, not a chart. Drove the
  auto-stream live (float walked to +0.81 nats, "1 bead drawn", verdict "— walking —" suspended,
  per-bead caption updating), confirmed the in-page pill 40/40 on the landing, the Wagerer 2nd star
  in the catalog, and the-gate honesty chip green (15/15 ✓). No horizontal overflow on any of the
  four surfaces; zero console errors; `forge --check --all` = 117 current; `--audit-seen` all 87 OK.
- **Added this CHANGELOG.** The builder shipped the bench complete but without its per-piece
  `CHANGELOG.md` — the house convention (196 sibling pieces carry one, including belief-beam). The
  publisher wrote it as the bloom's provenance record; no code or markup changed.
