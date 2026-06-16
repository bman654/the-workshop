# The Comma — changelog

A Sound Garden **leaf** (garden growth of a built wing): twelve true perfect
fifths stacked one octave at a time, overshooting home by a hair you can *hear* —
the **Pythagorean comma** — then a temper lever that shaves every fifth by an equal
1.955¢ until the wolf beat slows to a dead stop and the spiral snaps into a clean
circle (the piano's beautiful lie, made touchable).

Reached from the Sound Garden footer (a *family* link, mirroring The Butterfly's
Voice), the Carillon ("why twelve fifths can't agree on a bell's octave"), and
butterfly-voice (reciprocal — both single-source the same `pitch-core.mjs`). **No
front-door footprint, no ws:seen** — this is garden work, not grounds.

## v1 — #64 (planted)

Built from explorer B (the stacked-tone tower + the wolf you hear) with two grafts
from explorer C (the filled wolf-wedge replacing the star-polygon overshoot; the
compact cents-accumulation ruler). One self-contained `index.html` (vanilla JS, no
deps) + the shared math + a Node twin.

### Three enacted gestures (the grounded gate)
1. **WIND the tower** — click *wind a fifth (×3/2)* to stack rungs tone-by-tone (or
   *wind all twelve*); each rung is a real plucked pitch climbing a ladder of
   fifths. The dashed *true home (7 octaves · ×2⁷)* line sits with vertical
   headroom above the overshoot so the +¢ gap bracket at rung 12 reads cleanly.
2. **HEAR the wolf** (the climax) — *sound the wolf vs the octave* plays the
   stacked twelfth (≈132.6 Hz) against the true octave (130.81 Hz); the gold→teal
   SUM-wave shows the beat envelope, captioned with the live beat rate. Dragging the
   temper lever live-retunes oscillator *b* (`setTargetAtTime`) so the throb audibly
   **decelerates to a dead stop**.
3. **PULL the lever & SEE the gap close** — one shared `t∈[0,1]` drives everything.
   The companion's headline is the filled gilt→teal **wolf wedge** (the overshoot
   arc) with a `+23.46¢ → 0¢` callout that shrinks and snaps to a clean ring as
   `t→1`. The spiral stays secondary, on the same gold→teal axis. A compact
   **cents ruler** strip shows the +1.955¢-per-peg comma accumulation.

### The math, single-sourced & self-tested
- All pitch/ratio math lives in **`../pitch-core.mjs`** in a new
  `// ===== COMMA CORE … =====` block, appended *after* the byte-untouched PITCH
  CORE (so butterfly-voice keeps byte-twinning that block). The page inlines a
  **byte-twin** of the COMMA CORE slice (8219 chars, verified identical).
- The comma is **derived** (`cents∘fold∘(3/2)¹²`) inside the CORE with **no typed
  decimal** there; the famous `531441/524288` literal lives in **exactly one file**
  (`pitch-core.mjs`).
- `runSelfTest()` is the **sole oracle**, called by both the in-page pill and the
  Node twin. Six legs:
  - **A** comma exact — `(3/2)¹²` folded ÷2⁷ === `531441/524288` to the bit (Δ=0,
    two disjoint derivations) + twelve ET fifths close (residual ≈ 0).
  - **B** 23.460¢ — `cents(comma)` = 23.460¢, and the just spiral overshoots by
    exactly that.
  - **C** equal hair — ET shaves `comma/12 = 1.955¢` off every fifth (701.955¢ →
    700¢).
  - **D** **negative control** (load-bearing) — same 12 multiplies + fold leaves
    23.460¢ for 3/2 but ≈0¢ for 2^(7/12); the comma is the *fifth's*, not round-off.
  - **E** continuity — `gap(t) = comma·(1−t)`, strictly monotone comma → 0.
  - **F** cents ruler — the just stack accrues +1.955¢ per peg, summing to the comma
    at peg 12.
- **`core.test.mjs`** (the Node twin): re-runs all six legs via the shared
  `runSelfTest`, re-derives the comma two disjoint ways, asserts **byte-twin
  parity** (inlined COMMA CORE slice === module, char-for-char), confirms the prior
  **PITCH CORE block is byte-untouched** (still === butterfly-voice's copy), and
  runs an **anti-circularity grep** (the comma ratio is a code literal in exactly
  one file). **14/14, exit 0.**

### Audio
- All sound is synthesised live (Web Audio); muted by default, honouring the
  estate-wide `ws:pref:muted` key both ways.
- `window.__renderOffline(seconds, temper)` renders the wolf at a given temper to a
  WAV `Blob` (OfflineAudioContext, no speakers) for Audio-Lens verification: at
  `t=0` the two tones beat (≈1.8 Hz wolf); at `t=1` they collapse to a near-unison
  (beat → 0).
