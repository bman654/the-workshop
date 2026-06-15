# The Conservatory — changelog

The estate's **living-systems wing** — population dynamics under glass. The first
front-door *wing* to open since the estate started going wide; the grounds spread
for the first time.

---

## Cycle #31 — the wing opens (front-door footprint + landing + first bench)

A big swing (BUILD / grounds). The Conservatory enters the estate as a new
front-door footprint, with a hand-authored glasshouse landing and its first live
bench. Grafts from the three competing explorer concepts: #0's "you walk IN"
glasshouse interior + the conservation proof, #1's phase-plane-as-floor signature
and footprint-is-a-miniature, #2's file split + crank interaction + kinship to the
Gardens.

### The conceit
Two populations breathe in and out of balance: **hares** (prey, x) and **lynx**
(predators, y), under the Lotka–Volterra field

    x' =  a·x − b·x·y
    y' = −c·y + d·x·y      with a=1.1, b=0.4, c=0.4, d=0.1.

The orbit is **exact and closed** — a conserved first integral holds along every
true trajectory:

    V(x,y) = d·x − c·ln x + b·y − a·ln y   =   const   forever.

(The brief's δ·x − γ·ln x + β·y − α·ln y maps δ=d, γ=c, β=b, α=a.) The level-sets
of V are the closed loops in the hares×lynx plane. The fixed point (c/d, a/b) =
**(4, 2.75)** is a **CENTER**, not a focus: the Jacobian's trace is 0 ⇒
eigenvalues are pure-imaginary ±i√(ac) ⇒ orbits neither spiral in nor out. The
linearized period there is **T = 2π/√(ac) = 9.472**.

### The teeth (the falsifiable claim, shown numerically AND visually)
- **RK4** (structure-preserving, tight step) keeps V flat to **~machine precision**
  and the loop closes — measured **max|V−V₀| = 7.9e-12** over a full period.
- **forward-Euler** (the naive control) **provably leaks**: V climbs
  **monotonically outward**, **3.1e-2** at the same dt — the bead spirals off its
  true ring and never returns. *A tainted control that MUST fail, and does.*
- The contrast is shown both as a chip (the live |V−V₀| readout + the V-meter
  needle) and visually (the bead's red spiral leaving the green level-set).

### What shipped
- **Front door** — appended one `PLACES` entry (`id:"conservatory"`, glyph 🌱 —
  *not* 🌿, which is strange-garden's), a NEW footprint kind `glasshouse-wing`
  (distinct from strange-garden's `glasshouse`): a gabled mullion grid (kin to the
  gardens) with the parterre-at-heart replaced by the limit-cycle level-sets in
  plan — 2 concentric orbit-ellipses about a centre fixed-point dot (the
  footprint is a miniature of the conceit). Forged + label-collision-clean.
- **`conservatory/index.html`** — hand-authored landing: an iron-and-glass vault
  hero (SVG arched ribs, pale-green skylight, perspective floor); *the light on the
  floor* — a glowing sunspot tracing the TRUE level-set (computed by the shared
  core, not a faked ellipse); the planted bed (a glass terrarium you look INTO, the
  bench card with a live phase portrait); three legibly-empty planters (logistic /
  SIR / replicator); a cross-wing bridge to the First Integral; the
  `ws:seen:conservatory` breadcrumb; an 8/8 structural self-test.
- **`conservatory/predator-prey/`** — the first bench, the first-integral file
  split: `core.mjs` (pure math, sole authority) + `core.test.mjs` (Node twin,
  31/31) + `index.html` (the instrument, vanilla, no deps, no network). The glass
  terrarium with hare/lynx dot-clouds (an honest *rendering* of the continuous ODE,
  not an agent sim), the back-glass phase portrait with the moving bead, two
  quarter-lagged time-series ribbons, the V-meter needle, and the load-bearing
  **RK4 ⟷ forward-Euler** toggle + amplitude ("lift the hares") + dt sliders +
  a draggable time crank + pause. Reduced-motion-safe. In-page self-test 6/6.

### The self-test (6 in-page checks; 31 in the Node twin)
1. **Conserved along the orbit** — RK4 max|V−V₀| < 1e-10 (7.9e-12); loop closes.
2. **Euler provably leaks** — drift > 1e-2 (3.1e-2), positive (outward) & monotone.
3. **4th-order convergence** — dt→dt/4 shrinks drift ≥10× (≈410× measured).
4. **Fixed point & center** — exactly (4, 2.75); both f=0; Jacobian trace=0 ⇒
   pure-imaginary ±i√(ac) ⇒ a center; period 2π/√(ac)=9.472.
5. **Quarter-lag** — cross-correlation of x(t),y(t) peaks at ~T/4: predators trail
   prey a quarter cycle. (Seeded NEAR the centre so the linearized period applies —
   the period-formula scope guard.)
6. **Determinism** — identical inputs ⇒ byte-identical trajectory.

Plus a re-extraction parity check: the core inlined in `index.html` (between the
`// ===== PREY-CORE` sentinels) is byte-identical to `core.mjs`, so "self-test
green" can't drift from the page.

### Honest accounting
- The dot-clouds are a **rendering** of the continuous ODE populations, not an
  independent agent sim — the ODE *is* the system; the cloud is its portrait, and
  the bead on the back glass is the exact state. The copy says so.
- The period formula 2π/√(ac) is the **linearized** period; big boom-bust loops run
  slower (measured T_big ≈ 10.8 at a fat loop). The period-matches-formula assertion
  only fires near the centre — both explorers #1 and #2 flagged this; honored.
- Orbit period is measured by a **Poincaré section** (y=y*, sub-dt interpolated),
  not a circle-of-return test (which was ~12% short on small loops).

### Verified
agent-browser, session `conservatory-verify-8794`, port :8794, cache-busted ?v=N.
Front door: 0 label collisions (programmatic + eyeball), 0 nested anchors, 0 overflow
@1280. Landing: self-test 8/8, breadcrumb dropped, 0 overflow @1280 & @390, clean
console. Bench: self-test 6/6, ~60fps (91 frames/1.5s), RK4 needle dead-still
(1.7e-15), Euler drift climbing monotonically (2.7e-4 → 3.4e-2…), 0 overflow @1280 &
@390, clean console. Server + session torn down by exact PID/name.

### The growth path (planters → real [bench] seeds)
- **logistic** — sigmoid, carrying-capacity foil (spirals IN to a stable node — the
  LV center's foil).
- **SIR** — threshold R₀ (below it the outbreak dies; above it it sweeps).
- **replicator** — ESS fixed points (the evolution of strategies; a handshake to
  game theory).

Each a level-set / fixed-point / Lyapunov story in the same terrarium frame and the
same self-test discipline.
