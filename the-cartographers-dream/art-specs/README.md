# The Cartographer's Dream — art specs

All creative assets in this room are forged **in-house, in code** (no forage). This room's art was
hand-crafted directly by the builder (the visuals are canvas gradients + in-code value-noise +
procedural paths; the sounds are `Gate.sfx` WebAudio builders) rather than routed through the art
foundry — each asset is a shape/gradient/path or a synth graph well within one maker's reach. These
files record the art-direction CONTRACT for each, so a future re-soul or tune knows the intent.

## Visual layer (in `index.src.html` + `land-render.mjs`)

- **The drawn land** (`land-render.mjs`) — a warm sepia ANTIQUE CHART on aged vellum: hillshaded biome
  raster (NW light), inked coastlines, tapering flow-accumulated rivers, hand-drawn back-to-front
  mountain glyphs with a lit NW face + shadowed SE face + snow caps on the big peaks, ink settlement
  dots (capitals as ringed stars). It is rendered ONCE per seed; the lantern never redraws it.
- **The fog** (`bakeFog`) — warm parchment (`#d8c9a6`→`#cbb892`) under a cooler blue-grey radial haze
  (stronger toward edges) + a faint value-noise tooth grain (multiply) + a larger fibrous mottle
  (overlay). Baked once per seed.
- **The lantern pool** (`drawLantern`) — a warm radial glow (golden `rgba(255,225,150)` core → amber →
  nothing at ~R px) drawn `lighter`, plus a tiny bright flame core; a slow value-noise candle flicker
  (±3% radius, ±10% opacity). Used as the reveal MASK.
- **The wet-nib bloom** (`drawWetFrontier`, beat A) — a per-cell `wetAge` timer: a cell crossing ~0.15
  exposure renders a darker sepia bleed-halo (`rgba(74,55,24)` radial) for ~600ms, then dries.
- **Names lettering themselves in** (`drawTracedLabel`, beat B) — a left→right clip advancing over each
  placed label's letter-spaced serif/portolan hand, the glyph at the reveal frontier darkened (wet tip),
  a soft parchment halo for legibility. Triggered per label once its anchor cell passes an exposure gate.
- **Sea-serpents + "here be —" flourishes** (`drawSerpent`, `drawFogCreatures`) — in-code procedural
  paths seeded per world in big unmapped-water clusters; they drift (unless reduced-motion) and dissolve
  (`1-smoothstep(localExposure)`) as lit.
- **The compass rose** (`drawCompass`) — a faint double-ring + tick rose with a two-tone needle; wanders
  toward the sweep direction while moving, eases to true north (gold when locked) at rest.
- **The cartouche** (`drawCartouche`) — a hand-drawn ribboned double-border title frame with rolled ends;
  its opacity fills with lit-land fraction; letters the world's grand title (arc-length trace) at ~36%.

## Sound layer (`Gate.sfx`)

See **`sfx.md`**. Three in-house WebAudio builders, muteable via the shared `ws:pref:muted`, unlocked on
the first user gesture; audio-lens verified (no clipping; right character).
