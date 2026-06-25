# Art spec — the chemosynthetic vent + coral floor

## Asset
- **key:** `vent-coral`
- **medium:** visual-exhibit (canvas draw fn, code)
- **installs into:** `the-aquarium/art/vent.js`. Placeholder: `drawVent(t)` in `index.src.html` (the radial glow + smoke columns + chimney triangle + bezier fronds stand-in).

## Art direction
The quiet surprise at the bottom of the tank — a **hydrothermal vent** glowing its OWN cold light on the otherwise lightless floor, with a black-smoker chimney silhouette, slow rising mineral "smoke," and a scatter of vent-adapted coral / tubeworm fronds catching the glow. This is where the food web is rooted (the vent shrimp graze here), so it must feel ALIVE and primary, not decorative: a cold teal-white core (`rgba(120,210,200,…)`) bleeding to deep blue, a craggy hand-tuned chimney, billowing chemistry smoke that drifts and curls upward, and a few coral/tubeworm shapes (dusky red `rgba(200,90,70,…)` tipped with the vent's teal). Hand-tuned gradients + a little procedural noise for the smoke — NEVER foraged. The glow should breathe slowly and scale gently with the basal stock the page passes in (`env.stock`), so the floor's life is something you can SEE rise and fall during the cascade.

## Time / animation
A continuous `t` (seconds): the glow pulses slowly, the smoke rises and curls, fronds sway faintly. Deterministic given `t` + `stock`.

## EXACT API
```js
// @kind vent
// @assetKey vent-coral
window.__ASSET = function drawVent(ctx, env) {
  // env = { W, H, RIM, yOfDepth, t, TAU, stock }
  //   W,H,RIM,yOfDepth,t,TAU : as in caustics.md
  //   stock : the live basal standing-stock (vent shrimp food), ~0..80 — scale the
  //           glow radius/intensity gently with it (clamp so it stays tasteful)
  // Paint the vent glow (use globalCompositeOperation='screen' for the glow, restore
  // it), the rising smoke, the chimney silhouette (opaque dark), and the coral/
  // tubeworm fronds, all anchored near (W*0.5, yOfDepth(0.985)). Do NOT clear; the
  // depth gradient + caustics are already beneath you. Confine to roughly depth 0.7..1.
};
```
- Pure canvas2d, cheap enough every frame.

## How it wires in
After forge installs `art/vent.js`, the wiring builder does `forge:include art/vent.js` and replaces the body of the page's `drawVent(t)` with `window.__ASSET_vent(ctx,{W,H,RIM,yOfDepth,t,TAU,stock:web.n[3]})`. Drawn after the caustics, before the fish.

## Preview / judging
`bash the-aquarium/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` (`@kind vent`) → `<outdir>/preview.png`.

**judgeFocus:** a living hydrothermal vent — a cold teal glow that breathes, a craggy black-smoker chimney, curling mineral smoke, and vent-coral fronds — that reads as the primary, alive root of the floor, hand-tuned and never foraged.
