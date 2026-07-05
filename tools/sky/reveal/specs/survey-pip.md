# survey-pip — a star kindles into the survey (sound)

## Art direction
The soft, bright chime as ONE member star of a completing formation brightens in turn
during the front-door reveal. During a "chart," the members light one-by-one (~240 ms
apart); each fires a `surveyPip` one pentatonic step HIGHER than the last, so the
formation's members **CLIMB** as they kindle — a rising, hopeful little ladder that lands
under the `surveyChart` resolve.

A small, distant, in-tune **struck tine** — celestial and airy, quieter and cooler than
the gate's brass: a star pricking alight over the dark plate, not a hard click and not a
glassy sine ping. Quick warm attack, a short singing tail with a touch of inharmonic
metal shimmer, then gone. Played in rapid succession up the ladder, so it must be short,
never fatiguing, never harsh; quiet. Kin to `a-sky-you-name/sfx-snap.js` (the brass
snap-chime that climbs as a hand laces a figure) — but pitched for the observatory plate,
cooler and more distant, a hair airier per step.

## The EXACT API (the candidate must expose this — keep the key)
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.surveyPip = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
  // param (0..1) = member step / (count-1) → selects the pitch UP a pentatonic scale.
  //   Suggested (Hz), pick by round(param*(N-1)):
  //   [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5]  (C5 penta .. E6)
  // dur ≈ 0.6 (the note's total life; the tail may be shorter). when = start offset.
  // Render on the PASSED ctx (live OR OfflineAudioContext — DO NOT create your own). Connect to dest.
  // QUIET: peak well under 1.0 (aim ≈ -14 dBFS). Deterministic given seed (mulberry32).
  return { stop: function (at) { /* fade out */ } };
};
```

## Judge bar
The warmest, most bell-like distant struck-tine that climbs cleanly across the pitch
steps (param 0→1), short and non-fatiguing under rapid fire, clearly IN TUNE, cooler /
airier than the gate brass (an observatory chime, not a parlor bell), no clipping, no
glassy harshness. The bench renders at param=0 (the lowest rung, C5) — ensure it reads in
tune and warm there; the ladder is deterministic math above it. ~0.6 s.

## Wiring
Already wired: the front door calls `Gate.sfxPlay('surveyPip', 0.6, clamp(step/(count-1),0,1))`
as each member star brightens during a chart. Placeholder lives in
`tools/sky/reveal/sfx-survey-pip.js` — replace it, keep the API + the `Gate.sfx.surveyPip`
key. It is forge:include'd into `index.src.html`.

## durSec
0.6 (render/analysis length).
