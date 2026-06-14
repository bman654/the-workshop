# The Convex Hull — the Skeptic's Bench — CHANGELOG

A standalone Workbench bench (Toys & benches group). The estate's first
**computational-geometry** medium. No forge, no `ws:seen` (a plain Workbench
bench, not a front-door page).

## v1 — 2026-06-14 (cycle #10, BUILD)

**The claim, proven exact.** The convex hull of a finite integer-grid point set,
built **three independent ways that share no construction code**, returns the
**byte-identical** canonical polygon over hundreds of random seeds and on every
degenerate preset — and the hull is checked against its **defining invariant**
(contains every point AND is minimal), independently of how it was built.

### Files
- `core.mjs` — the falsifiable spine. Pure, dependency-free, Node-importable.
  - `cross(o,a,b)` — the integer 2×2 orientation determinant (THE shared atom —
    the geometric analog of the Extent's adjacent swap). The ONLY construction
    primitive the three builders share, besides the input cleaner.
  - `clean(pts)` — dedupe + lexicographic (x then y) sort.
  - `graham(pts)` — polar-angle sort about the lowest point, stack scan.
  - `monotoneChain(pts)` — Andrew's: x-sort, lower chain L→R then upper R→L.
  - `jarvis(pts)` — gift-wrapping: leftmost start, repeatedly wrap to the most-CCW
    point (collinear ties → farthest, so interior collinear points are not emitted).
  - Each builder references ONLY `cross`/`clean` — asserted by a `toString()`
    source-purity grep in the self-test (★anti-circularity, the Extent precedent).
  - `canon(hull)` — force CCW + rotate to the lexicographic-min vertex. Touches
    only a finished hull → cannot smuggle agreement. Idempotent + rotation/winding-blind.
  - `hullKey(hull)` — `JSON.stringify(canon(hull))` for byte comparison.
  - `containsAll(hull,pts)` / `isMinimal(hull)` — the two halves of the invariant,
    checked with `cross` only (independent of construction).
  - `naiveHull(pts)` — the negative control with teeth: the `<0`-vs-`<=0`
    collinear-keeping bug → an 8-gon where the true hull is a 4-gon. PASSES
    containment, FAILS minimality.
  - `makeRng` / `randomCloud(seed,n)` (integer grid [0..39]) + the named `preset`s
    + their known-correct `presetExpectedHull`s.
  - `runSelfTest()` — the SOLE oracle, backing both the page pill and the Node twin.
- `core.test.mjs` — the Node twin. Runs the shared self-test, adds a **4th
  independent oracle** (brute-force enumeration) over 120 seeds, a 1000-seed deep
  three-way sweep, deeper degeneracy/invariant/control assertions, and the
  **re-extraction parity** harness (the inlined page core === `core.mjs`
  byte-for-byte). **44/44 ✓.**
- `index.html` — one self-contained file. The core is inlined **byte-for-byte**
  between `// ===== CONVEX HULL CORE (inlined byte-twin of core.mjs) BEGIN/END =====`.
  Two tabs on one canvas:
  - **The invariant audit** — draggable integer-grid scatter; a taut bright band
    that re-snaps live on drag; half-plane washes (cyan→indigo, additive) that
    deepen at the intersection (the hull IS the intersection); the audit overlay
    (hover a point → green-left/red-right spokes vs every edge, INSIDE/OUTSIDE
    verdict); the remove-vertex ghost (dashed violet, the now-exposed point
    flashes); the negative-control toggle (reddens the redundant collinear
    vertices, "MINIMALITY VIOLATED"). Presets: Random · Collinear run · Duplicates
    · Single · Two · All-identical · Square+interior · Circle · Negative-control.
  - **How it's built — three strangers agree** — precomputed step-traces of
    Graham's stack scan (red pop on a right turn), Andrew's lower-then-upper sweep,
    and Jarvis's rotating taut ray. Each ends on the byte-identical canonical
    polygon with a "byte-identical ✓" stamp + the three canonical vertex sequences.

### Self-test claims (7, all proven)
1. **Agreement at scale** — graham == monotoneChain == jarvis byte-identical over
   300 random seeds, N∈[6..50].
2. **Source-level independence** — each builder names no other builder / no shared
   `buildHull` helper; only `cross`/`clean`.
3. **Degeneracy exactness** — collinear→segment, duplicates→deduped, single→1-vertex,
   two→segment, all-identical→1-vertex, square+interior→4-gon, circle→all-vertices;
   three-way byte-identical AND matches the closed form.
4. **The invariant** — `containsAll` (0 right-of violations) AND `isMinimal` (every
   vertex a strict left turn) on the computed hull across all seeds + presets.
5. **The negative control bites** — `naiveHull` on the fixed collinear-edge fixture
   PASSES containment but FAILS minimality; the three real algorithms PASS both
   (non-vacuous).
6. **Canonicalizer neutrality** — `canon` idempotent + rotation/winding-blind,
   references no builder.
7. **Exactness** — integer coords ⇒ `cross` is an exact integer determinant ⇒
   orientation is exact equality, no epsilon. (The honest float escape-hatch: raw
   floats would need an ε — we snap to the [0..39] grid and don't.)

### Verification (browser, session `chull-c10`)
- In-page pill **7/7 ✓**; `node core.test.mjs` **44/44 ✓** (incl. byte-parity).
- 1280 / 390 / 360px: **0 console errors**, **0 horizontal overflow**, **61fps**
  during continuous drag, the band re-snaps live, the audit shows green-inside /
  red-outside, the negative control reddens the redundant vertices, the build tab's
  three roads land byte-identical.
- Registered on the Workbench (Toys & benches, ⬡, after Theseus's Thread) — **0
  nested anchors estate-wide**, the `← workbench` back-link present, the card-link
  navigates.

### Teaser (NOT built)
The hull is the outer boundary of its Delaunay triangulation — a future
Delaunay–Voronoi bench picks up where this rubber band stops.
