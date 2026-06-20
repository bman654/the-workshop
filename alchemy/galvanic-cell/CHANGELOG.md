# The Galvanic Cell — CHANGELOG

A hanging balance for the Alchemy Lab's sixth bench: a brass analog voltmeter wired
across two electrode beakers, above a rack of eight metals ordered by activity. Drag
two metals in and the needle swings to **E°cell = E°(cathode) − E°(anode)** — the gap
between their standard potentials, nothing more. Swap the beakers and the sign flips
but the magnitude holds; put the same metal on both sides and the needle sits dead at
zero (the negative control — it is the *difference*, not either metal, that runs the cell).

## The shape

- **`core.mjs`** — the SOLE EMF authority (Facet C). CODATA constants `R`, `F`, `T_STD`;
  the `RACK` of eight metals (Mg…Au) with GIVEN standard reduction potentials vs SHE,
  ordered most-reactive→noble so a metal's index IS its activity rank. Exports
  `E0`, `nOf`, `eCell`, `cellOriented` (the ONE signed number the render consumes:
  `E°(right) − E°(left)`, locked so Daniell left=Zn/right=Cu reads spontaneous-positive),
  `assign` (cathode/anode/spontaneous/dead), `cellN` (lcm of the half-reaction electron
  counts), `halfReactions`, `nernst` (exact, no 0.0592 shortcut), `dialQ`, `ladderOrder`
  (rebuilds the activity series from pairwise SIGNS alone, via transitive closure),
  `volt2deg`, `flowDir`, and `runSelfTest` — the ONE proof body the badge, the Node twin,
  and the landing's curated subset all call.
- **`core.test.mjs`** — the Node twin. Runs the shared `runSelfTest()` body, spells out
  the headline facts independently (Daniell 1.1037 V; widest cell Au|Mg = 3.87 V; the
  half-equations; the Nernst dial; the same-metal neg-control per metal), and asserts
  **byte-identical re-extraction parity**: it slices the inline core out of `index.html`
  between the sentinels, strips the module guard + leading `export` exactly as forge does,
  and compares to `core.mjs`. `node alchemy/galvanic-cell/core.test.mjs` exits 0 — 37/37 GREEN.
- **`index.src.html`** → forged to **`index.html`** via
  `node tools/forge/forge.mjs alchemy/galvanic-cell/index.src.html`. The page is the render
  layer (Facet A + B): one all-SVG instrument (voltmeter / cell / rack), the pick-place-clear
  state machine (Pointer Events + roving-tabindex keyboard, aria-live), the eased needle
  spring (ζ≈0.82, reduced-motion snaps), the electron crawl + salt-bridge counter-stream,
  the Nernst dial, and the activity-ladder play loop. It computes NO chemistry — every number
  comes from the inlined core, so a core bug shows as a visibly wrong needle, never a render fudge.

## The proof rows (each a falsifier with teeth)

1. additivity: `eCell(c,a) === E°(c)−E°(a)` exact over all 64 ordered pairs.
2. sign-flip / identical magnitude over every distinct pair.
3. Daniell anchor: Cu|Zn = 1.1037 V → "1.10"; `assign(Zn,Cu)` → Cu cathode, spontaneous;
   the locked sign convention (Daniell placement is spontaneous-positive).
4. Nernst → E°cell exactly at Q=1 (ln 1 = 0); the real −(RT/F)·ln10 ≈ −0.059159 V per decade.
5. same-metal negative control: `eCell(m,m) === 0` exact, `assign.dead`, for every metal.
6. perturbation teeth: a +0.001 V fudge of every pair FAILS the additivity `===`.
7. `cellN`: lcm of the half-reaction electron counts (Daniell 2, Cu|Al 6).
8. ladder: a spanning path of pairwise signs rebuilds the rack's E° order exactly.
   Plus DOM rows on the page: digital readout === core to 2 dp; swap flips sign keeps |E|;
   flowDir reverses; same metal ⇒ needle target 0 + dead cartouche; the dial tilts the reading.

## Registered

- The Alchemy Lab landing (`../index.html`) carries the 6th bench card, the bumped
  bench-count copy (lede + footer), the landing pill count, and a `galvanicProof()`
  re-running the curated rows so the pill reads "6 benches · M/M ✓".
- Reciprocal `.sib-link` cards: this page → the Aufbau Staircase; the Aufbau Staircase →
  this page ("two ladders of the same metals — activity (E°) rank vs Aufbau rank").
