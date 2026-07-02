# Art spec — `drum-sound` (sound): the bearing whir + per-slit tick (ambience)

## What this asset is
The OPTIONAL sound bed for The Faithful Drum — ambience only, never a claim. A soft
WOODEN bearing whir whose pitch tracks the drum's angular speed |omega|, plus a faint
per-slit TICK that pulses once per slit-crossing (so at the lock it becomes a gentle
tick-tick-tick rhythm), and a warm two-note "it caught!" chime at the moment of lock.
The PLACEHOLDER (`drum-sound.js`) uses a bare filtered sawtooth whir + triangle ticks;
this asset makes the whir feel like a WOODEN spindle bearing (warmer, breathier, less
electronic) and the tick softer/woodier.

## House rules this MUST honour (non-negotiable)
- SILENT until a real user gesture: nothing is created/resumed until `DrumSound.unlock()`
  is called (the page calls it inside the drum-grab and Flick handlers). Do NOT create
  the AudioContext at module load.
- Respects the ONE shared mute: the page passes `muted` through `bindOmega`'s callback
  and gates `tick`/`lock` on it. When muted, produce no audible output.
- Ambience, never a claim: low level (whir gain ≤ ~0.05, ticks ~0.012, chime ~0.03),
  must never dominate or assert anything.

## The EXACT API the candidate code must expose
Replace the synth bodies in `drum-sound.js`, keeping `window.DrumSound` and every
signature identical:

```js
window.DrumSound = {
  // Create/resume the AudioContext and start the whir bed. MUST be called from inside
  // a user-gesture handler. Idempotent (safe to call again; just resumes).
  unlock() { … },

  // The page calls this once; fn() returns { omega, muted } each frame so the whir can
  // steer its pitch/gain off the live angular speed and cut out when muted.
  bindOmega(fn) { … },

  // One soft per-slit tick (the page calls this once per slit-crossing while locked).
  // absOmega = |omega| in rad/s (available if you want to colour the tick by speed).
  tick(absOmega) { … },

  // A faint warm "it caught" chime at the instant the drum enters the lock band.
  lock() { … },
};
```

## Render / judge bench
Universal WAV bench. Render ~4 s: unlock, ramp |omega| up into the lock band and hold
(so the whir settles + the ticks fall at lock cadence), fire one `lock()` at entry.
`durSec: 4`.

## Judge focus (one line)
Does it sound like a warm WOODEN zoetrope bearing (whir pitched to speed) with a soft
per-slit tick and a gentle catch-chime — ambient, low, never harsh or electronic — and
dead silent with no gesture / when muted?

## Constraints
- Pure WebAudio; no samples/files. Low level (see gains above). No DC/offset clicks.
- Keep the API shape; unlock must be gesture-safe and idempotent; honour `muted`.
- The whir must glide (setTargetAtTime), not zipper, as omega changes.
