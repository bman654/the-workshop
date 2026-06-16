# The Tabularium — CHANGELOG

*The estate's own annal: the one room that remembers the makers, not the work.
Reached from the front door via the manor's `archive` wing (THE ARCHIVE).*

## #61 (2026-06-16) — opened: the orrery-tome of the makers

The estate's **fourth grounds big swing** and a **new front-door MANOR WING** (the ARCHIVE).
A self-contained, zero-dependency room that tells the estate's legend through the winning
prototype-C form: a brass **orrery-dial of years** coupled to a **chained tome**, the manor
**raising itself wing-by-wing**, and a **cairn rising one pebble per mark** as you wind.

### The act
- **Wind the dial** (drag · scrub · ◂▸ leaf one cycle · ▶ wind): each leaf = one cycle that
  left a mark in the ledger. The leaf-head names a hand-authored **chapter** (the `MYTH` array
  — 5 vivid chapters: *the three founding words · the makers who live one turn · the Hand That
  Guides / the gauge · the estate measuring itself · the living question*).
- The tome body surfaces **that cycle's REAL koans** as illuminated marginalia: a gilt
  drop-initial of each maker's chosen **name**, role+seq in scribe-mono, the koan in italic
  serif on dark vellum. The **founder** (seq-1, Cairn) reads in rust.
- **THE ESTATE, AT THIS YEAR** raises the manor as you wind: each wing lights at its **real
  first-appearance cycle** (`bornCycle` = git commit-depth of the room's add-commit — the same
  convention the ledger uses). Wings predating the recorded era (cycle < 306) read "already
  standing"; wings that rose during the record light at their birth-cycle (the Engine Room at
  307); the Tabularium itself (`bornCycle` 404, not yet shipped) shows as the rust **live edge**
  (chip class `wingchip live`).
- **THE CAIRN, RISING** stacks one pebble per ledger mark — at the live edge, 257 stones.

### The three sources of truth
- **`core.mjs`** (321L) — the PURE data-fidelity logic, the single source of truth: `parse`,
  `canonical` (seq␟cycle␟role␟name␟koan), `buildLeaves`, `partitionByChapter`,
  `recomputeAggregates`, `roundTripOne`, `selfTest`, `tamper`, `verdict`, `CLAIM`, plus the
  `WINGS` estate-raising table + `estateAt` + `validateWings`.
- **`core.test.mjs`** (60L) — the Node twin; imports `core.mjs`, asserts GREEN against the real
  `ledger/ledger.jsonl`.
- **`index.html`** (1225L) — inlines `core.mjs` between `// === CORE BEGIN/END ===` sentinels
  (functional body byte-identical — only the doc-banner & `export` keyword stripped, the
  legitimate forge transform; the in-page pill computes the identical battery from the same
  bytes) and inlines `ledger/ledger.jsonl` verbatim via a `</script`-escaped JSON carrier read
  once as raw text.

### The proof (the legend is READ, not invented)
The self-test asserts `render(legend)` is a **pure function of the committed ledger snapshot**:
every displayed mark **round-trips byte-true** to its source line (seq · cycle · role · name ·
koan), nothing fabricated, nothing dropped, chronological order preserved, the chapters
**partition** the whole, the render maps **one-to-one** onto the record, every aggregate
recomputed from the data equals the data, and the **MYTH prose ∉ ledger** (the chapter text is
the room's own myth, never sourced from a koan).

- Node twin `core.test.mjs` → **10/10 GREEN, exit 0** + CLAIM-matches-recompute (264/239/68/
  306→404) + the **tampered-carrier negative control** (FAILS, caught at 3/10).
- In-page pill **11/11 ✓** on the real 264-mark ledger (the same 10 core legs from the
  byte-identical inlined core + 1 page-level leg proving MYTH prose ∉ ledger / koans verbatim).
- The visible **"⚠ Forge a mark" negative control** flips the pill to **"TAMPERED 4/11 ✗"**
  (red, 7 failed cards) on screen, then restores to green after the beat.

Aggregates at the **committed** live edge: **264 marks · 239 hands · 68 cycles ·
306→404**. (The room was BUILT against a 257-mark snapshot; the publisher's `collate.sh`
then folded this cycle's 7 inbox marks into `ledger/ledger.jsonl`, so before committing the
`CLAIM` pin in `core.mjs` was advanced to the true committed aggregates and the full ledger
carrier was re-inlined into `index.html` — see the re-pin note below.)

> **Re-pin discipline (a publisher landmine):** `core.mjs` hard-pins `CLAIM` to the ledger's
> aggregates and the Node twin asserts `recompute(live ledger) === CLAIM`. The publisher MUST
> `collate` the cycle's inbox marks before committing, which **moves those very numbers** — so
> the room must be **re-pinned + re-inlined after collation** or the twin goes red. At #61 the
> ledger grew 257→264 and the max cycle 403→404; `CLAIM` was advanced to
> `{marks:264, makers:239, cycles:68, minCyc:306, maxCyc:404}` and the 264-mark carrier
> re-inlined (CORE body kept byte-identical; carrier === live file). A lovely consequence: the
> Tabularium's own `bornCycle 404` equals this commit's git depth, so at the max cycle the room
> correctly shows **itself just-raised** (`wingchip standing raised`, gold) — it ships in the
> same commit whose marks it displays.

### Estate registration
- New `archive` manor **wing** in `tools/layout/layout.js` (label `THE ARCHIVE`, accent
  `#c9a44e`).
- One PLACES entry `tabularium` (📜, accent `#c9a44e`, district `manor`, tier 2, wing `archive`,
  footprint `house-wing`) in `index.src.html`; `index.html` re-forged 0-collision.
- A sky field-star `tabularium` (1180,150, mag 1) in `tools/sky/sky.js` (additive; clear of every
  footprint/furniture/manor-pool/other-star; never feeds the wings-only capstone).
- Breadcrumb `ws:seen:tabularium` dropped on the page (outside the core sentinels, so the core
  stays byte-identical).

### Gate
forge `--check` (30 current) · forge `--audit-seen` (20 pass) · layout `smoke.cjs` PASS · sky
73/73 · Node twin 10/10 · in-page pill 11/11.

### Publisher fresh-eyes (cycle #61)
Session `tab-review-61`, served `127.0.0.1:8823`, torn down by exact PID 57344 (Brandon's
:3001/:4380 untouched). **Shipped clean — no real bug, no `[bug]` filed, no `⚡` spark.**
Verified (across two serve passes — `127.0.0.1:8823` then `:8824` after the re-pin, both torn
down by exact PID): pill 11/11 ✓ · 0 console errors · 0 horizontal overflow @1280 & @390 · the
hero act reads (wind dial → real maker-koan rises as marginalia, founder Cairn in rust; winding
lights wings one-by-one) · at the build-time snapshot the cyc-403 live edge showed the Tabularium
chip `wingchip live` in rust (257 stones); **after collation the committed live edge is cyc 404,
264 stones, and the Tabularium chip reads `wingchip standing raised` in gold — the room ships in
the same commit (git depth 404) whose marks it now displays, so it correctly shows itself
just-raised** · mobile @390 collapses to one legible column with a large orrery dial · front-door
POI = exactly 1 anchor → `tabularium/index.html`, **THE ARCHIVE** wing label present, 0 nested
anchors, 0 overflow · both back-links → `../index.html` resolve · the negative control bites and
restores (also proven at the logic level by the twin's tampered-carrier leg on the new ledger) ·
**independently re-verified** the inlined core's functional body is byte-identical to `core.mjs`
(13943 chars both sides; only the doc-banner & `export` differ — the legitimate forge transform)
and the inlined ledger carrier is char-for-char identical to the live 264-mark file.

### Growth (don't rebuild the orrery-tome)
The wing's seed (`[room] Tabularium`, sown #54) bloomed here. Its remaining ambitions are the
wing's growth, each a fresh `[room]`/`[bench]` seed: an **Adventure-Game "true purpose" quest**,
a **depiction of The Hand That Guides**, a **dusty-bookshelves browse**, the **Cairn's full
founding tale**. The metagame "Workshop Mystery" seed was re-scoped this build to defer
manor-history to the Tabularium's domain.
