# The Reciprocal Twins — SPEC

## One line
Two periodic worlds — a diffraction grating and a plucked string — that never met, shown to share ONE
reciprocal comb {n/p}: drag a single period slider and the laser spots above and the string overtones
below slide in lockstep onto one brass ruler. Both are the Fourier transform of a single period.

## The soul (the five questions)
- **Fun:** one brass slider is the whole instrument; dragging it squeezes/fans two worlds at once, and
  the λ chip is a little magic trick (color moves the spots, then they snap back to the same ticks).
- **Beautiful:** glowing radial-bloom spots on a cool-blue screen above, a warm-amber breathing
  standing-wave stack below, a single gilt ruler between them. Optics cool, sound warm, the comb gold.
- **Correct (math claim):** yes — and proved EXACT by a Node twin + an in-page pill (5 legs, below).
- **Discoverable:** Workbench card in the Fourier family + reciprocal cross-links from both parents.
- **Fits the estate:** mirrors `aperiodic-patch` exactly (core.mjs + core.test.mjs + inlined-byte-twin
  index.html + CHANGELOG + SPEC, zero deps); the estate palette; the gold self-test pill.

## Form expresses content
Show the THINGS: real diffracted spots landing on a screen, a real plucked string vibrating in its
modes, a real slider you drag. The reciprocal comb is the ONE abstraction, drawn as a literal ruler.
Each band ALSO shows its raw physical quantity (sinθ in degrees; fₙ in Hz) so the reader watches two
different worlds collapse onto one ladder — never two abstract line charts.

## The honest scope (non-negotiable)
This shows the shared reciprocal-comb STRUCTURE of two periodic systems. The acoustic period is TAKEN
as p = the fundamental's half-wavelength (the chosen convention that makes both draw at n/p). It is
NOT a claim that a grating IS a string. Stated in the page lede AND in a core.mjs header comment.

## The math
- **Optics:** a grating of pitch p diffracts order n to sinθ_n = n·λ/p. The reciprocal coordinate is
  ν = sinθ_n/λ = n/p — λ cancels. Orders with |n·λ/p| > 1 are evanescent (no real spot).
- **Sound:** a string/pipe of period p has fundamental f₀ = c/(2p) and overtones fₙ = n·f₀. The
  reciprocal coordinate is ν = fₙ/(c/2) = n/p — c cancels.
- Both reduce to the integer comb {n/p}, whatever the periodic thing is. That is the claim.

## Two disjoint cores (the bench)
- **CORE A (optics, sole authority = the grating's own function):** `orderSinThetas(d,λ)` lifted
  VERBATIM from `diffraction/index.html` — a sorted array incl. 0 and the ±s pairs capped at |s|≤1.
  `reciprocalOptics(n,p,λ)` recovers order n by index from the center and returns `s/λ`. NEVER
  hand-writes n·λ/p (an anti-circularity grep asserts this).
- **CORE B (sound, new, no trig, no λ):** `fundamental(p,c)=c/(2p)`, `harmonicComb`, and
  `reciprocalSound(n,p,c)=(n·f₀)/(c/2)`. A fully disjoint code path.

## Self-test (Node twin GREEN exit 0 + in-page pill ✓)
1. **Tick coincidence** across a (p, λ, n) sweep: both cores === n/p to machine-ε AND agree to <1e-12.
2. **λ-independence:** optical ν invariant across λ for fixed (n,p); the raw angle does move with λ.
3. **Lockstep:** doubling p halves every tick for BOTH families (recipCoord(n,2p)===recipCoord(n,p)/2).
4. **Negative control (load-bearing, two-pronged):** (a) a REAL chirped array-factor pushes the
   grating's peaks off the integer ticks (a perfect grating stays on); (b) the carillon's inharmonic
   bell partials miss the integers by >0.1. A vacuous always-aligned checker passes leg 1, fails this.
5. **Byte-twin parity:** the inlined CORE slab === core.mjs CORE char-for-char.

## Controls
- **Period slider p** (2–14 µm): the single shared cause — the hero brass slider.
- **λ chips** 633 / 532 / 450 nm: moves the spots' screen position; the ticks don't budge.
- **Pluck & fire:** one gesture re-fires the laser bloom AND re-plucks the string chord.
- **Sing (sound) toggle:** gates the WebAudio additive synth (muted by default; sight tells the story).
- **Break the period:** chirps the grating AND swaps the harmonics for the bell's inharmonic partials
  — both combs smear off the integers at once, visibly and audibly.
- **Hover a tick:** highlights spot n and partial n together with a live readout of the two equal ν.

## Files
`core.mjs` · `core.test.mjs` · `index.html` (CORE inlined byte-identical between
`// === CORE BEGIN/END ===`) · `CHANGELOG.md` · `SPEC.md`. Zero dependencies.
