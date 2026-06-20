# The Wrinkling — changelog

A standalone living-sim room: one closed thread that keeps growing where it has no room, wrinkling
into brain-coral / kelp-frill / cortex by a single rule — **grow + can't-overlap + bounded room ⇒
wrinkle**. Pure generative art: it makes no math claim, and so owes no proof — only one honest
invariant (a simple closed curve that never crosses itself), held by a live conscience pill and
re-proven by a Node twin.

## 2026-06-20 — first growth (cycle 197)

**Built** the room as the estate's differential-growth specimen, three integrated layers over one
engine:

- **`core.mjs` — the engine (~360 lines).** A struct-of-arrays closed loop (Float32 px/py/age),
  a uniform spatial hash (`cellSize = SPLIT_HI·R`, sized to the max node spacing so a 3×3 query
  catches every repulsion neighbour and a 5×5 every potentially-crossing edge — sound, not a
  heuristic). Per step: `rebuildHash → per-node force triad + over-damped integrate → obstacle/clamp
  project → density-gated insertion → set state.simple`.
  - **The differential-growth triad:** REPULSION over hash-neighbours within `Rrep` (= the spacing
    target, tied to crowding — NOT a fixed R, so two folded strands always repel before they can
    cross); ATTRACTION as a rest-length spring along each chain edge + a light Laplacian (a pure
    midpoint-Laplacian is curve-shortening flow and would collapse the loop — the spring holds
    spacing WITHOUT shrinking); a tiny seeded BROWNIAN jitter to break circular symmetry.
  - **The growth driver:** the geometric guard splits any edge longer than `SPLIT_LEN`
    (= `lerp(2.4·R, 1.1·R, crowding)`, the **dial contract**), plus a small, **hard-capped,
    density-gated** growth budget that injects new length only where there's room — so growth is
    steady (relaxation always keeps pace, no transient self-crossing) and the fixed room buckles the
    surplus into folds. Insertion stops at `cap`; after cap it keeps relaxing forever (breathes,
    never freezes).
  - **The over-damped integrator** clamps each step to `MAX_STEP = 0.35·R` (the explosion guard — a
    node can never leap far enough to tunnel a non-adjacent segment).
  - **Exports** `geometry()` ( `{x,y,kappa,density,age}` per node, computed in one cheap pass reusing
    the hash) and `stats()` (arcLength, fixed room perimeter, ratio, node count/cap, capped, simple).
  - **The invariant** `isSimple`/`firstIntersection` bucket EDGES into the same hash and test only
    nearby segment pairs with an orientation/straddle test.

- **`index.html` — feel + skin.** The CORE region is inlined **byte-identical** from `core.mjs`
  (sandpile/cutting-gears idiom; the Node twin asserts parity). Alive on arrival (rAF from frame 0,
  a warmed-up coral bud, first folds in ~3 s). Two heroes: the **crowding dial** (an exponential
  drama curve in the controls layer maps the slider to the engine's `crowding`, clamped to
  `maxCrowding`; dragging reorganizes the SAME organism, never a reseed) and the **stone** (drop /
  drag-through-the-sheet / hold-and-sweep to paint a wall; a soft repeller folded into the engine's
  relax pass, so drape emerges for free; cap 8). Colour-by-age glows the freshly-grown frontier warm.
  Rendered as a **filled, curvature-shaded tissue membrane** (radial wash + per-segment kappa
  shading + a specular crest pass + density-thickened stroke), on a **vellum-on-brass** Orrery
  instrument stage with a fixed brass micro-grid (the room the curve outgrows, shown not stated).
  A quiet readout sparkline shows arc-length climbing past ×7 the room's fixed perimeter; the
  **invariant chip** is the live conscience. Honors `prefers-reduced-motion` (a richly-folded still),
  is DPR-aware, and has no horizontal overflow at any width; graceful render degrade if jank.

- **`core.test.mjs` — the Node twin (25 checks, all green).** (1) invariant holds over 12 000 frames
  across seeds + sizes; (2) discriminating negative controls — a bowtie and a distant-swap fold-over
  are detected, pair matches brute ground truth; (3) hash == brute parity over 72 random + scrambled
  loops; (4) cap holds, arc-length grows in a fixed room (377 → 2757) then bounds; (5) kappa/density
  sanity (regular-polygon kappa ≈ 2π/n; grown loop develops real curvature + density); (6) byte-twin
  parity (index.html CORE === core.mjs CORE).

**Registered:** a 5th live bed on the Conservatory landing (a live coral preview driven by the same
engine; the landing self-test now asserts five beds + the preview curve simple), a PLACES entry on
the front door (`{district:'grounds', tier:2, wing:'conservatory'}`, footprint `glasshouse`), and a
sibling cross-link from the Strange Garden grove (same coral, different rule). Forge current, smoke
ALL LAYOUT CHECKS PASS, sky 73/73, breadcrumb audit 40/40.
