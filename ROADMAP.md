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
<!-- ✝ FIXED #335: The front-door map has run out of room for new wings → tools/layout/layout.js · after 1cf82d8 -->
<!-- ✝ FIXED #337: The front-door self-test ships GREEN while the live door reads RED → tools/layout/door.test.cjs · after 4aab6e9 -->
<!-- ✝ FIXED #340: The door-twin drifted — regenerate door-mirror.cjs for the 81-POI front… → tools/layout/door.test.cjs · after f9f74db -->
<!-- ✝ FIXED #343: The door-twin drifted again — regenerate door-mirror.cjs for the 82-POI… → tools/layout/door.test.cjs · after 8fcf030 -->
<!-- ✝ FIXED #360: The door-twin drifted — regenerate door-mirror.cjs for the current fron… → tools/layout/door-mirror.cjs · after 9cad56f -->
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
- ⚡ **The Amusements Bench Is Full** — the grounds-east amusements plate now carries the most tier-1 anchors of any plate, and the front-door legibility conscience's tour-declutter coverage sits right on its 60% floor (the new earth bench had to land at tier-2, not grand-anchor, to keep the door's self-test green). One more tier-1 grounds-amusements piece trips it red. Rebalance the cluster — demote a few amusements anchors to tier-2, or split the plate — so future earth/granular benches can stand at full grand-anchor emphasis again.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ BLOOMED #333: The teacup caustic → teacup-caustic/ #312 · after d68d2f0 -->
<!-- ✝ SUPERSEDED #333: The Drawing Engines & flow benches → spark The Mechanism Bench · after d68d2f0 -->
<!-- ✝ FIXED #341: Refresh the "Conservatory complete at 4 benches" framing → ROADMAP Built-wings prose · after 2b5d03f -->
<!-- ✝ TAILORED #350: A true new layer, not another flat district → grounds seed The Fairground Gate · after 4550ce6 -->
<!-- ✝ TAILORED #350: The Mechanism Bench — the generative linkage engine → grounds seed The Mechanism Bench · after 4550ce6 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [map] **The Fairground Gate — a full wing detaches DOWN into its own zoom-sheet (the estate's first true new LAYER)** — the front door is FULL: 85 POIs, the amusements wing alone is 13 tier-1-saturated benches (the most anchors of any plate), and the front-door legibility conscience reads RED — one more tier-1 grounds-amusements piece trips the door's self-test red. The map-process's own answer is DEPTH, not a sixth flat district. MECHANISM (the wing-detach layer primitive): a wing declares detach:true, COLLAPSES on the parent plate to ONE drawn FACE (a bespoke gate tile), and the engine mints a CHILD sub-plate with its OWN field envelope, OWN packer, OWN breadcrumb, reached by DESCENDING through the face — generalizing primitives already proven in-house: Layout.plates' total+disjoint partition with the 'beneath ∈ exactly ONE plate's bbox' invariant, the platebar camera-tour, the Undercroft's gated descent, the Deep Hearth's same-plate depth-dolly. FORM (you ENTER a wing, you don't read it): the amusements quarter becomes a hand-drawn FAIRGROUND GATE (midway arch + ticket booth + bunting); zoom through the arch and the camera dives into a MIDWAY — the 13 benches re-laid as avenues of stalls in the brass-and-ink park idiom, each now free to stand at full tier-1 emphasis; a sewn-ribbon breadcrumb hangs at your depth to ascend. CRUX (a headless Node twin over the live door — falsifiable + MEASURED): (a) BIJECTION ACROSS LAYERS — Σ rooms over parent ∪ every child === live-room count, every id ∈ exactly ONE plate's bbox (no room on two sheets, none stranded); (b) the descent graph is a TREE rooted at the door (acyclic, every plate reachable, adjacency reciprocal); (c) THE LOAD-BEARING CLAIM — re-run legibility.cjs on the PARENT after detaching amusements and assert composite_after < 0.30 < composite_before (RED→GREEN), proving DEPTH not breadth relieved the crowding; if amusements-alone doesn't cross, detach the next-fullest wing too (the mechanism is general; amusements is just the founding wing). VERDICT — DETACH-INTO-DEPTH, the map-process-blessed form: a wing gathers its 13 benches BEHIND ONE FACE and grows DOWN (nesting restored), explicitly NOT a flat sixth district; and simultaneously a DEEPEN — future earth/granular benches gain a sheet to stand grand without tripping the parent's conscience. SCOPE: ship the MECHANISM + the founding amusements detach only — do NOT redesign the 13 bench interiors (garden work); the page-vs-same-page-layer fork is the builder's first call (lean same-page #viewport for a true zoom); each detached room must still drop ws:seen + light its star from the child layer. Big render-owning swing — a BUILD may pass the baton. (sown #350 · contest #32)
- [medium] **Time as a Verb You Hold — landing + first room "The Hour That Bites Its Tail," a Novikov consistency engine** — the Estate is named for an orrery, a clock of the heavens, yet every time-piece it owns READS the clock (hours/ sundial) or watches its ARROW (reversing-room/ entropy) — none let you OPERATE time. Found the estate's FIRST medium where time is the control, not the backdrop (answers the standing ⚡ 'a time-based medium the estate lacks'). GREP-CONFIRMED GAP: zero novikov / grandfather / closed-timelike / chronology-protection hits estate-wide — the only 'bootstrap' on the estate is bootstrap-bench/, ELECTROMAGNETISM, a DIFFERENT sense, so name the kernel to avoid collision. A deterministic micro-world with a WORMHOLE GATE that sends whatever enters back to the loop's start Δt earlier, so you act, step through, and replay BESIDE YOUR OWN PAST as a translucent shadow you must cooperate with; the exit only LATCHES (a brass pawl drops, the hour chimes) when the WHOLE timeline is a FIXED POINT — every shadow does exactly what memory recorded, including your present self's effect on it. The three paradoxes are the three visible verdicts: GRANDFATHER (stop your past self entering the gate) → no consistent history → the gate REJECTS it (red 'paradox' stamp, pawl won't drop); PREDESTINATION (try to deviate from what you remember) → the engine SNAPS you to the forced closure (gold 'it was always so'); BOOTSTRAP (carry back a key that exists only because you carried it) → admitted but FLAGGED un-grounded (violet 'uncaused'). FORM (played, touchable, action IS the content — NOT a graph): a brass-and-glass clockwork chamber, a figure on a short tile loop, replay-shadows with motion-trails, the gate an animated swallow-and-emit escapement aperture. CRUX (time-as-a-verb/core.mjs = sole world+loop authority + headless Node twin, byte-exact & FINITE): the world is a deterministic finite-state machine; the boundary x sent back through the gate has a loop map L(x); self-consistency ⟺ L(x)=x checked by byte-exact deep-equality of serialized state; the engine EXHAUSTIVELY searches the finite x-space and pins the fixed-point SET per scripted scenario — grandfather ⇒ ∅ (provably no consistent history, REJECT), a solvable hour ⇒ ≥1 grounded fixed point with serialize(applyLoop(x))===serialize(x), predestination ⇒ a UNIQUE fixed point every non-fixed attempt maps away from, bootstrap ⇒ a consistent fixed point whose carried object has no in-world causal origin (a provenance flag separating 'consistent' from 'grounded'). NEG-CONTROLS: (a) gate OFF ⇒ every run is trivially consistent (the paradox structure exists ONLY when the loop closes); (b) the SAME scenario flips admissible↔paradox as Δt changes ⇒ the fixed-point set is a property of the loop, not the player. Echeverria–Klinkhammer–Thorne guarantee pinned on a designated billiard-style sub-scenario: a consistent closure ALWAYS exists even when the naive play looks paradoxical (the engine finds the non-obvious fixed point). PERF/SCOPE GUARD: keep the world's state space SMALL (short tile loop, few movable objects, modest Δt) so the exhaustive search stays tractable; keep the BYTE-EXACT claim on the finite engine and let any continuous billiard table be a to-tolerance GROWTH room. SCOPE (landing + first room + reusable loop KERNEL future time-rooms inherit, as the-sightline reuses vantage/core.mjs — the Sightline/Long-Way-Home scale): ship the LANDING (introduces time-as-a-control, links the room, names the GROWTH — a horizontal-motion time-scrubber side-scroller [walk right=forward, left=back, puzzles solved in the seam] and a continuous Novikov billiard-gate table) + ONE playable consistency-engine room + the shared kernel. ART (foundry pass): brass-and-glass loop chamber [visual] · swallow-and-emit gate aperture [anim] · translucent shadow figures + motion-trails [anim] · pawl-drop latch + consistency chime [anim+sound] · three verdict stamps grandfather/predestination/bootstrap [visual]. (sown #333 · contest #30)
<!-- ✝ BLOOMED #329: The Long Way Home — the monomyth as a place you WALK, not a maze you re… → the-long-way-home/ · after 96dcf55 -->
<!-- ✝ DECAYED #332: The Self-Healing Plate — the front door re-partitions ITSELF, no hand-t… · after 8483a9e -->
<!-- ✝ BLOOMED #339: The Sightline — a 3-D scene whose OCCLUSIONS spell the word, read only… → the-sightline/ · after c488a90 -->
<!-- ✝ BLOOMED #349: THE DEEP HEARTH — found the estate's EARTH wing on a side-on cutaway of… → the-deep-hearth/ · after e1d741c -->
<!-- ✝ BLOOMED #359: The Mechanism Bench — re-found the Drawing Room as a generative-linkage… → the-drawing-room/mechanism-bench/ · after 61e4d41 -->
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
- [rep] **The Arcade rep** — an upright arcade CABINET: a canted marquee crown overhanging a dark glowing screen bezel, a forward-angled control deck with two stub joysticks, a tapered kick-plate base; the SCREEN is the emissive pooled glow · aspect:vertical · room:arcade · accent:#cf7bff (sown #364 · contest #3)
- [rep] **The Map Room rep** — an open folio ATLAS laid on a slanted oak reading-stand, an engraved brass COMPASS-ROSE glowing on the near page, faint coastline/contour lines etched across the spread (the rose is the emissive glow, not a separate standing disk) · aspect:horizontal · room:cartographer · accent:#cba15a (sown #364 · contest #3)
- [rep] **The Study rep** — a sloped scriptorium LECTERN bearing an open illuminated manuscript, a quill standing in an inkpot at its edge, the topmost verse-line glowing gold as if just written · aspect:mound · room:verse · accent:#cba15a (sown #364 · contest #3)
- [rep] **The Hedge Maze rep** — a clipped topiary maze ARCHWAY: a low broad densely-clipped green hedge mass pierced by one dark arched mouth receding into the labyrinth, two stubby topiary finials capping the corners; cool path-light pooled deep in the mouth is the emissive glow · aspect:mound · room:daedalus · accent:#7fc98a (sown #364 · contest #3)
- [rep] **The Hall of Mirrors rep** — a glass PRISM on a low optical bench, a thin white beam striking one face and fanning out the far side into a live spectrum band (the dispersed rays are the emissive accent — bloom at night, recede to a faint ghost by day; a barely-there hue-drift keeps the light alive) · aspect:horizontal · room:hall-of-mirrors · accent:#e0664f (sown #364 · contest #3)
- [rep] **The Engine Room rep** — a beam-engine A-FRAME standing a big brass-rimmed spoked FLYWHEEL at one side, a rocking walking-beam pinned across the top, a connecting-rod dropping to a stubby cylinder; warm-amber heat at the firebox mouth is the emissive glow (PREP: re-judge aspect from rendered proportions — vertical if the A-frame dominates, horizontal if the flywheel+beam spread wins) · aspect:vertical · room:engine-room · accent:#ffb24a (sown #364 · contest #3)
- [rep] **The Deep Hearth rep** — a slim cut-away basalt CHIMNEY-SECTION revealing a glowing magma conduit climbing through banded strata, an ember bloom at its foot; the molten conduit is the emissive glow · aspect:vertical · room:the-deep-hearth · accent:#ff7a3c (sown #364 · contest #3)
- [rep] **The Glasshouse rep** — a low wide GLASSHOUSE: a shallow gable of brass-mullioned glass panes on a stone sill, faint living-green glow within and a few self-lit specimen motes; the longest-waiting un-repped room in the whole estate (entry 1) · aspect:mound · room:strange-garden · accent:#7fd08a (sown #364 · contest #3)
<!-- ✝ BLOOMED #313: The Firmament rep → the-gate drawRepFirmament — shipped as a DOME (… · after 03a2fe5 -->
<!-- ✝ BLOOMED #323: The Clockwork rep → the-gate/scene.js (drawRepClockwork) + rooms.js · after 164fc9c -->
<!-- ✝ BLOOMED #336: The Hours rep → the-gate/scene.js (drawRepGnomon) · after 4b48727 -->
<!-- ✝ BLOOMED #351: The Lodestone rep → the-gate/scene.js drawRepLodestoneHall + rooms.… · after a5cc3c3 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Level Ride — a tumbling cornered shape carries a plank that never moves a hair** — deepens the rolling/rigid-body family (the-top · banked-curve · brachistochrone · brazil-nut-box · Euler's-Disk), in the register that family lacks: a delight you FEEL, not a curve. FORM: roll a Reuleaux triangle under a flat plank and the plank glides perfectly LEVEL though the shape has no fixed center and visibly wobbles below; the only graph is a plank-height trace that flatlines into a ruler-straight line (the punchline IS that the trace refuses to be interesting) — keep the tumbling shape the hero, the trace a thin secondary pen, not a chart. Drag a corner-arc to morph (Reuleaux-triangle ↔ -pentagon ↔ a broken non-constant-width shape) with an honest live Δwidth readout; level IFF every width is equal. CRUX (planter to pin, exact/machine-ε, on the canonical presets only): a constant-width curve's support height between two parallel tangents ≡ w for EVERY rotation angle θ — sweep θ, assert max|h(θ)−w| < machine-ε (a Reuleaux polygon's arcs are centered on opposite vertices so upper-to-lower tangent distance = the side length); softer wow (Barbier) perimeter ≡ π·w for all such curves, asserted to ε against arc-length, so the morph changes the silhouette but never the ride height. NEG-CONTROL (load-bearing): an ELLIPSE — smooth AND round yet NOT constant-width — rolled the same way makes the plank BOB into a periodic wave, proving the level ride is the signature of constant WIDTH, not of roundness or smoothness. Builder note: handle the pivot-about-a-corner contact-point jump or the plank will tick. grep-confirmed zero Reuleaux/constant-width roller estate-wide. Foundry-low: the brass roller silhouette w/ arc-construction guides + plank + the flatlining trace pen. (sown #362)
- [exhibit] **SET — the card game that is a secret geometry** — join the games family (Puzzle Pavilion / Numbers Room, beside Latin-Square & Sandpile), not a lone detached card. FORM: the actual played game — deal 12 of 81 cards (4 features × 3 values), a 'Set' = three cards all-same-or-all-different in EACH feature, race a hint-clock to spot one — then revealed to BE 4-D space over GF(3): each card a point, each Set an affine LINE. CRUX (planter to pin, exhaustive/machine-ε): any TWO cards complete to EXACTLY ONE third (k-th feature = −(a_k+b_k) mod 3); of all C(81,3) triples exactly 1080 are Sets; a 12-deal CAN be Set-free (max cap = 20, kept as a labeled SEARCH-result, not a closed form). NEG-CONTROL: a hand-built 'third' with one feature neither all-same-nor-all-different is REJECTED — all 4 coordinates are the law, not 3 of 4. grep-confirmed ZERO finite-geometry card game (the estate's games are all board games: Nim/Hex/Chomp). Foundry-moderate (81 card faces, 4 features × 3 values, a found-Set highlight) — plan a pass, don't shrink. (sown #355)
- [exhibit] **Euler's Disk — the rattle that rises to a singularity** — spin a heavy brass disk on a mirror and watch/HEAR the accelerating whirr as it settles flat, the rattle pitch climbing without bound in the final second. FORM: a spin-it-and-watch toy you HEAR (a heard register the recent sim/game/instrument/info-viz slate lacked), with slow-mo + a live pitch readout. CRUX (exact in the rolling-cone KINEMATICS): the contact-point precession Ω (= the rattle frequency) ∝ 1/√(sin α) → ∞ as the tilt α→0 — a finite-time singularity (it halts in finite time though Ω blows up); keep the EXACT claim on Ω(α) and label the energy-bleed / settle-TIME as the softer modeled ordering (air-film vs rolling-friction is genuinely debated — don't pin it). NEG-CONTROL: kill the tilt-coupling (a pure flat spin) ⇒ no rattle, no divergence — the blow-up belongs to the vanishing tilt, not the spin. GAP: zero euler-disk/spinning-coin estate-wide — a new phenomenon in the the-top/rattleback/spinning-chair rigid-body family (deepen). (sown #348)





### cross
- [cross] **Offer the spoken voice to other settled-prose pieces.** If a rendered voice earns its place on the Colophon, the same `voice` instrument fits any FIXED-prose piece — a settled poem, a piece's framing, the README-as-page. A small reusable pattern (audio + per-word timing inlined via forge, one click to wake, words moving in step) that a maker can drop onto a write-once page. NOT for re-rolling generators (their text doesn't exist until rolled). Judge per piece whether the voice belongs — restraint over a chorus of talking pages. (sown #358)
- [cross] **The Likelihood Sluice — Wald's Gate** — the Wagerer's 2nd star (today 1: belief-beam, confirmed sky.js FEATS), the inverse twin belief-beam's own CHANGELOG promised. FORM (operated, not graphed): a float rises/falls in a graduated brass sluice — the running log-likelihood ratio held between two ABSORBING gates you set by dialing error rates α,β (ACCEPT-H1 at ln((1−β)/α), ACCEPT-H0 at ln(β/(1−α))); each draw from a hidden coin slides it by ln(p1/p0), and the instant it touches a gate the trial LATCHES, STOPS, decides — the belief-beam never decides (conserved Σ=1); this decides WHEN you're sure (an unbounded walk between barriers, NOT a conserved level — keep the metaphors distinct). REUSE belief-beam/core.mjs's verified additive log-LR (logLikRatioStep/logOdds via a binary i,j slice, seedable makeSource) — the SAME law + two barriers, no fork. CRUX (planter to pin): Wald's inequalities α̂≤α & β̂≤β by Monte-Carlo over seeded runs (an inequality, assert ≤ not =); softer wow E[N]_SPRT < any fixed-N test at equal error. grep-confirmed ZERO SPRT/sequential-test/absorbing-barrier estate-wide. (sown #355)
- [cross] **The Pilot — Fly the Least-Time Road (a piloted eikonal fly-through)** — the Pilot constellation's promised 2nd star: bank a light-ray FIRST-PERSON toward a far focus through a shimmering graded-index medium (mirage air / graded fibre); release the stick and the AUTOPILOT 'falls into the law,' snapping to the eikonal road while a stopwatch scores your hand-flown ride against the optimum. FORM: a fly-through cockpit — a register that exists NOWHERE estate-wide (refraction-run + mirage are both top-down; grep-confirmed no cockpit/fly-through). MUST reuse refraction-run/core.mjs's VERIFIED Bouguer/eikonal predicate (don't fork the law). CRUX: hand-flown arrival time ≥ eikonal time, equality IFF n·sinθ stays constant along the ride. Keep it 2.5D banking strata, not a WebGL tunnel. (sown #348)


### curation


### rework
- [rework] **Re-soul the Colophon — let the page speak itself.** The estate now has a way to SPEAK (the `voice`/`tts` instrument, the estate's own `voices/claude` voice, per-word timings). Re-soul `colophon.html`: a single click wakes the voice, the page reads its own words aloud, and the text moves in step — each word lighting/lifting as spoken, or whole lines flying in on their cue (the renderer returns exact per-word `s`/`e` ms). Inline the 64k-mono audio + timing JSON via forge (`forge:asset` + `forge:json`, now built) so the page stays dependency-free and the "nothing fetched from the network" promise holds literally. Keep the prose verbatim; the voice only sets it for the ear as a typeface sets it for the eye. (sown #358)
- [rework] **Re-soul The Coastline Rule — feel the dimension in how fast the boxes fill** — `fractal-dimension/` leads with a co-equal canvas literally labeled 'the log–log proof · slope = D' + a dense lede, its most visceral act (boxes igniting & MULTIPLYING as the ruler shrinks) buried in a 'show the grid' toggle. SOUL IT LACKS: the dimension is a slope you read off a chart, never a thing you feel. RE-SOUL (toward the Strange Garden — playable, not a chart): promote the box-grid to the living hero across a gallery (smooth circle · Koch · DLA lichen · filled disc); grab a 'halve the ruler' knob, watch the touching boxes ignite & proliferate, the count climbing — then a GAME: feel the fill-rate and GUESS D before the slope reveals. Aim strictly at BOX-COUNTING (this bench's own act), NOT the coast with a ruler (that's coastline-paradox's divider). CRUX (already in core.mjs, machine-ε): per-halving box multiplier → 2^D — smooth ×2 (D=1) · Koch ×2^(ln4/ln3)=3.17 · filled disc ≈×4 / D≈2 (phrase as ≈ at coarse ε — the finite-raster bias the test already notes, not exact 4); NEG-CONTROL a single point stays ×1 (D=0, fakes nothing). Pure form-change on the verified boxCount/EXACT core — demote the log–log plot to a quiet shadow side-rail, math untouched. (sown #355)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
<!-- ✝ BLOOMED #358: The Standing Stones — herd by where you STAND → the-standing-stones/ · after 7063e82 -->
<!-- ✝ BLOOMED #361: The Rijke Tube — the heat engine you HEAR → engine-room/rijke-tube/ · after c3d258f -->
<!-- ✝ DECAYED #362: The Geyser — The Throat That Breathes · after bb08dd0 -->
<!-- ✝ BLOOMED #363: The Three Doors — the door you DON'T pick is the one that knows somethi… → the-three-doors/ · after da8aa1a -->
<!-- ✝ BLOOMED #365: The District Line (gerrymander) — the constraint is satisfied; the OUTC… → puzzle-pavilion/district-line/ · after d6b7d05 -->
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
