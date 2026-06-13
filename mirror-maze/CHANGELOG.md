# The Mirror Maze — changelog

A generative **laser-reflection puzzle** for the Hall of Mirrors. A laser enters
the grid from a border emitter and travels straight; you place `/` and `\`
mirrors to bend the beam 90° and route it through every gem sensor, using a
budget of mirror tokens equal to the dealer's reference solution.

## v1 — first cut (provably solvable by construction)

**Mechanics (exact & deterministic)**
- 6×6 / 8×8 / 10×10 grids; a single emitter on a border cell fires inward.
- Reflection table is exact and asserted: `\` R→D D→R L→U U→L; `/` R→U U→R L→D D→L.
- Tracer marches cell-by-cell, **always terminates**: it detects revisited
  `(cell,dir)` states (loop) and carries a hard `4·N²+8` step cap as a backstop.
- Click a cell to place `/`, click again to flip to `\`, again to remove
  (right-click cycles the other way). The beam re-traces live; gems light when
  the beam passes through them; win fires when all sensors are lit.
- Mirror token budget = the (minimal) reference solution size; placing past the
  budget is blocked.

**Generation — solvable by construction**
- From the seed, a beam is walked inward from a random border emitter, dropping
  mirrors that bend it; the cells it actually passes through become the targets,
  and the dropped mirrors become the reference solution.
- The solution is then **pruned to minimal**: any mirror whose removal still
  lights every target is dropped, so every shipped mirror is load-bearing. This
  tightens the budget and guarantees the win-check has teeth (removing OR
  rotating any single mirror unlights ≥1 sensor).
- Degenerate boards rejected: 0 mirrors, <2 targets, straight-line-trivial, or a
  blank board that already lights everything.

**Self-test (5 checks, on load → chip + console)**
1. Exact reflection — all 8 mirror×direction cases.
2. Tracer always terminates — a closed 4-mirror loop + 50 dense adversarial
   boards all halt under the step cap.
3. Solvability — **240 seeded boards** across sizes; each board's reference
   solution re-traces to light **100% of targets** (0 failures).
4. Win detection has teeth — 60 boards: full solution = solved; remove or rotate
   one mirror = unsolved.
5. Seed reproducibility — same seed ⇒ byte-identical board; skins are cosmetic.

**Affordances**
- Reseed (dice / New puzzle), Show solution (animated reveal of the reference
  route), Clear board, mirror/lit/move counters, size + skin pickers, seeded &
  reproducible, **2× PNG export**, keyboard `n`/`r`/`s`.
- Three recolour-only skins: Hall (gilt-on-graphite), Spectrum (cyan prism),
  Brass (warm amber).

**Verified in-browser:** chip green (5/5 ✓), console clean (only info logs),
beam renders and re-traces live, boards solvable at all three sizes, reseed gives
fresh solvable boards, skins cosmetic, PNG export runs.
