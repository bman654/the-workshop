# Forged texture — the PARCHMENT / CARD ground (The Thaumatrope)

A soft, warm parchment surface with gentle edge shading, painted under every card
face so the whirling disc reads as a physical paper leaf rather than a flat fill.

## Art direction
- A period optical-toy card: **aged cream parchment** in the estate's warm palette,
  base tone around `#f3ecd6`. Subtle, tasteful, LOW-contrast — it lives UNDER ink
  line-art and must never fight it or muddy the fused image.
- Wanted qualities: a faint warm grain/mottle (very low amplitude), a gentle
  centre-bright / edge-darkened vignette so the round card catches light in the
  middle and falls into soft shadow toward the rim, and a hairline warm border a few
  px in from the edge (the card's cut edge). Optional: a whisper of foxing/age specks,
  extremely sparse — err toward clean.
- Keep it deterministic (a fixed pseudo-random seed is fine — it must look identical
  every call so the rasterised face is stable). No harsh edges, no visible tiling
  seams, no color that reads as anything but "old paper."

## Contract
This is a full-face ground painter, not a pair. It replaces the placeholder
`ThaumFaces.paper(ctx)`.

```js
window.installThaumArt = function (A) {
  A.setPaper(paintParchment);   // ctx => paints the 360x360 parchment ground
  return 'paper';               // the harness previews it under the bird/cage card
};
(window.ThaumArt = window.ThaumArt || {}).paper = paintParchment;
function paintParchment(ctx){
  // 360x360, origin top-left. Fill the WHOLE face opaquely with parchment + shading.
  // MUST end fully opaque (no transparency) — ink is drawn on top afterward.
}
```
- `ctx` is a 360×360 canvas 2D context. The function is called at the START of every
  face draw (before the ink), so it MUST cover the whole 360×360 and be opaque.
- Pure canvas 2D (gradients, small rects, low-alpha stipple loops). No external
  assets. Fast — it runs once per face at mount.

## Wiring & preview
Synth installs the winner at `thaumatrope/art/paper.js`; wiring builder
forge:includes it before `faces.js` (which prefers `window.ThaumArt.paper`).
Preview with
`bash thaumatrope/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` — it
installs the parchment, rebuilds the bird/cage card on the new ground, parks above
the lock, and screenshots. Judge that the paper reads physical WITHOUT muddying the
fused bird-in-cage.
