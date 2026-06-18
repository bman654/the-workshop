# The Unknotting Bench — CHANGELOG

The Sewing Room's third bench (#3). Where the Knot Tabulator proves a number can't
budge under any redrawing, and the Cat's-Cradle Weaver proves a figure forms only by
a legal pickup, this bench turns the invariant into a GAME you play with your hands:
tap a crossing, pick a legal verb, and watch a real loop of string untie — or be
refused by a theorem. **You can untie a disguise; you cannot untie a theorem.**

## Cycle #127 — born (planter, garden track)

The piece
- A live, playable bench in the Sewing Room aesthetic: a single gold loop on dark
  woven cloth, rendered from its live combinatorics (the renderer reads the Gauss
  code through the shared `gaussToCrossings` seam — it never re-parses Gauss).
- INTERACTION: click a crossing nib → the legal verb chips light for that crossing;
  fire a lit verb (or keys 1/2/3) → the strand relaxes and the crossing dissolves in
  place; at 0 crossings the loop eases to a circle + a soft gold "clean" bloom = WIN.
  An illegal tap triggers the cradle-weaver shake keyframe + a one-line coral
  `.reject` flash (the per-move negative control, made touchable).
  `prefers-reduced-motion` snaps instead of animating.
- THE LADDER (the invariant display): a column of rungs, each a REAL mini re-draw of
  the loop at its new (lower) crossing count, every rung carrying a pinned teal
  `|Δ| = N` chip + a falling `crossings: M` count. The chip column visibly proves the
  number never moved while the picture simplified. On WIN the bottom rung is a bare
  circle reading `|Δ|=1 · the unknot · untied`. On the trefoil every verb goes dead
  and a banner reads `|Δ|=3 ≠ 1 → no legal move can ever reach the unknot; this is a
  theorem, not a failure.`
- TWO BOARDS: the DISGUISED UNKNOT (`O3 U3 O1 O2 U2 U1`, realizable, |Δ|=1, 3
  crossings — untieable) and the TREFOIL (`O1 U2 O3 U1 O2 U3`, |Δ|=3, 3 crossings —
  zero untwist/unpoke/slide loci, stuck). A "show me" button plays the scripted
  solve; board-switch chips, undo (key U), reset (key R).

The math (the only genuinely NEW code)
- `unknot-core.mjs` IMPORTS the shared knot math (`gaussToCrossings`,
  `knotDeterminant`, `isRealizable`, `pColorings`, the adders, `makeRng`,
  `diagramCode`) from the sibling `../knot-tabulator/knot-core.mjs` — the single
  authority, never duplicated. It adds the REDUCING layer:
  - `untwistLoci`/`applyUntwist` (R1-undo: a same-id cyclically-adjacent kink),
  - `unpokeLoci`/`applyUnpoke` (R2-undo: a clasped bigon, scanning all 4 rotations),
  - `slideLoci`/`applySlide` (R3: reverse a 3-token same-type window; count-neutral),
  - `legalTargets` (drives chip-lighting + the felt rejection),
  - `solveBoard` (the honest reduce-only BFS) + `vacuousSolver` (the load-bearing fake).
  Every applier RE-GATES its output through the imported `isRealizable` AND
  determinant-preservation, so a returned locus is ALWAYS a genuine removable site.

The proof (`runSelfTest`, called by both the in-page pill and the Node twin)
1. SOUND — every untwist/unpoke/slide holds |Δ(−1)| AND the disjoint p=3,5 colorings,
   on both boards AND a battery of random reducible diagrams (grown by the adders,
   then reduced): 1509 battery reductions over 120 grown diagrams, 0 drift.
2. POSITIVE — the scripted untwist@0 → unpoke on the disguise: crossings 3→2→0,
   |Δ|≡1 at every step, ends empty (WIN).
3. NEG-CONTROL (load-bearing) — exhaustive BFS from the trefoil floors at 3 crossings
   with |Δ|≡3 across the whole orbit; the vacuous always-wins solver provably FAILS
   the trefoil; the honest solver DISCRIMINATES (solves the disguise, stalls on the
   trefoil).
4. DISCRIMINATION — |Δ| 1 vs 3 (3≠1), with the coloring witness (disguise 3 trivial
   colorings, trefoil 9 mod-3).

Parity (the estate standard)
- The page inlines ONLY the new reducing layer between the
  `// ===== UNKNOT CORE BEGIN/END =====` sentinels; the shared math is the IMPORT.
- `unknot-core.test.mjs` re-extracts that slice and asserts every reducing function
  body is char-for-char === the module (all 16 functions), the in-page `runSelfTest`
  pass-count == the module's (ok-for-ok, name-for-name), AND that the shared math is
  an import (not duplicated in the byte-twin). `node unknot-core.test.mjs` → 25/25
  ALL GREEN.

Wiring
- Backs to `../sewing-room/index.html` (a bench backs to its wing) + a sibling cross-
  link to the Knot Tabulator. Drops `ws:seen:unknotting-bench` per the DoD.
- The Sewing Room landing went from 2 → 3 benches: lede copy, the third bench card
  (exact href), footer prose, and the structural self-test (three cards, the new
  card present by href + its claim) — the existing exact-claim regexes for the two
  old cards left intact.

Honesty / scope
- PROVEN: every reducing move on these boards + a battery of grown diagrams holds the
  determinant and p=3,5 colorings; the disguise reaches 0 crossings (|Δ|≡1); the
  trefoil's whole reduce/slide orbit is stuck at 3 (|Δ|≡3); the vacuous solver is
  caught. The general "|Δ|≠1 ⟹ not the unknot" is the theorem the bench ENACTS, not
  re-derives. Drawing-your-own knot, a larger board library, the Jones polynomial:
  each a fresh seed, not an in-place expansion.
