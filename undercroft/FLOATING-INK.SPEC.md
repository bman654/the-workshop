# 🌊 The Floating Ink — SPEC (mathematical marbling: suminagashi · ebru)

*A seeded generative **marbled-paper press**. From a seed it floats ink on water and combs it into
the classic patterns — concentric **suminagashi** rings, mottled **stone**, wavy **gel-git**, the
iconic fine-combed **non-pareil**, **bouquet** flowers, and spiral **vortex** snails — then lays the
sheet onto paper. Seed-reproducible, palette-only restyling, PNG export.*

**The new medium:** generative **fluid-ink art** (aqueous surface marbling). Distinct from everything
in the workshop — it's neither a living animation (Strange Garden) nor a seeded *symbolic* generator
(maps/skies/type/script). It is the deformation of floating ink by exact fluid-displacement maps.

**Home:** a **hidden Undercroft secret** (a new visual medium, joining Rosette). File:
`undercroft/floating-ink.html`. Self-contained, vanilla HTML/CSS/JS, no deps, no network, < 1000 lines.
Trigger (wired separately in `undercroft/index.html`): **`ws:seen:cartographer` ∧ `ws:seen:scriptorium`**
— *"Float the scribe's ink upon the mapmaker's sea."*

---

## 0. The correctness crux (workshop tradition — a built-in self-test)

Every workshop piece has a *verifiable gate* (Orrery's real planetary positions, Ariadne's true
over-under, Blazon's faithful blazon, the CA self-tests). For marbling it is the **mathematics of the
ink-drop**, which must be implemented exactly.

The foundational operation is the **ink drop**: injecting a disk of ink of radius `r` at center `C`
displaces all existing ink radially outward by the map

```
P' = C + (P − C) · sqrt(1 + r² / |P − C|²)
```

In polar coordinates about `C` this is `d ↦ d' = sqrt(d² + r²)`, angle unchanged. Its Jacobian
determinant is **exactly 1 everywhere except the singular point `d=0`**, where the single point `C`
is "opened up" into the new disk of radius `r`. Consequences that the self-test must verify:

- **(A) Smooth area-preservation.** A region *not* containing `C` keeps its area *exactly* under the
  drop (det = 1). Test: a disk polygon centered at `Q ≠ C`, with `Q` well outside the new drop, has the
  same shoelace area before and after `Drop(C, r)` (within 0.5%, the polygon-discretization tolerance).
- **(B) The injection identity.** A region *containing* `C` grows by *exactly* the injected disk area
  `πr²`. Test: a disk polygon of radius `R` centered *at* `C` encloses area `πR²` before, and
  `π(R² + r²)` after `Drop(C, r)` — i.e. it grew by `πr²` (within 0.5%). Equivalently its boundary,
  initially at radius `R`, maps to radius `sqrt(R² + r²)`.
- **(C) The radial identity, analytically.** For sample distances `d ∈ {10, 50, 200, 500}`, the mapped
  radius equals `sqrt(d² + r²)` to within `1e-9`. (Nails the formula, no discretization error.)

This trio rigorously proves the drop is correct *and* has the physical area-preserving property of
incompressible fluid injection. **This is the headline check** — log it prominently.

The full self-test (run once on load; log `PASS/FAIL` per check to console; show a small `✓ self-test`
chip in the UI when all pass):

1. **Drop area-preservation** — checks (A), (B), (C) above.
2. **Seed reproducibility** — building the recipe + final vertices for the same seed twice yields an
   identical geometry **fingerprint** (a cheap hash of all vertices rounded to e.g. 0.01 px).
3. **Palette / style invariance** — same seed, two *different palettes* → **identical** geometry
   fingerprint (palette only assigns colors; geometry is seed-pure). *(Exactly the Firmament/Daedalus/
   Blazon style-invariance crux.)*
4. **Finiteness** — after a full recipe, every vertex is a finite number (no `NaN`/`Inf`). (Ink may
   overflow the tray — points off-canvas are fine — but must be finite.)
5. **Tine correctness** — a point *on* a tine line shifts by exactly `u·t̂` (since `z^0 = 1`); a point
   far from the line shifts ≈ 0 (`z^d → 0`).

If any check fails, the deputy must fix the engine before shipping — do **not** ship a red self-test.

---

## 1. Coordinate model & ink representation

- A **bath** of logical size `W × H` (suggest a pleasing sheet, e.g. **1100 × 850** landscape, the
  proportions of a marbled endpaper; render to a `<canvas>` scaled by `devicePixelRatio` for crispness).
- **Ink = a back-to-front stack of "drops".** Each drop is a closed **polygon** (the *boundary* of one
  color region) plus its color index:
  ```
  drop = { ci: <palette ink index>, pts: [ {x,y}, … ] }   // closed; last implicitly joins first
  ```
- The **ground** (the size/bath surface) is a solid fill behind the whole stack.
- A new drop floats **on top** (pushed to the end of the stack); every prior drop is **deformed** by
  the new drop's displacement map. This is exactly how real marbling layers: later ink sits atop and
  shoves earlier ink aside.
- Use **~256 points** per fresh drop circle. Optional polish: after operations that greatly stretch an
  edge, subdivide edges longer than ~8 px so deformed boundaries stay smooth (Jaffer's adaptive
  refinement). 256 base points already looks good on screen; subdivision is a nice-to-have.

---

## 2. The operations (each transforms **all** existing vertices; Drop also appends a polygon)

Implement these as pure functions over the drop stack. **All randomness comes from the seeded RNG**
(see §5) — never `Math.random()`.

### Drop(C, r, ci)
1. Transform every existing vertex `P` of every drop:
   ```
   dx = P.x − C.x;  dy = P.y − C.y;  d2 = dx*dx + dy*dy
   if (d2 < 1e-6) { /* P is the center; nudge to avoid div-by-zero */ d2 = 1e-6 }
   f = sqrt(1 + r*r / d2)
   P.x = C.x + dx*f;  P.y = C.y + dy*f
   ```
2. Append a new drop: a closed circle polygon of radius `r` centered at `C` (256 pts), color index `ci`.

### Tine(B, t̂, u, z)  — a single comb tooth / stylus line
`B` = a point on the line; `t̂` = **unit** drag direction (along the line); `n̂` = unit normal to `t̂`;
`u` = drag magnitude; `z ∈ (0,1)` = sharpness (per-pixel decay). For every vertex `P`:
```
rel = P − B;  d = |rel · n̂|            // perpendicular distance to the line, ≥ 0
shift = u * pow(z, d)                   // = u at the line; decays with distance
P = P + t̂ * shift
```
Drags ink **along** the line, the drag dying off with perpendicular distance — the elemental comb move.

### Vortex(C, θ0, z, scale)  — a stylus swirl (snail / girdap)
For every vertex `P`: rotate it about `C` by an angle that decays with distance:
```
rel = P − C;  d = |rel|;  ang = θ0 * pow(z, d/scale)
P = C + rotate(rel, ang)
```
*(Not part of the area-preservation self-test — the radius-varying angle introduces a shear. Visually
lovely; keep it for the Vortex recipe only.)*

### Comb helper (build from Tine)
```
comb(axis, x0, count, spacing, t̂, u, z):  for k in 0..count-1, Tine(point on line k at axis position x0+k*spacing, t̂, u, z)
```
A "comb" is just a family of **parallel** tine lines `spacing` apart, all dragging the same way.

---

## 3. Recipes (seeded op-sequences — the user picks one, or "Surprise me")

Each recipe is a function `(rng, params, palette) → opList`, then the engine applies the ops in order.
All positions/sizes/counts are drawn from `rng`. Tune for beauty; these are the canonical structures:

1. **Suminagashi (rings) 〇** — the Japanese minimal style. Repeatedly drop *alternating* colors at one
   slowly **drifting** center (small jitter each time) → concentric rings. 10–24 drops, radii ~6–14 px.
   Finish with a gentle breath: one low-`u` Tine, or a slight overall lean (one wide-`z` Tine), to fan
   the rings. Best with the **Sumi** palette (ink-black + indigo on cream). No heavy combing.

2. **Stone / battal ▦** — the mottled Turkish **ground**. Scatter many drops (40–120) of several inks at
   random positions, radii ~10–40 px, across the whole bath, possibly in waves (a few "sprinkle" passes).
   No combing. This is the base ground most ebru is built on.

3. **Gel-git (back-and-forth) 〜** — Stone ground, then a **vertical** comb dragging up, then a second
   vertical comb dragging **down**, offset by half a spacing → the classic wavy vertical chevrons.

4. **Non-pareil ⋰** — Gel-git, then a **fine horizontal** comb (close spacing, e.g. W/40) → the iconic
   feathered "non-pareil." The signature marbling look; make this one sing.

5. **Bouquet / çiçek ✿** — Stone ground, lightly combed (one soft pass), then 3–7 deliberate larger
   "flower" drops; through each, draw a short stylus stroke (a small-`u` Tine or short Vortex) to pull
   petals — tulips & carnations. The painterly Turkish style.

6. **Vortex / girdap �­❍** — Stone ground, then 1–3 `Vortex` swirls of varying strength/handedness →
   spiral, nebula-like marbling.

The **seed** also picks (when "Surprise me") the recipe, palette, and all parameters, so a bare seed
reproduces a complete sheet. Expose sliders for **Drops**, **Comb fineness**, **Swirl** that nudge
`params` (still seed-deterministic given slider values).

---

## 4. Palettes (ground + 3–5 inks — refine hexes for beauty)

Geometry is palette-independent; a palette is just `{ ground, inks:[…] }` assigned to ink indices.
Offer ~6 historical sets:

- **Ottoman** — ground `#efe7d4`; inks indigo `#27407b`, crimson `#9b2230`, saffron `#d8992a`,
  sap-green `#3f6b3a`, ivory `#f3ead2`.
- **Sumi** *(suminagashi)* — ground `#f1ece0`; inks ink-black `#15130f`, indigo `#2a3d63`, slate `#6b7280`.
- **Antique endpaper** — ground `#e8dbbf`; inks burgundy `#6e2230`, gold `#b78a32`, teal `#2f5d57`,
  cream `#efe2c4`.
- **Peacock** — ground `#0f1b22` (dark); inks teal `#1f8a8a`, peacock-blue `#1f5fa8`, emerald `#2fa05a`,
  gold `#d4a531`.
- **Spanish wave** — ground `#efe7d4`; inks vermilion `#c2402f`, cobalt `#2a4f9b`, ochre `#cf9a3a`,
  cream `#f2e8cf`.
- **Nightfall** — ground `#0c0e1a` (dark); inks indigo `#3a4ea8`, violet `#7a52c0`, silver `#cdd6e6`,
  pale-blue `#5f86c4`.

---

## 5. Seeded RNG & fingerprint

- A small deterministic PRNG seeded from the seed integer (**mulberry32** or **xmur3+sfc32** — copy the
  pattern other workshop pieces use). All recipe choices/positions/sizes draw from it. **No `Math.random()`.**
- **Geometry fingerprint** (for self-test #2/#3): iterate every drop's `ci` is *excluded*; hash the
  rounded vertices (e.g. FNV-1a over `round(x*100), round(y*100)` for all points, in stack order). Same
  seed+recipe+slider values ⇒ identical fingerprint regardless of palette.

---

## 6. Rendering & UI

**Render:** fill the ground; then fill each drop's polygon in stack order (painter's algorithm) with its
ink color. A hairline ink edge or very subtle inter-layer definition is OK (real ebru edges are crisp).
Add a faint **paper grain** (low-opacity pre-rendered noise) and a soft **vignette / deckle edge** to
sell "laid onto paper." Render the static final image once; it's cheap (tens of thousands of points).

**Optional formation animation** (`▶ watch it form`): replay the recipe — drops bloom (`r: 0→r`),
combs sweep — by applying ops incrementally and re-rendering, ≤ a few seconds, then settle on the exact
deterministic final frame. **Respect `prefers-reduced-motion`** (skip straight to final). *The static
seeded sheet is the must-have; the animation is polish.*

**UI** (match the workshop's dark glass-panel aesthetic; copy the control/panel styling and the
`<a class="back" href="index.html">← the undercroft</a>` back-link from `undercroft/rosette.html`):
- Title **The Floating Ink** · sub *suminagashi · ebru*; a one-line provenance.
- Controls: **Seed** (shown, editable) + **⟳ re-roll**; **Recipe** select (the 6 + "Surprise me");
  **Palette** select; sliders **Drops / Comb fineness / Swirl**; **▶ watch it form**; **Save PNG**
  (render at 2× to an offscreen canvas → download). Show the seed so any sheet is reproducible.
- Show the `✓ self-test` chip when all 5 checks pass.

**PNG export:** offscreen canvas at 2× logical size, re-run the render, `toBlob` → download
`floating-ink-<seed>.png`.

---

## 7. The unlock breadcrumb (copy-paste from UNLOCK.md)

Near the end of the script — silent, harmless if storage is off:
```js
/* ws: unlock breadcrumb — see /UNLOCK.md. Records first-visit of this hidden piece. */
(function(){ try{ var k='ws:seen:floating-ink';
  if(!localStorage.getItem(k)) localStorage.setItem(k,String(Date.now())); }catch(e){} })();
```

---

## 8. Acceptance (the deputy must verify in a real browser before shipping)

- All **5 self-test checks PASS** (esp. the area-preservation trio) — console + UI chip green.
- All 6 recipes render coherent, beautiful sheets across multiple palettes (screenshot several).
- **Seed reproducibility**: same seed → identical sheet (re-roll to a seed, reload, compare).
- **Palette invariance**: switching palette recolors only — geometry unchanged.
- **60 fps** on any formation animation; **0 console errors/warnings**; no memory growth over ~30 re-rolls.
- PNG export downloads a crisp 2× image.
- The `← the undercroft` back-link works; the `ws:seen:floating-ink` breadcrumb fires (check
  `localStorage` after load on a served origin).
- Self-contained: no network requests, no external assets, vanilla only, < 1000 lines.

> Background reading the deputy may skim: Aubrey Jaffer, *"Mathematical Marbling,"* IEEE CG&A 2018 —
> the source of the Drop and Tine maps (do **not** fetch it; the formulas you need are all in §0–§2).
