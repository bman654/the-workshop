# The Infinite Overhang — changelog

A touchable **block-stacking problem**: a side-on brass table whose edge is the
**cliff**, with stacked books you **drag out over thin air**. How far past the cliff
can the top book's right edge float and the tower still stand?

Under each sub-stack rides a colored **center-of-mass dot** — **green** while it sits
over its support, **red** the instant it crosses the edge below — and then that layer
**topples** into the dark. The whole lesson rides on that dot: *when the dot crosses
the edge, the layer tips.*

The honest star is the **divergence**: the classic **single-wide** harmonic stack's
optimum overhang is **exactly ½·H(n)** book-lengths, and because the harmonic series
diverges there is **no ceiling** — with enough books you can overhang **any** distance.
Yet each new book buys only the ever-smaller nudge **1/(2k)**: the divergence ledger
shows it live (it takes **4** books to clear one length, **31** for two, **227** for
three). *Divergent, but each step diminishing.*

> Honesty: this is the **single-wide** optimum (one book per layer) — **not** "the
> maximum possible overhang." Multi-wide constructions reach ~n^(1/3) and are a
> different problem we do not build here. The divergence claim is the true one.

The soul is the **crawl you feel**; the proof is a quiet pill.

---

## #107 — sown (the books are laid)

Born from the ROADMAP `[exhibit]` seed *"The Infinite Overhang"* (sown #104), grown
from explorer prototype **A** (the builder's game — drag every block, the richest,
most on-soul interaction; verified 21/21) finalized to the production bar, with one
**graft from B** (the live per-book diminishing-nudge ledger line) and explorer **C's
counterweight toggle cut** (it shipped false-red toppling markers on a near-identical
staircase — confirmed on screen at n=13 — so it was removed entirely).

### What it is
- **The verb:** drag any book (the topmost under the cursor wins the hit-test) to
  slide it right, out over the one below. Rightward-past-the-tip is **allowed** and
  **fires the topple**: books at and above the failing interface tumble with gravity
  and spin into the dark; the survivors below remain.
- **Controls:** `+ add a book`, `snap optimal` (lay the textbook single-wide stack),
  `reset`, and `auto-stack ▶` (grow the optimal stack one book at a time and watch the
  top edge crawl out, ever slower).
- **Goals:** dashed verticals at x = 1, 2, 3 book-lengths past the cliff turn green +✓
  when the top book floats fully past them. The **WIN** verdict fires the moment the
  top book's right edge floats past x = 1.
- **The hero readout:** a big tabular-mono overhang number in book-lengths — **green**
  while stable, **red** while past-edge / toppling.

### The four-file rattleback pattern
- **`core.mjs`** — the sole pure, DOM-free geometry/physics authority:
  `harmonic(n)`, `maxOverhang(n) = ½·H(n)`, `nudge(k) = 1/(2k)`, `optimalLefts(n)`
  (bottom book overhangs the table by 1/(2n), each book above overhangs the one below
  by 1/(2k)), `comOf`, `supportTest` (cumulative CoM-from-the-top per-interface test;
  the bottom block tested against the cliff at x = 0), `topOverhang`, `minBooksFor`,
  and `runSelfTest`.
- **`core.test.mjs`** — the **Node twin**: imports the SAME `core.mjs` and runs the
  SAME `runSelfTest()`, then adds direct probes for each claim. `node overhang/core.test.mjs`
  exits **0** iff every claim is green.
- **`index.src.html` → `index.html`** — the page inlines `core.mjs` **byte-faithfully**
  via `forge:include` (forge strips the `export` keywords). The in-page pill runs the
  exact same `runSelfTest()`.
- **`CHANGELOG.md`** — this file.

### What the self-test proves (the pill = the Node twin, GREEN 23/23)
1. **The optimum is exactly ½·H(n)** — the optimal stack's top-block right edge equals
   ½·H(n) to **machine ε** for n = 1..300 (worst |Δ| ≈ 2e-15).
2. **Every top-k sub-stack's CoM sits exactly on its support edge** — the whole tower
   balanced on a chain of knife-edges (max |margin| < 1e-12 for several n); the
   whole-stack CoM sits exactly on the cliff x = 0.
3. **The divergence thresholds** — `minBooksFor(1)=4`, `(2)=31`, `(3)=227`, and the
   bracket **½·H(3) = 0.9167 < 1 < 1.0417 = ½·H(4)**; the nth book's gain equals exactly
   `nudge(n) = 1/(2n)`.
4. **Negative controls** — a literal **1px (=1/240 book-length)** over-nudge of the top
   book flags topple **true** at the inner failing interface (and even a 1e-6 push trips
   it — the brink is genuine); a **vertical zero-overhang stack stays stable**.

The **tamper button** (click the pill) secretly nudges `maxOverhang` by +1e-6, re-runs
the suite so claim (1) fires **RED**, then auto-restores the honest core and re-runs
**GREEN** — proof the pill is a live witness, not a hard-coded label.

### The three production changes to A
1. **Graft from B** — the divergence ledger gained a live **per-book diminishing-nudge
   line**: adding a book shows `+0.0161 = 1/62` (the exact 1/(2k) it bought), so the
   logarithmic crawl is explicit.
2. **Fixed the mobile win-state** — at 390px the hero number, the cliff label, the win
   verdict, and the divergence ledger used to overlap. Now the ledger docks full-width
   at the top, the hero number + verdict get their own band, and the controls dock
   full-width at the bottom. Verified: **0 horizontal overflow @390**, no vertical
   collision (ledger 84–233, hero 627–716, controls 727–836 of an 844px viewport).
3. **Legibility** — the per-sub-stack **CoM dots are enlarged** (with a halo and a dark
   rim so they read against the brass) and a **one-time onboarding micro-hint** —
   *"watch the dot — when it crosses the edge below, that layer tips"* — fires on first
   interaction, so the dot↔topple link is unmissable.

### Registration
- A `PLACES` record (`id:"overhang"`, **grounds / tier 2**, glyph 📚, accent `#e8b86b`,
  footprint `"overhang"`) + a `drawOverhang(g,r)` front-door footprint (a side-on brass
  table slab with a stepped staircase of book rects leaning past the cliff edge + a
  faint x=1 goal tick), wired into the front-door `DRAW` table.
- **No new sky star** — keeping the PLACES↔sky bijection at 73/73 (the rattleback
  precedent). Drops `ws:seen:overhang` on visit.

### Verified green
`node overhang/core.test.mjs` exit 0 (27 probes / 23-claim suite) · in-page pill GREEN
23/23 with a working tamper · `forge --check --all` 38/38 · `forge --audit-seen --strict`
exit 0 · `tools/layout/smoke.cjs` PASS · `tools/sky/sky.test.cjs` 73/73 · ~61 fps · clean
console · 0 nested anchors · 0 horizontal overflow @1280 and @390.

### Publisher fresh-eyes — SHIPPED CLEAN (#107)
Reviewed across both registered surfaces (the piece + the front-door map) in a served
session (`oh107pub`, `127.0.0.1:8791`, torn down by exact PID/session — Brandon's
:3001/:4380 untouched). **Found clean — no bug filed, no fix needed.**
- **Self-test live:** in-page pill GREEN `self-test ✓ 23/23`; clicked the pill → tampered
  RED `✗ 2 fail (tampered)` → **auto-restored to GREEN 23/23** after ~1.6s. Node twin
  re-run **27/27 exit 0**.
- **Interactive topple verified end-to-end** by driving the real `pointerdown/move/up`
  code path: dragged the top book past its support edge → the stack fell **5→4 books**,
  the hero number dropped **1.14 → 0.64**, the verdict flipped to **"toppled"**, and the
  four survivors kept their green CoM dots riding their support edges (internal `lefts`
  confirmed length 4, `toppling:false` after settle). (`agent-browser`'s synthetic
  `mouse` events don't synthesize `PointerEvent`s, so the drag was driven via dispatched
  `PointerEvent`s — a harness detail, not a piece issue.)
- **Win state:** 5 books + snap-optimal → hero **1.14 = ½·H(5)**, green verdict
  *"the top book floats fully past the cliff — you win."*
- **Layout:** 0 nested anchors, 0 horizontal overflow at 1280, 1440, and **390px**; the
  390px win-state re-flow is clean (ledger docked full-width top · hero+verdict band ·
  controls full-width bottom). Console clean (0 errors) on the piece AND the front door.
- **Front door:** the 📚 *The Infinite Overhang* tile renders its own `drawOverhang`
  footprint (17 shapes: brass slab + table-surface/cliff lines + the five-step book
  staircase with a lit hero book + the cyan `x=1` goal tick) under the 📚 glyph; link
  `overhang/index.html` correct. (A first mis-cropped close-up looked like it showed a
  red orb — that was the neighboring rattleback footprint; the DOM proves this tile's own
  footprint is the staircase.)
- **Honesty audit:** the in-page copy + ledger claim *"max overhang ½·H(n)"* / *"the
  textbook single-wide stack"* — never "the maximum possible overhang." Correct and on-soul.

Bloomed cycle #107; provenance also in [worklog/2026-06.md](../worklog/2026-06.md) #107
and ROADMAP `BLOOMED #107`.
