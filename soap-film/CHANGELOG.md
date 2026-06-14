# The Soap Film — CHANGELOG

A Workbench physics bench. A soap film spanning two coaxial wire rings minimises
its **area** (surface energy ∝ area), so it becomes the unique minimal surface of
revolution: the **catenoid** `r(z) = a·cosh(z/a)` — "the catenary, spun about its
axis." Pull the rings apart and the film thins until, past a sharp threshold, it
**snaps** into two flat discs (the Goldschmidt collapse).

A new geometry vein for the workshop: **minimal surfaces / 2-D calculus of
variations**, the higher-dimensional cousin of the catenary (the hanging chain).

## v1 — 2026-06-13 (Opus 4.8, `/fun`)

**The physics, made falsifiable.**
- The neck `a` is fixed by the rings through the boundary-value problem
  `R = a·cosh(h/a)` (rings at `z = ±h`, radius `R`). Written `u = h/a`, this is
  `R/h = cosh(u)/u`, whose minimum `≈ 1.50888` at `u* ≈ 1.19968` sets the **maximum
  separation** that admits a catenoid: `2h/R ≤ 2/1.50888 ≈ 1.3255`.
- **Minimal surface ⇔ mean curvature `H ≡ 0`.** `H = (κ_meridian + κ_parallel)/2`,
  computed from the two principal curvatures of the surface of revolution; on the
  catenoid the two exactly cancel everywhere (machine precision).
- **The Goldschmidt collapse** has two branches: (a) the catenoid still *exists*
  but its area exceeds two flat discs (crossover at `2h ≈ 1.0556·R` for equal
  rings) — the film **snaps to discs** on area; (b) past `2h ≈ 1.3255·R` the BVP
  has **no root at all** — no catenoid can span the gap.

**CORE** (`window.SoapFilmCore` / `module.exports`, DOM-free, headless-auditable):
`solveCatenoidA`, `coshArea_a`, `meanCurvatureCatenoid`, `profileArea`,
`discArea`, `cylinderArea`, `catenoidArea`, `filmState`, `relaxProfile`,
`runSelfTest`.

**Self-test 7/7** (each exercises the real CORE, not the formula):
1. **boundary** — solved neck gives `a·cosh(h/a) == R` (max err 4.4e-16).
2. **minimal** — `max|H| == 0` everywhere on the catenoid (2.22e-16).
3. **area** — closed-form `== ∫2πr√(1+r'²)dz` numeric integral (rel 8e-10).
4. **minimising** — catenoid area `<` cylinder AND `<` a cone-pair competitor.
5. **Goldschmidt** — catenoid==two-disc crossover at `2h≈1.0556R` *and* no
   catenoid past `2h≈1.325R` (both scanned from the geometry — falsifiable).
6. **relax** — a discrete area-relaxation started from a straight cylinder
   *decreases* the area monotonically (6.283→5.992) and converges to the
   catenoid profile (max dev 3.9e-5).
7. **determinism** — the relaxation is reproducible.

**A real bug the headless audit caught.** The first `relaxProfile` used
fixed-step gradient descent; it *diverged* (area went up, profile dev 0.31).
Rewrote it with a **backtracking line search** that guarantees a monotone area
*decrease* every step — the physically honest statement that a soap film only
ever lowers its surface energy. 5/7 → 7/7.

**View.** A rotating 3-D surface of revolution on canvas (orthographic,
painter-sorted translucent quads with a facing-shade, gold wire rings, highlight
meridian ribs, a dashed symmetry axis). The film renders **cyan** when it's a
catenoid and **amber two flat discs joined by a vanishing thread** when
collapsed — the snap is visually unmistakable. Drag to rotate (auto-spin
otherwise).

**UX.** Ring-radius + separation sliders; a "Relax the film" animation (morphs a
straight cylinder down to the catenoid); a Show toggle (film / profile / both);
a "vs. cylinder" overlay; PNG export; 6 frame presets (Fat neck → Classic waist →
The crossover 1.056R → About to snap → Past the cliff → Two discs); a live facts
block (neck `a`, film area, two-disc area, max mean curvature) + a state banner +
an equation panel that names *which* collapse path you're on.

**Verification.** Headless-Node against the actual embedded page code (vm-sandbox
extraction) → 7/7; live in-browser (served origin, agent-browser) → chip 7/7,
canvas inks ~55k px, `ws:seen:soap-film` breadcrumb writes, presets flip the snap
(1.36R → no-solution, 1.30R → area-snap), screenshots in-aesthetic.

**Integration.** Added to the Workbench's *Toys & benches* group, right after
**The Brachistochrone** (its calculus-of-variations sibling). No front-door POI,
no forge artifact touched (`forge --check --all` still 29/29 current), no map
change.
