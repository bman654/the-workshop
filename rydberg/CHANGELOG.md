# The Rydberg Constant — CHANGELOG

⚛ *the atom & its quantum jumps* — a Workbench → Computation piece: a touchable Bohr
atom whose electron you pluck up an orbit and watch fall to **n=2**, firing a **Balmer
photon** that streaks across one canvas to paint its line on a spectral plate while the
matching **−R/n² energy-staircase** rung-gap lights in the same colour. Read the Rydberg
constant **twice** — geometrically off the staircase rungs, statistically off the blind
line-fit — on one gilt CODATA mark. A `[cross]` of **The Plumbline** 📐 × **The
Spectroscope** 🌈 (the Computation group, the card after The Plumbline); the original
blind line-fitter that reads R off four smudged lines is **demoted, kept byte-exact**, in
a quiet drawer. Slug `rydberg/`. Standalone Workbench page → **ws:seen EXEMPT**
(DESIGNING §4/§47). *(Was, through v1.1, a `read off starlight` regression bench — a
1/λ-vs-u=1/n² scatter + a wall of fitting stats; re-souled into the atom at v2 below.)*

---

## v2 — the atom & its quantum jumps (2026-06-27, cycle #353 — a `[rework]` re-soul)

**Why re-soul.** v1 delivered R off a regression SCATTER while the thing the constant is
MADE of — the atom, its 1/n² energy ladder, the photons it fires — showed only as static
lines feeding dots. A vivid caption couldn't lift an abstract chart over the **grounded
gate**, so the `[rework]` (sown #348) made the atom + its quantum jumps the touchable
hero and DEMOTED the regression rather than gutting it.

**The stage** — one full-stage canvas, one rAF loop, one coordinate space, all procedural:
- **LEFT — the −R/n² energy staircase.** E=0 series limit (gilt) at top, rungs n=3..6
  crowding upward, the bold gilt **n=2 Balmer floor** at bottom, n=1 hinted off-plate
  (→ ultraviolet / Lyman). When a photon lands, the matching rung-GAP lights in the
  photon's true colour with its floating 1/λ.
- **CENTER — the Bohr atom (hero).** A warm gilt proton-nucleus, nested orbits r∝n²
  (slate), a chalk-white electron riding its orbit with a motion-trail, a seeded
  starfield. Click an outer orbit → the electron tweens UP, holds/glows, then DECAYS to
  n=2 and fires a Balmer wave-packet streaking RIGHT across all regions seamlessly.
- **RIGHT — the spectral plate.** Starts BLANK; photons paint Hα 656 (red) · Hβ 486
  (cyan) · Hγ 434 (blue) · Hδ 410 (violet) at true `wavelengthToRGB` colour, brightness ∝
  accumulated hits, crowding toward the marked 364.6 nm series-limit edge (mirroring the
  staircase). Plate-line brightness and rung-gap brightness share ONE `acc[n]`, so **the
  lit rung-gap === the painted line** is structural, not decorative.

**Interaction.** Click an orbit · FIRE ALL FOUR · AUTO/rain toggle · RESET PLATE · an
optional WebAudio chime (default-muted, gesture-unlocked, honours the estate-wide
`ws:pref:muted`; pitch ∝ c/λ). `prefers-reduced-motion` ⇒ instant-fill, no streaks
(electron + starfield frozen too).

**The two-readings payoff** (the reused `.twice`/`.agree` card): **R-from-the-STAIRCASE**
(`rFromLadder`, geometric/exact) vs **R-from-the-REGRESSION** (`−fitL2(seeded points).m`,
statistical) on one gilt CODATA mark — two code-disjoint computations, one constant. The
whole v1 regression machinery (σ slider, seed stepper, L2/L1, the vacuum/air +277 ppm
trap, the ±t·SE band, R², ppm, the old `−slope === 4·intercept` consistency check) is
**demoted but kept BYTE-EXACT** inside a collapsed `<details>` drawer with its own shrunk
scatter plot — nothing was gutted.

**New crux legs** added to `rydberg-core.mjs` (pure helpers `termValue` / `rungDrop` /
`rFromLadder` + their self-test legs, exported): **(e) photon law** — for n=3..6 the n→2
rung-DROP `termValue(2)−termValue(n)` equals the photon wavenumber 1/λ AND `R_H(¼−1/n²)`
to machine-ε (the lit rung-gap === the painted line === the law, a render-faithfulness
check, not a tautology); **(f) two readings** — `rFromLadder` === `−slope` of the blind
fit to <1e-9 and === R_H to <1e-12; **(g) neg-control** — a wrong-floor **Lyman**
`R_H(1−1/n²)` jump lands OUTSIDE the Balmer plate window and matches no Balmer line.

**Verification (this cycle).** Node twin `node rydberg/rydberg-core.test.mjs` → **18/18
PASS** (the 3 new legs picked up by `runSelfTest`, now 8/8 in-page; byte-twin char-for-char
16304 chars identical; spectroscope byte-twin intact; anti-circularity grep clean).
In-browser (publisher fresh-eyes, served `:8791`, agent-browser session `pub353`): pill
GREEN **`the atom emits R ✓ 8/8`**, 0 console errors, idle render + live orbit-click excite
(a single pointerdown on the n=4 ring fired one violet photon onto the plate) + FIRE ALL
FOUR cascade (plate painted Hα/Hβ/Hγ/Hδ, staircase rung-gaps lit in matching colours) +
regression drawer expands with its scatter + fit line + t·SE band + gilt intercept whisker;
**no horizontal overflow at 1400px OR 390px** (mobile layout clean and legible). `forge
--check --all` all 110 files current. The reciprocal teaser in **The Spectroscope** was
re-souled to *→ The Rydberg Atom*; the **Workbench** card re-souled (⚛ glyph, new
kind/blurb).

---

## v1 — the constant, twice (2026-06-14, cycle #25 of the fun-forever loop)

**The claim.** The Balmer law `1/λ = R_H(¼ − 1/n²)` is a STRAIGHT LINE in the
coordinates `u = 1/n²` (x) and `y = 1/λ`. Its slope is `−R_H` and its intercept at
`u=0` (the series limit `n→∞`) is `R_H/4`. So a fitter that knows no atomic physics
— only "minimise Σ(vertical residual)²" — recovers the Rydberg constant **twice**
from four points, and the two readings must agree by algebra (`−m == 4b`). What is
PROVEN is exact and conditional (given the four wavelengths + squared loss, the
line is forced); the physics R_H is **imported, never re-typed**.

### Single-source discipline — the constant is graded against itself
The new physics lives in `rydberg-core.mjs` (the sole authority). It **imports**:
- `RYDBERG_H, balmerWavelengthNm, balmerWavelengthAirNm` from
  `../spectroscope/spectroscope-core.mjs` — so the constant the fit RECOVERS and
  the constant it is GRADED against are **one value, never a copy**;
- `fitL2, gdFit, fitL1, makeRng, gauss` from `../plumbline/plumbline-core.mjs` —
  the SAME Σr² minimum that fits any noisy cloud reads R off four smudges.

**Anti-circularity grep (the Demon-grade proof, grep-clean):** `rydberg-core.mjs`
source contains NONE of `1.09677` / `1.0973731568` / `1.000277` — those digit-literals
live ONLY in the imported spectroscope module. The Node twin asserts the grep AND
asserts **value identity**: `rydberg-core`'s `RYDBERG_H === spectroscope-core`'s.

### STEP 0 — the spectroscope single-source extraction (touches a shipped bench)
The Spectroscope had no module (its constants were inline `var`/`function` at
`spectroscope/index.html:225–248`). Extracted **`spectroscope/spectroscope-core.mjs`**
exporting `{RYDBERG_INF, M_PROTON, M_ELECTRON, RYDBERG_H, N_AIR, balmerWavelengthNm,
balmerWavelengthAirNm}` VERBATIM, wrapped the existing inline block in the page with
`// ===== SPECTROSCOPE PHYSICS CORE (inlined byte-twin) BEGIN/END =====` sentinels
(now a **byte-twin** of the module, parity-checked by the rydberg Node twin), and
added a **byte-twin parity self-test** to the spectroscope's `runSelfTest` (a fresh
3-line CODATA re-derivation). The spectroscope's pill went **7/7 → 8/8** (the 7
existing checks still pass; +1 parity). R_H is still **computed** from the 3 CODATA
inputs + reduced-mass formula — never hard-coded.

### The four legs — ONE shared core drives the in-page pill (5/5) and the Node twin (15/15)
`rydberg-core.mjs` owns `buildPoints`, `fitL2SE` (the standard-error math), and
`runSelfTest()`. The page inlines a **byte-twin** of it between
`// ===== RYDBERG CORE (inlined byte-twin) BEGIN/END =====` sentinels (Option A —
plain `<script>`, no `type="module"`, the plumbline house pattern: the page also
inlines byte-twins of the plumbline core + the spectroscope physics block so all
imports resolve in one script). The Node twin re-extracts every slice and asserts
char-for-char parity with each module.

- **(a) NOISELESS IDENTITY (collinear, teeth-less).** On the vacuum points
  `fitL2.m == −R_H` and `fitL2.b == R_H/4` to ≤1e-9 rel (measured −1.7e-16);
  `|(−m)−4b|/R_H == 0` (bit-identical); R²=1, Σr²=5.4e-20. Named with
  "identity (noiseless, teeth-less)" so a pill-scanner can't read it as the headline
  — R²=1 is **geometry**, not yet a measurement.
- **(b) TWO SOURCE-DISJOINT ORACLES.** `gdFit` (gradient descent) ≡ `fitL2` (closed
  form) on the same noiseless points to ≤1e-8 (measured Δm=5.6e-9, the tiny u-values
  make Σx² small so b mixes slowly); `fitL2.toString()` names no `gdFit`,
  `gdFit.toString()` names no `Sxy` (source-disjoint).
- **(c) NOISY RECOVERY — THE HEADLINE, with the t-band.** Seeded Gaussian·σ noise on
  the 1/λ's. Over 2000 seeds (pill) / 20000 (Node) at `noiseFrac=0.001`: R̂ is
  UNBIASED (<0.002%), and coverage uses **Student-t(2), NOT ±1·SE** — fraction within
  `t68·SE` = 68.3%, within `t95·SE` = 94.8% (measured @20k). The decision that mattered:
  with **n=4 points and 2 fitted params there are 2 d.o.f.**, so the t-tails are FAT —
  a naive "68% within ±1·SE" claim WOULD FAIL (±1·SE covers only 57.5%). The UI's
  prediction band and "outside band" failure state use the SAME t·SE.
- **(d-i) TEETH — outlier lurch.** Yank interior **Hγ (n=5)** by ×1.20: L2 lurches
  +21.1% off R while robust **L1 holds +0.00%**; control: no outlier ⇒ collinear ⇒
  L1 == L2. (Yanking Hα is allowed but pops an honest note — with only 4 lines even
  L1 can't ignore a high-leverage anchor; the lesson lives at an interior line.)
- **(d-ii) TEETH — the air trap.** Feed AIR wavelengths (noise 0): R shifts by
  exactly `(n_air−1)` = **+277.00 ppm** on BOTH `−m` and `4b`, yet **R²≈1** — air
  rescales every 1/λ by n_air so the points stay collinear; a 277-ppm systematic
  hides under a flawless, self-consistent fit. **Consistency ≠ correctness.**

### The two-panel stage (form expresses content — light → number)
The stage SPLITS into two canvases joined by a thin **conduit** gutter, driven by
**ONE shared state → ONE `measuredPoints()` array → ONE ResizeObserver + ONE rAF +
ONE draw() spine** (`drawPlate → drawPlot → drawConduit → updateReadouts`; never two
animation loops). "One number" is made structural: the plate draws each line at the
**jittered** λ matching its `1/λ_meas`, the plot draws the dot at `(u, 1/λ_meas)` —
same array, same jitter.
- **LEFT · the spectral plate** (`#050507`, spectroscope idiom): four Balmer lines in
  TRUE colors via `wavelengthToRGB` (Hα red, Hβ cyan, Hγ/Hδ violet), soft `lighter`
  glow + bright core, a faint dotted **vacuum-truth ghost tick** so the jitter is
  visible as the core sliding off its ghost.
- **RIGHT · the 1/n² plot** (plumbline grammar, NOT equal-aspect — incommensurable
  units): `xDom=[0,0.125]` so the **u=0 intercept is on-screen** (half the headline);
  the u-axis is annotated BOTH ways (`0.1111 → 1/9 · n=3` … `0 → n→∞ (limit)`); a
  translucent slate **t·SE prediction band** + a gilt **u=0 whisker** spanning
  `4·(b ± t·SE_b)` (the second R as an interval). Band tightens to a hairline at σ=0.
- **the CONDUIT**: hovering a plate line OR its plot dot gilds BOTH (brass halo) and
  draws a curved light-pipe in that line's true color fading to slate — **light
  becoming number**; four faint always-on threads as the on-ramp.

### Controls + the payoff
One knob drives everything: a **noise-σ slider** (0…0.012, clamped so the worst Hα
jitter keeps λ inside [380,750]); a reproducible **seed** readout + ◀▶ steppers +
🎲 new-draw (LCG) + a **copy-state** chip serializing
`medium|noiseFrac|seed|loss|outlierN|outlierFac|bandK` to the URL hash (shareable AND
pins the exact draw); an **L1|L2** toggle + click-a-plate-line-to-yank outlier; a
**vacuum|air** toggle (+277 ppm air note); a **68%|95% t-band** selector. The side
panel's **"THE CONSTANT, TWICE"** card shows R from −slope, R from 4·intercept, an
agreement number-line centered on the imported R_H, and "recovered R ± t·SE" — which
turns bad-color and reads "recovered R outside its own band" when R̂ leaves its t95
band (the honest failure shown, not hidden). Green/red are reserved for the self-test
pill + that legitimate failure only.

### Files
- `rydberg/index.html` — the page (Option A inline byte-twins of plumbline-core +
  spectroscope physics + rydberg-core; the two-panel stage + in-page 5/5 pill).
- `rydberg/rydberg-core.mjs` — the sole authority for the NEW physics
  (`buildPoints`, `fitL2SE`, `recoverR`, `runSelfTest`, the dof=2 t-constants).
- `rydberg/rydberg-core.test.mjs` — the Node twin (15/15: the four legs + 20k-seed
  coverage + air-ppm + identity + σ-pattern stability + truth-source value identity +
  anti-circularity grep + BOTH byte-twin parity checks).
- (touched, single-source) `spectroscope/spectroscope-core.mjs` (NEW extraction) +
  `spectroscope/index.html` (sentinels + parity test, 7/7 → 8/8).
- (touched, cross-cards) `plumbline/index.html`, `spectroscope/index.html`,
  `workbench/index.html` (the rydberg card in Computation).

### Verified
Browser (uniquely-named agent-browser session): in-page pill **5/5 ✓**, **0 console
errors**, **~60fps** (16.67ms/frame avg under a noise-sweep), **0 horizontal overflow
at 1280px AND ~390px** (the topbar/self-test-pill mobile trap that bit Carnot/Hydrogen
— brand collapses ≤430px, pill stays visible). Air trap, outlier teeth, t-band toggle,
seed steppers, copy-state, URL round-trip, and the hover recognition moment all
confirmed live. Node twins: rydberg **15/15**, plumbline **35/35** (its core untouched,
parity intact), spectroscope **8/8**.

### v1.1 — publisher polish (cycle #25, same day): narrow-screen u-axis ticks
The fresh-eyes review caught the open concern the builder flagged: on a ~390px phone
the four u-axis tick labels (`0.0278 0.0400 0.0625 0.1111`) and the gilt `(limit)`
label crowded/overlapped near the left edge. Fixed in `drawPlot` with a **measured
overlap guard** (no hardcoded breakpoint): the ticks are walked LEFT→RIGHT and each
numeric/sub label is drawn only if its measured box clears the right edge of the last
KEPT label (both running boundaries seeded from the `(limit)` label's right edge).
At 1280px all four labels + sub-labels show; at 390px the crowded inner labels thin
gracefully (the leftmost, nearest `(limit)`, drop first) leaving `(limit) … 0.0625
0.1111` legible with the `1/16·n=4` sub-label, no overlap. This touches ONLY render
code OUTSIDE the rydberg-core sentinels — both byte-twin parity checks + the in-page
5/5 pill + the rydberg 15/15 Node twin re-verified GREEN after the edit.
