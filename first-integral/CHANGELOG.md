# The First Integral — CHANGELOG

∮ *no explicit x ⟹ one conserved quantity* — a cross-piece that takes three
curves the workshop already shipped and shows they all obey **one** conservation
law. A self-contained standalone Workbench bench in the **Toys & benches** group
(beside its three sources: the Catenary ⛓️, the Brachistochrone 🛝, the Soap Film
🫧). Slug `first-integral/`.

---

## v2 — the bowl you can't get below (2026-06-15, cycle #59 of the fun-forever loop)

**Re-souled to a touchable form.** v1 was three side-by-side flat-strip explainers —
correct, but a chart-museum register. v2 turns the headline into a **thing you grab**:
the true curve sits at the **bottom of a bowl** and you try (and fail) to beat it.

### The new form (FORM EXPRESSES CONTENT)
- **Two-column hero** (stacks ≤820px): LEFT = the touchable chain + a reactive
  H-strip; RIGHT = the big **COST-BOWL** gauge (the emotional centre). **Tabs**
  switch ONE curve at a time (chain ⛓️ / slide 🛝 / soap-neck 🫧) so the minimum is
  the star, not a 3-up comparison.
- **The curve you grab.** Beads ride the true extremal; ends pinned (Dirichlet).
  Grab an interior bead and drag — the curve deforms as a **smooth C¹ raised-cosine
  bump** centred on the dragged node (width ~⅓ span, zero at both pins) — a kink
  would look broken on a chain. Cursor grab→grabbing (sibling Catenary convention).
  On release: an **eased spring-back** that lands EXACTLY on the analytic sample
  (the visual eases; the true samples are untouched, so the strip returns true-flat).
- **The cost bowl** (hero gauge). A filled translucent gold parabolic well; a bright
  dot rides it. Drag magnitude → horizontal position; **measured ΔI = action(pulled)
  − action(true)** → height up the wall. The dot rests on the floor at the true
  curve, **rises on ANY pull** (up or down, any node), and **cannot go below** the
  dashed "FLOOR — the true curve" line. The rim is the **measured ΔI swept over a
  drag** (the data IS the shape), with a thin dashed **∝ d²** reference overlaid.
  Badge: `ΔI = +0.0203` / idle `ΔI = 0 — you are at the minimum`.
- **The H-strip** (demoted to evidence). Flat gold at rest; on drag it **buckles**
  and the arc segments whose Euler–Lagrange residual breaks tolerance light **red**
  — on BOTH the strip and the curve. Readout `H flat → wavers 66%`.
- **Idle hook** — the canned impostor (the v1 circular arc) is ghosted dim with its
  bowl-dot already parked HIGH up the wall: "here's a bad guess, cost is way up —
  drag the bead to beat it." A lightweight toggle (catenary tab only).
- **Self-earned taunt** on each release: `+0.266 — still uphill. The floor is the law.`
- **prefers-reduced-motion** respected — no spring; snaps instantly to the
  dragged/true state, the bowl dot jumps rather than eases. (v1 had no such rule.)

### The math stays a quiet, PROVABLE layer (the OTHER half of the story)
v1 proved the true curve **conserves** H. v2 adds the deeper claim: it **minimises**
the action `∫f dx`, so any dragged perturbation **costs more**. `core.mjs` gains three
surgical pure functions between the same sentinels (so re-extraction parity holds):
- `fCatenary(y,yp) = y·√(1+y′²)` — the action integrand.
- `action(samples,fFn)` — discretised `∫f dx`, **midpoint rule**, slope **recomputed
  per segment from the actual node positions** (load-bearing: a bumped y MUST change
  the slope, or the minimum is a fiction).
- `perturb(trueSamples,k,δ)` — move one interior node by δ, endpoints pinned (the
  single-node discrete bump that is the self-test atom; the on-screen drag uses the
  smooth spline bump but feeds the SAME `action()` with recomputed slopes).

**Two-register slope model** (honoured so the headline can't self-contradict): the
**quiet proof layer** (the original 10 checks + the at-rest strip) uses the EXACT
analytic `yp` (sinh, cot(τ/2)) → flat to ~1e-15, untouched. The **live-drag / action
layer** recomputes `yp` from the deformed curve (segment slopes inside `action()`,
central-diff for the strip). The true-curve baseline under recomputed slopes wobbles
~0.5% — correct and expected; the drag response climbs cleanly above it. Analytic
slopes never feed the action-minimum check; FD slopes never feed the 1e-9 check.

### The new claims — proven EXACT (catenary only; slide/film bowls are visual)
- **(11) MINIMUM** — over interior nodes × deltas {±0.04…±0.005},
  `action(perturb(cat,k,δ)) − action(cat) ≥ 0` with **no slack** (worst measured
  **+1.4e-4 ≥ 0**). Any dragged perturbation has action ≥ the true action.
- **(12) QUADRATIC by Richardson halving** — with base d≈0.004,
  `R = (I(d)−I0)/(I(d/2)−I0) → 4` as the perturbation halves; `|R−4| < 0.1`
  (measured **R=3.91**). The discriminating quadratic-minimum test — small-delta
  regime (a large d bends R via the cubic tail; `ΔI/δ²→const` does NOT converge for
  the midpoint integrator, so it's deliberately not used).
- **(13) H BREAKS PAST THE FLOOR** — a `d=0.02` bump makes the FD/segment-slope
  `hCatenary` relDev **27.3%** (>0.5% baseline, >20×), the SAME slopes the live strip
  shows — number and visual agree. (Not compared against the 1e-9 floor.)
- **(14) DETERMINISM** — `action(cat)` rebuilt twice is byte-identical (drift 0).

### Self-test — GREEN, deterministic
- in-page chip: **15/15 ✓** (browser-verified at `:8743`, 0 console errors,
  ~0.68 ms/frame render path during a live drag → ample 60fps headroom)
- Node twin `core.test.mjs`: **45/45 ✓**, exit 0, inlined core **byte-identical** to
  `core.mjs` (re-extraction parity holds — the three new functions live between the
  sentinels), action minimum re-derived independently (ΔI≥0 over a fine sweep, R→4,
  strict positivity, H breaks past floor).

### Browser-verified (`fi-c59-verify` session, `:8743`)
At rest: chip 15/15; chain with beads + open-circle pins; H-strip dead-flat gold
(H=0.85000=a); bowl dot resting on the green FLOOR line; measured rim + cyan ∝d²
dashed reference; impostor dot parked high-right. On a drag-up: the chain bumps
smoothly and reddens gold→bad where the residual breaks; the H-strip buckles to a red
wave (**66%**); the bowl dot rides UP the left wall (above the floor, **ΔI=+0.2663**);
badge flips red. On release: spring-back to ΔI=0 green + the taunt fires. All three
tabs switch cleanly (the slide is also draggable, ΔI climbs; the ghost toggle hides
off-catenary); 0 console errors after tab cycling.

### Integration — preserved
- **Route + Workbench card** (L440, *Toys & benches*, beside its three sources)
  **unchanged**; the three **inbound sibling cross-links** (catenary / brachistochrone
  / soap-film foot teasers) still resolve; the three **outbound footer links**
  unchanged.
- **NEW: drops a `ws:seen:first-integral` breadcrumb** on load (v1 was breadcrumb-exempt;
  v2 self-registers like the front-door surfaces).

---

## v1 — three curves, one law (2026-06-14, cycle #17 of the fun-forever loop)

**The one idea.** The hanging chain (catenary, `y=a·cosh(x/a)`), the fastest slide
(brachistochrone, the cycloid `x=r(τ−sinτ), y=r(1−cosτ)`), and the minimal soap
film (catenoid, `r=a·cosh(z/a)`) are each an **extremal** of an integral
`∫f(y,y′)dx` whose integrand `f` carries **no explicit x**. Whenever `f` has no
explicit x, the Euler–Lagrange equation admits a **first integral** — a conserved
quantity along the extremal (the **Beltrami identity**, the 1-D Noether/energy
theorem of the calculus of variations):

> **H = f − y′·(∂f/∂y′) = const   along the whole arc.**

This piece takes each curve's OWN shipped parametrisation, plugs it into ITS OWN
Beltrami integrand, and proves `H` is **flat to machine precision** and equal to
the predicted closed form — plus a negative control that rejects a wrong curve.

### The three integrands (derived in the core's block comments)
- **Catenary** — minimise potential energy `∫ y·√(1+y′²) dx`. f has no explicit x
  → `H = y/√(1+y′²) = const = a` (the catenary parameter). For `y=a·cosh(x/a)`,
  `√(1+y′²)=cosh(x/a)`, so `H = a·cosh/cosh = a` — FLAT, equal to a itself.
- **Brachistochrone** — minimise descent time `∫ √((1+y′²)/(2y)) dx` (y down from
  the start). f has no explicit x → `H = 1/(√(2y)·√(1+y′²)) = const`, which is the
  classic first integral `y·(1+y′²)=2r` for the cycloid (so `H=1/(2√r)`). The time
  integrand is **singular at the y=0 cusp** → the flat-line check rides the **OPEN**
  τ-window `(0.45, 2.55)`, never the endpoints.
- **Soap film / catenoid** — minimise surface area of revolution `∫ y·√(1+y′²) dx`
  (same form as the catenary's energy → this is WHY the film is also a cosh).
  `H = y/√(1+y′²) = const = a` (the neck radius / waist). Derived a SECOND,
  independent way here — area, not energy → same conservation law, different physics.

### The falsifiable claim — proven EXACT
For each of the three shipped curves, sample its own Beltrami `H` at 240+ points
along the arc (open interval for the brachistochrone) and assert
`max|H−H̄|/|H̄| < 1e-9` (flat to machine precision) AND that the const equals the
predicted closed form (catenary `a=0.85`; catenoid neck `a=0.62`; cycloid
`2r=1.1`, `H=1/(2√r)`). Measured: catenary `rel 4.4e-15`, brachistochrone
`2.5e-15`, catenoid `3.8e-15` — flat to ~1e-15, ~6 orders below tolerance.

**The negative control with teeth.** A wrong curve fed into the **catenary's** H
must visibly waver. Two impostors through the same two pins as the true cosh:
- a **circular arc** → H swings by **88.8%** along the arc (≫ 1e-9 → rejected);
- an **equal-endpoint parabola** → H swings by **53.5%** → rejected.

The impostor/truth flatness ratio is `~2e14`: the law unmistakably discriminates.
Only the true extremal conserves H (like the catenary bench's own check #7).

### Architecture — one core, two callers, byte-identical
- `core.mjs` (the sole authority): the three integrands, the three curve samplers,
  the two impostor samplers (arc + parabola), the `flatness` metric, `buildPanels`,
  and `runSelfTest` (11 checks).
- `index.html` inlines a **byte-identical** copy of that core between
  `// ===== FIRST-INTEGRAL CORE (byte-identical to core.mjs) =====` /
  `// ===== END FIRST-INTEGRAL CORE =====` sentinels; the render spine calls it.
  Three responsive panels (3-across desktop → 1-column ≤880px), each drawing its
  curve and a thin "H along the arc" strip that renders a **level line** for the
  true curve and **wavers** for the impostor (pixel-measured: 24px spread for the
  impostor strip vs 1px for the flat ones). A topbar `runSelfTest()` chip.
- `core.test.mjs` (the Node twin, **34/34**): runs the full in-page self-test,
  then re-derives every claim independently (catenary H==a analytically; the two
  brachistochrone forms agree pointwise; the cycloid window keeps y>0; the
  impostor/truth ratio >1e6; determinism), and asserts the inlined core is
  byte-identical to `core.mjs` (re-extraction parity, indentation-normalised).

### Self-test — GREEN, deterministic
- in-page chip: **11/11 ✓** (browser-verified, 0 console errors)
- Node twin: **34/34 ✓**, exit 0, byte-identical across two runs

### Browser-verified
`ws-fi-c17` session, `:8794`, `?v=` cache-busted: chip reads PASS; the three flat
strips render level (H = 0.850000=a, 0.674200=1/(2√r) with y·(1+y′²)=1.1=2r,
0.620000=neck a); the impostor toggle turns the catenary panel red and its strip
visibly wavers (88.8%, 24px pixel spread); 0 horizontal overflow at desktop
(1280) AND mobile (390/360); 0 console errors; clean static render (no animation
loop — draws on load + resize, so effectively idle CPU).

### Integration
- **Workbench card** added in **Toys & benches** beside catenary/brachistochrone/
  soap-film, stretched-link `<div class="card"> + <a class="card-link">` pattern
  (the inner blurb links use the global `.blurb a` z-index:2 rule → clickable over
  the stretched link; **0 nested anchors** verified at desktop + 360px).
- **Reciprocal "↗ The First Integral" cross-teasers** added to all three source
  benches: catenary's foot, soap-film's foot, brachistochrone's self-test foot.
- NOT a front-door page (Workbench standalone) → exempt from the `ws:seen`
  breadcrumb rule; no breadcrumb dropped.
- `node tools/forge/forge.mjs --check --all` stays **30/30** (no forge artifact
  touched — all five files are plain standalones).
