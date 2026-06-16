# Puzzle Pavilion — `_planters/` (proven cores, not yet benched)

The Puzzle Pavilion shipped in cycle #51 with **one** fully-built leaf — **The Bridge House**
(`../bridge-house/`). Its landing (`../index.html`) shows two more families as *coming-to-leaf*
planters: **The Cross-Sums** (Kakuro) and **The Pearl Loop** (Masyu).

This folder holds the **proven generation+solving cores** for those two planters — already written
and already green — so the wing's two `[bench]` garden seeds (see `ROADMAP.md`, `sown #51`) have a
durable promotion path that survives a `/tmp` wipe. **These are NOT live leaves.** The underscore
prefix keeps them out of the front-door surfaces; nothing links here.

| Planter | Core | Twin | Status |
|---|---|---|---|
| The Cross-Sums (Kakuro) | `cross-sums/core.mjs` | `cross-sums/core.test.mjs` | **15/15** over 240 seeds (8 bases): unique-solution · solvable by pure deduction (combination-sets per run-sum, naked/hidden singles, no guess) · struct · 100% load-bearing clues · negative control fires |
| The Pearl Loop (Masyu) | `pearl-loop/core.mjs` | `pearl-loop/core.test.mjs` | **all green** over 30 seeds @6×6: unique · deduced · matches reference · no-guess · negative control (remove/flip one pearl → count>1 or stall) |

Re-run a twin from this folder:

```
node puzzle-pavilion/_planters/cross-sums/core.test.mjs
node puzzle-pavilion/_planters/pearl-loop/core.test.mjs
```

## To promote a planter to a live leaf

Follow the Bridge House mold exactly (it is the reference for the whole wing):

1. Move/copy this `core.mjs` to `puzzle-pavilion/<leaf>/core.mjs` (the SOLE authority) and its
   twin to `<leaf>/core.test.mjs`; re-run the twin green.
2. Build `<leaf>/index.html` as a fresh production bench mirroring `../bridge-house/index.html`
   (responsive canvas, the play verb, a Reveal-logic trace, Hint, a live-state card, an in-page
   self-test pill). Inline the core **BYTE-IDENTICAL** between `// === CORE BEGIN ===` /
   `// === CORE END ===` and keep the diff-true invariant.
3. Register it on the Pavilion landing: flip the planter card to a live family card with an
   `→ <leaf>/index.html` link (mirror the Bridge House card).
4. Add a `<leaf>/CHANGELOG.md`, prune the matching `[bench]` seed to a bloomed tombstone, and
   carry the worklog/NOTES bookkeeping.

The original explorer prototypes (the canonical source for each family's full bench shell, including
the play UI the cores predate) were `/tmp/ws-explore-51-0-1-B-Kakuro-*.html` and
`/tmp/ws-explore-51-0-2-C-Masyu-*.html` — volatile; if gone, the cores here plus the Bridge House
mold are enough to re-derive a bench.
