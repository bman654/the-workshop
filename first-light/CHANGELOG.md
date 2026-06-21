# First Light — CHANGELOG

## The Patch With No Middle (founding) · cycle 242

The observatory precinct's new **cosmology** wing (tier 1, footprint tower), beside
firmament / relativity / stellar-forge. The estate's first piece on **metric
expansion** — and the first to argue, by hand, that **the universe has no centre.**

### The form (the soul-verb = ANCHOR)
A dark sky-field of ~140 galaxy glyphs (little spirals + ellipticals) pinned to a
faint **stretchable quad knit** drawn behind them. Galaxies are FIXED in **comoving**
coordinates; their **proper** position is `a · comoving`. The single rendering
choice is the soul: when you grow `a`, the **knit dilates** and the dots ride it —
motion is the fabric stretching, not particles flying.

- **The brass `a`-collar** on the right rail IS the drag (Explorer-0 enforcement: no
  `a(t)` slider gets to be the hero — `a` is what your hand did). Pull it and the
  whole knit blooms; let go and it HOLDS. `v = ȧ·Δcomoving = H·d` falls out as a
  theorem, exactly linear, the farther galaxy always faster.
- **Click any galaxy to ride it** (re-anchor): the field re-pins to that seat. In the
  TRUE uniform-scaling world every re-anchor looks IDENTICAL — isotropic `v∝d` from
  every seat. That sameness, FELT by re-pinning, IS the no-centre proof.
- **The isotropy rose** (bottom-left) reads the scale-free anisotropy `A` = residual
  of the field after the best `v=Hd` fit, normalised by the field norm. In truth
  `A≈0` at every anchor → the needle sits dead-centre and "🎯 centre found when the
  rose is symmetric" is satisfied everywhere: every vantage is the centre, so none is.

### The two neg-controls (both break in your hands)
- **Fixed-centre cheat** — flip it and galaxies fly radially from ONE origin in a
  fixed space. It is a genuinely DIFFERENT law under re-anchor, not a
  re-parameterisation: it models the chosen anchor as still STATIONARY (it does NOT
  subtract the anchor's own velocity, the missing `−ȧ·c_from`). Innocent at the
  centre; re-anchor OFF-centre and it breaks — a near-side galaxy turns around to
  APPROACH you (`v·d̂ < 0`, impossible under real expansion), `v` stops tracking `d`,
  the rose pegs. A side-by-side **true | cheat** dial reads the SAME off-centre seat,
  one calm, one pegged — the difference MEASURED on screen, not asserted. *If you can
  find the centre, you're in a cheat.*
- **Frozen metric** — hold `a` and fire a photon: it arrives **unshifted**,
  `1+z === 1` EXACTLY, λ unchanged. This proves the colour-slide is the ruler
  growing, NOT the source moving — there is **no velocity/Doppler term anywhere**.
  This axis distinguishes First Light from the estate's kinematic Doppler pieces
  (drifting-star, the passing-siren).

### Supporting gauges (riding the same `a`)
- **A photon** you launch (double-click) across the patch: its crests are spaced in
  **comoving phase**, so they SPREAD as `a` grows and its colour marches
  white → amber → deep-red → dark. Tiny readout `1+z = a_now/a_then`; a persistent
  "now invisible (infrared)" tag when λ leaves the visible band. The colour ramp is
  lifted from the shared `tools/spectrum/wavelength.mjs` (one estate authority — no
  third drifting copy of the CIE ramp).
- **A temperature strip** reading `T ∝ 1/a` (`T·a` invariant): the patch visibly
  cools from a hot wash to cold as you pull it open.

### The four-file forge
- `core.mjs` — the SOLE expansion authority, pure & DOM-free. Exports
  `properPos`/`scaleField`, `recession(a, ȧ, fromComoving, toComoving)` (the proper-
  recession VECTOR from ANY vantage; `d` is PROPER distance `a·Δcomoving`
  throughout), `redshift(a_then,a_now)=a_now/a_then−1`, `temperature(a)∝1/a`,
  `fixedCenterCheatRecession`, `frozenMetricPhoton`, `fitHubbleSlope` (Σv_r·d/Σd²),
  `anisotropy` (scale-free residual), `measureFrom` (the SINGLE code path the rose +
  the test both read, vantage as an argument), and `runSelfTest`.
- `core.test.mjs` — the Node twin, re-deriving every claim a second way + byte-parity.
- `index.src.html` → forged `index.html` byte-true (CORE BEGIN/END sentinels inlined
  byte-for-byte; `forge --check` passes; the twin proves the inline === `core.mjs`).
- this `CHANGELOG.md`.

### The self-test — FOUR split claims, one leg each
1. **Redshift = geometry** — `1+z === a_now/a_then` EXACTLY over an `(a_then,a_now)`
   sweep to `<1e-9`, AND the drawn crest-spacing ratio is the SAME number (picture
   and proof are one number, not two coincidentally close).
2. **Homogeneity / no-centre** — re-anchor on EVERY vantage-dot, fit `H`, recover the
   SAME slope with a perfect linear fit (`R²=1`, residual `<tol`) AND anisotropy
   `<tol` at every vantage. The on-screen rose and this test read the SAME
   `recession()` path, so they can't drift.
3. **T·a invariant** — `T·a === T0` over the a-sweep to `<1e-9`.
4. **Neg-controls bite (split)** — (4a) frozen metric ⇒ `1+z === 1` EXACTLY;
   (4b) fixed-centre cheat re-anchored OFF-centre ⇒ anisotropy MEASURABLY `≫ tol`
   AND `≥1` near-side galaxy has `v·d̂ < 0` AND its recovered slope is NOT consistent
   across vantages — while TRUE scaling's deviation `=== 0` at every vantage.
   Non-vacuity verified BEFORE the claim (the cheat differs from truth by exactly
   the omitted `ȧ·c_from`).

In-page pill GREEN 5/5; `node first-light/core.test.mjs` exits 0 on **25/25** checks.

### Integration
- New top-level `first-light/`; PLACES entry in `index.src.html` AND
  `tools/layout/smoke.cjs` as `{district:'observatory', tier:1, wing:'cosmology',
  footprint:'tower', prefer:['left','bottom']}`. Mints the **cosmology** wing slug
  (`tools/layout/layout.js` WING_META). `node tools/layout/smoke.cjs` passes, sky
  stays **73/73** (an observatory room without a catalog star, like its siblings
  parallax/vantage/relativity), `forge --check --all` clean.
- Reciprocal cross-link with **stellar-forge**: a back-link chip in first-light's
  topbar to stellar-forge, and a forward chip added to `stellar-forge/index.html` —
  "the same sky — one star's death vs the whole universe's birth." Both resolve 200.
- Drops `ws:seen:first-light` on direct visit.
- `bigSwingsBuilt 21 → 22`.
