# THE TEN-FOLD GLASS — plate `whole` (26 decade)

**The subject:** the whole of it — everything light has reached, as one plate.

**Its anchor** is `[-0.07, 0.09]` — one knot of the cosmic web sits exactly there and grows out of it as
the wheel turns inward. This plate is at 10^26 m on the ladder; the plate
above it and the plate below it are BOTH on screen with it for most of the
travel, so it must read as a place, not a diagram.

## Art direction

The hardest and the quietest. A foam of filaments so fine it reads as texture rather than structure, thinning toward a rim that is the edge of what can be seen at all — a faint gold ring, and beyond it nothing, not even black. It should feel like an END, and it should be beautiful enough that a visitor sits there for a while. No labels, no glow effects, no lens flare.

## The contract (identical for every plate in this batch)

Your take is a **JS module file** — a classic script, no imports, no exports, no
deps — containing exactly one assignment:

```js
PlateArt.whole = function (g, u, a, t, anchor) { /* ... */ };
```

* `g` — a 2D context whose origin is ALREADY at the plate's centre, untransformed
  otherwise. You **must** `g.save()` first and `g.restore()` last, and leave
  `globalAlpha` at 1 and `globalCompositeOperation` at `'source-over'`.
* `u` — the plate's side in CSS px. Draw in UNIT space: `g.scale(u, u)` and then
  work in x,y ∈ [−0.5, +0.5]. `u` ranges over **five orders of magnitude** in
  real use, from ~8 px (a speck you are diving toward) to ~10⁶ px (you are deep
  inside it and it is dissolving overhead).
* `a` — presence, 0..1. **Every** colour you emit must be multiplied by `a`.
  Never set `globalAlpha` and leave it set.
* `t` — seconds, monotonic. Any motion must be slow, small and non-looping-jarring;
  a plate that jitters is worse than a still one. Amplitudes ≲ 0.01 unit.
* `anchor` — `[x, y]` in unit space: **where this plate's child plate will land.**

## The two hard rules

**1 — FIELD TEXTURE, in octaves.** At a multi-decade gap this plate is magnified
100× to 10 000×. Smooth washes and radial gradients become fat smears; the whole
piece dies in those gaps. So authored texture must be **scale-free**: build it in
octaves of dot/stipple/hatch size (each ~4× the last, spanning at least 0.0004 →
0.1 unit), and **draw only the octaves whose current pixel size lands in a
legible band** — the shipped helper does exactly this:

```js
grain(g, u, a, seed, 'rgba(190,214,162,1)', 0.30, false);   // available to you
```

`grain(g, u, a, seed, tint, density, soft)` is already defined in `plates.js`
alongside your function; call it, or write your own better one INSIDE your module
(self-contained is fine and welcome). What is NOT acceptable is a plate whose
only content is smooth fills: the bench's third panel will show it as a wash and
it will lose.

**2 — COMPOSED AROUND THE ANCHOR.** The child emerges from `anchor` and grows
until it fills the frame. Draw a **plausible smudge** there that the child
resolves into — not a marker, a piece of the picture that happens to be exactly
the right thing at exactly that spot. An anchor landing on blank paper makes the
whole nesting read as a sticker. `smudge(g, anchor, r, tint, a, seed)` is the
shipped helper; better is welcome.

## The estate's hand

Ink on near-black. Warm gold `#f0c766`, parchment `#e9dcc0`, cool fog `#8794a6`,
with subject colour used sparingly. Line-drawn and stippled, like a good
19th-century engraved plate — never flat vector illustration, never a photo
pastiche, never emoji. Nothing foraged: every mark is drawn by your code.

## How it is judged

`bash ten-fold/art-specs/render-take.sh <your-take.js> <outdir> <port>` renders
three panels: the plate at its own decade, the plate arriving as a 15 px speck,
and the plate **blown up 300×**. All three must read. The third is the one that
separates a take that solved the problem from one that only drew a picture.

## How it wires in

The winner replaces the placeholder `PlateArt.whole` in
`ten-fold/plates.js` (or is installed as `ten-fold/plates/whole.js` and
forge-included after it). Nothing else changes.
