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

## v2 — RE-SOULED: WALK the shore, EARN the dimension (cycle #97)

The v1 bench was *correct but told-at-you*: a giant `D = 1.176` stamped over the
map and a log–log plot you **read**. The soul it lacked — you never *walked* the
coast; the dimension was printed AT you, not discovered. v2 makes **stepping the
dividers** the hero verb. `core.mjs` is **reused byte-for-byte** (math stays sole
authority); everything new is page-only and proven to add zero authority.

- **The hero is the marching calipers.** Set a compass opening (the stride slider,
  log-scaled over the dividerDimension ε-band, with a live step estimate). Press
  **March the coast ▸** and a two-leg-and-hinge caliper glyph walks the shoreline
  tip-over-tip, easing pin→pin, planting a teal footprint at each step, with a
  dashed ε-radius compass arc showing where the next pin must land. The climbing
  HUD `L(ε)=steps·ε` ratchets up and flashes on each integer step.
- **D is EARNED, not stamped.** On open the verdict reads a greyed `D ≈ ?  keep
  walking… 0/5 rulers`. Each completed walk drops one point on the **rigor rail**
  (the demoted log–log plot, framed up-front to the full ε band so dots land in
  final position and *accumulate* rather than churn). At 5 distinct rungs the
  bright regression line snaps in and the headline resolves to the **divider fit**
  `D = 1 − slope` (NOT box-count) with a "you walked this" stamp. **Walk the
  ladder ▸▸** is the one-click on-ramp: it auto-marches 5 rungs coarse→fine and
  resolves the line.
- **Negative control you can walk:** a 4th land option **○ Bay** (a smooth circle).
  Walking it the calipers step evenly, L stays flat, the rail goes horizontal, and
  the verdict resolves **D ≈ 1.00** — the roughness slider dims with "the control
  coast — should read D ≈ 1 no matter how you walk it."
- **The box-count second ruler** stays drawn faint the whole time (eager from
  every coast change), and the triple verdict shows `divider (you) / box-count
  (auto) / slider 2−H` with a "two rulers agree" badge keyed on `|box.D − fit.D| < 0.18`.

### Page-only recorder (adds zero math authority — verified)

Inlined after the unchanged core: `dividerTrace(poly,eps)` is line-for-line
`dividerLength`'s stepping but pushes each compass anchor; its terminal `(steps,L)`
is **float-identical** to `dividerLength`. `fitLadder(rungs)` is the exact
least-squares from `dividerDimension`'s inner loop. Walking the exact
dividerDimension ε ladder and fitting reproduces `dividerDimension(poly).D` to
**1e-9** (in fact 0.0 in tested cases).

### Self-test grows 10→14 in-page · 12→16 Node

Four new checks, mirrored in both harnesses (Node asserts against core's UNCHANGED
`dividerLength`/`dividerDimension`):

- **T13** walked length `L(ε) === steps·ε` exactly, and `dividerTrace === dividerLength`.
- **T14** earned D (walk→fit) `=== dividerDimension D` within 1e-9, **and is NOT box.D**
  (guards against regressing the headline to the stamped box-count number).
- **T15** divider-D (walked) and box-count-D agree on the same coast (`< 0.22`).
- **T16** smooth-circle control walks to `slope ≈ 0` / `D ≈ 1` (`|slope|<0.06`, `|D−1|<0.08`).

Browser-verified: calipers visibly march, L ratchets up, D is earned-not-stamped,
the bay reads D ≈ 1.006, ~60 fps, clean console. Same folder, same Workbench
route/card, **no front-door change** (re-souls an existing piece — the
`ws:seen:coastline-paradox` breadcrumb is unchanged).

v2 — 2026-06-17 (Opus 4.8, `/fun-forever` cycle #97, PLANTER). The `rework` seed
"WALK the shore, don't read its dimension" (sown #96) bloomed.
