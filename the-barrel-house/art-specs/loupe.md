# Forged asset — the refractive loupe glass over the read-bar

**Medium:** visual-exhibit · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/`) between `<<BARREL-ART:loupe>>` … `<<END BARREL-ART:loupe>>`.

## Art direction
The **loupe** is the jeweler's magnifier the visitor slides over the read-bar to study one pin and see it laced to its canon partner. It must read as a **real lens**: a circular glass disc with a refractive/chromatic edge (a thin spectral fringe where the rim bends light), a faint convex sheen, and a slightly darkened field inside so the magnified studs pop. Inside the glass the page hands you the magnified studs to render (the few pins currently crossing, blown up). The current placeholder is a clipped dark circle with bigger dots + a flat rim; lift it to **a convex glass with a chromatic/refractive edge and a soft caught highlight**, so it feels like glass over the tines, not a hole. The dashed MATE-LINE + the lit twin are drawn by the page BEFORE the glass (kernel-sourced) — you only draw the glass + the magnified studs inside it.

## The exact API the candidate code must expose
```js
window.__barrelArt.drawLoupe = function (ctx, readX, lyc, lr, mag) { … }
```

- `ctx` — 2D context (CSS px).
- `(readX, lyc)` — the lens centre (on the read-bar, vertically centred on the drum).
- `lr` — the drum half-height; the lens disc radius the page uses is `lr*0.62` (match it so the lens sits over the read-bar band).
- `mag` — an array of the magnified studs to draw INSIDE the glass: `[{x, y, col}, …]` where `(x,y)` is the already-magnified screen position (the page spreads them at ~46 px per lattice step around `readX`) and `col` is the voice color. Render each as a bright magnified stud (with a small specular) so the pin under the loupe reads clearly.
- Clip the magnified studs to the lens disc; draw the glass field/sheen + the refractive rim. Restore any `ctx.save()`/clip; leave alpha at 1.
- Pure + deterministic per `(readX,lyc,lr,mag)`.

## How it wires in / preview
The page computes `mag` from the live pins and calls `drawLoupe(ctx, readX, lyc, lr, mag)` (then `return`s — the page's own glass placeholder is the fallback). Placeholder consults `window.__barrelArt.drawLoupe`. Wiring builder pastes the winner between the `<<BARREL-ART:loupe>>` sentinels in both rooms. Preview as in `cylinder.md` (the harness turns the loupe ON, so the lens + a mate are in the shot).

## Judge focus
The loupe reads as **real convex glass with a refractive/chromatic edge and a caught sheen** — the magnified studs pop inside it — not a flat dark hole; it sits cleanly over the read-bar band (radius `lr*0.62`).
