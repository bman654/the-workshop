# The Holonomy Walk — changelog

A curved-country room where **your fingertip is the parallel-transported vector**.
Carry a gold spear around a loop on a court you can bend; it comes home pointing
wrong, and that leftover twist Δθ *is* the curvature you enclosed (Gauss–Bonnet).

Founds the **CURVED COUNTRY** wing on the grounds (district `grounds`, tier 1,
wing `curved-country`). The seed promises siblings — a Gauss–Bonnet polygon whose
angle-sum betrays K, a cone you walk for its deficit angle, a torus where curvature
cancels — so the wing sub-region is sized for growth.

## Founding (cycle 191)

**The hero verb.** Pick the gold spear off the surveyor's geodesy net and drag any
freehand loop. At every micro-step the engine applies the curved metric's discrete
Levi-Civita connection (dψ = (1 − S′(r)) dθ), so the spear visibly rotates even
though your hand never twisted it. A frozen slate **ghost-north** needle rides
alongside so the gap is always legible. Close the loop near your start and a brass
protractor blooms at the start showing Δθ — the holonomy — as a swept arc with a
live number.

**The court (form expresses content).** A top-down brass surveyor's geodesy court:
a geodesic-polar net of meridians (straight rays) and parallels (circles drawn at
screen-radius ρ(r) = S_K(r)). It is **flat on screen on purpose** — you read the
chart of a curved world you cannot see bulge; that restraint *is* the lesson. NO
3-D globe. A knurled **curvature dial** bends K continuously SPHERE → FLAT → SADDLE
and the **mesh breathes**: parallels bunch toward the rim on the dome (ring-3 frac
0.388), spread on the saddle (0.289), linear when flat (0.333).

**The three grafts.**
- **A — the flat detent.** At K=0 the dial CLICKS into a real brass detent and the
  run goes deliberately boring: the spear refuses to turn, Δθ = 0 for ANY loop —
  navigation goes Euclidean exactly when geometry does.
- **B — the Gauss–Bonnet cartouche.** Shows ∮ (measured twist via transport) vs
  ∬K dA (curvature over the signed enclosed region); when they agree it **latches
  green**. The core never hard-codes a milestone — it computes the value for the
  loop actually traced (a latitude loop is 2π(1−cos√K·r), NOT a quarter turn).
- **C — the two-grain deviation.** Two grains dragged "north" converge → **kiss**
  on the dome (a solved event, s = π/(2√K)), splay → flee on the saddle, stay
  parallel forever when flat, with a translucent gap ribbon making the pinch/yawn
  legible.

**The figure-eight.** Opposite-winding lobes enclose curvature of opposite sign; a
balanced eight closes with Δθ ≈ 0 even though each lobe alone twists hard (+/−3.2°
→ net 0). The lobes shade warm (+) / cool (−); a balance tally reads +Ω_L − Ω_R → 0.
This isolates SIGNED enclosed area as the sole cause against length/path confounds.

## Math authority + self-test

`core.mjs` is the SOLE source of truth (zero-dep, DOM-free ESM, the constant-curvature
family ds² = dr² + S_K(r)² dθ², S_K degenerating smoothly to flat at K=0). It is
forge-inlined byte-for-byte into `index.html` between the `HOLONOMY CORE BEGIN/END`
sentinels; `core.test.mjs` asserts the inlined copy is byte-identical. The on-court
spear heading comes from `transportAlong`; the dial drives ONE K consumed identically
by transport, `holonomyByArea`, and the deviation geodesics.

**`node holonomy/core.test.mjs` — 14/14 green.** In-page pill — 7/7 green.
- (1) transport −∮S′dθ == enclosed ∬K dA to machine ε over 6 K × 6 random loops (Gauss–Bonnet).
- (2) latitude loop Δθ === 2π(1−cos√K·r) exact (and HONESTY: not a quarter turn).
- (3) FLAT K=0 ⇒ Δθ EXACTLY 0 for any scribble; grains stay equidistant.
- (4) balanced figure-eight cancels (<1e-6) while one lobe stays ≫0 (signed area).
- (5) parallelogram holonomy = K·area; = 0 EXACTLY at K=0 (failure to commute).
- (6) deviation gap == Jacobi cos/cosh; kiss at s=π/(2√K), ξ→0 (<1e-9).
- (7) bridge K·A_K(r) === 1−S′(r); sign-true; byte-twin parity index.html === core.mjs.

## Files

- `index.src.html` (authored) → `index.html` (forged; core inlined byte-true)
- `core.mjs` — the sole math authority (~190 lines)
- `core.test.mjs` — the Node twin (14 checks)
- `CHANGELOG.md` — this file
