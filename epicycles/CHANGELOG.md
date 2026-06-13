# Fourier Epicycles — Changelog

## v1 (2026-06-13)

**What it is.** A Fourier epicycle drawing machine: any closed curve is the sum of
rotating vectors (circles riding on circles), one per frequency. A genuine complex
**DFT** (computed here — no FFT library) turns the sampled path into those vectors;
chained tip-to-tail and ordered by amplitude, they re-trace the curve with a gold pen,
leaving the drawn path faintly behind. A slider for **N** (1 … M): at N=1 it's one
circle (a wobbly ellipse), and as N rises the reconstruction snaps onto the exact curve.

**The math (real, not faked).**
- M = 256 complex samples `z[m] = x[m] + i·y[m]`.
- Forward DFT: `c[k] = (1/M) Σ_m z[m]·e^(−2πi·km/M)`.
- Signed frequency ordering `0, +1, −1, +2, −2, …`; epicycle terms then sorted by
  amplitude descending, so the top-N partial sum is the best N-term approximation.
- Pen at continuous time t∈[0,1): `pen(t) = Σ_k c[k]·e^(2πi·k·t)`. At t=m/M it
  reproduces `z[m]` exactly.

**Features.**
- 6 presets (Star, Heart, Treble, Letter A, Gear, Infinity) plus **freehand mouse-draw**
  (resampled by arc length to M points, loop closed).
- N slider, speed, play/pause, restart, show-toggles (circles / target path / pen trace).
- 3 cosmetic skins: Midnight, Blueprint, Ember.
- `prefers-reduced-motion`: no auto-rotation — draws the full reconstructed curve statically.
- `localStorage('ws:seen:epicycles','1')`. No `ws:flag:*` feats.

**Self-test (6/6 PASS — verified headlessly in Node and in-browser).**
- round-trip `idft(dft(z)) == z`: max err **2.20e-12**
- full reconstruction (Σ all M epicycles via the rotating-vector model at t=m/M): max err **1.14e-12**
- convergence (top-N RMS, monotonically ↓, → 0 at N=M): N=1 **74.7**, N=8 **59.5**, N=32 **30.3**, N=M **9.92e-13**
- Parseval `Σ|z|²/M == Σ|c|²` (independent identity): rel err **3.39e-15**
- determinism: identical path → bit-identical coefficients & ordering; perturbed differs
- falsifiable: amplitude ordering strictly beats bin ordering for top-N; dropping a term
  raises the N=M−1 error from ~1e-12 to ~0.5 (exactness breaks)

Single self-contained HTML file, vanilla JS, no build/libraries/network/assets.
