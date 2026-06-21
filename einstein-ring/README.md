# The Ring Made of One Star

An Einstein ring you author by hand. One background star, one **dark mass** in front of it. Grab the
mass and drag it: the star's light **splits into two crescents**; line the mass up exactly in front of
the star and the two crescents reach around and **fuse into one complete bright ring** — the Einstein
ring. Every photon is placed by the lens equation, not painted. A mass dial fattens the ring
(θ_E = √M); turn it to zero and the lens does nothing (one un-bent image, the built-in negative control).

## The files (the Equal-Area Sweep's file grammar)

| file | role |
|------|------|
| `core.mjs` | the **sole** lensing authority — pure, DOM-free, canonical θ_E-units. Inlined byte-true into `index.html` between the `/* CORE BEGIN */ … /* CORE END */` sentinels. |
| `core.test.mjs` | the headless Node twin — `node einstein-ring/core.test.mjs` ⇒ EXIT 0 (40/40). Re-derives every headline claim + byte-parity. |
| `index.src.html` | the authored page (carries the `<!-- forge:include core.mjs -->` directive). |
| `index.html` | forged byte-true from `index.src.html` via `tools/forge/forge.mjs`. **Do not edit by hand.** |
| `verify.sh` | the gate — `bash einstein-ring/verify.sh` (all green). |
| `CHANGELOG.md` / `README.md` | this. |

## The math (canonical units)

Angles are in Einstein-radius (θ_E) units. The point-mass thin lens, scalar form:

```
β = θ − θ_E²/θ   ⇒   θ² − βθ − θ_E² = 0   ⇒   θ± = ½(β ± √(β²+4θ_E²))
```

- **θ_E = √M** (declared, illustrative; physical θ_E = √(4GM/c²·D_LS/(D_L D_S))).
- Outer image θ₊ > θ_E (+ side); inner image θ₋ < 0, |θ₋| < θ_E (opposite side). By Vieta,
  `θ₊·θ₋ = −θ_E²` and `θ₊ + θ₋ = β` (exact). At **β = 0**, θ± = **±θ_E** — the full ring.
- Signed magnification `μ(θ) = 1/(1 − (θ_E/θ)⁴)`. **Brightness** `|μ₊|+|μ₋| = (u²+2)/(u√(u²+4))`,
  `u = β/θ_E`, ≥ 1 everywhere, → ∞ at β = 0 (a real ring has finite width). Bonus invariant:
  signed `μ₊ + μ₋ = 1` (light redistributed, never created).
- **Neg-control:** θ_E = 0 ⇒ one un-bent image at the source, μ = 1.

## The proof (two places)

1. **In-page self-test pill** — `LensCore.runSelfTest()`, green 7/7.
2. **Node twin** — `node einstein-ring/core.test.mjs`, EXIT 0, 40/40: exact roots (worst residual
   1.2e-13) + Vieta; β=0 ring at ±θ_E and β>0 one-out/one-in; θ_E ∝ √M; brightness = closed form, ≥ 1,
   signed μ₊+μ₋ = 1 (5.3e-15), per-image μ± vs closed forms; M=0 neg-control; β→0 divergence honest;
   domain guards; byte-twin parity of the inlined CORE region.

The "closure reads as one star" is a **perception** claim (eyeballed in-browser), deliberately NOT
asserted by the twin.

## Build & verify

```sh
node tools/forge/forge.mjs einstein-ring/index.src.html   # forge index.html from src
node einstein-ring/core.test.mjs                          # headless twin, EXIT 0
bash einstein-ring/verify.sh                              # full gate
```

## Honest scope

A **thin-lens point-mass** in illustrative **sky-units** — *not* GR ray-tracing. The lens equation and
its magnification are exact; the units are illustrative.

Sibling to the [Equal-Area Sweep](../equal-area-sweep/index.html); back to [the Orrery estate](../orrery/index.html).
