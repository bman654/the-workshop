# Forged face scene — THE ECLIPSE (The Hexaflexagon) — the HERO / impossible face

The payoff. The buried third face the toy has no business hiding — surfaced only by
the reveal-flex (turn a notch, then pinch). It must be NEITHER day nor night but a
third thing entirely: a total solar eclipse — the black moon crossing the sun, a
blazing corona ring on deep sky. It should feel rare, a little uncanny, and quietly
magnificent — it completes a trilogy the visitor did not know existed, and it rhymes
with the mechanic (the hidden alignment you only reach by turning the paper).

## Art direction
- **Hand:** the same estate hand, pushed to its most luminous — a hand-inked
  astronomical plate. Awe over sweetness. Kin to the estate's sky register
  (the observatory, the orrery) while staying warm-parchment adjacent in palette.
- **Palette:** deep eclipse sky `#05040c` → `#241a33` (a bruised violet toward the
  centre), the corona in the estate golds `#fff4c4` / `#f4d27a` / `#c9a24a`, the
  black moon near-pure `#05040a`. A few dimmed stars. The corona-gold is the colour
  that appears on NEITHER day nor night — it is what the on-ramp centre-sliver
  teases at rest, so it must be unmistakably ITS colour.
- **The motif — DEAD CENTRE (load-bearing):** the eclipse sits at the exact centre
  of the hexagon. A black lunar disc, ringed by a brilliant corona (soft inner
  glow + ragged streamers reaching out), the diamond-ring flash optional. Because
  the toy's empty-centre reveal beat blooms the new face FROM the centre outward,
  the corona blazing dead-centre is what "arrives from genuine nowhere" — make the
  centre the strongest, most surprising part of the image.
- **Around it:** deep star-flecked sky filling the hexagon to its corners; perhaps
  the faintest ghost of the garden wall along the very bottom edge (a whisper that
  it is the same place, the same sky — optional, keep it subordinate).
- **Grain:** the same laid-fibre grain idiom, very subtle over the dark sky, so the
  eclipse still reads as printed on the same paper strip.

## Geometry & registration
Identical contract to `face-day.md` §"Geometry & registration": S=900, centre `C`,
hexagon corner radius `R=S*0.47`, corner 0 at TOP, +60° steps; the page slices
`[C, corner_i, corner_{i+1}]`. The corona MUST be centred on `C` and be broadly
radially symmetric so it reads whole however the paper is turned. Keep marks inside
the hexagon.

**Liveness note:** the payoff-liveness twin counts painted pixels of this face and
asserts it is genuinely non-empty (`eclipseInk` well above a floor) — so paint the
corona and sky richly (the flat parchment showed only two faces; here the third is
truly drawn). A near-empty eclipse would FAIL the ship gate.

## API the candidate MUST expose
```js
window.installHexaArt = function (A) {
  A.setScene('eclipse', drawEclipse);
  return 'eclipse';
};
(window.HexaArt = window.HexaArt || {}).eclipse = drawEclipse;

function drawEclipse(ctx){ /* paints the whole S×S ECLIPSE scene, corona dead-centre */ }
```
Same rules: `ctx` is an S×S 2D context, paint the whole scene, clip to the hexagon,
pure deterministic canvas 2D (a fixed seed for stars/streamers is fine).

## Wiring
Synth installs the winner at `hexaflexagon/art/eclipse.js`; the wiring builder adds
`<!-- forge:include ./art/eclipse.js -->` before `faces.js`, rebuilds, and re-runs
`window.__HEXA_LIVE()` (must stay `ok:true`, `thirdNonEmpty:true`) + a screenshot of
the revealed face.

## Harness
`bash hexaflexagon/art-specs/preview-harness.sh <candidate.js> <outdir> <port>`
shows THE ECLIPSE face flat and screenshots `<outdir>/preview.png`. Judge on the
blaze of the centred corona and the sense of a rare, third thing.
