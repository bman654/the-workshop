# Ariadne build notes (working scratchpad)

## Status
index.html is mostly built (panel, styles, controls, hover, export, self-test, test harness).
RESOLVED (2026-06): the INTERLACE STRUCTURE is now a TRUE alternating plait. buildKnot was
replaced with the canonical billiard/breakpoint method (Mercat / Fisher-Mann). See the
"FIX (canonical plait)" section at the bottom for the working algorithm + verification.

## What works (verified in browser via window.__ariadne)
- The corner-graph trace produces CLOSED loops with each crossing used by exactly TWO passes
  (twoPass === true across many seeds/params). Loop counts are sensible (3–11 for small grids)
  and change with break density. So property (B) closed-loops + 2-pass is solid.
- Determinism: pure function of (seed,complexity,breaks,symmetry,shape).
- buildKnot returns loops[].nodes[] = ordered passes; each node: {cx,cy,over,slash,
  enterX/Y, crossX/Y, exitX/Y} in a (2W)x(2H) dot lattice.

## The open bug (property A — alternation)
The over/under does NOT strictly alternate along threads. Diagnosis via the test harness:
- A pure-parity rule (any of (cx+cy), cx, cy, exit-vertex parity) fails alternation.
- Building the alternation CONSTRAINT GRAPH (thread edges: consecutive passes differ;
  crossing edges: the two passes at a crossing differ) and 2-coloring it is NOT BIPARTITE.
  => Given the structure is a valid 4-regular diagram (twoPass holds), non-bipartite means
     the THREAD ROUTING is not the true alternating plait. A real plain plait IS alternating
     (bipartite). So the routing (corner pairing / in-crossing through-link) is subtly wrong.

## Hypotheses to try (for the fixer)
1. The in-crossing through-link or the OPEN-vertex corner pairing may pair the wrong corners.
   Re-derive from a known-correct reference (Mercat / Glassner "Andrew Glassner's Notebook:
   Celtic knotwork" Sept 1999) and make the diagram bipartite by construction.
2. Likelier correct model: the plain-weave plait is a *billiard* on a (2W)x(2H) grid; over/under
   = parity of the diagonal "line index" the cord is currently on. Along a "/" line over flips
   each crossing because the perpendicular "\" lines it crosses are consecutively indexed. The
   right invariant is likely the index of the crossing ALONG the cord's current straight run,
   reset consistently — but must be globally consistent (the face 2-coloring guarantees it).
3. Once bipartite, ASSIGN over/under by BFS 2-coloring of the constraint graph (guaranteed
   alternating + consistent), and keep a static parity only as a fast path if it matches.

## Test harness (already in the page)
window.__ariadne.rollAndTest(n) -> {pass,fail,counts}
window.__ariadne.buildKnot(seed,complexity,breakDensity,symmetry,shape) -> knot
window.__ariadne.selfTest(knot) -> {ok,alternationOk,closedOk,loopCount,messages}
Open in agent-browser session "ariadne-verify" via file:// (daemon already has --allow-file-access).

## DECISIVE FINDING (root cause)
Even a rigorous FACE 2-COLORING over-rule yields CONSTANT over/under along each traced thread
(all-0 or all-1 per loop). That proves the THREAD ROUTING is wrong, not just the parity rule:
my current model passes the cord STRAIGHT through every open crossing keeping the same diagonal,
so each cord is essentially a single straight diagonal (bouncing at borders). Such a cord's
flanking faces never change colour => over/under cannot alternate. A TRUE plait cord must weave
so that it alternates which way it turns. The corner-graph "straight-through" in-crossing link is
the bug. Need the canonical construction where a cord ALTERNATES over/under by construction.

Recommended canonical algorithm to implement (replace buildKnot, keep the same return shape +
window.__ariadne harness + selfTest API so the page keeps working):
  Andrew Glassner, "Andrew Glassner's Notebook: Celtic Knotwork" (IEEE CG&A, parts 1–3, 1999),
  a.k.a. the breakpoint/secondary-grid method. Key correct facts:
   - Use a primary grid + a secondary (offset) grid of points; the cord threads between them.
   - The plain plait (no internal breaks) over/under = (i + j) parity of the CROSSING tile AND
     the cord's CURRENT travel orientation, BUT the cord must reflect at HALF the lattice so that
     it alternates. In the correct billiard formulation on a (2W)x(2H) cell grid, a cord steps
     diagonally cell-to-cell; over/under = parity of (cellX + cellY) of the current cell — and
     because each diagonal step changes (cellX+cellY) by 0 or ±2 the cord must reflect every step
     off the half-grid "secondary" nodes (NOT pass straight), which flips orientation and makes
     (cellX+cellY) effectively alternate. Implement on the 2x lattice with reflection at every
     secondary node, breaks toggling the reflection, and verify bipartite/alternation via the harness.
   - Sanity target: plain 3x3 plait should be a single cord (or a small known count) that strictly
     alternates O,U,O,U all the way around.
Build the constraint-graph bipartite check (see this file's hypotheses) as a dev assertion; the
final over/under can then be a static parity that you've PROVEN matches, or the BFS 2-coloring.

## Self-test gate
selfTest must PASS (alternationOk && closedOk) across 15–20 re-rolls and many param combos.
A non-alternating knot is a FAILURE — do not ship a fake.

## FIX (canonical plait) — what made it a TRUE alternating weave
Root cause confirmed exactly as diagnosed: the old corner-graph passed the cord STRAIGHT
through every open crossing on one diagonal, so (cx+cy) parity (hence over/under) was
constant along each cord => alternation impossible. Replaced the routing entirely.

New buildKnot (doubled lattice, x in 0..LX=2W, y in 0..LY=2H):
- CROSSINGS = interior lattice points with exactly one odd coord. Two interleaved families:
  x even,y odd = on a VERTICAL grid line; x odd,y even = on a HORIZONTAL grid line.
- The cord is a BILLIARD: one diagonal unit per step, reflecting off the border (corner =>
  double reflection). Consecutive crossings lie in OPPOSITE families => the family
  alternates every crossing along a cord, which is what forces over/under to alternate.
- BREAK = barrier at a crossing midpoint, on the grid line it bisects. The ray ARRIVES at
  the break, reflects off that axis-aligned wall (flip the component perpendicular to the
  grid line: vertical-line break -> flip dx; horizontal-line break -> flip dy), and steps
  back out — a TWO-STEP bounce (this was the key; collapsing it into one step orphaned
  crossings / made odd cycles). Broken crossings are removed (never recorded).
- OVER/UNDER (Fisher/Mann): vertical-line crossing -> "/"(SW-NE) over; horizontal-line ->
  "\"(NW-SE) over. Independently PROVEN consistent by 2-colouring the alternation
  constraint graph (consecutive-on-cord edges + shared-crossing edges) and asserting it is
  BIPARTITE; selfTest now also asserts knot.bipartite.

Node shape kept for the renderer: {cx,cy,over,slash,crossX,crossY,exitX,exitY,path[]}.
loopPoints now walks node.path (border/break bounce waypoints) so the cord curves around
its turns. crossingPasses Map kept (key -> two {over,slash}, opposite). drawOverCrossings
unchanged.

VERIFICATION (browser, session ariadne-verify):
- rollAndTest(20) => {pass:20, fail:0}.
- Full matrix in-page (panel/square/border x sym on/off x breaks 0/30/60/90 x complexity
  3..11, 3 rolls each) => 648 pass / 0 fail. Loop counts 0..34 (0 only at breaks=90 on tiny
  grids where ~all crossings are broken).
- Independent re-derived bipartite check from loops+crossingPasses: bip=true, overProper=
  true (every constraint edge opposite), twoPass=true on all spot cases.
- Plain 3x3 square breaks=0: 3 loops, each strictly UOUOUOUO.
- Console: only "[Ariadne] weave self-test PASS ..." + boot line; 0 errors across a full
  shape/complexity/breaks/symmetry/style sweep.
- Determinism: same (seed,complexity,breaks,symmetry,shape) => identical structure.
Screenshots: /tmp/ariadne_algo_check.png, /tmp/ariadne_weave_closeup.png (illuminated),
/tmp/ariadne_engraved.png (engraved — clearest over/under reading).
