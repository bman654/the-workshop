# The Banked Curve — changelog

A Midway bench (ride #8): hunt the ONE no-push speed on a track you tilt, by reading a
dash plumb-bob that hangs dead-straight only at the design speed.

## Cycle 251 — first bloom (the seed *The Banked Curve*)

Built as the tilt-table **hunt-the-null game** (approach C), grafting the earned
**force-triangle overlay** (B, optional) and the **multi-sensory null moment** (A).

**The physics core (`core.mjs`, the SOLE AUTHORITY — inlined byte-for-byte into
`index.html` between the sentinels; the in-page chip and the Node twin `core.test.mjs`
both call the SAME `runSelfTest()`):**
- `designSpeed(r,θ) = √(g·r·tanθ)` — the no-push speed v* (θ≤0 ⇒ 0 exactly).
- `bobAngle(v,r,θ) = atan2(a_c·cosθ − g·sinθ, g·cosθ + a_c·sinθ)`, a_c = v²/r — the
  plumb-bob's signed deflection off the seat-normal: 0 EXACTLY at v*, <0 below (swings
  inboard), >0 above (swings up the bank).
- `frictionBand(r,θ,μ)` — the closed lo/hi bounds that hold without sliding, with the
  `noUpper` flag when μ·tanθ≥1.
- `flatBobAngle`, `numericNullSpeed` (a bisection root used ONLY to prove the closed form
  equals the true zero), `rideState` (the renderer's contract).

**Self-test — 10 falsifiable checks (in-page chip == Node twin), + 21 deeper Node-only
and 2 page-level guards (31/31 green):**
1. HEADLINE: |bobAngle(v*,r,θ)| < 1e-12 across θ∈[8°,40°], r∈[20,80] (measured 2.35e-16).
2. SIGN: <0 below v*, >0 above v*.
3. STRICT MONOTONICITY in v (a single clean zero-crossing — one answer per round).
4. MASS-INVARIANCE: v* and bobAngle carry no m — byte-identical for light vs loaded car.
5. CLOSED-FORM = ROOT: √(g·r·tanθ) equals the numeric zero of bobAngle to 1e-12.
6. NEG-CONTROL FLAT: designSpeed(r,0)=0 AND bobAngle(v>0,r,0)>0 ∀v>0 (a flat track NEVER
   nulls; its only zero is v=0, while banked nulls at a different v*>0 — the teeth bite).
7. FRICTION BAND: lo<v*<hi for μ>0; collapses to the hairline v* as μ→0; "NO UPPER LIMIT"
   fires exactly when μ·tanθ≥1.
- Node-only: dense (θ,r) band, fine-grid monotonicity (exactly 1 crossing/θ), band-bound
  closed-form equality, rideState contract, and RE-EXTRACTION PARITY (every inlined fn
  byte-identical to the module; in-page count == Node count).
- Page guards: the rendered bob-deflection sign === sign(bobAngle); the force overlay's
  resultant horizontal === m·v²/r at v* to <1e-9.

**The scene + game:** an iso banked oval with a bead-car (lap rate ∝ v/r, motion trail)
and a tilting cross-section whose rail rises/falls with θ; the hero dash plumb-bob with a
chalk seat-normal and a three-state tell (coral inboard / teal LOCK / coral up-the-bank).
A round deals a random bank θ∈[12°,38°] and a random off-speed; you tune the v knob, hold
|bobAngle|<1.6° for 0.6 s to lock (bullseye <0.15° = PERFECT), streak + best persist in
`localStorage` (`ws:banked:best`). Toggles: **load the car** (red-herring, answer unchanged),
**tilt it yourself** (free-play θ), **flatten the track** (the θ=0 neg-control round — NO
LOCK), **show the forces** (the constructed force triangle, snaps `= mv²/r` at the null),
**widen the grip** (the μ band, collapses to the hairline as μ→0). The null moment: a
critically-damped settle + a one-shot 660 Hz WebAudio chime (gated to one per entry) + a
brass halo bloom.

**Wiring:** registered as the 8th lit ride on `midway/index.html` (self-test bumped to 8
LIT + the exact-href/exact-claim trio; lede & footer updated); reciprocal sibling links to
The Star Flyer both directions (topbar + footer here, topbar + footer there).
