# Forged asset — the studded turned-brass cylinder + glass case

**Medium:** visual-exhibit · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/index.src.html`) between the `<<BARREL-ART:cylinder>>` … `<<END BARREL-ART:cylinder>>` sentinels.

## Art direction
An edge-on **barrel-organ cylinder behind glass** — the heart of a 19th-century brass music box. We see the drum side-on: a horizontal brass cylinder capped at each end by a turned ellipse. The body should read as **real machined brass** caught in raking light: a vertical luminance gradient (dark lower belly → a bright specular band a little above centre → a warm shadowed top edge), fine turning-marks (faint horizontal lathe rings running along the length), and warm reflected glints. The left cap is the **turned end** the crank mounts on — a concentric set of machined rings, slightly proud. The whole sits inside a **glass display case**: a faint cool blue-grey pane with a soft top-left → bottom-right sheen and a thin bright rim. Match the estate's warm-brass-on-deep-night idiom (brass `#c9a24a`/`#ffd98a`/`#9c7327`, glass `rgba(150,180,230,…)`). It must feel **touchable and lit**, not a flat gold bar — the current placeholder is a plain gradient; lift it to caught light + machined detail.

This is the SURFACE the voice-colored pins (the studs) sit on, so keep the belly readable behind the studs (don't blow it out to pure white). The pins are drawn separately (see `stud.md`); the cylinder must not draw pins.

## The exact API the candidate code must expose
Install a single global:

```js
window.__barrelArt.drawCylinder = function (ctx, x0, x1, y0, y1, drumW, drumH) { … }
```

- `ctx` — the 2D canvas context (already DPR-scaled; draw in CSS px).
- `(x0,y0)`–`(x1,y1)` — the cylinder body's bounding box: `x0` left cap centre-x, `x1` right cap centre-x, `y0` top edge, `y1` bottom edge. `drumW = x1-x0`, `drumH = y1-y0`.
- Cap geometry to match the page: caps are ellipses of `rx = drumW*0.06`, `ry = drumH*0.5`, centred at `cy = (y0+y1)/2`, the LEFT cap (`x0`) being the turned crank end.
- Draw ONLY the glass case + the brass body + caps. Do NOT draw pins, the comb, the crank, or the read-bar (those are separate assets/chrome). Leave global alpha at 1 and restore any `ctx.save()`.
- Pure synchronous canvas drawing; no external assets, no network, no `await`. Deterministic (no `Math.random()` that flickers frame-to-frame — a fixed seed or pure procedural is fine).

## How it wires in / preview
The Pin-Barrel page calls `drawCylinder(...)` every frame; the placeholder consults `window.__barrelArt.drawCylinder` first. The wiring builder will paste the winning body between the `<<BARREL-ART:cylinder>>` sentinels in BOTH room pages.

Preview: `bash the-barrel-house/art-specs/preview-harness.sh <candidate.js> <outdir> <port>` → `<outdir>/preview.png` (renders the candidate in the live Pin-Barrel exhibit with the drum cranked a little + loupe on).

## Judge focus
Reads as a **real machined brass cylinder behind glass, caught in raking light** — turned, dimensional, touchable — not a flat gold bar; the belly stays readable behind the studs; it fits the warm-brass-on-night estate idiom.
