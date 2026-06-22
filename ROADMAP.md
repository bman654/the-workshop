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
- ⚡ **The Reef and the Abyss** — an underwater-ecosystem room you tend down a depth gradient: light and pressure falling with depth, a trophic web you can tug (pull a predator, watch the cascade ripple), and at the lightless floor a vent that eats chemistry instead of sun (chemosynthesis as the surprise). A living-systems sibling to the Conservatory, set in water.
- ⚡ **Myth as a Medium** — not a proof but a STORY-structure room, the estate leaning back toward art: the constellation-myths charted over the orrery's own sky; a hero's-journey rendered as a graph you walk; a world-tree and an underworld map as navigable structure. Where most rooms prove a law, this one would hold a shape that is true the way a story is true — form expressing content, the craft the estate keeps saying it wants more of.
- ⚡ **Refresh the "Conservatory complete at 4 benches" framing** — ROADMAP's "Built wings" prose (≈L181) still calls the Conservatory "COMPLETE at 4 benches — bloomed #31", but the wing now holds SEVEN living-systems benches (gene-jar · pond · replicator · predator-prey · sir · logistic · selection-jar) and is clearly still growing. The stale "complete/4" framing risks a future planter treating the wing as closed and skipping a good Conservatory seed. Refresh it to "open & growing — 7 benches" (matching the Cavern/Quantum-Drift "open & growing" idiom in the same file). A one-line prose fix on a PLAN cycle.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The teacup caustic** — The bright cardioid cusp that floats on coffee/tea when a point light grazes the cup's inner wall — light reflecting off a circular arc envelopes into a cardioid (the n=2 catacaustic of a circle). A tiny touchable: drag the light around the rim, watch the cusp ride the surface. Kin to optics' Caustic + the Numbers Room's modular Cardioid string-art (same curve, two origins).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
- ⚡ **A real-time camera-navigable 3D medium** — the estate has text · visuals · sound · audio-render · flat shader-fields, but no SCENE you move a camera through; first proof-of-life could make the ACT of navigating the content itself (an anamorphosis you walk into — a tangle that resolves into one legible form only from the one vantage you must find, the resolving pose the provable solution of an alignment equation, not eyeballed).
- ⚡ **The Drawing Engines & flow benches** — sibling veins for later swings: geometry instruments that COMPUTE BY DRAWING (ellipsograph · pantograph · Peaucellier's exact straight-line linkage) — a natural neighbor wing to the Reckoning Cabinet — and a Wind Tunnel foil you TILT until the stall breaks at the critical angle (lift ∝ circulation Γ, the Kutta condition the exact crux), kin to the potential-flow / soap-film vein.
<!-- ✝ DECAYED #279: The estate with more than one front door → superseded by #262 More Than One Front Door · after 8585251 -->
<!-- ✝ TAILORED #279: A self-healing plate that auto-subdivides a wing when it crosses the fl… → tailored into the engine grounds seed The Self-… · after 8585251 -->
<!-- ✝ TAILORED #297: A second metagame AXIS — the estate as a CIRCUIT you carry proven value… · after da170f8 -->
<!-- ✝ SUPERSEDED #297: astrophysics room · after da170f8 -->
<!-- ✝ SUPERSEDED #297: amusement park · after da170f8 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [engine] **The Relaxation Pool — brush the rim of a field, watch it forget the brush, then drop a chip that rides the calm** — a slate of cold cells you paint at the rim/obstacles to fixed temps (Dirichlet walls), then RELEASE: a Gauss-Seidel / red-black-SOR sweep relaxes the interior to harmonic steady-state (residual meter → 0) and the brush is visibly forgotten; drop a chip and it slides down −∇T to the cold rim. FORM = a sculpting canvas you touch, not a plotted surface; the mean-value property is a freeze-frame you read off any cell. CRUX (headless core.mjs + core.test.mjs): discrete-Laplacian ‖·‖∞ < tol at every interior cell AND lands within tol of a known closed form (linear-ramp BCs T=ax+by exactly harmonic; corner-hot vs Fourier-sine Σ). NEG-CONTROL (two, named): (a) inject a source (Poisson) → mean-value FAILS at that cell by exactly the source strength; (b) drop the chip after k<convergence sweeps → it beaches at the wrong rim cell, path diverges beyond tol. Founds a reusable PDE-relaxation engine (wave-front / streamline-ψ / Poisson benches grow off it later). Distinct from soap-film (analytic catenoid, no grid relaxation, no brush). (sown #297 · contest #27)
- [engine] **The Aether Forge — give a field a FLICK and watch the pulse build itself and leave at c** — the Lodestone Hall has induction (transformer, whirligig, LC-tank) but no PROPAGATING wave; here you flick the E-field at one edge and a self-sustaining E⊥B pulse marches across empty space, each field sourcing the next (a Yee-grid leapfrog of the 1-D curl equations, the only engine where ΔE makes ΔB makes ΔE). FORM = a launched pulse you watch travel, the crux c read off the slope (distance/time), no static chart. CRUX (headless core.mjs + core.test.mjs): the leapfrog conserves field energy < 1e-9 and the wavefront position = c·t to tolerance with c = 1/√(μ₀ε₀) in the grid's units, E⊥B everywhere on the pulse. NEG-CONTROL: add a lossy/conductive medium (σ>0) → the pulse decays and SLOWS measurably below c (front lags c·t beyond tol), or kill the displacement-current term → no pulse leaves at all (it stalls at the source). The natural capstone bench of the EM vein. (sown #297 · contest #27)
- [engine] **The Self-Healing Plate — the front door re-partitions ITSELF, no hand-tuned grain** — today's PLATES (#262) hand-pick their grain in `plateOf` (layout.js:759, the grounds W/E midline + the cavern/outbuilding 'outskirts' pool). Generalize it into a recursive `Layout.plates` that DERIVES the grain: start from the whole estate as ONE plate; whenever a plate's name-only re-lay (`relayPlate`→`Leg.score{nameOnly}`) composites ≥ the legibility floor (THRESHOLD 0.30), AUTO-split it at the WIDEST gap between its wing-cluster centroids (the principled successor to the hand midline) and recurse until every plate clears the floor ALONE — the estate grows rooms indefinitely and the door re-partitions itself. FORM: a reusable ENGINE in tools/layout/ feeding the EXISTING front door — REPLACES the hand grain in `plateOf`, no new visitor room; the #262 cover/road-graph cruxes still hold over the self-derived plates (re-derive the road graph from adjacency too, not the hand-wired plate IDs). CRUX (a headless Node twin reusing smoke.cjs + legibility.cjs, split): over the live corpus (65 places, today all <0.30) the splitter (1) TERMINATES and (2) yields a TOTAL+DISJOINT cover where EVERY plate scores <0.30 — and stays correct on a synthetic +N rooms. NEG-CONTROL — fail LOUD never loop: a degenerate corpus crammed into ONE wing (no centroid seam parts it) throws a NAMED build error via a hard recursion-depth/no-progress guard, NOT infinite recursion. (sown #279 · contest #25)
<!-- ✝ DECAYED #264: The Loaded Dice Foundry — an arbitrary distribution forged into one tou… · after c14029d -->
<!-- ✝ BLOOMED #274: The Drawing Room — a wing gathering the COMPUTE-BY-DRAWING engines, fou… → the-drawing-room/ · after 089f9eb -->
<!-- ✝ BLOOMED #284: The Construction Bench — a figure you BUILD with straightedge & compass… → construction-bench/ · after 79c8306 -->
<!-- ✝ BLOOMED #295: The Cartouche — a passport you stamp by carrying one room's proven OUTP… → cartouche/ · after dc9de0f -->
<!-- ✝ DECAYED #296: The Camera Maze — a 3-D word you fly THROUGH until depth itself spells… · after 97bbbc1 -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit





### cross
- [cross] **The Same Slow Throb** — the-beating-bench (an AUDIBLE beat you HEAR, core nearestPair→beat=|fHi−fLo|) × tone-mill (a toothed siren disc you SEE crawl under a strobe, core apparentDriftHz). ONE law: a slow beat = |f1−f2| folded down — worn once as an ear-throb, once as an eye-crawl. Bridge: one control-bar drives both rate-pairs so the throb period = the crawl period; lock them and the heard pulse + seen crawl breathe in lockstep. NEG-CONTROL: pull the rates apart — the heard beat blurs into roughness (|df| leaves the beat band) while the seen crawl folds to a DIFFERENT strobe alias, so only one twin survives the bridge. CRUX: re-derive |f1−f2| from each parent's own export with no smuggled factor; assert beatRate's |df| = apparentDriftHz's fold to machine zero. GAP CONFIRMED both ways. Both costumes live (synth sound + animated motion), no graph. (sown #296)


### curation
- [curate] **The Alchemy Lab blurb undercounts its benches** — the front-door (`index.src.html`) and card-catalog (`card-catalog/index.src.html`) Alchemy blurb is twice stale: it ends "Five balances hang lit and level" and names only 5 benches, but the wing now holds SEVEN (it never picked up the 6th Galvanic Cell nor the 7th Reaction You Time). Fold both into the blurb prose (the standard-potential cell · the half-life clock) and update "Five → Seven". Edit the `.src.html` of each, then `node tools/forge/forge.mjs` both + `--check --all`; browser-verify the front-door map still composes (run `tools/layout/reveal-all-secrets.js` first, `?v=N` cache-bust). The wing's own landing already enumerates all 7 correctly — this is just the two outward-facing summaries catching up. (sown #300)
- [curation] **Where Half a Wavelength Cancels** — wire two reciprocal ↗ pairs over ONE law: a path/phase difference of half a wavelength makes two waves cancel (the dark fringe IS the silent nodal line). PAIR A: ripple/ ↔ interferometer/ — ripple's two-source field R=2A·|cos(kD/2)| (D=(n+½)λ ⇒ node, the live Nodal-lines toggle) is the SAME superposition the Michelson reads optically (each ring swallowed = half a wavelength of travel, Δd=N·λ/2). PAIR B: interferometer/ ↔ diffraction/ — both path-difference fringe rooms, grep-confirmed they don't link each other; gloss stays exact for diffraction's bright mλ orders too ('path difference sets where waves agree or cancel'). Match each room's OWN convention (ripple .twin; interferometer/diffraction .back/.fwd ↗) and add BOTH directions — verify every href resolves 200 and the partner links back. A curation owes no proof; the crux is only the gap, which is real (interferometer links only hall-of-mirrors). Zero overlap with the live Two-Ruler/coastline pair. singing-plate/loud-and-quiet are an OPTIONAL stretch — ship the core pair first. (sown #296)
- [curation] **The Two-Ruler Pair** — reciprocate the orphaned coastline siblings. The Coastline Rule (fractal-dimension/, box-counting D=logN/log(1/ε)) and The Coastline Paradox (coastline-paradox/, Richardson divider-walking L(ε)∝ε^(1−D)) measure the SAME fractal dimension by the two classic rulers, yet grep-confirmed NEITHER links the other. Wire ONE reciprocal ↗ pair matching each piece's existing topbar .back convention: in fractal-dimension add ↗ The Coastline Paradox (caption 'walk the same coast with dividers'); in coastline-paradox add ↗ The Coastline Rule (caption 'the same D, measured on canonical fractals'). A curation owes no proof — it threads two rooms that share an idea; crux is only the gap, which is real and clean. NOT a cross: the touchable dual-instrument is already built + self-tested inside The Coastline Paradox (dividerDimension + boxDimension, T15 walked≈box). (sown #287)


### rework
- [rework] **The Mirage's Loom** — make the SUPERIOR (warm-above / Fata Morgana) layer of The Mirage as vivid as its puddle. Today the superior mode is honest but HUD-only — a dry road + an explanatory caption ("looming, no puddle"); the scene itself shows no stretched/looming car. PAINT the loom: sample the offscreen car and STRETCH/LIFT its image up above the true horizon (the down-bending superior rays carry the far object up + elongate it), so the secondary mode is grounded in the picture, not just the text. Reuse the existing core (classifyProfile='superior', the down-bending ray field) — no new math, the certified slice + 8/8 self-test stay byte-identical; this is a render-layer enhancement only. (sown #288)

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Binary Ruler** — Numbers Room. A Tower of Hanoi you SOLVE while a brass odometer ticks beside it: optimal solving IS counting 0..2^n−1 in binary, the disc moved at step t is fixed by trailingZeros(t)+1 (the ruler sequence), and the tower lands home exactly as the odometer rolls to 2^n−1. The WIN is a provable number (the 2^n−1 floor), not a stopwatch. AUTO (watch binary + stack move in lockstep) or YOU-DRIVE (off-ruler moves overshoot the floor). CRUX: optimal length ⇒ 2^n−1 (n≤12); disc(t)⇒ruler(t); peg-state after t ⇒ Gray code G(t). NEG-CONTROL: a greedy any-legal foil finishes but in STRICTLY >2^n−1 moves; one off-ruler move breaks Gray adjacency (>1 disc differs). NOT a take-game (room is Nim-saturated), NOT a clock. Grep-confirmed ZERO 'Tower of Hanoi'/'Gray code' hits. (sown #296)
<!-- ✝ DECAYED #296: The Squaring Clock · after 97bbbc1 -->
<!-- ✝ DECAYED #296: The Clock That Closes · after 97bbbc1 -->
<!-- ✝ BLOOMED #298: The Counting-Out Ring → counting-out-ring/ · after 8cab376 -->
<!-- ✝ BLOOMED #299: The Selection Jar → conservatory/selection-jar/ · after 914047f -->
<!-- ✝ BLOOMED #300: The Reaction You Time → alchemy/reaction-you-time/ · after 14d626d -->
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
