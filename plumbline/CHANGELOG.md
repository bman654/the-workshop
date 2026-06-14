# The Plumbline — CHANGELOG

📐 *the line is not an opinion* — the Least Squares bench. A standalone Workbench
bench in the **Computation** group (the third card, after The Mill ⚙ and The
Shannon Limit 📡). Slug `plumbline/`.

---

## v1 — the line is forced (2026-06-14, cycle #9 of the fun-forever loop)

**The claim.** Once you punish error by its **square**, exactly one line is best —
and three strangers who share no fit code all swear to the same slope. What's
PROVEN is conditional and exact (given squared loss, THE minimum, three routes to
≤1e-9); what's CHOSEN is the squared loss itself. The bench is honest about which
is which.

### The four-part claim — ONE shared core drives both the in-page pill and the Node twin
The core (`plumbline-core.mjs`) is the **sole authority**; the page inlines a
**byte-twin** of it between `// ===== PLUMBLINE CORE (inlined byte-twin) BEGIN =====`
/ `// ===== PLUMBLINE CORE END =====` sentinels (the partition.html pattern). The
Node twin re-extracts that slice and asserts each inlined fn === imported
`fn.toString()` **char-for-char** (the convex-hull re-extraction-parity harness).
Both `runSelfTest()` (the pill) and the Node twin call the SAME core functions; the
pill count (5/5) **equals** the Node twin's headless count.

- **CLAIM 1 — closed form == gradient descent (≤1e-9, source-disjoint).** `fitL2`
  solves the normal equations (closed form → `{m,b,sse,r2,r}`); `gdFit` is a
  from-scratch **diagonal-preconditioned** gradient descent (each coordinate's step
  scaled by its own Hessian diagonal — `lrM=lr/Σx²`, `lrB=lr/n` — so a single lr
  converges on every cloud and `b` reaches the floor in budget) returning
  `{m,b,trace}`. Over 60 seeds: worst Δm=**8.9e-16**, Δb=**4.4e-15** ≤ 1e-9.
  **SOURCE-DISJOINT:** a `.toString()` grep asserts `fitL2` names no GD machinery
  and `gdFit` names no closed-form solve — they share only the primitive sum/mean
  atoms (the convex-hull anti-circularity idiom). The agreement is a *theorem*, not
  a copy.
- **CLAIM 2 — the analytic Σr² is the strict FLOOR.** A perturbation jury
  (`perturbAllWorse`, a third stranger that reads only `sse`): over 40 seeds × 400
  random ±ε nudges of (m,b), **not one** perturbation beats the closed-form line.
  Deep Node-only witness: no point on any GD trace (120 seeds × thousands of steps)
  ever undercuts the closed-form Σr². The jury is non-vacuous — perturbing a
  deliberately-wrong flat line, ~46/400 nudges beat it.
- **CLAIM 3 — the R² triple identity.** `R² == 1−SS_res/SS_tot == r² (Pearson)²` to
  ≤1e-12 over 60 seeds (two INDEPENDENT routes: sums-of-squares vs the correlation
  coefficient), AND == **1.0 exactly** on collinear points (Σr²=0, |r|=1). Signed
  Pearson r carries the slope direction the square loses.
- **CLAIM 4 — the L1 teeth (control + robustness).** `fitL1` (least-absolute-
  deviations via **deterministic** fixed-cap IRLS, 60 iterations + a δ floor → a
  stable, repeatable {m,b}) lands on a DIFFERENT line than L2 on a noisy cloud
  (Δslope ≈ 0.27). Under a single dragged-far **high-leverage** outlier (the
  rightmost point — leverage grows with |x−x̄|), the L2 slope moves ≫ the L1 slope
  (e.g. L2 0.92 vs L1 0.00 — squared loss is unique but NOT robust). The M–B-style
  negative control: on a perfectly collinear cloud **L1 == L2** (the teeth bite
  where expected and not where they shouldn't).

### The coordinate / render spine
- **EQUAL-ASPECT continuous plane.** A fixed WORLD (x,y ∈ [0,10]); ONE pixels-per-
  unit scale `s = min(sx,sy)` shared by BOTH axes (centered padding on the slack
  axis). The make-or-break invariant — the same `s` sizes the plane AND the square
  sides (`side_px = |residual_data| · s`), so a residual square is a **true square**.
- **The page CALLS the fit, never re-derives it.** The render module contains
  `fitL2(` / `fitL1(` / `gdFit(` CALLS only, no fit math — so "the dragged line
  always equals the closed form" is true by construction (anti-circularity stays
  green for the page too).
- **Vertical residuals**, color-coded by sign (warm red above, cool blue below) —
  pedagogy: OLS minimises vertical error, x assumed known (NOT perpendicular/Deming).
- **Literal gold squares** (the "least SQUARES" reveal, default ON): each squared
  residual is an axis-aligned amber translucent square hung off the residual toward
  +x (mirrored near the right wall). The total gold area IS Σr².

### The readouts
- **Σr² floor gauge** (the Shannon-floor idiom, amber): the current Σr² fill with a
  hard floor tick at the analytic minimum; at rest the fill sits exactly ON the
  floor; a manual nudge / the L1 line makes it rise above and the floor glows.
- **R² as geometry:** the variance bar — one bar = SS_tot, gilt fill = explained;
  the gilt FRACTION literally IS R². The two-route identity shown side-by-side with
  a green `✓ identical (Δ ≤ 1e-12)` badge. Signed Pearson r shown next to R².

### The live feel
- Drag a point (grid-snapped, continuous plane) → `fitL2` recomputed
  **synchronously** in the pointermove → the line re-snaps THIS frame, glued to the
  cloud. Guard: below 2 distinct x-values the gauge greys + shows "need ≥2 points
  with distinct x" rather than a NaN line (the core guards too — `fitL2`/`gdFit`/
  `fitL1` all return `{ok:false}`).
- **Controls:** Scatter (fresh seeded cloud via the SHARED `makeRng`+`gauss`, so the
  Node twin reproduces it bit-for-bit), Add noise (the floor RISES, R² drops),
  **Tidy** (ease every point 60% toward the L2 line → Σr²→0, R²→1, the most
  satisfying single gesture — verified Σr² 6.22→0.00, R²→0.9999).
- **The GD ghost** (the centerpiece): on Scatter / "Watch GD converge", the closed-
  form line draws solid+gold immediately; a violet dashed ghost inits at a flat
  start (m=0, b=ȳ) and advances ~80 GD steps/frame along `gdFit().trace`, lerping
  toward each snapshot; when the gap closes it DISSOLVES with a badge
  "the same line, from two strangers' code · Δslope 5.6e-16 · Δintercept 2.7e-15"
  (verified live in-browser). Degrades to a static "GD = closed form ✓" badge and
  respects `prefers-reduced-motion`.
- **The teeth** (discoverable): a segmented L2/L1/both toggle. "Drag an outlier"
  flies the rightmost point off the line, auto-switches to **both** mode → the gold
  L2 line lurches toward the outlier while the violet L1 holds, with a badge
  "squared loss is NOT robust · L2 chases the outlier; robust L1 barely twitches".

### Color budget (the contract, stated in a code comment)
slate-blue = the L2 answer (`--accent #7fb2e6`) · amber = the Σr² floor / the squares
(`--floor #f0c674`, **REUSED from Shannon's H** — a true Computation family rhyme:
amber == an irreducible bound) · warm red = a residual + its square
(`--residual #e0664f`) · violet = the L1 line (`--l1 #b08fd3`) · green/red = the
self-test pill ONLY. No collision.

### Files
- `plumbline/index.html` (~745 lines, ~37 KB) — self-contained standalone Workbench
  bench (`<!-- a standalone Workbench bench (NOT a front-door page, NO ws:seen). -->`,
  no `ws:seen` drop — Workbench benches are exempt, matching convex-hull/entropy).
  Inlines the byte-twin core between the sentinels; the render spine calls the core.
- `plumbline/plumbline-core.mjs` (~330 lines) — the REAL core, the sole authority.
- `plumbline/plumbline-core.test.mjs` (~290 lines, **35 checks**) — the Node twin:
  the 5 shared in-page claims + a fourth independent slope oracle (raw uncentered
  covariance) + the deep sweeps + the guard + determinism + the re-extraction parity
  (all 13 inlined functions byte-identical, pill count == module count).

### Verification
- `node plumbline-core.test.mjs` → **35/35 ✓ ALL GREEN** (incl. re-extraction
  parity: 13/13 inlined fns char-for-char identical; in-page 5/5 == module 5/5).
- Browser-verified (`ws-plumbline-c9`, served :8753): pill **green** "line is the
  minimum ✓" (5/5), **clean console** (0 errors), gauge fill sits exactly ON the
  floor at rest, the two-route R² identity ✓ identical, Tidy collapses Σr²→0/R²→1,
  the outlier teeth lurch L2 while L1 holds, the GD ghost converges to Δslope 5.6e-16,
  residual squares render as TRUE squares (one scale s=68.7 px/unit drives both
  axes). **0 horizontal overflow** at 1280 and **390px** (docScrollW == winW), pill
  on-screen. The Workbench card (Computation group, 3rd card) added direct-edit:
  0 nested anchors, 0 spill desktop+mobile, the stretched-link pattern preserved.

### Placement note (recorded so the divergence isn't silently lost)
ROADMAP's least-squares seed sat under **Toys & benches**, but the director's
cycle-#9 skeleton placed it in **Computation** (alongside The Mill and The Shannon
Limit — the family rhyme: amber == an irreducible bound, shared with Shannon's H).
The ruling is **Computation**; the ROADMAP divergence is recorded here per the brief.
