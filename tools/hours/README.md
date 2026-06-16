# tools/hours — The Hours

The front door's **day/light core**: the estate plate knows what time it really is.
A continuous day-phase tint keyed to the **true solar altitude**, a brass **gnomon**
that casts a real shadow that sweeps with the sun, and four time-gated **apparitions**
that wake in their hour.

## Files

- **`hours.js`** — the sole-authority, DOM-free, dual-use core (`Hours` global in a
  browser; `module.exports` under Node). forge inlines it into the front door and
  into `hours/index.html` (the wing landing) between forge sentinels, so the page
  can never drift from the Node twin.
- **`hours.test.cjs`** — the Node twin. `node tools/hours/hours.test.cjs` → exit 0
  GREEN. Proves the three claims below + a live margin-clearance check.

## The solar core is NOT re-derived here

`julianDate`, `sunEclipticLonDeg`, `solarDec`, `solarRA`, `sunPosition`, `sunAltAz`,
`meanLonDeg`, `equationOfTimeMin`, `civilToAST`, `hourAngleFromAST`, and `shadowTip`
are **copied verbatim** from `tools/dial/dial.js` — the same proven model that ships
the Gnomon sundial and the Astrolabe. The Hours therefore cannot disagree with them
about where the sun is or which way a shadow falls. (A future agent may promote those
~80 lines to `tools/solar/solar.js` and forge-inline into dial + hours + astrolabe to
retire the verbatim copy — noted, not required.)

The shadow **direction** is routed through `shadowTip()`'s closed-form hour-line — the
same function the sundial ships — so it is provably correct, not ad-hoc trig.

## Public surface

- `Hours.solarAltAz(latDeg, doy, civilMin)` → `{alt, az}` (radians) — the one sun entry.
- `Hours.solarAltitudeDeg(latDeg, doy, civilMin)` → degrees.
- `Hours.brightness(altDeg)` — 0.06 (deep night) → 1.0 (high sun); **C0 + monotone**.
- `Hours.skyColor(altDeg)` → `[r,g,b]` — **jump-free** at every segment boundary, bounded slope.
- `Hours.lampGlow(altDeg)`, `Hours.dayFactor(altDeg)`, `Hours.phaseName(altDeg)`.
- `Hours.gnomonShadow(latDeg, doy, civilMin, styleLen)` → `{x,y,r,theta,below}` —
  routed through `shadowTip`.
- `Hours.apparitionsAt(altDeg | {latDeg,doy,civilMin})` → `{id: bool}`; `Hours.APPARITIONS`
  (the four predicates) and `Hours.apparition(id)`.
- `Hours.ESTATE` — the fixed estate place `{latDeg, lonDeg, tzOffsetMin}` (no geolocation).

## The four apparitions (each a pure altitude predicate, non-vacuous)

| id | window (sun altitude) | what wakes |
|----|----|----|
| `dawn-mist` | `[−4°, +6°]` (low-sun band, dawn & dusk) | a faint mist near the horizon |
| `dusk-fireflies` | `(−12°, −3°)` (civil→nautical dusk) | the first star kindles; fireflies wake |
| `candle-window` | `< −0.8°` (the **whole night**, **wraps midnight**) | a candle-lit window burns |
| `witching-ghost` | `< −15°` (deep / astronomical night) | a figure crosses the corridor |

## The three claims (proven by `hours.test.cjs`)

1. **Solar correctness** — the day's peak altitude equals `90° − |lat − dec|` from the
   **true** declination to **≤ 0.05°** (equator/equinox ≈ 89.55°, NYC/solstice ≈ 72.73°);
   altitude crosses 0 at exactly two sign-changes; daily-max lands at civil 720 ± EoT (≈722);
   the shadow direction is the proven hour-line and sweeps morning→afternoon.
2. **Tint continuity + correct monotone phasing** — `skyColor` shares endpoints exactly at
   every boundary with bounded slope; `brightness` is C0 **and** monotone non-decreasing in
   altitude (no inverted phase); a real day rises dawn→noon then falls noon→night.
3. **Apparition windows** — each predicate fires exactly within its window (ON inside, OFF
   just outside both edges, OFF in an unrelated phase), is non-vacuous, and `candle-window`
   is proven ON across the midnight wrap.

Plus **(d) margin-clearance** — the live `Layout.solve` over the real PLACES proves the
gnomon POI's derived slot clears every footprint bbox, the plan furniture, and the manor
candle-pool (mirrors `sky.test.cjs`).
