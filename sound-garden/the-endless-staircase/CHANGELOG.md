# The Endless Staircase — changelog

A Sound Garden leaf (cycle #177). The estate's seen-and-heard **auditory-illusion**
piece: a Shepard/Risset endless glissando you can turn with your hand. Turn a brass
dial and a chord climbs — higher, higher, higher — yet every full turn it lands
*exactly home*, no higher than it started. The band of light you SEE is the law you
HEAR. Flip the envelope to LADDER and the trick breaks: the tone climbs out and
never returns.

Reached only from the Sound Garden footer family line (the-comma idiom): **no
front-door POI, no `ws:seen` crumb.** Built on the-overtone-rack's structural mold
(standalone `core.mjs` + `core.test.mjs` + `verify.sh` + an in-page pill byte-twinned
to the math core) and the-comma's mute + offline-render machinery.

## What the leaf is

- **The instrument.** Nine sine partials stacked an octave apart,
  `fₖ = f₀·2^(k + θ/12)`, where the dial reading `θ` is in semitones and **climbs
  without bound**. A FIXED Gaussian bell in log-frequency — pinned at middle C, the
  geometric middle of the C0..C8 bank — sets each partial's loudness. As `θ` climbs,
  every partial slides up through the stationary bell; a partial that climbs out the
  top is **reborn at the bottom** (the chord reads its phase as `frac(θ/12)`), so it
  is genuinely periodic. The dial counter keeps climbing; the chord folds home.
- **The seen form.** A chroma-helix: the partials ride a leaning pole inside a faint
  cylinder, brightest at the waist (the bell) and fading at the top and bottom. A
  stationary horizontal glow-band — its vertical luminance sampled live from the same
  `shEnvelope` the ear hears — is the law made visible. The pole leans as the rigid
  spiral rotates; one full revolution (360°) is one octave back onto a ghost
  start-frame.
- **The hero verb.** A draggable brass dial (`role="slider"`): drag accumulates
  signed revolutions into `θ` (1 rev = 12 semitones, unbounded). Keyboard is a true
  peer — ←/→ ±1 semitone, PageUp/Dn ±a full octave (snaps home so a keyboard user can
  verify the return), Home → 0, wheel = fine. It auto-glides on its own. **Landmine
  note:** the dial navigates `θ` from the pointer-capture *move*; NOTHING
  navigational or stateful fires on `pointerup` — release only clears the dragging
  flag and keeps the last glide speed (the flywheel), per the out-of-tune precedent.
- **The negative control.** An ILLUSION / LADDER segmented switch. LADDER removes the
  bell (flat amplitude) AND the wrap (raw `θ/12`, no recycling): the same nine
  partials become one rigid stack that just climbs and leaves.

## The math claim + the four self-test legs

The illusion is single-sourced to `core.mjs` (the STAIRCASE CORE block), byte-twinned
char-for-char into `index.html`. The in-page pill and the Node twin both call the one
`runStaircaseSelfTest()`, so they cannot disagree.

- **LEG A — cyclic to the bit.** At every phase θ (24 phases over an octave, integers
  AND half-steps), the partial set at θ+12 is the SAME `{f, a}` multiset as at θ —
  worst freq-ratio dev 5.6e-16, worst Δamp 3.3e-16 (both < 1e-9). The recycling wrap
  `frac(θ/12)` makes every rung the identical IEEE-754 double; the fixed bell gives
  the identical amplitude. The chord folds home at *every* phase, not only zero.
- **LEG B — centroid banded & periodic.** Across the full 0→12 glissando the
  illusion's spectral centroid (in log₂-Hz, where the bell is symmetric) stays inside
  a **derived** band (width 0.101 octaves) and returns EXACTLY to its start at θ=12
  (cycle residual = 0). The brightness never escapes a fixed window and resets every
  octave.
- **LEG C — the negative control escapes.** The LADDER centroid climbs strictly
  monotonically and exactly +1 octave per octave-shift (err = 0), exiting the band by
  ~0.9 octaves. The loop is born of the fixed bell and the wrap, not the spacing.
- **LEG D — always a bounded chord.** At every step ≥3 partials carry audible
  amplitude (≥8, in fact) and no partial exceeds the bell peak (a ≤ 1) — the tone
  never fades to silence nor spikes, so the additive sum + compressor cannot clip.

`CENTROID_BAND` is **derived in-module** as the min/max of the illusion centroid over
a fine sweep (not a magic number); the pill, the Node twin, and `verify.sh` all
assert against the same bounds. The anchor is derived, not typed: `SH_F0 ===
semiToFreq(−48)` (C0) to the bit, and the bell centre `SH_LOG_CTR ===
log₂(semiToFreq(0))` (middle C). σ = 1.8 octaves, ear-tuned in build for a rich
~8-partial chord, a visibly-bounded band, and a wide ladder-escape margin.

## The byte-twin discipline

`core.test.mjs` (exit 0 = green, **11/11**) re-runs the four legs, asserts the anchor
and bell-centre are derived, re-derives the periodicity over 1001 sub-semitone
phases, re-derives the band, and proves byte-twin parity:

- **STAIRCASE CORE** — `index.html`'s inlined slice === `core.mjs`'s slice,
  char-for-char (10338 chars identical). The page's pill IS the module's test.
- **PITCH CORE** — the slice is identical across `index.html`, `core.mjs`, AND
  `../pitch-core.mjs` (332 chars identical in all three). `semiToFreq` (and so
  `SH_F0 = semiToFreq(−48)`) is single-sourced, re-typed nowhere.

## The audio-lens ear-check (verify.sh)

It cannot be heard headless, so `window.__renderStaircase` rings the SAME
`shPartials()` law through an OfflineAudioContext, and the audio-lens skill reads the
WAVs back as spectral centroid + clip checks + spectrograms. `verify.sh` renders held
stills at θ ∈ {0,3,6,9} for both envelopes plus the two 0→12 sweeps. **PASS:**

```
ILLUSION centroids (Hz) θ=0/3/6/9:  384.8  385.4  385.8  386.2   (spread 0.4% — banded)
LADDER   centroids (Hz) θ=0/3/6/9:  912.3  1092.3  1307.8  1561.5 (strictly up, escapes ×4)
clips — loop:false flat:false i0:false l9:false
```

`spec-loop.png` shows the partials rising while the bright energy stays in a fixed
horizontal band (the centroid frozen at ~385 Hz); `spec-flat.png` shows the whole
stack marching diagonally off the top (the centroid climbing 912→1562 Hz) — the
difference is screenshot-readable. These numbers ARE the proof the sound matches the
math (Rain/Loom/Carillon/Lattice/Gamelan/Quorum/Rack precedent).

## Audio etiquette

Muted by default; honours the estate-wide `ws:pref:muted` key both ways (read on
load, honoured live across tabs without force-resuming). The dial still turns and the
helix still climbs when muted — the seeing is the thing; only the gain is gated.
