# The Sampling Theorem — CHANGELOG

A Workbench → Computation bench. **Below the Nyquist line f_s/2 a sampled signal is
carried *exactly*; above it, a masquerade** — an undersampled tone and its fold give
byte-for-byte identical samples, so the reconstruction provably rebuilds the *alias*,
never the source. Imports the Butterfly's radix-2 FFT to watch the line fold to the
wrong bin.

## v1 (cycle #27, 2026-06-14, Opus 4.8) — SHIPPED

### The claim, proven exact (in-page pill 7/7 · Node twin 14/14)
- **THE ONE LOCKED DECISION:** the source signal and the tone-sampler are
  **ZERO-PHASE COSINES** `a·cos(2πf·t)`. This is load-bearing, not cosmetic — cosine
  is EVEN, so `cos(2π(fs−f)·n/fs) = cos(2πf·n/fs)` at every integer n, making a tone
  and its alias sample **byte-exact (worst diff exactly 0)**. A SINE basis sign-flips
  the alias (worst diff 2) and breaks Claim B. Stated in the core's header.
- **A1 PERFECT RECONSTRUCTION** (the proof authority): a band-limited cosine sum,
  reconstructed by the **periodic Dirichlet kernel** at 503 dense off-grid t, matches
  the source to **5.06e-14**. The plain finite-window Whittaker–Shannon caps at ~1.46e0
  (the truncation); the Dirichlet (periodic-sinc) kernel removes it — that's WHY
  `reconstructPeriodic` is load-bearing for Leg A, not plain `reconstruct`. (Kernel
  is the EVEN-M form `sin(Mθ/2)/(M·tan(θ/2))` — the `tan` denominator, not `sin`.)
- **B1 ALIASING BYTE-EXACT** (strict `===`): cos@bin 200 and cos@bin 56 (=N−c) on an
  N=256 window sample STRICTLY equal — every `v===`, maxAbsDiff **exactly 0** (not
  ~1e-14), via the integer-cycle folded-cosine LUT (`half[k]=cos(2πk/N)`, fold the
  phase index). The strongest "indistinguishable."
- **B2 THE LIE IN FREQUENCY** (the imported fft): `spectrum(xTrue)` peaks at the
  FOLDED bin 56, NOT c=200 — the line at the WRONG frequency. The required
  imported-transform leg.
- **B3 foldedFreq names the alias**: `foldedFreq(f,fs) === (N−c)·fs/N` to 0.00e+0.
- **C POSITIVE CONTROL**: below Nyquist every spectral line at its true bin, ~0
  energy above the top line, reconstruction 3.95e-14. "The picture does not lie."
- **D NEGATIVE CONTROL (honest)**: the reconstruction of the undersampled tone
  DIFFERS from the true source (1.99) but reproduces the ALIAS source (2.29e-13) — it
  provably rebuilds the GHOST. Green = "the masquerade is exact," NOT "recon works."
- **E SINGLE-SOURCE / RADIX-2 CONTRACT**: fft/toComplex/isPow2 are IMPORTED from
  `../butterfly/core.mjs`; a length-100 (non-pow-2) fft THROWS the power-of-two error.
- **VISUAL leg** (in-page console): render-vs-core drift **0.00e+0** (the drawn
  reconstruction IS `core.reconstruct`), ghost-through-teeth **1.19e-14** (the ghost
  passes through every comb tooth — the visible coincidence is real).

### Architecture — single source / anti-circularity
- `sampling-core.mjs` is the **SOLE math authority** (sinc / foldedFreq / aliasOf /
  sampleTone / sourceValue / reconstruct / reconstructPeriodic / sampleToneLUT /
  spectrum / runSelfTest / N_DEFAULT=256). The sinc & folding digit-math live ONLY
  here. The TRANSFORM is **imported** from `butterfly/core.mjs` — the core never
  re-types an FFT and never references `dft` (Node-twin grep asserts it).
- The page inlines two **byte-twin** blocks between sentinels: the SAMPLING CORE
  (13734 chars === the module) and the BUTTERFLY CORE (16603 chars === the SAME slice
  `butterfly/index.html` inlines, so "the page's fft IS the Butterfly's fft" is real).
  Node twin re-extracts both and asserts char-identical.
- `N=256` is the SINGLE power of two for the whole bench. Visual presets are
  **coherent** (f·N/fs ∈ ℤ ⇒ one clean stem): clean (fs=16, bins 32/80), wagon
  (fs=8, bin 160 → alias 3 Hz), exact-alias (fs=8, bin 224 → alias 1 Hz). Free-drag
  breaks coherence ⇒ a light Hann window tames leakage; the readout NAMES the active
  mode (coherent ↔ Hann) so the picture never lies.

### The page (two-panel viz on butterfly house chrome)
- TIME panel: faint sinc kernel lobes (toggle) · teal source · gold sample comb
  (FIXED in t — never moves when only the reconstruction changes) · green sinc
  reconstruction (below Nyquist lies on teal; above, peels off to the ghost) · red
  dashed ghost alias through every comb dot. Fold-pulse on the Nyquist crossing.
- FREQ panel (the imported fft): one-sided |X[k]| 0…fs/2, violet Nyquist mirror,
  teal true-line tick (or a pinned arrow when f > fs/2), the ghost stem RED at the
  folded bin while every true below-Nyquist line stays teal. Readout strip names
  f / fs / fs/2 → f_alias and the active windowing mode.
- ONE boolean `isAliasing()` (the foldedFreq PREDICATE f_max < fs/2, NOT a recon-error
  threshold) drives the status pill text + curve colour + spectrum label, so they
  cannot disagree.
- The lede's tolerance `#ledeTol` is fed the LIVE Leg-A maxAbsErr at runtime
  (~5.1e-14), never the bare word "perfect."

### Audio (SHIPPED, muted-by-default, raw-Hz path)
- Two buttons voice a FIXED audible pair: **true 900 Hz** and **"what the samples
  carry" 500 Hz** (= `foldedFreq(900, 1400)`). The visual presets are sub-audible, so
  the ear-proof uses its own clear tones. Honours the estate-wide `ws:pref:muted` key
  (read on load, written on toggle, cross-tab storage listener); first sound waits for
  a click. Self-test is AUDIO-INDEPENDENT (no AudioContext in the Node twin).
- **AUDIO-LENS VERIFIED** (build turn): the rendered 500-Hz alias buffer reads as
  **B4 +21c (500 Hz)** through the audio-lens skill — the ear hears the GHOST, not the
  true 900 Hz (which reads A5, 900 Hz). The one thing the eye-proof can't deliver.
- The **raw-Hz** path was chosen over the Carillon's `semiToFreq` quantization (500 Hz
  reads clearer than snapping to a piano note). Per the design's package rule, the
  Carillon xteaser + pitch-core import + a Carillon-specific sidebar section were ALL
  dropped (they ship together or not at all). The two xteasers that remain are The
  Butterfly (the transform) and The Butterfly's Voice (leakage vs aliasing).

### ⚠️ HONESTY GUARDRAIL — PROTECT THIS (publisher fresh-eyes pass)
The cross to **The Butterfly's Voice** names **leakage ≠ aliasing**: the Voice runs
at fs=48000 with notes far below the 24 kHz Nyquist — it shows **leakage (a smear)**,
NOT folding. This bench shows **aliasing (a fold)**. They are sibling consequences of
one sampling ceiling — *"leakage = smear, aliasing = fold, two faces of one ceiling."*
**Do NOT let any later "simplify" rewrite this into "the Voice shows aliasing"** — that
is the exact over-claim this whole bench refuses. The distinction is load-bearing.

### Registration (5 surfaces + 1 import, all resolve 200)
- Workbench → Computation card (glyph 📶, after The Butterfly's Voice so Butterfly →
  Voice → Sampling sit together; house pattern: div.card + ONE overlay card-link, 0
  nested anchors in the blurb).
- Reciprocal crosses: `↔ the ceiling` .back on **The Butterfly**; a third forward
  xteaser "why the teeth bite →" on **The Butterfly's Voice**.
- The bench imports `fft/toComplex/isPow2` from `butterfly/core.mjs`.

### Verification (browser-live, agent-browser session `sampling-build-cyc27`)
- in-page pill GREEN 7/7 · Node twin 14/14 (incl. a 127-bin alias sweep, a 127-bin
  reconstruct sweep, anti-circularity grep, 2 byte-twin parity checks).
- ~62 fps on a continuous fs-slider drag across the full range · 0 console errors ·
  0 nested anchors · 0 horizontal overflow @1280 AND @390.
- The fold moment driven across the Nyquist line (status flips EXACT ↔ ALIASING; the
  spectrum line reflects to the folded bin).
- `ws:pref:muted` honored across all 3 states (absent → off; "Sound on" writes '0';
  cross-tab '1' forces off) · audio-lens-confirmed the alias pitch (500 Hz).
- `forge --check --all` 30/30 (butterfly family is hand-written — no `.src.html`
  touched; the workbench card edit is a plain edit).
