# The Fractionating Column — CHANGELOG

A hanging balance for the Alchemy Lab's eighth bench: a touchable glass distillation
column. Boil a **50/50** mix in the reboiler and drag the flame — the vapour climbs a
staircase of brass **bubble-cap plates**, each enriching it by the relative volatility
**α**, until a receiver fills with near-pure distillate. Set α by the two liquids'
boiling points; add plates and watch **α^N** compound. Too cold and it never boils up
(it never fills); too hot and it **floods** back toward 50/50. Make both boiling points
equal — **α = 1** — and the staircase collapses dead flat onto the diagonal: no flame,
no plate count, separates it (the negative control — it is the volatility *difference*,
not the heat, that purifies).

## The shape

- **`core.mjs`** — the SOLE separation authority. `stage(α,x)=αx/(1+(α−1)x)` (constant-α
  VLE, one plate); `walkStaircase(α,N,xBot)` (the TOTAL-REFLUX staircase — the single
  source of truth the render relaxes toward AND the self-test validates); `fenskeTop`
  (the closed form `xTop/(1−xTop)=α^(N+1)·xBot/(1−xBot)`); `alphaFromBP` (a LABELED
  model — Clausius–Clapeyron with a shared Trouton ΔHvap, honestly distinct from the
  exact identity); `plateComposition`, `receiverPurity`, `operability` (the pure
  cold/run/flood state machine with public thresholds `COLD_THRESH`/`FLOOD_THRESH`),
  `LIBRARY` (benzene/toluene, ethanol/water marked "× ideal", and the dead α=1 control),
  `SWEEP` + `cruxWorstError`, and `runSelfTest` — the ONE proof body the badge, the Node
  twin, and the landing's curated subset all call.
- **`core.test.mjs`** — the Node twin. Runs the shared `runSelfTest()` body, spells out
  the crux, the neg-control, and the α-model properties independently, and asserts
  **byte-identical re-extraction parity**: it slices the inline core out of `index.html`
  between the `COLUMN-CORE` sentinels, strips `export ` + the CommonJS guard (mirroring
  forge's `stripModuleGuard`), and demands it equal `core.mjs` byte-for-byte. Exits
  non-zero on any RED.
- **`index.src.html` / `index.html`** — the FORGE route: `index.src.html` carries the
  inline-core sentinels + a `<!-- forge:include core.mjs -->`; build with
  `node tools/forge/forge.mjs alchemy/fractionating-column/index.src.html`. The render
  is one SVG `#column` (viewBox 0 0 360 720) redrawn each rAF from a single state S: a
  flame-heated reboiler, a glass stack divided into N+2 cells by brass bubble-cap decks,
  per-plate two-colour bars (light reagent vs heavy ember) split at the live plate
  composition, rising vapour bubbles whose count/speed ∝ the flame, and a receiver flask
  that fills and clears to clean cyan by purity. The hero is a **drag of the flame**:
  drag-down→cold (never fills), mid→the staircase assembles, drag-up→flood (washes back
  to 50/50). The render re-derives NOTHING — it consumes the core's exported functions,
  emits a per-frame `col:state` event the copy layer reads, and the earned relief caption
  prints the receiver's OWN purity so it can never claim a separation the column did not
  make.

## The proof (what the self-test guarantees)

1. **The crux ★** — the stepped total-reflux walk `walkStaircase().xTop` equals Fenske's
   closed form to **< 1e-9** (worst abs error **3.33e-16**) over an (α, N, xBot) sweep,
   asserted in the composition domain, with saturated-to-pure cells skipped as an honest
   register limit (documented, not a failure).
2. **The negative control ★** — the dead library entry derives **α === 1 exactly**, and
   `walkStaircase(1,N,xBot).xTop === xBot` **bit-exact** for every N and several xBot
   (incl. 0.123456789): α = 1 ⇒ y = x ⇒ no separation.
3. The labeled α-model's **properties** (equal b.p. ⇒ α = 1 exact; lighter-boils-first ⇒
   α > 1; monotone in the gap; reciprocal-symmetric to 1e-12) — properties proven, not an
   exact value, because the model is honestly an approximation.
4. The monotone climb (real α > 1 ⇒ x strictly rises plate-to-plate), the receiver
   (0 < purity < 1, strictly purer with more plates), the operability state machine
   (exhaustive at the boundaries), and `plateComposition` closing (xLight + xHeavy === 1).
5. **Re-extraction parity** — the page's inline core is `core.mjs`, byte-for-byte.

The in-page pill mirrors the Node twin and adds two grounded-gate DOM checks (the rendered
plate bars read `plateComposition()`; the receiver reads `receiverPurity()`).

## History

- **Born** (cycle 388) — the 8th bench, deepening the Alchemy Lab (no new front-door
  footprint). Glass-and-flame sibling to Le Chatelier's Vise: it reuses the Vise's
  cylinder/striation/flame idioms verbatim and adds brass bubble-cap decks, a reboiler
  bulb, and a receiver flask. A load-bearing fix during fresh-eyes verification: a
  transparent hit-rect over the flame zone, because an SVG root only captures a pointer
  where it has painted content — without it the hero flame-drag fell through the gaps
  between the flame tongues. Verified in a real browser via a true input-level (CDP)
  drag: cold→steady→flood all confirmed, and the α=1 chip collapses the staircase to
  dead-flat under a running flame.
