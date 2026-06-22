# The Nimber Strip — SPEC

The contract this bench keeps. The Numbers Room's 24th bench; an EXACT bench (it makes a math claim
and proves it). A twin of `nim/` "The Stone Heaps" — it does NOT re-teach classic heap-Nim; its
novelty is the emergent staircase + the unification reveal, leaning on the link to Stone Heaps.

## The math (the only thing claimed)

The subtraction game `S = {1, 2, 3}`: from a strip of `k` stones you may remove 1, 2, or 3 from the
live end. Normal play: take the last stone to WIN.

- **mex(S)** = the minimum excludant: the smallest non-negative integer not in `S`. The sole
  primitive. `mex` is the ONLY nimber authority — no closed form is hard-coded.
- **grundy(k)** = the Grundy value (nimber) of one strip of length `k`, bottom-up:
  `grundy(0) = 0`; `grundy(k) = mex{ grundy(k−1), grundy(k−2), grundy(k−3) }` over the in-range
  legal children. The closed form `g(k) = k mod 4` is the **oracle** the self-test *compares*
  against — it is NEVER the source.
- **positionValue(heaps)** = `XOR` of each strip's grundy (the Sprague–Grundy disjunctive sum).
  `===0 ⟺ the mover is LOST` (a P-position); `≠0 ⟺ the mover can WIN`.
- **bestMove(heaps)** = a provably perfect normal-play move (the child with `positionValue===0`),
  or `null` on a P-position / terminal.
- **misereMoverWins(heaps)** = the true MISÈRE winner (take the last stone ⇒ you LOSE), by
  exhaustive recursion — independent of the XOR rule.

## The self-test — EXACTLY 5 rows (`runSelfTest()`, the page pill + twin section A call THIS)

1. **staircase**: live-mex `grundy(n) === n%4` ∀ n≤200 (compared, not hard-coded).
2. **unification**: `XOR=0 ⟺ mover loses`, vs an EXHAUSTIVE normal-play minimax (not vs XOR), over
   single heaps 0..30 AND all triples ≤8.
3. **bestMove perfect**: zeroes the XOR on every N-position, `null` on P/terminal, always legal.
4. **perfect AI**: 0 losses over the seed-`0xC0FFEE` self-play tournament.
5. **misère neg-control**: the normal-XOR verdict MIS-predicts an explicit endgame; the disagreement
   set is non-empty and includes the lone heap `[1]`.

The page pill renders these 5 rows and **nothing else** — no page-local checks are folded into the
pill (that would desync the count). The required in-page sentinel-presence check runs SEPARATELY at
boot (console only).

## The Node twin (`core.test.mjs`) — stronger statements + byte-parity

- (A) the 5 rows via `runSelfTest()`.
- (B1) staircase `grundy(n)===n%4` ∀ n≤2000.
- (B2) exhaustive minimax + bestMove zeroes, over sorted triples ≤14.
- (B3) wider misère neg-control over all pairs ≤6: disagreement non-empty, agreement on the
  complement, **maxGrundy≤3** (the lamp-width invariant — 3 binary lamps suffice).
- (B4) **pip-set ≡ bestMove** on N-positions: the "→ darkens the lamps" pip set = legal moves whose
  child has `positionValue 0`; bestMove's choice has value 0 AND is a member of that set.
- (C) **byte-parity**: the core inlined into `index.html` between the `NIMBER-STRIP CORE` sentinels
  is byte-identical to `core.mjs`.

## Move representation (pinned)

A move is `{heap, take}`: `heap` = index into the heaps array, `take ∈ {1,2,3}` = stones removed.
Single-strip mode is `heaps=[n]` so `heap` is always 0; the strip UI speaks `take` and calls
`bestMove([remaining])`. Clicking the j-th-from-frontier tile commits `take=j`. The lever's per-heap
UI passes the real heap index.

## The page (what you can see / touch / play)

- One horizontal SVG. **Cell row**: n felt tiles, a brass disc per occupied tile, taken tiles dark,
  rightmost lit tile = the frontier. **Bead row**: a bead per tile whose HEIGHT (6/16/26/36) and
  TINT ({0:dark, 1:teal, 2:gold, 3:coral}) both switch on the *returned* grundy — never inline k%4.
  A mono nimber numeral inside each bead. **Period banding**: a ghosted 4-tint wash per cell drawn
  from each cell's grundy, so `colour(k)==colour(k+4)` is visible.
- **Play loop** (normal play only): you move first; click any of the 3 topmost lit tiles (take 1/2/3)
  with a removal + landing-ring hover preview; `[Take 1][Take 2][Take 3]` bar (disabled when too few
  remain); keys `1`/`2`/`3` (`←` = 1), `R`/`Enter` = play again, `U` = undo. AI reply via
  `bestMove` after a ~350 ms beat (0 ms under prefers-reduced-motion). A brass **teaching halo**
  rings the dead bead (g=0) the AI parks you on + a brass arc old→new frontier.
- **SAFE/DANGER pill** reads straight off the top bead / the XOR. **Length stepper** 4..40.
- **Split lever**: cleaves the strip into curated heaps (derived from the length; the re-split knob
  re-rolls). Beneath each heap a 3-lamp row (4s·2s·1s) = its nimber in binary; below the stack the
  COMBINED XOR row lights iff an *odd* number of heaps set that bit. All-dark ⇒ red LOST halo; any
  lit ⇒ teal WIN. Hover a legal move previews the combined row (ghost lamps); the XOR-zeroing move
  gets the "→ darkens the lamps" pip. **Lamps READ, never DECIDE** — the perfect player is
  `bestMove`; the pip set is asserted ≡ bestMove's choice on N-positions (twin B4).
- **Misère stays off the surface** (play is normal-only so "g=0 ⟺ you lose" stays clean); misère
  lives only inside `runSelfTest` as the neg-control.

## Wiring (reciprocal, all 200)

- `numbers-room/index.html`: the 24th bench card (glyph 🪜); counts kept honest (lede/footer/ck) and
  a `Nimber Strip bench present` ck; the room pill stays GREEN (33/33).
- Reciprocal ↗ with `nim/` "The Stone Heaps": a `.bb-sib` card on each page (galton's idiom). nim is
  re-forged from its `.src` and its pill stays GREEN.
- Back-link to `../numbers-room/index.html`; `ws:seen:nimber-strip` breadcrumb dropped on direct
  visit. NO front-door PLACES node (a twin of `nim/`, which has none).

## Invariants a future maker must not break

- `mex` is the sole nimber authority; `n%4` appears ONLY as the compared-against oracle in checks.
- The page pill renders exactly the 5 `runSelfTest()` rows — no page-local checks folded in.
- The beads switch on the returned grundy, never on an inlined `k%4`.
- The core inlined in `index.html` must stay byte-identical to `core.mjs` (the C check).
- Lamps render g/XOR from the same core; the perfect player is `bestMove`; the pip set ≡ bestMove on
  N-positions (B4).
