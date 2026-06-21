# The Ferris Wheel — changelog

## Birth (cycle 244)

The Midway's **seventh** lit ride, and the **second apparent-weight ride** beside The Drop
Tower: turn one big wheel with a single occupied gondola and your weight **breathes** around
the circle — and past one critical spin, the crest reading goes **negative**.

**The law.** A rider of mass `m` on a Ferris wheel of radius `r` turning at constant rate `ω`
moves on a vertical circle, so the net force on them must always point **inward** (toward the
axle) with magnitude `mω²r`. Only gravity (`m·g`, down) and the seat's normal force `N` (the
scale reading) act. Resolved along the circle the whole story is one line:

  `N(θ) = m(g + ω²r·cosθ)`,  θ measured from the **bottom** (θ=0 at six o'clock).

- **bottom** (θ=0): `N = m(g + ω²r)` — heaviest (the dip).
- **crest** (θ=π): `N = m(g − ω²r)` — lightest.

So the seat reading swings sinusoidally between a heavy dip and a light crest, crossing `m·g`
exactly at the 3- and 9-o'clock seats (cos θ = 0). The needle's swing **is** that value, live.

**The float, and going past it (what makes this ride unique).** The crest reading hits zero
when `g − ω₀²r = 0` ⟹ **`ω₀ = √(g/r)`** — the same true 0 g The Drop Tower stages by *falling*,
here staged once per revolution at the top, and **mass-invariant** (no `m` in `ω₀`: adult and
child float at the same spin). Push *past* `ω₀` and `N_top = m(g − ω²r) < 0`: a seat-pan can't
pull a rider down, so a negative reading means the rider lifts off the pan and the **lap-bar**
must supply `|N_top| = m(ω²r − g)` downward to hold them to the wheel. The reading is **not
clamped at 0** — the negative number is the lap-bar's pull, and it is the property no other
Midway ride has (the Drop Tower floats *to* 0 and stops; the Ferris Wheel sails *past* it).

**The form.** One ω slider turns an SVG wheel (A-frame tower, brass rim, spokes, one glowing
occupied gondola carrying a rider + a lap-bar). A live brass **seat-scale** gauge is the soul:
its needle reads `N(θ)/(m·g)` live and swings *below zero* into a coral lap-bar arc when the
pan unloads. As the gondola passes the crest with N<0 the rider visibly lifts off the pan and
the lap-bar thickens, glows coral, and grows a down-arrow. A live ledger reads N-now, the dip
`N_bottom`, the crest `N_top`, and the gap `2mω²r`. The motion is the readout — the float is a
thing you *hunt* by ear and eye (the `find the float ω₀` and `⚡ DARE (go negative)` buttons ease
you there), not a printed answer.

**The self-test (8 in-page claims; 29 in the Node twin).** `core.mjs` is the sole authority
for `N(θ,ω,m,r)`; `core.test.mjs` runs the SAME `runSelfTest()` the in-page pill runs, plus
deeper Node-only sweeps, then re-extracts the inlined byte-twin from `index.html` and proves it
char-for-char identical. The split claims:

1. **CLAIM 1** — the crest goes weightless EXACTLY at `ω₀=√(g/r)`: `N_top(ω₀)=0` within tol (any m).
2. **CLAIM 2** — **mass-invariant**: a 95 kg adult and a 22 kg child float at the same `ω₀`.
3. **CLAIM 3** — the dip−crest gap is EXACTLY `2mω²r` for all ω (across a sweep).
4. **CLAIM 4 (neg-control, the teeth)** — ω=0 ⇒ a flat `m·g` all the way around (no swing); a
   flat-scale instrument that always reads `m·g` disagrees with the real needle at every
   spinning seat, and agrees only on the parked wheel.
5. **CLAIM 5** — past `ω₀` the crest reads **strictly negative** and strictly decreasing (the
   lap-bar load grows), `|N_top| = m(ω²r − g)`; the sign flips at `ω₀` (positive below, 0 at,
   negative above) — **not clamped at 0**.

**Honesty.** Steady-state apparent weight at constant ω (not modelling spin-up, nor the
gondola's own pendulum sway — we read the steady *radial* support). Point-mass rider, rigid
wheel, `g = 9.81 m/s²`, `r = 9 m`, so the float lands at `ω₀ = √(9.81/9) ≈ 1.044 rad/s`.

**Registration.** Wired into `midway/index.html` as the 7th lit card (lede + footer + selftest
bumped to "seven", the count check 6→7, a Ferris Wheel `ck()` block). Caught during build: a
nested `<a>` (a Drop-Tower cross-link inside the card anchor) is illegal HTML and the browser
split the card into two `.ride.lit` elements — the midway self-test flagged it (litCount 8,
claim fail); fixed by demoting the cross-link to plain `<b>` text. Breadcrumb
`ws:seen:ferris-wheel` drops on visit; the Card Catalog projects it from the Midway footprint.
No `.src.html` twin — like its sibling rides, this page edits `index.html` directly.
