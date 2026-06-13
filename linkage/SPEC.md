# The Straightedge — SPEC

A planar-**linkage** drawing bench. Fixed pivots, rigid rods, pin-joints; turn a
crank and the pen draws. The hero — the **Peaucellier–Lipkin** linkage (1864) —
converts pure circular motion into a **mathematically exact** straight line. A
**four-bar** companion traces a rich coupler curve as a deliberate foil.

A genuinely new genre for the workshop: **kinematics / planar mechanisms**.
Single file, zero dependencies, zero network, **no audio**.

---

## §0 — THE CRUX (the one thing this piece exists to prove)

> **A linkage of nothing but pin-joints and rigid rods can draw a *perfectly*
> straight line — not an approximation, but straight to machine precision —
> using only a turning crank as input.**

The Peaucellier pen's locus, fit to its best straight line, has a **maximum
perpendicular deviation of ≈ 5e-15 units** (machine epsilon at this scale). That
single number is the headline: it is *exact*, not "good enough." Before
Peaucellier (1864), every "straight-line" linkage — Watt's, Chebyshev's,
Hoeken's — was only **approximate**: the path is an algebraic curve that merely
*hugs* a line over a short arc and visibly bows away beyond it. Peaucellier's was
the first to be provably, identically straight, and the proof is *inversive
geometry*, not luck.

### The mechanism

- A **fixed pivot O** (the inversion centre).
- Two equal **long bars** from O: `O–A` and `O–B`, each of length **L**.
- A **rhombus** `A–Q–B–P` of four equal bars of length **ℓ** (`P` and `Q` are
  the rhombus's opposite corners; `A`, `B` the others).
- A **crank** of length `r` about a second fixed pivot **C**, driving the joint
  **Q** around a circle. For the straight line we require **|OC| = r** exactly,
  so Q's circle *passes through O*.

### Why the line is exact

By the rhombus + long-bar geometry, O, Q, P are always **collinear**, and

```
|OP| · |OQ| = L² − ℓ²   (a constant)
```

i.e. **P is the circle-inverse of Q** in the circle of radius √(L²−ℓ²) about O.
Inversive geometry's key fact: *the inverse of a circle passing through the
centre of inversion is a straight line.* Q rides a circle through O, so its
inverse P rides an **exact straight line**, perpendicular to OC. Pure rotation
in → exact translation out.

### Why it's honest

Every claim is checked by the **same pure kinematics core** (`tools/linkage/linkage.js`)
that the page renders with — no parallel "test-only" math. The Node test
(`tools/linkage/linkage.test.cjs`) and the in-page green chip call identical code.

---

## The provable claims (self-test, 14/14)

1. **Peaucellier draws an EXACT straight line.** Sweep the crank across its
   closeable arc, collect the pen locus, fit a line, assert the max
   perpendicular deviation `< 1e-9` (observed ≈ **5e-15**). Plus: the line spans
   a real extent (not a degenerate point), and its direction is perpendicular to
   OC, as inversion predicts.
2. **The inversive invariant holds.** `|OP|·|OQ| = L²−ℓ²` stays constant to
   `< 1e-12` (observed ≈ 9e-16) throughout the motion, and O, Q, P stay
   collinear (`|cross| < 1e-12`).
3. **Loop closure.** Every one of the 7 bars holds its length to `< 1e-12`
   (observed ≈ 1e-15) across the full crank rotation — the linkage truly closes;
   the rhombus stays a true rhombus (4 sides = ℓ) and both long bars stay = L.
4. **Determinism + skin-invariance.** Same params/θ → byte-identical joint
   fingerprint; a `skin` field can never reach the geometry (the core has no skin
   parameter at all), so the fingerprint is identical across all skins; the full
   pen trace is reproducible bit-for-bit.
5. **Four-bar companion.** The default four-bar is a **Grashof crank-rocker**
   (the input crank fully rotates), closes at every crank angle (no dead spots
   over 360°), all five bars hold length to `< 1e-12`, and its coupler curve is
   genuinely 2-D (max deviation from any line ≫ 0 — a clean foil to the straight
   line).

---

## Honest contrast: exact vs. approximate straight-line linkages

| linkage | year | straightness |
| --- | --- | --- |
| Watt's | 1784 | **approximate** — a figure-8 (lemniscate-like) that crosses a line at a point and bows away; good only over a short stroke |
| Chebyshev / Hoeken | 1800s | **approximate** — minimax-optimized to *hug* a line, never identically straight |
| **Peaucellier–Lipkin** | **1864** | **EXACT** — identically straight everywhere the rhombus closes, by circle inversion |

This piece ships only the **exact** one as its hero. The four-bar is included
precisely to *show* a rich, visibly-curved coupler path so the eye can see what
"not a straight line" looks like next to the Peaucellier's dead-straight rail.

---

## What shipped (and what didn't)

- **Shipped:** Peaucellier–Lipkin (hero) + a four-bar crank-rocker (companion).
- **Dropped:** a pantograph. Its *exact-affine* claim (`pen = O + s·(input−O)`)
  is provable, but a visually-faithful, free-roaming **parallelogram** form whose
  rigid bars also hold length is only achievable as the degenerate collinear
  proportional-rod (a straight stick on screen) — not a compelling linkage to
  watch. Per the "smaller proven set" rule, two rock-solid linkages beat a flaky
  trio, so the pantograph was cut rather than shipped half-true.

---

## The page

- **Stage:** an animated linkage on a drafting "paper" — fixed pivots (with
  ground hatching), rigid bars (grounded bars tinted), pin-joints, a glowing pen
  **P**, and the pen's accumulating trace. A faint dashed **rail** shows the
  exact line the Peaucellier pen rides.
- **Crank drive:** auto-rotate (ping-ponging across the Peaucellier sub-arc so
  the pen retraces the same rail) + a manual **angle scrubber** (works even when
  paused / under reduced-motion).
- **Linkage picker:** Peaucellier ↔ Four-bar.
- **Adjustable bar lengths:** long bar **L**, rhombus side **ℓ** (clamped to
  ℓ < L so the rhombus stays closeable and k² = L²−ℓ² > 0; |OC| = r is preserved
  so the straight-line condition always holds); four-bar crank **a** and coupler
  pen offset. Changing a length **re-solves live**.
- **Trace on/off + clear. Pause. Speed.**
- **Skins:** Drafting, Blueprint, Brass — **palette only**, never geometry.
- **2× PNG export.** **`← workshop`** back-link. **No audio.**
- **Self-test chip:** "straightedge verified — 14/14 ✓", calling the same core.

## Files

- `tools/linkage/linkage.js` — the pure, DOM-free kinematics core (dual-use
  IIFE; `Linkage` global in a browser, `module.exports` under Node).
- `tools/linkage/linkage.test.cjs` — the Node self-test.
- `linkage/index.src.html` → `linkage/index.html` (built by
  `node tools/forge/forge.mjs linkage/index.src.html`).
- `linkage/SPEC.md`, `linkage/CHANGELOG.md`.

## Verify

```
node tools/linkage/linkage.test.cjs          # 14/14 PASS, exit 0
node tools/forge/forge.mjs linkage/index.src.html
node tools/forge/forge.mjs --check --all     # green
```
