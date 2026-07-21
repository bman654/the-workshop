# ART SPEC — `press-body` · the press itself

## What it is

The hero object of **The Cento Press** (`compositor/the-cento-press/index.html`) — a 19th-century
**cylinder proof press** standing in the left third of a warm, lamp-lit shop. The visitor grabs its
crank and hauls a sheet through it by hand. Today it is honest flat SVG greybox: two gradients, some
rounded rects, a circle for an ink roller. Everything else in this room is finished to the standard a
proof would get; this is the one place the craft visibly stops.

## Art direction

- **Match THE EXHIBIT, not the gate's brass idiom.** The room is dark warm plaster and wood
  (`#241d18` / `#3a2b20`), lit by a soft window glow from the upper left and an accent of
  `#c98a3e` lamp-amber. The palette is iron, oiled steel, blackened cast iron, and dark oak.
- **A real machine, not a cartoon.** Cast-iron side frames with the flared, slightly art-nouveau
  profile of a Victorian proof press; visible bolt heads, a seam where castings meet, a cast maker's
  medallion on the frame is welcome (unlettered, or lettered in a shape too small to read).
- **Materials should read at a glance**: oak is grained and warm; cast iron is matte with a soft
  top-lit edge, never chrome; the cylinder is a *packed* cylinder — steel drum with a wrapped
  tympan/blanket, faintly quilted, with a bearer ring at each end.
- **The ink is oxblood** (`#8e2f26`). The two ink rollers should read as *charged with oxblood ink* —
  a slightly tacky, slightly uneven film, not a flat red disc. A thin ink slab/disc above them.
- **Lighting is one soft key from the upper left**, warm; a cool bounce is allowed. Cast a grounded
  contact shadow under the base.
- The whole thing sits in a 404×292 box and must read clearly at that size **and** at 0.84 scale
  (the narrow-viewport media query). Detail that turns to mud at 84% is worse than no detail.

## The EXACT API the candidate code must expose

A plain script (no modules, no imports) that assigns:

```js
window.CentoArt = window.CentoArt || {};
window.CentoArt.press = {
  /**
   * Draw the whole press into `svg` by setting its innerHTML (or appending nodes).
   * @param {SVGSVGElement} svg  viewBox is ALWAYS "0 0 404 292"; already sized by CSS.
   * @param {Object} o
   *   o.w, o.h    404, 292 — the viewBox extent
   *   o.turn      0..1  how far through the revolution this pull is
   *   o.strain    0..1  0 before the platen kisses, rising to 1 at the end of the haul
   *   o.inked     boolean — true once turn > 0.10 (the forme has taken ink)
   */
  draw(svg, o) { /* … */ }
};
```

### Hard requirements

1. **`draw` is called on every animation frame of a pull.** It must be cheap — build a string and
   assign `innerHTML` once, or (better) build once and mutate only what moves. Do not allocate
   gradients per call if you can define them once in `<defs>`.
2. **You MUST emit an empty `<g id="chase"></g>` in the bed of the press**, positioned so the
   forme's type lies flat in the press bed around **x 36–260, y 138–158** in viewBox units. The page
   injects the mirror-reversed forme into that group itself — if `#chase` is missing, the type has
   nowhere to stand and the harness prints a failure banner.
3. Coordinate space is the viewBox: **x 0→404 left→right, y 0→292 top→bottom.** The crank is a
   SEPARATE element the page owns (positioned at roughly x 268–372, y 124–228 in page pixels, i.e.
   the lower right of the press) — **do not draw the crank**, but DO draw the drive shaft that runs
   out to meet it, exiting the frame around x 258–344, y ≈ 186–194.
4. The paper delivery slot is at roughly **x 150–246, y ≤ 142**: the sheet rides UP off the top of
   the cylinder. Leave that path visually clear — no ornament the emerging sheet would collide with.
5. `o.strain` should visibly load the machine: under strain the frame may show a hair of flex, the
   cylinder bearers bite, highlights tighten. Keep it SUBTLE — the page already adds a ±2.2px shudder
   on top; do not double it.
6. `o.inked` switches the rollers and the forme's ink from dry to charged oxblood.
7. **Zero dependencies, no network, no external images, no web fonts.** Pure inline SVG. Any texture
   must be built from SVG primitives (`<filter>` with `feTurbulence` is allowed and encouraged for
   the iron and the oak).
8. `"use strict"`-safe; no globals other than `window.CentoArt`.

## How it wires in

`compositor/the-cento-press/index.html` currently has a function `drawPress()` that assigns
`pressArt.innerHTML = \`…\`` (search for `function drawPress()`). The wiring builder replaces its body
with a call to `window.CentoArt.press.draw(pressArt, {w:404,h:292,turn,strain:strainAt(turn),inked:turn>0.10})`,
loads the module with a `<script src="press-body.js">` before the main script, and calls it from
`advance()` on each frame as well as at boot. `drawChase()` keeps ownership of the `#chase` contents
unchanged.

**Module the winner installs into:** `compositor/the-cento-press/press-body.js`

## How the preview harness invokes it

```
bash compositor/the-cento-press/art-specs/harness/render-take.sh <candidate.js> <outdir> <port>
```

It loads the candidate into `preview.html`, which calls `draw()` four times across one pull —
**at rest** (`turn 0`), **inked** (`turn .22`), **under strain** (`turn .72, strain .5`), and
**delivered** (`turn .99, strain 1`) — injects sample mirrored type into `#chase` on each, and
screenshots `<outdir>/preview.png`. Judge from that image.

## The bar

Does this look like a real cast-iron cylinder press standing in a warm, dark, lamp-lit shop — a
machine with weight you would believe you could haul on — rather than an assembly of rounded
rectangles? Do iron, oak and oxblood ink each read as their own material? Does it hold up at 84%?
And is the `#chase` slot honestly a bed the type is lying IN?
