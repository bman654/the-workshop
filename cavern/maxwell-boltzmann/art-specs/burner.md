# Art asset — the burner roar (sound)

The bed under the burner knob: a low, breathy **roar** that rises with the setpoint T.
Turn the burner up and the roar deepens/broadens as the discs heat and the lid climbs.
The placeholder is a bare sawtooth into a gain. This asset replaces it with a real
combustion-like roar — filtered noise with a flame body, not a buzzy tone.

## Art direction

- **A continuous, breathy, low roar** — filtered noise (a broadband flame hiss) plus a
  soft low body, gently animated so it *breathes* rather than sitting static. Warm, not
  harsh; it lives UNDER the patter, never masks it. NO musical pitch, NO buzz, NO beating.
- **`T` maps to intensity + depth.** A parameter `T` (~0.2..2.0, the setpoint) raises the
  roar's loudness, low-end weight, and brightness — a low flame is a quiet breath, a high
  flame is a broad rush. A `running` flag (false when the gas is frozen) fades it toward
  silence. Changes must glide (setTargetAtTime), never click.
- This is a **sustained loop/bed**, not a one-shot: it exposes a controllable node, not a
  scheduled event. Peak modest (≲ 0.06) into the muted-aware master.

## EXACT API the candidate code must expose

Install a builder as **`window.LidSfx.burner`** that RETURNS a small controller (created
once, then updated), so the page doesn't rebuild the graph each frame:

```js
window.LidSfx = window.LidSfx || {};
window.LidSfx.burner = function (o) {
  // o = { ctx, dest }
  // Build the roar graph ONCE, connect to dest, start it (silent). Return a controller:
  //   return { set: function (T, running) { /* glide loudness/depth to T, fade if !running */ } };
  // Do not touch dest.gain.
};
```

WAV bench: build it, `set(1.4, true)`, render ~1.5 s of the steady roar (durSec ≈ 1.5).

## How it wires in

The winner replaces the `burner` machinery in the inline `Sfx` object in
`cavern/maxwell-boltzmann/lid.html`: build the controller lazily on first unlock, then the
frame loop calls `controller.set(live.Tset, !live.freeze)`. Honour `ws:pref:muted` (a
muted page holds it silent). This is a bed → the page already opts out of sound until the
first user gesture.
