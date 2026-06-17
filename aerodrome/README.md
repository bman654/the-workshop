# 🚀 The Aerodrome — Kick the Conic

*The one orbit room where you don't read a curve — you **author** one. Grab the ship, a brass
thrust-rosette blooms, drag a handle, release: that Δv is spent at the ship's point and the orbit
springs into its new shape. Sibling to the **Orrery**, which wheels the orbits the universe already
chose; here you push off and make one with your hand.*

A single self-contained HTML toy (**zero dependencies** — double-click `index.html`) showing a live
two-body orbit you reshape by dragging. A planet sits at the centre — soft atmosphere ring, a hard
surface circle that is the crash floor. A craft rides a live conic, leaving a fading trail.

## The trick: the conic is drawn, the craft is integrated

Two things ride the same path, and that is both the beauty and the proof:

- the **pale-gilt conic** is the *exact analytic solution* read straight from the craft's state vector
  (`orbitFromState` → eccentricity, semi-major axis, periapsis/apoapsis, argument of periapsis);
- the **moving craft** is the *integrated state* — stepped by **velocity-Verlet** on a fixed small dt.

The integrator drives the dot. The dot is **never snapped** onto the analytic curve — so when the two
ride together for many orbits without parting, you are *watching* energy be conserved, not being told it.

## Use it

Open `index.html`. You arrive on a side-on **launch rail** (the on-ramp): drag the throttle bead up the
rail and release to light the booster into a starter orbit — then the sandbox unlocks (re-fire any time
with **Re-launch**). Then:

- **Grab the ship** → a compass-rose of thrust appears: **prograde / retrograde / radial-out / radial-in**.
  Drag a handle; the arrow's length is the Δv, **clamped to the propellant you have left**. Release = an
  instantaneous impulse at the ship's current point. The conic recomputes; a **cyan ghost** of the old
  orbit lingers ~2 s (or pin it with *Hold ghost*).
- **Prograde** balloons the far side (apoapsis); **retrograde** collapses it — overdo it and periapsis
  drops below the surface for a **reentry** bloom. **Radial** thrust *rotates the apse line* instead of
  growing the orbit — the counter-intuitive truth you can feel.
- Push the speed toward the warm **escape wall** (drawn at exactly `v = √(2μ/r)`); cross it and the ellipse
  springs open into a **hyperbola** that flies off-field and never returns (*"ESCAPED — e ≥ 1"*).
- The **Δv tube** on the right is an engraved apothecary column whose drained height *is* the Tsiolkovsky
  rocket equation — the gauge is the maths, not a decorative readout.
- Live readouts (speed, radius, peri/apo altitude, eccentricity, period, energy ε, Δv remaining), a
  play/pause clockwork with a reverse-able speed slider, and an opt-in **Challenge** target ring.

## The maths it proves (live, in-page + a Node twin)

The sole authority is `core.mjs`, inlined **byte-identical** between `CORE BEGIN / CORE END` sentinels
into `index.html`; the Node twin `core.test.mjs` (run `node aerodrome/core.test.mjs` → exit 0) and the
in-page gold pill both run the same battery. Canonical units: μ = 1, planet radius R = 1.

1. **Tsiolkovsky exact** — across a sweep of (vₑ, m₀, mf): `|dvSpent − vₑ·ln(m₀/mf)| < 1e-12`.
2. **ε-conservation** — velocity-Verlet on a known bound orbit conserves specific orbital energy to
   `< 1e-9` over **9+ periods** with a *bounded* (non-growing) oscillation — the signature of a symplectic
   integrator — while a leaky forward-Euler control (`badStep`) at the **same dt** drifts `> 1e-3` on the
   same arc (the negative control proves the integrator *choice*, not a loose bound).
3. **Escape at exactly √(2μ/r)** — across a radius sweep, a speed just *under* escape always stays bound
   (ε < 0, e < 1, finite apoapsis, the integrated craft turns around and returns); a speed just *over*
   always escapes (ε ≥ 0, e ≥ 1, apoapsis = ∞ — no NaN garbage — and the integrated craft never returns).

This is a **clearly-separate** state-vector force integrator — it does *not* rebuild the Orrery's
elements-from-time Kepler core (that is degrees-and-epochs; this is a live (r, v) two-body propagator).

Built by Claude in its creative space, self-verified in a real browser (~60 fps, clean console, all
three claims green) before shipping. The aerospace sibling of the **Orrery**.
