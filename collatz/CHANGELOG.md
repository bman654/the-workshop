# The Collatz Bench — CHANGELOG

The third bench of the Numbers Room (after The Best Rational ⅗ and The Ulam Spiral ✦).
A self-contained, zero-dependency exhibit: `index.html` + `core.mjs` + `core.test.mjs`.
Its arrival as the 3rd bench trips the curation seed and promotes the Numbers Room to a
front-door wing.

## v1 — 2026-06-14 (Opus 4.8 · cycle #6 builder)

**What it is.** Take any positive integer; if it's even, halve it; if it's odd, triple it
and add one; repeat. The Collatz conjecture (Lothar Collatz, 1937; **still open in 2026**)
says you always reach 1. No one has proved it; no one has found a counterexample (checked
by computer past 2⁶⁸). This bench is honest about exactly that gap: it **checks**,
exhaustively, and labels OPEN/UNPROVEN everywhere a claim is made — never "proven".

### The core (`core.mjs` — the single source of truth)
Plain `Number` arithmetic. **Overflow justification (verified live):** for all start values
n ≤ 1e5 the largest value any trajectory ever touches is **1,570,824,736** (at n = 77671),
far below `Number.MAX_SAFE_INTEGER` (2⁵³−1 ≈ 9.007e15) — so every `3n+1` and `n/2` is exact
in a double. BigInt would be over-engineering theater. `STEP_CAP = 100000` is a safety valve
(the longest in-range trajectory is **350** steps, at n = 77031).

THE MAP — the one shared definition every construction is built on:
`function next(n){ return n % 2 === 0 ? n / 2 : 3 * n + 1; }`

**The four falsifiable claims:**
1. **CONVERGENCE-CHECKED** (the honest one) — total-stopping-time built TWO independent ways
   that must agree, sharing ONLY `next()`: `stoppingTimesMemo(N)` (Oracle A, memoized, the
   renderer's source) and `stoppingTimeRaw(n)` (Oracle B, a clean re-walk, **NO cache**).
   ★ANTI-CIRCULARITY GUARD pinned in code: Oracle B must NEVER read Oracle A's `st[]` array —
   sharing the cache would collapse the claim into a tautology. Asserted: `st[n] === raw(n)`
   for all n∈[2..N], 0 disagreements, every walk terminates at 1.
2. **RECORDS EXACT** — `recordSetters(N)` reproduces, live, the OEIS records: step-setters
   `A006877` (n = 1,2,3,6,7,9,18,25,27,…,871 with steps …,111,…,178) and the peak ladder
   `A006884`/`A025586`. Spot checks: 27→{111, 9232}, 97→{118, 9232}, 871→{178, 190996},
   6171→{261, 975400}, 77031→{350, 21933016}. The constants are only the assertion target —
   the values are derived live by `trajectory()`, the SINGLE path/peak/steps computer the
   whole bench uses (no second, faster path-walker anywhere).
3. **STRUCTURE** (two constructions agree) — the canonical inverse rule `invChildren(n)`
   (even predecessor 2n; odd predecessor (n−1)/3 when it's an odd integer > 1) runs Collatz
   BACKWARD from 1. On every node the backward tree reaches, its tree-depth === the FORWARD
   `stoppingTimeRaw(n)`. ★HONESTY GUARD: coverage is reported as a **STAT** ("1372 of 5000
   reached at depth 200") — never "the tree covers [1..N]" (it doesn't at finite depth; that
   would be the dishonest green).
4. **NEGATIVE CONTROL WITH TEETH** — the 3n−1 map (`nextAlt`). Now **36 of [1..60] FAIL** to
   reach 1 — they fall into other cycles. Asserted: ≥30 fail, `altCycle(5)=[5,7,10,14,20]`,
   `altCycle(17)` = the exact 18-element cycle. If a refactor ever makes `next ≡ nextAlt`, the
   control flips red.

`buildTree(depthCap)` lays out the sunburst (post-order leaf-count → pre-order arc-split
proportional to leaves; radius = depth = stopping time) — pure/deterministic for PNG
reproducibility. `runSelfTest(N)` returns the 7 pill lines (every detail carries live numbers).

### The page (`index.html`)
Inline byte-twin of the core between sentinels `// ===== COLLATZ CORE … BEGIN/END =====`
(the parity contract — `core.test.mjs` re-extracts it and proves the inlined `next()` is
char-for-char the imported `next.toString()`, and the page's `runSelfTest` agrees ok-for-ok
with the module's). Palette re-keyed from prime-spiral's `:root` (the Numbers Room family):
gold = the sink (1), bright gold = the lit path, amber = odd up-kick, teal = even slide,
violet = odd-predecessor shoots, red-amber = the OPEN register (deliberately NOT the green
self-test color).

**Viz** — TREE primary / RIVER secondary (toggle). Two-canvas pipeline (baked base rebuilt on
N/D/mode change via rAF-coalesced `queueRebuild`; per-frame overlay O(path)≤~350). The TREE is
radial-by-depth from the root 1 dead-center — the connected, no-islands blob reads as
"everything reaches 1" at a glance — with three tiers keyed off node count (coral filaments →
batched lattice → additive ImageData cloud). The DEPTH chip set D∈{10,14,18,22} controls what's
DRAWN; a separate N range (1k/10k/100k + slider) controls the VERIFIED FORWARD RANGE (pill /
records / scatter). The RIVER plots x = step-index, y = log₂(value) for every n ≤ ~1500. Shared
lit-path overlay traces HOME to 1 with parity coloring (amber odd / teal even); the river marks
the peak with a ring + callout.

**Controls** — ONE `setN_start(n)` funnel for input/preset/node-click/±keys/ladder-row.
Validation rejects ≤0 / non-integer / n > MAX_SAFE_INTEGER (flashes a red border + a one-line
reason, never NaN-traces). Presets 27·97·703·871·6171·77031 + a teal record-setter run chip.
Node-click in the tree commits to state.n (gated to the legible tier D≤14); entering an n not in
the baked tree auto-bumps D to the smallest tier containing it. The records ladder is a live,
clickable bar chart matched to A006877; n=27's row peaks (the 23→111 jump). Secondary strip:
σ(n) scatter ⟷ stopping-time histogram (record-setters teal, traced-n ringed/lit). PNG export
composites base+overlay+caption.

**Honesty chrome (in four places):** topbar OPEN-QUESTION badge · h1 tag "every number falls to
1 — checked, never proven" · a side-panel "an open question" banner (1937/2026-unproven, "checked
past 2⁶⁸", Erdős's "Mathematics is not yet ready for such problems", "0 counterexamples up to N")
· the self-test pill PASS string **deliberately downgraded** to "✓ 0 counterexamples up to N — a
check, not a proof" (the most load-bearing honesty decision — NOT normalized back to "holds") ·
a "what this proves — and what it can't" footer · ONE Mill cross card ("does it halt?").

**Mobile (pre-fixed, not inherited):** at ≤560px the topbar wraps and the two pills (OPEN badge +
self-test) take their own full row with the self-test text allowed to wrap, so both stay on-screen
(the sibling pill-overflow bug, fixed up front); the field's floating mode toggle moves to the
bottom so it never collides with the taller wrapped topbar. Verified 0 horizontal overflow at
360/390/430/540px.

### The Node twin (`core.test.mjs`) — **30/30 ✓ ALL GREEN**
Runs `runSelfTest` at N=20000 (all 7 lines + pass===total), then heavier Node-only checks at
N up to 200000: exhaustive memo===raw (0 disagreements, all terminate); records prefix===A006877
+ peak ladder===A006884/A025586 + the 5 spot checks; backward-tree depth===forward on all reached
nodes (0 disagreements) + coverage stat + only-4→2→1-loop; ≥30/60 fail under 3n−1 + the two named
cycles exact + next≢nextAlt on every odd; overflow guard (max peak 1,570,824,736 ≪ MAX_SAFE_INTEGER,
longest 350 steps ≪ STEP_CAP); determinism (trajectory(27) and buildTree(12) byte-identical;
pathOf===trajectory.path). **Re-extraction parity:** slices the inline core between the sentinels,
asserts the inlined `next()`/`nextAlt()` bodies are char-for-char the imported `toString()`,
evaluates the slice and runs ITS `runSelfTest` (same pass-count + ok-for-ok + name-for-name as the
module), and re-extracted `trajectory(27)` reproduces {111, 9232} byte-for-byte.

### Wiring
- A `numbers-room/index.html` landing (hand-authored, Engine-Room mold) gathers all three benches
  under one front-door wing; drops the `ws:seen:numbers-room` breadcrumb; its own self-test 11/11.
- The front door (`index.src.html` → forge) gained a `numbers-room` POI on the SW grounds
  (a new `drawNumbersRoom` footprint — a study with a number-spiral inlaid in the floor); re-forged,
  `forge --check --all` clean (29/29).
- The Workbench gained a Collatz card under Toys & benches, after The Ulam Spiral (stretched
  `card-link` overlay + inline content links to prime-spiral / best-rational / turing; zero nested
  anchors).
- Mill × Collatz cross wired one-directionally (the Collatz page's Mill card + the Workbench card's
  inline `../turing/` link); the reciprocal teaser into `turing/index.html` was left out as a
  shared-file edit with no clean insertion point (per the spec's optional flag).
