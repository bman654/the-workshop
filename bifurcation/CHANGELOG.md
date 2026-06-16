# The Road Into Chaos — changelog

A Workbench bench: the **logistic-map period-doubling cascade**, with **Feigenbaum's
constant δ ≈ 4.6692 measured** (not assumed) from the cascade and proven. The estate
*draws* chaos in many places (Lorenz, the magnetic pendulum, the harmonograph) but
never *measured the road into it* — this bench is that missing meter. It is the
explicit chaos-sibling of `fractal-dimension/` (The Coastline Rule).

## v1 — 2026-06-13 (Opus 4.8, `/fun` BUILD session)

**The map.** `x → r·x(1−x)` on `x∈[0,1]`, parameter `r∈[0,4]`. As `r` climbs the
attractor period-doubles `1→2→4→8→…`; the doublings crowd together and accumulate at
`r_∞ ≈ 3.5699456`, beyond which lies chaos shot through with periodic windows.

**The falsifiable crux — δ is MEASURED.** At the *superstable* parameter `R_n` of a
`2ⁿ`-cycle, the critical point `x=½` lies on the cycle, so `f^{2ⁿ}(½) − ½ = 0`. That
residual is bracket-and-bisected to double precision, giving a clean ladder
`R₀,R₁,R₂,…`. Their window ratios `(R_{n−1}−R_{n−2})/(R_n−R_{n−1})` converge to
**δ = 4.66920** (measured to ~1e-5 with a 9-rung ladder). Known closed forms confirm
the rungs: `R₀=2`, `R₁=1+√5`, `R₂=3.4985617`.

**Universality, shown live.** The same δ falls out of the *sine* map `x→r·sin(πx)` and
the *cosine hump* — different formulas, identical 4.6692. That's the deep claim, not a
coincidence: δ is a property of the cascade, not of the algebra.

**The chaos witness — Lyapunov exponent.** `λ(r) = ⟨log|f′|⟩` along the orbit. `λ<0` is
order (a stable cycle); `λ>0` is sensitive dependence — chaos. Drawn as a curve under
the diagram, coloured by sign. At `r=4` it equals **ln 2 = 0.6931 exactly** (the known
value). The period-3 window at `r≈3.83` reads `λ<0, period 3` — order re-emerging from
chaos.

**Build note (a real subtlety, fixed).** The first Lyapunov pass seeded the orbit at the
critical point `x=½`. For the logistic map at `r=4` that point is *pre-periodic*
(`½→1→0`, a fixed point) and lands on a measure-zero orbit whose average is `ln4=2ln2`,
not the ergodic `ln2`. Fixed by seeding from a generic interior point so the time-average
samples the true chaotic measure. (This is why the self-test asserts `λ=ln2`, not just
`λ>0` — it would have caught the bug, and did.)

**UI.** Full-resolution raster orbit diagram (additive accumulation so dense bands glow;
ordered region blue, chaotic region warm, split at the measured `r_∞`). Draggable `r`
cursor across both panels; cascade ladder + `r_∞` wall overlaid; map presets (logistic /
sine / cosine); landmark presets (first doubling, into the cascade, onset of chaos,
period-3 window, full chaos); live readout of `r`, `λ`, and period; the measured-vs-known
δ verdict; the superstable ladder with per-rung δ; PNG export. House aesthetic
(gold/serif topbar, glass panel), matches `fractal-dimension/`.

**Verification.** `node core.test.mjs` → **15/15 green** (incl. the Lyapunov-seed fix);
in-page self-test **12/12**; browser-verified in agent-browser: diagram renders the
cascade + windows, sine map yields δ=4.66919 live, `r=4` shows λ=0.6931, period-3 window
shows period 3 / λ<0. Workbench card added (Toys & benches group), href resolves 200.

**Files.** `index.html` (self-contained, inlined core twin), `core.mjs` (Node-testable
twin), `core.test.mjs` (15 checks), this `CHANGELOG.md`.

## v2 — 2026-06-16 (Opus 4.8, `/fun` BUILD/garden — the `[rework]` re-soul, bloomed #70)

**Why.** v1 was *two plots and a draggable cursor* — you read about the road into chaos
but never **watched** the population period-double. The `[rework] The Road Into Chaos`
seed (sown #65) asked for the cascade *enacted*: a live cobweb you steer, the bifurcation
diagram demoted to a quiet map, Feigenbaum's δ kept as the proven layer. This rework is
that piece (built **in place** — same folder, same Workbench card).

**The new form — a cobweb staircase you steer.** The hero is now a live cobweb on the
logistic/sine/cosine hump (with the dashed `y=x` mirror + fixed-point rings): turn one
r-knob and a glowing pen walks the staircase — below r=3 it spirals into a single corner;
past 3.0 / 3.449 / 3.544 it visibly **opens** into 2, 4, 8 boxes — the cascade you *count
with your eyes*. A heartbeat strip reads the SAME orbit (steady when locked, ragged in
chaos); a violet LOCK loop traces exactly the period when λ≤0; the bifurcation raster is
demoted to a low-contrast road-map with a brass *you-are-here* marker. The proof (δ-ladder
+ self-test) lives in a closed drawer.

**One math authority.** `core.mjs` stays the SOLE source, byte-twinned char-for-char into
the page between `ROAD-INTO-CHAOS CORE BEGIN/END` sentinels. Appended `CASCADE_BANDS`,
`R_INFINITY`, `expectedPeriod`, `cobwebOrbit` (the sole staircase source), and
`detectOrbitPeriod`; `periodOf` now delegates to `detectOrbitPeriod(attractor(…))`. The
λ-first gate decides chaos before the box-count names the period, so chaos never draws a
solid loop.

**Verification.** `node core.test.mjs` → **30/30 green** (15 original + 6 live-period
claims [box-count == expectedPeriod == drawn period at band centers; periodic/chaotic
negative controls; short-staircase keep-default] + a 9-line byte-twin RE-EXTRACTION PARITY
block proving the inlined core === `core.mjs` char-for-char and the in-page self-test ===
the module self-test). In-page pill **10/10 ✓** @1280 and @390. Live: r-knob re-settles
the staircase 1→2→4→8→chaos as r crosses the published onsets; r=3.50 locks 4 boxes; the
period-3 window (r=3.83) reads *period 3 · λ<0* (order inside chaos).

**Publisher polish (#70, fresh-eyes).** (1) The advisory chip read a misleading
*"~ converging"* at the period-3 window (it's a settled order *off* the coarse cascade-map,
not a not-yet-settled state) → now *"~ a window off the road-map"* (chaos mismatches keep
*"~ off the road-map"*). (2) At ≤820px the equation hint overlapped the `y=x` label/curve →
hidden on narrow screens. (3) At ≤820px the x-axis numeric tick labels collided with the
hero caption → dropped below 820px (the grid stays). All three are page-side UI, outside
the core sentinels — byte-twin parity re-verified 30/30. Also rewrote the Workbench card
blurb from "this bench measures…" to "don't read about it — *steer* it / count with your
eyes" to match the new touchable form.
