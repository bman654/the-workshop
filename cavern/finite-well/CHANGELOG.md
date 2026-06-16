# The Finite Well — changelog

## Cycle #52 — the re-soul (2026-06-15)

**What changed.** The Finite-Well bench was re-souled IN PLACE. It used to LEAD with a flat
ψ-vs-x plot and a left-side energy-ladder gauge — a curve you read, not a trap you touch. Now
it leads with a **live touchable well**: two solid cool-blue **walls of real width** rising
from the floor to the rim, a chamber wash between them, and the finite set of bound rungs drawn
as **seated shelves across the mouth** of the trap (the old gauge ladder is gone — the rungs
now live inside the well). The selected rung wears its full signed-ψ ribbon + |ψ|² glow-fill
**seated at its own energy**, and the shallowest (clinging-top) rung does too so its long leak
shows.

**The two hero verbs.** **Drag the rim** up/down to deepen/shallow the well (`ns-resize`);
**drag a wall** outward/inward to widen/narrow it (`ew-resize`). One Pointer-Events path
(mouse + touch + pen), region-gated at pointerdown, with a hover affordance that brightens the
grabbed wall / thickens the rim. As you drag, rungs are **born at the lip** (an ignition glow
descending to its seat + an "n born" label) or **spill out** over the rim (the dying rung — a
frozen proven-core snapshot — rises to the rim, its leak floods outward through both walls, then
fades, with a gold stain flare + "n spilled out"). Two presets tween via a morph clock so the
births/spills fire one-by-one during the sweep: **"shallow it to the edge"** parks the well at
exactly ONE rung clinging at the lip (the FEELABLE "always ≥ 1" climax, both walls glowing hot
gold), and **"fill the ladder"** floods it to ~41 rungs and foregrounds the shallowest.

**The leak through the wall (the hero detail).** Where the selected/top ψ reaches the wall it
**continues through the slab** as the e^{−κ(|x|−a)} tail — a warm amber→transparent glow poking
through (reach ∝ 1/κ from the core) plus a per-wall stain whose alpha ∝ ψ(±a)², so a shallow
strongly-leaking rung makes the wall GLOW HOT and a deep rung barely warms it. Z-order: wall slab
solid → leak glow ('lighter' blend) → lip cap on top, so the wall reads solid yet stained.

**The shadow-gauge.** The OLD hero (the flat ψ-vs-x plot) is **demoted** to a quiet ~150×96
low-contrast inset behind a default-OFF toggle ("show the curve · the well's shadow"),
phase-locked to the selected rung with a hairline tie-wisp from the hero's shelf — it never
out-shouts the trap.

**The slider-floor fix.** The depth slider's old min was 20, which never reached the
single-survivor regime (even V0=20, a=0.60 holds 3 rungs). It now runs from **1** (so R can fall
below π/2 and only n=0 survives) and the width reaches **a=2.40**. One `BOUNDS` const is the sole
source of truth for both the sliders and the drag-floors.

**Reduced motion.** The bench had NO reduced-motion path before; motion is new, so one was added.
Under `prefers-reduced-motion: reduce` there is no rAF loop, no born/spill tween, no haze shimmer:
a `still()` draw-once renders ONE complete legible frame (full trap, all rungs SEATED, the selected
rung's ψ + leak fully rendered, the static continuum haze). The verbs STILL work — a born/spill is
a STATE CHANGE (the new picture is simply correct), and `detectLevelEvents()` skips the fx flashes
entirely under RM so no un-advanced flash can persist.

**The math — extracted to a sole authority.** The pure physics (unchanged, verbatim) was
extracted into a sentinel'd module:

- **`core.mjs`** — the SOLE physics authority. Between `// === CORE BEGIN ===` and
  `// === CORE END ===` it holds `radius, nBound, solveLevel, allLevels, psiUnnorm, normConst,
  psi, leakOutside, nodeCount, buildFD, fdMul, inversePower`. This exact 112-line / 4814-byte
  block is **inlined byte-identical** into `index.html` between the same sentinels. Nothing else
  computes the ladder. The render reads every per-frame physical quantity from a core call BY
  NAME — rung seat-Y from `solveLevel(n,…).E`, the ψ ribbon/fill/tail from `psi`, the leak reach
  from `L.kappa`, the count/births from `allLevels().length === nBound(radius(…))`, the leak %
  from `leakOutside`. The only `Math.sqrt/cos/sin/exp` in the draw path are GEOMETRY or
  tween-easing — never a wavefunction or energy.

- **`core.test.mjs`** — the Node twin (exit 0 iff all pass). **11 checks**: the 8 original
  physics proofs (finite ladder count = ⌊R/(π/2)⌋+1 ≥ 1; every rung on the transcendental match
  AND the circle u²+v²=R²; ψ & ψ′/ψ continuous; the node theorem; an independent from-scratch FD
  eigensolve of the stepped potential → the ladder; the leak out of the walls with the shallowest
  rung leaking farthest; box recovery V₀→∞; determinism) PLUS the **two new motion claims**:
  (9) the count tracks ⌊R/(π/2)⌋+1 across a swept well V0=0.5..400 with births landing EXACTLY at
  R=n·π/2; (10) the lone rung's leak grows **monotonically** as the well shallows (16% → 80%
  inside the 1-state window) — PLUS the byte-twin parity check.

**Preserved.** Route `cavern/finite-well/index.html`; the `ws:seen:finite-well` breadcrumb;
the `window.__fw` export; the panel DOM-id contract (`vSlide`, `aSlide`, `nchips`, the readout
ids, the self-test pill `#selftest`/`#stPanel`). The cavern landing card and its "Finite-Well
link is relative" self-test are untouched and green.

**Verification.** `node cavern/finite-well/core.test.mjs` → 11/11 green (incl. byte-twin parity).
In-page self-test pill green (10/10). Browser-verified in a uniquely-named agent-browser session
on port 8753 (torn down by exact PID): 0 console errors, 0 nested anchors, 0 horizontal overflow
@1280 AND @390; both hero verbs work live (drag a wall → rungs born; shallow to the edge → rungs
spill, the last clings); the leak tail renders THROUGH the wall; the reduced-motion still-frame
renders one complete correct frame with all rungs seated.
