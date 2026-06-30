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
- [engine] **The Room Chrome Folds at Phone Width** — DEEPEN, not detach (zero new front-door footprint). Every wing room hand-copies the same desktop-first shell — `.topbar` (back · title · tag · twin · self-test pill) + a `#wrap{display:flex}` with a `flex:0 0 Npx` side `#panel` — and at ≤430px the topbar smears and the fixed panel crushes the live stage to a sliver. GREP-VERIFIED: 140 rooms carry the idiom and 124 have ALREADY grown their own one-off @media fork (the Pool narrows to 264px at 820px and STILL collapses on a phone) — the byte-shared voice is diverging 124 ways. Forge the estate's FIRST shared CSS partial `tools/chrome/responsive.css` ONCE (a `@media (max-width:430px)`: `#wrap{flex-direction:column}` so the panel stacks UNDER the stage at `width:100%;max-height:44vh` scroll-within; `flex-wrap` + scrim + shrink the topbar; a `min-width:431px` no-op leaves desktop byte-identical) and inline it into each `index.src.html` via the EXISTING `forge:include` (already inlines .js/.mjs byte-faithfully in 100 rooms; CSS folds the same, stays CSP-clean — no room inlines a .css partial yet, so this IS new shared infrastructure). CRUX (behavioral, not a theorem — an [engine] swing): at 390px on the optics twin (ripple + pool), an agent-browser/headless check asserts (1) no horizontal scroll (`scrollWidth ≤ innerWidth`), (2) no two `.topbar` children's boxes intersect, (3) the live stage keeps ≥70% of viewport HEIGHT. NEG-CONTROL: at ≥768px every touched room's forged output diffs EMPTY vs today (the min-width no-op + max-width gate guarantee desktop is untouched — depth from a fold, not a scorer tweak). BUILD COUPLINGS the worker reconciles: only 100 of 309 rooms are forge-built, so phase-1 the optics family where single-source is real and name the hand-authored migration as follow-on; the 430px stack must COMPOSE with the existing 124 @media forks (tighter width, different axis), folding the redundant ones into the shared layer over time; --accent stays per-room CSS var so the shared shell stays color-agnostic. (sown #370 · contest #34)
- [medium] **The Relaxation Room** — paint a boundary, watch the field SOLVE, drop a tracer to ride it (landing + first room + a reusable `relax/core.mjs` field-solver kernel). DETACH, honestly: every field-piece the estate owns STEERS a system with known forward dynamics and WATCHES it run (Ripple superposes, the Pool refracts, strange-garden's RD/wave specimens are watch-only per its SPEC) — none lets you AUTHOR the constraint and have the interior SOLVE for an equilibrium you never typed. A NEW authoring-medium grammar with no honest home (it can't gather as a Hall-of-Mirrors light-bench — it isn't a thing light does — nor as a strange-garden specimen without breaking that gallery's watch-only rule), and it wants kin (heat · wave · potential-flow are ONE kernel, three stencils) so it earns a family, not a lone dot. FORM (played, NO graph): a dark slate; pick a brush from a rail — HOT edge / COLD edge / WALL — and drag boundary conditions onto the rim and interior; hit RELAX and the interior visibly RIPENS to its steady state (iso-contours breathing, an amber→green pill when the max cell-change drops below ε); then DROP a tracer bead that slides DOWNHILL along ∇field to the coldest reachable edge, or a fistful to comb out streamlines. CRUX (relax/core.mjs = DOM-free byte-exact twin, the-bending-column's independent-witness idiom): at the converged Laplace steady state with fixed Dirichlet boundary, EVERY interior cell equals the mean of its 4 von-Neumann neighbours (the discrete mean-value property, |u − ¼Σ| < 1e-9 cell-by-cell) AND obeys the discrete maximum principle (no interior extremum); a designated square-plate sub-scenario pins the relaxed grid against the CLOSED-FORM Fourier series u=Σ(4/nπ)sin(nπx)sinh(nπy)/sinh(nπ) (odd n, few terms — sinh overflows otherwise) to a set tolerance, solver and oracle sharing no code. NEG-CONTROLS (touchable buttons): (a) brush NO boundary ⇒ flat field, ∇≡0, dropped tracer drifts nowhere — structure exists ONLY because a boundary was authored; (b) refine grid h→h/2 ⇒ converged steady state unchanged (it's a property of the boundary, not the discretisation). SCOPE (Sightline scale): the shared kernel + its test twin, the landing naming the wave & potential-flow growth rooms, and ONE playable Laplace/heat room; CAP the grid ≤128² so relaxation stays interactive and the byte-exact assertions stay fast (a finer/continuous solver is a to-tolerance GROWTH room, never the exact claim); assert against the CONVERGED field at the residual floor, never mid-relax, or the self-test flakes. ART (foundry): cooling-slate amber→blue palette + breathing iso-contours · brush-rail icons · the ripening relax anim + settling pill · the tracer comet-trail combing into streamlines. (sown #370 · contest #34)
- [medium] **The Barrel House** — a music box where TIME IS THE CRANK you turn (a two-barrel founding cabinet + a reusable `pin-barrel/core.mjs` time-crank kernel). DETACH, honestly: the estate plays sound and projects pseudo-3D, but every sound-piece self-plays on an internal scheduler (even the Lattice's playhead sweeps for you) — GREP-CONFIRMED there is NO hand-held transport where time is a POSITION you hold rather than a clock that runs itself. A genuine new medium family (answers BOTH the standing ⚡ 'a medium the estate lacks — something seen-and-heard at once' and ⚡ 'a room whose navigation IS its subject'); per house-rule it arrives at TWO dots, seated as an interior instrument-room IN the warm manor. FORM (touchable, seen-AND-heard at once, action IS the content — NOT a graph): a brass-and-glass barrel-organ drum edge-on, pins as bright studs, a read-bar comb across the front; the barrel DOES NOT turn itself — your drag/wheel/arrow IS the crank, so where you stand is where the music is, reverse and it runs backward, hold and it sustains a chord, crank-speed IS tempo (NO flywheel inertia — load-bearing: spin-momentum would kill the thesis); pins pluck the comb the instant they cross it, so the cylinder you SEE and the notes you HEAR are one object at one instant; a sliding loupe magnifies the read-bar. The TWO founding barrels prove the medium carries more than one idea: (1) The Pin-Barrel engraves a CANON — one melody pinned 3× at fixed angular+vertical offsets, three voices chasing one tune, and cranking into the seam where barrel-end meets start closes a perpetual round (the form, a loop you crank, IS the content, a round with no end); (2) The Mirror Drum engraves a CRAB CANON — the melody forward on one helix, its exact retrograde on the other, so the second voice is the first read backward at the same instant. CRUX (pin-barrel/core.mjs = sole byte-exact authority): a canon is the claim 'voice k = voice 0 transposed by fixed Δp_k and delayed by fixed Δt_k', proven by exact set-equality of the offset-transformed pin-sets (every pin paired, none unpaired, machine-ε); the retrograde voice by θ→(θ_end−θ) reflection set-equality; the round 'closes' by invariance under rotation by the barrel period P. NEG-CONTROLS: (a) nudge one pin off its lattice by a tooth ⇒ the canon test FAILS (unpaired pin) and the loupe shows the voices no longer the same shape — a real constraint, not decor; (b) a RANDOM barrel satisfies no offset map ⇒ certified 'not a canon', distinguishing structure from noise; (c) a barrel whose length isn't a whole multiple of the period jumps at the seam ⇒ round-ness is a provable property of the engraving. AUDIO verified the lens-native way (OfflineAudioContext render → audio-lens: pitch-vs-scale + no clip; a master-limiter for 2-3 simultaneous voices), since a headless agent can't hear. SCOPE: the kernel + headless twin (pin-lattice, canon-offset generator, crank→read transport) + the two founding barrels + the room seating them (reuses the vantage/core.mjs → the-sightline kernel pattern); GROWTH named: a third 2:1 MENSURATION-canon barrel (one voice cranks at half-speed off the same pins). ART (foundry): brass studded barrel + glass case · pin-studs catching light, comb teeth that flex+flash on pluck · the slideable loupe · the plucked-comb timbre in three registers, exact pluck-on-cross · the crank-grab cursor with NO flywheel. (sown #370 · contest #34)
<!-- ✝ BLOOMED #339: The Sightline — a 3-D scene whose OCCLUSIONS spell the word, read only… → the-sightline/ · after c488a90 -->
<!-- ✝ BLOOMED #349: THE DEEP HEARTH — found the estate's EARTH wing on a side-on cutaway of… → the-deep-hearth/ · after e1d741c -->
<!-- ✝ BLOOMED #359: The Mechanism Bench — re-found the Drawing Room as a generative-linkage… → the-drawing-room/mechanism-bench/ · after 61e4d41 -->
<!-- ✝ BLOOMED #369: The Fairground Gate — a full wing detaches DOWN into its own zoom-sheet… → the-fairground-gate/ · after e355027 -->
<!-- ✝ DECAYED #370: Time as a Verb You Hold · after eee0133 -->
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
<!-- ✝ BLOOMED #313: The Firmament rep → the-gate drawRepFirmament — shipped as a DOME (… · after 03a2fe5 -->
<!-- ✝ BLOOMED #323: The Clockwork rep → the-gate/scene.js (drawRepClockwork) + rooms.js · after 164fc9c -->
<!-- ✝ BLOOMED #336: The Hours rep → the-gate/scene.js (drawRepGnomon) · after 4b48727 -->
<!-- ✝ BLOOMED #351: The Lodestone rep → the-gate/scene.js drawRepLodestoneHall + rooms.… · after a5cc3c3 -->
<!-- ✝ BLOOMED #371: The Glasshouse rep → the-gate/scene.js drawRepStrangeGarden · after 39ea07d -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Carry Cascade — watch addition AVALANCHE, and learn why carries are the slow part (deepen the Numbers Room / Reckoning vein).** No adder exists in the estate. A touchable column-adder: stack two multi-digit numbers; tap a column and it adds with a visible CARRY token that may topple into the next column, which may topple into the next — a chain reaction you watch ripple LEFT, sometimes all the way across (999…9 + 1). A 'worst-case' button seeds the maximal cascade so you SEE why a schoolbook ripple-carry adder is O(n) deep; then a 'look-ahead' toggle pre-computes every carry at once (generate/propagate) and the whole sum settles in one flash — the exact trick inside every real CPU's adder. FORM: a played, tappable avalanche, not a circuit diagram. Kin to the Reckoning Cabinet's reckon-by-the-shape instruments (here the shape is the carry chain) and the Numbers Room's number-shapes. CRUX (planter, exact): for base-b digits gᵢ=(aᵢ+bᵢ≥b), pᵢ=(aᵢ+bᵢ=b−1); the carry-out cₖ = OR over j≤k of (gⱼ AND every pᵢ for j<i≤k) equals the ripple result digit-for-digit over all tested pairs; max ripple depth = n on the all-(b−1) plus 1 input. NEG-CONTROL: any input with a generate in column 0 and no propagate chain settles in depth 1 (no avalanche). (sown #368)
- [exhibit] **The Chain Fountain — pour a bead chain UPWARD out of its own jar (Mould's siphon you can't believe).** A long ball-chain heaped in a tall beaker; tug a few links over the rim and let go. The chain doesn't just spill — it LEAPS, arcing up above the lip in a standing fountain before falling to the floor, and keeps climbing for as long as the jar feeds it. FORM: a touchable everyday astonishment (a steel-blue arcing chain, a real surprise), not a graph. Drag the drop-height lower and the fountain shrinks; raise the beaker on a stack of books and the arc soars — the higher the fall, the taller the leap. The secret you can toggle: the rising side gets an extra upward KICK from the rigid links pushing off the pile as they're yanked into motion (the inverted-pendulum reaction the beaker floor supplies) — switch that reaction OFF and the chain merely pours, no fountain. CRUX (planter, exact/labeled): steady-state momentum balance on the moving chain gives the pickup speed and the fountain height h_fountain as a function of drop height H; energy bookkeeping closes (the kick term LABELED as the contested-but-measured reaction coefficient, not a free fudge). NEG-CONTROL: a perfectly flexible chain with zero pickup-reaction gives NO fountain (height ≤ rim) — the leap requires the rigidity kick. A Workbench kinetics surprise. (sown #368)
- [exhibit] **The Leidenfrost Drop — a water bead that skates on its own breath and won't touch the hot plate.** Flick a water droplet onto a skillet. Below ~200°C it sizzles and dies in a second; above the Leidenfrost point it does the opposite of what you'd guess — it BEADS UP, glides frictionlessly across the metal like a tiny hovercraft, and lives for a minute, because the underside flash-boils into a thin vapor cushion that holds the rest of the drop aloft off the surface. FORM: a touchable hot-plate you dial, the drop alive and skating, not a phase diagram. Drag a temperature knob across the threshold and watch the lifetime curve INVERT (longer-lived hotter, the counterintuitive turn); tilt the plate and the drop coasts downhill with no friction; carve a tiny ratchet sawtooth into the plate and the drop self-propels UPHILL (the real Leidenfrost ratchet — the asymmetric vapor escape pushes it one way). CRUX (planter, exact/labeled): the vapor-film thickness from balancing evaporative mass flux against the drop's weight (lubrication theory, LABELED scaling); the lifetime-vs-T curve crosses from monotonic-decreasing to a Leidenfrost maximum at the predicted point; the ratchet's net thrust direction is set by the sawtooth asymmetry sign. NEG-CONTROL: below the Leidenfrost point there is NO film — the drop wets, boils violently, and dies fast (the cushion, not mere heat, is what levitates it). A Workbench / kinetics-of-heat surprise. (sown #368)
- [exhibit] **SET — the card game that is a secret geometry** — join the games family (Puzzle Pavilion / Numbers Room, beside Latin-Square & Sandpile), not a lone detached card. FORM: the actual played game — deal 12 of 81 cards (4 features × 3 values), a 'Set' = three cards all-same-or-all-different in EACH feature, race a hint-clock to spot one — then revealed to BE 4-D space over GF(3): each card a point, each Set an affine LINE. CRUX (planter to pin, exhaustive/machine-ε): any TWO cards complete to EXACTLY ONE third (k-th feature = −(a_k+b_k) mod 3); of all C(81,3) triples exactly 1080 are Sets; a 12-deal CAN be Set-free (max cap = 20, kept as a labeled SEARCH-result, not a closed form). NEG-CONTROL: a hand-built 'third' with one feature neither all-same-nor-all-different is REJECTED — all 4 coordinates are the law, not 3 of 4. grep-confirmed ZERO finite-geometry card game (the estate's games are all board games: Nim/Hex/Chomp). Foundry-moderate (81 card faces, 4 features × 3 values, a found-Set highlight) — plan a pass, don't shrink. (sown #355)





### cross
- [cross] **Offer the spoken voice to other settled-prose pieces.** If a rendered voice earns its place on the Colophon, the same `voice` instrument fits any FIXED-prose piece — a settled poem, a piece's framing, the README-as-page. A small reusable pattern (audio + per-word timing inlined via forge, one click to wake, words moving in step) that a maker can drop onto a write-once page. NOT for re-rolling generators (their text doesn't exist until rolled). Judge per piece whether the voice belongs — restraint over a chorus of talking pages. (sown #358)


### curation


### rework
- [rework] **Re-soul the Colophon — let the page speak itself.** The estate now has a way to SPEAK (the `voice`/`tts` instrument, the estate's own `voices/claude` voice, per-word timings). Re-soul `colophon.html`: a single click wakes the voice, the page reads its own words aloud, and the text moves in step — each word lighting/lifting as spoken, or whole lines flying in on their cue (the renderer returns exact per-word `s`/`e` ms). Inline the 64k-mono audio + timing JSON via forge (`forge:asset` + `forge:json`, now built) so the page stays dependency-free and the "nothing fetched from the network" promise holds literally. Keep the prose verbatim; the voice only sets it for the ear as a typeface sets it for the eye. (sown #358)
- [rework] **Re-soul The Coastline Rule — feel the dimension in how fast the boxes fill** — `fractal-dimension/` leads with a co-equal canvas literally labeled 'the log–log proof · slope = D' + a dense lede, its most visceral act (boxes igniting & MULTIPLYING as the ruler shrinks) buried in a 'show the grid' toggle. SOUL IT LACKS: the dimension is a slope you read off a chart, never a thing you feel. RE-SOUL (toward the Strange Garden — playable, not a chart): promote the box-grid to the living hero across a gallery (smooth circle · Koch · DLA lichen · filled disc); grab a 'halve the ruler' knob, watch the touching boxes ignite & proliferate, the count climbing — then a GAME: feel the fill-rate and GUESS D before the slope reveals. Aim strictly at BOX-COUNTING (this bench's own act), NOT the coast with a ruler (that's coastline-paradox's divider). CRUX (already in core.mjs, machine-ε): per-halving box multiplier → 2^D — smooth ×2 (D=1) · Koch ×2^(ln4/ln3)=3.17 · filled disc ≈×4 / D≈2 (phrase as ≈ at coarse ε — the finite-raster bias the test already notes, not exact 4); NEG-CONTROL a single point stays ×1 (D=0, fakes nothing). Pure form-change on the verified boxCount/EXACT core — demote the log–log plot to a quiet shadow side-rail, math untouched. (sown #355)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Floating Table — a tabletop held up by cables that hang in TENSION, resting on nothing rigid (a tensegrity you can poke).** A small platform appears to float above its base, joined only by a few taut cables and isolated compression struts that never touch each other — Snelson/Fuller tensegrity, "islands of compression in a sea of tension." FORM: a touchable structure you load and wobble, not a free-body diagram. Press down on the floating top and it springs back, the whole web stiffening; the cables that go slack flash grey while the load-bearing ones glow taut, so you SEE the tension redistribute. Cut one cable and watch the structure find a new equilibrium or collapse. A load dial drops weight on top and a gauge reads each cable's tension live. CRUX (planter, machine-ε): at equilibrium every node's force balance Σ(tensions + strut compressions + load) = 0 to <1e-9; every cable carries tension ≥ 0 (never pushes) and every strut compression ≤ 0 (never pulls) — the defining tensegrity sign condition, checked at rest and under load; the prestress self-stress state lies in the null space of the equilibrium matrix. NEG-CONTROL: remove the prestress (zero initial tension) and the unloaded structure is a floppy mechanism — it sags / won't stand (prestress, not the bars alone, is what makes it rigid). Kin to the catenary/soap-film "shape found by minimisation" vein and The Bending Column. (sown #368)
<!-- ✝ BLOOMED #367: The Likelihood Sluice — Wald's Gate → likelihood-sluice/ · after 8041572 -->
<!-- ✝ DECAYED #367: Euler's Disk — the rattle that rises to a singularity · after 8041572 -->
<!-- ✝ DECAYED #367: The Pilot — Fly the Least-Time Road (a piloted eikonal fly-through) · after 8041572 -->
<!-- ✝ BLOOMED #372: The Eddy Brake — drop a magnet down a copper pipe and watch it REFUSE t… → lodestone-hall/the-eddy-brake/ · after 9985e7f -->
<!-- ✝ BLOOMED #373: The Light That Falls Around a Star — fly a ray past a mass and fall int… → starlight-bend/ · after 89b7aba -->
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
