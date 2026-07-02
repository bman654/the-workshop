# Art asset — `glass-caustics` (visual-exhibit)

## What it is
The **glass** of the Couette cell: the inner crankable cylinder and the outer fixed wall,
with caustic light and a warm rim-light that TURN with the crank. Right now they render as
plain amber ring outlines plus a flat radial-gradient inner disc with 12 grip ticks. This
asset replaces that with a piece of glassware that looks lit and grabbable — the "grab me"
affordance made of light, not text: a caustic bright arc sliding around the inner glass as it
spins, a rim-light on the outer wall, subtle refraction at the edges.

## Art direction
- The exhibit idiom: near-black warm syrup, amber/gold key light (`#e8b64c`). The inner glass
  is a dark polished cylinder (`#241a0e`-ish) catching a **moving caustic highlight** — a
  bright crescent that rotates with the crank angle so the eye reads rotation even before the
  dye moves. Knurled grip texture (fine radial ticks) on the inner rim, lit so it glints.
- The outer wall is a thin bright glass ring with a **rim-light** biased to one side (a fixed
  key light) plus a faint inner refraction band — the syrup meniscus. It does NOT rotate (the
  outer cylinder is fixed).
- A **fiducial** mark on the inner glass (a gold radial spoke + dot) that rotates by the exact
  crank angle, so the crank is legible: you can count turns by watching it.
- When idle (not being dragged) a soft dashed "grab" ring pulses gently on the inner glass —
  the affordance. When dragging, it hides.
- Beautiful at rest AND while spinning; ~60fps. Reduced-motion: drawn once as a still, so the
  caustic sits at a pleasing fixed angle and the grab-ring is static.

## EXACT API the forged code must expose
A classic script that sets `window.UnstirringGlass` before the page module boots:

```js
window.UnstirringGlass = {
  // Draw the glass cylinders (inner + outer), caustics, rim-light, grip, and fiducial.
  // Called AFTER the dye each frame (glass sits over the dye like real front glass).
  //   ctx   : DPR-scaled 2D context (draw in CSS px).
  //   view  : { cx, cy, S, Rin, Rout } as in the dye spec.
  //   env   : { wind, windAbs, Re, dragging, spin, t } — wind = net turns (drives the
  //           fiducial + caustic angle = wind*2π), dragging = bool (hide grab-ring),
  //           spin = current momentum (rad/frame) for optional motion-blur, t = seconds.
  drawGlass(ctx, view, env) { /* … */ }
};
```

Must restore any ctx state it changes (composite op, transform, lineDash) before returning.
No DOM, deterministic. The inner-glass caustic + fiducial rotate by `env.wind * 2π`.

## How it wires in
Frame order: syrup → dye → **glass** (`UnstirringGlass.drawGlass(ctx, view, env)`) → UI.
Placeholder: a stub `window.UnstirringGlass` in `index.src.html` drawing the current ring
outlines + fiducial + grip ticks. The forged winner replaces it; the page falls back to the
stub if absent.

## Preview harness
`bash the-unstirring/art-specs/preview-dye.sh <candidate.js> <outdir> <port> glass` (same
harness, `glass` mode) loads the candidate as `window.UnstirringGlass`, sets a mid-crank angle
so the caustic + fiducial are off-axis, and screenshots `<outdir>/preview.png`.

## Judge focus
Does the glass read as lit, grabbable glassware — a caustic + rim-light that turn with the
crank, a legible fiducial, an inviting idle grab-ring — rather than flat amber outlines?
