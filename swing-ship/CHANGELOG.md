# The Swing-Ship — changelog

## Birth (cycle 188)

The Midway's sixth lit ride: a parametric pendulum you **pump by changing its own
length**, not by pushing. Crouch (lengthen) at the bottom, stand (shorten) at the top —
pump the length at **twice** the swing's natural beat — and the arc climbs on its own,
no sideways drive at all. The swing **is** the readout; the goal is to *reach the loop*
(135°). Its soul is that resonance is born of **timing**, not of effort: the same pump,
mistimed, refuses to grow.

**The law.** A planar pendulum whose **length** the rider changes. For a point mass on a
massless rod of length `L(t)`, conservation of angular momentum about the pivot gives
`d/dt(L²θ̇) = −gL·sinθ`, which expands to the full nonlinear equation of motion

    θ̈ = −(2 L̇/L) θ̇ − (g/L) sinθ.

The `−(2L̇/L)θ̇` term is the whole story: **shortening** the rod (`L̇<0`) at the right
moment *feeds* the swing; **lengthening** it (`L̇>0`) bleeds it. There is no sideways
push anywhere in the equation. `core.deriv`/`core.rk4Step` integrate this exactly (classic
RK4); the renderer swings a real variable-length pendulum **from this authority** — the
arc you make by pumping is the seat's true motion, never a plotted curve.

**The natural frequency.** Held at a fixed length `L`, the small-angle motion is
simple-harmonic with `ω₀ = √(g/L)` (`core.omega0`, exact to `<1e-9` across `L∈[0.5,8]`).
The rider pumps by modulating the length at the modulation rate `ωₘ`:

    L(t) = L₀ (1 + ε·cos(ωₘ t + φ))     (core.lengthAt, with its exact L̇)

`ε` is the pump depth (default `0.08`), `φ` the phase; nominal `L₀=2.0 m`, `g=9.81`.

**The 2:1 resonance — the Mathieu tongue.** Crouch at the **bottom**, stand at the
**top** — twice per full swing — so the length is pumped at `ωₘ = 2ω₀`, *twice* the
swing's own frequency. Linearize (`sinθ→θ`) and the result is **Mathieu's equation**;
`ωₘ=2ω₀` lands in its **principal instability tongue**, where the amplitude grows
**exponentially with no external drive** — parametric resonance, the deep sibling of
ordinary driven resonance.

**The proof — Floquet theory (the honest, machine-precision claim).** The linearized
small-angle system is linear and time-periodic with period `Tₘ = 2π/ωₘ`. Its **monodromy
matrix** `M` maps `[θ,θ̇](0) → [θ,θ̇](Tₘ)` (`core.monodromy`); the eigenvalues `λ` are
the **Floquet multipliers** (`core.floquet`):

    |λ| > 1  ⇒ UNSTABLE — grows like λⁿ at rate σ = ln|λ|/Tₘ > 0   (IN the tongue)
    |λ| = 1  ⇒ marginally stable — BOUNDED, no secular growth      (OUT of the tongue)

Because `L` is periodic, `∫₀^Tₘ trace dt = ∫ −(2L̇/L) dt = −2[lnL]₀^Tₘ = 0`, so
**`det(M) = e⁰ = 1` EXACTLY** — a self-checking invariant the suite asserts to `<1e-9`
for every `(ratio, ε)`. Pump@2ω₀ ⇒ `|λ|>1` (`σ>0`); seed the integrator in `M`'s
dominant eigenvector (`core.dominantEigenvector`) and `ln(amplitude)` is **linear** in
time with slope `= σ` to integrator precision (`core.lnAmpFit`, residual `≈3e-12`, well
under `1e-9`) — exponential growth, proven.

**The neg-control (the teeth) — it's the FREQUENCY, not the effort.** The same pump depth
`ε` at `ωₘ=ω₀` (once per swing) sits *outside* the tongue: `|λ|=1`, bounded, and the mean
work per cycle (`core.meanWorkPerCycle`) is `≈1e-8 ≈ 0` against `0.33` at `2ω₀` — a `3e7×`
ratio. **Same effort, opposite outcome.** An anti-vacuity check pins the other end: pump
at `2ω₀` but with `ε=0` (no pump) → `|λ|=1`, no growth — the tongue needs a real pump, so
the suite can't pass vacuously. (Off-resonance `1.5×`, `2.5×`, `3×` are bounded too.)

**The embodiment.** A Midway-aesthetic page: a brass A-frame swing-ship (SVG, two riders)
that swings the real `θ`; a live `θ` readout; a **phase coach** lighting the crouch/stand
cues in rhythm with the arc; a pump-beat segmented control (`2×ω₀ · resonant` / `1×ω₀` /
`1.5×ω₀`), an `ε` pump-depth slider, **Auto-pump**, and **Reset**; a quiet **amplitude
envelope** rail that only *witnesses* the climb; and a live **Floquet verdict** strip
(`|λ|`, the climb/bounded call, `σ`). The visible ride **phase-locks the pump to the
swing's own motion** (how a real swinger pumps) so it stays resonant even at big arcs;
the Floquet proof is the small-amplitude statement where the tongue is defined. The two
are consistent — both encode the 2:1 timing — and the page says so explicitly.

**The proof harness.** `core.mjs` is the sole authority; `core.test.mjs` re-extracts it
**byte-for-byte** between sentinels in `index.html` and runs the **same** `runSelfTest()`
the in-page chip runs. The Node twin is **29/29 green** — the shared self-test (7/7),
plus full re-extraction parity (all 11 functions, the private linear helpers, and the
inlined constants char-for-char identical to the page core). The in-page chip reads
**7/7 ✓ proven** (`window.__swingShipSelfTest`).

**Honesty.** Idealized: a point mass on a massless, inextensible-but-length-programmable
rod, no air drag, no pivot friction; the integrator is classic RK4. The **visible swing
runs the full nonlinear EOM** (`sinθ`); the Floquet/Mathieu proof linearizes (`sinθ→θ`)
because the instability tongue is a small-amplitude statement — exactly where a swing
*starts* to climb. Two deliberate calls, both noted on the page: (1) the load-bearing
neg-control is the **frequency** (off-resonance), not a wrong *phase* at `2ω₀` — within
the principal tongue the growing solution dominates regardless of initial phase, so phase
is not a reliable control; frequency is rock-solid. (2) The exact claim is the **Floquet
monodromy** (`det=1`, `|λ|`, `σ`), cleaner and tighter than a noisy turning-point ln-amp
fit. Both encode the one truth: the 2:1 timing is the cause.

---

**Sister ride: The Star Flyer** — there a *conical* pendulum's chains fly out to a steady
lean (`tanθ = ω²R/g`); here a *planar* pendulum climbs by pumping its own length. Both
are pendulums on the Midway, different physics — the Swing-Ship is **not** derived from
the Star Flyer's core.
