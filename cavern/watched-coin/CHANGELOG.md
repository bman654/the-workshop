# The Watched Coin — CHANGELOG

The Cavern's quantum Zeno bench (the Quantum Drift). A qubit that a coherent drive
would flip clean from |0⟩ to |1⟩ — but **peek at it often enough and the looking
itself freezes the flip.** A watched pot never boils. Built as a touchable Bloch dome
carved into the cavern wall, not a survival-curve plot.

## #356 — founded (BUILD/garden, planter)

**The idea.** A coherent drive rotates a qubit the full π from |0⟩ (north pole) to |1⟩
(south pole). PEEK at it N times, evenly, projectively along ẑ. Between peeks the state
drifts only θ = π/N up the meridian, so a peek finds it STILL at |0⟩ with probability
`p_peek = cos²(π/2N) = ½(1 + cos(π/N)) = pUp(n̂(π/N), ẑ)`. Surviving all N peeks (the
coin stays |0⟩) has probability `S(N) = cos^{2N}(π/2N)`. As N→∞, S→1: looking often
enough FREEZES the coin, and the residual flip scales as `P_flip → π²/(4N)`. The Itano–
Heinzen–Bollinger–Wineland trapped-ion experiment (Phys. Rev. A 41, 2295, 1990).

**The honest edges (math-verified).** N=0 (stop watching) AND N=1 BOTH give a full flip
— one peek taken after the whole turn still finds it flipped. The freeze is an **N ≥ 2**
story; the copy says "peek OFTEN enough," never "one peek freezes it."

**The form (a touchable Bloch dome, NOT a survival curve).** A glowing hemisphere carved
into the cavern wall: gold |0⟩ north pole, violet |1⟩ south pole, latitude/meridian
wireframe, the state needle riding the x–z meridian. The **deterministic at-rest freeze
cue** updates live on every dial change *before any play*: a max-drift WEDGE (half-angle
π/N), N peek-ticks chopping the would-be flip, and an expected-sawtooth strip below (N
teeth of height π/N). Crank N from 1 → 128 and all three shrink/densify — the wedge
collapses to a 1.4° sliver, the sawtooth flattens to micro-teeth hugging the |0⟩ line.
The **played** run is SAMPLED: each peek draws `u < perPeekSurvival(N) ? survive : boil`
against a shared stream, with a collapse-flash (shock-ring + tip-burst + yank-overshoot)
on every survive. N=1 always boils; N=2 boils ~75%; N=128 almost never — a watched pot
*occasionally* boils, rarer the harder you look. The displayed P(stay)/P_flip come
straight from the core, never from sampling.

**The negative control (the teeth).** "Rotate, don't collapse" drives the same chopped π
with the watching removed (no collapse between chops): the state sails clean to |1⟩,
survival flat 0 for every N — isolating that it is the WATCHING, not the chopping, that
freezes the coin. (Parallels the spin bench's classical-deflection smear.)

**The core (`core.mjs`, the SOLE Zeno authority, DOM-free).** Does NOT fork the Born
rule: it **re-imports** `blochVec`, `pUp` from `../spin/core.mjs` and builds survival
out of N independent calls to the verified single-peek projector. Exports
`survivalClosed` (cos+pow), `survivalSim` (the product route), `flipProb`,
`perPeekSurvival`, `peekAngle`, `survivalNoCollapse` (the teeth), `flipAsymptote`. The
first CAVERN bench to forge-include a SIBLING bench's core — the blessed cross-bench-
reuse move. The page inlines BOTH slabs via forge (`../spin/core.mjs` first under its
`// === CORE BEGIN/END ===` sentinels, then `./core.mjs` under `// === ZENO CORE
BEGIN/END ===`); `forge --check --all` is the parity gate.

**The proof (`core.test.mjs`, 7 rungs + the in-page pill).** (1) two routes agree —
`survivalClosed === survivalSim` over N=1..200 to <1e-9 (worst 3.1e-14 @N=171); (2) the
limits — N=1→flip 1, N=2→survival ¼ exactly, N=1000→survival >0.99, monotone; (3) the
N=0 neg-control survival 0 exactly (Object.is, both routes); (4) the teeth flat-zero
while survivalSim rises; (5) the asymptote — flipProb(1000)·1000 ≈ π²/4 (2.4644 vs
2.4674); (6) anti-circularity grep on the BUILT page — no second Born projector outside
the two core slabs (comments stripped first, so the borrowed core's header doc can't
trip it); (7) borrowed-core parity — the inlined spin slab === `../spin/core.mjs`
char-for-char. The in-page pill runs rungs 1–5 + the breadcrumb drop (6/6).

**Wired into the measurement family.** Cavern hub card (👁) after the Bomb; outbound
crosslinks → spin, interaction-free, two-that-knew; inbound from spin's lede, the Two
That Knew's teaser, and the Bomb's crosslink row (re-forged). Drops
`ws:seen:watched-coin`. No new front-door plate / sky star (it grows the Cavern). The
render loop carries a setTimeout watchdog so it survives rAF throttling.
