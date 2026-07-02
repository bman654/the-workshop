# The Unstirring — SPEC

A delight-first, touchable **reversibility toy**. One glass annulus of thick amber syrup, a
single luminous drop of dye. Grab the inner glass and **crank** — the drop smears into an
invisible spiral, riding the differential Couette shear. Crank it **back** (or press *un-stir*)
and — in the creeping limit — every particle retraces its own path and the blob **gathers
itself home**. Slide the hidden *Reynolds* dial up: inertia wakes, a secondary swirl folds the
dye across streamlines, and no back-cranking brings it home ("…it stayed lost").

The delight is up front (near-black warm syrup, one whispered line, the crank, the gasp). The
proof lives quietly behind a **"why does this work?"** drawer. This is a *kinematic reversal of
a creeping-flow (Couette) advection field* — **not** a turbulence DNS.

## Files (the estate bench pattern)

- **`core.mjs`** — the PURE, DOM-free advection engine. The ONE engine that BOTH the page and
  the Node twin drive; no divergent logic. Wrapped in `// ===== UNSTIRRING CORE BEGIN/END =====`
  sentinels and byte-inlined into `index.html` by forge.
- **`core.test.mjs`** — the Node twin: runs the 4 self-test rows + stronger sweeps, then
  byte-parity-checks the inlined core in `index.html`. `node the-unstirring/core.test.mjs` →
  **10/10 ALL GREEN**.
- **`index.src.html`** → **`index.html`** — the page. Built by
  `node tools/forge/forge.mjs the-unstirring/index.src.html` (inlines `core.mjs` byte-for-byte
  + the placeholder/forged art). Self-contained, zero-dep, no network.
- **`art-*.js`, `sfx-*.js`** — placeholder art modules the foundry replaces (see below).
- **`art-specs/*.md`** — the foundry contracts for each forged asset.

## The core (`core.mjs`)

Concentric Couette cell, normalized radii `A_IN = 0.34` (inner, rotating) and `B_OUT = 1.0`
(outer, fixed). The exact Stokes azimuthal solution `v_θ(r) = A·r + B/r` with no-slip at both
walls gives `couetteCoef(a,b) → {A:-a²/den, B:a²b²/den}`, `den = b²−a²`. A ring's angular
velocity is `ω(r) = A + B/r²`.

- **`advect(p, dPhiTurns, Re)`** — the ONE engine, mutates `p = {r,th}`.
  - Re = 0 (creeping): `steps=1`, `dth = (A + B/r²)·dPhi`, **r invariant** — purely azimuthal,
    area-preserving, **exactly invertible**.
  - Re > 0 (inertial): `steps=8`, plus a radial drift `dr = (Re/400)·|r·dω/dr|·sin(3θ)·h`
    (a 3-cell Taylor-vortex-like secondary flow) with soft wall reflection. It **folds** dye
    across streamlines and does NOT cancel on the reverse crank.
- **`roundTripError(Re, turns, n)`** — the OBSERVED max home displacement (what the page
  renders): machine-ε at Re=0 (exact reversal), a real residual at Re>0. NOT monotone — the
  bounded annulus **saturates** it (you can be no more lost than fully mixed); an honest
  property of a bounded flow, not a bug.
- **`foldingResidual(Re, turns, n)`** — the MONOTONE irreversibility measure: the mean total
  cross-streamline folding, integrated along the unperturbed creeping trajectory. Exactly ∝ Re,
  so strictly monotone at any resolution. This is the *source* of the residual smear; the
  observed displacement is its *saturating* consequence.
- **`homeError(pts)`** — mean actual displacement of a particle cloud from its home (r0,th0).
  The identical quantity the page readout and the twin both measure.
- **`runSelfTest()`** — 4 named rows (the page's pill runs THIS): (1) Re=0 round-trip < 1e-9;
  (2) Re=40 residual > 1e-3; (3) folding residual ↑ monotone in Re; (4) r conserved exactly at
  Re=0.

## The twin (`core.test.mjs`) — 10 rows, honest count

A (4 rows) = `runSelfTest()`. Then: **B1** exact reversal over a GRID of 30 blob seedings
(seed radius × turn count) at Re=0, every particle < 1e-9; **B2** folding residual monotone
over Re∈[0,120] step 1 for n∈{100,400,1600} + exactly ∝ Re (Re×4 ⇒ ×4); **B3** non-trivial
residual — Re=40 leaves a smear > 1e-1 while the SAME Re=0 blob comes home < 1e-9; **B4**
area-preservation — r conserved exactly (Δr < 1e-15) over 200 fractional-turn cranks; **B5**
reversible-map algebra — two-sided inverse + exact composition. **C** BYTE-PARITY: the inlined
core in `index.html` is byte-identical to `core.mjs`, sentinel-to-sentinel.

## Honest scope (the label)

*Kinematic reversal of a creeping-flow (Couette) advection field — round-trip error vs Re.*
The inertial term is a **model of why** inertia breaks reversal, not a DNS. Only the Re=0
reversibility, the monotone irreversibility, and the folding residual are the proven claims.

## The feel & register

Delight-first: near-black warm syrup, ONE luminous amber blob, one whisper, no panel, no
"Reynolds" up front. Crank = pointer-drag (desktop) + touch (mobile), `touch-action:none` +
`setPointerCapture`, with release-momentum coast and a rotating fiducial + knurled grip on the
inner glass. The dye renders the SAME `advect` positions the core computes (no separate visual
path). The gasp: un-stir animates wind→0; at Re≈0 the blob re-gathers → "it came home." (gold
swell); at high Re → "…it stayed lost." (dull thud). `prefers-reduced-motion` → a calm,
non-animated still (fewer particles, no rAF loop, repainted on state change). Shared estate
mute via `WS`/`ws:pref:muted`. Self-contained (network probe empty).

## The art foundry (placeholders → forged)

Built with PLACEHOLDER art first (inline fallbacks in `index.src.html`), each with a spec:
- **`art-dye.js`** → `window.UnstirringDye.draw(ctx,pts,view,env)` — painterly dye bloom (warm
  core → cool edge) replacing flat additive squares. Spec: `art-specs/dye-bloom.md`.
- **`art-glass.js`** → `window.UnstirringGlass.drawGlass(ctx,view,env)` — caustic inner glass +
  outer-wall rim-light that turn with the crank. Spec: `art-specs/glass-caustics.md`.
- **`art-syrup.js`** → `window.UnstirringSyrup.paint(ctx,view,env)` — syrup grain / ambient
  shimmer. Spec: `art-specs/syrup-grain.md`.
- **`sfx-drag.js` / `sfx-gather.js` / `sfx-lost.js`** → `Gate.sfx.{drag,gather,lost}` — a low
  viscous drag tone rising with crank speed, a soft gather-chime + gold swell on "it came home,"
  a dull thud on "stayed lost." Spec: `art-specs/sfx-unstirring.md`.

## Where it lives

New top-level `the-unstirring/` (a garden bench — NO new wing/POI). Listed in
`workbench/index.html` among the fluid kin (near Ripple, in "Toys & benches"). Cross-linked to
`strange-garden/pieces/the-marbling-bath.html` as the contrast sibling (the Bath smears ink you
keep; the Unstirring smears dye that comes home).

## Build & verify

```
node tools/forge/forge.mjs the-unstirring/index.src.html   # index.src.html → index.html
node the-unstirring/core.test.mjs                          # 10/10 ALL GREEN (incl. byte-parity)
node tools/forge/forge.mjs --check the-unstirring/index.src.html   # no drift
```
