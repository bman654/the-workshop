# The Homicidal Chauffeur — CHANGELOG

## #347 — planted (you out-geometry it, you don't out-run it)

Isaacs' 1965 differential pursuit game, **played** — a Warren DEEPENING reached through the Warren's
reciprocal `.cousin` card (the discrete *where-you-stand* twin ↔ this continuous *when-you-jink*
one). No new front-door footprint: no `index.src.html` POI, no Survey-of-Heaven star, no gate
re-forge — **M stays 31**. A fast brass automaton car (the **pursuer**, `vp = 2·ve`) hunts a slow
pedestrian (the **evader**, you). The car is twice your speed — a straight flee is always run down —
but it can only turn inside a fixed minimum radius `R`. Your one tool is that constraint: lead it,
let it commit, then jink across its nose so it must swing wide, and slip through the overshoot to the
teal gate.

### Why it's true — one verified core, two readers
`core.mjs` is the single kinematic authority, fenced between `=== CHAUFFEUR-CORE BEGIN/END ===` and
inlined **byte-for-byte** into `index.html` (parity pinned in the test: 11510 == 11510 bytes). One
integrator — `advance(s, κ, ds)`, the exact constant-curvature arc — moves everything, so the played
game and the proof can never diverge in their kinematics. On top of it: the six closed-form Dubins
words (`dubinsWords`/`dubins`), the curvature-clamped pure-pursuit `pursuerStep` (`|dh| ≤ ds/R` — the
entire homicidal-chauffeur constraint), the scripted `flee` / `makeJink` evader policies, and the ONE
shared substep **`stepPair`** that BOTH the played RAF loop and the scripted `sim()` call.

### The played game (`index.html`)
Free-play over that same core: drag-to-steer (the evader walks toward your cursor at `ve`), an
omniscient pursuer handicapped ONLY by `R` (so a loss is honestly "I jinked wrong"), WIN = reach the
teal far gate, LOSE = capture. A three-round arc tightens the screw — **I · The Tell** (`R = 5.6`,
turn-circle ghosts on), **II · The Charge** (`R = 5.0`, `ℓ = 0.18` — the verified base case),
**III · The Wound Spring** (`R = 4.4`, a needle gate, ghosts off). A **Disarm the constraint (R→0)**
toggle makes the win evaporate live — claim [4] under the player's own hand. Heat-tail + commit /
near-miss feel signals, a brass escapement-plate scene, and a compact gesture-gated, `ws:pref:muted`-
aware WebAudio layer. All art procedural canvas; **zero foraged assets**.

### Proven (machine-ε, self-testing)
The in-page `#selftest` pill paints the four headline claims **4/4 ✓ Dubins**. The Node twin
`core.test.mjs` (run by `./verify.sh`) is **ALL GREEN** — the four-claim oracle plus heavy sweeps:
[1] 3000-config Dubins (length === integrated arc, lands on goal, worst |Δ| = 1.4e-14); [1b] an
**independent Newton-shooting oracle** over 320 configs (0 disagreements); [ODE] RK4 of the raw
unicycle ODE converging to the exact arc (err 3.4e-12 at N=256); [2] a scripted radial flee run down
in bounded time; [3] the optimal jink surviving ≥T at the real R (minSep = 2.39× ℓ); [4] the R→0
neg-control collapsing Dubins length to the straight-line distance AND catching the same jink; and
[BYTE] the inline-vs-module byte-parity.

### The negative control (the soul)
`R → 0` is the single lever. Turn it and the Dubins length collapses monotonically to the straight-
line distance `D`, and the very jink that escaped is now **caught** — proof that the pedestrian's only
tool was the car's *turning constraint*, never raw speed. The Disarm toggle puts that control in the
player's hand: with the constraint gone there is no overshoot to escape through.

### Gathered, not detached
Reciprocal `.cousin` framing cards link this room and `warren/the-crossing.html` both ways (one
lesson — *exploit the constraint, not your speed*); topbar uplinks to the Estate and the Warren; an
inert `ws:seen:the-homicidal-chauffeur` breadcrumb. A **third** pursuit piece would earn the family
its own dedicated landing; until then the two gather by link (see `warren/SPEC.md`).
