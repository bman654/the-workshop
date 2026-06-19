# The Rotor — changelog

## Birth (cycle 169)

The Midway's fourth lit ride (fulfilling the reserved 🌀 stall): a wall-of-death spin
drum you **crank** up to speed, then **drop the floor**. The stick-or-sink **is** the
readout — no plotted curve. Its soul is that the drum **forgets your weight**.

**The law.** A rider of mass `m` stands against the inside wall of a drum of radius `r`
spinning at rate `ω`. The wall shoves them inward to bend them onto their circular path —
the normal force, the wall **press** `N = mω²r`. Once the floor is gone, only wall
friction (at most `μN`) fights gravity. The rider stays pinned exactly when friction
carries the full weight: `μN ≥ mg`. The mass appears on **both** sides and cancels:
`μω²r ≥ g`. So the threshold spin is `ω_c = √(g/(μr))` — **mass-invariant**, no `m` in
it. With `r=2 m`, `μ=0.45`, `g=9.81`: `ω_c ≈ 3.3015 rad/s`. Above it everyone is pinned;
below it everyone slides into the shaft, with the (also mass-free) slip acceleration
`a_slip = g − μω²r`, so a 95 kg adult and a 22 kg child sink in **lockstep**.

**The embodiment.** A front cutaway of the drum: a riveted brass cylinder wall (two
concentric arcs for thickness) whose banding **scrolls sideways ∝ ω** — a head-on
spinning cylinder reads as horizontal banding sweeping past, so you *see* it spin without
a top-down disc. Two rider silhouettes (95 kg adult + 22 kg child, labelled) stand against
the wall above a hinged brass **trap floor** (hinge left, lever right). Pull **DROP THE
FLOOR** and the plate swings down on its hinge, baring a dark shaft fading to black with
receding rivet-rings. Outcome is driven **entirely** by the core: each frame the feet sink
by `riderState(...).drop01 · SINK_PX`, the pose leans by `drop01²` when sliding, and the
contact glow is `holds(...) ? teal : coral`. Both riders read the **same** `drop01`
because `m` cancels — the visceral proof, drawn.

**The instruments.** A brass **tachometer** whose needle angle *is* `ω`, with a red
engraved **ω_c arc-mark** that physically **moves** when `μ` (frictionless) changes; its
register flips REST → below ω_c → ABOVE ω_c. A grafted **balance dial** races a fixed `mg`
weight tick against a filling `μN` friction-reserve column — coral `reserve < weight — you
SLIDE` until it **latches** teal `reserve ≥ weight — you STICK`, with a gold `ω_c`
hairline at the crossing (the inequality as a race you watch cross, no plotted curve). A
mono **verdict line**: `ω=… · ω_c=… · N=… N · HELD/SINKING`.

**The neg-control (the teeth).** A **frictionless wall (μ=0)** toggle. The wall *still
presses* — `N = mω²r` grows just the same, you can feel the crush — but the friction
reserve `μN` is dead at zero, so the riders slide at **every** spin, the dial never
latches, and the `ω_c` mark vanishes off the tach to `+∞`. The self-test proves
`holdsFrictionless ≡ false` across every spin **including spins above the real ω_c** where
the true wall holds — a non-empty disagreement, so the suite cannot pass vacuously — while
asserting `press` still strictly grows at `μ=0` (the honest distinction: spin presses,
only friction holds).

**The parity standard.** `core.mjs` is the sole authority; `index.html` inlines it
byte-for-byte between `// ===== ROTOR CORE (inlined byte-twin) BEGIN/END =====`. The
in-page chip calls the SAME `runSelfTest()` the Node twin (`core.test.mjs`) runs; the twin
re-extracts each inlined function char-for-char and asserts the chip count == the Node
count, ok-for-ok and name-for-name. `node core.mjs` exits 0 (9/9); `node core.test.mjs`
exits 0 (31/31, including re-extraction parity); the in-page chip shows 9/9.

Sister ride: **The Star Flyer** — there the chains fly *out* and the angle they reach is
the spin; here the floor drops *away* and friction pins you to the wall, your weight
forgotten. Same brass instruments, opposite felt story.

Kin ride (added cycle 174): **The Teacups** — here *one* spin pins you to a wall; there a
*second* spin blooms a flower and trades the lurch for a float.
