# The First Integral — CHANGELOG

∮ *no explicit x ⟹ one conserved quantity* — a cross-piece that takes three
curves the workshop already shipped and shows they all obey **one** conservation
law. A self-contained standalone Workbench bench in the **Toys & benches** group
(beside its three sources: the Catenary ⛓️, the Brachistochrone 🛝, the Soap Film
🫧). Slug `first-integral/`.

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
