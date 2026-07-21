# ART SPEC — `paper-stock` · the sheet the poem lands on

## What it is

Every broadside this press pulls is a 520×780 canvas of **mould-made cream stock**. It is the object
the whole piece exists to produce — the visitor hangs it, watches it dry, reads it, keeps it. Today
the stock is a three-stop linear gradient, a noise-pattern multiply at 5%, horizontal laid lines
every 7px, two radial foxing blooms, and a deckle made of `destination-out` rectangles every 5px.
That is a decent stand-in and a poor sheet.

## Art direction

- **Warm cream rag paper**, roughly `#f4ecdb` → `#eadfc7` → `#dfd2b6` across the diagonal. Not
  yellow, not pink, not grey. It must look like something you would want to touch.
- **Real fibre.** A mould-made sheet has visible pulp: short fibres of slightly varying tone lying in
  the sheet, denser in some patches, a faint cloudiness when held to light. Not uniform grain noise.
- **Laid and chain lines.** Fine close laid lines one way, widely spaced chain lines the other,
  both *subtle* — a suggestion the eye finds when it looks, never a stripe pattern.
- **Age, sparingly.** A little foxing, a faint tide-line or two, maybe a hair or a fleck of a darker
  fibre. The `age` parameter (0..1) scales this. At `age 0` the sheet is fresh; at `age 1` it has sat
  in the shop a while. Never grubby, never a "vintage paper texture" cliché.
- **The deckle is the tell.** A mould-made sheet's edge is *feathered and thinning*, not nibbled: the
  fibres run out gradually, so the edge should be soft, slightly translucent, irregular over a scale
  of tens of pixels, with a couple of places where it runs almost straight and one where it wanders.
  The current per-5px-rect chatter reads as pixel damage.
- This sheet is seen at three sizes: **262px wide hanging on the line**, ~124px in the rack, and
  ~76vh in the reading view. It must not turn to mush at 124px nor look bare at full size.

## The EXACT API the candidate code must expose

A plain script (no modules, no imports) that assigns:

```js
window.CentoArt = window.CentoArt || {};
window.CentoArt.paper = {
  /**
   * Lay the blank stock into a 2D context. Called BEFORE any type is drawn.
   * Must fill the entire w×h area — it is the first thing on the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} o
   *   o.w, o.h  520, 780
   *   o.rnd     () => [0,1) — a SEEDED rng. Use ONLY this for randomness.
   *   o.age     0..1 — how long this sheet has been in the shop
   */
  stock(ctx, o) { /* … */ },

  /**
   * Feather the deckle edge. Called AFTER the type and the impression are laid,
   * so it must eat the sheet away from the OUTSIDE — use
   * ctx.globalCompositeOperation = 'destination-out' and restore what you touch.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} o  { w, h, rnd }  — rnd is a DIFFERENT seeded stream
   */
  deckle(ctx, o) { /* … */ }
};
```

### Hard requirements

1. **Determinism is load-bearing.** The page's self-test asserts that the same seed and pull
   reproduce byte-identical pixels. Use **only `o.rnd`** — no `Math.random`, no `Date`, no
   `performance.now`. A single stray `Math.random()` fails check (f) and breaks the rack.
2. `stock` must leave the context state as it found it (`save`/`restore` around any
   `globalAlpha` / `globalCompositeOperation` / `filter` / transform change).
3. `deckle` must only ever REMOVE. It runs after the impression pass; anything it adds will sit on
   top of the type.
4. Cost matters: up to 12 sheets are rendered and live at once, and a pull renders one per forme
   change. Budget roughly **≤25ms per sheet** on a laptop. An offscreen fibre tile you build once
   and reuse as a pattern is the right shape of solution.
5. **No external images, no network, no data-URI photographs.** Everything procedural, drawn with
   canvas primitives / `createImageData` / patterns.
6. `"use strict"`-safe; no globals other than `window.CentoArt`.

## How it wires in

In `compositor/the-cento-press/index.html`, inside `renderBroadside()`, the block commented
`/* ── the stock ── */` (the gradient + noise multiply + laid lines + foxing loop) is replaced by
`window.CentoArt.paper.stock(s, {w:SW, h:SH, rnd, age: …})`, and the block commented
`/* ── the deckle … ── */` is replaced by `window.CentoArt.paper.deckle(s, {w:SW,h:SH,rnd})`.
The module loads via `<script src="paper-stock.js">` before the main script.

**Module the winner installs into:** `compositor/the-cento-press/paper-stock.js`

## How the preview harness invokes it

```
bash compositor/the-cento-press/art-specs/harness/render-take.sh <candidate.js> <outdir> <port>
```

It renders **four sheets at four `age` values from four different seeds**, lays a sample of the real
broadside's type on each (a 21px oxblood opening plus 16px body) so the stock is judged UNDER ink the
way it will actually be seen, applies `deckle`, and screenshots `<outdir>/preview.png`.

## The bar

Does this read as a sheet of real mould-made rag paper that a poem has been pressed into — fibre you
could feel, an edge that feathers rather than chips — while staying quiet enough that the type is
still the loudest thing on the sheet? And is it deterministic from `o.rnd` alone?
