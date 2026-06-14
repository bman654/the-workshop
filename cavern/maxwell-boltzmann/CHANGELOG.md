# The Maxwell–Boltzmann Gas — CHANGELOG

A Cavern (Newtonian-drift) bench. The estate's **first bench of heat / thermodynamics**.

## v1 — 2026-06-13 (Opus 4.8, `/fun` BUILD session)

**The physics.** Hundreds of equal-mass **hard discs** bounce in a unit box, colliding
perfectly elastically. From any starting velocity distribution, the disc-speed histogram
**relaxes by itself** to the 2-D Maxwell–Boltzmann (Rayleigh) law
`f(v) = (m·v/kT)·e^(−mv²/2kT)` — order distilled out of nothing but random collisions
(the second law / approach to equilibrium, made visible). Pairs with the Galton bell-curve
("order from randomness") and sits beside Newton's Cradle (the same exact elastic-collision rule).

**The falsifiable crux (the workshop's signature).** The page measures the gas's own
temperature from `kT = ⟨½mv²⟩` (2-D equipartition), draws the M–B curve that temperature
*demands* — **nothing is fitted** — then runs a real **Pearson χ² goodness-of-fit** against
the live histogram every frame:
- a frozen **delta-spike** (all one speed) is **REJECTED** (χ²/dof ≈ 226, p = 0);
- at **equilibrium** it does **not** reject (stable "fits M–B", p comfortably > 0.05);
- the relaxation takes ~2 s on screen — the REJECTED→fits flip *is* the demo.

**Engineering.**
- Pure deterministic CORE: `collideEqual` (equal-mass 2-D elastic exchange along the line of
  centres → conserves p and KE by construction), the M–B pdf/cdf, a parameter-free `chiSquareMB`
  (pools bins with expected < 5; dof = cells − 1 − 1 for the fitted kT), and a from-scratch χ²
  **survival function** (regularized incomplete gamma, series + continued fraction — no libraries).
- Live sim: jittered-grid seeding, wall reflections, **spatial-hash broadphase** (O(N)) for
  disc–disc collisions, sub-stepping so fast discs never tunnel. Fixed **dilute packing
  fraction φ = 0.06** so the ideal-gas M–B law holds cleanly (denser gases measurably deviate —
  the χ² test would correctly flag excluded-volume distortion).
- Verdict **hysteresis**: a 7-frame **median** of the per-frame p-value decides the displayed
  label, so it doesn't flicker on finite-sample noise while still flipping promptly at the
  real equilibrium crossing.
- Three starts: delta-spike (the canonical demo), hot-few/cold-many (visually two-population),
  already-thermal. Sliders: N (60–600), speed ×. Speed→colour (cold blue … hot orange).
- Drops `ws:seen:maxwell-boltzmann` on visit (Survey of Heaven + the Cavern's Quantum-drift
  unlock; registered as a Newtonian-drift ID in `cavern/index.html`).

**Self-test: 14/14** in-page (click the badge for detail) + **5/5** independent Node cross-checks
(`/tmp/mb-node-test.mjs`, run headless against the page's exported CORE):
exact momentum/KE conservation over single + 5000-collision chains (~1e-12); measured kT recovers
true kT; χ² **accepts** a true thermal sample and **rejects** a delta-spike; a real event-driven
positional gas **relaxes from a delta start to M–B** (p > 0.05) while conserving energy (~1e-12);
equilibrium obeys `⟨v²⟩ = 2kT`; the χ² p-value math matches NIST critical values exactly
(SF(11.07,5)=0.0500 …); ∫f = 1, mean = √(πkT/2), peak at v = √kT.

**Browser-verified** (agent-browser, served origin): self-test 14/14 ✓; load→spike REJECTED (p=0,
χ²/dof 226) → ~2 s → stable fits M–B; energy drift ±0.00%; Cavern card + nav + breadcrumb all green
(Cavern index self-test 25/25 with the new card).
