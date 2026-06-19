# The Teacups — changelog

## Birth (cycle 174)

The Midway's fifth lit ride (the reserved 🍵 stall): a top-down tea-cup ride you **crank
by hand with two spins**. The seat's path — a **flower** — is the readout, no plotted
curve. Its soul is that *two* turns make a *rose*, and the rose only closes when the two
spins are in a rational ratio.

**The law.** A heavy brass **platter** turns at rate `Ω`. Bolted to it, offset by `R`, is
a **cup** that turns on its own pin at rate `ω` *relative to the platter*. A rider sits at
offset `ρ` inside the cup. The seat's world path is the sum of two circular motions, a
complex point `z(t)`:

    z(t) = R·e^{iΩt} + ρ·e^{i(Ω+ω)t}

The first term carries the cup centre around the platter at `Ω`; the second carries the
rider around the cup at the cup's **world** rate `Ω+ω`. This is an epicycloid / rose
family. With the defaults `R=1.0 > ρ=0.5`, `Ω=1.0`, `ω=0.5` (so `ω/Ω = 1/2`), the seat
already blooms a one-petal rose.

**The bloom — petals = the NUMERATOR.** Write the spin ratio in lowest terms `ω/Ω = p/q`
(`p,q` coprime). The flower **closes** — the seat returns exactly to its start — only
after the platter has turned `q` whole times, at the closure period `T = 2π·q/Ω`. Over
that one closed loop it grows exactly **`p` petals: the NUMERATOR**, not the denominator.
This corrects a common re-telling that the petal count is the denominator — it is provably
the numerator (`1/2`→1, `2/3`→2, `3/5`→3, `5/7`→5), settled in the self-test two ways: the
closed form `ω·T/(2π) = p` exactly, *and* a wrap-around count of radial lobes of `|z(t)|`
over `[0,T)`. The reduced **denominator** `q` is the *closure period* in platter-turns —
how long the bloom takes to close — not the petal count. Keeping `R > ρ` means the radius
never reaches 0, so all `p` lobes are honest outward petals (a clean rose).

**The felt pull — lurch ↔ float.** The rider's body feels acceleration, the second
derivative `a(t) = z″(t) = −Ω²R·e^{iΩt} − (Ω+ω)²ρ·e^{i(Ω+ω)t}`. As the two spins line up
or oppose, `|a|` swings between two exact bounds:

    aMax = R·Ω² + ρ·(Ω+ω)²    (the LURCH — both pulls add; the cusp where you're flung)
    aMin = |R·Ω² − ρ·(Ω+ω)²|  (the FLOAT — the pulls oppose; the crown where you ease)

A dense sweep over the closed loop attains both to `<1e-9`.

**The embodiment.** A top-down stall: an outer brass **platter** annulus (knurled rim +
three spoke-ticks so its spin is unmistakable) you drag to crank `Ω`; an inner brass
**cup** disc, offset by `R`, that you drag to crank its own spin `ω` and that carries the
seat bead at `ρ`. The renderer is **single source of truth**: it advances only
`bigTheta`/`smallTheta` and calls `core.seat(R, ρ, bigTheta, bigTheta+smallTheta)` every
frame — it never reimplements geometry. The seat's true world path is the **flower trail**,
coloured by live `|a|` (gold→coral toward the lurch). Drags use the trammel idiom
(`setPointerCapture`, angle-about-pivot, unwrap into (−π,π], a `MIN_R` twitch guard, one
hand one body — the platter coast freezes while you turn the cup). Coasting rides hold
their set speed; **magnetic ratio detents** ease `ω` toward the nearest small-rational·`Ω`,
and a click flashes the reduced fraction `ω/Ω = p/q` with the petal tally announced as the
**numerator**.

**The instruments.** A brass **G-needle** quarter-dial whose angle is `feltA(t)`, with an
engraved coral **LURCH** arc at `aMax` and a teal **FLOAT** arc at `aMin` read from
`core.extrema` — re-cranking **re-cuts** both arcs; the needle snaps coral/teal and glows
within ~2% of an extremum. A **sloshing teacup** glyph (side view) whose tea surface tilts
toward the felt-accel **vector** (`core.accelVec`) — it climbs the wall and flashes coral
at the lurch, goes flat with a teal weightless shimmer at the float; it uniquely shows the
*direction* you're flung. A serif **regime headline** naming the felt state in words
(`⟵ LURCH (the cusp)` / `FLOAT (the crown) ⟶`). One shared clock `t` drives the trail and
the gauge so cusp↔lurch and crown↔float are simultaneous by construction.

**The neg-control (the teeth) — lock the cup.** A brass **LOCK THE CUP** lever (key `L`)
sets `ω=0`: the cup stops turning on its pin. The two spins now co-rotate at the *same*
rate, so the seat just rides a **single circle** of radius `R+ρ` — a plain ring, **zero
petals** — and the felt pull goes *dead steady* at a constant `(R+ρ)·Ω²`, the tea sitting
perfectly level. The self-test proves the ω=0 ring is constant to `<1e-9` (radius and felt
pull both), and an anti-vacuity check proves any ω≠0 band has `aMax−aMin` strictly
positive, so the suite can't pass vacuously. This is the load-bearing proof by touch.

**Closure iff rational.** The flower closes for some finite time *iff* `ω/Ω` is rational.
Crank toward an irrational ratio like `√2/2` and the seat *never* returns — it fills an
annulus forever. The self-test hardens this: no return within a safe tolerance (`5e-4`)
over the first 2000 candidate periods for `√2/2` (the verified minimum return error is
≈`8e-4`), while every rational closes to machine precision.

**The proof.** `core.mjs` is the sole authority; `core.test.mjs` re-extracts it
**byte-for-byte** between sentinels in `index.html` and runs the **same** `runSelfTest()`
the in-page chip runs. The Node twin is **29/29 green** — shared self-test (8/8), closure
across 288 `(p/q,R,ρ,Ω)` bands, petals = numerator (two proofs), `|a|` extrema across 6
bands incl. negative `ω`, the ω=0 plain-ring neg-control, closure-iff-rational on `√2/2`,
and full re-extraction parity (all 13 functions char-for-char identical).

**Honesty.** A point-mass rider, rigid arms, no friction or drift; the spins advance at
constant rates `Ω` and `Ω+ω`. The closure, the petal count, and the felt extrema are
*exact*. Only the on-canvas scale of the drawing and the coast feel are nominal so the
ride reads on a finite stage; the trail is the seat's true world path, sampled finely. The
cranks clamp to `±9 rad/s`.

---

**Sister ride: The Rotor** — there *one* spin pins you to a wall and forgets your weight;
here a *second* spin blooms a flower and trades the lurch for a float. Same brass
instruments, opposite felt story.
