# sky-settle — the settle-swell + brass ting (sound)

## Art direction
The "it is WRITTEN" beat — played once when the laced figure catasterizes into a
named constellation. A soft, warm low swell rises as the ink lays down, capped by a
single warm brass TING as the name sets — a small moment of arrival and rest, not a
fanfare. Think: a chord blooming under a struck bell, then a clean settle. Warm, low,
unhurried; longer than the snap/nib (a full ~1.4s). Never glassy or triumphant-cheesy;
this is a quiet, dignified catasterize.

Blend of the estate's settle idiom + `the-cartographers-dream/sfx-ting.js` for the
brass cap.

## The EXACT API
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.settle = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0.9 }) {
  // dur ≈ 1.4 (total life). A low warm swell (gentle attack, long soft decay) + a
  //   brass ting entering a touch after the swell begins (~0.2*dur in). when = offset.
  // Render on ctx (live OR OfflineAudioContext). Connect to dest. QUIET (peak << 1.0).
  // Deterministic given seed.
  return { stop: function (at) { /* fade both */ } };
};
```

## Judge bar
Warmest, most satisfying "it is written / arrival" beat — a low swell blooming into a
single clean warm brass ting, dignified not triumphant, no clipping, no glassiness.
~1.4s.

## Wiring
Already wired: `setTimeout(()=>Gate.sfxPlay('settle', 1.4, 0.9), 240)` fires ~0.24s
after the nib sweep on close (immediate under reduced-motion). Placeholder
`sfx-settle.js` — keep the API.

## durSec
~1.6 (render/analysis length).
