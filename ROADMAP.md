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
- [bug] **The front door's POI hover dies across a whole region after you view a room's info card — because the HIDDEN card keeps intercepting pointer events: its inner panel stays `pointer-events:auto` while invisible, blanketing the POIs beneath it.** REPRO (clearest in the Observatory Rise concentric ring, where POIs cluster tightly): tour to a district, hover a POI so its info card appears, move OFF that POI so the card hides, then try to hover a nearby POI that sits where the card was drawn — it does NOT light up and shows NO card; the neighbouring POIs under that footprint are dead too; hover only starts working again once the pointer crosses OUT of the (invisible) card's rectangle. ROOT CAUSE (confirmed by elementFromPoint + computed style — the topmost element over the dead POIs is `.card-inner`, not the POI and NOT any precinct/“blue” rectangle; index.src.html card CSS ~lines 296–307): `#card` is correctly `pointer-events:none`, but `.card-inner` overrides to `pointer-events:auto` so the pointer can travel onto the card to scroll a long popup. The card's `.show` class toggles ONLY opacity (0 ↔ 1); it never changes display/visibility or the inner's pointer-events. So a "hidden" card is `opacity:0` but still `display:block`, and its `.card-inner` is still `pointer-events:auto`, occupying its full rectangle (measured ~284 × ~790 px — most of the vertical centre-right of the viewport) and SWALLOWING `mouseenter`/`mouseleave` for every POI under it. The card is anchored beside the last POI you hovered, so its invisible footprint lands right on that POI's neighbours — in a tight ring cluster that is many rooms at once. NOTE: the dashed precinct/wing "blue dotted rectangles" are NOT the cause (they test clean as topmost over the POIs); the interferer is the invisible card. FIX: the card-inner must be interactive ONLY while the card is actually shown — scope it, e.g. `.card-inner{ pointer-events:none; }` plus `#card.show .card-inner{ pointer-events:auto; }` (or set the whole `#card` to `pointer-events:none` / `visibility:hidden` whenever it lacks `.show`). That preserves the pointer→card scroll-grace while the card is UP, and stops the hidden card from blocking hover once it is down. SECONDARY (worth a look while here, not required for the fix): the hidden card's box measures ~790 px tall — it should collapse to nothing when empty/hidden rather than retain a huge dead rectangle; but scoping pointer-events to `.show` fixes the reported breakage regardless of the box size. VERIFY WITH A REAL CURSOR in the Observatory Rise: hover a ring POI → move off so its card hides → then hover EACH neighbouring ring POI in turn → every one must light up and show its own card with no dead zone, from any approach direction; repeat around the whole ring and confirm the hidden card never intercepts.
<!-- ✝ FIXED #273: Structural-colour's missing front door → structural-colour/ · after 5da97e9 -->
<!-- ✝ FIXED #275: The front door's OBSERVATORY RISE plate overlaps its POIs — the distric… → tools/layout/layout.js · after 3eea3fa -->
<!-- ✝ FIXED #276: The front door's engraved DISTRICT zone-caption (e.g. "THE MANOR HOUSE"… → index.src.html (the LOUPE ZONE_LABEL.forEach op… · after ab7ad4a -->
<!-- ✝ FIXED #277: The front door's bottom-left NAV PLATEBAR covers the footer project lin… → index.html (front door) · after 2691595 -->
<!-- ✝ FIXED #278: The front door's POI hover state machine drops the info card when you m… → index.html · after 37e55e8 -->
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
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **A second metagame AXIS — the estate as a CIRCUIT you carry proven values around, not a checklist you complete** — today rooms drop one-way `ws:` crumbs the Undercroft COLLECTS (visit→unlock); but each room also PRODUCES an exact certified quantity (Euclid→a gcd · a Source Dial→a bit-rate · Galton→a distribution) that dies at the room's edge. The open kind: a metagame where one room's PROVEN output is the LEGAL KEY another room CONSUMES — a directed graph of rooms wired by output-type=input-type, completed by carrying a token around a CIRCUIT. Threads rooms by their MATH, not by visitation.
- ⚡ **The teacup caustic** — The bright cardioid cusp that floats on coffee/tea when a point light grazes the cup's inner wall — light reflecting off a circular arc envelopes into a cardioid (the n=2 catacaustic of a circle). A tiny touchable: drag the light around the rim, watch the cusp ride the surface. Kin to optics' Caustic + the Numbers Room's modular Cardioid string-art (same curve, two origins).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
- ⚡ **A real-time camera-navigable 3D medium** — the estate has text · visuals · sound · audio-render · flat shader-fields, but no SCENE you move a camera through; first proof-of-life could make the ACT of navigating the content itself (an anamorphosis you walk into — a tangle that resolves into one legible form only from the one vantage you must find, the resolving pose the provable solution of an alignment equation, not eyeballed).
- ⚡ **The Drawing Engines & flow benches** — sibling veins for later swings: geometry instruments that COMPUTE BY DRAWING (ellipsograph · pantograph · Peaucellier's exact straight-line linkage) — a natural neighbor wing to the Reckoning Cabinet — and a Wind Tunnel foil you TILT until the stall breaks at the critical angle (lift ∝ circulation Γ, the Kutta condition the exact crux), kin to the potential-flow / soap-film vein.
- ⚡ **amusement park** — explore the physics of fun!  2.5D rollercoasters with proven physics ; centrifugal forces explained through spinning floor drop ; the geometric motion of a rider on the teacup ride
- ⚡ **astrophysics room** — the physics of the universe ; hawking radiation via particle pairs visual primer ; stellar fusion ; the death of a star and what determines its final state ; a study of the big bang ; galactic structures and how galaxies form
<!-- ✝ BLOOMED #161: The estate measures the WORLD but never the OBSERVER moving through it → relativity/ · after f9ef707 -->
<!-- ✝ DECAYED #279: The estate with more than one front door → superseded by #262 More Than One Front Door · after 8585251 -->
<!-- ✝ TAILORED #279: A self-healing plate that auto-subdivides a wing when it crosses the fl… → tailored into the engine grounds seed The Self-… · after 8585251 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [engine] **The Self-Healing Plate — the front door re-partitions ITSELF, no hand-tuned grain** — today's PLATES (#262) hand-pick their grain in `plateOf` (layout.js:759, the grounds W/E midline + the cavern/outbuilding 'outskirts' pool). Generalize it into a recursive `Layout.plates` that DERIVES the grain: start from the whole estate as ONE plate; whenever a plate's name-only re-lay (`relayPlate`→`Leg.score{nameOnly}`) composites ≥ the legibility floor (THRESHOLD 0.30), AUTO-split it at the WIDEST gap between its wing-cluster centroids (the principled successor to the hand midline) and recurse until every plate clears the floor ALONE — the estate grows rooms indefinitely and the door re-partitions itself. FORM: a reusable ENGINE in tools/layout/ feeding the EXISTING front door — REPLACES the hand grain in `plateOf`, no new visitor room; the #262 cover/road-graph cruxes still hold over the self-derived plates (re-derive the road graph from adjacency too, not the hand-wired plate IDs). CRUX (a headless Node twin reusing smoke.cjs + legibility.cjs, split): over the live corpus (65 places, today all <0.30) the splitter (1) TERMINATES and (2) yields a TOTAL+DISJOINT cover where EVERY plate scores <0.30 — and stays correct on a synthetic +N rooms. NEG-CONTROL — fail LOUD never loop: a degenerate corpus crammed into ONE wing (no centroid seam parts it) throws a NAMED build error via a hard recursion-depth/no-progress guard, NOT infinite recursion. (sown #279 · contest #25)
- [medium] **The Construction Bench — a figure you BUILD with straightedge & compass, where what you can't draw is a THEOREM** — a composable authoring medium the estate lacks (grep: no dynamic-geometry/construction-tree code anywhere; the only `straightedge` is the Nomograph's read-a-chart, not a construction). Toolbar = exactly two primitives, LINE (through two points) + CIRCLE (centre, through a point); every new point is born as an INTERSECTION and drag-recomputes the whole dependency graph live. FORM=content: a brass rule+compass your hand assembles a figure with, and the soul-move is that the bench mechanically certifies a target UNREACHABLE, not by fiat. CRUX (construction-bench/core.mjs SOLE authority + Node twin, split): constructed coords live in an iterated quadratic field tower over ℚ; EXACT==render <1e-9 and reachable targets have degree a power of 2 (pentagon deg-2, Gauss's 17-gon deg-16); the IMPOSSIBILITY CERTIFICATE (load-bearing) shows trisect-60°/double-the-cube/heptagon force an irreducible degree-3 minimal poly (3∤2^k) → provably out of reach of ANY finite line-circle program. NEG-CONTROLS the visitor can TRIP: a fake-trisector tool / a marked-ruler (neusis) toggle each suddenly LAND the degree-3 targets (impossibility is a property of the TWO tools); a claimed-equal point fails its minimal-poly root-test >1e-2. FOOTPRINT: NEW top-level room construction-bench/, new front-door footprint + a new WING_META slug 'FIGURES YOU CONSTRUCT', DISTINCT from DRAWING ENGINES (which draws ONE curve by a fixed linkage). (sown #279 · contest #25)
- [metagame] **The Cartouche — a passport you stamp by carrying one room's proven OUTPUT into another room as its legal MOVE** — the estate has ONE metagame (the Undercroft: passive `ws:` crumbs → unlock → trophies); this is a SECOND, ORTHOGONAL axis that threads rooms by their MATH, not by visitation. FORM: a brass-cornered traveler's PASSPORT (a carried artifact, not a wall chart) whose spread shows a CIRCUIT of room-stamps; a wax SEAL you drag from a room you've just operated to the next room whose required input TYPE matches the output you hold — operate the Euclid Engine → the seal carries {type:gcd,value:g} → only gcd-accepting rooms (Cutting Gears, Spirograph) light up → carry it, they CONSUME the value to seat their dial → continue until the seal returns to origin and the cartouche SEALS. Won by closing a type-matched CIRCUIT, not by visiting all rooms. FOOTPRINT: a NEW metagame surface — one top-level page cartouche/index.html + a tiny tools/ws/courier.js (the new `ws:carry:*` channel + a room→{accepts,emits} registry), NOT a wing landing and NOT the Undercroft (never reads ws:seen, stays bonus-not-blocker); the build wires EXACTLY ONE closed loop (gcd→ratio→gcd) to prove the surface, the rest grow as garden benches. CRUX (cartouche/core.mjs SOLE authority + Node twin, split): a typed directed graph (edge A→B iff A.emits∩B.accepts≠∅); a stamp is LEGAL ⟺ such an edge exists AND the value passes B's guard; SEALS ⟺ the stamped walk is a CLOSED cycle with type-continuity at every hop (start===end value, an algebraic identity for the gcd→ratio→gcd loop). NEG-CONTROLS that fire: wrong-type stamp rejected (no edge); right-type/failed-guard rejected; a non-returning walk never seals; a free-stamp foil provably fails the twin's edge-check. (sown #279 · contest #25)
- [medium] **The Camera Maze — a 3-D word you fly THROUGH until depth itself spells it** — a grounds medium where flying a camera down a corridor of glyph-shards IS the content — DISTINCT from the built Vantage (vantage/ #151, `vantages` = "scenes you ORBIT from outside"). ~60 gilt 3-D tics hang along a depth-runway as nonsense from every doorway; from the ONE earned 6-DOF pose — yaw, pitch, AND the ROLL the Vantage REFUSED (core.mjs: "THREE DOFs, NOT FOUR… no roll"), plus a dolly carrying you INTO the field not around it — they stack into a legible word, each letter from shards at a DIFFERENT depth so the read coheres only mid-flight. FORM: a touchable fly-through (drag-orbit + scroll-dolly + a roll handle) you steer until it LOCKS, the field warming on an undisplayed per-axis closeness as the Vantage does. FOOTPRINT: NEW top-level room (camera-maze/), own POI/star + a new WING_META slug ("SCENES YOU MOVE THROUGH"), kin to but DISTINCT from `vantages`, in the observatory. CRUX (camera-maze/core.mjs SOLE camera authority + headless Node twin, split each): forward-construct a FULL 6-DOF pose incl. roll — back-project each glyph vertex along per-vertex depth through the exact inverse of a 3-rotation+dolly π so r(C*)=Σ‖π−T‖² is an algebraic identity <1e-9. Roll PROVEN load-bearing: perturb roll alone ⇒ r exceeds a per-axis τ with ≥2× margin (the claim the Vantage CANNOT make); a roll-frozen control never reaches r<τ for a roll-built target. NEG-CONTROL: a random shard cloud never locks (best r over a dense 6-DOF grid ≫ τ); a depth-collapse foil flattening shards to one plane FAILS to spell. (sown #253 · contest #23)
<!-- ✝ BLOOMED #242: The First Light — the Big Bang as a patch of space you STRETCH → first-light/ · after af80b27 -->
<!-- ✝ BLOOMED #252: The Bootstrap Bench — the wave that carries itself (E makes B makes E) → bootstrap-bench/ · after 753b7e4 -->
<!-- ✝ BLOOMED #262: More Than One Front Door — the estate splits into DISTRICT plates you t… → index.html (front door) · tools/layout/ · after ca0921f -->
<!-- ✝ DECAYED #264: The Loaded Dice Foundry — an arbitrary distribution forged into one tou… · after c14029d -->
<!-- ✝ BLOOMED #274: The Drawing Room — a wing gathering the COMPUTE-BY-DRAWING engines, fou… → the-drawing-room/ · after 089f9eb -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **Snell's Window** — a fish looking straight up sees the ENTIRE sky — horizon to horizon — squeezed into one bright circle overhead; outside that disk the water is a mirror of the dark bottom. A touchable pond you dive beneath: drag your gaze and the whole world above compresses into the shrinking porthole. FORM: a turnable underwater view, not a ray diagram. CLAIM: above water bends in by Snell's law, so the 180° sky maps into a cone of half-angle θ_c = asin(1/n) ≈ 48.6° (a 97.2° window) for n=1.33; beyond θ_c it is total internal reflection. Grows the optics/waves vein; the same critical angle Hall of Mirrors proves exact. (sown #267)
- [exhibit] **The Wavefront That Bends — refraction by Huygens wavelets** — A marching wave plane meets a tilted speed-change line; each front-cell is a tiny circular source and their ENVELOPE is the next front — the slow side's shorter wavelets tilt the envelope, so the front bends, exactly n₁sinθ₁=n₂sinθ₂. Drag the tilt/speed-ratio; the bend you SEE is wavelength compressing, no ray drawn. FORM: a wavefront you watch pivot. Crux: envelope-tangent angle = asin((v₂/v₁)sinθ₁) to <1e-9, and total internal reflection (no real envelope) exactly when sinθ₁>v₁/v₂. Grep-confirmed gap: refraction-run + lifeguards-run are least-time RAY toys; NO Huygens construction exists. Grows WAVES wing; reuses Ripple's circular-source core byte-identically. (sown #261)





### cross
- [cross] **Every Game Is Secretly Nim** — the Numbers Room already plays Nim, Chomp, and the matchbox Hexapawn as separate puzzles. Reveal they are ONE game: compute the Sprague–Grundy value (the mex of its moves) of any position and watch unrelated heaps collapse to a single NIMBER — the number that tells you instantly who wins. FORM: a playable board where each position lights its Grundy value and a "best move" zeroes the XOR. CLAIM: every impartial game equals a Nim-heap of its Grundy value; a position is lost exactly when the XOR of the heaps' nimbers is 0. (sown #267)
- [cross] **The Cardioid Drawn Three Ways** — A touchable rolling-disk you crank — a coin rolls on an equal coin, its rim tracing a live cardioid r=2a(1+cosθ) — set beside the SAME curve as the times-table k=2 chord-envelope and as a point-source catacaustic on a circular mirror. FORM: touchable/crankable, not a graph. CLAIM: rolling-circle epicycloid == mod-m k=2 envelope == on-circle catacaustic — one curve. CRUX: sample all three at matched θ, align by cusp, max pointwise distance <1e-9. cardioid/core.mjs already proves envelope==epicycloid (<1e-12); this adds the literal rolling-disk leg (no room draws it) + the optical witness. Sited where the Numbers Room meets Optics. (sown #261)


### curation
- [curation] **The Roulette Family & the Caustic Kinship — ↗ links across two orphaned curve-clans** — Pure taste-work: reciprocal ↗ sibling links across rooms that share one physics and ZERO hrefs. The rolling/sum-of-circles clan — cardioid ↔ teacups ↔ spirograph ↔ tusi ↔ epicycles ↔ the new cardioid cross. The caustic clan — optics' Caustic ↔ rainbow (captioned 'caustic of minimum deviation') ↔ halo (computes a caustic), with cardioid as the hinge (it IS a catacaustic). Grep-confirmed: all eight rooms have ↗=0. Restores the 'rays/circles pile into a bright curve' thread. Owes NO proof; verify links resolve 200 + reciprocate. (sown #261)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
<!-- ✝ BLOOMED #268: The Two Bulges → two-bulges/ · after a7ff176 -->
<!-- ✝ BLOOMED #269: The Top That Won't Fall → the-top/ · after 808c431 -->
<!-- ✝ DUPLICATE #269: Buffon's Needle → buffon/ · after 808c431 -->
<!-- ✝ BLOOMED #270: Why the Sky Is Blue → why-the-sky-is-blue/ · after 69593c4 -->
<!-- ✝ DECAYED #270: The interference-as-colour triangle · after 69593c4 -->
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
