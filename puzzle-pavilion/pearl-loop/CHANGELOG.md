# The Pearl Loop — CHANGELOG

A Masyu bench: black & white pearls on a 6×6 lattice pin **exactly one closed loop**, and you
find it by **drawing** — drag between cell-centres to lay the loop segment by segment. It must
**turn** at every black pearl (running straight one cell on both arms) and run **straight** through
every white pearl (turning at a shoulder). Illegal segments flush red as you draw; the instant the
single closed loop honours every pearl, it snaps shut with a close-the-loop flourish.

The third leaf of the Puzzle Pavilion — completing its three-leaf arc (connect · fill · **draw**).

## v1 — cycle #69 (promoted from `_planters/`, benched)

**Promoted, not rebuilt.** The proven generation+solving core was stashed durably in-repo at
`puzzle-pavilion/_planters/pearl-loop/{core.mjs,core.test.mjs}` (cores written ahead of the bench so
the wing's last `[bench]` seed survived a `/tmp` wipe). This cycle:

1. `git mv`'d the core + twin to `puzzle-pavilion/pearl-loop/` (the SOLE math authority) and re-ran
   the Node twin GREEN at its new home — same **30/30 @6×6**: unique · deduced · deduced-loop ≡
   reference · no-guess · negative control (remove/flip one pearl → count > 1 OR the deduction stalls).
2. Wrapped the core between `// === CORE BEGIN ===` / `// === CORE END ===` sentinels and inlined it
   **BYTE-IDENTICAL** into `index.html` — the page reads `generate / deduce / countSolutions /
   makeEdgeIndex / isComplete / loopEdges` from the inlined core and never re-implements the rules.
   Verified by a diff-true byte-parity check (Node `slice===slice`, and the in-page self-test fetches
   both and asserts char-for-char equality).
3. Built `index.html` as a fresh production bench mirroring the Pavilion mold (Bridge House /
   Cross-Sums): a responsive 560-baseline canvas (CSS `width:100%`, backing store `CS·DPR`, one-time
   `ctx` scale — 0 overflow @1280/760/390), **drag-to-draw** the loop, live legality (a degree-3 move
   is hard-refused with a red flash; a pearl-shape violation flares red once the cell reaches degree 2),
   a New-puzzle / Reveal-logic / Clear-loop / Hint card (Hint lays the next *forced* segment and NAMES
   its rule, never "the answer"), a live-state card (pearls · segments · pearls honoured · illegal
   segments · solved pill), and an in-page self-test pill **7/7 ✓**. The WIN uses the SAME core
   `isComplete()` verifier — verified in Node that the reference loop fires the win on all 30 boards.
4. Flipped the Pavilion landing (`../index.html`) Masyu planter → a live family card (◍ →
   `pearl-loop/index.html`); hero lede + footer updated to "all three in flower"; the landing self-test
   now asserts **3 live cards + 0 coming-to-leaf planters** (the three-leaf arc complete).
5. Drops `ws:seen:pearl-loop`.

### The math claim, self-tested (the quiet proven layer)
For every generated board: `countSolutions() === 1` (an independent exact loop-counter — DFS growing one
path from a pinned anchor, canonical orientation so each undirected loop counts once) **AND** `deduce()`
threads the full single loop from the forced turns with **no guessing** (named Masyu rules: pearl-degree ·
white-straight · black-edge · black-turn · black-arm · degree-2-cap · degree-close · no-stub). The deduced
loop edges equal the generator's reference loop. **Negative control:** remove/flip one pearl → the solution
count rises above 1 OR the deduction stalls — proving every surviving pearl is load-bearing.

The math core is byte-identical to the Node twin `core.test.mjs` — page and test can never drift.
