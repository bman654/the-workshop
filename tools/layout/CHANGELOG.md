# tools/layout — CHANGELOG

A log of the grounds-engine swings that change how the estate-plan map is solved,
scored, or pre-checked. (Per-room map declarations are NOT logged here — only
engine/process changes.)

## 2026-06-30 — The Fairground Gate: the declarative fold (#369, a grounds big-swing)

The estate's first true **detach-into-depth LAYER** — the DEPTH lever this doc's opening section
has long pointed at, now realized as a generic primitive owned by the engine. A wing whose any room
declares `detach:true` folds out of its crowded parent plate into its own `child:<wing>` layer,
reached only by descending through a synthetic in-map GATE FACE. `amusements` is the first caller:
its 15 rides leave a tight ~23px grounds-east column for their own airy child frame.

- **`layout.js`** (+110) — `detachedWings(places)` (pure, reads only `places`); `plateOf` gains ONE
  detach branch before the district/midline logic; `plates(places[, opts])` threads `detached`
  through and adds three GENERAL pieces — a first-class CHILD plate framed from its OWN `relayPlate`
  envelope (exposed in a separate `childLayout` map; canonical `solution.foot` NEVER overwritten, so
  the sky stars + mirrors are unaffected), an auto-emitted parent GATE FACE (furniture, excluded from
  every count), and a generic DESCENT edge (with a no-strand fallback). New return fields: `detached`,
  `childPlates`, `childLayout`, `parentOf`, `gates`. `opts.detachOff:true` = the byte-identical
  NEG-CONTROL.
- **`fold.test.cjs`** (NEW, +339) — the headless Node twin over the live `Layout.plates`, lifted from
  the proven `/tmp/foldsim.cjs` kernel into the smoke.cjs CRUX idiom: F1 BIJECTION across layers
  (86/86) · F2 the descent graph is a TREE rooted at the door (live + a synthetic 2-detached-wing
  fixture) · F3 the C′ flip MEASURED (26/38 ≥ 23) · F4 the NEG-CONTROL (detach OFF stays 21/38 red) ·
  F5 GENERALITY (a different wing detaches the same way).
- **`door-mirror.cjs`** (regenerated headless, the #337 canonical env) — now carries a per-row
  `frame` tag (parent | child:&lt;wing&gt;); the re-anneal from 15 rooms leaving grounds-east moved the
  whole label solve, so the mirror was recaptured.
- **`door.test.cjs`** — the GATE-BROKEN coverage guard extended: the mirror must cover EXACTLY the
  placed POIs across BOTH frames AND each row's `frame` tag must match the live fold (a stale/mistagged
  child box trips exit 2). The live pill now reads PASSABLE 17/17 — CLAIM C′ flipped GREEN because the
  detached amusements rooms declutter at their own airy child frame.

The page wiring (descend/ascend, the gate face + midway + ribbon, the tile re-lay) lives in
`index.src.html`; see `the-fairground-gate/CHANGELOG.md` + the "THE DECLARATIVE FOLD" section of
`map-process.md`. Scope: the LAYER mechanism + the founding amusements detach + the gate/midway/ribbon
art — the 15 bench interiors are untouched.

## 2026-06-21 — More Than One Front Door (#262, a grounds big-swing)

The lone CROWDED front-door plate became a **walkable set of plates** the visitor
travels between — the structural answer to #103's scale pressure (the loupe #212 made
the single plate passable, but did not stop it growing past what one view can ever hold).

- **`layout.js`** (+176) — `Layout.plates(places)`: the pure/deterministic/Node-testable
  partition. A TOTAL + DISJOINT cover (61/61 live rooms → exactly one of 5 plates:
  manor · grounds-west · grounds-east · observatory · outskirts), each plate's camera
  frame (bbox ×1.45, k≤3.2, a min-frame floor so a narrow plate does not over-zoom), and
  the reciprocal inter-plate road graph (manor = hub; W/E share the mid wall; observatory
  shares the NW corner; outskirts → manor). The MANOR plate's bbox is EXTENDED to enclose
  the gated BENEATH slot so the Undercroft rides it (the extension is provably load-bearing:
  un-extended bbox ends y=494, slot centre y=549). `Layout.relayPlate(rooms)`: a plate-LOCAL
  two-column outward-fan re-lay (folly footprints in the centre band, labels fanning L/R to
  the margins over ~85% of FIELD height) — NEVER written back onto `Layout.foot` (canonical
  geometry untouched; `emit-mirror` + `sky.test` stay green).
- **`legibility.cjs`** (+27) — a `{nameOnly:true}` flag drops the wide "PIECE · tag" sub-line
  so a plate's at-a-glance legibility is scored against name-only boxes, plus a per-room
  `relaySide` override to seat the fan. This is the LOAD-BEARING construction rule: a plate
  reads CROWDED at full labels but LEGIBLE name-only.
- **`index.src.html`** (+230) — a PLATES view-state + `walkTo` camera driver over the existing
  panZoom IIFE (a `window.__panCamera.frameTo` hook keeps zoom/pan in sync); a CSS-transition
  `.walking` class (720ms, `transition:none` under `prefers-reduced-motion`); a
  `#threshold-tiles` layer of brass ⌖ chips at each shared-wall road midpoint (both reciprocal
  directions, keyboard-reachable, aria-labelled); a `#platebar` wayfinder naming the plate you
  stand on + its doors + a ↩ back; esc/backspace retreat via a history stack. The loupe stays
  intact WITHIN a plate. Whole module in try/catch → degrades to the static captions plate.
- **`smoke.cjs`** (+114) + **`legibility.test.cjs`** (+81) — a PLATE HARD-PASS section asserting
  all 5 cruxes (total+disjoint cover · per-plate name-only floor < 0.30, worst grounds-west
  0.085 · two neg-controls: 61-on-one-plate 0.950 CROWDED + name-only load-bearing · road graph
  6 edges reciprocal & all 5 reachable · beneath ⊆ manor bbox & extension load-bearing). The
  legacy whole-door 0.914 CROWDED WARNING (#103) is PRESERVED, not defined away. Both twins EXIT 0.
- CRUX 5 FRAMING: the camera bboxes physically OVERLAP in screen space, so "beneath ∈ exactly
  one bbox" is literally false; the asserted falsifiable version is "the WHOLE beneath slot ⊆
  the manor plate's bbox AND the manor extension is load-bearing." The Undercroft demonstrably
  rides the manor plate.

## 2026-06-19 — The Legibility Conscience (a grounds engine swing)

Added an automated **legibility pre-check** to the map pipeline.

- **`legibility.cjs`** (new) — Node-pure, zero external deps. `require`s only the
  repo's own `layout.js` (FIELD, the solve) and `label/label.js` (the renderer's
  EXACT `slotTopLeft` + `nearestEdgePoint` geometry), so the modeled label box +
  leader provably cannot drift from `index.src.html`'s `applyPlacement`.
  - `buildLabelModel(places, solution)` — the ONE shared box+leader model every
    facet consumes (no facet models boxes independently). Boxes seated at the
    prefer-seed START slot; box dims from a measured type-width model
    (CHAR_W_NAME 8.4, CHAR_W_SUB 6.8 — the calibrated getBBox values).
  - Three owned sub-scores reading the shared model: `gapSubScore` (pairwise
    label↔label + label↔non-owner-footprint, quadratic penalty, worst-K soft-max),
    `leaderClutter` (proper segment crossings + Liang-Barsky footprint intrusions),
    `densitySubScore` (per-district Gaussian kernel peak — the proven backbone,
    roll-up = MAX over districts).
  - `score(solution, places)` — composite `0.5·gap + 0.3·density + 0.2·leader` per
    district AND overall, against THRESHOLD 0.30 derived from clean/crowded controls
    after the weights were fixed. Report carries BOTH count-hottest (max raw n) and
    pressure-hottest (max composite) — the honest reconciliation.
  - `renderAscii(report)` — PURE terminal heat-map (FIELD downsampled to a
    48×18 kernel-density grid over the real claim centroids + a sorted-by-composite
    footer), shaded ` ·:+*#@`.
- **`legibility.test.cjs`** (new) — GREEN (exit 0). Proves the four claims off ONE
  shared control corpus (clean PASSES, crowded FAILS, density AND composite are
  monotone across an add-rooms sweep, threshold derivation asserted) plus the
  falsifiable exact-integer crossing-counter unit proofs and a renderAscii smoke.
- **`smoke.cjs`** (wired) — after the structural suite, reads the LIVE 37-POI PLACES
  from `index.src.html` (faithful room/piece/tag) and prints the legibility report +
  heat-map as a clearly-labelled WARNING section. EXIT-CODE POLICY: the legibility
  verdict NEVER counts toward the structural `fail` / exit code. The live door is
  EXPECTED to fail the threshold (composite ≈ 0.82, CROWDED) — the intended
  confirmation of #103; failing structural CI on a known-open issue would break
  every unrelated cycle. Pressure-hottest = manor; count-hottest = grounds — two
  concrete targets for a pending [map] re-draw.
- **`map-process.md`** — documents the new pre-check (what it measures, that it is a
  modeled-label PROXY not rendered pixels, how to tune the threshold).
