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
- [engine] **The Loaded Dice Foundry — an arbitrary distribution forged into one touchable machine you ROLL** — a grounds engine that pours ANY discrete distribution into a single touchable machine. FORM past a graph: set N target weights on a row of sliders (a loaded die, a letter-frequency, anything) and the foundry FORGES Walker's alias table — a rack of N vials each split by a poured threshold into a 'main' and an 'alias' fraction, the pour visible; then you ROLL: one uniform bin-pick + one coin-flip against its threshold yields a sample in O(1), and a live histogram fills to match your sliders. The poured rack IS the proof; you roll the machine, you don't read a PMF. FOOTPRINT: new top-level room (foundry/) with its own POI/star, grounds district, 'works' wing (kin to the Engine Room / Benford Mill), founding a 'sampling' wing slug whose promised siblings are a Box-Muller Gaussian forge and a rejection-sampling dartboard. CRUX (foundry/core.mjs the SOLE alias authority + Node twin): the table reproduces the target PMF EXACTLY (Σ of each outcome's contributions === its weight, <1e-12) AND every bin's two fractions sum to exactly 1 AND a fixed-seed 1e6-roll histogram sits inside a never-claimed-as-proof ±3√N band AND sampling is provably O(1) (constant lookups, not a linear scan) — split each claim. NEG-CONTROL: corrupt ONE bin's threshold and only that pair of outcomes drifts off-target while the rest stay exact — proving the alias SPLIT, not the histogram, carries the distribution; an O(N) linear-scan-CDF foil computes the same samples but the room contrasts its cost against the O(1) machine. (sown #222 · contest #20)
- [wing] **The Bootstrap Bench — the wave that carries itself (E makes B makes E)** — Tailors the ⚡ 'the wave that carries itself' spark into the EM vein's capstone, the bench the Lodestone Hall (#211 induction) was founding toward. FORM is a long open run of FREE SPACE — no wires, no medium, just a field you can FLICK: grab the electric field at the left edge and snap it once (a vertical kick), and watch a self-sustaining E⊥B pulse PEEL OFF and propagate rightward on its own, the changing E sourcing a transverse B that sources E ahead of it — Maxwell's bootstrap made seen-and-touchable. The two fields ride together as orthogonal ribbons (E up-down, B in-out drawn in depth) locked a quarter-step in lockstep; the pulse keeps its shape and rolls at one fixed speed with NOTHING pushing it. A speed gate clocks the leading edge across two posts; a μ₀/ε₀ dial-pair (the vacuum's two constants, the only knobs) and the crux read off the SLOPE: c = 1/√(μ₀ε₀). FOOTPRINT: a new top-level room (bootstrap-bench/) with its own POI/star + district/wing slot, the EM vein's third room (Lodestone Hall · iron-filings · this), seeding a 'Fields & Waves' capstone group; a reciprocal cross-link back to lodestone-hall. CRUX (bootstrap-bench/core.mjs the SOLE 1-D FDTD/Yee authority + Node twin): the leapfrog update of E,B on a staggered grid CONSERVES field energy on a closed run to <1e-9 and the measured front speed EQUALS 1/√(μ₀ε₀) to the grid's CFL tolerance over a sweep of both constants (split the claim — energy identity to <1e-9, propagation speed to the discretization bound); a single flick launches ONE right-moving pulse that holds its L2 shape to the absorbing edge; doubling ε₀ scales c by exactly 1/√2. NEG-CONTROL: a 'freeze the curl' toggle zeroes the ∂B/∂t→E feedback leg — the pulse STOPS bootstrapping and collapses in place (no propagation), proving it is the MUTUAL E↔B coupling, not a pre-scripted travelling shape, that carries the wave; a second cheat sets c>1/√(μ₀ε₀) by hand and the CFL/energy check fires RED (you cannot outrun the vacuum). (sown #213 · contest #19)
<!-- ✝ BLOOMED #201: The Refraction Run — the light-path you have to FLY → refraction-run/ · after 55a4a71 -->
<!-- ✝ BLOOMED #211: The Lodestone Hall — the current you make by MOVING → lodestone-hall/ · after 9f97eff -->
<!-- ✝ BLOOMED #221: The Tone Mill — the pitch you HEAR is the rate you WATCH → tone-mill/ · after 40f3f76 -->
<!-- ✝ BLOOMED #232: The Card Catalog — every exhibit in the estate, found by the room you f… → card-catalog/ · after b03ed2c -->
<!-- ✝ BLOOMED #242: The First Light — the Big Bang as a patch of space you STRETCH → first-light/ · after af80b27 -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Octave Ladder Your Ear Climbs Wrong — pitch is log-frequency** — WING: sound-garden bench. One slider in linear Hz, one in perceived pitch. Go up an octave by EAR (click — rungs you HEAR as equal) vs by adding a fixed 100 Hz (click — steps that shrink to nothing up high); the two rulers visibly diverge as the Hz between by-ear octaves DOUBLES each rung. FORM: two draggable rulers you PLAY against each other — keep the clicks genuinely sounded, not just drawn (its weakest grounded axis). CRUX: equal pitch = equal frequency RATIO not difference; an octave is f→2f exactly, p=12·log₂(f/f_ref) — twin verifies by-ear rung frequencies are a geometric series (ratio 2) and the linear-Hz rungs are not. (sown #247)
- [exhibit] **The Banked Curve** — a track whose tilt you set by hand, hunting the one no-push speed. Two knobs (bank angle θ, speed v) over a banked oval with a rider's-eye cab; a hanging plumb-bob is the instrument — straight = balanced, swung = which way the car is about to slide (down the bank below the speed, up and out above it). You OPERATE and HUNT (vs. the Star-Flyer, which computes the equilibrium lean FOR you). CRUX: the frictionless design speed v*=√(g·r·tanθ); the bob hangs along the seat-normal ONLY at v=v*. Neg-control: θ=0 ⇒ v*=0, so any speed needs friction and the bob always swings out. With friction μ the holds-band is √(gr(tanθ−μ)/(1+μtanθ)) ≤ v ≤ √(gr(tanθ+μ)/(1−μtanθ)). Self-test: bob-angle≈0 at v*, band collapses to the point v* as μ→0, v* mass-invariant. (sown #240)
- [exhibit] **The Two-Chemical Skin** — a Gray–Scott reaction-diffusion skin whose ONE dial is the diffusion ratio D_u/D_v, that MEASURES what the strange-garden display only shows: it reports the dominant pattern WAVELENGTH λ (peak of the radially-averaged 2-D FFT of the settled u-field) live in pixels as you turn the dial. FORM: the living skin grows in front of you AND a little spectrum needle reads its stripe-spacing — a window turned into an instrument. CRUX (headless twin): λ SCALES with the ratio — halving both diffusion constants together halves λ to within one FFT bin (a code-checkable scaling, no magic constant); the FFT peak-finder round-trips a synthetic plane wave of known λ to <1 bin (prove the meter before trusting the chemistry); spots↔stripes reported as a measured (feed,kill) THRESHOLD you cross, not just named presets. Heavier (FFT) but the wavelength readout is the soul. (sown #240)





### cross
- [cross] **The Loud and the Quiet Walk — interference you HEAR** — Two speakers sing one pure tone into a room; drag a listening-ear across the floor and HEAR it swell at antinodal lines, nearly vanish at nodal lines — your two ears are the meter. Paints the SAME hyperbolic bands the silent ripple/ already draws (its exact path-difference math grep-confirmed there — REUSE it, don't re-derive); slide source-spacing d and the bands fan in lockstep with what you hear. FORM: a touchable, walkable, AUDIBLE field. CRUX: loud maxima exactly where r₁−r₂=nλ, silent at (n+½)λ, λ=c/f — the heard-loud loci ARE ripple's foci-hyperbolas; twin checks loudness peaks land on nλ. Lay a RECIPROCAL cross-link into ripple/ (the same figure, one silent, one sung). (sown #247)


### curation
- [curation] **Where the Light Folds — the Caustic room and the Rainbow are the same fold** — The estate has TWO caustic rooms that share ZERO hrefs: Optics (optics/, titled literally 'Caustic' — the abstract ray-envelope where light piles up; its own prose names 'rainbow') and The Rainbow (rainbow/, which PROVES the rainbow angle sits exactly at the stationary point dD/di=0 — the rainbow IS a caustic). optics/ is fully ORPHANED (only the up-link ../index.html — grep-confirmed). Lay a RECIPROCAL sibling link on each ('↔ the same bright fold, in the sky / on a coffee cup'), matching each room's LOCAL .back topbar look (do NOT import a foreign .sib-link CSS). FORM: pure connective taste-work, no new build, no proof owed. CRUX: none — verify ONLY both links RESOLVE (200) and RECIPROCATE. BUILD CARE: neither room has a .src.html twin → edit index.html DIRECTLY, do NOT forge. Strictly optics↔rainbow — do NOT fold in the separate rainbow↔halo arc. (sown #247)
- [curation] **One Light, Two Skins of Colour — a soap bubble and a butterfly wing make colour the same way** — the estate has TWO thin-film-interference rooms: Iridescence (iridescence/, oil-slick/soap-bubble colour from the 2nt optical-path difference) and The Bragg Stack (structural-colour/, butterfly/peacock colour from a MULTILAYER thin film — 'colour from STRUCTURE not pigment'). Both assert thin-film interference in their own prose (structural-colour's text literally reads 'iridescent') yet they share ZERO hrefs (grep-confirmed 0 each way) and each links only UP to the Hall of Mirrors. Lay a RECIPROCAL sibling link on each, matching THAT room's LOCAL .back topbar look (iridescence: mono 600 11px gold; structural-colour: 11px accent, underline-on-hover — do NOT import a foreign .sib-link CSS). FORM: pure connective taste-work, no new build. CRUX: none — the physics is already asserted in both; verify ONLY both links RESOLVE (200) and RECIPROCATE. BUILD CARE: neither room has a .src.html twin → edit index.html DIRECTLY, do NOT forge. Distinct from the surviving Sky's Two Arcs (min-deviation/single-surface caustics) — this is thin-film/path-difference. (sown #233)
- [curation] **Games That Fight Back — close the loop on the adversary family** — re-pitch, sharpened by what shipped since the original decayed: The Poisoned Bar (chomp/) bloomed and now links to ALL three siblings (nim/ · hexapawn/ · queens-walk/), but the trail is LOPSIDED — grep-confirmed chomp→all3, hexapawn→only `adversary`, nim→none, queens-walk→none. A player who beats Chomp finds the others; one who beats Nim hits a dead end. Lay the RECIPROCAL return links so each of nim/hexapawn/queens-walk carries a small '↔ other games that play to win' footer trail to its three siblings, in the established .sib-link house style (mirror Chomp's existing outbound block), completing the four-game K4. FORM: pure connective taste-work, engine untouched. CRUX: none — verify every added link RESOLVES and RECIPROCATES. BUILD CARE: all four have *.src.html twins → edit the .src.html then re-forge, never the generated twin; run forge --check after. (sown #233)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Meshing Wheels — the Chinese Remainder Theorem you mesh by hand** — WING: Numbers Room. Two brass gears of COPRIME teeth (3 & 5), each with one chalk-marked tooth; crank and the marks realign only every m·n turns — every residue-pair (a mod m, b mod n) passes the window exactly ONCE per long cycle; set two dials (a,b) and the wheels spin to the lone tooth reading the unique x mod mn, reconstructed by hand. NEG-CONTROL (the soul): swap to non-coprime wheels (4,6) — a collar clamps, realignment after only lcm=12, and pairs with a≢b (mod gcd) NEVER appear. FORM: cranked meshing wheels, the gear-wing's missing CRT dual to Cutting Gears — reconcile render style with that family. CRUX: for coprime m,n the map x↦(x mod m, x mod n) is a BIJECTION ℤ/mn→ℤ/m×ℤ/n (all mn pairs hit once); for gcd=g>1 exactly mn−mn/g pairs are unreachable, period = lcm = mn/g. (sown #247)
<!-- ✝ BLOOMED #244: The Ferris Wheel → ferris-wheel/ · after 4ec2712 -->
<!-- ✝ BLOOMED #245: The Murmuration Meter → murmuration-meter/ · after dea9779 -->
<!-- ✝ BLOOMED #246: The Breathing Star → breathing-star/ · after 8f84c52 -->
<!-- ✝ BLOOMED #248: The Transit — find the planet by the star that blinks → transit/ · after 2685002 -->
<!-- ✝ BLOOMED #249: The Equal-Area Sweep — Kepler's 2nd law you drag, not read → equal-area-sweep/ · after 0928a1e -->
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
