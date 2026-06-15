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

---

## Cycle #33 — the Logistic-growth bench (the first planter blooms)

The first empty planter is now a live bench: **Logistic Growth**, the explicit foil
to the predator–prey CENTER next door. One colony against a carrying capacity K.

### Built (`conservatory/logistic/`)
- **core.mjs** — the pure single-source math (no RNG/DOM/network): locked `r=0.6,
  K=100`; `field`, `fPrime` (the stability slope), exact `closed(t,N0)` (the sigmoid),
  `fixedPoints` (0 unstable +r / K stable −r), the **conditional** `inflection`,
  `Vlyap`/`Vprime` (the Lyapunov bowl), `rk4Step` (truth), `leakyStep` (= the logistic
  MAP; the negative control), `trace`, `runSelfTest` (6 checks). ~232 lines.
- **core.test.mjs** — green under `node`: 30/30, the in-page self-test + independent
  re-derivations + the **re-extraction parity** check (the inlined core is byte-
  identical to core.mjs between the `LOGISTIC-CORE` sentinels, indentation-normalised).
- **index.html** — the terrarium with the core inlined byte-identical. The integrated
  A+B visual: **BACK GLASS** = the 1-D phase line (arrows length=|f(N)| converging on
  K, the field profile peaking at K/2, hollow dot at 0 / filled disc at K with tangent
  stubs ±r, K-line + K/2 caret, a live bead); **FRONT HERO** = the S-curve N-vs-t with
  the closed-form ghost drawn first and the live integrator ridden on top (peels off
  and rings under leaky), the inflection dot (only when `inflection(N0)!==null`), the
  K water-line + N=0 floor hairline; **LYAPUNOV NEEDLE** = V=(N−K)² sliding to 0.
  Controls: the load-bearing `RK4 · truth ⟷ leaky step` toggle, r/K/N₀ sliders, a dt
  slider showing live `a=dt·r` with a warn tick at a≥1.6, crank, pause. Reduced-motion
  static frame. ~640 lines.

### The proven claim (measured)
- **STABILITY**: f'(K)=−r=−0.6<0 ⇒ N*=K **stable**; f'(0)=+r=+0.6>0 ⇒ N=0 **unstable**
  (the eigenvalues ARE the 1-D field slope, byte-exact ∓r).
- **CLOSED-FORM ⟷ RK4**: max|N_rk4 − N_exact| = **2.97e-10** at dt=0.01 (< 1e-9), and
  it's **4th-order** (dt→dt/4 shrinks the error ≥10×).
- **NEGATIVE CONTROL**: the leaky step IS the logistic map in a=dt·r; at a=1.6 it
  **provably overshoots** K (maxN=**100.84**, ≥1 K-crossing) and rings, growing worse
  monotonically (a=2.0→109.62, a=2.4→120.37); the true RK4 NEVER overshoots (0
  crossings). The tainted control fails conservation-of-monotonicity, as it must.
- **INFLECTION**: exact at N=K/2, growth-rate f(K/2)=**15**=r·K/4, f'(K/2)=0; t*=
  ln((K−N₀)/N₀)/r=**4.907398** lands N(t*)=50.000000000; and inflection(N₀≥K/2)=**null**
  (the conditional guard — the mark won't lie past the bend).
- **MONOTONE APPROACH + LYAPUNOV**: N₀=5 climbs / N₀=150 descends, both monotone under
  RK4; V=(N−K)² falls monotonically to 0 for N₀∈{5,40,99,150,200}; V̇(K/2)=−1500≤0,
  V̇(K)=0. **predator-prey's V stays FLAT on its ring; here V must FALL — that IS
  stability.**

### The dt-coupled toggle (the on-ramp that makes the lesson visible)
Selecting **leaky** PRESETS a coarse dt (a≈1.8, dt=3.0) so the S-curve rings
immediately; selecting **rk4** restores a fine dt (0.01, a≈0.006). A viewer can never
flip to leaky at a small dt and see nothing — the bifurcation is always on display.

### Landing promotion (`conservatory/index.html`)
The Logistic planter became a SECOND live `.bed` link (`logistic/index.html`, bare-
relative) with a planter-light: a mini S-curve climbing to the K-line, driven by the
SAME imported `closed()`. The landing now imports BOTH cores and its structural self-
test grew from 8/8 → **13/13** (two live beds + two empty planters; both bench links
bare-relative; both cores all-green). Planters grid + foot copy reconciled to two.

### Verified
agent-browser, uniquely-named sessions, port `:8843`, torn down by exact PID. Bench:
self-test **6/6**, 0 console errors, 0 nested anchors, 0 overflow @1280 & @390; the
RK4⟷leaky toggle flips the S-curve from hugging-the-ghost (V slides down) →
overshoot/ringing (V ticks up, colony N=101.45 over the K-line) and BACK reversibly;
the S-curve settles at K. Landing: self-test **13/13**, both live beds + the planter-
light render, 0 console errors, 0 overflow. Server + sessions torn down by exact
PID/name only (Brandon's :3001/:4380 untouched).
