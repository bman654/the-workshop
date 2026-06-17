# The Contrary Stone — changelog

A touchable **rattleback** (celt / wobblestone): a canoe-shaped brass stone on green
felt that **argues with your hand**. Flick it the favored way and it spins clean;
flick it the **WRONG** way and the belly-rock **grows** as the spin bleeds to zero —
then it spontaneously **reverses** into its favored spin and **settles** there.

The reversal is **emergent from the integrator, never scripted**: the verdict flips
only because the integrated spin `n` crossed zero. The whole secret is visible — a
**cyan dashed mass-axis line** on the deck, tilted a few degrees off the keel; drag
the skew angle **δ → 0** (or hit the diagonal-tensor button) and the line snaps to the
keel: now it spins happily **both** ways (the negative control).

The soul is the **reversal you feel**; the proof is a quiet pill.

---

## #106 — sown (the stone is laid)

Born from the ROADMAP `[exhibit]` seed *"The Rattleback"* (sown #104), grown from
explorer prototype **B** (the verified-correct oblique-3D rock — the rocking is the
visible energy-transfer mechanism) with two grafts from explorer **A**: the live
**skew-angle slider δ** with the inlaid cyan mass-axis line, and the **favored-arc**
hint shown before the first flick.

### What it is
- **The verb:** drag-flick across the stone to impart spin (release imparts the
  angular velocity of your gesture), or the **flick FAVORED / flick WRONG** buttons.
  The oblique view foregrounds the **rocking** — the canoe's belly see-saw and side
  roll — so you watch the spin energy pour into rock and back out again.
- **The visible cause:** a faint **cyan dashed line** inlaid in the brass deck, the
  stone's principal **mass axis**, tilted by the live skew angle **δ** off the keel.
  That skew is the products-of-inertia coupling. The **skew δ** slider (−25°…25°)
  maps continuously to the coupling **ε = K·sin(2δ)**.
- **The negative control:** drag **δ → 0** (or the **diagonal tensor (δ = 0)** button)
  and the mass-axis line snaps onto the keel — a diagonal inertia tensor with no
  spin-dependence. Now the stone spins happily **both** ways and never reverses.
  Flip **δ negative** and the **other** spin sense becomes favored.
- **Where the energy lives:** two bars (SPIN gold · ROCK violet) show the live split.
  On a wrong-way flick the ROCK bar swells as SPIN drains, crosses, and refills — you
  see the transfer, not a plotted curve. Total energy reads *conserved (frictionless)*
  at damping 0, *decaying (damped)* otherwise.

### The physics (core.mjs — the sole authority)
State `v = [n, A, B, sA, sB]` (spin · pitch-rock rate/amp · roll-rock rate/amp). The
rock effective damping is `γ = μ + ε·n`: favored `n>0 ⇒ γ>0` (rock decays, stable),
wrong `n<0 ⇒ γ<0` (rock grows, fed by the spin). The energy bookkeeping gives
`dn = ε·(A² + 0.78·B²)` — the spin factor **cancels**, so there is **no division** at
the reversal point; for `ε>0`, `dn ≥ 0` drives a wrong-way spin **up** through zero
into the favored sign and holds. RK4 at a small fixed `dt`. `ε = K·sin(2δ)` from the
visible skew angle; sign of δ flips the favored sign.

### The proof (core.test.mjs — the Node twin, and the in-page pill run the SAME core)
`node rattleback/core.test.mjs` → **all green, exit 0**. The in-page pill reads
**self-test ✓ 13/13** (the same `runSelfTest()`):
- **FINAL sign(n) is the single favored sign for BOTH launches** — the wrong-way one
  reverses *and settles* there (asserted on the FINAL state after a long integration,
  not merely "crossed zero once"; the twin further asserts the spin crosses zero
  **exactly once** and never swings back negative — guards the transient-slosh trap).
- **NEG CONTROL** (diagonal tensor, ε=0): each launch keeps its **own** sign, both ways.
- **Energy conserved to machine ε** on the frictionless reversing run (rel drift
  ~2e-12) — the reversal is real **spin↔rock transfer**, not integrator injection;
  the twin also confirms the rock energy genuinely **bulges** mid-reversal.
- **Damped attractor:** the wrong launch lands favored with the rock fully died out.
- **δ-sign flips the favored sign:** a left-skewed stone (δ<0) favors −1, and BOTH its
  launches settle there.

### Aesthetic
Estate-native brass-on-felt oblique stage with a contact shadow and light-on-tilt,
serif title, mono panels, the SPIN-vs-ROCK *where the energy lives* bars (form
expresses content), and the green self-test pill — the Clack-Counter / collisions kin.

### Verification (browser, agent-browser headed, port 8859, cache-busted)
In-page pill **✓ 13/13**; console **clean** (0 entries). Live: a **wrong-way flick
reverses and settles favored** with `reversed` firing only as integrated `n` crossed
zero (peak rock energy bulged to ~0.78 of E0 mid-reversal, final n ≈ +0.76, no
re-slosh); a **favored flick stays clean** (peak rock ~0.004, never reversed); the
**diagonal-tensor button (δ=0)** keeps each launch's own sign; **δ-sign flip** verified
(right-skew both launches → +1, left-skew both → −1). Front door: single clean anchor
→ `rattleback/index.html`, label "The Contrary Stone" renders among its grounds-physics
kin (the Lodestone Plate, the Clack Counter), 0 nested anchors, 0 overflow. Forge,
layout smoke, hours 69/69, sky 73/73, and `--audit-seen --strict` all green.

### Registered
- Front-door PLACES entry (id `rattleback`, glyph 🌰, brass `#e8b86b`,
  `district:"grounds", tier:2, footprint:"rattleback"`) — a touchable-mechanics kin in
  the grounds, beside the Lodestone Plate and near the Clack Counter & Dissection Bench.
- A `drawRattleback` footprint added to the front-door DRAW table (a felt-table slab
  with a canoe hull, keel ridge, the cyan dashed mass-axis line, and a favored arc).
- `ws:seen:rattleback` breadcrumb dropped on visit (Survey-of-Heaven food).
