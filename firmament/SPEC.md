# Firmament — SPEC

*The sky sibling to Cartographer. A procedural night-sky / star-chart generator: re-roll a
coherent sky from any seed — a field of stars (varying magnitude & colour-temperature), a soft
Milky Way band, faint nebulae, and a set of **invented constellations** drawn as asterisms, each
with a generated **name** and a one-line **myth**. Four chart styles. Export PNG.*

One self-contained file: `firmament/index.html` — vanilla HTML/CSS/JS, canvas-based, zero deps,
**no external requests/CDNs/fonts**, relative paths only (served from a Pages subpath).

**It is the visual + language synthesis of the workshop:** Cartographer's seeded procedural craft
+ The Oracle's invented, coherent language (the constellation names & myths).

---

## The sky is seed-driven; style only changes rendering
Like Cartographer: the *generation* (star positions, magnitudes, colours, Milky Way, nebulae,
which stars form which constellation, all names & myths) is a pure function of the **seed** (+ the
density/count sliders). Switching **style** must NOT change the sky — only its palette/furniture.
Same seed + same sliders ⇒ identical sky.

**Reuse Cartographer's seeded-RNG approach** (study `cartographer/index.html`: its string-hash +
`makeRng` mulberry32-style PRNG). Use separate RNG streams per concern, e.g. `seed`, `seed+"::con"`,
`seed+"::names"`, exactly like cartographer uses `seed+"::places"`.

## Visual layers (back → front)
1. **Background** — per-style gradient/vignette.
2. **Milky Way band** (flourish, toggle) — a soft luminous diagonal ribbon of denser, dimmer stars
   + nebular haze; brightness falls off from a noisy spine. Subtle, never garish.
3. **Nebulae** (flourish, toggle) — 1–3 soft radial colour glows (cyan / magenta / gold), low
   opacity, placed by seed.
4. **Star field** — a few hundred → ~1500 stars. Each: position, **magnitude** (→ radius +
   brightness), **colour temperature** (hue blue-white `#cfe0ff` → white → warm `#ffd9a0`/`#ffb37a`).
   Brightest stars get a soft glow halo + (style-dependent) a thin diffraction cross. A gentle,
   slow **twinkle** (animated, subtle — this is a chart, not a screensaver). Must hold ~60fps;
   if needed, twinkle only the brightest N stars and keep the rest static.
5. **Constellations** — choose K (slider, ~4–16) asterisms. For each: pick a cluster of brighter
   stars (an anchor + nearby stars), connect them into a **clean line figure** (a path/tree, avoid
   wild crossings — e.g. a nearest-neighbour or minimum-spanning-tree walk). Draw lines in the
   style accent; nudge the constellation's brightest star a touch larger. Each gets a **name** +
   **one-line myth** and a label near the figure.
6. **Chart furniture** (toggleable flourishes, style-dependent):
   - **Graticule** — faint celestial grid. Circular *planisphere* (horizon ring + radial ticks)
     for Antique/Mythic; rectangular RA/Dec-style grid for Observatory/Blueprint. KEEP SUBTLE.
   - **Compass / horizon ring** — N E S W cardinals (planisphere styles).
   - **Title cartouche** — an invented sky/region title + the seed, in a corner.
   - (optional) a faint **ecliptic** arc.

## Styles (segmented control, 4) — palette-driven render
Render must read from a `STYLES[style]` palette object (bg, star-tint range, line colour, label
colour+font, glow, which furniture). Generation is style-independent.
- **Observatory** (default) — near-black navy bg, crisp white stars, thin cyan `#5fd0ff` asterism
  lines, clean sans labels, faint rectangular grid. Modern + precise.
- **Antique** — dark sepia/ink-blue bg + parchment vignette, warm cream stars, gold `#d9b46a`
  lines, serif-italic labels, circular planisphere graticule + ornate compass. Bayer *Uranometria*.
- **Mythic** — deep indigo→violet bg, stars with soft gold halos, luminous amber/gold lines,
  glowing serif labels; the myths feel central. Dreamlike.
- **Blueprint** — dark teal/cyan technical bg, monochrome cyan everything, thin precise lines,
  monospace labels, full rectangular grid with coordinate ticks. Technical-drawing feel.

## Language engine (the special sauce — The Oracle's bar applies: coherent & evocative)
All naming driven by the seed RNG (a dedicated stream). Quality bar: reads as real miniature
legend, **never word-salad**.
- **Names** — `{The} {adjective?} {noun}` and possessive forms, from curated evocative pools
  (creatures, objects, figures, natural forms): e.g. *The Drowned Lantern, The Heron's Crown,
  The Sundered Wheel, The Ash Serpent, The Weeping Mariner, The Smith's Anvil*.
- **Myths** — one short line each, referencing the name via ~8–12 template shapes with large pools:
  e.g. `"{Name}, who {deed} and was {fate}."` → *"The Drowned Lantern, who lit the way for lost
  sailors and was claimed by the tide."* Evocative, coherent, fresh across re-rolls.
- (optional, nice) per-brightest-star **catalogue designation** — Greek letter + invented
  constellation genitive (e.g. `α Lanternae`) for Observatory/Blueprint.

## Controls (mirror Cartographer's `#panel` look + collapse/reopen behaviour)
Title **Firmament**, sub *Procedural Sky Engine*. Then:
- **Seed** row: text input + dice (random seed) button.
- **Style** segmented: Observatory / Antique / Mythic / Blueprint.
- Sliders: **Star Density**, **Constellations** (count), **Milky Way** intensity, **Twinkle**,
  **Label Density** (all names / major only / none).
- Flourish chips (toggles): **Graticule**, **Compass**, **Nebulae**, **Myth labels**, **Star glow**.
- Actions: **⟳ Re-roll** (primary) · **↓ PNG** (export — `canvas.toDataURL`, file
  `firmament_<title>.png`, copy cartographer's `exportPNG`).
- Hint line. Panel collapsible (`✕` / hamburger reopen), like cartographer.

## Interaction
- **Hover** a constellation (asterism / label / hit-region) → highlight (brighten its lines+stars),
  dim the others slightly, and show its **myth** in a small readout (bottom-centre or near cursor).
- (optional, secondary) a **field-guide index** — list of the sky's constellations + myths.
- Twinkle animates via `requestAnimationFrame`; when Twinkle = 0, **stop the rAF loop** (static,
  export-friendly, low CPU). devicePixelRatio-aware canvas; debounced redraw on resize (like cartographer).

## Performance / quality bar
- ~60fps with twinkle on at default density on a retina canvas. **No console errors/warnings.**
- Beautiful at desktop sizes; panel collapses gracefully on small screens.

## Deliverables
1. `firmament/index.html` — the piece.
2. `firmament/README.md` — short (match `cartographer/README.md` tone/length).
3. `firmament/thumb.png` — 16:9 screenshot of a gorgeous sky (Antique or Mythic, constellations +
   labels visible), ≤1440px wide, for the front-door card.
4. `firmament/CHANGELOG.md` — build log.

## Verification (self-verify in a UNIQUELY-NAMED agent-browser session — never the default tab)
Open via `file://`, then: screenshot default (Observatory); switch each style & screenshot (palette
changes, **sky identical**); re-roll a few times (new coherent sky; names/myths change & read well —
paste 8–10 samples into the report); hover a constellation (highlight + myth readout); export PNG
(file downloads); seed reproducibility (same seed ⇒ same constellation name). Fix until clean.
Report: summary, sample names/myths, fps, console status, screenshot paths.

## House rules
- One self-contained file; no network/CDN/web-fonts (system serif/sans/mono stacks only).
- Feel like a **sibling** of Cartographer (panel styling, collapse, export pattern, seeded RNG).
- Do NOT edit other projects or the front-door `index.html` — the front-door card + landing
  rebalance is curated separately.
