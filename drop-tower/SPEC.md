# The Drop Tower — SPEC

A sealed cabin you hoist and drop. The piece's soul: *the camera rides with you, so the
room holds still while the world streaks up — and the scale forgets your weight.* The rigor
layer proves apparent weight `N = m(g+a)` exactly: true `0 g` in free fall, a crush of
`peak g = h/d + 1` at the brake.

## The physical model

A sealed cabin rides a tall mast. Inside it sits a free internal object of mass `m` on a
seat-scale. The scale reads the normal force it must exert to share the cabin's vertical
acceleration `a` (up = +):

```
N − m g = m a   ⟹   N = m (g + a)        ← apparent weight, the whole story
```

The ride is three legs of piecewise-constant `a`, so every quantity is closed-form:

| Leg | a | N | what you feel |
|---|---|---|---|
| **rest** | `0` | `m g` | your whole weight |
| **free fall** (drops `h_drop`) | `−g` | `0` | true `0 g` — coin floats, you go slack |
| **brake** (over `d_brake`) | `+a_brake` | `m(g+a_brake)` | the crush |

### Geometry-lock (the band is honest)

The free-fall leg is **exactly** `h_drop` metres; the brake leg is **exactly** `d_brake`
metres, painted as a coral band on the lower mast whose on-screen height in metres **is**
`d_brake`. Total travel = `h_drop + d_brake`.

### Energy → entry speed

Free fall from rest over `h_drop`: `½ m v² = m g h_drop ⟹ v_brakeEntry² = 2 g h_drop`.

### The crush (derived)

The brake spends that kinetic energy over `d_brake`: `½ v² = a_brake·d_brake`, so
`a_brake = g·h_drop/d_brake` and

```
peak g = N_peak/(m g) = h_drop/d_brake + 1
```

Strictly monotone: a **shorter** brake band raises the peak; a **higher** hoist raises it.
The dial's drama is real physics, not animation.

### The loose coin (visual === physics)

A coin released from the floor integrates under the **same** `a = −g` from the same initial
state, so `y_coin === y_floor` pointwise. The on-screen hang is the same physics, not a tween.

## The architecture

- **`core.mjs`** — DOM-free authority. `integrate` (rest → free-fall → brake → settled,
  sampling `{y, yFloor, v, a, N}` + a verdict `{peakG, vBrakeEntry, aBrake, fallLen,
  brakeLen}`), `integrateCoin` (the loose coin under the same `a`), `alwaysHeavy` (the
  neg-control), `peakG` (closed form), `runSelfTest`. The sampler is **clock-free** (walks
  by leg-fraction, not wall-time) so the slow-motion view leaves the physics untouched. A
  `node core.mjs` main guard prints the self-test and exits non-zero on any failure.
- **`core.test.mjs`** — Node twin: runs `runSelfTest()` verbatim, deeper Node-only band
  assertions, and re-extracts the inlined core from `index.html` between the
  `// ===== DROP-TOWER CORE (inlined byte-twin) BEGIN/END =====` sentinels to prove it is
  byte-for-byte identical (the estate parity standard). Exit 0 on all-green.
- **`index.html`** — the instrument. Inlines `core.mjs` byte-identically between the
  sentinels (cradle-weaver/Coaster mold; **no `.src.html`** so the forge count is
  unchanged). **The camera rides the cabin**: a fixed cutaway cabin with the world (mast
  struts, ground markers, the coral brake band) scrolling up past the windows during the
  fall. Three rendered tells — the floating coin, the slack rider + suspended dust, and the
  brass scale-needle — are all driven by the **same** core `a(t)`. The in-page chip calls
  the SAME `runSelfTest()`; chip count === Node twin count.

## Invariants the self-test guards (chip === twin), 13 claims

| Claim | Assertion |
|---|---|
| 0 — geometry-lock | free-fall leg == `h_drop`, brake leg == `d_brake` (the band is honest) |
| 1 — true 0 g | `|N| < 1e-9` at EVERY free-fall sample (≥200 of them) |
| 2 — coin floats | `|y_coin − y_floor| < 1e-9` across the whole fall |
| 3 — rest exact | `a = 0 ⟹ N = m·g` to machine precision (head + settled tail) |
| 4 — entry speed | `v_brakeEntry² === 2 g h_drop` (trace + verdict, <1e-9 rel) |
| 5 — crush | integrated peak `N === m(v²/(2d)+g)`, strictly monotone in both knobs, arrests to `v=0` |
| 6 — neg-control | `alwaysHeavy` reads `m g` (never 0) where the real `integrate` reads 0 — total disagreement across a band; at rest they agree (anti-vacuity) |

## Honesty (the header in the page + core)

Idealized free fall: point masses, no air drag, an instantaneous cable release and an
instant, constant-deceleration brake onset. The exact `0 g` is claimed precisely for ideal
free fall (`a = −g ⟹ N = 0`). The slow-motion toggle dilates only the animation clock,
never the physics. A real tower has drag, jerk-limited brakes, and cable stretch — those
soften the corners; the ideal is the clean claim. Load-bearing neg-control: a scale that
reports full weight through the fall *fails*.

## Registration

A second LIT ride card in `midway/index.html` (the wing grows 1 → 2 rides); the Midway
landing self-test updated to expect TWO lit cards. Reciprocal sib-links with The Coaster
(Drop Tower ⇄ Coaster). **No new front-door/map footprint** — the Midway's PLACES entry is
unchanged.
