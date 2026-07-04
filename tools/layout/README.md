# layout.js — the estate plan's declarative placement engine (v2, the polar contract)

`Layout` turns a room's **declared intent** (`district` + `tier` + optional `wing`) into
**every coordinate** on the map: footprint size & position, district & wing hulls, the
circulation graph (door → spine → avenues → aisles → stubs), the engraved zone/wing labels,
and the derived viewBox/camera. No room carries a pixel — adding a room is appending
`{ district, tier, (wing?) }` + the content fields to `PLACES`.

## The v2 shape — a facade over three pure libraries

`layout.js` is now a thin **facade**. It wires three sibling libraries and translates each
district's locally-packed slots to WORLD coordinates about the **manor pole**:

- **`contract.js`** — the polar **DEEDS**: `CONTRACTS` (per district `{angle, tier, theme,
  layoutFn, capacity}`) + `CLUSTER_META` + `ROAD`/`LANES` + the schema. A district's
  `{angle, tier}` is an **immutable deed**; everything else derives from it. (`fnv1a32`/`hash01`
  live here too.)
- **`polar.js`** — the **SOLVER**: quantized tier radii, the angular separation law, the derived
  viewBox/camera/scale, and `freeSlots` (the petition menu).
- **`formations.js`** — the **PACKERS**: one named layoutFn per district
  (greathouse · rings · pascal · ashlar · court · crescent · knot · roadside), each with an
  honest geometric `maxCapacity`; the generic grid is retired.

The closed v1 region tables (`DISTRICTS` / `GROUNDS_WINGS` / `WING_META` / `SIZE_BAND`) and the
frozen manor shell box are **gone** — a district is no longer a pinned pixel region, it is a deed
on the wheel. Read `contract.js` / `polar.js` for the binding contract; `map-process.md` is the
process narrative.

## How the front door uses it

`index.src.html` inlines `contract.js` / `polar.js` / `formations.js` / `layout.js` as forge
includes and calls the facade once:

```js
const LAYOUT = Layout.solve(PLACES);   // throws on an unknown district/cluster (hard build error)
PLACES.forEach(p => { const f = LAYOUT.foot[p.id]; /* … copy x/y/w/h|r back onto p … */ });
```

The solved `LAYOUT` is a strict **superset** of the v1 surface:

- `foot[id]` → `{x,y,w,h}` (or a disc slot) — copied back onto each PLACES entry so the
  **unchanged** footprint drawers + label/leader geometry (which read `r.x/r.y/r.w/r.h`) run
  against the derived slots.
- `districtRects[]` / `wingRects[]` → the tinted, labelled precinct hulls.
- `structures[]` → the §5.1 district structures (the fit-view estate tier draws these as nav —
  a monogram plinth or a bespoke district rep — not room labels).
- `graph` → `{ door, spine, avenues[], aisles[], stubs[] }` — the real adjacency network.
- `world` → `{ viewBox, centre, R[], freeSlots, districts, field, … }` — the derived camera the
  page reads (svg viewBox, panZoom bounds, LABEL_BOUNDS) rather than any forged literal.

Other facade methods:

- `Layout.plates(places[,opts])` → the total/disjoint plate partition (parent ∪ child), the
  per-plate camera frames, the reciprocal road graph, and the **fold** (a detached district — the
  fairground — shows only its gate face; its rooms lay out in a `child:<id>` plate).
- `Layout.freeSlots(tier[,ρ])` → the live **petition** menu (§1.5): the open slots a new district
  may claim, interpolated by the current relief.
- `Layout.basementSlot(0|1)` → the two gated ways down (Undercroft / Reliquary), in world coords
  (`beneathSlot` / `sealedStudySlot` alias them).

## Star safety

Every district frame is confined to the star-clear interior envelope `FIELD`; the Survey-of-Heaven
catalog stars lie outside it, and **star-clear is now `derive-sky` / `sky.test`-owned** (the sky
slab is emitted from the same polar catalog, so a generated footprint can never collide with a
star). After any change to an angle, frame, or reservation, re-run the gate suite below — the
polar-contract, estate, and sky tests together prove the layout stays star-clear and deterministic.

## The gate suite — run after any change

```
node tools/layout/polar.test.cjs        # the polar contract engine: schema + radius/angle solver + determinism
node tools/layout/formations.test.cjs   # the packer registry n-sweep + n=capacity+1 THROWS, per formation
node tools/layout/estate.test.cjs        # THE POLAR ESTATE GATE (replaces smoke.cjs): deeds unique, hulls disjoint,
                                         #   footprints contained, plates partition, viewBox quantized, double-run byte-identical, + neg-controls
node tools/layout/legibility.test.cjs   # the label conscience: hard per-district-plate gate + its self-consistency neg-controls
node tools/layout/door.test.cjs         # the front-door legibility pill, AS A NODE TWIN (arms by wave, §9.2 — see below)
node tools/layout/fold.test.cjs         # the contract-level fold round-trip (F-series)
node tools/layout/gate-dom.test.mjs     # the LIVE-DOM platewalk gate — REAL headless browser input (LOD, structures-as-nav, ascend/descend)
node tools/layout/emit-mirror.cjs       # re-emit the FOOTPRINTS mirror sky.test.cjs consumes
node tools/sky/sky.test.cjs             # the sky gate (the mirror is updated in lockstep)
node tools/forge/forge.mjs --check --all # every forged page current
node tools/forge/forge.mjs --audit-seen  # the ws:seen breadcrumbs
node tools/manifest/manifest.mjs --check # the estate manifest: completeness · no double-claim · count floors · not stale
node tools/manifest/manifest.test.mjs    # the manifest gate's own neg-controls (a planted unclaimed dir FAILS loud)
bash tools/layout/doc-drift.sh           # the DOC-DRIFT twin: anchored v1→v2 stale-vocabulary sweep (prose has no other gate; excludes CHANGELOG/worklog/ledger/tabularium)
```

Each test prints its own pass count — no counts are hard-coded here, so nothing drifts.

`sky.test.cjs` MIRRORS the generated footprint bboxes; if a room's declaration changes its slot,
re-run `emit-mirror.cjs` and paste its `FOOTPRINTS` block into the test **in the same commit**, or
the test false-fails.

`door.test.cjs` is the front door's own legibility/well-formedness pill run as a **node twin**
(#337): the pill once lived only in the browser, where a builder's Node gates could report green
over a rendered-red door. The twin runs the SAME claims (the shared `door-claims.cjs` the page also
forge:includes) over the SAME live PLACES, so it goes red iff the pill is red — see its output for
the live verdict (no hard-coded digit). Under the polar reorg every claim is a pure function of
PLACES + the polar solve — identical in Node and the browser **by construction** — so the old
getBBox `door-mirror.cjs` + CHAR_W calibration guard are **retired**; the rendered-truth check now
lives in `gate-dom.test.mjs`, which drives the real DOM with **real** browser input (the house
lesson: `dispatchEvent`/`.click()` are not a real click). Claims **arm by wave** (§9.2): a claim
that self-skips before its wave is expected, not a failure — the twin exits non-zero only when an
**armed** claim is red or a neg-control fails to fire.
