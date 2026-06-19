# tools/layout — CHANGELOG

A log of the grounds-engine swings that change how the estate-plan map is solved,
scored, or pre-checked. (Per-room map declarations are NOT logged here — only
engine/process changes.)

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
