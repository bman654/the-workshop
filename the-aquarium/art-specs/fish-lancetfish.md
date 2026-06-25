# Art spec — Lancetfish (the apex DART)

## Asset
- **key:** `fish-lancetfish`
- **medium:** visual-exhibit (canvas draw fn, code — never a PNG)
- **installs into:** `the-aquarium/art/fish.js` (the foundry creates this module; a follow-up wiring builder swaps the placeholder `drawFish` branch to call it). Until then the placeholder vector silhouette in `index.src.html` (`drawFish`, the `dart` branch) stands in.

## Art direction
The **apex predator** of the column — a long, lean, fast hunter that hangs up in the **sunlit / upper-twilight** band (depth 0.06–0.34). Think lancetfish / barracuda: a slender silver-blue body (`#cdd7ee`), a long tapering snout, a single hard dorsal, a deeply forked tail it beats with a crisp snap. It should read as the BIGGEST, most deliberate fish in the tank — sparse and commanding, the one you'd reach in to pull out. Cold daylight catches its flank as a thin specular sheen. NOT cartoonish; spare, knife-like, a little menacing. Matches the estate's indigo+brass deep-water idiom (room accent `#5b73c4`), lit from above.

## The swim-cycle
A `ph` phase (radians, advances ~6–10/s) drives a travelling body-wave: the tail sweeps side to side, the body flexes subtly behind the head. On `boil>0.3` (a feed/startle surge) the beat sharpens and speeds. Must look alive across a full `ph` cycle, not a static decal rotated.

## EXACT API the candidate code must expose
```js
// @kind fish
// @assetKey fish-lancetfish
window.__ASSET = function drawLancetfish(ctx, p) {
  // ctx: a 2D canvas context ALREADY translated to the fish centre and rotated to
  //      its heading (+x = forward/nose, +y = down). Draw in LOCAL coords; do NOT
  //      translate/rotate/save the global transform expectation — you may ctx.save()/
  //      restore() internally but must leave the transform as received.
  // p = { s, L, col, ph, boil, light, TAU } where:
  //   s     : body half-height scale in px (~9 for the apex)
  //   L     : body half-length in px (~ s * 2.0)
  //   col   : '#cdd7ee' (the species colour; honour it, you may derive shades)
  //   ph    : swim phase in radians (animate the tail/body from this)
  //   boil  : 0..1 excitement (sharper/faster beat, brighter sheen near 1)
  //   light : 0..1 ambient light reaching this depth (multiply your alphas by it;
  //           the apex does NOT self-glow — it dims with depth)
  //   TAU   : Math.PI*2
  // Draw the body so the NOSE is at roughly +L on x and the TAIL near −L.
};
```
- Pure canvas2d, no external assets, no network, deterministic given `ph`.
- Keep it cheap: this runs for up to a few dozen apex boids at 60fps among 240 total.
- Use `light` for depth-dimming; the apex carries NO self-glow halo (the page draws halos only for `glow:true` species).

## How it wires in
The page's `drawFish(b,t)` currently hand-draws each shape. After forge installs `art/fish.js`, the wiring builder will: `forge:include art/fish.js`, then in the `dart` branch call `window.__ASSET_lance(ctx,{s,L,col:sp.col,ph:b.ph,boil:b.boil,light,TAU})` (the wiring builder picks the final global names; this spec only fixes the SIGNATURE). The glow halo + the `ctx.translate/rotate` to the boid remain the page's job.

## Preview / judging
`bash the-aquarium/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` renders an 8-pose swim-cycle grid over the tank backdrop → `<outdir>/preview.png`.

**judgeFocus:** a lean, knife-like apex hunter with a crisp, clearly-animated tail-beat that reads as the tank's biggest, most deliberate fish — beautiful and alive in deep-water indigo, not a cartoon.
