# The Belief Beam — room log

A brass-and-glass apparatus where **belief is a conserved liquid**. A frosted hidden-source
urn pours coloured beads; three glass vials hold your posterior probability that the source is
the mostly-red urn A, the balanced B, or the mostly-blue C. Because a posterior is a
probability, the three liquid levels always sum to one full beam (a gold **Σ = 1** rule across
the tops). The Numbers Room's Bayes bench — and the **inverse** of the Galton Board next door:
there a fixed law samples a fixed bell; here the evidence updates *which* law you believe.

## The 4-file house pattern (the-coin-that-lies discipline)

- **core.mjs** — the SOLE inference authority. DOM-free, between `// === CORE BEGIN ===` /
  `// === CORE END ===` sentinels, exports outside the END. Nothing hard-codes 3/12:
  `HYP = URNS.length`, `COL = URNS[0].length`, `T = Σ URNS[0]`.
- **index.src.html** — the forged page. `<!-- forge:include ./core.mjs -->` inlines the core
  byte-true; the page holds ONLY presentation state (rendered levels, eased pour cursor, card
  order, rail pair, knife-switch flags) and NEVER decides a posterior.
- **index.html** — forged output (`node tools/forge/forge.mjs belief-beam/index.src.html`).
- **core.test.mjs** — the Node twin. Imports the SAME core.mjs; includes the verbatim
  `coreRegion(path)` byte-twin block.

## The core (verified model, Facet B)

- `URNS = [[9,2,1],[4,4,4],[1,2,9]]` (mostly-red / balanced / mostly-blue), T=12, HYP=3, COL=3.
- `EQ_MODEL` adds a 4th "Gray" colour present in EQUAL count in every urn (T=14) — a real,
  visible, deliberately-uninformative bead, EXPORTED for the twin and used on the page.
- **STATE is a sufficient statistic** `{ tally, n }`. The posterior is derived from the tally,
  never from iterated float products — that is what makes order-freedom **structural** (same
  tally ⇒ bit-identical posterior). The hidden source urn + draw RNG (seedable mulberry32)
  live IN the core, so the twin replays deterministically and the true urn never reaches the DOM.
- `posterior(state)`: `lw_i = ln(prior_i) + Σ_{c informative} tally[c]·ln(L_ic)`, then a
  max-shift softmax. The `informative(c)` gate (excludes equal-likelihood colours BEFORE the
  renormalizer) is MANDATORY — it is what makes the Gray no-op bit-exact.
- `logOdds`, `logLikRatioStep` (the fixed per-draw slide, 0 for equal-likelihood), `posteriorFrom`
  (textbook ∝prior×lk, twin cross-checked), `makeSource` (draw/observe), `replay` (order-invariant).
- Negative controls: `skipRenorm` (Σ drifts ≈5.96e-6 → RED) and `correlatedOverShoot` (log-odds
  doubles past its true bound → RED). `runSelfTest(opts)` modes: normal | skipRenorm | correlated.

## The three exact claims (twin + in-page pill)

- **(A)** Σ posterior = 1 within 1e-12 at every step of a 20-draw run.
- **(B)** log-odds additive (each draw shifts A:B by exactly ln(L-ratio) to <1e-12) AND order-free
  over **all 120 permutations** of a length-5 list (strict `===`, bit-identical) — the structural
  claim, not a single shuffle. The naive iterated-float trap is shown to be real (NOT bit-identical).
- **(C)** an equal-likelihood (Gray) bead is a bit-identical no-op (EQ_MODEL, Gray ×1 vs ×5 strict `===`).
- Both negative controls fire RED and name their offender.

## The apparatus (Facet A)

- Inline SVG (viewBox 1180×720) with layered `<g>` injected by JS: the brass A-frame + bench,
  the beam + yokes, three glass vials, the liquid (the ONLY thing that animates), the hidden
  source urn. A conserved pour: levels→post over one shared eased u, `render_i = levels_i +
  (post_i − levels_i)·ease(u)`, Σ(render)=1 for every u algebraically.
- The log-odds rail + draggable evidence cards live as HTML DOM **below** the SVG (so they
  reflow independently at narrow widths). The rail is graduated in nats; each bead leaves a
  ghost-trail tick. Drag/keyboard-reorder the cards, hit ↻ REPLAY → belief lands identical
  (|Δ| < 1e-12, the "identical ✓" seal).
- Four-beat loop: DRAW → WATCH (pour + slide) → ORDER-FREE EVIDENCE CARDS → TWO KNIFE-SWITCHES
  (skip renormalization → Σ ✕ badge; correlated-as-independent → bead off the rail).
- The Gray bead is a touchable no-op (claim C made tactile).

## Registration

- Front-door PLACES entry `{ id:'belief-beam', district:'grounds', tier:2, wing:'number',
  footprint:'belief-beam' }` beside the-coin-that-lies; new `drawBeliefBeam` footprint art.
- Sky: catalog star `belief-beam @ (1240,630)`; new ADDITIVE FEATS group **The Wagerer** +
  `.sky-tally-wagerer` sub-tally (teal). The six byte-frozen capstone wings are untouched.
- Reciprocal cyan sib-link with `galton/` (the inverse), both directions, both re-forged.
- smoke.cjs mirror entry added.

## Self-test

`node belief-beam/core.test.mjs` → 26/26 green, exit 0. In-page proof pill GREEN matching the
twin count. A single-room exhibit — `bigSwingsBuilt` does NOT move.

## Publisher review (cycle #225)

- **Gray no-op made render-exact.** The live Gray path (`eqSyncAndGray`) poured to the EQ_MODEL
  posterior projected to 3 colours, while the visible levels held the canonical-URNS posterior —
  two different renorm paths, so the rendered levels drifted by **1 ULP (~2.2e-16)** on a Gray.
  The on-screen claim is *"Belief did not move (bit-identical)"*, so it must be literally true:
  the path now proves the EQ step is null (`after===before` by construction) and pours to the
  CURRENT `levels` array itself — verified bit-identical (maxAbsDelta=0) in-browser. The math
  proof was always sound; only the live render had a cross-model float seam.
- **Discoverability: listed on its own wing.** The bench was registered on the front-door map,
  the sky, and galton — but the Numbers Room landing (`numbers-room/index.html`) did not list it.
  Added the `bench exact` card (after The Coin That Lies), bumped the counts (17→18 benches,
  15→16 exact in hero + footer), and extended the landing's self-test (count assert 17→18, a new
  `The Belief Beam bench present` check) → **27/27** green.
