# The Reciprocal Twins — changelog

## Bloom (cycle #99) — two worlds, one reciprocal comb

A cross of **The Diffraction Grating** × the **Carillon**, homed in the Workbench's Computation /
Fourier family. ONE editable periodic object — a vertical slit-row of pitch `p` — sits at the center
as the single shared cause. It does NOT translate when you change `p`; its **pitch** changes, and two
Fourier readouts recompute from that one source. Three vertically stacked bands share ONE horizontal
reciprocal axis with integer ticks (the only ruler in the piece, drawn down the middle in brass/gilt):

- **TOP — optics (cool blue):** a laser strikes the slit-row; real glowing **spots** (radial-gradient
  bloom, m=0 brightest, ±1,±2… fanning out) land on a far screen. Each spot is *plotted* at its
  reciprocal coordinate ν = sinθ_n/λ = n/p, so it sits exactly on integer tick n. Orders with
  |sinθ|>1 are evanescent — culled before any asin, faded off the screen edge.
- **CENTER — the cause:** the visible, countable slit-row + the shared reciprocal ruler + the ONE
  brass period slider (the hero control). Widen `p` and BOTH combs compress toward center in lockstep;
  narrow it and both fan out as the pitch rises.
- **BOTTOM — sound (warm amber):** a plucked string drawn as a breathing stack of standing-wave loops
  (1 antinode = f₀, 2 = 2f₀, …; the visible loop-count IS the partial number). Each partial draws at
  ν = fₙ/(c/2) = n/p — the same integer tick as its optical twin — AND it SINGS (WebAudio additive
  sine bank at n·f₀, ~1/n rolloff, soft attack/release, a compressor/limiter, muted by default).

**Grafts:** a **pluck & fire** button re-fires the laser (spots bloom) AND re-plucks the string (a
chord of partials) in one gesture; a **λ chip** (633/532/450) changes the spots' SCREEN spacing but
they snap back to the SAME reciprocal ticks because λ cancels (ν = n/p is λ-free); **hover a tick** to
light spot n and partial n together with a live readout of the two equal reciprocal coordinates.

**Honest scope (in the lede AND core.mjs):** this shows the shared reciprocal-comb *structure* of two
periodic systems — each is the Fourier transform of a single period, so each is the comb {n/p}. The
acoustic period is *taken* as p = the fundamental's half-wavelength (the chosen convention that makes
both draw at n/p). It is NOT a claim that a grating IS a string. Each band shows BOTH the raw physical
quantity (sinθ in degrees · fₙ in Hz) and the normalized reciprocal coordinate, so the reader watches
two different worlds collapse onto one ladder.

### The five proven legs (`node reciprocal-twins/core.test.mjs` → 16/16 GREEN, exit 0; in-page pill 4/4)
1. **Tick coincidence** — across a sweep (p∈{2,4,6,8,10,14}, λ∈{450,532,633} nm, n=0..6),
   `reciprocalOptics(n,p,λ)` and `reciprocalSound(n,p,c)` both === n/p to machine-ε (max error 1.11e-16)
   AND agree with each other to < 1e-12. Two disjoint cores, one ladder. (8 evanescent orders culled.)
2. **λ-independence** — the optical reciprocal coordinate for fixed (n,p) is invariant across all λ
   (max spread 5.55e-17), while the raw angle sinθ DOES move with λ (a real, λ-dependent world).
3. **Lockstep (the reciprocity law)** — doubling p halves every tick coordinate for BOTH families at
   once (recipCoord(n,2p) === recipCoord(n,p)/2, exact for both cores).
4. **Negative control is load-bearing (two-pronged "break the period" toggle):** (a) a REAL chirped
   array-factor over chirped slit positions drives the grating's peaks 0.345 ticks off the integers
   (a perfect ε=0 grating stays on, exactly); (b) the carillon's inharmonic bell partials
   {0.50,1.00,1.19,1.50,2.00,2.55,3.42,4.18} miss the integer comb by 0.18–0.45 for the off-integer
   teeth. A vacuous always-aligned checker would PASS leg 1 and FAIL this leg.
5. **Byte-twin parity** — index.html's inlined CORE slab === core.mjs CORE char-for-char (10598 chars).

Plus an **anti-circularity** row: the optics ν must flow from the grating's own `orderSinThetas`
(lifted verbatim from `diffraction/index.html`), never a hand-written n·λ/p — grep-asserted in the
test.

### Two disjoint cores
- **CORE A (optics):** imports the grating's own `orderSinThetas(d,λ)` verbatim (the sole optics
  authority — returns a sorted array incl. 0 and ±s capped at |s|≤1); ν per order is `s/λ`, n recovered
  by counting from the center.
- **CORE B (sound):** a new, independent path with no trig and no λ — `fundamental = c/(2p)`,
  `partials = n·f₀`, `reciprocalSound = (n·f₀)/(c/2) = n/p`.

### Audio QA (offline render → audio-lens)
The harmonic pluck reads a clean in-tune fundamental (G3 +1c at p=6, baseHz=196·(6/p)) with
integer-multiple partials and no clipping; the bell control is audibly inharmonic (a ×0.5 hum octave
below + the off-integer ringers), the spectrogram showing unevenly spaced, differently-decaying lines
vs the harmonic version's regular comb.

### Registration (garden / cross — NO front-door footprint)
- Workbench: the **54th** card, homed in Computation beside the Fourier family (glyph ⫶, kind
  "diffraction orders ≡ string overtones · one reciprocal comb").
- Reciprocal cross-links both ways: `diffraction/index.html` topbar → "↗ the same comb, heard — The
  Reciprocal Twins"; `sound-garden/carillon.html` → "↗ these bell partials, broken off the integer
  comb — The Reciprocal Twins" (the carillon IS the negative control's voice, so the link is earned).
- No new front-door district/wing; no `index.src.html` PLACES change; no map node.

Files: `core.mjs` (the sole logic authority, inlined byte-identical into the page between
`// === CORE BEGIN/END ===` sentinels), `core.test.mjs` (the Node twin, exit 0), `index.html`
(the three-band stage + the controls + the in-page self-test pill), `SPEC.md`, this changelog.
Zero dependencies.
