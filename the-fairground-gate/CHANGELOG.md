# The Fairground Gate — CHANGELOG

*The estate's first true detach-into-depth LAYER, shipped as a DECLARATIVE FOLD owned by the
layout engine. A full wing whose any room declares `detach:true` folds out of its crowded parent
plate into its own `child:<wing>` layer — a nested zoom-sheet reached only by descending through an
in-map GATE FACE, exactly as the Undercroft is a second layer reached by descent. The `amusements`
wing is the primitive's first caller: 15 rides that used to cram a 23px-wide column on the East
Grounds now fan across their own airy midway, and you ENTER them through a lit fairground gate. The
fold relieves the door's crowding — CLAIM C′ flips the door pill from ✗16/17 RED to ✓17/17 GREEN —
proving DEPTH, not a scorer tweak, did it (the neg-control with detach OFF stays red).*

## #376 — bug-fix: the fold now EXECUTES in the live render (it shipped green on twins, broken in the browser)

#369 shipped green on the modeled twins but the fold never ran in the live page: the 15 amusement
tiles stayed crammed on the parent grounds-east plate (the gate drawn OVER them), the relay was a
transient on-descend transform never reflected in the page's box-of-record, a real pointer click in
the open arch fell THROUGH the thin-stroke art and missed, and the live `#doortest` pill computed
CLAIM C′ from the CROWDED canonical boxes → ✗16/17 RED (the canonical path sits at the 22/23
knife-edge; the headless capture landed 23, masking the red). The root-cause fix, in four coupled
parts — NO change to `layout.js`, `solution.foot`, or the sky:

- **(A) THE FOLD IS REAL AT REST** (`index.src.html` platewalk). A detached wing's tiles LEAVE the
  parent: `setChildVisible(cpid,false)` sets the 15 `child:amusements` `.poi` tiles + their label
  wrappers to `display:none` at build time and on free-explore (the parent shows ONLY the synthetic
  gate face in the hole — no crowded column). `descend()`/`relayChild()` reveal + relay them into
  the airy midway; ascend/free-explore fold them away again. (`placeLabels()` still runs with all
  tiles visible, so the canonical `SOLVED` map is unchanged — sky, the door-mirror, and the resting
  composite read the untouched canonical foot.)
- **(B) CLAIM C′ FLIPS GREEN AT THE TRUE SOURCE** (`door-claims.cjs`). `runDoorClaims` now takes a
  `childFoot` map (the engine's relay foot, `DoorClaims.childFootOf(Layout.plates(live))`); the C/C′
  declutter projects each detached child room's canonical SOLVED box by relayChild's delta into the
  airy midway and reads its centre from the relay foot — the LIVE geometry the render produces. The
  live pill (and door.test) both feed it, so C′ flips ✗16/17→✓17/17 by DEPTH (mirror 26/38 solid).
  A `detachOff` neg-control (no child plate, the rooms back on grounds-east) keeps C′ RED — proving
  the FOLD, not a scorer tweak, did it. The canonical SOLVED map / sky / mirror boxes are UNTOUCHED;
  the relay is a parallel override applied only inside the declutter.
- **(C) THE GATE IS TRULY CLICKABLE** (`gate-art.js` drawFace + the placeholder). An invisible
  full-box `.gate-hit` rect (fill `rgba(0,0,0,0)`, FIRST in paint order) under-paints the art so a
  real pointer click anywhere in the footprint — including the open-arch negative space — catches
  and descends (SVG hit-tests only painted pixels; the thin-stroke arch alone let clicks fall
  through). The `.gate-glow`/`.gate-chev` contract + the visible art are unchanged.
- **(D) THE VERIFICATION GAP IS CLOSED** (the #337 blind spot, several times over). `door.test.cjs`
  + `fold.test.cjs` now feed the SAME live `childFoot` the page does (`fold.test` F6 runs the exact
  `runDoorClaims` seam the pill runs; the detachOff neg-control is asserted in BOTH twins). A NEW
  live-DOM gate `tools/layout/gate-dom.test.mjs` drives a real headless browser and asserts what the
  Node twins CANNOT see: D1 at rest the 15 child tiles are display:none/getBBox=0 (the column is
  GONE), D2 `document.elementFromPoint` over the open-arch centre returns a `.gate-face` descendant,
  D3 a REAL arch click descends (midway reveals, ribbon shows, 15 tiles relayed), D4 ascend re-folds
  + the gate is re-enterable, D5 the live pill reads 17/17. door-mirror.cjs stays the plain canonical
  getBBox anchor (its header now documents that the relay is applied LIVE on top, never baked here).

Verified in a real browser (agent-browser, top-level index.html): at rest the grounds-east plate
shows only the lit gate (15 tiles folded away); a real click in the arch descends into the midway
where the rides fan out airily; ascend returns; the live `#doortest` reads 17/17 GREEN. All gates
green: forge --check (120 current) · door.test 17/17 + detachOff neg-control RED · fold.test (6
cruxes incl. the new F6 live-C′ seam) · legibility 29/29 · sky 73/73 · audit-seen 87/87 · the new
gate-dom.test (D1–D5). The gate/midway/ribbon art is unchanged — this fix is render-pipeline +
conscience plumbing + verification only.

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
