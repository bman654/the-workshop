# ✺ Harmonograph — build spec

*A genuine **harmonograph** — the Victorian pendulum drawing-machine — as an interactive bench in the
workshop's "Toys & benches" wing, alongside **Caustic** (geometric optics) and **Ripple** (wave
interference). Two decaying pendulums per axis move a pen; their combined swing traces the
characteristic looping Lissajous-into-spiral figures that slowly decay to the centre and die. Watch
the pen draw live, dial each pendulum, roll a reproducible figure from a seed, recolour with three
skins. The workshop's signature: a built-in self-test that **proves** the painted curve never drifts
from the parametric math.*

Folder: `harmonograph/`. One self-contained file: `harmonograph/index.html` (no build, no network, no
deps, **NO audio**). Build log: `harmonograph/CHANGELOG.md`.

> Sibling to **Ripple** (waves) and **Caustic** (rays): all three are *physics drawing instruments*.
> Harmonograph is the **curve** branch — parametric pen motion, the maths of beats and Lissajous
> figures rendered as ink. Not a puzzle, not a game: an instrument you tune and watch.

---

## §0 — The model (parametric, decaying-pendulum sum)

The pen position is the **linear superposition of decaying sinusoids** — closed-form, evaluated per
sample (no ODE solver, no stability issues, trivially provable). The classic "lateral + rotary" rig
uses **two pendulums per axis** (4 total). For each axis the value is

```
x(t) = Σ_i  Ai · sin(2π·fi·t + φi) · e^(−di·t)
y(t) = Σ_j  Aj · sin(2π·fj·t + φj) · e^(−dj·t)
```

A `config` is `{ x:[term,term], y:[term,term] }` and a `term` is `{ f, A, phase, d }`:
`f` = frequency (cycles per time unit), `A` = amplitude, `phase` = φ (radians), `d` = damping rate.

- **Near-integer frequency ratios** (1:1, 2:3, 3:4, 5:4, 5:6…) with a **tiny detune** (a hair off the
  exact ratio) produce the slowly-precessing petals/webs — the figure "breathes" as the components
  drift out of and back into phase.
- **Damping `d > 0`** multiplies each term by `e^(−d·t)`, so the envelope spirals inward and the
  figure decays to the centre and dies — exactly as a real harmonograph runs down.
- The renderer **samples `penPos(config, t)`** at a fixed dense step and strokes the polyline; the
  curve it paints *is* the parametric equation at sampled `t` (this is the fidelity the self-test
  guarantees — the renderer never keeps a separate copy of the math).

---

## §1 — The correctness crux (the workshop promise)

A pure `CORE` (no DOM, no skin, no render): `termValue`, `axisValue`, `penPos`, `axisEnvelope`, the
rational-period helpers (`gcdInt`/`lcmInt`/`gcdOfList`), `configFromSeed`, `pathFingerprint`. The
renderer and a headless `runSelfTest()` call the **same** CORE. The self-test proves:

1. **Fidelity.** `penPos()` equals an independent hand-rolled `Σ Ai·sin(2π·fi·t+φi)·e^(−di·t)` to
   `< 1e-9` over hundreds of random configs/times. The painted path is the equation.

2. **Damping envelope.** The per-term envelope `Σ|Ai|·e^(−di·t)` (which bounds `|axisValue|` since
   `|sin| ≤ 1`) is **monotonically non-increasing** in `t` when every `d > 0`, and **exactly
   constant** when `d = 0`. Asserted by sweeping `t`.

3. **Closed-curve law.** This is the deep gate. With **integer cycle counts `kᵢ`** over a base period
   `T0`, every component has period `T0/kᵢ`, so the combined motion's fundamental period is the **LCM
   of the component periods**, which equals `T = T0 / gcd(kᵢ)`. With **zero detune & zero damping**,
   the pen must return to its start at `t + T` — verified for both **position and velocity** (a smooth
   closed loop, not a mere point coincidence) to `< 1e-9`, across several classic ratios. A guard
   asserts that a **non-period** time (`T/3`) is *not* closed — so the test can't trivially pass.

4. **Seed reproducibility & skin-invariance.** The same integer seed yields a **byte-identical**
   figure (identical sampled-polyline fingerprint); a different seed differs (guards a constant hash).
   The CORE takes **no skin argument at all**, so the three skins produce *identical geometry* — the
   fingerprint is invariant across skins by construction, asserted explicitly.

`runSelfTest()` runs on load → topbar badge `harmonograph verified — N/N ✓` (green) / red on any
failure; the full PASS/FAIL log is the badge's `title` tooltip and is `console.log`ged. **Checks #1
and #3 are the non-negotiable gates.**

> **Why the closed-curve maths is exact, not approximate.** Frequencies are stored as floating-point,
> but the closed-curve test *constructs* the configs from exact integer cycle counts `kᵢ` and computes
> the period as `T0/gcd(kᵢ)`. `sin(2π·k·(t+T) + φ) = sin(2π·k·t + 2π·k·T + φ)` and `k·T = k/gcd` is an
> integer, so each term repeats exactly (to floating-point round-off, well under `1e-9`). The live
> presets add a deliberate ~0.01 detune so the on-screen figure *slowly precesses* rather than closing
> instantly — the closed-curve law is the idealised limit the detuned figure orbits.

---

## §2 — What the user can do (controls & behaviour)

- **Live drawing.** The pen traces over time (requestAnimationFrame) so you *watch* the figure emerge
  and decay; **Pause/Play** and **↻ Again** (redraw from `t=0`). A **draw-speed** slider.
- **Per-pendulum controls.** Four pendulums (X·1, X·2, Y·1, Y·2), each with **frequency / amplitude /
  phase / damping** sliders. Editing any of them redraws from the start. A small **x:y ratio** tag
  shows the dominant near-integer ratio.
- **Seed + Surprise me.** Type an integer seed for a reproducible figure, or roll a random one. Same
  seed → identical figure, always.
- **Presets** (named classic ratios): **Unison 1:1**, **Fifth 2:3**, **Octave 1:2**, **Fourth 3:4**,
  **Major 4:5**, **Sirens 5:6**.
- **Skins** (§4), **Export 2× PNG** (§5). Respects `prefers-reduced-motion` (starts paused, fully
  interactive; the figure draws when you press Play).

---

## §3 — Layout & visual design

A dark, elegant drawing bench in the workshop house style (serif headings, mono labels, frosted
control panel, brass `#c9a24a` accents, `--bg:#080a0f`). Fixed-viewport, no scroll: a full-bleed
`<canvas>` "paper" on the left, a frosted control panel on the right. The trace accumulates on an
offscreen ink canvas (so the figure builds up), composited over the paper each frame with a glowing
pen dot at the live position. The ink colour shifts subtly along the trace's length (a sense of the
pen ageing). PNG export is canvas-native (no `foreignObject` taint).

---

## §4 — Skins (cosmetic only — 3)

Three skins switched by a `data-skin` segment; **skins change only the paper/ink colours — never the
geometry.** The CORE is skin-blind; the self-test asserts the geometry fingerprint is identical across
all three (§1.4).
- **`ink`** (default) — ink-on-paper: warm cream paper, sepia→faded-crimson trace (the Victorian look).
- **`blueprint`** — pale cyan lines on navy (the workshop house blueprint skin).
- **`phosphor`** — green→cyan glow on near-black (an oscilloscope / CRT look).

---

## §5 — Conventions (matches Ripple & Volvelle)

- **Self-contained:** one `index.html`, inline `<style>`+`<script>`, no network/libs, NO audio.
- **Back-link** (topbar, top-left): `<a class="back" href="../index.html">&larr; workshop</a>`.
- **Self-test badge** (topbar, right): on load run `runSelfTest()`, set `.ok`/`.bad` + text
  `harmonograph verified — N/N ✓`; full log in the badge tooltip; `console.log` the result.
- **ws: breadcrumb** (end of script, additive, try/catch-wrapped):
  `try{ var k='ws:seen:harmonograph'; if(!localStorage.getItem(k)) localStorage.setItem(k,String(Date.now())); }catch(e){}`
- **PNG export:** a primary "Export 2× PNG" button → `harmonograph-<skin>.png`, canvas-native at 2×.
- **Workbench card:** an `<a class="card">` in the **Toys & benches** group (next to Caustic & Ripple),
  glyph ✺, name "Harmonograph", kind "pendulum drawing machine".

---

## §6 — Verification (before committing)

Verify the **shipped in-page CORE** headlessly first (extract the `<script>` CORE, run `runSelfTest()`
under Node) — all of §1 green — then in a real browser (a uniquely-named agent-browser session)
confirm: badge green N/N; the figure draws live and is beautiful; all three skins render with
identical geometry; seed repro works (same seed → same figure); a preset and Surprise-me both work;
PNG export downloads; **zero console errors**. `file://` is fine (no cross-page storage needed).
Screenshot the piece + the passing badge. Append a `CHANGELOG.md` entry and `git commit` (do NOT push).
