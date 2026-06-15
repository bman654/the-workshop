# Two Wings, One Slit — CHANGELOG

The Cavern Quantum-Drift's **one-equation bench**: Young's double slit and the Hall's
diffraction grating look like different physics — two slits versus a thousand, a quantum
particle versus a beam of light — but they are the *same* dimensionless array factor,
read at N = 2 and at N ≫ 2. And an electron and a photon of the same wavelength drop
**byte-identical** fringes, joined by de Broglie's **λ = h/p**.

## v1 — the array-factor bench + the single-source refactor (cycle #29, the Double-Slit × Diffraction-Grating `[cross]` sown #27)

### The one idea
The N-slit array factor is one function:

    F(N, φ) = [ sin(Nφ) / (N·sin φ) ]²,    φ = π·d·sinθ/λ,    peak 1 at φ = mπ

- At **N = 2** it is *exactly* cos²φ — the double-slit fringe term. The self-test asserts
  `arrayFactor(2,·) === cos2(·)` to machine ε (max |Δ| = 4.44e-16). It is **proven, not assumed.**
- Grow **N** and the principal maxima never move and never rise — they only **narrow**, by
  exactly 1/N. Young's double slit and the grating are the same curve at N = 2 and N ≫ 2.
- The de Broglie bridge `λ = h/p` (h the SI-exact `6.62607015e-34`) makes an electron of
  momentum p and a photon of λ = h/p produce **byte-identical** fringes — same function,
  same input, `Object.is`-equal.

### What shipped (`cavern/two-wings-one-slit/`)
- **`interference-core.mjs`** (93L) — the SOLE array-factor authority for the whole estate.
  Exports `H_PLANCK` (SI-exact, twinned like `R_GAS`), `phase`, `arrayFactorPhi` (the ONE
  `sin(Nφ)/(N·sinφ)` ratio, removable-singularity series byte-identical to the diffraction
  page's old limit math), `arrayFactor` (peak 1), `cos2`, `orderSinThetas`/`orderTheta`,
  `deBroglieLambda`/`momentumFor`, `incoherentFactor` (the teeth). Bare function/const between
  sentinels (the PRESSURE-CORE pattern) so inlined slices compare byte-identical with no
  export-strip.
- **`index.html`** (752L, zero-dep, one rAF loop, Float64Array strip cache) — the full core
  inlined as a byte-twin between sentinels, plus:
  - **the morph panel** — arrayFactor vs sinθ, peak-1 ceiling, eased N-morph 2→32, a fat white
    cos² ghost at N = 2 fading by N ≥ 3, amber order dots riding the ceiling, a 1/N caliper, and
    a fixed **~2.5-order window** (five lobes, m = 0, ±1, ±2) so the cos²-and-narrowing thesis is
    legible.
  - **the coupler panel** — two interference strips drawn by the *identical* `arrayFactor` call,
    shared d/L/N, a coupled electron-p / photon-λ **seesaw** (two views of one λ), a
    Prove-identical overlay, and a live `max|I_e − I_p|` readout.
  - **teeth** — *Break one wing* (d_photon = d·1.001 → the overlay splits, readout red) and
    *Incoherent sum* (swap in `incoherentFactor` → both strips flatten, the fringes vanish).
  - an in-page 7-rung self-test pill + an honesty note ("What 'one equation' actually means").
- **`interference-core.test.mjs`** (178L, **14/14**) — the Node twin: the cross
  (`arrayFactor(2)===cos²` @ 4.44e-16), the grating equation (peaks pin to 1 at asin(mλ/d),
  FOUND by fine-sweep), de Broglie (electron λ(p) === photon λ byte-identical via `Object.is`,
  round-trip), teeth ×2, **BYTE-TWIN PARITY ×3** (all three pages' inlined slices === the module
  char-for-char), an anti-circularity grep, and the `H_PLANCK` literal twin.

### The single-source refactor (the other half of the cross)
Both wings now delegate to the imported core instead of carrying their own interference math:
- **`cavern/double-slit/index.html`** — the fringe term is now `4·arrayFactorPhi(2,β)`; the core
  is inlined; +1 pill rung ("two-slit fringe term === 4·arrayFactorPhi(2,β) imported core");
  pill 8→9. Two in-prose cross-links to the new bench.
- **`diffraction/index.html`** — `gratingFactor()` is now `N²·arrayFactorPhi(N,α)` (the N² lives
  on the Hall's side, not in the core); the core is inlined; the existing N=2-cos² rung still
  passes; +1 rung ("N=2 reduces to double-slit cos² via imported core"); pill 8→9. A top-nav
  cross-link to the new bench.
- **`cavern/index.html`** — a new bench card after the double-slit card in `#quantumDrift`; +2
  self-test rungs (the Two-Wings link present-iff-unlocked / is relative); landing pill 27→29.

### Honesty
`arrayFactor` is normalized to **peak 1**: the principal maxima pin to the ceiling for every N;
raising N only narrows them. That is what makes `arrayFactor(2,·) === cos²` exactly (cos² also
peaks at 1). The Hall's diffraction bracket is the *un-normalized* geometric sum whose peak is N²,
recovered by writing `N²·arrayFactorPhi(N,·)` — the factor of N² is the Hall's business, not the
core's. The slit-**width** envelope (sinc²) is each wing's own business and is deliberately NOT in
the core; the core is the dimensionless array factor alone.

### Verification
`interference-core.test.mjs` **14/14** · in-page pill **7/7** · double-slit pill **9/9** (gained
+1 rung) · diffraction pill **9/9** (gained +1 rung) · Cavern landing pill **29/29** (grew by 2,
unlocked AND locked both green). Browser-verified: 0 console errors, 0 nested anchors, 0 horizontal
overflow @1280 AND @390 on all four pages; teeth fire live (Break-one-wing → red, Incoherent-sum →
red, both release to green `0.0e+0`); the seesaw couples (raising electron p drops photon λ
0.660→0.494 nm, fringes stay byte-identical). No `.src.html` on any touched page → no forge run.

### Publisher fresh-eyes review (cycle #29) — CAUGHT & FIXED two polish issues
1. **The morph θ-window was too wide.** The builder flagged it: at ~4.5 orders (≈9 lobes) the fat
   white cos² ghost was illegible and the panel read as a comb, undercutting its own thesis.
   Tightened `winSinTheta` from `4.5·λ/d` to `2.5·λ/d` (five lobes) — the cos² envelope and the
   "growing N only narrows it" needle-collapse now read clearly. The edit is OUTSIDE the core
   sentinels (page-only window math), so byte-twin parity is untouched (test still 14/14).
2. **The diffraction top-nav crowded at mobile.** The third back-link (→ the new Cavern bench)
   collided with the brand title under 390px. Added a mobile media-query rule
   (`.topbar{ flex-direction:column }` + `.left{ flex-wrap:wrap }`) so all three crumbs stack and
   stay fully legible — no horizontal overflow at 390px. Desktop (1280) unchanged.
