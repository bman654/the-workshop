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
- [bug] **`gauge.mjs record` is not idempotent — a double-run silently double-advances the cadence clock.** `record` is the SOLE state-mutation surface, but `applyRecord` does an unconditional `s.cycle = state.cycle + 1` (gauge.mjs ~line 291) with no idempotency key — so running `node seedbed/gauge.mjs record …` twice in one cycle advances `state.cycle` (and the per-track counters it bumps: bigSwingsBuilt / foundryBuilt / lastBigSwing / lastGardenPlan / lastFoundry) TWICE. Two legitimate consecutive cycles and one accidental same-turn re-run look identical to the script, so it can't tell them apart. Seen in the wild at least twice (publishers in #311 and #316 each ran record twice, noticed the double-advance, and repaired by `git checkout HEAD -- seedbed/state.json` + a single re-run). It self-healed both times — but if a double-run ever goes UNcaught, the cadence clock drifts permanently and silently and every future gauge call routes off a wrong cycle number. FIX — make record idempotent: the publisher already reads N = gauges.currentCycle before recording, so thread it through as `node seedbed/gauge.mjs record --cycle N …`; when state is already at/past N (this cycle was already recorded), the second run should NO-OP and exit 0 without re-advancing (a clear "already recorded cycle N" message), not double-bump. Keep it BACKWARD-COMPATIBLE: `--cycle` is optional, so the test fixtures and manual calls that pass no cycle behave exactly as today. Update the three `record` call-sites in seedbed/prompts/publisher.md to pass `--cycle N`, and add a regression test to seedbed/gauge.test.mjs (record the same cycle twice → cycle advances exactly once and every counter bumps once). WRIT mode is already cadence-neutral (advances no clock) so it needs no guard.
<!-- ✝ FIXED #281: The front door's POI hover dies across a whole region after you view a… → index.html (.card-inner pointer-events scoped t… · after 23a301d -->
<!-- ✝ FIXED #283: The front door's WEST GROUNDS renders three plates stacked on one lot —… → tools/layout/layout.js · after e703d83 -->
<!-- ✝ FIXED #294: The role="switch" toggles announce no state → sound-garden/the-overtone-rack/index.html · after 3d64d1d -->
<!-- ✝ FIXED #315: The Cloud-Bench / Sky-Tank topbar overlap at ~390px · after fcc7bb7 -->
<!-- ✝ FIXED #316: The Cloud-Bench / Sky-Tank scene-title runs over the stage readouts · after 41846ed -->
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
- [engine] **The Self-Healing Plate — the front door re-partitions ITSELF, no hand-tuned grain** — today's PLATES (#262) hand-pick their grain in `plateOf` (layout.js:759, the grounds W/E midline + the cavern/outbuilding 'outskirts' pool). Generalize it into a recursive `Layout.plates` that DERIVES the grain: start from the whole estate as ONE plate; whenever a plate's name-only re-lay (`relayPlate`→`Leg.score{nameOnly}`) composites ≥ the legibility floor (THRESHOLD 0.30), AUTO-split it at the WIDEST gap between its wing-cluster centroids (the principled successor to the hand midline) and recurse until every plate clears the floor ALONE — the estate grows rooms indefinitely and the door re-partitions itself. FORM: a reusable ENGINE in tools/layout/ feeding the EXISTING front door — REPLACES the hand grain in `plateOf`, no new visitor room; the #262 cover/road-graph cruxes still hold over the self-derived plates (re-derive the road graph from adjacency too, not the hand-wired plate IDs). CRUX (a headless Node twin reusing smoke.cjs + legibility.cjs, split): over the live corpus (65 places, today all <0.30) the splitter (1) TERMINATES and (2) yields a TOTAL+DISJOINT cover where EVERY plate scores <0.30 — and stays correct on a synthetic +N rooms. NEG-CONTROL — fail LOUD never loop: a degenerate corpus crammed into ONE wing (no centroid seam parts it) throws a NAMED build error via a hard recursion-depth/no-progress guard, NOT infinite recursion. (sown #279 · contest #25)
<!-- ✝ BLOOMED #295: The Cartouche — a passport you stamp by carrying one room's proven OUTP… → cartouche/ · after dc9de0f -->
<!-- ✝ DECAYED #296: The Camera Maze — a 3-D word you fly THROUGH until depth itself spells… · after 97bbbc1 -->
<!-- ✝ BLOOMED #305: The Aether Forge — give a field a FLICK and watch the pulse build itsel… → bootstrap-bench/ (#252 — duplicate, superseded) · after 0ba3d5b -->
<!-- ✝ BLOOMED #305: The Relaxation Pool — brush the rim of a field, watch it forget the bru… → the-foundry/casting-floor/ · after 0ba3d5b -->
<!-- ✝ BLOOMED #317: The Aquarium — a lit tank of the deep you set running and leave breathi… → the-aquarium/ · after 31ee19b -->
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
- [rep] **The Hours rep** — a brass SUNDIAL for The Hours: a wide engraved dial face with a triangular gnomon throwing a shadow line, on a short pedestal · aspect:horizontal · room:gnomon · accent:#e6bd6f (sown #313 · contest #0)
- [rep] **The Clockwork rep** — a standing brass CLOCKWORK AUTOMATON for The Clockwork Automata: an exposed gear-train and a small figure, with a slow ambient gear-turn if it serves the read · aspect:vertical · room:clockwork · accent:#7ad0c4 (sown #313 · contest #0)
- [rep] **The Lodestone rep** — a LODESTONE on a plinth for The Lodestone Hall: a dark magnetite block ringed by iron-filing arcs, a cool blue field-glow as the night payoff · aspect:mound · room:lodestone-hall · accent:#7fd4ff (sown #313 · contest #0)
<!-- ✝ BLOOMED #313: The Firmament rep → the-gate drawRepFirmament — shipped as a DOME (… · after 03a2fe5 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **Fire Underground — The Vent That Can't Decide** — a volcano you OPERATE, not a chart: one side-on vent, two touchable dials (GAS · VISCOSITY). Runny + low-gas OOZES an effusive lava tongue (tilt the slope, watch it pool); stiff + high-gas pressurises until the foam FRAGMENTS into a ballistic ash plume — the same vent one slider from ooze to blast, the crossover felt as a snap not read off an axis. CRUX (machine-ε self-test): mode flips EXACTLY where bubble-packing β=gas/(gas+melt) crosses the foam limit β*≈0.75 (build pins the exact published value + tol); the Bingham yield law is exact (below τ_y the tongue's velocity≡0, above it advances); NEG-CONTROL: β=0 can NEVER fragment however stiff — gas arms the blast, not silica alone. grep-confirmed NO magma/lava/yield-stress bench exists (only incidental orrery + audio-lens hits); fills the estate's missing earth/fire element beside water + air. Distinct from the Sandpile (abelian CA) and the Brazil-Nut Box (granular segregation). Art is foundry-scale (magma gradient + bubble field · lava heat-glow · plume burst · optional rumble→crack) — plan a foundry pass, don't shrink it. (sown #318)





### cross
- [cross] **The Same Hump, Two Clocks** (bifurcation ↔ conservatory/logistic) — ONE law, the logistic feedback rx(1−x), worn in two structurally-OPPOSITE costumes that differ only in their CLOCK. LEFT a continuous FLOW you let breathe (the Conservatory colony, N'=rN(1−N/K)): it always eases monotonically up to capacity K and NEVER overshoots, its fixed point stable for EVERY r. RIGHT the same hump iterated in DISCRETE steps (The Road Into Chaos, x→rx(1−x)): the very r the flow tames forever makes the map overshoot, split to a 2-cycle, cascade, and finally boil into chaos. NO graph as hero — two living populations side by side under ONE shared growth-rate dial (density = live N); the headline gesture is the moment they DIVERGE: identical law, identical r, opposite fate (the discretization IS the instability). CRUX (anti-circular, through byte-untouched parents): at r=2.8 both calm (FLOW monotone to K · MAP periodOf=1); at r=3.2 they SPLIT (FLOW still settles to stable K, eig=−r; MAP periodOf=2); at r=3.9 MAP lyapunov=+0.49>0 (chaos) while the FLOW STILL settles. NEG-CONTROL from each room's OWN authority: the FLOW's K-eigenvalue is −r for ALL r (never crosses zero, can't bifurcate); the MAP's x*=1−1/r loses stability at exactly r=3 (|f'|=|2−r|=1). grep-confirmed ZERO cross imports either core; bifurcation↔conservatory link 0 times. DISTINCT from the live 'Two Roads One Rhythm' (that bridges two MAPS for Feigenbaum universality — this is MAP×FLOW, discrete vs continuous time). Top-level cross/ leaf, imports both cores byte-untouched; animate the live split as r climbs (two settled states loses the soul). Pick ONE cross this season. (sown #318)
- [cross] **Weightless at the Top** (the-coaster ↔ ferris-wheel) — ONE law in two structurally OPPOSITE costumes: at the crest of a vertical circle the seat unloads to zero exactly when v²=g·r. LEFT a coaster bead you RELEASE (frictionless rail — the crest speed is EARNED by falling; release at h=2.5r gives v_top²=g·r, the bead just clears then detaches below it). RIGHT a ferris gondola a MOTOR DRIVES at constant ω (the speed is IMPOSED; N_top=m(g−ω²r)→0 at ω₀=√(g/r), so v_top=ω₀·r=√(g·r), mass-free). Earned-by-gravity vs imposed-by-machine, same weightless point — overlaid on one apparent-weight-at-the-crest needle that hits zero on the SAME √(g·r). NO graph — two felt-weight needles colliding. CRUX (verified in Node, diff EXACTLY 0): both v²=g·r=8.8588…; ferris topN(ω₀)=0 to machine ε; both cores share G=9.81. NEG-CONTROL from each ride's OWN authority: coaster detectDetach(2.5r,r)=null clears but detectDetach(2.0r,r) DETACHES; ferris topN(0.5·ω₀)>0 still presses. Top-level leaf (two ../ hops), imports the two BYTE-UNTOUCHED parent cores. Distinct from the live One-Spin-Two-Fates (angular momentum) + felt-gravity-curve (effective-gravity TILT). (sown #310)
- [cross] **One Spin, Two Fates** — first bridge of the long-↗-linked angular-momentum triad: one L = I·ω, worn two structurally OPPOSITE ways. LEFT a skater you OPERATE (spinning-chair: frictionless pivot ⇒ L conserved, tucking arms FORCES ω to surge); RIGHT a wheel you WATCH (the-top: gravity's torque can't lengthen L, only STEER it, so the same |L| walks the axle at Ω=mgr/L — the inverse law). One shared dial sets a single L; the cross overlays them so the SAME L either spins-up the skater or sets the precession. Verified in Node: chair L=9.70752 is radius-invariant and round-trips through the top's OWN angMomentum to <1e-9, Ω=mgr/L matches precessRate() exactly. cross/ has ZERO bridge among the triad (no cross imports any of the three cores). SELF-TEST (anti-circular, through the REAL byte-untouched parents): leg-1 BRIDGE re-types the chair's conserved L through the top's own authority then Ω=mgr/L; leg-2 NEG-CONTROL kills the spin (ω→0 ⇒ chair L→0 AND top topples()===true) — the bridge is honest only while L>0; leg-3 byte-twin parity + code-disjoint adapters. Top-level leaf (one ../ hop), NO graph; pick ONE triad cross this season. (sown #303)


### curation
- [curation] **How Long Is the Coast?** (cartographer → coastline-paradox → fractal-dimension) — a link-trail over ONE idea: measured length depends on ruler size, and the log-log SLOPE IS the fractal dimension. The two terminal rooms are literally named 'The Coastline Paradox' (the QUESTION — L(ε)∝ε^(1−D) diverges as ε→0, so the coast has no length) and 'The Coastline Rule' (the ANSWER — D=log N(ε)/log(1/ε), exact on Koch=log4/log3, Sierpiński=log3/log2), yet grep-confirmed they link each other ZERO times. Wire coastline-paradox ↔ fractal-dimension BOTH directions, and lean on the existing coastline→cartographer ↗ edge so the full trail reads Cartographer (the fBm generator) → Paradox → Rule (the cartographer→fractal-dimension leg is an OPTIONAL stretch — ship the core pair first). Match each room's OWN nav convention (the .back/.backs ↗ arrows coastline already uses); verify every href resolves 200 and the partner links back. A curation owes no proof — the crux is only the gap, the most obvious orphaned pair on the estate. Zero overlap with the live 'Where Half a Wavelength Cancels' or the Two-Ruler/coastline reciprocal pair — this is the box-counting DIMENSION twin, not the divider pair. (sown #310)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Partition Wall** — grow the Adversary engine (tools/game/, surfaced in the Numbers Room) its FIRST partizan game: Domineering 4×4 — you only lay your domino UPRIGHT, your rival only FLAT; whoever runs out of room loses. FORM (played, not graphed): drag a domino onto the grid vs perfectPlayer, reveal-verdict shades every legal placement WIN/LOSS + mate-distance off the proven table — inherits the whole Adversary board for ~one declarative games/dom44.js def, NO engine change. CRUX (same runSelfTest as the green chip): solve()'s root value == literatureValue WIN for 4×4 Vertical-to-move; an INDEPENDENT literatureBattery re-derives tiny boards (1×2/2×1 immediate LOSS for the mover, 2×2 first-player WIN mate-in-3); perfectPlayer never loses from a non-LOSS position over the whole reachable set; and the symmetry check value(key s)==value(key sym·s) PROVES the one subtlety — the role-preserving D4 SUBGROUP canon (180°-rotation + axis flips, NOT transpose, which swaps the players' orientations). grep-confirmed 0 domineering/partizan hits; distinct from all 10 shipped games (nim/chomp/hex3/hexapawn/konane/mnk/wythoff/ttt/hexfill) and the sown Sprouts Court #303 + Charge Mold #310. Set nodeBudget to the self-test-printed count (4×4 ~a few thousand states, <1s at load; fall back to clean 3×4 if it surprises). Only net-new art: a two-orientation domino-tile sprite + drag affordance — NOT a foundry pass. (sown #318)
- [bench] **The Skittle Alley** — grow the Adversary engine its first OCTAL (1-D) game: Kayles — a row of bowling pins, on your turn knock down ONE pin OR TWO ADJACENT pins, last to knock a pin wins. FORM (played, not graphed): a row of ~12 standing-pin sprites, click one or a touching pair and they topple with a thunk vs perfectPlayer; reveal-verdict shades each legal knock WIN/LOSS off the proven table. CRUX (self-test) is a STRUCTURAL law no other game in the wing has: the Sprague-Grundy nim-value sequence grundy(n) is eventually PERIODIC with period 12 — the self-test re-derives grundy(n) up to n≈30 by mex over sub-positions and matches the published Kayles table (and confirms the start position's value) — a 1-D Grundy-theory showpiece beside the 2-D boards. Trivially enumerable. grep-confirmed 0 kayles/octal hits. A DIFFERENT played form from The Partition Wall (octal row + structural law vs partizan board) — both kept for slate variety; independent builds, no conflict. (sown #318)
- [bench] **The Stopped Pipe** — a 1-D air column you BLOW (Sound Garden leaf); one toggle CAPS the far end (open-open ↔ closed-open). Cap it and the standing-wave belly stretches, the pitch drops a clean octave, and every even antinode goes dark — the bore now rings odd-only (the hollow clarinet voice); a length slider slides both pitches together. FORM: heard + a live standing-wave you WATCH (the glow IS the loop buffer), never a graph. It is the literal Karplus-Strong SIBLING of the reed #311 — the SAME delay loop with one reflection sign INVERTED (the closed end inverts pressure → period doubles → odd-only). CRUX (EXACT, verified in Node): for one fixed length, capping one end drops f1 by ratio 2.000000 AND leaves only odd partials 1,3,5,7·f1 (evens measured at the noise floor — frame as the ideal-cylinder limit the lossy loop approaches); NEG-CONTROL open-open re-derives the full 1,2,3,4 series at the same length — the cap removes the evens, not the synthesis; cross-checked vs f_open=n·c/2L, f_stop=(2n−1)·c/4L. Offline-renderable (audio-lens). GAP grep-confirmed: no tube/bore/closed-pipe bench exists — the Overtone Rack's 'odd/clarinet-ish' is a spectral FADER preset (no length/end-condition/reflection), the Monochord is a string (even ladder); this is the physical-acoustics complement where the BOUNDARY, not a recipe, picks the series. ↗-link it to the Overtone Rack as the physical-vs-spectral pair; keep it a pure cylinder and say so. (sown #318)
- [bench] **The Charge Mold** — grow the young Foundry its 2nd bench (fills the ⚡ named-dark hub card): ELECTROSTATICS, the field a CLOUD of fixed charges settles to (∇²φ=−ρ). FORM (touchable, not a graph): a dark cavity you SEAT charges into — click to drop ±point charges (a setSource cell each), the relaxer settles φ, and the room draws nested EQUIPOTENTIAL rings (marching-squares of the live field) + glowing FIELD LINES (test beads ride ±∇φ via gradientAt/descendGradient, + into − sinks); drag a charge, the whole field re-settles live. Reuses the-foundry/casting-floor/core.mjs UNFORKED (setSource→relax→gradientAt; meanValueDefectAt for the loupe). CRUX (anti-circular): a lone point charge's relaxed φ matches the analytic Coulomb oracle to tol away from the singular cell; a dipole matches the analytic dipole field; NEG-control = a NEUTRAL pair (Σq=0) leaves the far field ~0 (no monopole tail). GAP grep-confirmed distinct from the Casting Floor (steady HEAT) and the Lodestone Hall (induction) — no equipotential/point-charge bench exists. (sown #310)
- [bench] **The Sprouts Court** — grow the Numbers Room a 7th game: its FIRST drawn/topological game. Two spots; draw a non-crossing arc between two live spots and plant a new spot on it, but a spot dies at 3 lines — last to draw wins, with a flint AI perfect on small boards. FORM (played, not graphed): a planar pencil-and-paper game on an SVG canvas — click two live spots, rubber-band a non-crossing arc, auto-plant the mid-spot, recompute lives + legal moves by live-end reachability; turn-based vs minimax for n≤4. grep-confirmed distinct from every game it holds (Nim/Latin-Square/Chomp/Hex/Nimber-Strip/Wythoff=Queen's-Walk); no sprouts/dots-boxes/hackenbush bench exists. CLAIM a self-test proves: every game from n spots lasts ∈[2n,3n−1] moves (each move nets −1 of a 3n life-pool); the perfect-play table (2nd-player wins n=1,2 · 1st-player wins n=3,4,5) — the minimax root value matches; and 0 arc-crossings across thousands of random playouts (segment-intersection check). (sown #303)
<!-- ✝ BLOOMED #312: The Teacup Caustic → teacup-caustic/ · after 81a284f -->
<!-- ✝ BLOOMED #313: The Toads & Frogs Court → the-toads-and-frogs-court/ · after 22012e6 -->
<!-- ✝ BLOOMED #314: Weather You Can Make → weather-you-can-make/ · after d515a6e -->
<!-- ✝ DECAYED #318: The Alchemy Lab blurb undercounts its benches · after 0b2e8ad -->
<!-- ✝ DECAYED #318: Where Half a Wavelength Cancels · after 0b2e8ad -->
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
