# layout.js — the estate plan's declarative placement engine

`Layout` turns a room's **declared intent** (`district` + `tier` + optional `wing`)
into **every coordinate** on the map: footprint size & position, district & wing
boundaries, the circulation graph (door → spine → avenues → aisles → stubs), and
the engraved zone/wing labels. No room carries a pixel — adding a room is appending
`{ district, tier, (wing?) }` + the content fields to `PLACES`.

## How the front door uses it

`index.src.html` inlines this file as the **4th forge include** (after ws / label /
sky) and calls it once:

```js
const LAYOUT = Layout.solve(PLACES);   // throws on an unknown district (hard build error)
PLACES.forEach(p => { const f = LAYOUT.foot[p.id]; /* … copy x/y/w/h|r back onto p … */ });
```

The solved `LAYOUT` carries:

- `foot[id]` → `{x,y,w,h}` (or `{x,y,r}` for a tower) — copied back onto each PLACES
  entry so the **unchanged** footprint drawers + label/leader geometry (which read
  `r.x/r.y/r.w/r.h`) run against the derived slots.
- `districtRects[]` / `wingRects[]` → bounded, tinted, labelled precinct hulls.
- `graph` → `{ door, spine, avenues[], aisles[], stubs[] }` — the real adjacency
  network the avenues now MEAN (not a decorative every-folly fan).
- `Layout.beneathSlot()` → the reserved cellar slot the gated Undercroft uses.

## Config tables (closed — an unknown id is a build error)

- `DISTRICTS` — the six districts, each with a fixed `region` budget (the packer
  fills WITHIN it; it is not a room position), `inside`, `style`, `label`, `hue`.
  The **manor** region is pinned to the historic shell box (x586 y296 270×208) so
  the candle-pool + frozen coordinate envelope stay sky-valid.
- `GROUNDS_WINGS` — per-wing sub-regions for the grounds, spread to kill the dead
  upper-right (AMUSEMENTS is anchored INTO it by construction).
- `WING_META` — display label + representative accent (+ optional `grows:N`).
- `SIZE_BAND[tier]` — footprint w×h by rank (1 grand / 2 standard / 3 folly).

## Star safety

Every district frame is confined to the **star-clear interior envelope** `FIELD`
(x162 y150 1116×668). All 35 Survey-of-Heaven catalog stars lie OUTSIDE it, so a
generated footprint can never collide with a star. After any change run:

```
node tools/layout/smoke.cjs        # footprints in-field, star-clear, no overlaps, asserts
node tools/layout/legibility.test.cjs  # the conscience's self-consistency on the controls (29 checks)
node tools/layout/door.test.cjs    # the front-door 17-claim pill, as a NODE TWIN (see below)
node tools/layout/emit-mirror.cjs  # re-emit the FOOTPRINTS mirror for sky.test.cjs
node tools/sky/sky.test.cjs        # must stay 73/73 (the mirror is updated in lockstep)
node tools/forge/forge.mjs --check index.src.html   # current
node tools/forge/forge.mjs --audit-seen             # all 18 breadcrumbs
```

`sky.test.cjs` MIRRORS the generated footprint bboxes; if a room's declaration
changes its slot, re-run `emit-mirror.cjs` and paste its `FOOTPRINTS` block into the
test in the SAME commit, or the test false-fails.

`door.test.cjs` is the front door's own **17-claim legibility pill, run as a node
twin** (#337). The pill lived only in the browser (`runDoorSelfTest` in
index.src.html), where it reads the LIVE estate and goes **✗16/17** (CLAIM C′) — but
smoke/legibility only check the conscience on synthetic controls, so the gate reported
green over a red door. The twin runs the SAME 17 claims (the shared `door-claims.cjs`
the page also forge:includes) over the SAME live data: 14 claims are DOM-free; the 3
declutter claims (B/C/C′) read the rendered SOLVED label boxes, so the twin MODELS them
(`Layout.solve` + `legibility.cjs`'s `labelBoxWH` + `LabelPlacer`) and a **calibration
guard** ties the model to a checked-in `door-mirror.cjs` (the rendered getBBox truth,
captured once via agent-browser) — verifying the modeled boxes yield the SAME verdict the
rendered mirror does, claim-for-claim. So `door.test.cjs` **exits non-zero whenever the
live door is red** (currently ✗16/17 on CLAIM C′ — that red is the separate
hierarchy/declutter root, faithfully reported, NOT a regression in this gate); it goes
green only when the door's crowding root is fixed. Regenerate `door-mirror.cjs` (the test
prints how, and fails loudly on a stale mirror) when rooms or the type scale change.
