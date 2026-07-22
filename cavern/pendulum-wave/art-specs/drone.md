# Art asset — the ambient drone bed (sound, OPTIONAL)

A faint, breathing pad under the whole exhibit — the room's held breath while the wave
travels. Strictly optional: the bench ships complete and correct with `PA.drone = null`
(no bed). Forge this only if it deepens the contemplative mood without competing with
the marimba. If in doubt, leave it null.

## Art direction

- **Barely there.** A low, slow, dark pad — a soft drone around the bench's tonal
  centre (the pentatonic is A-based; a low A/E bed suits it). Slow amplitude and/or
  filter breathing on the order of the recurrence, not fast. It must sit FAR below the
  marimba: the mallet notes are the melody, this is only air. No rhythm, no melody, no
  obvious loop seam.
- **Seamless + cheap.** A steady bed started once and left running (the master mute
  fades it with everything). Continuous, click-free, low CPU. It should sound identical
  whether the visitor arrived a second ago or ten minutes ago.
- Pure WebAudio, no samples, no external files.

## EXACT API the candidate code must expose

Install as **`PA.drone`** — a builder that starts the bed and returns a stop handle:

```js
PA.drone = function (o) {
  // o = { ctx, dest, seed }
  //   ctx  : AudioContext
  //   dest : AudioNode — connect the bed's output HERE (the muted master gain)
  //   seed : Number?   — optional determinism hook
  // Build the drone graph, connect to `dest`, start it, and RETURN { stop: function(){...} }.
  // Keep the bed's own peak very low (≲ 0.08) — it must not crowd the marimba.
  return { stop: function(){ /* ramp down + disconnect */ } };
};
```

The page tolerates `PA.drone === null` (no bed) and, if a builder is present, will
start it once on the first sound-enabling gesture and route it through the muted master.

## How it wires in

If forged, the winner replaces `PA.drone = null` in `cavern/pendulum-wave/art.js` with
the builder above. The page's audio-unlock path should then call it once (guarded so it
starts a single instance) into the muted master. **After installing, re-forge** the page
and keep `forge --check --all` clean. If NOT forged, nothing changes — the bench stays
correct with no bed.

## Judging

- **judgeFocus:** is it a barely-there, seamless, breathing low pad that deepens the
  hush WITHOUT competing with the marimba (very low level, no loop seam, no rhythm)?
- **durSec:** 8  (render a loopable 8 s bed for the bench)
