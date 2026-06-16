# Kirigami — CHANGELOG

*The Gardens · Cutting Table — a touchable room in the glasshouses wing. Fold a paper disc to one
wedge, snip a freehand notch, and unfold to a radial snowflake whose dihedral symmetry you set with
a dial. The estate's first GENERATIVE-by-cutting medium (the dihedral group is the brush, the cut is
the play). Single self-contained `index.html`, zero deps, no `.src.html` twin (so the forge stays
31/31, like `planimeter`/`reckoning`).*

---

## #83 (2026-06-16) — SHIPPED (BUILD/garden cycle, the planter; published fresh-eyes)

**The room.** Pick **Folds** (4/6/8) → press **Fold** (the flat disc collapses into a visible
offset/shaded STACK of N layers) → drag a **freehand notch** across the folded wedge → **Unfold**
(the layers bloom, layer-by-layer, into a radial snowflake that reflects THE VISITOR'S cut). A
different cut yields a different flake — a deeper notch opens a more lacy star — verified by mask
signatures. **Pin / export SVG + PNG** to "The Flurry" keepsake panel.

**Key mechanics.**
- The cut-geometry core is rendered as 2N half-wedges via even-odd fill (sector **minus** notch), so
  the flake is connected & lacy, not asterisk-like: `notchPolygon()` / `keptLocal()` / `foldToWedge()`
  / `keptWorld()` / `proveSymmetry()`.
- **The LIVE DIAL:** changing Folds re-clamps + RE-REFLECTS the same cut into the new Dₙ *live*
  (caption "→ 16-fold", chip "Dₙ · exact ✓") — no re-cut needed.
- The "Dₙ · exact ✓" chip + the optional **"show the mirror proof"** overlay (gold source wedge +
  blue first-mirror + dashed fold-axis spokes) are **ornaments, never gates** — the room clears the
  grounded gate by being *enacted* (a thing you fold, cut, and open), not by a proof.

**The one EXACT claim (single-sourced + self-tested).** `proveSymmetry()` reflects every kept lattice
node through all 2N mirrors and checks membership → **{ok:true, checked:2119, bad:0}**. Verified three
ways: (1) a Node twin inlining the SAME core — 28/28 Dₙ cuts EXACT across N=3,4,5,6,8,10,12 (seed + 3
random cuts each), with a discriminating NEGATIVE control (C₆ with the mirror dropped) that correctly
FAILS the reflection check; (2) in-browser `Kirigami.proveSymmetry()` green at D₆ and after the live
dial to D₈; (3) a real rim-gate float bug found + fixed during the Node twin — a grid node sitting
exactly on the disc rim (`hypot=1.0`) flipped the strict `r > Rₙ` gate under rotation
(1.0000000000000002 vs 0.9999999999999998); fixed with a **1e-9 rim epsilon** (same class as the
existing angle-gate epsilon), in both the page and the twin.

**Registration / wiring.** New `kirigami` PLACES entry in `index.src.html` (→ forged `index.html`):
grounds district, tier 2, glasshouses wing, paper-lilac accent **#c9b6ff**, companion Strange Garden.
Added the kirigami row to `tools/layout/smoke.cjs`. Reciprocal sibling links woven both ways:
Strange Garden ↔ Kirigami ↔ Kaleidoscope ("↗ Kirigami — symmetry you cut").

**Publisher fresh-eyes (this cycle) — shipped clean, nothing real caught.** Served on `127.0.0.1:8743`
(torn down by exact session/PID; Brandon's own servers untouched). Full fold→cut→unfold gesture works
by pointer; `proveSymmetry()` {bad:0} at D₆ AND after the live dial to D₈/16-fold; Pin populated The
Flurry (count 1, thumbnail keepsake); board SVG serializes valid (14 shapes) for export; 0 console
errors · 0 nested anchors · 0 horizontal overflow @1280 AND @390 (mobile stacks clean); front-door POI
renders "KIRIGAMI · fold · cut · unfold" + drops `ws:seen:kirigami`. Adjudicated the builder's 3 open
concerns as NON-ISSUES: glasshouses labels don't collide (106px gap between visible labels — the
earlier "overlap" was hit-area margins); paper-lilac is the sole violet accent in the grounds district
(no glow collision); the DRAW-table renderer gotcha (an undefined `footprint` throws in
`DRAW[r.footprint]`) was already resolved by setting `footprint:"glasshouse"` explicitly. Guard sweep
GREEN: `forge --check --all` 31/31 · `forge --audit-seen` 24/24 · layout smoke ALL PASS.

**A renderer landmine worth remembering** (the builder flagged it; recording it here so it isn't
re-learned the hard way): the front-door page's DRAW dispatch is `DRAW[r.footprint](fg, r)` with **no
default key** — a room that omits `footprint` (even though the layout engine has a district default)
throws a TypeError and the POI silently fails to draw (label/href/POI all absent). Always give a new
room an explicit `footprint`.

**Grow it, don't rebuild it:** more fold geometries, a gallery wall of pinned flakes, a "trace a
famous snowflake" challenge. Don't rebuild the cutting table.
