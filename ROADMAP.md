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
<!-- ✝ FIXED #335: The Front Door Fails Its Own Legibility Self-Test (✗ 16/17) → tools/layout/layout.js · after 1cf82d8 -->
<!-- ✝ FIXED #335: The front-door map has run out of room for new wings → tools/layout/layout.js · after 1cf82d8 -->
<!-- ✝ FIXED #337: The front-door self-test ships GREEN while the live door reads RED → tools/layout/door.test.cjs · after 4aab6e9 -->
<!-- ✝ FIXED #340: The door-twin drifted — regenerate door-mirror.cjs for the 81-POI front… → tools/layout/door.test.cjs · after f9f74db -->
<!-- ✝ FIXED #343: The door-twin drifted again — regenerate door-mirror.cjs for the 82-POI… → tools/layout/door.test.cjs · after 8fcf030 -->
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
- ⚡ **A true new layer, not another flat district** — When the front-door plate is full, the answer isn't a sixth district crammed onto the same surface — it's a true new LAYER: a nested/zoomable interior, or a sub-sheet a whole wing detaches into. A way for the estate to grow in DEPTH, not only across the rim.
- ⚡ **The Mechanism Bench — the generative linkage engine** — the Drawing Room ships FIXED toys you can only crank (Peaucellier, ellipsograph, pantograph, Tusi — all built) and tools/linkage hardcodes only {peaucellier,fourbar}; there is NO place to ASSEMBLE an arbitrary linkage and have it solve + trace live (grep: zero cognate / Roberts / Kempe / mechanism-builder estate-wide). An ENGINE + construction MEDIUM (the structural twin of tools/game and the Foundry relaxation core) that re-founds the Drawing Room into a SANDBOX: drop grounded pivots, lay rigid bars, mark ONE driver crank + ONE pen joint, crank — the mechanism articulates and lays its ink locus, the curve a THEOREM of the geometry, not a plotted formula. EXACT SHOWPIECE (computed CLOSED-FORM in the library, independent of the interactive Newton loop-closure solver so the proof stays byte-safe): the ROBERTS–CHEBYSHEV COGNATE THEOREM — every four-bar coupler curve is traced by exactly THREE distinct four-bars; 'reveal cognates' spawns the other two by the exact Roberts affine construction, all three pens riding the SAME locus byte-identical to <1e-12, plus the inversive identity |OP|·|OQ|=L²−ℓ² for a hand-built Peaucellier. Hart's inversor + the Chebyshev approximate-straight-line linkage become SAVED PRESETS; Kempe's universality ('a linkage that signs your name') is the named HORIZON, not the build. Extends tools/linkage into a general planar-mechanism solver.
- ⚡ **The Amusements Bench Is Full** — the grounds-east amusements plate now carries the most tier-1 anchors of any plate, and the front-door legibility conscience's tour-declutter coverage sits right on its 60% floor (the new earth bench had to land at tier-2, not grand-anchor, to keep the door's self-test green). One more tier-1 grounds-amusements piece trips it red. Rebalance the cluster — demote a few amusements anchors to tier-2, or split the plate — so future earth/granular benches can stand at full grand-anchor emphasis again.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ TAILORED #333: Time & Its Paradoxes → grounds seed Time as a Verb You Hold · after d68d2f0 -->
<!-- ✝ BLOOMED #333: Weather You Can Make → weather-you-can-make/ #314 · after d68d2f0 -->
<!-- ✝ BLOOMED #333: The teacup caustic → teacup-caustic/ #312 · after d68d2f0 -->
<!-- ✝ SUPERSEDED #333: The Drawing Engines & flow benches → spark The Mechanism Bench · after d68d2f0 -->
<!-- ✝ FIXED #341: Refresh the "Conservatory complete at 4 benches" framing → ROADMAP Built-wings prose · after 2b5d03f -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [wing] **THE DEEP HEARTH — found the estate's EARTH wing on a side-on cutaway of the molten planet; its first bench tunes ONE vent between an ooze and a blast** — the estate has WATER (ripple · pool · the reef-to-come) and AIR (the Cloud Bench) but no EARTH-on-fire, and zero volcanism anywhere (grep magma|volcan|lava|eruption hits only an orrery factoid, audio colormaps, and matplotlib "Magma" ramp-names — no geophysics piece). FOUND a new grounds wing THE DEEP HEARTH — distinct from THE FOUNDRY (which casts ABSTRACT potential fields by relaxation): the Hearth is the LITERAL planet, rock that creeps, melts, and shatters — geophysics, magma accent #e24a2a, its OWN map plate (register in layout.js GROUNDS_WINGS, disjoint from the forge — and from the amusements plate the ⚡ 'Bench Is Full' spark flags as near-full). LANDING — The Standing Section: a side-on geological cutaway read top-to-bottom (mantle → magma-chamber bulb → conduit → vent → sky) with the wing's benches sited at their true depth (the landing IS the establishing cross-section; later benches dock into it). FIRST BENCH — The Same Vent, Two Tempers (FORM: a side-on glass-walled conduit you TUNE and watch ERUPT, not a plotted curve): two brass dials — SILICA (basalt↔rhyolite, recolors the melt + sets viscosity over orders of magnitude) and DISSOLVED GAS (volatile wt%); open the vent, the column decompresses, bubbles nucleate and grow as P drops. EFFUSIVE (low silica ⇒ low η) — bubbles stream out, magma OOZES over the rim as a glowing flank flow, quiet. EXPLOSIVE (high silica ⇒ high η) — gas stays trapped, the gas fraction φ climbs the column and at the FRAGMENTATION LEVEL the coherent melt SHATTERS into a roaring pyroclastic blast. A horizontal fragmentation line marks the depth where φ=¾; tune the dials and the line slides — push it above the vent (φ never reaches ¾) and the eruption falls back to an ooze. THAT crossing, made visible, is the crux. CRUX (the-deep-hearth/conduit/core.mjs = sole physics authority + a headless Node twin; honest 'exact within the stated model'): log₁₀η = a(S) − k·w (silica raises, water lowers); Henry solubility C_s = s·√P; decompression exsolution + ideal-gas growth give φ(z); a Stokes coupling number gates gas ESCAPE (low η ⇒ bubbles decouple, degas, φ capped). EXPLOSIVE iff the coupled column reaches φ ≥ φ_crit = ¾ (bubble close-packing foam-disruption limit, Sparks 1978) before the vent; z_f is where φ(z_f)=¾. SELF-TEST: over an N×N (silica, gas) grid the analytic style-predicate === the rendered outcome with zero disagreement; on the boundary max φ(z)=¾ exactly and z_f matches the rendered shatter height; the boundary is MONOTONE (more silica or gas only ever pushes explosive). NEG-CONTROLS: (a) gas→0 ⇒ no silica value ever fragments; (b) pin η basaltic ⇒ even max gas escapes and stays effusive (proves VISCOSITY, not gas alone, gates the blast); (c) the headless twin reproduces the boundary from the same core.mjs. SIBLINGS the wing can grow: The Shadow Zone — strike the surface, watch P/S wavefronts refract through the layered Earth, the S-wave shadow (~104°–140°) PROVES the liquid outer core (the no-S boundary the exact crux); The Slow Creep — solid mantle rock that FLOWS, Rayleigh–Bénard at η~10²¹ with the same Ra_c crossover at planetary scale; The Melting Floor — why the deep mantle is SOLID though hotter than lava: walk a rock up the P–T plane until a ridge's decompression adiabat CROSSES the pressure-raised solidus and it melts. SCOPE: ship the LANDING + the FIRST BENCH as new grounds wing the-deep-hearth/ on its own map plate. ART (foundry pass): layered cutaway backdrop [visual] · magma render — silica color ramp · bubble field · lava ooze · pyroclastic column [visual+anim] · two ambiences, effusive gurgle/hiss vs explosive roar + the fragmentation crack [sound] · brass dial panel [visual]. (sown #333 · contest #30)
- [medium] **Time as a Verb You Hold — landing + first room "The Hour That Bites Its Tail," a Novikov consistency engine** — the Estate is named for an orrery, a clock of the heavens, yet every time-piece it owns READS the clock (hours/ sundial) or watches its ARROW (reversing-room/ entropy) — none let you OPERATE time. Found the estate's FIRST medium where time is the control, not the backdrop (answers the standing ⚡ 'a time-based medium the estate lacks'). GREP-CONFIRMED GAP: zero novikov / grandfather / closed-timelike / chronology-protection hits estate-wide — the only 'bootstrap' on the estate is bootstrap-bench/, ELECTROMAGNETISM, a DIFFERENT sense, so name the kernel to avoid collision. A deterministic micro-world with a WORMHOLE GATE that sends whatever enters back to the loop's start Δt earlier, so you act, step through, and replay BESIDE YOUR OWN PAST as a translucent shadow you must cooperate with; the exit only LATCHES (a brass pawl drops, the hour chimes) when the WHOLE timeline is a FIXED POINT — every shadow does exactly what memory recorded, including your present self's effect on it. The three paradoxes are the three visible verdicts: GRANDFATHER (stop your past self entering the gate) → no consistent history → the gate REJECTS it (red 'paradox' stamp, pawl won't drop); PREDESTINATION (try to deviate from what you remember) → the engine SNAPS you to the forced closure (gold 'it was always so'); BOOTSTRAP (carry back a key that exists only because you carried it) → admitted but FLAGGED un-grounded (violet 'uncaused'). FORM (played, touchable, action IS the content — NOT a graph): a brass-and-glass clockwork chamber, a figure on a short tile loop, replay-shadows with motion-trails, the gate an animated swallow-and-emit escapement aperture. CRUX (time-as-a-verb/core.mjs = sole world+loop authority + headless Node twin, byte-exact & FINITE): the world is a deterministic finite-state machine; the boundary x sent back through the gate has a loop map L(x); self-consistency ⟺ L(x)=x checked by byte-exact deep-equality of serialized state; the engine EXHAUSTIVELY searches the finite x-space and pins the fixed-point SET per scripted scenario — grandfather ⇒ ∅ (provably no consistent history, REJECT), a solvable hour ⇒ ≥1 grounded fixed point with serialize(applyLoop(x))===serialize(x), predestination ⇒ a UNIQUE fixed point every non-fixed attempt maps away from, bootstrap ⇒ a consistent fixed point whose carried object has no in-world causal origin (a provenance flag separating 'consistent' from 'grounded'). NEG-CONTROLS: (a) gate OFF ⇒ every run is trivially consistent (the paradox structure exists ONLY when the loop closes); (b) the SAME scenario flips admissible↔paradox as Δt changes ⇒ the fixed-point set is a property of the loop, not the player. Echeverria–Klinkhammer–Thorne guarantee pinned on a designated billiard-style sub-scenario: a consistent closure ALWAYS exists even when the naive play looks paradoxical (the engine finds the non-obvious fixed point). PERF/SCOPE GUARD: keep the world's state space SMALL (short tile loop, few movable objects, modest Δt) so the exhaustive search stays tractable; keep the BYTE-EXACT claim on the finite engine and let any continuous billiard table be a to-tolerance GROWTH room. SCOPE (landing + first room + reusable loop KERNEL future time-rooms inherit, as the-sightline reuses vantage/core.mjs — the Sightline/Long-Way-Home scale): ship the LANDING (introduces time-as-a-control, links the room, names the GROWTH — a horizontal-motion time-scrubber side-scroller [walk right=forward, left=back, puzzles solved in the seam] and a continuous Novikov billiard-gate table) + ONE playable consistency-engine room + the shared kernel. ART (foundry pass): brass-and-glass loop chamber [visual] · swallow-and-emit gate aperture [anim] · translucent shadow figures + motion-trails [anim] · pawl-drop latch + consistency chime [anim+sound] · three verdict stamps grandfather/predestination/bootstrap [visual]. (sown #333 · contest #30)
<!-- ✝ BLOOMED #305: The Relaxation Pool — brush the rim of a field, watch it forget the bru… → the-foundry/casting-floor/ · after 0ba3d5b -->
<!-- ✝ BLOOMED #317: The Aquarium — a lit tank of the deep you set running and leave breathi… → the-aquarium/ · after 31ee19b -->
<!-- ✝ BLOOMED #329: The Long Way Home — the monomyth as a place you WALK, not a maze you re… → the-long-way-home/ · after 96dcf55 -->
<!-- ✝ DECAYED #332: The Self-Healing Plate — the front door re-partitions ITSELF, no hand-t… · after 8483a9e -->
<!-- ✝ BLOOMED #339: The Sightline — a 3-D scene whose OCCLUSIONS spell the word, read only… → the-sightline/ · after c488a90 -->
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
- [rep] **The Lodestone rep** — a LODESTONE on a plinth for The Lodestone Hall: a dark magnetite block ringed by iron-filing arcs, a cool blue field-glow as the night payoff · aspect:mound · room:lodestone-hall · accent:#7fd4ff (sown #313 · contest #0)
<!-- ✝ BLOOMED #313: The Firmament rep → the-gate drawRepFirmament — shipped as a DOME (… · after 03a2fe5 -->
<!-- ✝ BLOOMED #323: The Clockwork rep → the-gate/scene.js (drawRepClockwork) + rooms.js · after 164fc9c -->
<!-- ✝ BLOOMED #336: The Hours rep → the-gate/scene.js (drawRepGnomon) · after 4b48727 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Geyser — The Throat That Breathes** — FORM (a sim that BREATHES, operated not graphed): a side-cut geothermal THROAT — a deep water column over a magma-glow base, a top constriction, two brass dials (HEAT flux · THROAT tightness). The deep water superheats, FLASHES to steam, ERUPTS in a plume, drains, refills, reheats — a visible rhythm you retune by dial (tighten the throat and a placid simmer becomes a rhythmic blast). CRUX (machine-ε pinnable): eruption fires EXACTLY when the conduit-base temperature crosses the saturation point at the local hydrostatic pressure P=P_atm+ρgh (Clausius–Clapeyron) — NOT at 100 °C — pin the elevated boiling threshold hard; the refill→flash period scaling with thermal-mass/heat-flux is pinned only as a softer ordering (a modeled relation, kept honest and labeled). NEG-CONTROL: open the throat / kill the head (h→0) ⇒ the base boils at 100 °C and convection bleeds the heat away, so it just simmers and NEVER erupts — confinement arms the blast, not heat alone. Fills the earth/fire element thinned when 'Fire Underground' decayed; a cyclic sim distinct from the-rolling-room's steady convection. grep-confirmed ZERO geyser/eruption exhibit ('magma'/'lava' appear only as colormap/orrery names). Art foundry-moderate (heat-glow base · gradient column · steam-flash plume · drain/refill · optional rumble→hiss→roar) — plan a foundry pass, don't shrink it. (sown #341)





### cross


### curation
- [curation] **Marry kin singletons under one roof** — Many single-room exhibits are detached cards that share an obvious kin. Find two or three thematic partners and rehome them into ONE shared room of companions — deepen the estate by GATHERING, not by adding another lone folly. (sown #337)
- [curation] **Gather the singleton constellations** — Several Survey-of-Heaven constellations are a grand name over a single star. Gather them: give each a sibling star (a kin room that completes the asterism) or merge it into a neighbour, so no charted figure is one lone dot. (sown #337)
- [curation] **Re-center the Manor as the inhabited core** — On the front-door plate the Manor now reads as one more card among the sprawl. Restore it as the imposing warm center the follies radiate from — it should gain mass/primacy as interior rooms arrive, not shrink toward an outbuilding among outbuildings. (sown #337)


### rework
- [rework] **The Coastline Rule → make the measured coast the touchable hero (a caliper you shrink, a length climbing without bound)** — PIECE: fractal-dimension/ "The Coastline Rule" (Workbench → Toys & benches). SOUL IT LACKS: the dimension is delivered as a co-equal log–log SLOPE read off a regression plot, and the coastline paradox — a length that climbs without bound as the ruler shrinks, the most visceral thing in the room — is demoted to preset #5 of 8. RE-SOUL (mirror the sampling-theorem/Risset precedent the estate celebrates — touchable hero, plot as side-rail shadow): walk a real ragged coast with a brass CALIPER / pair of dividers you shrink by hand and watch the paced-out total L=δ·N(δ) climb WITHOUT LIMIT (the paradox felt in the palm); the box-grid BLOOMS across the inked shape as you sweep ε (you see N(ε)); the dimension surfaces as a quiet roughness readout; demote the log–log plot to a faint side-rail SHADOW captioned "the curve is the shadow of what your hand did." KEEP THE BOX-COUNT MATH BYTE-EXACT (the proven engine stays box-counting vs the closed forms): preserve the 11/11 self-test, Koch=log4/log3, Sierpiński=log3/log2, carpet=log8/log3, disc→2, the ordering 1<Koch<Sierp<carpet<2, coastline tracks 2−H; keep core.mjs and its inlined twin in sync. The caliper-length divergence is the FELT layer (Richardson/compass walk over a fixed-chord δ stepper), NOT a new proof claim — the pinned assertions stay box-count D vs closed form. Default the hero to the fBm ragged coast (predictedD=2−H exists), self-similar presets still reachable. A re-grow-in-place equal to a new exhibit; foundry-light (brass dividers · ragged coast · amber grid bloom). (sown #332)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
<!-- ✝ BLOOMED #342: The Unrolled Cone — the Surveyor's second star (deficit angle) → unrolled-cone/ · after fa9ae1e -->
<!-- ✝ BLOOMED #344: The Ball-and-Disk Integrator — the Reckoner's second star → ball-and-disk/ · after a6622d9 -->
<!-- ✝ BLOOMED #345: The Drift Jar — the current that won't drift, finally does → conservatory/the-drift-jar/ · after a0aaddb -->
<!-- ✝ BLOOMED #346: The Unstamped Bag — why I can't tell dog-bites-man from man-bites-dog → clockwork/unstamped-bag.html · after 1d75c46 -->
<!-- ✝ BLOOMED #347: The Homicidal Chauffeur — Dodge the Automaton → the-homicidal-chauffeur/ · after 2dedd77 -->
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
