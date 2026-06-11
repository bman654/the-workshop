# Audio Lens — SPEC

*Give audio the same screenshot-grade verification the workshop's visual pieces already get.*
Render Web-Audio **offline** (`OfflineAudioContext` — **no sound through the speakers**, courteous
at night) to a PCM buffer, then turn the sound into things I can **read by eye + number**: a
spectrogram, a waveform, a loudness curve, and a feature readout (clipping / brightness / tempo /
detected pitches). Validate every analyzer against **known test signals** so the tool is trustworthy.

One self-contained file: `tools/audio-lens/index.html` — vanilla JS + Canvas + Web Audio, **zero
deps, no network/CDN**, relative paths, `"use strict"`. Works from `file://`. **Pure-JS FFT** (radix-2
Cooley–Tukey) — no libraries. This is an INTERNAL TOOL under `tools/` — **NOT** a front-door project
(do not touch the landing `index.html`).

## Why offline-only
`OfflineAudioContext` renders faster-than-realtime to a buffer and makes **no audible sound** — so
this never disturbs anyone at odd hours, and it's deterministic. Do **not** add an auto-playing
audible button; offline render only (an optional, default-OFF, explicit "play" is fine but not required).

## Signal sources
1. **Built-in generators** (rendered via `OfflineAudioContext`, 44100 Hz mono, ~4 s unless noted) —
   each has a KNOWN expected analysis (ground truth for self-tests):
   - **Sine 440 Hz (A4)** → peak bin ≈440; detected pitch **A4**; centroid ≈440; ~0 onsets; not clipping.
   - **Sine 1000 Hz** → peak bin ≈1000; pitch ≈ B5 (+ cents).
   - **A-major triad** (440 + 554.37 + 659.25 = A4/C#5/E5) → top-3 detected pitches = {A4, C#5, E5}.
   - **Click train @ 120 BPM** (impulses every 0.5 s) → onset interval ≈0.5 s → **tempo 120** (±3).
   - **Linear chirp 100→2000 Hz** (4 s) → centroid rises (2nd-half centroid > 1st-half); pitch tracks sweep.
   - **White noise** → high centroid (>~3 kHz); broadband spectrogram; no stable pitch.
   - **Clipped sine** (440 Hz at gain 1.5, hard-clipped) → **clipping detected** (peak ≥ 0 dBFS, %clipped > 1%).
2. **WAV / audio file input** — drag-drop or file-picker → `decodeAudioData` → analyze (so any
   rendered audio can be dropped in).
3. *(optional, low priority — the hook for analyzing instruments later)* a textarea to paste a
   `render(ctx, durationSec)` function that builds a graph; run it in `OfflineAudioContext` & analyze.

## Analyses + visualizations (drawn to canvases — screenshot-able)
- **Waveform** — amplitude vs time, min/max per pixel column over the whole buffer.
- **Spectrogram** *(centerpiece)* — STFT magnitude over time. Hann window, size 2048, hop 512;
  **log-frequency** y-axis; dB magnitude → perceptual colour map (magma/viridis-like). Must visibly
  match the signal (chirp = rising diagonal; triad = 3 stacked lines; noise = broadband wash).
- **RMS / loudness curve** — per-frame RMS in dBFS, line plot.
- **Feature readout (text):**
  - **Peak** (dBFS) + **clipping check**: count & % of samples with |x| ≥ 0.999.
  - **Mean RMS** (dBFS).
  - **Spectral centroid** (Hz), mean over frames (brightness).
  - **Onsets** (times) → **tempo** (BPM) from median inter-onset interval; onset detection via
    spectral-flux peak-picking.
  - **Detected pitch(es)** — monophonic f0 via autocorrelation or HPS → modal note; for chords,
    HPS / spectral peak-picking → top-3 peaks → nearest notes. Map Hz→note (A4=440, equal temp) +
    cents. Optional: a "scale" dropdown to flag in-scale / out-of-scale notes.

## Self-test panel (the de-risker — the tool is only trustworthy if these are green)
A **"Run self-tests"** button renders each built-in generator, runs the analyzers, and asserts
measured-vs-expected within tolerance — a **PASS/FAIL table**:
- 440 sine → pitch A4 (within ±30 cents), centroid 440 ±20%, 0 onsets, not clipping.
- 1000 sine → spectral peak 1000 ±3%.
- A-major triad → detected note set = {A4, C#5, E5}.
- 120 BPM clicks → tempo 120 ±3.
- clipped sine → clipping flagged (>1% clipped).
- white noise → centroid > 3 kHz; no stable pitch.
- chirp → 2nd-half centroid > 1st-half.
Tune the analyzers until **all pass**. Show each row green/red with measured vs expected.

## UI
Clean dark utilitarian panel (loosely workshop-styled, but a tool — clarity over flourish). Source
selector (a button per test signal + a file drop zone), a **Render & Analyze** action, the three
canvases stacked (waveform · spectrogram · RMS), the feature text panel, and the self-test panel.
Optional sample-rate / duration / FFT-size controls. For a test signal, show **expected vs measured**.

## Verification (self-verify in agent-browser, UNIQUE session `audiolens-build` — never default tab)
- Open `file://`. Click **Run self-tests** → screenshot the table; **all must be green** (fix analyzers until so).
- Render the **chirp** and the **triad** → screenshot the spectrogram; confirm it visually matches
  (rising diagonal / three horizontal lines).
- Confirm **zero console errors/warnings**.
- Report: self-test pass/fail (with measured numbers), screenshots, any analyzer you had to tune, line count.

## Deliverables
1. `tools/audio-lens/index.html` — the tool.
2. `tools/audio-lens/README.md` — short (what it is, the self-tests, how to drop a WAV, that it's offline/silent).
3. `tools/audio-lens/CHANGELOG.md` — build log.
