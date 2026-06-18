# The Drop Tower — changelog

## Cycle 136 — sown (the Midway's second lit ride)

THE DROP TOWER · *The room fell with you, so the scale reads nothing* — a sealed cabin you
**hoist** and **drop**, not a chart of one. Ride #2 of the **Midway** amusements wing
(grows it from 1 ride to 2).

**What it is.** A side-view cutaway cabin on a tall lattice mast — and **the camera rides
inside it**. When you release, the cabin holds still on screen and the *world* (mast struts,
ground markers, the coral brake band) streaks *up* past the windows. That camera choice
*is* the argument: you and the room are one falling frame, so the scale forgets your weight.

**Three rendered tells, all driven by the SAME core `a(t)`:**
1. **The loose coin** — at rest on the floor; on release it lifts off and **hangs in mid-air**
   for the whole fall (it and the floor fall under the same `a`), then **slams** to the floor
   at the brake. CLAIM 2 ties the visual to the proof: `y_coin === y_floor` pointwise.
2. **The rider + dust** — hair/forearm hang taut at 1 g, go **slack/float up** in free fall,
   crush down at the brake; a few dozen dust motes settle at 1 g, **suspend uniformly** in
   free fall, rain down at the brake.
3. **The brass scale-needle** — a Midway-sibling gauge (reuses the Coaster's `drawNeedle`
   idiom) reading apparent weight in g: rests on **1 g**, **pegs to 0** in free fall (the teal
   *0 g — true free fall* lamp lights), then **spikes to the crush** across the brake leg
   (interpolated so the slam reads as a fast ramp, not a teleport).

**Two knobs, both honestly spatial.** **Drop height** visibly raises the car up the mast;
**brake band** resizes the coral zone on the lower mast — and that band is *exactly `d`
metres tall*, so you SEE the distance the brake gets to kill your speed. A **⚡ DARE** button
sets max height + hardest brake (the biggest crush, one tap away). A **trade ledger** (three
brass stat plates — `v at brake entry`, `d`, derived `peak g`) updates LIVE as you turn the
knobs, *before* you ride, so you predict the crush then confirm it. A **ghost peak-mark +
twin ghost needle** burn the previous ride's peak onto the dial; re-ride harder and the live
needle blows past it, with a `last → this (+Δ)` delta chip. An honest **slow-motion** toggle
dilates only the animation clock — the core is clock-free, so the dwell never touches the math.

**Three felt regimes with headline swaps:** *RESTING* (1 g) · *FREE FALL* (the room fell with
you, so the scale reads nothing) · *CAUGHT* (pinned at {peak} g).

**The math (authority in DOM-free `core.mjs`, Node twin `core.test.mjs`, chip === twin):**
- **CLAIM 0 — geometry-lock:** the free-fall leg spans exactly `h_drop`, the brake leg exactly
  `d_brake` (so the coral band == `d` is honest).
- **CLAIM 1 — TRUE 0 g pointwise:** `|N| < 1e-9` at EVERY free-fall sample (≥200 of them).
- **CLAIM 2 — the coin floats with the floor:** `|y_coin − y_floor| < 1e-9` across the fall.
- **CLAIM 3 — rest exact:** `a = 0 ⟹ N = m·g` to machine precision.
- **CLAIM 4 — energy → entry speed:** `v_brakeEntry² === 2·g·h_drop`, matched by the trace.
- **CLAIM 5 — the crush:** integrated peak `N === m·(v²/(2d)+g)`, `v²=2gh`, across a band; AND
  strictly monotone (shorter brake / higher hoist strictly raise the peak); AND the brake
  arrests the cabin to `v=0` at the platform.
- **CLAIM 6 — load-bearing negative control:** `alwaysHeavy()` (a scale that reports full
  weight through the fall) reads `m·g` on EVERY free-fall sample where the real `integrate()`
  reads `0` — total disagreement across a band. Anti-vacuity: at REST they agree (both `m·g`).

`node core.test.mjs` → **34/34 ✓ ALL GREEN** (13 shared in-page claims + deeper Node-only band
assertions + byte-for-byte re-extraction parity of the inlined core). `node core.mjs` → green.

**Honesty.** Idealized free fall: point masses, no air drag, instantaneous cable release and
an instant, constant-deceleration brake. The exact `0 g` is claimed precisely for ideal free
fall (`a = −g ⟹ N = 0`); the crush is `peak g = h/d + 1`. The slow-mo toggle dilates only the
animation clock, never the physics. Not a drag model, not jerk-limited brakes, not cable stretch.

**Cross-link:** reciprocal with [The Coaster](../the-coaster/index.html) — same brass
instruments, opposite felt story: there you shape a loop and dare the bead over the top; here
you and the whole room fall together and the scale forgets your weight. Not merged.

**Registration:** a second LIT ride card in `midway/index.html` (the wing grows 1 → 2); the
Midway landing self-test updated to expect TWO lit cards. **No new front-door/map footprint.**
