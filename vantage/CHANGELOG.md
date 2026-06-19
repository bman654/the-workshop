# The Vantage — changelog

## Cycle 151 — big swing, grounds-worker (opens the navigable-scene MEDIUM)

**THE VANTAGE** — the Observatory's first *scene you walk into*. Forty gold line-fragments
hang in 3-D as meaningless debris from every angle; from ONE earned camera pose — a yaw, a
pitch, a dolly — they un-scramble into a five-point star. Find it and the place names itself:
*Cor Caeli, the Heart of the Vault.* This opens a new medium (a 3-D scene you orbit/dolly
through until a hidden order resolves), distinct from the estate's instruments and charts.

### The scene — `index.html`
- One DOM-free `<canvas>`, a vanilla-JS perspective camera (the `project()` chain reused from
  `strange-garden/pieces/lorenz.html`, with `CAM_DIST` promoted to a live scrollable dolly).
- **Drag** to orbit (yaw/pitch, velocity-based inertia DRAG=0.86, pitch clamped ±1.25);
  **scroll** or **pinch** to dolly (clamped 3.4..11.0). Touch: single-finger drag = orbit,
  two-finger pinch = dolly (`touch-action:none`).
- **Felt feedback only** — no numbers in the bare view: the whole field warms cool deep-blue
  (far) → gold (near), and the shards brighten + widen + bloom as you near the vantage, all
  driven by an UNDISPLAYED residual via `feltCloseness()` (per-axis-normalised so the soft
  dolly tightens as crisply as yaw/pitch).
- **Lock** at `r < LOCK_EPS`: the 40 dashes gild and a faint connecting silhouette draws them
  into ONE clean continuous star; a "— VANTAGE FOUND —" crest + an engraved small-caps serif
  nameplate ("Cor Caeli · the Heart of the Vault") appears.
- **Stuck-visitor assist**: "fly me to the vantage" eases the camera (easeInOutQuad ~1s) from
  wherever you are to C*, then releases so you can drag away and re-hunt.
- **OFF-by-default grafts** (kept out of the bare view, revealed by the assist):
  - *reveal the rays* — the back-projection pencil: a sky-blue ray from the construction eye C*
    through each fragment, drawn through the LIVE camera so the pencil is itself a 3-D object you
    orbit. Toggling it while locked auto-nudges off C* (rays collapse behind the star exactly at
    C*) with a one-line hint. Makes the forward construction *touchable*: each Pᵢ sits on the ray
    from C* through its star-point — that is why they align there and nowhere else.
- A dashed genre teaser ("scenes you walk into": The Star = this bench; The Lattice / The
  Signature = future scenes, same medium, different hidden order).

### The math crux — `core.mjs` + `core.test.mjs`
- DOM-free, zero-import ESM. **FORWARD CONSTRUCTION**: hidden pose C* = {yaw .74, pitch .22,
  dolly 5.2}; a five-point star (outer 1.0 / inner 0.42) densified to 40 image targets Tᵢ; each
  back-projected along a random depth (`mulberry32`, SEED=20260618) to a 3-D fragment endpoint.
  By construction `proj(C*, Pᵢ) = Tᵢ`, so **r(C*) = Σ‖π(C*,Pᵢ)−Tᵢ‖² = 0** is an algebraic
  identity (inverse∘forward), not a fit — **measured 8.16e-17** (machine-ε).
- The residual is wired to the EXACT per-fragment build anchors (Pa/Pb stored at construction),
  not the prototype's approximate fixed t0/t1 — the lock band is honest.
- **NEG-CONTROL 1 (strict minimum)**: perturbing ANY single DOF (yaw/pitch/dolly) by ±0.08 makes
  r exceed a **CALIBRATED PER-AXIS τ**, in both directions, with a fixed 2× margin. Dolly is
  intrinsically the soft axis (slope ≈0.132 vs ≈0.494 yaw / ≈0.470 pitch — a real projective
  fact, pinned and re-measured by the twin). A single flat τ=0.05 would falsely reject the dolly;
  the per-axis τ fixes that **by calibrating the threshold, never fudging the math**.
- **NEG-CONTROL 2 (random cloud)**: a random 3-D cloud admits no pose with r<τ over a dense
  48×24×16 = 18432-pose grid (best r ≈ 0.73 ≫ τ). Structure is what makes a vantage exist.
- **NO ROLL**: a 2-rotation camera (yaw/pitch/dolly). The brief's "perturb roll" is dropped —
  documented in the core and pill; a stray `roll` key on a pose is provably inert.
- Determinism (seed) + byte-twin parity (the inlined core between `// ===== VANTAGE CORE ... =====`
  markers is byte-identical to `core.mjs`; the twin pins the normalised line count = 302).
- Twin `node vantage/core.test.mjs` → **30/30 green, EXIT 0**; in-page pill pinned to r(C*), the
  per-axis τ, the slopes, and the random-cloud grid-best.

### Registration
- One PLACES entry in the front-door `index.src.html`
  (`district:"observatory", tier:1, wing:"vantages", footprint:"tower"`); `WING_META.vantages`
  ("SCENES YOU WALK INTO") added in `tools/layout/layout.js`. Re-forged; breadcrumb
  `ws:seen:vantage` drops on visit. Companion to Firmament, the sky it finds a star inside.

### Verified
- `node vantage/core.test.mjs` → 30/30 green, byte-parity IDENTICAL, EXIT 0.
- `node tools/layout/smoke.cjs` → all layout checks pass; `node tools/sky/sky.test.cjs` → 73/73;
  `node tools/forge/forge.mjs --check --all` → all 45 current; `--audit-seen` → `ws:seen:vantage`
  drops (all 36 pages green).
- agent-browser (session `vantage151`, ?v cache-bust): in-page self-test 9/9, clean console, no
  horizontal overflow @1280 AND @390. Verified BY LOOKING: the bare view reads as scattered
  debris; the camera flown to C* resolves into a clean five-point star with the Cor Caeli
  nameplate; "reveal the rays" shows the back-projection pencil; the revealed front-door plate
  composes with The Vantage seated cleanly in the observatory district beside its kin.
