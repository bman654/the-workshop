# The Nimber Strip — changelog

## 2026-06-22 — bloomed (cycle 293)

The Numbers Room's **24th bench**. A subtraction game that is secretly Nim — made a thing you PLAY,
with the Sprague–Grundy nimbers cycling `0, 1, 2, 3` down a four-step staircase nobody drew, and a
split lever that cleaves the strip into heaps so the whole of Nim wakes up in front of you.

**The math core** (`core.mjs`, sole authority, inlined byte-identical into `index.html` via forge):
zero-dep, DOM-free, deterministic xorshift32 `makeRng`. `mex` (the minimum-excludant primitive),
`grundy` (the Sprague–Grundy value of one strip, by the pure rule `mex{g(k−1),g(k−2),g(k−3)}` —
**NEVER `k%4`**), `legalMoves`, `apply`, `isTerminal`, `positionValue` (= XOR of the heaps' nimbers,
the disjunctive sum), `bestMove` (a provably perfect move: the one whose child has value 0),
`misereMoverWins` (the true misère winner by exhaustive recursion), and `runSelfTest()` with
**exactly 5 named rows**:

1. **the staircase** — the live mex reproduces `g(n)=n%4` for every n≤200 (n%4 is the *oracle*, never the source);
2. **the unification** — `positionValue===0 ⟺ the mover loses`, checked against an *exhaustive normal-play minimax* (not against XOR itself), over single AND multi-heap positions;
3. **bestMove is perfect** — zeroes the XOR on every N-position, returns null on P/terminal, always legal;
4. **the perfect AI never loses a won game** — 0 losses over the seed-`0xC0FFEE` self-play tournament;
5. **the misère neg-control** — the normal-XOR verdict *mis-predicts* an explicit endgame; the flip set is non-empty and includes the lone heap `[1]` (normal: XOR=1≠0 ⇒ "mover wins"; misère: taking the last stone loses ⇒ mover actually loses).

**The Node twin** (`core.test.mjs`): runs the 5 rows + (B1) a stronger staircase to n≤2000 + (B2)
exhaustive minimax & bestMove-zeroes over 680 sorted triples ≤14 + (B3) a wider misère neg-control
over all pairs ≤6 (15 disagree / 33 agree, maxGrundy≤3, the lamp-width invariant) + (B4) the
**pip-set ≡ bestMove** cross-check over 998 N-positions + (C) **byte-parity** of the inlined core
(11539 bytes vs 11539).

**The touchable scene** (`index.src.html`): pure SVG, Numbers Room leaf palette borrowed from The
Stone Heaps. A horizontal strip of felt tiles with a brass disc on each lit tile; over each tile a
**bead** whose height (6/16/26/36) and tint (dark/teal/gold/coral) BOTH switch on the *returned*
`grundy` (never inline k%4, so a broken core breaks the pixels). A ghosted period-4 wash makes
`colour(k)==colour(k+4)` visible. Play first (take 1/2/3 off the live end by click / buttons / keys
1·2·3, U undo, R replay) against a flint AI reading `bestMove`; a brass teaching halo rings the dead
bead the AI parks you on. A SAFE/DANGER pill reads straight off the top bead. Pull the **split
lever** and the strip cleaves into curated heaps; beneath each heap a 3-lamp row (4s·2s·1s) shows
its nimber in binary, and a COMBINED XOR row lights when an *odd* number of heaps set that bit —
all-dark ⇒ you are LOST; the winning move darkens every lamp. Hover a move to preview the lamps;
the XOR-zeroing move is the one marked "→ darkens the lamps". A re-split knob re-rolls the cut.
Misère stays OFF the surface (so "g=0 ⟺ you lose" stays clean); it lives only inside the self-test
as the neg-control.

The default length is **13** (a winnable start, grundy 1) so a fresh player can actually win;
lengths divisible by 4 are honest P-positions where the pill says you are lost.

Pill GREEN (5/5). Reciprocal ↗ link with `nim/` "The Stone Heaps" (the same nimber arithmetic, born
in a different game). No new front-door PLACES node — a twin of `nim/`, which has none.
