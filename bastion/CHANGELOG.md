# Bastion — build log

## Initial build (the realm zoomed to a city — Cartographer's sibling)

A single self-contained `index.html` (~1740 lines, vanilla HTML/CSS/JS, canvas 2D, **zero deps,
no network/CDN/web-fonts**, relative paths only). Style/panel/seed+dice/PNG-export/RNG patterns
borrowed from Cartographer; back-links to `../index.html` and `../cartographer/index.html`.

### The constructive algorithm (coherent by construction)

Built as a DATA MODEL first, then rendered:

1. **Wall circuit** — a closed polygon: vertices at jittered radii (a few sine harmonics + small
   per-vertex noise + slight ellipse squash). Irregular but legible.
2. **River** (flourish) — entry/exit points on opposite-ish walls, a meandering Catmull-Rom curve
   resampled to a dense polyline, with a width band. `inWater(x,y)` = distance-to-polyline test.
3. **Gates** (3–6) — spread angularly around the wall, nudged away from the river mouths.
4. **Market square** — near the centroid, nudged off the river.
5. **Arterial roads** — each gate routed to the market; where the straight line crosses the river
   it routes through the crossing and drops a **bridge** (oriented to the river tangent). Plus an
   optional ring road.
6. **Street lattice** — layout-dependent (radial rings+spokes / rotated grid / organic web),
   *clipped to the wall polygon* and split around the river (segments in water/outside are dropped).
7. **Blocks & buildings** — footprints packed on a jittered grid, each **rejected** if its center
   falls on a street, artery, the river band, the wall ring, or a reserved landmark. Density falls
   off toward the wall (denser core). Guarantees buildings sit on blocks, never in roads/water.
8. **Landmarks** — citadel keep (in the widest wall gap, corner towers + central keep), cross-shaped
   cathedral near the square, market plaza, scattered greens/plazas, docks on the river, an optional
   suburb just outside one gate.
9. **Naming engine** — seeded gazetteer, feature-aware (dockside quarter near water, Templeside by
   the cathedral, the Bailey under the citadel, Highmarket by the market).

### Seed-purity / style independence

Separate RNG streams (`seed+"::wall"`, `"::river"`, `"::gates"`, `"::streets"`, `"::buildings"`,
`"::landmarks"`, `"::names"`). The whole plan + all names are a pure function of (seed + params).
`STYLES[style]` only supplies palette/linework. **Verified:** the geometry+name fingerprint hashed
identical across all 4 styles (`344057819`); same seed re-entered → identical fingerprint; a
different seed → different.

### Browser self-verification (agent-browser, session `bastion-verify`)

- **Coherence across 8 re-rolls** — every city held all invariants:
  `buildingsInWater = 0`, `buildingsOutsideWall = 0`, `gatesReachMarket = true`, river + bridges
  present. Sample cities: *Port Tarngate, Saint Aldric, Hartmouth, Oakbury, Emberfell, Saint Cerys,
  High Frostham, Elderworth, Vellhaven, Stoneworth, Saint Adela.*
- **Sample rivers:** the Greywash, the Quill, the Cray, the Wend, the Marrow, the Aln, the Stille,
  the Bramble, the Sable, the Mirewater.
- **Sample quarters:** the Hithe, Crowsfoot, the Furrows, Bishopsgate, Greenside, the Keepyard,
  the Steeps, Minster Close, the Quays, Castlegate, Tanner's Row, the Bowers, Dockside, the Bailey,
  the Pentice, Wych Cross, the Sanctuary, the Cloisters, Skinner's Lane, Warden's Row, Fisher's
  Wharf, Masoncroft, Chandlers' Quarter.
- **Sample gates:** River Gate, North/South/East/West Gate, Northeast/Northwest/Southeast/Southwest
  Gate, Kings Gate.
- **Styles** — Parchment / Ink / Blueprint / Illuminated all render the same plan; only palette
  differs. Blueprint = cyan-on-dark survey; Illuminated tints quarters + gilds landmarks.
- **Layouts** — Radial / Grid / Organic all coherent (0 in water, 0 outside, gates reach market);
  street counts differ sensibly (grid 58 / organic 141 / radial 135).
- **Controls** — City Size scales the wall radius (R 258→315); Density scales building count
  (162→362→556); Gates 3→6 (street count tracks); Irregularity reshapes the plan. Flourish chips
  toggle river/citadel/cathedral/suburb on/off; labels/compass/graticule/towers re-render only.
- **PNG export** — `canvas.toDataURL('image/png')` → valid 8.9MB PNG at 2360×2360; anchor download
  fires with filename `bastion_<cityname>.png` (mirrors Cartographer's `exportPNG`).
- **Hover** — gate → "Southwest Gate — a gate in the walls"; market → "The Market Square — where
  the roads meet"; quarter → "the Hithe — hard by the water" (feature-aware note + highlight).
- **Panel** collapses/reopens; mobile viewport (390×844) renders cleanly.
- **Console clean** throughout (only the `Bastion ready…` log; 0 errors/warnings). Gen ~10ms.

### Deliverables

- `index.html` — the generator.
- `README.md` — short, Cartographer-sibling tone.
- `thumb.png` — 16:9 (1440×810) Parchment plan of *Saint Adela on the Sable* (walls + gates + roads
  + districts + river + bridges + cartouche + compass).
