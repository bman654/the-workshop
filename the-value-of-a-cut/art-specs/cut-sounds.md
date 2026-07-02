# Art asset — the Cut Sound suite (sound × 5)

Five short in-house WebAudio one-shots that give the cut its weight and the oracle its warmth. All are
**gated on `WS.muted()`** and unlocked on the first user gesture (the page handles both). The placeholders in
the page are real-but-plain; these are the warm final versions.

## Art direction — a wooden garden, warm brass ledger

The exhibit is a tangle of coloured edges growing on **soil**, read by a **brass ledger**. The palette of
sound should feel **organic and warm**, never harsh or digital: a real garden being pruned, a brass
instrument gently pinging. Short (mostly < 0.5 s), low-headroom, no clipping, tasteful. Think: hand shears in
a quiet garden, twigs settling on soil, a small brass bell.

## The five builders (installed on `Gate.sfx.<key>`)

Each is a `Gate.sfx[key] = function ({ ctx, dest, dur, when = 0, seed = 1, n = 0 }) { … }` that schedules its
sound on `ctx` starting at `when`, routed to `dest` (a GainNode). Same dual-use offline/live contract as the
gate's `audio-*.js` builders (see `the-gate/audio-creak.js` / `audio-birdsong.js` for the shape). Zero
dependencies; must not throw; must respect `when`.

1. **`scissor`** — a soft **snip**: the crisp shear of cutting one edge. A short filtered-noise transient
   (~40–70 ms) with a tiny metallic ring — hand shears closing, not a knife. `dur ≈ 0.12`.
2. **`tumble`** — a low **wooden patter** as the now-ungrounded pieces fall and hit the soil. Multiple soft
   woody knocks scattered over ~0.3–0.5 s; the page passes **`n`** = the number of fallen pieces, so scale
   the number/density of knocks with `n` (clamp ~1..8). Warm, dampened, earthy — twigs on dirt. `dur ≈ 0.5`.
3. **`win`** — a **warm chime** on your victory: a short rising brass/bell arpeggio (3-ish notes), gentle and
   glad, resolving upward. `dur ≈ 0.6`.
4. **`loss`** — a **dry thud** on defeat: a single low, damped wooden knock with a short fall — honest, not
   punishing. `dur ≈ 0.5`.
5. **`ping`** — a **faint brass ping** when the oracle re-lights (the value changed): a very soft, high,
   short bell tick — a fraction of the others' loudness, easy to miss, a grace note. `dur ≈ 0.18`.

## How they wire in (already scaffolded)

The page calls `play('scissor', fallback)`, `play('tumble', …)` (with `play._n` set to the fallen count),
`play('win'/'loss'/'ping', …)`. `play` prefers `Gate.sfx[key]` when it is a function, else runs the in-file
fallback. `Gate.sfx.tumble` receives `{ …, n }` = fallen-piece count. **To wire the forged art:** include the
five builder files (each sets `Gate.sfx.<key>`) via a plain `<script>` / `forge:include` **before** the
module boots so `Gate.sfx.*` exist when the module reads them; the fallbacks then never fire. Leave the
`play()` plumbing as-is.

## Judge focus (one line)

Warm, organic, non-clipping garden/brass one-shots — a soft shear, wooden pieces settling on soil, a glad
brass chime / dry thud, a grace-note ping — that make the cut feel physical without ever grating.
