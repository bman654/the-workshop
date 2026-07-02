# sky-cartouche — the aged-vellum cartouche frame (visual)

## Art direction
The engraved CARTOUCHE that frames a named constellation's plate — behind BOTH the main
catasterize reveal AND each kept Constellarium plate. An antique celestial-atlas
cartouche: an aged-vellum-over-indigo panel with a gilt engraved border and a restrained
corner flourish, the kind of frame an 18th-century star chart sets its plate-title in.
The placeholder is a plain gradient panel + a double gold rule + corner ticks — the
forged version should feel like real engraved gilt-work + a whisper of vellum texture
(foxing/tone, faint), warm and old, never a slick modern card border. It sits BEHIND the
inked asterism + the name/designation/two-line myth, so it must stay quiet and readable —
a frame, not a busy pattern. `alpha` (0..1) grows the frame IN as the plate composes on
catasterize (1 for a settled kept plate).

Palette: deep indigo interior deepening downward, gilt/gold border (#f0c766-ish), a faint
warm vellum sheen up top. Match `verse` / `the-cartographers-dream`, NOT gate brass.

## The EXACT API (the candidate must expose this)
```js
window.Gate = window.Gate || {}; window.Gate.art = window.Gate.art || {};
window.Gate.art.cartouche = function (ctx, x, y, w, h, alpha /* 0..1 */) {
  // Draw a framed plate panel filling the rect (x,y,w,h) at overall opacity alpha.
  // Coordinate space = the caller's already-transformed CSS px. Save/restore your own
  // ctx state. Draw only; return nothing. Must look right at BOTH the big main-reveal
  // size (~620x520) AND the small kept-plate size (~246x270). Keep the interior calm —
  // text + the asterism are drawn ON TOP by the caller.
};
```

## How it wires in / preview
The page calls `Gate.art.cartouche(ctx, px, py, plateW, plateH, smoothstep(inkT*1.1))`
for the main reveal and `Gate.art.cartouche(g, 5, 5, CW-10, CH-10, 1)` for each kept
plate. Placeholder lives in `art-cartouche.js` — replace it, keep the signature + the
`Gate.art.cartouche` key.

## Judge bar
The most beautiful, authentically-antique celestial-atlas cartouche — engraved gilt
border + restrained corner flourish + a faint aged-vellum warmth — that stays QUIET
enough to read a name + two-line myth on top, works at both the large and small sizes,
and grows in cleanly with alpha.

## Preview harness
`art-specs/preview.sh` (auto-detects `cartouche`). Add a leading `// @asset cartouche`
line to force it.
