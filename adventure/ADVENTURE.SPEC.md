# 🏮 Lantern — a small engine for hand-made adventures

*A foundation, not a one-off. The workshop has read-only atmosphere (**Threshold**) and verse
(**The Oracle**) — but no place you can pick a thing up, carry it, and **change the world with it**.
Lantern is that place: a tiny, self-contained engine for **interactive, stateful adventures** —
point-and-click, inventory, locks and keys, light and dark — and, crucially, a **declarative
authoring format** so a future agent ships a whole new tale by writing only a **world-file** (pure
data, the prose), never engine code.*

> **The promise (the workshop's verifiable-crux tradition, applied to story):** every Lantern tale
> is **provably winnable — and provably *softlock-free***. A headless solver re-derives a winning
> path before the tale ever ships, and proves that from **every** state you can reach, the win is
> *still* reachable. You can wander, fumble, and experiment freely: the dawn is always still ahead
> of you. (This is the interactive-fiction analog of Latch's "provably solvable by pure logic.")

This file is the **contract**. The engine implements exactly the DSL below; a world-file is authored
to exactly the DSL below; the solver verifies the world against it. Keep them in agreement.

---

## 1. What ships

```
adventure/
  index.html              ← "The Lantern" landing: what it is, the shelf of tales, "author your own → here"
  the-lamplighter.html    ← the first tale — a self-contained artifact (engine + world inlined). Double-click and play.
  engine/lantern.js        ← THE ENGINE (canonical source). Pure interpreter + solver + players + renderer + self-test.
  worlds/the-lamplighter.js← THE WORLD-FILE (canonical source). Pure declarative data — the thing you copy to make a new tale.
  worlds/_template.js      ← a minimal, commented starter world.
  ADVENTURE.SPEC.md        ← this contract.
  CHANGELOG.md
tools/
  forge/forge.mjs          ← the build-inliner (§7): <tale>.src.html + sources → self-contained <tale>.html.
  forge/README.md          ← forge's own docs.
adventure/
  the-lamplighter.src.html ← the authoring template (chrome + forge:include directives); forge emits the .html.
```

**Self-contained, like every workshop piece.** A shipped tale (`the-lamplighter.html`) is one HTML
file: the engine + that world inlined, no network, no dependencies, double-clickable. "Self-contained"
is a property of the **shipped artifact**, not the process. The `engine/` and `worlds/` source files
are the **canonical, readable source of truth** an author edits; the shipped HTML is their inlined
combination, produced **author-side** by `forge` (§7) from a `<tale>.src.html` template. The engine
thus lives in exactly one canonical place and is inlined into each tale — never forked per tale —
while visitors still open one dependency-free file.

**Engine versioning to prevent drift:** `engine/lantern.js` declares `const LANTERN_VERSION = 'x.y'`.
A shipped tale stamps the version it inlined; the spec's intent is that re-inlining the current engine
into any tale is a no-op change apart from the engine block. Don't fork the engine per tale.

---

## 2. The world-file (the authoring format)

A world-file assigns one global, `WORLD` (or `export const WORLD` in the source module). It is **pure
data** — no functions required, no engine knowledge required. The engine interprets it.

```js
const WORLD = {
  meta: {
    id:      'the-lamplighter',          // lower-kebab; the ws: breadcrumb id and the <title>
    title:   'The Lamplighter',
    byline:  'a Lantern tale',
    accent:  '#f3b94d',                  // the tale's signature colour (lamp-flame amber here)
    intro:   'Dusk, and not one lamp lit. …',   // shown on the title card, before "Begin"
  },
  start: 'lodge',                        // starting room id
  win:   { flag: 'dawn', title: 'Dawn', text: 'Far off, the first lamp of morning answers yours. …' },

  rooms: { /* see §2.1 */ },
  things: { /* see §2.2 */ },
};
```

### 2.1 Rooms

```js
rooms: {
  lodge: {
    name: 'The Lamplighter’s Lodge',
    art:  'lodge',                       // key into the engine's scene-art registry (§5). Unknown → a neutral panel.
    desc: ['First-visit prose, long.',   // desc may be a string, OR a [firstVisit, everyAfter] pair.
           'Return prose, shorter.'],
    onEnter: { if:{flag:'dawn'}, say:'The room is gold with morning now.', once:true },  // optional; fires on entering
    exits: {
      out:  { to:'lane',  if:{flag:'lantern-lit'}, blocked:'Past the doorstep the dark is total. You would only stumble. Your lantern is cold.' },
      back: { to:'shed' },
      down: { to:'cellar', if:{flag:'cellar-open'}, blocked:'The cellar hatch is stuck fast.' },
    },
  },
  // …
}
```

- **`exits`** is `{ direction: { to, if?, blocked? } }`. `direction` is any label (`out`, `north`,
  `up`, `down`, `the dark lane`…). If `if` is absent the exit is always open. If `if` fails the exit
  is shown as **barred** with its `blocked` line (still visible, so the player knows it exists). An
  exit with no `to` for an unreachable target is an **authoring error** the solver rejects.
- **`desc`**: string, or `[firstVisitText, subsequentText]`. The engine tracks first-visit itself.
- **`onEnter`** (optional): `{ if?, do?, say?, once? }` — an event that fires when the player enters
  (after movement). Use sparingly (a discovered body, a slammed door). `once:true` fires only the
  first qualifying entry.

### 2.2 Things

```js
things: {
  lantern: {
    name: 'the brass lantern',
    at:   'lodge',                       // initial location: a roomId | 'inv' | '_gone'
    portable: true,                      // may be carried (affects which verbs apply where; default false)
    verbs: {
      look: 'Cold to the touch, the wick dry as a bone. It only wants oil and a flame.',
      take: { do:[{take:'lantern'}], say:'You take the lantern. It has been yours for forty years.' },
      light:{ if:{flag:'wick-oiled', at:'lodge'},
              do:[{flag:'lantern-lit'}],
              say:'You touch the wick to the hearth’s last coal. It catches, and breathes, and holds.',
              else:'The wick is dry, or there is no flame near. The hearth in the lodge still glows.' },
    },
    useOn: {                             // "Use lantern on X" — keyed by target thing id
      // (none here; see oil/door below)
    },
  },
  // …
}
```

- **`at`**: initial location — a `roomId`, `'inv'` (starts carried), or `'_gone'` (not yet in play).
- **`portable`**: whether `take` is offered / the thing can live in inventory. Default `false`
  (scenery). A `take` verb implies portability.
- **`verbs`**: `{ verbName: handler }`. A handler is **a string** (pure narration — the common case,
  e.g. `look`) **or an object** `{ if?, do?, say?, else?, once?, then?, where? }`:
  - `if` — a **guard** (§2.3). If it fails, show `else` and apply nothing.
  - `do` — an ordered list of **effects** (§2.4). Applied only when the guard passes.
  - `say` — narration shown when the verb fires (guard passed).
  - `else` — narration when the guard fails (no effects).
  - `once` — apply `do` only the first successful time (idempotent; the engine sets a private flag).
    On later uses show `then` (or `say` if `then` absent), apply nothing.
  - `where` — `'room' | 'inv' | 'either'`: where the verb is offered. Default: `take`→`'room'`,
    everything else → `'either'`.
- **`useOn`**: `{ targetThingId: handler }` — surfaces a two-object action **"Use ‹thing› on ‹target›"**
  when both are in scope (the thing in inventory, the target in the room or inventory). The handler is
  the same `{ if?, do?, say?, else?, once?, then? }` shape. This is how keys meet locks and oil meets
  wicks.

The **canonical verb vocabulary** (so the action bar reads consistently): `look · take · use · open ·
unlock · pull · push · light · read · turn · enter · talk`. Any string is a legal verb; the UI
title-cases it. `look` is implicit on every thing (a thing with no `look` gets a default "Nothing more
to see."). Prefer the canonical set; coin a new verb only when it earns its keep.

### 2.3 Guards (`if`)

A guard is an object; **all** clauses must hold (logical AND). Array values mean "all of these".

| Clause | Holds when |
|---|---|
| `has: 'x'` / `['x','y']` | the item(s) are in inventory |
| `lacks: 'x'` / `[…]` | none of the item(s) are in inventory |
| `flag: 'f'` / `[…]` | the flag(s) are set |
| `noflag: 'f'` / `[…]` | none of the flag(s) are set |
| `at: 'room'` | the player is in that room |
| `thingAt: ['x','room']` | thing `x` is currently in `room` (`'inv'`/`'_gone'` allowed) |

Need OR? Author it as two verbs/handlers, or split the flag. The DSL stays AND-only on purpose —
it keeps worlds **analyzable** (the solver enumerates them exactly).

### 2.4 Effects (`do`) — applied in order

| Effect | Does |
|---|---|
| `{take:'x'}` | move thing `x` into inventory (from wherever it is) |
| `{drop:'x'}` | move thing `x` into the current room |
| `{move:['x','dest']}` | move thing `x` to `dest` (a roomId, `'inv'`, or `'_gone'`) |
| `{gone:'x'}` | remove thing `x` from play (consume it) — sugar for `{move:['x','_gone']}` |
| `{flag:'f'}` | set flag `f` |
| `{unflag:'f'}` | clear flag `f` |
| `{goto:'room'}` | move the player to `room` (teleport/fall; normal travel is via exits) |
| `{win:true}` | set the win flag named in `WORLD.win.flag` and end the tale |

Movement between rooms is via **exits**, not effects — keep it that way so the map stays legible.
`goto` is for the rare scripted displacement.

---

## 3. The verifiable crux — the solver (the engine's self-test)

The engine ships a **pure, DOM-free core** — `legalActions(state)`, `apply(state, action)`,
`isWin(state)` — and over it a **breadth-first solver** that is the single source of truth for both the
self-test and the auto-player.

**State** = `{ room, place: {thingId→location}, flags: Set, firstSeen: Set, moves }`, fully
serialisable. **Canonical key** = `room | sorted(place entries that differ from default) | sorted(flags)`
— so BFS dedupes correctly and the space stays bounded for a hand-sized world.

The self-test (green chip **"Lantern verified — N/N ✓ · solved in K moves"**, never ships red) asserts:

1. **Winnable.** BFS from `start` finds a state with the win flag. Reports the **shortest path** (the
   move list) — printed in the test log and used by the auto-player.
2. **Reachable map.** Every room is reachable from `start`; every declared exit `to` names a real
   room; every thing's `at` names a real room (or `inv`/`_gone`); every `useOn`/guard/effect references
   a real thing/flag id. (Static + reachability checks — catches typos and orphans.)
3. **No softlock.** Compute the set of states from which the win is reachable (reverse-reachability
   over the action graph); assert **every reachable state is in it.** I.e. there is no sequence of legal
   actions that strands the player. *This is the strong promise.* If a world deliberately wants a
   one-way trap, it must be marked (see below) — by default, a softlock is a **test failure**, not a
   feature.
4. **Determinism.** `apply` is pure: same state + same action → identical next state (no time, no RNG
   in the core). The renderer may animate; the model may not drift.
5. **Effects are total.** Every effect/guard clause the world uses is one the engine implements (no
   silent no-ops) — i.e. the world uses no DSL the engine doesn't honour.

The **same test bodies run headless under Node** and in the browser; the browser chip count must equal
the Node count. (Workshop tradition: browser == Node.)

> **Marking an intended trap (rare):** a world may set `WORLD.allowSoftlock = true` to opt out of
> check 3 — but then it must instead pass a weaker check (every *reachable* state either reaches the
> win or reaches an explicit `dead` ending). Default tales leave this off and stay fully recoverable.

---

## 4. The player interface — and the auto-player (the bot foundation)

Because the action space is finite and the model is pure, **a player is just a function**:

```js
//  player(state, legalActions, world) -> action        (one of legalActions)
```

The engine ships two, and documents a third:

- **`solverPlayer`** — replays the BFS shortest path. Drives the **"▶ Let it play"** button: the
  engine plays the tale to its end, move by move, at a gentle pace, the prose narrating as a ghost
  hand lights the lamps. This is the "it solves itself" demo — and the cleanest possible debut of an
  AI/scripted player in the workshop. *(It doubles as a "show me the solution" affordance, and as the
  Dev-SIG-talk centrepiece: the AI builds a little world, then watches itself walk it home.)*
- **`randomPlayer(seed)`** — a seeded legal-move wanderer (for fuzzing / "drunk ghost" flavour). Uses a
  seeded PRNG passed in; **no `Math.random` in the core** (determinism).
- **`llmPlayer` (documented stub, not wired):** the same signature. A future agent can implement
  `chooseAction(state, legalActions, world)` by handing the model a compact text rendering of the
  state + the legal actions and parsing back a choice. The engine exposes `describeForAgent(state)`
  (a plain-text state digest) precisely so this is a small, well-defined wiring job — **the bot
  foundation Brandon asked for, scoped down to its cleanest possible surface.** Enables, later:
  human-vs-bot or bot-vs-bot in multiplayer worlds, or "let the bot finish it if you're stuck."

Keep `legalActions`/`apply`/`describeForAgent` stable: they are the **public API** every future player
(and every future tale) leans on.

---

## 5. The shipped artifact — chrome & conventions

A tale's HTML follows the workshop house style:

- **Self-contained**, zero-dep, zero-network, double-clickable. Engine + world inlined.
- **Dark, lantern-lit aesthetic.** A **scene panel** (SVG/CSS art for the current room, drawn in the
  tale's accent), a **prose panel** (room desc + the latest event line), an **exits row** (open =
  bright, barred = dim with its blocked reason on hover/click), an **inventory tray**, and a
  **context action bar** (click a thing → its applicable verbs appear → click a verb → it fires). Mobile
  -friendly, keyboard-navigable. Honour `prefers-reduced-motion`.
- **Scene art registry:** the engine maps each room's `art` key to a small procedural SVG/CSS scene
  (a few evocative shapes in the accent + greys — not literal illustration; the workshop's restrained
  hand). Unknown key → a calm neutral panel with the room name. New rooms can ship with `art:'_neutral'`
  and look intentional. *(Art is the engine's, so a new world gets a look for free; a world may later
  supply its own scene snippets.)*
- **The green self-test chip** in the corner (`Lantern verified — N/N ✓ · solved in K`), exactly the
  workshop convention. Never red.
- **A `← workshop` back-link** (and tales link back to **the Lantern** landing).
- **The `ws:` breadcrumb** (see `/UNLOCK.md`): on load, `ws:seen:<meta.id>`; on reaching the win,
  `ws:flag:<meta.id>-won` (raise-only, try/caught). Leaves footprints for the hidden world; depends on
  nothing. *(A future Undercroft trophy — e.g. "finish a tale without the auto-player" — is then a
  trivial add. Don't build it here; just drop the crumb.)*
- **Save/restore:** the current state autosaves to `localStorage` under `ws:save:<meta.id>` so a
  visitor can leave and return. A "start over" control clears it. (Honesty: a "forget" that clears only
  that key.)

---

## 6. Author a new tale (the whole point)

1. Copy `worlds/_template.js` → `worlds/<your-id>.js`. Write your world to §2 — rooms, things, verbs,
   guards, effects. **You write only data and prose. No engine code.**
2. Run the solver (Node or the in-page self-test) until it's green: **winnable, reachable, no softlock,
   deterministic.** The solver is your proof-reader — it will tell you if you stranded the player or
   left an orphan. Fix the world, not the engine.
3. Write `<your-id>.src.html` (copy `the-lamplighter.src.html`; swap the world include to
   `<!-- forge:include worlds/<your-id>.js -->`, and set the accent + title). Run
   `node tools/forge/forge.mjs adventure/<your-id>.src.html` to emit the self-contained
   `<your-id>.html` (engine + world inlined). `node tools/forge/forge.mjs --check <file.src.html>`
   tells you if a shipped file has gone stale.
4. Add the tale to the shelf in `adventure/index.html`. (Standalone tales live under `adventure/`; the
   Lantern landing is their shelf. They are **not** new front-door cards — see NOTES.md.)
5. Browse-test on a **served origin** (not `file://` — the `ws:` crumbs need a real origin; see
   `/UNLOCK.md`): plays to a win, auto-player runs, chip green, 0 console errors.

### Voice guide (so the tales feel of a piece)

- **Second person, present tense, spare.** "You take the lantern." Not "The player picks up the lantern."
- **One quiet heart per tale.** Threshold's lesson: a strange place wandered toward a single still
  centre. Lantern adds *agency* — you don't just witness the heart, you *cause* it (light the dawn,
  still the clock, open the last door). End on stillness, not fanfare.
- **Prose the seed only *arranges* — but here, prose the author *writes*.** Every line is hand-written.
  The engine never generates text; it only chooses which of your lines to show. So write them well.
- **Few objects, each earning its place.** A hand-sized world (6–10 rooms, 6–12 things) beats a sprawl.
  Every portable thing should *do* something; every locked thing should have its key findable.
- **Make the puzzle honest.** Guard-and-effect chains should read as physical sense (oil then flame;
  pry the stuck hatch; light your way before the dark lane). The solver guarantees it's *possible*;
  your craft makes it *fair* — drop the hint (a ledger, a notice, a remembered habit) in reach.

---

## 7. Shipped & future

- **`forge` — the build-time inliner (SHIPPED: `tools/forge/forge.mjs`).** A tiny zero-dependency Node
  ESM script (only `node:fs`/`node:path`): a `<tale>.src.html` carries `<!-- forge:include engine/lantern.js -->`
  + `<!-- forge:include worlds/<id>.js -->` (each `<relpath>` resolves relative to the .src.html's own
  directory), and `forge` replaces each directive with the file's contents — stripping the dual-use
  `module.exports` guard + any leading `export ` from included `.js` — to emit the self-contained
  `<tale>.html` (banner-stamped with the engine version). This removes engine duplication across tales
  (one canonical engine, inlined at build) **while keeping the shipped artifact exactly as
  self-contained as ever** — the build is author-time only; visitors still open one dependency-free
  file. Modes: build named files, `--all [root]` (recursive), `--check` (diff vs on-disk `.html`,
  exit 1 on drift). This is the "code-sharing between specimens" enabler, done without betraying the
  workshop's no-runtime-deps ethos. See `tools/forge/README.md`.
- **More tales.** A clock that must be stilled; a house that must be left; a tide that must be turned.
  Each is a world-file. The engine doesn't change.
- **`llmPlayer` wired** (§4) — a real model driving a tale; then a 2-player or human+bot world.
- **A world's own scene art** — a tale may ship bespoke SVG scenes instead of the engine's defaults.
- **An Undercroft trophy** off the `ws:flag:<id>-won` crumbs (§5).

---

*Lantern is a foundation: the engine and the proof are written once; the tales are written forever.*
