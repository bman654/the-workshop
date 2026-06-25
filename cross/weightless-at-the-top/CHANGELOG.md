# Weightless at the Top — CHANGELOG

A cross of **The Coaster** (`the-coaster/`, a frictionless bead on a shaped rail with a vertical loop) ×
**The Ferris Wheel** (`ferris-wheel/`, a turning gondola's apparent weight). ONE weightless crest reached
two opposite ways — a coaster bead that EARNS its crest speed by FALLING, and a ferris gondola DRIVEN to
crest speed by a MOTOR. Both float when the crest speed² equals `g·r`.

## #320 — bloomed (the first build)

**The one idea.** "Apparent weight goes to zero at the top" is one threshold with two mechanisms. On a
vertical circle of radius `r`, the crest is weightless the instant the crest speed² satisfies `v² = g·r`
— equivalently the crest angular rate is `ω₀ = √(g/r)`. Nothing about WHERE that speed came from is in the
condition. The **coaster (EARNED)** is released from height `h` and falls into a loop; energy alone sets
its crest speed, `v_top² = 2g(h − 2r)`, so a release from exactly `h = 2.5r` lands on `v² = g·r` and the
seat unloads. The **ferris (IMPOSED)** is turned by a motor at a dialed constant `ω`; its crest reads
`N_top = m(g − ω²r)`, which hits zero at `ω₀ = √(g/r)`. The same float, earned vs handed over.

**The bridge it proves (earned vs imposed → the same √(g·r) weightless crest).** Both mechanisms target
the SAME invariant: the coaster floats when its crest speed² = `g·r`; the ferris floats when `ω₀²·r = g`,
i.e. `(ω₀·r)² = g·r`. With the live shared radius `r = FW.R = 9` and `g = CO.G === FW.G = 9.81`, that
crest speed² = **88.29**. The two felt-weight needles collide on ONE shared zero, never a plotted curve.

**The form (form expresses content).** ONE dark-slate stage, a thin gold seam, two bays under ONE shared
crest-needle overlay:
- LEFT — the frictionless rail traced from the-coaster's own samples (an EXACT `r = 9` vertical loop). A
  release-height marker on the hoist tower + a gold detent at `h = 2.5r`. ▶ Release runs the bead every
  frame off `CO.integrate`: `h ≥ 2.5r` clears the top and the bead FLOATS FREE (gold halo); below it the
  bead DETACHES at the verdict's detach point and arcs off as a fading cyan ballistic streak.
- RIGHT — a ferris wheel of the SAME `r = 9` with one occupied gondola, turning at the dialed `ω`. The
  crest reads `FW.topN(ω, m, r)`: below `ω₀` it presses, at `ω₀` it unloads to 0, past `ω₀` it swings
  NEGATIVE and the lap-bar arc lights coral (kept honest, never clamped).
- TOP-CENTRE — ONE brass dial, axis = apparent weight at the crest in g-units, 0 at top-dead-centre. The
  COOL needle (falling-bead glyph) = the coaster's earned crest via `earnedNeedle(track, h)`; the WARM
  needle (motor-cog glyph) = the ferris's imposed crest via `imposedNeedle(ω)`. Raise `h → 2.5r` and dial
  `ω → ω₀` and the two sweep to the SAME zero from opposite mechanisms; when both cross within ε in one
  beat the 0-mark BLOOMS gold over a quiet `√(g·r)` engraving, with a soft optional chime and one line:
  "Same zero — one fell to it, one was driven to it."

**The hand verbs.** A `release height h` slider (`0.5r..3.0r`) with a gold detent at `2.5r`; a `spin ω`
dial (`0..1.6`) with a faint detent at `ω₀`; a shared `mass m` slider that MOVES the ferris force in N
while the ZERO never moves (the coaster crest is mass-free too — mass-invariance felt directly); a single
**DRIVE BOTH TO ZERO** button (the on-ramp — animates `h → 2.5r` and `ω → ω₀` together over ~1.5s so a
first-timer sees the convergence without hunting); an optional, mutable, never-load-bearing sound toggle
(reads/writes the shared `ws:pref:muted`).

**The live numbers (re-proven by the in-page gold pill AND `core.test.mjs`, all from the cores at
runtime — never hard-coded).**
- ROW 1 — **bridge machine-ε:** `|imposedCrestSpeed2(ω₀) − sharedCrestSpeed2()| < 1e-9` — measured
  **1.42e-14** at `r = 9`, `v² = g·r = 88.29`.
- ROW 2 — **bridge exact (===):** three diff-ZERO identities — `imposedCrestFelt(ω₀) === 0`,
  `ω₀²·r === g`, `earnedCrestSpeed2Analytic(2.5r) === g·r` — all byte-exact (the "g·r is the whole story,
  no fudge" headline), plus `CO.G === FW.G` (one gravity).
- ROW 3 — **earned through the parent (sample-limited, NOT ε):** the integrated coaster crest speed² at
  `h = 2.5r` lands on `g·r` to **v²/(g·r) − 1 = −1.11e-16** and the felt needle reads **−1.78e-15** — well
  inside the loose `1e-3 / 1e-2` floors (loose by design — the discretized scan can't hit the crest sample
  exactly; the tight bounds live on the analytic identities).
- ROW 4 — **neg-controls, each from its own authority:** the just-clear release (`h = 2.5r`) does NOT
  detach (`null`) while a hair below (`2.49r`) DOES (detach angle **3.026 rad**); and the ferris crest
  still PRESSES below `ω₀` (`imposedPress(½ω₀) = 7.3575` N/kg = ¾g, not weightless). Neither is clamped.
- ROW 5 — **byte-twin parity + disjointness:** `index.html` CORE region === `core.mjs` CORE region
  char-for-char (8498-char slice identical); the IMPOSED adapter names no coaster symbol, the EARNED
  adapter names no ferris symbol; both parents imported byte-untouched at the same `../../` hops.

**Single-source discipline.** Both parent cores are imported verbatim (`the-coaster`, `ferris-wheel`) and
left byte-UNCHANGED. The cross core is the SOLE authority for the shared-zero bridge; its two adapters are
code-DISJOINT (IMPOSED reads only `FW.*`, EARNED reads only `CO.*`). The page renders strictly through the
shared instrument readers (`earnedNeedle` / `imposedNeedle` / `sharedCrestSpeed2` + the coaster track &
detach verdict) — what you see is what the test consumes.

**Honest framing.** Frictionless point-mass bead on a rigid exactly-circular loop (the rail can only push,
not pull); a point-mass rider on a rigid wheel turning at constant `ω` (steady-state, no spin-up). The
claim is precisely the shared weightless crest (`v² = g·r ⟺ N_top = 0`) and its felt consequences (clear
the loop & float, or detach; press, float, or hang from the lap-bar). The aesthetic constants are not
proven; the shared weightless crest is. Reduced-motion freezes both rides at the converged weightless
state (gondola at the crest, bead at the crest), draws both needles statically on the shared zero with a
static lit bloom, and the DRIVE BOTH button jumps rather than sweeps — the scene stays drawn.
