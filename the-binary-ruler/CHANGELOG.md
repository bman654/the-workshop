# The Binary Ruler — changelog

The Numbers Room's 26th bench. Tower of Hanoi as a counting machine: the optimal
solve *is* counting 0,1,2,… in binary. Play the tower; a brass odometer rolls to
exactly 2ⁿ−1 — the number is the trophy. Stray off the ruler and a provable
floor-meter rolls your wheel past the brass.

## Cycle #302 — BLOOMED (planter, garden track)

Lifted from explorer prototype B ("The Brass Odometer"), grafted with prototype A's
honest continuous-overshoot meter, and closed the gap all three explorers shared:
a **closed-form, search-free Gray decoder** so the proof footer "peg(t)=Gray-decode
G(t)" is literally true (not a replay in disguise).

### Form
- **LEFT** — a real playable Tower of Hanoi on a brass-framed canvas (n=1..8,
  default 5; gold→teal numbered discs; click-a-peg lift/drop). Auto / Step / Reset.
- **RIGHT** — three coupled faces of one act:
  1. the literal brass **decimal odometer** — cylindrical wheels that tumble forward
     on carry, the wrapping wheel flashing a gold carry-glow;
  2. the **bit-lamps** (one per disc) — the lamp that just flipped names the disc to
     move next;
  3. the **Gray dial** reading G(t)=t⊕(t≫1) — exactly one digit changes per tick,
     and that single change names the moved disc.
- AUTO drives the count to exactly **2ⁿ−1** with the win banner
  "★ Home in 31 = 2⁵−1 — the number is the trophy."

### The overshoot graft (from prototype A's honest continuous floor)
- A live floor cartouche carries the closed-form `minMoves(state)`: provable
  best-possible TOTAL = yourMoves + minMoves(state). `(that − floor)` is shown as a
  continuous "overshoot +N · best you can do now is K" that reddens the cartouche the
  instant you stray — and **visibly rolls your move-wheel PAST the brass floor** once
  yourMoves exceeds 2ⁿ−1 (the move-row and its wheels turn red).
- The truthful behavior falls out of `minMoves` for free: for a fixed target peg only
  ONE of disc 1's two free destinations is on the ruler; the other costs +1. (The
  explorer's "either free peg keeps overshoot 0" note was an over-claim; the meter is
  honest about which direction is optimal.)

### The math core (`core.mjs`, inlined byte-identical by forge)
- `ruler(t) = trailingZeros(t)+1` — the disc moved at step t (the 2-adic valuation).
- `optimalMoves(n)` — the recursive optimal solve; length === 2ⁿ−1.
- `grayState(n,t)` — the **closed-form** peg-state decoder (largest→smallest walk with
  carried from/to/via pegs and rem=t; half=2^(k-1)). Verified === replay for n=1..10,
  every t. NOT a replay.
- `minMoves(pos,n,target)` — closed-form provable distance home from ANY legal state.
- `bfsDistToHome` — an independent BFS oracle over the base-3 state graph; certifies
  the neg-controls WITHOUT trusting the recursion or the closed form.
- Neg-controls: `detourFoil` (a legal detour > floor, BFS-certified) and
  `offRulerProbe` (one off-ruler first move overshoots AND leaves grayState(n,1),
  while the on-ruler move keeps 1+dist===floor exactly).

### Self-test (8 in-page checks; Node twin adds 8 deep cross-checks — 16/16 green)
1. optimal length === 2ⁿ−1, n=1..12
2. disc(t)===ruler(t), whole solve, n=1..12
3. **grayState(n,t) closed form === replayed peg-state, n=1..10 all t**
4. Gray adjacency DECODED: exactly 1 disc & 1 Gray bit per tick, naming ruler(t), n=1..11
5. neg-control A: detour foil solves but > floor, BFS-certified, n=2..9
6. neg-control B: off-ruler overshoots AND leaves grayState(n,1); on-ruler stays on floor, n=2..9
7. minMoves closed form: fresh=2ⁿ−1, solved=0, counts down 1/optimal move, === BFS at start
8. structural: ruler(1..15)=1,2,1,3,1,2,1,4,…; fresh→peg0; solved→peg2

### Polish
- The odometer cell height is a single `--wheel-h` CSS var (read by `rollOdometer`),
  so wheel-height changes can't desync the roll — no magic 46px in JS.
- Self-contained, forged from `index.src.html` (`forge:include ./core.mjs`); page &
  Node test share one core that can never drift. No console errors; no horizontal
  overflow at desktop or mobile widths.

### Registration
- Numbers Room landing: 26th bench card (🗼, exact/teal), lede + footer counts bumped
  to 26, structural self-test updated (card-count 26 + Binary-Ruler bench-link +
  proof-footer check) and GREEN (36/36). No new front-door map node — M stays 27.
