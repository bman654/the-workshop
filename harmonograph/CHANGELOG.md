# Harmonograph — changelog

## v1.1 — "Hear the figure" (the Sound Garden crossing) — 2026-06-13

The bloomed `Harmonograph × Sound Garden` cross: **the same ratio you SEE you can now HEAR.**

- **Audio mapping (pure, self-tested CORE).** Three DOM-free, Web-Audio-free functions added beside the
  pen math: `intervalFromRatio(fx,fy)` (the figure's fundamental fy/fx → the reduced small-integer
  interval p:q — 2:3 a fifth, 1:2 an octave), `voiceFreqs(fx,fy,base)` (the two audible voice
  frequencies: x = A3 220 Hz, y = base · the RAW fy/fx **folded into ~[1,2]** so it stays in one
  comfortable octave **but keeps the detune** → beats survive), and `masterGainFor(n,amp,ceiling)`
  (a headroom-safe master gain that can never let the summed peak clip). Exported on
  `HarmonographCore` for headless re-audit.
- **Web Audio voicing.** A lazily-built graph (created only inside a user gesture → autoplay-safe): two
  oscillators (x = warm triangle, y = pure sine) → per-voice gain → master gain → a gentle compressor →
  destination. The master fades up/down smoothly; changing a preset/seed **glides** the y-voice to the
  new pitch (`setTargetAtTime`) so you hear the interval slur between figures. The tiny visual detune
  that makes the petals breathe becomes a slow audible **beat** — the whole poetic point of the cross.
- **♪ Listen toggle + the estate-wide mute.** A new Motion-row button voices the live figure; an
  interval readout beside it names what you hear ("2:3 · perfect fifth"). Mute is the **shared
  `ws:pref:muted`** key (read on load, written on toggle, and listened for via the `storage` event), so
  one mute governs the whole workshop — a muted visitor's Listen click unmutes *and* plays. Honors the
  autoplay gate (silent until the gesture).
- **Self-test 5/5 → 9/9.** Four audio checks added, all calling the shipped CORE: (5) interval recovery
  (10 clean ratios reduce to the expected heard p:q); (6) voice folding (voice ratio == folded fy/fx,
  inside ~[1,2]); (7) detune → a small nonzero beat; (8) no-clip headroom (2 voices · amp · masterGain
  ≤ 0.9). Browser-verified on a served origin: badge 9/9, console clean across Listen/Surprise/preset
  switches, mute-on-reload respected, unmute-on-Listen works.

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
