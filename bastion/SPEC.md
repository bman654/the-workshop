# Bastion — SPEC

*A procedural **city-plan** generator, and **Cartographer's companion**. Cartographer maps the realm;
Bastion surveys a **city within it** — re-roll a coherent walled town from any seed: a ring of walls
and gates, roads threading from the gates to a market square, a citadel and a cathedral, districts of
close-packed blocks, a river crossed by bridges — every quarter and gate **named**. The realm zoomed
all the way in.*

One self-contained file: `bastion/index.html` — vanilla HTML/CSS/JS, canvas-based, **zero deps, no
network / CDN / web-fonts**, relative paths only (Pages subpath). Seeded & reproducible, export PNG.

It is **Cartographer's sibling** (same seeded procedural craft + Firmament's invented-naming craft):
reached via a `↗ Bastion` link in Cartographer's panel (companion pattern — front door stays at the
curated 9, surfaced as a "↳ Bastion within" pill on the Cartographer card), with `← workshop` and
`↗ Cartographer` back-links here.

---

## 0. The crux: a COHERENT city by construction (legible & plausible, not noise) + seed-pure

Two properties define quality (the equivalent of Orrery's real positions / Blazon's faithful blazon):

**(A) Structural coherence.** The plan must read as a *believable medieval/fantasy city*, not a random
scatter. Build it **constructively** so coherence is guaranteed: a wall circuit → gates on the wall →
**arterial roads** from each gate meeting near a **central market square** → a **street network** that
fills districts between arteries → **blocks/buildings** packed along streets → key **landmarks**
(citadel/keep, cathedral, market) placed sensibly → optional **river** crossing the city with
**bridges** carrying roads. Roads must actually connect (gates → center reachable); buildings sit on
blocks, not in the streets/river; the wall encloses the built area. Irregularity is welcome (cities
are organic) — but it must be *legible*.

**(B) Seed-pure generation; style only re-renders.** The whole plan (wall shape, gate positions, road
network, blocks, landmarks, river, all names) is a pure function of **(seed + parameters)** — reuse
Cartographer's seeded RNG (study `cartographer/index.html`: string-hash + mulberry32-style PRNG; use
separate streams per concern: `seed+"::roads"`, `"::names"`, etc.). Switching **style** must NOT change
the city — only its palette/linework. Same seed + params ⇒ identical city. (Verify like Cartographer
does — the geometry is byte-stable across styles.)

## 1. Layers (back → front)
1. **Terrain ground** — per-style paper/parchment or dark field; subtle texture/vignette.
2. **River / water** (flourish, seeded on/off) — a curving river (and/or a coastline on one edge, or a
   moat following the walls). Roads cross it on **bridges**. Water tints per style.
3. **Walls & towers** — a closed **wall circuit** (roughly circular/polygonal, or hugging terrain),
   with **gate** openings (3–6) and small **towers** at intervals/corners. Maybe an inner **citadel
   wall** around the keep. A possible **suburb** spilling outside a gate (nice realism, optional).
4. **Road network** — **arterial** roads (gate → market, thicker) + a finer **street** network filling
   the districts. Streets should branch organically (a constrained growth / subdivision — e.g. recursive
   block subdivision, or arteries + connecting lanes), avoiding the river except at bridges.
5. **Blocks & buildings** — the gaps between streets become **blocks**; fill them with small **building
   footprints** (packed rectangles/polygons) at a believable density; leave plazas/greens occasionally.
   Density can fall off toward the walls (denser core, sparser edge).
6. **Landmarks** (drawn distinctly): a **citadel/keep** (often against the wall or on high/river ground),
   a **cathedral/temple** (a cross-shaped footprint near a square), the **market square** (an open plaza
   at the road hub), maybe a **harbor/docks** if water, **wells/fountains**, a **graveyard**, **mill**.
7. **Map furniture** (toggleable, style-dependent): a **title cartouche** (the city's name + seed), a
   **compass rose**, a **scale bar**, a faint **graticule**, and **labels** — naming the **districts/
   quarters**, the **gates**, the **river**, and the city itself.

## 2. The naming engine (special sauce — Firmament/Oracle bar: coherent & evocative, never word-salad)
All names seeded (a dedicated RNG stream). Reads as a real gazetteer:
- **City name** — `{prefix}{root}{suffix}` patterns + `{Saint/Adj} {root}` forms from curated pools
  (e.g. *Ashford, Greymoor, Caer Dunhollow, Saint Aldric, Thornkeep, Vellmark, Duncaster*).
- **Gate names** — by direction/landmark: *the North Gate, the River Gate, the Lion Gate, Saltgate,
  the Shambles Gate*.
- **District/quarter names** — evocative + plausible: *the Shambles, Tanner's Row, Goldsmith's Ward,
  Templeside, the Reeds, Highmarket, Old Town, the Weir, Crowsfoot*.
- **River name** — *the Wend, the Mirewater, the Silt, the Greywash*.
- (optional) a one-line **city motto** or a tiny founding legend in the cartouche.
Keep names coherent with features (the dockside quarter near water; Tanner's Row near the river; the
cathedral quarter = Templeside). Fresh across re-rolls.

## 3. Styles (segmented, 4) — palette/linework driven; the CITY never changes, only the look
Render reads `STYLES[style]`. Switching style must NOT move a road or rename a quarter.
- **Parchment** *(default)* — antique survey on aged paper: warm sepia ground, brown ink walls/roads,
  hatched buildings, a river in faded blue-green, serif italic labels, an ornate cartouche + compass.
  The old city-plan look (Braun & Hogenberg / a bird's-eye town plan).
- **Ink (blackletter)** — high-contrast black ink on cream: fine linework, cross-hatched blocks, a
  restrained monochrome plan; engraved/woodcut feel; serif labels.
- **Blueprint** — cyan-on-dark technical survey: thin precise lines, coordinate ticks, monospace
  labels, a drafting title block. (Sibling to Cartographer/Firmament Blueprint.)
- **Illuminated** — richer colour: tinted districts (soft per-quarter fills), gilt landmarks, deeper
  water, a decorative border; a manuscript map. Tasteful, not garish.

## 4. Controls (mirror Cartographer's `#panel` look + collapse/reopen)
Title **Bastion**, sub *City-Plan Generator* (or *Procedural Town Surveyor*). Then:
- **Seed** row: text input + **⚄ dice** (random seed). Same city for same seed + params.
- **Style** segmented: Parchment / Ink / Blueprint / Illuminated.
- Sliders / selects: **City Size** (wall radius / extent), **Density** (how packed the blocks),
  **Street Irregularity** (grid-ish ↔ organic), **Gates** (count), maybe **Layout** hint
  (radial / grid / organic). Flourish chips: **River**, **Citadel**, **Cathedral**, **Suburb**,
  **District labels**, **Compass**, **Graticule**, **Towers**.
- Actions: **⟳ Re-roll** (primary) · **↓ PNG** (export — `canvas.toDataURL`, file
  `bastion_<cityname>.png`; mirror Cartographer's `exportPNG`).
- A small readout: the **city name** + seed; hint line. Panel collapsible (`✕` / reopen), like Cartographer.

## 5. Interaction
- **Hover** a district / gate / landmark (label or region) → highlight it + show its name (and maybe a
  one-line note: "the tanners' quarter, hard by the river"). (optional, secondary) a **gazetteer** list
  of the city's quarters & gates.
- Redraw on re-roll / param change / style switch / resize (debounced, like Cartographer). No animation
  loop required (it's a map press); devicePixelRatio-aware; a one-off draw-on reveal is welcome but must
  not loop/leak.

## 6. Performance / quality bar
- Re-roll renders fast (well under a second at default size); crisp at desktop sizes; **PNG export
  pixel-perfect**. **Zero console errors/warnings.** Panel collapses gracefully on mobile.
- The plan is **legible**: roads connect gates→center; buildings don't sit in streets/river; the wall
  encloses the city; labels don't overlap badly (simple collision avoidance / leader lines if needed).

## 7. Verification — self-verify in a UNIQUELY-NAMED agent-browser session (never the default tab)
1. **Coherence (core gate):** screenshot Parchment default — confirm a believable city: closed wall +
   gates, arterial roads from gates meeting at a market hub, a filled street/block network, a citadel +
   cathedral, a river with bridges (when on). Roads connect; buildings aren't in the river/streets; the
   wall encloses the build. Re-roll ~8 times → each a *different, still-coherent* city; paste 8–10
   sample **city + quarter + gate names** into the report (must read as a real gazetteer, not salad).
2. **Seed-pure / style-independent:** one seed; switch each **style** → screenshot; confirm the city
   geometry + all names are **identical**, only palette/linework differ. Same seed re-entered ⇒
   identical city.
3. **Controls:** City Size / Density / Irregularity / Gates visibly change the plan sensibly; flourish
   chips toggle river/citadel/cathedral/labels/compass; **PNG export** downloads a correct image.
4. **Interaction:** hover a district/gate → highlight + name readout.
5. ~Fast redraw; **console clean** throughout. Report: summary, 8–10 sample names, coherence notes,
   seed/style-independence confirmation, screenshot paths, line count. If cities come out incoherent
   (disconnected roads, buildings in water, walls not enclosing), that's a FAIL — fix before shipping.

## 8. Deliverables
1. `bastion/index.html` — the generator.
2. `bastion/README.md` — short, match `cartographer/README.md` tone/length; note it's Cartographer's
   sibling (the realm zoomed to a city) and seed-reproducible.
3. `bastion/CHANGELOG.md` — build log incl. sample city/quarter names + the coherence/seed checks.
4. `bastion/thumb.png` — 16:9 screenshot of a gorgeous **Parchment** city plan (walls + gates + roads +
   districts + river + a named cartouche visible), ≤1440px wide.

## 9. House rules
- One self-contained file; **no network/CDN/web-fonts** (system serif/sans/mono stacks only).
- Feel like a **sibling of Cartographer** (panel styling, collapse, seed+dice, export pattern, seeded
  RNG, the cartographic furniture) — the realm's map zoomed to one of its cities.
- Back-links: **`← workshop`** (`../index.html`, copy Orrery/Blazon/Ariadne's `<a class="back">`) and a
  small sibling link to Cartographer (`../cartographer/index.html`, e.g. "↗ Cartographer — the realm").
- **Do NOT edit other projects or the front-door `index.html`** — the Cartographer→Bastion companion
  cross-link + the front-door "within" pill are wired separately by the lead agent (front door stays at 9).
