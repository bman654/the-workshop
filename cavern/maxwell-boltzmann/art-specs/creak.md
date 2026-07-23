# Art asset — the settling creak (sound)

The small sound the lid makes as it comes to rest — a soft **creak/tick of load finding
its seat**, like a kitchen-scale needle settling or a weighted beam easing onto its
bearing. The placeholder is a bare sine ping. This asset replaces it with a brief,
organic settling creak.

## Art direction

- **A short, soft, organic settle.** A brief low creak or a muted double-tick — the sound
  of mass easing into equilibrium, over ~120–250 ms. Quiet and rounded; it marks the
  *arrival* at rest, a period at the end of the bob. NO squeak, NO cartoon boing, NO
  ring. It should feel like relief, not alarm.
- Subtle by design — it fires once per settle, so it must reward attention without
  demanding it. Deterministic given `seed` for gentle variation. Peak ≲ 0.12 into the
  muted-aware master. No samples.

## EXACT API the candidate code must expose

Install a builder as **`window.LidSfx.creak`**:

```js
window.LidSfx = window.LidSfx || {};
window.LidSfx.creak = function (o) {
  // o = { ctx, dest, when, dur, gain, seed }
  //   dur : target length (s), ~0.2
  // Schedule ONE settling creak into dest, start at `when`, done by ~when+dur.
  // Do not touch dest.gain.
};
```

WAV bench: render one creak, `dur≈0.2`.

## How it wires in

The winner replaces the `creak:` method in the inline `Sfx` object in
`cavern/maxwell-boltzmann/lid.html`; it is already called from `onSettle` each time the
lid reaches a new resting height. Honour `ws:pref:muted`.
