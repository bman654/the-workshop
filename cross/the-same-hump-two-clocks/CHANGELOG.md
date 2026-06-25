# The Same Hump, Two Clocks — CHANGELOG

A cross of **The Conservatory · Logistic Growth** (`conservatory/logistic/`, the continuous colony under
glass) × **The Road Into Chaos** (`bifurcation/`, the logistic map's period-doubling cascade). ONE hump,
the parabola `r·x(1−x)` on `[0,1]`, read by two clocks — and the two clocks end in opposite fates.

## #324 — bloomed (the first build)

**The one idea.** There is exactly ONE hump here. Hand it to a CONTINUOUS clock (the flow `N′ = r·N(1−N)`)
and it ALWAYS glides to one calm level and rests — for EVERY `r`, forever. Hand the SAME hump to a DISCRETE
clock (the map `x ← r·x(1−x)`, one jump per tick) and it SPLITS: past `r=3` the single level forks to a
2-cycle, then 4, 8, … and past `r≈3.57` it BOILS into chaos. Same hump. Two clocks. Opposite fates.

**The canonical decision (K = 1 everywhere).** To make "same hump" LITERAL in code, the flow is re-based
onto the same normalized hump the map uses — carrying capacity `K = 1`, so `N′ = r·N(1−N)` on `[0,1]`. Then
the flow's lit-fraction is `N` directly (it rests at `N=1`) and the map's is `x` directly (already in
`[0,1]`). Both dishes read `[0,1]` identically, so the ONLY visible difference between them is the clock.

**The form (form expresses content).** Not a bifurcation diagram — two LIVING glass dishes side by side
under one shared brass rim, ported from the Conservatory's own in-house lattice (`buildSlots`/`litFor`: a
jittered-hex lit-cell packing clipped to a disk, lit inner→outer). Both dishes share the SAME seed, so they
are pixel-mirror lattices and the parallax IS the clock:
- LEFT — THE FLOW (continuous clock): the dish smoothly BREATHES up to the gold rim and rests, glowing
  steady green, for EVERY `r` — no overshoot ever. At `r=3.9` it still just fills and holds.
- RIGHT — THE CROWD (discrete clock): the SAME dish, but the lit-fraction JUMPS each TICK to the new `x`
  (no lerp — discreteness is felt). A brass metronome tick-arm snaps on each beat; between ticks the dish
  holds dead-still. `r=2.8` → one level (cool blue, period 1); `r=3.2` → rings between TWO lit-levels (amber,
  the 2-cycle); `r=3.9` → THRASHES (coral flicker, chaos), with a ghost-rim marking where the flow calmly
  rests so the eye sees the crowd leaping over the line the flow never crosses.

**The hand verb.** ONE brass growth-lever, `r ∈ [2.6, 4.0]`, with THREE magnetic fate-detents labelled by
FATE not number — `r=2.8` "both calm" · `r=3.2` "they split" · `r=3.9` "one boils, one holds". A casual push
snaps into the nearest stud (ease-out + brass flash); a deliberate slow drag holds an in-between `r`. A thin
red HAIRLINE at exactly `r=3.0` sits on the lever — where the map's fixed point loses stability (`|2−r|=1`)
while the flow shows nothing. On every stop-change both dishes RESET to the shared seed `x₀=0.05` and replay
the divergence live. A `▷ sweep` auto-climbs `2.6→4.0`; a `↻ replay this split` re-seeds without moving the
lever. The ring/thrash are PERPETUAL live animation (two settled states would lose the soul).

**Why each fate is forced (the math, pinned).**
- The flow's only interior rest is `N=1`, and its stability is the field's slope there: `f′(1) = −r`. That
  is NEGATIVE for every `r>0` — it can never cross zero — so the rest is stable for all `r`. There is no
  bifurcation to have. (This is the neg-control made visible.)
- The map's fixed point `x* = 1−1/r` is stable only while `|f′(x*)| = |2−r| < 1`, so it loses stability at
  EXACTLY `r=3` (`|2−3| = 1`). Past 3 the level rings between two, then four, then boils (Lyapunov `λ > 0`).

**Single-source discipline.** Both parent cores are imported byte-untouched (`git diff` shows ZERO bytes
changed in `conservatory/logistic/core.mjs` and `bifurcation/core.mjs`). The cross core (`core.mjs`) is the
SOLE authority for the bridge, with two CODE-DISJOINT adapters: the FLOW adapter names only the conservatory
ODE fns (`field`, `fPrime`, `fixedPoints`, `trace`); the MAP adapter names only the bifurcation map fns
(`MAPS`, `periodOf`, `lyapunov`, `iterate`, `cobwebOrbit`) plus the shared hump. The ONE freshly-typed line
is `mapFixedSlope(r) = 2−r` — the map's textbook fixed-point derivative `f′(x*) = r(1−2x*)` at `x*=1−1/r`,
simplified (the bifurcation parent exposes no map-derivative export). The dishes AND the green chip read ONE
wrapper, `clocksReading(r)`, at the live dial — never a private recompute, so what you SEE is what is TESTED.

**The self-test (proven exact).** The in-page green chip runs the SAME `runSelfTest()` the Node twin runs.
Six legs: (1) `r=2.8` both calm — flow `eig=−2.8` stable, `endN→1` monotone no-overshoot, map period 1;
(2) `r=3.2` SPLIT (headline) — flow rest `eig=−3.2` stable, `endN→1`, no overshoot, map period 2, diverged;
(3) `r=3.9` flow tames / map boils — map `λ=0.4899 > 0` & period 0, flow still `endN→1` stable; (4) neg-ctrl
FLOW — `eig@rim=−r` over `r∈{0.5..100}`, worst `|eig+r| = 0` (can never bifurcate); (5) neg-ctrl MAP —
`|2−3| = 1` EXACTLY, `|@2.9| < 1 < |@3.1|` (straddles the first doubling); (6) anti-vacuity — `diverged=false`
@2.8 AND `=true` @3.2 (bites both ways). The Node twin (`core.test.mjs`) adds: byte-twin parity (`index.html`
CORE === `core.mjs` CORE); SENTINEL PARITY (each parent's OWN inlined slab still matches that parent's
`core.mjs` — if a parent drifts, the bridge fails loudly); adapter disjointness (grep); determinism; and pill
parity. All 25 sub-checks green.

**Accessibility.** `prefers-reduced-motion: reduce` (or `?rm=1`) → no rAF tween, no metronome: a static
three-column strip (`r=2.8 / 3.2 / 3.9`). Flow = a full calm dish ×3; crowd = one level / TWO stacked rings
(the split MUST show as two) / a scattered thrash field. All meaning readable static. Zero horizontal
overflow at 1280 and 390 (dishes stack vertically on narrow).

**Wiring.** The bifurcation↔conservatory nav edge is wired BOTH directions (the bifurcation topbar links to
this leaf as "the same hump, read as a flow"; the conservatory/logistic footer links to it as "the same hump,
read tick-by-tick"). The leaf links to BOTH parents + the map's cousin (`two-roads-one-rhythm`) + the
Workbench. Registered as a card in the Workbench's Computation group (glyph 🍵). Every href resolves.

**Foundry assets named (low-fi placeholders ship; the foundry may enrich later).** The glass-dish vessel
(ported lattice + rim; foundry could add caustic/rim glint); the brass metronome tick-arm; the band-split
animation (one level cleanly dividing into two); the boil (never-repeating churn at `r=3.9`); the ghost-rim
+ divergence flash; and (optional, OFF by default, name only) a soft TICK per discrete beat vs a continuous
breath-pad under the flow. The shipped placeholders are honest and legible; none is load-bearing on a claim.
