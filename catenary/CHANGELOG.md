# The Catenary — CHANGELOG

A Workbench bench (Toys & benches group, placed right after **The Soap Film**, its
2-D cousin: the catenoid is "the catenary spun"). The curve a hanging chain finds
for itself is **y = a·cosh((x−x₀)/a)** — *not* a parabola (Galileo's famous wrong
guess; proved a cosh by Bernoulli, Leibniz and Huygens in 1691). Self-contained,
zero-dependency, single-file `index.html`.

## What it does

- **Pin a chain at two points** (drag the pins, or use the Span / Height-offset /
  Slack sliders) and it hangs as the analytic catenary, solved in closed form.
- **Overlay the best-fit parabola** of the *same length and endpoints* — the
  impostor visibly diverges (rounder at the bottom, pinched at the sides).
- **Drop & relax a bead chain** — N point-masses joined by inextensible links,
  relaxed by constrained gradient descent on potential energy (a Verlet-style
  position constraint). It settles onto the exact analytic cosh (the physical
  proof that the catenary is the energy-minimiser).
- **Flip ↑** — the inverted catenary, the line of pure compression: the shape of
  a self-standing arch (Gaudí hung chains to design his; the Gateway Arch is a
  weighted catenary).
- Six presets (power line → heavy chain → uneven pins → pulled-tight → arch),
  live read-outs (a, sag, length, PE of both curves), PNG export.

## The promise — self-test (7/7)

Click the chip top-right; per-check PASS lines print to the console. The test runs
on a fixed slack config (h=1, v=0.3, L=2.6) so its proof is about a clearly-sagging
chain, independent of the live UI state.

1. **Solver hits both pins & the arc length** to ~1e-16 (endErr + lenErr).
2. **Satisfies the hanging-chain ODE** |y″| = √(1+y′²)/a across the span
   (residual ~4e-6) — THE differential equation of a constant-horizontal-tension
   chain. (Tested in sign-independent magnitude form so it holds in the page's
   y-down frame.)
3. **Minimum PE among equal-length rivals** — beats the equal-length parabola,
   and beats a fan of length-matched sine perturbations of the catenary itself
   (so it's a true minimum, not just better than the parabola). *Only equal-length
   curves are compared — comparing different lengths is meaningless.*
4. **Bead-chain relaxation converges to the cosh** (RMS deviation < 0.02; ~6–7e-3
   in practice).
5. **Bead chain conserves its length** (inextensible links; L pinned to ~1e-10 by
   a 6000-pass Gauss–Seidel cleanup that converges geometrically).
6. **Deterministic** — same pins ⇒ same a, to 0.
7. **The parabola FAILS the chain ODE** (large residual ⇒ it is the wrong curve) —
   the falsification check.

## Build notes / bugs the self-test caught (2026-06-13, Opus 4.8)

Built directly (not via deputy). A headless Node mirror of the in-page math was run
*before* the browser and caught four real bugs the eye would have missed:

- **Parabola length-bisection branch was inverted** — `solveParabola` returned the
  bracket endpoint p=−8 (a wildly deep, wrong-length parabola, PE = 68) instead of
  the correct equal-length p≈−0.74. Arc length *decreases* from lo→hi, so the
  `>L ⇒ raise lo` branch was backwards. Fixed.
- **Orientation sign flip** — `a·cosh` opens *upward* (dips negative), but the page's
  world is y-down (sag = positive y). The chain rendered sagging the wrong way and
  the bead/analytic comparison was off by a full curve depth. Fixed by solving in
  standard y-up math then negating at the `catY` boundary (chain hangs DOWN).
- **PE sign** — physical PE = ∫height·ds = −∫y_down·ds; the raw ∫y_down·ds would be
  *maximised*, not minimised. Negated so "lower PE = preferred" reads correctly.
- **Check 3 was comparing different-length curves** — the original parabola-depth
  sweep compared the catenary to arbitrary-length parabolas (a hugely-deep one has
  hugely-negative PE), which is not the variational statement. Replaced with an
  honest equal-length-rivals comparison (length-matched perturbations).
- **Bead relaxation under-converged on length** (2.64 vs 2.6) — the 200-pass cleanup
  wasn't enough; Gauss–Seidel projection needs ~6000 passes to pin length to ~1e-10.
  Bumped.

Browser-verified at served origin (cache-busted): self-test 7/7, chain sags down,
parabola overlay diverges, bead chain settles onto the cosh (HUD RMS 6e-3), flip→arch
works, `ws:seen:catenary` breadcrumb drops, 0 console errors. Wired into the Workbench
(Toys & benches, after the Soap Film); link 200, navigates, no name collisions.
