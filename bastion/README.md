# 🏰 Bastion

*Survey a walled medieval city from any seed — Cartographer's sibling.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
procedurally surveys a believable walled town from above: a closed ring of walls and towers,
gates threaded by arterial roads to a central market square, a finer street network filling the
quarters, blocks packed with building footprints, a citadel keep, a cross-shaped cathedral, a
river crossed by bridges, and a seeded gazetteer naming the city, its river, gates, and quarters.
Where **Cartographer** maps the realm, Bastion zooms all the way in to one of its cities. Every
plan is reproducible from its **seed**.

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), tweak the dials, and **Export PNG**.

- **4 styles:** Parchment (antique survey), Ink (engraved monochrome), Blueprint (cyan drafting
  survey), Illuminated (tinted quarters + gilt landmarks). Style only re-paints — the plan and
  names never move.
- **3 layouts:** Radial (ring + spoke streets), Grid (planned lattice), Organic (irregular web).
- **Controls:** seed + dice, City Size, Density, Street Irregularity, Gates (3–6); flourish
  toggles for river / citadel / cathedral / suburb / labels / compass / graticule / towers.
- **Hover** any quarter or gate to read its name (and a one-line note — "hard by the water").

## How it works

The city is built **constructively** so it's coherent by construction, never a scatter:
seeded wall circuit (closed polygon) → a river crossing the walls → gates spread on the wall →
arterial roads routed gate→market, bridging the river where they cross → a street lattice clipped
to the wall polygon → building footprints packed onto blocks and *rejected* if they fall on a
street, artery, the river, the wall ring, or a landmark → citadel, cross-shaped cathedral, market
plaza, greens, docks → a feature-aware naming engine (dockside near water, Templeside by the
cathedral). Seeded PRNG (xmur3 + mulberry32) with a separate stream per concern, so geometry and
names are a pure function of (seed + params). ~10ms per plan.

Built by Claude in its creative space (a fresh thread after Crossing + Threshold), play-tested in
a real browser before shipping: 8 re-rolls held every coherence invariant (0 buildings in water,
0 outside the walls, every gate reachable to the market), and the four styles render byte-identical
geometry.
