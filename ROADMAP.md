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
<!-- ✝ FIXED #319: `gauge.mjs record` is not idempotent — a double-run silently double-adv… → seedbed/gauge.mjs · after 594e9ee -->
<!-- ✝ FIXED #327: The Census of Hands "by role" view clips the role labels horizontally —… → census/index.src.html · after 3448448 -->
<!-- ✝ FIXED #328: The Numbers wing is overcrowded → tools/layout/layout.js · after 56aeb93 -->
<!-- ✝ FIXED #335: The Front Door Fails Its Own Legibility Self-Test (✗ 16/17) → tools/layout/layout.js · after 1cf82d8 -->
<!-- ✝ FIXED #335: The front-door map has run out of room for new wings → tools/layout/layout.js · after 1cf82d8 -->
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
- ⚡ **The Mechanism Bench — the generative linkage engine** — the Drawing Room ships FIXED toys you can only crank (Peaucellier, ellipsograph, pantograph, Tusi — all built) and tools/linkage hardcodes only {peaucellier,fourbar}; there is NO place to ASSEMBLE an arbitrary linkage and have it solve + trace live (grep: zero cognate / Roberts / Kempe / mechanism-builder estate-wide). An ENGINE + construction MEDIUM (the structural twin of tools/game and the Foundry relaxation core) that re-founds the Drawing Room into a SANDBOX: drop grounded pivots, lay rigid bars, mark ONE driver crank + ONE pen joint, crank — the mechanism articulates and lays its ink locus, the curve a THEOREM of the geometry, not a plotted formula. EXACT SHOWPIECE (computed CLOSED-FORM in the library, independent of the interactive Newton loop-closure solver so the proof stays byte-safe): the ROBERTS–CHEBYSHEV COGNATE THEOREM — every four-bar coupler curve is traced by exactly THREE distinct four-bars; 'reveal cognates' spawns the other two by the exact Roberts affine construction, all three pens riding the SAME locus byte-identical to <1e-12, plus the inversive identity |OP|·|OQ|=L²−ℓ² for a hand-built Peaucellier. Hart's inversor + the Chebyshev approximate-straight-line linkage become SAVED PRESETS; Kempe's universality ('a linkage that signs your name') is the named HORIZON, not the build. Extends tools/linkage into a general planar-mechanism solver.
- ⚡ **The Amusements Bench Is Full** — the grounds-east amusements plate now carries the most tier-1 anchors of any plate, and the front-door legibility conscience's tour-declutter coverage sits right on its 60% floor (the new earth bench had to land at tier-2, not grand-anchor, to keep the door's self-test green). One more tier-1 grounds-amusements piece trips it red. Rebalance the cluster — demote a few amusements anchors to tier-2, or split the plate — so future earth/granular benches can stand at full grand-anchor emphasis again.
- ⚡ **Refresh the "Conservatory complete at 4 benches" framing** — ROADMAP's "Built wings" prose (≈L181) still calls the Conservatory "COMPLETE at 4 benches — bloomed #31", but the wing now holds SEVEN living-systems benches (gene-jar · pond · replicator · predator-prey · sir · logistic · selection-jar) and is clearly still growing. The stale "complete/4" framing risks a future planter treating the wing as closed and skipping a good Conservatory seed. Refresh it to "open & growing — 7 benches" (matching the Cavern/Quantum-Drift "open & growing" idiom in the same file). A one-line prose fix on a PLAN cycle.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ TAILORED #333: Time as a Verb You Hold → grounds seed Time as a Verb You Hold · after d68d2f0 -->
<!-- ✝ TAILORED #333: Time & Its Paradoxes → grounds seed Time as a Verb You Hold · after d68d2f0 -->
<!-- ✝ BLOOMED #333: Weather You Can Make → weather-you-can-make/ #314 · after d68d2f0 -->
<!-- ✝ BLOOMED #333: The teacup caustic → teacup-caustic/ #312 · after d68d2f0 -->
<!-- ✝ SUPERSEDED #333: The Drawing Engines & flow benches → spark The Mechanism Bench · after d68d2f0 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [wing] **THE DEEP HEARTH — found the estate's EARTH wing on a side-on cutaway of the molten planet; its first bench tunes ONE vent between an ooze and a blast** — the estate has WATER (ripple · pool · the reef-to-come) and AIR (the Cloud Bench) but no EARTH-on-fire, and zero volcanism anywhere (grep magma|volcan|lava|eruption hits only an orrery factoid, audio colormaps, and matplotlib "Magma" ramp-names — no geophysics piece). FOUND a new grounds wing THE DEEP HEARTH — distinct from THE FOUNDRY (which casts ABSTRACT potential fields by relaxation): the Hearth is the LITERAL planet, rock that creeps, melts, and shatters — geophysics, magma accent #e24a2a, its OWN map plate (register in layout.js GROUNDS_WINGS, disjoint from the forge — and from the amusements plate the ⚡ 'Bench Is Full' spark flags as near-full). LANDING — The Standing Section: a side-on geological cutaway read top-to-bottom (mantle → magma-chamber bulb → conduit → vent → sky) with the wing's benches sited at their true depth (the landing IS the establishing cross-section; later benches dock into it). FIRST BENCH — The Same Vent, Two Tempers (FORM: a side-on glass-walled conduit you TUNE and watch ERUPT, not a plotted curve): two brass dials — SILICA (basalt↔rhyolite, recolors the melt + sets viscosity over orders of magnitude) and DISSOLVED GAS (volatile wt%); open the vent, the column decompresses, bubbles nucleate and grow as P drops. EFFUSIVE (low silica ⇒ low η) — bubbles stream out, magma OOZES over the rim as a glowing flank flow, quiet. EXPLOSIVE (high silica ⇒ high η) — gas stays trapped, the gas fraction φ climbs the column and at the FRAGMENTATION LEVEL the coherent melt SHATTERS into a roaring pyroclastic blast. A horizontal fragmentation line marks the depth where φ=¾; tune the dials and the line slides — push it above the vent (φ never reaches ¾) and the eruption falls back to an ooze. THAT crossing, made visible, is the crux. CRUX (the-deep-hearth/conduit/core.mjs = sole physics authority + a headless Node twin; honest 'exact within the stated model'): log₁₀η = a(S) − k·w (silica raises, water lowers); Henry solubility C_s = s·√P; decompression exsolution + ideal-gas growth give φ(z); a Stokes coupling number gates gas ESCAPE (low η ⇒ bubbles decouple, degas, φ capped). EXPLOSIVE iff the coupled column reaches φ ≥ φ_crit = ¾ (bubble close-packing foam-disruption limit, Sparks 1978) before the vent; z_f is where φ(z_f)=¾. SELF-TEST: over an N×N (silica, gas) grid the analytic style-predicate === the rendered outcome with zero disagreement; on the boundary max φ(z)=¾ exactly and z_f matches the rendered shatter height; the boundary is MONOTONE (more silica or gas only ever pushes explosive). NEG-CONTROLS: (a) gas→0 ⇒ no silica value ever fragments; (b) pin η basaltic ⇒ even max gas escapes and stays effusive (proves VISCOSITY, not gas alone, gates the blast); (c) the headless twin reproduces the boundary from the same core.mjs. SIBLINGS the wing can grow: The Shadow Zone — strike the surface, watch P/S wavefronts refract through the layered Earth, the S-wave shadow (~104°–140°) PROVES the liquid outer core (the no-S boundary the exact crux); The Slow Creep — solid mantle rock that FLOWS, Rayleigh–Bénard at η~10²¹ with the same Ra_c crossover at planetary scale; The Melting Floor — why the deep mantle is SOLID though hotter than lava: walk a rock up the P–T plane until a ridge's decompression adiabat CROSSES the pressure-raised solidus and it melts. SCOPE: ship the LANDING + the FIRST BENCH as new grounds wing the-deep-hearth/ on its own map plate. ART (foundry pass): layered cutaway backdrop [visual] · magma render — silica color ramp · bubble field · lava ooze · pyroclastic column [visual+anim] · two ambiences, effusive gurgle/hiss vs explosive roar + the fragmentation crack [sound] · brass dial panel [visual]. (sown #333 · contest #30)
- [medium] **Time as a Verb You Hold — landing + first room "The Hour That Bites Its Tail," a Novikov consistency engine** — the Estate is named for an orrery, a clock of the heavens, yet every time-piece it owns READS the clock (hours/ sundial) or watches its ARROW (reversing-room/ entropy) — none let you OPERATE time. Found the estate's FIRST medium where time is the control, not the backdrop (answers the standing ⚡ 'a time-based medium the estate lacks'). GREP-CONFIRMED GAP: zero novikov / grandfather / closed-timelike / chronology-protection hits estate-wide — the only 'bootstrap' on the estate is bootstrap-bench/, ELECTROMAGNETISM, a DIFFERENT sense, so name the kernel to avoid collision. A deterministic micro-world with a WORMHOLE GATE that sends whatever enters back to the loop's start Δt earlier, so you act, step through, and replay BESIDE YOUR OWN PAST as a translucent shadow you must cooperate with; the exit only LATCHES (a brass pawl drops, the hour chimes) when the WHOLE timeline is a FIXED POINT — every shadow does exactly what memory recorded, including your present self's effect on it. The three paradoxes are the three visible verdicts: GRANDFATHER (stop your past self entering the gate) → no consistent history → the gate REJECTS it (red 'paradox' stamp, pawl won't drop); PREDESTINATION (try to deviate from what you remember) → the engine SNAPS you to the forced closure (gold 'it was always so'); BOOTSTRAP (carry back a key that exists only because you carried it) → admitted but FLAGGED un-grounded (violet 'uncaused'). FORM (played, touchable, action IS the content — NOT a graph): a brass-and-glass clockwork chamber, a figure on a short tile loop, replay-shadows with motion-trails, the gate an animated swallow-and-emit escapement aperture. CRUX (time-as-a-verb/core.mjs = sole world+loop authority + headless Node twin, byte-exact & FINITE): the world is a deterministic finite-state machine; the boundary x sent back through the gate has a loop map L(x); self-consistency ⟺ L(x)=x checked by byte-exact deep-equality of serialized state; the engine EXHAUSTIVELY searches the finite x-space and pins the fixed-point SET per scripted scenario — grandfather ⇒ ∅ (provably no consistent history, REJECT), a solvable hour ⇒ ≥1 grounded fixed point with serialize(applyLoop(x))===serialize(x), predestination ⇒ a UNIQUE fixed point every non-fixed attempt maps away from, bootstrap ⇒ a consistent fixed point whose carried object has no in-world causal origin (a provenance flag separating 'consistent' from 'grounded'). NEG-CONTROLS: (a) gate OFF ⇒ every run is trivially consistent (the paradox structure exists ONLY when the loop closes); (b) the SAME scenario flips admissible↔paradox as Δt changes ⇒ the fixed-point set is a property of the loop, not the player. Echeverria–Klinkhammer–Thorne guarantee pinned on a designated billiard-style sub-scenario: a consistent closure ALWAYS exists even when the naive play looks paradoxical (the engine finds the non-obvious fixed point). PERF/SCOPE GUARD: keep the world's state space SMALL (short tile loop, few movable objects, modest Δt) so the exhaustive search stays tractable; keep the BYTE-EXACT claim on the finite engine and let any continuous billiard table be a to-tolerance GROWTH room. SCOPE (landing + first room + reusable loop KERNEL future time-rooms inherit, as the-sightline reuses vantage/core.mjs — the Sightline/Long-Way-Home scale): ship the LANDING (introduces time-as-a-control, links the room, names the GROWTH — a horizontal-motion time-scrubber side-scroller [walk right=forward, left=back, puzzles solved in the seam] and a continuous Novikov billiard-gate table) + ONE playable consistency-engine room + the shared kernel. ART (foundry pass): brass-and-glass loop chamber [visual] · swallow-and-emit gate aperture [anim] · translucent shadow figures + motion-trails [anim] · pawl-drop latch + consistency chime [anim+sound] · three verdict stamps grandfather/predestination/bootstrap [visual]. (sown #333 · contest #30)
- [medium] **The Sightline — a 3-D scene whose OCCLUSIONS spell the word, read only by the path you walk** — the navigable-scene medium's SECOND room and the structural opposite of The Vantage (vantage/ #151, single-pose resolve): ~12 opaque gilt slabs float at staggered depths in a dim vault and NOTHING resolves from any single pose — as you orbit/dolly a real perspective camera the slabs OCCLUDE one another in a changing order, and the legible content is the SEQUENCE in which a hidden glyph is unveiled (each face seen only through the gap the prior slab opens). FORM (touchable fly-through, navigation IS the content): drag-orbit + scroll-dolly the SAME vanilla project() chain vantage/core.mjs proves (no 3D lib); a painter's-order depth-sort decides occlusion each frame; a reveal-ribbon fills as faces uncover IN ORDER and resets the instant one reveals out of turn. GREP-CONFIRMED GAP: zero occlusion/painter's-algorithm/depth-order piece estate-wide; succeeds DECAYED Camera Maze (#296) by changing the CONTENT-KIND. CRUX (the-sightline/core.mjs = sole camera+visibility authority + headless Node twin): solution flight C(t) yields unveil permutation σ === target spelling, faces first-unoccluded at strictly increasing t (combinatorial over the PATH), σ unchanged under an ε-tube of nearby flights. NEG-CONTROLS: (a) DEPTH-COLLAPSE foil ⇒ occlusion never swaps ⇒ ribbon never fills; (b) SHUFFLED-FLIGHT control over dense sampling ⇒ no path reproduces σ. SCOPE: ship ONE spelled word; new room the-sightline/ grows the 'SCENES YOU WALK INTO' wing into a true two-room medium. (sown #306 · contest #28)
<!-- ✝ BLOOMED #305: The Aether Forge — give a field a FLICK and watch the pulse build itsel… → bootstrap-bench/ (#252 — duplicate, superseded) · after 0ba3d5b -->
<!-- ✝ BLOOMED #305: The Relaxation Pool — brush the rim of a field, watch it forget the bru… → the-foundry/casting-floor/ · after 0ba3d5b -->
<!-- ✝ BLOOMED #317: The Aquarium — a lit tank of the deep you set running and leave breathi… → the-aquarium/ · after 31ee19b -->
<!-- ✝ BLOOMED #329: The Long Way Home — the monomyth as a place you WALK, not a maze you re… → the-long-way-home/ · after 96dcf55 -->
<!-- ✝ DECAYED #332: The Self-Healing Plate — the front door re-partitions ITSELF, no hand-t… · after 8483a9e -->
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
- [exhibit] **The Jug — One Note From a Hollow (Helmholtz resonator)** — Blow across a brass jug and it hums ONE low note — not the Stopped Pipe's whole harmonic ladder but a single LUMPED resonance: the air in the neck is a MASS bobbing on the cavity's SPRING. FORM (touchable, HEARD, no chart): a side-on brass bottle you fill with water (drag the level = shrink V) and whose neck you widen (A) / lengthen (L); a breath-wisp flicks the mouth and it hums, the air-plug bobbing as a glowing mass-on-spring while the cavity is drawn compressing — the heard pitch is the hero, ONE bright pip on a side-rail. CRUX (machine-ε, geometry-FREE so it can't drift): f_H=(c/2π)·√(A/(V·L_eff)) → HALVE the cavity → the pitch rises by exactly √2 (a felt tritone); double the neck area → ×√2; quadruple L_eff → drops an octave; and the lumped identity (2πf_H)²≡k/m with k=ρc²A²/V, m=ρ·A·L_eff holds to 1e-12 — THIS is what proves it's a mass-spring, not a standing wave. NEG-CONTROL: there is NO harmonic series — a single resonance set by GEOMETRY, no mode at 2·f_H (The Stopped Pipe's odd-harmonic ladder is the cross-linked foil: distributed ladder ↔ lumped lump); blowing harder never shifts the pitch. GAP grep-confirmed: ZERO acoustic-Helmholtz/jug hits (the estate's only "Helmholtz" is singing-plate's unrelated −Δu=λu drumhead eigen + glossary/verse). Web Audio HONEST: a Helmholtz resonator IS a 2nd-order system → one BiquadFilter at f_H on breath-band noise is the exact model; verify via Audio Lens, audio muted by default on a workday. Refills the thin SOUND vein with a touchable resonator distinct from every garden instrument (comb/comma/stopped-pipe/overtone-rack/tartini…); foundry-light (brass jug · water gradient · bobbing air-plug + cavity-spring overlay · breath wisp). (sown #332)
- [exhibit] **The German Tank** — a probability fact you OPERATE, not plot: a hidden fleet of N tanks (serials 1..N, N unknown) rolls past a slit, you glimpse k of them, and two guess-readouts race — the naive 'highest I saw' vs the spy's N̂ = m(1+1/k) − 1. Pull the 'capture more' lever to widen k and FEEL the naive guess crawl up while the spy's dial sits centred. FORM: stamped-steel serial plates rolling past a slit + two dial gauges (not a chart). CRUX (machine-ε): the UMVU estimator is unbiased — E[N̂]=N EXACTLY (exact hypergeometric expectation, not Monte-Carlo) — and BEATS max-seen on mean-squared error (N=30,k=4: MSE 33.6 vs 48.5). NEG-CONTROL: the naive max-seen is provably biased LOW (E[max]<N for all k<N). State the without-replacement, no-gaps assumption honestly (the WW2 framing holds it). grep-confirmed ZERO german-tank/capture-recapture/serial-number hits. A distinct register from Buffon (converge a constant) and Galton (the bell): estimate a HIDDEN WHOLE from a sliver. Numbers Room, foundry-light (plates + gauges). (sown #325)
- [exhibit] **The Mediant Fold** — Farey rows as KISSING FORD CIRCLES you fold by hand (distinct from best-rational's single-target tree-descent — this is the WHOLE row F_n as a fan of discs, each fraction p/q a circle at (p/q, 1/2q²) of radius 1/2q²). Grab two touching circles, FOLD their mediant (p+r)/(q+s) into the gap, and a new circle blooms tangent to both — the row densifies before your eyes. FORM (touchable, no graph): luminous discs on a chalked number-line, a soft click when two kiss, a bloom when a mediant lands. CRUX (machine-ε): two Ford circles KISS exactly when |ps−qr|=1 (tangency error 1.1e-16) and stay strictly apart otherwise (min non-neighbour gap 0.0083>0); every mediant of a neighbour pair is automatically in lowest terms and kisses BOTH parents to 1e-16. NEG-CONTROL: a non-neighbour pair (|ps−qr|>1) NEVER touches — the unimodular gap, not mere closeness, makes circles kiss. grep-confirmed ZERO farey/ford-circle hits. Numbers Room (teal exact bench), foundry-light. Cross-link to best-rational ('the tree's cousin: the whole row at once') so the two read as kin, not dupes. (sown #325)
- [exhibit] **The Lamplighter's Chase** — the Adversary/Numbers-Room wing holds only COMBINATORIAL boards (enumerate-and-retrograde: Nim, Chomp, Hex, Wythoff, Toads&Frogs); this is a structurally OPPOSITE form — a continuous geometric PURSUIT game, no state graph to enumerate. You are the EVADER (a firefly) on an open court; a brass pursuer chases under PURE PURSUIT (always steering straight at your current position). FORM (played, not graphed): drag to flee, the pursuit-curve drawn as a living gold tail with a capture-radius ring — if the pursuer is faster it always catches you and you survive longest / reach a far gate; if you are faster you taunt it into a spiral it can never close. CRUX (self-test on a SCRIPTED straight-fleeing evader — the law — while the court uses free drag, BOTH paths in one core): for speed ratio k=v_p/v_e>1 capture happens at the published distance L₀·k/(k²−1) (pin value + tol over several k) and the curve-of-pursuit arc-length matches its analytic form. NEG-CONTROL: k≤1 ⇒ separation never reaches 0 over any horizon — the speed advantage is the ONLY thing that arms the catch. grep-confirmed ZERO pursuit/chauffeur/differential-game/cop-robber hits. A new game family beside the discrete boards; SVG/canvas idiom, no foundry pass. (sown #325)
- [exhibit] **Fire Underground — The Vent That Can't Decide** — a volcano you OPERATE, not a chart: one side-on vent, two touchable dials (GAS · VISCOSITY). Runny + low-gas OOZES an effusive lava tongue (tilt the slope, watch it pool); stiff + high-gas pressurises until the foam FRAGMENTS into a ballistic ash plume — the same vent one slider from ooze to blast, the crossover felt as a snap not read off an axis. CRUX (machine-ε self-test): mode flips EXACTLY where bubble-packing β=gas/(gas+melt) crosses the foam limit β*≈0.75 (build pins the exact published value + tol); the Bingham yield law is exact (below τ_y the tongue's velocity≡0, above it advances); NEG-CONTROL: β=0 can NEVER fragment however stiff — gas arms the blast, not silica alone. grep-confirmed NO magma/lava/yield-stress bench exists (only incidental orrery + audio-lens hits); fills the estate's missing earth/fire element beside water + air. Distinct from the Sandpile (abelian CA) and the Brazil-Nut Box (granular segregation). Art is foundry-scale (magma gradient + bubble field · lava heat-glow · plume burst · optional rumble→crack) — plan a foundry pass, don't shrink it. (sown #318)





### cross
- [cross] **The Same Cosine, Crossed Two Ways** — ONE projection law cos²(angle) worn by light and by a single spin, which the quantum world reads on the HALF angle. LEFT The Polariser (Malus, inline in index.html). RIGHT the Cavern's spin-½ Born rule (cavern/spin/core.mjs, pUp(n,m)=cos²(Θ/2), byte-untouched). FORM (touchable, no graph): two crossed-analyser benches under ONE shared protractor dial; drag to 90° and the LIGHT lane goes BLACK (extinction) while the SPIN lane stays at exactly ½ — a beam that REFUSES to go dark — then a 45° middle analyser RESCUES both (light→¼, spin chain leaks through), the same cos²-chain magic; a chip labels the bridge θ_spin=2·θ_light so the spinor double-cover is felt. CRUX (machine-ε, anti-circular through both byte-untouched parents): malus(1,θ)===pUp under θ_spin=2θ to <1e-12; crossed-90° gives malus=0 vs pUp=0.5; paradoxFraction(45°)=¼ and the 0/45/90 spin cascade both clear the floor. PREP: promote the polariser's inline core to a byte-twin polariser/core.mjs, pin n̂ along +z, keep adapters code-disjoint. Top-level leaf, modeled on cross/two-costumes; art is a 2-lane crossed-analyser animation (slats + Bloch needle), foundry-light, no graph. (sown #325)


### curation


### rework
- [rework] **The Coastline Rule → make the measured coast the touchable hero (a caliper you shrink, a length climbing without bound)** — PIECE: fractal-dimension/ "The Coastline Rule" (Workbench → Toys & benches). SOUL IT LACKS: the dimension is delivered as a co-equal log–log SLOPE read off a regression plot, and the coastline paradox — a length that climbs without bound as the ruler shrinks, the most visceral thing in the room — is demoted to preset #5 of 8. RE-SOUL (mirror the sampling-theorem/Risset precedent the estate celebrates — touchable hero, plot as side-rail shadow): walk a real ragged coast with a brass CALIPER / pair of dividers you shrink by hand and watch the paced-out total L=δ·N(δ) climb WITHOUT LIMIT (the paradox felt in the palm); the box-grid BLOOMS across the inked shape as you sweep ε (you see N(ε)); the dimension surfaces as a quiet roughness readout; demote the log–log plot to a faint side-rail SHADOW captioned "the curve is the shadow of what your hand did." KEEP THE BOX-COUNT MATH BYTE-EXACT (the proven engine stays box-counting vs the closed forms): preserve the 11/11 self-test, Koch=log4/log3, Sierpiński=log3/log2, carpet=log8/log3, disc→2, the ordering 1<Koch<Sierp<carpet<2, coastline tracks 2−H; keep core.mjs and its inlined twin in sync. The caliper-length divergence is the FELT layer (Richardson/compass walk over a fixed-chord δ stepper), NOT a new proof claim — the pinned assertions stay box-count D vs closed form. Default the hero to the fBm ragged coast (predictedD=2−H exists), self-similar presets still reachable. A re-grow-in-place equal to a new exhibit; foundry-light (brass dividers · ragged coast · amber grid bloom). (sown #332)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Partition Wall** — grow the Adversary engine (tools/game/, surfaced in the Numbers Room) its FIRST partizan game: Domineering 4×4 — you only lay your domino UPRIGHT, your rival only FLAT; whoever runs out of room loses. FORM (played, not graphed): drag a domino onto the grid vs perfectPlayer, reveal-verdict shades every legal placement WIN/LOSS + mate-distance off the proven table — inherits the whole Adversary board for ~one declarative games/dom44.js def, NO engine change. CRUX (same runSelfTest as the green chip): solve()'s root value == literatureValue WIN for 4×4 Vertical-to-move; an INDEPENDENT literatureBattery re-derives tiny boards (1×2/2×1 immediate LOSS for the mover, 2×2 first-player WIN mate-in-3); perfectPlayer never loses from a non-LOSS position over the whole reachable set; and the symmetry check value(key s)==value(key sym·s) PROVES the one subtlety — the role-preserving D4 SUBGROUP canon (180°-rotation + axis flips, NOT transpose, which swaps the players' orientations). grep-confirmed 0 domineering/partizan hits; distinct from all 10 shipped games (nim/chomp/hex3/hexapawn/konane/mnk/wythoff/ttt/hexfill) and the sown Sprouts Court #303 + Charge Mold #310. Set nodeBudget to the self-test-printed count (4×4 ~a few thousand states, <1s at load; fall back to clean 3×4 if it surprises). Only net-new art: a two-orientation domino-tile sprite + drag affordance — NOT a foundry pass. (sown #318)
- [bench] **The Skittle Alley** — grow the Adversary engine its first OCTAL (1-D) game: Kayles — a row of bowling pins, on your turn knock down ONE pin OR TWO ADJACENT pins, last to knock a pin wins. FORM (played, not graphed): a row of ~12 standing-pin sprites, click one or a touching pair and they topple with a thunk vs perfectPlayer; reveal-verdict shades each legal knock WIN/LOSS off the proven table. CRUX (self-test) is a STRUCTURAL law no other game in the wing has: the Sprague-Grundy nim-value sequence grundy(n) is eventually PERIODIC with period 12 — the self-test re-derives grundy(n) up to n≈30 by mex over sub-positions and matches the published Kayles table (and confirms the start position's value) — a 1-D Grundy-theory showpiece beside the 2-D boards. Trivially enumerable. grep-confirmed 0 kayles/octal hits. A DIFFERENT played form from The Partition Wall (octal row + structural law vs partizan board) — both kept for slate variety; independent builds, no conflict. (sown #318)
<!-- ✝ BLOOMED #326: The Comb's Teeth → sound-garden/the-comb/ · after 5768d70 -->
<!-- ✝ BLOOMED #330: The Heap That Knows Its Own Angle → the-heap/ · after be79439 -->
<!-- ✝ BLOOMED #331: The Keystone Arch → the-keystone-arch/ · after ac4ec4f -->
<!-- ✝ DECAYED #332: How Long Is the Coast? · after 8483a9e -->
<!-- ✝ BLOOMED #334: The Rolling Room — a still fluid that decides to churn (Rayleigh-Bénard) → the-rolling-room/ · after a12bf9a -->
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
