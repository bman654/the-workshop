# The Tippe Top — changelog

A truncated-sphere top you flick spinning that **stands up on its head**: it tips, walks
up onto its thin stem, and spins inverted with its centre of mass *lifted higher than it
started*. The climb is the whole exhibit — a glowing teal heart pinned to the CoM rises
against gravity, its screen-Y read straight off `comHeight(θ)` of the integrated physics
(the marker IS core state, never an ease). A friction dial is the ladder; a spin knob
carries a live `ω_crit` tick; the frictionless neg-control snaps μ→0 and leaves the spin
knob live so you can crank ω to the max and watch it *still* never flip.

Kin on the Midway's spinning run with **The Top That Won't Fall** (Ω = mgr/Iω, spin lets
gravity only *steer* the axis) and **The Contrary Stone** (the rattleback, spin spontaneously
*reverses*). All three are emergent from the integrator, never scripted.

## v1.0 — first light

- **`core.mjs` — the sole physics authority** (DOM-free, inlined byte-for-byte into the
  page between `// ===== TIPPE-TOP CORE … BEGIN/END =====` sentinels; the in-page chip and
  the Node twin call the SAME `runSelfTest()`). Symmetric reduced tippe-top (Cohen 1977 ·
  Or 1994 · Bou-Rabee–Marsden–Romero 2004):
  - `comHeight(θ,p) = R − a·cosθ` — the load-bearing observable; `h(0)=R−a` low, `h(π)=R+a`
    high, `ΔPE` over a flip `= 2·M·g·a`.
  - The geometry window `1−α < γ < 1+α` (`α=a/R`, `γ=A/C`) — a FIXED engraving: inversion is
    possible at all only inside it.
  - `omegaCrit(p)` — the critical spin, a closed form (Ueda–Sasaki–Watanabe 2005) and a
    TRUE bifurcation of the SAME `deriv()` the sim integrates: `sign(thetaDot at upright)`
    flips exactly at `ω_crit`. μ sets the rise RATE, never the threshold.
  - `deriv()` / `integrate()` on `v=[θ, P, φ]` where `P = C·n·(a−R·cosθ)` is the Jellett
    momentum, carried EXACTLY constant (`Ṗ≡0`); the axial spin `n = P/(C·d)` is read off it.
    RK4 at a fixed `H_SIM = 1e-3` shared by the page and the twin.
  - `energyLedger()` — spin-KE drop `=` CoM-rise `+` friction heat; friction is both the
    ladder and the sink.
  - `flips()` / `flipTime()` — the boolean and the near-threshold time divergence.
- **`runSelfTest()` — 11 checks, each labelled EXACT or TOLERANCE-fit:**
  - (A) Jellett `P=C·n·(a−R·cosθ)` EXACT to machine-ε across the full flip θ:0→π while `n`
    and `θ` sweep, WITH a shrink companion proving the residual is genuine 4th-order
    integrator error on the frictionless nutating Lagrange top.
  - (B) the energy ledger closes to machine-ε with a genuinely NONZERO friction heat.
  - (C) flips IFF ω>ω_crit (the rise-direction bifurcation, EXACT boolean over a μ×ω grid),
    a clear-margin end-to-end inversion, and the near-threshold flip-time divergence (a fit).
  - (D) μ=0 ⇒ `thetaDot()≡0` identically ⇒ finalθ===θ0 to machine-ε — spin alone does ZERO
    work on the CoM; friction is the ladder.
  - the two refusals genuinely DISAGREE (sub-critical settles low; frictionless precesses
    flat) + domain guards.
- **`core.test.mjs` — the Node twin, two layers:** Layer 1 runs the in-page `runSelfTest()`
  verbatim; Layer 2 adds a dense R×a×C×A grid + 500 seeded-random VALID models for (A)(B)(C)(D),
  a dedicated 240-cell μ×ω bifurcation sweep (mismatch===0), the structural μ=0⇒thetaDot≡0
  check, the `h(θ)` / `ΔPE=2Mga` law, and byte-parity: re-extracts the BEGIN/END slab from
  `index.html`, asserts every inlined fn body === imported `fn.toString()` char-for-char,
  the constants verbatim, and `new Function(slice)`'s `runSelfTest()` agrees pass-count +
  ok-for-ok + name-for-name. **29/29 green.**
- **`index.src.html` → forge → `index.html` — the render layer, a pure consumer.** Lifts the
  estate brass palette / topbar / self-test chip / stPanel from The Top That Won't Fall.
  Side-on SVG stage (one ground line + a faint receding teal floor grid), a machined-brass
  mushroom-top (rounded dome cap + thin stem stub, a whirring band whose opacity ∝ the LIVE
  core ω), the rising teal heart pinned to the CoM at `GROUND − comHeight(θ)·scale`, a dashed
  rise-track with a tick that slides up, the contact-point walk, 5 β-gated phases
  (SPIN→TIP→WALK-UP→INVERTED & STABLE→decay), the FLICK (drag the dome) + RE-FLICK, the
  FRICTION DIAL μ + SPIN KNOB ω with a live ω_crit tick that tracks μ, the FRICTIONLESS
  CONTACT neg-control, and dimmable SHOW LEDGER side-rails. Responsive (rail drops below the
  stage ≤430px, stage keeps full vertical height) + prefers-reduced-motion (no rAF, a STEP
  button advancing the climb via the same `integrate()`/`draw()`). Verified 60fps, zero
  console errors, no horizontal scroll at desktop/390/360.
- **Registration:** a WITHIN-ROOM kin of The Top That Won't Fall — NO new front-door POI, so
  the map count M and the footprint set are byte-identical before/after. Reciprocal Kin links
  resolve both directions to The Top That Won't Fall AND The Contrary Stone (the rattleback).
- **`verify.sh`** — the gate: Node twin, `node core.mjs` exit 0, front-door smoke (no new POI),
  `forge --check --all` current, the `ws:seen:tippe-top` breadcrumb + `--audit-seen --strict`
  clean, and the four reciprocal Kin links.
