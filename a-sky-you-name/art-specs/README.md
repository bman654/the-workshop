# A Sky You Name — art-foundry specs

The piece ships with **placeholder** art + SFX that define the exact API the foundry
forges against. Each asset below is a small JS module the foundry replaces with a
richer, voiced version (K takes → judges → synth), then a fresh builder wires the
winners in. **Never forage** — all assets are forged in-house.

The whole aesthetic is an **antique celestial atlas at night**: deep indigo void,
gilt/gold ink, aged vellum, engraved copperplate serifs. NOT the gate's brass idiom —
this is a star-chart / firmament-plate register (kin to `verse` and
`the-cartographers-dream` next door).

## The assets

| key            | medium         | live module        | what it is |
|----------------|----------------|--------------------|------------|
| `sky-snap`     | sound          | `sfx-snap.js`      | the warm brass snap-chime when a lace-line catches a star (climbs a pentatonic step each snap) |
| `sky-nib`      | sound          | `sfx-nib.js`       | the dry papery pen-scratch as a line inks (also the ~0.5s catasterize sweep) |
| `sky-settle`   | sound          | `sfx-settle.js`    | the warm settle-swell + brass ting the moment the figure is written |
| `sky-fwump`    | sound          | `sfx-fwump.js`     | a fresh sheet of vellum settling on re-seed / keep |
| `sky-star`     | visual-exhibit | `art-star.js`      | the antique-atlas star-glint sprite, in magnitude tiers + tints |
| `sky-cartouche`| visual-exhibit | `art-cartouche.js` | the aged-vellum / indigo cartouche frame behind the name + myth |

## Sound contract (all four)

Each installs `window.Gate.sfx.<key> = function ({ ctx, dest, dur, when=0, seed=1, param }) { … }`
and returns `{ stop(at) }`. It renders on the passed `ctx` (a live AudioContext OR an
OfflineAudioContext — do not create your own), connects to `dest`, starts at
`ctx.currentTime + when`. Must be QUIET (peak well under 1.0, no clipping) and warm,
not glassy/harsh. Deterministic given `seed`. See each spec + the estate's
`the-cartographers-dream/sfx-*.js` for the builder shape.

The page calls them via `Gate.sfxPlay(key, dur, param)` (which gates on `ws:pref:muted`
and the live ctx). Silent until the first user gesture.

## Visual contract (both)

Each installs a draw fn on `window.Gate.art` that draws into a 2D canvas context in the
caller's already-transformed CSS-px space, saving/restoring its own state, returning
nothing. See `art-star.md` / `art-cartouche.md` for the exact signatures.

## Preview harness (visual assets)

`bash art-specs/preview.sh <candidate> <outdir> <port>` swaps the candidate over its
placeholder in a scratch copy, forge-builds the piece, drives a deterministic lacing →
catasterize via the page's `window.__sky.drive([…])` bridge, and screenshots
`<outdir>/preview.png` — the settled reveal shows BOTH the cartouche (framing the plate)
and the star sprites (the gilded node-stars + the field behind), so one frame judges the
candidate in true context. The harness auto-detects `star` vs `cartouche` from the
candidate (or a leading `// @asset star|cartouche` line).
