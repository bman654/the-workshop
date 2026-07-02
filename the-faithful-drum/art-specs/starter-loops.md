# Art spec — `starter-loops` (visual-exhibit): the five ink animation loops

## What this asset is
The five parametric STARTER LOOPS a visitor can drop into the zoetrope before drawing
their own. The PLACEHOLDER (`starter-loops.js`) draws them as thin stick-figure greybox
(a stroked ellipse ball, a line-segment horse, a stick walker). This asset ENRICHES each
into a charming, weighty 12-frame INK loop with gesture and timing — the kind of little
animation that makes the "it's alive!" moment land when the drum locks. Think classic
animator's exercises rendered in warm ink: a galloping horse (Muybridge stride), a
bouncing ball with squash-and-stretch and anticipation, a flower blooming open, a
walk cycle with weight shift and arm swing, a bird's wingbeat with follow-through.

## The exhibit context
- Each loop draws into ONE frame bitmap: a 2D context sized `144 × 220` (portrait; the
  strip cell). Origin top-left.
- Palette: warm gold `#f4d27a` default ink; cool `#6fb2c9`, green `#9ad06f`, rose
  `#c96f9a`, cream `#e8e0cf` accents are all in the estate's drawing palette and welcome.
  These are DRAWINGS on a dark drum wall, not brass — expressive ink, tapered strokes.
- The loop is sampled at 12 phases (`t = i/12`, i=0..11). Frame `i` and frame `i+1` must
  read as consecutive; the loop must be SEAMLESS (phase 0 continues cleanly from phase
  ~1). This is the whole point — a bad seam shows as a hitch when the drum locks.
- Each frame is later downscaled into a thin vertical slice seen through a slit, so keep
  the SUBJECT roughly centred with a margin (≥14px) from the cell edges, and keep the
  silhouette readable — the illusion assembles thin slices into the whole.
- Drawn once at load (not per-frame), so per-frame cost is irrelevant; spend the detail.

## The EXACT API the candidate code must expose
The candidate REPLACES the five drawing functions in `starter-loops.js`, keeping the
`window.Loops` object shape and every signature identical:

```js
window.Loops = {
  W: 144, H: 220,                                   // the frame cell dims (do not change)
  list: ['horse','ball','flower','walker','bird'],  // UI draw order (keep these 5 keys)
  horse(ctx, t)  { … },   // t ∈ [0,1) phase; draw the pose for this phase into ctx (144×220)
  ball(ctx, t)   { … },
  flower(ctx, t) { … },
  walker(ctx, t) { … },
  bird(ctx, t)   { … },
};
```

- `ctx` is a fresh transparent frame context; draw only the subject (transparent bg —
  the drum wall shows through). Do not fill an opaque background.
- Pure function of `t`: no time/Date, no RNG that changes between calls for the same `t`
  (determinism keeps the loop stable and the seed reproducible).

## How the preview harness invokes it
`bash art-specs/preview.sh <candidate.js> <outdir> <port>` copies the candidate over
`starter-loops.js`, forge-builds, serves, loads a chosen starter into the strip, and
screenshots the STRIP DESK (all 12 frames laid out) as `<outdir>/preview.png` — so the
judge can read the whole cycle at once, plus the drum with it loaded.

## Judge focus (one line)
Do the twelve frames read as a charming, weighty, SEAMLESS ink loop (real gesture +
squash/stretch/follow-through) that will visibly "come alive" when the drum locks?

## Constraints
- Pure canvas 2D drawing code; no images, no external assets.
- Keep the 5 keys and `W/H/list`; keep each signature `(ctx, t)`.
- Seamless loop (phase 0 ≈ limit of phase→1); subject centred with edge margin.
- Estate ink palette; expressive but legible at slice scale.
