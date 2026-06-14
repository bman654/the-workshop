# The Provably Shortest Path — CHANGELOG

A Workbench bench in the **discrete-algorithms** vein (a brand-new vein for the
estate — it had computation [the Mill] and solved games [the Adversary] but no
*pathfinding made visible & provable*, and no percolation). Fills the **last open
survey medium-gap** of the three sown on 2026-06-13.

## v1 — 2026-06-13 (Opus 4.8, `/fun`)

**The one idea.** A path that *looks* short isn't a proof. So the bench doesn't
trust the picture — it proves it. On a weighted grid, three unrelated methods
must agree on the minimum cost:
- **A\*** with an admissible, consistent heuristic (Manhattan distance × min
  step-cost 1 ⇒ never over-estimates, since diagonals are forbidden and every
  step costs ≥ 1). It explores **far fewer** cells than Dijkstra (the heuristic
  *focuses* the frontier toward the goal) yet returns the identical optimum.
- **Dijkstra** = A\* with h = 0 (the textbook optimum; floods uniformly).
- An **independent Bellman-Ford oracle** (`bellmanFord`) that shares *no* code
  with `search()` — a full relaxation to convergence. Slow but obviously correct,
  so if A\* == Bellman-Ford we trust A\*.

**The falsifiable crux (the workshop's signature).** A self-test asserts
`A* cost == Dijkstra cost == Bellman-Ford cost` over hundreds of random grids;
that A\*'s returned path is *well-formed* (contiguous 4-steps, wall-free,
start→goal) and its re-summed terrain cost equals the reported cost (the picture
can't lie); and the **negative**: an **inadmissible** (over-weighted h × 2.5)
heuristic returns a path that is provably *costlier* than the optimum on some
grids — the precise reason admissibility matters, demonstrated, not asserted.

**Second face — percolation.** A second mode opens each lattice site with
probability *p* and floods (BFS) from the top row; it *spans* when the open
cluster reaches the bottom. The bench **measures** the site-percolation
threshold by bisection on the spanning-probability = ½ crossing and asserts it
brackets the literature **p_c ≈ 0.5927** (square lattice) — a constant of nature,
measured not drawn. Live sweep measured **p_c ≈ 0.5955** (Δ0.0028).

**Design calls (came out of the harness, not guesswork).**
- A **binary min-heap** drives Dijkstra/A\* in O(E log V) — no O(V²) min-scan
  (the user-rules forbid brute-forcing what has a known better structure).
- Lazy heap deletion (skip stale `settled` pops) keeps it simple and correct.
- Terrain cost = enter-cost of a cell, via two octaves of value-noise → patchy,
  map-like weights, so "looks short" and "is cheapest" genuinely differ.
- Endpoints + their immediate neighbours are carved open so a path can exist;
  when one *can't* (e.g. a fully walled goal), the search reports **unreachable**
  (∞ cost, empty path) — never a faked finite path (asserted in the self-test).

**Verification.**
- **Node twin `core.test.mjs`: 11/11 green** — A\*==Dijkstra over 400 seeds
  (0 mismatches, A\* did strictly less work on 391/394), A\*==Bellman-Ford over
  120 seeds, every path well-formed & cost-exact over 200 paths, inadmissible h
  overshoots on 12/394 grids, admissible never worse over 600 seeds, seed-pure,
  Dijkstra's non-decreasing settle order (its correctness invariant), unreachable
  reported, p_c=0.5943 measured (Δ0.0016), spanning monotone in p.
- **In-page self-test: 10/10 ✓** (the same harness, lighter seed counts; #1 emits
  two assertions → 10 displayed). Badge → console + click-for-detail.
- **Browser-verified** (agent-browser, served origin, named session): badge green
  `selftest ok`; Pathfinding cost 195 settling 584/792 cells MATCHES Dijkstra &
  Bellman-Ford; **Race** A\* 584 vs Dijkstra 598 cells, same cost; **Greedy**
  honestly labels when it happens to be optimal; **Percolation** SPANS at p=0.59;
  **Sweep** measured p_c=0.5955 ✓ MATCHES; breadcrumb `ws:seen:pathfinder` drops
  on visit; 0 console errors.

**Files.** `core.mjs` (pure twin), `core.test.mjs` (Node harness),
`index.html` (CORE inlined + UI). Registered on the Workbench → Toys & benches
(🧭 card, leads the group beside The Coastline Rule).
