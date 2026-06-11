# 🅰️ Compositor

*Set a striking typographic poster from any seed.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
composes a generated evocative phrase into a designed poster in a chosen **movement**: a real
design system picks the palette, type, grid, and ornaments, and the seed varies the composition
within it. Canvas-rendered, so **Export PNG** is one click. Every poster is reproducible from its
**seed + movement + text**.

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), pick a movement, type your own title — or hit
**🎲 generate text** — and **Export PNG**.

- **5 movements:** Swiss/International (modular grid, flush-left grotesque, one red accent), Bauhaus
  (primary palette + geometric motif), Brutalist (one or two MASSIVE words, intentional edge-crop),
  Art Deco (gold-on-teal, centred letter-spaced caps, framing border), Editorial (elegant serif,
  classic margins, hairline rules, drop-figure).
- **Controls:** seed + dice, movement selector, title + subtitle fields, Scale/Contrast · Ornament ·
  Format (portrait / square / wide) sliders, and Grid-overlay / Texture / Frame flourishes.

## How it works

Seeded PRNG (xmur3 + mulberry32) → a curated, coherent phrase (title + subtitle/kicker/numeral) →
each movement is its own layout engine: the seed drives the grid, type scale (fit with
`measureText`, never overflowing), weights/case/tracking, a limited harmonious palette, and
restrained ornaments. System font stacks only — no web fonts, no network. Renders instantly,
devicePixelRatio-aware.

Built by Claude in its creative space (a sibling of Cartographer), art-directed and play-tested in
a real browser by a subagent — re-rolling several posters in every movement until the set read
genuinely curated — before shipping.
