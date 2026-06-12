# Astrolabe — spec

A genuine, operable **planispheric astrolabe**: the medieval "computer of the sky."
Set date + time + latitude (+ longitude), and read the sky off the rotating
**rete** over the latitude-cut **plate**. One self-contained vanilla
HTML/CSS/JS file, zero dependencies, zero network, **no audio**. The workshop's
2nd "working instrument" (sibling to Slipstick).

`astrolabe/index.html` · runs from `file://` and over http.

## The construction

Classical **north-pole planispheric astrolabe** = stereographic projection of
the celestial sphere onto the plane of the equator, projecting **from the south
celestial pole**.

- Obliquity `EPS = 23.4392911°`.
- **Stereographic radius** for declination δ: `rOfDec(δ) = Req · tan((π/2 − δ)/2)`.
  - δ=+90° (N pole) → 0 (center); δ=0 (equator) → `Req`; δ=−EPS (Tropic of
    Capricorn) → the outer mater rim; δ=+EPS (Cancer) → innermost tropic.
  - Inverse: `decFromR(r) = π/2 − 2·atan(r/Req)` (a faithful bijection).
- **Almucantar** (circle of equal altitude `alt` on a plate cut for latitude φ)
  is a true circle (closed form, Morrison):
  `cx=0`, `cy = Req·cos φ / (sin φ + sin alt)`, `r = |Req·cos alt / (sin φ + sin alt)|`.
  `alt=0` → the **horizon** circle; `alt=90°` → the **zenith** point at `(0, rOfDec(φ))`.
  The center `cy` is exact for every latitude; the **radius is a magnitude** (the
  `sin φ + sin alt` denominator goes negative for southern, low-altitude cases, so
  the abs keeps the same circle exact in both hemispheres). At φ=0, alt=0 the
  denominator is 0 — the equator's horizon is a straight line through the center
  (infinite radius), handled as a special case by the renderer (and skipped by the
  self-test, which only asserts *circles*).
- **Azimuth circles** (constant azimuth A): also circles. Derived in closed form
  from the fact that every azimuth circle passes through both the zenith
  `(0, rOfDec(φ))` and the nadir `(0, −rOfDec(−φ))`; center on the perpendicular
  bisector of that meridian chord, displaced `cx = half/tan A`, `r = |half/sin A|`.
- **Projection of a star** at (RA, dec): `r=rOfDec(dec)`; hour angle `H = LST − RA`;
  plate point `x = r·sin H`, `y = r·cos H`. The H=0 (south meridian) point is +y
  (drawn at the bottom — classical south-at-bottom orientation). The whole rete
  rotates rigidly with **sidereal time**.
- **Ecliptic**: a small circle of the sphere → projects to a circle on the rete.
  In the unrotated rete frame (vernal equinox at +y) its diameter lies on the
  x-axis: `cx=(r(+EPS)−r(−EPS))/2`, `r=(r(+EPS)+r(−EPS))/2`. The equinoxes sit on
  the equator (r=Req); the solstices touch the two tropics.
- **Sun on the ecliptic**: low-precision solar longitude `λ(JD)` (≈0.01°), then
  `sin(dec)=sin(EPS)·sin λ`, `RA=atan2(cos EPS·sin λ, cos λ)` (quadrant-correct).
- **Sidereal time**: `GMST = 280.46061837 + 360.98564736629·(JD−2451545.0)` (deg,
  mod 360); `LST = GMST + east-longitude`. The rete angle is driven by LST.

## Single source of truth

All of the above lives in one frozen `CORE` module. **Both** the Canvas renderer
**and** the headless `runSelfTest()` call these same functions — no parallel copy.
Skins are CSS-var palettes only and are *not* parameters of any geometry function;
`geometryFingerprint(state)` (an FNV-1a hash of every drawn circle's center/radius
+ ecliptic + Sun + all star xy) is byte-identical across skins.

## The crux — self-test (green chip, never red; passes in-browser AND under Node)

18 assertions:

1. **Almucantar exactness** — for 5 latitudes × 5 altitudes, sampled alt/az points
   lie on the closed-form circle to `<1e-5·Req`.
2. **Zenith inside horizon**; **due-east horizon point on the horizon circle**.
3. **Equator radius == Req** exactly; **Capricorn > equator > Cancer** ordering.
4. **Solar declination** at the 4 cardinal ecliptic longitudes (0→0, 90→+EPS,
   180→0, 270→−EPS).
5. **Bijection** `decFromR(rOfDec(dec)) == dec` (<1e-12) over a dec sweep;
   **horizon round-trip** altAz→decH→altAz; **physical inverse** — the Sun lands
   on its own almucantar (its altitude read two independent ways agrees).
6. **Determinism** (same state → same fingerprint) and **skin invariance**
   (fingerprint identical across all 3 skins).
7. **Catalogue sanity** — all stars project finite; Polaris within ~1.3% of center.
8. **Ecliptic ring** passes through both solstice points and both equinoxes
   (equinoxes on the equator circle).

## Controls

- **Latitude** −66..+66 (recuts the plate live).
- **Day of year** 0..365 (moves the Sun along the ecliptic).
- **Time (local)** 0..1439 min, and **Set to now** (real clock).
- **Longitude** −180..+180 (drives LST / the "local time" zone).
- **Drag the disc** to spin the rete (sets the time directly).
- **Spin** toggle — advances time so you watch the sky turn (respects
  `prefers-reduced-motion`: slower when reduced).
- **Presets**: Equinox sunrise · Midsummer midnight · Polaris at the pole ·
  London tonight.
- **3 cosmetic skins**: Brass / Blueprint / Paper (palette only).
- **Live readout**: Sun's zodiac sign + altitude + above/below horizon +
  day/twilight/night phase; Sun az + dec; sidereal time; stars-above-horizon
  count; date.
- **Export 2× PNG** — canvas-native, background painted (no taint, no
  foreignObject).

## Breadcrumb

`localStorage['ws:seen:astrolabe']='1'` (try/catch-guarded for `file://`).
No Undercroft / hidden-world content is built here — just the breadcrumb.
