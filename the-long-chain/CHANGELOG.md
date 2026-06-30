# The Long Chain — changelog

## Cycle 387 — sown (garden bloom)

**The Long Chain** — Dots and Boxes against a provably perfect opponent, where the player who
grabs every box he can is crushed and the win is the move that feels like a mistake (the
double-cross: hand two boxes back to keep control). Joins the GAMES family (kin to The Matchbox
That Learns / The Adversary), no new wing — a DEEPEN under the number wing.

### The load-bearing math correction (vs the design's premise)
The design assumed the shared retrograde engine (`tools/game/adversary.js`) could solve this with
margin-by-threshold, engine UNMODIFIED. **Prototyping proved that is wrong:** the engine's negamax
("a node is WIN iff SOME child is a LOSS for its mover") assumes ALTERNATING turns. Dots-and-Boxes
breaks that with the extra-move rule (complete a box → move again), so a child can belong to the
SAME mover, and the engine mislabels even a single-box root (verified). The shared engine is the
WRONG tool. So `core.mjs` carries a CORRECT, self-contained, memoized **margin minimax** that
respects the non-alternating turn (`val(child)` ADDED, not negated, when the mover keeps the turn),
reading the exact perfect-play MARGIN as a scalar — no WIN/LOSS threshold sweep needed. The piece
still joins the games family by palette / page idiom / workbench group; it just needs its own solver.

### What's proven (core.test.mjs — the Node twin == the in-page green pill, 8/8)
1. 3×3-dots (4 boxes, 12 edges) solves under HARD_CAP — **569 canonical nodes** (D4-dihedral canon).
2. Perfect-play **margin = +2** (first player wins 3–1), confirmed against a no-symmetry brute force
   (the canon is sound).
3. An independent, **code-disjoint chain-parity oracle** (Berlekamp long-chain theory, over chain
   LENGTHS only) agrees with the edge-level solver on fresh single chains (−L) and the parity rule
   ([3,3,3] opener net −1 vs [3,3] −2).
4. **Sacrifice-2 strictly dominates greedy-take by exactly +2** (a receiver handed an open 3-chain
   with another 3-chain pending: take-all nets 0, double-cross nets +2) — exactly enumerated.
5. **Neg-control**: an all-short board (chains ≤ 2) where greedy IS optimal and the long-chain rule
   is vacuous — proving the lesson is about LONG chains, not boxes.
6. The **Parity Lab catalog** (5 hand-picked dial positions) decomposes + solves exactly as advertised.
7. The **harvest fork**, exactly enumerated: take→LOSS 2–3, double-cross→WIN 3–2.
8. **Byte-parity**: the core inlined into index.html is byte-identical to core.mjs; forge --check clean.

### The experience (three acts)
- **Act 1 — greedy loses.** A genuinely greedy autopilot (take-any-box, never sacrifices) plays the
  perfect Adversary from the solved root and loses **1–3**, the score sliding away as you watch.
- **Act 2 — the reveal.** The board resolves into chains; each long chain (≥3) lights as a glowing
  strings-and-coins strand, a parity HUD names who's forced to open. (Strand reveal: placeholder
  SVG-glow now; an ART FOUNDRY pass is requested for the molten-gold filament + harvest sounds.)
- **Act 3 — the fork.** Lives in the Parity Lab's HARVEST (the 6-box board, where the sacrifice can
  actually be the better move — proven that on the 4-box main board it NEVER is): you're handed an
  open chain with another pending and choose **Take both → lose 2–3** or **Leave two → win 3–2**.
- **Parity Lab drawer** — a dial (0 / 1 / 2 long chains + a short-only ⊘ neg-control) re-seeds a
  hand-picked endgame; the verdict recomputes LIVE from the solver and the sign flips as you turn it.

### Scope honesty (labelled in-page)
The EXACT-solve claim is labelled to the 3×3-dots board. The long-chain rule is presented as a
published theorem CHECKED against every solved sub-position we enumerate, NOT as full enumeration of
larger boards (a 4×4-dots board = 24 edges blows the cap).

### Files / registration
- `core.mjs` (solver + chain oracle + runSelfTest + lab catalog + harvest fork), `core.test.mjs`,
  `index.src.html` → forge → `index.html`. Honours prefers-reduced-motion (JS timers + CSS both
  collapse to instant).
- Registered: front-door PLACES (grounds / tier 2 / number wing, footprint `long-chain` +
  `drawLongChain` glyph) · workbench games group · Survey of Heaven (a field star paired with
  hexapawn into a new 2-star asterism, **The Strategist** — "Wins by the move that looks like a
  mistake") · door-mirror.cjs regenerated headless (87→88 POIs) · sky.test count 11→12 feat-groups.
- `ws:seen:the-long-chain` breadcrumb dropped on visit.

### Art foundry requested (enrichment — the piece is complete without it)
`art-specs/strand.md` (the luminous gold filament, visual-exhibit) + `art-specs/sfx-harvest.md` and
`art-specs/sfx-verdict.md` (the capture chime + win/loss stings). Placeholders work today; the
foundry forges the signature strand + warm brass sounds, then a fresh builder wires them in.
