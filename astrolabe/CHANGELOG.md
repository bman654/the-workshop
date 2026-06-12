# Astrolabe — changelog

## Build 1

First build. A genuine, operable planispheric astrolabe (north-pole
stereographic projection from the south celestial pole) — the workshop's 2nd
"working instrument" (sibling to Slipstick).

- **Math CORE** (single source of truth, shared by renderer + self-test):
  `rOfDec` / `decFromR` (the projection + its inverse), closed-form
  `almucantar`, closed-form `azimuthCircle`, `altAzToDecH` / `decHToAltAz`,
  `projDecH`, `julianDate` / `gmstDeg` / `lstDeg`, solar longitude/dec/RA +
  `sunPosition`, `eclipticCircle` / `eclipticPoint`, `zodiacOf`, a fixed
  40-star J2000 bright-star catalogue + `projStar`, and a skin-independent
  `geometryFingerprint`.
- **Renderer** (Canvas, 60fps): brass mater with engraved 24-hour limb;
  latitude-cut plate (tropics + equator day-circles, almucantar ladder with the
  horizon emphasized, azimuth arcs, meridian, zenith marker, day/night shading);
  rotating rete (ecliptic ring with the 12 zodiac ticks, magnitude-scaled star
  pointers with labels for the brightest, the Sun riding the ecliptic); an
  alidade across the disc.
- **Controls**: latitude / day-of-year / local-time / longitude sliders, Set to
  now, Reset, drag-the-disc-to-spin, a Spin animation (reduced-motion aware),
  4 presets, 3 cosmetic skins, a plain-language live readout, and untainted
  2× PNG export.
- **Self-test**: 18/18 green in-browser and under Node. Almucantars verified
  exact to `<1e-5·Req`; projection proven a bijection; Sun lands on its own
  almucantar; fingerprint deterministic and identical across all skins.
- Breadcrumb `ws:seen:astrolabe` (guarded). No audio. ~1335 lines.

Browser battery (agent-browser, served origin): chip green 18/18; console clean
(0 errors / 0 warnings / 0 page-errors) across load, every slider, every preset,
all 3 skins, spin on/off, Set to now, Reset, disc-drag, and PNG export;
fingerprint identical across skins; PNG a valid ~271 KB untainted data URL;
readout physically sane (Midsummer-midnight Sun below horizon; equinox-sunrise
Sun on the horizon ≈ due east).

### Build 1 — southern-hemisphere fix (lead audit)

An independent first-principles Node re-audit (48 fresh assertions vs. known
astronomy + projection invariants, NOT the file's own test) swept latitudes the
build test had missed and found a real bug: the closed-form `almucantar` radius
went **negative for southern (φ<0) latitudes** when `sin(φ)+sin(alt) < 0`, so a
southern plate's almucantars were wrong (and the draw guards left them blank).
Root cause: the formula's center `cy` is exact for every latitude, but the
radius is a *magnitude* — `r = |Req·cos(alt)/(sin φ + sin alt)|`. One-line fix
(abs the radius). Worst almucantar error then drops from ~2.3e4 px to ~6e-10 px
across both hemispheres (φ −66…66). The file's own self-test was hardened to
sweep **10 latitudes N&S** (was 5, all northern) so the gap cannot regress; it
also skips the equator's horizon (φ=0, alt=0), which is correctly a straight
line (infinite radius), not a circle. Re-verified: Node self-test 18/18, lead
audit 48/48, in-browser chip 18/18, lat −52 plate renders a correct full
astrolabe (Canopus/Achernar/Hadar now in play), skin-invariant, PNG untainted,
console clean. Canonical fingerprint (lat 40, 2026-06-21T04:00Z) unchanged at
`3ff48c40`.
