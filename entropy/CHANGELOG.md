# The Source Dial (entropy) — changelog

## Re-soul in place — "The Shannon Limit" → "The Source Dial" (cycle 54, garden)

Re-grew the entropy bench from a static **bits-ruler explainer** into an **enacted,
in-motion compression you watch and operate**. Same files, same route
(`entropy/index.html`), same Workbench card, same Engine-Room cross-links — the
math layer is unchanged and still single-sourced; only the *form* changed, from a
chart wearing a caption into a thing you sculpt with your hand.

### The hero — three coupled physical bodies driven by ONE distribution you sculpt
- **The alphabet columns** (the source + the instrument): a row of `n` bars whose
  heights are the probabilities `pᵢ`. Pointer-drag a bar; the other `n−1` rescale so
  `Σp = 1` exactly (renormalized every frame, `pₘᵢₙ≈0.002` so no symbol vanishes,
  `pₘₐₓ≈0.97`). Full keyboard (←/→ select, ↑/↓ nudge), one-tap **FLATTEN** / **SPIKE**
  (animated to the extremes), and a live `n` selector (4 / 8 / 16) that moves the ceiling.
- **The mercury gauge** (`H` given weight): a thermometer whose amber mercury height is
  the entropy on a fixed `0…log₂n` scale, with an etched ceiling line at `log₂n`. A
  thinner cyan column is `L` (Huffman, or `L_k/k` under block coding), always at/above
  mercury; the gap between them is the unpaid slack, drawn with the amber hatch.
- **The message ribbon** (the literal bitstream): `N=120` symbols sampled from the
  *current* source, encoded with the live Huffman code into colour-banded 0/1 cells
  (each symbol's codeword chunk tinted by symbol). Its length is `N·L` bits; a fixed
  amber `N·H` floor tick marks the limit the ribbon approaches but never crosses.

The causal chain is enacted in one gesture: **drag a column → mercury moves → the gap
opens/closes → the ribbon grows/shrinks → the `N·H` floor tick stays put.** Source is
cause; entropy and compression are effects, wired live.

### Motion
- A ▷play / ⏸ / step / ⏮ transport streams the message symbol-by-symbol off a **single
  `requestAnimationFrame` loop** (one rolling step every ~70 ms): each symbol's
  root→leaf path lights in the (demoted) tree and its codeword chunk drops onto the
  ribbon with a live write-head.
- The page renders legibly **static at a glance** — the full ribbon shows without play.
- `@media (prefers-reduced-motion: reduce)`: skips streaming and the FLATTEN/SPIKE
  morph, rendering one correct static frame (full ribbon, mercury at rest, no auto-run,
  rAF idle).

### Demoted: the old math, now a quiet toggle rail
The old static Huffman-tree canvas, the `−log₂p`-vs-Huffman-length table, the Kraft
readout, the encode→decode strip, and the cipher punchline all collapse into a single
right-edge **"ⓘ the code / the arithmetic ▸"** slide-in rail — present, proven, never
the headline. When ▷play streams, the tree in the rail lights the active path.

### The math layer (single-sourced, byte-twin, verified)
- `entropy/core.mjs` remains the **sole authority** for
  entropy/maxEntropy/huffman/encode/decode/blockHuffmanLk/kraftSum. It is now inlined
  **byte-identical** into `index.html` between new `// === CORE BEGIN ===` /
  `// === CORE END ===` sentinels (matching sentinels added to `core.mjs`). The page
  reads `H/L/lengths/codes` from core every frame and never recomputes the limit in the
  draw path.
- `entropy/core.test.mjs` extended to **28/28** (was 17/17). New claims:
  - **Byte-twin parity** — the entire inlined slice `=== core.mjs` slice (sans the
    per-line `export` keyword), byte-for-byte; plus the load-bearing function bodies
    (`entropy`, `huffman`, `blockHuffmanLk`, `decode`, `runSelfTest`) char-for-char; plus
    eval-the-page-slice and assert its `runSelfTest()` pass-count & per-line agreement
    with the module (the demon's pattern, in spirit).
  - **The ribbon is the literal bitstream** — over 60 random sources, the concatenated
    per-symbol codeword chunks `=== encode(message, codes)` exactly, the bit-count equals
    `Σ len(chunk_t)`, and `decode(ribbonBits, tree) === message`.
  - Kept: H ≤ L < H+1 over 400 random sources, Kraft Σ2^(−lᵢ) ≤ 1, encode∘decode
    round-trip identity, block `L_k/k → H`, the uniform negative control `H = log₂n`
    (n = 1…64).
- In-page self-test pill bumped to **10/10** (the 9 shared witnesses + the live in-page
  ribbon == `encode().length` graft). Green @1280 and @390.

### Breadcrumb (a real pre-existing bug, fixed)
`entropy` was never in the front-door registry, so `ws:seen:entropy` was never written.
Added the canonical inline self-fire to the boot script (mirrors
`workbench/index.html`): it sets `localStorage['ws:seen:entropy']` on load. Net-positive
for the Survey of Heaven.

### Verified
- `node entropy/core.test.mjs` → 28/28 passed.
- `node engine-room/demon/core.test.mjs` → 17/17 (the demon still imports our `entropy()`).
- Browser-verified (agent-browser, uncommon port, torn down by exact PID): clean console,
  ~99 fps (rAF cap), 0 nested anchors, 0 horizontal overflow @1280 and @390, self-test
  pill green; the hero verb works live (drag → mercury + ribbon respond; FLATTEN → mercury
  on the ceiling, ribbon at max, verdict reads incompressible; SPIKE → ribbon retracts;
  k-dial pushes L toward H).

### Publisher sweep (cycle 54, fresh-eyes review)
The rename "The Shannon Limit" → "The Source Dial" left four stale display-name
cross-links in siblings that still called the piece by its old name (routes were correct —
only the link text was stale). Swept to "The Source Dial":
`butterfly/index.html` (FFT sources list), `clockwork/temperature.html` (the cross-card
title + its prose), and `engine-room/demon/index.html` (the bridge card lead + the footer
link). Re-verified all three sibling pages plus the Workbench card live: no overflow, no
nested anchors, the name now matches the page's `<h1>` everywhere.
