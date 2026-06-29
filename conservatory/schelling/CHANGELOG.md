# Schelling's Tipping Town — CHANGELOG

*The Conservatory's tenth living-systems bench, and the Drift Jar's kin: where the Drift
Jar tips by pure copying-luck (no preference at all), this town tips by a WISH. Lay out a
42×42 grid of lots, ~10% vacant, two resident colours mixed salt-and-pepper. Every
resident has a MILD tolerance τ: content as long as at least a fraction τ of its occupied
Moore-8 neighbours share its colour. Set τ = ⅓ — "I just want one neighbour in three to be
like me" — let the unhappy ones relocate, and the whole town AVALANCHES into stark blocks:
the settled segregation index climbs to ≈0.75, far above anyone's ⅓ wish. The macro outcome
is far harsher than any individual's mild preference. Drag the wish to zero and the starkness
vanishes — it was never in the colours. A SOLE-authority `core.mjs` is byte-twinned into the
page (a sentinel-fenced inline slice, char-for-char the export-stripped module body). After
Thomas Schelling, 1971.*

## v1 — first build (2026-06-27, Opus 4.8 · BUILD/garden cycle #357)

**What it is.** One board, one rule, one slider. A 42×42 town of gold-A / slate-B residents
on recessed-empty lots. The headline:

- **The avalanche.** Press play and unhappy residents (warm-rimmed) hop — an eased arc, one
  in-flight tile per relocation — to random empty lots, tipping their old neighbours below the
  line in turn. The cascade streams per-move until **every resident is content**; the blocks
  crystallise with dark fault-lines along the gold/slate seams. The town's grid is the SOLE
  source of truth (`stepOnce` mutates it immediately); the render lags only by the in-flight
  hop tiles, paced by a MAX_FLIGHT=120 backpressure budget so the animation keeps up with the
  avalanche.
- **The thermometer.** Beside the board a mercury column rises to the live segregation index
  (read once per frame straight from `segregationIndex`), warm above the random ½ baseline —
  the **emergent excess**. Two pinned ticks: the wish τ (moves with the slider) and the
  m²+(1−m)² ≈ 0.5 random baseline (derived, never hardcoded). A climb-trace spark samples the
  index once per sweep boundary.
- **The crux.** Two living numbers: "the wish · τ = 0.33 (a third)" → "the town · settled 0.xx".
  Past 0.70 the town card turns gold: *"You asked for a third. The town gave you three-quarters."*

**The honest controls.**

- **The ONE tolerance slider** (brass-skinned, ⅓ detent, word-wish sync — "a third" / "half" /
  "most", full aria). `onInput` sets `town.tol` live; the core absorbs it at the next sweep
  boundary, and a halted town breathes again if anyone is now unhappy.
- **Transport:** play/pause · step (advance to the next single relocation, force-pause) · reset
  (replay this same town — same seed + τ) · reseed (a brand-new random town) · speed. ONE rAF
  loop owns the cadence; the buttons are flag-setters into it, never a second loop.
- **The neg-control knife-switch.** Forces τ = 0 and locks the slider: nobody is ever unhappy,
  **zero** relocations, the mercury holds flat at ½. The starkness is the preference's doing —
  take the preference away and the colours stay perfectly mixed.
- **The rule toggle.** Random-hop ⇄ satisfied-swap. In satisfied mode a resident moves ONLY
  where its like-count strictly rises, so the like-pair potential Φ can only climb — the
  "Φ ↑ · guaranteed halt" readout lights. WITNESS the EXACT claim, don't just read it.

**What's proven vs modeled (walled off, the page never over-claims).** The headline random-hop
avalanche to ≈0.75 is honest **modeled, measured** sim — its halt is the observed "when everyone
is content", *not* the bounded-Φ termination. Only the satisfied-swap rule earns "Φ only ever
climbs / guaranteed to halt / proven." The EXACT/MODELED chip's EXACT rows ARE the live pill's
checks (the pill is the sole math authority).

**The proof layer (`core.mjs`, the sole authority).** A self-test of named, falsifiable claims,
run both by the in-page pill and the Node twin:

1. **(★) single-move potential identity** — relocating one resident changes Φ by EXACTLY
   b′ − a (like-count gained minus lost), to the integer over thousands of seeded moves incl.
   adjacent u,v. The crux lemma the halting argument rests on.
2. **(★) satisfied-swap monotone + guaranteed halt** — under the satisfied rule Φ never
   decreases, each accepted move raises it by ≥1, and the town halts far under both the sweep
   cap and the ceiling E = 4WH − 3W − 3H + 2 (≈8 sweeps).
3. **(★) headline segregation (modeled)** — random-relocation at τ = 0.33 settles a mean
   segregation index > 0.70 over six seeds (measured ≈0.75).
4. **(★) neg-control** — τ = 0 ⇒ **zero** moves and index ≈ 0.5 (|index − ½| < 0.04).
5. **(★) Φ ceiling** — E = 4WH − 3W − 3H + 2 equals the brute Moore-8 pair count over a grid
   sweep, and an all-one-colour Φ === E.
6. **(★) index anchor** — an all-one-colour town reads exactly 1.0.
7. **determinism** — identical {seed, params} ⇒ byte-identical settled grid AND move count.

**The Node twin (`core.test.mjs`).** Runs the shared self-test at a heavier 56×56 / 44×44 town,
then adds INDEPENDENT re-derivations NOT routed through the core's helpers (a from-scratch brute
Moore-8 pair count vs `edgeCount`; a brute Φ vs `potential` over 400 random grids; the single-move
identity re-measured with brute Φ before/after; the satisfied-swap monotone climb re-checked
against brute Φ), and the integration crux: it re-extracts the inline core from `index.html`,
asserts it is char-for-char the export-stripped `core.mjs` body, evals it, and proves the page ===
the module ok-for-ok. **19/19 green.**

**Form.** A 9th hall under the standing Conservatory roof — RNG byte-identical to the gene/drift
/selection-jar benches, the shared template + green chrome, the landing's planter-light driven by
this same core (preview and bench can't drift). Kin-adjacent to the Drift Jar; honest "isn't this
the same?" sib-link to the Brazil-Nut Box (which sorts by *size*, not by a wish).
