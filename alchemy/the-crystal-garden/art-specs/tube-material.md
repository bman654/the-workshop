# Foundry spec — `tube-material` (The Crystal Garden)

## What this is
The material that draws ONE salt tube of a silica garden along a polyline so it
reads as a **hollow refractive mineral membrane** — a wet glass straw the light
passes THROUGH — not the flat coloured strand the placeholder currently draws.
Installed live at `alchemy/the-crystal-garden/tube-material.js`.

## Art direction
- These are osmotic "silica garden" tubes: a thin gelatinous **coloured membrane
  wall** enclosing a **hollow lumen** of shadowed liquid. The read to nail is
  HOLLOWNESS + WETNESS: a bright near wall catching the jar's left-edge light, a
  darker far wall / lumen you see through it, a faint specular glint that travels,
  and a soft bloom into the surrounding water. Think blown-glass capillary, backlit
  sea-anemone stalk, thin lampwork — NOT a painted brushstroke, NOT a solid rod.
- Estate idiom: candle-warm apothecary, deep near-black `#0f0c14` ground. The tube
  colour is the salt's own (`salt.core`/`edge`/`glow`); keep it luminous but not
  neon. It should look ALIVE and delicate, growing thinner and brighter toward the
  membrane bulb at the tip where new skin forms.
- It must read well at BOTH scales: a thick young trunk (width ~4–5) and a thinned
  old branch (width ~1). The hollow read may fade gracefully as width → ~1px.
- Motion-cheap: this is called once per tube per frame across up to ~12 gardens.
  Keep it to a handful of strokes/arcs — no per-point loops beyond tracing the path,
  no per-frame gradient allocation in a hot inner loop if avoidable.

## The EXACT API the candidate CODE must expose
A single global, assigned exactly as the placeholder does (so forge inlines it and
the view finds it):

```js
(function(){
  var TubeMat = {
    // draw ONE tube along a screen-space polyline.
    //   ctx    : CanvasRenderingContext2D, already clipped to the jar interior,
    //            transform already scaled (draw in the given coordinate units).
    //   pts    : [{x,y}, …] the tube path, >=2 points, already sway-transformed.
    //   width  : base stroke width in px (the tube's live w; ~0.75 … ~5).
    //   salt   : { core:'#rrggbb', edge:'#rrggbb', glow:'#rrggbb' } colour set.
    //   isTip  : truthy ⇒ tube still growing; draw the bright membrane bulb at pts[last].
    //   t      : ms timestamp for shimmer/glint (caller passes 0 under reduced-motion —
    //            when t===0 the material MUST be fully static, no time-varying term).
    draw: function(ctx, pts, width, salt, isTip, t){ /* … */ }
  };
  if(typeof window!=='undefined') window.TubeMat = TubeMat;
})();
```

Hard requirements:
- **No external assets, no imports** — pure canvas 2D drawing, self-contained IIFE.
- **Deterministic under `t===0`** (reduced-motion): identical output every call, no RNG.
- Draw ONLY within `pts` (the caller clips to the jar); do not fill large rects.
- Restore any `ctx` state you change (save/restore) — the caller shares the context.
- Colours come from `salt`; do not hard-code a hue (all five salts use this one fn).

## How it wires in / how the preview renders it
- The view (`index.src.html`) calls `window.TubeMat.draw(ctx, out, tip.w, salt, tip.alive, t)`
  once per tube per frame, inside the jar clip. Nothing else to wire — same call site
  as the placeholder.
- Preview/judge: `bash art-specs/preview-tube.sh <candidate.js> <outdir> <port>` swaps
  the candidate into `tube-material.js` in a temp build, forges, plants one grain of
  every salt at fixed seeds, grows them, and screenshots `<outdir>/preview.png` — a
  full jar of all five habits for scoring.

## Judge focus
Do the tubes read as HOLLOW, WET, REFRACTIVE glass membranes (near wall / see-through
lumen / travelling glint / soft bloom) rather than flat strands — across a thick trunk
AND a ~1px branch — while staying luminous in the salt's own colour and estate-warm?
