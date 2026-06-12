# Soroban — spec

A genuine, operable Japanese **soroban** (abacus). The workshop's 3rd instrument,
after the slide rule (Slipstick) and the astrolabe. Single self-contained vanilla
HTML/CSS/JS file, 0 deps, 0 network, no audio.

## The soroban model

- **13 rods** (columns), leftmost = highest place. Represents 0 … 9,999,999,999,999.
- Each rod has **1 heaven bead** (value 5, above the reckoning bar) and **4 earth
  beads** (value 1 each, below the bar).
- A bead **counts** when pushed **toward the reckoning bar**.
- `digit(rod) = (heaven down ? 5 : 0) + (earth beads up)`, always **0–9**.
- A rod state is `{ heaven: 0|1, earth: 0..4 }`.
- Unit dots mark every 3rd rod (units, thousands, millions, …) — classic convention.

### Soroban physics (the "all beads between move together" rule)

Earth beads are indexed 0..3 from the bar outward (0 = nearest the bar). With
`earth` beads counted, indices `0..earth-1` are up and `earth..3` rest at the
bottom. Clicking earth bead `i`:

- if `i` is **not** counted (`i >= earth`): push it and every bead between it and
  the bar **up** → new `earth = i+1`.
- if `i` **is** counted (`i < earth`): push it and the beads further from the bar
  **down** → new `earth = i`.

Heaven bead toggles down (counts, +5) ↔ up (rest, 0). Both operations always
yield a digit in 0..9.

## The crux

A PURE arithmetic/representation **CORE** is the single source of truth for BOTH
the SVG renderer and the headless self-test (no parallel copy). Key functions:

- `valueFromBeads(state)` → integer (Σ digit·10^place)
- `beadsFromValue(n)` → the unique canonical soroban representation of n
- `digitOfRod(rod)` → 0..9
- `rodFromDigit(d)` → canonical single-rod state
- `clickEarthBead(rod, i)` / `clickHeavenBead(rod)` → real soroban physics
- `add(a,b)`, `sub(a,b)`, `mul(a,b)`, `applyOp(v,op,operand)`
- `fingerprint(state)` → skin-invariance signature (bead positions + digits)
- `EXAMPLES`, `solveExample(ex)` → worked examples by true arithmetic

The SVG renderer (no `<foreignObject>`, so PNG export stays untainted) reads bead
positions straight from the bead-state via `beadYs(rod)`. Skins are **cosmetic
only** — palette + a couple of material flags; they never move a bead or change a
digit. PNG export paints the soroban directly onto a 2D canvas (the safe pattern).

## Self-test (runSelfTest → green chip "abacus verified — N/N ✓", never red)

1. **Round-trip bijection** — `valueFromBeads(beadsFromValue(n)) === n` across a
   dense sweep (0..4000), all powers of ten ±1, MAX/MAX-1, and 3000 seeded
   randoms over the full range; plus **canonicality**: each rod's digit equals
   the matching base-10 digit of n and is in 0..9.
2. **Digit correctness** — `heaven*5 + earth` ∈ 0..9 for all 10 rod configs.
3. **Soroban physics** — from rest, clicking earth bead i gives digit i+1; a
   second click toggles back to i; heaven toggles ±5 reversibly.
3b. **Physics legality** — 4000 random legal clicks never produce an illegal
   digit or rod (earth 0..4, heaven 0/1, digit 0..9).
4. **Arithmetic** — add/sub/mul == JS integer arithmetic across 2000 seeded
   pairs; the result round-trips on the soroban; explicit cascade carries/borrows
   (9999+1=10000, 10000−1=9999, 999999999999+1=1000000000000).
5. **Worked examples** — every example's stated result == true arithmetic and is
   representable & round-trips on the soroban.
6. **Skin invariance** — `fingerprint(beadsFromValue(v))` identical across all 3
   skins; switching skin never changes value or digits.
7. **Determinism** — `beadsFromValue(n)` yields an identical state every call.

The CORE + runSelfTest are also extracted and run under **Node**; the browser
chip count must equal the Node count.
