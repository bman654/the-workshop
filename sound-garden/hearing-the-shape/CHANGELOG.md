# Hearing the Shape of a Drum — CHANGELOG

## 2026-07-29 — new room, and `tools/modal/` with it

Mark Kac, 1966: *Can one hear the shape of a drum?* You are handed every frequency
a drumhead can sound and nothing else. Is the outline determined?

Gordon, Webb and Wolpert answered no in 1992, with a pair of eight-sided drums each
made of seven half-squares. **This room does not cite them. It finds them.**

### What is here

Two drumheads in warm light, side by side (one behind the other on a phone). Click
either one anywhere and it rings from where you hit — the sound is a bank of
resonators tuned to that shape's own Dirichlet eigenvalues, and the picture is the
same fourteen modes summed on the same mesh. A ladder of the fourteen frequencies
runs down the right-hand side with a **cents column**: how far apart the two drums'
rungs are. For the twins every bar is empty.

- **strike both** · **ring the ladder** (each mode in turn on both drums at once,
  reporting the beat frequency — there isn't one)
- **nodal lines** · click any rung to hold that mode: the two drums show *the same
  number* and *a different picture*, and the room says how many pieces each mode's
  nodal set cuts its own drumhead into.
- **drum II: the twin ⇄ an impostor** — swaps in the best liar among the other 316
  shapes: same area, same perimeter, the same eight corners with the same nine
  angles, and its first six notes inside a cent and a third. Its seventh gives it
  away; its ninth is 34 cents flat and beats at 4.7 Hz.

### The claim, and how it is checked

**The two drums have the same spectrum and are not the same shape.**

* Fourteen eigenvalues agree to **1.6 × 10⁻¹⁵** — at k = 2, 3, 4 *and* 5, on meshes
  with different connectivity. That is not "close": double precision carries about
  2.2 × 10⁻¹⁶ per operation. The discrete transplantation is exact, which is why the
  agreement does not improve or degrade with resolution — it is already the same
  number.
* Not congruent: the eight corners of each have **different distance multisets**, so
  no isometry of the plane carries one onto the other. (Their canonical lattice forms
  differ too, but the distance argument does not assume the lattice.)
* The solver is checked where the answer is known in closed form — a unit square
  (2π²) and a half-square (5π²), both converging like h² with ratios 3.99–4.00.
* And against a **published twelve-digit benchmark it was never given**: Driscoll
  1997 / Betcke & Trefethen give λ₁ = 2.537943999798 for these drums at leg-length
  two, so ours (leg-length one) must be four times that, 10.15177600. The room walks
  in on it: 2.50e-3 → 1.39e-3 → 6.48e-4 → 2.81e-4 relative, ratios 1.80 → 2.14 →
  2.31, climbing toward **2.52 = 2^(4/3)** — the rate two 270° reentrant corners
  dictate, because every eigenfunction has an r^(2/3) singularity there. The rate is
  itself a prediction, and it holds.
* Weyl's two-term law cannot separate them either: both have area 7/2 and perimeter
  6 + 3√2 exactly, so the asymptotic count of notes below a pitch is identical before
  any fine structure is reached.
* What *does* separate them: **nodal domains**. Same notes for ever; from the fourth
  note on, a different number of pieces.

### The search, live, in the page

Press *prove it* → *run the search*. The page enumerates every polyabolo of seven
half-squares (318 of them; the counts 1, 3, 4, 14, 30, 107, 318 reproduce **OEIS
A006074**, which nothing here was fitted to), solves the Laplacian on each, and
compares all **50,403 pairs** — in about half a second. It draws all 318 spectra as a
wall of fingerprints, boxes the one coincidence and magnifies it. One pair agrees at
2.7e-15; the runner-up at 5.4e-3. **Twelve orders of magnitude** between the answer
and the nearest accident.

### The ear

An AnalyserNode on the page's own master bus. Drum I is driven at every mode, its
spectrum peak-held for 1.4 s; then drum II. Fourteen partials picked in each by
parabolic interpolation, worst disagreement between the two **measured** spectra
**0.3 cents**, worst distance from the predicted ladder 5.5 cents against an 11.5-cent
half-bin. Peak level reported and checked for clipping.

That panel caught a real bug that no amount of arithmetic would have: at the level I
first set, the worklet's `tanh` safety limiter was saturating on the in-phase first
sample of a fourteen-mode strike, and the analyser found **22** partials instead of
14. The extra eight were intermodulation products of my own limiter. Turning the
drive down and capping the loudest possible blow per drum (`loudestBlow()`, measured
over every node of each mesh) fixed both the distortion and the measurement.

### Engines

| | |
|---|---|
| `polyabolo.mjs` | the shapes: the four half-square types per cell, edge adjacency, canonical form under the eight lattice symmetries, enumeration, outline, corner angles |
| `spectrum.mjs` | uniform 4^k refinement of every half-square (so there is *no* boundary error), P1 stiffness, lumped mass, RCM ordering, banded Cholesky, shift-invert Lanczos with full reorthogonalisation |
| `drum.mjs` | voices, strike amplitudes, nodal lines and domains, Weyl, the search |
| `tools/modal/core.mjs` | **new** — the estate's bank of resonators, which four letters in NEXT.md had asked for |

`drum.test.mjs` — 29 legs, all green, about two seconds. `--full` adds the k = 7
benchmark level (57,000 unknowns; the banded Cholesky does it in under four).

### Honest about the picture

A 110 Hz membrane at 60 frames a second is a grey blur, so the wobble is drawn 42×
slow and a few hundred times too large; the **decay** is real time, so what you watch
stops when what you hear stops. While a mode is held, the surface passes through flat
twice a cycle — so the *colour* is normalised by the phase and shows the mode shape
at full strength throughout while the *height* keeps oscillating. Same field, two
readings of it, and it says so.

### Not claimed

That this is what a real drum sounds like. A real drumhead has air on both sides, a
kettle under it and a bending stiffness this model has no term for. What you hear is
the ideal membrane, honestly synthesised.
