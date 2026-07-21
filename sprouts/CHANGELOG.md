# Sprouts — the game you draw

A napkin game against the house: join two spots with a curve that touches nothing,
drop a new spot on it, and the spot that collects three ends is spent. The claim on
the sheet is only this — **every game lasts between 2n and 3n−1 moves, however badly
it is played** — and the room proves it rather than asserting it.

---

## Cycle 426 — the room (BUILD 2 of 2; the piece stands)

The engine pass left a proved spine and two named residuals. This pass closed both,
built the whole room on top, and registered the piece. What follows is the honest
record, including the four things that were hard.

### THE ONE FIX THAT CLOSED BOTH RESIDUALS

The two residuals looked unrelated — the router stalled on ~1 game in 6, and 6 of 64
cross-face pairs stayed routable — and they had one cause, which the previous pass
had already guessed at and named:

> **Near a spot, distance is not a model of "did you cross a line."**

Every curve at a spot converges on the same point, so a clearance test says nothing
there and something must take its place. What was there was an **angular sector**: a
wedge of straight walls laid over curved ink, requiring the stroke to stay in the
corner it left by. A wedge is wrong in *both* directions at once. It refused
perfectly drawable routes (a smoothed candidate drifting a fraction of a radian out
of a narrow corner — the stall), and it still leaked, because a curve incident to the
spot can bend back *inside* its own wedge and be crossed there (the drift).

The replacement is the **orientation test**. Inside a spot's disc an incident curve
may be touched, hugged, run alongside — but not **crossed**; crossings within the
ink dot itself (`R_MERGE = 0.8·SPOT_R`) are the shared endpoint every incident curve
owns, and the departure angle that names the corner is measured far outside it, at
`r = ATTACH = 16`. That is the exact topological content of "you stayed in your
corner", and it is the thesis of the whole piece stated in code: *a non-crossing
stroke cannot leave its face.*

Measured, over the same seeds: cross-face routable **6/64 → 0/248**; games halted
before a genuine terminal **~1 in 6 → 0 of 240** (n = 2…5).

Three more things fell out of following that thread:

1. **A loop is not a self-collision.** A self-loop leaves its spot and comes home to
   it, so its head and its tail converge on the same point — and the self-collision
   test refused *every loop ever drawn*. At n = 5 the last playable move is very often
   the only remaining self-loop, so the game halted early and the bracket in the
   margin became a lie. Same fix, applied to the stroke against itself.
2. **A loop needs its own router.** The shortest path from a spot back to itself is
   the empty path — a BFS router simply cannot draw one. Loops now launch *outside*
   the spot's disc, from opposite halves of the corner, with the disc walled off so
   the path must go around. And `loopR` asks for a **generous** loop first (84 su,
   then 58, then 36), because a loop routed by shortest path is a knot a few su
   across. Median route length went 137 su → 392 su; the sheet reads as drawing
   rather than scribbling.
3. **The corner is confirmed, not assumed.** Since the grid no longer shapes the
   launch by sector, each finished candidate's *measured* departure angle is checked
   against the corner the move names — measured exactly where `ink.endpoints`
   measures it for a human stroke, so router and hand are held to one standard.

### AND IT GOT 30× FASTER, WHICH WAS NOT THE POINT BUT WAS THE PROOF

Worst deliberation **1718 ms → 20 ms**; the n=2…5 sweep 121 s → 2.9 s. Three changes:
one **multi-source flood** for the whole fan of exit directions instead of one per
direction (with per-exit floods kept as a fallback, paid only where the fast path
fails); a **window** on the fine rungs, since a tight squeeze is local by definition
and the coarse rung already owns the long way round; and a rung asking for **room to
spare** — clearance the rules do not demand — which makes the house sweep through
open paper the way a hand does and is the single biggest thing keeping a crowded n=5
board drawable. That last one is the anti-sliver policy, not a nicety: a shortest
path shaves past every obstacle it can, and each shave leaves paper too thin for
anyone to draw in later.

### WHAT THE ROOM IS

A cream sheet on the estate's dark desk, in the games-vein shell. Three canvases
(`paper` / `ink` / `overlay`; only the overlay redraws per frame) under one SVG
furniture layer, with **one seam** between sheet units and pixels — `k = cssWidth/940`
— and the 0.35° tilt undone *exactly* in the pointer transform rather than
approximated away.

- **The pen**, all six ingredients: speed pressure, nib flattening at −40°, tremble
  along arclength (seeded per stroke, render-only), pooling in the turns, the paper's
  tooth punched back through the ink with one `destination-out` grain fill, warm
  graphite on warm cream against the house's walnut.
- **Three legality textures.** A refused spot shivers and scuffs (but the primary
  teacher is that live spots swell and spent ones do not). Grazing a crossing does
  **not** snap back — a flare blooms at the closest approach, the struck curve warms
  so you see *what* you hit, and the ribbon goes thin and dry past the conflict and
  **re-inks** when you drag back out. Release in conflict retracts fast and
  tail-first; release in empty space retracts slower and says nothing — two textures
  for two mistakes. The ghost tail is legality-tested with the rest.
- **The margin carries the claim as an object**: a column of 3n ticks, one struck per
  move, with a pencil bracket across 2n…3n−1. Struck = moves made, unstruck = lives
  left; one column, both readings, no numerals. Both read from `state`, never
  recomputed view-side.
- **The house visibly thinks**: 2–4 of the candidates its scorer actually evaluated,
  ghosted on in scored order and diversified *by pair*, then the chosen route darkens
  and draws itself.
- **The ending is a moment**: the losing tool lifts and hunts, sets down with a dry
  tap, and a pencil **writes** the verdict across the bottom margin in a
  single-stroke alphabet revealed by `stroke-dasharray` (hand-lettered paths — not a
  `<text>` shipped as done). The final struck tick is circled, and it lands inside
  the bracket. Every time.
- **Keyboard**: tab to a spot, Enter to choose it, Enter on another — **and the
  router draws your curve**. `route()` is public API used by the human path, not a
  private bot helper.

### GREEN

`node sprouts/core.test.mjs` — all legs:

- **THE ONE CLAIM, 2000 seeded games** (n = 2,3,4,5 × 500): live ends fall by exactly
  1 per move and equal `3n − movesMade` at every step; every completed length lies in
  `[2n, 3n−1]`. Exact integers, no tolerance, no fitted constant. Both walls of the
  bracket are reached, so it is a claim and not decoration.
- Merge/split bookkeeping == the rotation system's own face trace (shared code: none).
  Two independent terminality readings agree. Euler holds.
- **Payoff liveness**: a full n=3 game house-vs-house through the real commit path
  reaches a genuine terminal and declares a winner; `offerStroke` **rejects** a
  spot-to-spot polyline that genuinely crosses ink and **accepts** a clean
  equivalent; the house finds a legal move wherever one exists and concedes only at a
  true terminal.
- **`flood ⊆ faces`**: 0 of 248 cross-face pairs routable — the only way this piece
  could quietly become a liar.
- **D2, a claim check disguised as a router check**: every seeded game at n = 2…5 is
  *drawn* to a genuine terminal, 0 halted, 0 below 2n.
- Core and ink slabs inlined **byte-identically**; `forge --check` current.

**In-browser** (served, `agent-browser`): pill green, console clean (only the
self-test line), no horizontal overflow at 375 px or desktop. The payoff was watched
firing on the live path three ways — a full game driven through the page's own
`offerStroke` (the same two calls `endStroke` makes, no private helper); the same
game with `setReduced(true)`, where the verdict lettering, the circled tick and the
aria-live text all still land because no outcome depends on an animation completing;
and a **real dragged curve**, pointerdown → 26 moves → pointerup at pointer-event
level, which committed a move and drew the house's reply.

### HONEST LIMITS

- The tremble / nib / pooling constants are judgement, not measurement. They were
  tuned by eye on a desktop; a real trackpad and a real touchscreen deserve one more
  pass. The grain punch may read faint on a thin fast stroke.
- Headless mouse-button injection did not produce `pointerdown` in this harness, so
  the dragged-curve check above dispatches real `PointerEvent`s at the element rather
  than driving the OS-level button. Everything downstream of hit-testing — the tilt
  transform, spot grab, ghost tail, legality, commit, handover — is exercised; the
  browser's own hit-test is not.
- The house is one ply exact plus taste, and the plaque says exactly that. No winner
  lamp, no solved-game idiom: the only claim on the sheet is the move-count bound.
