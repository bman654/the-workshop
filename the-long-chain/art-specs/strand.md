# Art asset: `strand` — the long-chain luminous filament (visual-exhibit)

## What it is
The signature reveal of The Long Chain. When the Dots-and-Boxes board resolves into chains,
each LONG chain (length ≥ 3) is overlaid as one glowing **strings-and-coins** strand: a single
molten-gold filament threading the centres of the chain's boxes (the "coins"), the segments
between them the undrawn shared edges (the "strings"). Short chains (length ≤ 2) stay DIM.

The placeholder (in `index.src.html`, `renderStrand()`) draws this as flat `<line class="strand">`
segments + `<circle class="coin">` with a CSS `drop-shadow` glow. It works and reads, but it is
flat. The foundry asset should make the long-chain strand feel like a **live, luminous gold
filament under tension** — a thread of light, not a drawn line — so the reveal lands as a wonder.

## Art direction (match THE EXHIBIT, not the gate brass idiom)
- Palette: warm gold `--strand #f0d488`, against the dark slate/brass board. The glow is gold,
  never neon. Think candlelit filament / drawn honey / a struck harp string still ringing.
- The coins (box centres) are bright nodes; the strings (between) taper slightly and shimmer.
- A long chain should read as ONE continuous luminous object — the eye follows it end to end.
- Short chains: a thin, cool, dim line (`--strand-dim`) — present but clearly lesser. The contrast
  long-vs-short IS the teaching: the eye is drawn to exactly the chains that decide the game.
- Subtle life at rest: a faint travelling shimmer along the filament (a slow highlight that
  drifts coin→coin), so a long chain looks "charged." Keep it calm — this is a quiet board.
- Honour `prefers-reduced-motion`: when set, NO travelling shimmer / animation — a static
  luminous filament. (The page sets a global `transition-duration:0s` under reduced-motion; the
  asset must also check `REDUCED` for any JS-driven rAF animation and render a still frame.)

## The EXACT API the candidate code must expose
A JS module installed at `the-long-chain/strand-art.js`, loaded via `<!-- forge:include ./strand-art.js -->`
in `index.src.html` (added by the wiring builder), exposing a global:

```js
window.LongChainStrand = {
  // Draw ONE chain's strand into the given SVG <g>. Called once per chain by renderStrand().
  //   g       : an SVG <g> element to append into (already in the #board / #labboard svg)
  //   pts     : [{x,y}, ...] the box-centre coordinates in viewBox units, in chain order
  //             (the page computes these via orderChain + boxCenter; ≥1 point)
  //   opts    : { long: bool, reduced: bool, scale: number }
  //             long=true → the bright gold filament; long=false → the dim short-chain line
  //             reduced=true → render a STILL frame, start no animation
  //             scale → a size hint (px between dots) so coin radius / stroke width track the board
  // Returns: an object { stop() } — stop() cancels any rAF loop (the page calls it before
  //          re-rendering the strand each move, so animations never leak/stack).
  drawChain(g, pts, opts) { /* … */ }
};
```

The page will call `LongChainStrand.drawChain(layer, pts, {long, reduced, scale})` for each chain
inside `renderStrand()` (and the lab's `drawLab()`), replacing the current inline line+circle loop,
and will keep the returned handles to `.stop()` them on the next render. All drawing is SVG (the
board is an SVG); use SVG filters (feGaussianBlur / feColorMatrix) defined once in a `<defs>` the
module injects (id-namespaced, e.g. `lc-strand-glow`), not CSS drop-shadow, for richer control.

## How it wires in (for the wiring builder)
1. Remove the inline strand/coin drawing in `renderStrand()` (main board) and the equivalent loop
   in the lab's `drawLab()`; call `LongChainStrand.drawChain(...)` instead.
2. Track returned `{stop}` handles in a module-level array; call `.stop()` on each before the next
   `renderStrand()`/`drawLab()` so no rAF loop leaks (the board re-renders on every move).
3. The coordinate space is viewBox units (main board ~0..560; lab varies — pass `scale` =
   the px gap between dots so the asset sizes its coins/stroke to the board).
4. Keep the `showStrand`, `endgameBegun()`, and long/short gating in the page — the asset only
   draws what it is handed.

## Constraints
- Pure SVG + WebAudio-free (this is the visual asset; sounds are separate `sfx-*` assets).
- Deterministic at rest; any shimmer is time-based, seeded only by performance.now (no Math.random
  needed, but if used, seed it). 60fps; cheap (≤ a few chains × a few nodes on screen).
- Self-contained: no external assets, no network. Inline any filter defs.

## Preview harness
`bash the-long-chain/art-specs/preview-strand.sh <candidate.js> <outdir> <port>` loads the candidate
into a minimal SVG board showing a 4-coin long chain (bright) beside a 2-coin short chain (dim),
serves it, and screenshots `<outdir>/preview.png`.

## Judge focus
Does the long chain read as ONE live luminous gold filament (a thread of light, not a flat line),
clearly brighter/charged vs the dim short chain, calm and warm enough to sit on the dark board?
