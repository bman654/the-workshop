# Changelog

## 0.1.0 — initial build

First working version of Audio Lens: single self-contained `index.html`, vanilla JS + Canvas +
Web Audio, zero dependencies, runs from `file://`.

### Built
- **Pure-JS FFT** — radix-2 Cooley–Tukey, in-place iterative (bit-reversal + butterflies).
  Independently sanity-checked: an 8-cycle cosine over 64 samples peaks at bin 8; a DC signal
  gives bin0 = N.
- **STFT spectrogram** — Hann window (default size 2048, hop 512), log-frequency y-axis
  (40 Hz → Nyquist), dB magnitude through a magma-style perceptual colour map with frequency
  gridlines/labels.
- **Waveform** (min/max per pixel column) and **RMS / loudness curve** (per-frame dBFS).
- **Feature readout** — peak dBFS, clipping count/% (|x| ≥ 0.999), mean RMS, spectral centroid
  (power-weighted, with whole-buffer and 1st/2nd-half values), onset detection → tempo,
  monophonic pitch (parabolic-interpolated autocorrelation), top-3 spectral peaks (chord), all
  mapped to note names (A4 = 440, equal temperament) + cents.
- **Offline render** via `OfflineAudioContext` (44100 Hz mono) — silent by design, no auto-play.
- **Built-in generators** with known ground truth: 440 Hz sine, 1000 Hz sine, A-major triad
  (440 / 554.37 / 659.25), 120 BPM click train, 100→2000 Hz linear chirp, white noise, clipped
  sine (gain 1.5, hard-clipped).
- **File drop + picker** → `decodeAudioData` → downmix to mono → analyze.
- **Self-test panel** — renders every generator, runs the analyzers, asserts measured-vs-expected
  within SPEC tolerances, renders a green/red PASS/FAIL table.

### Tuned to get all self-tests green
- **Onset detection (the one fix needed).** The first pass used spectral flux peak-picked against
  a threshold scaled to the *global max flux*. A steady 440 Hz sine has only minuscule
  window-edge flux ripple (max ≈ 0.15) yet that ripple got normalized up and fired ~37 phantom
  onsets. Fix: normalize the half-wave-rectified flux by each frame's own spectral magnitude sum
  to get a dimensionless **onset strength**, then peak-pick with an **absolute floor** (0.30) plus
  a local-baseline term. A true transient injects a large fraction of new spectral energy in one
  hop (clicks: strength ≫ floor); a sustained tone or broadband noise never does. Result: sine →
  0 onsets, white noise → 0 onsets, click train → 7 onsets → 120.2 BPM.
- Everything else passed on the first correct implementation (FFT, centroid, pitch, peaks,
  clipping, chirp centroid trend).

### Verified (agent-browser, session `audiolens-build`, `file://`)
- Self-tests: **12 / 12 PASS**. Measured: 440 sine → A4 +0c, centroid 440 Hz, 0 onsets, not
  clipping; 1000 sine → peak 999.3 Hz, B5 +21c; triad → {C#5, E5, A4}; clicks → 120.2 BPM;
  chirp → centroid 577 → 1517 Hz; noise → centroid 11038 Hz, no stable pitch; clipped → 53.61%.
- Chirp spectrogram → clear rising diagonal. Triad → three stacked horizontal lines (~440–660 Hz).
  Noise → broadband wash.
- Console: **zero errors/warnings**.
