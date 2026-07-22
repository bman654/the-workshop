# SPEC — The Bead That Falls Like Light

## Thesis
The brachistochrone (curve of fastest descent for a bead, `v(y)=√(2gy)`) and the least-time ray of light
through a graded medium with `n(y) ∝ 1/v(y)` are **the same cycloid**. Two code-disjoint cores agree.

## Parents (imported byte-untouched, two ../ hops)
- `../../brachistochrone/core.mjs` — `solveCycloid`, `cycloidTime`, `descentTimeFn`, `buildTimeTable`,
  `posAtTime`. (Newly factored out of the brachistochrone page in this same cycle — a DEEPEN move; the page
  now inlines that core byte-for-byte, proven by `brachistochrone/core.test.mjs`.)
- `../../refraction-run/core.mjs` — `solveFermat`, `bouguerInvariant`.

## The stage (fixed)
- `A=(0,0)`, `B=(XB=2.2, YB=1.4)` in tank units; `g=9.81`. Chosen so the reference cycloid reaches B at
  `θB = π` — its flat bottom — so the light path coasts dead-level into the finish and the speed-strata are
  brightest exactly at B.

## The bridge (this core is the sole authority)
- **Index profile** `n(y) = 1/√(2g·max(y, YMIN))`, `YMIN=1e-9` (cusp clamp; the constant cancels in Fermat).
- **Photon scene** — a finite stack of `M=64` uniform interfaces spanning `[yTop, YB]`, `yTop = YB·0.5/M`;
  each layer's index sampled at its midpoint depth; `src` placed on the cycloid at `yTop`. `solveFermat`
  with `maxSweeps=1000` (near-cusp stacks are stiff; the default 200 goes NaN for some M). The rendered
  polyline prepends the analytic cycloid arc `A→yTop`.
- **Shared invariant** `sin θ/v` sampled at segment midpoints, skipping the cusp skirt (`y < YB·0.03`). The
  coefficient of variation drives the live chip: `<0.03` steady green, `<0.20` amber, else red.
- **Drawn ramp** — a monotone cubic Hermite `y(x)` through pinned `A`/`B` + `INTERIOR_KNOTS=5` draggable
  interior knots. Fritsch–Carlson tangent limiting keeps `y` monotone-nondecreasing (a true downhill ramp,
  so the descent time is always finite — landmine (b)). `x` is the independent variable, so the curve is
  structurally a single-valued function of `x` (no loops — the "reject non-function" is by construction).
- **Dead-heat latch** `LATCH_REL=0.02`: a hand ramp can never take the cusp's vertical dive, so ~1.1–1.5%
  is the best a 5-knot spline reaches; the 2% latch is the honest, reachable target.

## Runners (one clock)
All three timed by brachistochrone's `buildTimeTable` (genuine `v=√(2gy)` along the arc). Gold bead & teal
photon both ride the cycloid → dead heat (|Δ| ≈ 0.05 ms); amber ramp lags by its honest penalty.

## Self-test rows (`runSelfTest`, page pill === Node twin)
1. invariant const in BOTH cores (cycloid relSpread <1e-4; refraction-run n·sinθ machine-ε);
2. same road (photon crossings on the cycloid, perp <1e-2; same time);
3. neg-control (straight ramp: var >50×, and strictly slower);
4a. payoff dead-heat enacted (<1 frame; beats straight by >30 ms);
4b. payoff widget fires on the real render (photon polyline → steady green);
5. determinism.
Plus (Node twin) byte-twin parity (`index.html CORE === core.mjs CORE`) + core-disjointness greps.

## Build landmines respected
- (a) forge:include comment — `/* */` only around the include; built script `node --check`ed.
- (b) `descentTimeFn` near-vertical-start assumption — monotone-nondecreasing ramp keeps the time finite.
- (c) `sin θ→0`, `v→0` at the cusp — invariant clamps `YMIN` and samples away from the cusp; the photon
  stack starts below the cusp and the near-cusp slice is drawn analytically.
- solver NaN — `maxSweeps=1000`.

## Registration
Workbench cross-benches card · manifest CROSS roster · sky: Pilot's 3rd star (`catalog-polar.mjs` +
`sky.js` members `['refraction-run','starlight-bend','the-bead-that-falls-like-light']`) · `ws:seen`
breadcrumb `ws:seen:the-bead-that-falls-like-light`.
