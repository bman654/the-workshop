# The Escapement — CHANGELOG

A touchable bench in **The Hours** wing (`hours/escapement/`): wind a pendulum and a 30-tooth escape-wheel
releases **one tooth per beat**, notching an hour-hand — the engine that keeps the hour when the sun is
hidden. Beat it against the sundial it replaces: the real sun **wanders ±16 minutes** over the year. In
IDEAL the swing is isochronous; in REAL a wide swing runs *slow*, and a ghost-hand keeps ideal time while the
live hand lags, the gap counting up as *lost minutes*. Stands on **the pendulum** (small-angle vs the elliptic
integral) and reuses the wing's **proven solar core** byte-untouched.

## v1 — #180 (2026-06-19)

The horology wing's last reserved plinth — the escapement — built, filling the bay. (Sown as the
`[exhibit]` **The Escapement** garden seed; bloomed here at #180.)

**The piece.** ONE wide SVG "night room" (`viewBox 0 0 760 460`): at left a brass sundial-gnomon disc whose
noon-shadow drifts off "clock noon" by the equation of time (±16 min over the year, the proven sun); at right
the clock's guts — a 30-tooth classic recoil escape-wheel (hub + spokes + sawtooth rim), an anchor with two
pallets straddling the wheel top, a pendulum hanging from the anchor pivot with its ±θ₀ swing envelope, and an
hour-hand dial with a ratchet pawl. **Wind / run** and the beat begins.

- **IDEAL** mode: the small-angle period `T = 2π√(L/G)` carries **no amplitude** — widen θ₀ and the beat
  label is *unchanged*. That absence of θ₀ IS isochronism, made executable: the released-tooth rate is
  amplitude-blind (self-tested to spread = 0 ≤ 1e-9). The rod is pinned so this beat is **exactly 2.000000 s**
  (`L0 = G·(2/2π)²`, verified `|periodIdeal()−2| = 0`).
- **REAL** mode: the exact finite-amplitude period is the elliptic integral `T(θ₀) = 4√(L/G)·K(sin θ₀⁄2)`,
  **strictly increasing** in θ₀ — a wide swing runs slow. A faint IDEAL ghost-hand leads the lagging live
  hand, the angular gap *widening* into the **lost minutes** the readout shows (`lostSeconds(12h, 30°)/60 =
  12.3 min`). Narrow θ₀ and the beat *converges* back to 2.000 s — isochronism is the small-angle limit.

**Form expresses content.** The visible bob angle is the **closed-form elliptic solution**
`θ(t) = 2·asin(k·sn(K(k) − √(G/L)·t, k))` (Jacobi `sn` via descending-Landen/AGM) — so the swing you watch
*and* the period the released-tooth count divides by both flow from **one elliptic authority**. They cannot
disagree. The escape-wheel and hour-hand are **pure functions of the integer** `toothCount(t)` the core
returns: on each integer change a released tooth pulses, a TICK/TOCK clicks, the hand notches (never glides),
and the wheel eases to its integer-exact resting angle `wheelAngleRad(teeth)`. The sundial shadow is read from
`eotMin()` of the reused solar core. No plotted curve — a clock you wind and watch keep (or lose) the hour.

**Controls.** Wind / run (rAF, advances only `state.t`) · Reset · an **IDEAL↔REAL** rocker (REAL glows blue) ·
a **1×/4×** speed seg to bank the real drift · an **L** knob (relengthens the rod + reslows the swing, live
`L=… → beat …s`) · a **θ₀** knob (in IDEAL the beat label holds; in REAL it visibly lengthens) · a **♪ sound**
toggle (default OFF, silent under reduced-motion, one lazy AudioContext, TICK ≈ 1700 Hz / TOCK ≈ 1300 Hz
triangle bursts). A readout strip `beat · teeth · lost` with **lost** driven by `lostSeconds` (never the
floored count difference). A thin **trace** beneath the room stamps CLOCK = flat 0 and SUNDIAL = `eotMin(day)`
always-on, with the descending REAL-CLOCK drift line revealed only in REAL + wide θ₀ (the comparison deepens
rather than clutters).

**What it proves (the pill + Node twin).** `core.test.mjs` runs the pendulum core in Node and exits non-zero
on any failure; the page surfaces the same checks in a green self-test pill. **20/20 green** (13 in-page):
isochronism (amplitude-independent rate; integer-exact `toothCount`), the exact 2 s beat, `periodReal`
strictly increasing and → IDEAL with leading term θ₀²/16, an independent **RK4 ODE witness** agreeing to
~1e-13, the power **series honest both ways** (≤1e-6 at ≤45°, demonstrably wrong at 90°), the drift monotone
in `t` and θ₀ with anti-vacuity at tiny θ₀, the closed-form bob **exactly periodic** and matching RK4 to
~1e-15 — and a **DUAL byte-for-byte re-extraction parity**: the inline ESCAPEMENT core === `core.mjs` AND the
inline SUN core === `../analemma-core.mjs`, both export-stripped.

**Honest NOT-claimed scope.** A frictionless point-mass planar pendulum with a perfect escapement that
neither drives nor damps — no mainspring, air drag, or temperature; we model the *shape* of the timekeeping
error. The power series is a *witness*, not the authority (the elliptic integral is). The drift is read from
the continuous phase gap, never the floored tooth-count difference (which can momentarily tie). The amplitude
knob is capped at **90°** (`THETA_MAX`), clear of the swing-to-the-top (θ₀→π) singularity.

**Reduced-motion** renders one honest static frame: the pendulum frozen at +θ₀, the entry pallet mid-release
with its tooth pulse lit, the wheel at the integer angle, the hour-hand notched, and BOTH the ghost (ideal)
and live hands drawn so the drift reads frozen; wind disabled with a note, all knobs still re-render the
static frame so isochronism (IDEAL) and drift (REAL) stay readable without motion.

**Math.** `core.mjs` is the SOLE pendulum authority (`periodIdeal`, `ellipticK` via AGM, `periodReal`,
`periodSeries`, `jacobiSN`, `pendulumAngle`, `toothCount{Ideal,Real}`, `wheelAngleRad`, `handAngleRad`,
`phaseGap`, `lostSeconds`, `periodRK4`). The sun is **reused byte-untouched** from `../analemma-core.mjs` —
the same proven solar core The Honest Sundial and The Analemma keep, so this clock can never disagree with the
sun it beats against. Both cores are inlined byte-identical between sentinels in `index.html`.

**Front door.** A live `<a class="bench" href="escapement/">` card (⚙ "Beat the wandering sun") appended to
The Hours' live bay after the analemma bench; the seed bay recast from "the empty plinths" to "Where the wing
grows next — every reserved plinth is filled". Drops `ws:seen:escapement` on first visit.
