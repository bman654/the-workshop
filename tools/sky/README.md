# `sky` — The Survey of Heaven (the front door's personal night sky)

A cross-page metagame whose **visible surface IS the estate map**. The dark
margins of the surveyor's plate are a night sky that **records where you have
been**: the first visit to any room kindles a star in the dark band beside it;
rooms in the same **wing** are joined by a faint asterism line; visiting **all**
of a wing's members **completes** its asterism (lines brighten to brass; an
engraved name + a one-line myth appear in the margin); completing every wing
fires an all-skies capstone.

It reads the `ws:seen:<id>` breadcrumb that **every page already drops** (via the
shared [`ws`](../ws/README.md) module), so it needs **no per-page
instrumentation**. It is always-visible, **monotone** (visiting more only ever
*adds* a star / line / completion — it never removes one), never gated, and
**cosmetics-only**: it confers no access and touches no existing predicate. It
deepens the workshop's celestial vein — Firmament *invents* skies, the Orrery
shows the *real* one, the Almanac reads real ephemeris — with a third register: a
**personal** sky that maps **your** visits.

One module, inlined into the front door **via forge**
(`<!-- forge:include tools/sky/sky.js -->`); the shipped `index.html` stays
self-contained. The module is dual-use (a `Sky` global in the browser; a
CommonJS export for the Node self-test).

## The catalog & wing convention

`Sky.CATALOG` — one star per front-door-visitable id (the front-door POIs **and**
their companions):

```js
CATALOG = { '<id>': { x, y, mag } }   // x,y in the 1440×900 viewBox; mag 1..3
```

Positions are **hand-placed in the dark margins** (outer bands & corners), away
from the manor candle-pool (`x421 y150 600×600`) and clear of every footprint and
plan-furniture bbox. `mag` is a visual magnitude (1 = brightest/biggest); a wing's
"lead" star reads a touch brighter than its companion so the asterism has
structure.

`Sky.WINGS` — the six real companion-pairs, each an **asterism** with an engraved
name + a one-line Oracle-flavoured myth:

| wing | members | engraved name |
|---|---|---|
| `celestial` | firmament, orrery | The Astronomer |
| `design` | compositor, blazon | The Compositor |
| `labyrinth` | daedalus, ariadne | The Maze & Thread |
| `realm` | cartographer, bastion | The Cartographer |
| `letters` | verse, scriptorium | The Scribe |
| `garden` | strange-garden, tessellarium | The Gardener |

Catalog ids that aren't in any wing (`sound-garden`, `threshold`, `theogony`,
`arcade`, `workbench`, `undercroft`) are **field stars**: they kindle on first
visit but aren't (yet) paired into an asterism. Adding a future wing = adding one
entry to `WINGS` with members that already exist in `CATALOG`.

## Pure API (DOM-free core)

```js
Sky.state(visited, CATALOG, WINGS)   // visited: Set | array | {id:true} map
// → { stars:[{id,x,y,mag}],                       // lit catalog entries
//     lines:[{wing, points:[[x,y]…], complete}],  // per-wing polyline (partial ok)
//     asterisms:[{id,name,myth,members, complete: members.every(visited)}],
//     allComplete }                                // true iff every wing complete
```

`state()` is **deterministic**, **order-independent**, and **monotone** (a
superset of `visited` yields a superset of lit stars / line points / completed
asterisms). `Sky.visitedFromStore(store)` builds the visit map from a WS store
snapshot's `ws:seen:<id>` keys.

## DOM renderer

- `Sky.bootstrap(store)` — on the **first ever** run on this origin
  (`ws:flag:sky-bootstrap` absent), silently mark every **already-complete**
  asterism's `ws:flag:sky-<id>-named` flag (so a returning visitor gets no
  retroactive name-in animation), then set `ws:flag:sky-bootstrap`. Idempotent;
  mirrors `WS.bootstrap`. Run **before** `renderInto`.
- `Sky.renderInto(sheet, PLACES, store)` — build `visited` from the store, call
  `state()`, and draw a `<g class="sky">` as the **first child** of `#sheet` (so
  stars sit "in the paper", behind the grid & footprints). Lit star = a small
  twinkling `<circle>` (static under `prefers-reduced-motion`); asterism lines =
  hairline polylines that brighten to brass on completion; a newly-complete
  asterism whose `-named` flag is absent gets its name/lines animated in once,
  then the flag is set (steady thereafter). Adds a margin tally
  *"Survey of Heaven — N/6 skies charted"*. The returned `<g>` carries
  `__skyNamed` (the asterisms to engrave, each `{ast, firstTime}`) and
  `__skyState`, which the map's label pass reads to route the engraved names
  through the `LabelPlacer` solver so they never collide with POI labels or
  footprints.

## Cosmetic-flag namespace (the ONLY keys this module writes)

All additive; none affects any existing `WS.SECRETS` predicate:

| key | meaning |
|---|---|
| `ws:flag:sky-<wingId>-named` | this asterism's engraved name has been shown (so the name-in animation fires only once) |
| `ws:flag:sky-bootstrap` | the Survey has run once on this origin (returning visitors get no retroactive animation) |
| `ws:flag:firmament-survey` | the all-skies **capstone**: every wing is complete |

Reads cross-page state from the **same `ws:` bucket** via `WS.store()`. The
Undercroft's *"forget my discoveries"* reset clears all `ws:*` keys — including
these — so forgetting also re-arms the Survey.

## Self-test

```
node tools/sky/sky.test.cjs
```

Requires the module via its CommonJS export and proves the five load-bearing
properties: **(1)** determinism + order-independence; **(2)** monotonicity (a
superset of visits never removes a star/line/completion); **(3)** completion-iff
(`complete === members.every(visited)`, swept over each member-minus-one — no
false completion — and the full set; `allComplete <=> capstone`); **(4)** catalog
integrity (every star inside the viewBox and outside every footprint, furniture
box, and the manor pool); **(5)** bijection (every front-door PLACES id maps to
exactly one star; every wing member is a unique catalog id in exactly one wing).
Prints `sky self-test: N/N PASS`; exits non-zero on failure.

## Local testing caveat

The `ws:` system shares storage by **origin**, so the sky only fills on a served
origin — never `file://`. Run `python3 -m http.server 8144` from the worktree
root and browse `http://127.0.0.1:8144/`. See [`/UNLOCK.md`](../../UNLOCK.md).
