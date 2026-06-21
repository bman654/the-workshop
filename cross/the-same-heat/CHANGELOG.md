# The Same Heat — CHANGELOG

A cross of **The Temperature Dial** (`clockwork/temperature.html`, softmax) × **The Brownian Ratchet**
(`engine-room/brownian/`, Arrhenius hop rates). One exponential, `e^(−E/T)`, under two knobs that never met.

## #227 — bloomed (the first build)

**The one idea.** A language model's softmax log-odds is `ln(p_the/p_on) = GAP/T`; a Brownian ratchet's
single-bath hop-bias log-odds is `ln(r_fwd/r_bwd) = (−2τ)/T`. Both are lines through the origin
(T→∞ ⇒ 50/50), so the only freedom is the slope. Tune the gas's load so `−2τ = GAP` and the two lines are
the SAME line, to machine precision, for every T — a mind's word-split IS a gas's hop-bias.

**The form (form expresses content).** A brass-and-glass instrument with TWO bevelled glass bays under one
face:
- LEFT (the mind) — two glass cylinders `the` / `on` filling with warm amber to `softmax(LOGITS,T)`; a
  ghost-tick on each at the T=1 trained level. Cold ⇒ `the` brims, `on` empties (greedy); hot ⇒ both ~half.
- RIGHT (the gas) — a toothed brass wheel whose idle-spin VELOCITY is `∝ (r_fwd − r_bwd)` of the CURRENT
  T/τ (history-free — a render of the current rate, never an accumulating odometer; preserves curie-dial's
  "position IS the only state" discipline). A pawl-arrow shows the hop-bias. Cold ⇒ creeps forward; hot ⇒
  net-zero jitter.

**The one bead (the load-bearing legibility win).** A SINGLE brass thermostat bead rides one capillary that
pierces the dividing mullion, so the same object is visibly inside BOTH bays at once — one continuous thermal
gradient (deep-blue cold → white-hot) straddling both worlds; you cannot drag the two heats apart. A rigid
brass plumb-column drops from the bead through the gold-ray panel, landing on `x = 1/T`. The bead reuses
curie-dial's bead-drag grammar (pointerdown + setPointerCapture + pointermove + pointerup, keyboard nudge +
focus ring, momentum-free / history-free) on a tight window `T∈[0.25,4]` so both endpoints reach in one throw.

**The gold ray + the merge.** A panel spanning both bays plots log-odds (y) vs `1/T` (x). Both machines drop a
live jewelled marker at the cursor's `x = 1/T`: a cool-blue MIND marker at `GAP/T`, an ember-red GAS marker at
`−2τ/T`. It OPENS MISMATCHED (`−2τ = 0.8 ≠ GAP`) so the gas rides a separate paler-bronze ray that fans apart.
A "snap to the gap" control rotates the bronze ray toward gold; at `−2τ = GAP = 1.3` they SNAP into one gold
ray with a radial bloom + a COINCIDENCE cartouche. Both rays pivot through the origin, so slope is the only
freedom — which is exactly why tuning to the gap is the whole game.

**The negative control (a brass knife-switch).** `exp(z/T) ⟷ not-Boltzmann`. Default Boltzmann ⇒ a straight
ray, green `Boltzmann ✓` pill. Flip to a non-Boltzmann linear mix `p_i ∝ (z_i/T + c)` and the mind marker's
trajectory BENDS off the straight ray (log-odds no longer linear in 1/T); the pill flips red
`not Boltzmann ✕ — the line bends`, and no τ can ever align a bent curve with a straight ray. The point: it is
the EXPONENTIAL `e^(−E/T)` (shared by softmax and Arrhenius), not the apparatus, that makes T the same dial.

**Single-source discipline.** `core.mjs` is the SOLE cross-law authority. It IMPORTS the two parents
byte-untouched as two independent oracles, NEVER forked:
- `import { softmax, LOGITS } from '../../clockwork/core.mjs'`
- `import { symmetricRates, E_B } from '../../engine-room/brownian/core.mjs'`

The imports sit ABOVE the `// === CORE BEGIN ===` sentinel (felt-gravity-curve convention); the whole CORE
region is inlined byte-identically into `index.html` (proven 8053 chars identical). The adapter re-types NO
exponential — `mindLogOdds` / `gasLogOdds` only take logs of the imported ratios.

**The proof (Node twin `core.test.mjs` + in-page pill, 43/43 green, exit 0).** Over T∈{0.25,0.5,0.75,1,1.5,2,3,4}:
1. MIND LINEARITY — `mindLogOdds(T) === GAP/T` < 1e-9 (worst 2.22e-16).
2. GAS LINEARITY — `gasLogOdds(T, tunedTau()) === (−2·tunedTau())/T` < 1e-9 (worst 2.22e-16).
3. COINCIDENCE — `|mindLogOdds − gasLogOdds(tuned)| < 1e-9` across the sweep (worst 1.67e-16).
4. MISMATCH IS REAL — with `−2τ ≠ GAP` the `|Δ|` is nonzero and GROWS with 1/T (the rays genuinely fan), so
   coincidence is the tuning, not a tautology.
5. NEG-CONTROL WITH TEETH — `nonBoltzmannLogOdds(T)·T` is NOT constant (spread 5.94e-2 ≥ 1e-2) while the true
   Boltzmann `·T` IS constant (= GAP); a vacuous "always linear" checker provably fails.
6. ANTI-CIRCULARITY — the log-odds path names no `Math.exp`/`Math.pow` (the exp lives only in the imports);
   the MIND adapter names no brownian symbol, the GAS adapter names no softmax symbol.
7. BYTE-TWIN PARITY — `index.html` CORE region === `core.mjs` CORE char-for-char (8053 chars).
8. PARITY with the shared `runSelfTest`.

**Discoverability.** A Workbench card (group: crosses) mirroring the-same-threshold grammar; reciprocal
sibling back-links edited into both parents (`clockwork/temperature.html`, `engine-room/brownian/index.html`);
the cross carries `↗`-grammar links back to both parents; the breadcrumb `ws:seen:cross-the-same-heat` drops on
load.
