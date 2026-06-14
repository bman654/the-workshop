# The Carnot Engine — CHANGELOG

The Engine Room's first bench. Operate the most efficient heat engine that can
possibly exist, on coupled **P–V** and **T–S** diagrams, and feel the wall that
no machine can cross: **η = 1 − T_c/T_h**.

## v1 (2026-06-14) — first build

**What it is.** A single self-contained, zero-dependency HTML bench. Two linked
planes side by side, hard-linked through the four state-points 1→2→3→4:

- **LEFT — the P–V plane (the work):** the four-leg Carnot loop — two isotherms
  (hot glowing `--firebox`, cold `--condenser`), two adiabats (dim grey). The
  **enclosed area is filled gold and labeled "W = net work"** — the area you
  watch grow/shrink *is* the work.
- **RIGHT — the T–S plane (the why):** the SAME four points form a perfect
  **rectangle**; its area `∮T dS = W` (same gold). This is the **master control
  surface** — the design's structural insight (after #0's coupled-diagram
  prototype, with its own mitigation: drag the T–S, re-solve the P–V, *not the
  reverse*, so the re-solve is one-directional and cheap).

**The three Carnot DOF**, dragged on the T–S rectangle: **top edge = T_h**,
**bottom edge = T_c**, **right edge = ΔS = nR·ln(r)** (the compression ratio r =
V₂/V₁). In Carnot mode you *cannot* draw a non-Carnot cycle — every drag keeps
T–S a rectangle by construction and η reads 1 − T_c/T_h. The re-solve is rAF-
throttled; the integration grid is modest (~600) during drag and refines (~2000)
on release.

**The efficiency tower + the ledger.** A vertical η-bar fills toward a **hard
ceiling line** labeled `η_Carnot = 1 − T_c/T_h`; the tip *kisses* the ceiling for
true Carnot, never crosses. Beside it a **Sankey-style energy ledger**: an
incoming `Q_h` band (firebox-red) splits into **W** (gold, out top — useful) and
**Q_c** (condenser-blue, out bottom — rejected), widths live and conserved
(`Q_h = W + Q_c` exactly). η is visibly the gold fraction of the incoming red.
Live numbers: T_h, T_c, r, ΔS, Q_h, Q_c, W, η_measured vs η_Carnot, ΔS_cycle.

**The "try to beat it" teeth.** A toggle that **replaces an adiabat with an
isochoric or isobaric leg** (an Otto-/Brayton-ish lobe) between the SAME
reservoirs — run through the SAME Path-1 integrator, no special-casing. The
η-bar drops below the ceiling and turns **amber**, the T–S figure stops being a
rectangle, and a **red lost-work wedge** opens (the area between the loop and the
enclosing Carnot rectangle = the work thrown away). A **heat-leak slider** injects
a finite-ΔT irreversibility; the **ΔS_universe meter** ticks *positive and red*
(reads exactly 0.000 for reversible Carnot), reporting the Gouy–Stodola lost work
`W_lost = T_cold · ΔS_universe`. **RESET TO CARNOT** snaps everything back.

γ default **5/3** (monatomic), switchable to **7/5** (diatomic); n and the
reference volume are fixed.

**The proof — two paths that share no formula.** The single source of truth is
`core.mjs` (pure, no DOM), inlined byte-functionally into the page and re-run live
by the self-test pill; the Node twin `core.test.mjs` extends the random/exhaustive
assertions.

- **PATH 1 (geometry, the honest oracle):** `W = ∮P dV` by from-scratch composite
  **Simpson** quadrature around the four legs. P(V) is sampled from each leg's own
  constraint — isotherms `P=nRT/V`; the adiabat traced by a from-scratch **RK4 ODE
  stepper** integrating `dT/dV = −(γ−1)·T/V` (never the closed form). Does NOT reuse
  η or the nRT·ln area formula. *(Build note: midpoint Riemann converges only
  O(h²) and needed ~32k pts/leg for the 1e-9 work tolerance — too heavy for the
  live pill. Switched both quadratures to **Simpson** (still a from-scratch
  Riemann-family weighted sum, NOT the closed form), O(h⁴), so a modest grid
  reaches ~1e-13 relative agreement.)*
- **PATH 2 (heat accounting, independent):** `Q_h = ∫T dS = nR·T_h·ln(V₂/V₁)` on
  the hot isotherm, `Q_c = nR·T_c·ln(V₃/V₄)` on the cold; `W_thermo = Q_h − Q_c`.
  Never touches the P–V loop area.
- **AGREEMENT:** the two collapse onto one number.

**Tiered tolerances** (per-assertion, or the test false-fails): Path-1↔Path-2 work
agreement **~1e-9** (quadrature-limited, NOT claimed as machine precision);
`η == 1−T_c/T_h` and the heat-side/closed-form comparisons **~1e-12**;
`ΔS_cycle = Q_h/T_h − Q_c/T_c` **~1e-12**.

**The named assertions** (★ = load-bearing falsifier):
1. ★ two derivations agree (`W_area == W_thermo`, ~1e-9, no shared formula)
2. ★ `η == 1 − T_c/T_h` (~1e-12)
3. ★ exactness over many random `(T_h,T_c,r,γ)` triples — Node twin: **5000**
4. ★ NO reshaped cycle (isoV/isoP lobe) between the same reservoirs beats Carnot —
   same integrator, no special-casing — Node twin: **exhaustive lobe enumeration**
   (350 in-page extension, dense grid)
5. ★ `ΔS_cycle == 0` for reversible Carnot (~1e-12)
6. volume-ratio fingerprint `V₂/V₁ == V₃/V₄`
7. ★ irreversible step loses AND `ΔS_universe > 0` strictly (== 0 for reversible)
9. adiabat invariant `P·Vᵞ = const` (γ=5/3 and 7/5)
10. ODE-integrated adiabat endpoint == closed-form `TVᵞ⁻¹` endpoint (the from-
    scratch stepper and the formula can't drift)
11. ★ γ-independence — η unchanged across γ∈{5/3,7/5} while cycle shape changes
12. closure/determinism (loop returns to start, clockwise ⇒ W>0, seed-pure)

**Well-posedness honored.** Heat-in for any loop is `Q_in = ∫T dS over dS>0` and
the bound is stated for *"any closed cycle whose temperature stays within
[T_c,T_h]"* (the reservoir generalization of Carnot's theorem), NOT "between two
isotherms" (ill-posed for an Otto/Brayton lobe). The M-B numeric cross-test was
**deliberately downgraded to the landing's bridge LINK only** — a 3-D engine gas
(PV=nRT, γ free) vs a 2-D kinetic-theory gas (PA=NkT, γ=2) is a dimensionality
mismatch we refuse to ship dressed as a pass.

**Self-test:** **11/11 in-page** (live, class `ok`) · **16/16 Node twin** (the
shared 11 + 5 exhaustive extensions: η over 5000 triples max |Δη|=4e-16; work
agreement over 200 triples max rel 1e-12; all 350 reshaped lobes lose to Carnot
strictly; ΔS_universe monotone in the leak; RK4 endpoint vs closed-form 1e-10 K).
The inlined core was extracted from the HTML and re-run in Node → 11/11
(byte-functional parity confirmed).

**Browser-verified** (agent-browser, served origin, `?v=` cache-bust): the bench
operates — dragging the T_h top edge 600→703 K raised η 50.0%→57.3% (=1−300/703)
and W 2740→3678 J, with the P–V re-solving; the isochoric lobe drops η to 29.7%
amber below the 50% ceiling and opens the red wedge ("you cannot win"); a 40 K heat
leak ticks ΔS_universe to 1.976 J/K red ("you cannot break even"). Q_h = W + Q_c
to the digit (5480.622 = 2740.311 + 2740.311), η = 0.500000. **~61 fps**, **0
console errors** through mode-switch + γ-toggle churn. Drops `ws:seen:carnot`.

**Aesthetic.** Warm forge palette matching the wing; the hot isotherm blooms
hotter than the cold; mono numerics; the work-area pulses faintly (frozen under
`prefers-reduced-motion`). Topbar chains back: "← The Engine Room" → ../index.html
and "↑ The Workshop" → the front door.

**Files:** `index.html` (self-contained bench + inlined core + pill) · `core.mjs`
(the pure source of truth) · `core.test.mjs` (the Node twin).
