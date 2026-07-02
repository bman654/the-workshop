# sky-fwump — a fresh sheet of vellum (sound)

## Art direction
A fresh sheet of vellum settling onto the table — played once when a new sky is
scattered (Re-seed, and after Keep files a chart). A soft low paper-thump with a brief
airy edge-flutter. No tone, no click. It is the "clean page" sound — a gentle,
grounding whump that resets the scene. Quiet, quick (~0.5s).

Kin to `the-cartographers-dream/sfx-fwump.js` — the same paper-settle idiom.

## The EXACT API
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.fwump = function ({ ctx, dest, dur, when = 0, seed = 7, param = 0 }) {
  // dur ≈ 0.5. A LOW body (settling thud, a lowpass sweeping down) + a brief AIRY
  //   high-passed flutter (the paper edge). Render on ctx (live OR OfflineAudioContext).
  //   Connect to dest. QUIET (peak << 1.0). Deterministic given seed (seeded noise buffer).
  return { stop: function (at) { /* fade */ } };
};
```

## Judge bar
Most convincing soft paper/vellum settle — a warm low thump with a light airy edge-
flutter, grounding not startling, quiet, no clipping. ~0.5s.

## Wiring
Already wired: `Gate.sfxPlay('fwump', 0.5, 0)` on Re-seed and after Keep. Placeholder
`sfx-fwump.js` — keep the API.

## durSec
~0.6 (render/analysis length).
