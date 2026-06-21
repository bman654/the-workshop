# The Ring Made of One Star — CHANGELOG

## #258 — first bloom: an Einstein ring you author by hand

**What it is.** One ordinary background star, and a **dark mass** you cannot see floating in front of
it — a thing that bends the light passing close to it. Grab the dark mass and drag it across the sky:
the star's light **splits into two crescents**, an outer one just beyond a dashed bullseye (the Einstein
radius θ_E) and an inner one just inside it on the opposite side. Slide the mass dead-centre in front of
the star (β → 0) and the two crescents reach around, their tapered tips **meet** across the bullseye, and
they fuse — via additive `lighter` blending — into one complete bright **ring**. A green `⊙ ALIGNED —
FULL RING` pin lights, a one-time soft bloom flares, and a toast reads *"A whole ring, made of one
star."* Every photon you see is **placed by the lens equation**, not painted.

**The law, made exact.** The point-mass thin lens, in scalar form, is

```
β = θ − θ_E²/θ          ⇒    θ² − βθ − θ_E² = 0
```

whose two roots are the two images: `θ± = ½(β ± √(β²+4θ_E²))`. The outer image θ₊ > θ_E sits along the
source axis; the inner image θ₋ < 0, |θ₋| < θ_E sits on the opposite side. By Vieta, `θ₊·θ₋ = −θ_E²` and
`θ₊ + θ₋ = β` — both exact. At β = 0 the roots are exactly **±θ_E**: the full Einstein ring. The per-image
magnification `μ(θ) = 1/(1 − (θ_E/θ)⁴)` is signed (outer +, inner −); the **brightness** sum
`|μ₊| + |μ₋| = (u²+2)/(u√(u²+4))` with `u = β/θ_E` is ≥ 1 everywhere and diverges honestly to ∞ at
β = 0 (a point-source ring is infinitely thin; the page's finite ring width keeps it physical). The
**bonus invariant** the meter carries: the *signed* sum `μ₊ + μ₋ = 1` — light is redistributed, never
created.

**The frame (the contract every facet obeys).** One canvas is the observer's sky view, in θ_E-units. The
**star is fixed** at the sky centre; the **lens (dark mass) is what you drag**. `β⃗ = S − L`, the scalar
`β = |β⃗|` crosses into the core, and `φ = atan2(β⃗)` is the source axis (outer image along +φ, inner
along φ+π). The render owns ONE transform `worldToScreen` (sky-angle → px); the interaction layer imports
it for pointer → β. The mass dial **fattens** the ring (`θ_E = √M`); it does not zoom.

**The soul — the negative control.** Turn the mass to **zero** and the lens does nothing: the bullseye
and ring vanish, the core returns a single un-bent image at the source, brightness collapses to ×1, and a
`no lens · μ = 1` badge says so. The same machinery that closes the ring proves the lens-does-nothing
case — built in, not bolted on.

**FORM expresses content.** The two crescents are drawn as tangential triangle-strip arcs at the two
image radii, brightness tone-mapped from |μ| (so a diverging μ saturates luminous-white, never NaN),
with a raised-cosine azimuthal taper whose half-width grows as the image nears the ring — so as β → 0
*both* arcs swing to a full half-turn and their tapered ends meet across θ_E, fusing into one continuous
annulus. A faint full-annulus "smear ghost" pre-suggests closure when nearly aligned; a "show true
source" ghost (toggle) draws a hollow ✦ at the star with dashed leaders to each image, so you can SEE the
two arcs are images *of that one star*. The closure-reads-as-one-star is a **perception** claim — the
perceptual constants got an in-browser eyeball pass; the twin does not assert it.

**A landmine, found and fixed in build.** At perfect alignment (β = 0) the per-image magnification is
**±∞**. The arc-drawing geometry (width, angular half-width) fed `√|μ|` straight into pixel coordinates,
so the very frame that should draw the closed ring produced `-Infinity` pixel coords and
`createLinearGradient` threw — silently killing the rAF loop exactly at closure. The fix clamps the |μ|
used for *geometry* to a finite cap (the brightness tone-map already saturates honestly); an offline
frame harness (a throwing canvas mock) now exercises β=0 / M=0 / heavy / tiny-β / ghost / lock-flare
paths and confirms no frame throws.

**Proved exact, two places.**
- An **in-page self-test pill** (green, 7/7) runs `LensCore.runSelfTest()`.
- A **headless Node twin** `node einstein-ring/core.test.mjs` (EXIT 0, 40/40) re-derives the headline
  claims across β ∈ {0,.3,1,2,5} × θ_E ∈ {.1,.5,1,2,5}: both images are exact roots of β = θ − θ_E²/θ
  (worst residual 1.2e-13) with Vieta exact; β = 0 closes a full ring at ±θ_E and β > 0 splits one-out /
  one-in with no violation; θ_E ∝ √M; the brightness sum equals the closed form and is ≥ 1 everywhere,
  the signed μ₊+μ₋ = 1 (5.3e-15), per-image μ± match the u-space closed forms; the M=0 neg-control gives
  one image with μ=1; the β→0 divergence is finite for β>0 and ∞ only at β=0; domain guards; and
  byte-twin parity of the inlined CORE region.

**Honest scope.** A **thin-lens point-mass** in illustrative **sky-units** — *not* GR ray-tracing.
Angles are in Einstein-radius (θ_E) units; the Einstein angle is declared `θ_E = √M` with constant 1
(the physical value is `θ_E = √(4GM/c²·D_LS/(D_L D_S))`). The lens equation and its magnification are
exact; the units are illustrative.

**A clean lensing core.** `core.mjs` is the sole lensing authority, pure and DOM-free, inlined
byte-true into `index.html` between the `/* CORE BEGIN */ … /* CORE END */` sentinels — the same pattern
as the Equal-Area Sweep, whose skeleton this clones (core sentinels, forge:include, self-test pill,
verify.sh, sibling rail).

**Registration.** A new observatory-district garden POI in the `celestial-mechanics` wing, reusing the
existing `tower` footprint — no new footprint tier, so `bigSwingsBuilt` is unchanged. Reciprocal
cross-link with the Orrery estate (the back-link home and the orrery's topright sib rail both resolve).
Sibling to the Equal-Area Sweep, the other touchable law in the observatory's celestial-mechanics wing.
