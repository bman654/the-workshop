# Firmament — Changelog

## Stage 2 — Polish, bespoke furniture, field guide, deliverables

Added the per-style chart furniture, the field-guide index, and legibility polish.
**The generation pipeline was not touched** — the sky stays a pure function of
(seed + Star-Density + Constellations). Style, flourishes, and the field guide are
render-only; the cross-style sky invariant from Stage 1 still holds.

### Per-style furniture (resolved all `TODO(stage2)` markers)
- **Graticule, branched by style** via `STYLES[...].graticule`:
  - **Planisphere** (Antique/Mythic) — circular limb/horizon ring (double rule), 24 radial
    hour-lines (cardinal axes stronger), concentric declination circles, and an hour/degree
    tick comb on the rim. Mythic renders it with a soft accent glow.
  - **Rectangular grid** (Observatory/Blueprint) — the subtle RA/Dec grid; Blueprint additionally
    draws a drafted frame with **coordinate ticks + RA(h)/Dec(°) edge labels** (`coordTicks`).
- **Compass, branched** via `compassStyle`:
  - **Ornate** (Antique) — engraved rose: twin rings, a degree comb, an eight-point star with
    lit/shaded faces, a centre boss, and serif-italic cardinals.
  - **Simple** ring (others), with a glow under Mythic.
- **Antique parchment** — a deterministic paper-grain texture (fine sepia speckle + foxing blooms),
  pre-rendered once per (seed, size) to an offscreen canvas and blitted via `overlay` (no per-frame
  cost), plus an inner edge-darkening pass.
- **Mythic gilt border** — a thin double-rule frame with corner flourishes and a soft gold glow.
- **Blueprint title block** — a drafted info table (chart / seed / star & figure counts / scale /
  projection) in the bottom-right corner, aligned to the grid inset.
- **Per-style furniture defaults** — `STYLES[...].furniture` sets Graticule/Compass on/off so each
  style looks its best on first selection; the chips sync to it. Other flourishes (Nebulae / Myths /
  Glow) are preserved as the user left them.

### Field guide — "Tonight's Sky"
- A **☰ Field Guide** button opens a themed, scrollable panel listing every constellation in the
  current sky with its **name**, **catalogue designation** (where the style shows one), and **one-line
  myth**. Header shows the sky title, figure count, and seed.
- **Themed per style** (parchment / glowing / blueprint / clean) via CSS custom-property sets.
- **Rebuilds** on every (re)generation and re-themes on style switch.
- **Hover sync** — hovering a guide entry highlights that constellation on the chart (and vice-versa),
  routed through a single `setHover()` so the readout and list stay consistent.

### Polish
- **Label legibility** — every constellation label now gets a soft dark halo (shadow + stroke) behind
  it so names stay readable over busy starfields, in all four styles. Mythic keeps its warm accent
  glow on top.
- Twinkle still stops the rAF loop at Twinkle = 0; hover readout, PNG export, seed reproducibility,
  and panel collapse/reopen all preserved.

### Deliverables
- `README.md` (visitor intro, matching Cartographer's tone), `thumb.png` (16:9 Antique hero), this
  changelog. Self-verified in a browser: 4 styles + furniture, field guide, re-roll, sky invariant,
  ~60fps, zero console errors.

Final: one self-contained file, ~1900 lines, zero dependencies / network / web-fonts.

---

## Stage 1 — Core engine

- Seeded PRNG (xmur3 + mulberry32) with separate streams for layout, constellation clustering, and
  names/myths.
- Star field: skewed-magnitude distribution → radius + brightness; colour-temperature tint; brightest
  stars get glow halos and (style-dependent) diffraction crosses.
- Milky Way: a soft luminous ribbon with a noisy seeded spine + cloud puffs and concentrated dim
  filler stars; intensity slider separate from seed-driven geometry.
- Nebulae: 1–3 soft seeded radial colour glows.
- Constellations: greedy well-spaced anchors gather nearby bright stars; **minimum-spanning tree
  (Prim)** connects each figure into a clean asterism; brightest member enlarged.
- Language engine: curated evocative pools + ~12 myth templates → coherent names and one-line legends;
  optional Greek-letter catalogue designations with invented Latin genitives.
- Observatory style fully realized; Antique / Mythic / Blueprint carried distinct palettes.
- Hover-to-highlight + myth readout, PNG export, collapsible control panel, debounced resize.
- Verified: ~60fps with twinkle, zero console errors, **sky identical across styles** (`allIdentical:true`).
