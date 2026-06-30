# Forged asset — the crank handle + knurled grip (the hand-held clock)

**Medium:** visual-exhibit · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/`) between `<<BARREL-ART:crank>>` … `<<END BARREL-ART:crank>>`.

## Art direction
The **crank** is the single most important touch-affordance in the wing — the brass handle on the turned left cap that the visitor GRABS and DRAGS, and which IS the clock (no flywheel; let go and time stops). It must look **grabbable**: a machined brass hub on the cap, a tapered arm, and a fat **knurled grip knob** at the end (cross-hatched/diamond knurling that catches light), the whole thing reading as a thing your hand wants to close around. Honor the rotation `ang` (the handle points where the crank position is). The current placeholder is a simple arm + a smooth knob; lift it to **turned hub + tapered arm + a real knurled grip with caught highlights**, so "this is hand-held" is obvious at a glance.

Cursor note: the grab cursor itself is CSS (`cursor:grab`/`grabbing` on the canvas) — you do NOT draw the cursor. Just make the HANDLE look like the obvious thing to grab.

## The exact API the candidate code must expose
```js
window.__barrelArt.drawCrank = function (ctx, x, y, r, ang) { … }
```

- `ctx` — 2D context (CSS px).
- `(x,y)` — the hub centre (on the left cap of the drum).
- `r` — the crank scale (arm length ≈ `r*0.9`, grip radius ≈ `r*0.16`, hub radius ≈ `r*0.13`). Keep within roughly this envelope so it sits on the cap.
- `ang` — the handle angle in radians (0 = pointing +x); rotate the arm+grip to this. The page sets `ang` to mirror the crank position EXACTLY (no inertia), so a smooth `ang` sweep must read as the handle turning.
- Draw ONLY the handle (hub + arm + grip). Do NOT draw the "⟳ THE CRANK = TIME" label (page chrome, drawn after you). Use `ctx.save()/translate/rotate/restore` and leave the transform clean.
- Pure + deterministic per `ang`.

## How it wires in / preview
Page calls `drawCrank(x,y,r,ang)` each frame; placeholder consults `window.__barrelArt.drawCrank`. Wiring builder pastes the winner between the `<<BARREL-ART:crank>>` sentinels in both rooms. Preview as in `cylinder.md` (the harness cranks the drum, so the handle is rotated off zero in the shot).

## Judge focus
The handle reads as a **grabbable, hand-held brass crank** — turned hub, tapered arm, a knurled grip that catches light — at the rotation `ang`; it sells "your hand is the clock," clearly richer than a plain arm+ball.
