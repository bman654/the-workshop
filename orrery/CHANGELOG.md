# Orrery — build log

## v1.0 — initial build (2026-06-11)

A single-file, zero-dependency real-time orrery: the eight planets (+ optional Pluto) plotted on the
ecliptic plane from real orbital elements. The celestial sibling of Firmament. Input is **time**, not a
seed — no re-roll.

### Astronomy
- Implements the JPL "Keplerian Elements for Approximate Positions of the Major Planets" (Standish,
  JPL SSD), table valid **1800–2050** (no b,c,s,f mean-anomaly correction terms).
- Per body, per date: Julian Date (Fliegel–Van Flandern) → advance the six elements by their per-century
  rates → mean anomaly M = L − ϖ wrapped to [−180,180] → Newton-solve Kepler's equation
  (M = E − e*·sinE, e* = e·180/π, |ΔE| < 1e-7°) → orbital-plane coords → rotate into the J2000 ecliptic
  frame → heliocentric (x,y,z), longitude, distance.
- Moon phase from an abridged Meeus lunar longitude vs. the Sun's longitude (Earth helio λ + 180).
- Two scales (Schematic √-compression / True-scale true ellipses), three styles (Brass / Blueprint /
  Observatory), full time controls (play/pause, log speed slider with reverse, Now, date scrubber),
  scroll-zoom + drag-pan, hover info cards, Earth+Moon phase inset, orbits/trails/graticule/labels/
  zodiac/Pluto flourishes.

### Provenance / constant verification
- The element constants + per-century rates were confirmed against the canonical JPL page
  `https://ssd.jpl.nasa.gov/planets/approx_pos.html` (fetched read-only at build time). Every value for
  the eight planets matches the canonical table. (The canonical page now omits Pluto; the optional Pluto
  row uses the JPL 3000BC–3000AD reference values, sufficient for an off-by-default dwarf-planet pip.)

### Verification gates (all passed)

**§8.1 J2000 self-test (built-in, logs to console):** at JD 2451545.0 (T=0) every body's computed mean
longitude L equals its table L0 to < 1e-6°, and the full pipeline yields finite coordinates. **PASS.**

**§8.2 External ephemeris cross-check — heliocentric ecliptic longitude (computed vs. JPL Horizons):**

Horizons reference = heliocentric J2000-ecliptic vectors (CENTER='500@10', REF_PLANE='ECLIPTIC'),
longitude = atan2(Y,X).

*2026-06-11 00:00 UTC (JD 2461202.5):*

| Planet  | computed λ | Horizons λ | Δλ      | computed r | Horizons r |
|---------|-----------:|-----------:|--------:|-----------:|-----------:|
| Mercury |   196.39°  |   196.39°  | 0.000°  |  0.4113 au |  0.4113 au |
| Venus   |   175.10°  |   175.10°  | 0.004°  |  0.7198 au |  0.7198 au |
| Earth   |   259.75°  |   259.74°  | 0.006°  |  1.0153 au |  1.0153 au |
| Mars    |    23.86°  |    23.87°  | 0.013°  |  1.4210 au |  1.4211 au |
| Jupiter |   122.15°  |   122.13°  | 0.017°  |  5.2667 au |  5.2693 au |
| Saturn  |     7.06°  |     6.99°  | 0.072°  |  9.4681 au |  9.4689 au |
| Uranus  |    61.38°  |    61.37°  | 0.006°  | 19.4555 au | 19.4615 au |
| Neptune |     1.96°  |     1.97°  | 0.010°  | 29.8795 au | 29.8808 au |

**Max |Δλ| = 0.072°** (well within the ~1.5° gate).

*2000-01-01 12:00 UTC (J2000, JD 2451545.0):*

| Planet  | computed λ | Horizons λ | Δλ      |
|---------|-----------:|-----------:|--------:|
| Mercury |   253.78°  |   253.78°  | 0.003°  |
| Venus   |   182.61°  |   182.60°  | 0.007°  |
| Earth   |   100.38°  |   100.38°  | 0.002°  |
| Mars    |   359.45°  |   359.45°  | 0.003°  |
| Jupiter |    36.38°  |    36.29°  | 0.085°  |
| Saturn  |    45.58°  |    45.72°  | 0.142°  |
| Uranus  |   316.40°  |   316.42°  | 0.019°  |
| Neptune |   303.92°  |   303.93°  | 0.009°  |

**Max |Δλ| = 0.142°** (well within the gate).

**Moon-phase reality check (2026-06-11 00:00 UTC):** model gives **22.9% illuminated, waning crescent**
(phase angle φ = 302.8°). JPL Horizons (Moon as seen from Earth geocenter) gives **23.3% illuminated**.
Agreement to ~0.4 percentage points.

**§8.3 Visual / behaviour checks (agent-browser, headless Chrome, session `orrery-verify`):**
- Schematic/Brass: all 8 orbits legible, Sun centred + glowing, planets placed, labels clean. ✓
- Each style (Brass / Blueprint / Observatory) screenshotted — look changes, geometry identical. ✓
- True scale: true ellipses, inner-system bunching, eccentricity visible; zoom dives into the inner
  system cleanly. ✓
- Play at 1 month/s: smooth **60 fps**; over ~1.5 months Mercury swept ~196° while Neptune moved ~0.3° —
  inner planets lap outer ones (Mercury fastest). ✓
- Reverse: planets run backward (Earth λ decreased). ✓  Now: snaps simTime to within 1 ms of real now. ✓
  Date scrubber: smooth jumps across 1700–2200. ✓
- Hover: info card with live, correct numbers (e.g. Mars — Dist. Sun 1.422 au, Dist. Earth 2.159 au,
  λ 24.2°, period 1.88 yr). ✓
- rAF loop stops (rafId = null) when paused & not hovering; trail buffers cap at ≤240 points (observed
  166) with no growth; 60 fps held with trails on. ✓
- **Console clean throughout** — zero errors/warnings across a heavy exercise (all styles/scales, every
  toggle twice, date extremes, zoom 0.35×–40×, hovering every planet). ✓
- Retina (DPR 2) crisp; panel fits and scrolls on a 390-px mobile viewport. ✓

### Notes / deviations
- The render auto-plays on load at 1 day/s (a "living clockwork" first impression); pausing stops the
  loop entirely. This is within spec (§4 keeps the input as time; no seed/re-roll).
- Zodiac band is a quiet rim-label nod (sign names at their ecliptic-longitude sectors), off by default.
- Pluto is off by default and labelled "(dwarf)".
