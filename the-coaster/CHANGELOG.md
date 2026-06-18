# The Coaster — changelog

## Cycle 131 — sown (the Midway's lit flagship)

THE COASTER · *The Loop You Dare to Shape* — a real coaster you **shape** and **ride**,
not a chart of one. The flagship bench of the new **Midway** amusements wing.

**What it is.** A side-view rail you build from three draggable handles — a **hoist**
(release height), a **valley** depth, and a **vertical loop** whose radius `r` you set by
dragging its apex. Pull the chunky **release** lever and a gold bead runs *your* track
under gravity alone. It either **whips over the top** or **peels off the rail and falls** —
and the split is one number that is pure geometry: a loop survives **iff h ≥ 2.5 r**.

**Three stacked organs (the motion IS the readout — no plotted curve is the subject):**
1. **The Track** — the hero verb. A glowing teal **2.5r tie-line** moves with the loop as
   you drag `r` (proving the ratio is geometry, not a magic number); a live `h / 2.5r`
   danger-ratio pill reads legal/illegal. A one-tap **⚡ DARE** pre-shapes the biggest loop
   the current hoist can *just barely* clear — the max-airtime soul moment, one pull away.
2. **The Energy Column** — top-anchored blue **PE** band, bottom-anchored gold **KE** band,
   and a fixed white total line that **never moves** (frictionless ⇒ E conserved). You watch
   the conserved sum hold while the split sloshes; a soft **AIRTIME** tag near a just-legal
   crest.
3. **The Normal-Force Needle** — a real gauge reading `N(θ) = m v²/r + m g·cosθ`, green
   while `N ≥ 0`, pegged to a red zero-stop the instant `N → 0` — which is the exact instant
   the car **detaches** and becomes a free ballistic projectile (not a renderer that slides
   it round regardless).

**Ghost rider** overlays two releases at once (2.6r over · 2.4r under) so the bifurcation
is one glance — both call the *same* core path predictor.

**The math (authority in DOM-free `core.mjs`, Node twin `core.test.mjs`, chip === twin):**
- **Geometry-lock:** the loop arc is a TRUE circle, `κ === 1/r` to machine precision (so
  2.5r is geometry, not approximation).
- **CLAIM 1 — conservation:** `max|E−E₀|/E₀ < 1e-9` along the integrated track.
- **CLAIM 2 — survival predicate:** integrated survival === the analytic `h ≥ 2.5r` across a
  band, and bisection finds `h*/r = 2.5` (the textbook value, **derived** not asserted).
- **CLAIM 3 — exact detach angle:** `cosθ_d = −(2/3)(h/r − 1)`, matched by the integrator;
  at detach `v² = −g r cosθ_d` (the N=0 condition; the bead goes ballistic).
- **CLAIM 4 — load-bearing negative control:** `alwaysSlide()` completes every sub-2.5r
  release the real `integrate()` **detaches** — they disagree across the whole sub-threshold
  band, so an always-completes renderer provably FAILS. Plus anti-vacuity (a just-legal
  release survives).
- **CLAIM 5 — derived:** the top-of-loop speed read off the conserved trace equals
  `√(2g(h−2r))`, and at `h=2.5r` it equals `√(gr)` (N_top = 0).

`node core.test.mjs` → **33/33 ✓ ALL GREEN** (14 shared in-page claims + deeper Node-only
assertions + byte-for-byte re-extraction parity of the inlined core).

**Honesty.** Frictionless point mass; a rigid, exactly circular loop; the rail can only
*push* (N ≥ 0), never pull. The claim is precisely `v_top² ≥ gr ⟺ h ≥ 2.5r` and its felt
consequence — not a real clothoid loop, not friction, not a wheeled car.

**Cross-link:** reciprocal with [The Brachistochrone](../brachistochrone/index.html) — there
the curve is *fixed* and you race for the fastest descent *time*; here the curve is *yours*
and the question is whether the bead *survives the loop at all*. Opposite questions about a
falling bead on a curve; not merged.
