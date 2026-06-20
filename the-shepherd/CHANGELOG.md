# The Shepherd — CHANGELOG

## #204 — planted (herd a living flock into the fold)

A playable herding game in The Arcade's amusements wing (grounds · tier-1). You cannot *push* a
flock — you can only choose where your **dog** stands. A scatter of sheep run on the three Reynolds
boids rules (separation / alignment / cohesion) and additionally **flee one shepherd point**: a
working dog you steer, which has weight and a top speed and chases your cursor on a critically-damped
spring. Drive every sheep through the gate into the brass **fold** before the glass runs out, across
a three-round arc. The same three rules, passive, breathe the murmuration in the Strange Garden's
Boids — reciprocal cross-links tie the sim ↔ the game.

The game is the point; underneath it runs a quiet decidable conscience — two claims a Node twin
(`core.test.mjs`, 33 checks, fixed seed, exit 0) proves byte-true against the SAME engine the page
inlines (`core.mjs`, sealed between `// === CORE BEGIN/END ===` sentinels; the watched flock IS the
tested flock — verified by an inline byte-parity check, kin to The Wrinkling).

### CLAIM 1 — min pairwise sheep separation NEVER reaches 0 (no two sheep overlap, ever)
Not a hope about a soft force — a **guarantee** of the integration scheme. A hard-floor separation
**positional projection** pushes any pair within `CONTACT = 2·RADIUS` back apart to exactly contact
(half each), every step, over all pairs (uniform spatial hash). A projection is a *constraint, not a
force* — unconditionally stable, it cannot be outrun by any flee strength. A per-step `MAX_SPEED`
clamp (< CONTACT) forbids tunnelling, so no pair can cross the contact band unseen. The HONEST bound
is **floor > 0** with the steady-state ≈ contact (the flock packs tight) — not "always exactly
contact": a transient under an adversarial press dips below contact but never to 0. The twin asserts
`minPairSep > 0` at every step over multiple fixed-seed runs — including **with flee ON inside the
fenced gap**, and **pinned into a fence corner** where three constraints converge.

### CLAIM 2 — WIN latches EXACTLY iff every sheep is inside the fold polygon
`pointInPolygon` is a robust crossing-number ray-cast, concave-safe, with an explicit on-edge test
(a sheep touching the rim is folded). `allInFold` is a pure AND. The **latch is decidable**: when
`countInFold === N` while in PLAY, the gate latches and the state becomes WIN — `WIN === allInFold`,
nothing else; no timer race, no "close enough". A **one-way valve** in the engine keeps a folded
sheep counted (it can't wander back out through the rim), so the count is monotone and the latch,
once true, stays true. The twin proves no false win, no missed win, the valve, and the overtime edge
(the last-sheep grace window never manufactures a win the predicate disagrees with) — incl. the
concave chevron + on-edge cases.

### NEG-CONTROL — Separation OFF (the falsifiable proof, on screen)
A toggle disables BOTH the separation steering AND the hard-floor projection. Cohesion + flee then
collapse the whole flock to a single point: `minPairSep → 0`. The live pill's claim-1 dot flips red,
the running minimum dives to 0, a red collapse-ring pulses on the stacked flock — proving separation
is what keeps them a herd, not a blob. The pill keys claim-1 on BOTH `separationOn` AND the live min
sep, so the neg-control genuinely flips it.

### The three-round arc (one engine, three reads of "flow")
- **R1 · Open Pasture** (12 sheep, 75s) — a clean herd into a square fold; learn the dog's weight.
- **R2 · The Gap** (14 sheep, 70s) — a stone wall bisects the pasture with a single gap; sheep can
  ONLY pass the gap (fence wall-reflection), then into the fold. Thread them.
- **R3 · The Strays** (16 sheep, 65s) — a detached cluster to re-merge first, into a CONCAVE chevron
  fold (which stresses the point-in-polygon). One generous 3s last-sheep overtime (a single bool).

### Form & feel (facet-2 render spec)
Dark-manor palette (#080a0f, Georgia title + ui-monospace labels), radial-gradient pasture + quiet
64px grid. Woolly sheep (body ellipse + contact shadow + highlight + heading wedge) coloured
calm→brass→panic by a render-only **asymmetric-EMA fear** field (fast rise so panic wakes, slow decay
so the colour lingers) with a single capped 'lighter' bloom at high fear. The dog: a dark core + ink
rim + brass pip, a soft pressure halo and a dashed amber reach ring (= `FLEE_RANGE`, a felt edge, not
a wall). The fold: a brass double-stroke rim warming with pen-progress, two gold gate-posts + an
open-invite glow, and a gold latch bar that sweeps shut over ~0.45s ending in a white glint — fired
by the engine's WIN, not the draw loop. Unified pointer (mouse · touch · pen) sets the dog's target;
arrows/WASD drive a virtual cursor; last input wins. A single rAF owns dt and steps the engine at a
FIXED substep from an accumulator, so determinism holds (the dog spring is per-step, not dt-based).
~60 fps; readable at 390px with no horizontal scroll.

### Front-door footprint
Registered as a PLACES entry `{ id:'the-shepherd', district:'grounds', tier:1, wing:'amusements',
footprint:'fold' }` (re-forged from `index.src.html`, never hand-edited) — a new `fold` footprint art
(a sheep pen with a gate gap, woolly dots inside, the dog pressing from outside). A sky star
`the-shepherd` @ (1130,430), the lead member of a new **The Drover** feat-group (*"Never pushes the
flock; only chooses where to stand."*). The page drops `ws:seen:the-shepherd`. Reciprocal cross-link
to `strange-garden/pieces/boids.html` (the passive sim ↔ the steered game).

### Also fixed (a pre-existing live map bug, root cause)
`refraction-run` (#201) declared `footprint:'tank'` but no `tank` entry existed in the front-door
`DRAW` table, so `DRAW['tank']` was undefined — `buildPoi` threw on it and **aborted the entire POI
render after the first 15 of 43 rooms**, hiding most of the map (arcade, midway, the whole amusements
wing, and this new room would never have rendered). Added a `drawTank` footprint (a glass optics tank
with strata + a curved least-time ray to a gold focus). All 43 POIs now render.

### Verification
Node twin 33/33 green, exit 0 (incl. byte-parity, the fenced-gap + fence-corner floor, the dog
spring's determinism/top-speed/no-overshoot, the one-way valve, the overtime edge). In-browser
(served on an uncommon port, torn down by exact PID + named session): 0 console errors, playable, won
by herding (all 12 folded, gate latched), neg-control collapses the flock + flips the pill red, three
rounds render (gap fence + concave fold), ~60 fps, 390px no h-scroll. Repo gates: `forge --check`
(50 current), `--audit-seen --strict` (43 pages), sky 73/73, smoke exit 0 — all green.
