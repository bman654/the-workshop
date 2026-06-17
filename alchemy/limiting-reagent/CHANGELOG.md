# The Limiting Reagent — CHANGELOG

A bench in the Alchemy Lab. The wing already had **conservation of matter** (the
Reaction Balancer) and **the equivalence point** (Titration). This bench answers
the next question every stoichiometry student asks: *which reactant runs out first,
and how much product do you actually get?* The answer is a **three-pan brass
balance** you operate — not a plotted curve.

## v1 (cycle #87 · BUILD/garden · the planter) — the third hanging balance

**The native metaphor (form expresses content).** A reaction stops the instant the
**first pan runs dry**. So the bench *is* a balance whose two reactant pans drain as
the reaction runs; the one that empties first is the **limiting reagent**, the
reaction halts there, and the rest sits in **excess**. The product cup hangs from the
post (it fills, it doesn't weigh) and reads the exact yield. "Stops the instant one
pan empties" and "reaches full extent" are the **same frame** — because the extent
**ξ = min(nᵢ/cᵢ)** is exactly the moment the scarcest pan empties.

**Operate it.** Under each reactant pan a brass **moles dial** — a keyboard-operable
`<input type=range>` + ▲▼ buttons, never drag-only. The dial is an **integer of
tenths**: `n_i = R(dial, 10)`, so **no float ever reaches the verdict**. That is what
makes the perfect-ratio tie *exact*. Big controls: **START** (eases the drain
0→1 over ~1100 ms, cubic-out, gated behind `prefers-reduced-motion`), **RESET**, and
a mode toggle.

**Two modes.**
- **watch it run dry** (run mode) — START drains the pans; on halt the limiter pan
  gets an ember flash + a −8° wax-seal stamp **"RAN DRY · LIMITING"** (its chip reads
  `0 mol`), each survivor stamps **"EXCESS · +{exact fraction} mol"** in gold, and the
  product cup reads **"YIELD · {exact cₚ·ξ} mol {formula}"** per product. A one-line
  ledger under the beam: *ξ = {xi} · limiter = {reagent} · atoms conserved start→end ✓*.
- **pour the perfect ratio** (game mode, explorer #1) — every dial nudge instantly
  re-runs `react()` and repaints (no START); the player feels the beam chase level.
  Score = `round(1000·(1−spread)⁴)` (pow-4 so only the exact tie hits 1000); the score
  drives **only** the cosmetic glow. **The WIN/1000-stamp fires off the exact-rational
  `plan.tie`** (limiters.length === reactants.length), **never** off `score===1000` —
  an honest trophy. Per-reaction best persists in `localStorage`
  (`ws:alchemy:limiting:best:<id>`).

**The reaction RACK** is the 9 two-reactant non-negative entries of the shared LIBRARY
(water, methane, ammonia, rust, glucose, thermite, slaked, gypsum, phosphate). Every
one's coefficient ratio is **reachable on the tenths grid** (small-integer coeffs tie
at integer/tenths moles), so the perfect-pour win is always winnable. `loadReaction`
resets the dials to an off-tie default (one reagent at its coefficient, the other off
by a notch) so START shows a clean limiter and the player can nudge to the tie.

**The math — `core.mjs`, the SOLE authority.** It is **self-contained, no import** —
exactly like its two sibling cores — copying the Balancer's exact BigInt-rational
primitives verbatim (`gcdBig`, `ilcm`, `R`, `rAdd/Sub/Mul/Div`, `rIsZero`,
`parseFormula`, `buildMatrix`, `solve`, `verify`, `tally`) and adding the exact
**extent layer**:
- `rCmp` / `rMin` — exact rational order (denominators are > 0, so the sign of the
  cross-difference *is* the true order; no float, no epsilon).
- `extent(coefReact, coefProd, moles)` → `{ xi, ratio, limiters, limiterIndex,
  leftover, yield, tie }`. ξ = fold-`rMin` over `nᵢ/cᵢ`; limiters = every i with
  `rCmp(ratioᵢ, ξ)===0`; `leftoverᵢ = nᵢ − cᵢ·ξ`; `yieldₚ = dₚ·ξ`; `tie` when every
  pan empties together. **Throws** on malformed input (root-cause robustness).
- `react(reactants, products, moles)` — the ONE call the renderer + game make: it
  `solve()`s, **splits the coefficient vector itself** (callers never hand-split), and
  folds in the extent; returns `{ok:false, reason}` for an unbalanceable input,
  **never a fabricated extent**.
- `conservedAtFinalState(...)` — the **headline final-state proof**: the rational
  element tally of {leftovers + yields} equals the tally of the initial moles,
  element by element by `rCmp===0`.
- `toNum` — **DISPLAY ONLY**, documented as forbidden in any verdict.

**The proof can't drift.** `index.html` inlines `core.mjs` **byte-identical** between
`// ===== LIMITING-CORE … =====` / `// ===== END LIMITING-CORE =====` sentinels
(distinct from the Balancer/Titration sentinels so the three pages' parity checks
never cross-match). `node alchemy/limiting-reagent/core.test.mjs` is **green at
105/105**: limiter = argmin & ξ = min recomputed independently; leftovers ≥ 0 and = 0
at the limiter; yield = cₚ·ξ; the **float trap** (ξ = 1/3, ξ = 1/7 — no finite
float — asserted as exact `{n,d}`); a 3-reagent case (tarnish) and a coef>1 limiter
(rust); **the neg-control TIE** (exact stoichiometry → every pan dry, dead-level
beam — a clean WIN, not a throw); **atoms conserved at the final state** with
perturbation teeth (yields×2 breaks it; ξ+1 drives a leftover negative) anchored to
`verify(A·c=0)`; argument-validation throws; the negative control returns
`{ok:false}`; **and the re-extraction parity check**.

**The in-page pill** (`self-test 17/17 ✓`) runs checks 1–11 against the inlined core
PLUS the **grounded-gate DOM checks** (the picture reads the core): the rendered
RAN-DRY stamp matches `react().limiters` for the live pans, and the product-cup
readout is the exact yield fraction (no `toNum`). Sets `window.__limitingSelfTest`.

**The dim side rail** (secondary): a faint yield-vs-extent line with a bead at the
current ξ + nᵢ/cᵢ ratio bars showing which ratio is smallest — captioned *"the curve
is only the shadow — the draining pans are the thing."* The hero is unmistakably the
balance (clears the grounded gate by enactment, not caption).

---

### Seedbed provenance

This bench bloomed from the **planter** `Stoichiometry & the Limiting Reagent` on the
Alchemy Lab landing (one of the wing's original named cradles). Built fresh, modelling
structure on the two siblings — titration for the single-state RM-safe model + selftest
pill, the balancer for the pan/molecule render grammar. The planter was promoted to a
lit/level linked bench in the same cycle.
