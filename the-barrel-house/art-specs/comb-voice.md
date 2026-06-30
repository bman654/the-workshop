# Forged asset — the three-register plucked-comb timbre

**Medium:** sound · **durSec:** 3 (render length per take for the WAV bench) · **Module to install into:** `the-barrel-house/pin-barrel/index.src.html` (and `mirror-drum/`) between `<<BARREL-ART:comb-voice>>` … `<<END BARREL-ART:comb-voice>>`.

## Art direction (what it must SOUND like)
The voice of a **music-box comb tooth being plucked** — a bright metallic *ping* with a fast percussive attack and a natural ring-down (~0.8–1.0 s) that BE-s the sustain (the page never re-triggers on hold; the decay tail is the sustain). It must work across **three registers** — the comb's pitches span roughly C5…E6 (MIDI ~72–88) — so the timbre has to stay musical and in-tune low and high: a clear fundamental, a touch of inharmonic metallic shimmer (a high partial a hair sharp of an octave, like real comb steel), and a quick bloom-then-decay envelope. Stacking 2–3 of these (the canon's voices) through the page's master `DynamicsCompressor` limiter must sound like a **consonant little music box**, never muddy or clipping. The current placeholder is a plain triangle + sine shimmer; lift it to a richer, more convincingly *struck-metal* pluck (e.g. a small stack of detuned/inharmonic partials with per-partial decay, a noisy transient tick at the very onset for the "pluck", optional gentle lowpass that opens on attack).

`reversed` (a backward crank / the crab's retrograde pin) should give a **swelled, reverse-attack** version — a soft crescendo into the tooth instead of a percussive hit — so running time backward sounds like tape-reverse plucks.

THE FREQUENCY IS LOAD-BEARING: the note `midi` must come out IN TUNE (the `verify.sh` audio-lens pass reads the top spectral peaks back and asserts they are in-tune pentatonic comb notes within ~35 cents). Pitch correctness is a hard gate; timbre richness is the craft on top.

## The exact API the candidate code must expose
A single builder function, identical live (AudioContext) and offline (OfflineAudioContext):

```js
function combVoice(ac, dest, midi, when, reversed) { … }
```

- `ac` — the AudioContext (or OfflineAudioContext) — use `ac.createOscillator()` etc.; do NOT create your own context.
- `dest` — the AudioNode to connect into (the page's limiter input). Connect ALL your nodes' output into `dest`. Do NOT connect to `ac.destination` yourself.
- `midi` — the MIDI note number to sound; frequency = `440 * 2**((midi-69)/12)`.
- `when` — the AudioContext time (seconds) to start; schedule everything at/after `when` and `.stop()` every source by ~`when + 1.0` so offline renders terminate.
- `reversed` — boolean; `true` ⇒ the swelled reverse-attack variant.
- Keep per-note peak gain modest (≈0.3 so 3 stacked voices + the limiter don't clip). Self-contained, no external samples, no network. Must run under OfflineAudioContext (no `setTimeout`/rAF — schedule with Web Audio time).

## How it wires in / preview
The page calls `combVoice(ac, limiter, midi, when, reversed)` for every pin that crosses the read-bar (live) AND in `window.__renderOffline` (offline). The placeholder consults `window.__barrelArt.combVoice` first if present; the WIRING builder REPLACES the placeholder body between the `<<BARREL-ART:comb-voice>>` sentinels in BOTH rooms. After wiring, re-run `bash the-barrel-house/verify.sh` — the audio-lens must still report in-tune pentatonic peaks + no clipping.

## Judge focus
A convincing **struck music-box comb tooth** — bright metallic attack + natural ring-down, musical across C5…E6, consonant when 2–3 stack — and the rendered note stays IN TUNE (the hard gate) with no clipping.
