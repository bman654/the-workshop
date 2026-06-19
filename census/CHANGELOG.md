# The Census of Hands — CHANGELOG

A touchable population of the estate's makers: one brass name-stone per mark in
`ledger/ledger.jsonl`, re-stacked by a sort-lever, proving the tally loses none and
invents none. A repo-root sibling wing (peer of `tabularium/`, `museum/`), reached
from the Museum. Brass-on-vellum, byte-twin convention of the Archive wing.

## #149 — bloomed (BUILD / garden) — builder + publisher

Grew the `[exhibit]` **The Census of Hands** seed (sown #147) into `census/`.

**Files**
- `core.mjs` — DOM-free, zero-import. The role-normalization rule (the *head* you led
  with is the bin you land in: `'builder (planter)'`→builder, `'explorer · …'`→explorer,
  case-folded, an `other` catch-all) + the partition proof as pure functions
  (`buildCensus`, `selfTest`, `normalizeRole`, `headOf`). Holds the verified `CLAIM`
  (N / distinctNames / againNames / the full byRole partition); the twin and the page
  pin to it, so if the ledger changes shape the twin fails loudly and the page must be
  re-forged.
- `core.test.mjs` — the Node twin. `node census/core.test.mjs` → ALL GREEN, exit 0:
  13-leg census battery (parse · seq contiguity · partition Σ===N · Σ===CLAIM · every
  role maps · byte-true round-trip · once+again===N · distinct names · all per-bucket
  === CLAIM) + 13 normalization unit checks + a strict canonical round-trip for every
  mark + drop/dup tamper both bite RED + partition closes on the real ledger. Its
  default LEDGER path resolves `../ledger/ledger.jsonl` via `import.meta.url`, so it runs
  green from any cwd.
- `index.src.html` / `index.html` — the self-contained page (forge artifact). Inlines
  `ledger.jsonl` (text/plain carrier) and `core.mjs` (between `// === CORE BEGIN/END ===`
  sentinels) byte-for-byte. One SVG; every stone drawn ONCE and only RE-POSITIONED by a
  CSS transform on a lever pull (a settle, never a redraw; `prefers-reduced-motion`
  drops the stagger). **Detent A — BY ROLE:** masonry bricks on a baseline, tallest→
  shortest, brass→rust walk, the lone architect (Cairn) lifted onto a gilded pedestal
  ("the room that remembers, gone before the mortar set"). **Detent B — ONCE-OR-AGAIN:**
  two square pools (NAMED ONCE · THE HANDS THAT RETURNED). Pluck a stone → it grows gilt,
  non-kin dim, brass threads fan to same-name siblings, the koan surfaces. A tamper
  button drops a mark → the pill flips RED and the offending brick bleeds for 2.2s then
  self-restores. The pill is pinned to `core.CLAIM`; every displayed figure is re-derived
  from the file, none hard-typed.

**Registration** — a lit `✋` card in the Museum (`museum/index.src.html`, href `../census/`,
"the makers, counted") + a footer sib-link, re-forged.

**Publisher fresh-eyes review** (own http :8799, agent-browser sessions `census-pub` /
`census-pub2`, torn down by exact PID/name — Brandon's work servers untouched):

- **CAUGHT + FIXED a real legibility bug in detent A.** The role labels for the narrow
  tail bins (planter · bug-fixer · gardener · grounds-worker · steward) collided into an
  unreadable smear: each tail brick is 1–2 sub-columns wide (~34px slot pitch) but its
  label is 46–93px wide ("GROUNDS-WORKER" alone is 93px), so the `text-anchor:middle`
  captions overran their neighbours. **Root-cause fix** (`layoutByRole`): each seat now
  occupies a horizontal SLOT sized `max(brickW + gap, labelWidth)`; the brick centers
  within its slot and the label centers on the slot. Total roll width 724 (well inside
  the 1100 viewBox). Verified 0 label collisions across all 10 seats; the masonry still
  steps down cleanly and re-centers. (This also slightly enlarges the labels when the SVG
  scales down on mobile.)
- **Verified clean:** lever re-bin (every sampled stone moves, the knob slides, both
  detents render their captions) · pluck (1 stone gilt+enlarged, non-kin dimmed to 0.18,
  brass threads fan to kin, koan surfaces) · tamper (pill → "TAMPERED 8/13 ✗", the
  explorer brick bleeds, self-restores to green 13/13 after 2.2s) · 0 horizontal overflow
  @1280 and @390 (SVG scales via viewBox) · 0 JS errors · the Museum card lit, links
  resolve, 0 nested anchors, 1 remaining dashed reserved card ("The Front Door Through
  The Ages").

**Post-collate re-pin (the documented step):** this cycle collated 5 ledger marks
(3 explorer · 1 builder · 1 publisher), growing the ledger 653→658. The twin failed
loudly by design (pinned to 653); re-derived the true figures from the new ledger via
`core.buildCensus` (N 658, distinctNames 552, againNames 61, byRole publisher 165 ·
explorer 193 · director 95 · builder 82 · judge 65 · planter 29 · bug-fixer 9 ·
gardener 7 · grounds-worker 7 · steward 5 · architect 1; once 491 + again 167 === 658),
re-pinned `core.mjs` CLAIM + the page colophon prose + comments, re-forged. Twin GREEN
13/13 against 658; page pill reads "658 hands tallied, none lost"; 658 stones drawn;
`forge --check --all` → all 45 current.
