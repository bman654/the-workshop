# The Reversing-Room — The Loom of Hours — CHANGELOG

The Arrow Wing's first room. A hand CRANK (not a play button) winds a small
deterministic elastic-billiards world FORWARD on axis-aligned lanes — discs
scatter, every collision a knot tied onto a worldline thread woven below — and
BACK, every collision un-happening in exact reverse order until the discs
re-gather at the start pose, bit-for-bit. **Reverse here is a proven law, not a
saved tape.**

## #181 (2026-06-19) — opened the room (the Arrow Wing's first leaf)

**Built** (BUILD / grounds — a big swing: a new front-door MANOR wing).

### Files
- `core.mjs` (~300 lines) — the SOLE reversibility authority. Axis-aligned-lanes
  billiards over **BigInt-rational** arithmetic (every contact time a ratio of
  integers, so the math stays exact forever). Exports a deterministic
  `step(state, e)` + an **ANALYTIC** `unstep(state)` that un-resolves the
  just-happened collision (elastic resolve is self-inverse) then flips → drifts
  → flips backward. `unstep` stores **ZERO positions** — it is NOT a tape, NOT a
  stored-frame buffer, NOT a bare `flip∘step∘flip`. Restitution `e<1` is the
  irreversible friction path (the neg-control). Also exports
  `flip/clone/key/startPose/buildWorldline/momentum/energy2`. Every public symbol
  uses a per-declaration `export` so the forge inliner can drop the source into
  the page byte-faithfully.
- `core.test.mjs` (~140 lines) — Node twin, **16/16 PASS**. Proves:
  `forward∘reverse=identity` BIT-EXACT (string-equal BigInt rationals, not ε);
  `unstep(fwd[k])=fwd[k−1]` per rung; energy invariant at EVERY event both
  directions; momentum invariant across every PAIR collision (walls scoped as
  external); the mutual-inverse pair `unstep(step s)=s` & `step(unstep s)=s`;
  frame-buffer DEFEAT (re-derive a never-recorded state from both ends + a
  mid-fork future, zero saved frames); friction neg-control FAILS to recover s₀
  AND strictly drains energy.
- `index.src.html` → forged `index.html` — the Loom instrument: a gripped brass
  crank, the billiards table sold honestly as **lanes** (faint grid) with colored
  discs + start-pose ghosts, the weave below with shuttle / knots / fray /
  entropy-stains, controls (run · step · unstep · home · mark-&-fork · reset ·
  friction), energy (½Σv²) + pair-|p| gauges. The ENTIRE stripped `core.mjs` is
  present in `index.html` as one contiguous byte-twin block, so the page cannot
  drift from the proof. In-page 9-check self-test pill: **ALL GREEN — "reverse is
  a proven law, not a tape."**

### The crux (why it is honest)
- `forward∘reverse=identity` is asserted on **string-equal BigInt rationals**,
  not an ε tolerance — bit-exact, not "close".
- `unstep` is asserted to match an **independent forward re-derivation** — proving
  it computes the inverse from the law, not by replaying a recorded tape.
- The design's literal `step(flip(s_t))===s_{t−1}` is **deliberately NOT asserted
  as a bare equation**: in this event-driven engine a flipped post-collision
  state sits AT an approaching `dt=0` contact that a strictly-future `step` cannot
  re-fire, so the bare form is genuinely false. The T-symmetry it intends is
  captured truthfully by the mutual-inverse pair (`unstep∘step=id`,
  `step∘unstep=id`) + per-rung `unstep(fwd[k])=fwd[k−1]`, all green.
- **NEG-CONTROL:** friction (`e<1`) makes `forward∘reverse` FAIL to recover s₀ AND
  strictly drains energy — reversibility is a falsifiable property, and that
  failure is the door to a future thermodynamics piece.

### Honest scope
The table is axis-aligned lanes: equal-mass discs on shared rows/columns, every
collision a 1-D elastic exchange. A free-angle disc collision would need a √ and
break bit-exactness — it is never done. **Energy** is the clean invariant
(exactly conserved at every event, both directions). **Momentum** is conserved
across every pair collision; a wall is external (reverses one component), so the
`|p|` gauge tracks pair-momentum, not a wall hit.

### Registration (front door)
- `index.src.html` — one `PLACES` entry (`id=reversing-room`, `district:'manor'`,
  `tier:2`, `wing:'arrow'` (NEW), `footprint:'loom'`, glyph ⟲, accent `#c9a24a`,
  tag "time you crank home", companion The Clockwork Automata) + a new
  `drawLoom()` footprint drawer (loom-in-plan: warp beams, warp threads, a beaded
  worldline with one frayed knot, a shuttle bar, a spoked crank wheel + ⟲
  engraving) registered in the DRAW table; wired sky star + `ws:seen:` crumb.
- `tools/layout/layout.js` — `arrow:{label:'THE ARROW WING', accent:'#c9a24a'}`
  added to `WING_META`.

### Reusable engine
`core.mjs` registers a sole-authority `step`/`unstep` over rational/integer
collision arithmetic — import it for ANY future reversible piece (the Arrow Wing
is left open for a sibling: determinism / memory / arrow-of-time kin).

### Verification (publisher fresh-eyes, #181)
Node twin 16/16; in-page pill ALL GREEN; byte-twin of the stripped core verified
inside `index.html`. Live in a real browser: stepping forward ties pair-knots
with ½Σv² held exactly at 47.50; HOME re-gathers to instant 0 with energy back to
47.50; friction ON drains 47.50 → 5.00 and the knots FRAY (won't retie) on the
reverse crank. Zero horizontal overflow @1280 (1265===1265) AND @390 (375); zero
nested anchors on the room page and the front door. Front-door POI placed under
"THE ARROW WING" (href `reversing-room/index.html`), glyph ⟲ present, companion
cross-link to The Clockwork Automata. forge `--check --all` 46/46 current; layout
smoke exit 0; sky 73/73; legibility 19/19. No bug, no polish needed.
