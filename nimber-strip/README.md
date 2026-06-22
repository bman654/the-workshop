# The Nimber Strip

*The Numbers Room's 24th bench — a subtraction game that is secretly Nim.*

A strip of lit tiles. On your turn take **1, 2, or 3** stones off the live end; take the **last
stone** to win. It looks like a fresh little game — but a hidden number rides every tile (a
**nimber**, its Grundy value), and those numbers cycle **0, 1, 2, 3** all the way down the strip: a
four-step staircase nobody drew. Pull the **split lever** and the strip cleaves into heaps, and the
whole of Nim wakes up — you are **lost** exactly when the heaps' nimbers **XOR to zero**, and the
perfect move is the one that zeroes the place-lamps.

## The point

Two surprises, neither of them re-teaching classic heap-Nim (its twin, **The Stone Heaps**, does
that — this bench links to it rather than duplicating it):

1. **The emergent staircase.** The famous closed form is `g(n) = n mod 4`. This bench *never writes
   that*. It runs the pure Sprague–Grundy rule `grundy(k) = mex{ grundy(k−1), grundy(k−2),
   grundy(k−3) }` and lets the staircase fall out. The beads switch on the *returned* grundy value,
   so a broken rule breaks the pixels loudly. The self-test only ever **compares** the live mex
   against `n mod 4` as an independent oracle.
2. **The unification reveal.** Split the strip and the disjunctive-sum machinery lights up: each
   heap's nimber in binary place-lamps (4s·2s·1s), and a combined XOR row that goes dark exactly
   when you are lost. The flint AI's perfect move is the one that darkens every lamp.

## Files

- `core.mjs` — the certified logic core (zero-dep, DOM-free ESM). `mex`, `grundy`, `legalMoves`,
  `apply`, `isTerminal`, `positionValue` (the XOR), `bestMove`, `misereMoverWins`, and
  `runSelfTest()` (exactly 5 rows). No closed form is hard-coded; `mex` is the sole nimber authority.
- `core.test.mjs` — the Node twin. Runs the 5 rows + four stronger statements (B1 staircase to 2000,
  B2 exhaustive minimax + bestMove over triples ≤14, B3 wider misère neg-control, B4 the pip-set ≡
  bestMove cross-check) + byte-parity (C) of the core inlined into `index.html`. Exit 0 = GREEN.
- `index.src.html` → `index.html` — the touchable page, forged with `tools/forge` (the core +
  `tools/ws/ws.js` are inlined byte-identically). Edit the `.src`, then re-forge.
- `CHANGELOG.md`, `NIMBER-STRIP.SPEC.md`, this README.

## Run the proof

```sh
node nimber-strip/core.test.mjs        # exit 0 = all green (5 rows + B1..B4 + byte-parity)
node tools/forge/forge.mjs nimber-strip/index.src.html   # rebuild index.html from the source
```

The in-page self-test pill calls the **same** `runSelfTest()` and renders the same 5 rows — the
pixels and the proof are one core.

## Play

Open `index.html`. Take 1/2/3 off the live end (click a tile, the buttons, or keys `1` `2` `3`); `U`
undoes, `R` plays again. The SAFE/DANGER pill reads straight off the top bead. Pull the **Split**
lever to see the heaps and their XOR lamps; **Re-split** re-rolls the cut. The default length 13 is
a winnable start; lengths divisible by 4 are honest losing starts.
