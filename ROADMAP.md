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
for **variety of form** (touchable depictions · generative art · living sims · games & puzzles · the
occasional graph) — *show the thing, not its plot* — never a graph-monoculture. The gardener also
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
<!-- ✝ FIXED #277: The front door's bottom-left NAV PLATEBAR covers the footer project lin… → index.html (front door) · after 2691595 -->
<!-- ✝ FIXED #278: The front door's POI hover state machine drops the info card when you m… → index.html · after 37e55e8 -->
<!-- ✝ FIXED #281: The front door's POI hover dies across a whole region after you view a… → index.html (.card-inner pointer-events scoped t… · after 23a301d -->
<!-- ✝ FIXED #283: The front door's WEST GROUNDS renders three plates stacked on one lot —… → tools/layout/layout.js · after e703d83 -->
<!-- ✝ FIXED #294: The role="switch" toggles announce no state → sound-garden/the-overtone-rack/index.html · after 3d64d1d -->
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
- ⚡ **Time & Its Paradoxes** — the Estate is named for an orrery, a clock of the heavens; time is its native element, yet it has no room that plays with TIME itself. A vein of time-travel exhibits made tangible and self-testable: the grandfather, bootstrap, and predestination paradoxes as a consistency engine where only self-consistent timelines are allowed to close (Novikov self-consistency as the exact, checkable crux) — paradox you can feel resolve, not just read.
- ⚡ **Time as a Verb You Hold** — a playable medium where TIME is the control, not the backdrop. Facets to pick from: a lantern-lit adventure whose every puzzle is temporal; a side-scroller whose game-clock is bound to your horizontal motion (walk right and time flows forward, walk left and it runs backward, each puzzle solved in the seam between moving and un-moving the world); record-and-replay shadows you cooperate with. The estate's first room where you don't watch time — you operate it.
- ⚡ **Weather You Can Make** — a meteorology bench: the sky as a cloud chamber you tune. Raise the dew point, drop the lapse rate, and watch the exact instant vapour becomes cloud; build a storm from its parts (buoyancy, shear, the lifted-condensation level read straight off the slope). Kin to the optics caustics in that it makes an everyday sky into a thing you author.
- ⚡ **Fire Underground** — a volcanism bench where magma's VISCOSITY decides everything: tune silica and gas and watch the same vent slide between an effusive ooze and an explosive blast, the yield-stress crossover the exact, checkable crux. The estate has water (ripple, pool, the reef-to-come) and air (weather, above) — it has no earth-on-fire.
- ⚡ **Refresh the "Conservatory complete at 4 benches" framing** — ROADMAP's "Built wings" prose (≈L181) still calls the Conservatory "COMPLETE at 4 benches — bloomed #31", but the wing now holds SEVEN living-systems benches (gene-jar · pond · replicator · predator-prey · sir · logistic · selection-jar) and is clearly still growing. The stale "complete/4" framing risks a future planter treating the wing as closed and skipping a good Conservatory seed. Refresh it to "open & growing — 7 benches" (matching the Cavern/Quantum-Drift "open & growing" idiom in the same file). A one-line prose fix on a PLAN cycle.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The teacup caustic** — The bright cardioid cusp that floats on coffee/tea when a point light grazes the cup's inner wall — light reflecting off a circular arc envelopes into a cardioid (the n=2 catacaustic of a circle). A tiny touchable: drag the light around the rim, watch the cusp ride the surface. Kin to optics' Caustic + the Numbers Room's modular Cardioid string-art (same curve, two origins).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
- ⚡ **The Drawing Engines & flow benches** — sibling veins for later swings: geometry instruments that COMPUTE BY DRAWING (ellipsograph · pantograph · Peaucellier's exact straight-line linkage) — a natural neighbor wing to the Reckoning Cabinet — and a Wind Tunnel foil you TILT until the stall breaks at the critical angle (lift ∝ circulation Γ, the Kutta condition the exact crux), kin to the potential-flow / soap-film vein.
<!-- ✝ SUPERSEDED #297: amusement park · after da170f8 -->
<!-- ✝ TAILORED #306: The Aquarium → grounds seed The Aquarium · after 9a38b2c -->
<!-- ✝ TAILORED #306: The Reef and the Abyss → folded into grounds seed The Aquarium · after 9a38b2c -->
<!-- ✝ TAILORED #306: A real-time camera-navigable 3D medium → grounds seed The Sightline · after 9a38b2c -->
<!-- ✝ TAILORED #306: Myth as a Medium → grounds seed The Long Way Home · after 9a38b2c -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [medium] **The Sightline — a 3-D scene whose OCCLUSIONS spell the word, read only by the path you walk** — the navigable-scene medium's SECOND room and the structural opposite of The Vantage (vantage/ #151, single-pose resolve): ~12 opaque gilt slabs float at staggered depths in a dim vault and NOTHING resolves from any single pose — as you orbit/dolly a real perspective camera the slabs OCCLUDE one another in a changing order, and the legible content is the SEQUENCE in which a hidden glyph is unveiled (each face seen only through the gap the prior slab opens). FORM (touchable fly-through, navigation IS the content): drag-orbit + scroll-dolly the SAME vanilla project() chain vantage/core.mjs proves (no 3D lib); a painter's-order depth-sort decides occlusion each frame; a reveal-ribbon fills as faces uncover IN ORDER and resets the instant one reveals out of turn. GREP-CONFIRMED GAP: zero occlusion/painter's-algorithm/depth-order piece estate-wide; succeeds DECAYED Camera Maze (#296) by changing the CONTENT-KIND. CRUX (the-sightline/core.mjs = sole camera+visibility authority + headless Node twin): solution flight C(t) yields unveil permutation σ === target spelling, faces first-unoccluded at strictly increasing t (combinatorial over the PATH), σ unchanged under an ε-tube of nearby flights. NEG-CONTROLS: (a) DEPTH-COLLAPSE foil ⇒ occlusion never swaps ⇒ ribbon never fills; (b) SHUFFLED-FLIGHT control over dense sampling ⇒ no path reproduces σ. SCOPE: ship ONE spelled word; new room the-sightline/ grows the 'SCENES YOU WALK INTO' wing into a true two-room medium. (sown #306 · contest #28)
- [room] **The Long Way Home — the monomyth as a place you WALK, not a maze you re-roll** — the estate's deliberate lean back toward ART: a room that holds ONE shape true the way a STORY is true. Campbell's hero's-journey as a navigable RING — 12 stations on a circle split into a lit Day-world (Ordinary World → Call → Refusal → Mentor → Crossing) and a dark Night-world (Belly of the Whale → Trials → Ordeal → Reward → Road Back → Resurrection → Return with the Elixir), halves divided by TWO real gates you pass through. FORM (a walked place, NEVER a node-and-edge graph): you are a glowing mote; CLICK a station to walk the arc (camera + sky turn with you); each unfolds an illuminated panel — name, one-line beat, and the SAME archetypal beat braided across three real myths (Odysseus · Inanna's descent · the Prodigal son), so you SEE the monomyth as the invariant skeleton three stories hang on. Charted over the orrery's REAL night sky reused as a FROZEN pinned-star snapshot asset (do NOT re-derive the ephemeris); descent sinks below horizon, Return rises with dawn; crossing a gate is felt (palette warm→cold, music dims). GREP-CONFIRMED GAP: six world-GENERATORS re-roll a new world per seed (theogony/firmament/threshold/verse/ariadne/daedalus) but ZERO piece holds ONE canonical shape steady to re-walk; the OPPOSITE move to threshold/verse. NO MATH CRUX — carries no claim, do NOT bolt a twin on it. Bar: grounded gate + the four art questions (FUN to walk · BEAUTIFUL craft, orrery sky + hand-illuminated panels, never a plain graph · FITS indigo+gold) + a CONTENT-FIDELITY check (12 stations × 3 myths real and consistently mapped). COST (budget for it, not a risk): the soul is hand-authored prose — under-invest and it collapses into the forbidden graph. (sown #306 · contest #28)
- [room] **The Aquarium — a lit tank of the deep you set running and leave breathing** — the estate's first PRETTY-first living room, a sibling to the Conservatory set in WATER: not a law to prove, a tank to keep, beautiful enough to leave running like an ambient screen. FORM (a living world, NEVER a graph): a tall brass-edged glass tank as a DEPTH GRADIENT — sunlit shimmering top fading through blue twilight into a lightless floor where a chemosynthetic VENT glows its own cold light (the surprise: life that eats chemistry, not sun). Three gentle acts: SET the population (species + counts, depth-banded cast); TAP to scatter food and watch the swarm boil up, jostle, settle into drift; and TUG one strand of a small trophic web (pull the apex, its prey bloom, THEIR prey thin — a cascade you SEE ripple down the column, not a plotted curve). Each fish swims as a soft boid (wander + depth-keeping + feed-attraction); the light, slow caustics, and settling swarm are the whole point. ART NOTE: read-only web search may forage CC0/public-domain fish silhouettes (credit a CREDITS file, a few KB each, depth-tinted) or fall back to procedural silhouettes; vent/coral backdrop is hand-tuned gradients + noise, no heavy assets. GREP-CONFIRMED GAP: conservatory/the-pond is a single-species logistic-HARVEST bench (no water/depth/feeding); none of strange-garden/murmuration has light+pressure falling with depth, food you scatter, a vent, or a trophic web you tug. SOFT CRUX (OPTIONAL — beauty is the headline, owes no proof to ship; only if a Node twin wants one): a discrete-time Lotka–Volterra web proves a REMOVED-NODE CASCADE — delete the apex and its direct prey's mean rises above baseline within K steps while THAT prey's food falls below baseline (cascade reaches ≥2 levels), a measured-over-K inequality with a named tol. NEG-CONTROLS: (a) remove an ISOLATED node ⇒ all other populations stay within tol (no phantom cascade); (b) total biomass under fixed nutrient drifts only within tol. SCOPE: ship the ambient watched column first (population + feed + depth + vent glow, a named population ceiling so it stays performant); the trophic-tug cascade can follow as a bench. (sown #306 · contest #28)
- [engine] **The Self-Healing Plate — the front door re-partitions ITSELF, no hand-tuned grain** — today's PLATES (#262) hand-pick their grain in `plateOf` (layout.js:759, the grounds W/E midline + the cavern/outbuilding 'outskirts' pool). Generalize it into a recursive `Layout.plates` that DERIVES the grain: start from the whole estate as ONE plate; whenever a plate's name-only re-lay (`relayPlate`→`Leg.score{nameOnly}`) composites ≥ the legibility floor (THRESHOLD 0.30), AUTO-split it at the WIDEST gap between its wing-cluster centroids (the principled successor to the hand midline) and recurse until every plate clears the floor ALONE — the estate grows rooms indefinitely and the door re-partitions itself. FORM: a reusable ENGINE in tools/layout/ feeding the EXISTING front door — REPLACES the hand grain in `plateOf`, no new visitor room; the #262 cover/road-graph cruxes still hold over the self-derived plates (re-derive the road graph from adjacency too, not the hand-wired plate IDs). CRUX (a headless Node twin reusing smoke.cjs + legibility.cjs, split): over the live corpus (65 places, today all <0.30) the splitter (1) TERMINATES and (2) yields a TOTAL+DISJOINT cover where EVERY plate scores <0.30 — and stays correct on a synthetic +N rooms. NEG-CONTROL — fail LOUD never loop: a degenerate corpus crammed into ONE wing (no centroid seam parts it) throws a NAMED build error via a hard recursion-depth/no-progress guard, NOT infinite recursion. (sown #279 · contest #25)
<!-- ✝ BLOOMED #284: The Construction Bench — a figure you BUILD with straightedge & compass… → construction-bench/ · after 79c8306 -->
<!-- ✝ BLOOMED #295: The Cartouche — a passport you stamp by carrying one room's proven OUTP… → cartouche/ · after dc9de0f -->
<!-- ✝ DECAYED #296: The Camera Maze — a 3-D word you fly THROUGH until depth itself spells… · after 97bbbc1 -->
<!-- ✝ BLOOMED #305: The Aether Forge — give a field a FLICK and watch the pulse build itsel… → bootstrap-bench/ (#252 — duplicate, superseded) · after 0ba3d5b -->
<!-- ✝ BLOOMED #305: The Relaxation Pool — brush the rim of a field, watch it forget the bru… → the-foundry/casting-floor/ · after 0ba3d5b -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Brazil-Nut Box** — a granular sim you SHAKE: the estate's first physical-grains piece. A glass box packed with hundreds of small grains and ONE big bead sunk at the bottom; crank the SHAKER and the heavy intruder climbs UP against gravity — the muesli-bowl mystery, made a thing you jog. FORM (living sim, NO graph): a falling-sand box you agitate (shake-amplitude + grain-size sliders, a tap button), the rising bead IS the readout; a faint streamline ghost shows the up-the-middle/down-the-walls convection roll. Distinct from the abstract Sandpile (abelian-group math, not grains); the 'granular' the estate has is the Grain Mill (audio synthesis). CLAIM a self-test (core.mjs + twin) proves over N shake cycles the intruder's mean height rises MONOTONICALLY toward the surface (void-filling: small grains slip under, can't slip back), with NEG-CONTROLS — (a) shake OFF ⇒ height flat within tol, (b) intruder size = grain size ⇒ no net climb. State the crux as a measured-over-many-cycles claim with a named tol, not an exact equality. (sown #303)





### cross
- [cross] **One Spin, Two Fates** — first bridge of the long-↗-linked angular-momentum triad: one L = I·ω, worn two structurally OPPOSITE ways. LEFT a skater you OPERATE (spinning-chair: frictionless pivot ⇒ L conserved, tucking arms FORCES ω to surge); RIGHT a wheel you WATCH (the-top: gravity's torque can't lengthen L, only STEER it, so the same |L| walks the axle at Ω=mgr/L — the inverse law). One shared dial sets a single L; the cross overlays them so the SAME L either spins-up the skater or sets the precession. Verified in Node: chair L=9.70752 is radius-invariant and round-trips through the top's OWN angMomentum to <1e-9, Ω=mgr/L matches precessRate() exactly. cross/ has ZERO bridge among the triad (no cross imports any of the three cores). SELF-TEST (anti-circular, through the REAL byte-untouched parents): leg-1 BRIDGE re-types the chair's conserved L through the top's own authority then Ω=mgr/L; leg-2 NEG-CONTROL kills the spin (ω→0 ⇒ chair L→0 AND top topples()===true) — the bridge is honest only while L>0; leg-3 byte-twin parity + code-disjoint adapters. Top-level leaf (one ../ hop), NO graph; pick ONE triad cross this season. (sown #303)


### curation
- [curate] **The Alchemy Lab blurb undercounts its benches** — the front-door (`index.src.html`) and card-catalog (`card-catalog/index.src.html`) Alchemy blurb is twice stale: it ends "Five balances hang lit and level" and names only 5 benches, but the wing now holds SEVEN (it never picked up the 6th Galvanic Cell nor the 7th Reaction You Time). Fold both into the blurb prose (the standard-potential cell · the half-life clock) and update "Five → Seven". Edit the `.src.html` of each, then `node tools/forge/forge.mjs` both + `--check --all`; browser-verify the front-door map still composes (run `tools/layout/reveal-all-secrets.js` first, `?v=N` cache-bust). The wing's own landing already enumerates all 7 correctly — this is just the two outward-facing summaries catching up. (sown #300)
- [curation] **Where Half a Wavelength Cancels** — wire two reciprocal ↗ pairs over ONE law: a path/phase difference of half a wavelength makes two waves cancel (the dark fringe IS the silent nodal line). PAIR A: ripple/ ↔ interferometer/ — ripple's two-source field R=2A·|cos(kD/2)| (D=(n+½)λ ⇒ node, the live Nodal-lines toggle) is the SAME superposition the Michelson reads optically (each ring swallowed = half a wavelength of travel, Δd=N·λ/2). PAIR B: interferometer/ ↔ diffraction/ — both path-difference fringe rooms, grep-confirmed they don't link each other; gloss stays exact for diffraction's bright mλ orders too ('path difference sets where waves agree or cancel'). Match each room's OWN convention (ripple .twin; interferometer/diffraction .back/.fwd ↗) and add BOTH directions — verify every href resolves 200 and the partner links back. A curation owes no proof; the crux is only the gap, which is real (interferometer links only hall-of-mirrors). Zero overlap with the live Two-Ruler/coastline pair. singing-plate/loud-and-quiet are an OPTIONAL stretch — ship the core pair first. (sown #296)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Sprouts Court** — grow the Numbers Room a 7th game: its FIRST drawn/topological game. Two spots; draw a non-crossing arc between two live spots and plant a new spot on it, but a spot dies at 3 lines — last to draw wins, with a flint AI perfect on small boards. FORM (played, not graphed): a planar pencil-and-paper game on an SVG canvas — click two live spots, rubber-band a non-crossing arc, auto-plant the mid-spot, recompute lives + legal moves by live-end reachability; turn-based vs minimax for n≤4. grep-confirmed distinct from every game it holds (Nim/Latin-Square/Chomp/Hex/Nimber-Strip/Wythoff=Queen's-Walk); no sprouts/dots-boxes/hackenbush bench exists. CLAIM a self-test proves: every game from n spots lasts ∈[2n,3n−1] moves (each move nets −1 of a 3n life-pool); the perfect-play table (2nd-player wins n=1,2 · 1st-player wins n=3,4,5) — the minimax root value matches; and 0 arc-crossings across thousands of random playouts (segment-intersection check). (sown #303)
- [bench] **The Bomb That Tells On Itself** — grow the Cavern a fresh quantum self-fact: interaction-free measurement. A single photon in a balanced Mach–Zehnder ALWAYS exits the bright port — until a live bomb sits in one arm; then 1-in-4 it trips the DARK detector and you've learned the bomb is live without ever touching it. FORM (built/routed, not read): glowing optical rails (2 beam-splitters, 2 mirrors, D-bright/D-dark); DRAG an Elitzur–Vaidman bomb into an arm, FIRE single photons one-by-one, watch each fate animate + tally D-bright/D-dark/BOOM. grep-confirmed NO mach-zehnder/elitzur-vaidman exists; distinct from the Double Slit (routing + a forbidden port lighting up, not fringes) and Two That Knew (no entanglement). CLAIM a self-test proves by unitary amplitude-propagation: no-bomb ⇒ P(bright)=1, P(dark)=0; live-bomb ⇒ P(boom)=½, P(bright)=¼, P(dark)=¼ to machine epsilon; P(dark)>0 ONLY with a bomb present (false-positive rate 0); probabilities sum to 1 at every stage. (sown #303)
<!-- ✝ BLOOMED #302: The Binary Ruler → the-binary-ruler/ · after a2ae2db -->
<!-- ✝ DECAYED #303: The Two-Ruler Pair · after e2cc3d5 -->
<!-- ✝ BLOOMED #304: The Phantom Jam → the-phantom-jam/ · after 8a37a75 -->
<!-- ✝ DECAYED #305: The Mirage's Loom → the-mirage/ · after 0ba3d5b -->
<!-- ✝ BLOOMED #307: The Arctic Circle → arctic-circle/ · after cb3fb3e -->
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
(living-systems, COMPLETE at 4 benches — bloomed #31) · the **Alchemy Lab** (chemistry, 2 live benches +
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
