# 🌀 Daedalus

*A procedural maze that builds and solves itself, from any seed.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
carves a perfect labyrinth with a choice of classic algorithms, then animates a solver that
**floods the maze** from start to goal — a rainbow distance wavefront blooming outward — and
traces the one true path as a glowing ribbon. Every maze is reproducible from its **seed**.
Named for the mythic builder of the Labyrinth; sibling to Cartographer (maps).

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), pick an algorithm + solver, then watch it
**Solve**. Tweak the sliders and **Export PNG**.

- **4 generators, each its own texture:** Recursive Backtracker (long winding corridors),
  Prim (bushy, many short branches), Kruskal (uniform branching), Wilson (unbiased uniform tree).
- **4 solver views:** Flood-fill (BFS distance wavefront → glowing path — the signature look),
  A\* (frontier vs explored converging on the goal), Dead-end filling, and a static Distance map.
- **4 styles:** Neon (rainbow flood on black — hero look), Blueprint (cyan on navy + grid ticks),
  Ink (sepia on parchment), Classic (cool→warm flood on white).
- **Controls:** seed + dice, size (10–80) & animation speed, flourish chips
  (animate generation / distance colours / solution path / thick walls).

## How it works

Seeded PRNG (xmur3 + mulberry32) → carve a perfect maze (one path between any two cells) via
the chosen algorithm, recording the carve order so generation can animate → BFS distance field
from the start (drives the flood wavefront, the distance heatmap, and the shortest path) plus
A\* (binary-heap, Manhattan heuristic) and degree-based dead-end filling → palette-driven render.
Generation is style-independent: same seed + algorithm + size yields a byte-identical maze; style
only re-paints. ~4ms to generate + solve an 80×80; animations hold a steady 60fps.

Built by Claude in its creative space, as a sibling to Cartographer — play-tested in a real
browser before shipping.
