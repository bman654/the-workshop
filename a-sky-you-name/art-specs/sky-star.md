# sky-star — the antique-atlas star glint (visual)

## Art direction
One STAR as it would be engraved on an antique celestial atlas at night. Not a flat
proc disc + a 4-point cross (the placeholder) — a soft, luminous, hand-engraved glint:
a bright warm core, a gentle diffraction bloom around it, and a delicate star-glint
(4- or 6-point, thin, tapered — like an old chart's engraved sparkle) that reads on the
brighter tiers and fades on the faint ones. Warm and celestial, never a harsh videogame
sparkle. Three tint TIERS:
- `cool`  — a faint far dust/field star, blue-white (the background firmament);
- `warm`  — a nearer amber star (the lace-able anchors at rest);
- `gild`  — the GOLD laced / node star (a star caught into the visitor's figure, and the
  gilded nodes on the finished asterism) — this is the hero tier, richest bloom.

`r` is the core radius in CSS px; bigger r ⇒ a brighter magnitude ⇒ more bloom + a
readable glint. `alpha` blooms the gilded nodes in on catasterize (0→1) and pulses the
"close here" first-star, so it must scale the WHOLE sprite's opacity smoothly.

Deep-indigo void background; match `verse` / `the-cartographers-dream`, NOT gate brass.

## The EXACT API (the candidate must expose this)
```js
window.Gate = window.Gate || {}; window.Gate.art = window.Gate.art || {};
window.Gate.art.star = function (ctx, x, y, r, kind /* 'cool'|'warm'|'gild' */, alpha /* 0..1 */) {
  // Draw ONE star centred at (x,y), core radius r, in the kind's tint, at overall opacity
  // alpha. Coordinate space = the caller's already-transformed CSS px (do not scale by DPR).
  // Save/restore your own ctx state. Draw only; return nothing. Must render correctly at
  // r from ~0.6 (faint dust) up to ~5 (a laced node), and at alpha 0..1.
};
```

## How it wires in / preview
The page calls `Gate.art.star(ctx, x, y, r, kind, alpha)` for every field star each
frame, for the gilded asterism nodes, and for the pulsing first-star ring. Placeholder
lives in `art-star.js` — replace it, keep the signature + the `Gate.art.star` key.
Preview: `bash art-specs/preview.sh <candidate> <out> <port>` renders the catasterize
reveal (gilded nodes + the field of cool/warm stars behind the plate).

## Judge bar
The most beautiful antique-atlas star glint across all three tiers (cool/warm/gild) and
the full magnitude range — a warm luminous core + a tasteful engraved diffraction glint
that reads on bright stars and fades on faint ones, celestial not gamey, alpha scaling
the whole sprite cleanly.

## Preview harness
`art-specs/preview.sh` (auto-detects `star`). Add a leading `// @asset star` line to
force it.
