# Foundry spec — `slab-material` (visual-exhibit)

**Asset:** the gilt-slab material for The Sightline's twelve hanging slabs.
**Medium:** visual-exhibit (canvas 2D draw code, JS).
**Live module / call site:** `the-sightline/index.src.html`, the function `drawSlab(i, p, exposed)`
between the sentinels `// <<SIGHTLINE-ART:slab>>` … `// <<END SIGHTLINE-ART:slab>>`
(includes its helper `drawEngravedStar`). After forging, the winner code REPLACES that
sentinel block; re-run `node tools/forge/forge.mjs the-sightline/index.src.html`.

## Art direction (match THE EXHIBIT, a dim gilt vault — not the gate brass idiom)
A heavy, opaque **brass-leaf slab** hanging in a dark indigo vault. Each slab is a flat
quad seen in perspective. Wanted, over the current flat gradient:
- a **beveled, depth-shaded edge** (a chamfer that catches a warm rim-light on the near
  edge and falls to shadow on the far edge) so the slab reads as a solid plate with
  thickness, not a decal;
- a **brass-leaf face** — subtle vertical leaf streaks / hand-beaten tooling, a faint
  specular sheen that shifts with the slab's depth (nearer = brighter, warmer gold);
- a **depth-graded patina** — far slabs are cooler, greener-bronze and dimmer; near
  slabs are brighter, more yellow-gold (the depth `p.depth` drives this, ~3.4 near …
  ~8.5 far, current code maps `t=(7.2-depth)/3.2`);
- an **engraved five-point star glyph** centered on the face (its place in the figure):
  incised/relief-cut into the leaf, brighter and haloed when the slab is `exposed`,
  dim and shadowed when occluded. Keep it legible and centered.
- when `exposed` is true, the whole face should read a touch warmer/brighter with a gold
  rim — the visitor must SEE which slabs are currently peelable.

Keep it calm and gilded, not gaudy. Greybox reference: the current `drawSlab` gradient
+ `drawEngravedStar`. Honor the existing palette vars (gold `#e7b55b`, gold-hi `#ffd98a`,
gold-deep `#9c7327`, rim `#39406b`, dark vault `#070a16`).

## EXACT API the candidate code must expose
A single function (plus any private helpers it needs, declared inside or alongside):

```js
function drawSlab(i, p, exposed){ … }
```
- `i` — slab index 0..11 (use only for a deterministic per-slab tooling seed if wanted;
  do NOT change which star a slab carries — that is core logic).
- `p` — `{ u, v, depth, quad }`: `quad` is the slab's 4 projected corners
  `[[ux,uy],…]` (order: bottom-left, bottom-right, top-right, top-left) in **normalised
  image units**; map each to pixels with the in-scope helper `toScreen(ux,uy) → [px,py]`.
  `depth` is the camera-space depth (drives the patina grade).
- `exposed` — boolean: this slab is currently unoccluded (peelable) → render warmer/rimmed.
- It draws into the in-scope 2D context **`ctx`** (already set up; do NOT clear it).
- In-scope globals it MAY read: `ctx`, `toScreen`, `SCALE` (px scale, for glyph size),
  `bright` (0→1 victory vault-brighten — lift the face on win), and it may keep its own
  `drawEngravedStar(x,y,r,exposed)` helper inside the sentinel block.
- It MUST NOT mutate camera/visibility state or read/write `ignited`/`expected`.

## How it wires in + how the preview harness invokes it
- Wiring: paste the winner between the slab sentinels in `index.src.html`, re-forge.
- The candidate file the foundry produces is a JS snippet defining `drawSlab` (and helpers).
- Preview harness: `bash the-sightline/art-specs/preview-harness.sh <candidate> <outdir> <port>`
  appends the candidate as a trailing `<script>` that REASSIGNS the global `window.drawSlab`
  (the page's draw loop calls the global, so the override takes effect), drives the camera to
  a representative mid-reveal pose, and screenshots `<outdir>/preview.png`. The judge scores
  that frame: do the slabs read as solid beveled brass plates with depth-graded patina, the
  engraved star legible, exposed slabs clearly warmer — beautiful and calm, fitting the vault.

## Judge focus (one line)
Solid beveled brass-leaf slabs with depth-graded patina + a legible engraved star, exposed
ones clearly warmer — gilded and calm, fitting the dim vault (not flat, not gaudy).
