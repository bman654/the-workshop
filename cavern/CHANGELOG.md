# The Cavern — changelog

*The estate's physics laboratory, quarried into the hillside and kept underground "for safety."
A front-door **wing** (the grand "Physics Lab" seed begun). Two drifts off a central shaft — a warm
Newtonian one and a cold Einsteinian one — and now a third, the **Quantum Drift** (seven benches deep),
which opens once a visitor has walked both. Every bench is one self-contained vanilla HTML file that
proves its own physics exact.*

---

## 2026-06-13 — the Sound Garden meets the Cavern: Hear the Ladder ships (7th Q-bench, 10th overall)

**`cavern/hear-the-ladder/index.html` — Hear the Ladder 🔔** (Quantum drift). The Box and the
Oscillator each *show* a ladder of allowed energies; this bench is the first to make the difference
**audible** — and it's the workshop's first bridge between the **Sound Garden** and the **Cavern**.
Map each energy ladder to a stack of tones (`f ∝ E`) and the truth lands in one second: the
oscillator's *evenly-spaced* rungs become the **overtone series of a single note**, so they fuse into
one pure pitch — *that is why it is called harmonic*; the box's `n²` rungs stretch apart, so the stack
never lines up and rings like a **struck bell** (a clang with no single pitch). One vanilla HTML file
(~430 lines of app over a ~120-line pure CORE), ħ=m=1.

- **The headline physics:** the *same* two ladders the neighbouring benches prove — box `Eₙ = n²π²/2`
  (ratios `1,4,9,16,…`, spreading) and oscillator `Eₙ = ω(n+½)` (even, spacing `ω`). Voiced as partials
  of one fundamental, the oscillator gives the **harmonic series** `1,2,3,4,…` and the box gives the
  **stretched** `1,4,9,16,…`. The ear hears a stack as *one pitch* only when its partials are evenly
  spaced (a single periodic waveform); the box's spacing widens, so it has no single period — a bell.
- **The falsifiable spine (the pure, self-tested CORE):** an **inharmonicity** metric = the relative
  spread of the gaps between consecutive partials. It is **exactly 0** for the oscillator (perfectly
  even ⇒ one tone) and **provably large** for the box (≈38% at 8 partials, climbing as you stack more).
  The mapping/voicing/no-clip math is DOM-free and Web-Audio-free, locked headless in Node first.
- **Self-test 7/7**, proven *both* headless-Node against the actual embedded page code *and* live
  in-browser (badge 7/7, console clean): (1) ladders reproduce the benches' exact formulas; (2) partials
  are the harmonic series vs the stretched `n²`; (3) **the headline** — osc inharmonicity == 0, box ≫ 0
  ⇒ bell; (4) the box partial always sits at/above its harmonic counterpart and the gap grows monotonically;
  (5) voicing keeps the fundamental and drops (never aliases) high box partials past a 7 kHz ceiling, the
  box dropping more; (6) the 1/k roll-off keeps the summed peak under a 0.9 no-clip ceiling.
- **Audio-Lens cross-check (silent offline render of the exact CORE):** the oscillator WAV reads a clean
  **A2** with overtone peaks `A2·A3·E4` (110·220·330 Hz) and a low **180 Hz centroid** (warm, fused);
  the box WAV reads stretched peaks `A2·A4·B5` (110·440·990 Hz) and a high **442 Hz centroid** (bright,
  clangorous) — neither clips. Spectrograms show the oscillator's even comb vs the box's widening gaps.
- **Estate-wide mute:** plays only inside a user gesture (autoplay-safe, lazy graph); honours the shared
  **`ws:pref:muted`** (read on load, live via the `storage` event; a muted user's click unmutes + plays).
  An **A–B** button plays the pure tone then the bell back-to-back. Drops `ws:seen:physics-lab` on a
  direct visit. Wired into the Quantum-drift card list on the wing index (🔔).

The Quantum Drift is now **seven benches**; the "curve machines" cousins aside, the Sound Garden had
*never* touched the Cavern before this — a fresh cross axis opened.

---

## 2026-06-13 — the Quantum Drift goes from one atom to a CRYSTAL (The Lattice ships · 6th Q-bench, 9th overall)

**`cavern/lattice/index.html` — The Lattice ⛓️** (Quantum drift). The bound-state trilogy answered "one
trapped particle"; this bench takes the next, bigger step — **line the wells up in a row, repeated
forever** (the Kronig–Penney model of an electron in a crystal) — and watches the atom's sharp levels
**smear into bands** separated by **forbidden gaps**. This is where band structure (and therefore the
entire metal / semiconductor / insulator distinction) is *born*. One vanilla HTML file (~640 lines),
ħ=m=1; displayed eV are a fixed labelling.

- **The headline physics:** a periodic δ-comb `V(x) = U·Σδ(x−n·a)` (period `a`, dimensionless strength
  `P = U·a`) gives the **dispersion relation** `cos(qa) = cos(ka) + P·sin(ka)/(ka) ≡ f(E)`, `k=√(2E)`.
  Because `cos(qa) ∈ [−1,1]`, an energy is **ALLOWED** only where `|f(E)| ≤ 1` — those intervals are the
  **bands**; everywhere else `|f| > 1` is a **forbidden gap**, an energy no electron in the crystal may
  have. Band **edges** are exactly `f = ±1`, i.e. `qa = nπ` (zone centre / zone boundary).
- **The two limits — the soul of the bench:** crank `P → ∞` (atoms held far apart) and every band
  **narrows onto an isolated atomic level** `Eₙ = n²π²/(2a²)` (the crystal becomes a row of separate
  wells — the bridge back to the Finite Well next door); drop `P → 0` (the free electron) and the **gaps
  slam shut** to a continuous `E = q²/2`. The punchline the prose draws out: fill the bands with
  electrons and a **half-filled band conducts (metal)**, a band **filled exactly to a gap insulates**,
  a thin gap is a **semiconductor** — *why matter is the way it is.*
- **Two views:** the **dispersion** `f(E)` graph (the violet curve threading the green `|f|≤1` corridor,
  amber gap strips between bands) and the **band diagram** `E(q)` over the reduced zone `q: 0 → π/a`
  (the textbook plot — band curves climbing, forbidden gaps as amber bands). Plus band chips (one per
  band, the count is the headline), `P` and `a` sliders, and a periodic-potential overlay sketch.
- **The spine = two INDEPENDENT cross-checks** (Cavern house discipline — closed form vs a different
  algebra): (1) the **transfer matrix** `M = F·D` over one cell (free drift `F` × δ-kick `D`) gives
  `½·tr M(E) == f(E)` to **4.4e-16** over 4000 energies, with `det M = 1` (symplectic) to **8.9e-16** —
  a 2×2 matrix product landing on the same dispersion; (2) a **from-scratch eigensolve of a finite ring
  of N cells** (deflated inverse-power iteration on a cyclic-tridiagonal Sherman–Morrison solve) puts
  **exactly N states in each band** — the one-state-per-atom counting law behind metals vs insulators.
- **Self-test 8/8** (headless-Node against the *actual embedded `runSelfTest()`* + live in-browser,
  served origin :8743, clean console, both views + mobile screenshots reviewed): dispersion == ½·tr M &
  det M = 1 · band edges land on `|f|=1` (max 8.5e-14) · gaps are truly forbidden `|f|>1` · free limit
  shrinks the gap to ~0 · **atomic limit narrows band 1 onto `π²/(2a²)` (rel 0.00%)** · **a ring of N=8
  atoms holds exactly 8 states per band (independent eigensolve)** · `E(q)` spans the band, `f(E)=cos(qa)`
  round-trips (1.1e-9) · deterministic.
- **Integration:** 6th Quantum-drift card in `cavern/index.html` (⛓️) + 2 symmetric self-test checks →
  Cavern landing **23/23 → 25/25** (verified live in BOTH locked and unlocked states). Drops
  `ws:seen:lattice` (bench-internal breadcrumb, not a front-door PLACES id; `forge --audit-seen` still
  13/13). `forge --check --all` clean (29 files).

---

## 2026-06-13 — the Quantum Drift completes the bound-state trilogy (The Finite Well ships · 5th Q-bench, 8th overall)

**`cavern/finite-well/index.html` — The Finite Well 🕳️** (Quantum drift). The realistic well that sits
*between* the Box and the Bowl, and the third corner of the bound-state trilogy: give the box a **real,
finite depth** `V₀` — walls a particle can climb if it has the energy — and two things break that the
infinite box never let you see. One vanilla HTML file (~620 lines), ħ=m=1 natural units; displayed eV are
a fixed labelling.

- **The two headline breaks** (the soul of the bench):
  - the ladder becomes **FINITE** — a well of strength `R = √(2V₀)·a` holds exactly `⌊R/(π/2)⌋+1` bound
    states (always **at least one**, however shallow). Drag depth/width and rungs **snap into being** or
    **evaporate** one by one — a state too shallow to bind simply ceases to exist. (The box's ladder was
    infinite ∝ n²; the bowl's infinite & even ∝ n+½.)
  - the wave **leaks OUT through the climbable walls** and **decays exponentially** with a length `1/κ`,
    `κ = √(2(V₀−E))` — so the **shallowest** rung, clinging just below the rim, leaks the farthest. (The
    box died dead at the hard wall; the bowl had Gaussian tails past soft turning points.)
- **No closed-form ladder** — the bound energies solve a **transcendental match**: with `u=ka`, `v=κa` on
  the circle `u²+v²=R²`, even-parity states satisfy `v = u·tan u` and odd-parity `v = −u·cot u`. The spine
  finds each rung by **bisection** on the parity branch ∩ circle (residual 6.8e-14). Inside ψ is cos/sin,
  outside a decaying exponential; ψ and ψ′/ψ matched at the wall (log-deriv mismatch 2.9e-13).
- **The UI:** a **depth V₀ slider** + a **half-width a slider** (the count of rungs is the live headline);
  **n-chips** for only the rungs that currently exist (odd parity italicized); a ψ/|ψ|² toggle that dots
  the n nodes; a **"shade the leak beyond the walls"** toggle; a drawn finite-well box with the rim line
  (above it = the unbound continuum) and the wall-crossing dots where the exponential tail begins.
- **The independent spine:** the self-test discretizes the **actual stepped potential** `−½∂² + V(x)` on a
  grid and pulls the rungs **from scratch by inverse-power iteration** (Thomas tridiagonal solve + Rayleigh
  quotient) — a different algebra than the transcendental match. NB the **hard step** makes this converge at
  honest **first order O(h)** on a uniform grid (not machine precision): N=800 2.3e-1 → N=1600 1.8e-2, a
  per-rung **relative error 0.13%** — the test asserts this bounded, refining convergence rather than
  pretending to 1e-14.
- **Self-test 8/8** (proven two ways — headless-Node against the *actual embedded `runSelfTest()`* with
  document/localStorage/window stubbed, AND live in-browser, served origin :8742, clean console, screenshots
  reviewed): finite ladder count `⌊R/(π/2)⌋+1` (V0=20→5, V0=1.5→2, V0=200→13, V0=0.01→1, always ≥1) ·
  every rung solves the transcendental match + lies on the circle (6.8e-14) · ψ & ψ′/ψ continuous across the
  wall (2.9e-13) · node theorem (n-th state has n nodes) · **from-scratch FD eigensolve of the stepped V →
  the transcendental ladder** (rel 0.13%, O(h)) · the wave leaks out, shallowest rung farthest
  (n=0 0.6% < n=4 80.9%) · **box recovery** V₀→∞ ⇒ ladder → the infinite box `(n+1)²π²/(8a²)` (rel 3.2e-4) ·
  deterministic. Reference well (V0=20,a=1): E = 0.92, 3.65, 8.09, 14.00, 19.97 — the top rung at 19.97 just
  below the rim 20, an 80.9% leak: it barely binds.
- **Integration:** 5th Quantum-drift card in `cavern/index.html` (🕳️) + 2 symmetric self-test checks →
  Cavern landing **21/21 → 23/23** (verified headless AND in both locked & unlocked browser states). Drops
  `ws:seen:finite-well` (bench-internal, not a front-door PLACES id). `forge --check --all` clean (29 files),
  `--audit-seen` still 13/13. The bound-state corner of the Quantum Drift is now a complete trilogy:
  **Box** (∞ ladder ∝ n², hard walls) · **Oscillator** (∞ even ladder ∝ n+½, Gaussian tails) ·
  **Finite Well** (finite ladder, exponential leak) — the three model shapes of a trapped particle.

---

## 2026-06-13 — the Quantum Drift deepens again (The Harmonic Oscillator ships · the 4th Q-bench, 7th overall)

**`cavern/oscillator/index.html` — The Harmonic Oscillator 🌀** (Quantum drift). The natural next quantum
bench after the Box, and its deliberate *foil*: soften the box's infinite walls into a **parabolic bowl**
`V(x) = ½ω²x²` — the potential of a perfect spring, the curve every stable system falls into near its
minimum. Energy stays quantized, but the ladder changes shape, and the wavefunctions change character.
One vanilla HTML file (~600 lines), ħ=m=1 natural units; the displayed eV are a fixed labelling.

- **The headline contrast with the Box** (the soul of the bench):
  - box ladder ∝ **n²** (uneven, spreading)  ↔  HO ladder = **ω(n+½)** (perfectly EVEN — spacing ℏω, ground ½ℏω > 0)
  - box ψ **vanishes at hard walls**  ↔  HO ψ **leaks PAST the soft turning points** (the ground state spends ~15.7% of its time in the classically-forbidden region)
  - box has **n−1** interior nodes  ↔  HO has exactly **n** nodes (counting from n=0)
- **The physics core (pure & deterministic):** physicists' Hermite polynomials by the stable upward
  recurrence `H_{k+1}=2xH_k−2kH_{k−1}`; the closed eigenstate `ψ_n(x)=(ω/π)^¼/√(2ⁿn!)·H_n(√ω·x)·e^{−ωx²/2}`;
  the classically-forbidden tail `∫_{|x|>x_turn}|ψ_n|²` with the turning point `x_turn=√((2n+1)/ω)`; and a
  **coherent state** `|α⟩` (a displaced ground state, `c_n=e^{−α²/2}αⁿ/√(n!)`) evolved as `Σ c_n ψ_n e^{−iE_n t}`.
- **The independent solve (the bench's spine):** the self-test discretizes the Schrödinger operator
  `−½ d²/dx² + ½ω²x²` on a truncated line into a symmetric tridiagonal matrix and pulls its lowest
  eigenvalues **from scratch by inverse-power iteration** (a Thomas tridiagonal solve per step — variable
  diagonal here, since the potential varies — + a Rayleigh quotient). It converges to the analytic even
  ladder `ω(n+½)` as the grid refines (max |λ_solve−ω(n+½)| N=200 3.6e−3 → N=1400 7.5e−5, O(h²)) — a
  *different algebra* than Hermite's formula, so agreement corroborates rather than asserts.
- **The bench UI:** an even-ladder gauge with an ℏω spacing bracket; rung chips **0…7** (the HO starts at 0);
  a |ψ|²/signed-ψ toggle (signed mode dots the n nodes); a **"show the classically-forbidden tail"** toggle
  that shades `|x|>x_turn` red and marks the turning points; an ω slider (the bowl's stiffness); and a
  **"Launch a coherent state & let it swing"** button — the crown jewel: a rigid, un-spreading Gaussian
  packet that oscillates `⟨x⟩(t)=x₀cos(ωt)` like a classical marble, with a live ⟨x⟩ marker. Cold
  electric-violet (`--q #b18cff`) accent, the warm bowl (`--bowl`) replacing the box's barred-red walls.
- **Self-test 8/8**, proven two ways: (a) headless-Node against the **actual embedded `runSelfTest()`**
  (extracted the inline script, stubbed document/localStorage/window), and (b) live in-browser
  (agent-browser, served origin, clean console, screenshots reviewed — n=5 showed 5 nodes + 7.4% tail +
  the wave poking into the shaded forbidden zone; the coherent packet visibly swung left→right between
  frames while keeping its shape). The eight checks: **even ladder** `E_n=ω(n+½)` (max |gap−ω|=0) ·
  each ψ_n **solves the Schrödinger ODE** (FD residual 1.5e−7) · **orthonormal** ⟨ψ_m|ψ_n⟩=δ_mn (2.3e−11) ·
  **node theorem n nodes** (contrast box's n−1) · **from-scratch FD eigensolve → even ladder** O(h²) ·
  **wave leaks past the walls and the leak shrinks with n** (n=0 15.7%==theory 15.73% > n=1 11.2% > n=5 7.4%) ·
  **coherent state swings classically** ⟨x⟩=x₀cos(ωt) to 3.3e−15, norm=1 to 3.5e−15 · deterministic.
- **A real bug the test caught:** the first node-counter used a naive `prev*cur<0` sign-change scan, which
  *missed* the x=0 node of the odd states (ψ₇) when a grid sample landed exactly on x=0 (there ψ=−0, so
  `0·anything = 0`, not `< 0`). Fixed to track the running **non-zero** sign so a zero straddled by ±
  registers as exactly one crossing — a principled root-cause fix, not a tolerance fudge. 8/8 after.
- **Integration:** a 4th Quantum-drift card in `cavern/index.html` (🌀) + 2 symmetric self-test checks →
  the Cavern landing tally **19/19 → 21/21** (verified headless in BOTH the locked and unlocked states).
  Drops `ws:seen:oscillator` (bench-internal, like `box` — not a front-door PLACES id). `forge --check
  --all` clean (29 files current), `--audit-seen` still 13/13. The **Quantum Drift is now four benches
  deep; the Cavern is seven benches overall.**

---

## 2026-06-13 — the Quantum Drift deepens again (Particle in a Box ships · the 3rd Q-bench, 6th overall)

**`cavern/box/index.html` — Particle in a Box 📦** (Quantum drift). The natural next quantum bench from
`worklog/physics-lab-plan.md` §3, and the **foundation** of the wing's quantum story: confine a particle
to an **infinite square well** (V=0 inside, V=∞ at two walls), and its energy becomes *quantized* — a
ladder of states whose energies climb as **n²**, with no rung at zero (zero-point energy). One vanilla
HTML file, ħ=m=1 natural units, box on [0,1]; the displayed eV/nm are a fixed labelling.

- **The physics core (pure & deterministic):** the closed form `E_n = n²π²/2`, `ψ_n(x) = √2·sin(nπx)`
  (exactly n half-waves, n−1 interior nodes). A time-dependent superposition `Ψ(x,t)=Σ c_n ψ_n e^{−iE_n t}`.
- **The independent solve (the bench's spine):** the self-test discretizes the Schrödinger operator
  `−½ d²/dx²` with Dirichlet walls into a symmetric tridiagonal matrix and finds its lowest eigenvalues
  **from scratch by inverse-power iteration** (a Thomas tridiagonal solve per step + a Rayleigh quotient)
  — a *different algebra* than the n²π²/2 formula — agreeing with the discrete-Toeplitz theory to **8.5e−14**,
  and the discrete eigenvalues converge to the analytic ladder as the grid refines (rel err N=40 8.2e−3 →
  N=1600 5.1e−6, clean O(h²)). So the ladder is corroborated, not asserted.
- **Self-test 8/8** (headless-Node verified against the actual embedded code + live in-browser): (1) ladder
  `E_n/E_1=n²` exact n=1..8 with E_1>0; (2) orthonormality `⟨ψ_m|ψ_n⟩=δ_mn` to **1.55e−15** (analytic vs
  Simpson); (3) **node theorem** n−1 interior nodes n=1..7; (4) FD eigenvalues → closed ladder O(h²);
  (5) from-scratch inverse-power == FD theory **8.5e−14**; (6) time evolution conserves probability
  (∫|Ψ|²=1 to **2.5e−15**); (7) **selection rule** — ⟨x⟩ swings 0.357 for a *mixed-parity* (1+2)
  superposition but is **frozen at ½** (4.9e−15) for same-parity (1+3), the quantum origin of which
  transitions emit light; (8) deterministic.
- **The bench (browser-verified, served origin, clean console):** an energy-ladder gauge (rungs n=1..8,
  hot rung glows) beside the box; click a rung-chip to see its `|ψ|²` probability hump + optional signed
  ψ with its **interior nodes marked**; a width-L slider sinks/raises the whole ladder; a **Mix** button
  superposes rungs 1+2 and *evolves* it — the bound packet visibly **sloshes** side to side with a live
  ⟨x⟩ marker (verified animating: ⟨x⟩ moved right→left between frames). Matches the violet Quantum-drift
  styling (the same template as Tunnelling). Drops `ws:seen:box`.

**Integration:** added a 3rd bench card to the Quantum Drift in `cavern/index.html` (📦, proof badge
"ladder E_n ∝ n² == a from-scratch eigensolve · orthonormal to 1e−15") + two symmetric self-test checks
(box link present-iff-unlocked + relative), so the Cavern landing self-test is now **19/19** (was 17/17).
Browser-verified end-to-end: walked-both-drifts reveals the drift with all three benches; the box card
links `box/index.html` (relative). `forge --check --all` clean; `--audit-seen` still 13/13 (the `box`
breadcrumb is bench-internal, not a front-door PLACES id). **The Quantum Drift is now three benches deep.**

---

## 2026-06-13 — the Quantum Drift deepens (Quantum Tunnelling ships)

*The Quantum Drift had one bench; the Newtonian and Einsteinian drifts each have two, so the new drift
felt thin. This session built its second bench — **Quantum Tunnelling** — to give the deepest drift the
same two-bench body as its siblings. Built directly in the main tree, browser-verified on a served origin
(self-test 7/7, locked & unlocked cavern both 17/17), no forge needed (the Cavern is plain HTML).*

**Quantum Tunnelling** (`cavern/tunnelling/index.html`, **712 lines**) ⛰️ — a particle rolls at a
rectangular barrier it hasn't the energy to climb. Classically it always reflects; quantum-mechanically
the wavefunction decays through the wall and a sliver transmits. The picture renders the iconic three
regions — incident wave + reflection ripples (violet), exponential evanescent decay inside the barred
(red, classically-forbidden) wall, and the small transmitted travelling wave on the far side — over an
energy-level diagram with the dashed **E** line sitting below the **V₀** top.

*The physics core is pure & dimensionless (ħ = m = 1).* Self-test **7/7**, falsifiable:
1. **E < V₀ tunnels** — `0 < T < 1` where classical physics demands exactly 0 (T = 0.420 at E = ½V₀).
2. **closed form == an independent transfer-matrix wave solve** — the textbook
   `T = 1/(1 + V₀²sinh²(κL)/(4E(V₀−E)))` (branch-continued to `sin` for E > V₀) is corroborated, not
   asserted, against a 2×2 complex transfer matrix that matches ψ and ψ′ at both walls by a different
   algebra: **max |Δ| = 1.9e−14 over 56 configs** (E/V₀ from 0.10 to 9, two heights, three widths).
3. **unitarity R + T = 1** to **3.3e−16** (probability conserved — nothing lost or made).
4. **exponential fragility** — for a thick wall `d ln T/dL → −2κ` (measured −2.17 vs −2.19); this
   exponential sensitivity to width is why α-decay half-lives span ~24 orders of magnitude.
5. **resonant transparency** — above the barrier, when `qL = nπ` the wall is **perfectly clear, T = 1**
   (T = 1.000000000000 at the first resonance).
6. **high-energy limit** — E ≫ V₀ ⇒ the wall vanishes, T → 1 (0.999995 at E/V₀ = 200).
7. **monotone in width** — at fixed sub-barrier energy, a wider wall strictly tunnels less.

Drops `ws:seen:tunnelling`. Live readout shows T, R, R + T (unitarity, 7 digits), the regime
(tunnelling / grazing / over-barrier), the decay rate κ inside the wall, and the closed-form-vs-numeric
|Δ|. Controls: Energy E (as a fraction of V₀), barrier height V₀, width L, a **Send a wavepacket**
animation, and a **Find a resonance** button that jumps E to the first `qL = π` transparency.

**The drift card** (`cavern/index.html`) — a second `a.bench` was added to `#quantumDrift` (⛰️
Quantum Tunnelling, proof line "transmission T closed-form == transfer-matrix solve · R + T = 1 exact").
The landing's self-test is unchanged at **17/17** (the bench-enumeration checks are `every`/`allRelative`
predicates, not a fixed count, so a second quantum bench passes cleanly); verified in a served browser
that the unlock still reveals the drift and now shows **both** quantum benches.

---

## 2026-06-13 — the Quantum Drift opens (the Double Slit ships)

*The "deferred" back-passage from the wing-opening entry below is no longer deferred. The sealed shaft
now opens — in-page, spatially — and its first bench is live. Built this session as a lead/deputy split
(the lead wired the reveal in the main tree; a per-bench deputy built the bench in a `bench-double-slit`
worktree), then integrated and re-verified end-to-end in a served browser.*

**The unlock — a spatial, in-page reveal** (`cavern/index.html`). The barred quantum shaft opens once
the cave "remembers those who walk both drifts": at least one **Newtonian** bench seen AND at least one
**Einsteinian** bench seen, read from the `ws:seen:<id>` breadcrumbs the benches drop. The predicate is
pure and self-contained — `walkedBothDrifts(store)` over a `{has(k)}` store (`NEWTONIAN_IDS =
['cradle','brachistochrone']`, `EINSTEINIAN_IDS = ['light-clock','precession']`); storage-off stays
harmlessly locked. When earned, the sealed `#vault` swaps out (`body.quantum-open #vault{display:none}`)
and the `#quantumDrift` section reveals — a cold electric-violet drift, distinct from the Undercroft's
cellar machinery (this reveal is spatial and stays inside the cave). The Cavern landing's self-test grew
**8/8 → 17/17**: the 7 original structural checks plus the predicate proved exact over synthetic stores
(empty→locked, only-Newtonian→locked, only-Einsteinian→locked, one-of-each→OPEN, brachistochrone counts
as Newtonian, a non-drift breadcrumb→locked, storage-off→locked) and a "rendered reveal matches the live
predicate" check (no drift between logic and DOM; Double-Slit link present iff unlocked, and relative).

**The Double Slit** (`cavern/double-slit/index.html`, **917 lines**) 🎯 — the experiment Feynman called
"the whole mystery of quantum mechanics." Fire particles one at a time at a pair of slits; each lands as a
single dot, yet the dots pile into bright/dark fringes. Close a slit — or merely **watch** which one each
particle takes — and the fringes wash out. Self-test **8/8**: **fringe spacing measured = λL/d** by
root-finding the dark fringes from `dI/dy=0` (no reference to the closed form) → Δy = 5.000000000 mm vs
λL/d = 5.000000000 mm, **rel err 1.73e-16**; maxima at `d·sinθ=mλ`, minima at `(m+½)λ` (dark orders
`I/I₀ = 1.76e-30`, exact zeros); **interference == the cross term** `2Re(ψ₁ψ₂*)` proved equal to
`4·sinc²(α)·cos²(β)` (max |Δ| = 8.88e-16 over 4000 pts); close-slit → envelope only (visibility
1.0000 → 0.0238); **which-path detector → fringes wash out** (incoherent sum, cross term destroyed);
**Born rule** — 300k seeded particles, 40 bins, reduced χ² = **1.029**; **falsifiable control** — the same
counts reject a flat target at reduced χ² = **8399**; deterministic seed + exact λ,d,L scaling (×2→2.0,
d×2→0.5, worst dev 0). Pure/deterministic core, validated byte-identical in Node and in the page. Honest
far-field/Fraunhofer small-angle convention (stated in the readout), schematic barrier mask (µm slits are
invisible at cm-fringe scale, commented as such). Fully self-contained — zero external URLs/CDN/deps.

**Integration & QA (served origin, real browser):** the Cavern landing self-test holds **17/17** in both
states; **locked** shows the sealed vault with the Quantum Drift hidden; dropping one Newtonian +
one Einsteinian breadcrumb and reloading flips it **open** (vault `display:none`, drift revealed, the
`double-slit/index.html` link present and relative); clicking through loads the bench, whose own self-test
reads **8/8**. Zero console errors throughout. The `bench-double-slit` worktree was retired after the one
new file was lifted into the main tree (nothing else touched).

---

## 2026-06-13 — fix: Newton's Cradle drag direction

**Bug (post-ship, reported by Brandon).** Grabbing a ball to drag it aside clamped to the *wrong* half —
the left ball could only be pulled *inward* (up to the right, through the row) and the right ball only up
to the left. **Fix** (`cradle/index.html`, `pointerDown`): the outward `dragSign` was inverted — the left
group should swing to −θ (left) and the right group to +θ (right). One-line flip. The 6/6 self-test is
unaffected (it doesn't exercise dragging); the corrected clamp was re-verified in Node and with a real
in-browser drag (left ball now lifts outward to the left).

---

## 2026-06-13 — the wing opens (Opus 4.8, `/fun`)

**The footprint (front door).** `index.src.html` gained a `drawCave(g,r)` footprint drawer — an
irregular rough-rock outline (deliberately *not* the manor's clean rectilinear slabs), a braced **adit**
opening toward the manor, a mine-rail running into a faint inner chamber, a blast-shutter pip at the
mouth, and scattered rock-spoil. Registered in the `DRAW` map as `cave`. One `PLACES` entry:
`id:"physics-lab"`, a **cold mineral teal** accent (`#7fd4c0`, distinct from the Hall's sky-blue and the
Undercroft's brass), the atom glyph ⚛️, placed on the lower-centre-right grounds (`x:790, y:720`) to
frame the manor opposite the Hall of Mirrors. Forged → browser-verified **0 label overlaps**, the survey
path draws to the cave mouth, the Survey-of-Heaven breadcrumbs stay clean (the cave is in no WING list).

**The wing landing.** `cavern/index.html` — the concept is *"two drifts off a central shaft."* The cave
forks into **The Newtonian Drift** (warm lamplight: Newton's Cradle, the Brachistochrone) and **The
Einsteinian Drift** (cold starlight: the Light Clock, Mercury's Precession), with a **sealed Quantum
back-passage** rendered as a barred, draughty shaft — the legible on-ramp for the future hidden sub-wing
(*"the cave remembers those who walk both drifts"*). Drops `ws:seen:physics-lab`. Self-test **8/8**
(structure: two drifts present, four benches linked + all relative, the breadcrumb dropped, the sealed
vein present). Raw-rock danger-lab aesthetic, kept tonally distinct from the candlelit Undercroft.

**The first benches** (each built in its own `bench-*` worktree by a per-bench deputy, browser-verified on
a served origin, self-test green, clean console, ~60fps; 895 / 999 / 846 lines):

- **The Light Clock** (`cavern/light-clock/`, 895 lines) ⏱️ — special relativity. A bouncing-photon clock;
  push the velocity toward *c* and it slows. A clock view (moving vs rest) + a **Minkowski light-cone**
  spacetime panel (tilting ct′/x′ axes, invariant hyperbola, event projections). Self-test **7/7**: **γ from
  the photon-slant geometry == the closed form** — by bisection on T=√(L²+(β·T)²), independent of any
  1/√(1−β²) algebra, across 501 β-values, to **2.38e-13**; the **interval s²=t²−x² is invariant** under 4000
  random events × Lorentz boosts (|Δs²|<1e-12, tightest 3.11e-13); velocity addition stays strictly < c
  (5000 sub-c pairs); boost∘inverse-boost == identity (4.48e-13); length contraction L/γ from boosted rod
  endpoints (7.44e-15); **falsifiable control** — the Galilean transform wrecks the interval (error 7.23e+1
  ≫ tol); limits & monotonicity (γ(0)=1 exactly; γ rises strictly with β). At 0.99c the rest clock shows
  21 ticks vs the moving clock's 3.
- **Newton's Cradle** (`cavern/cradle/`, 999 lines) ⚙️ — elastic collisions; conservation of momentum AND
  kinetic energy, with honest dissipation when restitution < 1. A swinging brass-ball cradle (3–7 balls,
  lift-k stepper, restitution + unequal-mass sliders, drag/click-to-lift) with a live momentum / KE /
  total-E readout. Self-test **6/6**: **elastic pairwise collision conserves p AND KE** to <1e-12 over 4000
  random pairs (tightest 5.68e-14); **lift k ⇒ exactly k swing out** for all N∈[3,7], k∈[1,N−1] at e=1 (the
  cradle theorem); **inelastic is honest** — at e<1, p conserved but KE strictly decreases; equal-mass
  head-on swaps velocities exactly; **falsifiable control** — the naive "both balls stop" rule is caught as
  KE-destroying; unequal masses at e=1 break the tidy "k out" rule yet both ledgers stay closed (<1e-9).
  Live: pulling e to 0.75 stair-steps total-E 3.13 → 0.63, momentum conserved at every click.
- **Mercury's Precession** (`cavern/precession/`, 846 lines) ☿ — the GR perihelion advance; lands on the
  famous 43″/century, with the Newtonian control precessing exactly zero. Integrates the relativistic Binet
  orbit `u″ = −u + GM/h² + (3GM/c²)u²` (RK4) and draws the walking rosette; a Newton/Einstein toggle, a
  visual-exaggeration slider (×1→×1M; real Mercury is 0.10″/orbit — invisibly small — so the *drawing* is
  amplified while numbers + self-test use the **true** physics), a planet picker and e/a sliders. Self-test
  **6/6**: **Mercury → 42.981″/century** (closed form 6πGM/(c²a(1−e²)) × 415.2 orbits/cy — computed, not
  baked; |Δ from 43.0|=0.019″); **pure Newtonian 1/r² ⇒ precesses exactly 0** (RK4 drift 5.3e-14 rad/orbit —
  the closed ellipse); **numerical drift == closed form** at true GR strength (rel err **1.3e-7**); **h
  conserved** to 1.5e-14 over 2 orbits; **exaggeration linear & honest** (drift ×2 with ε, ratio 2.0004);
  **advance ∝ 1/(a(1−e²))** (halving the semi-latus rectum doubles the creep; Icarus 10.06″/cy). Headline
  reads 42.98 ″/century.

**Integration & QA (served origin, `?v=N` cache-bust):** all 4 bench links resolve **200**; the Cavern
index self-test stays **8/8** with `ws:seen:physics-lab` dropped; the front door places **12 POI labels,
0 overlaps** (the LabelPlacer DOM-truth check). Each Einsteinian/Newtonian bench drops its own
`ws:seen:<id>` (`light-clock` / `cradle` / `precession`) so the future "walked both drifts" quantum unlock
can read them.

The **Brachistochrone** (built earlier, lives on the Workbench) is cross-linked into the Newtonian drift
— it genuinely belongs to both — rather than duplicated.

**Deferred (a future session):** the rest of the **Quantum Drift** — Particle-in-a-Box / Tunnelling, per
`worklog/physics-lab-plan.md` §3. *(The Double Slit and the "walked both drifts" `ws:` unlock predicate
shipped 2026-06-13 — see the top entry. The drift now exists, so new quantum benches just slot in beside
the Double Slit behind the same unlock.)*
Also deferred (a consideration, not a mandate): a Survey-of-Heaven "Experimenter" constellation for the
cave — best wired once the wing has filled out and the Quantum unlock gives a reason to reward exploring it.
