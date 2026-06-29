# Art spec — the carved-granite menhir sprite (`Stones.menhir`)

**Status: OPTIONAL enrichment.** The bench ships with a complete, soulful HAND-DRAWN menhir
(see `drawStone` in `index.html` / `index.src.html`): a tall worn slate slab with a vertical
granite gradient, a lit western face, weathering cracks, and moss-fleck pits, plus a soft
radial repel-halo. It reads as a real standing stone, not a greybox. This spec documents the
forge hook so a FUTURE foundry pass could lift the sprite to a richer render WITHOUT touching
the mechanic — it is not required for the piece to be complete.

## The hook (already wired)

`drawStone(s, showRange, ghost)` checks `if (Stones.menhir) { Stones.menhir(ctx, px, py, sc, ghost, t); return; }`
before falling back to the hand-drawn slab. So a forged sprite drops in by assigning
`Stones.menhir` — nothing else changes.

## The API the forged code must expose

```js
// Installed onto the page's `Stones` object (window-less module pattern, like the audio stub).
Stones.menhir = function (ctx, x, y, scale, ghost, t) { … };
```

- `ctx`     — the live 2D canvas context (already in screen space; do NOT apply the camera).
- `x, y`    — the menhir's BASE-CENTRE in screen pixels (the stone stands UP from here; draw the
              body above y, the contact shadow at ~y + 1.5·r where r ≈ 10·scale).
- `scale`   — device-px per world-unit × camera zoom (multiply all sizes by this; r = 10·scale is
              the hand version's body half-width reference).
- `ghost`   — true for the placement PREVIEW under the cursor (draw at ~0.42 alpha, no shadow).
- `t`       — `performance.now()/1000` seconds, for an optional faint idle shimmer (keep subtle;
              the stone is STILL — it never sways or pulses hard).

It draws ONE menhir and returns nothing. No state, no allocation per call beyond gradients.

## Art direction

Match THE EXHIBIT, not the gate brass idiom: a top-down dusk pasture. A carved GRANITE standing
stone — cool slate-blue body (`#9fb1c4` lit → `#4e5c6e` shadow), tall and slightly asymmetric, a
worn weathered surface (hairline cracks, lichen/moss flecks, a chipped edge), a lit western face.
A soft repel-halo (`rgba(143,163,184,…)`) bleeds out a few px (the felt pressure; the FLEE_RANGE
ring is drawn separately by the page). Reads as ancient, set, immovable — the OPPOSITE of the
live dog in The Shepherd. No text, no brass.

## Preview harness

`bash the-standing-stones/art-specs/preview.sh <candidate.js> <outdir> <port>` — loads the
candidate as `Stones.menhir`, forces a level into placing with stones placed, screenshots
`<outdir>/preview.png`. (Harness to be written if/when a foundry pass is actually scheduled;
not built now since no pass is requested this cycle.)

## Why no foundry pass is requested this cycle

Per the house rule ("a single simple shape you can draw well yourself, just draw; don't
over-reach"), the hand-drawn menhir already clears the bar — verified in-browser. The hook stays
so a later enrichment is a drop-in, but the piece is COMPLETE without it.
