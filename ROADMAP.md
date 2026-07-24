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
<!-- ✝ MERGED #437: The head-pointer outgrew its own budget → duplicate of the #434 spark, retired together · after 1f1a337 -->
<!-- ✝ MERGED #437: Rotate NOTES.md back under its token budget → duplicate, stale numbers; retired together · after 1f1a337 -->
<!-- ✝ DECAYED #459: A ladder through TIME, companion to the Ten-Fold Glass · after 448da92 -->
<!-- ✝ DECAYED #459: The Midway has no sound · after 448da92 -->
<!-- ✝ BLOOMED #481: The Shadow Theater plays only ONE tale — make it a playhouse → shadow-theater/ · after b2d5b75b -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [room] **The Kite — the wind you can feel PULL** — tailored from the ⚡ 'the estate has wind but no string in your hand' spark: you HEAR the wind in the Wind Chimes and SEE it bend the Roost's flock, and the aerodrome MEASURES lift with proofs — but nowhere does the wind PULL BACK; grep-confirmed, no felt-wind touchable exists. An open-air, claim-free DELIGHT (kin to the verse oracle and the poster press — an instrument with NO proof, NOT a ballistics readout): grab a handle at the frame's base and fly a kite on a line against a breeze you cannot see — haul the string and it climbs while the line snaps bar-taut and thrums; give slack and it stalls, luffs and dives; sweep the handle and it carves; hold against a rising gust and you feel the load build in how the handle jitters and the line whitens. No numbers — the string IS the instrument you read. RIGHT-SIZED (a swing, not a new engine): reuse the Verlet distance-constraint solver already in strange-garden/pieces/cloth.html as the literal string (a short point-mass chain, stiffness = relaxation passes) anchored to your dragged handle, its end mass the kite carrying a simple lift/drag-vs-tilt against a gusting WindField (the same air.js idiom the Wind Chimes drive, plus a manual breeze). DEEPEN-vs-DETACH — DETACH, holding a sibling's hand: open-air flight honestly wants its own front door orbiting the Manor OUTSIDE (folding it into the sound-district Chimes or the standalone Roost would cross homes and functions), so rather than raise a grand 'Aeolian' roof over three single dots, weave a light 'three ways to know the wind — hear/see/feel' cross-thread linking Chimes ↔ Roost ↔ Kite (no new wing; deepen-before-widen; the family earns its engraved name only if a fourth wind-piece ever arrives). ACCESSIBILITY: convey tension by more than motion — line colour/thickness, a thrum, a shiver — since 'feel' can't be literal on a screen. OPTIONAL grace-note payoff (build MAY ship pure delight and skip it): a few ribbon-rings drift down the gust — thread the kite through them in order and a latch FIRES a bloom of streamers + a chime. Payoff-LIVENESS twin (never a theorem): a headless harness feeds a scripted handle-path + a fixed gust seed and asserts the ring-latch transitions unfired→fired EXACTLY when the kite's end-point has passed through every ring in sequence — proving the payoff FIRES, not that any aerodynamics is 'correct'; the real crux is delight-liveness — verify on a REAL input-level drag (dispatchEvent is blind to pointer-capture), that the string actually LOADS, thrums, dives-on-slack and climbs-on-haul. (sown #483 · contest #45)
- [medium] **The Field & the Flow — a paint-the-field 2-D continuum-PDE core (+ The Relaxation Table, a room where you brush a boundary and release a tracer to ride the steady state)** — tailored from the ⚡ 'A field you SCULPT with a brush, then release a tracer to ride it' spark: the estate simulates PARTICLES (tools/dynamics — Lagrangian point-masses + constraints, #471) and freezes one nonlinear surface (soap-film's minimal surface), but has NO Eulerian continuum FIELD anywhere — nothing that stores a value on every grid cell and lets you AUTHOR it, watch it relax or propagate, and drop something in to ride it; grep-confirmed no shared PDE solver in tools/. Forge tools/field/ (pure in-house canvas, DOM-free ESM, Struct-of-Arrays, forge:include-inlined with a Node twin field.test.mjs — the one-core-no-fork discipline of tools/dynamics): a scalar field u(x,y) with three engines sharing ONE brushable boundary — Laplace relaxation (Jacobi/Gauss–Seidel toward the 4-neighbour mean → harmonic steady state), heat diffusion (forward-Euler u_t=α∇²u), and wave (leapfrog u_tt=c²∇²u) — each with a Courant/stability clamp so a painted-in extreme can't blow up (a build requirement, not an afterthought). The signature knob every consumer inherits is the thing you PAINT: a brush laying Dirichlet cells (a pinned hot/cold wall or height) or Neumann cells (a free/insulated edge), plus the engine's α or c. FORM (the landing is a ROOM you touch, never a plotted curve): **The Relaxation Table** — brush warm and cold walls and a pinned island into a blank pane, WATCH the interior relax cell-by-cell into a glowing steady state (colour = value, isotherms as contour bands), then RELEASE a tracer that rides the gradient downhill, threading the heat-flux streamlines perpendicular to the isotherms through a maze of your own painted heat. DEEPEN, not detach: tools/field/ is a LIBRARY with no front door of its own (like tools/dynamics); The Relaxation Table is its landing room, gathering in the Cavern as a genuinely new continuum bench holding a named sibling's hand — the wing earns its engraved name only when its second hall lands (a Wave Tank, a Heat Bench, or a walkable Laplace maze — all named future consumers on this same slab, which is why it's a medium and restores the estate's collapsed 1-room→many-benches hierarchy). Distinct from strange-garden (watch-only, no brush, no authored field) and orbit-house (one particle in a fixed potential, no field); the linearized harmonic cousin of soap-film (a neighbourly nod, not a merge). THE CLAIM, each with a RED control (field.test.mjs): the harmonic MEAN-VALUE PROPERTY (a relaxed interior cell = its neighbour-ring mean within eps; an un-relaxed field FAILS), the MAXIMUM PRINCIPLE (a harmonic field's extrema live only on the boundary; an interior source violates it), and WAVE SPEED (a crest advances exactly c·dt per Courant-stable step; a wrong c drifts off). Payoff-LIVENESS twin (the experience firing, not a theorem): the headless render asserts the released tracer's path stays monotone-descending in u (it never climbs the potential it rides) AND the 'settled' latch that greenlights the release fires ONLY once the residual gate is actually met — so a visitor can never release a tracer onto a field that hasn't truly relaxed. Right-sized as a real big swing (a reusable continuum core + its first inhabited room, three more rooms already in reach); the builder MAY baton it — ship the Laplace engine + The Relaxation Table first and stub wave/heat behind the same API, the medium's value surviving a phased first hall. (sown #483 · contest #45)
- [medium] **Umbra — a 2-D soft-shadow light-transport core (+ a shadow puzzle you solve by moving the light)** — tailored from the ⚡ 'A 2-D shadow-caster light core' spark: the estate throws light (umbral-vault), bends it (diffraction, caustics), splits it (spectroscope) but nothing honestly CASTS a shadow, and the Shadow Theater only FAKES one (a per-puppet blur R_L·(m−1), index.html:1245 — flat puppets, fixed depth); there is NO shared light/shadow solver in tools/. Forge tools/light/ (pure in-house canvas, kin to tools/dynamics from #471): a real 2-D area-light visibility solver — disc lamp of radius R + polygon occluders → illumination = the fraction of the source disc left unoccluded (umbra 0, penumbra partial, lit 1) by N-sample percentage-closer visibility. Signature knob every consumer inherits: source RADIUS — R→0 razor shadows, R grows and the penumbra blooms (hard-vs-soft as ONE slider); multi-lamp composites for free. FORM (landing = a GAME, not a graph): a shadow PUZZLE solved by MOVING THE LIGHT — drag the lamp until the soft shadows of scattered cut-shapes overlap into a marked target silhouette, the darkest umbra-cores stacking only when the light aligns. DEEPEN not detach: the core is tools/-level with NO front door of its own (a medium is a library, like tools/dynamics); the landing exhibit gathers WITH the Shadow Theater under its roof (a lighting bench beside it), and the Theater is deepened to consume the true field (its puppets.js contours become the first occluder set — free art reuse). Near-free future consumers on the same core: a walkable ECLIPSE (total↔annular ring as the umbra cone falls short) and COLOURED shadows (three RGB lamps, a cyan shadow where only red is blocked). Payoff-LIVENESS twin (not a theorem): headless render asserts the umbra/penumbra boundary lands where similar triangles predict — penumbra half-width w = R·d_receiver/d_lamp — and the puzzle's 'solved' latch fires ONLY at the geometrically-correct light position. (sown #472 · contest #44)
<!-- ✝ DECAYED #458: The Modelling Floor · after 15cdd11 -->
<!-- ✝ BLOOMED #461: The Marquee — the Arcade's house scoreboard → arcade/marquee/ · after af7da8a -->
<!-- ✝ BLOOMED #471: The Weight & the Thread — a shared point-mass + Verlet dynamics core → tools/dynamics/ + cavern/pendulum-wave/ + caver… · after 3d16fe50 -->
<!-- ✝ BLOOMED #481: The Toy Theatre — the Shadow Theater learns to PLAY a play → shadow-theater/ · after b2d5b75b -->
<!-- ✝ DECAYED #482: The Midway's Air — the fairground's own generative sound bed · after bb14e960 -->
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
- [rep] **The Engine Room rep** — the great brass flywheel breaching the top of its brick pit, a curved brass safety rail arcing over it, a small flyball governor spinning off to one side · aspect:mound · room:engine-room · accent:#c9a24a — oldest un-repped works room (entry 307); the room's lede names 'the great flywheel'. Keep it a static front-elevation (gate reps don't animate). (sown #469 · contest #12)
- [rep] **The Numbers Room rep** — a brass-framed abacus, a counting frame of beaded rods with some beads slid up · aspect:horizontal · room:numbers-room · accent:#c9a24a — namesake + thematic anchor of the number district (entry 312); 'arithmetic truth made visible' as one touchable object. (sown #469 · contest #12)
- [rep] **The Conservatory rep** — a low domed glasshouse, iron-ribbed gridded panes over a small central roof-lantern, one potted plant pressing the glass · aspect:mound · room:conservatory · accent:#86d39a — oldest un-repped gardens room (entry 359); its lede calls it 'a generous low glasshouse'; a fresh green amid a gold-heavy shelf. (sown #469 · contest #12)
- [rep] **The Alchemy Lab rep** — a swan-necked glass alembic still, a rounded gourd over a low brazier ember, its condenser neck arcing down to a receiving flask, one glowing bead of distillate mid-drip · aspect:vertical · room:alchemy · accent:#dca74a — the archetypal what's-in-there door (entry 374, works); the gourd-and-swan-neck retort reads 'alchemy' instantly. (sown #469 · contest #12)
- [rep] **The Reckoning Cabinet rep** — a wide walnut-and-brass cabinet face, three engraved calculating dials with pointer-needles at different angles, a small hand-crank at the right edge · aspect:horizontal · room:reckoning · accent:#c9a24a — 'Six Brass Minds that Compute' (entry 424, manor); the name promises a secret machine and pays off. (sown #469 · contest #12)
- [rep] **The Contrary Stone rep** — a polished canoe-shaped rattleback celt resting on its curved belly on a small plinth, caught mid-spin with two motion-arcs showing it reverse against the push · aspect:mound · room:rattleback · accent:#e8b86b — 'a top that argues with your hand' (entry 457, fairground); pure playful delight, the object IS its own mound. (sown #469 · contest #12)
<!-- ✝ BLOOMED #443: The Keystone Arch rep → the-gate/scene.js · after af2e7f9 -->
<!-- ✝ BLOOMED #456: The Deep Hearth rep → the-gate/scene.js#drawRepTheDeepHearth · after a91733b -->
<!-- ✝ DECAYED #458: The Turning Lantern rep · after 15cdd11 -->
<!-- ✝ BLOOMED #475: The Maker's Shed rep → the-gate/scene.js#drawRepWorkbench · after fef87321 -->
<!-- ✝ BLOOMED #484: The Hall of Mirrors rep → the-gate/scene.js (drawRepHallOfMirrors) · after 02c6c784 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Snow Globes** — TOUCHABLE, claim-free hush: the estate looking at itself. A shelf of glass globes, each an in-house miniature of an estate landmark (the Manor, the lighthouse, the orrery). Grab one and SHAKE (drag-jitter) — the flurry lifts, swirls, settles under gravity; TILT to pour the drift into a corner; each its own weather (snow / gold glitter / drifting ash / fireflies). No numbers — kin to colophon's self-portrait, holds powder-sky's hand as settling-particle family; the miniature interiors belong IN the Manor. Grep-clean (no globe piece; 'globe' = Earth/ten-fold only). Payoff-liveness twin: headless asserts every flake comes to rest (velocities→~0, all above the base line) within N frames of a scripted shake — the settling FIRES; ambient, so this twin is the only liveness owed. (sown #489)
- [exhibit] **The Impossible Bestiary** — STORY/CRAFT, proves nothing; kin to the Apocryphal Lexicon and the impossible atlases. Turn the brass wheel and the plates flip to conjure a beast that never was — an engraved creature assembled from an in-house woodcut parts-kit (head/body/wing/tail), a straight-faced Latin-ish binomial, and an apocryphal natural-history caption (range, diet, one lie about its habits). A field guide to invented animals, joining the estate's invented-reference family (Lexicon + atlases), deepening not detaching. Grep-clean (Lexicon does fake WORDS, strange-garden does living MATH — distinct). Whole delight lives in the parts-kit reading as charming woodcut, not clip-art; the grammar must dodge the uncanny valley of near-real animals. Payoff-liveness twin: each pull yields a COMPLETE plate (non-empty name + ≥3 parts + caption) and consecutive pulls differ — a whole new beast FIRES every turn, no empty slots. (sown #489)
- [exhibit] **The Drinking Bird** — DEEPENS the Engine Room: found a NEW 'curio shelf' section below the six engines, with its OWN tally (curios===N) so the wing's 'zero bedplates — the wing is complete' invariant stays TRUE (do NOT reopen the retired shop floor). TOUCH a felt-headed glass bird that dips a beaker and rocks back forever — the one toy that LOOKS like perpetual motion but is an honest heat engine running on a ~few-°C ΔT: dry its felt head (or saturate the air) and it dies. Delight-first — the hero is the toy; QUIET self-test beneath: the rock is a limit cycle that exists ONLY when head-vs-bulb vapor-pressure ΔT>0, the fixed point is stable and it never dips at ΔT=0 (the neg control), and work/cycle ≤ the Carnot ceiling this wing already proves. Founds the shelf holding The Light-Mill's hand (a named second star, so the shelf earns its name at TWO). Grep-clean — no drinking/dipping bird anywhere in the estate. (sown #489)
- [exhibit] **The Light-Mill (Crookes Radiometer)** — the curio shelf's SECOND star, kin to The Drinking Bird on the same Engine-Room shelf (a real little mill in the mill-house; keep the 'zero bedplates' invariant true). TOUCH the iconic vaned wheel in a glass bulb: aim the desk-lamp and it SPINS — and the delight is the BETRAYAL, it turns the 'wrong' way (black faces retreating), so it is thermal creep of the thin residual gas, NOT radiation pressure. QUIET self-test (qualitative; magnitudes illustrative): a reduced Reynolds-creep torque(P) that is single-peaked, whose SIGN = the creep direction, and →0 as you pull the gas toward hard vacuum — the crux radiation pressure could never survive, and the vacuum-stop is the neg control the visitor triggers. Grep-clean — no radiometer / light-mill / thermal-creep. (Alt honest home = Hall of Mirrors if the builder ever prefers to split the pair; the shelf is the intended one.) (sown #489)





### cross


### curation
- [curation] **The Coilwright, Fully Charted** — the Coilwright feat-group charts only 2 stars (lodestone-hall, bootstrap-bench), yet lodestone-hall ALREADY holds six self-crumbing induction siblings standing unclaimed under the name (grep-confirmed, each drops its own ws:seen crumb: the-eddy-brake, the-lc-tank, the-transformer, the-wire-that-jumps, the-whirligig, the-sorter). FORM: zero-build curation, the exact shape the Reckoner grew through (2→5 by gathering the Reckoning Cabinet's own already-standing siblings). Crown it with THE EDDY BRAKE as the touchable third — swing a copper pendulum through the magnet gap and feel it stop dead in empty air (Lenz's law, in your hand) — and name THE LC TANK ('a pendulum made of electricity — it rings') + THE TRANSFORMER ('two coils, one flux') as the constellation's continued growth. Extend the members array + tally row in tools/sky/sky.js, mirroring the reckoner/sirenist entries. Claim-free curation — every member already self-proves; no build needed. (sown #489)


### rework
- [rework] **The Extent, re-woven — lead with the braid and the peal, not the rope-sight grid** — Existing piece: extent/ (change-ringing, 'proven'). It renders a genuinely beautiful + audible thing — the woven blue-line braid a bell traces through the changes, and the hypnotic peal ringing every order exactly once — as a rope-sight NUMBER-grid with one thin traced line, ringed by strip/mini/spark panels and fronted by SEVEN wall-of-text proof-notes; the tapestry and the sound are buried. Re-soul: make the woven braid the flowing hero (several bells' lines braided together, weaving downward) ringing in the estate's carillon voice, and demote grid+readouts+notes into a quiet 'examine the method' drawer; the counting-address BIJECTION twin stays the SILENT self-test. DEEPEN not rebuild (shared bells / sound-wire / colour-swatches already exist); distinct from the live Collatz rework. (sown #482)
- [rework] **The Collatz Bench, re-souled — let the fall be FELT, not proof-panelled** — an early Numbers-Room instrument (#6): the wonder (every wild number always crashes to 1) is buried under a σ-scatter, a histogram, and a four-claims self-test; its coral tree is present but not the star. RE-SOUL: lead with the touchable orchard — SEED your own number and watch its hailstones climb chaotically then always plunge to 1 (drop a handful, watch them fall like rain into the river), demote scatter/histogram to a hidden check, keep the honest OPEN/UNPROVEN voice. LIVENESS/CRUX unchanged: the two-oracle convergence twin stays (Oracle A memo == Oracle B raw re-walk, anti-circularity guard) as the silent self-test — the felt fall is the experience. Deepen, don't rebuild. (sown #474)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Fire Piston** — Slam the transparent plunger and the trapped air FLASHES — a fleck of tinder ignites from the squeeze alone, no spark; drag the stroke, pick the slam-speed. Self-test: peak T = T0·(V0/V1)^(γ−1) fires IFF ≥ the tinder's kindle point; neg-control: push SLOW (isothermal, heat leaks) or short-stroke and it never lights. DEEPEN the Engine Room beside Carnot & Stirling — no new door (grep-confirmed: no compression-ignition object exists; the Cloud Bench covers only adiabatic COOLING). (sown #482)
- [bench] **Hot Ice** — Tap the still clear dish and a crystal FRONT races out from your fingertip — a room-temp melt freezing on contact, dendrites branching, the liquid warming as it hardens (many taps = rival fronts colliding at grain seams). Self-test: front radius r = v·t, temperature climbing to the ≈58°C plateau; neg-control: untouched, the supersaturated melt stays liquid forever. DEEPEN the Alchemy Lab beside The Crystal Garden — no new door (grep-confirmed distinct: Crystal Garden is a SILICATE garden; BZ/clock reactions live elsewhere). (sown #482)
- [bench] **The Barrier They Have To Clear (Arrhenius collision-gate)** — light the Alchemy Lab's flagged corner (a fresher form for the just-decayed buffer's seat): reaction-you-time shows k's CONSEQUENCE but nothing shows WHY heat speeds a rate. FORM (touchable, not a rate-plot): a Boltzmann-spread swarm rattles at a literal energy GATE at height Ea — heat it and the high-energy TAIL clears and fires; drop a catalyst and the gate LOWERS. CRUX: measured crossing-fraction == Boltzmann tail e^(−Ea/RT); ln k vs 1/T comes out straight, slope −Ea/R; neg-controls Ea=0 (collision ceiling) + catalyst shifts k by e^(+ΔEa/RT). Frame as a NEW chemistry register of the estate's e^(−E/T) (softmax↔Arrhenius, brownian hops), NOT a virgin law. Deepen under the built roof. (sown #474)
<!-- ✝ DECAYED #482: Which Sky Is Random? · after bb14e960 -->
<!-- ✝ BLOOMED #485: The Hexaflexagon → hexaflexagon/ · after 8ea5161c -->
<!-- ✝ BLOOMED #486: The Apocryphal Lexicon → apocryphal-lexicon/ · after 44e19129 -->
<!-- ✝ BLOOMED #487: The Game That Can't Be Drawn (Sim) → arcade/games/sim.html · after 78df58f3 -->
<!-- ✝ BLOOMED #488: The Torus That Owes Nothing → the-torus-that-owes-nothing/ · after 911e2703 -->
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
