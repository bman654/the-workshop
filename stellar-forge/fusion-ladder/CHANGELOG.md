# The Fusion Ladder — changelog

## Cycle 157 — bench bloomed (garden)

**THE FUSION LADDER — The Nuclear Valley.** The companion bench to The Scales of a Star's
Death, working the *other* end of a star's life: the binding-energy curve a star spends its
life climbing into. Drawn as an inverted **valley** so the most-bound nucleus is the lowest
point — the floor you fall to. The floor is the iron group, and the floor is why the Scales'
implosion begins.

### The form — `index.html` (one DOM-free `<canvas>`)
- A smooth filled **trough** drawn FROM `depth(i)` (data → geometry): H high on the near rim,
  down through the alpha chain (He, C, O, Ne, Mg, Si, S, Ca) to the **floor** at Fe-56 / Ni-62,
  then the doomed up-wall past iron (Zn, Ge). The trough SHAPE is the claim — steep early
  plunge (H→He is the deepest single drop), shallowing to the floor, gentle up-slope past iron.
- Each rung is a glowing **nucleus tile** notched into the wall. A luminous **marble/ember**
  rests in the current rung, lit from within, with an ember trail on a downhill roll.
- A vertical brass **bank reservoir** up the right side: level === cumulative `bank(rung)` in
  MeV per 56-nucleon parcel, drawn straight from the core. Each exothermic IGNITE raises the
  molten line; a rising heat-plume carries the `rungYield` number up into the bank.
- **IGNITE** (brass lever / Enter / arrow keys): the marble rolls down to the next deeper
  notch on an eased arc, `rungYield(i)` MeV pours off as a plume. A **free-fall to iron**
  toggle auto-cascades to the floor (suppressed under reduced-motion).
- **THE IRON BEAT** (unmistakable): at the floor the headline turns — *"You have reached the
  bottom of the valley. Iron. There is no lower place to fuse to."* IGNITE now arms the UPHILL
  rung; pressing it once strains the marble up the far wall, the rung goes cold-blue, a COLD
  draft (a downward, sinking plume) draws `|rungYield(PEAK)|` MeV back OUT, the bank drops, and
  the furnace **LOCKS**: *"the ladder has no more energy to give."* This is the
  `freeFusionPastIron` neg-control made physical — the cost you SEE before the wall. Reset
  re-lifts the marble to hydrogen.

### The math crux — `core.mjs` + `core.test.mjs`
- DOM-free, zero-dep ESM. `PARCEL = 56` (the fixed nucleon parcel that makes
  `sign(Q) === sign(ΔB/A)` true BY CONSTRUCTION — NOT a total-binding Q, which would not flip
  sign at iron; the alpha-capture trap). `LADDER` of `{sym, A, ba}` rungs; `PEAK = argmax(B/A)`
  computed, not hard-coded; `rungYield`, `depth`, `bank`, `freeFusionPastIron`, `signFlipIndex`.
- The claim is the **STRUCTURE**, not a knife-edge number: sign-flip at the iron group,
  monotone-then-falling bank. Ni-62 is the engraved true max (B/A ≈ 8.795); Fe-56 (≈ 8.790) is
  the cultural iron peak. The engraving names BOTH with an "≈" so neither is oversold.
- Inlined byte-for-byte into `index.html` between the FUSION-LADDER CORE sentinels; the Node
  twin byte-parity-checks the page copy against `core.mjs`.
- Node twin (`node core.test.mjs`): runs the page's 5-claim self-test (all green) PLUS
  independent re-derivations — per-rung yield sign sweep, argmax === Ni-62, Fe-56 the sub-iron
  max, bank monotone up-then-down, the `yield === Δbank` conservation identity, the
  ANTISYMMETRY guard (climb-down un-banks the climb-up), `signFlipIndex() === PEAK`, domain
  guards (RangeError on out-of-range / non-integer i), and the `freeFusionPastIron` neg-control
  that banks past iron and provably DISAGREES in sign at and beyond the floor.

### The wing
- `../index.html` (the Stellar Forge landing): the **next-growth** card became a live
  `a.card` (amber `--hue:#e0a24f` — the iron-fire pole vs the Scales' blue); kind
  `bench · self-proved`; blurb names the valley/floor/iron-beat and `rungYield`'s sign-flip with
  the `freeFusionPastIron` neg-control. Breadcrumb `ws:seen:fusion-ladder` drops on visit.
- Cross-link to `../scales/index.html` (the iron floor that stalls this ladder is the implosion
  the Scales begins) + the Forge back-link.
