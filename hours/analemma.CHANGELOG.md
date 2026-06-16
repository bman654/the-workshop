# The Analemma — CHANGELOG

A touchable bench in **The Hours** wing (`hours/analemma.html`): stamp a year of clock-noon suns onto a
night sky-wall and watch them trace a glowing figure-8 — the **analemma**. The loop is shown as the
**sum of two clocks you pull apart** with two cause-knobs: the *tilt of the axis* (which alone draws a
symmetric 8) and the *stretch of the orbit* (which alone draws a lopsided oval). Kill both causes and the
year collapses to a single dot. Stands on the wing's **solar core** — the SAME proven sun The Honest
Sundial keeps.

## v1 — #78 (2026-06-16)

The wing's reserved equation-of-time / analemma plinth, built. (Bloomed from the `analemma` garden seed
at cycle #78.)

**The piece.** A night sky-wall (`<canvas>`): the vertical axis is the sun's **declination** (±23.4°, the
47° N–S swing), the horizontal axis the **equation of time** in minutes (stretched ~×3–4 for legibility,
the factor stated honestly on the wall). A faint **plumb line** marks clock-noon (x = 0) — the meridian
the sun crosses only on the 4 days it agrees with the clock.

- a hairline brass **ghost** is the canonical real-8, the answer key (e = 0.0167, ε = 23.44°);
- the warm **live blend** is the year stamped from the current knobs; a scrub leaves a dimming **burn-in
  trail** so you watch the sun draw the loop;
- a **leader-line** runs from the plumb line to the live sun — you see the EoT *gap* collapse into a placed sun.

**The two cause-knobs** (keyboard-accessible `role=slider`, snap-detents at 0 / real / 2×):

- **ECCENTRICITY** — scales the orbit's stretch (a little orbit glyph: a circle stretches to an ellipse,
  a bead races at perihelion). Alone (ε = 0) it draws a flat **oval**, lopsided because the Earth races at
  perihelion; no declination, no vertical extent.
- **AXIAL TILT** — scales the obliquity 0° → 23.4° → 40° (an Earth-axis glyph leaning). Alone (e = 0) it
  draws a **symmetric 8**, its two lobes equal.

Two preset chips — **kill the orbit** (e → 0) and **kill the tilt** (ε → 0) — name what was removed; a
**run the year** auto-trace (~16 s) draws the figure-8 once on load, and honours `prefers-reduced-motion`
(jumps straight to the finished loop + a static date slider, no crawl). A readout strip rides along (date ·
signed EoT · its orbit + tilt component minutes · declination), but the loop IS the readout.

**The math (the one source of truth).** `analemma-core.mjs` is the sole solar authority; the page inlines
it byte-identical between sentinels, and a Node twin (`analemma-core.test.mjs`) + the in-page pill run the
SAME checks. The core is a faithful PARAMETERIZATION of the Gnomon dial's proven sun (`tools/dial/dial.js`):
it scales the dial's literal equation-of-centre coefficients by an eccentricity ratio `eR = e/E0`, so at
the canonical detent (eR = 1, ε = EPS0) it reduces **bit-for-bit** to `dial.equationOfTimeMin` /
`dial.solarDec` (measured |Δ| = 4.6e-13 min, 0 deg). The page can never disagree with The Honest Sundial
about the sun.

**Proved (17/17 GREEN, Node twin + in-page pill):**

1. **dial parity (keystone):** `eotMin(eR=1, EPS0)` === `Dial.equationOfTimeMin` and `solarDecDeg` ===
   `Dial.solarDec`, all 365 days, |Δ| < 1e-9 (the Node twin checks against the REAL `dial.js`, `require()`d).
2. **decomposition exact:** `eccTermMin + oblTermMin` === `eotMin` every day, |Δ| ≤ 1e-9 min (worst = 0.0).
3. **real extrema on the calendar:** +16.45 min @ Nov 3, −14.20 min @ Feb 11, exactly 4 zero-crossings,
   declination ±23.44°.
4. **ecc-only / obl-only:** ε = 0 → flat oval (±7.66 min, dec span 0); eR = 0 → symmetric 8 (±9.87 min,
   ‖max|−|min‖ < 0.05, dec ±23.44°).
5. **negative control:** eR = 0 AND ε = 0 → max|EoT| < 1e-9, dec ≡ 0, the year's bounding box < 1e-9 → one
   point, no loop. (Defeats "you just drew a figure-8": remove both causes and it vanishes.)
6. **re-extraction parity:** the page's inline core IS `analemma-core.mjs`, byte-for-byte (export-stripped).

**What it does NOT claim.** The low-precision almanac sun (the dial's own ~0.01° series), a fixed 2026
calendar, longitude 0 / UTC noon, mean obliquity. The two knobs scale the physical causes faithfully but are
a MODEL, not an ephemeris — the SHAPE the two clocks make, not arc-second astrometry.

**Files.** `hours/analemma.html` (the bench, core inlined between sentinels + pill) · `hours/analemma-core.mjs`
(the sole solar authority) · `hours/analemma-core.test.mjs` (the Node twin) · this changelog. Landing
(`hours/index.html`): the reserved equation-of-time/analemma plinth converted to a real linked, lit card
(bench-count 2 → 3); the seed bay trimmed to the escapement plinth; the hero's static analemma flourish lit
as a clickable teaser into the bench. Sets `ws:seen:analemma` on boot.
