# sky-snap — the brass snap-chime (sound)

## Art direction
The sound of a lace-line CATCHING a star. A warm, struck-brass bell note — a small
antique orrery chime, not a glassy sine ping and not a hard percussive click. Each
successive snap in one figure rings one pentatonic step HIGHER, so lacing a figure
CLIMBS (C5 up toward E6) — a rising, hopeful little ladder. It should feel like a soft
metal tine being tapped: a quick warm attack, a short singing tail with a touch of
inharmonic brass shimmer, then gone. Played rapid-fire as a hand glides star to star,
so it must be short and never fatiguing or harsh; quiet.

Kin to `the-cartographers-dream/sfx-ting.js` (the compass bearing-lock chime) but
tuned to a rising pentatonic scale and a hair brighter/warmer per step.

## The EXACT API (the candidate must expose this)
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.snap = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
  // param (0..1) = the snap step / 8 → selects the pitch UP a pentatonic scale.
  //   Suggested scale (Hz), pick by round(param*(N-1)):
  //   [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5]  (C5 penta .. E6)
  // dur ≈ 0.5 (the note's total life; the tail may be shorter). when = start offset.
  // Render on ctx (live OR OfflineAudioContext — DO NOT create your own). Connect to dest.
  // QUIET: peak well under 1.0. Deterministic given seed.
  // ... build oscillators/gains, start at ctx.currentTime + when ...
  return { stop: function (at) { /* fade out */ } };
};
```

## Judge bar
Warmest, most bell-like struck-brass chime that climbs cleanly across the 8 pitch
steps (param 0→1), short and non-fatiguing under rapid fire, no clipping, no glassy
harshness. Test at several `param` values.

## Wiring
Already wired: the page calls `Gate.sfxPlay('snap', 0.5, clamp(step/8,0,1))` on each
lace snap and on the first grab. Placeholder lives in `sfx-snap.js` — replace it,
keep the API + `Gate.sfx.snap` key.

## durSec
~0.6 (render/analysis length).
