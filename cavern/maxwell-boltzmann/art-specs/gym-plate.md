# Art asset — the stackable gym-plate weight (visual)

The draggable weights you set on the lid. The placeholder is a dark rounded rect with a
centre hole and a stamped number. This asset replaces it with a **cast-iron gym plate**
seen edge-on — the kind you rack and drag, weight embossed on the face.

## Art direction

- **A cast-iron weight plate, edge-on**: a thick rounded slab with a **centre hole**
  (the barbell bore) and the **weight embossed/stamped** on its face. Cast-iron palette
  (near-black charcoal `#171b1f → #3a4046`) with a soft top rim-light and a machined bore.
  The stamped number is the plate's weight (`weight` arg) in the vessel's amber, legible
  but part of the casting — engraved, not a label. A worn, industrial, honest look.
- **Same fn draws it anywhere** — in the rack, stacked on the lid, and (at full alpha,
  warm-edged) while being dragged. It is redrawn every frame at the live `pw`/`ph`, so it
  must be procedural and scale-clean.
- **Heavier plates read heavier** — the width `pw` already grows with weight; you may add
  thickness/rib cues, but keep the centre bore and the stamp constant so the stack reads
  as a coherent set.

## EXACT API the candidate code must expose

Define, in the candidate JS file, a function assigned to **`window.__PLATE`**:

```js
window.__PLATE = function (ctx, cx, cy, pw, ph, weight) {
  // ctx    : CanvasRenderingContext2D
  // cx, cy : plate CENTRE, in CSS px
  // pw, ph : plate width, height in px  (draw within [cx±pw/2, cy±ph/2])
  // weight : the number to emboss on the face (e.g. 80, 110, 150)
  // Draw one cast-iron plate centred at (cx,cy): the slab, the centre bore, the stamp.
  // No global state, no external assets. (A lifted/dragged plate is drawn by the same
  // call; if you want a lift accent, key it off nothing — the page frames it.)
};
```

Pure canvas 2D, deterministic. Cheap — several draw every frame.

## How it wires in + preview

The winner replaces the body of `drawPlateGlyph(cx, cy, w, alpha, lifted)` in
`cavern/maxwell-boltzmann/lid.html` (keep honouring `alpha`, and the `lifted` warm edge
if you like). Call shape: `window.__PLATE(ctx, cx, cy, plateW(w), plateH(), w)`.

Preview: the same `preview-harness.sh` renders three plates stacked on the lid (80/110/150)
plus two in the rack, in true context → `<outdir>/preview.png`.
