/* ═══════════════════════════════════════════════════════════════════════════
   sky-core.mjs — the Front Gate's self-contained sky math (Sun + Moon phase).

   Purpose
   -------
   The animated front gate renders, at night, the MOON with its ACCURATE phase
   for the user's current date. This module is the pure-math heart of that: no
   browser, no UI, no canvas — just dates in, ecliptic longitudes and a phase
   description out. The gate's render code consumes `moonPhase()` + `terminator()`
   to paint the disc; a Node test pins the numbers so the phase can never silently
   drift.

   DUAL-USE
   --------
   This file is BOTH a Node ES module AND a browser slab:
     • In Node it `export`s its API (used by sky-core.test.mjs).
     • When the estate's forge tool inlines it into a page, forge strips the
       leading `export ` keyword off each declaration (see tools/forge/forge.mjs
       `stripModuleGuard`), leaving plain top-level declarations. To stay usable
       in the browser after that strip, we ALSO attach the whole API to a global,
       `globalThis.GateSkyCore`, guarded so it is harmless in Node. This mirrors
       the estate's pattern (tools/sky/sky.js:579-583, tools/ws/ws.js).
   Self-contained: it imports nothing at runtime. The small bits of orrery math
   it needs (Julian Date, the abridged lunar series) are copied in below.

   ── THE "MOON 180°" FIX ───────────────────────────────────────────────────
   The orrery's `moonPhase(JD, earthLon)` (orrery/index.src.html ~line 392-394)
   is fed Earth's HELIOCENTRIC ecliptic longitude and internally derives the
   Sun's GEOCENTRIC longitude by adding 180°:
         const ls = wrap360(earthLon + 180);
   That +180 is correct ONLY when the input is the heliocentric Earth longitude
   (Sun-as-seen-from-Earth is exactly opposite Earth-as-seen-from-Sun). If a
   caller instead hands it a geocentric Sun longitude, the extra +180 flips every
   phase by half a cycle — every full moon renders as new.
   THIS module sidesteps that entirely: `sunLongitude(JD)` returns the Sun's
   GEOCENTRIC apparent longitude directly (Meeus, Astronomical Algorithms ch.25),
   and `moonPhase` takes the elongation = moonLongitude − sunLongitude with NO
   +180 anywhere. New→New, Full→Full. The test file proves it on real J2000
   lunar events.

   Formula provenance: Jean Meeus, "Astronomical Algorithms" (2nd ed.) —
   ch.25 (solar coordinates, low precision), ch.47 (lunar position, abridged),
   ch.7 (Julian Day). These low-precision series are accurate to a fraction of a
   degree over the modern era — far better than a phase pip needs.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── named constants (no magic numbers) ─────────────────────────────────── */
const DEG = Math.PI / 180;            // degrees → radians
const RAD = 180 / Math.PI;            // radians → degrees
const J2000 = 2451545.0;              // Julian Date of the J2000.0 epoch (2000-01-01 12:00 TT)
const DAYS_PER_JULIAN_CENTURY = 36525.0;
const SYNODIC_MONTH = 29.530588853;   // mean synodic (new-moon to new-moon) period, days
const FULL_CIRCLE = 360;
const HALF_CIRCLE = 180;
const PHASE_BIN = FULL_CIRCLE / 8;    // 45° — each of the 8 named phases spans one bin,
const PHASE_HALF_BIN = PHASE_BIN / 2; // …centred on 0/45/90/…; the cardinal points sit at bin centres.

/* ── angle helpers ──────────────────────────────────────────────────────── */
// Wrap an angle in degrees into [0, 360).
function wrap360(d) { d %= FULL_CIRCLE; return d < 0 ? d + FULL_CIRCLE : d; }
// Wrap an angle in degrees into [-180, 180].
function wrap180(d) { d = wrap360(d); return d > HALF_CIRCLE ? d - FULL_CIRCLE : d; }

/* ───────────────────────────────────────────────────────────────────────────
   julianDate(date) → Julian Date (UTC).
   Fliegel–Van Flandern integer JDN plus the UTC time-of-day fraction (the JD day
   rolls over at noon UTC, hence the −12h offset). Copied from orrery
   index.src.html:313-321. Throws on a non-Date / invalid (NaN) Date so a bad
   caller fails loud rather than producing a silent-garbage phase.
   ─────────────────────────────────────────────────────────────────────────── */
export function julianDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('julianDate: expected a valid Date');
  }
  const Y = date.getUTCFullYear(), M = date.getUTCMonth() + 1, D = date.getUTCDate();
  const a = Math.floor((14 - M) / 12), y = Y + 4800 - a, m = M + 12 * a - 3;
  const JDN = D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
            - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const frac = (date.getUTCHours() - 12) / 24 + date.getUTCMinutes() / 1440
             + date.getUTCSeconds() / 86400 + date.getUTCMilliseconds() / 86400000;
  return JDN + frac;
}

/* ───────────────────────────────────────────────────────────────────────────
   sunLongitude(JD) → the Sun's GEOCENTRIC apparent ecliptic longitude, degrees,
   in [0, 360). Meeus ch.25 "low accuracy" solar position: geometric mean
   longitude L0 plus the equation of centre C evaluated at the Sun's mean anomaly.
   (We omit the ~0.005° nutation/aberration correction — negligible for a phase.)
   This is the geocentric Sun direction DIRECTLY — the whole point of the 180° fix:
   no heliocentric-Earth longitude, no +180 anywhere downstream.
   ─────────────────────────────────────────────────────────────────────────── */
export function sunLongitude(JD) {
  const T = (JD - J2000) / DAYS_PER_JULIAN_CENTURY;          // Julian centuries from J2000
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; // geometric mean longitude (deg)
  const M  = 357.52911 + 35999.05029 * T - 0.0001537 * T * T; // Sun's mean anomaly (deg)
  const Mr = M * DEG;
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)   // equation of centre
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           +  0.000289 * Math.sin(3 * Mr);
  return wrap360(L0 + C);                                    // true geometric longitude
}

/* ───────────────────────────────────────────────────────────────────────────
   moonLongitude(JD) → the Moon's GEOCENTRIC apparent ecliptic longitude, degrees,
   in [0, 360). Abridged Meeus ch.47 series (the orrery's 10-term version,
   index.src.html:371-390): mean longitude Lp plus the ten largest periodic terms
   in the Moon's mean elongation D, the Sun's mean anomaly Ms, the Moon's mean
   anomaly Mp and its argument of latitude F. Good to well under a degree — ample
   for a phase pip (which depends only on the Moon−Sun elongation).
   ─────────────────────────────────────────────────────────────────────────── */
export function moonLongitude(JD) {
  const T  = (JD - J2000) / DAYS_PER_JULIAN_CENTURY;
  const Lp = 218.3164477 + 481267.88123421 * T;   // Moon mean longitude
  const D  = 297.8501921 + 445267.1114034  * T;   // mean elongation (Moon − Sun)
  const Ms = 357.5291092 +  35999.0502909  * T;   // Sun mean anomaly
  const Mp = 134.9633964 + 477198.8675055  * T;   // Moon mean anomaly
  const F  =  93.2720950 + 483202.0175233  * T;   // Moon argument of latitude
  const lon = Lp
    + 6.288774 * Math.sin(Mp * DEG)
    + 1.274027 * Math.sin((2 * D - Mp) * DEG)
    + 0.658314 * Math.sin(2 * D * DEG)
    + 0.213618 * Math.sin(2 * Mp * DEG)
    - 0.185116 * Math.sin(Ms * DEG)
    - 0.114332 * Math.sin(2 * F * DEG)
    + 0.058793 * Math.sin((2 * D - 2 * Mp) * DEG)
    + 0.057066 * Math.sin((2 * D - Ms - Mp) * DEG)
    + 0.053322 * Math.sin((2 * D + Mp) * DEG)
    + 0.045758 * Math.sin((2 * D - Ms) * DEG);
  return wrap360(lon);
}

/* The eight standard phase names, in cycle order starting at New (elongation 0). */
const PHASE_NAMES = [
  'New',              // 0   — bin centred on 0/360
  'Waxing Crescent',  // 45
  'First Quarter',    // 90
  'Waxing Gibbous',   // 135
  'Full',             // 180
  'Waning Gibbous',   // 225
  'Last Quarter',     // 270
  'Waning Crescent',  // 315
];

/* ───────────────────────────────────────────────────────────────────────────
   moonPhase(JD) → {
     age,                 // days since the most recent new moon (0 .. ~29.53),
                          //   = elongation/360 × synodic month (an approximation
                          //   from the geometric phase, not a true mean-conjunction age).
     phaseAngle,          // the Moon−Sun ELONGATION in degrees, [0, 360):
                          //   0 = new, 90 = first quarter, 180 = full, 270 = last quarter.
     illuminatedFraction, // fraction of the disc lit, [0, 1] (the orrery's "moonK").
     phaseName,           // one of the eight PHASE_NAMES.
     waxing,              // true while the lit fraction is growing (elongation < 180).
   }

   Elongation is computed GEOCENTRICALLY and DIRECTLY — moonLongitude − sunLongitude,
   normalized to [0, 360), with NO +180 correction (THE FIX). The illuminated
   fraction follows from the phase angle by k = (1 − cos elongation)/2 (Meeus
   ch.48; here we treat the Sun−Moon elongation as the phase angle's supplement,
   which is exact at the cardinal points and within a fraction of a percent in
   between — fine for a rendered pip).
   ─────────────────────────────────────────────────────────────────────────── */
export function moonPhase(JD) {
  const lm = moonLongitude(JD);
  const ls = sunLongitude(JD);
  const elongation = wrap360(lm - ls);                       // 0 new · 90 1Q · 180 full · 270 LQ
  // Clamp guards against tiny FP overshoot so the contract [0,1] always holds.
  const illuminatedFraction = Math.min(1, Math.max(0, (1 - Math.cos(elongation * DEG)) / 2));
  const waxing = elongation < HALF_CIRCLE;                   // growing toward full

  // Name from the 8 bins, each PHASE_BIN (45°) wide and centred on a cardinal angle:
  // shift by a half-bin so e.g. [348.75, 360)∪[0, 11.25) all map to "New".
  const idx = Math.floor(wrap360(elongation + PHASE_HALF_BIN) / PHASE_BIN) % PHASE_NAMES.length;
  const phaseName = PHASE_NAMES[idx];

  const age = (elongation / FULL_CIRCLE) * SYNODIC_MONTH;    // approx days since new moon

  return { age, phaseAngle: elongation, illuminatedFraction, phaseName, waxing };
}

/* ───────────────────────────────────────────────────────────────────────────
   terminator(illuminatedFraction, waxing) → pure DATA for drawing the phase.

   This is the orrery's drawMoonPhase geometry (index.src.html:932-959) expressed
   as renderer-agnostic numbers, so the gate's canvas/SVG code can draw the lit
   region without re-deriving the geometry.

   Model: draw the disc in a frame whose +x axis points toward the Sun. The lit
   region is the +x semicircle closed off by a HALF-ELLIPSE terminator whose
   semi-minor axis along x is signed:
         curvature = 1 − 2·illuminatedFraction        (in units of the disc radius)
   so the terminator's x-extent is |curvature|·radius and:
       curvature > 0 (crescent, k < 0.5): terminator cuts INTO the lit (+x) side.
       curvature < 0 (gibbous,  k > 0.5): terminator bulges toward the dark (−x) side.
       curvature = 0 (quarter,  k = 0.5): terminator is a straight diameter.

   Returns {
     illuminatedFraction, // echoed back, clamped to [0,1]
     litSide,             // 'right' when waxing (lit limb on the east/right) else 'left'.
                          //   The renderer mirrors the +x-toward-Sun frame onto this side.
     curvature,           // signed terminator semi-width ÷ radius, in [-1, 1] (above).
     terminatorBulge,     // signed sense of the bulge: +1 toward dark (gibbous),
                          //   −1 into lit (crescent), 0 at quarter. = sign(curvature).
     isFull,              // k ≥ 0.996 — fully lit; renderer may skip the terminator.
     isNew,               // k ≤ 0.004 — effectively dark; renderer may draw earthshine only.
   }
   CONTRACT: the caller positions the disc and decides screen orientation; this
   returns only the phase-geometry scalars. `litSide` collapses the waxing flag to
   the conventional Northern-Hemisphere lit edge; a renderer that wants the raw
   Sun-direction angle can ignore litSide and rotate by its own sunDir as the
   orrery does.
   ─────────────────────────────────────────────────────────────────────────── */
export function terminator(illuminatedFraction, waxing) {
  const k = Math.min(1, Math.max(0, illuminatedFraction));  // clamp to the contract
  const curvature = 1 - 2 * k;                              // signed semi-width ÷ radius
  return {
    illuminatedFraction: k,
    litSide: waxing ? 'right' : 'left',
    curvature,
    terminatorBulge: Math.sign(curvature),                 // +1 dark-bulge, -1 lit-cut, 0 straight
    isFull: k >= 0.996,
    isNew: k <= 0.004,
  };
}

/* ── the public API, as one object (for the browser global) ─────────────── */
const GateSkyCore = { julianDate, sunLongitude, moonLongitude, moonPhase, terminator };

/* Browser slab: after forge strips the `export ` keywords above, the declarations
   remain as plain top-level functions, and THIS attaches them to a global so the
   gate's page can call `GateSkyCore.moonPhase(...)`. Guarded so it is inert and
   harmless under Node (where `globalThis` exists but nothing reads the global). */
if (typeof globalThis !== 'undefined') {
  globalThis.GateSkyCore = GateSkyCore;
}

/* Also export the bundle for callers that prefer a namespace import in Node. */
export default GateSkyCore;
