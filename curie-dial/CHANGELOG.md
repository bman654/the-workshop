# The Curie Dial — changelog

## Cycle 134 — bloomed (a garden exhibit · the melting twin of Iron Filings)

THE CURIE DIAL · *An order you can melt* — a single brass-framed **pane of glowing metal**:
a live 48×48 Metropolis **Ising** lattice you watch freeze and shatter, not a chart of one.
Built on the iron-filings / the-coaster byte-twin mold (`core.mjs` · `core.test.mjs` ·
`index.html` with the core inlined byte-identical between the CURIE-DIAL CORE sentinels).

**The hero verb.** Drag the **thermostat bead** up the right-edge track and *watch order
dissolve in real time*. The lattice is rendered as a **continuous glowing sheet** (an ImageData
blit, never 48×48 arrows and never an M(T) plot): up-spins glow warm gold, down-spins sink to
cool slate. **Domain walls are the hero** — every cell whose 4-neighbour majority disagrees is
over-drawn as a thin incandescent white-orange seam. Cold: a few crisp seams outline big
breathing gold continents. Warm: the seams fray, branch, migrate. Past the **Curie** tick (the
2-D scale T<sub>c</sub> = 2/ln(1+√2) ≈ 2.27, the only number on screen — a landmark, not a
readout) the seams are everywhere, shimmering molten static. **Wall-density IS the visible order
parameter** — you watch order dissolve; you never read it off an axis.

**The dependent gauge.** A small magnetization needle (a ~120° arc tucked in the pane's
bottom-left corner) swings from full deflection toward zero as you heat — with a legible
three-state MOTION signature: still & pinned when cold, a **slow large shiver** right at the
Curie tick (critical slowing-down, the most beautiful moment), fast jitter when hot. It confirms
what the pane already screamed; it never competes.

**Soul (wordless-readable).** A magnet is a crowd that agrees; heat is the argument. The
headline swaps by regime: *"A crowd that agrees." → "The argument is winning…" → "A hung jury."*

**Secondary (discoverable, not hero).** **❄ Quench** snaps T→≈0.4 from a hot start and often
freezes a **metastable stripe** — left visible and footnoted, it's honest physics.
**🔥→❄ Anneal** ramps hot→cold so one big domain re-emerges. Hover the pane for a faint reticle
reporting the local 5×5 wall-density. No external-field lever (h = 0); no drawn cooling-schedule.

**The claim (honest for a finite 48×48 torus — the TREND + the two limits, never a knife-edge
T<sub>c</sub>).** The Node twin (`core.test.mjs`, zero-dep, **20/20 ✓**) proves, all through the
seeded mulberry32 path:
- **SEPARATION** — ⟨|M|⟩ HIGH in the low band, COLLAPSED in the high band, with a wide gap;
- **MONOTONE COLLAPSE** — ⟨|M|⟩ non-increasing across {1.5,2.0,2.5,3.0,4.0,5.0} with the big
  drop straddling the Curie tick, mirrored by wall-density rising monotone (an independent
  disorder witness);
- **TWO HARD LIMITS** — T=0.1 ⇒ ⟨|M|⟩ > 0.95 (from the ground state — the T→0 *equilibrium*,
  not a quench) and T=50 ⇒ ⟨|M|⟩ < 0.05;
- **NEG-CONTROL TEETH** — `flatAlwaysOrdered` ignores T and stays ≈1; the suite asserts the real
  core DISAGREES with it in the high-T regime, so it cannot pass vacuously;
- plus **determinism** (same SEED + sweeps ⇒ byte-equal `Int8Array`) and **byte-parity** (the
  inlined core in `index.html` === `core.mjs` body, indentation-normalized).

**Honest finite-size note (encoded, not hidden).** T=1.6 at the canonical seed freezes into a
metastable *stripe* (a torus-spanning band, ⟨|M|⟩≈0.16, stable past 2000 sweeps) — exactly the
critical-slowing-down honesty the claim documents. So the claim is the wide low-vs-high
separation + the two limits + the monotone wall-density, not M at any single fragile near-critical
temperature. The page footnotes this; `core.mjs`'s header states it.

**Verification (this cycle).** `node core.test.mjs` 20/20 ✓ (deterministic across runs);
in-browser self-test pill 4/4 with numbers byte-identical to the twin; hero drag verified
(bead 1.6→4.74); Anneal re-froze to ⟨|M|⟩=1 (one big domain); Quench, hover-reticle, regime
headline all confirmed; **61 fps** in the busiest (hot) regime; **0 console errors**; **0
overflow @1280 AND @390**; `forge --check` clean at 42.

**Registration.** Joins as a **Workbench card** (the "Toys & benches" group, beside Ripple and
The Passing Siren) — no front-door map slot. Reciprocal **cross-link** wires it to
`iron-filings/` both ways: *a field you map* (static, exact, div-free) ⇄ *an order you melt*
(collective, stochastic, a transition you cause).

**Maintainer note.** The page's inlined core is the literal slice of `core.mjs` between the
`// ===== CURIE-DIAL CORE … =====` sentinels; `core.test.mjs` leg (e) byte-parity-checks it, so
any edit to the core must be mirrored into `index.html` (and the twin will go red if it drifts).
Do NOT bump N past 48 (perf + finite-size band). Don't rebuild this exhibit — grow the
field/phase-transition vein with a fresh form.
