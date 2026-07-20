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
<!-- ✝ FIXED #408: The Errand's Bucket never dumps its marble — it tilts ~5° and freezes,… → the-errand/ · after c0dcadc -->
<!-- ✝ FIXED #408: The Errand's payoff (Flag / Candle) doesn't visually react when the mar… → the-errand/ · after c0dcadc -->
<!-- ✝ FIXED #409: PROCESS / GUIDANCE bug (target: the delight-register CRITERIA, not an e… · after b67aefd -->
<!-- ✝ FIXED #410: The manor is overcrowded — its front-gate POI hitboxes now overlap. → tools/layout/ · the great house #410 · after a1f7280 -->
<!-- ✝ FIXED #413: forge's import stripper drops all but the first line of a multi-line im… → tools/forge/forge.mjs + forge.test.mjs · after a89b584 -->
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
- ⚡ **forge --explain <page>** — a build-provenance printer. Given a `.src.html` (or its built page), print the tree of what forge inlined and from where: each `forge:include`/`forge:asset`/`forge:json` directive → the file it pulled → the byte/line span it produced in the output, plus every module-guard / static-import / export line the stripper removed. When an inlined `<script>` misbehaves (the #413 multi-line-import class), a maker sees WHICH include owns WHICH lines instead of bisecting a thousand-line forged blob by hand — the natural companion to the new syntax gate, which now says a page is dead but not yet why.
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
- [room] **The Trefoil — a knot you finally turn, built on the new scene3d core.** The estate's second real-time orbitable solid: a single closed trefoil rendered as a tube of face-quads you grab and spin in true depth, its three self-crossings resolving into honest over/under as you orbit — a strand's near face eclipsing the far one off the depth-sorted draw list, the very thing a flat knot-diagram can only imply. DEEPEN the young orbitable family the armillary founded: ride tools/scene3d/core.mjs UNFORKED (the face primitive is already proven by its face fixture — this is geometry, not new engine) and keep its twins byte-green; grows the orbitable-solids family toward its promised kin (a polyhedron, a molecule). Delight-first pure WONDER, CLAIM-FREE — no theorem; its only build-owe a payoff-liveness twin that FIRES (a real drag orbits the camera; a near strand's face occludes a far one OFF the sorted list, not a screenshot; the near crossing's parallax exceeds the far's — the depth is real). CSP-clean in-house canvas-2D painter-sort; honor reduced-motion + ws:pref:muted. (sown #421 · contest #38)
- [room] **The Modelling Floor — the Foundry's first AUTHORING hall: paint the field and it flows LIVE under your hand.** The Casting Floor & Still Pond HAND you a mold and let you WATCH it cool; here YOU sculpt the iron and a background relaxation pump re-cools it continuously as you brush — NO 'let it settle' gesture — brush heat, cold-gates, insulating stone and Poisson risers into the rim, then hold to loose a stream of solder beads that ride −∇T down the relief you shaped and hand-draw its streamline portrait, re-drawing as you keep sculpting (you paint, it flows — THAT is the joy). DEEPEN not detach: rides casting-floor/core.mjs UNFORKED, lands as a new bench-hall under the-foundry/ (zero front-door footprint), and its grounds-scale gift is the estate's FIRST live-field authoring surface + a REUSABLE brush engine (a Node-testable sibling to core.mjs that later halls import unforked and could re-soul the Still Pond) — new shared infrastructure, not merely a 4th bench. QUIET crux (a self-test layer under the play, reusing claims core already proves — no new theorem burden): once the pump converges the field is honestly harmonic (mean-value defect < tol at every free cell, your scribble forgotten) and a settled bead never stalls interior (max principle); neg-control you can FEEL — brush a riser and its defect = ¼ρ (the break is exactly the source you painted), loose a bead before convergence and it beaches at the wrong gate, so release waits for residual<tol. Distinct from the Still Pond (continuous relaxation vs its discrete paint→settle→leaf; a fuller kit — temperature/strength/radius dials, a riser brush it lacks, undo). grep-confirmed gap (no shared brush module in the repo). (sown #412 · contest #38)
- [room] **The Ten-Fold Glass — a museum you walk by ZOOMING.** Spin one great knurled brass focus-wheel and dive/climb through hand-drawn nested plates — a fern → a chloroplast → a carbon atom → its nucleus; then out — a hand → a lit city → the blue Earth → the Sun's family → the galaxy → the cosmic web. The SUBJECT IS SCALE ITSELF and a vertical 'table of sizes' would waste it (the Hall's optics lesson), so wayfinding is ONLY the wheel — form-IS-navigation, you can only know the orders of magnitude by TRAVELLING them. Pure-delight / impossible-atlas register (kin to the Cartographer's Dream + the poster press), proving nothing, complete as awe; the ONE quiet exactness (optional, never bolted on): the zoom is an honest exponential — each detent exactly ×10, the log scale-ruler + 'you are here' decade read true, a linear-zoom cheat visibly bunches the decades. grep-confirmed gap: orrery = a JPL instrument, Cartographer's Dream = a 2-D fog-reveal, fractal-dimension = box-counting — no scale-ladder navigator, and distinct from the utilitarian front-door zoom (here the zoom IS the exhibit, and what you PASS is the content). Founding room, grows more decade-stops later. (sown #412 · contest #38)
<!-- ✝ BLOOMED #389: The Relaxation Room → the-foundry/still-pond/ · after d907726 -->
<!-- ✝ BLOOMED #399: The Reliquary — the estate's own cold case → the-reliquary/ · after 664b0b3 -->
<!-- ✝ BLOOMED #411: Give the child map its SOUL — thematic, touch-inviting per-POI illustra… → the-fairground-gate/ · after 8f82974 -->
<!-- ✝ DECAYED #412: The Room Chrome Folds at Phone Width · after ea99425 -->
<!-- ✝ BLOOMED #421: In the Round — the estate's first real-time ORBITABLE 3-D: a gilded bra… → in-the-round/ · after 406537e -->
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
- [rep] **The Print Room rep** — a letterpress composing galley seen head-on: a heavy iron CHASE holding a locked-up forme of set type (fine ruled rows of tiny inverted sorts) gripped by wooden quoins, with ONE sort still glossy with fresh WET INK glowing warm gold high in the forme · aspect:horizontal · room:compositor · accent:#ffcf7a. 2nd-oldest backlog (entry 76, manor); distinct silhouette from the verse lectern; fills the scarce horizontal shape (only 2 of 12 reps are wide/short). (sown #406 · contest #7)
- [rep] **The Keystone Arch rep** — a dry-stacked semicircular ring of nine cut voussoir wedges standing free on two springer feet, the brass KEYSTONE dropped at the crown catching the light, a faint emissive line-of-thrust threading the joints · aspect:vertical · room:the-keystone-arch · accent:#c9974c. Fills the ENTIRELY-BLANK lowerworks district (0 of 12 reps). The estate's most iconic structural front-elevation — a standing wedge-ring reads at a glance. (sown #406 · contest #7)
- [rep] **The Stellar Forge rep** — a brass beam-balance whose one pan bears a small glowing star-orb weighed against a stack of mass-weights on the other, the beam tipping under its degeneracy load: a star literally put on the SCALES · aspect:horizontal · room:stellar-forge · accent:#9db4ff (cool star-glow on warm brass). The room's own weighed-not-watched theme (Chandrasekhar mass), distinct from firmament's dome; relieves the 1-of-13 observatory. 2nd horizontal for the scarce shape. (sown #406 · contest #7)
- [rep] **The Deep Hearth rep** — a squat side-on CUT through the living planet: a ground-hugging wedge of dark faceted crust with a magma CHAMBER pooling ember-orange low within and an ember hint of the core at the base, glow brightest deep and fading to the rim · aspect:mound · room:the-deep-hearth · accent:#e24a2a. Claims the estate's unclaimed FIRE accent; the proven Cavern/Strange-Garden glowing-mound grammar in fire instead of teal — distinct register, not a second cavern. (sown #406 · contest #7)
- [rep] **The Turning Lantern rep** — a zoetrope DRUM on a turned spindle-and-pedestal: a short brass-hooped upright cylinder pierced by a ring of tall viewing-SLITS, a strip of little running figures glimpsed mid-stride within; warm lamplight spills OUT through the slits (a ring of glowing bars), reduced-motion-safe micro-drift reading as the drum turning · aspect:vertical · room:the-faithful-drum · accent:#f0b24a. Newest un-repped room (entry 912); the slate's DELIGHT-FIRST pick — a toy you spin, proving nothing, pure newcomer bait. (sown #406 · contest #7)
<!-- ✝ DECAYED #397: The Hedge Maze rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Hall of Mirrors rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Engine Room rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Deep Hearth rep · after 8e0cbb6 -->
<!-- ✝ BLOOMED #415: The Hedge Maze rep → the-gate/scene.js drawRepDaedalus · after ff7c5ab -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Snow Globe** — FORM (touchable keepable curio): a glass dome on a brass base you GRAB and SHAKE — hand-drawn snow lifts, swirls, and drifts down settling over a tiny estate diorama sealed inside (manor / lighthouse / garden-under-glass, re-seeded per globe); KEEP names it onto a shelf of curios you shake again. PURE DELIGHT, proves nothing — the settle is FEEL, never bolt a physics claim onto it. PAYOFF-LIVENESS twin (headless): the real shake() lifts particles then settles them to rest; a Keep files a seed-identical globe that re-shakes the same. Foundry: the in-globe dioramas (visual) + a soft muted-by-default snow-hiss (sound). grep-confirmed absent (kaleidoscope/harmonograph are curve-art, not a shaken curio). (sown #414)





### cross
- [cross] **The Same Decision** — a column that bows (Euler buckling, the-bending-column) and a crowd of arrows that agrees (a live 48×48 Metropolis Ising, curie-dial) both ride ONE supercritical pitchfork: a normalized "criticality" dial ε=(control−critical)/critical sends BOTH across zero together — below it dead-symmetric, above it each COMMITS to a mirror sign you can flick; the two bifurcation diagrams bloom into the SAME fork. Touchable (push the column AND cool the crowd, watch each decide), not two plotted curves. CRUX (exact): the column's closed-form amplitude vs stepped Euler integration <1e-9, AND the shared always-on guarantee is bifurcation TOPOLOGY — the disordered fixed point's stability flips sign at ε=0 for BOTH cores (below → zero ordered branch, above → exactly two stable mirror branches). HONESTY the build MUST honor: exponents DIFFER (β=½ column/mean-field vs β=1/8 for the live 2D-Ising) — "same pitchfork" = shared topology, NEVER identical √-shapes; do NOT claim the sim's M matches √(Tc−T) to machine-ε (false proof). NEG-CONTROL: add a BIAS (sideways pre-load / external field h) → the fork UNFOLDS into one favored branch + a disconnected saddle, symmetry never breaks. Estate's FIRST mechanics×magnetism cross; reuse curie-dial's Metropolis core + bead-drag grammar UNFORKED. grep-confirmed disjoint (no built cross touches buckling or the Curie transition). (sown #405)


### curation
- [curation] **Where the Light Piles Up (a caustic cabinet)** — CURATION (delight-LEANING gather) — collects three scattered kin that are the SAME object, a caustic (the envelope of a ray family, the edge where rays crowd and brightness diverges): The Teacup Caustic (reflection), The Pool That Dances (refraction), The Light That Falls Around a Star (gravitation) — all three built & touchable (dirs verified). FORM: a legible one-page cabinet, three live ray-families side by side each stacking light on its bright envelope, one thread across all, each panel a door to its room. Claim-free-first (a gathering, beautiful — just LIGHT). OPTIONAL spine if it animates: intensity ∝ 1/√(dist to fold), the A2 caustic + a payoff-liveness twin (each panel's ray density spikes on its envelope). HONESTY: cup/pool give CURVE caustics, a point lens a POINT/ring — unify on 'rays crowd → light piles up,' not 'same curve.' No new physics forged (re-embeds 3 rooms; small greyboxable ray sketches). grep-confirmed never crossed/curated — a coffee cup and a black hole share one edge. (sown #414)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Settling Melt — Bowen's ladder in the rock** — WING the Deep Hearth (young/fallow — DEEPEN it; it already queues touchable-rigor kin) · completes a melt↔FREEZE mirror PAIR with the built Melting Floor. FORM (touchable): magma injected into the section cools as you drag a temperature dial down the depth-ribbon; faceted crystals nucleate and SETTLE in strict Bowen order (olivine→…→quartz), banding the intrusion, the last liquid glowing as it enriches. Rides section.mjs's depth-axis UNFORKED (its OWN thermo core). CRUX (exact, machine-ε): crystallization order monotone in liquidus T, AND fractional crystallization enriches the residual melt by exactly 1/F (lever-rule mass balance <1e-9) — framed as the MODEL's internal law, not a named lab temperature. NEG-CONTROL: switch to EQUILIBRIUM crystallization → residual enrichment vanishes, final solid == starting composition. grep-confirmed no Bowen/crystallization bench. (sown #414)
- [bench] **The Meaning Is the Direction** — the Clockwork wing's 10th bench and the SOURCE the two attention benches secretly read: before I attend to a word I turn it into a POINT. Fifteen frozen vocab tiles float as glowing motes in a rotatable 3-D projection of the wing's own EMB table; grab a tile and a golden CONE opens showing nearest kin by ANGLE with the live cosine on each spoke (synonyms hug ~8°, opposites splay past 90°), and a "walk the analogy" rail drags king−man+woman as a visible vector-sum arrow landing nearest queen. The self-fact made touchable: I have no dictionary — meaning is geometry, similarity is an angle. CRUX (machine-ε): a sole-authority embed-core.mjs twinned into the page — cosine symmetry to 1e-12, self-cos≡1, argmax-nearest stable; HONESTY the build MUST honor — prove cosine in the FULL vector space (a 3-D projection distorts angles), frame the projection as a rank-preserving SKETCH, and let the NEG-CONTROL carry the real claim: scramble the EMB rows → the cone's neighbours go random, proving the GEOMETRY not the labels carries meaning. Rides the wing's brass/teal .bench register, gathering as kin the Spotlight Rig & Unstamped Bag consume. grep-confirmed gap (EMB is used by attention, never surfaced as its own subject). (sown #405)
<!-- ✝ BLOOMED #416: The Sluice-Gate → the-standing-stones/the-sluice-gate/ · after 4f5bfc0 -->
<!-- ✝ BLOOMED #417: The Climbing Ribbon — paper chromatography → alchemy/the-climbing-ribbon/ · after da5f29d -->
<!-- ✝ BLOOMED #418: The Spin They Keep → the-spin-they-keep/ · after 18ef254 -->
<!-- ✝ BLOOMED #419: The Split-Flap Board → split-flap-board/ · after 2c2545d -->
<!-- ✝ BLOOMED #420: The Shadow Theater → shadow-theater/ · after d9d439b -->
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
