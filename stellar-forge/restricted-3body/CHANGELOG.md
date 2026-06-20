# The Balance Points — changelog

The Stellar Forge's 6th bench. The restricted, circular, planar three-body problem made touchable:
a Sun and an Earth turn rigidly together, you ride the co-rotating frame, and a massless probe
feels three things at once — the Sun's gravity, the Earth's gravity, and the centrifugal push of
the spin — summed into the gradient of one effective potential Ω. The five Lagrange points are the
exact zeros of ∇Ω; drag a probe to feel the field, release it to watch it fall / slide / loop a
tadpole; cross the Gascheau mass-ratio bound and L4/L5 flip from holding to ejecting.

`--hue:#e0b24f` (gold-calm) · glyph △.

## Architecture

- **`core.mjs`** — the SOLE math authority (zero-dep ESM, G≡1, ω≡1). The effective potential
  `Omega(x,y,μ) = ½(x²+y²) + (1−μ)/r1 + μ/r2` and its analytic gradient / Hessian; `collinearRoot`
  (safeguarded Newton–bisection, the Lifeguard anti-fling guard — a Newton step is taken only when
  it stays strictly inside its bracket, else it bisects, so it can never fling across a primary);
  `lagrangeTriangular` (closed-form equilateral L4/L5, r1=r2=1 exactly); `partialsL4` / `eigenLambdas`
  / `maxEigenRealPart` (the L4 libration biquadratic λ⁴+(4−Oxx−Oyy)λ²+(OxxOyy−Oxy²), complex-sqrt
  branch when the λ² discriminant < 0); `gascheauBound`; `coriolisHalfKick` / `stepProbe` (the
  implicit-Coriolis kick–drift–kick — the SINGLE integrator source); `jacobiC`; `witness()`;
  `runRestricted3BodySelfTest()`.
- **`index.html`** — the live bench; the core body inlined VERBATIM between
  `// ===== RESTRICTED-3BODY CORE … =====` sentinels, then the view/interaction layer. The page
  imports the core's `stepProbe` (no separate approximate stepper). `PHYS_DT = 0.004` is the SHARED
  fixed timestep the Node twin also uses.
- **`core.test.mjs`** — the Node twin (exit 0). Runs the core's self-test, adds independent
  re-derivations (FD-vs-∇Ω, FD-vs-Hessian, eigenvalue residual, bisection roots, the exact Gascheau
  root, a 201-pt fine sign-flip sweep, Jacobi on a longer horizon, the neg-control at independent μ
  pairs, the wrong-Coriolis-sign anti-myth reproduction, domain guards), and a BYTE-PARITY leg that
  asserts the inlined slab is byte-identical (indentation-normalized) to `core.mjs`.

Note: stellar-forge benches are hand-maintained `.html` (no `.src.html` twins, NOT in the forge
`--src` set), so byte-twinning is hand-done and enforced by `core.test.mjs`'s parity leg.

## Claims & proofs (self-test legs, all green)

1. **Collinear roots zero ∇Ω** — |∂Ω/∂x| < 1e-9 at L1,L2,L3 over μ∈{.001,.01,μ_G,.05}; each root
   inside its analytic bracket (anti-fling). (max ≈ 5.6e-15)
2. **Triangular L4/L5 equilateral** — r1 = r2 = 1 exactly (the 60° asserted as r1===r2===1) and
   ∇Ω = 0. (max|r−1| ≈ 1.1e-16)
3. **Stability flip across μ_G** — 27·μ_G·(1−μ_G) = 1 (μ_G = 0.03852089650455137…); maxRe(λ) = 0
   below the bound and > 0 above it. THE headline law: the Trojan calm is born of a small mass
   ratio, not the geometry.
4. **Jacobi conserved** — |C − C0| < 1e-3 along a bounded μ=0.01 release off L4 (the integrator
   correctness gate; ≈ 6e-4 over 40k steps at dt=0.004).
5. **Neg-control** — the SAME rest-release off L4 (offset 0.015) stays bounded at μ=0.01 (maxDist
   ≈ 0.27 < 0.5) and EJECTS at μ=0.06 (maxDist > escape=5). The eigenvalue flip made motion.
6. **Guard** — ∇Ω and Ω finite (no NaN) at and adjacent to both primaries (r < 1e-12 guards).

## An honest note on the Coriolis sign (anti-myth, documented in core.mjs)

It is folklore that flipping the Coriolis sign "ejects the probe / blows the Jacobi constant up." It
does NOT — empirically falsified here: a sign flip is a near-symmetry of the L4 libration; a
wrong-sign integrator stays bounded and conserves a *mirror* Jacobi. So the self-test does NOT
assert "flipped sign ejects." The Coriolis sign is pinned instead by (a) the Jacobi constant (leg 4
catches a grossly wrong integrator) and (b) the live page's directed, prograde tadpole sense (a
visual canary). The falsifiable discriminator is the μ-bound neg-control (leg 5). The Node twin
reproduces the falsification explicitly (`anti-myth` leg).

## Publish review polish (cycle #193)

The fresh-eyes review caught a real discoverability gap in the hero verb. "Reset to L4" placed the
probe *exactly* on L4 (∇Ω≈0), so the obvious first move — reset, then press release — produced
near-zero motion that never became a tadpole; and the libration amplitude is steeply sensitive to
the release offset (offset 0.015 → maxOut 0.25, closes in ~3.7s wall-clock; offset 0.03 → maxOut
2.10, ~60s, reads as an ejection). A first-time visitor could rarely hit the watchable window by
hand. Fix:

- `resetToL4` now PRIMES a tadpole: it places the probe a small, deliberate hair off L4 (offset
  0.015 — the same offset the neg-control self-test leg uses), the amplitude that librates a bounded
  loop and closes in a few seconds. The exact-on-L4 snap still lives on the **L** key cycle, where
  "balanced, ∇Ω≈0" is the point.
- The reset button reads "↺ prime a tadpole off L4"; the held-state narrative gains a primed-tadpole
  line that tells the visitor to just press release. "Reset → release" now demonstrates the headline
  claim on the first try. View-layer only — the core sentinel slab is untouched (byte-parity leg
  still IDENTICAL, 19/19).

## Cycle

- Built cycle #193 (BUILD/garden). Bloomed from the "Balance Points" seed (sown #189).
