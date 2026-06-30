# Art asset: `sfx-verdict` — the win sting & the loss sting (sound)

## What it is
The two short musical stings that land when a game ends: a WIN (you kept control, took the game)
and a LOSS (greed cost you the game). They are the emotional punctuation of the lesson — the win
should feel earned and warm, the loss should feel like control slipping away (not a harsh buzzer —
a quiet, resigned fall, because the loss is the teaching, not a punishment). The placeholders
(`sfxWin()`, `sfxLose()` in index.src.html) are bare oscillator triads.

## Art direction
- WIN: a warm rising brass cadence (3–4 notes), gold-toned, resolved and satisfied — "you saw it."
  Short (~0.8s total), low-gain, bell/brass timbre matching the harvest chime family.
- LOSS: a slow falling figure (3 notes), minor/resigned, a touch darker — the sound of the chains
  closing against you. NOT a harsh error buzzer; a quiet "ah, I see — greed lost it." ~0.9s.
- Both sit under a quiet board; no clipping; same warm brass family as `sfx-harvest`.

## API (piece-local namespace, mirrors the gate's Gate.sfx shape)
Installed into the SAME `the-long-chain/sfx.js` module as `sfx-harvest` (one module, two builders):

```js
window.LC = window.LC || {}; LC.sfx = LC.sfx || {};
LC.sfx.win  = function ({ ctx, dest, dur, when = 0, seed = 1 }) { /* rising cadence */ };
LC.sfx.lose = function ({ ctx, dest, dur, when = 0, seed = 1 }) { /* falling resigned figure */ };
```

## How it wires in
Replace the bodies of `sfxWin()` / `sfxLose()` with `LC.sfx.win({ctx,dest:masterGain,dur:0.8,when:ctx.currentTime})`
and `LC.sfx.lose({...,dur:0.9})`. Keep the `if(!audioReady||muted) return;` guard.

## Constraints
WebAudio only, no samples. Deterministic given seed. Dual-use offline. Self-contained.

## durSec
1.0 (covers either sting for the WAV bench; judge both builders).

## Judge focus
Does WIN feel earned and warm (a resolved rising brass cadence) and LOSS feel resigned and falling
(control slipping, NOT a harsh buzzer) — both in the same warm gold family as the harvest chime?
