# Loomlight — changelog

## Build 1 (2026-06-12)

First build. A tactile digital handweaving loom — `loom/index.html`, a single self-contained
vanilla HTML/CSS/JS file (0 deps, 0 network, no audio), 1208 lines.

**What it is.** A weaver's draft you can poke. The user edits the three structures that fully
describe a floor loom — **threading** (`int[W]`: which shaft each warp end is heddled on),
**tie-up** (`bool[T][S]`: which shafts each treadle raises), and **treadling** (`int[P]`: which
treadle each pick presses) — plus per-thread **warp/weft yarn colors**, and the woven cloth
re-weaves live. It is **not a puzzle** (no win state, no unique solution) and **not a game** — it
is an interactive toy: the joy is manipulating the loom and watching cloth appear. It opens the
workshop's under-used "tactile toy" vein and a brand-new subject (fiber craft — there was no
weaving anywhere; the Sound Garden's "Loom" is an *audio* instrument and Ariadne weaves *Celtic
knots*).

**The crux (the loom equation).** Everything visible derives from one source of truth — the
drawdown matrix `D[p][e] = warpOnTop(p,e)`, where

```
warpOnTop(p,e) == tieup[ treadling[p] ][ threading[e] ]
```

(the standard rising-shed drawdown). The displayed color of a cloth cell is `warpColors[e]` if
`D[p][e]` else `weftColors[p]` (this is what makes color-and-weave effects emerge). The core is a
pure `computeDrawdown(threading,tieup,treadling)` with no DOM access.

**Layout.** The proper handweaving "computer draft" arrangement on a single Canvas: threading
strip across the top (W cols × S rows), tie-up block in the top-right corner (T × S), treadling
strip down the right (T × P), the drawdown (the cloth) filling the main field bottom-left — plus a
dedicated paintable warp-color band above threading and weft-color band beside treadling.

**Interaction (real pointer events, drag-paint).** Click a threading cell to cycle that end's
shaft (drag to paint a run); click a tie-up cell to toggle it; click a treadling cell to cycle the
treadle (drag to paint); click a yarn-color band to cycle the yarn (drag to paint color runs, e.g.
log cabin). The drawdown is read-only (it is the *result*), but hovering a drawdown cell lights up
the contributing threading end + treadling pick + tie-up cell and shows the loom equation live (a
teaching moment).

**Presets (10), each a pure generator carrying a class invariant:** Plain weave (tabby), 2/2
twill, 1/3 twill, 3/1 twill, herringbone (point twill), 5-end satin m=2, 5-end satin m=3,
basket/panama, rosepath, waffle. Plus a seeded **"surprise me"** (reproducible random coherent
draft), shaft/treadle selector (2,3,4,5,6,8), warp/weft count sliders (16–64), 5 curated yarn
palettes, Cloth⇆Draft view toggle, Clear, and a 2× **PNG export**.

**Two render modes.** Cloth view (default, tactile): each cell a shaded directional fibre (warp
vertical, weft horizontal) with a soft bump highlight + drop shadow so floats read raised — it
feels like fabric. Draft view: the technical filled/empty-square notation a weaver actually reads.
Toggling views and switching palette never change the underlying draft (cosmetic only).

**Self-test (8/8, green chip "weave verified — 8/8 ✓", never ships red).** A headless test calls
the REAL core functions on load and logs PASS per check:
1. **Loom-equation exactness** — for every preset + random seeds, independently recompute `D` from
   the loom equation and assert it equals the renderer's source matrix AND the displayed colors per
   the color rule (exact boolean match).
2. **Plain weave invariant** — every row & column strictly alternates; max float length == 1.
3. **2/2 twill invariant** — all warp & weft floats are exactly length 2; the diagonal steps by
   exactly 1 each pick (checked toroidally over the structural period — the correct definition of
   float length on repeating cloth).
4. **1/3 & 3/1 twill invariants** — float lengths exactly {1,3}; consistent diagonal step.
5. **Satin invariant** — 5-end satin with move m ∈ {2,3}: gcd(m,5)==1 and the raised warp points
   are isolated (no two adjacent on any row OR column) — the satin-validity proof.
6. **Color-and-weave** — a log-cabin color sequence over plain weave displays colors exactly per
   the drawdown.
7. **Seed purity / view-invariance** — same seed ⇒ byte-identical draft fingerprint; a fresh seed
   differs; toggling view + switching palette do NOT change the fingerprint.

(The loom-equation check folds presets + random seeds + the color rule into one check; 8 named
checks total.)

**Verification.** Self-test core extracted from the shipping `<script>` and independently re-run
under Node — all checks PASS. **Browser-verified end to end** (agent-browser, served origin):
chip green 8/8, **0 console errors / 0 warnings / 0 page-errors** across the full battery (4 loads,
every preset, shaft change, both views, all palettes, seed reproduce-byte-identical, re-roll, color
paint, PNG export). Real PointerEvents exercised: threading edit (shaft 3→0, loom equation exact),
tie-up toggle (true→false, exact), treadling cycle (1→2, exact), warp-color paint (changed), hover
highlight (drawdown cell). PNG export produced a valid ~1.1 MB image. Seed reproduces a
byte-identical draft; a different seed differs. Plays from `file://` too (all `localStorage`
try/catch-guarded). 60fps (static canvas; redraws only on interaction).

**Wiring.** A `weave ·` text link added to the front-door footer beside `puzzles ·` (the curated 9
front-door cards are untouched — no 10th card, no companion pill, no Undercroft secret). A
`← workshop` back-link in the topbar. A README "Also on the workbench" entry. Drops a breadcrumb
`ws:seen:loom` (try/catch-guarded) for future hidden-world use.

Spec: `loom/LOOMLIGHT.SPEC.md`.
