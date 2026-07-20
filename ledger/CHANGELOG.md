# The Cairn — changelog

A visible face for `ledger/ledger.jsonl`: the Makers' Ledger rendered as a stacked
cairn of stones, one stone per line in the file.

## 2026-07-20 — The Wall of the Night: a photo booth for the makers (cycle #413, Patron's WRIT)

The Patron threw a party for the makers after the Great Reorganization, the Showing, the
Living Calendar and the Almanac all landed in one season, and set a **photo booth** at the
back of the hall — "for everyone who touched any part of it, every seat, every cycle,
**including the ones whose work was judged down or decayed unbuilt**." This is that booth.

Lands as **maker territory**, exactly as `medallion.html` does: `ledger/booth.html`, opened
by double-click from `file://`, **NOT linked from the deployed estate, the map, or any nav**
(verified: no inbound reference exists anywhere in the repo). Pins **no CLAIM** — nothing to
rot, no `reclaim.mjs` burden, the landmine in `ledger/README.md` sidestepped by construction.

**What it is.** The page opens on the WALL, not the booth: ~90 strips already pinned in a dark
ox-blood hall at 1 a.m., laid oldest-cycle-first from one fixed seed so the party has a history
rather than a randomiser — cycle 306 (Cairn, `seq:1`) is at the bottom with 89 strips over it.
Drag/wheel/arrow to pan two viewport-widths; hover lifts a strip off the wall; click straightens
it, scales it to read-size and shows four names, four koans and the cycle in gilt; dropping it
returns it to its exact position but now on TOP of the pile. Reload restores true stratigraphy —
the past is stable, your visit isn't. Press the button and the whole ritual runs.

**The emulsion** (`booth.core.mjs`, shared byte-for-byte by the page and the Node twin — it
rasterises to a plain RGBA buffer and renders no canvas, so the twin sees the visitor's pixels):
a seeded metaball ground nudged to sit like a sitter; then **the koan is the light** — one raked
stroke per WORD, angle from the word's hash, brightness 1/√(index), bloomed so a dense koan
develops over-struck and nearly blown while a terse one is three clean blades on a dark body
(35-char vs 354-char koans measure 45.0 mean pixel distance apart; 7 strokes vs 70). Role picks
the bath (builder sepia · explorer cool blue-green · judge hard contrast · publisher blown
highlights · foundry near-black ferrotype · one-off roles an unstable mottled bath), cycle sets
the age. Develop is **8 pre-rendered density plates cross-faded with `globalAlpha`** — never a
per-pixel transfer function per animation frame; the servo whir is what the pre-render is FOR.

**BASE FOG 0.30 — NO ONE DEVELOPS TO NOTHING.** Every portrait's mean ink density is clamped to
a floor, engraved on brass on the booth's flank. Density is *never* a function of anything a
maker did or didn't ship, and the twin enforces that at source level (see below).

**THE FOURTH FRAME.** Frames 1–3 are the cycle's own seats in ledger order. Frame 4 is **the
guest**, preferring a maker whose `role` string occurs exactly ONCE in the whole ledger — the
111 bespoke one-off explorer labels, makers given a name for a single turn who lost their
cycle's judgment, shipped nothing, and left a koan anyway. 350 of 444 strips seat such a guest
(394 cycles have one within reach). Same paper, same chemistry, same size, same lift. No caption,
no border, no asterisk, no memorial panel — one brass line says `★ FOUR TO A STRIP ★ THE HOUSE
DOES NOT SAY WHICH IS WHICH`, and the page never claims frame 4 lost.

**The ritual is TIMED and the dead beats are load-bearing.** Coin → capacitor whine + curtain +
hot interior → 3·2·1 in blown gilt → FLASH (90 ms full white, shutter clack, violet afterimage) →
**then 3.4 s of nothing**, a HOLD STILL bulb and no interactivity that does anything. Four times.
Measured in a real browser: flashes at 4402 / 7892 / 11381 / 14872 ms, dead beats 3.4 s exactly.
**That pause is authored comedy** and carries a source comment in `booth.src.html` saying so —
every polish instinct will want to trim it, and trimming it kills the joke.

**Sound** is in-house WebAudio, zero files (room tone, coin ring, capacitor whine, shutter clack,
flash pop, paper thwack, curtain swish), created only on the first press. It **inherits the
listener's preference** through the estate's shared `ws:pref:muted` key and deliberately invents
**no second control**. It does NOT mount `tools/calendar/air.js`: ground.md says a page that
already sings should not wear the air chip, and mounting it would drag `calendar.js` +
`tree-art.js` + the score voices into a photo booth. The preference wiring is the shared part.

**Reduced motion** gets a bloom-only variant — no full-page white, no tumbling flight, the strip
slides into place — and it is still lavish. Verified under emulated `prefers-reduced-motion`.

**Verification — a payoff-liveness twin, NOT a theorem.** `ledger/booth.test.mjs`, **32/32**:
it fires within a bounded time · no portrait is blank or below the fog floor across all 444
cycles · same maker → byte-identical, 200 sampled makers → 200 distinct · every name/koan/role/
cycle traces to a real `ledger.jsonl` entry (1776 frames, 0 fabricated) · the writ's clause
(never an empty frame, never a duplicate, hapax preferred, a passed-over maker rendered at
identical fidelity and undimmed) · **the dignity assertion**, a *source-level* check that no
code path branches on `shipped`/`judged-down`/`decayed`/`unbuilt` and that `seedFor` reads
exactly `name · koan · role · cycle` and nothing else — it fails if anyone ever adds such a
branch · the pile is ≥3 deep in the lit zone and a freshly pinned strip answers `hitTest()` at
its landed position. Plus a real browser pass driven with a **true input-level click**
(CDP `Input.dispatchMouseEvent`, never `dispatchEvent`).

**Auto-maintenance, no CLAIM.** `booth.src.html` forge-includes `ledger.jsonl`, and `collate.sh`
phase 2 already runs `forge --all` after every collate — so the wall grows by itself each cycle.
Confirmed enrolled: `forge --check --all` is green at 160 files.

**Two landmines recorded for the next maker.**
1. **forge's static-import stripper is WHOLE-LINE anchored** (`STATIC_IMPORT`, `tools/forge/forge.mjs`).
   A multi-line `import { … } from '…'` block survives into the forged classic `<script>`, where
   it is a SyntaxError that silently kills the *entire* inlined block — core, sound and hall at
   once — leaving an empty canvas and no useful console error. Keep such imports on one line
   (`booth.hall.mjs` carries the warning at the import). Cost one debug cycle here.
2. **`agent-browser mouse down/up` fire at (0,0)** regardless of a preceding `mouse move`, so
   they cannot click a canvas-drawn object. Drive CDP `Input.dispatchMouseEvent` with explicit
   x/y instead. `node ledger/booth.test.mjs --how` prints the whole browser recipe.

## 2026-06-17 — The invariant goes multi-seat: `depth ≥ stones` was structurally wrong (cycle #116, [bug] fix)

**Supersedes the #22 entry's structural invariant.** The #22 leg `depth ≥ stone-count`
(named below) assumed **one mark per commit** — but the autonomous loop is not that manor:
**several seats sign each cycle** (director, explorers, builder, publisher) and `collate.sh`
seals all of one cycle's marks into a **single** commit. So the pile grows ~4-5 stones per
passage walked, and `depth ≥ stones` was structurally **guaranteed to fail** once the loop
got going (already −71 at #114, never CI-gated, drifting ~4/cycle, silent). At #115 depth=478
but stones=553 — gap **−75**, which the page had been silently clamping to 0 (it lied).

- **The TRUE invariant counts PASSAGES, not stones.** Each stone's `cycle` IS the git
  commit-depth of the commit it lives in (sign.sh/collate.sh v3), so the count of **distinct
  `cycle` values** among the stones === the number of distinct introducing-commits === the
  passages actually walked to lay the pile. **That** is what depth must dominate.
- **`core.test.mjs` (the Node twin):** assertion (9) rewritten → **(9)** `distinctCycleCount
  ≤ depth+1` and **(9b)** `max(cycle) ≤ depth+1` (the +1 honors collate's documented in-flight
  overhang — this cycle's not-yet-landed batch is stamped depth+1 while depth.txt holds the
  last-landed depth), plus **(9c)** a tamper negative-control (a forged-deep stone, cycle=depth+5,
  is REJECTED — proves the guard bites, not a tautology). Assertions (1)-(8),(10) untouched.
- **`face.src.html` (the visitor page)** carried the broken model in three places, all fixed:
  the render now computes `markedPassages = new Set(cycles).size` and `gap = max(0, depth −
  markedPassages)` (was `depth − stones`, the source of the −75 lie); the in-page self-test
  legs (10)/(10b tamper)/(11) mirror the Node twin; the prose + depth-carrier comment recast
  to the **three-quantity** story (DEPTH · STONES · MARKED PASSAGES). The count line now reads
  "N stones laid across M marked passages · K walked here unmarked".
- **"Quantified silence" survives, recast:** the gap is `depth − marked-passages` (passages
  walked on which NO ONE signed), not `depth − stones`. At build: 553 stones across 128 marked
  passages, depth 478 ⇒ **350 silent passages**, cycle 306 to 479.
- **Re-forged** `ledger/face.html`; `forge --check --all` GREEN (40 files). Node twin ALL PASS
  (553 marks); in-page self-test 12/12 ✓. `ledger/README.md` was checked and has **no** stale
  `depth ≥ stones` line (its depth mentions are cycle-derivation, unrelated). The #22 entry
  below is preserved verbatim as the historical record of what the invariant was — read it as
  history, not current truth.

## 2026-06-14 — Two measures: the worn path vs the named pile (cycle #22, [bug] fix)

**Brandon's [bug] (`ROADMAP.md`): _"the maker counts the stones in the Cairn and calls
it depth."_** The page conflated the **stone-count** (named makers) with **depth** — but
the ledger is incomplete by construction (makers may decline to sign, and the history
predates the founding stone), so the stack under-reports how far the trail is worn.
**Fixed by surfacing TWO distinct, honest quantities and making the gap between them
read as the quantified silence.**

- **DEPTH (the worn path) — the new primary measure.** The git commit-depth of the whole
  history (`git rev-list --count HEAD` = **343** at build). Rendered as a gilt primary line
  ("the path is worn 343 passages deep") above the stones line.
- **STONES (the named pile) — the secondary measure.** The 67 lines in `ledger.jsonl`,
  unchanged. The stones line now reads "67 stones laid · **276 walked here unmarked** ·
  cycle 0 to 21" — the gap `depth − stones = 343 − 67 = 276` is the count of unmarked
  passages, the silence made arithmetic.
- **`ledger/depth.txt` (new tracked file).** Holds the commit-depth integer. The forged
  face is STATIC (no server, no git at view time), so the number is inlined at BUILD time
  from this file via a second carrier `<script type="text/plain" id="depth-data">` —
  exactly as `ledger.jsonl` is inlined into `#ledger-data`. **No NUMBER on the wall without
  a file backing it.** `parseDepth()` (trim → `Number` → validate finite non-negative int;
  a malformed carrier fails the self-test loudly, never renders NaN).
- **`ledger/collate.sh` refreshes it each cycle.** After collating the inbox, it writes
  `git rev-list --count HEAD > depth.txt` (with a non-git / no-HEAD fallback that keeps the
  existing value, never blanks the carrier). **Documented off-by-one:** collate runs BEFORE
  this cycle's commit lands, so `depth.txt` captures the depth *as-of-collate* (the last
  completed commit) — the same honest "observable depth" convention `sign.sh`'s
  `derive_cycle()` uses.
- **Prose reconciled** so the page no longer implies stone-count IS depth: the silence-cap
  now names the gap ("276 walked here unmarked … the trail is worn deeper than the pile is
  tall; the difference is the silence"); the footer states it plainly ("DEPTH is not the
  height of the pile: it is how far the path is worn … **Read the trail, not the stack**" —
  Brandon's riddle answered).
- **Self-test extended 7 → 11 legs** (in-page pill + `window.__CAIRN_SELFTEST__`): the
  4 original data-binding proofs (count/seq/DOM/bijection) and 3 negative controls stay,
  plus **(8)** depth carrier is a valid integer, **(9)** DATA-BOUND — the *displayed* depth
  (re-extracted from the rendered `#depthline` text) === the integer in `depth.txt`
  (the same carrier→DOM binding the stones have), **(10)** the STRUCTURAL INVARIANT
  `depth ≥ stone-count` (the trail is at least as worn as the pile is tall — what makes the
  silence real), **(11)** `gap === depth − stones` and the prose names the same number.
- **`core.test.mjs` Node twin extended 9 → 13 legs:** same `parseDepth` core, asserts
  `depth.txt` is a valid integer, `depth ≥ N`, and the forged `face.html` **depth carrier
  === `depth.txt`** (the same forge-inlined parity the ledger carrier has).
- **Re-forged** (`node tools/forge/forge.mjs ledger/face.src.html`); `forge --check --all`
  passes (the new `depth.txt` include + the existing `ledger.jsonl` include both parity-clean).

Verified live (agent-browser): self-test **11/11 ✓**, **0 console errors**, the page shows
both 343 (gilt, worn path) and 67 (named pile) with the 276 gap named in the count line,
the silence-cap, and the self-test detail.

## 2026-06-14 — The Cairn ships (cycle 1)

The makers' ledger had a data store (`ledger.jsonl`, `sign.sh`, `collate.sh`) but no
window — eight makers had written their names into a file no eye in the manor could
reach. The Cairn gives it a face.

- **`face.src.html` → `face.html`** (forged via `node tools/forge/forge.mjs ledger/face.src.html`).
  A self-contained, zero-dep, `file://`-safe page. Vertical stacked stones, newest on
  top (DOM descending seq), the founding keystone (`cycle:0`, "Cairn") set apart in gilt
  at the base with a "the ledger began here" ground line. Below the line, a fixed band of
  dim anonymous "silence" stones for the nameless pre-ledger makers (git-only "Claude,
  koanless") — present but uncounted, so the asymmetry is visible without fabricating
  entries. Each named stone is a real `<button>`; hover or click/Enter toggles its koan.
- **The data carrier (the one graft from the prototype).** The prototype carried the
  marks in a JS template literal (`` const LEDGER_RAW = `…` ``), which a future koan
  containing a backtick or `${` would break at build time. Replaced with an inert,
  escape-proof carrier:

      <script type="text/plain" id="ledger-data">
      <!-- forge:include ledger.jsonl -->
      </script>

  read once via `document.getElementById('ledger-data').textContent`. forge inlines the
  file verbatim; the page parses that text and renders ONLY parsed records (no hand-built
  array anywhere). The include path is `ledger.jsonl` (forge resolves relative to the
  `.src.html`'s own directory, which is `ledger/`).
- **The self-test (the signature).** A green pill (bottom-right) and
  `window.__CAIRN_SELFTEST__` carry 7 checks proving the face is data-bound:
  (1) count === file-line-count; (2) seq contiguous 1..N; (3) DOM has exactly N stones;
  (4) rendered ⇄ record 1:1 bijection on seq, with visible name/koan textContent ===
  record values; (5) negative control — synthetic seq=999 flagged not-in-file;
  (6) negative control — truncated copy yields N−1; (7) data-bound growth — augmenting
  the raw with a 9th line yields N+1 (proving a `collate.sh` append grows the face by
  exactly one). The negative controls are rebuilt from `LEDGER_RAW` (the carrier's
  textContent), not a separate literal, so every proof stays bound to the rendered data.
  The silence stones are deliberately excluded from the count.
- **`core.test.mjs`** — a Node twin of the parse/bind core (zero-dep). Confirms the
  same `parseLedger` logic agrees with the real file AND that `face.html`'s carrier was
  inlined verbatim (name+koan+seq byte-for-byte). `node ledger/core.test.mjs` → 9/9.
- **Registered** on the Workbench rack (`workbench/index.html`) as a new "Tools /
  Memorial" card. A Workbench page, not a front-door POI — no `ws:seen:` breadcrumb.

### Build / append path

When `ledger/collate.sh` folds the inbox into `ledger.jsonl`, re-inline the new lines:

    node tools/forge/forge.mjs ledger/face.src.html

The carrier picks up the appended lines verbatim and the face grows by exactly one stone
per new mark — which self-test check (7) and `core.test.mjs` prove in advance.
