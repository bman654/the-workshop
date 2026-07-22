# The Bead That Falls Like Light

A cross-bench where **the curve of fastest descent and the path of least-time light are literally one road.**

Draw your own ramp from **A** (top-left) to **B** (lower-right) and race it against the light path.
Three runners release on one clock:

- **the gold bead** — the *cycloid*, the brachistochrone, timed by [The Brachistochrone](../../brachistochrone/)'s
  closed-form `√(r/g)·θB`;
- **the teal photon** — a refraction ray solved by [The Photon's Errand](../../refraction-run/)'s own
  `solveFermat` on a finite stack of graded glass where the index rises so that **n(y) ∝ 1/v(y) = 1/√(2gy)**;
- **your amber ramp** — a monotone spline through draggable knots.

The bead and the photon land in a **dead heat**, because two utterly different laws are the same statement:

| | the bead (mechanics) | the light (optics) |
|---|---|---|
| invariant | Beltrami first integral **sin θ / v = const** | Bouguer's **n · sin θ = const** |
| with n ∝ 1/v | | **the same equation** |

So the least-time bead path and the least-time light ray are one cycloid. A live chip reads
`var(sin θ / v)` along your ramp and breathes **green** as you tune toward the law — you *feel* the law
before you race. Pull your knots onto the gold road and a **gap-to-light** counter shrinks toward zero; a
dead-heat latch + chime fires the first time you land within 2%. You can only ever fall *like* light: a
hand-drawn ramp `y(x)` can never take the cusp's vertical dive, so the last sliver is light's alone.

## The pieces

- **`core.mjs`** — the SOLE math authority (a DOM-free ESM). Imports both parents byte-untouched
  (`../../brachistochrone/core.mjs`, `../../refraction-run/core.mjs`) and owns the *bridge*: the graded
  index `n∝1/√(2gy)`, the shared `sin θ/v` invariant, the drawn-ramp family, and the three-runner clock.
- **`index.html`** — the bench, built by forge from `index.src.html`. It inlines the CORE slab byte-for-byte
  and imports both parents as namespaces, so what you see is exactly what the tests prove.
- **`core.test.mjs`** — the Node twin (`node core.test.mjs`, 22 checks). Re-proves every claim, cross-checks
  the invariant against **both** shipped cores, and asserts byte-twin parity + core-disjointness.

## The claims (proven headless AND in the page pill)

1. **Invariant, in both cores** — on the cycloid `sin θ/v` is constant (relSpread < 1e-4); refraction-run's
   own `bouguerInvariant` on the equivalent graded round is constant to machine-ε.
2. **Same road** — the photon's least-time crossings lie on the cycloid (perp offset < 1e-2 tank units at the
   shipped M=64) and clock the same time (|T_photon − T*| < 0.1 ms).
3. **Neg-control (load-bearing)** — a straight ramp *shatters* the invariant (var > 50× the cycloid's) **and**
   is strictly slower; a vacuous "always steady / always tie" checker fails here.
4. **Payoff-liveness** — in the animation clock the gold bead and the photon finish within < 1 frame (dead
   heat *enacted*) and beat the straight ramp by a visible margin; **and** the actual rendered photon polyline,
   fed through the *same* invariant code the live widget uses, drives the chip to steady green.

## Finite-M honesty

The photon's graded stack is a *finite* stack of **M = 64** thin layers, sampled away from the cusp (where
`n → ∞` is the same integrable singularity the bead has). On that M the Bouguer invariant is constant to
machine-ε and the ray sits on the cycloid to ~2e-3 tank units; it converges to the continuum cycloid as
M → ∞. The near-cusp slice is drawn as the analytic cycloid continuation — matching refraction-run's own
finite-M honesty.

---
*Sky: the third star of **The Pilot** — "Flies the least-time road; falls into the law." This bench is that
myth made literal.*
