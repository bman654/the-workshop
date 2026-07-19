# Catalog Completeness — the §6.4 Page Law

*2026-07-18 · branch `estate/catalog-completeness` · the orphaned-pages sweep + the
mechanism that makes the card catalog automatically complete, enforced by the build gate.*

## The gap that was closed

The manifest's §6.2 completeness law covered **top-level dirs only**. Pages one level
down — `<room>/<sub>/index.html` benches and flat `<room>/<page>.html` leaves — had no
claim channel unless a hand-written scrape rule happened to cover them (only `cavern` and
`the-barrel-house` had one). Result: **~70 subdir benches plus a dozen flat leaves were
invisible to the card catalog**, and nothing forced a new page in.

## The mechanism (manifest.mjs §6.4)

The page universe is every shipped (non-`.src`) `.html` on disk (456 today), walked
deterministically. Every page below the front-door level must land in **exactly one**
claim channel:

| channel | claims |
|---|---|
| the front-door level | root pages (`index.html`, `colophon.html`) + each top-level `<dir>/index.html` — the §6.2 dir law owns those |
| a catalogued href | room / exhibit / collection / hidden entries |
| a `HUBS file:` page | a room's own presenting page (`hours/the-hours.html`) |
| ALLOWLIST, recursive | an engine/meta dir claims its whole tree (`tools/`, `talk/`, `trailer/`, …) |
| the hidden node, recursive | a secret dir's interior stays its secret (`starlight-bend/`) |
| a unit's interior | a non-index page inside an exhibit's own dir is part of that exhibit |
| `DENY` (registry.mjs) | an explicit, reasoned non-catalog page |

**Auto-discovery:** a `<parent>/<sub>/index.html` whose parent is a room dir (or an
enrolled exhibit unit) is a **sub-bench** — enrolled mechanically as a `kind:'bench'`
exhibit of the owning room, named from its own `<h1>`/`<title>`. A bench inside a *gated*
exhibit rides up with `hostedVia` and **inherits the parent's `gate` + `hidden:true`**
(spoiler discipline §4.4 — present-but-hidden, indexed only once earned).

**A NEW page needs no registry edit.** It enters the catalog on the next
`node tools/manifest/manifest.mjs` re-derive. Until that re-derive is committed, the
`--check` staleness gate **names the page**. A page that resolves to no channel lands in
`UNCLAIMED PAGES (…)` and fails by name. A `DENY` row matching nothing on disk fails too
(a stale denial is drift). Hand-maintained tables are now reduced to: the HUBS/INTERNAL
presentation rules, `flat` rows for inherently-ambiguous flat leaves, and `DENY`.

## The gate, wired into the build

```
node tools/manifest/manifest.mjs --check     # the §6.2+§6.4 gate itself
node tools/forge/forge.mjs --check --all     # the BUILD gate — now runs the manifest gate too
```

`forge --check --all` fails (exit 1) whenever a visitor page on disk is not covered by
the committed catalog, naming the orphan(s). Verified end-to-end: planting
`conservatory/__drift_drill__/index.html` turns the build gate red with
`…pages on disk not yet in the committed catalog: conservatory/__drift_drill__/index.html`.

`ledger/collate.sh` gained **PHASE 0**: re-derive the manifest *before* the reclaim hooks
(ordering: manifest → `*/reclaim.mjs` → `forge --all`), so a page added mid-cycle enrolls
at seal time automatically.

Twin: `tools/manifest/manifest.test.mjs` (25 → 42 checks) proves the live laws plus
neg-controls: planted orphan pages fail loud by name (in-process + CLI
`--check --plant-page=…`), a planted sub-bench under a real room is auto-discovered and
the staleness gate names it, a gated within's sub-bench inherits the gate, a stale DENY
row refuses.

## The sweep — 84 pages enrolled (pieces 331 → 415)

**69 auto-discovered sub-benches** (kind `bench`, catalogued under the owning room):

- **sound-garden** (14): out-of-tune, the-beating-bench, the-comb, the-comma,
  the-endless-staircase, the-jug, the-overtone-rack, the-plucked-reed, the-quorum,
  the-sidebands, the-squeal-bench, the-stopped-pipe, the-tartini-bench, the-vowel-throat
- **conservatory** (9): logistic, predator-prey, replicator, schelling, selection-jar,
  sir, the-drift-jar, the-gene-jar, the-pond
- **alchemy** (8): equilibrium, fractionating-column, galvanic-cell, limiting-reagent,
  periodic-table, reaction-balancer, reaction-you-time, titration
  *(presented via a client-side JS bench array — invisible to any link scraper; disk
  discovery is what catches these)*
- **stellar-forge** (8): fusion-ladder, hawking, mass-radius, restricted-3body,
  rotation-curve, scales, the-chirp, tidal-field
- **lodestone-hall** (6): the-eddy-brake, the-lc-tank, the-sorter, the-transformer,
  the-whirligig, the-wire-that-jumps
- **engine-room** (6): brownian, carnot, demon, rijke-tube, stirling, the-pinhole-race
- **puzzle-pavilion** (5): bridge-house, cross-sums, district-line, pearl-loop, switchyard
- **hours** (2): escapement, water-clock *(enrolled under the `gnomon` room; no hours/*
  file touched — WS4 freeze respected)*
- **aerodrome** (2): slingshot, transfer · **relativity** (2): speed-you-cant-add, starbow
- **the-deep-hearth** (2): conduit, melting-floor · **the-drawing-room** (2):
  mechanism-bench, pantograph · **the-foundry** (3): casting-floor, charge-mold, still-pond

**1 gated sub-bench:** `soap-film/surveyor` → conservatory, `hostedVia: soap-film`,
`gate: ws:seen:soap-film`, `hidden: true` (its parent is the gated soap-film within — the
surveyor never leaks before the within is earned).

**14 explicit flat leaves** (`flat` rows in registry.mjs):

- **clockwork** (10): autoregress, context, measurement, next-word, partition, spotlight,
  temperature, tokenizer, turn, unstamped-bag — the Clockwork Automata chapters, each a
  distinct interactive bench (the Cavern shape, flat-filed)
- **hours/analemma.html** (joins the existing almanac row) · **museum/ages.html** ·
  **strange-garden/field-notes.html**
- **the-reliquary/the-mere.html** — a hidden-until-found metagame page; enrolled
  `gate: ws:seen:the-mere` + `hidden: true` (it drops that breadcrumb itself, so it joins
  the index only after the visitor has already found it — pure lock-parity, zero spoiler)

## DENY — explicit non-catalog pages (registry.mjs, each with its reason)

- `the-gate/audio-bench.html` — dev-only SFX render bench (self-titled "dev only")
- `museum/archive/` — frozen snapshots of other exhibits (trailer/talk props); archival
  duplicates, never catalogued twice
- `the-aquarium/art-specs/`, `the-value-of-a-cut/art-specs/` — ART FOUNDRY spec previews
- `undercroft/` — the locked Undercroft's interior; the room itself is catalogued
  (`locked: true`, render-gated), its inside stays unlisted
- ~~`sound-garden/quickening.html`~~ — **now ENROLLED** (see Resolutions below): it *does*
  drop `ws:seen:quickening` (`quickening.src.html:1216`), so it enrols gated+hidden like
  the-mere. Removed from DENY.

The one allowed non-catalog *dir* remains `cabinet-of-honors` (ALLOWLIST, unchanged).

## Judgment calls made (flagging per the under-enroll-and-flag rule)

1. **adventure/ and latch/ interiors NOT catalogued as separate entries.** Both are
   Workbench HERITAGE exhibits (not rooms); their interior pages (the three Lantern
   tales; the akari/slitherlink/warehouse ateliers) are claimed by the unit-interior rule
   as part of the exhibit itself. If you'd rather see the tales/ateliers as their own
   catalog lines, they'd need the exhibit dirs promoted or bespoke rows — say the word.
2. **latch/puzzles.html** — a legacy pre-atelier hub no longer linked from the Latch
   landing; claimed silently as latch's unit interior (it needed no DENY row). Candidate
   for deletion someday; harmless meanwhile.
3. **the-mere enrolled gated rather than denied** — its own breadcrumb makes lock-parity
   exact. The Reliquary card itself stays `locked: true` besides.
4. **readName polish** — HTML entities now decode and leading glyph decoration is
   stripped, which retitled six *existing* entries (e.g. `Theseus&rsquo;s Thread` →
   `Theseus's Thread`, `🌠The Drifting Star` → `The Drifting Star`,
   `Weather You Can Make &middot; The Cloud Bench` → `Weather You Can Make`). Verified
   none are baked into the sky slab (`derive-sky --check` green).

## Resolutions (Claude's calls — Brandon delegated: "creative choice belongs to Claude")

1. **Quickening → ENROLLED** (gated + hidden). The earlier DENY rested on a factual error:
   it claimed quickening drops no breadcrumb, but `quickening.src.html:1216` calls
   `WS.seen('quickening')` (the standard first-visit pattern). There IS a walkable in-estate
   path (no *static HTML* href, but a JS-rendered gated one): the Undercroft's constellation
   (`undercroft/index.src.html`) carries a `quickening` node whose niche reveals a link to
   `../sound-garden/quickening.html` once the visitor has earned it (seen game-of-life +
   lattice) — `WS.unlocked(id,store)` gates it, never leaking into public source. So the
   catalog entry is a COMPLEMENTARY second finding-aid (surfaced once `ws:seen:quickening`
   is set by actually visiting), never the only way in. Enrolled as
   a gated+hidden `flat` row under the Sound Garden (its physical home), keyed on
   `ws:seen:quickening`, exactly as the-mere: the volume carries it, but `filterUnlocked`/
   `exhibitGated` keep it out of the index until the visitor has earned it. Policy upheld
   ("catalog every visitor page"), no metagame edit needed (the breadcrumb already exists).

2. **Adventure tales / Latch ateliers → kept as part of their instrument** (as shipped).
   They are *accounted for* by the §6.4 law (unit-interior claim — not orphans), so nothing
   is missing. The remaining question was presentation granularity, and the editorial call
   is: the bound volume indexes the estate at the ROOM + headline-EXHIBIT grain. The Lantern
   is one adventure engine (its three tales are its content, like a book's tales); Latch is
   one puzzle-atelier suite. A hub-with-internal-variety is one illuminated entry explored
   as a unit — not exploded into a line per leaf, which would dilute a 63-card volume. The
   parents are catalogued and lead the visitor in. (Noted trade-off: individual leaves like
   the Warehouse aren't independently searchable — an acceptable cost for volume legibility;
   leaf-level search is an additive future enhancement if ever wanted.)

3. **`colophon.html` → kept outside the page law.** It sits at the front-door level with the
   map, like `index.html` itself — estate chrome, not a visitor exhibit. Correctly out of
   the law's universe; the gate is happy (forge --check green).

## Gate readout at HEAD (all green, run first-hand)

```
node tools/manifest/manifest.mjs --check   → OK — complete (dirs + pages) · 415 pieces · unclaimed-pages 0/456
node tools/manifest/manifest.test.mjs      → 42/42 PASS
node card-catalog/core.test.mjs            → THE VOLUME IS COMPLETE & TRUE (incl. SEALED/UNSEALED spoiler checks)
node tools/layout/estate.test.cjs          → 40 passed, 0 failed
node tools/forge/forge.mjs --check --all   → all 159 file(s) current + manifest gate OK
node tools/sky/derive-sky.mjs --check      → sky.js slab current   · sky.test 89/89
node tools/tour/tour-check.mjs             → 8/8 PASS
calendar suite (untouched)                 → 80/80 · 81/81 · 114/114
```
