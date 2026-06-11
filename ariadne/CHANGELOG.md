# Ariadne — changelog

## 2026-06-11 — v1.0 (true alternating plait)

The workshop's interlace medium: a generative Celtic-knotwork loom, sibling to Daedalus.

### Built
- Single self-contained `index.html` (~1150 lines), vanilla HTML/CSS/JS, canvas 2D.
  Zero dependencies, no network/CDN/web-fonts — runs fully offline (verified: no external refs).
- Style sibling of Daedalus: glass panel, segmented controls, seed + ⚄ dice, collapse/reopen,
  PNG export, xmur3 + mulberry32 seeded RNG. Back-links: `← workshop` and `↗ Daedalus — the
  labyrinth`.
- 4 styles (Illuminated / Engraved / Neon / Stone), 3 shapes (Panel / Square / Border),
  Complexity / Break Density / Cord Thickness sliders, Symmetry / Knot border / Reveal-threads
  toggles, live thread (loop) count + on-panel `✓ weave` indicator.
- Signature interaction: hover to trace exactly one continuous **closed** thread (dim the rest),
  readout "thread N of M". Reveal-threads colours every loop a distinct hue.

### The correctness work (the crux: a TRUE plait)
The knot is a DATA STRUCTURE first, rendered from it. The three properties hold by construction
and are asserted by a built-in self-test.

- First attempts (lattice site-hop, then a corner-graph that passed cords straight through each
  crossing) FAILED the alternation gate: cords ran straight along single diagonals whose flanking
  faces never changed colour, so no static parity could alternate (the constraint graph was not
  bipartite). This was diagnosed honestly via the self-test harness, not papered over.
- Final algorithm — the canonical billiard / breakpoint method (Mercat / Fisher–Mann): on a
  doubled lattice, crossings are interior points with one odd coordinate, in two interleaved
  families (vertical-line vs horizontal-line). A cord is a light-ray billiard, one diagonal unit
  per step, reflecting off the border (corner ⇒ double reflection) and off internal breaks (a
  two-step bounce — the key detail; collapsing it orphaned crossings and broke alternation).
  Consecutive crossings sit in opposite families, so over/under **alternates by construction**.
  Over/under uses the Fisher/Mann rule; generation independently 2-colours the alternation
  constraint graph and asserts it is **bipartite**.

### Verification (agent-browser, session `ariadne-verify`, file://)
- Weave self-test: **20/20 PASS** on random re-rolls (counts e.g. 5,5,3,5,3,3,1,4,3,6…).
- Full parameter matrix (panel/square/border × symmetry on/off × breaks 0/30/60/90 ×
  complexity 3..11, 3 rolls each) re-derived independently from `loops` + `crossingPasses`:
  **648 / 648 PASS** — strict alternation along every cord, every crossing used by exactly two
  passes with opposite over/under. Plain 3×3 (no breaks): cords strictly U,O,U,O… all the way.
- Closed loops: loop count varies sensibly with Break Density (e.g. panel/complexity 7:
  breaks 0→1, 20→5, 40→7, 60→1, 80→18).
- Determinism: identical structure for identical (seed, complexity, breaks, symmetry, shape).
- Style-independence: switching style / thickness / reveal / border leaves the structure
  byte-identical (same loop count + over-sequences).
- Visual: Illuminated reads as genuinely woven (smooth corners, closed border, no loose ends);
  Engraved makes the over/under unmistakable (under-rail breaks at each crossing); Neon and Stone
  re-paint the same knot. Hover lights exactly one closed thread; Reveal-threads decomposes the
  loops by hue; PNG export downloads a correct image.
- Console clean: only the intentional `[Ariadne] weave self-test PASS …` + boot line; 0 errors /
  0 warnings across heavy re-roll / style / shape / slider exercise.

### Deliverables
`index.html`, `README.md`, this `CHANGELOG.md`, `thumb.png` (1440×810, Illuminated).
