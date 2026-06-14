# The Cairn — changelog

A visible face for `ledger/ledger.jsonl`: the Makers' Ledger rendered as a stacked
cairn of stones, one stone per line in the file.

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
