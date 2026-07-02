# Art asset — `dye-bloom` (visual-exhibit)

## What it is
The painterly render of the dye cloud in **The Unstirring**. The page holds ~2600 dye
particles, each an `advect`-driven point in a glass annulus of thick syrup. Right now they
render as flat additive amber squares (`ctx.fillRect`). This asset replaces that flat splat
with a **painterly bloom**: a warm luminous amber CORE fading to a cooler (rose→teal) EDGE,
so that when the blob is smeared into an invisible spiral the *smear itself reveals depth* —
dense folded regions glow warm, thin trailing filaments cool and translucent. The dye should
look like real ink suspended in syrup catching a warm inner light, not like a particle system.

## Art direction
- Estate idiom for THIS exhibit (NOT the gate brass idiom): near-black warm syrup
  (`#080604`), a single **luminous amber** dye (base hue ~40°). The blob at rest is a soft,
  fat, glowing lozenge; smeared, it becomes a spiral ribbon whose brightness tracks local
  particle density (folded = bright, stretched = faint).
- **Warm core → cool edge**: the center of the dye mass reads hot amber/gold
  (`hsl(42, 90%, 62%)`-ish); the outer skin of the cloud cools toward rose then a faint teal
  (`hsl(190, 70%, 55%)`), so overlapping smeared sheets separate visually (depth from colour,
  the way real dye in a clear medium does). The cool edge must stay subtle — a rim, not a
  rainbow.
- Additive/screen compositing so overlapping dye BRIGHTENS (glows) rather than muddies.
- It must read beautifully at BOTH states: (a) the resting blob (a jewel), and (b) the fully
  wound spiral (a luminous nautilus of folded light). And it must animate cleanly at ~60fps
  for ~2600 points on desktop and hold up (maybe fewer points) on mobile.
- Honor `prefers-reduced-motion`: the draw fn is called once for a still frame in that mode,
  so it must produce a lovely STILL image too (no reliance on motion-blur trails).

## EXACT API the forged code must expose
A classic (non-module) script that sets `window.UnstirringDye` **before** the page module
boots. Shape:

```js
window.UnstirringDye = {
  // Called once per frame. Draw the entire dye cloud into ctx.
  //   ctx      : the 2D context of the main canvas (already DPR-scaled via setTransform,
  //              so draw in CSS pixels).
  //   pts      : the live particle array. Each p = { r, th, r0, th0, seed } where r∈[A_IN,B_OUT]
  //              (normalized radius), th = angle (radians), r0/th0 = home coords, seed∈[0,1)
  //              a stable per-particle random for texture variation.
  //   view     : { cx, cy, S, Rin, Rout } — center in CSS px, S = px per unit radius, and the
  //              inner/outer wall radii already in px (Rin = A_IN*S, Rout = B_OUT*S).
  //   env      : { wind, windAbs, Re, density, t } — wind = net turns (signed), windAbs =
  //              total |crank| path, Re∈[0..1] normalized inertia, density = a 0..1 hint of
  //              how folded the cloud is (0 = fresh blob, 1 = fully smeared), t = seconds.
  draw(ctx, pts, view, env) { /* … */ }
};
```

The fn OWNS its compositing: it may set `ctx.globalCompositeOperation` but MUST restore it to
`'source-over'` before returning (the page draws glass/UI after). It must not clear the canvas
(the page clears + paints syrup first) and must not read/write DOM. Deterministic given the
same pts/env (use `p.seed`, never `Math.random()` per-frame, so it doesn't shimmer randomly).

## How it wires in
The page draws in this order each frame: (1) clear + syrup background, (2) **the dye** —
`UnstirringDye.draw(ctx, P, view, env)` — (3) the glass cylinders + fiducial + UI overlays.
Placeholder: a stub `window.UnstirringDye` in `index.src.html` that draws flat amber squares
(the current look). The forged winner replaces it. The page falls back to the stub if
`window.UnstirringDye` is absent, so it always renders.

## Preview harness
`bash the-unstirring/art-specs/preview-dye.sh <candidate.js> <outdir> <port>` loads the
candidate as `window.UnstirringDye`, drives the page to a **half-wound** state (a smeared
spiral, Re≈0) so the judge sees the bloom revealing fold-depth, and screenshots
`<outdir>/preview.png`.

## Judge focus
Does the dye read as luminous painterly ink whose smear reveals depth (warm core → cool
edge), beautiful at both the resting blob and the wound spiral — not flat additive squares?
