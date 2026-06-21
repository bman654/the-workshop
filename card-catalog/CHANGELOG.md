# The Card Catalog — CHANGELOG

The estate's bound register: every room an illuminated ledger entry, the whole manor
and grounds gathered into one volume on a slanted oak reading stand. A new top-level
grounds-swing room (manor · tier 1 · archive wing), reached from the front-door map by
its own POI (a ledger-book footprint). The FORM enacts the content — navigation
physically turns pages. Four indexes are bound into the SAME set of cards; the catalog
re-pins itself from the front-door plan each cycle, so it never falls behind the estate.

## #232 — shipped (BUILD / grounds) — grounds-worker + publisher

The estate had ~158 rooms on a growing map and no single place that held them ALL.
The Card Catalog is the door to the whole collection: browse it FOUR ways and search it,
then turn a page to travel straight to any room.

**What shipped**

- A bound oxblood-leather ledger on a slanted reading stand (gilt fore-edge, cream
  laid-paper, a sewn red-silk ribbon). FOUR INDEXES over ONE card-set, as fore-edge
  thumb-tabs:
  1. **GAZETTEER** — by map location: a strict district › wing › room drill, page-curl
     deeper, a corner ↑ steps back up.
  2. **THEMATIC** — "eight shelves of one library": a TOTAL subject derivation keyed on
     district/wing/id, never a raw tag.
  3. **REGISTER OF ADMISSIONS** — by order of entry: the sparse `order` field with
     `order ?? Infinity` then an id tiebreak.
  4. **INDEX A–Z** — by name, with the library-filing rule (leading article dropped, so
     "The Card Catalog" files under C).
- **SEARCH** is a gilt manicule finger-tab; matching entries' illuminated initials
  kindle gold in place (case-insensitive substring over room | piece | blurb).
- Click a room → a single illuminated ENTRY card (full blurb + a "TURN TO THE <ROOM> →"
  travel button that fires `WS.seen` + navigates).
- The **RIBBON** is the breadcrumb made physical — it hangs at the current depth and
  snaps back to the last spread you read into.
- **LOCK-GATING:** the slab carries EVERY front-door PLACES entry INCLUDING the locked
  undercroft; `filterUnlocked` gates at RENDER time via the SAME predicate the front
  door's `revealUndercroft` uses, so a sealed store hides the way down (50 cards) and
  `ws:seen:undercroft-rune` reveals it (51, the "Beneath" district appears).
- **SELF-MAINTENANCE:** `reclaim.mjs` is auto-enrolled in the `collate.sh` per-room
  convention (zero collate edit) and re-pins the CATALOG-DATA slab from the front-door
  plan each cycle.

**Files**

- `core.mjs` (383 L) — the SOLE authority: 4 orderings + search + `buildTree` +
  `filterUnlocked` + the subject-map + `fileKey`/`fileInitial` + `runSelfTest`. Pure,
  DOM-free.
- `core.test.mjs` (288 L) — the Node twin.
- `reclaim.mjs` (265 L) — self-maintenance: a comment/string-aware balanced-brace parse
  of the front-door PLACES that projects 13 fields, re-pins the slab, and REFUSES on a
  sub-floor parse.
- `index.src.html` → forged `index.html` — render-only (the core is inlined byte-true).
- Front-door `index.src.html`: a new PLACES entry
  `{id:card-catalog, manor, tier1, archive, footprint:ledger-book, order:10}` + a
  `drawLedgerBook` tier-1 footprint drawer registered in the DRAW table.

**Proven**

- In-page colophon pill `✓ volume true · 13/13` (green under sealed AND unsealed-undercroft
  store states).
- `node card-catalog/core.test.mjs` → EXIT 0, "THE VOLUME IS COMPLETE & TRUE": slab
  id-set === front-door PLACES id-set (|51|, ∅ symmetric-diff); each of the 4 orderings a
  permutation (incl. the sparse-order tail fallback); every `../<href>` fs-resolves (incl.
  the study→verse + physics-lab→cavern id≠folder pairs); search sound + complete vs a
  brute-force reference over 17 queries + edge cases; the drill a strict tree (no id under
  two leaves, leaves reunion to the full volume); subject totality (Σ subject counts ===
  51); lock parity across sealed/unsealed/storage-off. NEGATIVE CONTROLS fire as required
  (a dup-id breaks the permutation + strict-tree; a bogus-href breaks resolvability; a
  sub-floor parse REFUSES).
- Map invariants: `smoke.cjs` exit 0 (the ledger-book POI drew 32 SVG elements + 📖, no
  footprint collision), sky 73/73, `forge --check --all` clean, `--audit-seen` ✓ (the
  catalog drops `ws:seen:card-catalog`).

**Publisher fresh-eyes — caught + fixed a real navigation-trap bug**

The catalog's CORE interaction — switching among the four indexes via the fore-edge
thumb-tabs — was broken after the first switch. The first tab click (from the short 5-row
gazetteer) worked, but once any TALL 50-row index was shown, every subsequent REAL pointer
click on a thumb-tab was swallowed and the active index never changed — a trap with no way
out but a reload.

- **Root cause.** `.book` carried `transform:rotateX(7deg); transform-origin:bottom;
  transform-style:preserve-3d`. The four thumb-tabs, the ribbon, and the search field are
  `position:absolute` and hang OFF the book's right edge — i.e. they live inside the
  3D-rotated `.book` subtree. The rotateX projects them off their layout box, and the
  displacement grows with distance from the bottom transform-origin; on a tall index spread
  (the book grows to ~2200 px) the tabs sit at `top:18px` — maximum drift — so their hit
  geometry lands under the grown `.stand`, which wins `elementFromPoint` and eats the click.
  Diagnosed with `elementFromPoint` probes: on a tall spread all 5 tabs reported
  `reachable:false / topEl:MAIN.stand`.
- **Fix.** Removed the book's own 3D tilt — `.book` is now `transform-style:flat` with no
  `rotateX` (one CSS rule, with a NOTE comment so the trap isn't reintroduced). The
  "slanted reading stand" read is carried entirely by `.desk::before` (its `rotateX(46deg)`
  trapezoid — untouched), and the page-curl gets its perspective from `.stand`
  (`perspective:2400px`), NOT from the book — both verified unaffected. Re-forged
  `index.html` from source. After the fix, all four index switches via REAL pointer clicks
  land across tall→tall→tall→short transitions, and all 5 tabs report `reachable:true` on a
  tall spread.

Everything else verified live with no other bug: the gazetteer drill + back-up arrow, all
4 indexes, the manicule search (initials kindle gold), the ribbon snap-back, lock-gating
(50 ↔ 51 + the Beneath district), reduced-motion (the curl stays hidden), a live travel
(Study → `/verse/index.html`, both `ws:seen` breadcrumbs dropped), and the front-door POI
(the 34-element ledger-book footprint, 1 link-ref, click travels 200).

**Note for the next maker:** KEEP `.book` FLAT — a `rotateX` there re-traps the fore-edge
thumb-tabs on tall spreads. To add a self-maintaining room, ship a `<room>/reclaim.mjs`
and `collate.sh` auto-discovers it (no collate edit).
