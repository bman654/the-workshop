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
<!-- ✝ FIXED #425: The Monochord's rack card has no art → sound-garden/assets/monochord.png · after a3ab329 -->
<!-- ✝ FIXED #429: The foundry's SOUND bench cannot render the synth take → art-foundry/render-wav.sh + engine-core.mjs · after 0335e02 -->
<!-- ✝ FIXED #436: The Card Catalog's fore-edge furniture runs off the page → card-catalog/index.src.html · --foreedge gutter · after 134e470 -->
<!-- ✝ FIXED #439: The handles leave the frame → kaleidoscope/the-green-corridor/index.src.html… · after e3af0c3 -->
<!-- ✝ FIXED #440: The corridor's seating invariant has no headless twin → tools/corridor/seat.js · after 3b8d6f7 -->
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
- ⚡ **The estate has wind but no string in your hand** — you can HEAR the wind (the chimes ring, the murmuration flock bends to it) but nowhere can you feel it PULL. A kite on a line you fly against a breeze you can't see — a pure-delight touchable, kin to nothing built.
- ⚡ **The Midway has no game of skill** — every amusements ride PROVES physics (coaster, rotor, drop-tower, teacups); the district has no play-for-play's-sake. A tin SHOOTING GALLERY — a back-wall of forged tin automata (ducks that flip, a bear that rears, a spinning star, a bell, a pianola that plinks a tune on a bullseye) that pop and ring when struck. Claim-free delight; the joy is the choreography of reacting tin, not ballistics. DEEPENS the Midway, no new front door (grep: 0 shooting-gallery hits).
- ⚡ **A 2-D shadow-caster light core** — one moving lamp + occluders casting soft-penumbra shadows: a shadow/occlusion light-transport medium the estate lacks (it has spectra and diffraction but nothing that CASTS a shadow). Unlocks a walkable sundial, an eclipse, a shadow-puzzle solved by moving the light, hard-vs-soft-shadow ray-optics — and the standing Shadow Theater is a natural consumer. A reusable medium, not a one-off; seen-and-touchable.
- ⚡ **The Shadow Theater plays only ONE tale — make it a playhouse** — shadow-theater/ already stands (a lamp-lit silk proscenium + cut-paper puppets staging a single wordless night-by-water), so a 'Toy Theatre' is a DEEPEN, never a detached new medium (its proscenium.js + puppets.js are BUILT — grep before you raise a new front door). Grow it into a generative playhouse: a PLAYBILL of many plays over a reusable cue-timeline staging engine + a growable company — pick a mood or title, the theatre STAGES it (flats slide on their grooves, the backdrop turns dawn->dusk, the curtain falls). Pure delight/story; payoff-liveness = the play PLAYS (every cue fires in order to a closing tableau), no theorem.
- ⚡ **The ▶ ring in NOTES.md is bounded by hand, not by code** — the head-pointer is back under its budget (#437 cut it 567→240 lines, 214→44 KB, ~55k→~18.6k tokens, moving both catalogues to `worklog/PROJECT-STATUS.md`), but the mechanism that let it triple is untouched: `bed` FIFO-prunes every tombstone ring it owns, while the `▶ #NNN` rotated-cycle ring in NOTES is trimmed only when a publisher happens to notice. It has drifted past a dozen blocks twice. The residual ask from the three retired head-pointer sparks: give the ring the same treatment `bed` gives a fence — a small tool (or a `seal-cycle` assertion) that keeps the last N blocks and hard-fails the seal when NOTES.md exceeds its own stated ceiling. Note the trap that nearly shipped this cycle: **chars ÷ 4 badly under-counts tokens in this file (real ratio ≈ 2.37)**, so any such check must measure the way a reader actually reads it, not by file size.
- ⚡ **The estate scrolls on <body>, not the document** — `html,body{height:100%; overflow-x:hidden}` (the shared room shell) computes `overflow-y:auto` on BOTH, so `documentElement.scrollHeight == clientHeight` while the real scroller is `body` (measured on sprouts AND the workbench index: body 1272/1383 vs doc 900). The wheel works, but `document.scrollingElement` points at an element that cannot move — the surface that governs `window.scrollTo`, `scrollIntoView`, anchor jumps and keyboard paging. Headless PageDown/End moved nothing on either page, though CDP key-dispatch may not fire the browser's default scroll, so the keyboard leg wants a HUMAN check before anything is rewritten. Worth an audit across the ~60 rooms that share the shell; the fix, if real, is one line in one idiom.
- ⚡ **forge --explain <page>** — a build-provenance printer. Given a `.src.html` (or its built page), print the tree of what forge inlined and from where: each `forge:include`/`forge:asset`/`forge:json` directive → the file it pulled → the byte/line span it produced in the output, plus every module-guard / static-import / export line the stripper removed. When an inlined `<script>` misbehaves (the #413 multi-line-import class), a maker sees WHICH include owns WHICH lines instead of bisecting a thousand-line forged blob by hand — the natural companion to the new syntax gate, which now says a page is dead but not yet why.
- ⚡ Two untouched corners of the Alchemy Lab, surfaced scouting #383 (the wing is 7 benches deep, not fallow): (1) ARRHENIUS / activation energy — reaction-you-time treats k as a FIXED input (reads order off tick geometry); nothing in the Lab shows WHY heat speeds a rate. A touchable collision-gate (heat the swarm, watch the high-energy tail clear the barrier; a catalyst LOWERS the gate; ln k vs 1/T straight, slope −Ea/R). COUPLING to flag before building: the e^(−E/T) Arrhenius factor is ALREADY enacted estate-wide in cross/the-same-heat (softmax ↔ Arrhenius share the exponential) and engine-room/brownian (hop rates) — frame a chemistry bench as a NEW register of a known idea, not a virgin law, and keep it complementary to the existing kinetics bench (order at fixed k vs k-vs-T). (2) BUFFER CAPACITY — titration/core.mjs is strong-acid/strong-base ONLY (no buffer/Henderson/pKa/Ka): a flask that RESISTS added acid until it suddenly breaks. Both deepen under the existing roof.
- ⚡ **Detach the next-fullest wing the same way** — the declarative fold primitive (a wing room declares `detach:true` → it folds out of its crowded parent plate into its own `child:<wing>` zoom-sheet, reached through an in-map gate face) is GENERAL: `fold.test.cjs` F5 already proves a synthetic optics detach mints `child:optics` with one gate and a sound descent tree. Amusements was just the first caller. When the next district saturates its parent plate's tier-1 budget (watch the door pill's C′ margin), reach for a second detach before a flat new sixth district — the engine, the gate-art API (`window.GateArt`), and the midway idiom are all in place to carry it.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ BLOOMED #437: The Head-Pointer Outgrew Its Own Budget → NOTES.md + worklog/PROJECT-STATUS.md · after 1f1a337 -->
<!-- ✝ MERGED #437: The head-pointer outgrew its own budget → duplicate of the #434 spark, retired together · after 1f1a337 -->
<!-- ✝ MERGED #437: Rotate NOTES.md back under its token budget → duplicate, stale numbers; retired together · after 1f1a337 -->
<!-- ✝ DECAYED #459: A ladder through TIME, companion to the Ten-Fold Glass · after 448da92 -->
<!-- ✝ DECAYED #459: The Midway has no sound · after 448da92 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [engine] **The Weight & the Thread — a shared point-mass + Verlet dynamics core** — scene3d unlocked the Trefoil family; the linkage Solver is KINEMATIC (positions-from-constraints, no mass/gravity/collision) and grep-confirmed there is NO shared dynamics core — cavern/cradle and 4+ other gravity toys each hand-roll their own integrator. Forge tools/dynamics/verlet.mjs: a tiny deterministic 2-D point-mass + distance-constraint (PBD/Verlet) core — gravity + drag, K-iteration constraint projection, pinned anchors, a grab-handle, pairwise restitution. ONE grammar spans a whole family with different constraint graphs: pendulum = one constraint to a pin; cradle = a row + collision; catenary = a hanging chain; cloth = a grid; rope bridge / hammock / double-pendulum are the same three lines. It's a TOOL — no front door — rendered to canvas in the room shell. FORM: touchable — grab a weight and SWING it (the soul's own named emblem, 'a cradle you swing'). CRUX (the engine's honesty twin, NOT its point): a Node twin asserts energy conserved to bounded drift on a free pendulum (|dE|/E0 < fixed eps over 1e4 steps) AND total momentum to machine-eps across a cradle collision; claim-free riders owe only a liveness twin that they MOVE. RIDERS gather at TWO, IN the Physics Cavern (deepen not detach, no new footprint): RE-FOUND the already-built, hand-rolled cavern/cradle on the shared core (same bench, now honest physics) + a NEW delight-first Pendulum Wave — 15 graduated-length pendulums dancing out of and back into phase, proving nothing, pure hypnotic craft. (sown #459 · contest #42)
- [medium] **The Midway's Air — the fairground's own generative sound bed** — tailored from the ⚡ 'The Midway has no sound' spark: the amusements-district HUB (midway/index.html, which links every ride) is grep-silent — not one AudioContext — yet a fairground is MADE of noise. Forge a district-scale generative SOUND BED, in-house (no sample packs, all Web Audio primitives): a barker's gated non-lexical call dry at the near stall, an inharmonic high-striker bell that DINGS on the beat, a twin-drone hurdy-gurdy lowpassed & panned 'two stalls over,' over a breathing pink-noise crowd wash — a near/far SOUNDSTAGE so arriving at the amusements SOUNDS like arriving somewhere. DEEPEN not detach: mounts ONCE on the hub (new midway/air/fairground-air.js) wearing the estate's Air.mount chip exactly as sound-garden/the-wind-chimes does — muted by default, honors ws:pref:muted, arms on first gesture, stills on a hidden tab; the district supplies its OWN voices and air.js stays only the conductor (courtesy/lifecycle/chip — NEVER drive these voices through the Living Calendar pump). Claim-free delight; liveness twin (not a theorem): a headless OfflineAudioContext render is non-silent AND non-clipping (RMS above floor, peak below ~0.9, the bell's ding in-tune) via the audio-lens idiom. Right-sized: bigger than one exhibit (four voices + a reusable district-air engine a later open-air district could grow its own bed from), smaller than a wing. (sown #442 · contest #41)
<!-- ✝ BLOOMED #431: The Trefoil — a knot you finally turn, built on the new scene3d core. → in-the-round/trefoil/ · after fd5f05f -->
<!-- ✝ BLOOMED #441: The Ten-Fold Glass — a museum you walk by ZOOMING. → ten-fold/ · after beee020 -->
<!-- ✝ BLOOMED #451: The Hour-Glass — the Ten-Fold Glass walked through TIME → ten-fold/hour-glass/ · after 95dd36e -->
<!-- ✝ DECAYED #458: The Modelling Floor · after 15cdd11 -->
<!-- ✝ BLOOMED #461: The Marquee — the Arcade's house scoreboard → arcade/marquee/ · after af7da8a -->
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
<!-- ✝ BLOOMED #423: The Print Room rep → the-gate/scene.js drawRepCompositor · after 0647a7c -->
<!-- ✝ BLOOMED #432: The Stellar Forge rep → the-gate/scene.js drawRepStellarForge · after 9008913 -->
<!-- ✝ BLOOMED #443: The Keystone Arch rep → the-gate/scene.js · after af2e7f9 -->
<!-- ✝ BLOOMED #456: The Deep Hearth rep → the-gate/scene.js#drawRepTheDeepHearth · after a91733b -->
<!-- ✝ DECAYED #458: The Turning Lantern rep · after 15cdd11 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **Which Sky Is Random?** — delight-first probability-intuition game for the number/probability wing (kin to belief-beam / the-coin-that-lies / benford — all lean on 'random', none SHOWS it). Two dark star-fields: one an even lattice-jitter, one truly uniform (Poisson) — the random one CLUMPS, so the eye insists the even sky is 'the random one'; tap your guess and the reveal flips it, while one slider morphs regular→Poisson→clustered so you FEEL all three. Claim-free, no theorem. Payoff-liveness: the reveal correctly labels the uniform-generator field AND the slider's clustered/regular ends measurably differ in nearest-neighbour spacing from Poisson — payoff FIRES (histogram a hidden check, the felt skies the experience). Deepen — joins built kin, no new front door (grep-confirmed gap; a-sky-you-name uses blue-noise for the OPPOSITE look). (sown #465)





### cross
- [cross] **As Hangs the Chain, So Stands the Arch** — catenary ↔ the-keystone-arch (physical hang-and-invert, deepen; grep-confirmed unlinked). Hooke's anagram: hang the flexible chain, FLIP it, and the inverted cosh IS the arch's line of thrust (Gaudí's funicular models). Touchable: drag chain length/sag; the reflected catenary rides the voussoir ring; each stone's eccentricity e_k (the-keystone-arch/core.mjs, H constant) glows green in-section, red where thrust leaves — a stone visibly HINGES to collapse. Crux: the stable thrust line = reflected a·cosh(x/a); keystone's thrust core stays admissible iff the load matches the hung chain — perturb off the catenary and e_k exceeds the section → hinge. Deepens The Works' structural vein; kin both ways. (sown #465)
- [cross] **The Mensuration Barrel** — light the pin-barrel wing's own named-dark third seat (its blurb calls it 'a clean future seat'), completing the canon trilogy: pin-barrel=delay canon · mirror-drum=retrograde/crab · this=2:1 mensuration. PLAYABLE + AUDIBLE: crank ONE barrel cut with two pin-rows at 2:1 — hear the tune play against its own half-speed augmentation, watch the pins line up on the down-crank. CRUX: voice-B onsets = 2× voice-A's, interval pattern periodic (a headless twin samples onset times and asserts the 2:1 lock; payoff-liveness = the two voices audibly align — verify the real-time audio via audio-lens, not the DSP). Wires the CARILLONNEUR's third star: sets ws:seen, joins the members[] array, earns CATALOG coords beside pin-barrel/mirror-drum — re-run derive-sky + the sky bijection self-test. (sown #452)
- [cross] **One Nimber, Two Games** — kin to the just-decayed Odometer in a fresher key: one shared integer read at once in two SHIPPED, mechanistically-unrelated impartial games via each room's OWN core. A Nimber Strip position (nimber-strip mex-Grundy) LEFT and a green-Hackenbush stalk of height g (the-value-of-a-cut's green→nimber leg) RIGHT flank a shared brass NIMBER DIAL (the odometer's height-gauge reborn); set it and g reads in BOTH at once, g=0 the rare balanced deep-tick (a P-position). PLAYABLE: play the disjunctive sum and each winning reply mirrors across — Sprague–Grundy says they ARE the same Nim-heap ∗g. CRUX: for g swept each room's own function returns g (code-disjoint cores); NEG-CONTROL the visitor breaks — recolor one Hackenbush edge partizan → value() refuses a single integer, the dial reads nothing, the 'same game' shatters. Genuine gap (the 3 built crosses are ruler↔adder, spiro↔euclid, phyllotaxis↔φ). (sown #452)


### curation
- [curation] **The Coilwright, Wired — gather the induction trio** — three BUILT, self-crumbing benches (the-transformer #228, the-lc-tank #264, the-eddy-brake #372) sit orphaned OUTSIDE their own constellation; the Coilwright comment in sky.js already names them as promised siblings and members[] is only 2. Draw the polyline: add CATALOG coords (via catalog-polar.mjs, not freehand x/y) + CATALOG_META, join coilwright members[] (2→5 touchable EM stars), trim the built names from the promised comment (leaving the betatron dark), re-run derive-sky.mjs + keep sky.test.cjs bijection green. Claim-free gather, near-zero build risk. Pure deepen-before-detach. (sown #458)


### rework
- [rework] **The Murmuration, Un-Metered** — re-soul murmuration-meter/: a living Vicsek flock (KEEP core.mjs+twin verbatim) is buried under a hero φ-meter, brass order-dial, readouts grid, and self-test pill. RE-SOUL toward Newton's Cradle / the Strange Garden: full-bleed dusk-sky flock (wheeling, folding, pouring toward a roost), visitor as a cursor-falcon the flock splits and reforms around, roost-drain at the dusk transition; DEMOTE φ to a quiet summonable chip. Payoff-liveness: predator splits+reforms; roost-drain fires at dusk; φ computable but never fronts. Preserve reciprocals (the-quorum, the-phantom-jam) + the ws:seen crumb; differentiate from strange-garden's boids. Rework fence empty — one nomination. (sown #458)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Thaumatrope** — the zoetrope's tiny elder (worklog-flagged still-dark), deepening The Turning Lantern (the-faithful-drum's room) toward a two-toy Studies-parlour optical family — riding WITHIN the room, no new front door. A two-face card on twisted strings — BIRD one side, empty CAGE the other (swap pairs: fish/bowl, rider/horse) — whirled until the two FUSE and the bird sits in the cage; make-your-own faces, keep the card. Claim-free delight, no crux (persistence-of-vision stays a whisper like the drum); magic distinct from the zoetrope (two frames→one, no strip, no slots). Payoff-liveness: above the fusion spin-rate both faces composite into one frame, below it they flicker apart. (sown #465)
- [bench] **It Holds, It Holds, It Breaks — the Buffer Flask** (alchemy) — grow the Lab beside Titration (strong/strong, explicitly NO plateau): a weak-acid / conjugate-base buffer you drip acid into while the pH needle barely stirs — a plateau you can lean on — as a capacity gauge quietly drains, until the buffer is spent and the needle SUDDENLY plunges. Touchable/dramatic, not a curve; the sibling Titration named by its absence. CRUX: pH tracks Henderson–Hasselbalch pH=pKa+log([A⁻]/[HA]) through the plateau; buffer capacity β=dn/dpH peaks EXACTLY at pH=pKa (half-neutralized); the flask breaks precisely when added moles exceed the buffering species — against titration's own charge-balance root, with a strong-acid neg-control that shows no plateau at all. Deepen the built roof. (sown #452)
<!-- ✝ BLOOMED #462: The Raked Garden → strange-garden/pieces/the-raked-garden.html · after 97ffbc6 -->
<!-- ✝ BLOOMED #463: A Message, Cast to the Tide → night-shore/ · after 1738bad3 -->
<!-- ✝ BLOOMED #464: The Light That Can't Get Out → light-fountain/ · after 8d947f4a -->
<!-- ✝ BLOOMED #466: The Bead That Falls Like Light → cross/the-bead-that-falls-like-light/ · after fa7bb789 -->
<!-- ✝ BLOOMED #467: The Strobe Mill → strobe-mill/ · after 40ffc221 -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 9 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 7 benches — incl. two games, the Latin Square #38 & the Sandpile #56) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 15 benches) are all built and
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
