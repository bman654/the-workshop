# Foundry spec — `jar-frame` (The Crystal Garden)

## What this is
The **candle-warm water-glass jar** the garden grows in: the translucent silicate
body, the slow refraction, the meniscus, the sediment bed, the glass rim + edge
light, and a soft ambient bloom so the jar sits in warm apothecary candlelight
rather than on a flat black field. Installed live at
`alchemy/the-crystal-garden/jar-frame.js`. It draws BEHIND the tubes (`body`) and
OVER them through the near glass (`rim`).

## Art direction
- A stoppered apothecary jar of **water glass** (sodium silicate) — faintly teal,
  translucent, deeper toward the base, with slow diagonal refraction and a bright
  **meniscus** line under the surface. A shallow **sediment bed** of settled grains
  on the floor. The near glass should feel round and wet: a bright **left-edge
  light**, a soft right-edge shadow, a thin rim highlight.
- **Candle-warm ambience** is the point the placeholder under-sells: a soft, low
  amber **bloom** pooling behind/above the jar (as if a candle stands just off-frame),
  warming the top of the glass and the stopper, without washing out the tube colours
  inside. Deep near-black `#0f0c14` ground; estate golds `#dca74a`. Quiet, unhurried,
  beautiful — this is a silent contemplative bench, not a showpiece.
- The jar must NOT obscure the tubes: `body` sits behind them, `rim`/bloom over them
  must stay subtle (low alpha) so the coloured tubes always read.
- Reduced-motion (`t===0`): fully static, no shimmer term.

## The EXACT API the candidate CODE must expose
One global with TWO methods, assigned exactly as the placeholder does:

```js
(function(){
  var JarArt = {
    // everything BEHIND the tubes: glass body, refraction, meniscus, sediment.
    // Call, (caller draws tubes inside the shared clip), then rim().
    //   ctx  : CanvasRenderingContext2D (transform already scaled to logical units).
    //   JAR  : { x, y, w, h, floorY, ceilY, sed } jar geometry in logical px.
    //   t    : ms timestamp (0 under reduced-motion ⇒ fully static).
    //   opts : { sediment:[{x,y,r,a}], path:function(ctx){…} } — path(ctx) traces the
    //          rounded jar-interior sub-path so body & rim share ONE clip shape;
    //          call ctx.clip() after path(ctx) yourself when you need to clip.
    body: function(ctx, JAR, t, opts){ /* … */ },
    // the near glass OVER the tubes: rim highlight, edge light/shadow, candle bloom.
    rim:  function(ctx, JAR, t, opts){ /* … */ }
  };
  if(typeof window!=='undefined') window.JarArt = JarArt;
})();
```

Hard requirements:
- **No external assets, no imports** — pure canvas 2D, self-contained IIFE.
- `body` and `rim` must both restore any ctx state they change (the caller shares ctx
  and clips tubes between the two calls — do not leave a clip or transform dangling).
- Use `opts.path` to trace the interior; do not invent a different jar outline (it
  must match the interior the caller clips the tubes to).
- Keep `rim`/bloom SUBTLE (low alpha) — the tubes read through the near glass.
- `t===0` ⇒ no time-varying term (reduced-motion safe).

## How it wires in / how the preview renders it
- The view calls `JarArt.body(ctx, JARL, t, {sediment, path:jarPath})`, then draws the
  gardens inside `jarPath` clip, then `JarArt.rim(ctx, JARL, t, {path:jarPath})`.
  Same call sites as the placeholder — nothing else to wire.
- Preview/judge: `bash art-specs/preview-jar.sh <candidate.js> <outdir> <port>` swaps
  the candidate into `jar-frame.js`, forges, grows all five salts, screenshots
  `<outdir>/preview.png`.

## Judge focus
Does the jar read as a real, round, wet vessel of faintly-teal water glass lit by
warm off-frame candlelight (bloom, meniscus, edge light, sediment) — beautiful and
unhurried — WITHOUT obscuring or washing out the coloured tubes growing inside?
