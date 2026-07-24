# Forged face scene — NIGHT (The Hexaflexagon)

The SAME walled garden as DAY, after dark: crescent moon, stars, cool light. It is
the second half of the obvious pair — the face a beginner reaches by the trap-flex
and thinks completes the toy. Its job is to read INSTANTLY as "the night version of
that garden", so the eye closes the set at TWO and the buried third face (the
eclipse) is a real surprise.

## Art direction
- **Hand:** the same warm-ink-and-wash hand as DAY, now in a cool night key — a
  hand-inked nocturne. Kin to the Fortune-Teller / Kirigami (the Paper Folly).
- **Palette:** deep night ground `--night #171a2e` / `#0e1226` / `#26305a`, moon &
  starlight `#eef0ff`, cool stone `#a7966a` shadowed, deep-green topiary. A touch
  of the parchment warmth may survive at the horizon. Reads cool, still, lit by the
  moon.
- **The scene (SAME garden, at night):** re-draw the DAY scene's walled garden —
  the wall + merlons, the arched gate, the topiary, the path — under a night sky.
  The visitor must recognise it as the same place. Scatter stars in the sky.
- **The moon:** a crescent moon in the SAME high, off-centre position the DAY sun
  held (so day and night read as a matched pair). Again — keep the DEAD-CENTRE
  quiet (garden-sky / wall), NOT the moon, because the eclipse owns the centre and
  the on-ramp centre-sliver peeks from exactly there.
- **Grain:** the same anisotropic laid-fibre parchment grain (Fortune-Teller
  SVG-filter data-URI idiom), rendered subtly over the night ground so the paper
  still feels physical.

## Geometry & registration
Identical contract to the DAY spec (`face-day.md` §"Geometry & registration"):
S=900 canvas, centre `C`, hexagon corner radius `R=S*0.47`, corner 0 at TOP, +60°
steps; the page slices `[C, corner_i, corner_{i+1}]`. Keep marks inside the
hexagon, keep the composition rotation-graceful, and — critically — **register the
wall / gate / topiary / moon at the SAME positions as the DAY face** so a flex
reads as the same garden turning from day to night, not two unrelated pictures.

## API the candidate MUST expose
```js
window.installHexaArt = function (A) {
  A.setScene('night', drawNight);
  return 'night';
};
(window.HexaArt = window.HexaArt || {}).night = drawNight;

function drawNight(ctx){ /* paints the whole S×S NIGHT scene */ }
```
Same rules as DAY: `ctx` is an S×S 2D context, paint the whole scene, clip to the
hexagon, pure deterministic canvas 2D.

## Wiring
Synth installs the winner at `hexaflexagon/art/night.js`; the wiring builder adds
`<!-- forge:include ./art/night.js -->` before `faces.js`, rebuilds, and re-runs the
liveness twin + a screenshot.

## Harness
`bash hexaflexagon/art-specs/preview-harness.sh <candidate.js> <outdir> <port>`
shows the NIGHT face flat and screenshots `<outdir>/preview.png`. **Judge it beside
the DAY preview** — the pair must read as the same garden, dusk and dark.
