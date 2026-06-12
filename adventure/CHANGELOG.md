# Lantern — Changelog

*An engine for interactive, stateful adventures (point-and-click · inventory · locks/keys ·
light/dark). A new medium for the workshop, distinct from Threshold's read-only atmosphere. The
foundation: a declarative **world-file** format so a new tale is authored as pure data + prose, never
engine code. See `ADVENTURE.SPEC.md` for the contract.*

---

## Build 3 — The Night Shift, a HIDDEN tale (2026-06-12)

**Shipped:** the third tale — and the first **hidden** one. It lives in the Undercroft
(`undercroft/the-night-shift.html`), not on the public shelf: the shelf stays at two tales on
purpose, and the only doors to this one are below. (Unlock trail + verification detail live in
`undercroft/CHANGELOG.md` Build 9 — earned by playing both public tales to their endings.)

### The tale — *The Night Shift*
Five rooms (hall · arcade · garden · soundgarden · undercroft), accent `#a9b8d8` (moon-silver). You
are the keeper of THIS workshop — the one with the nine doors — walking the last round after
closing. Three wings have not gone to sleep: the arcade's last cabinet still burns, a fern droops
unwatered under its dome, the great bell hums on. Play the game home, water the fern, hear the bell
out — the chained stair unbars, and you go down to keep *The Night Watch*. **Solver-confirmed:
winnable, shortest path 11 moves, softlock-free, deterministic; self-test 5/5.** The gentlest world
of the three: nothing is consumable at all — every gate is a monotonic flag, the can is never spent.

### Engine: 5 new scene-art entries (cosmetic registry content; `LANTERN_VERSION` stays 1.0)
- `hall` — the long hall in perspective: nine dark door-shapes receding (helper `hallDoors`), the
  coat-peg + can silhouette, the chained stair-opening at the far end; **state-responsive:** once
  `arcade-rested` + `garden-rested` + `bell-rested` are all set, the chain drops aside and a faint
  accent glow rises in the opening.
- `arcade-night` — the dark cabinet row, one screen burning (accent glow + a tiny ship), the
  loaf-cat on top; **state:** `arcade-rested` → screen dark, cat stays.
- `garden-night` — three glass domes, the nearest holding a drooped fern of bowed arc-fronds
  (helper `fernFronds`); **state:** `garden-rested` → the earth band darkens, two fronds take a
  faint accent shine.
- `sound-night` — hung instrument silhouettes, the great bell at the back with concentric accent
  hum-rings; **state:** `bell-rested` → the rings are gone, the bell at rest.
- `below` — worn steps converging down into the dark, a faint warm glow waiting at the bottom.

No core/model/solver changes — scenes + two string-builder helpers (`hallDoors`, `fernFronds`) only.

### Files
- `worlds/the-night-shift.js` — the authored world-file (solver-verified before the build).
- `undercroft/the-night-shift.src.html` — the chrome (copied from the ferryman's; tints re-keyed to
  moon-silver; `forge:include` paths reach `../adventure/…` — forge resolves relative to the src
  file). A hidden piece carries a **single** back-link, `← the undercroft` — never the public shelf.
- Built with `node tools/forge/forge.mjs --all`; `--check --all` clean (all three tales current).
- `assets/the-night-shift.png` — a 1440×900 mid-play capture (an asset, not navigation; the shelf
  does not link the tale).

## Build 2 — The Ferryman (2026-06-12)

**Shipped:** the second tale — written to a deliberately *different shape* than The Lamplighter, to
prove the format's range — and the first tale shipped end-to-end through the **forge** pipeline.

### The tale — *The Ferryman*
Three rooms (bank · willow · shrine), accent `#79b4b0` (river-teal). A river with no far side, a
hooded ferryman, and a toll to be found: talk to learn the fare, read the cut tablet, turn the grey
stone for the iron key, unlock the offering-box for the old coin, and give the coin to the ferryman —
*The Far Shore*. **Solver-confirmed: winnable, shortest path 9 moves, softlock-free, deterministic;
self-test 5/5.**

**The different shape it proves** (none of which the first tale used): an **NPC with `talk`** (the
ferryman's line changes once you hold the coin), **`useOn` as *give*** (the coin on the ferryman is
the winning act), a **reveal-under-stone** (a `move` effect summons the key from `_gone`), and a
**locked container** (key → box → coin chain). Nothing is consumed except the coin, and the coin only
into the win — softlock-freedom by construction.

### Engine: 3 new scene-art entries (cosmetic registry content; `LANTERN_VERSION` stays 1.0)
- `bank` — the black river band with a faint accent shimmer, reeds at the near edge, the low flat
  boat + hooded ferryman with his pole as dark silhouettes.
- `willow` — a curtain of thin curved strands (a few accent threads stirring), the flat grey stone at
  its foot; **state-responsive:** flag `stone-turned` tips the stone aside over the bare hollow.
- `shrine` — the broken pale arch, the cut tablet, the iron-bound offering-box; **state-responsive:**
  flag `box-open` tips the lid back and lights a faint accent glow inside.

No core/model/solver changes — scenes + two string-builder helpers (`reeds`, `willowStrands`) only.

### Files
- `worlds/the-ferryman.js` — the authored world-file (solver-verified before the build).
- `the-ferryman.src.html` — the chrome template (copied from the lamplighter's; accent tints re-keyed
  to river-teal; win card *The Far Shore* ☾).
- `the-ferryman.html` — the shipped, self-contained artifact, **built by forge** (banner-stamped,
  engine v1.0 inlined, zero external refs).
- `the-lamplighter.html` — **re-forged** (the engine grew 3 scenes, so its inlined engine block
  changed; chrome untouched). `node tools/forge/forge.mjs --all` rebuilt both;
  `forge.mjs --check --all` clean.
- `index.html` — the shelf now holds both tales (the ferryman with its teal accent cue + river thumb).
- `assets/the-ferryman.png` — a 1440×900 mid-play capture.

### Verification
- **Node:** `the-ferryman` 5/5 (9-move path) · `the-lamplighter` 5/5 (16) · `_template` 5/5 (3).
- **Browser QA** (served origin `http://localhost:8979`, agent-browser): chip green **5/5 ✓ · solved
  in 9**; in-page `runSelfTest` == Node; **0 console errors/warnings** across load, a full hand-played
  win, and auto-play; **played to the win via real clicks** (both `talk` branches heard; the boat's
  `enter` barred line shown before paying; the stone-turned and box-open scene flips observed);
  **"▶ Let it play" ran to the win on its own**; crumbs `ws:seen:the-ferryman` (load) +
  `ws:flag:the-ferryman-won` (win) set. **Regression:** the lamplighter chip green 5/5 · 16,
  auto-play to *Dawn*, 0 errors. Landing: both tales shelved, links resolve, 0 errors.

### Wiring
- Workbench Lantern card + README Lantern bullet now read "Tales so far: The Lamplighter · The
  Ferryman."

---

## Build 1 — the foundation (2026-06-12)

**Shipped (Fable session):** the engine, the authoring format, the verifiable crux, the player
interface + auto-player, and the first authored tale.

### Files
- `ADVENTURE.SPEC.md` — the contract: the world-file DSL (rooms / things / verbs / guards / effects),
  the solver/self-test crux, the player-function interface + auto-player (the bot foundation), the
  shipped-artifact chrome conventions, an author's voice guide, and the deferred `forge` inliner.
- `engine/lantern.js` (1237 lines) — the canonical engine. `LANTERN_VERSION = '1.0'`. A pure, DOM-free
  core (`initState · legalActions · apply · isWin · stateKey`) + the **solver** (`solve` — BFS) + the
  self-test (`runSelfTest`) + the **players** (`solverPlayer · randomPlayer · describeForAgent · llmPlayer`
  stub) + the browser UI (scene-art registry, prose panel, exits, inventory tray, context action bar),
  which mounts only when `document` + `WORLD` + `#lantern-root` exist. Node-requireable for headless
  proving.
- `worlds/the-lamplighter.js` — the exemplar tale (6 rooms, authored prose).
- `worlds/_template.js` — a minimal starter world authors copy.
- `the-lamplighter.html` (1783 lines) — the self-contained shipped tale (engine + world inlined +
  chrome). Double-click and play; no build, no network, no dependencies.
- `the-lamplighter.src.html` — an inlining template (`__LANTERN_ENGINE__` / `__LANTERN_WORLD__`
  placeholders) so re-inlining the canonical engine/world into the shipped `.html` stays idempotent —
  a step toward the spec's §7 `forge`. (The shipped `.html` is fully self-contained regardless.)
- `index.html` — "The Lantern" landing: what it is, the shelf of tales (one so far), "author your own".
- `assets/the-lamplighter.png` — a 1440×900 mid-play thumb.

### The verifiable crux (workshop tradition) — story made provable
Every Lantern tale is **provably winnable AND provably softlock-free.** The headless solver:
1. **Winnable** — BFS over canonical state-keys finds a winning state; reports the **shortest path**.
2. **Reachable map** — every room reachable; static validation that every id (exit `to`, thing `at`,
   guard/effect/useOn referent) names a real room/thing/flag.
3. **No softlock** — *reverse-reachability:* compute the set of states from which a win is reachable
   (reverse the action graph, BFS back from every winning state), then assert **every reachable state
   is in it.** No sequence of legal actions can strand the player. (Opt-out: `world.allowSoftlock`.)
4. **Determinism** — `apply` is pure (no time, no RNG in the core).
5. **Effects total** — every DSL feature a world uses is one the engine implements (no silent no-ops).

The self-test runs identically in Node and the browser (browser == Node).

### The bot foundation (the cleanest possible surface)
A player is just `(state, legalActions, world) → action`. Ships `solverPlayer` (replays the BFS path —
drives the **"▶ Let it play"** auto-player), `randomPlayer(seedFn)` (seeded wanderer), and
`describeForAgent(state)` (a plain-text state digest) + an `llmPlayer` documented stub so a future
agent wires a real model in a small, well-defined job. (Enables, later: human-vs-bot / bot-vs-bot /
"let the bot finish it if you're stuck.")

### The first tale — *The Lamplighter*
Six rooms (lodge · shed · cellar · lane · square · hill). Dusk has come with no lamps lit, and the
morning waits on the round: find oil (pry the swollen cellar hatch), flame (the lodge hearth), then
light the lamps lowest-to-highest — lane, square, and last the beacon on the hill — to call the dawn.
**Solver-confirmed: winnable, shortest path 16 moves, softlock-free, deterministic; self-test 5/5.**

### Verification
- **Node solver:** `the-lamplighter` 5/5 (winnable · 16-move path · softlock-free · deterministic ·
  6/6 rooms reachable · 0 errors); `_template` 5/5 (3-move win). *The solver caught a real
  unwinnability bug in the first `_template` draft (the win flag was never set) — the crux earning its
  keep — fixed with one declarative line (`onEnter:{do:[{win:true}]}` on the exit room).*
- **Browser QA** (served origin `http://localhost:8975`, agent-browser): chip green **5/5 · solved in
  16**; in-page `runSelfTest` == Node; **0 console errors/warnings/page-errors** across load + full
  play + auto-play; **played to the win via real clicks** (barred exits showed their blocked reasons
  before their gates opened); **the auto-player ran to the win on its own** (incl. from a restored
  save — resets to a fresh start first); landing clean, links resolve, `ws:` breadcrumbs set.
- **Two engine robustness fixes during QA:** `solverPlayer` returns `null` on a desynced replay
  (stops cleanly instead of applying an illegal move); `letItPlay` resets to `initState` before
  replaying (the solved path is absolute from the start).

### Wiring
- Added to the **Workbench index** in a new **Tales** group (`workbench/index.html`) — *not* a new
  front-door card. Front door deliberately unchanged. *(Front-runner for the 10th front-door card once
  the shelf has 2–3 tales — the "bigger swing" growth axis.)*
- README "Also on the workbench" entry.
- `ws:` breadcrumbs: `ws:seen:the-lamplighter` (on load), `ws:flag:the-lamplighter-won` (on win,
  raise-only), `ws:save:the-lamplighter` (autosave), `ws:seen:lantern` (landing). Left for the hidden
  world; an Undercroft trophy off these is a trivial future add.

### Not done (future — see ADVENTURE.SPEC.md §7)
The `forge` build-inliner (remove engine duplication across tales); more tales; a wired `llmPlayer`;
bespoke per-world scene art; an Undercroft trophy off the win crumb.
