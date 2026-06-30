# Forged asset — the comb teeth that flex + flash + bloom on pluck

**Medium:** visual-exhibit · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/`) between `<<BARREL-ART:comb>>` … `<<END BARREL-ART:comb>>`.

## Art direction
The **comb** is the row of tuned steel-brass tines standing at the read-bar — the part a music box's pins actually pluck. Each tooth is a short horizontal cantilever sticking LEFT from the vertical read-bar, one per lattice row (`TEETH = 17`). At rest they are calm warm-brass tines. **The instant a pin crosses, that tooth must come alive:** it physically FLEXES (the free tip swings/whips out a little and springs back), FLASHES (a bright bloom in the voice's color travels the tine), and the tip BLOOMS (a soft glow halo) — then decays back to rest over ~420 ms. The current placeholder teeth are thin straight lines that just glow; lift them to **springy, physical tines with a real flex curve and a light bloom** so a pluck reads as a struck, ringing tooth. Lower teeth (longer tines) should read very slightly lower-pitched / heavier if you want, but keep all 17 legible.

The flash color is the plucking voice's color (gold `--v0`, blue `--v1`, green `--v2`, pink `--retro` for the crab). The tine bloom should feel metallic-warm, not neon.

## The exact API the candidate code must expose
```js
window.__barrelArt.drawComb = function (ctx, readX, y0, y1, toothY, pluckFlash, now, TEETH) { … }
```

- `ctx` — 2D context (CSS px).
- `readX` — the x of the vertical read-bar; tines extend LEFT from here (toward smaller x).
- `y0,y1` — the drum's top/bottom (the comb spans this height).
- `toothY(t)` — fn → the y (px) of tooth `t` (0…TEETH-1); tooth 0 is at the BOTTOM.
- `pluckFlash` — a `Map<toothIndex, {t, color, voice, retro}>`: an entry exists for a recently-plucked tooth. `t` is the `performance.now()` timestamp of the pluck; `color` is the CSS color string of the plucking voice. Compute the animation phase as `k = Math.max(0, 1 - (now - fl.t)/420)` (1 = just struck, 0 = settled) and drive flex + flash + bloom from `k`.
- `now` — `performance.now()` (use for any idle shimmer; keep idle subtle).
- `TEETH` — the tooth count (17).
- Draw ONLY the tines (resting + animated). Do NOT draw the read-bar spine or its "READ-BAR" label (page chrome, drawn after you). Restore any `ctx.save()`; leave alpha at 1.
- Pure, synchronous, deterministic per `(now, pluckFlash)`.

## How it wires in / preview
Page calls `drawComb(...)` each frame; placeholder consults `window.__barrelArt.drawComb`. Wiring builder pastes the winner between the `<<BARREL-ART:comb>>` sentinels in both rooms. Preview as in `cylinder.md` (the harness cranks the drum so teeth are mid-pluck in the shot).

## Judge focus
A plucked tooth reads as a **struck, springy, ringing tine** — a real flex + a color flash + a soft bloom that decays — clearly livelier than thin glowing lines; all 17 teeth stay legible; the flash carries the voice color.
