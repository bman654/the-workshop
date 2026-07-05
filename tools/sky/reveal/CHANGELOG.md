# The Survey Reveal — CHANGELOG

## 2026-07-05 — founded (Brandon-directed refinement)

A guided reveal choreography for the front door's **Survey of Heaven** star map, plus a
root-cause fix for a long-standing engraved-name bug. Directed by Brandon; **outside the
gauge cadence** (no cycle number; the gauge, `M`/`bigSwingsBuilt`, and all seed counters are
untouched).

### The two things
1. **BUG FIX — the engraved name only appeared after a refresh.** A completed constellation's
   name (e.g. "The Furnace") did not show on the visit that charted it; a reload was needed.
   ROOT CAUSE: the `.named-in` reveal keyframe animated `transform` with `fill-mode:both` on the
   SAME `<g.asterism-name>` that carries the label solver's positioning `transform` **attribute**
   — a CSS transform property beats the SVG attribute, so the name was pinned at the world origin
   (top-left) until a reload cleared `.named-in`. FIX: the reveal animation now lives on an INNER
   wrapper (`.an-inner`); the outer group keeps the berth transform untouched. (`index.src.html`
   `buildSkyNames` + the `.asterism-name .an-inner.named-in` CSS.)

2. **THE GUIDED REVEAL.** On return to the front door with a freshly-charted formation, the map
   now: shows a modal ("the survey has uncovered a new formation" — which is ALSO the audio-unlock
   gesture, and carries the estate mute), then flies the camera to each new formation one by one,
   lights its member-stars in a climbing ladder, inks the asterism line, writes the engraved name,
   and eases home — with a short musical sequence. Input is locked during the tour (a click / any
   key skips). Stray new stars (no formation) get a shorter, silent flourish. Reduced-motion falls
   back to a static reveal (no camera, no modal). A backfill of many fresh items (flags predating
   the feature, or a long absence) also reveals statically — never a lock/modal storm.

### Architecture
- **`tools/sky/sky.js`** — added an opt-in `Sky.renderInto(…, {hold:true})` mode: fresh
  stars/lines/names render in their pre-reveal state and their first-light/name flags stay
  un-armed; the held plan is exposed on `g.__skyHeld = {starIds, astIds}`. `Sky.armReveal(store,
  {stars,asts})` arms those flags monotonically as the choreography lights each (crash-safe: a
  reload mid-tour re-reveals only the not-yet-shown ones). The DEFAULT path is byte-identical —
  `sky.test.cjs` (89/89) is untouched.
- **`index.src.html` §survey-reveal** — `window.__runSurveyReveal(skyG)` (the choreography), the
  camera helpers (`svFrameForStars`/`svFlyTo`/`svEaseHome`, reusing `window.__panCamera.frameTo`
  + the `.walking` ease at a calm below-LOD zoom), the modal (`#surveyModal`) + input-lock scrim
  (`#surveyLock`), and the mute-aware audio (`Gate.unlock`/`Gate.sfxPlay` over the estate-shared
  `window.__wsAudioCtx`, gated on `ws:pref:muted`). Fully guarded: any failure → static reveal.

### The sound cues (forged in-house by the ART FOUNDRY, K takes → judges → synth)
- **`sfx-survey-pip.js`** (`Gate.sfx.surveyPip`) — a star kindling: a cool, distant struck tine
  that climbs a major-pentatonic ladder by `param`. Foundry: take-2 base (dead-on C5) + take-1
  early-reflection halo graft (the "distant over the plate" air). ~-14 dBFS, no clip, in tune.
- **`sfx-survey-chart.js`** (`Gate.sfx.surveyChart`) — the resolve as a formation is named: a
  celeste ladder rise → a lift to the pentatonic 6th → a sustained tonic octave over a twinkling
  glass pad and a low root swell. `param` keys the motif to a C-pentatonic degree (each formation
  sings its own consonant note). Foundry: take-1 winner + grafts (JI ladder, octave crest,
  sigh-to-the-6th, tonic pad). ~-9 dBFS, no clip, C5 resolve dead-on.
- Verify a cue: `GATE_SRC="$PWD" bash art-foundry/render-wav.sh /tmp/o-s tools/sky/reveal/sfx-survey-<k>.js 8901 /tmp/o-o <dur>` then `node tools/audio-lens/bin/audio-lens.js analyze /tmp/o-o/asset.wav --human`.

### Verified
All gates green: `forge --check --all` 137, `sky.test.cjs` 89/89, `estate.test.cjs` 40, `door`
12, `legibility` 33, `formations` 87, `polar` 37, `fold`, `derive-sky --check`, `ws` 60,
`gate-dom.test.mjs` PASS (D9 star-card/index intact). Live end-to-end (agent-browser + real CDP
click): seeded a fresh Furnace → modal → real-click Reveal → 4 members charted + line inked +
"The Furnace" positioned at its berth (screenX 865/1280, on the right, visible on the reveal
visit — the bug fix) → flags armed → camera eased home → `Gate._ctx` running (audio unlocked).
Refresh path clean (no re-choreography, name steady + positioned). Stray-star path clean (silent,
no hang). Both forged WAVs in tune + no clipping.
