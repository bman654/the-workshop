# sky-nib — the papery pen-scratch (sound)

## Art direction
A dry, papery pen-nib scratch — ink being laid on vellum. No tone, no pitched
component, no click train: filtered noise with a fast papery envelope. Used two ways:
(1) a short scratch UNDER each snap (dur ≈ 0.09, param ≈ line-count/8), and (2) a
longer ~0.5s SWEEP as the whole figure inks on catasterize (param ≈ 0.9). `param`
(0..1) raises the brightness + a touch of the rate/energy so a fast/busy sweep sounds
busier than a slow one. It must sound like a real nib on paper — grainy, warm, dry —
not white hiss and not a whoosh. Quiet, sits UNDER the chime.

Kin to `the-cartographers-dream/sfx-nib.js` — the same lantern/nib idiom.

## The EXACT API
```js
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.nib = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0.5 }) {
  // dur = burst length (0.09 under a snap; ~0.5 for the ink sweep). param (0..1) = activity.
  // Render on ctx (live OR OfflineAudioContext). Connect to dest. QUIET (peak << 1.0).
  // Deterministic given seed (use a seeded PRNG for the noise buffer — no Math.random,
  // so an OfflineAudioContext render is reproducible for the judge).
  return { stop: function (at) { /* fade */ } };
};
```

## Judge bar
Most convincingly PAPERY dry nib-on-vellum scratch (grainy, warm, not white-hiss, not
a whoosh), scaling believably with param, quiet, no clipping. Test at param 0.3 (short)
and 0.9 (the ~0.5s sweep).

## Wiring
Already wired: `Gate.sfxPlay('nib', 0.09, lineCount/8)` under each snap and
`Gate.sfxPlay('nib', 0.5, 0.9)` on close. Placeholder `sfx-nib.js` — keep the API.

## durSec
~0.5 (the sweep length — the judge's headline render).
