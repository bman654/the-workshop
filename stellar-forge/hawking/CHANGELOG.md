# The Pair at the Edge — changelog

## Cycle 170 — bench bloomed (garden)

**THE PAIR AT THE EDGE — A horizon that dies by glowing.** The Stellar Forge's third bench,
following the remnant *past* the end of a star's life: a black hole is not cold and eternal —
its horizon must **glow** (Hawking radiation), and every photon it sheds steals mass, so it
**shrinks**. The cruelty, drawn as a bleeding disk you watch die: *the smaller it gets the
hotter it burns — it dies faster the closer it is to gone.*

### The form — `index.html` (one DOM-free `<canvas>`)
- **The bleeding disk**: a black `#02030a` horizon (reusing the Scales' lensed-ring + photon-ring
  halo) that visibly **shrinks** as its mass drains, wrapped in a glow halo whose colour follows
  the honest temperature→redshift scale (deep-red ember → amber → blue-white as M→0) and
  brightens/blue-shifts toward a one-frame **final flash** bloom. Display radius uses a DECLARED
  `r ∝ √M` remap (physics stays pure-M); colour/brightness honesty engraved on the plate.
- **The fizz**: pooled, capped (`MOTE_CAP=120`) paired motes that mostly pop-and-recombine;
  ~34% **split** (one streak inward, a sparse faint twin outward = real radiation), emission
  scaling with luminosity so the fizz quickens as the hole shrinks.
- **The mass gauge**: a draining brass column with engraved T + a sim-time countdown to the flash.
- **Three modes** (segmented control): **single** one live disk · **diptych** a heavy + a light
  hole (the lighter is visibly hotter and dies first — the inverse-mass paradox, by eye) ·
  **control** the live hole beside a `classicalHole` neg-control (T≡0, never glows, never shrinks).
- **Touch**: a log-scale brass mass dial (mountain→solar mass), play/pause, leap-to-the-end,
  a **"show the split"** freeze-layer with −E/+E callouts + **"+1 quantum"** that emits one photon
  and notches the mass down in lockstep (the books balance), reset, and full keyboard a11y.
- **Rest on the flash** (publisher, this cycle): when every thermal hole has evaporated, the sim
  **auto-pauses** on the terminal frame (the play button flips to ▶ Play) instead of running on
  past the death into a silently-frozen "— gone —"; a visitor who looks away returns to a coherent
  stopped state. Pressing **▶ Play** on an already-dead hole **re-lights** it from its dial mass
  (rather than stepping once, finding nothing alive, and snapping back to paused). The death is
  still one-way — nothing auto-revives. (Both changes live OUTSIDE the byte-twin core sentinels,
  so byte-parity is untouched.)

### The math crux — `core.mjs` + `core.test.mjs`
- DOM-free, zero-dep ESM, dimensionless `k=1`. The dimensionless Hawking laws:
  `temperature = 1/M`, `luminosity = 1/M²`, `dMdt = −1/M²`, the exact trajectory
  `massAfter = cbrt(M0³ − 3t)`, `lifetime = M0³/3`, an analytic per-substep `lifetimeIntegrated`
  quadrature (hits 1e-9, not Euler drift), and a `classicalHole` neg-control (T≡0, never shrinks).
- Inlined byte-for-byte into `index.html` between the `HAWKING CORE` sentinels; the Node twin
  byte-parity-checks the page copy against `core.mjs`. A `node core.mjs` self-test runs behind an
  `import.meta` guard OUTSIDE the sentinels, so byte-parity is unaffected.
- The six proved claims: (1) **T ∝ 1/M** (ratio 2, strictly decreasing); (2) the **cube law**
  `t_evap ∝ M³` (ratio 8, monotone); (3) **closed-form = integral** (maxErr 2.07e-11 < 1e-9;
  `massAfter(M0, t_evap) = 0` exact); (4) **monotone one-way runaway** (dMdt < 0 ∀M; |dMdt|
  strictly accelerates as M↓); (5) the **classical neg-control disagrees** with the thermal core
  at every M; (6) the **inverse-mass diptych theorem** (M_light < M_heavy ⇒ T_light > T_heavy AND
  life_light < life_heavy) over four pairs.
- `node core.mjs` → 6/6, EXIT 0. `node core.test.mjs` → 36/36, byte-parity IDENTICAL, EXIT 0.
  In-page pill `✓ 6/6 self-test`; `window.__hawking.runSelfTest().ok === true`.

### The wing
- `../index.html` (the Stellar Forge landing): a **third** `a.card` (warm-coal `--hue:#e0734f`,
  glyph ◍, kind `bench · self-proved`) names the cruelty and the law chain
  `T ∝ 1/M ⇒ L ∝ 1/M² ⇒ t_evap ∝ M³` with the classical neg-control. The lede became a
  three-bench lede; the footer reads *"Three stations of one star's life — the death weighed, the
  elements forged, the remnant glowing itself away."* The landing self-pill also winks
  `temperature(1) > temperature(2)` → `✓ gates ordered · T∝1/M`. Breadcrumb `ws:seen:hawking-pair`
  drops on visit.
- Cross-link to `../scales/index.html` (the death the Scales weighs is the remnant this bench
  follows past the end) + the Forge back-link.
</content>
