# survey-chart — the survey charts a new formation (sound)

## Art direction
The short **musical sequence** that lands the moment a constellation completes in the
front-door "Survey of Heaven" and its engraved name is written into the estate's night
sky. It plays under the name fading in, after the formation's member-stars have brightened
one-by-one (each a `surveyPip`, a rising ladder) — so this cue is the **resolve**, the
landing, the "…and it is named."

A warm **celeste / glass** arpeggio that RISES and then RESOLVES onto a sustained tonic
with a soft octave shimmer, over a low root swell — *a formation settling into the
heavens*. This is the OBSERVATORY PLATE being inked at night: distant, calm, a little
awed — NOT the gate's bright brass fanfare and NOT a video-game "achievement" sting.
Register kin: `the-gate/audio-logotune.js` ("The Glass Staircase," an A-major arpeggio
resolving to the tonic) — but calmer, more distant, its own voice; and the celestial-
atlas idiom of `a-sky-you-name/sfx-settle.js`. Antique-orrery warmth, gilt on indigo.

Feel: ~2.6–2.8 s. A gentle rise (4-ish notes) → a brief settle → a bright, longest,
sustained TONIC resolve with a whisper of octave shimmer. A soft low root swell breathes
under the whole phrase (felt, not heard — keep it well below the melody). It must feel
resolved and complete on its own; never abrupt, never harsh, never glassy-thin.

## The EXACT API (the candidate must expose this — keep the key)
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.surveyChart = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
  // param (0..1) KEYS the whole motif to a major-pentatonic degree of C4 so each
  //   formation "sings its own note" yet all stay consonant. Suggested root selection:
  //   var PENTA=[1, 9/8, 5/4, 3/2, 5/3]; R = 261.6256 * PENTA[round(param*4)];  (C D E G A)
  //   Build the arpeggio relative to R. The last note = the tonic OCTAVE (2R), longest+brightest.
  // dur ≈ 2.8 (total life; tails may extend a little past). when = start offset.
  // Render on the PASSED ctx (live OR OfflineAudioContext — DO NOT create your own). Connect to dest.
  // QUIET: peak well under 1.0 (aim ≈ -9 dBFS), NO clipping. Deterministic given seed (mulberry32).
  return { stop: function (at) { /* fade out */ } };
};
```

## Judge bar
The warmest, most resolved celeste/glass "a-formation-is-named" cue: clearly IN TUNE
(a clean C-major-pentatonic read), a satisfying rise→resolve arc landing on a sustained
tonic, calm and awed (observatory plate, not brass fanfare, not an arcade sting), no
clipping (peak < 0 dBFS, headroom ~-9), no glassy harshness, the low root swell present
but subordinate to the melody. The bench renders at param=0 (root = C4); ensure the arc
reads in tune and resolved there. ~2.8 s.

## Wiring
Already wired: the front door calls `Gate.sfxPlay('surveyChart', 2.8, formationKey)` as a
completing formation's engraved name fades in (formationKey ∈ [0,1] derived from the
constellation). Placeholder lives in `tools/sky/reveal/sfx-survey-chart.js` — replace it,
keep the API + the `Gate.sfx.surveyChart` key. It is forge:include'd into `index.src.html`.

## durSec
2.8 (render/analysis length).
