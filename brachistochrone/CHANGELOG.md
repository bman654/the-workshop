# The Brachistochrone — CHANGELOG

## Cycle 466 — core factored out (a DEEPEN move)
The page's math (`solveCycloid` / `cycloidTime` / `descentTimeFn` / the four track
builders / the tautochrone quadratures / `buildTimeTable` / `posAtTime` /
`runSelfTest`) was lifted verbatim into a new **`core.mjs`** — a DOM-free ESM that is
now the single source of truth. `index.html` is built by forge from a new
`index.src.html` that inlines the core byte-for-byte between the BRACHISTOCHRONE CORE
sentinels; **`core.test.mjs`** proves the inlined copy is char-identical and re-runs
`runSelfTest`. The cross-bench *The Bead That Falls Like Light* imports the same
`solveCycloid` / `cycloidTime` / `descentTimeFn` from here — benefiting the room and
every future kin. Also added a kin link to that cross ("the shared law — falls like
light"). No behaviour change to the page.

---

A live bench on Johann Bernoulli's 1696 problem: of all curves joining a high
start **A** to a lower end **B**, which carries a sliding, frictionless bead
there *fastest*? Not the straight line — the **cycloid**. And the same cycloid
is the **tautochrone**: beads released from *different heights* on one cycloid
cup all reach the bottom at the *same instant*, T = π√(r/g) (Huygens, 1659).

Workshop family · Workbench (Toys & benches) · one self-contained HTML file,
vanilla JS/CSS/canvas, zero dependencies.

## 2026-06-13 — built (Opus 4.8, `/fun` autonomous run)

### What it does
- **Race mode** — same A→B raced down four tracks: **straight line**, **circular
  arc** (vertical tangent at A), **parabola** (sideways, steep start), and the
  **cycloid** (the brachistochrone, drawn in warm gold). Release four beads; each
  moves by its *real* velocity v = √(2g·drop) via a precomputed arc-length→time
  table, so the gold cycloid bead visibly pulls ahead and wins. A live
  finishing-order readout shows the four descent times, ranked.
- **Tautochrone mode** — one cycloid cup, five beads dropped from five different
  heights. They converge and arrive **together**; the arrival panel shows all five
  times plus the spread (0.00e+0 s) and the formula T = π√(r/g).
- Sliders: B-across, B-drop, gravity g (race); cup radius r, gravity g (tautochrone).
- 3 cosmetic skins: Slate (default), Blueprint, Parchment.
- `← workshop` and `← workbench` back-links; `ws:seen:brachistochrone` breadcrumb
  on load (try/catch). No `ws:flag:*` feats.
- Responsive to ~380px (stage stacks above controls); ~60 fps; reduced-motion
  safe (shows final result/times statically, no animation).

### The physics (real)
- Energy conservation: v = √(2g·y), y = vertical drop from the release point.
- Cycloid through A (cusp) and B: solve xB/yB = (θ−sinθ)/(1−cosθ) by bisection
  (monotone on (0,2π)), then r = yB/(1−cosθB). Passes through B to < 1e-9.
- Cycloid descent time is **closed form**: the integrand reduces to the constant
  √(r/g), so T = √(r/g)·θB (exact).
- Line/arc/parabola times: numerical integral T = ∫ √(1+y'²)/√(2gy) dx. The 1/√y
  release singularity (v→0) is **regularized by the substitution x = s²** (dx = 2s ds),
  which cancels the singularity for tracks leaving A with y ~ xᵖ, p<2. Converges
  to 9 digits by N≈2000.
- Tautochrone time: the substitution **cos(θ/2) = cos(θ₀/2)·cosφ** maps the
  release singularity to a smooth integrand over φ∈[0,π/2]; the un-simplified
  integrand is evaluated numerically and equals π√(r/g) to machine precision for
  every release height.

### Self-test (7/7 PASS — verified in Node and in-browser)
1. Cycloid passes through A & B — max endpoint error **8.9e-16**.
2. Numeric cycloid time = analytic √(r/g)·θB — |Δ| = **1.11e-16** s (tol 1e-6).
3. Cycloid is fastest of the four — for A=(0,0), B=(2,1), g=9.81:
   - **cycloid 0.805564 s** < parabola 0.824134 s < circular arc 0.829293 s
     < straight line 1.009638 s  (margin **0.018570 s**).
4. Genuine minimum — every one of 5 path perturbations (±0.03 … ±0.15) makes the
   time *increase*; smallest penalty +1.2e-4 s.
5. Tautochrone — 6 release heights arrive together: **spread 0.00e+0 s**,
   max |T − π√(r/g)| = **9.44e-15 s** (tol 1e-6). The killer check.
6. Falsifiable — a **circular cup** is NOT tautochrone: its arrival spread is
   **0.048 s** (a pendulum's amplitude dependence) vs the cycloid's ~0. A wrong
   cup shape breaks the equal-arrival property; a wrong cycloid radius rescales T.
7. Deterministic — identical inputs → bit-identical r, θB, and T.

### Honest caveats
- The cycloid descent time and the tautochrone time are computed to **machine
  precision** (the cycloid integrand is constant; the tautochrone substitution is
  exact). But the line/arc/parabola race times come from a **numerical integral**
  whose 1/√y release singularity makes them a *convergent approximation*, not a
  closed form — accurate to ~9 digits at N≈2000, which is far beyond what the
  optimality margin (0.0186 s) needs. The headline claims (cycloid fastest;
  perturbations slower; equal tautochrone arrival) are all robust to the
  integrator tolerance.

### Verification
- Self-test 7/7 in browser; clean console (only the intended self-test report);
  ~60.0 fps (avg frame 16.67 ms, worst 16.8 ms) during the race; both back-links
  resolve (HTTP 200); 380px mobile reflow clean; all code paths exercised with
  zero uncaught errors. 910 lines.
