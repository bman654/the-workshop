# Art assets — The Unstirring SFX suite (sound × 3)

Three WebAudio builders, kin to `the-value-of-a-cut`'s `sfx-*.js`. Each sets
`Gate.sfx["<key>"]` and satisfies the estate builder contract:

```js
window.Gate = window.Gate || {}; Gate.sfx = Gate.sfx || {};
Gate.sfx["<key>"] = function ({ ctx, dest, dur, when = 0, seed = 1, param }) {
  // schedule the sound on ctx starting at ctx.currentTime + when (when is RELATIVE).
  // deterministic: seeded mulberry32 PRNG, NEVER Math.random.
  // dual-use: runs on a live AudioContext OR an OfflineAudioContext (for the WAV bench).
  // peak well under 0 dBFS. return { stop(at) } that fades master out.
};
```

The page's `play(key, fallback, param)` prefers the forged `Gate.sfx[key]`; a placeholder
tone stands in until each is forged. All gated behind `WS.muted()` and unlocked on the first
user gesture (the first crank drag). Render rate for the WAV bench: 22050 Hz mono.

## `drag` — the viscous crank tone (the CONTINUOUS one)
- **BRIEF**: a low, thick VISCOUS drag tone that plays while the crank is turning and whose
  pitch/brightness RISES gently with crank speed — the sound of dragging something heavy
  through syrup. `param` = normalized crank speed 0..1 (the page passes it; also re-triggered
  in short grains as speed changes). `dur` ≈ 0.22 per grain.
- **DIRECTION**: a dark filtered-noise + low sawtooth bed, heavily low-passed (a slow, gluey
  "shhhh-mmm"), lowpass cutoff and a faint sub-harmonic rising with `param`. No attack click —
  it swells in over ~30ms and fades over the grain so consecutive grains overlap into a smooth
  continuous drag. Quiet — it underlies, never dominates. Think: turning a heavy brass valve
  packed in grease.
- **judgeFocus**: does it feel like dragging through thick syrup, brightening smoothly with
  speed, seamless when re-triggered — never a buzzy engine or a click train?
- **durSec**: 0.22

## `gather` — the "it came home" chime + gold swell (the REWARD one)
- **BRIEF**: the gasp reward. Fires ONCE when the blob re-gathers at Re≈0 after an un-stir.
  A soft, warm **gather-chime** (a gentle bell/glass tone) blooming into a slow **gold swell**
  (a warm major-ish pad rising then settling) — relief and wonder, "it came home." `dur` ≈ 1.6.
- **DIRECTION**: a struck glass/bell prime around A5–E6 with a couple of warm consonant
  partials, soft ~2ms attack, ringing ~1s; UNDER it a slow filtered pad that swells up over
  ~0.5s and settles — a warm perfect-fifth/major-third stack, no dissonance. It should feel
  like a held breath released. Peak modest so it's a warm glow, not a fanfare.
- **judgeFocus**: does it land as a genuine warm gasp of relief — a clean chime blooming into
  a gold swell — beautiful, not a generic video-game ding?
- **durSec**: 1.6

## `lost` — the "…it stayed lost" thud (the DENIAL one)
- **BRIEF**: fires ONCE when the un-stir happens at high Re and the blob stays smeared. A dull,
  low, damped **thud** — the opposite of the gather chime: no ring, no bloom, a soft closed
  door. `dur` ≈ 0.5.
- **DIRECTION**: a low (~70–110 Hz) sine/triangle with a fast soft attack and a quick damped
  decay (no sustain, no bell partials), maybe a whisper of low filtered noise for a muffled
  "thump" body. Quiet and final. It should read as gentle disappointment, not a harsh error
  buzz — the fluid simply kept the secret.
- **judgeFocus**: does it land as a soft, dull, final thud (dye stayed lost) — muffled and
  quiet, never a harsh error tone?
- **durSec**: 0.5

## How they wire in
`index.src.html` holds placeholder builders on a local `Gate.sfx` fallback and a `play()`
plumbing (copied from `the-value-of-a-cut`): `playDrag(speed)` on crank move, `playGather()` /
`playLost()` on the gasp resolution. Each `<script><!-- forge:include ./sfx-<key>.js --></script>`
sets the real `Gate.sfx[key]` before the module boots; unforged keys keep the placeholder.
`SFX_DUR = { drag:0.22, gather:1.6, lost:0.5 }`.
