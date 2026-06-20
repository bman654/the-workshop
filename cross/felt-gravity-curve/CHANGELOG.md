# The Felt-Gravity Curve (Lean and Pin) — changelog

A cross of **The Star Flyer** × **The Rotor**. One ω dial, one gold needle, two fates.

## The one idea

In the rotating frame, effective gravity tilts by **φ = atan(Fr)**, the Froude number
**Fr = ω²R/g**. A swing-carousel chair flying OUT and a spin-drum rider CLINGING obey that
one confession:

- **The flyer.** Its chain is a plumb-line for the tilted gravity — its SOLVED equilibrium
  lean (`tan θ = ω²R/g`, R = r₀+L·sinθ the implicit orbit) IS the felt-tilt φ = atan(Fr).
- **The rotor.** Its rider PINS the instant φ reaches the friction angle `atan(1/μ) = 65.772255°`.

Both rides are beads on **one master arc** (tilt = atan(Fr), Fr on x). The collapse is
**honest — no warp**: both parent cores measured the same `g = 9.81`, asserted at module load
(`F.G === R.G`), so the two beads sit on one curve because the law is one law.

## Form

The NEEDLE is the spine. A single heavy gold pendant needle (the effective-gravity vector) hangs
from a brass hub at center; its angle from vertical === φ(ω) of the live operating point. Behind it
the faint ghost master arc with two beads (a warm coral flyer bead, a cool teal rotor bead) and an
engraved μ-tick pin line at the friction angle. A brass PINNED lamp throws as the rotor bead sweeps
the tick (a 120ms brass latch flash, CSS-only). A flyer diorama (chains splaying along the
plumb-line) and a rotor diorama (a rider sinking, then LOCKING flat) frame the needle. ω is the
single source of truth; tilt is read OUT (never inverted tilt→ω). A "sweep the dial" button drives
ω across its range once (continuous lean vs threshold pin made unmissable).

## Negative controls (load-bearing, import-only)

- **Rigid spokes** (flyer): `rideStateRigid` forces θ≡0 for every ω — the flyer bead peels to the
  x-axis while the real felt-tilt climbs; the chains whirl flat, the needle stays vertical.
- **Frictionless wall** (rotor): `holdsFrictionless` never pins; `omegaC(0) === Infinity`, so the
  μ-tick slides to 90° and PINNED never throws.

## Discipline

- The two parent cores (`star-flyer/core.mjs`, `rotor/core.mjs`) are imported **byte-untouched**.
- This cross core is the **SOLE authority** for the φ = atan(Fr) map; it is byte-twinned into
  `index.html` between `// === CORE BEGIN ===` … `// === CORE END ===` and `core.test.mjs` asserts
  byte-parity.
- Two sub-sentineled adapter blocks (FLYER-ADAPTER, ROTOR-ADAPTER): the disjointness grep proves the
  flyer block names no rotor fn and the rotor block names no flyer fn.

## Self-test (in-page pill === `core.test.mjs`)

1. **Union** — flyer thetaDeg === atan(ω²R/g)·180/π === tiltDeg over a dense ω sweep < 1e-9 (worst ~2.0e-11).
2. **Pin-tick** — holds flips false→true across omegaCrit(); tilt(ω_c) === atan(1/μ) = 65.772255° (gap 0.0).
3. **Collapse** — both flyer & rotor tiltDeg === atan(Fr)·180/π on one master arc < 1e-9 (F.G===R.G, no warp).
4. **Anti-vacuity** — at ω=0 both rides AND both controls read tilt 0.
5. **Neg-control flyer** — rigid θ≡0 peels off the arc on every leaning sample; ω=0 both 0.
6. **Neg-control rotor** — frictionless never pins ∀ finite ω; omegaC(0)===Infinity; non-empty band above ω_c holds.
7. **Byte-twin parity + disjointness** (`core.test.mjs`) — page CORE === core.mjs CORE char-for-char;
   each adapter names no fn of the other domain.

## History

- **Built** (cycle #179) — `cross/felt-gravity-curve/{core.mjs, core.test.mjs, index.html, CHANGELOG.md}`.
  Mirrors the `cross/one-falling-two-ways` idiom for structure and discipline. Node twin green
  (8 legs incl. byte-parity); in-page pill green. Reciprocal ↗ teaser links added on The Star Flyer
  and The Rotor; a Workbench card registered in the crossings group.
