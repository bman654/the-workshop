# Art asset: `sfx-harvest` — the box-capture / harvest chime (sound)

## What it is
The sound a box makes when you (or the Adversary) close its fourth side and claim it. In Dots-and-
Boxes the harvest is a CASCADE — taking one box of a chain hands you the next, so captures come in
quick runs. The chime should feel like a coin dropping into a tray / a string being plucked, and a
RUN of them (sweeping a chain) should rise into a little satisfying arpeggio, so eating a long chain
feels GOOD — which is the trap the exhibit teaches (greed feels right; greed loses). Warm, brass,
bell-like; never harsh. The placeholder (`sfxCapture(n)` in index.src.html) is a bare oscillator run.

## Art direction
- A single capture: a warm struck-bell / plucked-brass ping, short (~160ms), gold-toned (a clear
  fundamental + a soft octave + a touch of inharmonic shimmer so it reads "brass," not "sine").
- A RUN (n captures in a cascade): each successive ping a step higher, so a 3- or 4-box sweep
  rises into a bright little arpeggio — the seductive "I'm winning" feeling.
- Calm, low-gain, sits under a quiet board. No clipping.

## API (the builder contract — a piece-local namespace, mirrors the gate's Gate.sfx shape)
Installed at `the-long-chain/sfx.js`, loaded via `<!-- forge:include ./sfx.js -->`, exposing:

```js
window.LC = window.LC || {}; LC.sfx = LC.sfx || {};
// One capture ping. Dual-use: live (ctx = the page AudioContext) or offline (the WAV bench).
//   { ctx, dest, dur, when=0, seed=1, index=0, total=1 }
//   index/total: which capture in the current cascade (0-based) and how many — so the builder
//                can pitch each ping up the arpeggio. index=0,total=1 = a lone capture.
LC.sfx.harvest = function ({ ctx, dest, dur, when = 0, seed = 1, index = 0, total = 1 }) {
  // build the graph into `dest` (a GainNode/destination), starting at time `when`.
  // schedule oscillators/envelopes; return nothing. MUST be silent until `when`.
};
```

The page's `sfxCapture(n)` will, for i in 0..n-1, call
`LC.sfx.harvest({ctx, dest:masterGain, dur:0.18, when: ctx.currentTime + i*0.06, index:i, total:n})`.

## How it wires in
Replace the body of `sfxCapture(n)` with the loop of `LC.sfx.harvest(...)` calls above. Keep the
`if(!audioReady||muted) return;` guard. Audio stays unlocked on the first user gesture (already wired).

## Constraints
- WebAudio only, no samples/files. Deterministic given seed. Dual-use offline (the WAV bench
  passes a fresh OfflineAudioContext as `ctx`). ≤ `dur` seconds of sound per call.

## durSec
0.2 (a single ping render for the bench; the cascade is the page scheduling several).

## Judge focus
Does one capture sound like a warm struck-brass coin (clear, gold, not a raw sine), and does a
run of them rise into a satisfying arpeggio that makes grabbing a chain feel good?
