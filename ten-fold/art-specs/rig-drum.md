# THE TEN-FOLD GLASS — the brass rig: the knurled coarse-focus drum

**The subject:** the one control in the room. A knurled brass coarse-focus drum,
mounted vertically in a dark housing at the right edge of the frame (rotated to
horizontal on a phone), with a leaf-spring pawl riding its surface.

The current placeholder (`ten-fold/rig.js`) is honest about its structure but it
reads as **glowing gradient bands, not machined metal**. That is the whole brief:
make it *machined*.

## What the drum must SAY

* The knurl's **phase IS the decade** — 16 ridges per ten-fold. Turning the wheel
  rolls real ridges past, so the drum's surface is literally the ladder.
* A **detent groove** is cut at every whole decade of the ladder (`E_MIN`..`E_MAX`).
  These are deeper and darker than the knurl, with a bright machined lip.
* The **pawl** — a brass leaf spring at the box's mid-line — rides up a ridge and
  drops into a groove. It is the click made visible: seated, its tip is bright
  and blooms slightly; on a crest it is lifted and dull.
* The drum is a **cylinder**, not a strip: the ridges must foreshorten and their
  contrast must fall off toward both ends, and the ends go dark.

## Art direction

Nineteenth-century instrument brass, used: warm ochre highs, deep umber shadows,
a slight green-black in the grooves, fine circumferential tool marks, and a
little wear polished bright where a thumb has ridden it for years. The reference
is a real microscope's coarse focus or a lathe's cross-slide handle — turned
metal with a specular streak that moves, not an airbrushed gradient. Nothing
should glow of its own accord; every bright is a *reflection*.

Texture matters at both ends: at rest the machining should be legible; in motion
the ridges should read as ridges rather than strobing into moiré.

## The contract

Your take is a **JS module file** — classic script, no imports/exports/deps —
containing:

```js
RigArt.drum = function (g, w, h, d, opts) { /* ... */ };
```

* `g` — a 2D context whose origin is the **top-left of the drum's box**.
  `g.save()` first, `g.restore()` last; leave `globalAlpha` at 1.
* `w`, `h` — the box in CSS px. Desktop: roughly 90 × 660 (tall). Phone
  (`opts.portrait === true`): roughly 390 × 84 (wide) — lay the drum out
  horizontally in that case; **never draw rotated text**.
* `d` — the live continuous decade (a float, e.g. `3.0` seated, `3.5` on a
  crest, `3.12` just off a detent). Everything on the drum derives from it.
* `opts` — `{ E_MIN, E_MAX, portrait, t }`; `t` is seconds.

You may also export `RigArt.brassGrad(g, x0, y0, x1, y1)` (the page uses it to
paint the engraved rule beside the drum, so the two match); if you do not, the
placeholder's version stays and your drum must still sit beside it happily.

## How it is judged

`bash ten-fold/art-specs/render-take.sh <your-take.js> <outdir> <port>` renders
the drum three times side by side — **seated on a detent** (`d = 3.0`), **on a
crest** (`d = 3.5`), and **just off a detent** (`d = 3.12`). The three must
differ visibly and correctly: you should be able to tell from the picture alone
where the pawl is and whether it has dropped in.

## How it wires in

The winner replaces `RigArt.drum` in `ten-fold/rig.js`. The page calls it from
`drawWheel()` and nothing else changes.
