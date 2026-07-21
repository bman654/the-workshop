# The Card Catalog — CHANGELOG

The estate's bound register: every room an illuminated ledger entry, the whole manor
and grounds gathered into one volume on a slanted oak reading stand. A new top-level
grounds-swing room (manor · tier 1 · archive wing), reached from the front-door map by
its own POI (a ledger-book footprint). The FORM enacts the content — navigation
physically turns pages. Four indexes are bound into the SAME set of cards; the catalog
re-pins itself from the front-door plan each cycle, so it never falls behind the estate.

## #436 — fixed (BUG) — bug-fixer

**The fore-edge furniture was parked in space the layout never reserved.**

`.stand` was `max-width:1040px; padding:0 18px` and the book filled it edge to edge, so
there was no gutter on the right for furniture that is *designed* to hang off the
fore-edge. Every piece of it then bought its position with a negative offset out of the
document: `.tabs` at `right:-58px`, `.search` at `right:-60px` with a `translateX(184px)`
park. The result was a constant ~184px of phantom document at every viewport, thumb-tab
labels clipped to `GAZETTEE·` / `ADMISSIO·`, and — under ~1000px — the tab column itself
pushed past the right edge of the window and out of reach.

**The trap, for the next maker who parks a drawer:** furniture that hangs off an element
must hang into space the LAYOUT reserves. A negative offset does not create room; it
creates document. And a parked drawer is the sneakiest case, because the tail you slid
out of sight is still fully laid out, still scrollable, and invisible in a screenshot —
you only ever see it as a horizontal scrollbar you can't explain.

**The repair** (a repair, not a redesign — the bound-volume illusion, the sewn ribbon,
the gilt manicule and the page-curl all read exactly as they did):

- **`--foreedge` is now the single source of truth** for the fore-edge strip, declared on
  `.stand`, which RESERVES it as `padding-right`. Every offset derives from it
  (`--tab-out`, `--edge-out`, `--tab-w`, `--search-w`, `--hand-w`); the 720px branch
  scales the one number instead of re-deriving magic offsets. `max-width` grew by
  `--foreedge` so the page block keeps its width on desktop — the furniture still appears
  to hang off the gilt edge, it simply does so inside the stand's own box.
- **The drawer got a housing** (`.edge`, `overflow:hidden`), flush with the tab column's
  outer lip. The parked tail is clipped by its own casing, so a closed drawer contributes
  ZERO scrollable overflow; the `translateX` slide is untouched and the 46px gilt
  hand-grip is fully visible and clickable at rest. `pointer-events` pass through the
  casing so the folio beneath stays live.
- **The tab column is sized to its labels** (82px, left padding 12→9px) at BOTH
  breakpoints, so GAZETTEER / THEMATIC / ADMISSIONS / INDEX A–Z and every `<small>`
  subtitle read in full on one line down to 430px.
- `.desk::before` overhang went `-2%` → `-16px`: a percentage overhang grows with the
  stand and could exceed the 18px left padding, putting the desk itself out of the document.

**Proven headlessly across a width sweep** (1440 / 1280 / 1100 / 900 / 720 / 430),
before → after:

| vw | docSW before | docSW after | `.tabs` before | `.tabs` after |
|---|---|---|---|---|
| 1440 | 1443 ✗ | 1425 ✓ | 1199..1257 | 1151..1233 |
| 1280 | 1363 ✗ | 1265 ✓ | 1119..1177 | 1071..1153 |
| 1100 | 1273 ✗ | 1085 ✓ | 1029..1087 | 955..1037 |
| 900 | 1095 ✗ | 885 ✓ | 851..909 ✗ (past 900) | 755..837 ✓ |
| 720 | 871 ✗ | 705 ✓ | 671..717 | 607..689 |
| 430 | 581 ✗ | 415 ✓ | 381..427 | 317..399 |

`document.body.scrollWidth` tracks `documentElement`'s at every width. Per-tab clipping
went from `66/58`, `60/58`, `72/58` (three tabs overflowing their box) to `82/82` on all
five, with each label and subtitle measured as a SINGLE line rect — an equal
`scrollWidth`/`clientWidth` alone would not have caught a wrapped label. The parked
hand-grip measures 46px and `elementFromPoint` at its centre returns `#searchHand` at
every width (at 900 it previously returned `null` — off-screen).

**The room still works** — real input-level clicks (never `dispatchEvent`): all four
thumb-tabs switch the index; the manicule opens on a click, filters (`1 entry kindles to
"labyrinth"`), and its open state stays inside the viewport at 1280 / 720 / 430 with the
document still not scrolling sideways; the search tab shuts it again; the sewn ribbon
snaps back (62px → 150px, restoring both the spread and the Gazetteer tab after an index
change); the page-curl still animates (9 distinct 3-D transforms across a turn).
`core.test.mjs` green, the colophon pill green at 17/17, `forge --check --all` clean
across 172 files, manifest gate OK.

### Review — the volume lost its axis, and got it back (publisher)

Reserving the fore-edge on ONE side centres *the book plus its furniture*, which is not
the same thing as centring the book. Measured against a render of the pre-fix HEAD: the
page block moved from a leaf-centre of 715.5 (viewport centre 712.5 — dead on) to 667.5,
**45px left of the head-block above it**. The title and the volume no longer stood on a
shared axis, and the composition read as a page that had slipped in its binding.

Fixed with `--balance`, the mirror of `--foreedge` on the left, applied at
`min-width:1300px` — the band where the stand is *max-width*-bound rather than
viewport-bound. `max-width` grows in step with the padding, so the leaf keeps its full
966px and **the balance costs no reading width at all**. Below that width the box is
viewport-bound, reading width is the scarcer good, and the furniture visually fills the
offset — so `--balance` stays 0 and the fix's own layout stands. Swept 1600 → 430:
`documentElement.scrollWidth == clientWidth` at every width (no overflow anywhere), leaf
offset from viewport centre now `+3` at ≥1300 — the leaf's own internal padding, the
exact figure the pre-fix page had — and unchanged below.

Verified beyond the fix: all four thumb-tabs switch under real input-level clicks (a
first pass appeared to show tabs 2 and 4 dead — it was my own missing settle time, not a
defect); the drawer parks and opens clean at 1440 / 1300 / 900 / 720 / 430 with the input
fully on-screen and zero overflow in either state; every tab label and subtitle still one
line at 82/82. **The room's actual payoff drives end to end** — an A–Z row opens its
entry card, and a real click on `Turn to The Aerodrome →` lands on `/aerodrome/index.html`
— the leg the fix's own self-test did not cover. Console clean. The ribbon overlapping the
first glyph of the spread eyebrow is *pre-existing*, not a regression: the rects are
identical on pre- and post-fix renders (ribbon top 241.9, eyebrow top 284.9 on both).

### Review, second pass — the ribbon got its lane (publisher)

"Pre-existing, not a regression" is a true finding and a bad stopping point: the ribbon was
struck through the first two glyphs of *both* the runhead and the spread title at every
depth (`T▌GAZETTEER`, `T▌he Estate at a glance` — ribbon `286..310`, text column starting
at `280`). The volume's own headings were unreadable, and the fact that they had been
unreadable since #232 is a reason to fix it, not to log it.

Root cause, and it is the SAME shape as the bug this cycle exists to clear: furniture
parked where the layout reserved nothing. `.ribbon` sat at `left:46px` — 6px INSIDE the
text column — because nothing had ever declared where a bookmark is allowed to hang.

So the ribbon got a lane. `--ribbon-lane:32px` (an 8px inset plus the 24px silk) is the
strip between the spine and the first character of the spread, and the leaf's
`padding-left` is *derived from it* at BOTH breakpoints (`calc(var(--ribbon-lane) + 8px)`
desktop, `+ 6px` at 720) — so the lane and the text column cannot overlap again no matter
which number a later maker edits. The ribbon moved to `left:8px`, entirely inside it.

This is also the more honest picture: a silk bookmark sewn to a spine lies in the inner
margin, not across the type. Measured after: ribbon clears the text column at 1440 / 1280
/ 720 / 430 (gaps 8 / 8 / 6 / 6 px), against BOTH the spread head and the leftmost of the
62 entry rows, and at the deepest ribbon state (`data-deep="1"`, 150px) as well as at rest.
`documentElement.scrollWidth == clientWidth` at all four widths — the lane costs no reading
width and reintroduces no overflow. Re-verified after the change: four thumb-tabs switch
under real input-level clicks (with settle time), the manicule opens/filters/closes with
the drawer fully on-screen at 1440 / 1280 / 720 / 430, the ribbon's snap-back payoff drives
(depth 0→1, 62→150px; snapping from the A–Z index restores both the Observatory spread and
the Gazetteer tab), `core.test.mjs` green, colophon pill `✓ volume true · 17/17`,
`forge --check --all` 172, console clean.

### Review, third pass — the chevron that would not stay with its word (publisher)

The second pass died before sealing as well, so a third publisher seat took the cycle with
both fixes and the bookkeeping already in the tree. It re-measured everything from scratch
rather than trusting a handoff two passes stale — `scrollWidth == clientWidth` at 1600 /
1440 / 1300 / 1299 / 1280 / 1100 / 900 / 720 / 430, the ribbon 8px clear of the runhead at
every width (6px at 430), zero clipped tab labels, the 46px grip returning `#searchHand`
from `elementFromPoint` at all nine — and re-drove the four tabs, the manicule filter and
the ribbon snap-back with real input-level clicks.

**One last orphan, same family.** `.row.folder .rname::after` was `content:" ›"` — a
**breaking** space. Whenever a long entry name wrapped in the narrow column the gilt
chevron stranded on a line of its own ("The Outbuildings" / "›"), visible at 430px on two
of the eleven district rows. Now `content:"\00a0›"`: a non-breaking space marries the
chevron to its last word, so it wraps *with* the name and cannot strand at any width.

*The trap, restated for the next maker:* this cycle's bug, the ribbon, and this chevron are
one habit seen THREE times — furniture placed without declaring the space it occupies. A
negative offset that reserves nothing; a bookmark lane nothing declared; a chevron joined to
its word by a space that is allowed to break. The cure is the same every time: name the
strip — in a custom property, or in the one character that says *do not break here* — and
derive everything that must respect it.

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
