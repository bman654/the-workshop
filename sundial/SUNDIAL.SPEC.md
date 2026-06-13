# The Gnomon — SUNDIAL.SPEC

## §0 — THE CRUX (the claim this instrument proves)

> **A sundial's shadow tells true clock time.**

The Gnomon is an operable sundial, not a picture of one. Its style (the gnomon's
shadow-casting edge) is cut to your latitude so it points at the celestial pole;
its hour-lines are laid out in **closed form** for the chosen dial type; and its
cast shadow falls on the hour-line for the Sun's true position. The shadow shows
**apparent solar time** (AST) — what the Sun actually does — and the page then
reconstructs the **civil clock** from it by adding three corrections:

```
civil = AST + EoT + longitudeCorrection + DST
```

and shows that the reconstructed civil time equals the wall clock you set. The
conversion is an exact inverse of `civilToAST`, so it **round-trips to the
second** over a 12,250-state battery (latitudes both hemispheres, five zones,
seven dates, DST on/off). That round-trip is the load-bearing assertion: a real
sundial, corrected properly, *is* a clock.

## §1 — One core, two callers

All the geometry and solar math live in **`tools/dial/dial.js`** — a dual-use
IIFE that attaches a `Dial` global in the browser and `module.exports = Dial`
under Node (byte-identical module guard to `tools/ws/ws.js`; forge strips that
one line at build). It is **DOM-free**.

- The shipped page **`sundial/index.html`** is built by forge, which inlines
  `dial.js` (and `ws.js`) verbatim: `node tools/forge/forge.mjs sundial/index.src.html`.
  The shipped artifact is still standalone — forge inlines at build time.
- The headless self-test **`tools/dial/dial.test.cjs`** `require()`s the same
  core. The in-page chip mirrors that test exactly, so the green chip count and
  `node tools/dial/dial.test.cjs` agree (21/21).

The solar functions (`julianDate`, `gmstDeg`, `lstDeg`, `EPS`,
`sunEclipticLonDeg`, `solarDec`, `solarRA`, `sunPosition`) are **copied verbatim**
from `astrolabe/index.html`'s CORE so the two instruments share one proven solar
model. A future agent may promote those ~40 lines to `tools/solar/solar.js` and
forge-inline into both.

## §2 — The math

Angles in radians unless a name says `*Deg`. Dial-local frame: origin at the
foot of the style, **+x** toward 3-o'clock / afternoon, **+y** up the noon line.

| quantity | formula |
|---|---|
| hour angle from AST | `H = (astMin − 720)·0.25°` (15°/hour; noon → 0) |
| hour-line, horizontal | `θ = atan(sinφ·tanH)` (via `atan2` for continuity) |
| hour-line, equatorial | `θ = H` (uniform 15°/hour, exact) |
| hour-line, vertical-S | `θ = atan(cosφ·tanH)` |
| gnomon style angle, horizontal | `|φ|` |
| gnomon style angle, equatorial / vertical-S | `90° − |φ|` (co-latitude) |
| equation of time | `EoT = 4·(L − α)` min, folded to (−20,+20) |
| longitude correction | `(lon − tzMeridian)·4` min; `tzMeridian = (tzOffsetMin/60)·15°` |
| civil → AST | `civil − DST − lonCorr − (eotOn?EoT:0)` |
| AST → civil | `ast + (eotOn?EoT:0) + lonCorr + DST` (exact inverse) |

`EoT` reaches **≈+16.45 min near Nov 3** and **≈−14.20 min near Feb 11**, with
zero-crossings near mid-Apr / mid-Jun / early-Sep / late-Dec — all within the
self-test's tolerances.

The **analemma** is the locus of the noon (civil 12:00, EoT applied) shadow-tip
across a year; because the clock is pinned at noon while EoT and the Sun's
declination wander, the tip traces the figure-8, with the solstices and
equinoxes marked.

## §3 — Self-test (`tools/dial/dial.test.cjs`, 21 checks, mirrored in-page)

1. round-trip clock: `civil → AST → civil` recovers the input to < 1 s (12,250 states);
2. shadow-tip lands on the closed-form hour-line (all 3 dial types, < 1e-5·r);
3. hour-line angles == closed form per type (horizontal `atan(sinφ·tanH)`,
   vertical `atan(cosφ·tanH)`, equatorial exactly uniform 15°/hour, θ==H);
4. EoT extrema within 30 s of the known bounds + zero-crossings near the four
   canonical dates;
5. gnomon style angle == latitude (horizontal) / co-latitude (equatorial,
   vertical-S);
6. solar-dec sanity (λ=0→0, 90→+EPS, 180→0, 270→−EPS);
7. apparent noon (H=0) → shadow on the 12-o'clock line for every type;
8. determinism + skin-invariance (geometry fingerprint stable per state,
   identical across the three skins).

## §4 — The page

Canvas, dpr-aware, dark-drafting "astrolabe" chrome. A sky strip carries the Sun
(by altitude/azimuth); the dial face shows the plate, numbered hour-lines, the
angled gnomon, and the live cast shadow with a glowing tip. The readout
reconstructs the civil clock from the shadow and reports whether it matches.

Controls: dial-type (Horizontal / Equatorial / Vertical-S), latitude −66..66°
(re-lays the hour-lines live), longitude, time zone, day-of-year, local clock
(+ drag the dial to scrub time), "Set to now", DST toggle, EoT toggle, "Plot
analemma", three palette-only skins (Brass / Blueprint / Stone), place presets,
Reset, 2× PNG, and `← workshop`. `WS.seen('sundial')` fires at parse time.

## §5 — Build & verify

```
node tools/dial/dial.test.cjs                 # 21/21, exit 0
node tools/forge/forge.mjs sundial/index.src.html
node tools/forge/forge.mjs --check --all      # green
```
