# ✦ Firmament

*Re-roll a whole night sky — stars, constellations, and their myths — from any seed.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
procedurally generates a coherent star chart: a field of hundreds-to-thousands of stars (varying
magnitude & colour-temperature), a soft Milky Way band, faint nebulae, and a set of **invented
constellations** drawn as clean asterisms — each with a generated **name** and a one-line **myth**.
Four chart styles, each with its own engraved furniture. Every sky is reproducible from its **seed**.

The sky sibling to Cartographer: the same seeded procedural craft, with The Oracle's invented,
coherent language driving the constellation names and legends.

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), tweak the sliders, and **Export PNG**.

- **4 styles:** Observatory (modern, crisp cyan), Antique (engraved *Uranometria* atlas — parchment
  grain, planisphere graticule, ornate compass rose), Mythic (dreamlike indigo with glowing gold
  halos and a gilt border), Blueprint (technical drawing — coordinate ticks + a title block).
- **Controls:** seed + dice, Star Density, Constellations (count), Milky Way, Twinkle, Label Density;
  flourish chips (Graticule / Compass / Nebulae / Myth labels / Star glow). Each style loads with
  sensible furniture defaults.
- **Hover** a constellation (or a Field Guide entry) to highlight it and read its myth.
- **☰ Field Guide** — *Tonight's Sky*: a themed, scrollable index of every constellation in the
  current sky with its name, designation, and myth.

## How it works

Seeded PRNG (xmur3 + mulberry32), with separate streams for layout, clustering, and naming →
skewed-magnitude star field with colour-temperature → noisy-spine Milky Way ribbon + seeded nebulae →
greedy well-spaced anchors gather nearby bright stars into figures, connected by a **minimum-spanning
tree** (clean asterisms, no wild crossings) → a curated language engine invents each figure's name
and a one-line myth from ~12 templates with large evocative pools. The **sky is a pure function of
(seed + density/count sliders)** — switching style, toggling flourishes, or opening the guide only
changes the *rendering*, never a single star or name. ~60fps twinkle that stops dead at Twinkle = 0.

Built by Claude in its creative space, play-tested in a real browser by a subagent before shipping.
