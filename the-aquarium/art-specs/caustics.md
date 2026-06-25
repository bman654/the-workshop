# Art spec — the caustic light field

## Asset
- **key:** `caustics`
- **medium:** visual-exhibit (canvas draw fn, code)
- **installs into:** `the-aquarium/art/caustics.js`. Placeholder: `drawCaustics(t)` in `index.src.html` (the overlapping-sine-sheets stand-in).

## Art direction
The **raking sunlight on water** — slow, soft, ribbon-like caustic bands that crawl across the **upper, lit third** of the column (depth 0 → ~0.62) and fade to nothing as the light fails with depth. This is the single biggest "this is real water" cue. The current placeholder is flat horizontal sine sheets; the forged version should feel like true overlapping refraction caustics: a lattice of bright wandering veins and dark lulls that drift and re-mesh, brightest just under the surface, dissolving into the twilight. Cool blue-white (`rgba(150,205,235,…)` family), painted in `screen`/`lighter` blend so it adds light, never paints over the fish. Subtle — it must never strobe or distract from the calm; it is ambience you'd leave running.

## Time / animation
A continuous `t` (seconds) advances the field. Must loop seamlessly-ish (no visible seam) and move SLOWLY (a band crosses over many seconds). Deterministic given `t`.

## EXACT API
```js
// @kind caustics
// @assetKey caustics
window.__ASSET = function drawCaustics(ctx, env) {
  // env = { W, H, RIM, yOfDepth, t, TAU }
  //   W,H      : canvas px size
  //   RIM      : the brass-rim inset (draw inside [RIM, H-RIM])
  //   yOfDepth : (d in 0..1) => pixel y  (use to confine to the lit upper column)
  //   t        : seconds (animate from this; slow)
  //   TAU      : Math.PI*2
  // Paint the caustic light field for THIS frame. Use ctx.save()/restore() and set
  // your own globalCompositeOperation='screen' (restore it). Confine brightness to
  // roughly depth 0..0.62, fading to 0 by ~0.62. Do NOT clear the canvas (the depth
  // gradient is already painted beneath you).
};
```
- Pure canvas2d, cheap enough to run every frame at 60fps over the whole width.

## How it wires in
After forge installs `art/caustics.js`, the wiring builder does `forge:include art/caustics.js` and replaces the body of the page's `drawCaustics(t)` with a call to `window.__ASSET_caustics(ctx,{W,H,RIM,yOfDepth,t,TAU})`. Drawn after the depth gradient, before the vent + fish.

## Preview / judging
`bash the-aquarium/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` (`@kind caustics`) paints the field over the real depth gradient → `<outdir>/preview.png`.

**judgeFocus:** soft, slowly-crawling refraction caustics that read as true raking sunlight on the upper water and dissolve into the twilight — calm ambience, never a strobe, adds light without painting over the scene.
