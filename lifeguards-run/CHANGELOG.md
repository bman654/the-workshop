# The Lifeguard's Run — changelog

A Hall of Mirrors bench. *Why light bends — the least-time path you find with your own hand.*
A beam leaves the **fast upper medium** (warm sand, speed v₁) and must reach a target in the
**slow lower medium** (cool water, speed v₂), free to cross the bright shore at any point. Drag
the brass grommet along the shore (or tap anywhere on the bright line) and race a brass stopwatch
toward the quickest route; the floor you settle into **is Snell's law**, sinθ₁/sinθ₂ = v₁/v₂,
crystallizing out of your own search. Two obvious guesses — *straight through* and *hug the edge*
— both visibly lose: neither extreme wins, the bent path does.

## Built (cycle #185, BUILD/garden — the planter)

- **`core.mjs`** — the SOLE math authority (zero-dep ESM, no DOM). Param shape
  `p = { src:[sx,sy], tgt:[tx,ty], boundaryY, v1, v2, maximize? }`.
  - `travelTime(x,p) = d1/v1 + d2/v2` (the stopwatch number).
  - `dtdx(x,p) = (x−sx)/(v1·d1) − (tx−x)/(v2·d2)` — the KEY IDENTITY: this **is**
    sinθ₁/v₁ − sinθ₂/v₂, so `dt/dx = 0 ⟺ Snell`. `snellResidual` is the SAME expression under a
    second name (asserted identical), so the minimization gauge and the physics readout are
    provably one number.
  - `d2tdx2(x,p)` — a sum of two strictly-positive terms ⇒ t is strictly convex ⇒ the stationary
    point is a unique **minimum**, never a saddle (this is what makes t″(x*)>0 provable).
  - `angles(x,p)`, `minimizeTime(p)→{x,tMin,edge}`, `minimizeBrute(p)` (a.k.a. `crossCheckRoot`,
    the bisection-ROOT precision authority), `scanTime(p,N)` (rail picture only), `witness()`,
    `runSelfTest()→{ok,passed,total,checks}` (7 legs).
  - The math lives between `// ===== LIFEGUARDS-RUN CORE … =====` sentinels; the `export {…}`
    line is OUTSIDE them so the byte-twin slice is identical to the page's.
- **`core.test.mjs`** — the Node twin, three layers: (a) runs the page's `runSelfTest()` (all
  green); (b) INDEPENDENT re-derivations at fresh params the page never uses (Newton vs bisection
  root, finite-difference checks of dt/dx and d²t/dx², Snell ratio, v₁=v₂ straight collapse on a
  non-symmetric chord, the maximize foil, domain guards, scanTime as a loose picture); (c)
  BYTE-PARITY: the slice between the sentinels in `core.mjs` and `index.html`,
  indentation-normalized, asserted IDENTICAL. **17/17 green.**
- **`index.html`** — the bench (Hall gilt-on-near-black chrome lifted from sibling benches). One
  `<canvas>`: two media as colour you read before any number (sand stipple / cool water with slow
  caustic ripples whose depth/wavelength scale with v₂ — slowness you SEE), a kinked beam coloured
  by speed with an additive glow, **drawn angle wedges** geometrically true to the beam (the wider
  sand-side arc makes the bend self-evident), a brass-grommet handle riding the shore (**the whole
  shoreline is the slider**), a detent that aids but never auto-solves, a **racing brass
  stopwatch** (needle → 12 o'clock at the floor), the quiet t-vs-X rail (the bowl IS the
  principle), two ghost rays (straight + edge-hug) with their larger times, and the **EARNED Snell
  readout** that fades from a blurred `?` to a latched gold `sinθ₁/sinθ₂ = v₁/v₂ ✓` as the hand
  nears x*. Two neg-controls in the same gesture: **v₁=v₂** (media equalize, beam goes dead
  straight, θ₁=θ₂) and **go slow on purpose** (maximize → the absurd edge-crawl, "stationary isn't
  enough — light takes the LEAST time"). Keyboard slider (←/→ nudge, ⇧ coarse, Home/End), aria
  slider role + live valuetext, ≥44px touch target, `prefers-reduced-motion` honoured, audio tick
  muted by default with a 🔇/🔊 toggle. `window.__lifeguardsRun` exposed for verification.
  **NOT a Feat** — the Hall's Feats ribbon stays 0/10, decoupled from card count.

## Notes for a future maker

- **Robustness fix (root-cause):** `minimizeTime` is a **safeguarded Newton** (Newton-bisection
  hybrid), NOT bare Newton. travelTime is asymptotically linear at ±∞ (curvature → 0), so bare
  Newton flings x to infinity on some asymmetric, large-v₁/v₂ geometries. The bracket
  `[loX,hiX]` (where convexity guarantees `dtdx(lo) < 0 < dtdx(hi)`) forbids that: a Newton step
  is taken only when it stays inside the shrinking bracket, else the step bisects. Quadratic speed
  in the normal case, never divergent. **Do not "simplify" it back to bare Newton.**
- **Degenerate geometry is honest:** when a leg has zero length (target/source ON the shore), the
  slope/curvature formulas are genuinely 0/0 — θ₂ has no meaning. The self-test asserts the
  numbers the PAGE paints (x*, t(x*)) stay finite there, and that slope/curvature are finite a
  hair OFF the degenerate point. Don't force a defined value onto an undefined geometry.
- **Precision authority is the bisection ROOT, not a value scan.** A literal value scan provably
  stalls near √(machine-eps) (~1e-7) on a quadratic minimum; the root finds x* to ~1e-16 (Newton
  vs bisection measured 4.44e-16). `scanTime` is for the rail picture only — tested loosely.
- Witness: `{src:[-4,3], tgt:[5,-4], boundaryY:0, v1:2, v2:1}` → x*≈2.93406, t″≈0.186, residual
  ~5e-17, Snell ratio exactly 2.000.
