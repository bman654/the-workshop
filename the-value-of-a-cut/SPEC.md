# The Value of a Cut — SPEC

A touchable **partisan** combinatorial game — **Blue-Red Hackenbush** — the number-valued sibling to
The Toads & Frogs Court, living under the Numbers Room in the Strategist / solved-games vein.

## The game

A forest of coloured edges grows on **the earth** (node 0). **Blue** edges are yours (Left, positive);
**red** are the opponent's (Right, negative). On your move you **cut** one of your own edges; it, plus every
edge no longer connected to the earth, **falls away**. A side with no legal cut **loses**.

Every Blue-Red position is a **number** — a Conway surreal, in fact an exact **dyadic** — and the *sign* of
that one number is the winner: `>0 → Blue wins`, `<0 → Red wins`, `=0 → whoever moves next loses` — no
matter who starts.

## The convention (load-bearing — honoured across shapes, narration, core, fixtures)

**Left = Blue = positive.** A **+½** stalk is a **blue edge grounded on the earth with a red edge on top**
(the Colon reads root→sky as the binary fraction `0.1 = ½`). The seed's shorthand "a blue edge on a red =
+½" is loose; the actual construction is **blue-grounded, red-on-top**. Deeper: `b·r·r → +¼`, `b·r·r·r →
+⅛` (the **Colon Principle**). The ¾ colon stalk is the sign-expansion `+ − +` (blue, red, blue).

## The two oracles (the heart of the correctness claim)

Two **independent, code-disjoint** authorities that must agree:

1. **`value(edges)`** → an **exact dyadic** `{num:BigInt, den:BigInt = 2^k}`, built by Conway's recursive
   **simplest-number** rule `value(G) = simplestBetween(max Left-option, min Right-option)`, summed over
   ground-rooted components. Integer BigInt numerator over a power-of-two BigInt denominator — **no float
   anywhere**. **Guard:** `value()` *throws* on any board containing a **green** edge (green ⇒ a nimber,
   not a number). This is the who-is-it-worth authority the HERO PLATE reads.
2. **`outcome(edges)`** → `L | R | N | P`, a **pure-boolean negamax** (`leftWins` / `rightWins`) that
   imports **nothing** from the value algebra. This is the sole who-wins authority the page reads. For a
   Blue-Red board it always lands in `{L,R,P}` (never `N` — a number is never fuzzy); a green board may be
   `N`, which is the whole point of the neg-control.

Plus a **third** authority used only in the self-test: **`closedFormStalk(colors)`** — the Colon Principle
written as a direct sign-expansion, independent of `value()`, so leg B is two computations that must agree
bit-for-bit.

The page is a pure dressing layer: it never recomputes a value or a winner from a formula. It prints
`value(edges)` on the plate, reads `outcome(edges)` for the oracle, and asks `bestMove(edges,'red')` for the
AI reply.

## The contract (`core.mjs`, between the `// ===== VALUE-OF-A-CUT CORE … =====` sentinels)

- Exact dyadics: `DY`, `reduceDy`, `dyAdd`, `dyCmp`, `dyEq`, `dyNeg`, `dySign`, `dyFloor`, `dyCeil`,
  `simplestBetween(L, Rhi)`, `closedFormStalk(colors[])`.
- Graph: `groundedEdges`, `fallenAfterCut(edges,id) → {kept,fallen}`, `cutEdge`, `hasGreen`, `keyOf`,
  `leftOptions`, `rightOptions`.
- Authorities: `value(edges)` (throws on green), `outcome(edges)`, `leftWins`, `rightWins`,
  `bestMove(edges, 'blue'|'red')`.
- Fixtures + `runSelfTest() → {ok,passed,total,checks:[{name,pass,info}]}` (same shape as the siblings).

The board is a list of `{id,a,b,color}` edges in BOTH the page and the core (no string boundary — the
graph is richer than a strip).

## Self-test — 4 in-page rows + the Node twin's wider legs

**In-page (`runSelfTest`, the pill runs this exact function):**

- **A** · `sign(value)` ⟺ optimal-play winner over 300 random blue/red forests: `>0⟺L, <0⟺R, 0⟺P`, no `N`,
  zero mismatches.
- **B** · the **Colon Principle**: `value(stalk) === closedFormStalk(colors)`, exact dyadic, for **all**
  blue/red stalks up to **depth 10** (2046 stalks — kept snappy in-page).
- **C** · the **all-green neg-control**: an odd all-green stalk is a **nimber** — `outcome === 'N'` (first
  player wins) and `value()` **refuses** it (throws); a balanced green pair is `P`, an unequal pair is `N`.
- **D** · the **fall**: cutting the base drops the whole stalk; cutting the top leaves the base.

**Node twin (`core.test.mjs`):** runs the 4 rows, then adds **B1** (sign⟺winner + value0⟺P over 1500
random forests/trees, no N), **B2** (Colon Principle **exhaustive to depth 14** — 32766 stalks), **B3**
(Colon Principle **depth 15..16 sampled**, 4000 stalks, asserting den a power of two + lowest terms — this
is the DoD's "all stalks ≤ depth 16" claim), **B4** (a seeded **perfect-play tournament**: the outcome
winner never loses + bestMove lands on a winning cut, 0 failures over ~585 decisive starts), **B5** (value
negation symmetry: recolour blue↔red negates the value exactly over 2000 forests), and **C** (byte-parity:
the core inlined into `index.html` is byte-identical to `core.mjs`, sentinel-to-sentinel).

### Self-test bounds (asserted here)

The Colon Principle is proven **exhaustively to depth 14** and **sampled at depth 15–16** in the Node twin;
the in-page sweep runs **depth ≤ 10** for snappiness. Forest sweeps stay small (the game tree is exponential
in edge count). Longer/wider tangles are fully **playable** on the page (`value` and the negamax recurse to
any size) but are **not exhaustively self-tested**.

## Honesty labels (required, present on the page)

- The value is **computed by exact surreal / dyadic arithmetic** (BigInt numerator over 2^k, no float).
- The all-green mode is **an impartial (Nim) game where the theory genuinely differs** — a nimber, not a
  number — so the oracle's deliberate mis-call there is the **honest** answer, not a bug (value plate shows
  `∗?`, the bird warns "the sign lies here").

## Art (forged in-house — installed and wired)

- **Oracle bird** (`art-specs/oracle-bird.md`, forged → `oracle-bird.js`) — a bespoke perching-bird sprite
  that hops to the winning side / flutters on a win / ruffles a warning on the all-green mis-call. API:
  `window.Bird = { mount(svg), setSide(side, ctx), cheer(side, ctx) }`; `side ∈ blue|red|center|warn`.
  Included as a classic `<script>` before the module so `window.Bird` is set at boot; a one-line inert
  `BirdPlaceholder` stub remains only as a load-failure fallback.
- **Cut sounds** (`art-specs/cut-sounds.md`, forged → `sfx-scissor.js`, `sfx-tumble.js`, `sfx-win.js`,
  `sfx-ping.js`) — a soft scissor-snip, a low wooden tumble (scaled by fallen-count `n`), a warm win chime,
  a faint brass oracle ping. Each sets `Gate.sfx.<key>` and is included before the module boots; `play(key,
  fallback)` prefers the forged builder. **`loss` was not forged this round** — `play('loss', …)` uses its
  in-file fallback (a dry thud); `Gate.sfx.loss` can be forged later without changing the call site.
- The `play()` plumbing hands the forged builders `{ ctx, dest, dur, when: 0, seed, n }` — `when` is a
  **relative** offset (the builders schedule at `ctx.currentTime + when`), and per-key `dur` comes from
  `SFX_DUR`. All builders are dual-use offline/live, deterministic (seeded PRNG), and never throw.

## Build

`node tools/forge/forge.mjs the-value-of-a-cut/index.src.html` inlines `core.mjs` byte-for-byte between the
sentinels (plus `tools/ws/ws.js`). `node the-value-of-a-cut/core.test.mjs` exits 0 **ALL GREEN** (including
leg C, the byte-parity check).
