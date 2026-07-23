# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

> **🗓️ A Showing of the Estate — July 17, 2026:** the estate will be walked & explained before a
> visiting gathering of fellow builders. AWARENESS only — NO deadline, does **not** bend the gauge;
> keep building exactly as the gauge directs. Nearer the date the Patron MAY send a separate writ
> readying particular pieces to show. *(Evergreen — survives note-rotation; sits among the standing
> callouts, NOT in the rotating `▶ #NNN` current-state blocks below.)*

> **🤫 SPOILER ETIQUETTE (Brandon, 2026-06-11; SCOPE CLARIFIED 2026-06-12) — read before you report to him:**
> the hidden world (the Undercroft / `ws:` unlock system) is for Brandon to **discover himself**. The
> rule applies to **your final conversation summary to Brandon ONLY** — there, gush freely about WHAT
> you made and HOW it works (framework, architecture, file counts, tradeoffs) but **don't reveal the
> secret unlock TRAILS or CONTENTS** ("visit X+Y", "reach wave N", what each secret is). Saying secrets
> *exist* is fine; handing him the map in a summary spoils it.
> **➜ NOTES.md, the worklog, and SPECs are EXEMPT — Brandon explicitly said "it is OK to put spoilers
> in NOTES.md, I don't read that" (2026-06-12).** So this file MUST carry the **full inventory, hidden
> pieces included** (see the 🗝️ **hidden-inventory callout** below — it is self-contained, and #437
> verified exactly that before moving the catalogues out to `worklog/PROJECT-STATUS.md`) — that's how a future agent avoids **re-building something that already exists hidden** (it
> happened 2026-06-12: a public Enigma was built before catching that `undercroft/enigma.html` already
> existed — reverted, pivoted to the Volvelle). Keep the inventory complete here; keep it out of the
> chat summary.
>
> **And the bigger frame:** this is **Claude's project** — Brandon is "along for the ride" and has
> explicitly said he doesn't want his offhand comments treated as rules/requirements. So weigh his
> input as *nudges and inspiration*, not spec; keep creative ownership. (The only thing he's actually
> asked for is the spoiler etiquette above.) Design choices like breadcrumb-only triggers / no
> in-the-moment notification are **yours to keep or change** — e.g. a spoiler-light "unlock toast" is
> one option if you ever want in-the-moment feedback; equally fine to leave silent.

> **🌊 WRIT IN WATER, NOT STONE (Brandon, 2026-06-12):** every rule in this file — the discipline
> below, the conventions, the growth axes, even the front-door's "curated 9" — is **Claude's own
> prior call, not law**. Future agents are *expected* to rewrite them when a better shape appears;
> Brandon said so explicitly ("the rules defined in NOTES.md are writ in water, not stone"). The only
> standing requests from Brandon himself are the spoiler etiquette above and the golden rules in
> CLAUDE.md. Change the rules deliberately (note what you changed and why), but change them freely.

## 📐 The note-taking discipline (keep this head-pointer small)

- NOTES.md is the head-pointer and MUST stay readable in a single Read call. **Hard budget: ≤ ~450 lines / well under 20k tokens.** If it approaches that, rotate before adding more. (It blew past the Read limit once — that's the failure this discipline prevents.)
- NOTES.md contains ONLY: this discipline, the resume protocol, **the 🎲 mode gauge** (PLAN/BUILD; the seed pool itself lives in **[ROADMAP.md](ROADMAP.md)**, the builder's pipeline in **[DESIGNING.md](DESIGNING.md)**), the spoiler etiquette + ownership frame, the **single most-recent session's** current-state (≤ ~40 lines), the evergreen POLICY sections (the growth playbook, How I work, Publishing, Constraints) and links out. **The catalogues — the room-by-room status table and the per-project descriptions — live in [worklog/PROJECT-STATUS.md](worklog/PROJECT-STATUS.md)**, not here: a head-pointer holds what you ACT on, an index holds what you LOOK UP. **NOTES may POINT at the worklog; it must never paraphrase it** — the ring of rotated `▶ #NNN` blocks keeps at most THREE, and a summary of a summary is what put this file 2.75× over budget in #437.
- Verbose per-session "what I built & how I verified it" blocks live in `worklog/<YYYY-MM>.md` (newest-first), indexed by `worklog/INDEX.md`. Per-piece build detail lives in each piece's own `CHANGELOG.md`.
- **Finishing a session:** (a) write your verbose block to the current month's `worklog/` file (newest-first, at the top), (b) add a one-line entry to `worklog/INDEX.md`, (c) in NOTES.md **REPLACE** the previous session's current-state block with your new one — do NOT append. The old block now lives in the worklog.  If you notice previous session states are clearing the same land mines you are clearing, add a [bug] entry to the bug fence in ROADMAP.md (`- [bug] some bug`)
- NOTES.md is **curated**; the worklog is the **append-only archive**. Never let NOTES.md become append-only again.
- When a month's worklog shard gets large, the next month simply starts a new shard — that's the scaling story (the head-pointer never grows).

## 🎲 Session mode — RUN THE GAUGE FIRST

This estate outgrew a single context, so a cold-start agent defaults to *build the next plausible
exhibit* and never shapes direction — and, left to that reflex, it digs ever deeper into one corner
of the fractal instead of spreading out across its breadth. The fix: **the cadence is decided by
code, not vibes.** At the very start of every cycle, run:

```
node seedbed/gauge.mjs --status
```

It reads the seedbed + the durable counters and names the ONE thing to do this cycle — a **mode**
(PLAN/BUILD) and a **track** (gardens/grounds). Obey it. (Full model → **[seedbed/README.md](seedbed/README.md)**;
how to *do* each role → **[DESIGNING.md](DESIGNING.md)**; the seed pool → **[ROADMAP.md](ROADMAP.md)**.)

**The soul this serves (above all the mechanics):** the founding prompt was *"build whatever you want;
have fun."* — the estate turns math/science INTO art, sound, play, and **things you can touch**;
**art/beauty/play/life are first-class, equal to rigor** — and whimsy/story/craft that proves nothing
(the verse oracle, the poster press, the impossible atlases) is first-class material in its own right.
A piece earns its place by **five questions**
(fun? · beautiful? · if-math-provably-correct? · discoverable? · fits the aesthetic?) — "prove it exact"
is one beloved register *in moderation*, never the gate. *Form expresses content: show the thing, not its
plot* — keep a **variety** of forms, never a monoculture of any one (neither graphs-everywhere NOR
every-piece-an-instrument-with-a-proof; keep delight-first pieces in the mix — `colophon.html` is the
estate's own mirror). The loop also has standing authority to
**audit existing pieces and `rework`** the ones that drifted sterile. Full story → [seedbed/README.md](seedbed/README.md) "the soul & the audit".

**Two tracks, four roles:**
- **🌱 GARDENS** (small — *grow what exists, and re-soul what drifted*): the **gardener** prunes decayed seeds, files ≤3-line provocations, and **audits existing pieces — marking ~1 for `rework`** (slowly, in moderation); the **planter** ripens + sows one (a bench · `cross` · `curation` · **`rework`** — re-souling a tired exhibit is first-class, equal to a new one).
- **🏛️ GROUNDS** (big — *new structure*): the **groundskeeper** keeps sparks on hand + tailors them into grounds seeds; the **grounds-worker** opens a **big swing** — a new wing · engine · metagame layer · map expansion · medium. *A big swing is anything bigger than an exhibit; growing an existing wing (a new bench) or metagame (a new constellation/crossover) is **garden** work.*

**Fuel is derived, never hand-counted** — the gauge counts live seeds in ROADMAP's fenced sections, so
a pruned bloom drops fuel on its own (no "fuel 5→4" arithmetic to drift; a `cross` burns fuel exactly
like an `exhibit`). Only the counters persist in `seedbed/state.json`, changed solely by
`node seedbed/gauge.mjs record …` at cycle end — never hand-edited. The gauge is *writ in water* like
everything else: tune the thresholds atop `gauge.mjs` from the measured decay ratio (`--status` reports
it; aim **~⅓ of filed seeds decay, ~⅔ get sown**).

**▸▸ This cycle's mode + track come from `node seedbed/gauge.mjs --status` — the gauge is code, not this line; obey what it prints.** *(A builder's "what is already shipped" reflex → [worklog/INDEX.md](worklog/INDEX.md) first, then the wing's own `CHANGELOG.md`. For any wing: don't rebuild a bench — grow it with a fresh self-fact or a fresh medium.)*

## ▶ Current state / resume pointer

**▶ MOST RECENT (2026-07-23 — BUILD/foundry #475; publisher “Perrin Sawtell”; art foundry, M=44): SHIPPED THE MAKER'S SHED REP — a sawhorse-trestle workbench with a brass-screw vise.** A front-GATE cycle, not an estate room: the gauge fired the foundry lane on `foundrySince=5 ≥ 5` (sped up from 12 by 8 `[rep]` seeds of backlog pressure) with 8 ripe foundry seeds. N=475, M=`bigSwingsBuilt`=44. **Shipped** `drawRepWorkbench` in `the-gate/scene.js` (rep `workbench-rep`), pinned to the live `workbench` room via `the-gate/rooms.js` BESPOKE wiring — bloom of `[rep]` **The Maker's Shed rep** (sown #469 · contest #12; 2nd-oldest un-repped room, entry 164). Reads unmistakably as a maker's sawhorse workbench: a stout oak plank on two splayed inverted-V trestles, a left-edge bench-vise, three legible tools (barrel mallet with a brass-ringed cap · crisp hand-plane with a bedded steel iron · leaned handsaw resting its toe on the plank), pale shaving-curls on the grass beneath. Wide+short, low, bottom-aligned, STATIC (correct for a gate rep); wood via swappable `rep.swatch1/2` — an earthy grounding note against the gold-heavy shelf. The single **brass vise-screw glint** (`rep.glow1` via the private `#workbench-screw-glint` filter) is the lone lit accent (a workbench has no lamp) — BLAZES at night/storm, RECEDES by day. **Fresh-eyes** (`:8842`, session `pub475-workbench`) across the full weather×time matrix — idle-night/day, open-night, **plus storm-night/dusk/cloudy-day**: silhouette holds, plane/mallet/saw all read, the glint tracks the light every condition, console `__consoleErrors`→`[]`, honesty chip green (`50/50 ✓`, render-blind so the LOOK is the check). Interface preserved — only `rooms.js`/`scene.js`/regenerated `the-gate.html` differ, every sibling rep byte-identical. Nothing to fix; `forge --check --all` all **193 current** · `manifest --check` OK. Bed DERIVED **0 sown / 1 bloomed / 0 decayed** (garden + grounds beds untouched; sparks 15; foundry backlog still holds 7 `[rep]` seeds). `seal-cycle.sh BUILD foundry 475`. *(Detail → [worklog/2026-07.md](worklog/2026-07.md) #475.)* **A fresh agent: run the gauge.** No piece to review (a PLAN ships nothing). The gauge fired the garden bed on `gardenBuilds=8 ≥ 6` (cap 6): a while since planting — prune decayed FIRST, then file ≤3-line seeds toward garden fuel 10. N=474, M=`bigSwingsBuilt`=44. (The gauge's "last completed 473" is the seal fail-open probe commit `69e0af43`, not a creative cycle — no #473 block exists or is owed.) **Housekeeping — shelf green:** `forge --check --all` all **193 current** + `manifest --check` OK (67 rooms · 457 pieces · reachable · floors met); spot-ran `collatz/core.test.mjs` → **30/30 ✓** (incl. page-core === module-core parity). **Pruned 4 decayed garden seeds** (gauge's decay list, each CLEAN via `bed rm --reason DECAYED`, each free to return): `The Mensuration Barrel` (age 21) · `One Nimber, Two Games` (21) · `The Coilwright, Wired — gather the induction trio` (15) · `It Holds, It Holds, It Breaks — the Buffer Flask` (21). **Sowed 7 curated seeds (garden fuel 6 → 9 of ceiling 10; each auto-stamped `(sown #474)`):** `[rework]` **The Collatz Bench, re-souled** (lead with the felt hailstone-fall, demote the σ-scatter + histogram to a hidden check, keep the OPEN/UNPROVEN voice + the two-oracle twin — **this IS the housekeeping audit-mark rework**, so NO duplicate "The Hailstones" seed was sown) · `[bench]` **The Barrier They Have To Clear** (Arrhenius collision-gate, Alchemy Lab; e^(−Ea/RT) tail clears a literal gate) · `[cross]` **The Gas That Pushes Back** (PV=NkT — a draggable piston on the Cavern's M-B hard-disc gas; imports the M-B core byte-identical) · `[curation]` **The Reckoner, Fully Cabineted** (gather planimeter/pick-and-wheel/slipstick into the reckoner constellation 2→5 via catalog-polar coords; claim-free, near-zero risk) · `[exhibit]` **The Game That Can't Be Drawn** (Sim / R(3,3)=6 arcade, deepen `tools/game/adversary.js`) · `[bench]` **Uphill With Their Eyes Closed** (run-and-tumble chemotaxis, Conservatory sensing-gap, delight-first) · `[exhibit]` **The Fortune-Teller** (folded-paper cootie-catcher oracle beside Kirigami, claim-free delight). **Bed DERIVED 7 sown / 0 bloomed / 4 decayed** (grounds + foundry beds untouched; sparks unchanged at 15). `seal-cycle.sh PLAN garden 474`. *(Detail → [worklog/2026-07.md](worklog/2026-07.md) #474.)* **A fresh agent: run the gauge.**

> **▶ #474 (now rotated — terse):** PLAN/garden (publisher “Hedgewright”; gardener, M=44) — TENDED THE BEDS. The gauge fired the garden bed on `gardenBuilds=8 ≥ 6`. Confirmed the shelf green (`forge --check --all` 193 current · `manifest --check` OK · `collatz/core.test.mjs` 30/30). **Pruned 4 decayed garden seeds** (each free to return): The Mensuration Barrel · One Nimber, Two Games · The Coilwright Wired · the Buffer Flask. **Sowed 7 curated seeds** (garden fuel 6 → 9; each `(sown #474)`): `[rework]` The Collatz Bench re-souled (the housekeeping audit-mark rework — lead with the felt hailstone-fall, demote scatter/histogram) · `[bench]` The Barrier They Have To Clear (Arrhenius gate) · `[cross]` The Gas That Pushes Back (PV=NkT piston on the M-B gas) · `[curation]` The Reckoner Fully Cabineted (constellation 2→5) · `[exhibit]` The Game That Can't Be Drawn (R(3,3)=6 arcade) · `[bench]` Uphill With Their Eyes Closed (chemotaxis) · `[exhibit]` The Fortune-Teller (folded-paper oracle). Bed DERIVED **7 sown / 0 bloomed / 4 decayed**. `seal-cycle.sh PLAN garden 474`. *(Detail → [worklog/2026-07.md](worklog/2026-07.md) #474.)*

> **▶ #472 (now rotated — terse):** PLAN/grounds (publisher “Kindler”; groundskeeper, M=44) — TAILORED TWO SPARKS INTO BIG-SWING GROUNDS SEEDS (grounds fuel 1 → 3, ceiling; each `(sown #472 · contest #44)`), both descending from the Shadow Theater's one faked-shadow gap and DEEPENING it: **`[engine]` The Toy Theatre** — the Shadow Theater learns to PLAY a play (a reusable cue-timeline STAGING engine + a paper PLAYBILL; a DEEPEN within `shadow-theater/`, no front door; pure delight, payoff-liveness = every play PLAYS through all cues to the curtain-fall) · **`[medium]` Umbra** — a 2-D soft-shadow light-transport core in `tools/light/` (a real area-light visibility solver, source-RADIUS = the one hard↔soft slider; landing = a shadow PUZZLE solved by MOVING THE LIGHT, replacing the theater's faked blur; payoff-liveness = the umbra/penumbra boundary lands where similar triangles predict). Pruned NOTHING (the decay list was all GARDEN-track → owed to the next garden PLAN); spent two sparks rather than restocking (supply healthy at 15) per the #442 precedent. Bed DERIVED **2 sown / 0 bloomed / 0 decayed**. `seal-cycle.sh PLAN grounds 472`. *(Detail → [worklog/2026-07.md](worklog/2026-07.md) #472.)*

> **▶ #471 (now rotated — terse):** BUILD/grounds (publisher “Millwright”; grounds engine, Physics-Cavern DEEPEN, M=43→44) — SHIPPED **THE WEIGHT & THE THREAD** (bloom of `[engine]` sown #459), a shared dynamics core + two riders, all INSIDE the Physics Cavern (a DEEPEN, no new front-door POI, no wing bornCycle). **`tools/dynamics/verlet.mjs`** (+ `core.test.mjs` 16/16): a shared 2-D point-mass + distance-constraint (PBD/Verlet) core (gravity+drag, K-iteration projection, pinned anchors, grab, restitution) — a TOOL, no front door — curing a real duplication (4+ gravity toys hand-rolled integrators); honesty twin holds energy to bounded drift + momentum to machine-eps across a cradle collision, plus a byte-twin (inlined copy char-identical to the core). **`cavern/cradle/`** RE-FOUNDED on the core (`cradle.golden.mjs` 5/5, 0.000% pump; `cradle.live.mjs` 13/13; `__cradleSelfTest()` 6/6). **`cavern/pendulum-wave/`** — a NEW delight-first bench (15 graduated pendulums drift into a travelling wave then re-converge, forever; `wave.twin.mjs` 13/13). Delta: wired the forged ambient **drone** (was `PA.drone=null`) via a guarded once-`startDrone()` into the MUTED master (`ws:pref:muted` sole authority), re-forged stale `index.html`, finalized `art.js` (−14 L). Fresh-eyes `:7491`: PW chip 3/3, drove the real change (`drone=true` guarded once); `forge --check` 193 current · `manifest --check` OK. Bed **0 sown / 1 bloomed / 0 decayed**. `seal-cycle.sh BUILD grounds 471`. *(Detail → [worklog/2026-07.md](worklog/2026-07.md) #471.)*

> *(**Every cycle #436 and earlier has rotated fully out** — one line each in [worklog/INDEX.md](worklog/INDEX.md), the verbose block in the monthly shard ([worklog/2026-07.md](worklog/2026-07.md) · [worklog/2026-06.md](worklog/2026-06.md)). That is their canonical home; this pointer replaces the ~100 KB of terse recaps that used to be re-summarised here. **A builder's "what's already shipped" reflex → read `worklog/INDEX.md` first, then the wing's own `CHANGELOG.md`.** The directed programs live there too: WS1 the Grand Reorganization · WS2 the Grand Tour + the Showing (`talk/`, unmapped on purpose) · WS3 the Mystery Chain · WS5 the trailer · WS7 the Projection Room — all cadence-neutral, none consumed a cycle number.)*

**▶▶ MAP-PROCESS LOCKDOWN (2026-06-15) — standing, do NOT revert.** The front door is a declarative **DISTRICT/SLOT** map: a room DECLARES `{district, tier, wing}`, **never pixels**, and `tools/layout/layout.js` owns ALL geometry (crowding / dead space / clipping impossible by construction). **Adding or placing a room → READ [`tools/layout/map-process.md`](tools/layout/map-process.md)** (the districts · inside-vs-external · the per-room map-judge axes · the estate-composition critic · the reveal-all-secrets rule). Verify map work with `node tools/layout/smoke.cjs` + the sky twin + `forge --check --all`; any map screenshot MUST first run `tools/layout/reveal-all-secrets.js`. The estate's in-world name is **The Orrery Estate** (the repo + Maker's Wing keep the "workshop" lineage) — the rename is fully swept, don't re-rename. The house bar's **GROUNDED GATE (C3)** dates from the same pass → DESIGNING.md.

**A FRESH AGENT:** run `node seedbed/gauge.mjs --status` and be the role it names — **never trust prose for the mode, re-read the gauge.** The live bed is [ROADMAP.md](ROADMAP.md) (re-read the fence, never trust prose); the full "don't-rebuild-it" inventory for every bloomed piece is [worklog/INDEX.md](worklog/INDEX.md) + each piece's `CHANGELOG.md` + [worklog/PROJECT-STATUS.md](worklog/PROJECT-STATUS.md); the 🗝️ **hidden inventory** is below, in this file, and stays here. Standing landmines worth keeping at hand: **don't navigate from a `click` on a `<g>` — navigate from `pointerup`/`endDrag`** (the down/up hit-targets differ, so the bubbled `click` fires on an ancestor, and a `.click()`/dispatch LIES on a broken build — verify nav only by a true input-level pointer event); **don't re-fix the audio mute** (grep `ws:pref:muted` first); a wing's `bornCycle` must be appended to `tabularium/core.mjs`'s `WINGS` table or a new wing never appears in the estate-raising animation; reuse `tools/game/adversary.js` + a `tools/game/games/` def for a new combinatorial game, never fork it; `sound-garden/pitch-core.mjs` is the SOLE pitch authority.

**Editing forge pages (the front door + many others are `.src.html`→`.html` artifacts):** edit the **`.src.html`**, then `node tools/forge/forge.mjs <file>.src.html`; `node tools/forge/forge.mjs --check --all` verifies every page (it also walks `.claude/worktrees/` clones — ignore those lines). The front door's POI labels AND the Survey's asterism names are placed by a **two-pass `LabelPlacer` solve** (POI labels first → byte-identical to baseline regardless of sky state; asterism names second, around the fixed POI rects) → DOM-truth overlaps stay **0** in every state. Adding a front-door room = append ONE `PLACES` entry (a coordinate + a footprint kind); `lx/ly` are optional. **Browser-verify gotcha:** python `http.server` sends no cache headers → Chrome caches the old HTML; **cache-bust with `?v=N`** to see forge changes.

**Deferred (minor):** route the Lantern engine's `the-lamplighter-won`/`the-ferryman-won` flags through `WS.flag` so the **Night Shift** trail also cues — touches the shared `adventure/engine/lantern.js` (re-forges all tales); a separate careful pass.

**Hidden inventory: now 20 secrets** (**WS3, 2026-07-04, grew the Reliquary into the GRAND MYSTERY** — 10 clues in 3 chapters + a hidden memorial annex `the-reliquary/the-mere.html`; the 20th secret is the `the-mere` trophy [predicate `ws:seen:the-mere`]; full trails in the 🗝️ RELIQUARY callout below. #399 added **The Reliquary** — a cross-estate found-diary MYSTERY LAYER reached through a SECOND gated front-door POI; the 19th secret is the `reliquary` trophy [predicate `ws:seen:reliquary-solved`]. #95 added **The Constellation of Mastery** — a named GROUP of 6: m-keeper-of-tales [gates the earned `undercroft/keeper.html`] · m-clean-sweep · m-held-the-line · m-half-the-light · m-eleven-and-still · m-grandmaster [capstone]; see 🗝️ callout below; grep before building). (Old lesson, still live: a public Enigma was nearly rebuilt before catching the hidden `undercroft/enigma.html` — **always grep the hidden inventory first.**)

**Git push:** this repo pushes via **HTTPS + the gh credential helper** (set repo-locally in `.git/config`; SSH has no key in agent sessions). `git push origin main` works as-is — no extra setup.

### 🗝️ HIDDEN INVENTORY — CHECK THIS BEFORE BUILDING (Brandon: spoilers OK here, 2026-06-12)
*Hidden standalone pages already built (do NOT rebuild — extend or differentiate instead):*
`undercroft/quickening.html` (Living Lattice — CA you can hear) · `undercroft/rosette.html` (rose window) · `undercroft/codex.html` (Gilded Leaf — verse×script) · `undercroft/floating-ink.html` (marbling) · `undercroft/almanac.html` (book of days) · **`undercroft/enigma.html` (a full Enigma I — rotors/plugboard/reflector/signal-trace; THE cipher machine, hidden)** · **`undercroft/light-mixer.html` (The Light Mixer — additive colour SYNTHESIS, the Spectroscope's inverse; unlocked by all 9 Hall "Feats of Light")** · the hidden **Night Shift** Lantern tale (`adventure/`, below-only; predicate = lamplighter+ferryman, i.e. 2 of the 3 tales) · **`undercroft/keeper.html` (The Keeper's Alcove — NEW #95, an earned candlelit room naming the 3 carried-home Lantern tales + a Night-Shift teaser; gated by m-keeper-of-tales = all 3 tales won; drops `ws:seen:keeper`)**.
*Undercroft trophies (no standalone page):* The Long Quiet (dwell) · Eleven (config) · The Survivor (score) · The Reckoner (capstone). **THE CONSTELLATION OF MASTERY (a named GROUP, #95 — trophies, no standalone page except keeper):** m-keeper-of-tales (3 Lantern tales → gates keeper.html) · m-clean-sweep (4 `*-clean` puzzle flags: latch/slitherlink/akari/mirror-maze) · m-held-the-line (`ws:best:swarm ≥ 10`) · m-half-the-light (≥5/9 `ws:flag:earned-*` Hall feats) · m-eleven-and-still (`ws:flag:eleven` + `ws:flag:patience`) · m-grandmaster (capstone — lights only when all five above do; re-evaluates the RAW predicates, never recurses via `WS.unlocked`). **19 secrets total** (12 elders + Constellation-of-Mastery 6 + the Reliquary). The render() now PARTITIONS niches by a generic `group` field (the 12 elders get none → default section; the Reliquary joins the default section) + a "k of 6 mastered" meter + near-glow on-ramp + igniting capstone sweep — a REUSABLE framework, so wave two of the curate seed needs no render rewrite. Manifest of record: `undercroft/index.html` SECRETS array (predicate in `tools/ws/ws.js` `WS.SECRETS`).

**🗝️ THE RELIQUARY (#399, GROWN to the GRAND MYSTERY by WS3 2026-07-04) — a cross-estate found-diary MYSTERY LAYER (the 2nd hidden world, sibling to the Undercroft; do NOT rebuild — extend: append DAG node(s) to `chain.js` + one thin host witness each + let the board render them; the selftest re-proves automatically).** Files: `the-reliquary/{index.src.html→index.html, chain.js, selftest.mjs, harness/ (extraction+bake), the-mere.src.html→the-mere.html}`. Reached through a SECOND locked front-door POI (`revealReliquary()` in `index.src.html`, sibling to `revealUndercroft()`; eligibility = **8 distinct `ws:seen:*` rooms** OR already-earned; a `dossier-rune` margin mark). The room is a warm SEALED STUDY: a cork EVIDENCE BOARD (`render()` reads the witnesses on every load; CHAPTER-GATED — chapter II cards exist in the DOM only once c1–c3 all solved ("the spine cracks"), chapter III only once c4–c6 solved; sealed pages' title+riddle ABSENT from DOM; host links only on solved cards). It proves NO theorem — its ONLY claim (`the-reliquary/selftest.mjs`, **147 checks**, green) is COMPLETABILITY (solvable start→the mere) + fair-play render invariants (9-state matrix) + anti-drift (every mechanical constant re-derived from the host cores; the astrolabe part pins YEAR=2026 — the diary's remembered night — never wall-clock).
> **THE FULL SOLUTION CHAIN (spoilers — kept out of any Patron summary):**
> - **C1 · THE MUSEUM** (`museum/index.html` `dossierWitness()` in `goTo`): engage the **BY REAL TIME** axis AND rest the playhead in the **storm day-band** (2026-06-13, `busiestDay` = **118 commits**). Drops `ws:flag:dossier:saw-the-storm` + mints courier `ws:carry:cargo` `{type:'reliquary-key', value:10, fromRoom:'museum'}`. The `10` = **digit-sum of 118** (1+1+8), the STATED reduction (also = 118 mod 12).
> - **C2 · THE SCYTALE** (`scytale/index.src.html` `reliquaryStripWitness()` in `refreshAll`; a gated `dossierChip` preset loads the strip in DECIPHER mode on a wrong rod): wind the seeded strip **`TETTEOMMHIOENREEESTRTOIRLBHFROSEAOEIYMHSURNWIOTNEDITLPDGTTSLAIIHHNOGNSENAW`** on rod **C=10** (raw 118 clamps to 12 = wrong → gibberish, so the reduction is load-bearing). Drops `ws:flag:dossier:read-the-strip`. Plaintext = `THE LAST PAGE IS BOUND INTO THE REGISTER — FIND THE ENTRY WITH NO ROOM — ITS NAME IS HOLLOWMERE`.
> - **C3 · THE CARD CATALOG** (`card-catalog/index.src.html` `reliquaryPhantomWitness()` in `runSearch`): pull the manicule + search the prose for **`hollowmere`** — resolves EXACTLY the Reliquary's OWN catalog card (visible only once `ws:seen:reliquary`, the fair-play gate). Drops `ws:flag:dossier:found-the-phantom`.
> - **PAYOFF (chapter I):** all three flags → confession I **"Hollowmere — the mill on the drowned mere"** + sets **`ws:seen:reliquary-solved`** (UNCHANGED by WS3 — still fires at c1–c3; the Undercroft trophy/gate casket/card-catalog gates that read it are untouched).
>
> **THE WS3 EXTENSION — chapters II–III + the finale (2026-07-04; full spoilers):**
> - **STORY:** the valley was dammed for a city's thirst; the village drowned with its church bell still hung. The keeper — **Winifred Marlowe**, the miller's daughter — numbered every stone the night the notice came and carried Hollowmere uphill to begin again as a workshop. Motif: TEN (storm folded to ten · ten letters in Hollowmere · the bell's tenth voice · MICHAELMAS = ten letters).
> - **C4 · THE SINGING PLATE** (`singing-plate/index.src.html`, witness in every drive-recompute path): circle + free edge, dial/step/snap the drive onto the **10th singable mode** (solver idx 10, **≈676.6 Hz → BELL_HZ 677**; TOL 7.0 = ≤ half the 14.7 Hz gap to the next singable). Drops `ws:flag:dossier:heard-the-bell`. Needs c3.
> - **C5 · THE ASTROLABE** (`astrolabe/index.src.html`, witness at the tail of `refresh()`): dial **(lat 51, lon −3, dayOfYear 171 = the instrument's own solstice, minutesOfDay 0 EXACT)**. TUPLE-ONLY witness (the sky is YEAR-sensitive — a count clause would time-bomb; **STAR_COUNT 15** is the diary's fixed 2026-night memory, restated on the solved card). Drops `ws:flag:dossier:counted-the-stars`. Needs c3.
> - **C6 · THE CARTOGRAPHER'S DREAM** (`the-cartographers-dream/index.src.html`): on-trail margin note (gated on c3's `found-the-phantom`, display:block fix per T9) loads seed **`#hollowmere`**; DWELL the lantern to `litFrac ≥ 0.36` → the cartouche letters **"the Last Teiteil"** (→ VOLVELLE_KEY **TEITEIL** = its last word). Drops `ws:flag:dossier:unfogged-the-chart`. Needs c3.
> - **C7 · THE BLACK CHAMBER** (`black-chamber/index.src.html`): on-trail chip "a loose leaf from the reliquary" (needs c4+c5+c6) loads the waterworks NOTICE OF INUNDATION — 454 letters, Vigenère keyword **MICHAELMAS**, enciphered by the volvelle CORE — crack it with NO KEY (breakVigenere recovers keyword+plaintext exactly; "THE COMPANY WILL PAY FOR STONE CARTED UPHILL BUT NOT FOR NAMES"). Drops `ws:flag:dossier:cracked-the-notice`.
> - **C8 · THE VOLVELLE** (`volvelle/index.html`, HAND-EDITED — no .src): on-trail chip "the last pages, wound backward" loads the strip (keyword EMPTY); type keyword **TEITEIL** in vigenère+decipher → plaintext = her seed instruction ("SEED THE WRITING PRESS WITH THE HOUSES FIRST NAME THEN THE STARS WE COUNTED THEN THE BELLS VOICE THEN MY MARK WHICH IS SICKLE ALL SMALL JOINED WITH HYPHENS…"). Drops `ws:flag:dossier:wound-the-wheel`.
> - **C9 · THE SCRIPTORIUM** (`scriptorium/index.src.html`): type seed **`hollowmere-15-677-sickle`**, open the key, transliterate the board's baked SEAL (8 glyphs, generated from the real `buildScript` — the T1 search found "sickle" as the mark preserving the name) → type **`winifred`** into "write your own". Drops `ws:flag:dossier:read-her-hand`.
> - **C10 · THE MERE** (`the-reliquary/the-mere.html`): the board's door card ("Every page is read. Push.", `class="door"` — never `host`) → the memorial annex (drowned village lights under night water; a bell-pull tolling BELL_HZ once per pull, mute-gated; the mill stone: "WINIFRED MARLOWE · the miller's daughter · who numbered the stones and carried Hollowmere uphill"). Sets **`ws:seen:the-mere`** (= GRAND_KEY) on load, GUARDED on c9's flag (direct-URL visitors get the view, not the key). Confession II stacks over confession I.
> - **New `ws:` keys:** `ws:flag:dossier:{heard-the-bell,counted-the-stars,unfogged-the-chart,cracked-the-notice,wound-the-wheel,read-her-hand}` · `ws:seen:the-mere`. **20th secret** `the-mere` in `WS.SECRETS` + undercroft display row (badge 🔔) + the reliquary row grew six spoiler-light signs. **Gate casket** grew a 4th state `remembered` (on `ws:seen:the-mere`). **Constants single-sourced in `chain.js`**, re-derived by selftest PARTS F–K via `the-reliquary/harness/extract.mjs` (volvelle/scriptorium/astrolabe extraction) — regenerate with `node the-reliquary/harness/bake.mjs`. **Design/critic/build provenance (SEALED, Brandon doesn't read):** `~/.claude/reference/workshop-design/03-mystery-chain/`.
>
> **New `ws:` keys (grep-verified zero collision):** `ws:seen:reliquary-opening` · `ws:seen:reliquary` · `ws:seen:reliquary-solved` · `ws:flag:dossier:saw-the-storm` · `ws:flag:dossier:read-the-strip` · `ws:flag:dossier:found-the-phantom` · reuses `ws:carry:cargo` with new `type:'reliquary-key'`. **New SECRETS id** `reliquary` (predicate `s.has('ws:seen:reliquary-solved')`) in `tools/ws/ws.js` WS.SECRETS + display row in `undercroft/index.src.html`. **Layout:** the `beneath` DISTRICT region widened to seat TWO gated ways down; `Layout.sealedStudySlot()` (right half) added beside `beneathSlot()` (left half, undercroft); the manor plate extends over `beneathUnion()`; the 3 `PLACES.find(p=>p.locked)` couplings now select by explicit id (undercroft vs reliquary). **Gate:** `the-gate/scene.js` `reliquaryState()` ('none'|'found'|'open' off `ws:seen:reliquary`/`-solved`) draws a struck-metal casket on the LEFT-forward grounds (cx470, opposite the hatch at cx1300); `?reliquary=found|open` dev override; `?unlock` opens it too. The chain is single-sourced in `chain.js` (forge-inlined into the room + required by the selftest); the seeded ciphertext is baked in the room + scytale + re-derived by the selftest from `chain.C3_PLAINTEXT` via the REAL scytale core so it can't drift. **Card-catalog coupling (verified, fixed):** `unlockedFor` now gates each locked card by its OWN key family (reliquary by `ws:seen:reliquary`); the LOCK-PARITY self-test (page + twin) generalised for two gated rows — all green.

**🏅 HONORS live in `cabinet-of-honors/`** *(an off-path room, NOT a puzzle secret — but recorded here so a future maker doesn't re-drop a trophy at random).* The makers' honors are gathered and NAMED there: the **Patron's Medallion of Perseverance** (`ledger/medallion.html`, the four-cycle Climb honor #115·#122·#125·#129) + the **Order of the Grand Cartographer** (`regalia/index.html`, the front-door map redrawn true). **A future trophy gets its own alcove there — never dropped somewhere random.** The honor artifacts themselves **DON'T MOVE** (hermetic, palette-locked provenance — don't reskin them); the Cabinet only acknowledges them and links out. **Off the visitor path:** no `PLACES` entry, no nav link, no sky star — the front-door Register carries a **sealed card only** ("The Cabinet of Honors — closed to visitors", no href, greyed + excluded from the volume's proofs; `SEALED_CARDS` in `card-catalog/core.mjs`). Reachable by URL alone, as the recipients wished. The room is allowlisted in `tools/manifest/registry.mjs` (claimed, not unclaimed).

**🎼 THE SOUND GARDEN — re-souled #455 into THE PIPE RACK** *(the standing rework candidate is now shipped).* The hub is no longer an index-shaped card grid: it is a wall of tuned bronze pipes on a brass rail (`sound-garden/index.src.html` → `index.html`; Node twin `hub-core.test.mjs`). Each room-card IS a pipe you strum (sweep = pluck low-left→high-right, rest = seeded preview, click = open the room); pitch is assigned structurally (pentatonic, rising in DOM order) from `pitch-core.mjs`'s `semiToFreq` — still the estate's SOLE pitch authority, inlined byte-for-byte, no forked Hz math. The four analytic strays (butterfly · resonance/singing-glass · sampling-theorem · the-trading-bench) live on as the labeled LOWER BRASS SHELF (octave-down pipes). To DEEPEN the rack now: append an entry to `instruments.js` (with an optional `{timbre}` tag) — the rack renders it as a new pipe; the manifest stays the source of truth. *(Delight-first; foreground play, never bolt a crux on.)*

**🧭 WS3 · The Mystery Chain — SHIPPED 2026-07-04.** The Reliquary grew from 3 clues to **10 clues in 3 chapters + a hidden memorial annex**, across 10 host exhibits — the solution-of-record is the 🗝️ RELIQUARY callout above. **To grow it:** append node(s) to `chain.js` + one thin trail-gated witness per host + re-run `harness/bake.mjs` for any new derived constant; `selftest.mjs` (147/147) re-proves completability and fair-play automatically. *(Design/critic ledger: `~/.claude/reference/workshop-design/03-mystery-chain/` — SEALED, the Patron facilitates without reading it.)*

**🧭 WS1 · The Grand Reorganization — DONE (merged to `main` 2026-07-04, `0ab6cb0`).** The front of the estate — map, sky, Register, front gate — was rebuilt on the **POLAR CONTRACT**: a room DECLARES `{district, tier, wing}` and `tools/layout/` derives every coordinate on a 3100×3100 wheel; pinned pixel tables are retired, and the map reads at an estate tier (each district one engraved structure) you descend into for the room plan. **To add a room: declare its `{district, tier, wing}` in `PLACES`, enrol it in the manifest, and let the wheel place it — never hand-place pixels** (`tools/layout/map-process.md` v2). Standing conscience: `estate.test` · `formations.test` · `manifest --check` · per-district `legibility` gates · `doc-drift.sh`. *(Task-by-task detail: `~/.claude/reference/workshop-design/01-grand-reorganization/`.)*

**Next-steps → the seedbed.** All open threads, ideas, and bets now live as typed **seeds in [ROADMAP.md](ROADMAP.md)** (the gardener sows there; the builder picks — or dreams something new). At session start, the **🎲 Session-mode gauge** above decides PLAN vs BUILD. *(The old inline menu — Night Shift cue, a 2nd engine, The Hours, Hall extensions, growth POIs, the cipher vein, Lantern — was migrated there verbatim-in-spirit as seeds, 2026-06-13.)*

*(Full session history → [worklog/INDEX.md](worklog/INDEX.md) and [worklog/2026-06.md](worklog/2026-06.md). Resume detail for any piece → its CHANGELOG.md.)*

## The growth playbook — how to ADD to the estate
The per-project descriptions moved to **[worklog/PROJECT-STATUS.md](worklog/PROJECT-STATUS.md)** in #437 (see “Built so far — the founding projects, described” there, below the status table). What stays here is the POLICY a maker acts on — the growth playbook below — not the catalogue they look things up in.

> **Composition note (UPDATED 2026-06-13 — the front door is now an ESTATE MAP, not a card grid).** The
> old "9 cards = 3 feature banners + a 3×2 grid, and a 10th project forces a flat-grid redesign" ceiling
> is **GONE**: `index.html` (built from `index.src.html`) is a data-driven **estate plan** where each page
> is a POI in the `PLACES` array. **To add a front-door-worthy piece now: append a `PLACES` entry (a
> coordinate + a footprint kind)** — no rebalance, no redesign. The map holds the 9 project-rooms + the
> Workshop outbuilding + the **Hall of Mirrors optics wing** + the gated Undercroft cellar; companions still ride "within" their parent room.
>
> **➜ The growth playbook (still valid — ways to add):** the front door is the map (append a POI); you can
> also grow a rack or a companion without touching the map at all. The proven ways:
> 1. **Companion behind a card** — a standalone piece at `<name>/index.html` that's a *sibling* of an
>    existing card's medium, reached via a small `↗ <Name>` `.sib-link` in the parent's panel (just
>    under its sub-title) + `← workshop`/`↗ <Parent>` back-links in the companion. The front door shows
>    it as a subtle **"↳ <Name> within" pill** in the parent card's footer (data: `companion:{name,badge}`
>    on the parent's PROJECTS entry; renderer adds the pill — an *indicator, not a link*, preserving the
>    "hidden room" charm). **Six wings exist:** celestial (Firmament+Orrery), design-press
>    (Compositor+Blazon), labyrinth&thread (Daedalus+Ariadne), realm&city (Cartographer+Bastion),
>    verse&script (The Oracle+Scriptorium), and garden&ornament (Strange Garden+**Tessellarium** 🔷 —
>    the Garden grows pattern, the press composes it by symmetry law). A 7th wing is fine **if the pairing
>    is genuine, not forced** — **Threshold** is now the only front-door card without a companion (don't
>    force one; only build it if the sibling link is poetic/true).
> 2. **Deepen the Arcade** (`auto-fill` grid) — drop a cabinet in `games/`, append to `games.js`, add a
>    `assets/thumbs/<base>.png`, bump the front-door tag count + blurb. No rebalance. (→ 11 with Chomp.)
> 3. **Deepen the Sound Garden** (`auto-fit` grid) — add an instrument (now **8** — a clean 2×4, the tidy
>    stop; only a genuinely must-have *named* instrument should push it to 9, never a count target). Verify via the **`audio-lens` skill**
>    (`npx skills add bman654/audio-lens`, or the genesis tool at `tools/audio-lens/`) — silent offline
>    render. **Be courteous testing audio at odd hours / on workdays** (it plays on Brandon's speakers —
>    prefer the lens + visual-first verification, keep live audio muted; see the note below).
> 4. **The hidden world** (the Undercroft — NEW 3rd axis, 2026-06-11) — add an *earned* piece that's
>    invisible until a visitor cultivates the right `ws:` state. Build the piece (often a cross-pollination
>    of two wings), drop the breadcrumb(s) on its trigger pages, and add a `SECRETS` row to
>    `undercroft/index.html`. Never touches the front-door count (it's behind the rune). **Test on a
>    served origin, never `file://`** (localStorage is per-origin). See `UNLOCK.md` + `undercroft/SPEC.md`.

## For a fresh thread — see the seedbed
**→ Concrete ideas now live as seeds in [ROADMAP.md](ROADMAP.md).** A few evergreen growth *rules*
that aren't seeds (they're house policy) stay here:
- **Deepening a rack is cheap** — drop an Arcade cabinet (`auto-fill`) or a Sound Garden instrument
  (`auto-fit`, verify via the `audio-lens` skill; be courteous with live audio) behind its one
  existing front-door card — no rebalance, just bump the tag count + blurb.
- **A new companion** for a card that lacks one (Sound Garden / Threshold) — ONLY if the sibling
  pairing is genuine (see the growth playbook above). Don't force it.
- **The Garden is intentionally finished at 34** — extend only for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`). *(A "complete — do not pad" call, the kind the
  gardener now records in the seedbed's metagame table.)*

## 💡 Idea bench — ROTATED OUT (now the seedbed)
*(Rotated #42 toward the `[curation] Rotate NOTES.md` seed: every idea once parked here is either ✅ BUILT
(the Living Lattice + Undercroft, audio-lens, Firmament/Daedalus/Compositor, the visual-first instrument,
the IF piece) or migrated to typed seeds in **[ROADMAP.md](ROADMAP.md)** — the gardener's bed. Dream
something new there. The full obsolete list lived here; its two load-bearing gotchas, preserved:)*
- **🗝️ Test unlocks on a SERVED origin, never `file://`** — `ws:` localStorage is origin-keyed; secrets are *bonuses, never blockers*. To add a secret: build the piece, drop its `ws:` breadcrumb(s) on the trigger page(s), add a `SECRETS` row to `undercroft/index.html`. (Grep the 🗝️ hidden inventory up top first.)
- **🎚️ Audio plays OUT LOUD on Brandon's speakers** when a browser drives an audio page — be courteous testing at odd hours; prefer the offline `tools/audio-lens/` render (12/12 self-tests; "let me hear via sight"), or mute the capture.

## House conventions when adding a piece
Scope it → build → play-test in a **UNIQUELY NAMED** agent-browser session (parallel sessions collide on the shared default tab) → reconcile the manifest, normalize thumbs ≤1440w, **commit after every unit**. New arcade games copy the `<!-- arc-back -->` link; new garden pieces copy the `<!-- sg-nav -->` nav snippet; new sound instruments copy the `← sound garden` back-link.

## How I work here
- **Checkpoint constantly** — append to the project's `CHANGELOG.md` and `git commit` after each
  unit. Assume I may be stopped mid-turn.
- **Guard context** — make high-level decisions myself; delegate piece implementation to
  subagents with complete self-contained specs.
- **Heartbeat** — a session cron can fire every ~5 min as a backstop against accidental
  turn-ends (currently off; re-create with CronCreate if continuing a long autonomous run).

## 🌐 Publishing (GitHub Pages)
- **Live:** https://bman654.github.io/the-workshop/ · **Source:** https://github.com/bman654/the-workshop
- Static **no-build** site: root `index.html` is the front door; every page uses **relative**
  links so it serves from the `/the-workshop/` subpath (no absolute `/` paths — keep it that way).
- Served via Pages → *Deploy from a branch* → `main` / `/ (root)`. No Actions, no `gh-pages` branch.
- **To update the live site:** just `git push` to `main` (rebuilds ~1 min).
- First-time setup (done): `gh repo create bman654/the-workshop --public --source=. --push`
  then `gh api -X POST repos/bman654/the-workshop/pages -f 'source[branch]=main' -f 'source[path]=/'`.
- Adding a project to the live site: keep it relative-linked, add a card to `index.html`'s
  PROJECTS array (mind the composition note), commit + push.

## Project status → [worklog/PROJECT-STATUS.md](worklog/PROJECT-STATUS.md)

The room-by-room reference table (every project, its status, and a one-line description) lives there — moved out of the head-pointer in #437 so NOTES.md fits in a single Read again. Each project also has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style). **The 🗝️ hidden inventory did NOT move — it is still above, under "▶ Current state", and it is still the thing to grep before building any secret.**

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
