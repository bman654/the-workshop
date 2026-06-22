# The Reaction You Time — CHANGELOG

The Alchemy Lab's 7th hanging-balance card. A flask of molecules winks out; a brass
clock-marker drops each time the flask halves. You read the reaction ORDER straight off
the ladder geometry — even rung spacing for first order, doubling spacing for second.

## The one idea

`t½ = ln2/k` is **dose-independent**. Pour a fuller flask and the clock-ladder rungs
land at the **same even spacing** — just one extra rung at the top. Flip the brass lever
to **second order** (a decay needs two molecules to MEET) and successive half-lives
**double** (ratio → 2 exact), the rungs visibly spreading. The reaction order is legible
in the ladder's geometry alone — no caption required.

## The house quartet

- **core.mjs** — the sole kinetics authority. Order-indexed deterministic laws
  (`conc`, `tickTime`, `tickSpacing`, `halfLife`, `tickSpacings`, `spacingRatios`,
  `rungCount`), a shared `PRESET`, and the discrete Monte-Carlo flask (`makeRng`,
  `stepFlask`, `meanFieldExpectation`, `runEnsemble`, `singleRunTrajectory`).
- **core.test.mjs** — the Node twin. K1–K8 + a byte-identical re-extraction parity test.
- **index.html** — the bench. A canvas Erlenmeyer flask (Facet 0) height-locked to an
  SVG brass clock-ladder (Facet 1); the renderer reads `core.tickSpacings()` and the
  certified survivor count — it never computes a crossing itself. In-page pill runs the
  same K-checks. Inlines core.mjs byte-identical between the `KINETICS-CORE` sentinels.
- **CHANGELOG.md** — this file.

## The math, proven exact (and honestly)

- **(K1)** first-order successive `t½` all equal `ln2/k` (≤ `TOL_LAW`, worst 1.95e-14).
- **(K2)** dose-independence: spacing identical across A₀ (**exactly 0**); a fuller flask
  adds exactly one rung per doubling (`rungCount = ⌊log2(A₀/floor)⌋`).
- **(K3)** the **negative control**: second-order successive-half-life ratio → 2 exact
  (worst 4.44e-16); first-order ratio → 1.
- **(K4)** law residuals machine-exact: first-order semigroup `conc(t)·conc(−t)=A₀²`;
  second-order linearizing `1/[A]−1/A₀=kt`.
- **(K5)** the **honest convergence** (both orders): the discrete ensemble MEAN → the
  sim's OWN mean-field within `KSIG·SE` (worst 3.73σ < 4). This **replaces** the naïve
  "mean vs continuous law" check, which fails at 6–10σ.
- **(K6)** the deterministic bridge: that mean-field → the continuous law as `dt→0`
  (per-step bias HALVES when dt halves), both orders.
- **(K7)** load-bearing honesty: a single fixed-seed pour lands OUTSIDE the band — one
  noisy pour cannot prove the law.
- **(K8)** determinism: identical `{order,N0,k,dt,seed}` ⇒ byte-identical trajectory.
- **(PARITY)** the page's inline core IS `core.mjs`, byte-for-byte (export-stripped).

## Voice

Brass + reagent-cyan (`--reagent #7be0d0`) over warm gold (`--gold #dca74a`). An
Erlenmeyer flask of two-lobe diatomic capsules that wink out (spark ring → ease-out-back
snap → faint product ghost); second-order molecules lunge together to MEET before the
spark. `prefers-reduced-motion` runs the decay to its settled frame headlessly.
