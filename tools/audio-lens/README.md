# Audio Lens

> 🎓 **This tool graduated into a published agent skill.** Audio Lens now ships as a
> zero-dependency skill in **[audio-forge](https://github.com/bman654/audio-forge)** —
> install with `npx skills add bman654/audio-forge --skill audio-lens`. The skill is a headless Node CLI
> (port of this tool's DSP core, same 12/12 self-tests) with one-shot query flags and
> spectrogram PNG output. **For audio verification, prefer the skill** — invoke the
> `audio-lens` skill, or run its CLI — over driving this HTML by hand. This `index.html`
> stays here as the **genesis artifact** (and an interactive companion with full axis labels).

A single-file, zero-dependency tool to **see the sound and read the numbers** — the audio
counterpart to screenshot-grade visual verification. Open `index.html` directly from `file://`;
no server, no network, no CDN, no build step.

## What it does

Renders audio **entirely offline** through `OfflineAudioContext` (44100 Hz mono) — it makes
**no audible sound**, so it's deterministic and courteous at any hour. It then turns the PCM
buffer into things you can read by eye and by number:

- **Waveform** — amplitude vs time (min/max per pixel column).
- **Spectrogram** (the centerpiece) — STFT with a Hann window (size 2048, hop 512),
  **log-frequency** y-axis, dB magnitude mapped through a perceptual (magma-style) colour map.
  A chirp shows a rising diagonal; a triad shows three stacked lines; noise is a broadband wash.
- **RMS / loudness curve** — per-frame RMS in dBFS.
- **Feature readout** — peak dBFS + clipping % (|x| ≥ 0.999), mean RMS, spectral centroid
  (brightness), onset times → tempo (BPM, via spectral-flux peak-picking), monophonic pitch
  (autocorrelation) and top-3 spectral peaks for chords, each mapped to a note name
  (A4 = 440, equal temperament) + cents.

The FFT is a pure-JS radix-2 Cooley–Tukey transform — no libraries.

## Self-tests (the trust anchor)

Click **Run self-tests**. The tool renders each built-in signal, runs the analyzers, and shows a
PASS/FAIL table of measured-vs-expected within tolerance. The signals have known ground truth:

| Signal | Asserted |
| --- | --- |
| Sine 440 Hz (A4) | pitch A4 (±30c), centroid 440 (±20%), 0 onsets, not clipping |
| Sine 1000 Hz | spectral peak 1000 Hz (±3%), pitch ≈ B5 |
| A-major triad (440 / 554.37 / 659.25) | top-3 peaks = {A4, C#5, E5} |
| Click train @ 120 BPM | tempo 120 (±3) |
| Linear chirp 100→2000 Hz | centroid rises (2nd half > 1st) |
| White noise | centroid > 3 kHz, no stable pitch |
| Clipped sine | clipping flagged (> 1% of samples) |

All 12 checks pass. If you change the DSP, re-run them — they're the de-risker.

## Dropping a WAV (or any audio file)

Drag a file onto the drop zone (or click it to pick one). It's decoded via `decodeAudioData`,
downmixed to mono, and analyzed exactly like a built-in signal — so any rendered audio can be
dropped in and inspected.

## Offline / silent

There is no auto-play and no audible output path: everything goes through `OfflineAudioContext`,
which renders to a buffer faster than realtime and never reaches the speakers.

## Controls

- A button per built-in test signal + the file drop zone.
- FFT size (1024 / 2048 / 4096) and hop (256 / 512 / 1024).
- **Render & Analyze** runs the selected source and draws all three canvases + the feature panel.
- **Run self-tests** runs the full validation table.
