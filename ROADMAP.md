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
<!-- ✝ FIXED #216: Front door — hover reveals too many labels at once, and subtitles are n… · after 0ffa1ef -->
<!-- ✝ FIXED #216: Front door — the hover info panel covers the room's own revealed label. · after 0ffa1ef -->
<!-- ✝ FIXED #216: Front door — zoomed-in labels are oversized because they're drawn at fi… · after 0ffa1ef -->
<!-- ✝ FIXED #216: Front door — zoom does not auto-reveal labels by LOD; it still requires… · after 0ffa1ef -->
<!-- ✝ FIXED #216: Front door — dragging to pan selects the map's text. · after 0ffa1ef -->
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
- ⚡ **The estate with more than one front door** — the loupe (#212) made the single front door PASSABLE by revealing room names only under the visitor's lean, but the underlying SCALE pressure is unchanged: 46 rooms on one plate, still growing, the full-plate legibility score honestly CROWDED (0.86). The durable answer is structural, not a disclosure trick — split the one map into several interlinked front-door DISTRICTS a visitor TRAVELS BETWEEN (the manor · the grounds · the observatory each its own readable plate, with doorways/threshold tiles between), so no single view ever has to hold the whole estate. A big swing for the grounds queue: the navigation becomes a place you move through, each plate legible by construction at any room count. (Companion to the loupe, not a replacement — the loupe keeps any single district readable; this keeps the ESTATE readable as it grows past what one plate can ever hold.)
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
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [wing] **The Bootstrap Bench — the wave that carries itself (E makes B makes E)** — Tailors the ⚡ 'the wave that carries itself' spark into the EM vein's capstone, the bench the Lodestone Hall (#211 induction) was founding toward. FORM is a long open run of FREE SPACE — no wires, no medium, just a field you can FLICK: grab the electric field at the left edge and snap it once (a vertical kick), and watch a self-sustaining E⊥B pulse PEEL OFF and propagate rightward on its own, the changing E sourcing a transverse B that sources E ahead of it — Maxwell's bootstrap made seen-and-touchable. The two fields ride together as orthogonal ribbons (E up-down, B in-out drawn in depth) locked a quarter-step in lockstep; the pulse keeps its shape and rolls at one fixed speed with NOTHING pushing it. A speed gate clocks the leading edge across two posts; a μ₀/ε₀ dial-pair (the vacuum's two constants, the only knobs) and the crux read off the SLOPE: c = 1/√(μ₀ε₀). FOOTPRINT: a new top-level room (bootstrap-bench/) with its own POI/star + district/wing slot, the EM vein's third room (Lodestone Hall · iron-filings · this), seeding a 'Fields & Waves' capstone group; a reciprocal cross-link back to lodestone-hall. CRUX (bootstrap-bench/core.mjs the SOLE 1-D FDTD/Yee authority + Node twin): the leapfrog update of E,B on a staggered grid CONSERVES field energy on a closed run to <1e-9 and the measured front speed EQUALS 1/√(μ₀ε₀) to the grid's CFL tolerance over a sweep of both constants (split the claim — energy identity to <1e-9, propagation speed to the discretization bound); a single flick launches ONE right-moving pulse that holds its L2 shape to the absorbing edge; doubling ε₀ scales c by exactly 1/√2. NEG-CONTROL: a 'freeze the curl' toggle zeroes the ∂B/∂t→E feedback leg — the pulse STOPS bootstrapping and collapses in place (no propagation), proving it is the MUTUAL E↔B coupling, not a pre-scripted travelling shape, that carries the wave; a second cheat sets c>1/√(μ₀ε₀) by hand and the CFL/energy check fires RED (you cannot outrun the vacuum). (sown #213 · contest #19)
- [medium] **The Tone Mill — the pitch you HEAR is the rate you WATCH** — Tailors the ⚡ 'a medium the estate lacks / seen-and-heard-at-once' spark into the estate's first TIME-BASED medium where the visual motion and the audible tone are ONE generative object, not a chart with a beep. FORM is the 19th-century acoustic SIREN that first PROVED pitch is event-frequency: a brass disc of N evenly-cut teeth you set SPINNING — you WATCH it turn at a measured rate Ω while a fixed strobe-edge HEARS each tooth pass, so the tone is literally f = N·Ω/2π, the rate of the thing you watch. Crank to twice the speed and you SEE it spin twice as fast AND HEAR an exact octave; a strobe lamp at the audio frequency FREEZES the teeth (the eye reads the ear's rate); two concentric rings in a small-integer tooth-count ratio sound a just interval you see lock and hear ring. ONE shared core ticks the disc's angle θ(t) and that SAME θ drives the oscillator's instantaneous frequency, so seen rate and heard pitch CANNOT drift (kin to how sound-garden/pitch-core.mjs single-sources a note). Distinct from the Passing Siren (Doppler-by-visible-crowding of a MOVING source) and from needle-meters of audio (Endless Staircase): here the watched RATE itself is the pitch. FOOTPRINT: a new top-level room (tone-mill/) with its own POI/star, the seed of a 'Kinetics & Sound' vein (a stroboscope · a driven Chladni plate · a seen-and-heard tuning-fork beat). CRUX (tone-mill/core.mjs the SOLE authority + Node twin): the EYE-read rate × N EQUALS the scheduled audio f = N·Ω/2π to <1e-9, and the Audio Lens recovers that fundamental from an OFFLINE render to within the lens's bin tolerance (split the claim — <1e-9 on the core identity, bin-tolerance on the lens leg; NO heard-headless claim without the lens); doubling Ω = exactly +1200 cents; two rings (p,q) sound the derived just ratio. NEG-CONTROL: a detached-needle toggle drives the oscillator from a free-running knob decoupled from θ(t) — the strobe stops freezing AND recoveredHz ≠ N·Ω/2π (the lens catches the drift), proving it is the SHARED phase, not two coincidentally-tuned dials, that makes seen and heard one thing. (sown #183 · contest #16)
<!-- ✝ BLOOMED #181: The Reversing-Room — time you can crank home (the arrow is the clay) → reversing-room/ · after 0308fd1 -->
<!-- ✝ DECAYED #182: Re-draw the front door — legible to a human, not just to the packer · after f7455db -->
<!-- ✝ BLOOMED #191: The Holonomy Walk — a court whose curvature you feel only by walking it → holonomy/ · after 9659c2d -->
<!-- ✝ BLOOMED #201: The Refraction Run — the light-path you have to FLY → refraction-run/ · after 55a4a71 -->
<!-- ✝ BLOOMED #211: The Lodestone Hall — the current you make by MOVING → lodestone-hall/ · after 9f97eff -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Gene Jar — the pool that won't drift** — Conservatory (its first POPULATION-GENETICS bench; its four current rooms are growth/predation/game-theory/epidemic — genetics is a clean hole). TOUCHABLE: a glass jar of two-colour allele BEADS (gold A, slate a); set the starting fraction p with a slider, then CRANK 'one generation of random mating' — the jar scoops beads two-at-a-time and stacks offspring into three genotype columns (AA, Aa, aa) filling like the alchemy bins. FORM = beads you pour + a crank you turn, not a frequency plot. The surprise: after ONE crank the columns lock at p²,2pq,q² and STAY there crank after crank — the pool remembers nothing, drifts nowhere. CRUX (conservatory/the-gene-jar/core.mjs + Node twin, page-inline byte-identical): assert p²+2pq+q²===1 to the bit; assert p is INVARIANT under the mating operator (p'===p to <1e-9 for arbitrary p, the deterministic infinite-pool map = PROVEN); a finite seeded scoop of N pairs lands the three counts within √N of N·{p²,2pq,q²} (honest sampling FIT, NEVER claimed as proof — the Benford Mill χ² register). NEG-CONTROL (fires RED): an 'assortative mating' knife-switch (like-mates-with-like, the wrong rule, inline-ONLY) drains the Aa column and the identity check goes RED though p is unchanged — proving it's the RANDOM pairing, not the allele counts, that holds the pool still. (sown #207)





### cross
- [cross] **The Same Heat — a word-picking AI and a thermal ratchet share one temperature line** — clockwork/core.mjs (The Temperature Dial — softmax) × engine-room/brownian/core.mjs (The Brownian Ratchet — symmetricRates). Never crossed (softmax/Boltzmann is a confirmed gap among the 8 built crosses); they share ZERO code and look nothing alike — one is a language model choosing the next token, one is the Second Law refusing free work from noise — yet both have a knob literally named TEMPERATURE and obey the SAME law: the LOG-ODDS between two outcomes is a STRAIGHT LINE in 1/T whose slope is the energy gap. Softmax: ln(p_a/p_b)=(z_a−z_b)/T. Symmetric ratchet: ln(r_fwd/r_bwd)=−2τ/T. Raise T and both flatten to 50/50; lower T and both spike (greedy decoding / a one-way pawl). FORM — a two-bay diorama on ONE shared thermostat bead (reuse curie-dial's drag-a-bead grammar): LEFT two token-bars whose split slides, RIGHT a ratchet wheel whose hop-bias slides on the SAME bead, and one gold Boltzmann line (log-odds vs 1/T) onto which BOTH land as the same ray; tune −2τ to equal the logit gap and the two unrelated machines trace the identical line. CRUX (thin cross/core.mjs adapter + Node twin, both parents imported BYTE-TRUE, kept as TWO independent oracles): assert each log-odds is exactly linear in 1/T and they COINCIDE to <1e-9 when −2τ=gap (over T∈{0.25..4}). NEG-CONTROL (BREAKS the link): replace exp(z/T) with a non-Boltzmann (linear/power) normalizer, or break exp(−E/T) on the rate → the log-odds bends off the line — proving it's the EXPONENTIAL e^{−E/T}, not the apparatus, that makes temperature the same dial in a mind and a gas. NO two-step grow (both cores already export the needed functions). Strengthens the young Clockwork Automata wing. (sown #214)
- [cross] **The Same Wedge — colliding blocks and a mirror-wedge both count ⌊π/θ⌋ reflections** — collisions/core.mjs (The Clack Counter) × the kaleidoscope's mirror-wedge (kaleidoscope/). SHARED EXACT LAW, surprise real because they share zero code and look nothing alike: collisions/core.mjs ALREADY models its physics as Galperin's billiard — a ray in a wedge of half-angle θ=atan√(m/M) escaping after ⌈π/θ⌉−1 reflections; a kaleidoscope is the SAME billiard in light — a sight-ray in a mirror-wedge of angle θ makes ⌊2π/θ⌋ images (the page derives the Dₙ half-angle π/n). Two blocks clacking on a track and a tube of mirrors are the IDENTICAL wedge — one counted in time, one folded in space. FORM: a two-bay diorama on ONE shared θ dial — LEFT the clacks ticking to ⌈π/θ⌉−1, RIGHT a mirror-fan lighting ⌊π/θ⌋ copies, one gold protractor pinning both; the surprise lands when the mass ratio that makes the clacks spell π lights the SAME image count. PREREQUISITE — TWO-STEP (the kaleidoscope has NO core.mjs, its wedge math lives in prose; the cross rule needs both parents byte-true): FIRST grow a tiny kaleidoscope/core.mjs exposing imagesInWedge(θ) (the page's own derived law lifted into a testable module), THEN the thin cross adapter + Node twin. CRUX: both counts derive from ONE shared reflectionsInWedge(θ) oracle and agree to the integer across a θ sweep, aligning the two conventions on the same half-wedge (⌊π/θ⌋); the ⌈·⌉−1 boundary care (1:1→3, 3:1→5) carries byte-true from the collisions core. NEG-CONTROL: open θ>π/2 (mass ratio <1, or mirrors past a right angle) → only 1 reflection / 1 image, the fan collapses — proving it's the angle FITTING into π, not the apparatus, that sets the count. (sown #207)
- [cross] **The Same Climb to φ — a Penrose patch and a fraction-hunter ride one Fibonacci ladder** — aperiodic-patch/core.mjs × best-rational/core.mjs (never crossed, zero shared code, look nothing alike: triangle DEFLATION vs continued-fraction RECURRENCE). SHARED LAW — the surprise is the shared LADDER: deflating the Penrose seed, the thin:fat Robinson-triangle census comes out EXACTLY the consecutive-Fibonacci ratios (3:2, 8:5, 21:13…) — the very φ-convergent fractions best-rational walks — both climbing to φ. FORM: a two-bay diorama, ONE gold ruler on a single φ tick — LEFT a living patch relabelling with the freshly-COUNTED thin/fat Fibonacci integers as it deflates; RIGHT the convergent walk landing on the same fraction; one dial advances both in lockstep. CRUX (thin cross/core.mjs adapter + Node twin, both parents byte-true): each level-L tiling ratio === its same-VALUED φ-convergent + both → φ to <1e-9. NEG-CONTROLS: point best-rational at √2 or π (the marker walks off φ); swap aperiodic to its periodicControl() grid (no φ-ladder). (sown #200)
- [cross] **The Sign They Can't Hide — a sliding-tile puzzle and a tower-bell peal gated by one permutation's sign** — the-fifteen/core.mjs × extent/core.mjs (never crossed, zero shared code — only the name `inversions` overlaps with DIFFERENT impls: O(n²) count vs a Lehmer/SJT walk). SHARED LAW: the SIGN of a permutation (−1)^inversions ∈ {+1,−1}, the one bit a transposition always flips. FORM: a two-bay diorama, ONE brass ±1 parity needle (two detents) — LEFT a 15-puzzle you SLIDE (each legal slide a transposition the needle tracks, never leaving +1 — the conserved seal); RIGHT extent's bells ringing the peal, each pull snapping the needle to the OTHER detent row by row; one control steps both. CRUX (thin cross/core.mjs adapter + Node twin, both parents byte-true): keep the two `inversions` as TWO independent oracles (never one import), blank parked bottom-right; assert each change flips (−1)^inv and isSolvable matches the even-sign verdict exactly. NEG-CONTROLS: one ILLEGAL swap flips the sign → board locked out of the solvable orbit; a NON-adjacent change in extent breaks the alternation → the peal fails to close home. (sown #200)


### curation
- [curation] **The Two Coasts That Measure the Same Thing** — the estate has TWO coastline rooms — The Coastline Paradox (coastline-paradox/, a ruler that never settles; ALREADY computes box-count D) and The Coastline Rule (fractal-dimension/, D=log_r(N) off a log-log slope) — two halves of one idea (length depends on ruler size; that very dependence IS the dimension), yet they share ZERO links (grep-confirmed 0 each way). Lay a RECIPROCAL .sib-link on each in the established house style (the same treatment cartographer already uses to point at the Paradox, which coastline-paradox already carries back). FORM: pure connective taste-work, no new build. CRUX: none — verify only that both added links RESOLVE and RECIPROCATE. BUILD CARE (reverse of the usual): neither room has a .src.html twin — edit index.html DIRECTLY, do NOT forge. (sown #214)
- [curation] **Games That Fight Back — a trail across the adversary-engine family** — the estate's perfect-play games all run tools/game/adversary.js — The Stone Heaps (nim/), The Matchbox That Learns (hexapawn/), The Queen's Long Walk (queens-walk/, Wythoff) — yet today each links only UP to a parent (Numbers Room / Adversary) and never to each other (grep-confirmed 0 sib-links each way). Lay a small reciprocal '↔ other games that play to win' footer trail in the established .sib-link house style so a player who beats one finds the next; include The Poisoned Bar (Chomp) once it blooms. This is the broader REFRAME of the just-decayed narrow 'Two Games by a Hidden Number' (which pinned on a hidden-number framing fitting only Nim+Queen's-Walk) — widened to the whole family. FORM: pure connective taste-work, no new build, engine untouched. CRUX: none — verify only that every added link resolves AND reciprocates. BUILD CARE: edit *.src.html where it exists then re-forge — never the generated twin. (sown #214)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Voltaic Pile You Build — two metals decide the voltage** — Alchemy Lab (alchemy/galvanic-cell/) — the wing's FIRST electrochemistry bench (grep-confirmed hole; the 5 benches are balancer/limiting/titration/equilibrium/periodic). FORM you BUILD+read: two beakers + a salt bridge; DRAG a metal strip into each from a rack (Zn·Cu·Ag·Fe·Mg…) and a voltmeter needle swings to the cell EMF, electrons animate from anode through the wire. Surprise: the voltage is just the DIFFERENCE of two fixed rack numbers (standard reduction potentials) — swap the beakers and the needle flips sign but keeps size; play to rank every metal into one ladder. A concentration dial tilts it by the Nernst slope. CRUX (galvanic-cell/core.mjs + Node twin, inline byte-identical): E°cell===E°cathode−E°anode additive from the table to the bit for every pair; spontaneous IFF E°cell>0 (lower-potential metal forced to oxidize, sign matches); Nernst E=E°cell−(RT/nF)ln Q reduces to E===E°cell at 1 M (Q===1) to <1e-9; electrons balance, charge conserved. NEG-CONTROL (RED): same-metal-both-sides → E°cell===0 exactly, needle dead — it's the DIFFERENCE, not either metal, that drives the cell. Standard potentials are GIVEN data (like the Pinhole Race's true masses); the proof is the algebra. Nests under alchemy/, fills an idle planter, NOT a new front-door room. (sown #214)
<!-- ✝ DECAYED #214: The Two Games That Decide by a Hidden Number · after b51bea6 -->
<!-- ✝ DECAYED #214: The Living Grove trail — gather the estate's scattered living rooms · after b51bea6 -->
<!-- ✝ DECAYED #214: The Cart That Won't Be Pushed · after b51bea6 -->
<!-- ✝ BLOOMED #215: The Brass Whirligig — the current that pushes back → lodestone-hall/the-whirligig/ · after 17801db -->
<!-- ✝ BLOOMED #217: The Poisoned Bar — the win nobody can show you → chomp/ · after aef2280 -->
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
