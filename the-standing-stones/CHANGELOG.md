# The Standing Stones — CHANGELOG

*A place-then-release placement puzzle in The Arcade's amusements wing, under the **Drover** roof
beside its kin **The Shepherd**. There you held the stick and drove a living flock; here you set it
down. You do not steer the flock — you choose where K stationary **standing-stones** stand, hit
RELEASE, and the flock's own boids+flee dynamics must carry every sheep through the gate into the
fold with **no further input**. The level is solved the instant you choose where the stones stand:
one is a leash, this is a chess problem. The Drover's 2nd star.*

## #358 — planted (herd by where you STAND)

The Drover constellation's second member (the-shepherd is the first) and a deliberate **form-foil**
to it: real-time steering becomes a one-shot placement puzzle, the purest reading of the shepherd's
myth — *never pushes the flock; only chooses where to stand.* Three frozen, hand-authored levels
(L1 OPEN FIELD · L2 · L3 THE FUNNEL), each verified winnable from a bundled **Reveal Solution**.

### The law is The Shepherd's, untouched — one authority, K sources instead of one

The flock-law lives in `the-shepherd/core.mjs`, which gained a single named helper
`fleeAccum(xi, yi, sources)` — the SAME capped inverse-square flee, summed over K sources, with
fear taken from the nearest source's taper. `step()` selects
`sources = p.stones || (p.shepherd ? [p.shepherd] : null)`, so a single stone is byte-identical to
the old single dog. The Shepherd's behaviour is unchanged: its Node twin proves K=1 `stones:[P]` is
**byte-identical** to `shepherd:P` across px/py/fear, plus a 5-source floor test and K-source
determinism. The Standing Stones inlines that flock-law slab **byte-for-byte** into its own
`core.mjs` (which adds the levels, the placement sim, and its self-test) and into `index.html`
(forged from `index.src.html`).

### WHY TRUE — the conscience under the puzzle (`core.test.mjs`, 36/36, exit 0)

Four strict proofs carry the honesty chip's EXACT claims:

- **Determinism — EXACT.** Same stones + seed + level ⇒ byte-identical run *and* verdict (including
  a *failed* run, and a discriminating run fingerprint). You iterate on placement, not luck; the win
  screen surfaces the run fingerprint so a solved run is exactly reproducible.
- **No overlap, ever — EXACT.** `minPairSep > 0` at every step — even under a 4-stone L3 squeeze and
  a 5-stone adversarial press. A positional barrier, not a soft force (inherited from The Shepherd's
  hard-floor projection).
- **WIN ≡ allInFold — EXACT.** The win latches exactly when every sheep is inside the fold polygon —
  exhaustively, including concave / notch / on-edge cases. No timer, no "close enough".
- **Neg-control — EXACT.** Zero stones ⇒ cohesion alone never threads the bottleneck; the gated
  levels stay unsolved. The stones are load-bearing.

Plus K-source determinism, per-level winnability at each level's actual flock size, single-authority
(the inlined flock-law slab is byte-identical to `the-shepherd/core.mjs`'s), and byte-twin (both page
slabs === their `core.mjs` slabs).

The flock dynamics themselves stay honestly **MODELED** — Reynolds boids (separation / alignment /
cohesion) plus the capped inverse-square flee. It is the same law The Shepherd runs, driven by fixed
stones instead of a live dog; it is not a claim about how real sheep move. What is proven *exact* is
the conscience above: determinism, the no-overlap floor, and the win rule.

### The page

Carved-granite menhirs (hand-drawn, shaded + weathered, with moss pits and a `Stones.menhir` foundry
hook for optional future enrichment — see `art-specs/menhir.md`), a brass fold rim + gold gate-posts
kin to The Shepherd, woolly fear-coloured sheep with a heading-wedge render, a calm→fled fear
gradient, and the win curtain (*"Folded."* — every sheep in the fold, and you never touched them
after Release). A green in-page self-test pill, the EXACT/MODELED honesty chip (THE QUIET CORRECTNESS
LAYER), a complete minimal procedural audio voice (set-thunk / release-swell / fold-chime, gated on
first gesture, honoring the estate-wide shared mute), and the `ws:seen:the-standing-stones` crumb.

### Wiring

A PLACES entry under amusements/Drover (a new `cromlech` footprint); the sky catalog's Drover figure
grew to two members (the-shepherd + the-standing-stones) with a new mag-2 catalog star; the front
gate re-forged (it inlines the sky). Reciprocal sib-link to The Shepherd both ways.
