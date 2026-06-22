# The Vowel Throat — changelog

A Sound Garden **leaf**, the **subtractive mirror-twin of the Overtone Rack**:
the Rack ADDS partials to BUILD a tone; the Throat SUBTRACTS bands to UNCOVER a
voice. Drag one glowing dot through a labelled formant-space pad and HEAR a
constant glottal buzz become "ah / ee / oo / oh" as two filter-hills slide along
the source's harmonic comb.

## The claim, and how it's proven

> A vowel is what is LEFT when a glottal buzz is carved by two resonances. The
> source is a full harmonic comb (1/n on every rung); the throat is two parallel
> bandpass formants F1, F2. Their product attenuates everything but the two
> surviving clusters — and those clusters ARE the vowel. Collapse both filters to
> one center and the two peaks merge; the two-formant classifier fails and the
> vowel dissolves to a featureless hum.

Single math authority: **`core.mjs`** (the `THROAT CORE` block).
- `VOWELS` — the Peterson & Barney (1952) adult-male formant means; the only place
  the cardinal F1/F2 literals live (single-source grep asserts /a/'s 730/1090).
- `Q1=9`, `Q2=11` — the formant bandwidths; read by the drawn hills, the live
  filters, AND the analytic `bandpassMag`, so eye/ear/crux cannot disagree.
- `padToFormants` / `formantsToPad` — the LOG bijection between the pad's unit
  square and (F1,F2); the linguist's vowel trapezoid falls out as a shape.
- `bandpassMag` — the analytic biquad-bandpass magnitude (the ONE formant hill);
  `throatResponse` multiplies the comb by the two-hill envelope (subtractive).
- `formantPeaks` — recovers the two formants by the most-energetic comb rung in
  each band; `isTwoFormant` (p2−p1 > 2·f0) is the negative-control classifier.
- `runThroatSelfTest(f0)` — the SOLE four-leg oracle, called by BOTH the in-page
  pill and the Node twin (they cannot diverge).

The pitch anchor `semiToFreq` is **byte-twinned** from `../pitch-core.mjs`; the
page inlines two byte-twins (PITCH CORE, THROAT CORE) char-for-char;
`core.test.mjs` re-extracts each slice and asserts parity. The audio master chain
(highcut → tanh softclip → limiter → masterGain) is lifted **verbatim** from
`carillon.html` — it cannot clip.

### The four self-test legs
1. **Two formants recover F1/F2** — for /a/ and /i/, `formantPeaks` lands each
   recovered peak within ±one comb spacing (±f0 ≈ 120 Hz) of the published value.
   That is the honest resolution of a comb — no faked-tight bound.
2. **The negative control** — collapse both resonances to one center and the two
   peaks MERGE (|p1−p2| ≤ f0); the classifier reads TRUE for /a/,/i/ and FALSE for
   the collapse. One resonance is a hum, not a vowel.
3. **The vowels are distinct** — /a/,/i/,/u/,/e/ are four separated points in
   (F1,F2), every pairwise distance clears the floor.
4. **Subtractive, not additive** — the source comb is FULL; the throat is a
   bounded multiplicative envelope that only REMOVES energy; the in-band envelope
   towers over the carved-out region. The vowel is what is left.

## Verification
- **Node twin** (`node core.test.mjs`) — exit 0, **12/12**: the 4 shared legs +
  a disjoint grid-argmax re-derivation of `bandpassMag`'s peak, formant recovery
  at fresh buzz pitches (100, 140 Hz), the pad↔formant bijection round-trip,
  byte-twin parity (×2), anti-circularity (`bandpassMag` defined once; slice
  import-free), and the single-source grep (the /a/ pair in one .mjs).
- **In-page pill** — green; the collapse switch makes the on-page peaks merge.
- **Audio ear-check** (`bash verify.sh`) — renders 3 WAVs from the live chain via
  `window.__renderThroat` and has the Audio Lens (which cannot hear) confirm: /a/
  shows two clusters at its published formants; /i/ splits far and reads brighter;
  the collapse keeps one hill; no clipping.

## Form & house bar
- The played instrument is a **formant-space pad** (canvas, role=application,
  keyboard: arrows nudge / Shift fine / PageUp-Dn coarse / keys 1–9 jump to a
  vowel; aria-live announces each move) and a **live source-comb** witness drawing
  the buzz, the two bandpass hills, and the carved output — redrawn event-driven
  off the drag (no rAF).
- Muted-by-default audio (honours `ws:pref:muted`) + a ▶ start scrim; a held
  glottal sawtooth (gentle vibrato) through two parallel bandpass biquads glided
  by `setTargetAtTime` — no zipper.
- Estate aesthetic: Georgia clip-text h1, `--c:#ff7a6b` throat-red, the Rack's
  leaf chrome, `← sound garden` backlink, reciprocal ↔ mirror-twin footer.

## Publisher fresh-eyes (#285)
The two toggles are `role="switch"` but carried `aria-pressed` (a `role="button"`
state) — a switch exposes on/off via `aria-checked`, so a screen reader read no
state. Fixed all five sites (2 CSS selectors, 2 markup attrs, the JS read+write) to
`aria-checked`; the visual knob + every behaviour is unchanged, the toggle now
announces "switch, on/off" correctly. The byte-twin parity is untouched (the toggle
markup is page-only, outside the THROAT CORE slice — Node twin stayed 12/12). The
audio ear-check re-ran on three FRESH `window.__renderThroat` WAVs → PASS (/a/ at
719·1079, /i/ split far 239·2280 brighter, collapse one hill, no clipping); the
in-page pill held green 4/4 through the full drive (vowel jumps, arrows, both
toggles) with zero console errors; mobile 390px showed no horizontal overflow.

## Lineage
Mirrors the Overtone Rack's leaf mold (sentinels, byte-twin, sole-oracle pill,
single-source grep, the muted-audio segment, the offline-render + encodeWAV
ear-check hook). The master chain is the carillon's. Built by a generator
(`build-page.mjs`) so the byte-twins are read from source, never hand-copied.
