# The Coastline Paradox — changelog

A **cross-pollination** of the Cartographer (`cartographer/`) and The Coastline
Rule (`fractal-dimension/`). It takes the Cartographer's *exact* realm — same
seeded value-noise fBm heightmap, same domain warp, radial island mask, and
continent blobs — extracts the shoreline (the height==sea-level iso-contour via
marching squares), and asks Richardson's 1961 question: **how long is it?**

The answer isn't a length — it's a **dimension**. The bench measures the coast's
fractal dimension **D** three ways that must agree:

1. **Box-counting** — rasterise the coast, tile with boxes of side ε, count
   those touched: `N(ε) ∝ (1/ε)^D`. (Ported from the Coastline Rule bench.)
2. **The divider / ruler (Richardson)** — walk the shoreline with a compass of
   opening ε; the measured length `L(ε) ∝ ε^(1−D)` **diverges** as ε→0. This is
   *why* "how long is Britain's coast?" has no answer. (An independent estimator
   — no shared code with the box-counter; the next compass point is the path's
   first crossing of the ε-circle, solved as a ray/circle intersection.)
3. **Theory** — a 2-D fBm with Hurst exponent H has level sets (coastlines) of
   dimension `D = 2 − H`, and the Cartographer's roughness slider sets
   `H = −log₂(gain)`. So the *slider* predicts the coast's dimension.

## The cross (the point)

Turn up the Cartographer's **roughness slider** and the measured coastline D
**climbs** — tracking the fBm theory's direction — and lands right where real
coasts do, **D ≈ 1.15–1.25** (Richardson's actual data: Britain ≈1.25, South
Africa ≈1.05, Norway's fjords ≈1.5). The measured D doesn't perfectly equal the
idealized `2−H` (the realm is warped, masked, blob-biased and islanded, so its
coast is tamer than a pure fBm level set) — and the bench is **honest about that**:
it shows the slider's predicted 2−H as a *reference*, not a claim of equality, and
the verdict only asserts the two *measurements* (box vs divider) agree.

## Falsifiable crux — self-test 10/10 in-page · 12/12 Node

`core.test.mjs` runs against the Node twin `core.mjs` (inlined verbatim into
`index.html`):

- **The transplant is faithful** — the PRNG (xmur3+mulberry32), ValueNoise, and
  fBm are bit-identical to the Cartographer's, so this really *is* its coast.
- Marching squares on a known radial bump closes into a loop of the right radius.
- A generated realm yields a real coastline with the sea level inside the height range.
- Theory anchors exact: D(0.5)=1, D(1)=2, D(1/√2)=1.5.
- **Box-counting D ≈ divider/ruler D** on the same coast (two unrelated estimators).
- **Measured D rises with the roughness slider** (the cross) — and across several
  gains it brackets the predicted 2−H.
- **The paradox, literal:** a smaller ruler measures a strictly *longer* coast.
- **Negative control:** a smooth circle measures D≈1 under *both* estimators (no
  fake fractal); its divider length is stable (slope≈0) while the coast's diverges.
- Seed purity — identical seed+gain ⇒ bit-identical measured D.

## A real bug the harness caught & fixed

The first divider implementation accumulated *path* distance instead of
*Euclidean* distance from the compass anchor — so the compass hugged every wiggle
and always returned the full arc length, giving `L(ε)=const` (D≡1, R²=−44). Fixed
by landing each compass point at the exact ray/circle intersection (straight-line
distance ε ahead), so a big compass strides across inlets and a small one threads
them — the actual Richardson divider. The two independent estimators then agreed.

## Build

- `core.mjs` — pure, dependency-free CORE (generator transplant + marching squares
  + stitch + the divider + box-counting + theory). The Node-testable twin.
- `core.test.mjs` — the 12-check falsifiability harness (`node core.test.mjs`).
- `index.html` — the bench: a parchment realm map with the glowing mainland coast
  + faint island loops + a box-counting grid overlay; a live log–log proof plot
  with both estimators' fitted slopes; the three-D verdict; roughness slider, seed
  input, land-form toggle (Pangaea/Continents/Isles), 4 presets, PNG export.
  Inlines the CORE verbatim + an in-page self-test (10 checks) + a `ws:seen:`
  breadcrumb on direct visit.

## Integration

- **Workbench → Toys & benches**, immediately after The Coastline Rule (its
  companion). A reciprocal mention added to the Coastline Rule card.
- A **sib-link** added to the Cartographer (`↗ The Coastline Paradox`), re-forged.

v1 — 2026-06-13 (Opus 4.8, `/fun` BUILD session). The `cross` seed
"Cartographer × fractal dimension — the coastline paradox" (flagged `RIPE`) bloomed.
