# The Spiral Ear — CHANGELOG

## 2026-07-30 — built

The Music Room had thirty-six pieces about *making* a sound and not one about the
thing that receives it. `cochlea`, `basilar`, `tonotopic`, `Békésy`, `Greenwood`,
`critical band`, `hair cell` — every one of them returned nothing across 476
pieces. So this is the receiver.

**What it is.** Thirty-five millimetres of membrane, wound two and a half times
round a cone, with water on both faces. A rail along the bottom you drag a tone
along; the travelling wave crawls up the shell to the one place that answers it.
A slider that lays the shell out straight so you can put a ruler on it. A tap and
two sweeps. And a switch that takes the water away.

### The three numbers typed in

A stiffness that falls by a factor of e every 2.5 mm, a mass per unit area that
does not change, and a damping ratio that does not change. Nothing else about
hearing appears anywhere in `cochlea.mjs`.

### What comes out — `node cochlea.test.mjs`, 14 legs, green

| | |
|---|---|
| **an octave is a distance** | 3.5120 mm, and five successive octaves measured off the peaks agree to **0.008 %** |
| **the peak is not at the matching place** | 1.595 mm basal of it, at every frequency, to one part in ten thousand — the model is exactly scale-invariant, so the offset has to be constant, and it is |
| **the cliff** | past its own place a tone dies at `sqrt(2 rho / H M)` = **65.66 dB/mm**, a closed form with **no frequency in it**; measured at 250, 1000 and 4000 Hz it agrees to four figures *at every distance out*, and reaches 1.0000 by 14 mm |
| **so the shadow only falls upward** | 400 Hz reaches the place that belongs to 1600 Hz 15.3 dB down; 1600 Hz reaches the place that belongs to 400 Hz **552 dB** down |
| **take the water away** | flanks symmetric to 1.00 : 1, wave cycles 4.61 → 0.25, peak lands within 0.013 mm of resonance, and the delay that survives is 3.1814 ms against `1/(zeta omega)` = 3.1831 — one resonator ringing up, not travel |
| **the delay** | 52 ms at 125 Hz to 0.38 ms at 8 kHz, 140 : 1, about six cycles of the tone until the peak runs out of membrane to have travelled over |
| **two solvers** | a tridiagonal solve per frequency plus an inverse FFT, against symplectic time-stepping of the same equations: correlation 0.999869, error halving on every refinement |
| **two sounds a spectrum analyser cannot tell apart** | a rising sweep and the same file backwards — magnitude spectra 6e-14 apart, energies 4e-15 apart, total energy delivered to the membrane identical to 2e-14 — and the peak response **2.15×** apart (the room, on its finer grid, measures 2.32) |
| **a tap becomes a glide** | the 500 / 1000 / 2000 / 4000 Hz places answer in order, each within the group delay, a falling whistle 10 ms long |
| **energy** | power in at the stapes equals power dissipated along all 35 mm to 2e-14 |
| **the shell** | arc length identical to five decimals at every stage of the unrolling, and the membrane never tips more than 0.83° out of horizontal |

### Things that cost a cycle, and what they taught

- **A tidy frame was the wrong frame.** A rotation-minimising (twist-free) frame is
  the obvious way to carry a ribbon along a curve, and over two and a half turns it
  precesses far enough to stand the membrane on its edge — the shell came out as a
  coiled *wall*, not a coiled ramp. The fix is to pin the frame to the horizontal
  radial direction and store the twist that costs as a third curvature number, so
  the unrolling still zeroes everything and still preserves arc length exactly.
- **A curvature record built from mismatched spans halves every curvature.** The
  tangent was a central difference over 2·ds and the curvature a forward difference
  over ds, divided by 2·ds. A two-and-a-half-turn cochlea unrolled into a turn and a
  quarter and looked perfectly plausible.
- **Fitting a camera to a bounding box wastes most of the frame.** A coil's box
  corners are empty air and the nearest of them sticks a whole radius toward the
  lens; the flat membrane is 33 : 1 and a bounding *sphere* is worse. Fitting the
  actual curve, against the two screen walls separately, with the panel's width
  reserved by sliding the target rather than zooming out.
- **The wave is genuinely steeper than a ribbon can show.** Four millimetres of
  wavelength at the base and a quarter of a millimetre at the peak: one exaggeration
  cannot serve both, and the crests near the peak came out as a row of white blades.
  A slope limiter holds the drawn height down where the wave has gone short and lets
  the light take over — applied to the hull by the same factor, so the envelope you
  see is always the envelope of the surface you see.
- **A claim I was going to make was false.** The plan was the clinical one: a
  chirp built from the model's own group delays should beat a click, because every
  place arrives at once. Measured, it does not — the click is already within 1 % of
  the *provable* optimum for a flat-magnitude stimulus, and 40 random phase
  rearrangements come in 15× below both. What IS true, and is what shipped, is the
  time-reversal pair. Measure before you write the sentence.

### Verified

- `node cochlea.test.mjs` — 14/14.
- Real browser, real input-level clicks and a real drag (`tools/cdp/pointer.mjs`),
  desktop 1440×900 and mobile 390×844: 58–61 fps, no console errors, no horizontal
  scroll, audio context running after a genuine gesture, breadcrumb dropped.
- `window.__spiralEar.selftest()` in the page's own runtime: octave 3.512046 mm
  (spread 7.6e-5) against the closed form 3.512017; apical decay 7559.30 /m against
  `sqrt(2 rho / H M)` = 7559.29.
- `tools/audio-lens` on everything the room plays: the 1 kHz tone reads **B5 +22 c
  (1000.4 Hz)**, nothing clips (peak −1.41 dBFS), and the two sweeps have the *same*
  overall spectral centroid, 2801.1 Hz, with the trajectory running 2610 → 2979 Hz
  one way and 2896 → 2712 Hz the other. The lens can tell them apart only by
  which way round they are, which is the entire claim.
