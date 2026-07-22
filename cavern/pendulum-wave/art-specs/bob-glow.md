# Art asset — the bob-glow (visual-exhibit)

The luminous body of one pendulum bob: a small glowing sphere that paints both the
sharp bob on the stage AND, dimmed and additively composited, the light-painting
TRAIL that leaves arcs fading into the travelling-wave envelope. Fifteen of these,
hue-mapped teal → indigo, ARE the exhibit. The placeholder is a flat 3-stop radial
gradient; this asset replaces it with something that reads as *light*, not paint.

## Art direction

- **Contemplative, jewel-like, luminous.** The stage is near-black (`#070809`) with a
  cold vignette. Each bob is a note made visible: a hot near-white core bleeding into
  its hue, falling to transparency at the rim. Think a struck marimba bar's afterglow,
  or a slow bioluminescent pulse — soft, radiant, a little liquid. NOT a hard billiard
  ball, NOT a flat disc, NOT a lens-flare with spikes.
- **Additive-friendly.** It is drawn under `globalCompositeOperation='lighter'` for the
  trail layer, so overlapping stamps must SUM into a brighter smear (that is how the
  arcs paint). Keep alpha in the outer stops low so overlaps bloom gently instead of
  clipping to white.
- **Hue is the bob's identity.** `hue01` runs 0 (the longest, slowest, LOW note) → 1
  (the shortest, HIGH note). 0 must read teal `#7fd4c0`, 1 must read indigo `#b18cff`;
  the ramp between is the estate's teal→indigo signature. A candidate MAY curve the
  ramp for beauty but must hit those endpoints recognizably.
- **Intensity is motion.** `intensity` (0..1) is swelled by the bob's angular speed —
  bright and blooming as it whips through the bottom, dim and small as it hangs at a
  crest. The glow should visibly *breathe* with it (radius and/or brightness), so the
  wave shimmers as it travels. It must still render at `intensity` near 0 (a faint ember).
- No external assets, no images, no fonts — pure canvas 2D drawing, deterministic.

## EXACT API the candidate code must expose

The candidate is a JS file loaded as a plain `<script>`. It MUST assign:

```js
window.__ASSET = function (ctx, x, y, r, hue01, intensity) { /* draw one bob-glow */ };
```

- `ctx` — a CanvasRenderingContext2D. Draw only; do NOT clear the canvas, set
  `globalCompositeOperation`, or leave transforms/alpha changed (save/restore if you
  touch them). The caller sets `'lighter'` for trail stamps and `'source-over'` for the
  sharp pass — your function must look right under BOTH.
- `x, y` — the bob centre, in CSS pixels of the drawing surface.
- `r` — the nominal on-screen glow radius (≈11–16 px in use). Treat it as the core
  scale; your bloom may extend past `r` but keep the *visible* body near `r`.
- `hue01` ∈ [0,1] — teal→indigo as above.
- `intensity` ∈ [0,1] — overall brightness / bloom amount.

It MAY also assign a matching hue ramp (used for the solid core + as a fallback):

```js
window.__HUE = function (hue01) { return [rInt, gInt, bInt]; };  // 0→teal, 1→indigo
```

## How it wires in

The winner's `window.__ASSET` body becomes **`PA.bobGlow(ctx, x, y, r, hue01, intensity)`**
in `cavern/pendulum-wave/art.js` (the `PA.bobGlow` placeholder there is the target),
and, if provided, `window.__HUE` becomes **`PA.hueColor(hue01)`**. The page
(`index.src.html`) already calls `PA.bobGlow(...)` twice per bob per frame — once onto
the additive trail canvas (dimmed), once sharp on top — and `PA.hueColor(...)` for the
solid core and the trail. **After installing, re-forge** (`node tools/forge/forge.mjs
cavern/pendulum-wave/index.src.html`) since art.js is forge-inlined, then
`node tools/forge/forge.mjs --check --all` must stay clean.

## Preview / judging

`bash cavern/pendulum-wave/art-specs/preview-harness.sh <candidate> <outdir> <port>`
renders the candidate on the real dark stage as 15 graduated-hue bobs along a
travelling-wave arc, with additive trail ghosts, and writes `<outdir>/preview.png`.

- **judgeFocus:** does it read as luminous, jewel-like light (hot core → hue → clean
  transparent rim), hit teal@0 / indigo@1, and bloom gently (not clip to white) where
  the additive trails overlap?
