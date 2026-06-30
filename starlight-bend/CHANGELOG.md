# The Light That Falls Around a Star — changelog

The grounds' optics wing, second pilot. *Gravity is just an optical medium — fly the same least-time
road, bent by a star instead of by glass.* A real-time camera fly-through in deep space: you grab a
brass diamond on the dashed sight-line, slide the **impact parameter b**, and watch the faint-gold
predicted ray whip harder as b shrinks toward the limb. Launch and the cyan streak you fly is the very
ray the math integrates — it bends around a dark body and you **thread the hidden star** by the light
that falls around it. Tighten onto the axis and a whole **fan of rays closes into a full Einstein
ring**. A **mass dial** sweeps M→0 (the ray goes dead-straight: no mass, no lens). The FLOWN cousin of
*The Ring Made of One Star* (which holds the same ring still) and the gravity-well twin of *The Photon's
Errand* (the same least-time bend, through slow glass).

## Built (cycle #373, BUILD/garden — the planter)

Grew the garden into a new optics fly-through sibling, deepening **The Pilot** (Optics' fly-through
constellation 1→2 stars) — reached FROM refraction-run, no new front-door footprint (M stays 34).

- **`core.mjs`** — the SOLE light-deflection authority (zero-dep ESM, no DOM), the
  einstein-ring `var BendCore = (function(){…})()` IIFE idiom between the `STARLIGHT-BEND CORE
  BEGIN`/`CORE END` sentinels, inlined byte-identical into the page (the twin proves parity). Scaled
  units G=c=1; `r_s = 2GM/c²` the sole mass knob; the **Eddington index** `n(r)=1+r_s/r`.
  - **`alphaNumeric(rs,b,N)`** — the deflection by Simpson integration of the transverse gradient
    field under a **tan-substitution** `x=b·tan t` that maps the infinite line to the bounded, smooth
    integrand `(rs/b)·cos t`. Worst rel-err **3.2e-8** at N=64; fourth-order (16× error drop per N
    doubling). `alphaWeak(rs,b)=2rs/b=4GM/c²b` is the closed form it matches.
  - **`alphaSolarGrazing()` = 1.7515″** — the famous 1919 number falls out with no extra constants
    (`r_s,⊙ = 2GM⊙/c² ≈ 2954 m`, `b = R⊙`).
  - **`bendRay(b, rs, scene)` → { points, alpha, asymptoteOut }** — THE AUTHORITY THE RENDER DRAWS.
    The running heading has the EXACT closed form `θ(x) = −(rs/b)(x/√(x²+b²)+1)` (the antiderivative of
    the same smooth integrand); the polyline is marched over a **bounded scene window** (y from the
    impact parameter b at the upstream edge, swinging by α downstream), while `alpha` stays the exact
    full-line `2rs/b`. **No second cosmetic path anywhere** — the drawn streak IS this polyline.
  - **`thetaEinstein(rs)` ∝ √rs (= √M)** — the ring-radius scaling the climax shares (register-only,
    no shared module) with einstein-ring; the render reads it, never a 2nd hardcoded ring constant.
  - b is **floored at the body limb** (never integrate through the mass — a physical floor that kills
    the b→0 NaN and keeps the weak-field expansion honest). rs=0 ⇒ θ≡0 ⇒ a dead-straight polyline.

- **`core.test.mjs`** (Node twin) — pins the cruxes: (1) numeric α ≈ weak-field <1e-6 over a b×rs grid
  + solar = 1.75″ + Simpson 4th-order; (2) **2M ⇒ 2α** to machine-ε; (3) **rs=0 ⇒ α=0** exactly AND
  bendRay dead-straight (the M→0 neg-control); (4) **picture==proof** — `bendRay.alpha === alphaWeak`
  to machine-zero and the drawn endpoint slope === α; (5) byte-parity of the inlined slab; (6)
  **cross-link** — feeding this core's Eddington index `n(r)=1+2GM/rc²` into refraction-run's
  least-time solver conserves the SAME Bouguer invariant `n·sinθ` to machine-ε (the two least-time
  roads, one conserved law — `import bouguerInvariant` unforked, never rebuilt); (7) θ_E ∝ √M.
  **16/16 green.** `runSelfTest()` lives in the slab and mirrors the twin (5/5 in the green pill).

- **`index.src.html` → `index.html`** (forged, dependency-free, all inlined) — the flown deep-space
  scene. Chrome echoes refraction-run, retuned to deep space (#05070d, stars not glass). The camera
  reuses **vantage `projectNorm` UNFORKED** (a pre-composed world-translation), looking down the
  orbital plane so the transverse bend gets real vertical screen extent; the anchor drifts gently with
  the probe for starfield parallax (the "flown" feel). A **seeded mulberry32 starfield** (140 points,
  never foraged). The **dark body** is a near-black disk + brass limb-ring + amber accretion-halo
  (canvas-drawn, no bitmap). The **b-grab**: a draggable brass diamond on the dashed asymptote, a live
  `b = N R★` tick, and a faint-gold predicted bent path (the same bendRay) that whips as you slide.
  Full keyboard a11y (slider role, ←/→ ±0.05 R★, Shift ±0.2, Space launch, R reset, aria-live).
  **Four rounds**: R1 wide → R2 graze-the-limb → R3 **doubled-mass** (α visibly doubles) → R4 **on-axis
  ring climax**. The **arc→pair→ring** locus is a fan of ~180 rays each integrated by `bendRay`, drawn
  as the circle of arriving images around the body: β large ⇒ one bright arc, β shrinking ⇒ a symmetric
  pair of crescents, β<LOCK_EPS ⇒ the full closed ring + a radial brass flare. The **mass dial** sweeps
  M→0 (dead-straight ray, the tactile neg-control). Drops `ws:seen:starlight-bend` gated on ring-lock
  OR ~20s dwell.

- **`tools/sky/sky.js`** (two additive edits) — CATALOG add `starlight-bend {x:392,y:548,mag:2}`, a
  mag-2 companion 62px below founder refraction-run(392,486); and **The Pilot** feat-group grows
  `members: ['refraction-run','starlight-bend']` (1→2 stars; the engraved name now sits over two dots).
  ADDITIVE — never feeds the wings-only capstone. `node tools/sky/sky.test.cjs` 73/73.

### Honest scope
Weak-field optical-analog deflection — `n(r)=1+2GM/rc²`, the Eddington index — **not** full GR
null-geodesic tracing. The famous factor of two is baked into that index; the ring climax is
illustrative-on-axis. The **picture is the proof**: the drawn ray is bendRay's integrated polyline and
the green pill mirrors the Node twin exactly.

## Polish (cycle #373, publisher fresh-eyes)
- The canvas-drawn **"hidden star" label** sits at the far +x edge of the scene (the target's screen x),
  so its right half spilled off the canvas right edge on desktop AND mobile (read "hid"). Clamped: it now
  right-anchors inside an 8px margin when the target hugs the edge, centres on the target otherwise — the
  full words always read, both widths. Render-layer only; CORE + byte-parity untouched (16/16 still green).
