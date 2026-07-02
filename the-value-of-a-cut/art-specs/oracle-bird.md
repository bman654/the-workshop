# Art asset — the Oracle Bird (visual-exhibit)

## What it is

A small **living oracle bird** that perches in the ledger's "the number foretells" panel and **hops to the
winning side** of a perch as the position's value changes — the warm character that makes this a game with a
soul, not a dry verdict lamp. It replaces a flat placeholder sprite already wired into the page.

When the value is **positive** (Blue wins) the bird hops to the **left** (blue) end of the perch; **negative**
(Red wins) → the **right** (red) end; **zero** (mover loses) → the **center**; **all-green mis-call** ("the
sign lies here") → the center with a small warning flutter/ruffle. On a game resolution the page calls
`cheer` for a bigger celebratory flutter toward the winner.

## Art direction — match THE EXHIBIT, not the gate brass idiom

- The exhibit is the **Numbers Room**: warm brass on near-black, a felt/wood ledger, gold rule lines. The
  bird should read as a **small brass-and-amber songbird** — think a warm gilded wren or robin, hand-drawn,
  with a little life to it. Palette: body in brass `#c9a24a` / bright brass `#f0d488`, a darker `#8a6a2a`
  for legs/feet, a warm beak `#d98a3a`, a dark eye `#1a1208`. A hint of the winning colour may tint the
  breast when perched (blue `#6ea8e8` / red `#e0664f`) but keep the bird clearly a *brass bird*, not a
  colour blob.
- **Motion is the point** (this is a delight asset): a gentle idle bob while perched; a real **hop** (a small
  parabolic arc + wing-open) when it moves to a new side; a **flutter/ruffle** on `cheer`; a tiny warning
  wing-flick on the green mis-call. Smooth, ~60fps, `requestAnimationFrame`-driven — no CSS-keyframe reliance
  (the sprite lives in an SVG the page controls).
- Tasteful, not cartoonish. It should feel like it belongs on a brass instrument, calm and knowing — an
  *oracle* bird. A subtle drop of warmth (a faint glow under it on the winning side) is welcome.

## Coordinate space

The bird lives in `<svg id="birdstage" viewBox="0 0 300 74">` inside the oracle panel. The perch is a
horizontal line at roughly `y = 60` spanning `x ∈ [20, 280]`. Three perch marks: **blue at x≈58**,
**center at x≈150**, **red at x≈242**. The bird's own local origin should sit at its feet so a
`translate(x, y)` places it standing on the perch.

## The EXACT API the forged code must expose

Install a global **`window.Bird`** (an object) exposing:

```js
window.Bird = {
  // Build the sprite into the given <svg> (the #birdstage). Called once at boot. Clears the svg first,
  // draws the perch + marks + the bird group, and starts its own rAF idle loop.
  mount(svgEl) { … },

  // Move the bird to the winning side. side ∈ 'blue' | 'red' | 'center' | 'warn'.
  //   'blue'   → hop to the left (blue) perch mark
  //   'red'    → hop to the right (red) perch mark
  //   'center' → hop to the center
  //   'warn'   → sit center + a small warning ruffle (the all-green mis-call)
  // ctx is the page's (possibly null) AudioContext — you MAY ignore it; do NOT create audio here (sound is
  // a separate asset). It is passed only so a future version could sync a wing-beat to a sound; safe to omit.
  setSide(side, ctx) { … },

  // A bigger celebratory flutter toward the winner. side ∈ 'blue' | 'red'. Called on game resolution.
  cheer(side, ctx) { … },
};
```

- **Pure, self-contained, zero-dependency.** No external assets, no network, no fonts. Draw with SVG
  elements created via `document.createElementNS`. You own the whole `#birdstage` contents after `mount`.
- Read CSS variables via `getComputedStyle(document.documentElement).getPropertyValue('--brass')` etc. if you
  want to inherit the exhibit palette (the vars listed above all exist on `:root`).
- `setSide`/`cheer` must be safe to call repeatedly and rapidly (the page calls `setSide` on every value
  change). Animate toward the target; never throw.
- Keep it light: one rAF loop, a handful of SVG nodes.

## How it wires in (already scaffolded)

The page defines a `BirdPlaceholder` and does:
`const Bird = (typeof window !== 'undefined' && window.Bird) ? window.Bird : BirdPlaceholder;`
then calls `Bird.mount($('birdstage'))` at boot, `Bird.setSide(side, audio.ctx)` on every ledger update, and
`Bird.cheer(side, audio.ctx)` on a win/loss. **To wire the forged art:** add
`<script src="oracle-bird.js"></script>` (or `<!-- forge:include ./oracle-bird.js -->` inside a plain
`<script>` before the module) so `window.Bird` is set *before* the module boots, and REMOVE the
`BirdPlaceholder` placeholder block. The module already prefers `window.Bird` when present.

## Preview harness

`bash the-value-of-a-cut/art-specs/preview-bird.sh <candidate.js> <outdir> <port>` loads the candidate as
`window.Bird`, mounts it in the real `#birdstage`, cycles it through blue → red → center → warn → cheer, and
screenshots `<outdir>/preview.png`.

## Judge focus (one line)

A warm, alive brass songbird that clearly HOPS to the named side and flutters with character — belongs on a
brass instrument, delight-first, not a cartoon.
