# Two Costumes, One Sine — SPEC

## One line
The SAME free harmonic law `x″ + ω²x = 0` worn by two literal bodies — an LC tank and a fixed-length
pendulum — hung from one brass control-bar: drag one slider to match their ω and they rise and fall in
eerie lockstep; throw a damp lever and one twin bleeds while its free twin swings undying.

## The soul (the five questions)
- **Fun:** one slider is the whole tuning game — drag it and watch two strings drift in and out of phase,
  feel the magnetic detent grab near the match and SNAP with a brass flash; then throw the damp lever and
  watch one twin visibly wind down. A snap-to-match button does it hands-free; an optional sound toggle
  lets you HEAR the beat resolve to a unison.
- **Beautiful:** a brass twin-marionette stage on dark slate — a glowing cyan electrical puppet (charge
  pouring between plates, a coil flaring) and a warm-gold gravity puppet (a real swinging bob), both on a
  control-bar that lights gold when locked, with a fused neutral-ink ribbon below.
- **Correct (math claim):** yes — proved EXACT by a Node twin + an in-page pill (the rows below). The
  equivalence is asserted; the aesthetic constants are not.
- **Discoverable:** a Workbench cross-gallery card + reciprocal `↗` links from all three kin (LC Tank,
  Swing-Ship, Singing Glass) and an inline `↔` hint on resonance.
- **Fits the estate:** mirrors `cross/the-same-beat` exactly (`core.mjs` + `core.test.mjs` +
  forge-inlined byte-twin `index.html` + README + CHANGELOG + SPEC, zero deps); the estate palette; the
  gold self-test pill.

## Form expresses content
Show the THINGS: a real LC tank (a depicted glowing charge substance pouring between two plates, a coil
that flares by `|i|`) and a real pendulum on a fixed rod (the arc IS the readout). Both puppets are driven
EVERY FRAME by the certified core state — never an independent animation. The shared cosine of time rides a
literal single stroke between them (the timeline ribbon), secondary to the puppets.

## The honest scope (non-negotiable)
The claim is NOT "an LC tank IS a pendulum." It is: BOTH are the free harmonic law `x″ + ω²x = 0`, and at
the matched length their normalized states are the SAME cosine of time to machine precision. The pendulum
is the SMALL-ANGLE LINEAR leg (NOT the swing-ship's Mathieu pump or nonlinear sinθ — a different bench).
Stated in the page lede AND in the `core.mjs` header.

## The handle (the matched-ω bridge — no smuggled factor)
The tank is fixed (`L_lc = 1`, `C = 1`), the reference both costumes are matched to. The ONLY knob is the
pendulum's effective length `L_pend`. The bridge:
```
L_pend = g·L_lc·C  ⇒  ω₀ = √(g/L_pend) = √(1/(L_lc·C)) = 1/√(L_lc·C) = ω_LC
```
The `g` cancels exactly — there is no fudge factor. (Asserted `< 1e-9` over an L×C sweep, measured 4.4e-16.)

## The phase map (the lockstep, pinned)
Both boot from rest at the extremum (`φ=0`), so both are pure cosines: `q = Q0·cos(ωt)`, `θ = θ0·cos(ωt)`.
Then `q↔θ` (both peak together = bob at arc end) and `i = q̇ ↔ θ̇` (both zero-cross together = coil flare =
bob through bottom-dead-centre). Normalize (`q̂=q/Q0`, `î=i/(ωQ0)`; `θ̂=θ/θ0`, `θ̇̂=θ̇/(ωθ0)`) and the two
states are identical functions of time. Getting the `î` scale = `ω·Q0` right is load-bearing (a cosine only
traces a UNIT ring when the velocity is divided by `ω·amplitude`).

## The negative control
The DAMP LEVER injects air-drag `β` into ONE leg (the pendulum) — `θ″ = −(g/L)θ − 2β·θ̇` — or RLC `R` into the
tank (via the lc-tank core's certified `−(R/L)i` term). Its energy is strictly monotone-down, read from the
SAME oracle the classifier badge reads (driven from the certified `energyOf`/`pendEnergy`, never a cosmetic
decay). A conserved-energy classifier returns `free ✓` for both free legs and `✗` for the bled one.

## The cores (single-source discipline)
- `core.mjs` imports `LC.*` (omega, rk4Step, deriv, energyOf, trace, period, `LC.Q0`) and `SW.omega0`/`SW.G`
  ONLY — both at two `../` hops, byte-untouched, ABOVE the CORE region.
- The LC adapter reads the tank purely from the lc-tank core (names NO `SW.*` at all). The θ-adapter is a
  FRESH classic-RK4 linear stepper typed here (`pendDeriv`/`pendStep`/`pendEnergy`) that names NO LC fn. The
  two are grep-asserted code-disjoint in the Node twin.

## Self-test rows (`node core.test.mjs`, exit 0)
1. **Same ω** — `|LC.omega(L,C) − SW.omega0(G·L·C)| < 1e-9` over the L×C sweep.
2. **Same function of time** (headline) — normalized states agree over a full period `< 1e-9` (each core its
   OWN rk4).
3. **Convention honesty** (`===`) — `pendOmega === SW.omega0`, `L_pend === G·L·C`, energy uses `G` verbatim.
4. **Neg-control divergence + energy** — damped diverges `> 1e-4` AND monotone-down; free twin flat `< 1e-9`.
5. **Classifier bites both ways** — `free ✓` for both free legs AND `✗` for the damped legs (anti-vacuity).
6. **Byte-twin parity + disjointness** — `index.html` CORE === `core.mjs` CORE char-for-char; adapters
   code-disjoint; both parents at the same two `../` hops.
(The Node twin adds a unit-ring check on the `î` scale and a parity row on the shared `runSelfTest`.)

## Registration + reciprocation
- Front door: a `.card` in the Workbench cross gallery (after The Same Beat), matching sibling markup. NOT a
  top-level PLACES node (cross pieces are not map nodes).
- This page topbar `↗`: ← The Workbench, ↗ The LC Tank, ↗ The Swing-Ship, ↗ The Singing Glass.
- Reciprocal `↗` backs: lc-tank (edit `index.src.html`, forge), swing-ship (edit `index.html` directly),
  resonance (edit `index.src.html` — a topbar `↗` back AND an inline `↔` hint, forge).
- The page drops `ws:seen:cross-two-costumes` on a direct visit.

## Aesthetic
Estate brass-on-slate dark register. Warm gold (`--warm`) for the gravity puppet; cool cyan (`--cool`,
`#7fd4ff`) for the electrical puppet; the fused ribbon in neutral ink (`--neutral`). The lock plate +
classifier badge are small engraved brass cartouches. Reduced-motion: freeze the puppets at a representative
phase, draw the static figure, the slider still tunes. No overflow at 1280×800 or mobile width.
