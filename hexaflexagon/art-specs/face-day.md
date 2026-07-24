# Forged face scene — DAY (The Hexaflexagon)

The face the toy STARTS on, and the first half of the obvious pair. A walled
garden under a gold sun — warm, midday, inviting. It must read instantly as "day",
because its whole job is to make the visitor expect its twin (NIGHT) to be the last
face, and close the set at TWO — so the buried third face (the eclipse) lands as a
genuine surprise.

## Art direction
- **Hand:** warm ink-and-wash on parchment, the estate's dark-gold Victorian
  key — kin to the Fortune-Teller and Kirigami next door (the Paper Folly). A
  hand-inked garden vignette, confident tapering strokes with soft colour washes;
  NOT flat vector clip-art.
- **Palette:** parchment ground `--paper #f3ecd6` / `--paper-hi #fbf5e4`, warm ink
  `#2b2a24`, sun gold `#f4d27a` / `#c9a24a`, muted garden green `#6f8f5a`, stone
  `#c8b98f`. Keep it warm and sunlit.
- **The scene (a walled garden):** a low garden wall with merlons running across
  the lower-middle; an arched gate; clipped topiary; maybe a path, a bed of
  flowers, a bird. Above it, a warm sky.
- **The sun:** high and OFF-CENTRE (upper area, not dead-centre). This matters —
  the DEAD-CENTRE of the composition must stay quiet garden-sky/wall, because the
  eclipse face owns the centre and the on-ramp centre-sliver (a hairline of
  corona-gold, a colour on NEITHER day nor night) peeks from exactly there. So do
  NOT put a big gold disc at the exact centre.
- **Grain:** lay an anisotropic laid-fibre parchment grain across the ground, in
  the Fortune-Teller SVG-filter data-URI idiom (`feTurbulence` baseFrequency like
  `0.012 0.16`, very low alpha) — render it into the canvas (drawImage an
  `<svg>`-filter data URI, or an equivalent per-pixel laid mottle). Subtle; the
  paper should feel physical, not noisy.

## Geometry & registration (the whole trick)
The page SLICES this one scene across the six leaf triangles of the folding
hexagon and affine-maps each onto its folded screen triangle, so the composition
must be a single **hexagon-centred** image:
- Canvas is `HexaFaces.S`×`HexaFaces.S` (S=900), origin top-left, centre
  `C=(S/2,S/2)`. Draw within the regular hexagon of corner radius `HexaFaces.R`
  (`R = S*0.47`), corner 0 at the TOP (angle −90°), stepping +60°. The page samples
  triangles `[C, corner_i, corner_{i+1}]`, so **keep all meaningful marks inside
  that hexagon** and keep ink off the outer few px of each edge (a hex frame line
  at the very edge is welcome — see the placeholder).
- The scene reads whole at rest AND re-reads whole after a flex rotates it by a
  multiple of 60°, so a broadly 6-fold-friendly composition (motif centred, wall
  ringing the lower scene) survives rotation gracefully. It need not be perfectly
  symmetric — the garden reads fine — but avoid a single hard up-only detail that
  looks broken when the paper is turned a notch.

## API the candidate MUST expose
One JS file. Evaluated in the page it defines a global installer used by BOTH the
preview harness and (after integration) the shipped page:

```js
window.installHexaArt = function (A) {
  A.setScene('day', drawDay);   // draw(ctx) paints one S×S hexagon-centred DAY scene
  return 'day';                 // the face key the harness previews (flat)
};
// AND register for the shipped build (read by faces.js before it builds its scenes):
(window.HexaArt = window.HexaArt || {}).day = drawDay;

function drawDay(ctx){ /* paints the whole S×S scene: ground + grain + garden + sun */ }
```
- `ctx` is an S×S canvas 2D context. Paint the WHOLE scene (lay your own ground
  first; clip to the hexagon so ink never bleeds past the sampled wedge). Pure
  canvas 2D, no external assets, deterministic (a fixed noise seed is fine).
- Draw once per mount into an offscreen bitmap and reused every frame — so a few ms
  is fine, but do not depend on per-frame animation.

## Wiring (the wiring builder does this; not the smith)
The synth installs the winner at `hexaflexagon/art/day.js`. To SHIP it: add
`<!-- forge:include ./art/day.js -->` in its own `<script>` in
`hexaflexagon/index.src.html` **before** the `faces.js` include, rebuild via forge,
and confirm `faces.js` picks up `window.HexaArt.day`. Re-run the payoff-liveness
twin (`window.__HEXA_LIVE()` must stay `ok:true`) and a fresh screenshot.

## How the harness previews you
`bash hexaflexagon/art-specs/preview-harness.sh <candidate.js> <outdir> <port>`
loads the live exhibit, installs the candidate, rebuilds the scenes, shows the DAY
face FLAT, and screenshots the flat hexagon to `<outdir>/preview.png`. Judge on
that flat face.
