# The Sightline — changelog

A figure no single pose can show; you DRAW it by the ORDER you walk. The vantages
wing's SECOND room (kin to The Vantage). Where The Vantage resolves from one earned
POSE, The Sightline resolves from a PATH.

## #339 — founded (BUILD / grounds — a DEEPEN of the vantages wing)

**The piece.** Twelve opaque gilt slabs hang at staggered depths in a dim vault. At
the home pose they stack into a sealed mutual occlusion — exactly ONE is unoccluded
and the figure does not read. Drag-orbit (yaw/pitch) + scroll/pinch-dolly the SAME
3-DOF vantage camera (no roll). As you fly the solution arc the slabs PEEL off the
stack one at a time, each dropping its star into a FIXED firmament socket high in
the dark and extending one gold stroke. Uncover them in the right order and the
stroke draws "Argo, the little ship" clean; uncover one out of turn and the stroke
leaps to the wrong star — a visible tangle — and the reveal resets. A rising
pentatonic chime kindles with each star and resolves to a tonic chord as the ship
closes (in-house WebAudio, muted by default). Win → the vault brightens, the ship
glows whole, and a crest names the figure (a Cor Caeli echo tying the two rooms).

**The claim (SOLE authority = `core.mjs`).** The camera is The Vantage's, UNFORKED:
`projectNorm()/backProject()` are byte-faithful copies of `vantage/core.mjs`, and the
twin re-imports vantage's own functions to prove ours are numerically identical
(5000 random samples, exact). The room adds ONE layer: a per-frame painter's
depth-sort + point-in-quad occlusion (`exposedSet`) — slab i is exposed iff no
NEARER slab's projected quad covers its projected centre. **The painter's draw you
SEE is byte-for-byte the rule the logic computes** (visual == claim, no cheat). The
unveil permutation σ is BUILT, not searched: the slab field was forward-constructed
by back-projection (the camera's exact inverse) by an offline tuner (seed 1551), so
at START exactly one slab is unoccluded.

**The twin proves, exact (`core.test.mjs`, 22/22; in-page pill 6/6):**
1. `σ` — solution flight C(t) ⇒ σ === the target figure's star-order (SIGMA).
2. `↑t` — all 12 peel at strictly INCREASING t, min gap **0.040 ≥ 0.03** (explicit
   scheduling margin); exactly 1 lit at start, = slab SIGMA[0] (the sealed stack).
3. `∿` — σ UNCHANGED under an ease-in/out reparametrization (+ 4 monotone time-warps):
   the order is the GEOMETRY of the walk, not its speed — the headline of a PATH room.
4. `±ε` — σ holds across an ε=0.02 tube of 300 nearby flights (robust, not knife-edge).
5. `¬a` — NEG-CTRL depth-collapse foil (co-planar slabs) ⇒ 0 ordered reveals ⇒ never fills.
6. `¬b` — NEG-CTRL shuffled-flight: ~0.13% of 4000 random flights reproduce σ — structure
   + the right walk spell the figure, not luck.
Plus the inverse∘forward identity to machine-ε and a byte-parity check tying the
forge-inlined core in `index.html` to `core.mjs`.

**Anti-drift.** `index.html` is forge-built: `<!-- forge:include ./core.mjs -->`
inlines the SOLE authority between the `SIGHTLINE CORE` sentinels, so `forge --check`
trips on any stale page; `core.test.mjs` ALSO byte-parity-checks the inlined block.

**Integration (a DEEPEN, no new wing slug).** Front-door PLACES entry under the
EXISTING `wing:"vantages"` (district observatory, footprint tower, sibling to The
Vantage) → "SCENES YOU WALK INTO" now sits over TWO room cards. Reciprocal in-page
cross-link with The Vantage both ways ("resolves from a PATH ⇄ resolves from a POSE").
One sky star in the observatory band (`tools/sky` `the-sightline` @190,300, beside
the celestial kin). Succeeds the retired Camera Maze (#296) by changing the
content-kind from a word to a figure. Gate falls back to the glyph plinth (no
bespoke rep this cycle — a rep is the foundry's job).

**Files (5):** `core.mjs` (sole camera+visibility authority) · `core.test.mjs` (Node
twin, 22/22) · `index.src.html` (forge source) · `index.html` (forge-built) · this
CHANGELOG.

## #339 — art-foundry wiring pass

The intentional greybox is dressed. Three assets were forged in-house by the art
foundry (K takes → judges → synth) and wired into their `SIGHTLINE-ART` sentinels;
the placeholder language is removed:
- **`slab-material`** (`drawSlab` / `drawEngravedStar`) — solid beveled brass-leaf
  plates with a depth-graded patina (cool green-bronze far → warm yellow-gold near),
  grounded down-facing chamfers for real plate weight, hand-beaten leaf streaks, and a
  contained intaglio star that lights warm when its slab is exposed.
- **`constellation-figure`** (`drawFigureOverlay`) — engraved compass-star glyphs at
  the fixed sockets, a three-pass inked-quill gold connecting stroke laid in ignition
  order (the leading star burns hotter), the won-closure hull + constellation bloom,
  and the red dashed error-bolt + struck-out X on a scramble.
- **`bell-instrument`** (`bell`) — a warm carillon/monochord voice (sub-octave hum,
  clean prime, beating twin, gently-stretched upper partials, falling low-pass) that
  rings the rising pentatonic chime and resolves the closing major chord sweetly.

The dark-vault firmament backdrop stays hand-drawn (it was never a foundry asset).
Verified on a served origin: in-page pill GREEN 6/6, twin 22/22 byte-parity IDENTICAL,
`driveSolution()` ignites all 12 in σ-order and wins, the forged bell unlocks to
`ctx.state==='running'` on the Sound-on click and schedules its voices with no error,
and zero console errors across idle + a 120-move dragged orbit + a 40-step wheel dolly.
Art direction for each asset is preserved in `art-specs/`.
