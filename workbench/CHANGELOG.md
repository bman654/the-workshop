# The Workbench — CHANGELOG

The Workbench (`workbench/index.html`) is the calm index room that groups the workshop's
standalone tools, toys & tales (Tales · Puzzles · Games of perfect information · Computation ·
Toys & benches · Instruments). Reached from the front-door footer (`the workbench`) and via a
direct-visit breadcrumb (`ws:seen:workbench`).

## 2026-06-14 — Bug fix: nested-anchor invalidity → stretched-link cards

**Symptom (reported 2026-06-13, with a screenshot).** Five cards whose blurbs contain inner
cross-links — **Theseus's Thread · The Coastline Rule · The Coastline Paradox · The Road Into
Chaos · The Best Rational** — rendered broken: the card box closed early and the rest of the
blurb plus the "Open ▸" affordance **spilled out into the gaps between cards**.

**Root cause.** Each card was wrapped in `<a class="card" href="…">…</a>`, but five of those
blurbs put their own `<a>` cross-links *inside* the card anchor. **Nested `<a>` is invalid
HTML** (the content model of `<a>` forbids descendant `<a>`). The browser's parser enforces this
by **auto-closing the outer card anchor** the moment it meets an inner `<a>`, then re-opening
stray fragment anchors for the remainder — so a single intended card fragmented into several
sibling anchors at the parse stage. (Measured on the broken file: the 34 intended cards parsed as
**39** `a.card` elements.) The fragments laid out as loose inline content, which is the "spilled
text in the gutters" the screenshot showed.

**Fix — the standard "stretched-link" pattern.** Every card is now a single **valid** element:

- `<a class="card" href="X">…</a>` → `<div class="card">` containing **one overlay anchor**
  `<a class="card-link" href="X" aria-label="<bench name>"></a>` as its first child.
- CSS: `.card{position:relative}` (containing block), `.card-link{position:absolute;inset:0;
  z-index:1}` (the whole-card click target). The `a.card` / `a.card:hover` selectors were
  retargeted to `.card` / `.card:hover` so the hover lift still fires on the `<div>`.
- Inner blurb cross-links get `.blurb a{position:relative;z-index:2}` so they sit **above** the
  overlay and stay independently clickable; the "Open ▸" affordance stays in the blurb as plain
  text (the overlay handles its click).
- Applied **uniformly to all 34 cards** (not just the 5 affected) so the next inner-link card
  can't re-introduce the bug. Every `href` is byte-identical before/after (34 card hrefs + the
  back-link + 8 inner cross-links = 43 anchors, unchanged); the `← workshop` back-link, the Hall
  paragraph link, and the `ws:seen:workbench` breadcrumb were untouched.

**Verification (served origin + agent-browser, `?v=N` cache-bust).**
- **Validity:** the live DOM reports **0** `a a` (no anchor inside an anchor) and exactly **34**
  `.card` divs + **34** `a.card-link` overlays (the broken file parsed as 39 `a.card`). Static
  href diff before/after: identical, 34/34 and 43/43.
- **Containment:** for all 5 named cards, the `.blurb` and `.open` rects lie inside the card rect
  (no spill) — `blurbInside:true, openInside:true` each.
- **Card-body click** (plain blurb prose over Theseus's Thread) hit-tests to
  `a.card-link[../labyrinth/index.html]` and a real click navigated to `labyrinth/index.html`.
- **Inner cross-link click** ("Pathfinder" inside Theseus's Thread) hit-tests to
  `a[../pathfinder/index.html]` and a real click navigated to `pathfinder/index.html` — its own
  target, not the card's.
- **Hover** still applies to the `.card` div: `matches(':hover')` true, computed
  `transform: matrix(1,0,0,1,0,-2)` (the `translateY(-2px)` lift).
- **0 console errors**; before/after screenshots of the Toys & benches group captured as evidence.
