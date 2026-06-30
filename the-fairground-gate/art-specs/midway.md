# Art spec — `GateArt.drawMidway` (THE CHILD MIDWAY GROUND)

The ground treatment of the amusements child LAYER. When you descend through the gate, the 15
amusement rooms re-lay (fan out) across an airy field, and the camera flies in. Without a ground
treatment that field reads as a blank patch of the same lawn — the descent feels like a zoom, not an
arrival. This asset paints a **faint cobbled fairground MIDWAY** under the re-laid tiles so the
descended sheet reads as a PLACE: a promenade you walk down, lined with distant pennants — a quarter,
not a clearing.

It is secondary to the gate face: subtle, behind the tiles, hidden until descent. A good hand-drawn
placeholder ships (`drawMidwayPlaceholder` in `index.src.html`); a forge pass enriches it.

## The API the forged code must expose

```js
window.GateArt = window.GateArt || {};
window.GateArt.drawMidway = function (g, bbox, accent) { … };
```

- `g`      — an SVG `<g class="child-midway">` attached in `#pois`, **behind** the room tiles, and
             hidden (`opacity:0`) until the descent shows it. **Append** your linework into it.
- `bbox`   — `{ x, y, w, h }` the child plate's **relay envelope** in viewBox units — the rectangle
             the re-laid amusement tiles fan across (≈ 315×560). Draw the midway to span it.
- `accent` — the wing accent `"#37f7e0"`.

Returns nothing; no state. Keep it FAINT (opacity ~0.1–0.25 on most strokes) — it sits UNDER the
tiles and must never compete with them or with their labels.

## Art direction — a cobbled fairground midway, faint, under the tiles

- a **central promenade / avenue** running the length of the envelope (a faint double-line or a soft
  dashed spine) — the path you walk between the rides;
- a sparse **cobbled / paved ground hatch** crossing the avenue (short faint ticks), so the floor
  reads as a built fairground ground, distinct from the parent's open lawn;
- **distant strung pennants** arcing across the top of the midway (tiny `accent` triangles on a faint
  swag line) — the fair, glimpsed down the avenue;
- optionally a couple of very faint footlight dots or a far gate silhouette at the avenue's end.

No text. No bold strokes. It is atmosphere, not furniture — the felt difference between "a clearing"
and "the fairground floor." Brass/ink hatch + a few teal pennants.

## Preview harness

`bash the-fairground-gate/art-specs/preview.sh <candidate.js> <outdir> <port>` — a candidate that
defines `drawMidway` is auto-driven into the DESCENDED state (tour East Grounds → click the gate →
fly into the child layer) and `<outdir>/preview.png` shows the midway under the re-laid tiles.

## Judge focus (one line)

Does the descended field read as a cobbled fairground MIDWAY (avenue + distant pennants + paved
ground) — a place you've arrived in — while staying faint enough to sit quietly under the tiles?
