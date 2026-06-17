# The Warren — the estate's second game engine

The **Warren** is the estate's second game engine, a sibling to the **Lantern**
(`adventure/`). Where Lantern's verb is *carry a thing / set a flag*, the Warren's
verb is **where you stand**: you move on a discrete grid in a strict turn economy —
you act, **then** the monster steps once by its fixed deterministic rule — and you
win by reaching the exit without ever sharing a hazard tile with the monster.

Like Lantern, it ships as a DOM-free, Node-requireable **engine core** plus pure-data
**floors**; a future maker adds a floor by writing **only data**, never engine code.

## What shipped (floor I — `the-crossing`)

- **`engine/warren.js`** — the canonical engine. Three layers in one DOM-free source
  (the `module.exports` guard is stripped when inlined into a page per
  ADVENTURE.SPEC §5):
  - **Pure model** — `initState` / `cloneState` / `legalActions` (with `wait` ALWAYS
    legal — totality) / `apply` (player steps, **then** monster steps; anti-swap edge
    check; caught only on a shared hazard tile) / `isWin` / `stateKey` over
    `(x, y, phase mod period)`. The monster is a pure function `patrolAt(floor, phase)`.
  - **Solver** — `solve(floor)` = BFS over canonical keys → survivable + **shortest**
    survivable path; a determinism spot-check; totality; **and a no-softlock
    reverse-reachability pass** (every reachable *live* state can still reach the exit).
    `solverPlayer(floor, fromState)` solves from a **live** state, so the in-page hint
    and "let the solver walk it" continue from wherever the player is standing — not
    from a fresh reset.
- **`floors/the-crossing.json`** — the shipped floor as pure data. A patrol that walks
  a corridor longer than the player can see (it vanishes *off-stage* behind the left
  wall — its path covers cols 1–7 but the player only ever reaches cols 4–7). Tuned to
  start-phase 2 so the shortest survivable path spends **4 teaching waits** at the mouth.
- **`floors/the-pincer.json`** — the **load-bearing negative control**: a period-1
  sentry that tiles the only crossing every turn → proved **UNSURVIVABLE**, so it would
  be rejected, never shipped. An honest control, not a scary-looking fake.
- **`the-crossing.html`** — the playable landing page: inlines the engine + both floors,
  a tiled lit board, on-screen d-pad with **WAIT dead-center** (the verb), WASD/arrow +
  Space keyboard, reset, a live-state **hint**, "let the solver walk it" (from the live
  state), the negative-control toggle, and a green **verified N/N · safe path 15** pill.
- **`warren.test.mjs`** — the headless Node twin: requires the same engine + floor data
  and proves survivable (path length 15, 4 load-bearing waits, greedy no-wait dies),
  the negative control unsurvivable, determinism, totality, no-softlock, and that
  `solverPlayer` finishes from a mid-run live state.

## The floor schema

```
{ id, name, w, h,
  grid: [strings of '#' wall / '.' floor],
  start: [x,y], exit: [x,y],
  hazards: [[x,y]...],     // tiles lethal ONLY while a patrol stands on them
  patrol: { path:[[x,y]...], start:phaseIndex, mode:'pingpong'|'loop' },
  meta?:  { accent, caption } }   // optional renderer theming; ignored by the core
```

**`stateKey` MUST include the patrol phase** (mod its period). If a future floor adds a
step-budget / timer or a stateful tile, the key MUST grow to include that too, or BFS
dedupes two genuinely-different worlds as one.

**No-softlock convention.** The patrol `path` may cover tiles the player can never stand
on (a wall to the player) — the monster walks off-stage behind the wall, lengthening its
beat. Only tiles that are **both floor and in `hazards`** can catch the player. Keep
every player-reachable floor tile on (or safely off) the forced path so no reachable
live state is stranded — the solver's reverse-reachability pass **rejects** a floor that
softlocks (this is the one discipline grafted from the pressure-plate explorer; the patrol
explorer lacked it).

## Documented future benches (NOT built — the Warren's next floors)

The shipped slice is **one floor, one patrol monster** — like the Lamplighter shipped
Lantern with one world. The natural next floors, deferred:

1. **Floor II — the reactive chaser.** A monster whose rule is *take one step along a
   shortest path toward the player* (not a fixed patrol). It reacts, so the timing puzzle
   becomes a pursuit; the parity `wait` becomes load-bearing in a new way (you sometimes
   wait to make the chaser commit). The engine's `solverPlayer(floor, fromState)` —
   "solve from RIGHT HERE" — is already in place for its hint. **Engine change:** the
   monster step must be allowed to depend on the player's position (today `patrolAt`
   depends only on phase); add a `monster.rule:'chase'` branch that reads `s`. The
   `stateKey` already includes `(x,y)` so no new key dimension is needed for a
   memoryless chaser.

2. **Floor III — the pressure-plate / gate floor.** Stateful tiles: stepping on a plate
   opens a gate (hold or latch). **Engine change:** extend the state with gate flags and
   **add those flags to `stateKey`** (or BFS will conflate gate-open and gate-shut worlds).
   The reverse-reachability no-softlock check already in the solver becomes essential here
   (a latch you can trip into an unwinnable configuration is exactly a softlock to catch).

3. **Multi-patrol floors.** Today a floor carries one `patrol`. A `patrols:[...]` array
   (each a pure function of phase) would let a floor pose two gates to time at once. The
   `stateKey` already keys on a single phase; multi-patrol needs the key to carry each
   patrol's phase (they may differ in period). Deferred until a floor wants it.
