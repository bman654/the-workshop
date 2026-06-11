# Orrery — SPEC

*The celestial sibling to **Firmament**. Where Firmament re-rolls an imagined night sky, the Orrery
shows the **real one** — a faithful clockwork of the actual Solar System, computed from published
orbital elements. Set it running and watch the planets wheel; scrub to any date and find where
Mercury, Mars, or Saturn truly are tonight. The mechanism behind the sky.*

One self-contained file: `orrery/index.html` — vanilla HTML/CSS/JS, canvas-based, **zero deps,
no network / CDN / web-fonts**, relative paths only (served from a Pages subpath). ~60fps.

This is **NOT** a seeded generator (Firmament/Cartographer/Daedalus are). It is a **real-time
astronomical instrument**: positions are a deterministic function of **date/time**, not a seed. The
correctness bar is therefore the opposite of the generators' — it must be *accurate*, matched against
a real ephemeris, not merely *coherent*.

---

## 0. The crux: positions must be REAL (and verified against a real ephemeris)

Use the standard **JPL "Keplerian Elements for Approximate Positions of the Major Planets"**
(E. M. Standish, JPL Solar System Dynamics). Use the table valid **1800 AD – 2050 AD** (the simpler
of the two — it needs *no* b,c,s,f mean-anomaly correction terms; those are only for the
3000 BC–3000 AD table). Outside 1800–2050 accuracy degrades gracefully; that's acceptable for a
visual instrument, but **clamp the date scrubber to ~1700–2200** and don't pretend to more.

> ⚠️ **Do not trust hand-copied constants.** The element table below is provided as a reference, but
> the build agent MUST treat external verification as the gate (see §8). The authoritative source is
> JPL SSD (`https://ssd.jpl.nasa.gov/planets/approx_pos.html`) — fetch it read-only to confirm every
> constant if WebFetch is available; otherwise use the table below and rely on the ephemeris
> cross-check to catch any transcription error.

### Element table (epoch J2000 = JD 2451545.0; top row = value, second row = rate per Julian century)
Columns: **a** (au) · **e** · **I** (deg) · **L** mean longitude (deg) · **ϖ** longitude of
perihelion (deg) · **Ω** longitude of ascending node (deg).

```
Mercury   a 0.38709927   e 0.20563593   I 7.00497902   L 252.25032350   ϖ 77.45779628   Ω 48.33076593
  rates     0.00000037     0.00001906    -0.00594749    149472.67411175    0.16047689     -0.12534081
Venus     a 0.72333566   e 0.00677672   I 3.39467605   L 181.97909950   ϖ 131.60246718  Ω 76.67984255
  rates     0.00000390    -0.00004107    -0.00078890     58517.81538729    0.00268329     -0.27769418
EM Bary   a 1.00000261   e 0.01671123   I -0.00001531  L 100.46457166   ϖ 102.93768193  Ω 0.0
  rates     0.00000562    -0.00004392    -0.01294668     35999.37244981    0.32327364      0.0
Mars      a 1.52371034   e 0.09339410   I 1.84969142   L -4.55343205    ϖ -23.94362959  Ω 49.55953891
  rates     0.00001847     0.00007882    -0.00813131     19140.30268499    0.44441088     -0.29257343
Jupiter   a 5.20288700   e 0.04838624   I 1.30439695   L 34.39644051    ϖ 14.72847983   Ω 100.47390909
  rates    -0.00011607    -0.00013253    -0.00183714      3034.74612775    0.21252668      0.20469106
Saturn    a 9.53667594   e 0.05386179   I 2.48599187   L 49.95424423    ϖ 92.59887831   Ω 113.66242448
  rates    -0.00125060    -0.00050991     0.00193609      1222.49362201   -0.41897216     -0.28867794
Uranus    a 19.18916464  e 0.04725744   I 0.77263783   L 313.23810451   ϖ 170.95427630  Ω 74.01692503
  rates    -0.00196176    -0.00004397    -0.00242939       428.48202785    0.40805281      0.04240589
Neptune   a 30.06992276  e 0.00859048   I 1.77004347   L -55.12002969   ϖ 44.96476227   Ω 131.78422574
  rates     0.00026291     0.00005105     0.00035372       218.45945325   -0.32241464     -0.00508664
Pluto*    a 39.48211675  e 0.24882730   I 17.14001206  L 238.92903833   ϖ 224.06891629  Ω 110.30393684
  rates    -0.00031596     0.00005170     0.00004818       145.20780515   -0.04062942     -0.01183482
```
\* Pluto is included for completeness but rendered as an OPTIONAL "include Pluto (dwarf)" toggle,
**off by default** (it spoils the scale and isn't a planet). Label it honestly as a dwarf planet.

### Algorithm (per body, given Julian Date `JD`)
1. `T = (JD − 2451545.0) / 36525.0`  (Julian centuries past J2000).
2. For each element `x`: `x = x0 + xdot * T`.
3. Mean anomaly: `M = L − ϖ`; wrap to **[−180°, +180°]**. (No b,c,s,f terms for the 1800–2050 table.)
4. Argument of perihelion `ω = ϖ − Ω`.
5. Solve **Kepler's equation** `M = E − e*·sin E` for eccentric anomaly `E` (here `e* = e` in
   **degrees** = `e · 180/π`, with `M`,`E` in degrees). Newton iterate to convergence (`|ΔE| < 1e-7°`,
   ~5–8 iters):
   `ΔE = (M − (E − e*·sin E)) / (1 − e·cos E)`, start `E = M`.  (do the trig in radians.)
6. Heliocentric coords **in the orbital plane** (au): `xp = a·(cos E − e)`,
   `yp = a·√(1−e²)·sin E`, `zp = 0`.
7. Rotate into the **J2000 ecliptic** frame (au), with `ω`, `Ω`, `I` in radians:
   ```
   xe = (cosω·cosΩ − sinω·sinΩ·cosI)·xp + (−sinω·cosΩ − cosω·sinΩ·cosI)·yp
   ye = (cosω·sinΩ + sinω·cosΩ·cosI)·xp + (−sinω·sinΩ + cosω·cosΩ·cosI)·yp
   ze = (sinω·sinI)·xp + (cosω·sinI)·yp
   ```
8. For the top-down orrery plot use `(xe, ye)`; **heliocentric ecliptic longitude** `λ = atan2(ye, xe)`,
   **distance from Sun** `r = √(xe²+ye²+ze²)` au. (Small `ze` from inclination → optional gentle
   pseudo-3D tilt; for v1 a flat top-down `(xe,ye)` projection is correct and expected.)

### Julian Date from a JS `Date` (UTC)
Standard Gregorian→JD. From a `Date d` (use its UTC fields):
`JDN` via the Fliegel–Van Flandern formula, then add the fractional day:
`JD = JDN + (hourUTC − 12)/24 + minuteUTC/1440 + secondUTC/86400`.
(Good enough — we ignore the small TT−UTC ΔT offset; irrelevant at orrery scale.)

### Moon phase (for the Earth inset, §3) — low-precision is fine
Compute the Moon's geocentric ecliptic longitude `λ_moon` and the Sun's geocentric longitude
`λ_sun` (≈ Earth's heliocentric `λ` + 180°). **Phase angle** `φ = (λ_moon − λ_sun)` wrapped to
[0,360). `0`=new, `90`=first quarter, `180`=full, `270`=last quarter; **illuminated fraction**
`k = (1 − cos φ)/2`. A compact low-precision lunar longitude (Meeus "low accuracy", a handful of
terms) is plenty — the Moon here is a tiny phase pip, not a position to navigate by. If the lunar
series feels heavy, a single-term mean-elongation approximation for the *phase* is acceptable; label
the inset "Moon phase," not a position.

---

## 1. The view
Top-down on the ecliptic plane. **Sun at centre** (warm, glowing). Planets ride their orbits CCW
(as seen from ecliptic north). Two **scale modes** (segmented control), because Neptune at 30 au and
Mercury at 0.4 au can't share one linear frame:

- **Schematic** *(default)* — orbit radii mapped through a **compressing function** (e.g. `√r` or a
  log-ish map) so all 8 orbits are legibly spaced and the inner planets aren't a dot-pile. This is
  the classic mechanical-orrery look (real orreries compress spacing too). Orbits drawn as **near-circles**
  (eccentricity barely readable at this compression — fine).
- **True scale** — actual relative orbit radii; orbits drawn as **true ellipses** with correct
  eccentricity and perihelion orientation (use the elements). Inner planets bunch near the Sun; that's
  honest and interesting. Pair with zoom (§5) so you can dive into the inner system.

Planet **disc sizes**: a gentle size scale (log of real radius, or just a curated per-planet size) —
visually differentiated (Jupiter clearly biggest, Mercury smallest) but never to true scale (the Sun
would be 100× any planet). Each planet a characteristic colour (Mercury grey, Venus cream-gold, Earth
blue, Mars rust, Jupiter banded tan, Saturn pale gold **with a ring**, Uranus pale cyan, Neptune deep
blue). Saturn gets a drawn ring; the gas giants can get 1–2 subtle bands. Keep it tasteful, not cartoony.

## 2. Orbits & motion
- Draw each orbit path (ellipse in true-scale, circle in schematic) as a thin styled ring.
- Optional **motion trails**: a fading arc trailing each planet showing recent travel (toggle).
- Optional **perihelion ticks** / **ascending-node** marks in true-scale (subtle, style-dependent).
- A faint **ecliptic-longitude graticule** (radial spokes every 30° + degree ring) — toggle; ties to
  Firmament's graticule. Optional **zodiac/constellation band** labels around the rim (nice, low-key:
  the longitude where each constellation sits — a quiet nod to Firmament). Keep optional + subtle.

## 3. Earth + Moon inset (signature detail)
Near Earth, draw a small **Moon** pip on a tiny exaggerated orbit, **shaded to its real phase** for
the current date (sunlit hemisphere faces the Sun direction). A tiny readout: *"Moon: waxing gibbous,
72% lit"*. This is the charming, verifiable human-scale detail (everyone can check tonight's Moon phase).

## 4. Time controls (the heart of the instrument)
A clean control panel (mirror Firmament's `#panel` styling + collapse/reopen behaviour):

- **Title** *Orrery* · sub *Clockwork of the Solar System*.
- **Live date/time readout** — large, e.g. `11 Jun 2026 · 18:42 UTC` (+ optional local). Updates as
  the clock advances or you scrub.
- **▶ / ⏸ Play–Pause.**
- **Speed** — a control spanning a wide range, with a live readout of the rate. Suggested presets
  (segmented or a log slider): `Real-time`, `1 hr/s`, `1 day/s`, `1 week/s`, `1 month/s`,
  `1 yr/s`, `10 yr/s`. A **reverse** option (negative speed) is a delight — run time backwards.
- **⦿ Now** — snap to the real current instant (`new Date()`), and (if playing at Real-time) track it.
- **Date scrubber** — a date input (and/or a draggable timeline) to jump anywhere in **~1700–2200**;
  positions update live. Show a subtle "approximate outside 1800–2050" hint near the range ends.
- **Scale** segmented: **Schematic** / **True scale**.
- **Style** segmented (§6).
- Flourish chips (toggles): **Orbits**, **Trails**, **Graticule**, **Labels**, **Moon**, **Pluto**,
  **Zodiac band** (sensible per-style defaults).
- Hint line; panel collapsible (`✕` / reopen), like Firmament/Cartographer.

When **paused and not hovering**, stop the rAF loop (static, low CPU); redraw on demand for
hover/scrub/resize. devicePixelRatio-aware canvas; debounced redraw on resize.

## 5. Interaction
- **Hover / tap a planet** → highlight it (halo, dim others slightly) and show an **info card**:
  name, current **distance from Sun (au)** and **from Earth (au)**, **heliocentric longitude**,
  **orbital period**, and a one-line fact. Pull live values from the model.
- **Scroll = zoom**, **drag = pan** (both scale modes). A **reset view** affordance. Zoom lets you
  dive into the inner system in true-scale mode. Clamp zoom to sane bounds.
- (nice, optional) click a planet to **centre/lock** the view on it.

## 6. Styles (segmented, 3–4) — palette-driven render; the *positions never change*, only the look
Render must read from a `STYLES[style]` object (bg, ring colour, label colour+font, glow, furniture
defaults). Switching style must NOT move a planet.
- **Brass** *(default — the signature)* — antique mechanical orrery: warm brass/gold rings on a deep
  espresso/near-black field with a faint engraved/parchment vignette, serif labels, a fine engraved
  degree ring, Sun as a warm gilt boss. Should look like a museum instrument.
- **Blueprint** — cyan technical drawing on dark teal: thin precise rings, monospace labels,
  coordinate ticks, drafting feel. (Sibling to Firmament's Blueprint.)
- **Observatory** — near-black, crisp white furniture, true planet colours pop, a faint starfield
  behind (ties to Firmament). Modern + clean.
- *(optional 4th)* **Noir/Neon** — the workshop house look (dark + a single neon accent), if it earns
  its place; otherwise ship 3 excellent ones rather than 4 thin.

## 7. Performance / quality bar
- Steady **~60fps** with motion on (8 planets + orbits + moon + trails is trivially cheap).
- **Zero console errors/warnings.** Beautiful at desktop sizes; panel collapses gracefully on small
  screens; canvas resizes crisply on retina.
- No memory growth over minutes of play (cap trail buffers; no leaked listeners/timers).

## 8. Verification — self-verify in a UNIQUELY-NAMED agent-browser session (never the default tab)
This piece's gate is **astronomical accuracy**, so verification is stricter than the generators':

1. **J2000 self-test (built-in):** at `JD = 2451545.0` (T=0), each body's computed mean longitude
   `L` must equal the table `L0` to ≤1e-6°. Log a PASS/FAIL line to console (and a tiny on-page
   `✓ self-test` indicator is a nice touch). This catches gross algorithm errors.
2. **External ephemeris cross-check (the real gate):** for **today (2026-06-11, 00:00 UTC)** AND one
   other date (e.g. 2000-01-01 12:00 UTC), compute heliocentric ecliptic longitudes for **at least
   Mercury, Earth, Mars, Jupiter, Saturn** and compare to a reputable **read-only** source
   (JPL Horizons, theskylive.com heliocentric, in-the-sky.org, or an almanac). **Agreement must be
   within ~1.5°** (these approximate elements are good to arcminutes for inner planets, ~tens of
   arcmin for outer). Record the compared numbers (computed vs reference) in the report. If any
   planet is off by more than a couple degrees, a constant is wrong — re-fetch the JPL table and fix.
3. **Visual checks:** screenshot Schematic (default, Brass) — all 8 orbits legible, planets placed,
   Sun centred, labels clean. Switch each **style** & screenshot (look changes, *geometry identical*).
   Switch to **True scale** & screenshot (ellipses, inner-system bunching); zoom into the inner system.
   **Moon phase** for today matches reality (cross-check tonight's real phase). Play at a fast speed &
   confirm smooth ~60fps motion and that inner planets lap outer ones correctly (Mercury fastest).
   Hover a planet → info card with sane live numbers. **Now** button snaps to real date. Scrub the
   date → positions move smoothly; reverse time → planets run backward.
4. Console clean throughout; report fps, the cross-check table, and screenshot paths.

## 9. Deliverables
1. `orrery/index.html` — the instrument.
2. `orrery/README.md` — short, match `firmament/README.md` tone/length; note it's Firmament's sibling
   and that positions are *real* (JPL approximate elements), with the accuracy caveat.
3. `orrery/CHANGELOG.md` — build log (provenance + the verification cross-check numbers).
4. `orrery/thumb.png` — 16:9 screenshot of a gorgeous **Brass** orrery (orbits + planets + labels +
   Moon visible), ≤1440px wide, for a card/cross-link.

## 10. House rules
- One self-contained file; **no network/CDN/web-fonts** (system serif/sans/mono stacks only).
- Feel like a **sibling of Firmament** (panel styling, collapse, segmented controls, the celestial
  family) — but it's an *instrument*, not a generator: no seed, no re-roll; the input is **time**.
- Include both back-links: **`← workshop`** (`../index.html`, newest convention — copy Threshold's
  `<a class="back">`) and a small **sibling link to Firmament** (`../firmament/index.html`,
  e.g. "↗ Firmament — the sky this drives").
- **Do NOT edit other projects or the front-door `index.html`** — the front-door card / companion
  cross-link from Firmament is wired separately by the lead agent (keeps the curated front door at 9).
