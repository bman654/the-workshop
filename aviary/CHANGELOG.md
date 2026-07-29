# The Aviary — changelog

## 2026-07-29 · founded

A wood twenty minutes before sunrise, six birds on three boughs, and one
two-variable dynamical system underneath every note in it.

### What it is

A songbird has no larynx; it has a **syrinx** at the fork of the windpipe, and
it has **two of them**, one on each bronchus, worked by separate muscles. Each
is a pair of soft labia the bird pushes air past. This room runs the
low-dimensional model from the birdsong-physics literature, in a time
nondimensionalised by the labial rate constant γ:

```
dx/dτ = u
du/dτ = −α − βx − x³ + x² − (x² + x)u
```

α is air-sac pressure, β is labial tension, γ is only the clock. So **a song is
a curve in a plane**, and the plane is the instrument: drag in it and the wood
sings what you drew, live, and keeps it as a loop when you let go.

### The claims, and how they are tested

Equilibria satisfy `x³ − x² + βx + α = 0`; the Jacobian trace is `−(x² + x)` and
the determinant `β + 3x² − 2x`. Three boundaries fall straight out:

| | derivation | what it means |
|---|---|---|
| **Hopf line** | trace 0 at x = 0 ⇒ α = 0 | nothing can sound left of it; eigenvalues ±i√β |
| **the fold** | double root: β = 2x−3x², α = 2x³−x², x ∈ [½,⅔] | right of it no quiet state exists, so it *must* sing |
| **the roof** | trace 0 at x = −1 ⇒ α = β + 2 | the labia are held open; silence again |
| **pitch** | Im λ at the Hopf | `f = γ√β / 2π`, a THRESHOLD claim only |

Three independent checks, at three removes from the algebra:

1. **`core.test.mjs`** (Node twin, 26 assertions, green). Bisects the sounding
   boundary out of the integrated waveform: below β = 0.12 the measured onset
   **is** the fold to ~1e-5 in α; nothing sounds at or below α = 0; the roof
   lands on β + 2; the born pitch is within **0.53 %** across the register;
   35/35 points inside the must-sing region sound. Also: shutting one syrinx
   removes its own predicted pitch from the spectrum by **147 dB** while the
   other line does not move. `--wav` writes the ear-check renders.
2. **`prove.js`** (in-page Web Worker). The same measurement, drawn as dots on
   the predicted curves. ~1.4 s on this machine.
3. **the ear** (in-page, the strongest one). The page hushes the wood, holds its
   own AudioWorklet at six tensions just above the Hopf line, and puts an
   `AnalyserNode` **on its own output** — the signal the speakers get. Measured
   on 2026-07-29: 0.05 / 0.54 / 0.49 / 0.36 / 0.25 / 0.14 % error at
   2.0–5.2 kHz; rms exactly 0 at α = −0.05; and at β = 0.1029 (fold at
   α = 0.0823) rms 8.6e-15 under it and 2.4e-2 over it. **The fold is audible.**

### Honest limits, stated on the page

* The pitch formula holds **at threshold only**. Push α up and the limit cycle
  grows, the oscillation stops being sinusoidal, and the note runs sharp — 2 %
  at α = 0.05, 25 % at α = 0.20, ~½ an octave by α = 0.5 (measured). That is
  why the birds sing at α ≈ 0.04–0.15, and it is why the first draft of the
  songs did not descend when they were written to descend.
* Above β = ¼ the note is born at the Hopf; below it, on the fold, with a
  finite amplitude — so the eigenvalue is not its pitch down there.
* The six birds are **not identifications**. Nothing was fitted to a field
  tape. They are six curves a hand drew in two numbers, named for the shape
  they make.

### Files

| | |
|---|---|
| `core.mjs` | the syrinx, the trachea, the algebra, the measurement. Pure, DOM-free, **no backtick anywhere** (it is handed to the worklet inside a `String.raw`). |
| `song.mjs` | the six birds, authored as `[t, pressure, HERTZ]` and converted to tension at pack time by inverting the room's own claim. |
| `worklet.js` | the audio-thread tail: N singers × 2 syringes × 14 RK4 substeps per output sample, one trachea each, a small Schroeder wood. |
| `prove.js` | the measurement worker's tail. |
| `render.js` | the wood: recursive generalised-cylinder trees from a seeded PRNG, a lathed bird, an analytic dawn, bloom + screen-space god rays. |
| `score.js` | the plane, drawn. Vertical axis is **√β**, which makes it linear in hertz. |
| `core.test.mjs` | the Node twin. `node aviary/core.test.mjs [--wav]` |

### Things that cost a cycle (both now in LANDMINES.md)

* **An AnalyserNode with no path to the destination returns garbage.** Connected
  only to a source, `getFloatTimeDomainData` handed back a stale buffer that
  read a plausible 0.05 rms for *everything*, including a muted graph. Give it
  a sink (`analyser → gain(0.00001) → destination`) or it lies.
* **A CPU shortcut that skips "silent" voices silenced a real band.** The
  worklet skipped integration when `α < A_MIN_SING (0.004)` — which is exactly
  the pressure the pitch claim is measured at, so every note quieter than that
  was mute. The only pressure at which the model *provably* cannot sound is at
  or below the Hopf line, so that is where the shortcut is allowed to skip.
  Found only by putting a spectrum analyser on the live worklet.
