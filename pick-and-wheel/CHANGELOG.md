# The Pegboard Planimeter — Pick & the Wheel · CHANGELOG

A brass 8×8 pegboard you stretch one rubber polygon across. Two disjoint roads to
its area, two brass dials that settle on the SAME number:

- **Green / the wheel** (calculus): a measuring wheel ROLLS the boundary —
  `A = L·ΔW`. The wheel core is borrowed **byte-for-byte** from the Planimeter
  next door (`planimeter/index.html` L321–376).
- **Pick / the dots** (counting, number theory): the lit dots count themselves —
  `A = I + B/2 − 1`. Green interior dots, gold boundary dots (including the
  gcd-midpoints of slanted edges). Pure integers; no calculus symbol.

The two cores share **no code** — their agreement on the same area IS the proof
(asserted falsifiable in the test). Drag a vertex off a peg and Pick greys to
UNDEFINED while the wheel still reads true: the lattice precondition is
load-bearing, and you can feel it.

## v1 — cycle #102 (2026-06)

### The room
- `core.mjs` — the SOLE math authority, DOM-free, shared by the page and the
  headless twin.
  - ROAD A: the `WHEEL-CORE` slab (`solveElbow` · `armDir` · `wheelRoll` ·
    `measuredArea`) copied byte-faithful from the Planimeter, between sentinels;
    plus the room's own adapter — `SCALE=0.5`, `POLE={0,−6}`, `ARM_M=6`,
    `ARM_L=5` (the validated reach envelope, 0/600 unreachable over the random
    suite), `densifyClosed`, `wheelArea` (returns the area in **lattice units**,
    `area / SCALE²`, so both needles read one number).
  - ROAD B: `gcd` · `shoelace` · `boundaryPoints` · `pick` (simple ring) ·
    `pickWithHoles` (the verified two-ring annulus path — NOT the naive keyhole,
    which silently agrees on the wrong shape).
  - SHARED: `classifyNodes` (exact-integer `onSegment` + ray-cast `pointInPoly`)
    — the board paints its lit dots from this, and the test asserts its counts
    equal `pick().B` / `pick().I`, so the dots you see ARE the needle.
  - `isSimple` — hardened to reject improper touches / collinear overlaps (a
    vertex on a non-adjacent edge), not just proper crossings; the live board's
    drag-commit guard uses it.
- `core.test.mjs` — the headless Node twin, GREEN **19/19** exit 0 (seeded
  mulberry32). Proves a–h: (a) wheel === count over 300 random polygons
  (100 convex + 100 non-convex + 100 holed), worst rel-err **1.5e-7**;
  (b) integrality; (c) three-method agreement on a curated L-tromino;
  (d) the off-lattice negative control; (e) gcd/boundary sanity; (f) determinism;
  (g) the disjointness witness (the soul made falsifiable, read as text);
  (h) byte-parity of the WHEEL-CORE slab against `planimeter/index.html` L321–376;
  plus a classifyNodes in-sync cross-check.
- `index.html` — the touchable form: the brass pegboard, the rubber polygon you
  drag (mouse AND touch, snaps to a peg, only commits if simple), live dot
  lighting, two brass dials (a rolling hatch-wheel hub for Green, a dot-counting
  hub for Pick), the center compute line + agree-pill + gold tie-bar, presets
  (Square · L-shape · Staircase · Hole [static two-ring] · Randomize), the
  ⚠ break-the-lattice button + a Pin-to-lattice toggle (the live off-lattice
  free-drag), three cosmetic skins, 2× PNG export, an in-page self-test pill
  (7/7 ✓, proving a–d in-browser), and reciprocal sib-links to the Planimeter
  and the Dissection Bench.

### Found & fixed (the director's spec was wrong twice — the math caught it)
- The spec's integrality claim `2A % 2 === 0` is **mathematically false**: a
  simple lattice polygon may have **half-integer** area (B can be odd; e.g. the
  triangle (0,0)(3,0)(0,1) has A=1.5). The load-bearing invariant is that `2A`
  and `B` share **parity** — `2A − B = 2(I−1)` is even — which is what
  guarantees integer I. The test now asserts the true invariant.
- `round(wheel) === count` only holds for whole-area polygons. The honest check
  snaps the wheel to the nearest **half** (`round(2·wheel) === round(2·count)`),
  which passes 300/300.
- `isSimple` was proper-crossing-only and admitted degenerate self-touching
  polygons, which over-counted the gcd boundary and produced a negative interior;
  it now rejects collinear overlaps and vertex-on-edge touches.

### Notes
- A harmless, labeled `window.__pw` test hook is exposed for headless drag
  verification. It is not used by the UI.
- No front-door **field star** was added: the Reckoning-wing siblings (the
  Reckoning Cabinet landing, the Dissection Bench) carry none, so matching the
  idiom means none here.
