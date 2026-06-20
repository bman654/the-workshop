# Recamán's Footsteps — changelog

The Numbers Room's 14th bench. OEIS A005132 drawn as a self-building walk of
interlocking semicircles along the number line.

## The rule (one greedy decision)

Start at 0. At step `n`, try to step **back by n**; take it only if the landing
is non-negative **and** never visited before. Otherwise step **forward by n**.
That single rule is `nextTerm()` — the one shared decision the whole page reads.

## What is — and is NOT — proven (the honest spine)

The folk-claim "Recamán never repeats a value" is **false**. Verified live to
100,000 steps: **25,748 values recur**, the first at step 24 (`a(24)=42 ==
a(20)=42` — and the OEIS prefix shows it: …43,62,42,63,41,18,**42**,17…). The
green pill therefore claims only the three properties that ARE integer-exact:

1. **Magnitude law** — every `|a(n) − a(n−1)| === n` exactly (0 violations @100k).
2. **Non-negativity** — every `a(n) ≥ 0` (0 negatives @100k).
3. **The back-step gate** (the special property) — every *retreat* lands on
   **fresh ground**: `firstBackOntoVisited === null` (0 bad backs @100k). A
   *forward* jump may overshoot onto an old value; a *backward* jump never does.

Plus OEIS ground truth (`generate(27).values === A005132` first 28 terms) and
two negative controls with teeth:

- **`always`** (drop only the unvisited gate) → a back step lands on visited
  `a(0)=0` at step 3, so invariant #3 fails **by design**.
- **`twon`** (±2n step) → every magnitude is `2n`, so invariant #1 fails **by
  design**. The lever throws between these and the chip flips red, naming the
  offender — because the *engine* produces the violation.

## Architecture

- **`core.mjs`** — the SOLE engine. `VARIANTS` table (single source of the rule
  keys), `nextTerm()` (the one decision), `generate()` (the single source of
  truth for canvas + readout + pill), `arcGeom()` (pixel-blind geometry oracle:
  radius = ½|Δ|, centre = midpoint, above by parity, `back` = retreat),
  `runSelfTest()` (8 checks).
- **`core.test.mjs`** — the Node twin: the shared self-test at the Node budget,
  deeper scale to 100k with anchored stats (25,748 forward revisits; 74,253
  distinct), neg-controls with teeth, the arcGeom oracle, determinism, and
  **re-extraction parity** — it slices the inlined core out of `index.html`,
  char-compares `nextTerm`/`generate` against the imports, evals the slice and
  runs ITS self-test ok-for-ok. `node recaman/core.test.mjs` exits 0 iff green.
- **`index.html`** — self-contained. The core is inlined **byte-identical**
  between `// ===== RECAMAN CORE … BEGIN/END =====` sentinels. A self-drawing
  canvas (cached static arcs blitted under a breathing isotropic camera; the
  in-progress arc sweeps with a gold pen-tip glow; back-jumps flash coral then
  settle dim), a transport (run/step/scrub/speed/home/end), a steps slider, and
  the **rule lever** rendered from `core.VARIANTS`. The invariant pill is built
  from the engine's verdict, never the page's own claim.

## Provenance

- 2026 — shipped as the Numbers Room's 14th bench (cycle 205). Follows the
  COLLATZ pattern: SOLE core + inlined byte-twin between sentinels + re-extraction
  parity test; an open/structural piece (like Collatz), not a closed-form
  theorem — so it does NOT increment the room's "proven exactly" count.
