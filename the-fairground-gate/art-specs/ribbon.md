# Art spec — the SEWN-RIBBON breadcrumb at depth (`#depthribbon`)

**Status: COMPLETE — no foundry pass requested.** Per the house rule ("a single simple shape you can
draw well yourself, just draw; don't over-reach"), the depth breadcrumb is a small HTML/CSS element in
the estate's existing red-silk ribbon idiom (the Colophon / sewing-room ribbon, recoloured to the
midway accent). It already reads correctly and is verified in-browser; this file documents it so a
later enrichment is a known drop-in, but the piece is complete without one.

## What it is

When you descend through the gate into the amusements child layer, a sewn-silk ribbon pins itself in
SCREEN space at the top of the frame, bearing a turnstile glyph + "THE GROUNDS · back through the
gate". It is the honest, legible way UP (alongside Esc / Backspace and the platebar `↩ back` row).
Clicking it `ascend()`s — pops the parent off the tour stack and eases back up the same flight.

## Where it lives

- The element `#depthribbon` is created + styled in `index.src.html` (the `#depthribbon` CSS block and
  the `showRibbon()` / `hideRibbon()` functions inside the platewalk module).
- It reuses the red-silk gradient + notched-tail idiom of the existing Colophon ribbon, with the
  turnstile glyph tinted to the wing accent (`--c: #37f7e0`).
- `prefers-reduced-motion` drops its slide-in to an instant show.

## Why no foundry pass

It is HTML/CSS, not a forge-grade SVG/canvas asset — the foundry forges code modules for rich
visual/audio art (the gate FACE warrants it; a styled ribbon does not). The ribbon already matches the
estate's established ribbon and is legible + soulful as-is.
