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
- **the-reliquary/the-mere.html** — a hidden-until-found metagame page; enrolled hidden
  behind `ws:seen:the-mere` (its own WS.unlocked predicate — since §6.5 carried as a
  `lock` descriptor), so it joins the index only once found — lock-parity, zero spoiler

## DENY — explicit non-catalog pages (registry.mjs, each with its reason)

- `the-gate/audio-bench.html` — dev-only SFX render bench (self-titled "dev only")
- `museum/archive/` — frozen snapshots of other exhibits (trailer/talk props); archival
  duplicates, never catalogued twice
- `the-aquarium/art-specs/`, `the-value-of-a-cut/art-specs/` — ART FOUNDRY spec previews
- ~~`undercroft/`~~ — **superseded by §6.5** (below): every Undercroft interior page is a
  walkable place-secret, so each is now CATALOGUED hidden behind its own niche lock.
- ~~`sound-garden/quickening.html`~~ — **enrolled**, now locked on its true PATH lock (§6.5).

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
   catalog entry is a COMPLEMENTARY second finding-aid, never the only way in. Enrolled as
   a gated+hidden `flat` row under the Sound Garden (its physical home). *(Superseded by
   §6.5: the original `ws:seen:quickening` key was a VISIT-proxy — you could walk the
   revealed niche link before the catalog admitted the page existed. It is now locked on
   the niche's own predicate, `game-of-life && lattice`, per the same-locks law.)*

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

## §6.5 BOTH-OR-NEITHER + SAME-LOCKS (the keeper's sharpened invariant)

*"The catalog catalogs everything that can be found by a visitor and honors the same
hidden locks a visitor would encounter walking the path. All rooms need both or neither."*

**The lock model.** The estate's canonical reveal-locks live in `tools/ws/ws.js`
(`WS.SECRETS`, per-id `unlocked(store)` predicates) and the front door's reveal-fns.
Functions can't ride into a JSON slab, so `registry.mjs` carries **`LOCKS`** — data
transcriptions in the `lockMet` grammar (`card-catalog/core.mjs`): string leaf = key
present · `{key,min}` = numeric ≥ · `{distinctSeen:n}` = n distinct `ws:seen:*` keys ·
`{all:[…]}`/`{any:[…]}` combinators, nestable. At build time the manifest attaches each
secret's descriptor to its catalog entry (`lock` + audit-side `lockId`), reclaim bakes it
into the slab (rooms too, via **`ROOM_LOCKS`**), and `core.mjs` evaluates the descriptor
against the live store — pure, Node-twinnable, no browser `WS` global imported.

**Transcription can't drift**: the manifest gate *proves* every `LOCKS` row equivalent to
the real `WS.unlocked` by driving ws.js's own predicate over a satisfied store, per-clause
broken stores, and the empty store — and `lockMet` must agree on all of them (§6.5a,
`lock-drift 0`). A ws.js edit that changes a lock fails the build **by id**.

**Three gate arms** (all inside `manifest.mjs --check`, hence inside
`forge --check --all`): (a) LOCK FIDELITY as above; (b) SECRET-PATH AUDIT — parses the
Undercroft's `SECRETS` table and asserts every `kind:'place'` secret's target exists, is
catalogued, and carries that niche's own lock (room targets: the room must be locked and
its `ROOM_LOCK` no stronger than the niche path — weakest-lock rule); a trophy carrying an
href, an unused LOCKS row, or an uncatalogued place all fail by name; (c) REACHABILITY —
link tokens (incl. JS-built, `../`-relative, and dir-style) scraped from all 456 shipped
pages; every catalogued entry must be referenced by another page outside its own unit.

**The audit table** (every place-secret in `undercroft/index.src.html` × `ws.js`):

| niche id | target page | was catalogued? | old lock → correct lock (WS.unlocked) |
|---|---|---|---|
| quickening | sound-garden/quickening.html | yes (gated) | `ws:seen:quickening` (visit-proxy) → **`game-of-life && lattice`** (re-gated) |
| the-long-quiet | undercroft/the-long-quiet.html | NO (denied) | → **`flag:patience`** (enrolled) |
| rosette | undercroft/rosette.html | NO (denied) | → **`game-of-life && lattice && patience && eleven && swarm≥8`** |
| codex | undercroft/codex.html | NO (denied) | → **`verse && scriptorium`** |
| floating-ink | undercroft/floating-ink.html | NO (denied) | → **`cartographer && scriptorium`** |
| almanac | undercroft/almanac.html | NO (denied) | → **`verse && orrery`** — NOTE: this is the *Undercroft's* almanac; the public WS4 Almanac (`hours/almanac.html`, front-door-linked) is a DIFFERENT page and stays PUBLIC under The Hours |
| enigma | undercroft/enigma.html | NO (denied) | → **`scriptorium && slipstick`** |
| night-shift | undercroft/the-night-shift.html | NO (denied) | → **`lamplighter-won && ferryman-won`** |
| light-mixer | undercroft/light-mixer.html | NO (denied) | → **all 9 `earned-*` feats** |
| m-keeper-of-tales | undercroft/keeper.html | NO (denied) | → **all 3 tale `*-won` flags** (the one mastery PLACE) |
| reliquary | the-reliquary/index.html (room) | yes (locked) | `ws:seen:reliquary` only → **any( distinctSeen≥8, reliquary-opening, reliquary, reliquary-solved )** — see below |
| the-mere | the-reliquary/the-mere.html | yes (gated) | `ws:seen:the-mere` = its WS.unlocked — already correct (kept, as a `lock`) |
| eleven · the-survivor · reckoner · m-clean-sweep · m-held-the-line · m-half-the-light · m-eleven-and-still · m-grandmaster | — | trophies | no pages → the awards cabinet world; NOT catalogued (gate asserts no trophy carries an href) |

**Room locks (both-or-neither for rooms).** `unlockedFor` now evaluates a slab-baked
descriptor. The **Undercroft** stays `any(undercroft-rune, undercroft)` — the ≥4-distinct
broken-stair tile is a *teaser, not a link*, so it correctly does NOT unlock the card. The
**Reliquary** was the real mismatch: the front door's tile is *walkable* at ≥8 distinct
`ws:seen` rooms (`revealReliquary`), yet the catalog demanded `ws:seen:reliquary` (entered
— a visit-proxy). Now `any({distinctSeen:8}, reliquary-opening, reliquary,
reliquary-solved)` — the weakest lock across every way in, including the Undercroft niche.

**Multi-path / weakest-lock cases found:** the reliquary room (above); the two almanacs
(distinct pages — no conflict, the public one stays public); no place-secret target is
publicly linked anywhere else (verified by the reachability scan + link greps), so no
secret needed the public-wins escape.

**Spoiler discipline:** slab entries carry name + href + lock only (no riddles/blurbs —
those stay in the Undercroft's own page); every locked entry is `hidden:true`, invisible
to search/index below its lock (proven per-clause in `core.test.mjs` (g2): revealed AT the
lock, phantom BELOW it, phantom under sealed/storage-off).

Pieces 416 → **425** (the 9 Undercroft places); floor raised to 425.

**Question left for Brandon:** the front door itself still reveals the Reliquary POI only
at ≥8-distinct (plus its own keys) and does not honor `reliquary-solved` — the CATALOG now
honors all four ways, but if you want door↔catalog parity to be exact both directions, the
door's `revealReliquary` could add the solved key too (I did not touch the front door).

## Gate readout at HEAD (all green, run first-hand)

```
node tools/manifest/manifest.mjs --check   → OK — 425 pieces · unclaimed-pages 0/456 · lock-drift 0 · secret-faults 0 · unreachable 0
node tools/manifest/manifest.test.mjs      → 51/51 PASS
node card-catalog/core.test.mjs            → THE VOLUME IS COMPLETE & TRUE (93 checks incl. (g2) lock model)
node tools/layout/estate.test.cjs          → 40 passed, 0 failed
node tools/forge/forge.mjs --check --all   → all 159 file(s) current + manifest gate OK
node tools/sky/derive-sky.mjs --check      → sky.js slab current   · sky.test 89/89
node tools/tour/tour-check.mjs             → 8/8 PASS
calendar suite (untouched)                 → 80/80 · 81/81 · 114/114
```
