# Forged engraving — the FISH ↔ BOWL pair (The Thaumatrope)

Second card. A fish (front) that lands swimming inside a round goldfish bowl (back)
when the disc is whirled fast enough.

## Art direction
- Same warm ink-on-parchment ENGRAVING hand as the bird/cage card (read
  `pair-birdcage.md` for the shared style contract — Victorian optical-toy woodcut,
  tapering strokes, a little hatch/stipple, ink `#2b2a24` with a sparing muted tint).
- **Fish (front face):** a plump goldfish in side profile — a rounded body, a fanned
  tail, a dorsal fin, a visible eye, a hint of scales or a gill line. Lively, facing
  left or right, central footprint ~Ø160–200 px.
- **Bowl (back face):** a classic round fishbowl — a wide belly narrowing to a rim, a
  suggested waterline (a shallow ellipse) with a bubble or two rising, maybe a pebble
  or a frond at the base. The fused frame should read "the fish is *in the water*."

## REGISTRATION
- 360×360 faces, spin axis = vertical centre line x=180. Centre the fish's body on
  x≈180 and the bowl's belly on x≈180, fish seated near the bowl's mid-water height
  (y≈170–200) so the composite reads centred.
- The BACK face (the bowl) is authored ALREADY-MIRRORED (renderer flips the back about
  x=180). A near-symmetric bowl makes this a no-op; pre-mirror any one-sided flourish.
- Paint an opaque parchment fill first; keep ink off the extreme 8 px margins.

## API the candidate MUST expose
```js
window.installThaumArt = function (A) {
  A.setPair('fishbowl', drawFish, drawBowl);   // front, back(pre-mirrored)
  return 'fishbowl';
};
(window.ThaumArt = window.ThaumArt || {}).fishbowl = { a: drawFish, b: drawBowl };
function drawFish(ctx){ /* 360x360: parchment fill, then ink the fish */ }
function drawBowl(ctx){ /* 360x360: parchment fill, then ink the bowl */ }
```
Same `ctx` contract as the bird/cage spec (opaque `#f3ecd6` fill first, pure canvas
2D, deterministic, drawn once at mount).

## Wiring & preview
Synth installs the winner at `thaumatrope/art/fishbowl.js`; wiring builder
forge:includes it before `faces.js`. Preview with
`bash thaumatrope/art-specs/preview-harness.sh <candidate.js> <outdir> <port>`
(mounts fish/bowl, parks above the lock, screenshots the fused composite).
