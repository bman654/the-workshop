# The Fairground Gate — CHANGELOG

*The estate's first true detach-into-depth LAYER, shipped as a DECLARATIVE FOLD owned by the
layout engine. A full wing whose any room declares `detach:true` folds out of its crowded parent
plate into its own `child:<wing>` layer — a nested zoom-sheet reached only by descending through an
in-map GATE FACE, exactly as the Undercroft is a second layer reached by descent. The `amusements`
wing is the primitive's first caller: 15 rides that used to cram a 23px-wide column on the East
Grounds now fan across their own airy midway, and you ENTER them through a lit fairground gate. The
fold relieves the door's crowding — CLAIM C′ flips the door pill from ✗16/17 RED to ✓17/17 GREEN —
proving DEPTH, not a scorer tweak, did it (the neg-control with detach OFF stays red).*

## #369 — built (the declarative fold primitive + the founding amusements detach)

A render-owning grounds swing. The work is in three layers:

### 1. The engine fold (`tools/layout/layout.js` — the one place the magic lives)
- `detachedWings(places)` — pure, deterministic, reads only `places`; returns `{wing:true,…}` for
  every wing with a `detach:true` room (empty when none).
- `plateOf(r, solution, detached)` — ONE new branch BEFORE the district/midline logic routes a
  detached wing's room to `'child:'+wing`; everything else unchanged.
- `plates(places[, opts])` threads `detached` through and adds three GENERAL pieces (none knows the
  word "amusements"): (a) each CHILD plate is a first-class plate framed from its OWN `relayPlate`
  field envelope, exposed in a separate `childLayout` map (the canonical `solution.foot` is NEVER
  overwritten — the sky stars + the sky/door mirrors keep reading it); (b) the parent GATE FACE
  auto-emits as one synthetic furniture tile (no card / no `ws:seen` / no star; excluded from every
  count) centred in `GROUNDS_WINGS[wing]`; (c) the DESCENT edge threads the camera graph generically
  (`link('child:'+wing, parentPid)`, with a fallback so a child is never stranded). New return shape:
  `detached`, `childPlates`, `childLayout`, `parentOf`, `gates`. `opts.detachOff:true` = the
  byte-identical NEG-CONTROL.

### 2. The page (`index.src.html` — the platewalk module, REUSED not forked)
- `child:*` ids are excluded from the platebar presets (the child is reached ONLY by its gate, an
  in-map threshold like the Undercroft stair) while still carrying a frame.
- The GATE FACE is a `.gate-face` SVG group at `gates[].box`, a LOUD legible on-ramp (engraved
  "15 AMUSEMENTS · ADMIT ONE · DESCEND" + a full-opacity ~2.4s glow-pulse on the keyway — NOT the
  too-dim 0.28 rune the Undercroft once was). Click/Enter `descend()`s.
- `descend()` re-lays the 15 child tiles to their airy relay positions (translating each `.poi` AND
  its label wrapper by the same delta, so leaders stay intact), flies the camera in on a deeper
  `.walking-deep` ease (~920ms, one continuous forward flight, not a cut), reveals the cobbled MIDWAY
  ground + a sewn-ribbon breadcrumb. `ascend()` (the ribbon, Esc/Backspace, or the platebar `↩ back`
  row) eases back up. A by-hand wheel/drag at depth drops to free-explore and un-folds (the gate is
  re-enterable). Reduced-motion degrades the dive to an instant frame.
- ZERO new ws:seen wiring: each child room is the SAME `.poi` link, so descending drops its
  breadcrumb + kindles its sky star exactly as today (verified in-browser).

### 3. The art (in-house; WIRED IN)
- `the-fairground-gate/gate-art.js` now installs the rich `window.GateArt = {drawFace, drawMidway}`,
  which the platewalk module prefers over its inline placeholders (kept as the try/catch safety net):
  - **drawFace** — the hero GATE FACE: a brass-on-ink midway ARCH over two slim piers, strung
    teal-and-brass BUNTING along the crown swag, a gabled TICKET BOOTH with a warm glowing window +
    fascia rule, and the LIT TEAL THRESHOLD (the single `.gate-glow` keyway, CSS-pulsed) you step
    through, with the beckoning descend chevron (`.gate-chev`) at its foot. All geometry derives from
    the engine's `box` (≈96×120, centred in the amusements region); the page lays the "15 AMUSEMENTS"
    legend separately. Reads instantly as "a quarter you ENTER," legible at the plan tile size.
  - **drawMidway** — the faint cobbled CHILD MIDWAY ground (opacity 0 until descent): a central
    promenade spine + flanking avenue lines, a sparse paved-ground cobble hatch, distant strung
    pennants arcing across the top, and a far-gate silhouette with two footlight dots at the avenue's
    foot — atmosphere under the re-laid tiles, never competing with them.
  Specs + a preview harness in `art-specs/` (`gate-face.md`, `midway.md`, `ribbon.md`, `preview.sh`).
  The sewn-ribbon breadcrumb is COMPLETE as HTML/CSS (the red-silk Colophon idiom recoloured).
- VERIFIED in-browser this turn: the forged face renders contained in its footprint (group bbox
  ~80×128, one `.gate-glow` + one `.gate-chev`); a full descend→ascend round-trip is clean (midway
  reveals, the red ribbon pins, the platebar gains its `↩ back` row, Esc/ribbon both ascend, the gate
  is re-enterable), no console errors, all five regression gates still green
  (door 17/17 · fold 5/5 · forge --check 117 · audit-seen 87 · sky 73/73 · legibility 29/29).

### The verifiable wins — all by a headless Node twin over the LIVE door (no eyeballing)
`tools/layout/fold.test.cjs` (lifted from the proven `/tmp/foldsim.cjs` kernel into the smoke.cjs
CRUX idiom) proves, over the live `Layout.plates`:
- **F1 BIJECTION** — Σ rooms across parent ∪ child === live count (86/86, 0 double-counted, 0
  stranded); the gate face excluded from the count.
- **F2 TREE** — the descent graph is acyclic, rooted at the manor door, every plate reachable,
  adjacency reciprocal; each child hangs by exactly ONE gate edge. Proven LIVE and on a SYNTHETIC
  2-detached-wing fixture (N children, not 1).
- **F3 THE LOAD-BEARING WIN** — with detach ON, aggregate tier-1 survival crosses ⌈raw×0.6⌉ (26/38 ≥
  23), so `door.test.cjs` CLAIM C′ flips ✗→✓.
- **F4 NEG-CONTROL** — detach OFF: byte-identical partition, C′ stays ✗ (21/38) — depth did it.
- **F5 GENERALITY** — a synthetic detach of a DIFFERENT wing (optics) mints `child:optics`, one gate,
  passes F1/F2 — amusements is just the first caller.

The live `door.test.cjs` now reads **PASSABLE 17/17** after `door-mirror.cjs` was regenerated headless
(the #337 canonical env; tier-1 boxes h=55.949) with a per-row `frame` tag (parent | child:amusements)
and its GATE-BROKEN guard extended to require the mirror cover EXACTLY the placed POIs across BOTH
frames (a stale/mistagged child box trips exit 2 — verified).

**Scope held:** the 15 bench INTERIORS are untouched — this ships the LAYER mechanism + the founding
detach + the gate/midway/ribbon art, nothing more.
