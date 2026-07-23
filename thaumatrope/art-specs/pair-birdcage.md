# Forged engraving — the BIRD ↔ CAGE pair (The Thaumatrope)

The hero card. Two faces of one paper disc that FUSE when whirled: a little bird
(front) that lands centred inside an empty birdcage (back). The oldest thaumatrope
image there is — "the bird in the cage." Make it charming and unmistakable.

## Art direction
- **Hand:** warm ink-on-parchment ENGRAVING, in the estate's dark-gold Victorian
  parlour key — the same world as The Faithful Drum next door. Think a hand-inked
  woodcut / copperplate from a Regency optical-toy card: confident tapering strokes,
  a little cross-hatch or stipple for weight, NOT a flat vector clip-art outline.
- **Ink:** warm near-black `#2b2a24` (and softer greys of it) on the parchment
  ground. You MAY use a second muted tint sparingly (a dull sanguine `#8a4a2a`) for
  an accent (the bird's eye/beak, a ribbon on the cage) but keep it mostly ink.
- **Bird (front face):** a small perched songbird, roundish body, a cocked head, a
  visible eye, a hint of wing feathering and a forked tail — alive and sweet, filling
  a central footprint roughly Ø ~150–190 px.
- **Cage (back face):** an ornamented domed birdcage — a ring finial + hook at top, a
  bell-curved dome, ~7–9 vertical bars, a base rim, maybe a little swing perch. The
  bars are the payoff: the fused frame should read "the bird is *behind bars*."

## REGISTRATION (the whole trick)
The two faces are composited by the page's temporal integrator — **no pre-authored
fused image is needed; the fusion is computed.** Your only job is to place the marks
so they LAND RIGHT when overlaid:
- Both faces are 360×360, origin top-left, the card's spin axis is the **vertical
  centre line x=180**. Centre the bird's mass on x≈180 and the cage's opening on
  x≈180 so the bird sits INSIDE the cage, not beside it.
- Vertically, seat the bird near the cage's mid-height (the caged bird sits on the
  perch, roughly y≈170–210), so the composite reads centred, not top-heavy.
- **The BACK face (the cage) must be authored ALREADY-MIRRORED** — the renderer draws
  the back with a horizontal flip about x=180 so a drawn back lands square over the
  front. For a symmetric cage this is a no-op; if you add an asymmetric flourish
  (a latch on one side), draw it on the side it should appear AFTER the flip
  (i.e. pre-mirror it yourself). A near-symmetric cage is the safe, classic choice.
- Leave the parchment ground to the paper texture asset — but each face MAY paint its
  own parchment fill first (see API); keep ink off the extreme 8 px margins.

## API the candidate MUST expose
The candidate is one JS file. Evaluated in the page it defines a global installer
used by BOTH the preview harness and (after integration) the shipped page:

```js
window.installThaumArt = function (A) {
  A.setPair('birdcage', drawBird, drawCage);   // drawBird=front, drawCage=back(pre-mirrored)
  return 'birdcage';                            // the pair key the harness mounts + fuses
};
// AND register for the shipped build (read by faces.js before it builds the pairs):
(window.ThaumArt = window.ThaumArt || {}).birdcage = { a: drawBird, b: drawCage };

function drawBird(ctx){ /* paints one 360x360 face: parchment fill, then ink the bird */ }
function drawCage(ctx){ /* paints one 360x360 face: parchment fill, then ink the cage */ }
```
- `ctx` is a 360×360 canvas 2D context. Paint an opaque parchment ground first
  (`ctx.fillStyle='#f3ecd6'; ctx.fillRect(0,0,360,360)`), then the ink. (The shipped
  page swaps in a richer parchment via the `paper` asset; a flat `#f3ecd6` fill here
  is fine and correct.) Pure canvas 2D, no external assets, deterministic (no
  randomness that changes per call — a fixed stipple seed is fine).
- Keep each face well under a few ms to draw; it is rasterised once into a 360² bitmap
  at mount and reused every frame.

## Wiring (the wiring builder does this; not the smith)
The synth installs the winner at `thaumatrope/art/birdcage.js`. To SHIP it: add
`<!-- forge:include ./art/birdcage.js -->` in its own `<script>` in
`thaumatrope/index.src.html` **before** the `faces.js` include, rebuild via forge,
and confirm `faces.js` picks up `window.ThaumArt.birdcage` (it prefers it over the
placeholder). Re-run the payoff-liveness twin + a fresh screenshot at the lock.

## How the harness previews you
`bash thaumatrope/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` loads
the live exhibit, installs the candidate, rebuilds the rack, mounts bird/cage, parks
the rate rail above the fusion lock, and screenshots the FUSED composite to
`<outdir>/preview.png`. Judge on that fused frame (plus the rack thumb).
