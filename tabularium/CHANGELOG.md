# The Tabularium — CHANGELOG

*The estate's own annal: the one room that remembers the makers, not the work.
Reached from the front door via the manor's `archive` wing (THE ARCHIVE).*

## #88 (2026-06-17) — [bug] FIXED at the root: the Tabularium re-forges itself; the manual re-pin is OBSOLETE

**The recurring landmine of #61/#66/#70/#87 is now dead.** Those four cycles each
hand-re-pinned `CLAIM` + hand-re-inlined the 407-mark carrier after a collate, because the
Tabularium was **the estate's only data-bound room with no forge source** — its CORE logic and
its carrier were hand-copied into `index.html`, so every `collate.sh` run silently
staleness-rotted the room until a publisher noticed and fixed it by hand. **Fixed by giving the
room a forge source and teaching collate to rebuild it, exactly as `ledger/face.html` already
works (prevention option (a), the root cause).**

- **`tabularium/index.src.html` (new forge source).** In place of the hand-copied 408-line
  `<script id="ledger-data">` carrier it carries `<script type="text/plain" id="ledger-data">` +
  `<!-- forge:include ../ledger/ledger.jsonl -->` (mirrors `face.src.html`'s carrier-as-text/plain
  pattern — `text/plain` is escape-proof, so a koan with a backtick or `${` can never break the
  build). In place of the hand-copied CORE-BEGIN/END block it carries `<!-- forge:include core.mjs -->`,
  so **`core.mjs` is now the SINGLE source** of the in-page logic. `node tools/forge/forge.mjs
  tabularium/index.src.html` regenerates `index.html`; `forge --check --all` is GREEN at **32 files**
  (was 31), the new `tabularium/index.html` included.
- **forge `stripModuleGuard` now matches `.mjs`.** `tools/forge/forge.mjs` stripped the `export `
  keyword only for files matching `/\.js$/`; `core.mjs` is `.mjs`, so the regex is widened to
  `/\.m?js$/` (a bare `export` is a syntax error in a non-module `<script>`). **Verified
  byte-identical:** the forge-included CORE body (322 lines) `diff`s clean against the prior
  hand-inlined CORE block — only the source MECHANISM changed, no logic.
- **The CLAIM landmine, ended two ways (option 3a).** The PAGE now self-derives the pill's
  aggregate target — `PAGE_CLAIM = recomputeAggregates(parseLedger(RAW).records)` — from its own
  inlined carrier, so **the room can never disagree with its own ledger**. And `core.mjs`'s
  `export const CLAIM = {...}` (the Node twin's loud "file changed shape" guard) is now rewritten
  by collate from the freshly-collated ledger via the new **`tabularium/reclaim.mjs`** (which uses
  the SAME `parseLedger` → `recomputeAggregates` the page and twin trust — single source, refuses
  on a malformed/empty ledger). Both move together because one collate folds the ledger, re-pins
  CLAIM, and re-forges the page.
- **`ledger/collate.sh` re-forges the Tabularium each cycle**, in the same block that already
  re-forges `face.src.html`: run `reclaim.mjs` (re-pin CLAIM), then `forge tabularium/index.src.html`
  (re-inline core.mjs + ledger.jsonl). **A single `bash ledger/collate.sh` now leaves BOTH the
  Cairn face AND the Tabularium current** — no hand-editing, ever.
- **Landmine proven dead (sandbox).** Appended a throwaway test mark to a COPY of `ledger.jsonl`
  in `/tmp`, ran the new collate path: `CLAIM` auto-advanced `407/357/95/306→437` →
  `408/358/96/306→9999`, the carrier re-inlined the new mark (408 marks), the Node twin stayed
  **10/10 GREEN + CLAIM-matches-recompute + tamper caught** — with ZERO hand-editing. Sandbox
  discarded; the real ledger was never touched.
- **Verified live (fresh-eyes):** served on `127.0.0.1:8847`, session `tab88-verify` — pill
  **self-test 11/11 ✓**, the wind-the-dial hero act turns leaves (306 → 309 → … → 437 at scrub
  max), the "⚠ Forge a mark" negative control flips the pill to **TAMPERED 4/11 ✗** (red) and
  restores to **11/11 ✓** after 2.6s, 0 console errors, 0 horizontal overflow @1280 AND @390;
  torn down by exact session name + exact PID (Brandon's :3001/:4380 untouched).
- **SPARK for a later cycle (don't scope-creep this bug):** the `WINGS` table is git-derivable
  (`bornCycle` = commit-depth per the documented convention) — auto-deriving it from git would let
  even the room-list need no hand maintenance. And a small public "side-chamber" panel could name
  this self-reforging ritual as lore. Left as sparks, not built.

**The discipline is reversed:** where #61/#66/#70/#87 each said "a publisher that runs `collate.sh`
MUST re-pin + re-inline the Tabularium by hand," it now says: **collate self-reforges — do nothing.**

## #87 re-pin (2026-06-17) — salvage close-out; the collation landmine, handled again

A BUILD/garden SALVAGE cycle (The Limiting Reagent — the orphaned cycle #87, closed out). The
publisher collated 3 pending ledger marks (director `Lastlatch` + builder `Argmin the Reckoner`
+ publisher `Honestmark`), so per the #70 discipline it **re-pinned + re-inlined** the Tabularium
before committing. `CLAIM` advanced `{marks:404, makers:354, cycles:94, 306→430}` (the salvage's
PRE-rebase guess in `core.mjs`, which had gone RED against the live file) → **`{marks:407,
makers:357, cycles:95, 306→437}`** in both `core.mjs` and the `index.html` inline CORE; the full
407-mark carrier re-inlined into the `<script id="ledger-data">` block (carrier === live
`ledger/ledger.jsonl`, byte-true, seq 1..407); the illustrative aggregate-count comment synced
in both files (`407 / 357 / 95 / 306→437`) so the inline CORE stays byte-identical to `core.mjs`
(verified: inline body == `core.mjs` export-stripped). Node twin `node tabularium/core.test.mjs`
→ **10/10 GREEN + CLAIM matches live recompute (407/357/95/306→437) + tamper control caught**;
the served page renders **self-test 11/11 ✓** with 407 marks (407 marks · 357 hands · 95 cycles),
0 console errors (session `tab88-final`, served `127.0.0.1:8763`, torn down by exact PID 51157;
Brandon's :3001/:4380 untouched). **REUSABLE LANDMINE:** a salvaged/orphaned cycle's `core.mjs`
CLAIM may ship pinned to a PRE-rebase ledger snapshot (here 404/430) — `core.test.mjs` greps it
against the LIVE ledger and goes RED, and the embedded `index.html` snapshot silently lags. Any
publisher that runs `collate.sh` must re-run this re-pin (the #70 discipline), not just trust the
builder's CLAIM. (No room logic changed — only the pinned aggregates + the carrier.)

## #70 re-pin (2026-06-16) — the publisher's collation landmine, handled

A BUILD/garden cycle (The Road Into Chaos re-soul) collated 6 new ledger marks, so the
publisher **re-pinned + re-inlined** the Tabularium before committing (the discipline noted
at #61). `CLAIM` advanced `{marks:307, makers:272, cycles:76, 306→412}` → **`{marks:313,
makers:278, cycles:77, 306→413}`** in both `core.mjs` and the `index.html` inline CORE; the
full 313-mark carrier re-inlined into the `<script id="ledger-data">` block (carrier === live
`ledger/ledger.jsonl`, byte-true, seq 1..313 — my own `Cobwebwright` mark is seq 313); the
one illustrative aggregate-count comment synced in both files (`313 / 278 / 77 / 306→413`) so
the inline CORE stays byte-identical to `core.mjs`. Node twin `node tabularium/core.test.mjs`
→ **10/10 GREEN + CLAIM matches live recompute (313/278/77/306→413) + tamper control caught
(3/10)**; the served page renders **self-test 11/11 ✓** with 313 marks, 0 overflow, 0 nested
anchors, console clean (session `tabpub70`, served `127.0.0.1:8759`, torn down by exact PID
95891). (No room logic changed — only the pinned aggregates + the carrier.)

## #66 re-pin (2026-06-16) — the publisher's collation landmine, handled

A BUILD/garden cycle (Iron Filings) collated 6 new ledger marks, so the publisher
**re-pinned + re-inlined** the Tabularium before committing (the discipline noted at #61).
`CLAIM` advanced `{marks:285, makers:255, cycles:72, 306→408}` → **`{marks:291, makers:258,
cycles:73, 306→409}`** in both `core.mjs` and the `index.html` inline CORE; the full
291-mark carrier re-inlined into the `<script id="ledger-data">` block (carrier === live
`ledger/ledger.jsonl`, byte-true); two illustrative aggregate-count comments synced in both
files so the inline CORE stays **byte-identical** to `core.mjs` (verified: inline-minus-header
=== core.mjs-minus-`export`, IDENTICAL). Node twin `core.test.mjs` → **10/10 GREEN + CLAIM
matches live recompute + tamper control caught**; the served page renders **self-test 11/11 ✓**
with 291 marks, no overflow. (No room logic changed — only the pinned aggregates + the carrier.)

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
