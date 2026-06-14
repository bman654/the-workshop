# The Stirling Cycle — CHANGELOG

The Engine Room's **fourth bench**, completing the heat wing (Carnot · Demon · Brownian · Stirling).
Thesis: **the same ceiling, a different machine.** Carnot joins its two isotherms with curved adiabats;
Stirling joins them with two *isochores* (constant volume) plus a *regenerator*, and with an ideal
regenerator (effectiveness ε = 1) it reaches the very same wall, η = 1 − T_c/T_h.

## v1 — 2026-06-14 (cycle #11 of the fun-forever loop)

**The four falsifiable claims (re-run live in the pill + the Node twin):**

1. **W three ways.** The net work from the loop area (`∮P dV`, from-scratch composite Simpson on the
   two isotherms; the isochores do *literal* zero work — `dV = 0`) equals the heat ledger's
   `W_heat = Q_in − Q_out`, AND equals an independent closed-form oracle `W = nR(T_h − T_c)·ln r`,
   read off the actual corners. Three routes, one number (~5e-12 / Simpson-limited 2e-11).
2. **The ceiling.** With an ideal regenerator, `η(ε=1) == carnotEfficiency(T_h, T_c)` to ~1e-16 over a
   500/5000-triple sweep. `carnotEfficiency` is **IMPORTED** from `../carnot/core.mjs` — never redefined
   here. (See the single-source decision below.)
3. **The regenerator teeth.** η(ε) rises strictly monotonically from η(0) (strictly *below* Carnot) to
   η(1) == Carnot exactly; `ΔS_universe` falls from strictly-positive at ε=0 to exactly 0 at ε=1, monotone
   down; and an over-unity ε > 1 (or a negative ε) is **rejected** — clamped to [0,1]. No free lunch.
4. **Genuine isochores.** The two non-work legs have byte-exact constant volume (`V₂ = r·V₁`, `V₃ = V₂`,
   `V₄ = V₁` by `===`) and do literal zero work (`w23 === 0 && w41 === 0`). That byte-exact zero is what
   distinguishes Stirling from Carnot's *curved* adiabats.

Extras (free): `Qv_cool + Qv_warm === 0` exactly (the regenerator load is equal-and-opposite);
γ-independence of η_ideal across Cv ∈ {5/3, 7/5} (the load differs, η_ideal does not); clockwise ⇒ W > 0;
the gas's entropy round-trips to 0 over the cycle.

**Test counts:** in-page pill **9/9** (7 core checks + 2 DOM checks: the ε slider is present; the drawn
ceiling === `carnotEfficiency(T_h,T_c)`). Node twin `node engine-room/stirling/core.test.mjs` **17/17**
(the shared 7 + a 5000-triple ceiling sweep + a 1000-step ε-sweep × 4 base cycles + the over-unity/negative
clamp sweep + the W-three-ways sweep + the **byte-twin re-extraction parity** [6053-byte slice byte-identical]
+ the **single-source check** [the page's inline `carnotEfficiency()` body === the imported
`carnotEfficiency.toString()`, no secret `1 − T_c/T_h` redefinition] + the module-green parity).

### Decisions / honesty notes

- **Single source of truth (`carnotEfficiency` is imported, never redefined).** The whole proof of claim 2
  leans on the ceiling. To make that non-circular, `core.mjs` imports `carnotEfficiency` (and the gas
  primitives `pressure`/`temperature`/`R_GAS`, plus `carnotStates`/`carnotLegs`/`GAMMA_MONO` for the ghost
  trace) from `../carnot/core.mjs`. The Node test asserts the page's inline copy of `carnotEfficiency` is
  char-for-char the imported one — so the regenerator/efficiency proof provably doesn't sneak in its own
  `1 − T_c/T_h`. This is the Demon-bench pattern (heat ledger and bit ledger were one imported `entropy()`).
- **The regenerator is a modeling choice.** ε is an *idealized effectiveness*, not a physical counterflow
  heat-exchanger. The η(ε) **endpoints** (η(0), η(1)) and the **monotonicity** are forced by the math; the
  **intermediate** ΔS path is model-dependent — here linear in (1−ε): `Q_hot_in(ε) = Q12 + (1−ε)·Qv_warm`,
  `dS_universe(ε) = (1−ε)·Qv_warm·(1/T_c − 1/T_h)`. The page is honest about this in the framing copy.
- **η_ideal is γ-independent.** The regenerator's isochoric heats |Qv| cancel in `W_heat`, and at ε=1 the
  regenerator handles all of them internally, so the net heat from the reservoirs is exactly the isothermal
  heat. γ (via Cv) only sets the regenerator *load* |Qv| and η at ε=0 — never η_ideal. Asserted directly.

### Files

- `core.mjs` — the sole authority (<300 lines). Imports `carnotEfficiency` + gas primitives from
  `../carnot/core.mjs`. The physics-function slice between the `STIRLING CORE BEGIN/END` sentinels is the
  byte-twin inlined into the page. Exports `stirlingStates`/`workByArea`/`workAnalytic`/`heatLedger`/
  `regenerated`/`stirlingEfficiencyIdeal`/`entropyCorners`/`stirlingLegs`/`heatStirling`/`runCoreTests`.
- `index.html` — hand-authored plain HTML (plain `<script>`, not a module). The inlined byte-twin core
  slice between the sentinels (the import line replaced by inline gas-primitive declarations); the
  render/viz code lives *outside* the sentinels and consumes the slice. Two linked planes (boxy P–V loop ↔
  truthful T–S "rectangle-with-curved-sides"), the ε hero slider with an animate-to-Carnot sweep, the η
  tower against the imported Carnot ceiling, the ΔS_universe meter, the regenerator band in the T–S plane,
  a default-on ghost-Carnot dashed contrast in both planes. Drops `ws:seen:stirling`.
- `core.test.mjs` — the Node twin (the shared set + Node-only sweeps + the re-extraction parity + the
  single-source check).
