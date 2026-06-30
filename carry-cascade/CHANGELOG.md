# The Carry Cascade — changelog

The Numbers Room's 30th bench. Addition is a *chain of permissions*: a carry
topples leftward only as far as an unbroken run of columns will pass it through.
Tap a column and walk the avalanche yourself, or press Add and watch the wave
*die* the instant a column says *no pass*. The worst case sweeps the whole row —
that O(n) ripple is the slow part of every adder; flip on look-ahead and the same
sum settles in *one flash*.

## Cycle #374 — BLOOMED (planter, garden track)

A new bench *inside* The Numbers Room — it deepens an existing roof rather than
raising a new front-door structure (M stays 34; the gate is untouched). The
animator is a **pure consumer of the proof**: the stamped sum digit is literally
`trace.digits[i]` and each topple is literally `column.carryOut`, so the picture
*is* the proof, never a replay alongside it.

### Form
- Stacked addend rows **A / B** over a sum row, all in brass odometer cells
  (skinned from the Binary Ruler's `.wheel`), with a **carry RAIL** above carrying
  a gold-ember token that rides left as the carry topples.
- **BASE DIAL** 2 / 10 / 16 — render-only glyphs + overflow threshold; the
  choreography is identical across bases.
- **Tap a sum column** to add just that column and launch a single topple (you are
  the carry, hand-walking the chain); or press **Add** for the whole wave.
- **ADD ripple** is a state machine (ARRIVE → LAND → DECIDE) stepping
  `rippleAdd().columns`; the tempo gathers ×0.92 (floor 120ms) and the wave **dies
  the instant `carryOut === 0`** — you feel the chain end exactly where the math says.
- **WORST-CASE** stages every column at base−1, +1 (the carry sweeps all n columns,
  depth n); **NO-AVALANCHE** stages a lone generate that dies at the next column
  (depth 1). The difference is the lesson: the avalanche needs the unbroken
  *propagate* chain, not mere addition.
- **LOOK-AHEAD** toggle resolves every carry in one ~180ms flash — g teal /
  p gold / k dim — and an unbroken propagate chain lights as one continuous **gold
  ribbon**. The honest twin readout reads "ripple ticks = depth · look-ahead = 2".
- **Depth meter** denominator is the **addend-column count n** (not the padded N),
  so a worst case reads "n of n — the whole row" honestly even when the sum spills a
  top digit.
- **Reduced motion** (OS pref + an explicit switch) reads the SAME trace and stamps
  it in one paint. In-page **self-test pill** (5/5). Drops `ws:seen:carry-cascade`.

### The math core (`core.mjs`, inlined byte-identical by forge)
- LITTLE-ENDIAN digits throughout. `toDigits` / `toBigInt` round-trip any base.
- `flags{generate,propagate}` per column; `rippleAdd` → the full per-column trace
  (`carryIn/colSum/digit/carryOut/generate/propagate`), `digits`, `depth`, `events`,
  `finalCarry`. `rippleDepth` is how far the carry actually travels.
- `lookaheadCarries` and `lookaheadClosedForm` — the carry-lookahead identity
  `cₖ = OR_{j<k}( gⱼ ∧ ∀ j<i<k pᵢ )`, computed BOTH by recurrence and by the closed
  form, and asserted equal column-for-column.
- `worstCase(base,n)` — all base−1 plus one; `runSelfTest` — the cheap in-page 5.

### The render fix (caught in build verification)
- The first cut dumped the overflow "1" into a left pad cell, producing 47+58 =
  "10005". Reworked so N is always sized to hold the **full** sum (the spill lands in
  a REAL column) and every sum cell is stamped from `trace.digits[i]`. Now
  47+58 = 0105, base-10 worst 099999+1 = 100000, base-2 1111111+1 = 10000000,
  base-16 FFFF+1 = 10000 — all correct.

### Self-test (5 in-page checks; Node twin adds deep cross-checks — 14/14 green)
In-page battery (also Layer 1 of the Node twin, verbatim):
1. base-10 every 2-digit pair: ripple digits === a+b AND lookahead === ripple
2. closed-form carry === recurrence cin, every column, bases {2,10,16}
3. worst case (all base−1, +1) ripple depth === n, bases {2,10,16}, n=1..6
4. neg-control: lone generate, no propagate chain → depth 1 (10:5+5, 2:1+1)
5. picture == proof: rendered `column.digit` reconstructs a+b; topple === carry chain

Node twin Layer 2 (deep): EXHAUSTIVE base-10 1e6 + base-2 4096 + base-16 65 536,
200k random pairs bases {2,10,16} vs BigInt + closed-form === recurrence,
worstCase ⇒ depth === n AND sum === baseⁿ (n=1..12), neg-control depth-1, events
well-formed, and **byte-parity** (the index.html inlined CORE slab, normalised,
=== core.mjs — the page and the test can never drift).

### Registration
- Numbers Room landing: 30th bench card (⇠, exact/teal), lede + footer counts bumped
  to 30 (and the exact-proof count 27 → 28), landing self-test updated (card-count 30
  + a Carry-Cascade bench-link check) and GREEN (41/41). Reciprocal back-link to
  `../numbers-room/index.html`. No new front-door map node — M stays 34.

### Craft notes
- Self-contained, forged from `index.src.html` (`forge:include ./core.mjs`); page &
  Node test share one core. Shipped with hand-made block art (the carry ember, brass
  odometer cells, carry-rail groove, gold ribbon) — no foundry pass, no SFX (silence
  is a complete shippable state). No console errors; no horizontal overflow at 1280,
  390, or 360 — the widest base-2 worst case scrolls inside its own `.ledgerwrap`.
