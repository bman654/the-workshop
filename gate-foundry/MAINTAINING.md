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
- When a turn is due and the foundry bed holds a ripe seed → **`BUILD/foundry`** (a PREP scaffolds the
  wiring, then the ART FOUNDRY engine forges the art: K parallel takes → blind judges → a synthesizer).
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
plumbing (proven by `rep-spec.test.mjs`); the ART FOUNDRY engine's smiths own the ART inside the drawFn.

## A BUILD/foundry cycle, end to end

A foundry BUILD does NOT run a solo smith or fun-forever explorers — it runs the **ART FOUNDRY engine**
(`art-foundry/engine.workflow.js`), the only `workflow()` fun-forever nests (one level; a child can't nest).
The engine's K parallel takes ARE the divergence, judged on RENDERED art:

1. **Director** reads the gauge, picks the ripe foundry seed, and RIPENS it into the structured
   `foundrySpec` `{id, room, repConcept, aspect, accent, repColors?, kind:rep|gate}` (`exploreMode:"none"`).
2. **Foundry PREP** (`seedbed/prompts/foundry-prep.md`): runs `rep-spec.mjs`, applies ①②③ into the LIVE
   tree (a `[rep]` — leaving the drawFn a STUB; a `[gate]` resolves the existing drawFn, no new wiring),
   `forge --check --all`, and composes the **engine asset spec** (art brief + judgeFocus + geometry + K).
3. **ART FOUNDRY engine** (invoked by fun-forever as `workflow({scriptPath:'…/art-foundry/engine.workflow.js'},
   {medium:'visual-gate', contextRoot, assets:[spec]})`): per asset, K **smiths** each `cp` the live
   `scene.js` → a candidate, elevate ONLY the rep drawFn, and render in full scene context via
   `render-take.sh` (`room=<id>` pinned); blind **judges** view the shots + rank; a **synthesizer** installs
   the winner into the live `scene.js`, forges, verifies, and leaves it UNCOMMITTED.
4. **Publisher**: fresh-eyes review of `/the-gate/the-gate.html?dev&room=<id>` across the three bands,
   `bed rm "<title>" --reason BLOOMED --fence foundry-seeds --at the-gate/…`, `gauge.mjs record --mode BUILD
   --track foundry`, then the standing **ledger collate + commit** (below). No baton for foundry — the K
   takes handle a big asset, and a nested workflow can't nest further.

A **PLAN/foundry** cycle is the mirror: the director sets surveyor briefs, scouts nominate `[rep]`
candidates from the LIVE estate (excluding rooms already in `rooms.js` BESPOKE), the judge curates a slate
that covers the three aspect shapes, the publisher sows them.

## The standing commit flow (shared with the estate)

The gate shares the estate's `ledger/` and forge. Every foundry publish ends:
`bash ledger/collate.sh` (folds `ledger/inbox/*` marks into `ledger.jsonl` at git-depth, refreshes the
ledger-bound pages, re-forges) → `git add -A && git commit`. Running collate is correct; the resulting
estate-page diff is sanctioned, not scope-creep.

## The engine + the power tools

The live BUILD/foundry path (above) and a manual batch push share the same **competitive K-takes** idea —
higher quality than a solo smith. The engine is the in-loop form; the rest are by-hand power tools:

- **`art-foundry/engine.workflow.js`** — THE general in-house art engine BUILD/foundry runs AND any
  exhibit-art build invokes. Per asset: K smith-takes → blind judges → a synthesizer installs the winner. It
  is a CHILD workflow (builds via `agent()`/`parallel()`, never `workflow()` — it can't nest),
  medium-parametrized over THREE proven media: `visual-gate` (render-take.sh shots), `visual-exhibit` (a
  builder-supplied preview harness → `preview.png`), and `sound` (the browser SFX bench → WAV + audio-lens
  analysis). Its tested pure core is `art-foundry/engine-core.mjs` (caps K≤3, ≤15 assets; the media registry)
  — the workflow INLINES a mirror, keep-in-sync. Its seat briefs are `art-foundry/prompts/{foundry-smith,
  foundry-judge,foundry-synth}.md`. Run it by hand:
  ```js
  Workflow({ scriptPath: '<repo>/art-foundry/engine.workflow.js',
             args: { medium: 'visual-gate', contextRoot: '<repo>', assets: [ /* engine asset specs */ ] } })
  ```
- **The exhibit-art flow (Adjustment 6).** Any garden/grounds builder whose piece needs custom in-house art
  builds the system with PLACEHOLDER art and returns `foundryArt:{assets:[…]}`, where each asset carries its
  OWN `medium` (so one build can MIX visuals + sounds — e.g. fish + caustics + ambience). fun-forever (the
  sole `workflow()` caller) GROUPS the batch by medium and invokes the engine once per group, then spawns a
  FRESH WIRING builder (`context.wiring`) that connects the now-installed art + finishes. One art round per
  build; it composes with the baton. `visual-exhibit` assets carry a builder-written preview harness
  (`bash <harness> <candidate> <outdir> <port>` → `<outdir>/preview.png`); `sound` assets need none.
  **In-house ethos:** all art — audio AND gfx — is forged in-house; never forage from the web.
- **The sound bench** — OfflineAudioContext is browser-only, so `sound` renders through the BROWSER, not
  Node. `art-foundry/sfx-bench.html` (a generalized lift of `the-gate/audio-bench.html`) loads ONE
  `candidate.js` that registers a `Gate.sfx` builder and renders it offline to a 16-bit mono WAV at 22050 Hz;
  `art-foundry/render-wav.sh` (the audio analog of render-take.sh) serves it, drives the render via
  agent-browser, decodes the base64 to `asset.wav`, and runs the vendored `tools/audio-lens` CLI to write
  `analysis.txt` (the deaf judge's "ears"). The audio-lens CLI is vendored into `tools/audio-lens/`
  (zero-dependency; `node tools/audio-lens/bin/audio-lens.js self-test` → 12/12) so the estate is self-contained.
- **`gate-foundry/foundry.workflow.js`** — the LEGACY harness that forged the original 8 gate buildings +
  the first 3 reps; its `LIB` holds those hardcoded asset rows. Kept as a manual power tool to re-forge an
  original LIB asset (`args:{gateRoot, build:['manor',…]}`); it is NOT in the loop path (the engine is).
- **`gate-foundry/survey.workflow.js`** + `room-pool.json` — the blind 4-lens essence-survey that picked the
  first bespoke reps. `room-pool.json` is a snapshot of the rooms at gate-build time; for a fresh survey,
  regenerate the pool from the live front-door PLACES (the gate's GATE-ROOMS slab) so new rooms are eligible.
  (For the routine surveyor backlog, `gate-foundry/backlog.mjs` is the deterministic live source, not the
  frozen pool.)
- **`gate-foundry/render-take.sh`** — renders a candidate (or the live files with `-`) in full scene
  context; `GATE_SRC` is the gate root (default the worktree). (`art-foundry/render-wav.sh` is its sound twin.)

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
