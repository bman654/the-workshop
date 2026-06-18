# The Cat's-Cradle Weaver — changelog

The Sewing Room's flagship bench. Glyph 🪢. Kind: *string figures · a formal
move-grammar*. Thesis: **a string figure is a sequence of legal pickups — and an
illegal one forms nothing.** The estate's first piece where the THING you touch (a
real loop on a pair of hands) is itself the proof object: each canonical figure exists
only because the move-grammar admits the path that builds it.

## v1 — first ship (cycle #121)

**The form.** A real gold loop is woven across ten finger-pegs on a pair of drawn
hands. You advance through the canonical sequence — **Opening → Cradle → Soldier's Bed
→ Candles → Manger** — by clicking (or pressing 1-5) a LEGAL pickup; each one lifts a
strand and the next figure FORMS. A "TRY A FORBIDDEN PICKUP" tray lets you attempt an
out-of-order move: the red **"Rejected — needs `<figure>` first"** box appears and the
string does **not** move (the touchable negative control). Crumb-trail, weave-all,
undo, and reset round out the controls; a back-link returns to `../sewing-room/`.

**The claim (the move-grammar is law, not decoration).** `cradle-core.mjs` is the
DOM-free SOLE AUTHORITY:

- A **state** is a set of peg-cycle LOOPS, compared by a **rotation- and
  direction-invariant canonical equality** — the same physical loop read from any peg,
  in either direction, is one state.
- `legalMoves(state)` lists the pickups admissible from a state; `applyMove` REJECTS an
  illegal pickup (`ok:false` + the state returned UNCHANGED) and applies a legal one;
  `figureKey` names the resulting canonical figure.
- `vacuousApply` is the load-bearing **negative control**: a do-nothing grammar that
  always "succeeds." The self-test proves it DISAGREES with the real grammar across the
  entire 16-pair reject set — a vacuous renderer cannot fake the laws.

**The proof.** `runSelfTest()` runs **12 checks** (the in-page chip reads `self-test
12/12 ✓`). The core is inlined byte-identically between the page's BEGIN/END sentinels.
The Node twin `cradle-core.test.mjs` is the **Plumbline** pattern (mirroring
`knot-tabulator/knot-core.test.mjs`): it re-extracts the in-page byte-twin and asserts
byte-equality of all **11 core functions** + the const tables (PEGS / CANON_PATH /
CATALOGUE), runs `runSelfTest`, asserts in-page pass-count === module pass-count
(12/12), and proves the vacuous renderer disagrees with the real grammar across the
full 16-pair reject set. **38/38 ✓ ALL GREEN.**

**Publisher fresh-eyes (cycle #121).** Reviewed clean — chip 12/12; the live
neg-control verified by hand (forbidden "Soldier's Bed" from the Opening → red reject
box + the figure name stays "The Opening", string unmoved; the legal Cradle pickup then
advances "The Opening" → "The Cradle"); weave-all animates Opening → Manger; 0 nested
anchors, 0 horizontal overflow @1280 AND @390, 0 console errors. Shipped as-is.
