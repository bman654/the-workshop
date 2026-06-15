# The Butterfly's Voice — CHANGELOG

A Workbench → Computation bench (a `[cross]`: **The Butterfly × the Sound Garden**).
The claim: **a note's pitch IS the exact FFT bin its spectrum peaks in.**

## v1 — 2026-06-14 (BUILD cycle #26)

**The one idea.** Pick a note. The pitch that *names* it — `semiToFreq(s)`, the same
function that voices the Carillon's bells — predicts the integer bin `c` where the
imported radix-2 FFT *places* its peak. Under coherent sampling the spectral line
lands in ONE bin: `k_measured = k_predicted = c`, exactly, and `k·Δf` recovers the
note's true frequency `f = semiToFreq(s)` to machine precision. Synthesis and
transform agree on ONE number, a note's pitch.

**The load-bearing math — DERIVE fs (Approach B).** Fix `N = 4096` (a power of two,
the butterfly's radix-2 requirement). For a semitone `s`: `f = semiToFreq(s)`; pick
the integer cycle-count `c = round(f·N/fsRef)` with `fsRef = 48000`; then DERIVE the
sample rate `fs = f·N/c` so that EXACTLY `c` whole cycles fit the N-sample window.
Synthesise the pure tone at the TRUE `f`: `buf[n] = cos(2π·f·n/fs)`. Because `c` whole
cycles fit the window, the tone IS a DFT basis vector at bin `c` — so `k_measured == c`
is machine-exact AND `k·Δf` recovers the true `f` to `0.00e+0`. Both legs machine-exact,
no honest residual. This BEATS a fixed `fs = N` (the obvious choice), which leaves a
~10.8-cent tuning residual because the cycles don't close (proved in the Node twin).

**Playable range.** `2 ≤ c ≤ N/2−2` ⇒ `s ∈ [−24, +24]` (two octaves about middle C)
⇒ `c ∈ [6, 89]`, 49 notes. `PLAYABLE` is computed from the bound (not hard-coded) and
the keyboard exposes exactly those semitones.

**The teeth (the visitor-operated negative control).** Flip to **device-rate**: pin
`fs = 48000` instead of deriving it. Now `c = f·N/fs` is non-integer, the cycles don't
close, the line LEAKS across bins, the peak is only the NEAREST bin, and `k·Δf`
recovers `f` to `±Δf/2`, not exactly. The air-trap analogue of the Rydberg bench.

**Single-source discipline.**
- STEP 0 extracted `sound-garden/pitch-core.mjs` — the SOLE authority for the pitch
  law (`MIDDLE_C_HZ = 261.625565`, `semiToFreq`, `noteName`), byte-twin sentinelled.
  (The six instruments are NOT retrofitted — out of scope; this module is the
  authority the bench imports.)
- `voice-core.mjs` IMPORTS `semiToFreq`/`noteName` from `pitch-core.mjs` (the
  GENERATOR) and `fft`/`toComplex`/`isPow2` from `butterfly/core.mjs` (the TRANSFORM).
- The page inlines THREE byte-twins between sentinels (PITCH CORE · BUTTERFLY CORE ·
  VOICE CORE); the Node twin re-extracts each and asserts char-for-char identity.
- Anti-circularity grep: the pitch law's digit-literals (`261.625565`, `1.05946…`)
  appear ONLY in `pitch-core.mjs` — never in `voice-core.mjs`.

**The self-test (`runSelfTest`, the sole oracle — in-page pill + Node twin both call it).**
- **LEG A** (exact bin): every `s∈PLAYABLE`, `k_measured === c` (strict integer, 0 tol).
- **LEG B** (exact pitch): worst `|k·Δf − f| < 1e-9` (= `0.00e+0`) — the leg a fixed
  `fs=N` could NOT make exact; Approach B can.
- **LEG C** (clean spike): second-largest bin ≥ 40 dB below peak (one tower) —
  measured `−280.8 dB`.
- **LEG D** (teeth-1): `fft(toComplex(1000 zeros))` THROWS the radix-2 error.
- **LEG E** (teeth-2 / device-rate): non-integer `c`, leakage `2nd/peak = 0.487 > 0.1`,
  recovery within `±Δf/2` (off 3.81 Hz ≤ 5.86 Hz) — green = "leakage as predicted."
- **LEG F** (single-source): `semiToFreq` and `fft` are both imported functions.

**Layout (rydberg two-canvas + 44px conduit spine).** LEFT `#scoreHost`: a one-octave-
plus keyboard strip over `PLAYABLE` (picked key gilds) + the synthesised waveform with
the gilt period-comb at `i = j·(N−1)/c` (last tick flush on the right edge — "c cycles ·
window closes flush"; in device mode it visibly does NOT close). CONDUIT: one bright
bezier light-pipe from the waveform's right edge to the measured peak bar (the sound
becoming the number). RIGHT `#spectrumHost`: `|X[k]|` magnitude bars zoomed to `k∈[0,2c]`,
the gilt ghost-tick at `k_pred=c` drawn FIRST under the bars (prediction pre-committed),
the lone tall gilt measured peak landing ON it, a gilt agreement-ring where they meet;
dual frequency axis (bin `k` + `k·Δf` Hz) with collision-walk thinning. The dual head:
note · `f=semiToFreq` Hz · `c=predicted bin` ──── measured `k=c ✓ EXACT` · recovered
`k·Δf` Hz (== f).

**Interaction.** Control 1 = pick the note (keyboard / arrow keys). Control 2 = the
TEETH seg-toggle [Coherent | Device-rate (48kHz)]. Control 3 = N stepper {1024, 4096,
16384}. One shared state, one rAF, one resize handler.

**Audio.** Web Audio, `osc.type='sine'`, `freq = f` — the SAME pure buffer the FFT
analyses (what you HEAR == what the transform measures). MUTED BY DEFAULT honouring the
canonical estate key `ws:pref:muted` (the bench JOINS galton/harmonograph/extent/… via
that key — it does not invent a per-page pref). First sound waits for a user gesture
(`AudioContext.resume`). The self-test is AUDIO-INDEPENDENT (runs on the number buffer,
headless). Audio-Lens-verified: the s=0 tone is C4 (261.6 Hz), in-tune, not clipping,
not silent.

**Cross-cards (reciprocal).** In-bench: ← The Butterfly (the transform) · ← The Carillon
(the voice). On `butterfly/index.html`: a `↔ the voice` back-link. On
`sound-garden/carillon.html`: a `↔ a bell's pitch IS its FFT bin` cross-note. On
`sound-garden/index.html`: a one-line footer link. On the Workbench Computation group:
the card after The Butterfly.

**Verification.** In-page pill GREEN 6/6 · Node twin 17/17 · `node tools/forge/forge.mjs
--check --all` 30/30 (no `.src.html` touched — butterfly/workbench/sound-garden are plain
edits). Browser-verified: 0 console errors, 0 horizontal overflow @1280 & @390, 0 nested
anchors, ~60fps.

**Files.** `index.html` (~1298 lines, three inlined byte-twin cores + render) ·
`voice-core.mjs` (the bench core) · `voice-core.test.mjs` (the Node twin) ·
`../sound-garden/pitch-core.mjs` (the extracted pitch authority, STEP 0).
