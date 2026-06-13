# Harmonograph — changelog

## v1.0 — first build

A genuine Victorian **harmonograph** as an interactive workshop bench — the curve/parametric sibling
to **Ripple** (waves) and **Caustic** (rays).

- **Model.** Lateral + rotary rig: **two decaying pendulums per axis** (4 total). Pen position is the
  pure parametric sum `x(t)=Σ Aᵢ·sin(2π·fᵢ·t+φᵢ)·e^(−dᵢ·t)` (same for y). A `config` is
  `{ x:[term,term], y:[term,term] }`, a `term` is `{ f, A, phase, d }`. Near-integer frequency ratios
  with a tiny detune give the slowly-precessing petals; damping spirals the figure inward and lets it
  die.
- **Live drawing.** The pen traces over time (rAF) onto an accumulating offscreen ink canvas;
  Pause/Play, ↻ Again (redraw from t=0), and a draw-speed slider. Glowing pen dot at the live point;
  the ink colour shifts along the trace.
- **Controls.** Per-pendulum frequency / amplitude / phase / damping sliders (X·1, X·2, Y·1, Y·2); a
  live x:y ratio tag; a seed box + "Surprise me" (reproducible random figures); six named presets
  (Unison 1:1, Fifth 2:3, Octave 1:2, Fourth 3:4, Major 4:5, Sirens 5:6).
- **Three skins** (ink-on-paper / blueprint / phosphor) recolour ONLY — geometry is identical across
  skins (proven). 2× PNG export, canvas-native.
- **Self-test (5/5).** Headless `runSelfTest()` calls the SHIPPED CORE and asserts: (1) fidelity —
  `penPos()` equals a hand-rolled parametric Σ to <1e-9; (2) damping envelope non-increasing for d>0,
  exactly constant for d=0; (3) **closed-curve law** — integer-ratio frequencies with zero detune &
  zero damping return to the start (position AND velocity) at `t = period = T0/gcd(kᵢ)` to <1e-9,
  with a guard that a non-period time is NOT closed; (4) seed reproducibility (byte-identical
  fingerprint) & skin-invariance (identical geometry across the 3 skins). Topbar badge
  `harmonograph verified — N/N ✓`; full log in the badge tooltip + console.
- House conventions: ← workshop back-link, frosted control panel, brass accent, `prefers-reduced-motion`
  respected (starts paused), `ws:seen:harmonograph` breadcrumb (additive, try/catch-wrapped).
- Registered on the workbench in the **Toys & benches** group (glyph ✺) next to Caustic & Ripple.
