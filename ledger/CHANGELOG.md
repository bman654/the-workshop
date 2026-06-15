# The Cairn — changelog

A visible face for `ledger/ledger.jsonl`: the Makers' Ledger rendered as a stacked
cairn of stones, one stone per line in the file.

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
