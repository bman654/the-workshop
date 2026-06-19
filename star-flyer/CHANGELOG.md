# The Star Flyer — changelog

## Birth (cycle 156)

The Midway's third lit ride: a conical-pendulum swing carousel you **crank** up to speed.
The angle the chains fly out to **is** the spin, made visible.

**The law.** A chair on a chain of length `L` attached at hub radius `r₀` flies out to a
steady lean `θ` when the carousel turns at rate `ω`. At equilibrium the chain's vertical
pull carries gravity and its horizontal pull is the centripetal force the orbit needs:
`T cos θ = mg`, `T sin θ = mω²R` ⟹ `tan θ = ω²R/g`. The twist that makes it interesting:
the orbit radius is **implicit** — `R = r₀ + L·sin θ` — so `θ` sits on both sides. The
lean is the root on `θ∈[0, π/2)` of `f(θ) = tan θ − ω²(r₀+L·sin θ)/g`.

**The solver + why.** `solveLean` uses **bisection** on `θ∈[0, π/2⁻]`. The bracket is
provably guaranteed for every `ω>0`: `f(0) = −ω²r₀/g ≤ 0` and `f(θ)→+∞` as `θ→π/2⁻`, so a
sign change always exists and bisection cannot diverge — unlike a fixed-point iteration,
whose map-slope can exceed 1 near the asymptote. Verified worst residual `1.28e-11 < 1e-9`
on the legible band `[0,3.5]`, `2.76e-11` across a wider `(r₀,L)` band.

**The embodiment.** A front-on swing carousel: a tapered brass mast rises to a hub disc;
six chair-chains splay outward. At rest the chains hang straight down; as you crank, the
canopy **opens like an umbrella** — the chairs fly out (orbit `R` widens) **and** rise
(`L·cos θ` shrinks). Both tells come from the same `θ`. A brass **protractor** on the side
and a live mini-protractor arc on the fullest chair share one mapper — both read the same
`θ = solveLean(ω)`. The needle angle **is** the lean. An engraved ghost tick marks the
previous settled lean so re-cranking shows the climb. The crank (and its accessible slider
twin) sets `ω` and nothing else; the canopy eases to the new equilibrium with a damped
spring so it **swings** in like real chains — that transient is the only decorative part;
every settled value (`θ, R, rise`) is the exact core value, and the live `f(θ)≈0` on the
ledger is the proof.

**The neg-control (the teeth).** A **rigid spokes (locked arms)** toggle swaps the chains
for bolted I-beam spokes and reads geometry from `rideStateRigid` — `θ≡0` for every `ω`.
Crank to the ceiling and the chairs just whirl flat at the rest radius, no rise, no splay.
The self-test proves `solveLeanRigid(ω) ≡ 0` disagrees with the real lean on every leaning
sample, and agrees only at `ω=0` (anti-vacuity).

**The parity standard.** `core.mjs` is the sole authority; `index.html` inlines it
byte-for-byte between `// ===== STAR-FLYER CORE (inlined byte-twin) BEGIN/END =====`. The
in-page chip calls the SAME `runSelfTest()` the Node twin (`core.test.mjs`) runs; the twin
re-extracts each inlined function char-for-char and asserts the chip count == the Node
count. `node core.mjs` and `node core.test.mjs` both exit 0; the in-page chip shows 7/7.

Sister ride: **The Drop Tower** — there you and the whole room fall together and the scale
forgets your weight; here the chains fly out and the angle they reach is the spin. Same
brass instruments, opposite felt story.
