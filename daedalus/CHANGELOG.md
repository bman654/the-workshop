# Daedalus — Build Log

## v1.0 — initial build

Single self-contained `index.html` (~1220 lines, vanilla JS + Canvas, zero deps, no
network/CDN/web-fonts, `"use strict"`). Sibling of Cartographer: reuses its xmur3 + mulberry32
`makeRng`, floating `#panel` (collapse/reopen), segmented buttons / slider rows / flourish chips,
`exportPNG` (toDataURL → download), and devicePixelRatio-aware sizing with debounced resize.

### Generation (4 algorithms, each a distinct texture, all "perfect" mazes)
- Recursive Backtracker (iterative DFS) — long winding corridors. (default)
- Randomized Prim's — bushy, many short branches.
- Randomized Kruskal's — union-find over edges; uniform branching.
- Wilson's — loop-erased random walks; unbiased uniform spanning tree.
- Carve order is recorded so generation can animate (optional "Animate generation" chip);
  the final wall bitmask is identical whether or not it animates.

### Solver views (the centrepiece)
- **Flood-fill (BFS)** — distance wavefront blooming from the start, every cell tinted along a
  smooth gradient, bright leading ring, then the shortest path revealed as a glowing ribbon.
- **A\*** — binary-heap with Manhattan heuristic; explored set + advancing frontier → path.
- **Dead-end filling** — degree-based plugging of dead ends until only the solution corridor remains.
- **Distance map** — static heatmap of BFS distance from the start.

### Styles (palette-driven; generation is style-independent)
Neon (hero: rainbow HSL flood + white/gold glowing ribbon on near-black), Blueprint (cyan-on-navy
+ grid ticks), Ink (sepia flood on warm parchment), Classic (cool→warm flood, black walls on white).
A single `STYLES` map supplies every colour; switching style only re-renders.

### Layered glowing solution ribbon
Path drawn as a wide soft halo + mid glow + crisp bright core so it reads clearly above the flood;
neon uses a warm-gold halo to pop against the cool rainbow.

### Verification (agent-browser session `daedalus-build`, file://)
- 4 algorithms screenshotted → visibly different textures.
- Flood-fill wavefront captured mid-bloom and solved; A\* mid + final; dead-end mid + final;
  static distance map.
- 4 styles captured; maze byte-identical across all (FNV hash `f021d923` for every style at a
  fixed seed/algo/size).
- Seed reproducibility verified: same seed/algo/size ⇒ identical hash across re-entries; different
  seed and different algorithm both change the maze.
- Export PNG downloads `daedalus_<seed>.png` (valid 864×864 PNG).
- 80×80: generate ~3.6ms, solve compute ~0.3ms; animation a steady ~60fps (max frame gap ~16.8ms).
- Zero console errors/warnings after exercising every control.

### Deliverables
`index.html`, `README.md`, `thumb.png` (1440×810 16:9 Neon flood hero, seed `THESEUS-7`, panel
hidden), `CHANGELOG.md`.
