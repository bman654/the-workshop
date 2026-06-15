# The Wave Packet — CHANGELOG

The Cavern Quantum-Drift's **first time-domain bench**: every prior bench solved the
*time-independent* Schrödinger equation (standing eigenstates, fixed ladders). This one
lets a state **move** — it integrates the *time-dependent* Schrödinger equation
i ∂ψ/∂t = Ĥψ (natural units ħ=m=1) for a Gaussian wave packet and shows it spread,
split, and slosh.

## v1 — the unitary split-step bench (cycle #21)

### The one idea
A Gaussian packet ψ(x,0)=A·e^(−(x−x₀)²/4σ²)·e^(ik₀x) is propagated by the **Strang
split-step Fourier** integrator:

    one step dt:  kin½ → potFull → kin½
      kin½  : FFT ψ → multiply mode j by e^(−¼ k_j² dt) → iFFT   (diagonal in momentum)
      potFull: multiply ψ(x) by e^(−i V(x) dt)                   (diagonal in position)

Each factor is a **pure phase**, so the propagator is **unitary by construction** —
∫|ψ|² is conserved to the round-off floor *every step*, exactly, not "approximately
to a tolerance."

**THE FACTOR-OF-2 TRAP (commented in the code).** The kinetic half-step phase is
**−¼ k² dt**, NOT −½ k² dt. Two halves combine: the ½ from "half step" (dt→dt/2) times
the ½ in the kinetic energy ½k². Getting this wrong by a factor of 2 is exactly what the
v_g=k₀-not-k₀/2 Ehrenfest leg catches downstream — so it cannot drift silently. The
calibration assert ⟨p⟩(t=0)==k₀ pins the imported FFT's unnormalized-fwd/÷N convention.

### Architecture — the butterfly import + the byte-twin parity (the Demon template)
- **`core.mjs`** is the sole numerical authority. Its **first line** imports the FFT from
  the estate's own bench: `import { fft, ifft, isPow2 } from '../../butterfly/core.mjs';`
  — a real single-source cross-core link. The kinetic half-step is the *only* place the
  butterfly boundary is crossed (toObj/fromObj adapters, 2 obj-allocations/step at N=1024).
- **`index.html`** is a plain `<script>` (NOT `type=module`). Above the core sentinels it
  inlines a verified copy of butterfly's `fft`/`ifft`/`isPow2`/`fftRadix2`/`cx`; between the
  sentinels `// ===== WAVE PACKET CORE … =====` it inlines the **byte-identical** core, which
  references fft/ifft/isPow2 as FREE names (imported in core.mjs, inlined above in the page).
- **`core.test.mjs`** (the Node twin) re-runs all self-test legs headless, adds independent
  re-derivations, asserts the inlined core is byte-identical to core.mjs (re-extraction
  parity), **and adds one extra assert beyond the hydrogen mold**: it compiles the page's
  inlined `fft` and proves it produces **byte-identical output** to the real imported
  `butterfly/core.mjs` fft on a seeded vector — so the inlined copy can never silently drift
  from the single source. **28/28 green, deterministic (no RNG).**

### The four legs + the teeth (each GREEN to a STATED tolerance — honest about scope)
- **LEG 1 UNITARITY** — |∫|ψ|²−1| < 1e-9 across the full run, every potential (mask OFF).
  Measured ~5e-14 (the round-off floor — unitarity is exact per step).
- **LEG 2 EHRENFEST, both halves** — 2a d⟨x⟩/dt=⟨p⟩ (finite-diff vs *spectral* ⟨p⟩);
  **2b the v_g trap, both-sided**: ⟨x⟩(4) lands on x₀+k₀·4 (<5e-3) AND is far from the
  phase-velocity decoy x₀+k₀/2·4 (>5e-2) — asserts v_g=k₀ AND rejects the v_φ=k₀/2 decoy;
  2c d⟨p⟩/dt=−⟨V′⟩ in the harmonic bowl; 2d the coherent-state rhyme (σ=1/√(2ω) swings at
  ω to <1% without breathing — σ steady to <2%).
- **LEG 3 ENERGY** — |⟨H⟩(t)−⟨H⟩(0)|/|⟨H⟩(0)| < 1e-5, every potential, with ⟨H⟩ =
  *spectral* ⟨T⟩ + *x-space* ⟨V⟩ (source-disjoint representations — a fake-norm bug would
  leak energy and this bites). Measured ~2e-7.
- **LEG 4 CLOSED FORM** — the free Gaussian's |ψ_num|² matches the EXACT analytic envelope
  σ(t)=σ₀√(1+(t/2σ₀²)²), center x₀+k₀t, to <2e-4 at t∈{0,1,2,3}; plus a width-level witness
  |σ_num−σ(t)|/σ<1% (two disjoint oracles agree).
- **TEETH** — `eulerStepNonUnitary` (ψ←ψ−i·dt·Ĥψ; amplification |1−i·dt·E|>1, so the norm
  GROWS) FAILS the same norm test (drift ≫ 1e-3, in fact it blows up) while the split-step
  holds (<1e-9). Proves LEG 1 is a real discriminator.

### The Tunnelling cross — the crown jewel (a real self-test tie)
`tunnelling/index.html` is a single-file IIFE (0 exports), so its closed form isn't
importable. The 6-line rectangular-barrier closed form is **re-derived char-for-char** as
`staticT(E,V0,L)` in core.mjs/core.test.mjs — the E<V0 *sinh* branch, the E>V0 *sin* branch,
the E=V0 *degenerate* limit, all in identical ħ=m=1 units. **For the record, the Tunnelling
bench's `transmissionClosed`, which it certifies to 1e-9 against its transfer-matrix solve:**

```js
function transmissionClosed(P){
  var E=P.E, V0=P.V0, L=P.L;
  if(E<=0) return 0;
  if(V0<=0) return 1;                          // no barrier
  if(Math.abs(E-V0) < 1e-12){                  // degenerate κ→0 limit
    return 1/(1 + (V0*V0*L*L)/(2*E));
  }
  if(E < V0){
    var kappa = Math.sqrt(2*(V0-E));
    var sh = Math.sinh(kappa*L);
    return 1/(1 + (V0*V0*sh*sh)/(4*E*(V0-E)));
  } else {
    var q = Math.sqrt(2*(E-V0));
    var sn = Math.sin(q*L);
    return 1/(1 + (V0*V0*sn*sn)/(4*E*(E-V0)));
  }
}
```

`staticT` here is byte-identical to that (renamed args E,V0,L). **The cross-tie:** after a
barrier scatter (V₀=3, L=1.2, k₀=2.2, σ=3 — chosen so ⟨E⟩≈2.43 lands T meaningfully in
(0,1)), the dynamical transmitted ∫_{x>wall}|ψ|² (mask OFF) must land within the **honest
energy-spread band** of staticT(⟨E⟩): band = max(|staticT(⟨E⟩+σ_E)−staticT(⟨E⟩)|,
|staticT(⟨E⟩−σ_E)−staticT(⟨E⟩)|) + 0.02 floor — NOT machine-ε, because a packet carries a
**band of energies**. It lands cleanly: **T_dyn≈0.200 vs staticT(⟨E⟩)≈0.183, band ±0.10.**
This is a real, in-tolerance tie, not a prose teaser.

### Render (index.html)
Inherits the hydrogen/box/oscillator skeleton (`:root` palette, topbar, #wrap/#stage/#panel,
the self-test chip + #stPanel, the rock-texture body::before). The wave is drawn in **two
layers**: LAYER A the luminous |ψ|² envelope (filled + crisp `--q-bright` crest with glow);
LAYER B the phase painted UNDER the envelope (per-column hue = arg(ψ) through the wing's
mineral palette violet→teal→gold, brightness∝|ψ|) — so the visitor SEES the bump crawl at
v_g while the colours race at v_φ=k₀/2. A `phase colour` toggle drops layer B (ON by default
— the colour IS the lesson). A gold Ehrenfest dot rides live ⟨x⟩ with a faint guide, the
predicted x₀+k₀t track drawn faintly, and a ⟨x⟩±Δx ring (watch it broaden). The potential
floor is in the wing grammar: free=baseline, barrier/step=barred-red wall with a dotted ⟨E⟩
line (echo Tunnelling), harmonic=warm parabola (oscillator's bowl colour). Right rail (356px):
lede, 4 potential buttons, k₀/σ₀/V₀/L sliders, Launch/⏸/↺/▸▸speed, live readout (⟨x⟩,⟨p⟩,⟨E⟩,
norm,σ,transmitted), the scope note, 2 cross-teasers (Tunnelling + Oscillator).

**Locked state contract** (render is pure view, core is sole authority): `sim.{re,im,t,
obs:{xMean,pMean,E,T,V,norm,sigma},V}`; methods setPotential/launch/pause/resume/reset/step.

**Self-test execution:** the heavy ~10s TDSE evolve runs in a **Web Worker** built from a Blob
whose body is the page's OWN sentinel-bounded core (fetched as raw bytes — ONE source, no DOM
re-serialization), so the in-page self-test never freezes the 60fps animation. The chip reads
"checking…" until the worker reports back; a synchronous fallback covers file:// / no-Worker.

### Mobile (the cycle-#20 header-collision fix baked in from line one)
`@media max-width:820px`: #wrap stacks + scrolls; #stage 54vh/min 360px; `.brand` and
`.viewlabel` hidden; the canvas draw-region floored below the fixed top-bar
(`py0=max(H·0.10, 76·DPR)`) so the canvas-drawn regime header never tucks under the
back-links. Desktop pixel-unchanged. Verified at 1280px and 390px: 0 horizontal overflow.

### Wing integration
Registered as the **8th card** in the Cavern's gated Quantum-Drift section (after Hydrogen),
icon 🌊. The Cavern landing self-test gained a `wpLink` present-iff-unlocked + relative pair
(count **26→28**). A `ws:seen:wave-packet` crumb drops on direct visit (does not touch the
walkedBothDrifts unlock predicate). Reciprocal cross-teasers added on `tunnelling/index.html`
(→ "this T(E) made dynamical") and `oscillator/index.html` (→ the coherent-state rhyme, with
its fragile partition-teaser self-test assert hardened to a `[href$=partition.html]` selector).

### Scope & honesty (stated on the page in plain language)
A numerical solve of the TDSE on a grid by a unitary split-step integrator (ħ=m=1);
conservation laws hold to a STATED tolerance (norm<1e-9, energy/Ehrenfest ~1e-3 over the run),
not the last bit — grid spacing & time step set the floor, and the self-test shows the drift.
The free packet is checked against its EXACT closed form; the others are trusted only through
the conservation laws.
