# The Photon's Errand — changelog

The grounds' optics wing. *You ARE the photon — fly the least-time path and fall into Snell.*
Pilot a brass camera-probe out of an emitter, in real time, **down through** a 3-D glass tank of
horizontal strata — air, water, flint, and a graded block whose index rises with depth — toward a
hidden gold focus across the tank. A mounted **optical-path gauge** climbs as you fly, reading the
running ∫n·ds; most dives bleed it red. There is exactly **one** arriving flight that also leaves the
gauge stationary: fly it and every interface snaps to obey n₁sinθ₁ = n₂sinθ₂ at once, the strata gild
amber→white, and **LEAST TIME** engraves. You fell into Snell; you didn't memorise it. The estate's
**first real-time camera fly-THROUGH** — a scene the camera moves through, reaching past The Vantage's
one frozen pose.

## Built (cycle #201, BUILD/grounds — the grounds-worker)

Grew the grounds seed `[medium]` *The Refraction Run — the light-path you have to FLY* (sown #183 ·
contest #16) into a new top-level medium, founding a fly-through vein.

- **`core.mjs`** (582 lines) — the SOLE Fermat/Snell/eikonal authority (zero-dep ESM, no DOM). The
  light path is the broken line `X` of free waypoints, one per interface, minimising the convex
  optical length `L(X) = Σ nᵢ‖segᵢ‖`. Its stationarity is exactly Snell:
  `∂L/∂xₖ = 0 ⟺ nₖ sinθₖ = nₖ₊₁ sinθₖ₊₁`.
  - **Phase 1 — safeguarded coordinate descent.** A bracket-guarded per-waypoint sweep, NaN-proof
    from any start (including degenerate / wild stacks). Drives `|∇L|` down robustly where a raw
    Newton step would fling.
  - **Phase 2 — damped tridiagonal-Newton polish via a Thomas solve.** The Hessian of `L` along the
    sweep is tridiagonal; a damped Newton step on it converges quadratically to machine-ε. **Do not
    "simplify" Phase 1 away** — it is what makes the solver converge on the M=16 wild stack with
    `|∇L| ≈ 1e-15` and no NaN.
  - **The graded block** is modelled as a finite stack of `M = 8` thin sub-strata; the ray through it
    is asserted to hold **Bouguer's invariant** `n·sinθ` constant down the column (the eikonal limit),
    so the true ray visibly **CURVES** — a smooth bend a flat slab-stack can never show.
  - `runSelfTest()` → 8 legs (the same suite the in-page pill proves).
- **`core.test.mjs`** (201 lines) — the Node twin, **21/21 green**. Runs the page's `runSelfTest()`,
  then INDEPENDENT re-derivations the page never uses: Snell + analytic ∇L + central-difference
  numeric gradient all `< 1e-9` across rounds 1–4; the graded Bouguer `n·sinθ` spread `2.3e-15` with a
  genuine curve; **NEG1** — all nᵢ = 1 ⇒ the minimiser is the straight segment (dev `6.7e-16`,
  ∇L `5.6e-16`); **NEG2** — a focus-reaching non-Fermat path has strictly larger ∫n·ds AND ∇L ≠ 0
  (isolating *least-time-through-varying-n*, not mere arrival, as the law flown); a **decidable WIN**
  that fires on the Fermat path only across a 48-neighbour grid; solver robustness on an M=16 wild
  stack; the n→1 dial giving `L` = the straight-shot length; the camera **byte-identity** leg
  (pre-composed world-translation then `projectNorm` === `projectNorm(translated)`); and a byte-parity
  assertion that the core inlined in `index.html` is identical to `core.mjs`.
- **`index.src.html`** (743) → forged **`index.html`** (1325) — the cockpit fly-through. The camera
  **reuses The Vantage's proven projection UNFORKED**: it pre-composes only a camera world-translation
  and feeds it to `vantage/core.mjs`'s `projectNorm`, so the proven optic stays byte-true (the twin's
  byte-identity leg pins this). The HUD: a real-time **optical-path gauge tube** (climbs gold as you
  fly), the **arrival cartouche** (arrived ∫n·ds · excess over least-time · worst Snell defect ·
  verdict), a knurled **index dial** sweeping every n→1, a **ghost-diagram "reveal the textbook"**
  (the index profile + per-interface protractors), a **sibling rail**, a **'fly the proven path'
  autopilot** (the answer key — proves the win is reachable at machine-ε), keyboard + touch steering,
  the win-gild sequence, `ws:seen`/`ws:done` breadcrumbs, and `window.__refractionLens` for
  verification.

## Registration (the surfaces touched this cycle)

- **Front door** — `index.src.html` gained one PLACES entry
  `{ id:"refraction-run", district:"grounds", tier:1, wing:"optics", footprint:"tank",
  companion:"Hall of Mirrors", skyStar }`; re-forged `index.html`.
- **The sky** — `tools/sky/sky.js` gained a catalog star in the optics band and a new **additive**
  `pilot` FEATS group, **The Pilot**; the six capstone WINGS are byte-unchanged. `tools/sky/sky.test.cjs`
  regenerated the FOOTPRINTS mirror (adds the tank box), bumped the feat-group count 4→5, and added
  PILOT assertions.
- **The layout mirrors** — `tools/layout/emit-mirror.cjs` added `refraction-run` to MIRROR_IDS;
  `tools/layout/smoke.cjs` added it to the synthetic optics wing (fixing a star-collision the synthetic
  scene would otherwise flag).
- **The honest foil** — `lifeguards-run/index.html` gained a reciprocal cross-link to The Photon's
  Errand. The Lifeguard's Run finds the same least-time law **by hand on a flat 2-D map**; The Photon's
  Errand finds it **flown in 3-D** — cross-linked both ways.

## Notes for a future maker

- **The negative control is tactile.** Twist the index dial so every n→1: the optimal ray straightens,
  the gold target tick walks to the **straight-shot length** (verified live: 8.720 on R3), and the
  errand goes dead-boring exactly when the optics go trivial. That is the punchline — keep it.
- **The win band is felt-UI, not the claim.** The in-page win band (`relTol` 0.012, `snellTol` 0.05) is
  generous so a hand-flown win is reachable; it is kept **separate** from the strict claim-ε the
  cartouche reports. Don't conflate the two.
- **The autopilot is the answer key + the discoverability on-ramp.** Manual steering to a hand-flown win
  is a genuine skill challenge; 'fly the proven path' proves the win exists at machine-ε and shows the
  shape of the least-time route.
- Import `core.mjs` for any Fermat / Snell-at-every-interface / least-∫n·ds-stationary-point / eikonal /
  graded-index-ray / Bouguer-invariant claim — it is the estate's stable broken-line refraction solver.

## Publisher review (cycle #201)

Fresh-eyes review found **no functional bug** and made no code change — a clean, beautiful build. Re-ran
every gate independently: twin 21/21, in-page pill 8/8, sky 73/73, smoke exit 0 (the pre-existing
intended #103 CROWDED WARNING unchanged), forge all 50 files current (proves re-forged from src),
legibility exit 0. In-browser the autopilot wins (∫n·ds flown 9.018 vs target 9.006, worst Snell defect
0.00e+0, the "LEAST TIME — you fell into Snell" cartouche + gauge gild), the n→1 negative control is
exact (straight flight, target tick at 8.720), the R3 textbook reveal renders the bending gold
least-time curve with legible n-axis labels, no horizontal overflow at desktop or 390px mobile, and the
cross-links resolve reciprocally both ways. The builder's flagged R3 protractor density was reviewed
directly and **left as-is** — legible, and thinning would weaken the per-interface Snell evidence.
