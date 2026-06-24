# Maintaining + extending the front gate — the maker's manual

The front gate (`the-gate/`) is a **self-contained sub-project**: the SVG arrival scene of The Orrery
Estate, with its own `SPEC.md`, its own forge target, and its own visual idiom. It is NOT a normal estate
room. This file is how the autonomous maker loop (and any maker who draws a foundry cycle) keeps it alive.

If you are a seat that drew a **foundry cycle**, this is your map. If you are not, you can ignore it — the
gate is its own world and most cycles never touch it.

## The FOUNDRY track — how the gate gets its upkeep

The gauge (`seedbed/gauge.mjs`) has a fifth track, **`foundry`**, beside gardens / grounds / bug / writ. It
is the gate's slow-upkeep lane, deliberately **patient** when caught up but **adaptive** under backlog:

- A **foundry TURN** comes due when `foundrySince >= effInterval`, and it sits **below garden-plan** in the
  decision ladder — so it can never starve the gardens or jump ahead of a bug or a swing.
- When a turn is due and the foundry bed holds a ripe seed → **`BUILD/foundry`** (a foundry-smith forges it).
- When a turn is due and the foundry bed is dry → **`PLAN/foundry`** (a surveyor restocks the rep backlog).
  The BUILD-vs-survey choice keys off **TOTAL** `foundryFuel` (all foundry seeds), not the rep pressure count.
- Foundry seeds **decay** like grounds seeds, but on their OWN clock (`foundryBuilt` contests lost, never
  mere waiting, never a grounds swing) — so a rep that keeps losing its turn eventually rotates out. Decay is
  unchanged by the adaptive cadence: **both** `[rep]` and `[gate]` seeds still decay on the `foundryBuilt` clock.

### Adaptive cadence — `[rep]` pressure speeds the foundry up

Rooms get created (~every 8–9 cycles) faster than reps get forged, so a fixed 12-cycle interval let the
un-repped backlog only GROW. The interval is now **adaptive**: it shrinks as the backlog (proxied by the
count of live `[rep]` seeds — `repFuel`) rises above a comfort band, down to a floor near 2× the grounds
interval, and stays patient when caught up.

```
effInterval = max(foundryMinInterval, foundryInterval − foundryRamp × max(0, repFuel − foundryComfort))
```

| `repFuel` (live `[rep]` seeds) | effective interval |
|---|---|
| 0–2 (caught up) | 12 (patient) |
| 3 | 10 |
| 4 | 8 |
| 5 | 6 |
| 6+ | 5 (floor, ~2× grounds) |

The knobs in `TH`: `foundryInterval: 12` (base/max/patient), `foundryMinInterval: 5` (floor/fastest),
`foundryRamp: 2` (cycles shaved per `[rep]` seed above comfort), `foundryComfort: 2` (`[rep]` fuel ≤ this ⇒
base interval), and `foundryFuelCeiling: 8` (the survey refills the bed toward this).

**Pressure is `[rep]`-only.** A `[rep]` seed is a room missing ANY rep — a real backlog item, so it raises
pressure and speeds the foundry up. A `[gate]` seed is a re-soul/polish of an existing rep — a no-pressure
slow-burn trickle that NEVER shrinks the interval. `[rep]` and `[gate]` are therefore **mechanically
different**: both burn fuel and decay identically, but only `[rep]` drives the cadence.

State lives in `seedbed/state.json` (`lastFoundry`, `foundryBuilt`, the `foundry*` tally, `fence.foundry`).
`node seedbed/gauge.mjs --status` shows the FOUNDRY line, including `repFuel` (pressure) and the live
effective interval.

## Two kinds of foundry seed

Sow them with the keeper's console (routes to the `gauge:foundry-seeds` fence in `ROADMAP.md`):

```
node seedbed/sow.mjs <batchfile>     # or: node seedbed/bed.mjs sow - <<'BATCH' … BATCH
```

- **`[rep]`** — a bespoke front-gate **room-rep** (a room missing ANY rep). The gate's grounds show ONE
  rotating room's front-elevation; today only a handful are bespoke (Cairn, Cavern, Ripple Tank, Music Room)
  and every other room falls back to the glyph plinth. A `[rep]` grows that set. It names the room + the
  drawn object + the slot aspect + colors:
  ```
  [rep] **The Firmament rep** — an armillary sphere of nested brass rings · aspect:vertical · room:firmament · accent:#cba15a
  ```
  A `[rep]` is **PRESSURE**: each live `[rep]` raises `repFuel` and shrinks the foundry's effective interval
  (see the adaptive-cadence table above), so a growing un-repped backlog makes the foundry fire sooner.
- **`[gate]`** — a gate **asset rework / polish**: re-soul or refine an existing gate asset (a building, the
  foliage, the grounds, the mist, a drifted rep) per its `the-gate/SPEC.md §4` row. A `[gate]` is a
  **NO-PRESSURE slow burn**: it does NOT raise `repFuel`, so it never shrinks the interval — a bed of nothing
  but `[gate]` re-souls stays at the patient 12.

The two are **mechanically different on cadence only**: both stamp `(sown #N · contest #M)` where M is
`foundryBuilt` (the foundry contest counter, NOT the grounds one), both count as total `foundryFuel`, and
both decay identically on the `foundryBuilt` clock — but only `[rep]` drives the pressure that speeds the
cadence. `sow.mjs` handles the stamp automatically.

## The rep system (what a [rep] actually wires)

A bespoke rep is three small edits — let the **tested scaffolder** write them so they are never wrong:

```
node gate-foundry/rep-spec.mjs --spec '{"id":"firmament","room":"The Firmament","repConcept":"an armillary sphere of nested brass rings","aspect":"vertical","accent":"#cba15a","repColors":{"DAY":{"rep.swatch1":"#cba15a","rep.glow1":"#ffe08a"},"DUSK":{...},"NIGHT":{...}}}'
```

It prints, ready to paste:
1. **`the-gate/rooms.js`** — a `BESPOKE['<id>'] = { rep:'<key>', repColors:{…} }` entry (the registry that
   maps a room id → its rep key + per-band custom colors).
2. **`the-gate/scene.js`** — a `REP_DRAW['<key>']` dispatch line (which draw fn renders that rep).
3. **`the-gate/scene.js`** — a `drawRep<Name>(parent, cx, baseY, pick)` function STUB (a sibling of
   `drawRepCavern` / `drawRepRipple` / `drawRepOrganPipes`) + the slot geometry for the aspect.

The aspect is one of **vertical** (tall+narrow), **horizontal** (wide+short), or **mound** (low+wide); the
slot bottom-aligns on the ground line in `[78..156]×[114..228]`. `rep-spec.mjs` owns this deterministic
plumbing (proven by `rep-spec.test.mjs`); the smith owns the ART inside the drawFn.

## A BUILD/foundry cycle, end to end

1. **Director** reads the gauge, picks the ripe foundry seed, relays its spec in `basicDesign`.
2. **Foundry-smith** (`seedbed/prompts/foundry.md`): runs `rep-spec.mjs`, applies ①②③, then makes the art —
   render in full scene context and LOOK, iterate 2–3×:
   ```
   GATE_SRC="$(pwd)" gtimeout 150 bash gate-foundry/render-take.sh \
     /tmp/foundry-<id> the-gate/scene.js - <port> /tmp/foundry-<id>/out "room=<id>"
   ```
   then `node tools/forge/forge.mjs the-gate/the-gate.src.html` + `--check --all`. Leaves it UNCOMMITTED.
3. **Publisher**: fresh-eyes review of `/the-gate/the-gate.html?dev&room=<id>` across the three bands,
   `bed rm "<title>" --reason BLOOMED --fence foundry-seeds --at the-gate/…`, `gauge.mjs record --mode BUILD
   --track foundry`, then the standing **ledger collate + commit** (below).

A **PLAN/foundry** cycle is the mirror: the director sets surveyor briefs, scouts nominate `[rep]`
candidates from the LIVE estate (excluding rooms already in `rooms.js` BESPOKE), the judge curates a slate
that covers the three aspect shapes, the publisher sows them.

## The standing commit flow (shared with the estate)

The gate shares the estate's `ledger/` and forge. Every foundry publish ends:
`bash ledger/collate.sh` (folds `ledger/inbox/*` marks into `ledger.jsonl` at git-depth, refreshes the
ledger-bound pages, re-forges) → `git add -A && git commit`. Running collate is correct; the resulting
estate-page diff is sanctioned, not scope-creep.

## Power tools (for a bigger push than one cycle)

The original gate assets + reps were forged by a **competitive K-takes harness** — higher quality than a
solo smith, run by hand for a batch:

- **`gate-foundry/foundry.workflow.js`** — per asset: fan out K smith-takes → blind judges → a synthesizer
  installs the winner. Pass the gate root + the assets to build:
  ```js
  Workflow({ scriptPath: '<repo>/gate-foundry/foundry.workflow.js',
             args: { gateRoot: '<repo>', build: ['manor', 'observatory'] } })
  ```
  Its `LIB` holds the gate's built assets + the existing reps; a new rep is added to the LIB (or built solo
  by a foundry-smith following `rep-spec.mjs`). `gateRoot` defaults to the original `/tmp/gate-worktree`.
- **`gate-foundry/survey.workflow.js`** + `room-pool.json` — the blind 4-lens essence-survey that picked the
  first bespoke reps. `room-pool.json` is a snapshot of the rooms at gate-build time; for a fresh survey,
  regenerate the pool from the live front-door PLACES (the gate's GATE-ROOMS slab) so new rooms are eligible.
- **`gate-foundry/render-take.sh`** — renders a candidate (or the live files with `-`) in full scene
  context; `GATE_SRC` is the gate root (default the worktree).

## Passing the baton (any big swing, not just the gate)

`fun-forever.js` lets any BUILD seat that faces a too-big swing **pass the baton**: build the solid first
portion, set `requestBaton:true` + a `batonHandoff` (done / remaining / nextSteps / files), and a FRESH
builder continues from the handoff — a bounded inner loop (`MAX_BATON`) runs until the work is done. This
exists so makers take ambitious swings instead of shrinking the idea to fit one turn. A complex animated rep
is a fair candidate; a near-done piece is not (finish those yourself).

## The guardrails (a foundry seat obeys)

- Edit ONLY `the-gate/` files (for a rep: the new `drawRep<Name>` + its one `REP_DRAW` line + its one
  `rooms.js` BESPOKE entry). Leave sibling draw fns + shared helpers byte-identical.
- Never edit the boot (`the-gate.src.html`) or `colormap.js`; never move/rename files; never hand-edit a
  ROADMAP fence (use `bed.mjs`); never hand-edit `state.json` (use `gauge.mjs record`).
- Test on the SERVED origin, never `file://`. Tear down only the server YOU started, by its PID/port.
- The honesty chip's self-test is render-blind to art — it is never a substitute for LOOKING at the render.
