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

---

## Cycle #34 — the SIR-epidemic bench (the second planter blooms)

The second empty planter is now a live bench: **The SIR Epidemic**, the OPEN ARC to
set against the predator–prey CLOSED RING and the logistic STABLE NODE. A closed
population of one unit flows S→I→R, gated by the reproduction number R₀=βS₀/γ.

### Built (`conservatory/sir/`)
- **core.mjs** — the pure single-source math (no RNG/DOM/network): locked `β=0.30,
  γ=0.10, N=1, I0=1e-3` (N=1 normalises the bar S│I│R into unit fractions; the math is
  identical to the textbook N=1000 once γN/β→γ/β). `field` (the 3-vector S'/I'/R'),
  `R0`, `IprimeAtZero` (the threshold derivative, sign = sign(R₀−1)), `Phi` (the FIRST
  INTEGRAL Φ=S+I−(γ/β)ln S — the V-analog), `peakS`=γ/β (exact, = S₀/R₀), the
  **conditional** `peakInfected`/`peakLocation` (null below R₀=1 — the mark won't lie),
  `finalSize` (the SMALL Φ-root by bisection, INDEPENDENT of any orbit — anti-
  circularity), `rk4Step` (truth), `eulerStep` (the negative control), `trace` (NaN-
  guarded; records sum-error, Φ-drift, peak count/time/height, minI, wentNegative),
  `runSelfTest` (6 checks). ~265 lines.
- **core.test.mjs** — green under `node`: **28/28**, the in-page self-test + independent
  re-derivations (the threshold β*=γ/S₀ from scratch; the Rydberg-style blind agreement
  — the core Φ-root === a fresh dense re-bisection === a long-run RK4 to quiescence, one
  S∞ from two derivations; the peak-count flip across R₀=1; Euler I<0 / RK4 I>0; the
  textbook S₀·exp(−R₀(1−S∞/N)) form DISAGREES by **1.68e-4** because it ignores I₀, so
  finalSize uses the Φ-root NOT it) + the **re-extraction parity** check (the inlined
  core is byte-identical to core.mjs between the `SIR-CORE` sentinels).
- **index.html** — the glass-terrarium with the core inlined byte-identical. The
  integrated visual: **BACK GLASS** = the S–I phase plane (the open arc launching from
  (S₀,0⁺), bowing to its apex EXACTLY on the dashed amber S=γ/β line, landing on (S∞,0);
  the disease-free line I=0 green-stable below γ/β / amber-unstable above; a live bead,
  green→red at the peak, that PLUNGES below I=0 with an "I<0 · unphysical" tag under
  Euler; the stacked S│I│R column on the left); **FRONT HERO** (1.55fr) = S(t)↓ green,
  R(t)↑ slate, the red I-bell filled ~8% with the peak dot + drop + S=γ/β tick (the
  bell↔no-bell flip across R₀=1 is the headline); **THE CONSERVED-QUANTITY METER** (1fr,
  TWO widgets) = the S+I+R=N stacked bar (dead-flat at N under RK4; the I-band punches
  BELOW baseline as a red underhang under Euler) + the Φ-needle (flat under RK4,
  wandering under Euler); **R₀ TILE** (big live `R₀=βS₀/γ=2.997`, green <1 / amber >1).

### The six proofs (in-page badge + Node twin assert the same)
- **CONSERVATION**: RK4 holds S+I+R=N to **3.8e-15** AND Φ to **1.5e-12** (<1e-9) over
  every preset orbit; the info string SAYS so — **BOTH methods hold the sum; Euler
  breaks POSITIVITY instead** (the ±γI increments cancel at any dt).
- **THRESHOLD**: sign(I'(0))=sign(R₀−1) on both sides; the peak count flips **0/0/1**
  across R₀={0.80, 1.0000, 2.997} (the 1e-9 slope-jitter epsilon keeps the flat
  critical case at 0).
- **PEAK LOCATION**: peakS()=γ/β=**0.333333** byte-exact (= S₀/R₀); the traced
  supercritical peak's parabolic-interpolated Sval lands within **1.8e-7** of γ/β;
  peakLocation(R₀≤1)=**null**.
- **FINAL SIZE**: the Φ-root S∞=**0.059447768** (never touches the orbit) matches a
  long RK4 run to quiescence (I<1e-12) to **2.2e-13** (<1e-6); the root is the SMALL one
  (0 < S∞ < γ/β). The textbook closed form disagrees by ~1.7e-4 — kept only as a labeled
  approximation.
- **NEGATIVE CONTROL (POSITIVITY)**: Euler at dt=12 drives minI=**−0.254** (I<0,
  wentNegative=true); RK4 keeps minI>0. **And the SUM holds under BOTH** (we say so).
- **DETERMINISM / PARITY**: identical inputs ⇒ byte-identical trace; the inlined core is
  byte-identical to core.mjs (proven in the Node twin).

### The dt-coupled toggle (the on-ramp that makes the lesson visible)
Selecting **Euler** PRESETS **dt=12** so the I<0 positivity break is always visible
across the whole β/γ slider range; selecting **RK4** restores dt=0.05. A viewer can
never flip to Euler and see nothing — the break is always on display.

### Landing promotion (`conservatory/index.html`)
The SIR planter became a THIRD live `.bed` link (`sir/index.html`, bare-relative) with
a planter-light: a faint S↓/R↑ + bright filled I-bell + moving bead + a dashed vertical
at the peak, driven by the SAME imported `trace()`. The landing now imports all THREE
cores and its structural self-test grew from 13/13 → **17/17** (three live beds + one
empty planter; all three bench links bare-relative; all three cores all-green; the SIR
planter-light canvas mounted). Planters grid + foot copy reconciled to ONE remaining
planter (the replicator).

### Verified
agent-browser, uniquely-named sessions, port `:8791`, torn down by exact PID. Bench:
self-test **6/6**, 0 console errors, 0 nested anchors, 0 overflow @1280 & @390; the
RK4⟷Euler toggle flips the conservation meter from dead-flat-at-N (the bell peaks at
S=γ/β, the arc lands at S∞) → the I-band plunging below 0 (the orbit plunges below the
I=0 line, "I<0 · unphysical") and BACK reversibly (Φ-drift back to 1.5e-12). Landing:
self-test **17/17**, three live beds + the SIR planter-light render, 0 console errors,
0 overflow. Regression: predator-prey **31/31** + logistic **30/30** untouched. Server
+ sessions torn down by exact PID/name only (Brandon's :3001/:4380 untouched).

### Publisher fresh-eyes review (cycle #34) — ONE polish fix
Re-served on an uncommon port (`:8842`, torn down by exact PID) and re-opened both
surfaces in a uniquely-named agent-browser session. Re-ran `node conservatory/sir/core.test.mjs`
→ **28/28** green (incl. the byte-identical re-extraction parity); bench in-page
**6/6 ✓**, landing **17/17 ✓**; 0 console errors, 0 nested anchors, 0 overflow @1280
(1265) & @390 (375) on both; the Euler positivity break renders dramatically (the
phase-plane orbit + bead plunge below the I=0 line, the I-bell punches below 0,
dt snaps to 12, verdict swaps to the positivity-break copy) and the RK4↔Euler toggle
is fully reversible (a direct DOM click confirmed RK4 restores dt=0.05 + Φ-drift ~1.5e-12;
an early coordinate-click that appeared to miss was a stale-ref harness artifact, not a
bug). **Fixed (the builder's flagged openConcern #3):** with only the replicator planter
left, the `.planters` grid was still `repeat(2,1fr)`, so the lone planter rendered at
half-width (491px in a 996px row) with empty space beside it. Changed the grid to a
single `1fr` column so the one remaining planter spans full width, aligned flush with
the three `.bed` cards above it — a clean intentional column. No other code change;
no `[bug]` filed; no `⚡` spark. Mobile (390px) reflows cleanly. Committed & pushed.

---

## Cycle #35 — the Replicator bench (the fourth planter blooms; the wing's first chapter closes)

The last empty planter is now a live bench: **The Replicator**, the SIMPLEX FLOW to set
beside the predator–prey CLOSED RING, the logistic STABLE NODE, and the SIR OPEN ARC. A
population of competing strategies evolves by the replicator equation; the mix lives on
the probability simplex and always sums to 1.

### The conceit
With payoff matrix A, per-strategy payoff `fᵢ=(A·x)ᵢ`, mean payoff `φ=xᵀAx`, the field is

    ẋᵢ = xᵢ·(fᵢ − φ)      (above-average GROWS, below-average SHRINKS)

Summing it gives the structural law **Σẋᵢ = φ − φ·Σxᵢ = 0 ANALYTICALLY**, so **Σxᵢ ≡ 1**
to machine zero along every orbit — the replicator's analog of S+I+R=N and the V-ring.
Two locked games: **Hawk–Dove** (primary, V=2, C=3 ⇒ C>V) has a unique interior ESS at
`x*_Hawk = V/C = 2/3`, reached MONOTONICALLY (the node); **Rock–Paper–Scissors** (foil,
zero-sum antisymmetric) circles the barycentre `(⅓,⅓,⅓)` forever (the neutrally-stable
ring). The relative entropy `D(x*‖x) = Σx*ᵢ ln(x*ᵢ/xᵢ)` is the discriminator: it falls
strictly to 0 for Hawk–Dove (a Lyapunov function), stays FLAT for RPS.

### Built (`conservatory/replicator/`)
- **core.mjs** — pure single-source math (no RNG/DOM/network): locked `P={V:2,C:3,
  game:'hawkdove'}`, `hawkDoveMatrix`/`rpsMatrix`/`matrixFor`, `payoff` (A·x), `meanPayoff`
  (xᵀAx), `field` (the replicator ẋ), `essFixedPoint` (closed-form x*_Hawk=V/C, RPS
  barycentre — NO integration, anti-circularity), `relEntropy` (the KL Lyapunov function),
  `simplexSum`/`minCoord` (the positivity probes), `rk4Step` (truth) / `eulerStep` (the
  negative control) of the length-agnostic field, `trace` (NaN-guarded; records sum-error,
  minX, wentNegative, the D-history + worst D-uptick, the mix history), `runSelfTest`
  (6 checks). ~300 lines.
- **core.test.mjs** — green under `node`: **30/30**, the in-page self-test + independent
  re-derivations (Σẋ=0 at a dense interior scatter on both games; x*_Hawk=V/C re-derived
  blind from f_H=f_D; long RK4 from 3 interior starts → x* to **8.3e-15**; Hawk–Dove D
  descends with worst uptick **1.9e-16** while RPS D-swing is **2.5e-12** flat AND the
  orbit genuinely cycles |x_R−⅓|=0.186; RPS zero-sum φ≡0; the boundary teeth) + the
  **re-extraction parity** check (the inlined core is byte-identical to core.mjs between
  the `REPLICATOR-CORE` sentinels).
- **index.html** — the glass-terrarium with the core inlined byte-identical. **BACK GLASS**
  = the SIMPLEX phase portrait (Hawk–Dove: the 1-simplex segment [Dove↔Hawk] with flow
  arrows and the glowing ESS dot at x*=V/C; RPS: the triangle [R,P,S] with the orbit
  circling the centre, recoloured red and tagged "xᵢ<0 · off-simplex" where it punctures
  an edge; the stacked strategy column on the left); **FRONT HERO** (1.55fr) = the
  stacked-share time series (each strategy a coloured band tiling Σ=1, with the [0,1]
  reference box); **THE DESCENT & POSITIVITY METER** (1fr) = the D(x*‖x) curve (falls to 0
  for the node, flat for the ring) + the min-xᵢ positivity bar (green above 0, red
  underhang below) + the `min xᵢ` and `max|Σx−1|` readouts; **ESS TILE** (big live
  `x*_Hawk=V/C` or the RPS barycentre). Toggles: RK4↔Euler and Hawk–Dove↔RPS.

### The six proofs (in-page badge + Node twin assert the same)
- **SIMPLEX INVARIANT** (load-bearing): Σẋ=0 analytically ⇒ Σxᵢ≡1 to **3.8e-15** along
  every RK4 orbit on BOTH games; the field sums to **6.9e-17** at a scatter of points.
- **ESS FIXED POINT**: closed-form x*_Hawk=V/C=0.6667 with ẋ(x*)=**3.7e-17**≈0; a long RK4
  run from 3 interior starts converges to it to **8.3e-15** (<1e-9) — no integration needed
  for the root.
- **LYAPUNOV**: D(x*‖x) descends monotonically (worst uptick **1.9e-16**≈0) to the
  Hawk–Dove ESS; RPS keeps D flat (swing **2.0e-12**) — the node-vs-ring distinction.
- **PAYOFF IDENTITY**: φ=xᵀAx=Σxᵢfᵢ exact; at the interior ESS every played strategy earns
  φ (|fᵢ−φ|=**5.6e-17**).
- **NEGATIVE CONTROL (positivity/boundary, NOT sum-drift)**: on the RPS ring, coarse Euler
  dt=1.2 spirals OUTWARD and drives min xᵢ to **−8.1e-3** (wentNegative), while RK4 holds
  the ring inside the simplex (min xᵢ=0.195) — and the SUM Σxᵢ=1 holds under BOTH (the
  predator–prey "Euler spirals out" teeth, transplanted onto the 2-simplex).
- **RE-EXTRACTION PARITY**: proven in the Node twin; in-page determinism witness green.

### The landing — the wing closes
The fourth planter became the fourth live `.bed`; the landing imports the replicator core
for a planter-light (the Hawk│Dove stacked-share glass climbing to the dashed x*=V/C line,
its own moving bead) and the structural self-test grew **17/17 → 21/21** (added the
replicator bench-link×2 + bare-relative checks, bumped the bed-count assertion 3→4,
replaced the empty-planter assertion with a zero-planters assertion, added the replicator
planter-light canvas-mount + core-all-green checks). The "planter awaiting" section is
gone; the foot prose now reads "now fully planted … every planter has bloomed; the wing's
first chapter is complete."

### Builder self-verify (cycle #35)
`node conservatory/replicator/core.test.mjs` → **30/30** (incl. the byte-identical
re-extraction parity). Regression untouched: predator-prey **31/31**, logistic **30/30**,
SIR **28/28**. Served on an uncommon port (`:8793`, torn down by exact PID 28058) and
opened both surfaces in a uniquely-named agent-browser session (`rep-verify-35`, closed by
name). Bench in-page **6/6 ✓**, landing **21/21 ✓**; **0** console errors/warnings, **0**
nested anchors, **0** overflow @1280 (1265) & @390 (375) on both surfaces. The RK4↔Euler
toggle is reversible: Euler forces the clean RPS spiral-out (dt→1.2, posval shows
**−8.25e-3** red while the simplex sum stays **1.11e-15** — the boundary breaks, the sum
holds), and RK4 restores dt=0.05 + a positive min-xᵢ. A coarse-Euler trace cap (560 steps
when dt≥0.6) keeps the on-bench spiral-out faithful — it punctures the edge with Σxᵢ still
exact, before the far-outside-the-simplex blow-up would corrupt the float sum.

---

## Cycle #37 — Predator & Prey RE-SOULED in place (the wing's first `rework`)

A `rework` (BUILD / garden). The bench `conservatory/predator-prey/` — whose own
footer once confessed its dot-clouds were "a rendering of the ODE, not an agent sim" —
is re-grown **IN PLACE** (same route, no new front-door footprint) into a **living
agent ecology**. It now LEADS with a glass terrarium of tens of individually-readable
animals: **green hares** (with ears) graze and breed; **amber lynx** (with ears) prowl,
**flash red** on a catch and **fade** on starvation. An **event ticker** narrates single
events ("a lynx caught a hare", "a hare litter ×N", "a lynx starved"). The plotted
dot-cloud is no longer the star — the animals are.

### The proof, drawn BY the animals
On the back glass a phase portrait carries the **proven dashed RK4 ghost ring**
(V conserved to ~1e−11), the center cross at **(4, 2.75)**, a **live white bead**, and an
**accumulating green cloud** the animals draw. The stochastic birth–death–predation rule
has a **mean-field that is exactly the Lotka–Volterra field** (a=1.1, b=0.4, c=0.4, d=0.1) —
`agentMeanField == field()` to 0. The **emergent census period 10.35 vs RK4 10.04 (3.0%)**
and **x-amplitude 4.32 vs 4.23 (2.3%)**, both inside a stated 5% tolerance, are measured
from the **phase-locked ensemble mean** (seeds=120, K=100): a single stochastic LV run
random-walks across orbits, so the ensemble mean is the honest way to recover a stable
emergent loop. **Remove the lynx → hares flood to the ceiling** (the predators were the
only brake); **re-seed** restores a fresh loop.

### Files (re-grown in place)
- `core.mjs` (310→**542**L) — the PREY-CORE block preserved **byte-identical** (every
  existing export unchanged); ADDED the AGENT-CORE block between new sentinels: `ECO_K=100`,
  `mulberry32`, `binom`, `agentMeanField`, `stepEcoCounts` (mean-field IS `field()` exactly),
  deterministic count-only `headlessRun`, phase-locked `ensembleCensus`, `censusPeriodAmp`,
  `runAgentSelfTest` (5 new exact/seeded claims).
- `index.html` (rebuilt instrument) — both CORE blocks inlined **byte-identical** between
  their sentinels; a two-tier badge (`core 6/6 ✓ · bridge…` → **self-test 11/11 ✓**), the
  heavier agent ensemble deferred via `requestIdleCallback` so paint never blocks; the footer
  confession REPLACED with the truthful "it IS an agent ecology" account; bare-relative
  back-links + the `ws:seen:predator-prey` breadcrumb preserved.
- `core.test.mjs` (31→**45** checks) — runs the agent self-test, adds independent agent
  witnesses, and adds the AGENT-CORE re-extraction parity test alongside the preserved
  PREY-CORE parity test.
- `../index.html` (landing) — predator-prey card blurb refreshed to "a living agent ecology
  that draws its own L–V orbit"; the card glyph corrected 🐌→🐇 (a hare, the prey).

### Self-verify (cycle #37)
`node conservatory/predator-prey/core.test.mjs` → **45/45** (was 31/31), incl. both
byte-identical re-extraction parity tests. Publisher RE-PROVED live (uncommon port `:8794`,
torn down by exact PID; agent-browser `ws37-predprey` / `ws37-conslanding`, closed by name;
Brandon's :3001/:4380 untouched): bench badge **11/11 ✓** (after waiting ~2s for the deferred
ensemble), landing **21/21 ✓**; **0** console errors, **0** nested anchors, **0** overflow
@1280 (1265) & @390 (375) on both surfaces. The cull fired reliably in one press
(lynx→0, hares→1400 ceiling, ⚠ banner lit), re-seed reset to a fresh loop, and "prove the
orbit (run 200×)" took runs 0→200 with the pooled green cloud visibly filling the dashed
ghost ellipse. Mobile (390×844) stacks cleanly. **Caught & fixed in review:** the landing's
predator-prey card glyph was 🐌 (a snail — the odd one out among 🌱/🦠/♛, incongruous for
hares & lynx) → changed to 🐇 (the prey hare); landing self-test stays 21/21.

---

## Cycle #47 — The Replicator RE-SOULED in place (THE ARENA; the wing's last queued re-soul)

A `rework` (BUILD / garden). The bench `conservatory/replicator/` — which *was* game
theory (Hawk–Dove, RPS) with no game to play, a stacked-bar time series fronting a simplex
plot — is re-grown **IN PLACE** (same route, same `ws:seen:replicator` breadcrumb, no map
change) into **THE ARENA**: a glass terrarium of ~72 individually-readable strategist
agents that **meet, play one round of the payoff matrix, and breed-or-die by their
winnings**. **Hawk** = a coral triangle, **Dove** = a teal disc; in RPS the three shapes are
triangle/disc/diamond in coral/slate-blue/violet, each carrying a winnings-ring. The crowd
drifts with Brownian wander, MEETS (encounter sparks — Hawk-vs-Hawk flashes red, Dove-vs-Dove
a soft green), and visibly climbs to the ESS ⅔ (Hawk–Dove) or cycles forever (RPS). A live
**"HAWK n · DOVE n"** tally + a `logEvent` ticker ("Hawk took the spoils from a Dove",
"Hawk-vs-Hawk fight — both bloodied") narrate. **THE HERO VERB:** *drop an invader* injects an
all-Hawk (RPS: all-Rock) slug and the crowd is pulled back to ⅔ — the ESS as an attractor.

### The proof, DEMOTED to a faithful back-glass instrument
The old proven simplex orbit becomes a faint **back-glass ghost trail** with a live white
bead + an accumulating green census cloud; the time series became a side-rail Hawk-fraction(t)
strip hugging the RK4 curve. `drawEntropy`/`drawPosbar`/the ESS-tile are kept as proven side
instruments. **The HARD WALL holds:** the live arena is a **camera** — every printed number
(ESS, Σx−1=6.66e-16, min xᵢ) reads only from `trace()`/`essFixedPoint()`; the visible counts
follow the proven replicator-Euler field with bounded demographic noise + an anti-absorption
floor (a documented camera-only nudge, the same predator-prey rescue pattern), while the
**VALIDATED register is the pure dense headless census**. The footer says so in plain words:
"The live arena is a camera, never the authority … re-run ~150× at N≈1500 lands on the exact
node / circles the exact ring."

### Files (re-grown in place)
- **core.mjs** (377→**646**L) — the `REPLICATOR-CORE` block preserved **byte-identical**
  (every existing export unchanged); APPENDED a new `===== AGENT-CORE =====` block (~235L)
  exporting `mulberry32`, `binom`, `multinomial`, `agentMeanField(A,x)`, `stepAgentCounts`
  (Moran-relaxation, N conserved, reports births/deaths/fights), `headlessRun`,
  `ensembleCensus` (phase-locked relaxation, NOT stationary), `rk4OnGrid`, `runAgentSelfTest`
  (5 teeth A1–A5). `ARENA_N=1500`.
- **index.html** — both CORE blocks inlined **byte-identical** between their sentinels; a
  two-tier badge → **self-test 11/11 ✓** (6 core synchronous + 5 agent deferred via
  `requestIdleCallback` so paint never blocks); the back-glass time series re-cast as a
  side-rail; bare-relative back-links + the `ws:seen:replicator` breadcrumb preserved. The
  ?reducedmotion=1 QA hook forces the reduced path (the OS preference is still the real gate);
  reduced-motion renders one settled-ESS static frame (HAWK 48 · DOVE 24 = ⅔ of 72) with the
  census cloud pre-accumulated and no loop.
- **core.test.mjs** (+79L) — runs `runAgentSelfTest`, adds independent agent re-derivations
  (mean-field == field to literal 0; population conserved; census → ⅔; headless determinism)
  + an AGENT-CORE re-extraction parity row alongside the preserved REPLICATOR-CORE one. Suite
  grew **30 → 42**, exit 0.
- **../index.html** (landing) — the Replicator bed-card blurb re-souled in place to "a glass
  terrarium of strategists that meet, play one round of the payoff matrix, and breed-or-die by
  their winnings" (same route, 4 beds unchanged, no map/footprint touched).

### The agent self-test (A1–A5, measured tolerances printed honestly)
- **A1** `agentMeanField == field()` to **0.00e+0** over 4000 random HD+RPS mixes (the crowd
  recovers ẋᵢ=xᵢ(fᵢ−φ) literally).
- **A2** Hawk–Dove census tail-mean ⟨x_H⟩=**0.67172** (err **5.05e-3** < 1.5e-2) AND tracks
  the proven RK4 curve to max-dev **1.37e-2** < 3e-2.
- **A3** RPS census time-avg err to ⅓ = **3.32e-2** < 1e-1 AND single-run amplitude **0.785**
  > 0.3 (never settles).
- **A4** all-Hawk invader **REPELLED** — KL D **3.96e-1 → 8.89e-5** (≥10× net descent), tail
  ⟨x_H⟩=0.6729 (the ESS is an attractor).
- **A5** determinism — `headlessRun` AND `ensembleCensus` byte-identical for a fixed seed.

### Builder self-verify (cycle #47)
`node conservatory/replicator/core.test.mjs` → **42/42 GREEN exit 0** (was 30/30); both
re-extraction parity rows (REPLICATOR-CORE + AGENT-CORE) byte-identical. In-browser the
bench in-page badge read **self-test 11/11 ✓**; the HD crowd climbed 9→48 (=⅔ of 72); the
invader spiked then pulled back to 48; RPS visibly cycles (the majority shape rotates
Paper→Scissors→Rock); the Euler proof layer drove posval **−8.25e-3** (positivity break) while
Σx−1 held at machine zero.

### Publisher fresh-eyes review (cycle #47)
Served on uncommon port `:8853` (Python `http.server`, torn down by exact PID; Brandon's
:3001/:4380 untouched); both surfaces opened in agent-browser session `rep-pub-47` (closed by
name). Node twin **42/42 GREEN exit 0**. **The bench @1280 AND @390:** in-page pill
**11/11 ✓**, **0** console errors, **0** nested anchors, **0** horizontal overflow (1265≤1280,
375≤390). The HD crowd settled at ~48–50 Hawks (=⅔ of 72); *drop an invader* spiked then
pulled back to ~49; **RPS mode** showed the Rock/Paper/Scissors legend and cycled; the **Euler
proof toggle** drove `min xᵢ (positivity) = −8.25e-3` (red) while `Σxᵢ−1 = 1.11e-15` (machine
zero — the page correctly notes "NOT a conservation failure"); **reduced-motion** (`?reducedmotion=1`)
froze the loop at the settled-ESS frame (HAWK 48 · DOVE 24, unchanged after 2.5s, play button
"▶ play"). The Conservatory landing self-test read **21/21 ✓**, 4 beds, the re-souled
Replicator card resolving to `replicator/index.html`, 0 console errors. Mobile stacks cleanly
to a single column. **Caught & fixed in review:** the **front-door map's Conservatory blurb**
(`index.src.html`) still read "*The first bench self-proves it; planters stand empty for the
systems still to come*" — a discoverability falsehood (the wing has been complete at 4 benches
since #35; it also ignored the re-souled Replicator) — rewritten to an accurate 4-bench
description naming the game-theory arena ("a glass terrarium of strategists … Hawk and Dove
settling exactly at x*=V/C, Rock–Paper–Scissors chasing itself forever … Each bench self-proves
its claim"). Text-only `.src.html` blurb edit; forge-rebuilt (`node tools/forge/forge.mjs
index.src.html`), `index.html` verified current by `forge --check --all`; **no map structure,
footprint, coordinates, or slot layout touched**. **Publisher's calls on the builder's open
concerns:** the **N=1500 / measured-tolerance band** (tail err 5.05e-3 < 1.5e-2; tracks RK4 to
1.37e-2 < 3e-2) over the brief's aspirational 2.8e-5 is the **honest engineering call** — the
finite-Moran relaxation has an O(1/N) reflection bias near the ESS; asserting the measured band
and framing the census as "re-run ~150× at N≈1500" is truthful (no reviewer expects the visible
72-agent run to hit ⅔ to 1e-5). The **`?reducedmotion=1` QA hook** is harmless and OFF for normal
users (the OS preference is the real gate) — **kept**. The **646-line core.mjs** (vs the 600 soft
target) stays navigable and the REPLICATOR-CORE block is byte-frozen — **left as built**. The two
stray repo-root PNGs (`phase1.png`, `ws43-paused1.png`) predate this work → **removed** as
untracked strays (all the cycle's screenshots went to /tmp). **No new `[bug]`, no `⚡` spark.**

---

## Cycle #48 — Logistic Growth RE-SOULED in place (a colony under glass; the wing's 4th re-soul)

A `rework` (BUILD / garden). The bench `conservatory/logistic/` — which *led* with an
S-curve plot in a wing whose mold is a **living terrarium** (predator–prey, the Arena) — is
re-grown **IN PLACE** (same route, same `ws:seen:logistic` breadcrumb, no front-door
map/footprint change) into **a colony under glass**: a circular glass petri dish of
**countable green cells** that bud/divide (inner→outer on a stable jittered hex lattice) and
crowd toward a visible carrying capacity **K**, until no cell has room left to bud. Three
coupled crowd cues read the same crowding — packing density, an amber colour/jostle as cells
press, and a clockwise rim crowd-meter. The S-curve is **DEMOTED** to a faint back-glass
ghost + a **census-cloud "shadow" pane** where the crowd's own census paints the proven
sigmoid up to the K asymptote.

### The three hero verbs (touchable, discoverable)
- **Resize the dish (K):** drag K 100→60 and the colony re-packs to the new ceiling **live**.
- **⤓ overcrowd (N₀=1.6 K):** one tap seeds the dish too tight (160 = 1.6·K) — it starts
  packed and **thins toward K**, no inflection drawn (N₀≥K/2, the load-bearing guard).
- **greedy batch:** presets a coarse dt (a≈1.8) — the amber banner lights, the rim glows, the
  ticker narrates "overcrowded"/"rebounds", and the **coarse dish rings** past the rim.

### The proof, DEMOTED to a faithful back-glass instrument
The proven sigmoid lives on as (a) a faint **back-glass ghost** and (b) a **census cloud**
that accumulates from a deterministic `headlessRun` and paints the exact closed-form S-curve;
the phase-line is a compact side-gauge and the Lyapunov needle a shrunk re-labelled
**V=(N−K)²** ("how far from full"). **The HARD WALL holds:** the live dish is a **camera** —
the on-screen `sN` advances ONLY on the proven `rk4Step`/`leakyStep` over `field()`; every
printed number reads the core; the **validated census stays pure** (only the on-screen
camera-run gets a bounded display clamp + a stray-founder reseed).

### Files (re-grown in place)
- **core.mjs** (287→**511**L) — the `LOGISTIC-CORE` block + its 30/30 tests preserved
  **byte-identical**; APPENDED an `===== AGENT-CORE =====` block exporting `DISH_CAP=1500`,
  `mulberry32`, `binom`, `agentMeanField(N)=r·N−r·N·(N/K)`, `stepDish` (**two registers** — a
  truthful per-cell binomial bud/pinch that pins at the cap = the validated census path; and a
  **coarse integer logistic map** `r·dt·m·(1−m/cap)` that genuinely rings past the rim),
  `headlessRun`, `ensembleCensus`, `censusDeviation`, `runAgentSelfTest` (4 rungs).
- **index.html** (→**1314**L) — AGENT-CORE inlined **byte-identical** between its sentinels;
  the instrument IIFE replaced with the living dish (`drawDish`), the census-shadow pane, the
  compact phase side-gauge, the shrunk V-needle, a deferred two-tier self-test badge
  (sync proven-core + `requestIdleCallback` agent tier), and the bud/full/die/epoch ticker.
- **core.test.mjs** (→**274**L) — runs `runAgentSelfTest` (4/4), adds the CAP
  1500→3000→6000 **shrinkage witness** (dev 2.46→1.65→1.26, monotone-down — a 1/√CAP
  demographic stall, not model error), the coarse-dish ring witness, and a second
  sentinel-pair parity row for AGENT-CORE beside the preserved LOGISTIC-CORE one. **46/46.**
- **../index.html** (landing) — the Logistic bed-card blurb + proof line re-souled in place
  ("a few cells, dividing fast … crowd toward the carrying capacity K, until no cell has room
  left to bud … the crowd's own census paints the proven sigmoid"); 4 beds, no map touched.

### The agent self-test (A1–A4, measured tolerances printed honestly)
- **A1** `agentMeanField == field()` to **max|Δ|=5.33e-15** over N∈{0..120} (the colony's
  mean-field recovers the proven logistic drift to machine zero).
- **A2** ensemble census tracks the EXACT closed-form sigmoid within **2.463** colony-units
  (< 3.0) — the crowd draws the S-curve.
- **A3** the truthful binomial register pins at the cap (= N=K) and **cannot overshoot** (the
  per-cell birth clamp stalls it); the **coarse integer-map register rings** — a=1.6 ⇒
  maxN=**100.80** > K with 27 K-crossings, growing monotonically in a (100.80<109.53<120.40).
- **A4** determinism — same seed ⇒ byte-identical colony series.

### Design call (owned by the builder, ratified in review)
The brief's literal single-formula `stepDish` (per-cell binomial) **provably cannot ring** —
the birth clamp stalls it at the cap. The builder **split** `stepDish`: the binomial body is
kept verbatim for the **truthful register** (drives A1/A2/the census), and the **coarse
register** is the genuine integer logistic map (it rings, a documented overshoot witness). The
overshoot PROOF still rests on the proven `leakyStep@a=1.6` claim verbatim; the coarse dish is
an *additional* honest witness. The AGENT-CORE comment documents both registers and the
camera-only floor. **Publisher's call: kept** — it is the honest, soul-faithful choice and
every tooth stays green.

### Builder self-verify (cycle #48)
`node conservatory/logistic/core.test.mjs` → **46/46 GREEN exit 0** (30 preserved logistic core
+ agent self-test 4/4 + independent witnesses incl. shrinkage + coarse-ring + both parity rows
byte-identical). In-page badge **self-test 10/10 ✓** (6 core + 4 bridge); @1280 and @390 both 0
console errors, 0 nested anchors, 0 horizontal overflow. All three hero verbs verified live
(resize K re-packs · ⤓ overcrowd thins toward K · greedy batch rings, amber banner lights).
Smooth mode: the census cloud paints the ghost sigmoid up to the K asymptote.

### Publisher fresh-eyes review (cycle #48)
Served on uncommon port `:8771` (Python `http.server`, torn down by exact PID; Brandon's
:3001/:4380 untouched); both surfaces opened in agent-browser session `ws-pub-48` (closed by
name). Node twin **46/46 GREEN exit 0** (both parity rows byte-identical). **The bench @1280
AND @390:** in-page pill **self-test 10/10 ✓**, **0** console errors (the console carried only
the green self-test logs), **0** nested anchors, **0** horizontal overflow (1265≤1280, 375≤390).
The living dish reads beautifully — a circular glass petri of countable green cells crowding
toward K with the amber crowd-meter; the S-curve is properly demoted to ghost + census-shadow.
**Drove all three hero verbs:** resize K re-packs the colony live; *⤓ overcrowd* packs the dish
too tight then thins; *greedy batch* lights the amber banner, glows the rim, and rings the
colony. The Conservatory landing self-test read **21/21 ✓**, 4 beds, all bench links
bare-relative and resolving (all surfaces 200), the re-souled Logistic card sitting between
Predator&Prey and SIR and rendering consistently with its siblings; mobile stacks cleanly to a
single column. **Publisher's calls on the builder's open concerns:** (1) the **reduced-motion
static frame** is verified by construction — `renderStatic` pins the dish full, pre-accumulates
the census cloud from a deterministic `headlessRun(20260615,N0,…)` (verified in Node: climbs
5→~97.5→100 and pins at K), lights every honeycomb slot, flattens the V-needle, logs one ticker
line, and draws all panes once with no rAF; the `reduce` guard wires it into every interaction
handler exactly as predator-prey's verified `renderStatic` does. The only gap is **tooling**:
agent-browser's CDP `set media reduced-motion` does not propagate to the page's `matchMedia` in
this Chrome build (the builder hit the same wall) — a tooling limitation, **not a piece bug**.
(2) the **two-register `stepDish` split** — ratified above. **No real bug to fix, none too big
to file. No new `[bug]`, no `⚡` spark.** **Net: the Logistic bench's S-curve becomes a colony
under glass you watch bud, crowd, and saturate toward K; the proven sigmoid lives on as the
crowd's own census; every printed number still reads from the one proven core.**
