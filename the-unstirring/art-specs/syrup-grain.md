# Art asset — `syrup-grain` (visual-exhibit)

## What it is
The **ambient background** of the scene: the near-black warm syrup pool with a faint living
grain / shimmer, so the field isn't a dead flat fill. Right now the page paints a single warm
radial gradient behind the annulus. This asset replaces that with a syrup surface that has
subtle depth — a faint volumetric grain, a slow warm shimmer suggesting a thick fluid catching
stray light, maybe a whisper of suspended motes. It must stay VERY subtle: the dye and glass
are the stars; this is atmosphere.

## Art direction
- Near-black warm brown-black (`#080604`) deepening toward the edges (vignette), warming
  slightly toward the center under the glass (as if lit from within the cell). A faint,
  low-contrast grain (film-grain / caustic-shimmer scale) that drifts SLOWLY — period of
  several seconds, amplitude tiny (a few % luminance). No hard shapes, no visible tiling.
- The mood is warm, quiet, expensive — candlelit amber syrup in a dark room. It should make
  the amber dye feel like it glows from inside the fluid.
- Reduced-motion: called once for a still; produce a pleasing static grain (no animation).
- Cheap: it draws every frame behind everything, so keep it to a cached offscreen pattern +
  a couple of cheap modulations, not a per-pixel noise loop each frame.

## EXACT API the forged code must expose
A classic script that sets `window.UnstirringSyrup` before the page module boots:

```js
window.UnstirringSyrup = {
  // Paint the full-canvas syrup background. Called FIRST each frame (before dye + glass).
  // MUST fully cover the canvas (the page does not clear separately when this is present —
  // it calls this instead of its own fill). Draw in CSS px.
  //   ctx  : DPR-scaled 2D context.
  //   view : { cx, cy, S, Rin, Rout, W, H } — center, scale, wall radii, canvas CSS size.
  //   env  : { t, Re, windAbs } — t = seconds (drives the slow shimmer), Re for a faint
  //          warm/cool bias (hotter fluid at high Re), windAbs unused-but-available.
  paint(ctx, view, env) { /* … */ }
};
```

No DOM, no external assets. Deterministic given t (a seeded value-noise, not `Math.random`
per frame). Restore ctx state before returning.

## How it wires in
Frame order: **syrup** (`UnstirringSyrup.paint(ctx, view, env)`) → dye → glass → UI.
Placeholder: a stub `window.UnstirringSyrup` in `index.src.html` painting the current warm
radial gradient. The forged winner replaces it; the page falls back to the stub if absent.

## Preview harness
`bash the-unstirring/art-specs/preview-dye.sh <candidate.js> <outdir> <port> syrup` loads the
candidate as `window.UnstirringSyrup` and screenshots `<outdir>/preview.png` at rest.

## Judge focus
Does the background read as warm, living, candlelit syrup with subtle grain/shimmer that makes
the amber dye glow from within — without ever competing with the dye or glass for attention?
