# Art spec — `puppets` (visual-exhibit): the paper-cut SILHOUETTE SET

## What this asset is
The SIX hand-cut paper puppets of The Shadow Theater, seen ONLY as shadows on a
lamp-lit silk. This asset is the module `puppets.js` → `window.Puppets`: a set of
FLAT vector contours the render engine rasterizes, scales about the lamp, blurs by
the penumbra, and MIN-unions into the cast. The art is the SILHOUETTE — iconic,
instantly readable, with the hand-cut deckle character of torn mulberry paper. It
must stay ONE clean black union at every articulation value (no self-overlap that
reads as a seam; no stray floating bits).

The SIX figures compose a wordless **night-by-water**:
1. **crane** — body + neck + head/beak + two legs + a HINGED WING. Handle `wing`
   (0 folded → 1 raised in flight). Sweeping the wing over the moon is the hero
   merge-to-black. The most important, most beautiful figure.
2. **fox** — a sitting profile with a brush tail and a **PIERCED (even-odd) eye**
   (a lit glint). Handle `look` (0 head-down → 1 head-up).
3. **reed** — a cattail cluster; the blades leave **light-gaps** between them
   (even-odd blade-gaps welcome). Handle `sway` (phase 0..1, a water breeze).
4. **moon** — `polarity:'aperture'`: a dark cloud-bar with a **PIERCED disc** (the
   moon). Drawn as an ordinary darken-pass puppet, the hole stays lit and the silk
   blooms brightest there. No handle.
5. **willow** — drooping fronds hung from the TOP of the frame. Handle `sway`.
6. **vee** — three tiny far cranes whose wings **flap on `state.t`** (time). Placed
   far → small + crisp: the DEPTH showcase (crisp because near the silk, small
   because low magnification). No handle.

The PLACEHOLDER (`puppets.js`) already draws blocky-but-real versions of all six with
working articulation + even-odd holes, so the whole engine, the union-to-black, the
depth loom, and the liveness twin are GREEN now. This asset replaces the CONTOURS
with beautiful deckle-edged paper-cuts — **same API, same call sites**.

## The EXACT API the candidate code must expose
Replace the contour bodies in `puppets.js`, keeping the module shape identical:

```js
window.Puppets = {
  RES: 100,                       // unit box: contours live in [0,RES]², y-DOWN
  order: ['moon','vee','willow','reed','crane','fox'],   // back → front paint/z order
  get(id) -> puppetRecord,
  all() -> [puppetRecord…],
  __forged: true                  // set TRUE in the forged module (marker)
};

// each puppetRecord:
{
  id, label, polarity: 'shadow' | 'aperture',
  box: { w, h },                  // aspect in RES units
  anchor: [ax, ay],               // the RES-space point that maps to the screen (x,y)
  handles: [ { id, pivot:[x,y] } ],   // grabbable hinge(s); [] if none
  depth0, x0frac, y0frac,         // sensible default placement (fractions of stage)
  silhouette(state) -> [ { fill:'nonzero'|'evenodd', pts:[[x,y],…], hole? } ],
  glyph() -> same shape at rest   // the shelf thumbnail contour
}
```

- `state` carries the live articulation: `{ wing, look, sway, t }` (each 0..1, `t`
  is seconds). `silhouette` must return FINAL contours for that state — geometry
  never learns anatomy, it just gets contours per frame.
- The renderer builds ONE `Path2D` from all subpaths of a puppet and fills it once.
  **The fill rule is even-odd if ANY subpath is `fill:'evenodd'` or `hole:true`** —
  so a pierced hole (fox eye, moon disc, reed gaps) is a subpath that SUBTRACTS.
  Wind holes/gaps CCW/CW as needed; the engine uses even-odd, so nesting is what
  matters, not winding direction.
- Contours are flattened POLYGONS (arrays of points; the engine does not curve them).
  Approximate curves with enough points (~14–30) for a smooth deckle edge at
  `RES`-scale. Keep ~1.5 px edge character at unit scale.
- Articulation MUST be real geometry: `crane.silhouette({wing:0})` ≠ `({wing:1})`
  (a build smoke asserts this); `moon.silhouette()` MUST yield an even-odd/hole
  contour (also asserted).

## How it wires in / how the harness renders it
`index.src.html` forges `./puppets.js` inline. The candidate is swapped in by the
harness and rendered in the FULL engine:

```
bash shadow-theater/art-specs/preview-harness.sh <candidate.js> <outdir> <port>
```

It builds an isolated copy, swaps the candidate in as `puppets.js`, forges the page,
poses a showcase (crane looming toward the moon, fox/reed/willow crisp, far vee),
and screenshots `<outdir>/preview.png`. The judge scores THAT image.

## Judge focus (one line)
The most **beautiful, most instantly-readable** clean paper-cut silhouette SET — a
crane, fox, reeds, willow, pierced moon, and far vee that each read at a glance and
stay ONE clean black union at every handle value.

## Constraints
- Keep the module shape + every record field + `silhouette(state)` signature.
- Every puppet must stay a single clean union across its full handle range (sweep
  `wing`/`look`/`sway` 0→1 and `t` over a second — no gap, no floating fleck, no
  self-intersection that reads as a crease).
- The moon MUST pierce (even-odd disc). The fox eye SHOULD pierce. Reeds SHOULD show
  light between blades.
- No foraged art. Pure geometry (arrays of points), deterministic, no external refs.
- The vee stays small + crisp (the depth showcase) — do not make it large or soft.
