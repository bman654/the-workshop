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
<!-- ✝ FIXED #230: Wing captions must become visible BEFORE room labels — a wing is a high… · after ed9fcb5 -->
<!-- ✝ FIXED #230: Wing captions should NOT scale with zoom either — same defect as the di… · after ed9fcb5 -->
<!-- ✝ FIXED #230: Room labeling is broken: the loupe is centred on the TOTAL map extent,… · after ed9fcb5 -->
<!-- ✝ FIXED #230: A room detail popup with a lot of content grows past the viewport and g… · after ed9fcb5 -->
<!-- ✝ FIXED #231: The Last Line and Tiltyard tiles in the Arcade room show no preview ima… → arcade/assets/thumbs/ · after 573351a -->
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
- ⚡ **A self-healing plate that auto-subdivides a wing when it crosses the floor** — the front-door PLATES partition (#262) hand-picks its grain (district, grounds split W/E, outskirts pool). Generalize it: a Layout.plates that, when ANY plate's name-only re-lay composites ≥ the legibility floor, AUTOMATICALLY splits that plate along its widest wing-cluster seam and re-tests — recursing until every plate clears the floor ALONE, no hand-tuned grain. The estate could then grow rooms indefinitely and the door would re-partition itself, the camera-walk always landing on a legible plate. (The exact generalization of crux #2's "subdivide wherever a district-alone fails.")
- ⚡ **The teacup caustic** — The bright cardioid cusp that floats on coffee/tea when a point light grazes the cup's inner wall — light reflecting off a circular arc envelopes into a cardioid (the n=2 catacaustic of a circle). A tiny touchable: drag the light around the rim, watch the cusp ride the surface. Kin to optics' Caustic + the Numbers Room's modular Cardioid string-art (same curve, two origins).
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
- [medium] **The Camera Maze — a 3-D word you fly THROUGH until depth itself spells it** — a grounds medium where flying a camera down a corridor of glyph-shards IS the content — DISTINCT from the built Vantage (vantage/ #151, `vantages` = "scenes you ORBIT from outside"). ~60 gilt 3-D tics hang along a depth-runway as nonsense from every doorway; from the ONE earned 6-DOF pose — yaw, pitch, AND the ROLL the Vantage REFUSED (core.mjs: "THREE DOFs, NOT FOUR… no roll"), plus a dolly carrying you INTO the field not around it — they stack into a legible word, each letter from shards at a DIFFERENT depth so the read coheres only mid-flight. FORM: a touchable fly-through (drag-orbit + scroll-dolly + a roll handle) you steer until it LOCKS, the field warming on an undisplayed per-axis closeness as the Vantage does. FOOTPRINT: NEW top-level room (camera-maze/), own POI/star + a new WING_META slug ("SCENES YOU MOVE THROUGH"), kin to but DISTINCT from `vantages`, in the observatory. CRUX (camera-maze/core.mjs SOLE camera authority + headless Node twin, split each): forward-construct a FULL 6-DOF pose incl. roll — back-project each glyph vertex along per-vertex depth through the exact inverse of a 3-rotation+dolly π so r(C*)=Σ‖π−T‖² is an algebraic identity <1e-9. Roll PROVEN load-bearing: perturb roll alone ⇒ r exceeds a per-axis τ with ≥2× margin (the claim the Vantage CANNOT make); a roll-frozen control never reaches r<τ for a roll-built target. NEG-CONTROL: a random shard cloud never locks (best r over a dense 6-DOF grid ≫ τ); a depth-collapse foil flattening shards to one plane FAILS to spell. (sown #253 · contest #23)
- [wing] **The Drawing Room — a wing gathering the COMPUTE-BY-DRAWING engines, founded on a Pantograph done right** — the instruments that draw an answer are a SCATTERED VEIN (trammel/ellipsograph #173 · linkage/Straightedge · spirograph), as the measuring tools were before the Reckoning Cabinet gathered them. The grounds GAP is WING-as-gathering + ONE new bench — NOT a rebuild (ellipsograph & Peaucellier already exist). The hero THE PANTOGRAPH is an estate-correction: linkage/SPEC.md DROPPED it ("collapses to a degenerate rod") — wrong; it conflated the collinearity THEOREM with the open-parallelogram FORM. A real Scheiner four-bar pins fulcrum O, tracer T rides one bar, pen P the far corner; drag T over a faint master figure and P draws a perfect scaled copy — an affine map computed by brass, bars never collinear. FORM (the wing's verb = SCALE): GRAB T, the open linkage flexes, P lays the enlarged twin live; a ratio-collar sets s=2/3/½, swap T↔P → the inverse. CRUX (core.mjs SOLE pantograph authority + Node twin, split each): (1) area(O,T,P)≡0 to <1e-12 over the sweep (closed-form, no iteration); (2) |OP|/|OT|≡s AND the locus equals P=O+s·(T−O) to <1e-12; (3) all four bar-lengths hold to machine-ε (a REAL linkage — exposes the old "rod" claim false). NEG-CONTROL: perturb ONE short bar off-parallelogram → collinearity bows off zero and the copy SHEARS — the parallelogram, not the drawing, carries exactness. FOOTPRINT: top-level the-drawing-room/, own POI/star, grounds district, slug `drawing-engines`; the landing GATHERS the built engines onto one engraved rail (Reckoning's wiring), siblings Hart's inversor + a conchoidograph. (sown #253 · contest #23)
<!-- ✝ BLOOMED #232: The Card Catalog — every exhibit in the estate, found by the room you f… → card-catalog/ · after b03ed2c -->
<!-- ✝ BLOOMED #242: The First Light — the Big Bang as a patch of space you STRETCH → first-light/ · after af80b27 -->
<!-- ✝ BLOOMED #252: The Bootstrap Bench — the wave that carries itself (E makes B makes E) → bootstrap-bench/ · after 753b7e4 -->
<!-- ✝ BLOOMED #262: More Than One Front Door — the estate splits into DISTRICT plates you t… → index.html (front door) · tools/layout/ · after ca0921f -->
<!-- ✝ DECAYED #264: The Loaded Dice Foundry — an arbitrary distribution forged into one tou… · after c14029d -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Wavefront That Bends — refraction by Huygens wavelets** — A marching wave plane meets a tilted speed-change line; each front-cell is a tiny circular source and their ENVELOPE is the next front — the slow side's shorter wavelets tilt the envelope, so the front bends, exactly n₁sinθ₁=n₂sinθ₂. Drag the tilt/speed-ratio; the bend you SEE is wavelength compressing, no ray drawn. FORM: a wavefront you watch pivot. Crux: envelope-tangent angle = asin((v₂/v₁)sinθ₁) to <1e-9, and total internal reflection (no real envelope) exactly when sinθ₁>v₁/v₂. Grep-confirmed gap: refraction-run + lifeguards-run are least-time RAY toys; NO Huygens construction exists. Grows WAVES wing; reuses Ripple's circular-source core byte-identically. (sown #261)





### cross
- [cross] **The Cardioid Drawn Three Ways** — A touchable rolling-disk you crank — a coin rolls on an equal coin, its rim tracing a live cardioid r=2a(1+cosθ) — set beside the SAME curve as the times-table k=2 chord-envelope and as a point-source catacaustic on a circular mirror. FORM: touchable/crankable, not a graph. CLAIM: rolling-circle epicycloid == mod-m k=2 envelope == on-circle catacaustic — one curve. CRUX: sample all three at matched θ, align by cusp, max pointwise distance <1e-9. cardioid/core.mjs already proves envelope==epicycloid (<1e-12); this adds the literal rolling-disk leg (no room draws it) + the optical witness. Sited where the Numbers Room meets Optics. (sown #261)


### curation
- [curation] **The Roulette Family & the Caustic Kinship — ↗ links across two orphaned curve-clans** — Pure taste-work: reciprocal ↗ sibling links across rooms that share one physics and ZERO hrefs. The rolling/sum-of-circles clan — cardioid ↔ teacups ↔ spirograph ↔ tusi ↔ epicycles ↔ the new cardioid cross. The caustic clan — optics' Caustic ↔ rainbow (captioned 'caustic of minimum deviation') ↔ halo (computes a caustic), with cardioid as the hinge (it IS a catacaustic). Grep-confirmed: all eight rooms have ↗=0. Restores the 'rays/circles pile into a bright curve' thread. Owes NO proof; verify links resolve 200 + reciprocate. (sown #261)
- [curation] **The interference-as-colour triangle** — Three rooms compute the SAME physics — two/multi-beam interference of light made into colour (thin-film 2nt·cosθ′→CIE; The Bragg Stack; The Diffraction Grating, whose own lede is 'the shadow of light is a Fourier transform') — yet share zero hrefs; diffraction links its interference siblings but skips its colour cousins, and structural-colour is near-orphaned (links ONLY to hall-of-mirrors, MISSING its '← The Orrery Estate' front-door link — grep-confirmed). Add reciprocal ↗ links across all three and RESTORE structural-colour's front-door link. FORM: pure connective taste-work. CRUX: none — verify all links resolve 200 and reciprocate, and structural-colour regains its estate link. (Exclude soap-film: it's minimal-surfaces, not colour.) (sown #254)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
<!-- ✝ BLOOMED #264: The LC Tank — charge and current trading places forever → lodestone-hall/the-lc-tank/ · after c14029d -->
<!-- ✝ DECAYED #264: The Octave Ladder Your Ear Climbs Wrong — pitch is log-frequency · after c14029d -->
<!-- ✝ DECAYED #264: Where the Light Folds — the Caustic room and the Rainbow are the same f… · after c14029d -->
<!-- ✝ BLOOMED #265: The Game That Cannot Tie — Hex, where someone always wins → hex/ · after 5418f0a -->
<!-- ✝ BLOOMED #266: The Sky That Was Once Fog — the CMB as an all-sky map you stand inside → last-scattering/ · after 149a09c -->
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
