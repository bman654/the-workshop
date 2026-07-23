# Art asset — the machined lid bar (visual)

The heavy movable wall that rests on the gas. The placeholder is a flat three-stop grey
rectangle with a highlight line. This asset replaces it with a **machined metal bar** —
something that reads as heavy, milled, and real, so when it sinks and bobs you feel its
mass.

## Art direction

- **A heavy, milled steel lid bar**, seen edge-on: a long horizontal beam spanning the
  full box width. A subtle top bevel catching cool light, a darker underside in shadow,
  faint lengthwise machining striations, maybe two countersunk bolt-heads near the ends.
  Cool steel palette (`#b8c0c8 → #7f878f → #4b5158`) so it sits apart from the warm-amber
  vessel frame and the speed-coloured gas. No logos, no text, no colour beyond steel + a
  whisper of the vessel's amber in the top highlight.
- **Reads at a glance, at any width.** The bar is redrawn every frame at the live pixel
  width `w` and thickness `th` (both vary with the canvas size), so the look must be
  procedural and scale-clean — no fixed-size sprite, no baked resolution.
- **Weighty, not glossy.** Matte-milled, not chrome. It should look like it would *thunk*.

## EXACT API the candidate code must expose

Define, in the candidate JS file, a function assigned to **`window.__LID`**:

```js
window.__LID = function (ctx, x, yTop, w, th) {
  // ctx  : CanvasRenderingContext2D  (draw directly onto it)
  // x    : left edge of the bar, in CSS px
  // yTop : top edge of the bar, in CSS px   (the bar occupies y ∈ [yTop, yTop+th])
  // w    : bar width in px  (spans the full box)
  // th   : bar thickness in px
  // Draw the machined lid bar filling [x, x+w] × [yTop, yTop+th]. Stay within that band
  // (a ~1px highlight just above/at yTop is fine). No global state; no external assets.
};
```

Pure canvas 2D, deterministic, no external images. Keep it cheap — it draws every frame.

## How it wires in + preview

The winner replaces the body of `drawLidBar(py)` in `cavern/maxwell-boltzmann/lid.html`
(the placeholder currently there fills a three-stop grey rect). The call there passes the
box left `x`, the lid's pixel top `py-th`, the box width, and `th` — i.e. call
`window.__LID(ctx, LAYOUT.boxX, py-th, LAYOUT.boxW, th)`.

Preview: `bash cavern/maxwell-boltzmann/art-specs/preview-harness.sh <candidate> <outdir>
<port>` renders the bar at the lid's balance height over the live gas, with three
gym-plates resting on it, and screenshots `<outdir>/preview.png`.
