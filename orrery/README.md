# ☉ Orrery

*A faithful clockwork of the real Solar System — set it running and watch the planets wheel, or scrub
to any date and find where Mercury, Mars, or Saturn truly are tonight.*

A single self-contained HTML instrument (**zero dependencies** — double-click `index.html`) that plots
the eight planets (plus optional Pluto) on the ecliptic plane, the Sun glowing at the centre, each on
its real orbit. Unlike its sibling **Firmament** — which *re-rolls* an imagined night sky from a seed —
the Orrery has no seed and no re-roll: its only input is **time**. Positions are *real*, computed from
the JPL "Keplerian Elements for Approximate Positions of the Major Planets" (Standish, JPL Solar System
Dynamics). It's the mechanism behind the sky Firmament paints.

## Use it

Open `index.html`. It starts gently in motion. **Play/Pause** the clockwork, drag the **Speed** slider
(real-time → 10 yr/s, and into reverse to run time backwards), hit **⦿ Now** to snap to this instant,
or scrub the **Date** to anywhere from 1700 to 2200. **Scroll to zoom, drag to pan; hover a planet** for
live numbers.

- **Two scales:** *Schematic* (compressed spacing so all eight orbits read at once — the classic
  mechanical-orrery look) and *True scale* (real relative radii, true ellipses with correct eccentricity;
  the inner planets bunch near the Sun — zoom in to dive among them).
- **Three styles:** *Brass* (antique museum instrument — warm gilt rings on espresso, a gilded Sun),
  *Blueprint* (cyan technical drawing on teal — sibling to Firmament's Blueprint), *Observatory*
  (near-black with a faint starfield, true planet colours). Switching style never moves a planet.
- **Flourishes:** orbit paths, motion trails, an ecliptic-longitude graticule, labels, the Earth+Moon
  phase inset, a quiet zodiac band, and an optional Pluto (honestly labelled a dwarf).
- **Earth + Moon inset:** a tiny Moon pip shaded to tonight's *real* phase, with a readout
  (*"Moon · waning crescent, 23% lit"*) — the charming detail anyone can check against the actual sky.

## How it works

For a given date the model forms the Julian Date, advances each body's six orbital elements by the JPL
per-century rates, solves Kepler's equation (Newton iteration, in radians) for the eccentric anomaly,
places the body in its orbital plane, and rotates that into the J2000 ecliptic frame — yielding real
heliocentric coordinates, longitude, and distance. The render is purely palette-driven, so style and
scale change only the *look*, never a single position. The rAF loop runs only while playing or hovering
and stops dead when paused; trail buffers are capped, so it idles at near-zero CPU with no memory growth.

**Accuracy:** the approximate elements are best **1800–2050** (good to arcminutes for the inner planets,
tens of arcminutes for the outer); they degrade gracefully toward the 1700–2200 scrubber ends. Verified
on build against the canonical JPL element table and cross-checked against JPL Horizons — agreement within
**0.15°** for all eight planets on both today's date and J2000 (see `CHANGELOG.md`).

Built by Claude in its creative space, verified against a real ephemeris and play-tested in a real
browser before shipping. The celestial sibling of **Firmament**.
