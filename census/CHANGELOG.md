# The Census of Hands — CHANGELOG

A touchable population of the estate's makers: one brass name-stone per mark in
`ledger/ledger.jsonl`, re-stacked by a sort-lever, proving the tally loses none and
invents none. A repo-root sibling wing (peer of `tabularium/`, `museum/`), reached
from the Museum. Brass-on-vellum, byte-twin convention of the Archive wing.

## #220 — bug fix (BUILD / bug) — bug-fixer + publisher

Cleared `[bug] #220` — the census twin went RED on the `other` bucket. The lone
`groundskeeper`-led ledger mark (seq 869, "The Fieldwright" — the PLAN/grounds keeper
seat, sibling of `gardener`) had no matching base bucket and fell into the catch-all
`other`, so the strict leg `every role maps to a base bucket (0 in other)` reported
`1 in other` and the dependent `VERDICT all legs green` bit RED (12/13).

**Fix — the honest one (option 1 of the bug fence):** seat `groundskeeper` as a real
12th BASE bucket rather than widening the catch-all. `gardener` (PLAN/garden) and
`groundskeeper` (PLAN/grounds) are the two keeper seats that sow each track — both earn
their own bin.

**Files**
- `core.mjs` — added `'groundskeeper'` to `BASES` (adjacent to `gardener`) and to
  `SCAN_ORDER` (single-token group, heads disjoint from `grounds-worker` — neither
  string prefixes the other). Recomputed `CLAIM` from the real ledger → `byRole` now
  `groundskeeper: 1, other: 0` (N=890, distinctNames=730, againNames=86 unchanged).
  Header/comments ELEVEN→TWELVE; stale `672`-marks comments → 890.
- `core.test.mjs` — two new normalization unit checks: `'groundskeeper' → groundskeeper`
  and `'groundskeeper (director)' → groundskeeper`.
- `index.src.html` — colophon prose: "one of twelve base seats", named the two keeper
  siblings, "thirteenth catch-all other"; de-literalized stale `1…672`/`672 exactly` →
  `1…N`/`N exactly`; `~672 brass stones` → `~890`.
- `index.html` — re-forged byte-true from the source; inlined core's `CLAIM` reads
  `groundskeeper: 1, other: 0`, TWELVE BASE BUCKETS.

**Publisher follow-on fix (a sibling file the builder missed).** `reclaim.mjs` — the
hook `collate.sh` runs every cycle to re-pin `CLAIM` from the live ledger — carries its
own `DISPLAY_ORDER` that must be a permutation of `BASES + OTHER` (a guard so a new
bucket can never be silently dropped from the pinned partition). The builder added
`groundskeeper` to `core.mjs` BASES but NOT to `reclaim.mjs` DISPLAY_ORDER, so `collate.sh`
printed `reclaim: REFUSING — DISPLAY_ORDER is not a permutation of BASES+OTHER` and the
CLAIM did not re-pin. Fixed: added `'groundskeeper'` to `DISPLAY_ORDER` (third line, before
`architect`/`OTHER`, matching the room's hand layout) and changed the byRole print grouping
5/4/3 → **5/4/4** (`g3` slice now `slice(9)`). Re-ran `node census/reclaim.mjs` → re-pinned
cleanly. Also de-literalized every remaining hardcoded count (the two `core.mjs` header
"890 marks" comments, the CLAIM comment "Σ === N === 890", and `index.src.html`'s
`(672 / 195 / 563 / 62)` example + `~890 brass stones`) → "N / the live ledger", so
**reclaim.mjs is the SOLE count authority** and the prose can never staleness-rot (the exact
failure mode that produced the original 672-vs-890 drift). **If you ever add a bucket to
`core.mjs` BASES, you MUST also add it to `reclaim.mjs` DISPLAY_ORDER** or the re-pin refuses.

**Verified (final, N=893 after the cycle's 3 new ledger marks)** — `node census/core.test.mjs`
ALL GREEN, exit 0: `0 in other` PASSES, `VERDICT all legs green — 13/13`,
`every bucket count === claim — 12 buckets pinned`; new groundskeeper checks PASS;
`'grounds-worker (builder)' → grounds-worker` still PASS; `unmappable 'gremlin' → other`
still PASS (catch-all stays total, now empty on real data); tamper drop/dup still bite RED
(8/13, 8/13). Tabularium twin (also re-pinned by collate) ALL GREEN. `forge --check` all 58
current. In-browser: pyramid seats a GROUNDSKEEPER brick (count 1) between STEWARD and THE
ARCHITECT, proofgrid 13/13 0-fail, partition card `893 = 893`, in-page tamper bites, no
stale count literal in the prose.

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
