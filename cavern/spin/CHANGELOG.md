# Spin — the Stern–Gerlach Split — CHANGELOG

The Cavern Quantum-Drift's **measurement bench**: fire silver atoms through a magnet and they
never smear across the screen — they land in **exactly two spots**. That two-valuedness *is*
spin. Prepare a state with the first magnet, block one beam, then tilt the second magnet: the
split obeys **P(↑) = cos²(θ/2)** — the angle alone. Cross the analyzers at 90° and it is always
**exactly 50/50**, because measuring x has **erased** z. The which-path sibling of the double slit.

## v1 — the Stern–Gerlach bench (cycle #43, the Quantum-Drift `[exhibit]` Spin sown #42)

### The one idea
A state prepared along unit vector n̂ (the +n̂ eigenstate), measured along axis m̂, gives spin-UP
along m̂ with probability

    P(↑) = cos²(Θ/2) = ½(1 + n̂·m̂),    Θ = angle(n̂, m̂)

- This is **Malus's law for spin-½** — a perfect analyzer cosine, but on the **HALF angle**, so
  two analyzers crossed at 90° give exactly ½, never 0. We compute it from the **dot product**
  via the half-angle identity cos²(Θ/2) = (1+cosΘ)/2 — **NO `Math.acos`** round-trip (that would
  inject ~1e-8 error near Θ=0). pUp is THE ratio; pDown = 1 − pUp.
- It is **proven, not assumed**: the self-test cross-checks pUp against an INDEPENDENT
  spinor-projector route |⟨m+|n+⟩|² (built from the explicit two-component spinors
  |n+⟩ = (cos(θ/2), e^{iφ}sin(θ/2))). Closed form === projector over a dense (θn,φn,θm,φm)
  grid to **max |Δ| = 4.44e-16**.
- The hero cases are **exact**: θ=0 → P(↑) `Object.is` 1; θ=180 → 0; θ=90 → `=== 0.5`
  (asserted with `===`, not `≈`); θ=60 → 0.75 to 1e-15.
- The **erasure chain**: prepare +z, measure x → ½ (no x-info in a z-state); take the x-up beam
  and re-measure z → ½ again. The z-information is **ERASED** — a +x state is an equal
  z-superposition, regardless of the original +z prep. The control (no x in between) stays 100% up.

### What shipped (`cavern/spin/`)
- **`core.mjs`** (~115L) — the SOLE spin-½ probability authority for the bench. Exports
  `blochVec` (colatitude-θ-from-+z unit vector), `pUp` (THE ratio, half-angle, clamped dot),
  `pDown`, `spinorUp` + `overlap2` (the independent projector route), `mulberry32` (the
  established deterministic-PRNG idiom, byte-twin of the double-slit/box benches, seed
  `0x5C1F0001`), `sampleSplit` (N Bernoulli draws → {up,down}, the honest two-valued sampler),
  and `classicalDeflect` (the **negative control** — a continuous deflection ∝ n̂·m̂, a smear).
  Bare functions between `// === CORE BEGIN/END ===` sentinels so the inlined slice compares
  byte-identical with no transform.
- **`core.test.mjs`** (Node twin, GREEN **18/18**, `process.exit(pass===total?0:1)`) — seven rungs:
  (1) two derivations agree (pUp === projector over 15,379 points, max |Δ| 4.44e-16);
  (2) hero cases exact (0→1, 180→0, 90 `=== ½`, 60 → ¾);
  (3) normalization pUp(n,m)+pUp(n,−m) `=== 1` exactly (Σ−1 = 0);
  (4) the erasure chain (+z→x is ½, then +x→z is ½, control +z→z is 1);
  (5) seeded convergence (200k lands within the binomial ±4σ band of cos²(θ/2) at every θ; same
  seed → byte-identical counts; mulberry32 first-draw pinned to the literal `0.3510491873603314`);
  (6) the **teeth** (the classical deflection is a CONTINUUM that fills the forbidden middle band,
  the quantum sampler is strictly two-valued, and at θ=90° the classical law lands dead-center
  where the quantum law forbids any atom — the control fails the two-spot law);
  (7) **byte-twin parity** (re-extract the CORE slice from BOTH `core.mjs` and `index.html`,
  assert char-for-char identical — 3501 chars — plus an anti-circularity grep forbidding any
  second `(1+…dot)/2` projector or `cos(…/2)**2` outside the sentinels).
- **`index.html`** — the bench. The HERO is the **firing beam + two growing piles**: a side-on
  Canvas2D beamline (HiDPI) — OVEN (radial-gradient glow) → COLLIMATOR slit → MAGNET A (a wedge:
  tapered N pole over a flat grooved S pole, hatched field lines crowding the tapered pole — the
  inhomogeneous ∂B/∂z that splits the beam) → SCREEN A + a **chooser shutter** (pass-both /
  pass-↑ / pass-↓; blocking a beam draws a literal red shutter plate and the dead beam fades to a
  ghost) → MAGNET B on a **tilt dial** (the wedge physically rotates) → DETECTOR PLATE with two
  **dot-histogram piles** (discrete grains with jitter, ragged early, smoothing toward theory) and
  a grey **classical-smear ghost band** spanning the gap the two-spot data refuses to fill, with
  A's caption "a classical dipole would smear here". A small **Bloch satellite** (~150px, a CONTROL
  not a graph) shows the prepared state n̂ as a draggable bright arrow and the measure axis m̂ as a
  dimmer one. Three **preset chips** (Confirm: z→block↓→z = 100%↑ · Erase: z→block↓→x = 50/50 ·
  Paradox: z→…→x→block↓→z = 50/50). Controls: Fire one (watch it decide) · Stream (rAF, rate
  slider) · Fire 10k (seeded batch via `sampleSplit`) · Reset · drag Bloch · Dial A / Dial B ·
  chooser toggle. A quiet readout (up/down/total, empirical fraction, theory cos²(θ/2), and a live
  ±1σ binomial "within band?" check). The spin-½ core is **inlined byte-identical** between the
  sentinels; the in-page `.selftest` pill runs rungs (1)–(6) against the inlined core (green
  **6/6**) and a "re-run headless 200k" button flashes empirical vs target.

### The form (why it expresses the content)
The estate had drifted toward graphs; this bench shows the **thing you can see and touch** — silver
atoms firing and landing in two piles, exactly like the double-slit bench, *not* a plotted curve.
The Bloch sphere and the chained magnets are **controls**, never a replacement graph; the piles stay
the hero. The lesson is **drawn, not narrated**: the ghost band is the smear the data refuses to
fill, the two spots are the law.

### House hygiene
≈60fps, clean console, no overflow. Reduced-motion path draws a STATIC POPULATED frame (600
pre-sampled grains already built, atoms at rest) instead of animating, via the
`if(RM){ …; draw(); }` idiom. Drops the `ws:seen:spin` breadcrumb on load in a try/catch before the
main body. Browser-verified in a uniquely-named agent-browser session (cache-bust `?v=N`): pill
green 6/6, fire-one decides, stream builds two ragged piles, the ghost-smear stays unfilled, tilt B
0→90→180 melts 1.000→0.500→0.000, presets animate (Confirm→1.000, Erase→0.500, Paradox→0.500),
Bloch drag re-balances, zero console errors.

### Provenance
Lifted from the winning prototype `/tmp/spincheck.mjs` (closed form vs spinor-projector agree to
4.44e-16; θ=90° → exactly 0.5), finalized to the production bar.
