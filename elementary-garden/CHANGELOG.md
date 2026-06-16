# The Elementary Garden — changelog

A 1-D elementary cellular automaton you seed by hand and watch rain down into a triangular tapestry.
Under Rule 90 from a single centre cell, the lit cells ARE the odd binomial coefficients — Pascal's
triangle mod 2 — and the shape it grows IS the Sierpiński triangle. The Pascal overlay lets you align
that theorem with your own eyes; a compare-all-three toggle sets 90/30/110 against the same seed.

## #85 — sown to bloom (BUILD / garden · planter)

First planting. Synthesized from three explorer prototypes:
- **C** (the hero): the Pascal overlay — every triangle cell gets a teal C(n,k) ring, odd rings land on
  lit cells under Rule 90 + single-centre seed and the verdict snaps to "they align"; Rule 30 breaks it
  (red rings on dark cells). Two-canvas CA+overlay stage, gold palette, right rail, hover C(n,k)+CA-state
  tooltips, verdict + toast. Overlay only MEANS Pascal under Rule 90 + single-centre seed (guarded verdict).
- **A** (grafted): the warm-glow fresh-row — a freshly-computed row glows warm and cools to bone over ~7
  frames so the eye catches each line LANDING. Pure cosmetic; never touches engine output.
- **B** (grafted): "compare all three side-by-side" — runs 90/30/110 on the IDENTICAL painted seed in
  three colour-coded fields (teal 90 / red 30 / amber 110). Fixed B's flaws: field labels live in a top
  gutter chip (never overlap dense cells); the seed row is drawn bright gold in every field. Single-rule
  mode keeps C's overlay hero + per-rule context chips (Rule-90 Pascal, Rule-110 "Turing-complete, Cook
  2004", Rule-30 chaos) + B's predict-the-next-bit micro-game (flagged EMPIRICAL randomness, never a theorem).

Gestures: click/drag the top row to paint a seed (single-centre default, faint gold outlines mark
clickable empty cells, lit seed cells gold); play/pause/step; speed slider; single-centre / clear&paint /
random-seed. Time rains downward row by row.

### The engine — single authority, 3-file byte-twin (Buffon convention)
- `core.mjs` exports `stepRow(row,rule[,wrap])`, `evolve`/`grow`, `binomialIsOdd`/`binomMod2`
  (Lucas: odd ⟺ (k&n)===k, integer, no float), `pascalMod2Triangle` (the theorem builder), `runSelfTest()`.
- That block is INLINED BYTE-IDENTICAL into `index.html` between sentinels
  `// ===== ELEMENTARY CORE (byte-identical to core.mjs) =====` … `// ===== END ELEMENTARY CORE =====`
  (6340 bytes, verified equal).
- Wrap convention: **torus** everywhere (page + inlined twin + test); the shown field is always wider than
  2·rows+3 so a single-centre seed never wraps within view (the self-test's column mapping is load-bearing).

### core.test.mjs — GREEN exit 0
- (A) calls `core.runSelfTest()` — the same function the in-page pill runs (5/5).
- (B) re-derives Rule 90 = Pascal mod 2 cell-for-cell from an INDEPENDENT integer recurrence
  C(n,k)=C(n-1,k-1)+C(n-1,k) mod 2 (and cross-checks Lucas), 80 rows, 0 mismatches.
- (C) NEGATIVE CONTROL — Rule 90 ≠ Rule 30 on the same seed.
- (D) EMPIRICAL χ²/run sniff on Rule 30's centre column — explicitly flagged not-a-theorem, generous band,
  never gates GREEN.
- (E) byte-parity slab check (indexOf START/END → slice → modBlock===htmlBlock).

### The page
- Auto-runs the self-test pill on load so it greets GREEN (still clickable for detail in the console).
- `prefers-reduced-motion`: renders one complete static Sierpiński frame (no rain), the fractal still reads.
- Responsive: no horizontal overflow at 1280 or 390; at ≤760px the rail collapses under the stage and the
  three compare-fields shrink their gutter chips.
- `ws:seen:elementary-garden` breadcrumb; topbar back-links to the Estate + Workbench.

### Cross-links (both ways, verified)
- Into the Garden: "▲ This Rule-90 triangle IS the Sierpiński triangle → measure its dimension" →
  `../fractal-dimension/index.html?set=sierpinski`. Added a `?set=` reader to fractal-dimension's boot so
  the deep link lands on Sierpiński (it previously always booted Koch).
- Reciprocal INTO `fractal-dimension/index.html`: a "← grow this triangle from a 1-bit rule (Rule 90) in
  the Elementary Garden" link, shown only when the Sierpiński set is active.
- Sibling nod → `../strange-garden/pieces/game-of-life.html` (Conway's Game of Life, the 2-D cousin).

### Registered
- A "Toys & benches" Workbench card (sibling to Buffon / Giant Component). No new front-door footprint.

### Publisher fresh-eyes (#85) — two fixes caught in review
- **Math-correctness fix (the Rule-90 align verdict).** The verdict contradicted itself: "Every odd
  C(n,k) sits on a **lit** cell… The **black** cells **are** the odd binomial coefficients." Black cells
  are the EVEN ones (≡ 0 mod 2). Rewritten to "The lit cells are the odd binomial coefficients; the black
  gaps are the even ones (≡ 0 mod 2)." Page text only, OUTSIDE the byte-twin sentinels — byte-parity stays
  6340===6340 and the Node twin stays ALL GREEN.
- **Spacing fix (the reciprocal back-link).** `fractal-dimension/index.html` `#egLink` was hard-positioned
  at `top:118px` and overlapped the 2-line Sierpiński `#setLabel` (bottom 122px) by 4px → nudged to
  `top:134px` (clean gap; `eg_overlaps_setLabel` false after, confirmed by a cache-busted reload). No
  `.src.html` twin for fractal-dimension, so forge stays 31/31.
