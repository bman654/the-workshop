# The Top That Won't Fall — changelog

## Birth (cycle 269)

The Midway's tier-2 companion to **The Spinning Chair**, closing the estate's
angular-momentum triad: **"spin it fast and gravity can only steer it — never topple
it."** A bicycle wheel hangs from a ceiling rope by a gimbal at one end of its axle.
Held still it droops, axle nose-diving, dead weight on a string — but flick the rim and
at speed the axle *lifts to horizontal* and the whole wheel slowly **orbits the rope**.
The room is the gyroscope itself, the WHY drawn ON the wheel, not charted in a side panel.

**The law.** A wheel spun fast about its axle at `ω` carries angular momentum `L = I·ω`
along the axle. Gravity makes a torque about the gimbal `τ = r × (m·g·(−ẑ))`, magnitude
`|τ| = m·g·r·sinθ`, that is always **horizontal and ⊥ to the axle** (to `L`). Since
`dL/dt = τ` and a torque ⊥ `L` cannot change `|L|` — only its **heading** — the axle does
not fall; it swings sideways, tracing a horizontal circle. That is **precession**, at
`Ω = |τ|/(|L|·sinθ) = mgr/(I·ω)`. The `sinθ` **cancels exactly**. With `I=0.045`, `m=1.8`,
`g=9.81`, `r=0.22`, `ω=130`: the wheel precesses with a lap period ≈9.5 s.

**Two laws fall out.** (1) **Inverse law** `Ω ∝ 1/ω` — spin twice as fast and the orbit
crawls *half* as fast; the product `Ω·ω = mgr/I` is a constant of the wheel, held dead
flat on the rail's product plate as you scrub the spin (verified to <1e-12). (2)
**Lean-independence** — `Ω` has no `θ` in it (the `sinθ` cancelled): tilt the axle more and
the ring just gets *wider* at exactly the same lap time. A non-vacuous companion proves the
`τ` *magnitude* genuinely varies with `sinθ` (τ(0.3)=1.15 vs τ(1.2)=3.62) — so the
cancellation is real, not that nothing depends on `θ`.

**The right angle is the mechanism.** Each frame `τ` adds a tiny `dL = τ·dt` at `L`'s tip;
because `dL ⊥ L`, it changes `L`'s heading by `dφ = Ω·dt` but not its length. The page draws
this kink as a faint coral chevron; a live `τ·L = 0` chip with a right-angle glyph stays
green, and **SHOW THE KINK** frame-steps a single vector-addition notch at a time — the
pedagogical move a graph cannot do. The self-test confirms `τ·L === 0` at every heading and
a Pythagoras cross-check `|L+dL|² = |L|² + |dL|²` (so the `|L|` change is second-order in
`dt` — *that* is why precession holds).

**Honest |L| conservation.** Claim (2) does NOT fake `|L|` conservation to machine-ε. It
integrates the honest `dL = τ·dt` Euler step (the SAME `stepL` the page draws) around one
full precession lap and asserts the `|L|` drift is **bounded by a derived fast-top error
term** `≈ π·Ω·dt ∝ Ω/ω`, is genuinely **nonzero** (a real leading-order approximation), and
**shrinks** as `ω` grows (`drift(2ω) < drift(ω)` — faster spin is a better fast-top). The
integration step `dt = 5e-3` is chosen coarse enough that the systematic `O(Ω·dt)` overshoot
dominates float round-off — so the drift we read is the real approximation, not numerical
noise. This matches the Tide Wheel / Spinning Chair honesty convention: name the
approximation, prove the error obeys its own law.

**The neg-control (the teeth).** Hit **BRAKE** to bleed `ω→0`. The orbit accelerates (the
inverse law, the other way), the axle sags into a real nutation wobble, and then — with the
spin momentum gone — gravity finally topples the wheel straight down and it dangles dead.
`precessRate(ω=0)` is **non-finite** (the fast-top law blowing up); `topples()` flips `true`
in this limit, the exact opposite of the precessing branch. The crossover is `ω = √(mgr/I)`:
below it the wheel topples, above it it precesses, and the test exercises both branches and
proves they genuinely disagree. **RE-SPIN** revives it: fully reversible, no ratchet.
*Precession existed only because L was large.*

**The embodiment.** A fixed isometric-ish camera over a tiny oblique-projected 3-D world: a
ceiling hook, a rope, a gimbal pin, and a honest bicycle wheel — dark rim, hub, eight thin
spokes, an axle stub with a clamp weight. Two timescales render at once: the wheel's fast
spin smears the spokes into a translucent whirring disc (the fan spread is read off the live
core `ω`, never an eased fake), and the slow orbit of the whole wheel around the rope IS the
precession `Ω` (φ advanced by `Ω·dt` directly from `precessRate`). The axle tip paints a
precession ring on a faint floor grid; a lap counter and period sit on the brass rail.
Flick-to-spin (drag across the rim) makes the star control tactile.

**The triad.** Reciprocal cross-links close the angular-momentum triad: this page, **The
Spinning Chair** (`|L| = Iω` conserved, rigid-body), and **The Equal-Area Sweep** (`L`
conserved, orbital) now all name each other — *L conserved orbital · |L| conserved
rigid-body · L's heading steered by torque here.*

**The proof.** `core.mjs` is the sole authority — DOM-free, zero-dep, ~310 lines, inlined
byte-for-byte between sentinels into `index.html`; the in-page chip and `core.test.mjs` call
the SAME `runSelfTest()` (12 claims over a 5-model param sweep so nothing passes vacuously).
The Node twin adds deeper assertions over a 243-model grid plus byte-parity (page core ===
module core, all 15 functions char-for-char). `node the-top/core.mjs` exits 0; the full gate
is `bash the-top/verify.sh` (37/37 green).

**Files.** `core.mjs` (the physics authority), `core.test.mjs` (the Node twin + parity),
`index.src.html` → `index.html` (forge-built, self-contained), `verify.sh` (the gate).
Self-test: **12/12 in-page · 37/37 Node**.
