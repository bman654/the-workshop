# Art spec — `drum-brass` (visual-exhibit): the brass MATERIAL pass

## What this asset is
The material skin of The Faithful Drum's zoetrope body. The proto (and the current
PLACEHOLDER in `drum-brass.js`) paints the drum wall as a flat left-to-right brushed
brass gradient with a crude striped sheen. This asset LIFTS that to a convincing
Victorian brass instrument: a specular highlight where light rakes the upper-left of
the curved wall, cut-edge glints on the lip of every viewing-slit, a warm inner-wall
bounce in the shadowed right flank, and turned rims with real metal depth. The drum
must read as spun brass under warm candlelight — kin to the estate's other brass
instruments (Tone Mill, Barrel House), NOT the gate's flat brass idiom.

## The exhibit context (match THIS, not the gate)
- Palette: near-black ground `#07080c`; brass golds `#c9a24a` (base) and `#f4d27a`
  (highlight). The wall gradient currently runs `#4a3a1c → #7a5f2c → #b58a3e → #7a5f2c → #3c2f16`.
- The light is UP and to the LEFT (upper-left rake). The wall is a 3/4-perspective
  cylinder: a top ellipse, a front-facing brass band of height `wallH`, a base ellipse.
- The drum spins; this material is redrawn EVERY FRAME (~60fps) under `angle`. It must
  be cheap: pure canvas 2D, no per-pixel loops over the whole wall each frame (a cached
  offscreen gradient/pattern is welcome; a getImageData sweep per frame is NOT).
- The viewing-slits (thin dark cuts) are painted SEPARATELY by the page AFTER
  `Brass.frontWall`; `Brass.slitLip` draws each slit's brass rim ON TOP of the frame
  slice. So the wall fill must NOT try to draw the slits — only the solid brass band.

## The EXACT API the candidate code must expose
The candidate REPLACES the bodies of these functions in `drum-brass.js`, keeping the
`window.Brass` object and every signature identical. Coordinate space = the drum
canvas (1720×1040 backing). `geo = {cx, cy, rx, ryTop, wallH}` (ellipse centre, horiz
radius, top-ellipse vertical squash, wall height).

```js
window.Brass = {
  // Fill the near/front brass band. `path` is a Path2D of the front-face silhouette
  // (front top-ellipse arc → down the sides → back along the front base arc). Fill
  // INSIDE `path` only (use ctx.fill(path) / ctx.clip(path)). This is the solid metal.
  frontWall(dctx, geo, path) { … },

  // Brass rim of ONE open slit: its two vertical cut edges + a top lip highlight,
  // drawn AFTER the frame slice so it reads on top. sx = slit centre screen-x,
  // yTop/yBot = the slit's vertical extent, slitHalf = half its screen width,
  // depth ∈ (0,1] = sin(theta) foreshortening (1 = facing the viewer dead-on).
  slitLip(dctx, sx, yTop, yBot, slitHalf, depth) { … },

  topRim(dctx, geo)  { … },   // the elliptical top opening rim (turned brass)
  baseRim(dctx, geo) { … },   // the base foot ellipse (turned brass)
  spindle(dctx, geo) { … },   // central spindle rod + top pivot knob
};
```

Draw order the page uses each frame: shadow → `frontWall` → (page paints slit windows,
calling `slitLip` per open slit) → `topRim` → `baseRim` → `spindle` → lock-bloom.

## How the preview harness invokes it
`bash art-specs/preview.sh <candidate.js> <outdir> <port>` copies the candidate over
`drum-brass.js`, forge-builds the page, serves it, freezes the drum at a fixed angle
with a starter loop loaded, and screenshots `<outdir>/preview.png`. Judge on that still.

## Judge focus (one line)
Does the drum read as convincingly-spun warm brass under an upper-left light — specular
sheen, cut-edge glints, inner-wall bounce — while staying cheap enough for 60fps and
never drawing the slits itself?

## Constraints
- No external assets, no images — pure canvas 2D drawing code.
- Must not change function names/signatures or the `window.Brass` shape.
- Must not paint the slit interiors (the page owns those); `frontWall` fills solid metal.
- Keep it fast: cache gradients/patterns across frames; avoid per-frame per-pixel work.
- Honour the estate palette; do not introduce hues outside the brass/near-black family.
