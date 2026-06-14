# The Butterfly 🦋 — CHANGELOG

## v1 (2026-06-14, cycle #18 of the fun-forever loop) — first FAST-TRANSFORM medium

**The one idea.** The radix-2 Cooley–Tukey FFT, as an operable front-door bench: watch a
length-N (power-of-two) signal split into its even/odd halves and butterfly back together with
twiddle factors W_N^k = e^(−2πi·k/N), and see that the *fast* O(N log N) transform gives the
*exact same* answer as the *slow* O(N²) DFT — then use that to make the convolution theorem EXACT.

The estate had the FFT only inside the internal `tools/audio-lens/`, never as a front-door bench;
`epicycles/` runs a genuine but SLOW O(N²) DFT as a *drawing* engine, and the convolution theorem
and polynomial-mult-via-FFT were 0 hits estate-wide. This is the estate's first FAST-TRANSFORM
medium; its identity is **speed + the convolution theorem**, distinct from epicycles' slow
drawing-DFT and entropy's info-framing.

**The falsifiable claim (two strangers agree, twice).**
1. **FAST == SLOW.** The recursive radix-2 `fft(x)` equals the source-disjoint naive O(N²) `dft(x)`
   (direct Σ x[n]·e^(−2πi·kn/N)) to machine precision over many seeds (worst |Δ| ≈ 4e-13 over 60
   seeds in-page; ≈ 2.5e-12 over N up to 256 in the Node twin), and `ifft(fft(x)) == x` round-trips
   to ~1e-16. The FFT and the DFT are **independent code paths** — the FFT NEVER calls the DFT — and
   a source grep asserts that disjointness, which is what makes "they agree" load-bearing.
2. **THE CONVOLUTION THEOREM, EXACT.** Two polynomials multiplied two source-disjoint ways —
   schoolbook O(n²) `conv(a,b)` vs `ifft(fft(â)·fft(b̂))` zero-padded to the next power of two ≥
   len(a)+len(b)−1 — give coefficient vectors equal to ~1e-14, and **byte-identical** after the
   6-dp rounding the test states.
3. **TEETH (a negative control that bites).** Drop the zero-padding and the CIRCULAR convolution
   `ifft(fft(a)·fft(b))` (same length, no pad) **provably differs** from the linear `conv(a,b)` — the
   wraparound aliasing the padding exists to prevent. The test asserts the circular result equals
   linear-with-the-tail-wrapped (the aliasing identity), and that it differs from linear by ≫ 0 on a
   wraparound-nontrivial case (corruption = 61 on [1,2,3,4]·[5,6,7,8]).

**Shape.** A self-contained vanilla single-file bench (no deps, plain `<script>`, the
catenary/first-integral/knot-tabulator byte-twin mold). Two views:
- **The butterfly** — an animated length-8 radix-2 diagram: the signal enters in bit-reversed order
  and the butterflies recombine length-2 → 4 → 8 blocks stage by stage, twiddle factors drawn as
  rotating phasors, top wing (E+W·O) in even-blue, bottom wing (E−W·O) in odd-violet. Play / step /
  reset; pick the signal (impulse, tones, ramp, random). A verify panel proves the staged picture's
  final stage equals the recursive `fft(x)` (so the picture is not lying).
- **The convolution theorem** — two editable coefficient sequences; the schoolbook product and the
  FFT product shown side by side with a green "byte-identical ✓" badge; a "remove the zero-padding"
  toggle flips to circular and shows the wraparound corrupting the head (red aliased cells), the
  teeth visible.

**Files.**
- `core.mjs` (the SOLE AUTHORITY, 432 lines): complex helpers,
  `isPow2`/`nextPow2`, the recursive radix-2 `fftRadix2`/`fft`/`ifft`, the INDEPENDENT naive
  `dft`/`idft`, schoolbook `conv`, `fftConvolve`, the drawable `fftStages`/`fftIterative`/`bitReverse`,
  a deterministic mulberry32 PRNG, and `runSelfTest` (the 3-part claim).
- `index.html` (1054 lines): inlines a BYTE-IDENTICAL copy of the core between
  `// ===== BUTTERFLY CORE (byte-identical to core.mjs) =====` … `// ===== END BUTTERFLY CORE =====`
  sentinels; the render spine (both views) calls only the inlined core.
- `core.test.mjs` (229 lines): the Node twin — runs the full in-page self-test, then 20+ INDEPENDENT
  re-derivations (hand-checked DFTs, fresh-seed sweeps to N=256, complex round-trips, the staged/recursive
  match, butterfly counts, hand-checked polynomial products, the teeth on a genuine-wraparound case,
  power-of-two guards, two independent source-disjointness greps), determinism, and **re-extraction
  parity** (the inlined block === `core.mjs`, indentation-normalised).

**Self-test.** In-page chip **11/11 ✓** · `node butterfly/core.test.mjs` → **35/35 PASS, exit 0,
deterministic** (byte-identical across two runs).

**Integration.** A Workbench card (🦋 "radix-2 FFT · the convolution theorem") in the **Computation**
group, right after The Knot Tabulator, beside The Mill / The Shannon Limit (stretched-link `div.card`
+ `a.card-link`, an inner cross-link to Epicycles in the blurb — the established sibling pattern, NOT
nested anchors). A Workbench standalone, so no `ws:seen` crumb (exempt per the DoD) and no front-door
map entry.

**Bug found while building** (in the test, not the core): an early independent teeth case used length-5
× length-4 polys whose linear length (8) happened to equal `nextPow2(5)` (8), so there was no actual
wraparound and the "differs" assertion failed. Fixed by choosing length-6 × length-6 (linear 11,
circular `nextPow2(6)`=8 → coefficients 8,9,10 genuinely wrap). The core was always correct.
