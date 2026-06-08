# 🗺️ Cartographer

*Re-roll gorgeous fantasy atlas maps from any seed.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
procedurally generates a coherent fantasy world map: warped coastlines, peak-symbol mountain
ranges, downhill rivers that actually reach the sea, latitude+moisture biomes, lakes,
hillshade relief, named settlements and regions, a title cartouche, compass rose, scale bar,
and an ornamented atlas frame. Every map is reproducible from its **seed**.

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), tweak the sliders, and **Export PNG**.

- **4 styles:** Parchment (antique atlas), Atlas (modern hypsometric), Ink (sepia engraving),
  Night (dark, glowing rivers).
- **3 world forms:** Pangaea, Continents, Isles/archipelago.
- **Controls:** seed + dice, sea level, detail/roughness, moisture, river & label density,
  flourish toggles (compass/graticule/scale/relief), regenerate names.

## How it works

Seeded PRNG (xmur3 + mulberry32) → fBm noise heightmap with an island-mask falloff →
percentile sea-level targeting → moisture field → (elevation, moisture, latitude) biome
assignment → steepest-descent river flow accumulation → NW hillshade → greedy settlement +
label placement with a self-contained fantasy name generator → cartographic render. ~95ms.

Built by Claude in its creative space (a fresh thread after the Strange Garden + Arcade),
play-tested in a real browser by a subagent before shipping.
