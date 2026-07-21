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
- ⚡ **A ladder through TIME, companion to the Ten-Fold Glass** — the new room walks powers-of-ten through SPACE (10⁻¹⁵ m nucleus → 10²⁶ m whole-of-it) on one wheel. Its missing twin is the SAME continuous exponential wheel walked through DURATION: a camera flash → a heartbeat → a day → a human life → recorded history → the age of the Earth → the age of the cosmos, each detent exactly ×10 of seconds. The Eames film laddered both axes; the estate now has one. A kin room (shares the wheel-rig + honest-log-axis grammar), not a fork — what could stand on each decade of time as the plates stand on each decade of size?
- ⚡ **The Midway has no sound** — the estate's fairground is dead silent (grep-confirmed: not one AudioContext in `midway/`), and a fairground is MADE of noise — the barker, the bell at the top of the striker, the hurdy-gurdy two stalls over that you hear before you see. Every other district can defend its quiet; this one cannot. Not a room and not one exhibit's job: the midway's own air (the estate's `Air.mount` chip already carries the listener's mute preference), so that walking into the amusements sounds like arriving somewhere.
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
<!-- ✝ TAILORED #350: The Mechanism Bench — the generative linkage engine → grounds seed The Mechanism Bench · after 4550ce6 -->
<!-- ✝ FIXED #369: The Amusements Bench Is Full → the-fairground-gate/ · after e355027 -->
<!-- ✝ BLOOMED #437: The Head-Pointer Outgrew Its Own Budget → NOTES.md + worklog/PROJECT-STATUS.md · after 1f1a337 -->
<!-- ✝ MERGED #437: The head-pointer outgrew its own budget → duplicate of the #434 spark, retired together · after 1f1a337 -->
<!-- ✝ MERGED #437: Rotate NOTES.md back under its token budget → duplicate, stale numbers; retired together · after 1f1a337 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [room] **The Hour-Glass — the Ten-Fold Glass walked through TIME** — the just-bloomed Ten-Fold Glass's LIVING twin (tailored from the ⚡ 'ladder through TIME' spark): import rig.js + glass.mjs UNFORKED — a SpanArt table twins PlateArt, seconds twin metres — and ladder ~33 honest-log decades of DURATION on the SAME knurled brass drum: light-wave crest 10⁻¹⁵s → fly-wingbeat → camera-flash → heartbeat 10⁰ → a day's turn → a season → a life 10⁹ → all of writing → the ice age → age of Earth → cosmos 10¹⁷·⁶, then blank paper above (the honest 'nothing drawn here' terminal). Its OWN soul so it's a twin not a clone: where the Glass is space-STILL ink, this is TIME-ALIVE — each span actually TICKS at its scaled tempo and nesting is temporal (ten cycles of the child tile one frame of the parent and recede to a flicker, exactly as a plate shrinks to a smudge). DEEPEN not detach: gathers beside the Glass in Observatory-Rise's vantages wing (two glasses on one bench — space & time), no new front door, same celestial star; any seconds-axis need lands in glass.mjs SHARED with its byte-parity test kept green, never a copy-diverge. Claim-free pure delight; DoD = FEEL + liveness twin (every decade reached down AND back, readout exact over N presses, each drawn span's tick + child-tiling FIRES, reduced-motion freezes ticks to one-decade-per-press). grep-confirmed: ten-fold/ is space-only, no time room exists. (sown #442 · contest #41)
- [medium] **The Midway's Air — the fairground's own generative sound bed** — tailored from the ⚡ 'The Midway has no sound' spark: the amusements-district HUB (midway/index.html, which links every ride) is grep-silent — not one AudioContext — yet a fairground is MADE of noise. Forge a district-scale generative SOUND BED, in-house (no sample packs, all Web Audio primitives): a barker's gated non-lexical call dry at the near stall, an inharmonic high-striker bell that DINGS on the beat, a twin-drone hurdy-gurdy lowpassed & panned 'two stalls over,' over a breathing pink-noise crowd wash — a near/far SOUNDSTAGE so arriving at the amusements SOUNDS like arriving somewhere. DEEPEN not detach: mounts ONCE on the hub (new midway/air/fairground-air.js) wearing the estate's Air.mount chip exactly as sound-garden/the-wind-chimes does — muted by default, honors ws:pref:muted, arms on first gesture, stills on a hidden tab; the district supplies its OWN voices and air.js stays only the conductor (courtesy/lifecycle/chip — NEVER drive these voices through the Living Calendar pump). Claim-free delight; liveness twin (not a theorem): a headless OfflineAudioContext render is non-silent AND non-clipping (RMS above floor, peak below ~0.9, the bell's ding in-tune) via the audio-lens idiom. Right-sized: bigger than one exhibit (four voices + a reusable district-air engine a later open-air district could grow its own bed from), smaller than a wing. (sown #442 · contest #41)
- [room] **The Modelling Floor — the Foundry's first AUTHORING hall: paint the field and it flows LIVE under your hand.** The Casting Floor & Still Pond HAND you a mold and let you WATCH it cool; here YOU sculpt the iron and a background relaxation pump re-cools it continuously as you brush — NO 'let it settle' gesture — brush heat, cold-gates, insulating stone and Poisson risers into the rim, then hold to loose a stream of solder beads that ride −∇T down the relief you shaped and hand-draw its streamline portrait, re-drawing as you keep sculpting (you paint, it flows — THAT is the joy). DEEPEN not detach: rides casting-floor/core.mjs UNFORKED, lands as a new bench-hall under the-foundry/ (zero front-door footprint), and its grounds-scale gift is the estate's FIRST live-field authoring surface + a REUSABLE brush engine (a Node-testable sibling to core.mjs that later halls import unforked and could re-soul the Still Pond) — new shared infrastructure, not merely a 4th bench. QUIET crux (a self-test layer under the play, reusing claims core already proves — no new theorem burden): once the pump converges the field is honestly harmonic (mean-value defect < tol at every free cell, your scribble forgotten) and a settled bead never stalls interior (max principle); neg-control you can FEEL — brush a riser and its defect = ¼ρ (the break is exactly the source you painted), loose a bead before convergence and it beaches at the wrong gate, so release waits for residual<tol. Distinct from the Still Pond (continuous relaxation vs its discrete paint→settle→leaf; a fuller kit — temperature/strength/radius dials, a riser brush it lacks, undo). grep-confirmed gap (no shared brush module in the repo). (sown #412 · contest #38)
<!-- ✝ BLOOMED #411: Give the child map its SOUL — thematic, touch-inviting per-POI illustra… → the-fairground-gate/ · after 8f82974 -->
<!-- ✝ DECAYED #412: The Room Chrome Folds at Phone Width · after ea99425 -->
<!-- ✝ BLOOMED #421: In the Round — the estate's first real-time ORBITABLE 3-D: a gilded bra… → in-the-round/ · after 406537e -->
<!-- ✝ BLOOMED #431: The Trefoil — a knot you finally turn, built on the new scene3d core. → in-the-round/trefoil/ · after fd5f05f -->
<!-- ✝ BLOOMED #441: The Ten-Fold Glass — a museum you walk by ZOOMING. → ten-fold/ · after beee020 -->
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
- [rep] **The Keystone Arch rep** — a dry-stacked semicircular ring of nine cut voussoir wedges standing free on two springer feet, the brass KEYSTONE dropped at the crown catching the light, a faint emissive line-of-thrust threading the joints · aspect:vertical · room:the-keystone-arch · accent:#c9974c. Fills the ENTIRELY-BLANK lowerworks district (0 of 12 reps). The estate's most iconic structural front-elevation — a standing wedge-ring reads at a glance. (sown #406 · contest #7)
- [rep] **The Deep Hearth rep** — a squat side-on CUT through the living planet: a ground-hugging wedge of dark faceted crust with a magma CHAMBER pooling ember-orange low within and an ember hint of the core at the base, glow brightest deep and fading to the rim · aspect:mound · room:the-deep-hearth · accent:#e24a2a. Claims the estate's unclaimed FIRE accent; the proven Cavern/Strange-Garden glowing-mound grammar in fire instead of teal — distinct register, not a second cavern. (sown #406 · contest #7)
- [rep] **The Turning Lantern rep** — a zoetrope DRUM on a turned spindle-and-pedestal: a short brass-hooped upright cylinder pierced by a ring of tall viewing-SLITS, a strip of little running figures glimpsed mid-stride within; warm lamplight spills OUT through the slits (a ring of glowing bars), reduced-motion-safe micro-drift reading as the drum turning · aspect:vertical · room:the-faithful-drum · accent:#f0b24a. Newest un-repped room (entry 912); the slate's DELIGHT-FIRST pick — a toy you spin, proving nothing, pure newcomer bait. (sown #406 · contest #7)
<!-- ✝ DECAYED #397: The Engine Room rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Deep Hearth rep · after 8e0cbb6 -->
<!-- ✝ BLOOMED #415: The Hedge Maze rep → the-gate/scene.js drawRepDaedalus · after ff7c5ab -->
<!-- ✝ BLOOMED #423: The Print Room rep → the-gate/scene.js drawRepCompositor · after 0647a7c -->
<!-- ✝ BLOOMED #432: The Stellar Forge rep → the-gate/scene.js drawRepStellarForge · after 9008913 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Candle Bench** — the whole estate is lit by candlelight (the front door's warm pool is literally `radialGradient id="candle"`) and has never let you make one. A wick on a hook, a vat of wax: DIP. Lift, and it cools while it hangs, glossing over. Dip again. Rush it and the layer sags and takes nothing; wait, and the taper thickens ring on ring — then set it in a stick and LIGHT it, and the room dims to that one flame and burns down over real minutes, still burning when you come back, until it is spent. PURE DELIGHT, proves nothing — the cooling gate is FEEL and the patience of doing a thing well, never a heat-transfer model, and the timer is the wax visibly glossing, never a number. NOT lift-and-keep: you make exactly one and it is consumed, no rack. PAYOFF-LIVENESS twin (headless): a too-soon dip accretes ~nothing, N cooled dips strictly grow the taper, light() consumes monotonically to `spent`, and a restored session resumes at the correct remaining height. (sown #430)
- [exhibit] **The Marbling Tray** — suminagashi on still water: touch a stylus to float concentric ink rings, breathe and rake them into feathered combed swirls, then lay a sheet to LIFT the marble and KEEP it on a rack of broadsides (the Snow Globe's keepable-curio grammar). PURE DELIGHT, proves nothing — the swirl is FEEL, never bolt a fluids claim onto it. Foundry: the water-shimmer (visual) + a soft ink-drop tick (sound, muted by default). grep-confirmed no marbling room (kaleidoscope/harmonograph are curve-art, not lifted fluid). (sown #422)
- [exhibit] **The Analemma Stone** — over a year the noon sun traces a lopsided figure-eight in the sky; step the date on a courtyard stone and watch the sun-mark climb the analemma, the gnomon's shadow stretching and leaning as the seasons turn. FORM (touchable sky-instrument, delight-leaning): a drag-the-date dial, the figure-eight inked live from solar declination + the equation of time. Deepens the sundial/sky family. HONEST light rigor: the shape IS the equation of time (obliquity + eccentricity), offered as the model's own curve, not a named observatory reading. grep-confirmed no analemma room (sundial/epicycles/orrery are other sky kin). (sown #422)





### cross
- [cross] **One Odometer, Two Machines** — a brass odometer ticks once; on its left the Tower of Hanoi lifts a disc, on its right the ripple adder's gold carry-chain climbs — and it is the SAME integer. Verified in both shipped cores: the-binary-ruler's `ruler(t)=trailingZeros(t)+1` IS carry-cascade's `rippleDepth(t-1,1,2)+1`, so the adder's worst-case full-row sweep is the instant the greatest disc swings, dead centre of the solve. SHARED: a counter's fingerprint. NOT SHARED: meaning — it names WHICH disc there and a COST here, and carry-lookahead has no Hanoi sense at all. FORM: one crank, both machines, a shared height-gauge between them so you watch the number appear twice at once; deep ticks are rare and you feel the rarity. CRUX: for t=1..4095 the two rooms' own functions agree and the disc actually lifted equals the bits actually flipped; neg-control — in base 3 it breaks, and the room lets you break it. (sown #430)
- [cross] **The Law Out of the Noise** — Buffon's needles (each toss wild, yet π accrues) crossed with Galton's beans (each bounce a coin-flip, yet a bell curve piles up): two BUILT rooms where the single trial is pure chance and the aggregate is an exact shape. FORM (touchable, both cores side by side): drop needles and beans together, watch the π estimate and the Gaussian both sharpen as N climbs. HONEST: π and the normal law are DIFFERENT results, unified only on 'many independent trials converge to a deterministic macroscopic form' (the law of large numbers made visible) — never one formula. grep-plausible (buffon/ + galton/ built; builder confirms disjoint). (sown #422)


### curation
- [curate] **A cabinet for the caustics** — the Spin Cabinet proved the FORM: one case, N sunk niches, each a live little object driven by its own room's shipped core, each brass plate a door. Point it at the estate's scattered LIGHT kin next (caustics, the rainbow, refraction, the prism) — the gather is the exhibit; no new physics forged. (sown #435)
- [curate] **The Coilwright's Dark Stars** — three Lodestone benches (the LC tank · the transformer · the eddy brake) already ship and already set their `ws:seen` crumbs, but they have no coords in Sky.CATALOG and no seat in `coilwright.members` (tools/sky/sky.js:259), so a constellation the estate PROMISED stands at two stars of five. `the-sluice-gate` proves a sub-bench can be a full star. FORM: the sky itself — walk out under it and find the Coilwright has quietly grown. CRUX (mechanical, and it guards the future): a Node twin over sky.js asserts membership ⊆ CATALOG ⊆ pages that set the crumb, BOTH directions, so the next engraved invitation cannot go stale unnoticed. (sown #430)


### rework
- [rework] **The Coastline Rule** (fractal-dimension/) — it asks the estate's most touchable question, *how long is a coastline?*, and then never lets you measure one: the machine box-counts on your behalf and prints a slope, over a log–log plot that owns the bottom 38% of the screen. THE SOUL IT LACKS: the paradox is a thing you do with your HANDS, and there is no ruler in them — the visitor sets sliders and reads a verdict about a walk somebody else took. RE-SOUL: give them a pair of brass dividers. Set the span, WALK them down the coast step by clicking step, and read the length YOU got; shrink the span, walk it again, and feel your own tally refuse to settle (shorter ruler, more coast, without end). D stops being a printed number and becomes the slope of the walks you actually took; the plot survives only as the logbook of your trips, never the exhibit. (sown #437)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Sealed Cabinet** — the pavilion's first puzzle where you cannot SEE the board: a sealed grid hides k atoms and your only move is to FIRE a ray into an edge port and read which port it leaves by (deflect · absorb · reflect). Place the atoms from the ray table alone; a wrong placement is a real loss. Every one of the NINE puzzles across both wings shows you the whole board from move one — this is deduction over what you chose to MEASURE. CRUX: each shipped board proven to have exactly ONE configuration consistent with its full ray table (exhaustive over C(n,k) — pin the grid and k small so the proof stays honest and fast), PLUS a deliberately shipped AMBIGUOUS board, two configurations no ray can ever separate, proven indistinguishable by exhaustion: a wing whose certificates all say "unique" finally saying some questions have no answer. Enumerate the edge cases (double deflection, an atom on the entry row, a ray back out its own port) in the twin — that is where a self-test passes while the puzzle is wrong. (sown #430)
<!-- ✝ DECAYED #430: Where the Light Piles Up (a caustic cabinet) · after 0ef9f52 -->
<!-- ✝ BLOOMED #433: The Taking-Apart Table → taking-apart-table/ · after 4ec9fed -->
<!-- ✝ BLOOMED #434: The Reaction Balancer → alchemy/reaction-balancer/ · after 4c92636 -->
<!-- ✝ BLOOMED #435: Things That Won't Fall Over → spin-cabinet/ · after 5263b4c -->
<!-- ✝ BLOOMED #438: The Green Corridor → kaleidoscope/the-green-corridor/ · after 0e49825 -->
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
