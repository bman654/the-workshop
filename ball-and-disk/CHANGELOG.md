# The Ball-and-Disk Integrator — CHANGELOG

## #343 — planted (the wheel that INTEGRATES)

A face-on brass ball-and-disk integrator in the Reckoning Cabinet (manor · reckoning wing) — the
differential analyzer's **integrating** organ, twin to The Differential Gear's **adder**. A
brushed-bronze disc auto-spins through the running variable `u`; a draggable friction **ball** rides
a radial track across the disc's centre (the input `x ∈ [−1, 1]`); an **output dial** with a filling
sector and odometer drums reads `θ = (1/r)∫ x du`; and a **gold spiral** the ball inks on the disc, in
the disc's own material frame, makes the accumulating integral something you can see laid down turn by
turn. No number is the hero — the dial's reading *is* the claim.

### Why it's true — the rolling constraint integrates
The ball rolls without slipping on the spinning disc. At radius `x` from centre the disc surface moves
at linear rate `x·ω_disc`, so in a slice of input `du = ω_disc·dt` the ball turns `dθ = (x/r)·du`
(`r` = the ball/output-wheel radius). Sum the slices and the dial holds `θ = (1/r)∫ x du` — a true
**mechanical integral** of the radius program `x(u)`. It is forced by the no-slip constraint, not
approximated: the disc's spin only supplies `du`; what integrates is the **radius**, never the spin
(the negative control makes this unmissable).

### The five preset programs (one core, legible by motion)
- **― Hold** — park the ball at constant `x` → dial ramps **linear** in `u`; the gold thread thickens
  to a band. *Closed form `θ = x·u/r` matched to <2e-15.*
- **↗ Ramp** — `x` grows with `u` → dial winds `u²/2` (a **parabola**); the ball paints an Archimedean
  spiral and halts at the rim (`u = 3.333`, `θ = 2.381`). *Δ = 0 vs closed form.*
- **∿ Oscillate** — `x = sin u` → the dial **winds then unwinds** as `x` flips sign; a rosette, cool
  past centre. *`θ = 1 − cos u`, Δ = 4.7e-16.*
- **∬ Chain ∫∫** — reveal stage two: stage one's dial drives stage two's radius → a constant becomes a
  ramp becomes a parabola, the **double integral**. *Exact, Δ = 1.1e-16, halts `u = 2.14`.*
- **⊙ Centre** — the NEG-CONTROL: park dead-centre (`x = 0`) · the disc spins forever, the dial never
  moves, **no gold**. *Dial 0.000 over 1e6 turns — exactly 0; radius, not spin, integrates.*

**Free-drag** the ball at any time = an honest hand-driven Riemann sum (no exactness claimed when the
hand is on the wheel — only the presets carry the closed-form claim).

### The proven core (byte-identical)
`core.mjs` (the integrator law) is lifted **byte-identically** from the proven prototype (sha256
match) and inlined between the `INTEGRATOR-CORE` sentinels in `index.html`; `core.test.mjs` enforces
the parity (7433 == 7433 bytes) so the page can never drift from the tested law. The self-test pill
reads **6/6 ✓** in-browser.

### Self-test — `core.test.mjs` (exit 0)
- Oracle 6/6: programs match closed forms (`max|Δ| = 8.2e-14`); **bit-exact** for every polynomial
  radius `x = u^0..u^5` (`∫u^n = u^{n+1}/(n+1)`); the 2-stage chain reproduces the exact `∫∫`;
  `x = 0 ≡ 0` over 1e6 turns; FTC (the dial-rate `dθ/du` equals the local arc-law `x/r`); a TAMPER
  guard (the "spin-not-radius" misconception `θ ∝ u` diverges from the parabola).
- B-rigour: a 2000-pt sweep, 3000 random polynomial programs (bit-exact rel), the chain at independent
  radii, and a `1e-30 … 1e9`-turn neg-control.
- C: the law slab inlined in `index.html` is BYTE-IDENTICAL to `core.mjs`.

### One rAF loop, reduced-motion, the centre fix
A single `requestAnimationFrame` loop owns `dt` (pause / reset). Reduced-motion swaps the auto-spin for
a deterministic brass **scrub** lever (per-program `U_rep` caps). Pre-ship review fixed a pitch-hack
that inked gold at the dead centre — the neg-control now lays down ZERO gold, as the law demands.

### Wiring (the Reckoning Cabinet's sixth station)
PLACES entry on the front door (footprint `reckoning` — no new front-door footprint); the reckoning
landing grew its **sixth** station (INTEGRATOR, glyph `∫`) and its h1 became *"Six Brass Minds…"*;
reciprocal *"the two organs of the differential analyzer ↗"* cross-links with The Differential Gear
both ways. SKY: a catalog star + **The Reckoner** asterism's SECOND member (its engraved name now
spans two stars and its *"the Reckoner charted"* tally lights when both organs are seen).
</content>
