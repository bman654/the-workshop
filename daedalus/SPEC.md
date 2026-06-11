# Daedalus — SPEC

*A procedural maze that builds and solves itself.* Re-roll a perfect maze from any seed, watch it
**carve** (via a choice of classic algorithms, each with its own texture), then watch a solver
**flood the maze** from start to goal — a distance wavefront blooming outward — and trace the one
true path. Named for the mythic builder of the Labyrinth: the workshop's **maze-maker**, sibling to
Cartographer (maps) and Firmament (skies). The third "world to get lost in."

One self-contained file: `daedalus/index.html` — vanilla JS + Canvas, **zero deps, no
network/CDN/web-fonts**, relative paths, `"use strict"`. Seeded (reuse Cartographer's `makeRng`
string-hash + mulberry32 approach). Same seed + algorithm + size ⇒ identical maze; **style only
changes rendering.** Feels like a sibling of Cartographer (panel styling, collapse, export pattern).

## Generation algorithms (selectable; each visibly distinct "texture")
- **Recursive Backtracker** — long, winding, river-like corridors (default).
- **Prim's** (randomized) — bushy, many short branches.
- **Kruskal's** — uniform, even branching.
- **Wilson's** — unbiased uniform spanning tree (loop-erased walks).
- **Eller's** — efficient row-by-row.
(Implement at least 4 of these. All produce a "perfect" maze: exactly one path between any two cells.)
Optional **Animate generation** toggle — show the carving live (otherwise instant).

## Solver / visualization (animated; the centrepiece)
After (or alongside) generation, animate the solve from **start** (default top-left) to **goal**
(default bottom-right):
- **Flood-fill (BFS)** — a breadth-first **distance wavefront** expanding from the start, every
  reached cell tinted by its distance (a smooth gradient/rainbow) — mesmerizing; then highlight the
  shortest **solution path**. *(This is the signature view and the thumbnail.)*
- **A\*** — show the frontier vs explored set converging on the goal, then the path.
- **Dead-end filling** — iteratively flood dead ends until only the solution remains.
- **Distance map** — static: colour every cell by BFS distance from start (no animation) — a gorgeous
  heatmap of the whole maze.
Show the final **solution path** distinctly (a glowing ribbon). Animation speed control; the static
end-state must also look great (for export/thumb).

## Styles (segmented, palette-driven; generation is style-independent)
- **Neon** — glow walls/path on near-black; rainbow distance flood. (default — hero look)
- **Blueprint** — cyan on deep navy, technical/drafting feel, thin precise walls + grid ticks.
- **Ink** — dark ink walls on warm parchment, slightly organic/hand-drawn; sepia flood.
- **Classic** — clean black walls on white, crisp; cool→warm flood.

## Controls (mirror Cartographer's `#panel`: collapsible, seed row, segmented switches, sliders, actions)
Title **Daedalus**, sub *Procedural Labyrinth Engine*. Then:
- **Seed** row (text input + dice).
- **Algorithm** segmented (Recursive Backtracker / Prim / Kruskal / Wilson / …).
- **Solver** segmented (Flood-fill / A* / Dead-end / Distance map).
- **Style** segmented (Neon / Blueprint / Ink / Classic).
- Sliders: **Size** (cells per side, e.g. 10–80), **Animation speed**.
- Flourish chips: **Animate generation**, **Show distance colours**, **Show solution path**, **Thick walls**.
- Actions: **⟳ Re-roll** (primary) · **▶ Solve** (re-run the solve animation) · **↓ PNG** (export, `canvas.toDataURL`, file `daedalus_<seed>.png`).
- Hint line. Panel collapse/reopen (like cartographer).
- *(nice-to-have)* click a cell to set start/goal and re-solve.

## Performance / quality bar
- Generate + solve large mazes (up to ~80×80) fast; animations ~60fps; static render instant.
- devicePixelRatio-aware canvas; debounced redraw on resize (like cartographer). **Zero console errors/warnings.**
- Beautiful at desktop sizes; panel collapses gracefully on small screens.

## Verification (self-verify in a UNIQUE agent-browser session `daedalus-build` — never the default tab)
Open `file://`. Screenshot: each generation algorithm (confirm visibly DIFFERENT textures); the
flood-fill distance wavefront mid-animation AND the solved path; the A* solve; each of the 4 styles
(confirm palette changes, maze identical for the same seed/algorithm/size); a re-roll; an export PNG
download. Confirm seed reproducibility (same seed/algo/size ⇒ identical maze) and ~60fps, zero
console errors. Fix until clean. Save screenshots under `/tmp/daedalus-build/`.

## Deliverables
1. `daedalus/index.html`.
2. `daedalus/README.md` — short (match `cartographer/README.md` tone/length).
3. `daedalus/thumb.png` — a **stunning 16:9 hero screenshot ≤1440px wide** for a FEATURE card: a
   **Neon flood-fill distance-gradient maze with the solution path glowing** (panel collapsed/hidden).
4. `daedalus/CHANGELOG.md` — build log.

## House rules
- One self-contained file; no network/CDN/web-fonts (system serif/sans/mono only). Relative paths.
- Sibling of Cartographer (panel, collapse, export, seeded RNG). Do NOT edit the front-door
  `index.html` or other projects (the landing card + rebalance is curated separately). Do NOT git commit.
