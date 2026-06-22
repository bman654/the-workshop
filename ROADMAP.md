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
<!-- ✝ FIXED #276: The front door's engraved DISTRICT zone-caption (e.g. "THE MANOR HOUSE"… → index.src.html (the LOUPE ZONE_LABEL.forEach op… · after ab7ad4a -->
<!-- ✝ FIXED #277: The front door's bottom-left NAV PLATEBAR covers the footer project lin… → index.html (front door) · after 2691595 -->
<!-- ✝ FIXED #278: The front door's POI hover state machine drops the info card when you m… → index.html · after 37e55e8 -->
<!-- ✝ FIXED #281: The front door's POI hover dies across a whole region after you view a… → index.html (.card-inner pointer-events scoped t… · after 23a301d -->
<!-- ✝ FIXED #283: The front door's WEST GROUNDS renders three plates stacked on one lot —… → tools/layout/layout.js · after e703d83 -->
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
- [metagame] **The Cartouche — a passport you stamp by carrying one room's proven OUTPUT into another room as its legal MOVE** — the estate has ONE metagame (the Undercroft: passive `ws:` crumbs → unlock → trophies); this is a SECOND, ORTHOGONAL axis that threads rooms by their MATH, not by visitation. FORM: a brass-cornered traveler's PASSPORT (a carried artifact, not a wall chart) whose spread shows a CIRCUIT of room-stamps; a wax SEAL you drag from a room you've just operated to the next room whose required input TYPE matches the output you hold — operate the Euclid Engine → the seal carries {type:gcd,value:g} → only gcd-accepting rooms (Cutting Gears, Spirograph) light up → carry it, they CONSUME the value to seat their dial → continue until the seal returns to origin and the cartouche SEALS. Won by closing a type-matched CIRCUIT, not by visiting all rooms. FOOTPRINT: a NEW metagame surface — one top-level page cartouche/index.html + a tiny tools/ws/courier.js (the new `ws:carry:*` channel + a room→{accepts,emits} registry), NOT a wing landing and NOT the Undercroft (never reads ws:seen, stays bonus-not-blocker); the build wires EXACTLY ONE closed loop (gcd→ratio→gcd) to prove the surface, the rest grow as garden benches. CRUX (cartouche/core.mjs SOLE authority + Node twin, split): a typed directed graph (edge A→B iff A.emits∩B.accepts≠∅); a stamp is LEGAL ⟺ such an edge exists AND the value passes B's guard; SEALS ⟺ the stamped walk is a CLOSED cycle with type-continuity at every hop (start===end value, an algebraic identity for the gcd→ratio→gcd loop). NEG-CONTROLS that fire: wrong-type stamp rejected (no edge); right-type/failed-guard rejected; a non-returning walk never seals; a free-stamp foil provably fails the twin's edge-check. (sown #279 · contest #25)
- [medium] **The Camera Maze — a 3-D word you fly THROUGH until depth itself spells it** — a grounds medium where flying a camera down a corridor of glyph-shards IS the content — DISTINCT from the built Vantage (vantage/ #151, `vantages` = "scenes you ORBIT from outside"). ~60 gilt 3-D tics hang along a depth-runway as nonsense from every doorway; from the ONE earned 6-DOF pose — yaw, pitch, AND the ROLL the Vantage REFUSED (core.mjs: "THREE DOFs, NOT FOUR… no roll"), plus a dolly carrying you INTO the field not around it — they stack into a legible word, each letter from shards at a DIFFERENT depth so the read coheres only mid-flight. FORM: a touchable fly-through (drag-orbit + scroll-dolly + a roll handle) you steer until it LOCKS, the field warming on an undisplayed per-axis closeness as the Vantage does. FOOTPRINT: NEW top-level room (camera-maze/), own POI/star + a new WING_META slug ("SCENES YOU MOVE THROUGH"), kin to but DISTINCT from `vantages`, in the observatory. CRUX (camera-maze/core.mjs SOLE camera authority + headless Node twin, split each): forward-construct a FULL 6-DOF pose incl. roll — back-project each glyph vertex along per-vertex depth through the exact inverse of a 3-rotation+dolly π so r(C*)=Σ‖π−T‖² is an algebraic identity <1e-9. Roll PROVEN load-bearing: perturb roll alone ⇒ r exceeds a per-axis τ with ≥2× margin (the claim the Vantage CANNOT make); a roll-frozen control never reaches r<τ for a roll-built target. NEG-CONTROL: a random shard cloud never locks (best r over a dense 6-DOF grid ≫ τ); a depth-collapse foil flattening shards to one plane FAILS to spell. (sown #253 · contest #23)
<!-- ✝ BLOOMED #252: The Bootstrap Bench — the wave that carries itself (E makes B makes E) → bootstrap-bench/ · after 753b7e4 -->
<!-- ✝ BLOOMED #262: More Than One Front Door — the estate splits into DISTRICT plates you t… → index.html (front door) · tools/layout/ · after ca0921f -->
<!-- ✝ DECAYED #264: The Loaded Dice Foundry — an arbitrary distribution forged into one tou… · after c14029d -->
<!-- ✝ BLOOMED #274: The Drawing Room — a wing gathering the COMPUTE-BY-DRAWING engines, fou… → the-drawing-room/ · after 089f9eb -->
<!-- ✝ BLOOMED #284: The Construction Bench — a figure you BUILD with straightedge & compass… → construction-bench/ · after 79c8306 -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Birthday Bench** — seat guests on a long oak bench ONE by one; each hangs their birthday-tag on 1 of 365 brass pegs, and the pegboard CLANGS a match at ~23 guests, far sooner than any gut says. A "fill the bench" lever reseats a fresh party so you feel the ~23 land again; a worn dial changes the year-length and the clash-count tracks √(pegs). The whole payload is the SURPRISE of how few chairs — which a P-vs-n plot murders. Re-soul guard: readout stays PHYSICAL (chairs used, the peg that rang); NO probability curve; the √d dial is the one allowed mini-readout and stays a brass COUNT. Optional crux (birthday/core.mjs + twin): exact product gives P(clash@23)=0.5073>½, P@22=0.4757<½; d=1 neg-control clashes at n=2. (sown #280)
- [exhibit] **The Vowel Throat** — a constant toneless larynx-buzz (a rich sawtooth glottal source) runs; drag two brass FORMANT sliders across a vowel chart and HEAR "ah… ee… oo… oh" emerge — pure SUBTRACTIVE synthesis, resonant filters CARVING the voice out of the source (no sample). FORM: a touchable formant-space pad you move a glowing dot through, vowels as labelled territories, two filter-hills riding the buzz's comb. The sound-garden's named-missing synthesis family (grep-confirmed: the whole vein is ADDITIVE — Overtone Rack/Sidebands/Comma) and the Overtone Rack's additive↔subtractive MIRROR-twin; reuse instruments.js + ▶ gate + limiter and link reciprocally. Owes no proof; optional silent crux — rendered two peaks within X% of published F1/F2 (OfflineAudioContext + audio-lens, the Lattice/Carillon pattern). (sown #280)
- [exhibit] **The Marbling Bath** — a tank of still water; drop concentric ink rings (suminagashi), then drag a comb/stylus through and the ink SWIRLS along your stroke into the feathered patterns of marbled endpapers; pull a rake for the classic combed waves, then "lift the paper" to freeze your one-of-a-kind print to keep. FORM: a pure touchable fluid-art instrument (light passive-ink advection field, NO physics claim) — a SEEN-as-art piece for the most beautiful empty quarter on the map; owes no proof. Grep-confirmed absent (strange-garden has reaction-diffusion/flow-field/Truchet/Penrose/Voronoi but NOTHING in the suminagashi/ebru lineage; the only "marbl" hits are CSS textures). Re-soul guard: rings-THEN-rake (not finger-paint) + the save-your-print keepsake are primary; keep the grid modest (laptop health). (sown #280)
- [exhibit] **Snell's Window** — a fish looking straight up sees the ENTIRE sky — horizon to horizon — squeezed into one bright circle overhead; outside that disk the water is a mirror of the dark bottom. A touchable pond you dive beneath: drag your gaze and the whole world above compresses into the shrinking porthole. FORM: a turnable underwater view, not a ray diagram. CLAIM: above water bends in by Snell's law, so the 180° sky maps into a cone of half-angle θ_c = asin(1/n) ≈ 48.6° (a 97.2° window) for n=1.33; beyond θ_c it is total internal reflection. Grows the optics/waves vein; the same critical angle Hall of Mirrors proves exact. (sown #267)





### cross
- [cross] **Two Costumes, One Sine** — threads lodestone-hall/the-lc-tank (ω=1/√(LC)) + swing-ship's FIXED-length small-angle pendulum (ω=√(g/L)). One shared idea: the free harmonic oscillator — charge-slosh and angle-rock are the SAME ODE (the lc-tank source already writes L·q''+q/C=0 ⇔ x''+ω²x=0). FORM (touchable, not a curve): a DUAL OSCILLOSCOPE where q(t) and θ(t) overlap pixel-for-pixel at matched ω, with a matched-tuning slider that locks √(g/L) onto 1/√(LC). Equivalence the self-test proves (core.mjs + twin): both integrators agree <1e-9 over a full period at matched ω; a DAMPED (RLC/air-drag) neg-control provably DIVERGES (>1e-4) so a conserved-energy classifier passes the free pair, fails the damped one. Pin the FIXED-length linear leg (not swing-ship's pumping term); keep it a 2-body cross (no clean Hooke-spring room); reciprocate ↗ links lc-tank↔swing-ship↔resonance(driven cousin)↔this cross. (sown #280)
- [cross] **Every Game Is Secretly Nim** — the Numbers Room already plays Nim, Chomp, and the matchbox Hexapawn as separate puzzles. Reveal they are ONE game: compute the Sprague–Grundy value (the mex of its moves) of any position and watch unrelated heaps collapse to a single NIMBER — the number that tells you instantly who wins. FORM: a playable board where each position lights its Grundy value and a "best move" zeroes the XOR. CLAIM: every impartial game equals a Nim-heap of its Grundy value; a position is lost exactly when the XOR of the heaps' nimbers is 0. (sown #267)


### curation
- [curation] **Where Waves Cancel** — pure reciprocal ↗ sibling links across interferometer + diffraction (optical) ↔ ripple + loud-and-quiet + singing-plate (water/sound nodes & antinodes). One shared idea: a path/phase difference of half a wavelength makes two waves CANCEL — the dark fringe IS the silent nodal line; one superposition law wearing light, water, and sound. Owes no proof. Grep-confirmed gap (all 5 rooms exist): interferometer & diffraction link ONLY to the hall-of-mirrors hub, zero hrefs to each other or the wave-cousins; the water/sound trio is linked among itself but not to the optical pair. Frame the gloss as "path difference sets where waves agree/cancel" so it's exact for diffraction's bright mλ orders too; title singing-plate's link as 2-D standing-wave/superposition kin (looser than the 1-D path pair). Verify every new href resolves 200 AND reciprocates. (sown #280)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Squaring Clock** (Numbers Room) — a p-position brass clock you OPERATE: drag any bead, square it (x² mod p) and a chord SNAPS to where it lands; sweep all p−1 beads and exactly (p−1)/2 targets light gold (the residues), the rest stay dark forever — every residue hit by EXACTLY TWO sources (x and p−x fold together as the two √ roots). A √ tool flares a lit position's two roots; a dark one shakes "no root here." Grep-confirmed novel (prime-spiral's "legendre"/"quadratic" are POLYNOMIAL labels, not residues; distinct from squaring-yard's FIGURATE 1+3+5=n² — disambiguate the near-name). Self-test (core.mjs + twin): over odd primes p≤97, |{x²}|=(p−1)/2 with 2 preimages each, Euler's criterion a^((p−1)/2)≡±1 matches the lit set; NEG-CONTROL composite (15) breaks the clean half-split. Rhymes with The Clock That Closes — a planter should space them, not cluster. (sown #280)
- [bench] **The Clock That Closes** (Numbers Room) — pick a generator g and prime p, then TAP to step (current ← current·g mod p); a glowing hand walks g, g², g³… leaving a lit trail until it SNAPS back to 1 and the cycle closes — the trail length IS the multiplicative ORDER of g. Some g sweep ALL p−1 positions (primitive roots, the "full hands"), others close on a short sub-cycle; a brass collar reads the order. DISTINCT from the cardioid cipher wheel (additive x→k·x string art, drawn ONCE) — this is the ORBIT of REPEATED multiplication closing on itself; lean hard on the walking hand that snaps to 1 so it doesn't read as a residue wheel. Self-test (core.mjs + twin): ord_p(g) | p−1 (Lagrange) and Σ[ord=p−1]=φ(p−1) over primes p≤97; NEG-CONTROL g sharing a factor with a composite never returns to 1. Rhymes with The Squaring Clock — sow both, build apart. (sown #280)
<!-- ✝ DECAYED #270: The interference-as-colour triangle · after 69593c4 -->
<!-- ✝ DECAYED #280: The Wavefront That Bends — refraction by Huygens wavelets · after 9a2dd94 -->
<!-- ✝ DECAYED #280: The Cardioid Drawn Three Ways · after 9a2dd94 -->
<!-- ✝ DECAYED #280: The Roulette Family & the Caustic Kinship — ↗ links across two orphaned… · after 9a2dd94 -->
<!-- ✝ BLOOMED #282: The Sultan's Suitors → sultans-suitors/ · after ef6a858 -->
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
