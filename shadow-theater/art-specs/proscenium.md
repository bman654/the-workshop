# Art spec — `proscenium` (visual-exhibit): the SILK, the ARCH, the LAMP BLOOM

## What this asset is
The backdrop of The Shadow Theater: the warm amber SILK the shadows fall on, the
carved walnut PROSCENIUM arch that frames it, and the LAMP BLOOM — the pool of warm
light thrown from the lamp behind the silk. This is `proscenium.js` →
`window.Proscenium`. The shadows (the reduced-res `acc` buffer) are MULTIPLIED on
top of `drawScreen`, so wherever the silk is bright, a shadow reads deep-brown-black
and the silk still bleeds a little warmth at the penumbra.

Art direction:
- **The silk** — a warm amber WEAVE, never a flat fill. A deterministic fine grain
  (mulberry32) that reads as woven cloth held to a lamp: brightest toward the upper-
  middle stage where the lamp falls, dimming to a soft vignette at the edges. Think
  raw silk backlit by a single warm bulb — living, slightly uneven, hand-strung.
- **The arch** — a carved walnut proscenium: a warm bevelled frame band around the
  stage with a thin gilt inner rail and a gentle carved arch across the top. Estate
  walnut-and-brass, matching the cabinet the canvas sits in.
- **The lamp bloom** — a separate per-frame draw so it TRACKS THE DOLLY: as the lamp
  comes in (higher intensity `k`), the bloom widens and brightens; as it pulls back,
  it tightens and dims. This is what makes the whole stage feel lit by one moving lamp.

The PLACEHOLDER (`proscenium.js`) is honest amber weave + arch + bloom and looks
good now. This asset makes the weave, the walnut grain, and the bloom **beautiful**
— same API.

## The EXACT API the candidate code must expose
Replace the draw bodies in `proscenium.js`, keeping all three exports + signatures:

```js
window.Proscenium = {
  // opaque silk + woven grain + vignette, in CSS px. Called (or cached) per resize.
  drawScreen: function (ctx, W, H) { … },
  // the warm bloom at the lamp's projected screen point (x,y); k = intensity (~0.2–1.6).
  // Draw additively (globalCompositeOperation 'lighter') so it BRIGHTENS the silk.
  drawLampBloom: function (ctx, x, y, W, H, k) { … },
  // the walnut arch + gilt rail, drawn OVER everything last.
  drawFrame: function (ctx, W, H) { … },
  __forged: true
};
```

- Pure Canvas2D; no external images/fonts. Any grain must be DETERMINISTIC (seeded
  mulberry32) so the rendered result is stable. A cached offscreen grain tile is fine
  and encouraged (the placeholder caches per size).
- `drawScreen` is treated as static (cached to an offscreen once per resize); it must
  not depend on time or the lamp. `drawLampBloom` is the ONLY per-frame draw and
  MUST depend on `(x,y,k)`. `drawFrame` is static.
- Keep the amber/walnut/gilt palette family (the piece's `--amber #ffe2a6`,
  `--walnut`, `--gilt #c9a24a`). The shadow ink multiplied on top is `#140b05`.

## How it wires in / how the harness renders it
`index.src.html` forges `./proscenium.js` inline. Rendered in true context by:

```
bash shadow-theater/art-specs/preview-harness.sh <candidate.js> <outdir> <port>
```

(auto-detected as the proscenium module). The screenshot shows the silk + bloom +
arch behind a posed cast, so the judge sees the backdrop under real shadows.

## Judge focus (one line)
Does the silk read as **warm, woven, lamp-lit cloth** (never a flat gradient) inside a
handsome carved walnut arch, with a lamp bloom that clearly pools + tracks brightness?

## Constraints
- Keep the three exports + signatures; `drawScreen` static/cacheable, bloom per-frame.
- Deterministic grain; no foraged textures; no external assets.
- The bloom must brighten (additive), not darken; it must visibly widen with `k`.
- Do not draw puppets or shadows here — this module owns ONLY the backdrop.
