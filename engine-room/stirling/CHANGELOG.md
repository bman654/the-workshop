# The Stirling Cycle — CHANGELOG

The Engine Room's **fourth bench**, completing the heat wing (Carnot · Demon · Brownian · Stirling).
Thesis: **the same ceiling, a different machine.** Carnot joins its two isotherms with curved adiabats;
Stirling joins them with two *isochores* (constant volume) plus a *regenerator*, and with an ideal
regenerator (effectiveness ε = 1) it reaches the very same wall, η = 1 − T_c/T_h.

## v2 — 2026-06-15 (cycle #45 — RE-SOULED in place: the bench now LEADS with the machine)

The estate-wide soul audit flagged this bench as graph-first: two P–V/T–S curves as the hero, the engine
itself nowhere to be seen. **The re-soul shows the THING.** The bench now leads with a live, animated
**brass-and-glass Stirling cross-section** running the four-stroke cycle; the two curves are **demoted** to
a side-gauge ("the loop is the engine's shadow") with a colored **bead** walking them phase-locked to the
strokes. **Same route, same `ws:seen:stirling` breadcrumb, no map change.**

**What you now watch (canvas `#engine`, drawn each frame from θ + the ledger):** a domed firebox hot cap
(T_h); a riveted brass bore with a glass-cutaway sheen; a translucent **gas body** whose height tracks the
current volume and whose color lerps condenser↔firebox with the gas temperature (drifting particle dots
sell "gas"); a loose **displacer** slug with side-clearance gaps (visually distinct from the sealed
**power piston** disc+rod); a fixed **regenerator mesh** band whose bloom = ε × storedFraction (charges on
the cooling isochore, drains on the warming isochore) with a faint **red leak shimmer** at the cold fins
of opacity ∝ (1−ε); a spinning **crank + flywheel** whose two con-rods make the standard **90° displacer/
piston phase** literal (not asserted); a θ-dial and a **stroke nameplate** naming the live leg.

**The bridge (no new physics).** All thermo verdicts still come ONLY from the preserved STIRLING-CORE via
`compute()→m` — the animation **reads, never computes**. The stroke = `legOf(θ)` (an ordered 0→1→2→3
quadrant partition); gas T/V at θ come from the SAME `sampleLeg`/`traceLoop` the loops use, sampled by a
shared `beadAt(traced, θ)` so the bead and the verdicts share **one parameterization and cannot drift**.
The four strokes are color-keyed to the four legs with one shared palette (hot-expand `--firebox` ·
cool-isochore `--regen` teal [mesh charging] · cold-compress `--condenser` · warm-isochore `--regen` teal
[mesh discharging]); the current-leg color tints the active engine element AND the active loop bead at the
same instant — "this corner of the curve IS this stroke," taught by color, no prose.

**The kinematics are PRESENTATION-ONLY** (commented as carrying no physics claim): `kin(θ)` places the
metal on the smooth real linkage (`yPiston = ½(1−cos θ)`, `yDisplacer = ½(1−cos(θ+π/2))`), while gas T/V,
mesh charge, and the bead **snap to the idealized core legs by quadrant** — the nameplate + the bead
snapping cleanly to each leg corner mark it as a clearly-labeled idealization.

**Interaction.** The ε slider stays the hero knob (unchanged wiring) — drag it and the mesh dims, the cold
fins leak red, and the tower/Sankey/ΔS/η all sink, in lockstep. A run/pause + speed control (crank idles
~0.4 Hz); **pause → drag the flywheel to scrub θ** by hand (the touchable hook); a "step ¼-cycle" button
parks θ at a clean leg corner; the ε-sweep button stays. **One RAF:** the θ-advancing crank loop is folded
into the existing `pulseLoop`/`requestRender` model and coordinates with the ε-sweep guard — no two RAFs
fighting. **Reduced-motion:** no auto-spin — one correct static frame at θ=π/4 (mid hot-expansion) with
mesh + bead placed; the ε slider still updates the static picture AND the verdicts; scrub remains available.

**Preservation contract held.** The STIRLING-CORE slice between the `// === BEGIN/END ===` sentinels is
**untouched** — `node engine-room/stirling/core.test.mjs` → **17/17 GREEN, exit 0**, the `[parity]★` row
still reads **6053 bytes byte-identical**. The kinematics live OUTSIDE the sentinels and cannot enter the
core slice. The in-page pill went **9/9 → 11/11** with two new **SYNCHRONY** pins (labeled `(D…)`, never
masquerading as ★ physics): **(D3)** `legOf(θ)` partitions [0,2π) into the four core legs in order;
**(D4)** the mesh-bloom ceiling `=== state.eps` (the picture reads the SAME ε the ΔS-meter reads).

**Fresh-eyes verified** (served on `:8753`, agent-browser session `stirling45`, torn down by exact PID):
0 console errors, 0 nested anchors, 0 horizontal overflow @1280 AND @390, breadcrumb present, the engine
animates (θ 2.18→5.70 over ~0.9s), the bead leg matches the engine leg at every quadrant, ε=0.4 drives
η 50%→35.5% (below the ceiling) and ΔS 0→3.74 J/K, the ε-sweep coordinates with the crank without fighting,
step parks θ exactly at π/2, the reduced-motion static frame is verified by its code path.

The prose (`.tag` / `.foot`) was rewritten to describe the machine you now watch (gas shoved through the
glowing sponge, the mesh banking/returning heat, the crank's no-claim 90° phase); the "P–V plane · the
work / T–S plane · the why" headline framing is gone, replaced by the quiet "the engine's shadow" caption.
The Carnot bridge card is unchanged. File: `index.html` 969 → ~1452 lines (the engine renderer is the bulk;
acceptable for this single integrated bench, per the design's file-size note).

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
