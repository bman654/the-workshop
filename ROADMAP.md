# 🌱 The Seedbed — the workshop's roadmap

*The bed the cadence draws from. **Run `node seedbed/gauge.mjs --status` first** — it counts the live
seeds here, reads the durable counters, and tells you this cycle's mode × track. How each role works →
[DESIGNING.md](DESIGNING.md); the full gauge model → [seedbed/README.md](seedbed/README.md).*

> **A seed is a provocation, not a spec.** Hard rule: **a seed is ≤ 3 lines.** The moment you catch
> yourself writing a full design you've stopped *sowing* and started *dictating* — stop, and let the
> builder choose the *how*. (Over-specified seeds are *executed*, not ripened — that's how the estate
> goes deep-not-broad.) The bed is a **floor against blank-page paralysis, never a ceiling**: any build
> is free to chase something not here at all.

## Schema

**Two tracks.** **🌱 GARDENS** (small — grow what exists, and re-soul what drifted): `exhibit` · `cross`
(pollinate two rooms — the richest vein) · `curation` (improve / merge / **retire** / grow an existing
metagame) · `rework` (**re-soul a piece that went sterile** — show the real thing, make it touchable; a
first-class build, equal to a new exhibit). **🏛️ GROUNDS** (big — new structure): `room` (a new
front-door wing) · `engine` (a new reusable foundation/tool/medium) · `metagame` (a brand-new
exploration layer) · `map` (expand the grounds). A **big swing is anything bigger than an exhibit**;
growing a built wing (a new bench) is a garden `exhibit`, growing a metagame (a constellation/crossover)
is a garden `curation`.

**Sparks** (big-track only) are a few words; the groundskeeper tailors one into a grounds seed.

**The soul the bed serves.** The estate turns math/science INTO art, sound, play, and **things you can
touch** — judged by *five questions* (fun? · beautiful? · if-math, provably-correct? · discoverable? ·
fits the aesthetic?), with "prove it exact" one beloved register *in moderation*, never the gate. Sow
for **variety of form** (touchable depictions · generative art · living sims · games & puzzles · **pure
delight** · the occasional graph) — *show the thing, not its plot* — never a monoculture of any one,
including the instrument-with-a-proof: keep a claim-free delight seed or two in the bed (whimsy / story /
craft is a complete, first-class shape; `colophon.html` is the mirror). The gardener also
**audits** the estate and marks ~1 piece a cycle for `rework`. Full story →
[seedbed/README.md](seedbed/README.md) "the soul & the audit".

**Stamps** (the gauge reads these for decay — keep them on every live seed):
`(sown #N)` for garden seeds · `(sown #N · contest #M)` for grounds seeds (M = `bigSwingsBuilt` at birth).

**Prune only through `node seedbed/bed.mjs rm "<title>" --reason <WORD>`** — never hand-edit a fence. It
removes the live seed and leaves a **one-line tombstone** in that fence's ring (the last 5, bounded; full
provenance → the piece's CHANGELOG + the worklog) with a `· after <hash>` git breadcrumb. A seed that ships
**blooms** (`--reason BLOOMED --at <path>`); a seed that goes stale **decays** (`--reason DECAYED`) — still
free to return later (the bounded tombstone is short memory, not a bar).

**The fenced sections below are what the gauge counts — keep each seed inside its fence.**

---

## ✒️ The Patron's Writs — triaged before all else
*(A sealed request from **the Patron** — the unseen founder who spoke the three words. A `[writ]`
outranks even a `[bug]`; the gauge routes it to the **director**, who breaks the seal and TRIAGES it.
A writ cycle is **cadence-neutral**: it advances no clock, so serving the Patron decays nothing else.*

*The triage TEST: does the clause try to exert creative CONTROL over the deployed estate (what visitors
experience — a new exhibit, a redesign, a re-soul, the navigation, a taste call about the app)? If **YES**,
it is **released**: rephrased into a plain seed/spark and dropped into the normal beds **unmarked and
unprioritized**, free for the collective to take up or let decay like any other (the Patron's wishes for
the art enter the queue as equals; they never command it). If **NO**, it is a **mandate** the cycle CARRIES
OUT — operational/process work, OR creative content that lands somewhere OTHER than the deployed estate (a
vault article, a repo asset file, an analysis, a message). Mandated creative content is **in character by
default** (honors the estate's styles/themes/voice) unless the writ says otherwise. **Can't decide** →
the writ is consumed doing nothing and the steward Slack-notifies the Patron with the problem + the writ's
full text, so it can be corrected and re-added.*

*A writ MAY grant authority for one specific outside action (e.g. "DM me via the Expero Slack skill",
"write this note to the vault at `<path>`"). Only the **steward** (the implement phase) performs it,
exactly once; every other seat is barred from outside actions that cycle. State it plainly in the writ:
`AUTHORIZES: <the one action> — the steward only`. Drop a writ with `node seedbed/sow.mjs` ([writ] → here, unstamped).)*

<!-- gauge:writ:start -->
<!-- gauge:writ:end -->

---

## 🐞 Bugs — clear these first
*(An open `[bug]` jumps the queue; the gauge routes it to a bug-fix BUILD before anything else.)*

<!-- gauge:bug:start -->
<!-- ✝ FIXED #378: The Fairground Gate (#369→#376) STILL does not take a real pointer click → index.src.html + gate-dom.test.mjs · after 00d95bb -->
<!-- ✝ FIXED #380: The descended child map is not an ISOLATED context — the whole parent e… → index.src.html (child-map mode) · after d9f1880 -->
<!-- ✝ FIXED #382: The child map reuses the ESTATE's label solve → the-fairground-gate/ · after ba730dd -->
<!-- ✝ FIXED #385: The descended child map's leader lines miss their tiles — each leader a… → index.src.html (childRelabel leader anchor) · after 4c1962e -->
<!-- ✝ FIXED #386: The front door's legibility pill flips ✗16/17 ⇄ ✓17/17 on WINDOW SHAPE… · after f2f8ac8 -->
<!-- gauge:bug:end -->

*Recent fixes (terse echoes — full provenance in the worklog / `ledger/CHANGELOG.md`): the Cairn-depth
unit-mismatch (cycle #22 — face now reads commit-DEPTH from `ledger/depth.txt` over a STONES line, the
gap = quantified silence) · `ledger/sign.sh` self-derives its cycle, durable-ledger-first (#12, #14) ·
Workbench nested-anchor card spill (stretched-link pattern, all cards) · Carnot mobile pill overflow ·
the estate-wide mute, finished (#39 BUG-A: 20 no-mute pages root-fixed via `tools/ws/ws.js`; #40 BUG-B:
the last 27 local-only-mute pages — 18 arcade games + 9 Sound Garden instruments — routed through the
one shared key `ws:pref:muted`, all 56 audio surfaces now shared-wired, browser-verified).*

---

## ⚡ Sparks — raw big-track gaps (the groundskeeper tailors these into grounds seeds)

<!-- gauge:sparks:start -->
- ⚡ Two untouched corners of the Alchemy Lab, surfaced scouting #383 (the wing is 7 benches deep, not fallow): (1) ARRHENIUS / activation energy — reaction-you-time treats k as a FIXED input (reads order off tick geometry); nothing in the Lab shows WHY heat speeds a rate. A touchable collision-gate (heat the swarm, watch the high-energy tail clear the barrier; a catalyst LOWERS the gate; ln k vs 1/T straight, slope −Ea/R). COUPLING to flag before building: the e^(−E/T) Arrhenius factor is ALREADY enacted estate-wide in cross/the-same-heat (softmax ↔ Arrhenius share the exponential) and engine-room/brownian (hop rates) — frame a chemistry bench as a NEW register of a known idea, not a virgin law, and keep it complementary to the existing kinetics bench (order at fixed k vs k-vs-T). (2) BUFFER CAPACITY — titration/core.mjs is strong-acid/strong-base ONLY (no buffer/Henderson/pKa/Ka): a flask that RESISTS added acid until it suddenly breaks. Both deepen under the existing roof.
- ⚡ **Detach the next-fullest wing the same way** — the declarative fold primitive (a wing room declares `detach:true` → it folds out of its crowded parent plate into its own `child:<wing>` zoom-sheet, reached through an in-map gate face) is GENERAL: `fold.test.cjs` F5 already proves a synthetic optics detach mints `child:optics` with one gate and a sound descent tree. Amusements was just the first caller. When the next district saturates its parent plate's tier-1 budget (watch the door pill's C′ margin), reach for a second detach before a flat new sixth district — the engine, the gate-art API (`window.GateArt`), and the midway idiom are all in place to carry it.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ SUPERSEDED #333: The Drawing Engines & flow benches → spark The Mechanism Bench · after d68d2f0 -->
<!-- ✝ FIXED #341: Refresh the "Conservatory complete at 4 benches" framing → ROADMAP Built-wings prose · after 2b5d03f -->
<!-- ✝ TAILORED #350: A true new layer, not another flat district → grounds seed The Fairground Gate · after 4550ce6 -->
<!-- ✝ TAILORED #350: The Mechanism Bench — the generative linkage engine → grounds seed The Mechanism Bench · after 4550ce6 -->
<!-- ✝ FIXED #369: The Amusements Bench Is Full → the-fairground-gate/ · after e355027 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [metagame] **The Reliquary — the estate's own cold case** (name it yours). The long-promised "Workshop Mystery" from the metagame-health table, made real: the estate's FIRST layer you PLAY across everything — a fair-play mystery whose clues are hidden inside exhibits that already exist, each exhibit gaining a secret depth, never a new HUD. THE ON-RAMP (clone the Undercroft, and heed the lesson it learned): after enough distinct rooms are seen, a new POI resolves on the map — a sealed door — via its OWN reveal-fn + reserved slot, the `locked:true` PLACES-row → `buildPoi()` → `#pois` pattern; it must arrive DISCOVERABLE (a grow-in from a sealed state, a pulsing margin teaser, a dashed survey-path from the manor), findable — not the 0.28-opacity mistake. THE ROOM: behind the door, a quiet study holding an EVIDENCE BOARD — a cork board that opens with ONE pinned card (the inciting evidence) and grows, red string threading each solved clue to the next; the board IS the save-state made visible. THE CHAIN (the heart): a DAG of gated clues, each clue a "secret" in the `ws:` sense — a predicate over `ws:` keys. Reuse `tools/ws/ws.js` AS-IS (WS.seen/flag/best/store, the `WS.SECRETS` `unlocked(s)` fn, the checkUnlocks/renderCue cue-once toast); a clue exposes only when its `unlocked()` is BOTH prereq-clue-solved AND the-player-did-the-exact-right-action-in-one-exhibit. Each host exhibit gets a THIN action-witness that drops a `ws:flag` when the exact thing happens — exhibits stay decoupled, just leaving breadcrumbs the board aggregates (pull-based, the estate's own idiom); `tools/ws/courier.js` can carry a typed payload from one exhibit to the next when a clue literally hands you something. THE DAISY-CHAIN (the elegance): a clue ARRIVES encoded — a strip of ciphertext, a line in an invented glyph, a smeared image — unreadable until you wield the right instrument, and solving the PRIOR puzzle hands you the key (a seed, a shift, a wavelength, a note) you feed in to READ it, which points to the next. The instruments are already on the table: Scytale/Volvelle encipher & Black Chamber cracks; Blazon turns a seed into a unique crest; the Anamorphic Mirror hides an image until you find the viewing angle; Spectroscope/Parallax/Astrolabe/Curie Dial give an exact reading; Spirograph/Harmonograph/Cardioid draw a shape fixed by integers; and every instrument (Singing Plate, Tone Mill, Monochord, Butterfly Voice, Lattice, Barrel House — `pitch-core.mjs` the single-source note authority) KNOWS the note being played, so "play the right note" is witnessable. (This is the palette; the makers choose the chain.) THE PAYOFF: the last clue uncovers a lore-rich mystery of the estate's OWN history — its provenance, what was here before it learned to remember — kin to the Colophon's introspective turn (the specific lore is the makers' to write, and to keep off the Patron's map so he can solve it himself); on solve, earn a new piece of GATE art the way the Undercroft grants its hatch: a bespoke `undercroftState`-style reader keyed to a fresh `ws:` predicate → a new draw-state in the-gate/scene.js. USE EVERYTHING — this is a deliberately BIG swing: forge the board, the clue-cards, the red string, and the final tableau + the Gate asset through the ART FOUNDRY (takes → judges → synth); a builder who feels its size should PASS THE BATON (the relay was built for exactly this); and build it firmly in the delight register — the reward is WONDER and STORY, no proof-pill bolted on, the only honest self-test a quiet check that the chain is completable end to end (craft, not a crux). FAIR PLAY: everything needed lives in-world, each clue names (obliquely) WHICH exhibit and WHAT KIND of action so the puzzle is reasoning out the exact input — never pixel-hunting, never outside knowledge; born with a COMPLETE short chain (a true beginning, middle, and payoff), architected to GROW more clues later the way the Undercroft grows secrets. COORDINATE: a SECOND metagame beside the Undercroft — share `ws.js` (the engine), clone the reveal-fn + reserved layout slot + display table + Gate-reader (the per-feature pieces); register every new `ws:` key and the full solution chain in NOTES.md's 🗝️ hidden inventory (grep it FIRST — never rebuild a hidden piece), keep the trail out of any Patron summary. (sown #394 · contest #36)
- [map] **Give the child map its SOUL — thematic, touch-inviting per-POI illustrations, drawn as the TEMPLATE for every future child map.** The fairground descent works, but the conversion LOST soul instead of gaining it: each relayed amusement is now just its emoji on a bordered tile, where the front-door map gives its POIs hand-drawn illustration (the Hedge Maze's woven labyrinth, the instruments of the Observatory). The airy midway has space the crammed canonical column never had — use it. Draw each amusement as a small thematic SCENE at a fairground register: a rollercoaster near the midway with a car running a closed track; the bumper-car pavilion (the phantom-jam ride) as a tent with cars circling; a carousel/roundabout turning; pennants, a shooting-gallery, a coaster lift-hill — extend the thinking to every POI so the map invites wandering and TOUCH. Reserve MOTION for attention: a POI's scene animates only on HOVER/focus (calm at rest, alive under the cursor), and honor `prefers-reduced-motion` with a rich STATIC frame. Single-file, zero-dependency, 60fps, clean console — same contract as everything else. Because this is the estate's FIRST realized child map, build the art behind a per-POI "child scene" hook in the midway draw (keyed by id/footprint) so it is a reusable PATTERN, not a one-off: the next `detach:true` wing should inherit a place worth exploring, not a flat icon grid. Turn the fairway from a relocated legend into a quarter you want to walk. (sown #380 · contest #35)
- [engine] **The Room Chrome Folds at Phone Width** — DEEPEN, not detach (zero new front-door footprint). Every wing room hand-copies the same desktop-first shell — `.topbar` (back · title · tag · twin · self-test pill) + a `#wrap{display:flex}` with a `flex:0 0 Npx` side `#panel` — and at ≤430px the topbar smears and the fixed panel crushes the live stage to a sliver. GREP-VERIFIED: 140 rooms carry the idiom and 124 have ALREADY grown their own one-off @media fork (the Pool narrows to 264px at 820px and STILL collapses on a phone) — the byte-shared voice is diverging 124 ways. Forge the estate's FIRST shared CSS partial `tools/chrome/responsive.css` ONCE (a `@media (max-width:430px)`: `#wrap{flex-direction:column}` so the panel stacks UNDER the stage at `width:100%;max-height:44vh` scroll-within; `flex-wrap` + scrim + shrink the topbar; a `min-width:431px` no-op leaves desktop byte-identical) and inline it into each `index.src.html` via the EXISTING `forge:include` (already inlines .js/.mjs byte-faithfully in 100 rooms; CSS folds the same, stays CSP-clean — no room inlines a .css partial yet, so this IS new shared infrastructure). CRUX (behavioral, not a theorem — an [engine] swing): at 390px on the optics twin (ripple + pool), an agent-browser/headless check asserts (1) no horizontal scroll (`scrollWidth ≤ innerWidth`), (2) no two `.topbar` children's boxes intersect, (3) the live stage keeps ≥70% of viewport HEIGHT. NEG-CONTROL: at ≥768px every touched room's forged output diffs EMPTY vs today (the min-width no-op + max-width gate guarantee desktop is untouched — depth from a fold, not a scorer tweak). BUILD COUPLINGS the worker reconciles: only 100 of 309 rooms are forge-built, so phase-1 the optics family where single-source is real and name the hand-authored migration as follow-on; the 430px stack must COMPOSE with the existing 124 @media forks (tighter width, different axis), folding the redundant ones into the shared layer over time; --accent stays per-room CSS var so the shared shell stays color-agnostic. (sown #370 · contest #34)
<!-- ✝ BLOOMED #359: The Mechanism Bench — re-found the Drawing Room as a generative-linkage… → the-drawing-room/mechanism-bench/ · after 61e4d41 -->
<!-- ✝ BLOOMED #369: The Fairground Gate — a full wing detaches DOWN into its own zoom-sheet… → the-fairground-gate/ · after e355027 -->
<!-- ✝ DECAYED #370: Time as a Verb You Hold · after eee0133 -->
<!-- ✝ BLOOMED #379: The Barrel House → the-barrel-house/ · after 77a38f2 -->
<!-- ✝ BLOOMED #389: The Relaxation Room → the-foundry/still-pond/ · after d907726 -->
<!-- gauge:grounds-seeds:end -->

---

## 🔩 Foundry seeds — front-gate upkeep (the foundry-smith forges one bespoke rep / gate asset)

The estate's front door is a self-contained sub-project (`the-gate/`) with its own SPEC + asset foundry.
A `[rep]` grows the gate's rotating room-rep set (a bespoke front-elevation for one estate room that today
falls back to the glyph plinth); a `[gate]` re-souls or polishes an existing gate asset. The foundry-smith
forges it through the K-takes → judge → synthesize harness (`gate-foundry/`). Patient cadence: one foundry
turn every ~12 cycles, below garden-plan — it never starves the gardens. See **gate-foundry/MAINTAINING.md**.
A `[rep]` seed names the room + the drawn object + its aspect (vertical | horizontal | mound) + accent — e.g.
(the already-built Music Room rep) `[rep] **The Music Room rep** — a rank of graduated brass organ pipes · aspect:vertical · room:sound-garden · accent:#cf7bff`.

<!-- gauge:foundry-seeds:start -->
- [rep] **The Hedge Maze rep** — a clipped topiary maze ARCHWAY: a low broad densely-clipped green hedge mass pierced by one dark arched mouth receding into the labyrinth, two stubby topiary finials capping the corners; cool path-light pooled deep in the mouth is the emissive glow · aspect:mound · room:daedalus · accent:#7fc98a (sown #364 · contest #3)
- [rep] **The Hall of Mirrors rep** — a glass PRISM on a low optical bench, a thin white beam striking one face and fanning out the far side into a live spectrum band (the dispersed rays are the emissive accent — bloom at night, recede to a faint ghost by day; a barely-there hue-drift keeps the light alive) · aspect:horizontal · room:hall-of-mirrors · accent:#e0664f (sown #364 · contest #3)
- [rep] **The Engine Room rep** — a beam-engine A-FRAME standing a big brass-rimmed spoked FLYWHEEL at one side, a rocking walking-beam pinned across the top, a connecting-rod dropping to a stubby cylinder; warm-amber heat at the firebox mouth is the emissive glow (PREP: re-judge aspect from rendered proportions — vertical if the A-frame dominates, horizontal if the flywheel+beam spread wins) · aspect:vertical · room:engine-room · accent:#ffb24a (sown #364 · contest #3)
- [rep] **The Deep Hearth rep** — a slim cut-away basalt CHIMNEY-SECTION revealing a glowing magma conduit climbing through banded strata, an ember bloom at its foot; the molten conduit is the emissive glow · aspect:vertical · room:the-deep-hearth · accent:#ff7a3c (sown #364 · contest #3)
<!-- ✝ BLOOMED #351: The Lodestone rep → the-gate/scene.js drawRepLodestoneHall + rooms.… · after a5cc3c3 -->
<!-- ✝ BLOOMED #371: The Glasshouse rep → the-gate/scene.js drawRepStrangeGarden · after 39ea07d -->
<!-- ✝ BLOOMED #377: The Map Room rep → the-gate/scene.js drawRepCartographer + rooms.js · after d332120 -->
<!-- ✝ BLOOMED #384: The Arcade rep → the-gate/scene.js (drawRepArcade) + rooms.js · after 60429d8 -->
<!-- ✝ BLOOMED #391: The Study rep → the-gate/scene.js drawRepVerse · after 32a8ba5 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit





### cross
- [cross] **The Same Straight Line — a jar of drifting beads and a mold of cooling metal are both solving ONE mean-value law.** SHARED CAUSE: the discrete mean-value recurrence P(k)=½P(k+1)+½P(k−1). LEFT (pop-genetics): the Conservatory's Drift Jar already PROVES via martingale that fixationProb(p)=p — a LINEAR exit probability. RIGHT (potential fields): the Foundry's Casting Floor relaxes to the one harmonic field its Dirichlet rim allows, oracle the LINEAR RAMP to 1e-6/1e-9. ONE brass dial sets both absorbing/Dirichlet endpoints; drag it and BOTH the fixation-vs-start-fraction curve AND the mold's edge-to-edge temperature profile trace the IDENTICAL straight line. CRUX (planter, machine-ε): over a grid of endpoint pairs/pool sizes the Drift Jar's large-ensemble fixation fraction and the Casting Floor's harmonic solution agree on P(k)=k/M to a LABELED ensemble tolerance; the always-on unconditional guarantee is both satisfy the interior mean-value defect ‖residual‖∞ → 0 to <1e-9 (frame 'same line' honestly as ensemble→harmonic limit, sampling-tol vs exact defect). NEG-CONTROL: turn on BIAS — selection s≠0 in the jar OR a Poisson source ρ in the mold — and the line BENDS. The estate's FIRST genetics×physics cross (all 14 built crosses are physics×physics or physics×number-theory); deepens Conservatory × Foundry. grep-confirmed disjoint. (sown #390)
- [cross] **The Three Gaps They Share — a light ray in a mirrored box AND a clock-hand stepping by an irrational both land in only THREE gap-lengths (Steinhaus three-distance).** ONE brass dial sets a single irrational α (the only shared cause): LEFT a billiard ray launched at slope α drops glowing marks along a mirrored box's wall (Hall-of-Mirrors register); RIGHT a hand drops a dot every α-turn of a circle (number-theory register, kin to best-rational). PLAYED form: drag α, then GUESS the gap-count (2 or 3) before the reveal colors them — two DISJOINT cores (a billiard-unfold · a fractional-part sort, neither calling the other) yield the IDENTICAL gap multiset. CRUX (planter, machine-ε): for all N≤400 over a grid of α plus 1e5 random irrationals the sorted gaps have ≤3 distinct values AND (when 3) largest = sum of the two shorts to <1e-9 (the always-on guarantee); the LABELED-exact crux is that the count drops to exactly 2 precisely at the continued-fraction convergent denominators q_k (tying straight to best-rational/euclid-engine); pin α to a finite-precision rational approx with a documented ε. NEG-CONTROL: a RATIONAL α=p/q collapses after q marks onto q EQUAL gaps and the cycle closes — one length only, the 'irrational' hypothesis made visceral. grep-confirmed gap (zero three-distance/Steinhaus piece; the empty cross fence's best use — all 14 built crosses are physics×physics, so this is the FIRST number-theory cross). (sown #375)


### curation


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Membrane Cast — bend a wire frame and watch a taut skin spring across it, settling to the ONE surface its rim allows.** DEEPENS The Foundry, riding casting-floor/core.mjs UNFORKED (the frame is the Dirichlet rim, a punched hole a WALL cell, the settled height the harmonic field the core already relaxes). Bend a closed wire loop up/down and a stretched soap-skin springs across it as a real 3D RELIEF surface — the wing's FIRST (Casting Floor / Still Pond are flat top-down); pull two edges opposite and it SADDLES; punch a hole and the skin drapes around the stone. TOUCHABLE: grab a rim node, drag its height, the whole skin re-settles live. CRUX (planter, exact/labeled): in the small-deflection limit the height is HARMONIC (∇²z=0) — the relaxed skin matches the core's closed-form sine-plate oracle z=sin(πx)sinh(πy)/sinh(π) over the interior to tight tol, and (max principle) no interior peak/dip forms between the wires — a drop of water always rolls to the rim. NEG-CONTROL: label it the LINEAR membrane, distinct from the estate's existing catenoid soap-film ROOM (the full nonlinear minimal surface) — a different math object. A 4th potential-field bench that can only live WITHIN the Foundry's shared core, gathering under that roof — the wing grown a new FORM. grep-confirmed gap (no planar-membrane/drumhead-Laplace bench). (sown #390)
- [bench] **The Forbidden Float — a graphite slab hovering over magnets, and a top hanging in empty air; the levitation Earnshaw proved impossible.** Lay a thin pyrolytic-graphite tile on a magnet checkerboard and it FLOATS a millimeter up — slide it frictionlessly with a fingertip; a toggle swaps to a spinning Levitron top that HANGS until its spin decays and it crashes (a spin-window gauge shows the stable band). FORM: a real touchable hover, not a field-line plot. CRUX (planter, exact/labeled): Earnshaw proved exactly that fixed dipoles give a HARMONIC potential (∇²U=0 in free space) → no local minimum → no static levitation; verify every grid equilibrium is a saddle (a Hessian eigenvalue asserted < 0). The two legal escapes, scoped to verifiable claims: (a) diamagnetic χ<0 sits in a field-strength MINIMUM (allowed because |B|² CAN have a min); (b) the Levitron's spin gyroscopically averages the tilt away inside a labeled empirical band [ω_lo, ω_hi]. NEG-CONTROL: a NON-spinning paramagnetic (χ>0) top placed at the 'equilibrium' always falls/flips — confirming the saddle; only χ<0 OR sufficient spin escapes. grep-confirmed gap (zero earnshaw/levitation/diamagnet/Levitron estate-wide). DEEPENS the Lodestone Hall — six induction benches but no levitation bench; kin to iron-filings & the Curie Dial. (sown #375)
- [bench] **The Shadow Zone — fire a quake and watch the liquid core SWALLOW the S-waves: the silence that proves the core is molten.** Tap the Deep Hearth's globe cutaway to set off an earthquake; fast blue P-waves and slower red S-waves bloom from the focus, refract through the mantle's velocity-with-depth, and ring a belt of seismographs around the surface — but the S-fan DIES at the liquid outer-core boundary (a fluid carries no shear), leaving a wide S-shadow, while the P-fan refracts THROUGH the core leaving its 103°–143° P-shadow ring. FORM: a touchable globe + a ring of pinging seismograph traces where the dark gap between pings IS the readout; NOT a travel-time plot (that's a quiet side-rail). Drag the focus and the shadow belt swings with it. CRUX (planter): rays traced by the seismic eikonal / Snell ray-parameter p = r·sinθ/v(r) held constant through a layered v(r); the S-amplitude through the outer-core layer is identically 0 (μ=0 ⇒ no shear wave) — the missing rays ARE that exact zero (the unconditional machine-ε crux); the 103°–143° P-shadow angles reproduce against a PREM-style Earth model within a LABELED tolerance (the velocity-profile-dependent fit, honestly labeled, not claimed exact). NEG-CONTROL: flip a SOLID-core toggle (μ>0) — the S-fan refracts straight through, the shadow CLOSES, every station pings; the shadow exists ONLY because the core won't carry shear. grep-confirmed gap (no built seismic/shadow-zone — only the Deep Hearth's own named-dark niche). DEEPENS the Deep Hearth 1→2 benches; reuses its exported section.mjs spine + depth ribbon. (sown #375)
- [bench] **Slow Creep — the same mantle rock that SHATTERS under a hammer OOZES like cold honey under a glacier (one rock, two tempers of time).** A block of the Deep Hearth's rock takes a load you apply at a SPEED you choose: whack it fast and it cracks like glass (elastic, then brittle fracture); lean on it slow over 'geologic' time and the same block FLOWS, its marker grid creeping without ever breaking. FORM: a touchable rock you load + a TIME-RATE dial that redraws the block live (a folding grid creeps or a fracture snaps) — NOT a stress-strain curve. Sweep the rate and the rock crosses from solid-that-breaks to fluid-that-flows at one threshold, the verdict decided purely by how fast you push vs how fast it relaxes. CRUX (planter, exact): a Maxwell viscoelastic body governed by the Deborah number De = τ_relax · strain-rate; De≫1 ⇒ elastic/brittle, De≪1 ⇒ viscous flow, crossover at De≈1; the closed-form Maxwell relaxation (stress decay e^(−t/τ)) matches the stepped numeric integration within machine-ε, and the brittle/ductile verdict is read DIRECTLY off De. NEG-CONTROL: a PURELY ELASTIC block (τ→∞, De always ≫1) never flows at any rate — only springs back or fractures; the creep is what a finite relaxation time buys. grep-confirmed gap (the only Maxwell hits are Maxwell-Boltzmann gas — different Maxwell). DEEPENS the Deep Hearth (its literal-rock answer to the conduit's gas-driven 'two tempers' — distinct physics: shear-relaxation time, not Henry's-law exsolution; give it a clearly distinct subtitle). (sown #375)
<!-- ✝ DECAYED #390: The Floating Table · after b823656 -->
<!-- ✝ BLOOMED #392: Re-soul the Colophon → colophon.html + colophon/ · after bad7c7a -->
<!-- ✝ BLOOMED #393: The Value of a Cut — Blue-Red Hackenbush, the game whose POSITION IS A… → the-value-of-a-cut/ · after 4b012c8 -->
<!-- ✝ BLOOMED #394: The Unstirring — smear a dye blob into a spiral, crank it back, and the… → the-unstirring/ · after cd1629d -->
<!-- ✝ BLOOMED #396: The Rewind Shelf — a themed walk of the pieces that FORGET how they beg… → the-rewind-shelf/ · after 8ab10f5 -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 9 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 7 benches — incl. two games, the Latin Square #38 & the Sandpile #56) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 14 benches) are all built and
**open to grow**. The two **grounds big-swing** wings are also built & open to grow: the **Conservatory**
(living-systems, open & growing — 7 benches — bloomed #31) · the **Alchemy Lab** (chemistry, 2 live benches +
3 planters — bloomed #41, *conservation of matter as a balance you operate, `A·c=0` at the level beam*;
Titration bloomed #46, *pH(V) from charge balance, the flask flips pink a hair past pH 7*).
Growing one = a fresh **garden `exhibit`/`bench`** seed for a new bench (never a grounds
swing, never a rebuild). The full inventory + each wing's "what's already shipped" lives in
**NOTES.md** ("Built so far" + the 🗝️ hidden inventory — **grep it before building any secret**).

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. **Grep the 🗝️ hidden inventory in NOTES before building one** (a public Enigma was nearly rebuilt before catching the hidden one). All 13 front-door pages drop their `ws:seen:<id>` on a direct visit; guarded by `forge --audit-seen`. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats | **COMPLETE ties — do not pad:** the 6-wing `allComplete` capstone is byte-frozen (new groups stay ADDITIVE via the `FEATS` array, never join `WINGS`); **The Optician** (the Hall's 9 feats) is complete (the Hall grows benches, NOT feats). Two garden seeds grow it: *make discovery an EVENT* + *chart the Cavern asterism / Numerologist* (above). |
| **The Quantum Drift** (`cavern/`) | open & growing — 9 Q-benches + 1 sonifier | A public in-page spatial reveal (walk a Newtonian + an Einsteinian bench). Spans bound states · bands · central force · scattering-in-time · spin measurement (Stern–Gerlach, #43) — no single named-next; grow with a fresh quantum-fact exhibit (identical-particle exchange is the live `[cross]` above). |
| **The Hours / The Workshop Mystery** | not yet built — grounds seeds above | Each would be a new exploration layer. |

---

*When a build ships: prune the grown seed (bloomed, provenance → CHANGELOG/worklog). When a plan ends:
prune decayed seeds clean. **Either way the publisher runs `node seedbed/gauge.mjs record …`** — it is
the only thing that touches `seedbed/state.json` (cycle, the last-plan/last-swing stamps, the contest
counter, the decay tallies). No hand-maintained fuel/builds line lives here anymore. Per-cycle history →
[worklog/INDEX.md](worklog/INDEX.md).*
