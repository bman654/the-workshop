# The Long Way Home — SPEC

## What it is

A WALKED place that enacts Joseph Campbell's monomyth (the hero's journey) as a tilted ring
seen edge-on, sinking below one horizon into a frozen star sky and rising to a new dawn —
with the single archetypal beat at each station braided across three myths. It clears the
**grounded gate**: it is never a node-and-edge graph; it is a band you descend below a
horizon and climb back from, a place you move a glowing mote through.

## Form (the spine)

- **Edge-on ring.** The 12 stations are a real loop in a hand-rolled pseudo-3D space (no
  Three.js). Each station's HORIZONTAL position + depth come from its authored ring angle
  (`walk.js` `ANG`); its VERTICAL position comes from its authored **elevation** (`el`). The
  band reads as a thin tilted ellipse: stations I & XII sit adjacent at the top, the right
  side descends I→V to Gate A, the bottom holds the deep (VIII = nadir), the left climbs
  IX→XI to Gate B, and XII returns beside I at a new dawn light.
- **One horizon, asymmetric.** The horizon is at `el = 0`, set ABOVE the ring centre: a SHORT
  lit upper arc (Day, I–V) and a LONGER dark lower arc (Night, VI–XI). The profile is a
  textured descent-and-return (III bumps UP — the Refusal's recoil; IX glints up — the small
  reward in the deep), not a smooth U.
- **The camera/sky translate.** A single `horizonY` follows the station the mote glides
  toward; everything (band, gates, stations, the whole star field) translates so the active
  station frames at ~0.60·H. At the Ordeal the horizon is near the top (deep below it); at the
  Return it drops and the top glows dawn-gold. Stars are anchored to the horizon → a fixed
  firmament you descend through.
- **Two felt gates, passed THROUGH.** Stone archways straddle the band at the two
  horizon-crossings. **Gate A** (after V): Inanna's seven-fold lapis underworld lintel —
  crossing down bleeds warm→cold and dims the drone. **Gate B** (after XI): the pale Gate of
  Horn — crossing up warms cold→dawn-gold and swells the drone. Both reversible.

## The frozen sky (locked)

The Orrery's canonical pinned starfield: `s = 987654321`, LCG `s = (s*1103515245 + 12345) &
0x7fffffff`, 260 stars, `mag = r()^2.2`. Baked ONCE in `walk.js` (`STARS`), never re-derived
(no ephemeris). A handful of hand-placed brighter ANCHORS add structure. `sky.js` is NOT the
renderer here — its only role is lighting the front-door star via `ws.js`
(`WS.seen('the-long-way-home')` + the explicit `ws:seen:` literal for direct visits).

## The leaf & the braid (graft, never a list)

On arrival a hand-lettered illuminated leaf unfolds: a gold drop-initial, `STATION <numeral>`,
the canonical name, the one-line beat, the illuminated **keyword**, a **woven sentence** that
names all three heroes in their thread-colours (rubrication), and three **strands** — one per
myth — each led by its rubricated hero-name with a **tautness ribbon** whose weight/opacity is
that myth's tautness at that beat. A left-margin **SVG braid** runs the three ribbons over/
under, converging on a gold bead at the keyword row. Where a myth's tautness < 0.2 the strand
is dimmed and marked "the ribbon runs thin here" — the honesty device, visible in the data.

## Sound (in-house Web Audio, one shared bus — `audio.js`)

A warm **Day** drone (root+fifth saw/triangle chord, breathing LFO), a sparse cold **Night**
pad (high sines through a feedback delay, tremolo), and a fuller **Dawn** chord (major triad,
brighter). Crossfaded by a `mood ∈ [0,2]` driven by arc membership; the master lowpass sweeps
DOWN in the deep (the dim) and opens in the light. One-shots: a mote-**glide** per step, a
page-**chime** on leaf open, a low stone **thud** under each arch. Unlocked on the first real
click (the begin-curtain); reads/writes the shared estate mute `ws:pref:muted` via `WS`.

## The content-fidelity check (stands in for a self-test)

`stations.test.mjs` asserts SHAPE/COMPLETENESS over `stations.mjs` — **not** a math claim:

1. exactly **12** stations;
2. the 12 canonical names, in canonical order, verbatim (`CANONICAL_NAMES`);
3. all **3 myths** present & non-empty for every station (**36/36**, no holes), each with a
   hero label and a tautness ∈ [0,1];
4. arc membership day(I–V, XII) / night(VI–XI), with `el` sign agreeing;
5. the unique deepest station is **#8 The Ordeal**;
6. exactly **two** `gateAfter` flags, at the canonical boundaries (after #5 = descent, after
   #11 = dawn);
7. the honesty device is in the data — at least one ribbon runs genuinely thin (tautness <
   0.2).

Result: `stations content-fidelity: 165/165 PASS`.

## Integration

- New top-level `the-long-way-home/`; one PLACES entry on the front door:
  `{ district:'grounds', tier:1, wing:'processions', footprint:'procession-band' }`.
- New GROUNDS wing **`processions`** ("THE PROCESSIONAL GROUND") in `tools/layout/layout.js`
  (`GROUNDS_WINGS` sub-region `{x:568,y:150,w:222,h:158}` + `WING_META`), seated in the open
  upper-central court north of the manor; finalized via the live `Layout.solve` (footprint
  x595 y171 168×116, star-clear, disjoint from every neighbour).
- A bespoke `procession-band` footprint draw-key (a tilted edge-on ring dipping below a
  horizon, 12 station ticks, two gate uprights).
- Catalog star `the-long-way-home` at `(215, 448)` — a wayfarer's star in the west margin
  beside its companion the Orrery (the firmament it is charted on).

## Anti-graph guard

If any view ever flattens to dots-and-lines it has failed. The band sinking below a horizon
into star-dark is the guarantee it cannot become a top-down monomyth wheel.
