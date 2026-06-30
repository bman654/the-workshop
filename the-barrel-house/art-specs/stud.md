# Forged asset — the brass pin-stud with caught light

**Medium:** visual-exhibit · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/`) between `<<BARREL-ART:stud>>` … `<<END BARREL-ART:stud>>`.

## Art direction
Each **stud** is one pin on the cylinder — a small brass peg standing proud of the drum, voice-colored, that will pluck a comb tooth when it reaches the read-bar. A stud should read as a **tiny machined brass dome catching the case light**: a colored body (the voice tint), a crisp specular highlight up-and-left, a faint cast shadow / contact darkening where it meets the drum, and a subtle rim so near-the-read-bar studs (bigger, brighter) feel raised and far ones (smaller, dimmer) recede. The current placeholder is a flat disc + a white dot; lift it to a **lit little dome** so the lattice of pins sparkles like real brass pins under glass — without becoming heavy (there are ~48 on screen; keep it cheap to draw).

The color passed in is the voice's tint (gold/blue/green/pink). Honor `alpha` (near-read-bar studs come in brighter) — multiply your whole stud by it so the depth cue the page computes still reads.

## The exact API the candidate code must expose
```js
window.__barrelArt.drawStud = function (ctx, x, y, r, col, alpha) { … }
```

- `ctx` — 2D context (CSS px).
- `(x,y)` — stud centre.
- `r` — stud radius in px (~3.2 far … ~6.4 at the read-bar).
- `col` — the voice's CSS color string (the dome's body tint).
- `alpha` — 0…1 overall opacity (the page's distance-to-read-bar brightness cue); apply it to the whole stud and RESTORE global alpha to 1 before returning.
- Draw ONE stud, fast. No `ctx.save()` leak, no shadow state left set (reset `ctx.shadowBlur=0`). Pure + deterministic.

## How it wires in / preview
Page calls `drawStud(x,y,r,col,alpha)` per pin per frame; placeholder consults `window.__barrelArt.drawStud`. Wiring builder pastes the winner between the `<<BARREL-ART:stud>>` sentinels in both rooms. Preview as in `cylinder.md`.

## Judge focus
A stud reads as a **lit machined brass peg** (body + specular + contact shadow) that catches the case light and sits proud of the drum — sparkly but cheap; the voice tint and the near/far brightness cue both survive.
