# Theseus's Thread — CHANGELOG

## v1 (2026-06-13) — the maze, provably solved (a Pathfinder × Daedalus cross)

A Workbench bench (Toys & benches, beside its sibling **The Provably Shortest Path**) that
pollinates two existing rooms: **Daedalus** carves the labyrinth, **Pathfinder** proves a path
optimal. Daedalus already animates flood-fill / A* solvers — but those are *views*, not *proofs*,
and a "perfect" maze is a tree (exactly one path between any two cells) so its shortest path is
trivial. Here optimality is made genuinely falsifiable.

### The idea
1. Carve a **perfect maze** (recursive backtracker — same family/bitmask convention as
   `daedalus/`: passage bits N=1 E=2 S=4 W=8).
2. **Braid** it — knock out a fraction of dead-ends to open loops → the tree becomes a graph
   with *many* rival routes.
3. **Weight** the corridors with smooth value-noise terrain (1..9 enter-cost) so the thread that
   *looks* shortest (fewest cells) is usually **not** the one that *costs* least.

Now the maze is a real weighted graph, and the cheapest thread is non-obvious. Theseus's glowing
thread is then proven minimal — we don't trust the picture.

### The falsifiable crux (the workshop's signature)
Three **unrelated** witnesses must agree on the cost or the badge goes red:
- **A\*** — heuristic = Manhattan × cheapest-corridor-cost ⇒ admissible & consistent (every step
  costs ≥ minCost, diagonals forbidden) ⇒ provably optimal.
- **Dijkstra** — A\* with h=0 (the heuristic-free optimum).
- an independent **Bellman–Ford** relaxation that shares **no code** with the heap search.

Plus: the thread is re-summed step-by-step through **real open passages** (each step must cross an
open bit in *both* cells — the maze's defining law) with cost == reported cost (the drawing can't
lie); and the **negative** — an **inadmissible** heuristic (h×8) returns a *costlier* thread on
many mazes, the exact reason admissibility is what makes A\* trustworthy.

### The honest lesson a maze teaches
Unlike the open grid in `pathfinder/`, where A\* prunes hugely, a tortuous maze forces you to
explore nearly everything (median A\* saving vs Dijkstra ≈ 3%): the corridors snake *away* from the
goal so the heuristic barely focuses. So the win here isn't speed — it's **proof**. The page says
so plainly rather than overselling a speedup.

### Engineering (respects the user-rules)
- a **binary min-heap** drives Dijkstra/A\* in O(E log V) — no O(V²) min-scan; lazy deletion.
- one `search(m,{hScale,hWeight})` routine drives all four UI modes (A\* / Dijkstra / inadmissible /
  race A\*⇄Dijkstra).
- pure CORE in `core.mjs`, inlined verbatim into `index.html`; the headless harness `core.test.mjs`
  is the source of truth.

### Verified
- **Node harness `core.test.mjs`: 13/13** — A\*==Dijkstra==Bellman–Ford over 400 braided mazes (0
  mismatches); threads well-formed + cost re-sums over 300; inadmissible overshoots 137/400; A\*
  never costlier than Dijkstra over 500; perfect maze is exactly N-1 edges (a tree) & braiding adds
  passages / removes dead-ends; every braided maze fully connected & goal reachable over 300;
  seed-pure (maze AND thread) over 80; Dijkstra settles in non-decreasing distance order over 120;
  cheapest thread ≠ fewest-cells thread on 108/400 (terrain makes "looks short" lie).
- **In-page self-test: 10/10** (a 7-group subset; click the chip for detail, per-check lines in the
  console).
- **Browser-verified** (agent-browser, served origin, fresh load): chip 10/10 ✓; three witnesses
  agree (372 = 372 = 372, re-summed 372); inadmissible mode reliably overshoots on reroll (e.g.
  246 vs optimum 244 — "OVERSHOT BY 2 — NOT A PROOF"); breadcrumb `ws:seen:labyrinth` drops on
  visit; **0 console errors**.

### Controls
Size (10–40) · braiding (0–0.95) · new-seed / re-trace · four finder modes · show-flood toggle ·
tint-corridors-by-terrain toggle. Entrance = top-left, heart = bottom-right.

### Integrated
- Workbench → Toys & benches: a 🧵 card right after Pathfinder.
- `daedalus/` gains a second sib-link (↗ Theseus's Thread, beside ↗ Ariadne) — the labyrinth engine
  now points at the bench that solves what it builds.
- drops `ws:seen:labyrinth` (feeds the Survey of Heaven + the Undercroft).
