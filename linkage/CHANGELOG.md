# The Straightedge — CHANGELOG

## v1.0 — first cut

A new genre for the workshop: **planar linkages / kinematics**.

- **Core** (`tools/linkage/linkage.js`): a pure, DOM-free kinematics engine.
  Linkages are fixed pivots + rigid bars + a crank driver; `solve(name, θ,
  params)` returns every joint's (x,y) + the pen point, `trace()` sweeps θ for
  the locus. Closed-form throughout (no iterative solver) so geometry is exact
  to machine precision. Geometry helpers: `invert` (circle inversion),
  `circleCircle` (two-circle intersection / the two-bar dyad), `lineFit`
  (least-squares line + max perpendicular deviation), `barLengths`,
  `fingerprint`. Dual-use IIFE: `Linkage` global in a browser, `module.exports`
  under Node; module guard byte-identical to `tools/ws/ws.js`.
  - **Peaucellier–Lipkin** (hero): the exact straight-line linkage by circle
    inversion. P = inverse of crank joint Q; |OP|·|OQ| = L²−ℓ²; Q on a circle
    through O ⇒ P on an exact line. Max perpendicular deviation ≈ **5e-15 units**.
  - **Four-bar** (companion): a Grashof crank-rocker; coupler curve via the dyad;
    all 5 bars rigid through a full rotation; a 2-D foil to the straight line.
  - **Pantograph: dropped.** Exact-affine is provable, but a faithful free-roaming
    parallelogram with rigid bars only collapses to the degenerate collinear rod —
    not worth shipping half-true. Two rock-solid linkages > a flaky trio.

- **Self-test** (`tools/linkage/linkage.test.cjs`): 14 checks, all PASS, exit 0.
  Proves the exact line (max-deviation number), the inversive invariant,
  loop-closure (every bar holds length), determinism + skin-invariance, and the
  four-bar's Grashof/closure/curve properties. The in-page green chip
  (`runSelfTest()`) mirrors the same checks against the same core.

- **Page** (`linkage/index.src.html` → `index.html` via forge): animated
  linkage on canvas — fixed pivots with ground hatching, rigid bars, pin-joints,
  a glowing pen, and its accumulating trace (with a dashed straight-rail hint for
  the Peaucellier). Crank auto-drive (ping-pong across the closeable arc) + a
  manual angle scrubber that draws even when paused / under reduced-motion.
  Linkage picker, live-clamped bar-length sliders (ℓ < L enforced; |OC| = r
  preserved), trace on/off + clear, pause, speed, presets, three palette-only
  skins (Drafting / Blueprint / Brass), 2× PNG export, `← workshop` back-link.
  `WS.seen('linkage')` breadcrumb. No audio.
